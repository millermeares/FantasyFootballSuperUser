// Types imported via app.ts AnalysisInput interface
import type { 
  UserTeam, 
  PlayerAllegiance, 
  GamedayData,
  AnalysisInput,
  PlayerExposure,
  ExposureData
} from '../types/app';
import { PlayerService } from './PlayerService';

/**
 * Internal structure for tracking player counts
 */
interface PlayerCount {
  playerId: string;
  count: number;
  leagues: string[]; // League names where this player appears
}

/**
 * Service for analyzing player data and determining allegiances
 * Implements the core logic for counting player appearances and resolving conflicts
 */
export class PlayerAnalysisService {
  private static instance: PlayerAnalysisService;
  private playerService: PlayerService;

  private constructor() {
    this.playerService = PlayerService.getInstance();
  }

  /**
   * Get singleton instance of PlayerAnalysisService
   */
  public static getInstance(): PlayerAnalysisService {
    if (!PlayerAnalysisService.instance) {
      PlayerAnalysisService.instance = new PlayerAnalysisService();
    }
    return PlayerAnalysisService.instance;
  }

  /**
   * Analyze player data and generate gameday recommendations
   * @param input - All necessary data for analysis
   * @returns GamedayData with cheering for/against recommendations
   */
  public analyzePlayerData(input: AnalysisInput): GamedayData {
    // Filter to only selected teams
    const selectedTeams = input.userTeams.filter(team => team.isSelected);
    
    // Get user player counts (players in user's starting lineups)
    const userPlayerCounts = this.getUserPlayerCounts(input, selectedTeams);
    
    // Get opponent player counts (players in opponent starting lineups)
    const opponentPlayerCounts = this.getOpponentPlayerCounts(input, selectedTeams);
    
    // Resolve conflicts and create final allegiances
    const { cheeringFor, cheeringAgainst } = this.resolvePlayerConflicts(
      userPlayerCounts, 
      opponentPlayerCounts
    );

    return {
      cheeringFor: this.sortPlayersByCount(cheeringFor),
      cheeringAgainst: this.sortPlayersByCount(cheeringAgainst),
      userTeams: input.userTeams
    };
  }

  /**
   * Count appearances of players in user's starting lineups
   * Requirements: 3.1, 3.2
   */
  private getUserPlayerCounts(
    input: AnalysisInput, 
    selectedTeams: UserTeam[]
  ): Map<string, PlayerCount> {
    const playerCounts = new Map<string, PlayerCount>();

    for (const team of selectedTeams) {
      const leagueMatchups = input.matchups.get(team.leagueId);
      const leagueRosters = input.rosters.get(team.leagueId);
      const league = input.leagues.find(l => l.league_id === team.leagueId);

      if (!leagueMatchups || !leagueRosters || !league) {
        console.warn(`Missing data for league ${team.leagueName}:`, {
          hasMatchups: !!leagueMatchups,
          hasRosters: !!leagueRosters,
          hasLeague: !!league
        });
        continue;
      }

      // Find the user's matchup for this team
      const userMatchup = leagueMatchups.find(m => m.roster_id === team.rosterId);
      
      if (!userMatchup || !userMatchup.starters) {
        console.warn(`No matchup or starters found for team ${team.leagueName}, roster ID ${team.rosterId}`);
        continue;
      }

      // Count each starter
      for (const playerId of userMatchup.starters) {
        if (!playerId) continue; // Skip null/undefined players

        const existing = playerCounts.get(playerId);
        if (existing) {
          existing.count++;
          if (!existing.leagues.includes(league.name)) {
            existing.leagues.push(league.name);
          }
        } else {
          playerCounts.set(playerId, {
            playerId,
            count: 1,
            leagues: [league.name]
          });
        }
      }
    }

    return playerCounts;
  }

  /**
   * Count appearances of players in opponent starting lineups
   * Requirements: 4.1, 4.2
   */
  private getOpponentPlayerCounts(
    input: AnalysisInput, 
    selectedTeams: UserTeam[]
  ): Map<string, PlayerCount> {
    const playerCounts = new Map<string, PlayerCount>();

    for (const team of selectedTeams) {
      const leagueMatchups = input.matchups.get(team.leagueId);
      const league = input.leagues.find(l => l.league_id === team.leagueId);

      if (!leagueMatchups || !league) {
        continue;
      }

      // Find the user's matchup to determine opponent
      const userMatchup = leagueMatchups.find(m => m.roster_id === team.rosterId);
      if (!userMatchup) {
        continue;
      }

      // Find opponent matchup (same matchup_id, different roster_id)
      const opponentMatchup = leagueMatchups.find(m => 
        m.matchup_id === userMatchup.matchup_id && 
        m.roster_id !== userMatchup.roster_id
      );

      if (!opponentMatchup || !opponentMatchup.starters) {
        console.warn(`No opponent matchup or starters found for ${league.name}`);
        continue;
      }

      // Count each opponent starter
      for (const playerId of opponentMatchup.starters) {
        if (!playerId) continue; // Skip null/undefined players

        const existing = playerCounts.get(playerId);
        if (existing) {
          existing.count++;
          if (!existing.leagues.includes(league.name)) {
            existing.leagues.push(league.name);
          }
        } else {
          playerCounts.set(playerId, {
            playerId,
            count: 1,
            leagues: [league.name]
          });
        }
      }
    }

    return playerCounts;
  }

  /**
   * Create independent player lists - no conflict resolution
   * Each table shows players independently with their respective counts and leagues
   */
  private resolvePlayerConflicts(
    userCounts: Map<string, PlayerCount>,
    opponentCounts: Map<string, PlayerCount>
  ): { cheeringFor: PlayerAllegiance[]; cheeringAgainst: PlayerAllegiance[] } {
    const cheeringFor: PlayerAllegiance[] = [];
    const cheeringAgainst: PlayerAllegiance[] = [];

    // Process ALL user players - they all go in cheeringFor with their user counts and leagues
    for (const [, userCount] of userCounts) {
      cheeringFor.push(this.createPlayerAllegiance(userCount));
    }

    // Process ALL opponent players - they all go in cheeringAgainst with their opponent counts and leagues
    for (const [, opponentCount] of opponentCounts) {
      cheeringAgainst.push(this.createPlayerAllegiance(opponentCount));
    }

    return { cheeringFor, cheeringAgainst };
  }

  /**
   * Convert PlayerCount to PlayerAllegiance with player information
   */
  private createPlayerAllegiance(playerCount: PlayerCount): PlayerAllegiance {
    return {
      playerId: playerCount.playerId,
      playerName: this.playerService.getPlayerName(playerCount.playerId),
      position: this.playerService.getPlayerPosition(playerCount.playerId),
      team: this.playerService.getPlayerTeam(playerCount.playerId),
      count: playerCount.count,
      leagues: [...playerCount.leagues] // Create a copy
    };
  }

  /**
   * Sort players by appearance count in descending order
   * Requirements: 3.2, 4.2
   */
  private sortPlayersByCount(players: PlayerAllegiance[]): PlayerAllegiance[] {
    return players.sort((a, b) => {
      // Primary sort: count (descending)
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      
      // Secondary sort: player name (ascending) for consistent ordering
      return a.playerName.localeCompare(b.playerName);
    });
  }

  /**
   * Extract all players from a roster (including starters, bench, taxi, IR)
   * Requirements: 11.1
   * @param roster - The roster to extract players from
   * @returns Array of all player IDs in the roster
   */
  public getAllRosterPlayers(roster: import('../types/sleeper').SleeperRoster): string[] {
    // The roster.players array contains ALL players (starters, bench, taxi, IR)
    // Filter out null/undefined values
    if (!roster || !roster.players) {
      console.warn('Invalid roster data:', roster);
      return [];
    }
    return roster.players.filter(playerId => playerId != null);
  }

  /**
   * Calculate exposure report showing ownership percentages across selected teams
   * Requirements: 11.1, 11.2
   * @param input - All necessary data for analysis
   * @returns ExposureData with ownership percentages
   */
  public calculateExposureReport(input: AnalysisInput): ExposureData {
    // Filter to only selected teams
    const selectedTeams = input.userTeams.filter(team => team.isSelected);
    const totalSelectedTeams = selectedTeams.length;

    if (totalSelectedTeams === 0) {
      return {
        exposureReport: [],
        totalSelectedTeams: 0
      };
    }

    // Track player appearances across all selected teams
    const playerExposureMap = new Map<string, {
      teamCount: number;
      leagues: string[];
    }>();

    // Process each selected team
    for (const team of selectedTeams) {
      const leagueRosters = input.rosters.get(team.leagueId);
      const league = input.leagues.find(l => l.league_id === team.leagueId);

      if (!leagueRosters || !league) {
        console.warn(`Missing data for league ${team.leagueName}:`, {
          hasRosters: !!leagueRosters,
          hasLeague: !!league
        });
        continue;
      }

      // Find the user's roster for this team
      const userRoster = leagueRosters.find(r => r.roster_id === team.rosterId);
      
      if (!userRoster) {
        console.warn(`No roster found for team ${team.leagueName}, roster ID ${team.rosterId}`);
        continue;
      }

      // Get all players from this roster (including bench, taxi, IR)
      const allPlayers = this.getAllRosterPlayers(userRoster);
      
      if (!allPlayers || allPlayers.length === 0) {
        console.warn(`No players found for team ${team.leagueName}, roster ID ${team.rosterId}`);
        continue;
      }

      // Count each player
      for (const playerId of allPlayers) {
        if (!playerId) continue; // Skip null/undefined players

        const existing = playerExposureMap.get(playerId);
        if (existing) {
          existing.teamCount++;
          if (!existing.leagues.includes(league.name)) {
            existing.leagues.push(league.name);
          }
        } else {
          playerExposureMap.set(playerId, {
            teamCount: 1,
            leagues: [league.name]
          });
        }
      }
    }

    // Convert to PlayerExposure objects and calculate percentages
    const exposureReport: PlayerExposure[] = [];
    
    for (const [playerId, data] of playerExposureMap) {
      const exposurePercentage = (data.teamCount / totalSelectedTeams) * 100;
      
      exposureReport.push({
        playerId,
        playerName: this.playerService.getPlayerName(playerId),
        position: this.playerService.getPlayerPosition(playerId),
        team: this.playerService.getPlayerTeam(playerId),
        exposurePercentage,
        teamCount: data.teamCount,
        totalTeams: totalSelectedTeams,
        leagues: [...data.leagues] // Create a copy
      });
    }

    // Sort by exposure percentage in descending order
    exposureReport.sort((a, b) => {
      // Primary sort: exposure percentage (descending)
      if (b.exposurePercentage !== a.exposurePercentage) {
        return b.exposurePercentage - a.exposurePercentage;
      }
      
      // Secondary sort: player name (ascending) for consistent ordering
      return a.playerName.localeCompare(b.playerName);
    });

    return {
      exposureReport,
      totalSelectedTeams
    };
  }

  /**
   * Get exposure percentage for a specific player across selected teams
   * Requirements: 11.2
   * @param playerId - The player ID to calculate exposure for
   * @param userTeams - Array of user teams
   * @param rosters - Map of league rosters
   * @returns Exposure percentage (0-100)
   */
  public getPlayerExposurePercentage(
    playerId: string,
    userTeams: UserTeam[],
    rosters: Map<string, import('../types/sleeper').SleeperRoster[]>
  ): number {
    const selectedTeams = userTeams.filter(team => team.isSelected);
    const totalSelectedTeams = selectedTeams.length;

    if (totalSelectedTeams === 0) {
      return 0;
    }

    let teamsWithPlayer = 0;

    // Check each selected team for this player
    for (const team of selectedTeams) {
      const leagueRosters = rosters.get(team.leagueId);
      
      if (!leagueRosters) {
        continue;
      }

      // Find the user's roster for this team
      const userRoster = leagueRosters.find(r => r.roster_id === team.rosterId);
      
      if (!userRoster) {
        continue;
      }

      // Check if this roster contains the player
      const allPlayers = this.getAllRosterPlayers(userRoster);
      if (allPlayers.includes(playerId)) {
        teamsWithPlayer++;
      }
    }

    return (teamsWithPlayer / totalSelectedTeams) * 100;
  }

  /**
   * Validate input data for analysis
   * @param input - Input data to validate
   * @returns Array of validation errors (empty if valid)
   */
  public validateInput(input: AnalysisInput): string[] {
    const errors: string[] = [];

    if (!input.userId || input.userId.trim() === '') {
      errors.push('User ID is required');
    }

    if (!input.userTeams || input.userTeams.length === 0) {
      errors.push('At least one user team is required');
    }

    if (!input.leagues || input.leagues.length === 0) {
      errors.push('League information is required');
    }

    // Check that selected teams have corresponding data
    const selectedTeams = input.userTeams.filter(team => team.isSelected);
    if (selectedTeams.length === 0) {
      errors.push('At least one team must be selected');
    }

    for (const team of selectedTeams) {
      if (!input.rosters.has(team.leagueId)) {
        errors.push(`Missing roster data for league: ${team.leagueName}`);
      }
      
      if (!input.matchups.has(team.leagueId)) {
        errors.push(`Missing matchup data for league: ${team.leagueName}`);
      }
    }

    return errors;
  }

  /**
   * Get statistics about the analysis results
   */
  public getAnalysisStats(data: GamedayData): {
    totalCheeringFor: number;
    totalCheeringAgainst: number;
    selectedTeams: number;
    totalTeams: number;
  } {
    return {
      totalCheeringFor: data.cheeringFor.length,
      totalCheeringAgainst: data.cheeringAgainst.length,
      selectedTeams: data.userTeams.filter(team => team.isSelected).length,
      totalTeams: data.userTeams.length
    };
  }
}

// Export a default instance for convenience
export const playerAnalysisService = PlayerAnalysisService.getInstance();