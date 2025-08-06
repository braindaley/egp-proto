'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FeedNavigation } from '@/components/FeedNavigation';
import { BillFeedCard } from '@/components/bill-feed-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import type { FeedBill } from '@/types';

export default function BillsFeed() {
  const [allBills, setAllBills] = useState<FeedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/feed/bills');
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch bills: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setAllBills(data.bills || []);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const filteredBills = useMemo(() => {
    let bills = showAll ? allBills : allBills.filter(bill => bill.importanceScore >= 10);
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      bills = bills.filter(bill => 
        bill.shortTitle.toLowerCase().includes(lowercasedTerm) ||
        bill.billNumber.toLowerCase().includes(lowercasedTerm)
      );
    }
    return bills;
  }, [allBills, showAll, searchTerm]);

  const highPriorityCount = useMemo(() => allBills.filter(b => b.importanceScore >= 30).length, [allBills]);
  const mediumPriorityCount = useMemo(() => allBills.filter(b => b.importanceScore >= 10 && b.importanceScore < 30).length, [allBills]);
  const percentageShown = allBills.length > 0 ? ((filteredBills.length / allBills.length) * 100).toFixed(0) : 0;

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
          <div className="text-red-600 font-semibold">Could Not Load Bill Feed</div>
          <p className="text-sm text-muted-foreground mt-2">
            There was an issue fetching the latest bills. Please try again later.
          </p>
          <div className="text-xs text-red-500 mt-2 max-w-md mx-auto">
            Error: {error}
          </div>
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
    <div className="space-y-6">
      <FeedNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="space-y-4 p-4 border bg-card rounded-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title or bill number..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <Switch 
                  id="show-all-bills" 
                  checked={showAll}
                  onCheckedChange={setShowAll}
                />
                <Label htmlFor="show-all-bills">Show All Bills</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {showAll ? 'Showing all recent bills' : 'Hiding lower priority bills (score < 10)'}
            </p>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground">
        <p>
          Displaying {filteredBills.length} of {allBills.length} bills.
          {!showAll && ` (Top ${percentageShown}%)`}
        </p>
        <p>
          High Priority: {highPriorityCount} | Medium Priority: {mediumPriorityCount}
        </p>
      </div>

      {filteredBills.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bills Found</h3>
          <p className="text-gray-600">
            {searchTerm ? `No bills match your search term "${searchTerm}".` : 'There are no high-priority bills to display.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBills.map((bill, index) => (
            <BillFeedCard 
              key={`${bill.congress}-${bill.type}-${bill.number}`} 
              bill={bill} 
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}