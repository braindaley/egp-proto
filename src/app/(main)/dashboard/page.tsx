
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMessageCount } from '@/hooks/use-message-count';
import { useUserActivity } from '@/hooks/use-user-activity';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Menu, ChevronRight, User as UserIcon, Settings, MessageSquare, Crown, BarChart3, ThumbsUp, ThumbsDown, Megaphone, Eye } from 'lucide-react';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
    const { user, loading, logout } = useAuth();
    const { messageCount, loading: messageCountLoading } = useMessageCount();
    const { activityStats, loading: activityLoading } = useUserActivity();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md p-8 text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Access Restricted</CardTitle>
                        <CardDescription>Please log in to view your dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/login">Log In</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const dashboardNavItems = [
        { label: 'Dashboard', href: '/dashboard', icon: UserIcon, isActive: true },
        { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
        { label: 'Activity', href: '/dashboard/activity', icon: BarChart3 },
        { label: 'Following', href: '/dashboard/following', icon: Eye },
        { label: 'Membership', href: '/dashboard/membership', icon: Crown },
        { label: 'Edit Profile', href: '/dashboard/profile', icon: UserIcon },
        { label: 'Policy Interests', href: '/dashboard/interests', icon: Settings },
        { label: 'Manage Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
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
                                <div>
                                    <h1 className="text-3xl font-bold font-headline">
                                        Welcome, {user.firstName || user.email}
                                    </h1>
                                    <p className="text-muted-foreground mt-1">
                                        Here is an overview of your advocacy efforts and tools.
                                    </p>
                                </div>
                            </header>
                            
                            <main className="space-y-8">
                                {/* High-Level Statistics Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5" />
                                            Your Advocacy Summary
                                        </CardTitle>
                                        <CardDescription>
                                            Overview of your advocacy activity and engagement.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {activityLoading || messageCountLoading ? (
                                            <p className="text-muted-foreground">Loading statistics...</p>
                                        ) : (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-foreground mb-1">
                                                        {messageCount}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">Messages Sent</div>
                                                </div>
                                                
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-foreground mb-1">
                                                        {activityStats.totalCount}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">Bills Engaged</div>
                                                </div>
                                                
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-green-600 mb-1 flex items-center justify-center gap-1">
                                                        <ThumbsUp className="h-4 w-4" />
                                                        {activityStats.supportedCount}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">Supported</div>
                                                </div>
                                                
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-red-600 mb-1 flex items-center justify-center gap-1">
                                                        <ThumbsDown className="h-4 w-4" />
                                                        {activityStats.opposedCount}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">Opposed</div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Quick Actions</CardTitle>
                                        <CardDescription>
                                            Navigate to different sections using the options below.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Link href="/dashboard/messages">
                                                <Card className="p-4 cursor-pointer transition-colors hover:bg-muted/50 h-full">
                                                    <CardHeader className="p-0 pb-2">
                                                        <CardTitle className="text-lg flex items-center gap-2">
                                                            <MessageSquare className="h-5 w-5" />
                                                            Messages
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-0 flex flex-col justify-between flex-1">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                Messages sent: <span className="font-medium">
                                                                    {messageCountLoading ? '...' : messageCount}
                                                                </span>
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                View your advocacy message history and status.
                                                            </p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                            
                                            <Link href="/dashboard/profile">
                                                <Card className="p-4 cursor-pointer transition-colors hover:bg-muted/50 h-full">
                                                    <CardHeader className="p-0 pb-2">
                                                        <CardTitle className="text-lg flex items-center gap-2">
                                                            <UserIcon className="h-5 w-5" />
                                                            Profile
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-0 flex flex-col justify-between flex-1">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">
                                                                Update your personal information and demographics.
                                                            </p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                            
                                            <Link href="/dashboard/interests">
                                                <Card className="p-4 cursor-pointer transition-colors hover:bg-muted/50 h-full">
                                                    <CardHeader className="p-0 pb-2">
                                                        <CardTitle className="text-lg flex items-center gap-2">
                                                            <Settings className="h-5 w-5" />
                                                            Policy Interests
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-0 flex flex-col justify-between flex-1">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                Set your interest levels for different policy areas.
                                                            </p>
                                                            {user.policyInterests && (
                                                                <p className="text-xs text-green-600">
                                                                    ✓ Interests configured
                                                                </p>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                            
                                            <Link href="/dashboard/membership">
                                                <Card className="p-4 cursor-pointer transition-colors hover:bg-muted/50 h-full">
                                                    <CardHeader className="p-0 pb-2">
                                                        <CardTitle className="text-lg flex items-center gap-2">
                                                            <Crown className="h-5 w-5" />
                                                            Membership
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-0 flex flex-col justify-between flex-1">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                Current plan: <span className="font-medium">Free</span>
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Upgrade to Premium for exclusive features and benefits.
                                                            </p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Campaign Management Section */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Campaign Management</CardTitle>
                                        <CardDescription>
                                            Track and manage your advocacy campaigns
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Link href="/dashboard/campaigns">
                                            <Card className="p-6 cursor-pointer transition-colors hover:bg-muted/50">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <Megaphone className="h-6 w-6 text-primary" />
                                                            <h3 className="text-xl font-semibold">Manage Campaigns</h3>
                                                        </div>
                                                        <p className="text-muted-foreground mb-4">
                                                            Create, edit, and track advocacy campaigns for important policy issues.
                                                        </p>
                                                        
                                                        {/* Campaign Stats */}
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                            <div>
                                                                <div className="font-medium text-primary">24</div>
                                                                <div className="text-muted-foreground">Active Campaigns</div>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-green-600">156</div>
                                                                <div className="text-muted-foreground">Total Participants</div>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-blue-600">8</div>
                                                                <div className="text-muted-foreground">Issue Categories</div>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-orange-600">342</div>
                                                                <div className="text-muted-foreground">Messages Sent</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-4" />
                                                </div>
                                            </Card>
                                        </Link>
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
