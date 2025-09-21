import { NextRequest, NextResponse } from 'next/server';

// Configure API route timeout to 10 minutes (600 seconds)
// Note: maxDuration is used by Vercel and other platforms that support it
export const maxDuration = 600;

export async function POST(request: NextRequest) {
  console.log('API route called at:', new Date().toISOString());
  
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    // Create AbortController for 10-minute timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Request timeout after 10 minutes');
      controller.abort();
    }, 600000); // 10 minutes in milliseconds
    
    console.log('Forwarding request to FastAPI...');
    
    // Forward the request to the FastAPI endpoint with extended timeout
    const response = await fetch(
      'https://my-fastapi-agent-274602328761.asia-south1.run.app/chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );

    // Clear the timeout if request completes successfully
    clearTimeout(timeoutId);
    console.log('FastAPI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI Error:', errorText);
      return NextResponse.json(
        { error: `FastAPI error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('FastAPI response data:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy API Error:', error);
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    
    // Handle timeout errors specifically
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Request aborted due to timeout');
      return NextResponse.json(
        { error: 'Request timeout - The AI is taking longer than expected. Please try again.' },
        { status: 408 }
      );
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.log('Network/fetch error detected');
      return NextResponse.json(
        { error: 'Network error - Unable to connect to AI service. Please try again.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
