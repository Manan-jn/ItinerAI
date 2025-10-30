"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FiChevronLeft, FiChevronRight, FiChevronDown } from "react-icons/fi";
import { MdFlight, MdHotel, MdTrain } from "react-icons/md";
import ItinerAIChatBox from "./ItinerAIChatBox";
import { storeSelectedDate } from "../utils/tripStorage";
import {
  fetchConveyanceData,
  fetchStayData,
  getDateRangeForMonth,
  processPriceDataForMonth,
  hasValidFlightFilters,
  hasValidStayFilters,
  DatePriceInfo,
  FlightData,
  TrainData,
  StayData,
} from "../utils/priceApi";

interface DateSelectorWidgetProps {
  isVisible: boolean;
  onToggle: () => void;
  onDateSelected?: (date: Date) => void;
  userId?: string;
  sessionId?: string;
  selectedTrip?: any; // NEW - Trip data to extract conveyance details
}

interface DateInfo {
  date: Date;
  flightPrice: number | null;
  trainPrice: number | null;
  hotelPrice: number | null;
  isToday?: boolean;
  isSelected?: boolean;
  isLoading?: boolean;
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
  onDateSelected,
  userId,
  sessionId,
  selectedTrip, // NEW
}: DateSelectorWidgetProps) {
  const [chatInput, setChatInput] = useState("");
  // Set to December 2025 to match sample data
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 11, 1)); // December 2025
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Price data states
  const [flightData, setFlightData] = useState<FlightData[]>([]);
  const [trainData, setTrainData] = useState<TrainData[]>([]);
  const [stayData, setStayData] = useState<StayData[]>([]);
  const [priceData, setPriceData] = useState<DatePriceInfo[]>([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [lastFetchedMonth, setLastFetchedMonth] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Conveyance type selection states
  const [selectedConveyanceTypes, setSelectedConveyanceTypes] = useState<Set<'flights' | 'trains'>>(new Set(['flights']));

  // Filter states - Set defaults to empty for auto-fill
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [isAutoFilled, setIsAutoFilled] = useState(false); // Track if fields are auto-filled
  const [isLoadingMemory, setIsLoadingMemory] = useState(false); // Loading state for memory fetch
  const [flightClass, setFlightClass] = useState("Economy");
  const [trainClass, setTrainClass] = useState("SL");
  const [hotelRating, setHotelRating] = useState("3 Star");
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [showFlightClassDropdown, setShowFlightClassDropdown] = useState(false);
  const [showTrainClassDropdown, setShowTrainClassDropdown] = useState(false);
  const [showHotelRatingDropdown, setShowHotelRatingDropdown] = useState(false);

  // Fetch memory data and pre-fill fields when widget becomes visible
  useEffect(() => {
    const fetchMemoryAndPrefill = async () => {
      if (!isVisible || !userId || !sessionId || !selectedTrip) {
        console.log("📋 DateSelector: Missing required props for auto-fill", {
          isVisible,
          userId: !!userId,
          sessionId: !!sessionId,
          selectedTrip: !!selectedTrip
        });
        return;
      }

      // Skip if already auto-filled
      if (isAutoFilled) {
        console.log("📋 DateSelector: Already auto-filled, skipping");
        return;
      }

      console.log("📋 DateSelector: Starting memory data fetch for auto-fill");
      setIsLoadingMemory(true);

      try {
        // Fetch memory data to get source_point
        console.log("📋 DateSelector: Fetching memory data with:", { userId, sessionId });
        const memoryResponse = await fetch("/api/memory/get", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            session_id: sessionId,
          }),
        });

        let extractedFromCity = "";
        let extractedToCity = "";

        if (memoryResponse.ok) {
          const memoryData = await memoryResponse.json();
          console.log("✅ Memory data received:", memoryData);

          // Extract source_point place_name
          if (memoryData.source_point && memoryData.source_point.place_name) {
            extractedFromCity = memoryData.source_point.place_name;
            console.log("✅ Extracted from_city from source_point:", extractedFromCity);
          } else {
            console.log("⚠️ No source_point.place_name found in memory data");
          }
        } else {
          console.warn("⚠️ Failed to fetch memory data, status:", memoryResponse.status);
          const errorText = await memoryResponse.text();
          console.warn("⚠️ Error response:", errorText);
        }

        // Extract to_city from Day 1 conveyance_details in selectedTrip
        console.log("📋 DateSelector: Extracting to_city from selectedTrip:", selectedTrip);
        if (selectedTrip.day_wise_plan && Array.isArray(selectedTrip.day_wise_plan)) {
          const day1 = selectedTrip.day_wise_plan.find((day: any) => day.day_number === 1);
          console.log("📋 DateSelector: Found Day 1:", day1);
          
          if (day1 && day1.conveyance_details && day1.conveyance_details.to_city) {
            extractedToCity = day1.conveyance_details.to_city;
            console.log("✅ Extracted to_city from Day 1:", extractedToCity);

            // Handle city name formatting
            if (extractedToCity) {
              extractedToCity = extractedToCity.charAt(0).toUpperCase() + extractedToCity.slice(1).toLowerCase();
              if (extractedToCity === "Delhi") extractedToCity = "New Delhi";
              console.log("✅ Formatted to_city:", extractedToCity);
            }
          } else {
            console.log("⚠️ No conveyance_details.to_city found in Day 1");
          }
        } else {
          console.log("⚠️ No day_wise_plan found in selectedTrip");
        }

        // Handle city name formatting for from_city
        if (extractedFromCity) {
          extractedFromCity = extractedFromCity.charAt(0).toUpperCase() + extractedFromCity.slice(1).toLowerCase();
          if (extractedFromCity === "Delhi") extractedFromCity = "New Delhi";
          console.log("✅ Formatted from_city:", extractedFromCity);
        }

        // Set the extracted values
        if (extractedFromCity) {
          setFromCity(extractedFromCity);
          console.log("📍 Set from_city to:", extractedFromCity);
        }

        if (extractedToCity) {
          setToCity(extractedToCity);
          console.log("📍 Set to_city to:", extractedToCity);
        }

        // Mark as auto-filled if both cities were extracted
        if (extractedFromCity && extractedToCity) {
          setIsAutoFilled(true);
          console.log("✅ DateSelector fields auto-filled and locked");
        } else {
          console.log("⚠️ Could not auto-fill both cities:", {
            fromCity: extractedFromCity,
            toCity: extractedToCity
          });
        }

      } catch (error) {
        console.error("❌ Error fetching memory data:", error);
      } finally {
        setIsLoadingMemory(false);
      }
    };

    fetchMemoryAndPrefill();
  }, [isVisible, userId, sessionId, selectedTrip]); // Removed isAutoFilled from dependencies

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      console.log("Chat submitted:", chatInput);
      setChatInput("");
    }
  };
  const preferredTimeScrollRef = useRef<HTMLDivElement>(null);

  // Cities based on available data
  const cities = [
    "Leh",
    "Mumbai",
    "New Delhi",
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
  const trainClasses = ["1AC", "2AC", "3AC", "SL"];
  const hotelRatings = ["Budget", "3 Star", "4 Star", "5 Star", "Luxury"];

  // Generate calendar dates for current month with API-fetched prices
  const generateCalendarDates = (): DateInfo[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const dates: DateInfo[] = [];

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split("T")[0];

      // Find price data for this date
      const priceInfo = priceData.find((p) => p.date === dateString);

      // Debug logging for first few dates
      if (day <= 3) {
        console.log(
          `Date ${dateString}: flight=${priceInfo?.cheapestFlightPrice}, stay=${priceInfo?.cheapestStayPrice}`
        );
      }

      dates.push({
        date,
        flightPrice: priceInfo?.cheapestFlightPrice || null,
        trainPrice: priceInfo?.cheapestTrainPrice || null,
        hotelPrice: priceInfo?.cheapestStayPrice || null,
        isToday: isToday(date),
        isSelected: selectedDate?.toDateString() === date.toDateString(),
        isLoading: isLoadingPrices,
      });
    }

    return dates;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handlePrevMonth = () => {
    // Don't allow navigation while loading prices
    if (isLoadingPrices) return;

    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    // Don't allow navigation while loading prices
    if (isLoadingPrices) return;

    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  // Fetch price data for the current month
  const fetchPriceData = useCallback(async () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthKey = `${year}-${month}`;

    // Skip if already fetched for this month
    if (lastFetchedMonth === monthKey) return;

    const { from_date, to_date } = getDateRangeForMonth(year, month);

    setIsLoadingPrices(true);

    try {
      setApiError(null);
      const promises = [];

      // Fetch flight data if flights selected and filters are valid
      if (selectedConveyanceTypes.has('flights') && hasValidFlightFilters(fromCity, toCity)) {
        promises.push(
          fetchConveyanceData({
            conveyance_type: 'flights',
            departure_city: fromCity,
            arrival_city: toCity,
            from_date,
            to_date,
          })
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      // Fetch train data if trains selected and filters are valid
      if (selectedConveyanceTypes.has('trains') && hasValidFlightFilters(fromCity, toCity)) {
        promises.push(
          fetchConveyanceData({
            conveyance_type: 'trains',
            departure_city: fromCity,
            arrival_city: toCity,
            from_date,
            to_date,
          })
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      // Fetch stay data if filters are valid
      if (hasValidStayFilters(toCity)) {
        promises.push(
          fetchStayData({
            city: toCity,
            from_date,
            to_date,
          })
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      const [flights, trains, stays] = (await Promise.all(promises)) as [
        FlightData[],
        TrainData[],
        StayData[]
      ];

      console.log("Fetched data:", {
        flights: flights.length,
        trains: trains.length,
        stays: stays.length,
        fromCity,
        toCity,
        flightClass,
        trainClass,
      });

      setFlightData(flights);
      setTrainData(trains);
      setStayData(stays);

      // Process price data for each date in the month
      const processedPrices = processPriceDataForMonth(
        flights,
        trains,
        stays,
        year,
        month,
        flightClass,
        trainClass
      );

      console.log("Processed prices for month:", processedPrices.slice(0, 5));

      setPriceData(processedPrices);
      setLastFetchedMonth(monthKey);
    } catch (error) {
      console.error("Error fetching price data:", error);
      setApiError("Failed to fetch price data. Please try again.");
    } finally {
      setIsLoadingPrices(false);
    }
  }, [currentMonth, fromCity, toCity, flightClass, trainClass, selectedConveyanceTypes, lastFetchedMonth]);

  // Fetch price data when month or filters change
  useEffect(() => {
    fetchPriceData();
  }, [fetchPriceData]);

  // Reset price data when filters change
  useEffect(() => {
    setLastFetchedMonth(null);
    setPriceData([]);
  }, [fromCity, toCity, flightClass, trainClass, selectedConveyanceTypes]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const toggleConveyanceType = (type: 'flights' | 'trains') => {
    const newTypes = new Set(selectedConveyanceTypes);
    if (newTypes.has(type)) {
      // Don't allow deselecting if it's the only one selected
      if (newTypes.size > 1) {
        newTypes.delete(type);
      }
    } else {
      newTypes.add(type);
    }
    setSelectedConveyanceTypes(newTypes);
  };

  const handleContinueClick = async () => {
    if (!selectedDate) {
      console.warn("No date selected");
      return;
    }

    try {
      // Store date in Firestore and update memory API
      if (userId && sessionId) {
        console.log("Storing selected date:", selectedDate);
        await storeSelectedDate(userId, sessionId, selectedDate);
        console.log("Date stored successfully");
      } else {
        console.warn("Missing userId or sessionId for date storage");
      }

      // Call the callback if provided
      if (onDateSelected) {
        onDateSelected(selectedDate);
      }
    } catch (error) {
      console.error("Error in handleContinueClick:", error);
      alert("Failed to save date selection. Please try again.");
    }
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

          {/* Conveyance Type Selection */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-300 shadow-sm">
            <h4 className="text-xs font-semibold text-gray-800 mb-3">Conveyance Type</h4>
            <div className="flex gap-2">
              <button
                onClick={() => toggleConveyanceType('flights')}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedConveyanceTypes.has('flights')
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                }`}
              >
                <MdFlight size={14} />
                <span>Flights</span>
              </button>
              <button
                onClick={() => toggleConveyanceType('trains')}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedConveyanceTypes.has('trains')
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300'
                }`}
              >
                <MdTrain size={14} />
                <span>Trains</span>
              </button>
            </div>
          </div>

          {/* Conveyance Filters Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-blue-200 shadow-sm relative z-20 overflow-visible">
            <div className="flex items-center gap-2 mb-3">
              {selectedConveyanceTypes.has('flights') && selectedConveyanceTypes.has('trains') ? (
                <>
                  <MdFlight className="text-blue-600" size={16} />
                  <MdTrain className="text-green-600" size={16} />
                  <h4 className="text-xs font-semibold text-gray-800">Flights & Trains</h4>
                </>
              ) : selectedConveyanceTypes.has('flights') ? (
                <>
                  <MdFlight className="text-blue-600" size={18} />
                  <h4 className="text-xs font-semibold text-gray-800">Flights</h4>
                </>
              ) : (
                <>
                  <MdTrain className="text-green-600" size={18} />
                  <h4 className="text-xs font-semibold text-gray-800">Trains</h4>
                </>
              )}
            </div>

            {/* From City */}
            <div className="mb-3 relative">
              <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">
                {/* From {isAutoFilled && <span className="text-blue-600">(Auto-filled)</span>} */}
                From
              </label>
              <button
                onClick={() => !isAutoFilled && setShowFromDropdown(!showFromDropdown)}
                disabled={isAutoFilled}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-all text-xs flex items-center justify-between ${
                  isAutoFilled 
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed" 
                    : "bg-white border-gray-200 hover:border-blue-300 cursor-pointer"
                }`}
              >
                <span className={`truncate ${isAutoFilled ? "text-gray-600" : "text-gray-700"}`}>
                  {fromCity || "Select city"}
                </span>
                {!isAutoFilled && (
                  <FiChevronDown
                    className={`ml-2 transition-transform text-gray-500 ${
                      showFromDropdown ? "rotate-180" : ""
                    }`}
                    size={12}
                  />
                )}
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
                {/* To {isAutoFilled && <span className="text-blue-600">(Auto-filled)</span>} */}
                To
              </label>
              <button
                onClick={() => !isAutoFilled && setShowToDropdown(!showToDropdown)}
                disabled={isAutoFilled}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-all text-xs flex items-center justify-between ${
                  isAutoFilled 
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed" 
                    : "bg-white border-gray-200 hover:border-blue-300 cursor-pointer"
                }`}
              >
                <span className={`truncate ${isAutoFilled ? "text-gray-600" : "text-gray-700"}`}>
                  {toCity || "Select city"}
                </span>
                {!isAutoFilled && (
                  <FiChevronDown
                    className={`ml-2 transition-transform text-gray-500 ${
                      showToDropdown ? "rotate-180" : ""
                    }`}
                    size={12}
                  />
                )}
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

            {/* Flight Class - Only show if flights selected */}
            {selectedConveyanceTypes.has('flights') && (
              <div className="mb-3 relative">
                <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">
                  Flight Class
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
            )}

            {/* Train Class - Only show if trains selected */}
            {selectedConveyanceTypes.has('trains') && (
              <div className="relative">
                <label className="block text-[10px] text-gray-500 mb-1 uppercase font-medium">
                  Train Class
                </label>
                <button
                  onClick={() =>
                    setShowTrainClassDropdown(!showTrainClassDropdown)
                  }
                  className="w-full text-left px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-all text-xs flex items-center justify-between"
                >
                  <span className="truncate text-gray-700">{trainClass}</span>
                  <FiChevronDown
                    className={`ml-2 transition-transform text-gray-500 ${
                      showTrainClassDropdown ? "rotate-180" : ""
                    }`}
                    size={12}
                  />
                </button>
                {showTrainClassDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {trainClasses.map((cls) => (
                      <button
                        key={cls}
                        onClick={() => {
                          setTrainClass(cls);
                          setShowTrainClassDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-green-50 transition-colors"
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
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
              className={`p-2 rounded-lg transition-all ${
                isLoadingPrices
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-white/70 cursor-pointer"
              }`}
              disabled={isLoadingPrices}
              title={isLoadingPrices ? "Loading prices..." : "Previous month"}
            >
              <FiChevronLeft
                className={`${
                  isLoadingPrices ? "text-gray-400" : "text-gray-700"
                }`}
                size={20}
              />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-800">{monthName}</h2>
              {isLoadingPrices && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-xs text-gray-600">
                    Loading prices...
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleNextMonth}
              className={`p-2 rounded-lg transition-all ${
                isLoadingPrices
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-white/70 cursor-pointer"
              }`}
              disabled={isLoadingPrices}
              title={isLoadingPrices ? "Loading prices..." : "Next month"}
            >
              <FiChevronRight
                className={`${
                  isLoadingPrices ? "text-gray-400" : "text-gray-700"
                }`}
                size={20}
              />
            </button>
          </div>

          {/* Error Message */}
          {apiError && (
            <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0" />
                <span className="text-sm text-red-700">{apiError}</span>
                <button
                  onClick={() => {
                    setApiError(null);
                    fetchPriceData();
                  }}
                  className="ml-auto text-xs text-red-600 hover:text-red-800 underline"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Price Legend or Instructions */}
          {hasValidFlightFilters(fromCity, toCity) ||
          hasValidStayFilters(toCity) ? (
            <div className="mx-4 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
                <span className="text-gray-600 font-medium">Price Legend:</span>
                {selectedConveyanceTypes.has('flights') && hasValidFlightFilters(fromCity, toCity) && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-red-700">Flights</span>
                  </div>
                )}
                {selectedConveyanceTypes.has('trains') && hasValidFlightFilters(fromCity, toCity) && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-green-700">Trains</span>
                  </div>
                )}
                {hasValidStayFilters(toCity) && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-yellow-700">Hotels</span>
                  </div>
                )}
                <span className="text-gray-500 text-[10px]">
                  Prices shown are cheapest available
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-4 mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-center text-xs text-gray-600">
                <span>
                  Select departure and destination cities to see live prices
                </span>
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          <div
            className={`flex-1 overflow-y-auto p-4 relative ${
              isLoadingPrices ? "pointer-events-none" : ""
            }`}
          >
            {/* Continue Button - Fixed at bottom */}
            <div className="absolute bottom-4 right-4 z-20">
              <button
                onClick={handleContinueClick}
                disabled={!selectedDate}
                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  selectedDate
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:scale-105 cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
                }`}
              >
                Continue
              </button>
            </div>
            {/* Loading overlay */}
            {isLoadingPrices && (
              <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-10 rounded-lg" />
            )}

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
                    {dateInfo.isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        {/* Flight Price */}
                        {dateInfo.flightPrice !== null &&
                          selectedConveyanceTypes.has('flights') &&
                          hasValidFlightFilters(fromCity, toCity) && (
                            <div className="flex items-center justify-center gap-1">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  dateInfo.isSelected
                                    ? "bg-red-400"
                                    : "bg-red-500"
                                }`}
                              />
                              <span
                                className={`text-[9px] font-semibold ${
                                  dateInfo.isSelected
                                    ? "text-white"
                                    : "text-red-700"
                                }`}
                              >
                                ₹{dateInfo.flightPrice.toLocaleString()}
                              </span>
                            </div>
                          )}

                        {/* Train Price */}
                        {dateInfo.trainPrice !== null &&
                          selectedConveyanceTypes.has('trains') &&
                          hasValidFlightFilters(fromCity, toCity) && (
                            <div className="flex items-center justify-center gap-1">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  dateInfo.isSelected
                                    ? "bg-green-400"
                                    : "bg-green-500"
                                }`}
                              />
                              <span
                                className={`text-[9px] font-semibold ${
                                  dateInfo.isSelected
                                    ? "text-white"
                                    : "text-green-700"
                                }`}
                              >
                                ₹{dateInfo.trainPrice.toLocaleString()}
                              </span>
                            </div>
                          )}

                        {/* Hotel Price */}
                        {dateInfo.hotelPrice !== null &&
                          hasValidStayFilters(toCity) && (
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
                                  dateInfo.isSelected
                                    ? "text-white"
                                    : "text-yellow-700"
                                }`}
                              >
                                ₹{dateInfo.hotelPrice.toLocaleString()}
                              </span>
                            </div>
                          )}

                        {/* Show placeholder when no data available */}
                        {dateInfo.flightPrice === null &&
                          dateInfo.trainPrice === null &&
                          dateInfo.hotelPrice === null && (
                            <div className="flex items-center justify-center">
                              <span
                                className={`text-[8px] ${
                                  dateInfo.isSelected
                                    ? "text-white/70"
                                    : "text-gray-400"
                                }`}
                              >
                                No data
                              </span>
                            </div>
                          )}
                      </>
                    )}
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
                      {hasValidFlightFilters(fromCity, toCity) && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-xs font-semibold text-red-700">
                            ₹{card.flightPrice.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {hasValidStayFilters(toCity) && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span className="text-xs font-semibold text-yellow-700">
                            ₹{card.hotelPrice.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {!hasValidFlightFilters(fromCity, toCity) &&
                        !hasValidStayFilters(toCity) && (
                          <span className="text-xs text-gray-500">
                            Select cities to see prices
                          </span>
                        )}
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
            <ItinerAIChatBox
              value={chatInput}
              onChange={setChatInput}
              onSubmit={handleChatSubmit}
              placeholder="Ask ItinerAI"
              theme="purple"
              inputType="input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
