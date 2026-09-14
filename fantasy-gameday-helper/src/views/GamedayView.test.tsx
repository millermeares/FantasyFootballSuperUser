import { useEffect } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { GamedayView } from './GamedayView';
import { AppProvider, useAppContext } from '../context';
import type { AppContextType } from '../context';
import { buildSlateData, NO_GAME_SLATE_ID } from '../services/ScheduleService';
import type { PlayerAllegiance } from '../types/app';
import type { SleeperGameScore } from '../types/sleeper';

// Mock the AggregateTable component since we're testing GamedayView in isolation
vi.mock('../components/tables', () => ({
  AggregateTable: ({
    title,
    players,
    emptyMessage,
  }: {
    title?: string;
    players?: { playerId: string; playerName: string }[];
    emptyMessage?: string;
  }) => (
    <div data-testid="aggregate-table">
      <h3>{title}</h3>
      <p>{emptyMessage}</p>
      <ul>
        {players?.map((player) => (
          <li key={player.playerId}>{player.playerName}</li>
        ))}
      </ul>
    </div>
  )
}));

// Create a test wrapper with AppProvider
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

describe('GamedayView', () => {
  it('shows empty state when no gameday data is available', () => {
    render(
      <TestWrapper>
        <GamedayView />
      </TestWrapper>
    );

    expect(screen.getByText('No gameday data available')).toBeInTheDocument();
    expect(screen.getByText('Make sure you have teams in active leagues for the selected week, and that matchups are available.')).toBeInTheDocument();
  });

  it('does not render the aggregate table without data', () => {
    render(
      <TestWrapper>
        <GamedayView />
      </TestWrapper>
    );

    expect(screen.queryByTestId('aggregate-table')).not.toBeInTheDocument();
  });

  it('has proper component structure', () => {
    render(
      <TestWrapper>
        <GamedayView />
      </TestWrapper>
    );

    // Should have the main gameday view container
    const gamedayView = document.querySelector('.gameday-view');
    expect(gamedayView).toBeInTheDocument();
  });
});

function game(startTime: string, away: string, home: string): SleeperGameScore {
  return {
    game_id: `${away}-${home}`,
    week: 1,
    status: 'pre_game',
    start_time: new Date(startTime).getTime(),
    metadata: { away_team: away, home_team: home }
  };
}

const slateData = buildSlateData([
  game('2025-09-05T00:20:00Z', 'DAL', 'PHI'), // Thu night
  game('2025-09-07T17:00:00Z', 'TB', 'ATL'), // Sun early
  game('2025-09-08T00:20:00Z', 'BAL', 'BUF'), // Sun night
  game('2025-09-09T00:15:00Z', 'NYJ', 'NE') // Mon night - no tracked players
]);
const [thursday, sundayEarly, sundayNight, mondayNight] = slateData.slates;

function allegiance(playerName: string, team: string): PlayerAllegiance {
  return {
    playerId: playerName,
    playerName,
    position: 'WR',
    team,
    count: 1,
    leagues: ['Alpha']
  };
}

// One player per slate, plus one on a bye
const GAMEDAY_DATA = {
  cheeringFor: [allegiance('Thursday Player', 'DAL'), allegiance('Bye Player', 'KC')],
  cheeringAgainst: [
    allegiance('Sunday Player', 'ATL'),
    allegiance('Night Player', 'BUF')
  ],
  userTeams: []
};

/** Lets a test drive the provider the same way the rest of the app does. */
const captured: { value?: AppContextType } = {};

function CaptureContext() {
  const value = useAppContext();
  useEffect(() => {
    captured.value = value;
  }, [value]);
  return null;
}

function context(): AppContextType {
  if (!captured.value) throw new Error('App context was never captured');
  return captured.value;
}

describe('GamedayView slate filtering', () => {
  /** Render with gameday players and this week's kickoff times loaded. */
  function renderLoaded({ withSlates = true } = {}) {
    const result = render(
      <TestWrapper>
        <CaptureContext />
        <GamedayView />
      </TestWrapper>
    );

    act(() => {
      context().setGamedayData(GAMEDAY_DATA);
      if (withSlates) context().setSlateData(slateData);
    });

    return result;
  }

  function visiblePlayerNames(): string[] {
    return screen
      .queryAllByRole('listitem')
      .map((item) => item.textContent ?? '');
  }

  function selectedSlateIds(): string[] {
    return context().state.selectedSlateIds;
  }

  it('shows every player until a game time is picked', () => {
    renderLoaded();

    expect(selectedSlateIds()).toEqual([]);
    expect(visiblePlayerNames().sort()).toEqual([
      'Bye Player',
      'Night Player',
      'Sunday Player',
      'Thursday Player'
    ]);
  });

  it('narrows to the one game time that is picked', () => {
    renderLoaded();

    act(() => context().toggleSlate(sundayEarly.id));

    expect(visiblePlayerNames()).toEqual(['Sunday Player']);
  });

  it('widens as more game times are picked', () => {
    renderLoaded();

    act(() => {
      context().toggleSlate(sundayEarly.id);
      context().toggleSlate(sundayNight.id);
    });

    expect(visiblePlayerNames().sort()).toEqual(['Night Player', 'Sunday Player']);
  });

  // The way back to the whole week is to clear what you picked
  it('shows every player again once the last game time is unpicked', () => {
    renderLoaded();

    act(() => context().toggleSlate(sundayEarly.id));
    expect(visiblePlayerNames()).toEqual(['Sunday Player']);

    act(() => context().toggleSlate(sundayEarly.id));
    expect(visiblePlayerNames()).toHaveLength(4);
  });

  it('separates players on a bye from players with a game', () => {
    renderLoaded();

    act(() => context().toggleSlate(NO_GAME_SLATE_ID));
    expect(visiblePlayerNames()).toEqual(['Bye Player']);

    act(() => {
      context().toggleSlate(NO_GAME_SLATE_ID);
      context().toggleSlate(thursday.id);
    });
    expect(visiblePlayerNames()).toEqual(['Thursday Player']);
  });

  it('counts the tracked players in each slate', async () => {
    const user = userEvent.setup();
    renderLoaded();

    await user.click(screen.getByRole('button', { expanded: false }));

    const rows = Array.from(document.querySelectorAll('.slate-item')).map(
      (row) => row.textContent ?? ''
    );

    expect(rows).toContain(`${sundayNight.label}1 game · 1 player`);
    expect(rows).toContain('No game1 player');
  });

  it('explains an empty table caused by the slate filter', () => {
    renderLoaded();

    act(() => context().toggleSlate(mondayNight.id));

    expect(visiblePlayerNames()).toEqual([]);
    expect(screen.getByText('No players in the selected game times')).toBeInTheDocument();
  });

  it('shows every player, and no filter, when kickoff times are unavailable', () => {
    renderLoaded({ withSlates: false });

    expect(screen.queryByText(/Game times/)).not.toBeInTheDocument();
    expect(visiblePlayerNames()).toHaveLength(4);
  });
});
