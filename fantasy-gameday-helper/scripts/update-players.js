import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLAYERS_URL = 'https://api.sleeper.app/v1/players/nfl';
const OUTPUT_PATH = resolve(__dirname, '../src/data/players.json');

async function updatePlayers() {
  console.log('Fetching players from Sleeper API...');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(PLAYERS_URL, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Sleeper API returned ${response.status}: ${response.statusText}`);
    }

    const players = await response.json();

    if (!players || typeof players !== 'object' || Array.isArray(players)) {
      throw new Error('Sleeper API returned invalid data format: expected an object');
    }

    const playerCount = Object.keys(players).length;
    if (playerCount === 0) {
      throw new Error('Sleeper API returned empty player data');
    }

    writeFileSync(OUTPUT_PATH, JSON.stringify(players, null, 2));
    console.log(`Wrote ${playerCount} players to src/data/players.json`);
  } finally {
    clearTimeout(timeout);
  }
}

updatePlayers().catch((err) => {
  console.error('Failed to update players:', err.message);
  process.exit(1);
});
