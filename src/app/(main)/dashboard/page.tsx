
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMessageCount } from '@/hooks/use-message-count';
import { useUserActivity } from '@/hooks/use-user-activity';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Menu, ChevronRight, User as UserIcon, Settings, MessageSquare, Crown, BarChart3, ThumbsUp, ThumbsDown, Megaphone, Eye, LogOut, CheckCircle, AlertCircle, Check, ExternalLink } from 'lucide-react';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
    const { user, loading, logout } = useAuth();
    const { messageCount, loading: messageCountLoading } = useMessageCount();
    const { activityStats, loading: activityLoading } = useUserActivity();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Testing toggles (for development) - synced with localStorage
    const [testAsPremium, setTestAsPremium] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('testAsPremium') === 'true';
        }
        return false;
    });
    const [testAsRegistered, setTestAsRegistered] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('testAsRegistered') !== 'false';
        }
        return true;
    });

    // Save to localStorage when toggles change
    const handlePremiumToggle = (checked: boolean) => {
        setTestAsPremium(checked);
        localStorage.setItem('testAsPremium', checked.toString());
    };

    const handleRegisteredToggle = (checked: boolean) => {
        setTestAsRegistered(checked);
        localStorage.setItem('testAsRegistered', checked.toString());
    };

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
        { label: 'Edit Profile', href: '/dashboard/profile', icon: UserIcon },
        { label: 'Membership', href: '/dashboard/membership', icon: Crown },
        { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
        { label: 'Activity', href: '/dashboard/activity', icon: BarChart3 },
        { label: 'Following', href: '/dashboard/following', icon: Eye },
        { label: 'Policy Interests', href: '/dashboard/interests', icon: Settings },
        { label: 'Log Out', href: '#', icon: LogOut, onClick: logout },
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
                                        item.onClick ? (
                                            <button
                                                key={item.label}
                                                onClick={() => {
                                                    setIsMobileMenuOpen(false);
                                                    item.onClick?.();
                                                }}
                                                className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors group w-full text-left"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <item.icon className="h-4 w-4" />
                                                    <span className="text-muted-foreground group-hover:text-foreground">
                                                        {item.label}
                                                    </span>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                                            </button>
                                        ) : (
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
                                        )
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
                                                item.onClick ? (
                                                    <button
                                                        key={item.label}
                                                        onClick={item.onClick}
                                                        className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors group w-full text-left"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <item.icon className="h-4 w-4" />
                                                            <span className="text-muted-foreground group-hover:text-foreground">
                                                                {item.label}
                                                            </span>
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                                                    </button>
                                                ) : (
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
                                                )
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

                            {/* Development Testing Toggle */}
                            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-blue-900">
                                        Testing Controls
                                    </h3>
                                    <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                        Development Only
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Membership Toggle */}
                                    <div className="flex items-center justify-between p-3 bg-white rounded-md border border-blue-200">
                                        <div className="flex items-center gap-2">
                                            <Crown className="h-4 w-4 text-blue-600" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground">
                                                    Membership Status
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {testAsPremium ? 'Premium Member' : 'Free Member'}
                                                </p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={testAsPremium}
                                                onChange={(e) => handlePremiumToggle(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    {/* Voter Registration Toggle */}
                                    <div className="flex items-center justify-between p-3 bg-white rounded-md border border-blue-200">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-blue-600" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground">
                                                    Registration Status
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {testAsRegistered ? 'Registered Voter' : 'Not Registered'}
                                                </p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={testAsRegistered}
                                                onChange={(e) => handleRegisteredToggle(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <main className="space-y-8">
                                {/* Voter Registration Status */}
                                {testAsRegistered ? (
                                    <Card className="border-green-200 bg-green-50/50">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-green-800">
                                                <CheckCircle className="h-5 w-5" />
                                                Verified Registered Voter
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-foreground">
                                                        {user.firstName} {user.lastName}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {user.address}, {user.city}, {user.state} {user.zipCode}
                                                    </p>
                                                    <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                                                        <Check className="h-3 w-3" />
                                                        Active Registration Status
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                                                        <Check className="h-5 w-5 text-white stroke-[3]" />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Card className="border-amber-200 bg-amber-50/50">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-amber-800">
                                                <AlertCircle className="h-5 w-5" />
                                                Voter Registration Required
                                            </CardTitle>
                                            <CardDescription className="text-amber-700">
                                                You must be a registered voter to send messages to your representatives
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="bg-white rounded-md p-4 border border-amber-200">
                                                <p className="text-sm font-medium text-foreground mb-1">
                                                    {user.firstName} {user.lastName}
                                                </p>
                                                {user.address && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {user.address}, {user.city}, {user.state} {user.zipCode}
                                                    </p>
                                                )}
                                                <p className="text-xs text-amber-700 mt-2 font-medium">
                                                    Status: Not Registered
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Button asChild className="w-full bg-amber-600 hover:bg-amber-700">
                                                    <a
                                                        href="https://vote.gov"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center gap-2"
                                                    >
                                                        Register to Vote
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                                <p className="text-xs text-center text-muted-foreground">
                                                    After registering, update your profile to unlock full features
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

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

                            </main>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
