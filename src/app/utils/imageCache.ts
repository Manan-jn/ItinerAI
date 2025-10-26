/**
 * Image Cache Utility
 * Downloads and caches images from URLs to IndexedDB for offline/persistent access
 */

const DB_NAME = "ImageCacheDB";
const STORE_NAME = "images";
const DB_VERSION = 1;

interface CachedImage {
  url: string;
  data: string; // base64 data
  timestamp: number;
}

/**
 * Initialize IndexedDB
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "url" });
      }
    };
  });
};

/**
 * Download image and convert to base64
 */
const downloadImageAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Error downloading image ${url}:`, error);
    throw error;
  }
};

/**
 * Save image to IndexedDB
 */
const saveImageToDB = async (
  url: string,
  data: string
): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const cachedImage: CachedImage = {
      url,
      data,
      timestamp: Date.now(),
    };

    const request = store.put(cachedImage);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get image from IndexedDB
 */
const getImageFromDB = async (url: string): Promise<string | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onsuccess = () => {
        const result = request.result as CachedImage | undefined;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error getting image from DB:`, error);
    return null;
  }
};

/**
 * Check if image exists in cache
 */
export const isImageCached = async (url: string): Promise<boolean> => {
  try {
    const data = await getImageFromDB(url);
    return data !== null;
  } catch {
    return false;
  }
};

/**
 * Get cached image or download if not cached
 */
export const getCachedImage = async (url: string): Promise<string> => {
  try {
    // Try to get from cache first
    const cached = await getImageFromDB(url);
    if (cached) {
      return cached;
    }

    // If not cached, download and cache it
    const data = await downloadImageAsBase64(url);
    await saveImageToDB(url, data);
    return data;
  } catch (error) {
    console.error(`Error getting cached image:`, error);
    // Return the original URL as fallback
    return url;
  }
};

/**
 * Preload and cache multiple images
 * Returns progress information
 */
export const preloadImages = async (
  urls: string[],
  onProgress?: (current: number, total: number) => void
): Promise<{ successful: number; failed: number; errors: string[] }> => {
  const total = urls.length;
  let successful = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      // Check if already cached
      const cached = await getImageFromDB(url);
      if (!cached) {
        // Download and cache
        const data = await downloadImageAsBase64(url);
        await saveImageToDB(url, data);
      }
      successful++;
    } catch (error) {
      failed++;
      errors.push(`${url}: ${error}`);
      console.error(`Failed to preload image ${url}:`, error);
    }

    // Report progress
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return { successful, failed, errors };
};

/**
 * Helper function to check if URL is a Google Places photo URL
 */
const isGooglePlacesPhotoUrl = (url: string): boolean => {
  if (!url || url.trim() === "") return false;
  return url.includes('maps.googleapis.com/maps/api/place/photo');
};

/**
 * Helper function to convert Google Places photo URL to proxy URL
 */
const convertToProxyUrl = (url: string, maxwidth: number = 400): string => {
  if (!isGooglePlacesPhotoUrl(url)) return url;
  
  try {
    const urlObj = new URL(url);
    const photoReference = urlObj.searchParams.get('photoreference');
    if (!photoReference) return url;
    
    return `/api/place-photo?photoreference=${photoReference}&maxwidth=${maxwidth}`;
  } catch {
    return url;
  }
};

/**
 * Extract all image URLs from places JSON data
 */
export const extractImageUrlsFromPlacesData = (placesData: any): string[] => {
  const urls = new Set<string>();

  try {
    const trips = placesData?.trip_suggestions?.trips || [];
    
    trips.forEach((trip: any) => {
      // Extract from trip_route (new structure)
      if (trip.trip_route && Array.isArray(trip.trip_route)) {
        trip.trip_route.forEach((place: any) => {
          if (place.photos && Array.isArray(place.photos)) {
            place.photos.forEach((photo: string) => {
              if (photo && photo.trim() !== "") {
                try {
                  const urlObj = new URL(photo);
                  if (urlObj.protocol === "http:" || urlObj.protocol === "https:") {
                    // Convert Google Places URLs to proxy URLs for caching
                    const processedUrl = isGooglePlacesPhotoUrl(photo) 
                      ? convertToProxyUrl(photo, 400) 
                      : photo;
                    urls.add(processedUrl);
                  }
                } catch {
                  // Invalid URL, skip
                }
              }
            });
          }
        });
      }

      // Extract from day_wise_plan (legacy structure)
      const dayWisePlan = trip?.day_wise_plan || [];
      dayWisePlan.forEach((day: any) => {
        const cities = day?.cities || [];
        
        cities.forEach((city: any) => {
          const photos = city?.photos || [];
          
          photos.forEach((photo: string) => {
            if (photo && photo.trim() !== "") {
              try {
                const urlObj = new URL(photo);
                if (urlObj.protocol === "http:" || urlObj.protocol === "https:") {
                  // Convert Google Places URLs to proxy URLs for caching
                  const processedUrl = isGooglePlacesPhotoUrl(photo) 
                    ? convertToProxyUrl(photo, 400) 
                    : photo;
                  urls.add(processedUrl);
                }
              } catch {
                // Invalid URL, skip
              }
            }
          });
        });
      });
    });
  } catch (error) {
    console.error("Error extracting image URLs:", error);
  }

  return Array.from(urls);
};

/**
 * Clear all cached images
 */
export const clearImageCache = async (): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Error clearing image cache:", error);
    throw error;
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async (): Promise<{
  totalImages: number;
  totalSize: number;
}> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const images = request.result as CachedImage[];
        const totalSize = images.reduce(
          (sum, img) => sum + img.data.length,
          0
        );
        resolve({
          totalImages: images.length,
          totalSize,
        });
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return { totalImages: 0, totalSize: 0 };
  }
};

