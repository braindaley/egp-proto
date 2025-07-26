'use client';

import type { Member, MemberTerm, Leadership, PartyHistory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Building, Calendar, MapPin, Briefcase, ExternalLink, Phone, User, Gavel, FileText, Users, Star, History, Info } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Updated types to match Congress API response
interface CongressApiMember {
  addressInformation: {
    city: string;
    district: string;
    officeAddress: string;
    phoneNumber: string;
    zipCode: number;
  };
  bioguideId: string;
  birthYear: string;
  cosponsoredLegislation: {
    count: number;
    url: string;
  };
  currentMember: boolean;
  depiction: {
    attribution: string;
    imageUrl: string;
  };
  directOrderName: string;
  district: number;
  firstName: string;
  honorificName: string;
  invertedOrderName: string;
  lastName: string;
  leadership: Leadership[];
  officialWebsiteUrl: string;
  partyHistory: PartyHistory[];
  sponsoredLegislation: {
    count: number;
    url: string;
  };
  state: string;
  terms: MemberTerm[];
  updateDate: string;
}

function formatDate(dateString: string | undefined | number) {
    if (!dateString) return 'N/A';
    // Handle case where year is passed as a number
    if (typeof dateString === 'number') {
        return dateString.toString();
    }
    // Add a dummy time to avoid timezone issues if only date is provided
    const date = new Date(dateString.includes('T') ? dateString : `${dateString}T12:00:00Z`);
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

function isCurrentlyServing(member: CongressApiMember): boolean {
    return member.currentMember;
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
  const allTerms = member.terms?.slice().sort((a, b) => a.startYear - b.startYear) || [];
  const firstTerm = getFirstTerm(member.terms);
  const currentTerm = getCurrentTerm(member.terms);
  
  const yearsOfService = calculateYearsOfService(firstTerm);
  const leadershipHistory = (member.leadership || []).sort((a,b) => b.congress - a.congress);

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
                    <p><strong>Currently Serving:</strong> {member.currentMember ? 'Yes' : 'No'}</p>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Briefcase /> Current Service</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    {firstTerm && <p><strong>First Took Office:</strong> {formatDate(firstTerm.startYear)}</p>}
                    <p><strong>Years of Service:</strong> ~{yearsOfService} years</p>
                    <p><strong>Current District:</strong> {member.district}</p>
                    <p><strong>State:</strong> {member.state}</p>
                    {member.officialWebsiteUrl && (
                        <Button asChild size="sm" className="w-full mt-2">
                            <a href={member.officialWebsiteUrl} target="_blank" rel="noopener noreferrer">
                                Official Website <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building /> Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <p><strong>Office Address:</strong> {member.addressInformation.officeAddress}</p>
                    <p><strong>City:</strong> {member.addressInformation.city}, {member.addressInformation.district}</p>
                    <p><strong>Zip Code:</strong> {member.addressInformation.zipCode}</p>
                    <p><strong>Phone:</strong> {member.addressInformation.phoneNumber}</p>
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
                            <p className="text-2xl font-bold text-primary">{member.sponsoredLegislation.count}</p>
                            <Button asChild size="sm" variant="outline" className="mt-2">
                                <a href={member.sponsoredLegislation.url} target="_blank" rel="noopener noreferrer">
                                    View All <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                        <div className="p-4 bg-secondary/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="h-5 w-5" />
                                <h3 className="font-semibold">Cosponsored Bills</h3>
                            </div>
                            <p className="text-2xl font-bold text-primary">{member.cosponsoredLegislation.count}</p>
                            <Button asChild size="sm" variant="outline" className="mt-2">
                                <a href={member.cosponsoredLegislation.url} target="_blank" rel="noopener noreferrer">
                                    View All <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                                        <p className="text-muted-foreground text-xs">{party.startYear} - Present</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {member.terms && member.terms.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><History /> Service History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {member.terms.map((term, index) => (
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