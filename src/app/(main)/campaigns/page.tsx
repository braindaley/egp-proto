'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { campaignsService, type Campaign } from '@/lib/campaigns';
import { SITE_ISSUE_CATEGORIES } from '@/lib/policy-area-mapping';
import { ThumbsUp, ThumbsDown, ArrowRight, ChevronRight, Menu } from 'lucide-react';
import { getBillTypeSlug } from '@/lib/utils';
import { parseSimpleMarkdown } from '@/lib/markdown-utils';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useWatchedBills } from '@/hooks/use-watched-bills';
import { useRouter } from 'next/navigation';

export default function CampaignsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { isWatchedBill, toggleWatchBill } = useWatchedBills();
  const [campaigns, setCampaigns] = useState<Campaign[]>(
    campaignsService.getAllCampaigns().filter(c => c.isActive && c.bill)
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userActions, setUserActions] = useState<Record<string, 'support' | 'oppose' | null>>({});

  // Load campaigns from Firebase to match admin dashboard
  useEffect(() => {
    const fetchFirebaseCampaigns = async () => {
      try {
        const { getFirestore, collection, getDocs } = await import('firebase/firestore');
        const { app } = await import('@/lib/firebase');

        const db = getFirestore(app);
        const campaignsRef = collection(db, 'campaigns');
        const snapshot = await getDocs(campaignsRef);

        const firebaseCampaigns: Campaign[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            groupSlug: data.groupSlug,
            groupName: data.groupName || data.groupSlug,
            bill: {
              congress: 119,
              type: data.billType,
              number: data.billNumber,
              title: data.billTitle
            },
            position: data.stance === 'support' ? 'Support' : data.stance === 'oppose' ? 'Oppose' : data.position,
            reasoning: data.reasoning,
            actionButtonText: 'Voice your opinion',
            supportCount: data.supportCount || 0,
            opposeCount: data.opposeCount || 0,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            isActive: true
          };
        });

        console.log('*** DEBUG: Loaded Firebase campaigns:', firebaseCampaigns.map(c => `${c.groupName} - ${c.bill.type} ${c.bill.number}`));
        setCampaigns(firebaseCampaigns);

      } catch (error) {
        console.error('Error fetching Firebase campaigns:', error);
        // Fallback to static campaigns if Firebase fails
        setCampaigns(campaignsService.getAllCampaigns().filter(c => c.isActive && c.bill));
      }
    };

    fetchFirebaseCampaigns();
  }, []);

  const handleSupportOppose = async (campaign: Campaign, action: 'support' | 'oppose') => {
    if (!user) {
      // Redirect to login if user is not authenticated
      window.location.href = '/login';
      return;
    }

    // For now, simulate the functionality with local storage until Firebase rules are updated
    try {
      // Store action in localStorage as a temporary solution
      const userActions = JSON.parse(localStorage.getItem('userBillActions') || '[]');
      const newAction = {
        id: Date.now().toString(),
        userId: user.uid,
        userEmail: user.email,
        campaignId: campaign.id,
        billNumber: campaign.bill.number,
        billType: campaign.bill.type,
        congress: campaign.bill.congress,
        billTitle: campaign.bill.title,
        action: action,
        timestamp: new Date().toISOString(),
        groupName: campaign.groupName,
        groupSlug: campaign.groupSlug
      };

      userActions.push(newAction);
      localStorage.setItem('userBillActions', JSON.stringify(userActions));

      // Update local state to reflect the change immediately
      setCampaigns(prevCampaigns =>
        prevCampaigns.map(c =>
          c.id === campaign.id
            ? {
                ...c,
                [action === 'support' ? 'supportCount' : 'opposeCount']: (c[action === 'support' ? 'supportCount' : 'opposeCount'] || 0) + 1
              }
            : c
        )
      );

      // Set user action state to show success on button
      setUserActions(prev => ({ ...prev, [campaign.id]: action }));

      // Clear the success state after 2 seconds
      setTimeout(() => {
        setUserActions(prev => ({ ...prev, [campaign.id]: null }));
      }, 2000);

      // TODO: Remove this localStorage approach once Firebase rules are deployed
      // The real implementation will use Firebase Firestore:
      /*
      const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { app } = await import('@/lib/firebase');
      const db = getFirestore(app);

      await addDoc(collection(db, 'user_bill_actions'), {
        userId: user.uid,
        userEmail: user.email,
        campaignId: campaign.id,
        billNumber: campaign.bill.number,
        billType: campaign.bill.type,
        congress: campaign.bill.congress,
        billTitle: campaign.bill.title,
        action: action,
        timestamp: serverTimestamp(),
        groupName: campaign.groupName,
        groupSlug: campaign.groupSlug
      });
      */

    } catch (error) {
      console.error('Error recording support/oppose action:', error);
      alert('There was an error recording your action. Please try again.');
    }
  };

  function convertTitleToSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  }

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            {/* Main Content - Campaigns */}
            <div className="w-full">
              <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">Current Campaigns</h1>

              {/* Issues Filter Dropdown */}
              <div className="mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex items-center gap-2 w-full"
                >
                  <Menu className="h-4 w-4" />
                  Browse by issue
                </Button>
              </div>

              {/* Categories Dropdown */}
              {isMobileMenuOpen && (
                <div className="mb-6">
                  <Card>
                    <CardContent className="p-0">
                      <nav className="space-y-1">
                        {SITE_ISSUE_CATEGORIES.map((category) => (
                          <Link
                            key={category}
                            href={`/issues/${convertTitleToSlug(category)}`}
                            className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors group"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <span className="text-muted-foreground group-hover:text-foreground">
                              {category}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                          </Link>
                        ))}
                      </nav>
                    </CardContent>
                  </Card>
                </div>
              )}
              <div className="space-y-4 md:space-y-6">
                {campaigns.map((campaign) => {
                  const isSupport = campaign.position === 'Support';
                  const badgeVariant = isSupport ? 'default' : 'destructive';
                  const PositionIcon = isSupport ? ThumbsUp : ThumbsDown;
                  const billTypeSlug = getBillTypeSlug(campaign.bill.type);

                  const currentUserAction = userActions[campaign.id];
                  const isWatched = isWatchedBill(campaign.bill.congress, campaign.bill.type, campaign.bill.number);

                  return (
                    <Card key={campaign.id} className="shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex flex-col gap-3">
                          {/* 1. Group Name's Opinion with Badge */}
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-muted-foreground">
                              <Link
                                href={`/campaigns/${campaign.groupSlug}`}
                                className="hover:underline hover:text-foreground transition-colors"
                              >
                                {campaign.groupName}
                              </Link>{' '}
                              urges you to {campaign.position.toLowerCase()} {campaign.bill.type.toUpperCase()} {campaign.bill.number}
                            </p>
                            <Badge variant={badgeVariant} className="flex items-center gap-2 text-sm px-2 py-1 shrink-0">
                              <PositionIcon className="h-3 w-3" />
                              <span>{campaign.position}</span>
                            </Badge>
                          </div>

                          {/* 3. H2: Bill Short Title */}
                          <CardTitle className="text-lg sm:text-xl font-bold leading-tight">
                            <Link
                              href={`/federal/bill/${campaign.bill.congress}/${billTypeSlug}/${campaign.bill.number}`}
                              className="hover:underline break-words"
                            >
                              {campaign.bill.title || `Legislation ${campaign.bill.type.toUpperCase()} ${campaign.bill.number}`}
                            </Link>
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {/* 4. Formatted Markdown Reasoning (3 rows max) */}
                        <div
                          className="text-muted-foreground mb-4 text-sm leading-relaxed overflow-hidden line-clamp-3 [&>h3]:hidden [&>ul]:list-disc [&>ul]:pl-5 [&>li]:leading-relaxed"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                          dangerouslySetInnerHTML={{
                            __html: parseSimpleMarkdown(campaign.reasoning, { hideHeaders: true })
                          }}
                        />

                        {/* 5. Bottom Section with Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t gap-3">
                          <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                            <Button
                              variant="outline"
                              size="sm"
                              className={`flex items-center gap-2 transition-colors ${
                                currentUserAction === 'support'
                                  ? 'bg-green-100 text-green-800 border-green-300'
                                  : 'text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200'
                              }`}
                              onClick={() => handleSupportOppose(campaign, 'support')}
                              title={user ? 'Support this bill' : 'Login to support this bill'}
                              disabled={currentUserAction === 'support'}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              <span className="font-semibold">
                                {currentUserAction === 'support' ? 'Supported!' : campaign.supportCount.toLocaleString()}
                              </span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`flex items-center gap-2 transition-colors ${
                                currentUserAction === 'oppose'
                                  ? 'bg-red-100 text-red-800 border-red-300'
                                  : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
                              }`}
                              onClick={() => handleSupportOppose(campaign, 'oppose')}
                              title={user ? 'Oppose this bill' : 'Login to oppose this bill'}
                              disabled={currentUserAction === 'oppose'}
                            >
                              <ThumbsDown className="h-4 w-4" />
                              <span className="font-semibold">
                                {currentUserAction === 'oppose' ? 'Opposed!' : campaign.opposeCount.toLocaleString()}
                              </span>
                            </Button>
                            <Button
                              variant={isWatched ? 'secondary' : 'outline'}
                              size="sm"
                              className={`flex items-center gap-2 ${
                                isWatched
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                  : 'text-muted-foreground'
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Watch button clicked for campaign:', {
                                  congress: campaign.bill.congress,
                                  type: campaign.bill.type,
                                  number: campaign.bill.number,
                                  title: campaign.bill.title,
                                  isWatched
                                });

                                if (!user) {
                                  console.log('User not authenticated, redirecting to login');
                                  const currentUrl = window.location.pathname;
                                  router.push(`/login?returnTo=${encodeURIComponent(currentUrl)}`);
                                  return;
                                }

                                console.log('Calling toggleWatchBill');
                                toggleWatchBill(campaign.bill.congress, campaign.bill.type, campaign.bill.number, campaign.bill.title);
                              }}
                            >
                              {isWatched ? 'Watching' : 'Watch'}
                            </Button>
                          </div>
                          <Button size="sm" asChild className="w-full sm:w-auto">
                            <Link href={`/campaigns/${campaign.groupSlug}/${campaign.bill.type.toLowerCase()}-${campaign.bill.number}`}>
                              View Campaign
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}