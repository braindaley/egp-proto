'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getBillTypeSlug } from '@/lib/utils';
import type { PriorityBill } from '@/lib/advocacy-groups';
import { ThumbsUp, ThumbsDown, Eye, ArrowRight } from 'lucide-react';

export function AdvocacyBillCard({ priorityBill }: { priorityBill: PriorityBill }) {
  const { bill, position, reasoning, supportCount, opposeCount, actionButtonText } = priorityBill;
  const [userSupport, setUserSupport] = useState<'none' | 'support' | 'oppose'>('none');
  const [isWatched, setIsWatched] = useState(false);

  const billTypeSlug = getBillTypeSlug(bill.type!);
  const detailUrl = `/bill/${bill.congress}/${billTypeSlug}/${bill.number}`;

  const handleSupport = () => setUserSupport(prev => (prev === 'support' ? 'none' : 'support'));
  const handleOppose = () => setUserSupport(prev => (prev === 'oppose' ? 'none' : 'oppose'));

  const summaryText = bill.summaries?.items?.[0]?.text
    ? (bill.summaries.items[0].text.replace(/<[^>]*>/g, '').substring(0, 250) + '...')
    : 'No summary available.';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline">{bill.type} {bill.number}</Badge>
        </div>
        <CardTitle className="text-xl font-headline">
          <Link href={detailUrl} className="hover:underline">
            {bill.title}
          </Link>
        </CardTitle>
        <div className="text-sm text-muted-foreground mt-2 mb-3">
          {bill.latestAction?.text || 'In Committee'}
        </div>
        <CardDescription className="pt-2">{summaryText}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`p-3 rounded-md border-l-4 ${position === 'Support' ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'}`}>
            <h3 className={`font-semibold text-lg mb-3 ${position === 'Support' ? 'text-green-800' : 'text-red-800'}`}>
                {position}
            </h3>
            <div 
                className="prose prose-sm max-w-none text-muted-foreground prose-h3:font-semibold prose-h3:text-lg prose-h3:mb-2 prose-ul:list-disc prose-ul:pl-5 mb-4" 
                dangerouslySetInnerHTML={{ __html: reasoning }} 
            />
            <Button className="w-full" size="sm">
                {actionButtonText || "Write Congress to Make an Impact"}
            </Button>
        </div>

        <div className="flex justify-around items-center text-center pt-4">
            <div>
                <p className="text-3xl font-bold text-green-600">{supportCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Supporters</p>
            </div>
             <div className="h-12 border-l border-border"></div>
            <div>
                <p className="text-3xl font-bold text-red-600">{opposeCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Opponents</p>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch space-y-4">
        <div className="flex gap-2">
            <Button onClick={handleSupport} variant={userSupport === 'support' ? 'default' : 'outline'} className="flex-1">
                <ThumbsUp className="mr-2 h-4 w-4"/> Support
            </Button>
            <Button onClick={handleOppose} variant={userSupport === 'oppose' ? 'destructive' : 'outline'} className="flex-1">
                <ThumbsDown className="mr-2 h-4 w-4"/> Oppose
            </Button>
            <Button onClick={() => setIsWatched(!isWatched)} variant={isWatched ? "secondary" : "ghost"} size="icon">
                <Eye className="h-5 w-5"/>
            </Button>
        </div>
        <Button asChild variant="link" className="text-muted-foreground">
            <Link href={detailUrl}>View Bill Details <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </CardFooter>
    </Card>
  );
}