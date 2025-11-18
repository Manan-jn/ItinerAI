/**
 * Utility for transforming trip data structure
 * Extracts city information from trip routes and day-wise plans
 * and normalizes the structure for consistent usage across components
 */

/**
 * Transforms raw trip data into a structured format suitable for the flashcards widget
 * 
 * Features:
 * - Creates a map of cities from trip_route
 * - Extracts city information from day_wise_plan (stay_details, conveyance_details)
 * - Falls back to trip_route cities if no city found in day plan
 * - Normalizes theme/themes field
 * - Preserves original conveyance and stay details
 * 
 * @param trips - Array of raw trip data from the backend
 * @returns Transformed trip data with normalized structure
 */
export function transformTripData(trips: any[]): any[] {
  console.log("=== TRANSFORMING TRIPS DATA ===");
  console.log("Number of trips to transform:", trips.length);

  return trips.map((trip, tripIdx) => {
    // console.log(
    //   `\n--- Processing trip ${tripIdx + 1}: ${trip.trip_title} ---`
    // );
    // console.log("Raw trip data:", JSON.stringify(trip, null, 2));

    // Create a map of cities from trip_route
    const cityMap = new Map();
    if (trip.trip_route && Array.isArray(trip.trip_route)) {
      // console.log(`Trip route has ${trip.trip_route.length} cities`);
      trip.trip_route.forEach((city: any) => {
        const cityData = {
          name: city.place_name || city.name,
          address: city.address || city.place_name || city.name,
          map_url: city.map_url || "",
          lat: city.lat || "0",
          long: city.long || "0",
          photos: city.photos || [],
          place_id: city.place_id || "",
        };
        cityMap.set(city.place_name || city.name, cityData);
        // console.log(
        //   `  - Mapped city: ${city.place_name || city.name}`,
        //   cityData
        // );
      });
    } else {
      console.log(
        "No trip_route found in trip data - will create from day_wise_plan"
      );
    }

    // Transform day_wise_plan to include cities
    const transformedDayPlan =
      trip.day_wise_plan?.map((day: any) => {
        const cities: any[] = [];
        let cityName = null;

        // console.log(`  Day ${day.day_number}:`);
        // console.log(`    - stay_details:`, day.stay_details);
        // console.log(`    - conveyance_details:`, day.conveyance_details);

        // Extract city name with priority: stay_details > conveyance to_city
        if (
          day.stay_details?.is_required &&
          day.stay_details?.city &&
          day.stay_details.city !== "user_location"
        ) {
          cityName = day.stay_details.city;
          // console.log(`    - City from stay_details: ${cityName}`);
        } else if (
          day.conveyance_details?.is_required &&
          day.conveyance_details?.to_city &&
          day.conveyance_details.to_city !== "user_location"
        ) {
          cityName = day.conveyance_details.to_city;
          // console.log(`    - City from conveyance to_city: ${cityName}`);
        } else if (
          day.conveyance_details?.is_required &&
          day.conveyance_details?.from_city &&
          day.conveyance_details?.to_city &&
          day.conveyance_details.from_city ===
            day.conveyance_details.to_city &&
          day.conveyance_details.to_city !== "user_location"
        ) {
          cityName = day.conveyance_details.to_city;
          // console.log(`    - City from same from/to city: ${cityName}`);
        } else if (
          day.conveyance_details?.is_required &&
          day.conveyance_details?.from_city &&
          day.conveyance_details.from_city !== "user_location"
        ) {
          cityName = day.conveyance_details.from_city;
          // console.log(`    - City from conveyance from_city: ${cityName}`);
        }

        if (cityName) {
          const cityInfo = cityMap.get(cityName);

          if (cityInfo) {
            cities.push(cityInfo);
            // console.log(`    - Added city info from map: ${cityName}`);
          } else {
            // Create a basic city info if not found in trip_route
            const basicCityInfo = {
              name: cityName,
              address: cityName,
              map_url: "",
              lat: "0",
              long: "0",
              photos: [],
              place_id: "",
            };
            cities.push(basicCityInfo);
            // console.log(`    - Created basic city info for: ${cityName}`);
          }
        } else {
          // console.log(
          //   `    - No city found for day ${day.day_number} - checking activities`
          // );
        }

        // If no city found yet, try to infer from must_do_activities or trip_route
        if (
          cities.length === 0 &&
          day.must_do_activities &&
          day.must_do_activities.length > 0
        ) {
          // Use trip_route cities if available
          if (trip.trip_route && trip.trip_route.length > 0) {
            const firstCity = trip.trip_route[0];
            const fallbackCity = {
              name: firstCity.place_name || firstCity.name,
              address:
                firstCity.address || firstCity.place_name || firstCity.name,
              map_url: firstCity.map_url || "",
              lat: firstCity.lat || "0",
              long: firstCity.long || "0",
              photos: firstCity.photos || [],
              place_id: firstCity.place_id || "",
            };
            cities.push(fallbackCity);
            console.log(
              `    - Fallback: Using first city from trip_route: ${fallbackCity.name}`
            );
          }
        }

        return {
          day_number: day.day_number,
          cities: cities,
          must_do_activities: day.must_do_activities || [],
          conveyance_details: day.conveyance_details, // Include original conveyance details
          stay_details: day.stay_details, // Include original stay details
        };
      }) || [];

    console.log(
      `Transformed ${transformedDayPlan.length} days for trip ${tripIdx + 1}`
    );

    // Return transformed trip with theme instead of themes AND trip_route
    const transformed = {
      trip_title: trip.trip_title,
      no_of_days: trip.no_of_days,
      estimated_budget: trip.estimated_budget,
      best_time_to_visit: trip.best_time_to_visit,
      theme: trip.themes || trip.theme || [], // Handle both 'themes' and 'theme'
      themes: trip.themes || trip.theme || [], // Include both for compatibility
      trip_route: trip.trip_route || [], // CRITICAL: Include trip_route for photos and map
      day_wise_plan: transformedDayPlan,
    };

    console.log(`Final transformed trip ${tripIdx + 1}:`);
    console.log("  - trip_title:", transformed.trip_title);
    console.log("  - no_of_days:", transformed.no_of_days);
    console.log("  - estimated_budget:", transformed.estimated_budget);
    console.log("  - best_time_to_visit:", transformed.best_time_to_visit);
    console.log("  - theme:", transformed.theme);
    console.log("  - themes:", transformed.themes);
    console.log(
      "  - trip_route length:",
      transformed.trip_route?.length || 0
    );
    console.log(
      "  - day_wise_plan length:",
      transformed.day_wise_plan.length
    );

    return transformed;
  });
}

