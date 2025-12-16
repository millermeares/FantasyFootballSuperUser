import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlayerTable } from './PlayerTable';
import type { PlayerAllegiance, PlayerExposure } from '../../types/app';

// Mock data for testing
const mockPlayers: PlayerAllegiance[] = [
  {
    playerId: '1',
    playerName: 'Josh Allen',
    position: 'QB',
    team: 'BUF',
    count: 3,
    leagues: ['League A', 'League B', 'League C']
  },
  {
    playerId: '2',
    playerName: 'Christian McCaffrey',
    position: 'RB',
    team: 'SF',
    count: 2,
    leagues: ['League A', 'League B']
  },
  {
    playerId: '3',
    playerName: 'Tyreek Hill',
    position: 'WR',
    team: 'MIA',
    count: 1,
    leagues: ['League C']
  }
];

const mockExposurePlayers: PlayerExposure[] = [
  {
    playerId: '1',
    playerName: 'Josh Allen',
    position: 'QB',
    team: 'BUF',
    exposurePercentage: 75.0,
    teamCount: 3,
    totalTeams: 4,
    leagues: ['League A', 'League B', 'League C']
  },
  {
    playerId: '2',
    playerName: 'Christian McCaffrey',
    position: 'RB',
    team: 'SF',
    exposurePercentage: 50.0,
    teamCount: 2,
    totalTeams: 4,
    leagues: ['League A', 'League B']
  },
  {
    playerId: '3',
    playerName: 'Tyreek Hill',
    position: 'WR',
    team: 'MIA',
    exposurePercentage: 25.0,
    teamCount: 1,
    totalTeams: 4,
    leagues: ['League C']
  }
];

describe('PlayerTable', () => {
  it('renders table with player data', () => {
    render(
      <PlayerTable
        players={mockPlayers}
        title="Test Players"
      />
    );

    expect(screen.getByText('Test Players')).toBeInTheDocument();
    expect(screen.getByText('3 players')).toBeInTheDocument();
    expect(screen.getByText('Josh Allen')).toBeInTheDocument();
    expect(screen.getByText('Christian McCaffrey')).toBeInTheDocument();
    expect(screen.getByText('Tyreek Hill')).toBeInTheDocument();
  });

  it('displays empty state when no players', () => {
    render(
      <PlayerTable
        players={[]}
        title="Empty Table"
        emptyMessage="No data available"
      />
    );

    expect(screen.getByText('Empty Table')).toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('sorts players by count in descending order by default', () => {
    render(
      <PlayerTable
        players={mockPlayers}
        title="Test Players"
      />
    );

    const playerRows = screen.getAllByRole('row');
    // Skip header row (index 0)
    const firstPlayerRow = playerRows[1];
    const secondPlayerRow = playerRows[2];
    const thirdPlayerRow = playerRows[3];

    expect(firstPlayerRow).toHaveTextContent('Josh Allen');
    expect(secondPlayerRow).toHaveTextContent('Christian McCaffrey');
    expect(thirdPlayerRow).toHaveTextContent('Tyreek Hill');
  });

  it('handles sorting by player name', () => {
    render(
      <PlayerTable
        players={mockPlayers}
        title="Test Players"
      />
    );

    const nameHeader = screen.getByRole('columnheader', { name: /player/i });
    fireEvent.click(nameHeader);

    const playerRows = screen.getAllByRole('row');
    // After sorting by name ascending
    const firstPlayerRow = playerRows[1];
    expect(firstPlayerRow).toHaveTextContent('Christian McCaffrey');
  });

  it('handles sorting by position', () => {
    render(
      <PlayerTable
        players={mockPlayers}
        title="Test Players"
      />
    );

    const positionHeader = screen.getByRole('columnheader', { name: /position/i });
    fireEvent.click(positionHeader);

    const playerRows = screen.getAllByRole('row');
    // After sorting by position ascending (QB, RB, WR)
    const firstPlayerRow = playerRows[1];
    expect(firstPlayerRow).toHaveTextContent('Josh Allen'); // QB comes first
  });

  it('handles sorting by team', () => {
    render(
      <PlayerTable
        players={mockPlayers}
        title="Test Players"
      />
    );

    const teamHeader = screen.getByRole('columnheader', { name: /team/i });
    fireEvent.click(teamHeader);

    const playerRows = screen.getAllByRole('row');
    // After sorting by team ascending (BUF, MIA, SF)
    const firstPlayerRow = playerRows[1];
    expect(firstPlayerRow).toHaveTextContent('BUF');
  });

  it('toggles sort direction when clicking same column', () => {
    render(
      <PlayerTable
        players={mockPlayers}
        title="Test Players"
      />
    );

    const countHeader = screen.getByRole('columnheader', { name: /count/i });
    
    // Initially sorted by count descending (Josh Allen should be first)
    let playerRows = screen.getAllByRole('row');
    expect(playerRows[1]).toHaveTextContent('Josh Allen'); // Highest count

    // First click should toggle to ascending
    fireEvent.click(countHeader);
    playerRows = screen.getAllByRole('row');
    expect(playerRows[1]).toHaveTextContent('Tyreek Hill'); // Lowest count

    // Second click should toggle back to descending
    fireEvent.click(countHeader);
    playerRows = screen.getAllByRole('row');
    expect(playerRows[1]).toHaveTextContent('Josh Allen'); // Highest count again
  });

  it('calls onCountClick when count button is clicked', () => {
    const mockOnCountClick = vi.fn();
    
    render(
      <PlayerTable
        players={mockPlayers}
        title="Test Players"
        onCountClick={mockOnCountClick}
      />
    );

    const countButtons = screen.getAllByRole('button');
    fireEvent.click(countButtons[0]); // Click first count button

    expect(mockOnCountClick).toHaveBeenCalledWith(
      mockPlayers[0].playerId, // Josh Allen's ID (first in sorted order)
      mockPlayers[0].leagues
    );
  });

  it('displays count as text when onCountClick is not provided', () => {
    render(
      <PlayerTable
        players={mockPlayers}
        title="Test Players"
      />
    );

    // Should not have any buttons when onCountClick is not provided
    const countButtons = screen.queryAllByRole('button');
    expect(countButtons).toHaveLength(0);

    // Should display counts as text
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('handles keyboard navigation for sortable headers', () => {
    render(
      <PlayerTable
        players={mockPlayers}
        title="Test Players"
      />
    );

    const nameHeader = screen.getByRole('columnheader', { name: /player/i });
    
    // Test Enter key
    fireEvent.keyDown(nameHeader, { key: 'Enter' });
    let playerRows = screen.getAllByRole('row');
    expect(playerRows[1]).toHaveTextContent('Christian McCaffrey');

    // Test Space key
    fireEvent.keyDown(nameHeader, { key: ' ' });
    playerRows = screen.getAllByRole('row');
    expect(playerRows[1]).toHaveTextContent('Tyreek Hill');
  });

  it('displays correct aria-sort attributes', () => {
    render(
      <PlayerTable
        players={mockPlayers}
        title="Test Players"
      />
    );

    const countHeader = screen.getByRole('columnheader', { name: /count/i });
    const nameHeader = screen.getByRole('columnheader', { name: /player/i });

    // Count should be sorted descending by default
    expect(countHeader).toHaveAttribute('aria-sort', 'descending');
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');

    // Click name header
    fireEvent.click(nameHeader);
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(countHeader).toHaveAttribute('aria-sort', 'none');
  });

  it('applies custom className', () => {
    const { container } = render(
      <PlayerTable
        players={mockPlayers}
        title="Test Players"
        className="custom-class"
      />
    );

    const tableElement = container.querySelector('.player-table');
    expect(tableElement).toHaveClass('custom-class');
  });

  it('displays player count badge correctly', () => {
    render(
      <PlayerTable
        players={mockPlayers}
        title="Test Players"
      />
    );

    expect(screen.getByText('3 players')).toBeInTheDocument();
  });

  it('displays singular player text for single player', () => {
    render(
      <PlayerTable
        players={[mockPlayers[0]]}
        title="Test Players"
      />
    );

    expect(screen.getByText('1 player')).toBeInTheDocument();
  });

  describe('Percentage Display Mode', () => {
    it('renders table with exposure percentages', () => {
      render(
        <PlayerTable
          players={mockExposurePlayers}
          title="Exposure Report"
          displayMode="percentage"
        />
      );

      expect(screen.getByText('Exposure Report')).toBeInTheDocument();
      expect(screen.getByText('Josh Allen')).toBeInTheDocument();
      expect(screen.getByText('75.0%')).toBeInTheDocument();
      expect(screen.getByText('50.0%')).toBeInTheDocument();
      expect(screen.getByText('25.0%')).toBeInTheDocument();
    });

    it('displays Exposure header in percentage mode', () => {
      render(
        <PlayerTable
          players={mockExposurePlayers}
          title="Exposure Report"
          displayMode="percentage"
        />
      );

      expect(screen.getByRole('columnheader', { name: /exposure/i })).toBeInTheDocument();
      expect(screen.queryByRole('columnheader', { name: /count/i })).not.toBeInTheDocument();
    });

    it('sorts by exposure percentage by default in percentage mode', () => {
      render(
        <PlayerTable
          players={mockExposurePlayers}
          title="Exposure Report"
          displayMode="percentage"
        />
      );

      const playerRows = screen.getAllByRole('row');
      // Skip header row (index 0)
      const firstPlayerRow = playerRows[1];
      const secondPlayerRow = playerRows[2];
      const thirdPlayerRow = playerRows[3];

      expect(firstPlayerRow).toHaveTextContent('Josh Allen'); // 75%
      expect(secondPlayerRow).toHaveTextContent('Christian McCaffrey'); // 50%
      expect(thirdPlayerRow).toHaveTextContent('Tyreek Hill'); // 25%
    });

    it('handles sorting by exposure percentage', () => {
      render(
        <PlayerTable
          players={mockExposurePlayers}
          title="Exposure Report"
          displayMode="percentage"
        />
      );

      const exposureHeader = screen.getByRole('columnheader', { name: /exposure/i });
      
      // Initially sorted by percentage descending (Josh Allen should be first)
      let playerRows = screen.getAllByRole('row');
      expect(playerRows[1]).toHaveTextContent('Josh Allen'); // Highest percentage

      // First click should toggle to ascending
      fireEvent.click(exposureHeader);
      playerRows = screen.getAllByRole('row');
      expect(playerRows[1]).toHaveTextContent('Tyreek Hill'); // Lowest percentage

      // Second click should toggle back to descending
      fireEvent.click(exposureHeader);
      playerRows = screen.getAllByRole('row');
      expect(playerRows[1]).toHaveTextContent('Josh Allen'); // Highest percentage again
    });

    it('calls onCountClick when percentage button is clicked', () => {
      const mockOnCountClick = vi.fn();
      
      render(
        <PlayerTable
          players={mockExposurePlayers}
          title="Exposure Report"
          displayMode="percentage"
          onCountClick={mockOnCountClick}
        />
      );

      const percentageButtons = screen.getAllByRole('button');
      fireEvent.click(percentageButtons[0]); // Click first percentage button

      expect(mockOnCountClick).toHaveBeenCalledWith(
        mockExposurePlayers[0].playerId, // Josh Allen's ID (first in sorted order)
        mockExposurePlayers[0].leagues
      );
    });

    it('displays percentage as text when onCountClick is not provided', () => {
      render(
        <PlayerTable
          players={mockExposurePlayers}
          title="Exposure Report"
          displayMode="percentage"
        />
      );

      // Should not have any buttons when onCountClick is not provided
      const percentageButtons = screen.queryAllByRole('button');
      expect(percentageButtons).toHaveLength(0);

      // Should display percentages as text
      expect(screen.getByText('75.0%')).toBeInTheDocument();
      expect(screen.getByText('50.0%')).toBeInTheDocument();
      expect(screen.getByText('25.0%')).toBeInTheDocument();
    });

    it('displays correct aria-sort attributes for percentage mode', () => {
      render(
        <PlayerTable
          players={mockExposurePlayers}
          title="Exposure Report"
          displayMode="percentage"
        />
      );

      const exposureHeader = screen.getByRole('columnheader', { name: /exposure/i });
      const nameHeader = screen.getByRole('columnheader', { name: /player/i });

      // Exposure should be sorted descending by default
      expect(exposureHeader).toHaveAttribute('aria-sort', 'descending');
      expect(nameHeader).toHaveAttribute('aria-sort', 'none');

      // Click name header
      fireEvent.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
      expect(exposureHeader).toHaveAttribute('aria-sort', 'none');
    });
  });
});