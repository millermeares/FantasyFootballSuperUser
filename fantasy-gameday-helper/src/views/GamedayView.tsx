import { useCallback, useMemo } from 'react';
import { useAppContext } from '../context';
import { PlayerTable } from '../components/tables';
import type { PlayerAllegiance } from '../types/app';

interface GamedayViewProps {
  onPlayerCountClick: (playerId: string, leagues: string[]) => void;
}

export function GamedayView({ onPlayerCountClick }: GamedayViewProps) {
  const { state } = useAppContext();

  /**
   * Filter players by the player filter (name or team abbreviation).
   * Only applies when 2+ characters are entered.
   */
  const filterPlayers = useMemo(() => {
    const query = state.playerFilter.trim().toLowerCase();
    if (query.length < 2) return (players: PlayerAllegiance[]) => players;

    return (players: PlayerAllegiance[]) =>
      players.filter(
        (p) =>
          p.playerName.toLowerCase().includes(query) ||
          p.team.toLowerCase().includes(query)
      );
  }, [state.playerFilter]);

  const filteredCheeringFor = useMemo(
    () => (state.gamedayData ? filterPlayers(state.gamedayData.cheeringFor) : []),
    [state.gamedayData, filterPlayers]
  );

  const filteredCheeringAgainst = useMemo(
    () => (state.gamedayData ? filterPlayers(state.gamedayData.cheeringAgainst) : []),
    [state.gamedayData, filterPlayers]
  );

  /**
   * Handle player count clicks to show league info popup
   * Requirements: 3.4, 4.4 - League info popup functionality
   */
  const handlePlayerCountClick = useCallback((playerId: string, leagues: string[]) => {
    onPlayerCountClick(playerId, leagues);
  }, [onPlayerCountClick]);

  // Show loading state if data is being fetched
  if (state.loading) {
    return (
      <div className="gameday-view">
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>Loading your fantasy data...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (state.error) {
    return (
      <div className="gameday-view">
        <div className="error-message">
          <div className="error-content">
            <h3>Oops! Something went wrong</h3>
            <p>{state.error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state when no gameday data is available
  if (!state.gamedayData) {
    return (
      <div className="gameday-view">
        <div className="empty-gameday-state">
          <h3>No gameday data available</h3>
          <p>
            Make sure you have teams in active leagues for the selected week, 
            and that matchups are available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="gameday-view">
      {/* Player tables section */}
      <div className="player-tables-section">
        <div className="tables-container">
          {/* Cheering For table */}
          <div className="table-section">
            <PlayerTable
              title="Players to Cheer For"
              players={filteredCheeringFor}
              onCountClick={handlePlayerCountClick}
              emptyMessage={state.playerFilter.trim().length >= 2 ? "No matching players" : "No players found in your selected teams' starting lineups"}
            />
          </div>

          {/* Cheering Against table */}
          <div className="table-section">
            <PlayerTable
              title="Players to Cheer Against"
              players={filteredCheeringAgainst}
              onCountClick={handlePlayerCountClick}
              emptyMessage={state.playerFilter.trim().length >= 2 ? "No matching players" : "No opponent players found for your selected teams"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}