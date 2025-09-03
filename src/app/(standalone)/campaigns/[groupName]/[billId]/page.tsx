'use client';

import { notFound } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AdvocacyBillCard from '@/components/advocacy-bill-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { campaignsService } from '@/lib/campaigns';
import { getAdvocacyGroupData } from '@/lib/advocacy-groups';
import { remark } from 'remark';
import html from 'remark-html';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { X, FileText } from 'lucide-react';
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

            // Parse billId (format: hr-14, s-51, etc.)
            const [billType, billNumber] = billId.split('-');
            
            if (!billType || !billNumber) {
                notFound();
                return;
            }

            // Get campaign data - first check static campaigns service
            let campaignData = campaignsService.getCampaignByGroupAndBill(groupName, billType, billNumber);
            
            // If not found in static data, check Firebase
            if (!campaignData) {
                try {
                    const db = getFirestore(app);
                    const campaignsQuery = query(
                        collection(db, 'campaigns'),
                        where('groupSlug', '==', groupName),
                        where('billType', '==', billType.toUpperCase()),
                        where('billNumber', '==', billNumber)
                    );
                    
                    const querySnapshot = await getDocs(campaignsQuery);
                    if (!querySnapshot.empty) {
                        const doc = querySnapshot.docs[0];
                        const data = doc.data();
                        campaignData = {
                            id: doc.id,
                            groupSlug: data.groupSlug,
                            groupName: data.groupName || groupName,
                            bill: {
                                congress: 119, // Default to current congress
                                type: data.billType,
                                number: data.billNumber,
                                title: data.billTitle
                            },
                            position: data.position,
                            reasoning: data.reasoning,
                            actionButtonText: 'Voice your opinion',
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

            // Fetch full bill details from API
            const billInfo = await getBillDetails(campaignData.bill.congress, billType, billNumber);
            
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
                    <CardHeader className="text-center pb-4">
                        <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
                            <Image 
                                src={groupData.logoUrl || "https://placehold.co/100x100.png"} 
                                alt={`${groupData.name} logo`} 
                                width={100} 
                                height={100}
                            />
                        </div>
                        <h3 className="text-3xl font-bold font-headline text-primary">
                            You've been invited to voice your opinion
                        </h3>
                        <p className="text-lg text-muted-foreground mt-2">
                            {groupData.name} urges you to {campaign.position.toLowerCase()} {campaign.bill.type} {campaign.bill.number}
                        </p>
                    </CardHeader>
                    <CardContent>
                        {/* AI Bill Overview Section */}
                        {billDetails && ((billDetails.allSummaries && billDetails.allSummaries.length > 0) || (billDetails.summaries?.items && billDetails.summaries.items.length > 0)) && (
                            <div className="bg-secondary/50 rounded-lg p-6 mb-6">
                                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Bill Overview
                                </h4>
                                <SummaryDisplay 
                                    summary={billDetails.allSummaries?.[0] || billDetails.summaries?.items?.[0]}
                                    showPoliticalPerspectives={false}
                                />
                            </div>
                        )}
                        <AdvocacyBillCard 
                            bill={fullBill}
                            position={campaign.position}
                            reasoning={processedReasoning}
                            actionButtonText={campaign.actionButtonText}
                            supportCount={campaign.supportCount}
                            opposeCount={campaign.opposeCount}
                            groupSlug={groupName}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}