"use client";

import { useState, useEffect } from "react";
import ChatModal from "../components/ChatModal";

export default function TestDashboard2Page() {
  const [currentUser] = useState({
    name: "Cecil",
    role: "Part-time Traveller",
    avatar: "👤",
  });

  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [convertAmount, setConvertAmount] = useState("1500");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [convertedAmount, setConvertedAmount] = useState("1275.53");

  // Chat modal state
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [initialChatMessage, setInitialChatMessage] = useState("");

  // Exchange rate simulation
  useEffect(() => {
    const rate = fromCurrency === "USD" && toCurrency === "EUR" ? 0.8503 : 1;
    const result = (parseFloat(convertAmount || "0") * rate).toFixed(2);
    setConvertedAmount(result);
  }, [convertAmount, fromCurrency, toCurrency]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // Open the chat modal with the initial message
    setInitialChatMessage(chatInput);
    setIsChatModalOpen(true);
    setChatInput("");
  };

  const handleCloseChatModal = () => {
    setIsChatModalOpen(false);
    setInitialChatMessage("");
  };

  // Sample data
  const topImages = [
    { id: 1, image: "🏔️", hasIndicator: true },
    { id: 2, image: "🌆", hasIndicator: true },
    { id: 3, image: "🏔️", hasIndicator: true },
    { id: 4, image: "🌄", hasIndicator: true },
    { id: 5, image: "🌃", hasIndicator: false },
    { id: 6, image: "🏞️", hasIndicator: false },
  ];

  const trips = [
    {
      id: 1,
      name: "Kuala Lumpur",
      duration: "5 Days, 24 Dec 2024",
      flag: "🇲🇾",
      country: "Malaysia",
    },
    {
      id: 2,
      name: "Tokyo",
      duration: "14 Days, 1 Jan 2025",
      flag: "🇯🇵",
      country: "Japan",
    },
    {
      id: 3,
      name: "Bangkok",
      duration: "8 Days, 4 Mar 2025",
      flag: "🇹🇭",
      country: "Thailand",
    },
    {
      id: 4,
      name: "Hanoi",
      duration: "8 Days, 10 Jul 2025",
      flag: "🇻🇳",
      country: "Vietnam",
    },
  ];

  const upcomingTrips = [
    {
      id: 1,
      from: "Kuala Lumpur - Ipoh",
      country: "Malaysia",
      image: "🏙️",
      date: "29 Dec",
      duration: "12 Days",
      budget: "$1,200",
      travelers: ["👤", "👤"],
    },
    {
      id: 2,
      from: "Sapa - Ninh Binh",
      country: "Vietnam",
      image: "🏞️",
      date: "24 Nov",
      duration: "12 Days",
      budget: "$890",
      travelers: ["👤", "👤"],
    },
  ];

  const malaysiaPlaces = [
    {
      id: 1,
      name: "Central Market - Kuala Lumpur",
      description:
        "A vibrant cultural landmark offering local crafts, souvenirs, and M...",
      rating: 4.5,
      reviews: 47,
      guide: "Nita",
      tags: ["Shopping", "Souvenirs", "Culture"],
      image: "🏪",
    },
    {
      id: 2,
      name: "Merdeka Square - Kuala Lumpur",
      description:
        "An iconic historic site surrounded by colonial buildings and the fa...",
      rating: 4.6,
      reviews: 53,
      guide: "El Primo",
      tags: ["History", "Architecture", "Photography"],
      image: "🏛️",
    },
  ];

  const friendsLocations = [
    { name: "Shelly A.", location: "Japan", lat: 35, lng: 60 },
    { name: "Edgar P.", location: "Argentina", lat: 20, lng: 30 },
  ];

  const quickActions = [
    { icon: "✈️", label: "Check flight status" },
    { icon: "🏨", label: "Recommend hotels nearby" },
    { icon: "🔄", label: "Build my itinerary" },
    { icon: "💱", label: "Currency exchange info" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Left Sidebar */}
      <aside className="w-52 bg-[#111111] border-r border-gray-800 flex flex-col">
        {/* User Profile */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-lg">
              {currentUser.avatar}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white text-sm">
                {currentUser.name}
              </h3>
              <p className="text-[10px] text-gray-500">{currentUser.role}</p>
            </div>
            <button className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
              <svg
                className="w-3.5 h-3.5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>

          <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg py-2.5 px-3 text-sm font-medium transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-1.5">
            <span>+</span>
            <span>New Trip</span>
          </button>
        </div>

        {/* Trips List */}
        <div className="flex-1 overflow-y-auto p-3">
          <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            TRIPS
          </h4>
          <div className="space-y-1.5">
            {trips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => setSelectedTrip(trip.name)}
                className={`w-full text-left p-2.5 rounded-lg transition-all ${
                  selectedTrip === trip.name
                    ? "bg-[#1a1a1a] border border-gray-800"
                    : "hover:bg-[#1a1a1a]/50"
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-0.5">
                  <span className="text-sm">{trip.flag}</span>
                  <span className="font-medium text-xs">{trip.name}</span>
                </div>
                <p className="text-[10px] text-gray-500">{trip.duration}</p>
              </button>
            ))}
          </div>

          {/* General Section */}
          <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-2">
            GENERAL
          </h4>
          <div className="space-y-1">
            <button className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg bg-[#1a1a1a] text-white">
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="text-xs">Dashboard</span>
            </button>
            <button className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-gray-500 hover:bg-[#1a1a1a]/50 hover:text-white transition-all">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span className="text-xs">Itinerary</span>
              <span className="ml-auto bg-purple-600 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                NEW!
              </span>
            </button>
          </div>

          {/* Discover Section */}
          <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-2">
            DISCOVER
          </h4>
          <div className="space-y-1">
            <button className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-gray-500 hover:bg-[#1a1a1a]/50 hover:text-white transition-all">
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
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              <span className="text-xs">Explore</span>
            </button>
            <button className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-gray-500 hover:bg-[#1a1a1a]/50 hover:text-white transition-all">
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span className="text-xs">Guide</span>
            </button>
            <button className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-gray-500 hover:bg-[#1a1a1a]/50 hover:text-white transition-all">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="text-xs">Friends</span>
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-gray-800">
          <button className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all">
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
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        {/* Top Header */}
        <header className="bg-[#0f0f0f]/80 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-0.5">
                Good Morning, {currentUser.name} 👋
              </h1>
              <p className="text-sm text-gray-500">
                Plan your itinerary with us
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors relative">
                <svg
                  className="w-5 h-5 text-gray-400"
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
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              </button>
              <button className="bg-[#1a1a1a] hover:bg-[#222222] px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 text-sm border border-gray-800">
                <span>Get Apps</span>
                <span className="text-xs">🍎</span>
                <span className="text-xs">🪟</span>
              </button>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="flex items-center space-x-2 mt-4">
            {topImages.map((img) => (
              <div
                key={img.id}
                className="relative w-12 h-12 bg-[#1a1a1a] rounded-lg overflow-hidden hover:ring-2 ring-blue-500/50 transition-all cursor-pointer flex items-center justify-center text-xl border border-gray-800"
              >
                {img.image}
                {img.hasIndicator && (
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full border border-[#1a1a1a]"></div>
                )}
              </div>
            ))}
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 p-5">
            {/* Left Column - Main Content */}
            <div className="xl:col-span-7 space-y-4">
              {/* Upcoming Trip */}
              <div className="bg-[#111111] rounded-xl p-5 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold mb-0.5">
                      Upcoming Trip
                    </h2>
                    <p className="text-xs text-gray-500">
                      Remember your upcoming trips!
                    </p>
                  </div>
                  <button className="text-orange-500 hover:text-orange-400 text-xs font-medium">
                    Details
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  {upcomingTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="bg-[#1a1a1a] rounded-lg p-3 border border-gray-800 hover:border-gray-700 transition-all"
                    >
                      <div className="flex items-start space-x-2.5 mb-3">
                        <div className="w-12 h-12 bg-[#252525] rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                          {trip.image}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-xs mb-0.5 truncate">
                            {trip.from}
                          </h3>
                          <p className="text-[10px] text-gray-500">
                            {trip.country}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] mb-2.5">
                        <div className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                          {trip.date}
                        </div>
                        <div className="text-gray-500">{trip.duration}</div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-gray-500 mb-0.5">
                            Budget:
                          </p>
                          <p className="font-semibold text-sm">{trip.budget}</p>
                        </div>
                        <div className="flex items-center -space-x-1">
                          {trip.travelers.map((traveler, idx) => (
                            <div
                              key={idx}
                              className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-[10px] border border-[#1a1a1a]"
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
              <div className="bg-[#111111] rounded-xl p-5 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1.5">
                    <h2 className="text-base font-semibold">
                      For your <span className="text-orange-500">Malaysia</span>{" "}
                      <span className="text-blue-400">🏔️ Trip</span>
                    </h2>
                  </div>
                  <button className="text-orange-500 hover:text-orange-400 text-xs font-medium">
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
                      className="bg-[#1a1a1a] rounded-lg p-3 border border-gray-800 hover:border-gray-700 transition-all"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-16 h-16 bg-[#252525] rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                          {place.image}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1.5">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm mb-1">
                                {place.name}
                              </h3>
                              <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">
                                {place.description}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              <button className="p-1.5 hover:bg-[#252525] rounded-lg transition-colors">
                                <svg
                                  className="w-4 h-4 text-red-500"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                              </button>
                              <button className="p-1.5 hover:bg-[#252525] rounded-lg transition-colors">
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
                              <span className="text-yellow-500 text-xs">
                                ⭐
                              </span>
                              <span className="text-xs font-semibold">
                                {place.rating}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                ({place.reviews})
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-[10px] text-gray-500">
                              <span>Guide by:</span>
                              <span className="text-white font-medium">
                                👤 {place.guide}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {place.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-[#252525] text-gray-400 px-2 py-0.5 rounded"
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
              <div className="bg-[#111111] rounded-xl overflow-hidden border border-gray-800">
                <div className="relative h-48 bg-gradient-to-br from-pink-500/20 to-orange-500/20">
                  <div className="absolute inset-0 flex items-center justify-center text-5xl">
                    🏛️
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold mb-3">
                    One Week Itinerary - Malacca...
                  </h3>
                  <div className="flex items-center space-x-1.5 text-xs text-gray-500 mb-3">
                    <span>Traveller:</span>
                    <span className="text-white">👤 Mortis A.</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-gray-500 mb-0.5">Budget</p>
                      <p className="font-semibold text-sm">$1,200</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">Person</p>
                      <p className="font-semibold text-sm">2</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">Duration</p>
                      <p className="font-semibold text-sm">7d, 6n</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar with Chat on Top */}
            <div className="xl:col-span-5 space-y-4">
              {/* AI Assistant / Chatnavi - Top Right */}
              <div className="bg-gradient-to-br from-purple-500/20 via-[#111111] to-[#111111] rounded-xl border border-purple-500/30 shadow-lg">
                <div className="p-4 border-b border-gray-800">
                  <div>
                    <h3 className="text-base font-semibold mb-0.5">
                      Hi I'm{" "}
                      <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
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
                        className="w-full flex items-center space-x-2 bg-[#1a1a1a] hover:bg-[#222222] rounded-lg p-2.5 transition-all text-xs text-left border border-gray-800"
                      >
                        <span className="text-base">{action.icon}</span>
                        <span className="text-gray-300">{action.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Chat Messages */}
                  {chatMessages.length > 0 && (
                    <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`text-xs p-2 rounded-lg ${
                            msg.role === "user"
                              ? "bg-blue-500/20 text-blue-200 ml-4"
                              : "bg-[#1a1a1a] text-gray-300 mr-4"
                          }`}
                        >
                          {msg.content}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Chat Input */}
                  <form onSubmit={handleChatSubmit} className="relative mb-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask me anything..."
                      className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2.5 pr-10 text-xs focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-purple-400 hover:text-purple-300 transition-colors"
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
                  <button className="w-full bg-[#1a1a1a] hover:bg-[#222222] rounded-lg p-2.5 transition-all flex items-center justify-center space-x-2 border border-gray-800">
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
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                    <span className="text-xs">Voice Input</span>
                  </button>
                </div>
              </div>

              {/* Friends Location */}
              <div className="bg-[#111111] rounded-xl p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold">Friends Location</h3>
                  <button className="text-orange-500 hover:text-orange-400 text-xs font-medium">
                    Expand
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Check on your friend live location
                </p>

                {/* Map */}
                <div className="bg-[#1a1a1a] rounded-lg h-52 relative overflow-hidden border border-gray-800">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-purple-900/10"></div>

                  {/* Grid lines */}
                  <div className="absolute inset-0">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={`h-${i}`}
                        className="absolute left-0 right-0 h-px bg-gray-700/30"
                        style={{ top: `${(i + 1) * 12.5}%` }}
                      ></div>
                    ))}
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={`v-${i}`}
                        className="absolute top-0 bottom-0 w-px bg-gray-700/30"
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
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                          <span className="text-sm">👤</span>
                        </div>
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0a0a0a] border border-gray-800 px-2 py-1 rounded text-[10px]">
                          {friend.name}
                          <div className="text-gray-500">{friend.location}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exchange Converter */}
              <div className="bg-[#111111] rounded-xl p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold">
                    Exchange Converter
                  </h3>
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
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
                      className="bg-[#1a1a1a] border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500/50 flex-1"
                    >
                      <option value="USD">USD 🇺🇸</option>
                      <option value="EUR">EUR 🇪🇺</option>
                      <option value="GBP">GBP 🇬🇧</option>
                    </select>
                    <button className="p-1.5 hover:bg-[#1a1a1a] rounded-lg transition-colors">
                      <svg
                        className="w-4 h-4 text-gray-400"
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
                    className="w-full bg-transparent text-2xl font-bold focus:outline-none"
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
                    className="bg-[#1a1a1a] border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs mb-2 w-full focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="EUR">EUR 🇪🇺</option>
                    <option value="USD">USD 🇺🇸</option>
                    <option value="GBP">GBP 🇬🇧</option>
                  </select>
                  <div className="text-2xl font-bold text-blue-400">
                    ${convertedAmount}
                  </div>
                </div>
              </div>

              {/* Nearby Money Changer */}
              <div className="bg-[#111111] rounded-xl p-4 border border-gray-800">
                <h3 className="text-base font-semibold mb-3">
                  Nearby Money Changer
                </h3>
                <div className="bg-[#1a1a1a] rounded-lg h-52 relative overflow-hidden border border-gray-800">
                  {/* Map Placeholder */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-purple-900/10"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-blue-500/30 backdrop-blur-sm rounded-full flex items-center justify-center mb-2 mx-auto animate-ping">
                        <div className="w-5 h-5 bg-blue-500 rounded-full"></div>
                      </div>
                      <p className="text-xs text-gray-500">Your Location</p>
                    </div>
                  </div>

                  {/* Location Markers */}
                  <div className="absolute top-10 left-10 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                    🏪
                  </div>
                  <div className="absolute bottom-14 right-14 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                    🏪
                  </div>
                  <div className="absolute top-28 right-20 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                    🏪
                  </div>
                </div>

                {/* Map Legend */}
                <div className="flex items-center justify-between mt-3 text-[10px] text-gray-500">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>You</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Money Changers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={isChatModalOpen}
        onClose={handleCloseChatModal}
        initialMessage={initialChatMessage}
      />
    </div>
  );
}
