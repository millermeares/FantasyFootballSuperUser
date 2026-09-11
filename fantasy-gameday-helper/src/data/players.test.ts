import { describe, it, expect } from 'vitest';
import playersJson from './players.json' assert { type: 'json' };
import { PlayerService } from '../services/PlayerService';
import type { SleeperPlayerData, SleeperPlayerEntry } from '../types';

/**
 * Data integrity tests for src/data/players.json.
 *
 * players.json is a build-time import (see PlayerService), so a bad or partial
 * Sleeper response ships straight to production. `npm run update-players` only
 * checks that the payload is a non-empty object, which a truncated or garbage
 * response can satisfy. These tests are the real gate: run them after every
 * update-players to confirm the file is still usable.
 *
 * Floors are set well below the counts observed in the snapshot they were
 * written against (12,227 players, Aug 2025) so ordinary Sleeper churn does not
 * fail the build. They exist to catch collapse, not drift.
 */

const players = playersJson as SleeperPlayerData;
const entries = Object.entries(players);

/** Positions the app surfaces to users. */
const FANTASY_POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

/** Roughly 70% of the counts in the reference snapshot. */
const MIN_TOTAL_PLAYERS = 10_000;
const MIN_BY_POSITION: Record<string, number> = {
  QB: 330,
  RB: 650,
  WR: 1250,
  TE: 590,
  K: 130,
};

/**
 * Fantasy-position players with a current team. This is the number that matters
 * during the season, and the one a partial Sleeper response destroys while
 * leaving the total player count untouched. Observed: 881.
 */
const MIN_ROSTERED_FANTASY_PLAYERS = 600;

/** The 32 current NFL teams. Every one must have a DEF entry. */
const CURRENT_TEAMS = [
  'ARI',
  'ATL',
  'BAL',
  'BUF',
  'CAR',
  'CHI',
  'CIN',
  'CLE',
  'DAL',
  'DEN',
  'DET',
  'GB',
  'HOU',
  'IND',
  'JAX',
  'KC',
  'LAC',
  'LAR',
  'LV',
  'MIA',
  'MIN',
  'NE',
  'NO',
  'NYG',
  'NYJ',
  'PHI',
  'PIT',
  'SEA',
  'SF',
  'TB',
  'TEN',
  'WAS',
];

/** Relocated/renamed franchises still attached to historical players. */
const LEGACY_TEAMS = ['OAK', 'STL', 'SD', 'LA', 'JAC'];

const VALID_TEAMS = new Set([...CURRENT_TEAMS, ...LEGACY_TEAMS]);

/** Mirrors PlayerService.getPlayerName's resolution order. */
const resolveName = (player: SleeperPlayerEntry): string | null => {
  if (player.full_name) return player.full_name;
  if (player.first_name && player.last_name) {
    return `${player.first_name} ${player.last_name}`;
  }
  return null;
};

/** Keeps failure output readable when a whole-file problem trips a check. */
const sample = (violations: string[], limit = 10): string[] =>
  violations.slice(0, limit);

describe('players.json integrity', () => {
  describe('file shape', () => {
    it('is a non-empty object keyed by player ID', () => {
      expect(players).toBeTypeOf('object');
      expect(players).not.toBeNull();
      expect(Array.isArray(players)).toBe(false);
      expect(entries.length).toBeGreaterThan(0);
    });

    it(`contains at least ${MIN_TOTAL_PLAYERS.toLocaleString()} players`, () => {
      expect(entries.length).toBeGreaterThanOrEqual(MIN_TOTAL_PLAYERS);
    });

    it('has no empty or whitespace-only keys', () => {
      const violations = entries
        .filter(([playerId]) => playerId.trim() === '')
        .map(([playerId]) => JSON.stringify(playerId));

      expect(sample(violations)).toEqual([]);
    });

    it('has an object for every entry', () => {
      const violations = entries
        .filter(
          ([, player]) =>
            typeof player !== 'object' ||
            player === null ||
            Array.isArray(player)
        )
        .map(([playerId]) => playerId);

      expect(sample(violations)).toEqual([]);
    });
  });

  describe('per-player invariants', () => {
    it('has a player_id on every entry that matches its key', () => {
      const violations = entries
        .filter(
          ([playerId, player]) => String(player.player_id ?? '') !== playerId
        )
        .map(
          ([playerId, player]) =>
            `${playerId} -> player_id=${JSON.stringify(player.player_id)}`
        );

      expect(sample(violations)).toEqual([]);
    });

    it('can resolve a display name for every entry', () => {
      const violations = entries
        .filter(([, player]) => resolveName(player) === null)
        .map(([playerId]) => playerId);

      expect(sample(violations)).toEqual([]);
    });

    it('uses known team abbreviations', () => {
      const badTeams = new Set<string>();
      for (const [, player] of entries) {
        if (player.team != null && !VALID_TEAMS.has(player.team)) {
          badTeams.add(String(player.team));
        }
      }

      expect([...badTeams]).toEqual([]);
    });

    it('uses string positions when a position is present', () => {
      const violations = entries
        .filter(
          ([, player]) =>
            player.position != null && typeof player.position !== 'string'
        )
        .map(
          ([playerId, player]) =>
            `${playerId} -> position=${JSON.stringify(player.position)}`
        );

      expect(sample(violations)).toEqual([]);
    });
  });

  describe('fantasy coverage', () => {
    const byPosition = entries.reduce<Record<string, number>>(
      (counts, [, player]) => {
        if (typeof player.position === 'string') {
          counts[player.position] = (counts[player.position] ?? 0) + 1;
        }
        return counts;
      },
      {}
    );

    it.each(Object.entries(MIN_BY_POSITION))(
      'has at least %s %d players',
      (position, minimum) => {
        expect(byPosition[position] ?? 0).toBeGreaterThanOrEqual(minimum);
      }
    );

    it('has a DEF entry for all 32 current teams, keyed by team abbreviation', () => {
      const defenseKeys = entries
        .filter(([, player]) => player.position === 'DEF')
        .map(([playerId]) => playerId)
        .sort();

      expect(defenseKeys).toEqual([...CURRENT_TEAMS].sort());
    });

    it(`has at least ${MIN_ROSTERED_FANTASY_PLAYERS} rostered fantasy-position players`, () => {
      const rostered = entries.filter(
        ([, player]) =>
          typeof player.position === 'string' &&
          FANTASY_POSITIONS.includes(player.position) &&
          player.team != null
      );

      expect(rostered.length).toBeGreaterThanOrEqual(
        MIN_ROSTERED_FANTASY_PLAYERS
      );
    });
  });

  describe('canary players', () => {
    /**
     * Sleeper player IDs are stable, and a given ID's name and position never
     * change. Teams and active flags do, so they are deliberately not asserted.
     * If these lookups break, the file is not Sleeper player data.
     */
    const canaries = [
      { playerId: '4046', name: 'Patrick Mahomes', position: 'QB' },
      { playerId: '4034', name: 'Christian McCaffrey', position: 'RB' },
      { playerId: '6794', name: 'Justin Jefferson', position: 'WR' },
      { playerId: '7564', name: "Ja'Marr Chase", position: 'WR' },
      { playerId: '1466', name: 'Travis Kelce', position: 'TE' },
    ];

    it.each(canaries)(
      'resolves $name ($playerId) as $position',
      ({ playerId, name, position }) => {
        const player = players[playerId];

        expect(player).toBeDefined();
        expect(resolveName(player)).toBe(name);
        expect(player.position).toBe(position);
      }
    );
  });

  describe('PlayerService can consume the data', () => {
    const playerService = PlayerService.getInstance();

    const rosteredFantasyIds = entries
      .filter(
        ([, player]) =>
          typeof player.position === 'string' &&
          FANTASY_POSITIONS.includes(player.position) &&
          player.team != null
      )
      .map(([playerId]) => playerId);

    it('has rostered players to check', () => {
      // Without this the three checks below pass vacuously on an empty set,
      // which is exactly what a team-stripped Sleeper response produces.
      expect(rosteredFantasyIds.length).toBeGreaterThan(0);
    });

    it('resolves a real name for every rostered fantasy-position player', () => {
      const violations = rosteredFantasyIds.filter(
        (playerId) => playerService.getPlayerName(playerId) === 'Unknown Player'
      );

      expect(sample(violations)).toEqual([]);
    });

    it('resolves a real position for every rostered fantasy-position player', () => {
      const violations = rosteredFantasyIds.filter(
        (playerId) => playerService.getPlayerPosition(playerId) === 'Unknown'
      );

      expect(sample(violations)).toEqual([]);
    });

    it('resolves a real team for every rostered fantasy-position player', () => {
      const violations = rosteredFantasyIds.filter(
        (playerId) => playerService.getPlayerTeam(playerId) === 'FA'
      );

      expect(sample(violations)).toEqual([]);
    });
  });
});
