import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placeId = searchParams.get('place_id');

    if (!placeId) {
      return NextResponse.json(
        { error: 'Missing place_id parameter' },
        { status: 400 }
      );
    }

    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      );
    }

    // Use Google Places Details API
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,types,formatted_address,photos,place_id&key=${GOOGLE_PLACES_API_KEY}`;

    console.log('Place Details API request:', { placeId });

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Place Details API error:', data);
      return NextResponse.json(
        { error: `Google Places API error: ${data.status}` },
        { status: 500 }
      );
    }

    const result = data.result;

    // Determine activity type based on place types
    let activityType = 'place';
    let activityCategory = result.types?.[0] || 'attraction';

    if (result.types?.some((t: string) => ['restaurant', 'food', 'cafe', 'meal_takeaway', 'meal_delivery'].includes(t))) {
      activityType = 'food';
      activityCategory = 'dining';
    } else if (result.types?.some((t: string) => ['tourist_attraction', 'museum', 'art_gallery', 'zoo', 'amusement_park'].includes(t))) {
      activityType = 'place';
      activityCategory = 'tourist_attraction';
    } else if (result.types?.some((t: string) => ['shopping_mall', 'store', 'clothing_store'].includes(t))) {
      activityType = 'shopping';
      activityCategory = 'shopping';
    } else if (result.types?.some((t: string) => ['spa', 'gym', 'beauty_salon'].includes(t))) {
      activityType = 'wellness';
      activityCategory = 'wellness';
    } else if (result.types?.some((t: string) => ['park', 'natural_feature'].includes(t))) {
      activityType = 'activity';
      activityCategory = 'outdoor';
    }

    const activityData = {
      type: activityType,
      category: activityCategory,
      name: result.name,
      description: result.formatted_address || 'A must-visit location',
      place_id: result.place_id,
      photos: result.photos?.map((photo: any) =>
        photo.photo_reference ?
        `https://maps.googleapis.com/maps/api/place/photo?photoreference=${photo.photo_reference}&maxwidth=400&key=${GOOGLE_PLACES_API_KEY}`
        : null
      ).filter(Boolean) || []
    };

    console.log('Place details fetched:', { name: result.name, type: activityType });

    return NextResponse.json(activityData);
  } catch (error) {
    console.error('Place details error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch place details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
