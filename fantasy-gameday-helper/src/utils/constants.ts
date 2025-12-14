// Sleeper API Configuration
export const SLEEPER_API_BASE = 'https://api.sleeper.app/v1';

export const SLEEPER_ENDPOINTS = {
  // Get user by username or user_id
  user: (identifier: string) => `${SLEEPER_API_BASE}/user/${identifier}`,

  // Get user's leagues for a season
  userLeagues: (userId: string, season: string) =>
    `${SLEEPER_API_BASE}/user/${userId}/leagues/nfl/${season}`,

  // Get rosters for a league
  leagueRosters: (leagueId: string) =>
    `${SLEEPER_API_BASE}/league/${leagueId}/rosters`,

  // Get matchups for a specific week
  leagueMatchups: (leagueId: string, week: number) =>
    `${SLEEPER_API_BASE}/league/${leagueId}/matchups/${week}`,

  // Get users in a league (for display names)
  leagueUsers: (leagueId: string) =>
    `${SLEEPER_API_BASE}/league/${leagueId}/users`,

  // Get current NFL state (for current week detection)
  nflState: () => `${SLEEPER_API_BASE}/state/nfl`,
};

// Cache Key Strategy
export const CACHE_KEYS = {
  USER: (identifier: string) => `sleeper_user_${identifier}`,
  LEAGUES: (userId: string, season: string) =>
    `sleeper_leagues_${userId}_${season}`,
  ROSTERS: (leagueId: string) => `sleeper_rosters_${leagueId}`,
  MATCHUPS: (leagueId: string, week: number) =>
    `sleeper_matchups_${leagueId}_${week}`,
  USER_PREFS: 'sleeper_user_preferences',
};

// App Configuration
export const APP_CONFIG = {
  API_TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 3,
  CACHE_VERSION: '1.0.0',
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  CURRENT_SEASON: '2024',
};
