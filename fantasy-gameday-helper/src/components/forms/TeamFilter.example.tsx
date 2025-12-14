// Example usage of TeamFilter component
import { TeamFilter } from './TeamFilter';
import { AppProvider } from '../../context';
import type { UserTeam } from '../../types/app';

// Example usage of TeamFilter component
export function TeamFilterExample() {
  const handleTeamSelectionChange = (selectedTeams: UserTeam[]) => {
    console.log('Selected teams changed:', selectedTeams);
  };

  return (
    <AppProvider>
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h2>Team Filter Component Example</h2>
        
        <div style={{ marginBottom: '2rem' }}>
          <h3>Default Team Filter</h3>
          <TeamFilter onTeamSelectionChange={handleTeamSelectionChange} />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3>Compact Team Filter</h3>
          <TeamFilter 
            className="compact" 
            onTeamSelectionChange={handleTeamSelectionChange} 
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3>Custom Styled Team Filter</h3>
          <TeamFilter 
            className="custom-style" 
            onTeamSelectionChange={handleTeamSelectionChange} 
          />
        </div>
      </div>
    </AppProvider>
  );
}

// Example with mock data (for development/testing)
export function TeamFilterWithMockData() {
  // This would typically be provided by the AppContext
  const mockTeams: UserTeam[] = [
    {
      leagueId: 'league_001',
      leagueName: 'Championship League',
      rosterId: 1,
      isSelected: true,
    },
    {
      leagueId: 'league_002',
      leagueName: 'Friends & Family League',
      rosterId: 2,
      isSelected: true,
    },
    {
      leagueId: 'league_003',
      leagueName: 'Work League',
      rosterId: 3,
      isSelected: false,
    },
    {
      leagueId: 'league_004',
      leagueName: 'High Stakes League',
      rosterId: 4,
      isSelected: true,
    },
    {
      leagueId: 'league_005',
      leagueName: 'Dynasty League',
      rosterId: 5,
      isSelected: false,
    },
  ];

  const handleTeamSelectionChange = (selectedTeams: UserTeam[]) => {
    console.log('Teams selected:', selectedTeams.length);
    console.log('Selected team names:', selectedTeams.map(t => t.leagueName));
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Team Filter with Mock Data</h2>
      <p>This example shows how the component would look with actual team data.</p>
      
      {/* Note: In a real app, this data would come from AppContext */}
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '1rem',
        background: '#f9f9f9'
      }}>
        <h4>Mock Teams Data:</h4>
        <ul>
          {mockTeams.map(team => (
            <li key={team.leagueId}>
              {team.leagueName} - {team.isSelected ? '✓ Selected' : '✗ Not Selected'}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <TeamFilter onTeamSelectionChange={handleTeamSelectionChange} />
      </div>
    </div>
  );
}

export default TeamFilterExample;