import { useEffect, useCallback, useState } from 'react';
import { useAppContext, getPersistedUserIdentifier } from './context';
import { UserIdentifierInput, WeekSelector, TeamFilter } from './components/forms';
import { LeagueInfoPopup, TabNavigation } from './components/ui';
import { getSleeperApiService } from './services/api/SleeperApiService';
import { playerAnalysisService } from './services/PlayerAnalysisService';

import type { SleeperRoster, SleeperMatchup, SleeperLeague } from './types/sleeper';
import type { UserTeam, AnalysisInput } from './types/app';
import './App.css';
import './styles/mobile.css';

function App() {
  const { 
    state, 
    setUser, 
    setWeek, 
    setUserTeams,
    setGamedayData, 
    setLoading, 
    setError, 
    clearError,
    openPopup,
    closePopup
  } = useAppContext();

  const sleeperApi = getSleeperApiService();

  // Store raw data for recalculations without re-fetching
  const [rawData, setRawData] = useState<{
    leagues: SleeperLeague[];
    rosters: Map<string, SleeperRoster[]>;
    matchups: Map<string, SleeperMatchup[]>;
    userId: string;
  } | null>(null);

  /**
   * Load user data and initialize the application
   * Requirements: 1.1, 6.2 - Auto-load persisted user identifier
   */
  const loadUserData = useCallback(async (identifier: string) => {
    try {
      setLoading(true);
      clearError();
      
      // Clear any existing raw data when loading a new user
      setRawData(null);

      // Get user information
      const user = await sleeperApi.getUser(identifier);
      setUser(user);

      // Get current NFL state for default week BEFORE loading league data
      let currentWeek = state.selectedWeek; // fallback to current state
      try {
        const nflState = await sleeperApi.getNflState();
        if (nflState.week && nflState.week >= 1 && nflState.week <= 18) {
          currentWeek = nflState.week;
          setWeek(currentWeek);
        }
      } catch (error) {
        console.warn('Could not get current NFL week, using default:', error);
      }

      // Load user's leagues and team data with the correct week
      await loadLeagueDataWithWeek(user.user_id, new Date().getFullYear().toString(), currentWeek);

    } catch (error) {
      console.error('Failed to load user data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [sleeperApi, setUser, setWeek, setLoading, setError, clearError, state.selectedWeek]);

  /**
   * Load league data and generate gameday analysis with specific week
   * Requirements: 1.2, 2.1 - Load team data and set up team filter
   */
  const loadLeagueDataWithWeek = useCallback(async (userId: string, season: string, week: number) => {
    try {
      setLoading(true);
      clearError();

      console.log(`Loading league data for user ${userId}, season ${season}, week ${week}`);

      // Get user's leagues
      const leagues = await sleeperApi.getUserLeagues(userId, season);
      
      if (leagues.length === 0) {
        setError('No leagues found for this user in the current season');
        return;
      }

      // Create user teams structure
      const userTeams: UserTeam[] = [];
      const rostersMap = new Map<string, SleeperRoster[]>();
      const matchupsMap = new Map<string, SleeperMatchup[]>();

      // Load roster and matchup data for each league
      for (const league of leagues) {
        try {
          // Get rosters to find user's team
          const rosters = await sleeperApi.getLeagueRosters(league.league_id);
          rostersMap.set(league.league_id, rosters);

          // Find user's roster in this league
          const userRoster = rosters.find(roster => roster.owner_id === userId);
          if (userRoster) {
            console.log(`Found user roster in ${league.name}: roster_id ${userRoster.roster_id}`);
            
            userTeams.push({
              leagueId: league.league_id,
              leagueName: league.name,
              rosterId: userRoster.roster_id,
              isSelected: true // Default to selected
            });

            // Get matchups for the specified week
            try {
              const matchups = await sleeperApi.getLeagueMatchups(league.league_id, week);
              matchupsMap.set(league.league_id, matchups);
              console.log(`Loaded ${matchups.length} matchups for ${league.name}, week ${week}`);
            } catch (error) {
              console.warn(`Could not load matchups for league ${league.name}, week ${week}:`, error);
            }
          } else {
            console.warn(`User not found in league ${league.name}`);
          }
        } catch (error) {
          console.warn(`Could not load data for league ${league.name}:`, error);
        }
      }

      // Set user teams in state
      setUserTeams(userTeams);

      // Store raw data for future recalculations
      const rawDataToStore = {
        leagues,
        rosters: rostersMap,
        matchups: matchupsMap,
        userId
      };
      setRawData(rawDataToStore);

      // Generate gameday analysis
      if (userTeams.length > 0) {
        const analysisInput: AnalysisInput = {
          userTeams,
          leagues,
          rosters: rostersMap,
          matchups: matchupsMap,
          userId
        };

        console.log('Generating gameday analysis with input:', {
          userTeamsCount: userTeams.length,
          leaguesCount: leagues.length,
          rostersCount: rostersMap.size,
          matchupsCount: matchupsMap.size
        });

        const gamedayData = playerAnalysisService.analyzePlayerData(analysisInput);
        setGamedayData(gamedayData);
      } else {
        setError('No teams found for this user in any leagues');
      }

    } catch (error) {
      console.error('Failed to load league data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load league data');
    } finally {
      setLoading(false);
    }
  }, [sleeperApi, setUserTeams, setLoading, setError, clearError, setGamedayData]);

  /**
   * Load league data and generate gameday analysis (uses current selected week)
   * Requirements: 1.2, 2.1 - Load team data and set up team filter
   */
  // const loadLeagueData = useCallback(async (userId: string, season: string) => {
  //   return loadLeagueDataWithWeek(userId, season, state.selectedWeek);
  // }, [loadLeagueDataWithWeek, state.selectedWeek]);

  /**
   * Reload data when week changes or refresh is requested
   * Requirements: 7.2, 7.5 - Update data when week selection changes
   */
  const handleWeekChange = useCallback(async (newWeek: number) => {
    if (state.user) {
      // Update week if it's different
      if (newWeek !== state.selectedWeek) {
        setWeek(newWeek);
      }
      
      // Always clear raw data and reload (handles both week change and refresh)
      setRawData(null);
      await loadLeagueDataWithWeek(state.user.user_id, new Date().getFullYear().toString(), newWeek);
    }
  }, [state.user, state.selectedWeek, setWeek, loadLeagueDataWithWeek]);

  /**
   * Recalculate gameday data when team selections change
   * Requirements: 3.5, 4.5 - Reactive table updates
   */
  const recalculateGamedayData = useCallback((
    userTeams: UserTeam[], 
    leagues: SleeperLeague[], 
    rosters: Map<string, SleeperRoster[]>, 
    matchups: Map<string, SleeperMatchup[]>, 
    userId: string
  ) => {
    try {
      const analysisInput: AnalysisInput = {
        userTeams,
        leagues,
        rosters,
        matchups,
        userId
      };

      const gamedayData = playerAnalysisService.analyzePlayerData(analysisInput);
      setGamedayData(gamedayData);
    } catch (error) {
      console.error('Failed to recalculate gameday data:', error);
      setError('Failed to update player analysis');
    }
  }, [setGamedayData, setError]);

  /**
   * Handle player count clicks to show league info popup
   * Requirements: 3.4, 4.4 - League info popup functionality
   */
  const handlePlayerCountClick = useCallback((playerId: string, leagues: string[]) => {
    const player = state.gamedayData?.cheeringFor.find(p => p.playerId === playerId) ||
                   state.gamedayData?.cheeringAgainst.find(p => p.playerId === playerId);
    
    if (player) {
      openPopup(player, leagues);
    }
  }, [state.gamedayData, openPopup]);

  /**
   * Initialize app on mount
   * Requirements: 6.2 - Auto-load persisted user identifier
   */
  useEffect(() => {
    const persistedIdentifier = getPersistedUserIdentifier();
    if (persistedIdentifier && !state.user && !state.loading) {
      loadUserData(persistedIdentifier);
    }
  }, [loadUserData, state.user, state.loading]);

  /**
   * Clear raw data when user changes
   */
  useEffect(() => {
    if (!state.user) {
      setRawData(null);
    }
  }, [state.user]);

  /**
   * Recalculate data when team selections change
   * Requirements: 2.2, 2.4 - Team selection changes trigger updates
   */
  useEffect(() => {
    if (rawData && state.userTeams.length > 0) {
      // Debounce the recalculation to avoid excessive updates
      const timeoutId = setTimeout(() => {
        recalculateGamedayData(
          state.userTeams,
          rawData.leagues,
          rawData.rosters,
          rawData.matchups,
          rawData.userId
        );
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [state.userTeams, rawData, recalculateGamedayData]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Fantasy Gameday Helper</h1>
        <p className="app-subtitle">
          Know which players to cheer for or against across all your fantasy teams
        </p>
      </header>
      
      <main className="app-main">
        {/* Global loading indicator */}
        {state.loading && (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>Loading your fantasy data...</p>
          </div>
        )}
        
        {/* Global error display */}
        {state.error && (
          <div className="error-message">
            <div className="error-content">
              <h3>Oops! Something went wrong</h3>
              <p>{state.error}</p>
              <button 
                className="error-retry-button"
                onClick={() => {
                  clearError();
                  const identifier = getPersistedUserIdentifier();
                  if (identifier) {
                    loadUserData(identifier);
                  }
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {/* Welcome screen for new users */}
        {!state.user && !state.loading && !state.error && (
          <div className="welcome-section">
            <div className="welcome-message">
              <h2>Welcome to Fantasy Gameday Helper!</h2>
              <p>
                Enter your Sleeper username or user ID to get started. 
                We'll analyze all your fantasy teams and show you which players 
                to cheer for or against during gameday.
              </p>
            </div>
            <UserIdentifierInput />
          </div>
        )}
        
        {/* Main interface for authenticated users */}
        {state.user && !state.loading && (
          <div className="main-interface">
            {/* User controls section */}
            <div className="controls-section">
              <div className="user-info">
                <h2>Welcome back, {state.user.display_name || state.user.username}!</h2>
                <UserIdentifierInput />
              </div>
              
              <div className="week-selection">
                <WeekSelector 
                  onWeekChange={handleWeekChange}
                />
              </div>
            </div>

            {/* Team filter section */}
            {state.userTeams.length > 0 && (
              <div className="team-filter-section">
                <TeamFilter />
              </div>
            )}

            {/* Tabbed interface for gameday and exposure views */}
            {state.userTeams.length > 0 && (
              <div className="tabbed-interface-section">
                <TabNavigation onPlayerCountClick={handlePlayerCountClick} />
              </div>
            )}
          </div>
        )}

        {/* League info popup */}
        <LeagueInfoPopup
          isOpen={state.popupData.isOpen}
          player={state.popupData.player}
          leagues={state.popupData.leagues}
          onClose={closePopup}
        />
      </main>
    </div>
  );
}

export default App;
