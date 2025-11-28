/**
 * Session Management Utility
 * Handles session ID generation and persistence using sessionStorage
 *
 * UPDATED BEHAVIOR:
 * - Session IDs are now created fresh on each chat initialization
 * - User IDs are preserved across sessions (localStorage for custom, sessionStorage for generated)
 * - Use clearSessionIdOnly() to clear session while preserving user context
 */

const SESSION_ID_KEY = 'itinerai_session_id';
const USER_ID_KEY = 'itinerai_user_id';
const CUSTOM_USER_ID_KEY = 'itinerai_custom_user_id'; // Custom user ID key (localStorage)

/**
 * Generates a random session ID
 * Format: timestamp-randomString (e.g., "1703123456789-abc123def456")
 */
function generateSessionId(): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomString}`;
}

/**
 * Generates a random user ID
 * Format: user-randomString (e.g., "user-abc123def456ghi789")
 */
function generateUserId(): string {
  const randomString = Math.random().toString(36).substring(2, 20);
  return `user-${randomString}`;
}

/**
 * Gets or creates a session ID
 * - Returns existing session ID if found in sessionStorage
 * - Creates new session ID if not found or if sessionStorage is not available
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return generateSessionId();
  }

  try {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
      console.log('Generated new session ID:', sessionId);
    } else {
      console.log('Using existing session ID:', sessionId);
    }
    
    return sessionId;
  } catch (error) {
    // Fallback if sessionStorage is not available (e.g., private browsing)
    console.warn('SessionStorage not available, using temporary session ID:', error);
    return generateSessionId();
  }
}

/**
 * Gets or creates a user ID
 * - First checks for custom user ID in localStorage (highest priority)
 * - Then checks for existing user ID in sessionStorage
 * - Creates new user ID if not found
 */
export function getUserId(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return generateUserId();
  }

  try {
    // PRIORITY 1: Check for custom user ID in localStorage
    const customUserId = localStorage.getItem(CUSTOM_USER_ID_KEY);
    if (customUserId && customUserId.trim()) {
      console.log('Using custom user ID:', customUserId);
      return customUserId.trim();
    }

    // PRIORITY 2: Check for existing user ID in sessionStorage
    let userId = sessionStorage.getItem(USER_ID_KEY);

    if (!userId) {
      userId = generateUserId();
      sessionStorage.setItem(USER_ID_KEY, userId);
      console.log('Generated new user ID:', userId);
    } else {
      console.log('Using existing user ID:', userId);
    }

    return userId;
  } catch (error) {
    // Fallback if sessionStorage is not available
    console.warn('SessionStorage not available, using temporary user ID:', error);
    return generateUserId();
  }
}

/**
 * Clears the current session (useful for testing or manual session reset)
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(SESSION_ID_KEY);
      sessionStorage.removeItem(USER_ID_KEY);
      console.log('Session cleared');
    } catch (error) {
      console.warn('Could not clear session:', error);
    }
  }
}

/**
 * Clears only the session ID while preserving the user ID
 * Useful for debug functionality where we want to keep the user context
 */
export function clearSessionIdOnly(): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(SESSION_ID_KEY);
      console.log('Session ID cleared (user ID preserved)');
    } catch (error) {
      console.warn('Could not clear session ID:', error);
    }
  }
}

/**
 * Gets a new session ID for authenticated users while preserving user context
 * @param userId - The authenticated user's ID to preserve
 */
export function regenerateSessionForUser(userId: string): { sessionId: string; userId: string } {
  // Clear only the session ID
  clearSessionIdOnly();
  
  // Generate new session ID
  const newSessionId = getSessionId();
  
  return {
    sessionId: newSessionId,
    userId: userId, // Keep the same user ID
  };
}

/**
 * Gets session info for debugging
 */
export function getSessionInfo(): { sessionId: string; userId: string; isNewSession: boolean; isCustomUserId: boolean } {
  const sessionId = getSessionId();
  const userId = getUserId();
  const isNewSession = typeof window !== 'undefined' ?
    !sessionStorage.getItem(SESSION_ID_KEY) : true;
  const isCustomUserId = typeof window !== 'undefined' ?
    !!localStorage.getItem(CUSTOM_USER_ID_KEY) : false;

  return { sessionId, userId, isNewSession, isCustomUserId };
}

/**
 * Sets a custom user ID in localStorage
 * This will override the auto-generated user ID
 * @param customUserId - The custom user ID to set
 */
export function setCustomUserId(customUserId: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CUSTOM_USER_ID_KEY, customUserId.trim());
      console.log('Custom user ID set:', customUserId.trim());
    } catch (error) {
      console.warn('Could not set custom user ID:', error);
    }
  }
}

/**
 * Gets the custom user ID if set
 * @returns Custom user ID or null if not set
 */
export function getCustomUserId(): string | null {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(CUSTOM_USER_ID_KEY);
    } catch (error) {
      console.warn('Could not get custom user ID:', error);
      return null;
    }
  }
  return null;
}

/**
 * Clears the custom user ID
 */
export function clearCustomUserId(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(CUSTOM_USER_ID_KEY);
      console.log('Custom user ID cleared');
    } catch (error) {
      console.warn('Could not clear custom user ID:', error);
    }
  }
}
