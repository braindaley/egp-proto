'use client';

import { BillCarouselCard } from '@/components/BillCarouselCard';
import RecentMessages from '@/components/RecentMessages';
import CongressMembers from '@/components/CongressMembers';
import WatchedGroups from '@/components/WatchedGroups';
import Campaigns from '@/components/Campaigns';
import NavigationCard from '@/components/NavigationCard';
import { LoggedOutCard } from '@/components/LoggedOutCard';
import { Loader2, AlertCircle, MessageSquare, Megaphone, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBills } from '@/hooks/use-bills';
import { useAuth } from '@/hooks/use-auth';

export default function ForYou() {
  const { data: bills = [], isLoading: loading, error, refetch } = useBills();
  const { user } = useAuth();
  const router = useRouter();

  const handleFindOfficials = (zipCode: string) => {
    router.push(`/federal/congress/119/states?zip=${zipCode}`);
  };

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
                  <Button onClick={() => refetch()} className="mt-4">
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
                Error loading bills: {error?.message || 'Unknown error'}
                <Button onClick={() => refetch()} className="mt-2">
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Log all unique statuses
  const uniqueStatuses = [...new Set(bills.map(bill => bill.status))];
  console.log('All unique bill statuses:', uniqueStatuses);
  console.log('Total bills fetched:', bills.length);
  
  // Sample of bills with their statuses and latest actions
  if (bills.length > 0) {
    console.log('Sample bills:', bills.slice(0, 5).map(b => ({
      number: b.billNumber,
      status: b.status,
      latestAction: b.latestAction?.text
    })));
  }
  
  // Filter bills to only show those that have advanced past introduction
  // Include: Passed House, Passed Senate, To President, Reported from Committee, In Committee
  // Exclude: Introduced, Became Law
  const filteredBills = bills.filter(bill => 
    bill.status === 'Passed House' || 
    bill.status === 'Passed Senate' || 
    bill.status === 'To President' ||
    bill.status === 'Reported from Committee' ||
    bill.status === 'In Committee'
  );
  
  console.log('Filtered bills count:', filteredBills.length);
  console.log('Filtered bill statuses:', [...new Set(filteredBills.map(b => b.status))]);

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-[672px] mx-auto">
          <div className="space-y-4">
            {filteredBills.map((bill, index) => (
              <BillCarouselCard key={`${bill.congress}-${bill.type}-${bill.number}`} bill={bill} index={index} />
            ))}
            {filteredBills.length === 0 && (
              <p className="text-center text-muted-foreground">No bills currently in active legislative progress</p>
            )}
            {filteredBills.length > 0 && filteredBills.length < 20 && (
              <p className="text-center text-muted-foreground text-sm">
                Showing {filteredBills.length} bill{filteredBills.length === 1 ? '' : 's'} in active progress
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}