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