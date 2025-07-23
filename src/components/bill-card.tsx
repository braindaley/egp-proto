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
import { ExternalLink, Landmark, CalendarDays } from 'lucide-react';
import { Button } from './ui/button';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function BillCard({ bill }: { bill: Bill }) {
  const billType = bill.type.toLowerCase().replace('.', '');
  const detailUrl = `/bill/${bill.congress}/${billType}/${bill.number}`;

  return (
    <Link href={detailUrl} className="flex">
        <Card className="flex flex-col h-full bg-card hover:shadow-accent/20 hover:shadow-lg transition-shadow duration-300 ease-in-out w-full">
        <CardHeader>
            <CardTitle className="font-headline text-xl leading-snug text-primary">
            {bill.title}
            </CardTitle>
            <CardDescription className="pt-2 font-medium !text-foreground/80">{bill.number}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
            <div className="flex gap-2">
                <Badge variant="secondary" className="font-semibold">{bill.type}</Badge>
                <Badge variant="outline" className="flex items-center gap-1.5">
                    <Landmark className="h-3 w-3" />
                    {bill.originChamber}
                </Badge>
            </div>
            <div>
            <h4 className="font-headline font-semibold text-sm mb-1 text-foreground">Latest Action</h4>
            <p className="text-sm text-muted-foreground line-clamp-3">
                <span className="font-bold">{formatDate(bill.latestAction.actionDate)}:</span>{' '}
                {bill.latestAction.text}
            </p>
            </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t mt-auto">
            <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Updated: {formatDate(bill.updateDate)}</span>
            </div>
             <div className="flex items-center gap-1 font-semibold text-primary">
                <span>Read More</span>
                <ExternalLink className="h-3.5 w-3.5" />
            </div>
        </CardFooter>
        </Card>
    </Link>
  );
}