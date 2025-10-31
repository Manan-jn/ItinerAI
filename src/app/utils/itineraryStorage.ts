/**
 * Firestore Utility for Storing and Retrieving Generated Itineraries
 * 
 * This module handles storing complete itinerary data for each day as users
 * make selections (conveyance, stays) and receive AI-generated itineraries.
 */

import { db } from "../../../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export interface DayItineraryData {
  day_number: number;
  conveyance_details?: {
    is_required: boolean;
    from_city?: string;
    to_city?: string;
    type?: string;
    number?: string;
    operator?: string;
    departure_date?: string;
    departure_time?: string;
    arrival_date?: string;
    arrival_time?: string;
    duration?: string;
    price?: number;
    selected_from_city?: string;
    selected_to_city?: string;
  };
  stay_details?: {
    is_required: boolean;
    city?: string;
    check_in_day?: number;
    check_out_day?: number;
    property_name?: string;
    property_address?: string;
    property_location?: string;
    state?: string;
    country?: string;
    overall_rating?: number;
    starting_price?: string;
    currency?: string;
    available_rooms_total?: number;
    available_from_date?: string;
    available_until_date?: string;
  };
  must_do_activities?: any[];
  places_to_visit?: any[];
  // Additional fields from trip plan or AI response
  [key: string]: any;
}

export interface StoredItinerary {
  userId: string;
  sessionId: string;
  tripTitle: string;
  tripDate: string;
  totalDays: number;
  days: DayItineraryData[];
  lastUpdated: string;
}

/**
 * Store or update generated itinerary for a user
 * @param userId - User UUID
 * @param sessionId - Session UUID
 * @param itineraryData - Complete itinerary data
 */
export async function storeGeneratedItinerary(
  userId: string,
  sessionId: string,
  itineraryData: Partial<StoredItinerary>
): Promise<void> {
  try {
    const docRef = doc(db, "generated_itineraries", userId);
    const docSnap = await getDoc(docRef);

    const dataToStore = {
      userId,
      sessionId,
      ...itineraryData,
      lastUpdated: new Date().toISOString(),
    };

    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(docRef, dataToStore);
      console.log("✅ Updated generated itinerary in Firestore");
    } else {
      // Create new document
      await setDoc(docRef, dataToStore);
      console.log("✅ Stored new generated itinerary in Firestore");
    }
  } catch (error) {
    console.error("❌ Error storing generated itinerary:", error);
    throw error;
  }
}

/**
 * Add or update a single day's itinerary data
 * @param userId - User UUID
 * @param sessionId - Session UUID
 * @param dayData - Day itinerary data
 */
export async function storeDayItinerary(
  userId: string,
  sessionId: string,
  dayData: DayItineraryData
): Promise<void> {
  try {
    const docRef = doc(db, "generated_itineraries", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const existingData = docSnap.data() as StoredItinerary;
      const days = existingData.days || [];

      // Find if day already exists
      const dayIndex = days.findIndex(
        (d: DayItineraryData) => d.day_number === dayData.day_number
      );

      if (dayIndex >= 0) {
        // Update existing day
        days[dayIndex] = { ...days[dayIndex], ...dayData };
        console.log(`✅ Updated day ${dayData.day_number} itinerary`);
      } else {
        // Add new day
        days.push(dayData);
        console.log(`✅ Added day ${dayData.day_number} itinerary`);
      }

      // Sort by day number
      days.sort((a, b) => a.day_number - b.day_number);

      await updateDoc(docRef, {
        days,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      // Create new document with this day
      await setDoc(docRef, {
        userId,
        sessionId,
        days: [dayData],
        lastUpdated: new Date().toISOString(),
      });
      console.log(`✅ Created itinerary with day ${dayData.day_number}`);
    }
  } catch (error) {
    console.error("❌ Error storing day itinerary:", error);
    throw error;
  }
}

/**
 * Retrieve generated itinerary for a user
 * @param userId - User UUID
 * @returns Stored itinerary or null
 */
export async function getGeneratedItinerary(
  userId: string
): Promise<StoredItinerary | null> {
  try {
    const docRef = doc(db, "generated_itineraries", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("✅ Retrieved generated itinerary from Firestore");
      return docSnap.data() as StoredItinerary;
    }

    console.log("ℹ️ No generated itinerary found for user");
    return null;
  } catch (error) {
    console.error("❌ Error retrieving generated itinerary:", error);
    return null;
  }
}

/**
 * Get itinerary data for specific days
 * @param userId - User UUID
 * @param dayNumbers - Array of day numbers to retrieve
 * @returns Array of day itinerary data
 */
export async function getDaysItinerary(
  userId: string,
  dayNumbers: number[]
): Promise<DayItineraryData[]> {
  try {
    const itinerary = await getGeneratedItinerary(userId);

    if (!itinerary || !itinerary.days) {
      return [];
    }

    return itinerary.days.filter((day) =>
      dayNumbers.includes(day.day_number)
    );
  } catch (error) {
    console.error("❌ Error retrieving days itinerary:", error);
    return [];
  }
}

/**
 * Build complete itinerary array for API request
 * Combines stored data with selectedTrip plan data
 * @param userId - User UUID
 * @param selectedTrip - The selected trip object
 * @param upToDayNumber - Include days up to this number
 * @returns Array of complete day itinerary data
 */
export async function buildCompleteItinerary(
  userId: string,
  selectedTrip: any,
  upToDayNumber: number,
  itinerariesGenerated: any[] = [] // NEW: Array of generated itineraries
): Promise<DayItineraryData[]> {
  try {
    const completeItinerary: DayItineraryData[] = [];

    if (!selectedTrip || !selectedTrip.day_wise_plan) {
      console.warn("⚠️ No selectedTrip or day_wise_plan available");
      return [];
    }

    console.log(
      `📦 Building complete itinerary for days 1-${upToDayNumber} with ${itinerariesGenerated.length} generated itineraries`
    );

    for (let dayNum = 1; dayNum <= upToDayNumber; dayNum++) {
      // Get day plan from selectedTrip
      const tripDayPlan = selectedTrip.day_wise_plan.find(
        (d: any) => d.day_number === dayNum
      );

      if (!tripDayPlan) {
        console.warn(`⚠️ No trip plan found for day ${dayNum}`);
        continue;
      }

      // Check if there's a generated itinerary for this day
      const generatedItinerary = itinerariesGenerated.find(
        (itinerary: any) => itinerary.day_number === dayNum
      );

      // Check if this is a newly added day (should only have minimal structure)
      const isNewDay = (tripDayPlan as any).is_new_day === true;

      console.log(
        `🔍 Building day ${dayNum} - is_new_day: ${isNewDay}, has_generated: ${!!generatedItinerary}`
      );

      let completeDayData: DayItineraryData;

      if (generatedItinerary) {
        // CASE: Day has generated itinerary - use it completely
        completeDayData = {
          day_number: dayNum,
          ...generatedItinerary,
        };
        console.log(
          `✅ Using generated itinerary for day ${dayNum}`
        );
      } else if (isNewDay) {
        // CASE: Newly added day - ONLY include day_number, conveyance_details, and stay_details
        completeDayData = {
          day_number: dayNum,
          // Only include conveyance and stay details from selectedTrip
          ...(tripDayPlan.conveyance_details && {
            conveyance_details: { ...tripDayPlan.conveyance_details },
          }),
          ...(tripDayPlan.stay_details && {
            stay_details: { ...tripDayPlan.stay_details },
          }),
        };
        console.log(
          `📝 Minimal structure for newly added day ${dayNum} (conveyance + stay only)`
        );
      } else {
        // CASE: Regular day with user selections - include conveyance, stay, and trip plan info
        completeDayData = {
          day_number: dayNum,
          // Include conveyance and stay from trip plan (user selected)
          ...(tripDayPlan.conveyance_details && {
            conveyance_details: { ...tripDayPlan.conveyance_details },
          }),
          ...(tripDayPlan.stay_details && {
            stay_details: { ...tripDayPlan.stay_details },
          }),
          // Include must_do_activities and places_to_visit if present in trip plan
          ...(tripDayPlan.must_do_activities && {
            must_do_activities: tripDayPlan.must_do_activities,
          }),
          ...(tripDayPlan.places_to_visit && {
            places_to_visit: tripDayPlan.places_to_visit,
          }),
        };
        console.log(
          `📝 Regular day ${dayNum} with user selections from selectedTrip`
        );
      }

      console.log(
        `📦 Day ${dayNum} complete data includes:`,
        {
          has_conveyance: !!completeDayData.conveyance_details,
          has_stay: !!completeDayData.stay_details,
          has_schedule: !!(completeDayData as any).schedule,
          has_title: !!(completeDayData as any).title,
        }
      );

      completeItinerary.push(completeDayData);
    }

    console.log(
      `📦 Built complete itinerary with ${completeItinerary.length} days`
    );
    return completeItinerary;
  } catch (error) {
    console.error("❌ Error building complete itinerary:", error);
    return [];
  }
}

/**
 * Clear generated itinerary for a user
 * @param userId - User UUID
 */
export async function clearGeneratedItinerary(userId: string): Promise<void> {
  try {
    const docRef = doc(db, "generated_itineraries", userId);
    await setDoc(docRef, {
      userId,
      days: [],
      lastUpdated: new Date().toISOString(),
    });
    console.log("✅ Cleared generated itinerary");
  } catch (error) {
    console.error("❌ Error clearing generated itinerary:", error);
    throw error;
  }
}

