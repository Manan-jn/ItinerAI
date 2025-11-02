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
 * Get cities filtered by a search term
 */
export async function searchCities(searchTerm: string, country?: string): Promise<Array<{city: string, code: string, state: string}>> {
  const allCities = await getAllCities(country);
  const normalized = searchTerm.trim().toLowerCase();

  if (!normalized) return allCities;

  return allCities.filter(c =>
    c.city.toLowerCase().includes(normalized) ||
    c.code.toLowerCase().includes(normalized) ||
    c.state.toLowerCase().includes(normalized)
  );
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
 * Synchronous version of normalizeCityName using only popular cities
 * Use this for performance when you don't need the full places.json lookup
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
