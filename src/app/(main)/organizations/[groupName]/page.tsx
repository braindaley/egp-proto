
'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getAdvocacyGroupData } from '@/lib/advocacy-groups';
import { campaignsService } from '@/lib/campaigns';
import { ArrowRight, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Users, Calendar, BarChart, Mic, Edit, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WatchButton } from '@/components/WatchButton';
import type { Bill, ApiCollection, Sponsor, Cosponsor, Committee, Summary, TextVersion, RelatedBill, Subject, PolicyArea } from '@/types';
import { getBillTypeSlug } from '@/lib/utils';
import { parseSimpleMarkdown } from '@/lib/markdown-utils';
import { remark } from 'remark';
import html from 'remark-html';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';

// Interfaces for API responses, to be used internally in this file
interface ApiResponse {
  [key: string]: any;
}
interface TitlesResponse {
  titles?: Array<{ title: string; titleType: string; isForPortion?: string; }>;
}
interface SummariesResponse {
  summaries?: Array<{ updateDate: string; [key: string]: any; }>;
}
interface ActionsResponse {
  actions?: Array<{ actionDate: string; text: string; [key: string]: any; }>;
}
interface CommitteesResponse {
  committees?: Array<{ name: string; systemCode: string; activities: Array<{ name: string; date?: string; }>; [key: string]: any; }>;
}
interface SubjectsResponse {
  subjects?: { legislativeSubjects?: Array<{ name: string; }>; policyArea?: { name: string; }; };
  pagination?: { next?: string; };
}

// Function to fetch full bill details directly from the Congress API
async function getBillDetails(congress: number, billType: string, billNumber: string): Promise<Bill | null> {
    const API_KEY = process.env.CONGRESS_API_KEY;
    if (!API_KEY) {
        console.error("CONGRESS_API_KEY is not set.");
        return null;
    }

    const billTypeSlug = getBillTypeSlug(billType);
    const baseUrl = `https://api.congress.gov/v3/bill/${congress}/${billTypeSlug}/${billNumber}`;
    const basicUrl = `${baseUrl}?embed=sponsors&api_key=${API_KEY}`;

    try {
        const basicRes = await fetch(basicUrl, { next: { revalidate: 3600 } });
        if (!basicRes.ok) return null;

        const basicData: ApiResponse = await basicRes.json();
        const bill: Bill = basicData.bill;

        if (!bill) return null;

        // Initialize optional structures
        bill.sponsors = bill.sponsors || [];
        bill.committees = { count: 0, items: [] };
        bill.allSummaries = [];

        // Fetch summaries
        if (bill.summaries?.url) {
            const summaryRes = await fetch(`${bill.summaries.url}&api_key=${API_KEY}`);
            if (summaryRes.ok) {
                const summaryData: SummariesResponse = await summaryRes.json();
                const summaries = summaryData.summaries;
                if (summaries && summaries.length > 0) {
                    const sorted = [...summaries].sort((a, b) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime());
                    bill.allSummaries = sorted as any[];
                }
            }
        }
        
        return bill;
    } catch (error) {
        console.error(`Error fetching bill details for ${billType} ${billNumber}:`, error);
        return null;
    }
}


async function processMarkdown(markdown: string) {
    const result = await remark().use(html).process(markdown);
    return result.toString();
}

function OrganizationHeader({ group }: { group: any }) {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {group.logoUrl && (
                        <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <Image 
                                src={group.logoUrl} 
                                alt={`${group.name} logo`} 
                                width={100} 
                                height={100}
                                data-ai-hint="logo"
                            />
                        </div>
                    )}
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-3xl font-bold font-headline text-primary">{group.name}</h1>
                            <WatchButton groupSlug={group.slug} groupName={group.name} />
                        </div>
                        <p className="mt-2 text-muted-foreground">{group.description}</p>
                        <a href={group.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-4">
                            Visit Website <ExternalLink className="h-4 w-4"/>
                        </a>
                    </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground border-t pt-4">
                    <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> {group.nonprofitStatus}</div>
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {group.yearsActive} years active</div>
                    <div className="flex items-center gap-2"><BarChart className="h-4 w-4" /> {group.billsSupportedCount} bills supported</div>
                </div>
            </CardContent>
        </Card>
    );
}



export default function GroupDetailPage({ params }: { params: { groupName: string } }) {
    const { user } = useAuth();
    const [groupName, setGroupName] = useState<string>('');
    const [groupData, setGroupData] = useState<any>(null);
    const [priorityBillsWithData, setPriorityBillsWithData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userActions, setUserActions] = useState<Record<string, 'support' | 'oppose' | null>>({});

    useEffect(() => {
        const loadParams = async () => {
            const resolvedParams = await params;
            setGroupName(resolvedParams.groupName);
        };
        loadParams();
    }, [params]);

    useEffect(() => {
        if (!groupName) return;

        const loadData = async () => {
            const groupData = getAdvocacyGroupData(groupName);
            if (!groupData) {
                notFound();
                return;
            }
            setGroupData(groupData);
            
            // Get campaigns for this group from the database
            let campaigns = [];
            try {
                const response = await fetch(`/api/campaigns/public?groupSlug=${groupName}`, {
                    cache: 'no-cache'
                });
                if (response.ok) {
                    const { campaigns: dbCampaigns } = await response.json();
                    campaigns = dbCampaigns;
                }
            } catch (error) {
                console.error('Error fetching campaigns from database:', error);
                // Fallback to legacy campaigns service
                campaigns = campaignsService.getCampaignsByGroup(groupName);
            }
            
            // Process campaigns with data (simplified for client-side)
            const campaignsWithData = campaigns.map((campaign: any) => ({
                id: campaign.id || Math.random().toString(),
                bill: {
                    congress: campaign.congress || campaign.bill?.congress,
                    type: campaign.billType || campaign.bill?.type,
                    number: campaign.billNumber || campaign.bill?.number,
                    title: campaign.billTitle || campaign.bill?.title
                },
                position: campaign.stance === 'support' ? 'Support' : campaign.stance === 'oppose' ? 'Oppose' : campaign.position,
                reasoning: campaign.reasoning,
                actionButtonText: campaign.actionButtonText,
                supportCount: campaign.supportCount || 0,
                opposeCount: campaign.opposeCount || 0,
                groupName: groupData.name,
                groupSlug: groupName,
            }));
            
            // Fallback to legacy data if no campaigns exist
            const finalData = campaigns.length > 0 ? campaignsWithData : (groupData.priorityBills || []).map((item: any) => ({
                ...item,
                id: Math.random().toString(),
                groupName: groupData.name,
                groupSlug: groupName,
                supportCount: item.supportCount || 0,
                opposeCount: item.opposeCount || 0,
            }));
            
            setPriorityBillsWithData(finalData);
            setLoading(false);
        };

        loadData();
    }, [groupName]);

    const handleSupportOppose = async (campaign: any, action: 'support' | 'oppose') => {
        if (!user) {
            window.location.href = '/login';
            return;
        }

        try {
            // Store action in localStorage as temporary solution
            const userActions = JSON.parse(localStorage.getItem('userBillActions') || '[]');
            const newAction = {
                id: Date.now().toString(),
                userId: user.uid,
                userEmail: user.email,
                campaignId: campaign.id,
                billNumber: campaign.bill.number,
                billType: campaign.bill.type,
                congress: campaign.bill.congress,
                billTitle: campaign.bill.title,
                action: action,
                timestamp: new Date().toISOString(),
                groupName: campaign.groupName,
                groupSlug: campaign.groupSlug
            };
            
            userActions.push(newAction);
            localStorage.setItem('userBillActions', JSON.stringify(userActions));

            // Update local state to reflect the change immediately
            setPriorityBillsWithData(prevCampaigns => 
                prevCampaigns.map(c => 
                    c.id === campaign.id 
                        ? { 
                            ...c, 
                            [action === 'support' ? 'supportCount' : 'opposeCount']: (c[action === 'support' ? 'supportCount' : 'opposeCount'] || 0) + 1 
                        }
                        : c
                )
            );

            // Set user action state to show success on button
            setUserActions(prev => ({ ...prev, [campaign.id]: action }));
            
            // Clear the success state after 2 seconds
            setTimeout(() => {
                setUserActions(prev => ({ ...prev, [campaign.id]: null }));
            }, 2000);

        } catch (error) {
            console.error('Error recording support/oppose action:', error);
            alert('There was an error recording your action. Please try again.');
        }
    };

    if (loading) {
        return <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl"><p>Loading...</p></div>;
    }

    if (!groupData) {
        notFound();
        return null;
    }
    
    return (
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
            <div className="max-w-3xl mx-auto space-y-8">
                <OrganizationHeader group={groupData} />

                {priorityBillsWithData && priorityBillsWithData.length > 0 ? (
                    <>
                        <h2 className="text-2xl font-bold font-headline text-center">Priority Legislation</h2>
                        <div className="space-y-4 md:space-y-6">
                            {priorityBillsWithData.map((item, index) => {
                                const isSupport = item.position === 'Support';
                                const badgeVariant = isSupport ? 'default' : 'destructive';
                                const PositionIcon = isSupport ? ThumbsUp : ThumbsDown;
                                const billTypeSlug = getBillTypeSlug(item.bill.type);
                                
                                const currentUserAction = userActions[item.id];
                                
                                return (
                                    <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                                        <CardHeader className="pb-4">
                                            <div className="flex flex-col gap-3">
                                                {/* 1. Group Name's Opinion with Badge */}
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm font-medium text-muted-foreground">
                                                        {groupData.name} urges you to {item.position.toLowerCase()} {item.bill.type?.toUpperCase()} {item.bill.number}
                                                    </p>
                                                    <Badge variant={badgeVariant} className="flex items-center gap-2 text-sm px-2 py-1 shrink-0">
                                                        <PositionIcon className="h-3 w-3" />
                                                        <span>{item.position}</span>
                                                    </Badge>
                                                </div>
                                                
                                                {/* 3. H2: Bill Short Title */}
                                                <CardTitle className="text-lg sm:text-xl font-bold leading-tight">
                                                    <Link 
                                                        href={`/bill/${item.bill.congress}/${billTypeSlug}/${item.bill.number}`} 
                                                        className="hover:underline break-words"
                                                    >
                                                        {item.bill.title || `Legislation ${item.bill.type?.toUpperCase()} ${item.bill.number}`}
                                                    </Link>
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            {/* 4. Formatted Markdown Reasoning */}
                                            <div 
                                                className="text-muted-foreground mb-4 text-sm leading-relaxed [&>h3]:hidden [&>ul]:list-disc [&>ul]:pl-5 [&>li]:leading-relaxed" 
                                                dangerouslySetInnerHTML={{ 
                                                    __html: parseSimpleMarkdown(item.reasoning || '', { hideHeaders: true }) 
                                                }} 
                                            />
                                            
                                            {/* 5. Bottom Section with Buttons */}
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t gap-3">
                                                <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        className={`flex items-center gap-2 transition-colors ${
                                                            currentUserAction === 'support'
                                                                ? 'bg-green-100 text-green-800 border-green-300'
                                                                : 'text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200'
                                                        }`}
                                                        onClick={() => handleSupportOppose(item, 'support')}
                                                        title={user ? 'Support this bill' : 'Login to support this bill'}
                                                        disabled={currentUserAction === 'support'}
                                                    >
                                                        <ThumbsUp className="h-4 w-4" />
                                                        <span className="font-semibold">
                                                            {currentUserAction === 'support' ? 'Supported!' : item.supportCount.toLocaleString()}
                                                        </span>
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        className={`flex items-center gap-2 transition-colors ${
                                                            currentUserAction === 'oppose'
                                                                ? 'bg-red-100 text-red-800 border-red-300'
                                                                : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
                                                        }`}
                                                        onClick={() => handleSupportOppose(item, 'oppose')}
                                                        title={user ? 'Oppose this bill' : 'Login to oppose this bill'}
                                                        disabled={currentUserAction === 'oppose'}
                                                    >
                                                        <ThumbsDown className="h-4 w-4" />
                                                        <span className="font-semibold">
                                                            {currentUserAction === 'oppose' ? 'Opposed!' : item.opposeCount.toLocaleString()}
                                                        </span>
                                                    </Button>
                                                    <Button 
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex items-center gap-2 text-muted-foreground"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Watch
                                                    </Button>
                                                </div>
                                                <Button size="sm" asChild className="w-full sm:w-auto">
                                                    <Link href={`/campaigns/${groupName}/${item.bill.type?.toLowerCase()}-${item.bill.number}`}>
                                                        View Campaign
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Content Coming Soon</CardTitle>
                            <CardContent className="pt-4">
                                <p className="text-muted-foreground">
                                    Detailed legislative priorities and supported bills for this organization will be available here shortly.
                                </p>
                            </CardContent>
                        </CardHeader>
                    </Card>
                )}

            </div>
        </div>
    );
}
