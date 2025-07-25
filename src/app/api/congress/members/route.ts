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

  async function fetchMembers(chamber: 'house' | 'senate'): Promise<Member[]> {
    const url = `https://api.congress.gov/v3/member/${congress}/${chamber}?state=${state}&api_key=${API_KEY}&limit=250`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      console.error(`Failed to fetch ${chamber} for ${state}: ${res.status}`);
      return [];
    }

    const json = await res.json();
    // The API returns members, but we need to inject the chamber info ourselves for the MemberCard
    const members: Member[] = json.members || [];
    return members.map(m => ({ ...m, chamber: chamber.charAt(0).toUpperCase() + chamber.slice(1) }));
  }

  try {
    const [senators, representatives] = await Promise.all([
      fetchMembers('senate'),
      fetchMembers('house'),
    ]);
    
    // Now we need to manually add the chamber to each member object
    const senatorsWithChamber = senators.map(s => ({...s, chamber: 'Senate' }));
    const repsWithChamber = representatives.map(r => ({...r, chamber: 'House' }));

    return NextResponse.json({ senators: senatorsWithChamber, representatives: repsWithChamber });
  } catch (err) {
    console.error('Server API Error in member fetch:', err);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
