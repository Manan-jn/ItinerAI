"use client";

import React, { useState, useMemo } from "react";

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

interface BookingSnippetProps {
  tripTitle: string;
  totalDays: number;
  totalBudget: number;
  userBudget?: number;
  budgetBreakdown: {
    overall: Partial<Record<ActivityType, number>>;
  };
  travelActivitiesCount: number;
}

const categoryColors: Record<ActivityType, string> = {
  travel: "#3b82f6",
  eat: "#f59e0b",
  visit: "#8b5cf6",
  rest: "#10b981",
  shopping: "#ec4899",
  event: "#f97316",
  adventure: "#06b6d4",
  leisure: "#a855f7",
  free_time: "#84cc16",
  other: "#6b7280",
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

export function BookingSnippet({
  tripTitle,
  totalDays,
  totalBudget,
  userBudget,
  budgetBreakdown,
  travelActivitiesCount,
}: BookingSnippetProps) {
  const [hoveredCategory, setHoveredCategory] = useState<ActivityType | null>(null);

  // Calculate budget utilization percentage
  const budgetUtilization = userBudget ? (totalBudget / userBudget) * 100 : 0;
  const isOverBudget = budgetUtilization > 100;

  // Pie chart calculation for category breakdown
  const categoryChartData = useMemo(() => {
    return Object.entries(budgetBreakdown.overall)
      .map(([type, amount]) => {
        const percentage = totalBudget > 0 ? (amount / totalBudget) * 100 : 0;
        return {
          type: type as ActivityType,
          amount,
          percentage,
        };
      })
      .filter((item) => item.amount > 0);
  }, [budgetBreakdown, totalBudget]);

  // Get top 3 categories
  const topCategories = useMemo(() => {
    return Object.entries(budgetBreakdown.overall)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [budgetBreakdown]);

  return (
    <div className="booking-snippet">
      {/* Header */}
      <div className="snippet-header">
        <div className="header-icon">✅</div>
        <div className="header-content">
          <h3 className="header-title">Trip Bookings Completed</h3>
          <p className="header-subtitle">
            {tripTitle} • {totalDays} Days • {travelActivitiesCount} Activities Booked
          </p>
        </div>
      </div>

      {/* Budget Summary */}
      <div className="budget-summary">
        <div className="summary-row">
          <span className="summary-label">Total Spending</span>
          <span className="summary-value primary">
            ₹{totalBudget.toLocaleString("en-IN")}
          </span>
        </div>
        {userBudget && (
          <>
            <div className="summary-row">
              <span className="summary-label">Your Budget</span>
              <span className="summary-value">
                ₹{userBudget.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="budget-status">
              <span className={`status-badge ${isOverBudget ? "over" : "under"}`}>
                {isOverBudget ? "⚠️ Over Budget" : "✓ Within Budget"}
              </span>
              <span className="budget-percentage">
                {budgetUtilization.toFixed(1)}% utilized
              </span>
            </div>
          </>
        )}
      </div>

      {/* Spending Distribution - Pie Chart */}
      {categoryChartData.length > 0 && (
        <div className="spending-section">
          <h4 className="section-title">💰 Spending Distribution</h4>
          <div className="pie-container">
            <svg viewBox="0 0 200 200" className="pie-chart">
              {(() => {
                let currentAngle = -90;
                return categoryChartData.map((data) => {
                  const angle = (data.percentage / 100) * 360;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + angle;
                  currentAngle = endAngle;

                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  const radius = hoveredCategory === data.type ? 78 : 75;
                  const x1 = 100 + radius * Math.cos(startRad);
                  const y1 = 100 + radius * Math.sin(startRad);
                  const x2 = 100 + radius * Math.cos(endRad);
                  const y2 = 100 + radius * Math.sin(endRad);
                  const largeArc = angle > 180 ? 1 : 0;

                  return (
                    <g key={data.type}>
                      <path
                        d={`M 100 100 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={categoryColors[data.type]}
                        opacity={
                          hoveredCategory === null ||
                          hoveredCategory === data.type
                            ? "0.9"
                            : "0.4"
                        }
                        className="pie-slice"
                        onMouseEnter={() => setHoveredCategory(data.type)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      />
                    </g>
                  );
                });
              })()}
              {/* Center circle */}
              <circle cx="100" cy="100" r="45" fill="white" />
              {hoveredCategory ? (
                <>
                  <text
                    x="100"
                    y="92"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="#1f2937"
                  >
                    {categoryLabels[hoveredCategory]}
                  </text>
                  <text
                    x="100"
                    y="105"
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="700"
                    fill={categoryColors[hoveredCategory]}
                  >
                    ₹{(budgetBreakdown.overall[hoveredCategory]! / 1000).toFixed(1)}K
                  </text>
                  <text
                    x="100"
                    y="116"
                    textAnchor="middle"
                    fontSize="9"
                    fill="#6b7280"
                  >
                    {(
                      (budgetBreakdown.overall[hoveredCategory]! / totalBudget) *
                      100
                    ).toFixed(1)}
                    %
                  </text>
                </>
              ) : (
                <>
                  <text
                    x="100"
                    y="96"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="#1f2937"
                  >
                    Total
                  </text>
                  <text
                    x="100"
                    y="109"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill="#3b82f6"
                  >
                    ₹{(totalBudget / 1000).toFixed(1)}K
                  </text>
                </>
              )}
            </svg>
          </div>
        </div>
      )}

      {/* Top Categories */}
      <div className="top-spending">
        <h4 className="section-title">📊 Top Spending</h4>
        <div className="categories-list">
          {topCategories.map(([type, amount], index) => (
            <div key={type} className="category-row">
              <span className="category-rank">{index + 1}</span>
              <span className="category-label">
                {categoryLabels[type as ActivityType]}
              </span>
              <span className="category-amount">
                ₹{amount.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .booking-snippet {
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "Segoe UI", Roboto, sans-serif;
        }

        .snippet-header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
        }

        .header-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .header-content {
          flex: 1;
          min-width: 0;
        }

        .header-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .header-subtitle {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
        }

        .budget-summary {
          background: linear-gradient(to br, #f9fafb, #ffffff);
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .summary-label {
          font-size: 0.7rem;
          color: #6b7280;
        }

        .summary-value {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #1f2937;
        }

        .summary-value.primary {
          font-size: 1rem;
          color: #3b82f6;
        }

        .budget-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 6px;
          margin-top: 4px;
          border-top: 1px solid #e5e7eb;
        }

        .status-badge {
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.6875rem;
          font-weight: 600;
        }

        .status-badge.under {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .status-badge.over {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .budget-percentage {
          font-size: 0.6875rem;
          color: #6b7280;
        }

        .spending-section,
        .top-spending {
          background: linear-gradient(to br, #f9fafb, #ffffff);
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px;
        }

        .section-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .pie-container {
          display: flex;
          justify-content: center;
          padding: 8px 0;
        }

        .pie-chart {
          width: 200px;
          height: 200px;
        }

        .pie-slice {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pie-slice:hover {
          filter: brightness(1.1);
        }

        .categories-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .category-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }

        .category-rank {
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          font-size: 0.625rem;
          font-weight: 700;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .category-label {
          flex: 1;
          font-size: 0.75rem;
          color: #4b5563;
          font-weight: 500;
        }

        .category-amount {
          font-size: 0.75rem;
          font-weight: 700;
          color: #059669;
        }
      `}</style>
    </div>
  );
}

