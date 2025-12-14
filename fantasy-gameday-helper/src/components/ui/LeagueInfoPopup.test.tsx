import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LeagueInfoPopup } from './LeagueInfoPopup';
import type { PlayerAllegiance } from '../../types/app';

// Mock player data for testing
const mockPlayer: PlayerAllegiance = {
  playerId: 'test-player-1',
  playerName: 'Test Player',
  position: 'RB',
  team: 'TEST',
  count: 3,
  leagues: ['League 1', 'League 2', 'League 3'],
};

const mockLeagues = ['League 1', 'League 2', 'League 3'];

describe('LeagueInfoPopup', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  afterEach(() => {
    // Clean up any body style changes
    document.body.style.overflow = '';
  });

  it('renders nothing when not open', () => {
    render(
      <LeagueInfoPopup
        isOpen={false}
        player={mockPlayer}
        leagues={mockLeagues}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders nothing when player is null', () => {
    render(
      <LeagueInfoPopup
        isOpen={true}
        player={null}
        leagues={mockLeagues}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders popup with player information when open', () => {
    render(
      <LeagueInfoPopup
        isOpen={true}
        player={mockPlayer}
        leagues={mockLeagues}
        onClose={mockOnClose}
      />
    );

    // Check dialog is present
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Check player name in title
    expect(screen.getByText('Test Player')).toBeInTheDocument();
    
    // Check player details
    expect(screen.getByText('RB')).toBeInTheDocument();
    expect(screen.getByText('TEST')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Check leagues section
    expect(screen.getByText('Appears in these leagues:')).toBeInTheDocument();
    expect(screen.getByText('League 1')).toBeInTheDocument();
    expect(screen.getByText('League 2')).toBeInTheDocument();
    expect(screen.getByText('League 3')).toBeInTheDocument();
  });

  it('renders empty state when no leagues provided', () => {
    render(
      <LeagueInfoPopup
        isOpen={true}
        player={mockPlayer}
        leagues={[]}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('No league information available')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <LeagueInfoPopup
        isOpen={true}
        player={mockPlayer}
        leagues={mockLeagues}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close league information popup');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when footer close button is clicked', () => {
    render(
      <LeagueInfoPopup
        isOpen={true}
        player={mockPlayer}
        leagues={mockLeagues}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(
      <LeagueInfoPopup
        isOpen={true}
        player={mockPlayer}
        leagues={mockLeagues}
        onClose={mockOnClose}
      />
    );

    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when popup content is clicked', () => {
    render(
      <LeagueInfoPopup
        isOpen={true}
        player={mockPlayer}
        leagues={mockLeagues}
        onClose={mockOnClose}
      />
    );

    const popupContent = screen.getByRole('document');
    fireEvent.click(popupContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    render(
      <LeagueInfoPopup
        isOpen={true}
        player={mockPlayer}
        leagues={mockLeagues}
        onClose={mockOnClose}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('sets body overflow to hidden when open', () => {
    render(
      <LeagueInfoPopup
        isOpen={true}
        player={mockPlayer}
        leagues={mockLeagues}
        onClose={mockOnClose}
      />
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('has proper accessibility attributes', () => {
    render(
      <LeagueInfoPopup
        isOpen={true}
        player={mockPlayer}
        leagues={mockLeagues}
        onClose={mockOnClose}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'popup-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'popup-description');

    // Check that the title and description elements exist
    expect(screen.getByRole('heading', { level: 3 })).toHaveAttribute('id', 'popup-title');
    expect(screen.getByRole('heading', { level: 4 })).toHaveAttribute('id', 'popup-description');
  });

  it('renders leagues as a proper list', () => {
    render(
      <LeagueInfoPopup
        isOpen={true}
        player={mockPlayer}
        leagues={mockLeagues}
        onClose={mockOnClose}
      />
    );

    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
  });
});