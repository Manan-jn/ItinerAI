"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { TripInfo, DayPlan } from "./types";
import { TripMap } from "./TripMap";

interface TripExpandedViewProps {
  trip: TripInfo;
  onClose: () => void;
  onTripUpdate?: (updatedTrip: TripInfo) => void;
}

export function TripExpandedView({ trip, onClose, onTripUpdate }: TripExpandedViewProps) {
  // Make trip data mutable with state
  const [tripData, setTripData] = useState<TripInfo>(trip);
  const [searchQuery, setSearchQuery] = useState("");
  // Initialize with all days expanded
  const [expandedDays, setExpandedDays] = useState<Set<number>>(() => {
    const allDays = new Set<number>();
    trip.day_wise_plan?.forEach(day => allDays.add(day.day_number));
    return allDays;
  });
  const [mounted, setMounted] = useState(false);
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [selectedDayForActivity, setSelectedDayForActivity] = useState<number | null>(null);
  const [isAnimatingIn, setIsAnimatingIn] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Ref to track if this is the initial mount
  const isInitialMount = useRef(true);

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Trigger animation
    setTimeout(() => setIsAnimatingIn(false), 50);
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const toggleDay = (dayNumber: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayNumber)) {
      newExpanded.delete(dayNumber);
    } else {
      newExpanded.add(dayNumber);
    }
    setExpandedDays(newExpanded);
  };

  // Get city for a specific day - with fallback logic
  const getCityForDay = (day: DayPlan, dayIndex: number) => {
    // Priority 1: Check conveyance to_city (where they're going)
    if (day.conveyance_details?.to_city && day.conveyance_details.to_city !== 'user_location') {
      return day.conveyance_details.to_city;
    }
    
    // Priority 2: Check conveyance from_city (for last day or when to_city is user_location)
    if (day.conveyance_details?.from_city && day.conveyance_details.from_city !== 'user_location') {
      return day.conveyance_details.from_city;
    }
    
    // Priority 3: Check stay_details
    if (day.stay_details?.city) {
      return day.stay_details.city;
    }
    
    // Priority 4: If no conveyance required (staying in same city), look at previous days
    if (day.conveyance_details?.is_required === false && dayIndex > 0 && trip.day_wise_plan) {
      // Recursively look back through previous days to find the city
      for (let i = dayIndex - 1; i >= 0; i--) {
        const prevDay = trip.day_wise_plan[i];
        
        // Check if previous day has to_city
        if (prevDay.conveyance_details?.to_city && prevDay.conveyance_details.to_city !== 'user_location') {
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
      console.log('getCityImage: No city name or trip_route', { cityName, hasTripRoute: !!trip.trip_route });
      return null;
    }
    
    // Case-insensitive and partial matching for city names
    const normalizedCityName = cityName.toLowerCase().trim();
    const cityData = trip.trip_route.find(
      (route) => {
        const routeName = route.place_name.toLowerCase().trim();
        // Try exact match first, then check if city name is contained in route name or vice versa
        return routeName === normalizedCityName || 
               routeName.includes(normalizedCityName) || 
               normalizedCityName.includes(routeName);
      }
    );
    
    if (!cityData) {
      console.log('getCityImage: City not found in trip_route', { 
        cityName, 
        availableCities: trip.trip_route.map(r => r.place_name) 
      });
      return null;
    }
    
    const photoUrl = cityData?.photos?.[0];
    if (!photoUrl) {
      console.log('getCityImage: No photos for city', { cityName, cityData: cityData.place_name });
      return null;
    }
    
    console.log('getCityImage: Found photo for city', { cityName, photoUrl: photoUrl.substring(0, 80) + '...' });
    
    // Convert Google Places photo URL to proxy URL
    if (photoUrl.includes("maps.googleapis.com/maps/api/place/photo")) {
      try {
        const urlObj = new URL(photoUrl);
        const photoReference = urlObj.searchParams.get("photoreference");
        if (photoReference) {
          const proxyUrl = `/api/place-photo?photoreference=${photoReference}&maxwidth=600&maxheight=400`;
          console.log('getCityImage: Converted to proxy URL', { originalLength: photoUrl.length, proxyUrl });
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
    if (!searchQuery.trim() || !searchPanelOpen) {
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
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(searchTimer);
  }, [searchQuery, searchPanelOpen]);

  // Add activity to a specific day
  const handleAddActivity = async (placeId: string, placeName: string) => {
    if (selectedDayForActivity === null) {
      console.error('No day selected for activity');
      return;
    }

    try {
      // Fetch place details from Google Places API
      const response = await fetch(
        `/api/place-details?place_id=${encodeURIComponent(placeId)}`
      );
      const activityData = await response.json();

      if (activityData.error) {
        console.error('Error fetching place details:', activityData.error);
        return;
      }

      // Update trip data with new activity
      setTripData((prevTrip) => {
        const newTrip = { ...prevTrip };
        if (newTrip.day_wise_plan) {
          const dayIndex = newTrip.day_wise_plan.findIndex(
            (d) => d.day_number === selectedDayForActivity
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

      console.log(`✅ Added activity "${placeName}" to Day ${selectedDayForActivity}`);

      // Clear search and close panel
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding activity:', error);
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

    console.log(`🗑️ Removed activity from Day ${dayNumber}`);
  };

  if (!mounted) return null;

  const modalContent = (
    <div className={`trip-expanded-view ${isAnimatingIn ? 'animating-in' : ''} ${isClosing ? 'closing' : ''}`}>
      {/* Blurred Background Overlay */}
      <div className="trip-expanded-backdrop" onClick={handleClose} />

      {/* Main Content Container */}
      <div className="trip-expanded-container">
        {/* Close Button */}
        <button className="trip-expanded-close" onClick={handleClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Left Side: Map */}
        <div className="trip-expanded-map">
          {trip.trip_route && trip.trip_route.length > 0 ? (
            <TripMap places={trip.trip_route} />
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
                <span className="badge-label">Days</span>
                <span className="badge-value">{trip.no_of_days}</span>
              </div>
              <div className="meta-badge">
                <span className="badge-label">Budget</span>
                <span className="badge-value">₹{(trip.estimated_budget / 1000).toFixed(0)}k</span>
              </div>
              <div className="meta-badge">
                <span className="badge-label">Best Time</span>
                <span className="badge-value">{trip.best_time_to_visit}</span>
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

          {/* Day-wise Plan */}
          <div className="trip-days-container">
            {(tripData.day_wise_plan || []).map((day, dayIndex) => {
              const cityName = getCityForDay(day, dayIndex);
              const cityImage = getCityImage(cityName);
              const isExpanded = expandedDays.has(day.day_number);

              return (
                <div 
                  key={day.day_number} 
                  className={`day-card ${isExpanded ? 'expanded' : 'collapsed'}`}
                  style={{ animationDelay: `${dayIndex * 0.05}s` }}
                >
                  {/* Day Header */}
                  <div className="day-header">
                    <div className="day-left" onClick={() => toggleDay(day.day_number)}>
                      <button className="day-toggle-btn" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          {isExpanded ? (
                            <line x1="5" y1="12" x2="19" y2="12" />
                          ) : (
                            <>
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </>
                          )}
                        </svg>
                      </button>
                      <h3 className="day-title">DAY {day.day_number}</h3>
                      {cityName && <span className="day-city-name">• {cityName}</span>}
                    </div>
                    
                    <div className="day-right">
                      {day.conveyance_details?.is_required && (
                        <span className="day-badge transfer-badge">Transfer</span>
                      )}
                      {day.stay_details?.is_required && day.stay_details.city && (
                        <span className="day-badge stay-badge">Stay</span>
                      )}
                      <button
                        className={`day-add-btn ${searchPanelOpen && selectedDayForActivity === day.day_number ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (searchPanelOpen && selectedDayForActivity === day.day_number) {
                            // Close if clicking the same day
                            setSearchPanelOpen(false);
                            setSelectedDayForActivity(null);
                            setSearchQuery('');
                          } else {
                            // Open for this day
                            setSearchPanelOpen(true);
                            setSelectedDayForActivity(day.day_number);
                            setSearchQuery('');
                          }
                        }}
                        aria-label={searchPanelOpen && selectedDayForActivity === day.day_number ? "Close search panel" : "Open search panel"}
                        title={searchPanelOpen && selectedDayForActivity === day.day_number ? "Close search panel" : `Add activity to Day ${day.day_number}`}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          {searchPanelOpen ? (
                            <line x1="5" y1="12" x2="19" y2="12" />
                          ) : (
                            <>
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Day Content - Only show when expanded */}
                  {isExpanded && (
                    <div className="day-content">
                      {/* City Image on Left */}
                      {cityImage && (
                        <div className="day-city-image">
                          <img 
                            src={cityImage} 
                            alt={cityName || 'City'}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop&auto=format&q=80';
                            }}
                          />
                          <div className="city-image-overlay">
                            <span className="city-name">{cityName}</span>
                          </div>
                        </div>
                      )}

                      {/* Activities on Right - Timeline Design */}
                      <div className="day-activities">
                        {day.must_do_activities.map((activity, idx) => (
                          <div key={idx} className="activity-timeline-item">
                            {/* Timeline Dot and Line */}
                            <div className="timeline-connector">
                              <div className="timeline-dot"></div>
                              {idx < day.must_do_activities.length - 1 && (
                                <div className="timeline-line"></div>
                              )}
                            </div>
                            
                            {/* Activity Content Card */}
                            <div className="activity-content-card">
                              <div className="activity-card-header">
                                <div className="activity-type-badge">
                                  {activity.type === 'place' ? '📍' : 
                                   activity.type === 'food' ? '🍽️' : 
                                   activity.type === 'activity' ? '🎯' : 
                                   activity.type === 'wellness' ? '🧘' :
                                   activity.type === 'transport' ? '🚗' :
                                   activity.type === 'shopping' ? '🛍️' : '✨'}
                                </div>
                                <button
                                  className="activity-remove-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveActivity(day.day_number, idx);
                                  }}
                                  aria-label="Remove activity"
                                  title={`Remove ${activity.name}`}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                  </svg>
                                </button>
                              </div>
                              <h4 className="activity-name">{activity.name}</h4>
                              <p className="activity-description">{activity.description}</p>
                              {activity.category && (
                                <span className="activity-category-tag">{activity.category}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Search Panel - Conditionally rendered */}
        {searchPanelOpen && (
          <div className="trip-expanded-search">
            <div className="search-header">
              <h3>Search Activities</h3>
              <button
                className="search-close-btn"
                onClick={() => {
                  setSearchPanelOpen(false);
                  setSelectedDayForActivity(null);
                  setSearchQuery('');
                }}
                aria-label="Close search"
                title="Close search panel"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {selectedDayForActivity && (
              <div className="search-day-indicator">
                Adding to <strong>Day {selectedDayForActivity}</strong>
              </div>
            )}
            <div className="search-input-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search for places, restaurants, activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {isSearching && (
                <div className="search-loading">Searching...</div>
              )}
            </div>

            {/* Search Results */}
            <div className="search-results-container">
              {searchResults.length > 0 ? (
                <div className="search-results">
                  {searchResults.map((result) => (
                    <div
                      key={result.place_id}
                      className="search-result-item"
                      onClick={() => handleAddActivity(result.place_id, result.description)}
                    >
                      <div className="result-icon">📍</div>
                      <div className="result-content">
                        <div className="result-title">{result.structured_formatting?.main_text || result.description}</div>
                        {result.structured_formatting?.secondary_text && (
                          <div className="result-subtitle">{result.structured_formatting.secondary_text}</div>
                        )}
                      </div>
                      <button className="result-add-btn" aria-label="Add activity">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                  <p className="search-empty-hint">Search for places, restaurants, museums, parks, and more...</p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .trip-expanded-view {
          position: fixed;
          top: 73px;
          left: 208px;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: stretch;
          justify-content: stretch;
          overflow: hidden;
          animation: modalFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .trip-expanded-view.animating-in {
          opacity: 0;
        }

        .trip-expanded-view.closing {
          animation: modalFadeOut 0.3s cubic-bezier(0.4, 0, 1, 1) forwards;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes modalFadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.96);
          }
        }

        .trip-expanded-backdrop {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 20% 30%, rgba(147, 197, 253, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(191, 219, 254, 0.12) 0%, transparent 50%),
            linear-gradient(135deg, 
              rgba(255, 255, 255, 0.6) 0%, 
              rgba(240, 249, 255, 0.7) 25%,
              rgba(224, 242, 254, 0.65) 50%,
              rgba(240, 249, 255, 0.7) 75%,
              rgba(255, 255, 255, 0.6) 100%
            );
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
        }

        .trip-expanded-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: 280px 1fr ${searchPanelOpen ? '320px' : '0px'};
          gap: 0;
          background: 
            radial-gradient(circle at 10% 20%, rgba(147, 197, 253, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(191, 219, 254, 0.06) 0%, transparent 40%),
            linear-gradient(135deg, 
              rgba(255, 255, 255, 0.45) 0%, 
              rgba(240, 249, 255, 0.35) 50%,
              rgba(224, 242, 254, 0.3) 100%
            );
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 2px solid rgba(59, 130, 246, 0.15);
          overflow: hidden;
          transition: grid-template-columns 0.3s ease;
          box-shadow: 
            0 20px 60px rgba(59, 130, 246, 0.12),
            0 0 0 1px rgba(255, 255, 255, 0.5) inset;
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
          transition: all 0.2s ease;
          z-index: 10;
        }

        .trip-expanded-close:hover {
          background: rgba(255, 255, 255, 1);
          border-color: rgba(59, 130, 246, 0.5);
          transform: scale(1.05);
        }

        .trip-expanded-close svg {
          color: #3b82f6;
        }

        /* Left Side - Map */
        .trip-expanded-map {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(240, 249, 255, 0.3) 100%);
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
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 197, 253, 0.12) 100%);
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
          background: 
            radial-gradient(circle at 50% 0%, rgba(147, 197, 253, 0.05) 0%, transparent 50%),
            linear-gradient(180deg, 
              rgba(255, 255, 255, 0.25) 0%, 
              rgba(240, 249, 255, 0.2) 50%,
              rgba(255, 255, 255, 0.15) 100%
            );
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
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
          gap: 18px;
          padding: 24px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(240, 249, 255, 0.5) 100%);
          border: 2px solid rgba(59, 130, 246, 0.2);
          border-radius: 18px;
          backdrop-filter: blur(16px);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.08);
        }

        .trip-title-container {
          width: 100%;
          text-align: center;
          padding: 16px 28px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(240, 249, 255, 0.6) 100%);
          border: 2px solid rgba(59, 130, 246, 0.25);
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }

        .trip-title {
          font-size: 26px;
          font-weight: 800;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .trip-meta-badges {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .meta-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 24px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(240, 249, 255, 0.6) 100%);
          border: 2px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          min-width: 110px;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.06);
          transition: all 0.2s ease;
        }

        .meta-badge:hover {
          border-color: rgba(59, 130, 246, 0.35);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.12);
          transform: translateY(-2px);
        }

        .badge-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .badge-value {
          font-size: 15px;
          font-weight: 800;
          color: #1e40af;
        }

        .trip-themes {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .theme-badge {
          padding: 8px 16px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 197, 253, 0.2) 100%);
          border: 2px solid rgba(59, 130, 246, 0.3);
          border-radius: 24px;
          font-size: 12px;
          font-weight: 700;
          color: #1e40af;
          letter-spacing: 0.02em;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.1);
          transition: all 0.2s ease;
        }

        .theme-badge:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 197, 253, 0.25) 100%);
          border-color: rgba(59, 130, 246, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.15);
        }

        /* Days Container */
        .trip-days-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .day-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(240, 249, 255, 0.4) 100%);
          border: 2px solid rgba(59, 130, 246, 0.15);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 12px rgba(59, 130, 246, 0.08);
          backdrop-filter: blur(10px);
          animation: slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .day-card.expanded {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(240, 249, 255, 0.55) 100%);
          border-color: rgba(59, 130, 246, 0.25);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.12), 0 0 0 1px rgba(59, 130, 246, 0.05);
        }

        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 26px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(240, 249, 255, 0.5) 100%);
          border-bottom: 1px solid rgba(59, 130, 246, 0.12);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .day-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .day-header:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(240, 249, 255, 0.65) 100%);
        }

        .day-header:hover::before {
          opacity: 1;
        }

        .day-left {
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          flex: 1;
        }

        .day-city-name {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
          margin-left: 4px;
        }

        .day-toggle-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(147, 197, 253, 0.15) 100%);
          border: 2px solid rgba(59, 130, 246, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.1);
        }

        .day-toggle-btn:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 197, 253, 0.25) 100%);
          border-color: rgba(59, 130, 246, 0.4);
          transform: scale(1.05);
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.15);
        }

        .day-toggle-btn svg {
          color: #3b82f6;
          transition: transform 0.3s ease;
        }

        .day-card.expanded .day-toggle-btn svg {
          transform: rotate(0deg);
        }

        .day-card.collapsed .day-toggle-btn svg {
          transform: rotate(45deg);
        }

        .day-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .day-right {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .day-badge {
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          letter-spacing: 0.02em;
        }

        .transfer-badge {
          background: rgba(59, 130, 246, 0.12);
          color: #1e40af;
          border: 1px solid rgba(59, 130, 246, 0.25);
        }

        .stay-badge {
          background: rgba(34, 197, 94, 0.12);
          color: #047857;
          border: 1px solid rgba(34, 197, 94, 0.25);
        }

        .day-add-btn {
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
        }

        .day-add-btn:hover {
          background: rgba(34, 197, 94, 0.25);
          border-color: rgba(34, 197, 94, 0.5);
          transform: scale(1.05);
        }

        .day-add-btn svg {
          color: #059669;
          transition: transform 0.3s ease;
        }

        .day-add-btn.active {
          background: rgba(34, 197, 94, 0.25);
          border-color: rgba(34, 197, 94, 0.5);
        }

        .day-add-btn.active svg {
          color: #059669;
          transform: rotate(45deg);
        }

        .day-content {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 20px;
          padding: 24px;
          animation: expandContent 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: top;
        }

        @keyframes expandContent {
          from {
            opacity: 0;
            transform: scaleY(0.95);
          }
          to {
            opacity: 1;
            transform: scaleY(1);
          }
        }

        .day-city-image {
          position: relative;
          width: 100%;
          height: 200px;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid rgba(59, 130, 246, 0.2);
          background: rgba(59, 130, 246, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .day-city-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .city-image-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 12px;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
        }

        .city-name {
          font-size: 14px;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .day-activities {
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
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0 2px 8px rgba(59, 130, 246, 0.3);
          z-index: 2;
          flex-shrink: 0;
        }

        .timeline-line {
          width: 2px;
          flex: 1;
          background: linear-gradient(180deg, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.15) 100%);
          margin-top: 4px;
          min-height: 40px;
        }

        .activity-content-card {
          flex: 1;
          padding: 16px 18px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%);
          border: 2px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          margin-bottom: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .activity-content-card:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.65) 100%);
          border-color: rgba(59, 130, 246, 0.35);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
          transform: translateX(4px);
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
          animation: slideInRight 0.3s ease;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .search-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(59, 130, 246, 0.15);
        }

        .search-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .search-close-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .search-close-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.3);
          transform: scale(1.05);
        }

        .search-close-btn svg {
          color: #dc2626;
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
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 197, 253, 0.2) 100%);
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
          transition: all 0.2s ease;
        }

        .search-result-item:hover {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(59, 130, 246, 0.35);
          transform: translateX(4px);
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
  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
