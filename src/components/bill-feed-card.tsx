
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getBillTypeSlug, formatDate } from '@/lib/utils';
import { Check, Dot, Users, Library, ArrowRight } from 'lucide-react';

interface FeedBill {
  shortTitle: string;
  billNumber: string;
  congress: number;
  type: string;
  number: string;
  latestAction: {
    actionDate: string;
    text: string;
  };
  sponsorParty: string;
  committeeName: string;
  status: string;
}

const BillStatusIndicator = ({ status }: { status: string }) => {
    const steps: string[] = ['Introduced', 'In Committee', 'Passed House', 'Passed Senate', 'To President', 'Became Law'];
    let currentStepIndex = steps.indexOf(status);

    if (currentStepIndex === -1) {
        currentStepIndex = 1; // Default to 'In Committee' if status is not found
    }

    const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

    return (
        <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1">
                {steps.map((step, index) => (
                    <span key={step} className={`text-center ${index === currentStepIndex ? 'font-bold text-primary' : ''}`}>
                        {step}
                    </span>
                ))}
            </div>
            <Progress value={progressPercentage} className="h-2" />
        </div>
    );
};

export function BillFeedCard({ bill }: { bill: FeedBill }) {
    const billTypeSlug = getBillTypeSlug(bill.type);
    const detailUrl = `/bill/${bill.congress}/${billTypeSlug}/${bill.number}`;

    const partyColor = bill.sponsorParty === 'R' ? 'bg-red-100 text-red-800' 
                     : bill.sponsorParty === 'D' ? 'bg-blue-100 text-blue-800'
                     : 'bg-gray-100 text-gray-800';

    return (
      <Card className="hover:shadow-lg transition-shadow duration-300 ease-in-out">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="font-headline text-lg leading-snug">
                <Link href={detailUrl} className="hover:underline text-primary">
                    {bill.shortTitle}
                </Link>
            </CardTitle>
            <Badge variant="outline" className="shrink-0">{bill.billNumber}</Badge>
          </div>
          <CardDescription className="flex items-center gap-4 text-xs pt-2">
            <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${partyColor}`}>
                <Users className="h-3 w-3" />
                Sponsor Party: {bill.sponsorParty}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
                <Library className="h-3 w-3" />
                {bill.committeeName}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <h4 className="font-semibold text-sm mb-1 text-foreground">Latest Action</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    <span className="font-bold">{formatDate(bill.latestAction.actionDate)}:</span>{' '}
                    {bill.latestAction.text}
                </p>
            </div>
             <BillStatusIndicator status={bill.status} />
        </CardContent>
        <CardFooter className="flex justify-end pt-4 border-t">
            <Link href={detailUrl} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                View Details <ArrowRight className="h-4 w-4" />
            </Link>
        </CardFooter>
      </Card>
    );
}
