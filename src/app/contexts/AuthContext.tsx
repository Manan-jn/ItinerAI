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
import { doc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../../../firebase";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  signup: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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
        // New user - show onboarding
        setShowOnboarding(true);
      }
      // Note: Don't redirect here - let the redirect happen after onboarding is complete
      // or from the useEffect in flights/[id]/page.tsx for users who completed onboarding
    }
  }

  async function logout() {
    await signOut(auth);
    // Redirect to flights page after logout without any query parameters
    router.replace("/flights");
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    showOnboarding,
    setShowOnboarding,
    signup,
    login,
    loginWithGoogle,
    logout,
    checkUserOnboardingStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
