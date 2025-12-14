// Debug script to examine actual Sleeper API data
// Run this in the browser console when the app is loaded with your data

console.log('=== DEBUGGING SLEEPER DATA ===');

// Get the app context to access the raw data
const appElement = document.querySelector('[data-testid="app-context"]') || document.querySelector('.app');
if (!appElement) {
  console.log('Could not find app element. Make sure the app is loaded.');
} else {
  console.log('App found, checking for data...');
}

// Function to examine the data structure
function debugSleeperData() {
  // Try to access the data from the global scope or React dev tools
  console.log('=== USER TEAMS ===');
  
  // This will need to be run in the browser console where React dev tools can access the state
  console.log('Please run this in the browser console after loading your data:');
  console.log(`
// 1. Open React Dev Tools
// 2. Find the AppProvider component
// 3. Look at the state.userTeams, state.gamedayData
// 4. Or run this in console:

// Get React Fiber node (this is a hack, use React Dev Tools instead)
const reactFiber = document.querySelector('.app')._reactInternalFiber || 
                   document.querySelector('.app')._reactInternals;

if (reactFiber) {
  // Navigate to find the context
  console.log('React fiber found, but use React Dev Tools for better debugging');
}

// Alternative: Add console.log statements to the PlayerAnalysisService
console.log('Add these debug logs to PlayerAnalysisService.getUserPlayerCounts():');
console.log(\`
// In getUserPlayerCounts method, add:
console.log('=== DEBUG USER MATCHUP ===');
console.log('Team:', team);
console.log('User Matchup:', userMatchup);
console.log('Starters:', userMatchup?.starters);
console.log('Roster ID:', team.rosterId);
console.log('Matchup Roster ID:', userMatchup?.roster_id);
\`);
  `);
}

debugSleeperData();