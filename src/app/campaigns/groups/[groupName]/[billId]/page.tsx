import { notFound } from 'next/navigation';
import Image from 'next/image';
import AdvocacyBillCard from '@/components/advocacy-bill-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { campaignsService } from '@/lib/campaigns';
import { getAdvocacyGroupData } from '@/lib/advocacy-groups';
import { remark } from 'remark';
import html from 'remark-html';

async function processMarkdown(markdown: string) {
    const result = await remark().use(html).process(markdown);
    return result.toString();
}

async function getBillDetails(congress: number, billType: string, billNumber: string) {
    const API_KEY = process.env.CONGRESS_API_KEY;
    if (!API_KEY) {
        console.error("CONGRESS_API_KEY is not set.");
        return null;
    }

    const baseUrl = `https://api.congress.gov/v3/bill/${congress}/${billType.toLowerCase()}/${billNumber}`;
    const basicUrl = `${baseUrl}?api_key=${API_KEY}`;

    try {
        const response = await fetch(basicUrl, { next: { revalidate: 3600 } });
        if (!response.ok) return null;
        
        const data = await response.json();
        return data.bill;
    } catch (error) {
        console.error(`Error fetching bill details:`, error);
        return null;
    }
}

export default async function CampaignDetailPage({ 
    params 
}: { 
    params: { groupName: string; billId: string } 
}) {
    const { groupName, billId } = await params;
    
    // Parse billId (format: hr-14, s-51, etc.)
    const [billType, billNumber] = billId.split('-');
    
    if (!billType || !billNumber) {
        notFound();
    }

    // Get campaign data
    const campaign = campaignsService.getCampaignByGroupAndBill(groupName, billType, billNumber);
    
    if (!campaign) {
        notFound();
    }

    // Get group data
    const groupData = getAdvocacyGroupData(groupName);
    
    if (!groupData) {
        notFound();
    }

    // Fetch full bill details from API
    const billDetails = await getBillDetails(campaign.bill.congress, billType, billNumber);
    
    // Process markdown reasoning
    const processedReasoning = await processMarkdown(campaign.reasoning);
    
    // Merge bill data
    const fullBill = {
        ...campaign.bill,
        ...(billDetails || {}),
        congress: campaign.bill.congress,
        type: campaign.bill.type,
        number: campaign.bill.number
    };

    return (
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
            <div className="max-w-[672px] mx-auto space-y-6">
                <Card>
                    <CardHeader className="text-center pb-4">
                        <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
                            <Image 
                                src={groupData.logoUrl || "https://placehold.co/100x100.png"} 
                                alt={`${groupData.name} logo`} 
                                width={100} 
                                height={100}
                            />
                        </div>
                        <h1 className="text-3xl font-bold font-headline text-primary">
                            You've been invited to voice your opinion
                        </h1>
                        <p className="text-lg text-muted-foreground mt-2">
                            {groupData.name} urges you to {campaign.position.toLowerCase()} {campaign.bill.type} {campaign.bill.number}
                        </p>
                    </CardHeader>
                </Card>
                
                <AdvocacyBillCard 
                    bill={fullBill}
                    position={campaign.position}
                    reasoning={processedReasoning}
                    actionButtonText={campaign.actionButtonText}
                    supportCount={campaign.supportCount}
                    opposeCount={campaign.opposeCount}
                    groupSlug={groupName}
                />
            </div>
        </div>
    );
}