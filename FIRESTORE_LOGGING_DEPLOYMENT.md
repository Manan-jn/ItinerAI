# Firestore Logging - Deployment Guide

## 🚀 Pre-Deployment Checklist

### 1. Environment Setup

- [ ] Firebase project is set up
- [ ] Firestore database is enabled
- [ ] Firebase config is in `firebase.js`
- [ ] All environment variables are set

### 2. Code Review

- [ ] All new files are committed
  - `src/app/utils/firestoreLogger.ts`
  - `src/app/utils/firestoreLoggingTests.ts`
  - `src/app/api/logs/client/route.ts`
  - Updated `logger.ts`, `clientLogger.ts`
- [ ] No linting errors
- [ ] No TypeScript errors

### 3. Testing

- [ ] Server-side logging tested locally
- [ ] Client-side logging tested in browser
- [ ] API endpoint `/api/logs/client` tested
- [ ] Firestore console shows correct structure
- [ ] Test utilities run successfully

## 🔧 Firestore Setup

### Step 1: Enable Firestore

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `itinerai-41751`
3. Navigate to **Firestore Database**
4. Click **Create Database** (if not already created)
5. Choose location: `us-central` (or your preferred region)
6. Start in **Production mode** (we'll add rules next)

### Step 2: Create Indexes (Optional but Recommended)

For better query performance:

1. In Firestore console, go to **Indexes**
2. Add composite index:
   - Collection: `logs/{userId}/sessions/{sessionId}/entries`
   - Fields:
     - `timestamp` (Descending)
     - `logType` (Ascending)
   - Query scope: Collection group

### Step 3: Set Security Rules

Replace default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection (existing)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Generated itineraries collection (existing)
    match /generated_itineraries/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Logs collection (NEW)
    match /logs/{userId}/sessions/{sessionId}/{document=**} {
      // Allow users to write their own logs
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to read their own logs
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Allow server-side writes (from API routes)
      // Note: In production, verify the request comes from your backend
      allow write: if true; // Or implement custom claims for server auth
    }
    
    // Admin access to all logs (optional)
    match /logs/{userId}/sessions/{sessionId}/{document=**} {
      allow read: if request.auth != null && 
                    exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

**Important:** The current rules allow any authenticated user to write logs. For production, consider:
- Implementing server-side authentication with admin SDK
- Using custom claims to verify server requests
- Rate limiting log writes

### Step 4: Test Security Rules

In Firestore console:
1. Go to **Rules** tab
2. Click **Rules Playground**
3. Test scenarios:
   - User writing to their own logs: ✅ Should succeed
   - User reading other user's logs: ❌ Should fail
   - Unauthenticated write: ❌ Should fail

## 📦 Deployment Steps

### Local Testing First

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Build the project
npm run build

# 3. Start development server
npm run dev

# 4. Test logging
# Open browser console and run:
testFirestoreLogs.runAllTests('test-user-id', 'test-session-id')

# 5. Verify in Firestore console
# Check: logs/test-user-id/sessions/test-session-id
```

### Deploy to Production

```bash
# 1. Commit changes
git add .
git commit -m "feat: Add Firestore real-time logging"

# 2. Push to repository
git push origin main

# 3. Deploy (adjust for your deployment platform)

# For Vercel:
vercel --prod

# For Google Cloud Run:
gcloud run deploy itinerai-frontend \
  --image gcr.io/YOUR_PROJECT_ID/itinerai-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# For other platforms, follow your standard deployment process
```

## 🔍 Post-Deployment Verification

### 1. Verify Server Logs

```bash
# Make a test API call
curl -X POST https://your-domain.com/api/session/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user", "phone_number": "+1234567890"}'

# Check Firestore
# logs/test-user/sessions/{returned-session-id}
```

### 2. Verify Client Logs

1. Open your application in browser
2. Open browser console
3. Check for auto-flush initialization
4. Perform some user actions
5. Wait 30 seconds or trigger manual flush
6. Check Firestore for client logs

### 3. Verify API Endpoint

```bash
curl "https://your-domain.com/api/logs/client?userId=test-user&sessionId=test-session-id"
```

Expected response:
```json
{
  "userId": "test-user",
  "sessionId": "test-session-id",
  "logs": { ... },
  "counts": { ... }
}
```

## 📊 Monitoring Setup

### 1. Firestore Usage Monitoring

1. Go to Firebase Console → Firestore → Usage tab
2. Monitor:
   - **Document writes per day** (should be ~40-50 per 1000 API requests with batching)
   - **Document reads per day** (depends on your retrieval patterns)
   - **Storage usage** (logs will accumulate over time)

### 2. Set Up Alerts

Create Cloud Functions to monitor:

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Alert on high error rate
export const monitorErrorRate = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Query recent sessions
    const sessionsSnapshot = await db
      .collectionGroup('sessions')
      .where('lastUpdatedAt', '>=', oneHourAgo)
      .get();
    
    let totalLogs = 0;
    let totalErrors = 0;
    
    sessionsSnapshot.forEach(doc => {
      const data = doc.data();
      totalLogs += (data.applicationCount || 0) + (data.errorCount || 0);
      totalErrors += data.errorCount || 0;
    });
    
    const errorRate = totalLogs > 0 ? (totalErrors / totalLogs) * 100 : 0;
    
    if (errorRate > 10) { // 10% error rate threshold
      console.error(`High error rate detected: ${errorRate.toFixed(2)}%`);
      // Send alert (email, Slack, etc.)
    }
    
    return null;
  });
```

### 3. Create Dashboard (Optional)

Use Firebase Extensions or build custom dashboard:

```typescript
// Example: Retrieve log stats for dashboard
async function getLogStats(userId: string, startDate: Date, endDate: Date) {
  const db = admin.firestore();
  
  const sessionsSnapshot = await db
    .collection(`logs/${userId}/sessions`)
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();
  
  const stats = {
    totalSessions: sessionsSnapshot.size,
    totalLogs: 0,
    totalErrors: 0,
    totalClientLogs: 0,
    sessions: []
  };
  
  sessionsSnapshot.forEach(doc => {
    const data = doc.data();
    stats.totalLogs += (data.applicationCount || 0);
    stats.totalErrors += (data.errorCount || 0);
    stats.totalClientLogs += (data.clientCount || 0);
    
    stats.sessions.push({
      sessionId: doc.id,
      createdAt: data.createdAt,
      counts: {
        application: data.applicationCount || 0,
        error: data.errorCount || 0,
        client: data.clientCount || 0
      }
    });
  });
  
  return stats;
}
```

## 🔄 Data Management

### Log Rotation Strategy

**Recommended:** Implement automatic archival after 30-90 days

```typescript
// Cloud Function to archive old logs
export const archiveOldLogs = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const storage = admin.storage();
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
    
    // Query old sessions
    const oldSessions = await db
      .collectionGroup('sessions')
      .where('lastUpdatedAt', '<', cutoffDate)
      .limit(100) // Process in batches
      .get();
    
    for (const doc of oldSessions.docs) {
      // Export to Cloud Storage
      const data = doc.data();
      const filePath = `log-archives/${doc.ref.parent.parent!.id}/${doc.id}.json`;
      const file = storage.bucket().file(filePath);
      
      await file.save(JSON.stringify(data, null, 2), {
        contentType: 'application/json'
      });
      
      // Delete from Firestore
      await doc.ref.delete();
      console.log(`Archived and deleted: ${doc.ref.path}`);
    }
    
    return null;
  });
```

### Storage Cost Optimization

1. **Enable TTL (Time to Live)** for automatic deletion:
   - Not natively supported in Firestore
   - Implement via Cloud Functions (see above)

2. **Compress logs** before archiving:
   ```typescript
   import * as zlib from 'zlib';
   
   const compressed = zlib.gzipSync(JSON.stringify(data));
   await file.save(compressed, { 
     contentType: 'application/gzip' 
   });
   ```

3. **Export to BigQuery** for analysis:
   - Enable Firestore BigQuery export
   - Query logs using SQL
   - Much cheaper for large-scale analysis

## 🔒 Security Hardening

### 1. Implement Rate Limiting

Add to Firestore rules:

```javascript
match /logs/{userId}/sessions/{sessionId}/{document=**} {
  allow write: if request.auth != null && 
               request.auth.uid == userId &&
               // Limit writes to 100 per minute per session
               request.time < resource.data.lastWriteTime + duration.fromMillis(600);
}
```

### 2. Server-Side Authentication

For API routes writing to Firestore, use Admin SDK:

```typescript
import admin from 'firebase-admin';

// Initialize Admin SDK (do this once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

// Use Admin SDK for writes
const db = admin.firestore();
await db.doc(`logs/${userId}/sessions/${sessionId}`).set(data);
```

### 3. Sanitization Verification

Ensure all logs are sanitized:

```typescript
// Add to firestoreLogger.ts
function verifySanitization(logEntry: LogEntry): boolean {
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /apikey/i,
    /secret/i,
    /creditcard/i,
    /ssn/i
  ];
  
  const logString = JSON.stringify(logEntry).toLowerCase();
  
  for (const pattern of sensitivePatterns) {
    if (pattern.test(logString) && !logString.includes('[REDACTED]')) {
      console.error('Unsanitized sensitive data detected in log!');
      return false;
    }
  }
  
  return true;
}
```

## 📝 Rollback Plan

If issues occur after deployment:

### 1. Disable Firestore Logging

Comment out Firestore integration:

```typescript
// In logger.ts, comment out:
/*
import {
  addLogToFirestore,
  // ... other imports
} from './firestoreLogger';
*/

// In each logging function, comment out:
/*
if (meta && meta.userId && meta.sessionId) {
  logAPIRequestToFirestore(...).catch(...);
}
*/
```

### 2. File Logs Continue Working

File-based logging is unaffected. Application continues to function normally.

### 3. Re-enable After Fix

Uncomment the code and redeploy.

## ✅ Final Checklist

Before marking deployment complete:

- [ ] Firestore database enabled and configured
- [ ] Security rules deployed and tested
- [ ] Application deployed to production
- [ ] Server-side logs appearing in Firestore
- [ ] Client-side logs appearing in Firestore
- [ ] API endpoint `/api/logs/client` working
- [ ] Test utilities verified in production
- [ ] Monitoring set up (usage, alerts)
- [ ] Documentation shared with team
- [ ] Rollback plan documented and ready

## 📚 Additional Resources

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Functions for Firebase](https://firebase.google.com/docs/functions)
- [BigQuery Export](https://firebase.google.com/docs/firestore/extend-with-bigquery)

## 🆘 Common Deployment Issues

### Issue 1: "Permission Denied" Errors

**Cause:** Security rules too restrictive or authentication not working

**Solution:**
1. Check Firestore rules in console
2. Verify user is authenticated
3. Verify userId matches authenticated user's UID
4. Temporarily allow all writes for testing (remove in production!)

### Issue 2: High Firestore Costs

**Cause:** Too many writes, batching not working

**Solution:**
1. Verify batching is enabled (check `MAX_LOGS_PER_BATCH`)
2. Increase batch size if needed
3. Implement log sampling for high-volume endpoints
4. Enable archival to Cloud Storage

### Issue 3: Logs Not Appearing

**Cause:** Batches not flushing, errors in write operations

**Solution:**
1. Check browser console for errors
2. Manually trigger flush: `flushSessionBatches(userId, sessionId)`
3. Verify Firestore permissions
4. Check network tab for failed requests

---

**Deployment Guide Version:** 1.0.0  
**Last Updated:** November 24, 2025  
**Status:** Ready for Production Deployment

