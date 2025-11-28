// Utility for loading and matching cities from places.json

interface PlaceData {
  name: string;
  country: string;
  state: string;
  city: string;
  code: string;
}

let placesCache: PlaceData[] | null = null;

/**
 * Load places data from places.json
 * Uses caching to avoid multiple file loads
 */
export async function loadPlacesData(): Promise<PlaceData[]> {
  if (placesCache) {
    return placesCache;
  }

  try {
    const response = await fetch('/places.json');
    if (!response.ok) {
      console.error('Failed to load places.json:', response.status);
      return [];
    }
    const data: PlaceData[] = await response.json();
    placesCache = data;
    return data;
  } catch (error) {
    console.error('Error loading places.json:', error);
    return [];
  }
}

/**
 * Find a place by city name (case-insensitive, partial match)
 * Returns the first match found
 */
export async function findPlaceByCity(cityName: string): Promise<PlaceData | null> {
  const places = await loadPlacesData();
  const normalized = cityName.trim().toLowerCase();

  // Try exact match first
  const exactMatch = places.find(p => p.city.toLowerCase() === normalized);
  if (exactMatch) return exactMatch;

  // Try partial match
  const partialMatch = places.find(p =>
    p.city.toLowerCase().includes(normalized) ||
    normalized.includes(p.city.toLowerCase())
  );

  return partialMatch || null;
}

/**
 * Get all unique cities from places.json, sorted alphabetically
 * Optional: filter by country
 * WARNING: This returns 40K+ cities, use searchCities() for better performance
 */
export async function getAllCities(country?: string): Promise<Array<{city: string, code: string, state: string}>> {
  const places = await loadPlacesData();

  // Filter by country if specified
  const filtered = country
    ? places.filter(p => p.country.toLowerCase() === country.toLowerCase())
    : places;

  // Get unique cities
  const cityMap = new Map<string, {city: string, code: string, state: string}>();

  filtered.forEach(place => {
    if (!cityMap.has(place.city)) {
      cityMap.set(place.city, {
        city: place.city,
        code: place.code,
        state: place.state
      });
    }
  });

  // Convert to array and sort
  return Array.from(cityMap.values()).sort((a, b) => a.city.localeCompare(b.city));
}

/**
 * Get unique cities from places.json synchronously (for immediate use)
 * Returns all unique cities by parsing places.json in memory
 * Note: This is expensive, use sparingly or cache the result
 */
let allCitiesCache: Array<{city: string, code: string, state: string}> | null = null;

export async function getAllCitiesOnce(): Promise<Array<{city: string, code: string, state: string}>> {
  if (allCitiesCache) {
    return allCitiesCache;
  }

  const cities = await getAllCities();
  allCitiesCache = cities;
  return cities;
}

/**
 * Get cities filtered by a search term (with limit for performance)
 * Returns popular cities + matching cities from full dataset
 * @param searchTerm - The search string
 * @param limit - Maximum results to return (default: 50)
 * @param country - Optional country filter
 */
export async function searchCities(
  searchTerm: string,
  limit: number = 50,
  country?: string
): Promise<Array<{city: string, code: string, state: string}>> {
  const normalized = searchTerm.trim().toLowerCase();

  // If no search term, return popular cities
  if (!normalized) {
    return getPopularIndianCities();
  }

  // First, check popular cities for quick matches
  const popularCities = getPopularIndianCities();
  const popularMatches = popularCities.filter(c =>
    c.city.toLowerCase().includes(normalized) ||
    c.code.toLowerCase().includes(normalized) ||
    c.state.toLowerCase().includes(normalized)
  );

  // If we found enough in popular cities, return them
  if (popularMatches.length >= limit) {
    return popularMatches.slice(0, limit);
  }

  // Otherwise, search the full dataset
  const places = await loadPlacesData();
  const filtered = country
    ? places.filter(p => p.country.toLowerCase() === country.toLowerCase())
    : places;

  const cityMap = new Map<string, {city: string, code: string, state: string}>();

  // Add popular matches first
  popularMatches.forEach(c => cityMap.set(c.city, c));

  // Search through all places
  for (const place of filtered) {
    if (cityMap.size >= limit) break;

    const matches =
      place.city.toLowerCase().includes(normalized) ||
      place.code.toLowerCase().includes(normalized) ||
      place.state?.toLowerCase().includes(normalized);

    if (matches && !cityMap.has(place.city)) {
      cityMap.set(place.city, {
        city: place.city,
        code: place.code,
        state: place.state
      });
    }
  }

  return Array.from(cityMap.values()).sort((a, b) => a.city.localeCompare(b.city));
}

/**
 * Validate if a city name exists in places.json
 */
export async function isCityValid(cityName: string): Promise<boolean> {
  const place = await findPlaceByCity(cityName);
  return place !== null;
}

/**
 * Normalize city name to match the format in places.json
 * First tries to find exact match in places.json, then falls back to popular cities
 * @param cityName - The city name to normalize (can be any case, e.g., "new delhi", "NEW DELHI", "mumbai")
 * @returns The properly formatted city name from places.json or popular cities list
 */
export async function normalizeCityName(cityName: string): Promise<string> {
  if (!cityName || cityName.trim() === '') {
    return cityName;
  }

  // Handle special placeholder values
  if (cityName.toLowerCase() === 'user_location' || cityName.toLowerCase() === 'user location') {
    return cityName; // Return as-is, caller will replace with actual location
  }

  // First, try to find in places.json
  const place = await findPlaceByCity(cityName);
  if (place) {
    return place.city; // Return the exact spelling from places.json
  }

  // If not found in places.json, check popular cities
  const popularCities = getPopularIndianCities();
  const matchedCity = popularCities.find(
    c => c.city.toLowerCase() === cityName.toLowerCase()
  );

  if (matchedCity) {
    return matchedCity.city; // Return exact spelling from popular cities
  }

  // If still not found, return with proper capitalization
  return cityName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * In-memory index for fast city lookups (built once, reused forever)
 * Maps normalized city name (lowercase) to exact city name from places.json
 */
let cityLookupMap: Map<string, string> | null = null;

/**
 * Build city lookup map for O(1) lookups
 * This is called once and cached in memory
 */
async function buildCityLookupMap(): Promise<Map<string, string>> {
  if (cityLookupMap) {
    return cityLookupMap;
  }

  const places = await loadPlacesData();
  const map = new Map<string, string>();

  // Build map: lowercase city name -> exact city name
  places.forEach(place => {
    const normalizedKey = place.city.toLowerCase().trim();
    // Only store first occurrence to avoid duplicates
    if (!map.has(normalizedKey)) {
      map.set(normalizedKey, place.city);
    }
  });

  cityLookupMap = map;
  return map;
}

/**
 * Fast synchronous city lookup with fallback
 * Returns: { normalized: string, found: boolean }
 * - If found in places.json cache: returns exact spelling + found=true
 * - If not found: returns capitalized version + found=false
 */
export function normalizeCityNameSyncWithFallback(cityName: string): { normalized: string; found: boolean } {
  if (!cityName || cityName.trim() === '') {
    return { normalized: cityName, found: false };
  }

  // Handle special placeholder values
  if (cityName.toLowerCase() === 'user_location' || cityName.toLowerCase() === 'user location') {
    return { normalized: cityName, found: true };
  }

  // If cityLookupMap is already built (cached), use it for instant O(1) lookup
  if (cityLookupMap) {
    const normalizedKey = cityName.toLowerCase().trim();
    const exactCity = cityLookupMap.get(normalizedKey);

    if (exactCity) {
      return { normalized: exactCity, found: true };
    }
  } else {
    // Fallback to popular cities if map not yet loaded
    const popularCities = getPopularIndianCities();
    const matchedCity = popularCities.find(
      c => c.city.toLowerCase() === cityName.toLowerCase()
    );

    if (matchedCity) {
      return { normalized: matchedCity.city, found: true };
    }
  }

  // Not found - return with proper capitalization
  const capitalized = cityName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return { normalized: capitalized, found: false };
}

/**
 * Synchronous version of normalizeCityName using only popular cities
 * Use this for performance when you don't need the full places.json lookup
 * @deprecated Use normalizeCityNameSyncWithFallback for better accuracy
 */
export function normalizeCityNameSync(cityName: string): string {
  if (!cityName || cityName.trim() === '') {
    return cityName;
  }

  // Handle special placeholder values
  if (cityName.toLowerCase() === 'user_location' || cityName.toLowerCase() === 'user location') {
    return cityName;
  }

  // Check popular cities
  const popularCities = getPopularIndianCities();
  const matchedCity = popularCities.find(
    c => c.city.toLowerCase() === cityName.toLowerCase()
  );

  if (matchedCity) {
    return matchedCity.city;
  }

  // Return with proper capitalization
  return cityName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Preload and build city lookup map for instant synchronous access
 * Call this early in app lifecycle (e.g., on page load)
 */
export async function preloadCityData(): Promise<void> {
  try {
    await buildCityLookupMap();
  } catch (error) {
    console.error('❌ Failed to preload city data:', error);
  }
}

/**
 * Get popular Indian cities for initial dropdown (fallback if places.json fails to load)
 */
export function getPopularIndianCities(): Array<{city: string, code: string, state: string}> {
  return [
    { city: "Mumbai", code: "BOM", state: "Maharashtra" },
    { city: "Delhi", code: "DEL", state: "Delhi" },
    { city: "Bangalore", code: "BLR", state: "Karnataka" },
    { city: "Kolkata", code: "CCU", state: "West Bengal" },
    { city: "Chennai", code: "MAA", state: "Tamil Nadu" },
    { city: "Hyderabad", code: "HYD", state: "Telangana" },
    { city: "Pune", code: "PNQ", state: "Maharashtra" },
    { city: "Ahmedabad", code: "AMD", state: "Gujarat" },
    { city: "Jaipur", code: "JAI", state: "Rajasthan" },
    { city: "Lucknow", code: "LKO", state: "Uttar Pradesh" },
    { city: "Leh", code: "IXL", state: "Ladakh" },
    { city: "Agra", code: "AGR", state: "Uttar Pradesh" },
    { city: "Goa", code: "GOI", state: "Goa" },
    { city: "Varanasi", code: "VNS", state: "Uttar Pradesh" },
    { city: "Amritsar", code: "ATQ", state: "Punjab" },
  ].sort((a, b) => a.city.localeCompare(b.city));
}
