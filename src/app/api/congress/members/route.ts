// /app/api/congress/members/route.ts
import { NextResponse } from 'next/server';
import type { Member } from '@/types';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const congress = searchParams.get('congress');
  const state = searchParams.get('state')?.toUpperCase();
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!congress || !state || !API_KEY) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const fetchPromises = [
      fetch(`https://api.congress.gov/v3/member?congress=${congress}&chamber=senate&state=${state}&api_key=${API_KEY}`, { next: { revalidate: 3600 } }),
      fetch(`https://api.congress.gov/v3/member?congress=${congress}&chamber=house&state=${state}&api_key=${API_KEY}`, { next: { revalidate: 3600 } }),
    ];

    const [senateResponse, houseResponse] = await Promise.all(fetchPromises);

    if (!senateResponse.ok) {
        console.error(`Failed to fetch senate members for ${state}: ${senateResponse.status}`);
    }
     if (!houseResponse.ok) {
        console.error(`Failed to fetch house members for ${state}: ${houseResponse.status}`);
    }

    const senateData = senateResponse.ok ? await senateResponse.json() : { members: [] };
    const houseData = houseResponse.ok ? await houseResponse.json() : { members: [] };


    return NextResponse.json({
      senators: senateData.members || [],
      representatives: houseData.members || [],
    });

  } catch (err) {
    console.error('Server API Error in member fetch:', err);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
