import { NextRequest, NextResponse } from 'next/server';

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
  try {
    const body: ConveyanceRequest = await request.json();

    // Validate required fields
    if (!body.user_id || !body.session_id || !body.from_city || !body.from_country ||
        !body.to_city || !body.to_country || !body.date) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['user_id', 'session_id', 'from_city', 'from_country', 'to_city', 'to_country', 'date'],
          received: Object.keys(body)
        },
        { status: 400 }
      );
    }

    console.log('Sending request to backend:', JSON.stringify(body, null, 2));

    const response = await fetch(`${BACKEND_API_URL}/agents/conveyance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
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
    console.log('Backend response text:', responseText);
    
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Failed to parse backend response as JSON:', parseError);
      return NextResponse.json(
        { 
          error: 'Invalid JSON response from backend',
          responseText: responseText.substring(0, 500) // First 500 chars for debugging
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Proxy API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch from backend', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
