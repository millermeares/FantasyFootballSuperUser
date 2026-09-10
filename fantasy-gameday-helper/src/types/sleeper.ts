// Sleeper API Data Models
export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
}

export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  status: 'pre_draft' | 'drafting' | 'in_season' | 'complete';
  sport: 'nfl';
  settings: {
    playoff_week_start?: number;
    // ... other league settings
  };
  total_rosters: number;
}

export interface SleeperRoster {
  roster_id: number;
  /** Primary manager. Null on orphan teams that no one has claimed. */
  owner_id: string | null;
  /** Additional managers who share this team. Absent or null when there are none. */
  co_owners?: string[] | null;
  players: string[];
  starters: string[];
}

export interface SleeperMatchup {
  roster_id: number;
  matchup_id: number;
  starters: string[];
  players: string[];
  points: number;
  custom_points: number | null;
}

/**
 * One NFL game from Sleeper's scores feed. Populated for future weeks, so it is
 * the source of kickoff times before any game has been played.
 */
export interface SleeperGameScore {
  game_id: string;
  week: number;
  status: string;
  /** Kickoff as epoch milliseconds. Null on games Sleeper has not scheduled yet. */
  start_time: number | null;
  metadata?: {
    home_team?: string | null;
    away_team?: string | null;
    /** Kickoff as an ISO timestamp; `start_time` is preferred. */
    date_time?: string | null;
    [key: string]: unknown;
  };
}

export interface SleeperPlayer {
  player_id: string;
  full_name: string;
  position: string;
  team: string;
}

export interface SleeperPlayerEntry {
  player_id: string;
  full_name?: string | null;
  position?: string | null;
  team?: string | null;
  first_name?: string;
  last_name?: string;
  active?: boolean;
  fantasy_positions?: string[] | null;
  [key: string]: unknown;
}

export interface SleeperPlayerData {
  [playerId: string]: SleeperPlayerEntry;
}
