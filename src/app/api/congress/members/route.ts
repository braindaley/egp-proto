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
  console.log("🚨 SIMPLE TEST LOG");
  const { searchParams } = new URL(req.url);
  const congress = searchParams.get('congress');
  const stateAbbr = searchParams.get('state')?.toUpperCase();
  const API_KEY = process.env.CONGRESS_API_KEY;

  console.error('🔧 API ROUTE CALLED with:', { congress, stateAbbr });

  if (!congress || !stateAbbr || !API_KEY) {
    console.error('🔧 MISSING PARAMS:', { congress: !!congress, stateAbbr: !!stateAbbr, API_KEY: !!API_KEY });
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // Convert state abbreviation to full name
  const stateName = STATE_MAPPING[stateAbbr];
  console.error('🔧 STATE MAPPING:', stateAbbr, '->', stateName);
  
  if (!stateName) {
    return NextResponse.json({ error: `Invalid state abbreviation: ${stateAbbr}` }, { status: 400 });
  }

  // Correct Congress.gov API endpoint
  const url = `https://api.congress.gov/v3/congress/${congress}/member?api_key=${API_KEY}&limit=500`;
  console.error('🔧 CALLING URL:', url.replace(API_KEY, 'HIDDEN'));

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      console.error('🔧 FETCH FAILED:', res.status, res.statusText);
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: res.status });
    }

    const json = await res.json();
    console.log('--- API Raw JSON ---', JSON.stringify(json, null, 2));
    
    // Filter members by state name (not abbreviation)
    const allMembers: Member[] = json.members || [];
    console.error('🔧 SAMPLE MEMBERS:', allMembers.slice(0, 3).map(m => ({ name: m.name, state: m.state, bioguideId: m.bioguideId, terms: m.terms })));
    
    const stateMembers = allMembers.filter(member => member.state === stateName);
    console.error('🔧 FILTERED MEMBERS:', stateMembers.length, 'for', stateName);

    const senators = stateMembers.filter(member => {
      const terms = member.terms?.item || [];
      return terms.some(term => 
        term.chamber?.toLowerCase() === 'senate'
      );
    });

    const representatives = stateMembers.filter(member => {
      const terms = member.terms?.item || [];
      return terms.some(term => 
        term.chamber?.toLowerCase() === 'house of representatives'
      );
    });

    console.error('🔧 FINAL RESULT:', { senators: senators.length, representatives: representatives.length });

    return NextResponse.json({ 
      senators, 
      representatives,
      debug: {
        stateAbbr,
        stateName,
        totalMembers: allMembers.length,
        stateMembers: stateMembers.length,
        currentMembers: -1, // This filter was removed, so setting to -1
        sampleStates: [...new Set(allMembers.map(m => m.state))].sort()
      }
    });
  } catch (err) {
    console.error('🔧 ERROR:', err);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
