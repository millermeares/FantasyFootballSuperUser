import { useEffect, useRef } from 'react';
import type { PopupPlayer, PopupContext } from '../../types/app';
import './LeagueInfoPopup.css';

interface LeagueInfoPopupProps {
  isOpen: boolean;
  player: PopupPlayer | null;
  leagues: string[];
  /**
   * Which side of the player's allegiance the listed leagues represent.
   * Only aggregate rows have two sides, so this defaults to a single total.
   */
  context?: PopupContext;
  onClose: () => void;
}

/**
 * The headline stat depends on where the popup was opened from. An aggregate
 * row has separate "for" and "against" counts, so the count shown has to match
 * the league list beside it.
 */
function describeCount(
  player: PopupPlayer,
  context: PopupContext
): { label: string; value: string } {
  if ('exposurePercentage' in player) {
    return {
      label: 'Exposure:',
      value: `${player.exposurePercentage.toFixed(1)}% (${player.teamCount}/${player.totalTeams} teams)`,
    };
  }

  const teamWord = (count: number) => (count === 1 ? 'team' : 'teams');

  if ('netCount' in player) {
    const count = context === 'against' ? player.againstCount : player.forCount;
    return {
      label: context === 'against' ? 'Cheering against in:' : 'Cheering for in:',
      value: `${count} ${teamWord(count)}`,
    };
  }

  return {
    label: 'Total Appearances:',
    value: `${player.count}`,
  };
}

/** Heading for the league list, phrased to match where the popup came from. */
function describeLeagues(context: PopupContext): string {
  if (context === 'for') return 'You start them in these leagues:';
  if (context === 'against') return 'You face them in these leagues:';
  return 'Appears in these leagues:';
}

export function LeagueInfoPopup({
  isOpen,
  player,
  leagues,
  context = 'total',
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

  const countRow = describeCount(player, context);

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
              <span className="player-info-label">{countRow.label}</span>
              <span className="player-info-value count-badge">{countRow.value}</span>
            </div>
          </div>

          <div className="leagues-section">
            <h4 id="popup-description" className="leagues-title">
              {describeLeagues(context)}
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