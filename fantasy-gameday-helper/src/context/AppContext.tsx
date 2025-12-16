import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction, GamedayData, ExposureData, PlayerAllegiance, PlayerExposure, UserTeam } from '../types';
import type { SleeperUser } from '../types/sleeper';

// Initial state
const initialState: AppState = {
  user: null,
  selectedWeek: 1, // Will be updated to current week when available
  userTeams: [],
  gamedayData: null,
  exposureData: null,
  activeTab: 'gameday',
  loading: false,
  exposureLoading: false,
  error: null,
  popupData: {
    isOpen: false,
    player: null,
    leagues: [],
  },
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        error: null,
      };

    case 'CLEAR_USER':
      return {
        ...state,
        user: null,
        userTeams: [],
        gamedayData: null,
        exposureData: null,
        exposureLoading: false,
        error: null,
        popupData: {
          isOpen: false,
          player: null,
          leagues: [],
        },
      };

    case 'SET_WEEK':
      return {
        ...state,
        selectedWeek: action.payload,
      };

    case 'SET_USER_TEAMS':
      return {
        ...state,
        userTeams: action.payload,
      };

    case 'TOGGLE_TEAM': {
      const updatedTeams = state.userTeams.map((team) =>
        team.leagueId === action.payload
          ? { ...team, isSelected: !team.isSelected }
          : team
      );
      return {
        ...state,
        userTeams: updatedTeams,
      };
    }

    case 'SELECT_ALL_TEAMS': {
      const updatedTeams = state.userTeams.map((team) => ({
        ...team,
        isSelected: true,
      }));
      return {
        ...state,
        userTeams: updatedTeams,
      };
    }

    case 'DESELECT_ALL_TEAMS': {
      const updatedTeams = state.userTeams.map((team) => ({
        ...team,
        isSelected: false,
      }));
      return {
        ...state,
        userTeams: updatedTeams,
      };
    }

    case 'SET_GAMEDAY_DATA':
      return {
        ...state,
        gamedayData: action.payload,
        loading: false,
        error: null,
      };

    case 'SET_EXPOSURE_DATA':
      return {
        ...state,
        exposureData: action.payload,
        exposureLoading: false,
        error: null,
      };

    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_EXPOSURE_LOADING':
      return {
        ...state,
        exposureLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'OPEN_POPUP':
      return {
        ...state,
        popupData: {
          isOpen: true,
          player: action.payload.player,
          leagues: action.payload.leagues,
        },
      };

    case 'CLOSE_POPUP':
      return {
        ...state,
        popupData: {
          isOpen: false,
          player: null,
          leagues: [],
        },
      };

    default:
      return state;
  }
}

// Context type
interface AppContextType {
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
  setLoading: (loading: boolean) => void;
  setExposureLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clearError: () => void;
  openPopup: (player: PlayerAllegiance | PlayerExposure, leagues: string[]) => void;
  closePopup: () => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Local storage keys
const STORAGE_KEYS = {
  USER_IDENTIFIER: 'sleeper_user_identifier',
  SELECTED_WEEK: 'sleeper_selected_week',
  USER_TEAMS: 'sleeper_user_teams',
} as const;

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load persisted state on mount
  useEffect(() => {
    try {
      // Load selected week
      const savedWeek = localStorage.getItem(STORAGE_KEYS.SELECTED_WEEK);
      if (savedWeek) {
        const week = parseInt(savedWeek, 10);
        if (week >= 1 && week <= 18) {
          dispatch({ type: 'SET_WEEK', payload: week });
        }
      }

      // Load user teams selection state
      const savedTeams = localStorage.getItem(STORAGE_KEYS.USER_TEAMS);
      if (savedTeams) {
        // Note: This will be merged with actual team data when user is loaded
        // For now, we just store the selection preferences
        JSON.parse(savedTeams);
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
  }, []);

  // Persist state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_WEEK, state.selectedWeek.toString());
    } catch (error) {
      console.warn('Failed to persist selected week:', error);
    }
  }, [state.selectedWeek]);

  useEffect(() => {
    try {
      if (state.userTeams.length > 0) {
        localStorage.setItem(STORAGE_KEYS.USER_TEAMS, JSON.stringify(state.userTeams));
      }
    } catch (error) {
      console.warn('Failed to persist user teams:', error);
    }
  }, [state.userTeams]);

  useEffect(() => {
    try {
      if (state.user) {
        localStorage.setItem(STORAGE_KEYS.USER_IDENTIFIER, state.user.username || state.user.user_id);
      }
    } catch (error) {
      console.warn('Failed to persist user identifier:', error);
    }
  }, [state.user]);

  // Action creators
  const setUser = (user: SleeperUser) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  const clearUser = () => {
    dispatch({ type: 'CLEAR_USER' });
  };

  const setWeek = (week: number) => {
    dispatch({ type: 'SET_WEEK', payload: week });
  };

  const setUserTeams = (teams: UserTeam[]) => {
    dispatch({ type: 'SET_USER_TEAMS', payload: teams });
  };

  const toggleTeam = (leagueId: string) => {
    dispatch({ type: 'TOGGLE_TEAM', payload: leagueId });
  };

  const selectAllTeams = () => {
    dispatch({ type: 'SELECT_ALL_TEAMS' });
  };

  const deselectAllTeams = () => {
    dispatch({ type: 'DESELECT_ALL_TEAMS' });
  };

  const setGamedayData = (data: GamedayData) => {
    dispatch({ type: 'SET_GAMEDAY_DATA', payload: data });
  };

  const setExposureData = (data: ExposureData) => {
    dispatch({ type: 'SET_EXPOSURE_DATA', payload: data });
  };

  const setActiveTab = (tab: 'gameday' | 'exposure') => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setExposureLoading = (loading: boolean) => {
    dispatch({ type: 'SET_EXPOSURE_LOADING', payload: loading });
  };

  const setError = (error: string) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const openPopup = (player: PlayerAllegiance | PlayerExposure, leagues: string[]) => {
    dispatch({ type: 'OPEN_POPUP', payload: { player, leagues } });
  };

  const closePopup = () => {
    dispatch({ type: 'CLOSE_POPUP' });
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    setUser,
    clearUser,
    setWeek,
    setUserTeams,
    toggleTeam,
    selectAllTeams,
    deselectAllTeams,
    setGamedayData,
    setExposureData,
    setActiveTab,
    setLoading,
    setExposureLoading,
    setError,
    clearError,
    openPopup,
    closePopup,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

// Custom hook to use the context
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Helper function to get persisted user identifier
export function getPersistedUserIdentifier(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.USER_IDENTIFIER);
  } catch (error) {
    console.warn('Failed to get persisted user identifier:', error);
    return null;
  }
}

// Helper function to clear all persisted state
export function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_IDENTIFIER);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_WEEK);
    localStorage.removeItem(STORAGE_KEYS.USER_TEAMS);
  } catch (error) {
    console.warn('Failed to clear persisted state:', error);
  }
}