import React, { useState } from "react";
import { User } from "firebase/auth";
import { ProfileDropdown } from "./ProfileDropdown";
import {
  upcomingTrips,
  malaysiaPlaces,
  friendsLocations,
  quickActions,
} from "./DashboardData";

interface DashboardContentProps {
  currentUser: User;
  showProfileDropdown: boolean;
  setShowProfileDropdown: (show: boolean) => void;
  onSettings: () => void;
  onLogout: () => void;
}

export function DashboardContent({
  currentUser,
  showProfileDropdown,
  setShowProfileDropdown,
  onSettings,
  onLogout,
}: DashboardContentProps) {
  const [dashboardChatInput, setDashboardChatInput] = useState("");
  const [convertAmount, setConvertAmount] = useState("1500");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [convertedAmount] = useState("1275.53");

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
      {/* Combined Navigation Bar - Fixed */}
      <nav className="bg-white border-b border-gray-200 flex-shrink-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Good Morning Message */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-0.5">
                Good Morning,{" "}
                {currentUser?.displayName?.split(" ")[0] || "User"} 👋
              </h1>
              <p className="text-sm text-gray-500">
                Plan your itinerary with us
              </p>
            </div>

            {/* Right Side - User Profile */}
            <div className="flex items-center space-x-3">
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

      {/* Main Content Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 p-5">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-7 space-y-4">
            {/* Upcoming Trip */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-0.5">
                    Upcoming Trip
                  </h2>
                  <p className="text-xs text-gray-500">
                    Remember your upcoming trips!
                  </p>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                  Details
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {upcomingTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start space-x-2.5 mb-3">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-xl flex-shrink-0 border border-blue-100">
                        {trip.image}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-xs text-gray-900 mb-0.5 truncate">
                          {trip.from}
                        </h3>
                        <p className="text-[10px] text-gray-500">
                          {trip.country}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] mb-2.5">
                      <div className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-medium">
                        {trip.date}
                      </div>
                      <div className="text-gray-500">{trip.duration}</div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">
                          Budget:
                        </p>
                        <p className="font-semibold text-sm text-gray-900">
                          {trip.budget}
                        </p>
                      </div>
                      <div className="flex items-center -space-x-1">
                        {trip.travelers.map((traveler, idx) => (
                          <div
                            key={idx}
                            className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-[10px] border-2 border-white"
                          >
                            {traveler}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For your Malaysia Trip */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-1.5">
                  <h2 className="text-base font-semibold text-gray-900">
                    For your <span className="text-blue-600">Malaysia</span>{" "}
                    <span className="text-blue-500">🏔️ Trip</span>
                  </h2>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                  Details
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                These can't be missed places
              </p>

              <div className="space-y-3">
                {malaysiaPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 border border-blue-100">
                        {place.image}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1.5">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm text-gray-900 mb-1">
                              {place.name}
                            </h3>
                            <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">
                              {place.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                              <svg
                                className="w-4 h-4 text-red-500"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                              </svg>
                            </button>
                            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                              <svg
                                className="w-4 h-4 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-500 text-xs">⭐</span>
                            <span className="text-xs font-semibold text-gray-900">
                              {place.rating}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              ({place.reviews})
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-[10px] text-gray-500">
                            <span>Guide by:</span>
                            <span className="text-gray-900 font-medium">
                              👤 {place.guide}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {place.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* One Week Itinerary */}
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-50">
                <div className="absolute inset-0 flex items-center justify-center text-5xl">
                  🏛️
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  One Week Itinerary - Malacca...
                </h3>
                <div className="flex items-center space-x-1.5 text-xs text-gray-500 mb-3">
                  <span>Traveller:</span>
                  <span className="text-gray-900">
                    👤 {currentUser?.displayName?.split(" ")[0] || "User"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500 mb-0.5">Budget</p>
                    <p className="font-semibold text-sm text-gray-900">
                      $1,200
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Person</p>
                    <p className="font-semibold text-sm text-gray-900">2</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Duration</p>
                    <p className="font-semibold text-sm text-gray-900">
                      7d, 6n
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar with Chat on Top */}
          <div className="xl:col-span-5 space-y-4">
            {/* AI Assistant / Chatnavi */}
            <div className="bg-gradient-to-br from-blue-50 via-white to-white rounded-xl border border-blue-200 shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                    Hi I'm{" "}
                    <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                      Chatnavi
                    </span>
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Your AI travel assistant — available 24/7
                  </p>
                </div>
              </div>

              <div className="p-4">
                {/* Quick Actions */}
                <div className="space-y-1.5 mb-4">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      className="w-full flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 rounded-lg p-2.5 transition-all text-xs text-left border border-gray-200 hover:border-blue-300"
                    >
                      <span className="text-base">{action.icon}</span>
                      <span className="text-gray-700">{action.label}</span>
                    </button>
                  ))}
                </div>

                {/* Chat Input */}
                <form className="relative mb-2">
                  <input
                    type="text"
                    value={dashboardChatInput}
                    onChange={(e) => setDashboardChatInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-xs focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:text-blue-700 transition-colors"
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
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </button>
                </form>

                {/* Voice Button */}
                <button className="w-full bg-gray-50 hover:bg-gray-100 rounded-lg p-2.5 transition-all flex items-center justify-center space-x-2 border border-gray-200">
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  <span className="text-xs text-gray-700">Voice Input</span>
                </button>
              </div>
            </div>

            {/* Friends Location */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900">
                  Friends Location
                </h3>
                <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                  Expand
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Check on your friend live location
              </p>

              {/* Map */}
              <div className="bg-gray-50 rounded-lg h-52 relative overflow-hidden border border-gray-200">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-blue-100/30"></div>

                {/* Grid lines */}
                <div className="absolute inset-0">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={`h-${i}`}
                      className="absolute left-0 right-0 h-px bg-gray-300/50"
                      style={{ top: `${(i + 1) * 12.5}%` }}
                    ></div>
                  ))}
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={`v-${i}`}
                      className="absolute top-0 bottom-0 w-px bg-gray-300/50"
                      style={{ left: `${(i + 1) * 12.5}%` }}
                    ></div>
                  ))}
                </div>

                {/* Friend markers */}
                {friendsLocations.map((friend, idx) => (
                  <div
                    key={idx}
                    className="absolute"
                    style={{
                      top: `${friend.lat}%`,
                      left: `${friend.lng}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <span className="text-sm">👤</span>
                      </div>
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white border border-gray-200 px-2 py-1 rounded text-[10px] shadow-sm">
                        {friend.name}
                        <div className="text-gray-500">{friend.location}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exchange Converter */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">
                  Exchange Converter
                </h3>
                <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span>Live</span>
                </span>
              </div>

              {/* From Currency */}
              <div className="mb-3">
                <label className="text-[10px] text-gray-500 mb-1.5 block">
                  Amount to convert
                </label>
                <div className="flex items-center space-x-2 mb-2">
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400 flex-1"
                  >
                    <option value="USD">USD 🇺🇸</option>
                    <option value="EUR">EUR 🇪🇺</option>
                    <option value="GBP">GBP 🇬🇧</option>
                  </select>
                  <button className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  value={`$${convertAmount}`}
                  onChange={(e) =>
                    setConvertAmount(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  className="w-full bg-transparent text-2xl font-bold text-gray-900 focus:outline-none"
                />
              </div>

              {/* To Currency */}
              <div>
                <label className="text-[10px] text-gray-500 mb-1.5 block">
                  Converted amount
                </label>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs mb-2 w-full focus:outline-none focus:border-blue-400"
                >
                  <option value="EUR">EUR 🇪🇺</option>
                  <option value="USD">USD 🇺🇸</option>
                  <option value="GBP">GBP 🇬🇧</option>
                </select>
                <div className="text-2xl font-bold text-blue-600">
                  ${convertedAmount}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
