# Comprehensive Logging Implementation Guide

## Overview

This document provides a complete guide to the logging mechanism implemented across the entire application.

## Components

### 1. Core Logger Utility (`src/app/utils/logger.ts`)

**Features:**
- Session and User-based file separation
- Daily log rotation (14 days for application logs, 30 days for errors)
- Structured JSON logging with pretty-print formatting
- Automatic sensitive data redaction
- Separate files for: application logs, errors, exceptions, rejections
- Console output in development mode only

**Directory Structure:**
```
logs/
├── {userId}/
│   └── {sessionId}/
│       ├── application-2025-01-15.log
│       ├── error-2025-01-15.log
│       ├── exceptions-2025-01-15.log
│       └── rejections-2025-01-15.log
└── app-2025-01-15.log (general application logs)
```

**Key Functions:**
- `getLogger(userId, sessionId)` - Get logger for specific user/session
- `getAppLogger()` - Get general application logger
- `logAPIRequest()` - Log incoming API requests
- `logAPIResponse()` - Log API responses
- `logAPIError()` - Log API errors
- `logBackendRequest()` - Log outgoing backend requests
- `logBackendResponse()` - Log backend responses

### 2. API Logger Middleware (`src/app/utils/apiLogger.ts`)

**Features:**
- Automatic request/response logging wrapper
- Context extraction (userId, sessionId)
- Backend proxy logging helper
- Client-side logging helper

**Key Functions:**
- `withAPILogging()` - Wrap API route for automatic logging
- `extractLogContext()` - Extract user/session from request
- `logBackendProxyRequest()` - Log backend proxy requests
- `createClientAPILogger()` - Create client-side logger instance

### 3. Log Format Structure

All logs follow this JSON structure:

```json
{
  "timestamp": "2025-01-15 14:30:45.123",
  "level": "info|warn|error",
  "message": "API Request|API Response|Backend Request|etc.",
  "userId": "firebase_uid_123",
  "sessionId": "session_456",
  "environment": "development|production",
  "metadata": {
    "type": "api_request|api_response|backend_request|backend_response|api_error",
    "endpoint": "/api/chat",
    "method": "POST",
    "params": {...},
    "statusCode": 200,
    "duration": "123ms",
    "responsePreview": {...}
  }
}
```

## Updated API Routes

### Fully Implemented (4/14)
1. ✅ `/api/chat` - Complete logging with request/response/backend tracking
2. ✅ `/api/itinerary` - Complete logging with request/response/backend tracking
3. ✅ `/api/session/create` - Complete logging with session creation tracking
4. ✅ (Add more as completed...)

### Pattern to Follow for Remaining Routes

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getLogger, logBackendRequest, logBackendResponse, logAPIError } from "../../utils/logger";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let logger: any = null;
  let userId = 'anonymous';
  let sessionId = 'unknown';

  try {
    const body = await request.json();
    const { user_id, session_id, ...otherParams } = body;

    userId = user_id;
    sessionId = session_id;

    // Get logger for this user/session
    logger = getLogger(userId, sessionId);

    // Log incoming request
    logger.info('API Request', {
      type: 'api_request',
      endpoint: '/api/...',
      method: 'POST',
      params: { user_id, session_id, ...otherParams }
    });

    // Validation
    if (!user_id || !session_id) {
      logger.warn('Validation failed');
      return NextResponse.json({ error: "..." }, { status: 400 });
    }

    const backendUrl = `${BACKEND_API_URL}/...`;
    const backendRequestBody = { user_id, session_id, ...otherParams };

    // Log backend request
    logBackendRequest(logger, backendUrl, backendRequestBody);

    // Make backend call
    const backendStartTime = Date.now();
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backendRequestBody),
    });
    const backendDuration = Date.now() - backendStartTime;

    // Handle error response
    if (!response.ok) {
      const errorText = await response.text();
      logBackendResponse(logger, backendUrl, response.status, { error: errorText }, backendDuration);
      return NextResponse.json({ error: "..." }, { status: response.status });
    }

    // Handle success response
    const data = await response.json();
    logBackendResponse(logger, backendUrl, response.status, data, backendDuration);

    const totalDuration = Date.now() - startTime;
    logger.info('API Response', {
      type: 'api_response',
      endpoint: '/api/...',
      statusCode: 200,
      duration: `${totalDuration}ms`,
      responsePreview: { ... }
    });

    return NextResponse.json(data);

  } catch (error) {
    if (logger) {
      logAPIError(logger, '/api/...', 'POST', error, {
        userId,
        sessionId,
        duration: `${Date.now() - startTime}ms`
      });
    }

    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
```

## Remaining Routes to Update

### High Priority Backend Proxies
- [ ] `/api/memory` - Memory updates
- [ ] `/api/memory/get` - Memory retrieval
- [ ] `/api/conveyance` - Conveyance selection
- [ ] `/api/stay` - Stay selection
- [ ] `/api/travel-dates` - Travel date selection
- [ ] `/api/pre-trip` - Pre-trip brief generation
- [ ] `/api/in-trip` - In-trip event handling
- [ ] `/api/utility/conveyance` - Utility conveyance data
- [ ] `/api/utility/stay` - Utility stay data

### Medium Priority Direct APIs
- [ ] `/api/places-autocomplete` - Google Places autocomplete
- [ ] `/api/place-details` - Google Places details
- [ ] `/api/place-photo` - Google Places photo proxy

## Client-Side Integration

### Updated Utils with Logging

#### `src/app/utils/chatApiHelpers.ts`
Add client-side logging:

```typescript
import { ClientLogger } from './logger';

export async function makeChatAPICall(userId: string, sessionId: string, message: string) {
  const startTime = Date.now();

  try {
    ClientLogger.log('info', 'Chat API Call', {
      userId,
      sessionId,
      endpoint: '/api/chat',
      messageLength: message.length
    });

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, session_id: sessionId, message }),
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    ClientLogger.log('info', 'Chat API Response', {
      userId,
      sessionId,
      duration: `${duration}ms`,
      responseType: data.response_type
    });

    return data;
  } catch (error) {
    ClientLogger.log('error', 'Chat API Error', {
      userId,
      sessionId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
```

### Components to Update
1. `FlightsPageAuthenticated.tsx` - Main orchestrator (already has extensive console logs)
2. `useSessionManagement.ts` - Session creation
3. `useTripHandlers.ts` - Trip selection and memory updates
4. `memoryApi.ts` - Memory API calls
5. `preTripData.ts` - Pre-trip data fetching
6. `preFetchConveyance.ts` - Conveyance pre-fetching
7. `preFetchStays.ts` - Stay pre-fetching

## Environment Configuration

### `.env.local`
```env
# Logging configuration
LOG_LEVEL=info  # debug|info|warn|error
LOG_DIR=./logs  # Default: ./logs
NODE_ENV=development  # development|production

# Backend API
BACKEND_API_URL=http://127.0.0.1:8000
```

### `.gitignore`
```
# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

## Log Analysis

### Viewing Logs

**Pretty-print a log file:**
```bash
cat logs/{userId}/{sessionId}/application-2025-01-15.log | jq .
```

**Filter by type:**
```bash
cat logs/{userId}/{sessionId}/application-2025-01-15.log | jq 'select(.metadata.type == "api_request")'
```

**Find errors:**
```bash
cat logs/{userId}/{sessionId}/error-2025-01-15.log | jq .
```

**Calculate average API duration:**
```bash
cat logs/{userId}/{sessionId}/application-2025-01-15.log | \
  jq -r 'select(.metadata.type == "api_response") | .metadata.duration' | \
  sed 's/ms//' | \
  awk '{sum+=$1; count++} END {print "Average:", sum/count, "ms"}'
```

### Common Queries

**List all API endpoints called:**
```bash
cat logs/{userId}/{sessionId}/application-2025-01-15.log | \
  jq -r 'select(.metadata.type == "api_request") | .metadata.endpoint' | \
  sort | uniq -c
```

**Find slow requests (>1000ms):**
```bash
cat logs/{userId}/{sessionId}/application-2025-01-15.log | \
  jq 'select(.metadata.type == "api_response" and (.metadata.duration | sub("ms$";"") | tonumber) > 1000)'
```

**Trace a specific session:**
```bash
cat logs/{userId}/{sessionId}/application-2025-01-15.log | \
  jq 'select(.sessionId == "specific_session_id")'
```

## Security Considerations

### Sensitive Data Redaction

The logger automatically redacts these fields:
- `password`
- `token`
- `apiKey` / `api_key`
- `secret`
- `authorization` / `auth`
- `creditCard` / `credit_card`
- `ssn` / `social_security`

Redacted values are replaced with `[REDACTED]`.

### Log File Permissions

Ensure log files are not publicly accessible:
```bash
chmod 700 logs/
chmod 600 logs/**/*.log
```

### Production Considerations

1. **Disable console output**: Set `NODE_ENV=production`
2. **Log rotation**: Logs automatically rotate daily
3. **Log retention**:
   - Application logs: 14 days
   - Error logs: 30 days
   - Exceptions/Rejections: 30 days
4. **Disk space monitoring**: Monitor `logs/` directory size
5. **Log shipping**: Consider shipping logs to centralized service (e.g., Datadog, Splunk, ELK)

## Metrics and Monitoring

### Key Metrics to Track

1. **API Performance**
   - Average response time per endpoint
   - P95/P99 response times
   - Error rate percentage

2. **Backend Performance**
   - Backend API response times
   - Backend error rates
   - Timeout occurrences

3. **User Sessions**
   - Session creation success rate
   - Active sessions per hour
   - Session duration

4. **Error Tracking**
   - Error frequency by endpoint
   - Error types distribution
   - Failed request patterns

### Sample Monitoring Queries

**Error rate by endpoint:**
```bash
grep '"level":"error"' logs/*/*/application-*.log | \
  jq -r '.metadata.endpoint' | \
  sort | uniq -c | sort -rn
```

**Average backend response time:**
```bash
grep '"type":"backend_response"' logs/*/*/application-*.log | \
  jq -r '.metadata.duration' | sed 's/ms//' | \
  awk '{sum+=$1; count++} END {print "Average:", sum/count, "ms"}'
```

## Testing

### Manual Testing

```bash
# Test chat API logging
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test_user","session_id":"test_session","message":"Hello"}'

# Check logs
cat logs/test_user/test_session/application-$(date +%Y-%m-%d).log | jq .
```

### Automated Testing

Create a test script to verify logging:
```bash
#!/bin/bash
# Test logging implementation

USER_ID="test_user_$(date +%s)"
SESSION_ID="test_session_$(date +%s)"

echo "Testing with USER_ID=$USER_ID, SESSION_ID=$SESSION_ID"

# Make test request
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$USER_ID\",\"session_id\":\"$SESSION_ID\",\"message\":\"Test\"}" \
  > /dev/null

# Wait for log write
sleep 1

# Check log file exists
LOG_FILE="logs/$USER_ID/$SESSION_ID/application-$(date +%Y-%m-%d).log"
if [ -f "$LOG_FILE" ]; then
  echo "✅ Log file created: $LOG_FILE"
  echo "✅ Log entries:"
  cat "$LOG_FILE" | jq -r '.message'
else
  echo "❌ Log file not found: $LOG_FILE"
fi
```

## Troubleshooting

### Common Issues

1. **Logs not being created**
   - Check `LOG_DIR` permissions
   - Verify winston installation: `npm list winston`
   - Check console for errors

2. **Sensitive data appearing in logs**
   - Update `sanitizeLogData()` in `logger.ts`
   - Add new sensitive keys to redaction list

3. **Disk space issues**
   - Reduce `maxFiles` in log rotation config
   - Implement log archiving strategy
   - Monitor disk usage

4. **Performance impact**
   - Logging is asynchronous, minimal impact
   - If issues occur, reduce `LOG_LEVEL` to `warn` or `error`

## Next Steps

1. ✅ Complete all remaining API route updates
2. ✅ Update client-side API helpers
3. ✅ Add logs directory to `.gitignore`
4. ✅ Test logging with sample requests
5. Deploy to production with monitoring
6. Set up log aggregation service (optional)
7. Create dashboard for log analytics (optional)

## Support

For questions or issues:
1. Check this documentation
2. Review log file structure
3. Check winston documentation: https://github.com/winstonjs/winston
4. Check winston-daily-rotate-file: https://github.com/winstonjs/winston-daily-rotate-file
