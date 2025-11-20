"use client";

import React, { useState } from "react";
import { MdLocationOn } from "react-icons/md";

export interface InTripWidgetProps {
  isVisible: boolean;
  onClose?: () => void;
  tripTitle: string;
  itineraries: any[];
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

export default function InTripWidget({
  isVisible,
  onClose,
  tripTitle,
  itineraries,
}: InTripWidgetProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [isTestPanelOpen, setIsTestPanelOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  if (!isVisible) return null;

  const handleTestClick = () => {
    setIsTestPanelOpen(!isTestPanelOpen);
  };

  const handleClosePanel = () => {
    setIsTestPanelOpen(false);
  };

  const currentDayItinerary = itineraries[selectedDay] || {};

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
      <div className="intrip-widget-container">
        <div className="centered-wrapper">
          {/* Header Section */}
          <div className="intrip-header">
            <div className="header-content">
              <h2 className="header-title">🗺️ {tripTitle}</h2>
            </div>
            <div className="header-actions">
              <button
                onClick={handleTestClick}
                className="test-button"
                aria-label={isTestPanelOpen ? "Run test" : "Open test panel"}
              >
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
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                <span>{isTestPanelOpen ? "Run" : "Test"}</span>
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
                {itineraries.map((day, index) => (
                  <button
                    key={index}
                    className={`day-tab ${
                      selectedDay === index ? "active" : ""
                    }`}
                    onClick={() => setSelectedDay(index)}
                  >
                    Day {index + 1}
                  </button>
                ))}
              </div>

              {/* Day Content */}
              <div className="day-content">
                <div className="day-header">
                  <div className="day-header-left">
                    <div className="day-date-badge">
                      📅 {currentDayItinerary.date || `Day ${selectedDay + 1}`}
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
                  <span className="code-panel-title">Itinerary JSON</span>
                  <span className="code-panel-badge">
                    {itineraries.length}{" "}
                    {itineraries.length === 1 ? "Day" : "Days"}
                  </span>
                </div>
                <div className="code-editor">
                  <pre className="code-content">
                    <code>{JSON.stringify(itineraries, null, 2)}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Bar */}
          {onClose && (
            <div className="action-bar">
              <button onClick={onClose} className="finish-button">
                <span>Continue to Dashboard</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          )}
        </div>
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

        .code-editor {
          flex: 1;
          overflow: auto;
          background: #1e293b;
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

        .action-bar {
          display: flex;
          justify-content: center;
          padding: 0;
        }

        .finish-button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 40px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(255, 255, 255, 0.8) 100%
          );
          backdrop-filter: blur(20px) saturate(180%);
          border-radius: 16px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
          font-size: 1.0625rem;
          font-weight: 600;
          color: #1e40af;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .finish-button:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(59, 130, 246, 0.35);
        }

        .finish-button svg {
          transition: transform 0.3s ease;
        }

        .finish-button:hover svg {
          transform: translateX(4px);
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
