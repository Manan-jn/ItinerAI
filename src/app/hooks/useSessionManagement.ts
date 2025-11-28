import { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { getSessionId, getCustomUserId } from "../utils/sessionManager";
import { updateMemoryOnSessionChange } from "../utils/memoryApi";

/**
 * Custom hook for managing session state and operations
 * Handles session initialization, regeneration, and state management
 *
 * IMPORTANT BEHAVIOR (Updated):
 * - Creates a NEW session ID on every chat component initialization
 * - User ID is preserved across sessions (from custom ID or Firebase UID)
 * - Phone number is fetched from Firestore and reused
 * - Old sessions in sessionStorage are cleared before creating new ones
 * - Each page load/refresh = new session for fresh conversation context
 * - Memory is updated IMMEDIATELY after session creation (not on first message)
 * - Chat is ready to use once this hook completes initialization
 *
 * @param currentUser - Firebase auth user object
 * @returns Session state and handler functions
 */
export function useSessionManagement(currentUser: User | null) {
  // Session state
  const [sessionId, setSessionId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [previousSessionId, setPreviousSessionId] = useState<string>("");
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [isInitializingSession, setIsInitializingSession] = useState(false);
  const sessionInitRef = useRef<boolean>(false); // Prevent double initialization in dev mode

  // Reset initialization flag when sessionId is cleared (e.g., during onboarding)
  useEffect(() => {
    if (!sessionId && sessionInitRef.current) {
      sessionInitRef.current = false;
    }
  }, [sessionId]);

  // MODIFIED: Limited sync - only handle storage clears and onboarding events
  // We no longer restore old sessions from storage automatically
  useEffect(() => {
    if (typeof window === 'undefined' || !currentUser) return;

    const syncWithStorage = () => {
      const storageSessionId = sessionStorage.getItem('itinerai_session_id');

      // Only handle storage clearing (not restoration)
      if (!storageSessionId && sessionId) {
        // Storage was cleared but we still have a session ID in state
        setSessionId('');
        // Reset init flag to allow re-initialization
        sessionInitRef.current = false;
      }
    };

    // Check immediately
    syncWithStorage();

    // Listen for custom event from onboarding completion
    // This is the ONLY case where we sync from storage
    const handleSessionUpdate = () => {
      const storageSessionId = sessionStorage.getItem('itinerai_session_id');

      if (storageSessionId && storageSessionId !== sessionId) {
        setSessionId(storageSessionId);
        setPreviousSessionId(storageSessionId);

        // Ensure userId is correct
        const customUserId = getCustomUserId();
        const correctUserId = customUserId && customUserId.trim()
          ? customUserId.trim()
          : currentUser.uid;

        if (correctUserId !== userId) {
          setUserId(correctUserId);
        }

        // Mark session as initialized
        if (!sessionInitRef.current) {
          sessionInitRef.current = true;
        }
      }
    };
    window.addEventListener('sessionUpdated', handleSessionUpdate);

    // Set up an interval to check for storage clears only
    const intervalId = setInterval(syncWithStorage, 2000);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('sessionUpdated', handleSessionUpdate);
    };
  }, [sessionId, userId, currentUser]); // Re-run when these change

  // Initialize session for authenticated user using API
  useEffect(() => {

    if (currentUser && !sessionId && !sessionInitRef.current) {
      // Only run if we don't have a session yet AND haven't started initialization
      sessionInitRef.current = true; // Mark as initializing to prevent double calls

      const initializeAuthenticatedSession = async () => {
        // PRIORITY: Check for custom user ID first
        const customUserId = getCustomUserId();
        const authenticatedUserId = customUserId && customUserId.trim()
          ? customUserId.trim()
          : currentUser.uid; // Use Firebase UID if no custom ID

        if (customUserId) {
        }

        // ═══════════════════════════════════════════════════════════════════
        // CRITICAL CHANGE: Always create a NEW session on chat initialization
        // ═══════════════════════════════════════════════════════════════════
        // WHY: Each chat session should start fresh with a new session ID
        // WHAT: Clear any existing session ID from sessionStorage
        // RESULT: /api/session/create will be called to get a new session ID
        // USER ID: Preserved (from localStorage custom ID or Firebase UID)
        // PHONE: Preserved (fetched from Firestore)
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('itinerai_session_id');
        }


        setIsInitializingSession(true);

        try {
          // Fetch phone_number and onboarding status from Firestore
          let phoneNumber = "";
          let onboardingCompleted = false;
          try {
            const userDoc = await getDoc(doc(db, "users", authenticatedUserId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              phoneNumber = userData?.phoneNumber || "";
              onboardingCompleted = userData?.onboardingCompleted || false;
            }
          } catch (firestoreError) {
            console.warn("⚠️ Could not fetch user data from Firestore:", firestoreError);
          }

          if (!phoneNumber) {
            console.warn("⚠️ No phone number found for user");

            // If user hasn't completed onboarding, fall back to local session
            // If they HAVE completed onboarding, something is wrong - still use local session
            // but log a warning
            if (onboardingCompleted) {
              console.error("❌ User completed onboarding but no phone number found!");
            }

            const fallbackSessionId = getSessionId();
            setSessionId(fallbackSessionId);
            setUserId(authenticatedUserId);
            setPreviousSessionId(fallbackSessionId);
            setIsInitializingSession(false);
            return;
          }

          // Call /api/session/create to get a new session ID

          const response = await fetch("/api/session/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: authenticatedUserId,
              phone_number: phoneNumber,
            }),
          });

          if (!response.ok) {
            throw new Error(`Session API error: ${response.status}`);
          }

          const sessionData = await response.json();
          const newSessionId = sessionData.body.session_id;

          console.log("✅ Session created via API:", {
            user_id: sessionData.body.user_id,
            session_id: newSessionId,
          });

          // Store in sessionStorage for reuse
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('itinerai_session_id', newSessionId);
          }

          // ═══════════════════════════════════════════════════════════════════
          // CRITICAL: Update memory with user profile IMMEDIATELY after session creation
          // ═══════════════════════════════════════════════════════════════════
          // This ensures the backend has user context before any chat messages
          try {
            await updateMemoryOnSessionChange(
              authenticatedUserId,
              newSessionId,
              currentUser.displayName,
              currentUser.email
            );
          } catch (memoryError) {
            console.error("❌ Failed to update memory after session creation:", memoryError);
            // Don't fail session initialization if memory update fails
            console.warn("⚠️ Continuing with session initialization despite memory error");
          }

          setSessionId(newSessionId);
          setUserId(authenticatedUserId);
          setPreviousSessionId(newSessionId);
          setIsInitializingSession(false);

        } catch (error) {
          console.error("❌ Error creating session via API:", error);

          // Fallback to old method if API fails
          console.warn("⚠️ Falling back to local session generation");
          const fallbackSessionId = getSessionId();

          // Update memory for fallback session too
          try {
            await updateMemoryOnSessionChange(
              authenticatedUserId,
              fallbackSessionId,
              currentUser.displayName,
              currentUser.email
            );
          } catch (memoryError) {
            console.error("❌ Failed to update memory for fallback session:", memoryError);
          }

          setSessionId(fallbackSessionId);
          setUserId(authenticatedUserId);
          setPreviousSessionId(fallbackSessionId);
          setIsInitializingSession(false);

        }
      };

      initializeAuthenticatedSession();
    }
  }, [currentUser, sessionId]); // Only depend on currentUser and sessionId

  // Handle session regeneration from debug component
  const handleSessionRegenerated = async (
    newSessionId: string,
    newUserId: string
  ) => {
    // If no sessionId provided, call API to create new one
    if (!newSessionId && currentUser) {
      try {

        // Fetch phone_number from Firestore
        let phoneNumber = "";
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            phoneNumber = userDoc.data()?.phoneNumber || "";
          }
        } catch (firestoreError) {
          console.warn("⚠️ Could not fetch user data from Firestore:", firestoreError);
        }

        if (!phoneNumber) {
          console.warn("⚠️ No phone number found for user, falling back to local session");
          newSessionId = getSessionId();
        } else {
          const response = await fetch("/api/session/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: currentUser.uid,
              phone_number: phoneNumber,
            }),
          });

          if (response.ok) {
            const sessionData = await response.json();
            newSessionId = sessionData.body.session_id;
            console.log("✅ Session regenerated via API:", newSessionId);
          } else {
            throw new Error("Failed to create session via API");
          }
        }
      } catch (error) {
        console.error("❌ Error regenerating session:", error);
        // Fallback to provided session or generate locally
        newSessionId = newSessionId || getSessionId();
      }
    }

    // Update memory for regenerated session
    if (currentUser) {
      try {
        await updateMemoryOnSessionChange(
          currentUser.uid,
          newSessionId,
          currentUser.displayName,
          currentUser.email
        );
      } catch (memoryError) {
        console.error("❌ Failed to update memory for regenerated session:", memoryError);
      }
    }

    setSessionId(newSessionId);
    // For authenticated users, userId should always remain the same (Firebase UID)
    // but we'll update it anyway in case the debug component passes it
    setUserId(currentUser?.uid || newUserId);
    setIsFirstMessage(true); // Reset first message flag for new session

  };

  return {
    // Session state
    sessionId,
    userId,
    previousSessionId,
    isFirstMessage,
    isInitializingSession,
    // State setters (for external updates)
    setSessionId,
    setUserId,
    setIsFirstMessage,
    // Handler functions
    handleSessionRegenerated,
  };
}

