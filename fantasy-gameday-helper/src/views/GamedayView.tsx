import { useCallback, useMemo } from 'react';
import { useAppContext } from '../context';
import { AggregateTable } from '../components/tables';
import type { AllegianceSide } from '../components/tables';
import { SlateFilter } from '../components/forms';
import { aggregateAllegiances } from '../services/PlayerAnalysisService';
import { slateIdForTeam } from '../services/ScheduleService';
import type { PlayerAggregate, SlateData } from '../types/app';

/**
 * Filter players by name or team abbreviation.
 * A null query means no filtering is applied.
 */
function filterPlayers(players: PlayerAggregate[], query: string | null): PlayerAggregate[] {
  if (query === null) return players;

  return players.filter(
    (p) =>
      p.playerName.toLowerCase().includes(query) ||
      p.team.toLowerCase().includes(query)
  );
}

/** How many players fall in each slate, for the counts on the slate chips. */
function countPlayersBySlate(
  players: PlayerAggregate[],
  slateData: SlateData
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const player of players) {
    const slateId = slateIdForTeam(player.team, slateData);
    counts[slateId] = (counts[slateId] ?? 0) + 1;
  }

  return counts;
}

export function GamedayView() {
  const { state, openPopup } = useAppContext();

  // One row per player, derived from the two allegiance lists rather than
  // stored, so it can never fall out of step with them.
  const aggregate = useMemo(
    () =>
      state.gamedayData
        ? aggregateAllegiances(
            state.gamedayData.cheeringFor,
            state.gamedayData.cheeringAgainst
          )
        : [],
    [state.gamedayData]
  );

  // The player filter only applies when 2+ characters are entered
  const trimmedFilter = state.playerFilter.trim();
  const filterQuery = trimmedFilter.length >= 2 ? trimmedFilter.toLowerCase() : null;

  const filteredPlayers = useMemo(
    () => filterPlayers(aggregate, filterQuery),
    [aggregate, filterQuery]
  );

  const { slateData, selectedSlateIds } = state;

  // Chip counts describe the whole week, so they hold still while you type in
  // the name filter or toggle slates
  const playerCountsBySlate = useMemo(
    () => (slateData ? countPlayersBySlate(aggregate, slateData) : {}),
    [aggregate, slateData]
  );

  // Without kickoff times there is nothing to narrow by, so every player shows
  const visiblePlayers = useMemo(() => {
    if (!slateData || slateData.slates.length === 0) return filteredPlayers;

    return filteredPlayers.filter((player) =>
      selectedSlateIds.includes(slateIdForTeam(player.team, slateData))
    );
  }, [filteredPlayers, slateData, selectedSlateIds]);

  const hiddenBySlateFilter = filteredPlayers.length > 0 && visiblePlayers.length === 0;

  /**
   * Show the leagues behind whichever count was clicked. Each side keeps its
   * own league list, so the popup needs to know which one it is describing.
   */
  const handleCountClick = useCallback(
    (player: PlayerAggregate, side: AllegianceSide) => {
      const leagues = side === 'for' ? player.forLeagues : player.againstLeagues;
      openPopup(player, leagues, side);
    },
    [openPopup]
  );

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
      <SlateFilter playerCounts={playerCountsBySlate} />

      <div className="player-tables-section">
        <AggregateTable
          title="Gameday Allegiances"
          players={visiblePlayers}
          onCountClick={handleCountClick}
          emptyMessage={
            hiddenBySlateFilter
              ? 'No players in the selected game times'
              : trimmedFilter.length >= 2
                ? 'No matching players'
                : 'No players found in your selected teams or their matchups'
          }
        />
      </div>
    </div>
  );
}
