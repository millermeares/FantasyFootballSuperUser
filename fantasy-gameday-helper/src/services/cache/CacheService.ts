/**
 * Cache service for managing localStorage operations with error handling
 * Implements indefinite caching strategy for Sleeper API responses
 */

export interface CacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T): void;
  clear(): void;
  has(key: string): boolean;
}

/**
 * Cache key generation strategies for different data types
 */
export const CacheKeys = {
  USER: (identifier: string) => `sleeper_user_${identifier}`,
  LEAGUES: (userId: string, season: string) => `sleeper_leagues_${userId}_${season}`,
  ROSTERS: (leagueId: string) => `sleeper_rosters_${leagueId}`,
  MATCHUPS: (leagueId: string, week: number) => `sleeper_matchups_${leagueId}_${week}`,
  USER_PREFS: 'sleeper_user_preferences'
} as const;

/**
 * Error types for cache operations
 */
export const CacheError = {
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  PARSE_ERROR: 'PARSE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

/**
 * Cache service implementation using localStorage with comprehensive error handling
 */
class LocalStorageCacheService implements CacheService {
  private readonly keyPrefix = 'fantasy_gameday_';
  private isStorageAvailable: boolean;

  constructor() {
    this.isStorageAvailable = this.checkStorageAvailability();
  }

  /**
   * Check if localStorage is available and functional
   */
  private checkStorageAvailability(): boolean {
    try {
      const testKey = `${this.keyPrefix}test`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('localStorage is not available:', error);
      return false;
    }
  }

  /**
   * Generate full cache key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Retrieve data from cache
   */
  get<T>(key: string): T | null {
    if (!this.isStorageAvailable) {
      return null;
    }

    try {
      const fullKey = this.getFullKey(key);
      const item = localStorage.getItem(fullKey);
      
      if (item === null) {
        return null;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Failed to retrieve cache item for key "${key}":`, error);
      
      // If parsing fails, remove the corrupted item
      try {
        localStorage.removeItem(this.getFullKey(key));
      } catch (removeError) {
        console.warn(`Failed to remove corrupted cache item for key "${key}":`, removeError);
      }
      
      return null;
    }
  }

  /**
   * Store data in cache with error handling
   */
  set<T>(key: string, data: T): void {
    if (!this.isStorageAvailable) {
      console.warn('Cannot cache data: localStorage is not available');
      return;
    }

    try {
      const fullKey = this.getFullKey(key);
      const serializedData = JSON.stringify(data);
      localStorage.setItem(fullKey, serializedData);
    } catch (error) {
      console.warn(`Failed to cache data for key "${key}":`, error);
      
      // Handle quota exceeded error by attempting to clear old cache
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('Cache quota exceeded, attempting to clear cache and retry');
        this.handleQuotaExceeded(key, data);
      }
    }
  }

  /**
   * Handle quota exceeded by clearing cache and retrying
   */
  private handleQuotaExceeded<T>(key: string, data: T): void {
    try {
      // Clear all cache entries
      this.clear();
      
      // Retry the set operation
      const fullKey = this.getFullKey(key);
      const serializedData = JSON.stringify(data);
      localStorage.setItem(fullKey, serializedData);
      
      console.info('Successfully cached data after clearing cache');
    } catch (retryError) {
      console.error('Failed to cache data even after clearing cache:', retryError);
    }
  }

  /**
   * Check if a key exists in cache
   */
  has(key: string): boolean {
    if (!this.isStorageAvailable) {
      return false;
    }

    try {
      const fullKey = this.getFullKey(key);
      return localStorage.getItem(fullKey) !== null;
    } catch (error) {
      console.warn(`Failed to check cache existence for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    if (!this.isStorageAvailable) {
      console.warn('Cannot clear cache: localStorage is not available');
      return;
    }

    try {
      // Get all keys and remove only our prefixed keys
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove cache key "${key}":`, error);
        }
      });

      console.info(`Cleared ${keysToRemove.length} cache entries`);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): { totalKeys: number; cacheSize: number; isAvailable: boolean } {
    if (!this.isStorageAvailable) {
      return { totalKeys: 0, cacheSize: 0, isAvailable: false };
    }

    try {
      let totalKeys = 0;
      let cacheSize = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          totalKeys++;
          const item = localStorage.getItem(key);
          if (item) {
            cacheSize += item.length;
          }
        }
      }

      return { totalKeys, cacheSize, isAvailable: true };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { totalKeys: 0, cacheSize: 0, isAvailable: false };
    }
  }
}

// Export singleton instance
export const cacheService = new LocalStorageCacheService();

// Export class for testing
export { LocalStorageCacheService };