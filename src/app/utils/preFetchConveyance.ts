import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";

// Type definitions
interface ConveyanceDayDetails {
  day_number: number;
  from_city: string;
  to_city: string;
  is_required: boolean;
}

interface PreFetchRequest {
  userId: string;
  sessionId: string;
  tripDate: string; // YYYY-MM-DD format
  dayDetails: ConveyanceDayDetails[];
}

interface ConveyanceAPIResponse {
  ai_recommendations: {
    flights: any[];
    trains: any[];
  };
  utility_flights: any[];
  utility_trains: any[];
}

/**
 * Calculate trip date for a specific day number
 * @param baseTripDate - The selected trip start date in YYYY-MM-DD format
 * @param dayNumber - The day number (1-based)
 * @returns Date string in YYYY-MM-DD format
 */
function calculateDayDate(baseTripDate: string, dayNumber: number): string {
  const baseDate = new Date(baseTripDate);
  // Add (dayNumber - 1) days to get the date for that specific day
  baseDate.setDate(baseDate.getDate() + (dayNumber - 1));
  return baseDate.toISOString().split("T")[0];
}

/**
 * Normalize city name for API calls
 * @param cityName - Raw city name
 * @returns Normalized city name
 */
function normalizeCityName(cityName: string): string {
  if (!cityName) return "";
  
  // Handle special cases
  if (cityName === "user_location" || cityName === "User Location") {
    return "Mumbai"; // Default location
  }
  
  // Capitalize first letter
  let normalized = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();
  
  // Handle Delhi → New Delhi
  if (normalized === "Delhi") {
    normalized = "New Delhi";
  }
  
  return normalized;
}

/**
 * Fetch conveyance data for a single day from all endpoints
 * @param dayNumber - The day number
 * @param fromCity - Origin city
 * @param toCity - Destination city
 * @param travelDate - Date in YYYY-MM-DD format
 * @param userId - User ID
 * @param sessionId - Session ID
 * @returns Promise with all conveyance data
 */
async function fetchConveyanceForDay(
  dayNumber: number,
  fromCity: string,
  toCity: string,
  travelDate: string,
  userId: string,
  sessionId: string
): Promise<ConveyanceAPIResponse> {
  console.log(`🔄 Pre-fetching conveyance for Day ${dayNumber}:`, {
    fromCity,
    toCity,
    travelDate,
  });

  const normalizedFromCity = normalizeCityName(fromCity);
  const normalizedToCity = normalizeCityName(toCity);

  // Make 3 parallel API calls
  const [aiResponse, utilityFlightsResponse, utilityTrainsResponse] = await Promise.allSettled([
    // AI Recommendations
    fetch("/api/conveyance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        session_id: sessionId,
        message: `Give me all the travel options from ${normalizedFromCity} to ${normalizedToCity} on ${new Date(
          travelDate
        ).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
      }),
    }),
    // Utility Flights
    fetch("/api/utility/conveyance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conveyance_type: "flights",
        departure_city: normalizedFromCity,
        arrival_city: normalizedToCity,
        from_date: travelDate,
        to_date: travelDate,
      }),
    }),
    // Utility Trains
    fetch("/api/utility/conveyance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conveyance_type: "trains",
        departure_city: normalizedFromCity,
        arrival_city: normalizedToCity,
        from_date: travelDate,
        to_date: travelDate,
      }),
    }),
  ]);

  const result: ConveyanceAPIResponse = {
    ai_recommendations: {
      flights: [],
      trains: [],
    },
    utility_flights: [],
    utility_trains: [],
  };

  // Parse AI Recommendations
  if (aiResponse.status === "fulfilled" && aiResponse.value.ok) {
    try {
      const aiData = await aiResponse.value.json();
      if (
        aiData.message &&
        aiData.message.conveyances &&
        aiData.message.conveyances.conveyance_details
      ) {
        const details = aiData.message.conveyances.conveyance_details;
        result.ai_recommendations.flights = details.flights || [];
        result.ai_recommendations.trains = details.trains || [];
        console.log(
          `✅ Day ${dayNumber} AI data: ${result.ai_recommendations.flights.length} flights, ${result.ai_recommendations.trains.length} trains`
        );
      }
    } catch (error) {
      console.error(`❌ Error parsing AI data for Day ${dayNumber}:`, error);
    }
  } else {
    console.warn(`⚠️ AI recommendations failed for Day ${dayNumber}`);
  }

  // Parse Utility Flights
  if (utilityFlightsResponse.status === "fulfilled" && utilityFlightsResponse.value.ok) {
    try {
      const flightsData = await utilityFlightsResponse.value.json();
      if (Array.isArray(flightsData)) {
        result.utility_flights = flightsData;
        console.log(`✅ Day ${dayNumber} Utility flights: ${flightsData.length}`);
      }
    } catch (error) {
      console.error(`❌ Error parsing utility flights for Day ${dayNumber}:`, error);
    }
  } else {
    console.warn(`⚠️ Utility flights failed for Day ${dayNumber}`);
  }

  // Parse Utility Trains
  if (utilityTrainsResponse.status === "fulfilled" && utilityTrainsResponse.value.ok) {
    try {
      const trainsData = await utilityTrainsResponse.value.json();
      if (Array.isArray(trainsData)) {
        result.utility_trains = trainsData;
        console.log(`✅ Day ${dayNumber} Utility trains: ${trainsData.length}`);
      }
    } catch (error) {
      console.error(`❌ Error parsing utility trains for Day ${dayNumber}:`, error);
    }
  } else {
    console.warn(`⚠️ Utility trains failed for Day ${dayNumber}`);
  }

  return result;
}

/**
 * Generate composite key for route + date combination
 * @param fromCity - Origin city
 * @param toCity - Destination city
 * @param travelDate - Travel date in YYYY-MM-DD format
 * @returns Composite key string
 */
function generateRouteKey(fromCity: string, toCity: string, travelDate: string): string {
  const normalizedFrom = normalizeCityName(fromCity);
  const normalizedTo = normalizeCityName(toCity);
  // Create a unique key combining route and date
  return `${normalizedFrom}|${normalizedTo}|${travelDate}`;
}

/**
 * Pre-fetch conveyance data for all required days and store in Firestore
 * @param request - Pre-fetch request details
 */
export async function preFetchConveyanceData(request: PreFetchRequest): Promise<void> {
  const { userId, sessionId, tripDate, dayDetails } = request;

  console.log("🚀 Starting pre-fetch for conveyance data:", {
    userId,
    tripDate,
    totalDays: dayDetails.length,
    requiredDays: dayDetails.filter((d) => d.is_required).length,
  });

  // Filter only days that require conveyance
  const daysRequiringConveyance = dayDetails.filter((day) => day.is_required);

  if (daysRequiringConveyance.length === 0) {
    console.log("ℹ️ No days require conveyance, skipping pre-fetch");
    return;
  }

  // Create parallel fetch promises for all required days
  const fetchPromises = daysRequiringConveyance.map((day) => {
    const dayDate = calculateDayDate(tripDate, day.day_number);
    return fetchConveyanceForDay(
      day.day_number,
      day.from_city,
      day.to_city,
      dayDate,
      userId,
      sessionId
    );
  });

  try {
    // Execute all fetches in parallel
    const results = await Promise.all(fetchPromises);

    // Prepare data for Firestore storage using composite keys
    const preFetchedData: Record<string, ConveyanceAPIResponse> = {};
    daysRequiringConveyance.forEach((day, index) => {
      const dayDate = calculateDayDate(tripDate, day.day_number);
      const routeKey = generateRouteKey(day.from_city, day.to_city, dayDate);
      
      preFetchedData[routeKey] = {
        ...results[index],
        // Add metadata for easy retrieval
        metadata: {
          day_number: day.day_number,
          from_city: normalizeCityName(day.from_city),
          to_city: normalizeCityName(day.to_city),
          travel_date: dayDate,
          route_key: routeKey,
          fetched_at: new Date().toISOString(),
        },
      } as any;
      
      console.log(`📍 Storing route: ${routeKey}`);
    });

    // Store in Firestore
    await storePreFetchedConveyanceData(userId, preFetchedData);

    console.log("✅ Pre-fetch completed and stored successfully");
  } catch (error) {
    console.error("❌ Error during pre-fetch:", error);
    throw error;
  }
}

/**
 * Store pre-fetched conveyance data in Firestore
 * @param userId - User UUID
 * @param data - Pre-fetched conveyance data indexed by route key
 */
async function storePreFetchedConveyanceData(
  userId: string,
  data: Record<string, ConveyanceAPIResponse>
): Promise<void> {
  try {
    const docRef = doc(db, "pre_fetch_data_conveyance_stays", userId);
    
    await setDoc(
      docRef,
      {
        conveyance_data: data,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log("💾 Stored pre-fetched data in Firestore for user:", userId);
    console.log("📊 Total routes cached:", Object.keys(data).length);
  } catch (error) {
    console.error("❌ Error storing pre-fetched data:", error);
    throw error;
  }
}

/**
 * Retrieve pre-fetched conveyance data from Firestore by route
 * @param userId - User UUID
 * @param fromCity - Origin city
 * @param toCity - Destination city
 * @param travelDate - Travel date in YYYY-MM-DD format
 * @returns Pre-fetched data for the route or null
 */
export async function getPreFetchedConveyanceData(
  userId: string,
  fromCity: string,
  toCity: string,
  travelDate: string
): Promise<any> {
  try {
    const routeKey = generateRouteKey(fromCity, toCity, travelDate);
    
    console.log(`🔍 Retrieving pre-fetched data for route: ${routeKey}`);
    
    const docRef = doc(db, "pre_fetch_data_conveyance_stays", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const routeData = data.conveyance_data?.[routeKey];
      
      if (routeData) {
        console.log(`✅ Found cached data for route: ${routeKey}`);
        return routeData;
      } else {
        console.log(`ℹ️ No cached data for route: ${routeKey}`);
        console.log("📊 Available routes:", Object.keys(data.conveyance_data || {}));
        return null;
      }
    }

    console.log("ℹ️ No pre-fetched data collection found for user:", userId);
    return null;
  } catch (error) {
    console.error("❌ Error retrieving pre-fetched data:", error);
    return null;
  }
}

/**
 * Retrieve all pre-fetched conveyance data for a user
 * @param userId - User UUID
 * @returns All pre-fetched data or null
 */
export async function getAllPreFetchedConveyanceData(
  userId: string
): Promise<Record<string, ConveyanceAPIResponse> | null> {
  try {
    const docRef = doc(db, "pre_fetch_data_conveyance_stays", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.conveyance_data || null;
    }

    return null;
  } catch (error) {
    console.error("❌ Error retrieving all pre-fetched data:", error);
    return null;
  }
}
