'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { campaignsService, type Campaign } from '@/lib/campaigns';
import { ExternalLink, Edit2, Trash2, Loader2 } from 'lucide-react';

const advocacyGroups = [
    { name: 'League of Women Voters', slug: 'league-of-women-voters' },
    { name: 'Brennan Center for Justice', slug: 'brennan-center-for-justice' },
    { name: 'Common Cause', slug: 'common-cause' },
    { name: 'Fair Elections Center', slug: 'fair-elections-center' },
    { name: 'FairVote', slug: 'fairvote' },
    { name: 'Vote Smart', slug: 'vote-smart' },
    { name: 'VoteRiders', slug: 'voteriders' },
    { name: 'Rock the Vote', slug: 'rock-the-vote' },
    { name: 'Mi Familia Vota', slug: 'mi-familia-vota' },
    { name: 'Black Voters Matter', slug: 'black-voters-matter' },
    { name: 'When We All Vote', slug: 'when-we-all-vote' },
    { name: 'Fair Fight Action', slug: 'fair-fight-action' },
    { name: 'Campaign Legal Center', slug: 'campaign-legal-center' },
    { name: 'BallotReady', slug: 'ballotready' },
    { name: 'Democracy Works (TurboVote)', slug: 'democracy-works-turbovote' },
    { name: 'HeadCount', slug: 'headcount' },
    { name: 'State Voices', slug: 'state-voices' },
    { name: 'Asian Americans Advancing Justice', slug: 'asian-americans-advancing-justice' },
    { name: 'NAACP Legal Defense Fund', slug: 'naacp-legal-defense-fund' },
    { name: 'Voto Latino', slug: 'voto-latino' },
    { name: 'Alliance for Youth Action', slug: 'alliance-for-youth-action' },
    { name: 'National Vote at Home Institute', slug: 'national-vote-at-home-institute' },
    { name: 'National Voter Registration Day', slug: 'national-voter-registration-day' },
    { name: 'Democracy NC', slug: 'democracy-nc' },
    { name: 'The Civics Center', slug: 'the-civics-center' },
    { name: 'No Labels', slug: 'no-labels' },
].sort((a, b) => a.name.localeCompare(b.name));

export default function CampaignsPage() {
    const { user, loading } = useAuth();
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [deletingCampaign, setDeletingCampaign] = useState<string | null>(null);

    // Load saved group from localStorage on mount
    useEffect(() => {
        const savedGroup = localStorage.getItem('dashboard-selected-group');
        if (savedGroup) {
            setSelectedGroup(savedGroup);
        }
    }, []);

    // Save selected group to localStorage and load campaigns
    useEffect(() => {
        if (selectedGroup) {
            localStorage.setItem('dashboard-selected-group', selectedGroup);
            const groupCampaigns = campaignsService.getCampaignsByGroup(selectedGroup);
            setCampaigns(groupCampaigns);
        } else {
            localStorage.removeItem('dashboard-selected-group');
            setCampaigns([]);
        }
    }, [selectedGroup]);

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
            if (selectedGroup) {
                const groupCampaigns = campaignsService.getCampaignsByGroup(selectedGroup);
                setCampaigns(groupCampaigns);
            }
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

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-[672px]">
            <header className="mb-8">
                <h1 className="text-3xl font-bold font-headline">Campaigns</h1>
                <p className="text-muted-foreground mt-2 mb-4">
                    Manage and monitor your advocacy campaigns.
                </p>
                <h2 className="text-xl font-semibold mb-3">You are managing:</h2>
                <div className="w-full max-w-sm">
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an advocacy group" />
                        </SelectTrigger>
                        <SelectContent>
                            {advocacyGroups.map((group) => (
                                <SelectItem key={group.slug} value={group.slug}>
                                    {group.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </header>

            <div className="grid gap-6">
                {selectedGroup ? (
                    <>
                        {/* Action Buttons */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">
                                Campaigns for {advocacyGroups.find(g => g.slug === selectedGroup)?.name}
                            </h2>
                            <Button asChild>
                                <Link href={`/dashboard/campaigns/create?group=${selectedGroup}`}>
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
                                                        {campaign.bill.type} {campaign.bill.number}
                                                        {campaign.bill.title && ` - ${campaign.bill.title}`}
                                                    </CardTitle>
                                                    <div className="flex gap-2 mt-2">
                                                        <Badge variant={campaign.position === 'Support' ? 'default' : 'destructive'}>
                                                            {campaign.position}
                                                        </Badge>
                                                        <Badge variant="outline">
                                                            {campaign.supportCount + campaign.opposeCount} votes
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
                                                            href={`/groups/${selectedGroup}/${campaign.bill.type.toLowerCase()}-${campaign.bill.number}`}
                                                            target="_blank"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Link>
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
                                                <p className="line-clamp-2">{campaign.reasoning.replace(/[#*]/g, '').substring(0, 200)}...</p>
                                                <div className="mt-2 flex gap-4">
                                                    <span>Support: {campaign.supportCount}</span>
                                                    <span>Oppose: {campaign.opposeCount}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-muted-foreground text-center">
                                        No campaigns yet for {advocacyGroups.find(g => g.slug === selectedGroup)?.name}.
                                    </p>
                                    <div className="text-center mt-4">
                                        <Button asChild>
                                            <Link href={`/dashboard/campaigns/create?group=${selectedGroup}`}>
                                                Create Your First Campaign
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Select an Advocacy Group</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Please select an advocacy group above to view and manage campaigns.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}