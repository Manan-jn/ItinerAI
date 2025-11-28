"use client";

import React, { useState, useMemo } from "react";
import { MdLocationOn } from "react-icons/md";
import MessageResponseOverlay from "./MessageResponseOverlay";
import ItinerAIChatBox from "./ItinerAIChatBox";
import ChatLoadingIndicator from "./ChatLoadingIndicator";

export interface InTripWidgetProps {
  isVisible: boolean;
  onClose?: () => void;
  tripTitle: string;
  itineraries: any[];
  userId?: string;
  sessionId?: string;
}

// Helper function to process Google Places photo URLs to use authenticated proxy
const processPhotoUrl = (photoUrl: string | null): string | null => {
  if (!photoUrl) return null;

  // Check if it's a Google Places photo URL
  if (photoUrl.includes("maps.googleapis.com/maps/api/place/photo")) {
    try {
      const urlObj = new URL(photoUrl);
      const photoReference = urlObj.searchParams.get("photoreference");
      if (photoReference) {
        // Convert to proxy URL
        const proxyUrl = `/api/place-photo?photoreference=${photoReference}&maxwidth=800`;
        return proxyUrl;
      }
    } catch (error) {
      console.warn("❌ Error processing Google Places photo URL:", error);
    }
  }

  // Return original URL for non-Google Places photos
  return photoUrl;
};

// Helper function to get activity icon and configuration
const getActivityConfig = (
  activityType: string,
  subType: string,
  conveyanceType?: string
) => {
  // Get emoji based on activity type
  const getActivityEmoji = (): string => {
    if (activityType === "eat") {
      if (subType === "breakfast" || subType === "Breakfast") return "☕";
      if (subType === "lunch" || subType === "Lunch") return "🍽️";
      if (subType === "dinner" || subType === "Dinner") return "🍽️";
      return "🍴";
    }
    if (activityType === "travel") {
      if (conveyanceType === "flight") return "✈️";
      if (conveyanceType === "cab" || conveyanceType === "taxi") return "🚕";
      if (conveyanceType === "train") return "🚆";
      if (conveyanceType === "bus") return "🚌";
      if (subType === "airport_formalities") return "🛂";
      return "🚗";
    }
    if (activityType === "visit") {
      if (subType === "Beach" || subType === "beach") return "🏖️";
      if (subType === "Historical Site" || subType === "historical_site")
        return "🏛️";
      if (subType === "Nightlife" || subType === "nightlife") return "🎉";
      if (subType === "landmark") return "🗿";
      if (subType === "shopping") return "🛍️";
      return "📍";
    }
    if (activityType === "rest") {
      if (subType === "check_in") return "🏨";
      return "🛏️";
    }
    if (activityType === "other") return "📋";
    if (activityType === "free_time") return "🕐";
    return "🎯";
  };

  // Get color scheme based on activity type
  switch (activityType) {
    case "travel":
      return {
        gradient: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)",
        icon: getActivityEmoji(),
        bgColor: "#EEF2FF",
        borderColor: "#C7D2FE",
      };
    case "rest":
      return {
        gradient: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
        icon: getActivityEmoji(),
        bgColor: "#F5F3FF",
        borderColor: "#DDD6FE",
      };
    case "eat":
      return {
        gradient: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
        icon: getActivityEmoji(),
        bgColor: "#FEF3C7",
        borderColor: "#FDE68A",
      };
    case "visit":
      return {
        gradient: "linear-gradient(135deg, #32B8C6 0%, #21808D 100%)",
        icon: getActivityEmoji(),
        bgColor: "#E0F2FE",
        borderColor: "#BAE6FD",
      };
    default:
      return {
        gradient: "linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)",
        icon: getActivityEmoji(),
        bgColor: "#F3F4F6",
        borderColor: "#E5E7EB",
      };
  }
};

// Helper to generate Google Maps URL
const getGoogleMapsUrl = (location: any) => {
  if (location?.lat && location?.long) {
    return `https://maps.google.com/?q=${location.lat},${location.long}`;
  }
  if (location?.place_name) {
    return `https://maps.google.com/?q=${encodeURIComponent(
      location.place_name
    )}`;
  }
  return null;
};

// Helper function to add hours to a time string (HH:MM format)
const addHoursToTime = (timeStr: string, hoursToAdd: number): string => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + hoursToAdd * 60;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(
    2,
    "0"
  )}`;
};

// Helper function to extract city from address
const extractCityFromAddress = (address: string): string => {
  if (!address) return "Unknown City";

  // Split by comma and get the first part (usually city)
  const parts = address.split(",");
  if (parts.length > 0) {
    return parts[0].trim();
  }
  return address;
};

// Helper function to extract country from address
const extractCountryFromAddress = (address: string): string => {
  if (!address) return "Unknown Country";

  // Split by comma and get the last part (usually country)
  const parts = address.split(",");
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return "Unknown Country";
};

// Helper function to process itineraries and inject events
const processItinerariesWithFlightChange = (
  originalItineraries: any[]
): { modifiedItineraries: any[]; eventsList: any[] } => {
  // Create a deep copy to avoid modifying the original
  const itinerariesCopy = JSON.parse(JSON.stringify(originalItineraries));
  const eventsList: any[] = [];

  // ========== PART 1: FLIGHT/TRAIN SCHEDULE CHANGE ==========
  // Step 1: Find all days with flight or train conveyances
  const conveyanceDays: Array<{
    dayIndex: number;
    scheduleIndex: number;
    conveyance: any;
  }> = [];

  itinerariesCopy.forEach((day: any, dayIndex: number) => {
    if (day.schedule && Array.isArray(day.schedule)) {
      day.schedule.forEach((item: any, scheduleIndex: number) => {
        if (
          item.activity_type === "travel" &&
          (item.conveyance_type === "flight" ||
            item.conveyance_type === "train")
        ) {
          conveyanceDays.push({ dayIndex, scheduleIndex, conveyance: item });
        }
      });
    }
  });

  // Step 2: If we found conveyances, select the middle one (or mid+1)
  // IMPORTANT: If no flight/train conveyances found, nothing is added to eventsList
  // (no fallback to last day or first day)
  if (conveyanceDays.length > 0) {
    // Sort by day number to ensure consistent ordering
    conveyanceDays.sort((a, b) => a.dayIndex - b.dayIndex);

    // Select middle or mid+1
    const middleIndex = Math.floor(conveyanceDays.length / 2);
    const selectedConveyance = conveyanceDays[middleIndex];

    // Randomly choose delay: 2.5 or 3 hours
    const delayHours = Math.random() > 0.5 ? 3 : 2.5;

    // Get the original conveyance
    const original =
      itinerariesCopy[selectedConveyance.dayIndex].schedule[
        selectedConveyance.scheduleIndex
      ];

    // Calculate updated times
    const updatedDepartureTime = addHoursToTime(
      original.departure_time || original.start_time,
      delayHours
    );
    const updatedArrivalTime = addHoursToTime(
      original.arrival_time || original.end_time,
      delayHours
    );
    // Step 3: Create the flight schedule change object
    const flightChangeObject = {
      event_type: "FLIGHT_SCHD_CHG",
      flight_number: original.flight_number || original.train_number || "",
      updated_arrival_time: updatedArrivalTime,
      updated_arrival_date:
        original.date || itinerariesCopy[selectedConveyance.dayIndex].date,
      updated_departure_date:
        original.date || itinerariesCopy[selectedConveyance.dayIndex].date,
      updated_departure_time: updatedDepartureTime,
      flight_update_message: `The ${
        original.conveyance_type === "flight" ? "flight" : "train"
      } has been delayed by ${delayHours} hours from its scheduled time.`,
    };

    eventsList.push(flightChangeObject);

  }

  // ========== PART 2: WEATHER CHANGE EVENT ==========
  // Select mid or mid+1 day from ALL days (no conveyance criteria)
  if (itinerariesCopy.length > 0) {
    // Calculate middle index (mid or mid+1)
    const middleIndex = Math.floor(itinerariesCopy.length / 2);
    const selectedDayIndex = middleIndex;
    const selectedDay = itinerariesCopy[selectedDayIndex];


    // Extract location information from the day's schedule
    let city = "Unknown City";
    let country = "Unknown Country";
    let address = "";

    // Try to get address from the first activity with location
    if (selectedDay.schedule && selectedDay.schedule.length > 0) {
      for (const activity of selectedDay.schedule) {
        if (activity.address) {
          address = activity.address;
          city = extractCityFromAddress(address);
          country = extractCountryFromAddress(address);
          break;
        } else if (activity.from_location?.address) {
          address = activity.from_location.address;
          city = extractCityFromAddress(address);
          country = extractCountryFromAddress(address);
          break;
        } else if (activity.to_location?.address) {
          address = activity.to_location.address;
          city = extractCityFromAddress(address);
          country = extractCountryFromAddress(address);
          break;
        }
      }
    }

    // Generate random weather conditions
    const weatherConditions = [
      "Severe thunderstorm until 16:00 hrs.",
      "Heavy rainfall expected throughout the day.",
      "Strong winds with gusts up to 60 km/h until 18:00 hrs.",
      "Dense fog until 12:00 hrs, visibility reduced.",
      "Heat wave warning, temperatures exceeding 40°C.",
      "Heavy snowfall expected, travel may be affected.",
    ];

    const randomWeather =
      weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

    // Create weather change object
    const weatherChangeObject = {
      event_type: "WEATHER_CHG",
      city: city,
      country: country,
      date: selectedDay.date || new Date().toISOString().split("T")[0],
      weather_condition: randomWeather,
    };

    eventsList.push(weatherChangeObject);

  }

  return { modifiedItineraries: itinerariesCopy, eventsList };
};

export default function InTripWidget({
  isVisible,
  onClose,
  tripTitle,
  itineraries,
  userId: userIdProp,
  sessionId: sessionIdProp,
}: InTripWidgetProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [isTestPanelOpen, setIsTestPanelOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Run state management
  const [isRunning, setIsRunning] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState<number | null>(
    null
  );
  const [processedItineraries, setProcessedItineraries] =
    useState<any[]>(itineraries);

  // Track which days have been updated (for visual effects)
  const [updatedDays, setUpdatedDays] = useState<Set<number>>(new Set());

  // Message overlay state
  const [overlayMessage, setOverlayMessage] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Animation state for smooth closing
  const [isClosing, setIsClosing] = useState(false);

  // Process itineraries with event simulations
  const { eventsList } = useMemo(
    () => processItinerariesWithFlightChange(itineraries),
    [itineraries]
  );

  // State for editable JSON
  const [editableEventsJSON, setEditableEventsJSON] = useState<string>("");
  const [isJSONValid, setIsJSONValid] = useState<boolean>(true);

  // Initialize editable JSON when eventsList changes
  React.useEffect(() => {
    if (eventsList && eventsList.length > 0) {
      setEditableEventsJSON(JSON.stringify(eventsList, null, 2));
      setIsJSONValid(true);
    } else {
      setEditableEventsJSON("[]");
      setIsJSONValid(true);
    }
  }, [eventsList]);

  // Handle smooth close animation
  const handleClose = () => {
    if (onClose) {
      setIsClosing(true);
      // Wait for fade-out animation to complete before calling onClose
      setTimeout(() => {
        onClose();
        setIsClosing(false);
      }, 300); // Match animation duration
    }
  };

  if (!isVisible && !isClosing) return null;

  const handleTestClick = () => {
    setIsTestPanelOpen(!isTestPanelOpen);
  };

  const handleClosePanel = () => {
    setIsTestPanelOpen(false);
    setIsRunning(false);
    setCurrentEventIndex(null);
  };

  // Function to process all events in a single payload
  const handleRunEvents = async () => {
    if (!userIdProp || !sessionIdProp) {
      setOverlayMessage("User session not found. Please log in.");
      setShowOverlay(true);
      return;
    }

    // Parse the edited JSON
    let eventsToSend: any[];
    try {
      eventsToSend = JSON.parse(editableEventsJSON);
      if (!Array.isArray(eventsToSend)) {
        setOverlayMessage("Invalid JSON: Events must be an array.");
        setShowOverlay(true);
        setIsJSONValid(false);
        return;
      }
      setIsJSONValid(true);
    } catch (error) {
      setOverlayMessage("Invalid JSON format. Please check your syntax.");
      setShowOverlay(true);
      setIsJSONValid(false);
      return;
    }

    if (eventsToSend.length === 0) {
      setOverlayMessage("No events to process.");
      setShowOverlay(true);
      return;
    }

    setIsRunning(true);
    setCurrentEventIndex(0); // Indicate processing started

    try {

      // Call the in-trip API with ALL events in a single payload
      const response = await fetch("/api/in-trip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userIdProp,
          session_id: sessionIdProp,
          change_of_events: eventsToSend, // Send all events at once
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Events processing failed:`, errorData);
        setOverlayMessage(
          `Failed to process events: ${errorData.error || "Unknown error"}`
        );
        setShowOverlay(true);
        setIsRunning(false);
        setCurrentEventIndex(null);
        return;
      }

      const data = await response.json();
      console.log(`✅ Events response:`, data);

      // Extract the actual response from the nested message field
      const messageData = data.message || data;
      const responseType = messageData.response_type;
      const responseMessage = messageData.message;

      // Always show the message if present
      if (responseMessage) {
        setOverlayMessage(responseMessage);
        setShowOverlay(true);
      }

      // Handle response based on response_type
      if (responseType === "itinerary" && messageData.itinerary) {
        // The itinerary can be an array of updated days
        const itineraryArray = Array.isArray(messageData.itinerary)
          ? messageData.itinerary
          : [messageData.itinerary];

        const updatedItineraries = [...processedItineraries];
        const updatedDayNumbers: number[] = [];

        // Update all days that were modified
        itineraryArray.forEach((updatedDayData: any) => {
          const dayNumber = updatedDayData.day_number || updatedDayData.day;
          if (
            dayNumber &&
            dayNumber > 0 &&
            dayNumber <= updatedItineraries.length
          ) {
            updatedItineraries[dayNumber - 1] = updatedDayData;
            updatedDayNumbers.push(dayNumber);
          }
        });

        if (updatedDayNumbers.length > 0) {
          setProcessedItineraries([...updatedItineraries]);

          // Mark all updated days
          setUpdatedDays((prev) => {
            const newSet = new Set(prev);
            updatedDayNumbers.forEach((dayNum) => newSet.add(dayNum - 1));
            return newSet;
          });

          // Show message if not already shown
          if (!responseMessage) {
            setOverlayMessage(
              `Itinerary updated for ${updatedDayNumbers.length} day(s): ${updatedDayNumbers.join(
                ", "
              )}`
            );
            setShowOverlay(true);
          }
        }
      } else if (responseType === "text" || responseType === "no_update") {
        // Message already shown above, but if not present, show default
        if (!responseMessage) {
          const message = messageData.text || "Events processed successfully";
          setOverlayMessage(message);
          setShowOverlay(true);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing events:`, error);
      setOverlayMessage(
        `Error processing events: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setShowOverlay(true);
    } finally {
      // All events processed
      setCurrentEventIndex(null);
      setIsRunning(false);
    }
  };

  // Handle chat message submission
  const handleChatSubmit = async (message: string) => {
    if (!userIdProp || !sessionIdProp) {
      setOverlayMessage("User session not found. Please log in.");
      setShowOverlay(true);
      return;
    }

    if (!message.trim()) {
      console.warn("⚠️ Empty message, ignoring submission");
      return;
    }

    setIsChatLoading(true);

    try {
      // Call the in-trip API with user_message
      const response = await fetch("/api/in-trip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userIdProp,
          session_id: sessionIdProp,
          user_message: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Chat submission failed:", errorData);
        setOverlayMessage(
          `Failed to process message: ${errorData.error || "Unknown error"}`
        );
        setShowOverlay(true);
        return;
      }

      const data = await response.json();
      console.log("✅ Chat response:", data);

      // Extract the actual response from the nested message field
      const messageData = data.message || data;
      const responseType = messageData.response_type;
      const responseMessage = messageData.message;

      // Always show the message if present
      if (responseMessage) {
        setOverlayMessage(responseMessage);
        setShowOverlay(true);
      }

      // Handle response based on response_type
      if (responseType === "itinerary" && messageData.itinerary) {
        // The itinerary is an array, extract the first item (updated day)
        const updatedDayData = Array.isArray(messageData.itinerary)
          ? messageData.itinerary[0]
          : messageData.itinerary;

        const dayNumber = updatedDayData.day_number || updatedDayData.day;
        if (
          dayNumber &&
          dayNumber > 0 &&
          dayNumber <= processedItineraries.length
        ) {
          const updatedItineraries = [...processedItineraries];
          updatedItineraries[dayNumber - 1] = updatedDayData;
          setProcessedItineraries([...updatedItineraries]);

          // Mark this day as updated (for visual effect)
          setUpdatedDays((prev) => new Set(prev).add(dayNumber - 1));

          // Show message if not already shown
          if (!responseMessage) {
            setOverlayMessage(
              `Itinerary updated for Day ${dayNumber} based on your message`
            );
            setShowOverlay(true);
          }
        }
      } else if (responseType === "text" || responseType === "no_update") {
        // Message already shown above, but if not present, show default
        if (!responseMessage) {
          const message = messageData.text || "Message processed successfully";
          setOverlayMessage(message);
          setShowOverlay(true);
        }
      }

    } catch (error) {
      console.error("❌ Error in chat submission:", error);
      setOverlayMessage(
        `Error processing message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setShowOverlay(true);
    } finally {
      setIsChatLoading(false);
    }
  };

  const currentDayItinerary = processedItineraries[selectedDay] || {};

  // Process schedule items similar to ItineraryWidget
  const processedStops =
    currentDayItinerary.schedule?.map((item: any, index: number) => {
      // Calculate duration if start and end times are provided
      let duration = undefined;
      if (item.start_time && item.end_time) {
        const start = item.start_time.split(":");
        const end = item.end_time.split(":");
        const startMins = parseInt(start[0]) * 60 + parseInt(start[1]);
        const endMins = parseInt(end[0]) * 60 + parseInt(end[1]);
        let diffMins = endMins - startMins;
        if (diffMins < 0) diffMins += 24 * 60; // Handle overnight
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        if (hours > 0 && mins > 0) {
          duration = `${hours}h ${mins}m`;
        } else if (hours > 0) {
          duration = `${hours}h`;
        } else if (mins > 0) {
          duration = `${mins}m`;
        }
      }

      return {
        id: `stop-${index}`,
        ...item,
        place_name: item.place_name || item.description?.substring(0, 50),
        time: `${item.start_time} - ${item.end_time}`,
        duration,
      };
    }) || [];

  return (
    <>
      <div className={`intrip-widget-container ${isClosing ? 'closing' : ''}`}>
        <div className="centered-wrapper">
          {/* Header Section */}
          <div className="intrip-header">
            <div className="header-content">
              <h2 className="header-title">🗺️ {tripTitle}</h2>
            </div>
            <div className="header-actions">
              <button
                onClick={isTestPanelOpen ? handleRunEvents : handleTestClick}
                className={`test-button ${isRunning ? "running" : ""}`}
                disabled={isRunning}
                aria-label={
                  isRunning
                    ? "Processing events..."
                    : isTestPanelOpen
                    ? "Run test"
                    : "Open test panel"
                }
              >
                {isRunning ? (
                  <>
                    <svg
                      className="spinner"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {isTestPanelOpen ? (
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      ) : (
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                      )}
                    </svg>
                    <span>{isTestPanelOpen ? "Run" : "Test"}</span>
                  </>
                )}
              </button>
              {isTestPanelOpen && (
                <button
                  onClick={handleClosePanel}
                  className="close-panel-button"
                  aria-label="Close test panel"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  <span>Close</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="content-wrapper">
            {/* Itinerary Container */}
            <div
              className={`itinerary-container ${
                isTestPanelOpen ? "with-panel" : ""
              }`}
            >
              {/* Day Tabs */}
              <div className="day-tabs">
                {processedItineraries.map((day, index) => (
                  <button
                    key={index}
                    className={`day-tab ${
                      selectedDay === index ? "active" : ""
                    } ${updatedDays.has(index) ? "updated" : ""}`}
                    onClick={() => setSelectedDay(index)}
                  >
                    <span className="day-tab-content">
                      Day {index + 1}
                      {updatedDays.has(index) && (
                        <span className="update-indicator">●</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>

              {/* Day Content */}
              <div className="day-content">
                <div
                  className={`day-header ${
                    updatedDays.has(selectedDay) ? "updated-header" : ""
                  }`}
                >
                  <div className="day-header-left">
                    <div className="day-date-badge">
                      📅 {currentDayItinerary.date || `Day ${selectedDay + 1}`}
                      {updatedDays.has(selectedDay) && (
                        <span className="updated-badge">Updated!</span>
                      )}
                    </div>
                    <h3 className="day-title">
                      {currentDayItinerary.title ||
                        `Day ${selectedDay + 1} Itinerary`}
                    </h3>
                  </div>
                  {currentDayItinerary.summary && (
                    <p className="day-summary">{currentDayItinerary.summary}</p>
                  )}
                </div>

                {/* Timeline Container */}
                <div className="timeline-container">
                  {processedStops.map((stop: any, index: number) => {
                    const isLast = index === processedStops.length - 1;
                    const activityType = stop.activity_type || "other";
                    const config = getActivityConfig(
                      activityType,
                      stop.sub_type,
                      stop.conveyance_type
                    );

                    // Get photo URL
                    const photos =
                      stop.photos ||
                      stop.from_location?.photos ||
                      stop.to_location?.photos ||
                      [];
                    const rawPhotoUrl =
                      photos.length > 0
                        ? photos[0]
                        : stop.image_url || stop.photo_url || null;
                    const photoUrl = processPhotoUrl(rawPhotoUrl);

                    // Get maps URL
                    const mapsUrl = getGoogleMapsUrl(
                      stop.from_location || stop.to_location || stop
                    );

                    // Check if card is expanded
                    const isExpanded = expandedCards.has(stop.id);

                    return (
                      <div key={stop.id} className="timeline-item">
                        {/* Time Label */}
                        <div className="timeline-time">{stop.start_time}</div>

                        {/* Timeline Connector */}
                        <div className="timeline-connector">
                          <div className="timeline-dot"></div>
                          {!isLast && <div className="timeline-line"></div>}
                        </div>

                        {/* Activity Card */}
                        <div
                          className={`activity-card ${
                            isExpanded ? "expanded" : ""
                          }`}
                          onClick={() => {
                            setExpandedCards((prev) => {
                              const newSet = new Set(prev);
                              if (newSet.has(stop.id)) {
                                newSet.delete(stop.id);
                              } else {
                                newSet.add(stop.id);
                              }
                              return newSet;
                            });
                          }}
                        >
                          {/* Card Header */}
                          <div className="card-header">
                            <div
                              className="activity-icon"
                              style={{ background: config.gradient }}
                            >
                              {config.icon}
                            </div>
                            <div className="card-header-content">
                              <h4 className="activity-title">
                                {stop.place_name ||
                                  stop.description?.substring(0, 50)}
                              </h4>

                              {/* Route for travel activities */}
                              {activityType === "travel" &&
                                (stop.from_location || stop.to_location) && (
                                  <div className="activity-route">
                                    <span>
                                      {stop.from_location?.place_name ||
                                        "Start"}
                                    </span>
                                    <span>→</span>
                                    <span>
                                      {stop.to_location?.place_name || "End"}
                                    </span>
                                    {stop.airline && stop.flight_number && (
                                      <span className="flight-info">
                                        ({stop.airline} {stop.flight_number})
                                      </span>
                                    )}
                                  </div>
                                )}

                              {/* Location for other activities */}
                              {activityType !== "travel" && stop.address && (
                                <div className="activity-location">
                                  <MdLocationOn size={14} />
                                  <span>{stop.address}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="card-badges">
                            {stop.duration && (
                              <span className="badge duration">
                                ⏱️ {stop.duration}
                              </span>
                            )}
                            {stop.fare && stop.fare > 0 && (
                              <span className="badge fare">
                                ₹{stop.fare.toLocaleString()}
                              </span>
                            )}
                            {stop.distance_km && stop.distance_km > 0 && (
                              <span className="badge distance">
                                🛫 {stop.distance_km} km
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p className="activity-description">
                            {stop.description}
                          </p>

                          {/* Expand Indicator */}
                          <div className="expand-indicator">
                            <span>View details</span>
                            <span
                              className={`arrow ${
                                isExpanded ? "expanded" : ""
                              }`}
                            >
                              ▼
                            </span>
                          </div>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="expanded-content">
                              {/* Photo */}
                              {photoUrl && (
                                <img
                                  src={photoUrl}
                                  alt={stop.place_name}
                                  className="activity-photo"
                                />
                              )}

                              {/* Travel Details */}
                              {activityType === "travel" &&
                                (stop.departure_time || stop.arrival_time) && (
                                  <div className="detail-grid">
                                    {stop.departure_time && (
                                      <div className="detail-item">
                                        <div className="detail-label">
                                          🛫 Departure
                                        </div>
                                        <div className="detail-value">
                                          {stop.departure_time}
                                        </div>
                                      </div>
                                    )}
                                    {stop.arrival_time && (
                                      <div className="detail-item">
                                        <div className="detail-label">
                                          🛬 Arrival
                                        </div>
                                        <div className="detail-value">
                                          {stop.arrival_time}
                                        </div>
                                      </div>
                                    )}
                                    {stop.airline && (
                                      <div className="detail-item">
                                        <div className="detail-label">
                                          ✈️ Airline
                                        </div>
                                        <div className="detail-value">
                                          {stop.airline}
                                        </div>
                                      </div>
                                    )}
                                    {stop.flight_number && (
                                      <div className="detail-item">
                                        <div className="detail-label">
                                          🎫 Flight No.
                                        </div>
                                        <div className="detail-value">
                                          {stop.flight_number}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                              {/* Restaurant Details */}
                              {activityType === "eat" && (
                                <div className="detail-grid">
                                  {stop.cuisine && (
                                    <div className="detail-item">
                                      <div className="detail-label">
                                        🍽️ Cuisine
                                      </div>
                                      <div className="detail-value">
                                        {stop.cuisine}
                                      </div>
                                    </div>
                                  )}
                                  {stop.meal_type && (
                                    <div className="detail-item">
                                      <div className="detail-label">
                                        ⏰ Meal Type
                                      </div>
                                      <div className="detail-value">
                                        {stop.meal_type}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="action-buttons">
                                {mapsUrl && (
                                  <a
                                    href={mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="action-btn primary"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    📍 Location
                                  </a>
                                )}
                                {activityType === "travel" &&
                                  stop.from_location &&
                                  stop.to_location && (
                                    <a
                                      href={`https://www.google.com/maps/dir/?api=1&origin=${stop.from_location.lat},${stop.from_location.long}&destination=${stop.to_location.lat},${stop.to_location.long}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="action-btn secondary"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      🧭 Directions
                                    </a>
                                  )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Code Editor Panel */}
            {isTestPanelOpen && (
              <div className="code-panel">
                <div className="code-panel-header">
                  <div className="code-panel-header-left">
                    <span className="code-panel-title">Events & Alerts</span>
                    {editableEventsJSON && editableEventsJSON !== "[]" && (
                      <span className="code-panel-badge">
                        {(() => {
                          try {
                            const parsed = JSON.parse(editableEventsJSON);
                            const count = Array.isArray(parsed) ? parsed.length : 0;
                            return `${count} ${count === 1 ? "Event" : "Events"}`;
                          } catch {
                            return "Invalid";
                          }
                        })()}
                      </span>
                    )}
                  </div>
                  <div className="code-panel-header-right">
                    {!isJSONValid && (
                      <span className="code-panel-error-badge">
                        ❌ Invalid JSON
                      </span>
                    )}
                    {editableEventsJSON && editableEventsJSON !== "[]" && isJSONValid && (
                      <span className="code-panel-modified-badge">
                        ⚠️ Active Alerts
                      </span>
                    )}
                  </div>
                </div>
                <div className="code-editor">
                  {editableEventsJSON && editableEventsJSON !== "[]" ? (
                    <textarea
                      className={`code-textarea ${!isJSONValid ? "error" : ""}`}
                      value={editableEventsJSON}
                      onChange={(e) => {
                        setEditableEventsJSON(e.target.value);
                        // Validate JSON on change
                        try {
                          const parsed = JSON.parse(e.target.value);
                          if (Array.isArray(parsed)) {
                            setIsJSONValid(true);
                          } else {
                            setIsJSONValid(false);
                          }
                        } catch {
                          setIsJSONValid(false);
                        }
                      }}
                      placeholder="Edit events JSON here..."
                      spellCheck={false}
                      disabled={isRunning}
                    />
                  ) : (
                    <div className="code-placeholder">
                      <pre className="code-content">
                        <code>
                          {
                            "// No events or alerts detected\n// All schedules are on time\n// Weather conditions are normal"
                          }
                        </code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Bar with Chat and Continue */}
          <div className="action-bar">
            <div className="action-bar-container">
              {/* Chat Box - Takes most space */}
              <div className="chat-box-wrapper">
                <ItinerAIChatBox
                  value={chatInput}
                  onChange={setChatInput}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (chatInput.trim()) {
                      const message = chatInput;
                      setChatInput(""); // Clear input immediately
                      await handleChatSubmit(message);
                    }
                  }}
                  placeholder="Ask ItinerAI about your trip..."
                  theme="white"
                  inputType="input"
                  isLoading={isChatLoading}
                  disabled={isChatLoading}
                />
              </div>

              {/* Continue Button - Right side next to chatbox */}
              {onClose && (
                <button
                  onClick={handleClose}
                  className="continue-button"
                  aria-label="Continue to Chat"
                >
                  <span>Continue</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Message Overlay */}
      <MessageResponseOverlay
        message={overlayMessage}
        isVisible={showOverlay}
        onClose={() => setShowOverlay(false)}
        autoHideDuration={4000}
        source="In-Trip Assistant"
      />

      {/* Chat Loading Indicator - Top Right */}
      <div className="chat-loading-container">
        <ChatLoadingIndicator isVisible={isChatLoading} theme="white" />
      </div>

      <style jsx>{`
        .intrip-widget-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: linear-gradient(
            135deg,
            #e0f2fe 0%,
            #dbeafe 50%,
            #e0e7ff 100%
          );
          overflow: hidden;
          padding: 0;
          animation: fadeIn 0.3s ease-in-out;
        }
        
        .intrip-widget-container.closing {
          animation: fadeOut 0.3s ease-in-out forwards;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
          }
        }

        .centered-wrapper {
          width: 80%;
          max-width: 1400px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px 0;
        }

        .intrip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 28px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(255, 255, 255, 0.85) 100%
          );
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-radius: 16px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.08),
            0 8px 32px rgba(37, 99, 235, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .header-content {
          flex: 1;
        }

        .header-title {
          font-size: 1.375rem;
          font-weight: 700;
          background: linear-gradient(
            135deg,
            #1e40af 0%,
            #3b82f6 50%,
            #60a5fa 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "Segoe UI", Roboto, sans-serif;
          letter-spacing: -0.02em;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .test-button,
        .close-panel-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25),
            0 2px 8px rgba(37, 99, 235, 0.15);
        }

        .test-button:hover,
        .close-panel-button:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        }

        .close-panel-button {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .close-panel-button:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        }

        .content-wrapper {
          flex: 1;
          display: flex;
          gap: 20px;
          overflow: hidden;
        }

        .itinerary-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          border: 1px solid rgba(59, 130, 246, 0.15);
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.08),
            0 4px 16px rgba(37, 99, 235, 0.06);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .itinerary-container.with-panel {
          flex: 0 0 60%;
        }

        .day-tabs {
          display: flex;
          gap: 8px;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.8);
          border-bottom: 1px solid rgba(59, 130, 246, 0.15);
          overflow-x: auto;
        }

        .day-tab {
          padding: 8px 20px;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.25s ease;
          white-space: nowrap;
          position: relative;
        }

        .day-tab-content {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .day-tab:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.4);
          color: #3b82f6;
        }

        .day-tab.active {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-color: transparent;
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .day-tab.updated {
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid #3b82f6;
          color: #1e40af;
          font-weight: 700;
          position: relative;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
        }

        .day-tab.updated::before {
          content: "";
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(
            135deg,
            #3b82f6 0%,
            #60a5fa 50%,
            #3b82f6 100%
          );
          border-radius: 10px;
          z-index: -1;
          opacity: 0.15;
        }

        .day-tab.updated:hover {
          background: rgba(255, 255, 255, 1);
          border-color: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
        }

        .day-tab.updated.active {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: 2px solid #2563eb;
          color: white;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
        }

        .day-tab.updated.active::before {
          opacity: 0;
        }

        .update-indicator {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border-radius: 50%;
          margin-left: 6px;
          box-shadow: 0 0 6px rgba(59, 130, 246, 0.6),
            0 0 12px rgba(59, 130, 246, 0.4);
          animation: updatePulse 2s ease-in-out infinite;
        }

        .day-tab.updated.active .update-indicator {
          background: #ffffff;
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.8),
            0 0 12px rgba(255, 255, 255, 0.6);
        }

        @keyframes updatePulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }

        .day-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f9fafb;
        }

        .day-header {
          margin-bottom: 20px;
          padding: 16px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(255, 255, 255, 0.85) 100%
          );
          border-radius: 12px;
          border: 1px solid rgba(59, 130, 246, 0.15);
          transition: all 0.4s ease;
        }

        .day-header.updated-header {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.98) 0%,
            rgba(239, 246, 255, 0.95) 100%
          );
          border: 1px solid rgba(59, 130, 246, 0.25);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }

        .day-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .day-date-badge {
          font-size: 0.75rem;
          font-weight: 700;
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          padding: 6px 12px;
          border-radius: 8px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .updated-badge {
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.15) 0%,
            rgba(147, 197, 253, 0.1) 100%
          );
          color: #3b82f6;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.625rem;
          font-weight: 600;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .day-title {
          font-size: 1.125rem;
          font-weight: 700;
          background: linear-gradient(
            135deg,
            #1e40af 0%,
            #3b82f6 50%,
            #60a5fa 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .day-summary {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        .timeline-container {
          position: relative;
        }

        .timeline-item {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          position: relative;
        }

        .timeline-item:last-child {
          margin-bottom: 0;
        }

        .timeline-time {
          width: 60px;
          flex-shrink: 0;
          text-align: right;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #64748b;
          padding-top: 4px;
        }

        .timeline-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex-shrink: 0;
        }

        .timeline-dot {
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, #32b8c6 0%, #21808d 100%);
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 0 0 3px rgba(50, 184, 198, 0.2);
          flex-shrink: 0;
          z-index: 2;
        }

        .timeline-line {
          width: 2px;
          flex: 1;
          background: linear-gradient(
            180deg,
            rgba(50, 184, 198, 0.4) 0%,
            rgba(50, 184, 198, 0.1) 100%
          );
          margin-top: 8px;
          min-height: 60px;
        }

        .activity-card {
          flex: 1;
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .activity-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .activity-card.expanded {
          border-color: #32b8c6;
          box-shadow: 0 8px 16px rgba(33, 128, 141, 0.15);
        }

        .card-header {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .card-header-content {
          flex: 1;
          min-width: 0;
        }

        .activity-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1f2121;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .activity-route {
          font-size: 0.8125rem;
          color: #626c71;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .flight-info {
          color: #21808d;
          font-weight: 500;
        }

        .activity-location {
          font-size: 0.8125rem;
          color: #626c71;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .activity-location svg {
          color: #21808d;
          flex-shrink: 0;
        }

        .card-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .badge {
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 12px;
          white-space: nowrap;
        }

        .badge.duration {
          background: #eef2ff;
          color: #4f46e5;
        }

        .badge.fare {
          background: #ecfdf5;
          color: #059669;
        }

        .badge.distance {
          background: #fef3c7;
          color: #d97706;
        }

        .activity-description {
          font-size: 0.8125rem;
          color: #626c71;
          line-height: 1.6;
          margin: 0 0 12px 0;
        }

        .expand-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding-top: 12px;
          margin-top: 12px;
          border-top: 1px solid #e5e5e5;
          font-size: 0.75rem;
          font-weight: 600;
          color: #21808d;
        }

        .expand-indicator .arrow {
          transition: transform 0.3s ease;
          font-size: 0.625rem;
        }

        .expand-indicator .arrow.expanded {
          transform: rotate(180deg);
        }

        .expanded-content {
          padding-top: 16px;
          margin-top: 16px;
          border-top: 1px solid #e5e5e5;
        }

        .activity-photo {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .detail-item {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 8px;
        }

        .detail-label {
          font-size: 0.6875rem;
          color: #626c71;
          margin-bottom: 4px;
        }

        .detail-value {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1f2121;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .action-btn.primary {
          background: #21808d;
          color: #ffffff;
        }

        .action-btn.primary:hover {
          background: #1d6f7a;
          transform: translateY(-2px);
        }

        .action-btn.secondary {
          background: #f5f5f5;
          color: #1f2121;
          border: 1px solid #e5e5e5;
        }

        .action-btn.secondary:hover {
          background: #e5e5e5;
        }

        .code-panel {
          flex: 0 0 38%;
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          border: 1px solid rgba(59, 130, 246, 0.15);
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.08);
          overflow: hidden;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .code-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.8);
          border-bottom: 1px solid rgba(59, 130, 246, 0.15);
        }

        .code-panel-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .code-panel-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .code-panel-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #1e40af;
        }

        .code-panel-badge {
          font-size: 0.75rem;
          font-weight: 600;
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          padding: 4px 10px;
          border-radius: 6px;
        }

        .code-panel-modified-badge {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #d97706;
          background: rgba(251, 191, 36, 0.15);
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid rgba(251, 191, 36, 0.3);
          animation: pulse 2s ease-in-out infinite;
        }

        .code-panel-error-badge {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #dc2626;
          background: rgba(239, 68, 68, 0.15);
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .code-editor {
          flex: 1;
          overflow: hidden;
          background: #1e293b;
          display: flex;
          flex-direction: column;
        }

        .code-textarea {
          flex: 1;
          width: 100%;
          background: #1e293b;
          color: #e2e8f0;
          border: none;
          outline: none;
          padding: 20px;
          font-family: "Fira Code", "Consolas", "Monaco", monospace;
          font-size: 0.8125rem;
          line-height: 1.6;
          resize: none;
          overflow: auto;
          white-space: pre;
          tab-size: 2;
        }

        .code-textarea:focus {
          background: #0f172a;
          box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.3);
        }

        .code-textarea.error {
          background: #2d1e1e;
          box-shadow: inset 0 0 0 2px rgba(239, 68, 68, 0.4);
        }

        .code-textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .code-placeholder {
          flex: 1;
          overflow: auto;
          padding: 20px;
        }

        .code-content {
          margin: 0;
          font-family: "Fira Code", "Consolas", "Monaco", monospace;
          font-size: 0.8125rem;
          line-height: 1.6;
          color: #e2e8f0;
        }

        .code-content code {
          color: #cbd5e1;
        }

        /* Event item highlighting styles */
        .event-item {
          display: block;
          position: relative;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .event-item.current-event {
          background: linear-gradient(
            90deg,
            rgba(59, 130, 246, 0.15) 0%,
            rgba(147, 197, 253, 0.1) 100%
          );
          border-left: 3px solid #3b82f6;
          padding-left: 12px;
          margin-left: -12px;
          border-radius: 6px;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3),
            inset 0 0 20px rgba(59, 130, 246, 0.1);
          animation: highlightPulse 2s ease-in-out infinite;
        }

        @keyframes highlightPulse {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3),
              inset 0 0 20px rgba(59, 130, 246, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.5),
              inset 0 0 30px rgba(59, 130, 246, 0.2);
          }
        }

        .event-item.past-event {
          opacity: 0.5;
          background: rgba(34, 197, 94, 0.05);
          border-left: 2px solid #22c55e;
          padding-left: 10px;
          margin-left: -10px;
          border-radius: 6px;
        }

        .event-item.future-event {
          opacity: 0.6;
        }

        /* Running button styles */
        .test-button.running {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          cursor: not-allowed;
          opacity: 0.9;
        }

        .test-button.running:hover {
          transform: none;
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
        }

        .test-button .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .action-bar {
          display: flex;
          justify-content: center;
          padding: 0;
        }

        .action-bar-container {
          width: 100%;
          max-width: 1200px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 0 auto;
        }

        .chat-box-wrapper {
          flex: 1;
          min-width: 0;
        }

        .continue-button {
          display: inline-flex;
          flex-shrink: 0;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.75) 0%,
            rgba(255, 255, 255, 0.6) 100%
          );
          backdrop-filter: blur(32px) saturate(200%);
          -webkit-backdrop-filter: blur(32px) saturate(200%);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1),
            0 2px 6px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 0 rgba(0, 0, 0, 0.03);
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1f2937;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "Segoe UI", Roboto, sans-serif;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }

        .continue-button:hover {
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.85) 0%,
            rgba(37, 99, 235, 0.75) 100%
          );
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3),
            0 4px 12px rgba(59, 130, 246, 0.2);
        }

        .continue-button:active {
          transform: translateY(0);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
        }

        .continue-button span {
          font-weight: 600;
        }

        .continue-button svg {
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .continue-button:hover svg {
          transform: translateX(4px);
        }

        .chat-loading-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999;
          pointer-events: none;
        }

        @media (max-width: 1200px) {
          .centered-wrapper {
            width: 90%;
          }

          .itinerary-container.with-panel {
            flex: 0 0 55%;
          }

          .code-panel {
            flex: 0 0 43%;
          }
        }

        @media (max-width: 968px) {
          .content-wrapper {
            flex-direction: column;
          }

          .itinerary-container.with-panel {
            flex: 1;
          }

          .code-panel {
            flex: 0 0 300px;
            max-height: 300px;
          }
        }

        @media (max-width: 768px) {
          .centered-wrapper {
            width: 95%;
          }

          .intrip-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .header-actions {
            justify-content: flex-end;
          }

          .day-content {
            padding: 16px;
          }

          .stop-card {
            padding: 16px;
          }
        }
      `}</style>
    </>
  );
}
