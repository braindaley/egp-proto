
import { NextResponse, type NextRequest } from 'next/server';

interface CommitteeMember {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  district?: string;
  rank?: number;
  title?: string;
  url: string;
}

interface Subcommittee {
  name: string;
  systemCode: string;
  url: string;
}

interface CommitteeMeeting {
  eventId: string;
  title: string;
  date: string;
  chamber: string;
  meetingType: string;
  location?: {
    building?: string;
    room?: string;
  };
  url: string;
}

interface CommitteeReport {
  citation: string;
  title: string;
  type: string;
  url: string;
  date: string;
}

interface EnhancedCommitteeInfo {
  name: string;
  systemCode: string;
  chamber: string;
  committeeType: string;
  url?: string;
  phone?: string;
  office?: string;
  jurisdiction?: string;
  chair?: CommitteeMember;
  rankingMember?: CommitteeMember;
  members: CommitteeMember[];
  subcommittees: Subcommittee[];
  recentMeetings: CommitteeMeeting[];
  recentReports: CommitteeReport[];
  membershipStats: {
    totalMembers: number;
    majorityMembers: number;
    minorityMembers: number;
  };
}

async function fetchCommitteeDataFromSource(committeeId: string, congress: string, apiKey: string): Promise<any> {
  const committeeMembersUrl = `https://theunitedstates.io/congress-legislators/committee-membership-current.json`;
  const committeeInfoUrl = `https://theunitedstates.io/congress-legislators/committees-current.json`;
  
  const [membersRes, infoRes] = await Promise.all([
    fetch(committeeMembersUrl),
    fetch(committeeInfoUrl)
  ]);
  
  if (!membersRes.ok || !infoRes.ok) {
    throw new Error('Failed to fetch committee data from source');
  }
  
  const allMemberships = await membersRes.json();
  const allCommittees = await infoRes.json();
  
  const committeeInfo = allCommittees.find((c: any) => c.thomas_id.toLowerCase() === committeeId.toLowerCase());
  const committeeMembers = allMemberships[committeeId.toUpperCase()] || [];
  
  return { committeeInfo, committeeMembers };
}

export async function GET(req: NextRequest, { params }: { params: { committeeId: string } }) {
  const { committeeId } = params;
  const { searchParams } = new URL(req.url);
  const congress = searchParams.get('congress');
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!congress || !committeeId || !API_KEY) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const { committeeInfo, committeeMembers } = await fetchCommitteeDataFromSource(committeeId, congress, API_KEY);

    if (!committeeInfo) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
    }

    const chair = committeeMembers.find((m: any) => m.rank === 1);
    const rankingMember = committeeMembers.find((m: any) => m.rank === 2);
    const majorityMembers = committeeMembers.filter((m: any) => m.party === 'majority').length;
    const minorityMembers = committeeMembers.filter((m: any) => m.party === 'minority').length;

    const enhancedCommittee: EnhancedCommitteeInfo = {
      name: committeeInfo.name,
      systemCode: committeeInfo.thomas_id,
      chamber: committeeInfo.chamber,
      committeeType: committeeInfo.type,
      url: committeeInfo.url,
      phone: committeeInfo.phone,
      office: committeeInfo.address,
      jurisdiction: committeeInfo.jurisdiction,
      chair: chair,
      rankingMember: rankingMember,
      members: committeeMembers,
      subcommittees: committeeInfo.subcommittees || [],
      recentMeetings: [], // This would require another API call
      recentReports: [], // This would require another API call
      membershipStats: {
        totalMembers: committeeMembers.length,
        majorityMembers: majorityMembers,
        minorityMembers: minorityMembers
      }
    };

    return NextResponse.json({ committee: enhancedCommittee });

  } catch (error) {
    console.error(`Error fetching committee details for ${committeeId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
