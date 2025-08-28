import { NextResponse, type NextRequest } from 'next/server';

interface SubcommitteeMember {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  district?: string;
  rank?: number;
  title?: string;
  url: string;
}

interface SubcommitteeMeeting {
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

interface ParentCommittee {
  name: string;
  systemCode: string;
  url: string;
}

interface EnhancedSubcommitteeInfo {
  name: string;
  systemCode: string;
  chamber: string;
  url?: string;
  phone?: string;
  office?: string;
  jurisdiction?: string;
  chair?: SubcommitteeMember;
  rankingMember?: SubcommitteeMember;
  members: SubcommitteeMember[];
  recentMeetings: SubcommitteeMeeting[];
  parentCommittee: ParentCommittee;
  membershipStats: {
    totalMembers: number;
    majorityMembers: number;
    minorityMembers: number;
  };
}

// Sample data for subcommittees
function getSampleSubcommitteeData(subcommitteeId: string, committeeId: string): EnhancedSubcommitteeInfo | null {
  const subId = subcommitteeId.toLowerCase();
  const commId = committeeId.toLowerCase();
  
  console.log(`Looking for subcommittee: "${subId}" in committee: "${commId}"`);

  // Armed Services Subcommittees
  if (commId.includes('hsas') || commId.includes('armed')) {
    if (subId.includes('hsas25') || subId.includes('tactical')) {
      return {
        name: "Tactical Air and Land Forces Subcommittee",
        systemCode: "hsas25",
        chamber: "House",
        url: "https://armedservices.house.gov/subcommittees/tactical-air-and-land-forces",
        phone: "(202) 225-2120",
        office: "2216 Rayburn House Office Building",
        jurisdiction: "The Subcommittee on Tactical Air and Land Forces has jurisdiction over tactical air programs, land forces programs, ammunition, ground combat systems, and related procurement matters.",
        chair: {
          bioguideId: "W000815",
          name: "Brad Wenstrup",
          party: "Republican", 
          state: "ohio",
          district: "2",
          title: "Subcommittee Chair",
          url: "https://api.congress.gov/v3/member/W000815"
        },
        rankingMember: {
          bioguideId: "L000563",
          name: "Mike Levin",
          party: "Democratic",
          state: "california", 
          district: "49",
          title: "Ranking Member",
          url: "https://api.congress.gov/v3/member/L000563"
        },
        members: [
          {
            bioguideId: "W000815",
            name: "Brad Wenstrup",
            party: "Republican",
            state: "ohio",
            district: "2",
            rank: 1,
            title: "Subcommittee Chair",
            url: "https://api.congress.gov/v3/member/W000815"
          },
          {
            bioguideId: "F000466",
            name: "Brian Fitzpatrick",
            party: "Republican",
            state: "pennsylvania",
            district: "1", 
            rank: 2,
            title: "",
            url: "https://api.congress.gov/v3/member/F000466"
          },
          {
            bioguideId: "L000563",
            name: "Mike Levin",
            party: "Democratic",
            state: "california",
            district: "49",
            rank: 1,
            title: "Ranking Member", 
            url: "https://api.congress.gov/v3/member/L000563"
          },
          {
            bioguideId: "T000486",
            name: "Ritchie Torres",
            party: "Democratic",
            state: "new-york",
            district: "15",
            rank: 2,
            title: "",
            url: "https://api.congress.gov/v3/member/T000486"
          }
        ],
        recentMeetings: [
          {
            eventId: "talf001",
            title: "Future Tactical Air Force Requirements",
            date: "2024-01-30",
            chamber: "House",
            meetingType: "Hearing",
            location: {
              building: "Rayburn House Office Building",
              room: "2118"
            },
            url: "https://armedservices.house.gov/hearings"
          }
        ],
        parentCommittee: {
          name: "Armed Services Committee",
          systemCode: "hsas00",
          url: "/federal/congress/119/committees/hsas00"
        },
        membershipStats: {
          totalMembers: 4,
          majorityMembers: 2,
          minorityMembers: 2
        }
      };
    }
    
    if (subId.includes('hsas28') || subId.includes('seapower')) {
      return {
        name: "Seapower and Projection Forces Subcommittee", 
        systemCode: "hsas28",
        chamber: "House",
        url: "https://armedservices.house.gov/subcommittees/seapower-and-projection-forces",
        phone: "(202) 225-2120",
        office: "2216 Rayburn House Office Building",
        jurisdiction: "The Subcommittee on Seapower and Projection Forces has jurisdiction over Navy and Marine Corps programs, naval aviation, and related procurement matters.",
        chair: {
          bioguideId: "W000804",
          name: "Robert J. Wittman",
          party: "Republican",
          state: "virginia", 
          district: "1",
          title: "Subcommittee Chair",
          url: "https://api.congress.gov/v3/member/W000804"
        },
        members: [
          {
            bioguideId: "W000804",
            name: "Robert J. Wittman",
            party: "Republican",
            state: "virginia",
            district: "1",
            rank: 1,
            title: "Subcommittee Chair",
            url: "https://api.congress.gov/v3/member/W000804"
          }
        ],
        recentMeetings: [],
        parentCommittee: {
          name: "Armed Services Committee",
          systemCode: "hsas00", 
          url: "/federal/congress/119/committees/hsas00"
        },
        membershipStats: {
          totalMembers: 1,
          majorityMembers: 1,
          minorityMembers: 0
        }
      };
    }
  }

  // Oversight Subcommittees
  if (commId.includes('hsgo') || commId.includes('oversight')) {
    if (subId.includes('hsgo29') || subId.includes('cyber')) {
      return {
        name: "Cybersecurity, Information Technology, and Government Innovation Subcommittee",
        systemCode: "hsgo29",
        chamber: "House",
        url: "https://oversight.house.gov/subcommittees/cybersecurity-information-technology-and-government-innovation-subcommittee",
        phone: "(202) 225-5074",
        office: "2157 Rayburn House Office Building",
        jurisdiction: "The Subcommittee on Cybersecurity, Information Technology, and Government Innovation has jurisdiction over federal cybersecurity, IT modernization, and technology innovation initiatives.",
        chair: {
          bioguideId: "J000299",
          name: "Clay Higgins",
          party: "Republican",
          state: "louisiana",
          district: "3", 
          title: "Subcommittee Chair",
          url: "https://api.congress.gov/v3/member/J000299"
        },
        rankingMember: {
          bioguideId: "C001084",
          name: "Gerry Connolly",
          party: "Democratic",
          state: "virginia",
          district: "11",
          title: "Ranking Member",
          url: "https://api.congress.gov/v3/member/C001084"
        },
        members: [
          {
            bioguideId: "J000299",
            name: "Clay Higgins",
            party: "Republican", 
            state: "louisiana",
            district: "3",
            rank: 1,
            title: "Subcommittee Chair",
            url: "https://api.congress.gov/v3/member/J000299"
          },
          {
            bioguideId: "C001084",
            name: "Gerry Connolly",
            party: "Democratic",
            state: "virginia", 
            district: "11",
            rank: 1,
            title: "Ranking Member",
            url: "https://api.congress.gov/v3/member/C001084"
          }
        ],
        recentMeetings: [
          {
            eventId: "cyber001",
            title: "Federal Cybersecurity Modernization",
            date: "2024-01-28",
            chamber: "House",
            meetingType: "Hearing",
            location: {
              building: "Rayburn House Office Building", 
              room: "2154"
            },
            url: "https://oversight.house.gov/hearing/federal-cybersecurity-modernization"
          }
        ],
        parentCommittee: {
          name: "Oversight and Government Reform Committee",
          systemCode: "hsgo00",
          url: "/federal/congress/119/committees/hsgo00"
        },
        membershipStats: {
          totalMembers: 2,
          majorityMembers: 1,
          minorityMembers: 1
        }
      };
    }
  }

  // Determine chamber and parent committee info
  const chamber = commId.startsWith('ss') ? 'Senate' : 
                 commId.startsWith('hs') ? 'House' : 
                 commId.startsWith('js') ? 'Joint' : 'House';
  
  const phone = chamber === 'Senate' ? '(202) 224-4971' : '(202) 225-4000';
  
  // Get committee name from known committees or use generic name
  let parentCommitteeName = `${committeeId} Committee`;
  if (commId === 'ssaf00') {
    parentCommitteeName = 'Senate Committee on Agriculture, Nutrition and Forestry';
  } else if (commId === 'hsap00') {
    parentCommitteeName = 'House Committee on Appropriations';
  }
  
  // Get subcommittee name from the main committee data if possible
  let subcommitteeName = `${subcommitteeId} Subcommittee`;
  
  // Map known subcommittee names
  if (commId === 'ssaf00' && subId === 'ssaf01') {
    subcommitteeName = 'Production and Price Competitiveness Subcommittee';
  }
  
  // Create sample subcommittee member data
  // In a real system, this would come from actual subcommittee data sources
  const sampleMembers = [
    {
      bioguideId: 'B001230',
      name: 'Tammy Baldwin',
      party: 'Democratic', 
      state: 'Wisconsin',
      district: null,
      title: 'Senator'
    },
    {
      bioguideId: 'B001288',
      name: 'Cory Booker',
      party: 'Democratic',
      state: 'New Jersey', 
      district: null,
      title: 'Senator'
    },
    {
      bioguideId: 'G000359',
      name: 'Lindsey Graham', 
      party: 'Republican',
      state: 'South Carolina',
      district: null,
      title: 'Senator'
    },
    {
      bioguideId: 'E000295',
      name: 'Joni Ernst',
      party: 'Republican',
      state: 'Iowa',
      district: null,
      title: 'Senator'
    },
    {
      bioguideId: 'T000250',
      name: 'John Thune',
      party: 'Republican', 
      state: 'South Dakota',
      district: null,
      title: 'Senator'
    },
    {
      bioguideId: 'S001181',
      name: 'Jeanne Shaheen',
      party: 'Democratic',
      state: 'New Hampshire', 
      district: null,
      title: 'Senator'
    }
  ];

  const members = chamber === 'Senate' ? sampleMembers : [];
  const republicans = members.filter(m => m.party === 'Republican' || m.party === 'R');
  const democrats = members.filter(m => m.party === 'Democratic' || m.party === 'D' || m.party === 'Democrat');
  
  const chair = republicans[0] || members[0] || null;
  const rankingMember = democrats[0] || (members.length > 1 ? members[1] : null);
  
  const membershipStats = {
    totalMembers: members.length,
    majorityMembers: republicans.length,
    minorityMembers: democrats.length
  };
  
  // Sample recent meetings data
  const recentMeetings = [
    {
      eventId: 'meeting-1',
      title: 'Agricultural Production Review',
      date: '2024-12-15',
      time: '10:00 AM',
      location: 'Committee Room',
      description: 'Review of current agricultural production and pricing trends.',
      url: null
    },
    {
      eventId: 'meeting-2', 
      title: 'Competitiveness Hearing',
      date: '2024-11-20',
      time: '2:00 PM',
      location: 'Committee Room',
      description: 'Hearing on agricultural competitiveness in global markets.',
      url: null
    }
  ];
  
  // Default fallback
  return {
    name: subcommitteeName,
    systemCode: subcommitteeId,
    chamber: chamber,
    url: "",
    phone: phone,
    office: "Contact information available on committee website",
    jurisdiction: "This subcommittee focuses on agricultural production efficiency, market competitiveness, and pricing policies to ensure American farmers remain competitive in global markets.",
    members: members,
    chair: chair,
    rankingMember: rankingMember,
    recentMeetings: recentMeetings,
    parentCommittee: {
      name: parentCommitteeName,
      systemCode: committeeId,
      url: `/federal/congress/119/committees/${committeeId}`
    },
    membershipStats: membershipStats
  };
}

export async function GET(req: NextRequest, { params }: { params: { committeeId: string, subcommitteeId: string } }) {
  const { committeeId, subcommitteeId } = await params;
  const { searchParams } = new URL(req.url);
  const congress = searchParams.get('congress');

  if (!congress || !committeeId || !subcommitteeId) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    console.log(`Fetching subcommittee details for ${subcommitteeId} in committee ${committeeId}, Congress ${congress}`);
    
    // Get subcommittee data
    const subcommitteeData = getSampleSubcommitteeData(subcommitteeId, committeeId);
    
    if (!subcommitteeData) {
      return NextResponse.json({ error: 'Subcommittee not found' }, { status: 404 });
    }

    console.log(`Returning subcommittee data: ${subcommitteeData.name}`);
    return NextResponse.json({ subcommittee: subcommitteeData });

  } catch (error) {
    console.error(`Error fetching subcommittee details for ${subcommitteeId}:`, error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}