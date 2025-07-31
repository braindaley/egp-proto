
// /app/api/congresses/route.ts
import { NextResponse } from 'next/server';
import type { Congress } from '@/types';

function getFallbackCongresses(): Congress[] {
  console.warn('Using fallback congress data due to API error or missing key.');
  return [
    { name: '119th Congress', number: 119, startYear: '2025', endYear: '2027' },
    { name: '118th Congress', number: 118, startYear: '2023', endYear: '2025' },
    { name: '117th Congress', number: 117, startYear: '2021', endYear: '2023' },
    { name: '116th Congress', number: 116, startYear: '2019', endYear: '2021' },
    { name: '115th Congress', number: 115, startYear: '2017', endYear: '2019' },
  ].sort((a, b) => b.number - a.number) as Congress[];
}

export async function GET() {
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!API_KEY) {
    console.error('CONGRESS_API_KEY is not defined on the server.');
    return NextResponse.json({ congresses: getFallbackCongresses() });
  }

  const url = `https://api.congress.gov/v3/congress?limit=250&api_key=${API_KEY}`;
  
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!res.ok) {
      console.error(`Failed to fetch congresses from external API: ${res.status}`);
      return NextResponse.json({ congresses: getFallbackCongresses() });
    }

    const data = await res.json();
    const congresses = (data.congresses || [])
      .filter(Boolean)
      .map((congress: any) => ({
        ...congress,
        number: parseInt(congress.name.match(/(\d+)/)?.[1] || '0', 10)
      }))
      .sort((a: any, b: any) => b.number - a.number);

    if (congresses.length === 0) {
        return NextResponse.json({ congresses: getFallbackCongresses() });
    }

    return NextResponse.json({ congresses });
  } catch (error) {
    console.error('Error in /api/congresses route:', error);
    return NextResponse.json({ congresses: getFallbackCongresses() });
  }
}
