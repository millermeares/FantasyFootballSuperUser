import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorageCacheService, CacheKeys } from './CacheService';

// Mock localStorage
const localStorageMock = (() => {
  const mockStorage = {
    store: {} as Record<string, string>,
    getItem: vi.fn((key: string) => mockStorage.store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage.store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage.store[key];
    }),
    clear: vi.fn(() => {
      mockStorage.store = {};
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(mockStorage.store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(mockStorage.store).length;
    }
  };
  return mockStorage;
})();

// Replace global localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('CacheService', () => {
  let cacheService: LocalStorageCacheService;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    // Reset localStorage mock to working state
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      localStorageMock.store[key] = value;
    });
    localStorageMock.getItem.mockImplementation((key: string) => {
      return localStorageMock.store[key] || null;
    });
    localStorageMock.removeItem.mockImplementation((key: string) => {
      delete localStorageMock.store[key];
    });
    localStorageMock.key.mockImplementation((index: number) => {
      const keys = Object.keys(localStorageMock.store);
      return keys[index] || null;
    });
    
    cacheService = new LocalStorageCacheService();
  });

  afterEach(() => {
    localStorageMock.store = {};
  });

  describe('Basic Operations', () => {
    it('should store and retrieve data correctly', () => {
      const testData = { id: '123', name: 'Test User' };
      const key = 'test_user';

      cacheService.set(key, testData);
      const retrieved = cacheService.get(key);

      expect(retrieved).toEqual(testData);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'fantasy_gameday_test_user',
        JSON.stringify(testData)
      );
    });

    it('should return null for non-existent keys', () => {
      const result = cacheService.get('non_existent_key');
      expect(result).toBeNull();
    });

    it('should check if key exists correctly', () => {
      const testData = { value: 'test' };
      const key = 'test_key';

      expect(cacheService.has(key)).toBe(false);
      
      cacheService.set(key, testData);
      expect(cacheService.has(key)).toBe(true);
    });

    it('should clear all cache entries with prefix', () => {
      cacheService.set('key1', { data: 'test1' });
      cacheService.set('key2', { data: 'test2' });
      
      // Add non-prefixed key to localStorage directly
      localStorageMock.setItem('other_app_key', 'should_remain');

      cacheService.clear();

      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(false);
      expect(localStorageMock.getItem('other_app_key')).toBe('should_remain');
    });
  });

  describe('Cache Keys', () => {
    it('should generate correct cache keys for different data types', () => {
      expect(CacheKeys.USER('testuser')).toBe('sleeper_user_testuser');
      expect(CacheKeys.LEAGUES('123', '2024')).toBe('sleeper_leagues_123_2024');
      expect(CacheKeys.ROSTERS('league123')).toBe('sleeper_rosters_league123');
      expect(CacheKeys.MATCHUPS('league123', 5)).toBe('sleeper_matchups_league123_5');
      expect(CacheKeys.USER_PREFS).toBe('sleeper_user_preferences');
    });

    it('should work with cache keys in real scenarios', () => {
      const userData = { user_id: '123', username: 'testuser' };
      const leagueData = [{ league_id: 'abc', name: 'Test League' }];

      const userKey = CacheKeys.USER('testuser');
      const leagueKey = CacheKeys.LEAGUES('123', '2024');

      cacheService.set(userKey, userData);
      cacheService.set(leagueKey, leagueData);

      expect(cacheService.get(userKey)).toEqual(userData);
      expect(cacheService.get(leagueKey)).toEqual(leagueData);
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parse errors gracefully', () => {
      // Manually set invalid JSON in localStorage
      localStorageMock.setItem('fantasy_gameday_corrupt_key', 'invalid json {');

      const result = cacheService.get('corrupt_key');
      expect(result).toBeNull();
      
      // Should remove the corrupted item
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('fantasy_gameday_corrupt_key');
    });

    it('should handle localStorage unavailability', () => {
      // Mock localStorage to throw errors
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      // Should not throw errors
      expect(() => {
        cacheService.set('test', { data: 'test' });
        cacheService.get('test');
        cacheService.has('test');
        cacheService.clear();
      }).not.toThrow();
    });

    it('should handle quota exceeded error', () => {
      const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
      
      // Reset the mock call count
      vi.clearAllMocks();
      
      // Mock setItem to throw quota error on first call, succeed on second
      let callCount = 0;
      localStorageMock.setItem.mockImplementation((key: string, value: string) => {
        callCount++;
        if (callCount === 1) {
          throw quotaError;
        }
        localStorageMock.store[key] = value;
      });

      const testData = { large: 'data' };
      
      // Should not throw and should attempt to clear cache and retry
      expect(() => {
        cacheService.set('test', testData);
      }).not.toThrow();

      // Should have called setItem twice (initial attempt + retry)
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache Statistics', () => {
    it('should provide accurate cache statistics', () => {
      cacheService.set('key1', { data: 'small' });
      cacheService.set('key2', { data: 'larger data string' });

      const stats = cacheService.getStats();
      
      expect(stats.totalKeys).toBe(2);
      expect(stats.cacheSize).toBeGreaterThan(0);
      expect(stats.isAvailable).toBe(true);
    });

    it('should handle stats when localStorage is unavailable', () => {
      // Create a cache service that will detect localStorage as unavailable
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      const unavailableCacheService = new LocalStorageCacheService();
      
      const stats = unavailableCacheService.getStats();
      
      expect(stats.totalKeys).toBe(0);
      expect(stats.cacheSize).toBe(0);
      expect(stats.isAvailable).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for different data types', () => {
      interface UserData {
        id: string;
        name: string;
      }

      interface LeagueData {
        league_id: string;
        name: string;
        total_rosters: number;
      }

      const userData: UserData = { id: '123', name: 'Test User' };
      const leagueData: LeagueData = { league_id: 'abc', name: 'Test League', total_rosters: 10 };

      cacheService.set<UserData>('user', userData);
      cacheService.set<LeagueData>('league', leagueData);

      const retrievedUser = cacheService.get<UserData>('user');
      const retrievedLeague = cacheService.get<LeagueData>('league');

      expect(retrievedUser).toEqual(userData);
      expect(retrievedLeague).toEqual(leagueData);
    });
  });
});