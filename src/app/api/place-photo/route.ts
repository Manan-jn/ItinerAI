import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const photoreference = searchParams.get('photoreference');
  const maxwidth = searchParams.get('maxwidth') || '400';
  const maxheight = searchParams.get('maxheight') || '400';

  if (!photoreference) {
    return NextResponse.json(
      { error: 'Photo reference is required' },
      { status: 400 }
    );
  }

  try {
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${photoreference}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(photoUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
    
  } catch (error) {
    console.error('Error fetching place photo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
