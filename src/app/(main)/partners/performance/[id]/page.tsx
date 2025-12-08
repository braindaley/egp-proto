'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { type Campaign } from '@/lib/campaigns';
import { type CampaignDemographics } from '@/lib/mock-l2-data';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

interface DemographicsResponse {
    campaignId: string;
    demographics: CampaignDemographics;
    engagement: {
        totalParticipants: number;
        supportCount: number;
        opposeCount: number;
        supportParticipants: number;
        opposeParticipants: number;
        messageCompletionRate: number;
        avgMessagesPerUser: number;
        repeatEngagementRate: number;
        socialShares: number;
    };
    meta: {
        dataSource: 'real' | 'simulated';
        sampleSize: number;
        generatedAt: string;
    };
}

// Helper to get top N entries from a percentage object
function getTopEntries(data: { [key: string]: number }, n: number = 5): [string, number][] {
    return Object.entries(data)
        .sort(([, a], [, b]) => b - a)
        .slice(0, n);
}

// Helper to calculate bar width percentage (relative to max value)
function getBarWidth(value: number, maxValue: number): string {
    return `${Math.round((value / maxValue) * 100)}%`;
}

export default function CampaignPerformancePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [demographics, setDemographics] = useState<DemographicsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            if (!user) return;

            try {
                const { id } = await params;

                // Fetch campaign and demographics in parallel
                const [campaignRes, demographicsRes] = await Promise.all([
                    fetch(`/api/campaigns/${id}`),
                    fetch(`/api/campaigns/${id}/demographics`)
                ]);

                if (!campaignRes.ok) {
                    setError('Campaign not found');
                    return;
                }

                const campaignData = await campaignRes.json();
                setCampaign(campaignData.campaign);

                if (demographicsRes.ok) {
                    const demographicsData = await demographicsRes.json();
                    setDemographics(demographicsData);
                }
            } catch (err) {
                setError('Failed to load campaign');
                console.error('Error loading campaign:', err);
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
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

    const demo = demographics?.demographics;
    const engagement = demographics?.engagement;
    const totalActions = (campaign.supportCount || 0) + (campaign.opposeCount || 0);

    // Get sorted data for display
    const topStates = demo ? getTopEntries(demo.states, 5) : [];
    const topOccupations = demo ? getTopEntries(demo.occupation, 5) : [];
    const maxStateValue = topStates.length > 0 ? topStates[0][1] : 1;
    const maxOccupationValue = topOccupations.length > 0 ? topOccupations[0][1] : 1;

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
                    {(campaign as any).name || campaign.bill?.title || 'Campaign performance data'}
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
                        <CardTitle>Performance</CardTitle>
                        <CardDescription>
                            Campaign engagement and demographic insights
                            {demographics?.meta?.dataSource === 'simulated' && (
                                <span className="ml-2 text-xs text-amber-600">(Demo data)</span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Vote Counts & Voter Verification */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Core Metrics</h3>
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
                        </div>

                        {/* Demographic Breakdown */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Demographic Breakdown</h3>
                                <div className="text-xs text-muted-foreground">
                                    Based on verified voter registration data
                                </div>
                            </div>

                            {/* Demographics Grid - 2x2 layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Age & Generation Card */}
                                <Card className="p-4">
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-base text-blue-700 dark:text-blue-300">Age & Generation</h4>
                                        <div className="space-y-2">
                                            <div className="text-xs text-muted-foreground mb-2">Age Groups</div>
                                            {demo && Object.entries(demo.ageGroups)
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 4)
                                                .map(([group, pct]) => (
                                                    <div key={group} className="flex justify-between text-sm">
                                                        <span>{group}</span><span className="font-medium">{pct}%</span>
                                                    </div>
                                                ))}
                                            <div className="text-xs text-muted-foreground mt-3 mb-2">Generations</div>
                                            {demo && Object.entries(demo.generations)
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 3)
                                                .map(([gen, pct]) => (
                                                    <div key={gen} className="flex justify-between text-sm">
                                                        <span>{gen}</span><span className="font-medium">{pct}%</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </Card>

                                {/* Political Profile Card */}
                                <Card className="p-4">
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-base text-purple-700 dark:text-purple-300">Political Profile</h4>
                                        <div className="space-y-2">
                                            <div className="text-xs text-muted-foreground mb-2">Party Registration</div>
                                            {demo && Object.entries(demo.partyRegistration)
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 4)
                                                .map(([party, pct]) => (
                                                    <div key={party} className="flex justify-between text-sm">
                                                        <span>{party}</span><span className="font-medium">{pct}%</span>
                                                    </div>
                                                ))}
                                            <div className="text-xs text-muted-foreground mt-3 mb-2">Likely Voter Score</div>
                                            {demo && (
                                                <>
                                                    <div className="flex justify-between text-sm">
                                                        <span>High (80-100)</span><span className="font-medium">{demo.likelyVoterScore.high}%</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span>Medium (50-79)</span><span className="font-medium">{demo.likelyVoterScore.medium}%</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span>Low (0-49)</span><span className="font-medium">{demo.likelyVoterScore.low}%</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </Card>

                                {/* Education & Income Card */}
                                <Card className="p-4">
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-base text-green-700 dark:text-green-300">Education & Income</h4>
                                        <div className="space-y-2">
                                            <div className="text-xs text-muted-foreground mb-2">Education (Modeled)</div>
                                            {demo && Object.entries(demo.education)
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 4)
                                                .map(([edu, pct]) => (
                                                    <div key={edu} className="flex justify-between text-sm">
                                                        <span className="truncate max-w-[100px]" title={edu}>{edu.replace(' Likely', '')}</span>
                                                        <span className="font-medium">{pct}%</span>
                                                    </div>
                                                ))}
                                            <div className="text-xs text-muted-foreground mt-3 mb-2">Household Income</div>
                                            {demo && Object.entries(demo.income)
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 3)
                                                .map(([income, pct]) => (
                                                    <div key={income} className="flex justify-between text-sm">
                                                        <span className="truncate max-w-[100px]" title={income}>{income}</span>
                                                        <span className="font-medium">{pct}%</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </Card>

                                {/* Gender & Ethnicity Card */}
                                <Card className="p-4">
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-base text-orange-700 dark:text-orange-300">Gender & Ethnicity</h4>
                                        <div className="space-y-2">
                                            <div className="text-xs text-muted-foreground mb-2">Gender</div>
                                            {demo && Object.entries(demo.gender)
                                                .sort(([, a], [, b]) => b - a)
                                                .map(([gender, pct]) => (
                                                    <div key={gender} className="flex justify-between text-sm">
                                                        <span>{gender}</span><span className="font-medium">{pct}%</span>
                                                    </div>
                                                ))}
                                            <div className="text-xs text-muted-foreground mt-3 mb-2">Ethnicity (Modeled)</div>
                                            {demo && Object.entries(demo.ethnicity)
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 4)
                                                .map(([eth, pct]) => (
                                                    <div key={eth} className="flex justify-between text-sm">
                                                        <span>{eth}</span><span className="font-medium">{pct}%</span>
                                                    </div>
                                                ))}
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
                                            {topStates.map(([state, pct]) => (
                                                <div key={state} className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{state}</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                            <div
                                                                className="h-2 bg-teal-500 rounded-full"
                                                                style={{ width: getBarWidth(pct, maxStateValue) }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-semibold w-10 text-right">{pct}%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>

                                {/* Top Professions */}
                                <Card className="p-5">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-base text-indigo-700 dark:text-indigo-300">Professional Background</h4>
                                        <div className="space-y-3">
                                            {topOccupations.map(([occ, pct]) => (
                                                <div key={occ} className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{occ}</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                            <div
                                                                className="h-2 bg-indigo-500 rounded-full"
                                                                style={{ width: getBarWidth(pct, maxOccupationValue) }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-semibold w-10 text-right">{pct}%</span>
                                                    </div>
                                                </div>
                                            ))}
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
                                                    <span>2024</span>
                                                    <span className="font-medium">{demo?.voterHistory.general2024 || 0}%</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>2022</span>
                                                    <span className="font-medium">{demo?.voterHistory.general2022 || 0}%</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>2020</span>
                                                    <span className="font-medium">{demo?.voterHistory.general2020 || 0}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-muted-foreground">Primary Participation</div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span>2024</span>
                                                    <span className="font-medium">{demo?.voterHistory.primary2024 || 0}%</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>2022</span>
                                                    <span className="font-medium">{demo?.voterHistory.primary2022 || 0}%</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>2020</span>
                                                    <span className="font-medium">{demo?.voterHistory.primary2020 || 0}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">Average Turnout</span>
                                            <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                                                {demo?.voterHistory.averageTurnout || 0}%
                                            </span>
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
                                                    <div
                                                        className="h-2 bg-pink-500 rounded-full"
                                                        style={{ width: `${demo?.homeownership?.Owner || 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">
                                                    {demo?.homeownership?.Owner || 0}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Households w/ Children</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                    <div
                                                        className="h-2 bg-pink-500 rounded-full"
                                                        style={{ width: `${demo?.householdsWithChildren || 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">
                                                    {demo?.householdsWithChildren || 0}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Married</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                    <div
                                                        className="h-2 bg-pink-500 rounded-full"
                                                        style={{ width: `${demo?.married || 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">
                                                    {demo?.married || 0}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">Urban/Suburban</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                    <div
                                                        className="h-2 bg-pink-500 rounded-full"
                                                        style={{ width: `${(demo?.urbanRural?.Urban || 0) + (demo?.urbanRural?.Suburban || 0)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-semibold w-10 text-right">
                                                    {(demo?.urbanRural?.Urban || 0) + (demo?.urbanRural?.Suburban || 0)}%
                                                </span>
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
                                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                            {demo?.veterans || 0}%
                                        </div>
                                        <div className="text-sm text-green-600 dark:text-green-400">Veterans</div>
                                    </div>
                                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border">
                                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                            {demo?.urbanRural?.Rural || 0}%
                                        </div>
                                        <div className="text-sm text-blue-600 dark:text-blue-400">Rural Communities</div>
                                    </div>
                                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border">
                                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                            {demo?.homeownership?.Renter || 0}%
                                        </div>
                                        <div className="text-sm text-purple-600 dark:text-purple-400">Renters</div>
                                    </div>
                                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg border">
                                        <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                                            {demo?.ageGroups?.['18-24'] || 0}%
                                        </div>
                                        <div className="text-sm text-orange-600 dark:text-orange-400">Young Voters (18-24)</div>
                                    </div>
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
                                            <strong>{demo?.verifiedVoterPercentage || 0}% of participants</strong> are verified registered voters through our voter registration database.
                                            Demographics marked as <strong>&quot;Modeled&quot;</strong> are statistically predicted based on voter file data,
                                            census information, and consumer data. All data shown represents anonymized aggregates only—
                                            individual user information is never exposed.
                                            {demographics?.meta?.dataSource === 'simulated' && (
                                                <span className="block mt-2 text-amber-700 dark:text-amber-300">
                                                    <strong>Note:</strong> This page is showing simulated demographic data for demonstration purposes.
                                                    Real data will appear once users submit advocacy forms for this campaign.
                                                </span>
                                            )}
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
