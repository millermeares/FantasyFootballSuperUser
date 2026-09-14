import { describe, it, expect } from 'vitest';
import {
  buildSlateData,
  formatSlateLabel,
  slateIdForTeam,
  NO_GAME_SLATE_ID,
  SLATE_GAP_MINUTES
} from './ScheduleService';
import type { SleeperGameScore } from '../types/sleeper';

/** Kickoff as epoch ms, from an ISO string with an explicit offset. */
function at(iso: string): number {
  return new Date(iso).getTime();
}

let nextGameId = 0;

function game(startTime: number | null, away: string, home: string): SleeperGameScore {
  nextGameId += 1;
  return {
    game_id: `game-${nextGameId}`,
    week: 1,
    status: 'pre_game',
    start_time: startTime,
    metadata: { away_team: away, home_team: home }
  };
}

/**
 * Week 1 of the 2025 season, which covers every shape that matters: a Thursday
 * opener, a standalone Friday game abroad, the Sunday early block, an afternoon
 * block split across two kickoffs, and the two prime-time singles.
 */
const WEEK_1_2025: SleeperGameScore[] = [
  game(at('2025-09-05T00:20:00Z'), 'DAL', 'PHI'), // Thu night
  game(at('2025-09-06T00:00:00Z'), 'KC', 'LAC'), // Fri night, São Paulo
  game(at('2025-09-07T17:00:00Z'), 'TB', 'ATL'), // Sun early
  game(at('2025-09-07T17:00:00Z'), 'CIN', 'CLE'),
  game(at('2025-09-07T17:00:00Z'), 'MIA', 'IND'),
  game(at('2025-09-07T20:05:00Z'), 'TEN', 'DEN'), // Sun afternoon, 4:05 ET
  game(at('2025-09-07T20:05:00Z'), 'SF', 'SEA'),
  game(at('2025-09-07T20:25:00Z'), 'DET', 'GB'), // Sun afternoon, 4:25 ET
  game(at('2025-09-08T00:20:00Z'), 'BAL', 'BUF'), // Sun night
  game(at('2025-09-09T00:15:00Z'), 'MIN', 'CHI') // Mon night
];

describe('buildSlateData', () => {
  it('groups a real week into the slates fans recognise', () => {
    const { slates } = buildSlateData(WEEK_1_2025);

    expect(slates.map((slate) => ({ start: slate.startTime, games: slate.gameCount }))).toEqual([
      { start: at('2025-09-05T00:20:00Z'), games: 1 },
      { start: at('2025-09-06T00:00:00Z'), games: 1 },
      { start: at('2025-09-07T17:00:00Z'), games: 3 },
      { start: at('2025-09-07T20:05:00Z'), games: 3 },
      { start: at('2025-09-08T00:20:00Z'), games: 1 },
      { start: at('2025-09-09T00:15:00Z'), games: 1 }
    ]);
  });

  it('merges kickoffs inside one window and keeps separate windows apart', () => {
    const { slates } = buildSlateData(WEEK_1_2025);
    const afternoon = slates[3];

    // 4:05 and 4:25 ET are one afternoon slate
    expect(afternoon.kickoffTimes).toEqual([
      at('2025-09-07T20:05:00Z'),
      at('2025-09-07T20:25:00Z')
    ]);
    expect(afternoon.teams).toEqual(['TEN', 'DEN', 'SF', 'SEA', 'DET', 'GB']);

    // ...while the 1:00 ET block stays its own slate
    expect(slates[2].teams).toEqual(['TB', 'ATL', 'CIN', 'CLE', 'MIA', 'IND']);
  });

  it('maps every team playing to its slate', () => {
    const slateData = buildSlateData(WEEK_1_2025);

    expect(slateIdForTeam('DAL', slateData)).toBe(slateData.slates[0].id);
    expect(slateIdForTeam('SEA', slateData)).toBe(slateData.slates[3].id);
    expect(slateIdForTeam('CHI', slateData)).toBe(slateData.slates[5].id);
  });

  it('reports teams on a bye, and players with no team, as having no game', () => {
    const slateData = buildSlateData(WEEK_1_2025);

    expect(slateIdForTeam('NYJ', slateData)).toBe(NO_GAME_SLATE_ID);
    expect(slateIdForTeam('FA', slateData)).toBe(NO_GAME_SLATE_ID);
  });

  it('gives each slate a stable, distinct id ordered by kickoff', () => {
    const { slates } = buildSlateData(WEEK_1_2025);
    const ids = slates.map((slate) => slate.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(buildSlateData(WEEK_1_2025).slates.map((slate) => slate.id)).toEqual(ids);
    expect([...slates].sort((a, b) => a.startTime - b.startTime)).toEqual(slates);
  });

  it('splits an unusual window off on its own', () => {
    // A London kick-off is 3.5 hours before the Sunday early games
    const { slates } = buildSlateData([
      game(at('2025-10-05T13:30:00Z'), 'MIN', 'CLE'),
      game(at('2025-10-05T17:00:00Z'), 'DAL', 'NYJ'),
      game(at('2025-10-05T17:00:00Z'), 'HOU', 'BAL')
    ]);

    expect(slates).toHaveLength(2);
    expect(slates[0].gameCount).toBe(1);
    expect(slates[0].teams).toEqual(['MIN', 'CLE']);
    expect(slates[1].gameCount).toBe(2);
  });

  it('keeps three games on one holiday afternoon in separate slates', () => {
    const { slates } = buildSlateData([
      game(at('2025-11-27T18:00:00Z'), 'GB', 'DET'), // 1:00 ET
      game(at('2025-11-27T21:30:00Z'), 'KC', 'DAL'), // 4:30 ET
      game(at('2025-11-28T01:20:00Z'), 'CIN', 'BAL') // 8:20 ET
    ]);

    expect(slates.map((slate) => slate.gameCount)).toEqual([1, 1, 1]);
  });

  it('respects the gap threshold it is given', () => {
    const kickoffs = [
      game(at('2025-09-07T17:00:00Z'), 'TB', 'ATL'),
      game(at('2025-09-07T20:05:00Z'), 'TEN', 'DEN')
    ];

    // The default keeps the two windows apart...
    expect(buildSlateData(kickoffs).slates).toHaveLength(2);
    // ...and a threshold wider than their gap collapses them
    expect(buildSlateData(kickoffs, 4 * 60).slates).toHaveLength(1);
    expect(SLATE_GAP_MINUTES).toBeGreaterThan(30);
    expect(SLATE_GAP_MINUTES).toBeLessThan(180);
  });

  it('ignores games with no kickoff time', () => {
    const { slates, teamSlateIds } = buildSlateData([
      game(null, 'TB', 'ATL'),
      game(at('2025-09-07T17:00:00Z'), 'CIN', 'CLE')
    ]);

    expect(slates).toHaveLength(1);
    expect(slates[0].teams).toEqual(['CIN', 'CLE']);
    expect(teamSlateIds).not.toHaveProperty('TB');
  });

  it('tolerates games missing team metadata', () => {
    const { slates, teamSlateIds } = buildSlateData([
      { game_id: 'bare', week: 1, status: 'pre_game', start_time: at('2025-09-07T17:00:00Z') }
    ]);

    expect(slates).toHaveLength(1);
    expect(slates[0].teams).toEqual([]);
    expect(teamSlateIds).toEqual({});
  });

  it('returns nothing to filter by when the week has no games', () => {
    const slateData = buildSlateData([]);

    expect(slateData.slates).toEqual([]);
    expect(slateData.teamSlateIds).toEqual({});
  });
});

describe('formatSlateLabel', () => {
  it('labels a slate with its day and kickoff time in the viewer\'s timezone', () => {
    const kickoff = at('2025-09-07T17:00:00Z');
    const localDay = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(
      new Date(kickoff)
    );
    const localTime = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(kickoff));

    expect(formatSlateLabel(kickoff)).toBe(`${localDay} ${localTime}`);
  });

  it('labels each slate of a week distinctly', () => {
    const labels = buildSlateData(WEEK_1_2025).slates.map((slate) => slate.label);

    expect(new Set(labels).size).toBe(labels.length);
  });
});
