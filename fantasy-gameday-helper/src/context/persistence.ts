// Local storage keys
export const STORAGE_KEYS = {
  USER_IDENTIFIER: 'sleeper_user_identifier',
  SELECTED_WEEK: 'sleeper_selected_week',
  USER_TEAMS: 'sleeper_user_teams',
} as const;

// Helper function to get persisted user identifier
export function getPersistedUserIdentifier(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.USER_IDENTIFIER);
  } catch (error) {
    console.warn('Failed to get persisted user identifier:', error);
    return null;
  }
}

// Helper function to clear all persisted state
export function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_IDENTIFIER);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_WEEK);
    localStorage.removeItem(STORAGE_KEYS.USER_TEAMS);
  } catch (error) {
    console.warn('Failed to clear persisted state:', error);
  }
}
