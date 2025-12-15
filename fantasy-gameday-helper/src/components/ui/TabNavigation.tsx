import { useAppContext } from '../../context';
import { useEffect, useState, useCallback } from 'react';
import { GamedayView } from '../../views';
import './TabNavigation.css';

interface TabNavigationProps {
  onPlayerCountClick: (playerId: string, leagues: string[]) => void;
}

export function TabNavigation({ onPlayerCountClick }: TabNavigationProps) {
  const { state, setActiveTab } = useAppContext();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTabClick = (tab: 'gameday' | 'exposure') => {
    setActiveTab(tab);
  };

  /**
   * Handle player count clicks from GamedayView
   * Requirements: 3.4, 4.4 - League info popup functionality
   */
  const handlePlayerCountClick = useCallback((playerId: string, leagues: string[]) => {
    onPlayerCountClick(playerId, leagues);
  }, [onPlayerCountClick]);

  const handleKeyDown = (event: React.KeyboardEvent, tab: 'gameday' | 'exposure') => {
    // Handle keyboard navigation
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTabClick(tab);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const newTab = tab === 'gameday' ? 'exposure' : 'gameday';
      handleTabClick(newTab);
      
      // Focus the new tab button
      setTimeout(() => {
        const newButton = document.querySelector(`[data-tab="${newTab}"]`) as HTMLButtonElement;
        newButton?.focus();
      }, 0);
    }
  };

  return (
    <div 
      className={`tab-navigation ${isMobile ? 'tab-navigation--mobile' : 'tab-navigation--desktop'}`}
      role="tablist"
      aria-label="Main navigation"
    >
      {/* Tab buttons */}
      <div className="tab-buttons" role="tablist">
        <button
          className={`tab-button ${state.activeTab === 'gameday' ? 'active' : ''}`}
          onClick={() => handleTabClick('gameday')}
          onKeyDown={(e) => handleKeyDown(e, 'gameday')}
          aria-selected={state.activeTab === 'gameday'}
          aria-controls="gameday-panel"
          role="tab"
          tabIndex={state.activeTab === 'gameday' ? 0 : -1}
          data-tab="gameday"
          id="gameday-tab"
        >
          <span>Gameday</span>
        </button>
        <button
          className={`tab-button ${state.activeTab === 'exposure' ? 'active' : ''}`}
          onClick={() => handleTabClick('exposure')}
          onKeyDown={(e) => handleKeyDown(e, 'exposure')}
          aria-selected={state.activeTab === 'exposure'}
          aria-controls="exposure-panel"
          role="tab"
          tabIndex={state.activeTab === 'exposure' ? 0 : -1}
          data-tab="exposure"
          id="exposure-tab"
        >
          <span>Exposure</span>
        </button>
      </div>

      {/* Tab content area */}
      <div 
        className="tab-content" 
        role="tabpanel"
        aria-labelledby={`${state.activeTab}-tab`}
        id={`${state.activeTab}-panel`}
      >
        {state.activeTab === 'gameday' && (
          <div 
            className="gameday-content"
            role="region"
            aria-label="Gameday analysis content"
          >
            <GamedayView onPlayerCountClick={handlePlayerCountClick} />
          </div>
        )}
        
        {state.activeTab === 'exposure' && (
          <div 
            className="exposure-content"
            role="region"
            aria-label="Exposure report content"
          >
            {/* Placeholder for ExposureView component */}
            <div className="placeholder-content">
              <h3>Exposure Report</h3>
              <p>This will contain the ownership percentage analysis</p>
              <small>
                {isMobile ? 'Mobile view - tabs at bottom' : 'Desktop view - tabs at top'}
              </small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}