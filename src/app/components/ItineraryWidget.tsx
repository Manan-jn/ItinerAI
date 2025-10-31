"use client";

import { useState, useEffect } from "react";
import { MdLocationOn, MdClose, MdChat } from "react-icons/md";
import ItinerAIChatBox from "./ItinerAIChatBox";
import dynamic from "next/dynamic";
import ExtendTripPopup from "./ExtendTripPopup";
import ConveyanceRequirementPopup from "./ConveyanceRequirementPopup";
import DaySlider from "./DaySlider";

// Dynamically import the map component to avoid SSR issues
const ItineraryMap = dynamic(() => import("./ItineraryMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 via-indigo-50 to-blue-100">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-bold text-gray-700">Loading map...</p>
      </div>
    </div>
  ),
});

// JSON structure for day itinerary data
export interface ItineraryStop {
  id: string;
  name: string;
  time: string;
  location: string;
  description: string;
  image: string;
  type: "coffee" | "transport" | "museum" | "activity" | "restaurant";
  duration?: string;
  notes?: string;
}

export interface DayItinerary {
  day: number;
  date: string;
  title: string;
  subtitle: string;
  weather: {
    temperature: string;
    condition: string;
    icon: string;
  };
  mapData: {
    avgTravelTime: string;
    totalDistance: string;
    plannedStops: number;
  };
  stops: ItineraryStop[];
}

export interface ItineraryData {
  trip_id: string;
  trip_title: string;
  total_days: number;
  start_date: string;
  end_date: string;
  days: DayItinerary[];
}

interface ItineraryWidgetProps {
  isVisible: boolean;
  onToggle: () => void;
  onOpenChat?: () => void;
  data?: ItineraryData;
  itineraryResponse?: any; // New API response format
  onRequestNextDay?: (nextDayNumber: number) => Promise<void>; // NEW: Callback to request next day
  totalDays?: number; // NEW: Total days in the trip
  isLoadingNextDay?: boolean; // NEW: Loading state for next day
  onAddDay?: (
    extendTrip: boolean,
    needsConveyance: boolean,
    currentDayNumber: number
  ) => Promise<void>; // NEW: Callback to add new day
  navigateToDayNumber?: number | null; // NEW: Day number to navigate to (1-based)
}

// Helper function to transform API response to display format
const transformItineraryResponse = (apiResponse: any): ItineraryData | null => {
  // Handle new response structure with message wrapper
  const itineraryData =
    apiResponse?.message?.itinerary || apiResponse?.itinerary;

  if (!itineraryData || itineraryData.length === 0) {
    return null;
  }

  console.log(
    `📊 Transforming ${itineraryData.length} day(s) from API response`
  );

  // Process ALL days from the response, not just the first one
  const transformedDays: DayItinerary[] = itineraryData.map((apiDay: any) => {
    return transformSingleDay(apiDay);
  });

  return {
    trip_id: "current-trip",
    trip_title: "Your Trip",
    total_days: itineraryData.length,
    start_date: itineraryData[0]?.date || new Date().toISOString(),
    end_date:
      itineraryData[itineraryData.length - 1]?.date || new Date().toISOString(),
    days: transformedDays,
  };
};

// Helper function to transform a single day's data
const transformSingleDay = (apiDay: any): DayItinerary => {
  // Map activity types to stop types
  const getStopType = (activityType: string): ItineraryStop["type"] => {
    switch (activityType) {
      case "eat":
        return "restaurant";
      case "travel":
        return "transport";
      case "visit":
        return "museum";
      case "rest":
        return "activity";
      default:
        return "activity";
    }
  };

  // Get emoji based on activity type and conveyance type
  const getActivityEmoji = (
    activityType: string,
    subType: string,
    conveyanceType?: string
  ): string => {
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
    if (activityType === "other") {
      return "📋";
    }
    if (activityType === "free_time") {
      return "🕐";
    }
    return "🎯";
  };

  // Transform schedule items to stops
  const stops: ItineraryStop[] = apiDay.schedule.map(
    (item: any, index: number) => {
      // Build additional notes for special activity types
      let notes = undefined;
      if (item.activity_type === "travel" && item.flight_number) {
        notes = `${item.airline} ${item.flight_number} | Dep: ${item.departure_time} | Arr: ${item.arrival_time}`;
      }
      if (item.fare) {
        notes = notes ? `${notes} | ₹${item.fare}` : `₹${item.fare}`;
      }
      if (item.distance_km) {
        notes = notes
          ? `${notes} | ${item.distance_km}km`
          : `${item.distance_km}km`;
      }

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
        name:
          item.place_name ||
          item.from_location?.place_name ||
          item.description.substring(0, 50),
        time: `${item.start_time} - ${item.end_time}`,
        location:
          item.address ||
          item.from_location?.address ||
          item.to_location?.address ||
          "Location not specified",
        description: item.description,
        image: getActivityEmoji(
          item.activity_type,
          item.sub_type,
          item.conveyance_type
        ),
        type: getStopType(item.activity_type),
        duration,
        notes,
        // Preserve original data for category-specific rendering
        activity_type: item.activity_type,
        sub_type: item.sub_type,
        from_location: item.from_location,
        to_location: item.to_location,
        image_url: item.image_url,
        photo_url: item.photo_url,
        lat: item.lat,
        long: item.long,
      };
    }
  );

  // Calculate total duration and travel time
  const totalActivities = stops.length;
  const travelStops = stops.filter((s) => s.type === "transport").length;

  const dayItinerary: DayItinerary = {
    day: apiDay.day_number,
    date: apiDay.date || `Day ${apiDay.day_number}`,
    title: apiDay.title || `Day ${apiDay.day_number} Itinerary`,
    subtitle:
      apiDay.summary || apiDay.themes?.join(", ") || "Explore and enjoy",
    weather: {
      temperature: "25°C",
      condition: "Sunny",
      icon: "☀️",
    },
    mapData: {
      avgTravelTime: travelStops > 0 ? `${travelStops} transfers` : "Local",
      totalDistance: apiDay.estimated_total_cost
        ? `₹${apiDay.estimated_total_cost}`
        : "N/A",
      plannedStops: totalActivities,
    },
    stops,
  };

  return dayItinerary;
};

export default function ItineraryWidget({
  isVisible,
  onToggle,
  onOpenChat,
  data,
  itineraryResponse,
  onRequestNextDay,
  totalDays = 1,
  isLoadingNextDay = false,
  onAddDay,
  navigateToDayNumber = null,
}: ItineraryWidgetProps) {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [showAddDayOptions, setShowAddDayOptions] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showExtendTripPopup, setShowExtendTripPopup] = useState(false);
  const [showConveyancePopup, setShowConveyancePopup] = useState(false);
  const [pendingExtendTrip, setPendingExtendTrip] = useState(false);
  const [loadingDayIndex, setLoadingDayIndex] = useState<number | null>(null);
  const [pendingConveyanceDays, setPendingConveyanceDays] = useState<
    Set<number>
  >(new Set());

  // Load itinerary data from JSON or API response
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(
    () => {
      // Priority 1: Use API response if available
      if (itineraryResponse) {
        console.log("📊 Transforming API response to display format");
        const transformed = transformItineraryResponse(itineraryResponse);
        if (transformed) {
          console.log("✅ Successfully transformed itinerary data");
          return transformed;
        }
      }

      // Priority 2: Use provided data prop
      if (data) return data;

      // Priority 3: Load from default JSON file
      try {
        const itinerary = require("../../../itinerary_data.json");
        return itinerary;
      } catch (e) {
        console.error("Failed to load itinerary data:", e);
        return null;
      }
    }
  );

  // Update itinerary data when API response changes
  useEffect(() => {
    if (itineraryResponse) {
      console.log("📊 Updating itinerary data from new API response");
      const transformed = transformItineraryResponse(itineraryResponse);
      if (transformed) {
        // Merge with existing itinerary data
        setItineraryData((prevData) => {
          if (!prevData) {
            console.log("✅ Setting initial itinerary data");
            return transformed;
          }

          // Merge days: replace existing days with same day_number, add new days
          const existingDays = prevData.days;
          const newDays = transformed.days;

          console.log(
            `🔄 Merging itinerary: ${existingDays.length} existing days + ${newDays.length} new days`
          );

          // Create a map of existing days by day number
          const dayMap = new Map<number, DayItinerary>();
          existingDays.forEach((day) => dayMap.set(day.day, day));

          // Update or add new days
          newDays.forEach((day) => {
            console.log(`📝 Updating/Adding day ${day.day}`);
            dayMap.set(day.day, day);
          });

          // Convert back to array and sort by day number
          const mergedDays = Array.from(dayMap.values()).sort(
            (a, b) => a.day - b.day
          );

          console.log(
            `✅ Merged itinerary has ${mergedDays.length} total days`
          );

          return {
            ...prevData,
            days: mergedDays,
            total_days: mergedDays.length,
            end_date:
              mergedDays[mergedDays.length - 1]?.date || prevData.end_date,
          };
        });
        console.log("✅ Itinerary data updated successfully");
      }
    }
  }, [itineraryResponse]);

  // Handle navigation to specific day number (for add day flow)
  useEffect(() => {
    if (navigateToDayNumber !== null && itineraryData) {
      // Convert day number (1-based) to array index (0-based)
      const targetIndex = navigateToDayNumber - 1;

      // Verify the day exists in the data
      if (targetIndex >= 0 && targetIndex < itineraryData.days.length) {
        console.log(
          `🔍 Navigating to day ${navigateToDayNumber} (index ${targetIndex})`
        );
        setCurrentDayIndex(targetIndex);
      } else {
        console.warn(
          `⚠️ Cannot navigate to day ${navigateToDayNumber} - not found in itinerary data`
        );
      }
    }
  }, [navigateToDayNumber, itineraryData]);

  if (!isVisible || !itineraryData) return null;

  const currentDay = itineraryData.days[currentDayIndex];
  const hasNextDay = currentDayIndex < itineraryData.days.length - 1;
  const hasPrevDay = currentDayIndex > 0;

  // Check if current day is a pending conveyance day
  const currentDayNumber = currentDayIndex + 1;
  const isPendingConveyanceDay = pendingConveyanceDays.has(currentDayNumber);
  const isEmptyDay = !currentDay || isPendingConveyanceDay;

  const handleNextDay = async () => {
    if (hasNextDay) {
      setCurrentDayIndex(currentDayIndex + 1);
    } else if (onRequestNextDay && currentDay && currentDay.day < totalDays) {
      // Request next day from API
      const nextDayNumber = currentDay.day + 1;
      console.log(`🔄 Requesting itinerary for day ${nextDayNumber}`);
      await onRequestNextDay(nextDayNumber);
    }
  };

  const handlePrevDay = () => {
    if (hasPrevDay) {
      setCurrentDayIndex(currentDayIndex - 1);
    }
  };

  // Handle day selection from slider
  const handleDaySelect = async (dayIndex: number) => {
    const selectedDay = itineraryData!.days[dayIndex];

    if (selectedDay) {
      // Day data already exists, navigate immediately
      setCurrentDayIndex(dayIndex);
    } else {
      // Day data doesn't exist, need to fetch it
      const dayNumber = dayIndex + 1; // Convert to 1-based day number

      if (dayNumber <= totalDays && onRequestNextDay) {
        console.log(`🔄 Requesting itinerary for day ${dayNumber} from slider`);
        setLoadingDayIndex(dayIndex);

        try {
          await onRequestNextDay(dayNumber);
          // After successful fetch, navigate to the day
          setCurrentDayIndex(dayIndex);
        } catch (error) {
          console.error(`❌ Failed to load day ${dayNumber}:`, error);
        } finally {
          setLoadingDayIndex(null);
        }
      }
    }
  };

  // Handle add day button click (at end)
  const handleAddDayClick = () => {
    console.log("➕ Add day button clicked");
    setShowExtendTripPopup(true);
  };

  // Handle inserting a day after specific index
  const handleInsertDay = (afterDayIndex: number) => {
    const insertDayNumber = afterDayIndex + 2; // Insert after the day at afterDayIndex
    console.log(
      `➕ Insert day ${insertDayNumber} after day ${afterDayIndex + 1}`
    );

    // Mark this day as pending conveyance
    setPendingConveyanceDays((prev) => {
      const newSet = new Set(prev);
      newSet.add(insertDayNumber);
      return newSet;
    });

    // Navigate to the newly inserted day after a brief delay for animation
    setTimeout(() => {
      setCurrentDayIndex(afterDayIndex + 1);
    }, 300);
  };

  // Handle adding conveyance to pending day
  const handleAddConveyanceToPendingDay = async (dayNumber: number) => {
    console.log(`🚗 Adding conveyance for day ${dayNumber}`);

    if (onAddDay) {
      // Call the add day API with conveyance
      await onAddDay(false, true, dayNumber - 1); // extendTrip=false, needsConveyance=true

      // Remove from pending set
      setPendingConveyanceDays((prev) => {
        const newSet = new Set(prev);
        newSet.delete(dayNumber);
        return newSet;
      });
    }
  };

  // Handle removing pending day
  const handleRemovePendingDay = (dayNumber: number) => {
    console.log(`❌ Removing pending day ${dayNumber}`);

    // Remove from pending set
    setPendingConveyanceDays((prev) => {
      const newSet = new Set(prev);
      newSet.delete(dayNumber);
      return newSet;
    });

    // Navigate to previous day if we're on the removed day
    if (currentDayIndex === dayNumber - 1 && currentDayIndex > 0) {
      setCurrentDayIndex(currentDayIndex - 1);
    }
  };

  // Handle extend trip popup - YES
  const handleExtendTripYes = () => {
    console.log("✅ User wants to extend trip duration");
    setPendingExtendTrip(true);
    setShowExtendTripPopup(false);
    setShowConveyancePopup(true);
  };

  // Handle extend trip popup - NO
  const handleExtendTripNo = () => {
    console.log("❌ User does not want to extend trip duration");
    setPendingExtendTrip(false);
    setShowExtendTripPopup(false);
    setShowConveyancePopup(true);
  };

  // Handle conveyance requirement popup - YES
  const handleConveyanceYes = async () => {
    console.log("✅ User needs conveyance for new day");
    setShowConveyancePopup(false);

    if (onAddDay) {
      // Pass the current day number (currentDayIndex + 1 because index is 0-based)
      await onAddDay(pendingExtendTrip, true, currentDayIndex + 1);
    }
  };

  // Handle conveyance requirement popup - NO
  const handleConveyanceNo = async () => {
    console.log("❌ User does not need conveyance for new day");
    setShowConveyancePopup(false);

    if (onAddDay) {
      // Pass the current day number (currentDayIndex + 1 because index is 0-based)
      await onAddDay(pendingExtendTrip, false, currentDayIndex + 1);
    }
  };

  // Handle scroll to update progress indicator
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    setScrollProgress(progress);
  };

  const getStopIcon = (type: ItineraryStop["type"]) => {
    const iconConfig = {
      coffee: { bg: "bg-orange-100", border: "border-orange-200", icon: "☕" },
      transport: { bg: "bg-green-100", border: "border-green-200", icon: "🚆" },
      museum: { bg: "bg-blue-100", border: "border-blue-200", icon: "🎨" },
      activity: {
        bg: "bg-purple-100",
        border: "border-purple-200",
        icon: "🎯",
      },
      restaurant: { bg: "bg-red-100", border: "border-red-200", icon: "🍽️" },
    };
    return iconConfig[type] || iconConfig.activity;
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

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-white rounded-xl overflow-hidden">
      {/* Main Content - Two Column Layout with Reduced Height */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* LEFT PANEL - Day Itinerary Component (as separate styled component) */}
        <div className="w-2/3 flex flex-col">
          {/* Day Component - Separate styled container like Map */}
          <div className="flex-1 bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden flex flex-col relative">
            {isEmptyDay ? (
              // Empty Day - Conveyance Card View
              <>
                {/* Empty State Content */}
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="max-w-md w-full relative">
                    {/* Remove Button - Corner on Container (Fully visible outside card) */}
                    <button
                      onClick={() => handleRemovePendingDay(currentDayNumber)}
                      className="absolute z-50 w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center group/remove"
                      style={{
                        top: "-0.5rem",
                        right: "-0.5rem",
                      }}
                      title="Remove this day"
                    >
                      <svg
                        className="w-4 h-4 text-white transition-transform group-hover/remove:rotate-90"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>

                    {/* Conveyance Card */}
                    <div className="group relative bg-white/70 backdrop-blur-md rounded-2xl border-2 border-purple-300 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      {/* Glassmorphic overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 to-indigo-100/30 pointer-events-none"></div>

                      <div className="relative z-10 p-6">
                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-900 text-center mb-3 mt-2">
                          Day {currentDayNumber}
                        </h3>

                        {/* Message */}
                        <p className="text-sm text-gray-600 text-center mb-6">
                          Want to add conveyance options for this day?
                        </p>

                        {/* Important Note */}
                        <div className="mb-4 p-3 bg-amber-50/80 backdrop-blur-sm border border-amber-300/50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 mt-0.5">
                              <svg
                                className="w-4 h-4 text-amber-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <p className="text-xs text-amber-900 font-medium leading-relaxed">
                              <span className="font-bold">Note:</span> Adding
                              conveyance will restructure the itinerary from
                              this day onwards to optimize travel routes.
                            </p>
                          </div>
                        </div>

                        {/* Add Conveyance Button */}
                        <button
                          onClick={() =>
                            handleAddConveyanceToPendingDay(currentDayNumber)
                          }
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl py-3 px-4 font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group/btn"
                        >
                          <svg
                            className="w-5 h-5 transition-transform group-hover/btn:rotate-90"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          <span>Add Conveyance</span>
                        </button>
                      </div>

                      {/* Bottom accent */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Normal Day View
              <>
                {/* Header Section - Compact */}
                <div className="flex-shrink-0 p-4 border-b border-purple-100 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-200/20 to-transparent rounded-full blur-3xl"></div>

                  <div className="relative z-10">
                    {/* Date Badge and Title Row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 shadow-md border border-purple-200/50">
                          <span className="text-[10px] font-bold text-purple-600">
                            📅 {currentDay.date}
                          </span>
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-900 leading-tight">
                          {currentDay.title}
                        </h3>
                      </div>
                    </div>

                    {/* Subtitle and Stats Row - Combined */}
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-600 leading-relaxed font-medium flex-1">
                        {currentDay.subtitle}
                      </p>
                      {/* Stats Row - Compact */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white/70 backdrop-blur-sm rounded-lg px-2 py-1 border border-purple-200/50">
                          <span className="text-xs">💰</span>
                          <span className="text-[10px] font-bold text-gray-800">
                            {currentDay.mapData.totalDistance}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/70 backdrop-blur-sm rounded-lg px-2 py-1 border border-indigo-200/50">
                          <span className="text-xs">📍</span>
                          <span className="text-[10px] font-bold text-gray-800">
                            {currentDay.mapData.plannedStops}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 bg-white/70 backdrop-blur-sm rounded-lg px-2 py-1 border border-blue-200/50">
                          <span className="text-xs">🚗</span>
                          <span className="text-[10px] font-bold text-gray-800">
                            {currentDay.mapData.avgTravelTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scrollable Stops & Activities */}
                <div
                  className="flex-1 overflow-y-auto p-4 bg-gray-50 relative"
                  onScroll={handleScroll}
                >
                  {/* Scroll Progress Indicator - Google Maps style dot */}
                  <div className="absolute left-2 top-4 bottom-4 w-1 flex flex-col items-center z-20 pointer-events-none">
                    {/* Track line */}
                    <div className="w-[3px] h-full bg-gradient-to-b from-purple-200 via-indigo-200 to-purple-200 rounded-full opacity-30"></div>
                    {/* Moving dot indicator */}
                    <div
                      className="absolute w-3 h-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full shadow-lg border-2 border-white transition-all duration-200"
                      style={{
                        top: `${scrollProgress}%`,
                        transform: "translateY(-50%)",
                      }}
                    >
                      <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-40"></div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="relative space-y-4 pl-6">
                    {currentDay.stops.map((stop: any, index) => {
                      const iconConfig = getStopIcon(stop.type);
                      const isLast = index === currentDay.stops.length - 1;

                      // Determine activity type from original data
                      const activityType = stop.activity_type || "other";

                      // Get image URL if available
                      const imageUrl = stop.image_url || stop.photo_url || null;

                      // Get location for maps URL
                      const mapsUrl = getGoogleMapsUrl(
                        stop.from_location || stop.to_location || stop
                      );

                      return (
                        <div key={stop.id} className="relative">
                          {/* Timeline connector */}
                          {!isLast && (
                            <div className="absolute left-10 top-20 bottom-[-16px] w-[2px] bg-gradient-to-b from-purple-300 via-indigo-200 to-purple-200 opacity-30"></div>
                          )}

                          {/* Category-Specific Activity Cards */}
                          {activityType === "travel" ? (
                            // TRAVEL CARD
                            <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-green-200 hover:border-green-400 group">
                              <div className="flex items-start gap-3 p-4">
                                {/* Time Badge */}
                                <div className="flex flex-col items-center flex-shrink-0 w-14">
                                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl px-2 py-1.5 text-center shadow-md">
                                    <div className="text-[9px] font-bold uppercase tracking-wide opacity-90">
                                      {parseInt(
                                        stop.time.split(" - ")[0].split(":")[0]
                                      ) >= 12
                                        ? "PM"
                                        : "AM"}
                                    </div>
                                    <div className="text-xs font-extrabold leading-tight">
                                      {stop.time.split(" - ")[0]}
                                    </div>
                                  </div>
                                  {stop.duration && (
                                    <div className="mt-1.5 bg-green-100 rounded-md px-1.5 py-0.5 border border-green-300">
                                      <span className="text-[8px] font-bold text-green-700">
                                        {stop.duration}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Icon */}
                                <div className="relative flex-shrink-0 mt-1">
                                  <div className="w-11 h-11 bg-green-100 border-2 border-green-300 rounded-xl flex items-center justify-center text-lg shadow-md">
                                    {stop.image}
                                  </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className="font-extrabold text-sm text-gray-900 leading-tight flex-1">
                                      {stop.name}
                                    </h4>
                                    {imageUrl && (
                                      <img
                                        src={imageUrl}
                                        alt={stop.name}
                                        className="w-12 h-12 rounded-lg object-cover border-2 border-green-200 shadow-sm"
                                      />
                                    )}
                                  </div>

                                  {/* From → To */}
                                  {(stop.from_location || stop.to_location) && (
                                    <div className="flex items-center gap-1 mb-2 text-[10px] font-semibold text-gray-700">
                                      <span className="bg-green-100 px-2 py-0.5 rounded-md">
                                        {stop.from_location?.place_name ||
                                          "Start"}
                                      </span>
                                      <span>→</span>
                                      <span className="bg-emerald-100 px-2 py-0.5 rounded-md">
                                        {stop.to_location?.place_name || "End"}
                                      </span>
                                    </div>
                                  )}

                                  <p className="text-xs text-gray-700 leading-relaxed mb-2 font-medium">
                                    {stop.description}
                                  </p>

                                  {/* Travel Details */}
                                  {stop.notes && (
                                    <div className="bg-white/60 border border-green-300 rounded-lg px-2 py-1.5 mb-2">
                                      <span className="text-[10px] text-green-900 font-bold leading-relaxed">
                                        {stop.notes}
                                      </span>
                                    </div>
                                  )}

                                  {/* Maps Link */}
                                  {mapsUrl && (
                                    <a
                                      href={mapsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 hover:text-green-900 transition-colors"
                                    >
                                      <MdLocationOn size={12} />
                                      <span>View on Google Maps</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                          ) : activityType === "eat" ? (
                            // EAT/RESTAURANT CARD
                            <div className="relative bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-orange-200 hover:border-orange-400 group">
                              <div className="flex items-start gap-3 p-4">
                                {/* Time Badge */}
                                <div className="flex flex-col items-center flex-shrink-0 w-14">
                                  <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl px-2 py-1.5 text-center shadow-md">
                                    <div className="text-[9px] font-bold uppercase opacity-90">
                                      {parseInt(
                                        stop.time.split(" - ")[0].split(":")[0]
                                      ) >= 12
                                        ? "PM"
                                        : "AM"}
                                    </div>
                                    <div className="text-xs font-extrabold leading-tight">
                                      {stop.time.split(" - ")[0]}
                                    </div>
                                  </div>
                                  {stop.duration && (
                                    <div className="mt-1.5 bg-orange-100 rounded-md px-1.5 py-0.5 border border-orange-300">
                                      <span className="text-[8px] font-bold text-orange-700">
                                        {stop.duration}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Icon */}
                                <div className="relative flex-shrink-0 mt-1">
                                  <div className="w-11 h-11 bg-orange-100 border-2 border-orange-300 rounded-xl flex items-center justify-center text-lg shadow-md">
                                    {stop.image}
                                  </div>
                                </div>

                                {/* Content with Photo */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className="font-extrabold text-sm text-gray-900 leading-tight flex-1">
                                      {stop.name}
                                    </h4>
                                    {imageUrl && (
                                      <img
                                        src={imageUrl}
                                        alt={stop.name}
                                        className="w-16 h-16 rounded-xl object-cover border-2 border-orange-200 shadow-sm"
                                      />
                                    )}
                                  </div>

                                  {stop.location &&
                                    stop.location !==
                                      "Location not specified" && (
                                      <div className="flex items-start gap-1 mb-2">
                                        <MdLocationOn
                                          className="text-orange-400 mt-0.5 flex-shrink-0"
                                          size={12}
                                        />
                                        <span className="text-[10px] text-gray-600 font-medium line-clamp-1">
                                          {stop.location}
                                        </span>
                                      </div>
                                    )}

                                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                                    {stop.description}
                                  </p>

                                  {stop.notes && (
                                    <div className="mt-2 bg-white/60 border border-orange-300 rounded-lg px-2 py-1">
                                      <span className="text-[10px] text-orange-900 font-bold">
                                        {stop.notes}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                          ) : activityType === "visit" ? (
                            // VISIT/SIGHTSEEING CARD
                            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-blue-200 hover:border-blue-400 group">
                              <div className="flex items-start gap-3 p-4">
                                <div className="flex flex-col items-center flex-shrink-0 w-14">
                                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl px-2 py-1.5 text-center shadow-md">
                                    <div className="text-[9px] font-bold uppercase opacity-90">
                                      {parseInt(
                                        stop.time.split(" - ")[0].split(":")[0]
                                      ) >= 12
                                        ? "PM"
                                        : "AM"}
                                    </div>
                                    <div className="text-xs font-extrabold leading-tight">
                                      {stop.time.split(" - ")[0]}
                                    </div>
                                  </div>
                                  {stop.duration && (
                                    <div className="mt-1.5 bg-blue-100 rounded-md px-1.5 py-0.5 border border-blue-300">
                                      <span className="text-[8px] font-bold text-blue-700">
                                        {stop.duration}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="relative flex-shrink-0 mt-1">
                                  <div className="w-11 h-11 bg-blue-100 border-2 border-blue-300 rounded-xl flex items-center justify-center text-lg shadow-md">
                                    {stop.image}
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className="font-extrabold text-sm text-gray-900 leading-tight flex-1">
                                      {stop.name}
                                    </h4>
                                    {imageUrl && (
                                      <img
                                        src={imageUrl}
                                        alt={stop.name}
                                        className="w-16 h-16 rounded-xl object-cover border-2 border-blue-200 shadow-sm"
                                      />
                                    )}
                                  </div>

                                  {stop.location &&
                                    stop.location !==
                                      "Location not specified" && (
                                      <div className="flex items-start gap-1 mb-2">
                                        <MdLocationOn
                                          className="text-blue-400 mt-0.5"
                                          size={12}
                                        />
                                        <span className="text-[10px] text-gray-600 font-medium">
                                          {stop.location}
                                        </span>
                                      </div>
                                    )}

                                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                                    {stop.description}
                                  </p>

                                  {stop.notes && (
                                    <div className="mt-2 bg-white/60 border border-blue-300 rounded-lg px-2 py-1">
                                      <span className="text-[10px] text-blue-900 font-bold">
                                        {stop.notes}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                          ) : activityType === "rest" ? (
                            // REST/HOTEL CARD
                            <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-purple-200 hover:border-purple-400 group">
                              <div className="flex items-start gap-3 p-4">
                                <div className="flex flex-col items-center flex-shrink-0 w-14">
                                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl px-2 py-1.5 text-center shadow-md">
                                    <div className="text-[9px] font-bold uppercase opacity-90">
                                      {parseInt(
                                        stop.time.split(" - ")[0].split(":")[0]
                                      ) >= 12
                                        ? "PM"
                                        : "AM"}
                                    </div>
                                    <div className="text-xs font-extrabold leading-tight">
                                      {stop.time.split(" - ")[0]}
                                    </div>
                                  </div>
                                  {stop.duration && (
                                    <div className="mt-1.5 bg-purple-100 rounded-md px-1.5 py-0.5 border border-purple-300">
                                      <span className="text-[8px] font-bold text-purple-700">
                                        {stop.duration}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="relative flex-shrink-0 mt-1">
                                  <div className="w-11 h-11 bg-purple-100 border-2 border-purple-300 rounded-xl flex items-center justify-center text-lg shadow-md">
                                    {stop.image}
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className="font-extrabold text-sm text-gray-900 leading-tight flex-1">
                                      {stop.name}
                                    </h4>
                                    {imageUrl && (
                                      <img
                                        src={imageUrl}
                                        alt={stop.name}
                                        className="w-16 h-16 rounded-xl object-cover border-2 border-purple-200 shadow-sm"
                                      />
                                    )}
                                  </div>

                                  {stop.location &&
                                    stop.location !==
                                      "Location not specified" && (
                                      <div className="flex items-start gap-1 mb-2">
                                        <MdLocationOn
                                          className="text-purple-400 mt-0.5"
                                          size={12}
                                        />
                                        <span className="text-[10px] text-gray-600 font-medium">
                                          {stop.location}
                                        </span>
                                      </div>
                                    )}

                                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                                    {stop.description}
                                  </p>

                                  {stop.notes && (
                                    <div className="mt-2 bg-white/60 border border-purple-300 rounded-lg px-2 py-1">
                                      <span className="text-[10px] text-purple-900 font-bold">
                                        {stop.notes}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                          ) : (
                            // DEFAULT CARD (activity, shopping, event, etc.)
                            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200 hover:border-purple-300 group">
                              <div className="flex items-start gap-3 p-4">
                                <div className="flex flex-col items-center flex-shrink-0 w-14">
                                  <div className="bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-600 text-white rounded-xl px-2 py-1.5 text-center shadow-md">
                                    <div className="text-[9px] font-bold uppercase opacity-90">
                                      {parseInt(
                                        stop.time.split(" - ")[0].split(":")[0]
                                      ) >= 12
                                        ? "PM"
                                        : "AM"}
                                    </div>
                                    <div className="text-xs font-extrabold leading-tight">
                                      {stop.time.split(" - ")[0]}
                                    </div>
                                  </div>
                                  {stop.duration && (
                                    <div className="mt-1.5 bg-blue-50 rounded-md px-1.5 py-0.5 border border-blue-200">
                                      <span className="text-[8px] font-bold text-blue-700">
                                        {stop.duration}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="relative flex-shrink-0 mt-1">
                                  <div
                                    className={`w-11 h-11 ${iconConfig.bg} border-2 ${iconConfig.border} rounded-xl flex items-center justify-center text-lg shadow-md`}
                                  >
                                    {stop.image}
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className="font-extrabold text-sm text-gray-900 leading-tight group-hover:text-purple-700 transition-colors flex-1">
                                      {stop.name}
                                    </h4>
                                    {imageUrl && (
                                      <img
                                        src={imageUrl}
                                        alt={stop.name}
                                        className="w-14 h-14 rounded-xl object-cover border-2 border-purple-200 shadow-sm"
                                      />
                                    )}
                                  </div>

                                  {stop.location &&
                                    stop.location !==
                                      "Location not specified" && (
                                      <div className="flex items-start gap-1 mb-2">
                                        <MdLocationOn
                                          className="text-purple-400 mt-0.5"
                                          size={12}
                                        />
                                        <span className="text-[10px] text-gray-600 font-medium line-clamp-1">
                                          {stop.location}
                                        </span>
                                      </div>
                                    )}

                                  <p className="text-xs text-gray-700 leading-relaxed mb-2 font-medium">
                                    {stop.description}
                                  </p>

                                  {stop.notes && (
                                    <div className="mt-2 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-300 rounded-lg px-2 py-1.5">
                                      <div className="flex items-start gap-1.5">
                                        <span className="text-xs">💡</span>
                                        <span className="text-[10px] text-amber-900 font-bold leading-relaxed">
                                          {stop.notes}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - Interactive Map */}
        <div className="w-1/3 flex flex-col">
          {/* Map Component - Separate styled container matching Day component */}
          <div className="flex-1 bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden relative">
            {/* Map */}
            <ItineraryMap
              stops={currentDay.stops}
              dayTitle={currentDay.title}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section - Day Slider and ChatBox */}
      <div className="flex-shrink-0 p-4 pt-0 w-full max-w-full overflow-hidden">
        {/* Day Slider - Styled Container */}
        <div className="mb-3 bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden w-full max-w-full">
          <DaySlider
            days={itineraryData.days}
            currentDayIndex={currentDayIndex}
            totalDays={totalDays}
            onDaySelect={handleDaySelect}
            onAddDay={handleAddDayClick}
            onInsertDay={handleInsertDay}
            loadingDayIndex={loadingDayIndex}
            pendingConveyanceDays={pendingConveyanceDays}
          />
        </div>

        {/* ChatBox - Centered */}
        <div className="max-w-3xl mx-auto">
          <ItinerAIChatBox
            value={chatInput}
            onChange={setChatInput}
            onSubmit={(e) => {
              e.preventDefault();
              if (chatInput.trim()) {
                console.log("ItinerAI query:", chatInput);
                // Handle chat submission
                setChatInput("");
              }
            }}
            placeholder="Ask ItinerAI about your itinerary..."
            theme="white"
            inputType="input"
          />
        </div>
      </div>

      {/* Extend Trip Popup */}
      <ExtendTripPopup
        isVisible={showExtendTripPopup}
        onYes={handleExtendTripYes}
        onNo={handleExtendTripNo}
      />

      {/* Conveyance Requirement Popup */}
      <ConveyanceRequirementPopup
        isVisible={showConveyancePopup}
        dayNumber={itineraryData ? itineraryData.days.length + 1 : 1}
        onYes={handleConveyanceYes}
        onNo={handleConveyanceNo}
      />
    </div>
  );
}
