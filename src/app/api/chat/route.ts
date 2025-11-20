import { NextRequest, NextResponse } from "next/server";
import { getLogger, logBackendRequest, logBackendResponse, logAPIError } from "../../utils/logger";
import { extractLogContext } from "../../utils/apiLogger";

interface ChatRequest {
  message: string;
  session_id: string;
  user_id: string;
}

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let logger: any = null;
  let userId = 'anonymous';
  let sessionId = 'unknown';

  try {
    const body: ChatRequest = await request.json();
    const { message, session_id, user_id } = body;

    userId = user_id;
    sessionId = session_id;

    // Get logger for this user/session
    logger = getLogger(userId, sessionId);

    // Log incoming request
    logger.info('Chat API Request', {
      type: 'api_request',
      endpoint: '/api/chat',
      method: 'POST',
      params: {
        user_id,
        session_id,
        message_preview: message?.substring(0, 100) + (message?.length > 100 ? "..." : "")
      }
    });

    // Validate input
    if (!message || !message.trim()) {
      logger.warn('Validation failed: Message is required');
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!session_id || !user_id) {
      logger.warn('Validation failed: Session ID and User ID are required');
      return NextResponse.json(
        { error: "Session ID and User ID are required" },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_API_URL}/agents/chat`;
    const backendRequestBody = {
      user_id,
      session_id,
      message,
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

      // Log backend error response
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
    logger.info('Chat API Response', {
      type: 'api_response',
      endpoint: '/api/chat',
      statusCode: 200,
      duration: `${totalDuration}ms`,
      responsePreview: {
        hasMessage: !!data.message,
        responseType: data.response_type,
        messageLength: data.message?.length || 0
      }
    });

    return NextResponse.json(data);

  } catch (error) {
    // Log error with full context
    if (logger) {
      logAPIError(logger, '/api/chat', 'POST', error, {
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
          details: "The backend API is not accessible. Please check if the service is running."
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
