'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { campaignsService, type Campaign } from '@/lib/campaigns';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

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

export default function EditCampaignPage() {
    const router = useRouter();
    const params = useParams();
    const { user, loading: authLoading } = useAuth();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [position, setPosition] = useState<'Support' | 'Oppose'>('Support');
    const [reasoning, setReasoning] = useState('');
    const [actionButtonText, setActionButtonText] = useState('Voice your opinion');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const groupSlug = params?.groupSlug as string;
    const campaignId = params?.id as string;
    const groupInfo = advocacyGroups.find(g => g.slug === groupSlug);

    useEffect(() => {
        async function loadCampaign() {
            if (!user || !campaignId) return;
            
            try {
                // Load campaign from API (handles both Firebase and static campaigns)
                const response = await fetch(`/api/campaigns/${campaignId}`);
                
                if (!response.ok) {
                    setError('Campaign not found');
                    return;
                }
                
                const data = await response.json();
                const foundCampaign = data.campaign;
                
                // Verify this campaign belongs to the correct group
                if (foundCampaign.groupSlug !== groupSlug) {
                    setError('Campaign not found for this group');
                    return;
                }
                
                console.log('Campaign data:', foundCampaign);
                
                setCampaign(foundCampaign);
                setPosition(foundCampaign.stance === 'support' ? 'Support' : foundCampaign.stance === 'oppose' ? 'Oppose' : foundCampaign.position || 'Support');
                setReasoning(foundCampaign.reasoning || '');
                setActionButtonText(foundCampaign.actionButtonText || 'Voice your opinion');
            } catch (err) {
                setError('Failed to load campaign');
                console.error('Error loading campaign:', err);
            } finally {
                setIsLoading(false);
            }
        }

        loadCampaign();
    }, [campaignId, user, groupSlug]);

    const handleSave = async () => {
        if (!campaign || !reasoning) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSaving(true);
        try {
            if (campaign.isStatic) {
                // For static campaigns, create a new Firebase campaign to make it editable
                const response = await fetch('/api/campaigns', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        groupSlug,
                        billType: campaign.bill.type,
                        billNumber: campaign.bill.number,
                        billTitle: campaign.bill.title,
                        position,
                        reasoning,
                        actionButtonText,
                        supportCount: campaign.supportCount || 0,
                        opposeCount: campaign.opposeCount || 0
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to create editable campaign');
                }

                console.log('Static campaign migrated to Firebase successfully');
            } else {
                // For Firebase campaigns, update normally
                const response = await fetch(`/api/campaigns/${campaign.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        position,
                        reasoning,
                        actionButtonText
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to update campaign');
                }
            }

            // Redirect back to group campaigns dashboard
            router.push(`/partners/groups/${groupSlug}/campaigns`);
        } catch (error) {
            console.error('Error saving campaign:', error);
            alert(error instanceof Error ? error.message : 'Failed to save campaign');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md p-8 text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Access Restricted</CardTitle>
                        <CardDescription>Please log in to edit campaigns.</CardDescription>
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

    if (!groupInfo) {
        return (
            <div className="container mx-auto p-4 md:p-8 max-w-[800px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Group Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">The requested advocacy group was not found.</p>
                        <Button className="mt-4" asChild>
                            <Link href="/partners">Back to Partners</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !campaign) {
        return (
            <div className="container mx-auto p-4 md:p-8 max-w-[800px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{error || 'Campaign not found'}</p>
                        <Button className="mt-4" asChild>
                            <Link href={`/partners/groups/${groupSlug}/campaigns`}>Back to {groupInfo.name} Campaigns</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-[800px]">
            <header className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/partners/groups/${groupSlug}/campaigns`} className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to {groupInfo.name} Campaigns
                        </Link>
                    </Button>
                </div>
                <h1 className="text-3xl font-bold font-headline">Edit Campaign</h1>
                <p className="text-muted-foreground mt-2">
                    {campaign.bill ? `Edit campaign for ${campaign.bill.type} ${campaign.bill.number}` : 'Edit campaign'}
                </p>
                {campaign?.isStatic && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-700">
                            <strong>Note:</strong> This is a template campaign. When you save your changes, it will be copied to your account and become fully editable.
                        </p>
                    </div>
                )}
            </header>

            <div className="space-y-6">
                <Card>
                <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Read-only fields */}
                    <div className="space-y-2">
                        <Label>Advocacy Group</Label>
                        <Input value={groupInfo.name} disabled />
                    </div>

                    <div className="space-y-2">
                        <Label>Bill</Label>
                        <Input 
                            value={campaign.bill ? `${campaign.bill.type} ${campaign.bill.number}${campaign.bill.title ? ` - ${campaign.bill.title}` : ''}` : 'Bill information not available'} 
                            disabled 
                        />
                        {campaign.bill && (
                            <Link 
                                href={`/bill/${campaign.bill.congress}/${campaign.bill.type.toLowerCase()}/${campaign.bill.number}`}
                                target="_blank"
                                className="text-sm text-primary hover:underline inline-block"
                            >
                                View bill details →
                            </Link>
                        )}
                    </div>

                    {/* Editable fields */}
                    <div className="space-y-2">
                        <Label htmlFor="position">Position *</Label>
                        <Select value={position} onValueChange={(value) => setPosition(value as 'Support' | 'Oppose')}>
                            <SelectTrigger id="position">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Support">Support</SelectItem>
                                <SelectItem value="Oppose">Oppose</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reasoning">Reasoning *</Label>
                        <Textarea
                            id="reasoning"
                            placeholder="Explain why your organization supports or opposes this bill. You can use Markdown formatting."
                            value={reasoning}
                            onChange={(e) => setReasoning(e.target.value)}
                            rows={8}
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            Supports Markdown formatting. Use ### for headings, ** for bold, * for bullet points.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="action-text">Action Button Text</Label>
                        <Input
                            id="action-text"
                            placeholder="Text for the action button"
                            value={actionButtonText}
                            onChange={(e) => setActionButtonText(e.target.value)}
                        />
                    </div>


                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={!reasoning || isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/partners/groups/${groupSlug}/campaigns`}>Cancel</Link>
                        </Button>
                        {campaign.bill && campaign.groupSlug && (
                            <Button variant="outline" asChild>
                                <Link 
                                    href={`/campaigns/${campaign.groupSlug}/${campaign.bill.type.toLowerCase()}-${campaign.bill.number}`}
                                    target="_blank"
                                >
                                    View Live Campaign
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            </div>
        </div>
    );
}