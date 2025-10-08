
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
import { ArrowRight, Landmark, CalendarDays, Mail } from 'lucide-react';
import { getBillTypeSlug } from '@/lib/utils';
import { useBillSupportCounts } from '@/hooks/use-bill-support-counts';

function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function BillCard({ bill }: { bill: Bill }) {
  const billTypeSlug = getBillTypeSlug(bill.type);
  const detailUrl = `/federal/bill/${bill.congress}/${billTypeSlug}/${bill.number}`;

  // Get real support counts from Firestore
  const { supportCount, opposeCount, loading: countsLoading } = useBillSupportCounts(
    bill.congress!,
    bill.type!,
    bill.number!
  );

  return (
    <Link href={detailUrl} className="flex">
        <Card className="flex flex-col h-full bg-card hover:shadow-accent/20 hover:shadow-lg transition-shadow duration-300 ease-in-out w-full">
        <CardHeader>
            <CardTitle className="font-headline text-xl leading-snug text-primary">
            {bill.shortTitle || bill.title}
            </CardTitle>
            <CardDescription className="pt-2 font-medium !text-foreground/80">{bill.type} {bill.number}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
            <div className="flex gap-2">
                
                <Badge variant="outline" className="flex items-center gap-1.5">
                    <Landmark className="h-3 w-3" />
                    {bill.originChamber}
                </Badge>
            </div>
            {bill.latestAction && (
                <div>
                    <h4 className="font-headline font-semibold text-sm mb-1 text-foreground">Latest Action</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        <span className="font-bold">{formatDate(bill.latestAction.actionDate)}:</span>{' '}
                        {bill.latestAction.text}
                    </p>
                </div>
            )}
            
            {/* Support/Oppose counts */}
            <div className="flex items-center justify-around text-center py-2 border-t border-b">
                <div className="flex items-center gap-2 text-green-600">
                    <Mail className="h-4 w-4" />
                    <div>
                        <p className="font-bold text-sm" title={`${countsLoading ? '...' : supportCount.toLocaleString()} ${supportCount === 1 ? 'person contacted' : 'people contacted'} their representative in support`}>
                            {countsLoading ? '...' : supportCount.toLocaleString()}
                        </p>
                        <p className="text-xs font-medium">Support</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                    <Mail className="h-4 w-4" />
                    <div>
                        <p className="font-bold text-sm" title={`${countsLoading ? '...' : opposeCount.toLocaleString()} ${opposeCount === 1 ? 'person contacted' : 'people contacted'} their representative in opposition`}>
                            {countsLoading ? '...' : opposeCount.toLocaleString()}
                        </p>
                        <p className="text-xs font-medium">Oppose</p>
                    </div>
                </div>
            </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t mt-auto">
            <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Updated: {formatDate(bill.updateDate)}</span>
            </div>
             <div className="flex items-center gap-1 font-semibold text-primary">
                <span>View Bill</span>
                <ArrowRight className="h-3.5 w-3.5" />
            </div>
        </CardFooter>
        </Card>
    </Link>
  );
}
