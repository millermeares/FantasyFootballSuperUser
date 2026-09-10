import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GamedayView } from './GamedayView';
import { AppProvider } from '../context';

// Mock the AggregateTable component since we're testing GamedayView in isolation
vi.mock('../components/tables', () => ({
  AggregateTable: ({
    title,
    emptyMessage,
  }: {
    title?: string;
    emptyMessage?: string;
  }) => (
    <div data-testid="aggregate-table">
      <h3>{title}</h3>
      <p>{emptyMessage}</p>
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
