"use client";

import { useState, useRef, useEffect } from "react";
import {
  FiChevronDown,
  FiCalendar,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiMapPin,
  FiStar,
} from "react-icons/fi";
import { MdHotel } from "react-icons/md";
import { getStaysDataForWidget, formatStaysForDisplay } from "../utils/preFetchIntegration";
import { getPreFetchedStaysData } from "../utils/preFetchStays";

interface StaysWidgetProps {
  isVisible: boolean;
  onToggle: () => void;
  initialCity?: string;
  initialCheckInDate?: string; // NEW - YYYY-MM-DD format
  initialCheckOutDate?: string; // NEW - YYYY-MM-DD format
  autoFillMode?: boolean; // NEW - Make fields fixed and auto-search
  onContinue?: (selectedStayData?: StayOption) => void;
  userId?: string;
  sessionId?: string;
  currentDayNumber?: number;
}

// Available cities
const AVAILABLE_CITIES = [
  { name: "Mumbai", code: "BOM" },
  { name: "Bangalore", code: "BLR" },
  { name: "New Delhi", code: "DEL" },
  { name: "Agra", code: "AGR" },
  { name: "Leh", code: "IXL" },
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
        className="w-full text-left p-3 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white/70 transition-all border border-white/20"
      >
        <div className="flex items-center gap-2">
          <FiMapPin className="text-gray-500 flex-shrink-0" size={14} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-900">
              {selectedCity?.name || "Select City"}
            </div>
            <div className="text-[10px] text-gray-500 truncate">
              {selectedCity
                ? `[${selectedCity.code}]`
                : "Choose destination"}
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
          <div className="p-2 max-h-[250px] overflow-y-auto">
            {AVAILABLE_CITIES.map((city) => (
              <button
                key={city.code}
                onClick={() => {
                  onChange(city.name);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                  value === city.name
                    ? "bg-blue-500/20 text-blue-700"
                    : "hover:bg-gray-100/50 text-gray-700"
                }`}
              >
                <div className="text-xs font-semibold">{city.name}</div>
                <div className="text-[10px] text-gray-500">[{city.code}]</div>
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

  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
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

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      year: date.getFullYear().toString(),
    };
  };

  const displayDate = formatDisplayDate(selectedDate);
  const calendarDays = generateCalendarDays();
  const today = new Date();

  return (
    <div className="relative" ref={datePickerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-3 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white/70 transition-all border border-white/20"
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

      {isOpen && (
        <div className="absolute top-full left-auto right-0 mt-2 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl z-[100] w-[280px] border border-white/40">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={goToPreviousMonth}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-1 rounded transition-all"
              >
                <FiChevronLeft size={16} />
              </button>
              <h3 className="font-semibold text-gray-900 text-sm">
                {new Date(currentYear, currentMonth).toLocaleDateString(
                  "en-US",
                  { month: "long", year: "numeric" }
                )}
              </h3>
              <button
                onClick={goToNextMonth}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-1 rounded transition-all"
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

// Star Rating Selector Component
function StarRatingSelector({
  rating,
  onRatingChange,
}: {
  rating: string;
  onRatingChange: (rating: string) => void;
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

  const ratings = ["All", "3 Star", "4 Star", "5 Star"];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-3 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white/70 transition-all border border-white/20"
      >
        <div className="flex items-center gap-2">
          <FiStar className="text-gray-500 flex-shrink-0" size={14} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-900">{rating}</div>
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
              {ratings.map((rat) => (
                <button
                  key={rat}
                  onClick={() => {
                    onRatingChange(rat);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                    rating === rat
                      ? "bg-blue-500/20 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100/50"
                  }`}
                >
                  {rat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stay Option Data Interface
interface StayOption {
  stay_id: string;
  property_name: string;
  property_address: string;
  property_location: string;
  city: string;
  state: string;
  country: string;
  overall_rating: number;
  starting_price: string;
  currency: string;
  available_rooms_total: number;
  available_from_date: string;
  available_until_date: string;
}

// Stay Card Component
function StayCard({
  stay,
  isBooked,
  onBook,
}: {
  stay: StayOption;
  isBooked: boolean;
  onBook: (id: string) => void;
}) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className={`bg-white border-2 border-blue-100 hover:border-blue-300 ${
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

      {/* Main Card Content */}
      <div className="p-3">
        <div className="flex items-center gap-4">
          {/* Hotel Icon Section */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 transform">
              <div className="group-hover:rotate-12 transition-transform duration-300">
                <MdHotel className="text-blue-500" size={20} />
              </div>
            </div>
          </div>

          {/* Stay Details */}
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <div className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {stay.property_name}
              </div>
              <div className="text-[10px] text-gray-500 truncate">
                {stay.property_address}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <FiStar className="text-yellow-500" size={12} />
                <span className="font-semibold text-gray-900">
                  {stay.overall_rating.toFixed(1)}
                </span>
              </div>
              <div className="text-gray-600">
                {stay.available_rooms_total} rooms available
              </div>
            </div>

            <div className="mt-2 text-[10px] text-gray-500">
              Available: {formatDate(stay.available_from_date)} -{" "}
              {formatDate(stay.available_until_date)}
            </div>
          </div>

          {/* Price and Actions Section */}
          <div className="flex-shrink-0 border-l border-gray-200 pl-4 min-w-[180px]">
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors">
                  Starting from:
                </span>
              </div>
              <div className="text-lg font-bold text-gray-900 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-300">
                {stay.currency === "INR" ? "₹" : stay.currency}
                {stay.starting_price}
              </div>
              <div className="text-[10px] text-gray-500">per night</div>
            </div>

            {/* Action Button */}
            <div className="flex gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBook(stay.stay_id);
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
    </div>
  );
}

export default function StaysWidget({
  isVisible,
  onToggle,
  initialCity,
  initialCheckInDate,
  initialCheckOutDate,
  autoFillMode = false,
  onContinue,
  userId,
  sessionId,
  currentDayNumber,
}: StaysWidgetProps) {
  const [city, setCity] = useState(initialCity || "Bangalore");
  const [checkInDate, setCheckInDate] = useState(initialCheckInDate || "");
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOutDate || "");
  const [starRating, setStarRating] = useState("All");
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [searchResults, setSearchResults] = useState<StayOption[]>([]);
  const [bookedOption, setBookedOption] = useState<string | null>(null);
  const [selectedStayData, setSelectedStayData] = useState<StayOption | null>(null);
  const [hasAutoSearched, setHasAutoSearched] = useState(false);

  // Update city when initial prop changes
  useEffect(() => {
    console.log("🏨 StaysWidget received props - City:", initialCity, "CheckIn:", initialCheckInDate, "CheckOut:", initialCheckOutDate, "AutoFill:", autoFillMode);
    if (initialCity) {
      console.log("🏨 Setting city to:", initialCity);
      setCity(initialCity);
    }
    if (initialCheckInDate) {
      console.log("🏨 Setting check-in date to:", initialCheckInDate);
      setCheckInDate(initialCheckInDate);
    }
    if (initialCheckOutDate) {
      console.log("🏨 Setting check-out date to:", initialCheckOutDate);
      setCheckOutDate(initialCheckOutDate);
    }
  }, [initialCity, initialCheckInDate, initialCheckOutDate, autoFillMode]);

  // Auto-search when widget becomes visible in auto-fill mode
  useEffect(() => {
    if (isVisible && autoFillMode && !hasAutoSearched && city && checkInDate && checkOutDate && userId) {
      console.log("🏨 StaysWidget is now visible in AUTO-FILL mode. Auto-triggering search...");
      console.log("🏨 Search params:", { city, checkInDate, checkOutDate });
      setHasAutoSearched(true);
      // Trigger search automatically
      handleSearch();
    } else if (isVisible && !autoFillMode) {
      console.log("🏨 StaysWidget is now visible in MANUAL mode. Current city:", city);
    }
  }, [isVisible, autoFillMode, hasAutoSearched, city, checkInDate, checkOutDate, userId]);

  // Reset auto-search flag when widget closes
  useEffect(() => {
    if (!isVisible) {
      setHasAutoSearched(false);
    }
  }, [isVisible]);

  const handleSearch = async () => {
    if (!city || !checkInDate || !checkOutDate) {
      alert("Please fill in all required fields: City, Check-in Date, and Check-out Date");
      return;
    }

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      alert("Check-out date must be after check-in date");
      return;
    }

    setIsLoading(true);
    setIsLoadingComplete(false);
    setShowResults(false);

    try {
      // Check for pre-fetched data if userId is available
      if (userId) {
        console.log(`🏨 Checking for pre-fetched stays data for: ${city} (${checkInDate} to ${checkOutDate})...`);
        const cachedData = await getPreFetchedStaysData(userId, city, checkInDate, checkOutDate);
        
        if (cachedData) {
          console.log("✅ Found pre-fetched stays data! Using cached results.");
          console.log("📊 Cached data structure:", cachedData);
          
          // Combine AI recommendations and utility stays
          const allStays: any[] = [
            ...(cachedData.ai_recommendations || []),
            ...(cachedData.utility_stays || [])
          ];
          
          console.log(`📊 Total properties: ${allStays.length} (AI: ${cachedData.ai_recommendations?.length || 0}, Utility: ${cachedData.utility_stays?.length || 0})`);
          
          // Transform to StayOption format
          const stayOptions: StayOption[] = allStays.map((stay: any, index: number) => ({
            stay_id: `stay_${index}`,
            property_name: stay.property_name,
            property_address: stay.property_address,
            property_location: stay.property_location || city,
            city: stay.city || city,
            state: stay.state || "",
            country: stay.country || "India",
            overall_rating: parseFloat(stay.overall_rating || 0),
            starting_price: stay.price || stay.starting_price || "0",
            currency: stay.currency || "INR",
            available_rooms_total: parseInt(stay.available_rooms_total || 0),
            available_from_date: stay.available_from_date,
            available_until_date: stay.available_until_date,
          }));
          
          setSearchResults(stayOptions);
          setShowResults(true);
          setIsLoadingComplete(true);
          setIsLoading(false);
          
          console.log("✅ Pre-fetched stays data loaded:", {
            total: stayOptions.length,
            aiCount: cachedData.ai_recommendations?.length || 0,
            utilityCount: cachedData.utility_stays?.length || 0,
            source: "pre-fetched",
          });
          
          return; // Exit early, no need to make API calls
        } else {
          console.log("ℹ️ No pre-fetched stays data found, proceeding with API call...");
        }
      }

      // Format dates for display in message
      const checkInFormatted = new Date(checkInDate).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const checkOutFormatted = new Date(checkOutDate).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const message = `Give me all the stay options available ${checkInFormatted} to ${checkOutFormatted} in ${city}`;

      const response = await fetch("/api/stay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId || "user123",
          session_id: sessionId || "session456",
          message: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("API Error:", errorData);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received stay response:", data);

      // Parse response structure: data.message.stays.stay_details
      let stayOptions: StayOption[] = [];
      
      if (
        data.message &&
        data.message.stays &&
        data.message.stays.stay_details &&
        Array.isArray(data.message.stays.stay_details)
      ) {
        // Transform backend response to StayOption format
        stayOptions = data.message.stays.stay_details.map(
          (stay: any, index: number) => ({
            stay_id: `stay_${index}`,
            property_name: stay.property_name,
            property_address: stay.property_address,
            property_location: data.message.stays.city,
            city: data.message.stays.city,
            state: data.message.stays.state,
            country: data.message.stays.country,
            overall_rating: parseFloat(stay.overall_rating),
            starting_price: stay.price,
            currency: "INR",
            available_rooms_total: parseInt(stay.available_rooms_total),
            available_from_date: stay.available_from_date,
            available_until_date: stay.available_until_date,
          })
        );
      }

      console.log("Parsed stay options:", stayOptions);
      setSearchResults(stayOptions);
      setShowResults(true);
      setIsLoadingComplete(true);
    } catch (error) {
      console.error("Error fetching stay options:", error);
      alert("Failed to fetch stay options. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = (stayId: string) => {
    setBookedOption(stayId);
    
    // Find the selected stay from search results
    const selectedStay = searchResults.find(stay => stay.stay_id === stayId);
    
    if (selectedStay) {
      setSelectedStayData(selectedStay);
      console.log("✅ Selected stay data:", selectedStay);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-full h-full bg-gradient-to-br from-white/98 to-gray-50/98 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Minimalistic Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm px-4 py-2 flex-shrink-0 border-b border-gray-200/30">
        <div className="flex items-center justify-between">
          <h2 className="text-gray-800 text-sm font-medium tracking-wide">
            {currentDayNumber ? `Day ${currentDayNumber} - Search Stays` : "Search Stays"}
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
            {/* City */}
            <div className="relative">
              <label className="block text-[10px] text-gray-600 mb-2 uppercase font-semibold tracking-wider">
                {/* CITY {autoFillMode && <span className="text-blue-600">(Auto-filled)</span>} */}
                CITY
              </label>
              {autoFillMode ? (
                <div className="w-full text-left p-3 bg-gray-100/70 backdrop-blur-sm rounded-xl border border-gray-200 cursor-not-allowed">
                  <div className="flex items-center gap-2">
                    <FiMapPin className="text-gray-500 flex-shrink-0" size={14} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900">{city}</div>
                      <div className="text-[10px] text-gray-500">Fixed city</div>
                    </div>
                  </div>
                </div>
              ) : (
                <CitySelector value={city} onChange={setCity} label="City" />
              )}
            </div>

            {/* Check-in Date */}
            <div className="relative">
              <label className="block text-[10px] text-gray-600 mb-2 uppercase font-semibold tracking-wider">
                {/* CHECK-IN {autoFillMode && <span className="text-blue-600">(Auto-filled)</span>} */}
                CHECK-IN
              </label>
              {autoFillMode ? (
                <div className="w-full text-left p-3 bg-gray-100/70 backdrop-blur-sm rounded-xl border border-gray-200 cursor-not-allowed">
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-gray-500 flex-shrink-0" size={14} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900">
                        {checkInDate ? new Date(checkInDate).toLocaleDateString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }) : "Not set"}
                      </div>
                      <div className="text-[10px] text-gray-500">Fixed date</div>
                    </div>
                  </div>
                </div>
              ) : (
                <DatePicker
                  value={checkInDate}
                  onChange={setCheckInDate}
                  placeholder="Select date"
                />
              )}
            </div>

            {/* Check-out Date */}
            <div className="relative">
              <label className="block text-[10px] text-gray-600 mb-2 uppercase font-semibold tracking-wider">
                {/* CHECK-OUT {autoFillMode && <span className="text-blue-600">(Auto-filled)</span>} */}
                CHECK-OUT
              </label>
              {autoFillMode ? (
                <div className="w-full text-left p-3 bg-gray-100/70 backdrop-blur-sm rounded-xl border border-gray-200 cursor-not-allowed">
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-gray-500 flex-shrink-0" size={14} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900">
                        {checkOutDate ? new Date(checkOutDate).toLocaleDateString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }) : "Not set"}
                      </div>
                      <div className="text-[10px] text-gray-500">Fixed date</div>
                    </div>
                  </div>
                </div>
              ) : (
                <DatePicker
                  value={checkOutDate}
                  onChange={setCheckOutDate}
                  placeholder="Select date"
                />
              )}
            </div>

            {/* Star Rating */}
            <div className="relative">
              <label className="block text-[10px] text-gray-600 mb-2 uppercase font-semibold tracking-wider">
                RATING
              </label>
              <StarRatingSelector
                rating={starRating}
                onRatingChange={setStarRating}
              />
            </div>
          </div>

          {/* Smart Search Button */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <button
              onClick={handleSearch}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border-none transform hover:scale-105"
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
          </div>
        </div>

        {/* Results Section */}
        {(showResults || isLoading) && (
          <div className="space-y-4 relative z-10">
            {/* AI Recommendations Box with RGB Glowing Border */}
            <div className="relative">
              {/* RGB Continuous Flowing Border */}
              <div className="absolute -inset-[3px] rounded-2xl pointer-events-none">
                <div
                  className="absolute inset-0 rounded-2xl border-4 border-transparent animate-rgb-flow"
                  style={{
                    background:
                      "linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080, #ff0000) border-box",
                    WebkitMask:
                      "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}
                ></div>

                {/* Flowing Glow Overlay */}
                <div className="absolute inset-0 rounded-2xl animate-rgb-glow-continuous">
                  <div
                    className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-red-500/60 via-green-500/60 via-blue-500/60 to-red-500/60 blur-sm shadow-[0_0_25px_rgba(255,0,0,0.8),0_0_25px_rgba(0,255,0,0.8),0_0_25px_rgba(0,0,255,0.8)]"
                    style={{
                      WebkitMask:
                        "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                    }}
                  ></div>
                </div>
              </div>

              {/* Content Box */}
              <div className="relative bg-white/90 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden">
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
                        Finding best stays...
                      </p>
                    </div>
                  ) : showResults ? (
                    <div className="space-y-3">
                      {searchResults.length > 0 ? (
                        <>
                          {searchResults.map((stay) => (
                            <StayCard
                              key={stay.stay_id}
                              stay={stay}
                              isBooked={bookedOption === stay.stay_id}
                              onBook={handleBooking}
                            />
                          ))}
                        </>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p className="text-sm">No stays available</p>
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
            </div>
          </div>
        )}
      </div>

      {/* Floating Continue Button */}
      {onContinue && (
        <div className="absolute bottom-6 right-6 z-20">
          <button
            onClick={() => {
              console.log("🚀 Continue clicked with selected stay data:", selectedStayData);
              onContinue(selectedStayData || undefined);
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

        .animate-rgb-flow {
          animation: rgb-flow 3s linear infinite;
          background-size: 200% 100%;
        }

        .animate-rgb-glow-continuous {
          animation: rgb-glow-continuous 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
