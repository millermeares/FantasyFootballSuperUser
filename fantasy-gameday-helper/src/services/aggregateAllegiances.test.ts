import { describe, it, expect } from 'vitest';
import { aggregateAllegiances } from './PlayerAnalysisService';
import type { PlayerAllegiance } from '../types/app';

function allegiance(
  playerId: string,
  count: number,
  leagues: string[],
  overrides: Partial<PlayerAllegiance> = {}
): PlayerAllegiance {
  return {
    playerId,
    playerName: `Player ${playerId}`,
    position: 'RB',
    team: 'CIN',
    count,
    leagues,
    ...overrides,
  };
}

describe('aggregateAllegiances', () => {
  it('returns an empty list when there is nothing on either side', () => {
    expect(aggregateAllegiances([], [])).toEqual([]);
  });

  it('merges a player appearing on both sides into a single row', () => {
    const result = aggregateAllegiances(
      [allegiance('a', 3, ['Alpha', 'Bravo', 'Charlie'])],
      [allegiance('a', 1, ['Delta'])]
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      playerId: 'a',
      forCount: 3,
      againstCount: 1,
      totalCount: 4,
      netCount: 2,
      forLeagues: ['Alpha', 'Bravo', 'Charlie'],
      againstLeagues: ['Delta'],
    });
  });

  it('zeroes the missing side for a player only on one list', () => {
    const result = aggregateAllegiances(
      [allegiance('mine', 2, ['Alpha', 'Bravo'])],
      [allegiance('theirs', 4, ['Alpha', 'Bravo', 'Charlie', 'Delta'])]
    );

    const mine = result.find((p) => p.playerId === 'mine');
    const theirs = result.find((p) => p.playerId === 'theirs');

    expect(mine).toMatchObject({
      forCount: 2,
      againstCount: 0,
      totalCount: 2,
      netCount: 2,
      againstLeagues: [],
    });
    expect(theirs).toMatchObject({
      forCount: 0,
      againstCount: 4,
      totalCount: 4,
      netCount: -4,
      forLeagues: [],
    });
  });

  it('carries player identity through from whichever side is seen first', () => {
    const result = aggregateAllegiances(
      [],
      [
        allegiance('x', 1, ['Alpha'], {
          playerName: 'Jalen Hurts',
          position: 'QB',
          team: 'PHI',
        }),
      ]
    );

    expect(result[0]).toMatchObject({
      playerName: 'Jalen Hurts',
      position: 'QB',
      team: 'PHI',
    });
  });

  it('sorts by total appearances descending, regardless of side', () => {
    const result = aggregateAllegiances(
      [allegiance('low', 1, ['Alpha']), allegiance('high', 5, ['Alpha'])],
      [allegiance('negative', 3, ['Alpha'])]
    );

    // A player faced on 3 teams outranks one started on only 1
    expect(result.map((p) => p.playerId)).toEqual(['high', 'negative', 'low']);
    expect(result.map((p) => p.totalCount)).toEqual([5, 3, 1]);
  });

  it('breaks a total tie in favour of the better net', () => {
    // Both total 4: one is +4 for you, the other is a 2-2 wash
    const result = aggregateAllegiances(
      [allegiance('mine', 4, ['Alpha']), allegiance('split', 2, ['Alpha'])],
      [allegiance('split', 2, ['Bravo'])]
    );

    expect(result.map((p) => p.playerId)).toEqual(['mine', 'split']);
  });

  it('breaks a remaining tie by name for a stable order', () => {
    const result = aggregateAllegiances(
      [
        allegiance('b', 1, ['Alpha'], { playerName: 'Zach Zeta' }),
        allegiance('a', 1, ['Alpha'], { playerName: 'Aaron Alpha' }),
      ],
      []
    );

    expect(result.map((p) => p.playerName)).toEqual(['Aaron Alpha', 'Zach Zeta']);
  });

  it('copies league arrays so callers cannot mutate the source data', () => {
    const forLeagues = ['Alpha'];
    const againstLeagues = ['Bravo'];

    const result = aggregateAllegiances(
      [allegiance('a', 1, forLeagues)],
      [allegiance('a', 1, againstLeagues)]
    );

    result[0].forLeagues.push('Mutated');
    result[0].againstLeagues.push('Mutated');

    expect(forLeagues).toEqual(['Alpha']);
    expect(againstLeagues).toEqual(['Bravo']);
  });

  it('leaves the input arrays untouched', () => {
    const cheeringFor = [allegiance('a', 1, ['Alpha'])];
    const cheeringAgainst = [allegiance('b', 2, ['Bravo'])];

    aggregateAllegiances(cheeringFor, cheeringAgainst);

    expect(cheeringFor).toHaveLength(1);
    expect(cheeringFor[0].count).toBe(1);
    expect(cheeringAgainst[0].count).toBe(2);
  });
});
