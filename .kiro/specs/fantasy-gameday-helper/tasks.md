# Implementation Plan

- [x] 1. Set up project structure and core dependencies
  - Create React TypeScript project with Vite
  - Install dependencies: axios, fast-check for testing
  - Set up ESLint, Prettier, and TypeScript configuration
  - Create directory structure for components, services, and data
  - _Requirements: 1.1, 2.1, 5.1_

- [x] 2. Bundle players data and create player service
  - Copy players.json file to src/data/ directory
  - Create PlayerService with methods for name, position, team lookup
  - Implement graceful fallback to 'Unknown Player' for missing data
  - _Requirements: 1.2, 3.3, 4.3_

- [x] 2.1 Write property test for player service
  - **Property 1: User identifier persistence round-trip**
  - **Validates: Requirements 6.1, 6.2**

- [x] 3. Implement Sleeper API service layer
  - Create SleeperApiService with all required endpoints
  - Implement proper error handling and rate limiting respect
  - Add axios configuration with timeouts and retry logic
  - _Requirements: 1.1, 1.3, 8.1_

- [ ]* 3.1 Write property test for API service caching
  - **Property 10: Cache management efficiency**
  - **Validates: Requirements 8.1, 8.2, 8.3**

- [x] 4. Create localStorage cache service
  - Implement CacheService with get/set/clear methods
  - Create cache key strategy for different data types
  - Add cache invalidation and error handling
  - _Requirements: 6.1, 8.1, 8.2_

- [ ]* 4.1 Write property test for cache round-trip
  - **Property 1: User identifier persistence round-trip**
  - **Validates: Requirements 6.1, 6.2**

- [x] 5. Build core data analysis service
  - Create PlayerAnalysisService for counting player appearances
  - Implement logic to separate user vs opponent players
  - Add sorting and conflict resolution for overlapping players
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.6_

- [x] 5.1 Write property test for user player analysis
  - **Property 3: User player analysis accuracy**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 5.2 Write property test for opponent player analysis
  - **Property 4: Opponent player analysis accuracy**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 5.3 Write property test for player conflict resolution
  - **Property 5: Player conflict resolution**
  - **Validates: Requirements 4.6**

- [x] 6. Implement React Context for state management
  - Create AppContext with useReducer for global state
  - Define all action types and state structure
  - Add state persistence for user preferences
  - _Requirements: 2.2, 5.5, 6.2_

- [x] 6.1 Write property test for team selection state
  - **Property 2: Team selection state consistency**
  - **Validates: Requirements 2.2, 2.4**

- [x] 7. Create user identifier input component
  - Build form with validation for Sleeper usernames/IDs
  - Implement loading states and error handling
  - Add localStorage integration for persistence
  - _Requirements: 1.1, 1.3, 6.1, 6.3_

- [ ]* 7.1 Write property test for input validation
  - **Property 9: Input validation consistency**
  - **Validates: Requirements 1.3, 7.4**

- [x] 8. Build week selector component
  - Create dropdown/input for week selection (1-18)
  - Implement automatic current week detection using NFL state API
  - Add validation and error handling for invalid weeks
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 8.1 Write property test for week selection
  - **Property 8: Week selection data retrieval**
  - **Validates: Requirements 7.2, 7.5**

- [x] 9. Implement team filter component
  - Create expandable list with checkboxes for each user team
  - Add select all/none functionality
  - Implement summary display when collapsed
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 10. Create reusable player table component
  - Build generic table for displaying player data with counts
  - Implement sorting by appearance count
  - Add clickable count numbers for league info popups
  - Make responsive for mobile viewing
  - _Requirements: 3.2, 3.3, 3.4, 4.3, 4.4, 9.1_

- [ ]* 10.1 Write property test for league info popup
  - **Property 6: League info popup accuracy**
  - **Validates: Requirements 3.4, 4.4**

- [x] 11. Build league info popup component
  - Create modal/tooltip for displaying league details
  - Show which specific leagues contain each player
  - Add dismissible overlay and proper accessibility
  - _Requirements: 3.4, 4.4_

- [x] 12. Implement main app component and routing
  - Create root App component with global state provider
  - Coordinate between all child components
  - Handle initial data loading and error states
  - _Requirements: 1.4, 5.2, 8.4_

- [ ]* 12.1 Write property test for reactive updates
  - **Property 7: Reactive table updates**
  - **Validates: Requirements 3.5, 4.5**

- [ ]* 12.2 Write property test for state preservation
  - **Property 11: State preservation during updates**
  - **Validates: Requirements 5.5**

- [x] 13. Add responsive design and mobile optimization
  - Implement CSS Grid/Flexbox layouts that adapt to screen sizes
  - Ensure touch-friendly interactions for mobile devices
  - Test across different viewport sizes
  - _Requirements: 5.4, 9.1, 9.3, 9.5_

- [ ] 14. Implement comprehensive error handling
  - Add error boundaries for React components
  - Implement network error detection and retry logic
  - Create user-friendly error messages and recovery options
  - _Requirements: 1.5, 6.4, 8.5, 10.1, 10.2, 10.4, 10.5_

- [ ]* 14.1 Write property test for API data filtering
  - **Property 12: API data filtering**
  - **Validates: Requirements 10.3**

- [x] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Add loading states and performance optimizations
  - Implement loading indicators for all async operations
  - Add React.memo and useMemo for performance optimization
  - Implement debounced updates for rapid user interactions
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 16.1 Write unit tests for component interactions
  - Create unit tests for user interactions and form submissions
  - Test component rendering with various props and states
  - Verify error boundary behavior and loading states
  - _Requirements: 1.4, 2.1, 5.2_

- [ ] 17. Final integration and polish
  - Test complete user workflows end-to-end
  - Verify all caching and performance optimizations work correctly
  - Add final UI polish and accessibility improvements
  - _Requirements: 5.4, 9.1_

- [ ] 18. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Layout Refactoring and Tab Structure

- [x] 19. Update AppContext for tab state management
  - Add activeTab to global state (start with just 'gameday' | 'exposure')
  - Implement SET_ACTIVE_TAB action
  - Keep existing state structure intact for now
  - _Requirements: 12.6_

- [ ]* 19.1 Write property test for state preservation during tab switching
  - **Property 20: State preservation during tab switching**
  - **Validates: Requirements 12.6**

- [x] 20. Create TabNavigation component
  - Build responsive tab component with Gameday and Exposure tabs
  - Implement adaptive positioning (top for desktop, bottom for mobile)
  - Add tab switching functionality with state management
  - Create placeholder content areas for each tab
  - _Requirements: 12.1, 12.4, 12.5_

- [ ]* 20.1 Write property test for responsive tab positioning
  - **Property 19: Responsive tab positioning**
  - **Validates: Requirements 12.4, 12.5**

- [x] 21. Add responsive design for tabbed interface
  - Implement CSS for adaptive tab positioning
  - Ensure mobile-friendly touch targets for bottom tabs
  - Test tab interface across different screen sizes
  - _Requirements: 12.4, 12.5_

- [x] 22. Create GamedayView component
  - Refactor existing gameday functionality into dedicated view component
  - Move cheering for/against tables into GamedayView container
  - Maintain existing gameday logic and state management
  - Ensure no functionality is lost in the refactor
  - _Requirements: 12.2_

- [x] 23. Update App component for tabbed interface
  - Integrate TabNavigation component into main app layout
  - Add conditional rendering based on active tab
  - Wire up GamedayView to display when Gameday tab is active
  - Create placeholder ExposureView for Exposure tab
  - _Requirements: 12.1, 12.2, 12.3_

- [ ]* 23.1 Write property test for tab navigation
  - **Property 18: Tab navigation functionality**
  - **Validates: Requirements 12.2, 12.3**

- [x] 24. Layout refactoring checkpoint
  - Ensure all existing gameday functionality works within new tabbed layout
  - Verify tab switching preserves all state correctly
  - Test responsive behavior on different device sizes
  - _Requirements: 12.1, 12.2, 12.6_

## Phase 3: Exposure Feature Implementation

- [x] 25. Extend PlayerAnalysisService for exposure calculations
  - Add getAllRosterPlayers method to extract all players from rosters (not just starters)
  - Implement calculateExposureReport method to calculate ownership percentages
  - Add getPlayerExposurePercentage helper method for individual player calculations
  - _Requirements: 11.1, 11.2_

- [ ]* 25.1 Write property test for complete roster inclusion
  - **Property 13: Complete roster inclusion for exposure**
  - **Validates: Requirements 11.1**

- [ ]* 25.2 Write property test for exposure percentage calculation
  - **Property 14: Exposure percentage calculation accuracy**
  - **Validates: Requirements 11.2**

- [x] 26. Update AppContext for exposure data
  - Add exposureData to global state
  - Implement SET_EXPOSURE_DATA action
  - Update popup data interface to support both allegiance and exposure players
  - _Requirements: 11.5_

- [x] 27. Update PlayerTable component for dual display modes
  - Add displayMode prop to support both count and percentage display
  - Modify table headers and formatting based on display mode
  - Ensure existing gameday functionality remains unchanged
  - _Requirements: 11.3, 11.4_

- [x] 28. Create ExposureTable component
  - Build specialized table for displaying ownership percentages
  - Implement sorting by exposure percentage in descending order
  - Add clickable percentages for league info popups
  - Make responsive for mobile viewing
  - _Requirements: 11.2, 11.3, 11.4_

- [ ]* 28.1 Write property test for exposure table sorting
  - **Property 15: Exposure table sorting consistency**
  - **Validates: Requirements 11.3**

- [ ]* 28.2 Write property test for exposure popup functionality
  - **Property 16: Exposure popup accuracy**
  - **Validates: Requirements 11.4**

- [x] 29. Create ExposureView component
  - Build container component for exposure report functionality
  - Integrate with exposure analysis service
  - Handle loading states and error conditions for exposure data
  - Replace placeholder ExposureView in App component
  - _Requirements: 11.1, 11.5_

- [x] 30. Implement reactive exposure updates
  - Connect exposure calculations to team selection changes
  - Ensure exposure table updates immediately when teams are toggled
  - Add loading states for exposure recalculations
  - _Requirements: 11.5_

- [ ]* 30.1 Write property test for exposure reactive updates
  - **Property 17: Exposure reactive updates**
  - **Validates: Requirements 11.5**

- [x] 31. Integration testing for exposure feature
  - Test complete exposure workflow from team selection to display
  - Verify all tab functionality works correctly with exposure data
  - Test responsive behavior on different device sizes
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [x] 32. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.