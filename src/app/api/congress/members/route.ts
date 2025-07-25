import { NextResponse } from 'next/server';
import type { Member } from '@/types';

// State abbreviation to full name mapping
const STATE_MAPPING: { [key: string]: string } = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  // Territories and other jurisdictions
  'DC': 'District of Columbia', 'PR': 'Puerto Rico', 'VI': 'Virgin Islands', 
  'GU': 'Guam', 'AS': 'American Samoa', 'MP': 'Northern Mariana Islands'
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const congress = searchParams.get('congress');
  const stateAbbr = searchParams.get('state')?.toUpperCase();
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!congress || !stateAbbr || !API_KEY) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // Convert state abbreviation to full name
  const stateName = STATE_MAPPING[stateAbbr];
  
  if (!stateName) {
    return NextResponse.json({ error: `Invalid state abbreviation: ${stateAbbr}` }, { status: 400 });
  }

  // Fetch all pages of members for the specified congress
  let allMembers: any[] = [];
  let offset = 0;
  const limit = 250;
  let hasMore = true;

  try {
    while (hasMore) {
      // Correct external API endpoint
      const url = `https://api.congress.gov/v3/member/congress/${congress}?api_key=${API_KEY}&limit=${limit}&offset=${offset}`;
      const res = await fetch(url, { next: { revalidate: 3600 } });

      if (!res.ok) {
        console.error(`External API fetch failed for ${url} with status ${res.status}`);
        return NextResponse.json({ error: 'Failed to fetch members from external source' }, { status: res.status });
      }

      const json = await res.json();
      const members = json.members || [];
      allMembers = allMembers.concat(members);
      
      // Check if there are more pages
      hasMore = !!json.pagination?.next;
      offset += limit;
      
      // Safety check to avoid infinite loops
      if (offset > 2000) break;
    }
    
    // The external API uses full state names. Filter by the mapped state name.
    const stateMembers = allMembers.filter(member => member.state === stateName);

    const senators = stateMembers.filter(member => {
      // Check the terms array for a 'Senate' chamber entry.
      // The API structure seems to be member -> terms -> item[] -> chamber
      const terms = member.terms?.item || [];
      return terms.some((term: any) => term.chamber?.toLowerCase() === 'senate');
    });

    const representatives = stateMembers.filter(member => {
      // Check the terms array for a 'House of Representatives' chamber entry.
      const terms = member.terms?.item || [];
      return terms.some((term: any) => term.chamber?.toLowerCase() === 'house of representatives');
    });

    return NextResponse.json({ 
      senators, 
      representatives
    });
  } catch (err) {
    console.error('Error in /api/congress/members route:', err);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
