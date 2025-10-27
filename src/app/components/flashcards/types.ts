// Type definitions for Flashcards Widget

export interface TripInfo {
  trip_title: string;
  no_of_days: number;
  estimated_budget: number;
  best_time_to_visit: string;
  theme?: string[]; // Made optional for backward compatibility
  themes?: string[]; // Alternative field name
  day_wise_plan?: DayPlan[]; // Made optional for new structure
  trip_route?: PlaceInfo[]; // New structure for places
  image?: string;
}

export interface DayPlan {
  day_number: number;
  cities?: CityInfo[]; // Legacy format
  must_do_activities: Activity[];
  conveyance_details?: {
    is_required: boolean;
    travel_timing?: string;
    from_city?: string;
    to_city?: string;
  };
  stay_details?: {
    is_required: boolean;
    city?: string;
    check_in_day?: string;
    check_out_day?: string;
  };
}

export interface CityInfo {
  name: string;
  address: string;
  map_url: string;
  lat: string;
  long: string;
  photos: string[];
  place_id: string;
}

export interface PlaceInfo {
  place_name: string;
  address: string;
  map_url: string;
  lat: string;
  long: string;
  photos: string[];
  place_id: string;
}

export interface Activity {
  type: string;
  category?: string;
  name: string;
  description: string;
}

export interface PhotoGalleryState {
  photos: string[];
  currentIndex: number;
}

export interface FlashcardsWidgetProps {
  isVisible: boolean;
  onToggle: () => void;
  trips?: TripInfo[];
  rightPanelCollapsed?: boolean;
  onTripSelect?: (trip: TripInfo | null) => void;
}

export interface FlashcardsWidgetRef {
  clearSelection: () => void;
}

