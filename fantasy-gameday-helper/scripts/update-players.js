import {
  copyFileSync,
  existsSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLAYERS_URL = 'https://api.sleeper.app/v1/players/nfl';
const PACKAGE_ROOT = resolve(__dirname, '..');
const OUTPUT_PATH = resolve(PACKAGE_ROOT, 'src/data/players.json');
const TEMP_PATH = `${OUTPUT_PATH}.tmp`;
const BACKUP_PATH = `${OUTPUT_PATH}.backup`;

/**
 * Fetch the Sleeper player map and write it to src/data/players.json.
 *
 * The response is written atomically (temp file + rename) so an interrupted run
 * cannot leave a truncated JSON file behind, and the previous file is kept until
 * the integrity tests pass so a bad response can be rolled back.
 */
async function fetchPlayers() {
  console.log('Fetching players from Sleeper API...');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(PLAYERS_URL, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(
        `Sleeper API returned ${response.status}: ${response.statusText}`
      );
    }

    const players = await response.json();

    if (!players || typeof players !== 'object' || Array.isArray(players)) {
      throw new Error(
        'Sleeper API returned invalid data format: expected an object'
      );
    }

    const playerCount = Object.keys(players).length;
    if (playerCount === 0) {
      throw new Error('Sleeper API returned empty player data');
    }

    writeFileSync(TEMP_PATH, JSON.stringify(players, null, 2));
    renameSync(TEMP_PATH, OUTPUT_PATH);
    console.log(`Wrote ${playerCount} players to src/data/players.json`);
  } finally {
    clearTimeout(timeout);
    rmSync(TEMP_PATH, { force: true });
  }
}

/**
 * Run the players.json integrity tests against the file just written.
 * @returns true if the data passed validation
 */
function validatePlayers() {
  console.log('\nValidating player data...');

  const result = spawnSync('npm', ['run', 'test:data'], {
    cwd: PACKAGE_ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) {
    throw new Error(`Could not run integrity tests: ${result.error.message}`);
  }

  return result.status === 0;
}

async function updatePlayers() {
  const hadPreviousData = existsSync(OUTPUT_PATH);
  if (hadPreviousData) {
    copyFileSync(OUTPUT_PATH, BACKUP_PATH);
  }

  try {
    await fetchPlayers();

    if (!validatePlayers()) {
      if (hadPreviousData) {
        copyFileSync(BACKUP_PATH, OUTPUT_PATH);
        throw new Error(
          'Player data failed integrity tests. The previous players.json has been restored - ' +
            'nothing was changed. See the failures above.'
        );
      }
      throw new Error(
        'Player data failed integrity tests. There was no previous players.json to restore, ' +
          'so the fetched data was kept for inspection. See the failures above.'
      );
    }

    console.log('\nPlayer data updated and validated.');
  } finally {
    rmSync(BACKUP_PATH, { force: true });
  }
}

updatePlayers().catch((err) => {
  console.error(`\nFailed to update players: ${err.message}`);
  process.exit(1);
});
