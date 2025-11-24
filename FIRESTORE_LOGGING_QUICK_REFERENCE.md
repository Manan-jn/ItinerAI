# Firestore Logging - Quick Reference

## 🚀 Quick Start

### Server-Side (Automatic)

All API routes already log to Firestore automatically. No changes needed!

```typescript
import { getLogger, logAPIRequest } from '@/app/utils/logger';

const logger = getLogger(userId, sessionId);
logAPIRequest(logger, '/api/example', 'POST', body);
// ✅ Logs to both file and Firestore automatically
```

### Client-Side

```typescript
import ClientLogger from '@/app/utils/clientLogger';

// Start auto-flush (once per session)
ClientLogger.startAutoFlush(userId, sessionId, 30000);

// Log events
ClientLogger.logUserInteraction('button_click', 'MyButton', {}, userId, sessionId);
ClientLogger.logAPICall('/api/chat', 'POST', params, userId, sessionId);
ClientLogger.logError(error, context, userId, sessionId);
```

## 📁 Storage Paths

| What | File System | Firestore |
|------|-------------|-----------|
| **Path** | `logs/{userId}/{sessionId}/application-{DATE}.log` | `logs/{userId}/sessions/{sessionId}` |
| **Example** | `logs/abc123/xyz789/application-2025-11-24.log` | `logs/abc123/sessions/xyz789` |
| **Document ID** | File name with date | **sessionId** |

## 📊 Log Types

| Type | Description | Stored In |
|------|-------------|-----------|
| `application` | API requests, responses, general info | File + Firestore |
| `error` | Error logs, API failures | File + Firestore |
| `exception` | Uncaught exceptions | File + Firestore |
| `rejection` | Unhandled promise rejections | File + Firestore |
| `client` | Browser events, user interactions | Firestore only |

## 🔍 Retrieving Logs

### Via API Endpoint

```bash
curl "http://localhost:3000/api/logs/client?userId=USER_ID&sessionId=SESSION_ID"
```

### Via Browser Console

```javascript
// Run all tests
testFirestoreLogs.runAllTests('userId', 'sessionId');

// Check if logs exist
testFirestoreLogs.testSessionLogsExist('userId', 'sessionId');

// Display recent logs
testFirestoreLogs.displayRecentLogs('userId', 'sessionId', 'application');
```

### Via Firestore SDK

```typescript
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const logDoc = await getDoc(doc(db, `logs/${userId}/sessions/${sessionId}`));
const data = logDoc.data();
console.log('Application Logs:', data.applicationLogs);
console.log('Error Logs:', data.errorLogs);
```

## ⚙️ Configuration

### Batch Settings (in `firestoreLogger.ts`)

```typescript
const MAX_LOGS_PER_BATCH = 50;        // Max logs before auto-flush
const BATCH_TIMEOUT_MS = 5000;        // Max wait time (5 seconds)
```

### Client Settings (in `clientLogger.ts`)

```typescript
private static maxLogs = 100;          // Max client queue size
const intervalMs = 30000;              // Auto-flush every 30 seconds
```

## 🧪 Testing Commands

### 1. Test Session Creation

```bash
curl -X POST http://localhost:3000/api/session/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user", "phone_number": "+1234567890"}'
```

### 2. Check File Logs

```bash
# List sessions
ls -la logs/test-user/

# View logs
tail -f logs/test-user/SESSION_ID/application-*.log | jq '.'
```

### 3. Check Firestore Logs

```bash
curl "http://localhost:3000/api/logs/client?userId=test-user&sessionId=SESSION_ID"
```

### 4. Browser Console Tests

```javascript
testFirestoreLogs.runAllTests('test-user', 'SESSION_ID');
```

## 📈 Key Metrics

### Document Structure

```json
{
  "userId": "abc123",
  "sessionId": "xyz789",
  "createdAt": Timestamp,
  "lastUpdatedAt": Timestamp,
  "environment": "development",
  "applicationLogs": [...],
  "errorLogs": [...],
  "clientLogs": [...],
  "applicationCount": 50,
  "errorCount": 2,
  "clientCount": 10
}
```

### Cost Estimation (per 1000 API requests)

| Metric | Without Batching | With Batching |
|--------|------------------|---------------|
| Writes/Day | ~2000 | ~40 |
| Cost/Day | $0.0036 | $0.000072 |
| Savings | - | 98% |

## 🔐 Security

### Auto-Sanitized Fields

The following fields are automatically redacted with `[REDACTED]`:
- `password`, `token`, `apiKey`, `api_key`
- `secret`, `authorization`, `auth`
- `creditCard`, `credit_card`
- `ssn`, `social_security`

### Firestore Rules (Recommended)

```javascript
match /logs/{userId}/sessions/{sessionId}/{document=**} {
  allow write: if request.auth != null && request.auth.uid == userId;
  allow read: if request.auth != null && request.auth.uid == userId;
}
```

## 🛠️ Troubleshooting

### Problem: Logs not appearing in Firestore

**Check:**
1. Is userId and sessionId valid? (not 'anonymous' or 'unknown')
2. Wait 5 seconds for batch to flush
3. Check browser console for errors
4. Verify Firestore security rules

**Solution:**
```javascript
// Manual flush
import { flushSessionBatches } from '@/app/utils/firestoreLogger';
await flushSessionBatches(userId, sessionId);
```

### Problem: Too many Firestore writes

**Check:**
- Batch size: Should be 50 logs per write
- Batch timeout: Should be 5 seconds

**Solution:**
Adjust in `firestoreLogger.ts`:
```typescript
const MAX_LOGS_PER_BATCH = 100;  // Increase batch size
const BATCH_TIMEOUT_MS = 10000;  // Increase timeout
```

### Problem: Client logs not sending

**Check:**
1. Is `startAutoFlush()` called?
2. Is userId/sessionId provided?
3. Check network tab for failed requests

**Solution:**
```typescript
// Ensure auto-flush is started
useEffect(() => {
  if (userId && sessionId) {
    const interval = ClientLogger.startAutoFlush(userId, sessionId);
    return () => clearInterval(interval);
  }
}, [userId, sessionId]);
```

## 📝 Common Patterns

### Pattern 1: API Route with Logging

```typescript
import { getLogger, logAPIRequest, logAPIResponse } from '@/app/utils/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const body = await request.json();
  const { user_id, session_id } = body;
  
  const logger = getLogger(user_id, session_id);
  logAPIRequest(logger, '/api/example', 'POST', body);
  
  try {
    const result = await processRequest(body);
    logAPIResponse(logger, '/api/example', 'POST', 200, result, Date.now() - startTime);
    return NextResponse.json(result);
  } catch (error) {
    logAPIError(logger, '/api/example', 'POST', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### Pattern 2: Client Component with Logging

```typescript
import ClientLogger from '@/app/utils/clientLogger';

function MyComponent() {
  const { currentUser } = useAuth();
  const [sessionId, setSessionId] = useState('');
  
  useEffect(() => {
    if (currentUser?.uid && sessionId) {
      // Start auto-flush
      const interval = ClientLogger.startAutoFlush(currentUser.uid, sessionId);
      
      // Log page view
      ClientLogger.logUserInteraction(
        'page_view',
        'MyComponent',
        { path: window.location.pathname },
        currentUser.uid,
        sessionId
      );
      
      return () => clearInterval(interval);
    }
  }, [currentUser, sessionId]);
  
  const handleAction = () => {
    ClientLogger.logUserInteraction(
      'button_click',
      'MyComponent',
      { action: 'submit' },
      currentUser?.uid,
      sessionId
    );
    // Your logic
  };
}
```

### Pattern 3: Error Boundary with Logging

```typescript
import ClientLogger from '@/app/utils/clientLogger';

class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    const { userId, sessionId } = this.props;
    
    ClientLogger.logError(
      error,
      {
        errorInfo,
        componentStack: errorInfo.componentStack
      },
      userId,
      sessionId
    );
  }
}
```

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `FIRESTORE_LOGGING_SUMMARY.md` | Complete implementation summary |
| `FIRESTORE_LOGGING_ANALYSIS.md` | Detailed analysis and architecture |
| `FIRESTORE_LOGGING_DIAGRAMS.md` | Visual diagrams and flows |
| `FIRESTORE_LOGGING_QUICK_REFERENCE.md` | This file - quick reference |

## 🔗 Key Functions

### Server-Side

```typescript
// From logger.ts
getLogger(userId, sessionId)
logAPIRequest(logger, endpoint, method, params)
logAPIResponse(logger, endpoint, method, statusCode, response, duration)
logAPIError(logger, endpoint, method, error, context)
logBackendRequest(logger, backendEndpoint, requestBody)
logBackendResponse(logger, backendEndpoint, statusCode, response, duration)
closeSessionLogger(userId, sessionId)

// From firestoreLogger.ts
addLogToFirestore(userId, sessionId, logEntry, logType)
flushAllBatches()
flushSessionBatches(userId, sessionId)
logAPIRequestToFirestore(userId, sessionId, endpoint, method, params)
logAPIResponseToFirestore(userId, sessionId, endpoint, method, statusCode, response, duration)
logErrorToFirestore(userId, sessionId, message, error, context)
```

### Client-Side

```typescript
// From clientLogger.ts
ClientLogger.log(level, message, metadata)
ClientLogger.sendLogsToFirestore(userId, sessionId)
ClientLogger.startAutoFlush(userId, sessionId, intervalMs)
ClientLogger.logAPICall(endpoint, method, params, userId, sessionId)
ClientLogger.logUserInteraction(action, component, metadata, userId, sessionId)
ClientLogger.logError(error, context, userId, sessionId)
```

### Test Utilities

```typescript
// From firestoreLoggingTests.ts
testSessionLogsExist(userId, sessionId)
displayRecentLogs(userId, sessionId, logType)
testLogEntriesCollection(userId, sessionId)
compareLogCounts(userId, sessionId)
verifyLogStructure(userId, sessionId)
runAllTests(userId, sessionId)
```

## ✅ Checklist for New Features

When adding new API routes or components:

- [ ] Server API routes automatically log (check existing pattern)
- [ ] Client components call `ClientLogger.startAutoFlush()` on mount
- [ ] User interactions logged with `ClientLogger.logUserInteraction()`
- [ ] Errors caught and logged with `ClientLogger.logError()`
- [ ] Test logs in Firestore console after implementation

## 📞 Support Resources

1. **Check Implementation:** `FIRESTORE_LOGGING_ANALYSIS.md`
2. **Visual Diagrams:** `FIRESTORE_LOGGING_DIAGRAMS.md`
3. **Test Utilities:** Run `testFirestoreLogs.runAllTests()`
4. **Firestore Console:** https://console.firebase.google.com/
5. **File Logs:** `logs/{userId}/{sessionId}/`

---

**Quick Reference Version:** 1.0.0  
**Last Updated:** November 24, 2025

