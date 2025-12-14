import playersResponse from '../data/players.json';
import type { SleeperPlayerData } from '../types';

/**
 * PlayerService provides methods for looking up player information
 * with graceful fallbacks for missing data
 */
export class PlayerService {
  private static instance: PlayerService;
  private playersData: SleeperPlayerData;

  private constructor() {
    // Extract the actual player data from the axios response structure
    this.playersData = (playersResponse as any).data;
  }

  /**
   * Get singleton instance of PlayerService
   */
  public static getInstance(): PlayerService {
    if (!PlayerService.instance) {
      PlayerService.instance = new PlayerService();
    }
    return PlayerService.instance;
  }

  /**
   * Get player's full name by player ID
   * @param playerId - The Sleeper player ID
   * @returns Player's full name or 'Unknown Player' if not found
   */
  public getPlayerName(playerId: string): string {
    const player = this.playersData[playerId];
    if (!player || !player.full_name) {
      return 'Unknown Player';
    }
    return player.full_name;
  }

  /**
   * Get player's position by player ID
   * @param playerId - The Sleeper player ID
   * @returns Player's position or 'Unknown' if not found
   */
  public getPlayerPosition(playerId: string): string {
    const player = this.playersData[playerId];
    if (!player || !player.position) {
      return 'Unknown';
    }
    return player.position;
  }

  /**
   * Get player's team by player ID
   * @param playerId - The Sleeper player ID
   * @returns Player's team abbreviation or 'FA' if not found or free agent
   */
  public getPlayerTeam(playerId: string): string {
    const player = this.playersData[playerId];
    if (!player || !player.team) {
      return 'FA';
    }
    return player.team;
  }

  /**
   * Get complete player information by player ID
   * @param playerId - The Sleeper player ID
   * @returns Player data object or null if not found
   */
  public getPlayerInfo(playerId: string): SleeperPlayerData[string] | null {
    const player = this.playersData[playerId];
    return player || null;
  }

  /**
   * Check if a player exists in the data
   * @param playerId - The Sleeper player ID
   * @returns true if player exists, false otherwise
   */
  public hasPlayer(playerId: string): boolean {
    return playerId in this.playersData;
  }

  /**
   * Get all player IDs
   * @returns Array of all player IDs
   */
  public getAllPlayerIds(): string[] {
    return Object.keys(this.playersData);
  }

  /**
   * Search for players by name (case-insensitive partial match)
   * @param searchTerm - The search term to match against player names
   * @returns Array of player IDs that match the search term
   */
  public searchPlayersByName(searchTerm: string): string[] {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return Object.keys(this.playersData).filter(playerId => {
      const player = this.playersData[playerId];
      return player.full_name?.toLowerCase().includes(lowerSearchTerm) ||
             player.first_name?.toLowerCase().includes(lowerSearchTerm) ||
             player.last_name?.toLowerCase().includes(lowerSearchTerm);
    });
  }
}

// Export a default instance for convenience
export const playerService = PlayerService.getInstance();