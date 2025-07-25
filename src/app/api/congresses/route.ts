// /app/api/congresses/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!API_KEY) {
    console.error('CONGRESS_API_KEY is not defined on the server.');
    // Return a fallback or an error
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const url = `https://api.congress.gov/v3/congress?limit=250&api_key=${API_KEY}`;
  
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!res.ok) {
      console.error(`Failed to fetch congresses from external API: ${res.status}`);
      return NextResponse.json({ error: 'Failed to fetch data from external source.' }, { status: res.status });
    }

    const data = await res.json();
    const congresses = (data.congresses || [])
      .filter(Boolean)
      .map((congress: any) => ({
        ...congress,
        number: parseInt(congress.name.match(/(\d+)/)?.[1] || '0', 10)
      }))
      .sort((a: any, b: any) => b.number - a.number);

    return NextResponse.json({ congresses });
  } catch (error) {
    console.error('Error in /api/congresses route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
