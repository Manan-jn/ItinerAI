# Non-Flights Related Code - TEMP FOLDER

This folder contains code that is **NOT related to the `/flights` route** and can be safely deleted or archived.

## 📁 Folder Structure

### 1. `test_pages/`

Test and development pages that are not part of the production flights functionality.

**Contents:**

- `test-dashboard/` - Dark theme dashboard test page
- `test-dashboard-2/` - Dark theme with ChatModal test page

**Status:** ❌ Can be deleted - These are development/testing pages only

---

### 2. `unused_components/`

React components that are not used anywhere in the flights route or referenced by any active code.

**Contents:**

- `LandingPage.tsx` - Only used in root page.tsx (moved to legacy_routes)
- `ChatModal.tsx` - Only used in test-dashboard-2
- `AnimatedLoader.tsx` - Not used anywhere
- `APILoader.tsx` - Not used anywhere
- `BudgetSelector.tsx` - Not used anywhere
- `ConveyanceWidget.tsx` - Not used anywhere
- `DatePicker.tsx` - Not used anywhere
- `ModalLoader.tsx` - Not used anywhere
- `ModalLoaderWhite.tsx` - Not used anywhere
- `PeopleSelector.tsx` - Not used anywhere
- `PlacesSelector.tsx` - Not used anywhere
- `ProcessingIndicator.tsx` - Not used anywhere
- `SessionDebug.tsx` - Not used (different from SessionDebugFlights)
- `TabContents.tsx` - Not used anywhere
- `TabPanel.tsx` - Not used anywhere
- `TravelItinerary.tsx` - Not used anywhere
- `WeatherWidget.tsx` - Not used anywhere
- `flashcards/` - Folder (if exists, not used)

**Status:** ❌ Can be deleted - No active references found

---

### 3. `old_auth_components/`

Older versions of authentication components that have been replaced by "White" themed versions.

**Contents:**

- `LoginModal.tsx` - Old version (replaced by LoginModalWhite.tsx)
- `SignupModal.tsx` - Old version (replaced by SignupModalWhite.tsx)
- `OnboardingModal.tsx` - Old version (replaced by OnboardingModalWhite.tsx)

**Status:** ❌ Can be deleted - Replaced by newer White-themed versions

---

### 4. `legacy_routes/`

Routes that have been deprecated, redirect to flights, or are not part of the flights functionality.

**Contents:**

- `dashboard/` - Redirects to `/flights/[uid]`
- `settings/` - Redirects to `/flights/settings`
- `root_page.tsx` - Root landing page (original page.tsx)

**Status:** ⚠️ Review before deleting

- `dashboard/` and `settings/` can be deleted (just redirects)
- `root_page.tsx` - Check if root route is still needed for marketing/landing

---

### 5. `sample_data/`

JSON sample/test data files that are not used in production.

**Contents:**

- `flights.json` - Sample flight data
- `flights_response.json` - Sample API response
- `itinerary_data.json` - Sample itinerary data
- `places.json` - Sample places data
- `trip_suggestion.json` - Sample trip suggestions
- `public_flights.json` - Public folder sample data (from public/flights.json)

**Status:** ❌ Can be deleted - These are development/testing data files

---

### 6. `docs/`

Implementation and design documentation that may be outdated.

**Contents:**

- `ITINERARY_IMPLEMENTATION.md` - Implementation notes for itinerary
- `ITINERARY_REDESIGN_SUMMARY.md` - Redesign summary for itinerary

**Status:** ⚠️ Archive - Keep for reference but not needed in main codebase

---

## 📊 Summary Statistics

### Files Moved

- **Test Pages:** 2 routes
- **Unused Components:** 19 files
- **Old Auth Components:** 3 files
- **Legacy Routes:** 3 routes
- **Sample Data:** 6 JSON files
- **Documentation:** 2 MD files

**Total:** ~35 files moved

### Space Saved

Approximate cleanup:

- Test pages: ~2,600 lines
- Unused components: ~4,000+ lines (estimated)
- Old auth: ~800 lines
- Sample data: ~1,500 lines
- **Total:** ~9,000+ lines of code cleaned up

---

## ✅ What to Do Next

### Option 1: Delete Everything

```bash
cd /Users/mananjain/Downloads/genai-hack-final/genai-hack/hack2skill-genai
rm -rf temp_non_flights_code/
```

### Option 2: Archive for Reference

```bash
# Create a zip archive
cd /Users/mananjain/Downloads/genai-hack-final/genai-hack/hack2skill-genai
zip -r archive_non_flights_$(date +%Y%m%d).zip temp_non_flights_code/
# Then delete the folder
rm -rf temp_non_flights_code/
```

### Option 3: Review Before Deleting

1. Review `legacy_routes/root_page.tsx` - Check if you need a landing page
2. Review `docs/` - Archive if needed for reference
3. Delete all other folders

---

## 🔍 Verification

To verify these files are not used in flights route:

```bash
# Check if any flights files import these components
cd /Users/mananjain/Downloads/genai-hack-final/genai-hack/hack2skill-genai
grep -r "LandingPage" src/app/flights/
grep -r "ChatModal" src/app/flights/
grep -r "AnimatedLoader" src/app/flights/
# etc...
```

All searches should return **no results** (or only results in temp_non_flights_code).

---

## 📝 Notes

- All files in this folder have been analyzed and confirmed NOT to be used by the `/flights` route
- The `/flights` route uses only:

  - `FlightsWidget` ✅
  - `SessionDebugFlights` ✅
  - Shared components: Dashboard, FlashcardsWidget, ItineraryWidget, Auth components (White versions)
  - Shared contexts: AuthContext
  - Shared utils: sessionManager

- Deleting this folder will NOT break the flights functionality
- Make sure to test the application after cleanup to confirm

---

## 🎯 Flights Route Core Files (KEPT in src/)

These were NOT moved and remain in the codebase:

### Routes

- `src/app/flights/page.tsx`
- `src/app/flights/[id]/page.tsx`
- `src/app/flights/[id]/FlightsPageAuthenticated.tsx`
- `src/app/flights/settings/page.tsx`

### Flights-Specific Components

- `src/app/components/FlightsWidget.tsx`
- `src/app/components/SessionDebugFlights.tsx`

### Shared Components (used by flights)

- `src/app/components/Dashboard.tsx`
- `src/app/components/FlashcardsWidget.tsx`
- `src/app/components/FlashcardsWidgetWhiteTheme.tsx`
- `src/app/components/ItineraryWidget.tsx`
- `src/app/components/LoadingSpinner.tsx`
- `src/app/components/LoadingSpinnerWhite.tsx`
- `src/app/components/auth/LoginModalWhite.tsx`
- `src/app/components/auth/SignupModalWhite.tsx`
- `src/app/components/auth/OnboardingModalWhite.tsx`

### Shared Contexts & Utils

- `src/app/contexts/AuthContext.tsx`
- `src/app/utils/sessionManager.ts`
- `src/app/utils/imageCache.ts`

### Configuration

- `firebase.js`
- `src/middleware.ts`

---

**Created:** October 25, 2025  
**Purpose:** Cleanup non-flights related code  
**Safe to Delete:** ✅ Yes, after review
