import { NextRequest, NextResponse } from "next/server";

interface ChatRequest {
  message: string;
  session_id: string;
  user_id: string;
}

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, session_id, user_id } = body;

    // Validate input
    if (!message || !message.trim()) {
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

    console.log("Proxying request to backend:", {
      url: `${BACKEND_API_URL}/agents/chat`,
      user_id,
      session_id,
      message: message.substring(0, 100) + (message.length > 100 ? "..." : "")
    });

    // Proxy the request to the FastAPI backend
    const response = await fetch(`${BACKEND_API_URL}/agents/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id,
        session_id,
        message,
      }),
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
    console.log("Backend response received:", {
      hasMessage: !!data.message,
      messageLength: data.message?.length || 0
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error("Chat API proxy error:", error);
    
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
