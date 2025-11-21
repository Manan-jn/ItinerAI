# Booking Components Structure

## Component Hierarchy

```
BookingWidget (Main Container)
├── Header (Minimalistic)
│   ├── Trip Title & Days
│   └── Close Button
│
├── Content (Two Columns)
│   │
│   ├── Left Column (55%) - Travel Activities
│   │   ├── Section Header
│   │   │   ├── Column Title
│   │   │   └── Book All Button ⭐ NEW
│   │   │
│   │   └── Travel Cards Container (Scrollable)
│   │       └── Travel Card (Minimalistic) ⭐ REDESIGNED
│   │           ├── Card Header
│   │           │   ├── Conveyance Badge
│   │           │   ├── Day Badge
│   │           │   └── Booked Indicator ✓
│   │           │
│   │           ├── Travel Route
│   │           │   ├── From Location
│   │           │   ├── Arrow (→)
│   │           │   └── To Location
│   │           │
│   │           ├── Description (2 lines max)
│   │           │
│   │           └── Footer
│   │               ├── Fare Amount
│   │               └── Book Button
│   │
│   └── Right Column (45%) - Budget Panel ⭐ NEW COMPONENT
│       ├── Panel Title
│       │
│       ├── View Tabs (3 modes)
│       │   ├── Overview
│       │   ├── By Category
│       │   └── By Day
│       │
│       └── Panel Content (Scrollable)
│           │
│           ├── OVERVIEW MODE
│           │   ├── Summary Card
│           │   │   ├── Total Spending
│           │   │   ├── Your Budget
│           │   │   ├── Remaining
│           │   │   └── Progress Bar (Green/Red)
│           │   │
│           │   ├── Top 3 Categories
│           │   │   └── Category Items (Ranked)
│           │   │
│           │   └── Mini Daily Chart
│           │       └── Bar Chart (Per Day)
│           │
│           ├── CATEGORY MODE
│           │   ├── Donut Chart (SVG)
│           │   │   ├── Pie Slices (Color-coded)
│           │   │   └── Center Total
│           │   │
│           │   └── Category List
│           │       └── Category Bar Item
│           │           ├── Category Info
│           │           ├── Amount
│           │           └── Progress Bar (% of total)
│           │
│           └── DAY-WISE MODE
│               ├── Day Bar Chart
│               │   └── Day Chart Item
│               │       ├── Bar (Height = spending)
│               │       ├── Amount (on top)
│               │       └── Day Label
│               │
│               └── Day Breakdown Cards
│                   └── Day Card
│                       ├── Day Header (Day # + Total)
│                       └── Category Items
│                           └── Icon + Label + Amount
│
└── Continue Button (Shows when all booked)
    └── Centered, Full-width button


Supporting Components
└── BookingConfirmationModal
    ├── Activity Title
    ├── Fare Amount
    ├── Cancel Button
    └── Confirm Button
```

## State Management

### BookingWidget State
```typescript
// Booking tracking
bookedActivities: Set<number>         // Track which items are booked
isBookingAll: boolean                 // Book All animation state
selectedActivity: { index, title, fare } | null

// Budget data
userBudget: number | null             // From /api/memory/get
budgetBreakdown: {
  overall: Record<ActivityType, number>
  dayWise: Record<dayNum, Record<ActivityType, number>>
}
totalBudget: number                   // Computed from breakdown

// Modal
showModal: boolean
```

### BudgetPanel State
```typescript
viewMode: "overview" | "category" | "daywise"
```

### StaysWidget State (Enhanced)
```typescript
selectedStayData: EnrichedStayData | null  // Includes pricing
bookedOption: string | null
// ... existing states
```

## Props Flow

### BookingWidget Props
```typescript
interface BookingWidgetProps {
  isVisible: boolean
  onToggle: () => void
  itinerariesData: any[]              // Contains schedule with fare
  tripTitle: string
  totalDays: number
  onContinue?: () => void
  userId?: string                     // For /api/memory/get ⭐ NEW
  sessionId?: string                  // For /api/memory/get ⭐ NEW
}
```

### BudgetPanel Props
```typescript
interface BudgetPanelProps {
  budgetBreakdown: {
    overall: Partial<Record<ActivityType, number>>
    dayWise: Record<number, Partial<Record<ActivityType, number>>>
  }
  totalBudget: number
  userBudget: number | null           // From API
  categoryIcons: Record<ActivityType, string>
  categoryLabels: Record<ActivityType, string>
  totalDays: number
}
```

## Data Extraction Logic

### Travel Activities
```typescript
// Extract from itinerariesData
itinerariesData.forEach(day => {
  day.schedule?.forEach(item => {
    if (item.activity_type === "travel" && item.conveyance_type !== "walk") {
      // Create TravelActivity object
    }
  })
})
```

### Budget Breakdown
```typescript
// Extract all fares by activity_type
itinerariesData.forEach(day => {
  day.schedule?.forEach(item => {
    if (item.fare && item.activity_type) {
      // Overall
      breakdown[activityType] += item.fare

      // Day-wise
      dayWiseBreakdown[day.day_number][activityType] += item.fare
    }
  })
})
```

## Animation Sequences

### Book All Button
```
User clicks "Book All"
  ↓
Button state: "Booking..." (Orange, Spinner)
  ↓
For each travel activity (300ms delay):
  → Mark as booked
  → Card gets green tint
  → Checkmark appears
  ↓
All booked (Total: ~2 seconds)
  ↓
Button state: "All Booked" (Green, Checkmark)
  ↓
Continue button appears
```

### Individual Booking
```
User clicks "Book" on card
  ↓
Modal appears
  ↓
User confirms
  ↓
Modal closes
  ↓
Card marked as booked
  → Green tint applied
  → Booked indicator shows
  → Button changes to "Booked" (Green)
```

## Color Coding

### Status Colors
- **Default**: White background, light borders
- **Hover**: Blue border, shadow
- **Booked**: Green tint background, green border
- **Over Budget**: Red indicators
- **Under Budget**: Green indicators

### Button States
- **Book All (Default)**: Blue gradient
- **Book All (Booking)**: Orange gradient + Spinner
- **Book All (Complete)**: Green gradient + Checkmark
- **Individual Book**: Purple gradient
- **Individual Booked**: Green gradient

## Responsive Breakpoints

```css
/* Desktop: Default layout */
@media (min-width: 1025px) {
  grid-template-columns: 55% 45%;
}

/* Tablet */
@media (max-width: 1024px) {
  grid-template-columns: 1fr;  // Stacked
  .budget-column { max-height: 400px; }
}

/* Mobile */
@media (max-width: 640px) {
  padding: 12px;
  .continue-button { width: 100%; }
}
```

## sessionStorage Keys

```
stay_{userId}_{sessionId}   // Stores EnrichedStayData
```

## API Calls Timeline

```
Component Mount
  ↓
Fetch User Budget (/api/memory/get)
  ↓
Render with budget data
  ↓
User books stays (StaysWidget)
  ↓
Store in sessionStorage
  ↓
Navigate to BookingWidget
  ↓
Can retrieve stay data if needed
```

## File Structure

```
src/app/components/
├── BookingWidget.tsx              ⭐ REDESIGNED
│   └── Minimalistic design
│   └── Book All button
│   └── Budget fetching
│
├── BudgetPanel.tsx                ⭐ NEW
│   └── 3 view modes
│   └── Interactive charts
│   └── Budget comparison
│
├── StaysWidget.tsx                ⭐ ENHANCED
│   └── Price tracking
│   └── sessionStorage integration
│
├── BookingConfirmationModal.tsx   (Existing)
│
└── FlightsWidget.tsx              (Existing)

src/app/utils/
└── stayDataHelper.ts              ⭐ NEW
    └── getStoredStayData()
    └── storeStayData()
    └── clearStayData()
    └── calculateStayTotal()
```

## Performance Considerations

1. **useMemo** for:
   - `travelActivities` extraction
   - `budgetBreakdown` calculation
   - `totalBudget` computation
   - `dayWiseTotals` calculation

2. **Debounced animations**:
   - 300ms per booking in "Book All"
   - Prevents UI freezing

3. **Lazy loading**:
   - Budget fetched only when widget visible
   - Charts render only in active view mode

4. **Efficient scrolling**:
   - Custom scrollbar styling
   - Smooth scroll behavior
