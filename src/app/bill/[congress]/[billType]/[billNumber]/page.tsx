
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
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div className="text-lg">Loading bill details...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isTemporaryError = error?.message?.includes('technical difficulties') || 
                            error?.message?.includes('try again later');
    
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <div className={`text-lg font-medium mb-4 ${isTemporaryError ? 'text-yellow-600' : 'text-red-500'}`}>
                {isTemporaryError ? 'Service Temporarily Unavailable' : 'Error Loading Bill'}
              </div>
              <div className="text-gray-600 mb-4">
                {error?.message || 'Unknown error occurred while loading the bill details.'}
              </div>
              {isTemporaryError && (
                <div className="text-sm text-gray-500">
                  This is a temporary issue with the Congress.gov data service. Please try refreshing the page in a few minutes.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div>Bill not found</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <BillDetailClient bill={bill} />
      </div>
    </div>
  );
}
