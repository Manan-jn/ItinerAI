"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MdChat, MdExplore } from "react-icons/md";
import { useAuth } from "../../contexts/AuthContext";
import SessionDebugFlights from "../../components/SessionDebugFlights";
import FlashcardsWidgetWhiteTheme from "../../components/FlashcardsWidgetWhiteTheme";
import type { FlashcardsWidgetRef } from "../../components/flashcards/types";
import FlightsWidget from "../../components/FlightsWidget";
import ItineraryWidget from "../../components/ItineraryWidget";
import DateSelectorWidget from "../../components/DateSelectorWidget";
import OnboardingModalWhite from "../../components/auth/OnboardingModalWhite";
import ItinerAIChatBox from "../../components/ItinerAIChatBox";
import { getSessionId } from "../../utils/sessionManager";
import {
  imageDownloader,
  extractImageUrls,
  validateAndPopulateTripData,
} from "../../utils/imageDownloader";
// New component imports
import { Sidebar } from "../../components/flights-page/Sidebar";
import { DashboardContent } from "../../components/flights-page/DashboardContent";
import { FlightsContent } from "../../components/flights-page/FlightsContent";
import { TripLoader } from "../../components/flights-page/TripLoader";
import { ChatNavbar } from "../../components/flights-page/ChatNavbar";

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
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [tripSuggestions, setTripSuggestions] = useState<any[]>([]);
  const [isParsingTrips, setIsParsingTrips] = useState(false);
  const [showTripLoader, setShowTripLoader] = useState(false);
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
      console.log("API Response received:", data);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
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
      console.log("Sending trip to memory API:", selectedTrip);

      // Send the selected trip to memory API
      const response = await fetch("/api/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          updates: selectedTrip,
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

      // Close flashcards and clear selection
      setShowFlashcards(false);
      setSelectedTrip(null);

      // Clear flashcards selection via ref
      if (flashcardsRef.current) {
        flashcardsRef.current.clearSelection();
      }

      // Add a small delay before showing assistant response
      setTimeout(() => {
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          content: `Great choice! I've saved "${selectedTrip.trip_title}" to your itinerary. What would you like to know or do next?`,
          role: "assistant" as const,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error updating trip memory:", error);
      setIsLoading(false);
      alert("Failed to save trip selection. Please try again.");
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
      const data = await makeAPICall(currentInput);

      // Check if response contains trip suggestions
      let parsedTripSuggestions: any[] = [];
      let shouldShowPlaces = false;
      let messageContent = "";

      try {
        console.log("Full API response data:", JSON.stringify(data, null, 2));

        // Enhanced trip detection - Check for trip response at ANY level
        const isTripResponse =
          data.response_type === "trip" ||
          (data.message &&
            typeof data.message === "object" &&
            data.message.response_type === "trip");

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
        } else {
          console.log("❌ No trip response detected", {
            root_response_type: data.response_type,
            nested_response_type: data.message?.response_type,
          });
        }

        // Handle different response structures
        // Case 1: Response type at root level (new format from temp.json)
        if (data.response_type === "trip" && data.message) {
          console.log(
            "Detected trip response at root level (temp.json format)"
          );

          messageContent =
            data.message.message ||
            "Here are some amazing trip suggestions for you!";

          // Extract trip suggestions directly from data.message.trips
          if (data.message.trips && Array.isArray(data.message.trips)) {
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
        // Case 2: Response with trip_suggestions wrapper
        else if (data.response_type === "trip" && data.trip_suggestions) {
          console.log("Detected trip response with trip_suggestions wrapper");

          messageContent =
            data.trip_suggestions.message ||
            "Here are some amazing trip suggestions for you!";

          // Extract trip suggestions
          if (
            data.trip_suggestions.trips &&
            Array.isArray(data.trip_suggestions.trips)
          ) {
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
        // Case 3: Response nested under data.message (old format)
        else if (data.message && typeof data.message === "object") {
          const messageData = data.message;

          console.log("Checking nested message format");

          if (messageData.response_type === "text" && messageData.message) {
            console.log("Detected text response");
            messageContent = messageData.message;
          } else if (messageData.response_type === "trip") {
            console.log("Detected trip response in nested format");
            console.log("messageData structure:", Object.keys(messageData));

            messageContent =
              messageData.message ||
              "Here are some amazing trip suggestions for you!";

            // Case A: trips array directly under messageData (actual current API format)
            if (messageData.trips && Array.isArray(messageData.trips)) {
              console.log("Found trips array directly under messageData");
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
            messageContent = messageData.message || JSON.stringify(messageData);
          }
        }
        // Case 4: String response (old format)
        else if (typeof data.message === "string") {
          messageContent = data.message;
        }
        // Case 5: Fallback
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
                setShowItinerary(false);
                setSelectedTrip(null);
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
      } else {
        // Non-trip response - hide loader immediately
        setIsParsingTrips(false);
        setShowTripLoader(false);
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

      // Hide loader on error
      setIsParsingTrips(false);
      setShowTripLoader(false);
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
      console.log(
        `\n--- Processing trip ${tripIdx + 1}: ${trip.trip_title} ---`
      );
      console.log("Raw trip data:", JSON.stringify(trip, null, 2));

      // Create a map of cities from trip_route
      const cityMap = new Map();
      if (trip.trip_route && Array.isArray(trip.trip_route)) {
        console.log(`Trip route has ${trip.trip_route.length} cities`);
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
          console.log(
            `  - Mapped city: ${city.place_name || city.name}`,
            cityData
          );
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

          console.log(`  Day ${day.day_number}:`);
          console.log(`    - stay_details:`, day.stay_details);
          console.log(`    - conveyance_details:`, day.conveyance_details);

          // Extract city name with priority: stay_details > conveyance to_city
          if (
            day.stay_details?.is_required &&
            day.stay_details?.city &&
            day.stay_details.city !== "user_location"
          ) {
            cityName = day.stay_details.city;
            console.log(`    - City from stay_details: ${cityName}`);
          } else if (
            day.conveyance_details?.is_required &&
            day.conveyance_details?.to_city &&
            day.conveyance_details.to_city !== "user_location"
          ) {
            cityName = day.conveyance_details.to_city;
            console.log(`    - City from conveyance to_city: ${cityName}`);
          } else if (
            day.conveyance_details?.is_required &&
            day.conveyance_details?.from_city &&
            day.conveyance_details?.to_city &&
            day.conveyance_details.from_city ===
              day.conveyance_details.to_city &&
            day.conveyance_details.to_city !== "user_location"
          ) {
            cityName = day.conveyance_details.to_city;
            console.log(`    - City from same from/to city: ${cityName}`);
          } else if (
            day.conveyance_details?.is_required &&
            day.conveyance_details?.from_city &&
            day.conveyance_details.from_city !== "user_location"
          ) {
            cityName = day.conveyance_details.from_city;
            console.log(`    - City from conveyance from_city: ${cityName}`);
          }

          if (cityName) {
            const cityInfo = cityMap.get(cityName);

            if (cityInfo) {
              cities.push(cityInfo);
              console.log(`    - Added city info from map: ${cityName}`);
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
              console.log(`    - Created basic city info for: ${cityName}`);
            }
          } else {
            console.log(
              `    - No city found for day ${day.day_number} - checking activities`
            );
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
          };
        }) || [];

      console.log(
        `Transformed ${transformedDayPlan.length} days for trip ${tripIdx + 1}`
      );

      // Return transformed trip with theme instead of themes
      const transformed = {
        trip_title: trip.trip_title,
        no_of_days: trip.no_of_days,
        estimated_budget: trip.estimated_budget,
        best_time_to_visit: trip.best_time_to_visit,
        theme: trip.themes || trip.theme || [], // Handle both 'themes' and 'theme'
        day_wise_plan: transformedDayPlan,
      };

      console.log(`Final transformed trip ${tripIdx + 1}:`);
      console.log("  - trip_title:", transformed.trip_title);
      console.log("  - no_of_days:", transformed.no_of_days);
      console.log("  - estimated_budget:", transformed.estimated_budget);
      console.log("  - best_time_to_visit:", transformed.best_time_to_visit);
      console.log("  - theme:", transformed.theme);
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
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={logout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white min-h-0">
        {/* Conditional rendering based on active section */}
        <div className="flex-1 flex flex-col min-h-0 transition-all duration-500 ease-in-out">
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
            <div className="flex-1 flex flex-col bg-white min-h-0">
              <ChatNavbar
                currentUser={currentUser}
                showProfileDropdown={showProfileDropdown}
                setShowProfileDropdown={setShowProfileDropdown}
                onSettings={() => router.push("/flights/settings")}
                onLogout={logout}
                showFlashcards={showFlashcards}
                showFlights={showFlights}
                showItinerary={showItinerary}
                showDateSelector={showDateSelector}
                showDebug={showDebug}
                onFlashcardsToggle={() => {
                  if (showFlashcards) {
                    setShowFlashcards(false);
                    setSelectedTrip(null);
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
                    setShowItinerary(false);
                    setShowDateSelector(false);
                    setSelectedTrip(null);
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
                    setShowDateSelector(false);
                    setSelectedTrip(null);
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
                    setShowItinerary(false);
                    setSelectedTrip(null);
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
                    />
                  </div>
                ) : showDateSelector ? (
                  <div className="flex-1 overflow-hidden">
                    <DateSelectorWidget
                      isVisible={showDateSelector}
                      onToggle={() => setShowDateSelector(false)}
                    />
                  </div>
                ) : (
                  <>
                    {/* Messages Container - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 relative">
                      {/* Trip Loader */}
                      <TripLoader
                        showTripLoader={showTripLoader}
                        duration={4000}
                      />
                      <div className="max-w-4xl mx-auto h-full">
                        {showFlights ? (
                          <div className="h-full flex flex-col relative">
                            <div className="flex-1 min-h-0 overflow-hidden">
                              <FlightsWidget
                                isVisible={showFlights}
                                onToggle={() => setShowFlights(false)}
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
                                  setSelectedTrip(null);
                                }}
                                trips={
                                  tripSuggestions.length > 0
                                    ? tripSuggestions
                                    : undefined
                                }
                                rightPanelCollapsed={true}
                                onTripSelect={setSelectedTrip}
                              />
                            </div>
                          </div>
                        ) : messages.length === 0 ? (
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
                        <ItinerAIChatBox
                          ref={textareaRef}
                          value={chatInput}
                          onChange={setChatInputText}
                          onSubmit={handleChatSubmit}
                          onKeyDown={handleKeyDown}
                          placeholder={
                            selectedTrip && showFlashcards
                              ? "Click send to confirm trip selection"
                              : "Ask ItinerAI"
                          }
                          disabled={
                            isLoading || (selectedTrip && showFlashcards)
                          }
                          isLoading={isLoading}
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
