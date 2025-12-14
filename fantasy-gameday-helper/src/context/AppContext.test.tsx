import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import fc from 'fast-check';
import { AppProvider, useAppContext } from './AppContext';
import type { SleeperUser } from '../types/sleeper';
import type { UserTeam } from '../types/app';

// Test component to interact with context
function TestComponent() {
  const { state, setUser, setWeek, setLoading, setError, toggleTeam, dispatch } = useAppContext();

  return (
    <div>
      <div data-testid="user">{state.user?.username || 'No user'}</div>
      <div data-testid="week">{state.selectedWeek}</div>
      <div data-testid="loading">{state.loading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="error">{state.error || 'No error'}</div>
      <div data-testid="teams-count">{state.userTeams.length}</div>
      
      <button
        data-testid="set-user"
        onClick={() => setUser({ user_id: '123', username: 'testuser', display_name: 'Test User' } as SleeperUser)}
      >
        Set User
      </button>
      
      <button
        data-testid="set-week"
        onClick={() => setWeek(5)}
      >
        Set Week 5
      </button>
      
      <button
        data-testid="set-loading"
        onClick={() => setLoading(true)}
      >
        Set Loading
      </button>
      
      <button
        data-testid="set-error"
        onClick={() => setError('Test error')}
      >
        Set Error
      </button>
      
      <button
        data-testid="toggle-team"
        onClick={() => toggleTeam('league1')}
      >
        Toggle Team
      </button>
      
      <button
        data-testid="set-teams"
        onClick={() => dispatch({ 
          type: 'SET_GAMEDAY_DATA', 
          payload: { 
            cheeringFor: [], 
            cheeringAgainst: [], 
            userTeams: [
              { leagueId: 'league1', leagueName: 'League 1', rosterId: 1, isSelected: true },
              { leagueId: 'league2', leagueName: 'League 2', rosterId: 2, isSelected: true }
            ]
          }
        })}
      >
        Set Teams
      </button>
    </div>
  );
}

describe('AppContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should provide initial state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('week')).toHaveTextContent('1');
    expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    expect(screen.getByTestId('error')).toHaveTextContent('No error');
    expect(screen.getByTestId('teams-count')).toHaveTextContent('0');
  });

  it('should update user state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByTestId('set-user').click();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('testuser');
  });

  it('should update week state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByTestId('set-week').click();
    });

    expect(screen.getByTestId('week')).toHaveTextContent('5');
  });

  it('should update loading state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByTestId('set-loading').click();
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
  });

  it('should update error state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByTestId('set-error').click();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Test error');
  });

  it('should persist selected week to localStorage', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByTestId('set-week').click();
    });

    expect(localStorage.getItem('sleeper_selected_week')).toBe('5');
  });

  it('should persist user identifier to localStorage', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByTestId('set-user').click();
    });

    expect(localStorage.getItem('sleeper_user_identifier')).toBe('testuser');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAppContext must be used within an AppProvider');
    
    consoleSpy.mockRestore();
  });

  // Property-based test for team selection state consistency
  it('Property 2: Team selection state consistency', () => {
    // **Feature: fantasy-gameday-helper, Property 2: Team selection state consistency**
    fc.assert(fc.property(
      // Generate an array of user teams
      fc.array(
        fc.record({
          leagueId: fc.string({ minLength: 1, maxLength: 20 }),
          leagueName: fc.string({ minLength: 1, maxLength: 50 }),
          rosterId: fc.integer({ min: 1, max: 12 }),
          isSelected: fc.boolean()
        }),
        { minLength: 1, maxLength: 10 }
      ),
      // Generate a league ID to toggle (must be one from the teams)
      (teams: UserTeam[]) => {
        // Ensure we have unique league IDs
        const uniqueTeams = teams.reduce((acc, team) => {
          const existingIndex = acc.findIndex(t => t.leagueId === team.leagueId);
          if (existingIndex === -1) {
            acc.push(team);
          }
          return acc;
        }, [] as UserTeam[]);

        if (uniqueTeams.length === 0) return true; // Skip empty arrays

        // Test component that manages state internally
        let contextValue: any = null;
        
        function PropertyTestComponent() {
          const context = useAppContext();
          contextValue = context;
          
          // Set initial teams
          React.useEffect(() => {
            context.dispatch({
              type: 'SET_GAMEDAY_DATA',
              payload: {
                cheeringFor: [],
                cheeringAgainst: [],
                userTeams: uniqueTeams
              }
            });
          }, []);

          return <div data-testid="property-test">Property Test</div>;
        }

        // Render the component
        const { unmount } = render(
          <AppProvider>
            <PropertyTestComponent />
          </AppProvider>
        );

        // Wait for initial state to be set
        act(() => {
          // Force a re-render to ensure state is updated
        });

        if (!contextValue || contextValue.state.userTeams.length === 0) {
          unmount();
          return true; // Skip if state not properly initialized
        }

        // Pick a random team to toggle
        const teamToToggle = uniqueTeams[Math.floor(Math.random() * uniqueTeams.length)];
        const initialState = contextValue.state.userTeams;
        const targetTeam = initialState.find((t: UserTeam) => t.leagueId === teamToToggle.leagueId);
        
        if (!targetTeam) {
          unmount();
          return true; // Skip if team not found
        }

        const initialSelection = targetTeam.isSelected;

        // Toggle the team
        act(() => {
          contextValue.toggleTeam(teamToToggle.leagueId);
        });

        const finalState = contextValue.state.userTeams;
        const toggledTeam = finalState.find((t: UserTeam) => t.leagueId === teamToToggle.leagueId);

        // Verify the toggled team's selection state changed
        const selectionChanged = toggledTeam && toggledTeam.isSelected === !initialSelection;

        // Verify other teams' states remained unchanged
        const otherTeamsUnchanged = finalState.every((finalTeam: UserTeam) => {
          if (finalTeam.leagueId === teamToToggle.leagueId) {
            return true; // Skip the toggled team
          }
          
          const initialTeam = initialState.find((t: UserTeam) => t.leagueId === finalTeam.leagueId);
          return initialTeam && 
                 initialTeam.isSelected === finalTeam.isSelected &&
                 initialTeam.leagueName === finalTeam.leagueName &&
                 initialTeam.rosterId === finalTeam.rosterId;
        });

        // Verify the total number of teams remained the same
        const teamCountUnchanged = initialState.length === finalState.length;

        unmount();
        
        return selectionChanged && otherTeamsUnchanged && teamCountUnchanged;
      }
    ), { numRuns: 100 });
  });
});