"use client";

import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiUser, FiCalendar, FiX } from "react-icons/fi";
import { MdFlight } from "react-icons/md";

interface FlightsWidgetProps {
  isVisible: boolean;
  onToggle: () => void;
}

// Simple Date Picker Component
function DatePicker({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (date: string) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      year: date.getFullYear().toString(),
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    };
  };

  const displayDate = formatDisplayDate(selectedDate);
  const calendarDays = generateCalendarDays();
  const today = new Date();

  return (
    <div className="relative" ref={datePickerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-2 border border-gray-200 rounded-lg hover:border-blue-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
      >
        <div className="flex items-center gap-2">
          <FiCalendar className="text-gray-400 flex-shrink-0" size={14} />
          <div className="flex-1 min-w-0">
            {selectedDate && displayDate ? (
              <>
                <div className="text-sm font-bold text-gray-900">
                  {displayDate.day}
                </div>
                <div className="text-[10px] text-gray-500">
                  {displayDate.month} {displayDate.year}
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-500">{placeholder}</div>
            )}
          </div>
          <FiChevronDown
            className={`text-gray-400 transition-transform flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
            size={12}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-auto right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[60] w-[280px]">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">
                {today.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <FiX size={14} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  key={day}
                  className="text-center text-[10px] font-medium text-gray-500 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const isCurrentMonth = date.getMonth() === today.getMonth();
                const isToday = date.toDateString() === today.toDateString();
                const isPast = date < today && !isToday;
                const isSelected =
                  selectedDate === date.toISOString().split("T")[0];

                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (!isPast) {
                        const dateStr = date.toISOString().split("T")[0];
                        setSelectedDate(dateStr);
                        onChange(dateStr);
                        setIsOpen(false);
                      }
                    }}
                    disabled={isPast}
                    className={`
                      p-1.5 text-xs rounded-md transition-all
                      ${
                        isSelected
                          ? "bg-blue-500 text-white font-semibold"
                          : isToday
                          ? "bg-blue-100 text-blue-600 font-semibold"
                          : isCurrentMonth
                          ? "text-gray-900 hover:bg-gray-100"
                          : "text-gray-300"
                      }
                      ${
                        isPast
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Traveller Selector Component
function TravellerSelector({
  travellers,
  travelClass,
  onTravellersChange,
  onClassChange,
}: {
  travellers: number;
  travelClass: string;
  onTravellersChange: (count: number) => void;
  onClassChange: (className: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const classes = ["Economy", "Premium Economy", "Business", "First"];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-2 border border-gray-200 rounded-lg hover:border-blue-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
      >
        <div className="flex items-center gap-2">
          <FiUser className="text-gray-400 flex-shrink-0" size={14} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-900">
              {travellers} Traveller{travellers > 1 ? "s" : ""}
            </div>
            <div className="text-[10px] text-gray-500">{travelClass}</div>
          </div>
          <FiChevronDown
            className={`text-gray-400 transition-transform flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
            size={12}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-auto mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[60] w-[240px]">
          <div className="p-3">
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Travellers
              </label>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTravellersChange(Math.max(1, travellers - 1));
                  }}
                  className="w-8 h-8 rounded-full border-2 border-gray-400 flex items-center justify-center hover:bg-gray-50 text-gray-700 font-bold text-base bg-white"
                >
                  −
                </button>
                <span className="text-base font-semibold text-gray-900 min-w-[24px] text-center">
                  {travellers}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTravellersChange(Math.min(9, travellers + 1));
                  }}
                  className="w-8 h-8 rounded-full border-2 border-gray-400 flex items-center justify-center hover:bg-gray-50 text-gray-700 font-bold text-base bg-white"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Class
              </label>
              <div className="space-y-1">
                {classes.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => {
                      onClassChange(cls);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all ${
                      travelClass === cls
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlightsWidget({
  isVisible,
  onToggle,
}: FlightsWidgetProps) {
  const [travellers, setTravellers] = useState(1);
  const [travelClass, setTravelClass] = useState("Economy");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [from, setFrom] = useState("Delhi");
  const [to, setTo] = useState("Mumbai");

  if (!isVisible) return null;

  return (
    <div className="w-full h-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-base font-semibold">Search Flights</h2>
          <button
            onClick={onToggle}
            className="text-white hover:text-gray-200 transition-colors p-1"
          >
            <FiX size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Flight Search Form */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* From and To Row with Swap */}
            <div className="flex items-end gap-2 flex-1">
              {/* From */}
              <div className="relative flex-1">
                <label className="block text-[10px] text-gray-500 mb-1.5 uppercase font-medium">
                  FROM
                </label>
                <div className="p-2 border border-gray-200 rounded-lg bg-white">
                  <div className="flex items-center gap-2">
                    <MdFlight
                      className="text-gray-400 flex-shrink-0"
                      size={14}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900">
                        {from}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">
                        [DEL] Indira Gandhi Intl
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex items-center justify-center pb-2 flex-shrink-0">
                <button
                  onClick={() => {
                    const temp = from;
                    setFrom(to);
                    setTo(temp);
                  }}
                  className="bg-white hover:bg-gray-100 rounded-full p-1.5 border border-gray-200 shadow-sm transition-all hover:shadow-md"
                  title="Swap airports"
                >
                  <svg
                    className="w-3.5 h-3.5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                </button>
              </div>

              {/* To */}
              <div className="relative flex-1">
                <label className="block text-[10px] text-gray-500 mb-1.5 uppercase font-medium">
                  TO
                </label>
                <div className="p-2 border border-gray-200 rounded-lg bg-white">
                  <div className="flex items-center gap-2">
                    <MdFlight
                      className="text-gray-400 flex-shrink-0 transform rotate-90"
                      size={14}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900">
                        {to}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">
                        [BOM] Chhatrapati Shivaji Intl
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Departure Date */}
            <div className="relative flex-1 lg:max-w-[200px]">
              <label className="block text-[10px] text-gray-500 mb-1.5 uppercase font-medium">
                DEPARTURE
              </label>
              <DatePicker
                value={departureDate}
                onChange={setDepartureDate}
                placeholder="Select date"
              />
            </div>

            {/* Return Date */}
            <div className="relative flex-1 lg:max-w-[200px]">
              <label className="block text-[10px] text-gray-500 mb-1.5 uppercase font-medium">
                RETURN
              </label>
              <DatePicker
                value={returnDate}
                onChange={setReturnDate}
                placeholder="Select date"
              />
            </div>
          </div>

          {/* Travellers & Class + Search Button */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-[10px] text-gray-500 mb-1.5 uppercase font-medium">
                TRAVELLERS & CLASS
              </label>
              <TravellerSelector
                travellers={travellers}
                travelClass={travelClass}
                onTravellersChange={setTravellers}
                onClassChange={setTravelClass}
              />
            </div>

            <div className="flex items-end">
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2">
                <span>SEARCH FLIGHTS</span>
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
