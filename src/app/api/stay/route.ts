import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

// Request interface matching the backend StayRequest model
interface StayRequest {
  user_id: string;
  session_id: string;
  city: string;
  country: string;
  check_in_date: string;
  check_out_date: string;
  user_query?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: StayRequest = await request.json();

    // Validate required fields
    if (!body.user_id || !body.session_id || !body.city || !body.country ||
        !body.check_in_date || !body.check_out_date) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['user_id', 'session_id', 'city', 'country', 'check_in_date', 'check_out_date'],
          received: Object.keys(body)
        },
        { status: 400 }
      );
    }

    console.log('Sending stay request to backend:', JSON.stringify(body, null, 2));

    // Forward request to backend /agents/stay endpoint (matching FlightsWidget pattern)
    const response = await fetch(`${BACKEND_API_URL}/agents/stay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Backend stay response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend stay error response:', errorText);
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
    console.log('Backend stay response text:', responseText);
    
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Failed to parse backend response as JSON:', parseError);
      return NextResponse.json(
        { 
          error: 'Invalid JSON response from backend',
          responseText: responseText.substring(0, 500)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Stay API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch stay data from backend', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
