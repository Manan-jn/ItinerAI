"use client";

import { useState } from "react";
import { MdLocationOn, MdClose, MdChat } from "react-icons/md";

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
}

export default function ItineraryWidget({
  isVisible,
  onToggle,
  onOpenChat,
  data,
}: ItineraryWidgetProps) {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [chatInput, setChatInput] = useState("");

  // Load itinerary data from JSON
  const [itineraryData] = useState<ItineraryData>(() => {
    if (data) return data;
    // Default data if none provided
    try {
      const itinerary = require("../../../itinerary_data.json");
      return itinerary;
    } catch (e) {
      console.error("Failed to load itinerary data:", e);
      return null;
    }
  });

  if (!isVisible || !itineraryData) return null;

  const currentDay = itineraryData.days[currentDayIndex];
  const hasNextDay = currentDayIndex < itineraryData.days.length - 1;
  const hasPrevDay = currentDayIndex > 0;

  const handleNextDay = () => {
    if (hasNextDay) {
      setCurrentDayIndex(currentDayIndex + 1);
    }
  };

  const handlePrevDay = () => {
    if (hasPrevDay) {
      setCurrentDayIndex(currentDayIndex - 1);
    }
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

  return (
    <div className="h-full flex flex-col bg-white rounded-xl overflow-hidden">
      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT PANEL - Day Itinerary Details */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          {/* Header Section */}
          <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gradient-to-br from-purple-50 to-blue-50">
            <div className="mb-3">
              <h2 className="text-xl font-bold text-gray-900 mb-0.5">
                Day Itinerary
              </h2>
              <p className="text-xs text-gray-600">Detailed Itinerary route</p>
            </div>

            {/* Date and Title Card */}
            <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-semibold text-purple-600">
                      {currentDay.date}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-0.5">
                    {currentDay.title}
                  </h3>
                </div>
                {/* Weather Widget */}
                <div className="flex items-center space-x-2 bg-blue-50 rounded-lg px-2.5 py-1.5 border border-blue-100">
                  <span className="text-xl">{currentDay.weather.icon}</span>
                  <div>
                    <div className="text-base font-bold text-gray-900">
                      {currentDay.weather.temperature}
                    </div>
                    <div className="text-[9px] text-gray-500">
                      {currentDay.weather.condition}
                    </div>
                  </div>
                </div>
              </div>

              {/* Travel Stats */}
              <div className="bg-gray-50 rounded-lg p-2 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-[9px] text-gray-500 mb-0.5">
                    Avg travel time
                  </div>
                  <div className="text-xs font-bold text-gray-900">
                    {currentDay.mapData.avgTravelTime}
                  </div>
                </div>
                <div className="text-center border-x border-gray-200">
                  <div className="text-[9px] text-gray-500 mb-0.5">
                    Total Distance
                  </div>
                  <div className="text-xs font-bold text-gray-900">
                    {currentDay.mapData.totalDistance}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-gray-500 mb-0.5">
                    Planned stops
                  </div>
                  <div className="text-xs font-bold text-gray-900">
                    {currentDay.mapData.plannedStops}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Stops & Activities */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">
                Stops & Activities
              </h3>
              <button className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition-all">
                <span>+ add stop</span>
              </button>
            </div>

            {/* Day Label */}
            <div className="mb-3">
              <div className="inline-block bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                DAY {currentDay.day}
              </div>
            </div>

            {/* Stops List */}
            <div className="space-y-3">
              {currentDay.stops.map((stop, index) => {
                const iconConfig = getStopIcon(stop.type);
                const isLast = index === currentDay.stops.length - 1;

                return (
                  <div key={stop.id} className="relative">
                    {/* Connecting line */}
                    {!isLast && (
                      <div className="absolute left-[18px] top-[50px] bottom-[-12px] w-0.5 bg-gray-200"></div>
                    )}

                    {/* Stop Card */}
                    <div className="bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all p-3">
                      <div className="flex items-start space-x-2.5">
                        {/* Icon */}
                        <div
                          className={`w-9 h-9 ${iconConfig.bg} border ${iconConfig.border} rounded-lg flex items-center justify-center text-lg flex-shrink-0`}
                        >
                          {stop.image}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-semibold text-xs text-gray-900">
                              {stop.name}
                            </h4>
                            <span className="text-[10px] font-medium text-gray-500 ml-2">
                              {stop.time}
                            </span>
                          </div>

                          <div className="flex items-start space-x-1 text-[10px] text-gray-500 mb-1">
                            <MdLocationOn
                              className="text-gray-400 mt-0.5 flex-shrink-0"
                              size={12}
                            />
                            <span className="line-clamp-1">
                              {stop.location}
                            </span>
                          </div>

                          <p className="text-[10px] text-gray-600 leading-relaxed mb-1 line-clamp-2">
                            {stop.description}
                          </p>

                          {stop.duration && (
                            <div className="text-[10px] text-gray-500 mb-1">
                              ⏱️ {stop.duration}
                            </div>
                          )}

                          {stop.notes && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded px-2 py-1 text-[10px] text-yellow-800">
                              💡 {stop.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom AI Chat Input and Navigation */}
          <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3">
            <div className="flex items-center space-x-2">
              {/* AI Chat Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (chatInput.trim()) {
                    console.log("AI Chat message:", chatInput);
                    // Handle AI chat here
                    setChatInput("");
                  }
                }}
                className="flex-1 flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask AI about this itinerary..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-all flex-shrink-0 font-medium text-xs shadow-md hover:shadow-lg disabled:shadow-none flex items-center gap-1.5"
                >
                  <MdChat className="text-sm" />
                  <span>Send</span>
                </button>
              </form>

              {/* Navigation Arrow Buttons */}
              <button
                onClick={handlePrevDay}
                disabled={!hasPrevDay}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                  hasPrevDay
                    ? "bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-400 hover:bg-purple-50"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200"
                }`}
                title="Previous Day"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={handleNextDay}
                disabled={!hasNextDay}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                  hasNextDay
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                title="Next Day"
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Map and Activities List */}
        <div className="w-1/2 flex flex-col bg-gray-50">
          {/* Map Section - Fixed 50% height */}
          <div className="h-1/2 p-4 pb-2 flex-shrink-0">
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm h-full">
              {/* Map Placeholder */}
              <div className="relative h-full bg-gradient-to-br from-blue-100 via-purple-50 to-blue-50">
                <div className="absolute inset-0 overflow-hidden">
                  {/* Grid lines for map effect */}
                  <div className="absolute inset-0">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={`h-${i}`}
                        className="absolute left-0 right-0 h-px bg-gray-300/30"
                        style={{ top: `${(i + 1) * 10}%` }}
                      ></div>
                    ))}
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={`v-${i}`}
                        className="absolute top-0 bottom-0 w-px bg-gray-300/30"
                        style={{ left: `${(i + 1) * 10}%` }}
                      ></div>
                    ))}
                  </div>

                  {/* Route line */}
                  <svg
                    className="absolute inset-0 w-full h-full"
                    style={{ zIndex: 1 }}
                  >
                    <path
                      d="M 50,60 Q 100,100 150,140 T 250,180 Q 300,200 350,220"
                      stroke="#8B5CF6"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray="8,4"
                      opacity="0.6"
                    />
                  </svg>

                  {/* Location markers */}
                  {currentDay.stops.slice(0, 4).map((stop, idx) => {
                    const positions = [
                      { top: "20%", left: "15%" },
                      { top: "35%", left: "35%" },
                      { top: "55%", left: "55%" },
                      { top: "70%", left: "75%" },
                    ];
                    const position = positions[idx] || positions[0];

                    return (
                      <div
                        key={stop.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ top: position.top, left: position.left }}
                      >
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-lg border-3 border-white animate-pulse">
                          <span className="text-base">{stop.image}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Expand Map button */}
                <button className="absolute top-3 right-3 bg-white rounded-lg shadow-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200">
                  Expand
                </button>
              </div>
            </div>
          </div>

          {/* Activities List Section - Fixed 50% height */}
          <div className="h-1/2 p-4 pt-2 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
              {/* Header */}
              <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 flex-shrink-0">
                <h3 className="text-base font-bold text-gray-900 mb-0.5">
                  LIST OF Activities
                </h3>
                <p className="text-[10px] text-gray-600 line-clamp-1">
                  {currentDay.subtitle}
                </p>
              </div>

              {/* Activities Cards */}
              <div className="p-3 space-y-2 overflow-y-auto flex-1">
                {currentDay.stops.map((stop) => (
                  <div
                    key={stop.id}
                    className="flex items-center space-x-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-white transition-all group"
                  >
                    {/* Photo placeholder */}
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0 border border-gray-200">
                      {stop.image}
                    </div>

                    {/* Activity Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs text-gray-900 mb-0.5 line-clamp-1">
                        {stop.name}
                      </h4>
                      <p className="text-[10px] text-gray-600 line-clamp-1 mb-0.5">
                        {stop.description}
                      </p>
                      <div className="flex items-center space-x-1.5 text-[10px] text-gray-500">
                        <span>⏰ {stop.time}</span>
                        {stop.duration && (
                          <>
                            <span>•</span>
                            <span>{stop.duration}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Add button */}
                    <button className="w-7 h-7 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all flex-shrink-0 group-hover:scale-110">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
