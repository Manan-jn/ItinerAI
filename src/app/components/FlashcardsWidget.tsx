"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  extractImageUrlsFromPlacesData,
  preloadImages,
  getCachedImage,
} from "../utils/imageCache";
// Component imports
import { FlashcardSlide } from "./flashcards/FlashcardSlide";
import { TripDetailsModal } from "./flashcards/TripDetailsModal";
import { TripExpandedView } from "./flashcards/TripExpandedView";
import { PhotoGallery } from "./flashcards/PhotoGallery";
import { SuggestionPanel } from "./flashcards/SuggestionPanel";
import { FlashcardsStyles } from "./flashcards/FlashcardsStyles";
// Type imports
import {
  TripInfo,
  PhotoGalleryState,
  FlashcardsWidgetProps,
  FlashcardsWidgetRef,
} from "./flashcards/types";
// Helper imports
import { isValidImageUrl, getTripImage } from "./flashcards/imageHelpers";
import { buildExtendedTrips } from "./flashcards/scrollHelpers";
// Import trip data from final_response.json
import finalResponseData from "../../../final_response.json";

// Extract trips from the imported data
const tripsData: TripInfo[] = finalResponseData.message.trips.map(
  (trip: any) => ({
    ...trip,
    image: getTripImage(trip),
  })
);

const FlashcardsWidget = forwardRef<FlashcardsWidgetRef, FlashcardsWidgetProps>(
  (
    {
      isVisible,
      onToggle,
      trips = tripsData,
      rightPanelCollapsed = false,
      onTripSelect,
      isSidebarCollapsed = false,
    },
    ref
  ) => {
    // Make trips mutable with state
    const [tripsState, setTripsState] = useState<TripInfo[]>(trips);
    const [activeSlide, setActiveSlide] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [photoGallery, setPhotoGallery] = useState<PhotoGalleryState | null>(
      null
    );
    const [suggestionPanelOpen, setSuggestionPanelOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCard, setSelectedCard] = useState<number | null>(null);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      clearSelection: () => {
        setSelectedCard(null);
      },
    }));

    // Handler to update trip data when activities are added/removed
    // Use useCallback to maintain stable reference and prevent infinite loops
    const handleTripUpdate = useCallback(
      (updatedTrip: TripInfo) => {
        setTripsState((prevTrips) =>
          prevTrips.map((trip, idx) =>
            idx === activeSlide ? updatedTrip : trip
          )
        );
        console.log(
          "Trip updated in FlashcardsWidget:",
          updatedTrip.trip_title
        );

        // Also notify parent component about the update
        if (onTripSelect && activeSlide !== null) {
          console.log("Notifying parent of trip update via onTripSelect");
          onTripSelect(updatedTrip);
        }
      },
      [activeSlide, onTripSelect]
    );

    // Image preloading states
    const [isLoadingImages, setIsLoadingImages] = useState(true);
    const [cachedImageUrls, setCachedImageUrls] = useState<Map<string, string>>(
      new Map()
    );

    /**
     * Index of the centred slide **within the extended array** (includes clones).
     * We keep this separate from the real index to simplify distance calculations.
     */
    const numClones = Math.min(2, tripsState.length);
    const [centerExtendedIdx, setCenterExtendedIdx] = useState(numClones); // Start at first real card

    // Derived real index for consumers (modal, click etc.)
    const centerCardIndex =
      (centerExtendedIdx - numClones + tripsState.length) % tripsState.length;

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
        return tripsState;
      }

      return tripsState.map((trip) => ({
        ...trip,
        image: getTripImage(trip, cachedImageUrls),
      }));
    }, [tripsState, cachedImageUrls]);

    // Memoised extended trips to avoid rebuilding on every render
    const extendedTrips = React.useMemo(
      () => buildExtendedTrips(tripsWithCachedImages),
      [tripsWithCachedImages]
    );

    // Debug: Log the trips data to ensure images are mapped correctly
    React.useEffect(() => {
      console.log("FlashcardsWidget trips data with images from JSON:");
      tripsState.forEach((trip, index) => {
        // Check both new trip_route structure and legacy day_wise_plan structure
        const rawPhotoFromRoute = trip.trip_route?.[0]?.photos?.[0];
        const rawPhotoFromDayPlan =
          trip.day_wise_plan?.[0]?.cities?.[0]?.photos?.[0];
        const rawPhoto = rawPhotoFromRoute || rawPhotoFromDayPlan;
        const isFromJson = rawPhoto && isValidImageUrl(rawPhoto);
        const isGooglePlaces =
          rawPhoto &&
          rawPhoto.includes("maps.googleapis.com/maps/api/place/photo");

        console.log(`Trip ${index + 1}: ${trip.trip_title}`);
        console.log(`  - JSON photo URL: ${rawPhoto || "None"}`);
        console.log(`  - Is Google Places photo: ${isGooglePlaces}`);
        console.log(`  - Using image: ${trip.image}`);
        console.log(
          `  - Source: ${
            isFromJson
              ? isGooglePlaces
                ? "Google Places API"
                : "Direct URL"
              : "Theme fallback"
          }`
        );
        console.log(
          `  - Themes: ${
            trip.theme?.join(", ") || trip.themes?.join(", ") || "None"
          }`
        );
      });
    }, [tripsState]);

    // Preload all images from final_response.json on component mount
    React.useEffect(() => {
      const preloadAllImages = async () => {
        try {
          console.log("Starting image preloading...");
          setIsLoadingImages(true);

          // Extract all image URLs from final_response.json
          const imageUrls = extractImageUrlsFromPlacesData(finalResponseData);
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
      const lastRealIdx = numClones + tripsState.length - 1;

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
      const realIdx =
        (idxExt - numClones + tripsState.length) % tripsState.length;
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
      const realIdx =
        (idxExt - numClones + tripsState.length) % tripsState.length;
      // Toggle selection: if already selected, deselect; otherwise select
      const newSelectedCard = selectedCard === realIdx ? null : realIdx;
      setSelectedCard(newSelectedCard);

      // Notify parent component about trip selection
      if (onTripSelect) {
        onTripSelect(
          newSelectedCard !== null ? tripsState[newSelectedCard] : null
        );
      }
    };

    const handleModalBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleCloseModal();
      }
    };

    const handlePhotoClick = (photos: string[], index: number = 0) => {
      // Filter and process photos (including Google Places photos)
      const processedPhotos = photos
        .filter((photo) => isValidImageUrl(photo))
        .map((photo) => {
          // Handle Google Places photos
          if (photo.includes("maps.googleapis.com/maps/api/place/photo")) {
            try {
              const urlObj = new URL(photo);
              const photoReference = urlObj.searchParams.get("photoreference");
              if (photoReference) {
                return `/api/place-photo?photoreference=${photoReference}&maxwidth=800`;
              }
            } catch (error) {
              console.warn("Error processing Google Places photo URL:", error);
            }
          }

          // Use cached versions if available for regular URLs
          if (cachedImageUrls.has(photo)) {
            return cachedImageUrls.get(photo)!;
          }

          // For Google Places photos that weren't in the cache, convert to proxy URL
          if (photo.includes("maps.googleapis.com/maps/api/place/photo")) {
            try {
              const urlObj = new URL(photo);
              const photoReference = urlObj.searchParams.get("photoreference");
              if (photoReference) {
                const proxyUrl = `/api/place-photo?photoreference=${photoReference}&maxwidth=800`;
                // Check if proxy URL is cached
                if (cachedImageUrls.has(proxyUrl)) {
                  return cachedImageUrls.get(proxyUrl)!;
                }
                return proxyUrl;
              }
            } catch (error) {
              console.warn("Error processing Google Places photo URL:", error);
            }
          }

          return photo;
        });

      // If no valid photos, don't open gallery
      if (processedPhotos.length === 0) {
        console.warn("No valid photos to display in gallery");
        return;
      }

      setPhotoGallery({
        photos: processedPhotos,
        currentIndex: Math.min(index, processedPhotos.length - 1),
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

    const handleSelectPhoto = (index: number) => {
      if (photoGallery) {
        setPhotoGallery({ ...photoGallery, currentIndex: index });
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
                  (index - numClones + tripsState.length) % tripsState.length;
                const isSelected = selectedCard === realIdx;

                return (
                  <FlashcardSlide
                    key={`slide-wrapper-${index}`}
                    trip={trip}
                    isCenter={isCenter}
                    distance={distance}
                    isSelected={isSelected}
                    onSlideClick={() => handleSlideClick(index)}
                    onSelectCard={(e) => handleSelectCard(index, e)}
                  />
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
          <TripExpandedView
            trip={tripsState[activeSlide] as any}
            onClose={handleCloseModal}
            onTripUpdate={handleTripUpdate}
            isSidebarCollapsed={isSidebarCollapsed}
          />
        )}

        {/* Suggestion Panel */}
        <SuggestionPanel
          isOpen={suggestionPanelOpen}
          onClose={() => setSuggestionPanelOpen(false)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Photo Gallery Modal */}
        {photoGallery && (
          <PhotoGallery
            photoGallery={photoGallery}
            onClose={handleClosePhotoGallery}
            onNext={handleNextPhoto}
            onPrev={handlePrevPhoto}
            onSelectPhoto={handleSelectPhoto}
          />
        )}

        {/* Styles */}
        <FlashcardsStyles rightPanelCollapsed={rightPanelCollapsed} />
      </>
    );
  }
);

FlashcardsWidget.displayName = "FlashcardsWidget";

export default FlashcardsWidget;
