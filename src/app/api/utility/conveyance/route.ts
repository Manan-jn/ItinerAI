import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Enhanced logging
    console.log('=== CONVEYANCE API ROUTE ===');
    console.log('Received request body:', JSON.stringify(body, null, 2));
    console.log('Request has from_date?', 'from_date' in body);
    console.log('Request has to_date?', 'to_date' in body);
    console.log('Request has start_date?', 'start_date' in body);
    console.log('Request has end_date?', 'end_date' in body);
    console.log('Backend URL:', `${BACKEND_API_URL}/utility/conveyance`);

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
    console.log('Backend conveyance response text (first 500 chars):', responseText.substring(0, 500));

    try {
      const data = JSON.parse(responseText);
      console.log('Parsed response structure:', {
        hasStatus: 'status' in data,
        hasResponse: 'response' in data,
        isArray: Array.isArray(data),
        isResponseArray: data.response && Array.isArray(data.response)
      });

      // Backend returns {status: "success", response: [...]}
      // Frontend expects direct array [...]
      if (data.status === 'success' && Array.isArray(data.response)) {
        console.log(`Unwrapping response array with ${data.response.length} items`);

        // Process the response to ensure all required fields exist
        const processedResponse = data.response.map((item: any) => {
          // Add travel_class_options if missing
          if (!item.travel_class_options) {
            if (item.price) {
              // For flights: extract from price object
              if ('economy' in item.price || 'business' in item.price || 'first' in item.price) {
                item.travel_class_options = Object.keys(item.price)
                  .filter(key => item.price[key] !== null && item.price[key] !== undefined)
                  .map(key => key.charAt(0).toUpperCase() + key.slice(1));
              }
              // For trains: extract from price object
              else if ('1AC' in item.price || '2AC' in item.price || '3AC' in item.price) {
                item.travel_class_options = Object.keys(item.price)
                  .filter(key => item.price[key] !== null && item.price[key] !== undefined);
              }
            }
          }

          return item;
        });

        return NextResponse.json(processedResponse);
      }

      // If it's already an array, return as-is
      if (Array.isArray(data)) {
        console.log(`Response is already an array with ${data.length} items`);
        return NextResponse.json(data);
      }

      // Otherwise return the data as-is (shouldn't happen but fallback)
      console.warn('Response structure unexpected, returning as-is');
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
