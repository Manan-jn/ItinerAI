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

interface BudgetPanelProps {
  budgetBreakdown: {
    overall: Partial<Record<ActivityType, number>>;
    dayWise: Record<number, Partial<Record<ActivityType, number>>>;
  };
  totalBudget: number;
  userBudget: number | null;
  categoryIcons: Record<ActivityType, string>;
  categoryLabels: Record<ActivityType, string>;
  totalDays: number;
}

type ViewMode = "category" | "daywise" | "overview";

export default function BudgetPanel({
  budgetBreakdown,
  totalBudget,
  userBudget,
  categoryIcons,
  categoryLabels,
  totalDays,
}: BudgetPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [hoveredCategory, setHoveredCategory] = useState<ActivityType | null>(
    null
  );

  // Calculate budget utilization percentage
  const budgetUtilization = userBudget ? (totalBudget / userBudget) * 100 : 0;
  const isOverBudget = budgetUtilization > 100;
  const remainingBudget = userBudget ? userBudget - totalBudget : 0;

  // Debug logging

  // Calculate day-wise totals
  const dayWiseTotals = useMemo(() => {
    const totals = Object.entries(budgetBreakdown.dayWise).map(
      ([day, breakdown]) => {
        const total = Object.values(breakdown).reduce(
          (sum, val) => sum + val,
          0
        );
        return { day: parseInt(day), total };
      }
    );
    return totals;
  }, [budgetBreakdown]);

  // Get top 3 spending categories
  const topCategories = useMemo(() => {
    return Object.entries(budgetBreakdown.overall)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [budgetBreakdown]);

  // Calculate max for bar chart scaling
  const maxCategoryAmount = useMemo(() => {
    return Math.max(...Object.values(budgetBreakdown.overall), 1);
  }, [budgetBreakdown]);

  const maxDayAmount = useMemo(() => {
    const max = Math.max(...dayWiseTotals.map((d) => d.total), 1);
    return max;
  }, [dayWiseTotals]);

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
      .filter((item) => item.amount > 0); // Only include categories with spending
  }, [budgetBreakdown, totalBudget]);

  // Color scheme for categories
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

  return (
    <div className="budget-panel">
      <h3 className="panel-title">Budget Overview</h3>

      {/* View Mode Tabs */}
      <div className="view-tabs">
        <button
          className={`tab ${viewMode === "overview" ? "active" : ""}`}
          onClick={() => setViewMode("overview")}
        >
          Overview
        </button>
        <button
          className={`tab ${viewMode === "category" ? "active" : ""}`}
          onClick={() => setViewMode("category")}
        >
          By Category
        </button>
        <button
          className={`tab ${viewMode === "daywise" ? "active" : ""}`}
          onClick={() => setViewMode("daywise")}
        >
          By Day
        </button>
      </div>

      <div className="panel-content">
        {/* Overview Mode */}
        {viewMode === "overview" && (
          <>
            {/* Budget Summary Card with Comparison */}
            <div className="summary-card">
              <div className="summary-row">
                <span className="summary-label">Trip Spending</span>
                <span className="summary-value primary">
                  ₹{totalBudget.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Always show budget comparison section */}
              {userBudget ? (
                <>
                  <div className="summary-row">
                    <span className="summary-label">Your Budget</span>
                    <span className="summary-value">
                      ₹{userBudget.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">
                      {isOverBudget ? "Over Budget" : "Savings"}
                    </span>
                    <span
                      className={`summary-value ${
                        isOverBudget ? "over-budget" : "under-budget"
                      }`}
                    >
                      ₹{Math.abs(remainingBudget).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Budget Progress Bar */}
                  <div className="budget-progress">
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${
                          isOverBudget ? "over" : "under"
                        }`}
                        style={{
                          width: `${Math.min(budgetUtilization, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="progress-label">
                      {budgetUtilization.toFixed(1)}% utilized{" "}
                      {isOverBudget && "(over budget)"}
                    </div>
                  </div>
                </>
              ) : (
                <div className="summary-row">
                  <span className="summary-label text-gray-400 text-xs">
                    Loading budget data...
                  </span>
                </div>
              )}
            </div>

            {/* Spending Distribution Pie Chart */}
            {categoryChartData.length > 0 ? (
              <div className="overview-pie-section">
                <h4 className="section-title">Spending Distribution</h4>
                <div className="overview-pie-container">
                  <svg viewBox="0 0 220 220" className="overview-pie-chart">
                    {(() => {
                      let currentAngle = -90;
                      return categoryChartData.map((data) => {
                        const angle = (data.percentage / 100) * 360;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + angle;
                        currentAngle = endAngle;

                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = (endAngle * Math.PI) / 180;
                        // Expand slightly on hover
                        const radius = hoveredCategory === data.type ? 85 : 80;
                        const x1 = 110 + radius * Math.cos(startRad);
                        const y1 = 110 + radius * Math.sin(startRad);
                        const x2 = 110 + radius * Math.cos(endRad);
                        const y2 = 110 + radius * Math.sin(endRad);
                        const largeArc = angle > 180 ? 1 : 0;

                        return (
                          <g key={data.type}>
                            <path
                              d={`M 110 110 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={categoryColors[data.type]}
                              opacity={
                                hoveredCategory === null ||
                                hoveredCategory === data.type
                                  ? "0.9"
                                  : "0.4"
                              }
                              className="pie-slice-interactive"
                              onMouseEnter={() => setHoveredCategory(data.type)}
                              onMouseLeave={() => setHoveredCategory(null)}
                            />
                          </g>
                        );
                      });
                    })()}
                    {/* Center circle */}
                    <circle cx="110" cy="110" r="50" fill="white" />
                    {hoveredCategory ? (
                      <>
                        <text
                          x="110"
                          y="100"
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight="600"
                          fill="#1f2937"
                        >
                          {categoryLabels[hoveredCategory]}
                        </text>
                        <text
                          x="110"
                          y="115"
                          textAnchor="middle"
                          fontSize="14"
                          fontWeight="700"
                          fill={categoryColors[hoveredCategory]}
                        >
                          ₹
                          {(
                            budgetBreakdown.overall[hoveredCategory]! / 1000
                          ).toFixed(1)}
                          K
                        </text>
                        <text
                          x="110"
                          y="128"
                          textAnchor="middle"
                          fontSize="10"
                          fill="#6b7280"
                        >
                          {(
                            (budgetBreakdown.overall[hoveredCategory]! /
                              totalBudget) *
                            100
                          ).toFixed(1)}
                          %
                        </text>
                      </>
                    ) : (
                      <>
                        <text
                          x="110"
                          y="105"
                          textAnchor="middle"
                          fontSize="14"
                          fontWeight="600"
                          fill="#1f2937"
                        >
                          Total
                        </text>
                        <text
                          x="110"
                          y="120"
                          textAnchor="middle"
                          fontSize="13"
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
            ) : (
              <div className="overview-pie-section">
                <h4 className="section-title">Spending Distribution</h4>
                <div className="text-center py-8 text-gray-400 text-xs">
                  No spending data available
                </div>
              </div>
            )}

            {/* Top Spending Categories */}
            <div className="top-categories">
              <h4 className="section-title">Top Spending</h4>
              {topCategories.map(([type, amount], index) => (
                <div key={type} className="category-item">
                  <div className="category-rank">{index + 1}</div>
                  <span className="category-icon-sm">
                    {categoryIcons[type as ActivityType]}
                  </span>
                  <span className="category-name">
                    {categoryLabels[type as ActivityType]}
                  </span>
                  <span className="category-amount">
                    ₹{amount.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            {/* Daily Spending Chart
            {dayWiseTotals.length > 0 ? (
              <div className="daily-spending-section">
                <h4 className="section-title">Daily Spending</h4>
                <div className="daily-bars-chart">
                  {dayWiseTotals.map(({ day, total }) => {
                    const heightPercentage = (total / maxDayAmount) * 100;
                    // Ensure minimum 15% height for visibility while maintaining proportions
                    const displayHeight = Math.max(heightPercentage, 15);
                    return (
                      <div key={day} className="daily-bar-wrapper">
                        <div className="daily-bar-container">
                          <div
                            className="daily-bar"
                            style={{
                              height: `${displayHeight}%`,
                            }}
                          >
                            <div className="daily-bar-amount">
                              ₹{(total / 1000).toFixed(1)}K
                            </div>
                          </div>
                        </div>
                        <div className="daily-bar-label">Day {day}</div>
                        <div className="daily-bar-total">
                          ₹{total.toLocaleString("en-IN")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="daily-spending-section">
                <h4 className="section-title">Daily Spending</h4>
                <div className="text-center py-8 text-gray-400 text-xs">
                  No daily spending data available
                </div>
              </div>
            )} */}
          </>
        )}

        {/* Category Mode */}
        {viewMode === "category" && (
          <>
            {/* Interactive Pie Chart with Hover */}
            {categoryChartData.length > 0 && (
              <div className="pie-chart-container">
                <svg viewBox="0 0 220 220" className="pie-chart">
                  {(() => {
                    let currentAngle = -90;
                    return categoryChartData.map((data) => {
                      const angle = (data.percentage / 100) * 360;
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + angle;
                      currentAngle = endAngle;

                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;
                      const radius = hoveredCategory === data.type ? 85 : 80;
                      const x1 = 110 + radius * Math.cos(startRad);
                      const y1 = 110 + radius * Math.sin(startRad);
                      const x2 = 110 + radius * Math.cos(endRad);
                      const y2 = 110 + radius * Math.sin(endRad);
                      const largeArc = angle > 180 ? 1 : 0;

                      return (
                        <g key={data.type}>
                          <path
                            d={`M 110 110 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={categoryColors[data.type]}
                            opacity={
                              hoveredCategory === null ||
                              hoveredCategory === data.type
                                ? "0.9"
                                : "0.3"
                            }
                            className="pie-slice-interactive"
                            onMouseEnter={() => setHoveredCategory(data.type)}
                            onMouseLeave={() => setHoveredCategory(null)}
                          />
                        </g>
                      );
                    });
                  })()}
                  {/* Center circle */}
                  <circle cx="110" cy="110" r="55" fill="white" />
                  {hoveredCategory ? (
                    <>
                      <text
                        x="110"
                        y="100"
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="600"
                        fill="#1f2937"
                      >
                        {categoryLabels[hoveredCategory]}
                      </text>
                      <text
                        x="110"
                        y="115"
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="700"
                        fill={categoryColors[hoveredCategory]}
                      >
                        ₹
                        {(
                          budgetBreakdown.overall[hoveredCategory]! / 1000
                        ).toFixed(1)}
                        K
                      </text>
                      <text
                        x="110"
                        y="128"
                        textAnchor="middle"
                        fontSize="10"
                        fill="#6b7280"
                      >
                        {(
                          (budgetBreakdown.overall[hoveredCategory]! /
                            totalBudget) *
                          100
                        ).toFixed(1)}
                        %
                      </text>
                    </>
                  ) : (
                    <>
                      <text
                        x="110"
                        y="105"
                        textAnchor="middle"
                        fontSize="16"
                        fontWeight="600"
                        fill="#1f2937"
                      >
                        ₹{(totalBudget / 1000).toFixed(0)}K
                      </text>
                      <text
                        x="110"
                        y="120"
                        textAnchor="middle"
                        fontSize="10"
                        fill="#6b7280"
                      >
                        Total Spending
                      </text>
                    </>
                  )}
                </svg>
              </div>
            )}

            {/* Budget Comparison Banner */}
            {userBudget && (
              <div
                className={`budget-comparison ${
                  isOverBudget ? "over" : "under"
                }`}
              >
                <div className="comparison-icon">
                  {isOverBudget ? "⚠️" : "✅"}
                </div>
                <div className="comparison-text">
                  {isOverBudget ? (
                    <>
                      <strong>Over Budget</strong>
                      <span>
                        ₹{Math.abs(remainingBudget).toLocaleString("en-IN")}{" "}
                        above your limit
                      </span>
                    </>
                  ) : (
                    <>
                      <strong>Within Budget</strong>
                      <span>
                        ₹{remainingBudget.toLocaleString("en-IN")} remaining
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Category List with Bars */}
            <div className="category-list">
              {Object.entries(budgetBreakdown.overall)
                .filter(([_, amount]) => amount > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([type, amount]) => {
                  const percentage = (amount / totalBudget) * 100;
                  return (
                    <div
                      key={type}
                      className="category-bar-item"
                      onMouseEnter={() =>
                        setHoveredCategory(type as ActivityType)
                      }
                      onMouseLeave={() => setHoveredCategory(null)}
                    >
                      <div className="category-bar-header">
                        <div className="category-info">
                          <span className="category-icon-sm">
                            {categoryIcons[type as ActivityType]}
                          </span>
                          <span className="category-name">
                            {categoryLabels[type as ActivityType]}
                          </span>
                        </div>
                        <span className="category-amount-sm">
                          ₹{amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="category-bar-bg">
                        <div
                          className="category-bar-fill"
                          style={{
                            width: `${(amount / maxCategoryAmount) * 100}%`,
                            backgroundColor:
                              categoryColors[type as ActivityType],
                          }}
                        >
                          <span className="category-percentage">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {/* Day-wise Mode */}
        {viewMode === "daywise" && (
          <>
            {/* Day-wise Bar Chart with proper heights */}
            {dayWiseTotals.length > 0 && (
              <div className="day-chart">
                {dayWiseTotals.map(({ day, total }) => {
                  const heightPercentage = (total / maxDayAmount) * 100;
                  const displayHeight = Math.max(heightPercentage, 15); // Minimum 15% for visibility
                  return (
                    <div key={day} className="day-chart-item">
                      <div className="day-chart-bar-container">
                        <div
                          className="day-chart-bar"
                          style={{
                            height: `${displayHeight}%`,
                          }}
                        >
                          <div className="day-chart-amount">
                            ₹{(total / 1000).toFixed(1)}K
                          </div>
                        </div>
                      </div>
                      <div className="day-chart-label">Day {day}</div>
                      <div className="day-chart-total">
                        ₹{total.toLocaleString("en-IN")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Day-wise Breakdown */}
            <div className="day-breakdown">
              {Object.entries(budgetBreakdown.dayWise)
                .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                .map(([day, breakdown]) => {
                  const dayTotal = Object.values(breakdown).reduce(
                    (sum, val) => sum + val,
                    0
                  );
                  return (
                    <div key={day} className="day-breakdown-card">
                      <div className="day-breakdown-header">
                        <span className="day-number">Day {day}</span>
                        <span className="day-total">
                          ₹{dayTotal.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="day-breakdown-items">
                        {Object.entries(breakdown)
                          .filter(([_, amount]) => amount > 0)
                          .sort((a, b) => b[1] - a[1])
                          .map(([type, amount]) => (
                            <div key={type} className="day-breakdown-item">
                              <span className="breakdown-icon">
                                {categoryIcons[type as ActivityType]}
                              </span>
                              <span className="breakdown-label">
                                {categoryLabels[type as ActivityType]}
                              </span>
                              <span className="breakdown-amount">
                                ₹{amount.toLocaleString("en-IN")}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .budget-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: white;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .panel-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
          padding: 12px 16px;
          margin: 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
            "Segoe UI", Roboto, sans-serif;
        }

        .view-tabs {
          display: flex;
          gap: 4px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.02);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .tab {
          flex: 1;
          padding: 6px 12px;
          font-size: 0.6875rem;
          font-weight: 600;
          color: #6b7280;
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab:hover {
          background: rgba(0, 0, 0, 0.04);
          color: #1f2937;
        }

        .tab.active {
          background: white;
          color: #3b82f6;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .panel-content::-webkit-scrollbar {
          width: 4px;
        }

        .panel-content::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.04);
        }

        .panel-content::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 2px;
        }

        /* Summary Card */
        .summary-card {
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.05) 0%,
            rgba(147, 51, 234, 0.05) 100%
          );
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .summary-row:last-child {
          margin-bottom: 0;
        }

        .summary-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }

        .summary-value {
          font-size: 0.875rem;
          font-weight: 700;
          color: #1f2937;
        }

        .summary-value.primary {
          font-size: 1.125rem;
          color: #3b82f6;
        }

        .summary-value.over-budget {
          color: #ef4444;
        }

        .summary-value.under-budget {
          color: #10b981;
        }

        .budget-progress {
          margin-top: 12px;
        }

        .progress-bar {
          height: 6px;
          background: rgba(0, 0, 0, 0.08);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .progress-fill.under {
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
        }

        .progress-fill.over {
          background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
        }

        .progress-label {
          font-size: 0.6875rem;
          color: #6b7280;
          margin-top: 4px;
          text-align: right;
        }

        /* Overview Pie Chart */
        .overview-pie-section {
          margin-bottom: 12px;
        }

        .section-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .overview-pie-container {
          display: flex;
          justify-content: center;
          padding: 8px 0;
        }

        .overview-pie-chart {
          width: 220px;
          height: 220px;
        }

        /* Top Categories */
        .top-categories {
          margin-bottom: 12px;
        }

        .category-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 8px;
          margin-bottom: 6px;
        }

        .category-rank {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          font-size: 0.625rem;
          font-weight: 700;
          border-radius: 50%;
        }

        .category-icon-sm {
          font-size: 1rem;
        }

        .category-name {
          flex: 1;
          font-size: 0.75rem;
          font-weight: 500;
          color: #1f2937;
        }

        .category-amount {
          font-size: 0.75rem;
          font-weight: 700;
          color: #059669;
        }

        /* Daily Spending Chart */
        .daily-spending-section {
          margin-bottom: 12px;
        }

        .daily-bars-chart {
          display: flex;
          gap: 6px;
          align-items: flex-end;
          height: 140px;
          padding: 12px 8px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 8px;
        }

        .daily-bar-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 0;
        }

        .daily-bar-container {
          width: 100%;
          height: 100px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .daily-bar {
          width: 100%;
          max-width: 32px;
          background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 4px 4px 0 0;
          min-height: 8px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 4px;
          transition: all 0.3s ease;
          position: relative;
        }

        .daily-bar:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        .daily-bar-amount {
          font-size: 0.5625rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .daily-bar-label {
          font-size: 0.625rem;
          font-weight: 600;
          color: #1f2937;
        }

        .daily-bar-total {
          font-size: 0.5625rem;
          font-weight: 500;
          color: #6b7280;
          margin-top: 2px;
        }

        /* Pie Chart Interactive */
        .pie-chart-container {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
        }

        .pie-chart {
          width: 220px;
          height: 220px;
        }

        .pie-slice {
          transition: opacity 0.2s ease;
        }

        .pie-slice-interactive {
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .pie-slice-interactive:hover {
          filter: brightness(1.1);
        }

        /* Budget Comparison Banner */
        .budget-comparison {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .budget-comparison.under {
          background: linear-gradient(
            135deg,
            rgba(16, 185, 129, 0.1) 0%,
            rgba(5, 150, 105, 0.05) 100%
          );
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .budget-comparison.over {
          background: linear-gradient(
            135deg,
            rgba(239, 68, 68, 0.1) 0%,
            rgba(220, 38, 38, 0.05) 100%
          );
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .comparison-icon {
          font-size: 1.5rem;
        }

        .comparison-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .comparison-text strong {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #1f2937;
        }

        .comparison-text span {
          font-size: 0.6875rem;
          color: #6b7280;
        }

        /* Category List */
        .category-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .category-bar-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: transform 0.2s ease;
        }

        .category-bar-item:hover {
          transform: translateX(2px);
        }

        .category-bar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .category-info {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .category-amount-sm {
          font-size: 0.75rem;
          font-weight: 700;
          color: #059669;
        }

        .category-bar-bg {
          height: 24px;
          background: rgba(0, 0, 0, 0.04);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }

        .category-bar-fill {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 8px;
          transition: width 0.3s ease;
        }

        .category-percentage {
          font-size: 0.625rem;
          font-weight: 700;
          color: white;
        }

        /* Day Chart */
        .day-chart {
          display: flex;
          gap: 10px;
          align-items: flex-end;
          justify-content: space-around;
          height: 180px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 10px;
          margin-bottom: 16px;
        }

        .day-chart-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          max-width: 60px;
        }

        .day-chart-bar-container {
          height: 120px; /* FIXED: Changed from flex: 1 to fixed height for proper bar scaling */
          width: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .day-chart-bar {
          width: 100%;
          max-width: 40px;
          background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 6px 6px 0 0;
          min-height: 20px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 6px;
          transition: all 0.3s ease;
        }

        .day-chart-bar:hover {
          transform: translateY(-4px);
          filter: brightness(1.1);
        }

        .day-chart-amount {
          font-size: 0.625rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .day-chart-label {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #1f2937;
        }

        .day-chart-total {
          font-size: 0.625rem;
          font-weight: 500;
          color: #6b7280;
        }

        /* Day Breakdown */
        .day-breakdown {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .day-breakdown-card {
          background: rgba(0, 0, 0, 0.02);
          border-radius: 8px;
          padding: 10px;
        }

        .day-breakdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .day-number {
          font-size: 0.75rem;
          font-weight: 700;
          color: #1f2937;
        }

        .day-total {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #3b82f6;
        }

        .day-breakdown-items {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .day-breakdown-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px;
        }

        .breakdown-icon {
          font-size: 0.875rem;
        }

        .breakdown-label {
          flex: 1;
          font-size: 0.6875rem;
          color: #6b7280;
        }

        .breakdown-amount {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #059669;
        }
      `}</style>
    </div>
  );
}
