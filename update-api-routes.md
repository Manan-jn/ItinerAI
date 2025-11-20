# API Routes Update Status

## Completed (2/14)
- ✅ `/api/chat` - Updated with comprehensive logging
- ✅ `/api/itinerary` - Updated with comprehensive logging

## Remaining Routes to Update (12)

### High Priority (Backend Proxies)
1. `/api/session/create`
2. `/api/memory`
3. `/api/memory/get`
4. `/api/conveyance`
5. `/api/stay`
6. `/api/travel-dates`
7. `/api/pre-trip`
8. `/api/in-trip`
9. `/api/utility/conveyance`
10. `/api/utility/stay`

### Medium Priority (Direct APIs)
11. `/api/places-autocomplete`
12. `/api/place-details`
13. `/api/place-photo`

## Logging Pattern

All routes should follow this pattern:

```typescript
import { getLogger, logBackendRequest, logBackendResponse, logAPIError } from "../../utils/logger";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let logger: any = null;
  let userId = 'anonymous';
  let sessionId = 'unknown';

  try {
    const body = await request.json();
    userId = body.user_id || 'anonymous';
    sessionId = body.session_id || 'unknown';

    // Get logger for this user/session
    logger = getLogger(userId, sessionId);

    // Log incoming request
    logger.info('API Request', {
      type: 'api_request',
      endpoint: '/api/...',
      method: 'POST',
      params: { ... }
    });

    // ... validation ...

    const backendUrl = `${BACKEND_API_URL}/...`;
    const backendRequestBody = { ... };

    // Log backend request
    logBackendRequest(logger, backendUrl, backendRequestBody);

    // Make backend call
    const backendStartTime = Date.now();
    const response = await fetch(backendUrl, { ... });
    const backendDuration = Date.now() - backendStartTime;

    // Handle error
    if (!response.ok) {
      const errorText = await response.text();
      logBackendResponse(logger, backendUrl, response.status, { error: errorText }, backendDuration);
      return NextResponse.json({ error: ... }, { status: response.status });
    }

    // Handle success
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
    return NextResponse.json({ error: ... }, { status: 500 });
  }
}
```
