# Booking Component Implementation Plan

## Overview
Implement a booking/finalization flow after all itinerary days are generated, with a Continue button in ItineraryWidget that leads to a beautiful booking summary component.

## Implementation Steps

### 1. **MessageResponseOverlay Fix** ✅ ALREADY DONE
- Status: The overlay is already correctly wrapped with `activeSection === "chat" && (showFlashcards || showItinerary)` at line 5069
- No changes needed

### 2. Add Continue Button to ItineraryWidget

**Location**: `/Users/mananjain/Downloads/genai-hack-final/frontend/hack2skill-genai/src/app/components/ItineraryWidget.tsx`

**Requirements**:
- Position: Bottom-right corner, next to chatbox
- Styling: Glassmorphic theme matching current design
- State:
  - Enabled: When `itinerariesGenerated.length === totalDays`
  - Disabled: Otherwise (blurred appearance)
- Props needed from parent:
  - `allDaysGenerated: boolean`
  - `onContinue: () => void`

**Visual Design**:
```tsx
<button
  disabled={!allDaysGenerated}
  onClick={onContinue}
  className={glassmorphic + disabled-blur}
>
  Continue
  <ArrowRightIcon />
</button>
```

### 3. Create Firestore Storage Function

**File**: `/Users/mananjain/Downloads/genai-hack-final/frontend/hack2skill-genai/src/app/utils/itineraryStorage.ts`

**Function**: `finalizeAndStoreCompleteItinerary`

```typescript
async function finalizeAndStoreCompleteItinerary(
  userId: string,
  sessionId: string,
  tripTitle: string,
  tripDate: string,
  totalDays: number,
  itinerariesGenerated: DayItineraryData[]
): Promise<void> {
  const itineraryRef = doc(db, "generated_itineraries", userId);

  const completeItinerary: StoredItinerary = {
    userId,
    sessionId,
    tripTitle,
    tripDate,
    totalDays,
    days: itinerariesGenerated.sort((a, b) => a.day_number - b.day_number),
    lastUpdated: new Date().toISOString(),
    status: "finalized" // New field
  };

  await setDoc(itineraryRef, completeItinerary);
}
```

### 4. Create BookingWidget Component

**File**: `/Users/mananjain/Downloads/genai-hack-final/frontend/hack2skill-genai/src/app/components/BookingWidget.tsx`

**Props**:
```typescript
interface BookingWidgetProps {
  isVisible: boolean;
  onToggle: () => void;
  itinerariesData: DayItineraryData[];
  tripTitle: string;
  totalDays: number;
}
```

**Layout Structure**:
```
┌─────────────────────────────────────────────────────────┐
│                    Header Section                       │
│  "Trip Summary" + Trip Title + Toggle Button           │
├──────────────────────────┬──────────────────────────────┤
│   Left Column (60%)      │   Right Column (40%)         │
│                          │                              │
│   Travel Cards           │   Budget Breakdown           │
│   ┌──────────────────┐  │   ┌──────────────────────┐  │
│   │ Flight           │  │   │ 🍽️ Eat: ₹5,000     │  │
│   │ Mumbai → Leh     │  │   │ ✈️ Travel: ₹27,000  │  │
│   │      [Book]      │  │   │ 🏛️ Visit: ₹2,000    │  │
│   └──────────────────┘  │   │ 🛍️ Shopping: ₹1,500 │  │
│   ┌──────────────────┐  │   │ ─────────────────── │  │
│   │ Cab              │  │   │ Total: ₹35,500      │  │
│   │ Airport → Hotel  │  │   └──────────────────────┘  │
│   │      [Book]      │  │                              │
│   └──────────────────┘  │                              │
└──────────────────────────┴──────────────────────────────┘
```

**Data Processing Logic**:

```typescript
// 1. Extract all travel activities
const travelActivities = itinerariesData.flatMap(day =>
  day.schedule?.filter(item => item.activity_type === 'travel') || []
);

// 2. Calculate cumulative fares by activity_type
const budgetBreakdown = itinerariesData.reduce((acc, day) => {
  day.schedule?.forEach(item => {
    if (item.fare && item.activity_type) {
      acc[item.activity_type] = (acc[item.activity_type] || 0) + item.fare;
    }
  });
  return acc;
}, {} as Record<ActivityType, number>);

// 3. Calculate total
const totalBudget = Object.values(budgetBreakdown).reduce((a, b) => a + b, 0);
```

**Activity Type Enum**:
```typescript
type ActivityType =
  | 'travel'
  | 'visit'
  | 'eat'
  | 'rest'
  | 'shopping'
  | 'event'
  | 'adventure'
  | 'leisure'
  | 'free_time'
  | 'other';
```

**Category Icons Map**:
```typescript
const categoryIcons = {
  travel: '✈️',
  eat: '🍽️',
  visit: '🏛️',
  rest: '🏨',
  shopping: '🛍️',
  event: '🎭',
  adventure: '🏔️',
  leisure: '🎨',
  free_time: '⏰',
  other: '📝'
};
```

### 5. Create FinalizeLoader Component

**File**: `/Users/mananjain/Downloads/genai-hack-final/frontend/hack2skill-genai/src/app/components/FinalizeLoader.tsx`

Similar to `TripLoader` and `EndResponseLoader` but with specific messages:

```typescript
const finalizationMessages = [
  "Finalizing your itinerary...",
  "Calculating total costs...",
  "Preparing booking summary...",
  "Almost ready..."
];
```

### 6. Update FlightsPageAuthenticated Flow

**File**: `/Users/mananjain/Downloads/genai-hack-final/frontend/hack2skill-genai/src/app/flights/[id]/FlightsPageAuthenticated.tsx`

**New States**:
```typescript
const [showBooking, setShowBooking] = useState(false);
const [showFinalizeLoader, setShowFinalizeLoader] = useState(false);
```

**New Handler**:
```typescript
const handleContinueToBooking = async () => {
  try {
    // Show loader
    setShowFinalizeLoader(true);

    // Store complete itinerary in Firestore
    await finalizeAndStoreCompleteItinerary(
      userId,
      sessionId,
      selectedTrip.trip_title,
      selectedTrip.trip_date,
      selectedTrip.no_of_days,
      itinerariesGenerated
    );

    // Wait for loader animation (3 seconds)
    setTimeout(() => {
      setShowFinalizeLoader(false);
      setShowItinerary(false);
      setShowBooking(true);
    }, 3000);

  } catch (error) {
    console.error("Error finalizing itinerary:", error);
    alert("Failed to finalize itinerary. Please try again.");
    setShowFinalizeLoader(false);
  }
};
```

**Conditional Rendering**:
```tsx
{showBooking ? (
  <div className="flex-1 overflow-hidden">
    <BookingWidget
      isVisible={showBooking}
      onToggle={() => setShowBooking(false)}
      itinerariesData={itinerariesGenerated}
      tripTitle={selectedTrip?.trip_title || ""}
      totalDays={selectedTrip?.no_of_days || 0}
    />
  </div>
) : showItinerary ? (
  <div className="flex-1 overflow-hidden">
    <ItineraryWidget
      isVisible={showItinerary}
      onToggle={() => setShowItinerary(false)}
      // ... existing props
      allDaysGenerated={itinerariesGenerated.length === selectedTrip?.no_of_days}
      onContinue={handleContinueToBooking}
    />
  </div>
) : (
  // ... existing chat content
)}
```

### 7. Update ItineraryWidget Props

**Add to ItineraryWidgetProps**:
```typescript
export interface ItineraryWidgetProps {
  // ... existing props
  allDaysGenerated?: boolean;
  onContinue?: () => void;
}
```

## Component Styling Guidelines

### Glassmorphic Button (Continue Button)
```css
.continue-button {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.6));
  backdrop-filter: blur(32px) saturate(200%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
  padding: 12px 24px;
  font-weight: 600;
  transition: all 0.3s;
}

.continue-button:disabled {
  opacity: 0.5;
  filter: blur(2px);
  cursor: not-allowed;
}

.continue-button:not(:disabled):hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.85), rgba(37, 99, 235, 0.75));
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
}
```

### Travel Card Styling
```css
.travel-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.7));
  backdrop-filter: blur(24px);
  border-radius: 16px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.travel-card:hover {
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
  transform: translateY(-4px);
}
```

### Budget Card Styling
```css
.budget-card {
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(219, 39, 119, 0.05));
  backdrop-filter: blur(24px);
  border-radius: 16px;
  border: 1px solid rgba(147, 51, 234, 0.2);
  padding: 24px;
}

.budget-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(147, 51, 234, 0.1);
}

.budget-total {
  font-size: 1.5rem;
  font-weight: 700;
  color: #9333ea;
  padding-top: 16px;
  border-top: 2px solid rgba(147, 51, 234, 0.3);
}
```

## File Structure

```
src/app/
├── components/
│   ├── BookingWidget.tsx          # NEW - Main booking component
│   ├── FinalizeLoader.tsx         # NEW - Loading screen for finalization
│   └── ItineraryWidget.tsx        # MODIFIED - Add continue button
├── utils/
│   └── itineraryStorage.ts        # MODIFIED - Add finalization function
└── flights/[id]/
    └── FlightsPageAuthenticated.tsx  # MODIFIED - Add booking flow
```

## Testing Checklist

- [ ] Continue button appears in ItineraryWidget bottom section
- [ ] Continue button is disabled when not all days are generated
- [ ] Continue button enables when all days are generated
- [ ] Clicking Continue shows finalize loader for 3 seconds
- [ ] Itineraries are correctly stored in Firestore `generated_itineraries` collection
- [ ] BookingWidget renders after loader completes
- [ ] Travel cards show all activities with `activity_type: 'travel'`
- [ ] Travel cards display from_location → to_location correctly
- [ ] Budget breakdown shows all categories with cumulative fares
- [ ] Budget breakdown calculates correct totals
- [ ] All styling is consistent with glassmorphic theme
- [ ] Components are responsive
- [ ] Toggle button works to close booking widget

## Implementation Priority

1. ✅ **Priority 1**: Fix MessageResponseOverlay (ALREADY DONE)
2. **Priority 2**: Add Continue button to ItineraryWidget
3. **Priority 3**: Create FinalizeLoader component
4. **Priority 4**: Add Firestore finalization function
5. **Priority 5**: Create BookingWidget component
6. **Priority 6**: Integrate into FlightsPageAuthenticated flow
7. **Priority 7**: Testing and polish

## Estimated Time: 3-4 hours for complete implementation
