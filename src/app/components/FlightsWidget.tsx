"use client";

import { useState, useRef, useEffect } from "react";
import {
  FiChevronDown,
  FiUser,
  FiCalendar,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { MdFlight, MdTrain, MdDirectionsBus } from "react-icons/md";

interface FlightsWidgetProps {
  isVisible: boolean;
  onToggle: () => void;
}

// Available cities
const AVAILABLE_CITIES = [
  { name: "Mumbai", code: "BOM", airport: "Chhatrapati Shivaji Intl" },
  { name: "Bangalore", code: "BLR", airport: "Kempegowda International" },
  { name: "New Delhi", code: "DEL", airport: "Indira Gandhi Intl" },
  { name: "Agra", code: "AGR", airport: "Agra Airport" },
  { name: "Leh", code: "IXL", airport: "Kushok Bakula Rimpochee" },
];

// City Selector Component
function CitySelector({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (city: string) => void;
  label: string;
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

  const selectedCity = AVAILABLE_CITIES.find((city) => city.name === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-2 border border-gray-200 rounded-lg bg-white hover:border-blue-300 transition-all"
      >
        <div className="flex items-center gap-2">
          <MdFlight className="text-gray-400 flex-shrink-0" size={14} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-900">
              {selectedCity?.name || "Select City"}
            </div>
            <div className="text-[10px] text-gray-500 truncate">
              {selectedCity
                ? `[${selectedCity.code}] ${selectedCity.airport}`
                : "Choose from available cities"}
            </div>
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
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[60]">
          <div className="p-2 max-h-[250px] overflow-y-auto">
            {AVAILABLE_CITIES.map((city) => (
              <button
                key={city.code}
                onClick={() => {
                  onChange(city.name);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md transition-all ${
                  value === city.name
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="text-xs font-semibold">{city.name}</div>
                <div className="text-[10px] text-gray-500">
                  [{city.code}] {city.airport}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
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

  // Generate calendar days for current displayed month
  const generateCalendarDays = () => {
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

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
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
              <button
                onClick={goToPreviousMonth}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-1 rounded transition-all"
                title="Previous month"
              >
                <FiChevronLeft size={16} />
              </button>
              <h3 className="font-semibold text-gray-900 text-sm">
                {new Date(currentYear, currentMonth).toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    year: "numeric",
                  }
                )}
              </h3>
              <button
                onClick={goToNextMonth}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-1 rounded transition-all"
                title="Next month"
              >
                <FiChevronRight size={16} />
              </button>
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
                const isDisplayedMonth = date.getMonth() === currentMonth;
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
                          : isDisplayedMonth
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

// Flight/Train/Bus Data Interface
interface TransportOption {
  id: string;
  number: string;
  operator: string; // Airline/Train name/Bus operator
  departureDate: string;
  arrivalDate: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
}

// Transport results grouped by mode
interface SearchResultsData {
  flights: TransportOption[];
  trains: TransportOption[];
  buses: TransportOption[];
}

// API Response Types
interface APIFlightData {
  flight_number: string;
  airline: string;
  daparture_date: string;
  departure_time: string;
  arival_date: string;
  arrival_time: string;
  duration: string;
  price: string;
}

interface APITrainData {
  train_number: string;
  train_name: string;
  daparture_date: string;
  departure_time: string;
  arival_date: string;
  arrival_time: string;
  duration: string;
  price: string;
}

interface APIConveyanceResponse {
  user_id: string;
  session_id: string;
  message: {
    response_type: string;
    message: string;
    conveyances: {
      from_city: string;
      to_city: string;
      conveyance_details: {
        flights?: APIFlightData[];
        trains?: APITrainData[];
      };
    };
  };
}

// Sample data for demonstration
const sampleFlights: TransportOption[] = [
  {
    id: "F1",
    number: "AI 202",
    operator: "Air India",
    departureDate: "24 Oct 2025",
    arrivalDate: "24 Oct 2025",
    departureTime: "06:30 AM",
    arrivalTime: "08:45 AM",
    duration: "2h 15m",
    price: 4500,
  },
  {
    id: "F2",
    number: "6E 345",
    operator: "IndiGo",
    departureDate: "24 Oct 2025",
    arrivalDate: "24 Oct 2025",
    departureTime: "09:15 AM",
    arrivalTime: "11:30 AM",
    duration: "2h 15m",
    price: 3800,
  },
  {
    id: "F3",
    number: "SG 892",
    operator: "SpiceJet",
    departureDate: "24 Oct 2025",
    arrivalDate: "24 Oct 2025",
    departureTime: "12:00 PM",
    arrivalTime: "02:20 PM",
    duration: "2h 20m",
    price: 3500,
  },
  {
    id: "F4",
    number: "UK 915",
    operator: "Vistara",
    departureDate: "24 Oct 2025",
    arrivalDate: "24 Oct 2025",
    departureTime: "03:30 PM",
    arrivalTime: "05:50 PM",
    duration: "2h 20m",
    price: 5200,
  },
  {
    id: "F5",
    number: "AI 671",
    operator: "Air India",
    departureDate: "24 Oct 2025",
    arrivalDate: "24 Oct 2025",
    departureTime: "06:45 PM",
    arrivalTime: "09:00 PM",
    duration: "2h 15m",
    price: 4800,
  },
  {
    id: "F6",
    number: "6E 789",
    operator: "IndiGo",
    departureDate: "24 Oct 2025",
    arrivalDate: "24 Oct 2025",
    departureTime: "08:30 PM",
    arrivalTime: "10:45 PM",
    duration: "2h 15m",
    price: 4100,
  },
];

const sampleTrains: TransportOption[] = [
  {
    id: "T1",
    number: "12952",
    operator: "Mumbai Rajdhani",
    departureDate: "24 Oct 2025",
    arrivalDate: "25 Oct 2025",
    departureTime: "04:25 PM",
    arrivalTime: "08:35 AM",
    duration: "16h 10m",
    price: 2800,
  },
  {
    id: "T2",
    number: "12954",
    operator: "August Kranti Rajdhani",
    departureDate: "24 Oct 2025",
    arrivalDate: "25 Oct 2025",
    departureTime: "05:00 PM",
    arrivalTime: "08:50 AM",
    duration: "15h 50m",
    price: 2750,
  },
  {
    id: "T3",
    number: "12450",
    operator: "Goa Sampark Kranti",
    departureDate: "24 Oct 2025",
    arrivalDate: "25 Oct 2025",
    departureTime: "03:00 PM",
    arrivalTime: "06:45 AM",
    duration: "15h 45m",
    price: 1800,
  },
  {
    id: "T4",
    number: "12902",
    operator: "Gujarat Mail",
    departureDate: "24 Oct 2025",
    arrivalDate: "25 Oct 2025",
    departureTime: "06:55 PM",
    arrivalTime: "09:05 AM",
    duration: "14h 10m",
    price: 1200,
  },
  {
    id: "T5",
    number: "22926",
    operator: "Paschim Express",
    departureDate: "24 Oct 2025",
    arrivalDate: "25 Oct 2025",
    departureTime: "07:25 PM",
    arrivalTime: "11:50 AM",
    duration: "16h 25m",
    price: 950,
  },
  {
    id: "T6",
    number: "12138",
    operator: "Punjab Mail",
    departureDate: "24 Oct 2025",
    arrivalDate: "25 Oct 2025",
    departureTime: "07:10 PM",
    arrivalTime: "10:40 AM",
    duration: "15h 30m",
    price: 1100,
  },
];

const sampleBuses: TransportOption[] = [
  {
    id: "B1",
    number: "DL-MUM-001",
    operator: "Sharma Travels",
    departureDate: "24 Oct 2025",
    arrivalDate: "25 Oct 2025",
    departureTime: "08:00 PM",
    arrivalTime: "12:00 PM",
    duration: "16h",
    price: 1200,
  },
  {
    id: "B2",
    number: "DL-MUM-045",
    operator: "VRL Travels",
    departureDate: "24 Oct 2025",
    arrivalDate: "25 Oct 2025",
    departureTime: "09:30 PM",
    arrivalTime: "01:30 PM",
    duration: "16h",
    price: 1400,
  },
  {
    id: "B3",
    number: "DL-MUM-089",
    operator: "Neeta Travels",
    departureDate: "24 Oct 2025",
    arrivalDate: "25 Oct 2025",
    departureTime: "07:00 PM",
    arrivalTime: "11:30 AM",
    duration: "16h 30m",
    price: 1100,
  },
  {
    id: "B4",
    number: "DL-MUM-112",
    operator: "Orange Travels",
    departureDate: "24 Oct 2025",
    arrivalDate: "25 Oct 2025",
    departureTime: "10:00 PM",
    arrivalTime: "02:00 PM",
    duration: "16h",
    price: 1350,
  },
  {
    id: "B5",
    number: "DL-MUM-156",
    operator: "SRS Travels",
    departureDate: "24 Oct 2025",
    arrivalDate: "25 Oct 2025",
    departureTime: "08:30 PM",
    arrivalTime: "12:45 PM",
    duration: "16h 15m",
    price: 1250,
  },
  {
    id: "B6",
    number: "DL-MUM-198",
    operator: "RedBus Express",
    departureDate: "24 Oct 2025",
    arrivalDate: "25 Oct 2025",
    departureTime: "09:00 PM",
    arrivalTime: "01:00 PM",
    duration: "16h",
    price: 1500,
  },
];

// Compact Transport Card Component for Column Layout
function TransportCard({
  option,
  mode,
}: {
  option: TransportOption;
  mode: "flights" | "trains" | "buses";
}) {
  const getIcon = () => {
    switch (mode) {
      case "flights":
        return <MdFlight className="text-blue-500" size={18} />;
      case "trains":
        return <MdTrain className="text-green-500" size={18} />;
      case "buses":
        return <MdDirectionsBus className="text-orange-500" size={18} />;
    }
  };

  const getBorderColor = () => {
    switch (mode) {
      case "flights":
        return "hover:border-blue-400";
      case "trains":
        return "hover:border-green-400";
      case "buses":
        return "hover:border-orange-400";
    }
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-3 ${getBorderColor()} hover:shadow-md transition-all duration-200 cursor-pointer group mb-3`}
    >
      {/* Header Row: Icon, Number, Operator */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
        <div className="p-1.5 bg-gray-50 rounded group-hover:bg-blue-50 transition-colors flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-gray-900">{option.number}</div>
          <div className="text-[10px] text-gray-500 truncate">
            {option.operator}
          </div>
        </div>
      </div>

      {/* Dates Row */}
      <div className="space-y-2 mb-3">
        <div>
          <div className="text-[9px] text-gray-400 uppercase font-medium">
            Departure Date
          </div>
          <div className="text-[10px] font-semibold text-gray-900">
            {option.departureDate}
          </div>
        </div>
        <div>
          <div className="text-[9px] text-gray-400 uppercase font-medium">
            Arrival Date
          </div>
          <div className="text-[10px] font-semibold text-gray-900">
            {option.arrivalDate}
          </div>
        </div>
      </div>

      {/* Time and Duration */}
      <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[9px] text-gray-400 uppercase font-medium">
              Departure
            </div>
            <div className="text-xs font-bold text-gray-900">
              {option.departureTime}
            </div>
          </div>
          <div>
            <div className="text-[9px] text-gray-400 uppercase font-medium">
              Arrival
            </div>
            <div className="text-xs font-bold text-gray-900">
              {option.arrivalTime}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-0.5 bg-gradient-to-r from-gray-200 via-blue-300 to-gray-200"></div>
          <div className="text-[9px] text-gray-500 font-medium">
            {option.duration}
          </div>
          <div className="flex-1 h-0.5 bg-gradient-to-r from-gray-200 via-blue-300 to-gray-200"></div>
        </div>
      </div>

      {/* Price */}
      <div className="text-center mb-2">
        <div className="text-sm font-bold text-blue-600">₹{option.price}</div>
        <div className="text-[9px] text-gray-500">per person</div>
      </div>

      {/* Book Button */}
      <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-[10px] py-2 rounded-md transition-all shadow-sm hover:shadow-md">
        Book Now
      </button>
    </div>
  );
}

// Search Results Component - Three Columns Side by Side
function SearchResults({ data }: { data: SearchResultsData }) {
  return (
    <div className="mt-6">
      {/* Results Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Search Results</h3>
        <p className="text-sm text-gray-500">
          Compare all available transport options side by side
        </p>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Flights Column */}
        <div className="bg-gradient-to-b from-blue-50 to-white rounded-xl p-4 border-2 border-blue-200">
          {/* Column Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-blue-300">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MdFlight className="text-blue-600" size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  Recommended Flights
                </h4>
                <p className="text-xs text-gray-500">
                  {data.flights.length} options
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable Cards */}
          <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {data.flights.length > 0 ? (
              data.flights.map((flight) => (
                <TransportCard key={flight.id} option={flight} mode="flights" />
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">No flights available</p>
              </div>
            )}
          </div>
        </div>

        {/* Trains Column */}
        <div className="bg-gradient-to-b from-green-50 to-white rounded-xl p-4 border-2 border-green-200">
          {/* Column Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-green-300">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <MdTrain className="text-green-600" size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  Recommended Trains
                </h4>
                <p className="text-xs text-gray-500">
                  {data.trains.length} options
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable Cards */}
          <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {data.trains.length > 0 ? (
              data.trains.map((train) => (
                <TransportCard key={train.id} option={train} mode="trains" />
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">No trains available</p>
              </div>
            )}
          </div>
        </div>

        {/* Buses Column */}
        <div className="bg-gradient-to-b from-orange-50 to-white rounded-xl p-4 border-2 border-orange-200">
          {/* Column Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-orange-300">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MdDirectionsBus className="text-orange-600" size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  Recommended Buses
                </h4>
                <p className="text-xs text-gray-500">
                  {data.buses.length} options
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable Cards */}
          <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {data.buses.length > 0 ? (
              data.buses.map((bus) => (
                <TransportCard key={bus.id} option={bus} mode="buses" />
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">No buses available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
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
  const [from, setFrom] = useState("New Delhi");
  const [to, setTo] = useState("Mumbai");
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultsData>({
    flights: [],
    trains: [],
    buses: [],
  });

  // Helper function to format date for display
  const formatDateForMessage = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper function to parse API flight data
  const parseFlightData = (apiFlights: APIFlightData[]): TransportOption[] => {
    return apiFlights.map((flight, index) => {
      try {
        return {
          id: `F${index + 1}`,
          number: flight.flight_number || "N/A",
          operator: flight.airline || "Unknown Airline",
          departureDate: flight.daparture_date
            ? new Date(flight.daparture_date).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "N/A",
          arrivalDate: flight.arival_date
            ? new Date(flight.arival_date).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "N/A",
          departureTime: flight.departure_time || "N/A",
          arrivalTime: flight.arrival_time || "N/A",
          duration: flight.duration || "N/A",
          price: flight.price ? parseInt(flight.price) : 0,
        };
      } catch (error) {
        console.error("Error parsing flight data:", flight, error);
        return {
          id: `F${index + 1}`,
          number: "N/A",
          operator: "Unknown Airline",
          departureDate: "N/A",
          arrivalDate: "N/A",
          departureTime: "N/A",
          arrivalTime: "N/A",
          duration: "N/A",
          price: 0,
        };
      }
    });
  };

  // Helper function to parse API train data
  const parseTrainData = (apiTrains: APITrainData[]): TransportOption[] => {
    return apiTrains.map((train, index) => {
      try {
        return {
          id: `T${index + 1}`,
          number: train.train_number || "N/A",
          operator: train.train_name || "Unknown Train",
          departureDate: train.daparture_date
            ? new Date(train.daparture_date).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "N/A",
          arrivalDate: train.arival_date
            ? new Date(train.arival_date).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "N/A",
          departureTime: train.departure_time || "N/A",
          arrivalTime: train.arrival_time || "N/A",
          duration: train.duration || "N/A",
          price: train.price ? parseInt(train.price) : 0,
        };
      } catch (error) {
        console.error("Error parsing train data:", train, error);
        return {
          id: `T${index + 1}`,
          number: "N/A",
          operator: "Unknown Train",
          departureDate: "N/A",
          arrivalDate: "N/A",
          departureTime: "N/A",
          arrivalTime: "N/A",
          duration: "N/A",
          price: 0,
        };
      }
    });
  };

  const handleSearch = async () => {
    if (!from || !to || !departureDate) {
      alert("Please fill in all required fields: From, To, and Departure Date");
      return;
    }

    setIsLoading(true);
    setShowResults(false);

    try {
      // Construct the message
      const formattedDate = formatDateForMessage(departureDate);
      const message = `Give me all the travel options from ${from} to ${to} on ${formattedDate}`;

      // Make API call through Next.js proxy
      const response = await fetch("/api/conveyance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: "user123",
          session_id: "session456",
          message: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("API Error:", errorData);
        throw new Error(
          `API error: ${response.status} - ${
            errorData.error || "Unknown error"
          }`
        );
      }

      const data: APIConveyanceResponse = await response.json();
      console.log("Received data:", data);

      // Validate response structure
      if (
        !data.message ||
        !data.message.conveyances ||
        !data.message.conveyances.conveyance_details
      ) {
        throw new Error("Invalid response structure from backend");
      }

      // Parse the response
      const conveyanceDetails = data.message.conveyances.conveyance_details;

      const parsedResults: SearchResultsData = {
        flights: conveyanceDetails.flights
          ? parseFlightData(conveyanceDetails.flights)
          : [],
        trains: conveyanceDetails.trains
          ? parseTrainData(conveyanceDetails.trains)
          : [],
        buses: [], // API doesn't provide buses yet
      };

      console.log("Parsed results:", parsedResults);
      setSearchResults(parsedResults);
      setShowResults(true);
    } catch (error) {
      console.error("Error fetching transport options:", error);
      alert("Failed to fetch transport options. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-full h-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-white text-base font-semibold">
              Search Transport
            </h2>
            <div className="flex items-center gap-1.5 ml-3">
              <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                <MdFlight className="text-white" size={12} />
                <span className="text-white text-[10px] font-medium">
                  Flights
                </span>
              </div>
              <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                <MdTrain className="text-white" size={12} />
                <span className="text-white text-[10px] font-medium">
                  Trains
                </span>
              </div>
              <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                <MdDirectionsBus className="text-white" size={12} />
                <span className="text-white text-[10px] font-medium">
                  Buses
                </span>
              </div>
            </div>
          </div>
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
        {/* Search Form */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* From and To Row with Swap */}
            <div className="flex items-end gap-2 flex-1">
              {/* From */}
              <div className="relative flex-1">
                <label className="block text-[10px] text-gray-500 mb-1.5 uppercase font-medium">
                  FROM
                </label>
                <CitySelector value={from} onChange={setFrom} label="From" />
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
                  title="Swap locations"
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
                <CitySelector value={to} onChange={setTo} label="To" />
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
              <button
                onClick={handleSearch}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
              >
                <span>SEARCH</span>
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

        {/* Loading Spinner */}
        {isLoading && (
          <div className="mt-6 flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-sm text-gray-600 font-medium">
              Searching for transport options...
            </p>
            <p className="mt-1 text-xs text-gray-500">
              This may take a few moments
            </p>
          </div>
        )}

        {/* Search Results */}
        {showResults && !isLoading && <SearchResults data={searchResults} />}
      </div>
    </div>
  );
}
