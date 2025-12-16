import { useCallback } from 'react';
import { useAppContext } from '../context';
import { PlayerTable } from '../components/tables';

interface ExposureViewProps {
  onPlayerCountClick: (playerId: string, leagues: string[]) => void;
}

export function ExposureView({ onPlayerCountClick }: ExposureViewProps) {
  const { state } = useAppContext();

  /**
   * Handle player count clicks to show league info popup
   * Requirements: 11.4 - League info popup functionality for exposure
   */
  const handlePlayerCountClick = useCallback((playerId: string, leagues: string[]) => {
    onPlayerCountClick(playerId, leagues);
  }, [onPlayerCountClick]);

  // Show loading state if main data is being fetched
  if (state.loading) {
    return (
      <div className="exposure-view">
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>Loading your fantasy data...</p>
        </div>
      </div>
    );
  }

  // Show exposure loading state during recalculations
  // Requirements: 11.5 - Loading states for exposure recalculations
  if (state.exposureLoading) {
    return (
      <div className="exposure-view">
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>Updating exposure calculations...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's a main error
  if (state.error) {
    return (
      <div className="exposure-view">
        <div className="error-message">
          <div className="error-content">
            <h3>Oops! Something went wrong</h3>
            <p>{state.error}</p>
          </div>
        </div>
      </div>
    );
  }



  // Show empty state when no teams are selected
  const selectedTeams = state.userTeams.filter(team => team.isSelected);
  if (selectedTeams.length === 0) {
    return (
      <div className="exposure-view">
        <div className="empty-exposure-state">
          <h3>No teams selected</h3>
          <p>
            Select at least one team from the team filter above to see your exposure report.
          </p>
        </div>
      </div>
    );
  }

  // Show empty state when no exposure data is available yet
  if (!state.exposureData) {
    return (
      <div className="exposure-view">
        <div className="empty-exposure-state">
          <h3>Exposure data not available</h3>
          <p>
            Exposure calculation requires roster data. Please ensure your teams have been loaded 
            and try refreshing the week data.
          </p>
          <div className="team-count-info">
            <p>
              <strong>Selected Teams:</strong> {selectedTeams.length} of {state.userTeams.length}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="exposure-view">
      {/* Exposure report section */}
      <div className="exposure-report-section">
        {/* Show subtle loading overlay during recalculations */}
        {state.exposureLoading && state.exposureData && (
          <div className="exposure-loading-overlay">
            <div className="loading-indicator-small">
              <div className="loading-spinner-small"></div>
              <span>Updating...</span>
            </div>
          </div>
        )}
        
        <div className="exposure-container">
          <PlayerTable
            title="Player Exposure Report"
            subtitle={`Ownership across ${state.exposureData.totalSelectedTeams} selected teams`}
            players={state.exposureData.exposureReport}
            onCountClick={handlePlayerCountClick}
            emptyMessage="No players found in your selected teams' rosters"
            displayMode="percentage"
            className="exposure-table"
          />
        </div>
        
        {/* Exposure summary info */}
        {state.exposureData.exposureReport.length > 0 && (
          <div className="exposure-summary">
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Total Players:</span>
                <span className="stat-value">{state.exposureData.exposureReport.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Selected Teams:</span>
                <span className="stat-value">{state.exposureData.totalSelectedTeams}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Teams:</span>
                <span className="stat-value">{state.userTeams.length}</span>
              </div>
            </div>
            <div className="exposure-info">
              <p className="info-text">
                <strong>Note:</strong> Exposure percentages include all roster positions 
                (starters, bench, taxi squad, and injured reserve).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}