"use client";

import { useState, useEffect, useRef } from "react";

interface BudgetSelectorProps {
  onBudgetChange?: (budget: {
    amount: number;
    currency: string;
    isFlexible: boolean;
    budgetType: "fixed" | "relaxed";
  }) => void;
}

const BUDGET_OPTIONS = [
  { value: 10000, label: "10k", display: "₹10,000 /per person" },
  { value: 20000, label: "20k", display: "₹20,000 /per person" },
  { value: 30000, label: "30k", display: "₹30,000 /per person" },
  { value: 50000, label: "50k", display: "₹50,000 /per person" },
  { value: 75000, label: "75k", display: "₹75,000 /per person" },
  { value: 100000, label: "100k", display: "₹1,00,000 /per person" },
  { value: 200000, label: "200k", display: "₹2,00,000 /per person" },
  { value: 500000, label: "500k", display: "₹5,00,000 /per person" },
];

export default function BudgetSelector({
  onBudgetChange,
}: BudgetSelectorProps) {
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(30000);
  const [isFlexible, setIsFlexible] = useState(false);
  const [budgetType, setBudgetType] = useState<"fixed" | "relaxed">("fixed");
  const [, setPanelWidth] = useState(320);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Set client-side flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Detect panel width for responsive design
  useEffect(() => {
    const detectWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setPanelWidth(width);
      }
    };

    detectWidth();
    const resizeObserver = new ResizeObserver(detectWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notify parent of changes
  useEffect(() => {
    if (onBudgetChange) {
      const amount = customAmount
        ? parseInt(customAmount) || 0
        : selectedAmount;
      onBudgetChange({
        amount,
        currency: "INR",
        isFlexible,
        budgetType,
      });
    }
  }, [customAmount, selectedAmount, isFlexible, budgetType, onBudgetChange]);

  // Panel width is tracked but these variables are not currently used
  // const isSmallPanel = panelWidth < 350;
  // const isVerySmallPanel = panelWidth < 300;

  const handleCustomAmountChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");
    setCustomAmount(numericValue);
    if (numericValue) {
      setSelectedAmount(0); // Clear selected preset when custom amount is entered
    }
  };

  const handlePresetSelection = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(""); // Clear custom amount when preset is selected
    setIsDropdownOpen(false);
  };

  const formatCurrency = (amount: number) => {
    if (!isClient) {
      // Return simple format for server-side rendering to prevent hydration mismatch
      return `₹${amount.toLocaleString()} /per person`;
    }
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
    return `${formatted} /per person`;
  };

  const getCurrentBudgetDisplay = () => {
    if (budgetType === "relaxed") {
      return "No budget limits";
    }
    if (customAmount) {
      const amount = parseInt(customAmount);
      return amount ? formatCurrency(amount) : "Enter amount";
    }
    return selectedAmount ? formatCurrency(selectedAmount) : "Select budget";
  };

  return (
    <div
      ref={containerRef}
      className="w-full bg-gradient-to-br from-gray-900/60 to-gray-900/40 border border-gray-700/50 rounded-xl backdrop-blur-sm"
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Budget</h3>
          <div className="flex items-center space-x-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                budgetType === "relaxed"
                  ? "bg-purple-400"
                  : customAmount || selectedAmount
                  ? "bg-green-400"
                  : "bg-gray-600"
              }`}
            ></div>
            <span className="text-xs text-gray-400">
              {budgetType === "relaxed" ? "Relaxed" : "Fixed"}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Budget Input Section */}
        <div className="space-y-3">
          {/* Custom Amount Input */}
          <div
            className={`relative ${
              budgetType === "relaxed" ? "opacity-40" : "opacity-100"
            }`}
          >
            <label
              className={`block text-xs text-gray-400 mb-1.5 ${
                budgetType === "relaxed" ? "text-gray-500" : ""
              }`}
            >
              Enter Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <span
                  className={`text-xs ${
                    budgetType === "relaxed" ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  ₹
                </span>
              </div>
              <input
                type="text"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="Enter amount"
                disabled={budgetType === "relaxed"}
                className={`w-full pl-6 pr-3 py-2 text-sm bg-gray-800/60 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 ${
                  budgetType === "relaxed"
                    ? "cursor-not-allowed bg-gray-900/40 border-gray-700/30 text-gray-500 placeholder-gray-600"
                    : ""
                }`}
              />
            </div>
            {budgetType === "relaxed" && (
              <div className="absolute inset-0 bg-gray-800/20 rounded-lg pointer-events-none"></div>
            )}
          </div>

          {/* OR Divider */}
          <div
            className={`relative flex items-center justify-center py-1.5 ${
              budgetType === "relaxed" ? "opacity-40" : "opacity-100"
            }`}
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/50"></div>
            </div>
            <div className="relative bg-gray-900 px-2">
              <span
                className={`text-xs ${
                  budgetType === "relaxed" ? "text-gray-600" : "text-gray-400"
                }`}
              >
                OR
              </span>
            </div>
          </div>

          {/* Preset Budget Dropdown */}
          <div
            className={`relative ${
              budgetType === "relaxed" ? "opacity-40" : "opacity-100"
            }`}
            ref={dropdownRef}
          >
            <label
              className={`block text-xs text-gray-400 mb-1.5 ${
                budgetType === "relaxed" ? "text-gray-500" : ""
              }`}
            >
              Quick Select
            </label>
            <button
              onClick={() =>
                budgetType !== "relaxed" && setIsDropdownOpen(!isDropdownOpen)
              }
              disabled={budgetType === "relaxed"}
              className={`w-full px-3 py-2 text-sm bg-gray-800/60 border border-gray-600/50 rounded-lg text-left text-white hover:border-blue-500/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 flex items-center justify-between ${
                budgetType === "relaxed"
                  ? "cursor-not-allowed bg-gray-900/40 border-gray-700/30 text-gray-500"
                  : ""
              }`}
            >
              <span
                className={
                  selectedAmount && !customAmount
                    ? "text-white"
                    : "text-gray-500"
                }
              >
                {selectedAmount && !customAmount
                  ? formatCurrency(selectedAmount)
                  : "Select preset amount"}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : "rotate-0"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {budgetType === "relaxed" && (
              <div className="absolute inset-0 bg-gray-800/20 rounded-lg pointer-events-none"></div>
            )}

            {/* Dropdown Menu */}
            {isDropdownOpen && budgetType !== "relaxed" && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                <div className="p-1">
                  {BUDGET_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePresetSelection(option.value)}
                      className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-700/70 transition-all duration-200 flex items-center justify-between rounded-md group ${
                        selectedAmount === option.value && !customAmount
                          ? "bg-gradient-to-r from-blue-600/30 to-cyan-600/20 text-blue-300"
                          : "text-white hover:text-blue-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                            selectedAmount === option.value && !customAmount
                              ? "bg-blue-400"
                              : "bg-gray-600 group-hover:bg-blue-500"
                          }`}
                        ></div>
                        <span>{option.display}</span>
                      </div>
                      {selectedAmount === option.value && !customAmount && (
                        <svg
                          className="w-3 h-3 text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current Budget Display */}
          <div
            className={`p-2.5 rounded-lg border backdrop-blur-sm ${
              budgetType === "relaxed"
                ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20"
                : "bg-gradient-to-r from-gray-800/60 to-gray-800/40 border-gray-600/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    budgetType === "relaxed"
                      ? "bg-purple-400 animate-pulse"
                      : customAmount || selectedAmount
                      ? "bg-green-400 animate-pulse"
                      : "bg-gray-600"
                  }`}
                ></div>
                <span
                  className={`text-xs ${
                    budgetType === "relaxed"
                      ? "text-purple-300"
                      : "text-gray-400"
                  }`}
                >
                  Budget
                </span>
              </div>
              <span
                className={`text-sm font-medium ${
                  budgetType === "relaxed"
                    ? "text-purple-300"
                    : customAmount || selectedAmount
                    ? "text-white"
                    : "text-gray-500"
                }`}
              >
                {getCurrentBudgetDisplay()}
              </span>
            </div>
          </div>

          {/* Budget Type Buttons */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Budget Preference
            </label>
            <div className="flex space-x-2">
              <button
                onMouseEnter={() => setHoveredButton("relaxed")}
                onMouseLeave={() => setHoveredButton(null)}
                onClick={() => {
                  setBudgetType("relaxed");
                  setIsFlexible(true);
                  // Clear budget values when relaxed is selected
                  setCustomAmount("");
                  setSelectedAmount(0);
                  setIsDropdownOpen(false);
                }}
                className={`group flex-1 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 flex flex-col items-center justify-center space-y-1 hover:scale-[1.02] ${
                  budgetType === "relaxed"
                    ? "bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20"
                    : "bg-gray-800/60 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50 hover:border-purple-500/50"
                }`}
              >
                <div
                  className={`p-1.5 rounded-full transition-all duration-200 ${
                    budgetType === "relaxed"
                      ? "bg-white/20"
                      : hoveredButton === "relaxed"
                      ? "bg-purple-500/20"
                      : "bg-gray-700/50"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M18 6L6 18M6 6l12 12"
                      opacity="0.3"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold">Relaxed</div>
                  <div className="text-xs opacity-75">No limits</div>
                </div>
              </button>

              <button
                onMouseEnter={() => setHoveredButton("fixed")}
                onMouseLeave={() => setHoveredButton(null)}
                onClick={() => {
                  setBudgetType("fixed");
                  setIsFlexible(false);
                }}
                className={`group flex-1 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 flex flex-col items-center justify-center space-y-1 hover:scale-[1.02] ${
                  budgetType === "fixed"
                    ? "bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20"
                    : "bg-gray-800/60 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50 hover:border-blue-500/50"
                }`}
              >
                <div
                  className={`p-1.5 rounded-full transition-all duration-200 ${
                    budgetType === "fixed"
                      ? "bg-white/20"
                      : hoveredButton === "fixed"
                      ? "bg-blue-500/20"
                      : "bg-gray-700/50"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold">Budget</div>
                  <div className="text-xs opacity-75">Stick to it</div>
                </div>
              </button>
            </div>
          </div>

          {/* Budget Type Info */}
          {budgetType === "relaxed" && (
            <div className="p-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg transition-all duration-300">
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0 p-1 bg-purple-500/20 rounded">
                  <svg
                    className="w-3 h-3 text-purple-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-purple-300 font-medium text-sm">
                    🌟 Sky&apos;s the limit!
                  </p>
                  <p className="text-purple-200 opacity-80 text-xs">
                    Best experiences regardless of cost
                  </p>
                </div>
              </div>
            </div>
          )}

          {budgetType === "fixed" && (
            <div className="p-2.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg transition-all duration-300">
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0 p-1 bg-blue-500/20 rounded">
                  <svg
                    className="w-3 h-3 text-blue-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-blue-300 font-medium text-sm">
                    💰 Budget-conscious planning
                  </p>
                  <p className="text-blue-200 opacity-80 text-xs">
                    Maximize value within your budget
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Apply Button */}
          <div className="pt-4 border-t border-gray-700/50">
            <button
              disabled={
                budgetType === "fixed" && !customAmount && !selectedAmount
              }
              className="group w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:via-cyan-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:hover:scale-100 disabled:shadow-none relative overflow-hidden text-sm py-2.5 px-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="relative flex items-center justify-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>APPLY</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
