# Logging Implementation - Test Guide

## Quick Start Testing

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Test API Logging

Create a test script to generate sample logs:

```bash
#!/bin/bash
# save as test-logging.sh

echo "=== Testing Logging Implementation ==="
echo ""

# Test variables
USER_ID="test_user_$(date +%s)"
SESSION_ID="test_session_$(date +%s)"
BASE_URL="http://localhost:3000"

echo "Test User ID: $USER_ID"
echo "Test Session ID: $SESSION_ID"
echo ""

# Test 1: Session Creation
echo "Test 1: Creating session..."
curl -s -X POST "$BASE_URL/api/session/create" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$USER_ID\"}" | jq .

# Extract session_id from response
SESSION_ID=$(curl -s -X POST "$BASE_URL/api/session/create" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$USER_ID\"}" | jq -r '.body.session_id')

echo "Generated Session ID: $SESSION_ID"
echo ""

# Test 2: Chat API
echo "Test 2: Sending chat message..."
curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\":\"$USER_ID\",
    \"session_id\":\"$SESSION_ID\",
    \"message\":\"Hello, I want to plan a trip to Mumbai\"
  }" | jq -r '.message' | head -20

echo ""

# Test 3: Memory API
echo "Test 3: Updating memory..."
curl -s -X POST "$BASE_URL/api/memory" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\":\"$USER_ID\",
    \"session_id\":\"$SESSION_ID\",
    \"updates\":{
      \"user_profile\":{
        \"name\":\"Test User\",
        \"preferences\":{\"travel_style\":\"adventure\"}
      }
    }
  }" | jq .

echo ""

# Test 4: Itinerary API
echo "Test 4: Calling itinerary API..."
curl -s -X POST "$BASE_URL/api/itinerary" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\":\"$USER_ID\",
    \"session_id\":\"$SESSION_ID\",
    \"message\":\"Generate itinerary for day 1\",
    \"current_itinerary\":[],
    \"role\":\"admin\",
    \"current_day\":1,
    \"trip_duration\":3,
    \"request_type\":\"generate\"
  }" | jq -r '.message.message' | head -20

echo ""
echo "=== Tests Complete ==="
echo ""
echo "Check logs in: logs/$USER_ID/$SESSION_ID/"
```

### 3. Run the Test Script

```bash
chmod +x test-logging.sh
./test-logging.sh
```

### 4. Verify Log Files Created

```bash
# List log directory
find logs -type f -name "*.log" | sort

# View latest application log
find logs -name "application-*.log" -type f -exec ls -lt {} + | head -1 | awk '{print $NF}' | xargs cat | jq .

# Count log entries
find logs -name "application-*.log" -type f -exec cat {} + | wc -l
```

## Log File Structure Verification

### Expected Directory Structure

After running tests, you should see:

```
logs/
├── test_user_{timestamp}/
│   └── test_session_{timestamp}/
│       ├── application-2025-01-15.log
│       ├── error-2025-01-15.log
│       ├── exceptions-2025-01-15.log
│       └── rejections-2025-01-15.log
└── app-2025-01-15.log
```

### Verify Log Contents

```bash
#!/bin/bash
# save as verify-logs.sh

echo "=== Log Verification ==="
echo ""

# Find the most recent user log directory
LATEST_LOG_DIR=$(find logs -type d -name "test_session_*" | sort -r | head -1)

if [ -z "$LATEST_LOG_DIR" ]; then
  echo "❌ No log directories found!"
  exit 1
fi

echo "✅ Found log directory: $LATEST_LOG_DIR"
echo ""

# Check application log
APP_LOG=$(find "$LATEST_LOG_DIR" -name "application-*.log" | head -1)
if [ -f "$APP_LOG" ]; then
  echo "✅ Application log exists: $APP_LOG"
  echo "   Entries: $(wc -l < "$APP_LOG")"
  echo ""
  echo "   Sample entry:"
  head -1 "$APP_LOG" | jq .
  echo ""
else
  echo "❌ Application log not found"
fi

# Check error log
ERROR_LOG=$(find "$LATEST_LOG_DIR" -name "error-*.log" | head -1)
if [ -f "$ERROR_LOG" ]; then
  echo "✅ Error log exists: $ERROR_LOG"
  echo "   Entries: $(wc -l < "$ERROR_LOG")"
else
  echo "ℹ️  No error log (this is OK if no errors occurred)"
fi

echo ""
echo "=== Verification Complete ==="
```

## Sample Log Entry Formats

### API Request Log

```json
{
  "timestamp": "2025-01-15 14:30:45.123",
  "level": "info",
  "message": "Chat API Request",
  "userId": "test_user_1705329045",
  "sessionId": "test_session_1705329045",
  "environment": "development",
  "metadata": {
    "type": "api_request",
    "endpoint": "/api/chat",
    "method": "POST",
    "params": {
      "user_id": "test_user_1705329045",
      "session_id": "test_session_1705329045",
      "message_preview": "Hello, I want to plan a trip to Mumbai"
    }
  }
}
```

### Backend Request Log

```json
{
  "timestamp": "2025-01-15 14:30:45.456",
  "level": "info",
  "message": "Backend Request",
  "userId": "test_user_1705329045",
  "sessionId": "test_session_1705329045",
  "environment": "development",
  "metadata": {
    "type": "backend_request",
    "backendEndpoint": "http://127.0.0.1:8000/agents/chat",
    "requestBody": {
      "user_id": "test_user_1705329045",
      "session_id": "test_session_1705329045",
      "message": "Hello, I want to plan a trip to Mumbai"
    }
  }
}
```

### Backend Response Log

```json
{
  "timestamp": "2025-01-15 14:30:47.890",
  "level": "info",
  "message": "Backend Response",
  "userId": "test_user_1705329045",
  "sessionId": "test_session_1705329045",
  "environment": "development",
  "metadata": {
    "type": "backend_response",
    "backendEndpoint": "http://127.0.0.1:8000/agents/chat",
    "statusCode": 200,
    "response": {
      "response_type": "trip_suggestions",
      "message": "{...}"
    },
    "duration": "2434ms"
  }
}
```

### API Response Log

```json
{
  "timestamp": "2025-01-15 14:30:47.950",
  "level": "info",
  "message": "Chat API Response",
  "userId": "test_user_1705329045",
  "sessionId": "test_session_1705329045",
  "environment": "development",
  "metadata": {
    "type": "api_response",
    "endpoint": "/api/chat",
    "statusCode": 200,
    "duration": "2494ms",
    "responsePreview": {
      "hasMessage": true,
      "responseType": "trip_suggestions",
      "messageLength": 1523
    }
  }
}
```

### Error Log

```json
{
  "timestamp": "2025-01-15 14:32:10.123",
  "level": "error",
  "message": "API Error",
  "userId": "test_user_1705329045",
  "sessionId": "test_session_1705329045",
  "environment": "development",
  "metadata": {
    "type": "api_error",
    "endpoint": "/api/chat",
    "method": "POST",
    "error": {
      "message": "Unable to connect to backend service",
      "stack": "Error: Unable to connect to backend service\n    at POST (/app/api/chat/route.ts:126:13)",
      "name": "Error"
    },
    "context": {
      "userId": "test_user_1705329045",
      "sessionId": "test_session_1705329045",
      "duration": "500ms"
    }
  }
}
```

## Log Analysis Examples

### 1. Find All API Calls for a Session

```bash
USER_ID="test_user_1705329045"
SESSION_ID="test_session_1705329045"

cat logs/$USER_ID/$SESSION_ID/application-*.log | \
  jq 'select(.metadata.type == "api_request")' | \
  jq -r '[.timestamp, .metadata.endpoint, .metadata.method] | @tsv' | \
  column -t
```

### 2. Calculate API Response Times

```bash
cat logs/$USER_ID/$SESSION_ID/application-*.log | \
  jq -r 'select(.metadata.type == "api_response") |
    [.metadata.endpoint, .metadata.duration] | @tsv' | \
  column -t
```

### 3. Find Errors

```bash
cat logs/$USER_ID/$SESSION_ID/error-*.log | \
  jq -r '[.timestamp, .message, .metadata.error.message] | @tsv' | \
  column -t
```

### 4. Backend Performance Analysis

```bash
cat logs/$USER_ID/$SESSION_ID/application-*.log | \
  jq -r 'select(.metadata.type == "backend_response") |
    [.metadata.backendEndpoint, .metadata.duration, .metadata.statusCode] | @tsv' | \
  column -t
```

### 5. Full Request Trace

```bash
# Trace a single request flow
cat logs/$USER_ID/$SESSION_ID/application-*.log | \
  jq 'select(.metadata.endpoint == "/api/chat")' | \
  jq -r '[.timestamp, .metadata.type, .metadata.duration // "N/A"] | @tsv'
```

## Integration Testing

### Test with Real User Flow

1. **Start the application**: `npm run dev`
2. **Open browser**: Navigate to `http://localhost:3000`
3. **Login/Signup**: Create a test account
4. **Trigger actions**:
   - Send a chat message
   - Select a trip
   - Generate itinerary
   - Update preferences
5. **Check logs**: Find your user/session logs in `logs/{firebase_uid}/{session_id}/`

### Verify Logging for Each Action

```bash
# Monitor logs in real-time
tail -f logs/*/*/application-*.log | jq .
```

## Performance Testing

### Measure Log Impact

```bash
#!/bin/bash
# save as performance-test.sh

echo "=== Performance Testing ==="

# Without heavy logging
echo "Sending 10 requests..."
for i in {1..10}; do
  time curl -s -X POST "http://localhost:3000/api/chat" \
    -H "Content-Type: application/json" \
    -d "{\"user_id\":\"perf_test\",\"session_id\":\"perf_session\",\"message\":\"Test $i\"}" \
    > /dev/null 2>&1
done

# Check log file size
du -sh logs/
```

## Troubleshooting

### Issue: No Log Files Created

**Solution:**
```bash
# Check permissions
ls -la logs/

# Check if winston is installed
npm list winston winston-daily-rotate-file

# Check for errors in console
npm run dev 2>&1 | grep -i "log\|winston\|error"
```

### Issue: Log Files Empty

**Solution:**
```bash
# Verify logger is being called
grep -r "getLogger\|logAPIRequest" src/app/api/

# Check environment variables
echo $LOG_LEVEL
echo $NODE_ENV
```

### Issue: Sensitive Data in Logs

**Solution:**
- Update `sanitizeLogData()` in `src/app/utils/logger.ts`
- Add new sensitive keys to the redaction list
- Test with: `grep -i "password\|token\|secret" logs/*/*/*.log`

## Cleanup

### Remove Old Logs

```bash
# Remove logs older than 14 days
find logs -name "application-*.log" -mtime +14 -delete
find logs -name "error-*.log" -mtime +30 -delete

# Remove empty directories
find logs -type d -empty -delete
```

### Reset for Fresh Testing

```bash
# Remove all logs
rm -rf logs/

# Create fresh logs directory
mkdir -p logs
chmod 755 logs
```

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set `LOG_LEVEL=info` or `warn`
- [ ] Configure log shipping (if using centralized logging)
- [ ] Set up disk space monitoring
- [ ] Configure log rotation settings
- [ ] Test error alerting
- [ ] Document log access procedures
- [ ] Set proper file permissions (600 for logs, 700 for directories)
- [ ] Add logs to .gitignore (already done)
- [ ] Configure backup strategy for logs

## Summary

This implementation provides:
- ✅ Comprehensive API request/response logging
- ✅ Session and user-based log file separation
- ✅ Structured JSON logging with pretty-print
- ✅ Automatic log rotation (14-30 days)
- ✅ Sensitive data redaction
- ✅ Client and server-side logging
- ✅ Performance tracking (request duration)
- ✅ Error tracking with stack traces
- ✅ Backend proxy request/response logging

All logs are stored in: `logs/{userId}/{sessionId}/application-YYYY-MM-DD.log`
