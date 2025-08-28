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
import { campaignsService, type Campaign } from '@/lib/campaigns';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function EditCampaignPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [position, setPosition] = useState<'Support' | 'Oppose'>('Support');
    const [reasoning, setReasoning] = useState('');
    const [actionButtonText, setActionButtonText] = useState('Voice your opinion');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadCampaign() {
            if (!user) return;
            
            try {
                const { id } = await params;
                const response = await fetch(`/api/campaigns/${id}`);
                
                if (!response.ok) {
                    setError('Campaign not found');
                    return;
                }
                
                const data = await response.json();
                const foundCampaign = data.campaign;
                
                console.log('Campaign data:', foundCampaign); // Debug log
                
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
    }, [params, user]);

    const handleSave = async () => {
        if (!campaign || !reasoning) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSaving(true);
        try {
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

            // Redirect back to campaigns dashboard
            router.push('/dashboard/campaigns');
        } catch (error) {
            console.error('Error updating campaign:', error);
            alert(error instanceof Error ? error.message : 'Failed to update campaign');
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
                            <Link href="/dashboard/campaigns">Back to Campaigns</Link>
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
                        <Link href="/dashboard/campaigns" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Campaigns
                        </Link>
                    </Button>
                </div>
                <h1 className="text-3xl font-bold font-headline">Edit Campaign</h1>
                <p className="text-muted-foreground mt-2">
                    {campaign.bill ? `Edit campaign for ${campaign.bill.type} ${campaign.bill.number}` : 'Edit campaign'}
                </p>
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
                        <Input value={campaign.groupName} disabled />
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
                            <Link href="/dashboard/campaigns">Cancel</Link>
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