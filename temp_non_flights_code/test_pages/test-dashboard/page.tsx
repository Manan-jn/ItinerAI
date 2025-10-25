"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function TestDashboardPage() {
  const [currentUser] = useState({
    name: "Vetrick W.",
    firstName: "Vetrick",
  });
  const [selectedSeats, setSelectedSeats] = useState<string[]>(["4K"]);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [convertAmount, setConvertAmount] = useState("1500");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [convertedAmount, setConvertedAmount] = useState("1275.53");

  // Exchange rate simulation
  useEffect(() => {
    const rate = fromCurrency === "USD" && toCurrency === "EUR" ? 0.8503 : 1;
    const result = (parseFloat(convertAmount || "0") * rate).toFixed(2);
    setConvertedAmount(result);
  }, [convertAmount, fromCurrency, toCurrency]);

  const handleSeatClick = (seat: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]
    );
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: chatInput },
      {
        role: "assistant",
        content: "I can help you with that! Let me check the details.",
      },
    ]);
    setChatInput("");
  };

  const quickActions = [
    { icon: "✈️", label: "Check flight status" },
    { icon: "🏨", label: "Recommend hotels nearby" },
    { icon: "🔄", label: "Build my itinerary" },
    { icon: "💱", label: "Currency exchange info" },
  ];

  // Seat layout for plane (simplified)
  const rows = [1, 2, 3, 4, 5, 6];
  const columns = ["A", "B", "C", "D", "E", "F"];
  const bookedSeats = ["1A", "2C", "3B", "4D", "5F"];
  const unavailableSeats = ["1B", "2A"];

  const getSeatStatus = (seat: string) => {
    if (bookedSeats.includes(seat)) return "booked";
    if (unavailableSeats.includes(seat)) return "unavailable";
    if (selectedSeats.includes(seat)) return "selected";
    return "available";
  };

  const getSeatColor = (status: string) => {
    switch (status) {
      case "booked":
        return "bg-gray-600";
      case "unavailable":
        return "bg-gray-800";
      case "selected":
        return "bg-blue-500";
      default:
        return "bg-gray-700 hover:bg-gray-600";
    }
  };

  // Month progress data
  const monthData = [
    { month: "Jan", progress: 20 },
    { month: "Feb", progress: 60 },
    { month: "Mar", progress: 40 },
    { month: "Apr", progress: 100 },
    { month: "May", progress: 80 },
    { month: "Jun", progress: 70 },
    { month: "Jul", progress: 100 },
    { month: "Aug", progress: 50 },
    { month: "Sept", progress: 30 },
    { month: "Okt", progress: 90 },
    { month: "Nov", progress: 10 },
    { month: "Dec", progress: 5 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-lg border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
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
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold">Navica</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#"
                className="text-white font-medium hover:text-blue-400 transition-colors"
              >
                Home
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                My Bookings
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Itinerary
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Community
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Money Changer
              </a>
            </nav>

            {/* Right Icons */}
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <svg
                  className="w-5 h-5"
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
              </button>
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold text-sm">
                {currentUser.firstName.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {currentUser.name} 👋
            </span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weather Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* New York Weather */}
              <div className="bg-gradient-to-br from-yellow-500/20 via-orange-500/10 to-gray-800 rounded-2xl p-6 border border-yellow-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">New York</h3>
                    <p className="text-sm text-gray-400">11:13 AM</p>
                  </div>
                  <div className="text-5xl">☀️</div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Mostly Cloudy</p>
                  </div>
                  <div className="text-4xl font-bold">29°</div>
                </div>
              </div>

              {/* Taipei City Weather */}
              <div className="bg-gradient-to-br from-blue-500/20 via-gray-700/30 to-gray-800 rounded-2xl p-6 border border-blue-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">Taipei City</h3>
                    <p className="text-sm text-gray-400">11:13 AM</p>
                  </div>
                  <div className="text-5xl">🌧️</div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">
                      Partly Cloudy, Rain
                    </p>
                  </div>
                  <div className="text-4xl font-bold">20°</div>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Upcoming Trips */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center space-x-2 mb-2 text-gray-400">
                  <span className="text-sm">Upcoming trips</span>
                </div>
                <div className="flex items-end space-x-2">
                  <span className="text-3xl font-bold">2</span>
                  <span className="text-red-400 text-sm mb-1">
                    ⚠️ scheduled
                  </span>
                </div>
              </div>

              {/* Travel Budget */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center space-x-2 mb-2 text-gray-400">
                  <span className="text-sm">Travel budget spent</span>
                </div>
                <div className="flex items-end space-x-2">
                  <span className="text-3xl font-bold">1.2k</span>
                  <span className="text-blue-400 text-sm mb-1">💰 $2.5k</span>
                </div>
              </div>

              {/* Visa Validity */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center space-x-2 mb-2 text-gray-400">
                  <span className="text-sm">Visa validity</span>
                </div>
                <div className="flex items-end space-x-2">
                  <span className="text-3xl font-bold">4 days</span>
                  <span className="text-blue-400 text-sm mb-1">🔵 /250</span>
                </div>
              </div>

              {/* Scan Luggage */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 flex flex-col items-center justify-center">
                <div className="text-4xl mb-2">🧳</div>
                <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  Scan luggage
                </button>
              </div>
            </div>

            {/* Flight Details */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Flight details</h2>
                <div className="text-sm text-gray-400">📅 12 Sep 2025</div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Flight Route */}
                <div className="space-y-6">
                  {/* Route Display */}
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-1">London</div>
                      <div className="text-2xl font-bold">LHR</div>
                      <div className="text-sm text-blue-400">15:00</div>
                      <div className="text-xs text-gray-500 mt-1">Gate 1</div>
                    </div>

                    <div className="flex-1 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="flex-1 h-px bg-gray-600"></div>
                        <div className="text-xs text-gray-400">✈️ 7h 30m</div>
                        <div className="flex-1 h-px bg-gray-600"></div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-1">New York</div>
                      <div className="text-2xl font-bold">JFK</div>
                      <div className="text-sm text-blue-400">19:40</div>
                      <div className="text-xs text-gray-500 mt-1">Gate 2</div>
                    </div>
                  </div>

                  {/* Seat Selection */}
                  <div>
                    <div className="text-sm text-gray-400 mb-3">
                      120 cm to seat
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {rows.map((row) =>
                        columns.map((col) => {
                          const seat = `${row}${col}`;
                          const status = getSeatStatus(seat);
                          return (
                            <button
                              key={seat}
                              onClick={() =>
                                status === "available" && handleSeatClick(seat)
                              }
                              disabled={
                                status === "booked" || status === "unavailable"
                              }
                              className={`
                                w-10 h-10 rounded-lg text-xs font-medium
                                ${getSeatColor(status)}
                                ${
                                  status === "available"
                                    ? "cursor-pointer"
                                    : "cursor-not-allowed"
                                }
                                transition-all
                              `}
                            >
                              {seat}
                            </button>
                          );
                        })
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span>Selected</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-600 rounded"></div>
                        <span>Booked</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-700 rounded"></div>
                        <span>Available</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Boarding Pass */}
                <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl p-6 border border-gray-600/50">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-2">
                      Boarding pass
                    </h3>
                    <p className="text-sm text-gray-400">Mr. Vetrick Wilsen</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">London</span>
                      <span className="font-semibold">Gate 1</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">LHR</span>
                      <span className="font-semibold">15:00</span>
                    </div>
                    <div className="h-px bg-gray-600 my-4"></div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">New York</span>
                      <span className="font-semibold">Gate 2</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">JFK</span>
                      <span className="font-semibold">19:40</span>
                    </div>
                  </div>

                  {/* QR Code Placeholder */}
                  <div className="bg-white rounded-lg p-4 flex items-center justify-center">
                    <div className="w-32 h-32 bg-gray-900 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-24 h-24"
                        viewBox="0 0 100 100"
                        fill="white"
                      >
                        <rect x="0" y="0" width="20" height="20" />
                        <rect x="30" y="0" width="10" height="10" />
                        <rect x="50" y="0" width="30" height="10" />
                        <rect x="90" y="0" width="10" height="10" />
                        <rect x="0" y="30" width="10" height="30" />
                        <rect x="20" y="30" width="20" height="10" />
                        <rect x="50" y="30" width="10" height="10" />
                        <rect x="70" y="30" width="30" height="30" />
                        <rect x="0" y="70" width="30" height="10" />
                        <rect x="40" y="70" width="20" height="10" />
                        <rect x="70" y="70" width="10" height="30" />
                        <rect x="0" y="90" width="10" height="10" />
                        <rect x="20" y="90" width="30" height="10" />
                        <rect x="90" y="90" width="10" height="10" />
                      </svg>
                    </div>
                  </div>

                  <div className="text-center mt-4">
                    <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg px-3 py-2 inline-block">
                      <span className="text-sm font-bold">BA-117</span>
                    </div>
                  </div>

                  {/* Flight Rules */}
                  <div className="mt-4 text-xs text-gray-400">
                    <p className="mb-1">
                      <span className="text-red-400">✈️</span> BRITISH AIRWAYS
                    </p>
                    <p className="mb-1">Flight rules:</p>
                    <p>1. Limite: 7kg</p>
                    <p>2. Max: 40×30×20 cm</p>
                  </div>

                  <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-red-300">
                      ⚠️ Your limit overweight
                    </p>
                    <p className="text-sm font-bold text-red-400">0.5 kg</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Itinerary Setup Progress */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  Itinerary Setup Progress
                </h2>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">
                  1 task already completed
                </span>
              </div>

              <div className="flex items-end justify-between space-x-3">
                {monthData.map((month, idx) => (
                  <div key={idx} className="flex-1 text-center">
                    <div className="h-32 bg-gray-700/30 rounded-t-lg relative overflow-hidden">
                      <div
                        className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all ${
                          month.progress === 100
                            ? "bg-gradient-to-t from-blue-500 to-cyan-400"
                            : "bg-gradient-to-t from-gray-600 to-gray-500"
                        }`}
                        style={{ height: `${month.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {month.month}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Travel Highlight Video */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 relative h-64">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 mx-auto">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold">Steven Richard</p>
                  <p className="text-sm text-gray-400">New York, 13 Feb 2022</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* AI Assistant Card */}
            <div className="bg-gradient-to-br from-purple-500/20 via-gray-800/50 to-gray-900 rounded-2xl p-6 border border-purple-500/30">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">
                  Hi I'm{" "}
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Chatnavi
                  </span>
                  ,
                </h3>
                <p className="text-sm text-gray-400">
                  Your personal travel assistant — available 24/7 for any trip
                  needs with instant smart suggestions.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 mb-4">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center space-x-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg p-3 transition-all text-sm text-left"
                  >
                    <span className="text-xl">{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Chat Messages */}
              {chatMessages.length > 0 && (
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`text-sm p-2 rounded-lg ${
                        msg.role === "user"
                          ? "bg-blue-500/20 text-blue-200 ml-4"
                          : "bg-gray-700/50 text-gray-300 mr-4"
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))}
                </div>
              )}

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="+ Ask me anything..."
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
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
              <button className="w-full mt-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg p-3 transition-all flex items-center justify-center space-x-2">
                <svg
                  className="w-5 h-5"
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
              </button>
            </div>

            {/* Exchange Converter */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Exchange Converter</h3>
                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full flex items-center space-x-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span>Live</span>
                </span>
              </div>

              {/* From Currency */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block">
                  Amount to convert
                </label>
                <div className="flex items-center space-x-3">
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="USD">United States Dollar 🇺🇸</option>
                    <option value="EUR">Euro 🇪🇺</option>
                    <option value="GBP">British Pound 🇬🇧</option>
                  </select>
                  <button className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
                    <svg
                      className="w-5 h-5"
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
                  className="w-full bg-transparent text-3xl font-bold mt-3 focus:outline-none"
                />
              </div>

              {/* To Currency */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  Converted amount
                </label>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="EUR">Euro 🇪🇺</option>
                  <option value="USD">United States Dollar 🇺🇸</option>
                  <option value="GBP">British Pound 🇬🇧</option>
                </select>
                <div className="text-3xl font-bold text-blue-400">
                  ${convertedAmount}
                </div>
              </div>
            </div>

            {/* Nearby Money Changer */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold mb-4">
                Nearby Money Changer
              </h3>
              <div className="bg-gray-700/30 rounded-xl h-64 relative overflow-hidden">
                {/* Map Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500/30 backdrop-blur-sm rounded-full flex items-center justify-center mb-2 mx-auto animate-ping">
                      <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                    </div>
                    <p className="text-sm text-gray-400">Your Location</p>
                  </div>
                </div>

                {/* Location Markers */}
                <div className="absolute top-12 left-12 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                  🏪
                </div>
                <div className="absolute bottom-16 right-16 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                  🏪
                </div>
                <div className="absolute top-32 right-24 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                  🏪
                </div>
              </div>

              {/* Map Legend */}
              <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>You</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>Money Changers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
