import React, { useMemo } from "react";
import { getTripImage } from "../flashcards/imageHelpers";

interface Trip {
  trip_title: string;
  no_of_days: number;
  estimated_budget: number;
  image?: string;
  theme?: string[];
  themes?: string[];
  best_time_to_visit?: string;
  trip_route?: any[];
  day_wise_plan?: any[];
}

interface SuggestedTripsSnippetProps {
  trips: Trip[];
}

export function SuggestedTripsSnippet({ trips }: SuggestedTripsSnippetProps) {
  // Process trips to get proper image URLs using the same logic as FlashcardsWidget
  const processedTrips = useMemo(() => {
    return trips.map((trip) => ({
      ...trip,
      image: getTripImage(trip),
    }));
  }, [trips]);

  // Show only first 4 trips, rest will be scrollable
  const displayTrips = processedTrips.slice(
    0,
    Math.min(processedTrips.length, 4)
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-600">
        Here are some trip suggestions for you:
      </p>
      <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
        {displayTrips.map((trip, index) => {
          const themes = trip.themes || trip.theme || [];
          return (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex gap-3 p-3">
                {/* Trip Image */}
                {trip.image && (
                  <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-gray-100">
                    <img
                      src={trip.image}
                      alt={trip.trip_title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Trip Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-gray-900 mb-1 truncate">
                    {trip.trip_title}
                  </h4>

                  {/* Meta Info */}
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {trip.no_of_days} days
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      ₹{trip.estimated_budget.toLocaleString()}
                    </span>
                  </div>

                  {/* Themes */}
                  {themes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {themes.slice(0, 2).map((theme, themeIdx) => (
                        <span
                          key={themeIdx}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
                        >
                          {theme}
                        </span>
                      ))}
                      {themes.length > 2 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">
                          +{themes.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Best Time to Visit */}
                  {trip.best_time_to_visit && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                        />
                      </svg>
                      Best: {trip.best_time_to_visit}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {trips.length > 4 && (
        <p className="text-xs text-gray-500 italic">
          Showing {displayTrips.length} of {trips.length} trips
        </p>
      )}
    </div>
  );
}
