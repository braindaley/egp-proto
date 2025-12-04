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
import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { FeedBill, Bill } from '@/types';
import { ENABLE_WATCH_FEATURE } from '@/config/features';
import { mapApiSubjectToAllowed } from '@/lib/subjects';

async function fetchBill(congress: number, type: string, number: string): Promise<Bill | null> {
  try {
    const response = await fetch(`/api/bill?congress=${congress}&billType=${type.toLowerCase()}&billNumber=${number}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching bill:', error);
    return null;
  }
}

function convertBillToFeedBill(bill: Bill): FeedBill {
  // Extract subjects from the bill 
  const rawSubjects = bill.subjects?.items?.map(subject => 
    typeof subject === 'string' ? subject : subject?.name
  ).filter(name => name && typeof name === 'string') || ['General Legislation'];

  // Map API subjects to our standardized categories
  const mappedSubjects = rawSubjects
    .map(subject => mapApiSubjectToAllowed(subject))
    .filter(Boolean) as string[];
  
  // Remove duplicates and ensure we have at least one subject
  const finalSubjects = [...new Set(mappedSubjects)];
  const subjects = finalSubjects.length > 0 ? finalSubjects : ['General Legislation'];

  return {
    ...bill,
    billNumber: `${bill.type} ${bill.number}`,
    shortTitle: bill.shortTitle || bill.title,
    sponsorFullName: bill.sponsors?.[0]?.fullName || 'Unknown',
    sponsorParty: bill.sponsors?.[0]?.party || 'Unknown',
    sponsorImageUrl: null,
    committeeName: bill.committees?.items?.[0]?.name || 'Unknown',
    subjects: subjects,
    summary: bill.allSummaries?.[0]?.text || '',
    latestAction: bill.actions?.items?.[0] ? {
      actionDate: bill.actions.items[0].actionDate,
      text: bill.actions.items[0].text
    } : {
      actionDate: '',
      text: 'No actions'
    },
    importanceScore: 0,
    status: 'Unknown'
  };
}

export default function FollowingPage() {
  const { user, loading: authLoading, isInitialLoadComplete } = useAuth();
  const router = useRouter();
  const { watchedGroups } = useWatchedGroups();
  const { watchedBills } = useWatchedBills();
  const { data: allBills = [], isLoading: loading, error, refetch } = useBills();
  const [additionalBills, setAdditionalBills] = useState<FeedBill[]>([]);

  // Redirect if watch feature is disabled
  useEffect(() => {
    if (!ENABLE_WATCH_FEATURE) {
      router.push('/');
    }
  }, [router]);

  // Redirect check - redirect if user is not authenticated
  useEffect(() => {
    if (isInitialLoadComplete && !authLoading && !user) {
      router.push('/login?returnTo=/following');
      return;
    }
  }, [user, authLoading, isInitialLoadComplete, router]);

  // Don't render if feature is disabled
  if (!ENABLE_WATCH_FEATURE) {
    return null;
  }

  // Early return if user is not authenticated (after all hooks are called)
  if (isInitialLoadComplete && !authLoading && !user) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Redirecting...</p>
                  <p className="text-sm text-muted-foreground">
                    Taking you to login...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('Debug Following Page:', {
    watchedGroups,
    watchedBills,
    allBillsCount: allBills.length,
    loading,
    error
  });
  
  if (allBills.length > 0) {
    console.log('Sample bills in feed:', allBills.slice(0, 5).map(b => ({
      congress: b.congress,
      type: b.type,
      number: b.number,
      title: b.shortTitle
    })));
  }

  // Fetch additional bills that aren't in the main feed
  useEffect(() => {
    if (!allBills.length || (!watchedGroups.length && !watchedBills.length)) return;

    const fetchAdditionalBills = async () => {
      const billsToFetch = new Set<string>();
      
      // Collect individually watched bills that aren't in the feed
      for (const watchedBill of watchedBills) {
        const billKey = `${watchedBill.congress}-${watchedBill.type}-${watchedBill.number}`;
        const existsInFeed = allBills.some(bill => 
          bill.congress === watchedBill.congress &&
          bill.type === watchedBill.type &&
          bill.number === watchedBill.number
        );
        
        if (!existsInFeed) {
          console.log('Watched bill not in feed, will fetch:', billKey);
          billsToFetch.add(billKey);
        }
      }
      
      // Collect bills from watched groups
      for (const groupSlug of watchedGroups) {
        const groupData = getAdvocacyGroupData(groupSlug);
        if (!groupData) continue;

        const campaigns = campaignsService.getCampaignsByGroup(groupSlug);
        for (const campaign of campaigns) {
          const billKey = `${campaign.bill.congress}-${campaign.bill.type}-${campaign.bill.number}`;
          const existsInFeed = allBills.some(bill => 
            bill.congress === campaign.bill.congress &&
            bill.type === campaign.bill.type &&
            bill.number === campaign.bill.number
          );
          
          if (!existsInFeed) {
            billsToFetch.add(billKey);
          }
        }
      }

      if (billsToFetch.size === 0) {
        setAdditionalBills([]);
        return;
      }

      console.log('Fetching additional bills:', Array.from(billsToFetch));
      
      const fetchedBills: FeedBill[] = [];
      for (const billKey of billsToFetch) {
        const [congress, type, number] = billKey.split('-');
        const bill = await fetchBill(parseInt(congress), type, number);
        if (bill) {
          fetchedBills.push(convertBillToFeedBill(bill));
        }
      }
      
      console.log('Successfully fetched additional bills:', fetchedBills);
      setAdditionalBills(fetchedBills);
    };

    fetchAdditionalBills();
  }, [allBills, watchedGroups, watchedBills]);

  // Filter bills to show only those from watched groups or individually watched
  const followingBills = useMemo(() => {
    if (!allBills.length) return [];

    // Combine main feed bills with additional bills
    const combinedBills = [...allBills, ...additionalBills];
    console.log('Combined bills count:', combinedBills.length, '(main:', allBills.length, 'additional:', additionalBills.length, ')');

    // Get bills from watched groups (campaigns)
    const groupBills: FeedBill[] = [];
    for (const groupSlug of watchedGroups) {
      const groupData = getAdvocacyGroupData(groupSlug);
      console.log('Group data for', groupSlug, ':', groupData);
      if (!groupData) continue;

      // Get campaigns for this group and match with bills from combined feed
      const campaigns = campaignsService.getCampaignsByGroup(groupSlug);
      console.log('Campaigns for', groupSlug, ':', campaigns);
      for (const campaign of campaigns) {
        console.log('Looking for campaign bill:', {
          congress: campaign.bill.congress,
          type: campaign.bill.type,
          number: campaign.bill.number
        });
        const matchingBill = combinedBills.find(bill => 
          bill.congress === campaign.bill.congress &&
          bill.type === campaign.bill.type &&
          bill.number === campaign.bill.number
        );
        if (matchingBill) {
          groupBills.push(matchingBill);
          console.log('Found matching bill from campaign:', matchingBill);
        } else {
          console.log('No matching bill found for campaign bill:', campaign.bill);
        }
      }

      // Fallback to legacy priority bills if no campaigns
      if (campaigns.length === 0 && groupData.priorityBills) {
        console.log('Using legacy priority bills for', groupSlug);
        for (const priorityBill of groupData.priorityBills) {
          const matchingBill = combinedBills.find(bill => 
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
      const found = combinedBills.find(bill => 
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
    const allFollowingBills = [...groupBills, ...individualBills];
    const uniqueBills = allFollowingBills.filter((bill, index, array) => 
      array.findIndex(b => 
        b.congress === bill.congress && 
        b.type === bill.type && 
        b.number === bill.number
      ) === index
    );

    console.log('Final following bills:', uniqueBills);

    // Sort by importance score (same as homepage)
    return uniqueBills.sort((a, b) => b.importanceScore - a.importanceScore);
  }, [allBills, additionalBills, watchedGroups, watchedBills]);

  // Show loading while checking authentication
  if (authLoading || !isInitialLoadComplete) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Loading...</p>
                  <p className="text-sm text-muted-foreground">
                    Checking authentication...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                    <Link href="/campaigns">
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