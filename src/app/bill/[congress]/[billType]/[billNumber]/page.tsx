
'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { BillDetailClient } from '@/components/bill-detail-client';
import type { Bill } from '@/types';

export default function BillDetailPage() {
  const params = useParams();
  const { congress, billType, billNumber } = params;
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBill() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/bill?congress=${congress}&billType=${billType}&billNumber=${billNumber}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch bill: ${response.status}`);
        }
        
        const billData = await response.json();
        setBill(billData);
      } catch (err) {
        console.error('Error fetching bill:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (congress && billType && billNumber) {
      fetchBill();
    }
  }, [congress, billType, billNumber]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-lg">Loading bill details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-center py-12">
          <div className="text-center text-red-500">
            <div>Error loading bill: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div>Bill not found</div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <BillDetailClient bill={bill} />
    </div>
  );
}
