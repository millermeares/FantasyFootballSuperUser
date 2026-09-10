import React from 'react';
import { useAppContext } from '../../context';
import './WeekSelector.css';

interface WeekSelectorProps {
  onWeekChange?: (week: number) => void;
  className?: string;
  disabled?: boolean;
}

const WEEK_OPTIONS = Array.from({ length: 18 }, (_, index) => index + 1);

export function WeekSelector({ onWeekChange, className = '', disabled = false }: WeekSelectorProps) {
  const { state, setWeek } = useAppContext();

  const handleWeekSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const weekNumber = parseInt(event.target.value, 10);

    // Only update if the week actually changed
    if (weekNumber !== state.selectedWeek) {
      setWeek(weekNumber);

      if (onWeekChange) {
        onWeekChange(weekNumber);
      }
    }
  };

  const handleRefreshClick = () => {
    // Trigger refresh by calling onWeekChange with current week
    // This will reload the data for the current week
    if (onWeekChange) {
      onWeekChange(state.selectedWeek);
    }
  };

  return (
    <div className={`week-selector ${className}`}>
      <div className="week-selector-content">
        <div className="form-group">
          <label htmlFor="week-select" className="form-label">
            NFL Week
          </label>

          <div className="week-input-group">
            <select
              id="week-select"
              value={state.selectedWeek}
              onChange={handleWeekSelect}
              disabled={disabled}
              className="week-select"
            >
              {WEEK_OPTIONS.map((week) => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleRefreshClick}
              disabled={disabled}
              className="refresh-week-button"
              title="Reload data for this week"
            >
              ↻
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeekSelector;
