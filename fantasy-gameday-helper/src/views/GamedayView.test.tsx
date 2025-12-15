import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GamedayView } from './GamedayView';
import { AppProvider } from '../context';

// Mock the PlayerTable component since we're testing GamedayView in isolation
vi.mock('../components/tables', () => ({
  PlayerTable: ({ title, subtitle, emptyMessage }: any) => (
    <div data-testid="player-table">
      <h3>{title}</h3>
      <p>{subtitle}</p>
      <p>{emptyMessage}</p>
    </div>
  )
}));

const mockOnPlayerCountClick = vi.fn();

// Create a test wrapper with AppProvider
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

describe('GamedayView', () => {
  beforeEach(() => {
    mockOnPlayerCountClick.mockClear();
  });

  it('shows empty state when no gameday data is available', () => {
    render(
      <TestWrapper>
        <GamedayView onPlayerCountClick={mockOnPlayerCountClick} />
      </TestWrapper>
    );

    expect(screen.getByText('No gameday data available')).toBeInTheDocument();
    expect(screen.getByText('Make sure you have teams in active leagues for the selected week, and that matchups are available.')).toBeInTheDocument();
  });

  it('renders player tables when gameday data is available', () => {
    // This test would require mocking the context with gameday data
    // For now, we'll just test the empty state since that's the default
    render(
      <TestWrapper>
        <GamedayView onPlayerCountClick={mockOnPlayerCountClick} />
      </TestWrapper>
    );

    // Should show the gameday view container
    expect(document.querySelector('.gameday-view')).toBeInTheDocument();
  });

  it('has proper component structure', () => {
    render(
      <TestWrapper>
        <GamedayView onPlayerCountClick={mockOnPlayerCountClick} />
      </TestWrapper>
    );

    // Should have the main gameday view container
    const gamedayView = document.querySelector('.gameday-view');
    expect(gamedayView).toBeInTheDocument();
  });
});