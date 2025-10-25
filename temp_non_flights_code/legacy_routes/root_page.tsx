"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";
import LandingPage from "./components/LandingPage";
import LoadingSpinner from "./components/LoadingSpinner";

export default function Home() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  // Remove auto-redirect for authenticated users
  // Users can now access the landing page even when logged in

  // Show loading while checking authentication
  if (loading) {
    return <LoadingSpinner message="Checking authentication..." duration={4} />;
  }

  // Show landing page for all users (authenticated and non-authenticated)
  return <LandingPage />;
}
