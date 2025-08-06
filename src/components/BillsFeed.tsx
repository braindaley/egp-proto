'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FeedBill } from '@/types';
import { FeedNavigation } from './FeedNavigation';
import { BillFeedCard } from './bill-feed-card';
import { Skeleton } from './ui/skeleton';
import { Card } from './ui/card';

export function BillsFeed() {
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [bills, setBills] = useState<FeedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // For now, both tabs fetch the same data.
      // This can be expanded later to fetch different data based on `activeTab`.
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
  }, [activeTab]); // Dependency on activeTab allows re-fetching when tab changes

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const renderContent = () => {
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
          <p className="text-muted-foreground">There are no bills to display for this section.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {bills.map((bill, index) => (
          <BillFeedCard key={`${bill.billNumber}-${index}`} bill={bill} index={index} />
        ))}
      </div>
    );
  };
  
  return (
    <div>
        <FeedNavigation activeTab={activeTab} onTabChange={setActiveTab} className="mb-6"/>
        {renderContent()}
    </div>
  );
}
