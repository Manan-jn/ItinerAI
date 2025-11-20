import React from "react";
import { User } from "firebase/auth";
import { MdChat, MdExplore } from "react-icons/md";
import { ProfileDropdown } from "./ProfileDropdown";
import { GoogleTranslate } from "./GoogleTranslate";

interface ChatNavbarProps {
  currentUser: User;
  showProfileDropdown: boolean;
  setShowProfileDropdown: (show: boolean) => void;
  onSettings: () => void;
  onLogout: () => void;
  showFlashcards: boolean;
  showFlights: boolean;
  showStays: boolean;
  showItinerary: boolean;
  showDateSelector: boolean;
  showDebug: boolean;
  showBooking?: boolean;
  showPreTrip?: boolean;
  showInTrip?: boolean;
  testEndResponse?: boolean;
  sessionId?: string;
  onFlashcardsToggle: () => void;
  onFlightsToggle: () => void;
  onStaysToggle: () => void;
  onItineraryToggle: () => void;
  onDateSelectorToggle: () => void;
  onDebugToggle: () => void;
  onBookingToggle?: () => void;
  onPreTripToggle?: () => void;
  onInTripToggle?: () => void;
  onTestEndResponseToggle?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function ChatNavbar({
  currentUser,
  showProfileDropdown,
  setShowProfileDropdown,
  onSettings,
  onLogout,
  showFlashcards,
  showFlights,
  showStays,
  showItinerary,
  showDateSelector,
  showDebug,
  showBooking = false,
  showPreTrip = false,
  showInTrip = false,
  testEndResponse = false,
  sessionId = "",
  onFlashcardsToggle,
  onFlightsToggle,
  onStaysToggle,
  onItineraryToggle,
  onDateSelectorToggle,
  onDebugToggle,
  onBookingToggle,
  onPreTripToggle,
  onInTripToggle,
  onTestEndResponseToggle,
  isSidebarCollapsed = false,
  onToggleSidebar,
}: ChatNavbarProps) {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 flex-shrink-0 shadow-sm">
      <div className="px-6 py-3.5">
        <div className="flex items-center justify-between">
          {/* Left Side - Hamburger Menu + Chat Header Info */}
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Button */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
                title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
              >
                <svg
                  className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}

            {/* Chat Header Info */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50">
              <MdChat className="text-white text-lg" />
            </div>
            <div>
              <h1
                className="text-base font-bold tracking-tight bg-gradient-to-r from-blue-800 via-blue-600 to-blue-400 bg-clip-text text-transparent"
                style={{
                  background:
                    "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Travel Assistant
              </h1>
              <p className="text-[10px] text-gray-400 font-medium">
                Powered by AI
              </p>
            </div>
          </div>

          {/* Right Side - Toggles and Status */}
          <div className="flex items-center gap-2">
            {/* Component Toggles - Only show when debug mode is active */}
            {showDebug && (
              <>
                {/* Places Toggle */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Places</span>
                  <button
                    onClick={onFlashcardsToggle}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ${
                      showFlashcards
                        ? "bg-purple-500 border-purple-400 shadow-md shadow-purple-200"
                        : "bg-gray-300 border-gray-400 hover:bg-gray-400"
                    } border`}
                    title="Toggle Places Explorer"
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                        showFlashcards ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Flights Toggle */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Flights</span>
                  <button
                    onClick={onFlightsToggle}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ${
                      showFlights
                        ? "bg-blue-500 border-blue-400 shadow-md shadow-blue-200"
                        : "bg-gray-300 border-gray-400 hover:bg-gray-400"
                    } border`}
                    title="Toggle Flights Search"
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                        showFlights ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Stays Toggle */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Stays</span>
                  <button
                    onClick={onStaysToggle}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ${
                      showStays
                        ? "bg-green-500 border-green-400 shadow-md shadow-green-200"
                        : "bg-gray-300 border-gray-400 hover:bg-gray-400"
                    } border`}
                    title="Toggle Stays Search"
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                        showStays ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Itinerary Toggle */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Itinerary</span>
                  <button
                    onClick={onItineraryToggle}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ${
                      showItinerary
                        ? "bg-gradient-to-r from-purple-500 to-blue-500 border-purple-400 shadow-md shadow-purple-200"
                        : "bg-gray-300 border-gray-400 hover:bg-gray-400"
                    } border`}
                    title="Toggle Day Itinerary"
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                        showItinerary ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Date Selector Toggle */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Dates</span>
                  <button
                    onClick={onDateSelectorToggle}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ${
                      showDateSelector
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 border-pink-400 shadow-md shadow-pink-200"
                        : "bg-gray-300 border-gray-400 hover:bg-gray-400"
                    } border`}
                    title="Toggle Date Selector"
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                        showDateSelector ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </>
            )}

            {/* Debug Toggles - Only show when debug mode is active */}
            {showDebug && (
              <>
                {/* Booking Toggle */}
                {onBookingToggle && (
                  <button
                    onClick={onBookingToggle}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                      showBooking
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                    }`}
                    title="Toggle Booking Widget"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                    <span>Booking</span>
                  </button>
                )}

                {/* PreTrip Toggle */}
                {onPreTripToggle && (
                  <button
                    onClick={onPreTripToggle}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                      showPreTrip
                        ? "bg-purple-100 text-purple-700 border border-purple-300"
                        : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                    }`}
                    title="Toggle Pre-Trip Brief"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>PreTrip</span>
                  </button>
                )}

                {/* InTrip Toggle */}
                {onInTripToggle && (
                  <button
                    onClick={onInTripToggle}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                      showInTrip
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                    }`}
                    title="Toggle In-Trip Component"
                  >
                    <svg
                      className="w-3 h-3"
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
                    <span>InTrip</span>
                  </button>
                )}

                {/* Test End Response Toggle */}
                {onTestEndResponseToggle && (
                  <button
                    onClick={onTestEndResponseToggle}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                      testEndResponse
                        ? "bg-orange-100 text-orange-700 border border-orange-300"
                        : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                    }`}
                    title="Test End Response - Next message will trigger date selector"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Test End</span>
                  </button>
                )}

                {/* Session ID Display */}
                {sessionId && (
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span title={sessionId} className="max-w-[120px] truncate">
                      {sessionId.slice(0, 8)}...
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Google Translate Widget */}
            <GoogleTranslate />

            {/* Debug Toggle Button */}
            <button
              onClick={onDebugToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                showDebug
                  ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200 shadow-sm"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
              title="Toggle Debug Info (Ctrl/Cmd + D)"
            >
              <svg
                className="w-3.5 h-3.5"
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
              <span>Debug</span>
            </button>

            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-600 ring-1 ring-green-200 shadow-sm">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
              Online
            </span>

            <ProfileDropdown
              currentUser={currentUser}
              showProfileDropdown={showProfileDropdown}
              setShowProfileDropdown={setShowProfileDropdown}
              onSettings={onSettings}
              onLogout={onLogout}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
