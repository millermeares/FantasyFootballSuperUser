import { useState } from 'react';
import { PlayerTable } from './PlayerTable';
import type { PlayerAllegiance } from '../../types/app';

// Example data for demonstration
const exampleCheeringForPlayers: PlayerAllegiance[] = [
  {
    playerId: '4046',
    playerName: 'Josh Allen',
    position: 'QB',
    team: 'BUF',
    count: 4,
    leagues: ['Main League', 'Work League', 'Family League', 'Friends League']
  },
  {
    playerId: '4034',
    playerName: 'Christian McCaffrey',
    position: 'RB',
    team: 'SF',
    count: 3,
    leagues: ['Main League', 'Work League', 'Family League']
  },
  {
    playerId: '6797',
    playerName: 'Tyreek Hill',
    position: 'WR',
    team: 'MIA',
    count: 2,
    leagues: ['Work League', 'Friends League']
  },
  {
    playerId: '4881',
    playerName: 'Travis Kelce',
    position: 'TE',
    team: 'KC',
    count: 2,
    leagues: ['Main League', 'Family League']
  },
  {
    playerId: '6945',
    playerName: 'Justin Tucker',
    position: 'K',
    team: 'BAL',
    count: 1,
    leagues: ['Main League']
  }
];

const exampleCheeringAgainstPlayers: PlayerAllegiance[] = [
  {
    playerId: '4017',
    playerName: 'Lamar Jackson',
    position: 'QB',
    team: 'BAL',
    count: 3,
    leagues: ['Main League', 'Work League', 'Family League']
  },
  {
    playerId: '5849',
    playerName: 'Saquon Barkley',
    position: 'RB',
    team: 'PHI',
    count: 2,
    leagues: ['Work League', 'Friends League']
  },
  {
    playerId: '6813',
    playerName: 'CeeDee Lamb',
    position: 'WR',
    team: 'DAL',
    count: 2,
    leagues: ['Main League', 'Family League']
  },
  {
    playerId: '4866',
    playerName: 'George Kittle',
    position: 'TE',
    team: 'SF',
    count: 1,
    leagues: ['Friends League']
  }
];

export function PlayerTableExample() {
  const [popupData, setPopupData] = useState<{
    isOpen: boolean;
    player: PlayerAllegiance | null;
    leagues: string[];
  }>({
    isOpen: false,
    player: null,
    leagues: []
  });

  const handleCountClick = (playerId: string, leagues: string[]) => {
    // Find player in either cheering for or against lists
    const allPlayers = [...exampleCheeringForPlayers, ...exampleCheeringAgainstPlayers];
    const player = allPlayers.find((p: PlayerAllegiance) => p.playerId === playerId);
    if (player) {
      setPopupData({
        isOpen: true,
        player,
        leagues
      });
    }
  };

  const closePopup = () => {
    setPopupData({
      isOpen: false,
      player: null,
      leagues: []
    });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Player Table Examples</h1>
      
      <div style={{ marginBottom: '3rem' }}>
        <PlayerTable
          players={exampleCheeringForPlayers}
          title="Players to Cheer For"
          onCountClick={handleCountClick}
          emptyMessage="No players to cheer for this week"
        />
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <PlayerTable
          players={exampleCheeringAgainstPlayers}
          title="Players to Cheer Against"
          onCountClick={handleCountClick}
          emptyMessage="No opposing players this week"
        />
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <PlayerTable
          players={[]}
          title="Empty Table Example"
          emptyMessage="No players found for your selection"
        />
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <PlayerTable
          players={exampleCheeringForPlayers.slice(0, 2)}
          title="Table Without Click Handlers"
          emptyMessage="No data available"
        />
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <PlayerTable
          players={exampleCheeringForPlayers}
          title="Compact Table"
          className="compact"
          onCountClick={handleCountClick}
        />
      </div>

      {/* Simple popup demonstration */}
      {popupData.isOpen && popupData.player && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={closePopup}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>League Information</h3>
            <p>
              <strong>{popupData.player.playerName}</strong> appears in {popupData.player.count} league{popupData.player.count !== 1 ? 's' : ''}:
            </p>
            <ul>
              {popupData.leagues.map((league, index) => (
                <li key={index}>{league}</li>
              ))}
            </ul>
            <button 
              onClick={closePopup}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerTableExample;