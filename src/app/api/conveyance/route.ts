import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Sending request to backend:', JSON.stringify(body, null, 2));
    
    const response = await fetch('http://127.0.0.1:8000/agents/conveyance', {
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
      { error: 'Failed to fetch from backend', details: error.message },
      { status: 500 }
    );
  }
}
