import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { AppProvider } from './context';
import { STORAGE_KEYS } from './context/persistence';

// Mock the Sleeper API service
const mockSleeperApi = {
  getUser: vi.fn(),
  getUserLeagues: vi.fn(),
  getLeagueRosters: vi.fn(),
  getLeagueMatchups: vi.fn(),
  getNflState: vi.fn(),
  getWeekScores: vi.fn(),
};

vi.mock('./services/api/SleeperApiService', () => ({
  getSleeperApiService: () => mockSleeperApi,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test data
const mockUser = {
  user_id: 'test_user_123',
  username: 'testuser',
  display_name: 'Test User',
};

const mockLeagues = [
  {
    league_id: 'league_1',
    name: 'Test League 1',
    season: '2024',
    status: 'in_season' as const,
    sport: 'nfl' as const,
    settings: {},
    total_rosters: 10,
  },
  {
    league_id: 'league_2',
    name: 'Test League 2',
    season: '2024',
    status: 'in_season' as const,
    sport: 'nfl' as const,
    settings: {},
    total_rosters: 12,
  },
];

const mockRosters = [
  {
    roster_id: 1,
    owner_id: 'test_user_123',
    players: ['player_1', 'player_2'],
    starters: ['player_1'],
  },
  {
    roster_id: 2,
    owner_id: 'other_user',
    players: ['player_3', 'player_4'],
    starters: ['player_3'],
  },
];

const mockMatchups = [
  {
    roster_id: 1,
    matchup_id: 1,
    starters: ['player_1'],
    players: ['player_1', 'player_2'],
    points: 100,
    custom_points: null,
  },
  {
    roster_id: 2,
    matchup_id: 1,
    starters: ['player_3'],
    players: ['player_3', 'player_4'],
    points: 95,
    custom_points: null,
  },
];

const TEAM_TOGGLE = /teams \(\d+\/\d+ selected\)/i;

/**
 * Render as a returning user and wait for the full league load to finish.
 *
 * App only fetches league data through its persisted-identifier effect, so a
 * seeded identifier is what actually exercises the loading path. Waiting on the
 * team filter (rather than just the greeting) proves rosters and matchups were
 * really fetched - otherwise these regression tests pass vacuously, asserting
 * that an load which never ran made no repeat calls.
 */
async function loadApp() {
  const user = userEvent.setup();

  render(
    <AppProvider>
      <App />
    </AppProvider>
  );

  await waitFor(
    () => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    },
    { timeout: 3000 }
  );

  // Guard against a vacuous run: the league load must have actually happened
  await waitFor(
    () => {
      expect(screen.getByRole('button', { name: TEAM_TOGGLE })).toBeInTheDocument();
    },
    { timeout: 3000 }
  );

  expect(mockSleeperApi.getUserLeagues).toHaveBeenCalled();
  expect(mockSleeperApi.getLeagueRosters).toHaveBeenCalled();

  return user;
}

describe('App - Infinite Loop Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockImplementation((key: string) =>
      key === STORAGE_KEYS.USER_IDENTIFIER ? 'testuser' : null
    );

    // Setup default API responses
    mockSleeperApi.getUser.mockResolvedValue(mockUser);
    mockSleeperApi.getUserLeagues.mockResolvedValue(mockLeagues);
    mockSleeperApi.getLeagueRosters.mockResolvedValue(mockRosters);
    mockSleeperApi.getLeagueMatchups.mockResolvedValue(mockMatchups);
    mockSleeperApi.getNflState.mockResolvedValue({ week: 10, season: '2024', season_type: 'regular' });
    mockSleeperApi.getWeekScores.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not create infinite API call loop when user data is loaded', async () => {
    await loadApp();

    // Reset call counts after initial load
    vi.clearAllMocks();

    // Wait a bit more to ensure no additional calls are made
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    // Verify no additional API calls were made after initial load
    expect(mockSleeperApi.getUser).not.toHaveBeenCalled();
    expect(mockSleeperApi.getUserLeagues).not.toHaveBeenCalled();
    expect(mockSleeperApi.getLeagueRosters).not.toHaveBeenCalled();
    expect(mockSleeperApi.getLeagueMatchups).not.toHaveBeenCalled();
  });

  it('should not trigger API calls when team selections change', async () => {
    const user = await loadApp();

    // Expand the team list so an individual team can be toggled
    await act(async () => {
      await user.click(screen.getByRole('button', { name: TEAM_TOGGLE }));
    });

    // Clear API call counts after initial load
    vi.clearAllMocks();

    // Toggling a team must recalculate from cached raw data, not refetch
    await act(async () => {
      await user.click(screen.getByRole('checkbox', { name: /test league 1/i }));
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    // Verify NO API calls were made by the selection change
    expect(mockSleeperApi.getUser).not.toHaveBeenCalled();
    expect(mockSleeperApi.getUserLeagues).not.toHaveBeenCalled();
    expect(mockSleeperApi.getLeagueRosters).not.toHaveBeenCalled();
    expect(mockSleeperApi.getLeagueMatchups).not.toHaveBeenCalled();
  }, 10000);

  it('should only make API calls once per week change', async () => {
    const user = await loadApp();

    // Clear call counts after initial load
    vi.clearAllMocks();

    // Change the week using the week dropdown
    const weekSelect = screen.getByRole('combobox', { name: /nfl week/i });
    await act(async () => {
      await user.selectOptions(weekSelect, '5');
    });

    // Wait for week change to complete
    await waitFor(() => {
      expect(mockSleeperApi.getLeagueMatchups).toHaveBeenCalledTimes(2); // Once per league
    });

    // Clear calls again
    vi.clearAllMocks();

    // Wait to ensure no additional calls are made
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    // Verify no additional calls after week change completed
    expect(mockSleeperApi.getLeagueMatchups).not.toHaveBeenCalled();
  });

  it('should handle rapid team selection changes without API call storms', async () => {
    const user = await loadApp();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: TEAM_TOGGLE }));
    });

    const leagueOne = screen.getByRole('checkbox', { name: /test league 1/i });

    // Clear API call counts after initial load
    vi.clearAllMocks();

    // Rapid toggling should coalesce into local recalculations only
    await act(async () => {
      await user.click(leagueOne);
      await user.click(leagueOne);
      await user.click(leagueOne);
      await user.click(leagueOne);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
    });

    // Verify NO API calls were made after initial load
    expect(mockSleeperApi.getUser).not.toHaveBeenCalled();
    expect(mockSleeperApi.getUserLeagues).not.toHaveBeenCalled();
    expect(mockSleeperApi.getLeagueRosters).not.toHaveBeenCalled();
    expect(mockSleeperApi.getLeagueMatchups).not.toHaveBeenCalled();
  }, 10000);

  it('should maintain data consistency during team selection changes', async () => {
    const user = await loadApp();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: TEAM_TOGGLE }));
    });

    // Deselecting one of two teams leaves the other selected and loaded
    await act(async () => {
      await user.click(screen.getByRole('checkbox', { name: /test league 1/i }));
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /teams \(1\/2 selected\)/i })
      ).toBeInTheDocument();
    });

    // Verify the app is in a stable state (user is loaded, no loading spinner)
    expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    expect(screen.queryByText('Loading your fantasy data...')).not.toBeInTheDocument();

    // Both teams remain listed; only the selection changed
    expect(screen.getByText('Test League 1')).toBeInTheDocument();
    expect(screen.getByText('Test League 2')).toBeInTheDocument();
  }, 10000);

  it('REGRESSION: should prevent infinite loop bug - API calls should be bounded', async () => {
    /**
     * This test specifically prevents the regression of the infinite loop bug
     * where useEffect dependencies caused endless API calls.
     *
     * Bug pattern:
     * 1. useEffect triggers on gamedayData change
     * 2. recalculateGamedayData calls loadLeagueData
     * 3. loadLeagueData updates gamedayData
     * 4. Loop back to step 1 infinitely
     */
    await loadApp();

    // Record call counts after initial load
    const initialCallCounts = {
      getUser: mockSleeperApi.getUser.mock.calls.length,
      getUserLeagues: mockSleeperApi.getUserLeagues.mock.calls.length,
      getLeagueRosters: mockSleeperApi.getLeagueRosters.mock.calls.length,
      getLeagueMatchups: mockSleeperApi.getLeagueMatchups.mock.calls.length,
    };

    // Wait for 2 seconds - if there's an infinite loop, calls would continue
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
    });

    // Verify call counts haven't increased (no infinite loop)
    expect(mockSleeperApi.getUser.mock.calls.length).toBe(initialCallCounts.getUser);
    expect(mockSleeperApi.getUserLeagues.mock.calls.length).toBe(initialCallCounts.getUserLeagues);
    expect(mockSleeperApi.getLeagueRosters.mock.calls.length).toBe(initialCallCounts.getLeagueRosters);
    expect(mockSleeperApi.getLeagueMatchups.mock.calls.length).toBe(initialCallCounts.getLeagueMatchups);

    // Verify reasonable bounds on API calls (should be small, finite numbers)
    expect(mockSleeperApi.getUser.mock.calls.length).toBeLessThan(5);
    expect(mockSleeperApi.getUserLeagues.mock.calls.length).toBeLessThan(5);
    expect(mockSleeperApi.getLeagueRosters.mock.calls.length).toBeLessThan(10); // 2 leagues max
    expect(mockSleeperApi.getLeagueMatchups.mock.calls.length).toBeLessThan(10); // 2 leagues max
  });
});
