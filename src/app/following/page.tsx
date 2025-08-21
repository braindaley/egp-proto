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
import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { FeedBill, Bill } from '@/types';

// Function to convert campaign bill or Bill to FeedBill for display
function convertToFeedBill(bill: any, groupName: string): FeedBill {
  // Handle campaign bill format (simpler) vs full Bill format
  const congress = bill.congress || 119;
  const type = bill.type || 'HR';
  const number = bill.number || '1';
  const title = bill.title || bill.shortTitle || `${type} ${number}`;
  
  return {
    congress,
    type,
    number,
    billNumber: `${type} ${number}`,
    shortTitle: title,
    summary: bill.summary || `Bill ${type} ${number} supported by ${groupName}`,
    status: bill.latestAction?.text || 'Introduced',
    latestAction: {
      text: bill.latestAction?.text || 'Introduced',
      actionDate: bill.latestAction?.actionDate || new Date().toISOString()
    },
    sponsorFullName: 'Unknown',
    sponsorParty: 'I',
    sponsorImageUrl: '',
    committeeName: `Supported by ${groupName}`,
    importanceScore: 5,
    subjects: bill.subjects || []
  };
}

export default function FollowingPage() {
  const { watchedGroups } = useWatchedGroups();
  const { watchedBills } = useWatchedBills();
  const [bills, setBills] = useState<FeedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWatchedContent = async () => {
      try {
        setLoading(true);
        const allBills: FeedBill[] = [];

        // Add bills from watched groups
        for (const groupSlug of watchedGroups) {
          const groupData = getAdvocacyGroupData(groupSlug);
          if (!groupData) continue;

          // Get campaigns for this group
          const campaigns = campaignsService.getCampaignsByGroup(groupSlug);
          
          // Convert campaigns to feed bills
          for (const campaign of campaigns) {
            const feedBill = convertToFeedBill(campaign.bill, groupData.name);
            allBills.push(feedBill);
          }

          // Fallback to legacy priority bills if no campaigns
          if (campaigns.length === 0 && groupData.priorityBills) {
            for (const priorityBill of groupData.priorityBills) {
              const feedBill = convertToFeedBill(priorityBill.bill, groupData.name);
              allBills.push(feedBill);
            }
          }
        }

        // Add individually watched bills
        for (const watchedBill of watchedBills) {
          // Check if this bill is already in the list from groups
          const alreadyExists = allBills.some(bill => 
            bill.congress === watchedBill.congress && 
            bill.type === watchedBill.type && 
            bill.number === watchedBill.number
          );

          if (!alreadyExists) {
            const feedBill = convertToFeedBill(watchedBill, 'Individually Watched');
            allBills.push(feedBill);
          }
        }

        // Sort by most recently watched (bills from groups don't have watchedAt, so they'll be first)
        allBills.sort((a, b) => {
          const aTime = watchedBills.find(wb => 
            wb.congress === a.congress && wb.type === a.type && wb.number === a.number
          )?.watchedAt || '2000-01-01';
          const bTime = watchedBills.find(wb => 
            wb.congress === b.congress && wb.type === b.type && wb.number === b.number
          )?.watchedAt || '2000-01-01';
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

        setBills(allBills);
        setError(null);
      } catch (err) {
        console.error('Error loading bills:', err);
        setError(err instanceof Error ? err.message : 'Failed to load bills');
      } finally {
        setLoading(false);
      }
    };

    loadWatchedContent();
  }, [watchedGroups, watchedBills]);

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
                    Fetching bills from groups you're watching...
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
                Error loading following feed: {error}
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
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Following ({bills.length})</h1>
              <Button variant="outline" size="sm" asChild>
                <Link href="/groups">
                  Manage Groups
                </Link>
              </Button>
            </div>
            {bills.length > 0 ? (
              bills.map((bill, index) => (
                <BillFeedCard key={`${bill.congress}-${bill.type}-${bill.number}`} bill={bill} index={index} />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    The groups you're following don't have any priority bills yet.
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