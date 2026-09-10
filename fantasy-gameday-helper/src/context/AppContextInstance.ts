import { createContext } from 'react';
import type React from 'react';
import type {
  AppState,
  AppAction,
  GamedayData,
  ExposureData,
  PlayerAllegiance,
  PlayerExposure,
  UserTeam,
} from '../types';
import type { SleeperUser } from '../types/sleeper';

// Context type
export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Action creators for convenience
  setUser: (user: SleeperUser) => void;
  clearUser: () => void;
  setWeek: (week: number) => void;
  setUserTeams: (teams: UserTeam[]) => void;
  toggleTeam: (leagueId: string) => void;
  selectAllTeams: () => void;
  deselectAllTeams: () => void;
  setGamedayData: (data: GamedayData) => void;
  setExposureData: (data: ExposureData) => void;
  setActiveTab: (tab: 'gameday' | 'exposure') => void;
  setPlayerFilter: (filter: string) => void;
  setLoading: (loading: boolean) => void;
  setExposureLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clearError: () => void;
  openPopup: (player: PlayerAllegiance | PlayerExposure, leagues: string[]) => void;
  closePopup: () => void;
}

// Create context
export const AppContext = createContext<AppContextType | undefined>(undefined);
