"use client";

import { useState, useEffect } from "react";
import { MdLocationOn, MdClose, MdChat } from "react-icons/md";
import ItinerAIChatBox from "./ItinerAIChatBox";
import dynamic from "next/dynamic";

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
}

// Helper function to transform API response to display format
const transformItineraryResponse = (apiResponse: any): ItineraryData | null => {
  // Handle new response structure with message wrapper
  const itineraryData =
    apiResponse?.message?.itinerary || apiResponse?.itinerary;

  if (!itineraryData || itineraryData.length === 0) {
    return null;
  }

  console.log(`📊 Transforming ${itineraryData.length} day(s) from API response`);

  // Process ALL days from the response, not just the first one
  const transformedDays: DayItinerary[] = itineraryData.map((apiDay: any) => {
    return transformSingleDay(apiDay);
  });

  return {
    trip_id: "current-trip",
    trip_title: "Your Trip",
    total_days: itineraryData.length,
    start_date: itineraryData[0]?.date || new Date().toISOString(),
    end_date: itineraryData[itineraryData.length - 1]?.date || new Date().toISOString(),
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
}: ItineraryWidgetProps) {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [showAddDayOptions, setShowAddDayOptions] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

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

  if (!isVisible || !itineraryData) return null;

  const currentDay = itineraryData.days[currentDayIndex];
  const hasNextDay = currentDayIndex < itineraryData.days.length - 1;
  const hasPrevDay = currentDayIndex > 0;

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
      return `https://maps.google.com/?q=${encodeURIComponent(location.place_name)}`;
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl overflow-hidden">
      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT PANEL - Day Itinerary Details (Wider) */}
        <div className="w-2/3 border-r border-gray-200 flex flex-col">
          {/* Header Section - Enhanced */}
          <div className="flex-shrink-0 p-6 border-b border-purple-100 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full blur-3xl"></div>

            <div className="relative z-10">
              {/* Date Badge */}
              <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full px-4 py-2 mb-3 shadow-lg border-2 border-purple-200/50">
                <span className="text-xs font-bold text-purple-600">
                  📅 {currentDay.date}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2 leading-tight drop-shadow-sm">
                {currentDay.title}
              </h3>

              {/* Subtitle */}
              <p className="text-sm text-gray-700 mb-5 leading-relaxed font-medium">
                {currentDay.subtitle}
              </p>

              {/* Stats Row - Enhanced */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-xl px-4 py-2 border-2 border-purple-200/50 shadow-md hover:shadow-lg transition-shadow">
                  <span className="text-base">💰</span>
                  <span className="text-xs font-bold text-gray-800">
                    {currentDay.mapData.totalDistance}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-xl px-4 py-2 border-2 border-indigo-200/50 shadow-md hover:shadow-lg transition-shadow">
                  <span className="text-base">📍</span>
                  <span className="text-xs font-bold text-gray-800">
                    {currentDay.mapData.plannedStops} stops
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-xl px-4 py-2 border-2 border-blue-200/50 shadow-md hover:shadow-lg transition-shadow">
                  <span className="text-base">🚗</span>
                  <span className="text-xs font-bold text-gray-800">
                    {currentDay.mapData.avgTravelTime}
                  </span>
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
                  transform: 'translateY(-50%)'
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
                const activityType = stop.activity_type || 'other';

                // Get image URL if available
                const imageUrl = stop.image_url || stop.photo_url || null;

                // Get location for maps URL
                const mapsUrl = getGoogleMapsUrl(stop.from_location || stop.to_location || stop);

                return (
                  <div key={stop.id} className="relative">
                    {/* Timeline connector */}
                    {!isLast && (
                      <div className="absolute left-10 top-20 bottom-[-16px] w-[2px] bg-gradient-to-b from-purple-300 via-indigo-200 to-purple-200 opacity-30"></div>
                    )}

                    {/* Category-Specific Activity Cards */}
                    {activityType === 'travel' ? (
                      // TRAVEL CARD
                      <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-green-200 hover:border-green-400 group">
                        <div className="flex items-start gap-3 p-4">
                          {/* Time Badge */}
                          <div className="flex flex-col items-center flex-shrink-0 w-14">
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl px-2 py-1.5 text-center shadow-md">
                              <div className="text-[9px] font-bold uppercase tracking-wide opacity-90">
                                {parseInt(stop.time.split(' - ')[0].split(':')[0]) >= 12 ? 'PM' : 'AM'}
                              </div>
                              <div className="text-xs font-extrabold leading-tight">
                                {stop.time.split(' - ')[0]}
                              </div>
                            </div>
                            {stop.duration && (
                              <div className="mt-1.5 bg-green-100 rounded-md px-1.5 py-0.5 border border-green-300">
                                <span className="text-[8px] font-bold text-green-700">{stop.duration}</span>
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
                                <span className="bg-green-100 px-2 py-0.5 rounded-md">{stop.from_location?.place_name || 'Start'}</span>
                                <span>→</span>
                                <span className="bg-emerald-100 px-2 py-0.5 rounded-md">{stop.to_location?.place_name || 'End'}</span>
                              </div>
                            )}

                            <p className="text-xs text-gray-700 leading-relaxed mb-2 font-medium">
                              {stop.description}
                            </p>

                            {/* Travel Details */}
                            {stop.notes && (
                              <div className="bg-white/60 border border-green-300 rounded-lg px-2 py-1.5 mb-2">
                                <span className="text-[10px] text-green-900 font-bold leading-relaxed">{stop.notes}</span>
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
                    ) : activityType === 'eat' ? (
                      // EAT/RESTAURANT CARD
                      <div className="relative bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-orange-200 hover:border-orange-400 group">
                        <div className="flex items-start gap-3 p-4">
                          {/* Time Badge */}
                          <div className="flex flex-col items-center flex-shrink-0 w-14">
                            <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl px-2 py-1.5 text-center shadow-md">
                              <div className="text-[9px] font-bold uppercase opacity-90">
                                {parseInt(stop.time.split(' - ')[0].split(':')[0]) >= 12 ? 'PM' : 'AM'}
                              </div>
                              <div className="text-xs font-extrabold leading-tight">
                                {stop.time.split(' - ')[0]}
                              </div>
                            </div>
                            {stop.duration && (
                              <div className="mt-1.5 bg-orange-100 rounded-md px-1.5 py-0.5 border border-orange-300">
                                <span className="text-[8px] font-bold text-orange-700">{stop.duration}</span>
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

                            {stop.location && stop.location !== "Location not specified" && (
                              <div className="flex items-start gap-1 mb-2">
                                <MdLocationOn className="text-orange-400 mt-0.5 flex-shrink-0" size={12} />
                                <span className="text-[10px] text-gray-600 font-medium line-clamp-1">{stop.location}</span>
                              </div>
                            )}

                            <p className="text-xs text-gray-700 leading-relaxed font-medium">
                              {stop.description}
                            </p>

                            {stop.notes && (
                              <div className="mt-2 bg-white/60 border border-orange-300 rounded-lg px-2 py-1">
                                <span className="text-[10px] text-orange-900 font-bold">{stop.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    ) : activityType === 'visit' ? (
                      // VISIT/SIGHTSEEING CARD
                      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-blue-200 hover:border-blue-400 group">
                        <div className="flex items-start gap-3 p-4">
                          <div className="flex flex-col items-center flex-shrink-0 w-14">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl px-2 py-1.5 text-center shadow-md">
                              <div className="text-[9px] font-bold uppercase opacity-90">
                                {parseInt(stop.time.split(' - ')[0].split(':')[0]) >= 12 ? 'PM' : 'AM'}
                              </div>
                              <div className="text-xs font-extrabold leading-tight">
                                {stop.time.split(' - ')[0]}
                              </div>
                            </div>
                            {stop.duration && (
                              <div className="mt-1.5 bg-blue-100 rounded-md px-1.5 py-0.5 border border-blue-300">
                                <span className="text-[8px] font-bold text-blue-700">{stop.duration}</span>
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

                            {stop.location && stop.location !== "Location not specified" && (
                              <div className="flex items-start gap-1 mb-2">
                                <MdLocationOn className="text-blue-400 mt-0.5" size={12} />
                                <span className="text-[10px] text-gray-600 font-medium">{stop.location}</span>
                              </div>
                            )}

                            <p className="text-xs text-gray-700 leading-relaxed font-medium">
                              {stop.description}
                            </p>

                            {stop.notes && (
                              <div className="mt-2 bg-white/60 border border-blue-300 rounded-lg px-2 py-1">
                                <span className="text-[10px] text-blue-900 font-bold">{stop.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    ) : activityType === 'rest' ? (
                      // REST/HOTEL CARD
                      <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-purple-200 hover:border-purple-400 group">
                        <div className="flex items-start gap-3 p-4">
                          <div className="flex flex-col items-center flex-shrink-0 w-14">
                            <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl px-2 py-1.5 text-center shadow-md">
                              <div className="text-[9px] font-bold uppercase opacity-90">
                                {parseInt(stop.time.split(' - ')[0].split(':')[0]) >= 12 ? 'PM' : 'AM'}
                              </div>
                              <div className="text-xs font-extrabold leading-tight">
                                {stop.time.split(' - ')[0]}
                              </div>
                            </div>
                            {stop.duration && (
                              <div className="mt-1.5 bg-purple-100 rounded-md px-1.5 py-0.5 border border-purple-300">
                                <span className="text-[8px] font-bold text-purple-700">{stop.duration}</span>
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

                            {stop.location && stop.location !== "Location not specified" && (
                              <div className="flex items-start gap-1 mb-2">
                                <MdLocationOn className="text-purple-400 mt-0.5" size={12} />
                                <span className="text-[10px] text-gray-600 font-medium">{stop.location}</span>
                              </div>
                            )}

                            <p className="text-xs text-gray-700 leading-relaxed font-medium">
                              {stop.description}
                            </p>

                            {stop.notes && (
                              <div className="mt-2 bg-white/60 border border-purple-300 rounded-lg px-2 py-1">
                                <span className="text-[10px] text-purple-900 font-bold">{stop.notes}</span>
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
                                {parseInt(stop.time.split(' - ')[0].split(':')[0]) >= 12 ? 'PM' : 'AM'}
                              </div>
                              <div className="text-xs font-extrabold leading-tight">
                                {stop.time.split(' - ')[0]}
                              </div>
                            </div>
                            {stop.duration && (
                              <div className="mt-1.5 bg-blue-50 rounded-md px-1.5 py-0.5 border border-blue-200">
                                <span className="text-[8px] font-bold text-blue-700">{stop.duration}</span>
                              </div>
                            )}
                          </div>

                          <div className="relative flex-shrink-0 mt-1">
                            <div className={`w-11 h-11 ${iconConfig.bg} border-2 ${iconConfig.border} rounded-xl flex items-center justify-center text-lg shadow-md`}>
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

                            {stop.location && stop.location !== "Location not specified" && (
                              <div className="flex items-start gap-1 mb-2">
                                <MdLocationOn className="text-purple-400 mt-0.5" size={12} />
                                <span className="text-[10px] text-gray-600 font-medium line-clamp-1">{stop.location}</span>
                              </div>
                            )}

                            <p className="text-xs text-gray-700 leading-relaxed mb-2 font-medium">
                              {stop.description}
                            </p>

                            {stop.notes && (
                              <div className="mt-2 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-300 rounded-lg px-2 py-1.5">
                                <div className="flex items-start gap-1.5">
                                  <span className="text-xs">💡</span>
                                  <span className="text-[10px] text-amber-900 font-bold leading-relaxed">{stop.notes}</span>
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

          {/* Bottom Navigation - Redesigned */}
          <div className="flex-shrink-0 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white p-6">
            <div className="flex items-center justify-between gap-4">
              {/* Day Counter Badge */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-full px-4 py-2 shadow-sm">
                <span className="text-xs font-semibold text-gray-600">Day</span>
                <span className="text-sm font-bold text-purple-600">
                  {currentDay.day}/{totalDays}
                </span>
              </div>

              {/* Center: Navigation Controls */}
              <div className="flex items-center gap-3">
                {/* Previous Arrow */}
                <button
                  onClick={handlePrevDay}
                  disabled={!hasPrevDay}
                  className={`group relative w-10 h-10 rounded-full transition-all duration-300 ${
                    hasPrevDay
                      ? "bg-white border-2 border-purple-300 hover:border-purple-500 hover:shadow-lg hover:scale-110 active:scale-95"
                      : "bg-gray-100 border-2 border-gray-200 cursor-not-allowed opacity-50"
                  }`}
                  title="Previous Day"
                >
                  <svg
                    className={`w-5 h-5 mx-auto transition-colors ${
                      hasPrevDay ? "text-purple-600 group-hover:text-purple-700" : "text-gray-400"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  {hasPrevDay && (
                    <div className="absolute inset-0 rounded-full bg-purple-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  )}
                </button>

                {/* Add Day Button */}
                <button
                  onClick={() => setShowAddDayOptions(!showAddDayOptions)}
                  className="group relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
                  title="Add New Day"
                >
                  <svg
                    className="w-5 h-5 mx-auto text-white transition-transform group-hover:rotate-90"
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
                  <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </button>

                {/* Next Arrow */}
                <button
                  onClick={handleNextDay}
                  disabled={
                    (!hasNextDay && currentDay.day >= totalDays) ||
                    isLoadingNextDay
                  }
                  className={`group relative w-10 h-10 rounded-full transition-all duration-300 ${
                    hasNextDay || (currentDay.day < totalDays && !isLoadingNextDay)
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-xl hover:scale-110 active:scale-95"
                      : "bg-gray-100 border-2 border-gray-200 cursor-not-allowed opacity-50"
                  }`}
                  title="Next Day"
                >
                  {isLoadingNextDay ? (
                    <div className="w-4 h-4 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg
                        className={`w-5 h-5 mx-auto transition-colors ${
                          hasNextDay || currentDay.day < totalDays
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      {(hasNextDay || currentDay.day < totalDays) && (
                        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                      )}
                    </>
                  )}
                </button>
              </div>

              {/* Right: Ask ItinerAI Chatbox */}
              <div className="flex-1 max-w-md">
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
                  placeholder="Ask ItinerAI"
                  theme="white"
                  inputType="input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Interactive Map */}
        <div className="w-1/3 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Map Section - Full Height with Glassmorphism */}
          <div className="flex-1 p-4 flex-shrink-0">
            <div className="relative h-full rounded-2xl overflow-hidden shadow-2xl border-2 border-white/50">
              {/* Glassmorphic border effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 via-indigo-100/40 to-blue-100/40 backdrop-blur-3xl"></div>

              {/* Map Component */}
              <div className="relative h-full z-10">
                <ItineraryMap stops={currentDay.stops} dayTitle={currentDay.title} />
              </div>

              {/* Decorative glassmorphic corners */}
              <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-transparent rounded-br-full blur-2xl"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-indigo-400/20 to-transparent rounded-tl-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
