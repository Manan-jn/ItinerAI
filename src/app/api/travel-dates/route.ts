import { NextRequest, NextResponse } from 'next/server';
import { getLogger, logBackendRequest, logBackendResponse, logAPIError } from "../../utils/logger";

interface TravelDatesRequest {
  user_id: string;
  session_id: string;
  role: string;
  current_month: string;
  user_message?: string;
}

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let logger: any = null;
  let userId = 'anonymous';
  let sessionId = 'unknown';

  try {
    const body: TravelDatesRequest = await request.json();
    const { user_id, session_id, role, current_month, user_message } = body;

    userId = user_id;
    sessionId = session_id;

    // Get logger for this user/session
    logger = getLogger(userId, sessionId);

    // Log incoming request
    logger.info('Travel Dates API Request', {
      type: 'api_request',
      endpoint: '/api/travel-dates',
      method: 'POST',
      params: {
        user_id,
        session_id,
        role,
        current_month,
        hasUserMessage: !!user_message
      }
    });

    // Validate input
    if (!user_id || !session_id) {
      logger.warn('Validation failed: User ID and Session ID are required');
      return NextResponse.json(
        { error: "User ID and Session ID are required" },
        { status: 400 }
      );
    }

    if (!role) {
      logger.warn('Validation failed: Role is required');
      return NextResponse.json(
        { error: "Role is required" },
        { status: 400 }
      );
    }

    if (!current_month) {
      logger.warn('Validation failed: Current month is required');
      return NextResponse.json(
        { error: "Current month is required" },
        { status: 400 }
      );
    }

    // Build request payload
    const requestPayload: any = {
      user_id,
      session_id,
      role,
      current_month,
    };

    // Add user_message if provided (for chat requests)
    if (user_message) {
      requestPayload.user_message = user_message;
    }

    const backendUrl = `${BACKEND_API_URL}/agents/travel-dates`;

    // Log backend request
    logBackendRequest(logger, backendUrl, requestPayload);

    // Proxy the request to the FastAPI backend
    const backendStartTime = Date.now();
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    const backendDuration = Date.now() - backendStartTime;

    if (!response.ok) {
      const errorText = await response.text();
      logBackendResponse(logger, backendUrl, response.status, { error: errorText }, backendDuration);

      return NextResponse.json(
        {
          error: `Backend API error: ${response.status} ${response.statusText}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Log backend success response
    logBackendResponse(logger, backendUrl, response.status, data, backendDuration);

    const totalDuration = Date.now() - startTime;
    logger.info('Travel Dates API Response', {
      type: 'api_response',
      endpoint: '/api/travel-dates',
      statusCode: 200,
      duration: `${totalDuration}ms`,
      responsePreview: {
        hasMessage: !!data.message,
        hasTravelDates: !!data.message?.travel_dates,
        travelDatesCount: data.message?.travel_dates?.length || 0
      }
    });

    return NextResponse.json(data);

  } catch (error) {
    if (logger) {
      logAPIError(logger, '/api/travel-dates', 'POST', error, {
        userId,
        sessionId,
        duration: `${Date.now() - startTime}ms`
      });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch travel dates from backend",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
