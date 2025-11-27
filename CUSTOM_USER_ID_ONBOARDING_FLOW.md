# Custom User ID with Onboarding Flow - Analysis & Implementation

## Current Onboarding Flow Analysis

### 1. **Trigger Points**
Onboarding is triggered when:
- New user signs up (email/password or Google)
- User hasn't completed onboarding (`onboardingCompleted: false` in Firestore)
- Controlled by `showOnboarding` state in `AuthContext`

### 2. **Onboarding Process** (`OnboardingModalWhite.tsx`)

#### Step 1: Basic Information (Mandatory)
- Date of Birth
- Gender
- Passport Nationality
- Phone Number (with country code)

#### Step 2: Additional Information (Optional)
- Allergies
- Emergency Contact (name + phone)
- Food Preferences

#### Step 3: Backend Integration (Lines 113-189)

**Sequence of API Calls:**

1. **Save to Firestore**
   ```typescript
   await setDoc(doc(db, "users", userId), userData);
   ```
   - Stores user profile data
   - Marks `onboardingCompleted: true`

2. **Create Session** (Lines 152-171)
   ```typescript
   POST /api/session/create
   Body: { user_id, phone_number }
   Returns: { body: { session_id } }
   ```
   - Creates new backend session
   - Stores `session_id` in sessionStorage
   - Fallback to local generation if API fails

3. **Update Memory** (Line 179)
   ```typescript
   updateUserMemory(memoryUserData, userId, sessionId)
   ```
   - Sends profile data to memory service
   - Non-blocking (won't fail onboarding if it fails)

4. **Redirect** (Line 183)
   ```typescript
   router.push(`/flights/${userId}`);
   ```
   - Navigates to main flights dashboard

### 3. **Memory API Call Details** (`memoryApi.ts`)

**Payload Structure:**
```typescript
{
  user_id: string,
  session_id: string,
  updates: {
    user_profile: {
      name: string,           // From displayName or email
      age: number,            // Calculated from dateOfBirth
      gender: string,         // Lowercase
      passport_nationality: string,
      allergies?: string,     // Optional
      emergency_contact_name?: string,
      emergency_contact_phone?: string,
      food_preferences?: string
    }
  }
}
```

**API Endpoint:**
```
POST /api/memory
```

## Current Custom User ID Behavior

### Problem:
When custom user ID is set:
1. ✅ User ID changes to custom value
2. ❌ Session ID continues (NOT refreshed)
3. ❌ Memory NOT updated with custom user ID
4. ❌ Onboarding is skipped
5. ❌ Chat continues from previous state

### Expected Behavior:
When custom user ID is set:
1. ✅ Clear previous session
2. ✅ Reset to onboarding state
3. ✅ Use custom user ID throughout flow
4. ✅ Create NEW session with custom user ID
5. ✅ Update memory with custom user ID

## Implementation Plan

### Phase 1: Session Cleanup on Custom User ID Change

**File:** `CustomUserIdModal.tsx`

```typescript
const handleSave = (userId: string) => {
  // 1. Clear old session data
  sessionStorage.removeItem('itinerai_session_id');
  sessionStorage.removeItem('itinerai_user_id');

  // 2. Set custom user ID
  setCustomUserId(userId);

  // 3. Trigger onboarding
  setShowOnboarding(true);

  // 4. Close modal
  onClose();

  // NO RELOAD - Let onboarding flow handle everything
};
```

### Phase 2: Pass Custom User ID to Onboarding

**File:** `ProfileDropdown.tsx`

```typescript
interface ProfileDropdownProps {
  // ... existing props
  onCustomUserIdSet: (userId: string) => void;
}

const handleSaveCustomUserId = (userId: string) => {
  setCustomUserId(userId);
  onCustomUserIdSet(userId); // Notify parent
};
```

### Phase 3: Update FlightsPageAuthenticated

```typescript
const handleCustomUserIdSet = (customId: string) => {
  // 1. Clear session storage
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('itinerai_session_id');
    sessionStorage.removeItem('itinerai_user_id');
  }

  // 2. Reset session state
  setSessionId('');
  setUserId(customId);

  // 3. Show onboarding
  setShowOnboarding(true);
};
```

### Phase 4: Update OnboardingModal to Use Custom User ID

**File:** `OnboardingModalWhite.tsx`

**Current Issue:**
```typescript
<OnboardingModalWhite
  userId={currentUser.uid}  // ❌ Always uses Firebase UID
/>
```

**Solution:**
```typescript
<OnboardingModalWhite
  userId={userId || currentUser.uid}  // ✅ Use custom ID if set
/>
```

The modal already:
- ✅ Accepts `userId` as prop
- ✅ Saves to Firestore with this `userId`
- ✅ Creates session with this `userId`
- ✅ Updates memory with this `userId`
- ✅ Redirects to `/flights/${userId}`

## Data Flow with Custom User ID

### Before (Current):
```
Set Custom ID → Reload Page → Continue with old session
```

### After (New):
```
Set Custom ID
  ↓
Clear Sessions
  ↓
Show Onboarding
  ↓
Complete Onboarding (Step 1 & 2)
  ↓
Save to Firestore (with custom user_id)
  ↓
Create New Session (POST /api/session/create with custom user_id)
  ↓
Update Memory (POST /api/memory with custom user_id)
  ↓
Redirect to /flights/{custom_user_id}
```

## Key Changes Summary

### 1. `CustomUserIdModal.tsx` ✅ COMPLETED
- ✅ Remove page reload
- ✅ Clear session storage
- ✅ Don't trigger reload; let parent handle state

### 2. `ProfileDropdown.tsx` ✅ COMPLETED
- ✅ Add callback prop `onCustomUserIdSet`
- ✅ Pass callback to modal

### 3. `ChatNavbar.tsx` ✅ COMPLETED
- ✅ Add callback prop `onCustomUserIdSet`
- ✅ Pass callback to ProfileDropdown

### 4. `FlightsPageAuthenticated.tsx` ✅ COMPLETED
- ✅ Add handler `handleCustomUserIdSet` (lines 357-382)
- ✅ Clear session storage
- ✅ Reset session state
- ✅ Trigger onboarding
- ✅ Pass callback to ChatNavbar (line 4765)
- ✅ Pass custom userId to onboarding modal (line 5039)

### 5. Session Flow ✅ COMPLETED
- ✅ Custom user ID persists in localStorage
- ✅ `getUserId()` reads it first (already implemented)
- ✅ Onboarding uses it for all API calls
- ✅ Session created with custom user ID
- ✅ Memory updated with custom user ID

## Benefits

1. **Clean Session Reset**: No stale data from previous user
2. **Proper Initialization**: Memory and session properly set up
3. **Standard Flow**: Follows same onboarding process
4. **Custom User ID Throughout**: Used in all API calls
5. **No Page Reload**: Smooth UX with state management

## Testing Scenarios

### Test 1: Set Custom User ID (New User)
1. Login/signup normally
2. Open profile → Custom User ID
3. Enter "test-user-123"
4. Click "Set Custom ID"
5. ✅ Onboarding modal should appear
6. ✅ Complete onboarding
7. ✅ Session created with "test-user-123"
8. ✅ Memory updated with "test-user-123"
9. ✅ Redirect to /flights/test-user-123

### Test 2: Change Custom User ID (Existing User)
1. Have existing custom ID set
2. Open profile → Custom User ID
3. See current ID displayed
4. Enter new ID "test-user-456"
5. Click "Set Custom ID"
6. ✅ Onboarding modal appears again
7. ✅ Complete onboarding with new ID
8. ✅ All API calls use new ID

### Test 3: Clear Custom User ID
1. Have custom ID set
2. Open profile → Custom User ID
3. Click "Clear"
4. ✅ Page reloads (acceptable for clear action)
5. ✅ Falls back to Firebase UID or auto-generated ID
6. ✅ May need to re-onboard (depending on Firebase user state)

## API Calls Verification

After implementation, verify these calls use custom user ID:

1. **Session Creation**
   ```
   POST /api/session/create
   Body: { user_id: "test-user-123", phone_number: "..." }
   ```

2. **Memory Update**
   ```
   POST /api/memory
   Body: { user_id: "test-user-123", session_id: "...", updates: {...} }
   ```

3. **Firestore Document**
   ```
   Collection: users
   Document ID: "test-user-123"
   ```

4. **All Chat/Itinerary Calls**
   ```
   Should use user_id: "test-user-123"
   ```
