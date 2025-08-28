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

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-[672px] mx-auto">
          <div className="space-y-4">
            {bills.slice(0, 20).map((bill, index) => (
              <BillCarouselCard key={`${bill.congress}-${bill.type}-${bill.number}`} bill={bill} index={index} />
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