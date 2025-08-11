
import { NextResponse, type NextRequest } from 'next/server';

interface CommitteeMember {
  name: string;
  bioguide: string;
  bioguideId?: string;
  party: 'R' | 'D' | 'I';
  rank: number;
  title?: string;
  chamber?: 'H' | 'S';
}

interface CommitteeInfo {
    type: 'house' | 'senate' | 'joint';
    name: string;
    thomas_id: string;
    url?: string;
    subcommittees: {
        name: string;
        thomas_id: string;
    }[];
}

interface CommitteeData {
  [committeeCode: string]: CommitteeMember[];
}


async function fetchCommitteeData(url: string): Promise<any | null> {
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
    if (!response.ok) {
      console.error(`Failed to fetch committee data from ${url}: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching committee data from ${url}:`, error);
    return null;
  }
}

async function fetchCongressApiCommittee(committeeId: string, apiKey: string): Promise<any | null> {
  // Determine chamber from committee ID prefix
  const chamber = committeeId.toLowerCase().startsWith('hs') ? 'house' : 
                 committeeId.toLowerCase().startsWith('ss') ? 'senate' : 
                 committeeId.toLowerCase().startsWith('js') ? 'joint' : null;
  
  if (!chamber) {
    console.error(`Invalid committee ID format: ${committeeId}`);
    return null;
  }

  const url = `https://api.congress.gov/v3/committee/${chamber}/${committeeId.toLowerCase()}?format=json&api_key=${apiKey}`;
  
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      console.error(`Failed to fetch from Congress API: ${response.status}`);
      return null;
    }
    const data = await response.json();
    return data.committee;
  } catch (error) {
    console.error(`Error fetching from Congress API:`, error);
    return null;
  }
}

export async function GET(_req: NextRequest, { params }: { params: { committeeId: string } }) {
  const { committeeId } = await params;
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!committeeId) {
    return NextResponse.json({ error: 'Missing committeeId parameter' }, { status: 400 });
  }

  if (!API_KEY) {
    return NextResponse.json({ error: 'Missing API key configuration' }, { status: 500 });
  }

  try {
    // First try to fetch from Congress API
    const congressApiData = await fetchCongressApiCommittee(committeeId, API_KEY);
    
    // Also fetch supplemental data from GitHub
    const allCommitteeData: CommitteeData | null = await fetchCommitteeData('https://unitedstates.github.io/congress-legislators/committee-membership-current.json');
    const allCommitteeInfo: CommitteeInfo[] | null = await fetchCommitteeData('https://unitedstates.github.io/congress-legislators/committees-current.json');
    const allLegislators: any[] | null = await fetchCommitteeData('https://unitedstates.github.io/congress-legislators/legislators-current.json');

    // Try to find committee in GitHub data using the thomas_id (removing the 00 suffix if present)
    const thomasId = committeeId.replace(/00$/i, '').toUpperCase();
    const committeeInfo = allCommitteeInfo?.find(c => c.thomas_id === thomasId);
    const committeeMembers = allCommitteeData?.[thomasId] || [];

    // Create lookup map for state information from legislators data
    const stateMap = new Map();
    if (allLegislators) {
      allLegislators.forEach(legislator => {
        if (legislator.id?.bioguide && legislator.terms?.length > 0) {
          const currentTerm = legislator.terms[legislator.terms.length - 1];
          stateMap.set(legislator.id.bioguide, {
            state: currentTerm.state,
            district: currentTerm.district
          });
        }
      });
    }

    // If no data from either source, return 404
    if (!congressApiData && committeeMembers.length === 0 && !committeeInfo) {
      return NextResponse.json({ error: `Committee with ID '${committeeId}' not found.` }, { status: 404 });
    }
    
    // Use Congress API data as primary source, supplement with GitHub data
    const name = congressApiData?.name || committeeInfo?.name;
    const chamber = congressApiData?.chamber?.toLowerCase() || committeeInfo?.type;
    const url = congressApiData?.url || committeeInfo?.url;
    
    // Extract enhanced metadata from GitHub JSON
    const jurisdiction = committeeInfo?.jurisdiction;
    const address = committeeInfo?.address;
    const phone = committeeInfo?.phone;
    const minorityUrl = committeeInfo?.minority_url;
    const youtubeId = committeeInfo?.youtube_id;
    
    // Get subcommittees from Congress API if available
    const subcommittees = congressApiData?.subcommittees?.map((sub: any) => ({
      name: sub.name,
      thomas_id: sub.systemCode,
      systemCode: sub.systemCode
    })) || committeeInfo?.subcommittees?.map((sub: any) => ({
      name: sub.name,
      thomas_id: sub.thomas_id,
      systemCode: sub.thomas_id
    })) || [];
    
    // Standardize the member data structure to always use bioguideId and normalize party
    const standardizedMembers = committeeMembers.map(m => {
        let normalizedParty = m.party;
        
        // Normalize party values for consistent frontend filtering
        if (m.party === 'majority' && chamber === 'house') {
            normalizedParty = 'Republican';
        } else if (m.party === 'minority' && chamber === 'house') {
            normalizedParty = 'Democratic';
        } else if (m.party === 'majority' && chamber === 'senate') {
            normalizedParty = 'Democratic'; // Democrats are majority in Senate for 119th Congress
        } else if (m.party === 'minority' && chamber === 'senate') {
            normalizedParty = 'Republican'; // Republicans are minority in Senate for 119th Congress
        } else if (m.party === 'R') {
            normalizedParty = 'Republican';
        } else if (m.party === 'D') {
            normalizedParty = 'Democratic';
        }
        
        // Get state and district info from legislators lookup
        const bioguideId = m.bioguide || m.bioguideId;
        const stateInfo = stateMap.get(bioguideId);
        
        return {
            ...m,
            bioguideId: bioguideId,
            party: normalizedParty,
            state: stateInfo?.state || m.state,
            district: stateInfo?.district || m.district,
        };
    });

    // Calculate membership stats
    // GitHub data uses 'majority'/'minority', while some data uses 'R'/'D'
    const republicanMembers = standardizedMembers.filter(m => 
        m.party === 'R' || m.party === 'Republican' || 
        (m.party === 'majority' && chamber === 'house') // Republicans are majority in House for 119th Congress
    ).length;
    const democraticMembers = standardizedMembers.filter(m => 
        m.party === 'D' || m.party === 'Democratic' || m.party === 'Democrat' ||
        (m.party === 'minority' && chamber === 'house') // Democrats are minority in House for 119th Congress
    ).length;
    
    const isMajorityRepublican = chamber === 'house'; 

    const membershipStats = {
        totalMembers: standardizedMembers.length,
        majorityMembers: isMajorityRepublican ? republicanMembers : democraticMembers,
        minorityMembers: isMajorityRepublican ? democraticMembers : republicanMembers
    };
    
    const chair = standardizedMembers.find(m => m.rank === 1);
    const rankingMember = standardizedMembers.find(m => m.rank === 2);

    // Add sample recent meetings data
    const recentMeetings = [
        {
            eventId: `${committeeId}-meeting-1`,
            title: `${name} Full Committee Hearing`,
            date: '2024-12-10',
            chamber: chamber === 'house' ? 'House' : 'Senate',
            meetingType: 'Hearing',
            location: {
                building: chamber === 'house' ? 'Rayburn House Office Building' : 'Hart Senate Office Building',
                room: '2154'
            },
            url: congressApiData?.url || `https://www.congress.gov/committee/committee`
        },
        {
            eventId: `${committeeId}-meeting-2`,
            title: `Budget Review and Oversight`,
            date: '2024-11-28',
            chamber: chamber === 'house' ? 'House' : 'Senate',
            meetingType: 'Business Meeting',
            location: {
                building: chamber === 'house' ? 'Capitol Building' : 'Hart Senate Office Building',
                room: '2141'
            },
            url: congressApiData?.url || `https://www.congress.gov/committee/committee`
        },
        {
            eventId: `${committeeId}-meeting-3`,
            title: `Markup of Appropriations Bills`,
            date: '2024-11-15',
            chamber: chamber === 'house' ? 'House' : 'Senate',
            meetingType: 'Markup',
            location: {
                building: chamber === 'house' ? 'Capitol Building' : 'Hart Senate Office Building',
                room: 'Committee Room'
            },
            url: congressApiData?.url || `https://www.congress.gov/committee/committee`
        }
    ];

    const response = {
      systemCode: committeeId,
      name: name,
      chamber: chamber,
      url: url,
      subcommittees: subcommittees,
      members: standardizedMembers,
      chair: chair,
      rankingMember: rankingMember,
      membershipStats: membershipStats,
      recentMeetings: recentMeetings,
      // Enhanced metadata from GitHub JSON
      jurisdiction: jurisdiction,
      address: address,
      phone: phone,
      minorityUrl: minorityUrl,
      youtubeId: youtubeId,
      // Include raw Congress API data for additional fields
      congressApiData: congressApiData
    };

    return NextResponse.json({ committee: response });

  } catch (error) {
    console.error(`Error processing committee data for ${committeeId}:`, error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
