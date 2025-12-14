/**
 * Example usage of the CacheService
 * This file demonstrates how to use the cache service for different data types
 */

import { cacheService, CacheKeys } from './CacheService';

// Example data types that would be cached
interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
}

interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  total_rosters: number;
}

/**
 * Example: Caching user data
 */
export function cacheUserExample() {
  const userData: SleeperUser = {
    user_id: '123456789',
    username: 'fantasyfan2024',
    display_name: 'Fantasy Fan'
  };

  // Cache the user data
  const userKey = CacheKeys.USER(userData.username);
  cacheService.set(userKey, userData);

  // Retrieve the user data
  const cachedUser = cacheService.get<SleeperUser>(userKey);
  console.log('Cached user:', cachedUser);

  // Check if user exists in cache
  const userExists = cacheService.has(userKey);
  console.log('User exists in cache:', userExists);
}

/**
 * Example: Caching league data
 */
export function cacheLeagueExample() {
  const leagueData: SleeperLeague[] = [
    {
      league_id: 'league_abc123',
      name: 'Friends League',
      season: '2024',
      total_rosters: 12
    },
    {
      league_id: 'league_def456',
      name: 'Work League',
      season: '2024',
      total_rosters: 10
    }
  ];

  // Cache the league data
  const leagueKey = CacheKeys.LEAGUES('123456789', '2024');
  cacheService.set(leagueKey, leagueData);

  // Retrieve the league data
  const cachedLeagues = cacheService.get<SleeperLeague[]>(leagueKey);
  console.log('Cached leagues:', cachedLeagues);
}

/**
 * Example: Caching matchup data for a specific week
 */
export function cacheMatchupExample() {
  const matchupData = [
    {
      roster_id: 1,
      matchup_id: 1,
      starters: ['player1', 'player2', 'player3'],
      points: 125.5
    },
    {
      roster_id: 2,
      matchup_id: 1,
      starters: ['player4', 'player5', 'player6'],
      points: 118.2
    }
  ];

  // Cache matchup data for week 5
  const matchupKey = CacheKeys.MATCHUPS('league_abc123', 5);
  cacheService.set(matchupKey, matchupData);

  // Retrieve matchup data
  const cachedMatchups = cacheService.get(matchupKey);
  console.log('Cached matchups for week 5:', cachedMatchups);
}

/**
 * Example: Caching user preferences
 */
export function cacheUserPreferencesExample() {
  const userPrefs = {
    selectedTeams: ['league_abc123', 'league_def456'],
    defaultWeek: 5,
    theme: 'dark'
  };

  // Cache user preferences
  cacheService.set(CacheKeys.USER_PREFS, userPrefs);

  // Retrieve user preferences
  const cachedPrefs = cacheService.get(CacheKeys.USER_PREFS);
  console.log('Cached preferences:', cachedPrefs);
}

/**
 * Example: Cache management operations
 */
export function cacheManagementExample() {
  // Get cache statistics
  const stats = cacheService.getStats();
  console.log('Cache stats:', stats);

  // Clear all cache (useful for debugging or user logout)
  // cacheService.clear();
  // console.log('Cache cleared');
}

/**
 * Example: Error handling with cache operations
 */
export function cacheErrorHandlingExample() {
  try {
    // This will work normally
    cacheService.set('test_key', { data: 'test' });
    
    // This will return null if key doesn't exist
    const nonExistent = cacheService.get('non_existent_key');
    console.log('Non-existent key result:', nonExistent); // null
    
    // Cache service handles localStorage errors gracefully
    // If localStorage is unavailable, operations will fail silently
    // and log warnings to console
    
  } catch (error) {
    console.error('Cache operation failed:', error);
  }
}

/**
 * Example: Using cache in an API service pattern
 */
export async function apiWithCacheExample(userId: string, season: string) {
  const cacheKey = CacheKeys.LEAGUES(userId, season);
  
  // Try to get data from cache first
  let leagues = cacheService.get<SleeperLeague[]>(cacheKey);
  
  if (leagues) {
    console.log('Using cached leagues data');
    return leagues;
  }
  
  // If not in cache, fetch from API
  console.log('Fetching leagues from API');
  try {
    // Simulate API call
    const response = await fetch(`/api/user/${userId}/leagues/${season}`);
    leagues = await response.json();
    
    // Cache the response for future use
    cacheService.set(cacheKey, leagues);
    
    return leagues;
  } catch (error) {
    console.error('API call failed:', error);
    return [];
  }
}

// Run examples (uncomment to test)
// cacheUserExample();
// cacheLeagueExample();
// cacheMatchupExample();
// cacheUserPreferencesExample();
// cacheManagementExample();
// cacheErrorHandlingExample();