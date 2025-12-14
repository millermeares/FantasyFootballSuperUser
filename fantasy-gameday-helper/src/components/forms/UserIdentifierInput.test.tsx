import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserIdentifierInput } from './UserIdentifierInput';
import { AppProvider } from '../../context';
import * as SleeperApiService from '../../services/api/SleeperApiService';

// Mock the SleeperApiService
vi.mock('../../services/api/SleeperApiService', () => ({
  getSleeperApiService: vi.fn(),
}));

const mockSleeperApiService = {
  getUser: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  (SleeperApiService.getSleeperApiService as any).mockReturnValue(mockSleeperApiService);
  // Clear localStorage
  localStorage.clear();
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <AppProvider>
      {component}
    </AppProvider>
  );
};

describe('UserIdentifierInput', () => {
  it('renders input form when no user is loaded', () => {
    renderWithProvider(<UserIdentifierInput />);
    
    expect(screen.getByLabelText(/sleeper username or user id/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your sleeper username or user id/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load teams/i })).toBeInTheDocument();
  });

  it('shows validation error for empty input', async () => {
    renderWithProvider(<UserIdentifierInput />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText(/sleeper identifier is required/i)).toBeInTheDocument();
    });
  });

  it('disables submit button when input is empty', () => {
    renderWithProvider(<UserIdentifierInput />);
    
    const submitButton = screen.getByRole('button', { name: /load teams/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when input has valid value', () => {
    renderWithProvider(<UserIdentifierInput />);
    
    const input = screen.getByLabelText(/sleeper username or user id/i);
    fireEvent.change(input, { target: { value: 'testuser' } });
    
    const submitButton = screen.getByRole('button', { name: /load teams/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('calls API and shows loading state on valid input', async () => {
    const mockUser = {
      user_id: '123456789',
      username: 'testuser',
      display_name: 'Test User'
    };
    
    mockSleeperApiService.getUser.mockResolvedValue(mockUser);
    
    renderWithProvider(<UserIdentifierInput />);
    
    const input = screen.getByLabelText(/sleeper username or user id/i);
    fireEvent.change(input, { target: { value: 'testuser' } });
    
    const submitButton = screen.getByRole('button', { name: /load teams/i });
    fireEvent.click(submitButton);
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
    
    // Should call the API
    expect(mockSleeperApiService.getUser).toHaveBeenCalledWith('testuser');
    
    // Should show user info after loading
    await waitFor(() => {
      expect(screen.getByText(/welcome, test user!/i)).toBeInTheDocument();
      expect(screen.getByText(/user id: 123456789/i)).toBeInTheDocument();
    });
  });

  it('shows error message when API call fails', async () => {
    mockSleeperApiService.getUser.mockRejectedValue(new Error('User not found'));
    
    renderWithProvider(<UserIdentifierInput />);
    
    const input = screen.getByLabelText(/sleeper username or user id/i);
    fireEvent.change(input, { target: { value: 'nonexistentuser' } });
    
    const submitButton = screen.getByRole('button', { name: /load teams/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/user not found/i)).toBeInTheDocument();
    });
  });

  it('shows change user button when user is loaded', async () => {
    const mockUser = {
      user_id: '123456789',
      username: 'testuser',
      display_name: 'Test User'
    };
    
    mockSleeperApiService.getUser.mockResolvedValue(mockUser);
    
    renderWithProvider(<UserIdentifierInput />);
    
    const input = screen.getByLabelText(/sleeper username or user id/i);
    fireEvent.change(input, { target: { value: 'testuser' } });
    
    const submitButton = screen.getByRole('button', { name: /load teams/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/welcome, test user!/i)).toBeInTheDocument();
    });
    
    // Should show change user button
    expect(screen.getByRole('button', { name: /change user/i })).toBeInTheDocument();
  });

  it('clears user when change user button is clicked', async () => {
    const mockUser = {
      user_id: '123456789',
      username: 'testuser',
      display_name: 'Test User'
    };
    
    mockSleeperApiService.getUser.mockResolvedValue(mockUser);
    
    renderWithProvider(<UserIdentifierInput />);
    
    // Load user first
    const input = screen.getByLabelText(/sleeper username or user id/i);
    fireEvent.change(input, { target: { value: 'testuser' } });
    
    const submitButton = screen.getByRole('button', { name: /load teams/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/welcome, test user!/i)).toBeInTheDocument();
    });
    
    // Click change user
    const changeUserButton = screen.getByRole('button', { name: /change user/i });
    fireEvent.click(changeUserButton);
    
    // Should show input form again
    await waitFor(() => {
      expect(screen.getByLabelText(/sleeper username or user id/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /load teams/i })).toBeInTheDocument();
    });
  });

  it('persists user identifier to localStorage on successful load', async () => {
    const mockUser = {
      user_id: '123456789',
      username: 'testuser',
      display_name: 'Test User'
    };
    
    mockSleeperApiService.getUser.mockResolvedValue(mockUser);
    
    renderWithProvider(<UserIdentifierInput />);
    
    const input = screen.getByLabelText(/sleeper username or user id/i);
    fireEvent.change(input, { target: { value: 'testuser' } });
    
    const submitButton = screen.getByRole('button', { name: /load teams/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/welcome, test user!/i)).toBeInTheDocument();
    });
    
    // Should persist to localStorage
    expect(localStorage.getItem('sleeper_user_identifier')).toBe('testuser');
  });

  it('calls onUserLoaded callback when provided', async () => {
    const mockUser = {
      user_id: '123456789',
      username: 'testuser',
      display_name: 'Test User'
    };
    
    const onUserLoaded = vi.fn();
    mockSleeperApiService.getUser.mockResolvedValue(mockUser);
    
    renderWithProvider(<UserIdentifierInput onUserLoaded={onUserLoaded} />);
    
    const input = screen.getByLabelText(/sleeper username or user id/i);
    fireEvent.change(input, { target: { value: 'testuser' } });
    
    const submitButton = screen.getByRole('button', { name: /load teams/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onUserLoaded).toHaveBeenCalledWith(mockUser);
    });
  });
});