"use client";

import { useState, useRef, useEffect } from "react";
import { DayItinerary } from "./ItineraryWidget";

interface DaySliderProps {
  days: DayItinerary[];
  currentDayIndex: number;
  totalDays: number;
  onDaySelect: (dayIndex: number) => void;
  onAddDay: () => void;
  onInsertDay: (afterDayIndex: number) => void; // NEW: Insert day after specific index
  loadingDayIndex: number | null;
  pendingConveyanceDays: Set<number>; // NEW: Set of pending day numbers
  onDeleteDay?: (dayNumber: number) => void; // NEW: Delete day callback
  deletingDayNumber?: number | null; // NEW: Day number being deleted (for animation)
}

export default function DaySlider({
  days,
  currentDayIndex,
  totalDays,
  onDaySelect,
  onAddDay,
  onInsertDay,
  loadingDayIndex,
  pendingConveyanceDays,
  onDeleteDay,
  deletingDayNumber = null,
}: DaySliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredPlusIndex, setHoveredPlusIndex] = useState<number | null>(null);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);

  // Auto-scroll to current day when it changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeCard = container.querySelector(
        `[data-day-index="${currentDayIndex}"]`
      );
      if (activeCard) {
        activeCard.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentDayIndex]);

  // Handle scroll state for animations
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Generate all day cards including unloaded ones AND pending days
  // Calculate total cards: loaded days + pending days
  const allDayNumbers = new Set<number>();

  // Add all existing day numbers
  days.forEach((day) => allDayNumbers.add(day.day));

  // Add all pending day numbers
  pendingConveyanceDays.forEach((dayNum) => allDayNumbers.add(dayNum));

  // Add placeholder days up to totalDays
  for (let i = 1; i <= totalDays; i++) {
    allDayNumbers.add(i);
  }

  // Sort and create card objects
  const sortedDayNumbers = Array.from(allDayNumbers).sort((a, b) => a - b);

  const allDayCards = sortedDayNumbers.map((dayNumber, arrayIndex) => {
    const dayData = days.find((d) => d.day === dayNumber);
    const isActive = currentDayIndex === arrayIndex;
    const isLoading = loadingDayIndex === arrayIndex;
    const isLoaded = !!dayData;
    const isPending = pendingConveyanceDays.has(dayNumber);

    return {
      dayNumber,
      dayData,
      isActive,
      isLoading,
      isLoaded,
      isPending,
      index: arrayIndex,
    };
  });

  // Get actual card size (no scaling) to prevent layout shifts
  const getCardSize = (index: number, isActive: boolean) => {
    const isHovered = hoveredIndex === index;

    // Always use fixed sizes - no transform scaling
    if (isExpanded || isActive || isHovered) {
      return {
        width: "w-28",
        height: "h-24",
      };
    }
    return {
      width: "w-20",
      height: "h-16",
    };
  };

  // Handle plus button click with animation
  const handlePlusClick = async (afterIndex: number) => {
    setAnimatingIndex(afterIndex);

    // Trigger insert
    await onInsertDay(afterIndex);

    // Clear animation after complete
    setTimeout(() => {
      setAnimatingIndex(null);
    }, 800);
  };

  return (
    <div
      className="relative w-full max-w-full"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        setIsExpanded(false);
        setHoveredIndex(null);
        setHoveredPlusIndex(null);
      }}
    >
      {/* Scroll Container - Strictly constrained with horizontal scroll */}
      <div className="w-full max-w-full overflow-hidden">
        <div
          ref={scrollContainerRef}
          className={`flex items-center gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth ${
            isExpanded ? "py-3 px-4" : "py-2 px-3"
          }`}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            width: "100%",
            maxWidth: "100%",
          }}
        >
          {allDayCards.map(
            (
              {
                dayNumber,
                dayData,
                isActive,
                isLoading,
                isLoaded,
                isPending,
                index,
              },
              idx
            ) => {
              const isHovered = hoveredIndex === index;
              const isPlusHovered = hoveredPlusIndex === idx;
              const isAnimating = animatingIndex === idx;
              const isDeleting = deletingDayNumber === dayNumber; // NEW: Check if this day is being deleted

              const size = getCardSize(index, isActive);

              return (
                <div
                  key={dayNumber}
                  className={`flex items-center flex-shrink-0 ${
                    isPending ? "animate-fade-in-scale" : ""
                  } ${isDeleting ? "animate-delete-fade-out" : ""}`}
                >
                  {/* Day Card */}
                  <button
                    data-day-index={index}
                    onClick={() => !isLoading && onDaySelect(index)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    disabled={isLoading}
                    className={`
                      relative group flex flex-col items-center justify-center
                      ${size.width} ${size.height} rounded-xl
                      transition-all duration-200 ease-out
                      ${
                        isActive
                          ? "bg-white/80 backdrop-blur-md border-2 border-purple-500 shadow-lg shadow-purple-200/50 ring-2 ring-purple-300/30"
                          : isPending
                          ? "bg-orange-50/70 backdrop-blur-sm border-2 border-orange-300 shadow-md"
                          : isLoaded
                          ? "bg-white/50 backdrop-blur-sm border border-gray-300/50 hover:bg-white/70 hover:border-purple-300 hover:shadow-md"
                          : "bg-gray-100/40 backdrop-blur-sm border border-dashed border-gray-300/50 hover:border-gray-400/50"
                      }
                      ${isLoading ? "cursor-wait" : "cursor-pointer"}
                    `}
                  >
                    {/* Glassmorphic overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl pointer-events-none"></div>

                    {/* Loading Spinner */}
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl z-10">
                        <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                      </div>
                    )}

                    {/* Active Pulse Indicator */}
                    {isActive && !isLoading && (
                      <div className="absolute -top-1 -right-1 z-20">
                        <div className="relative w-3 h-3">
                          <div className="absolute inset-0 bg-purple-500 rounded-full"></div>
                          <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-75"></div>
                        </div>
                      </div>
                    )}

                    {/* Delete Icon - Top Right - Hidden for first and last day */}
                    {!isLoading &&
                      isLoaded &&
                      onDeleteDay &&
                      idx !== 0 &&
                      idx !== allDayCards.length - 1 && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDay(dayNumber);
                          }}
                          className="absolute -top-2 -right-2 z-20 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Delete day"
                        >
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </div>
                      )}

                    {/* Content */}
                    <div
                      className={`text-center transition-all duration-200 relative z-10 ${
                        isExpanded || isActive || isHovered
                          ? "scale-100 opacity-100"
                          : "scale-90 opacity-90"
                      }`}
                    >
                      {isPending ? (
                        <>
                          {/* Pending Day */}
                          <div
                            className={`font-bold mb-0.5 transition-all duration-200 ${
                              isExpanded || isActive || isHovered
                                ? "text-xs"
                                : "text-[10px]"
                            } ${
                              isActive ? "text-purple-600" : "text-orange-600"
                            }`}
                          >
                            DAY {dayNumber}
                          </div>

                          {(isExpanded || isActive || isHovered) && (
                            <div
                              className={`text-[9px] font-semibold px-2 py-0.5 rounded-full mb-0.5 transition-all duration-200 ${
                                isActive
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              Pending
                            </div>
                          )}

                          {/* Compact indicator when not expanded */}
                          {!isExpanded && !isActive && !isHovered && (
                            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mx-auto mt-1 animate-pulse"></div>
                          )}
                        </>
                      ) : isLoaded ? (
                        <>
                          {/* Day Number */}
                          <div
                            className={`font-bold mb-0.5 transition-all duration-200 ${
                              isExpanded || isActive || isHovered
                                ? "text-xs"
                                : "text-[10px]"
                            } ${
                              isActive
                                ? "text-purple-600"
                                : "text-gray-700 group-hover:text-purple-600"
                            }`}
                          >
                            DAY {dayNumber}
                          </div>

                          {/* Mini Stats - Show on expanded/hover/active */}
                          {(isExpanded || isActive || isHovered) && (
                            <div
                              className={`text-[9px] font-semibold px-2 py-0.5 rounded-full mb-0.5 transition-all duration-200 ${
                                isActive
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-gray-100 text-gray-600 group-hover:bg-purple-50 group-hover:text-purple-600"
                              }`}
                            >
                              {dayData!.stops.length} stops
                            </div>
                          )}

                          {/* Date - Show on expanded/hover/active */}
                          {(isExpanded || isActive || isHovered) && (
                            <div
                              className={`text-[8px] transition-all duration-200 ${
                                isActive
                                  ? "text-purple-500"
                                  : "text-gray-500 group-hover:text-gray-700"
                              }`}
                            >
                              {dayData!.date.split(",")[0]}
                            </div>
                          )}

                          {/* Compact indicator when not expanded */}
                          {!isExpanded && !isActive && !isHovered && (
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mx-auto mt-1"></div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Unloaded Day */}
                          <div
                            className={`font-bold text-gray-400 mb-0.5 ${
                              isExpanded || isHovered
                                ? "text-xs"
                                : "text-[10px]"
                            }`}
                          >
                            DAY {dayNumber}
                          </div>
                          {(isExpanded || isHovered) && (
                            <div className="text-[8px] text-gray-400 font-medium">
                              Click to load
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Subtle hover glow effect */}
                    {!isActive && !isLoading && isHovered && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-100/30 to-indigo-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </button>

                  {/* Plus Button Between Cards - Fixed size to prevent layout shift */}
                  {/* Only show between cards, not after the last card */}
                  {idx < allDayCards.length - 1 && (
                    <div className="flex-shrink-0 mx-2 w-10 h-10 flex items-center justify-center">
                      <button
                        onClick={() => handlePlusClick(idx)}
                        onMouseEnter={() => setHoveredPlusIndex(idx)}
                        onMouseLeave={() => setHoveredPlusIndex(null)}
                        className={`
                          rounded-full transition-all duration-200
                          flex items-center justify-center group/plus
                          ${
                            isExpanded || isPlusHovered || isAnimating
                              ? "w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-md hover:shadow-lg"
                              : "w-6 h-6 bg-gray-300/50"
                          }
                          ${
                            isAnimating
                              ? "scale-110 animate-pulse"
                              : "scale-100"
                          }
                        `}
                        title="Insert day here"
                      >
                        <svg
                          className={`
                          transition-all duration-300
                          ${
                            isExpanded || isPlusHovered || isAnimating
                              ? "w-5 h-5 text-white"
                              : "w-3 h-3 text-gray-300"
                          }
                          ${isPlusHovered ? "rotate-90" : "rotate-0"}
                        `}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Gradient fade indicators */}
      <div
        className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r from-white/60 to-transparent pointer-events-none transition-all duration-300 ${
          isExpanded ? "w-8" : "w-6"
        }`}
      ></div>
      <div
        className={`absolute right-0 top-0 bottom-0 bg-gradient-to-l from-white/60 to-transparent pointer-events-none transition-all duration-300 ${
          isExpanded ? "w-8" : "w-6"
        }`}
      ></div>

      {/* CSS for hiding scrollbar and animations */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        @keyframes fade-in-scale {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(-10px);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-fade-in-scale {
          animation: fade-in-scale 0.5s ease-out forwards;
        }

        @keyframes delete-fade-out {
          0% {
            opacity: 1;
            transform: scale(1) translateX(0);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.9) translateX(-10px);
          }
          100% {
            opacity: 0;
            transform: scale(0.7) translateX(-20px);
          }
        }

        .animate-delete-fade-out {
          animation: delete-fade-out 0.3s ease-in forwards;
        }
      `}</style>
    </div>
  );
}
