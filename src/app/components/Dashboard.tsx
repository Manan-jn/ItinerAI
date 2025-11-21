"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import TabPanel from "../../../temp_non_flights_code/unused_components/TabPanel";
import ProcessingIndicator from "../../../temp_non_flights_code/unused_components/ProcessingIndicator";
import APILoader from "../../../temp_non_flights_code/unused_components/APILoader";
import SessionDebug from "../../../temp_non_flights_code/unused_components/SessionDebug";
import FlashcardsWidget from "./FlashcardsWidget";
import type { FlashcardsWidgetRef } from "./flashcards/types";
import ConveyanceWidget from "../../../temp_non_flights_code/unused_components/ConveyanceWidget";
import { getSessionId, getUserId } from "../utils/sessionManager";
import { updateMemoryOnSessionChange } from "../utils/memoryApi";
import { ChatMessage } from "./chat/ChatMessage";
import {
  TripDetailsContent,
  ItineraryContent,
  PreferencesContent,
  BookmarksContent,
  WeatherContent,
  HistoryContent,
  DatesContent,
  PeopleContent,
  BudgetContent,
  PlacesContent,
} from "../../../temp_non_flights_code/unused_components/TabContents";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  metadata?: {
    selectedTrip?: {
      trip_title: string;
      no_of_days: number;
      estimated_budget: number;
    };
    suggestedTrips?: Array<{
      trip_title: string;
      no_of_days: number;
      estimated_budget: number;
      image?: string;
      theme?: string[];
      themes?: string[];
      best_time_to_visit?: string;
    }>;
  };
}

interface APIResponse {
  message?: {
    message?: string;
    response_type?: string;
    trips?: any[];
  };
  [key: string]: unknown;
}

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingResponse, setPendingResponse] = useState<Message | null>(null);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [chatMaxWidth, setChatMaxWidth] = useState("95%");
  const [showDebug, setShowDebug] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showConveyance, setShowConveyance] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [isTripSelected, setIsTripSelected] = useState(false);
  const [tripsData, setTripsData] = useState<any[]>([]);

  // Session management
  const [sessionId, setSessionId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isFirstMessage, setIsFirstMessage] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const flashcardsRef = useRef<FlashcardsWidgetRef>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleProcessingComplete = () => {
    if (pendingResponse) {
      setMessages((prev) => [...prev, pendingResponse]);
      setPendingResponse(null);
    }
  };

  // Initialize session IDs on component mount
  useEffect(() => {
    const initializeSession = () => {
      const newSessionId = getSessionId();
      const newUserId = getUserId();

      setSessionId(newSessionId);
      setUserId(newUserId);

      console.log("Session initialized:", {
        sessionId: newSessionId,
        userId: newUserId,
      });
    };

    initializeSession();

    // Auto-focus textarea on component mount
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 500);
  }, []);

  useEffect(() => {
    scrollToBottom();
    // Auto-focus the textarea after messages update
    if (textareaRef.current && !isLoading) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [messages, isLoading]);

  // Calculate optimal chat width based on available space
  useEffect(() => {
    const calculateChatWidth = () => {
      if (typeof window !== "undefined") {
        const availableWidth =
          window.innerWidth -
          (isRightPanelCollapsed ? 0 : rightPanelWidth) -
          32;
        const optimalWidth = Math.min(
          availableWidth * 0.95,
          Math.max(600, availableWidth - 100)
        );
        setChatMaxWidth(`${optimalWidth}px`);
      }
    };

    if (isResizing) {
      requestAnimationFrame(calculateChatWidth);
    } else {
      calculateChatWidth();
    }

    const handleResize = () => {
      if (!isResizing) {
        calculateChatWidth();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [rightPanelWidth, isRightPanelCollapsed, isResizing]);

  // Simple API call function
  const makeAPICall = async (currentInput: string): Promise<APIResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("Request timeout after 2 minutes");
      controller.abort();
    }, 600000); // 2 minutes timeout

    try {
      console.log("Making API call...");

      const response = await fetch("/api/chat", {
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

      console.log("API Request sent:", {
        userId,
        sessionId,
        message: currentInput,
      });
      console.log("API Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        throw new Error(
          errorData.error || `API error! status: ${response.status}`
        );
      }

      const data: APIResponse = await response.json();
      console.log("API Response received:", data);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!sessionId || !userId) {
      console.error("Session not initialized yet");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    if (!hasStartedChat) {
      setHasStartedChat(true);
    }

    try {
      // Update memory before first message if this is the first message
      if (isFirstMessage && currentUser) {
        console.log(
          "First message detected, updating memory before sending..."
        );
        try {
          await updateMemoryOnSessionChange(
            userId,
            sessionId,
            currentUser.displayName,
            currentUser.email
          );
          console.log("Memory updated successfully for first message");
        } catch (error) {
          console.error("Failed to update memory for first message:", error);
          // Continue with the message even if memory update fails
        }
        setIsFirstMessage(false);
      }

      const data = await makeAPICall(currentInput);

      // Extract message content
      const messageContent = typeof data.message === 'object'
        ? data.message.message || ""
        : data.message || "";

      // Check if trips data is present
      const hasTripsData = typeof data.message === 'object' &&
                          data.message.response_type === 'trip' &&
                          data.message.trips &&
                          Array.isArray(data.message.trips) &&
                          data.message.trips.length > 0;

      // Extract trips data safely
      const tripsData = hasTripsData && typeof data.message === 'object' ? data.message.trips : [];

      // Create assistant message with trips metadata if available
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          messageContent ||
          "Sorry, I couldn't process your request. Please try again.",
        role: "assistant",
        timestamp: new Date(),
        ...(hasTripsData && tripsData && tripsData.length > 0 && {
          metadata: {
            suggestedTrips: tripsData,
          },
        }),
      };

      setPendingResponse(assistantMessage);

      // Handle trips data if present
      if (hasTripsData && tripsData && tripsData.length > 0) {
        console.log("🎉 Trips data received:", tripsData);
        setTripsData(tripsData);

        // Show flashcards if not already shown
        if (!showFlashcards) {
          setShowFlashcards(true);
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error calling API:", error);

      let errorContent =
        "I'm sorry, I'm having trouble right now. Please try again.";

      if (error instanceof Error && error.name === "AbortError") {
        errorContent = "Request timeout - Please try again.";
      } else if (error instanceof Error) {
        errorContent = `Error: ${error.message}`;
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        role: "assistant",
        timestamp: new Date(),
      };

      setPendingResponse(errorMessage);
      setIsLoading(false);
    }
  };

  const handleNudgeClick = (nudgeText: string) => {
    setInput(nudgeText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        setShowDebug((prev) => !prev);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        showProfileDropdown &&
        !(e.target as Element).closest(".profile-dropdown")
      ) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      requestAnimationFrame(() => {
        const newWidth = window.innerWidth - e.clientX;
        const minWidth = 280;
        const maxWidth = window.innerWidth * 0.6;

        const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
        setRightPanelWidth(clampedWidth);
      });
    },
    [isResizing]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  const toggleRightPanel = () => {
    setIsRightPanelCollapsed(!isRightPanelCollapsed);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const nudges = [
    "Plan a 7-day trip to Japan",
    "Best restaurants in Paris",
    "Budget backpacking through Europe",
    "Family vacation ideas for summer",
  ];

  const initialTabs = [
    {
      id: "trip-details",
      title: "Trip Details",
      content: <TripDetailsContent />,
    },
    {
      id: "dates",
      title: "Dates",
      content: <DatesContent />,
    },
    {
      id: "people",
      title: "People",
      content: <PeopleContent />,
    },
    {
      id: "budget",
      title: "Budget",
      content: <BudgetContent />,
    },
    {
      id: "places",
      title: "Places",
      content: <PlacesContent />,
    },
    {
      id: "itinerary",
      title: "Itinerary",
      content: <ItineraryContent />,
    },
    {
      id: "preferences",
      title: "Preferences",
      content: <PreferencesContent />,
    },
    {
      id: "weather",
      title: "Weather",
      content: <WeatherContent />,
    },
    {
      id: "bookmarks",
      title: "Bookmarks",
      content: <BookmarksContent />,
    },
    {
      id: "history",
      title: "History",
      content: <HistoryContent />,
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-md bg-black/20 border-b border-white/10 flex-shrink-0">
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
            <h1 className="text-xl font-semibold text-white transition-all duration-300">
              ItinerAI
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Debug Toggle Slider */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Debug</span>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showDebug
                    ? "bg-blue-500/30 border-blue-400/50"
                    : "bg-gray-700/50 border-gray-600/50"
                } border backdrop-blur-sm`}
                title="Toggle Debug Info (Ctrl/Cmd + D)"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                    showDebug ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Flashcards Toggle Slider */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Places</span>
              <button
                onClick={() => {
                  setShowFlashcards(!showFlashcards);
                  if (!showFlashcards) setShowConveyance(false);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showFlashcards
                    ? "bg-purple-500/30 border-purple-400/50"
                    : "bg-gray-700/50 border-gray-600/50"
                } border backdrop-blur-sm`}
                title="Toggle Places Explorer"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                    showFlashcards ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Conveyance Toggle Slider */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Travel</span>
              <button
                onClick={() => {
                  setShowConveyance(!showConveyance);
                  if (!showConveyance) setShowFlashcards(false);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showConveyance
                    ? "bg-orange-500/30 border-orange-400/50"
                    : "bg-gray-700/50 border-gray-600/50"
                } border backdrop-blur-sm`}
                title="Toggle Travel Booking"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                    showConveyance ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Panel Toggle Button */}
            <button
              onClick={toggleRightPanel}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm ${
                isRightPanelCollapsed
                  ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
                  : "bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white"
              }`}
              title={isRightPanelCollapsed ? "Show Sidebar" : "Hide Sidebar"}
            >
              <svg
                className={`w-4 h-4 transition-all duration-300 ${
                  isRightPanelCollapsed ? "rotate-180" : "rotate-0"
                }`}
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
              <span className="text-xs">
                {isRightPanelCollapsed ? "Show" : "Hide"}
              </span>
            </button>

            {/* Profile Dropdown */}
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
                <div className="absolute right-0 mt-2 w-64 backdrop-blur-xl bg-black/80 border border-white/20 rounded-xl shadow-2xl z-50">
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
                        router.push("/");
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
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      <span>Home</span>
                    </button>

                    <button
                      onClick={() => {
                        router.push("/settings");
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

                    <div className="border-t border-white/10 my-2"></div>

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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div
        className={`relative z-0 flex-1 flex min-h-0 ${
          isResizing ? "resizing-mode" : ""
        }`}
      >
        {/* Chat Area */}
        <div
          className={`flex-1 min-h-0 flex flex-col ${
            isResizing ? "" : "transition-all duration-500 ease-in-out"
          }`}
        >
          <div
            className={`w-full h-full flex flex-col min-h-0 ${
              showFlashcards || showConveyance ? "px-2 py-2" : "px-4 py-2"
            } mx-auto ${
              hasStartedChat && !showFlashcards && !showConveyance
                ? ""
                : showFlashcards || showConveyance
                ? ""
                : "max-w-2xl"
            } ${isResizing ? "" : "transition-all duration-500 ease-out"}`}
            style={{
              maxWidth:
                showFlashcards || showConveyance
                  ? isRightPanelCollapsed
                    ? "calc(100vw - 80px)"
                    : chatMaxWidth
                  : hasStartedChat
                  ? chatMaxWidth
                  : "32rem",
            }}
          >
            {/* Welcome Screen, Messages Container, Flashcards Widget, or Conveyance Widget */}
            {showFlashcards ? (
              /* Flashcards Widget with Chat Input Below */
              <>
                <div className="flex-1 flex flex-col justify-start w-full min-h-0 pt-4">
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <FlashcardsWidget
                      ref={flashcardsRef}
                      isVisible={showFlashcards}
                      onToggle={() => {
                        setShowFlashcards(false);
                        setSelectedTrip(null);
                      }}
                      rightPanelCollapsed={isRightPanelCollapsed}
                      onTripSelect={(trip) => {
                        setSelectedTrip(trip);
                        setIsTripSelected(trip !== null);
                      }}
                      trips={tripsData.length > 0 ? tripsData : undefined}
                    />
                  </div>
                  {/* Chat Input Below Flashcards */}
                  <div className="flex-shrink-0 pt-4 pb-4 px-4">
                    {/* Selected Trip Snippet - Half width and smaller */}
                    {selectedTrip && (
                      <div className="mb-3 w-1/2">
                        <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700/50 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
                            <img
                              src={selectedTrip.image}
                              alt={selectedTrip.trip_title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-xs truncate">
                              {selectedTrip.trip_title}
                            </h4>
                            <p className="text-gray-400 text-xs">
                              {selectedTrip.no_of_days}d • $
                              {selectedTrip.estimated_budget}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedTrip(null);
                              setIsTripSelected(false);
                              flashcardsRef.current?.clearSelection();
                            }}
                            className="w-6 h-6 rounded-md bg-gray-700/50 hover:bg-red-500/20 border border-gray-600/50 hover:border-red-500/40 flex items-center justify-center transition-colors flex-shrink-0"
                            aria-label="Remove trip snippet"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="relative">
                      <div className="flex items-end gap-2 bg-gray-900 rounded-lg border border-gray-800 p-2 focus-within:border-gray-700 transition-colors">
                        <textarea
                          ref={textareaRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={
                            selectedTrip
                              ? `Selected: ${selectedTrip.trip_title}`
                              : "Message ItinerAI..."
                          }
                          className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none min-h-[20px] max-h-[120px] text-sm leading-relaxed py-1 focus-ring"
                          rows={1}
                          disabled={isLoading || selectedTrip !== null}
                          readOnly={selectedTrip !== null}
                        />
                        <button
                          type="submit"
                          disabled={
                            isLoading || (!isTripSelected && !input.trim())
                          }
                          className="bg-white hover:bg-gray-200 disabled:bg-gray-700 disabled:cursor-not-allowed text-black disabled:text-gray-500 rounded p-1.5 transition-colors flex-shrink-0"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="transform rotate-90"
                          >
                            <path
                              d="M7 11L12 6L17 11M12 18V7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            ) : showConveyance ? (
              /* Conveyance Widget with Chat Input Below */
              <>
                <div className="flex-1 flex flex-col justify-start w-full min-h-0 pt-4">
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <ConveyanceWidget
                      isVisible={showConveyance}
                      onToggle={() => setShowConveyance(false)}
                      rightPanelCollapsed={isRightPanelCollapsed}
                    />
                  </div>
                  {/* Chat Input Below Conveyance */}
                  <div className="flex-shrink-0 pt-4 pb-4 px-4">
                    <form onSubmit={handleSubmit} className="relative">
                      <div className="flex items-end gap-2 bg-gray-900 rounded-lg border border-gray-800 p-2 focus-within:border-gray-700 transition-colors">
                        <textarea
                          ref={textareaRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Message ItinerAI..."
                          className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none min-h-[20px] max-h-[120px] text-sm leading-relaxed py-1 focus-ring"
                          rows={1}
                          disabled={isLoading}
                        />
                        <button
                          type="submit"
                          disabled={!input.trim() || isLoading}
                          className="bg-white hover:bg-gray-200 disabled:bg-gray-700 disabled:cursor-not-allowed text-black disabled:text-gray-500 rounded p-1.5 transition-colors flex-shrink-0"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="transform rotate-90"
                          >
                            <path
                              d="M7 11L12 6L17 11M12 18V7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-center mb-8">
                  {/* Animated Profile Circle */}
                  {currentUser?.photoURL && (
                    <div className="mb-6 flex justify-center">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full flex items-center justify-center overflow-hidden backdrop-blur-sm border border-white/10 animate-fade-in-scale">
                          <img
                            src={currentUser.photoURL}
                            alt="Profile"
                            className="w-full h-full object-cover rounded-full"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        {/* Subtle glow effect */}
                        <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-blue-400/10 to-purple-500/10 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  )}
                  <h2 className="text-3xl font-light text-white mb-3">
                    Welcome back,{" "}
                    {currentUser?.displayName?.split(" ")[0] || "Traveler"}!
                  </h2>
                  <p className="text-gray-400 text-base">
                    Ready to plan your next adventure?
                  </p>
                </div>
              </div>
            ) : (
              /* Messages Container - Scrollable */
              <div className="flex-1 overflow-y-auto space-y-4 py-4 min-h-0 mb-4 custom-scrollbar">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`message-enter-active ${
                      index === messages.length - 1 &&
                      message.role === "assistant"
                        ? "message-appear"
                        : ""
                    }`}
                  >
                    <ChatMessage message={message} currentUser={currentUser} />
                  </div>
                ))}

                <APILoader
                  isVisible={isLoading}
                  onComplete={handleProcessingComplete}
                />

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Nudges - only show when no messages and widgets not visible */}
            {messages.length === 0 && !showFlashcards && !showConveyance && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  {nudges.map((nudge, index) => (
                    <button
                      key={index}
                      onClick={() => handleNudgeClick(nudge)}
                      className="px-3 py-1.5 text-xs text-gray-400 bg-gray-900 border border-gray-800 rounded-full hover:border-gray-700 hover:text-gray-300 transition-colors"
                    >
                      {nudge}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form - hide when widgets are visible */}
            {!showFlashcards && !showConveyance && (
              <div className="flex-shrink-0 pb-4">
                <form onSubmit={handleSubmit} className="relative">
                  <div className="flex items-end gap-2 bg-gray-900 rounded-lg border border-gray-800 p-2 focus-within:border-gray-700 transition-colors">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Message ItinerAI..."
                      className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none min-h-[20px] max-h-[120px] text-sm leading-relaxed py-1 focus-ring"
                      rows={1}
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="bg-white hover:bg-gray-200 disabled:bg-gray-700 disabled:cursor-not-allowed text-black disabled:text-gray-500 rounded p-1.5 transition-colors flex-shrink-0"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="transform rotate-90"
                      >
                        <path
                          d="M7 11L12 6L17 11M12 18V7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel Container */}
        <div
          className={`flex-shrink-0 min-h-0 relative overflow-hidden ${
            isRightPanelCollapsed ? "w-0 opacity-0" : ""
          } ${
            isResizing
              ? "resize-in-progress"
              : "transition-all duration-500 ease-out"
          }`}
          style={{
            width: isRightPanelCollapsed ? "0px" : `${rightPanelWidth}px`,
          }}
        >
          <div
            className={`h-full ${
              isRightPanelCollapsed
                ? "transform translate-x-full"
                : "transform translate-x-0"
            } ${
              isResizing ? "" : "transition-transform duration-500 ease-out"
            }`}
            style={{ width: `${rightPanelWidth}px` }}
          >
            <div
              className={`resize-handle ${
                isResizing ? "resizing" : ""
              } transition-opacity duration-300 ${
                isRightPanelCollapsed ? "opacity-0" : "opacity-100"
              }`}
              onMouseDown={handleResizeStart}
            />

            <TabPanel initialTabs={initialTabs} />
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      <SessionDebug isVisible={showDebug} onClose={() => setShowDebug(false)} />
    </div>
  );
}
