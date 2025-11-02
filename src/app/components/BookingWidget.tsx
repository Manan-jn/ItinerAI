"use client";

import React, { useMemo, useState } from "react";
import BookingConfirmationModal from "./BookingConfirmationModal";

export interface BookingWidgetProps {
  isVisible: boolean;
  onToggle: () => void;
  itinerariesData: any[];
  tripTitle: string;
  totalDays: number;
  onContinue?: () => void;
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
  rest: "Rest",
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
}: BookingWidgetProps) {
  // Track booked activities
  const [bookedActivities, setBookedActivities] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<{
    index: number;
    title: string;
    fare?: number;
  } | null>(null);

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

  // Calculate cumulative fares by activity_type
  const budgetBreakdown = useMemo(() => {
    const breakdown: Partial<Record<ActivityType, number>> = {};

    itinerariesData.forEach((day) => {
      if (day.schedule && Array.isArray(day.schedule)) {
        day.schedule.forEach((item: any) => {
          if (item.fare && item.activity_type) {
            const activityType = item.activity_type as ActivityType;
            breakdown[activityType] =
              (breakdown[activityType] || 0) + item.fare;
          }
        });
      }
    });

    return breakdown;
  }, [itinerariesData]);

  // Calculate total budget
  const totalBudget = useMemo(() => {
    return Object.values(budgetBreakdown).reduce((a, b) => a + b, 0);
  }, [budgetBreakdown]);

  // Check if all activities are booked
  const allBooked = travelActivities.length > 0 && bookedActivities.size === travelActivities.length;

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

  if (!isVisible) return null;

  return (
    <>
      <div className="booking-widget-container">
        {/* Header Section */}
        <div className="booking-header">
          <div className="header-content">
            <h2 className="header-title">Trip Summary</h2>
            <p className="header-subtitle">{tripTitle}</p>
            <p className="header-days">{totalDays} Days</p>
          </div>
          <button
            onClick={onToggle}
            className="toggle-button"
            aria-label="Close booking widget"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
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
            <h3 className="column-title">Travel Activities</h3>
            <div className="travel-cards-container">
              {travelActivities.length > 0 ? (
                travelActivities.map((activity, index) => (
                  <div key={index} className="travel-card">
                    <div className="travel-card-header">
                      <div className="conveyance-badge">
                        {activity.conveyanceType?.toUpperCase() || "TRAVEL"}
                      </div>
                      <div className="day-badge">Day {activity.dayNumber}</div>
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
                        className={`book-button ${bookedActivities.has(index) ? "booked" : ""}`}
                        onClick={() => handleBookClick(index, activity)}
                        disabled={bookedActivities.has(index)}
                      >
                        {bookedActivities.has(index) ? (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M20 6L9 17l-5-5"></path>
                            </svg>
                            Done
                          </>
                        ) : (
                          "Book Now"
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

          {/* Right Column - Budget Breakdown */}
          <div className="budget-column">
            <h3 className="column-title">Budget Breakdown</h3>
            <div className="budget-card">
              {Object.keys(budgetBreakdown).length > 0 ? (
                <>
                  {(
                    Object.entries(budgetBreakdown) as [ActivityType, number][]
                  ).map(([activityType, amount]) => (
                    <div key={activityType} className="budget-item">
                      <div className="budget-category">
                        <span className="category-icon">
                          {categoryIcons[activityType]}
                        </span>
                        <span className="category-label">
                          {categoryLabels[activityType]}
                        </span>
                      </div>
                      <div className="budget-amount">
                        ₹{amount.toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                  <div className="budget-total">
                    <div className="total-label">Total Budget</div>
                    <div className="total-amount">
                      ₹{totalBudget.toLocaleString("en-IN")}
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <p>No budget information available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Continue Button - Shows when all bookings are done */}
        {allBooked && onContinue && (
          <div className="continue-section">
            <button onClick={onContinue} className="continue-button-booking">
              <span>Continue</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
            rgba(255, 255, 255, 0.95) 0%,
            rgba(249, 250, 251, 0.98) 100%
          );
          overflow: hidden;
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          background: linear-gradient(
            135deg,
            rgba(147, 51, 234, 0.08) 0%,
            rgba(219, 39, 119, 0.05) 100%
          );
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(147, 51, 234, 0.15);
        }

        .header-content {
          flex: 1;
        }

        .header-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "Segoe UI", Roboto, sans-serif;
        }

        .header-subtitle {
          font-size: 1.125rem;
          font-weight: 600;
          color: #9333ea;
          margin: 0 0 4px 0;
        }

        .header-days {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          margin: 0;
        }

        .toggle-button {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(147, 51, 234, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .toggle-button:hover {
          background: rgba(147, 51, 234, 0.1);
          color: #9333ea;
          transform: scale(1.1);
        }

        .booking-content {
          flex: 1;
          display: grid;
          grid-template-columns: 60% 40%;
          gap: 24px;
          padding: 32px;
          overflow: hidden;
        }

        .travel-column,
        .budget-column {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .column-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 16px 0;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "Segoe UI", Roboto, sans-serif;
        }

        .travel-cards-container {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-right: 8px;
        }

        .travel-cards-container::-webkit-scrollbar {
          width: 6px;
        }

        .travel-cards-container::-webkit-scrollbar-track {
          background: rgba(147, 51, 234, 0.05);
          border-radius: 3px;
        }

        .travel-cards-container::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.2);
          border-radius: 3px;
        }

        .travel-cards-container::-webkit-scrollbar-thumb:hover {
          background: rgba(147, 51, 234, 0.3);
        }

        .travel-card {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.85) 0%,
            rgba(255, 255, 255, 0.7) 100%
          );
          backdrop-filter: blur(24px);
          border-radius: 16px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          padding: 20px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
        }

        .travel-card:hover {
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
          transform: translateY(-4px);
        }

        .travel-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .conveyance-badge {
          display: inline-block;
          padding: 6px 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: 8px;
          letter-spacing: 0.05em;
        }

        .day-badge {
          padding: 4px 10px;
          background: rgba(147, 51, 234, 0.1);
          color: #9333ea;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 6px;
        }

        .travel-route {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }

        .location-info {
          flex: 1;
        }

        .location-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .location-name {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1f2937;
        }

        .route-arrow {
          font-size: 1.5rem;
          color: #9333ea;
          flex-shrink: 0;
        }

        .travel-description {
          font-size: 0.875rem;
          color: #4b5563;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .travel-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid rgba(59, 130, 246, 0.1);
        }

        .travel-fare {
          font-size: 1.125rem;
          font-weight: 700;
          color: #059669;
        }

        .book-button {
          padding: 8px 20px;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(147, 51, 234, 0.2);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .book-button:hover:not(.booked) {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
        }

        .book-button.booked {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          cursor: default;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
        }

        .budget-card {
          background: linear-gradient(
            135deg,
            rgba(147, 51, 234, 0.1) 0%,
            rgba(219, 39, 119, 0.05) 100%
          );
          backdrop-filter: blur(24px);
          border-radius: 16px;
          border: 1px solid rgba(147, 51, 234, 0.2);
          padding: 24px;
          box-shadow: 0 4px 16px rgba(147, 51, 234, 0.1);
        }

        .budget-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(147, 51, 234, 0.1);
        }

        .budget-item:last-of-type {
          border-bottom: none;
        }

        .budget-category {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .category-icon {
          font-size: 1.25rem;
        }

        .category-label {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1f2937;
        }

        .budget-amount {
          font-size: 1rem;
          font-weight: 700;
          color: #059669;
        }

        .budget-total {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 2px solid rgba(147, 51, 234, 0.3);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .total-label {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1f2937;
        }

        .total-amount {
          font-size: 1.5rem;
          font-weight: 700;
          color: #9333ea;
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #6b7280;
          font-size: 0.9375rem;
          font-weight: 500;
        }

        @media (max-width: 1024px) {
          .booking-content {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .budget-column {
            max-height: 400px;
          }

          .budget-card {
            overflow-y: auto;
          }
        }

        /* Continue Section */
        .continue-section {
          padding: 20px 32px;
          border-top: 1px solid rgba(147, 51, 234, 0.15);
          display: flex;
          justify-content: center;
          background: linear-gradient(
            135deg,
            rgba(147, 51, 234, 0.03) 0%,
            rgba(219, 39, 119, 0.02) 100%
          );
        }

        .continue-button-booking {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 32px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.75) 0%,
            rgba(255, 255, 255, 0.6) 100%
          );
          backdrop-filter: blur(32px) saturate(200%);
          -webkit-backdrop-filter: blur(32px) saturate(200%);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 0 rgba(0, 0, 0, 0.03);
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto,
            sans-serif;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }

        .continue-button-booking:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.85) 0%, rgba(37, 99, 235, 0.75) 100%);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(59, 130, 246, 0.2);
        }

        .continue-button-booking:active {
          transform: translateY(0);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
        }

        .continue-button-booking svg {
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .continue-button-booking:hover svg {
          transform: translateX(4px);
        }

        @media (max-width: 1024px) {
          .booking-content {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .budget-column {
            max-height: 400px;
          }

          .budget-card {
            overflow-y: auto;
          }
        }

        @media (max-width: 640px) {
          .booking-header {
            padding: 20px;
          }

          .header-title {
            font-size: 1.5rem;
          }

          .booking-content {
            padding: 20px;
            gap: 16px;
          }

          .continue-section {
            padding: 16px 20px;
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
