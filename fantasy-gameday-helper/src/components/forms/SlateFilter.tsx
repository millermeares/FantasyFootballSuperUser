import { useState } from 'react';
import { useAppContext } from '../../context';
import {
  NO_GAME_SLATE_ID,
  NO_GAME_SLATE_LABEL
} from '../../services/ScheduleService';
import './SlateFilter.css';

interface SlateFilterProps {
  /**
   * How many tracked players - yours and your opponents' - are in each slate,
   * keyed by slate id.
   */
  playerCounts: Record<string, number>;
  className?: string;
}

interface SlateOption {
  id: string;
  label: string;
  /** Undefined for the "no game" bucket, which is not a real slate. */
  gameCount?: number;
  playerCount: number;
}

/** The muted line under a game time: how much of the week it accounts for. */
function describeCounts({ gameCount, playerCount }: SlateOption): string {
  const players = `${playerCount} ${playerCount === 1 ? 'player' : 'players'}`;

  if (gameCount === undefined) {
    return players;
  }

  return `${gameCount} ${gameCount === 1 ? 'game' : 'games'} · ${players}`;
}

/**
 * What the collapsed filter says it is currently showing. Picking nothing shows
 * the whole week, so it reads the same as picking everything.
 */
function summarizeSelection(options: SlateOption[], selectedIds: string[]): string {
  const selected = options.filter((option) => selectedIds.includes(option.id));

  if (selected.length === 0 || selected.length === options.length) {
    return 'All game times';
  }

  const shown = selected.slice(0, 3).map((option) => option.label).join(', ');
  const remaining = selected.length - 3;

  return remaining > 0 ? `${shown} and ${remaining} more` : shown;
}

/**
 * Narrow the gameday table to the games kicking off in particular windows -
 * Thursday night, the Sunday early games, Sunday night, and so on. The windows
 * come from the week's actual kickoff times, so there is nothing to update when
 * the league schedules an odd one.
 */
export function SlateFilter({ playerCounts, className = '' }: SlateFilterProps) {
  const { state, toggleSlate } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const { slateData, selectedSlateIds } = state;

  // Without kickoff times there is nothing to filter by
  if (!slateData || slateData.slates.length === 0) {
    return null;
  }

  const options: SlateOption[] = slateData.slates.map((slate) => ({
    id: slate.id,
    label: slate.label,
    gameCount: slate.gameCount,
    playerCount: playerCounts[slate.id] ?? 0
  }));

  // Byes only deserve a control when they actually cost you players
  const noGameCount = playerCounts[NO_GAME_SLATE_ID] ?? 0;
  if (noGameCount > 0) {
    options.push({
      id: NO_GAME_SLATE_ID,
      label: NO_GAME_SLATE_LABEL,
      playerCount: noGameCount
    });
  }

  const selectedCount = options.filter((option) =>
    selectedSlateIds.includes(option.id)
  ).length;

  // A count only says something once the week is actually narrowed: none picked
  // and all picked both show everything, so both read as plain "Game times"
  const isNarrowed = selectedCount > 0 && selectedCount < options.length;

  return (
    <div className={`slate-filter ${className}`.trim()}>
      <div className="slate-filter-header">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="expand-toggle-button"
          aria-expanded={isExpanded}
          aria-controls="slate-list"
        >
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
          <span className="slate-summary">
            {isNarrowed
              ? `Game times (${selectedCount}/${options.length} selected)`
              : 'Game times'}
          </span>
        </button>
      </div>

      {isExpanded && (
        <div
          id="slate-list"
          className="slate-list"
          role="group"
          aria-label="Game time selection"
        >
          {options.map((option) => (
            <div
              key={option.id}
              // A game time holding no tracked players still shows, so you can
              // see that there is nothing there
              className={`slate-item ${option.playerCount === 0 ? 'is-empty' : ''}`.trim()}
            >
              <label className="slate-checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedSlateIds.includes(option.id)}
                  onChange={() => toggleSlate(option.id)}
                  className="slate-checkbox"
                  aria-describedby={`slate-${option.id}-description`}
                />
                <span className="slate-checkbox-custom"></span>
                <span className="slate-name">{option.label}</span>
              </label>
              <div id={`slate-${option.id}-description`} className="slate-details">
                {describeCounts(option)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary when collapsed */}
      {!isExpanded && (
        <div className="collapsed-summary">
          <div className="selected-slates-preview">
            {summarizeSelection(options, selectedSlateIds)}
          </div>
        </div>
      )}
    </div>
  );
}

export default SlateFilter;
