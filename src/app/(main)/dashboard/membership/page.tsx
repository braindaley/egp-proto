'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Menu, ChevronRight, User as UserIcon, Settings, MessageSquare, Crown, Check, Heart, Eye, TrendingUp, Filter, Mail, Globe } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function MembershipPage() {
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const router = useRouter();

  // Check for testing override from localStorage
  const [testAsPremium, setTestAsPremium] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTestAsPremium(localStorage.getItem('testAsPremium') === 'true');
    }
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch subscription data for premium users (not test mode)
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user || user.membershipLevel !== 'premium' || testAsPremium) {
        setIsLoadingSubscription(false);
        return;
      }

      try {
        const response = await fetch('/api/subscriptions/current');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionData(data.subscription);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    if (!loading) {
      fetchSubscription();
    }
  }, [user, loading, testAsPremium]);

  if (loading) {
    return <p>Loading membership...</p>;
  }

  if (!user) {
    return null;
  }

  const isPremium = testAsPremium || user.membershipLevel === 'premium';

  const dashboardNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: UserIcon },
    { label: 'Edit Profile', href: '/dashboard/profile', icon: UserIcon },
    { label: 'Public Profile', href: '/dashboard/public-profile', icon: Globe },
    { label: 'Membership', href: '/dashboard/membership', icon: Crown, isActive: true },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { label: 'Policy Interests', href: '/dashboard/interests', icon: Settings },
  ];

  const premiumBenefits = [
    {
      icon: Heart,
      title: 'Support the Organization',
      description: 'Help fund our advocacy efforts and keep the platform running'
    },
    {
      icon: Eye,
      title: 'View Sent Messages and Responses',
      description: 'Access a complete history of all your advocacy messages and track official responses you receive'
    },
    {
      icon: TrendingUp,
      title: 'View Advocacy Impact',
      description: 'See detailed analytics on how your advocacy efforts are making a difference, including engagement metrics and response rates'
    },
    {
      icon: Filter,
      title: 'Customized Feed Based on Policy Interests',
      description: 'Get a personalized feed of legislation and advocacy opportunities tailored to your specific policy interests and priorities'
    },
    {
      icon: Mail,
      title: 'Email Digest Options',
      description: 'Customizable email summaries of legislation matching your interests (daily, weekly, or monthly)'
    }
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
                  Membership
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isPremium
                    ? 'Manage your premium membership and billing'
                    : 'Upgrade to Premium and unlock exclusive features to enhance your advocacy efforts.'}
                </p>
              </header>

              <main className="space-y-8">
                {/* Current Status */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Current Plan
                          <Badge variant={isPremium ? "default" : "outline"}>
                            {isPremium ? 'Premium' : 'Free'}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {isPremium
                            ? 'You have access to all premium features and benefits.'
                            : "You're currently using the free tier of our advocacy platform."}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Premium Management Section */}
                {isPremium && (
                  <>
                    {/* Subscription Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Subscription Details</CardTitle>
                        <CardDescription>
                          Your subscription and billing information
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingSubscription ? (
                          <p className="text-sm text-muted-foreground">Loading subscription details...</p>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b">
                              <div>
                                <p className="text-sm font-medium">Plan</p>
                                <p className="text-sm text-muted-foreground">Premium Membership</p>
                              </div>
                              <Badge variant="default">Active</Badge>
                            </div>

                            <div className="flex justify-between items-center pb-3 border-b">
                              <div>
                                <p className="text-sm font-medium">Billing Amount</p>
                                <p className="text-sm text-muted-foreground">$6.00 every 3 months</p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center pb-3 border-b">
                              <div>
                                <p className="text-sm font-medium">Next Billing Date</p>
                                <p className="text-sm text-muted-foreground">
                                  {subscriptionData?.nextBillingDate
                                    ? new Date(subscriptionData.nextBillingDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })
                                    : 'Not available'}
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium">Member Since</p>
                                <p className="text-sm text-muted-foreground">
                                  {user.createdAt
                                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })
                                    : 'Not available'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Payment Method */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Payment Method</CardTitle>
                        <CardDescription>
                          Manage your billing information
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {subscriptionData?.paymentMethod ? (
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-8 bg-secondary rounded flex items-center justify-center">
                                  <span className="text-xs font-semibold">
                                    {subscriptionData.paymentMethod.brand?.toUpperCase() || 'CARD'}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    •••• •••• •••• {subscriptionData.paymentMethod.last4 || '****'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Expires {subscriptionData.paymentMethod.expMonth}/{subscriptionData.paymentMethod.expYear}
                                  </p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">Update</Button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm text-muted-foreground mb-3">No payment method on file</p>
                              <Button variant="outline" size="sm">Add Payment Method</Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cancel Subscription */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Cancel Subscription</CardTitle>
                        <CardDescription>
                          You can cancel your subscription at any time
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          If you cancel, you'll continue to have access to premium features until the end of your current billing period.
                        </p>
                        <Button variant="destructive" size="sm">
                          Cancel Membership
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Free Tier - Upgrade Options */}
                {!isPremium && (
                  <>

                {/* Premium Upgrade Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          Premium Membership
                          <Badge variant="outline">
                            Special Offer
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                          <span className="font-semibold">$24/year ($6/quarter)</span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Benefits List */}
                      <div className="grid grid-cols-1 gap-4">
                        {premiumBenefits.map((benefit, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                              <benefit.icon className="h-5 w-5 text-foreground" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground mb-1">{benefit.title}</h4>
                              <p className="text-sm text-muted-foreground">{benefit.description}</p>
                            </div>
                            <Check className="h-5 w-5 text-foreground flex-shrink-0 mt-0.5" />
                          </div>
                        ))}
                      </div>

                      {/* Pricing */}
                      <div className="bg-secondary/50 rounded-lg p-4 border">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-foreground mb-1">
                            $6
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            bills every 3 months
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Cancel anytime • No commitment
                          </div>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div className="text-center">
                        <Link href="/membership/signup">
                          <Button size="lg" className="font-semibold px-8">
                            Upgrade to Premium
                          </Button>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-2">
                          Secure checkout • Just $24 per year ($6/quarter)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* FAQ or Additional Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Why Upgrade?</CardTitle>
                    <CardDescription>
                      Premium membership helps us maintain and improve the platform while giving you access to exclusive advocacy tools and community features.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>
                        <strong>100% of membership fees</strong> go directly to supporting our advocacy efforts and platform development.
                      </p>
                      <p>
                        Join a community of dedicated advocates who are making a real difference in policy and governance.
                      </p>
                      <p>
                        <strong>No hidden fees.</strong> Cancel anytime with just one click.
                      </p>
                    </div>
                  </CardContent>
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