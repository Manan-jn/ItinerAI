import { NextRequest, NextResponse } from 'next/server';
import { getLogger, logBackendRequest, logBackendResponse, logAPIError } from '../../utils/logger';

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

// Request interface matching the backend StayRequest model
interface StayRequest {
  user_id: string;
  session_id: string;
  city: string;
  country: string;
  check_in_date: string;
  check_out_date: string;
  user_query?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let logger: any = null;
  let userId = 'anonymous';
  let sessionId = 'unknown';

  try {
    const body: StayRequest = await request.json();

    userId = body.user_id;
    sessionId = body.session_id;

    // Get logger for this user/session
    logger = getLogger(userId, sessionId);

    // Log incoming request
    logger.info('Stay API Request', {
      type: 'api_request',
      endpoint: '/api/stay',
      method: 'POST',
      params: {
        user_id: body.user_id,
        session_id: body.session_id,
        city: body.city,
        country: body.country,
        check_in_date: body.check_in_date,
        check_out_date: body.check_out_date
      }
    });

    // Validate required fields
    if (!body.user_id || !body.session_id || !body.city || !body.country ||
        !body.check_in_date || !body.check_out_date) {
      logger.warn('Validation failed: Missing required fields', {
        received: Object.keys(body),
        required: ['user_id', 'session_id', 'city', 'country', 'check_in_date', 'check_out_date']
      });
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['user_id', 'session_id', 'city', 'country', 'check_in_date', 'check_out_date'],
          received: Object.keys(body)
        },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_API_URL}/agents/stay`;
    const backendRequestBody = body;

    // Log backend request
    logBackendRequest(logger, backendUrl, backendRequestBody);

    // Proxy the request to the FastAPI backend
    const backendStartTime = Date.now();
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
          error: 'Backend API error',
          status: response.status,
          details: errorText
        },
        { status: response.status }
      );
    }

    const responseText = await response.text();

    try {
      const data = JSON.parse(responseText);

      // Log backend success response
      logBackendResponse(logger, backendUrl, response.status, data, backendDuration);

      const totalDuration = Date.now() - startTime;
      logger.info('Stay API Response', {
        type: 'api_response',
        endpoint: '/api/stay',
        statusCode: 200,
        duration: `${totalDuration}ms`,
        responsePreview: {
          hasStays: !!data.message?.stays,
          stayDetailsCount: data.message?.stays?.stay_details?.length || 0,
          city: data.message?.stays?.city,
          responseType: data.message?.response_type
        }
      });

      return NextResponse.json(data);
    } catch (parseError) {
      // Log parse error
      logAPIError(logger, '/api/stay', 'POST', parseError, {
        userId,
        sessionId,
        responseText: responseText.substring(0, 500),
        duration: `${Date.now() - startTime}ms`
      });

      return NextResponse.json(
        {
          error: 'Invalid JSON response from backend',
          responseText: responseText.substring(0, 500)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Log error with full context
    if (logger) {
      logAPIError(logger, '/api/stay', 'POST', error, {
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
        error: 'Failed to fetch stay data from backend',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
