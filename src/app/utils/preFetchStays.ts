import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { findPlaceByCity } from "./placesData";

// Type definitions
interface StayDayDetails {
  day_number: number;
  city: string;
  check_in_day: number;
  check_out_day: number;
  is_required: boolean;
}

interface PreFetchStaysRequest {
  userId: string;
  sessionId: string;
  tripDate: string; // YYYY-MM-DD format
  dayDetails: StayDayDetails[];
}

interface StayAPIResponse {
  ai_recommendations: any[];
  utility_stays: any[];
}

/**
 * Calculate date for a specific day number from the trip start date
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
 * Format date for API display
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string
 */
function formatDateForAPI(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

  // Capitalize first letter of each word
  return cityName
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Fetch stay data for a single day from all endpoints
 * @param dayNumber - The day number
 * @param city - City name
 * @param checkInDate - Check-in date in YYYY-MM-DD format
 * @param checkOutDate - Check-out date in YYYY-MM-DD format
 * @param userId - User ID
 * @param sessionId - Session ID
 * @returns Promise with all stay data
 */
async function fetchStaysForDay(
  dayNumber: number,
  city: string,
  checkInDate: string,
  checkOutDate: string,
  userId: string,
  sessionId: string
): Promise<StayAPIResponse> {
  console.log(`🏨 Pre-fetching stays for Day ${dayNumber}:`, {
    city,
    checkInDate,
    checkOutDate,
  });

  const normalizedCity = normalizeCityName(city);
  const checkInFormatted = formatDateForAPI(checkInDate);
  const checkOutFormatted = formatDateForAPI(checkOutDate);

  // Fetch state and country from places.json
  const placeData = await findPlaceByCity(normalizedCity);
  const state = placeData?.state || "Unknown";
  const country = placeData?.country || "India";

  console.log(`🌍 Stay location: ${normalizedCity}, ${state}, ${country}`);

  // Calculate duration in days
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const durationDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  // Make 2 parallel API calls (AI Recommendations and Utility Stays)
  const [aiResponse, utilityResponse] = await Promise.allSettled([
    // AI Recommendations
    fetch("/api/stay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        session_id: sessionId,
        city: normalizedCity,
        country: country,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
      }),
    }),
    //         user_query: `Give me all the stay options available ${checkInFormatted} to ${checkOutFormatted} in ${normalizedCity}`,

    // Utility Stays
    fetch("/api/utility/stay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        city: normalizedCity,
        state: state,
        country: country,
        start_check_in_date: checkInDate,
        end_check_in_date: checkOutDate,
        duration: durationDays,
      }),
    }),
  ]);

  const result: StayAPIResponse = {
    ai_recommendations: [],
    utility_stays: [],
  };

  // Parse AI Recommendations
  if (aiResponse.status === "fulfilled" && aiResponse.value.ok) {
    try {
      const aiData = await aiResponse.value.json();
      if (
        aiData.message &&
        aiData.message.stays &&
        aiData.message.stays.stay_details &&
        Array.isArray(aiData.message.stays.stay_details)
      ) {
        result.ai_recommendations = aiData.message.stays.stay_details.map(
          (stay: any, index: number) => ({
            stay_id: `ai_stay_${dayNumber}_${index}`,
            property_name: stay.property_name,
            property_address: stay.property_address,
            property_location: aiData.message.stays.city,
            city: aiData.message.stays.city,
            state: aiData.message.stays.state,
            country: aiData.message.stays.country,
            overall_rating: parseFloat(stay.overall_rating),
            starting_price: stay.price,
            currency: "INR",
            available_rooms_total: parseInt(stay.available_rooms_total),
            available_from_date: stay.available_from_date,
            available_until_date: stay.available_until_date,
          })
        );
        console.log(
          `✅ Day ${dayNumber} AI stays: ${result.ai_recommendations.length} properties`
        );
      }
    } catch (error) {
      console.error(`❌ Error parsing AI stays for Day ${dayNumber}:`, error);
    }
  } else {
    console.warn(`⚠️ AI stay recommendations failed for Day ${dayNumber}`);
  }

  // Parse Utility Stays
  if (utilityResponse.status === "fulfilled" && utilityResponse.value.ok) {
    try {
      const utilityData = await utilityResponse.value.json();
      if (Array.isArray(utilityData)) {
        result.utility_stays = utilityData.map((stay: any, index: number) => ({
          stay_id: `util_stay_${dayNumber}_${index}`,
          ...stay,
        }));
        console.log(
          `✅ Day ${dayNumber} Utility stays: ${result.utility_stays.length} properties`
        );
      }
    } catch (error) {
      console.error(`❌ Error parsing utility stays for Day ${dayNumber}:`, error);
    }
  } else {
    console.warn(`⚠️ Utility stays failed for Day ${dayNumber}`);
  }

  return result;
}

/**
 * Generate composite key for city + date combination
 * @param city - City name
 * @param checkInDate - Check-in date in YYYY-MM-DD format
 * @param checkOutDate - Check-out date in YYYY-MM-DD format
 * @returns Composite key string
 */
function generateStayKey(
  city: string,
  checkInDate: string,
  checkOutDate: string
): string {
  const normalizedCity = normalizeCityName(city);
  // Create a unique key combining city and dates
  return `${normalizedCity}|${checkInDate}|${checkOutDate}`;
}

/**
 * Pre-fetch stay data for all required days and store in Firestore
 * @param request - Pre-fetch request details
 */
export async function preFetchStaysData(
  request: PreFetchStaysRequest
): Promise<void> {
  const { userId, sessionId, tripDate, dayDetails } = request;

  console.log("🏨 Starting pre-fetch for stays data:", {
    userId,
    tripDate,
    totalDays: dayDetails.length,
    requiredDays: dayDetails.filter((d) => d.is_required).length,
  });

  // Filter only days that require stays
  const daysRequiringStays = dayDetails.filter((day) => day.is_required);

  if (daysRequiringStays.length === 0) {
    console.log("ℹ️ No days require stays, skipping pre-fetch");
    return;
  }

  // Create parallel fetch promises for all required days
  const fetchPromises = daysRequiringStays.map((day) => {
    // Calculate actual dates for check-in and check-out
    const checkInDate = calculateDayDate(tripDate, day.check_in_day);
    const checkOutDate = calculateDayDate(tripDate, day.check_out_day);

    return fetchStaysForDay(
      day.day_number,
      day.city,
      checkInDate,
      checkOutDate,
      userId,
      sessionId
    );
  });

  try {
    // Execute all fetches in parallel
    const results = await Promise.all(fetchPromises);

    // Prepare data for Firestore storage using composite keys
    const preFetchedData: Record<string, any> = {};
    daysRequiringStays.forEach((day, index) => {
      const checkInDate = calculateDayDate(tripDate, day.check_in_day);
      const checkOutDate = calculateDayDate(tripDate, day.check_out_day);
      const stayKey = generateStayKey(day.city, checkInDate, checkOutDate);

      preFetchedData[stayKey] = {
        ...results[index],
        // Add metadata for easy retrieval
        metadata: {
          day_number: day.day_number,
          city: normalizeCityName(day.city),
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          check_in_day: day.check_in_day,
          check_out_day: day.check_out_day,
          stay_key: stayKey,
          fetched_at: new Date().toISOString(),
        },
      };

      console.log(`📍 Storing stay: ${stayKey}`);
    });

    // Store in Firestore
    await storePreFetchedStaysData(userId, preFetchedData);

    console.log("✅ Pre-fetch stays completed and stored successfully");
  } catch (error) {
    console.error("❌ Error during stays pre-fetch:", error);
    throw error;
  }
}

/**
 * Store pre-fetched stays data in Firestore
 * @param userId - User UUID
 * @param data - Pre-fetched stays data indexed by stay key
 */
async function storePreFetchedStaysData(
  userId: string,
  data: Record<string, any>
): Promise<void> {
  try {
    const docRef = doc(db, "pre_fetch_data_conveyance_stays", userId);

    await setDoc(
      docRef,
      {
        stays_data: data,
        stays_updated_at: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log("💾 Stored pre-fetched stays data in Firestore for user:", userId);
    console.log("📊 Total stay locations cached:", Object.keys(data).length);
  } catch (error) {
    console.error("❌ Error storing pre-fetched stays data:", error);
    throw error;
  }
}

/**
 * Retrieve pre-fetched stays data from Firestore by location and dates
 * @param userId - User UUID
 * @param city - City name
 * @param checkInDate - Check-in date in YYYY-MM-DD format
 * @param checkOutDate - Check-out date in YYYY-MM-DD format
 * @returns Pre-fetched data for the stay or null
 */
export async function getPreFetchedStaysData(
  userId: string,
  city: string,
  checkInDate: string,
  checkOutDate: string
): Promise<any> {
  try {
    const stayKey = generateStayKey(city, checkInDate, checkOutDate);

    console.log(`🔍 Retrieving pre-fetched stays data for: ${stayKey}`);

    const docRef = doc(db, "pre_fetch_data_conveyance_stays", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const stayData = data.stays_data?.[stayKey];

      if (stayData) {
        console.log(`✅ Found cached stays data for: ${stayKey}`);
        return stayData;
      } else {
        console.log(`ℹ️ No cached stays data for: ${stayKey}`);
        console.log("📊 Available stay keys:", Object.keys(data.stays_data || {}));
        return null;
      }
    }

    console.log("ℹ️ No pre-fetched stays data collection found for user:", userId);
    return null;
  } catch (error) {
    console.error("❌ Error retrieving pre-fetched stays data:", error);
    return null;
  }
}

/**
 * Retrieve all pre-fetched stays data for a user
 * @param userId - User UUID
 * @returns All pre-fetched stays data or null
 */
export async function getAllPreFetchedStaysData(
  userId: string
): Promise<Record<string, any> | null> {
  try {
    const docRef = doc(db, "pre_fetch_data_conveyance_stays", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.stays_data || null;
    }

    return null;
  } catch (error) {
    console.error("❌ Error retrieving all pre-fetched stays data:", error);
    return null;
  }
}
