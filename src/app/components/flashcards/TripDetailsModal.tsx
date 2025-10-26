import React from "react";
import { TripInfo } from "./types";
import { isValidImageUrl, getCityImage } from "./imageHelpers";

interface TripDetailsModalProps {
  trip: TripInfo;
  onClose: (e?: React.MouseEvent) => void;
  onPhotoClick: (photos: string[], index: number) => void;
  onAddActivity: () => void;
  onRemoveActivity: (activityName: string) => void;
  cachedImageUrls?: Map<string, string>;
}

export function TripDetailsModal({
  trip,
  onClose,
  onPhotoClick,
  onAddActivity,
  onRemoveActivity,
  cachedImageUrls,
}: TripDetailsModalProps) {
  return (
    <div className="modal-backdrop">
      <button
        className="modal-close-btn"
        onClick={onClose}
        aria-label="Close modal"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div className="modal-container">
        <div
          className="modal-background"
          style={{
            backgroundImage: trip.image ? `url("${trip.image}")` : "none",
            backgroundColor: trip.image ? "transparent" : "#1a1a1a",
          }}
        />
        <div className="modal-overlay" />

        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">{trip.trip_title}</h2>
            <div className="modal-meta">
              <div className="meta-card">
                <span className="meta-icon">📅</span>
                <div className="meta-text">
                  <span className="meta-label">Duration</span>
                  <span className="meta-value">{trip.no_of_days} Days</span>
                </div>
              </div>
              <div className="meta-card">
                <span className="meta-icon">💰</span>
                <div className="meta-text">
                  <span className="meta-label">Budget</span>
                  <span className="meta-value">
                    ₹{trip.estimated_budget.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="meta-card">
                <span className="meta-icon">🌟</span>
                <div className="meta-text">
                  <span className="meta-label">Best Time</span>
                  <span className="meta-value">{trip.best_time_to_visit}</span>
                </div>
              </div>
            </div>

            <div className="modal-themes">
              {trip.theme.map((theme, idx) => (
                <span key={idx} className="modal-theme-tag">
                  {theme}
                </span>
              ))}
            </div>
          </div>

          <div className="modal-body">
            <h3 className="itinerary-title">Day-wise Itinerary</h3>
            <div className="days-container">
              {trip.day_wise_plan.map((day, dayIdx) => (
                <div key={dayIdx} className="modal-day-card">
                  <div className="day-badge">
                    <span className="day-number">Day {day.day_number}</span>
                  </div>

                  <div className="day-content">
                    {/* City Cards with Images */}
                    <div className="day-cities-section">
                      {day.cities.map((city, cityIdx) => (
                        <React.Fragment key={cityIdx}>
                          {cityIdx > 0 && (
                            <div className="city-divider">
                              <span className="divider-text">
                                Next Destination
                              </span>
                            </div>
                          )}
                          <div className="enhanced-city-card">
                            {/* City Image Gallery */}
                            <div
                              className="city-image-container"
                              onClick={(e) => {
                                e.stopPropagation();
                                const validPhotos = (city.photos || []).filter(
                                  (photo: string) => isValidImageUrl(photo)
                                );
                                if (validPhotos.length > 0) {
                                  onPhotoClick(city.photos, 0);
                                }
                              }}
                              style={{
                                cursor:
                                  (city.photos || []).filter((photo: string) =>
                                    isValidImageUrl(photo)
                                  ).length > 0
                                    ? "pointer"
                                    : "default",
                              }}
                            >
                              <img
                                src={getCityImage(city, cachedImageUrls)}
                                alt={city.name}
                                className="city-image"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&auto=format&q=80";
                                }}
                              />
                              <div className="city-image-overlay"></div>
                              {(() => {
                                const validPhotos = (city.photos || []).filter(
                                  (photo: string) => isValidImageUrl(photo)
                                );
                                return validPhotos.length > 1 ? (
                                  <div className="photo-count-badge">
                                    <span>📷</span>
                                    <span>{validPhotos.length} photos</span>
                                  </div>
                                ) : null;
                              })()}
                            </div>

                            {/* City Info */}
                            <div className="city-info-header">
                              <div className="city-header-top">
                                <h4 className="city-title">{city.name}</h4>
                              </div>
                              <p className="city-location">{city.address}</p>
                              <div className="city-tags">
                                {trip.theme
                                  .slice(0, 2)
                                  .map((theme, themeIdx) => (
                                    <span
                                      key={themeIdx}
                                      className={`city-tag-item ${
                                        themeIdx === 0 ? "statues" : "fountain"
                                      }`}
                                    >
                                      {theme}
                                    </span>
                                  ))}
                              </div>
                            </div>

                            {/* Must-do Activities for this city/day */}
                            <div className="city-activities-list">
                              {day.must_do_activities.map(
                                (activity, actIdx) => (
                                  <div
                                    key={actIdx}
                                    className="enhanced-activity-item"
                                  >
                                    <div className="activity-main-content">
                                      <div className="activity-left">
                                        <div className="activity-number-badge">
                                          {actIdx + 1}
                                        </div>
                                        <div className="activity-type-icon">
                                          {activity.type === "place"
                                            ? "📍"
                                            : activity.type === "food"
                                            ? "🍽️"
                                            : activity.type === "activity"
                                            ? "🎯"
                                            : "📍"}
                                        </div>
                                        <div className="activity-details">
                                          <h5 className="activity-title">
                                            {activity.name}
                                          </h5>
                                          <p className="activity-subtitle">
                                            {activity.description}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="activity-actions">
                                        <button
                                          className="activity-action-btn add-btn"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onAddActivity();
                                          }}
                                          title="Add activity"
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
                                            <line
                                              x1="12"
                                              y1="5"
                                              x2="12"
                                              y2="19"
                                            ></line>
                                            <line
                                              x1="5"
                                              y1="12"
                                              x2="19"
                                              y2="12"
                                            ></line>
                                          </svg>
                                        </button>
                                        <button
                                          className="activity-action-btn remove-btn"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveActivity(activity.name);
                                          }}
                                          title="Remove activity"
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
                                            <line
                                              x1="5"
                                              y1="12"
                                              x2="19"
                                              y2="12"
                                            ></line>
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chatbox at bottom center - outside modal container */}
      <div className="chatbox-container" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          className="chatbox-input"
          placeholder="Ask ItinerAI"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          className="chatbox-submit-btn"
          onClick={(e) => e.stopPropagation()}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
}
