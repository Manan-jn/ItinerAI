/**
 * Image Downloader Utility
 * Downloads images from Google Maps API and caches them locally
 */

interface DownloadedImage {
  originalUrl: string;
  localPath: string;
  blob: Blob;
  objectUrl: string;
}

class ImageDownloader {
  private cache: Map<string, DownloadedImage> = new Map();
  private downloadQueue: Set<string> = new Set();

  /**
   * Helper function to convert Google Places photo URL to proxy URL
   */
  private convertToProxyUrl(url: string): string {
    if (!url.includes('maps.googleapis.com/maps/api/place/photo')) {
      return url;
    }
    
    try {
      const urlObj = new URL(url);
      const photoReference = urlObj.searchParams.get('photoreference');
      if (!photoReference) return url;
      
      return `/api/place-photo?photoreference=${photoReference}&maxwidth=400`;
    } catch {
      return url;
    }
  }

  /**
   * Download a single image and cache it
   */
  async downloadImage(url: string): Promise<string> {
    // Convert Google Places URLs to proxy URLs
    const processedUrl = this.convertToProxyUrl(url);
    
    // Check if already cached
    if (this.cache.has(processedUrl)) {
      return this.cache.get(processedUrl)!.objectUrl;
    }

    // Check if already downloading
    if (this.downloadQueue.has(processedUrl)) {
      // Wait for download to complete
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (this.cache.has(processedUrl)) {
            clearInterval(checkInterval);
            resolve(this.cache.get(processedUrl)!.objectUrl);
          }
        }, 100);

        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error(`Timeout downloading image: ${processedUrl}`));
        }, 30000);
      });
    }

    try {
      this.downloadQueue.add(processedUrl);
      console.log(`Downloading image: ${processedUrl.substring(0, 100)}...`);

      const response = await fetch(processedUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'force-cache',
      });

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const downloadedImage: DownloadedImage = {
        originalUrl: url, // Keep original URL for reference
        localPath: objectUrl,
        blob,
        objectUrl,
      };

      this.cache.set(processedUrl, downloadedImage);
      this.downloadQueue.delete(processedUrl);

      console.log(`Successfully downloaded image: ${processedUrl.substring(0, 100)}...`);
      return objectUrl;
    } catch (error) {
      this.downloadQueue.delete(processedUrl);
      console.error(`Error downloading image ${processedUrl}:`, error);
      throw error;
    }
  }

  /**
   * Download multiple images in parallel
   */
  async downloadImages(urls: string[]): Promise<Map<string, string>> {
    const uniqueUrls = [...new Set(urls)]; // Remove duplicates
    const results = new Map<string, string>();

    console.log(`Starting download of ${uniqueUrls.length} images...`);

    // Download in batches of 5 to avoid overwhelming the browser
    const batchSize = 5;
    for (let i = 0; i < uniqueUrls.length; i += batchSize) {
      const batch = uniqueUrls.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(url => this.downloadImage(url))
      );

      batchResults.forEach((result, index) => {
        const url = batch[index];
        if (result.status === 'fulfilled') {
          results.set(url, result.value);
        } else {
          console.error(`Failed to download ${url}:`, result.reason);
          // Store original URL as fallback
          results.set(url, url);
        }
      });

      // Small delay between batches
      if (i + batchSize < uniqueUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Downloaded ${results.size} images successfully`);
    return results;
  }

  /**
   * Get cached image URL
   */
  getCachedImage(url: string): string | null {
    // Convert Google Places URLs to proxy URLs for cache lookup
    const processedUrl = this.convertToProxyUrl(url);
    const cached = this.cache.get(processedUrl);
    return cached ? cached.objectUrl : null;
  }

  /**
   * Clear all cached images
   */
  clearCache(): void {
    // Revoke all object URLs to free memory
    this.cache.forEach(image => {
      URL.revokeObjectURL(image.objectUrl);
    });
    this.cache.clear();
    console.log('Image cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; urls: string[] } {
    return {
      size: this.cache.size,
      urls: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const imageDownloader = new ImageDownloader();

/**
 * Extract all image URLs from trip data
 */
export function extractImageUrls(tripData: any): string[] {
  const urls: string[] = [];

  if (!tripData) return urls;

  // Handle both single trip and array of trips
  const trips = Array.isArray(tripData) ? tripData : [tripData];

  trips.forEach(trip => {
    // Extract from trip_route
    if (trip.trip_route && Array.isArray(trip.trip_route)) {
      trip.trip_route.forEach((place: any) => {
        if (place.photos && Array.isArray(place.photos)) {
          urls.push(...place.photos);
        }
      });
    }

    // Extract from day_wise_plan
    if (trip.day_wise_plan && Array.isArray(trip.day_wise_plan)) {
      trip.day_wise_plan.forEach((day: any) => {
        if (day.cities && Array.isArray(day.cities)) {
          day.cities.forEach((city: any) => {
            if (city.photos && Array.isArray(city.photos)) {
              urls.push(...city.photos);
            }
          });
        }
      });
    }
  });

  return urls;
}

/**
 * Validate trip data structure and add missing fields
 */
export function validateAndPopulateTripData(tripData: any): any {
  if (!tripData) return tripData;

  // Handle both single trip and array of trips
  const trips = Array.isArray(tripData) ? tripData : [tripData];

  const validatedTrips = trips.map(trip => {
    const validatedTrip = { ...trip };

    // Ensure trip_route exists
    if (!validatedTrip.trip_route) {
      validatedTrip.trip_route = [];
    }

    // Validate and populate trip_route
    validatedTrip.trip_route = validatedTrip.trip_route.map((place: any) => ({
      place_name: place.place_name || place.name || 'Unknown Place',
      address: place.address || place.place_name || '',
      map_url: place.map_url || '',
      lat: place.lat || '0',
      long: place.long || '0',
      photos: place.photos || [],
      place_id: place.place_id || '',
    }));

    // Ensure day_wise_plan exists
    if (!validatedTrip.day_wise_plan) {
      validatedTrip.day_wise_plan = [];
    }

    // Validate and populate day_wise_plan
    validatedTrip.day_wise_plan = validatedTrip.day_wise_plan.map((day: any) => {
      const validatedDay = { ...day };

      // Ensure cities exist
      if (!validatedDay.cities) {
        validatedDay.cities = [];
      }

      validatedDay.cities = validatedDay.cities.map((city: any) => ({
        name: city.name || 'Unknown City',
        address: city.address || city.name || '',
        map_url: city.map_url || '',
        lat: city.lat || '0',
        long: city.long || '0',
        photos: city.photos || [],
        place_id: city.place_id || '',
      }));

      // Ensure must_do_activities exist
      if (!validatedDay.must_do_activities) {
        validatedDay.must_do_activities = [];
      }

      return validatedDay;
    });

    // Ensure other required fields
    validatedTrip.trip_title = validatedTrip.trip_title || 'Untitled Trip';
    validatedTrip.no_of_days = validatedTrip.no_of_days || 0;
    validatedTrip.estimated_budget = validatedTrip.estimated_budget || 0;
    validatedTrip.best_time_to_visit = validatedTrip.best_time_to_visit || 'Anytime';
    validatedTrip.theme = validatedTrip.theme || validatedTrip.themes || [];

    return validatedTrip;
  });

  return Array.isArray(tripData) ? validatedTrips : validatedTrips[0];
}

