/**
 * Utility functions for managing stay data across components
 */

export interface EnrichedStayData {
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
  check_in_date?: string;
  check_out_date?: string;
  total_nights?: number;
  total_price?: number;
}

/**
 * Retrieve stored stay data from sessionStorage
 */
export function getStoredStayData(userId: string, sessionId: string): EnrichedStayData | null {
  try {
    const stayDataKey = `stay_${userId}_${sessionId}`;
    const storedData = sessionStorage.getItem(stayDataKey);

    if (storedData) {
      return JSON.parse(storedData) as EnrichedStayData;
    }
  } catch (error) {
    console.error("Failed to retrieve stay data from sessionStorage:", error);
  }

  return null;
}

/**
 * Store stay data in sessionStorage
 */
export function storeStayData(userId: string, sessionId: string, stayData: EnrichedStayData): boolean {
  try {
    const stayDataKey = `stay_${userId}_${sessionId}`;
    sessionStorage.setItem(stayDataKey, JSON.stringify(stayData));
    return true;
  } catch (error) {
    console.error("Failed to store stay data in sessionStorage:", error);
    return false;
  }
}

/**
 * Clear stored stay data
 */
export function clearStayData(userId: string, sessionId: string): void {
  try {
    const stayDataKey = `stay_${userId}_${sessionId}`;
    sessionStorage.removeItem(stayDataKey);
  } catch (error) {
    console.error("Failed to clear stay data:", error);
  }
}

/**
 * Calculate total stay cost based on nights and nightly rate
 */
export function calculateStayTotal(
  startingPrice: string | number,
  checkInDate: string,
  checkOutDate: string
): { totalNights: number; totalPrice: number } {
  const price = typeof startingPrice === 'string' ? parseFloat(startingPrice) : startingPrice;

  if (!checkInDate || !checkOutDate) {
    return { totalNights: 1, totalPrice: price };
  }

  const nights = Math.ceil(
    (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    totalNights: Math.max(1, nights),
    totalPrice: price * Math.max(1, nights),
  };
}
