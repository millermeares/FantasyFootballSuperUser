/**
 * Example usage of PlayerService
 * This file demonstrates how to use the PlayerService in the application
 */

import { playerService } from './PlayerService';

// Example: Get player information
console.log('=== PlayerService Usage Examples ===');

// Get player name with fallback
const playerName = playerService.getPlayerName('1');
console.log(`Player name for ID '1': ${playerName}`); // "GJ Kinne"

const unknownPlayerName = playerService.getPlayerName('invalid_id');
console.log(`Player name for invalid ID: ${unknownPlayerName}`); // "Unknown Player"

// Get player position with fallback
const position = playerService.getPlayerPosition('1');
console.log(`Position for player '1': ${position}`); // "QB"

// Get player team with fallback
const team = playerService.getPlayerTeam('1');
console.log(`Team for player '1': ${team}`); // "FA" (free agent)

// Get complete player info
const playerInfo = playerService.getPlayerInfo('1');
console.log('Complete player info:', playerInfo);

// Search for players
const searchResults = playerService.searchPlayersByName('Kinne');
console.log(`Players matching 'Kinne':`, searchResults);

// Check if player exists
const exists = playerService.hasPlayer('1');
console.log(`Player '1' exists: ${exists}`);

// Example usage in a React component context:
export const exampleUsageInComponent = (playerIds: string[]) => {
  return playerIds.map(playerId => ({
    id: playerId,
    name: playerService.getPlayerName(playerId),
    position: playerService.getPlayerPosition(playerId),
    team: playerService.getPlayerTeam(playerId)
  }));
};

export default playerService;