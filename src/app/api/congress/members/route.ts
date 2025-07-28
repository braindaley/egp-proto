import { NextResponse } from 'next/server';
import type { Member } from '@/types';

// State abbreviation to full name mapping for validation
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
  const stateParam = searchParams.get('state');
  const debug = searchParams.get('debug');
  const API_KEY = process.env.CONGRESS_API_KEY;

  // Ensure state is always 2 letters and capitalized
  const stateAbbr = stateParam?.trim().toUpperCase();

  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    parameters: { congress, stateParam, stateAbbr },
    environment: {
      hasApiKey: !!API_KEY,
      apiKeyLength: API_KEY?.length || 0,
    },
    tests: []
  };

  if (!congress || !stateAbbr || stateAbbr.length !== 2 || !API_KEY) {
    const error = { error: 'Missing required parameters', debug: debugInfo };
    return NextResponse.json(debug ? error : { error: 'Missing required parameters' }, { status: 400 });
  }

  // Validate state abbreviation
  if (!STATE_MAPPING[stateAbbr]) {
    const error = { error: `Invalid state abbreviation: ${stateAbbr}`, debug: debugInfo };
    return NextResponse.json(debug ? error : { error: `Invalid state abbreviation: ${stateAbbr}` }, { status: 400 });
  }

  try {
    // CORRECT API ENDPOINT: Get all members for a specific congress and state
    const membersUrl = `https://api.congress.gov/v3/member/congress/${congress}/${stateAbbr}?currentMember=false&limit=250&api_key=${API_KEY}`;
    
    if (debug) {
      debugInfo.tests.push({ name: 'Members URL', url: membersUrl });
    }
    
    const membersRes = await fetch(membersUrl, { next: { revalidate: 3600 } });
    const membersJson = await membersRes.json();
    
    if (debug) {
      debugInfo.tests.push({
        name: 'Members Response',
        status: membersRes.status,
        ok: membersRes.ok,
        dataKeys: Object.keys(membersJson),
        error: membersJson.error || null,
        fullResponse: membersJson
      });
    }

    if (!membersRes.ok) {
      if (debug) {
        return NextResponse.json({ 
          error: 'API request failed', 
          debug: debugInfo 
        }, { status: 500 });
      }
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    const allMembers = membersJson.members || [];

    // Separate senators and representatives based on their current terms
    const senators: any[] = [];
    const representatives: any[] = [];

    allMembers.forEach((member: any) => {
      if (!member.terms?.item) return;

      // Since we're getting members for a specific congress/state, 
      // we can filter by chamber from their terms
      const hasSenateTerm = member.terms.item.some((term: any) => 
        term.chamber === 'Senate'
      );
      const hasHouseTerm = member.terms.item.some((term: any) => 
        term.chamber === 'House of Representatives'
      );

      if (hasSenateTerm) {
        senators.push(member);
      }
      if (hasHouseTerm) {
        representatives.push(member);
      }
    });

    if (debug) {
      debugInfo.tests.push({
        name: 'Filtering Results',
        totalMembers: allMembers.length,
        senators: senators.length,
        representatives: representatives.length,
        sampleMember: allMembers[0] || null
      });
    }

    const result = { 
      senators, 
      representatives,
      ...(debug && { debug: debugInfo })
    };
    
    return NextResponse.json(result);

  } catch (err: any) {
    const error = {
      error: 'Failed to fetch members',
      ...(debug && { debug: { ...debugInfo, error: err.message, stack: err.stack } })
    };
    return NextResponse.json(error, { status: 500 });
  }
}