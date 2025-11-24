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

// Helper function to process Google Places photo URLs to use authenticated proxy
const processPhotoUrl = (photoUrl: string | null): string | null => {
  if (!photoUrl) return null;

  // Check if it's a Google Places photo URL
  if (photoUrl.includes("maps.googleapis.com/maps/api/place/photo")) {
    try {
      const urlObj = new URL(photoUrl);
      const photoReference = urlObj.searchParams.get("photoreference");
      if (photoReference) {
        // Convert to proxy URL with higher resolution for itinerary
        const proxyUrl = `/api/place-photo?photoreference=${photoReference}&maxwidth=800`;
        console.log("🔄 Converting Google Places photo to proxy URL:", {
          original: photoUrl.substring(0, 100) + "...",
          proxy: proxyUrl,
        });
        return proxyUrl;
      }
    } catch (error) {
      console.warn("❌ Error processing Google Places photo URL:", error);
    }
  }

  // Return original URL for non-Google Places photos
  return photoUrl;
};

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
    avg_humidity: number;
    precipitation: number;
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
    currentDayNumber: number,
    isInsertFlow?: boolean // NEW: Flag for insert day flow vs extend flow
  ) => Promise<void>; // NEW: Callback to add new day
  navigateToDayNumber?: number | null; // NEW: Day number to navigate to (1-based)
  onRemovePendingDay?: (dayNumber: number) => void; // NEW: Callback to remove day from pending set
  onAddPendingDay?: (dayNumber: number) => void; // NEW: Callback to add day to pending set
  pendingConveyanceDaysFromParent?: Set<number>; // NEW: Pending days from parent component
  isLoadingPendingDay?: boolean; // NEW: Loading state for pending day API call
  onDeleteDay?: (dayNumber: number) => Promise<void>; // NEW: Callback to delete a day (CASE 1: API call)
  onLocalDeleteDay?: (dayNumber: number) => void; // NEW: Callback for local delete without API (CASE 2)
  onChatSubmit?: (message: string, currentDay: number) => Promise<void>; // NEW: Callback for chat message submission
  allDaysGenerated?: boolean; // NEW: Flag to enable Continue button
  onContinue?: () => void; // NEW: Callback for Continue button click
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
      temperature: apiDay.weather_forecast?.temperature || "N/A",
      avg_humidity: apiDay.weather_forecast?.avg_humidity || 0,
      precipitation: apiDay.weather_forecast?.precipitation || 0,
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

// TimelineCard Component - Unified card design for all activity types
interface TimelineCardProps {
  stop: any;
  activityType: string;
  photoUrl: string | null;
  mapsUrl: string | null;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const TimelineCard = ({
  stop,
  activityType,
  photoUrl,
  mapsUrl,
  index,
  isExpanded,
  onToggleExpand,
}: TimelineCardProps) => {
  // Get activity icon and color based on type
  const getActivityConfig = (type: string) => {
    switch (type) {
      case "travel":
        return {
          gradient: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)",
          icon: stop.image || "✈️",
          bgColor: "#EEF2FF",
          borderColor: "#C7D2FE",
        };
      case "rest":
        return {
          gradient: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
          icon: stop.image || "🏨",
          bgColor: "#F5F3FF",
          borderColor: "#DDD6FE",
        };
      case "eat":
        return {
          gradient: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
          icon: stop.image || "🍽️",
          bgColor: "#FEF3C7",
          borderColor: "#FDE68A",
        };
      case "visit":
        return {
          gradient: "linear-gradient(135deg, #32B8C6 0%, #21808D 100%)",
          icon: stop.image || "📍",
          bgColor: "#E0F2FE",
          borderColor: "#BAE6FD",
        };
      default:
        return {
          gradient: "linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)",
          icon: stop.image || "📋",
          bgColor: "#F3F4F6",
          borderColor: "#E5E7EB",
        };
    }
  };

  const config = getActivityConfig(activityType);

  // Extract menu highlights if available (for restaurants)
  const menuHighlights = stop.menu_highlights || [];
  const cuisine = stop.cuisine || null;
  const mealType = stop.meal_type || null;
  const reservationRequired = stop.reservation_required || false;

  // Extract flight/travel details
  const flightNumber = stop.flight_number || null;
  const airline = stop.airline || null;
  const departureTime = stop.departure_time || null;
  const arrivalTime = stop.arrival_time || null;
  const conveyanceType = stop.type || null;
  console.log("stop121 ", stop);
  console.log("conveyanceType ", conveyanceType);
  console.log("activityType ", activityType);
  console.log("departureTime ", departureTime);
  console.log("arrivalTime ", arrivalTime);
  console.log("flightNumber ", flightNumber);
  console.log("airline ", airline);
  return (
    <div
      className={`timeline-card relative bg-white border border-[#E5E5E5] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_6px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 ${
        isExpanded
          ? "border-[#32B8C6] shadow-[0_8px_16px_rgba(33,128,141,0.15)]"
          : ""
      }`}
      onClick={onToggleExpand}
    >
      {/* Card Content */}
      <div className="p-4">
        {/* Header Section */}
        <div className="flex items-start gap-3 mb-2">
          {/* Activity Icon */}
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: config.gradient }}
          >
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-[15px] font-semibold text-[#1F2121] leading-snug mb-1">
              {stop.name}
            </h4>

            {/* Subtitle - Location or Route */}
            {activityType === "travel" &&
            (stop.from_location || stop.to_location) ? (
              <div className="text-[13px] text-[#626C71] flex items-center gap-1.5 mb-2">
                <span className="truncate">
                  {stop.from_location?.place_name || "Start"}
                </span>
                <span>→</span>
                <span className="truncate">
                  {stop.to_location?.place_name || "End"}
                </span>
                {airline && flightNumber && (
                  <span className="text-[#21808D] font-medium ml-1">
                    ({airline} {flightNumber})
                  </span>
                )}
              </div>
            ) : stop.location && stop.location !== "Location not specified" ? (
              <div className="text-[13px] text-[#626C71] flex items-center gap-1 mb-2">
                <MdLocationOn className="text-[#21808D]" size={14} />
                <span className="truncate">{stop.location}</span>
              </div>
            ) : null}

            {/* Badges */}
            <div className="flex gap-2 flex-wrap mb-2">
              {stop.duration && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
                  ⏱️ {stop.duration}
                </span>
              )}
              {stop.fare && stop.fare > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-xl bg-[#ECFDF5] text-[#059669]">
                  ₹{stop.fare.toLocaleString()}
                </span>
              )}
              {stop.distance_km && stop.distance_km > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-xl bg-[#FEF3C7] text-[#D97706]">
                  🛫 {stop.distance_km} km
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-[13px] text-[#626C71] leading-relaxed">
              {stop.description}
            </p>
          </div>
        </div>

        {/* Expand Trigger */}
        <div className="flex items-center justify-center gap-1 text-[12px] text-[#21808D] font-medium pt-3 mt-3 border-t border-[#E5E5E5]">
          <span>View details</span>
          <span
            className={`text-sm transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </div>

        {/* Expanded Details */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? "max-h-[500px]" : "max-h-0"
          }`}
        >
          <div className="pt-3 mt-3 border-t border-[#E5E5E5]">
            {/* Photo */}
            {photoUrl && (
              <img
                src={photoUrl}
                alt={stop.name}
                className="w-full h-36 object-cover rounded-lg mb-3"
              />
            )}

            {/* Travel/Flight Details */}
            {activityType === "travel" && (departureTime || arrivalTime) && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {departureTime && (
                  <div className="bg-[#F5F5F5] p-2.5 rounded-lg">
                    <div className="text-[11px] text-[#626C71] mb-1">
                      🛫 Departure
                    </div>
                    <div className="text-[13px] font-semibold text-[#1F2121]">
                      {departureTime}
                    </div>
                  </div>
                )}
                {arrivalTime && (
                  <div className="bg-[#F5F5F5] p-2.5 rounded-lg">
                    <div className="text-[11px] text-[#626C71] mb-1">
                      🛬 Arrival
                    </div>
                    <div className="text-[13px] font-semibold text-[#1F2121]">
                      {arrivalTime}
                    </div>
                  </div>
                )}
                {airline && (
                  <div className="bg-[#F5F5F5] p-2.5 rounded-lg">
                    <div className="text-[11px] text-[#626C71] mb-1">
                      ✈️ Airline
                    </div>
                    <div className="text-[13px] font-semibold text-[#1F2121]">
                      {airline}
                    </div>
                  </div>
                )}
                {flightNumber && (
                  <div className="bg-[#F5F5F5] p-2.5 rounded-lg">
                    <div className="text-[11px] text-[#626C71] mb-1">
                      🎫 Flight No.
                    </div>
                    <div className="text-[13px] font-semibold text-[#1F2121]">
                      {flightNumber}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Restaurant Details */}
            {activityType === "eat" && (
              <div className="mb-3">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {cuisine && (
                    <div className="bg-[#F5F5F5] p-2.5 rounded-lg">
                      <div className="text-[11px] text-[#626C71] mb-1">
                        🍽️ Cuisine
                      </div>
                      <div className="text-[13px] font-semibold text-[#1F2121]">
                        {cuisine}
                      </div>
                    </div>
                  )}
                  {mealType && (
                    <div className="bg-[#F5F5F5] p-2.5 rounded-lg">
                      <div className="text-[11px] text-[#626C71] mb-1">
                        ⏰ Meal Type
                      </div>
                      <div className="text-[13px] font-semibold text-[#1F2121] capitalize">
                        {mealType}
                      </div>
                    </div>
                  )}
                  {stop.fare && (
                    <div className="bg-[#F5F5F5] p-2.5 rounded-lg">
                      <div className="text-[11px] text-[#626C71] mb-1">
                        💰 Estimate
                      </div>
                      <div className="text-[13px] font-semibold text-[#1F2121]">
                        ₹{stop.fare}
                      </div>
                    </div>
                  )}
                  <div className="bg-[#F5F5F5] p-2.5 rounded-lg">
                    <div className="text-[11px] text-[#626C71] mb-1">
                      📝 Reservation
                    </div>
                    <div className="text-[13px] font-semibold text-[#1F2121]">
                      {reservationRequired ? "Required" : "Not needed"}
                    </div>
                  </div>
                </div>

                {/* Menu Highlights */}
                {menuHighlights.length > 0 && (
                  <div className="bg-[#F5F5F5] p-3 rounded-lg">
                    <div className="text-[12px] font-semibold text-[#1F2121] mb-2 flex items-center gap-1.5">
                      🥘 Recommended Dishes
                    </div>
                    <div className="space-y-1.5">
                      {menuHighlights.map((item: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-[12px] text-[#626C71]"
                        >
                          <span className="text-[#21808D] font-bold">•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {stop.notes && (
              <div className="mb-3 bg-[#FEF3C7] border-l-[3px] border-[#F59E0B] p-3 rounded">
                <div className="text-[12px] font-semibold text-[#92400E] mb-1 flex items-center gap-1.5">
                  💡 Note
                </div>
                <div className="text-[12px] text-[#78350F] leading-relaxed">
                  {stop.notes}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#21808D] hover:bg-[#1d6f7a] text-white text-[12px] font-medium py-2.5 px-4 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
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
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#1F2121] text-[12px] font-medium py-2.5 px-4 rounded-lg border border-[#E5E5E5] transition-all duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    🧭 Directions
                  </a>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
  onRemovePendingDay,
  onAddPendingDay,
  pendingConveyanceDaysFromParent,
  isLoadingPendingDay = false,
  onDeleteDay,
  onLocalDeleteDay,
  onChatSubmit,
  allDaysGenerated = false,
  onContinue,
}: ItineraryWidgetProps) {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [showAddDayOptions, setShowAddDayOptions] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showExtendTripPopup, setShowExtendTripPopup] = useState(false);
  const [showConveyancePopup, setShowConveyancePopup] = useState(false);
  const [pendingExtendTrip, setPendingExtendTrip] = useState(false);
  const [loadingDayIndex, setLoadingDayIndex] = useState<number | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false); // NEW: Show delete warning alert
  const [dayToDelete, setDayToDelete] = useState<number | null>(null); // NEW: Day number to delete
  const [deletingDayNumber, setDeletingDayNumber] = useState<number | null>(
    null
  ); // NEW: Day being deleted (for animation)
  const [isChatLoading, setIsChatLoading] = useState(false); // NEW: Loading state for chat API call
  const [showUpdateNotification, setShowUpdateNotification] = useState(false); // NEW: Show update notification
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set()); // Track expanded timeline cards

  // Use pending days from parent - single source of truth
  const pendingConveyanceDays =
    pendingConveyanceDaysFromParent || new Set<number>();

  // Track the expected total days after insertions
  // This is used to ensure DaySlider shows all days immediately after insertion,
  // before the async state update completes
  const [insertedDaysCount, setInsertedDaysCount] = useState(0);

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
      // Reset insertedDaysCount when API response comes in
      // The API response now contains the authoritative day count
      setInsertedDaysCount(0);
      const transformed = transformItineraryResponse(itineraryResponse);
      if (transformed) {
        // Merge with existing itinerary data
        setItineraryData((prevData) => {
          if (!prevData) {
            console.log("✅ Setting initial itinerary data");
            return transformed;
          }

          const existingDays = prevData.days;
          const newDays = transformed.days;

          console.log(
            `🔄 Merging itinerary: ${existingDays.length} existing days → ${newDays.length} new days`
          );

          // CRITICAL: Detect if this is a deletion scenario
          // If new day count is less than existing, we should REPLACE not merge
          // This handles both CASE 1 (API delete) and CASE 2 (local delete)
          const isDeletion = newDays.length < existingDays.length;

          if (isDeletion) {
            console.log(
              `🗑️ DELETION detected: ${existingDays.length} → ${newDays.length} days. Using REPLACE strategy.`
            );

            // REPLACE: Use only the new days, completely discard existing
            return {
              ...prevData,
              days: newDays,
              total_days: newDays.length,
              end_date: newDays[newDays.length - 1]?.date || prevData.end_date,
            };
          }

          // MERGE: For additions/updates, use merge strategy
          console.log("➕ ADDITION/UPDATE detected. Using MERGE strategy.");

          // Create a map of existing days by day number
          const dayMap = new Map<number, DayItinerary>();
          existingDays.forEach((day) => dayMap.set(day.day, day));

          // Update or add new days (this will replace days with same day number)
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

          // Calculate new total_days (max of current length or highest day number)
          const maxDayNumber = Math.max(
            ...mergedDays.map((d) => d.day),
            prevData.total_days
          );

          return {
            ...prevData,
            days: mergedDays,
            total_days: maxDayNumber,
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
      // Find the day by day_number to handle shifted days correctly
      const dayExists = itineraryData.days.some(
        (day) => day.day === navigateToDayNumber
      );

      if (dayExists) {
        // Convert day number (1-based) to array index (0-based)
        const targetIndex = navigateToDayNumber - 1;
        console.log(
          `🔍 Navigating to day ${navigateToDayNumber} (index ${targetIndex})`
        );
        setCurrentDayIndex(targetIndex);
      } else {
        console.warn(
          `⚠️ Cannot navigate to day ${navigateToDayNumber} - not found in itinerary data (has ${itineraryData.days.length} days)`
        );
      }
    }
  }, [navigateToDayNumber, itineraryData]);

  if (!isVisible || !itineraryData) return null;

  // Calculate current day number from index
  const currentDayNumber = currentDayIndex + 1;

  // Find current day by day_number (not array index) to handle shifted days correctly
  const currentDay = itineraryData.days.find(
    (day) => day.day === currentDayNumber
  );

  const hasNextDay = currentDayIndex < itineraryData.days.length - 1;
  const hasPrevDay = currentDayIndex > 0;

  // Check if current day is a pending conveyance day
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
    const dayNumber = dayIndex + 1; // Convert to 1-based day number

    // CRITICAL: Check if this is a pending day FIRST, before checking selectedDay
    // Pending days won't have data in itineraryData.days, so we must check pending status first
    const isPendingDay = pendingConveyanceDays.has(dayNumber);

    if (isPendingDay) {
      // For pending days, just navigate to show the pending state
      // DO NOT trigger API call with response_type='generate'
      console.log(
        `📌 Day ${dayNumber} is pending - showing pending state without API call`
      );
      setCurrentDayIndex(dayIndex);
      return;
    }

    // Not a pending day - check if we have data for it by day_number (not array index)
    // This is critical after day insertions where day numbers and indices may not align
    const selectedDay = itineraryData!.days.find(
      (day) => day.day === dayNumber
    );

    if (selectedDay) {
      // Day data already exists, navigate immediately
      console.log(
        `✅ Day ${dayNumber} has data (found by day_number) - navigating`
      );
      setCurrentDayIndex(dayIndex);
    } else {
      // Day data doesn't exist and it's not pending - need to fetch it
      if (dayNumber <= totalDays && onRequestNextDay) {
        console.log(
          `🔄 Requesting itinerary for day ${dayNumber} from slider (response_type='generate')`
        );
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
    console.log("itineraryDataManan before", itineraryData);

    // STEP 0: Immediately increment insertedDaysCount
    // This ensures DaySlider sees the new total BEFORE async state updates complete
    setInsertedDaysCount((prev) => prev + 1);

    // STEP 1: Shift all subsequent days in itineraryData
    if (itineraryData) {
      setItineraryData((prevData) => {
        if (!prevData) return prevData;

        console.log(
          `🔄 Shifting days >= ${insertDayNumber} by +1 in itineraryData`
        );

        // Shift day numbers for all days >= insertDayNumber
        const updatedDays = prevData.days.map((day) => {
          if (day.day >= insertDayNumber) {
            console.log(`  Shifting day ${day.day} → ${day.day + 1}`);
            return {
              ...day,
              day: day.day + 1,
            };
          }
          return day;
        });

        // Sort by day number to maintain order
        updatedDays.sort((a, b) => a.day - b.day);

        console.log(`✅ Shifted ${updatedDays.length} days in itineraryData`);

        return {
          ...prevData,
          days: updatedDays,
          total_days: prevData.total_days + 1,
        };
      });
    }
    console.log("itineraryDataManan after", itineraryData);

    // STEP 2: Mark this day as pending in parent's state
    console.log("onAddPendingDayManan", onAddPendingDay);
    console.log("insertDayNumberManan", insertDayNumber);
    if (onAddPendingDay) {
      onAddPendingDay(insertDayNumber);
      console.log(`✅ Added day ${insertDayNumber} to pending set in parent`);
    }

    // STEP 3: Navigate to the newly inserted day after a brief delay for animation
    setTimeout(() => {
      setCurrentDayIndex(afterDayIndex + 1);
    }, 300);
  };

  // Handle adding conveyance to pending day - CASE 1
  const handleAddConveyanceToPendingDay = async (dayNumber: number) => {
    console.log(`🚗 CASE 1: Adding conveyance for inserted day ${dayNumber}`);

    // IMPORTANT: Decrement insertedDaysCount BEFORE calling onAddDay
    // Same logic as handleRemovePendingDay - prevents the glitch where an extra day appears.
    // The pending day slot was already created when + was clicked, so we need to
    // "consume" the insertedDaysCount before the API call creates the actual day.
    setInsertedDaysCount((prev) => Math.max(0, prev - 1));

    if (onAddDay) {
      // Call the add day handler with isInsertFlow=true
      // This will trigger FlightsWidget → StaysWidget flow
      // After completion, it will call API with request_type="add"
      await onAddDay(false, true, dayNumber - 1, true); // extendTrip=false, needsConveyance=true, isInsertFlow=true

      // NOTE: We DO NOT remove from pending set
      // The pending day will be populated with the API response
      console.log(
        `✅ Conveyance flow completed for day ${dayNumber}, keeping pending state`
      );
    }
  };

  // Handle removing pending day - CASE 2 (Skip conveyance, generate itinerary directly)
  const handleRemovePendingDay = async (dayNumber: number) => {
    console.log(`❌ CASE 2: Skipping conveyance for inserted day ${dayNumber}`);

    // IMPORTANT: Decrement insertedDaysCount BEFORE calling onAddDay
    // This prevents the glitch where an extra day appears momentarily.
    //
    // Why? When we inserted the pending day, we incremented insertedDaysCount.
    // Now that we're generating the itinerary for that pending day (via onAddDay),
    // the API response will contain the actual day data. The merge logic in
    // useEffect will handle adding it to itineraryData.days.
    //
    // If we don't decrement here, the totalDays calculation becomes:
    // totalDays (from parent, already includes this day) + insertedDaysCount (still 1) = extra day
    //
    // After API response, insertedDaysCount is reset to 0 (line 732), but during the
    // API call, we see the glitch.
    setInsertedDaysCount((prev) => Math.max(0, prev - 1));

    if (onAddDay) {
      // Call the add day handler with needsConveyance=false and isInsertFlow=true
      // This will skip FlightsWidget/StaysWidget and directly call API with request_type="add"
      await onAddDay(false, false, dayNumber - 1, true); // extendTrip=false, needsConveyance=false, isInsertFlow=true

      // NOTE: We DO NOT remove from pending set here
      // The pending day will be populated with the API response
      // The parent component will handle removing it from pending set after API success
      console.log(
        `✅ Day ${dayNumber} added without conveyance, keeping pending state`
      );
    }
  };

  // Handle delete day button click
  const handleDeleteDayClick = (dayNumber: number) => {
    console.log(
      `\n🗑️ ========== DELETE DAY ${dayNumber} BUTTON CLICKED ==========`
    );
    console.log(
      `📍 Current day index: ${currentDayIndex}, Current day number: ${currentDayNumber}`
    );

    // Check if day exists in transformed itinerary data
    const dayData = itineraryData?.days.find((day) => day.day === dayNumber);

    if (!dayData) {
      console.log(
        `⚠️ Day ${dayNumber} has no itinerary data in transformed format, cannot delete`
      );
      return;
    }

    console.log(`✅ Found day ${dayNumber} in transformed itinerary data`);

    // IMPORTANT: We need to check conveyance_details from the ORIGINAL API response
    // The transformed dayData doesn't have conveyance_details
    // Access it from itineraryResponse which has the raw API format
    let hasRequiredConveyance = false;

    if (itineraryResponse) {
      console.log(`📦 Checking itineraryResponse for day ${dayNumber}...`);

      // Extract itinerary array from response (handle both message wrapper and direct format)
      const apiItinerary =
        itineraryResponse?.message?.itinerary || itineraryResponse?.itinerary;

      if (apiItinerary && Array.isArray(apiItinerary)) {
        console.log(`📊 Found ${apiItinerary.length} days in API itinerary`);

        // Find the day in the API response by day_number
        const apiDayData = apiItinerary.find(
          (day: any) => day.day_number === dayNumber
        );

        if (apiDayData) {
          console.log(`✅ Found day ${dayNumber} in API response`);
          console.log(
            `📋 API day data:`,
            JSON.stringify(
              {
                day_number: apiDayData.day_number,
                has_conveyance: !!apiDayData.conveyance_details,
                conveyance_details: apiDayData.conveyance_details,
              },
              null,
              2
            )
          );

          if (apiDayData.conveyance_details) {
            hasRequiredConveyance =
              apiDayData.conveyance_details.is_required === true;
            console.log(
              `📊 Day ${dayNumber} conveyance check: is_required = ${apiDayData.conveyance_details.is_required}`
            );
          } else {
            console.log(
              `📊 Day ${dayNumber} has NO conveyance_details in API response`
            );
          }
        } else {
          console.log(
            `⚠️ Day ${dayNumber} NOT FOUND in API response by day_number`
          );
          console.log(
            `Available day numbers in API:`,
            apiItinerary.map((d: any) => d.day_number)
          );
        }
      } else {
        console.log(`⚠️ API itinerary is not an array or is missing`);
      }
    } else {
      console.log(`⚠️ No itineraryResponse available`);
    }

    if (hasRequiredConveyance) {
      // CASE 1: Day with is_required: true - show warning and use API call
      console.log(`🚨 CASE 1: Day ${dayNumber} has REQUIRED conveyance`);
      console.log(`   → Showing warning alert`);
      console.log(`   → Will call onDeleteDay (API delete) after confirmation`);
      setDayToDelete(dayNumber);
      setShowDeleteWarning(true);
    } else {
      // CASE 2: Day with is_required: false - local delete with re-alignment
      console.log(`✅ CASE 2: Day ${dayNumber} has NO required conveyance`);
      console.log(`   → Calling handleLocalDelete immediately`);
      console.log(`   → Will call onLocalDeleteDay (local re-alignment)`);
      handleLocalDelete(dayNumber);
    }

    console.log(`========== END DELETE DAY ${dayNumber} ==========\n`);
  };

  // Handle local delete for CASE 2 (is_required: false)
  const handleLocalDelete = (dayNumber: number) => {
    console.log(
      `\n🔄 ========== LOCAL DELETE CASE 2 for Day ${dayNumber} ==========`
    );
    console.log(`🎬 Starting animation...`);

    // Set deleting state for animation
    setDeletingDayNumber(dayNumber);

    // Wait for animation to complete (300ms), then perform the deletion
    setTimeout(() => {
      console.log(`⏱️ Animation complete, calling onLocalDeleteDay handler...`);

      if (onLocalDeleteDay) {
        onLocalDeleteDay(dayNumber);
        console.log(`✅ Called parent's onLocalDeleteDay for day ${dayNumber}`);
      } else {
        console.error(`❌ onLocalDeleteDay callback is not defined!`);
      }

      // Clear deleting state
      setDeletingDayNumber(null);
      console.log(
        `========== END LOCAL DELETE for Day ${dayNumber} ==========\n`
      );
    }, 300);
  };

  // Handle chat message submission
  const handleChatSubmit = async (message: string) => {
    if (!message.trim() || !onChatSubmit) {
      console.warn("⚠️ Missing required data for chat submission");
      return;
    }

    console.log(
      `💬 Chat message submitted: "${message}" for day ${currentDayNumber}`
    );

    try {
      // Set loading state
      setIsChatLoading(true);

      // Call parent callback which will handle API and response
      await onChatSubmit(message, currentDayNumber);

      // Show success notification
      setShowUpdateNotification(true);
      setTimeout(() => {
        setShowUpdateNotification(false);
      }, 3000); // Hide after 3 seconds

      console.log("✅ Chat message processed successfully");
    } catch (error) {
      console.error("❌ Error in chat submission:", error);
      alert("Failed to process your message. Please try again.");
    } finally {
      // Clear loading state
      setIsChatLoading(false);
    }
  };

  // Handle delete warning - Continue
  const handleDeleteContinue = async () => {
    if (dayToDelete !== null && onDeleteDay) {
      console.log(
        `🗑️ CASE 1: Continuing with API delete for day ${dayToDelete}`
      );
      setShowDeleteWarning(false);

      try {
        // IMPORTANT: Call parent's onDeleteDay handler which does the API call
        // This is FlightsPageAuthenticated.handleDeleteDay
        await onDeleteDay(dayToDelete);
        console.log(`✅ Successfully deleted day ${dayToDelete} via API`);
      } catch (error) {
        console.error(`❌ Failed to delete day ${dayToDelete}:`, error);
      } finally {
        setDayToDelete(null);
      }
    }
  };

  // Handle delete warning - Decline
  const handleDeleteDecline = () => {
    console.log(`❌ User declined delete for day ${dayToDelete}`);
    setShowDeleteWarning(false);
    setDayToDelete(null);
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
                {isLoadingPendingDay ? (
                  // Loading State for Pending Day
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="max-w-md w-full text-center">
                      <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Creating Day {currentDayNumber} Itinerary
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Analyzing your preferences and optimizing your
                        schedule...
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 text-xs text-purple-600 font-medium">
                          <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                          <span>Finding best activities</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-indigo-600 font-medium">
                          <div
                            className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <span>Optimizing travel routes</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-medium">
                          <div
                            className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
                            style={{ animationDelay: "0.4s" }}
                          ></div>
                          <span>Adding personalized recommendations</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Normal Pending State - Show Conveyance Card
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
                )}
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
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 shadow-md border border-purple-200/50">
                          <span className="text-[10px] font-bold text-purple-600">
                            📅 {currentDay.date}
                          </span>
                        </div>
                        <h3
                          className="text-lg font-extrabold leading-tight"
                          style={{
                            background:
                              "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {currentDay.title}
                        </h3>
                      </div>

                      {/* Weather Info - Top Right Corner */}
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {/* Temperature */}
                        <div className="flex items-center gap-1 bg-gradient-to-r from-orange-50 to-amber-50 backdrop-blur-md rounded-lg px-2.5 py-1.5 border border-orange-200/50 shadow-md hover:shadow-lg transition-shadow">
                          <span className="text-xs">🌡️</span>
                          <span className="text-[10px] font-bold text-orange-700">
                            {currentDay.weather.temperature}°C
                          </span>
                        </div>
                        {/* Humidity */}
                        {currentDay.weather.avg_humidity > 0 && (
                          <div className="flex items-center gap-1 bg-gradient-to-r from-cyan-50 to-blue-50 backdrop-blur-md rounded-lg px-2.5 py-1.5 border border-cyan-200/50 shadow-md hover:shadow-lg transition-shadow">
                            <span className="text-xs">💧</span>
                            <span className="text-[10px] font-bold text-cyan-700">
                              {currentDay.weather.avg_humidity}%
                            </span>
                          </div>
                        )}
                        {/* Precipitation */}
                        {currentDay.weather.precipitation > 0 && (
                          <div className="flex items-center gap-1 bg-gradient-to-r from-indigo-50 to-purple-50 backdrop-blur-md rounded-lg px-2.5 py-1.5 border border-indigo-200/50 shadow-md hover:shadow-lg transition-shadow">
                            <span className="text-xs">🌧️</span>
                            <span className="text-[10px] font-bold text-indigo-700">
                              {currentDay.weather.precipitation}mm
                            </span>
                          </div>
                        )}
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
                  className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50 relative"
                  onScroll={handleScroll}
                >
                  {/* Timeline Container */}
                  <div className="relative">
                    {currentDay.stops.map((stop: any, index) => {
                      console.log("stop ", stop);
                      const isLast = index === currentDay.stops.length - 1;
                      const activityType = stop.activity_type || "other";
                      console.log("activityType ", activityType);
                      const imageUrl = stop.image_url || stop.photo_url || null;

                      // Get first photo from photos array if available
                      const photos =
                        stop.photos ||
                        stop.from_location?.photos ||
                        stop.to_location?.photos ||
                        [];
                      const rawPhotoUrl =
                        photos.length > 0 ? photos[0] : imageUrl;

                      // Process photo URL to use authenticated proxy for Google Places photos
                      const photoUrl = processPhotoUrl(rawPhotoUrl);

                      // Get location for maps URL
                      const mapsUrl = getGoogleMapsUrl(
                        stop.from_location || stop.to_location || stop
                      );

                      // Check if this card is expanded
                      const isCardExpanded = expandedCards.has(stop.id);

                      // Handle card expansion toggle
                      const handleToggleCard = () => {
                        setExpandedCards((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(stop.id)) {
                            newSet.delete(stop.id);
                          } else {
                            // Close all other cards and open this one
                            newSet.clear();
                            newSet.add(stop.id);
                          }
                          return newSet;
                        });
                      };

                      return (
                        <div
                          key={stop.id}
                          className="timeline-item-container relative mb-5 last:mb-0"
                        >
                          {/* Timeline Time - Left Side */}
                          <div className="absolute left-0 top-0.5 w-14 text-right pr-3">
                            <span className="text-[13px] font-semibold text-gray-600">
                              {stop.time.split(" - ")[0]}
                            </span>
                          </div>

                          {/* Timeline Line - Vertical connector */}
                          {!isLast && (
                            <div
                              className="absolute left-[68px] top-5 w-[2px] bg-gradient-to-b from-[#32B8C6] to-[rgba(50,184,198,0.2)]"
                              style={{ height: "calc(100% + 20px)" }}
                            ></div>
                          )}

                          {/* Timeline Dot */}
                          <div
                            className={`absolute left-[60px] top-1 w-4 h-4 bg-white border-[3px] rounded-full z-10 ${
                              index === 0
                                ? "border-[#32B8C6] shadow-[0_0_0_4px_rgba(50,184,198,0.2)]"
                                : "border-[#32B8C6] shadow-[0_0_0_4px_rgba(50,184,198,0.1)]"
                            }`}
                          ></div>

                          {/* Card Container - Right Side */}
                          <div className="ml-[90px]">
                            <TimelineCard
                              stop={stop}
                              activityType={activityType}
                              photoUrl={photoUrl}
                              mapsUrl={mapsUrl}
                              index={index}
                              isExpanded={isCardExpanded}
                              onToggleExpand={handleToggleCard}
                            />
                          </div>
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
            {/* Map - Only render when currentDay exists and has stops */}
            {!isEmptyDay && currentDay && currentDay.stops ? (
              <ItineraryMap
                stops={currentDay.stops}
                dayTitle={currentDay.title}
              />
            ) : (
              // Empty map placeholder for pending days
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 via-indigo-50 to-blue-100">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm font-bold text-gray-700">
                    {isPendingConveyanceDay
                      ? "Waiting for day details..."
                      : "Map loading..."}
                  </p>
                </div>
              </div>
            )}
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
            totalDays={Math.max(totalDays, itineraryData.total_days || 0) + insertedDaysCount}
            onDaySelect={handleDaySelect}
            onAddDay={handleAddDayClick}
            onInsertDay={handleInsertDay}
            loadingDayIndex={loadingDayIndex}
            pendingConveyanceDays={pendingConveyanceDays}
            onDeleteDay={handleDeleteDayClick}
            deletingDayNumber={deletingDayNumber}
          />
        </div>

        {/* ChatBox and Continue Button - Centered */}
        <div className="max-w-3xl mx-auto relative">
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
            placeholder="Ask ItinerAI about your itinerary..."
            theme="white"
            inputType="input"
            isLoading={isChatLoading}
            disabled={isChatLoading}
          />

          {/* Continue Button - Bottom Right */}
          {onContinue && (
            <button
              onClick={onContinue}
              disabled={!allDaysGenerated}
              className={`continue-button ${
                !allDaysGenerated ? "disabled" : ""
              }`}
              aria-label="Continue to booking"
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

      {/* Delete Warning Alert - Top Right Corner */}
      {showDeleteWarning && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-red-400 overflow-hidden animate-slide-in-right">
            {/* Alert Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">
                Warning: Delete Day
              </h3>
            </div>

            {/* Alert Body */}
            <div className="p-5">
              <p className="text-sm text-gray-800 leading-relaxed mb-4 font-medium">
                Deleting this will delete all the itineraries generated ahead of
                it. Are you sure you want to continue?
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteContinue}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg py-2.5 px-4 font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Continue
                </button>
                <button
                  onClick={handleDeleteDecline}
                  className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 rounded-lg py-2.5 px-4 font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification - Top Right */}
      {showUpdateNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-green-400 overflow-hidden animate-slide-in-right">
            {/* Notification Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Success</h3>
            </div>

            {/* Notification Body */}
            <div className="p-4">
              <p className="text-sm text-gray-800 leading-relaxed font-medium">
                The itineraries are updated
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }

        /* Continue Button Styles */
        .continue-button {
          position: absolute;
          right: 0;
          bottom: 0;
          display: flex;
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

        .continue-button:not(.disabled):hover {
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

        .continue-button:not(.disabled):active {
          transform: translateY(0);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
        }

        .continue-button.disabled {
          opacity: 0.5;
          filter: blur(2px);
          cursor: not-allowed;
          pointer-events: none;
        }

        .continue-button span {
          font-weight: 600;
        }

        .continue-button svg {
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .continue-button:not(.disabled):hover svg {
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
}
