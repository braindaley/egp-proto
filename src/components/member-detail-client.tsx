
'use client';

import { useState, useEffect } from 'react';
import type { Member, MemberTerm, Leadership, PartyHistory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { ExternalLink, User, Star, History, Info, ChevronsUpDown, MapPin, X } from 'lucide-react';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { SocialMediaLinks } from './social-media-links';
import { DistrictOffices } from './district-offices';
import { CommitteeAssignmentsCard } from './committee-assignments-card';
import { CampaignPromisesCard } from './campaign-promises-card';
import { LegislativeActivityCard } from './legislative-activity-card';
import { NewsCard } from './news-card';
import { CampaignFinanceCard } from './campaign-finance-card';
import { useZipCode } from '@/hooks/use-zip-code';
import { useMembersByZip } from '@/hooks/useMembersByZip';

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
function formatDate(dateString?: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
}
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
            {/* ... content remains the same ... */}
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
      </div>
    </>
  );
}
