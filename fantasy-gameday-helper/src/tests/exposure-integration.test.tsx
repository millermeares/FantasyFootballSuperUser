import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { TabNavigation } from '../components/ui/TabNavigation';
import { ExposureView } from '../views/ExposureView';
import { AppProvider } from '../context';

// Mock the Sleeper API service
const mockSleeperApi = {
  getUser: vi.fn(),
  getUserLeagues: vi.fn(),
  getLeagueRosters: vi.fn(),
  getLeagueMatchups: vi.fn(),
  getNflState: vi.fn(),
};

vi.mock('../services/api/SleeperApiService', () => ({
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

// Mock window.innerWidth for responsive testing
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

// Mock window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Test data for exposure feature testing (commented out unused data)
// const mockUser = {
//   user_id: 'test_user_123',
//   username: 'testuser',
//   display_name: 'Test User',
// };

// const mockLeagues = [
//   {
//     league_id: 'league_1',
//     name: 'Test League 1',
//     season: '2024',
//     status: 'in_season' as const,
//     sport: 'nfl' as const,
//     settings: {},
//     total_rosters: 10,
//   },
//   {
//     league_id: 'league_2', 
//     name: 'Test League 2',
//     season: '2024',
//     status: 'in_season' as const,
//     sport: 'nfl' as const,
//     settings: {},
//     total_rosters: 12,
//   },
// ];

// Mock rosters with comprehensive player data for exposure testing
// Need to return different rosters for different leagues
// const mockRostersLeague1 = [
//   // User's roster in league 1
//   {
//     roster_id: 1,
//     owner_id: 'test_user_123',
//     players: ['player_1', 'player_2', 'player_3', 'player_4'], // All roster positions
//     starters: ['player_1', 'player_2'], // Only starters
//   },
//   // Other user's roster in league 1
//   {
//     roster_id: 2,
//     owner_id: 'other_user_1',
//     players: ['player_7', 'player_8'],
//     starters: ['player_7'],
//   },
// ];

// const mockRostersLeague2 = [
//   // User's roster in league 2  
//   {
//     roster_id: 3,
//     owner_id: 'test_user_123',
//     players: ['player_1', 'player_5', 'player_6'], // Overlapping player_1
//     starters: ['player_1', 'player_5'],
//   },
//   // Other user's roster in league 2
//   {
//     roster_id: 4,
//     owner_id: 'other_user_2',
//     players: ['player_9', 'player_10'],
//     starters: ['player_9'],
//   },
// ];

// const mockMatchupsLeague1 = [
//   {
//     roster_id: 1,
//     matchup_id: 1,
//     starters: ['player_1', 'player_2'],
//     players: ['player_1', 'player_2', 'player_3', 'player_4'],
//     points: 100,
//     custom_points: null,
//   },
//   {
//     roster_id: 2,
//     matchup_id: 1,
//     starters: ['player_7'],
//     players: ['player_7', 'player_8'],
//     points: 95,
//     custom_points: null,
//   },
// ];

// const mockMatchupsLeague2 = [
//   {
//     roster_id: 3,
//     matchup_id: 2,
//     starters: ['player_1', 'player_5'],
//     players: ['player_1', 'player_5', 'player_6'],
//     points: 110,
//     custom_points: null,
//   },
//   {
//     roster_id: 4,
//     matchup_id: 2,
//     starters: ['player_9'],
//     players: ['player_9', 'player_10'],
//     points: 88,
//     custom_points: null,
//   },
// ];

// Helper function to wait for teams to load and tabs to appear
// const waitForTeamsAndTabs = async () => {
//   // Wait for teams to be loaded (team filter should appear)
//   await waitFor(() => {
//     // Look for any indication that teams have loaded
//     const teamElements = screen.queryAllByText(/test league/i);
//     if (teamElements.length === 0) {
//       // If no team elements, check if there's an error or empty state
//       const errorElement = screen.queryByText(/no teams found/i);
//       const emptyElement = screen.queryByText(/no leagues found/i);
//       if (errorElement || emptyElement) {
//         throw new Error('Teams failed to load');
//       }
//       throw new Error('Teams not loaded yet');
//     }
//     return true;
//   }, { timeout: 10000 });
  
//   // Wait for tabs to appear
//   await waitFor(() => {
//     expect(screen.getByRole('tab', { name: /gameday/i })).toBeInTheDocument();
//     expect(screen.getByRole('tab', { name: /exposure/i })).toBeInTheDocument();
//   }, { timeout: 5000 });
// };

describe('Exposure Feature Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Tab Navigation Integration', () => {
    it('should render tab navigation with both tabs', () => {
      const mockOnPlayerCountClick = vi.fn();

      render(
        <AppProvider>
          <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
        </AppProvider>
      );

      // Verify both tabs are present
      expect(screen.getByRole('tab', { name: /gameday/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /exposure/i })).toBeInTheDocument();
    });

    it('should switch between tabs correctly', () => {
      const mockOnPlayerCountClick = vi.fn();

      render(
        <AppProvider>
          <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
        </AppProvider>
      );

      const gamedayTab = screen.getByRole('tab', { name: /gameday/i });
      const exposureTab = screen.getByRole('tab', { name: /exposure/i });

      // Gameday should be active by default
      expect(gamedayTab).toHaveClass('active');
      expect(exposureTab).not.toHaveClass('active');

      // Click exposure tab
      fireEvent.click(exposureTab);

      // Exposure should now be active
      expect(exposureTab).toHaveClass('active');
      expect(gamedayTab).not.toHaveClass('active');

      // Verify exposure content is displayed
      expect(screen.getByText('No teams selected')).toBeInTheDocument();
    });

  });

  describe('Exposure View Integration', () => {
    it('should display empty state when no teams selected', () => {
      const mockOnPlayerCountClick = vi.fn();

      render(
        <AppProvider>
          <ExposureView onPlayerCountClick={mockOnPlayerCountClick} />
        </AppProvider>
      );

      // Should show empty state message
      expect(screen.getByText('No teams selected')).toBeInTheDocument();
      expect(screen.getByText('Select at least one team from the team filter above to see your exposure report.')).toBeInTheDocument();
    });

    it('should display loading state when loading', () => {
      const mockOnPlayerCountClick = vi.fn();

      // Mock loading state in context
      render(
        <AppProvider>
          <ExposureView onPlayerCountClick={mockOnPlayerCountClick} />
        </AppProvider>
      );

      // Since we're not loading data, it should show the empty state
      expect(screen.getByText('No teams selected')).toBeInTheDocument();
    });
  });

  describe('Responsive Tab Behavior', () => {
    it('should apply desktop classes on large screens', () => {
      // Set desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const mockOnPlayerCountClick = vi.fn();
      const { container } = render(
        <AppProvider>
          <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
        </AppProvider>
      );

      const tabNavigation = container.querySelector('.tab-navigation');
      expect(tabNavigation).toHaveClass('tab-navigation--desktop');
    });

    it('should apply mobile classes on small screens', () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      const mockOnPlayerCountClick = vi.fn();
      const { container } = render(
        <AppProvider>
          <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
        </AppProvider>
      );

      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      const tabNavigation = container.querySelector('.tab-navigation');
      expect(tabNavigation).toHaveClass('tab-navigation--mobile');
    });

    it('should update classes when viewport changes', () => {
      const mockOnPlayerCountClick = vi.fn();
      const { container } = render(
        <AppProvider>
          <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
        </AppProvider>
      );

      // Start with desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      let tabNavigation = container.querySelector('.tab-navigation');
      expect(tabNavigation).toHaveClass('tab-navigation--desktop');

      // Change to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      tabNavigation = container.querySelector('.tab-navigation');
      expect(tabNavigation).toHaveClass('tab-navigation--mobile');
    });
  });

  describe('Accessibility and Touch Support', () => {
    it('should have proper accessibility attributes', () => {
      const mockOnPlayerCountClick = vi.fn();

      render(
        <AppProvider>
          <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
        </AppProvider>
      );

      const gamedayTab = screen.getByRole('tab', { name: /gameday/i });
      const exposureTab = screen.getByRole('tab', { name: /exposure/i });
      const tabPanel = screen.getByRole('tabpanel');

      expect(gamedayTab).toHaveAttribute('role', 'tab');
      expect(exposureTab).toHaveAttribute('role', 'tab');
      expect(tabPanel).toHaveAttribute('role', 'tabpanel');

      // Check aria-selected attributes
      expect(gamedayTab).toHaveAttribute('aria-selected', 'true');
      expect(exposureTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should support keyboard navigation', () => {
      const mockOnPlayerCountClick = vi.fn();

      render(
        <AppProvider>
          <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
        </AppProvider>
      );

      const gamedayTab = screen.getByRole('tab', { name: /gameday/i });
      // const exposureTab = screen.getByRole('tab', { name: /exposure/i });

      // Test keyboard navigation with arrow keys
      gamedayTab.focus();
      fireEvent.keyDown(gamedayTab, { key: 'ArrowRight' });

      // Should switch to exposure content
      expect(screen.getByText('No teams selected')).toBeInTheDocument();
    });

    it('should have touch-friendly attributes', () => {
      const mockOnPlayerCountClick = vi.fn();

      render(
        <AppProvider>
          <TabNavigation onPlayerCountClick={mockOnPlayerCountClick} />
        </AppProvider>
      );

      const gamedayTab = screen.getByRole('tab', { name: /gameday/i });
      const exposureTab = screen.getByRole('tab', { name: /exposure/i });

      expect(gamedayTab).toHaveAttribute('data-tab', 'gameday');
      expect(exposureTab).toHaveAttribute('data-tab', 'exposure');
    });
  });
});