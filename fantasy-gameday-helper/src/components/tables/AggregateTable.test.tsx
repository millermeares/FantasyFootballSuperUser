import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AggregateTable } from './AggregateTable';
import type { PlayerAggregate } from '../../types/app';

function makePlayer(overrides: Partial<PlayerAggregate>): PlayerAggregate {
  const forCount = overrides.forCount ?? 0;
  const againstCount = overrides.againstCount ?? 0;

  return {
    playerId: 'p1',
    playerName: 'Test Player',
    position: 'RB',
    team: 'CIN',
    forCount,
    againstCount,
    totalCount: forCount + againstCount,
    netCount: forCount - againstCount,
    forLeagues: [],
    againstLeagues: [],
    ...overrides,
  };
}

const PLAYERS: PlayerAggregate[] = [
  makePlayer({
    playerId: 'chase',
    playerName: "Ja'Marr Chase",
    position: 'WR',
    team: 'CIN',
    forCount: 4,
    againstCount: 1,
    netCount: 3,
    forLeagues: ['Alpha', 'Bravo', 'Charlie', 'Delta'],
    againstLeagues: ['Echo'],
  }),
  makePlayer({
    playerId: 'hurts',
    playerName: 'Jalen Hurts',
    position: 'QB',
    team: 'PHI',
    forCount: 1,
    againstCount: 3,
    netCount: -2,
    forLeagues: ['Alpha'],
    againstLeagues: ['Bravo', 'Charlie', 'Delta'],
  }),
  makePlayer({
    playerId: 'barkley',
    playerName: 'Saquon Barkley',
    position: 'RB',
    team: 'PHI',
    forCount: 2,
    againstCount: 2,
    netCount: 0,
    forLeagues: ['Alpha', 'Bravo'],
    againstLeagues: ['Charlie', 'Delta'],
  }),
];

/** Player names in the order they currently appear in the table body. */
function renderedOrder(): string[] {
  const rows = screen.getAllByRole('row').slice(1); // drop the header row
  return rows.map((row) => within(row).getAllByRole('cell')[0].textContent ?? '');
}

function nameAt(index: number): string {
  return renderedOrder()[index];
}

describe('AggregateTable', () => {
  const onCountClick = vi.fn();

  beforeEach(() => {
    onCountClick.mockClear();
  });

  it('renders one row per player with for, against, and net values', () => {
    render(<AggregateTable title="Gameday" players={PLAYERS} />);

    expect(screen.getAllByRole('row')).toHaveLength(PLAYERS.length + 1);
    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('shows the total as for plus against', () => {
    render(<AggregateTable title="Gameday" players={PLAYERS} />);

    const totals = [...document.querySelectorAll('.total-value')].map(
      (n) => n.textContent
    );
    // Chase 4+1, Hurts 1+3, Barkley 2+2
    expect(totals).toEqual(expect.arrayContaining(['5', '4', '4']));
  });

  it('always renders an explicit sign on nets so colour is not the only signal', () => {
    render(<AggregateTable title="Gameday" players={PLAYERS} />);

    const nets = [...document.querySelectorAll('.net-value')].map((n) => n.textContent);
    expect(nets).toEqual(expect.arrayContaining(['+3', '0', '-2']));
  });

  it('sorts by total descending by default, so the busiest players lead', () => {
    render(<AggregateTable title="Gameday" players={PLAYERS} />);

    // Chase totals 5; Hurts and Barkley both total 4, so name breaks the tie
    expect(nameAt(0)).toContain("Ja'Marr Chase");
    expect(nameAt(1)).toContain('Jalen Hurts');
    expect(nameAt(2)).toContain('Saquon Barkley');
  });

  it('reverses to total ascending when the total heading is tapped', async () => {
    const user = userEvent.setup();
    render(<AggregateTable title="Gameday" players={PLAYERS} />);

    await user.click(
      screen.getByRole('button', { name: /sort by total teams involving this player/i })
    );

    expect(nameAt(2)).toContain("Ja'Marr Chase"); // highest total drops to last
  });

  it('sorts by net descending when the net heading is tapped', async () => {
    const user = userEvent.setup();
    render(<AggregateTable title="Gameday" players={PLAYERS} />);

    await user.click(
      screen.getByRole('button', { name: /sort by net allegiance/i })
    );

    expect(nameAt(0)).toContain("Ja'Marr Chase"); // +3
    expect(nameAt(1)).toContain('Saquon Barkley'); // 0
    expect(nameAt(2)).toContain('Jalen Hurts'); // -2
  });

  it('sorts by against descending on the first click, surfacing who you face most', async () => {
    const user = userEvent.setup();
    render(<AggregateTable title="Gameday" players={PLAYERS} />);

    await user.click(
      screen.getByRole('button', { name: /sort by teams where you face this player/i })
    );

    expect(nameAt(0)).toContain('Jalen Hurts'); // againstCount 3
    expect(nameAt(1)).toContain('Saquon Barkley'); // againstCount 2
    expect(nameAt(2)).toContain("Ja'Marr Chase"); // againstCount 1
  });

  it('sorts by for descending on the first click, surfacing who you own most', async () => {
    const user = userEvent.setup();
    render(<AggregateTable title="Gameday" players={PLAYERS} />);

    await user.click(
      screen.getByRole('button', { name: /sort by teams where you start this player/i })
    );

    expect(nameAt(0)).toContain("Ja'Marr Chase"); // forCount 4
    expect(nameAt(1)).toContain('Saquon Barkley'); // forCount 2
    expect(nameAt(2)).toContain('Jalen Hurts'); // forCount 1
  });

  it('reverses direction when the same column is clicked twice', async () => {
    const user = userEvent.setup();
    render(<AggregateTable title="Gameday" players={PLAYERS} />);

    const againstHeader = screen.getByRole('button', {
      name: /sort by teams where you face this player/i,
    });

    await user.click(againstHeader);
    expect(nameAt(0)).toContain('Jalen Hurts');

    await user.click(againstHeader);
    expect(nameAt(0)).toContain("Ja'Marr Chase");
  });

  it('sorts text columns ascending on the first click', async () => {
    const user = userEvent.setup();
    render(<AggregateTable title="Gameday" players={PLAYERS} />);

    await user.click(screen.getByRole('button', { name: 'Sort by player name' }));

    expect(nameAt(0)).toContain("Ja'Marr Chase");
    expect(nameAt(1)).toContain('Jalen Hurts');
    expect(nameAt(2)).toContain('Saquon Barkley');
  });

  it('exposes the active sort on the column header for assistive tech', async () => {
    const user = userEvent.setup();
    render(<AggregateTable title="Gameday" players={PLAYERS} />);

    const headerFor = (label: string) =>
      screen.getByRole('button', { name: label }).closest('th');

    expect(
      headerFor('Sort by total teams involving this player (for plus against)')
    ).toHaveAttribute('aria-sort', 'descending');

    await user.click(screen.getByRole('button', { name: 'Sort by player name' }));

    expect(
      headerFor('Sort by total teams involving this player (for plus against)')
    ).toHaveAttribute('aria-sort', 'none');
    expect(headerFor('Sort by player name')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('sorts by team when the team heading is tapped', async () => {
    const user = userEvent.setup();
    render(<AggregateTable title="Gameday" players={PLAYERS} />);

    await user.click(screen.getByRole('button', { name: 'Sort by NFL team' }));

    // Team sorts ascending first: CIN before PHI
    expect(nameAt(0)).toContain("Ja'Marr Chase");
  });

  it('sorts by position when the position heading is tapped', async () => {
    const user = userEvent.setup();
    render(<AggregateTable title="Gameday" players={PLAYERS} />);

    await user.click(screen.getByRole('button', { name: 'Sort by position' }));

    // QB, RB, WR ascending
    expect(nameAt(0)).toContain('Jalen Hurts');
    expect(nameAt(1)).toContain('Saquon Barkley');
    expect(nameAt(2)).toContain("Ja'Marr Chase");
  });

  it('offers no sort control other than the column headings', () => {
    render(<AggregateTable title="Gameday" players={PLAYERS} />);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('passes the clicked side and its own league list to the handler', async () => {
    const user = userEvent.setup();
    render(
      <AggregateTable title="Gameday" players={PLAYERS} onCountClick={onCountClick} />
    );

    await user.click(
      screen.getByRole('button', { name: /you start Ja'Marr Chase in 4 of your teams/i })
    );
    expect(onCountClick).toHaveBeenLastCalledWith(
      expect.objectContaining({ playerId: 'chase' }),
      'for'
    );

    await user.click(
      screen.getByRole('button', { name: /you face Ja'Marr Chase in 1 of your teams/i })
    );
    expect(onCountClick).toHaveBeenLastCalledWith(
      expect.objectContaining({ playerId: 'chase' }),
      'against'
    );
  });

  it('renders a zero count as a non-interactive placeholder', () => {
    const oneSided = [
      makePlayer({
        playerId: 'kicker',
        playerName: 'Lone Kicker',
        position: 'K',
        forCount: 2,
        againstCount: 0,
        forLeagues: ['Alpha', 'Bravo'],
      }),
    ];

    render(
      <AggregateTable title="Gameday" players={oneSided} onCountClick={onCountClick} />
    );

    // Only the "for" count is clickable; the empty "against" side has no leagues
    expect(screen.getAllByRole('button', { name: /of your teams/i })).toHaveLength(1);
    expect(screen.getByText('–')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('renders counts as plain text when no click handler is supplied', () => {
    render(<AggregateTable title="Gameday" players={PLAYERS} />);

    expect(screen.queryByRole('button', { name: /of your teams/i })).not.toBeInTheDocument();
  });

  it('shows the empty message instead of a table when there are no players', () => {
    render(
      <AggregateTable title="Gameday" players={[]} emptyMessage="Nothing here" />
    );

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('labels the player count', () => {
    const { rerender } = render(
      <AggregateTable title="Gameday" players={PLAYERS} />
    );
    expect(screen.getByText('3 players')).toBeInTheDocument();

    rerender(<AggregateTable title="Gameday" players={[PLAYERS[0]]} />);
    expect(screen.getByText('1 player')).toBeInTheDocument();
  });

  it('marks each position badge so its colour rule can match', () => {
    render(<AggregateTable title="Gameday" players={PLAYERS} />);

    const badges = document.querySelectorAll('.aggregate-position-badge');
    expect(badges).toHaveLength(3);
    badges.forEach((badge) => {
      expect(badge.getAttribute('data-position')).toBeTruthy();
      expect(badge.getAttribute('data-position')).toBe(badge.textContent);
    });
  });
});
