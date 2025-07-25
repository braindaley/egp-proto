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
  const url = `https://api.congress.gov/v3/member/congress/${congress}?api_key=${API_KEY}&limit=500`;
  console.error('🔧 CALLING URL:', url.replace(API_KEY, 'HIDDEN'));

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      console.error('🔧 FETCH FAILED:', res.status, res.statusText);
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: res.status });
    }

    const json = await res.json();
    console.error('🔧 GOT MEMBERS:', json.members?.length || 0);
    
    // Filter members by state name (not abbreviation)
    const allMembers: Member[] = json.members || [];
    
    // Show first few states for debugging
    const sampleStates = allMembers.slice(0, 10).map(m => m.state);
    console.error('🔧 SAMPLE STATES:', sampleStates);
    
    const stateMembers = allMembers.filter(member => member.state === stateName);
    console.error('🔧 FILTERED MEMBERS:', stateMembers.length, 'for', stateName);

    // Get current terms only (members currently serving)
    const currentMembers = stateMembers.filter(member => {
      const terms = member.terms?.item || [];
      return terms.some(term => !term.endYear || term.endYear >= new Date().getFullYear());
    });

    const senators = currentMembers.filter(member => {
      const terms = member.terms?.item || [];
      return terms.some(term => 
        term.chamber === 'Senate' && (!term.endYear || term.endYear >= new Date().getFullYear())
      );
    });

    const representatives = currentMembers.filter(member => {
      const terms = member.terms?.item || [];
      return terms.some(term => 
        term.chamber === 'House of Representatives' && (!term.endYear || term.endYear >= new Date().getFullYear())
      );
    });

    console.error('🔧 FINAL RESULT:', { senators: senators.length, representatives: representatives.length });

    return NextResponse.json({ senators, representatives });
  } catch (err) {
    console.error('🔧 ERROR:', err);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}