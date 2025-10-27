/**
 * Image Cache Utility
 * Downloads and caches images from URLs to IndexedDB for offline/persistent access
 * Gracefully falls back to direct URLs if IndexedDB is unavailable
 */

const DB_NAME = "ImageCacheDB";
const STORE_NAME = "images";
const DB_VERSION = 1;

interface CachedImage {
  url: string;
  data: string; // base64 data
  timestamp: number;
}

// Track IndexedDB availability to avoid repeated failed attempts
let indexedDBAvailable: boolean | null = null;

/**
 * Check if IndexedDB is available in the current browser environment
 */
const isIndexedDBAvailable = (): boolean => {
  // Return cached result if already checked
  if (indexedDBAvailable !== null) {
    return indexedDBAvailable;
  }

  try {
    // Check if indexedDB exists and is accessible
    if (!window.indexedDB) {
      console.warn("IndexedDB not available (private mode or disabled)");
      indexedDBAvailable = false;
      return false;
    }

    // Try to open a test database to verify it actually works
    const testRequest = window.indexedDB.open("__test__");
    testRequest.onerror = () => {
      console.warn("IndexedDB is blocked or unavailable");
      indexedDBAvailable = false;
    };
    testRequest.onsuccess = () => {
      indexedDBAvailable = true;
      // Clean up test database
      try {
        window.indexedDB.deleteDatabase("__test__");
      } catch (e) {
        // Ignore cleanup errors
      }
    };

    // Assume available for now (will be updated by handlers)
    return true;
  } catch (error) {
    console.warn("Error checking IndexedDB availability:", error);
    indexedDBAvailable = false;
    return false;
  }
};

/**
 * Initialize IndexedDB
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // Check availability first
    if (!isIndexedDBAvailable()) {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      indexedDBAvailable = false;
      reject(request.error);
    };
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
  try {
    // Skip if IndexedDB is not available
    if (!isIndexedDBAvailable()) {
      console.debug("IndexedDB not available, skipping cache save");
      return;
    }

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
  } catch (error) {
    console.debug("Could not save image to cache, will use direct URL:", error);
    // Don't throw - just skip caching
    return;
  }
};

/**
 * Get image from IndexedDB
 */
const getImageFromDB = async (url: string): Promise<string | null> => {
  try {
    // Skip if IndexedDB is not available
    if (!isIndexedDBAvailable()) {
      return null;
    }

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
    console.debug(`IndexedDB unavailable, skipping cache lookup:`, error);
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
    // If IndexedDB is not available, just return the original URL
    if (!isIndexedDBAvailable()) {
      return url;
    }

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
    console.debug(`Error getting cached image, using direct URL:`, error);
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

  // If IndexedDB is not available, skip preloading entirely
  if (!isIndexedDBAvailable()) {
    console.debug("IndexedDB not available, skipping image preloading");
    // Report all as successful since we're just using direct URLs
    for (let i = 0; i < total; i++) {
      if (onProgress) {
        onProgress(i + 1, total);
      }
    }
    return { successful: total, failed: 0, errors: [] };
  }

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
      console.debug(`Failed to preload image ${url}:`, error);
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
    // Support both old and new JSON structures
    const trips = placesData?.message?.trips || placesData?.trip_suggestions?.trips || [];
    
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

