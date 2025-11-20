import { NextRequest, NextResponse } from "next/server";
import { getLogger, logBackendRequest, logBackendResponse, logAPIError } from "../../utils/logger";

interface PreTripRequest {
  user_id: string;
  session_id: string;
}

interface PreTripResponse {
  user_id: string;
  session_id: string;
  message: string; // Markdown content
}

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let logger: any = null;
  let userId = 'anonymous';
  let sessionId = 'unknown';

  try {
    const body: PreTripRequest = await request.json();
    const { user_id, session_id } = body;

    userId = user_id;
    sessionId = session_id;

    // Get logger for this user/session
    logger = getLogger(userId, sessionId);

    // Log incoming request
    logger.info('Pre-Trip API Request', {
      type: 'api_request',
      endpoint: '/api/pre-trip',
      method: 'POST',
      params: {
        user_id,
        session_id
      }
    });

    // Validate input
    if (!session_id || !user_id) {
      logger.warn('Validation failed: Session ID and User ID are required');
      return NextResponse.json(
        { error: "Session ID and User ID are required" },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_API_URL}/agents/pre-trip`;
    const backendRequestBody = {
      user_id,
      session_id,
    };

    // Log backend request
    logBackendRequest(logger, backendUrl, backendRequestBody);

    // Proxy the request to the FastAPI backend
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

    const data: PreTripResponse = await response.json();

    // Log backend success response
    logBackendResponse(logger, backendUrl, response.status, data, backendDuration);

    const totalDuration = Date.now() - startTime;
    logger.info('Pre-Trip API Response', {
      type: 'api_response',
      endpoint: '/api/pre-trip',
      statusCode: 200,
      duration: `${totalDuration}ms`,
      responsePreview: {
        hasMessage: !!data.message,
        messageLength: data.message?.length || 0,
        messagePreview: data.message?.substring(0, 100) || ""
      }
    });

    return NextResponse.json(data);
  } catch (error) {
    if (logger) {
      logAPIError(logger, '/api/pre-trip', 'POST', error, {
        userId,
        sessionId,
        duration: `${Date.now() - startTime}ms`
      });
    }

    // Provide different error messages based on error type
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

