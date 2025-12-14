import React, { useState, useEffect } from 'react';
import { useAppContext, getPersistedUserIdentifier } from '../../context';
import { getSleeperApiService } from '../../services/api/SleeperApiService';
import type { SleeperUser } from '../../types/sleeper';
import './UserIdentifierInput.css';

interface UserIdentifierInputProps {
  onUserLoaded?: (user: SleeperUser) => void;
  className?: string;
}

export function UserIdentifierInput({ onUserLoaded, className = '' }: UserIdentifierInputProps) {
  const { state, setUser, clearUser, setLoading, setError, clearError } = useAppContext();
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Load persisted identifier on mount
  useEffect(() => {
    const persistedIdentifier = getPersistedUserIdentifier();
    if (persistedIdentifier && !state.user && !state.loading) {
      setIdentifier(persistedIdentifier);
      // Auto-load user if we have a persisted identifier
      handleSubmit(undefined, persistedIdentifier);
    }
  }, []); // Empty dependency array - only run once on mount

  // Clear validation error when identifier changes
  useEffect(() => {
    if (validationError && identifier.trim()) {
      setValidationError('');
    }
  }, [identifier, validationError]);

  const validateIdentifier = (value: string): string | null => {
    const trimmed = value.trim();
    
    if (!trimmed) {
      return 'Sleeper identifier is required';
    }
    
    if (trimmed.length < 2) {
      return 'Identifier must be at least 2 characters long';
    }
    
    if (trimmed.length > 50) {
      return 'Identifier must be less than 50 characters';
    }
    
    // Basic validation for common invalid characters
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      return 'Identifier can only contain letters, numbers, underscores, periods, and hyphens';
    }
    
    return null;
  };

  const handleSubmit = async (event?: React.FormEvent, overrideIdentifier?: string) => {
    if (event) {
      event.preventDefault();
    }

    const identifierToUse = overrideIdentifier || identifier;
    const validationError = validateIdentifier(identifierToUse);
    
    if (validationError) {
      setValidationError(validationError);
      return;
    }

    setIsSubmitting(true);
    setValidationError('');
    setLoading(true);
    clearError();

    try {
      const sleeperApi = getSleeperApiService();
      const user = await sleeperApi.getUser(identifierToUse.trim());
      
      // Update global state
      setUser(user);
      
      // Call optional callback
      if (onUserLoaded) {
        onUserLoaded(user);
      }
      
      // Clear any previous errors
      clearError();
      
    } catch (error) {
      let errorMessage = 'Failed to load user information';
      
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = 'User not found. Please check your Sleeper username or user ID.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setValidationError('');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIdentifier(event.target.value);
  };

  const handleClearUser = () => {
    clearUser();
    setIdentifier('');
    setValidationError('');
    clearError();
    
    // Clear all persisted data
    try {
      localStorage.removeItem('sleeper_user_identifier');
      localStorage.removeItem('sleeper_user_teams');
    } catch (error) {
      console.warn('Failed to clear persisted data:', error);
    }
  };

  // If user is already loaded, show user info with option to change
  if (state.user) {
    return (
      <div className={`user-identifier-input user-loaded ${className}`}>
        <div className="user-info">
          <div className="user-details">
            <h3>Welcome, {state.user.display_name || state.user.username}!</h3>
            <p className="user-id">User ID: {state.user.user_id}</p>
          </div>
          <button
            type="button"
            onClick={handleClearUser}
            className="change-user-button"
            disabled={state.loading}
          >
            Change User
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`user-identifier-input ${className}`}>
      <form onSubmit={handleSubmit} className="identifier-form" role="form">
        <div className="form-group">
          <label htmlFor="sleeper-identifier" className="form-label">
            Sleeper Username or User ID
          </label>
          <div className="input-group">
            <input
              id="sleeper-identifier"
              type="text"
              value={identifier}
              onChange={handleInputChange}
              placeholder="Enter your Sleeper username or user ID"
              className={`form-input ${validationError ? 'error' : ''}`}
              disabled={isSubmitting || state.loading}
              autoComplete="username"
              maxLength={50}
            />
            <button
              type="submit"
              disabled={isSubmitting || state.loading || !identifier.trim()}
              className="submit-button"
            >
              {isSubmitting || state.loading ? (
                <>
                  <span className="loading-spinner" />
                  Loading...
                </>
              ) : (
                'Load Teams'
              )}
            </button>
          </div>
          
          {validationError && (
            <div className="error-message validation-error">
              {validationError}
            </div>
          )}
          
          <div className="help-text">
            <p>
              Enter your Sleeper username (e.g., "john_doe") or user ID. 
              You can find your username in the Sleeper app under your profile.
            </p>
          </div>
        </div>
      </form>
      
      {state.error && (
        <div className="error-message api-error">
          {state.error}
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="retry-button"
            disabled={isSubmitting || state.loading}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

export default UserIdentifierInput;