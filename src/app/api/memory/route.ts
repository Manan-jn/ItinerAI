import { NextRequest, NextResponse } from 'next/server';
import { getLogger, logBackendRequest, logBackendResponse, logAPIError } from "../../utils/logger";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let logger: any = null;
  let userId = 'anonymous';
  let sessionId = 'unknown';

  try {
    // Get the request body
    const body = await request.json();
    userId = body.user_id || 'anonymous';
    sessionId = body.session_id || 'unknown';

    // Get logger for this user/session
    logger = getLogger(userId, sessionId);

    // Log incoming request
    logger.info('Memory API Request', {
      type: 'api_request',
      endpoint: '/api/memory',
      method: 'POST',
      params: {
        user_id: userId,
        session_id: sessionId,
        updates_keys: Object.keys(body.updates || {})
      }
    });

    const backendUrl = `${BACKEND_API_URL}/memory/add`;

    // Log backend request
    logBackendRequest(logger, backendUrl, body);

    // Forward the request to the actual memory API
    const backendStartTime = Date.now();
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const backendDuration = Date.now() - backendStartTime;

    if (!response.ok) {
      const errorText = await response.text();
      logBackendResponse(logger, backendUrl, response.status, { error: errorText }, backendDuration);
      return NextResponse.json(
        { error: `Memory API error: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Log backend success response
    logBackendResponse(logger, backendUrl, response.status, result, backendDuration);

    const totalDuration = Date.now() - startTime;
    logger.info('Memory API Response', {
      type: 'api_response',
      endpoint: '/api/memory',
      statusCode: 200,
      duration: `${totalDuration}ms`
    });

    return NextResponse.json(result);

  } catch (error) {
    if (logger) {
      logAPIError(logger, '/api/memory', 'POST', error, {
        userId,
        sessionId,
        duration: `${Date.now() - startTime}ms`
      });
    }

    return NextResponse.json(
      { error: 'Failed to update memory' },
      { status: 500 }
    );
  }
}
