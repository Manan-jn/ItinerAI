# Firestore Logging Implementation - Complete Analysis

## Overview

This document provides a comprehensive analysis of the logging implementation, including both file-based logging and real-time Firestore logging.

## 📁 Current Logging Structure

### File-Based Logging (Existing)

```
logs/
├── app-{DATE}.log                          # General application logs
├── app-error-{DATE}.log                    # General error logs
└── {userId}/                               # User-specific logs
    └── {sessionId}/                        # Session-specific logs
        ├── application-{DATE}.log          # Application logs
        ├── error-{DATE}.log                # Error logs
        ├── exceptions-{DATE}.log           # Uncaught exceptions
        └── rejections-{DATE}.log           # Unhandled promise rejections
```

**Example Path:**
```
logs/060bb937-ae98-4e44-bb08-38f08768fcaf/7007956437322170368/application-2025-11-24.log
```

### Log Entry Structure

Each log entry follows this JSON structure:

```json
{
  "level": "info",
  "message": "API Request",
  "metadata": {
    "type": "api_request",
    "endpoint": "/api/session/create",
    "method": "POST",
    "params": {
      "user_id": "060bb937-ae98-4e44-bb08-38f08768fcaf"
    },
    "timestamp": "2025-11-24 00:17:21.935",
    "environment": "development"
  },
  "timestamp": "2025-11-24 00:17:21.935"
}
```

### Log Types and Events

Based on analysis of the logs folder, the following events are logged:

1. **API Request Events**
   - Type: `api_request`
   - Includes: endpoint, method, params, userId, sessionId

2. **API Response Events**
   - Type: `api_response`
   - Includes: endpoint, method, statusCode, response data, duration

3. **Backend Request Events**
   - Type: `backend_request`
   - Includes: backendEndpoint, requestBody, userId, sessionId

4. **Backend Response Events**
   - Type: `backend_response`
   - Includes: backendEndpoint, statusCode, response, duration

5. **Error Events**
   - Type: `api_error`
   - Includes: error message, stack trace, context

## 🔥 Firestore Logging Structure

### Document Structure in Firestore

```
Firestore Collection: logs
└── Document: {userId}
    └── Subcollection: sessions
        └── Document: {sessionId}  ← sessionId is used as document ID
            ├── Fields:
            │   ├── userId: string
            │   ├── sessionId: string
            │   ├── createdAt: Timestamp
            │   ├── lastUpdatedAt: Timestamp
            │   ├── environment: string
            │   ├── applicationLogs: array[]
            │   ├── errorLogs: array[]
            │   ├── exceptionLogs: array[]
            │   ├── rejectionLogs: array[]
            │   ├── clientLogs: array[]
            │   ├── applicationCount: number
            │   ├── errorCount: number
            │   ├── exceptionCount: number
            │   ├── rejectionCount: number
            │   └── clientCount: number
            │
            └── Subcollection: entries  (for detailed log batches)
                ├── Document: application_{timestamp}
                ├── Document: error_{timestamp}
                ├── Document: client_{timestamp}
                └── ...
```

**Example Firestore Path:**
```
logs/060bb937-ae98-4e44-bb08-38f08768fcaf/sessions/7007956437322170368
```

### Why Two Storage Levels?

1. **Main Document** (`logs/{userId}/sessions/{sessionId}`)
   - Stores aggregated logs in arrays
   - Fast read access to all logs
   - Includes counts for quick metrics
   - Limited by Firestore document size (1MB)

2. **Entries Subcollection** (`logs/{userId}/sessions/{sessionId}/entries/{logType}_{timestamp}`)
   - Stores individual log batches
   - Unlimited scalability
   - Better for querying specific time ranges
   - Can be used when main document reaches size limits

## 🔧 Implementation Components

### 1. FirestoreLogger (`src/app/utils/firestoreLogger.ts`)

**Purpose:** Core utility for dumping logs to Firestore in real-time

**Key Features:**
- Batched writes for performance (max 50 logs per batch)
- Automatic flush after 5 seconds
- Session-based document organization
- Support for multiple log types
- Error handling and retry logic

**Key Functions:**

```typescript
// Add a log entry (batched)
addLogToFirestore(userId, sessionId, logEntry, logType)

// Flush all pending batches
flushAllBatches()

// Flush specific session batches
flushSessionBatches(userId, sessionId)

// Helper functions for specific log types
logAPIRequestToFirestore(userId, sessionId, endpoint, method, params)
logAPIResponseToFirestore(userId, sessionId, endpoint, method, statusCode, response, duration)
logErrorToFirestore(userId, sessionId, message, error, context)
```

### 2. Updated Logger (`src/app/utils/logger.ts`)

**Changes Made:**
- ✅ Imports FirestoreLogger utilities
- ✅ Logs to both file and Firestore simultaneously
- ✅ Added `closeSessionLogger()` function to flush session logs
- ✅ All logging functions now check for userId/sessionId and log to Firestore

**Key Functions Enhanced:**
- `logAPIRequest()` - Now logs to Firestore
- `logAPIResponse()` - Now logs to Firestore
- `logAPIError()` - Now logs to Firestore
- `logBackendRequest()` - Now logs to Firestore
- `logBackendResponse()` - Now logs to Firestore

### 3. Updated ClientLogger (`src/app/utils/clientLogger.ts`)

**Changes Made:**
- ✅ Added direct Firestore integration
- ✅ New method: `sendLogsToFirestore(userId, sessionId)`
- ✅ Auto-flush mechanism with `startAutoFlush()`
- ✅ Helper methods for specific client events

**New Functions:**

```typescript
// Send logs directly to Firestore
ClientLogger.sendLogsToFirestore(userId, sessionId)

// Start auto-flush interval (every 30 seconds by default)
ClientLogger.startAutoFlush(userId, sessionId, 30000)

// Log client API calls
ClientLogger.logAPICall(endpoint, method, params, userId, sessionId)

// Log user interactions
ClientLogger.logUserInteraction(action, component, metadata, userId, sessionId)

// Log client errors
ClientLogger.logError(error, context, userId, sessionId)
```

### 4. API Route (`src/app/api/logs/client/route.ts`)

**Purpose:** Fallback endpoint for client-side logs

**Endpoints:**

1. **POST /api/logs/client**
   - Receives bulk logs from client
   - Stores in Firestore
   - Returns success count

2. **GET /api/logs/client?userId={userId}&sessionId={sessionId}**
   - Retrieves logs for a session
   - Useful for debugging
   - Returns structured log data

## 📊 Data Flow Diagrams

### Server-Side Logging Flow

```
API Request
    ↓
withAPILogging() or Custom Handler
    ↓
getLogger(userId, sessionId)
    ↓
logAPIRequest() ─────────→ File: logs/{userId}/{sessionId}/application-{DATE}.log
    ↓                      ↓
    └──────────────────────→ Firestore: logs/{userId}/sessions/{sessionId}
                              (batched, 5-second delay or 50 logs)
```

### Client-Side Logging Flow

```
Browser Event
    ↓
ClientLogger.log()
    ↓
In-Memory Queue (max 100)
    ↓
    ├──→ Auto-flush (every 30s)
    │       ↓
    │   sendLogsToFirestore()
    │       ↓
    │   Firestore: logs/{userId}/sessions/{sessionId}
    │
    └──→ Manual Trigger
            ↓
        POST /api/logs/client
            ↓
        Firestore: logs/{userId}/sessions/{sessionId}
```

## 🧪 Testing the Implementation

### 1. Test Server-Side Logging

Create a test API request:

```bash
curl -X POST http://localhost:3000/api/session/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user-123", "phone_number": "+1234567890"}'
```

**Expected Results:**
1. File logs created in `logs/test-user-123/{sessionId}/`
2. Firestore document created at `logs/test-user-123/sessions/{sessionId}`
3. Both should contain the same log entries

### 2. Test Client-Side Logging

Add to your React component:

```typescript
import ClientLogger from '@/app/utils/clientLogger';

useEffect(() => {
  if (userId && sessionId) {
    // Start auto-flush
    ClientLogger.startAutoFlush(userId, sessionId, 30000);
    
    // Log an event
    ClientLogger.logUserInteraction(
      'page_view',
      'FlightsPage',
      { timestamp: Date.now() },
      userId,
      sessionId
    );
  }
}, [userId, sessionId]);
```

### 3. Verify Firestore Data

Use the API endpoint:

```bash
curl "http://localhost:3000/api/logs/client?userId=test-user-123&sessionId=1234567890"
```

Expected response:

```json
{
  "userId": "test-user-123",
  "sessionId": "1234567890",
  "logs": {
    "application": [...],
    "error": [...],
    "exception": [...],
    "rejection": [...],
    "client": [...]
  },
  "counts": {
    "application": 10,
    "error": 2,
    "exception": 0,
    "rejection": 0,
    "client": 5
  },
  "createdAt": "...",
  "lastUpdatedAt": "..."
}
```

## 📈 Performance Considerations

### Batching Strategy

- **Batch Size:** 50 logs maximum
- **Batch Timeout:** 5 seconds
- **Why:** Reduces Firestore write operations and costs

### Cost Estimation

Firestore Pricing (as of 2024):
- Document writes: $0.18 per 100,000
- Document reads: $0.06 per 100,000

**Example:** 1000 API requests/day
- Without batching: ~2000 writes/day = $0.0036/day
- With batching (50 logs): ~40 writes/day = $0.000072/day
- **Savings:** 98% reduction in write costs

### Document Size Limits

Firestore document size limit: 1MB

**Mitigation:**
1. Main document stores up to ~10,000 log entries
2. Entries subcollection used for overflow
3. Consider implementing log rotation/archival

## 🔐 Security Considerations

### Data Sanitization

All logs are sanitized to prevent logging sensitive information:

```typescript
const sensitiveKeys = [
  'password', 'token', 'apiKey', 'api_key', 
  'secret', 'authorization', 'auth',
  'creditCard', 'credit_card', 'ssn', 
  'social_security'
];
```

These fields are automatically replaced with `[REDACTED]`.

### Firestore Security Rules

Recommended Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Logs collection
    match /logs/{userId}/sessions/{sessionId}/{document=**} {
      // Users can only write their own logs
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Users can only read their own logs
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Admins can read all logs
      allow read: if request.auth != null && 
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 📋 Migration Checklist

To complete the Firestore logging integration:

- [x] ✅ Create `firestoreLogger.ts` utility
- [x] ✅ Update `logger.ts` with Firestore integration
- [x] ✅ Update `clientLogger.ts` with Firestore integration
- [x] ✅ Create `/api/logs/client` endpoint
- [x] ✅ Document the implementation
- [ ] ⏳ Add Firestore security rules
- [ ] ⏳ Update `.gitignore` if needed
- [ ] ⏳ Test in production environment
- [ ] ⏳ Set up log monitoring dashboard
- [ ] ⏳ Implement log rotation/archival strategy

## 🎯 Usage Examples

### Example 1: Server-Side API Logging

```typescript
import { getLogger, logAPIRequest, logAPIResponse } from '@/app/utils/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const body = await request.json();
  const { user_id, session_id } = body;
  
  const logger = getLogger(user_id, session_id);
  
  // Logs to both file and Firestore
  logAPIRequest(logger, '/api/example', 'POST', body);
  
  try {
    const result = await processRequest(body);
    const duration = Date.now() - startTime;
    
    // Logs to both file and Firestore
    logAPIResponse(logger, '/api/example', 'POST', 200, result, duration);
    
    return NextResponse.json(result);
  } catch (error) {
    // Logs to both file and Firestore
    logAPIError(logger, '/api/example', 'POST', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### Example 2: Client-Side Event Logging

```typescript
import ClientLogger from '@/app/utils/clientLogger';

function MyComponent() {
  const { currentUser } = useAuth();
  const [sessionId, setSessionId] = useState<string>('');
  
  useEffect(() => {
    if (currentUser?.uid && sessionId) {
      // Start auto-flush every 30 seconds
      const interval = ClientLogger.startAutoFlush(
        currentUser.uid,
        sessionId,
        30000
      );
      
      return () => clearInterval(interval);
    }
  }, [currentUser, sessionId]);
  
  const handleButtonClick = () => {
    ClientLogger.logUserInteraction(
      'button_click',
      'MyComponent',
      { buttonName: 'Submit' },
      currentUser?.uid,
      sessionId
    );
    
    // Your logic here
  };
  
  return <button onClick={handleButtonClick}>Submit</button>;
}
```

### Example 3: Retrieving Logs for Analysis

```typescript
async function analyzeLogs(userId: string, sessionId: string) {
  const response = await fetch(
    `/api/logs/client?userId=${userId}&sessionId=${sessionId}`
  );
  
  const data = await response.json();
  
  console.log('Total Logs:', 
    data.counts.application + 
    data.counts.error + 
    data.counts.client
  );
  
  console.log('Error Rate:', 
    (data.counts.error / (data.counts.application + data.counts.error)) * 100,
    '%'
  );
  
  return data;
}
```

## 🚀 Next Steps

1. **Monitoring Dashboard**
   - Create a dashboard to visualize logs
   - Track error rates, response times, user activity

2. **Alert System**
   - Set up Firebase Cloud Functions to monitor error rates
   - Send alerts when thresholds are exceeded

3. **Log Analytics**
   - Implement BigQuery export for advanced analytics
   - Create custom queries for insights

4. **Performance Optimization**
   - Monitor Firestore usage and costs
   - Adjust batch sizes based on traffic patterns
   - Implement log archival strategy

## 📞 Support

For questions or issues:
1. Check Firestore console for document structure
2. Review file logs in `logs/` directory
3. Use `/api/logs/client` endpoint to debug
4. Check browser console for client-side errors

---

**Implementation Date:** November 23-24, 2025  
**Status:** ✅ Complete and Ready for Testing  
**Version:** 1.0.0

