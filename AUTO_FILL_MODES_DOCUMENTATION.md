# Auto-Fill Modes Documentation: Conveyance & Stay Components

## Table of Contents
1. [Overview](#overview)
2. [Conveyance Component Auto-Fill Modes](#conveyance-component-auto-fill-modes)
3. [Stay Component Auto-Fill Modes](#stay-component-auto-fill-modes)
4. [Field Population Logic](#field-population-logic)
5. [Key Utility Functions](#key-utility-functions)
6. [Data Flow & API Integration](#data-flow--api-integration)
7. [Examples & Use Cases](#examples--use-cases)

---

## Overview

The conveyance and stay components support multiple auto-fill modes to streamline the user experience when booking travel arrangements. These modes automatically populate fields based on itinerary data and reduce manual input requirements.

### Key Concepts

- **Auto-Fill Mode**: Pre-fills all fields and disables editing, automatically triggers search
- **Partial Auto-Fill Mode**: Pre-fills some fields (FROM, DATE) while allowing user to select others (TO)
- **Manual Mode**: All fields are editable, user must manually trigger search

---

## Conveyance Component Auto-Fill Modes

### Component: `FlightsWidget.tsx`

**Location**: `src/app/components/FlightsWidget.tsx`

### Props Interface

```typescript
interface FlightsWidgetProps {
  isVisible: boolean;
  onToggle: () => void;
  initialFromCity?: string;        // Pre-filled FROM city
  initialToCity?: string;          // Pre-filled TO city
  initialDepartureDate?: string;   // Pre-filled departure date (YYYY-MM-DD)
  autoFillMode?: boolean;          // Full auto-fill mode
  partialAutoFillMode?: boolean;   // Partial auto-fill mode
  onContinue?: (selectedConveyanceData?: TransportOption) => void;
  userId?: string;
  sessionId?: string;
  currentDayNumber?: number;
}
```

### Mode 1: Manual Mode (Default)

**Props**: `autoFillMode = false`, `partialAutoFillMode = false`

**Behavior**:
- All fields (FROM, TO, DATE) are editable
- User must manually click "Smart Search" button
- No automatic search trigger
- Used in standalone `ConveyanceTab` component

**Code Reference**: Lines 1573-1574 in `FlightsWidget.tsx`

```typescript
autoFillMode = false,
partialAutoFillMode = false,
```

### Mode 2: Full Auto-Fill Mode

**Props**: `autoFillMode = true`, `partialAutoFillMode = false`

**Behavior**:
- **FROM field**: Pre-filled and **disabled** (`disabled={autoFillMode || partialAutoFillMode}`)
- **TO field**: Pre-filled and **disabled** (`disabled={autoFillMode}`)
- **DATE field**: Pre-filled and **disabled** (`disabled={autoFillMode || partialAutoFillMode}`)
- **Search button**: Disabled (`disabled={autoFillMode && !partialAutoFillMode}`)
- **Auto-trigger**: Search automatically triggers when widget becomes visible and all fields are ready

**When Used**:
- After date selection from `DateSelectorWidget` → Day 1 conveyance
- After itinerary generation → Next day conveyance (when clicking "Continue" on itinerary)

**Code Reference**: Lines 1662-1686 in `FlightsWidget.tsx`

```typescript
// Auto-trigger search when all fields are ready in auto-fill mode
useEffect(() => {
  if (
    isVisible &&
    autoFillMode &&
    from &&
    to &&
    departureDate &&
    !showResults
  ) {
    console.log("✅ All fields ready for auto-search (full auto-fill):", {
      from,
      to,
      departureDate,
    });

    // Trigger search after a short delay
    const timer = setTimeout(async () => {
      console.log("🔍 Auto-triggering search with pre-filled data...");
      await handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }
}, [isVisible, autoFillMode, from, to, departureDate, showResults]);
```

**Field Population**:
- `from`: Set via `initialFromCity` prop → `setFrom(initialFromCity)` → `setFromCity(initialFromCity)`
- `to`: Set via `initialToCity` prop → `setTo(initialToCity)` → `setToCity(initialToCity)`
- `departureDate`: Set via `initialDepartureDate` prop → `setDepartureDate(initialDepartureDate)`

**Code Reference**: Lines 1608-1626, 1640-1660 in `FlightsWidget.tsx`

### Mode 3: Partial Auto-Fill Mode

**Props**: `autoFillMode = false`, `partialAutoFillMode = true`

**Behavior**:
- **FROM field**: Pre-filled and **disabled** (`disabled={autoFillMode || partialAutoFillMode}`)
- **TO field**: **Editable** (user can select destination)
- **DATE field**: Pre-filled and **disabled** (`disabled={autoFillMode || partialAutoFillMode}`)
- **Search button**: **Enabled** (user must click to search)
- **Auto-trigger**: **Disabled** (commented out in code, lines 1688-1703)

**When Used**:
- **Add Day Flow**: When user adds a new day to itinerary and needs conveyance
- Allows user to select destination city while FROM and DATE are fixed

**Code Reference**: Lines 2308-2310 in `FlightsPageAuthenticated.tsx`

```typescript
setConveyanceFromCity(fromCity);
setConveyanceToCity(""); // Not prefilled - user selects
setAutoFillMode(false); // Not full auto-fill mode
setPartialAutoFillMode(true); // Enable partial auto-fill (FROM and DATE locked, TO selectable)
setInitialDepartureDate(departureDateStr);
```

**Field Population**:
- `from`: Extracted from previous day's `to_city` or `source_point` for new days
- `to`: Empty string (user selects)
- `departureDate`: Calculated based on `trip_date` + `day_number`

---

## Stay Component Auto-Fill Modes

### Component: `StaysWidget.tsx`

**Location**: `src/app/components/StaysWidget.tsx`

### Props Interface

```typescript
interface StaysWidgetProps {
  isVisible: boolean;
  onToggle: () => void;
  initialCity?: string;            // Pre-filled city
  initialCheckInDate?: string;     // Pre-filled check-in date (YYYY-MM-DD)
  initialCheckOutDate?: string;    // Pre-filled check-out date (YYYY-MM-DD)
  autoFillMode?: boolean;          // Full auto-fill mode
  onContinue?: (selectedStayData?: StayOption) => void;
  userId?: string;
  sessionId?: string;
  currentDayNumber?: number;
}
```

### Mode 1: Manual Mode (Default)

**Props**: `autoFillMode = false`

**Behavior**:
- All fields (CITY, CHECK-IN, CHECK-OUT) are editable
- User must manually click "Smart Search" button
- No automatic search trigger

**Code Reference**: Line 623 in `StaysWidget.tsx`

```typescript
autoFillMode = false,
```

### Mode 2: Full Auto-Fill Mode

**Props**: `autoFillMode = true`

**Behavior**:
- **CITY field**: Pre-filled and **disabled** (rendered as read-only div)
- **CHECK-IN field**: Pre-filled and **disabled** (rendered as read-only div)
- **CHECK-OUT field**: Pre-filled and **disabled** (rendered as read-only div)
- **Search button**: **Enabled** (but search auto-triggers)
- **Auto-trigger**: Search automatically triggers when widget becomes visible

**When Used**:
- After conveyance selection → When day requires stay
- In partial auto-fill flow → After selecting conveyance for new day

**Code Reference**: Lines 659-670 in `StaysWidget.tsx`

```typescript
// Auto-search when widget becomes visible in auto-fill mode
useEffect(() => {
  if (isVisible && autoFillMode && !hasAutoSearched && city && checkInDate && checkOutDate && userId) {
    console.log("🏨 StaysWidget is now visible in AUTO-FILL mode. Auto-triggering search...");
    console.log("🏨 Search params:", { city, checkInDate, checkOutDate });
    setHasAutoSearched(true);
    // Trigger search automatically
    handleSearch();
  } else if (isVisible && !autoFillMode) {
    console.log("🏨 StaysWidget is now visible in MANUAL mode. Current city:", city);
  }
}, [isVisible, autoFillMode, hasAutoSearched, city, checkInDate, checkOutDate, userId]);
```

**Field Population**:
- `city`: Extracted from conveyance's `to_city` or from `stay_details.city`
- `checkInDate`: Calculated based on `trip_date` + `check_in_day`
- `checkOutDate`: Calculated based on `trip_date` + `check_out_day`

**Code Reference**: Lines 642-657 in `StaysWidget.tsx`

---

## Field Population Logic

### Conveyance FROM City Population

**Function**: Extracted in `handleRequestNextDay` and `handleAddDay` in `FlightsPageAuthenticated.tsx`

#### For Regular Day Flow (Next Day)

**Location**: Lines 1980-2023 in `FlightsPageAuthenticated.tsx`

```typescript
// Extract FROM city from current day's TO city
const currentDay = selectedTrip.day_wise_plan?.find(
  (d: any) => d.day_number === currentDayNumber
);

let fromCity = "";
if (currentDay?.conveyance_details?.to_city) {
  fromCity = currentDay.conveyance_details.to_city;
} else {
  // Fallback: use last conveyance's to_city
  for (let i = currentDayNumber - 1; i >= 0; i--) {
    const day = selectedTrip.day_wise_plan?.[i];
    if (day?.conveyance_details?.to_city) {
      fromCity = day.conveyance_details.to_city;
      break;
    }
  }
}
```

#### For Day 1 (After Date Selection)

**Location**: Lines 2796-2810 in `FlightsPageAuthenticated.tsx`

```typescript
// Extract from Day 1 conveyance_details
let fromCity = day1.conveyance_details.from_city || "";

// Normalize city name
if (fromCity) {
  const originalFromCity = fromCity;
  fromCity = normalizeCityNameSync(fromCity);
  console.log(`✅ Normalized from_city: "${originalFromCity}" → "${fromCity}"`);
} else {
  fromCity = "Mumbai"; // Default if empty
  console.log("🔄 Empty from_city, defaulting to Mumbai");
}
```

#### For Add Day Flow

**Location**: Lines 2126-2205 in `FlightsPageAuthenticated.tsx`

```typescript
// Find the current city - look for last to_city BEFORE the new day position
let fromCity = "Mumbai"; // Default

// Iterate backwards from currentDayNumber to find the last conveyance with to_city
for (let i = currentDayNumber - 1; i >= 0; i--) {
  const day = selectedTrip.day_wise_plan?.[i];
  if (day?.conveyance_details?.to_city) {
    fromCity = day.conveyance_details.to_city;
    break;
  }
}

// If no to_city found, use trip's source_point if available
if (fromCity === "Mumbai" && selectedTrip.source_point?.place_name) {
  fromCity = selectedTrip.source_point.place_name;
}

// Normalize city name
let normalizedFromCity = fromCity;

// Handle special placeholder values
if (
  fromCity.toLowerCase() === "user_location" ||
  fromCity.toLowerCase() === "user location"
) {
  if (selectedTrip.source_point?.place_name) {
    normalizedFromCity = selectedTrip.source_point.place_name;
  } else {
    normalizedFromCity = "Mumbai";
  }
}

// Capitalize first letter and lowercase the rest
normalizedFromCity =
  normalizedFromCity.charAt(0).toUpperCase() +
  normalizedFromCity.slice(1).toLowerCase();

// Handle special city name mappings
if (normalizedFromCity === "Delhi") {
  normalizedFromCity = "New Delhi";
}

// Verify city is in supported cities list
const supportedCities = ["Mumbai", "Bangalore", "New Delhi", "Agra", "Leh"];
const isSupportedCity = supportedCities.some(
  (city) => city.toLowerCase() === normalizedFromCity.toLowerCase()
);

if (!isSupportedCity) {
  normalizedFromCity = "Mumbai";
}

fromCity = normalizedFromCity;
```

### Conveyance TO City Population

**Function**: Extracted from `day_wise_plan` conveyance_details

#### For Regular Day Flow

**Location**: Lines 1990-1995 in `FlightsPageAuthenticated.tsx`

```typescript
// Extract TO city from next day's conveyance_details
const nextDay = selectedTrip.day_wise_plan?.find(
  (d: any) => d.day_number === nextDayNumber
);

let toCity = "";
if (nextDay?.conveyance_details?.to_city) {
  toCity = nextDay.conveyance_details.to_city;
}
```

#### For Day 1

**Location**: Lines 2812-2818 in `FlightsPageAuthenticated.tsx`

```typescript
let toCity = day1.conveyance_details.to_city || "";

// Normalize city name
if (toCity) {
  const originalToCity = toCity;
  toCity = normalizeCityNameSync(toCity);
  console.log(`✅ Normalized to_city: "${originalToCity}" → "${toCity}"`);
}
```

### Conveyance Departure Date Population

**Function**: Calculated based on `trip_date` and `day_number`

**Location**: Lines 2025-2039 in `FlightsPageAuthenticated.tsx`

```typescript
// Calculate departure date for this day
const tripDate = selectedTrip.trip_date;
if (tripDate) {
  const baseDate = new Date(tripDate);
  const departureDate = new Date(baseDate);
  departureDate.setDate(departureDate.getDate() + (nextDayNumber - 1));
  const departureDateStr = departureDate.toISOString().split("T")[0];

  console.log(`📅 Calculated departure date: ${departureDateStr}`);
  setInitialDepartureDate(departureDateStr);
}
```

### Stay City Population

**Function**: Extracted from conveyance's `to_city` or `stay_details.city`

#### After Conveyance Selection (Partial Auto-Fill Flow)

**Location**: Lines 3053-3066 in `FlightsPageAuthenticated.tsx`

```typescript
// Extract TO city from conveyance selection
const toCity =
  (selectedConveyanceData as any).to_city || conveyanceToCity || "";

// Capitalize city name
let stayCity = toCity;
if (stayCity) {
  stayCity =
    stayCity.charAt(0).toUpperCase() + stayCity.slice(1).toLowerCase();
  if (stayCity === "Delhi") stayCity = "New Delhi";
}

console.log(`🏨 Setting stay city to: ${stayCity}`);
setStayCity(stayCity);
```

#### From Stay Details

**Location**: Lines 3187-3197 in `FlightsPageAuthenticated.tsx`

```typescript
// Extract city for stay
let stayCity = currentDay.stay_details.city || "";

// Capitalize city name
if (stayCity) {
  stayCity =
    stayCity.charAt(0).toUpperCase() + stayCity.slice(1).toLowerCase();
  if (stayCity === "Delhi") stayCity = "New Delhi";
}

setStayCity(stayCity);
```

### Stay Check-In/Check-Out Date Population

**Function**: Calculated based on `trip_date`, `check_in_day`, and `check_out_day`

#### For Partial Auto-Fill Flow (New Day)

**Location**: Lines 3068-3085 in `FlightsPageAuthenticated.tsx`

```typescript
// Calculate check-in and check-out dates (1 day stay)
const tripDate = selectedTrip.trip_date;
if (tripDate) {
  const baseDate = new Date(tripDate);
  const checkInDate = new Date(baseDate);
  checkInDate.setDate(checkInDate.getDate() + (currentDayNumber - 1));
  const checkInDateStr = checkInDate.toISOString().split("T")[0];

  const checkOutDate = new Date(checkInDate);
  checkOutDate.setDate(checkOutDate.getDate() + 1); // 1 day stay
  const checkOutDateStr = checkOutDate.toISOString().split("T")[0];

  setStayCheckInDate(checkInDateStr);
  setStayCheckOutDate(checkOutDateStr);
}
```

#### From Stay Details

**Location**: Lines 3199-3240 in `FlightsPageAuthenticated.tsx`

```typescript
// Calculate check-in and check-out dates
const tripDate = selectedTrip.trip_date; // Trip start date in YYYY-MM-DD format
if (tripDate) {
  // Check-in day from stay_details or current day number
  const checkInDay =
    currentDay.stay_details.check_in_day || currentDayNumber;
  // Check-out day from stay_details or find next conveyance day
  let checkOutDay = currentDay.stay_details.check_out_day;

  if (!checkOutDay) {
    // Find next day with conveyance requirement
    const nextConveyanceDay = selectedTrip.day_wise_plan?.find(
      (d: any) =>
        d.day_number > currentDayNumber &&
        d.conveyance_details?.is_required === true
    );
    checkOutDay = nextConveyanceDay
      ? nextConveyanceDay.day_number
      : currentDayNumber + 1;
  }

  // Calculate actual dates
  const baseDate = new Date(tripDate);
  const checkInDate = new Date(baseDate);
  checkInDate.setDate(checkInDate.getDate() + (checkInDay - 1));
  const checkInDateStr = checkInDate.toISOString().split("T")[0];

  const checkOutDate = new Date(baseDate);
  checkOutDate.setDate(checkOutDate.getDate() + (checkOutDay - 1));
  const checkOutDateStr = checkOutDate.toISOString().split("T")[0];

  setStayCheckInDate(checkInDateStr);
  setStayCheckOutDate(checkOutDateStr);
}
```

---

## Key Utility Functions

### City Normalization Functions

**File**: `src/app/utils/placesData.ts`

#### `normalizeCityNameSync(cityName: string): string`

**Purpose**: Synchronously normalizes city name using popular cities list

**Location**: Lines 220-245 in `placesData.ts`

```typescript
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
```

**Usage**: Used in `FlightsPageAuthenticated.tsx` for normalizing cities before setting them in widgets

#### `normalizeCityName(cityName: string): Promise<string>`

**Purpose**: Asynchronously normalizes city name using full places.json dataset

**Location**: Lines 183-214 in `placesData.ts`

```typescript
export async function normalizeCityName(cityName: string): Promise<string> {
  if (!cityName || cityName.trim() === '') {
    return cityName;
  }

  // Handle special placeholder values
  if (cityName.toLowerCase() === 'user_location' || cityName.toLowerCase() === 'user location') {
    return cityName;
  }

  // First, try to find in places.json
  const place = await findPlaceByCity(cityName);
  if (place) {
    return place.city;
  }

  // If not found in places.json, check popular cities
  const popularCities = getPopularIndianCities();
  const matchedCity = popularCities.find(
    c => c.city.toLowerCase() === cityName.toLowerCase()
  );

  if (matchedCity) {
    return matchedCity.city;
  }

  // If still not found, return with proper capitalization
  return cityName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
```

#### `findPlaceByCity(cityName: string): Promise<PlaceData | null>`

**Purpose**: Finds place data by city name from places.json

**Location**: Lines 41-56 in `placesData.ts`

```typescript
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
```

**Usage**: Used to fetch country/state data for API calls

---

## Data Flow & API Integration

### Conveyance Search Flow

1. **Field Population** (in `FlightsPageAuthenticated.tsx`)
   - Extract FROM/TO cities from `day_wise_plan`
   - Calculate departure date from `trip_date` + `day_number`
   - Normalize city names using `normalizeCityNameSync`
   - Set state variables: `conveyanceFromCity`, `conveyanceToCity`, `initialDepartureDate`

2. **Widget Initialization** (in `FlightsWidget.tsx`)
   - Receive props: `initialFromCity`, `initialToCity`, `initialDepartureDate`
   - Update local state via `useEffect` (lines 1608-1626)
   - Auto-fill departure date if in auto-fill mode (lines 1640-1660)

3. **Auto-Search Trigger** (in `FlightsWidget.tsx`)
   - Check if `autoFillMode` is true and all fields are ready
   - Auto-trigger `handleSearch()` after 500ms delay (lines 1662-1686)

4. **Search Execution** (in `FlightsWidget.tsx`)
   - Fetch country data using `findPlaceByCity` (lines 1887-1897)
   - Make parallel API calls:
     - `/api/utility/conveyance` (flights)
     - `/api/utility/conveyance` (trains)
     - `/api/conveyance` (AI recommendations)
   - Parse and display results

### Stay Search Flow

1. **Field Population** (in `FlightsPageAuthenticated.tsx`)
   - Extract city from conveyance's `to_city` or `stay_details.city`
   - Calculate check-in/check-out dates from `trip_date` + `check_in_day`/`check_out_day`
   - Set state variables: `stayCity`, `stayCheckInDate`, `stayCheckOutDate`

2. **Widget Initialization** (in `StaysWidget.tsx`)
   - Receive props: `initialCity`, `initialCheckInDate`, `initialCheckOutDate`
   - Update local state via `useEffect` (lines 642-657)

3. **Auto-Search Trigger** (in `StaysWidget.tsx`)
   - Check if `autoFillMode` is true and widget is visible
   - Auto-trigger `handleSearch()` (lines 659-670)

4. **Search Execution** (in `StaysWidget.tsx`)
   - Fetch place data using `findPlaceByCity` for state/country
   - Make parallel API calls:
     - `/api/stay` (AI recommendations)
     - `/api/utility/stay` (Utility stays)
   - Parse and display results

---

## Examples & Use Cases

### Example 1: Day 1 Conveyance (Full Auto-Fill)

**Scenario**: User selects trip date, Day 1 requires conveyance

**Flow**:
1. User selects date in `DateSelectorWidget`
2. `handleDateSelection` extracts Day 1 conveyance details
3. FROM city: `day1.conveyance_details.from_city` (normalized)
4. TO city: `day1.conveyance_details.to_city` (normalized)
5. Date: `trip_date` (Day 1 = trip start date)
6. Set `autoFillMode = true`
7. Show `FlightsWidget` with all fields pre-filled and disabled
8. Search auto-triggers after 500ms

**Code Reference**: Lines 2770-2878 in `FlightsPageAuthenticated.tsx`

### Example 2: Next Day Conveyance (Full Auto-Fill)

**Scenario**: User clicks "Continue" on itinerary, next day requires conveyance

**Flow**:
1. User clicks "Continue" in `ItineraryWidget`
2. `handleRequestNextDay` extracts next day conveyance details
3. FROM city: Current day's `to_city`
4. TO city: Next day's `to_city`
5. Date: `trip_date` + `(nextDayNumber - 1)`
6. Set `autoFillMode = true`
7. Show `FlightsWidget` with all fields pre-filled and disabled
8. Search auto-triggers after 500ms

**Code Reference**: Lines 1980-2076 in `FlightsPageAuthenticated.tsx`

### Example 3: Add Day Conveyance (Partial Auto-Fill)

**Scenario**: User adds a new day to itinerary, needs conveyance

**Flow**:
1. User clicks "Add Day" in `ItineraryWidget`
2. `handleAddDay` creates new day structure
3. FROM city: Last conveyance's `to_city` (iterates backwards)
4. TO city: Empty (user selects)
5. Date: `trip_date` + `(newDayNumber - 1)`
6. Set `autoFillMode = false`, `partialAutoFillMode = true`
7. Show `FlightsWidget` with FROM and DATE pre-filled (disabled), TO editable
8. User selects TO city and clicks "Smart Search"
9. After conveyance selection, route to `StaysWidget` (if stay required)

**Code Reference**: Lines 2084-2344 in `FlightsPageAuthenticated.tsx`

### Example 4: Stay After Conveyance (Full Auto-Fill)

**Scenario**: User selects conveyance, day requires stay

**Flow**:
1. User selects conveyance in `FlightsWidget`
2. `handleFlightsContinue` extracts stay details
3. City: Conveyance's `to_city` (capitalized, normalized)
4. Check-in: `trip_date` + `(currentDayNumber - 1)`
5. Check-out: `trip_date` + `(currentDayNumber)` (1 day stay) OR next conveyance day
6. Set `autoFillStaysMode = true`
7. Show `StaysWidget` with all fields pre-filled and disabled
8. Search auto-triggers when widget becomes visible

**Code Reference**: Lines 3144-3276 in `FlightsPageAuthenticated.tsx`

### Example 5: Stay in Partial Auto-Fill Flow

**Scenario**: User adds new day, selects conveyance, needs stay

**Flow**:
1. User selects conveyance in `FlightsWidget` (partial auto-fill mode)
2. `handleFlightsContinue` detects `partialAutoFillMode = true`
3. Extract TO city from conveyance selection
4. City: Conveyance's `to_city` (capitalized, normalized)
5. Check-in: `trip_date` + `(currentDayNumber - 1)`
6. Check-out: `trip_date` + `(currentDayNumber)` (1 day stay)
7. Set `autoFillStaysMode = true`
8. Show `StaysWidget` with all fields pre-filled and disabled
9. Search auto-triggers when widget becomes visible

**Code Reference**: Lines 2994-3142 in `FlightsPageAuthenticated.tsx`

---

## Summary

### Conveyance Component Modes

| Mode | FROM | TO | DATE | Search Button | Auto-Trigger |
|------|------|----|----|---------------|--------------|
| Manual | Editable | Editable | Editable | Enabled | No |
| Full Auto-Fill | Disabled | Disabled | Disabled | Disabled | Yes (500ms) |
| Partial Auto-Fill | Disabled | Editable | Disabled | Enabled | No |

### Stay Component Modes

| Mode | CITY | CHECK-IN | CHECK-OUT | Search Button | Auto-Trigger |
|------|------|----------|------------|---------------|--------------|
| Manual | Editable | Editable | Editable | Enabled | No |
| Full Auto-Fill | Disabled | Disabled | Disabled | Enabled | Yes (on visible) |

### Key Functions Summary

- **City Normalization**: `normalizeCityNameSync()` - Synchronous normalization using popular cities
- **City Lookup**: `findPlaceByCity()` - Async lookup in places.json for country/state data
- **Date Calculation**: `trip_date` + `(day_number - 1)` for departure/check-in dates
- **Field Extraction**: From `day_wise_plan[].conveyance_details` and `stay_details`

---

## Notes

1. **City Normalization**: Always normalize city names before setting in widgets to ensure consistency
2. **Date Format**: All dates are in `YYYY-MM-DD` format (ISO string)
3. **Special Cases**: Handle "Delhi" → "New Delhi", "user_location" → `source_point.place_name`
4. **Default Values**: Mumbai is used as default if city cannot be determined
5. **Auto-Search Delay**: 500ms delay in conveyance widget to allow state updates
6. **Auto-Search Flag**: `hasAutoSearched` prevents multiple auto-searches in stay widget

---

**Last Updated**: 2025-11-20
**Document Version**: 1.0

