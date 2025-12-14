import { useState, useMemo } from 'react';
import type { PlayerAllegiance } from '../../types/app';
import './PlayerTable.css';

interface PlayerTableProps {
  players: PlayerAllegiance[];
  title: string;
  subtitle?: string;
  onCountClick?: (playerId: string, leagues: string[]) => void;
  className?: string;
  emptyMessage?: string;
}

type SortField = 'count' | 'name' | 'position' | 'team';
type SortDirection = 'asc' | 'desc';

export function PlayerTable({
  players,
  title,
  subtitle,
  onCountClick,
  className = '',
  emptyMessage = 'No players found'
}: PlayerTableProps) {
  const [sortField, setSortField] = useState<SortField>('count');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Sort players based on current sort configuration
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'count':
          comparison = a.count - b.count;
          break;
        case 'name':
          comparison = a.playerName.localeCompare(b.playerName);
          break;
        case 'position':
          comparison = a.position.localeCompare(b.position);
          break;
        case 'team':
          comparison = a.team.localeCompare(b.team);
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [players, sortField, sortDirection]);

  // Handle sort column click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with appropriate default direction
      setSortField(field);
      setSortDirection(field === 'count' ? 'desc' : 'asc');
    }
  };

  // Handle count click
  const handleCountClick = (player: PlayerAllegiance) => {
    if (onCountClick) {
      onCountClick(player.playerId, player.leagues);
    }
  };

  // Get sort indicator for column headers
  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  // Get CSS class for sortable headers
  const getSortableHeaderClass = (field: SortField) => {
    const baseClass = 'sortable-header';
    const activeClass = sortField === field ? 'active' : '';
    return `${baseClass} ${activeClass}`.trim();
  };

  return (
    <div className={`player-table ${className}`}>
      <div className="player-table-header">
        <h2 className="player-table-title">{title}</h2>
        {subtitle && <p className="player-table-subtitle">{subtitle}</p>}
        <div className="player-count-badge">
          {players.length} {players.length === 1 ? 'player' : 'players'}
        </div>
      </div>

      {players.length === 0 ? (
        <div className="empty-state">
          <p className="empty-message">{emptyMessage}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="player-data-table" role="table">
            <thead>
              <tr>
                <th 
                  className={getSortableHeaderClass('name')}
                  onClick={() => handleSort('name')}
                  role="columnheader"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort('name');
                    }
                  }}
                  aria-sort={
                    sortField === 'name' 
                      ? sortDirection === 'asc' ? 'ascending' : 'descending'
                      : 'none'
                  }
                >
                  Player{getSortIndicator('name')}
                </th>
                <th 
                  className={getSortableHeaderClass('position')}
                  onClick={() => handleSort('position')}
                  role="columnheader"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort('position');
                    }
                  }}
                  aria-sort={
                    sortField === 'position' 
                      ? sortDirection === 'asc' ? 'ascending' : 'descending'
                      : 'none'
                  }
                >
                  Position{getSortIndicator('position')}
                </th>
                <th 
                  className={getSortableHeaderClass('team')}
                  onClick={() => handleSort('team')}
                  role="columnheader"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort('team');
                    }
                  }}
                  aria-sort={
                    sortField === 'team' 
                      ? sortDirection === 'asc' ? 'ascending' : 'descending'
                      : 'none'
                  }
                >
                  Team{getSortIndicator('team')}
                </th>
                <th 
                  className={getSortableHeaderClass('count')}
                  onClick={() => handleSort('count')}
                  role="columnheader"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort('count');
                    }
                  }}
                  aria-sort={
                    sortField === 'count' 
                      ? sortDirection === 'asc' ? 'ascending' : 'descending'
                      : 'none'
                  }
                >
                  Count{getSortIndicator('count')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player) => (
                <tr key={player.playerId} className="player-row">
                  <td className="player-name-cell">
                    <span className="player-name">{player.playerName}</span>
                  </td>
                  <td className="position-cell">
                    <span className="position-badge">{player.position}</span>
                  </td>
                  <td className="team-cell">
                    <span className="team-name">{player.team}</span>
                  </td>
                  <td className="count-cell">
                    {onCountClick ? (
                      <button
                        type="button"
                        className="count-button"
                        onClick={() => handleCountClick(player)}
                        title={`View leagues for ${player.playerName}`}
                        aria-label={`${player.count} appearances, click to view leagues`}
                      >
                        {player.count}
                      </button>
                    ) : (
                      <span className="count-display">{player.count}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PlayerTable;