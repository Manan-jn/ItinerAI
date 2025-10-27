/**
 * Trip Storage Utility
 * Handles storing selected trip in code memory and Firestore database
 */

import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";

interface TripData {
  trip_title: string;
  [key: string]: any;
}

interface TripStoragePayload {
  user_id: string;
  session_id: string;
  trip_data: TripData;
}

/**
 * Stores the selected trip in Firestore under user's UUID
 */
export async function storeTripInFirestore(
  userId: string,
  tripData: TripData
): Promise<void> {
  try {
    console.log("Storing trip in Firestore for user:", userId);

    // Store trip data under user's document in a 'selected_trip' field
    const userDocRef = doc(db, "users", userId);

    // Get existing user data to preserve it
    const userDocSnapshot = await getDoc(userDocRef);
    const existingData = userDocSnapshot.exists() ? userDocSnapshot.data() : {};

    // Update with new trip data
    await setDoc(
      userDocRef,
      {
        ...existingData,
        selected_trip: tripData,
        trip_updated_at: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log("Trip stored successfully in Firestore");
  } catch (error) {
    console.error("Error storing trip in Firestore:", error);
    throw error;
  }
}

/**
 * Stores the selected trip in code memory (in-memory state)
 * This is typically done via state management in the component
 */
export function storeTripInMemory(tripData: TripData): TripData {
  try {
    console.log("Storing trip in code memory:", tripData);
    // This function returns the trip data to be stored in component state
    return tripData;
  } catch (error) {
    console.error("Error storing trip in memory:", error);
    throw error;
  }
}

/**
 * Stores trip in both Firestore and prepares for memory API
 */
export async function storeSelectedTrip(
  userId: string,
  sessionId: string,
  tripData: TripData
): Promise<TripStoragePayload> {
  try {
    // Store in Firestore
    await storeTripInFirestore(userId, tripData);

    // Store in code memory
    storeTripInMemory(tripData);

    // Return payload for memory API
    const payload: TripStoragePayload = {
      user_id: userId,
      session_id: sessionId,
      trip_data: tripData,
    };

    console.log("Trip stored in both Firestore and memory:", payload);
    return payload;
  } catch (error) {
    console.error("Error storing selected trip:", error);
    throw error;
  }
}

/**
 * Stores the selected start date in Firestore and updates memory API
 */
export async function storeSelectedDate(
  userId: string,
  sessionId: string,
  selectedDate: Date
): Promise<void> {
  try {
    console.log("Storing selected date for user:", userId, "Date:", selectedDate);

    // Store date in Firestore
    const userDocRef = doc(db, "users", userId);
    const userDocSnapshot = await getDoc(userDocRef);
    const existingData = userDocSnapshot.exists() ? userDocSnapshot.data() : {};

    const dateISOString = selectedDate.toISOString();

    await setDoc(
      userDocRef,
      {
        ...existingData,
        trip_date: dateISOString,
        date_updated_at: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log("Date stored successfully in Firestore");

    // Update memory API with the selected date
    await updateMemoryWithDate(userId, sessionId, dateISOString);
  } catch (error) {
    console.error("Error storing selected date:", error);
    throw error;
  }
}

/**
 * Updates memory API with the selected start date
 */
async function updateMemoryWithDate(
  userId: string,
  sessionId: string,
  selectedDate: string
): Promise<void> {
  try {
    console.log("Updating memory API with selected date:", selectedDate);

    const payload = {
      user_id: userId,
      session_id: sessionId,
      updates: {
        trip_date: selectedDate,
      },
    };

    const response = await fetch("/api/memory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Memory API error response:", errorText);
      throw new Error(
        `Memory API error! status: ${response.status}, message: ${errorText}`
      );
    }

    const result = await response.json();
    console.log("Memory API updated successfully with date:", result);
  } catch (error) {
    console.error("Error updating memory API with date:", error);
    // Don't throw - continue even if memory API fails
    console.warn("Memory API update failed, but continuing...");
  }
}

/**
 * Retrieves the selected trip from Firestore
 */
export async function getSelectedTripFromFirestore(
  userId: string
): Promise<TripData | null> {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDocSnapshot = await getDoc(userDocRef);

    if (userDocSnapshot.exists()) {
      const data = userDocSnapshot.data();
      if (data.selected_trip) {
        console.log("Retrieved trip from Firestore:", data.selected_trip);
        return data.selected_trip;
      }
    }

    console.log("No selected trip found in Firestore for user:", userId);
    return null;
  } catch (error) {
    console.error("Error retrieving trip from Firestore:", error);
    return null;
  }
}
