import { NextRequest, NextResponse } from "next/server";
import { getLogger, getAppLogger, logBackendRequest, logBackendResponse, logAPIError } from "../../../utils/logger";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

/**
 * POST /api/session/create
 * Creates a new session for a user by forwarding to backend API
 *
 * Request Body:
 * {
 *   "user_id": "234",
 *   "phone_number": "+1234567890"
 * }
 *
 * Response:
 * {
 *   "message": "Session created successfully",
 *   "body": {
 *     "user_id": "234",
 *     "session_id": "6414790804857946112"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let logger: any = null;
  let userId = 'unknown';

  try {
    // Get request body
    const body = await request.json();
    userId = body.user_id;
    const phoneNumber = body.phone_number;

    // Use app logger since we don't have session yet
    logger = getAppLogger();

    // Log incoming request
    logger.info('Session Create API Request', {
      type: 'api_request',
      endpoint: '/api/session/create',
      method: 'POST',
      params: { user_id: userId, phone_number: phoneNumber ? '***' : undefined }
    });

    // Validate user_id
    if (!userId) {
      logger.warn('Validation failed: user_id is required');
      return NextResponse.json(
        {
          error: "user_id is required",
          message: "Missing user_id in request body",
        },
        { status: 400 }
      );
    }

    // Validate phone_number
    if (!phoneNumber) {
      logger.warn('Validation failed: phone_number is required');
      return NextResponse.json(
        {
          error: "phone_number is required",
          message: "Missing phone_number in request body",
        },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_API_URL}/session/create`;
    const backendRequestBody = { user_id: userId, phone_number: phoneNumber };

    // Log backend request
    logBackendRequest(logger, backendUrl, backendRequestBody);

    // Forward the request to the backend session create API
    const backendStartTime = Date.now();
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendRequestBody),
    });

    const backendDuration = Date.now() - backendStartTime;

    if (!response.ok) {
      const errorText = await response.text();
      logBackendResponse(logger, backendUrl, response.status, { error: errorText }, backendDuration);
      return NextResponse.json(
        { error: `Session API error: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Log backend success response
    logBackendResponse(logger, backendUrl, response.status, result, backendDuration);

    // Now that we have session_id, create a proper logger
    const sessionId = result.body?.session_id;
    if (sessionId) {
      logger = getLogger(userId, sessionId);
    }

    const totalDuration = Date.now() - startTime;
    logger.info('Session Create API Response', {
      type: 'api_response',
      endpoint: '/api/session/create',
      statusCode: 200,
      duration: `${totalDuration}ms`,
      responsePreview: {
        user_id: result.body?.user_id,
        session_id: result.body?.session_id
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    if (logger) {
      logAPIError(logger, '/api/session/create', 'POST', error, {
        userId,
        duration: `${Date.now() - startTime}ms`
      });
    }

    return NextResponse.json(
      {
        error: "Failed to create session",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
