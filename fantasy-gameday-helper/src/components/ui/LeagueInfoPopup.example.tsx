import { useState } from 'react';
import { LeagueInfoPopup } from './LeagueInfoPopup';
import type { PlayerAllegiance } from '../../types/app';

// Example usage of LeagueInfoPopup component
export function LeagueInfoPopupExample() {
  const [isOpen, setIsOpen] = useState(false);

  // Mock player data for demonstration
  const mockPlayer: PlayerAllegiance = {
    playerId: 'example-player-1',
    playerName: 'Christian McCaffrey',
    position: 'RB',
    team: 'SF',
    count: 4,
    leagues: [
      'Championship League',
      'Friends & Family',
      'Work League',
      'High Stakes Dynasty'
    ],
  };

  const mockLeagues = [
    'Championship League',
    'Friends & Family', 
    'Work League',
    'High Stakes Dynasty'
  ];

  const handleOpenPopup = () => {
    setIsOpen(true);
  };

  const handleClosePopup = () => {
    setIsOpen(false);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>League Info Popup Example</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <p>Click the button below to see the league info popup in action:</p>
        <button
          onClick={handleOpenPopup}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Show Player League Info
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Features Demonstrated:</h3>
        <ul>
          <li>Modal overlay with backdrop click to close</li>
          <li>Player information display (name, position, team, count)</li>
          <li>List of leagues where the player appears</li>
          <li>Accessible keyboard navigation (Tab, Escape)</li>
          <li>Focus management and focus trap</li>
          <li>Responsive design for mobile devices</li>
          <li>Proper ARIA attributes for screen readers</li>
        </ul>
      </div>

      <div>
        <h3>Accessibility Features:</h3>
        <ul>
          <li>ARIA modal attributes (role="dialog", aria-modal="true")</li>
          <li>Proper heading structure with aria-labelledby and aria-describedby</li>
          <li>Focus trap to keep keyboard navigation within the popup</li>
          <li>Escape key to close</li>
          <li>Focus management (focuses close button on open)</li>
          <li>Semantic HTML with proper list structure</li>
        </ul>
      </div>

      <LeagueInfoPopup
        isOpen={isOpen}
        player={mockPlayer}
        leagues={mockLeagues}
        onClose={handleClosePopup}
      />
    </div>
  );
}

export default LeagueInfoPopupExample;