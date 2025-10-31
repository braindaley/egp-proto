'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useMembersByZip } from '@/hooks/useMembersByZip';
import { useZipCode } from '@/hooks/use-zip-code';

interface FederalRepresentative {
  name: string;
  party: string;
  officeTitle: string;
  districtNumber?: number;
  bioguideId?: string;
  imageUrl?: string;
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

export function HomeRepresentativesSection() {
  const { zipCode } = useZipCode();
  const { representatives: federalReps, isLoading: federalLoading } = useMembersByZip(zipCode);
  const [federalRepsWithImages, setFederalRepsWithImages] = useState<FederalRepresentative[]>([]);
  const [stateReps, setStateReps] = useState<StateRepresentative[]>([]);
  const [userState, setUserState] = useState<{ name: string; code: string } | null>(null);

  // Get state from zip code
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
      '105': { name: 'New York', code: 'NY' },
      '106': { name: 'New York', code: 'NY' },
      '107': { name: 'New York', code: 'NY' },
      '108': { name: 'New York', code: 'NY' },
      '109': { name: 'New York', code: 'NY' },
      '110': { name: 'New York', code: 'NY' },
      '111': { name: 'New York', code: 'NY' },
      '112': { name: 'New York', code: 'NY' },
      '113': { name: 'New York', code: 'NY' },
      '114': { name: 'New York', code: 'NY' },
      '115': { name: 'New York', code: 'NY' },
      '116': { name: 'New York', code: 'NY' },
      '117': { name: 'New York', code: 'NY' },
      '118': { name: 'New York', code: 'NY' },
      '119': { name: 'New York', code: 'NY' },
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
      '349': { name: 'Florida', code: 'FL' }
    };
    return stateMap[prefix] || { name: 'California', code: 'CA' }; // Default to CA
  };

  // Fetch federal representative images with caching
  useEffect(() => {
    const fetchMemberImages = async () => {
      if (!federalReps || federalReps.length === 0) {
        setFederalRepsWithImages([]);
        return;
      }

      const updatedMembers = await Promise.all(
        federalReps.map(async (rep) => {
          if (rep.bioguideId) {
            // Check cache first
            const cacheKey = `member_image_${rep.bioguideId}`;
            const cached = localStorage.getItem(cacheKey);

            if (cached) {
              try {
                const { imageUrl, timestamp } = JSON.parse(cached);
                const isExpired = Date.now() - timestamp > 1000 * 60 * 60 * 24; // 24 hours

                if (!isExpired) {
                  return { ...rep, imageUrl };
                }
              } catch (error) {
                console.error(`Failed to parse cache for ${rep.bioguideId}:`, error);
              }
            }

            // Fetch from API
            try {
              const response = await fetch(`/api/congress/member/${rep.bioguideId}`);
              if (response.ok) {
                const memberData = await response.json();
                const imageUrl = memberData.depiction?.imageUrl;

                // Cache the result
                if (imageUrl) {
                  try {
                    localStorage.setItem(cacheKey, JSON.stringify({
                      imageUrl,
                      timestamp: Date.now()
                    }));
                  } catch (error) {
                    console.error(`Failed to cache image for ${rep.bioguideId}:`, error);
                  }
                }

                return {
                  ...rep,
                  imageUrl
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

  // Set state representatives based on user's zip code
  useEffect(() => {
    const state = getStateFromZip(zipCode || '90210'); // Default to CA zip
    setUserState(state);

    if (state) {
      const stateReps = mockStateRepresentatives[state.code] || [];
      setStateReps(stateReps);
    }
  }, [zipCode]);

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

  const SkeletonCard = () => (
    <div className="flex-shrink-0 w-[180px]">
      <div className="flex flex-col items-center space-y-3 p-4 rounded-lg border bg-card">
        <div className="h-20 w-20 rounded-full bg-gray-200 animate-pulse" />
        <div className="text-center w-full space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mx-auto" />
        </div>
        <div className="w-full h-8 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );

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
            <p className="text-sm font-semibold line-clamp-2 mb-1">{rep.name}</p>
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

  if (!zipCode) {
    return null;
  }

  // Sort federal representatives: Senators first, then House rep
  const sortedFederalReps = [...federalRepsWithImages].sort((a, b) => {
    const aIsSenator = a.officeTitle.includes('Senate');
    const bIsSenator = b.officeTitle.includes('Senate');
    if (aIsSenator && !bIsSenator) return -1;
    if (!aIsSenator && bIsSenator) return 1;
    return 0;
  });


  return (
    <div className="w-full bg-background border-b">
      <div className="max-w-[1280px] mx-auto px-4 py-8 space-y-8">
        {/* Federal Representatives */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">My Federal Representatives</h2>
            <Link
              href={`/federal/congress/119/states/${userState?.code.toLowerCase()}`}
              className="text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4">
              {federalLoading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
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

        {/* State Representatives */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">My State Representatives</h2>
          </div>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4">
              {stateReps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No state representatives found for your area</p>
              ) : (
                stateReps.map((member, index) => (
                  <RepresentativeCard
                    key={`state-${index}`}
                    rep={member}
                    type="state"
                    isFederal={false}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Local Elected Officials */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">My Local Elected Officials</h2>
          </div>
          <Button asChild variant="default">
            <Link href="/elected-officials">
              View Local Elected Officials
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}