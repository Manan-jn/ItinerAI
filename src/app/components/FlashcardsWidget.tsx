"use client";

import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  extractImageUrlsFromPlacesData,
  preloadImages,
  getCachedImage,
} from "../utils/imageCache";
import { imageDownloader } from "../utils/imageDownloader";

interface TripInfo {
  trip_title: string;
  no_of_days: number;
  estimated_budget: number;
  best_time_to_visit: string;
  theme: string[];
  day_wise_plan: DayPlan[];
  image?: string; // We'll use photos from day_wise_plan
}

interface DayPlan {
  day_number: number;
  cities: CityInfo[];
  must_do_activities: Activity[];
}

interface CityInfo {
  name: string;
  address: string;
  map_url: string;
  lat: string;
  long: string;
  photos: string[];
  place_id: string;
}

interface Activity {
  type: string;
  name: string;
  description: string;
}

// Import trip data from places.json
import placesData from "../../../places.json";

// Helper function to validate if a URL is a valid image URL
const isValidImageUrl = (url: string): boolean => {
  if (!url || url.trim() === "") return false;

  // Check if it's a proper HTTP/HTTPS URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

// Function to get fallback image based on theme
const getThemeFallbackImage = (trip: any): string => {
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

// Function to get trip image from photos in day_wise_plan
const getTripImage = (trip: any, cachedUrls?: Map<string, string>): string => {
  // Try to get the first photo from the first city in day_wise_plan
  try {
    const firstCityPhoto = trip.day_wise_plan?.[0]?.cities?.[0]?.photos?.[0];

    // Validate the URL before using it
    if (isValidImageUrl(firstCityPhoto)) {
      // Check imageDownloader cache first
      const downloadedImage = imageDownloader.getCachedImage(firstCityPhoto);
      if (downloadedImage) {
        return downloadedImage;
      }
      // Return cached version from old cache if available
      if (cachedUrls && cachedUrls.has(firstCityPhoto)) {
        return cachedUrls.get(firstCityPhoto)!;
      }
      return firstCityPhoto;
    }

    // If Google Maps URL or invalid, check other cities
    for (const day of trip.day_wise_plan || []) {
      for (const city of day.cities || []) {
        for (const photo of city.photos || []) {
          if (isValidImageUrl(photo)) {
            // Check imageDownloader cache first
            const downloadedImage = imageDownloader.getCachedImage(photo);
            if (downloadedImage) {
              return downloadedImage;
            }
            // Return cached version from old cache if available
            if (cachedUrls && cachedUrls.has(photo)) {
              return cachedUrls.get(photo)!;
            }
            return photo;
          }
        }
      }
    }
  } catch (error) {
    console.warn("Error fetching trip image from day_wise_plan:", error);
  }

  // Fallback to theme-based Unsplash images
  return getThemeFallbackImage(trip);
};

// Function to get city-specific fallback image
const getCityFallbackImage = (city: any): string => {
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
const getCityImage = (city: any, cachedUrls?: Map<string, string>): string => {
  // Try to get photo from city.photos array
  try {
    if (city.photos && city.photos.length > 0) {
      // Find the first valid image URL
      for (const photo of city.photos) {
        if (isValidImageUrl(photo)) {
          // Check imageDownloader cache first
          const downloadedImage = imageDownloader.getCachedImage(photo);
          if (downloadedImage) {
            return downloadedImage;
          }
          // Return cached version from old cache if available
          if (cachedUrls && cachedUrls.has(photo)) {
            return cachedUrls.get(photo)!;
          }
          return photo;
        }
      }
    }
  } catch (error) {
    console.warn("Error fetching city photo:", error);
  }

  // Fallback to city-specific Unsplash images based on city name
  return getCityFallbackImage(city);
};

// Extract trips from the imported data
const tripsData: TripInfo[] = placesData.trip_suggestions.trips.map(
  (trip: any) => ({
    ...trip,
    image: getTripImage(trip),
  })
);

// Card size used for scroll calculations (slide width + horizontal gap)
const CARD_WIDTH = 280; // keep in sync with .flashcard-slide sizes

/**
 * Build an extended trips array for seamless cyclic scrolling.
 * We prepend and append multiple cards to create a truly seamless experience
 * where users can always see the next/previous cards in the cycle.
 */
const buildExtendedTrips = (trips: TripInfo[]): TripInfo[] => {
  if (trips.length === 0) return [];
  if (trips.length === 1) return [trips[0], trips[0], trips[0]]; // Handle single trip case

  // For seamless cycling, we need to show at least 2 cards on each side
  // This ensures users can always see what's coming next
  const numClones = Math.min(2, trips.length);

  // Get the last few trips for prepending
  const prefix = trips.slice(-numClones);
  // Get the first few trips for appending
  const suffix = trips.slice(0, numClones);

  return [...prefix, ...trips, ...suffix];
};

interface FlashcardsWidgetProps {
  isVisible: boolean;
  onToggle: () => void;
  trips?: TripInfo[]; // Allow custom trips data
  rightPanelCollapsed?: boolean; // Track right panel state
  onTripSelect?: (trip: TripInfo | null) => void; // Callback for trip selection
}

export interface FlashcardsWidgetRef {
  clearSelection: () => void;
}

const FlashcardsWidget = forwardRef<FlashcardsWidgetRef, FlashcardsWidgetProps>(
  (
    {
      isVisible,
      onToggle,
      trips = tripsData,
      rightPanelCollapsed = false,
      onTripSelect,
    },
    ref
  ) => {
    const [activeSlide, setActiveSlide] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [photoGallery, setPhotoGallery] = useState<{
      photos: string[];
      currentIndex: number;
    } | null>(null);
    const [suggestionPanelOpen, setSuggestionPanelOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCard, setSelectedCard] = useState<number | null>(null);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      clearSelection: () => {
        setSelectedCard(null);
      },
    }));

    // Image preloading states
    const [isLoadingImages, setIsLoadingImages] = useState(true);
    const [cachedImageUrls, setCachedImageUrls] = useState<Map<string, string>>(
      new Map()
    );

    /**
     * Index of the centred slide **within the extended array** (includes clones).
     * We keep this separate from the real index to simplify distance calculations.
     */
    const numClones = Math.min(2, trips.length);
    const [centerExtendedIdx, setCenterExtendedIdx] = useState(numClones); // Start at first real card

    // Derived real index for consumers (modal, click etc.)
    const centerCardIndex =
      (centerExtendedIdx - numClones + trips.length) % trips.length;

    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    // Throttle flag to allow only one slide movement per wheel gesture
    const wheelLockRef = React.useRef(false);
    // Touch/swipe handling refs
    const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
    const isScrollingRef = React.useRef(false);
    const scrollLockRef = React.useRef(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Memoised trips with cached images
    const tripsWithCachedImages = React.useMemo(() => {
      if (cachedImageUrls.size === 0) {
        return trips;
      }

      return trips.map((trip) => ({
        ...trip,
        image: getTripImage(trip, cachedImageUrls),
      }));
    }, [trips, cachedImageUrls]);

    // Memoised extended trips to avoid rebuilding on every render
    const extendedTrips = React.useMemo(
      () => buildExtendedTrips(tripsWithCachedImages),
      [tripsWithCachedImages]
    );

    // Debug: Log the trips data to ensure images are mapped correctly
    React.useEffect(() => {
      console.log("FlashcardsWidget trips data with images from JSON:");
      trips.forEach((trip, index) => {
        const rawPhoto = trip.day_wise_plan?.[0]?.cities?.[0]?.photos?.[0];
        const isFromJson = rawPhoto && isValidImageUrl(rawPhoto);
        console.log(`Trip ${index + 1}: ${trip.trip_title}`);
        console.log(`  - JSON photo URL: ${rawPhoto || "None"}`);
        console.log(`  - Using image: ${trip.image}`);
        console.log(
          `  - Source: ${isFromJson ? "JSON photos" : "Theme fallback"}`
        );
        console.log(`  - Themes: ${trip.theme.join(", ")}`);
      });
    }, [trips]);

    // Preload all images from places.json on component mount
    React.useEffect(() => {
      const preloadAllImages = async () => {
        try {
          console.log("Starting image preloading...");
          setIsLoadingImages(true);

          // Extract all image URLs from places.json
          const imageUrls = extractImageUrlsFromPlacesData(placesData);
          console.log(`Found ${imageUrls.length} images to preload`);

          // Preload images in background without UI overlay
          const result = await preloadImages(imageUrls);

          console.log(
            `Image preloading complete: ${result.successful} successful, ${result.failed} failed`
          );
          if (result.failed > 0) {
            console.warn("Failed images:", result.errors);
          }

          // Now load all cached images into a map
          const imageMap = new Map<string, string>();
          for (const url of imageUrls) {
            try {
              const cachedData = await getCachedImage(url);
              imageMap.set(url, cachedData);
            } catch (error) {
              console.error(`Failed to get cached image for ${url}:`, error);
            }
          }

          setCachedImageUrls(imageMap);
          setIsLoadingImages(false);
          console.log("All images loaded and cached");
        } catch (error) {
          console.error("Error preloading images:", error);
          setIsLoadingImages(false);
        }
      };

      preloadAllImages();
    }, []); // Run only once on mount

    /*-------------------------------------------------------------
     * Initial centering – use actual DOM measurements so we're not
     * dependent on the CARD_WIDTH constant (which is only an estimate).
     *------------------------------------------------------------*/
    useEffect(() => {
      if (scrollContainerRef.current && !isInitialized) {
        const container = scrollContainerRef.current;
        container.style.scrollBehavior = "auto";

        // The first *real* slide lives at index numClones
        const firstRealSlide = container.children.item(
          numClones
        ) as HTMLElement | null;
        if (firstRealSlide) {
          const offset =
            firstRealSlide.offsetLeft -
            (container.offsetWidth - firstRealSlide.offsetWidth) / 2;
          container.scrollLeft = offset;
        }

        container.style.scrollBehavior = "smooth";
        setIsInitialized(true);
      }
    }, [isInitialized, numClones]);

    /*-------------------------------------------------------------
     * Helper: scroll exactly one slide left/right (dir = -1 | +1)
     *------------------------------------------------------------*/
    const scrollByCard = (dir: -1 | 1) => {
      if (!scrollContainerRef.current || scrollLockRef.current) return;

      // Debug logging
      console.log("scrollByCard called:", {
        direction: dir,
        currentIdx: centerExtendedIdx,
        targetIdx: centerExtendedIdx + dir,
        numClones,
        totalCards: extendedTrips.length,
      });

      // Lock scrolling to prevent multiple rapid calls
      scrollLockRef.current = true;
      isScrollingRef.current = true;

      const container = scrollContainerRef.current;
      let targetIdx = centerExtendedIdx + dir;

      // Calculate boundaries for real cards
      const firstRealIdx = numClones;
      const lastRealIdx = numClones + trips.length - 1;

      // wrap handling - check if we need to teleport
      if (targetIdx < numClones) {
        // Moving left beyond first real card -> teleport to equivalent position at the end
        const equivalentIdx = lastRealIdx - (numClones - 1 - targetIdx);

        // First scroll to the target clone (smooth)
        container.style.scrollBehavior = "smooth";
        const targetSlide = container.children.item(
          targetIdx
        ) as HTMLElement | null;
        if (targetSlide) {
          const offset =
            targetSlide.offsetLeft -
            (container.offsetWidth - targetSlide.offsetWidth) / 2;
          container.scrollLeft = offset;
        }

        // After smooth scroll completes, teleport to equivalent real card
        setTimeout(() => {
          container.style.scrollBehavior = "auto";
          const equivalentSlide = container.children.item(
            equivalentIdx
          ) as HTMLElement | null;
          if (equivalentSlide) {
            const offset =
              equivalentSlide.offsetLeft -
              (container.offsetWidth - equivalentSlide.offsetWidth) / 2;
            container.scrollLeft = offset;
          }
          setCenterExtendedIdx(equivalentIdx);
          container.style.scrollBehavior = "smooth";

          // Release lock after teleport
          setTimeout(() => {
            scrollLockRef.current = false;
            isScrollingRef.current = false;
          }, 50);
        }, 300);
        return;
      } else if (targetIdx > lastRealIdx) {
        // Moving right beyond last real card -> teleport to equivalent position at the start
        const equivalentIdx = firstRealIdx + (targetIdx - lastRealIdx - 1);

        // First scroll to the target clone (smooth)
        container.style.scrollBehavior = "smooth";
        const targetSlide = container.children.item(
          targetIdx
        ) as HTMLElement | null;
        if (targetSlide) {
          const offset =
            targetSlide.offsetLeft -
            (container.offsetWidth - targetSlide.offsetWidth) / 2;
          container.scrollLeft = offset;
        }

        // After smooth scroll completes, teleport to equivalent real card
        setTimeout(() => {
          container.style.scrollBehavior = "auto";
          const equivalentSlide = container.children.item(
            equivalentIdx
          ) as HTMLElement | null;
          if (equivalentSlide) {
            const offset =
              equivalentSlide.offsetLeft -
              (container.offsetWidth - equivalentSlide.offsetWidth) / 2;
            container.scrollLeft = offset;
          }
          setCenterExtendedIdx(equivalentIdx);
          container.style.scrollBehavior = "smooth";

          // Release lock after teleport
          setTimeout(() => {
            scrollLockRef.current = false;
            isScrollingRef.current = false;
          }, 50);
        }, 300);
        return;
      }

      // Normal case - just scroll to target (within real cards or visible clones)
      setCenterExtendedIdx(targetIdx);
      const targetSlide = container.children.item(
        targetIdx
      ) as HTMLElement | null;
      if (targetSlide) {
        const offset =
          targetSlide.offsetLeft -
          (container.offsetWidth - targetSlide.offsetWidth) / 2;
        container.scrollTo({
          left: offset,
          behavior: "smooth",
        });

        // Release lock after smooth scroll animation
        setTimeout(() => {
          scrollLockRef.current = false;
          isScrollingRef.current = false;
        }, 350);
      }
    };

    /* Wheel event: allow one-unit navigation */
    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const onWheel = (e: WheelEvent) => {
        // Always prevent default to avoid any browser navigation
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (
          wheelLockRef.current ||
          scrollLockRef.current ||
          isScrollingRef.current
        ) {
          return;
        }

        // Use both deltaX and deltaY, prioritize the larger one
        const deltaX = e.deltaX;
        const deltaY = e.deltaY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // Determine primary scroll direction and value
        let primaryDelta = 0;
        if (absDeltaX > absDeltaY) {
          primaryDelta = deltaX;
        } else {
          primaryDelta = deltaY;
        }

        // Lower threshold for better responsiveness
        if (Math.abs(primaryDelta) < 8) return;

        wheelLockRef.current = true;

        // Determine direction: positive delta = scroll right, negative = scroll left
        const direction = primaryDelta > 0 ? 1 : -1;

        // Debug logging
        console.log("Wheel event:", {
          deltaX,
          deltaY,
          primaryDelta,
          direction,
          currentIdx: centerExtendedIdx,
        });

        scrollByCard(direction);

        // Optimized lock time for smoother experience
        setTimeout(() => {
          wheelLockRef.current = false;
        }, 400);
      };

      // Add event listener with capture to intercept early
      container.addEventListener("wheel", onWheel, {
        passive: false,
        capture: true,
      });
      return () => container.removeEventListener("wheel", onWheel, true);
    }, [centerExtendedIdx]);

    // Touch/Swipe gesture handlers
    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const handleTouchStart = (e: TouchEvent) => {
        // Always prevent default to avoid browser navigation
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (scrollLockRef.current || isScrollingRef.current) {
          return;
        }

        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      };

      const handleTouchMove = (e: TouchEvent) => {
        // Always prevent native scrolling and browser navigation during touch
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      };

      const handleTouchEnd = (e: TouchEvent) => {
        // Always prevent default to avoid browser navigation
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (
          !touchStartRef.current ||
          scrollLockRef.current ||
          isScrollingRef.current
        ) {
          touchStartRef.current = null;
          return;
        }

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;

        // Only process horizontal swipes with sufficient distance
        const minSwipeDistance = 30; // Reduced for better responsiveness
        const maxVerticalMovement = 120; // Increased tolerance

        if (
          Math.abs(deltaX) > minSwipeDistance &&
          Math.abs(deltaY) < maxVerticalMovement
        ) {
          const direction = deltaX > 0 ? -1 : 1; // Swipe right = go left, swipe left = go right

          // Debug logging
          console.log("Touch swipe:", {
            deltaX,
            deltaY,
            direction,
            currentIdx: centerExtendedIdx,
          });

          scrollByCard(direction);
        }

        touchStartRef.current = null;
      };

      // Prevent native scrolling
      const preventNativeScroll = (e: Event) => {
        if (!isScrollingRef.current) {
          e.preventDefault();
          // Snap back to current position
          const currentSlide = container.children.item(
            centerExtendedIdx
          ) as HTMLElement | null;
          if (currentSlide) {
            const offset =
              currentSlide.offsetLeft -
              (container.offsetWidth - currentSlide.offsetWidth) / 2;
            container.scrollLeft = offset;
          }
        }
      };

      // Use capture mode to intercept events early and prevent browser navigation
      container.addEventListener("touchstart", handleTouchStart, {
        passive: false,
        capture: true,
      });
      container.addEventListener("touchmove", handleTouchMove, {
        passive: false,
        capture: true,
      });
      container.addEventListener("touchend", handleTouchEnd, {
        passive: false,
        capture: true,
      });
      container.addEventListener("scroll", preventNativeScroll, {
        passive: false,
        capture: true,
      });

      return () => {
        container.removeEventListener("touchstart", handleTouchStart, true);
        container.removeEventListener("touchmove", handleTouchMove, true);
        container.removeEventListener("touchend", handleTouchEnd, true);
        container.removeEventListener("scroll", preventNativeScroll, true);
      };
    }, [centerExtendedIdx]);

    // Handle scroll to detect center card
    const handleScroll = () => {
      if (scrollContainerRef.current && isInitialized) {
        const container = scrollContainerRef.current;
        const containerWidth = container.offsetWidth;
        const scrollLeft = container.scrollLeft;

        // Calculate which *extended* card is currently centred based on actual DOM positions
        let closestIdx = numClones;
        let minDistance = Infinity;

        for (let i = 0; i < extendedTrips.length; i++) {
          const slide = container.children.item(i) as HTMLElement | null;
          if (slide) {
            const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
            const containerCenter = scrollLeft + containerWidth / 2;
            const distance = Math.abs(slideCenter - containerCenter);

            if (distance < minDistance) {
              minDistance = distance;
              closestIdx = i;
            }
          }
        }

        // Only update if we've changed position
        if (closestIdx !== centerExtendedIdx) {
          setCenterExtendedIdx(closestIdx);
        }
      }
    };

    // Handle body scroll when modal is open
    useEffect(() => {
      if (isModalOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }

      return () => {
        document.body.style.overflow = "unset";
      };
    }, [isModalOpen]);

    const handleSlideClick = (idxExt: number) => {
      const realIdx = (idxExt - numClones + trips.length) % trips.length;
      if (idxExt === centerExtendedIdx) {
        setActiveSlide(realIdx);
        setIsModalOpen(true);
      }
    };

    const handleCloseModal = (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
      }
      setActiveSlide(null);
      setIsModalOpen(false);
    };

    const handleSelectCard = (idxExt: number, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent triggering slide click
      const realIdx = (idxExt - numClones + trips.length) % trips.length;
      // Toggle selection: if already selected, deselect; otherwise select
      const newSelectedCard = selectedCard === realIdx ? null : realIdx;
      setSelectedCard(newSelectedCard);

      // Notify parent component about trip selection
      if (onTripSelect) {
        onTripSelect(newSelectedCard !== null ? trips[newSelectedCard] : null);
      }
    };

    const handleModalBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleCloseModal();
      }
    };

    const handlePhotoClick = (photos: string[], index: number = 0) => {
      // Filter out invalid URLs (including Google Maps URLs) before opening gallery
      const validPhotos = photos.filter((photo) => isValidImageUrl(photo));

      // If no valid photos, don't open gallery
      if (validPhotos.length === 0) {
        console.warn("No valid photos to display in gallery");
        return;
      }

      // Use cached versions if available
      const photosToDisplay = validPhotos.map((photo) => {
        if (cachedImageUrls.has(photo)) {
          return cachedImageUrls.get(photo)!;
        }
        return photo;
      });

      setPhotoGallery({
        photos: photosToDisplay,
        currentIndex: Math.min(index, photosToDisplay.length - 1),
      });
    };

    const handleClosePhotoGallery = () => {
      setPhotoGallery(null);
    };

    const handleNextPhoto = () => {
      if (
        photoGallery &&
        photoGallery.currentIndex < photoGallery.photos.length - 1
      ) {
        setPhotoGallery({
          ...photoGallery,
          currentIndex: photoGallery.currentIndex + 1,
        });
      }
    };

    const handlePrevPhoto = () => {
      if (photoGallery && photoGallery.currentIndex > 0) {
        setPhotoGallery({
          ...photoGallery,
          currentIndex: photoGallery.currentIndex - 1,
        });
      }
    };

    // Smooth appear on initial mount (after loader dissolves)
    const [isAppearing, setIsAppearing] = useState(true);
    useEffect(() => {
      const t = setTimeout(() => setIsAppearing(false), 600);
      return () => clearTimeout(t);
    }, []);

    if (!isVisible) return null;

    return (
      <>
        <div className={`flashcards-widget ${isAppearing ? "appear" : ""}`}>
          <div className="flashcards-header">
            <div className="header-content">
              <h3>Discover Amazing Trips</h3>
            </div>
            <button
              onClick={onToggle}
              className="toggle-btn"
              aria-label="Close trips explorer"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="flashcards-container">
            <div
              className="flashcards-scroll-wrapper"
              ref={scrollContainerRef}
              onScroll={handleScroll}
            >
              {extendedTrips.map((trip, index) => {
                const isCenter = index === centerExtendedIdx;
                const distance = Math.abs(index - centerExtendedIdx);
                const realIdx =
                  (index - numClones + trips.length) % trips.length;
                const isSelected = selectedCard === realIdx;

                return (
                  <div
                    key={`slide-wrapper-${index}`}
                    className="flashcard-wrapper"
                  >
                    <div
                      className={`flashcard-slide ${
                        isCenter ? "active" : "inactive"
                      } ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSlideClick(index)}
                      style={{
                        backgroundImage: trip.image
                          ? `url("${trip.image}")`
                          : "none",
                        backgroundColor: trip.image ? "transparent" : "#1a1a1a",
                        cursor: isCenter ? "pointer" : "default",
                      }}
                      data-distance={distance}
                    >
                      <div className="slide-overlay" />

                      <div className="slide-content">
                        {/* Title at top */}
                        <div className="slide-title-top">
                          <h4 className="trip-name">{trip.trip_title}</h4>
                        </div>

                        {/* Info cards at bottom */}
                        <div className="slide-info-bottom">
                          <div className="info-row">
                            <div className="info-card">
                              <div className="info-icon">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    ry="2"
                                  ></rect>
                                  <line x1="16" y1="2" x2="16" y2="6"></line>
                                  <line x1="8" y1="2" x2="8" y2="6"></line>
                                  <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                              </div>
                              <div className="info-text">
                                <span className="info-label">Trip</span>
                                <span className="info-value">
                                  {trip.no_of_days} Days
                                </span>
                              </div>
                            </div>

                            <div className="info-card">
                              <div className="info-icon">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                </svg>
                              </div>
                              <div className="info-text">
                                <span className="info-label">Budget</span>
                                <span className="info-value">
                                  ${trip.estimated_budget}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="info-row">
                            <div className="info-card full-width">
                              <div className="info-icon">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                              </div>
                              <div className="info-text">
                                <span className="info-label">Best Time</span>
                                <span className="info-value">
                                  {trip.best_time_to_visit}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tick button at top-right corner - only show for center/active card */}
                      {isCenter && (
                        <button
                          className={`flashcard-select-btn ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={(e) => handleSelectCard(index, e)}
                          aria-label={
                            isSelected
                              ? "Deselect this trip"
                              : "Select this trip"
                          }
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Arrows positioned outside the container */}
          <button
            className="nav-arrow nav-left"
            onClick={() => scrollByCard(-1)}
            aria-label="Previous"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button
            className="nav-arrow nav-right"
            onClick={() => scrollByCard(1)}
            aria-label="Next"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        {/* Modal for expanded trip details */}
        {isModalOpen && activeSlide !== null && (
          <div className="modal-backdrop">
            <button
              className="modal-close-btn"
              onClick={handleCloseModal}
              aria-label="Close modal"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="modal-container">
              <div
                className="modal-background"
                style={{
                  backgroundImage: trips[activeSlide].image
                    ? `url("${trips[activeSlide].image}")`
                    : "none",
                  backgroundColor: trips[activeSlide].image
                    ? "transparent"
                    : "#1a1a1a",
                }}
              />
              <div className="modal-overlay" />

              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title">
                    {trips[activeSlide].trip_title}
                  </h2>
                  <div className="modal-meta">
                    <div className="meta-card">
                      <span className="meta-icon">📅</span>
                      <div className="meta-text">
                        <span className="meta-label">Duration</span>
                        <span className="meta-value">
                          {trips[activeSlide].no_of_days} Days
                        </span>
                      </div>
                    </div>
                    <div className="meta-card">
                      <span className="meta-icon">💰</span>
                      <div className="meta-text">
                        <span className="meta-label">Budget</span>
                        <span className="meta-value">
                          ₹
                          {trips[activeSlide].estimated_budget.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="meta-card">
                      <span className="meta-icon">🌟</span>
                      <div className="meta-text">
                        <span className="meta-label">Best Time</span>
                        <span className="meta-value">
                          {trips[activeSlide].best_time_to_visit}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="modal-themes">
                    {trips[activeSlide].theme.map((theme, idx) => (
                      <span key={idx} className="modal-theme-tag">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="modal-body">
                  <h3 className="itinerary-title">Day-wise Itinerary</h3>
                  <div className="days-container">
                    {trips[activeSlide].day_wise_plan.map((day, dayIdx) => (
                      <div key={dayIdx} className="modal-day-card">
                        <div className="day-badge">
                          <span className="day-number">
                            Day {day.day_number}
                          </span>
                        </div>

                        <div className="day-content">
                          {/* City Cards with Images */}
                          <div className="day-cities-section">
                            {day.cities.map((city, cityIdx) => (
                              <React.Fragment key={cityIdx}>
                                {cityIdx > 0 && (
                                  <div className="city-divider">
                                    <span className="divider-text">
                                      Next Destination
                                    </span>
                                  </div>
                                )}
                                <div className="enhanced-city-card">
                                  {/* City Image Gallery */}
                                  <div
                                    className="city-image-container"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const validPhotos = (
                                        city.photos || []
                                      ).filter((photo: string) =>
                                        isValidImageUrl(photo)
                                      );
                                      if (validPhotos.length > 0) {
                                        handlePhotoClick(city.photos, 0);
                                      }
                                    }}
                                    style={{
                                      cursor:
                                        (city.photos || []).filter(
                                          (photo: string) =>
                                            isValidImageUrl(photo)
                                        ).length > 0
                                          ? "pointer"
                                          : "default",
                                    }}
                                  >
                                    <img
                                      src={getCityImage(city, cachedImageUrls)}
                                      alt={city.name}
                                      className="city-image"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          getCityFallbackImage(city);
                                      }}
                                    />
                                    <div className="city-image-overlay"></div>
                                    {(() => {
                                      const validPhotos = (
                                        city.photos || []
                                      ).filter((photo: string) =>
                                        isValidImageUrl(photo)
                                      );
                                      return validPhotos.length > 1 ? (
                                        <div className="photo-count-badge">
                                          <span>📷</span>
                                          <span>
                                            {validPhotos.length} photos
                                          </span>
                                        </div>
                                      ) : null;
                                    })()}
                                  </div>

                                  {/* City Info */}
                                  <div className="city-info-header">
                                    <div className="city-header-top">
                                      <h4 className="city-title">
                                        {city.name}
                                      </h4>
                                    </div>
                                    <p className="city-location">
                                      {city.address}
                                    </p>
                                    <div className="city-tags">
                                      {trips[activeSlide].theme
                                        .slice(0, 2)
                                        .map((theme, themeIdx) => (
                                          <span
                                            key={themeIdx}
                                            className={`city-tag-item ${
                                              themeIdx === 0
                                                ? "statues"
                                                : "fountain"
                                            }`}
                                          >
                                            {theme}
                                          </span>
                                        ))}
                                    </div>
                                  </div>

                                  {/* Must-do Activities for this city/day */}
                                  <div className="city-activities-list">
                                    {day.must_do_activities.map(
                                      (activity, actIdx) => (
                                        <div
                                          key={actIdx}
                                          className="enhanced-activity-item"
                                        >
                                          <div className="activity-main-content">
                                            <div className="activity-left">
                                              <div className="activity-number-badge">
                                                {actIdx + 1}
                                              </div>
                                              <div className="activity-type-icon">
                                                {activity.type === "place"
                                                  ? "📍"
                                                  : activity.type === "food"
                                                  ? "🍽️"
                                                  : activity.type === "activity"
                                                  ? "🎯"
                                                  : "📍"}
                                              </div>
                                              <div className="activity-details">
                                                <h5 className="activity-title">
                                                  {activity.name}
                                                </h5>
                                                <p className="activity-subtitle">
                                                  {activity.description}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="activity-actions">
                                              <button
                                                className="activity-action-btn add-btn"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSuggestionPanelOpen(true);
                                                }}
                                                title="Add activity"
                                              >
                                                <svg
                                                  width="14"
                                                  height="14"
                                                  viewBox="0 0 24 24"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="2.5"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                >
                                                  <line
                                                    x1="12"
                                                    y1="5"
                                                    x2="12"
                                                    y2="19"
                                                  ></line>
                                                  <line
                                                    x1="5"
                                                    y1="12"
                                                    x2="19"
                                                    y2="12"
                                                  ></line>
                                                </svg>
                                              </button>
                                              <button
                                                className="activity-action-btn remove-btn"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  console.log(
                                                    "Remove activity:",
                                                    activity.name
                                                  );
                                                }}
                                                title="Remove activity"
                                              >
                                                <svg
                                                  width="14"
                                                  height="14"
                                                  viewBox="0 0 24 24"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="2.5"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                >
                                                  <line
                                                    x1="5"
                                                    y1="12"
                                                    x2="19"
                                                    y2="12"
                                                  ></line>
                                                </svg>
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Chatbox at bottom center - outside modal container */}
            <div
              className="chatbox-container"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                className="chatbox-input"
                placeholder="Ask ItinerAI"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                className="chatbox-submit-btn"
                onClick={(e) => e.stopPropagation()}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>

            {/* Suggestion Panel */}
            {suggestionPanelOpen && (
              <div className="suggestion-panel">
                <div className="suggestion-header">
                  <h3>Add Activity</h3>
                  <button
                    className="panel-close-btn"
                    onClick={() => setSuggestionPanelOpen(false)}
                    aria-label="Close panel"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="suggestion-search">
                  <svg
                    className="search-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    className="suggestion-search-input"
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="suggestion-content">
                  <div className="suggestion-section">
                    <h4 className="suggestion-section-title">
                      Popular Activities
                    </h4>
                    <div className="suggestion-cards">
                      {[
                        "Hiking",
                        "Local Market",
                        "Museum Visit",
                        "Food Tour",
                        "Sunset Point",
                      ].map((activity, idx) => (
                        <div key={idx} className="suggestion-card">
                          <div className="suggestion-card-icon">🎯</div>
                          <div className="suggestion-card-content">
                            <h5 className="suggestion-card-title">
                              {activity}
                            </h5>
                            <p className="suggestion-card-desc">2-3 hours</p>
                          </div>
                          <button
                            className="suggestion-add-btn"
                            title="Add to itinerary"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="suggestion-section">
                    <h4 className="suggestion-section-title">Food & Dining</h4>
                    <div className="suggestion-cards">
                      {["Traditional Restaurant", "Street Food", "Cafe"].map(
                        (activity, idx) => (
                          <div key={idx} className="suggestion-card">
                            <div className="suggestion-card-icon">🍽️</div>
                            <div className="suggestion-card-content">
                              <h5 className="suggestion-card-title">
                                {activity}
                              </h5>
                              <p className="suggestion-card-desc">1-2 hours</p>
                            </div>
                            <button
                              className="suggestion-add-btn"
                              title="Add to itinerary"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Photo Gallery Modal */}
        {photoGallery && (
          <div
            className="photo-gallery-backdrop"
            onClick={handleClosePhotoGallery}
          >
            <div
              className="photo-gallery-container"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="gallery-close-btn"
                onClick={handleClosePhotoGallery}
                aria-label="Close gallery"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {photoGallery.photos.length > 1 && (
                <>
                  <button
                    className="gallery-nav-btn gallery-prev"
                    onClick={handlePrevPhoto}
                    disabled={photoGallery.currentIndex === 0}
                    aria-label="Previous photo"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>

                  <button
                    className="gallery-nav-btn gallery-next"
                    onClick={handleNextPhoto}
                    disabled={
                      photoGallery.currentIndex ===
                      photoGallery.photos.length - 1
                    }
                    aria-label="Next photo"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </>
              )}

              <div className="photo-gallery-content">
                <img
                  src={photoGallery.photos[photoGallery.currentIndex]}
                  alt={`Photo ${photoGallery.currentIndex + 1}`}
                  className="gallery-image"
                  onError={(e) => {
                    // If image fails to load, use default travel image
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=800&fit=crop&auto=format&q=80";
                  }}
                />
                {photoGallery.photos.length > 1 && (
                  <div className="photo-counter">
                    {photoGallery.currentIndex + 1} /{" "}
                    {photoGallery.photos.length}
                  </div>
                )}
              </div>

              {/* Thumbnail strip for multiple photos */}
              {photoGallery.photos.length > 1 && (
                <div className="photo-thumbnails">
                  {photoGallery.photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className={`thumbnail ${
                        idx === photoGallery.currentIndex ? "active" : ""
                      }`}
                      onClick={() =>
                        setPhotoGallery({ ...photoGallery, currentIndex: idx })
                      }
                    >
                      <img
                        src={photo}
                        alt={`Thumbnail ${idx + 1}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=100&h=100&fit=crop&auto=format&q=80";
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes fc-fade-up {
            from {
              opacity: 0;
              transform: translateY(6px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .flashcards-widget.appear {
            animation: fc-fade-up 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          .flashcards-widget {
            background: transparent;
            backdrop-filter: none;
            border-radius: 12px;
            padding: 10px 70px 14px 70px;
            margin: 8px auto;
            width: 100%;
            max-width: ${rightPanelCollapsed
              ? "calc(100vw - 140px)"
              : "calc(100vw - 440px)"};
            height: calc(100% - 24px);
            max-height: calc(100vh - 130px);
            border: none;
            box-shadow: none;
            transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            position: relative;
            overflow: visible;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            /* Prevent browser navigation gestures */
            touch-action: none;
            overscroll-behavior: none;
            overscroll-behavior-x: none;
            overscroll-behavior-y: none;
            -webkit-overscroll-behavior: none;
            -webkit-overscroll-behavior-x: none;
            -webkit-overscroll-behavior-y: none;
          }

          /* Modal Styles */
          .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.94);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            z-index: 10000;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 80px 32px 100px 32px;
            animation: fadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            overflow-y: auto;
            overflow-x: hidden;
          }

          .modal-container {
            position: relative;
            width: 100%;
            max-width: 750px;
            max-height: calc(100vh - 180px);
            height: fit-content;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8),
              0 0 0 1px rgba(255, 255, 255, 0.1);
            animation: slideInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: 1px solid rgba(255, 255, 255, 0.12);
            display: flex;
            flex-direction: column;
            margin: 0;
          }

          .modal-background {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            filter: blur(3px) brightness(0.9);
            transform: scale(1.1);
            transition: filter 0.3s ease;
          }

          .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              135deg,
              rgba(0, 0, 0, 0.75) 0%,
              rgba(0, 0, 0, 0.5) 50%,
              rgba(0, 0, 0, 0.85) 100%
            );
          }

          .modal-close-btn {
            position: fixed;
            top: 88px;
            right: 40px;
            background: rgba(255, 255, 255, 0.15);
            border: 1.5px solid rgba(255, 255, 255, 0.25);
            border-radius: 50%;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            z-index: 10003;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4),
              inset 0 1px 1px rgba(255, 255, 255, 0.2);
          }

          .modal-close-btn:hover {
            background: rgba(255, 255, 255, 0.22);
            border-color: rgba(255, 255, 255, 0.4);
            transform: scale(1.08) rotate(90deg);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5),
              inset 0 1px 2px rgba(255, 255, 255, 0.3);
          }

          .modal-close-btn:active {
            transform: scale(0.95) rotate(90deg);
          }

          .modal-close-btn svg {
            width: 18px;
            height: 18px;
            stroke-width: 2.5;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
          }

          .modal-content {
            position: relative;
            z-index: 10;
            height: 100%;
            max-height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 24px 20px;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.35) rgba(255, 255, 255, 0.1);
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
          }

          .modal-content::-webkit-scrollbar {
            width: 6px;
          }

          .modal-content::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 3px;
            margin: 4px 0;
          }

          .modal-content::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.25);
            border-radius: 3px;
            transition: background 0.3s ease;
          }

          .modal-content::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.35);
          }

          .modal-header {
            text-align: center;
            margin-bottom: 20px;
            animation: fadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
          }

          .modal-title {
            color: white;
            font-size: 1.6rem;
            font-weight: 600;
            margin: 0 0 16px 0;
            text-shadow: 0 3px 12px rgba(0, 0, 0, 0.8);
            line-height: 1.3;
            letter-spacing: -0.02em;
          }

          .modal-meta {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 16px;
          }

          .meta-card {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 10px;
            padding: 12px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .meta-card:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.25);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }

          .meta-icon {
            font-size: 1.4rem;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
            flex-shrink: 0;
          }

          .meta-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .meta-label {
            color: rgba(255, 255, 255, 0.65);
            font-size: 0.7rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }

          .meta-value {
            color: white;
            font-size: 0.9rem;
            font-weight: 600;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
          }

          .modal-themes {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px;
          }

          .modal-theme-tag {
            background: rgba(255, 255, 255, 0.12);
            color: white;
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 500;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .modal-theme-tag:hover {
            background: rgba(255, 255, 255, 0.18);
            border-color: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
          }

          .modal-body {
            animation: fadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
          }

          .itinerary-title {
            color: white;
            font-size: 1.2rem;
            font-weight: 600;
            margin: 0 0 16px 0;
            text-align: center;
            text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
            letter-spacing: -0.02em;
          }

          .days-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .modal-day-card {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 12px;
            overflow: hidden;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .modal-day-card:hover {
            background: rgba(255, 255, 255, 0.11);
            border-color: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          }

          .day-badge {
            background: rgba(255, 255, 255, 0.12);
            padding: 7px;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .day-number {
            color: white;
            font-size: 0.8rem;
            font-weight: 600;
            letter-spacing: 0.02em;
          }

          .day-content {
            padding: 12px;
          }

          .section-title {
            color: white;
            font-size: 0.85rem;
            font-weight: 600;
            margin: 0 0 8px 0;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .day-cities-section {
            display: flex;
            flex-direction: column;
            gap: 0;
          }

          /* City Divider */
          .city-divider {
            padding: 10px 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .divider-text {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.7rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: rgba(255, 255, 255, 0.05);
            padding: 5px 14px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
          }

          /* Enhanced City Card Styles */
          .enhanced-city-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            overflow: hidden;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            transition: all 0.2s ease;
            margin-bottom: 0;
          }

          .enhanced-city-card:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.15);
          }

          /* City Image */
          .city-image-container {
            position: relative;
            width: 100%;
            height: 140px;
            overflow: hidden;
            cursor: pointer;
          }

          .city-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: transform 0.25s ease;
          }

          .city-image-container:hover .city-image {
            transform: scale(1.04);
          }

          .enhanced-city-card:hover .city-image {
            transform: scale(1.01);
          }

          .city-image-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              180deg,
              rgba(0, 0, 0, 0) 0%,
              rgba(0, 0, 0, 0.3) 100%
            );
            transition: background 0.3s ease;
          }

          .city-image-container:hover .city-image-overlay {
            background: linear-gradient(
              180deg,
              rgba(0, 0, 0, 0) 0%,
              rgba(0, 0, 0, 0.2) 100%
            );
          }

          .city-image-container:hover .city-image-overlay::after {
            content: "🔍";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            opacity: 0.8;
            filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.8));
            animation: pulseZoom 0.5s ease-in-out;
          }

          @keyframes pulseZoom {
            0% {
              transform: translate(-50%, -50%) scale(0.5);
              opacity: 0;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.1);
              opacity: 0.9;
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.8;
            }
          }

          .photo-count-badge {
            position: absolute;
            bottom: 7px;
            right: 7px;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 4px 9px;
            color: white;
            font-size: 0.65rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 3px;
            z-index: 10;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            transition: all 0.2s ease;
            pointer-events: none;
          }

          .city-image-container:hover .photo-count-badge {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.3);
            transform: scale(1.03);
          }

          /* Photo Gallery Modal Styles */
          .photo-gallery-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(30px);
            -webkit-backdrop-filter: blur(30px);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: fadeIn 0.3s ease;
          }

          .photo-gallery-container {
            position: relative;
            width: 100%;
            max-width: 1200px;
            height: 100%;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .gallery-close-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            z-index: 10;
          }

          .gallery-close-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.4);
            transform: scale(1.1);
          }

          .gallery-nav-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            z-index: 10;
          }

          .gallery-nav-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }

          .gallery-nav-btn:not(:disabled):hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.4);
            transform: translateY(-50%) scale(1.1);
          }

          .gallery-prev {
            left: 20px;
          }

          .gallery-next {
            right: 20px;
          }

          .photo-gallery-content {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 60px;
          }

          .gallery-image {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
          }

          .photo-counter {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            padding: 6px 16px;
            color: white;
            font-size: 0.85rem;
            font-weight: 600;
          }

          .photo-thumbnails {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            padding: 12px;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 90%;
            overflow-x: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);
          }

          .photo-thumbnails::-webkit-scrollbar {
            height: 4px;
          }

          .photo-thumbnails::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
          }

          .photo-thumbnails::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
          }

          .thumbnail {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.3s ease;
            flex-shrink: 0;
          }

          .thumbnail:hover {
            border-color: rgba(255, 255, 255, 0.3);
          }

          .thumbnail.active {
            border-color: rgba(255, 245, 157, 0.8);
            box-shadow: 0 0 12px rgba(255, 245, 157, 0.4);
          }

          .thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          /* Chatbox Styles - Fixed at bottom on black backdrop */
          .chatbox-container {
            position: fixed;
            bottom: 16px;
            left: 50%;
            transform: translateX(-50%);
            width: 225px;
            height: 48px;
            display: flex;
            align-items: center;
            background: rgba(50, 50, 52, 0.95);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border-radius: 24px;
            padding: 8px;
            gap: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
            z-index: 10002;
            animation: slideUpFade 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)
              0.3s both;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s ease;
            pointer-events: auto;
          }

          .chatbox-container:focus-within {
            width: 355px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
          }

          .chatbox-input {
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            padding: 0 8px;
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.9);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              sans-serif;
            font-weight: 400;
            height: 32px;
          }

          .chatbox-input::placeholder {
            color: rgba(255, 255, 255, 0.5);
            font-weight: 400;
          }

          .chatbox-input:focus {
            color: rgba(255, 255, 255, 1);
          }

          .chatbox-submit-btn {
            background: rgba(70, 70, 73, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            width: 32px;
            height: 32px;
            min-width: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.8);
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            flex-shrink: 0;
          }

          .chatbox-submit-btn:hover {
            background: rgba(90, 90, 93, 0.9);
            border-color: rgba(255, 255, 255, 0.2);
            color: rgba(255, 255, 255, 1);
            transform: scale(1.05);
          }

          .chatbox-submit-btn:active {
            transform: scale(0.95);
          }

          .chatbox-submit-btn svg {
            transition: transform 0.2s ease;
            width: 16px;
            height: 16px;
          }

          .chatbox-submit-btn:hover svg {
            transform: translateX(1px);
          }

          @keyframes slideUpFade {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }

          /* City Info Header */
          .city-info-header {
            padding: 14px 16px 12px 16px;
            background: rgba(0, 0, 0, 0.1);
          }

          .city-header-top {
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .city-title {
            color: white;
            font-size: 1rem;
            font-weight: 600;
            margin: 0;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
            letter-spacing: -0.01em;
            flex: 1;
          }

          .city-actions {
            display: flex;
            gap: 6px;
            align-items: center;
          }

          .city-action-btn {
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }

          .city-action-btn:hover {
            transform: scale(1.08);
          }

          .city-action-btn.add-btn:hover {
            background: rgba(76, 175, 80, 0.25);
            border-color: rgba(76, 175, 80, 0.4);
            box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
          }

          .city-action-btn.remove-btn:hover {
            background: rgba(244, 67, 54, 0.25);
            border-color: rgba(244, 67, 54, 0.4);
            box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
          }

          .city-action-btn:active {
            transform: scale(0.95);
          }

          .city-location {
            color: rgba(255, 255, 255, 0.65);
            font-size: 0.7rem;
            margin: 0 0 7px 0;
            line-height: 1.3;
          }

          .city-tags {
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
          }

          .city-tag-item {
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 0.65rem;
            font-weight: 500;
            border: 1px solid rgba(255, 255, 255, 0.15);
            transition: all 0.2s ease;
          }

          .city-tag-item.statues {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.8);
            border-color: rgba(255, 255, 255, 0.15);
          }

          .city-tag-item.fountain {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.8);
            border-color: rgba(255, 255, 255, 0.15);
          }

          /* Activities List */
          .city-activities-list {
            padding: 0;
          }

          .enhanced-activity-item {
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            background: rgba(0, 0, 0, 0.05);
            position: relative;
          }

          .enhanced-activity-item:hover {
            background: rgba(255, 255, 255, 0.05);
          }

          /* Activity Main Content */
          .activity-main-content {
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
          }

          .activity-left {
            display: flex;
            gap: 10px;
            align-items: flex-start;
            flex: 1;
          }

          .activity-actions {
            display: flex;
            gap: 6px;
            align-items: center;
            flex-shrink: 0;
          }

          .activity-action-btn {
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }

          .activity-action-btn:hover {
            transform: scale(1.08);
          }

          .activity-action-btn.add-btn:hover {
            background: rgba(76, 175, 80, 0.25);
            border-color: rgba(76, 175, 80, 0.4);
            box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
          }

          .activity-action-btn.remove-btn:hover {
            background: rgba(244, 67, 54, 0.25);
            border-color: rgba(244, 67, 54, 0.4);
            box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
          }

          .activity-action-btn:active {
            transform: scale(0.95);
          }

          .activity-number-badge {
            background: rgba(255, 255, 255, 0.15);
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            font-weight: 600;
            flex-shrink: 0;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
          }

          .activity-type-icon {
            font-size: 1.1rem;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
            flex-shrink: 0;
          }

          .activity-details {
            flex: 1;
          }

          .activity-title {
            color: white;
            font-size: 0.85rem;
            font-weight: 600;
            margin: 0 0 4px 0;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
            line-height: 1.3;
          }

          .activity-subtitle {
            color: rgba(255, 255, 255, 0.65);
            font-size: 0.75rem;
            line-height: 1.5;
            margin: 0;
          }

          .activity-right {
            flex-shrink: 0;
            margin-left: 10px;
          }

          .activity-badge {
            display: inline-block;
            background: rgba(255, 245, 157, 0.2);
            color: #fff59d;
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 0.65rem;
            font-weight: 600;
            border: 1px solid rgba(255, 245, 157, 0.3);
          }

          /* Additional Spot */
          .additional-spot {
            padding: 10px 14px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(0, 0, 0, 0.1);
          }

          .spot-badge {
            margin-bottom: 8px;
          }

          .spot-time {
            display: inline-block;
            background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
            color: white;
            padding: 4px 10px;
            border-radius: 14px;
            font-size: 0.7rem;
            font-weight: 700;
            box-shadow: 0 2px 6px rgba(255, 107, 107, 0.3);
          }

          .spot-info {
            display: flex;
            align-items: center;
          }

          .spot-left {
            display: flex;
            gap: 10px;
            align-items: flex-start;
          }

          .spot-icon {
            font-size: 1rem;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
          }

          .spot-details {
            flex: 1;
          }

          .spot-title {
            color: white;
            font-size: 0.85rem;
            font-weight: 600;
            margin: 0 0 2px 0;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
          }

          .spot-subtitle {
            color: rgba(255, 255, 255, 0.65);
            font-size: 0.72rem;
            margin: 0;
          }

          .flashcards-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding: 0 4px;
          }

          .header-content h3 {
            color: white;
            font-size: 1.15rem;
            margin: 0;
            font-weight: 500;
            letter-spacing: -0.02em;
          }

          .toggle-btn {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            padding: 6px;
            border-radius: 8px;
            transition: all 0.2s ease;
            backdrop-filter: blur(8px);
          }

          .toggle-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border-color: rgba(255, 255, 255, 0.2);
            transform: scale(1.02);
          }

          .flashcards-container {
            flex: 1;
            /* ensure container fits active card + tick button + gap */
            min-height: 430px;
            max-height: calc(100vh - 130px);
            border-radius: 12px;
            overflow: hidden;
            position: relative;
            margin: 0;
            padding: 0;
            contain: layout style;
            display: flex;
            align-items: center;
          }

          .flashcards-scroll-wrapper {
            display: flex;
            gap: 18px;
            width: 100%;
            height: 100%;
            overflow-x: hidden;
            overflow-y: hidden;
            scroll-behavior: smooth;
            scrollbar-width: none;
            scrollbar-color: transparent transparent;
            padding: 20px calc(50% - 140px);
            -webkit-overflow-scrolling: touch;
            scrollbar-gutter: stable;
            will-change: scroll-position, transform;
            align-items: center;
            scroll-snap-type: none;
            position: relative;
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            /* Prevent browser navigation gestures */
            overscroll-behavior: none;
            overscroll-behavior-x: none;
            overscroll-behavior-y: none;
            -webkit-overscroll-behavior: none;
            -webkit-overscroll-behavior-x: none;
            -webkit-overscroll-behavior-y: none;
          }

          .flashcards-scroll-wrapper::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
          }

          .flashcards-scroll-wrapper::-webkit-scrollbar-track {
            display: none;
          }

          .flashcards-scroll-wrapper::-webkit-scrollbar-thumb {
            display: none;
          }

          .flashcards-scroll-wrapper::-webkit-scrollbar-corner {
            display: none;
          }

          .flashcard-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            flex-shrink: 0;
          }

          .flashcard-slide {
            position: relative;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: local;
            background-color: #0a0a0a;
            transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
            overflow: visible;
            border-radius: 16px;
            flex-shrink: 0;
            isolation: isolate;
            contain: layout style;
            transform-origin: center;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
            border: 1px solid rgba(255, 255, 255, 0.08);
            scroll-snap-align: center;
            will-change: transform, opacity, filter;
          }

          .flashcard-slide::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: inherit;
            background-size: inherit;
            background-position: inherit;
            background-repeat: inherit;
            border-radius: 16px;
            overflow: hidden;
            z-index: -1;
          }

          /* Selected flashcard border */
          .flashcard-slide.selected {
            border: 3px solid rgba(76, 175, 80, 0.8);
            box-shadow: 0 0 20px rgba(76, 175, 80, 0.4);
          }

          /* Tick button - positioned at top-right corner with 1/4th inside */
          .flashcard-select-btn {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.4);
            border: 1.5px solid rgba(255, 255, 255, 0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(8px);
            flex-shrink: 0;
            position: absolute;
            top: -16px;
            right: -16px;
            z-index: 10;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          }

          .flashcard-select-btn:hover {
            background: rgba(0, 0, 0, 0.6);
            border-color: rgba(255, 255, 255, 0.25);
            transform: scale(1.05);
            box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
          }

          .flashcard-select-btn:active {
            transform: scale(0.98);
          }

          .flashcard-select-btn svg {
            width: 14px;
            height: 14px;
            opacity: 0.4;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            stroke-width: 2.5;
          }

          .flashcard-select-btn.selected {
            background: rgba(34, 197, 94, 0.95);
            border-color: rgba(34, 197, 94, 1);
            box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
          }

          .flashcard-select-btn.selected svg {
            opacity: 1;
            stroke: white;
            stroke-width: 3;
          }

          .flashcard-select-btn.selected:hover {
            background: rgba(34, 197, 94, 1);
            transform: scale(1.05);
            box-shadow: 0 3px 12px rgba(34, 197, 94, 0.4);
          }

          /* Inactive cards - smaller and slightly blurred */
          .flashcard-slide.inactive {
            width: 180px;
            height: 280px;
            filter: blur(0.5px) brightness(0.85);
            transform: scale(0.88);
            opacity: 0.7;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
            cursor: default;
            pointer-events: none;
            transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .flashcard-slide.inactive:hover {
            filter: blur(0.5px) brightness(0.85);
            opacity: 0.7;
            transform: scale(0.88);
          }

          .flashcard-slide.inactive .slide-content {
            padding: 8px 6px;
          }

          .flashcard-slide.inactive .slide-title-top {
            opacity: 1;
            transform: translateY(45px);
          }

          .flashcard-slide.inactive .slide-title-top .trip-name {
            font-size: 0.75rem;
            line-height: 1.1;
          }

          .flashcard-slide.inactive .slide-info-bottom {
            opacity: 1;
            transform: translateY(0);
          }

          .flashcard-slide.inactive .info-card {
            padding: 4px 3px;
            border-radius: 6px;
            gap: 3px;
          }

          .flashcard-slide.inactive .info-icon {
            width: 16px;
            height: 16px;
          }

          .flashcard-slide.inactive .info-icon svg {
            width: 8px;
            height: 8px;
          }

          .flashcard-slide.inactive .info-label {
            font-size: 0.45rem;
          }

          .flashcard-slide.inactive .info-value {
            font-size: 0.55rem;
          }

          /* Active/center card - larger and clear */
          .flashcard-slide.active {
            width: 260px;
            height: 340px;
            filter: none;
            transform: scale(1);
            opacity: 1;
            z-index: 10;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6),
              0 0 0 1px rgba(255, 255, 255, 0.15);
            cursor: pointer;
            pointer-events: auto;
            transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .flashcard-slide.active:hover {
            transform: scale(1.02);
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7),
              0 0 0 1px rgba(255, 255, 255, 0.2);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
          }

          .flashcard-slide.active .slide-title-top {
            transform: translateY(0);
            transition: all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .flashcard-slide.active .slide-title-top .trip-name {
            font-size: 1.1rem;
            transition: all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .flashcard-slide.active .slide-info-bottom {
            opacity: 1;
            transform: translateY(0);
            transition: all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s;
          }

          .slide-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              180deg,
              rgba(0, 0, 0, 0.2) 0%,
              rgba(0, 0, 0, 0.05) 30%,
              rgba(0, 0, 0, 0.05) 70%,
              rgba(0, 0, 0, 0.8) 100%
            );
            transition: background 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            border-radius: 16px;
            overflow: hidden;
          }

          .flashcard-slide:hover .slide-overlay {
            background: linear-gradient(
              180deg,
              rgba(0, 0, 0, 0.1) 0%,
              rgba(0, 0, 0, 0.02) 30%,
              rgba(0, 0, 0, 0.02) 70%,
              rgba(0, 0, 0, 0.7) 100%
            );
          }

          .slide-content {
            position: relative;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 14px 12px 12px 12px;
            z-index: 2;
            gap: 8px;
          }

          /* Title at top */
          .slide-title-top {
            text-align: left;
            padding-top: 4px;
            opacity: 1;
            transform: translateY(0);
            transition: all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
            flex-shrink: 0;
          }

          .slide-title-top .trip-name {
            color: white;
            font-size: 1.1rem;
            font-weight: 600;
            text-shadow: 0 2px 12px rgba(0, 0, 0, 0.9);
            letter-spacing: -0.02em;
            line-height: 1.2;
            margin: 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-height: 2.8em;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }

          /* Info cards at bottom */
          .slide-info-bottom {
            display: flex;
            flex-direction: column;
            gap: 5px;
            opacity: 1;
            transform: translateY(0);
            transition: all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s;
            flex-shrink: 0;
          }

          .info-row {
            display: flex;
            gap: 5px;
          }

          .info-card {
            flex: 1;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 7px;
            padding: 7px 5px;
            display: flex;
            gap: 5px;
            align-items: flex-start;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .info-card.full-width {
            flex: 1 1 100%;
          }

          .info-card:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.25);
            transform: translateY(-1px);
          }

          .info-icon {
            flex-shrink: 0;
            width: 22px;
            height: 22px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }

          .info-icon svg {
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
            width: 11px;
            height: 11px;
          }

          .info-text {
            display: flex;
            flex-direction: column;
            gap: 1px;
            flex: 1;
          }

          .info-label {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.65rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
          }

          .info-value {
            color: white;
            font-size: 0.8rem;
            font-weight: 600;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
            line-height: 1.2;
          }

          /* Animations */
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(50px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes slideUpFadeIn {
            0% {
              opacity: 0;
              transform: translateY(40px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .flashcards-widget {
              padding: 10px 54px 16px 54px;
              margin: 6px auto;
              width: 100%;
              max-width: calc(100vw - 32px);
              height: calc(100% - 24px);
              max-height: calc(100vh - 120px);
            }

            .flashcards-container {
              min-height: 420px;
              max-height: calc(100vh - 180px);
              margin: 0;
              padding: 0;
            }

            .flashcards-header {
              padding: 0 2px;
              margin-bottom: 16px;
            }

            .flashcards-scroll-wrapper {
              padding: 25px calc(50% - 130px);
              gap: 16px;
            }

            .header-content h3 {
              font-size: 1.2rem;
            }

            .flashcard-slide.inactive {
              width: 170px;
              height: 270px;
              filter: blur(0.5px) brightness(0.85);
              transform: scale(0.88);
              opacity: 0.75;
            }

            .flashcard-slide.active {
              width: 230px;
              height: 320px;
            }

            .flashcard-select-btn {
              width: 30px;
              height: 30px;
              top: -15px;
              right: -15px;
            }

            .flashcard-select-btn svg {
              width: 13px;
              height: 13px;
            }

            .flashcard-slide.inactive .slide-content {
              padding: 10px 8px;
            }

            .flashcard-slide.inactive .slide-title-top {
              opacity: 1;
              transform: translateY(50px);
            }

            .flashcard-slide.inactive .slide-title-top .trip-name {
              font-size: 0.75rem;
              line-height: 1.1;
            }

            .flashcard-slide.inactive .slide-info-bottom {
              opacity: 1;
              transform: translateY(0);
            }

            .flashcard-slide.inactive .info-card {
              padding: 4px 3px;
              border-radius: 6px;
              gap: 3px;
            }

            .flashcard-slide.inactive .info-icon {
              width: 16px;
              height: 16px;
            }

            .flashcard-slide.inactive .info-icon svg {
              width: 8px;
              height: 8px;
            }

            .flashcard-slide.inactive .info-label {
              font-size: 0.48rem;
            }

            .flashcard-slide.inactive .info-value {
              font-size: 0.58rem;
            }

            .flashcard-slide.active .slide-title-top {
              transform: translateY(0);
            }

            .flashcard-slide.active .slide-title-top .trip-name {
              font-size: 1.1rem;
            }

            .slide-title-top .trip-name {
              font-size: 1.2rem;
            }

            .info-card {
              padding: 7px 6px;
            }

            .info-icon {
              width: 22px;
              height: 22px;
            }

            .info-icon svg {
              width: 11px;
              height: 11px;
            }

            .info-label {
              font-size: 0.62rem;
            }

            .info-value {
              font-size: 0.75rem;
            }

            .modal-backdrop {
              padding: 75px 16px 90px 16px;
              overflow-y: auto;
            }

            .modal-container {
              max-width: 95vw;
              max-height: calc(100vh - 165px);
              margin: 0;
              border-radius: 14px;
            }

            .modal-content {
              padding: 20px 16px;
            }

            .modal-title {
              font-size: 1.35rem;
              margin-bottom: 14px;
            }

            .modal-meta {
              grid-template-columns: 1fr;
              gap: 8px;
            }

            .meta-card {
              padding: 10px 12px;
            }

            .modal-close-btn {
              top: 82px;
              right: 20px;
              width: 44px;
              height: 44px;
            }

            .modal-close-btn svg {
              width: 16px;
              height: 16px;
            }

            .city-image-container {
              height: 150px;
            }

            .activity-main-content {
              padding: 11px 13px;
            }

            .activity-action-btn {
              width: 26px;
              height: 26px;
            }

            .activity-action-btn svg {
              width: 13px;
              height: 13px;
            }

            .activity-title {
              font-size: 0.82rem;
            }

            .activity-subtitle {
              font-size: 0.71rem;
            }

            .itinerary-title {
              font-size: 1rem;
              margin-bottom: 10px;
            }

            .modal-close-btn {
              top: 76px;
              right: 16px;
              width: 44px;
              height: 44px;
            }

            .modal-close-btn svg {
              width: 18px;
              height: 18px;
            }

            .chatbox-container {
              bottom: 14px;
              width: 210px;
              height: 44px;
              padding: 7px;
              gap: 6px;
              transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.3s ease;
            }

            .chatbox-container:focus-within {
              width: 320px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
            }

            .chatbox-input {
              padding: 0 6px;
              font-size: 0.82rem;
              height: 30px;
            }

            .chatbox-submit-btn {
              width: 30px;
              height: 30px;
              min-width: 30px;
            }

            .chatbox-submit-btn svg {
              width: 15px;
              height: 15px;
            }

            .nav-arrow {
              width: 40px;
              height: 40px;
              left: 8px !important;
            }

            .nav-left {
              left: 8px !important;
            }

            .nav-right {
              right: 8px !important;
              left: auto !important;
            }
          }

          @media (max-width: 480px) {
            .flashcards-widget {
              padding: 8px 48px 12px 48px;
              margin: 4px auto;
              width: 100%;
              max-width: calc(100vw - 20px);
              height: calc(100% - 16px);
              max-height: calc(100vh - 100px);
            }

            .flashcards-container {
              min-height: 360px;
              max-height: calc(100vh - 160px);
              margin: 0;
              padding: 0;
            }

            .flashcards-header {
              padding: 0 1px;
              margin-bottom: 12px;
            }

            .flashcards-scroll-wrapper {
              padding: 25px calc(50% - 110px);
              gap: 12px;
            }

            .flashcard-slide.inactive {
              width: 150px;
              height: 230px;
              filter: blur(0.5px) brightness(0.85);
              transform: scale(0.88);
              opacity: 0.75;
            }

            .flashcard-slide.active {
              width: 190px;
              height: 270px;
            }

            .flashcard-select-btn {
              width: 28px;
              height: 28px;
              top: -14px;
              right: -14px;
            }

            .flashcard-select-btn svg {
              width: 12px;
              height: 12px;
            }

            .flashcard-slide.inactive .slide-content {
              padding: 8px 6px;
            }

            .flashcard-slide.inactive .slide-title-top {
              opacity: 1;
              transform: translateY(40px);
            }

            .flashcard-slide.inactive .slide-title-top .trip-name {
              font-size: 0.7rem;
              line-height: 1.05;
            }

            .flashcard-slide.inactive .slide-info-bottom {
              opacity: 1;
              transform: translateY(0);
            }

            .flashcard-slide.inactive .info-card {
              padding: 3px 2px;
              border-radius: 5px;
              gap: 2px;
            }

            .flashcard-slide.inactive .info-icon {
              width: 14px;
              height: 14px;
            }

            .flashcard-slide.inactive .info-icon svg {
              width: 7px;
              height: 7px;
            }

            .flashcard-slide.inactive .info-label {
              font-size: 0.42rem;
            }

            .flashcard-slide.inactive .info-value {
              font-size: 0.52rem;
            }

            .flashcard-slide.active .slide-title-top {
              transform: translateY(0);
            }

            .flashcard-slide.active .slide-title-top .trip-name {
              font-size: 1rem;
            }

            .slide-content {
              padding: 14px 12px;
            }

            .flashcard-slide.active .slide-content {
              padding: 14px 12px 12px 12px;
            }

            .slide-title-top .trip-name {
              font-size: 1rem;
            }

            .info-card {
              padding: 6px 5px;
            }

            .info-icon {
              width: 20px;
              height: 20px;
            }

            .info-icon svg {
              width: 10px;
              height: 10px;
            }

            .info-label {
              font-size: 0.58rem;
            }

            .info-value {
              font-size: 0.7rem;
            }

            .modal-backdrop {
              padding: 70px 12px 85px 12px;
              overflow-y: auto;
            }

            .modal-container {
              max-width: 98vw;
              max-height: calc(100vh - 155px);
              margin: 0;
              border-radius: 12px;
            }

            .modal-content {
              padding: 18px 14px;
            }

            .modal-title {
              font-size: 1.3rem;
              margin-bottom: 12px;
            }

            .itinerary-title {
              font-size: 1.05rem;
              margin-bottom: 12px;
            }

            .modal-close-btn {
              top: 78px;
              right: 16px;
              width: 42px;
              height: 42px;
            }

            .modal-close-btn svg {
              width: 16px;
              height: 16px;
            }

            .modal-day-card {
              border-radius: 12px;
            }

            .day-badge {
              padding: 8px;
            }

            .day-number {
              font-size: 0.85rem;
            }

            .day-content {
              padding: 12px;
            }

            .section-title {
              font-size: 0.85rem;
              margin-bottom: 8px;
            }

            .city-image-container {
              height: 140px;
            }

            .city-info-header {
              padding: 10px 12px 8px 12px;
            }

            .city-title {
              font-size: 0.9rem;
            }

            .city-location {
              font-size: 0.7rem;
            }

            .city-tag-item {
              font-size: 0.65rem;
              padding: 3px 8px;
            }

            .activity-main-content {
              padding: 10px 12px;
            }

            .activity-action-btn {
              width: 24px;
              height: 24px;
            }

            .activity-action-btn svg {
              width: 12px;
              height: 12px;
            }

            .activity-number-badge {
              width: 20px;
              height: 20px;
              font-size: 0.65rem;
            }

            .activity-type-icon {
              font-size: 0.9rem;
            }

            .activity-title {
              font-size: 0.8rem;
            }

            .activity-subtitle {
              font-size: 0.7rem;
            }

            .activity-badge {
              font-size: 0.6rem;
              padding: 2px 6px;
            }

            .spot-time {
              font-size: 0.65rem;
              padding: 3px 8px;
            }

            .spot-title {
              font-size: 0.8rem;
            }

            .spot-subtitle {
              font-size: 0.7rem;
            }

            .days-container {
              gap: 10px;
            }

            .chatbox-container {
              bottom: 12px;
              width: 200px;
              height: 42px;
              padding: 6px;
              gap: 6px;
              transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.3s ease;
            }

            .chatbox-container:focus-within {
              width: 290px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
            }

            .chatbox-input {
              padding: 0 6px;
              font-size: 0.78rem;
              height: 30px;
            }

            .chatbox-submit-btn {
              width: 30px;
              height: 30px;
              min-width: 30px;
            }

            .chatbox-submit-btn svg {
              width: 14px;
              height: 14px;
            }

            .nav-arrow {
              width: 36px;
              height: 36px;
            }

            .nav-left {
              left: 4px !important;
            }

            .nav-right {
              right: 4px !important;
              left: auto !important;
            }

            .nav-arrow svg {
              width: 18px;
              height: 18px;
            }
          }

          .nav-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.18);
            color: white;
            border: 1.5px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 100;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4),
              inset 0 1px 1px rgba(255, 255, 255, 0.2);
          }

          .nav-arrow:hover {
            background: rgba(255, 255, 255, 0.28);
            border-color: rgba(255, 255, 255, 0.45);
            transform: translateY(-50%) scale(1.08);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5),
              inset 0 1px 2px rgba(255, 255, 255, 0.3);
          }

          .nav-arrow:active {
            transform: translateY(-50%) scale(0.95);
          }

          .nav-arrow svg {
            filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6));
            opacity: 0.95;
          }

          .nav-left {
            left: 12px;
          }

          .nav-right {
            right: 12px;
          }

          /* Suggestion Panel Styles */
          .suggestion-panel {
            position: fixed;
            top: 150px;
            right: 32px;
            width: 340px;
            max-height: calc(100vh - 230px);
            background: rgba(18, 18, 20, 0.95);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            z-index: 10001;
            display: flex;
            flex-direction: column;
            animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            overflow: hidden;
          }

          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .suggestion-header {
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .suggestion-header h3 {
            color: white;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0;
          }

          .panel-close-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 6px;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .panel-close-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: scale(1.05);
          }

          .suggestion-search {
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            position: relative;
          }

          .search-icon {
            position: absolute;
            left: 32px;
            top: 50%;
            transform: translateY(-50%);
            color: rgba(255, 255, 255, 0.4);
          }

          .suggestion-search-input {
            width: 100%;
            padding: 10px 12px 10px 36px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 8px;
            color: white;
            font-size: 0.9rem;
            outline: none;
            transition: all 0.3s ease;
          }

          .suggestion-search-input::placeholder {
            color: rgba(255, 255, 255, 0.4);
          }

          .suggestion-search-input:focus {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.2);
          }

          .suggestion-content {
            flex: 1;
            overflow-y: auto;
            padding: 16px 20px;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
          }

          .suggestion-content::-webkit-scrollbar {
            width: 6px;
          }

          .suggestion-content::-webkit-scrollbar-track {
            background: transparent;
          }

          .suggestion-content::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
          }

          .suggestion-section {
            margin-bottom: 24px;
          }

          .suggestion-section:last-child {
            margin-bottom: 0;
          }

          .suggestion-section-title {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 12px 0;
          }

          .suggestion-cards {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .suggestion-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            cursor: pointer;
          }

          .suggestion-card:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.15);
            transform: translateX(4px);
          }

          .suggestion-card-icon {
            font-size: 1.3rem;
            flex-shrink: 0;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
          }

          .suggestion-card-content {
            flex: 1;
          }

          .suggestion-card-title {
            color: white;
            font-size: 0.85rem;
            font-weight: 600;
            margin: 0 0 2px 0;
          }

          .suggestion-card-desc {
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.7rem;
            margin: 0;
          }

          .suggestion-add-btn {
            background: rgba(76, 175, 80, 0.15);
            border: 1px solid rgba(76, 175, 80, 0.3);
            border-radius: 6px;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgb(129, 199, 132);
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            flex-shrink: 0;
          }

          .suggestion-add-btn:hover {
            background: rgba(76, 175, 80, 0.25);
            border-color: rgba(76, 175, 80, 0.5);
            transform: scale(1.1);
          }

          .suggestion-add-btn:active {
            transform: scale(0.95);
          }

          @media (max-width: 1200px) {
            .suggestion-panel {
              right: 20px;
              width: 320px;
              top: 150px;
            }
          }

          @media (max-width: 768px) {
            .suggestion-panel {
              right: 16px;
              left: 16px;
              width: auto;
              max-height: calc(100vh - 230px);
              top: 150px;
            }
          }
        `}</style>
      </>
    );
  }
);

FlashcardsWidget.displayName = "FlashcardsWidget";

export default FlashcardsWidget;
