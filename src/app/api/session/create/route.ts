import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

/**
 * POST /api/session/create
 * Creates a new session for a user by forwarding to backend API
 *
 * Request Body:
 * {
 *   "user_id": "234"
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
  try {
    // Get request body
    const body = await request.json();
    const userId = body.user_id;

    // Validate user_id
    if (!userId) {
      return NextResponse.json(
        {
          error: "user_id is required",
          message: "Missing user_id in request body",
        },
        { status: 400 }
      );
    }

    console.log("Session CREATE API proxy - creating session for:", { userId });

    // Forward the request to the backend session create API
    const response = await fetch(`${BACKEND_API_URL}/session/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Session CREATE API error:", errorText);
      return NextResponse.json(
        { error: `Session API error: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log("✅ Session CREATE API success:", {
      user_id: result.body?.user_id,
      session_id: result.body?.session_id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Session CREATE API proxy error:", error);
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
