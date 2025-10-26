import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    
    console.log('Memory API proxy - received request:', body);
    
    // Forward the request to the actual memory API
    const response = await fetch(`${BACKEND_API_URL}/memory/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Memory API error:', errorText);
      return NextResponse.json(
        { error: `Memory API error: ${errorText}` },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    console.log('Memory API success:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Memory API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to update memory' },
      { status: 500 }
    );
  }
}
