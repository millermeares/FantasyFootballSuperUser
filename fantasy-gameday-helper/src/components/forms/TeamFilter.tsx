import { useState } from 'react';
import { useAppContext } from '../../context';
import type { UserTeam } from '../../types/app';
import './TeamFilter.css';

interface TeamFilterProps {
  onTeamSelectionChange?: (selectedTeams: UserTeam[]) => void;
  className?: string;
}

export function TeamFilter({ onTeamSelectionChange, className = '' }: TeamFilterProps) {
  const { state, toggleTeam, selectAllTeams, deselectAllTeams } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);

  const { userTeams } = state;
  const selectedTeams = userTeams.filter(team => team.isSelected);
  const selectedCount = selectedTeams.length;
  const totalCount = userTeams.length;

  // Handle individual team toggle
  const handleTeamToggle = (leagueId: string) => {
    toggleTeam(leagueId);
    
    // Call optional callback with updated selection
    if (onTeamSelectionChange) {
      // Find the team being toggled and predict its new state
      const updatedTeams = userTeams.map(team =>
        team.leagueId === leagueId
          ? { ...team, isSelected: !team.isSelected }
          : team
      );
      onTeamSelectionChange(updatedTeams.filter(team => team.isSelected));
    }
  };

  // Handle select all teams
  const handleSelectAll = () => {
    selectAllTeams();

    if (onTeamSelectionChange) {
      onTeamSelectionChange(userTeams.map(team => ({ ...team, isSelected: true })));
    }
  };

  // Handle deselect all teams
  const handleDeselectAll = () => {
    deselectAllTeams();

    if (onTeamSelectionChange) {
      onTeamSelectionChange([]);
    }
  };

  // Toggle expanded/collapsed state
  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Don't render if no teams
  if (userTeams.length === 0) {
    return null;
  }

  return (
    <div className={`team-filter ${className}`}>
      <div className="team-filter-header">
        <button
          type="button"
          onClick={handleToggleExpanded}
          className="expand-toggle-button"
          aria-expanded={isExpanded}
          aria-controls="team-list"
        >
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
            ▼
          </span>
          <span className="team-summary">
            Teams ({selectedCount}/{totalCount} selected)
          </span>
        </button>

        {/* Select All/None buttons - always visible */}
        <div className="bulk-actions">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={selectedCount === totalCount}
            className="bulk-action-button select-all"
            title="Select all teams"
          >
            All
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            disabled={selectedCount === 0}
            className="bulk-action-button deselect-all"
            title="Deselect all teams"
          >
            None
          </button>
        </div>
      </div>

      {isExpanded && (
        <div id="team-list" className="team-list" role="group" aria-label="Team selection">
          {userTeams.map((team) => (
            <div key={team.leagueId} className="team-item">
              <label className="team-checkbox-label">
                <input
                  type="checkbox"
                  checked={team.isSelected}
                  onChange={() => handleTeamToggle(team.leagueId)}
                  className="team-checkbox"
                  aria-describedby={`team-${team.leagueId}-description`}
                />
                <span className="checkbox-custom"></span>
                <span className="team-name">{team.leagueName}</span>
              </label>
              <div 
                id={`team-${team.leagueId}-description`} 
                className="team-details"
              >
                League ID: {team.leagueId}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary when collapsed */}
      {!isExpanded && selectedCount > 0 && (
        <div className="collapsed-summary">
          <div className="selected-teams-preview">
            {selectedTeams.slice(0, 3).map((team, index) => (
              <span key={team.leagueId} className="team-preview">
                {team.leagueName}
                {index < Math.min(selectedTeams.length, 3) - 1 && ', '}
              </span>
            ))}
            {selectedCount > 3 && (
              <span className="more-teams">
                {' '}and {selectedCount - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamFilter;