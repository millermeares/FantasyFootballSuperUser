import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context';
import './WeekSelector.css';

interface WeekSelectorProps {
  onWeekChange?: (week: number) => void;
  className?: string;
  disabled?: boolean;
}

export function WeekSelector({ onWeekChange, className = '', disabled = false }: WeekSelectorProps) {
  const { state, setWeek } = useAppContext();
  const [inputValue, setInputValue] = useState(state.selectedWeek.toString());
  const [validationError, setValidationError] = useState('');

  // Update input value when global state changes
  useEffect(() => {
    setInputValue(state.selectedWeek.toString());
  }, [state.selectedWeek]);

  // Clear validation error when input changes to valid value
  useEffect(() => {
    if (validationError && isValidWeek(parseInt(inputValue, 10))) {
      setValidationError('');
    }
  }, [inputValue, validationError]);

  const isValidWeek = (week: number): boolean => {
    return Number.isInteger(week) && week >= 1 && week <= 18;
  };

  const validateWeek = (value: string): string | null => {
    const trimmed = value.trim();
    
    if (!trimmed) {
      return 'Week number is required';
    }
    
    const weekNumber = parseInt(trimmed, 10);
    
    if (isNaN(weekNumber)) {
      return 'Week must be a valid number';
    }
    
    if (!isValidWeek(weekNumber)) {
      return 'Week must be between 1 and 18';
    }
    
    return null;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    
    // Clear validation error immediately if input becomes valid
    const weekNumber = parseInt(value, 10);
    if (isValidWeek(weekNumber)) {
      setValidationError('');
    }
  };

  const handleInputBlur = () => {
    const validationError = validateWeek(inputValue);
    
    if (validationError) {
      setValidationError(validationError);
      return;
    }

    const weekNumber = parseInt(inputValue, 10);
    
    // Only update if the week actually changed
    if (weekNumber !== state.selectedWeek) {
      setWeek(weekNumber);
      
      if (onWeekChange) {
        onWeekChange(weekNumber);
      }
    }
    
    setValidationError('');
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
          <label htmlFor="week-input" className="form-label">
            NFL Week
          </label>
          
          <div className="week-input-group">
            <input
              id="week-input"
              type="number"
              min="1"
              max="18"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              disabled={disabled}
              className={`week-input ${validationError ? 'error' : ''}`}
              placeholder="Week (1-18)"
            />

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

          {validationError && (
            <div className="error-message validation-error">
              {validationError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WeekSelector;