import { NextRequest, NextResponse } from 'next/server';
import { getLogger, logBackendRequest, logBackendResponse, logAPIError } from '../../utils/logger';

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

// Request interface matching the backend ConveyanceRequest model
interface ConveyanceRequest {
  user_id: string;
  session_id: string;
  from_city: string;
  from_country: string;
  to_city: string;
  to_country: string;
  date: string;
  user_query?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let logger: any = null;
  let userId = 'anonymous';
  let sessionId = 'unknown';

  try {
    const body: ConveyanceRequest = await request.json();

    userId = body.user_id;
    sessionId = body.session_id;

    // Get logger for this user/session
    logger = getLogger(userId, sessionId);

    // Log incoming request
    logger.info('Conveyance API Request', {
      type: 'api_request',
      endpoint: '/api/conveyance',
      method: 'POST',
      params: {
        user_id: body.user_id,
        session_id: body.session_id,
        from_city: body.from_city,
        to_city: body.to_city,
        date: body.date,
        from_country: body.from_country,
        to_country: body.to_country
      }
    });

    // Validate required fields
    if (!body.user_id || !body.session_id || !body.from_city || !body.from_country ||
        !body.to_city || !body.to_country || !body.date) {
      logger.warn('Validation failed: Missing required fields', {
        received: Object.keys(body),
        required: ['user_id', 'session_id', 'from_city', 'from_country', 'to_city', 'to_country', 'date']
      });
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['user_id', 'session_id', 'from_city', 'from_country', 'to_city', 'to_country', 'date'],
          received: Object.keys(body)
        },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_API_URL}/agents/conveyance`;
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
      logger.info('Conveyance API Response', {
        type: 'api_response',
        endpoint: '/api/conveyance',
        statusCode: 200,
        duration: `${totalDuration}ms`,
        responsePreview: {
          hasConveyances: !!data.message?.conveyances,
          flightsCount: data.message?.conveyances?.conveyance_details?.flights?.length || 0,
          trainsCount: data.message?.conveyances?.conveyance_details?.trains?.length || 0,
          responseType: data.message?.response_type
        }
      });

      return NextResponse.json(data);
    } catch (parseError) {
      // Log parse error
      logAPIError(logger, '/api/conveyance', 'POST', parseError, {
        userId,
        sessionId,
        responseText: responseText.substring(0, 500),
        duration: `${Date.now() - startTime}ms`
      });

      return NextResponse.json(
        {
          error: 'Invalid JSON response from backend',
          responseText: responseText.substring(0, 500) // First 500 chars for debugging
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Log error with full context
    if (logger) {
      logAPIError(logger, '/api/conveyance', 'POST', error, {
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
        error: 'Failed to fetch from backend',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
