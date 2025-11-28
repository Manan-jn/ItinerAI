/**
 * Test Pre-Fetch Trigger Utility
 * Allows testing the parallelized pre-fetch conveyance system
 * Uses final_response.json as the test trip data
 */

import { preFetchConveyanceData } from "./preFetchConveyance";

// Test trip data structure (matches final_response.json)
const TEST_TRIP_DATA = {
  trip_title: "Himalayan Spiritual and Adventure Quest",
  no_of_days: 8,
  estimated_budget: 120000,
  best_time_to_visit: "September to June",
  themes: ["Spiritual", "Adventure", "Nature"],
  trip_route: [
    {
      place_name: "Delhi",
      address: "Delhi, India",
    },
    {
      place_name: "Rishikesh",
      address: "Rishikesh, Uttarakhand, India",
    },
  ],
  day_wise_plan: [
    {
      day_number: 1,
      conveyance_details: {
        is_required: true,
        travel_timing: "evening",
        from_city: "user_location",
        to_city: "Delhi",
      },
      stay_details: {
        is_required: true,
        city: "Delhi",
        check_in_day: "1",
        check_out_day: "2",
      },
      must_do_activities: [],
    },
    {
      day_number: 2,
      conveyance_details: {
        is_required: true,
        travel_timing: "morning",
        from_city: "Delhi",
        to_city: "Rishikesh",
      },
      stay_details: {
        is_required: true,
        city: "Rishikesh",
        check_in_day: "2",
        check_out_day: "8",
      },
      must_do_activities: [],
    },
    {
      day_number: 3,
      conveyance_details: {
        is_required: false,
      },
      stay_details: {
        is_required: false,
      },
      must_do_activities: [],
    },
    {
      day_number: 4,
      conveyance_details: {
        is_required: false,
      },
      stay_details: {
        is_required: false,
      },
      must_do_activities: [],
    },
    {
      day_number: 5,
      conveyance_details: {
        is_required: false,
      },
      stay_details: {
        is_required: false,
      },
      must_do_activities: [],
    },
    {
      day_number: 6,
      conveyance_details: {
        is_required: false,
      },
      stay_details: {
        is_required: false,
      },
      must_do_activities: [],
    },
    {
      day_number: 7,
      conveyance_details: {
        is_required: false,
      },
      stay_details: {
        is_required: false,
      },
      must_do_activities: [],
    },
    {
      day_number: 8,
      conveyance_details: {
        is_required: true,
        travel_timing: "morning",
        from_city: "Rishikesh",
        to_city: "Delhi",
      },
      stay_details: {
        is_required: false,
      },
      must_do_activities: [],
    },
  ],
};

/**
 * Test the pre-fetch conveyance system
 * @param userId - User ID for testing
 * @param sessionId - Session ID for testing
 */
export async function testPreFetchConveyance(
  userId: string,
  sessionId: string
): Promise<void> {

  const testDate = "2025-12-12"; // Fixed test date: December 12, 2025


  // Extract days requiring conveyance
  const dayDetails = TEST_TRIP_DATA.day_wise_plan
    .filter((day: any) => day.conveyance_details)
    .map((day: any) => ({
      day_number: day.day_number,
      from_city: day.conveyance_details.from_city || "",
      to_city: day.conveyance_details.to_city || "",
      is_required: day.conveyance_details.is_required === true,
    }));

  const requiredDays = dayDetails.filter((d: any) => d.is_required);

  requiredDays.forEach((day: any) => {
  });


  try {
    const startTime = performance.now();

    // Call the pre-fetch function
    await preFetchConveyanceData({
      userId,
      sessionId,
      tripDate: testDate,
      dayDetails,
    });

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;

    requiredDays.forEach((day: any) => {
      const date = new Date("2025-12-12");
      date.setDate(date.getDate() + (day.day_number - 1));
      const dateStr = date.toISOString().split("T")[0];
    });
  } catch (error) {
    console.error("❌ PRE-FETCH TEST FAILED");
    console.error("Error:", error);
    throw error;
  }
}

/**
 * Get test configuration for debugging
 */
export function getTestConfiguration() {
  return {
    trip: TEST_TRIP_DATA,
    testDate: "2025-12-12",
    daysRequiringConveyance: TEST_TRIP_DATA.day_wise_plan
      .filter((day: any) => day.conveyance_details?.is_required)
      .map((day: any) => ({
        day: day.day_number,
        from: day.conveyance_details.from_city,
        to: day.conveyance_details.to_city,
      })),
  };
}
