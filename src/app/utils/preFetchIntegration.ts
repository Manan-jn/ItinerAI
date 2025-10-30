import { getPreFetchedConveyanceData, getAllPreFetchedConveyanceData } from "./preFetchConveyance";
import { getPreFetchedStaysData, getAllPreFetchedStaysData } from "./preFetchStays";

/**
 * Integration layer for widgets to easily access pre-fetched data
 * Handles both conveyance and stays data retrieval
 */

// ============================================================================
// CONVEYANCE DATA INTEGRATION
// ============================================================================

/**
 * Get pre-fetched conveyance data for FlightsWidget
 * @param userId - User UUID
 * @param fromCity - Origin city
 * @param toCity - Destination city
 * @param travelDate - Travel date in YYYY-MM-DD format
 * @returns Pre-fetched conveyance data or null
 */
export async function getConveyanceDataForWidget(
  userId: string,
  fromCity: string,
  toCity: string,
  travelDate: string
): Promise<{
  aiFlights: any[];
  aiTrains: any[];
  utilityFlights: any[];
  utilityTrains: any[];
  isCached: boolean;
} | null> {
  try {
    const cachedData = await getPreFetchedConveyanceData(
      userId,
      fromCity,
      toCity,
      travelDate
    );

    if (cachedData) {
      console.log(`✈️ Using cached conveyance data for ${fromCity} → ${toCity}`);
      return {
        aiFlights: cachedData.ai_recommendations?.flights || [],
        aiTrains: cachedData.ai_recommendations?.trains || [],
        utilityFlights: cachedData.utility_flights || [],
        utilityTrains: cachedData.utility_trains || [],
        isCached: true,
      };
    }

    console.log(`ℹ️ No cached conveyance data for ${fromCity} → ${toCity}`);
    return null;
  } catch (error) {
    console.error("❌ Error retrieving conveyance data:", error);
    return null;
  }
}

/**
 * Get all pre-fetched conveyance data for a user
 * Useful for debugging or batch operations
 * @param userId - User UUID
 * @returns All pre-fetched conveyance data
 */
export async function getAllConveyanceDataForUser(
  userId: string
): Promise<Record<string, any> | null> {
  try {
    const allData = await getAllPreFetchedConveyanceData(userId);
    if (allData) {
      console.log(`📊 Retrieved all conveyance data for user ${userId}`);
      console.log(`📍 Available routes: ${Object.keys(allData).length}`);
      return allData;
    }
    return null;
  } catch (error) {
    console.error("❌ Error retrieving all conveyance data:", error);
    return null;
  }
}

// ============================================================================
// STAYS DATA INTEGRATION
// ============================================================================

/**
 * Get pre-fetched stays data for StaysWidget
 * @param userId - User UUID
 * @param city - City name
 * @param checkInDate - Check-in date in YYYY-MM-DD format
 * @param checkOutDate - Check-out date in YYYY-MM-DD format
 * @returns Pre-fetched stays data or null
 */
export async function getStaysDataForWidget(
  userId: string,
  city: string,
  checkInDate: string,
  checkOutDate: string
): Promise<{
  aiStays: any[];
  utilityStays: any[];
  isCached: boolean;
} | null> {
  try {
    const cachedData = await getPreFetchedStaysData(
      userId,
      city,
      checkInDate,
      checkOutDate
    );

    if (cachedData) {
      console.log(`🏨 Using cached stays data for ${city} (${checkInDate} to ${checkOutDate})`);
      return {
        aiStays: cachedData.ai_recommendations || [],
        utilityStays: cachedData.utility_stays || [],
        isCached: true,
      };
    }

    console.log(`ℹ️ No cached stays data for ${city} (${checkInDate} to ${checkOutDate})`);
    return null;
  } catch (error) {
    console.error("❌ Error retrieving stays data:", error);
    return null;
  }
}

/**
 * Get all pre-fetched stays data for a user
 * Useful for debugging or batch operations
 * @param userId - User UUID
 * @returns All pre-fetched stays data
 */
export async function getAllStaysDataForUser(
  userId: string
): Promise<Record<string, any> | null> {
  try {
    const allData = await getAllPreFetchedStaysData(userId);
    if (allData) {
      console.log(`📊 Retrieved all stays data for user ${userId}`);
      console.log(`🏨 Available locations: ${Object.keys(allData).length}`);
      return allData;
    }
    return null;
  } catch (error) {
    console.error("❌ Error retrieving all stays data:", error);
    return null;
  }
}

// ============================================================================
// COMBINED DATA RETRIEVAL
// ============================================================================

/**
 * Get both conveyance and stays data for a day
 * Useful for comprehensive day planning
 * @param userId - User UUID
 * @param dayNumber - Day number
 * @param fromCity - Origin city (for conveyance)
 * @param toCity - Destination city (for conveyance)
 * @param travelDate - Travel date in YYYY-MM-DD format
 * @param stayCity - City for stays
 * @param checkInDate - Check-in date for stays
 * @param checkOutDate - Check-out date for stays
 * @returns Combined data for the day
 */
export async function getDayDataForWidget(
  userId: string,
  dayNumber: number,
  fromCity: string,
  toCity: string,
  travelDate: string,
  stayCity: string,
  checkInDate: string,
  checkOutDate: string
): Promise<{
  conveyance: {
    aiFlights: any[];
    aiTrains: any[];
    utilityFlights: any[];
    utilityTrains: any[];
    isCached: boolean;
  } | null;
  stays: {
    aiStays: any[];
    utilityStays: any[];
    isCached: boolean;
  } | null;
  dayNumber: number;
}> {
  console.log(`📅 Retrieving data for Day ${dayNumber}`);

  const [conveyanceData, staysData] = await Promise.all([
    getConveyanceDataForWidget(userId, fromCity, toCity, travelDate),
    getStaysDataForWidget(userId, stayCity, checkInDate, checkOutDate),
  ]);

  return {
    conveyance: conveyanceData,
    stays: staysData,
    dayNumber,
  };
}

// ============================================================================
// WIDGET INTEGRATION HELPERS
// ============================================================================

/**
 * Prepare conveyance options for FlightsWidget display
 * Combines AI recommendations and utility options
 * @param conveyanceData - Data from getConveyanceDataForWidget
 * @returns Formatted array ready for display
 */
export function formatConveyanceForDisplay(conveyanceData: {
  aiFlights: any[];
  aiTrains: any[];
  utilityFlights: any[];
  utilityTrains: any[];
  isCached: boolean;
}): {
  flights: any[];
  trains: any[];
  buses: any[];
  totalOptions: number;
  source: "cached" | "fresh";
} {
  return {
    flights: [...conveyanceData.aiFlights, ...conveyanceData.utilityFlights],
    trains: [...conveyanceData.aiTrains, ...conveyanceData.utilityTrains],
    buses: [], // Buses if available
    totalOptions:
      conveyanceData.aiFlights.length +
      conveyanceData.aiTrains.length +
      conveyanceData.utilityFlights.length +
      conveyanceData.utilityTrains.length,
    source: conveyanceData.isCached ? "cached" : "fresh",
  };
}

/**
 * Prepare stays options for StaysWidget display
 * Combines AI recommendations and utility options
 * @param staysData - Data from getStaysDataForWidget
 * @returns Formatted array ready for display
 */
export function formatStaysForDisplay(staysData: {
  aiStays: any[];
  utilityStays: any[];
  isCached: boolean;
}): {
  properties: any[];
  totalOptions: number;
  aiCount: number;
  utilityCount: number;
  source: "cached" | "fresh";
} {
  return {
    properties: [...staysData.aiStays, ...staysData.utilityStays],
    totalOptions: staysData.aiStays.length + staysData.utilityStays.length,
    aiCount: staysData.aiStays.length,
    utilityCount: staysData.utilityStays.length,
    source: staysData.isCached ? "cached" : "fresh",
  };
}

// ============================================================================
// STATUS AND DEBUGGING
// ============================================================================

/**
 * Get cache status for a user
 * Shows what data is currently cached
 * @param userId - User UUID
 * @returns Cache status information
 */
export async function getCacheStatus(userId: string): Promise<{
  conveyanceRoutes: number;
  stayLocations: number;
  totalCachedItems: number;
  lastUpdated?: string;
}> {
  const [conveyanceData, staysData] = await Promise.all([
    getAllConveyanceDataForUser(userId),
    getAllStaysDataForUser(userId),
  ]);

  const conveyanceRoutes = conveyanceData ? Object.keys(conveyanceData).length : 0;
  const stayLocations = staysData ? Object.keys(staysData).length : 0;

  return {
    conveyanceRoutes,
    stayLocations,
    totalCachedItems: conveyanceRoutes + stayLocations,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Log cache status to console
 * Useful for debugging
 * @param userId - User UUID
 */
export async function logCacheStatus(userId: string): Promise<void> {
  const status = await getCacheStatus(userId);
  console.log("📊 Cache Status:", {
    "Conveyance Routes": status.conveyanceRoutes,
    "Stay Locations": status.stayLocations,
    "Total Cached Items": status.totalCachedItems,
    "Last Updated": status.lastUpdated,
  });
}
