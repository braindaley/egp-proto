'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye, ExternalLink, ArrowRight } from 'lucide-react';
import { campaignsService } from '@/lib/campaigns';
import { useAuth } from '@/hooks/use-auth';
import { HomeAdvocacySummary } from '@/components/home-advocacy-summary';
import { useZipCode } from '@/hooks/use-zip-code';
import { useMembersByZip } from '@/hooks/useMembersByZip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BillProgress } from '@/components/BillProgress';

interface NewsStory {
  id: number;
  headline: string;
  description: string;
  category: string;
  image?: string;
}

interface Bill {
  congress: number;
  number: string;
  type: string;
  title: string;
  url: string;
  updateDate: string;
}

interface StateBill {
  bill_id: number;
  number: string;
  title: string;
  description?: string;
  status: number;
  last_action?: string;
  last_action_date?: string;
  url?: string;
}

interface FederalRepresentative {
  name: string;
  party: string;
  officeTitle: string;
  districtNumber?: number;
  bioguideId?: string;
  imageUrl?: string;
  stateCode?: string;
}

interface StateRepresentative {
  name: string;
  party: string;
  chamber: 'Senate' | 'House';
  district?: number;
  imageUrl?: string;
  profileUrl?: string;
}

interface LocalRepresentative {
  name: string;
  party: string;
  position: string;
  imageUrl?: string;
  district?: string;
}

interface HomepageNewsSectionProps {
  newsStories: NewsStory[];
}

// Mock data for local representatives (city and school board)
const mockCityCouncil: LocalRepresentative[] = [
  {
    name: 'Valerie Amezcua',
    party: 'Nonpartisan',
    position: 'Mayor',
    imageUrl: 'https://www.santa-ana.org/sites/default/files/styles/employee/public/council-mayor-amezcua_1.jpg'
  },
  {
    name: 'Johnathan Ryan Hernandez',
    party: 'Nonpartisan',
    position: 'Council Member - Ward 1',
    imageUrl: 'https://www.santa-ana.org/sites/default/files/styles/employee/public/hernandez-headshot-web.jpg'
  },
  {
    name: 'Jessie Lopez',
    party: 'Nonpartisan',
    position: 'Council Member - Ward 2',
    imageUrl: 'https://www.santa-ana.org/sites/default/files/styles/employee/public/lopez-headshot.jpg'
  },
  {
    name: 'Phil Bacerra',
    party: 'Nonpartisan',
    position: 'Council Member - Ward 3',
    imageUrl: 'https://www.santa-ana.org/sites/default/files/styles/employee/public/bacerra-headshot.jpg'
  },
  {
    name: 'Nelida Mendoza',
    party: 'Nonpartisan',
    position: 'Council Member - Ward 4',
    imageUrl: 'https://www.santa-ana.org/sites/default/files/styles/employee/public/mendoza-headshot.jpg'
  }
];

const mockSchoolBoard: LocalRepresentative[] = [
  {
    name: 'Carolyn Torres',
    party: 'Nonpartisan',
    position: 'Board President',
    district: 'Area 1'
  },
  {
    name: 'Rigo Rodriguez',
    party: 'Nonpartisan',
    position: 'Board Vice President',
    district: 'Area 2'
  },
  {
    name: 'Valerie Amezcua',
    party: 'Nonpartisan',
    position: 'Board Clerk',
    district: 'Area 3'
  },
  {
    name: 'Alfonso Alvarez',
    party: 'Nonpartisan',
    position: 'Board Member',
    district: 'Area 4'
  },
  {
    name: 'John Palacio',
    party: 'Nonpartisan',
    position: 'Board Member',
    district: 'Area 5'
  }
];

const mockStateRepresentatives: Record<string, StateRepresentative[]> = {
  'CA': [
    {
      name: 'Alex Padilla',
      party: 'Democrat',
      chamber: 'Senate',
      imageUrl: 'https://www.govinfo.gov/content/pkg/CDOC-117sdoc3/html/images/CDOC-117sdoc3-4.jpg'
    },
    {
      name: 'Laphonza Butler',
      party: 'Democrat',
      chamber: 'Senate',
      imageUrl: 'https://www.govinfo.gov/content/pkg/CDOC-118sdoc4/html/images/CDOC-118sdoc4-13.jpg'
    },
    {
      name: 'Nancy Skinner',
      party: 'Democrat',
      chamber: 'House',
      district: 9,
      imageUrl: 'https://sd09.senate.ca.gov/sites/sd09.senate.ca.gov/files/headshot%20Skinner%202022.jpg'
    }
  ],
  'NY': [
    {
      name: 'Chuck Schumer',
      party: 'Democrat',
      chamber: 'Senate'
    },
    {
      name: 'Kirsten Gillibrand',
      party: 'Democrat',
      chamber: 'Senate'
    },
    {
      name: 'Brad Hoylman-Sigal',
      party: 'Democrat',
      chamber: 'House',
      district: 47
    }
  ],
  'TX': [
    {
      name: 'John Cornyn',
      party: 'Republican',
      chamber: 'Senate'
    },
    {
      name: 'Ted Cruz',
      party: 'Republican',
      chamber: 'Senate'
    },
    {
      name: 'José Menéndez',
      party: 'Democrat',
      chamber: 'House',
      district: 26
    }
  ],
  'FL': [
    {
      name: 'Marco Rubio',
      party: 'Republican',
      chamber: 'Senate'
    },
    {
      name: 'Rick Scott',
      party: 'Republican',
      chamber: 'Senate'
    },
    {
      name: 'Lauren Book',
      party: 'Democrat',
      chamber: 'House',
      district: 35
    }
  ]
};

export function HomepageNewsSection({ newsStories }: HomepageNewsSectionProps) {
  const [latestBills, setLatestBills] = useState<Bill[]>([]);
  const [stateBills, setStateBills] = useState<StateBill[]>([]);
  const [userState, setUserState] = useState<{ name: string; code: string } | null>(null);
  const [federalRepsWithImages, setFederalRepsWithImages] = useState<FederalRepresentative[]>([]);
  const [stateReps, setStateReps] = useState<StateRepresentative[]>([]);
  const { user, loading: authLoading } = useAuth();
  const { zipCode } = useZipCode();
  const { representatives: federalReps, isLoading: federalLoading } = useMembersByZip(zipCode);
  // Mix up the stories to get diverse categories
  // Instead of taking the first 3 (all abortion), let's pick from different positions
  const firstStory = newsStories[4];  // Climate story (index 4)
  const secondStory = newsStories[22]; // Economy story (index 22)
  const thirdStory = newsStories[31];  // Gun Policy story (index 31)

  // Get campaigns for the Recent Campaigns list
  // Only include bill campaigns (not candidate campaigns)
  const allCampaigns = campaignsService.getAllCampaigns()
    .filter(campaign => campaign.isActive && campaign.bill)
    .slice(0, 3); // Get first 3 campaigns

  // Add candidate campaign as 4th item
  const candidateCampaign = {
    id: 'candidate-1',
    groupName: 'League of Women Voters',
    groupSlug: 'league-of-women-voters',
    position: 'Support',
    bill: {
      type: 'CANDIDATE',
      number: '1',
      title: 'Maria Alvarez vs James Whitman',
      congress: 119
    },
    isActive: true
  };

  // Bill CTA for home news feed
  const billCTA = {
    id: 'bill-cta-climate',
    type: 'billCTA',
    billNumber: 'H.R. 3838',
    billTitle: 'Clean Energy Innovation and Deployment Act',
    aiOverview: 'This comprehensive climate bill establishes a framework to achieve net-zero emissions by 2050 through investments in renewable energy infrastructure, carbon capture technology, and green job creation.',
    stage: 'passed-house' as const,
    nextPhase: 'Voice your opinion before the Senate vote in April',
    category: 'Climate, Energy & Environment',
    url: '/federal/bill/119/hr/3838'
  };

  // Helper to get state from zip code
  const getStateFromZip = (zip: string): { name: string; code: string } | null => {
    if (!zip) return null;
    const prefix = zip.substring(0, 3);
    const stateMap: Record<string, { name: string; code: string }> = {
      '900': { name: 'California', code: 'CA' },
      '901': { name: 'California', code: 'CA' },
      '902': { name: 'California', code: 'CA' },
      '903': { name: 'California', code: 'CA' },
      '904': { name: 'California', code: 'CA' },
      '905': { name: 'California', code: 'CA' },
      '906': { name: 'California', code: 'CA' },
      '907': { name: 'California', code: 'CA' },
      '908': { name: 'California', code: 'CA' },
      '910': { name: 'California', code: 'CA' },
      '911': { name: 'California', code: 'CA' },
      '912': { name: 'California', code: 'CA' },
      '913': { name: 'California', code: 'CA' },
      '914': { name: 'California', code: 'CA' },
      '915': { name: 'California', code: 'CA' },
      '916': { name: 'California', code: 'CA' },
      '917': { name: 'California', code: 'CA' },
      '918': { name: 'California', code: 'CA' },
      '919': { name: 'California', code: 'CA' },
      '920': { name: 'California', code: 'CA' },
      '921': { name: 'California', code: 'CA' },
      '922': { name: 'California', code: 'CA' },
      '923': { name: 'California', code: 'CA' },
      '924': { name: 'California', code: 'CA' },
      '925': { name: 'California', code: 'CA' },
      '926': { name: 'California', code: 'CA' },
      '927': { name: 'California', code: 'CA' },
      '928': { name: 'California', code: 'CA' },
      '930': { name: 'California', code: 'CA' },
      '931': { name: 'California', code: 'CA' },
      '932': { name: 'California', code: 'CA' },
      '933': { name: 'California', code: 'CA' },
      '934': { name: 'California', code: 'CA' },
      '935': { name: 'California', code: 'CA' },
      '936': { name: 'California', code: 'CA' },
      '937': { name: 'California', code: 'CA' },
      '938': { name: 'California', code: 'CA' },
      '939': { name: 'California', code: 'CA' },
      '940': { name: 'California', code: 'CA' },
      '941': { name: 'California', code: 'CA' },
      '942': { name: 'California', code: 'CA' },
      '943': { name: 'California', code: 'CA' },
      '944': { name: 'California', code: 'CA' },
      '945': { name: 'California', code: 'CA' },
      '946': { name: 'California', code: 'CA' },
      '947': { name: 'California', code: 'CA' },
      '948': { name: 'California', code: 'CA' },
      '949': { name: 'California', code: 'CA' },
      '950': { name: 'California', code: 'CA' },
      '951': { name: 'California', code: 'CA' },
      '952': { name: 'California', code: 'CA' },
      '953': { name: 'California', code: 'CA' },
      '954': { name: 'California', code: 'CA' },
      '955': { name: 'California', code: 'CA' },
      '956': { name: 'California', code: 'CA' },
      '957': { name: 'California', code: 'CA' },
      '958': { name: 'California', code: 'CA' },
      '959': { name: 'California', code: 'CA' },
      '960': { name: 'California', code: 'CA' },
      '961': { name: 'California', code: 'CA' },
      '100': { name: 'New York', code: 'NY' },
      '101': { name: 'New York', code: 'NY' },
      '102': { name: 'New York', code: 'NY' },
      '103': { name: 'New York', code: 'NY' },
      '104': { name: 'New York', code: 'NY' },
      '750': { name: 'Texas', code: 'TX' },
      '751': { name: 'Texas', code: 'TX' },
      '752': { name: 'Texas', code: 'TX' },
      '753': { name: 'Texas', code: 'TX' },
      '754': { name: 'Texas', code: 'TX' },
      '755': { name: 'Texas', code: 'TX' },
      '756': { name: 'Texas', code: 'TX' },
      '757': { name: 'Texas', code: 'TX' },
      '758': { name: 'Texas', code: 'TX' },
      '759': { name: 'Texas', code: 'TX' },
      '760': { name: 'Texas', code: 'TX' },
      '761': { name: 'Texas', code: 'TX' },
      '762': { name: 'Texas', code: 'TX' },
      '763': { name: 'Texas', code: 'TX' },
      '764': { name: 'Texas', code: 'TX' },
      '765': { name: 'Texas', code: 'TX' },
      '766': { name: 'Texas', code: 'TX' },
      '767': { name: 'Texas', code: 'TX' },
      '768': { name: 'Texas', code: 'TX' },
      '769': { name: 'Texas', code: 'TX' },
      '770': { name: 'Texas', code: 'TX' },
      '771': { name: 'Texas', code: 'TX' },
      '772': { name: 'Texas', code: 'TX' },
      '773': { name: 'Texas', code: 'TX' },
      '774': { name: 'Texas', code: 'TX' },
      '775': { name: 'Texas', code: 'TX' },
      '776': { name: 'Texas', code: 'TX' },
      '777': { name: 'Texas', code: 'TX' },
      '778': { name: 'Texas', code: 'TX' },
      '779': { name: 'Texas', code: 'TX' },
      '780': { name: 'Texas', code: 'TX' },
      '781': { name: 'Texas', code: 'TX' },
      '782': { name: 'Texas', code: 'TX' },
      '783': { name: 'Texas', code: 'TX' },
      '784': { name: 'Texas', code: 'TX' },
      '785': { name: 'Texas', code: 'TX' },
      '786': { name: 'Texas', code: 'TX' },
      '787': { name: 'Texas', code: 'TX' },
      '788': { name: 'Texas', code: 'TX' },
      '789': { name: 'Texas', code: 'TX' },
      '790': { name: 'Texas', code: 'TX' },
      '791': { name: 'Texas', code: 'TX' },
      '792': { name: 'Texas', code: 'TX' },
      '793': { name: 'Texas', code: 'TX' },
      '794': { name: 'Texas', code: 'TX' },
      '795': { name: 'Texas', code: 'TX' },
      '796': { name: 'Texas', code: 'TX' },
      '797': { name: 'Texas', code: 'TX' },
      '798': { name: 'Texas', code: 'TX' },
      '799': { name: 'Texas', code: 'TX' },
      '320': { name: 'Florida', code: 'FL' },
      '321': { name: 'Florida', code: 'FL' },
      '322': { name: 'Florida', code: 'FL' },
      '323': { name: 'Florida', code: 'FL' },
      '324': { name: 'Florida', code: 'FL' },
      '325': { name: 'Florida', code: 'FL' },
      '326': { name: 'Florida', code: 'FL' },
      '327': { name: 'Florida', code: 'FL' },
      '328': { name: 'Florida', code: 'FL' },
      '329': { name: 'Florida', code: 'FL' },
      '330': { name: 'Florida', code: 'FL' },
      '331': { name: 'Florida', code: 'FL' },
      '332': { name: 'Florida', code: 'FL' },
      '333': { name: 'Florida', code: 'FL' },
      '334': { name: 'Florida', code: 'FL' },
      '335': { name: 'Florida', code: 'FL' },
      '336': { name: 'Florida', code: 'FL' },
      '337': { name: 'Florida', code: 'FL' },
      '338': { name: 'Florida', code: 'FL' },
      '339': { name: 'Florida', code: 'FL' },
      '341': { name: 'Florida', code: 'FL' },
      '342': { name: 'Florida', code: 'FL' },
      '344': { name: 'Florida', code: 'FL' },
      '346': { name: 'Florida', code: 'FL' },
      '347': { name: 'Florida', code: 'FL' },
      '349': { name: 'Florida', code: 'FL' },
    };
    return stateMap[prefix] || { name: 'California', code: 'CA' }; // Default to CA
  };

  // Fetch latest bills
  useEffect(() => {
    const fetchLatestBills = async () => {
      try {
        const response = await fetch('/api/bills/search-cached?limit=4');
        const data = await response.json();
        if (data.bills) {
          setLatestBills(data.bills);
        }
      } catch (error) {
        console.error('Failed to fetch latest bills:', error);
      }
    };

    fetchLatestBills();
  }, []);

  // Mock state bills data
  const mockStateBills: Record<string, StateBill[]> = {
    'CA': [
      {
        bill_id: 1893344,
        number: 'AB 1',
        title: 'California Immigration Rights Act',
        description: 'Protects rights of immigrants and provides pathways to citizenship',
        status: 1,
        last_action: 'Introduced in Assembly',
        last_action_date: '2025-01-15'
      },
      {
        bill_id: 1893347,
        number: 'AB 3',
        title: 'Climate Action Investment Act',
        description: 'Establishes fund for climate resilience and clean energy investments',
        status: 2,
        last_action: 'Amended in Committee',
        last_action_date: '2025-02-15'
      },
      {
        bill_id: 1893348,
        number: 'SB 2',
        title: 'Healthcare Access for All',
        description: 'Expands healthcare access for undocumented immigrants',
        status: 1,
        last_action: 'Introduced in Senate',
        last_action_date: '2025-01-20'
      },
      {
        bill_id: 1893350,
        number: 'SB 3',
        title: 'Educational Equity Act',
        description: 'Increases funding for schools in underserved communities',
        status: 2,
        last_action: 'Passed Senate Committee',
        last_action_date: '2025-02-05'
      }
    ],
    'NY': [
      {
        bill_id: 1950001,
        number: 'A 100',
        title: 'New York Housing Affordability Act',
        description: 'Creates affordable housing initiatives across the state',
        status: 1,
        last_action: 'Introduced in Assembly',
        last_action_date: '2025-01-10'
      },
      {
        bill_id: 1950002,
        number: 'S 50',
        title: 'Public Transit Modernization Act',
        description: 'Funds upgrades to subway and bus systems',
        status: 2,
        last_action: 'In Committee',
        last_action_date: '2025-02-01'
      },
      {
        bill_id: 1950003,
        number: 'A 200',
        title: 'Criminal Justice Reform Act',
        description: 'Reforms bail and sentencing guidelines',
        status: 1,
        last_action: 'Introduced in Assembly',
        last_action_date: '2025-01-15'
      },
      {
        bill_id: 1950004,
        number: 'S 75',
        title: 'Environmental Protection Act',
        description: 'Strengthens protections for state parks and waterways',
        status: 2,
        last_action: 'Passed Committee',
        last_action_date: '2025-02-10'
      }
    ],
    'TX': [
      {
        bill_id: 2100001,
        number: 'HB 1',
        title: 'Border Security Enhancement Act',
        description: 'Increases funding for border security measures',
        status: 1,
        last_action: 'Introduced in House',
        last_action_date: '2025-01-12'
      },
      {
        bill_id: 2100002,
        number: 'SB 1',
        title: 'Property Tax Relief Act',
        description: 'Provides property tax relief for homeowners',
        status: 2,
        last_action: 'In Committee',
        last_action_date: '2025-02-03'
      },
      {
        bill_id: 2100003,
        number: 'HB 100',
        title: 'Energy Grid Resilience Act',
        description: 'Improves electrical grid reliability',
        status: 1,
        last_action: 'Introduced in House',
        last_action_date: '2025-01-20'
      },
      {
        bill_id: 2100004,
        number: 'SB 50',
        title: 'Education Funding Reform',
        description: 'Restructures public school funding formula',
        status: 2,
        last_action: 'Amended in Committee',
        last_action_date: '2025-02-08'
      }
    ],
    'FL': [
      {
        bill_id: 2080001,
        number: 'H 11',
        title: 'Hurricane Preparedness Act',
        description: 'Enhances disaster preparedness and response systems',
        status: 1,
        last_action: 'Introduced in House',
        last_action_date: '2025-01-08'
      },
      {
        bill_id: 2080002,
        number: 'S 20',
        title: 'Insurance Reform Act',
        description: 'Addresses property insurance crisis',
        status: 2,
        last_action: 'In Committee',
        last_action_date: '2025-02-02'
      },
      {
        bill_id: 2080003,
        number: 'H 50',
        title: 'Environmental Conservation Act',
        description: 'Protects wetlands and coastal areas',
        status: 1,
        last_action: 'Introduced in House',
        last_action_date: '2025-01-18'
      },
      {
        bill_id: 2080004,
        number: 'S 35',
        title: 'Tourism Recovery Act',
        description: 'Supports tourism industry growth',
        status: 2,
        last_action: 'Passed Committee',
        last_action_date: '2025-02-12'
      }
    ]
  };

  // Fetch federal representative images
  useEffect(() => {
    const fetchMemberImages = async () => {
      if (!federalReps || federalReps.length === 0) {
        setFederalRepsWithImages([]);
        return;
      }

      const updatedMembers = await Promise.all(
        federalReps.map(async (rep) => {
          if (rep.bioguideId) {
            try {
              const response = await fetch(`/api/congress/member/${rep.bioguideId}`);
              if (response.ok) {
                const memberData = await response.json();
                return {
                  ...rep,
                  imageUrl: memberData.depiction?.imageUrl,
                  stateCode: rep.stateCode // Preserve stateCode
                };
              }
            } catch (error) {
              console.error(`Failed to fetch image for ${rep.bioguideId}:`, error);
            }
          }
          return { ...rep, imageUrl: undefined };
        })
      );
      setFederalRepsWithImages(updatedMembers);
    };

    fetchMemberImages();
  }, [federalReps]);

  // Set state bills and representatives based on user's zip code
  useEffect(() => {
    const state = getStateFromZip(zipCode || '90210'); // Default to CA zip
    console.log('State detection:', { zipCode, state });
    setUserState(state);

    if (state) {
      // Use mock data instead of API
      const bills = mockStateBills[state.code] || mockStateBills['CA'];
      console.log('State bills loaded:', { stateCode: state.code, billCount: bills.length, bills });
      setStateBills(bills);

      // Set state representatives
      const stateReps = mockStateRepresentatives[state.code] || [];
      setStateReps(stateReps);
    }
  }, [zipCode]);

  // Helper function to convert category to URL slug
  const convertCategoryToSlug = (category: string): string => {
    return category
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Helper function to truncate text to 3 lines (approximately 150 characters)
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Helper functions for representatives
  const getPartyColor = (party: string) => {
    if (party === 'Democrat' || party === 'Democratic' || party === 'D') {
      return 'bg-blue-600';
    } else if (party === 'Republican' || party === 'R') {
      return 'bg-red-600';
    }
    return 'bg-gray-600';
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getPartyAbbreviation = (party: string) => {
    if (party === 'Democrat' || party === 'Democratic') return 'D';
    if (party === 'Republican') return 'R';
    return party.charAt(0).toUpperCase();
  };

  // Representative Card Component
  const RepresentativeCard = ({
    rep,
    type = 'federal',
    isFederal = true
  }: {
    rep: FederalRepresentative | StateRepresentative | LocalRepresentative;
    type?: 'federal' | 'state' | 'local';
    isFederal?: boolean;
  }) => {
    const isState = !isFederal && 'chamber' in rep;
    const isLocal = type === 'local' && 'position' in rep;

    const title = isFederal
      ? ('officeTitle' in rep ? (rep.officeTitle.includes('Senate') ? 'Senator' : `Rep. - District ${rep.districtNumber}`) : '')
      : isLocal
      ? (rep as LocalRepresentative).position
      : (isState ? (rep.chamber === 'Senate' ? 'State Senator' : `State Rep.${rep.district ? ` - District ${rep.district}` : ''}`) : '');

    return (
      <div className="flex-shrink-0 w-[180px]">
        <div className="flex flex-col items-center space-y-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
          <Avatar className="h-20 w-20">
            <AvatarImage src={rep.imageUrl} alt={rep.name} />
            <AvatarFallback className="text-lg">
              {getInitials(rep.name)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center w-full">
            {isFederal && 'bioguideId' in rep && 'stateCode' in rep && rep.stateCode ? (
              <Link href={`/federal/congress/119/states/${rep.stateCode}/${rep.bioguideId}`} className="text-sm font-semibold line-clamp-2 mb-1 hover:underline block">
                {rep.name}
              </Link>
            ) : (
              <p className="text-sm font-semibold line-clamp-2 mb-1">{rep.name}</p>
            )}
            <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
              {title}
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            className="w-full h-8 text-xs bg-white text-black hover:bg-gray-100 border border-gray-200"
            title={`Contact ${rep.name}`}
            asChild={isFederal && 'bioguideId' in rep}
          >
            {isFederal && 'bioguideId' in rep ? (
              <Link href={`/advocacy-message?member=${rep.bioguideId}&congress=119`}>
                Voice Opinion
              </Link>
            ) : (
              <div>Voice Opinion</div>
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Sort federal representatives: Senators first, then House rep
  const sortedFederalReps = [...federalRepsWithImages].sort((a, b) => {
    const aIsSenator = a.officeTitle.includes('Senate');
    const bIsSenator = b.officeTitle.includes('Senate');
    if (aIsSenator && !bIsSenator) return -1;
    if (!aIsSenator && bIsSenator) return 1;
    return 0;
  });

  // Sort state representatives: Senators first, then House reps
  const sortedStateReps = [...stateReps].sort((a, b) => {
    if (a.chamber === 'Senate' && b.chamber === 'House') return -1;
    if (a.chamber === 'House' && b.chamber === 'Senate') return 1;
    return 0;
  });

  if (!newsStories || newsStories.length < 3) {
    return null;
  }

  return (
    <div className="w-full bg-background border-b">
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Column 1: Mission Card or Advocacy Summary - 5 columns */}
          <div className="md:col-span-5">
            {!authLoading && user ? (
              <HomeAdvocacySummary />
            ) : (
              <Card className="h-full border-none shadow-none">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <div className="text-muted-foreground/50 text-sm">Mission Image</div>
                </div>
                <CardContent className="p-0 pt-6">
                  <h2 className="text-xl font-bold mb-4">What is eGutenbergPress?</h2>
                  <p className="text-muted-foreground mb-4">
                    <strong>All-in-One Hub</strong> - Access everything you need for advocacy in one place: messages, updates, campaigns, and insights.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    <strong>Personalized Advocacy</strong> - Verified voter info allows us to autofill your profile and letters with demographic context.
                  </p>
                  <p className="text-muted-foreground mb-6">
                    <strong>Action Oriented</strong> - Support campaigns, explore issues you care about, and compare insights across districts to see how your community stacks up.
                  </p>

                  <div className="flex items-center gap-4">
                    <Button asChild>
                      <Link href="/signup">
                        Get Started
                      </Link>
                    </Button>

                    <Link
                      href="/login"
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                    >
                      Login
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Column 2: Representatives - 4 columns */}
          <div className="md:col-span-4 space-y-6">
            {/* Federal Representatives */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-base font-semibold">My Federal Representatives</h3>
                <Link
                  href={`/federal/congress/119/states/${userState?.code.toLowerCase()}`}
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              <div className="overflow-x-auto pb-3">
                <div className="flex gap-3">
                  {federalLoading || !zipCode ? (
                    <p className="text-sm text-muted-foreground">
                      {!zipCode ? 'Add your zip code to see your representatives' : 'Loading...'}
                    </p>
                  ) : sortedFederalReps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No federal representatives found for your area</p>
                  ) : (
                    sortedFederalReps.map((member, index) => (
                      <RepresentativeCard
                        key={`${member.bioguideId || index}`}
                        rep={member}
                        type="federal"
                        isFederal={true}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Local Representatives - State, City, and School Board */}
            {zipCode && userState && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-base font-semibold">My Local Representatives</h3>
                </div>
                <div className="overflow-x-auto pb-3">
                  <div className="flex gap-3">
                    {/* State Representatives */}
                    {sortedStateReps.map((member, index) => (
                      <RepresentativeCard
                        key={`state-${index}`}
                        rep={member}
                        type="state"
                        isFederal={false}
                      />
                    ))}

                    {/* City Council */}
                    {mockCityCouncil.map((member, index) => (
                      <RepresentativeCard
                        key={`city-${index}`}
                        rep={member}
                        type="local"
                        isFederal={false}
                      />
                    ))}

                    {/* School Board */}
                    {mockSchoolBoard.map((member, index) => (
                      <RepresentativeCard
                        key={`school-${index}`}
                        rep={member}
                        type="local"
                        isFederal={false}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Recent Campaigns and Latest Bills - 3 columns */}
          <div className="md:col-span-3">
            <div className="h-full space-y-6">
              {/* Recent Campaigns */}
              <div>
                <h3 className="text-lg font-bold mb-4">
                  <Link
                    href="/organizations"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    Take Action Together
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </h3>
                <ul className="space-y-2 list-disc list-inside">
                  {allCampaigns.map((campaign, index) => {
                    const isSupport = campaign.position === 'Support';

                    return (
                      <li key={campaign.id} className="text-sm text-muted-foreground">
                        <Link
                          href={`/campaigns/${campaign.groupSlug}/${campaign.bill.type.toLowerCase().replace('.', '')}-${campaign.bill.number}`}
                          className="hover:text-foreground transition-colors"
                        >
                          <span className="ml-[-5px]">
                            <span className="font-medium">{campaign.groupName}</span>{' '}
                            <span className={isSupport ? 'text-green-700' : 'text-red-700'}>
                              {campaign.position.toLowerCase()}s
                            </span>{' '}
                            {campaign.bill.type} {campaign.bill.number}: {truncateText(campaign.bill.title || '', 60)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                  {/* Candidate Campaign as 4th item */}
                  <li className="text-sm text-muted-foreground">
                    <Link
                      href={`/campaigns/${candidateCampaign.groupSlug}/candidate-${candidateCampaign.bill.number}`}
                      className="hover:text-foreground transition-colors"
                    >
                      <span className="ml-[-5px]">
                        <span className="font-medium">{candidateCampaign.groupName}</span>{' '}
                        <span className="text-green-700">
                          {candidateCampaign.position.toLowerCase()}s
                        </span>{' '}
                        {candidateCampaign.bill.title}
                      </span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Latest Bills */}
              <div>
                <h3 className="text-lg font-bold mb-4">Act Before the Vote</h3>
                <ul className="space-y-2 list-disc list-inside">
                  {latestBills.map((bill, index) => (
                    <li key={`${bill.type}-${bill.number}-${index}`} className="text-sm text-muted-foreground">
                      <Link
                        href={bill.url}
                        className="hover:text-foreground transition-colors"
                      >
                        <span className="ml-[-5px]">
                          <span className="font-medium">{bill.type} {bill.number}</span>: {truncateText(bill.title, 80)}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {latestBills.length === 0 && (
                    <li className="text-sm text-muted-foreground/50">Loading latest bills...</li>
                  )}
                </ul>
              </div>

              {/* State Bills */}
              {userState && (
                <div>
                  <h3 className="text-lg font-bold mb-4">Important bills in {userState.name}</h3>
                  <ul className="space-y-2 list-disc list-inside">
                    {stateBills.map((bill) => (
                      <li key={bill.bill_id} className="text-sm text-muted-foreground">
                        <Link
                          href={`/state/${userState.code.toLowerCase()}/bill/${bill.number.replace(/\s/g, '')}`}
                          className="hover:text-foreground transition-colors"
                        >
                          <span className="ml-[-5px]">
                            <span className="font-medium">{bill.number}</span>: {truncateText(bill.title, 80)}
                          </span>
                        </Link>
                      </li>
                    ))}
                    {stateBills.length === 0 && (
                      <li className="text-sm text-muted-foreground/50">Loading state bills...</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}