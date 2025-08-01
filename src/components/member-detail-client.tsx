
'use client';

import { useState, useEffect } from 'react';
import type { Member, MemberTerm, Leadership, PartyHistory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, User, Star, History, Info, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { SocialMediaLinks } from './social-media-links';
import { DistrictOffices } from './district-offices';
import { CommitteeAssignmentsCard } from './committee-assignments-card';
import { CampaignPromisesCard } from './campaign-promises-card';
import { LegislativeActivityCard } from './legislative-activity-card';
import { NewsCard } from './news-card';
import { CampaignFinanceCard } from './campaign-finance-card';

// This would be a more specific type for amendments sponsored by a member
interface MemberAmendment {
  type: string;
  number: string;
  url: string;
  bill: {
    number: string;
    type: string;
    congress: string;
    title: string;
  };
}

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function calculateYearsOfService(firstTerm?: MemberTerm): number {
  if (!firstTerm) return 0;
  const currentYear = new Date().getFullYear();
  return currentYear - firstTerm.startYear;
}

function isCurrentlyServing(member: Member): boolean {
    if (member.deathDate) return false;
    
    let termsArray: any[] = [];
    if (Array.isArray(member.terms)) {
        termsArray = member.terms;
    } else if (member.terms?.item && Array.isArray(member.terms.item)) {
        termsArray = member.terms.item;
    } else {
        return false;
    }
    
    if (termsArray.length === 0) return false;
    
    const currentYear = new Date().getFullYear();
    
    // Check if any term indicates current service
    return termsArray.some(term => {
        const hasStarted = term.startYear <= currentYear;
        // A member is currently serving if their term has no end date OR the end date is strictly in the future.
        const stillServing = !term.endYear || 
                           term.endYear === null || 
                           term.endYear === undefined || 
                           term.endYear > currentYear;
        return hasStarted && stillServing;
    });
}

function getFirstTerm(terms: any): MemberTerm | undefined {
    // Handle different terms data structures
    let termsArray: MemberTerm[] = [];
    
    if (Array.isArray(terms)) {
        // Direct array: terms = [...]
        termsArray = terms;
    } else if (terms && typeof terms === 'object' && Array.isArray(terms.item)) {
        // Object with item property: terms = { item: [...] }
        termsArray = terms.item;
    } else {
        return undefined;
    }
    
    if (termsArray.length === 0) return undefined;
    // Sort by start year ascending to get the earliest term
    const sortedTerms = [...termsArray].sort((a, b) => a.startYear - b.startYear);
    return sortedTerms[0];
}

export function MemberDetailClient({ initialMember, congress }: { initialMember: Member, congress: string }) {
  
  const [member] = useState<Member>(initialMember);

  // Get terms data safely
  const termsData = (() => {
    if (Array.isArray(member.terms)) {
      return member.terms;
    } else if (member.terms?.item && Array.isArray(member.terms.item)) {
      return member.terms.item;
    }
    return [];
  })();

  const allTerms = termsData.slice().sort((a, b) => b.startYear - a.startYear) || [];
  const firstTerm = getFirstTerm(member.terms);
  
  const yearsOfService = calculateYearsOfService(firstTerm);
  const leadershipHistory = (member.leadership || []).sort((a,b) => b.congress - a.congress);
  
  const currentlyServing = isCurrentlyServing(member);
  const currentTerm = member.addressInformation;
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
                data-ai-hint="portrait person"
                />
            </div>
            <div className="flex-1">
                <p className="text-lg text-muted-foreground font-medium mb-1">{member.honorificName}</p>
                <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
                    {member.directOrderName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge variant={member.partyName === 'Republican' ? 'destructive' : member.partyName === 'Democratic' ? 'default' : 'secondary'} className="text-base">
                        {member.partyName}
                    </Badge>
                    {chamberName && (
                        <Badge variant="outline" className="text-base">{chamberName}</Badge>
                    )}
                    <Badge variant="outline" className="text-base">{member.state} {member.district ? ` - District ${member.district}` : ''}</Badge>
                    {currentlyServing ? (
                        <Badge variant="outline" className="text-base bg-green-100 text-green-800 border-green-200">Currently Serving</Badge>
                    ) : member.deathDate ? (
                        <Badge variant="outline" className="text-base bg-gray-100 text-gray-800 border-gray-200">Deceased {formatDate(member.deathDate)}</Badge>
                    ) : (
                        <Badge variant="outline" className="text-base bg-yellow-100 text-yellow-800 border-yellow-200">Not Currently Serving</Badge>
                    )}
                </div>
            </div>
        </div>
      </header>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User /> Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {/* Core Information */}
            <div className="space-y-3">
              {firstTerm && <p><strong>First Took Office:</strong> {firstTerm.startYear}</p>}
              <p><strong>Years of Service:</strong> ~{yearsOfService} years</p>
              {member.birthYear && <p><strong>Birth Year:</strong> {member.birthYear}</p>}
              <p><strong>Bioguide ID:</strong> {member.bioguideId}</p>
              {currentTerm?.officeAddress && <p><strong>Office:</strong> {currentTerm.officeAddress}</p>}
              {currentTerm?.phoneNumber && <p><strong>Phone:</strong> {currentTerm.phoneNumber}</p>}
            </div>

            {/* Extended IDs Section */}
            {member.extendedIds && (
              <div className="border-t pt-4">

                {/* External Profiles Row */}
                {(member.extendedIds.wikipedia || member.extendedIds.ballotpedia) && (
                  <div className="mt-3">
                    <h5 className="font-medium text-sm mb-2 text-foreground">External Profiles</h5>
                    <div className="flex flex-wrap gap-2">
                      {member.extendedIds.wikipedia && (
                        <Button asChild size="sm" variant="outline">
                          <a href={`https://en.wikipedia.org/wiki/${member.extendedIds.wikipedia}`} 
                             target="_blank" rel="noopener noreferrer" className="text-xs">
                              Wikipedia <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      {member.extendedIds.ballotpedia && (
                        <Button asChild size="sm" variant="outline">
                          <a href={`https://ballotpedia.org/${member.extendedIds.ballotpedia}`}
                             target="_blank" rel="noopener noreferrer" className="text-xs">
                              Ballotpedia <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Family Information */}
                {member.extendedIds.family && member.extendedIds.family.length > 0 && (
                  <div className="mt-3">
                    <h5 className="font-medium text-sm mb-2 text-foreground">Family</h5>
                    <div className="space-y-1">
                      {member.extendedIds.family.map((relative, index) => (
                        <p key={index} className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{relative.name}</span> ({relative.relation})
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Research & Data IDs - Collapsible */}
                <Collapsible className="mt-3">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between p-2 h-auto">
                        <span className="font-medium text-sm">Research &amp; Data IDs</span>
                        <ChevronsUpDown className="h-3 w-3" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            {member.extendedIds.fec && member.extendedIds.fec.length > 0 && (
                                <div className="p-2 bg-secondary/30 rounded-md md:col-span-2">
                                  <p className="text-muted-foreground">FEC Committee IDs</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {member.extendedIds.fec.map((fecId, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs font-mono">
                                        {fecId}
                                        </Badge>
                                    ))}
                                  </div>
                                </div>
                            )}
                            {member.extendedIds.thomas && (
                                <div className="p-2 bg-secondary/30 rounded-md">
                                <p className="text-muted-foreground">Thomas Library</p>
                                <p className="font-mono font-medium">{member.extendedIds.thomas}</p>
                                </div>
                            )}
                            {member.extendedIds.govtrack && (
                                <div className="p-2 bg-secondary/30 rounded-md">
                                <p className="text-muted-foreground">GovTrack</p>
                                <a href={`https://www.govtrack.us/congress/members/${member.extendedIds.govtrack}`} 
                                    target="_blank" rel="noopener noreferrer" 
                                    className="font-mono font-medium text-primary hover:underline">
                                    {member.extendedIds.govtrack}
                                </a>
                                </div>
                            )}
                            {member.extendedIds.opensecrets && (
                                <div className="p-2 bg-secondary/30 rounded-md">
                                <p className="text-muted-foreground">OpenSecrets</p>
                                <a href={`https://www.opensecrets.org/members-of-congress/summary?cid=${member.extendedIds.opensecrets}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="font-mono font-medium text-primary hover:underline">
                                    {member.extendedIds.opensecrets}
                                </a>
                                </div>
                            )}
                            {member.extendedIds.votesmart && (
                                <div className="p-2 bg-secondary/30 rounded-md">
                                <p className="text-muted-foreground">Vote Smart</p>
                                <p className="font-mono font-medium">{member.extendedIds.votesmart}</p>
                                </div>
                            )}
                            {member.extendedIds.cspan && (
                                <div className="p-2 bg-secondary/30 rounded-md">
                                <p className="text-muted-foreground">C-SPAN</p>
                                <p className="font-mono font-medium">{member.extendedIds.cspan}</p>
                                </div>
                            )}
                            {member.extendedIds.icpsr && (
                                <div className="p-2 bg-secondary/30 rounded-md">
                                <p className="text-muted-foreground">ICPSR</p>
                                <p className="font-mono font-medium">{member.extendedIds.icpsr}</p>
                                </div>
                            )}
                            {member.extendedIds.house_history && (
                                <div className="p-2 bg-secondary/20 rounded-md">
                                    <p className="text-muted-foreground">House History</p>
                                    <p className="font-mono font-medium">{member.extendedIds.house_history}</p>
                                </div>
                            )}
                            {member.extendedIds.maplight && (
                                <div className="p-2 bg-secondary/20 rounded-md">
                                    <p className="text-muted-foreground">MapLight</p>
                                    <p className="font-mono font-medium">{member.extendedIds.maplight}</p>
                                </div>
                            )}
                            {member.extendedIds.wikidata && (
                                <div className="p-2 bg-secondary/20 rounded-md">
                                    <p className="text-muted-foreground">Wikidata</p>
                                    <a href={`https://www.wikidata.org/wiki/${member.extendedIds.wikidata}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="font-mono font-medium text-primary hover:underline">
                                        {member.extendedIds.wikidata}
                                    </a>
                                </div>
                            )}
                            {member.extendedIds.google_entity_id && (
                                <div className="p-2 bg-secondary/20 rounded-md">
                                    <p className="text-muted-foreground">Google Entity</p>
                                    <p className="font-mono font-medium text-xs">{member.extendedIds.google_entity_id}</p>
                                </div>
                            )}
                            {member.extendedIds.pictorial && (
                                <div className="p-2 bg-secondary/20 rounded-md">
                                    <p className="text-muted-foreground">Pictorial Directory</p>
                                    <p className="font-mono font-medium">{member.extendedIds.pictorial}</p>
                                </div>
                            )}
                        </div>
                    </CollapsibleContent>
                  </Collapsible>
              </div>
            )}

            {/* Social Media and District Offices (existing components) */}
            {member.bioguideId && (
              <SocialMediaLinks bioguideId={member.bioguideId} />
            )}

            {member.bioguideId && (
              <DistrictOffices bioguideId={member.bioguideId} />
            )}
            
            {/* Official Website Button */}
            {member.officialWebsiteUrl && (
              <Button asChild size="sm" className="w-full mt-2">
                <a href={member.officialWebsiteUrl} target="_blank" rel="noopener noreferrer">
                  Official Website <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        <CampaignFinanceCard 
            member={member} 
            congress={congress} 
            state={member.state.toLowerCase()} 
            bioguideId={member.bioguideId}
        />

        <NewsCard bioguideId={member.bioguideId} />
        
        <LegislativeActivityCard member={member} />

        <CommitteeAssignmentsCard member={member} congress={congress} />

        <CampaignPromisesCard member={member} congress={congress} />

        {allTerms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><History /> Service History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {allTerms.map((term, index) => (
                  <div key={index} className="text-sm p-2 bg-secondary/50 rounded-md">
                    <p className="font-semibold">{term.chamber}</p>
                    <p className="text-muted-foreground text-xs">
                      {term.congress}th Congress ({term.startYear} - {term.endYear || 'Present'})
                      {term.district && ` - District ${term.district}`}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {leadershipHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Star /> Leadership History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leadershipHistory.map((leadership, index) => (
                  <div key={index} className="text-sm p-2 bg-secondary/50 rounded-md">
                    <p className="font-semibold">{leadership.type}</p>
                    <p className="text-muted-foreground text-xs">{leadership.congress}th Congress</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {member.partyHistory && member.partyHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info /> Party History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {member.partyHistory.map((party, index) => (
                  <div key={index} className="text-sm p-2 bg-secondary/50 rounded-md flex items-center gap-2">
                    <Badge variant="outline">{party.partyAbbreviation}</Badge>
                    <div>
                      <p className="font-semibold">{party.partyName}</p>
                      <p className="text-muted-foreground text-xs">{party.startYear} - {party.endYear || 'Present'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
