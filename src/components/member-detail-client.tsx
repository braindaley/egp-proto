
'use client';
import { useState, useEffect } from 'react';
import type { Member, MemberTerm, Leadership, PartyHistory, NewsArticle, SponsoredLegislation, CosponsoredLegislation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Building, Calendar, MapPin, Briefcase, ExternalLink, Phone, User, Gavel, FileText, Users, Star, History, Info, Newspaper, ChevronsUpDown, Loader2, Target, Trophy, Hourglass, CircleSlash } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { getBillTypeSlug } from '@/lib/utils';
import { getCommitteeAssignments, type CommitteeAssignmentsData } from '@/ai/flows/get-committee-assignments-flow';
import { getCampaignPromises, type CampaignPromisesData, type CampaignPromise } from '@/ai/flows/get-campaign-promises-flow';
import { Skeleton } from '@/components/ui/skeleton';

// Updated types to match Congress API response
interface CongressApiMember extends Member {}

function formatDate(dateString: string | undefined | number) {
    if (!dateString) return 'N/A';
    // Handle case where year is passed as a number
    if (typeof dateString === 'number') {
        return dateString.toString();
    }
    // Add a dummy time to avoid timezone issues if only date is provided
    const date = new Date(dateString.includes('T') || dateString.includes('GMT') ? dateString : `${dateString}T12:00:00Z`);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function calculateYearsOfService(firstTerm: MemberTerm | undefined): number | string {
    if (!firstTerm?.startYear) return 'N/A';
    const startYear = firstTerm.startYear;
    const now = new Date();
    // Use UTC years for calculation
    const years = now.getUTCFullYear() - startYear;
    return years > 0 ? years : 1; // Show at least 1 year of service
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

function getCurrentTerm(terms: any): MemberTerm | undefined {
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
    
    const currentYear = new Date().getFullYear();
    
    // First, try to find a term that's currently active
    const activeTerm = termsArray.find(term => {
        if (!term.endYear || term.endYear === null || term.endYear === undefined) {
            return term.startYear <= currentYear;
        }
        return term.startYear <= currentYear && term.endYear >= currentYear;
    });
    
    if (activeTerm) return activeTerm;
    
    // If no active term found, return the most recent term
    const sortedTerms = [...termsArray].sort((a, b) => (b.congress || 0) - (a.congress || 0));
    return sortedTerms[0];
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

const CommitteeAssignments = ({ member, congress }: { member: Member, congress: string }) => {
    const [assignments, setAssignments] = useState<CommitteeAssignmentsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAssignments = async () => {
            if (!member.directOrderName || !congress || !member.bioguideId) return;
            setIsLoading(true);
            setError('');
            try {
                const currentTerm = getCurrentTerm(member.terms);
                const relevantCongress = currentTerm?.congress?.toString() || congress;
                
                const result = await getCommitteeAssignments({
                    memberName: member.directOrderName,
                    congressNumber: relevantCongress,
                    bioguideId: member.bioguideId
                });
                setAssignments(result);
            } catch (e) {
                console.error("Error fetching committee assignments:", e);
                setError('Could not load committee assignments.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssignments();
    }, [member, congress]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/5" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (error || !assignments || (assignments.committees.length === 0 && assignments.subcommittees.length === 0)) {
        return null; // Don't render the card if no assignments or an error occurred
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Committee Assignments
                </CardTitle>
                <CardDescription>
                    {assignments.congress}th Congress &bull; {assignments.chamber} &bull; Last updated: {formatDate(assignments.lastUpdated)}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {assignments.committees && assignments.committees.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                            🏛️ Full Committees
                        </h4>
                        <div className="space-y-2">
                            {assignments.committees.map((committee, index) => (
                                <div key={index} className="p-3 rounded-md border bg-secondary/30">
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-foreground pr-4">
                                           {committee.url ? <a href={committee.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{committee.name}</a> : committee.name}
                                        </p>
                                        <div className="text-xs shrink-0">
                                            {committee.role}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {assignments.subcommittees && assignments.subcommittees.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                            📋 Subcommittee Assignments
                        </h4>
                        <div className="space-y-2">
                            {assignments.subcommittees.map((sub, index) => (
                                <div key={index} className="p-3 bg-secondary/20 rounded border-l-2 border-border">
                                     <div className="flex justify-between items-start">
                                        <div className="pr-4">
                                            <p className="font-medium text-foreground text-sm">
                                                {sub.url ? <a href={sub.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{sub.name}</a> : sub.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                under {sub.parentCommittee}
                                            </p>
                                        </div>
                                        <div className="text-xs shrink-0">
                                            {sub.role}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                 <div className="text-xs text-muted-foreground pt-2">
                   Data provided by <a href={assignments.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">{assignments.source}</a>.
                </div>
            </CardContent>
        </Card>
    );
};

const CampaignPromises = ({ member, congress }: { member: Member, congress: string }) => {
    const [data, setData] = useState<CampaignPromisesData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!member.directOrderName || !congress) return;
            setIsLoading(true);
            setError('');
            try {
                const result = await getCampaignPromises({
                    memberName: member.directOrderName,
                    congressNumber: congress
                });
                setData(result);
            } catch (e) {
                console.error("Error fetching campaign promises:", e);
                setError('Could not load campaign promises.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [member, congress]);

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/5" />
                    <Skeleton className="h-4 w-4/5 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (error || !data) {
        return null;
    }
    
    const getStatusIcon = (status: CampaignPromise['status']) => {
        switch (status) {
            case 'Completed': return <Trophy className="h-4 w-4 text-green-600" />;
            case 'In Progress': return <Hourglass className="h-4 w-4 text-blue-600" />;
            case 'Stalled': return <CircleSlash className="h-4 w-4 text-yellow-600" />;
            case 'Not Started': return <FileText className="h-4 w-4 text-gray-500" />;
            default: return null;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Recent Campaign Promises
                </CardTitle>
                <CardDescription>
                    A generated overview of key promises from recent campaigns.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    {data.promises.map((promise, index) => (
                        <div key={index} className="p-4 rounded-lg border bg-secondary/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge 
                                        variant={
                                            promise.priority === 'High' ? 'default' :
                                            promise.priority === 'Medium' ? 'secondary' : 'outline'
                                        }
                                        className="mb-2"
                                    >
                                        {promise.priority} Priority
                                    </Badge>
                                    <h4 className="font-bold text-base text-foreground">{promise.title}</h4>
                                </div>
                                <Badge variant="outline" className="flex items-center gap-1.5 shrink-0">
                                    {getStatusIcon(promise.status)}
                                    {promise.status}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">{promise.description}</p>
                            <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border">
                                Category: {promise.category}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="bg-secondary/30 p-4 rounded-lg border border-border">
                    <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                        ℹ️ Important Note
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                        Campaign promises are complex and can evolve over time. For the most accurate and official platform details, please consult the member's official campaign website.
                    </p>
                    <p className="text-xs text-muted-foreground opacity-80 italic">
                        This information is generated based on common political platforms and may not reflect the member's actual campaign promises.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

interface ExtraData {
    news: NewsArticle[];
    sponsoredLegislation: SponsoredLegislation[];
    cosponsoredLegislation: CosponsoredLegislation[];
}


export function MemberDetailClient({ initialMember, congress }: { initialMember: CongressApiMember, congress: string }) {
  
  const [member, setMember] = useState<Member>(initialMember);
  const [extraData, setExtraData] = useState<ExtraData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchExtraData() {
        setIsLoading(true);
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const bioguideId = initialMember.bioguideId;

        try {
            const [sponsoredRes, cosponsoredRes, newsRes] = await Promise.allSettled([
                fetch(`${baseUrl}/api/congress/member/${bioguideId}/sponsored-legislation`),
                fetch(`${baseUrl}/api/congress/member/${bioguideId}/cosponsored-legislation`),
                fetch(`${baseUrl}/api/congress/member/${bioguideId}/news`)
            ]);

            const sponsoredLegislation = sponsoredRes.status === 'fulfilled' && sponsoredRes.value.ok ? await sponsoredRes.value.json() : [];
            const cosponsoredLegislation = cosponsoredRes.status === 'fulfilled' && cosponsoredRes.value.ok ? await cosponsoredRes.value.json() : [];
            const news = newsRes.status === 'fulfilled' && newsRes.value.ok ? await newsRes.value.json() : [];
            
            setExtraData({
                sponsoredLegislation,
                cosponsoredLegislation,
                news
            });
        } catch (error) {
            console.error("Failed to fetch extra member data", error);
        } finally {
            setIsLoading(false);
        }
    }
    fetchExtraData();
  }, [initialMember.bioguideId]);

  // Handle different terms data structures safely
  let termsData: MemberTerm[] = [];
  try {
    if (Array.isArray(member.terms)) {
      termsData = member.terms;
    } else if (member.terms?.item && Array.isArray(member.terms.item)) {
      termsData = member.terms.item;
    }
  } catch (error) {
    console.error('Error processing terms data:', error);
    termsData = [];
  }

  const allTerms = termsData.slice().sort((a, b) => b.startYear - a.startYear) || [];
  const firstTerm = getFirstTerm(member.terms);
  
  const yearsOfService = calculateYearsOfService(firstTerm);
  const leadershipHistory = (member.leadership || []).sort((a,b) => b.congress - a.congress);
  const hasNews = extraData?.news && extraData.news.length > 0;
  const sponsoredLegislation = extraData?.sponsoredLegislation || [];
  const cosponsoredLegislation = extraData?.cosponsoredLegislation || [];
  const sponsoredCount = member.sponsoredLegislationSummary?.count || sponsoredLegislation.length;
  const cosponsoredCount = member.cosponsoredLegislationSummary?.count || cosponsoredLegislation.length;
  const currentlyServing = isCurrentlyServing(member);
  const currentTerm = member.addressInformation;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <header className="mb-8 flex flex-col items-center gap-6">
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-primary/20 shrink-0 shadow-lg">
                <Image
                    src={member.depiction?.imageUrl || 'https://placehold.co/300x300.png'}
                    alt={`Portrait of ${member.directOrderName}`}
                    fill
                    sizes="160px"
                    className="object-cover"
                    data-ai-hint="portrait person"
                    priority={true}
                />
            </div>
            <div>
                <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary text-center">
                    {member.directOrderName}
                </h1>
                <p className="text-xl text-muted-foreground mt-1 text-center">
                    {member.honorificName} for {member.state} {member.district ? `(District ${member.district})` : ''}
                </p>
                <div className="flex justify-center mt-2">
                    <Badge variant={currentlyServing ? "default" : "secondary"}>
                        {currentlyServing ? 'Current Member' : 'Former Member'}
                    </Badge>
                </div>
            </div>
        </header>

        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User /> Basic Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    {firstTerm && <p><strong>First Took Office:</strong> {formatDate(firstTerm.startYear)}</p>}
                    <p><strong>Years of Service:</strong> ~{yearsOfService} years</p>
                    {member.birthYear && <p><strong>Birth Year:</strong> {member.birthYear}</p>}
                    <p><strong>Bioguide ID:</strong> {member.bioguideId}</p>
                    {currentTerm?.officeAddress && <p><strong>Office:</strong> {currentTerm.officeAddress}</p>}
                    {currentTerm?.phoneNumber && <p><strong>Phone:</strong> {currentTerm.phoneNumber}</p>}
                    {member.officialWebsiteUrl && (
                        <Button asChild size="sm" className="w-full mt-2">
                            <a href={member.officialWebsiteUrl} target="_blank" rel="noopener noreferrer">
                                Official Website <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    )}
                </CardContent>
            </Card>

            {isLoading ? (
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-2/5" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                </Card>
            ) : hasNews && extraData && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Newspaper /> Recent News</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {extraData.news.map((article, index) => (
                                <a href={article.link} target="_blank" rel="noopener noreferrer" key={index} className="block p-3 bg-secondary/50 rounded-md hover:bg-secondary transition-colors">
                                    <div className="flex items-start gap-4">
                                        {article.imageUrl && (
                                            <div className="relative w-24 h-16 rounded-md overflow-hidden shrink-0">
                                                <Image 
                                                    src={article.imageUrl}
                                                    alt={article.title || 'News article thumbnail'}
                                                    fill
                                                    className="object-cover"
                                                    data-ai-hint="news photo"
                                                    sizes="96px"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm leading-tight">{article.title}</p>
                                            <div className="text-xs text-muted-foreground mt-2 flex justify-between items-center">
                                                {article.source?._ && <span>{article.source._}</span>}
                                                <span>{formatDate(article.pubDate)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gavel /> Legislative Activity</CardTitle>
                    <CardDescription>Summary of bills sponsored and cosponsored by the member.</CardDescription>
                </CardHeader>
                 {isLoading && !extraData ? (
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </CardContent>
                 ) : (
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-secondary/50 rounded-lg">
                                <h3 className="font-semibold mb-2">Sponsored Bills</h3>
                                <p className="text-3xl font-bold text-primary">{sponsoredCount}</p>
                            </div>
                            <div className="p-4 bg-secondary/50 rounded-lg">
                                <h3 className="font-semibold mb-2">Cosponsored Bills</h3>
                                <p className="text-3xl font-bold text-primary">{cosponsoredCount}</p>
                            </div>
                        </div>
                        
                        {sponsoredLegislation.length > 0 && (
                            <Collapsible>
                                <CollapsibleTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        View Recent Sponsored Bills ({sponsoredLegislation.length})
                                        <ChevronsUpDown className="h-4 w-4" />
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                                    {sponsoredLegislation.map((bill) => (
                                        <div key={bill.number} className="p-3 bg-secondary/50 rounded-md">
                                            <Link href={`/bill/${bill.congress}/${getBillTypeSlug(bill.type)}/${bill.number}`} className="font-semibold hover:underline">{bill.type} {bill.number}: {bill.title}</Link>
                                            <p className="text-xs text-muted-foreground mt-1">Introduced: {formatDate(bill.introducedDate)}</p>
                                        </div>
                                    ))}
                                </CollapsibleContent>
                            </Collapsible>
                        )}

                        {cosponsoredLegislation.length > 0 && (
                            <Collapsible className="mt-2">
                                <CollapsibleTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        View Recent Cosponsored Bills ({cosponsoredLegislation.length})
                                        <ChevronsUpDown className="h-4 w-4" />
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                                    {cosponsoredLegislation.map((bill) => (
                                        <div key={bill.number} className="p-3 bg-secondary/50 rounded-md">
                                            <Link href={`/bill/${bill.congress}/${getBillTypeSlug(bill.type)}/${bill.number}`} className="font-semibold hover:underline">{bill.type} {bill.number}: {bill.title}</Link>
                                            <p className="text-xs text-muted-foreground mt-1">Cosponsored: {formatDate(bill.cosponsoredDate)}</p>
                                        </div>
                                    ))}
                                </CollapsibleContent>
                            </Collapsible>
                        )}
                    </CardContent>
                 )}
            </Card>

            <CommitteeAssignments member={member} congress={congress} />

            <CampaignPromises member={member} congress={congress} />

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
    </div>
  );
}
