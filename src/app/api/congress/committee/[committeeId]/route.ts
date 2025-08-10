
import { NextResponse, type NextRequest } from 'next/server';

interface CommitteeMember {
  name: string;
  bioguide: string;
  party: 'R' | 'D' | 'I';
  rank: number;
  title?: string; // e.g., 'Chair', 'Ranking Member'
  chamber?: 'H' | 'S';
}

interface CommitteeData {
  [committeeCode: string]: CommitteeMember[];
}

async function fetchCommitteeData(): Promise<CommitteeData | null> {
  const url = 'https://unitedstates.github.io/congress-legislators/committee-membership-current.json';
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
    if (!response.ok) {
      console.error(`Failed to fetch committee data: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching committee data:", error);
    return null;
  }
}

export async function GET(req: NextRequest, { params }: { params: { committeeId: string } }) {
  const { committeeId } = params;

  if (!committeeId) {
    return NextResponse.json({ error: 'Missing committeeId parameter' }, { status: 400 });
  }

  try {
    const allCommitteeData = await fetchCommitteeData();

    if (!allCommitteeData) {
      return NextResponse.json({ error: 'Could not fetch committee data source' }, { status: 500 });
    }
    
    let lookupKey = committeeId.toUpperCase();
    if (lookupKey.endsWith('00')) {
        lookupKey = lookupKey.slice(0, -2);
    }

    const committeeMembers = allCommitteeData[lookupKey];

    if (!committeeMembers) {
      return NextResponse.json({ error: `Committee with systemCode '${committeeId}' (lookup '${lookupKey}') not found.` }, { status: 404 });
    }

    // Find the Chair (rank 1) and Ranking Member (rank 2)
    const chair = committeeMembers.find(m => m.rank === 1);
    const rankingMember = committeeMembers.find(m => m.rank === 2);

    const leadership = [];
    if (chair) {
      leadership.push({
        bioguideId: chair.bioguide,
        name: chair.name,
        party: chair.party,
        title: chair.title || 'Chair', // Fallback title
      });
    }
    if (rankingMember) {
      leadership.push({
        bioguideId: rankingMember.bioguide,
        name: rankingMember.name,
        party: rankingMember.party,
        title: rankingMember.title || 'Ranking Member', // Fallback title
      });
    }

    return NextResponse.json({ committee: { members: leadership } });

  } catch (error) {
    console.error(`Error processing committee data for ${committeeId}:`, error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
