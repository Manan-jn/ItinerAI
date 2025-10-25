"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import LoginModal from "./auth/LoginModal";
import SignupModal from "./auth/SignupModal";
import OnboardingModal from "./auth/OnboardingModal";

interface LandingPageProps {
  onGetStarted?: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const { currentUser, logout, showOnboarding, setShowOnboarding } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Check for login query parameter and open login modal
  useEffect(() => {
    if (searchParams.get("login") === "true") {
      setShowLoginModal(true);
    }
  }, [searchParams]);

  // Handle clicking outside profile dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showProfileDropdown &&
        !(e.target as Element).closest(".profile-dropdown")
      ) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showProfileDropdown]);

  const handleSwitchToSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  const closeModals = () => {
    setShowLoginModal(false);
    setShowSignupModal(false);
    // Clear login query parameter if present
    if (searchParams.get("login") === "true") {
      router.replace("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

      {/* Navigation */}
      <nav className="relative z-10 backdrop-blur-md bg-black/20 border-b border-white/10">
        <div className="flex items-center justify-between py-4 px-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold">ItinerAI</h1>
          </div>

          <div className="flex items-center space-x-3">
            {currentUser ? (
              // Show options for authenticated users
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors backdrop-blur-sm"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                    {currentUser?.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-sm font-medium text-white">
                        {currentUser?.displayName?.charAt(0) ||
                          currentUser?.email?.charAt(0) ||
                          "U"}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-300 hidden sm:block">
                    {currentUser.displayName?.split(" ")[0] ||
                      currentUser.email}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      showProfileDropdown ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-64 backdrop-blur-xl bg-black/40 border border-white/20 rounded-xl shadow-2xl z-50">
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                          {currentUser?.photoURL ? (
                            <img
                              src={currentUser.photoURL}
                              alt="Profile"
                              className="w-full h-full object-cover rounded-full"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-sm font-medium text-white">
                              {currentUser?.displayName?.charAt(0) ||
                                currentUser?.email?.charAt(0) ||
                                "U"}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {currentUser?.displayName || "User"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {currentUser?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={() => {
                          router.push("/flights/settings");
                          setShowProfileDropdown(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          logout();
                          setShowProfileDropdown(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Show options for non-authenticated users
              <>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors backdrop-blur-sm hover:bg-white/5 rounded-lg"
                >
                  Log In
                </button>
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-white rounded-lg font-medium transition-all backdrop-blur-sm border border-white/10"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-88px)] px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-light mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Travel Companion
          </h1>

          <p className="text-base md:text-lg text-gray-400 mb-8 max-w-xl mx-auto leading-relaxed">
            Plan perfect trips with intelligent recommendations
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16">
            {currentUser ? (
              // Show dashboard button for authenticated users
              <button
                onClick={() => router.push(`/flights/${currentUser.uid}`)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-white rounded-xl font-medium text-sm transition-all duration-300 backdrop-blur-sm border border-white/10 hover:border-white/20"
              >
                Go to Flights
              </button>
            ) : (
              // Show signup/login buttons for non-authenticated users
              <>
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-white rounded-xl font-medium text-sm transition-all duration-300 backdrop-blur-sm border border-white/10 hover:border-white/20"
                >
                  Get Started
                </button>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-6 py-3 text-gray-400 hover:text-white rounded-xl font-medium text-sm transition-colors backdrop-blur-sm hover:bg-white/5"
                >
                  Sign In
                </button>
              </>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 text-white">
                AI Planning
              </h3>
              <p className="text-gray-400 text-sm">
                Intelligent suggestions based on your preferences
              </p>
            </div>

            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 text-white">Weather</h3>
              <p className="text-gray-400 text-sm">
                Real-time forecasts for perfect planning
              </p>
            </div>

            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-pink-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 text-white">
                Recommendations
              </h3>
              <p className="text-gray-400 text-sm">
                Discover hidden gems and local favorites
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={closeModals}
        onSwitchToSignup={handleSwitchToSignup}
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={closeModals}
        onSwitchToLogin={handleSwitchToLogin}
      />
      {currentUser && (
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          userId={currentUser.uid}
        />
      )}
    </div>
  );
}
