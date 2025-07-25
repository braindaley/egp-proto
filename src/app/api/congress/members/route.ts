
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

  const url = `https://api.congress.gov/v3/member?congress=${congress}&api_key=${API_KEY}&limit=500`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      console.error(`Failed to fetch members for Congress ${congress}: ${res.status}`);
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: res.status });
    }

    const json = await res.json();
    // Correctly access the nested members array
    const allMembers: Member[] = json.content?.members || [];

    const senators = allMembers
      .filter(m => m.state === state && m.chamber?.toLowerCase() === 'senate');
    const representatives = allMembers
      .filter(m => m.state === state && m.chamber?.toLowerCase() === 'house');

    return NextResponse.json({ senators, representatives });
  } catch (err) {
    console.error('Server API Error in member fetch:', err);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
