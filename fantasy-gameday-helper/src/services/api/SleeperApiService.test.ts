import { describe, it, expect } from 'vitest';
import { SleeperApiService, SleeperApiError } from './SleeperApiService';

describe('SleeperApiService', () => {
  describe('Input validation', () => {
    let service: SleeperApiService;

    beforeAll(() => {
      service = SleeperApiService.createWithConfig({
        timeout: 5000,
        maxRetries: 1,
        retryDelay: 100,
        rateLimit: {
          maxRequestsPerMinute: 10,
          requestWindow: 1000
        }
      });
    });

    describe('getUser', () => {
      it('should throw error for empty identifier', async () => {
        await expect(service.getUser('')).rejects.toThrow(SleeperApiError);
        await expect(service.getUser('   ')).rejects.toThrow('User identifier cannot be empty');
      });
    });

    describe('getUserLeagues', () => {
      it('should throw error for empty userId', async () => {
        await expect(service.getUserLeagues('', '2024')).rejects.toThrow('User ID cannot be empty');
      });

      it('should throw error for empty season', async () => {
        await expect(service.getUserLeagues('123', '')).rejects.toThrow('Season cannot be empty');
      });
    });

    describe('getLeagueRosters', () => {
      it('should throw error for empty leagueId', async () => {
        await expect(service.getLeagueRosters('')).rejects.toThrow('League ID cannot be empty');
      });
    });

    describe('getLeagueMatchups', () => {
      it('should throw error for invalid week number', async () => {
        await expect(service.getLeagueMatchups('league123', 0)).rejects.toThrow('Week must be an integer between 1 and 18');
        await expect(service.getLeagueMatchups('league123', 19)).rejects.toThrow('Week must be an integer between 1 and 18');
        await expect(service.getLeagueMatchups('league123', 1.5)).rejects.toThrow('Week must be an integer between 1 and 18');
      });

      it('should throw error for empty leagueId', async () => {
        await expect(service.getLeagueMatchups('', 5)).rejects.toThrow('League ID cannot be empty');
      });
    });

    describe('getLeagueUsers', () => {
      it('should throw error for empty leagueId', async () => {
        await expect(service.getLeagueUsers('')).rejects.toThrow('League ID cannot be empty');
      });
    });
  });

  describe('Configuration', () => {
    it('should return current configuration', () => {
      const service = SleeperApiService.createWithConfig({
        timeout: 15000,
        maxRetries: 5
      });
      
      const config = service.getConfig();
      
      expect(config).toHaveProperty('baseURL', 'https://api.sleeper.app/v1');
      expect(config).toHaveProperty('timeout', 15000);
      expect(config).toHaveProperty('maxRetries', 5);
      expect(config).toHaveProperty('retryDelay');
      expect(config).toHaveProperty('rateLimit');
    });

    it('should use default configuration when none provided', () => {
      const service = SleeperApiService.createWithConfig({});
      const config = service.getConfig();
      
      expect(config.baseURL).toBe('https://api.sleeper.app/v1');
      expect(config.timeout).toBe(10000);
      expect(config.maxRetries).toBe(3);
      expect(config.retryDelay).toBe(1000);
      expect(config.rateLimit.maxRequestsPerMinute).toBe(900);
    });
  });

  describe('SleeperApiError', () => {
    it('should create error with correct properties', () => {
      const error = new SleeperApiError('Test error', 404, true);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('SleeperApiError');
    });

    it('should default isRetryable to false', () => {
      const error = new SleeperApiError('Test error', 400);
      
      expect(error.isRetryable).toBe(false);
    });
  });
});