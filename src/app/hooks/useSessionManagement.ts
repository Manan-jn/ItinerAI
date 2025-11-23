import { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { getSessionId } from "../utils/sessionManager";

/**
 * Custom hook for managing session state and operations
 * Handles session initialization, regeneration, and state management
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

  // Initialize session for authenticated user using API
  useEffect(() => {
    if (currentUser && !sessionId && !sessionInitRef.current) {
      // Only run if we don't have a session yet AND haven't started initialization
      sessionInitRef.current = true; // Mark as initializing to prevent double calls

      const initializeAuthenticatedSession = async () => {
        const authenticatedUserId = currentUser.uid; // Always use Firebase UID

        setIsInitializingSession(true);

        try {
          // Fetch phone_number from Firestore
          let phoneNumber = "";
          try {
            const userDoc = await getDoc(doc(db, "users", authenticatedUserId));
            if (userDoc.exists()) {
              phoneNumber = userDoc.data()?.phoneNumber || "";
            }
          } catch (firestoreError) {
            console.warn("⚠️ Could not fetch user data from Firestore:", firestoreError);
          }

          if (!phoneNumber) {
            console.warn("⚠️ No phone number found for user, falling back to local session");
            const fallbackSessionId = getSessionId();
            setSessionId(fallbackSessionId);
            setUserId(authenticatedUserId);
            setPreviousSessionId(fallbackSessionId);
            setIsInitializingSession(false);
            return;
          }

          // Call /api/session/create to get a new session ID
          console.log(
            "🔄 Creating new session via API for user:",
            authenticatedUserId
          );

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

          setSessionId(newSessionId);
          setUserId(authenticatedUserId);
          setPreviousSessionId(newSessionId);
          setIsInitializingSession(false);

          console.log("Authenticated flights session initialized:", {
            sessionId: newSessionId,
            userId: authenticatedUserId,
            userEmail: currentUser.email,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error("❌ Error creating session via API:", error);

          // Fallback to old method if API fails
          console.warn("⚠️ Falling back to local session generation");
          const fallbackSessionId = getSessionId();

          setSessionId(fallbackSessionId);
          setUserId(authenticatedUserId);
          setPreviousSessionId(fallbackSessionId);
          setIsInitializingSession(false);

          console.log("Authenticated flights session initialized (fallback):", {
            sessionId: fallbackSessionId,
            userId: authenticatedUserId,
            userEmail: currentUser.email,
            isAuthenticated: true,
          });
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
        console.log(
          "🔄 Regenerating session via API for user:",
          currentUser.uid
        );

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

    setSessionId(newSessionId);
    // For authenticated users, userId should always remain the same (Firebase UID)
    // but we'll update it anyway in case the debug component passes it
    setUserId(currentUser?.uid || newUserId);
    setIsFirstMessage(true); // Reset first message flag for new session

    console.log("Authenticated session regenerated:", {
      sessionId: newSessionId,
      userId: currentUser?.uid || newUserId,
      userEmail: currentUser?.email,
    });
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

