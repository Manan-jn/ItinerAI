"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import Dashboard from "../../components/Dashboard";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function DashboardPage() {
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

    // Redirect all dashboard access to flights
    router.push(`/flights/${currentUser.uid}`);
  }, [currentUser, loading, router, params.id]);

  // Show loading while redirecting
  return <LoadingSpinner message="Redirecting to flights..." duration={3} />;
}
