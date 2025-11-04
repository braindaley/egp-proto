'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ExternalLink, Edit2, Trash2, Loader2, BarChart3, Mail, Menu, ChevronRight, Home, Users, Megaphone, Copy, Check, PieChart } from 'lucide-react';
import { useParams } from 'next/navigation';

// Force dynamic rendering to prevent prerendering issues
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
    isStatic?: boolean;
    campaignType?: string;
    issueTitle?: string;
    issueSpecificTitle?: string;
}

interface OtherCampaign {
    id: string;
    bioguideId: string;
    memberName: string;
    position: string;
    billType: string;
    billNumber: string;
    supportCount: number;
    opposeCount: number;
}

interface MemberInfo {
    bioguideId: string;
    name: string;
    firstName?: string;
    lastName?: string;
    party?: string;
    state?: string;
    chamber?: string;
}

export default function MemberCampaignsPage() {
    const { user, loading } = useAuth();
    const params = useParams();
    const bioguideId = params?.bioguideId as string;

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [otherCampaigns, setOtherCampaigns] = useState<{ [key: string]: OtherCampaign[] }>({});
    const [deletingCampaign, setDeletingCampaign] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [copiedCampaign, setCopiedCampaign] = useState<string | null>(null);
    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
    const [memberLoading, setMemberLoading] = useState(true);

    // Fetch member info from Congress API
    useEffect(() => {
        const fetchMemberInfo = async () => {
            if (!bioguideId) return;

            setMemberLoading(true);
            try {
                const response = await fetch(`/api/congress/member/${bioguideId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch member info');
                }
                const data = await response.json();
                setMemberInfo({
                    bioguideId: data.bioguideId,
                    name: `${data.firstName} ${data.lastName}`,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    party: data.party,
                    state: data.state,
                    chamber: data.chamber
                });
            } catch (error) {
                console.error('Error fetching member info:', error);
                setMemberInfo(null);
            } finally {
                setMemberLoading(false);
            }
        };

        fetchMemberInfo();
    }, [bioguideId]);

    // Function to fetch other campaigns for the same bill
    const fetchOtherCampaigns = async (campaigns: Campaign[]) => {
        if (!campaigns.length) {
            setOtherCampaigns({});
            return;
        }

        try {
            const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore');
            const { app } = await import('@/lib/firebase');
            const db = getFirestore(app);

            const otherCampaignsMap: { [key: string]: OtherCampaign[] } = {};

            // For each campaign, find other campaigns for the same bill
            for (const campaign of campaigns) {
                const billKey = `${campaign.bill.type}-${campaign.bill.number}`;

                // Query for campaigns with same bill type and number, then filter client-side
                const otherCampaignsQuery = query(
                    collection(db, 'campaigns'),
                    where('billType', '==', campaign.bill.type),
                    where('billNumber', '==', campaign.bill.number)
                );

                const querySnapshot = await getDocs(otherCampaignsQuery);
                const otherCampaignsForBill = querySnapshot.docs
                    .filter(doc => doc.data().bioguideId !== bioguideId) // Filter client-side
                    .map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            bioguideId: data.bioguideId,
                            memberName: data.memberName || data.bioguideId,
                            position: data.position,
                            billType: data.billType,
                            billNumber: data.billNumber,
                            supportCount: data.supportCount || 0,
                            opposeCount: data.opposeCount || 0
                        };
                    });

                otherCampaignsMap[billKey] = otherCampaignsForBill;
            }

            setOtherCampaigns(otherCampaignsMap);
        } catch (error) {
            console.error('Error fetching other campaigns:', error);
        }
    };

    // Load campaigns for this member
    useEffect(() => {
        const loadCampaigns = async () => {
            if (!user || !bioguideId) return;

            try {
                // Fetch campaigns from Firebase
                const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore');
                const { app } = await import('@/lib/firebase');

                const db = getFirestore(app);
                console.log('Current user ID:', user.uid);
                console.log('Looking for bioguideId:', bioguideId);

                const campaignsQuery = query(
                    collection(db, 'campaigns'),
                    where('bioguideId', '==', bioguideId)
                );

                const querySnapshot = await getDocs(campaignsQuery);
                const firebaseCampaignsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    bill: {
                        type: doc.data().billType,
                        number: doc.data().billNumber,
                        title: doc.data().billTitle
                    },
                    position: doc.data().position,
                    reasoning: doc.data().reasoning,
                    supportCount: doc.data().supportCount || 0,
                    opposeCount: doc.data().opposeCount || 0,
                    ...doc.data()
                }));

                // Sort campaigns: Legislation first, then Issues, and by creation date (newest first)
                const sortedCampaigns = firebaseCampaignsData.sort((a, b) => {
                    // First sort by type: Legislation before Issue
                    const aType = a.campaignType === 'Issue' ? 1 : 0;
                    const bType = b.campaignType === 'Issue' ? 1 : 0;
                    if (aType !== bType) return aType - bType;

                    // Then by creation date (newest first)
                    const aDate = a.createdAt?.toDate?.() || new Date(0);
                    const bDate = b.createdAt?.toDate?.() || new Date(0);
                    return bDate.getTime() - aDate.getTime();
                });

                console.log(`Loading ${sortedCampaigns.length} campaigns for ${bioguideId}:`, sortedCampaigns.map(c => ({ id: c.id, type: c.bill?.type, number: c.bill?.number, campaignType: c.campaignType })));
                setCampaigns(sortedCampaigns);
                // Fetch other campaigns after setting campaigns
                await fetchOtherCampaigns(sortedCampaigns);
            } catch (error) {
                console.error('Error fetching campaigns:', error);
                setCampaigns([]);
                setOtherCampaigns({});
            }
        };

        loadCampaigns();
    }, [bioguideId, user]);

    const handleCopyLink = async (campaign: Campaign) => {
        const campaignUrl = `${window.location.origin}/campaigns/members/${bioguideId}/${campaign.bill.type?.toLowerCase()}-${campaign.bill.number}`;

        try {
            await navigator.clipboard.writeText(campaignUrl);
            setCopiedCampaign(campaign.id);
            setTimeout(() => setCopiedCampaign(null), 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
            // Fallback for browsers that don't support clipboard API
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

            // Refresh campaigns list
            if (bioguideId && user) {
                try {
                    // Fetch campaigns from Firebase
                    const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore');
                    const { app } = await import('@/lib/firebase');

                    const db = getFirestore(app);
                    const campaignsQuery = query(
                        collection(db, 'campaigns'),
                        where('bioguideId', '==', bioguideId)
                    );

                    const querySnapshot = await getDocs(campaignsQuery);
                    const firebaseCampaignsData = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        bill: {
                            type: doc.data().billType,
                            number: doc.data().billNumber,
                            title: doc.data().billTitle
                        },
                        position: doc.data().position,
                        reasoning: doc.data().reasoning,
                        supportCount: doc.data().supportCount || 0,
                        opposeCount: doc.data().opposeCount || 0,
                        ...doc.data()
                    }));

                    // Sort campaigns: Legislation first, then Issues, and by creation date (newest first)
                    const sortedCampaigns = firebaseCampaignsData.sort((a, b) => {
                        // First sort by type: Legislation before Issue
                        const aType = a.campaignType === 'Issue' ? 1 : 0;
                        const bType = b.campaignType === 'Issue' ? 1 : 0;
                        if (aType !== bType) return aType - bType;

                        // Then by creation date (newest first)
                        const aDate = a.createdAt?.toDate?.() || new Date(0);
                        const bDate = b.createdAt?.toDate?.() || new Date(0);
                        return bDate.getTime() - aDate.getTime();
                    });

                    setCampaigns(sortedCampaigns);
                    // Refresh other campaigns too
                    await fetchOtherCampaigns(sortedCampaigns);
                } catch (error) {
                    console.error('Error refreshing campaigns:', error);
                }
            }
        } catch (error) {
            console.error('Error deleting campaign:', error);
            alert(error instanceof Error ? error.message : 'Failed to delete campaign');
        } finally {
            setDeletingCampaign(null);
        }
    };

    if (loading || memberLoading) {
        return <p>Loading...</p>;
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md p-8 text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Access Restricted</CardTitle>
                        <CardDescription>Please log in to view campaigns.</CardDescription>
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

    if (!memberInfo) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md p-8 text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Member Not Found</CardTitle>
                        <CardDescription>The requested member was not found.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/partners">Back to Partners</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const dashboardNavItems = [
        { label: 'Partners Home', href: '/partners', icon: Home },
        { label: 'Manage page', href: `/partners/members/${bioguideId}/edit`, icon: Users },
        { label: 'Manage Campaigns', href: `/partners/members/${bioguideId}/campaigns`, icon: Megaphone, isActive: true },
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
                        Partners Navigation
                    </Button>
                </div>

                {/* Mobile Navigation Dropdown */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden mb-6">
                        <Card>
                            <CardContent className="p-0">
                                <nav className="space-y-1">
                                    {dashboardNavItems.map((item, index) => (
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
                                        <CardTitle className="text-lg">Partners</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <nav className="space-y-1">
                                            {dashboardNavItems.map((item, index) => (
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
                                    Campaigns for {memberInfo.name}
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Manage and monitor advocacy campaigns for {memberInfo.name}.
                                </p>
                            </header>

                            <main className="space-y-8">
                                {campaigns.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <BarChart3 className="h-5 w-5" />
                                                Campaign Summary for {memberInfo.name}
                                            </CardTitle>
                                            <CardDescription>
                                                Overview of all campaigns and their performance
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-foreground mb-1">
                                                        {campaigns.length}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">Active Campaigns</div>
                                                </div>

                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-green-600 mb-1">
                                                        {campaigns.reduce((sum, campaign) => sum + (campaign.supportCount || 0), 0)}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">Total Support</div>
                                                </div>

                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-red-600 mb-1">
                                                        {campaigns.reduce((sum, campaign) => sum + (campaign.opposeCount || 0), 0)}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">Total Oppose</div>
                                                </div>

                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-blue-600 mb-1">
                                                        {Math.floor(campaigns.reduce((sum, campaign) =>
                                                            sum + ((campaign.supportCount || 0) + (campaign.opposeCount || 0)) * 0.75, 0
                                                        )).toLocaleString()}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">Emails Sent</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Action Buttons */}
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold">
                                        Campaigns for {memberInfo.name}
                                    </h2>
                                    <Button asChild>
                                        <Link href={`/partners/members/${bioguideId}/campaigns/create`}>
                                            Create New Campaign
                                        </Link>
                                    </Button>
                                </div>

                                {/* Campaigns List */}
                                {campaigns.length > 0 ? (
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
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={`/campaigns/members/${bioguideId}/${campaign.bill.type?.toLowerCase()}-${campaign.bill.number}`}
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
                                                                <Link href={(campaign.campaignType === 'Candidate' || campaign.campaignType === 'Candidate Advocacy') ? `/partners/polls/${campaign.id}` : `/partners/performance/${campaign.id}`}>
                                                                    <BarChart3 className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                asChild
                                                            >
                                                                <Link href={`/partners/emails/${campaign.id}`}>
                                                                    <Mail className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                asChild
                                                            >
                                                                <Link href={`/partners/members/${bioguideId}/campaigns/edit/${campaign.id}`}>
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            {/* Only show delete button for Firebase campaigns, not static campaigns */}
                                                            {!campaign.isStatic && (
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
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-sm text-muted-foreground mb-4">
                                                        Support: {campaign.supportCount} &nbsp;&nbsp; Oppose: {campaign.opposeCount} &nbsp;&nbsp; {Math.floor(((campaign.supportCount || 0) + (campaign.opposeCount || 0)) * 0.75).toLocaleString()} emails &nbsp;&nbsp; 87% delivery
                                                    </div>

                                                    {(() => {
                                                        const billKey = `${campaign.bill.type}-${campaign.bill.number}`;
                                                        const otherCampaignsForBill = otherCampaigns[billKey] || [];

                                                        if (otherCampaignsForBill.length > 0) {
                                                            return (
                                                                <div className="border-t pt-4">
                                                                    <h4 className="text-sm font-semibold mb-3">Other network campaigns:</h4>
                                                                    <div className="space-y-2">
                                                                        {otherCampaignsForBill.map((otherCampaign) => (
                                                                            <div key={otherCampaign.id} className="flex items-center justify-between text-xs">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-medium">{otherCampaign.memberName}</span>
                                                                                    <Badge
                                                                                        variant={otherCampaign.position === 'Support' ? 'default' : 'destructive'}
                                                                                        className="text-xs px-1 py-0"
                                                                                    >
                                                                                        {otherCampaign.position === 'Support' ? 'Support' : 'Oppose'}
                                                                                    </Badge>
                                                                                    <div className="text-xs text-muted-foreground ml-2">
                                                                                        Support: {otherCampaign.supportCount} • Oppose: {otherCampaign.opposeCount} • {Math.floor(((otherCampaign.supportCount || 0) + (otherCampaign.opposeCount || 0)) * 0.75).toLocaleString()} emails
                                                                                    </div>
                                                                                </div>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    className="text-xs h-6 px-2"
                                                                                    asChild
                                                                                >
                                                                                    <Link href={`/campaigns/members/${otherCampaign.bioguideId}/${campaign.bill.type?.toLowerCase()}-${campaign.bill.number}`}>
                                                                                        Send message
                                                                                    </Link>
                                                                                </Button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Card>
                                        <CardContent className="pt-6">
                                            <p className="text-muted-foreground text-center">
                                                No campaigns yet for {memberInfo.name}.
                                            </p>
                                            <div className="text-center mt-4">
                                                <Button asChild>
                                                    <Link href={`/partners/members/${bioguideId}/campaigns/create`}>
                                                        Create Your First Campaign
                                                    </Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </main>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
