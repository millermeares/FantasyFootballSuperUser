import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TabNavigation } from './TabNavigation';
import { AppProvider } from '../../context';

// Mock the context to provide controlled state
const mockSetActiveTab = vi.fn();
const mockOnPlayerCountClick = vi.fn();

// Create a test wrapper with AppProvider
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

describe('TabNavigation', () => {
  beforeEach(() => {
    mockSetActiveTab.mockClear();
    mockOnPlayerCountClick.mockClear();
  });

  it('renders both Gameday and Exposure tabs', () => {
    render(
      <TestWrapper>
        <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
      </TestWrapper>
    );

    expect(screen.getByRole('tab', { name: /gameday/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /exposure/i })).toBeInTheDocument();
  });

  it('shows Gameday tab as active by default', () => {
    render(
      <TestWrapper>
        <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
      </TestWrapper>
    );

    const gamedayTab = screen.getByRole('tab', { name: /gameday/i });
    const exposureTab = screen.getByRole('tab', { name: /exposure/i });

    expect(gamedayTab).toHaveClass('active');
    expect(gamedayTab).toHaveAttribute('aria-selected', 'true');
    expect(exposureTab).not.toHaveClass('active');
    expect(exposureTab).toHaveAttribute('aria-selected', 'false');
  });

  it('displays gameday content when gameday tab is active', () => {
    render(
      <TestWrapper>
        <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
      </TestWrapper>
    );

    // GamedayView shows empty state when no gameday data is available
    expect(screen.getByText('No gameday data available')).toBeInTheDocument();
    expect(screen.getByText('Make sure you have teams in active leagues for the selected week, and that matchups are available.')).toBeInTheDocument();
  });

  it('switches to exposure content when exposure tab is clicked', () => {
    render(
      <TestWrapper>
        <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
      </TestWrapper>
    );

    const exposureTab = screen.getByRole('tab', { name: /exposure/i });
    fireEvent.click(exposureTab);

    // Check that exposure content is displayed (shows empty state when no teams)
    expect(screen.getByText('No teams selected')).toBeInTheDocument();
    expect(screen.getByText('Select at least one team from the team filter above to see your exposure report.')).toBeInTheDocument();
  });

  it('updates tab active states when switching tabs', () => {
    render(
      <TestWrapper>
        <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
      </TestWrapper>
    );

    const gamedayTab = screen.getByRole('tab', { name: /gameday/i });
    const exposureTab = screen.getByRole('tab', { name: /exposure/i });

    // Click exposure tab
    fireEvent.click(exposureTab);

    // Check that exposure tab is now active
    expect(exposureTab).toHaveClass('active');
    expect(exposureTab).toHaveAttribute('aria-selected', 'true');
    expect(gamedayTab).not.toHaveClass('active');
    expect(gamedayTab).toHaveAttribute('aria-selected', 'false');

    // Click gameday tab
    fireEvent.click(gamedayTab);

    // Check that gameday tab is active again
    expect(gamedayTab).toHaveClass('active');
    expect(gamedayTab).toHaveAttribute('aria-selected', 'true');
    expect(exposureTab).not.toHaveClass('active');
    expect(exposureTab).toHaveAttribute('aria-selected', 'false');
  });

  it('has proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
      </TestWrapper>
    );

    const gamedayTab = screen.getByRole('tab', { name: /gameday/i });
    const exposureTab = screen.getByRole('tab', { name: /exposure/i });
    const tabPanel = screen.getByRole('tabpanel');

    expect(gamedayTab).toHaveAttribute('role', 'tab');
    expect(exposureTab).toHaveAttribute('role', 'tab');
    expect(tabPanel).toHaveAttribute('role', 'tabpanel');
  });

  it('supports keyboard navigation', () => {
    render(
      <TestWrapper>
        <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
      </TestWrapper>
    );

    const gamedayTab = screen.getByRole('tab', { name: /gameday/i });
    const exposureTab = screen.getByRole('tab', { name: /exposure/i });

    // Focus should work on tabs
    gamedayTab.focus();
    expect(document.activeElement).toBe(gamedayTab);

    exposureTab.focus();
    expect(document.activeElement).toBe(exposureTab);
  });

  it('supports keyboard navigation with arrow keys', () => {
    render(
      <TestWrapper>
        <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
      </TestWrapper>
    );

    const gamedayTab = screen.getByRole('tab', { name: /gameday/i });
    
    // Focus gameday tab and press right arrow
    gamedayTab.focus();
    fireEvent.keyDown(gamedayTab, { key: 'ArrowRight' });

    // Should switch to exposure content (shows empty state when no teams)
    expect(screen.getByText('No teams selected')).toBeInTheDocument();
  });

  it('applies responsive CSS classes based on viewport', () => {
    // Mock window.innerWidth for desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { container, rerender } = render(
      <TestWrapper>
        <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
      </TestWrapper>
    );

    // Should have desktop class initially
    const tabNavigation = container.querySelector('.tab-navigation');
    expect(tabNavigation).toHaveClass('tab-navigation--desktop');

    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    // Trigger resize event
    fireEvent(window, new Event('resize'));

    // Re-render to get updated classes
    rerender(
      <TestWrapper>
        <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
      </TestWrapper>
    );

    // Should have mobile class after resize
    expect(tabNavigation).toHaveClass('tab-navigation--mobile');
  });

  it('has proper touch-friendly attributes on mobile', () => {
    render(
      <TestWrapper>
        <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
      </TestWrapper>
    );

    const gamedayTab = screen.getByRole('tab', { name: /gameday/i });
    const exposureTab = screen.getByRole('tab', { name: /exposure/i });

    // Should have data-tab attributes for targeting
    expect(gamedayTab).toHaveAttribute('data-tab', 'gameday');
    expect(exposureTab).toHaveAttribute('data-tab', 'exposure');

    // Should have proper tabindex management
    expect(gamedayTab).toHaveAttribute('tabindex', '0'); // Active tab
    expect(exposureTab).toHaveAttribute('tabindex', '-1'); // Inactive tab
  });
});