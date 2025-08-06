
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getBillTypeSlug, formatDate } from '@/lib/utils';
import { Check, Dot, Users, Library, ArrowRight, ThumbsUp, ThumbsDown, Eye, Flame, TrendingUp } from 'lucide-react';

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

const PrognosisBadge = ({ status }: { status: string }) => {
    const prognoses: { [key: string]: { value: number, text: string, color: string } } = {
        'Introduced': { value: 10, text: '10% Chance', color: 'bg-gray-100 text-gray-800' },
        'In Committee': { value: 10, text: '10% Chance', color: 'bg-gray-100 text-gray-800' },
        'Passed House': { value: 33, text: '33% Chance', color: 'bg-blue-100 text-blue-800' },
        'Passed Senate': { value: 60, text: '60% Chance', color: 'bg-blue-100 text-blue-800' },
        'To President': { value: 75, text: '75% Chance', color: 'bg-yellow-100 text-yellow-800' },
        'Became Law': { value: 100, text: '100% Enacted', color: 'bg-green-100 text-green-800' }
    };
    const prognosis = prognoses[status] || prognoses['Introduced'];
    return (
        <Badge variant="outline" className={`flex items-center gap-1.5 ${prognosis.color}`}>
            <TrendingUp className="h-3 w-3" />
            {prognosis.text}
        </Badge>
    );
};

export function BillFeedCard({ bill, index }: { bill: FeedBill, index?: number }) {
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
            <div className="flex items-center gap-2">
                {index !== undefined && index < 10 && (
                    <Flame className="h-4 w-4 text-orange-500" title="Popular Bill"/>
                )}
                <Badge variant="outline" className="shrink-0">{bill.billNumber}</Badge>
            </div>
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
        <CardFooter className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-1.5"><ThumbsUp className="h-4 w-4"/>Support</Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5"><ThumbsDown className="h-4 w-4"/>Oppose</Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground"><Eye className="h-4 w-4"/>Watch</Button>
            </div>
            <PrognosisBadge status={bill.status} />
        </CardFooter>
      </Card>
    );
}
