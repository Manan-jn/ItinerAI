"use client";

import React, { useMemo, useState, useEffect } from "react";
import BookingConfirmationModal from "./BookingConfirmationModal";
import BudgetPanel from "./BudgetPanel";

export interface BookingWidgetProps {
  isVisible: boolean;
  onToggle: () => void;
  itinerariesData: any[];
  tripTitle: string;
  totalDays: number;
  onContinue?: () => void;
  userId?: string;
  sessionId?: string;
}

type ActivityType =
  | "travel"
  | "visit"
  | "eat"
  | "rest"
  | "shopping"
  | "event"
  | "adventure"
  | "leisure"
  | "free_time"
  | "other";

interface TravelActivity {
  dayNumber: number;
  startTime: string;
  endTime: string;
  description: string;
  conveyanceType?: string;
  fromLocation?: string;
  toLocation?: string;
  fare?: number;
}

const categoryIcons: Record<ActivityType, string> = {
  travel: "✈️",
  eat: "🍽️",
  visit: "🏛️",
  rest: "🏨",
  shopping: "🛍️",
  event: "🎭",
  adventure: "🏔️",
  leisure: "🎨",
  free_time: "⏰",
  other: "📝",
};

const categoryLabels: Record<ActivityType, string> = {
  travel: "Travel",
  eat: "Eat",
  visit: "Visit",
  rest: "Stay",
  shopping: "Shopping",
  event: "Event",
  adventure: "Adventure",
  leisure: "Leisure",
  free_time: "Free Time",
  other: "Other",
};

export default function BookingWidget({
  isVisible,
  onToggle,
  itinerariesData,
  tripTitle,
  totalDays,
  onContinue,
  userId,
  sessionId,
}: BookingWidgetProps) {
  // Track booked activities
  const [bookedActivities, setBookedActivities] = useState<Set<number>>(
    new Set()
  );
  const [showModal, setShowModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<{
    index: number;
    title: string;
    fare?: number;
  } | null>(null);
  const [isBookingAll, setIsBookingAll] = useState(false);
  const [userBudget, setUserBudget] = useState<number | null>(null);
  const [staysPricing, setStaysPricing] = useState<number>(0);

  // Fetch user budget from memory AND stays pricing from sessionStorage
  useEffect(() => {

    const fetchUserBudget = async () => {
      if (!userId || !sessionId) {
        console.warn(
          "⚠️ Cannot fetch user budget: userId or sessionId missing",
          { userId, sessionId }
        );
        return;
      }


      try {
        const response = await fetch("/api/memory/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            session_id: sessionId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("💰 User budget API response:", data);
          if (data.user_profile && data.user_profile.budget) {
            setUserBudget(data.user_profile.budget);
          } else {
            console.warn("⚠️ User budget not found in response:", data);
          }
        } else {
          console.error(
            "❌ Failed to fetch user budget. Status:",
            response.status
          );
        }
      } catch (error) {
        console.error("Failed to fetch user budget:", error);
      }
    };

    // Get stays pricing from sessionStorage
    const getStaysPricing = () => {
      if (!userId || !sessionId) {
        console.warn(
          "⚠️ Cannot get stays pricing: userId or sessionId missing",
          { userId, sessionId }
        );
        return;
      }


      try {
        const stayDataKey = `stay_${userId}_${sessionId}`;
        const storedData = sessionStorage.getItem(stayDataKey);


        if (storedData) {
          const stayData = JSON.parse(storedData);
          if (stayData.total_price) {
            setStaysPricing(stayData.total_price);
          } else {
            console.warn("⚠️ Stays data found but no total_price:", stayData);
          }
        } else {
          console.warn(
            "⚠️ No stays data found in sessionStorage for key:",
            stayDataKey
          );
        }
      } catch (error) {
        console.error("Failed to retrieve stays pricing:", error);
      }
    };

    if (isVisible) {
      fetchUserBudget();
      getStaysPricing();
    } else {
    }
  }, [userId, sessionId, isVisible]);

  // Extract all travel activities
  const travelActivities = useMemo<TravelActivity[]>(() => {
    const activities: TravelActivity[] = [];

    itinerariesData.forEach((day) => {
      if (day.schedule && Array.isArray(day.schedule)) {
        day.schedule.forEach((item: any) => {
          if (
            item.activity_type === "travel" &&
            item.conveyance_type !== "walk"
          ) {
            activities.push({
              dayNumber: day.day_number,
              startTime: item.start_time || "",
              endTime: item.end_time || "",
              description: item.description || "",
              conveyanceType: item.conveyance_type || "travel",
              fromLocation: item.from_location?.place_name || "",
              toLocation: item.to_location?.place_name || "",
              fare: item.fare || 0,
            });
          }
        });
      }
    });

    return activities;
  }, [itinerariesData]);

  // Calculate cumulative fares by activity_type (granular level) + stays pricing
  const budgetBreakdown = useMemo(() => {
    const breakdown: Partial<Record<ActivityType, number>> = {};
    const dayWiseBreakdown: Record<
      number,
      Partial<Record<ActivityType, number>>
    > = {};

    // Count total "rest" activities to distribute stays pricing
    let totalRestActivities = 0;
    itinerariesData.forEach((day) => {
      if (day.schedule && Array.isArray(day.schedule)) {
        day.schedule.forEach((item: any) => {
          if (item.activity_type === "rest") {
            totalRestActivities++;
          }
        });
      }
    });

    // Calculate fare per rest activity (equal distribution)
    const farePerRest =
      totalRestActivities > 0 ? staysPricing / totalRestActivities : 0;

    itinerariesData.forEach((day) => {
      const dayNum = day.day_number;
      if (!dayWiseBreakdown[dayNum]) {
        dayWiseBreakdown[dayNum] = {};
      }

      if (day.schedule && Array.isArray(day.schedule)) {
        day.schedule.forEach((item: any) => {
          if (item.fare && item.activity_type) {
            const activityType = item.activity_type as ActivityType;

            // Overall breakdown
            breakdown[activityType] =
              (breakdown[activityType] || 0) + item.fare;

            // Day-wise breakdown
            dayWiseBreakdown[dayNum][activityType] =
              (dayWiseBreakdown[dayNum][activityType] || 0) + item.fare;
          }

          // Add stays pricing for "rest" activities (distributed)
          if (item.activity_type === "rest" && farePerRest > 0) {
            const activityType = "rest" as ActivityType;

            // Overall breakdown
            breakdown[activityType] =
              (breakdown[activityType] || 0) + farePerRest;

            // Day-wise breakdown
            dayWiseBreakdown[dayNum][activityType] =
              (dayWiseBreakdown[dayNum][activityType] || 0) + farePerRest;
          }
        });
      }
    });

    return { overall: breakdown, dayWise: dayWiseBreakdown };
  }, [itinerariesData, staysPricing]);

  // Calculate total budget
  const totalBudget = useMemo(() => {
    return Object.values(budgetBreakdown.overall).reduce((a, b) => a + b, 0);
  }, [budgetBreakdown]);

  // Check if all activities are booked
  const allBooked =
    travelActivities.length > 0 &&
    bookedActivities.size === travelActivities.length;

  // Handlers
  const handleBookClick = (index: number, activity: TravelActivity) => {
    if (bookedActivities.has(index)) return; // Already booked

    setSelectedActivity({
      index,
      title: `${activity.fromLocation} → ${activity.toLocation}`,
      fare: activity.fare,
    });
    setShowModal(true);
  };

  const handleBookingConfirm = () => {
    if (selectedActivity) {
      setBookedActivities((prev) => new Set(prev).add(selectedActivity.index));
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedActivity(null);
  };

  // Book all handler with animation
  const handleBookAll = async () => {
    if (isBookingAll || allBooked) return;

    setIsBookingAll(true);

    // Simulate booking process with staggered animations
    const indices = travelActivities.map((_, idx) => idx);

    for (const idx of indices) {
      await new Promise((resolve) => setTimeout(resolve, 300)); // 300ms per booking
      setBookedActivities((prev) => new Set(prev).add(idx));
    }

    setIsBookingAll(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="booking-widget-container">
        {/* Minimalistic Header */}
        <div className="booking-header">
          <div className="header-content">
            <h2 className="header-title">Trip Summary</h2>
            <p className="header-subtitle">
              {tripTitle} · {totalDays} Days
            </p>
          </div>
          <button
            onClick={onToggle}
            className="toggle-button"
            aria-label="Close booking widget"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Two Column Layout */}
        <div className="booking-content">
          {/* Left Column - Travel Cards */}
          <div className="travel-column">
            <div className="section-header">
              <h3 className="column-title">Travel Activities</h3>
              <button
                onClick={handleBookAll}
                disabled={isBookingAll || allBooked}
                className={`book-all-button ${isBookingAll ? "booking" : ""} ${
                  allBooked ? "all-booked" : ""
                }`}
              >
                {isBookingAll ? (
                  <>
                    <div className="spinner"></div>
                    Booking...
                  </>
                ) : allBooked ? (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                    All Booked
                  </>
                ) : (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 11l3 3L22 4"></path>
                      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                    </svg>
                    Book All
                  </>
                )}
              </button>
            </div>
            <div className="travel-cards-container">
              {travelActivities.length > 0 ? (
                travelActivities.map((activity, index) => (
                  <div
                    key={index}
                    className={`travel-card ${
                      bookedActivities.has(index) ? "booked" : ""
                    }`}
                  >
                    <div className="travel-card-header">
                      <div className="conveyance-badge">
                        {activity.conveyanceType?.toUpperCase() || "TRAVEL"}
                      </div>
                      <div className="day-badge">Day {activity.dayNumber}</div>
                      {bookedActivities.has(index) && (
                        <div className="booked-indicator">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path d="M20 6L9 17l-5-5"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="travel-route">
                      <div className="location-info">
                        <div className="location-label">From</div>
                        <div className="location-name">
                          {activity.fromLocation || "—"}
                        </div>
                      </div>
                      <div className="route-arrow">→</div>
                      <div className="location-info">
                        <div className="location-label">To</div>
                        <div className="location-name">
                          {activity.toLocation || "—"}
                        </div>
                      </div>
                    </div>
                    {activity.description && (
                      <div className="travel-description">
                        {activity.description}
                      </div>
                    )}
                    <div className="travel-card-footer">
                      {activity.fare && activity.fare > 0 && (
                        <div className="travel-fare">
                          ₹{activity.fare.toLocaleString("en-IN")}
                        </div>
                      )}
                      <button
                        className={`book-button ${
                          bookedActivities.has(index) ? "booked" : ""
                        }`}
                        onClick={() => handleBookClick(index, activity)}
                        disabled={bookedActivities.has(index)}
                      >
                        {bookedActivities.has(index) ? (
                          <>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="M20 6L9 17l-5-5"></path>
                            </svg>
                            Booked
                          </>
                        ) : (
                          "Book"
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No travel activities found</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Budget Panel */}
          <div className="budget-column">
            <BudgetPanel
              budgetBreakdown={budgetBreakdown}
              totalBudget={totalBudget}
              userBudget={userBudget}
              categoryIcons={categoryIcons}
              categoryLabels={categoryLabels}
              totalDays={totalDays}
            />
          </div>
        </div>

        {/* Continue Button - Shows when all bookings are done */}
        {allBooked && onContinue && (
          <div className="continue-section">
            <button onClick={onContinue} className="continue-button-booking">
              <span>Continue</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Booking Confirmation Modal */}
      {selectedActivity && (
        <BookingConfirmationModal
          isVisible={showModal}
          onClose={handleModalClose}
          onConfirm={handleBookingConfirm}
          activityTitle={selectedActivity.title}
          activityFare={selectedActivity.fare}
        />
      )}

      <style jsx>{`
        .booking-widget-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.98) 0%,
            rgba(249, 250, 251, 0.98) 100%
          );
          overflow: hidden;
        }

        /* Minimalistic Header */
        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .header-content {
          flex: 1;
        }

        .header-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "Segoe UI", Roboto, sans-serif;
        }

        .header-subtitle {
          font-size: 0.75rem;
          font-weight: 500;
          color: #6b7280;
          margin: 2px 0 0 0;
        }

        .toggle-button {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.04);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .toggle-button:hover {
          background: rgba(0, 0, 0, 0.08);
          color: #1f2937;
        }

        .booking-content {
          flex: 1;
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          padding: 16px;
          overflow: hidden;
        }

        .travel-column,
        .budget-column {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .column-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "Segoe UI", Roboto, sans-serif;
        }

        .book-all-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
        }

        .book-all-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }

        .book-all-button.booking {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          cursor: wait;
        }

        .book-all-button.all-booked {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          cursor: default;
        }

        .book-all-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .travel-cards-container {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 6px;
        }

        .travel-cards-container::-webkit-scrollbar {
          width: 4px;
        }

        .travel-cards-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.04);
          border-radius: 2px;
        }

        .travel-cards-container::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 2px;
        }

        .travel-cards-container::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.25);
        }

        /* Minimalistic Travel Cards */
        .travel-card {
          background: white;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: all 0.2s ease;
          position: relative;
        }

        .travel-card:hover {
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }

        .travel-card.booked {
          background: linear-gradient(
            135deg,
            rgba(16, 185, 129, 0.05) 0%,
            rgba(5, 150, 105, 0.03) 100%
          );
          border-color: rgba(16, 185, 129, 0.2);
        }

        .travel-card-header {
          display: flex;
          gap: 6px;
          align-items: center;
          margin-bottom: 10px;
        }

        .conveyance-badge {
          display: inline-block;
          padding: 3px 8px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          font-size: 0.625rem;
          font-weight: 700;
          border-radius: 6px;
          letter-spacing: 0.03em;
        }

        .day-badge {
          padding: 3px 8px;
          background: rgba(0, 0, 0, 0.04);
          color: #6b7280;
          font-size: 0.625rem;
          font-weight: 600;
          border-radius: 6px;
        }

        .booked-indicator {
          margin-left: auto;
          width: 20px;
          height: 20px;
          background: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .travel-route {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .location-info {
          flex: 1;
          min-width: 0;
        }

        .location-label {
          font-size: 0.625rem;
          font-weight: 500;
          color: #9ca3af;
          margin-bottom: 2px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .location-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1f2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .route-arrow {
          font-size: 1rem;
          color: #9ca3af;
          flex-shrink: 0;
        }

        .travel-description {
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 10px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .travel-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .travel-fare {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #059669;
        }

        .book-button {
          padding: 6px 14px;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          color: white;
          border: none;
          border-radius: 7px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 4px rgba(147, 51, 234, 0.15);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .book-button:hover:not(.booked) {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(147, 51, 234, 0.25);
        }

        .book-button.booked {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          cursor: default;
          box-shadow: 0 1px 4px rgba(16, 185, 129, 0.15);
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #9ca3af;
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Continue Section */
        .continue-section {
          padding: 12px 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          justify-content: center;
          background: rgba(255, 255, 255, 0.8);
        }

        .continue-button-booking {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border-radius: 10px;
          border: none;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
          font-size: 0.875rem;
          font-weight: 600;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "Segoe UI", Roboto, sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .continue-button-booking:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .continue-button-booking:active {
          transform: translateY(0);
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
        }

        .continue-button-booking svg {
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .continue-button-booking:hover svg {
          transform: translateX(3px);
        }

        @media (max-width: 1024px) {
          .booking-content {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .budget-column {
            max-height: 400px;
          }
        }

        @media (max-width: 640px) {
          .booking-header {
            padding: 10px 16px;
          }

          .header-title {
            font-size: 0.9375rem;
          }

          .booking-content {
            padding: 12px;
            gap: 10px;
          }

          .continue-section {
            padding: 10px 16px;
          }

          .continue-button-booking {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}
