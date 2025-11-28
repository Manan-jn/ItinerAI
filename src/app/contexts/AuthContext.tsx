"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../../../firebase";
import { clearCustomUserId } from "../utils/sessionManager";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  isGuest: boolean;
  signup: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  checkUserOnboardingStatus: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const router = useRouter();

  // Check if user has completed onboarding
  async function checkUserOnboardingStatus(userId: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      return userDoc.exists() && userDoc.data()?.onboardingCompleted === true;
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      return false;
    }
  }

  async function signup(email: string, password: string, displayName?: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    // Show onboarding modal for new users
    if (result.user) {
      // CRITICAL: Clear sessionStorage BEFORE showing onboarding to prevent race condition
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("itinerai_session_id");
        sessionStorage.removeItem("itinerai_user_id");
      }
      setShowOnboarding(true);
    }
  }

  async function login(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    if (result.user) {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = await checkUserOnboardingStatus(
        result.user.uid
      );

      if (!hasCompletedOnboarding) {
        // CRITICAL: Clear sessionStorage BEFORE showing onboarding to prevent race condition
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("itinerai_session_id");
          sessionStorage.removeItem("itinerai_user_id");
        }
        // User exists but hasn't completed onboarding - show onboarding
        setShowOnboarding(true);
      }
      // Note: Don't redirect here - let the redirect happen after onboarding is complete
      // or from the useEffect in flights/[id]/page.tsx for users who completed onboarding
    }
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = await checkUserOnboardingStatus(
        result.user.uid
      );

      if (!hasCompletedOnboarding) {
        // CRITICAL: Clear sessionStorage BEFORE showing onboarding to prevent race condition
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("itinerai_session_id");
          sessionStorage.removeItem("itinerai_user_id");
        }
        // New user - show onboarding
        setShowOnboarding(true);
      }
      // Note: Don't redirect here - let the redirect happen after onboarding is complete
      // or from the useEffect in flights/[id]/page.tsx for users who completed onboarding
    }
  }

  async function logout() {
    // Clear all session and storage data
    if (typeof window !== "undefined") {
      // Clear guest session if present
      const storedGuest = localStorage.getItem("guestUser");
      if (storedGuest) {
        localStorage.removeItem("guestUser");
        setIsGuest(false);
      }

      // Clear custom user ID from localStorage
      clearCustomUserId();

      // Clear session storage
      sessionStorage.removeItem("itinerai_session_id");
      sessionStorage.removeItem("itinerai_user_id");

    }

    await signOut(auth);
    // Redirect to flights page after logout without any query parameters
    router.replace("/flights");
  }

  useEffect(() => {
    // If a guest session exists, prefer it over Firebase auth
    if (typeof window !== "undefined") {
      const storedGuest = localStorage.getItem("guestUser");
      if (storedGuest) {
        try {
          const parsed = JSON.parse(storedGuest);
          setCurrentUser(parsed as User);
          setIsGuest(true);
          setLoading(false);
          return;
        } catch (e) {
          // Fallback to normal auth flow
          localStorage.removeItem("guestUser");
        }
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsGuest(false);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function continueAsGuest() {
    // Generate a random UID and set minimal user fields used by the app
    const uid =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? (crypto.randomUUID() as string)
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const guestUserMinimal = {
      uid,
      email: null,
      displayName: "Guest",
      photoURL: null,
    } as unknown as User;

    // Persist a users doc stub so onboarding checks and downstream Firestore work
    try {
      await setDoc(
        doc(db, "users", uid),
        {
          onboardingCompleted: false,
          isGuest: true,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      // Non-fatal; allow guest session to proceed
      console.warn("Failed to seed guest user doc:", e);
    }

    // Persist locally and update state
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "guestUser",
        JSON.stringify({
          uid,
          email: null,
          displayName: "Guest",
          photoURL: null,
        })
      );
    }

    setCurrentUser(guestUserMinimal);
    setIsGuest(true);
    // CRITICAL: Clear sessionStorage BEFORE showing onboarding to prevent race condition
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("itinerai_session_id");
      sessionStorage.removeItem("itinerai_user_id");
    }
    // Trigger onboarding for new guest
    setShowOnboarding(true);
  }

  const value: AuthContextType = {
    currentUser,
    loading,
    showOnboarding,
    setShowOnboarding,
    isGuest,
    signup,
    login,
    loginWithGoogle,
    continueAsGuest,
    logout,
    checkUserOnboardingStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
