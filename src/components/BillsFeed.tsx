
'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeedNavigation } from '@/components/FeedNavigation';
import { BillFeedCard } from '@/components/bill-feed-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { FeedBill } from '@/types';

export default function BillsFeed() {
  const [bills, setBills] = useState<FeedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/feed/bills');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch bills: ${response.statusText}`);
      }
      
      const data = await response.json();
      setBills(data.bills || []);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  if (loading) {
    return (
      <div className="space-y-4">
        <FeedNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="space-y-4 pt-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <FeedNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="text-center py-8">
          <div className="text-red-600">Could Not Load Bill Feed</div>
           <p className="text-sm text-muted-foreground mt-2">There was an issue fetching the latest bills. Please try again later.</p>
          <button 
            onClick={fetchBills}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FeedNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {bills.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bills Found</h3>
          <p className="text-gray-600">There are no bills to display for this section.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bills.map((bill, index) => (
            <BillFeedCard key={`${bill.billNumber}-${index}`} bill={bill} />
          ))}
        </div>
      )}
    </div>
  );
}
