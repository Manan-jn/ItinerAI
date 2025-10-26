import { TripInfo } from "./types";

// Card size used for scroll calculations (slide width + horizontal gap)
export const CARD_WIDTH = 280;

/**
 * Build an extended trips array for seamless cyclic scrolling.
 * We prepend and append multiple cards to create a truly seamless experience
 * where users can always see the next/previous cards in the cycle.
 */
export const buildExtendedTrips = (trips: TripInfo[]): TripInfo[] => {
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

