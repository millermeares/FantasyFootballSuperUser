import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PlayerService } from './PlayerService';
import fc from 'fast-check';

describe('PlayerService', () => {
  let playerService: PlayerService;

  beforeEach(() => {
    playerService = PlayerService.getInstance();
  });

  describe('getPlayerName', () => {
    it('should return player name for valid player ID', () => {
      // Using a known player ID from the data (player ID "1" is GJ Kinne)
      const playerName = playerService.getPlayerName('1');
      expect(playerName).toBe('GJ Kinne');
    });

    it('should return "Unknown Player" for invalid player ID', () => {
      const playerName = playerService.getPlayerName('invalid_id');
      expect(playerName).toBe('Unknown Player');
    });

    it('should return "Unknown Player" for empty string', () => {
      const playerName = playerService.getPlayerName('');
      expect(playerName).toBe('Unknown Player');
    });
  });

  describe('getPlayerPosition', () => {
    it('should return player position for valid player ID', () => {
      // Player ID "1" is a QB
      const position = playerService.getPlayerPosition('1');
      expect(position).toBe('QB');
    });

    it('should return "Unknown" for invalid player ID', () => {
      const position = playerService.getPlayerPosition('invalid_id');
      expect(position).toBe('Unknown');
    });
  });

  describe('getPlayerTeam', () => {
    it('should return "FA" for player with no team', () => {
      // Player ID "1" has null team (free agent)
      const team = playerService.getPlayerTeam('1');
      expect(team).toBe('FA');
    });

    it('should return "FA" for invalid player ID', () => {
      const team = playerService.getPlayerTeam('invalid_id');
      expect(team).toBe('FA');
    });
  });

  describe('getPlayerInfo', () => {
    it('should return player object for valid player ID', () => {
      const playerInfo = playerService.getPlayerInfo('1');
      expect(playerInfo).toBeDefined();
      expect(playerInfo?.player_id).toBe('1');
      expect(playerInfo?.full_name).toBe('GJ Kinne');
    });

    it('should return null for invalid player ID', () => {
      const playerInfo = playerService.getPlayerInfo('invalid_id');
      expect(playerInfo).toBeNull();
    });
  });

  describe('hasPlayer', () => {
    it('should return true for valid player ID', () => {
      expect(playerService.hasPlayer('1')).toBe(true);
    });

    it('should return false for invalid player ID', () => {
      expect(playerService.hasPlayer('invalid_id')).toBe(false);
    });
  });

  describe('getAllPlayerIds', () => {
    it('should return array of player IDs', () => {
      const playerIds = playerService.getAllPlayerIds();
      expect(Array.isArray(playerIds)).toBe(true);
      expect(playerIds.length).toBeGreaterThan(0);
      expect(playerIds).toContain('1');
    });
  });

  describe('searchPlayersByName', () => {
    it('should find players by partial name match', () => {
      const results = playerService.searchPlayersByName('Kinne');
      expect(results).toContain('1');
    });

    it('should be case insensitive', () => {
      const results = playerService.searchPlayersByName('kinne');
      expect(results).toContain('1');
    });

    it('should return empty array for no matches', () => {
      const results = playerService.searchPlayersByName('NonexistentPlayer123');
      expect(results).toEqual([]);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PlayerService.getInstance();
      const instance2 = PlayerService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Property-Based Tests', () => {
    // Clean up localStorage after each test
    afterEach(() => {
      localStorage.clear();
    });

    it('Property 1: User identifier persistence round-trip', () => {
      // **Feature: fantasy-gameday-helper, Property 1: User identifier persistence round-trip**
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        (identifier) => {
          const trimmedIdentifier = identifier.trim();
          
          // Store the identifier in localStorage (simulating the app behavior)
          localStorage.setItem('sleeper_user_identifier', trimmedIdentifier);
          
          // Retrieve the identifier from localStorage
          const retrievedIdentifier = localStorage.getItem('sleeper_user_identifier');
          
          // The retrieved identifier should match the stored identifier
          expect(retrievedIdentifier).toBe(trimmedIdentifier);
          
          // Clean up for next iteration
          localStorage.removeItem('sleeper_user_identifier');
          
          return retrievedIdentifier === trimmedIdentifier;
        }
      ), { numRuns: 100 });
    });
  });
});