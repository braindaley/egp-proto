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
import { Loader2, ArrowLeft, Download, Filter, Eye } from 'lucide-react';
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
    const [showEmailFilters, setShowEmailFilters] = useState(false);

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
                setPosition(foundCampaign.position || foundCampaign.stance === 'support' ? 'Support' : 'Oppose');
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

            {/* Performance Card */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Performance</CardTitle>
                            <CardDescription>
                                Campaign engagement and demographic insights
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select>
                                <SelectTrigger className="w-24">
                                    <SelectValue placeholder="CSV" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="csv">CSV</SelectItem>
                                    <SelectItem value="xlsx">Excel</SelectItem>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                    <SelectItem value="json">JSON</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button size="sm" variant="outline" disabled>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Vote Counts */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Vote Counts</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border">
                                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                    {(campaign.supportCount || 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-green-600 dark:text-green-400">Support</div>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border">
                                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                                    {(campaign.opposeCount || 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-red-600 dark:text-red-400">Oppose</div>
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Total votes: {((campaign.supportCount || 0) + (campaign.opposeCount || 0)).toLocaleString()}
                        </div>
                    </div>


                    {/* Demographic Breakdown */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Demographic Breakdown</h3>
                        
                        {/* Demographics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Age Groups Card */}
                            <Card className="p-4">
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-base text-blue-700 dark:text-blue-300">Age Groups</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>30-49</span><span className="font-medium">34%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>50-64</span><span className="font-medium">28%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>18-29</span><span className="font-medium">23%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>65+</span><span className="font-medium">15%</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Political Affiliation Card */}
                            <Card className="p-4">
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-base text-purple-700 dark:text-purple-300">Political Affiliation</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Democrat</span><span className="font-medium">42%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Independent</span><span className="font-medium">31%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Republican</span><span className="font-medium">18%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Other</span><span className="font-medium">9%</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Education Level Card */}
                            <Card className="p-4">
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-base text-green-700 dark:text-green-300">Education</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Bachelor's</span><span className="font-medium">41%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Graduate</span><span className="font-medium">29%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Some College</span><span className="font-medium">19%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>High School</span><span className="font-medium">12%</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Gender Identity Card */}
                            <Card className="p-4">
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-base text-orange-700 dark:text-orange-300">Gender</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Female</span><span className="font-medium">58%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Male</span><span className="font-medium">40%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Non-binary</span><span className="font-medium">1.3%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>No response</span><span className="font-medium">0.7%</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Geographic & Professional Data */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top States */}
                            <Card className="p-5">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-base text-teal-700 dark:text-teal-300">Top 5 States by Participation</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">California</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                    <div className="w-full h-2 bg-teal-500 rounded-full"></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">18%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">New York</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                    <div className="w-2/3 h-2 bg-teal-500 rounded-full"></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">12%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Texas</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                    <div className="w-3/5 h-2 bg-teal-500 rounded-full"></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">11%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Florida</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                    <div className="w-1/2 h-2 bg-teal-500 rounded-full"></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">9%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Washington</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                    <div className="w-1/3 h-2 bg-teal-500 rounded-full"></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">6%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Top Professions */}
                            <Card className="p-5">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-base text-indigo-700 dark:text-indigo-300">Professional Background</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Education</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                    <div className="w-full h-2 bg-indigo-500 rounded-full"></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">17%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Healthcare</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                    <div className="w-4/5 h-2 bg-indigo-500 rounded-full"></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">14%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Technology</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                    <div className="w-3/4 h-2 bg-indigo-500 rounded-full"></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">13%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Legal</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                    <div className="w-1/2 h-2 bg-indigo-500 rounded-full"></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">9%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Nonprofit</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                    <div className="w-2/5 h-2 bg-indigo-500 rounded-full"></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">8%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Special Demographics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border">
                                <div className="text-2xl font-bold text-green-700 dark:text-green-300">15%</div>
                                <div className="text-sm text-green-600 dark:text-green-400">Union Members</div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border">
                                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">11%</div>
                                <div className="text-sm text-blue-600 dark:text-blue-400">Military Families</div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border">
                                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">8%</div>
                                <div className="text-sm text-purple-600 dark:text-purple-400">Veterans</div>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg border">
                                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">7%</div>
                                <div className="text-sm text-orange-600 dark:text-orange-400">First Generation</div>
                            </div>
                        </div>
                    </div>

                    {/* Engagement Metrics */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Engagement Metrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                                <div className="text-xl font-bold">87%</div>
                                <div className="text-sm text-muted-foreground">Message completion rate</div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                                <div className="text-xl font-bold">2.3</div>
                                <div className="text-sm text-muted-foreground">Avg. messages per user</div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                                <div className="text-xl font-bold">156</div>
                                <div className="text-sm text-muted-foreground">Social shares</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Emails Sent Card */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Campaign Emails</CardTitle>
                            <CardDescription>
                                All emails sent to representatives for this campaign
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setShowEmailFilters(!showEmailFilters)}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                            </Button>
                            <Select>
                                <SelectTrigger className="w-24">
                                    <SelectValue placeholder="CSV" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="csv">CSV</SelectItem>
                                    <SelectItem value="xlsx">Excel</SelectItem>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                    <SelectItem value="json">JSON</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button size="sm" variant="outline" disabled>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filter Panel */}
                    {showEmailFilters && (
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                            <h4 className="font-medium mb-3">Filter by Demographics</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">Age Group</Label>
                                    <Select>
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="All ages" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All ages</SelectItem>
                                            <SelectItem value="18-29">18-29</SelectItem>
                                            <SelectItem value="30-49">30-49</SelectItem>
                                            <SelectItem value="50-64">50-64</SelectItem>
                                            <SelectItem value="65+">65+</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">Political Affiliation</Label>
                                    <Select>
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="All parties" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All parties</SelectItem>
                                            <SelectItem value="democrat">Democrat</SelectItem>
                                            <SelectItem value="republican">Republican</SelectItem>
                                            <SelectItem value="independent">Independent</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">State</Label>
                                    <Select>
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="All states" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All states</SelectItem>
                                            <SelectItem value="ca">California</SelectItem>
                                            <SelectItem value="ny">New York</SelectItem>
                                            <SelectItem value="tx">Texas</SelectItem>
                                            <SelectItem value="fl">Florida</SelectItem>
                                            <SelectItem value="wa">Washington</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">Profession</Label>
                                    <Select>
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="All professions" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All professions</SelectItem>
                                            <SelectItem value="education">Education</SelectItem>
                                            <SelectItem value="healthcare">Healthcare</SelectItem>
                                            <SelectItem value="technology">Technology</SelectItem>
                                            <SelectItem value="legal">Legal</SelectItem>
                                            <SelectItem value="nonprofit">Nonprofit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing 2,847 filtered results
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline">
                                        Clear Filters
                                    </Button>
                                    <Button size="sm">
                                        Apply Filters
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="space-y-4">
                        {/* Email Summary */}
                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div>
                                <div className="text-2xl font-bold">
                                    {Math.floor(((campaign.supportCount || 0) + (campaign.opposeCount || 0)) * 0.75).toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">Total emails sent</div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-semibold text-green-600">87%</div>
                                <div className="text-sm text-muted-foreground">Delivery rate</div>
                            </div>
                        </div>

                        {/* Recent Emails Table */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg">Recent Messages</h3>
                            <div className="max-h-96 overflow-y-auto">
                                <div className="space-y-2">
                                    {/* Header */}
                                    <div className="grid grid-cols-5 gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm font-medium">
                                        <div>From</div>
                                        <div>To</div>
                                        <div>Date</div>
                                        <div>Position</div>
                                        <div>Actions</div>
                                    </div>
                                    
                                    {/* Email Rows */}
                                    <div className="grid grid-cols-5 gap-4 p-3 border-b text-sm">
                                        <div className="font-medium">Sarah Martinez</div>
                                        <div>Rep. John Smith</div>
                                        <div className="text-muted-foreground">2 hours ago</div>
                                        <div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${campaign.position === 'Support' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}`}>
                                                {campaign.position}
                                            </span>
                                        </div>
                                        <div>
                                            <Button size="sm" variant="ghost">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-4 p-3 border-b text-sm">
                                        <div className="font-medium">Michael Chen</div>
                                        <div>Sen. Lisa Johnson</div>
                                        <div className="text-muted-foreground">4 hours ago</div>
                                        <div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${campaign.position === 'Support' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}`}>
                                                {campaign.position}
                                            </span>
                                        </div>
                                        <div>
                                            <Button size="sm" variant="ghost">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-4 p-3 border-b text-sm">
                                        <div className="font-medium">Jennifer Wilson</div>
                                        <div>Rep. David Brown</div>
                                        <div className="text-muted-foreground">6 hours ago</div>
                                        <div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${campaign.position === 'Support' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}`}>
                                                {campaign.position}
                                            </span>
                                        </div>
                                        <div>
                                            <Button size="sm" variant="ghost">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-4 p-3 border-b text-sm">
                                        <div className="font-medium">Robert Taylor</div>
                                        <div>Sen. Maria Rodriguez</div>
                                        <div className="text-muted-foreground">8 hours ago</div>
                                        <div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${campaign.position === 'Support' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}`}>
                                                {campaign.position}
                                            </span>
                                        </div>
                                        <div>
                                            <Button size="sm" variant="ghost">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-4 p-3 border-b text-sm">
                                        <div className="font-medium">Amanda Davis</div>
                                        <div>Rep. Thomas Lee</div>
                                        <div className="text-muted-foreground">12 hours ago</div>
                                        <div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${campaign.position === 'Support' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}`}>
                                                {campaign.position}
                                            </span>
                                        </div>
                                        <div>
                                            <Button size="sm" variant="ghost">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-4 p-3 border-b text-sm">
                                        <div className="font-medium">James Thompson</div>
                                        <div>Sen. Patricia White</div>
                                        <div className="text-muted-foreground">1 day ago</div>
                                        <div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${campaign.position === 'Support' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}`}>
                                                {campaign.position}
                                            </span>
                                        </div>
                                        <div>
                                            <Button size="sm" variant="ghost">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-4 p-3 border-b text-sm">
                                        <div className="font-medium">Lisa Anderson</div>
                                        <div>Rep. Kevin Martinez</div>
                                        <div className="text-muted-foreground">1 day ago</div>
                                        <div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${campaign.position === 'Support' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}`}>
                                                {campaign.position}
                                            </span>
                                        </div>
                                        <div>
                                            <Button size="sm" variant="ghost">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-4 p-3 border-b text-sm">
                                        <div className="font-medium">Mark Williams</div>
                                        <div>Rep. Sarah Kim</div>
                                        <div className="text-muted-foreground">2 days ago</div>
                                        <div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${campaign.position === 'Support' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}`}>
                                                {campaign.position}
                                            </span>
                                        </div>
                                        <div>
                                            <Button size="sm" variant="ghost">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-4 p-3 border-b text-sm">
                                        <div className="font-medium">Emily Johnson</div>
                                        <div>Sen. Robert Davis</div>
                                        <div className="text-muted-foreground">2 days ago</div>
                                        <div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${campaign.position === 'Support' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}`}>
                                                {campaign.position}
                                            </span>
                                        </div>
                                        <div>
                                            <Button size="sm" variant="ghost">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-4 p-3 border-b text-sm">
                                        <div className="font-medium">Carlos Rodriguez</div>
                                        <div>Rep. Michelle Brown</div>
                                        <div className="text-muted-foreground">3 days ago</div>
                                        <div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${campaign.position === 'Support' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}`}>
                                                {campaign.position}
                                            </span>
                                        </div>
                                        <div>
                                            <Button size="sm" variant="ghost">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Load More Button */}
                        <div className="text-center pt-4">
                            <Button variant="outline" disabled>
                                Load More Messages
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            </div>
        </div>
    );
}