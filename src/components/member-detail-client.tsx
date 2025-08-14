
'use client';

import { useState, useEffect } from 'react';
import type { Member, MemberTerm, Leadership, PartyHistory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { ExternalLink, User, Star, History, Info, ChevronsUpDown, MapPin, X, BarChart3, Building2, Phone, Hash } from 'lucide-react';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getBillTypeSlug, formatDate, constructBillUrl } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BillTracker } from '@/components/bill-tracker';
import { BillAmendments } from './bill-amendments';
import { SummaryDisplay } from './bill-summary-display';
import { SocialMediaLinks } from './social-media-links';
import { DistrictOffices } from './district-offices';
import { CommitteeAssignmentsCard } from './committee-assignments-card';
import { CampaignPromisesCard } from './campaign-promises-card';
import { LegislativeActivityCard } from './legislative-activity-card';
import { NewsCard } from './news-card';
import { CampaignFinanceCard } from './campaign-finance-card';
import { useZipCode } from '@/hooks/use-zip-code';
import { useMembersByZip } from '@/hooks/useMembersByZip';
import { Separator } from './ui/separator';

// --- Name Matching Function ---
function areNamesSimilar(nameA: string, nameB: string): boolean {
    const normalize = (name: string) => name.toLowerCase().replace(/[.,']/g, '').replace(/\s+/g, ' ').trim();
    const normA = normalize(nameA);
    const normB = normalize(nameB);
    if (normA === normB) return true;
    const parseName = (name: string): { first: string, last: string, middle: string[] } => {
        if (name.includes(',')) {
            const parts = name.split(',');
            const lastName = parts[0].trim();
            const firstMiddle = parts.slice(1).join(' ').trim().split(' ');
            const firstName = firstMiddle[0];
            const middleNames = firstMiddle.slice(1);
            return { first: firstName, last: lastName, middle: middleNames };
        } else {
            const parts = name.split(' ');
            const firstName = parts[0];
            const lastName = parts[parts.length - 1];
            const middleNames = parts.slice(1, -1);
            return { first: firstName, last: lastName, middle: middleNames };
        }
    };
    const parsedA = parseName(normA);
    const parsedB = parseName(normB);
    if (parsedA.last !== parsedB.last) return false;
    const firstA = parsedA.first;
    const firstB = parsedB.first;
    return firstA === firstB || firstA.startsWith(firstB[0]) || firstB.startsWith(firstA[0]);
}

// --- Helper Functions ---
function calculateYearsOfService(firstTerm?: MemberTerm) { if (!firstTerm) return 0; return new Date().getFullYear() - firstTerm.startYear; }
function isCurrentlyServing(member: Member) {
    if (member.deathDate) return false;
    let termsArray = Array.isArray(member.terms) ? member.terms : (member.terms?.item || []);
    if (termsArray.length === 0) return false;
    const currentYear = new Date().getFullYear();
    return termsArray.some(term => term.startYear <= currentYear && (!term.endYear || term.endYear > currentYear));
}
function getFirstTerm(terms: any): MemberTerm | undefined {
    let termsArray = Array.isArray(terms) ? terms : (terms?.item || []);
    if (termsArray.length === 0) return undefined;
    return [...termsArray].sort((a, b) => a.startYear - b.startYear)[0];
}

type MatchStatus = 'idle' | 'isMatch' | 'isNotMatch' | 'loading';

export function MemberDetailClient({ initialMember, congress }: { initialMember: Member, congress: string }) {
  
  const [member] = useState<Member>(initialMember);
  const { zipCode } = useZipCode();
  const { representatives, isLoading: isLoadingReps } = useMembersByZip(zipCode);
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('idle');
  const [censusData, setCensusData] = useState<any>(null);
  const [censusLoading, setCensusLoading] = useState(false);
  const [districtCensusData, setDistrictCensusData] = useState<any>(null);
  const [districtCensusLoading, setDistrictCensusLoading] = useState(false);

  useEffect(() => {
    if (isLoadingReps) {
      setMatchStatus('loading');
      return;
    }
    if (!zipCode) {
      setMatchStatus('idle');
      return;
    }
    if (zipCode && !isLoadingReps) {
      const isMatch = representatives.some((rep) => areNamesSimilar(rep.name, member.directOrderName));
      setMatchStatus(isMatch ? 'isMatch' : 'isNotMatch');
    }
  }, [zipCode, representatives, member.directOrderName, isLoadingReps]);

  useEffect(() => {
    const fetchCensusData = async () => {
      setCensusLoading(true);
      try {
        const response = await fetch(`/api/census/state-level?state=${encodeURIComponent(member.state)}`);
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          setCensusData(data.data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch census data:', error);
      } finally {
        setCensusLoading(false);
      }
    };

    fetchCensusData();
  }, [member.state]);

  useEffect(() => {
    const fetchDistrictCensusData = async () => {
      if (!member.district) return; // Only fetch for House members with districts
      
      setDistrictCensusLoading(true);
      try {
        const response = await fetch(
          `/api/census/congressional-district?state=${encodeURIComponent(member.state)}&district=${encodeURIComponent(member.district)}`
        );
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          setDistrictCensusData(data.data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch district census data:', error);
      } finally {
        setDistrictCensusLoading(false);
      }
    };

    fetchDistrictCensusData();
  }, [member.state, member.district]);

  const termsData = Array.isArray(member.terms) ? member.terms : (member.terms?.item || []);
  const allTerms = [...termsData].sort((a, b) => b.startYear - a.startYear);
  const firstTerm = getFirstTerm(member.terms);
  const yearsOfService = calculateYearsOfService(firstTerm);
  const leadershipHistory = (member.leadership || []).sort((a, b) => b.congress - a.congress);
  const currentlyServing = isCurrentlyServing(member);
  const currentTermInfo = allTerms[0];
  const chamberName = currentTermInfo?.chamber === 'House of Representatives' ? 'House' : currentTermInfo?.chamber;

  return (
    <>
      <header className="mb-8">
        <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden border-2 border-gray-200 flex-shrink-0">
                <Image
                src={member.depiction?.imageUrl || 'https://placehold.co/300x300.png'}
                alt={`Official photo of ${member.name}`}
                fill
                sizes="(max-width: 768px) 128px, 160px"
                className="object-cover"
                />
            </div>
            <div className="flex-1">
                <p className="text-lg text-muted-foreground font-medium mb-1">{member.honorificName}</p>
                <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
                    {member.directOrderName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    {matchStatus === 'isMatch' && (
                        <Badge variant="outline" className="text-base bg-green-100 text-green-800 border-green-200">
                           Your Representative
                        </Badge>
                    )}
                    {matchStatus === 'loading' && (
                        <Badge variant="outline" className="text-base bg-blue-100 text-blue-800 border-blue-200">
                           Checking...
                        </Badge>
                    )}
                    {!zipCode && matchStatus === 'idle' && (
                        <Badge variant="outline" className="text-xs text-muted-foreground cursor-help" title="Set your ZIP code to see if this is your representative">
                           Set ZIP to see if this is your rep
                        </Badge>
                    )}
                    <Badge variant={member.partyName === 'Republican' ? 'destructive' : member.partyName === 'Democratic' ? 'default' : 'secondary'} className="text-base">
                        {member.partyName}
                    </Badge>
                    {chamberName && ( <Badge variant="outline" className="text-base">{chamberName}</Badge> )}
                    <Badge variant="outline" className="text-base">{member.state} {member.district ? ` - District ${member.district}` : ''}</Badge>
                    {currentlyServing && (
                        <Badge variant="outline" className="text-base bg-green-100 text-green-800 border-green-200">Currently Serving</Badge>
                    )}
                </div>
            </div>
        </div>
      </header>

      {/* --- Rest of the component --- */}
      <div className="space-y-8">
        <Card>
          <CardHeader> <CardTitle className="flex items-center gap-2"><User /> Basic Info</CardTitle> </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-muted-foreground">Full Name</h4>
                <p>{member.directOrderName}</p>
              </div>
              {member.birthYear && (
                 <div>
                   <h4 className="font-semibold text-muted-foreground">Born</h4>
                   <p>{member.birthYear} (Age: {new Date().getFullYear() - parseInt(member.birthYear)})</p>
                 </div>
              )}
               {firstTerm && (
                  <div>
                    <h4 className="font-semibold text-muted-foreground">First Term</h4>
                    <p>{firstTerm.startYear}</p>
                  </div>
              )}
              {yearsOfService > 0 && (
                 <div>
                   <h4 className="font-semibold text-muted-foreground">Years of Service</h4>
                   <p>{yearsOfService}</p>
                 </div>
              )}
            </div>
             <Separator />
             <div className="space-y-2">
                {member.officialWebsiteUrl && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <a href={member.officialWebsiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Official Website</a>
                    </div>
                )}
                 {member.addressInformation && (
                   <div className="flex items-start gap-2">
                     <Building2 className="h-4 w-4 text-muted-foreground" />
                     <p>{member.addressInformation.officeAddress}</p>
                   </div>
                 )}
                  {member.addressInformation?.phoneNumber && (
                   <div className="flex items-start gap-2">
                     <Phone className="h-4 w-4 text-muted-foreground" />
                     <p>{member.addressInformation.phoneNumber}</p>
                   </div>
                 )}
             </div>
             <SocialMediaLinks bioguideId={member.bioguideId} />
             <DistrictOffices bioguideId={member.bioguideId} />
              {member.extendedIds && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Hash className="h-4 w-4" /> Other Identifiers
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                    {Object.entries(member.extendedIds).map(([key, value]) => {
                      if (!value || (Array.isArray(value) && value.length === 0)) return null;
                      
                      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                      return (
                        <div key={key} className="truncate">
                          <span className="font-medium text-foreground">{label}: </span>
                          <span className="text-muted-foreground">
                            {Array.isArray(value) ? value.join(', ') : value}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <CampaignFinanceCard member={member} congress={congress} state={member.state.toLowerCase()} bioguideId={member.bioguideId} />
        <NewsCard bioguideId={member.bioguideId} />
        <LegislativeActivityCard member={member} />
        <CommitteeAssignmentsCard member={member} congress={congress} />
        <CampaignPromisesCard member={member} congress={congress} />
        {allTerms.length > 0 && (
          <Card>
            <CardHeader> <CardTitle className="flex items-center gap-2"><History /> Service History</CardTitle> </CardHeader>
            <CardContent>
                {/* ... content remains the same ... */}
            </CardContent>
          </Card>
        )}
        {member.district && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin />
                Congressional District {member.district} Data for {member.state}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {districtCensusLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : districtCensusData ? (
                <div className="space-y-4">
                  {/* District Info */}
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">District Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Name:</p>
                        <p className="font-medium">{districtCensusData.NAME}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">GEOID:</p>
                        <p className="font-medium">{districtCensusData.GEOID}</p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  {/* Population */}
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">Population</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total:</p>
                        <p className="font-medium">{parseInt(districtCensusData.total_pop || '0').toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Female:</p>
                        <p className="font-medium">{parseFloat(districtCensusData.pct_female || '0').toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Male:</p>
                        <p className="font-medium">{parseFloat(districtCensusData.pct_male || '0').toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  {/* Race/Ethnicity */}
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">Race & Ethnicity</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                      <div><p className="text-muted-foreground">White:</p><p className="font-medium">{parseFloat(districtCensusData.pct_white || '0').toFixed(1)}%</p></div>
                      <div><p className="text-muted-foreground">Black:</p><p className="font-medium">{parseFloat(districtCensusData.pct_black || '0').toFixed(1)}%</p></div>
                      <div><p className="text-muted-foreground">Asian:</p><p className="font-medium">{parseFloat(districtCensusData.pct_asian || '0').toFixed(1)}%</p></div>
                      <div><p className="text-muted-foreground">American Indian:</p><p className="font-medium">{parseFloat(districtCensusData.pct_am_indian || '0').toFixed(1)}%</p></div>
                      <div><p className="text-muted-foreground">Pacific Islander:</p><p className="font-medium">{parseFloat(districtCensusData.pct_pacificI || '0').toFixed(1)}%</p></div>
                      <div><p className="text-muted-foreground">2+ Races:</p><p className="font-medium">{parseFloat(districtCensusData.pct_two_or_more || '0').toFixed(1)}%</p></div>
                    </div>
                  </div>
                  <Separator />
                  {/* Education */}
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">Education</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                      <div><p className="text-muted-foreground">High School or Higher:</p><p className="font-medium">{parseFloat(districtCensusData.pct_hs_or_higher || '0').toFixed(1)}%</p></div>
                      <div><p className="text-muted-foreground">Bachelor's or Higher:</p><p className="font-medium">{parseFloat(districtCensusData.pct_ba_or_higher || '0').toFixed(1)}%</p></div>
                      <div><p className="text-muted-foreground">Doctorate Degree:</p><p className="font-medium">{parseFloat(districtCensusData.pct_doctorate || '0').toFixed(1)}%</p></div>
                    </div>
                  </div>
                  <Separator />
                  {/* Economic Indicators */}
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">Economic Indicators</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                      <div><p className="text-muted-foreground">Median HH Income:</p><p className="font-medium">${parseInt(districtCensusData.med_household_income || '0').toLocaleString()}</p></div>
                      <div><p className="text-muted-foreground">Uninsured:</p><p className="font-medium">{parseFloat(districtCensusData.pct_uninsured || '0').toFixed(1)}%</p></div>
                      <div><p className="text-muted-foreground">Divorced:</p><p className="font-medium">{parseFloat(districtCensusData.pct_divorced || '0').toFixed(1)}%</p></div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2 text-right">
                    Data provided by <a href="https://github.com/annikamore11/census_data" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">annikamore11/census_data</a>.
                  </div>
                </div>
              ) : (
                <p>Unable to load district census data for {member.state} District {member.district}</p>
              )}
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 />
              State-Level Data for {member.state}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {censusLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : censusData ? (
              <div className="space-y-4">
                {/* Population */}
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Population</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total:</p>
                      <p className="font-medium">{parseInt(censusData.total_pop || '0').toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Female:</p>
                      <p className="font-medium">{parseFloat(censusData.pct_female || '0').toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Male:</p>
                      <p className="font-medium">{parseFloat(censusData.pct_male || '0').toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
                <Separator />
                 {/* Race/Ethnicity */}
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Race & Ethnicity</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                    <div><p className="text-muted-foreground">White:</p><p className="font-medium">{parseFloat(censusData.pct_white || '0').toFixed(1)}%</p></div>
                    <div><p className="text-muted-foreground">Black:</p><p className="font-medium">{parseFloat(censusData.pct_black || '0').toFixed(1)}%</p></div>
                    <div><p className="text-muted-foreground">Asian:</p><p className="font-medium">{parseFloat(censusData.pct_asian || '0').toFixed(1)}%</p></div>
                    <div><p className="text-muted-foreground">American Indian:</p><p className="font-medium">{parseFloat(censusData.pct_am_indian || '0').toFixed(1)}%</p></div>
                    <div><p className="text-muted-foreground">Pacific Islander:</p><p className="font-medium">{parseFloat(censusData.pct_pacificI || '0').toFixed(1)}%</p></div>
                    <div><p className="text-muted-foreground">2+ Races:</p><p className="font-medium">{parseFloat(censusData.pct_two_or_more || '0').toFixed(1)}%</p></div>
                  </div>
                </div>
                <Separator />
                {/* Education */}
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Education</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                    <div><p className="text-muted-foreground">High School or Higher:</p><p className="font-medium">{parseFloat(censusData.pct_hs_or_higher || '0').toFixed(1)}%</p></div>
                    <div><p className="text-muted-foreground">Bachelor's or Higher:</p><p className="font-medium">{parseFloat(censusData.pct_ba_or_higher || '0').toFixed(1)}%</p></div>
                    <div><p className="text-muted-foreground">Doctorate Degree:</p><p className="font-medium">{parseFloat(censusData.pct_doctorate || '0').toFixed(1)}%</p></div>
                  </div>
                </div>
                <Separator />
                {/* Economic Indicators */}
                 <div>
                  <h4 className="font-semibold mb-2 text-foreground">Economic Indicators</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                    <div><p className="text-muted-foreground">Median HH Income:</p><p className="font-medium">${parseInt(censusData.med_household_income || '0').toLocaleString()}</p></div>
                    <div><p className="text-muted-foreground">Uninsured:</p><p className="font-medium">{parseFloat(censusData.pct_uninsured || '0').toFixed(1)}%</p></div>
                     <div><p className="text-muted-foreground">Divorced:</p><p className="font-medium">{parseFloat(censusData.pct_divorced || '0').toFixed(1)}%</p></div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground pt-2 text-right">
                  Data provided by <a href="https://github.com/annikamore11/census_data" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">annikamore11/census_data</a>.
                </div>
              </div>
            ) : (
              <p>Unable to load census data for {member.state}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
