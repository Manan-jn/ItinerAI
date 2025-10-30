import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const userId = body.user_id;
    const sessionId = body.session_id;
    
    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameters: user_id and session_id' },
        { status: 400 }
      );
    }
    
    console.log('Memory GET API proxy - fetching for:', { userId, sessionId });
    
    // Forward the request to the actual memory GET API
    const response = await fetch(`${BACKEND_API_URL}/memory/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Memory GET API error:', errorText);
      return NextResponse.json(
        { error: `Memory API error: ${errorText}` },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    console.log('Memory GET API success - received data');
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Memory GET API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memory data' },
      { status: 500 }
    );
  }
}
