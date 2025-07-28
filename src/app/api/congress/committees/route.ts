
import { NextResponse, type NextRequest } from 'next/server';
import type { CommitteeInfo } from '@/types';

async function fetchChamberCommittees(congress: string, chamber: 'House' | 'Senate', apiKey: string): Promise<CommitteeInfo[]> {
    const url = `https://api.congress.gov/v3/committee/${chamber}/${congress}?limit=250&api_key=${apiKey}`;
    try {
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) {
            console.error(`Failed to fetch ${chamber} committees for congress ${congress}: ${res.status}`);
            return [];
        }
        const data = await res.json();
        // The congress.gov API doesn't have a simple subcommittee flag.
        // We filter by name, as subcommittees are typically named "Subcommittee on...".
        // This is a common pattern for this API.
        return (data.committees || []).filter((c: any) => !c.name.toLowerCase().startsWith('subcommittee on'));
    } catch (error) {
        console.error(`Error fetching ${chamber} committees:`, error);
        return [];
    }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const congress = searchParams.get('congress');
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!congress || !API_KEY) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const [houseCommittees, senateCommittees] = await Promise.all([
        fetchChamberCommittees(congress, 'House', API_KEY),
        fetchChamberCommittees(congress, 'Senate', API_KEY)
    ]);

    return NextResponse.json({ houseCommittees, senateCommittees });

  } catch (error) {
    console.error('Server API Error in committees route:', error);
    return NextResponse.json({ error: 'Failed to fetch committees' }, { status: 500 });
  }
}
