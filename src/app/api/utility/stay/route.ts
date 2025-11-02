import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Enhanced logging
    console.log('=== STAY API ROUTE ===');
    console.log('Received request body:', JSON.stringify(body, null, 2));
    console.log('Request has from_date?', 'from_date' in body);
    console.log('Request has to_date?', 'to_date' in body);
    console.log('Request has start_check_in_date?', 'start_check_in_date' in body);
    console.log('Request has end_check_in_date?', 'end_check_in_date' in body);
    console.log('Backend URL:', `${BACKEND_API_URL}/utility/stay`);

    const response = await fetch(`${BACKEND_API_URL}/utility/stay`, {
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
    console.log('Backend stay response text (first 500 chars):', responseText.substring(0, 500));

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

        // Also need to fix the starting_price field - backend sends number, frontend expects string
        const processedStays = data.response.map((stay: any) => ({
          ...stay,
          starting_price: typeof stay.starting_price === 'number'
            ? `₹${stay.starting_price.toLocaleString('en-IN')}`
            : stay.starting_price,
          // Add missing fields that frontend expects
          property_address: stay.property_address || stay.property_name,
          property_location: stay.property_location || stay.city
        }));

        return NextResponse.json(processedStays);
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
      console.error('Failed to parse backend stay response as JSON:', parseError);
      return NextResponse.json(
        {
          error: 'Invalid JSON response from backend',
          responseText: responseText.substring(0, 500)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Stay utility API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch stay data from backend', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
