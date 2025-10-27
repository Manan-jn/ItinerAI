/**
 * Memory API Utility
 * Handles sending user profile updates to the memory service
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";

interface UserProfileData {
  dateOfBirth: string;
  gender: string;
  passportNationality: string;
  allergies: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  foodPreferences: string;
  displayName?: string | null;
  email?: string | null;
}

interface MemoryUpdatePayload {
  user_id: string;
  session_id: string;
  updates: {
    user_id: string;
    user_profile: {
      name: string;
      date_of_birth: string;
      gender: string;
      passport_nationality: string;
      allergies?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
      food_preferences?: string;
    };
  };
}

// Removed calculateAge function - we'll send date_of_birth directly

/**
 * Transforms onboarding data to memory API format
 */
function transformToMemoryFormat(
  userData: UserProfileData,
  userId: string,
  sessionId: string
): MemoryUpdatePayload {
  // Get user name from displayName or email, or use default
  const name = userData.displayName || 
               (userData.email ? userData.email.split('@')[0] : 'User');
  
  // Build user profile with only frontend-collected fields
  const userProfile: any = {
    name: name,
    date_of_birth: userData.dateOfBirth,
    gender: userData.gender.toLowerCase(),
    passport_nationality: userData.passportNationality,
  };
  
  // Add optional fields only if provided by user
  if (userData.allergies && userData.allergies.trim()) {
    userProfile.allergies = userData.allergies;
  }
  if (userData.emergencyContactName && userData.emergencyContactName.trim()) {
    userProfile.emergency_contact_name = userData.emergencyContactName;
  }
  if (userData.emergencyContactPhone && userData.emergencyContactPhone.trim()) {
    userProfile.emergency_contact_phone = userData.emergencyContactPhone;
  }
  if (userData.foodPreferences && userData.foodPreferences.trim()) {
    userProfile.food_preferences = userData.foodPreferences;
  }
  
  return {
    user_id: userId,
    session_id: sessionId,
    updates: {
      user_id: userId,
      user_profile: userProfile
    }
  };
}

/**
 * Fetches user data from Firestore
 */
export async function fetchUserDataFromFirestore(userId: string): Promise<UserProfileData | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        dateOfBirth: data.dateOfBirth || "",
        gender: data.gender || "",
        passportNationality: data.passportNationality || "",
        allergies: data.allergies || "",
        emergencyContactName: data.emergencyContactName || "",
        emergencyContactPhone: data.emergencyContactPhone || "",
        foodPreferences: data.foodPreferences || "",
        displayName: data.displayName || null,
        email: data.email || null,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user data from Firestore:', error);
    return null;
  }
}

/**
 * Updates memory with existing user data when session changes
 */
export async function updateMemoryOnSessionChange(
  userId: string,
  sessionId: string,
  displayName?: string | null,
  email?: string | null
): Promise<void> {
  try {
    console.log('Updating memory for session change:', { userId, sessionId });
    
    // Fetch user data from Firestore
    const userData = await fetchUserDataFromFirestore(userId);
    
    if (!userData) {
      console.warn('No user data found in Firestore for memory update');
      return;
    }
    
    // Add current user info if provided
    const memoryUserData = {
      ...userData,
      displayName: displayName || userData.displayName,
      email: email || userData.email,
    };
    
    // Update memory with existing data
    await updateUserMemory(memoryUserData, userId, sessionId);
    
    console.log('Memory updated successfully for session change');
    
  } catch (error) {
    console.error('Error updating memory on session change:', error);
    // Don't throw - this is a background operation
  }
}

/**
 * Sends user profile data to the memory API
 */
export async function updateUserMemory(
  userData: UserProfileData,
  userId: string,
  sessionId: string
): Promise<void> {
  try {
    const payload = transformToMemoryFormat(userData, userId, sessionId);
    
    console.log('Sending user profile to memory API:', payload);
    
    const response = await fetch('/api/memory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Memory API error response:', errorText);
      throw new Error(`Memory API error! status: ${response.status}, message: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Memory API success:', result);
    
  } catch (error) {
    console.error('Error updating user memory:', error);
    // Don't throw the error - we don't want to break the onboarding flow
    // if the memory API is temporarily unavailable
    console.warn('Memory API update failed, but continuing with onboarding...');
  }
}
