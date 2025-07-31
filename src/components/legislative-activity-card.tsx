'use client';

import { useState, useEffect } from 'react';
import type { Member, SponsoredLegislation, CosponsoredLegislation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getBillTypeSlug } from '@/lib/utils';
import { Gavel, ChevronsUpDown } from 'lucide-react';

function formatDate(dateString: string | undefined | number) {
    if (!dateString) return 'N/A';
    if (typeof dateString === 'number') return dateString.toString();
    const date = new Date(dateString.includes('T') || dateString.includes('GMT') ? dateString : `${dateString}T12:00:00Z`);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

interface ExtraData {
    sponsoredLegislation: SponsoredLegislation[];
    cosponsoredLegislation: CosponsoredLegislation[];
}

export const LegislativeActivityCard = ({ member }: { member: Member }) => {
    const [extraData, setExtraData] = useState<ExtraData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchExtraData() {
            if (!member.bioguideId) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            const bioguideId = member.bioguideId;

            try {
                const [sponsoredRes, cosponsoredRes] = await Promise.allSettled([
                    fetch(`${baseUrl}/api/congress/member/${bioguideId}/sponsored-legislation`),
                    fetch(`${baseUrl}/api/congress/member/${bioguideId}/cosponsored-legislation`),
                ]);

                const sponsoredLegislation = sponsoredRes.status === 'fulfilled' && sponsoredRes.value.ok ? await sponsoredRes.value.json() : [];
                const cosponsoredLegislation = cosponsoredRes.status === 'fulfilled' && cosponsoredRes.value.ok ? await cosponsoredRes.value.json() : [];
                
                setExtraData({
                    sponsoredLegislation,
                    cosponsoredLegislation,
                });
            } catch (error) {
                console.error("Failed to fetch extra member data", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchExtraData();
    }, [member.bioguideId]);

    const sponsoredLegislation = extraData?.sponsoredLegislation || [];
    const cosponsoredLegislation = extraData?.cosponsoredLegislation || [];
    const sponsoredCount = member.sponsoredLegislation?.count || 0;
    const cosponsoredCount = member.cosponsoredLegislation?.count || 0;

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-2/5" />
                    <Skeleton className="h-4 w-4/5 mt-2" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!sponsoredCount && !cosponsoredCount) {
        return null;
    }

    return (
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
                                View Recent Sponsored Bills ({sponsoredLegislation.length})
                                <ChevronsUpDown className="h-4 w-4" />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                            {sponsoredLegislation.map((bill) => (
                                <div key={`${bill.congress}-${bill.type}-${bill.number}`} className="p-3 bg-secondary/50 rounded-md">
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
                                <div key={`${bill.congress}-${bill.type}-${bill.number}`} className="p-3 bg-secondary/50 rounded-md">
                                    <Link href={`/bill/${bill.congress}/${getBillTypeSlug(bill.type)}/${bill.number}`} className="font-semibold hover:underline">{bill.type} {bill.number}: {bill.title}</Link>
                                    <p className="text-xs text-muted-foreground mt-1">Cosponsored: {formatDate(bill.cosponsoredDate)}</p>
                                </div>
                            ))}
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </CardContent>
        </Card>
    );
};
