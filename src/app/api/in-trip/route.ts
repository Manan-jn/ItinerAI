import { NextRequest, NextResponse } from "next/server";
import { getLogger, logBackendRequest, logBackendResponse, logAPIError } from "../../utils/logger";

interface InTripRequest {
  user_id: string;
  session_id: string;
  change_of_events: any[];
}

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let logger: any = null;
  let userId = 'anonymous';
  let sessionId = 'unknown';

  try {
    const body: InTripRequest = await request.json();
    const { user_id, session_id, change_of_events } = body;

    userId = user_id;
    sessionId = session_id;

    // Get logger for this user/session
    logger = getLogger(userId, sessionId);

    // Log incoming request
    logger.info('In-Trip API Request', {
      type: 'api_request',
      endpoint: '/api/in-trip',
      method: 'POST',
      params: {
        user_id,
        session_id,
        events_count: change_of_events?.length || 0
      }
    });

    if (!user_id || !session_id || !change_of_events) {
      logger.warn('Validation failed: User ID, Session ID, and change_of_events are required');
      return NextResponse.json(
        { error: "User ID, Session ID, and change_of_events are required" },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_API_URL}/agents/in-trip`;
    const backendRequestBody = {
      user_id,
      session_id,
      change_of_events,
    };

    // Log backend request
    logBackendRequest(logger, backendUrl, backendRequestBody);

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
        {
          error: `Backend API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Log backend success response
    logBackendResponse(logger, backendUrl, response.status, data, backendDuration);

    const totalDuration = Date.now() - startTime;
    logger.info('In-Trip API Response', {
      type: 'api_response',
      endpoint: '/api/in-trip',
      statusCode: 200,
      duration: `${totalDuration}ms`,
      responsePreview: {
        response_type: data.response_type,
        hasItinerary: !!data.itinerary,
        hasText: !!data.text
      }
    });

    return NextResponse.json(data);
  } catch (error) {
    if (logger) {
      logAPIError(logger, '/api/in-trip', 'POST', error, {
        userId,
        sessionId,
        duration: `${Date.now() - startTime}ms`
      });
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          error: "Unable to connect to backend service",
          details:
            "The backend API is not accessible. Please check if the service is running.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

