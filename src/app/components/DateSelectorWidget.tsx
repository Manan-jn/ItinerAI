"use client";

import { useState, useRef, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiChevronDown } from "react-icons/fi";
import { MdFlight, MdHotel } from "react-icons/md";

interface DateSelectorWidgetProps {
  isVisible: boolean;
  onToggle: () => void;
}

interface DateInfo {
  date: Date;
  flightPrice: number;
  hotelPrice: number;
  isToday?: boolean;
  isSelected?: boolean;
}

interface PreferredTimeCard {
  id: string;
  timeRange: string;
  reason: string;
  tag: string;
  description: string;
  flightPrice: number;
  hotelPrice: number;
}

const preferredTimeOptions: PreferredTimeCard[] = [
  {
    id: "1",
    timeRange: "1-10 Dec",
    reason: "Less Rush",
    tag: "Recommended",
    description: "Fewer tourists, better availability, and peaceful experience",
    flightPrice: 1230,
    hotelPrice: 890,
  },
  {
    id: "2",
    timeRange: "2-12 Dec",
    reason: "Cheap",
    tag: "Budget Friendly",
    description: "Best prices for flights and hotels during this period",
    flightPrice: 980,
    hotelPrice: 650,
  },
  {
    id: "3",
    timeRange: "15-25 Dec",
    reason: "Local Festival",
    tag: "Cultural Event",
    description: "Experience authentic local festivals and celebrations",
    flightPrice: 1450,
    hotelPrice: 1200,
  },
  {
    id: "4",
    timeRange: "5-15 Jan",
    reason: "Best Weather",
    tag: "Perfect Climate",
    description: "Ideal weather conditions for outdoor activities",
    flightPrice: 1180,
    hotelPrice: 820,
  },
];

export default function DateSelectorWidget({
  isVisible,
  onToggle,
}: DateSelectorWidgetProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const preferredTimeScrollRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [fromCity, setFromCity] = useState("Select City");
  const [toCity, setToCity] = useState("Select City");
  const [flightClass, setFlightClass] = useState("Economy");
  const [hotelRating, setHotelRating] = useState("3 Star");
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [showFlightClassDropdown, setShowFlightClassDropdown] = useState(false);
  const [showHotelRatingDropdown, setShowHotelRatingDropdown] = useState(false);

  // Placeholder data with more options
  const cities = [
    "New Delhi",
    "Mumbai",
    "Bangalore",
    "Kolkata",
    "Chennai",
    "Hyderabad",
    "Pune",
    "Ahmedabad",
    "Jaipur",
    "Lucknow",
  ];
  const flightClasses = [
    "Economy",
    "Premium Economy",
    "Business",
    "First Class",
  ];
  const hotelRatings = ["Budget", "3 Star", "4 Star", "5 Star", "Luxury"];

  // Generate calendar dates for current month with fixed placeholder prices
  const generateCalendarDates = (): DateInfo[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const dates: DateInfo[] = [];

    // Fixed price patterns for consistent display
    const flightPrices = [850, 920, 780, 1100, 950, 820, 1050, 890, 760, 980];
    const hotelPrices = [450, 520, 380, 600, 550, 420, 650, 490, 360, 580];

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const priceIndex = (day - 1) % flightPrices.length;
      dates.push({
        date,
        flightPrice: flightPrices[priceIndex],
        hotelPrice: hotelPrices[priceIndex],
        isToday: isToday(date),
        isSelected: selectedDate?.toDateString() === date.toDateString(),
      });
    }

    return dates;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleCardClick = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  // Handle scroll detection
  useEffect(() => {
    const scrollContainer = preferredTimeScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const calendarDates = generateCalendarDates();
  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (!isVisible) return null;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-6 min-h-0">
        {/* Left Sidebar - Filters */}
        <div className="col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Filters</h3>

          {/* Flights Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-blue-200 shadow-sm relative z-20 overflow-visible">
            <div className="flex items-center gap-2 mb-3">
              <MdFlight className="text-blue-600" size={18} />
              <h4 className="text-xs font-semibold text-gray-800">Flights</h4>
            </div>

            {/* From City */}
            <div className="mb-3 relative">
              <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">
                From
              </label>
              <button
                onClick={() => setShowFromDropdown(!showFromDropdown)}
                className="w-full text-left px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all text-xs flex items-center justify-between"
              >
                <span className="truncate text-gray-700">{fromCity}</span>
                <FiChevronDown
                  className={`ml-2 transition-transform text-gray-500 ${
                    showFromDropdown ? "rotate-180" : ""
                  }`}
                  size={12}
                />
              </button>
              {showFromDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setFromCity(city);
                        setShowFromDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 transition-colors"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* To City */}
            <div className="mb-3 relative">
              <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">
                To
              </label>
              <button
                onClick={() => setShowToDropdown(!showToDropdown)}
                className="w-full text-left px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all text-xs flex items-center justify-between"
              >
                <span className="truncate text-gray-700">{toCity}</span>
                <FiChevronDown
                  className={`ml-2 transition-transform text-gray-500 ${
                    showToDropdown ? "rotate-180" : ""
                  }`}
                  size={12}
                />
              </button>
              {showToDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setToCity(city);
                        setShowToDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 transition-colors"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Flight Class */}
            <div className="relative">
              <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">
                Class
              </label>
              <button
                onClick={() =>
                  setShowFlightClassDropdown(!showFlightClassDropdown)
                }
                className="w-full text-left px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all text-xs flex items-center justify-between"
              >
                <span className="truncate text-gray-700">{flightClass}</span>
                <FiChevronDown
                  className={`ml-2 transition-transform text-gray-500 ${
                    showFlightClassDropdown ? "rotate-180" : ""
                  }`}
                  size={12}
                />
              </button>
              {showFlightClassDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {flightClasses.map((cls) => (
                    <button
                      key={cls}
                      onClick={() => {
                        setFlightClass(cls);
                        setShowFlightClassDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 transition-colors"
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stay Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-purple-200 shadow-sm relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <MdHotel className="text-purple-600" size={18} />
              <h4 className="text-xs font-semibold text-gray-800">Stay</h4>
            </div>

            {/* City */}
            <div className="mb-3">
              <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">
                City
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700">
                {toCity !== "Select City" ? toCity : "Select destination"}
              </div>
            </div>

            {/* Hotel Rating */}
            <div className="relative">
              <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">
                Rating
              </label>
              <button
                onClick={() =>
                  setShowHotelRatingDropdown(!showHotelRatingDropdown)
                }
                className="w-full text-left px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-all text-xs flex items-center justify-between"
              >
                <span className="truncate text-gray-700">{hotelRating}</span>
                <FiChevronDown
                  className={`ml-2 transition-transform text-gray-500 ${
                    showHotelRatingDropdown ? "rotate-180" : ""
                  }`}
                  size={12}
                />
              </button>
              {showHotelRatingDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {hotelRatings.map((rating) => (
                    <button
                      key={rating}
                      onClick={() => {
                        setHotelRating(rating);
                        setShowHotelRatingDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-purple-50 transition-colors"
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center - Calendar */}
        <div className="col-span-7 flex flex-col bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-blue-200 shadow-xl overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white/70 rounded-lg transition-all"
            >
              <FiChevronLeft className="text-gray-700" size={20} />
            </button>
            <h2 className="text-lg font-bold text-gray-800">{monthName}</h2>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white/70 rounded-lg transition-all"
            >
              <FiChevronRight className="text-gray-700" size={20} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-gray-500 pb-2"
                >
                  {day}
                </div>
              ))}

              {/* Empty cells for first week alignment */}
              {Array.from({
                length: new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth(),
                  1
                ).getDay(),
              }).map((_, idx) => (
                <div key={`empty-${idx}`} />
              ))}

              {/* Date cells */}
              {calendarDates.map((dateInfo, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDateClick(dateInfo.date)}
                  className={`relative p-3 rounded-xl transition-all duration-300 ${
                    dateInfo.isSelected
                      ? "bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg scale-105 ring-2 ring-blue-400"
                      : dateInfo.isToday
                      ? "bg-blue-100 border-2 border-blue-400"
                      : "bg-white/60 hover:bg-white hover:shadow-md border border-gray-200"
                  }`}
                >
                  {/* Date Number */}
                  <div
                    className={`text-sm font-bold mb-2 ${
                      dateInfo.isSelected
                        ? "text-white"
                        : dateInfo.isToday
                        ? "text-blue-600"
                        : "text-gray-800"
                    }`}
                  >
                    {dateInfo.date.getDate()}
                  </div>

                  {/* Prices */}
                  <div className="space-y-1">
                    {/* Flight Price */}
                    <div className="flex items-center justify-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          dateInfo.isSelected ? "bg-red-400" : "bg-red-500"
                        }`}
                      />
                      <span
                        className={`text-[9px] font-semibold ${
                          dateInfo.isSelected ? "text-white" : "text-red-700"
                        }`}
                      >
                        ${dateInfo.flightPrice}
                      </span>
                    </div>

                    {/* Hotel Price */}
                    <div className="flex items-center justify-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          dateInfo.isSelected
                            ? "bg-yellow-400"
                            : "bg-yellow-500"
                        }`}
                      />
                      <span
                        className={`text-[9px] font-semibold ${
                          dateInfo.isSelected ? "text-white" : "text-yellow-700"
                        }`}
                      >
                        ${dateInfo.hotelPrice}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Preferred Time */}
        <div className="col-span-3 flex flex-col relative">
          <div className="flex-1 flex flex-col bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-purple-200 shadow-xl overflow-hidden relative">
            <div className="p-4 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
              <h3 className="text-sm font-bold text-gray-800">
                Preferred Time
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">
                Best times to visit based on your preferences
              </p>
            </div>

            {/* Scrollable Cards Container */}
            <div
              ref={preferredTimeScrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 pb-20"
              style={{ maxHeight: "calc(100vh - 300px)" }}
            >
              {preferredTimeOptions.map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`bg-gradient-to-br from-white to-purple-50 rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                    expandedCard === card.id
                      ? "border-purple-500 shadow-xl ring-2 ring-purple-300"
                      : "border-purple-200 hover:border-purple-400 hover:shadow-lg"
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-800">
                          {card.timeRange}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              card.reason === "Less Rush"
                                ? "bg-green-100 text-green-700"
                                : card.reason === "Cheap"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {card.tag}
                          </span>
                        </div>
                      </div>
                      <FiChevronDown
                        className={`text-gray-500 transition-transform ${
                          expandedCard === card.id ? "rotate-180" : ""
                        }`}
                        size={16}
                      />
                    </div>

                    {/* Prices */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-xs font-semibold text-red-700">
                          ${card.flightPrice}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="text-xs font-semibold text-yellow-700">
                          ${card.hotelPrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      expandedCard === card.id ? "max-h-40" : "max-h-0"
                    }`}
                  >
                    <div className="px-3 pb-3 border-t border-purple-100 pt-3">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {card.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-purple-600">
                          Reason:
                        </span>
                        <span className="text-[10px] text-gray-700">
                          {card.reason}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chatbox - Bottom Center of Preferred Time Component */}
          <div
            className={`absolute bottom-4 left-0 right-0 flex justify-center px-4 transition-all duration-300 z-50 ${
              isScrolling
                ? "opacity-0 translate-y-4"
                : "opacity-100 translate-y-0"
            }`}
          >
            <div className="chatbox-container-date">
              <input
                type="text"
                placeholder="Ask ItinerAI"
                className="chatbox-input-date"
              />
              <button className="chatbox-submit-btn-date">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chatbox Styles - Light Theme matching FlashcardsWidgetWhiteTheme */}
      <style jsx>{`
        .chatbox-container-date {
          width: min(260px, 100%);
          height: 50px;
          display: flex;
          align-items: center;
          background: linear-gradient(
            135deg,
            rgba(147, 51, 234, 0.1) 0%,
            rgba(219, 39, 119, 0.05) 100%
          );
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 25px;
          padding: 8px;
          gap: 8px;
          box-shadow: 0 4px 16px rgba(147, 51, 234, 0.15),
            0 2px 8px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          z-index: 30;
          animation: slideUpFade 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          border: 1.5px solid rgba(147, 51, 234, 0.2);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .chatbox-container-date:focus-within {
          width: min(420px, 100%);
          box-shadow: 0 8px 24px rgba(147, 51, 234, 0.25),
            0 4px 12px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          background: linear-gradient(
            135deg,
            rgba(147, 51, 234, 0.15) 0%,
            rgba(219, 39, 119, 0.08) 100%
          );
          border-color: rgba(147, 51, 234, 0.35);
        }

        .chatbox-input-date {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          padding: 0 12px;
          font-size: 0.9rem;
          color: #6b21a8;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
          font-weight: 500;
          height: 34px;
        }

        .chatbox-input-date::placeholder {
          color: rgba(147, 51, 234, 0.5);
          font-weight: 400;
        }

        .chatbox-input-date:focus {
          color: #581c87;
        }

        .chatbox-submit-btn-date {
          background: linear-gradient(135deg, #9333ea 0%, #db2777 100%);
          border: 1px solid rgba(147, 51, 234, 0.3);
          border-radius: 50%;
          width: 34px;
          height: 34px;
          min-width: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(147, 51, 234, 0.3);
        }

        .chatbox-submit-btn-date:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed 0%, #be185d 100%);
          border-color: rgba(124, 58, 237, 0.5);
          transform: scale(1.08);
          box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
        }

        .chatbox-submit-btn-date:active:not(:disabled) {
          transform: scale(0.95);
        }

        .chatbox-submit-btn-date:disabled {
          background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
          border-color: rgba(156, 163, 175, 0.3);
          cursor: not-allowed;
          box-shadow: none;
        }

        .chatbox-submit-btn-date svg {
          transition: transform 0.2s ease;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
        }

        .chatbox-submit-btn-date:hover:not(:disabled) svg {
          transform: translateX(2px);
        }

        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
