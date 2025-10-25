"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiChevronDown, FiUser, FiCalendar } from "react-icons/fi";
import {
  MdFlight,
  MdHotel,
  MdTrain,
  MdDirectionsBus,
  MdBeachAccess,
  MdLocalTaxi,
  MdLocalActivity,
  MdCardGiftcard,
  MdHome,
  MdExplore,
  MdBook,
  MdPeople,
  MdChat,
} from "react-icons/md";
import { useAuth } from "../../contexts/AuthContext";
import Dashboard from "../../components/Dashboard";
import SessionDebugFlights from "../../components/SessionDebugFlights";
import FlashcardsWidgetWhiteTheme from "../../components/FlashcardsWidgetWhiteTheme";
import { FlashcardsWidgetRef } from "../../components/FlashcardsWidget";
import FlightsWidget from "../../components/FlightsWidget";
import ItineraryWidget from "../../components/ItineraryWidget";
import OnboardingModalWhite from "../../components/auth/OnboardingModalWhite";
import { getSessionId } from "../../utils/sessionManager";

type SectionType =
  | "flights"
  | "dashboard"
  | "chat"
  | "explore"
  | "itinerary"
  | "friends";

export default function FlightsPageAuthenticated() {
  const { currentUser, logout, showOnboarding, setShowOnboarding } = useAuth();
  const router = useRouter();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [tripType, setTripType] = useState<
    "oneWay" | "roundTrip" | "multicity"
  >("oneWay");
  const [travellers, setTravellers] = useState(1);
  const [travelClass, setTravelClass] = useState("Economy");
  const [activeSection, setActiveSection] = useState<SectionType>("dashboard");

  // Auto-focus chat input when switching to chat section
  useEffect(() => {
    if (activeSection === "chat" && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300); // Delay to allow for smooth transition
    }
  }, [activeSection]);

  // Chat state
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      content: string;
      role: "user" | "assistant";
      timestamp: Date;
    }>
  >([]);
  const [chatInput, setChatInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showFlights, setShowFlights] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const flashcardsRef = useRef<FlashcardsWidgetRef>(null);

  // Session management - for authenticated users, always use Firebase UID
  const [sessionId, setSessionId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

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

  // Initialize session for authenticated user
  useEffect(() => {
    if (currentUser) {
      const initializeAuthenticatedSession = () => {
        const newSessionId = getSessionId();
        const authenticatedUserId = currentUser.uid; // Always use Firebase UID

        setSessionId(newSessionId);
        setUserId(authenticatedUserId);

        console.log("Authenticated flights session initialized:", {
          sessionId: newSessionId,
          userId: authenticatedUserId,
          userEmail: currentUser.email,
          isAuthenticated: true,
        });
      };

      initializeAuthenticatedSession();
    }
  }, [currentUser]);

  // Handle session regeneration from debug component
  const handleSessionRegenerated = (
    newSessionId: string,
    newUserId: string
  ) => {
    setSessionId(newSessionId);
    // For authenticated users, userId should always remain the same (Firebase UID)
    // but we'll update it anyway in case the debug component passes it
    setUserId(currentUser?.uid || newUserId);

    console.log("Authenticated session regenerated:", {
      sessionId: newSessionId,
      userId: currentUser?.uid || newUserId,
      userEmail: currentUser?.email,
    });
  };

  // Sample data for dashboard
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

  const [dashboardChatInput, setDashboardChatInput] = useState("");
  const [convertAmount, setConvertAmount] = useState("1500");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [convertedAmount, setConvertedAmount] = useState("1275.53");

  // Chat functions
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    // Auto-focus the textarea after messages update
    if (textareaRef.current && !isLoading) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [messages, isLoading]);

  // Retry function for API calls when message is empty (same as dashboard)
  const makeAPICallWithRetry = async (
    currentInput: string,
    maxRetries: number = 5
  ): Promise<any> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log("Request timeout after 10 minutes");
          controller.abort();
        }, 600000);

        console.log(`Making API call (attempt ${attempt}/${maxRetries})...`);

        const response = await fetch("https://agent-bigfit-api.com/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            session_id: sessionId,
            message: currentInput,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log("FastAPI Request sent:", {
          user_id: userId,
          session_id: sessionId,
          message: currentInput,
        });
        console.log("FastAPI Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("FastAPI Error Response:", errorText);
          throw new Error(
            `FastAPI error! status: ${response.status}, message: ${errorText}`
          );
        }

        const data = await response.json();
        console.log("FastAPI Response:", data);

        if (!data.message || data.message.trim() === "") {
          console.log(
            `Empty message received on attempt ${attempt}/${maxRetries}`
          );

          if (attempt === maxRetries) {
            console.log("Max retries reached, returning empty response");
            return data;
          }

          console.log(`Retrying... (attempt ${attempt + 1}/${maxRetries})`);
          continue;
        }

        console.log(`Success on attempt ${attempt}/${maxRetries}`);
        return data;
      } catch (error) {
        console.error(`Error on attempt ${attempt}/${maxRetries}:`, error);

        if (attempt === maxRetries) {
          throw error;
        }

        console.log(
          `Retrying after error... (attempt ${attempt + 1}/${maxRetries})`
        );
      }
    }

    throw new Error("Unexpected end of retry function");
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    if (!sessionId || !userId) {
      console.error("Session not initialized yet");
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      content: chatInput.trim(),
      role: "user" as const,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = chatInput.trim();
    setChatInputText("");
    setIsLoading(true);

    try {
      const data = await makeAPICallWithRetry(currentInput, 5);

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content:
          data.message ||
          "Sorry, I couldn't process your request. Please try again.",
        role: "assistant" as const,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error calling FastAPI:", error);

      let errorContent =
        "I'm sorry, I'm having trouble connecting right now. Please try again.";

      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request aborted due to timeout");
        errorContent =
          "Request timeout - The AI is taking longer than expected. Please try again.";
      } else if (
        error instanceof TypeError &&
        error.message.includes("fetch")
      ) {
        console.error("Network error - possibly CORS or connectivity issue");
        errorContent =
          "Network error - Unable to connect to AI service. Please check your internet connection and try again.";
      } else if (error instanceof Error) {
        errorContent = `Connection error: ${error.message}. Please try again.`;
      }

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        role: "assistant" as const,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = newHeight + "px";
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight();
    }
  }, [chatInput]);

  // Debug toggle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        setShowDebug((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const nudges = [
    "Plan a 7-day trip to Japan",
    "Best restaurants in Paris",
    "Budget backpacking through Europe",
    "Family vacation ideas for summer",
  ];

  if (!currentUser) {
    return null; // This shouldn't happen due to the parent component's validation
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <MdFlight className="text-blue-500 text-2xl transform rotate-45" />
            <div className="ml-2">
              <div className="text-blue-600 font-bold text-base leading-tight">
                ItinerAI
              </div>
              <div className="text-[8px] text-gray-500 -mt-0.5">
                Your AI Travel Companion
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Header - Clean */}
        <div className="p-4 border-b border-gray-200">
          <div className="h-4"></div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            MAIN
          </h4>
          <div className="space-y-1">
            <SidebarButton
              icon={<MdHome className="w-4 h-4" />}
              text="Dashboard"
              active={(activeSection as string) === "dashboard"}
              onClick={() => setActiveSection("dashboard")}
            />
            <SidebarButton
              icon={<MdChat className="w-4 h-4" />}
              text="Chat"
              active={activeSection === "chat"}
              onClick={() => setActiveSection("chat")}
            />
            <SidebarButton
              icon={<MdFlight className="w-4 h-4" />}
              text="Flights"
              active={activeSection === "flights"}
              onClick={() => setActiveSection("flights")}
            />
          </div>

          {/* Discover Section */}
          <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-2">
            DISCOVER
          </h4>
          <div className="space-y-1">
            <SidebarButton
              icon={<MdExplore className="w-4 h-4" />}
              text="Explore"
              active={activeSection === "explore"}
              onClick={() => setActiveSection("explore")}
            />
            <SidebarButton
              icon={<MdBook className="w-4 h-4" />}
              text="Itinerary"
              active={activeSection === "itinerary"}
              onClick={() => setActiveSection("itinerary")}
              badge="NEW!"
            />
            <SidebarButton
              icon={<MdPeople className="w-4 h-4" />}
              text="Friends"
              active={activeSection === "friends"}
              onClick={() => setActiveSection("friends")}
            />
          </div>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-all"
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
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white min-h-0">
        {/* Conditional rendering based on active section */}
        <div className="flex-1 flex flex-col min-h-0 transition-all duration-500 ease-in-out">
          {activeSection === "dashboard" ? (
            // Dashboard Content
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
                      <div className="relative profile-dropdown">
                        <button
                          onClick={() =>
                            setShowProfileDropdown(!showProfileDropdown)
                          }
                          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center overflow-hidden">
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
                          <span className="text-sm text-gray-700 hidden sm:block">
                            {currentUser?.displayName?.split(" ")[0] ||
                              currentUser?.email}
                          </span>
                          <svg
                            className={`w-4 h-4 text-gray-500 transition-transform ${
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
                          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                            <div className="p-4 border-b border-gray-100">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center overflow-hidden">
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
                                  <p className="text-sm font-medium text-gray-900">
                                    {currentUser?.displayName || "User"}
                                  </p>
                                  <p className="text-xs text-gray-500">
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
                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
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
                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
                              <div className="text-gray-500">
                                {trip.duration}
                              </div>
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
                            For your{" "}
                            <span className="text-blue-600">Malaysia</span>{" "}
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
                                    <span className="text-yellow-500 text-xs">
                                      ⭐
                                    </span>
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
                            👤{" "}
                            {currentUser?.displayName?.split(" ")[0] || "User"}
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
                            <p className="font-semibold text-sm text-gray-900">
                              2
                            </p>
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
                              <span className="text-gray-700">
                                {action.label}
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* Chat Input */}
                        <form className="relative mb-2">
                          <input
                            type="text"
                            value={dashboardChatInput}
                            onChange={(e) =>
                              setDashboardChatInput(e.target.value)
                            }
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
                          <span className="text-xs text-gray-700">
                            Voice Input
                          </span>
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
                                <div className="text-gray-500">
                                  {friend.location}
                                </div>
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
                            setConvertAmount(
                              e.target.value.replace(/[^0-9.]/g, "")
                            )
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
          ) : activeSection === "chat" ? (
            // Chat Content - Fixed height container with proper scrolling
            <div className="flex-1 flex flex-col bg-white min-h-0">
              {/* Chat Navigation Bar - Fixed */}
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

                    {/* Right Side - Places Toggle, Flights Toggle, Itinerary Toggle, Debug Toggle, and Status */}
                    <div className="flex items-center space-x-3">
                      {/* Places Toggle */}
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Places</span>
                        <button
                          onClick={() => {
                            setShowFlashcards(!showFlashcards);
                            if (showFlashcards) {
                              setSelectedTrip(null);
                              if (flashcardsRef.current) {
                                flashcardsRef.current.clearSelection();
                              }
                            }
                            // Close other widgets if opening places
                            if (!showFlashcards) {
                              setShowFlights(false);
                              setShowItinerary(false);
                            }
                          }}
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
                          onClick={() => {
                            setShowFlights(!showFlights);
                            // Close other widgets if opening flights
                            if (!showFlights) {
                              setShowFlashcards(false);
                              setShowItinerary(false);
                              setSelectedTrip(null);
                              if (flashcardsRef.current) {
                                flashcardsRef.current.clearSelection();
                              }
                            }
                          }}
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
                          onClick={() => {
                            setShowItinerary(!showItinerary);
                            // Close other widgets if opening itinerary
                            if (!showItinerary) {
                              setShowFlashcards(false);
                              setShowFlights(false);
                              setSelectedTrip(null);
                              if (flashcardsRef.current) {
                                flashcardsRef.current.clearSelection();
                              }
                            }
                          }}
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

                      {/* Debug Toggle */}
                      <button
                        onClick={() => setShowDebug(!showDebug)}
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

                      <div className="relative profile-dropdown">
                        <button
                          onClick={() =>
                            setShowProfileDropdown(!showProfileDropdown)
                          }
                          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center overflow-hidden">
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
                          <span className="text-sm text-gray-700 hidden sm:block">
                            {currentUser?.displayName?.split(" ")[0] ||
                              currentUser?.email}
                          </span>
                          <svg
                            className={`w-4 h-4 text-gray-500 transition-transform ${
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
                          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                            <div className="p-4 border-b border-gray-100">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center overflow-hidden">
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
                                  <p className="text-sm font-medium text-gray-900">
                                    {currentUser?.displayName || "User"}
                                  </p>
                                  <p className="text-xs text-gray-500">
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
                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
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
                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"
                                  />
                                </svg>
                                <span>Logout</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </nav>

              {/* Chat Container - Scrollable messages area with fixed input */}
              <div className="flex-1 flex flex-col min-h-0">
                {showItinerary ? (
                  // ItineraryWidget - Full Screen (no chat input visible)
                  <div className="flex-1 overflow-hidden">
                    <ItineraryWidget
                      isVisible={showItinerary}
                      onToggle={() => {
                        setShowItinerary(false);
                      }}
                      onOpenChat={() => {
                        setShowItinerary(false);
                        setTimeout(() => {
                          if (textareaRef.current) {
                            textareaRef.current.focus();
                          }
                        }, 100);
                      }}
                    />
                  </div>
                ) : (
                  <>
                    {/* Messages Container - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="max-w-4xl mx-auto h-full">
                        {showFlights ? (
                          // FlightsWidget
                          <div className="h-full flex flex-col relative">
                            {/* FlightsWidget Container */}
                            <div className="flex-1 min-h-0 overflow-hidden">
                              <FlightsWidget
                                isVisible={showFlights}
                                onToggle={() => {
                                  setShowFlights(false);
                                }}
                              />
                            </div>
                          </div>
                        ) : showFlashcards ? (
                          // FlashcardsWidget with white/blue theme
                          <div className="h-full flex flex-col relative">
                            {/* FlashcardsWidget Container */}
                            <div className="flex-1 min-h-0 bg-white rounded-xl border border-blue-200 overflow-hidden shadow-lg">
                              <FlashcardsWidgetWhiteTheme
                                ref={flashcardsRef}
                                isVisible={showFlashcards}
                                onToggle={() => {
                                  setShowFlashcards(false);
                                  setSelectedTrip(null);
                                }}
                                rightPanelCollapsed={true}
                                onTripSelect={setSelectedTrip}
                              />
                            </div>
                          </div>
                        ) : messages.length === 0 ? (
                          // Welcome Screen
                          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                            <div className="text-center mb-6">
                              <div className="relative w-16 h-16 mx-auto mb-4">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl rotate-6 animate-pulse opacity-20"></div>
                                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                  <MdChat className="text-white text-3xl" />
                                </div>
                              </div>
                              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                How can I help you today?
                              </h2>
                              <p className="text-gray-500 text-sm">
                                Ask me anything about your travel plans or use
                                the toggles above
                              </p>
                            </div>

                            {/* Nudges */}
                            <div className="w-full max-w-2xl px-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {nudges.map((nudge, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setChatInputText(nudge)}
                                    className="px-4 py-3 text-sm text-left text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 hover:shadow-md transition-all group"
                                  >
                                    <span className="text-blue-600 group-hover:text-blue-700 mr-2">
                                      →
                                    </span>
                                    {nudge}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Messages
                          <div className="space-y-6 pb-4">
                            {messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex items-start gap-3 ${
                                  message.role === "user"
                                    ? "flex-row-reverse"
                                    : "flex-row"
                                }`}
                              >
                                {/* Avatar */}
                                <div
                                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                    message.role === "user"
                                      ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-md"
                                      : "bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300"
                                  }`}
                                >
                                  {message.role === "user" ? (
                                    currentUser?.photoURL ? (
                                      <img
                                        src={currentUser.photoURL}
                                        alt="Profile"
                                        className="w-full h-full object-cover rounded-full"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <span className="text-white text-sm font-medium">
                                        {currentUser?.displayName?.charAt(0) ||
                                          currentUser?.email?.charAt(0) ||
                                          "U"}
                                      </span>
                                    )
                                  ) : (
                                    <MdChat className="text-gray-600 text-sm" />
                                  )}
                                </div>

                                {/* Message Content */}
                                <div
                                  className={`max-w-[70%] ${
                                    message.role === "user"
                                      ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg"
                                      : "bg-white text-gray-900 border border-gray-200 shadow-sm"
                                  } rounded-2xl px-4 py-3`}
                                >
                                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                    {message.content}
                                  </p>
                                </div>
                              </div>
                            ))}

                            {/* Enhanced Loading indicator */}
                            {isLoading && (
                              <div className="flex items-start gap-3">
                                {/* AI Avatar */}
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center">
                                  <MdChat className="text-gray-600 text-sm" />
                                </div>

                                {/* Loading Animation */}
                                <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-3 min-w-[120px]">
                                  <div className="flex items-center space-x-2">
                                    {/* Gradient animated dots */}
                                    <div className="flex items-center space-x-1">
                                      <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-bounce"></div>
                                      <div
                                        className="w-2 h-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full animate-bounce"
                                        style={{ animationDelay: "0.2s" }}
                                      ></div>
                                      <div
                                        className="w-2 h-2 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full animate-bounce"
                                        style={{ animationDelay: "0.4s" }}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-gray-500 ml-2">
                                      Thinking...
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div ref={messagesEndRef} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chat Input - Fixed at bottom, no shifting */}
                    <div className="flex-shrink-0 bg-gradient-to-t from-white to-blue-50/20 border-t border-blue-100 px-6 py-4 relative">
                      {/* Selected Trip Snippet - Floating above chat */}
                      {selectedTrip && showFlashcards && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-full max-w-md px-6 z-10 animate-slideUp">
                          <div className="p-3 bg-white border-2 border-blue-400 rounded-xl shadow-2xl backdrop-blur-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-blue-900 text-xs truncate">
                                  Selected: {selectedTrip.trip_title}
                                </h3>
                                <p className="text-blue-700 text-[10px]">
                                  {selectedTrip.no_of_days} days • $
                                  {selectedTrip.estimated_budget}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedTrip(null);
                                  if (flashcardsRef.current) {
                                    flashcardsRef.current.clearSelection();
                                  }
                                }}
                                className="ml-2 w-6 h-6 flex items-center justify-center text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all text-sm flex-shrink-0"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="max-w-4xl mx-auto">
                        <form onSubmit={handleChatSubmit} className="relative">
                          <div className="flex items-end gap-2 bg-white rounded-2xl border-2 border-gray-200 p-2 focus-within:border-blue-400 focus-within:shadow-lg transition-all">
                            <textarea
                              ref={textareaRef}
                              value={chatInput}
                              onChange={(e) => setChatInputText(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder={
                                showItinerary
                                  ? "Ask about your itinerary..."
                                  : showFlights
                                  ? "Ask about flights..."
                                  : showFlashcards
                                  ? `Ask about ${
                                      selectedTrip
                                        ? selectedTrip.trip_title
                                        : "places"
                                    }...`
                                  : "Ask me anything about your travel..."
                              }
                              className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 resize-none outline-none min-h-[20px] max-h-[120px] text-sm leading-relaxed py-2 px-2 focus-ring"
                              rows={1}
                              disabled={isLoading}
                            />
                            <button
                              type="submit"
                              disabled={!chatInput.trim() || isLoading}
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-xl px-5 py-2 transition-all flex-shrink-0 font-medium text-sm shadow-md hover:shadow-lg disabled:shadow-none flex items-center gap-2"
                            >
                              <span>Send</span>
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
                                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                              </svg>
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Press{" "}
                            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                              Enter
                            </kbd>{" "}
                            to send,{" "}
                            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                              Shift + Enter
                            </kbd>{" "}
                            for new line
                          </p>
                        </form>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            // Flights Content (same as non-authenticated version)
            <div className="flex-1 flex flex-col min-h-0">
              {/* Top Navigation Bar - Fixed */}
              <nav className="bg-white border-b border-gray-200 flex-shrink-0 z-10">
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    {/* Left Side - Empty for flights */}
                    <div></div>

                    {/* Right Side - User Profile */}
                    <div className="flex items-center space-x-3 ml-auto">
                      <div className="relative profile-dropdown">
                        <button
                          onClick={() =>
                            setShowProfileDropdown(!showProfileDropdown)
                          }
                          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center overflow-hidden">
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
                          <span className="text-sm text-gray-700 hidden sm:block">
                            {currentUser?.displayName?.split(" ")[0] ||
                              currentUser?.email}
                          </span>
                          <svg
                            className={`w-4 h-4 text-gray-500 transition-transform ${
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
                          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                            <div className="p-4 border-b border-gray-100">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center overflow-hidden">
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
                                  <p className="text-sm font-medium text-gray-900">
                                    {currentUser?.displayName || "User"}
                                  </p>
                                  <p className="text-xs text-gray-500">
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
                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
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
                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
                    </div>
                  </div>
                </div>
              </nav>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto">
                {/* Search Section */}
                <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 py-8">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Trip Type Selector */}
                    <div className="flex items-center space-x-4 mb-6">
                      <TripTypeButton
                        active={tripType === "oneWay"}
                        onClick={() => setTripType("oneWay")}
                      >
                        One Way
                      </TripTypeButton>
                      <TripTypeButton
                        active={tripType === "roundTrip"}
                        onClick={() => setTripType("roundTrip")}
                      >
                        Round Trip
                      </TripTypeButton>
                      <TripTypeButton
                        active={tripType === "multicity"}
                        onClick={() => setTripType("multicity")}
                      >
                        Multicity
                      </TripTypeButton>
                    </div>

                    {/* Search Lowest Price Header */}
                    <div className="text-right mb-3">
                      <h2 className="text-white text-xl font-semibold">
                        Search Lowest Price
                      </h2>
                    </div>

                    {/* Search Form */}
                    <div className="bg-white rounded-lg p-4 shadow-lg">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {/* From */}
                        <div className="relative">
                          <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">
                            FROM
                          </label>
                          <div className="flex items-center">
                            <MdFlight
                              className="text-gray-400 mr-2"
                              size={16}
                            />
                            <div className="flex-1">
                              <div className="text-lg font-bold text-gray-900">
                                Delhi
                              </div>
                              <div className="text-[10px] text-gray-500">
                                [DEL] Indira Gandhi International Airport
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Swap Button */}
                        <div className="flex items-center justify-center">
                          <button className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
                            <svg
                              className="w-5 h-5 text-gray-600"
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

                        {/* To */}
                        <div className="relative">
                          <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">
                            TO
                          </label>
                          <div className="flex items-center">
                            <MdFlight
                              className="text-gray-400 mr-2 transform rotate-90"
                              size={16}
                            />
                            <div className="flex-1">
                              <div className="text-lg font-bold text-gray-900">
                                Mumbai
                              </div>
                              <div className="text-[10px] text-gray-500">
                                [BOM] Chhatrapati Shivaji International A...
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Departure Date */}
                        <div className="relative">
                          <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">
                            DEPARTURE DATE
                          </label>
                          <div className="flex items-center">
                            <FiCalendar
                              className="text-gray-400 mr-2"
                              size={16}
                            />
                            <div className="flex-1">
                              <div className="text-2xl font-bold text-gray-900">
                                24
                              </div>
                              <div className="text-[10px] text-gray-500">
                                Oct 2025
                              </div>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">
                            Friday
                          </div>
                        </div>

                        {/* Return Date */}
                        <div className="relative">
                          <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">
                            RETURN DATE
                          </label>
                          <div className="flex items-center text-gray-400">
                            <span className="text-xs">Book a round trip</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">
                            to save more
                          </div>
                        </div>
                      </div>

                      {/* Traveller & Class + Search Button */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <FiUser className="text-gray-500" size={16} />
                            <button className="flex items-center space-x-1 hover:text-blue-600">
                              <span className="font-medium">
                                {travellers} Traveller
                              </span>
                              <FiChevronDown size={14} />
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="flex items-center space-x-1 hover:text-blue-600">
                              <span className="font-medium">{travelClass}</span>
                              <FiChevronDown size={14} />
                            </button>
                          </div>
                        </div>

                        <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-12 py-3 rounded-md transition-colors">
                          SEARCH
                        </button>
                      </div>
                    </div>

                    {/* Special Fares */}
                    <div className="mt-4 flex items-center space-x-6">
                      <span className="text-white text-sm font-medium">
                        Special Fares (Optional):
                      </span>
                      <div className="flex items-center space-x-6">
                        <SpecialFareCheckbox label="Defence Forces" />
                        <SpecialFareCheckbox label="Students" />
                        <SpecialFareCheckbox label="Senior Citizens" />
                        <SpecialFareCheckbox label="Doctors Nurses" />
                      </div>
                      <div className="flex-1"></div>
                      <label className="flex items-center space-x-2 text-white text-sm">
                        <input type="checkbox" className="rounded" />
                        <span>Book Hotel & Get up to 45% OFF*</span>
                      </label>
                    </div>

                    {/* Discover More Button */}
                    <div className="mt-4">
                      <button className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-5 py-2 rounded-md border border-white/30 transition-colors">
                        DISCOVER MORE
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Links Section */}
                <div className="bg-white py-6 border-b border-gray-200">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between overflow-x-auto">
                      <QuickLink
                        icon={<MdFlight size={20} />}
                        text="Best Flight Deals"
                      />
                      <QuickLink
                        icon={<MdTrain size={20} />}
                        text="Metro"
                        badge="NEW"
                      />
                      <QuickLink
                        icon={<MdCardGiftcard size={20} />}
                        text="Gift Cards"
                      />
                      <QuickLink
                        icon={<MdLocalTaxi size={20} />}
                        text="Forex Cash & Cards"
                      />
                      <QuickLink
                        icon={<MdBeachAccess size={20} />}
                        text="EMT Airport Experience"
                      />
                      <QuickLink
                        icon={<MdCardGiftcard size={20} />}
                        text="EMT Cards"
                      />
                      <QuickLink
                        icon={<MdHotel size={20} />}
                        text="EasyDarshan"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SessionDebug Component */}
      {activeSection === "chat" && (
        <SessionDebugFlights
          isVisible={showDebug}
          onClose={() => setShowDebug(false)}
          onSessionRegenerated={handleSessionRegenerated}
        />
      )}

      {/* Onboarding Modal */}
      {currentUser && (
        <OnboardingModalWhite
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          userId={currentUser.uid}
        />
      )}
    </div>
  );
}

// TripTypeButton Component
function TripTypeButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
        active
          ? "bg-white text-blue-600"
          : "bg-white/20 text-white hover:bg-white/30"
      }`}
    >
      {children}
    </button>
  );
}

// SpecialFareCheckbox Component
function SpecialFareCheckbox({ label }: { label: string }) {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="radio"
        name="specialFare"
        className="w-4 h-4 text-blue-600 bg-white border-white focus:ring-blue-500"
      />
      <span className="text-white text-sm">{label}</span>
    </label>
  );
}

// QuickLink Component
function QuickLink({
  icon,
  text,
  badge,
}: {
  icon: React.ReactNode;
  text: string;
  badge?: string;
}) {
  return (
    <div className="flex flex-col items-center space-y-2 cursor-pointer group">
      <div className="relative">
        <div className="text-gray-600 group-hover:text-blue-600 transition-colors">
          {icon}
        </div>
        {badge && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs text-gray-700 group-hover:text-blue-600 transition-colors text-center">
        {text}
      </span>
    </div>
  );
}

// SidebarButton Component
function SidebarButton({
  icon,
  text,
  active = false,
  onClick,
  badge,
}: {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 ${
        active
          ? "bg-blue-50 text-blue-600 border border-blue-200 shadow-md"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
      }`}
    >
      {icon}
      <span className="text-xs flex-1 text-left">{text}</span>
      {badge && (
        <span className="ml-auto bg-purple-600 text-white text-[9px] px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}
