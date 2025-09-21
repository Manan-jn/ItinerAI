/**
 * Session Management Utility
 * Handles session ID generation and persistence using sessionStorage
 */

const SESSION_ID_KEY = 'itinerai_session_id';
const USER_ID_KEY = 'itinerai_user_id';

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
 * - Returns existing user ID if found in sessionStorage
 * - Creates new user ID if not found
 */
export function getUserId(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return generateUserId();
  }

  try {
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
 * Gets session info for debugging
 */
export function getSessionInfo(): { sessionId: string; userId: string; isNewSession: boolean } {
  const sessionId = getSessionId();
  const userId = getUserId();
  const isNewSession = typeof window !== 'undefined' ? 
    !sessionStorage.getItem(SESSION_ID_KEY) : true;
  
  return { sessionId, userId, isNewSession };
}
