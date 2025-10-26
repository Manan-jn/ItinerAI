import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Sending conveyance utility request to backend:', JSON.stringify(body, null, 2));
    
    const response = await fetch(`${BACKEND_API_URL}/utility/conveyance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Backend conveyance response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend conveyance error response:', errorText);
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
    console.log('Backend conveyance response text:', responseText);
    
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Failed to parse backend conveyance response as JSON:', parseError);
      return NextResponse.json(
        { 
          error: 'Invalid JSON response from backend',
          responseText: responseText.substring(0, 500)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Conveyance utility API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch conveyance data from backend', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
