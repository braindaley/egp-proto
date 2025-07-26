
'use client';
import type { Member, MemberTerm, Leadership, PartyHistory, NewsArticle, SponsoredLegislation, CosponsoredLegislation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Building, Calendar, MapPin, Briefcase, ExternalLink, Phone, User, Gavel, FileText, Users, Star, History, Info, Newspaper, ChevronsUpDown } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { getBillTypeSlug } from '@/lib/utils';


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
    
    return termsArray.some(term => {
        const hasStarted = term.startYear <= currentYear;
        const stillServing = !term.endYear || term.endYear === null || term.endYear === undefined || term.endYear > currentYear;
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

export function MemberDetailClient({ member, congress }: { member: CongressApiMember, congress: string }) {
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
  const currentTerm = getCurrentTerm(member.terms);
  
  const yearsOfService = calculateYearsOfService(firstTerm);
  const leadershipHistory = (member.leadership || []).sort((a,b) => b.congress - a.congress);
  const hasNews = member.news && member.news.length > 0;
  const sponsoredLegislation = member.sponsoredLegislation || [];
  const cosponsoredLegislation = member.cosponsoredLegislation || [];
  const sponsoredCount = sponsoredLegislation.length;
  const cosponsoredCount = cosponsoredLegislation.length;
  const currentlyServing = isCurrentlyServing(member);

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
                    {currentTerm?.chamber} for {member.state} {member.district ? `(District ${member.district})` : ''}
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
                    <p><strong>State:</strong> {member.state}</p>
                    {firstTerm && <p><strong>First Took Office:</strong> {formatDate(firstTerm.startYear)}</p>}
                    <p><strong>Years of Service:</strong> ~{yearsOfService} years</p>
                    <div className="flex items-center gap-2">
                        <strong>Status:</strong>
                        <Badge variant={currentlyServing ? "default" : "secondary"}>
                            {currentlyServing ? 'Current Member' : 'Former Member'}
                        </Badge>
                    </div>
                    {member.birthYear && <p><strong>Birth Year:</strong> {member.birthYear}</p>}
                    <p><strong>Bioguide ID:</strong> {member.bioguideId}</p>
                    {currentTerm?.office && <p><strong>Office:</strong> {currentTerm.office}</p>}
                    {currentTerm?.phone && <p><strong>Phone:</strong> {currentTerm.phone}</p>}
                    {member.officialWebsiteUrl && (
                        <Button asChild size="sm" className="w-full mt-2">
                            <a href={member.officialWebsiteUrl} target="_blank" rel="noopener noreferrer">
                                Official Website <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    )}
                </CardContent>
            </Card>

            {hasNews && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Newspaper /> Recent News</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {member.news?.map((article, index) => (
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
                                    Sponsored Bills ({sponsoredCount})
                                    <ChevronsUpDown className="h-4 w-4" />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 space-y-2">
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
                                    Cosponsored Bills ({cosponsoredCount})
                                    <ChevronsUpDown className="h-4 w-4" />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 space-y-2">
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
            </Card>

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
