import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeekSelector } from './WeekSelector';
import { AppProvider } from '../../context';

// Helper to render with provider
const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <AppProvider>
      {component}
    </AppProvider>
  );
};

describe('WeekSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders week selector with default week', () => {
    renderWithProvider(<WeekSelector />);
    
    expect(screen.getByLabelText('NFL Week')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '↻' })).toBeInTheDocument();
  });

  it('shows number input with correct attributes', () => {
    renderWithProvider(<WeekSelector />);
    
    const input = screen.getByRole('spinbutton', { name: 'NFL Week' });
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '18');
    expect(input).toHaveAttribute('placeholder', 'Week (1-18)');
  });

  it('calls onWeekChange when week input changes', () => {
    const onWeekChange = vi.fn();
    renderWithProvider(<WeekSelector onWeekChange={onWeekChange} />);
    
    const input = screen.getByRole('spinbutton', { name: 'NFL Week' });
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.blur(input);
    
    expect(onWeekChange).toHaveBeenCalledWith(5);
  });

  it('validates week input correctly', () => {
    renderWithProvider(<WeekSelector />);
    
    const input = screen.getByRole('spinbutton', { name: 'NFL Week' });
    
    // Test invalid input
    fireEvent.change(input, { target: { value: '25' } });
    fireEvent.blur(input);
    expect(screen.getByText('Week must be between 1 and 18')).toBeInTheDocument();
  });

  it('validates empty week input', () => {
    renderWithProvider(<WeekSelector />);
    
    const input = screen.getByRole('spinbutton', { name: 'NFL Week' });
    
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(screen.getByText('Week number is required')).toBeInTheDocument();
  });

  it('validates non-numeric week input', () => {
    renderWithProvider(<WeekSelector />);
    
    const input = screen.getByRole('spinbutton', { name: 'NFL Week' });
    
    // Add non-numeric value - HTML number inputs may handle this differently
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);
    
    // The validation should catch this
    expect(screen.getByText(/Week must be a valid number|Week number is required/)).toBeInTheDocument();
  });

  it('calls onWeekChange when refresh button is clicked', () => {
    const onWeekChange = vi.fn();
    renderWithProvider(<WeekSelector onWeekChange={onWeekChange} />);
    
    const refreshButton = screen.getByRole('button', { name: '↻' });
    fireEvent.click(refreshButton);
    
    // Should call onWeekChange with current week
    expect(onWeekChange).toHaveBeenCalled();
  });

  it('disables controls when disabled prop is true', () => {
    renderWithProvider(<WeekSelector disabled={true} />);
    
    const input = screen.getByRole('spinbutton', { name: 'NFL Week' });
    const button = screen.getByRole('button');
    
    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('clears validation error when valid input is entered', () => {
    renderWithProvider(<WeekSelector />);
    
    const input = screen.getByRole('spinbutton', { name: 'NFL Week' });
    
    // Enter invalid input
    fireEvent.change(input, { target: { value: '25' } });
    fireEvent.blur(input);
    expect(screen.getByText('Week must be between 1 and 18')).toBeInTheDocument();
    
    // Enter valid input
    fireEvent.change(input, { target: { value: '10' } });
    expect(screen.queryByText('Week must be between 1 and 18')).not.toBeInTheDocument();
  });

  it('updates input value when global state changes', () => {
    renderWithProvider(<WeekSelector />);
    
    const input = screen.getByRole('spinbutton', { name: 'NFL Week' });
    fireEvent.change(input, { target: { value: '12' } });
    fireEvent.blur(input);
    
    // Input should reflect the change
    expect(input).toHaveValue(12);
  });

  it('does not call onWeekChange if week value has not changed', () => {
    const onWeekChange = vi.fn();
    renderWithProvider(<WeekSelector onWeekChange={onWeekChange} />);
    
    const input = screen.getByRole('spinbutton', { name: 'NFL Week' });
    
    // First change to a different value to establish baseline
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.blur(input);
    
    // Clear the mock calls
    onWeekChange.mockClear();
    
    // Change to same value (5)
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.blur(input);
    
    // Should not call onWeekChange since value didn't actually change
    expect(onWeekChange).not.toHaveBeenCalled();
  });

  it('handles refresh button with correct title', () => {
    renderWithProvider(<WeekSelector />);
    
    const refreshButton = screen.getByRole('button', { name: '↻' });
    expect(refreshButton).toHaveAttribute('title', 'Reload data for this week');
  });
});