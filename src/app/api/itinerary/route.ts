import { NextRequest, NextResponse } from "next/server";

interface ItineraryRequest {
  message: string;
  session_id: string;
  user_id: string;
  current_itinerary?: any[]; // Array of day itinerary objects
  role: string;
  current_day: number;
  trip_duration: number;
  request_type: string;
}

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body: ItineraryRequest = await request.json();
    const { message, session_id, user_id, current_itinerary, role, current_day, trip_duration, request_type } = body;
    console.log("Itinerary request body:", JSON.stringify(body, null, 2));
    // Validate input
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!session_id || !user_id) {
      return NextResponse.json(
        { error: "Session ID and User ID are required" },
        { status: 400 }
      );
    }

    // Validate current_itinerary - it should be an array (even if empty)
    if (!Array.isArray(current_itinerary)) {
      return NextResponse.json(
        { error: "current_itinerary is required and must be an array" },
        { status: 400 }
      );
    }

    console.log("Proxying itinerary request to backend:", {
      url: `${BACKEND_API_URL}/agents/itinerary`,
      user_id,
      session_id,
      message: message.substring(0, 100) + (message.length > 100 ? "..." : ""),
      current_itinerary: current_itinerary,
      role: role,
      current_day: current_day,
      trip_duration: trip_duration,
      request_type: request_type,
    });

    // Proxy the request to the FastAPI backend
    const response = await fetch(`${BACKEND_API_URL}/agents/itinerary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id,
        session_id,
        message,
        current_itinerary, // ✅ Forward current_itinerary to backend
        role,
        current_day,
        trip_duration,
        request_type,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend itinerary API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { 
          error: `Backend API error: ${response.status} ${response.statusText}`,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Backend itinerary response received:", {
      responseType: data.response_type,
      hasItinerary: !!data.itinerary,
      itineraryLength: data.itinerary?.length || 0
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error("Itinerary API proxy error:", error);
    
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
