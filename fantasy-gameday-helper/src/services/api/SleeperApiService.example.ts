/**
 * Example usage of SleeperApiService
 * This file demonstrates how to use the Sleeper API service layer
 */

import { SleeperApiService, SleeperApiError, createSleeperApiService } from './SleeperApiService';

// Example 1: Using the default service instance
async function exampleBasicUsage() {
  try {
    // Create service with default configuration
    const service = createSleeperApiService();
    
    // Test the connection first
    const isConnected = await service.testConnection();
    console.log('API Connection:', isConnected ? 'Success' : 'Failed');
    
    // Get user information
    const user = await service.getUser('your_sleeper_username');
    console.log('User:', user);
    
    // Get user's leagues for current season
    const leagues = await service.getUserLeagues(user.user_id, '2024');
    console.log('Leagues:', leagues.length);
    
    // Get rosters for the first league
    if (leagues.length > 0) {
      const rosters = await service.getLeagueRosters(leagues[0].league_id);
      console.log('Rosters in first league:', rosters.length);
      
      // Get matchups for week 5
      const matchups = await service.getLeagueMatchups(leagues[0].league_id, 5);
      console.log('Week 5 matchups:', matchups.length);
    }
    
  } catch (error) {
    if (error instanceof SleeperApiError) {
      console.error('Sleeper API Error:', error.message);
      console.error('Status Code:', error.statusCode);
      console.error('Is Retryable:', error.isRetryable);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example 2: Using custom configuration
async function exampleCustomConfig() {
  try {
    // Create service with custom configuration
    const service = SleeperApiService.createWithConfig({
      timeout: 15000, // 15 second timeout
      maxRetries: 5,  // More retries
      retryDelay: 2000, // 2 second base delay
      rateLimit: {
        maxRequestsPerMinute: 500, // More conservative rate limiting
        requestWindow: 60000
      }
    });
    
    // Get current NFL state
    const nflState = await service.getNflState();
    console.log('Current NFL Week:', nflState.week);
    console.log('Current Season:', nflState.season);
    
  } catch (error) {
    console.error('Error getting NFL state:', error);
  }
}

// Example 3: Error handling patterns
async function exampleErrorHandling() {
  const service = createSleeperApiService();
  
  try {
    // This will throw an error for invalid input
    await service.getUser('');
  } catch (error) {
    if (error instanceof SleeperApiError) {
      console.log('Caught expected validation error:', error.message);
    }
  }
  
  try {
    // This might throw a network error
    await service.getUser('nonexistent_user_12345');
  } catch (error) {
    if (error instanceof SleeperApiError) {
      if (error.statusCode === 404) {
        console.log('User not found');
      } else if (error.isRetryable) {
        console.log('Temporary error, could retry:', error.message);
      } else {
        console.log('Permanent error:', error.message);
      }
    }
  }
}

// Example 4: Batch operations with rate limiting
async function exampleBatchOperations() {
  const service = createSleeperApiService();
  
  try {
    // Get user
    const user = await service.getUser('your_username');
    
    // Get all leagues
    const leagues = await service.getUserLeagues(user.user_id, '2024');
    
    // Get rosters for all leagues (rate limiting will be handled automatically)
    const allRosters = await Promise.all(
      leagues.map(league => service.getLeagueRosters(league.league_id))
    );
    
    console.log('Total leagues:', leagues.length);
    console.log('Total rosters across all leagues:', allRosters.flat().length);
    
  } catch (error) {
    console.error('Batch operation failed:', error);
  }
}

// Example 5: Working with league data
async function exampleLeagueAnalysis() {
  const service = createSleeperApiService();
  
  try {
    const user = await service.getUser('your_username');
    const leagues = await service.getUserLeagues(user.user_id, '2024');
    
    for (const league of leagues) {
      console.log(`\nAnalyzing league: ${league.name}`);
      
      // Get league users for display names
      const users = await service.getLeagueUsers(league.league_id);
      console.log(`League has ${users.length} users`);
      
      // Get rosters
      const rosters = await service.getLeagueRosters(league.league_id);
      
      // Find user's roster
      const userRoster = rosters.find(r => r.owner_id === user.user_id);
      if (userRoster) {
        console.log(`Your roster ID: ${userRoster.roster_id}`);
        console.log(`Your starters: ${userRoster.starters.length}`);
        console.log(`Your bench: ${userRoster.players.length - userRoster.starters.length}`);
      }
      
      // Get current week matchups
      const nflState = await service.getNflState();
      const matchups = await service.getLeagueMatchups(league.league_id, nflState.week);
      
      console.log(`Week ${nflState.week} matchups: ${matchups.length}`);
    }
    
  } catch (error) {
    console.error('League analysis failed:', error);
  }
}

// Uncomment to run examples:
// exampleBasicUsage();
// exampleCustomConfig();
// exampleErrorHandling();
// exampleBatchOperations();
// exampleLeagueAnalysis();

export {
  exampleBasicUsage,
  exampleCustomConfig,
  exampleErrorHandling,
  exampleBatchOperations,
  exampleLeagueAnalysis
};