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
    expect(screen.getByRole('combobox', { name: 'NFL Week' })).toHaveValue('1');
    expect(screen.getByRole('button', { name: '↻' })).toBeInTheDocument();
  });

  it('offers every week from 1 to 18', () => {
    renderWithProvider(<WeekSelector />);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(18);
    expect(options.map((option) => option.textContent)).toEqual(
      Array.from({ length: 18 }, (_, index) => `Week ${index + 1}`)
    );
    expect(options.map((option) => (option as HTMLOptionElement).value)).toEqual(
      Array.from({ length: 18 }, (_, index) => `${index + 1}`)
    );
  });

  it('calls onWeekChange when a week is selected', () => {
    const onWeekChange = vi.fn();
    renderWithProvider(<WeekSelector onWeekChange={onWeekChange} />);

    const select = screen.getByRole('combobox', { name: 'NFL Week' });
    fireEvent.change(select, { target: { value: '5' } });

    expect(onWeekChange).toHaveBeenCalledWith(5);
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

    const select = screen.getByRole('combobox', { name: 'NFL Week' });
    const button = screen.getByRole('button');

    expect(select).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('reflects the selected week from global state', () => {
    renderWithProvider(<WeekSelector />);

    const select = screen.getByRole('combobox', { name: 'NFL Week' });
    fireEvent.change(select, { target: { value: '12' } });

    expect(select).toHaveValue('12');
  });

  it('does not call onWeekChange if week value has not changed', () => {
    const onWeekChange = vi.fn();
    renderWithProvider(<WeekSelector onWeekChange={onWeekChange} />);

    const select = screen.getByRole('combobox', { name: 'NFL Week' });

    // First change to a different value to establish baseline
    fireEvent.change(select, { target: { value: '5' } });

    // Clear the mock calls
    onWeekChange.mockClear();

    // Change to same value (5)
    fireEvent.change(select, { target: { value: '5' } });

    // Should not call onWeekChange since value didn't actually change
    expect(onWeekChange).not.toHaveBeenCalled();
  });

  it('handles refresh button with correct title', () => {
    renderWithProvider(<WeekSelector />);

    const refreshButton = screen.getByRole('button', { name: '↻' });
    expect(refreshButton).toHaveAttribute('title', 'Reload data for this week');
  });
});
