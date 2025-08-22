import { NextResponse, type NextRequest } from 'next/server';
import type { LegislatorData, ExtendedMemberIds } from '@/types';

let legislatorsCache: LegislatorData[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

async function fetchLegislatorsData(): Promise<LegislatorData[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (legislatorsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('Using cached legislators data');
    return legislatorsCache;
  }

  try {
    console.log('Fetching legislators data from GitHub...');
    const response = await fetch('https://unitedstates.github.io/congress-legislators/legislators-current.json', {
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch legislators data: ${response.statusText}`);
    }
    
    const data = await response.json();
    legislatorsCache = data;
    cacheTimestamp = now;
    
    console.log(`Cached ${data.length} legislators`);
    return data;
  } catch (error) {
    console.error('Error fetching legislators data:', error);
    return [];
  }
}

function findLegislatorByBioguide(legislators: LegislatorData[], bioguideId: string): ExtendedMemberIds | null {
  const legislator = legislators.find(leg => leg.id?.bioguide === bioguideId);
  if (legislator) {
    console.log(`Found extended IDs for ${bioguideId}:`, legislator.id);
  } else {
    console.log(`No extended IDs found for ${bioguideId}`);
  }
  return legislator?.id || null;
}

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
    console.log(`Processing request for bioguideId: ${bioguideId}`);
    
    // Fetch both Congress API data and legislators data in parallel
    const [congressResponse, legislatorsData] = await Promise.all([
      fetch(`https://api.congress.gov/v3/member/${bioguideId}?api_key=${API_KEY}`, { 
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(15000)
      }),
      fetchLegislatorsData()
    ]);

    if (!congressResponse.ok) {
      console.error(`API member detail request failed for ${bioguideId}: ${congressResponse.status}`);
      return NextResponse.json({ error: `Failed to fetch member details: ${congressResponse.statusText}` }, { status: congressResponse.status });
    }
    
    const congressData = await congressResponse.json();
    const member = congressData.member;

    // Find extended IDs from legislators data
    const extendedIds = findLegislatorByBioguide(legislatorsData, bioguideId);
    
    // Merge the data
    if (extendedIds) {
      member.extendedIds = extendedIds;
      console.log(`Successfully merged extended IDs for ${bioguideId}`);
    } else {
      console.log(`No extended IDs to merge for ${bioguideId}`);
    }

    console.log('Final member object structure:', {
      bioguideId: member.bioguideId,
      hasExtendedIds: !!member.extendedIds,
      extendedIdsKeys: member.extendedIds ? Object.keys(member.extendedIds) : 'none'
    });

    return NextResponse.json(member);

  } catch (error) {
    console.error(`Error fetching member details for ${bioguideId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}