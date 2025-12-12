'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ExternalLink, Edit2, Trash2, Loader2, Menu, ChevronRight, User as UserIcon, Settings, MessageSquare, Crown, Globe, Megaphone, Copy, Check, LogOut, Plus } from 'lucide-react';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

interface Campaign {
    id: string;
    bill: {
        type: string;
        number: string;
        title?: string;
    };
    position: string;
    reasoning: string;
    supportCount: number;
    opposeCount: number;
    campaignType?: string;
    issueTitle?: string;
    issueSpecificTitle?: string;
    createdAt?: any;
    updatedAt?: any;
    isActive?: boolean;
}

export default function UserCampaignsPage() {
    const { user, loading, logout } = useAuth();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(true);
    const [deletingCampaign, setDeletingCampaign] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [copiedCampaign, setCopiedCampaign] = useState<string | null>(null);

    const db = getFirestore(app);

    // Load user's campaigns
    useEffect(() => {
        const loadCampaigns = async () => {
            if (!user) {
                setLoadingCampaigns(false);
                return;
            }

            try {
                // Query campaigns where userId matches and it's a user campaign (no groupSlug or empty groupSlug)
                const campaignsQuery = query(
                    collection(db, 'campaigns'),
                    where('userId', '==', user.uid),
                    where('isUserCampaign', '==', true)
                );

                const querySnapshot = await getDocs(campaignsQuery);
                const userCampaigns = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        bill: {
                            type: data.billType,
                            number: data.billNumber,
                            title: data.billTitle
                        },
                        position: data.position,
                        reasoning: data.reasoning,
                        supportCount: data.supportCount || 0,
                        opposeCount: data.opposeCount || 0,
                        campaignType: data.campaignType,
                        issueTitle: data.issueTitle,
                        issueSpecificTitle: data.issueSpecificTitle,
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                        isActive: data.isActive
                    };
                });

                // Sort by creation date (newest first)
                userCampaigns.sort((a, b) => {
                    const aDate = a.createdAt?.toDate?.() || new Date(0);
                    const bDate = b.createdAt?.toDate?.() || new Date(0);
                    return bDate.getTime() - aDate.getTime();
                });

                setCampaigns(userCampaigns);
            } catch (error) {
                console.error('Error loading campaigns:', error);
                setCampaigns([]);
            } finally {
                setLoadingCampaigns(false);
            }
        };

        loadCampaigns();
    }, [user, db]);

    const handleCopyLink = async (campaign: Campaign) => {
        // User campaigns use the user's nickname in the URL
        const extendedUser = user as any;
        const nickname = extendedUser?.nickname;

        if (!nickname) {
            alert('Please set a nickname in your Public Profile settings to share campaign links.');
            return;
        }

        const campaignUrl = `${window.location.origin}/users/${nickname}/campaigns/${campaign.bill.type?.toLowerCase()}-${campaign.bill.number}`;

        try {
            await navigator.clipboard.writeText(campaignUrl);
            setCopiedCampaign(campaign.id);
            setTimeout(() => setCopiedCampaign(null), 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
            const textArea = document.createElement('textarea');
            textArea.value = campaignUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopiedCampaign(campaign.id);
            setTimeout(() => setCopiedCampaign(null), 2000);
        }
    };

    const handleDeleteCampaign = async (campaignId: string) => {
        if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
            return;
        }

        setDeletingCampaign(campaignId);
        try {
            const response = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete campaign');
            }

            // Remove from local state
            setCampaigns(prev => prev.filter(c => c.id !== campaignId));
        } catch (error) {
            console.error('Error deleting campaign:', error);
            alert(error instanceof Error ? error.message : 'Failed to delete campaign');
        } finally {
            setDeletingCampaign(null);
        }
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
                        <CardDescription>Please log in to view your campaigns.</CardDescription>
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
        { label: 'Dashboard', href: '/dashboard', icon: UserIcon },
        { label: 'Edit Profile', href: '/dashboard/profile', icon: UserIcon },
        { label: 'Public Profile', href: '/dashboard/public-profile', icon: Globe },
        { label: 'My Campaigns', href: '/dashboard/campaigns', icon: Megaphone, isActive: true },
        { label: 'Membership', href: '/dashboard/membership', icon: Crown },
        { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
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
                                    {dashboardNavItems.map((item, index) => (
                                        item.onClick ? (
                                            <button
                                                key={`mobile-${item.href}-${index}`}
                                                onClick={item.onClick}
                                                className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors group w-full text-left text-muted-foreground"
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
                                                key={`mobile-${item.href}-${index}`}
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
                                            {dashboardNavItems.map((item, index) => (
                                                item.onClick ? (
                                                    <button
                                                        key={`${item.href}-${index}`}
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
                                                        key={`${item.href}-${index}`}
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
                                <h1 className="text-3xl font-bold font-headline">My Campaigns</h1>
                                <p className="text-muted-foreground mt-1">
                                    Create and manage your personal advocacy campaigns.
                                </p>
                            </header>

                            <main className="space-y-6">
                                {/* Action Buttons */}
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold">Your Campaigns</h2>
                                    <Button asChild>
                                        <Link href="/dashboard/campaigns/create">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Campaign
                                        </Link>
                                    </Button>
                                </div>

                                {/* Loading State */}
                                {loadingCampaigns ? (
                                    <Card>
                                        <CardContent className="py-12 text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                            <p className="text-muted-foreground mt-2">Loading campaigns...</p>
                                        </CardContent>
                                    </Card>
                                ) : campaigns.length > 0 ? (
                                    <div className="grid gap-4">
                                        {campaigns.map((campaign) => (
                                            <Card key={campaign.id}>
                                                <CardHeader>
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <CardTitle className="text-lg">
                                                                {campaign.campaignType === 'Issue' ? (
                                                                    <>
                                                                        {campaign.issueTitle} - {campaign.issueSpecificTitle || campaign.bill.title}
                                                                    </>
                                                                ) : campaign.bill.type === 'POLL' ? (
                                                                    <>
                                                                        Poll - {campaign.bill.title || 'Untitled Poll'}
                                                                    </>
                                                                ) : campaign.bill.type === 'CANDIDATE' || campaign.campaignType === 'Candidate' || campaign.campaignType === 'Candidate Advocacy' ? (
                                                                    <>
                                                                        Candidate - {campaign.bill.title || 'Candidate Campaign'}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {campaign.bill.type} {campaign.bill.number}
                                                                        {campaign.bill.title && ` - ${campaign.bill.title}`}
                                                                    </>
                                                                )}
                                                            </CardTitle>
                                                            <div className="flex gap-2 mt-2">
                                                                <Badge variant={campaign.position === 'Support' ? 'default' : 'destructive'}>
                                                                    {campaign.position}
                                                                </Badge>
                                                                {campaign.campaignType && (
                                                                    <Badge variant="outline">
                                                                        {campaign.campaignType}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={`/users/${(user as any)?.nickname || 'preview'}/campaigns/${campaign.bill.type?.toLowerCase()}-${campaign.bill.number}`}
                                                                    target="_blank"
                                                                >
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleCopyLink(campaign)}
                                                                title="Copy campaign link"
                                                            >
                                                                {copiedCampaign === campaign.id ? (
                                                                    <Check className="h-4 w-4 text-green-600" />
                                                                ) : (
                                                                    <Copy className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                asChild
                                                            >
                                                                <Link href={`/dashboard/campaigns/edit/${campaign.id}`}>
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteCampaign(campaign.id)}
                                                                disabled={deletingCampaign === campaign.id}
                                                            >
                                                                {deletingCampaign === campaign.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-sm text-muted-foreground">
                                                        Support: {campaign.supportCount} | Oppose: {campaign.opposeCount} | {((campaign.supportCount || 0) + (campaign.opposeCount || 0)).toLocaleString()} Total Responses
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Card>
                                        <CardContent className="py-12 text-center">
                                            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                                            <p className="text-muted-foreground mb-4">
                                                Create your first campaign to start advocating for issues you care about.
                                            </p>
                                            <Button asChild>
                                                <Link href="/dashboard/campaigns/create">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Create Your First Campaign
                                                </Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Info Card */}
                                <Card className="bg-muted/50">
                                    <CardContent className="pt-6">
                                        <h3 className="font-semibold mb-2">About Personal Campaigns</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Personal campaigns allow you to advocate for legislation and issues that matter to you.
                                            Your campaigns will appear on your public profile and can be shared with others.
                                            Set up your <Link href="/dashboard/public-profile" className="text-primary hover:underline">public profile</Link> with a nickname to share your campaigns.
                                        </p>
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
