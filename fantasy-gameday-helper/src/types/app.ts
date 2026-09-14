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

/**
 * A single player rolled up across every selected team: how often you start
 * them, how often you face them, and both the sum and the net of the two.
 */
export interface PlayerAggregate {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  forCount: number; // Teams where the player is in your starting lineup
  againstCount: number; // Teams where the player is in your opponent's lineup
  totalCount: number; // forCount + againstCount - how much this player matters to you
  netCount: number; // forCount - againstCount
  forLeagues: string[]; // League names where you start this player
  againstLeagues: string[]; // League names where you face this player
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

/**
 * A group of games that kick off together - what fantasy players call a slate
 * ("Sunday early", "Sunday night", ...). Inferred from kickoff times rather
 * than defined up front, so odd windows (London, Thanksgiving, a Wednesday
 * opener) come through on their own without any schedule knowledge baked in.
 */
export interface Slate {
  /** Stable within a week, derived from the slate's first kickoff. */
  id: string;
  /** Day and kickoff in the viewer's timezone, e.g. "Sun 1:00 PM". */
  label: string;
  /** Epoch milliseconds of the earliest kickoff in the slate. */
  startTime: number;
  /** Every distinct kickoff in the slate, ascending. Usually one, sometimes two. */
  kickoffTimes: number[];
  gameCount: number;
  /** NFL team abbreviations playing in this slate. */
  teams: string[];
}

export interface SlateData {
  slates: Slate[];
  /** NFL team abbreviation -> the slate its game belongs to. */
  teamSlateIds: Record<string, string>;
}

export interface GamedayData {
  cheeringFor: PlayerAllegiance[];
  cheeringAgainst: PlayerAllegiance[];
  userTeams: UserTeam[];
}

/**
 * Which side of a player's allegiance the league popup is describing.
 * An aggregate row can be opened from either its "for" or its "against" count,
 * and each side has its own league list. Rows with a single count use 'total'.
 */
export type PopupContext = 'for' | 'against' | 'total';

export type PopupPlayer = PlayerAllegiance | PlayerExposure | PlayerAggregate;

// State Management
export interface AppState {
  user: import('./sleeper').SleeperUser | null;
  selectedWeek: number;
  userTeams: UserTeam[];
  gamedayData: GamedayData | null;
  exposureData: ExposureData | null;
  activeTab: 'gameday' | 'exposure';
  playerFilter: string;
  /** Kickoff groupings for the selected week; null when they could not be loaded. */
  slateData: SlateData | null;
  /**
   * Slates the view is narrowed to. Empty means no narrowing at all - every
   * slate is shown - which is also where each new week starts.
   */
  selectedSlateIds: string[];
  loading: boolean;
  exposureLoading: boolean; // Loading state specifically for exposure recalculations
  error: string | null;
  popupData: {
    isOpen: boolean;
    player: PopupPlayer | null;
    leagues: string[];
    context: PopupContext;
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
  | { type: 'SET_PLAYER_FILTER'; payload: string }
  | { type: 'SET_SLATE_DATA'; payload: SlateData | null }
  | { type: 'TOGGLE_SLATE'; payload: string } // slate id
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_EXPOSURE_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | {
      type: 'OPEN_POPUP';
      payload: { player: PopupPlayer; leagues: string[]; context: PopupContext };
    }
  | { type: 'CLOSE_POPUP' };
