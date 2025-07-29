import { NextResponse, type NextRequest } from 'next/server';

interface CommitteeMemeber {
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
  chair?: CommitteeMemeber;
  rankingMember?: CommitteeMemeber;
  members?: CommitteeMemeber[];
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
  chair?: CommitteeMemeber;
  rankingMember?: CommitteeMemeber;
  members: CommitteeMemeber[];
  subcommittees: Subcommittee[];
  recentMeetings: CommitteeMeeting[];
  recentReports: CommitteeReport[];
  membershipStats: {
    totalMembers: number;
    majorityMembers: number;
    minorityMembers: number;
  };
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { 
        next: { revalidate: 3600 },
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        return response;
      }
      
      if (response.status === 404) {
        throw new Error(`Resource not found: ${url}`);
      }
      
      if (i === retries - 1) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
    }
  }
  throw new Error('Max retries reached');
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
    // First, find the committee in the list to get chamber and system code
    const listUrl = `https://api.congress.gov/v3/committee/${congress}?limit=250&format=json&api_key=${API_KEY}`;
    const listRes = await fetchWithRetry(listUrl);
    const listData = await listRes.json();
    
    const foundCommittee = (listData.committees || []).find((c: any) => 
      c.systemCode?.toLowerCase() === committeeId.toLowerCase()
    );

    if (!foundCommittee) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
    }

    const chamber = foundCommittee.chamber.toLowerCase();
    const systemCode = foundCommittee.systemCode.toLowerCase();

    // Parallel API calls for comprehensive data
    const [
      membersRes,
      subcommitteesRes,
      meetingsRes,
      reportsRes
    ] = await Promise.allSettled([
      // Committee members
      fetchWithRetry(`https://api.congress.gov/v3/committee/${congress}/${chamber}/${systemCode}/members?format=json&api_key=${API_KEY}`),
      
      // Subcommittees
      fetchWithRetry(`https://api.congress.gov/v3/committee/${congress}/${chamber}/${systemCode}/subcommittees?format=json&api_key=${API_KEY}`),
      
      // Recent meetings (last 6 months)
      fetchWithRetry(`https://api.congress.gov/v3/committee-meeting/${congress}/${chamber}?limit=10&format=json&api_key=${API_KEY}`),
      
      // Recent reports
      fetchWithRetry(`https://api.congress.gov/v3/committee-report/${congress}?limit=10&format=json&api_key=${API_KEY}`)
    ]);

    // Process members data
    let members: CommitteeMemeber[] = [];
    let chair: CommitteeMemeber | undefined;
    let rankingMember: CommitteeMemeber | undefined;
    
    if (membersRes.status === 'fulfilled' && membersRes.value.ok) {
      const membersData = await membersRes.value.json();
      members = (membersData.members || []).map((member: any) => ({
        bioguideId: member.bioguideId,
        name: member.name,
        party: member.party,
        state: member.state,
        district: member.district,
        rank: member.rank,
        title: member.title,
        url: member.url
      }));

      // Find leadership
      chair = members.find(m => m.title?.toLowerCase().includes('chair'));
      rankingMember = members.find(m => m.title?.toLowerCase().includes('ranking'));
    }

    // Process subcommittees data
    let subcommittees: Subcommittee[] = [];
    if (subcommitteesRes.status === 'fulfilled' && subcommitteesRes.value.ok) {
      const subcommitteesData = await subcommitteesRes.value.json();
      
      // For each subcommittee, fetch its members
      const subcommitteePromises = (subcommitteesData.subcommittees || []).slice(0, 10).map(async (sub: any) => {
        try {
          const subMembersRes = await fetchWithRetry(
            `https://api.congress.gov/v3/committee/${congress}/${chamber}/${sub.systemCode}/members?format=json&api_key=${API_KEY}`
          );
          
          if (subMembersRes.ok) {
            const subMembersData = await subMembersRes.json();
            const subMembers = (subMembersData.members || []).map((member: any) => ({
              bioguideId: member.bioguideId,
              name: member.name,
              party: member.party,
              state: member.state,
              district: member.district,
              rank: member.rank,
              title: member.title,
              url: member.url
            }));

            return {
              name: sub.name,
              systemCode: sub.systemCode,
              url: sub.url,
              chair: subMembers.find((m: any) => m.title?.toLowerCase().includes('chair')),
              rankingMember: subMembers.find((m: any) => m.title?.toLowerCase().includes('ranking')),
              members: subMembers
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch members for subcommittee ${sub.systemCode}:`, error);
        }
        
        return {
          name: sub.name,
          systemCode: sub.systemCode,
          url: sub.url,
          members: []
        };
      });

      subcommittees = await Promise.all(subcommitteePromises);
    }

    // Process meetings data
    let recentMeetings: CommitteeMeeting[] = [];
    if (meetingsRes.status === 'fulfilled' && meetingsRes.value.ok) {
      const meetingsData = await meetingsRes.value.json();
      recentMeetings = (meetingsData.committeeMeetings || [])
        .filter((meeting: any) => {
          // Filter for this specific committee
          return meeting.committees?.some((c: any) => 
            c.systemCode?.toLowerCase() === systemCode
          );
        })
        .slice(0, 5)
        .map((meeting: any) => ({
          eventId: meeting.eventId,
          title: meeting.title,
          date: meeting.date,
          chamber: meeting.chamber,
          meetingType: meeting.meetingType,
          location: meeting.location,
          url: meeting.url
        }));
    }

    // Process reports data
    let recentReports: CommitteeReport[] = [];
    if (reportsRes.status === 'fulfilled' && reportsRes.value.ok) {
      const reportsData = await reportsRes.value.json();
      recentReports = (reportsData.committeeReports || [])
        .filter((report: any) => {
          // Filter for this specific committee
          return report.committees?.some((c: any) => 
            c.systemCode?.toLowerCase() === systemCode
          );
        })
        .slice(0, 5)
        .map((report: any) => ({
          citation: report.citation,
          title: report.title,
          type: report.reportType,
          url: report.url,
          date: report.date || report.updateDate
        }));
    }

    // Calculate membership statistics
    const majorityMembers = members.filter(m => 
      chamber === 'house' ? m.party === 'Republican' : m.party === 'Republican' // Adjust based on current majority
    ).length;
    
    const enhancedCommittee: EnhancedCommitteeInfo = {
      name: foundCommittee.name,
      systemCode: foundCommittee.systemCode,
      chamber: foundCommittee.chamber,
      committeeType: foundCommittee.committeeType || 'Standing',
      url: foundCommittee.url,
      phone: foundCommittee.phone,
      office: foundCommittee.office,
      jurisdiction: foundCommittee.jurisdiction,
      chair,
      rankingMember,
      members,
      subcommittees,
      recentMeetings,
      recentReports,
      membershipStats: {
        totalMembers: members.length,
        majorityMembers,
        minorityMembers: members.length - majorityMembers
      }
    };

    return NextResponse.json({ committee: enhancedCommittee });

  } catch (error) {
    console.error(`Error fetching committee details for ${committeeId}:`, error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}