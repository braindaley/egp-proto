
// /app/api/congress/members/route.ts
import { NextResponse } from 'next/server';
import type { Member } from '@/types';

// Helper function to fetch members for a specific chamber
async function getMembers(congress: string, chamber: 'senate' | 'house', state: string, apiKey: string): Promise<Member[]> {
    const url = `https://api.congress.gov/v3/member?congress=${congress}&chamber=${chamber}&state=${state}&api_key=${apiKey}`;
    try {
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) {
            console.error(`Failed to fetch ${chamber} for ${state}: ${res.status}`);
            return [];
        }
        const json = await res.json();
        // Log the raw JSON to inspect its structure during debugging
        // console.log(`🔥 Raw ${chamber} response for ${state}:`, JSON.stringify(json, null, 2));
        
        // The API returns members in the `members` key
        return json.members || [];
    } catch (error) {
        console.error(`Error fetching ${chamber} for ${state}:`, error);
        return [];
    }
}


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const congress = searchParams.get('congress');
  const state = searchParams.get('state')?.toUpperCase();
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!congress || !state || !API_KEY) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    // Fetch senators and representatives in parallel
    const [senateData, houseData] = await Promise.all([
        getMembers(congress, 'senate', state, API_KEY),
        getMembers(congress, 'house', state, API_KEY)
    ]);

    const response = {
        senators: senateData,
        representatives: houseData,
    };
    
    // Log what is being sent to the client
    // console.log("✅ Returning to client:", JSON.stringify(response, null, 2));

    return NextResponse.json(response);

  } catch (err) {
    console.error('Server API Error in member fetch:', err);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
