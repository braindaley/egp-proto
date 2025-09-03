'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Menu, ChevronRight, User as UserIcon, Settings, MessageSquare, Crown, Check, Mail, Users, Video, MessageCircle, Heart, BarChart3, Share2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function MembershipPage() {
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  
  if (loading) {
    return <p>Loading membership...</p>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const dashboardNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: UserIcon },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { label: 'Activity', href: '/dashboard/activity', icon: BarChart3 },
    { label: 'Membership', href: '/dashboard/membership', icon: Crown, isActive: true },
    { label: 'Edit Profile', href: '/dashboard/profile', icon: UserIcon },
    { label: 'Policy Interests', href: '/dashboard/interests', icon: Settings },
  ];

  const premiumBenefits = [
    {
      icon: Mail,
      title: 'Mailed Physical Letters',
      description: 'Receive printed advocacy letters and materials directly to your mailbox'
    },
    {
      icon: Heart,
      title: 'Support the Organization',
      description: 'Help fund our advocacy efforts and keep the platform running'
    },
    {
      icon: Users,
      title: 'Monthly Meet-ups',
      description: 'Join exclusive in-person gatherings with fellow advocates in your area'
    },
    {
      icon: Video,
      title: 'Group Zoom Sessions',
      description: 'Participate in virtual discussions and strategy sessions with other members'
    },
    {
      icon: MessageCircle,
      title: 'Messaging Between Users',
      description: 'Connect and coordinate with other advocates through our secure messaging system'
    },
    {
      icon: Share2,
      title: 'Receive and post all responses',
      description: 'Share responses to your transmittals with your peers'
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
                  Upgrade to Premium and unlock exclusive features to enhance your advocacy efforts.
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
                          <Badge variant="outline">Free</Badge>
                        </CardTitle>
                        <CardDescription>
                          You're currently using the free tier of our advocacy platform.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

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
                          <span className="font-semibold">$20/year</span>
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
                            $20
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            per year
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Cancel anytime • No commitment
                          </div>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div className="text-center">
                        <Button size="lg" className="font-semibold px-8">
                          Upgrade to Premium
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Secure checkout • Just $20 per year
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
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}