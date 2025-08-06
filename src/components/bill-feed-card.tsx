
'use client';

import type { Bill } from '@/types';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowRight, CalendarDays, Gavel } from 'lucide-react';
import { getBillTypeSlug, formatDate } from '@/lib/utils';
import { BillTracker } from '@/components/bill-tracker';

export function BillFeedCard({ bill }: { bill: Bill }) {
    if (!bill) {
        return null;
    }
    
    const billTypeSlug = getBillTypeSlug(bill.type);
    const detailUrl = `/bill/${bill.congress}/${billTypeSlug}/${bill.number}`;

    const sponsor = bill.sponsors?.[0];
    const committee = bill.committees?.items?.[0];

    return (
        <Card className="flex flex-col h-full bg-card hover:shadow-accent/20 hover:shadow-lg transition-shadow duration-300 ease-in-out w-full">
            <CardHeader className="flex flex-row items-start gap-4">
                {sponsor && (
                     <Avatar>
                        <AvatarImage src={sponsor.url?.replace('.json', '_200.jpg')} alt={sponsor.fullName} />
                        <AvatarFallback>{sponsor.firstName?.[0]}{sponsor.lastName?.[0]}</AvatarFallback>
                    </Avatar>
                )}
                <div className="flex-1">
                    <CardTitle className="font-headline text-lg leading-snug text-primary">
                        <Link href={detailUrl} className="hover:underline">
                            {bill.shortTitle || bill.title}
                        </Link>
                    </CardTitle>
                    <CardDescription className="pt-1 font-medium text-foreground/80 flex items-center gap-2 flex-wrap">
                        <span>{bill.type} {bill.number}</span>
                        {sponsor && (
                            <>
                             <span>&bull;</span>
                             <span>Sponsor: {sponsor.fullName} ({sponsor.party}-{sponsor.state})</span>
                            </>
                        )}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                 {committee && (
                    <div className="flex items-center gap-2">
                        <Gavel className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Referred to {committee.name}</span>
                    </div>
                 )}
                
                {bill.latestAction && (
                    <div className="text-sm text-muted-foreground line-clamp-3">
                        <p className="font-semibold text-foreground mb-2">Latest Action:</p>
                        <p>
                          <span className="font-bold">{formatDate(bill.latestAction.actionDate)}:</span>{' '}
                          {bill.latestAction.text}
                        </p>
                    </div>
                )}
                
                <div className="pt-4">
                    <BillTracker latestAction={bill.latestAction} originChamber={bill.originChamber} />
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t mt-auto">
                <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>Updated: {formatDate(bill.updateDate)}</span>
                </div>
                <Link href={detailUrl} className="flex items-center gap-1 font-semibold text-primary">
                    <span>View Bill</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </CardFooter>
        </Card>
    );
}
