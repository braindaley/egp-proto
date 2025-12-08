'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import MessageHistory from '@/components/dashboard/MessageHistory';
import { useUserActivity } from '@/hooks/use-user-activity';
import { Menu, ChevronRight, User as UserIcon, Settings, MessageSquare, Crown, BarChart3, Lock, ThumbsUp, ThumbsDown } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const { activityStats, loading: activityLoading } = useUserActivity();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Check membership status from localStorage (for testing)
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsPremium(localStorage.getItem('testAsPremium') === 'true');
    }
  }, []);
  
  if (loading) {
    return <p>Loading messages...</p>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const dashboardNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: UserIcon },
    { label: 'Edit Profile', href: '/dashboard/profile', icon: UserIcon },
    { label: 'Membership', href: '/dashboard/membership', icon: Crown },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare, isActive: true },
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
                  Message History
                </h1>
                <p className="text-muted-foreground mt-1">
                  View your advocacy messages and their status.
                </p>
              </header>

              <main className="space-y-8">
                {/* Your Advocacy Summary - Visible to all users */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      <CardTitle>Your Advocacy Summary</CardTitle>
                    </div>
                    <CardDescription>
                      Overview of your advocacy activity and engagement.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activityLoading ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="text-center">
                            <div className="h-12 bg-gray-200 rounded animate-pulse mb-2" />
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-foreground mb-1">
                            {activityStats.totalCount}
                          </div>
                          <div className="text-sm text-muted-foreground">Messages Sent</div>
                        </div>

                        <div className="text-center">
                          <div className="text-4xl font-bold text-foreground mb-1">
                            {activityStats.totalCount}
                          </div>
                          <div className="text-sm text-muted-foreground">Bills Engaged</div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <ThumbsUp className="h-4 w-4 text-green-600" />
                            <div className="text-4xl font-bold text-green-600">
                              {activityStats.supportedCount}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">Supported</div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <ThumbsDown className="h-4 w-4 text-red-600" />
                            <div className="text-4xl font-bold text-red-600">
                              {activityStats.opposedCount}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">Opposed</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {isPremium ? (
                  <MessageHistory />
                ) : (
                  <>
                    {/* Skeleton Cards */}
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 z-10 flex items-center justify-center">
                          {i === 2 && (
                            <div className="text-center p-8">
                              <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                              <h3 className="text-xl font-semibold mb-2">Upgrade to Premium</h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                View your complete message history and track responses
                              </p>
                              <Button asChild size="lg" className="gap-2">
                                <Link href="/dashboard/membership">
                                  <Crown className="h-4 w-4" />
                                  Upgrade Now
                                </Link>
                              </Button>
                            </div>
                          )}
                        </div>
                        <CardHeader>
                          <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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