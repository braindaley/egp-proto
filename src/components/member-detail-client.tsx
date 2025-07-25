
'use client';

import type { Member } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Building, Calendar, MapPin, Party, User, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

function formatDate(dateString: string | undefined) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function MemberDetailClient({ member }: { member: Member }) {
  const partyColor = member.partyName === 'Democrat' 
    ? 'bg-blue-600' 
    : member.partyName === 'Republican' 
    ? 'bg-red-600' 
    : 'bg-gray-500';

  const currentTerm = member.terms.item?.[member.terms.item.length - 1];

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
                 <div className="mt-4 flex gap-2 justify-center md:justify-start">
                    <Badge className={`text-white text-base px-4 py-1 ${partyColor}`}>{member.partyName}</Badge>
                    {currentTerm?.congress && <Badge variant="secondary" className="text-base px-4 py-1">{currentTerm.congress}th Congress</Badge>}
                </div>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User /> Basic Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <p><strong>Full Name:</strong> {member.directOrderName}</p>
                    <p><strong>First Name:</strong> {member.firstName}</p>
                    <p><strong>Last Name:</strong> {member.lastName}</p>
                    <p><strong>Date of Birth:</strong> {formatDate(member.birthDate)}</p>
                    {member.deathDate && <p><strong>Date of Death:</strong> {formatDate(member.deathDate)}</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building /> Current Term</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    {currentTerm ? (
                        <>
                            <p><strong className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> State/District:</strong> {member.state} {currentTerm.district ? `- District ${currentTerm.district}` : ''}</p>
                            <p><strong className="flex items-center gap-1.5"><Party className="h-4 w-4" /> Party:</strong> {currentTerm.partyName}</p>
                            <p><strong className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Term Start:</strong> {formatDate(currentTerm.startYear?.toString())}</p>
                            <p><strong className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Term End:</strong> {formatDate(currentTerm.endYear?.toString())}</p>
                        </>
                    ) : <p>No current term information available.</p>}
                </CardContent>
            </Card>
        </div>

        {member.officialWebsiteUrl && (
             <div className="mt-8 text-center">
                <Button asChild>
                    <a href={member.officialWebsiteUrl} target="_blank" rel="noopener noreferrer">
                        Official Website <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                </Button>
            </div>
        )}

        <Card className="mt-8">
            <CardHeader>
                <CardTitle>All Terms of Service</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="space-y-4">
                    {member.terms?.item?.slice().reverse().map((term, index) => (
                        <div key={index} className="p-3 bg-secondary/50 rounded-md text-sm">
                            <p className="font-semibold">{term.congress}th Congress ({term.startYear} - {term.endYear})</p>
                            <p className="text-muted-foreground">{term.chamber} - {term.partyName}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
