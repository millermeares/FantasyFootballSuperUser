/**
 * Example usage of PlayerAnalysisService
 * This demonstrates how to use the service to analyze player data
 * and generate gameday recommendations
 */

import { PlayerAnalysisService } from './PlayerAnalysisService';
import type { AnalysisInput } from '../types/app';
// import type { SleeperLeague, SleeperRoster, SleeperMatchup } from '../types/sleeper';

// Example function showing how to use PlayerAnalysisService
export async function examplePlayerAnalysis() {
  console.log('=== PlayerAnalysisService Example ===\n');

  // Get the service instance
  const analysisService = PlayerAnalysisService.getInstance();

  // Example input data (in a real app, this would come from API calls)
  const exampleInput: AnalysisInput = {
    userId: 'user123',
    userTeams: [
      {
        leagueId: 'league1',
        leagueName: 'Friends League',
        rosterId: 1,
        isSelected: true
      },
      {
        leagueId: 'league2',
        leagueName: 'Work League',
        rosterId: 3,
        isSelected: true
      },
      {
        leagueId: 'league3',
        leagueName: 'Family League',
        rosterId: 2,
        isSelected: false // This team is not selected
      }
    ],
    leagues: [
      {
        league_id: 'league1',
        name: 'Friends League',
        season: '2024',
        status: 'in_season',
        sport: 'nfl',
        settings: {},
        total_rosters: 10
      },
      {
        league_id: 'league2',
        name: 'Work League',
        season: '2024',
        status: 'in_season',
        sport: 'nfl',
        settings: {},
        total_rosters: 12
      },
      {
        league_id: 'league3',
        name: 'Family League',
        season: '2024',
        status: 'in_season',
        sport: 'nfl',
        settings: {},
        total_rosters: 8
      }
    ],
    rosters: new Map([
      ['league1', [
        {
          roster_id: 1,
          owner_id: 'user123',
          players: ['4046', '4017', '2133'], // Example player IDs
          starters: ['4046', '4017'] // Josh Allen, Lamar Jackson
        },
        {
          roster_id: 5,
          owner_id: 'opponent1',
          players: ['4034', '4035', '2307'],
          starters: ['4034', '4035'] // Opponent starters
        }
      ]],
      ['league2', [
        {
          roster_id: 3,
          owner_id: 'user123',
          players: ['4046', '2133', '4039'], // Josh Allen appears again
          starters: ['4046', '2133'] // Josh Allen, DeAndre Hopkins
        },
        {
          roster_id: 7,
          owner_id: 'opponent2',
          players: ['4017', '4040', '4041'],
          starters: ['4017', '4040'] // Lamar Jackson (conflict!), other player
        }
      ]],
      ['league3', [
        {
          roster_id: 2,
          owner_id: 'user123',
          players: ['4050', '4051', '4052'],
          starters: ['4050', '4051'] // Different players (but team not selected)
        }
      ]]
    ]),
    matchups: new Map([
      ['league1', [
        {
          roster_id: 1,
          matchup_id: 1,
          starters: ['4046', '4017'], // User's starters
          players: ['4046', '4017', '2133'],
          points: 125.5,
          custom_points: null
        },
        {
          roster_id: 5,
          matchup_id: 1,
          starters: ['4034', '4035'], // Opponent's starters
          players: ['4034', '4035', '2307'],
          points: 118.2,
          custom_points: null
        }
      ]],
      ['league2', [
        {
          roster_id: 3,
          matchup_id: 2,
          starters: ['4046', '2133'], // User's starters (Josh Allen again)
          players: ['4046', '2133', '4039'],
          points: 132.8,
          custom_points: null
        },
        {
          roster_id: 7,
          matchup_id: 2,
          starters: ['4017', '4040'], // Opponent (Lamar Jackson - conflict!)
          players: ['4017', '4040', '4041'],
          points: 128.1,
          custom_points: null
        }
      ]]
    ])
  };

  // Validate the input first
  console.log('1. Validating input data...');
  const validationErrors = analysisService.validateInput(exampleInput);
  if (validationErrors.length > 0) {
    console.log('Validation errors found:');
    validationErrors.forEach(error => console.log(`   - ${error}`));
    return;
  }
  console.log('Input data is valid\n');

  // Perform the analysis
  console.log('2. Analyzing player data...');
  const gamedayData = analysisService.analyzePlayerData(exampleInput);

  // Display results
  console.log('3. Analysis Results:\n');

  console.log('PLAYERS TO CHEER FOR:');
  if (gamedayData.cheeringFor.length === 0) {
    console.log('   No players found in selected team lineups');
  } else {
    gamedayData.cheeringFor.forEach((player, index) => {
      console.log(`   ${index + 1}. ${player.playerName} (${player.position}, ${player.team})`);
      console.log(`      Appears in ${player.count} lineup(s): ${player.leagues.join(', ')}`);
    });
  }

  console.log('\nPLAYERS TO CHEER AGAINST:');
  if (gamedayData.cheeringAgainst.length === 0) {
    console.log('   No opponent players found');
  } else {
    gamedayData.cheeringAgainst.forEach((player, index) => {
      console.log(`   ${index + 1}. ${player.playerName} (${player.position}, ${player.team})`);
      console.log(`      Appears in ${player.count} opponent lineup(s): ${player.leagues.join(', ')}`);
    });
  }

  // Show statistics
  console.log('\n4. Analysis Statistics:');
  const stats = analysisService.getAnalysisStats(gamedayData);
  console.log(`   Total players to cheer for: ${stats.totalCheeringFor}`);
  console.log(`   Total players to cheer against: ${stats.totalCheeringAgainst}`);
  console.log(`   Selected teams: ${stats.selectedTeams} of ${stats.totalTeams}`);

  // Demonstrate conflict resolution
  console.log('\n5. Conflict Resolution Example:');
  console.log('   When a player appears in both user and opponent lineups,');
  console.log('   they are placed in the category with the higher count.');
  console.log('   In this example, if Lamar Jackson appears 1 time in user lineups');
  console.log('   and 1 time in opponent lineups, he would appear in "cheering for"');
  console.log('   (ties go to user preference).');

  return gamedayData;
}

// Example of how to handle team selection changes
export function exampleTeamSelectionUpdate(
  currentData: AnalysisInput,
  leagueId: string,
  isSelected: boolean
): AnalysisInput {
  console.log(`\n=== Team Selection Update Example ===`);
  console.log(`Toggling team selection for league: ${leagueId} to ${isSelected}`);

  // Update team selection
  const updatedInput = {
    ...currentData,
    userTeams: currentData.userTeams.map(team => 
      team.leagueId === leagueId 
        ? { ...team, isSelected }
        : team
    )
  };

  // Re-analyze with updated selections
  const analysisService = PlayerAnalysisService.getInstance();
  const updatedData = analysisService.analyzePlayerData(updatedInput);

  console.log(`Updated results:`);
  console.log(`  - Players to cheer for: ${updatedData.cheeringFor.length}`);
  console.log(`  - Players to cheer against: ${updatedData.cheeringAgainst.length}`);

  return updatedInput;
}

// Example error handling
export function exampleErrorHandling() {
  console.log('\n=== Error Handling Example ===');
  
  const analysisService = PlayerAnalysisService.getInstance();
  
  // Example of invalid input
  const invalidInput: AnalysisInput = {
    userId: '', // Invalid: empty user ID
    userTeams: [], // Invalid: no teams
    leagues: [],
    rosters: new Map(),
    matchups: new Map()
  };

  const errors = analysisService.validateInput(invalidInput);
  console.log('Validation errors for invalid input:');
  errors.forEach(error => console.log(`  ${error}`));

  // Example of missing data
  const incompleteInput: AnalysisInput = {
    userId: 'user123',
    userTeams: [
      {
        leagueId: 'league1',
        leagueName: 'Test League',
        rosterId: 1,
        isSelected: true
      }
    ],
    leagues: [
      {
        league_id: 'league1',
        name: 'Test League',
        season: '2024',
        status: 'in_season',
        sport: 'nfl',
        settings: {},
        total_rosters: 10
      }
    ],
    rosters: new Map(), // Missing roster data
    matchups: new Map() // Missing matchup data
  };

  const incompleteErrors = analysisService.validateInput(incompleteInput);
  console.log('\nValidation errors for incomplete data:');
  incompleteErrors.forEach(error => console.log(`  ${error}`));
}

// Run examples if this file is executed directly
// if (import.meta.url === `file://${process.argv[1]}`) {
//   examplePlayerAnalysis()
//     .then(() => exampleErrorHandling())
//     .catch(console.error);
// }