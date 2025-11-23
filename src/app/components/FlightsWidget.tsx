"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FiChevronDown,
  FiUser,
  FiCalendar,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiInfo,
} from "react-icons/fi";
import { MdFlight, MdTrain, MdDirectionsBus } from "react-icons/md";
import {
  getConveyanceDataForWidget,
  formatConveyanceForDisplay,
} from "../utils/preFetchIntegration";

interface FlightsWidgetProps {
  isVisible: boolean;
  onToggle: () => void;
  initialFromCity?: string;
  initialToCity?: string;
  initialDepartureDate?: string; // NEW: Initial departure date in YYYY-MM-DD format
  autoFillMode?: boolean; // NEW: If true, ALL fields are auto-filled and disabled
  partialAutoFillMode?: boolean; // NEW: If true, only FROM and DATE are fixed, TO is selectable
  onContinue?: (selectedConveyanceData?: TransportOption, aiOptions?: TransportOption[]) => void;
  onAiOptionsLoaded?: (aiOptions: TransportOption[]) => void; // Callback when AI options are loaded
  userId?: string;
  sessionId?: string;
  currentDayNumber?: number;
}

type ConveyanceType = "Flight" | "Train" | "Bus";

import { getPopularIndianCities, searchCities, findPlaceByCity } from "../utils/placesData";

// Get initial cities list - will be populated from placesData utility
const getInitialCities = () => {
  const popularCities = getPopularIndianCities();
  return popularCities.map(c => ({
    name: c.city,
    code: c.code,
    airport: `${c.city} Airport` // Generic airport name
  }));
};

// Available cities - using popular Indian cities as default
const AVAILABLE_CITIES = getInitialCities();

// City Selector Component with Search (loads from places.json)
function CitySelector({
  value,
  onChange,
  label,
  disabled,
}: {
  value: string;
  onChange: (city: string) => void;
  label: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cities, setCities] = useState(AVAILABLE_CITIES);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Search cities from places.json as user types
  useEffect(() => {
    if (!searchTerm.trim()) {
      setCities(AVAILABLE_CITIES);
      return;
    }

    const searchCitiesFromPlaces = async () => {
      setIsLoading(true);
      try {
        const results = await searchCities(searchTerm, 50); // Limit to 50 results
        const formattedCities = results.map(c => ({
          name: c.city,
          code: c.code,
          airport: `${c.city} Airport` // Generic airport name
        }));
        setCities(formattedCities);
      } catch (error) {
        console.error("Error searching cities:", error);
        // Fallback to popular cities on error
        const filtered = AVAILABLE_CITIES.filter(city =>
          city.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setCities(filtered);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchCitiesFromPlaces, 300); // Debounce 300ms
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const selectedCity = cities.find((city) => city.name === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        type="button"
        className={`w-full text-left p-3 bg-white/50 backdrop-blur-sm rounded-xl transition-all border border-white/20 ${
          disabled ? "cursor-not-allowed opacity-60" : "hover:bg-white/70"
        }`}
      >
        <div className="flex items-center gap-2">
          <MdFlight className="text-gray-500 flex-shrink-0" size={14} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-900">
              {value || "Select City"}
            </div>
            <div className="text-[10px] text-gray-500 truncate">
              {selectedCity
                ? `[${selectedCity.code}]`
                : "Search from 40K+ cities"}
            </div>
          </div>
          <FiChevronDown
            className={`text-gray-500 transition-transform flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
            size={12}
          />
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl z-[100] border border-white/40">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200/50">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search cities..."
              className="w-full px-3 py-2 text-xs text-gray-900 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Cities List */}
          <div className="p-2 max-h-[250px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4 text-xs text-gray-500">
                Searching...
              </div>
            ) : cities.length > 0 ? (
              cities.map((city, index) => (
                <button
                  key={`${city.code}-${index}`}
                  type="button"
                  onClick={() => {
                    onChange(city.name);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                    value === city.name
                      ? "bg-blue-500/20 text-blue-700"
                      : "hover:bg-gray-100/50 text-gray-700"
                  }`}
                >
                  <div className="text-xs font-semibold">{city.name}</div>
                  <div className="text-[10px] text-gray-500">
                    [{city.code}]
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-gray-500">
                No cities found
              </div>
            )}
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
  disabled,
}: {
  value: string;
  onChange: (date: string) => void;
  placeholder: string;
  disabled?: boolean; // NEW: Disable the date picker
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Sync selectedDate with value prop when it changes
  useEffect(() => {
    if (value !== selectedDate) {
      setSelectedDate(value);
    }
  }, [value]);

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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full text-left p-3 bg-white/50 backdrop-blur-sm rounded-xl transition-all border border-white/20 ${
          disabled ? "cursor-not-allowed opacity-60" : "hover:bg-white/70"
        }`}
      >
        <div className="flex items-center gap-2">
          <FiCalendar className="text-gray-500 flex-shrink-0" size={14} />
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
            className={`text-gray-500 transition-transform flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
            size={12}
          />
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-auto right-0 mt-2 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl z-[100] w-[280px] border border-white/40">
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
                // Use local date components for comparison to avoid timezone issues
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateStrForComparison = `${year}-${month}-${day}`;
                const isSelected = selectedDate === dateStrForComparison;

                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (!isPast) {
                        // Use local date components to avoid timezone issues
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const dateStr = `${year}-${month}-${day}`;
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

// Class Selector Component (Separate from Travellers)
function ClassSelector({
  travelClass,
  onClassChange,
}: {
  travelClass: string;
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
        className="w-full text-left p-3 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white/70 transition-all border border-white/20"
      >
        <div className="flex items-center gap-2">
          <FiUser className="text-gray-500 flex-shrink-0" size={14} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-900">
              {travelClass}
            </div>
          </div>
          <FiChevronDown
            className={`text-gray-500 transition-transform flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
            size={12}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl z-[100] border border-white/40">
          <div className="p-2">
            <div className="space-y-1">
              {classes.map((cls) => (
                <button
                  key={cls}
                  onClick={() => {
                    onClassChange(cls);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                    travelClass === cls
                      ? "bg-blue-500/20 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100/50"
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Traveller Selector Component (Only for travellers count)
function TravellerSelector({
  travellers,
  onTravellersChange,
}: {
  travellers: number;
  onTravellersChange: (count: number) => void;
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-3 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white/70 transition-all border border-white/20"
      >
        <div className="flex items-center gap-2">
          <FiUser className="text-gray-500 flex-shrink-0" size={14} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-900">
              {travellers} Traveller{travellers > 1 ? "s" : ""}
            </div>
          </div>
          <FiChevronDown
            className={`text-gray-500 transition-transform flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
            size={12}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl z-[100] border border-white/40">
          <div className="p-3">
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
  // AI recommendation specific fields
  reason?: string;
  tags?: string[];
  // Enriched metadata for parent flows
  from_city?: string;
  to_city?: string;
  is_required?: boolean;
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
  reason?: string;
  tags?: string[];
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
  reason?: string;
  tags?: string[];
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

// Utility API Response Types (from flights_date.json and trains_data.json)
interface UtilityFlightData {
  flight_id: string;
  airline: string;
  flight_number: string;
  departure_airport: {
    code: string;
    name: string;
    city: string;
    country: string;
  };
  arrival_airport: {
    code: string;
    name: string;
    city: string;
    country: string;
  };
  departure_date: string;
  arrival_date: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  price: {
    economy: number;
    business: number;
    first: number | null;
  };
  currency: string;
  travel_class_options: string[];
}

interface UtilityTrainData {
  train_id: string;
  operator: string;
  train_number: string;
  train_name: string;
  departure_station: {
    code: string;
    name: string;
    city: string;
    country: string;
  };
  arrival_station: {
    code: string;
    name: string;
    city: string;
    country: string;
  };
  departure_date: string;
  arrival_date: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  price: {
    "1AC": number | null;
    "2AC": number | null;
    "3AC": number | null;
    SL: number | null;
    sleeper: number | null;
    ac_chair: number | null;
    executive: number | null;
  };
  currency: string;
  travel_class_options: string[];
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

// Parse utility flights data
const parseUtilityFlightData = (
  flights: UtilityFlightData[]
): TransportOption[] => {
  return flights.map((flight) => {
    // Get price based on travel class (default to economy)
    const price =
      flight.price.economy || flight.price.business || flight.price.first || 0;

    // Format date
    const formatDate = (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      } catch {
        return dateStr;
      }
    };

    // Format time (remove +1 suffix if present)
    const formatTime = (timeStr: string) => {
      return timeStr.replace(/\+\d+$/, "");
    };

    return {
      id: flight.flight_id,
      number: flight.flight_number,
      operator: flight.airline,
      departureDate: formatDate(flight.departure_date),
      arrivalDate: formatDate(flight.arrival_date),
      departureTime: formatTime(flight.departure_time),
      arrivalTime: formatTime(flight.arrival_time),
      duration: flight.duration,
      price: price,
    };
  });
};

// Parse utility trains data
const parseUtilityTrainData = (
  trains: UtilityTrainData[]
): TransportOption[] => {
  return trains.map((train) => {
    // Get price based on available class (priority: 3AC > 2AC > SL > 1AC)
    const price =
      train.price["3AC"] ||
      train.price["2AC"] ||
      train.price.SL ||
      train.price["1AC"] ||
      train.price.sleeper ||
      train.price.ac_chair ||
      train.price.executive ||
      0;

    // Format date
    const formatDate = (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      } catch {
        return dateStr;
      }
    };

    // Format time (remove +1, +2 suffix if present)
    const formatTime = (timeStr: string) => {
      return timeStr.replace(/\+\d+$/, "");
    };

    return {
      id: train.train_id,
      number: train.train_number,
      operator: `${train.train_name} (${train.operator})`,
      departureDate: formatDate(train.departure_date),
      arrivalDate: formatDate(train.arrival_date),
      departureTime: formatTime(train.departure_time),
      arrivalTime: formatTime(train.arrival_time),
      duration: train.duration,
      price: price,
    };
  });
};

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

// Horizontal Transport Card Component - Matching Image Design
function TransportCard({
  option,
  mode,
  fromCity,
  toCity,
  isBooked,
  onBook,
  isAiRecommendation = false,
}: {
  option: TransportOption;
  mode: "flight" | "train" | "bus";
  fromCity?: string;
  toCity?: string;
  isBooked: boolean;
  onBook: (id: string) => void;
  isAiRecommendation?: boolean;
}) {
  const [showFareDetails, setShowFareDetails] = useState(false);
  const [showReasonTooltip, setShowReasonTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, arrowOnRight: false });
  const [isMounted, setIsMounted] = useState(false);
  const infoIconRef = useRef<HTMLDivElement>(null);

  // Ensure we're on the client side for portal rendering and inject tooltip animation
  useEffect(() => {
    setIsMounted(true);

    // Inject tooltip animation keyframes into document head if not already present
    if (typeof document !== 'undefined' && !document.getElementById('tooltip-animation-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'tooltip-animation-styles';
      styleSheet.textContent = `
        @keyframes tooltipFadeIn {
          0% {
            opacity: 0;
            transform: translateX(-8px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `;
      document.head.appendChild(styleSheet);
    }
  }, []);

  // Calculate tooltip position when hovering
  const handleMouseEnter = () => {
    if (infoIconRef.current) {
      const rect = infoIconRef.current.getBoundingClientRect();
      const tooltipWidth = 320; // w-80 = 20rem = 320px
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = rect.right + 12; // 12px gap from the icon
      let top = rect.top;
      let arrowOnRight = false;

      // Check if tooltip would overflow right edge of viewport
      if (left + tooltipWidth > viewportWidth - 20) {
        // Position to the left of the icon instead
        left = rect.left - tooltipWidth - 12;
        arrowOnRight = true;
      }

      // Ensure tooltip doesn't go off the top
      if (top < 10) {
        top = 10;
      }

      // Ensure tooltip doesn't go off the bottom (rough estimate)
      const estimatedTooltipHeight = 180;
      if (top + estimatedTooltipHeight > viewportHeight - 10) {
        top = viewportHeight - estimatedTooltipHeight - 10;
      }

      setTooltipPosition({ top, left, arrowOnRight });
    }
    setShowReasonTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowReasonTooltip(false);
  };

  const getIcon = () => {
    switch (mode) {
      case "flight":
        return <MdFlight className="text-blue-500" size={20} />;
      case "train":
        return <MdTrain className="text-green-500" size={20} />;
      case "bus":
        return <MdDirectionsBus className="text-orange-500" size={20} />;
    }
  };

  const getBorderColor = () => {
    switch (mode) {
      case "flight":
        return "border-blue-100 hover:border-blue-300";
      case "train":
        return "border-green-100 hover:border-green-300";
      case "bus":
        return "border-orange-100 hover:border-orange-300";
    }
  };

  const getIconBg = () => {
    switch (mode) {
      case "flight":
        return "bg-red-50";
      case "train":
        return "bg-green-50";
      case "bus":
        return "bg-orange-50";
    }
  };

  // Get city code from city name
  const getCityCode = (cityName: string) => {
    const city = AVAILABLE_CITIES.find((c) => c.name === cityName);
    return city ? city.code : cityName.substring(0, 3).toUpperCase();
  };

  const departureCode = getCityCode(fromCity || "");
  const arrivalCode = getCityCode(toCity || "");

  // Calculate commission and agent fare (example logic)
  const totalFare = option.price;
  const commission = Math.round(totalFare * 0.08); // 8% commission example
  const agentFare = totalFare - commission;

  // Format date to show day name
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      return `${dateStr}, ${dayName}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className={`bg-white border-2 ${getBorderColor()} ${
        isBooked
          ? "ring-4 ring-green-400 shadow-2xl shadow-green-200/50 scale-[1.01] bg-gradient-to-br from-green-50/30 to-white"
          : ""
      } rounded-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 mb-3 cursor-pointer group relative overflow-hidden backdrop-blur-sm`}
    >
      {/* Hover shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"></div>

      {/* Selected Indicator */}
      {isBooked && (
        <div className="absolute top-2 right-2 z-10 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
          <FiCheck size={12} />
          <span>SELECTED</span>
        </div>
      )}

      {/* AI Recommendation Info Icon */}
      {isAiRecommendation && option.reason && (
        <div
          ref={infoIconRef}
          className="absolute top-2 left-2 z-10"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg cursor-help transition-all duration-300 hover:scale-110 hover:shadow-xl">
            <FiInfo className="text-white" size={14} />
          </div>
        </div>
      )}

      {/* Portal-based Tooltip - Renders at document body level to escape overflow:hidden */}
      {isAiRecommendation && option.reason && showReasonTooltip && isMounted &&
        createPortal(
          <div
            className="fixed z-[9999] w-80 pointer-events-none"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              animation: "tooltipFadeIn 0.2s ease-out forwards",
            }}
          >
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white text-xs rounded-xl shadow-2xl overflow-visible border border-purple-500/30">
              {/* Tooltip Arrow - dynamically positioned based on tooltip placement */}
              <div
                className={`absolute top-3 w-4 h-4 bg-gray-900 transform rotate-45 ${
                  tooltipPosition.arrowOnRight
                    ? "-right-2 border-r border-t border-purple-500/30"
                    : "-left-2 border-l border-b border-purple-500/30"
                }`}
              ></div>

              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-4 py-2.5 border-b border-white/10 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center shadow-md">
                    <FiInfo className="text-white" size={12} />
                  </div>
                  <span className="font-semibold text-purple-200 text-sm">AI Recommendation</span>
                </div>
              </div>

              {/* Reason Content */}
              <div className="px-4 py-3">
                <p className="text-gray-200 leading-relaxed text-[13px]">{option.reason}</p>
              </div>

              {/* Tags */}
              {option.tags && option.tags.length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  {option.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-purple-200 text-[11px] rounded-full border border-purple-400/30 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Main Card Content */}
      <div className="p-3">
        <div className="flex items-center gap-4">
          {/* Airline/Operator Logo Section */}
          <div className="flex-shrink-0">
            <div
              className={`w-12 h-12 ${getIconBg()} rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 transform`}
            >
              <div className="group-hover:rotate-12 transition-transform duration-300">
                {getIcon()}
              </div>
            </div>
            <div className="text-center mt-1">
              <div className="text-[10px] font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                {option.number}
              </div>
              <div className="text-[8px] text-gray-500 truncate max-w-[60px] group-hover:text-gray-600 transition-colors">
                {option.operator.split(" ")[0]}
              </div>
            </div>
          </div>

          {/* Flight/Train/Bus Details - Horizontal Layout */}
          <div className="flex-1 flex items-center gap-6">
            {/* Departure Info */}
            <div className="text-left min-w-[120px] group-hover:translate-x-1 transition-transform duration-300">
              <div className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {departureCode} {option.departureTime}
              </div>
              <div className="text-[10px] text-gray-500 group-hover:text-gray-600 transition-colors">
                {formatDate(option.departureDate)}
              </div>
            </div>

            {/* Duration and Stops with Curved Line */}
            <div className="flex-1 text-center px-4 relative">
              <div className="flex items-center justify-center mb-1 relative">
                {/* SVG Curved Path for Flights */}
                {mode === "flight" && (
                  <svg
                    className="w-full h-8"
                    viewBox="0 0 200 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Curved path with animation */}
                    <path
                      d="M 10 16 Q 50 8, 100 16 T 190 16"
                      stroke="#9CA3AF"
                      strokeWidth="1.5"
                      fill="none"
                      strokeDasharray="4 3"
                      className="group-hover:stroke-blue-400 transition-colors"
                    />
                    {/* Start airport */}
                    <circle
                      cx="10"
                      cy="16"
                      r="4"
                      fill="#3B82F6"
                      className="group-hover:animate-pulse"
                    />
                    <circle cx="10" cy="16" r="2" fill="#EFF6FF" />
                    {/* Middle airplane icon positioned on curve with animation */}
                    <g
                      transform="translate(95, 10)"
                      className="group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300"
                    >
                      <circle
                        cx="5"
                        cy="6"
                        r="8"
                        fill="#EFF6FF"
                        className="group-hover:shadow-lg"
                      />
                      {/* Airplane body */}
                      <path
                        d="M 3 6 L 7 6 L 8 4 L 9 6 L 7 6 L 7 8 L 3 8 L 3 6 Z"
                        fill="#3B82F6"
                        className="group-hover:fill-blue-600"
                      />
                      {/* Contrail effect on hover */}
                      <path
                        d="M 1 6 L -2 6"
                        stroke="#93C5FD"
                        strokeWidth="0.5"
                        opacity="0.6"
                        className="group-hover:opacity-100"
                      />
                    </g>
                    {/* End airport */}
                    <circle
                      cx="190"
                      cy="16"
                      r="4"
                      fill="#3B82F6"
                      className="group-hover:animate-pulse"
                    />
                    <circle cx="190" cy="16" r="2" fill="#EFF6FF" />
                  </svg>
                )}

                {/* SVG Curved Path for Trains */}
                {mode === "train" && (
                  <svg
                    className="w-full h-8"
                    viewBox="0 0 200 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Double rail track */}
                    <path
                      d="M 10 14 L 190 14"
                      stroke="#9CA3AF"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <path
                      d="M 10 18 L 190 18"
                      stroke="#9CA3AF"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    {/* Animated rail ties pattern */}
                    <g className="group-hover:opacity-80 transition-opacity">
                      <path
                        d="M 30 12 L 30 20 M 50 12 L 50 20 M 70 12 L 70 20 M 90 12 L 90 20 M 110 12 L 110 20 M 130 12 L 130 20 M 150 12 L 150 20 M 170 12 L 170 20"
                        stroke="#9CA3AF"
                        strokeWidth="2"
                        fill="none"
                      />
                    </g>
                    {/* Start station */}
                    <circle
                      cx="10"
                      cy="16"
                      r="4"
                      fill="#10B981"
                      className="group-hover:animate-pulse"
                    />
                    <circle cx="10" cy="16" r="2" fill="#ECFDF5" />
                    {/* Animated train icon with smoke effect */}
                    <g
                      transform="translate(95, 8)"
                      className="group-hover:translate-x-1 transition-transform"
                    >
                      <circle
                        cx="5"
                        cy="8"
                        r="10"
                        fill="#ECFDF5"
                        className="group-hover:shadow-lg"
                      />
                      {/* Train body */}
                      <rect
                        x="1"
                        y="5"
                        width="8"
                        height="6"
                        rx="1.5"
                        fill="#10B981"
                      />
                      {/* Train windows */}
                      <rect
                        x="2"
                        y="6.5"
                        width="2"
                        height="2"
                        rx="0.5"
                        fill="#ECFDF5"
                      />
                      <rect
                        x="5"
                        y="6.5"
                        width="2"
                        height="2"
                        rx="0.5"
                        fill="#ECFDF5"
                      />
                      {/* Wheels */}
                      <circle cx="3" cy="11.5" r="1" fill="#374151" />
                      <circle cx="7" cy="11.5" r="1" fill="#374151" />
                    </g>
                    {/* End station */}
                    <circle
                      cx="190"
                      cy="16"
                      r="4"
                      fill="#10B981"
                      className="group-hover:animate-pulse"
                    />
                    <circle cx="190" cy="16" r="2" fill="#ECFDF5" />
                  </svg>
                )}

                {/* SVG Curved Path for Buses */}
                {mode === "bus" && (
                  <svg
                    className="w-full h-8"
                    viewBox="0 0 200 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Road with lanes */}
                    <path
                      d="M 10 14 Q 50 11, 100 14 T 190 14"
                      stroke="#6B7280"
                      strokeWidth="3"
                      fill="none"
                    />
                    <path
                      d="M 10 18 Q 50 15, 100 18 T 190 18"
                      stroke="#6B7280"
                      strokeWidth="3"
                      fill="none"
                    />
                    {/* Animated road markings */}
                    <g className="group-hover:animate-pulse">
                      <path
                        d="M 35 16 L 45 16 M 75 16 L 85 16 M 105 16 L 115 16 M 145 16 L 155 16"
                        stroke="#FFF7ED"
                        strokeWidth="1.5"
                        fill="none"
                        strokeDasharray="3 2"
                      />
                    </g>
                    {/* Start stop */}
                    <g>
                      <circle
                        cx="10"
                        cy="16"
                        r="4"
                        fill="#F97316"
                        className="group-hover:animate-pulse"
                      />
                      <path
                        d="M 10 13 L 10 19"
                        stroke="#FFF7ED"
                        strokeWidth="1.5"
                      />
                    </g>
                    {/* Animated bus icon */}
                    <g
                      transform="translate(95, 8)"
                      className="group-hover:translate-x-1 transition-transform"
                    >
                      <circle
                        cx="5"
                        cy="8"
                        r="10"
                        fill="#FFF7ED"
                        className="group-hover:shadow-lg"
                      />
                      {/* Bus body */}
                      <rect
                        x="0.5"
                        y="5"
                        width="9"
                        height="6"
                        rx="1.5"
                        fill="#F97316"
                      />
                      {/* Windows */}
                      <rect
                        x="1.5"
                        y="6"
                        width="2"
                        height="2"
                        rx="0.3"
                        fill="#FFF7ED"
                      />
                      <rect
                        x="4"
                        y="6"
                        width="2"
                        height="2"
                        rx="0.3"
                        fill="#FFF7ED"
                      />
                      <rect
                        x="6.5"
                        y="6"
                        width="2"
                        height="2"
                        rx="0.3"
                        fill="#FFF7ED"
                      />
                      {/* Wheels */}
                      <circle cx="2.5" cy="11.5" r="1" fill="#374151" />
                      <circle cx="7.5" cy="11.5" r="1" fill="#374151" />
                      {/* Headlights */}
                      <circle
                        cx="9.5"
                        cy="7"
                        r="0.5"
                        fill="#FCD34D"
                        className="group-hover:animate-pulse"
                      />
                    </g>
                    {/* End stop */}
                    <g>
                      <circle
                        cx="190"
                        cy="16"
                        r="4"
                        fill="#F97316"
                        className="group-hover:animate-pulse"
                      />
                      <path
                        d="M 190 13 L 190 19"
                        stroke="#FFF7ED"
                        strokeWidth="1.5"
                      />
                    </g>
                  </svg>
                )}
              </div>
              <div className="text-[11px] text-gray-600 font-medium group-hover:text-gray-700 transition-colors">
                {option.duration}
              </div>
              <div className="text-[9px] text-gray-400 group-hover:text-gray-500 transition-colors">
                {mode === "flight" ? "1 Stop" : "Direct"}
              </div>
            </div>

            {/* Arrival Info */}
            <div className="text-right min-w-[120px] group-hover:-translate-x-1 transition-transform duration-300">
              <div className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {arrivalCode} {option.arrivalTime}
              </div>
              <div className="text-[10px] text-gray-500 group-hover:text-gray-600 transition-colors">
                {formatDate(option.arrivalDate)}
              </div>
            </div>
          </div>

          {/* Price and Actions Section */}
          <div className="flex-shrink-0 border-l border-gray-200 pl-4 min-w-[180px]">
            {/* Commented out: Refundable Badge and Options */}
            {/* <div className="flex flex-wrap items-center gap-1 mb-2">
              <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded font-medium">
                Refundable
              </span>
              <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium">
                Book & Hold
              </span>
              <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-medium">
                Partial Payment
              </span>
            </div> */}

            {/* Simplified Price Display */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors">
                  Total Fare:
                </span>
                <span className="text-lg font-bold text-gray-900 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-300">
                  ₹{totalFare}
                </span>
              </div>
            </div>

            {/* Commented out: Fare Breakdown with Commission and Agent Fare */}
            {/* <div className="mb-2 bg-gray-50 rounded-lg p-2">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-600">Total Fare:</span>
                <span className="font-bold text-gray-900">₹{totalFare}</span>
              </div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-600">Commission:</span>
                <span className="font-bold text-red-600">₹{commission}</span>
              </div>
              <div className="flex justify-between text-[11px] border-t border-gray-300 pt-1 mt-1">
                <span className="text-gray-700 font-semibold">Agent Fare:</span>
                <span className="font-bold text-blue-600">₹{agentFare}</span>
              </div>
            </div> */}

            {/* Commented out: Flight Details Dropdown */}
            {/* <button
              onClick={() => setShowFareDetails(!showFareDetails)}
              className="w-full flex items-center justify-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 mb-2 py-1 hover:bg-blue-50 rounded transition-colors"
            >
              <span>Flight Details</span>
              <FiChevronDown
                className={`transition-transform ${
                  showFareDetails ? "rotate-180" : ""
                }`}
                size={12}
              />
            </button> */}

            {/* Action Buttons */}
            <div className="flex gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBook(option.id);
                }}
                className={`flex-1 ${
                  isBooked
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-800 hover:bg-gray-900 group-hover:bg-gray-900"
                } text-white text-xs font-semibold py-2 rounded transition-all duration-300 hover:shadow-lg transform hover:scale-105 active:scale-95`}
              >
                {isBooked ? (
                  <span className="flex items-center justify-center gap-1">
                    <FiCheck size={14} />
                    Selected
                  </span>
                ) : (
                  "Select"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Fare Details */}
      {showFareDetails && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div className="text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Fare:</span>
              <span className="text-gray-900">
                ₹{Math.round(totalFare * 0.75)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taxes & Fees:</span>
              <span className="text-gray-900">
                ₹{Math.round(totalFare * 0.25)}
              </span>
            </div>
            <div className="flex justify-between font-semibold border-t border-gray-300 pt-2">
              <span className="text-gray-700">Total Amount:</span>
              <span className="text-gray-900">₹{totalFare}</span>
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
  initialFromCity,
  initialToCity,
  initialDepartureDate,
  autoFillMode = false,
  partialAutoFillMode = false,
  onContinue,
  onAiOptionsLoaded,
  userId,
  sessionId,
  currentDayNumber,
}: FlightsWidgetProps) {
  const [travellers, setTravellers] = useState(1);
  const [travelClass, setTravelClass] = useState("Economy");
  const [departureDate, setDepartureDate] = useState("");
  const [from, setFrom] = useState(initialFromCity || "New Delhi");
  const [to, setTo] = useState(initialToCity || "Mumbai");
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [selectedConveyance, setSelectedConveyance] =
    useState<ConveyanceType>("Flight");
  const [searchResults, setSearchResults] = useState<SearchResultsData>({
    flights: [],
    trains: [],
    buses: [],
  });
  const [utilityResults, setUtilityResults] = useState<SearchResultsData>({
    flights: [],
    trains: [],
    buses: [],
  });
  const [isLoadingUtility, setIsLoadingUtility] = useState(false);
  const [isUtilityComplete, setIsUtilityComplete] = useState(false);
  const [fromCity, setFromCity] = useState(initialFromCity || "New Delhi");
  const [toCity, setToCity] = useState(initialToCity || "Mumbai");
  const [bookedOption, setBookedOption] = useState<string | null>(null);
  const [selectedConveyanceData, setSelectedConveyanceData] =
    useState<TransportOption | null>(null);

  // Update cities when initial props change
  useEffect(() => {
    console.log(
      "🛫 FlightsWidget received props - From:",
      initialFromCity,
      "To:",
      initialToCity
    );
    if (initialFromCity) {
      console.log("🛫 Setting FROM city to:", initialFromCity);
      setFrom(initialFromCity);
      setFromCity(initialFromCity);
    }
    if (initialToCity) {
      console.log("🛫 Setting TO city to:", initialToCity);
      setTo(initialToCity);
      setToCity(initialToCity);
    }
  }, [initialFromCity, initialToCity]);

  // Log when widget becomes visible
  useEffect(() => {
    if (isVisible) {
      console.log(
        "🛫 FlightsWidget is now visible. Current cities - From:",
        from,
        "To:",
        to
      );
    }
  }, [isVisible, from, to]);

  // Auto-fill departure date when coming from date selector route or partial auto-fill mode
  useEffect(() => {
    if (
      isVisible &&
      (autoFillMode || partialAutoFillMode) &&
      initialDepartureDate
    ) {
      // Update departure date if it's different from current value
      if (departureDate !== initialDepartureDate) {
        console.log("🚀 Auto-fill mode enabled - setting departure date...");
        console.log("📅 Setting departure date to:", initialDepartureDate);
        console.log("📅 Previous departure date was:", departureDate);
        setDepartureDate(initialDepartureDate);
      }
    }
  }, [
    isVisible,
    autoFillMode,
    partialAutoFillMode,
    initialDepartureDate,
  ]);

  // Auto-trigger search when all fields are ready in auto-fill mode
  useEffect(() => {
    if (
      isVisible &&
      autoFillMode &&
      from &&
      to &&
      departureDate &&
      !showResults
    ) {
      console.log("✅ All fields ready for auto-search (full auto-fill):", {
        from,
        to,
        departureDate,
      });

      // Trigger search after a short delay
      const timer = setTimeout(async () => {
        console.log("🔍 Auto-triggering search with pre-filled data...");
        await handleSearch();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoFillMode, from, to, departureDate, showResults]);

  // NOTE: Disabled auto-trigger search for partial auto-fill mode
  // User should manually click search after selecting TO city
  // This allows user to review FROM, TO, and DATE before searching
  // useEffect(() => {
  //   if (isVisible && partialAutoFillMode && from && to && departureDate && !showResults) {
  //     console.log("✅ All fields ready for auto-search (partial auto-fill):", { from, to, departureDate });
  //
  //     // Trigger search after a short delay
  //     const timer = setTimeout(async () => {
  //       console.log("🔍 Auto-triggering search with partial auto-fill...");
  //       await handleSearch();
  //     }, 500);
  //
  //     return () => clearTimeout(timer);
  //   }
  // }, [isVisible, partialAutoFillMode, from, to, departureDate, showResults]);

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

  // Helper function to parse price strings like "INR 7257" or "INR 408 (Sleeper)"
  const parsePrice = (priceStr: string | undefined): number => {
    if (!priceStr) return 0;
    // Remove currency prefix (INR, Rs, ₹, etc.) and any text in parentheses
    const cleanedPrice = priceStr
      .replace(/^(INR|Rs\.?|₹)\s*/i, "") // Remove currency prefix
      .replace(/\s*\([^)]*\)/g, "") // Remove text in parentheses like "(Sleeper)"
      .replace(/,/g, "") // Remove commas
      .trim();
    const parsed = parseInt(cleanedPrice, 10);
    return isNaN(parsed) ? 0 : parsed;
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
          price: parsePrice(flight.price),
          reason: flight.reason,
          tags: flight.tags,
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
          price: parsePrice(train.price),
          reason: train.reason,
          tags: train.tags,
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
    console.log("🔍 handleSearch called - Current state:", {
      from,
      to,
      departureDate,
      fromCity,
      toCity,
    });

    if (!from || !to || !departureDate) {
      console.error("❌ Missing required fields:", { from, to, departureDate });
      alert("Please fill in all required fields: From, To, and Departure Date");
      return;
    }

    console.log("✅ All fields present, proceeding with search");
    setIsLoading(true);
    setIsLoadingComplete(false);
    setIsLoadingUtility(true);
    setIsUtilityComplete(false);
    setShowResults(true); // Show results section immediately with loading state
    // Reset previous results
    setSearchResults({ flights: [], trains: [], buses: [] });
    setUtilityResults({ flights: [], trains: [], buses: [] });

    try {
      // Prepare date range (from_date and to_date as same date for single day search)
      const dateStr = departureDate; // Already in YYYY-MM-DD format

      console.log("🔍 Fetching conveyance data for:", {
        from,
        to,
        date: dateStr,
        dayNumber: currentDayNumber,
      });

      // Check for pre-fetched data if userId is available
      if (userId) {
        console.log(
          `🔍 Checking for pre-fetched data for route: ${from} → ${to} on ${dateStr}...`
        );
        const cachedData = await getConveyanceDataForWidget(
          userId,
          from,
          to,
          dateStr
        );

        if (cachedData) {
          console.log("✅ Found pre-fetched data! Using cached results.");

          // Parse pre-fetched data
          const aiFlights = parseFlightData(cachedData.aiFlights);
          const aiTrains = parseTrainData(cachedData.aiTrains);
          const utilFlights = parseUtilityFlightData(cachedData.utilityFlights);
          const utilTrains = parseUtilityTrainData(cachedData.utilityTrains);

          // Set results from pre-fetched data
          setSearchResults({ flights: aiFlights, trains: aiTrains, buses: [] });
          setUtilityResults({
            flights: utilFlights,
            trains: utilTrains,
            buses: [],
          });
          setShowResults(true);
          setIsLoadingComplete(true);
          setIsUtilityComplete(true);
          setIsLoading(false);
          setIsLoadingUtility(false);

          console.log("✅ Pre-fetched data loaded:", {
            aiFlights: aiFlights.length,
            aiTrains: aiTrains.length,
            utilFlights: utilFlights.length,
            utilTrains: utilTrains.length,
            source: cachedData.isCached ? "cached" : "fresh",
          });

          // Notify parent about AI options loaded
          if (onAiOptionsLoaded) {
            const allAiOptions = [...aiFlights, ...aiTrains];
            onAiOptionsLoaded(allAiOptions);
          }

          return; // Exit early, no need to make API calls
        } else {
          console.log(
            "ℹ️ No pre-fetched data found, proceeding with API calls..."
          );
        }
      }

      // Fetch country data for departure and arrival cities from places.json
      const [departurePlace, arrivalPlace] = await Promise.all([
        findPlaceByCity(from),
        findPlaceByCity(to),
      ]);

      const departureCountry = departurePlace?.country || "India";
      const arrivalCountry = arrivalPlace?.country || "India";

      console.log(`🌍 Departure: ${from}, ${departureCountry}`);
      console.log(`🌍 Arrival: ${to}, ${arrivalCountry}`);

      // Make parallel API calls - each updates state independently as it completes
      // Utility API call for flights
      const flightsPromise = fetch("/api/utility/conveyance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId || "user123",
          conveyance_type: "flights",
          departure_city: from,
          departure_country: departureCountry,
          arrival_city: to,
          arrival_country: arrivalCountry,
          start_date: dateStr,
          end_date: dateStr,
        }),
      })
        .then(async (response) => {
          if (response.ok) {
            const flightsData = await response.json();
            if (Array.isArray(flightsData)) {
              const utilFlights = parseUtilityFlightData(flightsData);
              console.log("✅ Utility flights received:", utilFlights.length);
              setUtilityResults((prev) => ({
                ...prev,
                flights: utilFlights,
              }));
            }
          }
        })
        .catch((error) => {
          console.error("❌ Error fetching utility flights:", error);
        });

      // Utility API call for trains
      const trainsPromise = fetch("/api/utility/conveyance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId || "user123",
          conveyance_type: "trains",
          departure_city: from,
          departure_country: departureCountry,
          arrival_city: to,
          arrival_country: arrivalCountry,
          start_date: dateStr,
          end_date: dateStr,
        }),
      })
        .then(async (response) => {
          if (response.ok) {
            const trainsData = await response.json();
            if (Array.isArray(trainsData)) {
              const utilTrains = parseUtilityTrainData(trainsData);
              console.log("✅ Utility trains received:", utilTrains.length);
              setUtilityResults((prev) => ({
                ...prev,
                trains: utilTrains,
              }));
            }
          }
        })
        .catch((error) => {
          console.error("❌ Error fetching utility trains:", error);
        });

      // AI recommendations call
      const aiPromise = fetch("/api/conveyance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId || "user123",
          session_id: sessionId || "session456",
          from_city: from,
          from_country: departureCountry,
          to_city: to,
          to_country: arrivalCountry,
          date: dateStr,
        }),
      })
        .then(async (response) => {
          if (response.ok) {
            const aiData: APIConveyanceResponse = await response.json();
            if (
              aiData.message &&
              aiData.message.conveyances &&
              aiData.message.conveyances.conveyance_details
            ) {
              const conveyanceDetails =
                aiData.message.conveyances.conveyance_details;
              const aiFlights = conveyanceDetails.flights
                ? parseFlightData(conveyanceDetails.flights)
                : [];
              const aiTrains = conveyanceDetails.trains
                ? parseTrainData(conveyanceDetails.trains)
                : [];

              console.log("✅ AI recommendations received:", {
                flights: aiFlights.length,
                trains: aiTrains.length,
              });

              setSearchResults({
                flights: aiFlights,
                trains: aiTrains,
                buses: [],
              });

              // Notify parent about AI options loaded
              if (onAiOptionsLoaded) {
                const allAiOptions = [...aiFlights, ...aiTrains];
                onAiOptionsLoaded(allAiOptions);
              }
            }
          }
          // Mark AI loading complete
          setIsLoading(false);
          setIsLoadingComplete(true);
        })
        .catch((error) => {
          console.error("❌ Error fetching AI recommendations:", error);
          setIsLoading(false);
          setIsLoadingComplete(true);
        });

      // Wait for utility calls to complete (for the utility loading indicator)
      Promise.all([flightsPromise, trainsPromise])
        .then(() => {
          console.log("✅ All utility API calls completed");
          setIsLoadingUtility(false);
          setIsUtilityComplete(true);
        })
        .catch((error) => {
          console.error("❌ Error in utility API calls:", error);
          setIsLoadingUtility(false);
          setIsUtilityComplete(true);
        });

      // Wait for AI call separately (already handled above)
      await aiPromise;
    } catch (error) {
      console.error("❌ Error fetching transport options:", error);
      alert("Failed to fetch transport options. Please try again.");
      setIsLoading(false);
      setIsLoadingUtility(false);
    }
  };

  const getFilteredResults = () => {
    switch (selectedConveyance) {
      case "Flight":
        return searchResults.flights;
      case "Train":
        return searchResults.trains;
      case "Bus":
        return searchResults.buses;
      default:
        return [];
    }
  };

  const getFilteredUtilityResults = () => {
    switch (selectedConveyance) {
      case "Flight":
        return utilityResults.flights;
      case "Train":
        return utilityResults.trains;
      case "Bus":
        return utilityResults.buses;
      default:
        return [];
    }
  };

  const handleBooking = (optionId: string) => {
    setBookedOption(optionId);

    // Find the selected option from all results (both AI and utility)
    const allResults = [
      ...searchResults.flights,
      ...searchResults.trains,
      ...searchResults.buses,
      ...utilityResults.flights,
      ...utilityResults.trains,
      ...utilityResults.buses,
    ];
    const selectedOption = allResults.find((opt) => opt.id === optionId);

    if (selectedOption) {
      // Enrich with route metadata for upstream consumers
      const enriched: TransportOption = {
        ...selectedOption,
        from_city: from,
        to_city: to,
        is_required: true,
      };
      setSelectedConveyanceData(enriched);
      console.log("✅ Selected conveyance data:", selectedOption);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-full h-full bg-gradient-to-br from-white/98 to-gray-50/98 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Minimalistic Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm px-4 py-2 flex-shrink-0 border-b border-gray-200/30">
        <div className="flex items-center justify-between">
          <h2 className="text-gray-800 text-sm font-medium tracking-wide">
            {currentDayNumber
              ? `Day ${currentDayNumber} - Search Transport`
              : "Search Transport"}
          </h2>
          <button
            onClick={onToggle}
            className="text-gray-600 hover:text-gray-800 transition-colors p-1 hover:bg-gray-200/30 rounded-full"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Search Form Container */}
        <div className="relative z-20 bg-white/70 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/50">
          {/* Input Fields Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {/* From */}
            <div className="relative">
              <label className="block text-[10px] text-gray-600 mb-2 uppercase font-semibold tracking-wider">
                FROM
              </label>
              <CitySelector
                value={from}
                onChange={setFrom}
                label="From"
                disabled={autoFillMode || partialAutoFillMode}
              />
            </div>

            {/* To */}
            <div className="relative">
              <label className="block text-[10px] text-gray-600 mb-2 uppercase font-semibold tracking-wider">
                TO
              </label>
              <CitySelector
                value={to}
                onChange={setTo}
                label="To"
                disabled={autoFillMode}
              />
            </div>

            {/* Departure Date */}
            <div className="relative">
              <label className="block text-[10px] text-gray-600 mb-2 uppercase font-semibold tracking-wider">
                DEPART DATE
              </label>
              <DatePicker
                value={departureDate}
                onChange={setDepartureDate}
                placeholder="Select date"
                disabled={autoFillMode || partialAutoFillMode}
              />
            </div>

            {/* Class */}
            <div className="relative">
              <label className="block text-[10px] text-gray-600 mb-2 uppercase font-semibold tracking-wider">
                CLASS
              </label>
              <ClassSelector
                travelClass={travelClass}
                onClassChange={setTravelClass}
              />
            </div>
          </div>

          {/* Smart Search Button & Conveyance Type Selector */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Smart Search Button */}
            <button
              onClick={handleSearch}
              disabled={autoFillMode && !partialAutoFillMode}
              className={`bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 border-none ${
                autoFillMode && !partialAutoFillMode
                  ? "cursor-not-allowed opacity-60"
                  : "hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl transform hover:scale-105"
              }`}
            >
              <svg
                className="w-5 h-5"
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
              <span>Smart Search</span>
            </button>

            {/* Conveyance Type Single Select */}
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-xl p-2 shadow-md border border-white/40">
              <span className="text-xs text-gray-700 font-semibold px-1">
                Type:
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setSelectedConveyance("Flight")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all transform hover:scale-105 ${
                    selectedConveyance === "Flight"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                      : "bg-white/60 text-gray-600 hover:bg-white/90 shadow-sm"
                  }`}
                >
                  <MdFlight size={16} />
                  <span className="text-xs font-semibold">Flight</span>
                </button>
                <button
                  onClick={() => setSelectedConveyance("Train")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all transform hover:scale-105 ${
                    selectedConveyance === "Train"
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                      : "bg-white/60 text-gray-600 hover:bg-white/90 shadow-sm"
                  }`}
                >
                  <MdTrain size={16} />
                  <span className="text-xs font-semibold">Train</span>
                </button>
                {/* Commented out: Bus button */}
                {/* <button
                  onClick={() => setSelectedConveyance("Bus")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all transform hover:scale-105 ${
                    selectedConveyance === "Bus"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                      : "bg-white/60 text-gray-600 hover:bg-white/90 shadow-sm"
                  }`}
                >
                  <MdDirectionsBus size={16} />
                  <span className="text-xs font-semibold">Bus</span>
                </button> */}
              </div>
            </div>
          </div>
        </div>

        {/* Results Section - Stacked Rows */}
        {(showResults || isLoading) && (
          <div className="space-y-4 relative z-10">
            {/* AI Recommendations Box */}
            <div className="relative bg-white/90 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-200/40">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-3 border-b border-gray-200/30">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isLoadingComplete
                          ? "bg-green-500"
                          : isLoading
                          ? "bg-blue-500"
                          : "bg-gray-300"
                      }`}
                    >
                      {isLoadingComplete ? (
                        <FiCheck className="text-white" size={12} />
                      ) : isLoading ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      AI Recommendations
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 max-h-[500px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <p className="mt-3 text-sm text-gray-600 font-medium">
                        Finding best options...
                      </p>
                    </div>
                  ) : showResults ? (
                    <div className="space-y-3">
                      {/* Show selected conveyance results without section header */}
                      {getFilteredResults().length > 0 ? (
                        <>
                          {/* Render all cards for selected conveyance */}
                          {getFilteredResults().map((option) => (
                            <TransportCard
                              key={option.id}
                              option={option}
                              mode={
                                selectedConveyance.toLowerCase() as
                                  | "flight"
                                  | "train"
                                  | "bus"
                              }
                              fromCity={from}
                              toCity={to}
                              isBooked={bookedOption === option.id}
                              onBook={handleBooking}
                              isAiRecommendation={true}
                            />
                          ))}
                        </>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p className="text-sm">
                            No {selectedConveyance.toLowerCase()}s available
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-sm">
                        Click "Smart Search" to see AI recommendations
                      </p>
                    </div>
                  )}
                </div>
            </div>

            {/* Other Travel Options Box - Utility API Results */}
            {showResults && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/40 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 p-3 border-b border-gray-200/30">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isUtilityComplete
                          ? "bg-green-500"
                          : isLoadingUtility
                          ? "bg-orange-500"
                          : "bg-gray-300"
                      }`}
                    >
                      {isUtilityComplete ? (
                        <FiCheck className="text-white" size={12} />
                      ) : isLoadingUtility ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      Other Travel Options
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 max-h-[500px] overflow-y-auto">
                  {isLoadingUtility ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <p className="mt-3 text-sm text-gray-600 font-medium">
                        Finding best options...
                      </p>
                    </div>
                  ) : getFilteredUtilityResults().length > 0 ? (
                    <div className="space-y-3">
                      {getFilteredUtilityResults().map((option) => (
                        <TransportCard
                          key={option.id}
                          option={option}
                          mode={
                            selectedConveyance.toLowerCase() as
                              | "flight"
                              | "train"
                              | "bus"
                          }
                          fromCity={from}
                          toCity={to}
                          isBooked={bookedOption === option.id}
                          onBook={handleBooking}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-sm">
                        No additional {selectedConveyance.toLowerCase()}s
                        available
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Continue Button */}
      {onContinue && (
        <div className="absolute bottom-6 right-6 z-20">
          <button
            onClick={() => {
              console.log(
                "🚀 Continue clicked with selected data:",
                selectedConveyanceData
              );
              // Pass both the selected conveyance and all AI options
              const allAiOptions = [...searchResults.flights, ...searchResults.trains];
              onContinue(selectedConveyanceData || undefined, allAiOptions);
            }}
            disabled={!bookedOption}
            className={`px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 shadow-lg backdrop-blur-sm ${
              bookedOption
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
                : "bg-gray-200/50 text-gray-400 cursor-not-allowed backdrop-blur-sm border border-gray-300/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>Continue</span>
              <FiChevronRight
                size={16}
                className={`transition-transform duration-300 ${
                  bookedOption ? "group-hover:translate-x-1" : ""
                }`}
              />
            </div>
          </button>
        </div>
      )}

      {/* RGB Continuous Flow Animation Keyframes */}
      <style jsx>{`
        @keyframes rgb-flow {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 200% 0%;
          }
        }

        @keyframes rgb-glow-continuous {
          0% {
            filter: hue-rotate(0deg) brightness(1.2) saturate(1.5);
            transform: scale(1);
          }
          25% {
            filter: hue-rotate(90deg) brightness(1.4) saturate(1.8);
            transform: scale(1.02);
          }
          50% {
            filter: hue-rotate(180deg) brightness(1.2) saturate(1.5);
            transform: scale(1);
          }
          75% {
            filter: hue-rotate(270deg) brightness(1.4) saturate(1.8);
            transform: scale(1.02);
          }
          100% {
            filter: hue-rotate(360deg) brightness(1.2) saturate(1.5);
            transform: scale(1);
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(-8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-rgb-flow {
          animation: rgb-flow 3s linear infinite;
          background-size: 200% 100%;
        }

        .animate-rgb-glow-continuous {
          animation: rgb-glow-continuous 4s ease-in-out infinite;
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
