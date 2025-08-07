'use client';

import { useEffect, useState } from 'react';
import { BillFeedCard } from './BillFeedCard';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { FeedBill } from '@/types';

interface BillsFeedData {
  bills: FeedBill[];
  error?: string;
}

export default function BillsFeed() {
  const [data, setData] = useState<BillsFeedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/feed/bills', {
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch bills: ${response.status} - ${errorData}`);
      }

      const result: BillsFeedData = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      setData(result);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleRetry = () => {
    fetchBills();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <p className="text-lg font-medium">Loading Latest Bills</p>
            <p className="text-sm text-muted-foreground">
              Fetching the most recent congressional activity...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold">Could Not Load Bill Feed</h3>
              <AlertDescription className="mt-1">
                There was an issue fetching the latest bills. Please try again later.
              </AlertDescription>
              <AlertDescription className="mt-2 text-xs opacity-90">
                Error: {error}
              </AlertDescription>
            </div>
            <Button 
              onClick={handleRetry} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (!data || !data.bills || data.bills.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <h3 className="text-lg font-medium">No Bills Available</h3>
            <p className="text-muted-foreground">
              No recent congressional bills were found. Please check back later.
            </p>
          </div>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Latest Congressional Bills</h1>
          <Button 
            onClick={handleRetry} 
            variant="ghost" 
            size="sm"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <p className="text-muted-foreground">
          Showing {data.bills.length} recent bills from the 119th Congress, ranked by importance and activity.
        </p>
      </div>

      {/* Bills Grid */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
        {data.bills.map((bill, index) => (
          <BillFeedCard 
            key={`${bill.congress}-${bill.type}-${bill.number}`}
            bill={bill} 
            index={index}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="text-center pt-6 border-t">
        <p className="text-sm text-muted-foreground">
          Data provided by the U.S. Congress API • Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}