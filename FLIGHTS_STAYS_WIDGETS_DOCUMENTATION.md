# FlightsWidget & StaysWidget - Complete Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [FlightsWidget Component](#flightswidget-component)
3. [StaysWidget Component](#staywidget-component)
4. [Widget vs Tab Components Comparison](#widget-vs-tab-components-comparison)
5. [Auto-Fill Modes](#auto-fill-modes)
6. [API Call Flow](#api-call-flow)
7. [Rendering Process](#rendering-process)
8. [Integration Patterns](#integration-patterns)
9. [Data Structures](#data-structures)

---

## Overview

`FlightsWidget.tsx` and `StaysWidget.tsx` are **reusable widget components** designed to be embedded within other components (like DateSelectorWidget or itinerary flows). Unlike their Tab counterparts (`ConveyanceTab` and `StaysTab`), these widgets are:

- **Toggleable**: Can be shown/hidden via `isVisible` prop
- **Embeddable**: Designed to be used within parent components
- **Auto-fill Capable**: Support automatic field population and search triggering
- **Flow-Integrated**: Include "Continue" button for multi-step workflows

### Key Architectural Differences from Tab Components

| Feature | Widget Components | Tab Components |
|---------|------------------|----------------|
| **Visibility Control** | `isVisible` prop controls rendering | Always rendered when route is active |
| **Auto-Fill Modes** | `autoFillMode`, `partialAutoFillMode` | No auto-fill modes |
| **Continue Button** | Optional `onContinue` callback | No continue button |
| **Initial Props** | `initialFromCity`, `initialToCity`, etc. | No initial props |
| **Auto-Search** | Auto-triggers search in auto-fill mode | Manual search only |
| **Use Case** | Embedded in flows, date selectors | Standalone pages/tabs |

---

## FlightsWidget Component

### Component Location
`src/app/components/FlightsWidget.tsx`

### Purpose
Embeddable widget for searching and selecting transportation options (flights, trains, buses) between two cities on a specific date. Designed to be integrated into multi-step workflows.

### Component Props

```typescript
interface FlightsWidgetProps {
  isVisible: boolean;                    // Controls widget visibility
  onToggle: () => void;                  // Callback to hide widget
  initialFromCity?: string;              // Pre-populate FROM city
  initialToCity?: string;                // Pre-populate TO city
  initialDepartureDate?: string;         // Pre-populate departure date (YYYY-MM-DD)
  autoFillMode?: boolean;                 // Full auto-fill: all fields fixed + auto-search
  partialAutoFillMode?: boolean;         // Partial auto-fill: FROM + DATE fixed, TO selectable
  onContinue?: (selectedConveyanceData?: TransportOption) => void; // Continue callback
  userId?: string;                        // User ID for pre-fetching
  sessionId?: string;                    // Session ID for AI recommendations
  currentDayNumber?: number;              // Day number for display (e.g., "Day 1")
}
```

### Auto-Fill Modes

#### 1. Full Auto-Fill Mode (`autoFillMode = true`)

**Behavior**:
- **FROM** field: Disabled, pre-filled with `initialFromCity`
- **TO** field: Disabled, pre-filled with `initialToCity`
- **Departure Date**: Disabled, pre-filled with `initialDepartureDate`
- **Search Button**: Disabled (search auto-triggers)
- **Auto-Search**: Automatically triggers when all fields are ready

**Use Case**: When all route information is already known (e.g., from itinerary generation)

**Implementation** (Lines 1662-1686):
```typescript
useEffect(() => {
  if (
    isVisible &&
    autoFillMode &&
    from &&
    to &&
    departureDate &&
    !showResults
  ) {
    // Auto-trigger search after 500ms delay
    const timer = setTimeout(async () => {
      await handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }
}, [isVisible, autoFillMode, from, to, departureDate, showResults]);
```

#### 2. Partial Auto-Fill Mode (`partialAutoFillMode = true`)

**Behavior**:
- **FROM** field: Disabled, pre-filled with `initialFromCity`
- **TO** field: **Enabled**, user can select destination
- **Departure Date**: Disabled, pre-filled with `initialDepartureDate`
- **Search Button**: Enabled (user must click to search)
- **Auto-Search**: **Disabled** (user must manually trigger)

**Use Case**: When origin and date are known, but user needs to choose destination

**Implementation**: Auto-search is **commented out** (Lines 1688-1703) to allow user review before searching.

### User Interface Elements

#### Search Form Fields
1. **From** (CitySelector)
   - Disabled when `autoFillMode` or `partialAutoFillMode` is true
   - Pre-filled with `initialFromCity` prop

2. **To** (CitySelector)
   - Disabled only when `autoFillMode` is true
   - Enabled in `partialAutoFillMode` for user selection
   - Pre-filled with `initialToCity` prop

3. **Departure Date** (DatePicker)
   - Disabled when `autoFillMode` or `partialAutoFillMode` is true
   - Pre-filled with `initialDepartureDate` prop

4. **Class** (ClassSelector)
   - Always enabled
   - Options: Economy, Premium Economy, Business, First

5. **Travellers** (TravellerSelector)
   - Always enabled
   - Range: 1-9 travellers

#### Conveyance Type Selector
- **Flight** (default)
- **Train**
- **Bus** (commented out in UI)

#### Continue Button (Lines 2383-2411)
- **Condition**: Only shown if `onContinue` prop is provided
- **Position**: Floating button at bottom-right
- **State**: Disabled until a conveyance option is selected
- **Action**: Calls `onContinue(selectedConveyanceData)` with enriched transport option

### Initial Props Handling

**Effect Hook** (Lines 1609-1626):
```typescript
useEffect(() => {
  if (initialFromCity) {
    setFrom(initialFromCity);
    setFromCity(initialFromCity);
  }
  if (initialToCity) {
    setTo(initialToCity);
    setToCity(initialToCity);
  }
}, [initialFromCity, initialToCity]);
```

**Departure Date Auto-Fill** (Lines 1641-1660):
```typescript
useEffect(() => {
  if (
    isVisible &&
    (autoFillMode || partialAutoFillMode) &&
    initialDepartureDate
  ) {
    if (departureDate !== initialDepartureDate) {
      setDepartureDate(initialDepartureDate);
    }
  }
}, [isVisible, autoFillMode, partialAutoFillMode, initialDepartureDate]);
```

### API Call Flow

**Identical to ConveyanceTab** - See [CONVEYANCE_STAYS_WIDGETS_DOCUMENTATION.md](./CONVEYANCE_STAYS_WIDGETS_DOCUMENTATION.md#api-call-flow) for details.

**Key Points**:
- Pre-fetch check first (if `userId` available)
- 3 parallel API calls using `Promise.allSettled()`
- Progressive rendering as results arrive
- Same data structures and parsing logic

### Rendering Process

#### Visibility Control
```typescript
if (!isVisible) return null;  // Line 2078
```

Widget only renders when `isVisible` is `true`.

#### Header Display
```typescript
<h2>
  {currentDayNumber
    ? `Day ${currentDayNumber} - Search Transport`
    : "Search Transport"}
</h2>
```

Shows day number if provided, otherwise generic title.

#### Continue Button Integration
- **Position**: `absolute bottom-6 right-6 z-20`
- **State Management**: Enabled when `bookedOption !== null`
- **Data Enrichment**: Passes enriched `TransportOption` with `from_city`, `to_city`, `is_required` metadata

---

## StaysWidget Component

### Component Location
`src/app/components/StaysWidget.tsx`

### Purpose
Embeddable widget for searching and selecting accommodation options (hotels, stays) in a city for specific check-in/check-out dates. Designed to be integrated into multi-step workflows.

### Component Props

```typescript
interface StaysWidgetProps {
  isVisible: boolean;                    // Controls widget visibility
  onToggle: () => void;                  // Callback to hide widget
  initialCity?: string;                  // Pre-populate city
  initialCheckInDate?: string;           // Pre-populate check-in date (YYYY-MM-DD)
  initialCheckOutDate?: string;          // Pre-populate check-out date (YYYY-MM-DD)
  autoFillMode?: boolean;                 // Full auto-fill: all fields fixed + auto-search
  onContinue?: (selectedStayData?: StayOption) => void; // Continue callback
  userId?: string;                        // User ID for pre-fetching
  sessionId?: string;                    // Session ID for AI recommendations
  currentDayNumber?: number;              // Day number for display (e.g., "Day 1")
}
```

### Auto-Fill Mode

**Single Mode**: `autoFillMode` (no partial mode like FlightsWidget)

**Behavior**:
- **City** field: Disabled, shows fixed value in gray box
- **Check-in Date**: Disabled, shows fixed value in gray box
- **Check-out Date**: Disabled, shows fixed value in gray box
- **Star Rating**: Always enabled
- **Search Button**: Always enabled (but auto-search triggers)
- **Auto-Search**: Automatically triggers when widget becomes visible and all fields are ready

**Use Case**: When all stay information is already known (e.g., from itinerary generation)

**Implementation** (Lines 660-670):
```typescript
useEffect(() => {
  if (
    isVisible &&
    autoFillMode &&
    !hasAutoSearched &&
    city &&
    checkInDate &&
    checkOutDate &&
    userId
  ) {
    setHasAutoSearched(true);
    handleSearch(); // Auto-trigger search
  }
}, [isVisible, autoFillMode, hasAutoSearched, city, checkInDate, checkOutDate, userId]);
```

**Auto-Search Flag**: Uses `hasAutoSearched` state to prevent multiple auto-searches when widget visibility toggles.

### User Interface Elements

#### Search Form Fields
1. **City** (CitySelector or Fixed Display)
   - **Normal Mode**: Searchable dropdown
   - **Auto-Fill Mode**: Fixed gray box showing city name (Lines 933-945)

2. **Check-in Date** (DatePicker or Fixed Display)
   - **Normal Mode**: Calendar widget
   - **Auto-Fill Mode**: Fixed gray box showing formatted date (Lines 954-976)

3. **Check-out Date** (DatePicker or Fixed Display)
   - **Normal Mode**: Calendar widget
   - **Auto-Fill Mode**: Fixed gray box showing formatted date (Lines 985-1007)

4. **Star Rating** (StarRatingSelector)
   - Always enabled
   - Options: All, 3 Star, 4 Star, 5 Star

### Initial Props Handling

**Effect Hook** (Lines 643-657):
```typescript
useEffect(() => {
  if (initialCity) {
    setCity(initialCity);
  }
  if (initialCheckInDate) {
    setCheckInDate(initialCheckInDate);
  }
  if (initialCheckOutDate) {
    setCheckOutDate(initialCheckOutDate);
  }
}, [initialCity, initialCheckInDate, initialCheckOutDate, autoFillMode]);
```

**Auto-Search Reset** (Lines 673-677):
```typescript
useEffect(() => {
  if (!isVisible) {
    setHasAutoSearched(false); // Reset flag when widget closes
  }
}, [isVisible]);
```

### API Call Flow

**Identical to StaysTab** - See [CONVEYANCE_STAYS_WIDGETS_DOCUMENTATION.md](./CONVEYANCE_STAYS_WIDGETS_DOCUMENTATION.md#api-call-flow) for details.

**Key Points**:
- Pre-fetch check first (if `userId` available)
- 2 parallel API calls using `Promise.allSettled()`
- Progressive rendering as results arrive
- Same data structures and parsing logic

### Rendering Process

#### Visibility Control
```typescript
if (!isVisible) return null;  // Line 902
```

Widget only renders when `isVisible` is `true`.

#### Header Display
```typescript
<h2>
  {currentDayNumber
    ? `Day ${currentDayNumber} - Search Stays`
    : "Search Stays"}
</h2>
```

Shows day number if provided, otherwise generic title.

#### Fixed Field Display (Auto-Fill Mode)

**City Field** (Lines 933-945):
```typescript
{autoFillMode ? (
  <div className="w-full text-left p-3 bg-gray-100/70 backdrop-blur-sm rounded-xl border border-gray-200 cursor-not-allowed">
    <div className="flex items-center gap-2">
      <FiMapPin className="text-gray-500" size={14} />
      <div>
        <div className="text-xs font-semibold text-gray-900">{city}</div>
        <div className="text-[10px] text-gray-500">Fixed city</div>
      </div>
    </div>
  </div>
) : (
  <CitySelector value={city} onChange={setCity} label="City" />
)}
```

**Date Fields**: Similar pattern with formatted date display and "Fixed date" label.

#### Continue Button Integration
- **Position**: `absolute bottom-6 right-6 z-20`
- **State Management**: Enabled when `bookedOption !== null`
- **Data Passing**: Passes selected `StayOption` directly

---

## Widget vs Tab Components Comparison

### Architectural Differences

| Aspect | FlightsWidget | ConveyanceTab |
|--------|---------------|---------------|
| **Component Type** | Widget (embeddable) | Tab (standalone page) |
| **Visibility** | Controlled by `isVisible` prop | Always visible when route active |
| **Props** | `initialFromCity`, `initialToCity`, `initialDepartureDate` | No initial props |
| **Auto-Fill** | `autoFillMode`, `partialAutoFillMode` | No auto-fill modes |
| **Continue Button** | Optional `onContinue` callback | No continue button |
| **Auto-Search** | Auto-triggers in `autoFillMode` | Manual search only |
| **Header** | Minimalistic with close button | Full navbar with sidebar toggle |
| **Use Case** | Embedded in flows | Standalone search page |

| Aspect | StaysWidget | StaysTab |
|--------|-------------|----------|
| **Component Type** | Widget (embeddable) | Tab (standalone page) |
| **Visibility** | Controlled by `isVisible` prop | Always visible when route active |
| **Props** | `initialCity`, `initialCheckInDate`, `initialCheckOutDate` | No initial props |
| **Auto-Fill** | `autoFillMode` only | No auto-fill modes |
| **Continue Button** | Optional `onContinue` callback | No continue button |
| **Auto-Search** | Auto-triggers in `autoFillMode` | Manual search only |
| **Header** | Minimalistic with close button | Full navbar with sidebar toggle |
| **Use Case** | Embedded in flows | Standalone search page |

### Code Reuse

**Shared Components**:
- `CitySelector` - Identical implementation
- `DatePicker` - Identical implementation (FlightsWidget has `disabled` prop)
- `ClassSelector` - Identical implementation
- `TravellerSelector` - Identical implementation (FlightsWidget only)
- `StarRatingSelector` - Identical implementation (StaysWidget only)
- `TransportCard` - Identical implementation
- `StayCard` - Identical implementation

**Shared Utilities**:
- `parseUtilityFlightData()` - Identical
- `parseUtilityTrainData()` - Identical
- `parseFlightData()` - Identical
- `parseTrainData()` - Identical
- `getConveyanceDataForWidget()` - Same pre-fetch logic
- `getPreFetchedStaysData()` - Same pre-fetch logic

**Shared API Logic**:
- Same API endpoints
- Same request/response structures
- Same error handling
- Same parallel execution strategy

---

## Auto-Fill Modes

### FlightsWidget Auto-Fill Modes

#### Mode 1: Full Auto-Fill (`autoFillMode = true`)

**Field States**:
```typescript
<CitySelector
  value={from}
  onChange={setFrom}
  disabled={autoFillMode || partialAutoFillMode}  // FROM disabled
/>

<CitySelector
  value={to}
  onChange={setTo}
  disabled={autoFillMode}  // TO disabled only in full mode
/>

<DatePicker
  value={departureDate}
  onChange={setDepartureDate}
  disabled={autoFillMode || partialAutoFillMode}  // Date disabled
/>
```

**Search Button**:
```typescript
<button
  onClick={handleSearch}
  disabled={autoFillMode && !partialAutoFillMode}  // Disabled in full mode
>
  Smart Search
</button>
```

**Auto-Search Trigger**:
- Automatically triggers when `isVisible`, `autoFillMode`, and all fields (`from`, `to`, `departureDate`) are ready
- 500ms delay before triggering
- Only triggers once per visibility cycle

#### Mode 2: Partial Auto-Fill (`partialAutoFillMode = true`)

**Field States**:
- **FROM**: Disabled (pre-filled)
- **TO**: **Enabled** (user can select)
- **Date**: Disabled (pre-filled)
- **Search Button**: Enabled (user must click)

**Auto-Search**: **Disabled** (commented out in code)

**Rationale**: Allows user to review and select destination before searching.

### StaysWidget Auto-Fill Mode

#### Single Mode: Full Auto-Fill (`autoFillMode = true`)

**Field States**:
```typescript
{autoFillMode ? (
  // Fixed display box
  <div className="bg-gray-100/70 cursor-not-allowed">
    <div>{city}</div>
    <div className="text-[10px]">Fixed city</div>
  </div>
) : (
  <CitySelector value={city} onChange={setCity} />
)}
```

**Auto-Search Trigger**:
- Automatically triggers when widget becomes visible (`isVisible = true`)
- Requires: `autoFillMode`, `city`, `checkInDate`, `checkOutDate`, `userId`
- Uses `hasAutoSearched` flag to prevent duplicate searches
- Resets flag when widget closes (`isVisible = false`)

---

## API Call Flow

### FlightsWidget API Flow

**Identical to ConveyanceTab** - See detailed documentation in [CONVEYANCE_STAYS_WIDGETS_DOCUMENTATION.md](./CONVEYANCE_STAYS_WIDGETS_DOCUMENTATION.md#conveyancetab-widget).

**Summary**:
1. Pre-fetch check (if `userId` available)
2. City data enrichment (`findPlaceByCity`)
3. 3 parallel API calls:
   - `/api/utility/conveyance` (flights)
   - `/api/utility/conveyance` (trains)
   - `/api/conveyance` (AI recommendations)
4. Progressive result rendering

### StaysWidget API Flow

**Identical to StaysTab** - See detailed documentation in [CONVEYANCE_STAYS_WIDGETS_DOCUMENTATION.md](./CONVEYANCE_STAYS_WIDGETS_DOCUMENTATION.md#staystab-widget).

**Summary**:
1. Pre-fetch check (if `userId` available)
2. Date formatting and place data enrichment
3. 2 parallel API calls:
   - `/api/stay` (AI recommendations)
   - `/api/utility/stay` (utility stays)
4. Progressive result rendering

---

## Rendering Process

### FlightsWidget Rendering Flow

```
1. Component receives props (initialFromCity, initialToCity, initialDepartureDate)
2. useEffect updates state from initial props
3. If autoFillMode:
   a. Fields are disabled
   b. Auto-search triggers when all fields ready
4. User interaction (if not autoFillMode):
   a. User selects cities/dates
   b. User clicks "Smart Search"
5. handleSearch() executes:
   a. Check pre-fetched data
   b. Make parallel API calls
   c. Update results progressively
6. Results display:
   a. AI Recommendations section
   b. Other Travel Options section
7. User selects conveyance option
8. Continue button becomes enabled
9. User clicks Continue → onContinue(selectedConveyanceData)
```

### StaysWidget Rendering Flow

```
1. Component receives props (initialCity, initialCheckInDate, initialCheckOutDate)
2. useEffect updates state from initial props
3. If autoFillMode:
   a. Fields show fixed display boxes
   b. Auto-search triggers when widget becomes visible
4. User interaction (if not autoFillMode):
   a. User selects city/dates
   b. User clicks "Smart Search"
5. handleSearch() executes:
   a. Check pre-fetched data
   b. Make parallel API calls
   c. Update results progressively
6. Results display:
   a. AI Recommendations section
   b. Other Stay Options section (if results exist)
7. User selects stay option
8. Continue button becomes enabled
9. User clicks Continue → onContinue(selectedStayData)
```

### Conditional Rendering Patterns

#### FlightsWidget Field Rendering
```typescript
// FROM field
disabled={autoFillMode || partialAutoFillMode}

// TO field
disabled={autoFillMode}  // Only disabled in full auto-fill

// Date field
disabled={autoFillMode || partialAutoFillMode}

// Search button
disabled={autoFillMode && !partialAutoFillMode}
```

#### StaysWidget Field Rendering
```typescript
// City field
{autoFillMode ? (
  <FixedDisplayBox value={city} label="Fixed city" />
) : (
  <CitySelector value={city} onChange={setCity} />
)}

// Date fields - same pattern
```

---

## Integration Patterns

### Using FlightsWidget in a Parent Component

```typescript
const [showFlightsWidget, setShowFlightsWidget] = useState(false);
const [selectedConveyance, setSelectedConveyance] = useState<TransportOption | null>(null);

<FlightsWidget
  isVisible={showFlightsWidget}
  onToggle={() => setShowFlightsWidget(false)}
  initialFromCity="New Delhi"
  initialToCity="Mumbai"
  initialDepartureDate="2025-10-24"
  autoFillMode={true}
  partialAutoFillMode={false}
  onContinue={(data) => {
    setSelectedConveyance(data);
    setShowFlightsWidget(false);
    // Proceed to next step
  }}
  userId={userId}
  sessionId={sessionId}
  currentDayNumber={1}
/>
```

### Using StaysWidget in a Parent Component

```typescript
const [showStaysWidget, setShowStaysWidget] = useState(false);
const [selectedStay, setSelectedStay] = useState<StayOption | null>(null);

<StaysWidget
  isVisible={showStaysWidget}
  onToggle={() => setShowStaysWidget(false)}
  initialCity="Bangalore"
  initialCheckInDate="2025-10-24"
  initialCheckOutDate="2025-10-26"
  autoFillMode={true}
  onContinue={(data) => {
    setSelectedStay(data);
    setShowStaysWidget(false);
    // Proceed to next step
  }}
  userId={userId}
  sessionId={sessionId}
  currentDayNumber={1}
/>
```

### Integration with DateSelectorWidget

**Common Pattern**:
1. DateSelectorWidget collects trip dates
2. User selects a day
3. FlightsWidget/StaysWidget opens with pre-filled dates
4. User selects conveyance/stay
5. Continue button proceeds to next day or completes flow

**Example Flow**:
```typescript
// In DateSelectorWidget or parent component
const handleDaySelect = (dayNumber: number, date: string, fromCity: string, toCity: string) => {
  setCurrentDay(dayNumber);
  setShowFlightsWidget(true);
  // Widget receives:
  // - initialFromCity: fromCity
  // - initialToCity: toCity
  // - initialDepartureDate: date
  // - autoFillMode: true
};

const handleConveyanceContinue = (conveyanceData: TransportOption) => {
  // Save conveyance for this day
  saveDayConveyance(currentDay, conveyanceData);
  // Move to stays widget or next day
  setShowFlightsWidget(false);
  setShowStaysWidget(true);
};
```

---

## Data Structures

### FlightsWidget Data Types

**Identical to ConveyanceTab** - See [CONVEYANCE_STAYS_WIDGETS_DOCUMENTATION.md](./CONVEYANCE_STAYS_WIDGETS_DOCUMENTATION.md#data-structures).

**Additional Widget-Specific**:
```typescript
// Enriched transport option passed to onContinue
interface EnrichedTransportOption extends TransportOption {
  from_city: string;      // Added in handleBooking()
  to_city: string;        // Added in handleBooking()
  is_required: boolean;   // Added in handleBooking()
}
```

### StaysWidget Data Types

**Identical to StaysTab** - See [CONVEYANCE_STAYS_WIDGETS_DOCUMENTATION.md](./CONVEYANCE_STAYS_WIDGETS_DOCUMENTATION.md#data-structures).

**No additional enrichment** - `StayOption` is passed directly to `onContinue`.

---

## Key Implementation Details

### FlightsWidget Auto-Search Logic

**Full Auto-Fill Mode** (Lines 1662-1686):
```typescript
useEffect(() => {
  if (
    isVisible &&
    autoFillMode &&
    from &&
    to &&
    departureDate &&
    !showResults
  ) {
    const timer = setTimeout(async () => {
      await handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }
}, [isVisible, autoFillMode, from, to, departureDate, showResults]);
```

**Partial Auto-Fill Mode**: Auto-search is **disabled** (commented out) to allow user review.

### StaysWidget Auto-Search Logic

**Auto-Fill Mode** (Lines 660-670):
```typescript
useEffect(() => {
  if (
    isVisible &&
    autoFillMode &&
    !hasAutoSearched &&
    city &&
    checkInDate &&
    checkOutDate &&
    userId
  ) {
    setHasAutoSearched(true);
    handleSearch();
  }
}, [isVisible, autoFillMode, hasAutoSearched, city, checkInDate, checkOutDate, userId]);
```

**Reset Logic** (Lines 673-677):
```typescript
useEffect(() => {
  if (!isVisible) {
    setHasAutoSearched(false); // Reset when widget closes
  }
}, [isVisible]);
```

### Continue Button Implementation

**FlightsWidget** (Lines 2383-2411):
```typescript
{onContinue && (
  <div className="absolute bottom-6 right-6 z-20">
    <button
      onClick={() => onContinue(selectedConveyanceData || undefined)}
      disabled={!bookedOption}
      className={bookedOption ? "enabled-styles" : "disabled-styles"}
    >
      Continue
    </button>
  </div>
)}
```

**StaysWidget** (Lines 1153-1178):
```typescript
{onContinue && (
  <div className="absolute bottom-6 right-6 z-20">
    <button
      onClick={() => onContinue(selectedStayData || undefined)}
      disabled={!bookedOption}
      className={bookedOption ? "enabled-styles" : "disabled-styles"}
    >
      Continue
    </button>
  </div>
)}
```

---

## Performance Optimizations

### Widget-Specific Optimizations

1. **Conditional Rendering**: Widget only renders when `isVisible = true`
2. **Auto-Search Debouncing**: 500ms delay in FlightsWidget auto-search
3. **Auto-Search Flag**: Prevents duplicate searches in StaysWidget
4. **Pre-fetch Priority**: Checks cached data before API calls
5. **Progressive Rendering**: Results display as they arrive

### Shared Optimizations

1. **Parallel API Execution**: `Promise.allSettled()` for non-blocking calls
2. **Debounced City Search**: 300ms debounce in CitySelector
3. **Conditional Result Sections**: Utility section only renders when data exists
4. **Memoization Opportunities**: Consider `useMemo` for filtered results

---

## Error Handling

### Widget-Specific Error Handling

**Identical to Tab Components** - See [CONVEYANCE_STAYS_WIDGETS_DOCUMENTATION.md](./CONVEYANCE_STAYS_WIDGETS_DOCUMENTATION.md#error-handling).

**Additional Considerations**:
- **Visibility Toggle Errors**: Widget gracefully handles rapid show/hide toggles
- **Auto-Search Errors**: Auto-search failures don't block widget interaction
- **Continue Button**: Disabled state prevents submission without selection

---

## Testing Considerations

### FlightsWidget Test Scenarios

1. **Full Auto-Fill Mode**:
   - Verify fields are disabled
   - Verify auto-search triggers
   - Verify search button is disabled
   - Verify results display correctly

2. **Partial Auto-Fill Mode**:
   - Verify FROM and DATE are disabled
   - Verify TO is enabled
   - Verify auto-search does NOT trigger
   - Verify manual search works

3. **Continue Button**:
   - Verify disabled when no selection
   - Verify enabled after selection
   - Verify correct data passed to callback

4. **Initial Props**:
   - Verify fields populate from props
   - Verify updates when props change

### StaysWidget Test Scenarios

1. **Auto-Fill Mode**:
   - Verify fixed display boxes render
   - Verify auto-search triggers on visibility
   - Verify `hasAutoSearched` prevents duplicates

2. **Continue Button**:
   - Verify disabled when no selection
   - Verify enabled after selection
   - Verify correct data passed to callback

3. **Initial Props**:
   - Verify fields populate from props
   - Verify updates when props change

---

## Future Enhancements

### Potential Improvements

1. **Loading States**: More granular loading indicators per section
2. **Error Retry**: Automatic retry for failed API calls
3. **Result Caching**: More aggressive client-side caching
4. **Accessibility**: ARIA labels and keyboard navigation
5. **Animation**: Smooth transitions when widget shows/hides
6. **Validation**: Real-time field validation feedback
7. **Pagination**: For large result sets
8. **Sorting/Filtering**: Advanced result manipulation

---

## Conclusion

Both `FlightsWidget` and `StaysWidget` are well-architected, reusable components that:

- **Support multiple integration patterns** through flexible props
- **Provide auto-fill capabilities** for streamlined workflows
- **Maintain code consistency** with their Tab counterparts
- **Offer progressive rendering** for better UX
- **Handle errors gracefully** with partial results support

The widgets are production-ready and provide excellent developer experience through clear prop interfaces and comprehensive auto-fill modes.

