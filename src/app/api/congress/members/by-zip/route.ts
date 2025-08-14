
import { NextRequest, NextResponse } from 'next/server';

// --- Interfaces for Geocod.io Response ---
interface CongressionalDistrict {
    name: string;
    district_number: number;
    current_legislators: Legislator[];
}

interface Legislator {
    type: 'representative' | 'senator';
    bio: {
        last_name: string;
        first_name:string;
        birthday: string;
        gender: string;
        party: string;
    };
    contact: {
        url: string;
        phone: string;
    };
    social: {
        twitter: string;
    };
    references: {
      bioguide_id: string;
    }
}

interface FieldResponse {
    congressional_districts: CongressionalDistrict[];
}

interface GeocodIoResponse {
    results: {
        fields: FieldResponse;
    }[];
}


// --- Interface for our Application's Data Structure ---
interface AppRepresentative {
  name: string;
  party: string;
  officeTitle: string;
  districtNumber?: number;
  phones?: string[];
  urls?: string[];
  bioguideId?: string;
}


// --- Function to Transform Geocod.io data to our app's format ---
function transformGeocodIoResponse(data: GeocodIoResponse): AppRepresentative[] {
  const representatives: AppRepresentative[] = [];

  if (!data.results || data.results.length === 0) {
    return [];
  }

  // Iterate through all results (usually just one for a zip code)
  for (const result of data.results) {
    const districts = result.fields?.congressional_districts || [];

    // Iterate through all districts in the result
    for (const district of districts) {
      const legislators = district.current_legislators || [];
      
      // Iterate through all legislators in the district
      for (const legislator of legislators) {
        const fullName = `${legislator.bio.first_name} ${legislator.bio.last_name}`;
        
        // Determine the office title
        let officeTitle = '';
        if (legislator.type === 'representative') {
            officeTitle = `United States House of Representatives, District ${district.district_number}`;
        } else if (legislator.type === 'senator') {
            officeTitle = `United States Senate`;
        }

        representatives.push({
          name: fullName,
          party: legislator.bio.party,
          officeTitle: officeTitle,
          districtNumber: legislator.type === 'representative' ? district.district_number : undefined,
          phones: legislator.contact.phone ? [legislator.contact.phone] : [],
          urls: legislator.contact.url ? [legislator.contact.url] : [],
          bioguideId: legislator.references.bioguide_id,
        });
      }
    }
  }

  // Deduplicate in case of overlapping districts providing the same senator
  const uniqueReps = Array.from(new Map(representatives.map(rep => [rep.name, rep])).values());

  return uniqueReps;
}


// ZIP to congressional district mapping
const ZIP_TO_DISTRICT: Record<string, { state: string, stateCode: string, district?: number }> = {
  // California - Orange County area
  '92706': { state: 'California', stateCode: 'CA', district: 46 }, // Fountain Valley - Lou Correa
  '92701': { state: 'California', stateCode: 'CA', district: 46 }, // Santa Ana
  '92703': { state: 'California', stateCode: 'CA', district: 46 }, // Santa Ana
  '92704': { state: 'California', stateCode: 'CA', district: 46 }, // Santa Ana
  '92705': { state: 'California', stateCode: 'CA', district: 46 }, // Santa Ana
  '92707': { state: 'California', stateCode: 'CA', district: 46 }, // Santa Ana
  '92708': { state: 'California', stateCode: 'CA', district: 47 }, // Fountain Valley
  '92780': { state: 'California', stateCode: 'CA', district: 46 }, // Tustin
  '92782': { state: 'California', stateCode: 'CA', district: 46 }, // Tustin
  '92801': { state: 'California', stateCode: 'CA', district: 46 }, // Anaheim
  '92802': { state: 'California', stateCode: 'CA', district: 46 }, // Anaheim
  '92804': { state: 'California', stateCode: 'CA', district: 46 }, // Anaheim
  '92805': { state: 'California', stateCode: 'CA', district: 46 }, // Anaheim
  '92806': { state: 'California', stateCode: 'CA', district: 46 }, // Anaheim
  '92807': { state: 'California', stateCode: 'CA', district: 45 }, // Anaheim
  '92808': { state: 'California', stateCode: 'CA', district: 45 }, // Anaheim
  '92840': { state: 'California', stateCode: 'CA', district: 46 }, // Garden Grove
  '92841': { state: 'California', stateCode: 'CA', district: 46 }, // Garden Grove
  '92843': { state: 'California', stateCode: 'CA', district: 46 }, // Garden Grove
  '92844': { state: 'California', stateCode: 'CA', district: 46 }, // Garden Grove
  '92845': { state: 'California', stateCode: 'CA', district: 47 }, // Garden Grove
  '92646': { state: 'California', stateCode: 'CA', district: 48 }, // Huntington Beach
  '92647': { state: 'California', stateCode: 'CA', district: 48 }, // Huntington Beach
  '92648': { state: 'California', stateCode: 'CA', district: 48 }, // Huntington Beach
  '92649': { state: 'California', stateCode: 'CA', district: 48 }, // Huntington Beach
  '92660': { state: 'California', stateCode: 'CA', district: 47 }, // Newport Beach
  // Los Angeles area
  '90001': { state: 'California', stateCode: 'CA', district: 44 },
  '90210': { state: 'California', stateCode: 'CA', district: 36 }, // Beverly Hills
  // San Francisco area
  '94102': { state: 'California', stateCode: 'CA', district: 11 }, // San Francisco
  '94103': { state: 'California', stateCode: 'CA', district: 11 },
  '94104': { state: 'California', stateCode: 'CA', district: 11 },
  '94105': { state: 'California', stateCode: 'CA', district: 11 },
  '94107': { state: 'California', stateCode: 'CA', district: 11 },
  '94108': { state: 'California', stateCode: 'CA', district: 11 },
  '94109': { state: 'California', stateCode: 'CA', district: 11 },
  '94110': { state: 'California', stateCode: 'CA', district: 11 },
  '94111': { state: 'California', stateCode: 'CA', district: 11 },
  '94112': { state: 'California', stateCode: 'CA', district: 11 },
  '94114': { state: 'California', stateCode: 'CA', district: 11 },
  '94115': { state: 'California', stateCode: 'CA', district: 11 },
  '94116': { state: 'California', stateCode: 'CA', district: 11 },
  '94117': { state: 'California', stateCode: 'CA', district: 11 },
  '94118': { state: 'California', stateCode: 'CA', district: 11 },
  // New York
  '10001': { state: 'New York', stateCode: 'NY', district: 12 }, // Manhattan
  '10002': { state: 'New York', stateCode: 'NY', district: 12 },
  '10003': { state: 'New York', stateCode: 'NY', district: 12 },
  '10004': { state: 'New York', stateCode: 'NY', district: 10 },
  '10005': { state: 'New York', stateCode: 'NY', district: 10 },
  '10006': { state: 'New York', stateCode: 'NY', district: 10 },
  '10007': { state: 'New York', stateCode: 'NY', district: 10 },
  '11201': { state: 'New York', stateCode: 'NY', district: 10 }, // Brooklyn
  // Texas
  '75001': { state: 'Texas', stateCode: 'TX', district: 3 }, // Dallas area
  '77001': { state: 'Texas', stateCode: 'TX', district: 18 }, // Houston
  '77002': { state: 'Texas', stateCode: 'TX', district: 18 },
  '77003': { state: 'Texas', stateCode: 'TX', district: 18 },
  '77004': { state: 'Texas', stateCode: 'TX', district: 18 },
  '77005': { state: 'Texas', stateCode: 'TX', district: 7 },
  '77006': { state: 'Texas', stateCode: 'TX', district: 7 },
  '77007': { state: 'Texas', stateCode: 'TX', district: 7 },
  '77008': { state: 'Texas', stateCode: 'TX', district: 2 },
  '77009': { state: 'Texas', stateCode: 'TX', district: 29 },
  // Add more as needed
};

// Helper to get state and district from ZIP
function getDistrictFromZip(zipCode: string): { state: string, stateCode: string, district?: number } | null {
  // Check exact match first
  if (ZIP_TO_DISTRICT[zipCode]) {
    return ZIP_TO_DISTRICT[zipCode];
  }
  
  // Check by prefix (first 3 digits)
  const prefix = zipCode.substring(0, 3);
  const statesByPrefix: Record<string, { state: string, stateCode: string }> = {
    // California ranges
    '900': { state: 'California', stateCode: 'CA' },
    '901': { state: 'California', stateCode: 'CA' },
    '902': { state: 'California', stateCode: 'CA' },
    '903': { state: 'California', stateCode: 'CA' },
    '904': { state: 'California', stateCode: 'CA' },
    '905': { state: 'California', stateCode: 'CA' },
    '906': { state: 'California', stateCode: 'CA' },
    '907': { state: 'California', stateCode: 'CA' },
    '908': { state: 'California', stateCode: 'CA' },
    '910': { state: 'California', stateCode: 'CA' },
    '911': { state: 'California', stateCode: 'CA' },
    '912': { state: 'California', stateCode: 'CA' },
    '913': { state: 'California', stateCode: 'CA' },
    '914': { state: 'California', stateCode: 'CA' },
    '915': { state: 'California', stateCode: 'CA' },
    '916': { state: 'California', stateCode: 'CA' },
    '917': { state: 'California', stateCode: 'CA' },
    '918': { state: 'California', stateCode: 'CA' },
    '919': { state: 'California', stateCode: 'CA' },
    '920': { state: 'California', stateCode: 'CA' },
    '921': { state: 'California', stateCode: 'CA' },
    '922': { state: 'California', stateCode: 'CA' },
    '923': { state: 'California', stateCode: 'CA' },
    '924': { state: 'California', stateCode: 'CA' },
    '925': { state: 'California', stateCode: 'CA' },
    '926': { state: 'California', stateCode: 'CA' },
    '927': { state: 'California', stateCode: 'CA' },
    '928': { state: 'California', stateCode: 'CA' },
    '930': { state: 'California', stateCode: 'CA' },
    '931': { state: 'California', stateCode: 'CA' },
    '932': { state: 'California', stateCode: 'CA' },
    '933': { state: 'California', stateCode: 'CA' },
    '934': { state: 'California', stateCode: 'CA' },
    '935': { state: 'California', stateCode: 'CA' },
    '936': { state: 'California', stateCode: 'CA' },
    '937': { state: 'California', stateCode: 'CA' },
    '938': { state: 'California', stateCode: 'CA' },
    '939': { state: 'California', stateCode: 'CA' },
    '940': { state: 'California', stateCode: 'CA' },
    '941': { state: 'California', stateCode: 'CA' },
    '942': { state: 'California', stateCode: 'CA' },
    '943': { state: 'California', stateCode: 'CA' },
    '944': { state: 'California', stateCode: 'CA' },
    '945': { state: 'California', stateCode: 'CA' },
    '946': { state: 'California', stateCode: 'CA' },
    '947': { state: 'California', stateCode: 'CA' },
    '948': { state: 'California', stateCode: 'CA' },
    '949': { state: 'California', stateCode: 'CA' },
    '950': { state: 'California', stateCode: 'CA' },
    '951': { state: 'California', stateCode: 'CA' },
    '952': { state: 'California', stateCode: 'CA' },
    '953': { state: 'California', stateCode: 'CA' },
    '954': { state: 'California', stateCode: 'CA' },
    '955': { state: 'California', stateCode: 'CA' },
    '956': { state: 'California', stateCode: 'CA' },
    '957': { state: 'California', stateCode: 'CA' },
    '958': { state: 'California', stateCode: 'CA' },
    '959': { state: 'California', stateCode: 'CA' },
    '960': { state: 'California', stateCode: 'CA' },
    '961': { state: 'California', stateCode: 'CA' },
    // New York ranges
    '100': { state: 'New York', stateCode: 'NY' },
    '101': { state: 'New York', stateCode: 'NY' },
    '102': { state: 'New York', stateCode: 'NY' },
    '103': { state: 'New York', stateCode: 'NY' },
    '104': { state: 'New York', stateCode: 'NY' },
    '105': { state: 'New York', stateCode: 'NY' },
    '106': { state: 'New York', stateCode: 'NY' },
    '107': { state: 'New York', stateCode: 'NY' },
    '108': { state: 'New York', stateCode: 'NY' },
    '109': { state: 'New York', stateCode: 'NY' },
    '110': { state: 'New York', stateCode: 'NY' },
    '111': { state: 'New York', stateCode: 'NY' },
    '112': { state: 'New York', stateCode: 'NY' },
    '113': { state: 'New York', stateCode: 'NY' },
    '114': { state: 'New York', stateCode: 'NY' },
    '115': { state: 'New York', stateCode: 'NY' },
    '116': { state: 'New York', stateCode: 'NY' },
    '117': { state: 'New York', stateCode: 'NY' },
    '118': { state: 'New York', stateCode: 'NY' },
    '119': { state: 'New York', stateCode: 'NY' },
    // Texas ranges
    '750': { state: 'Texas', stateCode: 'TX' },
    '751': { state: 'Texas', stateCode: 'TX' },
    '752': { state: 'Texas', stateCode: 'TX' },
    '753': { state: 'Texas', stateCode: 'TX' },
    '754': { state: 'Texas', stateCode: 'TX' },
    '755': { state: 'Texas', stateCode: 'TX' },
    '756': { state: 'Texas', stateCode: 'TX' },
    '757': { state: 'Texas', stateCode: 'TX' },
    '758': { state: 'Texas', stateCode: 'TX' },
    '759': { state: 'Texas', stateCode: 'TX' },
    '760': { state: 'Texas', stateCode: 'TX' },
    '761': { state: 'Texas', stateCode: 'TX' },
    '762': { state: 'Texas', stateCode: 'TX' },
    '763': { state: 'Texas', stateCode: 'TX' },
    '764': { state: 'Texas', stateCode: 'TX' },
    '765': { state: 'Texas', stateCode: 'TX' },
    '766': { state: 'Texas', stateCode: 'TX' },
    '767': { state: 'Texas', stateCode: 'TX' },
    '768': { state: 'Texas', stateCode: 'TX' },
    '769': { state: 'Texas', stateCode: 'TX' },
    '770': { state: 'Texas', stateCode: 'TX' },
    '771': { state: 'Texas', stateCode: 'TX' },
    '772': { state: 'Texas', stateCode: 'TX' },
    '773': { state: 'Texas', stateCode: 'TX' },
    '774': { state: 'Texas', stateCode: 'TX' },
    '775': { state: 'Texas', stateCode: 'TX' },
    '776': { state: 'Texas', stateCode: 'TX' },
    '777': { state: 'Texas', stateCode: 'TX' },
    '778': { state: 'Texas', stateCode: 'TX' },
    '779': { state: 'Texas', stateCode: 'TX' },
    '780': { state: 'Texas', stateCode: 'TX' },
    '781': { state: 'Texas', stateCode: 'TX' },
    '782': { state: 'Texas', stateCode: 'TX' },
    '783': { state: 'Texas', stateCode: 'TX' },
    '784': { state: 'Texas', stateCode: 'TX' },
    '785': { state: 'Texas', stateCode: 'TX' },
    '786': { state: 'Texas', stateCode: 'TX' },
    '787': { state: 'Texas', stateCode: 'TX' },
    '788': { state: 'Texas', stateCode: 'TX' },
    '789': { state: 'Texas', stateCode: 'TX' },
    '790': { state: 'Texas', stateCode: 'TX' },
    '791': { state: 'Texas', stateCode: 'TX' },
    '792': { state: 'Texas', stateCode: 'TX' },
    '793': { state: 'Texas', stateCode: 'TX' },
    '794': { state: 'Texas', stateCode: 'TX' },
    '795': { state: 'Texas', stateCode: 'TX' },
    '796': { state: 'Texas', stateCode: 'TX' },
    '797': { state: 'Texas', stateCode: 'TX' },
    '798': { state: 'Texas', stateCode: 'TX' },
    '799': { state: 'Texas', stateCode: 'TX' },
  };
  
  return statesByPrefix[prefix] || null;
}

// Fetch senators and specific house member for a district from Congress API
async function fetchDistrictMembers(stateCode: string, district?: number): Promise<AppRepresentative[]> {
  const API_KEY = process.env.CONGRESS_API_KEY;
  if (!API_KEY) {
    console.error("[API /by-zip] CONGRESS_API_KEY is not set.");
    return [];
  }

  try {
    // Use the 119th Congress (current) - you might want to make this dynamic
    const congress = '119';
    const url = `https://api.congress.gov/v3/member/congress/${congress}/${stateCode}?currentMember=false&limit=250&api_key=${API_KEY}`;
    
    console.log(`[API /by-zip] Fetching members for state ${stateCode} from Congress API`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch members from Congress API: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const allMembers = data.members || [];
    
    const representatives: AppRepresentative[] = [];
    
    // Process each member and their terms
    for (const member of allMembers) {
      if (!member.terms?.item) continue;
      
      // Get the most recent term for chamber information
      const terms = member.terms.item;
      const currentTerm = terms[0]; // Terms are usually ordered by most recent
      
      // Determine chamber and district from terms
      const hasSenateTerm = terms.some((term: any) => term.chamber === 'Senate');
      const hasHouseTerm = terms.some((term: any) => term.chamber === 'House of Representatives');
      
      if (hasSenateTerm) {
        representatives.push({
          name: member.name,
          party: member.partyName || 'Unknown',
          officeTitle: 'United States Senate',
          bioguideId: member.bioguideId,
          phones: [],
          urls: member.url ? [member.url] : [],
        });
      }
      
      if (hasHouseTerm && district) {
        // For House members when we need a specific district, fetch full member details
        try {
          const memberUrl = `https://api.congress.gov/v3/member/${member.bioguideId}?api_key=${API_KEY}`;
          const memberRes = await fetch(memberUrl);
          if (memberRes.ok) {
            const memberData = await memberRes.json();
            const currentTerms = memberData.member?.terms || [];
            const currentHouseTerm = currentTerms.find((t: any) => 
              t.chamber === 'House of Representatives' && t.congress === 119
            );
            const memberDistrict = currentHouseTerm?.district ? parseInt(currentHouseTerm.district) : undefined;
            
            if (memberDistrict === district) {
              representatives.push({
                name: member.name,
                party: member.partyName || 'Unknown',
                officeTitle: `United States House of Representatives, District ${memberDistrict}`,
                districtNumber: memberDistrict,
                bioguideId: member.bioguideId,
                phones: [],
                urls: member.url ? [member.url] : [],
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching member details for ${member.bioguideId}:`, err);
        }
      }
    }
    
    console.log(`[API /by-zip] Found ${representatives.length} representatives for state ${stateCode}${district ? ` district ${district}` : ''}`);
    return representatives;
  } catch (error) {
    console.error('Error fetching state members:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zipCode = searchParams.get('zip');

  if (!zipCode) {
    return NextResponse.json({ error: 'Zip code is required' }, { status: 400 });
  }

  // First try to use Geocodio if API key is available
  const geocodioApiKey = process.env.GEOCODIO_API_KEY;
  if (geocodioApiKey) {
    // Use existing Geocodio logic
    const url = `https://api.geocod.io/v1.7/geocode?q=${zipCode}&fields=cd&api_key=${geocodioApiKey}`;
    
    try {
      const response = await fetch(url);
      const geocodData: GeocodIoResponse = await response.json();

      if (response.ok) {
        const representatives = transformGeocodIoResponse(geocodData);
        return NextResponse.json(representatives);
      }
    } catch (error) {
      console.error(`[API /by-zip] Geocodio API error:`, error);
    }
  }
  
  // Fallback: Use ZIP to district mapping and Congress API
  console.log(`[API /by-zip] Using fallback method for ZIP ${zipCode}`);
  const districtInfo = getDistrictFromZip(zipCode);
  
  if (!districtInfo) {
    console.error(`[API /by-zip] Could not determine state/district for ZIP ${zipCode}`);
    // Return empty array instead of error to allow user to continue
    return NextResponse.json([]);
  }
  
  const representatives = await fetchDistrictMembers(districtInfo.stateCode, districtInfo.district);
  return NextResponse.json(representatives);
}
