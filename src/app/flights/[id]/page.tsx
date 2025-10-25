"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";

// Import the main flights page component but create a wrapper for authenticated users
import FlightsPageAuthenticated from "./FlightsPageAuthenticated";

export default function FlightsIdPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!currentUser) {
      // Redirect to flights with login modal open if not authenticated
      router.push("/flights?login=true");
      return;
    }

    // Validate that the ID matches the current user
    const userId = currentUser.uid;
    const routeId = params.id as string;

    if (routeId !== userId) {
      // Redirect to correct flights URL
      router.push(`/flights/${userId}`);
      return;
    }

    setIsValidating(false);
  }, [currentUser, loading, router, params.id]);

  // Show loading while validating
  if (loading || isValidating) {
    return <LoadingSpinner message="Loading flights..." duration={5} />;
  }

  // Show authenticated flights page if user is logged in and ID matches
  if (currentUser && params.id === currentUser.uid) {
    return <FlightsPageAuthenticated />;
  }

  // This shouldn't happen due to the useEffect redirects, but just in case
  return null;
}
