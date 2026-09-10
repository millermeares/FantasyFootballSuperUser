import { useEffect } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { SlateFilter } from './SlateFilter';
import { AppProvider, useAppContext } from '../../context';
import type { AppContextType } from '../../context';
import { buildSlateData, NO_GAME_SLATE_ID } from '../../services/ScheduleService';
import type { SleeperGameScore } from '../../types/sleeper';

function game(startTime: number, away: string, home: string): SleeperGameScore {
  return {
    game_id: `${away}-${home}`,
    week: 1,
    status: 'pre_game',
    start_time: startTime,
    metadata: { away_team: away, home_team: home }
  };
}

const WEEK = [
  game(new Date('2025-09-05T00:20:00Z').getTime(), 'DAL', 'PHI'),
  game(new Date('2025-09-07T17:00:00Z').getTime(), 'TB', 'ATL'),
  game(new Date('2025-09-07T17:00:00Z').getTime(), 'CIN', 'CLE'),
  game(new Date('2025-09-08T00:20:00Z').getTime(), 'BAL', 'BUF')
];

const slateData = buildSlateData(WEEK);
const [thursday, sundayEarly, sundayNight] = slateData.slates;

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

/** The kickoff time on each row, in the order the rows are rendered. */
function rowLabels(): string[] {
  return Array.from(document.querySelectorAll('.slate-name')).map(
    (element) => element.textContent ?? ''
  );
}

/** The muted count line under each row. */
function rowDetails(): string[] {
  return Array.from(document.querySelectorAll('.slate-details')).map(
    (element) => element.textContent ?? ''
  );
}

function selectedSlateIds(): string[] {
  return context().state.selectedSlateIds;
}

function tree(playerCounts: Record<string, number>) {
  return (
    <AppProvider>
      <CaptureContext />
      <SlateFilter playerCounts={playerCounts} />
    </AppProvider>
  );
}

function renderFilter(playerCounts: Record<string, number>) {
  return render(tree(playerCounts));
}

/** Open the filter the way a user does, by tapping its header. */
function expandButton(): HTMLElement {
  return screen.getByRole('button', { expanded: false });
}

describe('SlateFilter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders nothing until kickoff times are known', () => {
    renderFilter({});

    expect(screen.queryByText(/Game times/)).not.toBeInTheDocument();
  });

  it('renders nothing for a week with no games', () => {
    renderFilter({});
    act(() => context().setSlateData(buildSlateData([])));

    expect(screen.queryByText(/Game times/)).not.toBeInTheDocument();
  });

  it('starts collapsed, summarising what it is showing', () => {
    renderFilter({ [sundayEarly.id]: 5 });
    act(() => context().setSlateData(slateData));

    expect(screen.getByText('Game times (3/3 selected)')).toBeInTheDocument();
    expect(screen.getByText('All game times')).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('opens into a checkbox per game time when tapped', async () => {
    const user = userEvent.setup();
    renderFilter({ [thursday.id]: 1, [sundayEarly.id]: 5, [sundayNight.id]: 0 });
    act(() => context().setSlateData(slateData));

    await user.click(expandButton());

    expect(rowLabels()).toEqual([thursday.label, sundayEarly.label, sundayNight.label]);
    expect(rowDetails()).toEqual([
      '1 game · 1 of your player',
      '2 games · 5 of your players',
      '1 game · 0 of your players'
    ]);
    for (const checkbox of screen.getAllByRole('checkbox')) {
      expect(checkbox).toBeChecked();
    }
  });

  it('offers a bye-week bucket only when it holds players', async () => {
    const user = userEvent.setup();
    const { rerender } = renderFilter({ [sundayEarly.id]: 5 });
    act(() => context().setSlateData(slateData));
    await user.click(expandButton());

    expect(rowLabels()).toHaveLength(3);

    // Same slates, but now some of your players are on a bye
    rerender(tree({ [sundayEarly.id]: 5, [NO_GAME_SLATE_ID]: 2 }));

    expect(rowLabels()).toEqual([
      thursday.label,
      sundayEarly.label,
      sundayNight.label,
      'No game'
    ]);
    expect(rowDetails()).toContain('2 of your players');
  });

  it('toggles a single game time off and back on', async () => {
    const user = userEvent.setup();
    renderFilter({ [sundayEarly.id]: 5 });
    act(() => context().setSlateData(slateData));
    await user.click(expandButton());

    const sundayEarlyCheckbox = screen.getByRole('checkbox', { name: sundayEarly.label });

    await user.click(sundayEarlyCheckbox);
    expect(sundayEarlyCheckbox).not.toBeChecked();
    expect(selectedSlateIds()).not.toContain(sundayEarly.id);
    expect(selectedSlateIds()).toContain(thursday.id);
    expect(screen.getByText('Game times (2/3 selected)')).toBeInTheDocument();

    await user.click(sundayEarlyCheckbox);
    expect(sundayEarlyCheckbox).toBeChecked();
    expect(selectedSlateIds()).toContain(sundayEarly.id);
  });

  it('says so once every game time is hidden', () => {
    renderFilter({ [sundayEarly.id]: 5 });
    act(() => context().setSlateData(slateData));

    for (const slate of slateData.slates) {
      act(() => context().toggleSlate(slate.id));
    }

    expect(screen.getByText('Game times (0/3 selected)')).toBeInTheDocument();
    expect(screen.getByText('No game times selected')).toBeInTheDocument();
  });

  it('offers no bulk select controls', () => {
    renderFilter({ [sundayEarly.id]: 5 });
    act(() => context().setSlateData(slateData));

    // Only the header's expand toggle
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('names the slates it is showing once some are hidden', async () => {
    const user = userEvent.setup();
    renderFilter({ [sundayEarly.id]: 5 });
    act(() => context().setSlateData(slateData));
    act(() => context().toggleSlate(sundayNight.id));

    expect(screen.getByText(`${thursday.label}, ${sundayEarly.label}`)).toBeInTheDocument();

    // ...and the list itself is still one tap away
    await user.click(expandButton());
    expect(rowLabels()).toHaveLength(3);
  });

  it('marks game times holding none of your players', async () => {
    const user = userEvent.setup();
    renderFilter({ [thursday.id]: 1, [sundayEarly.id]: 5 });
    act(() => context().setSlateData(slateData));
    await user.click(expandButton());

    const rows = Array.from(document.querySelectorAll('.slate-item'));

    expect(rows[1]).not.toHaveClass('is-empty');
    expect(rows[2]).toHaveClass('is-empty');
  });

  it('shows every game time again after the week changes', () => {
    renderFilter({ [sundayEarly.id]: 5 });
    act(() => context().setSlateData(slateData));
    act(() => context().toggleSlate(sundayEarly.id));
    expect(selectedSlateIds()).not.toContain(sundayEarly.id);

    const nextWeek = buildSlateData([
      game(new Date('2025-09-14T17:00:00Z').getTime(), 'TB', 'ATL')
    ]);
    act(() => context().setSlateData(nextWeek));

    expect(selectedSlateIds()).toEqual([nextWeek.slates[0].id, NO_GAME_SLATE_ID]);
  });
});
