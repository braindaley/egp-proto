'use client';

import type { Member, MemberTerm, Leadership, PartyHistory, NewsArticle } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Building, Calendar, MapPin, Briefcase, ExternalLink, Phone, User, Gavel, FileText, Users, Star, History, Info, Newspaper } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

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
    if (!member.terms?.item) return false;
    
    const currentYear = new Date().getFullYear();
    // Check if any term period includes the current year
    return member.terms.item.some(term => term.startYear <= currentYear && term.endYear >= currentYear);
}

function getCurrentTerm(terms: MemberTerm[]): MemberTerm | undefined {
    if (!terms || terms.length === 0) return undefined;
    // Sort by congress number descending to get the most recent term
    const sortedTerms = [...terms].sort((a, b) => (b.congress || 0) - (a.congress || 0));
    return sortedTerms[0];
}

function getFirstTerm(terms: MemberTerm[]): MemberTerm | undefined {
    if (!terms || terms.length === 0) return undefined;
    // Sort by start year ascending to get the earliest term
    const sortedTerms = [...terms].sort((a, b) => a.startYear - b.startYear);
    return sortedTerms[0];
}

export function MemberDetailClient({ member, congress }: { member: CongressApiMember, congress: string }) {
  const allTerms = member.terms?.item?.slice().sort((a, b) => a.startYear - b.startYear) || [];
  const firstTerm = getFirstTerm(member.terms.item || []);
  const currentTerm = getCurrentTerm(member.terms.item || []);
  
  const yearsOfService = calculateYearsOfService(firstTerm);
  const leadershipHistory = (member.leadership || []).sort((a,b) => b.congress - a.congress);
  const hasNews = member.news && member.news.length > 0;

  return (
    <div className="space-y-8">
        <header className="mb-8 flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-primary/20 shrink-0 shadow-lg">
                <Image
                    src={member.depiction?.imageUrl || 'https://placehold.co/300x300.png'}
                    alt={`Portrait of ${member.directOrderName}`}
                    fill
                    sizes="160px"
                    className="object-cover"
                    data-ai-hint="portrait person"
                />
            </div>
            <div>
                <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary text-center md:text-left">
                    {member.directOrderName}
                </h1>
                <p className="text-xl text-muted-foreground mt-1 text-center md:text-left">
                    {currentTerm?.chamber} for {member.state} {member.district ? `(District ${member.district})` : ''}
                </p>
            </div>
        </header>

        <div className="space-y-8">
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User /> Basic Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <p><strong>Full Name:</strong> {member.directOrderName}</p>
                    <p><strong>Bioguide ID:</strong> {member.bioguideId}</p>
                    {member.birthYear && <p><strong>Birth Year:</strong> {member.birthYear}</p>}
                    <p><strong>Currently Serving:</strong> {isCurrentlyServing(member) ? 'Yes' : 'No'}</p>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Briefcase /> Current Service</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    {firstTerm && <p><strong>First Took Office:</strong> {formatDate(firstTerm.startYear)}</p>}
                    <p><strong>Years of Service:</strong> ~{yearsOfService} years</p>
                    {currentTerm?.district && <p><strong>Current District:</strong> {currentTerm.district}</p>}
                    <p><strong>State:</strong> {member.state}</p>
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

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gavel /> Legislative Activity</CardTitle>
                    <CardDescription>Summary of bills sponsored and cosponsored by the member.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-secondary/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-5 w-5" />
                                <h3 className="font-semibold">Sponsored Bills</h3>
                            </div>
                            <p className="text-2xl font-bold text-primary">{member.sponsoredLegislation?.length || 0}</p>
                            <Link href={`/congress/${congress}/member/${member.bioguideId}/sponsored`}>
                                <Button size="sm" variant="outline" className="mt-2">
                                    View All <ExternalLink className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                        <div className="p-4 bg-secondary/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="h-5 w-5" />
                                <h3 className="font-semibold">Cosponsored Bills</h3>
                            </div>
                            <p className="text-2xl font-bold text-primary">{member.cosponsoredLegislation?.length || 0}</p>
                            <Link href={`/congress/${congress}/member/${member.bioguideId}/cosponsored`}>
                                <Button size="sm" variant="outline" className="mt-2">
                                    View All <ExternalLink className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
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
                                    <p className="font-semibold text-sm">{article.title}</p>
                                    <div className="text-xs text-muted-foreground mt-2 flex justify-between items-center">
                                       <span>{article.source._}</span>
                                       <span>{formatDate(article.pubDate)}</span>
                                    </div>
                                </a>
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
        </div>
    </div>
  );
}
