"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MdChat, MdExplore } from "react-icons/md";
import { useAuth } from "../../contexts/AuthContext";
import SessionDebugFlights from "../../components/SessionDebugFlights";
import { translateToEnglish } from "../../utils/translateToEnglish";
import FlashcardsWidgetWhiteTheme from "../../components/FlashcardsWidgetWhiteTheme";
import type { FlashcardsWidgetRef } from "../../components/flashcards/types";
import FlightsWidget from "../../components/FlightsWidget";
import StaysWidget from "../../components/StaysWidget";
import ItineraryWidget from "../../components/ItineraryWidget";
import DateSelectorWidget from "../../components/DateSelectorWidget";
import ConveyanceTab from "../../components/ConveyanceTab";
import StaysTab from "../../components/StaysTab";
import OnboardingModalWhite from "../../components/auth/OnboardingModalWhite";
import ItinerAIChatBox from "../../components/ItinerAIChatBox";
import MessageResponseOverlay from "../../components/MessageResponseOverlay";
import ChatLoadingIndicator from "../../components/ChatLoadingIndicator";
import BookingWidget from "../../components/BookingWidget";
import PreTripWidget from "../../components/PreTripWidget";
import InTripWidget from "../../components/InTripWidget";
import { getSessionId } from "../../utils/sessionManager";
import {
  storeSelectedTrip,
  getSelectedTripFromFirestore,
  formatDateToLocalString,
} from "../../utils/tripStorage";
import { preFetchConveyanceData } from "../../utils/preFetchConveyance";
import { preFetchStaysData } from "../../utils/preFetchStays";
import {
  imageDownloader,
  extractImageUrls,
  validateAndPopulateTripData,
} from "../../utils/imageDownloader";
import {
  normalizeCityNameSync,
  normalizeCityNameSyncWithFallback,
  preloadCityData,
} from "../../utils/placesData";
import {
  storeDayItinerary,
  buildCompleteItinerary,
  DayItineraryData,
  finalizeAndStoreCompleteItinerary,
} from "../../utils/itineraryStorage";
import { transformTripData } from "../../utils/tripDataTransformer";
import { getPreTripMarkdown } from "../../utils/preTripData";
import {
  cleanBackticksFromResponse,
  makeChatAPICall,
} from "../../utils/chatApiHelpers";
// Custom hooks
import { useSessionManagement } from "../../hooks/useSessionManagement";
import { useTripHandlers } from "../../hooks/useTripHandlers";
// New component imports
import { Sidebar } from "../../components/flights-page/Sidebar";
import { DashboardContent } from "../../components/flights-page/DashboardContent";
import { FlightsContent } from "../../components/flights-page/FlightsContent";
import { JourneyLoader, type JourneyStep } from "../../components/JourneyLoader";
import { ChatNavbar } from "../../components/flights-page/ChatNavbar";
import PreFetchTestTrigger from "../../components/PreFetchTestTrigger";
import {
  ChatMessage,
  ChatLoadingIndicators,
  SelectedTripSnippet,
  WelcomeScreen,
  TestModeIndicator,
  ChatInputContainer,
} from "../../components/chat";

type SectionType =
  | "conveyance"
  | "stays"
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
  const [activeSection, setActiveSection] = useState<SectionType>("chat");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Helper function to auto-collapse sidebar when switching sections/components
  const collapseSidebarIfOpen = () => {
    if (!isSidebarCollapsed) {
      setIsSidebarCollapsed(true);
    }
  };

  // Wrapped setter for activeSection with auto-collapse
  const handleSetActiveSection = (section: SectionType) => {
    collapseSidebarIfOpen();
    setActiveSection(section);
  };

  // Wrapped functions for showing components with auto-collapse
  const handleShowFlashcards = (show: boolean) => {
    if (show) collapseSidebarIfOpen();
    setShowFlashcards(show);
  };

  const handleShowFlights = (show: boolean) => {
    if (show) collapseSidebarIfOpen();
    setShowFlights(show);
  };

  const handleShowStays = (show: boolean) => {
    if (show) collapseSidebarIfOpen();
    setShowStays(show);
  };

  const handleShowItinerary = (show: boolean) => {
    if (show) collapseSidebarIfOpen();
    setShowItinerary(show);
  };

  const handleShowDateSelector = (show: boolean) => {
    if (show) collapseSidebarIfOpen();
    setShowDateSelector(show);
  };

  const handleShowBooking = (show: boolean) => {
    if (show) collapseSidebarIfOpen();
    setShowBooking(show);
  };

  const handleShowPreTrip = (show: boolean) => {
    if (show) collapseSidebarIfOpen();
    setShowPreTrip(show);
  };

  const handleShowInTrip = (show: boolean) => {
    if (show) collapseSidebarIfOpen();
    setShowInTrip(show);
  };

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
        [key: string]: any; // Allow other metadata fields
      };
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
  const [showJourneyLoader, setShowJourneyLoader] = useState(false);
  const [currentJourneyStep, setCurrentJourneyStep] = useState<JourneyStep>("trip-suggestion");
  const [testEndResponse, setTestEndResponse] = useState(false);
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
  const [pendingConveyanceDays, setPendingConveyanceDays] = useState<
    Set<number>
  >(new Set()); // NEW: Track pending insert days
  const [overlayMessage, setOverlayMessage] = useState<string | null>(null); // NEW: Message for overlay
  const [showOverlay, setShowOverlay] = useState(false); // NEW: Show message overlay
  const [isCardManuallySelected, setIsCardManuallySelected] = useState(false); // NEW: Track if card was manually selected by user
  const [showBooking, setShowBooking] = useState(false); // NEW: Show booking widget
  const [showFinalizeLoader, setShowFinalizeLoader] = useState(false); // NEW: Show finalize loader
  const [showCongratsLoader, setShowCongratsLoader] = useState(false); // NEW: Show congratulations loader
  const [showPreTrip, setShowPreTrip] = useState(false); // NEW: Show pre-trip brief widget
  const [preTripMarkdown, setPreTripMarkdown] = useState<string>(""); // NEW: Store pre-trip markdown content
  const [showInTrip, setShowInTrip] = useState(false); // NEW: Show in-trip widget
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const flashcardsRef = useRef<FlashcardsWidgetRef>(null);

  // Session management using custom hook
  const {
    sessionId,
    userId,
    previousSessionId,
    isFirstMessage,
    isInitializingSession,
    setSessionId,
    setUserId,
    setIsFirstMessage,
    handleSessionRegenerated,
  } = useSessionManagement(currentUser);

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

  // Handle chat history clearing when session is regenerated
  const handleClearChatHistory = () => {
    setMessages([]);
    setChatInputText("");
    setIsLoading(false);
  };

  // Restore selected trip from Firestore when component mounts or userId changes
  useEffect(() => {
    const restoreSelectedTrip = async () => {
      if (!userId) {
        return;
      }

      // Only restore if we don't already have a selected trip
      if (selectedTrip) {
        return;
      }


      try {
        const restoredTrip = await getSelectedTripFromFirestore(userId);

        if (restoredTrip) {
          setSelectedTrip(restoredTrip);

          // Also restore to originalTrips if it's a trip suggestion format
          if (restoredTrip.trip_title) {
            setOriginalTrips([restoredTrip]);
          }
        } else {
        }
      } catch (error) {
        console.error("❌ Error restoring trip from Firestore:", error);
      }
    };

    // Preload city data for fast normalization (non-blocking)
    preloadCityData().catch((err) => {
      console.warn("⚠️ City data preload failed (will use fallback):", err);
    });

    restoreSelectedTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Run when userId is set (selectedTrip checked inside but not in deps to avoid loops)

  // Load pre-trip markdown when PreTrip widget is shown via debug toggle
  useEffect(() => {
    if (showPreTrip && !preTripMarkdown && userId && sessionId) {
      const loadMarkdown = async () => {
        const markdown = await getPreTripMarkdown(userId, sessionId);
        setPreTripMarkdown(markdown);
      };
      loadMarkdown();
    }
  }, [showPreTrip, preTripMarkdown, userId, sessionId]);

  // Trip handlers using custom hook
  const { handleTripSelect, handleTripMemoryUpdate } = useTripHandlers(
    userId,
    sessionId,
    selectedTrip,
    setSelectedTrip,
    originalTrips,
    setIsCardManuallySelected,
    setMessages,
    setIsLoading,
    setShowFlashcards,
    flashcardsRef
  );

  // Handle custom user ID set - trigger onboarding flow
  const handleCustomUserIdSet = (customId: string) => {

    // CRITICAL: Clear session storage BEFORE resetting state to prevent race condition
    // This must happen BEFORE setSessionId("") so useSessionManagement doesn't read old session
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("itinerai_session_id");
      sessionStorage.removeItem("itinerai_user_id");
    }

    // Reset session state IMMEDIATELY after clearing sessionStorage
    // This ensures useSessionManagement won't read stale data
    setSessionId("");
    setUserId(customId);
    setIsFirstMessage(true);

    // Clear any existing chat/trip data
    setMessages([]);
    setSelectedTrip(null);
    setTripSuggestions([]);
    setOriginalTrips([]);

    // Trigger onboarding modal AFTER clearing storage and resetting state
    setShowOnboarding(true);

  };

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

  // Wrapper function for API call - uses imported makeChatAPICall
  const makeAPICall = async (currentInput: string): Promise<any> => {
    const data = await makeChatAPICall(userId, sessionId, currentInput);
    console.log("API Response received (raw):", data);

    // Clean backticks from response
    const cleanedData = cleanBackticksFromResponse(data);
    console.log("API Response (cleaned):", cleanedData);

    return cleanedData;
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
        setCurrentJourneyStep("itinerary-generation");
        setShowJourneyLoader(true);
        setIsParsingTrips(true);
      }


      // Build complete itinerary using tripToUse and itinerariesToUse
      const completeItinerary = await buildCompleteItinerary(
        userId,
        tripToUse,
        dayNumber,
        itinerariesToUse // Pass generated itineraries
      );


      // Prepare the message as a string with single-quoted JSON format
      const itineraryMessage = `{'role':'admin','day_number':${dayNumber},'end_day':${totalDays},'query':'recommend the itinerary for day ${dayNumber}'}`;


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

            // Retry with itinerary generation loader already showing

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
        itineraryPayload = itineraryResponse.message;
      }

      // Extract and show message in overlay if present
      const generateResponseMessage = itineraryPayload.message || itineraryResponse.message;
      if (
        generateResponseMessage &&
        typeof generateResponseMessage === "string" &&
        generateResponseMessage.trim()
      ) {
        setOverlayMessage(generateResponseMessage);
        setShowOverlay(true);
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
            return itineraryPayload;
          }

          // Merge itineraries: update existing days or add new days
          const existingDays = prevData.itinerary;
          const newDays = itineraryPayload.itinerary;


          // Create a map of existing days by day_number
          const dayMap = new Map();
          existingDays.forEach((day: any) => dayMap.set(day.day_number, day));

          // Update or add new days
          newDays.forEach((day: any) => {
            dayMap.set(day.day_number, day);
          });

          // Convert back to array and sort by day_number
          const mergedDays = Array.from(dayMap.values()).sort(
            (a: any, b: any) => a.day_number - b.day_number
          );


          return {
            ...prevData,
            itinerary: mergedDays,
            response_type: itineraryPayload.response_type,
          };
        });


        // Update itinerariesGenerated with new days
        const updatedItinerariesGenerated = [...itinerariesGenerated];

        for (const dayData of itineraryPayload.itinerary) {
          try {
            // Parse the API response - extract conveyance/stay from schedule if needed
            let conveyanceDetails = dayData.conveyance_details;
            let stayDetails = dayData.stay_details;

            // If schedule exists, extract conveyance/stay from it
            if (dayData.schedule && Array.isArray(dayData.schedule)) {
              const conveyanceActivities = dayData.schedule.filter(
                (item: any) =>
                  item.activity_type === "travel" && item.conveyance_type
              );
              const stayActivities = dayData.schedule.filter(
                (item: any) => item.activity_type === "rest" && item.place_name
              );

              if (!conveyanceDetails && conveyanceActivities.length > 0) {
                const primaryConveyance = conveyanceActivities[0];
                conveyanceDetails = {
                  is_required: true,
                  type: primaryConveyance.conveyance_type,
                  from_city:
                    primaryConveyance.from_location?.place_name ||
                    primaryConveyance.from_location?.address,
                  to_city:
                    primaryConveyance.to_location?.place_name ||
                    primaryConveyance.to_location?.address,
                  departure_time:
                    primaryConveyance.departure_time ||
                    primaryConveyance.start_time,
                  arrival_time:
                    primaryConveyance.arrival_time ||
                    primaryConveyance.end_time,
                  duration: primaryConveyance.duration_minutes
                    ? `${primaryConveyance.duration_minutes} min`
                    : undefined,
                  price: primaryConveyance.fare,
                };
              }

              if (!stayDetails && stayActivities.length > 0) {
                const primaryStay =
                  stayActivities.find(
                    (s: any) =>
                      s.place_name &&
                      s.place_name.toLowerCase().includes("hotel")
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
            if (
              dayData.must_do_activities &&
              dayData.must_do_activities.length > 0
            ) {
              dayToStore.must_do_activities = dayData.must_do_activities;
            }

            if (dayData.places_to_visit && dayData.places_to_visit.length > 0) {
              dayToStore.places_to_visit = dayData.places_to_visit;
            }

            if (conveyanceDetails) {
              dayToStore.conveyance_details = Object.fromEntries(
                Object.entries(conveyanceDetails).filter(
                  ([_, v]) => v !== undefined
                )
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
            if (dayData.estimated_total_cost)
              dayToStore.estimated_total_cost = dayData.estimated_total_cost;
            if (dayData.highlights) dayToStore.highlights = dayData.highlights;


            // Update or add to itinerariesGenerated
            const existingIndex = updatedItinerariesGenerated.findIndex(
              (it) => it.day_number === dayData.day_number
            );

            if (existingIndex !== -1) {
              // Replace existing day
              updatedItinerariesGenerated[existingIndex] = dayToStore;
            } else {
              // Add new day
              updatedItinerariesGenerated.push(dayToStore);
            }

            // Also store in Firestore for backup
            await storeDayItinerary(
              userId,
              sessionId,
              dayToStore as DayItineraryData
            );
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
      } else {
        console.warn(
          "⚠️ Unexpected itinerary response format:",
          itineraryResponse
        );
        console.warn("⚠️ Payload structure:", itineraryPayload);
      }

      // Hide loader after minimum display time
      setTimeout(() => {
        setShowJourneyLoader(false);
        setIsLoadingItinerary(false);

        setTimeout(() => {
          setIsParsingTrips(false);
          // Show itinerary widget
          handleShowItinerary(true);

          // If this is add day flow, navigate to the newly added day
          if (isAddDayFlow) {
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
      setShowJourneyLoader(false);
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

      // Show loader
      setIsLoadingItinerary(true);
      setCurrentJourneyStep("itinerary-generation");
      setShowJourneyLoader(true);
      setIsParsingTrips(true);

      // Build payload for insert flow
      // IMPORTANT: itinerariesData is already shifted by handleAddDay
      // Include ALL days: before + new + after (already shifted)

      const itinerariesBeforeInsertion = itinerariesData
        .filter((it) => it.day_number < insertDayNumber)
        .map((it) => ({ ...it }));

      // Find or create the new day itinerary
      let newDayItinerary = itinerariesData.find(
        (it) => it.day_number === insertDayNumber
      );

      // If new day doesn't exist in itinerariesData, create it with minimal structure
      if (!newDayItinerary) {
        newDayItinerary = {
          day_number: insertDayNumber,
          conveyance_details: { is_required: false },
          stay_details: { is_required: false },
        };
      }

      // Include days AFTER insertion (already shifted by handleAddDay)
      const itinerariesAfterInsertion = itinerariesData
        .filter((it) => it.day_number > insertDayNumber)
        .map((it) => ({ ...it }));

      // Build complete current_itinerary array: days before + new day + days after (already shifted)
      const currentItineraryForAPI = [
        ...itinerariesBeforeInsertion,
        newDayItinerary,
        ...itinerariesAfterInsertion,
      ].filter((it) => it !== null && it !== undefined); // Filter out any null/undefined


      // Calculate new trip duration
      const newTripDuration =
        (tripData.no_of_days || tripData.day_wise_plan?.length || 0) + 1;

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


      // Retry configuration for insert flow
      const MAX_RETRIES = 2; // Up to 3 attempts total (initial + 2 retries)
      const RETRY_DELAY = 5000; // 5 seconds
      let lastError: Error | null = null;
      let itineraryResponse: any = null;

      // Retry loop for handling 500/503 errors
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {

            // Retry with itinerary generation loader already showing

            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          }

          const response = await fetch("/api/itinerary", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });

          // Check for 500 or 503 specifically (server-side errors that may be transient)
          if (response.status === 500 || response.status === 503) {
            console.warn(
              `⚠️ Insert API returned ${response.status} (attempt ${attempt + 1}/${
                MAX_RETRIES + 1
              })`
            );
            lastError = new Error(`Service error (${response.status})`);

            // If we have retries left, continue to next attempt
            if (attempt < MAX_RETRIES) {
              continue;
            } else {
              // Last attempt failed
              throw lastError;
            }
          }

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Insert API error:", response.status, errorText);
            throw new Error(`API request failed: ${response.status}`);
          }

          itineraryResponse = await response.json();

          // Success - break out of retry loop
          break;
        } catch (error) {
          console.error(
            `❌ Insert API error (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`,
            error
          );
          lastError = error as Error;

          // If this was the last attempt, throw
          if (attempt === MAX_RETRIES) {
            throw lastError;
          }
        }
      }

      // If we exited the loop without a response, throw the last error
      if (!itineraryResponse) {
        throw lastError || new Error("Insert API request failed after retries");
      }

      console.log("✅ Insert API Response:", itineraryResponse);

      // Hide loader
      setShowJourneyLoader(false);
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

      // Extract and show message in overlay if present
      const insertResponseMessage = itineraryPayload.message || itineraryResponse.message;
      if (
        insertResponseMessage &&
        typeof insertResponseMessage === "string" &&
        insertResponseMessage.trim()
      ) {
        setOverlayMessage(insertResponseMessage);
        setShowOverlay(true);
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

          // Handle INSERT response with special merging logic
          const existingDays = prevData.itinerary;
          const newDays = itineraryPayload.itinerary;


          // Build result based on user requirements:
          // 1. Days <= insertDayNumber from response REPLACE existing
          // 2. Days > insertDayNumber from response OVERRIDE existing
          // 3. Days > insertDayNumber NOT in response are REMOVED

          const dayMap = new Map();

          // First, add all days <= insertDayNumber from existing (as baseline)
          existingDays
            .filter((day: any) => day.day_number <= insertDayNumber)
            .forEach((day: any) => dayMap.set(day.day_number, day));

          // Then, add/replace days from API response
          newDays.forEach((day: any) => {
            if (day.day_number <= insertDayNumber) {
              dayMap.set(day.day_number, day);
            } else {
              dayMap.set(day.day_number, day);
            }
          });

          // IMPORTANT: Days > insertDayNumber NOT in response are automatically excluded
          // because we don't add them to the map

          const mergedDays = Array.from(dayMap.values()).sort(
            (a: any, b: any) => a.day_number - b.day_number
          );


          return {
            ...prevData,
            itinerary: mergedDays,
            total_days: mergedDays.length,
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
              (item: any) =>
                item.activity_type === "travel" && item.conveyance_type
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
                from_city:
                  primaryConveyance.from_location?.place_name ||
                  primaryConveyance.from_location?.address,
                to_city:
                  primaryConveyance.to_location?.place_name ||
                  primaryConveyance.to_location?.address,
                departure_time:
                  primaryConveyance.departure_time ||
                  primaryConveyance.start_time,
                arrival_time:
                  primaryConveyance.arrival_time || primaryConveyance.end_time,
                duration: primaryConveyance.duration_minutes
                  ? `${primaryConveyance.duration_minutes} min`
                  : undefined,
                price: primaryConveyance.fare,
              };
            }

            // Build stay_details if not present
            if (!stayDetails && stayActivities.length > 0) {
              const primaryStay =
                stayActivities.find(
                  (s: any) =>
                    s.place_name && s.place_name.toLowerCase().includes("hotel")
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
          if (
            dayData.must_do_activities &&
            dayData.must_do_activities.length > 0
          ) {
            dayToStore.must_do_activities = dayData.must_do_activities;
          }

          if (dayData.places_to_visit && dayData.places_to_visit.length > 0) {
            dayToStore.places_to_visit = dayData.places_to_visit;
          }

          if (conveyanceDetails) {
            // Filter out undefined values from conveyanceDetails
            dayToStore.conveyance_details = Object.fromEntries(
              Object.entries(conveyanceDetails).filter(
                ([_, v]) => v !== undefined
              )
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


          await storeDayItinerary(
            userId,
            sessionId,
            dayToStore as DayItineraryData
          );

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

        // Apply same merging logic to itinerariesGenerated as we did for itineraryData
        // Remove days > insertDayNumber that were NOT in the API response
        const responseDayNumbers = new Set(
          itineraryPayload.itinerary.map((d: any) => d.day_number)
        );

        const filteredItineraries = itinerariesData.filter((it) => {
          if (it.day_number <= insertDayNumber) {
            return true; // Keep all days <= insert day
          } else {
            // For days > insert day, only keep if in API response
            const shouldKeep = responseDayNumbers.has(it.day_number);
            if (!shouldKeep) {
            }
            return shouldKeep;
          }
        });

        // Sort by day_number to maintain order
        filteredItineraries.sort((a, b) => a.day_number - b.day_number);

        setItinerariesGenerated([...filteredItineraries]);

        // Update selectedTrip with new total days count
        const updatedTrip = { ...tripData };
        if (updatedTrip.day_wise_plan) {
          const newTotalDays = updatedTrip.day_wise_plan.length;
          updatedTrip.no_of_days = newTotalDays;
          setSelectedTrip(updatedTrip);
          await storeSelectedTrip(userId, sessionId, updatedTrip);
        }

        // Remove the inserted day from pending set since it now has data
        handleRemovePendingDay(insertDayNumber);

        // Clear insert flow flag
        setIsInsertDayFlow(false);

        // Navigate back to itinerary and to the newly added day
        handleShowItinerary(true);

        // Navigate to the newly inserted day after a short delay
        setTimeout(() => {
          setNavigateToDay(insertDayNumber);
          setTimeout(() => setNavigateToDay(null), 1000);
        }, 100);
      }
    } catch (error) {
      console.error("❌ Error in insert itinerary API call:", error);
      setShowJourneyLoader(false);
      setIsParsingTrips(false);
      setIsLoadingItinerary(false);
      setIsInsertDayFlow(false);
    }
  };

  // Call itinerary API to delete a day (request_type="remove")
  const callItineraryAPIForDelete = async (deleteDayNumber: number) => {
    if (!selectedTrip || !userId || !sessionId) {
      console.error("❌ Missing required data for delete itinerary API call");
      return;
    }

    try {

      // Show loader
      setIsLoadingItinerary(true);
      setCurrentJourneyStep("itinerary-generation");
      setShowJourneyLoader(true);
      setIsParsingTrips(true);

      // Build payload for delete flow
      // Include days BEFORE the deleted day only (NOT including the deleted day itself)
      const itinerariesBeforeDeletion = itinerariesGenerated
        .filter((it) => it.day_number < deleteDayNumber)
        .map((it) => ({ ...it }));

      // Do NOT include the deleted day or any days after it
      const currentItineraryForAPI = [...itinerariesBeforeDeletion];


      // Calculate new trip duration (reduced by number of days deleted)
      const daysDeleted = itinerariesGenerated.filter(
        (it) => it.day_number >= deleteDayNumber
      ).length;
      const newTripDuration = selectedTrip.no_of_days - daysDeleted;


      // Prepare the message
      const itineraryMessage = `{'role':'admin','day_number':${deleteDayNumber},'end_day':${newTripDuration},'query':'removed day ${deleteDayNumber}'}`;

      // Build request body with request_type="remove"
      const requestBody: any = {
        user_id: userId,
        session_id: sessionId,
        message: itineraryMessage,
        current_itinerary: currentItineraryForAPI,
        role: "admin",
        current_day: deleteDayNumber,
        trip_duration: newTripDuration,
        request_type: "remove", // IMPORTANT: Use "remove" for delete flow
      };


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
      console.log("✅ Delete API Response:", itineraryResponse);

      // Hide loader
      setShowJourneyLoader(false);
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

      // Extract and show message in overlay if present
      const deleteResponseMessage = itineraryPayload.message || itineraryResponse.message;
      if (
        deleteResponseMessage &&
        typeof deleteResponseMessage === "string" &&
        deleteResponseMessage.trim()
      ) {
        setOverlayMessage(deleteResponseMessage);
        setShowOverlay(true);
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

          // Handle DELETE response with special merging logic
          const existingDays = prevData.itinerary;
          const newDays = itineraryPayload.itinerary;


          // Build result based on user requirements:
          // 1. Days <= deleteDayNumber from response REPLACE existing
          // 2. Days > deleteDayNumber from response OVERRIDE existing
          // 3. ALL days >= deleteDayNumber from existing are REMOVED (deleted)

          const dayMap = new Map();

          // First, add all days < deleteDayNumber from existing (as baseline)
          existingDays
            .filter((day: any) => day.day_number < deleteDayNumber)
            .forEach((day: any) => dayMap.set(day.day_number, day));

          // Then, add/replace days from API response
          newDays.forEach((day: any) => {
            if (day.day_number < deleteDayNumber) {
              dayMap.set(day.day_number, day); // REPLACE
            } else {
              dayMap.set(day.day_number, day); // OVERRIDE/ADD
            }
          });

          // IMPORTANT: Days >= deleteDayNumber from existing are automatically excluded
          // because we filtered them out and only included response days

          const mergedDays = Array.from(dayMap.values()).sort(
            (a: any, b: any) => a.day_number - b.day_number
          );


          return {
            ...prevData,
            itinerary: mergedDays,
          };
        });

        // Update itinerariesGenerated state
        // Remove deleted day and all days after it, then update with API response
        const updatedItinerariesGenerated = itinerariesGenerated.filter(
          (it) => it.day_number < deleteDayNumber
        );

        // Add response days
        itineraryPayload.itinerary.forEach((dayItinerary: any) => {
          const dayToStore: any = {
            day_number: dayItinerary.day_number,
            conveyance_details: dayItinerary.conveyance_details,
            stay_details: dayItinerary.stay_details,
            schedule: dayItinerary.schedule,
            title: dayItinerary.title,
          };

          // Add optional fields if present
          if (dayItinerary.date) dayToStore.date = dayItinerary.date;
          if (dayItinerary.summary) dayToStore.summary = dayItinerary.summary;

          const existingIndex = updatedItinerariesGenerated.findIndex(
            (it) => it.day_number === dayItinerary.day_number
          );

          if (existingIndex !== -1) {
            updatedItinerariesGenerated[existingIndex] = dayToStore;
          } else {
            updatedItinerariesGenerated.push(dayToStore);
          }
        });

        // Sort by day number
        updatedItinerariesGenerated.sort((a, b) => a.day_number - b.day_number);

        setItinerariesGenerated(updatedItinerariesGenerated);

        // Update selectedTrip's no_of_days and day_wise_plan
        if (selectedTrip) {
          // Remove deleted day and all days after it from day_wise_plan
          const updatedDayWisePlan = (selectedTrip.day_wise_plan || []).filter(
            (d: any) => d.day_number < deleteDayNumber
          );


          const updatedTrip = {
            ...selectedTrip,
            no_of_days: newTripDuration,
            day_wise_plan: updatedDayWisePlan,
          };
          setSelectedTrip(updatedTrip);
          await storeSelectedTrip(userId, sessionId, updatedTrip);
        }

        // Navigate to previous day if current day was deleted or after
        if (currentDayNumber >= deleteDayNumber) {
          const newCurrentDay = Math.max(1, deleteDayNumber - 1);
          setTimeout(() => {
            setNavigateToDay(newCurrentDay);
            setTimeout(() => setNavigateToDay(null), 1000);
          }, 100);
        }
      }
    } catch (error) {
      console.error("❌ Error in delete itinerary API call:", error);
      setShowJourneyLoader(false);
      setIsParsingTrips(false);
      setIsLoadingItinerary(false);
      alert("Failed to delete day. Please try again.");
    }
  };

  // Handler to add day to pending set
  const handleAddPendingDay = (dayNumber: number) => {
    setPendingConveyanceDays((prev) => {
      const newSet = new Set(prev);
      newSet.add(dayNumber);
      return newSet;
    });
  };

  // Handler to remove day from pending set
  const handleRemovePendingDay = (dayNumber: number) => {
    setPendingConveyanceDays((prev) => {
      const newSet = new Set(prev);
      newSet.delete(dayNumber);
      return newSet;
    });
  };

  // Handler to delete a day (CASE 1: API call)
  const handleDeleteDay = async (dayNumber: number) => {

    try {
      // Call the delete API
      console.log(`📤 Calling callItineraryAPIForDelete...`);
      await callItineraryAPIForDelete(dayNumber);
      console.log(`✅ Successfully deleted day ${dayNumber} via API`);
    } catch (error) {
      console.error(`❌ Failed to delete day ${dayNumber}:`, error);
      throw error; // Re-throw to let ItineraryWidget handle the error
    }
  };

  // Handler for local delete without API (CASE 2: is_required: false)
  const handleLocalDeleteDay = (dayNumber: number) => {

    if (!selectedTrip || !userId || !sessionId) {
      console.error("❌ Missing required data for local delete");
      return;
    }

    try {
      // CRITICAL: Update itineraryData first - this drives the UI
      setItineraryData((prevData: any) => {
        if (!prevData || !prevData.itinerary) {
          console.warn("⚠️ No itineraryData to update");
          return prevData;
        }


        // Remove deleted day and re-align subsequent days
        const updatedItinerary = prevData.itinerary
          .filter((day: any) => day.day_number !== dayNumber)
          .map((day: any) => {
            if (day.day_number > dayNumber) {
              return {
                ...day,
                day_number: day.day_number - 1,
              };
            }
            return day;
          })
          .sort((a: any, b: any) => a.day_number - b.day_number);


        return {
          ...prevData,
          itinerary: updatedItinerary,
        };
      });

      // Update itinerariesGenerated - remove the day and re-align subsequent days
      const updatedItineraries = itinerariesGenerated
        .filter((it) => it.day_number !== dayNumber) // Remove the deleted day
        .map((it) => {
          // Re-align day numbers for days after the deleted one
          if (it.day_number > dayNumber) {
            return {
              ...it,
              day_number: it.day_number - 1,
            };
          }
          return it;
        })
        .sort((a, b) => a.day_number - b.day_number);


      // Update selectedTrip - remove from day_wise_plan and re-align
      const updatedDayWisePlan = (selectedTrip.day_wise_plan || [])
        .filter((d: any) => d.day_number !== dayNumber) // Remove the deleted day
        .map((d: any) => {
          // Re-align day numbers for days after the deleted one
          if (d.day_number > dayNumber) {
            return {
              ...d,
              day_number: d.day_number - 1,
            };
          }
          return d;
        })
        .sort((a: any, b: any) => a.day_number - b.day_number);

      const updatedTrip = {
        ...selectedTrip,
        no_of_days: selectedTrip.no_of_days - 1,
        day_wise_plan: updatedDayWisePlan,
      };


      // Update states
      setItinerariesGenerated(updatedItineraries);
      setSelectedTrip(updatedTrip);

      // Navigate to appropriate day after deletion
      // If viewing the deleted day or a day after it, navigate to the day before the deleted one
      // If viewing a day before the deleted day, stay on that day (but its number may have shifted)
      if (currentDayNumber >= dayNumber) {
        // User is viewing the deleted day or a day after it
        const newCurrentDay = Math.max(1, dayNumber - 1);
        setTimeout(() => {
          setNavigateToDay(newCurrentDay);
          setTimeout(() => setNavigateToDay(null), 1000);
        }, 350); // After animation completes
      } else {
      }

      // Store updated trip in Firestore
      storeSelectedTrip(userId, sessionId, updatedTrip)
        .then(() => {
        })
        .catch((error) => {
          console.error("❌ Error storing updated trip:", error);
        });

    } catch (error) {
      console.error(`❌ Failed to locally delete day ${dayNumber}:`, error);
    }
  };

  // Handler for chat message submission from ItineraryWidget
  const handleItineraryChatSubmit = async (
    message: string,
    currentDay: number
  ) => {

    if (!selectedTrip || !userId || !sessionId) {
      console.error("❌ Missing required data for chat API call");
      throw new Error("Missing required data");
    }

    try {
      // Translate message to English before sending to API
      const translatedMessage = await translateToEnglish(message);

      if (translatedMessage !== message) {
      }

      // Build request payload
      const requestBody = {
        user_id: userId,
        session_id: sessionId,
        message: translatedMessage,
        role: "user",
        current_day: currentDay, // Current active day (1-based)
        trip_duration: selectedTrip.no_of_days,
        request_type: "generate",
        current_itinerary: itinerariesGenerated, // All generated itineraries
      };

      console.log("📤 Chat API Request:", JSON.stringify(requestBody, null, 2));

      // Call API
      const response = await fetch("/api/itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Chat API error:", response.status, errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log("✅ Chat API Response:", apiResponse);

      // Process response - extract itinerary data
      let itineraryPayload = apiResponse;
      if (apiResponse.message && typeof apiResponse.message === "object") {
        itineraryPayload = apiResponse.message;
      }

      // Extract and show message in overlay if present
      const responseMessage = itineraryPayload.message || apiResponse.message;
      if (
        responseMessage &&
        typeof responseMessage === "string" &&
        responseMessage.trim()
      ) {
        setOverlayMessage(responseMessage);
        setShowOverlay(true);
      }

      // Override existing itineraries with response itineraries
      if (
        itineraryPayload.response_type === "itinerary" &&
        itineraryPayload.itinerary
      ) {

        // Update itineraryData state - OVERRIDE strategy
        setItineraryData((prevData: any) => {
          if (!prevData || !prevData.itinerary) {
            // No existing data, just use the new response
            return itineraryPayload;
          }

          const existingDays = prevData.itinerary;
          const newDays = itineraryPayload.itinerary;


          // Create a map of existing days
          const dayMap = new Map();
          existingDays.forEach((day: any) => dayMap.set(day.day_number, day));

          // Override with new days (replace days present in response)
          newDays.forEach((day: any) => {
            dayMap.set(day.day_number, day);
          });

          // Convert back to array and sort
          const mergedDays = Array.from(dayMap.values()).sort(
            (a: any, b: any) => a.day_number - b.day_number
          );


          return {
            ...prevData,
            itinerary: mergedDays,
          };
        });

        // Update itinerariesGenerated state
        const updatedItinerariesGenerated = [...itinerariesGenerated];

        itineraryPayload.itinerary.forEach((dayItinerary: any) => {
          const dayToStore: any = {
            day_number: dayItinerary.day_number,
            conveyance_details: dayItinerary.conveyance_details,
            stay_details: dayItinerary.stay_details,
            schedule: dayItinerary.schedule,
            title: dayItinerary.title,
          };

          // Add optional fields if present
          if (dayItinerary.date) dayToStore.date = dayItinerary.date;
          if (dayItinerary.summary) dayToStore.summary = dayItinerary.summary;

          const existingIndex = updatedItinerariesGenerated.findIndex(
            (it) => it.day_number === dayItinerary.day_number
          );

          if (existingIndex !== -1) {
            // Override existing
            updatedItinerariesGenerated[existingIndex] = dayToStore;
          } else {
            // Add new
            updatedItinerariesGenerated.push(dayToStore);
          }
        });

        // Sort by day number
        updatedItinerariesGenerated.sort((a, b) => a.day_number - b.day_number);

        setItinerariesGenerated(updatedItinerariesGenerated);

        // Store updated itineraries in Firestore
        updatedItinerariesGenerated.forEach((dayItinerary: any) => {
          storeDayItinerary(userId, sessionId, dayItinerary).catch((error) => {
            console.error(
              `❌ Error storing day ${dayItinerary.day_number}:`,
              error
            );
          });
        });

      }
    } catch (error) {
      console.error("❌ Error in chat submission:", error);
      throw error; // Re-throw to let ItineraryWidget handle the error
    }
  };

  // Handler for Continue to Booking button
  const handleContinueToBooking = async () => {
    try {

      if (!userId || !sessionId || !selectedTrip) {
        console.error("❌ Missing required data for finalization");
        setOverlayMessage("Unable to finalize itinerary. Please try again.");
        setShowOverlay(true);
        return;
      }

      // Add assistant message with itinerary snippet to chat BEFORE proceeding
      if (itinerariesGenerated.length > 0) {
        const assistantItineraryMessage = {
          id: Date.now().toString(),
          content: "Here's your complete trip itinerary:",
          role: "assistant" as const,
          timestamp: new Date(),
          metadata: {
            isItinerarySelection: true,
            itineraries: itinerariesGenerated.map((day: any) => ({
              day_number: day.day_number,
              date: day.date,
              title: day.title,
              summary: day.summary,
              themes: day.themes,
              schedule: day.schedule || [],
              estimated_total_cost: day.estimated_total_cost,
              conveyance_details: day.conveyance_details,
              stay_details: day.stay_details,
            })),
            itineraryTripTitle: selectedTrip?.trip_title,
            itineraryTotalDays: selectedTrip?.no_of_days || itinerariesGenerated.length,
          },
        };

        // Add user confirmation message
        const userConfirmMessage = {
          id: (Date.now() + 1).toString(),
          content: `Finalized ${itinerariesGenerated.length}-day itinerary for ${selectedTrip?.trip_title || "trip"}`,
          role: "user" as const,
          timestamp: new Date(),
          metadata: {
            action: "itinerary_finalized",
            totalDays: itinerariesGenerated.length,
          },
        };

        // Add both messages: assistant first, then user
        setMessages((prev) => [...prev, assistantItineraryMessage, userConfirmMessage]);
      }

      // Show loader
      setShowFinalizeLoader(true);

      // STEP 1: Save final itinerary to memory
      try {
        const memoryResponse = await fetch("/api/memory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            session_id: sessionId,
            updates: {
              final_itinerary: itinerariesGenerated,
            },
          }),
        });

        if (!memoryResponse.ok) {
          console.error(
            "❌ Failed to save itinerary to memory:",
            await memoryResponse.text()
          );
          // Continue anyway - don't block the flow
        } else {
          const memoryData = await memoryResponse.json();
        }
      } catch (memoryError) {
        console.error("❌ Error saving to memory:", memoryError);
        // Continue anyway - don't block the flow
      }

      // STEP 2: Store complete itinerary in Firestore
      await finalizeAndStoreCompleteItinerary(
        userId,
        sessionId,
        selectedTrip.trip_title || "My Trip",
        selectedTrip.trip_date || new Date().toISOString().split("T")[0],
        selectedTrip.no_of_days || itinerariesGenerated.length,
        itinerariesGenerated
      );


      // Wait for loader animation (3 seconds)
      setTimeout(() => {
        setShowFinalizeLoader(false);
        setShowItinerary(false);
        handleShowBooking(true);
      }, 3000);
    } catch (error) {
      console.error("❌ Error finalizing itinerary:", error);
      setOverlayMessage("Failed to finalize itinerary. Please try again.");
      setShowOverlay(true);
      setShowFinalizeLoader(false);
    }
  };

  // Handler for Continue from BookingWidget (after all bookings done)
  const handleBookingContinue = async () => {
    try {

      if (!userId || !sessionId) {
        console.error("❌ Missing user data");
        return;
      }

      // Calculate budget breakdown from itinerariesGenerated
      const budgetBreakdown: any = { overall: {} };
      let totalBudget = 0;
      let travelActivitiesCount = 0;

      // Get stays pricing from sessionStorage
      let staysPricing = 0;
      try {
        const stayDataKey = `stay_${userId}_${sessionId}`;
        const storedData = sessionStorage.getItem(stayDataKey);
        if (storedData) {
          const stayData = JSON.parse(storedData);
          if (stayData.total_price) {
            staysPricing = stayData.total_price;
          }
        }
      } catch (error) {
        console.error("Error retrieving stays pricing:", error);
      }

      // Count total "rest" activities to distribute stays pricing
      let totalRestActivities = 0;
      itinerariesGenerated.forEach((day: any) => {
        if (day.schedule && Array.isArray(day.schedule)) {
          day.schedule.forEach((item: any) => {
            if (item.activity_type === "rest") {
              totalRestActivities++;
            }
          });
        }
      });

      const farePerRest = totalRestActivities > 0 ? staysPricing / totalRestActivities : 0;

      // Calculate budget breakdown
      itinerariesGenerated.forEach((day: any) => {
        if (day.schedule && Array.isArray(day.schedule)) {
          day.schedule.forEach((item: any) => {
            if (item.fare && item.activity_type) {
              const activityType = item.activity_type;
              budgetBreakdown.overall[activityType] = 
                (budgetBreakdown.overall[activityType] || 0) + item.fare;
              totalBudget += item.fare;
            }

            // Add stays pricing for "rest" activities (distributed)
            if (item.activity_type === "rest" && farePerRest > 0) {
              budgetBreakdown.overall["rest"] = 
                (budgetBreakdown.overall["rest"] || 0) + farePerRest;
              totalBudget += farePerRest;
            }

            // Count travel activities
            if (item.activity_type === "travel" && item.conveyance_type !== "walk") {
              travelActivitiesCount++;
            }
          });
        }
      });

      // Get user budget from memory
      let userBudget = null;
      try {
        const response = await fetch("/api/memory/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            session_id: sessionId,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user_profile && data.user_profile.budget) {
            userBudget = data.user_profile.budget;
          }
        }
      } catch (error) {
        console.error("Failed to fetch user budget:", error);
      }

      // Add booking snippet to chat messages
      const bookingSnippetMessage = {
        id: Date.now().toString(),
        content: "All travel bookings have been completed! Here's your trip summary:",
        role: "assistant" as const,
        timestamp: new Date(),
        metadata: {
          isBookingComplete: true,
          bookingTripTitle: selectedTrip?.trip_title || "My Trip",
          bookingTotalDays: selectedTrip?.no_of_days || itinerariesGenerated.length,
          bookingTotalBudget: totalBudget,
          bookingUserBudget: userBudget,
          bookingBudgetBreakdown: budgetBreakdown,
          bookingTravelActivitiesCount: travelActivitiesCount,
        },
      };

      // Add user confirmation message after snippet
      const userConfirmationMessage = {
        id: (Date.now() + 1).toString(),
        content: "All bookings completed successfully! Ready to proceed with the trip planning.",
        role: "user" as const,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, bookingSnippetMessage, userConfirmationMessage]);

      // Show congratulations loader
      setShowCongratsLoader(true);

      // Load pre-trip markdown content from backend API
      const markdown = await getPreTripMarkdown(userId, sessionId);
      setPreTripMarkdown(markdown);

      // Save bookings information to Firestore
      // This would typically update the generated_itineraries document with booking status
      // For now, we'll just wait for the animation

      // Wait for congratulations animation (4 seconds)
      setTimeout(() => {
        setShowCongratsLoader(false);
        setShowBooking(false);

        // Show pre-trip brief instead of redirecting to dashboard
        handleShowPreTrip(true);
      }, 4000);
    } catch (error) {
      console.error("❌ Error in booking continuation:", error);
      setShowCongratsLoader(false);
    }
  };

  // Handler for finishing pre-trip brief
  const handlePreTripFinish = () => {

    // Add pre-trip snippet to chat messages
    if (preTripMarkdown) {
      const preTripSnippetMessage = {
        id: Date.now().toString(),
        content: "Your pre-trip brief is ready! Review important information before your journey:",
        role: "assistant" as const,
        timestamp: new Date(),
        metadata: {
          isPreTripReady: true,
          preTripTripTitle: selectedTrip?.trip_title || "My Trip",
          preTripMarkdownContent: preTripMarkdown,
        },
      };

      // Add user confirmation message after snippet
      const userConfirmationMessage = {
        id: (Date.now() + 1).toString(),
        content: "Pre-trip report downloaded and saved. All set for the journey!",
        role: "user" as const,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, preTripSnippetMessage, userConfirmationMessage]);
    }

    setShowPreTrip(false);
    handleShowInTrip(true);
  };

  const handleInTripFinish = () => {
    // Smoothly hide the in-trip widget with fade effect
    setShowInTrip(false);
    
    // Ensure we're on the chat section
    setActiveSection("chat");
    
    // After a brief delay to allow the chat to render, scroll to bottom smoothly
    setTimeout(() => {
      scrollToBottom();
      // Also focus on the chat input for better UX
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 300); // 300ms delay for smooth transition
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


    // Update current day number
    setCurrentDayNumber(nextDayNumber);

    // Check if conveyance is required for this day
    if (
      nextDay.conveyance_details &&
      nextDay.conveyance_details.is_required === true
    ) {

      // Extract from and to cities
      // IMPROVED: Iterate backward through selectedTrip.day_wise_plan to find the last to_city
      let fromCity = "";
      let toCity = nextDay.conveyance_details.to_city || "";
      let canAutoFill = true;

      // First, try to get fromCity by iterating backward from the current day
      for (let i = nextDayNumber - 2; i >= 0; i--) {
        const day = selectedTrip.day_wise_plan?.[i];

        if (day?.conveyance_details?.to_city) {
          fromCity = day.conveyance_details.to_city;
          break;
        }
      }

      // Fallback: if no to_city found from backward iteration, use the day's from_city
      if (!fromCity) {
        fromCity = nextDay.conveyance_details.from_city || "";
      }

      // Fallback: if still no fromCity, use source_point or default to Mumbai
      if (!fromCity) {
        if (selectedTrip.source_point?.place_name) {
          fromCity = selectedTrip.source_point.place_name;
        } else {
          fromCity = "Mumbai";
        }
      }

      // Normalize fromCity with fallback detection
      const originalFromCity = fromCity;
      const fromCityResult = normalizeCityNameSyncWithFallback(fromCity);
      fromCity = fromCityResult.normalized;

      if (!fromCityResult.found) {
        console.warn(
          `⚠️ from_city "${originalFromCity}" not found in places.json - disabling auto-fill`
        );
        canAutoFill = false;
      } else {
      }

      // Normalize toCity with fallback detection
      if (toCity) {
        const originalToCity = toCity;
        const result = normalizeCityNameSyncWithFallback(toCity);
        toCity = result.normalized;

        if (!result.found) {
          console.warn(
            `⚠️ to_city "${originalToCity}" not found in places.json - disabling auto-fill`
          );
          canAutoFill = false;
        } else {
        }
      }


      // Calculate departure date for this day
      const tripDate = selectedTrip.trip_date;
      if (tripDate) {
        const baseDate = new Date(tripDate);
        const departureDate = new Date(baseDate);
        departureDate.setDate(departureDate.getDate() + (nextDayNumber - 1));
        const departureDateStr = departureDate.toISOString().split("T")[0];


        // Set states for FlightsWidget
        setConveyanceFromCity(fromCity);
        setConveyanceToCity(toCity);
        setAutoFillMode(canAutoFill);
        setInitialDepartureDate(departureDateStr);


        // Close itinerary widget
        setShowItinerary(false);

        // Show conveyance finder loader
        setCurrentJourneyStep("conveyance-finder");
        setShowJourneyLoader(true);
        setIsParsingTrips(true);


        // After 4 seconds, hide loader and show flights widget
        setTimeout(() => {
          setShowJourneyLoader(false);

          setTimeout(() => {
            setIsParsingTrips(false);
            handleShowFlights(true);
            setShowFlashcards(false);
            setShowStays(false);
            setShowDateSelector(false);
          }, 700); // Dissolve duration
        }, 4000);
      }
    } else {
      // No conveyance required, directly call itinerary API
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

    if (!selectedTrip || !userId || !sessionId) {
      console.error("❌ Missing required data for adding day");
      return;
    }

    try {
      // Calculate the new day number - insert AFTER the current day
      const newDayNumber = currentDayNumber + 1;


      // Update trip in Firestore and memory
      let updatedTrip = { ...selectedTrip };

      if (extendTrip) {
        // CASE: User wants to extend trip duration

        // Update local state
        updatedTrip.no_of_days = updatedTrip.no_of_days + 1;
      }

      // Find the current city - look for last to_city BEFORE the new day position
      let fromCity = "Unknown"; // Default

      // Iterate backwards from currentDayNumber to find the last conveyance with to_city
      for (let i = currentDayNumber - 1; i >= 0; i--) {
        const day = selectedTrip.day_wise_plan?.[i];

        if (day?.conveyance_details?.to_city) {
          fromCity = day.conveyance_details.to_city;
          break;
        }
      }

      // If no to_city found, use trip's source_point if available
      if (fromCity === "Mumbai" && selectedTrip.source_point?.place_name) {
        fromCity = selectedTrip.source_point.place_name;
      }

      // Normalize city name and handle special cases
      let normalizedFromCity = fromCity;

      // First, check if it's a special placeholder value
      if (
        fromCity.toLowerCase() === "user_location" ||
        fromCity.toLowerCase() === "user location" ||
        fromCity.toLowerCase() === "userlocation"
      ) {
        // Try to get from source_point or default to Mumbai
        if (selectedTrip.source_point?.place_name) {
          normalizedFromCity = selectedTrip.source_point.place_name;
        } else {
          normalizedFromCity = "Mumbai";
        }
      }

      // Use new normalization with fallback detection
      const cityResult = normalizeCityNameSyncWithFallback(normalizedFromCity);
      normalizedFromCity = cityResult.normalized;

      if (!cityResult.found) {
        console.warn(
          `⚠️ City "${fromCity}" not found in places.json - using capitalized version`
        );
      } else {
      }

      fromCity = normalizedFromCity;

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

      // Also update itinerariesGenerated array - shift subsequent days
      const updatedItinerariesGenerated = itinerariesGenerated.map(
        (itinerary) => {
          // If this itinerary is for a day >= newDayNumber, increment its day_number
          if (itinerary.day_number >= newDayNumber) {
            return {
              ...itinerary,
              day_number: itinerary.day_number + 1,
            };
          }
          return itinerary;
        }
      );
      // Sort by day_number to maintain order after shifting
      updatedItinerariesGenerated.sort((a, b) => a.day_number - b.day_number);
      // Insert empty placeholder for new day (will be filled after conveyance/stay selection)
      const newDayItinerary = {
        day_number: newDayNumber,
        // Will be populated with conveyance_details and stay_details later
      };
      updatedItinerariesGenerated.splice(newDayNumber - 1, 0, newDayItinerary);
      setItinerariesGenerated(updatedItinerariesGenerated);
      // Store updated trip in Firestore
      await storeSelectedTrip(userId, sessionId, updatedTrip);
      setSelectedTrip(updatedTrip);
      if (needsConveyance) {
        // CASE 1: User needs conveyance - redirect to FlightsWidget

        // Set insert flow flag if this is an insert operation
        if (isInsertFlow) {
          setIsInsertDayFlow(true);
        }

        // Calculate departure date for the new day
        const tripDate = selectedTrip.trip_date;
        if (tripDate) {
          const baseDate = new Date(tripDate);
          const departureDate = new Date(baseDate);
          departureDate.setDate(departureDate.getDate() + (newDayNumber - 1));
          const departureDateStr = departureDate.toISOString().split("T")[0];


          // Set current day number
          setCurrentDayNumber(newDayNumber);

          // Set states for FlightsWidget
          setConveyanceFromCity(fromCity);
          setConveyanceToCity(""); // Not prefilled - user selects
          setAutoFillMode(false); // Not full auto-fill mode
          setPartialAutoFillMode(true); // Enable partial auto-fill (FROM and DATE locked, TO selectable)
          setInitialDepartureDate(departureDateStr);


          // Close itinerary widget to show FlightsWidget
          setShowItinerary(false);

          // Show conveyance finder loader
          setCurrentJourneyStep("conveyance-finder");
          setShowJourneyLoader(true);
          setIsParsingTrips(true);

          // After 4 seconds, show flights widget
          setTimeout(() => {
            setShowJourneyLoader(false);

            setTimeout(() => {
              setIsParsingTrips(false);
              handleShowFlights(true);
              setShowFlashcards(false);
              setShowStays(false);
              setShowDateSelector(false);
            }, 700);
          }, 4000);
        }
      } else {
        // CASE 2: No conveyance needed - call itinerary API directly

        // Set insert flow flag if this is an insert operation (CRITICAL FIX)
        if (isInsertFlow) {
          setIsInsertDayFlow(true);
        }

        // Store the new day with is_required: false
        const dayToStore = {
          day_number: newDayNumber,
          conveyance_details: {
            is_required: false,
          },
        };

        await storeDayItinerary(
          userId,
          sessionId,
          dayToStore as DayItineraryData
        );

        // IMPORTANT: Use the updatedItinerariesGenerated array that was created earlier (line 1732)
        // This array already has:
        // 1. All days shifted (days >= newDayNumber have day_number + 1)
        // 2. Empty placeholder for newDayNumber inserted (line 1758)

        // Update the placeholder with conveyance and stay details
        const dayIndex = updatedItinerariesGenerated.findIndex(
          (it) => it.day_number === newDayNumber
        );

        if (dayIndex !== -1) {
          // Update the placeholder with actual details
          updatedItinerariesGenerated[dayIndex] = {
            day_number: newDayNumber,
            conveyance_details: {
              is_required: false,
            },
            stay_details: {
              is_required: false,
            },
          };
        } else {
          console.error(
            `❌ Day ${newDayNumber} placeholder not found in updatedItinerariesGenerated`
          );
        }

        // Update state again with the complete details
        setItinerariesGenerated(updatedItinerariesGenerated);


        // Check if this is insert flow - if so, use request_type="add"
        if (isInsertFlow) {

          // Set loading state before API call (CRITICAL FIX)
          setIsLoadingItinerary(true);

          // Call API with special insert flow logic
          // Pass the complete array including all shifted days + new day
          await callItineraryAPIForInsert(
            newDayNumber,
            updatedTrip,
            updatedItinerariesGenerated
          );
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

    if (!sessionId || !userId) {
      console.error(
        "❌ Missing required data for date selection: sessionId or userId"
      );
      return;
    }

    try {
      // Use formatDateToLocalString for consistent date display (avoids timezone issues)
      const formattedDateForDisplay = formatDateToLocalString(selectedDate);

      // If selectedTrip is not in memory, try to restore it from Firestore
      let tripToUse = selectedTrip;

      if (tripToUse) {
      } else {
        tripToUse = await getSelectedTripFromFirestore(userId);

        if (tripToUse) {
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
        // Convert date to strict YYYY-MM-DD format using local timezone (not UTC)
        const dateString = formatDateToLocalString(selectedDate);

        const correctedTrip = JSON.parse(JSON.stringify(tripToUse)); // Deep copy

        // Add trip_date to correctedTrip
        correctedTrip.trip_date = dateString;


        await storeSelectedTrip(userId, sessionId, correctedTrip);

        // Update the local state with corrected trip (now includes trip_date)
        setSelectedTrip(correctedTrip);

        // Add an assistant message with calendar snippet showing the selected date
        const assistantDateMessage = {
          id: Date.now().toString(),
          content: "Here's your selected travel date:",
          role: "assistant" as const,
          timestamp: new Date(),
          metadata: {
            isDateSelection: true, // Flag to render DateSelectorSnippet
            selectedDate: dateString, // YYYY-MM-DD format
            tripTitle: correctedTrip.trip_title,
            tripDuration: correctedTrip.no_of_days || 6,
          },
        };

        // Add a user message to chat indicating date was selected
        // Format the date for display (MM/DD/YYYY format from YYYY-MM-DD)
        const [year, month, day] = dateString.split("-");
        const displayDate = `${parseInt(month)}/${parseInt(day)}/${year}`;

        const userMessage = {
          id: (Date.now() + 1).toString(),
          content: `Selected date: ${displayDate} for trip: ${
            correctedTrip.trip_title
          }`,
          role: "user" as const,
          timestamp: new Date(),
          metadata: {
            selectedDate: dateString, // Store in YYYY-MM-DD format
            selectedTrip: correctedTrip,
          },
        };

        setMessages((prev) => [...prev, assistantDateMessage, userMessage]);

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

            // Check if source_point exists in the response
            if (memoryData.source_point && memoryData.source_point.place_name) {

              // Add source_point to the trip
              correctedTrip.source_point = memoryData.source_point;

              // Update ONLY Day 1's from_city and last day's to_city
              // DO NOT touch other days or other fields
              if (
                correctedTrip.day_wise_plan &&
                Array.isArray(correctedTrip.day_wise_plan) &&
                correctedTrip.day_wise_plan.length > 0
              ) {
                // UPDATE THE FIRST DAY FROM_CITY TO THE SOURCE POINT
                const firstDay = correctedTrip.day_wise_plan[0];
                if (firstDay.conveyance_details) {
                  // ONLY update from_city, preserve all other fields
                  firstDay.conveyance_details.from_city =
                    memoryData.source_point.place_name;
                } else {
                  // Create conveyance_details if it doesn't exist
                  firstDay.conveyance_details = {
                    from_city: memoryData.source_point.place_name,
                    to_city: firstDay.conveyance_details?.to_city || "",
                    is_required: true,
                  };
                }

                // UPDATE THE LAST DAY TO_CITY TO THE SOURCE POINT (return journey)
                const lastDayIndex = correctedTrip.day_wise_plan.length - 1;
                const lastDay = correctedTrip.day_wise_plan[lastDayIndex];

                if (lastDay.conveyance_details) {
                  // ONLY update to_city, preserve from_city and all other fields
                  const originalFromCity = lastDay.conveyance_details.from_city;
                  lastDay.conveyance_details.to_city =
                    memoryData.source_point.place_name;
                } else {
                  // Create conveyance_details if it doesn't exist, but preserve from_city if it exists
                  lastDay.conveyance_details = {
                    from_city: lastDay.conveyance_details?.from_city || "",
                    to_city: memoryData.source_point.place_name,
                    is_required: true,
                  };
                }
              }

              // Store updated trip with source_point (trip_date already added above)
              await storeSelectedTrip(userId, sessionId, correctedTrip);

              // Update local state
              setSelectedTrip(correctedTrip);
            } else {
              // Default to Mumbai if no source_point
              correctedTrip.source_point = {
                place_name: "Mumbai",
                address: "Mumbai, India",
              };

              // Update first and last day with Mumbai
              if (
                correctedTrip.day_wise_plan &&
                Array.isArray(correctedTrip.day_wise_plan) &&
                correctedTrip.day_wise_plan.length > 0
              ) {
                // First day from_city
                const firstDay = correctedTrip.day_wise_plan[0];
                if (firstDay.conveyance_details) {
                  firstDay.conveyance_details.from_city = "Mumbai";
                } else {
                  firstDay.conveyance_details = {
                    from_city: "Mumbai",
                    is_required: true,
                  };
                }

                // Last day to_city
                const lastDay =
                  correctedTrip.day_wise_plan[
                    correctedTrip.day_wise_plan.length - 1
                  ];
                if (lastDay.conveyance_details) {
                  lastDay.conveyance_details.to_city = "Mumbai";
                } else {
                  lastDay.conveyance_details = {
                    to_city: "Mumbai",
                    is_required: true,
                  };
                }

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
          correctedTrip.source_point = {
            place_name: "Mumbai",
            address: "Mumbai, India",
          };
        }

        // Pre-fetch conveyance data for all days that require it
        const dayWisePlan = correctedTrip.day_wise_plan;

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


          // Check if conveyance_details exists and is_required is true
          if (
            day1.conveyance_details &&
            day1.conveyance_details.is_required === true
          ) {

            // Initialize current day number to 1
            setCurrentDayNumber(1);

            // Extract from and to cities
            let fromCity = day1.conveyance_details.from_city || "";
            let toCity = day1.conveyance_details.to_city || "";
            let canAutoFill = true;

            // Normalize city names using places.json matching with fallback detection
            if (fromCity) {
              const originalFromCity = fromCity;
              const result = normalizeCityNameSyncWithFallback(fromCity);
              fromCity = result.normalized;

              if (!result.found) {
                console.warn(
                  `⚠️ from_city "${originalFromCity}" not found in places.json - disabling auto-fill`
                );
                canAutoFill = false;
              } else {
              }
            } else {
              fromCity = "Mumbai"; // Default if empty
            }

            if (toCity) {
              const originalToCity = toCity;
              const result = normalizeCityNameSyncWithFallback(toCity);
              toCity = result.normalized;

              if (!result.found) {
                console.warn(
                  `⚠️ to_city "${originalToCity}" not found in places.json - disabling auto-fill`
                );
                canAutoFill = false;
              } else {
              }
            }


            // Set conveyance cities for FlightsWidget
            setConveyanceFromCity(fromCity);
            setConveyanceToCity(toCity);

            // Set auto-fill mode based on whether cities were found
            setAutoFillMode(canAutoFill);
            setInitialDepartureDate(dateString); // Use the trip start date


            // Close date selector
            setShowDateSelector(false);

            // Show conveyance finder loader
            setCurrentJourneyStep("conveyance-finder");
            setShowJourneyLoader(true);
            setIsParsingTrips(true);


            // After 4 seconds, hide loader and show flights widget
            setTimeout(() => {
              setShowJourneyLoader(false);

              setTimeout(() => {
                setIsParsingTrips(false);
                handleShowFlights(true);
                setShowFlashcards(false);
                setShowItinerary(false);
                setShowDateSelector(false);
              }, 700); // Dissolve duration
            }, 4000);

            return; // Exit early since we're showing conveyance flow
          } else {
          }
        } else {
        }
      } else {
        // If no trip selected, just store the date
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

    } catch (error) {
      console.error("Error storing date selection:", error);
      alert("Failed to save date selection. Please try again.");
    }
  };

  // Handle continue action from FlightsWidget with selected conveyance data
  const handleFlightsContinue = async (selectedConveyanceData?: any, aiOptions?: any[]) => {

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
      setTempConveyanceSelection(selectedConveyanceData);

      // Skip adding chat message for add day flow (in partial auto-fill mode)
      // Only add chat messages for regular conveyance selection flow
      if (!partialAutoFillMode) {
        // Create assistant message with AI conveyance options snippet (BEFORE user message)
        const assistantConveyanceMessage = {
          id: Date.now().toString(),
          content: "Here are the AI recommended conveyance options:",
          role: "assistant" as const,
          timestamp: new Date(),
          metadata: {
            isConveyanceSelection: true,
            conveyanceOptions: aiOptions?.slice(0, 4).map((opt: any) => ({
              id: opt.id,
              type: opt.operator?.toLowerCase().includes("train") ? "train" as const : "flight" as const,
              number: opt.number,
              operator: opt.operator,
              departureTime: opt.departureTime,
              arrivalTime: opt.arrivalTime,
              duration: opt.duration,
              price: opt.price,
              from_city: opt.from_city || conveyanceFromCity,
              to_city: opt.to_city || conveyanceToCity,
            })) || [],
            conveyanceDayNumber: currentDayNumber,
            conveyanceRouteInfo: `${conveyanceFromCity} to ${conveyanceToCity}`,
          },
        };

        // Create user message for selected conveyance
        const conveyanceMessage = {
          id: (Date.now() + 1).toString(),
          content: `Selected ${selectedConveyanceData.operator} ${selectedConveyanceData.number} for Day ${currentDayNumber} (${conveyanceFromCity} to ${conveyanceToCity})`,
          role: "user" as const,
          timestamp: new Date(),
          metadata: {
            action: "conveyance_selected",
            day_number: currentDayNumber,
            conveyance: selectedConveyanceData,
          },
        };

        // Add both messages: assistant first, then user
        setMessages((prev) => [...prev, assistantConveyanceMessage, conveyanceMessage]);
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


      // CASE 0: Partial auto-fill mode (Add Day flow) - Route to StaysWidget
      if (partialAutoFillMode) {

        // Store conveyance temporarily for handleStaysContinue
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
          // Store updated trip
          await storeSelectedTrip(userId, sessionId, updatedTrip);
          setSelectedTrip(updatedTrip);
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
          }
        }


        // Show stays finder loader
        setCurrentJourneyStep("stays-finder");
        setShowJourneyLoader(true);
        setIsParsingTrips(true);

        // Reset partial auto-fill mode
        setPartialAutoFillMode(false);

        // After 4 seconds, show stays widget
        setTimeout(() => {
          setShowJourneyLoader(false);

          setTimeout(() => {
            setIsParsingTrips(false);
            handleShowStays(true);
          }, 700);
        }, 4000);

        return; // Exit early, show stay widget
      }

      // CASE 1: Current day requires stay
      if (
        currentDay.stay_details &&
        currentDay.stay_details.is_required === true
      ) {

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


          // Calculate actual dates
          const baseDate = new Date(tripDate);
          const checkInDate = new Date(baseDate);
          checkInDate.setDate(checkInDate.getDate() + (checkInDay - 1));
          const checkInDateStr = checkInDate.toISOString().split("T")[0];

          const checkOutDate = new Date(baseDate);
          checkOutDate.setDate(checkOutDate.getDate() + (checkOutDay - 1));
          const checkOutDateStr = checkOutDate.toISOString().split("T")[0];


          setStayCheckInDate(checkInDateStr);
          setStayCheckOutDate(checkOutDateStr);
          setAutoFillStaysMode(true); // Enable auto-fill mode
        }


        // Show stays finder loader
        setCurrentJourneyStep("stays-finder");
        setShowJourneyLoader(true);
        setIsParsingTrips(true);

        // After 4 seconds, show stays widget
        setTimeout(() => {
          setShowJourneyLoader(false);

          setTimeout(() => {
            setIsParsingTrips(false);
            handleShowStays(true);
          }, 700);
        }, 4000);

        return; // Exit early, show stay widget
      }

      // CASE 2: Current day does NOT require stay - pass conveyance data to itinerary API

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


      // Store day itinerary in Firestore
      await storeDayItinerary(
        userId,
        sessionId,
        currentItineraryDay as DayItineraryData
      );

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
  const handleStaysContinue = async (selectedStayData?: any, aiOptions?: any[]) => {

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
      } else {
      }


      // Store day itinerary in Firestore
      await storeDayItinerary(
        userId,
        sessionId,
        currentItineraryDay as DayItineraryData
      );

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
      }

      // Update itinerariesGenerated with the new day's conveyance and stay details
      if (isNewDay) {
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
        }
      }

      // Skip adding chat message for add day flow
      // Check if this is from add day flow by looking at the day's is_new_day flag
      if (!isNewDay) {
        // Create assistant message with AI stay options snippet (BEFORE user message)
        const assistantStaysMessage = {
          id: Date.now().toString(),
          content: "Here are the AI recommended stays:",
          role: "assistant" as const,
          timestamp: new Date(),
          metadata: {
            isStaysSelection: true,
            stayOptions: aiOptions?.slice(0, 4).map((stay: any) => ({
              stay_id: stay.stay_id,
              property_name: stay.property_name,
              property_address: stay.property_address,
              overall_rating: stay.overall_rating || 0,
              starting_price: typeof stay.starting_price === 'string'
                ? parseFloat(stay.starting_price.replace(/[^0-9.]/g, '')) || 0
                : stay.starting_price || 0,
              city: stay.city || stayCity,
              image: stay.image,
              amenities: stay.amenities,
              property_type: stay.property_type,
            })) || [],
            staysDayNumber: currentDayNumber,
            staysCityName: stayCity,
          },
        };

        // Create user message for selected stay
        const stayMessage = {
          id: (Date.now() + 1).toString(),
          content: `Selected ${selectedStayData.property_name} for Day ${currentDayNumber} in ${selectedStayData.city}`,
          role: "user" as const,
          timestamp: new Date(),
          metadata: {
            action: "stay_selected",
            day_number: currentDayNumber,
            stay: selectedStayData,
          },
        };

        // Add both messages: assistant first, then user
        setMessages((prev) => [...prev, assistantStaysMessage, stayMessage]);
      } else {
      }

      // Clear temporary conveyance selection
      setTempConveyanceSelection(null);

      // Close stays widget
      setShowStays(false);

      // For add day flow, show loader before calling itinerary API
      if (isNewDay) {

        // Show itinerary generation loader
        setCurrentJourneyStep("itinerary-generation");
        setShowJourneyLoader(true);
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
            console.log(`📦 Using request_type="add" with day number shifting`);
            // Call insert API with special logic
            await callItineraryAPIForInsert(
              currentDayNumber,
              updatedTrip,
              updatedItinerariesGeneratedForAPI
            );
          } else {
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

    // Special handling when a trip is manually selected
    if (selectedTrip && showFlashcards && isCardManuallySelected) {
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
      // ═══════════════════════════════════════════════════════════════════
      // REMOVED: Memory update on first message
      // ═══════════════════════════════════════════════════════════════════
      // Memory is now updated IMMEDIATELY after session creation in useSessionManagement hook
      // No need to update it here on first message - it's already done!
      // This prevents duplicate memory/add API calls and ensures backend has user context
      // before the first chat message is sent.

      // Just mark first message as handled
      if (isFirstMessage) {
        setIsFirstMessage(false);
      }

      // Translate input to English before sending to API
      const translatedInput = await translateToEnglish(currentInput);

      if (translatedInput !== currentInput) {
      }

      // Check if we should simulate end response for testing
      const data = testEndResponse
        ? simulateEndResponse()
        : await makeAPICall(translatedInput);

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

          // Force trip suggestion loader to show immediately
          setCurrentJourneyStep("trip-suggestion");
          setShowJourneyLoader(true);
          setIsParsingTrips(true);

          // Safety check - ensure loader stays visible for minimum duration
          setTimeout(() => {
            if (!showJourneyLoader) {
              setShowJourneyLoader(true);
            }
          }, 100);
        }
        // Show date recommender loader IMMEDIATELY for ANY end response detected
        else if (isEndResponse) {
          messageContent = "Let's Plan the itinerary in detail";
          console.log("🎯 End response data:", {
            root_response_type: data.response_type,
            nested_response_type: data.message?.response_type,
          });

          // Force date recommender loader to show immediately
          setCurrentJourneyStep("date-recommender");
          setShowJourneyLoader(true);

          // Safety check - ensure loader stays visible for minimum duration
          setTimeout(() => {
            if (!showJourneyLoader) {
              setShowJourneyLoader(true);
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
            messageContent = "Let's Plan the itinerary in detail";
          } else {
            messageContent =
              (typeof data.message === "object"
                ? data.message.message
                : data.message) || "Let's finalize your travel dates";
          }
        }
        // Case 2: Trip response at root level (new format from temp.json)
        else if (data.response_type === "trip" && data.message) {

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

          }
        }
        // Case 4: Response nested under data.message (old format)
        else if (data.message && typeof data.message === "object") {
          const messageData = data.message;


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
              messageContent = "Let's Plan the itinerary in detail";
            } else {
              messageContent =
                typeof messageData.message === "string"
                  ? messageData.message
                  : messageData.message.message ||
                    "Let's finalize your travel dates";
            }
          } else if (messageData.response_type === "trip") {
            console.log("Detected trip response in nested format");

            messageContent =
              (typeof messageData.message === "object"
                ? messageData.message.message
                : messageData.message) ||
              "Here are some amazing trip suggestions for you!";

            // Case A: trips array directly under messageData (actual current API format)
            if (messageData.trips && Array.isArray(messageData.trips)) {
              // Store original trips before validation
              setOriginalTrips(cleanupTripData(messageData.trips));

              // Validate and populate missing fields
              parsedTripSuggestions = validateAndPopulateTripData(
                messageData.trips
              );
              shouldShowPlaces = true;

            }
            // Case B: trips nested under trip_suggestions (alternative format)
            else if (messageData.trip_suggestions) {

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

              }
            } else {
              console.warn("No trips array found in trip response!");
            }
          } else {
            // Fallback for other response types
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
        ...(shouldShowPlaces && parsedTripSuggestions.length > 0 && {
          metadata: {
            suggestedTrips: parsedTripSuggestions,
          },
        }),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Show message in overlay if there's content
      if (messageContent && messageContent.trim()) {
        setOverlayMessage(messageContent);
        setShowOverlay(true);
      }

      // Handle trip response with loader timing
      const detectedTripResponse =
        data.response_type === "trip" ||
        (data.message &&
          typeof data.message === "object" &&
          data.message.response_type === "trip");

      if (detectedTripResponse) {
        const loaderStartTime = Date.now();
        const minLoaderDuration = 4000; // Minimum 4 seconds display time


        // If trip suggestions were found, process them
        if (shouldShowPlaces && parsedTripSuggestions.length > 0) {
          // Extract all image URLs from trip suggestions
          const imageUrls = extractImageUrls(parsedTripSuggestions);

          // Download images in the background while showing loader
          const downloadPromise = imageDownloader
            .downloadImages(imageUrls)
            .then((downloadedImages) => {
              return downloadedImages;
            })
            .catch((error) => {
              console.error("Error downloading images:", error);
              return new Map<string, string>(); // Return empty map on error
            });

          // Transform the trip data to match FlashcardsWidget's expected format
          const transformedTrips = transformTripData(parsedTripSuggestions);


          // Wait for both images and minimum loader duration
          Promise.all([
            Promise.race([
              downloadPromise,
              new Promise((resolve) => setTimeout(resolve, 5000)), // Max 5 seconds wait for images
            ]),
            new Promise((resolve) => setTimeout(resolve, minLoaderDuration)), // Minimum loader duration
          ]).then(() => {
            setTripSuggestions(transformedTrips);


            // Hide trip loader with dissolving effect and show flashcards
            setTimeout(() => {
              setShowJourneyLoader(false);

              setTimeout(() => {
                // Automatically show the places widget after loader dissolves
                handleShowFlashcards(true);
                setShowFlights(false);
                setShowStays(false);
                setShowItinerary(false);
                // Keep selectedTrip for potential future use - don't clear it here
                setIsParsingTrips(false);

                // Clear selection in flashcards widget
                if (flashcardsRef.current) {
                  flashcardsRef.current.clearSelection();
                }

              }, 400); // Wait for dissolve animation
            }, 100); // Small buffer before hiding loader
          });
        } else {
          // Trip response but no valid trip suggestions found

          // Still show loader for minimum duration, then hide
          setTimeout(() => {
            setShowJourneyLoader(false);
            setIsParsingTrips(false);
          }, minLoaderDuration);
        }
      }
      // Handle end response detection and flow
      else if (isEndResponse) {
        console.log("🎯 End response detected - showing date recommender loader");
        console.log("🎯 End response data:", {
          root_response_type: data.response_type,
          nested_response_type: data.message?.response_type,
          message_content: messageContent,
        });

        const loaderStartTime = Date.now();
        const minLoaderDuration = 4000; // Minimum 4 seconds display time


        // Wait for minimum loader duration
        setTimeout(() => {

          // Hide end loader with dissolving effect and show date selector
          setTimeout(() => {
            setShowJourneyLoader(false);

            setTimeout(() => {
              // Automatically show the date selector widget after loader dissolves
              handleShowDateSelector(true);
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
        setShowJourneyLoader(false);
        setShowJourneyLoader(false);
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
      setShowJourneyLoader(false);
      setShowJourneyLoader(false);
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

  // JourneyLoader handles all loading states

  if (!currentUser) {
    return null; // This shouldn't happen due to the parent component's validation
  }

  return (
    <div className="h-screen w-screen bg-white flex overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSetActiveSection}
        onLogout={logout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white min-h-0 min-w-0 max-w-full overflow-hidden transition-all duration-500 ease-in-out">
        {/* Conditional rendering based on active section */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 max-w-full overflow-hidden transition-all duration-500 ease-in-out">
          {activeSection === "dashboard" ? (
            <DashboardContent
              currentUser={currentUser}
              showProfileDropdown={showProfileDropdown}
              setShowProfileDropdown={setShowProfileDropdown}
              onSettings={() => router.push("/flights/settings")}
              onLogout={logout}
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
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
                showBooking={showBooking}
                showPreTrip={showPreTrip}
                showInTrip={showInTrip}
                testEndResponse={testEndResponse}
                sessionId={sessionId}
                isSidebarCollapsed={isSidebarCollapsed}
                onToggleSidebar={() =>
                  setIsSidebarCollapsed(!isSidebarCollapsed)
                }
                onBookingToggle={() => {
                  handleShowBooking(!showBooking);
                }}
                onPreTripToggle={() => {
                  handleShowPreTrip(!showPreTrip);
                }}
                onInTripToggle={() => {
                  handleShowInTrip(!showInTrip);
                }}
                onTestEndResponseToggle={() => {
                  setTestEndResponse(!testEndResponse);
                }}
                onFlashcardsToggle={() => {
                  if (showFlashcards) {
                    setShowFlashcards(false);
                    // Keep selectedTrip for other widgets that might need it
                    if (flashcardsRef.current) {
                      flashcardsRef.current.clearSelection();
                    }
                  } else {
                    setCurrentJourneyStep("trip-suggestion");
                    setShowJourneyLoader(true);
                    setIsParsingTrips(true);
                    setShowFlights(false);
                    setShowStays(false);
                    setShowItinerary(false);
                    setShowDateSelector(false);

                    setTimeout(() => {
                      setShowJourneyLoader(false);
                      setTimeout(() => {
                        handleShowFlashcards(true);
                        setIsParsingTrips(false);
                      }, 400);
                    }, 4000);
                  }
                }}
                onFlightsToggle={() => {
                  handleShowFlights(!showFlights);
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
                onCustomUserIdSet={handleCustomUserIdSet}
              />

              {/* Chat Container - Scrollable messages area with fixed input */}
              <div className="flex-1 flex flex-col min-h-0">
                {showInTrip ? (
                  <div className="flex-1 overflow-hidden">
                    <InTripWidget
                      isVisible={showInTrip}
                      tripTitle={selectedTrip?.trip_title || "My Trip"}
                      itineraries={itinerariesGenerated}
                      onClose={handleInTripFinish}
                      userId={userId}
                      sessionId={sessionId}
                    />
                  </div>
                ) : showPreTrip ? (
                  <div className="flex-1 overflow-hidden">
                    <PreTripWidget
                      isVisible={showPreTrip}
                      onToggle={() => setShowPreTrip(false)}
                      markdownContent={
                        preTripMarkdown ||
                        `# PRE-TRIP BRIEF — ${
                          selectedTrip?.trip_title || "Your Trip"
                        }
                        \n**Generated on:** 2025-11-19T23:35:03Z\n**Generated for user:** 7760daab-8626-4a47-8f4a-88fadfce6008\n\n---\n\n## SUMMARY\nThis brief outlines key safety and preparedness information for your 2-day solo trip to Mumbai. The weather in December will be pleasant, but it is crucial to stay vigilant against common tourist scams, especially with taxis. Preparedness is key for your trip to Elephanta Island, which has no emergency services; all medical or security issues require a return to the mainland.\n\n---\n\n## 1. VISA REQUIREMENTS\n**Overall summary:** As an Indian citizen traveling domestically, no visa is required to visit Mumbai.\n**Details:**\n- Country: India\n  - Visa required: No\n  - Visa type: N/A\n  - Documents: N/A\n  - Processing time: N/A\n  - Fee (INR): N/A\n  - Transit visa required: No\n  - Notes: Always carry a valid government-issued photo ID (like Aadhaar Card, Driver's License, or Passport) for flights, hotel check-ins, and identity verification.\n\n---\n\n## 2. CULTURAL UNDERSTANDINGS & ETIQUETTE\n### Region: Mumbai\n**Do:**\n- Greet people with a polite 'Namaste' by pressing your palms together. It is a universally accepted and respectful greeting.\n- Use your right hand for eating, paying, and handling objects. The left hand is traditionally considered unclean.\n- Be prepared for personal questions about your job or family, as this is often a part of normal conversation and not considered rude.\n- Dress modestly, especially when visiting religious sites. While Mumbai is modern, covering shoulders and knees is recommended to respect local customs.\n- Be patient in crowded places. Personal space is different from Western norms, and queues may not always be orderly.\n\n**Don't:**\n- Engage in public displays of affection, as this is generally frowned upon.\n- Point the soles of your feet towards people, religious idols, or sacred places, as it is considered highly disrespectful.\n- Hand money or items to people with your left hand.\n- Be afraid to bargain politely in street markets like Colaba Causeway, but do not bargain in fixed-price shops or restaurants.\n\n**Local notes:** Mumbai has a fast-paced, \"city that never sleeps\" culture. English is widely spoken and understood in the tourist areas you are visiting.\n\n---\n\n## 3. MEDICAL FACILITIES (region-wise)\n### Region: South Mumbai (Colaba, Fort)\n**Top Hospitals / Emergency Centers**\n1. **St George's Hospital**\n   - Address: P D'Mello Rd, opposite GPO, Chhatrapati Shivaji Terminus Area, Fort, Mumbai, Maharashtra 400001\n   - Emergency: Yes\n   - Key facilities: [General Medicine, Emergency Ward, Multi-specialty services]\n   - Distance (km) from stay: 1.5\n   - Contact: 022-22620344\n2. **Bombay Hospital & Medical Research Centre**\n   - Address: 12, Vitthaldas Thackersey Marg, New Marine Lines, Mumbai, Maharashtra 400020\n   - Emergency: Yes\n   - Key facilities: [Advanced diagnostics, Cardiac Care, Trauma Center]\n   - Distance (km) from stay: 2.8\n   - Contact: 022-22067676\n\n**Nearby Pharmacies**\n- **Apollo Pharmacy** — 24/7: Yes — Distance: 0.5 km — Contact: N/A (Located near Cusrow Baug)\n\n### Region: Elephanta Island\n**Top Hospitals / Emergency Centers**\n- **There are NO medical facilities, doctors, or emergency centers on Elephanta Island.**\n- In case of a medical emergency, you must take the ferry back to the Gateway of India (approx. 60-minute ride) and proceed to the nearest hospital in South Mumbai.\n- **Nearest Mainland Hospital:** St George's Hospital (details above).\n\n**Nearby Pharmacies**\n- N/A\n\n### Region: Bandra (West)\n**Top Hospitals / Emergency Centers**\n1. **Holy Family Multispeciality Hospital**\n   - Address: St Andrews Rd, Bandra West, Mumbai, Maharashtra 400050\n   - Emergency: Yes\n   - Key facilities: [Multi-specialty, ICU, Emergency Services]\n   - Distance (km) from Bandstand: 1.2\n   - Contact: 022-62670555\n2. **Lilavati Hospital and Research Centre**\n   - Address: A-791, Bandra Reclamation, Bandra West, Mumbai, Maharashtra 400050\n   - Emergency: Yes\n   - Key facilities: [Comprehensive diagnostics, Trauma, Multi-specialty wings]\n   - Distance (km) from Bandstand: 2.5\n   - Contact: 022-26751000\n\n**Nearby Pharmacies**\n- **NEW LIBERTY DRUG CORNER** — 24/7: No (Standard hours) — Distance: 1.8 km — Contact: N/A (Junction of 16th & 30th Road)\n- **Wellness Forever Pharmacy** is available in Mahim (near Hinduja Hospital), a short drive away, and is open 24/7.\n\n---\n\n## 4. LOCAL AUTHORITIES & EMERGENCY CONTACTS\n### Region: South Mumbai (Colaba, Fort)\n- Police station: **Colaba Police Station** — Contact: 100, 022-22152853 — Address: Mandlik Rd, Apollo Bandar, Colaba, Mumbai, 400001\n- Ambulance numbers: 102, 108\n- Fire helpline: 101\n- Tourist helpline: (022) 69107600\n- Women helpline: 103, 1091\n- Embassy/Consulate (if applicable): N/A\n\n### Region: Elephanta Island\n- Police station: **No police station on the island.** Jurisdiction falls under **Mora Coastal Police Station** on the mainland. For immediate assistance, use emergency numbers upon returning to the mainland.\n- Ambulance numbers: 102, 108 (only accessible from mainland)\n- Fire helpline: 101 (only accessible from mainland)\n- Tourist helpline: (022) 69107600\n- Women helpline: 103, 1091\n- Embassy/Consulate (if applicable): N/A\n\n### Region: Bandra (West)\n- Police station: **Bandra Police Station** — Contact: 100, 022-26423542 — Address: Hill Rd, Bandra West, Mumbai, 400050\n- Ambulance numbers: 102, 108\n- Fire helpline: 101\n- Tourist helpline: (022) 69107600\n- Women helpline: 103, 1091\n- Embassy/Consulate (if applicable): N/A\n\n---\n\n## 5. PERSONALIZED ITEMS TO CARRY\n### Weather-specific\n- Sunscreen (UV Index is high) — To prevent sunburn during outdoor exploration — 1 bottle\n- Sunglasses & Hat — For protection against sun glare — 1 each\n- Light Jacket or Sweatshirt — For potentially cool evenings and early mornings — 1\n### Health & Safety\n- Basic First-Aid Kit — For minor cuts, scrapes, and headaches — 1 kit\n- Hand Sanitizer — To maintain hygiene, especially before eating street food — 1 bottle\n- Reusable Water Bottle — To stay hydrated throughout the day — 1\n- Portable Power Bank — Essential for keeping your phone charged during long days of sightseeing — 1\n### Documents\n- Government Photo ID — For airport, hotel, and identity verification — Original + Digital Copy\n- Digital travel documents — Flight tickets and hotel confirmations saved offline on your phone — Digital copies\n### Electronics\n- Smartphone — For navigation, booking cabs, and communication — 1\n### Clothing & Accessories\n- Comfortable Walking Shoes — You will be walking extensively; comfort is key — 1-2 pairs\n### Special-group considerations\n- Solo Traveler: Always inform someone you trust about your daily itinerary. Keep emergency contacts easily accessible.\n\n---\n\n## 6. SAFETY ADVISORY\n### Region: South Mumbai (Colaba/Fort)\n**Safety rating:** Medium\n**Common risks:**\n- Pickpocketing in crowded areas like Colaba Causeway.\n- Taxi/auto-rickshaw scams (refusing meter, overcharging, claiming hotels are closed).\n- Persistent street vendors or touts.\n**Areas to avoid:** Avoid poorly lit or deserted lanes after dark.\n**Women-specific tips:** N/A\n**Senior-specific tips:** N/A\n**Transport safety tips:**\n- Always use ride-hailing apps like Uber or Ola for transparent and safe travel.\n- If using a 'kaali-peeli' taxi, insist on using the meter. Before starting, confirm \"by meter\".\n**Weather & hazard alerts:** N/A\n\n### Region: Elephanta Island\n**Safety rating:** Low (on island), Medium (ferry transit)\n**Common risks:**\n- Overcrowded ferries. Ensure the boat does not seem overloaded before boarding.\n- Dehydration and sun exposure due to limited shade while exploring.\n- Monkeys can be aggressive; do not feed them and keep food items hidden.\n**Areas to avoid:** Do not wander off marked paths.\n**Women-specific tips:** N/A\n**Senior-specific tips:** N/A\n**Transport safety tips:** Be mindful of your belongings on the ferry. Note the time of the last ferry back to the mainland (usually around 5:30 PM) and plan your return well in advance.\n**Weather & hazard alerts:** **CRITICAL: There are no medical or police facilities on the island.** All emergency support is mainland-based and inaccessible after the last ferry departs.\n\n### Region: Bandra (West)\n**Safety rating:** Low\n**Common risks:**\n- General street crime; be aware of your surroundings, especially at night.\n- Traffic congestion is common.\n**Areas to avoid:** While generally safe, avoid isolated spots along the promenade late at night.\n**Women-specific tips:** N/A\n**Senior-specific tips:** N/A\n**Transport safety tips:** Use ride-hailing apps. Auto-rickshaws are plentiful but insist on the meter.\n**Weather & hazard alerts:** N/A\n\n---\n\n## 7. CONNECTIVITY & ESSENTIAL INFO\n- Recommended SIM options: Airtel offers a physical SIM card at Mumbai Airport (T2 arrivals). Alternatively, consider activating an eSIM (like Airalo or Jio) before you travel for instant connectivity upon landing.\n- Internet & offline maps: Mobile data is generally reliable. Download offline maps of Mumbai on Google Maps for navigation in case of poor connectivity.\n- Payment & currency tips: Use UPI (Google Pay, Paytm) for most transactions, as it is widely accepted even by small vendors. Carry a mix of cash for situations where digital payment is not possible. Credit/debit cards are best for hotels and upscale restaurants.\n- Local apps: Uber and Ola are essential for transportation.\n- Language notes: Marathi is the local language, with Hindi and English being widely spoken and understood across the city, especially in the areas you will be visiting.
                        `
                      }
                      tripTitle={selectedTrip?.trip_title || "My Trip"}
                      onClose={handlePreTripFinish}
                    />
                  </div>
                ) : showBooking ? (
                  <div className="flex-1 overflow-hidden">
                    <BookingWidget
                      isVisible={showBooking}
                      onToggle={() => setShowBooking(false)}
                      itinerariesData={itinerariesGenerated}
                      tripTitle={selectedTrip?.trip_title || "My Trip"}
                      totalDays={
                        selectedTrip?.no_of_days || itinerariesGenerated.length
                      }
                      onContinue={handleBookingContinue}
                      userId={userId}
                      sessionId={sessionId}
                    />
                  </div>
                ) : showItinerary ? (
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
                      onRemovePendingDay={handleRemovePendingDay}
                      onAddPendingDay={handleAddPendingDay}
                      pendingConveyanceDaysFromParent={pendingConveyanceDays}
                      isLoadingPendingDay={
                        isLoadingItinerary && isInsertDayFlow
                      }
                      onDeleteDay={handleDeleteDay}
                      onLocalDeleteDay={handleLocalDeleteDay}
                      onChatSubmit={handleItineraryChatSubmit}
                      allDaysGenerated={
                        itinerariesGenerated.length ===
                        (selectedTrip?.no_of_days ||
                          selectedTrip?.day_wise_plan?.length ||
                          0)
                      }
                      onContinue={handleContinueToBooking}
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
                      {/* Journey Loader - Unified loading screen for all stages */}
                      <JourneyLoader
                        isVisible={showJourneyLoader}
                        currentStep={currentJourneyStep}
                        duration={4000}
                        fromLocation={conveyanceFromCity}
                        toLocation={conveyanceToCity}
                        cityLocation={stayCity}
                      />

                      {/* Test Mode Indicator */}
                      <TestModeIndicator isVisible={testEndResponse} />
                      {/* Conditional wrapper: no max-w constraint for flashcards, max-w-4xl for others */}
                      {showFlashcards ? (
                        <div className="h-full w-full">
                          <div className="h-full flex flex-col relative">
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
                              isSidebarCollapsed={isSidebarCollapsed}
                            />
                          </div>
                        </div>
                      ) : (
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
                          ) : messages.length === 0 ? (
                            <WelcomeScreen
                              isInitializingSession={isInitializingSession}
                              onNudgeClick={setChatInputText}
                            />
                          ) : (
                            <div className="space-y-6 pb-4">
                              {messages.map((message) => (
                                <ChatMessage
                                  key={message.id}
                                  message={message}
                                  currentUser={currentUser}
                                />
                              ))}

                              <ChatLoadingIndicators
                                isLoading={isLoading}
                                isParsingTrips={isParsingTrips}
                              />

                              <div ref={messagesEndRef} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Chat Input - Fixed at bottom */}
                    <ChatInputContainer
                      selectedTrip={selectedTrip}
                      showFlashcards={showFlashcards}
                      isCardManuallySelected={isCardManuallySelected}
                      onClearSelection={() => {
                        setSelectedTrip(null);
                        setIsCardManuallySelected(false);
                        if (flashcardsRef.current) {
                          flashcardsRef.current.clearSelection();
                        }
                      }}
                      textareaRef={textareaRef}
                      chatInput={chatInput}
                      onChatInputChange={setChatInputText}
                      onSubmit={handleChatSubmit}
                      onKeyDown={handleKeyDown}
                      isInitializingSession={isInitializingSession}
                      testEndResponse={testEndResponse}
                      isLoading={isLoading}
                    />
                  </>
                )}
              </div>
            </div>
          ) : activeSection === "conveyance" ? (
            // Conveyance Tab
            <ConveyanceTab
              userId={currentUser?.uid}
              sessionId={sessionId}
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          ) : activeSection === "stays" ? (
            // Stays Tab
            <StaysTab
              userId={currentUser?.uid}
              sessionId={sessionId}
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          ) : (
            // Default: Dashboard if no section matches
            <DashboardContent
              currentUser={currentUser}
              showProfileDropdown={showProfileDropdown}
              setShowProfileDropdown={setShowProfileDropdown}
              onSettings={() => router.push("/flights/settings")}
              onLogout={logout}
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
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
          userId={userId || currentUser.uid}
        />
      )}

      {/* Chat Loading Indicator - Top Right Below Navbar (Only for Flashcards/Itinerary) */}
      {activeSection === "chat" && (showFlashcards || showItinerary) && (
        <div className="fixed top-20 right-5 z-[9998]">
          <ChatLoadingIndicator
            isVisible={isLoading && !isInitializingSession && !showOverlay}
            theme={showItinerary ? "white" : "default"}
          />
        </div>
      )}

      {/* Message Response Overlay - Only for Flashcards/Itinerary */}
      {activeSection === "chat" && (showFlashcards || showItinerary) && (
        <MessageResponseOverlay
          message={overlayMessage}
          isVisible={showOverlay}
          onClose={() => {
            setShowOverlay(false);
            setOverlayMessage(null);
          }}
          autoHideDuration={8000}
          source={showItinerary ? "Itinerary" : "Trip Planner"}
        />
      )}

      {/* Finalize Loader - Using JourneyLoader for booking activities */}
      <JourneyLoader
        isVisible={showFinalizeLoader}
        currentStep="booking-activities"
      />

      {/* Pre-Trip Loader - Using JourneyLoader for pre-trip brief */}
      <JourneyLoader
        isVisible={showCongratsLoader}
        currentStep="pre-trip-brief"
      />
    </div>
  );
}
