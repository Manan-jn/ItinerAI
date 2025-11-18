import { NextRequest, NextResponse } from 'next/server';

interface TravelDatesRequest {
  user_id: string;
  session_id: string;
  role: string;
  current_month: string;
  user_message?: string;
}

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body: TravelDatesRequest = await request.json();
    const { user_id, session_id, role, current_month, user_message } = body;

    // Validate input
    if (!user_id || !session_id) {
      return NextResponse.json(
        { error: "User ID and Session ID are required" },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { error: "Role is required" },
        { status: 400 }
      );
    }

    if (!current_month) {
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

    console.log("Proxying travel-dates request to backend:", {
      url: `${BACKEND_API_URL}/agents/travel-dates`,
      user_id,
      session_id,
      role,
      current_month,
      hasUserMessage: !!user_message,
    });

    // Proxy the request to the FastAPI backend
    const response = await fetch(`${BACKEND_API_URL}/agents/travel-dates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend API error:", {
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
    console.log("Backend travel-dates response received:", {
      hasMessage: !!data.message,
      hasTravelDates: !!data.message?.travel_dates,
      travelDatesCount: data.message?.travel_dates?.length || 0
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error("Travel-dates API proxy error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch travel dates from backend", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
