'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUserActivity } from '@/hooks/use-user-activity';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Menu, ChevronRight, User as UserIcon, Settings, MessageSquare, Crown, BarChart3, ThumbsUp, ThumbsDown } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface BillRowProps {
  bill: {
    billNumber: string;
    billType: string;
    congress: string;
    billTitle: string;
    billCurrentStatus: string;
    latestActionDate: string;
    latestActionText: string;
    userStance: 'support' | 'oppose';
    sentAt: any;
  };
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
    <Link href={`/bill/${bill.congress}/${bill.billType.toLowerCase()}/${bill.billNumber}`} className="block">
      <div className="box-border content-stretch flex flex-col items-start justify-center px-4 py-3 relative size-full hover:bg-gray-50 transition-colors border-b border-gray-200">
        <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full mb-2">
          <div className="box-border content-stretch flex gap-2.5 items-center justify-center px-2.5 py-0.5 relative rounded-xl shrink-0 bg-primary/10">
            <div className="font-medium leading-[0] not-italic relative shrink-0 text-primary text-[12px] text-nowrap">
              <p className="leading-[20px] whitespace-pre">{bill.billType} {bill.billNumber}</p>
            </div>
          </div>
          <div className="basis-0 font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-foreground text-[16px]">
            <p className="leading-[24px] font-medium">{bill.billTitle}</p>
          </div>
        </div>
        <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full">
          <div className="basis-0 font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-muted-foreground text-[14px]">
            <p className="leading-[20px]">
              <span className="font-medium">Latest Action:</span>
              <span> {formatDate(bill.latestActionDate)} - {(bill.latestActionText || bill.billCurrentStatus).substring(0, 100)}...</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ActivityPage() {
  const { user, loading } = useAuth();
  const { activityStats, loading: activityLoading } = useUserActivity();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  
  if (loading) {
    return <p>Loading activity...</p>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const dashboardNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: UserIcon },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { label: 'Activity', href: '/dashboard/activity', icon: BarChart3, isActive: true },
    { label: 'Membership', href: '/dashboard/membership', icon: Crown },
    { label: 'Edit Profile', href: '/dashboard/profile', icon: UserIcon },
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
                  Activity
                </h1>
                <p className="text-muted-foreground mt-1">
                  View your advocacy activity and bill positions.
                </p>
              </header>
              
              <main className="space-y-8">
                {/* Statistics Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Advocacy Statistics</CardTitle>
                    <CardDescription>
                      Summary of your bill positions and advocacy activity.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activityLoading ? (
                      <p className="text-muted-foreground">Loading statistics...</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 mb-1">
                            {activityStats.supportedCount}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">Bills Supported</div>
                          <div className="text-lg font-semibold text-green-600">
                            {activityStats.supportedPercentage}%
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-3xl font-bold text-red-600 mb-1">
                            {activityStats.opposedCount}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">Bills Opposed</div>
                          <div className="text-lg font-semibold text-red-600">
                            {activityStats.opposedPercentage}%
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-3xl font-bold text-foreground mb-1">
                            {activityStats.totalCount}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">Total Bills</div>
                          <div className="text-lg font-semibold text-foreground">
                            100%
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bill Lists with Tabs */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Bill Positions</CardTitle>
                    <CardDescription>
                      Browse bills you've taken positions on, organized by your stance.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activityLoading ? (
                      <p className="text-muted-foreground">Loading bills...</p>
                    ) : activityStats.totalCount === 0 ? (
                      <div className="text-center py-8">
                        <h3 className="text-xl font-semibold mb-2">No Activity Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          You haven't taken any positions on bills yet. Start advocating to see your activity here.
                        </p>
                        <Button asChild>
                          <Link href="/campaigns">Browse Campaigns</Link>
                        </Button>
                      </div>
                    ) : (
                      <Tabs defaultValue="supported" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="supported" className="flex items-center gap-2">
                            <ThumbsUp className="h-4 w-4" />
                            Supported ({activityStats.supportedCount})
                          </TabsTrigger>
                          <TabsTrigger value="opposed" className="flex items-center gap-2">
                            <ThumbsDown className="h-4 w-4" />
                            Opposed ({activityStats.opposedCount})
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="supported" className="mt-6">
                          {activityStats.supportedBills.length > 0 ? (
                            <div className="bg-card rounded-lg border">
                              <div className="p-4 border-b">
                                <h3 className="text-xl font-semibold">
                                  {activityStats.supportedBills.length} Bill{activityStats.supportedBills.length !== 1 ? 's' : ''} Supported
                                </h3>
                              </div>
                              <div className="divide-y divide-gray-200">
                                {activityStats.supportedBills.map((bill, index) => (
                                  <BillRow key={`${bill.billType}-${bill.billNumber}-${index}`} bill={bill} />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-card rounded-lg border p-8 text-center">
                              <h3 className="text-xl font-semibold mb-2">No Bills Supported</h3>
                              <p className="text-muted-foreground">
                                You haven't supported any bills yet.
                              </p>
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="opposed" className="mt-6">
                          {activityStats.opposedBills.length > 0 ? (
                            <div className="bg-card rounded-lg border">
                              <div className="p-4 border-b">
                                <h3 className="text-xl font-semibold">
                                  {activityStats.opposedBills.length} Bill{activityStats.opposedBills.length !== 1 ? 's' : ''} Opposed
                                </h3>
                              </div>
                              <div className="divide-y divide-gray-200">
                                {activityStats.opposedBills.map((bill, index) => (
                                  <BillRow key={`${bill.billType}-${bill.billNumber}-${index}`} bill={bill} />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-card rounded-lg border p-8 text-center">
                              <h3 className="text-xl font-semibold mb-2">No Bills Opposed</h3>
                              <p className="text-muted-foreground">
                                You haven't opposed any bills yet.
                              </p>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    )}
                  </CardContent>
                </Card>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}