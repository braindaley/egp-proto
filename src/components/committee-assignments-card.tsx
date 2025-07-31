'use client';
import { useState, useEffect } from 'react';
import type { Member } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getCommitteeAssignments, type CommitteeAssignmentsData } from '@/ai/flows/get-committee-assignments-flow';
import { Briefcase } from 'lucide-react';

function formatDate(dateString: string | undefined | number) {
    if (!dateString) return 'N/A';
    if (typeof dateString === 'number') return dateString.toString();
    const date = new Date(dateString.includes('T') || dateString.includes('GMT') ? dateString : `${dateString}T12:00:00Z`);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function getCurrentTerm(terms: any) {
    let termsArray: any[] = [];
    if (Array.isArray(terms)) {
        termsArray = terms;
    } else if (terms && typeof terms === 'object' && Array.isArray(terms.item)) {
        termsArray = terms.item;
    } else {
        return undefined;
    }
    if (termsArray.length === 0) return undefined;
    const currentYear = new Date().getFullYear();
    const activeTerm = termsArray.find(term => {
        if (!term.endYear || term.endYear === null || term.endYear === undefined) {
            return term.startYear <= currentYear;
        }
        return term.startYear <= currentYear && term.endYear >= currentYear;
    });
    if (activeTerm) return activeTerm;
    const sortedTerms = [...termsArray].sort((a, b) => (b.congress || 0) - (a.congress || 0));
    return sortedTerms[0];
}

export const CommitteeAssignmentsCard = ({ member, congress }: { member: Member, congress: string }) => {
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
        return null;
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
