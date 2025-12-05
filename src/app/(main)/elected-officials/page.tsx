'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ExternalLink, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useZipCode } from '@/hooks/use-zip-code';
import { useMembersByZip } from '@/hooks/useMembersByZip';
import { usePremiumAccess } from '@/hooks/use-premium-access';
import { PremiumUpgradeCTA } from '@/components/premium-upgrade-cta';

export const dynamic = 'force-dynamic';

// Types for Federal representatives from Congress API
interface FederalRepresentative {
  name: string;
  party: string;
  officeTitle: string;
  districtNumber?: number;
  bioguideId?: string;
  imageUrl?: string;
  state?: string;
}

// Types for Ballot Ready officials
interface BallotReadyPerson {
  fullName: string;
  firstName?: string;
  lastName?: string;
  contacts: { email?: string; phone?: string }[];
  urls: { url: string; type?: string }[];
  headshot?: { thumbnailUrl?: string };
}

interface BallotReadyOfficeHolder {
  id: string;
  isCurrent: boolean;
  officeTitle?: string;
  person?: BallotReadyPerson;
  position: {
    name: string;
    level: 'FEDERAL' | 'STATE' | 'REGIONAL' | 'COUNTY' | 'CITY' | 'LOCAL';
    description?: string;
    state?: string;
  };
  parties: { name: string; shortName?: string }[];
}

interface GroupedOfficeHolders {
  federal: BallotReadyOfficeHolder[];
  state: BallotReadyOfficeHolder[];
  regional: BallotReadyOfficeHolder[];
  county: BallotReadyOfficeHolder[];
  city: BallotReadyOfficeHolder[];
  local: BallotReadyOfficeHolder[];
}

// Helper to get initials from name
function getInitials(name: string): string {
  const parts = name.split(' ').filter(p => p.length > 0);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Helper to get state code from zip
function getStateFromZip(zip: string): string {
  if (!zip) return 'CA';
  const prefix = zip.substring(0, 3);
  const stateMap: Record<string, string> = {
    '900': 'CA', '901': 'CA', '902': 'CA', '903': 'CA', '904': 'CA',
    '905': 'CA', '906': 'CA', '907': 'CA', '908': 'CA', '910': 'CA',
    '911': 'CA', '912': 'CA', '913': 'CA', '914': 'CA', '915': 'CA',
    '916': 'CA', '917': 'CA', '918': 'CA', '919': 'CA', '920': 'CA',
    '921': 'CA', '922': 'CA', '923': 'CA', '924': 'CA', '925': 'CA',
    '926': 'CA', '927': 'CA', '928': 'CA', '930': 'CA', '931': 'CA',
    '932': 'CA', '933': 'CA', '934': 'CA', '935': 'CA', '936': 'CA',
    '937': 'CA', '938': 'CA', '939': 'CA', '940': 'CA', '941': 'CA',
    '942': 'CA', '943': 'CA', '944': 'CA', '945': 'CA', '946': 'CA',
    '947': 'CA', '948': 'CA', '949': 'CA', '950': 'CA', '951': 'CA',
    '952': 'CA', '953': 'CA', '954': 'CA', '955': 'CA', '956': 'CA',
    '957': 'CA', '958': 'CA', '959': 'CA', '960': 'CA', '961': 'CA',
    '100': 'NY', '101': 'NY', '102': 'NY', '103': 'NY', '104': 'NY',
    '105': 'NY', '106': 'NY', '107': 'NY', '108': 'NY', '109': 'NY',
    '110': 'NY', '111': 'NY', '112': 'NY', '113': 'NY', '114': 'NY',
    '115': 'NY', '116': 'NY', '117': 'NY', '118': 'NY', '119': 'NY',
    '750': 'TX', '751': 'TX', '752': 'TX', '753': 'TX', '754': 'TX',
    '755': 'TX', '756': 'TX', '757': 'TX', '758': 'TX', '759': 'TX',
    '760': 'TX', '761': 'TX', '762': 'TX', '763': 'TX', '764': 'TX',
    '765': 'TX', '766': 'TX', '767': 'TX', '768': 'TX', '769': 'TX',
    '770': 'TX', '771': 'TX', '772': 'TX', '773': 'TX', '774': 'TX',
    '775': 'TX', '776': 'TX', '777': 'TX', '778': 'TX', '779': 'TX',
    '780': 'TX', '781': 'TX', '782': 'TX', '783': 'TX', '784': 'TX',
    '785': 'TX', '786': 'TX', '787': 'TX', '788': 'TX', '789': 'TX',
    '790': 'TX', '791': 'TX', '792': 'TX', '793': 'TX', '794': 'TX',
    '795': 'TX', '796': 'TX', '797': 'TX', '798': 'TX', '799': 'TX',
    '320': 'FL', '321': 'FL', '322': 'FL', '323': 'FL', '324': 'FL',
    '325': 'FL', '326': 'FL', '327': 'FL', '328': 'FL', '329': 'FL',
    '330': 'FL', '331': 'FL', '332': 'FL', '333': 'FL', '334': 'FL',
    '335': 'FL', '336': 'FL', '337': 'FL', '338': 'FL', '339': 'FL',
    '341': 'FL', '342': 'FL', '344': 'FL', '346': 'FL', '347': 'FL', '349': 'FL'
  };
  return stateMap[prefix] || 'CA';
}

// Skeleton loading card
function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[180px]">
      <div className="flex flex-col items-center p-4 rounded-lg border bg-card h-full">
        <div className="h-20 w-20 rounded-full bg-gray-200 animate-pulse mb-3" />
        <div className="text-center w-full space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mx-auto" />
        </div>
        <div className="w-full h-8 bg-gray-200 rounded animate-pulse mt-auto" />
      </div>
    </div>
  );
}

// Federal Representative Card (uses Congress API data)
function FederalRepCard({ rep, stateCode }: { rep: FederalRepresentative; stateCode: string }) {
  const title = rep.officeTitle.includes('Senate')
    ? 'Senator'
    : `Representative${rep.districtNumber ? ` - District ${rep.districtNumber}` : ''}`;

  return (
    <div className="flex-shrink-0 w-[180px]">
      <div className="flex flex-col items-center p-4 rounded-lg border bg-card hover:shadow-md transition-shadow h-full">
        <Link
          href={`/federal/congress/119/states/${stateCode.toLowerCase()}/${rep.bioguideId}`}
          className="flex flex-col items-center flex-1"
        >
          <Avatar className="h-20 w-20 mb-3">
            <AvatarImage src={rep.imageUrl} alt={rep.name} />
            <AvatarFallback className="text-lg bg-blue-100 text-blue-700">
              {getInitials(rep.name)}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-semibold text-center line-clamp-2 mb-1">{rep.name}</p>
          <p className="text-xs text-muted-foreground text-center flex-1">
            {title}
          </p>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-auto"
          asChild
        >
          <Link href={`/advocacy-message?member=${rep.bioguideId}&congress=119`}>
            Send Message
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Ballot Ready Official Card (for state, county, city, local)
function OfficialCard({ official }: { official: BallotReadyOfficeHolder }) {
  const { person, position, parties } = official;

  if (!person) return null;

  const title = official.officeTitle || position.name;
  const headshotUrl = person.headshot?.thumbnailUrl;

  // Get avatar background color based on level
  const levelColors: Record<string, string> = {
    STATE: 'bg-green-100 text-green-700',
    REGIONAL: 'bg-teal-100 text-teal-700',
    COUNTY: 'bg-purple-100 text-purple-700',
    CITY: 'bg-indigo-100 text-indigo-700',
    LOCAL: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="flex-shrink-0 w-[180px]">
      <div className="flex flex-col items-center p-4 rounded-lg border bg-card hover:shadow-md transition-shadow h-full">
        <Link href={`/elected-officials/${official.id}`} className="flex flex-col items-center flex-1">
          <Avatar className="h-20 w-20 mb-3">
            {headshotUrl && (
              <AvatarImage src={headshotUrl} alt={person.fullName} />
            )}
            <AvatarFallback className={`text-lg ${levelColors[position.level] || 'bg-gray-100 text-gray-700'}`}>
              {getInitials(person.fullName)}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-semibold text-center line-clamp-2 mb-1">{person.fullName}</p>
          <p className="text-xs text-muted-foreground text-center flex-1">
            {title}
          </p>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-auto"
          asChild
        >
          <Link href={`/advocacy-message?officialName=${encodeURIComponent(person.fullName)}&position=${encodeURIComponent(title)}`}>
            Send Message
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Section component with horizontal scrolling
function OfficialSection({
  title,
  children,
  loading = false,
  count = 0,
  linkHref,
  linkText
}: {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  count?: number;
  linkHref?: string;
  linkText?: string;
}) {
  if (!loading && count === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          {count > 0 && (
            <span className="text-sm text-muted-foreground">({count})</span>
          )}
        </div>
        {linkHref && (
          <Link
            href={linkHref}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            {linkText || 'View All'}
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 items-stretch">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

export default function ElectedOfficialsPage() {
  const { user, isInitialLoadComplete } = useAuth();
  const { zipCode: savedZipCode } = useZipCode();
  const { isPremium, isLoading: premiumLoading } = usePremiumAccess();
  const zipToUse = user?.zipCode || savedZipCode || '';
  const stateCode = getStateFromZip(zipToUse);

  // Federal representatives from Congress API
  const { representatives: federalReps, isLoading: federalLoading } = useMembersByZip(zipToUse);
  const [federalRepsWithImages, setFederalRepsWithImages] = useState<FederalRepresentative[]>([]);

  // Ballot Ready officials for non-federal levels
  const [ballotReadyOfficials, setBallotReadyOfficials] = useState<GroupedOfficeHolders | null>(null);
  const [ballotReadyLoading, setBallotReadyLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track what location we last fetched with, so we can re-fetch if full address becomes available
  const lastFetchedLocationRef = useRef<string | null>(null);

  // Fetch federal representative images with caching
  useEffect(() => {
    const fetchMemberImages = async () => {
      // Skip if not premium to avoid unnecessary API calls
      if (!isPremium || !federalReps || federalReps.length === 0) {
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
              } catch (e) {
                // Cache parse error, fetch fresh
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
                  } catch (e) {
                    // Cache storage error
                  }
                }

                return { ...rep, imageUrl };
              }
            } catch (e) {
              // Fetch error
            }
          }
          return { ...rep, imageUrl: undefined };
        })
      );
      setFederalRepsWithImages(updatedMembers);
    };

    fetchMemberImages();
  }, [federalReps, isPremium]);

  // Build full address for more accurate BallotReady lookup
  const fullAddress = user?.address && user?.city && user?.state && user?.zipCode
    ? `${user.address}, ${user.city}, ${user.state} ${user.zipCode}`
    : null;


  // Fetch Ballot Ready officials for non-federal levels
  // Using full address is more accurate than ZIP code for district matching
  useEffect(() => {
    // Skip if not premium to avoid unnecessary API calls
    if (!isPremium) {
      setBallotReadyLoading(false);
      return;
    }

    // Wait for auth to complete before deciding we only have ZIP
    // This prevents fetching with ZIP when the user might have a full address
    if (!isInitialLoadComplete && !fullAddress) {
      return;
    }

    // Determine the best location to use (prefer full address for accuracy)
    const locationToUse = fullAddress || (zipToUse ? `zip:${zipToUse}` : null);

    // Don't fetch if we don't have any location
    if (!locationToUse) {
      setBallotReadyLoading(false);
      return;
    }

    // Skip if we already fetched with this exact location
    // But always re-fetch if we now have a full address and previously only had ZIP
    const previouslyUsedZipOnly = lastFetchedLocationRef.current?.startsWith('zip:');
    const nowHaveFullAddress = fullAddress && !locationToUse.startsWith('zip:');
    const shouldRefetchWithAddress = previouslyUsedZipOnly && nowHaveFullAddress;

    if (lastFetchedLocationRef.current === locationToUse && !shouldRefetchWithAddress) {
      return;
    }

    const fetchBallotReadyOfficials = async () => {
      lastFetchedLocationRef.current = locationToUse;
      setBallotReadyLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        // Prefer full address for more accurate district matching
        if (fullAddress) {
          params.append('address', fullAddress);
        } else {
          params.append('zip', zipToUse);
        }
        // Note: no limit - API will paginate to fetch ALL officials including city council, mayor, etc.

        const response = await fetch(`/api/ballot-officials?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to fetch elected officials');
          setBallotReadyOfficials(null);
        } else {
          setBallotReadyOfficials(data.byLevel);
        }
      } catch (err) {
        setError('Failed to fetch elected officials');
        setBallotReadyOfficials(null);
      } finally {
        setBallotReadyLoading(false);
      }
    };

    fetchBallotReadyOfficials();
  }, [zipToUse, fullAddress, isInitialLoadComplete, isPremium]);

  // Sort federal representatives: Senators first, then House rep
  const sortedFederalReps = [...federalRepsWithImages].sort((a, b) => {
    const aIsSenator = a.officeTitle.includes('Senate');
    const bIsSenator = b.officeTitle.includes('Senate');
    if (aIsSenator && !bIsSenator) return -1;
    if (!aIsSenator && bIsSenator) return 1;
    return 0;
  });

  // Show premium upgrade CTA for non-premium users
  if (!premiumLoading && !isPremium) {
    return (
      <PremiumUpgradeCTA
        variant="full-page"
        title="All Elected Officials"
        description="Access all your elected officials at every level of government with a premium membership."
      />
    );
  }

  // Show loading if we don't have zip code yet
  if (!zipToUse) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="max-w-[1280px] mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-2">
              Your Elected Officials
            </h1>
            <p className="text-muted-foreground">
              Find your representatives at all levels of government
            </p>
          </header>
          <div className="bg-card rounded-lg border p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Please update your profile with your ZIP code to see your elected officials.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/profile">Update Profile</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-2">
            Your Elected Officials
          </h1>
          <p className="text-muted-foreground">
            Showing representatives for {fullAddress ? (
              <span className="font-medium">{user?.city}, {user?.state} {user?.zipCode}</span>
            ) : (
              <>ZIP code <span className="font-medium">{zipToUse}</span></>
            )}
          </p>
        </header>

        {error && (
          <div className="mb-6 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Federal Representatives - from Congress API */}
        <OfficialSection
          title="Federal Representatives"
          loading={federalLoading}
          count={sortedFederalReps.length}
          linkHref={`/federal/congress/119/states/${stateCode.toLowerCase()}`}
          linkText="View All Federal"
        >
          {sortedFederalReps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No federal representatives found for your area</p>
          ) : (
            sortedFederalReps.map((rep, index) => (
              <FederalRepCard
                key={rep.bioguideId || index}
                rep={rep}
                stateCode={stateCode}
              />
            ))
          )}
        </OfficialSection>

        {/* State Officials - from Ballot Ready */}
        <OfficialSection
          title="State Officials"
          loading={ballotReadyLoading}
          count={ballotReadyOfficials?.state.length || 0}
        >
          {ballotReadyOfficials?.state.map((official) => (
            <OfficialCard key={official.id} official={official} />
          ))}
        </OfficialSection>

        {/* Regional Officials - from Ballot Ready */}
        <OfficialSection
          title="Regional Officials"
          loading={ballotReadyLoading}
          count={ballotReadyOfficials?.regional.length || 0}
        >
          {ballotReadyOfficials?.regional.map((official) => (
            <OfficialCard key={official.id} official={official} />
          ))}
        </OfficialSection>

        {/* County Officials - from Ballot Ready */}
        <OfficialSection
          title="County Officials"
          loading={ballotReadyLoading}
          count={ballotReadyOfficials?.county.length || 0}
        >
          {ballotReadyOfficials?.county.map((official) => (
            <OfficialCard key={official.id} official={official} />
          ))}
        </OfficialSection>

        {/* City Officials - from Ballot Ready */}
        <OfficialSection
          title="City Officials"
          loading={ballotReadyLoading}
          count={ballotReadyOfficials?.city.length || 0}
        >
          {ballotReadyOfficials?.city.map((official) => (
            <OfficialCard key={official.id} official={official} />
          ))}
        </OfficialSection>

        {/* Local Officials - from Ballot Ready */}
        <OfficialSection
          title="Local Officials"
          loading={ballotReadyLoading}
          count={ballotReadyOfficials?.local.length || 0}
        >
          {ballotReadyOfficials?.local.map((official) => (
            <OfficialCard key={official.id} official={official} />
          ))}
        </OfficialSection>
      </div>
    </div>
  );
}
