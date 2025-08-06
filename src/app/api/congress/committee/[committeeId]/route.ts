
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
  chair?: CommitteeMember;
  rankingMember?: CommitteeMember;
  members?: CommitteeMember[];
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

// Sample data for committee members (replace with real API calls when available)
function getSampleCommitteeData(committeeName: string, systemCode: string): Partial<EnhancedCommitteeInfo> & { websiteUrl?: string } {
  const name = committeeName.toLowerCase();
  const code = systemCode.toLowerCase();
  
  console.log(`Matching committee: name="${name}", code="${code}"`);
  
  // Match Oversight committee by name or system code
  if (name.includes('oversight') || code.includes('hsgo') || code === 'hsgo00') {
    console.log('Matched Oversight committee');
    return {
      phone: "(202) 225-5074",
      office: "2157 Rayburn House Office Building",
      websiteUrl: "https://oversight.house.gov",
      chair: {
        bioguideId: "C001055",
        name: "James Comer",
        party: "Republican",
        state: "kentucky",
        district: "1",
        title: "Chairman",
        url: "https://api.congress.gov/v3/member/C001055"
      },
      rankingMember: {
        bioguideId: "R000606",
        name: "Jamie Raskin",
        party: "Democratic",
        state: "maryland",
        district: "8",
        title: "Ranking Member",
        url: "https://api.congress.gov/v3/member/R000606"
      },
      members: [
        {
          bioguideId: "C001055",
          name: "James Comer",
          party: "Republican",
          state: "kentucky",
          district: "1",
          rank: 1,
          title: "Chairman",
          url: "https://api.congress.gov/v3/member/C001055"
        },
        {
          bioguideId: "J000299",
          name: "Clay Higgins",
          party: "Republican",
          state: "louisiana",
          district: "3",
          rank: 2,
          title: "",
          url: "https://api.congress.gov/v3/member/J000299"
        },
        {
          bioguideId: "G000596",
          name: "Marjorie Taylor Greene",
          party: "Republican",
          state: "georgia",
          district: "14",
          rank: 3,
          title: "",
          url: "https://api.congress.gov/v3/member/G000596"
        },
        {
          bioguideId: "R000606",
          name: "Jamie Raskin",
          party: "Democratic",
          state: "maryland",
          district: "8",
          rank: 1,
          title: "Ranking Member",
          url: "https://api.congress.gov/v3/member/R000606"
        },
        {
          bioguideId: "K000394",
          name: "Andy Kim",
          party: "Democratic",
          state: "new-jersey",
          district: "3",
          rank: 2,
          title: "",
          url: "https://api.congress.gov/v3/member/K000394"
        },
        {
          bioguideId: "P000617",
          name: "Ayanna Pressley",
          party: "Democratic",
          state: "massachusetts",
          district: "7",
          rank: 3,
          title: "",
          url: "https://api.congress.gov/v3/member/P000617"
        }
      ],
      subcommittees: [
        {
          name: "Cybersecurity, Information Technology, and Government Innovation Subcommittee",
          systemCode: "hsgo29",
          url: "https://oversight.house.gov/subcommittees/cybersecurity-information-technology-and-government-innovation-subcommittee",
          chair: {
            bioguideId: "J000299",
            name: "Clay Higgins",
            party: "Republican",  
            state: "louisiana",
            district: "3",
            title: "Subcommittee Chair",
            url: "https://api.congress.gov/v3/member/J000299"
          },
          members: []
        },
        {
          name: "Economic Growth, Energy Policy, and Regulatory Affairs Subcommittee",
          systemCode: "hsgo06",
          url: "https://oversight.house.gov/subcommittees/economic-growth-energy-policy-and-regulatory-affairs-subcommittee",
          members: []
        },
        {
          name: "Government Operations Subcommittee",
          systemCode: "hsgo24",
          url: "https://oversight.house.gov/subcommittees/government-operations-subcommittee",
          members: []
        },
        {
          name: "Health Care and Financial Services Subcommittee",
          systemCode: "hsgo17",
          url: "https://oversight.house.gov/subcommittees/health-care-and-financial-services-subcommittee",
          members: []
        },
        {
          name: "Delivering on Government Efficiency Subcommittee",
          systemCode: "hsgo30",
          url: "https://oversight.house.gov/subcommittees/delivering-on-government-efficiency-subcommittee",
          members: []
        },
        {
          name: "Federal Law Enforcement Subcommittee",
          systemCode: "hsgo31",
          url: "https://oversight.house.gov/subcommittees/federal-law-enforcement-subcommittee",
          members: []
        },
        {
          name: "Military and Foreign Affairs Subcommittee",
          systemCode: "hsgo32",
          url: "https://oversight.house.gov/subcommittees/military-and-foreign-affairs-subcommittee",
          members: []
        }
      ],
      recentMeetings: [
        {
          eventId: "115538",
          title: "Examining Federal Agencies' Use of Artificial Intelligence",
          date: "2024-01-25",
          chamber: "House",
          meetingType: "Hearing",
          location: {
            building: "Rayburn House Office Building",
            room: "2154"
          },
          url: "https://oversight.house.gov/hearing/examining-federal-agencies-use-of-artificial-intelligence"
        },
        {
          eventId: "115539",
          title: "Oversight of Federal IT Modernization Efforts",
          date: "2024-01-18",
          chamber: "House",
          meetingType: "Hearing",
          location: {
            building: "Rayburn House Office Building",
            room: "2154"
          },
          url: "https://oversight.house.gov/hearing/oversight-of-federal-it-modernization-efforts"
        }
      ],
      recentReports: [
      ]
    };
  }
  
  // Match Armed Services committee
  if (name.includes('armed services') || name.includes('armed') || code.includes('hsas') || code === 'hsas00') {
    console.log('Matched Armed Services committee');
    return {
      phone: "(202) 225-2120",
      office: "2216 Rayburn House Office Building",
      websiteUrl: "https://armedservices.house.gov",
      chair: {
        bioguideId: "R000575",
        name: "Mike Rogers",
        party: "Republican",
        state: "alabama",
        district: "3",
        title: "Chairman",
        url: "https://api.congress.gov/v3/member/R000575"
      },
      rankingMember: {
        bioguideId: "S001200",
        name: "Adam Smith",
        party: "Democratic",
        state: "washington",
        district: "9",
        title: "Ranking Member",
        url: "https://api.congress.gov/v3/member/S001200"
      },
      members: [
        {
          bioguideId: "R000575",
          name: "Mike Rogers",
          party: "Republican",
          state: "alabama",
          district: "3",
          rank: 1,
          title: "Chairman",
          url: "https://api.congress.gov/v3/member/R000575"
        },
        {
          bioguideId: "S001200",
          name: "Adam Smith",
          party: "Democratic",
          state: "washington",
          district: "9",
          rank: 1,
          title: "Ranking Member",
          url: "https://api.congress.gov/v3/member/S001200"
        }
      ],
      subcommittees: [
        {
          name: "Tactical Air and Land Forces Subcommittee",
          systemCode: "hsas25",
          url: "https://armedservices.house.gov/subcommittees/tactical-air-and-land-forces",
          members: []
        },
        {
          name: "Seapower and Projection Forces Subcommittee", 
          systemCode: "hsas28",
          url: "https://armedservices.house.gov/subcommittees/seapower-and-projection-forces",
          members: []
        },
        {
          name: "Strategic Forces Subcommittee",
          systemCode: "hsas29",
          url: "https://armedservices.house.gov/subcommittees/strategic-forces",
          members: []
        },
        {
          name: "Military Personnel Subcommittee",
          systemCode: "hsas02",
          url: "https://armedservices.house.gov/subcommittees/military-personnel", 
          members: []
        },
        {
          name: "Readiness Subcommittee",
          systemCode: "hsas03",
          url: "https://armedservices.house.gov/subcommittees/readiness",
          members: []
        },
        {
          name: "Intelligence and Special Operations Subcommittee",
          systemCode: "hsas26",
          url: "https://armedservices.house.gov/subcommittees/intelligence-and-special-operations",
          members: []
        },
        {
          name: "Cyber, Information Technologies, and Innovation Subcommittee",
          systemCode: "hsas27",
          url: "https://armedservices.house.gov/subcommittees/cyber-information-technologies-and-innovation",
          members: []
        }
      ],
      recentMeetings: [
        {
          eventId: "armed001",
          title: "National Defense Authorization Act Markup",
          date: "2024-01-20",
          chamber: "House",
          meetingType: "Markup",
          location: {
            building: "Rayburn House Office Building",
            room: "2118"
          },
          url: "https://armedservices.house.gov/hearings"
        }
      ],
      recentReports: []
    };
  }
  
  // Add more known committee websites
  if (name.includes('judiciary') || code.includes('hsju')) {
    console.log('Matched Judiciary committee');
    return {
      websiteUrl: "https://judiciary.house.gov",
      members: [], subcommittees: [], recentMeetings: [], recentReports: []
    };
  }
  
  if (name.includes('appropriations') || code.includes('hsap')) {
    console.log('Matched Appropriations committee');
    return {
      websiteUrl: "https://appropriations.house.gov", 
      members: [], subcommittees: [], recentMeetings: [], recentReports: []
    };
  }
  
  if (name.includes('foreign affairs') || name.includes('foreign') || code.includes('hsfa')) {
    console.log('Matched Foreign Affairs committee');
    return {
      websiteUrl: "https://foreignaffairs.house.gov",
      members: [], subcommittees: [], recentMeetings: [], recentReports: []
    };
  }
  
  if (name.includes('education') || name.includes('workforce') || code.includes('hsed')) {
    console.log('Matched Education committee');
    return {
      websiteUrl: "https://edworkforce.house.gov",
      members: [], subcommittees: [], recentMeetings: [], recentReports: []
    };
  }
  
  if (name.includes('agriculture') || code.includes('hsag')) {
    console.log('Matched Agriculture committee');
    return {
      websiteUrl: "https://agriculture.house.gov",
      members: [], subcommittees: [], recentMeetings: [], recentReports: []
    };
  }
  
  if (name.includes('financial services') || name.includes('financial') || code.includes('hsba')) {
    console.log('Matched Financial Services committee');
    return {
      websiteUrl: "https://financialservices.house.gov",
      members: [], subcommittees: [], recentMeetings: [], recentReports: []
    };
  }
  
  // Default fallback
  console.log('Using default fallback');
  return {
    phone: "(202) 225-4000",
    office: "Committee Office Address Available on Official Website", 
    websiteUrl: "https://www.congress.gov/committees",
    members: [
      {
        bioguideId: "SAMPLE001",
        name: "Committee Chair",
        party: "Republican",
        state: "texas",
        district: "1",
        rank: 1,
        title: "Chairman",
        url: "https://api.congress.gov/v3/member/SAMPLE001"
      },
      {
        bioguideId: "SAMPLE002", 
        name: "Ranking Member",
        party: "Democratic",
        state: "california",
        district: "2",
        rank: 1,
        title: "Ranking Member",
        url: "https://api.congress.gov/v3/member/SAMPLE002"
      }
    ],
    subcommittees: [
      {
        name: "Sample Subcommittee",
        systemCode: "sample01",
        url: "",
        members: []
      }
    ],
    recentMeetings: [
      {
        eventId: "sample001",
        title: "Committee Business Meeting",
        date: "2024-01-15",
        chamber: "House",
        meetingType: "Meeting",
        location: {
          building: "Capitol Building",
          room: "Committee Room"
        },
        url: ""
      }
    ],
    recentReports: []
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
        console.warn(`Resource not found (404): ${url}`);
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
    console.log(`Fetching committee details for ${committeeId} in Congress ${congress}`);
    
    // First, find the committee in the list to get basic info
    const listUrl = `https://api.congress.gov/v3/committee/${congress}?limit=250&format=json&api_key=${API_KEY}`;
    const listRes = await fetchWithRetry(listUrl);
    const listData = await listRes.json();
    
    const foundCommittee = (listData.committees || []).find((c: any) => 
      c.systemCode?.toLowerCase() === committeeId.toLowerCase()
    );

    if (!foundCommittee) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
    }

    console.log(`Found committee: ${foundCommittee.name} (${foundCommittee.systemCode})`);

    // Extract chamber info
    const chamber = foundCommittee.chamber?.toLowerCase() || 'house';
    const systemCode = foundCommittee.systemCode?.toLowerCase();

    // Use the foundCommittee data since detailed endpoint doesn't exist
    const detailedCommittee = foundCommittee;
    console.log('Using committee list data (detailed endpoint not available)');

    // Get sample/enhanced data
    console.log(`Looking for sample data for: "${detailedCommittee.name}" with code: "${systemCode}"`);
    console.log(`Full committee object:`, JSON.stringify(detailedCommittee, null, 2));
    const sampleData = getSampleCommitteeData(detailedCommittee.name, systemCode);
    console.log(`Sample data found:`, {
      hasMembers: sampleData.members?.length || 0,
      hasSubcommittees: sampleData.subcommittees?.length || 0,
      hasChair: !!sampleData.chair,
      hasPhone: !!sampleData.phone,
      websiteUrl: sampleData.websiteUrl
    });
    
    // Use sample members if available, otherwise empty array
    const members = sampleData.members || [];
    
    // Calculate membership statistics
    const republicanMembers = members.filter(m => m.party === 'Republican' || m.party === 'R').length;
    const democraticMembers = members.filter(m => m.party === 'Democratic' || m.party === 'Democrat' || m.party === 'D').length;
    
    // Determine majority/minority based on chamber control (House is currently Republican majority)
    const isMajorityRepublican = chamber === 'house';
    
    const enhancedCommittee: EnhancedCommitteeInfo = {
      name: detailedCommittee.name || '',
      systemCode: detailedCommittee.systemCode || '',
      chamber: detailedCommittee.chamber || '',
      committeeType: detailedCommittee.committeeType || detailedCommittee.type || 'Standing',
      url: sampleData.websiteUrl || detailedCommittee.url,
      phone: sampleData.phone || detailedCommittee.phone || detailedCommittee.phoneNumber,
      office: sampleData.office || detailedCommittee.office,
      jurisdiction: detailedCommittee.jurisdiction,
      chair: sampleData.chair || members.find(m => m.title?.toLowerCase().includes('chair') && !m.title?.toLowerCase().includes('ranking')),
      rankingMember: sampleData.rankingMember || members.find(m => m.title?.toLowerCase().includes('ranking')),
      members: members,
      subcommittees: sampleData.subcommittees || [],
      recentMeetings: sampleData.recentMeetings || [],
      recentReports: sampleData.recentReports || [],
      membershipStats: {
        totalMembers: members.length,
        majorityMembers: isMajorityRepublican ? republicanMembers : democraticMembers,
        minorityMembers: isMajorityRepublican ? democraticMembers : republicanMembers
      }
    };

    console.log(`Returning enhanced committee data with ${members.length} members, ${sampleData.subcommittees?.length || 0} subcommittees`);
    return NextResponse.json({ committee: enhancedCommittee });

  } catch (error) {
    console.error(`Error fetching committee details for ${committeeId}:`, error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

    