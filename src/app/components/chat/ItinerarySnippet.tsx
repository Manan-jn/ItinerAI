import React, { useState, useMemo } from "react";

interface ScheduleItem {
  activity_type: string;
  sub_type?: string;
  start_time: string;
  end_time: string;
  description: string;
  place_name?: string;
  address?: string;
  fare?: number;
  duration_minutes?: number;
  from_location?: {
    place_name: string;
    address?: string;
  };
  to_location?: {
    place_name: string;
    address?: string;
  };
}

interface DayItinerary {
  day_number: number;
  date?: string;
  title?: string;
  summary?: string;
  themes?: string[];
  schedule: ScheduleItem[];
  estimated_total_cost?: number;
  conveyance_details?: {
    is_required: boolean;
    from_city?: string;
    to_city?: string;
    type?: string;
    operator?: string;
    number?: string;
  };
  stay_details?: {
    is_required: boolean;
    city?: string;
    property_name?: string;
  };
}

interface ItinerarySnippetProps {
  itineraries: DayItinerary[];
  tripTitle?: string;
  totalDays?: number;
}

// Get emoji for activity type
const getActivityEmoji = (activityType: string, subType?: string): string => {
  if (activityType === "eat") {
    if (subType?.toLowerCase().includes("breakfast")) return "☕";
    if (subType?.toLowerCase().includes("lunch")) return "🍽️";
    if (subType?.toLowerCase().includes("dinner")) return "🍽️";
    return "🍴";
  }
  if (activityType === "travel") {
    if (subType?.toLowerCase().includes("flight")) return "✈️";
    if (subType?.toLowerCase().includes("train")) return "🚆";
    if (
      subType?.toLowerCase().includes("cab") ||
      subType?.toLowerCase().includes("taxi")
    )
      return "🚕";
    return "🚗";
  }
  if (activityType === "visit") {
    if (subType?.toLowerCase().includes("beach")) return "🏖️";
    if (subType?.toLowerCase().includes("historical")) return "🏛️";
    if (subType?.toLowerCase().includes("nightlife")) return "🎉";
    if (subType?.toLowerCase().includes("shopping")) return "🛍️";
    return "📍";
  }
  if (activityType === "rest") {
    if (subType?.toLowerCase().includes("check_in")) return "🏨";
    return "🛏️";
  }
  if (activityType === "free_time") return "🕐";
  return "🎯";
};

// Get color config for activity type
const getActivityColor = (
  activityType: string
): { bg: string; text: string; border: string } => {
  switch (activityType) {
    case "travel":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      };
    case "rest":
      return {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
      };
    case "eat":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
      };
    case "visit":
      return {
        bg: "bg-teal-50",
        text: "text-teal-700",
        border: "border-teal-200",
      };
    default:
      return {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
      };
  }
};

export function ItinerarySnippet({
  itineraries,
  tripTitle,
  totalDays,
}: ItinerarySnippetProps) {
  const [selectedDay, setSelectedDay] = useState(1);

  // Sort itineraries by day number
  const sortedItineraries = useMemo(() => {
    return [...itineraries].sort((a, b) => a.day_number - b.day_number);
  }, [itineraries]);

  // Get current day's itinerary
  const currentDayItinerary = useMemo(() => {
    return sortedItineraries.find((it) => it.day_number === selectedDay);
  }, [sortedItineraries, selectedDay]);

  // Calculate trip stats
  const tripStats = useMemo(() => {
    let totalCost = 0;
    let totalActivities = 0;

    sortedItineraries.forEach((day) => {
      totalCost += day.estimated_total_cost || 0;
      totalActivities += day.schedule?.length || 0;
    });

    return { totalCost, totalActivities };
  }, [sortedItineraries]);

  if (!itineraries || itineraries.length === 0) {
    return (
      <div className="text-xs text-gray-500">No itinerary data available</div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-600">
          Your complete trip itinerary:
        </p>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <span>📅</span>
            {totalDays || sortedItineraries.length} days
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span>📍</span>
            {tripStats.totalActivities} activities
          </span>
          {tripStats.totalCost > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span>💰</span>₹{tripStats.totalCost.toLocaleString()}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Day Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          {sortedItineraries.map((day) => (
            <button
              key={day.day_number}
              onClick={() => setSelectedDay(day.day_number)}
              className={`flex-shrink-0 px-4 py-2.5 text-xs font-medium transition-all duration-200 border-b-2 ${
                selectedDay === day.day_number
                  ? "border-blue-500 text-blue-700 bg-white/70"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-white/50"
              }`}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-semibold">Day {day.day_number}</span>
                {day.date && (
                  <span className="text-[9px] text-gray-500">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Day Content */}
        {currentDayItinerary && (
          <div className="p-3">
            {/* Day Header */}
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {currentDayItinerary.title ||
                  `Day ${currentDayItinerary.day_number} Itinerary`}
              </h4>
              {currentDayItinerary.summary && (
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {currentDayItinerary.summary}
                </p>
              )}
              {/* Themes */}
              {currentDayItinerary.themes &&
                currentDayItinerary.themes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {currentDayItinerary.themes
                      .slice(0, 3)
                      .map((theme, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-full border border-blue-200"
                        >
                          {theme}
                        </span>
                      ))}
                  </div>
                )}
            </div>

            {/* Conveyance Info */}
            {currentDayItinerary.conveyance_details?.is_required && (
              <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-blue-600">
                    {currentDayItinerary.conveyance_details.type === "train"
                      ? "🚆"
                      : "✈️"}
                  </span>
                  <span className="font-medium text-blue-800">
                    {currentDayItinerary.conveyance_details.from_city} →{" "}
                    {currentDayItinerary.conveyance_details.to_city}
                  </span>
                  {currentDayItinerary.conveyance_details.operator && (
                    <span className="text-blue-600">
                      ({currentDayItinerary.conveyance_details.operator}{" "}
                      {currentDayItinerary.conveyance_details.number})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Schedule Timeline */}
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
              {currentDayItinerary.schedule?.slice(0, 6).map((item, index) => {
                const color = getActivityColor(item.activity_type);
                const emoji = getActivityEmoji(
                  item.activity_type,
                  item.sub_type
                );

                return (
                  <div
                    key={index}
                    className={`flex gap-2 p-2 rounded-lg ${color.bg} border ${color.border}`}
                  >
                    {/* Time */}
                    <div className="flex-shrink-0 text-[10px] font-medium text-gray-500 w-14">
                      {item.start_time}
                    </div>

                    {/* Emoji */}
                    <div className="flex-shrink-0 text-sm">{emoji}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-[11px] font-medium ${color.text} truncate`}
                      >
                        {item.place_name ||
                          item.from_location?.place_name ||
                          item.description.substring(0, 40)}
                      </div>
                      {item.activity_type === "travel" &&
                        item.from_location &&
                        item.to_location && (
                          <div className="text-[10px] text-gray-500 truncate">
                            {item.from_location.place_name} →{" "}
                            {item.to_location.place_name}
                          </div>
                        )}
                      {item.fare && item.fare > 0 && (
                        <span className="text-[10px] text-green-600 font-medium">
                          ₹{item.fare}
                        </span>
                      )}
                    </div>

                    {/* Duration */}
                    {item.duration_minutes && item.duration_minutes > 0 && (
                      <div className="flex-shrink-0 text-[10px] text-gray-500">
                        {item.duration_minutes}m
                      </div>
                    )}
                  </div>
                );
              })}
              {currentDayItinerary.schedule?.length > 6 && (
                <p className="text-[10px] text-gray-500 text-center italic pt-1">
                  +{currentDayItinerary.schedule.length - 6} more activities
                </p>
              )}
            </div>

            {/* Stay Info */}
            {currentDayItinerary.stay_details?.is_required && (
              <div className="mt-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 text-[11px]">
                  <span>🏨</span>
                  <span className="font-medium text-orange-800">
                    {currentDayItinerary.stay_details.property_name || "Stay"}{" "}
                    in {currentDayItinerary.stay_details.city}
                  </span>
                </div>
              </div>
            )}

            {/* Day Cost */}
            {currentDayItinerary.estimated_total_cost &&
              currentDayItinerary.estimated_total_cost > 0 && (
                <div className="mt-3 flex justify-end">
                  <span className="text-[11px] font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                    Day Total: ₹
                    {currentDayItinerary.estimated_total_cost.toLocaleString()}
                  </span>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Trip Title Footer */}
      {tripTitle && (
        <p className="text-[10px] text-gray-500 text-center italic">
          {tripTitle}
        </p>
      )}
    </div>
  );
}
