'use client';

import { notFound } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AdvocacyBillCard from '@/components/advocacy-bill-card';
import CandidateCampaignCard from '@/components/candidate-campaign-card';
import { PollCampaignCard } from '@/components/poll-campaign-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { campaignsService } from '@/lib/campaigns';
import { getAdvocacyGroupData } from '@/lib/advocacy-groups';
import { remark } from 'remark';
import html from 'remark-html';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SummaryDisplay } from '@/components/bill-summary-display';

async function processMarkdown(markdown: string) {
    const result = await remark().use(html).process(markdown);
    return result.toString();
}

async function getBillDetails(congress: number, billType: string, billNumber: string) {
    try {
        const response = await fetch(`/api/bill?congress=${congress}&billType=${billType}&billNumber=${billNumber}`);
        if (!response.ok) return null;
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching bill details:`, error);
        return null;
    }
}

export default function CampaignDetailPage({ 
    params 
}: { 
    params: Promise<{ groupName: string; billId: string }>
}) {
    const router = useRouter();
    const [campaign, setCampaign] = useState<any>(null);
    const [groupData, setGroupData] = useState<any>(null);
    const [billDetails, setBillDetails] = useState<any>(null);
    const [processedReasoning, setProcessedReasoning] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [groupName, setGroupName] = useState<string>('');
    const [billId, setBillId] = useState<string>('');

    useEffect(() => {
        async function loadParams() {
            const resolvedParams = await params;
            setGroupName(resolvedParams.groupName);
            setBillId(resolvedParams.billId);
        }
        loadParams();
    }, [params]);

    useEffect(() => {
        async function loadData() {
            if (!groupName || !billId) return;

            // Parse billId (format: hr-14, s-51, issue-xxx, etc.)
            const [billType, billNumber] = billId.split('-', 2);

            if (!billType || !billNumber) {
                notFound();
                return;
            }

            // Get campaign data - first check Firebase for edited campaigns
            let campaignData = null;
            
            try {
                const db = getFirestore(app);
                let campaignsQuery;

                // Handle Issue campaigns vs Bill campaigns
                if (billType.toLowerCase() === 'issue') {
                    campaignsQuery = query(
                        collection(db, 'campaigns'),
                        where('groupSlug', '==', groupName),
                        where('campaignType', '==', 'Issue'),
                        where('billNumber', '==', billNumber)
                    );
                } else {
                    campaignsQuery = query(
                        collection(db, 'campaigns'),
                        where('groupSlug', '==', groupName),
                        where('billType', '==', billType.toUpperCase()),
                        where('billNumber', '==', billNumber)
                    );
                }
                
                const querySnapshot = await getDocs(campaignsQuery);
                if (!querySnapshot.empty) {
                    const doc = querySnapshot.docs[0];
                    const data = doc.data();
                    campaignData = {
                        id: doc.id,
                        groupSlug: data.groupSlug,
                        groupName: data.groupName || groupName,
                        campaignType: data.campaignType || 'Legislation',
                        bill: {
                            congress: data.congress || 119, // Use congress from Firebase if available
                            type: data.billType,
                            number: data.billNumber,
                            title: data.billTitle || data.issueTitle || data.poll?.title
                        },
                        issueTitle: data.issueTitle,
                        candidate: data.candidate,
                        poll: data.poll,
                        responseCount: data.responseCount,
                        results: data.results,
                        position: data.stance === 'support' ? 'Support' : data.stance === 'oppose' ? 'Oppose' : data.position || 'Support',
                        reasoning: data.reasoning,
                        actionButtonText: data.actionButtonText || 'Voice your opinion',
                        supportCount: data.supportCount || 0,
                        opposeCount: data.opposeCount || 0,
                        createdAt: data.createdAt || new Date().toISOString(),
                        updatedAt: data.updatedAt || new Date().toISOString(),
                        isActive: true
                    };
                }
            } catch (error) {
                console.error('Error fetching campaign from Firebase:', error);
            }
            
            // If not found in Firebase, check static campaigns service as fallback
            if (!campaignData) {
                campaignData = campaignsService.getCampaignByGroupAndBill(groupName, billType, billNumber);
            }
            
            if (!campaignData) {
                notFound();
                return;
            }

            // Get group data
            const groupInfo = getAdvocacyGroupData(groupName);
            
            if (!groupInfo) {
                notFound();
                return;
            }

            // Fetch full bill details from API (only for legislation campaigns)
            let billInfo = null;
            if (campaignData.campaignType === 'Legislation') {
                billInfo = await getBillDetails(campaignData.bill.congress, billType, billNumber);
            }
            
            // Process markdown reasoning
            const reasoning = await processMarkdown(campaignData.reasoning);
            
            setCampaign(campaignData);
            setGroupData(groupInfo);
            setBillDetails(billInfo);
            setProcessedReasoning(reasoning);
            setLoading(false);
        }

        loadData();
    }, [groupName, billId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
                <div>Loading...</div>
            </div>
        );
    }

    if (!campaign || !groupData) {
        return notFound();
    }

    // Merge bill data
    const fullBill = {
        ...campaign.bill,
        ...(billDetails || {}),
        congress: campaign.bill.congress,
        type: campaign.bill.type,
        number: campaign.bill.number
    };

    return (
        <div className="min-h-screen bg-secondary/30 relative flex flex-col">
            {/* Close button */}
            <button
                onClick={() => {
                    if (typeof window !== 'undefined' && window.history.length > 1) {
                        router.back();
                    } else {
                        router.push('/');
                    }
                }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary/50 transition-colors z-10"
                aria-label="Close"
            >
                <X className="h-6 w-6" />
            </button>
            
            <div className="container mx-auto px-8 pt-16 pb-8 max-w-2xl flex-1 flex flex-col">
                <Card className="flex-1">
                    <CardHeader className="pb-4">
                        <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center mb-4">
                            <Image 
                                src={groupData.logoUrl || "https://placehold.co/100x100.png"} 
                                alt={`${groupData.name} logo`} 
                                width={100} 
                                height={100}
                            />
                        </div>
                        <h1 className="text-2xl font-bold font-headline text-primary text-left">
                            You've been invited to voice your opinion
                        </h1>
                        <p className="text-sm text-muted-foreground text-left mt-2">
                            {campaign.campaignType === 'Issue'
                                ? campaign.issueTitle || 'Issue Campaign'
                                : fullBill.title || `${campaign.bill.type.toUpperCase()} ${campaign.bill.number}`
                            }
                        </p>
                    </CardHeader>
                    <CardContent>
                        {/* AI Bill Overview Section - Only for legislation campaigns */}
                        {campaign.campaignType !== 'Issue' && campaign.campaignType !== 'Candidate' && campaign.campaignType !== 'Candidate Advocacy' && billDetails && ((billDetails.allSummaries && billDetails.allSummaries.length > 0) || (billDetails.summaries?.items && billDetails.summaries.items.length > 0)) && (
                            <div className="mb-6">
                                <SummaryDisplay
                                    summary={billDetails.allSummaries?.[0] || billDetails.summaries?.items?.[0]}
                                    showPoliticalPerspectives={false}
                                />
                            </div>
                        )}
                        {(campaign.campaignType === 'Candidate' || campaign.campaignType === 'Candidate Advocacy') && campaign.candidate ? (
                            <CandidateCampaignCard
                                candidate1Name={campaign.candidate.candidate1Name}
                                candidate1Bio={campaign.candidate.candidate1Bio}
                                candidate2Name={campaign.candidate.candidate2Name}
                                candidate2Bio={campaign.candidate.candidate2Bio}
                                selectedCandidate={campaign.candidate.selectedCandidate}
                                position={campaign.position}
                                reasoning={campaign.reasoning}
                                actionButtonText={campaign.actionButtonText}
                                supportCount={campaign.supportCount}
                                opposeCount={campaign.opposeCount}
                                groupSlug={groupName}
                                groupName={groupData.name}
                            />
                        ) : (campaign.campaignType === 'Voter Poll' || campaign.campaignType === 'Poll' || campaign.bill?.type === 'POLL') && campaign.poll ? (
                            <PollCampaignCard
                                groupName={groupData.name}
                                groupSlug={groupName}
                                poll={campaign.poll}
                                responseCount={campaign.responseCount || 0}
                                results={campaign.results || {}}
                                pollId={campaign.id}
                            />
                        ) : (
                            <AdvocacyBillCard
                                bill={fullBill}
                                position={campaign.position}
                                reasoning={processedReasoning}
                                actionButtonText={campaign.actionButtonText}
                                supportCount={campaign.supportCount}
                                opposeCount={campaign.opposeCount}
                                groupSlug={groupName}
                                groupName={groupData.name}
                                campaignType={campaign.campaignType}
                                issueCategory={campaign.issueTitle}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}