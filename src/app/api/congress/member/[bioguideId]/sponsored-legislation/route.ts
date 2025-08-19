
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { bioguideId: string } }) {
  const { bioguideId } = await params;
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!API_KEY) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  if (!bioguideId) {
    return NextResponse.json({ error: 'Missing bioguideId parameter' }, { status: 400 });
  }

  try {
    const url = `https://api.congress.gov/v3/member/${bioguideId}/sponsored-legislation?api_key=${API_KEY}&limit=10`;
    console.log(`Fetching sponsored legislation from: ${url}`);
    
    const res = await fetch(url, { 
        next: { revalidate: 3600 }, // Cache for 1 hour
        signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      console.error(`API sponsored legislation request failed for ${bioguideId}: ${res.status}`);
       return NextResponse.json({ error: `Failed to fetch sponsored legislation: ${res.statusText}` }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data.sponsoredLegislation || []);

  } catch (error) {
    console.error(`Error fetching sponsored legislation for ${bioguideId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
