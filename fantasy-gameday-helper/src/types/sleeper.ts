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
  owner_id: string;
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

export interface SleeperPlayer {
  player_id: string;
  full_name: string;
  position: string;
  team: string;
}

export interface SleeperPlayerData {
  [playerId: string]: {
    player_id: string;
    full_name: string;
    position: string;
    team: string | null;
    first_name: string;
    last_name: string;
    active: boolean;
    fantasy_positions: string[];
    // ... other fields as needed
  };
}
