
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { congress: string } }) {
  const { congress } = params;
  const API_KEY = process.env.CONGRESS_API_KEY;
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject');

  if (!API_KEY || API_KEY === 'your_congress_api_key_here') {
    return NextResponse.json({ error: 'Server configuration error: Congress API key is missing or not set.' }, { status: 500 });
  }

  // Validate that congress is a number
  if (isNaN(Number(congress))) {
    return NextResponse.json({ error: 'Invalid congress number provided.' }, { status: 400 });
  }

  try {
    let listUrl = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&limit=20&sort=updateDate+desc`;

    if (subject) {
      listUrl = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&limit=50&subject=${encodeURIComponent(subject)}`;
    }
    
    const listRes = await fetch(listUrl, { next: { revalidate: 3600 } });
    
    if (!listRes.ok) {
      console.error(`API list request failed: ${listRes.status}`);
       return NextResponse.json({ error: `Failed to fetch bill list: ${listRes.statusText}` }, { status: listRes.status });
    }
    
    const listData = await listRes.json();
    return NextResponse.json(listData);

  } catch (error) {
    console.error(`Error fetching bills for congress ${congress}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
