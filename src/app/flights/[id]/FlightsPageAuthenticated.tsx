"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MdChat, MdExplore } from "react-icons/md";
import { useAuth } from "../../contexts/AuthContext";
import SessionDebugFlights from "../../components/SessionDebugFlights";
import FlashcardsWidgetWhiteTheme from "../../components/FlashcardsWidgetWhiteTheme";
import type { FlashcardsWidgetRef } from "../../components/flashcards/types";
import FlightsWidget from "../../components/FlightsWidget";
import StaysWidget from "../../components/StaysWidget";
import ItineraryWidget from "../../components/ItineraryWidget";
import DateSelectorWidget from "../../components/DateSelectorWidget";
import OnboardingModalWhite from "../../components/auth/OnboardingModalWhite";
import ItinerAIChatBox from "../../components/ItinerAIChatBox";
import { getSessionId } from "../../utils/sessionManager";
import { updateMemoryOnSessionChange } from "../../utils/memoryApi";
import {
  storeSelectedTrip,
  getSelectedTripFromFirestore,
} from "../../utils/tripStorage";
import { preFetchConveyanceData } from "../../utils/preFetchConveyance";
import { preFetchStaysData } from "../../utils/preFetchStays";
import {
  imageDownloader,
  extractImageUrls,
  validateAndPopulateTripData,
} from "../../utils/imageDownloader";
import {
  storeDayItinerary,
  buildCompleteItinerary,
  DayItineraryData,
} from "../../utils/itineraryStorage";
// New component imports
import { Sidebar } from "../../components/flights-page/Sidebar";
import { DashboardContent } from "../../components/flights-page/DashboardContent";
import { FlightsContent } from "../../components/flights-page/FlightsContent";
import { TripLoader } from "../../components/flights-page/TripLoader";
import { EndResponseLoader } from "../../components/flights-page/EndResponseLoader";
import { ChatNavbar } from "../../components/flights-page/ChatNavbar";
import PreFetchTestTrigger from "../../components/PreFetchTestTrigger";

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
  const [showStays, setShowStays] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [tripSuggestions, setTripSuggestions] = useState<any[]>([]);
  const [originalTrips, setOriginalTrips] = useState<any[]>([]); // Store original trip data for memory API
  const [isParsingTrips, setIsParsingTrips] = useState(false);
  const [showTripLoader, setShowTripLoader] = useState(false);
  const [showEndLoader, setShowEndLoader] = useState(false);
  const [testEndResponse, setTestEndResponse] = useState(false);
  const [conveyanceLoaderMessages, setConveyanceLoaderMessages] = useState<
    string[]
  >([]);
  const [conveyanceFromCity, setConveyanceFromCity] = useState<string>("");
  const [conveyanceToCity, setConveyanceToCity] = useState<string>("");
  const [stayCity, setStayCity] = useState<string>("");
  const [stayCheckInDate, setStayCheckInDate] = useState<string>(""); // YYYY-MM-DD format
  const [stayCheckOutDate, setStayCheckOutDate] = useState<string>(""); // YYYY-MM-DD format
  const [autoFillStaysMode, setAutoFillStaysMode] = useState<boolean>(false);
  const [currentDayNumber, setCurrentDayNumber] = useState<number>(1);
  const [navigateToDay, setNavigateToDay] = useState<number | null>(null); // Day number to navigate to in ItineraryWidget
  const [selectedConveyances, setSelectedConveyances] = useState<{
    [key: number]: any;
  }>({});
  const [tempConveyanceSelection, setTempConveyanceSelection] =
    useState<any>(null); // Temporary storage for current day's conveyance
  const [itineraryData, setItineraryData] = useState<any>(null); // Store itinerary response
  const [itinerariesGenerated, setItinerariesGenerated] = useState<any[]>([]); // Track all generated itineraries by day
  const [autoFillMode, setAutoFillMode] = useState<boolean>(false); // NEW: Auto-fill mode for FlightsWidget
  const [partialAutoFillMode, setPartialAutoFillMode] =
    useState<boolean>(false); // NEW: Partial auto-fill mode (only FROM and DATE locked)
  const [initialDepartureDate, setInitialDepartureDate] = useState<string>(""); // NEW: Initial departure date for FlightsWidget
  const [isInsertDayFlow, setIsInsertDayFlow] = useState<boolean>(false); // NEW: Track if we're in insert day flow
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false); // Loading state for itinerary
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const flashcardsRef = useRef<FlashcardsWidgetRef>(null);

  // Session management - for authenticated users, always use Firebase UID
  const [sessionId, setSessionId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [previousSessionId, setPreviousSessionId] = useState<string>("");
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [isInitializingSession, setIsInitializingSession] = useState(false);
  const sessionInitRef = useRef<boolean>(false); // Prevent double initialization in dev mode

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

  // Initialize session for authenticated user using API
  useEffect(() => {
    if (currentUser && !sessionId && !sessionInitRef.current) {
      // Only run if we don't have a session yet AND haven't started initialization
      sessionInitRef.current = true; // Mark as initializing to prevent double calls

      const initializeAuthenticatedSession = async () => {
        const authenticatedUserId = currentUser.uid; // Always use Firebase UID

        setIsInitializingSession(true);

        try {
          // Call /api/session/create to get a new session ID
          console.log(
            "🔄 Creating new session via API for user:",
            authenticatedUserId
          );

          const response = await fetch("/api/session/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: authenticatedUserId,
            }),
          });

          if (!response.ok) {
            throw new Error(`Session API error: ${response.status}`);
          }

          const sessionData = await response.json();
          const newSessionId = sessionData.body.session_id;

          console.log("✅ Session created via API:", {
            user_id: sessionData.body.user_id,
            session_id: newSessionId,
          });

          setSessionId(newSessionId);
          setUserId(authenticatedUserId);
          setPreviousSessionId(newSessionId);
          setIsInitializingSession(false);

          console.log("Authenticated flights session initialized:", {
            sessionId: newSessionId,
            userId: authenticatedUserId,
            userEmail: currentUser.email,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error("❌ Error creating session via API:", error);

          // Fallback to old method if API fails
          console.warn("⚠️ Falling back to local session generation");
          const fallbackSessionId = getSessionId();

          setSessionId(fallbackSessionId);
          setUserId(authenticatedUserId);
          setPreviousSessionId(fallbackSessionId);
          setIsInitializingSession(false);

          console.log("Authenticated flights session initialized (fallback):", {
            sessionId: fallbackSessionId,
            userId: authenticatedUserId,
            userEmail: currentUser.email,
            isAuthenticated: true,
          });
        }
      };

      initializeAuthenticatedSession();
    }
  }, [currentUser]); // ✅ Only depend on currentUser, not previousSessionId

  // Handle session regeneration from debug component
  const handleSessionRegenerated = async (
    newSessionId: string,
    newUserId: string
  ) => {
    // If no sessionId provided, call API to create new one
    if (!newSessionId && currentUser) {
      try {
        console.log(
          "🔄 Regenerating session via API for user:",
          currentUser.uid
        );

        const response = await fetch("/api/session/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: currentUser.uid,
          }),
        });

        if (response.ok) {
          const sessionData = await response.json();
          newSessionId = sessionData.body.session_id;
          console.log("✅ Session regenerated via API:", newSessionId);
        } else {
          throw new Error("Failed to create session via API");
        }
      } catch (error) {
        console.error("❌ Error regenerating session:", error);
        // Fallback to provided session or generate locally
        newSessionId = newSessionId || getSessionId();
      }
    }

    setSessionId(newSessionId);
    // For authenticated users, userId should always remain the same (Firebase UID)
    // but we'll update it anyway in case the debug component passes it
    setUserId(currentUser?.uid || newUserId);
    setIsFirstMessage(true); // Reset first message flag for new session

    console.log("Authenticated session regenerated:", {
      sessionId: newSessionId,
      userId: currentUser?.uid || newUserId,
      userEmail: currentUser?.email,
    });
  };

  // Handle chat history clearing when session is regenerated
  const handleClearChatHistory = () => {
    setMessages([]);
    setChatInputText("");
    setIsLoading(false);
    console.log("Chat history cleared");
  };

  // Restore selected trip from Firestore when component mounts or userId changes
  useEffect(() => {
    const restoreSelectedTrip = async () => {
      if (!userId) {
        console.log("⏳ Waiting for userId to restore trip");
        return;
      }

      // Only restore if we don't already have a selected trip
      if (selectedTrip) {
        console.log(
          "✅ Selected trip already in memory:",
          selectedTrip.trip_title
        );
        return;
      }

      console.log(
        "🔄 Attempting to restore selected trip from Firestore for user:",
        userId
      );

      try {
        const restoredTrip = await getSelectedTripFromFirestore(userId);

        if (restoredTrip) {
          console.log(
            "✅ Successfully restored trip from Firestore:",
            restoredTrip.trip_title
          );
          setSelectedTrip(restoredTrip);

          // Also restore to originalTrips if it's a trip suggestion format
          if (restoredTrip.trip_title) {
            setOriginalTrips([restoredTrip]);
          }
        } else {
          console.log("ℹ️ No trip found in Firestore to restore");
        }
      } catch (error) {
        console.error("❌ Error restoring trip from Firestore:", error);
      }
    };

    restoreSelectedTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Run when userId is set (selectedTrip checked inside but not in deps to avoid loops)

  // No need for dashboard data here anymore - it's in DashboardData.ts

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

  // Test function to simulate end response
  const simulateEndResponse = (): any => {
    return {
      response_type: "end",
      message: {
        message:
          "Great! Now let's finalize your travel dates to complete your booking.",
        additional_data: {},
      },
    };
  };

  // Post-processing function to clean backticks from API response
  const cleanBackticksFromResponse = (data: any): any => {
    if (!data || typeof data !== "object") {
      return data;
    }

    if (data.message && typeof data.message === "string") {
      let cleanedMessage = data.message;

      // Remove markdown code blocks: ```json\n{...}\n``` or ```{...}```
      // Pattern 1: ```json\n...\n```
      cleanedMessage = cleanedMessage.replace(/^```json\s*\n/i, "");
      cleanedMessage = cleanedMessage.replace(/\n```\s*$/, "");

      // Pattern 2: ```...```
      cleanedMessage = cleanedMessage.replace(/^```\s*/, "");
      cleanedMessage = cleanedMessage.replace(/\s*```$/, "");

      // Trim whitespace
      cleanedMessage = cleanedMessage.trim();

      // If the cleaned message looks like JSON, try to parse it
      if (cleanedMessage.startsWith("{") || cleanedMessage.startsWith("[")) {
        try {
          // First attempt: Direct parse
          const parsed = JSON.parse(cleanedMessage);
          console.log(
            "✅ Successfully parsed cleaned message as JSON (direct)"
          );
          return { ...data, message: parsed };
        } catch (e: any) {
          console.warn(
            "⚠️ Direct JSON parse failed, attempting to sanitize control characters:",
            e.message
          );

          try {
            // Second attempt: Sanitize control characters
            // Replace unescaped control characters with escaped versions
            let sanitized = cleanedMessage;

            // First, remove any literal backspace characters that may have been added incorrectly
            sanitized = sanitized.replace(/[\b]/g, "");

            // Handle common control character issues in JSON strings
            // This regex finds string values and fixes unescaped control chars within them
            sanitized = sanitized.replace(
              /"([^"\\]*(\\.[^"\\]*)*)"/g,
              (match: string) => {
                // Don't modify keys like "response_type", only string values
                // Check if this is likely a value (not a key)
                return match
                  .replace(/\n/g, "\\n")
                  .replace(/\r/g, "\\r")
                  .replace(/\t/g, "\\t")
                  .replace(/\f/g, "\\f");
                // Note: backspace chars already removed above
              }
            );

            const parsed = JSON.parse(sanitized);
            console.log(
              "✅ Successfully parsed cleaned message as JSON (after sanitization)"
            );
            return { ...data, message: parsed };
          } catch (e2: any) {
            console.warn(
              "⚠️ Sanitized JSON parse failed, attempting JSON5-like parse:",
              e2.message
            );

            try {
              // Third attempt: More aggressive sanitization
              // Remove all literal control characters (not escaped)
              let aggressiveSanitized = cleanedMessage
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control chars
                .replace(/\n/g, "\\n")
                .replace(/\r/g, "\\r")
                .replace(/\t/g, "\\t");

              const parsed = JSON.parse(aggressiveSanitized);
              console.log(
                "✅ Successfully parsed cleaned message as JSON (aggressive sanitization)"
              );
              return { ...data, message: parsed };
            } catch (e3: any) {
              console.error("❌ All JSON parse attempts failed:", e3.message);
              console.error(
                "Failed at character position:",
                e3.message.match(/position (\d+)/)?.[1]
              );

              // Return the cleaned message as-is if parsing fails completely
              return { ...data, message: cleanedMessage };
            }
          }
        }
      }

      return { ...data, message: cleanedMessage };
    }

    return data;
  };

  // Simple API call function
  const makeAPICall = async (currentInput: string): Promise<any> => {
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
        user_id: userId,
        session_id: sessionId,
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

      const data = await response.json();
      console.log("API Response received (raw):", data);

      // Clean backticks from response
      const cleanedData = cleanBackticksFromResponse(data);
      console.log("API Response (cleaned):", cleanedData);

      return cleanedData;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Clean up trip data - remove 'theme' field and keep only 'themes'
  const cleanupTripData = (trips: any[]): any[] => {
    return trips.map((trip) => {
      const cleanedTrip = { ...trip };
      // Remove 'theme' field if it exists, keep only 'themes'
      if (cleanedTrip.theme !== undefined) {
        delete cleanedTrip.theme;
      }
      return cleanedTrip;
    });
  };

  // Handle trip selection - map transformed trip back to original trip
  const handleTripSelect = (transformedTrip: any | null) => {
    if (transformedTrip === null) {
      setSelectedTrip(null);
      return;
    }

    // Find the corresponding original trip by matching trip_title
    const originalTrip = originalTrips.find(
      (trip) => trip.trip_title === transformedTrip.trip_title
    );

    if (originalTrip) {
      console.log("Selected original trip:", originalTrip);
      setSelectedTrip(originalTrip);
    } else {
      console.warn(
        "Could not find original trip for:",
        transformedTrip.trip_title
      );
      setSelectedTrip(transformedTrip); // Fallback to transformed trip
    }
  };

  // Handle trip memory update when a trip is selected and send button is clicked
  const handleTripMemoryUpdate = async () => {
    if (!selectedTrip || !sessionId || !userId) {
      console.error("Missing required data for trip memory update");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Sending trip to memory API and Firestore:", selectedTrip);

      // Store the selected trip in Firestore first
      await storeSelectedTrip(userId, sessionId, selectedTrip);
      console.log(
        "✅ Trip stored in Firestore successfully:",
        selectedTrip.trip_title
      );
      console.log(
        "📌 Trip remains in component state for subsequent operations"
      );

      // Send the selected trip to memory API
      const response = await fetch("/api/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          updates: {
            final_trip: selectedTrip,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Memory API Error:", errorData);
        throw new Error(
          `Failed to update memory: ${errorData.error || response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Memory API success:", result);

      // Add a user message showing the selected trip
      const userMessage = {
        id: Date.now().toString(),
        content: `Selected trip: ${selectedTrip.trip_title}`,
        role: "user" as const,
        timestamp: new Date(),
        metadata: {
          selectedTrip: selectedTrip,
        },
      };

      setMessages((prev) => [...prev, userMessage]);

      // Close flashcards and clear visual selection
      setShowFlashcards(false);
      // NOTE: Keep selectedTrip in state - it's needed for subsequent operations
      // (date selection, conveyance flow, stays). Trip is already stored in Firestore.
      // setSelectedTrip(null); // ❌ Removed - causes null trip in date selector

      // Clear flashcards visual selection via ref
      if (flashcardsRef.current) {
        flashcardsRef.current.clearSelection();
      }

      // Make a chat API call to notify the backend about the memory update
      console.log("Making chat API call after memory update");
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          message:
            "I have updated the memory with the trip selected by the user.",
        }),
      });

      if (!chatResponse.ok) {
        const errorData = await chatResponse
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Chat API Error:", errorData);
        throw new Error(
          `Failed to call chat API: ${
            errorData.error || chatResponse.statusText
          }`
        );
      }

      const chatData = await chatResponse.json();
      console.log("Chat API response received:", chatData);

      // Extract message content from chat response
      let chatMessageContent = "";

      if (chatData.response_type === "text" && chatData.message) {
        chatMessageContent = chatData.message.message || chatData.message;
      } else if (chatData.message && typeof chatData.message === "object") {
        chatMessageContent =
          chatData.message.message || JSON.stringify(chatData.message);
      } else if (typeof chatData.message === "string") {
        chatMessageContent = chatData.message;
      } else {
        chatMessageContent = "Trip selection updated successfully.";
      }

      // Add assistant response from chat API to messages
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: chatMessageContent,
        role: "assistant" as const,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error updating trip memory:", error);
      setIsLoading(false);
      alert("Failed to save trip selection. Please try again.");
    }
  };

  // Call itinerary API to generate detailed itinerary for a specific day
  const callItineraryAPI = async (
    dayNumber: number,
    showLoaderScreen: boolean = true,
    isAddDayFlow: boolean = false, // NEW: Flag to indicate add day flow for navigation
    overrideTrip?: any, // NEW: Override selectedTrip with fresh data
    overrideItineraries?: any[] // NEW: Override itinerariesGenerated with fresh data
  ) => {
    // Use overrides if provided, otherwise use state
    const tripToUse = overrideTrip || selectedTrip;
    const itinerariesToUse = overrideItineraries || itinerariesGenerated;

    if (!tripToUse || !userId || !sessionId) {
      console.error("❌ Missing required data for itinerary API call");
      return;
    }

    try {
      // Calculate total days from trip
      const totalDays = tripToUse.day_wise_plan?.length || 1;

      // Show loader with itinerary messages
      setIsLoadingItinerary(true);

      if (showLoaderScreen) {
        setConveyanceLoaderMessages([
          `Creating your detailed itinerary for day ${dayNumber}`,
          "Analyzing your preferences and selections",
          "Optimizing your schedule",
          "Adding personalized recommendations",
        ]);
        setShowTripLoader(true);
        setIsParsingTrips(true);
      }

      console.log(
        `📤 Calling itinerary API for day ${dayNumber} of ${totalDays} days`
      );

      // Build complete itinerary using tripToUse and itinerariesToUse
      const completeItinerary = await buildCompleteItinerary(
        userId,
        tripToUse,
        dayNumber,
        itinerariesToUse // Pass generated itineraries
      );

      console.log(
        `📦 Built complete itinerary with ${completeItinerary.length} days for API request`
      );
      console.log("📊 Complete itinerary data:", completeItinerary);

      // Prepare the message as a string with single-quoted JSON format
      const itineraryMessage = `{'role':'admin','day_number':${dayNumber},'end_day':${totalDays},'query':'recommend the itinerary for day ${dayNumber}'}`;

      console.log("📝 Itinerary message:", itineraryMessage);

      // Build request body with complete itinerary
      const requestBody: any = {
        user_id: userId,
        session_id: sessionId,
        message: itineraryMessage,
        current_itinerary: completeItinerary || [], // Ensure it's always an array
        role: "admin",
        current_day: dayNumber,
        trip_duration: totalDays,
        request_type: "generate",
      };
      console.log("📤 Request body:", JSON.stringify(requestBody, null, 2));
      // Retry configuration
      const MAX_RETRIES = 2;
      const RETRY_DELAY = 5000; // 5 seconds
      let lastError: Error | null = null;
      let itineraryResponse: any = null;

      // Retry loop for handling 503 errors
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            console.log(
              `⏳ Retrying itinerary API (attempt ${attempt + 1}/${
                MAX_RETRIES + 1
              }) after 5 seconds...`
            );

            // Update loader messages for retry
            if (showLoaderScreen) {
              setConveyanceLoaderMessages([
                `Retrying itinerary generation (attempt ${attempt + 1})`,
                "Please wait, this may take a moment...",
                "Optimizing your schedule",
                "Adding personalized recommendations",
              ]);
            }

            // Wait 5 seconds before retry
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          }

          const response = await fetch("/api/itinerary", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });

          // Check for 503 specifically
          if (response.status === 503) {
            console.warn(
              `⚠️ Itinerary API returned 503 (attempt ${attempt + 1}/${
                MAX_RETRIES + 1
              })`
            );
            lastError = new Error(`Service unavailable (503)`);

            // If we have retries left, continue to next attempt
            if (attempt < MAX_RETRIES) {
              continue;
            } else {
              // Last attempt failed with 503
              throw lastError;
            }
          }

          if (!response.ok) {
            throw new Error(`Itinerary API error: ${response.status}`);
          }

          itineraryResponse = await response.json();
          console.log(
            `✅ Itinerary API response received on attempt ${attempt + 1}`
          );

          // Success - break out of retry loop
          break;
        } catch (error) {
          console.error(
            `❌ Itinerary API error (attempt ${attempt + 1}/${
              MAX_RETRIES + 1
            }):`,
            error
          );
          lastError = error as Error;

          // If this was the last attempt, throw
          if (attempt === MAX_RETRIES) {
            throw lastError;
          }
          // Otherwise, continue to next retry
        }
      }

      // If we get here without itineraryResponse, all retries failed
      if (!itineraryResponse) {
        throw (
          lastError || new Error("Failed to generate itinerary after retries")
        );
      }
      console.log("✅ Itinerary API response received:", itineraryResponse);

      // Parse the response - the actual itinerary data is inside the 'message' object
      let itineraryPayload = itineraryResponse;

      // Check if the response has a nested message structure
      if (
        itineraryResponse.message &&
        typeof itineraryResponse.message === "object"
      ) {
        console.log("📦 Extracting itinerary from nested message object");
        itineraryPayload = itineraryResponse.message;
      }

      // Store itinerary data and save ALL days to Firestore
      if (
        itineraryPayload.response_type === "itinerary" &&
        itineraryPayload.itinerary
      ) {
        // Merge with existing itineraryData instead of replacing
        setItineraryData((prevData: any) => {
          if (!prevData || !prevData.itinerary) {
            // No previous data, use new data as-is
            console.log("✅ Setting initial itinerary data");
            return itineraryPayload;
          }

          // Merge itineraries: update existing days or add new days
          const existingDays = prevData.itinerary;
          const newDays = itineraryPayload.itinerary;

          console.log(
            `🔄 Merging itinerary data: ${existingDays.length} existing + ${newDays.length} new`
          );

          // Create a map of existing days by day_number
          const dayMap = new Map();
          existingDays.forEach((day: any) => dayMap.set(day.day_number, day));

          // Update or add new days
          newDays.forEach((day: any) => {
            console.log(`📝 Updating/Adding day ${day.day_number}`);
            dayMap.set(day.day_number, day);
          });

          // Convert back to array and sort by day_number
          const mergedDays = Array.from(dayMap.values()).sort(
            (a: any, b: any) => a.day_number - b.day_number
          );

          console.log(
            `✅ Merged itinerary now has ${mergedDays.length} total day(s)`
          );

          return {
            ...itineraryPayload,
            itinerary: mergedDays,
          };
        });

        console.log("✅ Itinerary data stored successfully");
        console.log(
          "📊 Itinerary contains",
          itineraryPayload.itinerary.length,
          "day(s)"
        );

        // Update itinerariesGenerated with new days
        console.log("💾 Updating itinerariesGenerated with new days...");
        const updatedItinerariesGenerated = [...itinerariesGenerated];

        for (const dayData of itineraryPayload.itinerary) {
          try {
            // Parse the API response - extract conveyance/stay from schedule if needed
            let conveyanceDetails = dayData.conveyance_details;
            let stayDetails = dayData.stay_details;

            // If schedule exists, extract conveyance/stay from it
            if (dayData.schedule && Array.isArray(dayData.schedule)) {
              const conveyanceActivities = dayData.schedule.filter(
                (item: any) => item.activity_type === "travel" && item.conveyance_type
              );
              const stayActivities = dayData.schedule.filter(
                (item: any) => item.activity_type === "rest" && item.place_name
              );

              if (!conveyanceDetails && conveyanceActivities.length > 0) {
                const primaryConveyance = conveyanceActivities[0];
                conveyanceDetails = {
                  is_required: true,
                  type: primaryConveyance.conveyance_type,
                  from_city: primaryConveyance.from_location?.place_name || primaryConveyance.from_location?.address,
                  to_city: primaryConveyance.to_location?.place_name || primaryConveyance.to_location?.address,
                  departure_time: primaryConveyance.departure_time || primaryConveyance.start_time,
                  arrival_time: primaryConveyance.arrival_time || primaryConveyance.end_time,
                  duration: primaryConveyance.duration_minutes ? `${primaryConveyance.duration_minutes} min` : undefined,
                  price: primaryConveyance.fare,
                };
              }

              if (!stayDetails && stayActivities.length > 0) {
                const primaryStay = stayActivities.find((s: any) =>
                  s.place_name && s.place_name.toLowerCase().includes('hotel')
                ) || stayActivities[0];

                if (primaryStay) {
                  stayDetails = {
                    is_required: true,
                    property_name: primaryStay.place_name,
                    property_address: primaryStay.address,
                    city: primaryStay.address,
                  };
                }
              }
            }

            // Build dayToStore - only include non-undefined fields
            const dayToStore: any = {
              day_number: dayData.day_number,
            };

            // Add optional fields only if they have values
            if (dayData.must_do_activities && dayData.must_do_activities.length > 0) {
              dayToStore.must_do_activities = dayData.must_do_activities;
            }

            if (dayData.places_to_visit && dayData.places_to_visit.length > 0) {
              dayToStore.places_to_visit = dayData.places_to_visit;
            }

            if (conveyanceDetails) {
              dayToStore.conveyance_details = Object.fromEntries(
                Object.entries(conveyanceDetails).filter(([_, v]) => v !== undefined)
              );
            }

            if (stayDetails) {
              dayToStore.stay_details = Object.fromEntries(
                Object.entries(stayDetails).filter(([_, v]) => v !== undefined)
              );
            }

            // Add other fields if they exist
            if (dayData.schedule) dayToStore.schedule = dayData.schedule;
            if (dayData.title) dayToStore.title = dayData.title;
            if (dayData.date) dayToStore.date = dayData.date;
            if (dayData.summary) dayToStore.summary = dayData.summary;
            if (dayData.themes) dayToStore.themes = dayData.themes;
            if (dayData.estimated_total_cost) dayToStore.estimated_total_cost = dayData.estimated_total_cost;
            if (dayData.highlights) dayToStore.highlights = dayData.highlights;

            console.log(`📦 Storing day ${dayData.day_number} with fields:`, Object.keys(dayToStore));

            // Update or add to itinerariesGenerated
            const existingIndex = updatedItinerariesGenerated.findIndex(
              (it) => it.day_number === dayData.day_number
            );

            if (existingIndex !== -1) {
              // Replace existing day
              updatedItinerariesGenerated[existingIndex] = dayToStore;
              console.log(
                `✅ Updated day ${dayData.day_number} in itinerariesGenerated`
              );
            } else {
              // Add new day
              updatedItinerariesGenerated.push(dayToStore);
              console.log(
                `✅ Added day ${dayData.day_number} to itinerariesGenerated`
              );
            }

            // Also store in Firestore for backup
            await storeDayItinerary(userId, sessionId, dayToStore as DayItineraryData);
          } catch (storeError) {
            console.error(
              `❌ Failed to process day ${dayData.day_number}:`,
              storeError
            );
            // Continue processing other days even if one fails
          }
        }

        // Update state with all generated itineraries
        setItinerariesGenerated(updatedItinerariesGenerated);
        console.log(
          `✅ itinerariesGenerated now has ${updatedItinerariesGenerated.length} day(s)`
        );
      } else {
        console.warn(
          "⚠️ Unexpected itinerary response format:",
          itineraryResponse
        );
        console.warn("⚠️ Payload structure:", itineraryPayload);
      }

      // Hide loader after minimum display time
      setTimeout(() => {
        setShowTripLoader(false);
        setIsLoadingItinerary(false);

        setTimeout(() => {
          setIsParsingTrips(false);
          // Show itinerary widget
          setShowItinerary(true);
          console.log("✅ Showing itinerary widget");

          // If this is add day flow, navigate to the newly added day
          if (isAddDayFlow) {
            console.log(
              `🔍 Setting navigation target to day ${dayNumber} (add day flow)`
            );
            // Set navigation target after itinerary is shown
            setTimeout(() => {
              setNavigateToDay(dayNumber);

              // Reset navigation target after a short delay to allow future navigation
              setTimeout(() => {
                setNavigateToDay(null);
              }, 1000);
            }, 100);
          }
        }, 700);
      }, 4000);
    } catch (error) {
      console.error("❌ Error calling itinerary API:", error);
      setIsLoadingItinerary(false);
      setShowTripLoader(false);
      setIsParsingTrips(false);
      alert("Failed to generate itinerary. Please try again.");
    }
  };

  // Call itinerary API with insert flow logic (request_type="add")
  const callItineraryAPIForInsert = async (
    insertDayNumber: number,
    tripData: any,
    itinerariesData: any[]
  ) => {
    if (!tripData || !userId || !sessionId) {
      console.error("❌ Missing required data for insert itinerary API call");
      return;
    }

    try {
      console.log(
        `📤 Calling itinerary API for INSERT day ${insertDayNumber} with request_type="add"`
      );

      // Show loader
      setIsLoadingItinerary(true);
      setConveyanceLoaderMessages([
        `Creating your detailed itinerary for day ${insertDayNumber}`,
        "Analyzing your preferences and selections",
        "Optimizing your schedule",
        "Adding personalized recommendations",
      ]);
      setShowTripLoader(true);
      setIsParsingTrips(true);

      // Build payload for insert flow
      // Only include days BEFORE the insertion point + the new day
      // Days after insertion will have their day_number shifted by +1
      const itinerariesBeforeInsertion = itinerariesData
        .filter((it) => it.day_number < insertDayNumber)
        .map((it) => ({ ...it }));

      // Add the new day
      const newDayItinerary = itinerariesData.find(
        (it) => it.day_number === insertDayNumber
      );

      const currentItineraryForAPI = [
        ...itinerariesBeforeInsertion,
        newDayItinerary,
      ];

      // Shift day numbers for days after insertion point
      const itinerariesAfterInsertion = itinerariesData
        .filter((it) => it.day_number > insertDayNumber)
        .map((it) => ({
          ...it,
          day_number: it.day_number + 1,
        }));

      console.log(
        `📊 Insert payload: ${itinerariesBeforeInsertion.length} days before + 1 new day + ${itinerariesAfterInsertion.length} days after (shifted)`
      );

      // Calculate new trip duration
      const newTripDuration = (tripData.no_of_days || tripData.day_wise_plan?.length || 0) + 1;

      // Prepare the message
      const itineraryMessage = `{'role':'admin','day_number':${insertDayNumber},'end_day':${newTripDuration},'query':'recommend the itinerary for day ${insertDayNumber}'}`;

      // Build request body with request_type="add"
      const requestBody: any = {
        user_id: userId,
        session_id: sessionId,
        message: itineraryMessage,
        current_itinerary: currentItineraryForAPI,
        role: "admin",
        current_day: insertDayNumber,
        trip_duration: newTripDuration,
        request_type: "add", // IMPORTANT: Use "add" for insert flow
      };

      console.log("📤 Insert API Request body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch("/api/itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Itinerary API error:", response.status, errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const itineraryResponse = await response.json();
      console.log("✅ Insert API Response:", itineraryResponse);

      // Hide loader
      setShowTripLoader(false);
      setIsParsingTrips(false);
      setIsLoadingItinerary(false);

      // Process response and update state
      let itineraryPayload = itineraryResponse;
      if (
        itineraryResponse.message &&
        typeof itineraryResponse.message === "object"
      ) {
        itineraryPayload = itineraryResponse.message;
      }

      // Store itinerary data
      if (
        itineraryPayload.response_type === "itinerary" &&
        itineraryPayload.itinerary
      ) {
        setItineraryData((prevData: any) => {
          if (!prevData || !prevData.itinerary) {
            return itineraryPayload;
          }

          // Merge with existing data
          const existingDays = prevData.itinerary;
          const newDays = itineraryPayload.itinerary;

          const dayMap = new Map();
          existingDays.forEach((day: any) => dayMap.set(day.day_number, day));
          newDays.forEach((day: any) => dayMap.set(day.day_number, day));

          const mergedDays = Array.from(dayMap.values()).sort(
            (a: any, b: any) => a.day_number - b.day_number
          );

          return {
            ...prevData,
            itinerary: mergedDays,
          };
        });

        // Store all days from response
        for (const dayData of itineraryPayload.itinerary) {
          // Parse the API response which has the new format with "schedule" array
          // Extract conveyance and stay details from schedule if not directly present

          let conveyanceDetails = dayData.conveyance_details;
          let stayDetails = dayData.stay_details;

          // If schedule exists, extract conveyance/stay from it
          if (dayData.schedule && Array.isArray(dayData.schedule)) {
            // Find conveyance activities (travel type)
            const conveyanceActivities = dayData.schedule.filter(
              (item: any) => item.activity_type === "travel" && item.conveyance_type
            );

            // Find stay activities
            const stayActivities = dayData.schedule.filter(
              (item: any) => item.activity_type === "rest" && item.place_name
            );

            // Build conveyance_details if not present
            if (!conveyanceDetails && conveyanceActivities.length > 0) {
              const primaryConveyance = conveyanceActivities[0];
              conveyanceDetails = {
                is_required: true,
                type: primaryConveyance.conveyance_type,
                from_city: primaryConveyance.from_location?.place_name || primaryConveyance.from_location?.address,
                to_city: primaryConveyance.to_location?.place_name || primaryConveyance.to_location?.address,
                departure_time: primaryConveyance.departure_time || primaryConveyance.start_time,
                arrival_time: primaryConveyance.arrival_time || primaryConveyance.end_time,
                duration: primaryConveyance.duration_minutes ? `${primaryConveyance.duration_minutes} min` : undefined,
                price: primaryConveyance.fare,
              };
            }

            // Build stay_details if not present
            if (!stayDetails && stayActivities.length > 0) {
              const primaryStay = stayActivities.find((s: any) =>
                s.place_name && s.place_name.toLowerCase().includes('hotel')
              ) || stayActivities[0];

              if (primaryStay) {
                stayDetails = {
                  is_required: true,
                  property_name: primaryStay.place_name,
                  property_address: primaryStay.address,
                  city: primaryStay.address,
                };
              }
            }
          }

          // Build the day object to store - only include fields that have values
          const dayToStore: any = {
            day_number: dayData.day_number,
          };

          // Add optional fields only if they exist and are not undefined
          if (dayData.must_do_activities && dayData.must_do_activities.length > 0) {
            dayToStore.must_do_activities = dayData.must_do_activities;
          }

          if (dayData.places_to_visit && dayData.places_to_visit.length > 0) {
            dayToStore.places_to_visit = dayData.places_to_visit;
          }

          if (conveyanceDetails) {
            // Filter out undefined values from conveyanceDetails
            dayToStore.conveyance_details = Object.fromEntries(
              Object.entries(conveyanceDetails).filter(([_, v]) => v !== undefined)
            );
          }

          if (stayDetails) {
            // Filter out undefined values from stayDetails
            dayToStore.stay_details = Object.fromEntries(
              Object.entries(stayDetails).filter(([_, v]) => v !== undefined)
            );
          }

          // Add the entire day data for itinerariesGenerated (includes schedule, title, etc.)
          const completeDayData = {
            ...dayToStore,
            ...dayData, // Include all other fields like schedule, title, summary, etc.
          };

          console.log(`📦 Storing day ${dayData.day_number} with fields:`, Object.keys(dayToStore));

          await storeDayItinerary(userId, sessionId, dayToStore as DayItineraryData);

          // Update itinerariesGenerated with complete data
          const existingIndex = itinerariesData.findIndex(
            (it) => it.day_number === dayData.day_number
          );
          if (existingIndex !== -1) {
            itinerariesData[existingIndex] = completeDayData;
          } else {
            itinerariesData.push(completeDayData);
          }
        }

        setItinerariesGenerated([...itinerariesData]);

        // Clear insert flow flag
        setIsInsertDayFlow(false);

        // Navigate back to itinerary
        setShowItinerary(true);
      }
    } catch (error) {
      console.error("❌ Error in insert itinerary API call:", error);
      setShowTripLoader(false);
      setIsParsingTrips(false);
      setIsLoadingItinerary(false);
      setIsInsertDayFlow(false);
    }
  };

  // Handler for requesting next day itinerary from ItineraryWidget
  const handleRequestNextDay = async (nextDayNumber: number) => {
    console.log(`🔄 Requesting itinerary for next day: ${nextDayNumber}`);

    if (!selectedTrip || !selectedTrip.day_wise_plan) {
      console.error("❌ No selected trip or day_wise_plan found");
      return;
    }

    // Find the next day in the trip plan
    const nextDay = selectedTrip.day_wise_plan.find(
      (d: any) => d.day_number === nextDayNumber
    );

    if (!nextDay) {
      console.error(`❌ Could not find day ${nextDayNumber} in day_wise_plan`);
      return;
    }

    console.log(`🔍 Checking day ${nextDayNumber} requirements:`, nextDay);

    // Update current day number
    setCurrentDayNumber(nextDayNumber);

    // Check if conveyance is required for this day
    if (
      nextDay.conveyance_details &&
      nextDay.conveyance_details.is_required === true
    ) {
      console.log(`✅ Day ${nextDayNumber} requires conveyance`);

      // Extract from and to cities
      let fromCity = nextDay.conveyance_details.from_city || "";
      let toCity = nextDay.conveyance_details.to_city || "";

      // Define supported cities
      const supportedCities = [
        "Mumbai",
        "Bangalore",
        "Agra",
        "New Delhi",
        "Leh",
        "Delhi",
      ];

      // Normalize fromCity
      if (fromCity) {
        const normalizedFromCity =
          fromCity.charAt(0).toUpperCase() + fromCity.slice(1).toLowerCase();
        const isSupported = supportedCities.some(
          (city) => city.toLowerCase() === normalizedFromCity.toLowerCase()
        );

        if (!isSupported) {
          console.log(
            `🔄 "${fromCity}" is not a supported city, defaulting to Mumbai`
          );
          fromCity = "Mumbai";
        } else {
          fromCity = normalizedFromCity;
        }
      } else {
        fromCity = "Mumbai";
        console.log("🔄 Empty from_city, defaulting to Mumbai");
      }

      // Normalize toCity
      if (toCity) {
        toCity = toCity.charAt(0).toUpperCase() + toCity.slice(1).toLowerCase();
        if (toCity === "Delhi") toCity = "New Delhi";
      }

      console.log(
        `🎯 Setting conveyance cities - From: ${fromCity}, To: ${toCity}`
      );

      // Calculate departure date for this day
      const tripDate = selectedTrip.trip_date;
      if (tripDate) {
        const baseDate = new Date(tripDate);
        const departureDate = new Date(baseDate);
        departureDate.setDate(departureDate.getDate() + (nextDayNumber - 1));
        const departureDateStr = departureDate.toISOString().split("T")[0];

        console.log(`📅 Calculated departure date: ${departureDateStr}`);

        // Set states for FlightsWidget
        setConveyanceFromCity(fromCity);
        setConveyanceToCity(toCity);
        setAutoFillMode(true);
        setInitialDepartureDate(departureDateStr);

        // Set loader messages
        setConveyanceLoaderMessages([
          `Let's find conveyance options for Day ${nextDayNumber}`,
          `Searching ${fromCity} to ${toCity} routes`,
          "Finding the best travel options",
          "Comparing prices and timings",
        ]);

        console.log("🔄 Closing itinerary and showing loader");

        // Close itinerary widget
        setShowItinerary(false);

        // Show trip loader
        setShowTripLoader(true);
        setIsParsingTrips(true);

        console.log("⏱️ Starting 4-second timer for loader");

        // After 4 seconds, hide loader and show flights widget
        setTimeout(() => {
          console.log("⏱️ 4 seconds elapsed, hiding loader");
          setShowTripLoader(false);

          setTimeout(() => {
            console.log(
              `✈️ Showing FlightsWidget for day ${nextDayNumber} with cities: ${fromCity} to ${toCity}`
            );
            setIsParsingTrips(false);
            setShowFlights(true);
            setShowFlashcards(false);
            setShowStays(false);
            setShowDateSelector(false);
          }, 700); // Dissolve duration
        }, 4000);
      }
    } else {
      // No conveyance required, directly call itinerary API
      console.log(`❌ Day ${nextDayNumber} does not require conveyance`);
      await callItineraryAPI(nextDayNumber, false);
    }
  };

  // Handler for adding a new day to the itinerary
  const handleAddDay = async (
    extendTrip: boolean,
    needsConveyance: boolean,
    currentDayNumber: number,
    isInsertFlow: boolean = false // NEW: Flag for insert day flow
  ) => {
    console.log("➕ handleAddDay called:", {
      extendTrip,
      needsConveyance,
      currentDayNumber,
      isInsertFlow,
    });

    if (!selectedTrip || !userId || !sessionId) {
      console.error("❌ Missing required data for adding day");
      return;
    }

    try {
      // Calculate the new day number - insert AFTER the current day
      const newDayNumber = currentDayNumber + 1;

      console.log(
        `📅 Adding day ${newDayNumber} after current day ${currentDayNumber}`
      );

      // Update trip in Firestore and memory
      let updatedTrip = { ...selectedTrip };

      if (extendTrip) {
        // CASE: User wants to extend trip duration
        console.log(
          `✅ Extending trip duration from ${updatedTrip.no_of_days} to ${
            updatedTrip.no_of_days + 1
          }`
        );

        // Update local state
        updatedTrip.no_of_days = updatedTrip.no_of_days + 1;
      }

      // Find the current city - look for last to_city BEFORE the new day position
      let fromCity = "Mumbai"; // Default

      // Iterate backwards from currentDayNumber to find the last conveyance with to_city
      console.log(
        `🔍 Looking for last to_city before day ${newDayNumber} (checking days 1 to ${currentDayNumber})`
      );

      for (let i = currentDayNumber - 1; i >= 0; i--) {
        const day = selectedTrip.day_wise_plan?.[i];
        console.log(`   Checking day ${i + 1}:`, day?.conveyance_details);

        if (day?.conveyance_details?.to_city) {
          fromCity = day.conveyance_details.to_city;
          console.log(`🎯 Found last to_city: ${fromCity} from day ${i + 1}`);
          break;
        }
      }

      // If no to_city found, use trip's source_point if available
      if (fromCity === "Mumbai" && selectedTrip.source_point?.place_name) {
        fromCity = selectedTrip.source_point.place_name;
        console.log(`🎯 Using source_point as from_city: ${fromCity}`);
      }

      // Normalize city name and handle special cases
      let normalizedFromCity = fromCity;

      // First, check if it's a special placeholder value
      if (
        fromCity.toLowerCase() === "user_location" ||
        fromCity.toLowerCase() === "user location" ||
        fromCity.toLowerCase() === "userlocation"
      ) {
        console.log(
          `⚠️ Found placeholder value: ${fromCity}, resolving to actual city...`
        );
        // Try to get from source_point or default to Mumbai
        if (selectedTrip.source_point?.place_name) {
          normalizedFromCity = selectedTrip.source_point.place_name;
          console.log(`✅ Resolved to source_point: ${normalizedFromCity}`);
        } else {
          normalizedFromCity = "Mumbai";
          console.log(
            `⚠️ No source_point found, defaulting to: ${normalizedFromCity}`
          );
        }
      }

      // Capitalize first letter and lowercase the rest
      normalizedFromCity =
        normalizedFromCity.charAt(0).toUpperCase() +
        normalizedFromCity.slice(1).toLowerCase();

      // Handle special city name mappings
      if (normalizedFromCity === "Delhi") {
        normalizedFromCity = "New Delhi";
      }

      // Verify city is in supported cities list
      const supportedCities = [
        "Mumbai",
        "Bangalore",
        "New Delhi",
        "Agra",
        "Leh",
      ];
      const isSupportedCity = supportedCities.some(
        (city) => city.toLowerCase() === normalizedFromCity.toLowerCase()
      );

      if (!isSupportedCity) {
        console.log(
          `⚠️ City "${normalizedFromCity}" is not in supported cities list, defaulting to Mumbai`
        );
        normalizedFromCity = "Mumbai";
      }

      fromCity = normalizedFromCity;
      console.log(`🚗 Final from_city for new day: ${fromCity}`);

      // Create empty day structure
      // Mark this as a newly added day (not part of original trip plan)
      const newDay: any = {
        day_number: newDayNumber,
        is_new_day: true, // Flag to identify newly added days
        conveyance_details: {
          is_required: needsConveyance,
          from_city: fromCity,
          to_city: "", // Will be filled by user if conveyance is required
        },
      };

      // Insert the new day at the correct position
      if (!updatedTrip.day_wise_plan) {
        updatedTrip.day_wise_plan = [];
      }

      // Insert at position (newDayNumber - 1) to maintain array index = dayNumber - 1
      updatedTrip.day_wise_plan.splice(newDayNumber - 1, 0, newDay);

      // Re-number all subsequent days
      for (let i = newDayNumber; i < updatedTrip.day_wise_plan.length; i++) {
        updatedTrip.day_wise_plan[i].day_number = i + 1;
      }

      console.log(
        `✅ Inserted new day ${newDayNumber} and renumbered subsequent days`
      );
      console.log(
        `📊 Updated day_wise_plan has ${updatedTrip.day_wise_plan.length} days`
      );

      // Also update itinerariesGenerated array - shift subsequent days
      console.log(
        "📦 Updating itinerariesGenerated to shift subsequent days..."
      );
      const updatedItinerariesGenerated = itinerariesGenerated.map(
        (itinerary) => {
          // If this itinerary is for a day >= newDayNumber, increment its day_number
          if (itinerary.day_number >= newDayNumber) {
            console.log(
              `  Shifting day ${itinerary.day_number} → ${
                itinerary.day_number + 1
              }`
            );
            return {
              ...itinerary,
              day_number: itinerary.day_number + 1,
            };
          }
          return itinerary;
        }
      );

      // Insert empty placeholder for new day (will be filled after conveyance/stay selection)
      const newDayItinerary = {
        day_number: newDayNumber,
        // Will be populated with conveyance_details and stay_details later
      };
      updatedItinerariesGenerated.splice(newDayNumber - 1, 0, newDayItinerary);

      setItinerariesGenerated(updatedItinerariesGenerated);
      console.log(
        `✅ itinerariesGenerated updated, now has ${updatedItinerariesGenerated.length} day(s)`
      );

      // Store updated trip in Firestore
      await storeSelectedTrip(userId, sessionId, updatedTrip);
      setSelectedTrip(updatedTrip);
      console.log(`✅ Added day ${newDayNumber} to trip in Firestore`);

      if (needsConveyance) {
        // CASE 1: User needs conveyance - redirect to FlightsWidget
        console.log(`✈️ Redirecting to FlightsWidget for day ${newDayNumber}`);

        // Set insert flow flag if this is an insert operation
        if (isInsertFlow) {
          console.log(`🔄 Setting insert flow flag for day ${newDayNumber}`);
          setIsInsertDayFlow(true);
        }

        // Calculate departure date for the new day
        const tripDate = selectedTrip.trip_date;
        console.log("trip date", tripDate);
        if (tripDate) {
          const baseDate = new Date(tripDate);
          const departureDate = new Date(baseDate);
          departureDate.setDate(departureDate.getDate() + (newDayNumber - 1));
          const departureDateStr = departureDate.toISOString().split("T")[0];

          console.log(`📅 Calculated departure date: ${departureDateStr}`);

          // Set current day number
          setCurrentDayNumber(newDayNumber);

          // Set states for FlightsWidget
          setConveyanceFromCity(fromCity);
          setConveyanceToCity(""); // Not prefilled - user selects
          setAutoFillMode(false); // Not full auto-fill mode
          setPartialAutoFillMode(true); // Enable partial auto-fill (FROM and DATE locked, TO selectable)
          setInitialDepartureDate(departureDateStr);

          // Set loader messages
          setConveyanceLoaderMessages([
            `Let's find conveyance options for Day ${newDayNumber}`,
            `Starting from ${fromCity}`,
            "Finding the best travel options",
            "Comparing prices and timings",
          ]);

          console.log(
            "🔄 Closing itinerary and showing loader for add day flow"
          );

          // Close itinerary widget to show FlightsWidget
          setShowItinerary(false);

          // Show trip loader before FlightsWidget
          setShowTripLoader(true);
          setIsParsingTrips(true);

          // After 4 seconds, show flights widget
          setTimeout(() => {
            setShowTripLoader(false);

            setTimeout(() => {
              console.log(`✈️ Showing FlightsWidget for day ${newDayNumber}`);
              setIsParsingTrips(false);
              setShowFlights(true);
              setShowFlashcards(false);
              setShowStays(false);
              setShowDateSelector(false);
            }, 700);
          }, 4000);
        }
      } else {
        // CASE 2: No conveyance needed - call itinerary API directly
        console.log(
          `📋 No conveyance needed for day ${newDayNumber}, calling itinerary API`
        );

        // Store the new day with is_required: false
        const dayToStore = {
          day_number: newDayNumber,
          conveyance_details: {
            is_required: false,
          },
          stay_details: {
            is_required: false,
          },
        };

        await storeDayItinerary(
          userId,
          sessionId,
          dayToStore as DayItineraryData
        );
        console.log(
          `✅ Stored day ${newDayNumber} with no conveyance requirement`
        );

        // Update itinerariesGenerated with the new day
        const updatedItinerariesGenerated = [...itinerariesGenerated];
        const dayIndex = updatedItinerariesGenerated.findIndex(
          (it) => it.day_number === newDayNumber
        );
        if (dayIndex !== -1) {
          updatedItinerariesGenerated[dayIndex] = {
            day_number: newDayNumber,
            conveyance_details: {
              is_required: false,
            },
            stay_details: {
              is_required: false,
            },
          };
          setItinerariesGenerated(updatedItinerariesGenerated);
        }

        // Check if this is insert flow - if so, use request_type="add"
        if (isInsertFlow) {
          console.log(
            `🔄 Insert flow detected - calling API with request_type="add"`
          );

          // Call API with special insert flow logic
          await callItineraryAPIForInsert(newDayNumber, updatedTrip, updatedItinerariesGenerated);
        } else {
          // Regular flow - extend trip
          await callItineraryAPI(newDayNumber, true);
        }
      }
    } catch (error) {
      console.error("❌ Error adding new day:", error);
      alert("Failed to add new day. Please try again.");
    }
  };

  // Handle date selection from DateSelectorWidget
  const handleDateSelection = async (selectedDate: Date) => {
    console.log("🎯 handleDateSelection called with date:", selectedDate);
    console.log("🔍 Current state at entry:");
    console.log("   - userId:", userId);
    console.log("   - sessionId:", sessionId);
    console.log(
      "   - selectedTrip:",
      selectedTrip ? `Present (${selectedTrip.trip_title})` : "NULL ❌"
    );

    if (!sessionId || !userId) {
      console.error(
        "❌ Missing required data for date selection: sessionId or userId"
      );
      return;
    }

    try {
      console.log("✅ Date selected:", selectedDate.toLocaleDateString());

      // If selectedTrip is not in memory, try to restore it from Firestore
      let tripToUse = selectedTrip;

      if (tripToUse) {
        console.log("✅ Trip already in memory:", tripToUse.trip_title);
      } else {
        console.log(
          "⚠️ Trip NOT in memory - attempting Firestore restoration..."
        );
        tripToUse = await getSelectedTripFromFirestore(userId);

        if (tripToUse) {
          console.log(
            "✅ SUCCESS - Restored trip from Firestore:",
            tripToUse.trip_title
          );
          setSelectedTrip(tripToUse); // Update state for future use
        } else {
          console.error(
            "❌ FAILED - No trip found in Firestore for user:",
            userId
          );
        }
      }

      // If there's a selected trip (either from memory or Firestore), store it with the date
      if (tripToUse) {
        console.log("Storing trip with selected date:", tripToUse.trip_title);
        // Convert date to strict YYYY-MM-DD format
        const dateString = selectedDate.toISOString().split("T")[0];

        // Validate and correct from_city in all days before storing
        const supportedCities = [
          "Mumbai",
          "Bangalore",
          "Delhi",
          "New Delhi",
          "Leh",
          "Agra",
        ];
        const correctedTrip = JSON.parse(JSON.stringify(tripToUse)); // Deep copy

        if (
          correctedTrip.day_wise_plan &&
          Array.isArray(correctedTrip.day_wise_plan)
        ) {
          correctedTrip.day_wise_plan.forEach((day: any) => {
            if (day.conveyance_details && day.conveyance_details.from_city) {
              let fromCity = day.conveyance_details.from_city;

              // Check if it's a supported city
              const normalizedFromCity =
                fromCity.charAt(0).toUpperCase() +
                fromCity.slice(1).toLowerCase();
              const isSupported = supportedCities.some(
                (city) =>
                  city.toLowerCase() === normalizedFromCity.toLowerCase()
              );

              if (!isSupported) {
                console.log(
                  `🔄 Day ${day.day_number}: Converting "${fromCity}" to Mumbai in trip JSON`
                );
                day.conveyance_details.from_city = "Mumbai";
              } else {
                day.conveyance_details.from_city = normalizedFromCity;
              }
            }
          });
        }

        // Add trip_date to correctedTrip
        correctedTrip.trip_date = dateString;

        await storeSelectedTrip(userId, sessionId, correctedTrip);

        // Update the local state with corrected trip (now includes trip_date)
        setSelectedTrip(correctedTrip);

        // Add a message to chat indicating date was selected
        const userMessage = {
          id: Date.now().toString(),
          content: `Selected date: ${selectedDate.toLocaleDateString()} for trip: ${
            correctedTrip.trip_title
          }`,
          role: "user" as const,
          timestamp: new Date(),
          metadata: {
            selectedDate: dateString, // Store in YYYY-MM-DD format
            selectedTrip: correctedTrip,
          },
        };

        setMessages((prev) => [...prev, userMessage]);

        // Fetch source_point from memory API
        console.log("🔍 Fetching source_point from memory API...");
        try {
          const memoryResponse = await fetch(`/api/memory/get`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: userId,
              session_id: sessionId,
            }),
          });
          if (memoryResponse.ok) {
            const memoryData = await memoryResponse.json();
            console.log("✅ Memory data received:", memoryData);

            // Check if source_point exists in the response
            if (memoryData.source_point && memoryData.source_point.place_name) {
              console.log(
                "✅ Found source_point:",
                memoryData.source_point.place_name
              );

              // Add source_point to the trip
              correctedTrip.source_point = memoryData.source_point;

              // Update all days with from_city = "user_location" to use source_point
              if (
                correctedTrip.day_wise_plan &&
                Array.isArray(correctedTrip.day_wise_plan)
              ) {
                correctedTrip.day_wise_plan.forEach((day: any) => {
                  if (
                    day.conveyance_details &&
                    (day.conveyance_details.from_city === "user_location" ||
                      day.conveyance_details.from_city === "User Location")
                  ) {
                    console.log(
                      `🔄 Day ${day.day_number}: Updating from_city from "${day.conveyance_details.from_city}" to "${memoryData.source_point.place_name}"`
                    );
                    day.conveyance_details.from_city =
                      memoryData.source_point.place_name;
                  }
                });
              }

              // Store updated trip with source_point (trip_date already added above)
              await storeSelectedTrip(userId, sessionId, correctedTrip);

              // Update local state
              setSelectedTrip(correctedTrip);
              console.log("✅ Trip updated with source_point");
            } else {
              console.log("⚠️ No source_point in memory, using default Mumbai");
              // Default to Mumbai if no source_point
              correctedTrip.source_point = {
                place_name: "Mumbai",
                address: "Mumbai, India",
              };

              // Update all days with from_city = "user_location" to Mumbai
              if (
                correctedTrip.day_wise_plan &&
                Array.isArray(correctedTrip.day_wise_plan)
              ) {
                correctedTrip.day_wise_plan.forEach((day: any) => {
                  if (
                    day.conveyance_details &&
                    (day.conveyance_details.from_city === "user_location" ||
                      day.conveyance_details.from_city === "User Location")
                  ) {
                    console.log(
                      `🔄 Day ${day.day_number}: Updating from_city from "${day.conveyance_details.from_city}" to Mumbai (default)`
                    );
                    day.conveyance_details.from_city = "Mumbai";
                  }
                });
              }

              // Store updated trip with default source_point (trip_date already added above)
              await storeSelectedTrip(userId, sessionId, correctedTrip);

              // Update local state
              setSelectedTrip(correctedTrip);
            }
          } else {
            console.error(
              "❌ Failed to fetch memory data:",
              memoryResponse.status
            );
            // Default to Mumbai on API failure
            console.log("⚠️ Defaulting to Mumbai due to API failure");
            correctedTrip.source_point = {
              place_name: "Mumbai",
              address: "Mumbai, India",
            };
          }
        } catch (error) {
          console.error("❌ Error fetching source_point from memory:", error);
          // Default to Mumbai on error
          console.log("⚠️ Defaulting to Mumbai due to error");
          correctedTrip.source_point = {
            place_name: "Mumbai",
            address: "Mumbai, India",
          };
        }

        // Pre-fetch conveyance data for all days that require it
        const dayWisePlan = correctedTrip.day_wise_plan;
        console.log("🔍 Day-wise plan:", dayWisePlan);

        if (dayWisePlan && dayWisePlan.length > 0) {
          // Extract days that require conveyance
          const dayDetails = dayWisePlan
            .filter((day: any) => day.conveyance_details)
            .map((day: any) => ({
              day_number: day.day_number,
              from_city: day.conveyance_details.from_city || "",
              to_city: day.conveyance_details.to_city || "",
              is_required: day.conveyance_details.is_required === true,
            }));

          // Trigger pre-fetch in background (don't await to not block UI)
          // preFetchConveyanceData({
          //   userId,
          //   sessionId,
          //   tripDate: dateString,
          //   dayDetails,
          // }).catch((error) => {
          //   console.error(
          //     "❌ Conveyance pre-fetch failed (non-blocking):",
          //     error
          //   );
          // });

          // Extract days that require stays
          const stayDetails = dayWisePlan
            .filter(
              (day: any) =>
                day.stay_details && day.stay_details.is_required === true
            )
            .map((day: any) => ({
              day_number: day.day_number,
              city: day.stay_details.city || "",
              check_in_day: day.stay_details.check_in_day || day.day_number,
              check_out_day:
                day.stay_details.check_out_day || day.day_number + 1,
              is_required: true,
            }));

          // Trigger stays pre-fetch in background (don't await to not block UI)
          // if (stayDetails.length > 0) {
          //   console.log(
          //     "🏨 Triggering stays pre-fetch for",
          //     stayDetails.length,
          //     "days"
          //   );
          //   preFetchStaysData({
          //     userId,
          //     sessionId,
          //     tripDate: dateString,
          //     dayDetails: stayDetails,
          //   }).catch((error) => {
          //     console.error("❌ Stays pre-fetch failed (non-blocking):", error);
          //   });
          // }
        }

        if (dayWisePlan && dayWisePlan.length > 0) {
          const day1 = dayWisePlan[0]; // Day 1 is at index 0

          console.log("🔍 Checking Day 1 conveyance details:", day1);
          console.log("🔍 Day 1 conveyance_details:", day1.conveyance_details);
          console.log(
            "🔍 Day 1 conveyance is_required:",
            day1.conveyance_details?.is_required
          );
          console.log(
            "🔍 Day 1 conveyance is_required type:",
            typeof day1.conveyance_details?.is_required
          );

          // Check if conveyance_details exists and is_required is true
          if (
            day1.conveyance_details &&
            day1.conveyance_details.is_required === true
          ) {
            console.log(
              "✅✅✅ Day 1 conveyance is required, showing loader and flights"
            );

            // Initialize current day number to 1
            setCurrentDayNumber(1);

            // Extract from and to cities
            let fromCity = day1.conveyance_details.from_city || "";
            let toCity = day1.conveyance_details.to_city || "";

            // Define supported cities (5 cities we have data for)
            const supportedCities = [
              "Mumbai",
              "Bangalore",
              "Agra",
              "New Delhi",
              "Leh",
              "Delhi",
            ];

            // Handle "user_location" and other placeholder values
            // Check if fromCity is not one of the supported cities
            if (fromCity) {
              // Capitalize for comparison
              const normalizedFromCity =
                fromCity.charAt(0).toUpperCase() +
                fromCity.slice(1).toLowerCase();
              const isSupported = supportedCities.some(
                (city) =>
                  city.toLowerCase() === normalizedFromCity.toLowerCase()
              );

              if (!isSupported) {
                console.log(
                  `🔄 "${fromCity}" is not a supported city, defaulting to Mumbai`
                );
                fromCity = "Mumbai";
              } else {
                fromCity = normalizedFromCity;
              }
            } else {
              fromCity = "Mumbai"; // Default if empty
              console.log("🔄 Empty from_city, defaulting to Mumbai");
            }

            // Capitalize city names properly for toCity
            if (toCity) {
              toCity =
                toCity.charAt(0).toUpperCase() + toCity.slice(1).toLowerCase();
              if (toCity === "Delhi") toCity = "New Delhi"; // Match FlightsWidget format
            }

            console.log(
              "🎯 Setting conveyance cities - From:",
              fromCity,
              "To:",
              toCity
            );

            // Set conveyance cities for FlightsWidget
            setConveyanceFromCity(fromCity);
            setConveyanceToCity(toCity);

            // Set auto-fill mode and initial departure date
            setAutoFillMode(true);
            setInitialDepartureDate(dateString); // Use the trip start date
            console.log(
              "📅 Set auto-fill mode with departure date:",
              dateString
            );

            // Set custom loader messages
            setConveyanceLoaderMessages([
              "Let's find conveyance options for Day 1",
              `Searching ${fromCity} to ${toCity} routes`,
              "Finding the best travel options",
              "Comparing prices and timings",
            ]);

            console.log("🔄 Closing date selector and showing loader");

            // Close date selector
            setShowDateSelector(false);

            // Show trip loader with conveyance message
            setShowTripLoader(true);
            setIsParsingTrips(true);

            console.log("⏱️ Starting 4-second timer for loader");

            // After 4 seconds, hide loader and show flights widget
            setTimeout(() => {
              console.log("⏱️ 4 seconds elapsed, hiding loader");
              setShowTripLoader(false);

              setTimeout(() => {
                console.log(
                  "✈️ Showing FlightsWidget with cities:",
                  fromCity,
                  "to",
                  toCity
                );
                setIsParsingTrips(false);
                setShowFlights(true);
                setShowFlashcards(false);
                setShowItinerary(false);
                setShowDateSelector(false);
              }, 700); // Dissolve duration
            }, 4000);

            return; // Exit early since we're showing conveyance flow
          } else {
            console.log("❌❌❌ Day 1 conveyance not required or missing.");
            console.log(
              "❌ is_required value:",
              day1.conveyance_details?.is_required
            );
            console.log(
              "❌ Strict equality check (=== true):",
              day1.conveyance_details?.is_required === true
            );
            console.log(
              "❌ Loose equality check (== true):",
              day1.conveyance_details?.is_required == true
            );
            console.log(
              "❌ Full conveyance_details:",
              JSON.stringify(day1.conveyance_details, null, 2)
            );
          }
        } else {
          console.log("❌❌❌ No day_wise_plan found in trip");
          console.log("❌ dayWisePlan:", dayWisePlan);
        }
      } else {
        // If no trip selected, just store the date
        console.log("Storing date without trip");
        // Convert date to strict YYYY-MM-DD format
        const dateString = selectedDate.toISOString().split("T")[0];

        // Add a message to chat indicating date was selected
        const userMessage = {
          id: Date.now().toString(),
          content: `Selected travel date: ${selectedDate.toLocaleDateString()}`,
          role: "user" as const,
          timestamp: new Date(),
          metadata: {
            selectedDate: dateString, // Store in YYYY-MM-DD format
          },
        };

        setMessages((prev) => [...prev, userMessage]);
      }

      // Close date selector
      setShowDateSelector(false);

      console.log("Date selection saved successfully");
    } catch (error) {
      console.error("Error storing date selection:", error);
      alert("Failed to save date selection. Please try again.");
    }
  };

  // Handle continue action from FlightsWidget with selected conveyance data
  const handleFlightsContinue = async (selectedConveyanceData?: any) => {
    console.log(
      "🚀 Continue clicked from FlightsWidget with data:",
      selectedConveyanceData
    );

    if (!selectedConveyanceData) {
      console.error("❌ No conveyance data selected");
      alert("Please select a conveyance option before continuing.");
      return;
    }

    if (!selectedTrip || !userId || !sessionId) {
      console.error("❌ Missing required data for conveyance selection");
      return;
    }

    try {
      // Store conveyance temporarily (DO NOT update memory yet)
      console.log(
        `💾 Storing conveyance temporarily for day ${currentDayNumber}:`,
        selectedConveyanceData
      );
      setTempConveyanceSelection(selectedConveyanceData);

      // Skip adding chat message for add day flow (in partial auto-fill mode)
      // Only add chat messages for regular conveyance selection flow
      if (!partialAutoFillMode) {
        const conveyanceMessage = {
          id: Date.now().toString(),
          content: `Selected ${selectedConveyanceData.operator} ${selectedConveyanceData.number} for Day ${currentDayNumber} (${conveyanceFromCity} to ${conveyanceToCity})`,
          role: "user" as const,
          timestamp: new Date(),
          metadata: {
            action: "conveyance_selected",
            day_number: currentDayNumber,
            conveyance: selectedConveyanceData,
          },
        };

        setMessages((prev) => [...prev, conveyanceMessage]);
      }

      // Close flights widget
      setShowFlights(false);

      // Find current day in trip plan
      const currentDay = selectedTrip.day_wise_plan?.find(
        (d: any) => d.day_number === currentDayNumber
      );

      if (!currentDay) {
        console.error(
          `❌ Could not find day ${currentDayNumber} in day_wise_plan`
        );
        return;
      }

      console.log(`🔍 Checking if day ${currentDayNumber} requires stay...`);
      console.log(`🔍 Partial auto-fill mode: ${partialAutoFillMode}`);

      // CASE 0: Partial auto-fill mode (Add Day flow) - Route to StaysWidget
      if (partialAutoFillMode) {
        console.log(
          `🚀 Partial auto-fill mode detected - routing to StaysWidget for new day ${currentDayNumber}`
        );

        // Store conveyance temporarily for handleStaysContinue
        console.log(
          `💾 Storing conveyance temporarily for day ${currentDayNumber}:`,
          selectedConveyanceData
        );
        setTempConveyanceSelection(selectedConveyanceData);

        // Update the current day with conveyance details
        const updatedTrip = { ...selectedTrip };
        const dayIndex = updatedTrip.day_wise_plan?.findIndex(
          (d: any) => d.day_number === currentDayNumber
        );

        if (dayIndex !== -1 && updatedTrip.day_wise_plan) {
          // Determine cities from selected data (fallback to existing state)
          const enrichedToCity =
            (selectedConveyanceData as any).to_city || conveyanceToCity || "";
          const enrichedFromCity =
            (selectedConveyanceData as any).from_city ||
            conveyanceFromCity ||
            "";

          // Also reflect in component state for downstream flows
          if (enrichedFromCity) setConveyanceFromCity(enrichedFromCity);
          if (enrichedToCity) setConveyanceToCity(enrichedToCity);

          updatedTrip.day_wise_plan[dayIndex].conveyance_details = {
            is_required: true,
            from_city: enrichedFromCity,
            to_city: enrichedToCity,
            type: selectedConveyanceData.operator.includes("Train")
              ? "train"
              : selectedConveyanceData.operator.includes("Bus")
              ? "bus"
              : "flight",
            number: selectedConveyanceData.number,
            operator: selectedConveyanceData.operator,
            departure_date: selectedConveyanceData.departureDate,
            departure_time: selectedConveyanceData.departureTime,
            arrival_date: selectedConveyanceData.arrivalDate,
            arrival_time: selectedConveyanceData.arrivalTime,
            duration: selectedConveyanceData.duration,
            price: selectedConveyanceData.price,
          };
          console.log("updatedTrip", updatedTrip);
          // Store updated trip
          await storeSelectedTrip(userId, sessionId, updatedTrip);
          setSelectedTrip(updatedTrip);
          console.log(
            `✅ Updated day ${currentDayNumber} with conveyance details`
          );
        }

        // Extract TO city from conveyance selection (prefer enriched value)
        const toCity =
          (selectedConveyanceData as any).to_city || conveyanceToCity || "";

        // Capitalize city name
        let stayCity = toCity;
        if (stayCity) {
          stayCity =
            stayCity.charAt(0).toUpperCase() + stayCity.slice(1).toLowerCase();
          if (stayCity === "Delhi") stayCity = "New Delhi";
        }

        console.log(`🏨 Setting stay city to: ${stayCity}`);
        setStayCity(stayCity);

        // Calculate check-in and check-out dates (1 day stay)
        const tripDate = selectedTrip.trip_date;
        if (tripDate) {
          const baseDate = new Date(tripDate);
          const checkInDate = new Date(baseDate);
          checkInDate.setDate(checkInDate.getDate() + (currentDayNumber - 1));
          const checkInDateStr = checkInDate.toISOString().split("T")[0];

          const checkOutDate = new Date(checkInDate);
          checkOutDate.setDate(checkOutDate.getDate() + 1); // 1 day stay
          const checkOutDateStr = checkOutDate.toISOString().split("T")[0];

          console.log(
            `📅 Check-in date: ${checkInDateStr}, Check-out date: ${checkOutDateStr}`
          );

          setStayCheckInDate(checkInDateStr);
          setStayCheckOutDate(checkOutDateStr);
          setAutoFillStaysMode(true); // Enable auto-fill mode

          // Also add stay_details to the day structure for handleStaysContinue
          if (dayIndex !== -1 && updatedTrip.day_wise_plan) {
            updatedTrip.day_wise_plan[dayIndex].stay_details = {
              is_required: true,
              city: stayCity,
              check_in_day: currentDayNumber,
              check_out_day: currentDayNumber + 1,
            };

            // Update trip again with stay_details
            await storeSelectedTrip(userId, sessionId, updatedTrip);
            setSelectedTrip(updatedTrip);
            console.log(
              `✅ Added stay_details structure for day ${currentDayNumber}`
            );
          }
        }

        // Set loader messages for stay
        setConveyanceLoaderMessages([
          `Let's find stay options for day ${currentDayNumber}`,
          `Searching accommodations in ${stayCity}`,
          "Finding the best hotels",
          "Comparing prices and ratings",
        ]);

        console.log(`🏨 Setting auto-fill mode for StaysWidget:`, {
          stayCity,
          checkInDate: stayCheckInDate,
          checkOutDate: stayCheckOutDate,
          autoFillMode: true,
        });

        // Show loader
        setShowTripLoader(true);
        setIsParsingTrips(true);

        // Reset partial auto-fill mode
        setPartialAutoFillMode(false);

        // After 4 seconds, show stays widget
        setTimeout(() => {
          setShowTripLoader(false);

          setTimeout(() => {
            console.log(
              `🏨 Showing StaysWidget for day ${currentDayNumber} in ${stayCity} with auto-fill mode`
            );
            setIsParsingTrips(false);
            setShowStays(true);
          }, 700);
        }, 4000);

        return; // Exit early, show stay widget
      }

      // CASE 1: Current day requires stay
      if (
        currentDay.stay_details &&
        currentDay.stay_details.is_required === true
      ) {
        console.log(
          `✅ Day ${currentDayNumber} requires stay, showing loader...`
        );

        // Update selectedTrip with complete conveyance details
        const updatedTrip = { ...selectedTrip };
        const dayIndex = updatedTrip.day_wise_plan?.findIndex(
          (d: any) => d.day_number === currentDayNumber
        );

        if (dayIndex !== -1 && updatedTrip.day_wise_plan) {
          updatedTrip.day_wise_plan[dayIndex].conveyance_details = {
            is_required: true,
            from_city: selectedConveyanceData.from_city || conveyanceFromCity,
            to_city: selectedConveyanceData.to_city || conveyanceToCity,
            type: selectedConveyanceData.operator.includes("Train")
              ? "train"
              : selectedConveyanceData.operator.includes("Bus")
              ? "bus"
              : "flight",
            number: selectedConveyanceData.number,
            operator: selectedConveyanceData.operator,
            departure_date: selectedConveyanceData.departureDate,
            departure_time: selectedConveyanceData.departureTime,
            arrival_date: selectedConveyanceData.arrivalDate,
            arrival_time: selectedConveyanceData.arrivalTime,
            duration: selectedConveyanceData.duration,
            price: selectedConveyanceData.price,
          };

          // Store updated trip
          await storeSelectedTrip(userId, sessionId, updatedTrip);
          setSelectedTrip(updatedTrip);
          console.log(
            `✅ Updated selectedTrip with conveyance details for day ${currentDayNumber}`
          );
        }

        // Extract city for stay
        let stayCity = currentDay.stay_details.city || "";

        // Capitalize city name
        if (stayCity) {
          stayCity =
            stayCity.charAt(0).toUpperCase() + stayCity.slice(1).toLowerCase();
          if (stayCity === "Delhi") stayCity = "New Delhi";
        }

        setStayCity(stayCity);

        // Calculate check-in and check-out dates
        const tripDate = selectedTrip.trip_date; // Trip start date in YYYY-MM-DD format
        if (tripDate) {
          // Check-in day from stay_details or current day number
          const checkInDay =
            currentDay.stay_details.check_in_day || currentDayNumber;
          // Check-out day from stay_details or find next conveyance day
          let checkOutDay = currentDay.stay_details.check_out_day;

          if (!checkOutDay) {
            // Find next day with conveyance requirement
            const nextConveyanceDay = selectedTrip.day_wise_plan?.find(
              (d: any) =>
                d.day_number > currentDayNumber &&
                d.conveyance_details?.is_required === true
            );
            checkOutDay = nextConveyanceDay
              ? nextConveyanceDay.day_number
              : currentDayNumber + 1;
          }

          console.log(
            `📅 Check-in day: ${checkInDay}, Check-out day: ${checkOutDay}`
          );

          // Calculate actual dates
          const baseDate = new Date(tripDate);
          const checkInDate = new Date(baseDate);
          checkInDate.setDate(checkInDate.getDate() + (checkInDay - 1));
          const checkInDateStr = checkInDate.toISOString().split("T")[0];

          const checkOutDate = new Date(baseDate);
          checkOutDate.setDate(checkOutDate.getDate() + (checkOutDay - 1));
          const checkOutDateStr = checkOutDate.toISOString().split("T")[0];

          console.log(
            `📅 Check-in date: ${checkInDateStr}, Check-out date: ${checkOutDateStr}`
          );

          setStayCheckInDate(checkInDateStr);
          setStayCheckOutDate(checkOutDateStr);
          setAutoFillStaysMode(true); // Enable auto-fill mode
        }

        // Set loader messages for stay
        setConveyanceLoaderMessages([
          `Let's find stay options for day ${currentDayNumber}`,
          `Searching accommodations in ${stayCity}`,
          "Finding the best hotels",
          "Comparing prices and ratings",
        ]);

        console.log(`🏨 Setting auto-fill mode for StaysWidget:`, {
          stayCity,
          checkInDate: stayCheckInDate,
          checkOutDate: stayCheckOutDate,
          autoFillMode: true,
        });

        // Show loader
        setShowTripLoader(true);
        setIsParsingTrips(true);

        // After 4 seconds, show stays widget
        setTimeout(() => {
          setShowTripLoader(false);

          setTimeout(() => {
            console.log(
              `🏨 Showing StaysWidget for day ${currentDayNumber} in ${stayCity} with auto-fill mode: ${autoFillStaysMode}`
            );
            setIsParsingTrips(false);
            setShowStays(true);
          }, 700);
        }, 4000);

        return; // Exit early, show stay widget
      }

      // CASE 2: Current day does NOT require stay - pass conveyance data to itinerary API
      console.log(
        `❌ Day ${currentDayNumber} does not require stay - passing conveyance data to itinerary API`
      );

      // Update selectedTrip with complete conveyance details
      const updatedTrip = { ...selectedTrip };
      const dayIndex = updatedTrip.day_wise_plan?.findIndex(
        (d: any) => d.day_number === currentDayNumber
      );

      if (dayIndex !== -1 && updatedTrip.day_wise_plan) {
        updatedTrip.day_wise_plan[dayIndex].conveyance_details = {
          is_required: true,
          from_city: selectedConveyanceData.from_city || conveyanceFromCity,
          to_city: selectedConveyanceData.to_city || conveyanceToCity,
          type: selectedConveyanceData.operator.includes("Train")
            ? "train"
            : selectedConveyanceData.operator.includes("Bus")
            ? "bus"
            : "flight",
          number: selectedConveyanceData.number,
          operator: selectedConveyanceData.operator,
          departure_date: selectedConveyanceData.departureDate,
          departure_time: selectedConveyanceData.departureTime,
          arrival_date: selectedConveyanceData.arrivalDate,
          arrival_time: selectedConveyanceData.arrivalTime,
          duration: selectedConveyanceData.duration,
          price: selectedConveyanceData.price,
        };

        // Store updated trip
        await storeSelectedTrip(userId, sessionId, updatedTrip);
        setSelectedTrip(updatedTrip);
        console.log(
          `✅ Updated selectedTrip with conveyance details for day ${currentDayNumber}`
        );
      }

      // Build current_itinerary for current day with conveyance only
      // Use updated trip data
      const updatedCurrentDay = updatedTrip.day_wise_plan[dayIndex];
      const currentItineraryDay = {
        day_number: currentDayNumber,
        conveyance_details: updatedCurrentDay.conveyance_details,
        // Include other day info if present
        ...(currentDay.must_do_activities && {
          must_do_activities: currentDay.must_do_activities,
        }),
        ...(currentDay.places_to_visit && {
          places_to_visit: currentDay.places_to_visit,
        }),
        ...(currentDay.stay_details && {
          stay_details: currentDay.stay_details,
        }),
      };

      console.log(
        "📤 Building complete day itinerary (conveyance only):",
        currentItineraryDay
      );

      // Store day itinerary in Firestore
      await storeDayItinerary(
        userId,
        sessionId,
        currentItineraryDay as DayItineraryData
      );
      console.log(`✅ Stored day ${currentDayNumber} itinerary in Firestore`);

      // Clear temporary conveyance selection
      setTempConveyanceSelection(null);

      // Call itinerary API (will retrieve complete itinerary from Firestore)
      console.log("📞 Calling itinerary API for day", currentDayNumber);
      await callItineraryAPI(currentDayNumber, true);
    } catch (error) {
      console.error("❌ Error handling conveyance selection:", error);
      alert("Failed to save conveyance selection. Please try again.");
    }
  };

  // Handle continue action from StaysWidget with selected stay data
  const handleStaysContinue = async (selectedStayData?: any) => {
    console.log(
      "🚀 Continue clicked from StaysWidget with data:",
      selectedStayData
    );

    if (!selectedStayData) {
      console.error("❌ No stay data selected");
      alert("Please select a stay option before continuing.");
      return;
    }

    if (!selectedTrip || !userId || !sessionId) {
      console.error("❌ Missing required data for stay selection");
      return;
    }

    if (!tempConveyanceSelection) {
      console.error("❌ No conveyance data found in temporary storage");
      alert("Missing conveyance data. Please try again.");
      return;
    }

    try {
      console.log(
        `💾 Processing day ${currentDayNumber} with conveyance and stay`
      );
      console.log(`📦 Temp conveyance:`, tempConveyanceSelection);
      console.log(`🏨 Stay data:`, selectedStayData);

      // Find current day in trip plan
      const currentDay = selectedTrip.day_wise_plan?.find(
        (d: any) => d.day_number === currentDayNumber
      );

      if (!currentDay) {
        console.error(
          `❌ Could not find day ${currentDayNumber} in day_wise_plan`
        );
        return;
      }

      // Build current_itinerary for current day with BOTH conveyance and stay
      // Check if this is a newly added day (should only have minimal structure)
      const isNewDay = currentDay.is_new_day === true;

      console.log(`🔍 Day ${currentDayNumber} is_new_day flag:`, isNewDay);

      // For newly added days, ONLY include day_number, conveyance_details, and stay_details
      // For regular days, include all available information
      const currentItineraryDay: any = {
        day_number: currentDayNumber,
        conveyance_details: {
          is_required: true,
          from_city: currentDay.conveyance_details.from_city,
          to_city: currentDay.conveyance_details.to_city,
          type: tempConveyanceSelection.operator.includes("Train")
            ? "train"
            : tempConveyanceSelection.operator.includes("Bus")
            ? "bus"
            : "flight",
          number: tempConveyanceSelection.number,
          operator: tempConveyanceSelection.operator,
          departure_date: tempConveyanceSelection.departureDate,
          departure_time: tempConveyanceSelection.departureTime,
          arrival_date: tempConveyanceSelection.arrivalDate,
          arrival_time: tempConveyanceSelection.arrivalTime,
          duration: tempConveyanceSelection.duration,
          price: tempConveyanceSelection.price,
          selected_from_city: conveyanceFromCity,
          selected_to_city: conveyanceToCity,
        },
        stay_details: {
          is_required: true,
          city: currentDay.stay_details.city,
          check_in_day: currentDay.stay_details.check_in_day,
          check_out_day: currentDay.stay_details.check_out_day,
          property_name: selectedStayData.property_name,
          property_address: selectedStayData.property_address,
          property_location: selectedStayData.property_location,
          state: selectedStayData.state,
          country: selectedStayData.country,
          overall_rating: selectedStayData.overall_rating,
          starting_price: selectedStayData.starting_price,
          currency: selectedStayData.currency,
          available_rooms_total: selectedStayData.available_rooms_total,
          available_from_date: selectedStayData.available_from_date,
          available_until_date: selectedStayData.available_until_date,
        },
      };

      // Only include additional fields if this is NOT a newly added day
      if (!isNewDay) {
        if (currentDay.must_do_activities) {
          currentItineraryDay.must_do_activities =
            currentDay.must_do_activities;
        }
        if (currentDay.places_to_visit) {
          currentItineraryDay.places_to_visit = currentDay.places_to_visit;
        }
        console.log(
          `📝 Including additional fields for existing day ${currentDayNumber}`
        );
      } else {
        console.log(
          `📝 Minimal structure for newly added day ${currentDayNumber} (conveyance + stay only)`
        );
      }

      console.log(
        "📤 Building complete day itinerary (conveyance + stay):",
        currentItineraryDay
      );

      // Store day itinerary in Firestore
      await storeDayItinerary(
        userId,
        sessionId,
        currentItineraryDay as DayItineraryData
      );
      console.log(`✅ Stored day ${currentDayNumber} itinerary in Firestore`);

      // Update selectedTrip with complete stay details
      const updatedTrip = { ...selectedTrip };
      const dayIndex = updatedTrip.day_wise_plan?.findIndex(
        (d: any) => d.day_number === currentDayNumber
      );

      if (dayIndex !== -1 && updatedTrip.day_wise_plan) {
        updatedTrip.day_wise_plan[dayIndex].stay_details = {
          ...currentItineraryDay.stay_details,
        };

        // Store updated trip
        await storeSelectedTrip(userId, sessionId, updatedTrip);
        setSelectedTrip(updatedTrip);
        console.log(
          `✅ Updated selectedTrip with stay details for day ${currentDayNumber}`
        );
      }

      // Update itinerariesGenerated with the new day's conveyance and stay details
      if (isNewDay) {
        console.log(
          `📦 Updating itinerariesGenerated for new day ${currentDayNumber}`
        );
        const updatedItinerariesGenerated = [...itinerariesGenerated];
        const dayIndex = updatedItinerariesGenerated.findIndex(
          (it) => it.day_number === currentDayNumber
        );

        if (dayIndex !== -1) {
          // Update the placeholder with actual data
          updatedItinerariesGenerated[dayIndex] = {
            day_number: currentDayNumber,
            conveyance_details: currentItineraryDay.conveyance_details,
            stay_details: currentItineraryDay.stay_details,
          };
          setItinerariesGenerated(updatedItinerariesGenerated);
          console.log(
            `✅ Updated itinerariesGenerated for day ${currentDayNumber}`
          );
        }
      }

      // Skip adding chat message for add day flow
      // Check if this is from add day flow by looking at the day's is_new_day flag
      if (!isNewDay) {
        const stayMessage = {
          id: Date.now().toString(),
          content: `Selected ${selectedStayData.property_name} for Day ${currentDayNumber} in ${selectedStayData.city}`,
          role: "user" as const,
          timestamp: new Date(),
          metadata: {
            action: "stay_selected",
            day_number: currentDayNumber,
            stay: selectedStayData,
          },
        };

        setMessages((prev) => [...prev, stayMessage]);
      } else {
        console.log("📝 Skipping chat message for add day flow");
      }

      // Clear temporary conveyance selection
      setTempConveyanceSelection(null);

      // Close stays widget
      setShowStays(false);

      // For add day flow, show loader before calling itinerary API
      if (isNewDay) {
        console.log(
          `📝 Add day flow - showing loader before itinerary generation`
        );

        // Set loader messages for itinerary generation
        setConveyanceLoaderMessages([
          `Creating your detailed itinerary for day ${currentDayNumber}`,
          "Analyzing your preferences and selections",
          "Optimizing your schedule",
          "Adding personalized recommendations",
        ]);

        setShowTripLoader(true);
        setIsParsingTrips(true);

        // Get the updated itinerariesGenerated array after adding conveyance/stay
        const updatedItinerariesGeneratedForAPI = [...itinerariesGenerated];
        const apiDayIndex = updatedItinerariesGeneratedForAPI.findIndex(
          (it) => it.day_number === currentDayNumber
        );
        if (apiDayIndex !== -1) {
          updatedItinerariesGeneratedForAPI[apiDayIndex] = {
            day_number: currentDayNumber,
            conveyance_details: currentItineraryDay.conveyance_details,
            stay_details: currentItineraryDay.stay_details,
          };
        }

        // Wait for loader to show, then call API with fresh data
        setTimeout(async () => {
          // Check if this is insert flow (CASE 1)
          if (isInsertDayFlow) {
            console.log(
              `📞 Calling INSERT itinerary API for day ${currentDayNumber} (CASE 1: with conveyance)`
            );
            console.log(`📦 Using request_type="add" with day number shifting`);
            // Call insert API with special logic
            await callItineraryAPIForInsert(
              currentDayNumber,
              updatedTrip,
              updatedItinerariesGeneratedForAPI
            );
          } else {
            console.log(
              `📞 Calling itinerary API for day ${currentDayNumber} (regular add day flow)`
            );
            console.log(`📦 Passing updatedTrip and updatedItineraries to API`);
            // Regular add day flow (extend trip)
            await callItineraryAPI(
              currentDayNumber,
              true,
              true,
              updatedTrip, // Pass fresh trip data
              updatedItinerariesGeneratedForAPI // Pass fresh itineraries data
            );
          }
        }, 500);
      } else {
        // Regular flow (not add day)
        console.log(
          `📞 Calling itinerary API for day ${currentDayNumber} (regular flow)`
        );
        await callItineraryAPI(
          currentDayNumber,
          true,
          false,
          updatedTrip // Pass fresh trip data
        );
      }
    } catch (error) {
      console.error("❌ Error handling stay selection:", error);
      alert("Failed to save stay selection. Please try again.");
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Special handling when a trip is selected
    if (selectedTrip && showFlashcards) {
      await handleTripMemoryUpdate();
      return;
    }

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

      // Check if we should simulate end response for testing
      const data = testEndResponse
        ? simulateEndResponse()
        : await makeAPICall(currentInput);

      // Reset test flag after use
      if (testEndResponse) {
        setTestEndResponse(false);
      }

      // Check if response contains trip suggestions
      let parsedTripSuggestions: any[] = [];
      let shouldShowPlaces = false;
      let messageContent = "";

      // Enhanced trip detection - Check for trip response at ANY level
      const isTripResponse =
        data.response_type === "trip" ||
        (data.message &&
          typeof data.message === "object" &&
          data.message.response_type === "trip");

      // Enhanced end response detection - Check for end response at ANY level
      const isEndResponse =
        data.response_type === "end" ||
        (data.message &&
          typeof data.message === "object" &&
          data.message.response_type === "end");

      try {
        console.log("Full API response data:", JSON.stringify(data, null, 2));

        // Debug logging for end response detection
        console.log("🔍 End response detection:", {
          root_response_type: data.response_type,
          nested_response_type: data.message?.response_type,
          isEndResponse: isEndResponse,
          full_data_structure: JSON.stringify(data, null, 2),
        });

        // Show trip loader IMMEDIATELY for ANY trip response detected
        if (isTripResponse) {
          console.log("🎯 Trip response detected - showing loader immediately");
          console.log("🎯 Response data:", {
            root_response_type: data.response_type,
            nested_response_type: data.message?.response_type,
          });

          // Force loader to show immediately
          setShowTripLoader(true);
          setIsParsingTrips(true);

          // Safety check - ensure loader stays visible for minimum duration
          setTimeout(() => {
            console.log("🎯 Safety check: Ensuring loader is still visible");
            if (!showTripLoader) {
              console.log(
                "🎯 Safety: Loader was hidden prematurely, re-showing"
              );
              setShowTripLoader(true);
            }
          }, 100);
        }
        // Show end loader IMMEDIATELY for ANY end response detected
        else if (isEndResponse) {
          console.log(
            "🎯 End response detected - showing end loader immediately"
          );
          messageContent = "Let's call the smart date recommender now";
          console.log("🎯 End response data:", {
            root_response_type: data.response_type,
            nested_response_type: data.message?.response_type,
          });

          // Force end loader to show immediately
          setShowEndLoader(true);

          // Safety check - ensure loader stays visible for minimum duration
          setTimeout(() => {
            console.log(
              "🎯 Safety check: Ensuring end loader is still visible"
            );
            if (!showEndLoader) {
              console.log(
                "🎯 Safety: End loader was hidden prematurely, re-showing"
              );
              setShowEndLoader(true);
            }
          }, 100);
        } else {
          console.log("❌ No trip or end response detected", {
            root_response_type: data.response_type,
            nested_response_type: data.message?.response_type,
          });
        }

        // Handle different response structures
        // Case 1: Response type at root level (new format from temp.json)
        if (data.response_type === "end") {
          console.log("Detected end response at root level");
          // Handle empty message case with custom text
          if (data.message === "" || !data.message) {
            messageContent = "Let's call the smart date recommender now";
          } else {
            messageContent =
              (typeof data.message === "object"
                ? data.message.message
                : data.message) || "Let's finalize your travel dates";
          }
        }
        // Case 2: Trip response at root level (new format from temp.json)
        else if (data.response_type === "trip" && data.message) {
          console.log(
            "Detected trip response at root level (temp.json format)"
          );

          messageContent =
            (typeof data.message === "object"
              ? data.message.message
              : data.message) ||
            "Here are some amazing trip suggestions for you!";

          // Extract trip suggestions directly from data.message.trips
          if (data.message.trips && Array.isArray(data.message.trips)) {
            // Store original trips before validation
            setOriginalTrips(cleanupTripData(data.message.trips));

            // Validate and populate missing fields
            parsedTripSuggestions = validateAndPopulateTripData(
              data.message.trips
            );
            shouldShowPlaces = true;

            console.log(
              `Parsed ${parsedTripSuggestions.length} trip suggestions from root level (data.message.trips)`
            );
            console.log("Validated trip suggestions:", parsedTripSuggestions);
          }
        }
        // Case 3: Response with trip_suggestions wrapper
        else if (data.response_type === "trip" && data.trip_suggestions) {
          console.log("Detected trip response with trip_suggestions wrapper");

          messageContent =
            (typeof data.trip_suggestions.message === "object"
              ? data.trip_suggestions.message.message
              : data.trip_suggestions.message) ||
            "Here are some amazing trip suggestions for you!";

          // Extract trip suggestions
          if (
            data.trip_suggestions.trips &&
            Array.isArray(data.trip_suggestions.trips)
          ) {
            // Store original trips before validation
            setOriginalTrips(cleanupTripData(data.trip_suggestions.trips));

            // Validate and populate missing fields
            parsedTripSuggestions = validateAndPopulateTripData(
              data.trip_suggestions.trips
            );
            shouldShowPlaces = true;

            console.log(
              `Parsed ${parsedTripSuggestions.length} trip suggestions from trip_suggestions wrapper`
            );
            console.log("Validated trip suggestions:", parsedTripSuggestions);
          }
        }
        // Case 4: Response nested under data.message (old format)
        else if (data.message && typeof data.message === "object") {
          const messageData = data.message;

          console.log("Checking nested message format");

          if (messageData.response_type === "text" && messageData.message) {
            console.log("Detected text response");
            messageContent =
              typeof messageData.message === "string"
                ? messageData.message
                : messageData.message.message || "Text response received";
          } else if (messageData.response_type === "end") {
            console.log("Detected end response in nested format");
            // Handle empty message case with custom text
            if (messageData.message === "" || !messageData.message) {
              messageContent = "Let's call the smart date recommender now";
            } else {
              messageContent =
                typeof messageData.message === "string"
                  ? messageData.message
                  : messageData.message.message ||
                    "Let's finalize your travel dates";
            }
          } else if (messageData.response_type === "trip") {
            console.log("Detected trip response in nested format");
            console.log("messageData structure:", Object.keys(messageData));

            messageContent =
              (typeof messageData.message === "object"
                ? messageData.message.message
                : messageData.message) ||
              "Here are some amazing trip suggestions for you!";

            // Case A: trips array directly under messageData (actual current API format)
            if (messageData.trips && Array.isArray(messageData.trips)) {
              console.log("Found trips array directly under messageData");
              // Store original trips before validation
              setOriginalTrips(cleanupTripData(messageData.trips));

              // Validate and populate missing fields
              parsedTripSuggestions = validateAndPopulateTripData(
                messageData.trips
              );
              shouldShowPlaces = true;

              console.log(
                `Parsed ${parsedTripSuggestions.length} trip suggestions from messageData.trips`
              );
              console.log("Validated trip suggestions:", parsedTripSuggestions);
            }
            // Case B: trips nested under trip_suggestions (alternative format)
            else if (messageData.trip_suggestions) {
              console.log(
                "Trip suggestions detected in response:",
                messageData.trip_suggestions
              );

              // Extract trip suggestions
              if (
                messageData.trip_suggestions.trips &&
                Array.isArray(messageData.trip_suggestions.trips)
              ) {
                // Store original trips before validation
                setOriginalTrips(
                  cleanupTripData(messageData.trip_suggestions.trips)
                );

                // Validate and populate missing fields
                parsedTripSuggestions = validateAndPopulateTripData(
                  messageData.trip_suggestions.trips
                );
                shouldShowPlaces = true;

                console.log(
                  `Parsed ${parsedTripSuggestions.length} trip suggestions from messageData.trip_suggestions.trips`
                );
                console.log(
                  "Validated trip suggestions:",
                  parsedTripSuggestions
                );
              }
            } else {
              console.warn("No trips array found in trip response!");
            }
          } else {
            // Fallback for other response types
            console.log("Using fallback message content");
            messageContent =
              (typeof messageData.message === "string"
                ? messageData.message
                : null) || JSON.stringify(messageData);
          }
        }
        // Case 5: String response (old format)
        else if (typeof data.message === "string") {
          messageContent = data.message;
        }
        // Case 6: Fallback
        else {
          messageContent =
            "Sorry, I couldn't process your request. Please try again.";
        }
      } catch (parseError) {
        console.error("Error parsing message data:", parseError);
        messageContent =
          "Sorry, I couldn't process your request. Please try again.";
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: messageContent,
        role: "assistant" as const,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Handle trip response with loader timing
      const detectedTripResponse =
        data.response_type === "trip" ||
        (data.message &&
          typeof data.message === "object" &&
          data.message.response_type === "trip");

      if (detectedTripResponse) {
        const loaderStartTime = Date.now();
        const minLoaderDuration = 4000; // Minimum 4 seconds display time

        console.log("🎯 Starting trip loader for 4 seconds minimum");

        // If trip suggestions were found, process them
        if (shouldShowPlaces && parsedTripSuggestions.length > 0) {
          // Extract all image URLs from trip suggestions
          const imageUrls = extractImageUrls(parsedTripSuggestions);
          console.log(`Found ${imageUrls.length} images to download`);

          // Download images in the background while showing loader
          const downloadPromise = imageDownloader
            .downloadImages(imageUrls)
            .then((downloadedImages) => {
              console.log(
                `Successfully downloaded ${downloadedImages.size} images`
              );
              return downloadedImages;
            })
            .catch((error) => {
              console.error("Error downloading images:", error);
              return new Map<string, string>(); // Return empty map on error
            });

          // Transform the trip data to match FlashcardsWidget's expected format
          const transformedTrips = transformTripData(parsedTripSuggestions);

          console.log("Original trip suggestions:", parsedTripSuggestions);
          console.log("Transformed trip suggestions:", transformedTrips);

          // Wait for both images and minimum loader duration
          Promise.all([
            Promise.race([
              downloadPromise,
              new Promise((resolve) => setTimeout(resolve, 5000)), // Max 5 seconds wait for images
            ]),
            new Promise((resolve) => setTimeout(resolve, minLoaderDuration)), // Minimum loader duration
          ]).then(() => {
            setTripSuggestions(transformedTrips);

            console.log(
              "🎯 Trip loader minimum duration completed, hiding loader"
            );

            // Hide trip loader with dissolving effect and show flashcards
            setTimeout(() => {
              setShowTripLoader(false);

              setTimeout(() => {
                // Automatically show the places widget after loader dissolves
                setShowFlashcards(true);
                setShowFlights(false);
                setShowStays(false);
                setShowItinerary(false);
                // Keep selectedTrip for potential future use - don't clear it here
                setIsParsingTrips(false);

                // Clear selection in flashcards widget
                if (flashcardsRef.current) {
                  flashcardsRef.current.clearSelection();
                }

                console.log("Places widget activated with trip suggestions");
              }, 400); // Wait for dissolve animation
            }, 100); // Small buffer before hiding loader
          });
        } else {
          // Trip response but no valid trip suggestions found
          console.log(
            "🎯 Trip response detected but no valid suggestions found"
          );

          // Still show loader for minimum duration, then hide
          setTimeout(() => {
            console.log(
              "🎯 Trip loader duration completed, hiding loader (no suggestions)"
            );
            setShowTripLoader(false);
            setIsParsingTrips(false);
          }, minLoaderDuration);
        }
      }
      // Handle end response detection and flow
      else if (isEndResponse) {
        console.log("🎯 End response detected - showing EndResponseLoader");
        console.log("🎯 End response data:", {
          root_response_type: data.response_type,
          nested_response_type: data.message?.response_type,
          message_content: messageContent,
        });

        const loaderStartTime = Date.now();
        const minLoaderDuration = 4000; // Minimum 4 seconds display time

        console.log("🎯 Starting end loader for 4 seconds minimum");

        // Wait for minimum loader duration
        setTimeout(() => {
          console.log(
            "🎯 End loader minimum duration completed, hiding loader"
          );

          // Hide end loader with dissolving effect and show date selector
          setTimeout(() => {
            setShowEndLoader(false);

            setTimeout(() => {
              // Automatically show the date selector widget after loader dissolves
              setShowDateSelector(true);
              setShowFlashcards(false);
              setShowFlights(false);
              setShowStays(false);
              setShowItinerary(false);
              // Keep selectedTrip for DateSelector auto-fill - don't set to null

              // Clear selection in flashcards widget
              if (flashcardsRef.current) {
                flashcardsRef.current.clearSelection();
              }

              console.log("Date selector widget activated after end response");
            }, 400); // Wait for dissolve animation
          }, 100); // Small buffer before hiding loader
        }, minLoaderDuration);
      } else {
        // Non-trip, non-end response - hide loaders immediately
        setIsParsingTrips(false);
        setShowTripLoader(false);
        setShowEndLoader(false);
      }
    } catch (error) {
      console.error("Error calling API:", error);

      let errorContent =
        "I'm sorry, I'm having trouble right now. Please try again.";

      if (error instanceof Error && error.name === "AbortError") {
        errorContent = "Request timeout - Please try again.";
      } else if (error instanceof Error) {
        errorContent = `Error: ${error.message}`;
      }

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        role: "assistant" as const,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      // Hide loaders on error
      setIsParsingTrips(false);
      setShowTripLoader(false);
      setShowEndLoader(false);
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

  // Transform trip data from API format to FlashcardsWidget format
  const transformTripData = (trips: any[]): any[] => {
    console.log("=== TRANSFORMING TRIPS DATA ===");
    console.log("Number of trips to transform:", trips.length);

    return trips.map((trip, tripIdx) => {
      // console.log(
      //   `\n--- Processing trip ${tripIdx + 1}: ${trip.trip_title} ---`
      // );
      // console.log("Raw trip data:", JSON.stringify(trip, null, 2));

      // Create a map of cities from trip_route
      const cityMap = new Map();
      if (trip.trip_route && Array.isArray(trip.trip_route)) {
        // console.log(`Trip route has ${trip.trip_route.length} cities`);
        trip.trip_route.forEach((city: any) => {
          const cityData = {
            name: city.place_name || city.name,
            address: city.address || city.place_name || city.name,
            map_url: city.map_url || "",
            lat: city.lat || "0",
            long: city.long || "0",
            photos: city.photos || [],
            place_id: city.place_id || "",
          };
          cityMap.set(city.place_name || city.name, cityData);
          // console.log(
          //   `  - Mapped city: ${city.place_name || city.name}`,
          //   cityData
          // );
        });
      } else {
        console.log(
          "No trip_route found in trip data - will create from day_wise_plan"
        );
      }

      // Transform day_wise_plan to include cities
      const transformedDayPlan =
        trip.day_wise_plan?.map((day: any) => {
          const cities: any[] = [];
          let cityName = null;

          // console.log(`  Day ${day.day_number}:`);
          // console.log(`    - stay_details:`, day.stay_details);
          // console.log(`    - conveyance_details:`, day.conveyance_details);

          // Extract city name with priority: stay_details > conveyance to_city
          if (
            day.stay_details?.is_required &&
            day.stay_details?.city &&
            day.stay_details.city !== "user_location"
          ) {
            cityName = day.stay_details.city;
            // console.log(`    - City from stay_details: ${cityName}`);
          } else if (
            day.conveyance_details?.is_required &&
            day.conveyance_details?.to_city &&
            day.conveyance_details.to_city !== "user_location"
          ) {
            cityName = day.conveyance_details.to_city;
            // console.log(`    - City from conveyance to_city: ${cityName}`);
          } else if (
            day.conveyance_details?.is_required &&
            day.conveyance_details?.from_city &&
            day.conveyance_details?.to_city &&
            day.conveyance_details.from_city ===
              day.conveyance_details.to_city &&
            day.conveyance_details.to_city !== "user_location"
          ) {
            cityName = day.conveyance_details.to_city;
            // console.log(`    - City from same from/to city: ${cityName}`);
          } else if (
            day.conveyance_details?.is_required &&
            day.conveyance_details?.from_city &&
            day.conveyance_details.from_city !== "user_location"
          ) {
            cityName = day.conveyance_details.from_city;
            // console.log(`    - City from conveyance from_city: ${cityName}`);
          }

          if (cityName) {
            const cityInfo = cityMap.get(cityName);

            if (cityInfo) {
              cities.push(cityInfo);
              // console.log(`    - Added city info from map: ${cityName}`);
            } else {
              // Create a basic city info if not found in trip_route
              const basicCityInfo = {
                name: cityName,
                address: cityName,
                map_url: "",
                lat: "0",
                long: "0",
                photos: [],
                place_id: "",
              };
              cities.push(basicCityInfo);
              // console.log(`    - Created basic city info for: ${cityName}`);
            }
          } else {
            // console.log(
            //   `    - No city found for day ${day.day_number} - checking activities`
            // );
          }

          // If no city found yet, try to infer from must_do_activities or trip_route
          if (
            cities.length === 0 &&
            day.must_do_activities &&
            day.must_do_activities.length > 0
          ) {
            // Use trip_route cities if available
            if (trip.trip_route && trip.trip_route.length > 0) {
              const firstCity = trip.trip_route[0];
              const fallbackCity = {
                name: firstCity.place_name || firstCity.name,
                address:
                  firstCity.address || firstCity.place_name || firstCity.name,
                map_url: firstCity.map_url || "",
                lat: firstCity.lat || "0",
                long: firstCity.long || "0",
                photos: firstCity.photos || [],
                place_id: firstCity.place_id || "",
              };
              cities.push(fallbackCity);
              console.log(
                `    - Fallback: Using first city from trip_route: ${fallbackCity.name}`
              );
            }
          }

          return {
            day_number: day.day_number,
            cities: cities,
            must_do_activities: day.must_do_activities || [],
            conveyance_details: day.conveyance_details, // Include original conveyance details
            stay_details: day.stay_details, // Include original stay details
          };
        }) || [];

      console.log(
        `Transformed ${transformedDayPlan.length} days for trip ${tripIdx + 1}`
      );

      // Return transformed trip with theme instead of themes AND trip_route
      const transformed = {
        trip_title: trip.trip_title,
        no_of_days: trip.no_of_days,
        estimated_budget: trip.estimated_budget,
        best_time_to_visit: trip.best_time_to_visit,
        theme: trip.themes || trip.theme || [], // Handle both 'themes' and 'theme'
        themes: trip.themes || trip.theme || [], // Include both for compatibility
        trip_route: trip.trip_route || [], // CRITICAL: Include trip_route for photos and map
        day_wise_plan: transformedDayPlan,
      };

      console.log(`Final transformed trip ${tripIdx + 1}:`);
      console.log("  - trip_title:", transformed.trip_title);
      console.log("  - no_of_days:", transformed.no_of_days);
      console.log("  - estimated_budget:", transformed.estimated_budget);
      console.log("  - best_time_to_visit:", transformed.best_time_to_visit);
      console.log("  - theme:", transformed.theme);
      console.log("  - themes:", transformed.themes);
      console.log(
        "  - trip_route length:",
        transformed.trip_route?.length || 0
      );
      console.log(
        "  - day_wise_plan length:",
        transformed.day_wise_plan.length
      );

      return transformed;
    });
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

  // TripLoader component moved to separate file

  if (!currentUser) {
    return null; // This shouldn't happen due to the parent component's validation
  }

  return (
    <div className="h-screen w-screen bg-white flex overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={logout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white min-h-0 min-w-0 max-w-full overflow-hidden">
        {/* Conditional rendering based on active section */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 max-w-full overflow-hidden transition-all duration-500 ease-in-out">
          {activeSection === "dashboard" ? (
            <DashboardContent
              currentUser={currentUser}
              showProfileDropdown={showProfileDropdown}
              setShowProfileDropdown={setShowProfileDropdown}
              onSettings={() => router.push("/flights/settings")}
              onLogout={logout}
            />
          ) : activeSection === "chat" ? (
            // Chat Content - Fixed height container with proper scrolling
            <div className="flex-1 flex flex-col bg-white min-h-0 min-w-0 max-w-full overflow-hidden">
              <ChatNavbar
                currentUser={currentUser}
                showProfileDropdown={showProfileDropdown}
                setShowProfileDropdown={setShowProfileDropdown}
                onSettings={() => router.push("/flights/settings")}
                onLogout={logout}
                showFlashcards={showFlashcards}
                showFlights={showFlights}
                showStays={showStays}
                showItinerary={showItinerary}
                showDateSelector={showDateSelector}
                showDebug={showDebug}
                testEndResponse={testEndResponse}
                onTestEndResponseToggle={() => {
                  setTestEndResponse(!testEndResponse);
                  console.log(
                    "🧪 Test End Response toggled:",
                    !testEndResponse
                  );
                }}
                onFlashcardsToggle={() => {
                  if (showFlashcards) {
                    setShowFlashcards(false);
                    // Keep selectedTrip for other widgets that might need it
                    if (flashcardsRef.current) {
                      flashcardsRef.current.clearSelection();
                    }
                  } else {
                    console.log(
                      "Places toggle: Showing trip loader for 4 seconds"
                    );
                    setShowTripLoader(true);
                    setIsParsingTrips(true);
                    setShowFlights(false);
                    setShowStays(false);
                    setShowItinerary(false);
                    setShowDateSelector(false);

                    setTimeout(() => {
                      setShowTripLoader(false);
                      setTimeout(() => {
                        setShowFlashcards(true);
                        setIsParsingTrips(false);
                        console.log(
                          "Places toggle: Flashcards activated after 4 second loader"
                        );
                      }, 400);
                    }, 4000);
                  }
                }}
                onFlightsToggle={() => {
                  setShowFlights(!showFlights);
                  if (!showFlights) {
                    setShowFlashcards(false);
                    setShowStays(false);
                    setShowItinerary(false);
                    setShowDateSelector(false);
                    // setSelectedTrip(null);
                    if (flashcardsRef.current) {
                      flashcardsRef.current.clearSelection();
                    }
                  }
                }}
                onStaysToggle={() => {
                  setShowStays(!showStays);
                  if (!showStays) {
                    setShowFlashcards(false);
                    setShowFlights(false);
                    setShowItinerary(false);
                    setShowDateSelector(false);
                    // setSelectedTrip(null);
                    if (flashcardsRef.current) {
                      flashcardsRef.current.clearSelection();
                    }
                  }
                }}
                onItineraryToggle={() => {
                  setShowItinerary(!showItinerary);
                  if (!showItinerary) {
                    setShowFlashcards(false);
                    setShowFlights(false);
                    setShowStays(false);
                    setShowDateSelector(false);
                    // setSelectedTrip(null);
                    if (flashcardsRef.current) {
                      flashcardsRef.current.clearSelection();
                    }
                  }
                }}
                onDateSelectorToggle={() => {
                  setShowDateSelector(!showDateSelector);
                  if (!showDateSelector) {
                    setShowFlashcards(false);
                    setShowFlights(false);
                    setShowStays(false);
                    setShowItinerary(false);
                    // setSelectedTrip(null);
                    if (flashcardsRef.current) {
                      flashcardsRef.current.clearSelection();
                    }
                  }
                }}
                onDebugToggle={() => setShowDebug(!showDebug)}
              />

              {/* Chat Container - Scrollable messages area with fixed input */}
              <div className="flex-1 flex flex-col min-h-0">
                {showItinerary ? (
                  <div className="flex-1 overflow-hidden">
                    <ItineraryWidget
                      isVisible={showItinerary}
                      onToggle={() => setShowItinerary(false)}
                      onOpenChat={() => {
                        setShowItinerary(false);
                        setTimeout(() => {
                          if (textareaRef.current) {
                            textareaRef.current.focus();
                          }
                        }, 100);
                      }}
                      itineraryResponse={itineraryData}
                      onRequestNextDay={handleRequestNextDay}
                      totalDays={selectedTrip?.day_wise_plan?.length || 1}
                      isLoadingNextDay={isLoadingItinerary}
                      onAddDay={handleAddDay}
                      navigateToDayNumber={navigateToDay}
                    />
                  </div>
                ) : showDateSelector ? (
                  <div className="flex-1 overflow-hidden">
                    <DateSelectorWidget
                      isVisible={showDateSelector}
                      onToggle={() => setShowDateSelector(false)}
                      onDateSelected={handleDateSelection}
                      userId={userId}
                      sessionId={sessionId}
                      selectedTrip={selectedTrip}
                    />
                  </div>
                ) : (
                  <>
                    {/* Messages Container - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 relative min-h-0">
                      {/* Trip Loader */}
                      <TripLoader
                        showTripLoader={showTripLoader}
                        duration={4000}
                        customMessages={
                          conveyanceLoaderMessages.length > 0
                            ? conveyanceLoaderMessages
                            : undefined
                        }
                      />
                      {/* End Response Loader */}
                      <EndResponseLoader
                        showEndLoader={showEndLoader}
                        duration={4000}
                      />

                      {/* Test Mode Indicator */}
                      {testEndResponse && (
                        <div className="absolute top-4 right-4 z-40 bg-orange-100 border border-orange-300 rounded-lg px-3 py-2 shadow-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-orange-700">
                              🧪 Test Mode: End Response Active
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="max-w-4xl mx-auto h-full">
                        {showFlights ? (
                          <div className="h-full flex flex-col relative">
                            <div className="flex-1 min-h-0 overflow-hidden">
                              <FlightsWidget
                                isVisible={showFlights}
                                onToggle={() => setShowFlights(false)}
                                initialFromCity={conveyanceFromCity}
                                initialToCity={conveyanceToCity}
                                initialDepartureDate={initialDepartureDate}
                                autoFillMode={autoFillMode}
                                partialAutoFillMode={partialAutoFillMode}
                                userId={userId}
                                sessionId={sessionId}
                                currentDayNumber={currentDayNumber}
                                onContinue={handleFlightsContinue}
                              />
                            </div>
                          </div>
                        ) : showStays ? (
                          <div className="h-full flex flex-col relative">
                            <div className="flex-1 min-h-0 overflow-hidden">
                              <StaysWidget
                                isVisible={showStays}
                                onToggle={() => setShowStays(false)}
                                initialCity={stayCity}
                                initialCheckInDate={stayCheckInDate}
                                initialCheckOutDate={stayCheckOutDate}
                                autoFillMode={autoFillStaysMode}
                                userId={userId}
                                sessionId={sessionId}
                                currentDayNumber={currentDayNumber}
                                onContinue={handleStaysContinue}
                              />
                            </div>
                          </div>
                        ) : showFlashcards ? (
                          <div className="h-full flex flex-col relative">
                            <div className="flex-1 min-h-0 bg-white rounded-xl border border-blue-200 overflow-hidden shadow-lg">
                              <FlashcardsWidgetWhiteTheme
                                ref={flashcardsRef}
                                isVisible={showFlashcards}
                                onToggle={() => {
                                  setShowFlashcards(false);
                                  // setSelectedTrip(null);
                                }}
                                trips={
                                  tripSuggestions.length > 0
                                    ? tripSuggestions
                                    : undefined
                                }
                                rightPanelCollapsed={true}
                                onTripSelect={handleTripSelect}
                              />
                            </div>
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                            {isInitializingSession ? (
                              // Loading state when session is being initialized
                              <div className="text-center">
                                <div className="relative w-16 h-16 mx-auto mb-4">
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl animate-spin opacity-20"></div>
                                  <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                  </div>
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                  Initializing your session...
                                </h2>
                                <p className="text-gray-500 text-sm">
                                  Please wait while we set things up
                                </p>
                              </div>
                            ) : (
                              // Normal empty state
                              <>
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
                                    Ask me anything about your travel plans or
                                    use the toggles above
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
                              </>
                            )}
                          </div>
                        ) : (
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
                                  {(message as any).metadata?.selectedTrip ? (
                                    <div className="space-y-2">
                                      <p className="text-xs font-medium opacity-90">
                                        Selected Trip:
                                      </p>
                                      <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                                        <h4 className="font-semibold text-sm mb-1">
                                          {
                                            (message as any).metadata
                                              .selectedTrip.trip_title
                                          }
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs opacity-90">
                                          <span>
                                            {
                                              (message as any).metadata
                                                .selectedTrip.no_of_days
                                            }{" "}
                                            days
                                          </span>
                                          <span>•</span>
                                          <span>
                                            ₹
                                            {
                                              (message as any).metadata
                                                .selectedTrip.estimated_budget
                                            }
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                      {message.content}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}

                            {/* Loading indicator */}
                            {isLoading && (
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center">
                                  <MdChat className="text-gray-600 text-sm" />
                                </div>
                                <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-3 min-w-[120px]">
                                  <div className="flex items-center space-x-2">
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

                            {/* Trip Parsing indicator */}
                            {isParsingTrips && (
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 border border-purple-300 flex items-center justify-center">
                                  <MdExplore className="text-purple-600 text-sm" />
                                </div>
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 shadow-sm rounded-2xl px-4 py-3 min-w-[200px]">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                                    <span className="text-xs text-purple-700 font-medium">
                                      Preparing your trip suggestions...
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

                    {/* Chat Input - Fixed at bottom */}
                    <div className="flex-shrink-0 bg-gradient-to-t from-white to-blue-50/20 border-t border-blue-100 px-6 py-6 relative">
                      {/* Selected Trip Snippet */}
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
                                  // setSelectedTrip(null);
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
                        <ItinerAIChatBox
                          ref={textareaRef}
                          value={chatInput}
                          onChange={setChatInputText}
                          onSubmit={handleChatSubmit}
                          onKeyDown={handleKeyDown}
                          placeholder={
                            isInitializingSession
                              ? "Initializing session..."
                              : testEndResponse
                              ? "🧪 TEST MODE: Next message will trigger date selector"
                              : selectedTrip && showFlashcards
                              ? "Click send to confirm trip selection"
                              : "Ask ItinerAI"
                          }
                          disabled={
                            isInitializingSession ||
                            isLoading ||
                            (selectedTrip && showFlashcards)
                          }
                          isLoading={isLoading || isInitializingSession}
                          theme="default"
                          inputType="textarea"
                          allowEmptySubmit={selectedTrip && showFlashcards}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            // Flights Content
            <FlightsContent
              currentUser={currentUser}
              showProfileDropdown={showProfileDropdown}
              setShowProfileDropdown={setShowProfileDropdown}
              onSettings={() => router.push("/flights/settings")}
              onLogout={logout}
              tripType={tripType}
              setTripType={setTripType}
              travellers={travellers}
              travelClass={travelClass}
            />
          )}
        </div>
      </div>

      {/* SessionDebug Component */}
      {activeSection === "chat" && (
        <SessionDebugFlights
          isVisible={showDebug}
          onClose={() => setShowDebug(false)}
          onSessionRegenerated={handleSessionRegenerated}
          onClearChatHistory={handleClearChatHistory}
        />
      )}

      {/* Pre-Fetch Test Trigger (Dummy Test Button) */}
      {/* {activeSection === "chat" && (
        <PreFetchTestTrigger />
      )} */}

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
