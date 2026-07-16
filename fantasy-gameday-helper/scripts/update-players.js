import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLAYERS_URL = 'https://api.sleeper.app/v1/players/nfl';
const OUTPUT_PATH = resolve(__dirname, '../src/data/players.json');

async function updatePlayers() {
  console.log('Fetching players from Sleeper API...');

  const response = await fetch(PLAYERS_URL);

  if (!response.ok) {
    throw new Error(`Sleeper API returned ${response.status}: ${response.statusText}`);
  }

  const players = await response.json();
  const playerCount = Object.keys(players).length;

  writeFileSync(OUTPUT_PATH, JSON.stringify(players));
  console.log(`Wrote ${playerCount} players to src/data/players.json`);
}

updatePlayers().catch((err) => {
  console.error('Failed to update players:', err.message);
  process.exit(1);
});
