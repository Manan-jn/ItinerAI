import { NextRequest, NextResponse } from "next/server";

interface InTripRequest {
  user_id: string;
  session_id: string;
  change_of_events: any[];
}

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body: InTripRequest = await request.json();
    const { user_id, session_id, change_of_events } = body;

    if (!user_id || !session_id || !change_of_events) {
      return NextResponse.json(
        { error: "User ID, Session ID, and change_of_events are required" },
        { status: 400 }
      );
    }

    console.log("Proxying in-trip request to backend:", {
      url: `${BACKEND_API_URL}/agents/in-trip`,
      user_id,
      session_id,
      events_count: change_of_events.length,
    });

    const response = await fetch(`${BACKEND_API_URL}/agents/in-trip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id,
        session_id,
        change_of_events,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend in-trip API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      return NextResponse.json(
        {
          error: `Backend API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Backend in-trip response received:", {
      response_type: data.response_type,
      hasItinerary: !!data.itinerary,
      hasText: !!data.text,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("In-trip API proxy error:", error);

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

