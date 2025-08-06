
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Bill } from '@/types';
import { BillFeedCard } from '@/components/bill-feed-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

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

function BillFeed() {
  const [bills, setBills] = useState<FeedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function getBills() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/feed/bills');
        if (!res.ok) {
          throw new Error(`Failed to fetch bills: ${res.statusText}`);
        }
        const data = await res.json();
        setBills(data.bills || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    getBills();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
                <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
                <Skeleton className="h-10 w-full mt-4" />
                <Skeleton className="h-4 w-full mt-2" />
            </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 px-6 bg-destructive/10 rounded-lg">
        <h2 className="text-xl font-semibold text-destructive mb-2">Could Not Load Bill Feed</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-card rounded-lg">
        <h2 className="text-xl font-semibold mb-2">No Bills Found</h2>
        <p className="text-muted-foreground">There are no recent bills to display at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bills.map((bill, index) => (
        <BillFeedCard key={`${bill.billNumber}-${index}`} bill={bill} />
      ))}
    </div>
  );
}


export default function Home() {
  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <BillFeed />
        </div>
      </div>
    </div>
  );
}
