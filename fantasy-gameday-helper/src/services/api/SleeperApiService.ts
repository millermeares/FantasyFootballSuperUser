import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { 
  SleeperUser, 
  SleeperLeague, 
  SleeperRoster, 
  SleeperMatchup 
} from '../../types/sleeper';

/**
 * Configuration for the Sleeper API service
 */
interface SleeperApiConfig {
  baseURL: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  rateLimit: {
    maxRequestsPerMinute: number;
    requestWindow: number;
  };
}

/**
 * Error types for Sleeper API operations
 */
export class SleeperApiError extends Error {
  public statusCode?: number;
  public isRetryable: boolean;

  constructor(
    message: string,
    statusCode?: number,
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'SleeperApiError';
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
  }
}

/**
 * Rate limiter to respect Sleeper API limits
 */
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequestsPerMinute: number, windowMs: number = 60000) {
    this.maxRequests = maxRequestsPerMinute;
    this.windowMs = windowMs;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    
    // Remove requests older than the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // If we're at the limit, wait until the oldest request expires
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest) + 100; // Add 100ms buffer
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // Record this request
    this.requests.push(now);
  }
}

/**
 * Service for interacting with the Sleeper API
 * Implements proper error handling, rate limiting, and retry logic
 */
export class SleeperApiService {
  private static instance: SleeperApiService;
  private axiosInstance: AxiosInstance;
  private config: SleeperApiConfig;
  private rateLimiter: RateLimiter;

  private constructor(config?: Partial<SleeperApiConfig>) {
    this.config = {
      baseURL: 'https://api.sleeper.app/v1',
      timeout: 10000, // 10 seconds
      maxRetries: 3,
      retryDelay: 1000, // 1 second base delay
      rateLimit: {
        maxRequestsPerMinute: 900, // Stay well under 1000/minute limit
        requestWindow: 60000, // 1 minute
      },
      ...config,
    };

    this.rateLimiter = new RateLimiter(
      this.config.rateLimit.maxRequestsPerMinute,
      this.config.rateLimit.requestWindow
    );

    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Fantasy-Gameday-Helper/1.0',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Get singleton instance of SleeperApiService
   */
  public static getInstance(config?: Partial<SleeperApiConfig>): SleeperApiService {
    if (!SleeperApiService.instance) {
      SleeperApiService.instance = new SleeperApiService(config);
    }
    return SleeperApiService.instance;
  }

  /**
   * Setup axios interceptors for request/response handling
   */
  private setupInterceptors(): void {
    // Request interceptor for rate limiting
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        await this.rateLimiter.waitIfNeeded();
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const statusCode = error.response?.status;
        const isRetryable = this.isRetryableError(error);
        
        let message = 'Unknown API error occurred';
        
        if (error.code === 'ECONNABORTED') {
          message = 'Request timeout - please try again';
        } else if (statusCode === 429) {
          message = 'Rate limit exceeded - please wait and try again';
        } else if (statusCode === 404) {
          message = 'Resource not found';
        } else if (statusCode && statusCode >= 500) {
          message = 'Sleeper API server error - please try again later';
        } else if (error.message) {
          message = error.message;
        }

        throw new SleeperApiError(message, statusCode, isRetryable);
      }
    );
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: AxiosError): boolean {
    const statusCode = error.response?.status;
    
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      !statusCode || // Network error
      error.code === 'ECONNABORTED' || // Timeout
      statusCode === 429 || // Rate limit
      (statusCode >= 500 && statusCode < 600) // Server errors
    );
  }

  /**
   * Execute a request with retry logic
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retries: number = this.config.maxRetries
  ): Promise<T> {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error) {
      if (error instanceof SleeperApiError && error.isRetryable && retries > 0) {
        // Exponential backoff with jitter
        const delay = this.config.retryDelay * Math.pow(2, this.config.maxRetries - retries);
        const jitter = Math.random() * 1000; // Add up to 1 second of jitter
        
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
        return this.executeWithRetry(requestFn, retries - 1);
      }
      
      throw error;
    }
  }

  /**
   * Get user information by username or user ID
   * @param identifier - Sleeper username or user ID
   * @returns Promise resolving to SleeperUser object
   */
  async getUser(identifier: string): Promise<SleeperUser> {
    if (!identifier || identifier.trim() === '') {
      throw new SleeperApiError('User identifier cannot be empty', 400, false);
    }

    return this.executeWithRetry(() =>
      this.axiosInstance.get<SleeperUser>(`/user/${encodeURIComponent(identifier.trim())}`)
    );
  }

  /**
   * Get user's leagues for a specific season
   * @param userId - Sleeper user ID
   * @param season - NFL season year (e.g., "2024")
   * @returns Promise resolving to array of SleeperLeague objects
   */
  async getUserLeagues(userId: string, season: string): Promise<SleeperLeague[]> {
    if (!userId || userId.trim() === '') {
      throw new SleeperApiError('User ID cannot be empty', 400, false);
    }
    
    if (!season || season.trim() === '') {
      throw new SleeperApiError('Season cannot be empty', 400, false);
    }

    return this.executeWithRetry(() =>
      this.axiosInstance.get<SleeperLeague[]>(
        `/user/${encodeURIComponent(userId.trim())}/leagues/nfl/${encodeURIComponent(season.trim())}`
      )
    );
  }

  /**
   * Get rosters for a specific league
   * @param leagueId - Sleeper league ID
   * @returns Promise resolving to array of SleeperRoster objects
   */
  async getLeagueRosters(leagueId: string): Promise<SleeperRoster[]> {
    if (!leagueId || leagueId.trim() === '') {
      throw new SleeperApiError('League ID cannot be empty', 400, false);
    }

    return this.executeWithRetry(() =>
      this.axiosInstance.get<SleeperRoster[]>(`/league/${encodeURIComponent(leagueId.trim())}/rosters`)
    );
  }

  /**
   * Get matchups for a specific league and week
   * @param leagueId - Sleeper league ID
   * @param week - NFL week number (1-18)
   * @returns Promise resolving to array of SleeperMatchup objects
   */
  async getLeagueMatchups(leagueId: string, week: number): Promise<SleeperMatchup[]> {
    if (!leagueId || leagueId.trim() === '') {
      throw new SleeperApiError('League ID cannot be empty', 400, false);
    }
    
    if (!Number.isInteger(week) || week < 1 || week > 18) {
      throw new SleeperApiError('Week must be an integer between 1 and 18', 400, false);
    }

    return this.executeWithRetry(() =>
      this.axiosInstance.get<SleeperMatchup[]>(
        `/league/${encodeURIComponent(leagueId.trim())}/matchups/${week}`
      )
    );
  }

  /**
   * Get users in a specific league (for display names)
   * @param leagueId - Sleeper league ID
   * @returns Promise resolving to array of SleeperUser objects
   */
  async getLeagueUsers(leagueId: string): Promise<SleeperUser[]> {
    if (!leagueId || leagueId.trim() === '') {
      throw new SleeperApiError('League ID cannot be empty', 400, false);
    }

    return this.executeWithRetry(() =>
      this.axiosInstance.get<SleeperUser[]>(`/league/${encodeURIComponent(leagueId.trim())}/users`)
    );
  }

  /**
   * Get current NFL state (for current week detection)
   * @returns Promise resolving to NFL state object
   */
  async getNflState(): Promise<{ week: number; season: string; season_type: string }> {
    return this.executeWithRetry(() =>
      this.axiosInstance.get<{ week: number; season: string; season_type: string }>('/state/nfl')
    );
  }

  /**
   * Test the API connection
   * @returns Promise resolving to true if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getNflState();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): SleeperApiConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (creates new instance)
   */
  static createWithConfig(config: Partial<SleeperApiConfig>): SleeperApiService {
    return new SleeperApiService(config);
  }
}

// Export a factory function for creating instances
export const createSleeperApiService = (config?: Partial<SleeperApiConfig>) => 
  SleeperApiService.getInstance(config);

// Export a default instance for convenience (lazy initialization)
let defaultInstance: SleeperApiService | null = null;
export const getSleeperApiService = () => {
  if (!defaultInstance) {
    defaultInstance = SleeperApiService.getInstance();
  }
  return defaultInstance;
};