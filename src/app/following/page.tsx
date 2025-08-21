'use client';

import { BillFeedCard } from '@/components/BillFeedCard';
import { Loader2, AlertCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWatchedGroups } from '@/hooks/use-watched-groups';
import { useWatchedBills } from '@/hooks/use-watched-bills';
import { getAdvocacyGroupData } from '@/lib/advocacy-groups';
import { campaignsService } from '@/lib/campaigns';
import { useBills } from '@/hooks/use-bills';
import Link from 'next/link';
import { useMemo } from 'react';
import type { FeedBill } from '@/types';

export default function FollowingPage() {
  const { watchedGroups } = useWatchedGroups();
  const { watchedBills } = useWatchedBills();
  const { data: allBills = [], isLoading: loading, error, refetch } = useBills();

  console.log('Debug Following Page:', {
    watchedGroups,
    watchedBills,
    allBillsCount: allBills.length,
    loading,
    error
  });

  // Filter bills to show only those from watched groups or individually watched
  const followingBills = useMemo(() => {
    if (!allBills.length) return [];

    // Get bills from watched groups (campaigns)
    const groupBills: FeedBill[] = [];
    for (const groupSlug of watchedGroups) {
      const groupData = getAdvocacyGroupData(groupSlug);
      console.log('Group data for', groupSlug, ':', groupData);
      if (!groupData) continue;

      // Get campaigns for this group and match with bills from feed
      const campaigns = campaignsService.getCampaignsByGroup(groupSlug);
      console.log('Campaigns for', groupSlug, ':', campaigns);
      for (const campaign of campaigns) {
        const matchingBill = allBills.find(bill => 
          bill.congress === campaign.bill.congress &&
          bill.type === campaign.bill.type &&
          bill.number === campaign.bill.number
        );
        if (matchingBill) {
          groupBills.push(matchingBill);
          console.log('Found matching bill from campaign:', matchingBill);
        }
      }

      // Fallback to legacy priority bills if no campaigns
      if (campaigns.length === 0 && groupData.priorityBills) {
        console.log('Using legacy priority bills for', groupSlug);
        for (const priorityBill of groupData.priorityBills) {
          const matchingBill = allBills.find(bill => 
            bill.congress === priorityBill.bill.congress &&
            bill.type === priorityBill.bill.type &&
            bill.number === priorityBill.bill.number
          );
          if (matchingBill) {
            groupBills.push(matchingBill);
            console.log('Found matching bill from priority:', matchingBill);
          }
        }
      }
    }

    // Get individually watched bills
    const individualBills = watchedBills.map(watchedBill => {
      const found = allBills.find(bill => 
        bill.congress === watchedBill.congress &&
        bill.type === watchedBill.type &&
        bill.number === watchedBill.number
      );
      if (found) {
        console.log('Found individually watched bill:', found);
      }
      return found;
    }).filter(Boolean) as FeedBill[];

    console.log('Group bills:', groupBills.length, 'Individual bills:', individualBills.length);

    // Combine and deduplicate
    const combinedBills = [...groupBills, ...individualBills];
    const uniqueBills = combinedBills.filter((bill, index, array) => 
      array.findIndex(b => 
        b.congress === bill.congress && 
        b.type === bill.type && 
        b.number === bill.number
      ) === index
    );

    console.log('Final following bills:', uniqueBills);

    // Sort by importance score (same as homepage)
    return uniqueBills.sort((a, b) => b.importanceScore - a.importanceScore);
  }, [allBills, watchedGroups, watchedBills]);

  if (loading) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Loading Following Feed</p>
                  <p className="text-sm text-muted-foreground">
                    Fetching bills you're following...
                  </p>
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

  if (watchedGroups.length === 0 && watchedBills.length === 0) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Start Following Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  You're not following any advocacy groups or bills yet. Start watching groups or individual bills to see them in your following feed.
                </p>
                <div className="flex gap-3">
                  <Button asChild>
                    <Link href="/groups">
                      Browse Groups
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/">
                      Browse Bills
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
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
            <h1 className="text-2xl font-bold">Following ({followingBills.length})</h1>
            {followingBills.length > 0 ? (
              followingBills.map((bill, index) => (
                <BillFeedCard key={`${bill.congress}-${bill.type}-${bill.number}`} bill={bill} index={index} />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No bills to show. Watch individual bills or follow groups to see content here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}