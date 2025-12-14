// Types imported via app.ts AnalysisInput interface
import type { 
  UserTeam, 
  PlayerAllegiance, 
  GamedayData,
  AnalysisInput 
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
      
      // DEBUG: Log matchup data
      console.log(`=== DEBUG USER MATCHUP - ${league.name} ===`);
      console.log('Team roster ID:', team.rosterId);
      console.log('Available matchups:', leagueMatchups.map(m => ({ roster_id: m.roster_id, matchup_id: m.matchup_id })));
      console.log('Found user matchup:', userMatchup);
      
      if (!userMatchup || !userMatchup.starters) {
        console.warn(`No matchup or starters found for team ${team.leagueName}, roster ID ${team.rosterId}`);
        continue;
      }

      console.log('User starters:', userMatchup.starters);
      
      // Also check the roster data for comparison
      const userRoster = leagueRosters.find(r => r.roster_id === team.rosterId);
      if (userRoster) {
        console.log('Roster starters (for comparison):', userRoster.starters);
        console.log('Roster players:', userRoster.players);
      }

      // Count each starter
      for (const playerId of userMatchup.starters) {
        if (!playerId) continue; // Skip null/undefined players

        console.log(`Adding starter: ${playerId}`);

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

    console.log('Final user player counts:', Array.from(playerCounts.entries()));
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

      console.log(`=== DEBUG OPPONENT MATCHUP - ${league.name} ===`);
      console.log('User matchup ID:', userMatchup.matchup_id);
      console.log('User roster ID:', userMatchup.roster_id);
      console.log('Found opponent matchup:', opponentMatchup);

      if (!opponentMatchup || !opponentMatchup.starters) {
        console.warn(`No opponent matchup or starters found for ${league.name}`);
        continue;
      }

      console.log('Opponent starters:', opponentMatchup.starters);

      // Count each opponent starter
      for (const playerId of opponentMatchup.starters) {
        if (!playerId) continue; // Skip null/undefined players

        console.log(`Adding opponent starter: ${playerId}`);

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

    console.log('Final opponent player counts:', Array.from(playerCounts.entries()));
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
    for (const [playerId, userCount] of userCounts) {
      cheeringFor.push(this.createPlayerAllegiance(userCount));
    }

    // Process ALL opponent players - they all go in cheeringAgainst with their opponent counts and leagues
    for (const [playerId, opponentCount] of opponentCounts) {
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