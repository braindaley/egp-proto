'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useWatchedBills } from '@/hooks/use-watched-bills';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Menu, ChevronRight, User as UserIcon, Settings, MessageSquare, Crown, BarChart3, Heart, Eye, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface WatchedBillWithDetails {
  congress: number;
  type: string;
  number: string;
  title?: string;
  watchedAt: string;
  billTitle?: string;
  latestActionDate?: string;
  latestActionText?: string;
  billCurrentStatus?: string;
}

interface BillRowProps {
  bill: WatchedBillWithDetails;
}

function BillRow({ bill }: BillRowProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <Link href={`/bill/${bill.congress}/${bill.type.toLowerCase()}/${bill.number}`} className="block">
      <div className="box-border content-stretch flex flex-col items-start justify-center px-4 py-3 relative size-full hover:bg-gray-50 transition-colors border-b border-gray-200">
        <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full mb-2">
          <div className="box-border content-stretch flex gap-2.5 items-center justify-center px-2.5 py-0.5 relative rounded-xl shrink-0 bg-primary/10">
            <div className="font-medium leading-[0] not-italic relative shrink-0 text-primary text-[12px] text-nowrap">
              <p className="leading-[20px] whitespace-pre">{bill.type} {bill.number}</p>
            </div>
          </div>
          <div className="basis-0 font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-foreground text-[16px]">
            <p className="leading-[24px] font-medium">{bill.billTitle || bill.title}</p>
          </div>
        </div>
        <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full">
          <div className="basis-0 font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-muted-foreground text-[14px]">
            <p className="leading-[20px]">
              <span className="font-medium">Latest Action:</span>
              <span> {formatDate(bill.latestActionDate || '')} - {(bill.latestActionText || bill.billCurrentStatus || 'Status unknown').substring(0, 100)}...</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function FollowingPage() {
  const { user, loading } = useAuth();
  const { watchedBills } = useWatchedBills();
  const [billsWithDetails, setBillsWithDetails] = useState<WatchedBillWithDetails[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Check membership status from localStorage (for testing)
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsPremium(localStorage.getItem('testAsPremium') === 'true');
    }
  }, []);
  
  useEffect(() => {
    const fetchBillDetails = async () => {
      if (watchedBills.length === 0) {
        setBillsWithDetails([]);
        return;
      }

      setLoadingDetails(true);
      try {
        const billDetailsPromises = watchedBills.map(async (watchedBill) => {
          try {
            const response = await fetch(
              `/api/congress/${watchedBill.congress}/${watchedBill.type.toLowerCase()}/${watchedBill.number}`
            );
            
            if (response.ok) {
              const billData = await response.json();
              return {
                ...watchedBill,
                billTitle: billData.bill?.title || watchedBill.title,
                latestActionDate: billData.bill?.latestAction?.actionDate,
                latestActionText: billData.bill?.latestAction?.text,
                billCurrentStatus: billData.bill?.latestAction?.text
              };
            } else {
              return {
                ...watchedBill,
                billTitle: watchedBill.title || `${watchedBill.type} ${watchedBill.number}`,
                latestActionDate: '',
                latestActionText: 'Unable to fetch latest information',
                billCurrentStatus: 'Status unavailable'
              };
            }
          } catch (error) {
            console.error(`Error fetching details for bill ${watchedBill.type} ${watchedBill.number}:`, error);
            return {
              ...watchedBill,
              billTitle: watchedBill.title || `${watchedBill.type} ${watchedBill.number}`,
              latestActionDate: '',
              latestActionText: 'Unable to fetch latest information',
              billCurrentStatus: 'Status unavailable'
            };
          }
        });

        const results = await Promise.all(billDetailsPromises);
        setBillsWithDetails(results.sort((a, b) => 
          new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
        ));
      } catch (error) {
        console.error('Error fetching bill details:', error);
        setBillsWithDetails(watchedBills.map(bill => ({
          ...bill,
          billTitle: bill.title || `${bill.type} ${bill.number}`,
          latestActionDate: '',
          latestActionText: 'Unable to fetch latest information',
          billCurrentStatus: 'Status unavailable'
        })));
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchBillDetails();
  }, [watchedBills]);
  
  if (loading) {
    return <p>Loading following...</p>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const dashboardNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: UserIcon },
    { label: 'Edit Profile', href: '/dashboard/profile', icon: UserIcon },
    { label: 'Membership', href: '/dashboard/membership', icon: Crown },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { label: 'Activity', href: '/dashboard/activity', icon: BarChart3 },
    { label: 'Following', href: '/dashboard/following', icon: Eye, isActive: true },
    { label: 'Policy Interests', href: '/dashboard/interests', icon: Settings },
  ];

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-6 md:py-12">
        {/* Mobile Menu Button */}
        <div className="lg:hidden mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center gap-2"
          >
            <Menu className="h-4 w-4" />
            Dashboard Navigation
          </Button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mb-6">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {dashboardNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors group ${
                        item.isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span className={item.isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}>
                          {item.label}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    </Link>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:justify-center">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full max-w-6xl">
            {/* Desktop Left Navigation Panel */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <nav className="space-y-1">
                      {dashboardNavItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors group ${
                            item.isActive ? 'bg-muted text-foreground' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span className={item.isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}>
                              {item.label}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                        </Link>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
              </div>
            </aside>

            {/* Main Content */}
            <div className="w-full lg:max-w-[672px] lg:flex-1">
              <header className="mb-8">
                <h1 className="text-3xl font-bold font-headline">
                  Following
                </h1>
                <p className="text-muted-foreground mt-1">
                  Bills you're watching for updates and changes.
                </p>
              </header>
              
              <main className="space-y-8">
                {isPremium ? (
                  <>
                    {/* Statistics Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Bills Being Watched</CardTitle>
                        <CardDescription>
                          You're currently following {watchedBills.length} bill{watchedBills.length !== 1 ? 's' : ''}.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 mb-1">
                            {watchedBills.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Bills Followed</div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Bills List */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Your Followed Bills</CardTitle>
                        <CardDescription>
                          Bills you're tracking for legislative updates and progress.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingDetails ? (
                          <p className="text-muted-foreground">Loading bill details...</p>
                        ) : watchedBills.length === 0 ? (
                          <div className="text-center py-8">
                            <h3 className="text-xl font-semibold mb-2">No Bills Being Followed</h3>
                            <p className="text-muted-foreground mb-4">
                              You haven't started following any bills yet. Visit bill pages to start watching them.
                            </p>
                            <Button asChild>
                              <Link href="/campaigns">Browse Campaigns</Link>
                            </Button>
                          </div>
                        ) : (
                          <div className="bg-card rounded-lg border">
                            <div className="p-4 border-b">
                              <h3 className="text-xl font-semibold">
                                {billsWithDetails.length} Bill{billsWithDetails.length !== 1 ? 's' : ''} Followed
                              </h3>
                            </div>
                            <div className="divide-y divide-gray-200">
                              {billsWithDetails.map((bill, index) => (
                                <BillRow key={`${bill.type}-${bill.number}-${index}`} bill={bill} />
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    {/* Statistics Card for Non-Members */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Bills Being Watched</CardTitle>
                        <CardDescription>
                          You're currently following {watchedBills.length} bill{watchedBills.length !== 1 ? 's' : ''}.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 mb-1">
                            {watchedBills.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Bills Followed</div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Upgrade Card */}
                    <Card className="relative">
                      <div className="text-center p-8">
                        <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">Upgrade to Premium</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Track and follow bills to receive updates on legislative progress
                        </p>
                        <Button asChild size="lg" className="gap-2">
                          <Link href="/dashboard/membership">
                            <Crown className="h-4 w-4" />
                            Upgrade Now
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  </>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}