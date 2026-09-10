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
  game('2025-09-08T00:20:00Z', 'BAL', 'BUF') // Sun night
]);
const [, sundayEarly, sundayNight] = slateData.slates;

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
      .getAllByRole('listitem')
      .map((item) => item.textContent ?? '');
  }

  it('shows every player until a slate is deselected', () => {
    renderLoaded();

    expect(visiblePlayerNames().sort()).toEqual([
      'Bye Player',
      'Night Player',
      'Sunday Player',
      'Thursday Player'
    ]);
  });

  it('drops the players in a deselected slate', () => {
    renderLoaded();

    act(() => context().toggleSlate(sundayEarly.id));

    expect(visiblePlayerNames()).not.toContain('Sunday Player');
    expect(visiblePlayerNames()).toContain('Night Player');
  });

  it('narrows to one slate when the others are cleared', () => {
    renderLoaded();

    act(() => {
      context().toggleSlate(sundayEarly.id);
      context().toggleSlate(sundayNight.id);
      context().toggleSlate(NO_GAME_SLATE_ID);
    });

    expect(visiblePlayerNames()).toEqual(['Thursday Player']);
  });

  it('separates players on a bye from players with a game', () => {
    renderLoaded();

    act(() => context().toggleSlate(NO_GAME_SLATE_ID));

    expect(visiblePlayerNames()).not.toContain('Bye Player');
    expect(visiblePlayerNames()).toContain('Thursday Player');
  });

  it('counts each slate against your players', async () => {
    const user = userEvent.setup();
    renderLoaded();

    await user.click(screen.getByRole('button', { expanded: false }));

    const rows = Array.from(document.querySelectorAll('.slate-item')).map(
      (row) => row.textContent ?? ''
    );

    expect(rows).toContain(`${sundayNight.label}1 game · 1 of your player`);
    expect(rows).toContain('No game1 of your player');
  });

  it('explains an empty table caused by the slate filter', () => {
    renderLoaded();

    act(() => {
      for (const slate of slateData.slates) context().toggleSlate(slate.id);
      context().toggleSlate(NO_GAME_SLATE_ID);
    });

    expect(screen.getByText('No players in the selected game times')).toBeInTheDocument();
  });

  it('shows every player, and no filter, when kickoff times are unavailable', () => {
    renderLoaded({ withSlates: false });

    expect(screen.queryByText(/Game times/)).not.toBeInTheDocument();
    expect(visiblePlayerNames()).toHaveLength(4);
  });
});
