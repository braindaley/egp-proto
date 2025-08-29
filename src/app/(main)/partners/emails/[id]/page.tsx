'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowLeft, Download, Filter, Eye } from 'lucide-react';
import Link from 'next/link';
import { type Campaign } from '@/lib/campaigns';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function CampaignEmailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
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
                
                setCampaign(foundCampaign);
            } catch (err) {
                setError('Failed to load campaign');
                console.error('Error loading campaign:', err);
            } finally {
                setIsLoading(false);
            }
        }

        loadCampaign();
    }, [params, user]);

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
                        <CardDescription>Please log in to view campaign emails.</CardDescription>
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
                            <Link href="/partners">Back to Campaigns</Link>
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
                        <Link href="/partners" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Campaigns
                        </Link>
                    </Button>
                </div>
                <h1 className="text-3xl font-bold font-headline">Campaign Emails</h1>
                <p className="text-muted-foreground mt-2">
                    {campaign.bill ? `Email messages for ${campaign.bill.type} ${campaign.bill.number}` : 'Campaign email messages'}
                </p>
                {campaign.bill && (
                    <Link 
                        href={`/bill/${campaign.bill.congress}/${campaign.bill.type.toLowerCase()}/${campaign.bill.number}`}
                        target="_blank"
                        className="text-sm text-primary hover:underline inline-block mt-1"
                    >
                        View bill details →
                    </Link>
                )}
            </header>

            <div className="space-y-6">
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