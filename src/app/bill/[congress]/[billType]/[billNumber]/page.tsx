
'use client';

import { useParams } from 'next/navigation';
import { BillDetailClient } from '@/components/bill-detail-client';
import { useBillDetail } from '@/hooks/use-bill-detail';
import { Loader2 } from 'lucide-react';

export default function BillDetailPage() {
  const params = useParams();
  const { congress, billType, billNumber } = params;
  
  const { 
    data: bill, 
    isLoading: loading, 
    error 
  } = useBillDetail(
    congress as string | null, 
    billType as string | null, 
    billNumber as string | null
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
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
            <div>Error loading bill: {error?.message || 'Unknown error'}</div>
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
