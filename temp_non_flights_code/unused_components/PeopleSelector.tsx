"use client";

import { useState, useEffect, useRef } from "react";

interface PeopleSelectorProps {
  onSelectionChange?: (selection: {
    rooms: number;
    adults: number;
    children: number;
    isFlexible: boolean;
  }) => void;
}

export default function PeopleSelector({
  onSelectionChange,
}: PeopleSelectorProps) {
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [isFlexible, setIsFlexible] = useState(false);
  const [, setPanelWidth] = useState(320);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Notify parent of changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange({
        rooms,
        adults,
        children,
        isFlexible,
      });
    }
  }, [rooms, adults, children, isFlexible, onSelectionChange]);

  // Panel width is tracked but these variables are not currently used
  // const isSmallPanel = panelWidth < 350;
  // const isVerySmallPanel = panelWidth < 300;

  const incrementValue = (
    value: number,
    setter: (val: number) => void,
    max: number = 10
  ) => {
    if (value < max) {
      setter(value + 1);
    }
  };

  const decrementValue = (
    value: number,
    setter: (val: number) => void,
    min: number = 0
  ) => {
    if (value > min) {
      setter(value - 1);
    }
  };

  const CounterRow = ({
    label,
    subtitle,
    value,
    onIncrement,
    onDecrement,
    disabled = false,
  }: {
    label: string;
    subtitle?: string;
    value: number;
    onIncrement: () => void;
    onDecrement: () => void;
    disabled?: boolean;
  }) => (
    <div
      className={`flex items-center justify-between py-2 transition-all duration-300 relative ${
        disabled ? "opacity-40" : "opacity-100"
      }`}
    >
      {disabled && (
        <div className="absolute inset-0 bg-gray-800/20 rounded-lg pointer-events-none"></div>
      )}
      <div className="flex-1 relative z-10">
        <div
          className={`text-sm font-medium flex items-center gap-2 ${
            disabled ? "text-gray-500" : "text-white"
          }`}
        >
          {label}
          {disabled && (
            <svg
              className="w-3 h-3 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0-6v2m0-6v2m-3-2h6M9 21h6a2 2 0 002-2V5a2 2 0 00-2-2H9a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>
        {subtitle && (
          <div
            className={`text-xs ${
              disabled ? "text-gray-600" : "text-gray-400"
            }`}
          >
            {subtitle}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 relative z-10">
        <button
          onClick={disabled ? undefined : onDecrement}
          disabled={disabled}
          className={`w-7 h-7 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
            disabled
              ? "border-gray-700 text-gray-600 cursor-not-allowed"
              : "border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-400 hover:scale-105"
          }`}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </button>

        <span
          className={`text-base font-semibold min-w-[1.5rem] text-center ${
            disabled ? "text-gray-500" : "text-white"
          }`}
        >
          {value}
        </span>

        <button
          onClick={disabled ? undefined : onIncrement}
          disabled={disabled}
          className={`w-7 h-7 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
            disabled
              ? "border-gray-700 text-gray-600 cursor-not-allowed"
              : "border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-400 hover:scale-105"
          }`}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="w-full bg-gradient-to-br from-gray-900/60 to-gray-900/40 border border-gray-700/50 rounded-xl backdrop-blur-sm"
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Guests</h3>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <span className="text-xs text-gray-400">
              {adults + children} {adults + children === 1 ? "guest" : "guests"}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Flexibility Toggle */}
        <div className="mb-3">
          <label className="flex items-center space-x-2.5 cursor-pointer group">
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                checked={isFlexible}
                onChange={(e) => {
                  console.log(
                    "Flexible room toggle changed:",
                    e.target.checked
                  );
                  setIsFlexible(e.target.checked);
                }}
                className="sr-only"
              />
              <div
                className={`relative w-9 h-5 rounded-full transition-all duration-300 shadow-inner ${
                  isFlexible
                    ? "bg-blue-600 shadow-blue-400/50"
                    : "bg-gray-700 shadow-gray-500/30"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm ${
                    isFlexible ? "left-4" : "left-0.5"
                  }`}
                />
              </div>
            </div>
            <div className="flex-1">
              <span
                className={`text-sm font-medium group-hover:text-white transition-colors ${
                  isFlexible ? "text-blue-300" : "text-gray-300"
                }`}
              >
                Flexible rooms
              </span>
              <div
                className={`text-xs mt-0.5 transition-colors ${
                  isFlexible ? "text-blue-400" : "text-gray-500"
                }`}
              >
                {isFlexible
                  ? "Room selection disabled"
                  : "All options available"}
              </div>
            </div>
          </label>
          {isFlexible && (
            <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg transition-all duration-300">
              <p className="text-blue-300 text-xs">
                ✨ We&apos;ll suggest the best room configuration
              </p>
            </div>
          )}
        </div>

        {/* Room Selection */}
        <div className="space-y-1">
          <CounterRow
            label="Rooms"
            value={rooms}
            onIncrement={() => incrementValue(rooms, setRooms, 5)}
            onDecrement={() => decrementValue(rooms, setRooms, 1)}
            disabled={isFlexible}
          />

          <div className="border-t border-gray-800/50 my-2"></div>

          <CounterRow
            label="Adults"
            value={adults}
            onIncrement={() => incrementValue(adults, setAdults, 20)}
            onDecrement={() => decrementValue(adults, setAdults, 1)}
            disabled={false}
          />

          <CounterRow
            label="Children"
            subtitle="0 - 17 Years Old"
            value={children}
            onIncrement={() => incrementValue(children, setChildren, 10)}
            onDecrement={() => decrementValue(children, setChildren, 0)}
            disabled={false}
          />
        </div>

        {/* Additional Info */}
        {children > 0 && (
          <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-300 text-xs">
              Provide children ages for best options and prices
            </p>
          </div>
        )}

        {/* Apply Button */}
        <div className="mt-4 pt-3 border-t border-gray-700/50">
          <button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] text-sm py-2.5 px-4">
            APPLY
          </button>
        </div>
      </div>
    </div>
  );
}
