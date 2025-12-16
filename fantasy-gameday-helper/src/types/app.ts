// Application Data Models
export interface UserTeam {
  leagueId: string;
  leagueName: string;
  rosterId: number;
  isSelected: boolean;
}

// Input data structure for player analysis
export interface AnalysisInput {
  userTeams: UserTeam[];
  leagues: import('./sleeper').SleeperLeague[];
  rosters: Map<string, import('./sleeper').SleeperRoster[]>; // leagueId -> rosters
  matchups: Map<string, import('./sleeper').SleeperMatchup[]>; // leagueId -> matchups
  userId: string;
}

export interface PlayerAllegiance {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  count: number;
  leagues: string[]; // League names where this player appears
}

export interface PlayerExposure {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  exposurePercentage: number; // Percentage of selected teams containing this player
  teamCount: number; // Number of teams containing this player
  totalTeams: number; // Total number of selected teams
  leagues: string[]; // League names where this player appears
}

export interface ExposureData {
  exposureReport: PlayerExposure[];
  totalSelectedTeams: number;
}

export interface GamedayData {
  cheeringFor: PlayerAllegiance[];
  cheeringAgainst: PlayerAllegiance[];
  userTeams: UserTeam[];
}

// State Management
export interface AppState {
  user: import('./sleeper').SleeperUser | null;
  selectedWeek: number;
  userTeams: UserTeam[];
  gamedayData: GamedayData | null;
  exposureData: ExposureData | null;
  activeTab: 'gameday' | 'exposure';
  loading: boolean;
  exposureLoading: boolean; // Loading state specifically for exposure recalculations
  error: string | null;
  popupData: {
    isOpen: boolean;
    player: PlayerAllegiance | PlayerExposure | null;
    leagues: string[];
  };
}

export type AppAction =
  | { type: 'SET_USER'; payload: import('./sleeper').SleeperUser }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_WEEK'; payload: number }
  | { type: 'SET_USER_TEAMS'; payload: UserTeam[] }
  | { type: 'TOGGLE_TEAM'; payload: string } // leagueId
  | { type: 'SELECT_ALL_TEAMS' }
  | { type: 'DESELECT_ALL_TEAMS' }
  | { type: 'SET_GAMEDAY_DATA'; payload: GamedayData }
  | { type: 'SET_EXPOSURE_DATA'; payload: ExposureData }
  | { type: 'SET_ACTIVE_TAB'; payload: 'gameday' | 'exposure' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_EXPOSURE_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | {
      type: 'OPEN_POPUP';
      payload: { player: PlayerAllegiance | PlayerExposure; leagues: string[] };
    }
  | { type: 'CLOSE_POPUP' };
