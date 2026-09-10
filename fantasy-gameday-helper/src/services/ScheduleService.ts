import type { SleeperGameScore } from '../types/sleeper';
import type { Slate, SlateData } from '../types/app';

/**
 * Two kickoffs closer together than this belong to the same slate.
 *
 * NFL windows are separated by at least ~3 hours (1:00 PM to 4:05 PM ET) while
 * games inside a window start within ~25 minutes of each other, so any
 * threshold between those two figures recovers the real slates without knowing
 * what the slates are. Working purely off the gaps also means no timezone or
 * day-of-week assumptions: a Wednesday opener, a London morning game and the
 * Thanksgiving triple-header all fall out on their own.
 */
export const SLATE_GAP_MINUTES = 120;

/** Bucket for players whose team has no game this week: bye weeks, free agents. */
export const NO_GAME_SLATE_ID = 'no-game';
export const NO_GAME_SLATE_LABEL = 'No game';

const MINUTE_MS = 60_000;

const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit'
});

/**
 * Day and kickoff time in the viewer's own timezone, e.g. "Sun 1:00 PM" on the
 * east coast and "Sun 10:00 AM" on the west, since that is the clock the user
 * is actually watching.
 */
export function formatSlateLabel(startTime: number): string {
  const kickoff = new Date(startTime);
  return `${weekdayFormatter.format(kickoff)} ${timeFormatter.format(kickoff)}`;
}

function slateIdFor(startTime: number): string {
  return `slate-${startTime}`;
}

/**
 * Group a week's games into slates by clustering their kickoff times.
 *
 * @param games - Games from Sleeper's scores feed for a single week
 * @param gapMinutes - Kickoffs further apart than this start a new slate
 */
export function buildSlateData(
  games: SleeperGameScore[],
  gapMinutes: number = SLATE_GAP_MINUTES
): SlateData {
  // A game with no kickoff time cannot be placed, and a game with no teams
  // cannot be matched to a player, so neither can contribute to a slate.
  const scheduled = games.filter(
    (game): game is SleeperGameScore & { start_time: number } =>
      typeof game.start_time === 'number' && Number.isFinite(game.start_time)
  );

  const gamesByKickoff = new Map<number, SleeperGameScore[]>();
  for (const game of scheduled) {
    const existing = gamesByKickoff.get(game.start_time);
    if (existing) {
      existing.push(game);
    } else {
      gamesByKickoff.set(game.start_time, [game]);
    }
  }

  const kickoffs = [...gamesByKickoff.keys()].sort((a, b) => a - b);

  // Walk the kickoffs in order, breaking the run wherever the gap is too wide
  const clusters: number[][] = [];
  for (const kickoff of kickoffs) {
    const currentCluster = clusters[clusters.length - 1];
    const previousKickoff = currentCluster?.[currentCluster.length - 1];

    if (
      previousKickoff === undefined ||
      kickoff - previousKickoff > gapMinutes * MINUTE_MS
    ) {
      clusters.push([kickoff]);
    } else {
      currentCluster.push(kickoff);
    }
  }

  const slates: Slate[] = [];
  const teamSlateIds: Record<string, string> = {};

  for (const cluster of clusters) {
    const clusterGames = cluster.flatMap((kickoff) => gamesByKickoff.get(kickoff) ?? []);
    const startTime = cluster[0];
    const id = slateIdFor(startTime);

    const teams: string[] = [];
    for (const game of clusterGames) {
      for (const team of [game.metadata?.away_team, game.metadata?.home_team]) {
        if (team) {
          teams.push(team);
          teamSlateIds[team] = id;
        }
      }
    }

    slates.push({
      id,
      label: formatSlateLabel(startTime),
      startTime,
      kickoffTimes: cluster,
      gameCount: clusterGames.length,
      teams
    });
  }

  return { slates, teamSlateIds };
}

/**
 * The slate a player belongs to, by their NFL team. Teams on a bye - and
 * players with no team at all - land in the "no game" bucket.
 */
export function slateIdForTeam(team: string, slateData: SlateData): string {
  return slateData.teamSlateIds[team] ?? NO_GAME_SLATE_ID;
}

/** Every slate id a selection can contain, including the "no game" bucket. */
export function allSlateIds(slateData: SlateData | null): string[] {
  if (!slateData) return [];
  return [...slateData.slates.map((slate) => slate.id), NO_GAME_SLATE_ID];
}
