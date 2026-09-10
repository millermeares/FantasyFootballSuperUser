import { useMemo, useState } from 'react';
import type { PlayerAggregate } from '../../types/app';
import './AggregateTable.css';

export type AggregateSortField =
  | 'name'
  | 'position'
  | 'team'
  | 'for'
  | 'against'
  | 'total'
  | 'net';

export type SortDirection = 'asc' | 'desc';

export type AllegianceSide = 'for' | 'against';

interface AggregateTableProps {
  players: PlayerAggregate[];
  title: string;
  /** Called when a "for" or "against" count is activated, to show its leagues. */
  onCountClick?: (player: PlayerAggregate, side: AllegianceSide) => void;
  className?: string;
  emptyMessage?: string;
}

interface ColumnDefinition {
  field: AggregateSortField;
  /** Header text on wide viewports. */
  label: string;
  /** Header text once the table narrows; falls back to `label`. */
  shortLabel?: string;
  /** Spelled-out name for the sort control, since headers are abbreviated. */
  description: string;
  /** Numeric columns sort high-to-low first; text columns sort A-to-Z first. */
  numeric: boolean;
}

const COLUMNS: ColumnDefinition[] = [
  { field: 'name', label: 'Player', description: 'player name', numeric: false },
  { field: 'position', label: 'Pos', description: 'position', numeric: false },
  { field: 'team', label: 'Team', description: 'NFL team', numeric: false },
  {
    field: 'for',
    label: 'For',
    description: 'teams where you start this player',
    numeric: true
  },
  {
    field: 'against',
    label: 'Against',
    shortLabel: 'Agn',
    description: 'teams where you face this player',
    numeric: true
  },
  {
    field: 'total',
    label: 'Tot',
    description: 'total teams involving this player (for plus against)',
    numeric: true
  },
  {
    field: 'net',
    label: 'Net',
    description: 'net allegiance (for minus against)',
    numeric: true
  }
];

function compareByField(
  a: PlayerAggregate,
  b: PlayerAggregate,
  field: AggregateSortField
): number {
  switch (field) {
    case 'name':
      return a.playerName.localeCompare(b.playerName);
    case 'position':
      return a.position.localeCompare(b.position);
    case 'team':
      return a.team.localeCompare(b.team);
    case 'for':
      return a.forCount - b.forCount;
    case 'against':
      return a.againstCount - b.againstCount;
    case 'total':
      return a.totalCount - b.totalCount;
    case 'net':
      return a.netCount - b.netCount;
    default:
      return 0;
  }
}

/** Render a net value with an explicit sign so it never relies on colour alone. */
function formatNet(netCount: number): string {
  if (netCount > 0) return `+${netCount}`;
  return `${netCount}`;
}

function netClassName(netCount: number): string {
  if (netCount > 0) return 'net-value net-value--positive';
  if (netCount < 0) return 'net-value net-value--negative';
  return 'net-value net-value--neutral';
}

/**
 * One row per player showing how often you start them, how often you face them,
 * and the net of the two. Every column is sortable, so a single tap answers
 * "who am I against the most" or "who do I own the most".
 */
export function AggregateTable({
  players,
  title,
  onCountClick,
  className = '',
  emptyMessage = 'No players found'
}: AggregateTableProps) {
  const [sortField, setSortField] = useState<AggregateSortField>('total');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedPlayers = useMemo(() => {
    const directionFactor = sortDirection === 'asc' ? 1 : -1;

    return [...players].sort((a, b) => {
      const comparison = compareByField(a, b, sortField);
      if (comparison !== 0) {
        return comparison * directionFactor;
      }

      // Stable, predictable tiebreak so equal values never reshuffle
      return a.playerName.localeCompare(b.playerName);
    });
  }, [players, sortField, sortDirection]);

  /** Toggle direction when re-sorting the same column, otherwise use its default. */
  const handleSort = (field: AggregateSortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      return;
    }

    const column = COLUMNS.find((c) => c.field === field);
    setSortField(field);
    setSortDirection(column?.numeric ? 'desc' : 'asc');
  };

  const ariaSortFor = (field: AggregateSortField) => {
    if (field !== sortField) return 'none' as const;
    return sortDirection === 'asc' ? ('ascending' as const) : ('descending' as const);
  };

  return (
    <div className={`aggregate-table ${className}`.trim()}>
      <div className="aggregate-table-header">
        <h2 className="aggregate-table-title">{title}</h2>
        <div className="aggregate-table-count-badge">
          {players.length} {players.length === 1 ? 'player' : 'players'}
        </div>
      </div>

      {players.length === 0 ? (
        <div className="aggregate-empty-state">
          <p className="aggregate-empty-message">{emptyMessage}</p>
        </div>
      ) : (
        <div className="aggregate-table-container">
          <table className="aggregate-data-table">
            <caption className="aggregate-table-caption">
              {title}. Every column heading sorts the table.
            </caption>
            <thead>
              <tr>
                {COLUMNS.map((column) => (
                  <th
                    key={column.field}
                    scope="col"
                    className={`aggregate-th aggregate-th--${column.field} ${
                      sortField === column.field ? 'is-active' : ''
                    }`.trim()}
                    aria-sort={ariaSortFor(column.field)}
                  >
                    <button
                      type="button"
                      className="aggregate-sort-button"
                      onClick={() => handleSort(column.field)}
                      aria-label={`Sort by ${column.description}`}
                    >
                      <span className="aggregate-th-label" aria-hidden="true">
                        {column.label}
                      </span>
                      {column.shortLabel && (
                        <span className="aggregate-th-label-short" aria-hidden="true">
                          {column.shortLabel}
                        </span>
                      )}
                      <span className="aggregate-sort-indicator" aria-hidden="true">
                        {sortField === column.field
                          ? sortDirection === 'asc'
                            ? '↑'
                            : '↓'
                          : ''}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player) => (
                <tr key={player.playerId} className="aggregate-row">
                  <td className="aggregate-cell aggregate-cell--name">
                    <span className="aggregate-player-name">{player.playerName}</span>
                    {/* Mirrors the position/team columns when they are hidden */}
                    <span className="aggregate-player-meta" aria-hidden="true">
                      {player.position} · {player.team}
                    </span>
                  </td>
                  <td className="aggregate-cell aggregate-cell--position">
                    <span
                      className="aggregate-position-badge"
                      data-position={player.position}
                    >
                      {player.position}
                    </span>
                  </td>
                  <td className="aggregate-cell aggregate-cell--team">
                    <span className="aggregate-team-name">{player.team}</span>
                  </td>
                  <CountCell
                    player={player}
                    side="for"
                    count={player.forCount}
                    leagues={player.forLeagues}
                    onCountClick={onCountClick}
                  />
                  <CountCell
                    player={player}
                    side="against"
                    count={player.againstCount}
                    leagues={player.againstLeagues}
                    onCountClick={onCountClick}
                  />
                  <td className="aggregate-cell aggregate-cell--total">
                    <span className="total-value">{player.totalCount}</span>
                  </td>
                  <td className="aggregate-cell aggregate-cell--net">
                    <span className={netClassName(player.netCount)}>
                      {formatNet(player.netCount)}
                    </span>
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

interface CountCellProps {
  player: PlayerAggregate;
  side: AllegianceSide;
  count: number;
  leagues: string[];
  onCountClick?: (player: PlayerAggregate, side: AllegianceSide) => void;
}

/**
 * A "for" or "against" count. Zero means the player never shows up on that
 * side, so there are no leagues to list and nothing to click.
 */
function CountCell({ player, side, count, leagues, onCountClick }: CountCellProps) {
  const cellClass = `aggregate-cell aggregate-cell--count aggregate-cell--${side}`;

  if (count === 0) {
    return (
      <td className={cellClass}>
        <span className="aggregate-count-empty" aria-label="none">
          –
        </span>
      </td>
    );
  }

  if (!onCountClick) {
    return (
      <td className={cellClass}>
        <span className={`aggregate-count-display aggregate-count-display--${side}`}>
          {count}
        </span>
      </td>
    );
  }

  const leagueWord = leagues.length === 1 ? 'league' : 'leagues';
  const sideLabel = side === 'for' ? 'start' : 'face';

  return (
    <td className={cellClass}>
      <button
        type="button"
        className={`aggregate-count-button aggregate-count-button--${side}`}
        onClick={() => onCountClick(player, side)}
        title={`View the ${leagues.length} ${leagueWord} where you ${sideLabel} ${player.playerName}`}
        aria-label={`You ${sideLabel} ${player.playerName} in ${count} of your teams. View leagues.`}
      >
        {count}
      </button>
    </td>
  );
}

export default AggregateTable;
