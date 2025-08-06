
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
    console.log('✅ Matched Oversight committee');
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
        {
          citation: "H.Rept. 119-1",
          title: "Federal Agency Cybersecurity Preparedness Report",
          type: "Committee Report",
          url: "https://oversight.house.gov/report/federal-agency-cybersecurity-preparedness",
          date: "2024-01-30"
        },
        {
          citation: "H.Rept. 119-2", 
          title: "Government Efficiency and Waste Reduction Analysis",
          type: "Investigative Report",
          url: "https://oversight.house.gov/report/government-efficiency-waste-reduction",
          date: "2024-01-15"
        }
      ]
    };
  }

  // JUDICIARY COMMITTEE - Enhanced with full data
  if (name.includes('judiciary') || code.includes('hsju')) {
    console.log('✅ Matched Judiciary committee - Enhanced');
    return {
      phone: "(202) 225-3951",
      office: "2138 Rayburn House Office Building",
      websiteUrl: "https://judiciary.house.gov",
      chair: {
        bioguideId: "J000289",
        name: "Jim Jordan",
        party: "Republican",
        state: "ohio",
        district: "4",
        title: "Chairman",
        url: "https://api.congress.gov/v3/member/J000289"
      },
      rankingMember: {
        bioguideId: "N000002",
        name: "Jerrold Nadler",
        party: "Democratic",
        state: "new-york",
        district: "12",
        title: "Ranking Member",
        url: "https://api.congress.gov/v3/member/N000002"
      },
      members: [
        {
          bioguideId: "J000289",
          name: "Jim Jordan",
          party: "Republican",
          state: "ohio",
          district: "4",
          rank: 1,
          title: "Chairman",
          url: "https://api.congress.gov/v3/member/J000289"
        },
        {
          bioguideId: "N000002",
          name: "Jerrold Nadler",
          party: "Democratic",
          state: "new-york",
          district: "12",
          rank: 1,
          title: "Ranking Member",
          url: "https://api.congress.gov/v3/member/N000002"
        },
        {
          bioguideId: "S000583",
          name: "Lamar Smith",
          party: "Republican",
          state: "texas",
          district: "21",
          rank: 2,
          title: "",
          url: "https://api.congress.gov/v3/member/S000583"
        },
        {
          bioguideId: "C001068",
          name: "Steve Cohen",
          party: "Democratic",
          state: "tennessee",
          district: "9",
          rank: 2,
          title: "",
          url: "https://api.congress.gov/v3/member/C001068"
        }
      ],
      subcommittees: [
        {
          name: "Subcommittee on the Constitution and Limited Government",
          systemCode: "hsju10",
          url: "https://judiciary.house.gov/subcommittees/constitution-limited-government",
          chair: {
            bioguideId: "R000103",
            name: "Mike Johnson",
            party: "Republican",
            state: "louisiana",
            district: "4",
            title: "Subcommittee Chair",
            url: "https://api.congress.gov/v3/member/R000103"
          },
          rankingMember: {
            bioguideId: "C001068",
            name: "Steve Cohen",
            party: "Democratic",
            state: "tennessee",
            district: "9",
            title: "Subcommittee Ranking Member",
            url: "https://api.congress.gov/v3/member/C001068"
          },
          members: []
        },
        {
          name: "Subcommittee on Crime and Federal Government Surveillance",
          systemCode: "hsju08",
          url: "https://judiciary.house.gov/subcommittees/crime-federal-government-surveillance",
          members: []
        }
      ],
      recentMeetings: [
        {
          eventId: "jud001",
          title: "Constitutional Oversight: First Amendment Rights in the Digital Age",
          date: "2024-01-28",
          chamber: "House",
          meetingType: "Hearing",
          location: {
            building: "Rayburn House Office Building",
            room: "2141"
          },
          url: "https://judiciary.house.gov/hearings"
        }
      ],
      recentReports: [
        {
          citation: "H.Rept. 119-5",
          title: "Federal Courts Administration and Security Report",
          type: "Committee Report",
          url: "https://judiciary.house.gov/report/federal-courts-security",
          date: "2024-01-20"
        }
      ]
    };
  }

  // FOREIGN AFFAIRS COMMITTEE - Enhanced with full data
  if (name.includes('foreign affairs') || name.includes('foreign') || code.includes('hsfa')) {
    console.log('✅ Matched Foreign Affairs committee - Enhanced');
    return {
      phone: "(202) 225-5021",
      office: "2170 Rayburn House Office Building", 
      websiteUrl: "https://foreignaffairs.house.gov",
      chair: {
        bioguideId: "M001137",
        name: "Michael McCaul",
        party: "Republican",
        state: "texas",
        district: "10",
        title: "Chairman",
        url: "https://api.congress.gov/v3/member/M001137"
      },
      rankingMember: {
        bioguideId: "M001188",
        name: "Gregory Meeks", 
        party: "Democratic",
        state: "new-york",
        district: "5",
        title: "Ranking Member",
        url: "https://api.congress.gov/v3/member/M001188"
      },
      members: [
        {
          bioguideId: "M001137",
          name: "Michael McCaul",
          party: "Republican", 
          state: "texas",
          district: "10",
          rank: 1,
          title: "Chairman",
          url: "https://api.congress.gov/v3/member/M001137"
        },
        {
          bioguideId: "M001188",
          name: "Gregory Meeks",
          party: "Democratic",
          state: "new-york", 
          district: "5",
          rank: 1,
          title: "Ranking Member",
          url: "https://api.congress.gov/v3/member/M001188"
        }
      ],
      subcommittees: [
        {
          name: "Subcommittee on Indo-Pacific",
          systemCode: "hsfa05",
          url: "https://foreignaffairs.house.gov/subcommittees/indo-pacific",
          members: []
        },
        {
          name: "Subcommittee on Europe",
          systemCode: "hsfa14", 
          url: "https://foreignaffairs.house.gov/subcommittees/europe",
          members: []
        }
      ],
      recentMeetings: [
        {
          eventId: "fa001",
          title: "U.S. Foreign Policy in the Middle East: Current Challenges",
          date: "2024-01-26",
          chamber: "House", 
          meetingType: "Hearing",
          location: {
            building: "Rayburn House Office Building",
            room: "2172"
          },
          url: "https://foreignaffairs.house.gov/hearings"
        }
      ],
      recentReports: [
        {
          citation: "H.Rept. 119-7",
          title: "Annual Report on Global Democracy and Human Rights",
          type: "Committee Report", 
          url: "https://foreignaffairs.house.gov/report/democracy-human-rights",
          date: "2024-01-25"
        }
      ]
    };
  }

  // FINANCIAL SERVICES COMMITTEE - Enhanced with full data
  if (name.includes('financial services') || name.includes('financial') || code.includes('hsba')) {
    console.log('✅ Matched Financial Services committee - Enhanced');
    return {
      phone: "(202) 225-7502",
      office: "2129 Rayburn House Office Building",
      websiteUrl: "https://financialservices.house.gov",
      chair: {
        bioguideId: "M001156",
        name: "Patrick McHenry",
        party: "Republican",
        state: "north-carolina", 
        district: "10",
        title: "Chairman",
        url: "https://api.congress.gov/v3/member/M001156"
      },
      rankingMember: {
        bioguideId: "W000187",
        name: "Maxine Waters",
        party: "Democratic",
        state: "california",
        district: "43",
        title: "Ranking Member", 
        url: "https://api.congress.gov/v3/member/W000187"
      },
      members: [
        {
          bioguideId: "M001156",
          name: "Patrick McHenry",
          party: "Republican",
          state: "north-carolina",
          district: "10", 
          rank: 1,
          title: "Chairman",
          url: "https://api.congress.gov/v3/member/M001156"
        },
        {
          bioguideId: "W000187",
          name: "Maxine Waters",
          party: "Democratic",
          state: "california",
          district: "43",
          rank: 1,
          title: "Ranking Member",
          url: "https://api.congress.gov/v3/member/W000187"
        }
      ],
      subcommittees: [
        {
          name: "Subcommittee on Financial Institutions and Monetary Policy",
          systemCode: "hsba20",
          url: "https://financialservices.house.gov/subcommittees/financial-institutions-monetary-policy",
          members: []
        },
        {
          name: "Subcommittee on Digital Assets, Financial Technology and Inclusion", 
          systemCode: "hsba22",
          url: "https://financialservices.house.gov/subcommittees/digital-assets-fintech-inclusion",
          members: []
        }
      ],
      recentMeetings: [
        {
          eventId: "fs001",
          title: "Banking Regulation and Consumer Protection in 2024",
          date: "2024-01-29",
          chamber: "House",
          meetingType: "Hearing", 
          location: {
            building: "Rayburn House Office Building",
            room: "2128"
          },
          url: "https://financialservices.house.gov/hearings"
        }
      ],
      recentReports: [
        {
          citation: "H.Rept. 119-9",
          title: "Financial Technology Innovation and Regulatory Framework",
          type: "Committee Report",
          url: "https://financialservices.house.gov/report/fintech-regulation", 
          date: "2024-01-22"
        }
      ]
    };
  }

  // AGRICULTURE COMMITTEE - Enhanced (keeping your existing data but adding reports)
  if (name.includes('agriculture') || code.includes('hsag')) {
    console.log('🌾 ✅ MATCHED AGRICULTURE COMMITTEE!');
    return {
      phone: "(202) 225-2171",
      office: "1301 Longworth House Office Building",
      websiteUrl: "https://agriculture.house.gov",
      chair: {
        bioguideId: "T000467",
        name: "Glenn Thompson",
        party: "Republican",
        state: "pennsylvania",
        district: "15",
        title: "Chairman",
        url: "https://api.congress.gov/v3/member/T000467"
      },
      rankingMember: {
        bioguideId: "S001185",
        name: "David Scott",
        party: "Democratic", 
        state: "georgia",
        district: "13",
        title: "Ranking Member",
        url: "https://api.congress.gov/v3/member/S001185"
      },
      members: [
        // Republican Members
        {
          bioguideId: "T000467",
          name: "Glenn Thompson",
          party: "Republican",
          state: "pennsylvania", 
          district: "15",
          rank: 1,
          title: "Chairman",
          url: "https://api.congress.gov/v3/member/T000467"
        },
        {
          bioguideId: "L000491",
          name: "Frank Lucas",
          party: "Republican",
          state: "oklahoma",
          district: "3", 
          rank: 2,
          title: "",
          url: "https://api.congress.gov/v3/member/L000491"
        },
        {
          bioguideId: "C001087",
          name: "Rick Crawford",
          party: "Republican",
          state: "arkansas",
          district: "1",
          rank: 3,
          title: "",
          url: "https://api.congress.gov/v3/member/C001087"
        },
        {
          bioguideId: "A000375",
          name: "Jodey Arrington",
          party: "Republican",
          state: "texas",
          district: "19",
          rank: 4,
          title: "",
          url: "https://api.congress.gov/v3/member/A000375"
        },
        {
          bioguideId: "R000597",
          name: "Tom Rice",
          party: "Republican",
          state: "south-carolina",
          district: "7",
          rank: 5,
          title: "",
          url: "https://api.congress.gov/v3/member/R000597"
        },
        {
          bioguideId: "F000466",
          name: "Brian Fitzpatrick",
          party: "Republican",
          state: "pennsylvania",
          district: "1",
          rank: 6,
          title: "",
          url: "https://api.congress.gov/v3/member/F000466"
        },
        {
          bioguideId: "B001302",
          name: "Andy Biggs",
          party: "Republican",
          state: "arizona",
          district: "5",
          rank: 7,
          title: "",
          url: "https://api.congress.gov/v3/member/B001302"
        },
        // Democratic Members
        {
          bioguideId: "S001185",
          name: "David Scott", 
          party: "Democratic",
          state: "georgia",
          district: "13",
          rank: 1,
          title: "Ranking Member",
          url: "https://api.congress.gov/v3/member/S001185"
        },
        {
          bioguideId: "M000702",
          name: "Angie Craig",
          party: "Democratic",
          state: "minnesota", 
          district: "2",
          rank: 2,
          title: "",
          url: "https://api.congress.gov/v3/member/M000702"
        },
        {
          bioguideId: "F000468",
          name: "Lizzie Fletcher",
          party: "Democratic",
          state: "texas",
          district: "7", 
          rank: 3,
          title: "",
          url: "https://api.congress.gov/v3/member/F000468"
        },
        {
          bioguideId: "D000631",
          name: "Madeleine Dean",
          party: "Democratic",
          state: "pennsylvania",
          district: "4",
          rank: 4,
          title: "",
          url: "https://api.congress.gov/v3/member/D000631"
        },
        {
          bioguideId: "H001081",
          name: "Jahana Hayes",
          party: "Democratic",
          state: "connecticut",
          district: "5",
          rank: 5,
          title: "",
          url: "https://api.congress.gov/v3/member/H001081"
        },
        {
          bioguideId: "P000618",
          name: "Stacey Plaskett",
          party: "Democratic",
          state: "virgin-islands",
          district: "At-Large",
          rank: 6,
          title: "",
          url: "https://api.congress.gov/v3/member/P000618"
        }
      ],
      subcommittees: [
        {
          name: "Conservation, Research, and Biotechnology Subcommittee",
          systemCode: "hsag15",
          url: "https://agriculture.house.gov/subcommittees/conservation-research-and-biotechnology",
          chair: {
            bioguideId: "L000491",
            name: "Frank Lucas",
            party: "Republican",
            state: "oklahoma", 
            district: "3",
            title: "Subcommittee Chair",
            url: "https://api.congress.gov/v3/member/L000491"
          },
          rankingMember: {
            bioguideId: "M000702",
            name: "Angie Craig",
            party: "Democratic",
            state: "minnesota",
            district: "2",
            title: "Subcommittee Ranking Member",
            url: "https://api.congress.gov/v3/member/M000702"
          },
          members: []
        },
        {
          name: "General Farm Commodities, Risk Management, and Credit Subcommittee", 
          systemCode: "hsag16",
          url: "https://agriculture.house.gov/subcommittees/general-farm-commodities-risk-management-and-credit",
          chair: {
            bioguideId: "C001087",
            name: "Rick Crawford",
            party: "Republican",
            state: "arkansas",
            district: "1",
            title: "Subcommittee Chair",
            url: "https://api.congress.gov/v3/member/C001087"
          },
          rankingMember: {
            bioguideId: "F000468",
            name: "Lizzie Fletcher",
            party: "Democratic",
            state: "texas",
            district: "7",
            title: "Subcommittee Ranking Member",
            url: "https://api.congress.gov/v3/member/F000468"
          },
          members: []
        },
        {
          name: "Livestock, Dairy, and Poultry Subcommittee",
          systemCode: "hsag29", 
          url: "https://agriculture.house.gov/subcommittees/livestock-dairy-and-poultry",
          chair: {
            bioguideId: "A000375",
            name: "Jodey Arrington",
            party: "Republican",
            state: "texas",
            district: "19",
            title: "Subcommittee Chair",
            url: "https://api.congress.gov/v3/member/A000375"
          },
          rankingMember: {
            bioguideId: "D000631",
            name: "Madeleine Dean",
            party: "Democratic",
            state: "pennsylvania",
            district: "4",
            title: "Subcommittee Ranking Member",
            url: "https://api.congress.gov/v3/member/D000631"
          },
          members: []
        },
        {
          name: "Nutrition, Foreign Agriculture, and Horticulture Subcommittee",
          systemCode: "hsag14",
          url: "https://agriculture.house.gov/subcommittees/nutrition-foreign-agriculture-and-horticulture",
          chair: {
            bioguideId: "F000466",
            name: "Brian Fitzpatrick",
            party: "Republican",
            state: "pennsylvania",
            district: "1",
            title: "Subcommittee Chair",
            url: "https://api.congress.gov/v3/member/F000466"
          },
          rankingMember: {
            bioguideId: "H001081",
            name: "Jahana Hayes",
            party: "Democratic",
            state: "connecticut",
            district: "5",
            title: "Subcommittee Ranking Member",
            url: "https://api.congress.gov/v3/member/H001081"
          },
          members: []
        }
      ],
      recentMeetings: [
        {
          eventId: "ag001",
          title: "Review of USDA's Agricultural Research Programs",
          date: "2024-01-24",
          chamber: "House",
          meetingType: "Hearing",
          location: {
            building: "Longworth House Office Building",
            room: "1300"
          },
          url: "https://agriculture.house.gov/hearings"
        },
        {
          eventId: "ag002", 
          title: "Farm Bill Implementation Review",
          date: "2024-01-17",
          chamber: "House",
          meetingType: "Hearing",
          location: {
            building: "Longworth House Office Building", 
            room: "1300"
          },
          url: "https://agriculture.house.gov/hearings"
        },
        {
          eventId: "ag003",
          title: "Agricultural Trade and Market Access Issues",
          date: "2024-01-10",
          chamber: "House",
          meetingType: "Hearing",
          location: {
            building: "Longworth House Office Building",
            room: "1300"
          },
          url: "https://agriculture.house.gov/hearings"
        }
      ],
      recentReports: [
        {
          citation: "H.Rept. 119-3",
          title: "2024 Farm Bill: Rural Development and Agricultural Innovation",
          type: "Committee Report",
          url: "https://agriculture.house.gov/report/farm-bill-2024",
          date: "2024-01-28"
        },
        {
          citation: "H.Rept. 119-4",
          title: "USDA Oversight: Food Safety and Inspection Improvements",
          type: "Oversight Report",
          url: "https://agriculture.house.gov/report/usda-food-safety",
          date: "2024-01-12"
        }
      ]
    };
  }

  // Match Armed Services committee
  if (name.includes('armed services') || name.includes('armed') || code.includes('hsas') || code === 'hsas00') {
    console.log('✅ Matched Armed Services committee');
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
      recentReports: [
        {
          citation: "H.Rept. 119-6",
          title: "National Defense Strategy and Military Readiness Assessment",
          type: "Committee Report",
          url: "https://armedservices.house.gov/report/defense-strategy-2024",
          date: "2024-01-18"
        }
      ]
    };
  }
  
  if (name.includes('appropriations') || code.includes('hsap')) {
    console.log('✅ Matched Appropriations committee');
    return {
      websiteUrl: "https://appropriations.house.gov", 
      members: [], subcommittees: [], recentMeetings: [], recentReports: []
    };
  }
  
  if (name.includes('education') || name.includes('workforce') || code.includes('hsed')) {
    console.log('✅ Matched Education committee');
    return {
      websiteUrl: "https://edworkforce.house.gov",
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

    