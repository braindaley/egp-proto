
import { NextResponse, type NextRequest } from 'next/server';

interface CommitteeMember {
  name: string;
  bioguide: string;
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

interface CommitteeInfoData {
    [committeeCode: string]: CommitteeInfo;
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

export async function GET(req: NextRequest, { params }: { params: { committeeId: string } }) {
  const { committeeId } = params;

  if (!committeeId) {
    return NextResponse.json({ error: 'Missing committeeId parameter' }, { status: 400 });
  }

  try {
    const allCommitteeData: CommitteeData | null = await fetchCommitteeData('https://unitedstates.github.io/congress-legislators/committee-membership-current.json');
    const allCommitteeInfo: CommitteeInfoData | null = await fetchCommitteeData('https://unitedstates.github.io/congress-legislators/committees-current.json');

    if (!allCommitteeData || !allCommitteeInfo) {
      return NextResponse.json({ error: 'Could not fetch committee data sources' }, { status: 500 });
    }
    
    let lookupKey = committeeId.toUpperCase();
    if (lookupKey.endsWith('00')) {
        lookupKey = lookupKey.slice(0, -2);
    }

    const committeeMembers = allCommitteeData[lookupKey] || [];
    const committeeInfo = allCommitteeInfo[lookupKey];

    if (committeeMembers.length === 0 && !committeeInfo) {
      return NextResponse.json({ error: `Committee with systemCode '${committeeId}' (lookup '${lookupKey}') not found.` }, { status: 404 });
    }
    
    // Standardize the member data structure to always use bioguideId
    const standardizedMembers = committeeMembers.map(m => ({
        ...m,
        bioguideId: m.bioguide,
    }));

    // Calculate membership stats
    const republicanMembers = standardizedMembers.filter(m => m.party === 'R').length;
    const democraticMembers = standardizedMembers.filter(m => m.party === 'D').length;
    const chamber = committeeInfo?.type === 'senate' ? 'senate' : 'house';
    
    const isMajorityRepublican = chamber === 'house'; 

    const membershipStats = {
        totalMembers: standardizedMembers.length,
        majorityMembers: isMajorityRepublican ? republicanMembers : democraticMembers,
        minorityMembers: isMajorityRepublican ? democraticMembers : republicanMembers
    };
    
    const chair = standardizedMembers.find(m => m.rank === 1);
    const rankingMember = standardizedMembers.find(m => m.rank === 2);

    const response = {
      name: committeeInfo?.name,
      chamber: committeeInfo?.type,
      url: committeeInfo?.url,
      subcommittees: committeeInfo?.subcommittees || [],
      members: standardizedMembers,
      chair: chair,
      rankingMember: rankingMember,
      membershipStats: membershipStats,
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
