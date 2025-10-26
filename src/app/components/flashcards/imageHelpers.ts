import { imageDownloader } from "../../utils/imageDownloader";

// Helper function to validate if a URL is a valid image URL
export const isValidImageUrl = (url: string): boolean => {
  if (!url || url.trim() === "") return false;

  // Check if it's a proper HTTP/HTTPS URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

// Helper function to check if URL is a Google Places photo URL
export const isGooglePlacesPhotoUrl = (url: string): boolean => {
  if (!url || url.trim() === "") return false;
  return url.includes('maps.googleapis.com/maps/api/place/photo');
};

// Helper function to extract photo reference from Google Places photo URL
export const extractPhotoReference = (url: string): string | null => {
  if (!isGooglePlacesPhotoUrl(url)) return null;
  
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('photoreference');
  } catch {
    return null;
  }
};

// Helper function to convert Google Places photo URL to proxy URL
export const convertToProxyUrl = (url: string, maxwidth: number = 400): string => {
  const photoReference = extractPhotoReference(url);
  if (!photoReference) return url; // Return original if not a Google Places URL
  
  return `/api/place-photo?photoreference=${photoReference}&maxwidth=${maxwidth}`;
};

// Function to get fallback image based on theme
export const getThemeFallbackImage = (trip: any): string => {
  const themes = trip.theme || [];
  const tripTitle = trip.trip_title?.toLowerCase() || "";

  if (
    themes.includes("Snow") ||
    themes.includes("Mountains") ||
    tripTitle.includes("himachal") ||
    tripTitle.includes("manali")
  ) {
    return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&auto=format&q=80";
  }
  if (
    themes.includes("Heritage") ||
    themes.includes("Palaces") ||
    themes.includes("Forts") ||
    tripTitle.includes("rajasthan") ||
    tripTitle.includes("jaipur") ||
    tripTitle.includes("udaipur")
  ) {
    return "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&h=800&fit=crop&auto=format&q=80";
  }
  if (
    themes.includes("Beaches") ||
    themes.includes("Islands") ||
    tripTitle.includes("thailand") ||
    tripTitle.includes("krabi") ||
    tripTitle.includes("bangkok")
  ) {
    return "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&h=800&fit=crop&auto=format&q=80";
  }
  if (
    themes.includes("Backwaters") ||
    themes.includes("Nature") ||
    tripTitle.includes("kerala") ||
    tripTitle.includes("munnar")
  ) {
    return "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&h=800&fit=crop&auto=format&q=80";
  }

  // Default travel image
  return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=800&fit=crop&auto=format&q=80";
};

// Function to get trip image from photos in day_wise_plan or trip_route
export const getTripImage = (trip: any, cachedUrls?: Map<string, string>): string => {
  // Helper function to process a photo URL
  const processPhotoUrl = (photo: string): string | null => {
    if (!isValidImageUrl(photo)) return null;

    // Check imageDownloader cache first (it handles Google Places URLs automatically)
    const downloadedImage = imageDownloader.getCachedImage(photo);
    if (downloadedImage) {
      return downloadedImage;
    }
    
    // Return cached version from old cache if available
    if (cachedUrls && cachedUrls.has(photo)) {
      return cachedUrls.get(photo)!;
    }
    
    // For Google Places photos, convert to proxy URL
    if (isGooglePlacesPhotoUrl(photo)) {
      return convertToProxyUrl(photo, 400);
    }
    
    return photo;
  };

  try {
    // First, try to get photo from trip_route (new structure)
    if (trip.trip_route && trip.trip_route.length > 0) {
      for (const place of trip.trip_route) {
        if (place.photos && place.photos.length > 0) {
          for (const photo of place.photos) {
            const processedUrl = processPhotoUrl(photo);
            if (processedUrl) {
              return processedUrl;
            }
          }
        }
      }
    }

    // Then try day_wise_plan structure (legacy support)
    if (trip.day_wise_plan && trip.day_wise_plan.length > 0) {
      for (const day of trip.day_wise_plan) {
        if (day.cities && day.cities.length > 0) {
          for (const city of day.cities) {
            if (city.photos && city.photos.length > 0) {
              for (const photo of city.photos) {
                const processedUrl = processPhotoUrl(photo);
                if (processedUrl) {
                  return processedUrl;
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn("Error fetching trip image:", error);
  }

  // Fallback to theme-based Unsplash images
  return getThemeFallbackImage(trip);
};

// Function to get city-specific fallback image
export const getCityFallbackImage = (city: any): string => {
  const name = city.name?.toLowerCase() || "";

  if (name.includes("manali") || name.includes("solang")) {
    return "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&h=300&fit=crop&auto=format&q=80";
  }
  if (
    name.includes("kasol") ||
    name.includes("parvati") ||
    name.includes("tosh")
  ) {
    return "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=400&h=300&fit=crop&auto=format&q=80";
  }
  if (name.includes("udaipur")) {
    return "https://images.unsplash.com/photo-1599661046827-dacff0c3f6e2?w=400&h=300&fit=crop&auto=format&q=80";
  }
  if (name.includes("jaipur")) {
    return "https://images.unsplash.com/photo-1524230659092-07f99a75c013?w=400&h=300&fit=crop&auto=format&q=80";
  }
  if (name.includes("bangkok")) {
    return "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=300&fit=crop&auto=format&q=80";
  }
  if (name.includes("krabi") || name.includes("railay")) {
    return "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop&auto=format&q=80";
  }
  if (name.includes("kochi") || name.includes("cochin")) {
    return "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=300&fit=crop&auto=format&q=80";
  }
  if (name.includes("munnar")) {
    return "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=400&h=300&fit=crop&auto=format&q=80";
  }
  if (name.includes("alleppey") || name.includes("alappuzha")) {
    return "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=400&h=300&fit=crop&auto=format&q=80";
  }
  if (name.includes("naggar") || name.includes("manikaran")) {
    return "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&h=300&fit=crop&auto=format&q=80";
  }

  // Default city image
  return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&auto=format&q=80";
};

// Function to get city image from photos or fallback
export const getCityImage = (city: any, cachedUrls?: Map<string, string>): string => {
  // Helper function to process a photo URL
  const processPhotoUrl = (photo: string): string | null => {
    if (!isValidImageUrl(photo)) return null;

    // Check imageDownloader cache first (it handles Google Places URLs automatically)
    const downloadedImage = imageDownloader.getCachedImage(photo);
    if (downloadedImage) {
      return downloadedImage;
    }
    
    // Return cached version from old cache if available
    if (cachedUrls && cachedUrls.has(photo)) {
      return cachedUrls.get(photo)!;
    }
    
    // For Google Places photos, convert to proxy URL
    if (isGooglePlacesPhotoUrl(photo)) {
      return convertToProxyUrl(photo, 400);
    }
    
    return photo;
  };

  // Try to get photo from city.photos array
  try {
    if (city.photos && city.photos.length > 0) {
      // Find the first valid image URL
      for (const photo of city.photos) {
        const processedUrl = processPhotoUrl(photo);
        if (processedUrl) {
          return processedUrl;
        }
      }
    }
  } catch (error) {
    console.warn("Error fetching city photo:", error);
  }

  // Fallback to city-specific Unsplash images based on city name
  return getCityFallbackImage(city);
};

