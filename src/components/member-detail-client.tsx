
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
import { SimpleIdeologyChart } from './simple-ideology-chart';

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
  const currentParty = member.partyHistory && member.partyHistory.length > 0 ? member.partyHistory[member.partyHistory.length - 1].partyName : member.partyName;

  return (
    <>

      {/* --- Rest of the component --- */}
      <div className="space-y-8">
        <Card>
          <CardContent className="space-y-4 text-sm pt-8">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                <Image
                  src={member.depiction?.imageUrl || 'https://placehold.co/300x300.png'}
                  alt={`Official photo of ${member.name}`}
                  fill
                  sizes="(max-width: 768px) 128px, 160px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-3">
                  {member.directOrderName}
                </h1>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {chamberName && (
                <div>
                  <h4 className="font-semibold text-muted-foreground">{chamberName === 'House' ? 'House' : 'Senate'}</h4>
                  <p>{chamberName}</p>
                </div>
              )}
              <div>
                <h4 className="font-semibold text-muted-foreground">Party</h4>
                <p>{currentParty || 'Unknown'}</p>
              </div>
              {member.district && (
                <div>
                  <h4 className="font-semibold text-muted-foreground">District</h4>
                  <p>{member.state}-{member.district}</p>
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
            <SimpleIdeologyChart bioguideId={member.bioguideId} />
          </CardContent>
        </Card>
        
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full flex items-center justify-between">
              More about this member
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-8 mt-4">
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info /> Member Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
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
              <div className="space-y-4">
                {allTerms.map((term, index) => (
                  <div key={index} className="border-l-2 border-primary pl-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">
                        {term.chamber} - {term.startYear}
                        {term.endYear && term.endYear !== term.startYear ? `-${term.endYear}` : ''}
                      </h3>
                      <Badge variant={currentlyServing && index === 0 ? "default" : "secondary"}>
                        {currentlyServing && index === 0 ? "Current" : "Completed"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {term.memberType && (
                        <div>
                          <span className="text-muted-foreground">Type: </span>
                          <span className="font-medium">{term.memberType}</span>
                        </div>
                      )}
                      {term.stateCode && (
                        <div>
                          <span className="text-muted-foreground">State: </span>
                          <span className="font-medium">{term.stateCode}</span>
                        </div>
                      )}
                      {term.district && (
                        <div>
                          <span className="text-muted-foreground">District: </span>
                          <span className="font-medium">{term.district}</span>
                        </div>
                      )}
                      {term.party && (
                        <div>
                          <span className="text-muted-foreground">Party: </span>
                          <span className="font-medium">{term.party}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {leadershipHistory.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="font-semibold text-xl mb-6 flex items-center gap-2">
                      <Star className="h-6 w-6 text-amber-500" />
                      Leadership Positions
                    </h3>
                    <div className="space-y-4">
                      {leadershipHistory.map((leadership, index) => {
                        const isHighRanking = leadership.type && (
                          leadership.type.toLowerCase().includes('speaker') ||
                          leadership.type.toLowerCase().includes('majority leader') ||
                          leadership.type.toLowerCase().includes('minority leader')
                        );
                        
                        return (
                          <div 
                            key={index} 
                            className={`relative rounded-xl border transition-all duration-200 hover:shadow-md ${
                              isHighRanking 
                                ? 'bg-gradient-to-r from-amber-50/80 via-amber-25/40 to-transparent border-amber-200/60 shadow-sm' 
                                : 'bg-muted/20 border-muted/40'
                            }`}
                          >
                            <div className="p-5">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className={`font-semibold text-base leading-tight ${
                                    isHighRanking ? 'text-amber-900' : 'text-foreground'
                                  }`}>
                                    {leadership.title || leadership.type}
                                  </h4>
                                  {leadership.title && leadership.type && leadership.title !== leadership.type && (
                                    <p className="text-sm text-muted-foreground mt-1">{leadership.type}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  {isHighRanking && (
                                    <div className="flex items-center text-amber-600">
                                      <Star className="h-4 w-4 fill-current" />
                                    </div>
                                  )}
                                  <Badge 
                                    variant={isHighRanking ? "default" : "secondary"} 
                                    className={isHighRanking ? "bg-amber-600 hover:bg-amber-700" : ""}
                                  >
                                    Congress {leadership.congress}
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Add visual indicator for Speaker/High-ranking positions */}
                              {isHighRanking && (
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-100">
                                  <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                  <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">
                                    High-Ranking Position
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Subtle accent border for important positions */}
                            {isHighRanking && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-l-xl"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              {member.partyHistory && member.partyHistory.length > 1 && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Party History</h3>
                    <div className="space-y-2">
                      {member.partyHistory.map((party, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-muted last:border-0">
                          <span className="font-medium">{party.partyName}</span>
                          <span className="text-sm text-muted-foreground">
                            {party.startYear} - {party.endYear || 'Present'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
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
        
          </CollapsibleContent>
        </Collapsible>
      </div>
    </>
  );
}
