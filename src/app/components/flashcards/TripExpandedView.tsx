"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { TripInfo, DayPlan } from "./types";
import { TripMap } from "./TripMap";

interface TripExpandedViewProps {
  trip: TripInfo;
  onClose: () => void;
  onTripUpdate?: (updatedTrip: TripInfo) => void;
  isSidebarCollapsed?: boolean;
}

export function TripExpandedView({
  trip,
  onClose,
  onTripUpdate,
  isSidebarCollapsed = false,
}: TripExpandedViewProps) {
  // Make trip data mutable with state
  const [tripData, setTripData] = useState<TripInfo>(trip);
  const [searchQuery, setSearchQuery] = useState("");
  // Changed from expandedDays to selectedDay for tab-based navigation
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [mounted, setMounted] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Loading state for component readiness
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);

  // Ref to track if this is the initial mount
  const isInitialMount = useRef(true);

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    // Use requestAnimationFrame for smoother animation timing
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsAnimatingIn(false);
      });
    });

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Mark map as ready if there's no trip_route
  useEffect(() => {
    if (!trip.trip_route || trip.trip_route.length === 0) {
      setMapReady(true);
    }
  }, [trip.trip_route]);

  // Check if all resources are ready
  useEffect(() => {
    // Wait for both map and images, with a minimum delay to ensure smooth appearance
    const checkReady = () => {
      // Map is optional (might not have trip_route), so only wait if trip_route exists
      const mapCondition =
        trip.trip_route && trip.trip_route.length > 0 ? mapReady : true;

      if (mapCondition && imagesReady && !isClosing) {
        // Use requestAnimationFrame for smooth transition
        requestAnimationFrame(() => {
          setTimeout(() => {
            setIsLoading(false);
          }, 200);
        });
      }
    };

    checkReady();
  }, [mapReady, imagesReady, trip.trip_route, isClosing]);

  // Preload the city image for the current day
  useEffect(() => {
    const currentDayData = tripData.day_wise_plan?.find(
      (day) => day.day_number === selectedDay
    );

    if (!currentDayData) {
      setImagesReady(true);
      return;
    }

    const dayIndex =
      tripData.day_wise_plan?.findIndex(
        (day) => day.day_number === selectedDay
      ) || 0;

    const cityName = getCityForDay(currentDayData, dayIndex);
    const cityImage = getCityImage(cityName);

    if (!cityImage) {
      setImagesReady(true);
      return;
    }

    // Preload the image
    const img = new Image();
    img.onload = () => {
      setImagesReady(true);
    };
    img.onerror = () => {
      // Even if image fails, mark as ready to show the UI
      setImagesReady(true);
    };
    img.src = cityImage;

    // Timeout fallback - show UI after 2 seconds even if image hasn't loaded
    const timeout = setTimeout(() => {
      setImagesReady(true);
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  }, [selectedDay, tripData]);

  // Call onTripUpdate whenever tripData changes (skip initial mount)
  useEffect(() => {
    // Skip the initial mount to prevent infinite loop
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only call onTripUpdate for actual changes after mount
    if (onTripUpdate) {
      onTripUpdate(tripData);
    }
  }, [tripData, onTripUpdate]);

  const handleClose = () => {
    setIsClosing(true);
    // First fade out the content
    setIsLoading(true);
    setTimeout(() => {
      onClose();
    }, 400); // Slightly longer for smoother transition
  };

  // Get city for a specific day - with fallback logic
  const getCityForDay = (day: DayPlan, dayIndex: number) => {
    // Priority 1: Check conveyance to_city (where they're going)
    if (
      day.conveyance_details?.to_city &&
      day.conveyance_details.to_city !== "user_location"
    ) {
      return day.conveyance_details.to_city;
    }

    // Priority 2: Check conveyance from_city (for last day or when to_city is user_location)
    if (
      day.conveyance_details?.from_city &&
      day.conveyance_details.from_city !== "user_location"
    ) {
      return day.conveyance_details.from_city;
    }

    // Priority 3: Check stay_details
    if (day.stay_details?.city) {
      return day.stay_details.city;
    }

    // Priority 4: If no conveyance required (staying in same city), look at previous days
    if (
      day.conveyance_details?.is_required === false &&
      dayIndex > 0 &&
      trip.day_wise_plan
    ) {
      // Recursively look back through previous days to find the city
      for (let i = dayIndex - 1; i >= 0; i--) {
        const prevDay = trip.day_wise_plan[i];

        // Check if previous day has to_city
        if (
          prevDay.conveyance_details?.to_city &&
          prevDay.conveyance_details.to_city !== "user_location"
        ) {
          return prevDay.conveyance_details.to_city;
        }

        // Check if previous day has stay_details
        if (prevDay.stay_details?.city) {
          return prevDay.stay_details.city;
        }
      }
    }

    return null;
  };

  // Get city image from trip_route and convert to proxy URL if needed
  const getCityImage = (cityName: string | null) => {
    if (!cityName || !trip.trip_route) {
      return null;
    }

    // Case-insensitive and partial matching for city names
    const normalizedCityName = cityName.toLowerCase().trim();
    const cityData = trip.trip_route.find((route) => {
      const routeName = route.place_name.toLowerCase().trim();
      // Try exact match first, then check if city name is contained in route name or vice versa
      return (
        routeName === normalizedCityName ||
        routeName.includes(normalizedCityName) ||
        normalizedCityName.includes(routeName)
      );
    });

    if (!cityData) {
      return null;
    }

    const photoUrl = cityData?.photos?.[0];
    if (!photoUrl) {
      return null;
    }


    // Convert Google Places photo URL to proxy URL
    if (photoUrl.includes("maps.googleapis.com/maps/api/place/photo")) {
      try {
        const urlObj = new URL(photoUrl);
        const photoReference = urlObj.searchParams.get("photoreference");
        if (photoReference) {
          const proxyUrl = `/api/place-photo?photoreference=${photoReference}&maxwidth=600&maxheight=400`;
          return proxyUrl;
        }
      } catch (error) {
        console.warn("Error processing Google Places photo URL:", error);
      }
    }

    return photoUrl;
  };

  // Search for places using Google Places API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/places-autocomplete?input=${encodeURIComponent(searchQuery)}`
        );
        const data = await response.json();

        if (data.predictions) {
          setSearchResults(data.predictions);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(searchTimer);
  }, [searchQuery]);

  // Add activity to the currently selected day
  const handleAddActivity = async (placeId: string, placeName: string) => {
    try {
      // Fetch place details from Google Places API
      const response = await fetch(
        `/api/place-details?place_id=${encodeURIComponent(placeId)}`
      );
      const activityData = await response.json();

      if (activityData.error) {
        console.error("Error fetching place details:", activityData.error);
        return;
      }

      // Update trip data with new activity for the selected day
      setTripData((prevTrip) => {
        const newTrip = { ...prevTrip };
        if (newTrip.day_wise_plan) {
          const dayIndex = newTrip.day_wise_plan.findIndex(
            (d) => d.day_number === selectedDay
          );

          if (dayIndex !== -1) {
            const updatedDay = { ...newTrip.day_wise_plan[dayIndex] };
            updatedDay.must_do_activities = [
              ...updatedDay.must_do_activities,
              {
                type: activityData.type,
                category: activityData.category,
                name: activityData.name,
                description: activityData.description,
              },
            ];

            newTrip.day_wise_plan = [...newTrip.day_wise_plan];
            newTrip.day_wise_plan[dayIndex] = updatedDay;
          }
        }
        return newTrip;
      });


      // Clear search
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error adding activity:", error);
    }
  };

  // Remove activity from a specific day
  const handleRemoveActivity = (dayNumber: number, activityIndex: number) => {
    setTripData((prevTrip) => {
      const newTrip = { ...prevTrip };
      if (newTrip.day_wise_plan) {
        const dayIndex = newTrip.day_wise_plan.findIndex(
          (d) => d.day_number === dayNumber
        );

        if (dayIndex !== -1) {
          const updatedDay = { ...newTrip.day_wise_plan[dayIndex] };
          updatedDay.must_do_activities = updatedDay.must_do_activities.filter(
            (_, idx) => idx !== activityIndex
          );

          newTrip.day_wise_plan = [...newTrip.day_wise_plan];
          newTrip.day_wise_plan[dayIndex] = updatedDay;
        }
      }
      return newTrip;
    });

  };

  if (!mounted) return null;

  // Get the currently selected day data
  const currentDayData = tripData.day_wise_plan?.find(
    (day) => day.day_number === selectedDay
  );
  const dayIndex =
    tripData.day_wise_plan?.findIndex(
      (day) => day.day_number === selectedDay
    ) || 0;
  const cityName = currentDayData
    ? getCityForDay(currentDayData, dayIndex)
    : null;
  const cityImage = getCityImage(cityName);

  const modalContent = (
    <div
      className={`trip-expanded-view ${isAnimatingIn ? "animating-in" : ""} ${
        isClosing ? "closing" : ""
      }`}
    >
      {/* Blurred Background Overlay */}
      <div className="trip-expanded-backdrop" onClick={handleClose} />

      {/* Main Content Container */}
      <div className="trip-expanded-container">
        {/* Close Button */}
        <button
          className="trip-expanded-close"
          onClick={handleClose}
          aria-label="Close"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Left Side: Map */}
        <div className="trip-expanded-map">
          {trip.trip_route && trip.trip_route.length > 0 ? (
            <TripMap
              places={trip.trip_route}
              onMapReady={() => setMapReady(true)}
            />
          ) : (
            <div className="map-placeholder">MAP</div>
          )}
        </div>

        {/* Center: Trip Details */}
        <div className="trip-expanded-main">
          {/* Header Section */}
          <div className="trip-expanded-header">
            <div className="trip-title-container">
              <h1 className="trip-title">{trip.trip_title}</h1>
            </div>

            {/* Metadata Badges */}
            <div className="trip-meta-badges">
              <div className="meta-badge">
                <div className="meta-icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div className="meta-text">
                  <span className="badge-label">Trip</span>
                  <span className="badge-value">{trip.no_of_days} Days</span>
                </div>
              </div>
              <div className="meta-badge">
                <div className="meta-icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div className="meta-text">
                  <span className="badge-label">Budget</span>
                  <span className="badge-value">
                    ₹{(trip.estimated_budget / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
              <div className="meta-badge">
                <div className="meta-icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div className="meta-text">
                  <span className="badge-label">Best Time</span>
                  <span className="badge-value">{trip.best_time_to_visit}</span>
                </div>
              </div>
            </div>

            {/* Theme Tags */}
            <div className="trip-themes">
              {(trip.themes || trip.theme || []).map((theme, idx) => (
                <span key={idx} className="theme-badge">
                  {theme}
                </span>
              ))}
            </div>
          </div>

          {/* Day Tabs Navigation */}
          <div className="trip-days-tabs">
            {(tripData.day_wise_plan || []).map((day) => (
              <button
                key={day.day_number}
                className={`day-tab ${
                  selectedDay === day.day_number ? "active" : ""
                }`}
                onClick={() => setSelectedDay(day.day_number)}
              >
                Day {day.day_number}
              </button>
            ))}
          </div>

          {/* Selected Day Content */}
          {currentDayData && (
            <div className="day-content-panel">
              {/* City Header with Image */}
              {cityName && (
                <div className="day-city-header">
                  <div className="city-name-badge">
                    <span className="city-icon">📍</span>
                    <span className="city-name-text">{cityName}</span>
                  </div>
                  <div className="day-badges">
                    {currentDayData.conveyance_details?.is_required && (
                      <span className="day-badge transfer-badge">
                        🚗 Transfer
                      </span>
                    )}
                    {currentDayData.stay_details?.is_required &&
                      currentDayData.stay_details.city && (
                        <span className="day-badge stay-badge">🏨 Stay</span>
                      )}
                  </div>
                </div>
              )}

              {/* City Image Banner */}
              {cityImage && (
                <div className="day-city-banner">
                  <img
                    src={cityImage}
                    alt={cityName || "City"}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop&auto=format&q=80";
                    }}
                  />
                  <div className="city-banner-overlay" />
                </div>
              )}

              {/* Activities Timeline */}
              <div className="day-activities-section">
                <h3 className="activities-title">Activities</h3>
                <div className="day-activities-timeline">
                  {currentDayData.must_do_activities.map((activity, idx) => (
                    <div key={idx} className="activity-timeline-item">
                      {/* Timeline Connector */}
                      <div className="timeline-connector">
                        <div className="timeline-dot"></div>
                        {idx < currentDayData.must_do_activities.length - 1 && (
                          <div className="timeline-line"></div>
                        )}
                      </div>

                      {/* Activity Card */}
                      <div className="activity-content-card">
                        <div className="activity-card-header">
                          <div className="activity-type-badge">
                            {activity.type === "place"
                              ? "📍"
                              : activity.type === "food"
                              ? "🍽️"
                              : activity.type === "activity"
                              ? "🎯"
                              : activity.type === "wellness"
                              ? "🧘"
                              : activity.type === "transport"
                              ? "🚗"
                              : activity.type === "shopping"
                              ? "🛍️"
                              : "✨"}
                          </div>
                          <button
                            className="activity-remove-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveActivity(
                                currentDayData.day_number,
                                idx
                              );
                            }}
                            aria-label="Remove activity"
                            title={`Remove ${activity.name}`}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                        </div>
                        <h4 className="activity-name">{activity.name}</h4>
                        <p className="activity-description">
                          {activity.description}
                        </p>
                        {activity.category && (
                          <span className="activity-category-tag">
                            {activity.category}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Search Panel - Always visible */}
        <div className="trip-expanded-search">
          <div className="search-header">
            <h3>Search Activities</h3>
          </div>
          <div className="search-day-indicator">
            Adding to <strong>Day {selectedDay}</strong>
          </div>
          <div className="search-input-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search for places, restaurants, activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && <div className="search-loading">Searching...</div>}
          </div>

          {/* Search Results */}
          <div className="search-results-container">
            {searchResults.length > 0 ? (
              <div className="search-results">
                {searchResults.map((result) => (
                  <div
                    key={result.place_id}
                    className="search-result-item"
                    onClick={() =>
                      handleAddActivity(result.place_id, result.description)
                    }
                  >
                    <div className="result-icon">📍</div>
                    <div className="result-content">
                      <div className="result-title">
                        {result.structured_formatting?.main_text ||
                          result.description}
                      </div>
                      {result.structured_formatting?.secondary_text && (
                        <div className="result-subtitle">
                          {result.structured_formatting.secondary_text}
                        </div>
                      )}
                    </div>
                    <button
                      className="result-add-btn"
                      aria-label="Add activity"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim() && !isSearching ? (
              <div className="search-empty">
                <p>No results found for "{searchQuery}"</p>
                <p className="search-empty-hint">Try a different search term</p>
              </div>
            ) : !searchQuery.trim() ? (
              <div className="search-empty">
                <p>🔍 Start typing to search</p>
                <p className="search-empty-hint">
                  Search for places, restaurants, museums, parks, and more...
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="trip-loading-overlay">
            <div className="loader-container">
              <div className="loader-spinner"></div>
              <p className="loader-text">Loading trip details...</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .trip-expanded-view {
          position: fixed;
          top: 73px;
          left: ${isSidebarCollapsed ? "0" : "208px"};
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: stretch;
          justify-content: stretch;
          overflow: hidden;
          transition: left 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          will-change: opacity, transform;
          transform: translateZ(0);
        }

        .trip-expanded-view.animating-in {
          opacity: 0;
          transform: translateZ(0) scale(0.98) translateY(10px);
        }

        .trip-expanded-view:not(.animating-in):not(.closing) {
          animation: modalFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .trip-expanded-view.closing {
          animation: modalFadeOut 0.35s cubic-bezier(0.4, 0, 0.6, 1) forwards;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translateZ(0) scale(0.98) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateZ(0) scale(1) translateY(0);
          }
        }

        @keyframes modalFadeOut {
          from {
            opacity: 1;
            transform: translateZ(0) scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateZ(0) scale(0.98) translateY(10px);
          }
        }

        .trip-expanded-backdrop {
          position: absolute;
          inset: 0;
          background: radial-gradient(
              circle at 20% 30%,
              rgba(147, 197, 253, 0.15) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 80% 70%,
              rgba(191, 219, 254, 0.12) 0%,
              transparent 50%
            ),
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.6) 0%,
              rgba(240, 249, 255, 0.7) 25%,
              rgba(224, 242, 254, 0.65) 50%,
              rgba(240, 249, 255, 0.7) 75%,
              rgba(255, 255, 255, 0.6) 100%
            );
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          will-change: transform;
          transform: translateZ(0);
        }

        .trip-expanded-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: 280px 1fr 320px;
          gap: 0;
          background: radial-gradient(
              circle at 10% 20%,
              rgba(147, 197, 253, 0.08) 0%,
              transparent 40%
            ),
            radial-gradient(
              circle at 90% 80%,
              rgba(191, 219, 254, 0.06) 0%,
              transparent 40%
            ),
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.45) 0%,
              rgba(240, 249, 255, 0.35) 50%,
              rgba(224, 242, 254, 0.3) 100%
            );
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border: 2px solid rgba(59, 130, 246, 0.15);
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(59, 130, 246, 0.12),
            0 0 0 1px rgba(255, 255, 255, 0.5) inset;
          will-change: transform, opacity;
          transform: translateZ(0);
          transition: opacity 0.2s ease-out;
        }

        .trip-expanded-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid rgba(59, 130, 246, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
            border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10;
          will-change: transform;
          transform: translateZ(0);
        }

        .trip-expanded-close:hover {
          border-color: rgba(59, 130, 246, 0.5);
          transform: translateZ(0) scale(1.08);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
        }

        .trip-expanded-close:active {
          transform: translateZ(0) scale(1.02);
        }

        .trip-expanded-close svg {
          color: #3b82f6;
        }

        /* Left Side - Map */
        .trip-expanded-map {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.4) 0%,
            rgba(240, 249, 255, 0.3) 100%
          );
          border-right: 2px solid rgba(59, 130, 246, 0.15);
          display: flex;
          align-items: stretch;
          justify-content: stretch;
          padding: 16px;
          overflow: hidden;
        }

        .map-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.08) 0%,
            rgba(147, 197, 253, 0.12) 100%
          );
          border: 2px dashed rgba(59, 130, 246, 0.3);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 700;
          color: #3b82f6;
          letter-spacing: 0.05em;
          box-shadow: inset 0 2px 8px rgba(59, 130, 246, 0.1);
        }

        /* Center - Main Content */
        .trip-expanded-main {
          background: radial-gradient(
              circle at 50% 0%,
              rgba(147, 197, 253, 0.05) 0%,
              transparent 50%
            ),
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.25) 0%,
              rgba(240, 249, 255, 0.2) 50%,
              rgba(255, 255, 255, 0.15) 100%
            );
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          min-height: 0;
          height: 100%;
          -webkit-overflow-scrolling: touch;
          will-change: scroll-position;
          transform: translateZ(0);
        }

        /* Custom Scrollbar */
        .trip-expanded-main::-webkit-scrollbar {
          width: 8px;
        }

        .trip-expanded-main::-webkit-scrollbar-track {
          background: rgba(59, 130, 246, 0.05);
          border-radius: 4px;
        }

        .trip-expanded-main::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 4px;
        }

        .trip-expanded-main::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }

        /* Header */
        .trip-expanded-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 18px 24px;
          background: radial-gradient(
              circle at 20% 30%,
              rgba(147, 197, 253, 0.2) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 80% 70%,
              rgba(191, 219, 254, 0.15) 0%,
              transparent 50%
            ),
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.35) 0%,
              rgba(240, 249, 255, 0.3) 50%,
              rgba(224, 242, 254, 0.25) 100%
            );
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 16px;
          backdrop-filter: blur(10px) saturate(140%);
          -webkit-backdrop-filter: blur(10px) saturate(140%);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.5),
            0 1px 2px rgba(0, 0, 0, 0.03);
          position: relative;
          overflow: visible;
          width: 100%;
        }

        .trip-expanded-header::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(147, 197, 253, 0.5),
            transparent
          );
        }

        .trip-title-container {
          width: 100%;
          text-align: center;
          padding: 12px 24px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.4) 0%,
            rgba(240, 249, 255, 0.35) 100%
          );
          border: 1px solid rgba(59, 130, 246, 0.25);
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(10px);
        }

        .trip-title {
          font-size: 20px;
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
          letter-spacing: -0.02em;
        }

        .trip-meta-badges {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .meta-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.3) 0%,
            rgba(240, 249, 255, 0.25) 100%
          );
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 10px;
          min-width: 110px;
          backdrop-filter: blur(8px) saturate(130%);
          -webkit-backdrop-filter: blur(8px) saturate(130%);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .meta-badge:hover {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.4) 0%,
            rgba(240, 249, 255, 0.3) 100%
          );
          border-color: rgba(59, 130, 246, 0.35);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
          transform: translateY(-1px);
        }

        .meta-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.12) 0%,
            rgba(147, 197, 253, 0.15) 100%
          );
          border: 1px solid rgba(59, 130, 246, 0.2);
          backdrop-filter: blur(6px);
        }

        .meta-icon svg {
          color: #3b82f6;
          opacity: 0.85;
          width: 14px;
          height: 14px;
        }

        .meta-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .badge-label {
          font-size: 9px;
          font-weight: 600;
          color: rgba(59, 130, 246, 0.75);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .badge-value {
          font-size: 13px;
          font-weight: 700;
          color: #1e40af;
        }

        .trip-themes {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .theme-badge {
          padding: 6px 12px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.3) 0%,
            rgba(240, 249, 255, 0.25) 100%
          );
          border: 1px solid rgba(59, 130, 246, 0.25);
          border-radius: 14px;
          font-size: 11px;
          font-weight: 600;
          color: #1e40af;
          letter-spacing: 0.01em;
          backdrop-filter: blur(6px) saturate(130%);
          -webkit-backdrop-filter: blur(6px) saturate(130%);
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .theme-badge:hover {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.4) 0%,
            rgba(240, 249, 255, 0.35) 100%
          );
          border-color: rgba(59, 130, 246, 0.35);
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        /* Day Tabs Navigation */
        .trip-days-tabs {
          display: flex;
          gap: 10px;
          padding: 0 4px 18px 4px;
          margin: 0 -4px;
          border-bottom: 2px solid rgba(59, 130, 246, 0.15);
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(59, 130, 246, 0.3) transparent;
          -webkit-overflow-scrolling: touch;
          width: 100%;
          min-height: 62px;
        }

        .trip-days-tabs::-webkit-scrollbar {
          height: 6px;
        }

        .trip-days-tabs::-webkit-scrollbar-track {
          background: rgba(59, 130, 246, 0.05);
          border-radius: 3px;
        }

        .trip-days-tabs::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 3px;
        }

        .trip-days-tabs::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }

        .day-tab {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 24px;
          border-radius: 10px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.4) 0%,
            rgba(240, 249, 255, 0.35) 100%
          );
          border: 1px solid rgba(59, 130, 246, 0.25);
          font-size: 14px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          backdrop-filter: blur(8px) saturate(140%);
          -webkit-backdrop-filter: blur(8px) saturate(140%);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
          min-height: 44px;
          text-align: center;
          will-change: transform, box-shadow;
          transform: translateZ(0);
        }

        .day-tab:hover {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.6) 0%,
            rgba(240, 249, 255, 0.5) 100%
          );
          border-color: rgba(59, 130, 246, 0.4);
          color: #1e40af;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }

        .day-tab.active {
          background: radial-gradient(
              circle at top,
              rgba(147, 197, 253, 0.3) 0%,
              transparent 70%
            ),
            linear-gradient(
              135deg,
              rgba(59, 130, 246, 0.25) 0%,
              rgba(147, 197, 253, 0.3) 100%
            );
          border: 1.5px solid rgba(59, 130, 246, 0.5);
          color: #1e40af;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.6),
            0 0 0 3px rgba(59, 130, 246, 0.1);
          font-weight: 800;
        }

        /* Day Content Panel */
        .day-content-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Day City Header */
        .day-city-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.6) 0%,
            rgba(240, 249, 255, 0.5) 100%
          );
          border: 2px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          backdrop-filter: blur(6px);
          will-change: transform;
          transform: translateZ(0);
        }

        .city-name-badge {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .city-icon {
          font-size: 20px;
        }

        .city-name-text {
          font-size: 18px;
          font-weight: 700;
          color: #1e40af;
        }

        .day-badges {
          display: flex;
          gap: 8px;
        }

        .day-badge {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .transfer-badge {
          background: rgba(59, 130, 246, 0.15);
          color: #1e40af;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .stay-badge {
          background: rgba(34, 197, 94, 0.15);
          color: #047857;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        /* Day City Banner */
        .day-city-banner {
          position: relative;
          width: 100%;
          height: 220px;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid rgba(59, 130, 246, 0.2);
        }

        .day-city-banner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .city-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.4) 100%
          );
        }

        /* Day Activities Section */
        .day-activities-section {
          padding: 20px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.5) 0%,
            rgba(240, 249, 255, 0.4) 100%
          );
          border: 2px solid rgba(59, 130, 246, 0.15);
          border-radius: 12px;
          backdrop-filter: blur(6px);
          will-change: transform;
          transform: translateZ(0);
        }

        .activities-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e40af;
          margin: 0 0 20px 0;
        }

        .day-activities-timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
          padding-left: 8px;
        }

        .activity-timeline-item {
          display: flex;
          gap: 16px;
          position: relative;
        }

        .timeline-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 8px;
          flex-shrink: 0;
        }

        .timeline-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border: 3px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2),
            0 2px 8px rgba(59, 130, 246, 0.3);
          z-index: 2;
          flex-shrink: 0;
        }

        .timeline-line {
          width: 2px;
          flex: 1;
          background: linear-gradient(
            180deg,
            rgba(59, 130, 246, 0.4) 0%,
            rgba(59, 130, 246, 0.15) 100%
          );
          margin-top: 4px;
          min-height: 40px;
        }

        .activity-content-card {
          flex: 1;
          padding: 16px 18px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.7) 0%,
            rgba(255, 255, 255, 0.5) 100%
          );
          border: 2px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          margin-bottom: 16px;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
            border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          will-change: transform;
          transform: translateZ(0);
        }

        .activity-content-card:hover {
          border-color: rgba(59, 130, 246, 0.35);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
          transform: translateZ(0) translateX(4px);
        }

        .activity-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .activity-type-badge {
          font-size: 20px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 10px;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .activity-remove-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.08);
          border: 1.5px solid rgba(239, 68, 68, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          opacity: 0.7;
        }

        .activity-remove-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.4);
          opacity: 1;
          transform: scale(1.05);
        }

        .activity-remove-btn svg {
          color: #dc2626;
        }

        .activity-name {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px 0;
          line-height: 1.4;
        }

        .activity-description {
          font-size: 13px;
          color: #475569;
          margin: 0 0 10px 0;
          line-height: 1.6;
        }

        .activity-category-tag {
          display: inline-block;
          padding: 4px 10px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #1e40af;
          text-transform: capitalize;
          letter-spacing: 0.02em;
        }

        /* Right Side - Search Panel */
        .trip-expanded-search {
          background: rgba(255, 255, 255, 0.35);
          border-left: 2px solid rgba(59, 130, 246, 0.2);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .search-header {
          display: flex;
          justify-content: center;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 2px solid rgba(59, 130, 246, 0.2);
        }

        .search-header h3 {
          font-size: 17px;
          font-weight: 700;
          color: #1e40af;
          margin: 0;
        }

        .search-input-container {
          margin-top: 8px;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid rgba(59, 130, 246, 0.2);
          border-radius: 10px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-input::placeholder {
          color: #94a3b8;
        }

        .search-day-indicator {
          padding: 10px 14px;
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.15) 0%,
            rgba(147, 197, 253, 0.2) 100%
          );
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          font-size: 13px;
          color: #1e40af;
          text-align: center;
        }

        .search-day-indicator strong {
          font-weight: 700;
        }

        .search-loading {
          margin-top: 8px;
          font-size: 13px;
          color: #64748b;
          text-align: center;
        }

        .search-results-container {
          flex: 1;
          overflow-y: auto;
          min-height: 200px;
        }

        .search-results-container::-webkit-scrollbar {
          width: 6px;
        }

        .search-results-container::-webkit-scrollbar-track {
          background: rgba(59, 130, 246, 0.05);
          border-radius: 3px;
        }

        .search-results-container::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 3px;
        }

        .search-results {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid rgba(59, 130, 246, 0.15);
          border-radius: 10px;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
            border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
          transform: translateZ(0);
        }

        .search-result-item:hover {
          border-color: rgba(59, 130, 246, 0.35);
          transform: translateZ(0) translateX(4px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .result-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .result-content {
          flex: 1;
          min-width: 0;
        }

        .result-title {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .result-subtitle {
          font-size: 12px;
          color: #64748b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .result-add-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(34, 197, 94, 0.15);
          border: 1.5px solid rgba(34, 197, 94, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .result-add-btn:hover {
          background: rgba(34, 197, 94, 0.25);
          border-color: rgba(34, 197, 94, 0.5);
          transform: scale(1.08);
        }

        .result-add-btn svg {
          color: #059669;
        }

        .search-empty {
          padding: 40px 20px;
          text-align: center;
        }

        .search-empty p {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 8px 0;
        }

        .search-empty-hint {
          font-size: 12px;
          color: #94a3b8;
        }

        /* Loading Overlay */
        .trip-loading-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.98) 0%,
            rgba(240, 249, 255, 0.98) 100%
          );
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: loaderFadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: opacity;
        }

        @keyframes loaderFadeIn {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
        }

        .loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          animation: loaderContentFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s
            both;
        }

        @keyframes loaderContentFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .loader-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(59, 130, 246, 0.15);
          border-top-color: #3b82f6;
          border-right-color: #60a5fa;
          border-radius: 50%;
          animation: spin 0.7s cubic-bezier(0.4, 0.15, 0.6, 0.85) infinite;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .loader-text {
          font-size: 14px;
          font-weight: 600;
          color: #1e40af;
          margin: 0;
          letter-spacing: 0.02em;
          animation: pulse 1.5s ease-in-out infinite;
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

        /* Responsive Design */
        @media (max-width: 1200px) {
          .trip-expanded-container {
            grid-template-columns: 200px 1fr 200px;
          }

          .day-content {
            grid-template-columns: 200px 1fr;
          }
        }

        @media (max-width: 768px) {
          .trip-expanded-view {
            left: 0;
          }

          .trip-expanded-container {
            grid-template-columns: 1fr;
          }

          .trip-expanded-map,
          .trip-expanded-search {
            display: none;
          }

          .day-content {
            grid-template-columns: 1fr;
          }

          .day-city-image {
            height: 150px;
          }
        }
      `}</style>
    </div>
  );

  // Use portal to render at body level, but style it to fit within chat container
  return typeof window !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}
