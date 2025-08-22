
'use client';

import { BillFeedCard } from '@/components/BillFeedCard';
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

export default function Home() {
  const { data: bills = [], isLoading: loading, error, refetch } = useBills();
  const { user } = useAuth();
  const router = useRouter();

  const handleFindOfficials = (zipCode: string) => {
    router.push(`/congress/119/states?zip=${zipCode}`);
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
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <div className="flex gap-6">
          {/* Left sidebar */}
          <div className="w-64 flex-shrink-0 space-y-4">
            <NavigationCard />
            {user ? (
              <Campaigns />
            ) : (
              <LoggedOutCard 
                headline="Activate your advocacy group"
                helperText="Use our advanced technology to amplify voter intent."
                buttonText="Get started"
                useTextLink={true}
                icon={Megaphone}
              />
            )}
          </div>
          
          {/* Center - Bills Feed */}
          <div className="flex-1 max-w-[672px]">
            <div className="space-y-4">
              {bills.map((bill, index) => (
                <BillFeedCard key={`${bill.congress}-${bill.type}-${bill.number}`} bill={bill} />
              ))}
              {bills.length === 0 && (
                <p className="text-center text-muted-foreground">No bills found</p>
              )}
            </div>
          </div>
          
          {/* Right sidebar */}
          <div className="w-64 flex-shrink-0 space-y-4">
            {user ? (
              <>
                <RecentMessages />
                <CongressMembers />
                <WatchedGroups />
              </>
            ) : (
              <>
                <LoggedOutCard 
                  headline="Voice your opinion"
                  helperText="Easily send your opinions to officials and make a difference."
                  icon={MessageSquare}
                  showAsLink={true}
                  buttonHref="/dashboard/messages"
                />
                <LoggedOutCard 
                  headline="Find your officials"
                  helperText="Enter your zip code to find your officials."
                  buttonText="Find your officials"
                  showZipCodeField={true}
                  onFindOfficials={handleFindOfficials}
                />
                <LoggedOutCard 
                  headline="Groups"
                  helperText="Find out what your favorite advocacy group supports and opposes."
                  buttonText="Browse groups"
                  buttonHref="/groups"
                  useTextLink={true}
                  icon={Users}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
