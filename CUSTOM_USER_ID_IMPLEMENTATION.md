# Custom User ID Feature Implementation

## Overview
This feature allows users to set a custom user ID that will be used throughout the application instead of the auto-generated user ID. This is useful for testing, debugging, and maintaining consistent user identities across sessions.

## How It Works

### User ID Priority System
The system now follows a priority hierarchy when determining which user ID to use:

1. **Custom User ID (Highest Priority)**: If set via the Custom User ID modal
2. **Firebase UID (Authenticated Mode)**: For signed-in users
3. **Auto-generated User ID (Lowest Priority)**: Random ID for guest mode

### Storage Locations
- **Custom User ID**: Stored in `localStorage` with key `itinerai_custom_user_id`
- **Session User ID**: Stored in `sessionStorage` with key `itinerai_user_id`
- **Guest User**: Stored in `localStorage` with key `guestUser`

## Implementation Details

### 1. Session Manager (`src/app/utils/sessionManager.ts`)
Updated to check for custom user ID first:

```typescript
export function getUserId(): string {
  // PRIORITY 1: Check for custom user ID in localStorage
  const customUserId = localStorage.getItem('itinerai_custom_user_id');
  if (customUserId && customUserId.trim()) {
    return customUserId.trim();
  }

  // PRIORITY 2: Check for existing user ID in sessionStorage
  // PRIORITY 3: Generate new user ID if not found
}
```

New helper functions added:
- `setCustomUserId(customUserId: string)`: Set custom user ID
- `getCustomUserId()`: Get custom user ID if set
- `clearCustomUserId()`: Clear custom user ID
- Updated `getSessionInfo()`: Now includes `isCustomUserId` flag

### 2. Session Management Hook (`src/app/hooks/useSessionManagement.ts`)
Updated to prioritize custom user ID for authenticated users:

```typescript
const customUserId = getCustomUserId();
const authenticatedUserId = customUserId && customUserId.trim()
  ? customUserId.trim()
  : currentUser.uid; // Use Firebase UID if no custom ID
```

### 3. Custom User ID Modal (`src/app/components/CustomUserIdModal.tsx`)
New modal component with features:
- Input field for custom user ID
- Display current custom user ID if set
- Save button to set custom user ID
- Clear button to remove custom user ID
- Warning about page reload and session restart

### 4. Profile Dropdown (`src/app/components/flights-page/ProfileDropdown.tsx`)
Added "Custom User ID" menu option:
- Opens the Custom User ID modal
- Shows between "Settings" and "Logout" options
- User icon for easy identification

## User Flow

### Setting a Custom User ID
1. User clicks on profile dropdown in the top navigation
2. User clicks "Custom User ID" option
3. Modal opens showing:
   - Current custom user ID (if set)
   - Input field to enter new custom user ID
   - Warning about page reload
4. User enters desired user ID (e.g., "test-user-123")
5. User clicks "Set Custom ID"
6. Alert confirms the ID is set
7. Page automatically reloads
8. All subsequent API calls use the custom user ID

### Clearing Custom User ID
1. User opens Custom User ID modal
2. User clicks "Clear" button
3. Custom user ID is removed from localStorage
4. Alert confirms clearing
5. Page reloads
6. System reverts to default user ID (Firebase UID or auto-generated)

## Where User ID is Used

### FlightsPageAuthenticated
- Uses `useSessionManagement` hook
- `userId` state is passed to:
  - Chat API calls (`/api/chat`)
  - Itinerary API calls (`/api/itinerary`)
  - Memory API calls (`/api/memory`)
  - Session API calls (`/api/session/create`)
  - Firestore operations (trip storage, itinerary storage)

### Dashboard Component
- Uses `getUserId()` from sessionManager
- `userId` state is passed to:
  - Chat API calls (`/api/chat`)
  - Memory API calls

### ChatModal Component (Unused/Temporary)
- Uses `getUserId()` from sessionManager
- `userId` state for chat operations

## Testing the Feature

### Test Scenario 1: Guest Mode with Custom ID
1. Visit the app without logging in
2. Click "Continue as Guest"
3. Open profile dropdown → Custom User ID
4. Set custom ID: "guest-tester-1"
5. Verify in browser console: "Using custom user ID: guest-tester-1"
6. Check API calls in Network tab - should use "guest-tester-1"

### Test Scenario 2: Authenticated Mode with Custom ID
1. Sign in with Google or email/password
2. Open profile dropdown → Custom User ID
3. Set custom ID: "auth-tester-1"
4. Verify in browser console: "🔧 Using custom user ID for session: auth-tester-1"
5. Check API calls - should use "auth-tester-1" instead of Firebase UID

### Test Scenario 3: Clear Custom ID
1. With custom ID set, open the modal
2. Click "Clear" button
3. Verify page reloads
4. Check console - should show auto-generated or Firebase UID
5. Verify API calls use default ID

## Debugging

### Check Current User ID
Open browser console and run:
```javascript
// Check custom user ID
localStorage.getItem('itinerai_custom_user_id')

// Check session user ID
sessionStorage.getItem('itinerai_user_id')

// Check guest user
localStorage.getItem('guestUser')
```

### Console Log Messages to Look For
- `"Using custom user ID: <id>"` - Custom ID is being used
- `"🔧 Using custom user ID for session: <id>"` - Custom ID used in authenticated mode
- `"Generated new user ID: <id>"` - Auto-generated ID created
- `"Using existing user ID: <id>"` - Session ID from sessionStorage

## Notes

### Important Considerations
1. **Page Reload Required**: Setting/clearing custom user ID requires page reload to ensure all components use the new ID
2. **Persistent Across Sessions**: Custom user ID persists in localStorage until explicitly cleared
3. **Works in All Modes**: Custom ID works for both guest and authenticated modes
4. **Session Independence**: Setting custom ID will start a NEW session with that ID
5. **API Compatibility**: Ensure backend accepts custom user IDs

### Security Notes
- Custom user IDs are stored in localStorage (client-side only)
- No validation is performed on the backend (assumes trusted input)
- Users can set any string as their user ID
- This feature is intended for development/testing purposes

## Future Enhancements
1. Add user ID format validation
2. Show current user ID in the UI (e.g., in debug panel)
3. Add user ID history/presets
4. Backend validation of custom user IDs
5. Admin-only access to this feature in production
