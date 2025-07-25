
'use client';

import type { Member, MemberTerm, SponsoredLegislation, CosponsoredLegislation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Building, Calendar, MapPin, Briefcase, ExternalLink, Phone, User, Gavel, FileText, Users } from 'lucide-react';
import { Button } from './ui/button';
import { getBillTypeSlug } from '@/lib/utils';
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

function isCurrentlyServing(member: Member): boolean {
    if (member.deathDate) return false;
    if (!member.terms?.item) return false;
    
    const currentYear = new Date().getFullYear();
    // Check if any term period includes the current year
    return member.terms.item.some(term => term.startYear <= currentYear && term.endYear >= currentYear);
}

const LegislationTable = ({ bills, type, congress }: { bills: (SponsoredLegislation | CosponsoredLegislation)[], type: 'sponsored' | 'cosponsored', congress: string }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Bill</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {bills.map((bill) => {
                    const billTypeSlug = getBillTypeSlug(bill.type);
                    const detailUrl = bill.type ? `/bill/${bill.congress}/${billTypeSlug}/${bill.number}` : '#';

                    const date = type === 'sponsored' ? (bill as SponsoredLegislation).introducedDate : (bill as CosponsoredLegislation).cosponsoredDate;

                    return (
                        <TableRow key={`${bill.type}-${bill.number}`}>
                             <TableCell className="font-medium">
                                <Link href={detailUrl} className="hover:underline">
                                    {bill.type} {bill.number}
                                </Link>
                            </TableCell>
                            <TableCell>{bill.title}</TableCell>
                            <TableCell className="hidden md:table-cell">{formatDate(date)}</TableCell>
                             <TableCell className="hidden md:table-cell text-xs">{bill.latestAction?.text || 'N/A'}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};


export function MemberDetailClient({ member, congress }: { member: Member, congress: string }) {
  const partyColor = member.partyName === 'Democrat' 
    ? 'bg-blue-600' 
    : member.partyName === 'Republican' 
    ? 'bg-red-600' 
    : 'bg-gray-500';

  const allTerms = member.terms?.item?.slice().sort((a, b) => b.startYear - a.startYear) || [];
  const currentTerm = allTerms.find(term => {
      const currentYear = new Date().getFullYear();
      return term.startYear <= currentYear && term.endYear >= currentYear;
  }) || allTerms[0];
  
  const firstTerm = allTerms[allTerms.length - 1];
  
  const yearsOfService = calculateYearsOfService(firstTerm);
  const serving = isCurrentlyServing(member);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        <header className="mb-8 flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-primary/20 shrink-0 shadow-lg">
                <Image
                    src={member.depiction?.imageUrl || 'https://placehold.co/300x300.png'}
                    alt={`Portrait of ${member.name}`}
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
                    {currentTerm?.chamber} for {member.state} {currentTerm?.district ? `(District ${currentTerm.district})` : ''}
                </p>
                 <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge className={`text-white text-base px-4 py-1 ${partyColor}`}>{member.partyName}</Badge>
                    {currentTerm?.congress && <Badge variant="secondary" className="text-base px-4 py-1">{currentTerm.congress}th Congress</Badge>}
                     <Badge variant={serving ? "default" : "secondary"} className="text-base px-4 py-1">
                        {serving ? 'Currently Serving' : 'Former Member'}
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
                    <p><strong>Full Name:</strong> {member.directOrderName}</p>
                    <p><strong>Born:</strong> {formatDate(member.birthDate)}</p>
                    {member.deathDate && <p><strong>Died:</strong> {formatDate(member.deathDate)}</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Briefcase /> Service</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    {firstTerm && <p><strong>First Took Office:</strong> {formatDate(firstTerm.startYear)}</p>}
                    <p><strong>Years of Service:</strong> ~{yearsOfService} years</p>
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

            {(member.sponsoredLegislation?.length || member.cosponsoredLegislation?.length) ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Gavel /> Legislative Activity</CardTitle>
                        <CardDescription>Recent bills sponsored and cosponsored by the member.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Tabs defaultValue="sponsored">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="sponsored" disabled={!member.sponsoredLegislation?.length}>
                                    <FileText className="mr-2" /> Sponsored ({member.sponsoredLegislation?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="cosponsored" disabled={!member.cosponsoredLegislation?.length}>
                                    <Users className="mr-2" /> Cosponsored ({member.cosponsoredLegislation?.length || 0})
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="sponsored">
                                {member.sponsoredLegislation && <LegislationTable bills={member.sponsoredLegislation} type="sponsored" congress={congress}/>}
                            </TabsContent>
                            <TabsContent value="cosponsored">
                                {member.cosponsoredLegislation && <LegislationTable bills={member.cosponsoredLegislation} type="cosponsored" congress={congress}/>}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            ) : null}

             <Card>
                <CardHeader>
                    <CardTitle>All Terms of Service</CardTitle>
                    <CardDescription>A complete history of the congresses this member has served in.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="space-y-4">
                        {allTerms.map((term, index) => (
                            <div key={index} className="p-3 bg-secondary/50 rounded-md text-sm">
                                <p className="font-semibold">{term.congress}th Congress ({term.startYear} - {term.endYear})</p>
                                <div className="text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 mt-2">
                                    <span><strong className="text-foreground">Chamber:</strong> {term.chamber}</span>
                                    <span><strong className="text-foreground">Party:</strong> {term.partyName}</span>
                                    <span><strong className="text-foreground">State:</strong> {term.stateCode}</span>
                                    {term.district && <span><strong className="text-foreground">District:</strong> {term.district}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
