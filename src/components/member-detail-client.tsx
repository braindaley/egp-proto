
'use client';

import type { Member } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Building, Calendar, MapPin, Flag, User, ExternalLink, Phone, Briefcase } from 'lucide-react';
import { Button } from './ui/button';

function formatDate(dateString: string | undefined) {
    if (!dateString) return 'N/A';
    // Add a dummy time to avoid timezone issues if only date is provided
    const date = new Date(dateString.includes('T') ? dateString : `${dateString}T12:00:00Z`);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function calculateYearsOfService(firstTermStartDate: string | undefined): number | string {
    if (!firstTermStartDate) return 'N/A';
    const start = new Date(firstTermStartDate.includes('T') ? firstTermStartDate : `${firstTermStartDate}T12:00:00Z`);
    const now = new Date();
    // Use UTC years for calculation
    const years = now.getUTCFullYear() - start.getUTCFullYear();
    return years > 0 ? years : 1; // Show at least 1 year of service
}

export function MemberDetailClient({ member }: { member: Member }) {
  const partyColor = member.partyName === 'Democrat' 
    ? 'bg-blue-600' 
    : member.partyName === 'Republican' 
    ? 'bg-red-600' 
    : 'bg-gray-500';

  const allTerms = member.terms?.item?.slice().sort((a, b) => b.startYear - a.startYear) || [];
  const currentTerm = allTerms[0];
  const firstTerm = allTerms[allTerms.length - 1];
  
  const yearsOfService = calculateYearsOfService(firstTerm?.startYear.toString());
  const isCurrentlyServing = !member.deathDate && new Date().getFullYear() <= (currentTerm?.endYear || 0);

  return (
    <div className="max-w-4xl mx-auto">
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
                    {member.name}
                </h1>
                <p className="text-xl text-muted-foreground mt-1 text-center md:text-left">
                    {currentTerm?.chamber} for {member.state} {currentTerm?.district ? `(District ${currentTerm.district})` : ''}
                </p>
                 <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge className={`text-white text-base px-4 py-1 ${partyColor}`}>{member.partyName}</Badge>
                    {currentTerm?.congress && <Badge variant="secondary" className="text-base px-4 py-1">{currentTerm.congress}th Congress</Badge>}
                     <Badge variant={isCurrentlyServing ? 'default' : 'destructive'} className="text-base px-4 py-1">
                        {isCurrentlyServing ? 'Currently Serving' : 'Not Currently Serving'}
                    </Badge>
                </div>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                    {firstTerm && <p><strong>First Took Office:</strong> {formatDate(firstTerm.startYear.toString())}</p>}
                    <p><strong>Years of Service:</strong> ~{yearsOfService} years</p>
                     {member.officialWebsiteUrl && (
                        <Button asChild size="sm" className="w-full mt-2">
                            <a href={member.officialWebsiteUrl} target="_blank" rel="noopener noreferrer">
                                Official Website <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Phone /> Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    {currentTerm?.office && <p><strong>Office:</strong> {currentTerm.office}</p>}
                    {currentTerm?.phone && <p><strong>Phone:</strong> {currentTerm.phone}</p>}
                    {!currentTerm?.office && !currentTerm?.phone && (
                        <p className="text-muted-foreground">No public contact info available for this term.</p>
                    )}
                </CardContent>
            </Card>
        </div>

        <Card className="mt-8">
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
  );
}
