import { useCallback } from 'react';
import { useAppContext } from '../context';
import { PlayerTable } from '../components/tables';
import type { PlayerAllegiance } from '../types/app';

interface GamedayViewProps {
  onPlayerCountClick: (playerId: string, leagues: string[]) => void;
}

export function GamedayView({ onPlayerCountClick }: GamedayViewProps) {
  const { state } = useAppContext();

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
              subtitle={`${state.gamedayData.cheeringFor.length} players in your starting lineups`}
              players={state.gamedayData.cheeringFor}
              onCountClick={handlePlayerCountClick}
              emptyMessage="No players found in your selected teams' starting lineups"
            />
          </div>

          {/* Cheering Against table */}
          <div className="table-section">
            <PlayerTable
              title="Players to Cheer Against"
              subtitle={`${state.gamedayData.cheeringAgainst.length} players in opponent lineups`}
              players={state.gamedayData.cheeringAgainst}
              onCountClick={handlePlayerCountClick}
              emptyMessage="No opponent players found for your selected teams"
            />
          </div>
        </div>
      </div>
    </div>
  );
}