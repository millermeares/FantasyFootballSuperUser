import React from 'react';
import { WeekSelector } from './WeekSelector';
import { AppProvider } from '../../context';

/**
 * Example usage of the WeekSelector component
 * 
 * This component provides:
 * - Dropdown selection for NFL weeks 1-18
 * - Number input for direct week entry
 * - Automatic current week detection via Sleeper API
 * - Validation for invalid week numbers
 * - Integration with global app state
 */

// Basic usage example
export function BasicWeekSelectorExample() {
  return (
    <AppProvider>
      <div style={{ padding: '20px', maxWidth: '400px' }}>
        <h3>Basic Week Selector</h3>
        <WeekSelector />
      </div>
    </AppProvider>
  );
}

// Example with callback
export function WeekSelectorWithCallbackExample() {
  const handleWeekChange = (week: number) => {
    console.log('Week changed to:', week);
    // You could trigger data fetching, analytics, etc.
  };

  return (
    <AppProvider>
      <div style={{ padding: '20px', maxWidth: '400px' }}>
        <h3>Week Selector with Callback</h3>
        <WeekSelector onWeekChange={handleWeekChange} />
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          Check the console to see week change events.
        </p>
      </div>
    </AppProvider>
  );
}

// Disabled state example
export function DisabledWeekSelectorExample() {
  return (
    <AppProvider>
      <div style={{ padding: '20px', maxWidth: '400px' }}>
        <h3>Disabled Week Selector</h3>
        <WeekSelector disabled={true} />
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          This selector is disabled and won't respond to user input.
        </p>
      </div>
    </AppProvider>
  );
}

// Compact styling example
export function CompactWeekSelectorExample() {
  return (
    <AppProvider>
      <div style={{ padding: '20px', maxWidth: '400px' }}>
        <h3>Compact Week Selector</h3>
        <WeekSelector className="compact" />
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          Uses the compact CSS class for smaller layouts.
        </p>
      </div>
    </AppProvider>
  );
}

// Integration example showing how it works with other components
export function IntegratedWeekSelectorExample() {
  const [selectedWeek, setSelectedWeek] = React.useState<number>(1);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleWeekChange = (week: number) => {
    setSelectedWeek(week);
    setIsLoading(true);
    
    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <AppProvider>
      <div style={{ padding: '20px', maxWidth: '400px' }}>
        <h3>Integrated Example</h3>
        <WeekSelector 
          onWeekChange={handleWeekChange}
          disabled={isLoading}
        />
        
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Current State:</h4>
          <p style={{ margin: '5px 0' }}>Selected Week: <strong>{selectedWeek}</strong></p>
          <p style={{ margin: '5px 0' }}>Loading: <strong>{isLoading ? 'Yes' : 'No'}</strong></p>
          {isLoading && (
            <p style={{ margin: '5px 0', color: '#007bff' }}>
              Loading data for week {selectedWeek}...
            </p>
          )}
        </div>
      </div>
    </AppProvider>
  );
}

// All examples in one component for easy testing
export function AllWeekSelectorExamples() {
  return (
    <div style={{ display: 'grid', gap: '40px', padding: '20px' }}>
      <BasicWeekSelectorExample />
      <WeekSelectorWithCallbackExample />
      <DisabledWeekSelectorExample />
      <CompactWeekSelectorExample />
      <IntegratedWeekSelectorExample />
    </div>
  );
}

export default AllWeekSelectorExamples;