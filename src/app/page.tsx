
'use client';

import { useState, useEffect } from 'react';
import { BillFeedCard } from '@/components/BillFeedCard';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Home() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBills = async () => {
    console.log('🚀 fetchBills called');
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching bills...');
      
      const response = await fetch('/api/feed/bills', {
        cache: 'no-cache',
      });

      console.log('📨 Response status:', response.status);
      if (!response.ok) {
        throw new Error(`Failed to fetch bills: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Got bills:', result.bills?.length);
      setBills(result.bills || []);
    } catch (err) {
      console.error('❌ Error fetching bills:', err);
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
      console.log('✨ Loading complete');
    }
  };

  useEffect(() => {
    console.log('🎯 Component mounted, fetching bills...');
    fetchBills();
  }, []);

  if (loading) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Loading Latest Bills</p>
                  <p className="text-sm text-muted-foreground">
                    Fetching the most recent congressional activity...
                  </p>
                  <Button onClick={fetchBills} className="mt-4">
                    Click to Load Manually
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error loading bills: {error}
                <Button onClick={fetchBills} className="mt-2">
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Latest Bills ({bills.length})</h1>
            {bills.map((bill, index) => (
              <BillFeedCard key={`${bill.congress}-${bill.type}-${bill.number}`} bill={bill} />
            ))}
            {bills.length === 0 && (
              <p className="text-center text-muted-foreground">No bills found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
