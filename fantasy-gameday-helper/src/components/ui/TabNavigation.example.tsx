import { TabNavigation } from './TabNavigation';
import { AppProvider } from '../../context';

/**
 * Example usage of the TabNavigation component
 * 
 * This component demonstrates:
 * - Basic tab navigation between Gameday and Exposure views
 * - Responsive design (tabs at top on desktop, bottom on mobile)
 * - State management integration with AppContext
 * - Placeholder content areas for future components
 */

export function TabNavigationExample() {
  return (
    <div style={{ height: '400px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <AppProvider>
        <TabNavigation />
      </AppProvider>
    </div>
  );
}

export function TabNavigationWithCustomContent() {
  return (
    <div style={{ height: '500px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <AppProvider>
        <div style={{ height: '100%' }}>
          <h2 style={{ padding: '1rem', margin: 0, backgroundColor: '#f8f9fa' }}>
            Fantasy Gameday Helper
          </h2>
          <TabNavigation />
        </div>
      </AppProvider>
    </div>
  );
}

export function ResponsiveTabExample() {
  return (
    <div>
      <h3>Desktop View (tabs at top)</h3>
      <div style={{ 
        width: '800px', 
        height: '300px', 
        border: '1px solid #ccc', 
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <AppProvider>
          <TabNavigation />
        </AppProvider>
      </div>

      <h3>Mobile View (tabs at bottom)</h3>
      <div style={{ 
        width: '320px', 
        height: '400px', 
        border: '1px solid #ccc', 
        borderRadius: '8px'
      }}>
        <AppProvider>
          <TabNavigation />
        </AppProvider>
      </div>
    </div>
  );
}

// Default export for Storybook or other documentation tools
export default {
  title: 'UI/TabNavigation',
  component: TabNavigation,
  parameters: {
    docs: {
      description: {
        component: `
The TabNavigation component provides a responsive tabbed interface for switching between 
Gameday and Exposure views. It automatically adapts its layout based on screen size:

- **Desktop**: Tabs positioned at the top
- **Mobile**: Tabs positioned at the bottom for better thumb accessibility

The component integrates with the global AppContext to manage tab state and preserve 
user selections when switching between tabs.

## Features

- Responsive design with adaptive tab positioning
- Touch-friendly interface for mobile devices
- Accessibility support with proper ARIA attributes
- State management integration
- Placeholder content areas for future components

## Requirements Satisfied

- 12.1: Tabbed interface with Gameday and Exposure tabs
- 12.4: Desktop tabs positioned at top
- 12.5: Mobile tabs positioned at bottom
        `
      }
    }
  }
};