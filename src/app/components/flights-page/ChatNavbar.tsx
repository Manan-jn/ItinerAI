import React from "react";
import { User } from "firebase/auth";
import { MdChat, MdExplore } from "react-icons/md";
import { ProfileDropdown } from "./ProfileDropdown";

interface ChatNavbarProps {
  currentUser: User;
  showProfileDropdown: boolean;
  setShowProfileDropdown: (show: boolean) => void;
  onSettings: () => void;
  onLogout: () => void;
  showFlashcards: boolean;
  showFlights: boolean;
  showItinerary: boolean;
  showDateSelector: boolean;
  showDebug: boolean;
  onFlashcardsToggle: () => void;
  onFlightsToggle: () => void;
  onItineraryToggle: () => void;
  onDateSelectorToggle: () => void;
  onDebugToggle: () => void;
}

export function ChatNavbar({
  currentUser,
  showProfileDropdown,
  setShowProfileDropdown,
  onSettings,
  onLogout,
  showFlashcards,
  showFlights,
  showItinerary,
  showDateSelector,
  showDebug,
  onFlashcardsToggle,
  onFlightsToggle,
  onItineraryToggle,
  onDateSelectorToggle,
  onDebugToggle,
}: ChatNavbarProps) {
  return (
    <nav className="bg-white border-b border-gray-200 flex-shrink-0">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Chat Header Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
              <MdChat className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Travel Assistant
              </h1>
              <p className="text-xs text-gray-500">
                Powered by AI • Ready to help
              </p>
            </div>
          </div>

          {/* Right Side - Toggles and Status */}
          <div className="flex items-center space-x-3">
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

            {/* Debug Toggle */}
            <button
              onClick={onDebugToggle}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                showDebug
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
              }`}
              title="Toggle Debug Info (Ctrl/Cmd + D)"
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

            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
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
