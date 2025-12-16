import { useEffect, useRef } from 'react';
import type { PlayerAllegiance, PlayerExposure } from '../../types/app';
import './LeagueInfoPopup.css';

interface LeagueInfoPopupProps {
  isOpen: boolean;
  player: PlayerAllegiance | PlayerExposure | null;
  leagues: string[];
  onClose: () => void;
}

export function LeagueInfoPopup({
  isOpen,
  player,
  leagues,
  onClose,
}: LeagueInfoPopupProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Handle escape key and focus management
  useEffect(() => {
    if (!isOpen) return;

    // Focus the close button when popup opens
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    // Handle escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Handle focus trap
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTabKey);

    // Prevent body scroll when popup is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !player) {
    return null;
  }

  return (
    <div
      className="league-popup-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
      aria-describedby="popup-description"
    >
      <div
        ref={dialogRef}
        className="league-popup-container"
        role="document"
      >
        <div className="league-popup-header">
          <h3 id="popup-title" className="league-popup-title">
            {player.playerName}
          </h3>
          <button
            ref={closeButtonRef}
            type="button"
            className="league-popup-close"
            onClick={onClose}
            aria-label="Close league information popup"
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="league-popup-content">
          <div className="player-details">
            <div className="player-info-row">
              <span className="player-info-label">Position:</span>
              <span className="player-info-value position-badge">{player.position}</span>
            </div>
            <div className="player-info-row">
              <span className="player-info-label">Team:</span>
              <span className="player-info-value team-name">{player.team}</span>
            </div>
            <div className="player-info-row">
              <span className="player-info-label">
                {'exposurePercentage' in player ? 'Exposure:' : 'Total Appearances:'}
              </span>
              <span className="player-info-value count-badge">
                {'exposurePercentage' in player 
                  ? `${player.exposurePercentage.toFixed(1)}% (${player.teamCount}/${player.totalTeams} teams)`
                  : player.count
                }
              </span>
            </div>
          </div>

          <div className="leagues-section">
            <h4 id="popup-description" className="leagues-title">
              Appears in these leagues:
            </h4>
            {leagues.length > 0 ? (
              <ul className="leagues-list" role="list">
                {leagues.map((leagueName, index) => (
                  <li key={index} className="league-item" role="listitem">
                    <span className="league-name">{leagueName}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-leagues-message">
                No league information available
              </p>
            )}
          </div>
        </div>

        <div className="league-popup-footer">
          <button
            type="button"
            className="league-popup-close-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeagueInfoPopup;