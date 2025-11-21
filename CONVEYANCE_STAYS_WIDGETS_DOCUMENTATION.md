# ConveyanceTab & StaysTab Widgets - Complete Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [ConveyanceTab Widget](#conveyancetab-widget)
3. [StaysTab Widget](#staystab-widget)
4. [API Call Flow](#api-call-flow)
5. [Rendering Process](#rendering-process)
6. [Data Structures](#data-structures)
7. [Pre-fetching Mechanism](#pre-fetching-mechanism)
8. [Error Handling](#error-handling)

---

## Overview

Both `ConveyanceTab.tsx` and `StaysTab.tsx` are standalone widget components that provide search and booking interfaces for travel conveyance (flights, trains, buses) and accommodations (hotels, stays) respectively. They follow a similar architectural pattern with dual data sources: **AI Recommendations** and **Utility API Results**.

### Key Architectural Patterns

- **Dual Data Source Pattern**: Each widget fetches data from two sources:
  - AI-powered recommendations (contextual, personalized)
  - Utility API (comprehensive, real-time data)
  
- **Pre-fetching Optimization**: Both widgets check for cached/pre-fetched data before making API calls
  
- **Parallel API Execution**: Uses `Promise.allSettled()` for non-blocking parallel API calls
  
- **Progressive Rendering**: Results are displayed as they become available, not waiting for all APIs

---

## ConveyanceTab Widget

### Component Location
`src/app/components/ConveyanceTab.tsx`

### Purpose
Search and select transportation options (flights, trains, buses) between two cities on a specific date.

### User Interface Elements

#### Search Form Fields
1. **From** (CitySelector)
   - Searchable dropdown with 40K+ cities
   - Uses `places.json` for city data
   - Displays city name and airport code

2. **To** (CitySelector)
   - Same as "From" field
   - Cannot be same as "From"

3. **Departure Date** (DatePicker)
   - Calendar widget
   - Prevents past date selection
   - Format: YYYY-MM-DD

4. **Class** (ClassSelector)
   - Options: Economy, Premium Economy, Business, First
   - Default: Economy

5. **Travellers** (TravellerSelector)
   - Number selector (1-9)
   - Default: 1

#### Conveyance Type Selector
- **Flight** (default)
- **Train**
- **Bus** (currently commented out in UI)

### Search Trigger

**Method**: `handleSearch()` (line 1710)

**Trigger Condition**: User clicks "Smart Search" button

**Validation**:
```typescript
if (!from || !to || !departureDate) {
  alert("Please fill in all required fields: From, To, and Departure Date");
  return;
}
```

### API Call Flow

#### Step 1: Pre-fetch Check (Lines 1743-1789)

```typescript
if (userId) {
  const cachedData = await getConveyanceDataForWidget(
    userId,
    from,
    to,
    dateStr  // YYYY-MM-DD format
  );
  
  if (cachedData) {
    // Use cached data, skip API calls
    return;
  }
}
```

**Pre-fetch Data Structure**:
```typescript
{
  aiFlights: APIFlightData[],
  aiTrains: APITrainData[],
  utilityFlights: UtilityFlightData[],
  utilityTrains: UtilityTrainData[],
  isCached: boolean
}
```

#### Step 2: City Data Enrichment (Lines 1792-1802)

Fetches country information for both cities from `places.json`:

```typescript
const [departurePlace, arrivalPlace] = await Promise.all([
  findPlaceByCity(from),
  findPlaceByCity(to),
]);

const departureCountry = departurePlace?.country || "India";
const arrivalCountry = arrivalPlace?.country || "India";
```

#### Step 3: Parallel API Calls (Lines 1805-1849)

Uses `Promise.allSettled()` to make **3 parallel API calls**:

##### API Call 1: Utility Flights
```typescript
fetch("/api/utility/conveyance", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: userId || "user123",
    conveyance_type: "flights",
    departure_city: from,
    departure_country: departureCountry,
    arrival_city: to,
    arrival_country: arrivalCountry,
    start_date: dateStr,  // YYYY-MM-DD
    end_date: dateStr,    // Same date for single-day search
  }),
})
```

**Backend Endpoint**: `POST /utility/conveyance`

**Response Format**: Array of `UtilityFlightData[]`

##### API Call 2: Utility Trains
```typescript
fetch("/api/utility/conveyance", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: userId || "user123",
    conveyance_type: "trains",
    departure_city: from,
    departure_country: departureCountry,
    arrival_city: to,
    arrival_country: arrivalCountry,
    start_date: dateStr,
    end_date: dateStr,
  }),
})
```

**Backend Endpoint**: `POST /utility/conveyance`

**Response Format**: Array of `UtilityTrainData[]`

##### API Call 3: AI Recommendations
```typescript
fetch("/api/conveyance", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: userId || "user123",
    session_id: sessionId || "session456",
    message: `Give me all the travel options from ${from} to ${to} on ${formatDateForMessage(departureDate)}`,
  }),
})
```

**Backend Endpoint**: `POST /agents/conveyance`

**Response Format**:
```typescript
{
  user_id: string,
  session_id: string,
  message: {
    response_type: string,
    message: string,
    conveyances: {
      from_city: string,
      to_city: string,
      conveyance_details: {
        flights?: APIFlightData[],
        trains?: APITrainData[],
      }
    }
  }
}
```

#### Step 4: Response Processing (Lines 1851-1920)

**Processing Logic**:
1. **Utility Flights** → Parsed using `parseUtilityFlightData()` (line 859)
2. **Utility Trains** → Parsed using `parseUtilityTrainData()` (line 901)
3. **AI Flights** → Parsed using `parseFlightData()` (line 1623)
4. **AI Trains** → Parsed using `parseTrainData()` (line 1667)

**Data Separation**:
```typescript
// AI Results
const aiResults: SearchResultsData = {
  flights: aiFlights,
  trains: aiTrains,
  buses: [],
};

// Utility Results
const utilResults: SearchResultsData = {
  flights: utilFlights,
  trains: utilTrains,
  buses: [],
};
```

**State Updates**:
```typescript
setSearchResults(aiResults);      // AI recommendations
setUtilityResults(utilResults);    // Utility options
setShowResults(true);
setIsLoadingComplete(true);
setIsUtilityComplete(true);
```

### Rendering Process

#### Loading States

**Independent Loading Indicators**:
- `isLoading` → AI Recommendations loading state
- `isLoadingUtility` → Utility Options loading state
- `isLoadingComplete` → AI Recommendations complete flag
- `isUtilityComplete` → Utility Options complete flag

#### Result Display Sections

##### Section 1: AI Recommendations (Lines 2169-2244)
- **Header**: Blue/purple gradient background
- **Status Indicator**: 
  - Spinner while loading (`isLoading`)
  - Green checkmark when complete (`isLoadingComplete`)
- **Content**: Filtered by `selectedConveyance` (Flight/Train/Bus)
- **Rendering**: `getFilteredResults()` filters `searchResults` by conveyance type

##### Section 2: Other Travel Options (Lines 2246-2313)
- **Header**: Orange/pink gradient background
- **Status Indicator**:
  - Spinner while loading (`isLoadingUtility`)
  - Green checkmark when complete (`isUtilityComplete`)
- **Content**: Filtered by `selectedConveyance`
- **Rendering**: `getFilteredUtilityResults()` filters `utilityResults` by conveyance type

#### Progressive Rendering

**Key Point**: Results are displayed **as soon as they're available**, not waiting for all APIs to complete.

```typescript
// AI section shows loading spinner while isLoading is true
// Utility section shows loading spinner while isLoadingUtility is true
// Each section updates independently when its data arrives
```

#### Result Filtering

**Method**: `getFilteredResults()` (line 1930) and `getFilteredUtilityResults()` (line 1943)

```typescript
const getFilteredResults = () => {
  switch (selectedConveyance) {
    case "Flight": return searchResults.flights;
    case "Train": return searchResults.trains;
    case "Bus": return searchResults.buses;
    default: return [];
  }
};
```

### Transport Card Component

**Component**: `TransportCard` (line 1019)

**Props**:
- `option: TransportOption` - Transport option data
- `mode: "flight" | "train" | "bus"` - Display mode
- `fromCity?: string` - Origin city
- `toCity?: string` - Destination city
- `isBooked: boolean` - Selection state
- `onBook: (id: string) => void` - Booking handler

**Features**:
- Animated curved path visualization (different for flights/trains/buses)
- Price display with currency
- Duration and stops information
- Selection state with green highlight
- Hover effects and animations

---

## StaysTab Widget

### Component Location
`src/app/components/StaysTab.tsx`

### Purpose
Search and select accommodation options (hotels, stays) in a city for specific check-in/check-out dates.

### User Interface Elements

#### Search Form Fields
1. **City** (CitySelector)
   - Searchable dropdown with 40K+ cities
   - Uses `places.json` for city data
   - Displays city name and code

2. **Check-in Date** (DatePicker)
   - Calendar widget
   - Prevents past date selection
   - Format: YYYY-MM-DD

3. **Check-out Date** (DatePicker)
   - Calendar widget
   - Must be after check-in date
   - Format: YYYY-MM-DD

4. **Star Rating** (StarRatingSelector)
   - Options: All, 3 Star, 4 Star, 5 Star
   - Default: All

### Search Trigger

**Method**: `handleSearch()` (line 638)

**Trigger Condition**: User clicks "Smart Search" button

**Validation**:
```typescript
if (!city || !checkInDate || !checkOutDate) {
  alert("Please fill in all required fields: City, Check-in Date, and Check-out Date");
  return;
}

if (new Date(checkOutDate) <= new Date(checkInDate)) {
  alert("Check-out date must be after check-in date");
  return;
}
```

### API Call Flow

#### Step 1: Pre-fetch Check (Lines 657-736)

```typescript
if (userId) {
  const cachedData = await getPreFetchedStaysData(
    userId,
    city,
    checkInDate,
    checkOutDate
  );
  
  if (cachedData) {
    // Transform and use cached data
    const aiStayOptions = cachedData.ai_recommendations.map(...);
    const utilityStayOptions = cachedData.utility_stays.map(...);
    
    setSearchResults(aiStayOptions);
    setUtilityStays(utilityStayOptions);
    return; // Skip API calls
  }
}
```

**Pre-fetch Data Structure**:
```typescript
{
  ai_recommendations: StayOption[],
  utility_stays: StayOption[],
  city: string,
  check_in_date: string,
  check_out_date: string
}
```

#### Step 2: Date Formatting & Place Data (Lines 738-768)

```typescript
// Format dates for display in message
const checkInFormatted = new Date(checkInDate).toLocaleDateString("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

// Get place data for state and country
const placeData = await findPlaceByCity(city);
const state = placeData?.state || "";
const country = placeData?.country || "India";

// Calculate duration in days
const duration = Math.ceil(
  (toDateObj.getTime() - fromDateObj.getTime()) / (1000 * 60 * 60 * 24)
);
```

#### Step 3: Parallel API Calls (Lines 771-794)

Uses `Promise.allSettled()` to make **2 parallel API calls**:

##### API Call 1: AI Recommendations
```typescript
fetch("/api/stay", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: userId || "user123",
    session_id: sessionId || "session456",
    message: `Give me all the stay options available ${checkInFormatted} to ${checkOutFormatted} in ${city}`,
  }),
})
```

**Backend Endpoint**: `POST /agents/stay`

**Response Format**:
```typescript
{
  message: {
    stays: {
      city: string,
      state: string,
      country: string,
      stay_details: StayOption[]
    }
  }
}
```

##### API Call 2: Utility Stays
```typescript
fetch("/api/utility/stay", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: userId,
    city: city,
    state: state,
    country: country,
    start_check_in_date: checkInDate,  // YYYY-MM-DD
    end_check_in_date: checkOutDate,   // YYYY-MM-DD
    duration: duration > 0 ? duration : -1,
  }),
})
```

**Backend Endpoint**: `POST /utility/stay`

**Response Format**: Direct array of `StayOption[]`

#### Step 4: Response Processing (Lines 796-874)

**Processing Logic**:

1. **AI Recommendations** (Lines 797-830):
```typescript
if (aiResponse.status === "fulfilled" && aiResponse.value.ok) {
  const data = await aiResponse.value.json();
  
  // Parse: data.message.stays.stay_details
  if (data.message?.stays?.stay_details) {
    aiStayOptions = data.message.stays.stay_details.map((stay, index) => ({
      stay_id: `ai_stay_${index}`,
      property_name: stay.property_name,
      property_address: stay.property_address,
      // ... transform to StayOption format
    }));
  }
}
```

2. **Utility Stays** (Lines 833-858):
```typescript
if (utilityResponse.status === "fulfilled" && utilityResponse.value.ok) {
  const utilityData = await utilityResponse.value.json();
  
  // Direct array response
  if (Array.isArray(utilityData)) {
    utilityStayOptions = utilityData.map((stay, index) => ({
      stay_id: `utility_stay_${index}`,
      property_name: stay.property_name,
      // ... transform to StayOption format
    }));
  }
}
```

**State Updates**:
```typescript
setSearchResults(aiStayOptions);      // AI recommendations
setUtilityStays(utilityStayOptions);  // Utility stays
setShowResults(true);
setIsLoadingComplete(true);
```

### Rendering Process

#### Loading States

**Single Loading Indicator**:
- `isLoading` → Overall loading state
- `isLoadingComplete` → Completion flag

**Note**: Unlike ConveyanceTab, StaysTab uses a single loading state for both AI and utility results.

#### Result Display Sections

##### Section 1: AI Recommendations (Lines 1028-1091)
- **Header**: Blue/purple gradient background
- **Status Indicator**:
  - Spinner while loading (`isLoading`)
  - Green checkmark when complete (`isLoadingComplete`)
- **Content**: All AI-recommended stays
- **Rendering**: Maps `searchResults` array

##### Section 2: Other Stay Options (Lines 1094-1125)
- **Header**: Purple/pink gradient background
- **Status Indicator**: Purple hotel icon
- **Content**: All utility stays
- **Rendering**: Maps `utilityStays` array
- **Conditional**: Only shows if `utilityStays.length > 0`

#### Progressive Rendering

**Key Point**: Both sections render independently, but utility section only appears when data is available.

### Stay Card Component

**Component**: `StayCard` (line 491)

**Props**:
- `stay: StayOption` - Stay option data
- `isBooked: boolean` - Selection state
- `onBook: (id: string) => void` - Booking handler

**Features**:
- Property name and address
- Star rating display
- Available rooms count
- Price per night
- Availability date range
- Selection state with green highlight
- Hover effects and animations

---

## API Call Flow

### Execution Strategy

Both widgets use **`Promise.allSettled()`** instead of `Promise.all()`:

**Why `Promise.allSettled()`?**
- Does not fail fast - continues even if one API fails
- Allows partial results to be displayed
- Better user experience - shows what's available

**Example**:
```typescript
const [flightsResponse, trainsResponse, aiResponse] = 
  await Promise.allSettled([
    fetch("/api/utility/conveyance", { /* flights */ }),
    fetch("/api/utility/conveyance", { /* trains */ }),
    fetch("/api/conveyance", { /* AI */ }),
  ]);

// Each response is checked individually
if (flightsResponse.status === "fulfilled" && flightsResponse.value.ok) {
  // Process flights
}
```

### API Endpoints Summary

#### ConveyanceTab APIs

| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/api/utility/conveyance` | POST | Get utility flights | `conveyance_type: "flights"`, `departure_city`, `arrival_city`, `start_date`, `end_date` |
| `/api/utility/conveyance` | POST | Get utility trains | `conveyance_type: "trains"`, `departure_city`, `arrival_city`, `start_date`, `end_date` |
| `/api/conveyance` | POST | Get AI recommendations | `user_id`, `session_id`, `message` |

#### StaysTab APIs

| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/api/stay` | POST | Get AI recommendations | `user_id`, `session_id`, `message` |
| `/api/utility/stay` | POST | Get utility stays | `user_id`, `city`, `state`, `country`, `start_check_in_date`, `end_check_in_date`, `duration` |

### Request/Response Timing

**Timeline Example** (ConveyanceTab):

```
T=0ms:   User clicks "Smart Search"
T=0ms:   Check pre-fetched data (if userId exists)
T=50ms:  If no cache, start parallel API calls
T=50ms:  → API 1: Utility Flights (started)
T=50ms:  → API 2: Utility Trains (started)
T=50ms:  → API 3: AI Recommendations (started)
T=800ms: → API 1: Utility Flights (completed) → Update UI
T=1200ms: → API 2: Utility Trains (completed) → Update UI
T=2500ms: → API 3: AI Recommendations (completed) → Update UI
```

**Key Insight**: Each API response updates the UI immediately when received, providing progressive feedback.

---

## Rendering Process

### Component Lifecycle

#### Initial State
```typescript
// ConveyanceTab
const [showResults, setShowResults] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [isLoadingComplete, setIsLoadingComplete] = useState(false);
const [isLoadingUtility, setIsLoadingUtility] = useState(false);
const [isUtilityComplete, setIsUtilityComplete] = useState(false);

// StaysTab
const [showResults, setShowResults] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [isLoadingComplete, setIsLoadingComplete] = useState(false);
```

#### Search Initiation
1. User fills form fields
2. User clicks "Smart Search"
3. `handleSearch()` is called
4. Loading states set to `true`
5. `showResults` set to `false` (clears previous results)

#### Data Fetching
1. Check pre-fetched data (if available, use it and skip API calls)
2. If no cache, make parallel API calls
3. Process responses as they arrive
4. Update state with results

#### Result Display

**ConveyanceTab Rendering Flow**:
```
1. Show search form
2. User clicks "Smart Search"
3. Show loading spinners in both sections
4. As API 1 completes → Update "Other Travel Options" section
5. As API 2 completes → Update "Other Travel Options" section
6. As API 3 completes → Update "AI Recommendations" section
7. User can filter by conveyance type (Flight/Train/Bus)
8. User can select an option → Triggers booking handler
```

**StaysTab Rendering Flow**:
```
1. Show search form
2. User clicks "Smart Search"
3. Show loading spinner in "AI Recommendations" section
4. As API 1 completes → Update "AI Recommendations" section
5. As API 2 completes → Show "Other Stay Options" section (if results exist)
6. User can select a stay → Triggers booking handler
```

### Conditional Rendering

#### ConveyanceTab
```typescript
{(showResults || isLoading) && (
  <div>
    {/* AI Recommendations Section */}
    {isLoading ? <Spinner /> : <Results />}
    
    {/* Utility Options Section */}
    {isLoadingUtility ? <Spinner /> : <Results />}
  </div>
)}
```

#### StaysTab
```typescript
{(showResults || isLoading) && (
  <div>
    {/* AI Recommendations Section */}
    {isLoading ? <Spinner /> : <Results />}
    
    {/* Utility Options Section - Only if results exist */}
    {utilityStays.length > 0 && <Results />}
  </div>
)}
```

---

## Data Structures

### ConveyanceTab Data Types

#### TransportOption Interface
```typescript
interface TransportOption {
  id: string;
  number: string;              // Flight/train number
  operator: string;             // Airline/train name
  departureDate: string;        // Formatted: "24 Oct 2025"
  arrivalDate: string;          // Formatted: "24 Oct 2025"
  departureTime: string;        // "06:30 AM"
  arrivalTime: string;          // "08:45 AM"
  duration: string;             // "2h 15m"
  price: number;                // Numeric price
  from_city?: string;           // Enriched metadata
  to_city?: string;              // Enriched metadata
  is_required?: boolean;        // Enriched metadata
}
```

#### SearchResultsData Interface
```typescript
interface SearchResultsData {
  flights: TransportOption[];
  trains: TransportOption[];
  buses: TransportOption[];
}
```

#### API Response Types

**Utility Flight Data**:
```typescript
interface UtilityFlightData {
  flight_id: string;
  airline: string;
  flight_number: string;
  departure_airport: { code, name, city, country };
  arrival_airport: { code, name, city, country };
  departure_date: string;       // ISO format
  arrival_date: string;         // ISO format
  departure_time: string;       // "06:30" or "06:30+1"
  arrival_time: string;         // "08:45" or "08:45+1"
  duration: string;
  price: { economy, business, first };
  currency: string;
  travel_class_options: string[];
}
```

**AI Flight Data**:
```typescript
interface APIFlightData {
  flight_number: string;
  airline: string;
  daparture_date: string;       // Note: typo in API
  departure_time: string;
  arival_date: string;          // Note: typo in API
  arrival_time: string;
  duration: string;
  price: string;                 // String format
}
```

### StaysTab Data Types

#### StayOption Interface
```typescript
interface StayOption {
  stay_id: string;
  property_name: string;
  property_address: string;
  property_location: string;
  city: string;
  state: string;
  country: string;
  overall_rating: number;         // e.g., 4.5
  starting_price: string;        // String format
  currency: string;              // "INR"
  available_rooms_total: number;
  available_from_date: string;   // ISO format
  available_until_date: string;  // ISO format
}
```

---

## Pre-fetching Mechanism

### Purpose
Optimize performance by caching previously fetched data and avoiding redundant API calls.

### Implementation

#### ConveyanceTab Pre-fetching
**Function**: `getConveyanceDataForWidget()` (from `preFetchIntegration.ts`)

**Cache Key**: `${userId}_${fromCity}_${toCity}_${travelDate}`

**Data Retrieved**:
```typescript
{
  aiFlights: APIFlightData[],
  aiTrains: APITrainData[],
  utilityFlights: UtilityFlightData[],
  utilityTrains: UtilityTrainData[],
  isCached: boolean
}
```

**Usage**:
```typescript
const cachedData = await getConveyanceDataForWidget(
  userId,
  from,
  to,
  departureDate
);

if (cachedData) {
  // Parse and use cached data
  const aiFlights = parseFlightData(cachedData.aiFlights);
  const aiTrains = parseTrainData(cachedData.aiTrains);
  // ... set state and return early
}
```

#### StaysTab Pre-fetching
**Function**: `getPreFetchedStaysData()` (from `preFetchStays.ts`)

**Cache Key**: `${userId}_${city}_${checkInDate}_${checkOutDate}`

**Data Retrieved**:
```typescript
{
  ai_recommendations: StayOption[],
  utility_stays: StayOption[],
  city: string,
  check_in_date: string,
  check_out_date: string
}
```

**Usage**:
```typescript
const cachedData = await getPreFetchedStaysData(
  userId,
  city,
  checkInDate,
  checkOutDate
);

if (cachedData) {
  // Transform and use cached data
  const aiStayOptions = cachedData.ai_recommendations.map(...);
  const utilityStayOptions = cachedData.utility_stays.map(...);
  // ... set state and return early
}
```

### Cache Storage
- **Location**: Likely Firebase or similar backend storage
- **Key Format**: User-scoped with route/date parameters
- **TTL**: Not specified in code (likely session-based or time-based)

---

## Error Handling

### API Error Handling

#### Promise.allSettled() Pattern
```typescript
const [api1, api2, api3] = await Promise.allSettled([...]);

// Check each response individually
if (api1.status === "fulfilled" && api1.value.ok) {
  // Process successful response
} else if (api1.status === "rejected") {
  console.error("API 1 error:", api1.reason);
  // Continue with other APIs
}
```

### User-Facing Error Handling

#### ConveyanceTab
```typescript
try {
  // ... API calls
} catch (error) {
  console.error("❌ Error fetching transport options:", error);
  alert("Failed to fetch transport options. Please try again.");
} finally {
  setIsLoading(false);
  setIsLoadingUtility(false);
}
```

#### StaysTab
```typescript
try {
  // ... API calls
} catch (error) {
  console.error("Error fetching stay options:", error);
  alert("Failed to fetch stay options. Please try again.");
} finally {
  setIsLoading(false);
}
```

### Validation Errors

#### ConveyanceTab
- Missing fields: `from`, `to`, `departureDate`
- User sees alert: "Please fill in all required fields"

#### StaysTab
- Missing fields: `city`, `checkInDate`, `checkOutDate`
- Invalid date range: Check-out must be after check-in
- User sees alert with specific error message

### Partial Results Handling

**Key Feature**: Both widgets handle partial results gracefully.

**Example Scenario**:
- Utility API succeeds → Shows utility results
- AI API fails → Shows error message, but utility results still displayed
- User can still interact with available results

---

## Key Differences Between Widgets

| Aspect | ConveyanceTab | StaysTab |
|--------|---------------|----------|
| **API Calls** | 3 parallel calls | 2 parallel calls |
| **Loading States** | Separate for AI and Utility | Single loading state |
| **Result Sections** | Always shows both sections | Utility section conditional |
| **Filtering** | By conveyance type (Flight/Train/Bus) | By star rating (in form) |
| **Date Handling** | Single departure date | Check-in and check-out dates |
| **Pre-fetch Key** | `userId_from_to_date` | `userId_city_checkIn_checkOut` |
| **Data Transformation** | Complex (multiple formats) | Simpler (consistent format) |

---

## Performance Optimizations

1. **Pre-fetching**: Avoids redundant API calls for previously searched routes
2. **Parallel Execution**: All API calls made simultaneously
3. **Progressive Rendering**: Results displayed as they arrive
4. **Debounced Search**: City search debounced by 300ms
5. **Conditional Rendering**: Utility section only renders when data exists (StaysTab)

---

## Future Enhancements

### Potential Improvements

1. **Bus Support**: Currently commented out in ConveyanceTab
2. **Pagination**: For large result sets
3. **Sorting**: By price, duration, rating
4. **Filtering**: More advanced filters (price range, time preferences)
5. **Caching Strategy**: More aggressive caching with TTL
6. **Error Retry**: Automatic retry for failed API calls
7. **Loading Skeletons**: Better loading state visualization

---

## Conclusion

Both `ConveyanceTab` and `StaysTab` follow a robust, scalable architecture with:
- **Dual data sources** for comprehensive results
- **Pre-fetching optimization** for performance
- **Parallel API execution** for speed
- **Progressive rendering** for better UX
- **Graceful error handling** for reliability

The widgets are well-structured, maintainable, and provide excellent user experience through progressive loading and comprehensive error handling.

