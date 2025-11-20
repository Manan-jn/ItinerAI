/**
 * API Logger Middleware
 *
 * Provides a wrapper for Next.js API routes to automatically log
 * requests and responses with session/user context.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getLogger,
  getAppLogger,
  logAPIRequest,
  logAPIResponse,
  logAPIError,
  logBackendRequest,
  logBackendResponse
} from './logger';

export interface APILogContext {
  userId?: string;
  sessionId?: string;
  endpoint: string;
  method: string;
}

/**
 * Extract user and session IDs from request
 */
export function extractLogContext(
  request: NextRequest,
  body?: any
): { userId: string; sessionId: string } {
  // Try to get from body first
  if (body) {
    if (body.user_id && body.session_id) {
      return {
        userId: body.user_id,
        sessionId: body.session_id
      };
    }
  }

  // Try to get from URL params
  const userId = request.nextUrl.searchParams.get('user_id') ||
                 request.nextUrl.searchParams.get('userId') ||
                 'anonymous';
  const sessionId = request.nextUrl.searchParams.get('session_id') ||
                    request.nextUrl.searchParams.get('sessionId') ||
                    'unknown';

  return { userId, sessionId };
}

/**
 * Wrapper for API route handlers with automatic logging
 *
 * Usage:
 * export async function POST(request: NextRequest) {
 *   return withAPILogging(request, async (req, body, logger) => {
 *     // Your API logic here
 *     return NextResponse.json({ success: true });
 *   });
 * }
 */
export async function withAPILogging(
  request: NextRequest,
  handler: (
    request: NextRequest,
    body: any,
    logger: any,
    context: APILogContext
  ) => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;

  let body: any = null;
  let userId = 'anonymous';
  let sessionId = 'unknown';
  let logger: any;

  try {
    // Parse request body if it exists
    if (request.method !== 'GET') {
      try {
        body = await request.json();
      } catch (e) {
        // No JSON body or invalid JSON
        body = null;
      }
    }

    // Extract user and session context
    const context = extractLogContext(request, body);
    userId = context.userId;
    sessionId = context.sessionId;

    // Get logger for this user/session
    logger = userId !== 'anonymous' && sessionId !== 'unknown'
      ? getLogger(userId, sessionId)
      : getAppLogger();

    // Create log context
    const logContext: APILogContext = {
      userId,
      sessionId,
      endpoint,
      method
    };

    // Log incoming request
    logAPIRequest(logger, endpoint, method, {
      query: Object.fromEntries(request.nextUrl.searchParams),
      body,
      headers: {
        'content-type': request.headers.get('content-type'),
        'user-agent': request.headers.get('user-agent')
      }
    });

    // Execute handler
    const response = await handler(request, body, logger, logContext);

    // Log successful response
    const duration = Date.now() - startTime;

    // Try to extract response body for logging
    let responseData: any = null;
    try {
      const responseClone = response.clone();
      responseData = await responseClone.json();
    } catch (e) {
      responseData = { message: 'Non-JSON response' };
    }

    logAPIResponse(
      logger,
      endpoint,
      method,
      response.status,
      responseData,
      duration
    );

    return response;

  } catch (error) {
    // Log error
    const duration = Date.now() - startTime;

    logger = logger || getAppLogger();

    logAPIError(logger, endpoint, method, error, {
      userId,
      sessionId,
      body,
      duration: `${duration}ms`
    });

    // Return error response
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Log backend proxy requests (for routes that proxy to backend API)
 */
export async function logBackendProxyRequest(
  logger: any,
  backendUrl: string,
  requestBody: any,
  backendResponse: Response,
  startTime: number
) {
  const duration = Date.now() - startTime;

  // Log the outgoing backend request
  logBackendRequest(logger, backendUrl, requestBody);

  // Try to parse backend response
  let responseData: any = null;
  try {
    const responseClone = backendResponse.clone();
    responseData = await responseClone.json();
  } catch (e) {
    try {
      const responseClone = backendResponse.clone();
      responseData = await responseClone.text();
    } catch (e2) {
      responseData = { message: 'Unable to parse response' };
    }
  }

  // Log backend response
  logBackendResponse(
    logger,
    backendUrl,
    backendResponse.status,
    responseData,
    duration
  );

  return responseData;
}

/**
 * Create a simple request logger for client-side API calls
 */
export function createClientAPILogger(userId: string, sessionId: string) {
  return {
    logRequest: (endpoint: string, method: string, params: any) => {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log(`[API Request] ${method} ${endpoint}`, {
          userId,
          sessionId,
          params,
          timestamp: new Date().toISOString()
        });
      }
    },
    logResponse: (endpoint: string, method: string, response: any) => {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log(`[API Response] ${method} ${endpoint}`, {
          userId,
          sessionId,
          response,
          timestamp: new Date().toISOString()
        });
      }
    },
    logError: (endpoint: string, method: string, error: any) => {
      if (typeof window !== 'undefined') {
        console.error(`[API Error] ${method} ${endpoint}`, {
          userId,
          sessionId,
          error,
          timestamp: new Date().toISOString()
        });
      }
    }
  };
}

export default {
  withAPILogging,
  extractLogContext,
  logBackendProxyRequest,
  createClientAPILogger
};
