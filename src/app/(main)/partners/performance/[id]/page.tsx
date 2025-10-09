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
import { Loader2, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { type Campaign } from '@/lib/campaigns';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function CampaignPerformancePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
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
                        <CardDescription>Please log in to view campaign performance.</CardDescription>
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
                <h1 className="text-3xl font-bold font-headline">Campaign Performance</h1>
                <p className="text-muted-foreground mt-2">
                    {campaign.bill ? `Performance data for ${campaign.bill.type} ${campaign.bill.number}` : 'Campaign performance data'}
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
                        {/* Vote Counts & Voter Verification */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Core Metrics</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border">
                                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                        {((campaign.supportCount || 0) + (campaign.opposeCount || 0)).toLocaleString()}
                                    </div>
                                    <div className="text-sm text-blue-600 dark:text-blue-400">Total Actions</div>
                                </div>
                                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border">
                                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                        73%
                                    </div>
                                    <div className="text-sm text-purple-600 dark:text-purple-400">Verified Voters</div>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Verified Voters: Participants verified through voter registration database
                            </div>
                        </div>

                        {/* Demographic Breakdown */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Demographic Breakdown</h3>
                                <div className="text-xs text-muted-foreground">
                                    Based on verified voter registration data
                                </div>
                            </div>

                            {/* Demographics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Age & Generation Card */}
                                <Card className="p-4">
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-base text-blue-700 dark:text-blue-300">Age & Generation</h4>
                                        <div className="space-y-2">
                                            <div className="text-xs text-muted-foreground mb-2">Age Groups</div>
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
                                            <div className="text-xs text-muted-foreground mt-3 mb-2">Generations</div>
                                            <div className="flex justify-between text-sm">
                                                <span>Millennial</span><span className="font-medium">36%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Gen X</span><span className="font-medium">31%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Boomer</span><span className="font-medium">25%</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Political Profile Card */}
                                <Card className="p-4">
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-base text-purple-700 dark:text-purple-300">Political Profile</h4>
                                        <div className="space-y-2">
                                            <div className="text-xs text-muted-foreground mb-2">Party Registration</div>
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
                                            <div className="text-xs text-muted-foreground mt-3 mb-2">Likely Voter Score</div>
                                            <div className="flex justify-between text-sm">
                                                <span>High (80-100)</span><span className="font-medium">61%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Medium (50-79)</span><span className="font-medium">28%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Low (0-49)</span><span className="font-medium">11%</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Education & Income Card */}
                                <Card className="p-4">
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-base text-green-700 dark:text-green-300">Education & Income</h4>
                                        <div className="space-y-2">
                                            <div className="text-xs text-muted-foreground mb-2">Education (Modeled)</div>
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
                                            <div className="text-xs text-muted-foreground mt-3 mb-2">Household Income</div>
                                            <div className="flex justify-between text-sm">
                                                <span>$75K-$149K</span><span className="font-medium">35%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>$50K-$74K</span><span className="font-medium">24%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>$150K+</span><span className="font-medium">22%</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Gender & Ethnicity Card */}
                                <Card className="p-4">
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-base text-orange-700 dark:text-orange-300">Gender & Ethnicity</h4>
                                        <div className="space-y-2">
                                            <div className="text-xs text-muted-foreground mb-2">Gender</div>
                                            <div className="flex justify-between text-sm">
                                                <span>Female</span><span className="font-medium">58%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Male</span><span className="font-medium">40%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Other/No response</span><span className="font-medium">2%</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-3 mb-2">Ethnicity (Modeled)</div>
                                            <div className="flex justify-between text-sm">
                                                <span>White</span><span className="font-medium">52%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Hispanic/Latino</span><span className="font-medium">18%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Black/African American</span><span className="font-medium">13%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Asian</span><span className="font-medium">11%</span>
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

                            {/* Voter History */}
                            <Card className="p-5">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-base text-indigo-700 dark:text-indigo-300">Voter History</h4>
                                    <div className="text-xs text-muted-foreground">
                                        Based on election participation records
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-muted-foreground">General Elections</div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span>2020</span>
                                                    <span className="font-medium">82%</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>2018</span>
                                                    <span className="font-medium">68%</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>2016</span>
                                                    <span className="font-medium">75%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-muted-foreground">Primary Participation</div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span>2020</span>
                                                    <span className="font-medium">54%</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>2018</span>
                                                    <span className="font-medium">41%</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>2016</span>
                                                    <span className="font-medium">48%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Average Turnout</span>
                                            <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">75%</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Household Demographics */}
                            <Card className="p-5">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-base text-pink-700 dark:text-pink-300">Household Demographics</h4>
                                    <div className="text-xs text-muted-foreground mb-3">
                                        Modeled demographic data
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Homeowners</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                    <div className="w-4/5 h-2 bg-pink-500 rounded-full"></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">68%</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Households w/ Children</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                    <div className="w-2/5 h-2 bg-pink-500 rounded-full"></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">38%</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Married</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                    <div className="w-3/5 h-2 bg-pink-500 rounded-full"></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">56%</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Single</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                    <div className="w-1/3 h-2 bg-pink-500 rounded-full"></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">32%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Special Interest Groups */}
                            <div className="col-span-full">
                                <h4 className="font-semibold text-base mb-4">Special Interest Groups</h4>
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
                        </div>

                        {/* Engagement Metrics */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Engagement Metrics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                                    <div className="text-xl font-bold">87%</div>
                                    <div className="text-sm text-muted-foreground">Message completion rate</div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                                    <div className="text-xl font-bold">2.3</div>
                                    <div className="text-sm text-muted-foreground">Avg. messages per user</div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                                    <div className="text-xl font-bold">18%</div>
                                    <div className="text-sm text-muted-foreground">Repeat engagement rate</div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                                    <div className="text-xl font-bold">156</div>
                                    <div className="text-sm text-muted-foreground">Social shares</div>
                                </div>
                            </div>
                        </div>

                        {/* Data Quality Indicator */}
                        <div className="pt-6 border-t">
                            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-3">
                                    <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                            About This Data
                                        </h4>
                                        <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                                            <strong>73% of participants</strong> are verified registered voters through our voter registration database.
                                            Demographics marked as <strong>&quot;Modeled&quot;</strong> are statistically predicted based on voter file data,
                                            census information, and consumer data. All data shown represents anonymized aggregates only—
                                            individual user information is never exposed.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}