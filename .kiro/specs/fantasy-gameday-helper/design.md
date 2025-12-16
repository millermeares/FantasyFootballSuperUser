# Fantasy Gameday Helper - Design Document

## Overview

The Fantasy Gameday Helper is a React-based web application that integrates with the Sleeper fantasy football API to provide super players with a clear view of which players to cheer for or against during gameday. The application features a three-part interface: team selection controls, "cheering for" player table, and "cheering against" player table, all optimized for performance through aggressive caching and designed with mobile-friendly architecture principles.

## Architecture

### High-Level Architecture

The application follows a modern React architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Presentation Layer                                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ Tab Navigation  │ │   Team Filter   │ │   Gameday View  │ │  Exposure View  ││
│  │   Component     │ │   Component     │ │   Component     │ │   Component     ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘│
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ Cheering For    │ │ Cheering Against│ │ Exposure Table  │ │ League Info     ││
│  │ Table Component │ │ Table Component │ │   Component     │ │ Popup Component ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Application Layer                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ State Management│ │ Player Analysis │ │Exposure Analysis│ │ Cache Management││
│  │    (Context)    │ │    Service      │ │    Service      │ │    Service      ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            Data Layer                                           │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ Sleeper API     │ │ Local Storage   │ │ Cache Storage   │ │ Player Data     ││
│  │ Integration     │ │ Service         │ │ Service         │ │ Service         ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **State Management**: React Context API with useReducer
- **HTTP Client**: Axios (following existing script patterns)
- **Styling**: CSS Modules or Styled Components (mobile-friendly)
- **Caching**: localStorage for simple persistent storage
- **Build Tool**: Vite for fast development and optimized builds

## Components and Interfaces

### Core Components

#### 1. App Component
- Root component managing global state and tabbed navigation
- Handles user identifier persistence and initial data loading
- Coordinates between child components and tab switching

#### 2. TabNavigation Component
- Responsive tab interface for switching between Gameday and Exposure views
- Adaptive positioning (top for desktop, bottom for mobile)
- Preserves state when switching tabs

#### 3. GamedayView Component
- Container for existing gameday functionality
- Houses cheering for/against tables
- Maintains current gameday-specific logic

#### 4. ExposureView Component
- Container for exposure report functionality
- Houses exposure table and related controls
- Manages exposure-specific calculations

#### 5. UserIdentifierInput Component
- Input form for Sleeper username/ID
- Validation and error handling
- Integration with local storage for persistence

#### 6. WeekSelector Component
- Dropdown/input for NFL week selection
- Automatic current week detection
- Validation for valid week ranges (1-18)

#### 7. TeamFilter Component
- Expandable list of user's fantasy teams
- Checkbox controls for team inclusion/exclusion
- Summary display when collapsed

#### 8. PlayerTable Component (Reusable)
- Generic table for displaying player data
- Supports both count and percentage display modes
- Sortable by appearance count or exposure percentage
- Clickable numbers for league info popups
- Props: `players`, `title`, `displayMode`, `onCountClick`

#### 9. ExposureTable Component
- Specialized table for exposure report display
- Shows ownership percentages instead of counts
- Includes all roster positions (bench, taxi, IR)
- Sortable by exposure percentage

#### 10. LeagueInfoPopup Component
- Modal/tooltip displaying league details
- Shows which leagues contain a specific player
- Dismissible overlay

### Data Interfaces

#### Sleeper API Data Models

```typescript
interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
}

interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  status: 'pre_draft' | 'drafting' | 'in_season' | 'complete';
  sport: 'nfl';
  settings: {
    playoff_week_start?: number;
    // ... other league settings
  };
  total_rosters: number;
}

interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  players: string[];
  starters: string[];
}

interface SleeperMatchup {
  roster_id: number;
  matchup_id: number;
  starters: string[];
  players: string[];
  points: number;
  custom_points: number | null;
}

interface SleeperPlayer {
  player_id: string;
  full_name: string;
  position: string;
  team: string;
}
```

#### Application Data Models

```typescript
interface UserTeam {
  leagueId: string;
  leagueName: string;
  rosterId: number;
  isSelected: boolean;
}

interface PlayerAllegiance {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  count: number;
  leagues: string[]; // League names where this player appears
}

interface PlayerExposure {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  exposurePercentage: number; // Percentage of selected teams containing this player
  teamCount: number; // Number of teams containing this player
  totalTeams: number; // Total number of selected teams
  leagues: string[]; // League names where this player appears
}

interface GamedayData {
  cheeringFor: PlayerAllegiance[];
  cheeringAgainst: PlayerAllegiance[];
  userTeams: UserTeam[];
}

interface ExposureData {
  exposureReport: PlayerExposure[];
  totalSelectedTeams: number;
}
```

### Service Interfaces

#### SleeperApiService
```typescript
interface SleeperApiService {
  getUser(identifier: string): Promise<SleeperUser>;
  getUserLeagues(userId: string, season: string): Promise<SleeperLeague[]>;
  getLeagueRosters(leagueId: string): Promise<SleeperRoster[]>;
  getLeagueMatchups(leagueId: string, week: number): Promise<SleeperMatchup[]>;
}

interface PlayerService {
  getPlayerName(playerId: string): string; // Returns 'Unknown Player' if not found
  getPlayerInfo(playerId: string): SleeperPlayerData | null;
  getPlayerPosition(playerId: string): string; // Returns 'Unknown' if not found
  getPlayerTeam(playerId: string): string; // Returns 'FA' if not found
}

interface PlayerAnalysisService {
  // Existing gameday methods (filter for starters only)
  calculateGamedayAllegiances(userTeams: UserTeam[], matchups: SleeperMatchup[]): GamedayData;
  
  // New exposure methods (include all roster positions)
  calculateExposureReport(userTeams: UserTeam[], rosters: SleeperRoster[]): ExposureData;
  getPlayerExposurePercentage(playerId: string, userTeams: UserTeam[], rosters: SleeperRoster[]): number;
  getAllRosterPlayers(roster: SleeperRoster): string[]; // Returns all players including bench, taxi, IR
}
```

### Sleeper API Endpoints

The application will use these standard Sleeper API endpoints:

```typescript
const SLEEPER_API_BASE = 'https://api.sleeper.app/v1';

const endpoints = {
  // Get user by username or user_id
  user: (identifier: string) => `${SLEEPER_API_BASE}/user/${identifier}`,
  
  // Get user's leagues for a season
  userLeagues: (userId: string, season: string) => 
    `${SLEEPER_API_BASE}/user/${userId}/leagues/nfl/${season}`,
  
  // Get rosters for a league
  leagueRosters: (leagueId: string) => 
    `${SLEEPER_API_BASE}/league/${leagueId}/rosters`,
  
  // Get matchups for a specific week
  leagueMatchups: (leagueId: string, week: number) => 
    `${SLEEPER_API_BASE}/league/${leagueId}/matchups/${week}`,
    
  // Get users in a league (for display names)
  leagueUsers: (leagueId: string) => 
    `${SLEEPER_API_BASE}/league/${leagueId}/users`,
    
  // Get current NFL state (for current week detection)
  nflState: () => `${SLEEPER_API_BASE}/state/nfl`
};
```

### API Rate Limiting

Following Sleeper API guidelines:
- Stay under 1000 API calls per minute to avoid IP blocking
- Implement exponential backoff for failed requests
- Cache responses aggressively to minimize API calls

#### CacheService
```typescript
interface CacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T): void;
  clear(): void;
  has(key: string): boolean;
}
```

## Data Models

### State Management Structure

```typescript
interface AppState {
  user: SleeperUser | null;
  selectedWeek: number;
  userTeams: UserTeam[];
  gamedayData: GamedayData | null;
  exposureData: ExposureData | null;
  activeTab: 'gameday' | 'exposure';
  loading: boolean;
  error: string | null;
  popupData: {
    isOpen: boolean;
    player: PlayerAllegiance | PlayerExposure | null;
    leagues: string[];
  };
}

type AppAction = 
  | { type: 'SET_USER'; payload: SleeperUser }
  | { type: 'SET_WEEK'; payload: number }
  | { type: 'TOGGLE_TEAM'; payload: string } // leagueId
  | { type: 'SET_GAMEDAY_DATA'; payload: GamedayData }
  | { type: 'SET_EXPOSURE_DATA'; payload: ExposureData }
  | { type: 'SET_ACTIVE_TAB'; payload: 'gameday' | 'exposure' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'OPEN_POPUP'; payload: { player: PlayerAllegiance | PlayerExposure; leagues: string[] } }
  | { type: 'CLOSE_POPUP' };
```

### Cache Key Strategy

```typescript
const CacheKeys = {
  USER: (identifier: string) => `sleeper_user_${identifier}`,
  LEAGUES: (userId: string, season: string) => `sleeper_leagues_${userId}_${season}`,
  ROSTERS: (leagueId: string) => `sleeper_rosters_${leagueId}`,
  MATCHUPS: (leagueId: string, week: number) => `sleeper_matchups_${leagueId}_${week}`,
  USER_PREFS: 'sleeper_user_preferences'
};
```

### Bundled Player Data

```typescript
// Static import of players data (updated manually as needed)
import playersResponse from '../data/players.json';

// Extract the actual player data from the axios response structure
const playersData = playersResponse.data;

interface SleeperPlayerData {
  [playerId: string]: {
    player_id: string;
    full_name: string;
    position: string;
    team: string | null;
    first_name: string;
    last_name: string;
    active: boolean;
    fantasy_positions: string[];
    // ... other fields as needed
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all properties identified in the prework, several can be consolidated to eliminate redundancy:

- Properties 3.1, 3.2, 3.3 (user player counting, sorting, display) can be combined into a comprehensive "user player analysis" property
- Properties 4.1, 4.2, 4.3 (opponent player counting, sorting, display) can be combined into a comprehensive "opponent player analysis" property  
- Properties 3.4 and 4.4 (popup functionality) can be combined into a single "league info popup" property
- Properties 3.5 and 4.5 (reactive table updates) can be combined into a single "reactive updates" property
- Properties 8.1, 8.2, 8.3 (caching behavior) can be combined into a comprehensive "cache management" property

This consolidation reduces redundancy while maintaining comprehensive coverage of all functional requirements.

### Correctness Properties

Property 1: User identifier persistence round-trip
*For any* valid Sleeper identifier, storing it in local storage and then retrieving it should return the same identifier
**Validates: Requirements 6.1, 6.2**

Property 2: Team selection state consistency  
*For any* set of user teams and selection changes, toggling team checkboxes should correctly update inclusion status and preserve other team states
**Validates: Requirements 2.2, 2.4**

Property 3: User player analysis accuracy
*For any* set of selected teams and their starting lineups, the cheering-for table should correctly count player appearances, sort by count descending, and display accurate totals
**Validates: Requirements 3.1, 3.2, 3.3**

Property 4: Opponent player analysis accuracy
*For any* set of opponent lineups across selected leagues, the cheering-against table should correctly count opponent player appearances, sort by count descending, and display accurate totals  
**Validates: Requirements 4.1, 4.2, 4.3**

Property 5: Player conflict resolution
*For any* player appearing in both user and opponent lineups, the player should appear in the table corresponding to their higher appearance count
**Validates: Requirements 4.6**

Property 6: League info popup accuracy
*For any* player with league associations, clicking the appearance count should display a popup containing exactly the leagues where that player appears
**Validates: Requirements 3.4, 4.4**

Property 7: Reactive table updates
*For any* change in team selections, both player tables should immediately reflect the updated calculations without requiring manual refresh
**Validates: Requirements 3.5, 4.5**

Property 8: Week selection data retrieval
*For any* valid week number, changing the week selection should trigger retrieval of lineup data specific to that week
**Validates: Requirements 7.2, 7.5**

Property 9: Input validation consistency
*For any* invalid input (Sleeper identifier, week number), the system should display appropriate error messages and prevent invalid operations
**Validates: Requirements 1.3, 7.4**

Property 10: Cache management efficiency
*For any* API response, the data should be cached indefinitely, and subsequent identical requests should use cached data instead of making new API calls
**Validates: Requirements 8.1, 8.2, 8.3**

Property 11: State preservation during updates
*For any* data update operation, the current team selections and interface preferences should remain unchanged
**Validates: Requirements 5.5**

Property 12: API data filtering
*For any* API response containing invalid or malformed data, the system should filter out problematic entries and continue processing valid data
**Validates: Requirements 10.3**

Property 13: Complete roster inclusion for exposure
*For any* roster containing players in different positions (starters, bench, taxi, IR), the exposure calculation should include all players regardless of their roster position
**Validates: Requirements 11.1**

Property 14: Exposure percentage calculation accuracy
*For any* set of selected teams and player distributions, the exposure percentage should equal (teams containing player / total selected teams) × 100
**Validates: Requirements 11.2**

Property 15: Exposure table sorting consistency
*For any* set of players with exposure percentages, the exposure table should display players sorted by exposure percentage in descending order
**Validates: Requirements 11.3**

Property 16: Exposure popup accuracy
*For any* player in the exposure table, clicking the exposure percentage should display a popup containing exactly the leagues where that player appears
**Validates: Requirements 11.4**

Property 17: Exposure reactive updates
*For any* change in team selections, the exposure table should immediately reflect updated calculations without requiring manual refresh
**Validates: Requirements 11.5**

Property 18: Tab navigation functionality
*For any* tab selection (Gameday or Exposure), clicking the tab should display the corresponding content and update the active tab state
**Validates: Requirements 12.2, 12.3**

Property 19: Responsive tab positioning
*For any* device type (desktop or mobile), the tab positioning should adapt appropriately (top for desktop, bottom for mobile)
**Validates: Requirements 12.4, 12.5**

Property 20: State preservation during tab switching
*For any* tab switch operation, the current team selections and week settings should remain unchanged
**Validates: Requirements 12.6**

## Error Handling

### Error Categories and Strategies

#### 1. Network and API Errors
- **Connection failures**: Display retry options with exponential backoff
- **Rate limiting**: Implement respectful backoff with user notification
- **Invalid responses**: Filter bad data, log issues, continue with valid data
- **Timeout handling**: Configurable timeouts with fallback to cached data

#### 2. Data Validation Errors
- **Invalid user identifiers**: Clear error messages with format examples
- **Malformed API responses**: Graceful degradation with partial data display
- **Missing required fields**: Default values where appropriate, error states otherwise

#### 3. Storage Errors
- **Local storage unavailable**: Graceful fallback to session-only operation
- **Cache corruption**: Automatic cache clearing and rebuilding
- **Quota exceeded**: Intelligent cache pruning based on usage patterns

#### 4. User Input Errors
- **Invalid week numbers**: Real-time validation with helpful constraints
- **Empty or malformed inputs**: Immediate feedback with correction guidance

### Error Recovery Patterns

```typescript
interface ErrorRecoveryStrategy {
  retry: boolean;
  maxRetries: number;
  backoffMs: number;
  fallbackAction: 'cache' | 'partial' | 'error-state';
  userMessage: string;
}
```

## Testing Strategy

### Dual Testing Approach

The application will use both unit testing and property-based testing to ensure comprehensive correctness validation:

**Unit Testing**:
- Specific examples demonstrating correct behavior
- Integration points between components  
- Edge cases and error conditions
- Component rendering and user interactions

**Property-Based Testing**:
- Universal properties that should hold across all inputs
- Uses **fast-check** library for TypeScript/JavaScript
- Each property test configured to run minimum 100 iterations
- Each property test tagged with format: **Feature: fantasy-gameday-helper, Property {number}: {property_text}**

### Property-Based Testing Requirements

- **Library**: fast-check for TypeScript property-based testing
- **Iterations**: Minimum 100 iterations per property test
- **Tagging**: Each test must reference its corresponding design property
- **Coverage**: Each correctness property implemented by exactly one property-based test

### Testing Framework Configuration

```typescript
// Example property test structure
import fc from 'fast-check';

describe('Fantasy Gameday Helper Properties', () => {
  it('Property 1: User identifier persistence round-trip', () => {
    // **Feature: fantasy-gameday-helper, Property 1: User identifier persistence round-trip**
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 }),
      (identifier) => {
        // Test implementation
      }
    ), { numRuns: 100 });
  });
});
```

### Unit Testing Focus Areas

- Component rendering with various props
- User interaction handlers (clicks, form submissions, tab navigation)
- API service integration points
- Cache service functionality
- Error boundary behavior
- Responsive layout adaptation
- Tab switching and state preservation
- Exposure calculation accuracy
- Responsive tab positioning

### Integration Testing

- End-to-end user workflows
- API integration with real Sleeper endpoints (in test environment)
- Cross-component state synchronization
- Performance under various data loads

## Performance Considerations

### Caching Strategy
- **Indefinite caching** of all Sleeper API responses using localStorage
- **Bundled players.json** file included in build (updated manually when needed)
- **Cache keys** based on user ID, league ID, and week number
- **Graceful fallback** to 'Unknown Player' for missing player data

### Optimization Techniques
- **React.memo** for expensive component re-renders
- **useMemo** for complex calculations (player counting, sorting)
- **Debounced updates** for rapid team selection changes
- **Virtualized tables** for large player lists (if needed)

### Mobile Performance
- **Lazy loading** of non-critical components
- **Touch-optimized** interaction patterns
- **Responsive images** and assets
- **Minimal bundle size** through code splitting

## Security Considerations

### Data Protection
- **No sensitive data storage** - only public fantasy football information
- **Input sanitization** for all user inputs
- **XSS prevention** through proper React practices

### API Security
- **Rate limiting respect** for Sleeper API
- **Error information filtering** to prevent information leakage
- **HTTPS enforcement** for all external requests

## Deployment and Build

### Build Configuration
- **Vite** for fast development and optimized production builds
- **TypeScript** strict mode for type safety
- **ESLint + Prettier** for code quality
- **Bundle analysis** for size optimization

### Environment Configuration
```typescript
interface AppConfig {
  sleeperApiBase: string;
  cacheVersion: string;
  maxCacheSize: number;
  apiTimeout: number;
  retryAttempts: number;
}
```

### Progressive Web App Features
- **Service worker** for offline capability
- **App manifest** for mobile installation
- **Responsive design** for all screen sizes
- **Touch-friendly** interface elements