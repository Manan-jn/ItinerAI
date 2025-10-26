import React from "react";

interface SuggestionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function SuggestionPanel({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
}: SuggestionPanelProps) {
  if (!isOpen) return null;

  const popularActivities = [
    "Hiking",
    "Local Market",
    "Museum Visit",
    "Food Tour",
    "Sunset Point",
  ];
  const foodActivities = ["Traditional Restaurant", "Street Food", "Cafe"];

  return (
    <div className="suggestion-panel">
      <div className="suggestion-header">
        <h3>Add Activity</h3>
        <button
          className="panel-close-btn"
          onClick={onClose}
          aria-label="Close panel"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="suggestion-search">
        <svg
          className="search-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="text"
          className="suggestion-search-input"
          placeholder="Search activities..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="suggestion-content">
        <div className="suggestion-section">
          <h4 className="suggestion-section-title">Popular Activities</h4>
          <div className="suggestion-cards">
            {popularActivities.map((activity, idx) => (
              <div key={idx} className="suggestion-card">
                <div className="suggestion-card-icon">🎯</div>
                <div className="suggestion-card-content">
                  <h5 className="suggestion-card-title">{activity}</h5>
                  <p className="suggestion-card-desc">2-3 hours</p>
                </div>
                <button className="suggestion-add-btn" title="Add to itinerary">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="suggestion-section">
          <h4 className="suggestion-section-title">Food & Dining</h4>
          <div className="suggestion-cards">
            {foodActivities.map((activity, idx) => (
              <div key={idx} className="suggestion-card">
                <div className="suggestion-card-icon">🍽️</div>
                <div className="suggestion-card-content">
                  <h5 className="suggestion-card-title">{activity}</h5>
                  <p className="suggestion-card-desc">1-2 hours</p>
                </div>
                <button className="suggestion-add-btn" title="Add to itinerary">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
