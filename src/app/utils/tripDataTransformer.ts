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

  return trips.map((trip, tripIdx) => {

    // Create a map of cities from trip_route
    const cityMap = new Map();
    if (trip.trip_route && Array.isArray(trip.trip_route)) {
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
      });
    } else {
    }

    // Transform day_wise_plan to include cities
    const transformedDayPlan =
      trip.day_wise_plan?.map((day: any) => {
        const cities: any[] = [];
        let cityName = null;


        // Extract city name with priority: stay_details > conveyance to_city
        if (
          day.stay_details?.is_required &&
          day.stay_details?.city &&
          day.stay_details.city !== "user_location"
        ) {
          cityName = day.stay_details.city;
        } else if (
          day.conveyance_details?.is_required &&
          day.conveyance_details?.to_city &&
          day.conveyance_details.to_city !== "user_location"
        ) {
          cityName = day.conveyance_details.to_city;
        } else if (
          day.conveyance_details?.is_required &&
          day.conveyance_details?.from_city &&
          day.conveyance_details?.to_city &&
          day.conveyance_details.from_city ===
            day.conveyance_details.to_city &&
          day.conveyance_details.to_city !== "user_location"
        ) {
          cityName = day.conveyance_details.to_city;
        } else if (
          day.conveyance_details?.is_required &&
          day.conveyance_details?.from_city &&
          day.conveyance_details.from_city !== "user_location"
        ) {
          cityName = day.conveyance_details.from_city;
        }

        if (cityName) {
          const cityInfo = cityMap.get(cityName);

          if (cityInfo) {
            cities.push(cityInfo);
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
          }
        } else {
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


    return transformed;
  });
}

