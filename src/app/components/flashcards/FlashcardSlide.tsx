import React from "react";
import { TripInfo } from "./types";

interface FlashcardSlideProps {
  trip: TripInfo;
  isCenter: boolean;
  distance: number;
  isSelected: boolean;
  onSlideClick: () => void;
  onSelectCard: (e: React.MouseEvent) => void;
}

export function FlashcardSlide({
  trip,
  isCenter,
  distance,
  isSelected,
  onSlideClick,
  onSelectCard,
}: FlashcardSlideProps) {
  return (
    <div className="flashcard-wrapper">
      <div
        className={`flashcard-slide ${isCenter ? "active" : "inactive"} ${
          isSelected ? "selected" : ""
        }`}
        onClick={onSlideClick}
        style={{
          backgroundImage: trip.image ? `url("${trip.image}")` : "none",
          backgroundColor: trip.image ? "transparent" : "#1a1a1a",
          cursor: isCenter ? "pointer" : "default",
        }}
        data-distance={distance}
      >
        <div className="slide-overlay" />

        <div className="slide-content">
          {/* Title at top */}
          <div className="slide-title-top">
            <h4 className="trip-name">{trip.trip_title}</h4>
          </div>

          {/* Info cards at bottom */}
          <div className="slide-info-bottom">
            <div className="info-row">
              <div className="info-card">
                <div className="info-icon">
                  <svg
                    width="16"
                    height="16"
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
                <div className="info-text">
                  <span className="info-label">Trip</span>
                  <span className="info-value">{trip.no_of_days} Days</span>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div className="info-text">
                  <span className="info-label">Budget</span>
                  <span className="info-value">₹{trip.estimated_budget}</span>
                </div>
              </div>
            </div>

            <div className="info-row">
              <div className="info-card full-width">
                <div className="info-icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div className="info-text">
                  <span className="info-label">Best Time</span>
                  <span className="info-value">{trip.best_time_to_visit}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tick button at top-right corner - only show for center/active card */}
        {isCenter && (
          <button
            className={`flashcard-select-btn ${isSelected ? "selected" : ""}`}
            onClick={onSelectCard}
            aria-label={isSelected ? "Deselect this trip" : "Select this trip"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
