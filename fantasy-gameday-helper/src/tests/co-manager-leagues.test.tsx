import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { AppProvider } from '../context';
import { STORAGE_KEYS } from '../context/persistence';

/**
 * Regression tests for co-managed teams.
 *
 * Sleeper lets several users manage one team: one is the roster's `owner_id` and
 * the rest are listed in `co_owners`. `/user/{id}/leagues/nfl/{season}` returns
 * co-managed leagues just like owned ones, so a co-manager's league arrives with
 * no roster whose `owner_id` matches them. Matching on `owner_id` alone silently
 * dropped those leagues from the team list.
 *
 * Shapes below mirror live Sleeper data: user `zrut` co-manages the roster that
 * `cmvillacres` owns in "Thanos Was Right", and holds no roster of their own there.
 */

const mockSleeperApi = {
  getUser: vi.fn(),
  getUserLeagues: vi.fn(),
  getLeagueRosters: vi.fn(),
  getLeagueMatchups: vi.fn(),
  getNflState: vi.fn(),
  getWeekScores: vi.fn(),
};

vi.mock('../services/api/SleeperApiService', () => ({
  getSleeperApiService: () => mockSleeperApi,
}));

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

const CO_MANAGER_ID = '728361298638823424'; // zrut
const PRIMARY_OWNER_ID = '574767406840115200'; // cmvillacres
const STRANGER_ID = '447884739194384384';

const coManagerUser = {
  user_id: CO_MANAGER_ID,
  username: 'zrut',
  display_name: 'zrut',
};

const league = (league_id: string, name: string, total_rosters: number) => ({
  league_id,
  name,
  season: '2026',
  status: 'in_season' as const,
  sport: 'nfl' as const,
  settings: {},
  total_rosters,
});

/** A league the user owns outright, one they co-manage, and one they are not in. */
const OWNED_LEAGUE = league('owned_league', 'Poop Butt Dynasty League', 12);
const CO_MANAGED_LEAGUE = league('1312044234672467968', 'Thanos Was Right', 12);
const FOREIGN_LEAGUE = league('foreign_league', 'League Without The User', 10);

const roster = (
  roster_id: number,
  owner_id: string | null,
  co_owners: string[] | null = null
) => ({
  roster_id,
  owner_id,
  co_owners,
  players: [`p_${roster_id}_a`, `p_${roster_id}_b`],
  starters: [`p_${roster_id}_a`],
});

const ROSTERS_BY_LEAGUE: Record<string, ReturnType<typeof roster>[]> = {
  [OWNED_LEAGUE.league_id]: [roster(1, CO_MANAGER_ID), roster(2, PRIMARY_OWNER_ID)],
  // roster 12 is owned by cmvillacres and co-managed by zrut; zrut owns nothing here
  [CO_MANAGED_LEAGUE.league_id]: [
    roster(2, STRANGER_ID),
    roster(12, PRIMARY_OWNER_ID, [CO_MANAGER_ID]),
  ],
  [FOREIGN_LEAGUE.league_id]: [roster(1, PRIMARY_OWNER_ID), roster(2, STRANGER_ID)],
};

const TEAM_TOGGLE = /teams \(\d+\/\d+ selected\)/i;

/**
 * Render as a returning user. App only loads league data for a persisted
 * identifier, which is the path a user hits on every visit after the first.
 */
async function loadAppAsCoManager() {
  const user = userEvent.setup();

  render(
    <AppProvider>
      <App />
    </AppProvider>
  );

  await waitFor(
    () => {
      expect(screen.getByText(/welcome back, zrut/i)).toBeInTheDocument();
    },
    { timeout: 3000 }
  );

  return user;
}

/** Expand the collapsed team list so each league name is in the DOM. */
async function expandTeamList(user: ReturnType<typeof userEvent.setup>) {
  const toggle = await screen.findByRole('button', { name: TEAM_TOGGLE }, { timeout: 3000 });
  await act(async () => {
    await user.click(toggle);
  });
}

describe('co-managed leagues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockImplementation((key: string) =>
      key === STORAGE_KEYS.USER_IDENTIFIER ? 'zrut' : null
    );

    mockSleeperApi.getUser.mockResolvedValue(coManagerUser);
    mockSleeperApi.getUserLeagues.mockResolvedValue([
      OWNED_LEAGUE,
      CO_MANAGED_LEAGUE,
      FOREIGN_LEAGUE,
    ]);
    mockSleeperApi.getLeagueRosters.mockImplementation((leagueId: string) =>
      Promise.resolve(ROSTERS_BY_LEAGUE[leagueId] ?? [])
    );
    mockSleeperApi.getLeagueMatchups.mockResolvedValue([]);
    mockSleeperApi.getNflState.mockResolvedValue({
      week: 1,
      season: '2026',
      season_type: 'regular',
    });
    mockSleeperApi.getWeekScores.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('REGRESSION: lists a league where the user is a co-manager, not the primary owner', async () => {
    const user = await loadAppAsCoManager();
    await expandTeamList(user);

    // The bug: this league was dropped because no roster had owner_id === userId
    expect(screen.getByText('Thanos Was Right')).toBeInTheDocument();
  });

  it('maps the co-managed league to the shared roster, not a new one', async () => {
    const user = await loadAppAsCoManager();
    await expandTeamList(user);

    const coManaged = screen.getByText('Thanos Was Right').closest('.team-item');
    expect(coManaged).not.toBeNull();
    expect(coManaged).toHaveTextContent(`League ID: ${CO_MANAGED_LEAGUE.league_id}`);
  });

  it('still lists leagues the user owns outright', async () => {
    const user = await loadAppAsCoManager();
    await expandTeamList(user);

    expect(screen.getByText('Poop Butt Dynasty League')).toBeInTheDocument();
  });

  it('excludes leagues where the user is neither owner nor co-manager', async () => {
    const user = await loadAppAsCoManager();
    await expandTeamList(user);

    expect(screen.queryByText('League Without The User')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /teams \(2\/2 selected\)/i })
    ).toBeInTheDocument();
  });

  it('does not treat an unclaimed roster with a null owner as the user', async () => {
    mockSleeperApi.getUserLeagues.mockResolvedValue([CO_MANAGED_LEAGUE]);
    mockSleeperApi.getLeagueRosters.mockResolvedValue([
      roster(1, null),
      roster(2, null, null),
    ]);

    await loadAppAsCoManager();

    // No roster belongs to the user, so the league yields no team at all
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: TEAM_TOGGLE })).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Thanos Was Right')).not.toBeInTheDocument();
  });
});
