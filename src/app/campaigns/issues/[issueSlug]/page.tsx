'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ALLOWED_SUBJECTS, extractSubjectsFromApiResponse } from '@/lib/subjects';
import { mapPolicyAreaToSiteCategory } from '@/lib/policy-area-mapping';
import AdvocacyBillCard from '@/components/advocacy-bill-card';
import { remark } from 'remark';
import html from 'remark-html';
import type { Bill } from '@/types';

async function processMarkdown(markdown: string) {
  const result = await remark().use(html).process(markdown);
  return result.toString();
}

interface Campaign {
  id: string;
  bill: any;
  position: string;
  actionButtonText: string;
  reasoning: string;
  supportCount: number;
  opposeCount: number;
  groupSlug: string;
  groupName: string;
  url: string;
  policyIssues: string[];
}

function convertTitleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function convertSlugToTitle(slug: string): string | null {
  for (const subject of ALLOWED_SUBJECTS) {
    if (convertTitleToSlug(subject) === slug) {
      return subject;
    }
  }
  return null;
}

interface BillRowProps {
  bill: Bill;
}

function BillRow({ bill }: BillRowProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <Link href={`/bill/${bill.congress}/${bill.type.toLowerCase()}/${bill.number}`} className="block">
      <div className="box-border content-stretch flex flex-col items-start justify-center px-4 py-3 relative size-full hover:bg-gray-50 transition-colors border-b border-gray-200">
        <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full mb-2">
          <div className="box-border content-stretch flex gap-2.5 items-center justify-center px-2.5 py-0.5 relative rounded-xl shrink-0 bg-primary/10">
            <div className="font-medium leading-[0] not-italic relative shrink-0 text-primary text-[12px] text-nowrap">
              <p className="leading-[20px] whitespace-pre">{bill.type} {bill.number}</p>
            </div>
          </div>
          <div className="basis-0 font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-foreground text-[16px]">
            <p className="leading-[24px] font-medium">{bill.title}</p>
          </div>
        </div>
        <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full">
          <div className="basis-0 font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-muted-foreground text-[14px]">
            <p className="leading-[20px]">
              <span className="font-medium">Latest Action:</span>
              <span> {formatDate(bill.latestAction.actionDate)} - {bill.latestAction.text.substring(0, 100)}...</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function IssuePage({ params }: { params: { issueSlug: string } }) {
  const [issueSlug, setIssueSlug] = useState<string>('');
  const [bills, setBills] = useState<Bill[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [issueTitle, setIssueTitle] = useState<string>('');

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setIssueSlug(resolvedParams.issueSlug);
    };
    initializeParams();
  }, [params]);

  // Helper function to get bill details using our internal API
  async function getBillDetails(congress: number, billType: string, billNumber: string) {
    try {
      const url = `/api/bill?congress=${congress}&billType=${billType.toLowerCase()}&billNumber=${billNumber}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Bill not found: ${billType.toUpperCase()} ${billNumber} (${congress})`);
        }
        return null;
      }
      
      const bill = await response.json();
      return bill;
    } catch (error) {
      console.error(`Error fetching bill details for ${billType.toUpperCase()} ${billNumber}:`, error);
      return null;
    }
  }

  useEffect(() => {
    if (!issueSlug) return;
    
    const title = convertSlugToTitle(issueSlug);
    if (!title) {
      notFound();
      return;
    }
    
    setIssueTitle(title);
    
    const fetchBillsForIssue = async () => {
      setLoading(true);
      
      try {
        const url = `/api/bills/search-cached?subjects=${encodeURIComponent(title)}&limit=50&_t=${Date.now()}`;
        const response = await fetch(url, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setBills(data.bills || []);
        } else {
          console.error(`Failed to fetch bills for ${title}:`, response.status, await response.text());
          setBills([]);
        }
      } catch (error) {
        console.error(`Error fetching bills for ${title}:`, error);
        setBills([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchCampaignsForIssue = async () => {
      setCampaignsLoading(true);
      
      try {
        const response = await fetch('/api/campaigns/public?limit=50', {
          cache: 'no-cache'
        });
        
        if (response.ok) {
          const { campaigns: rawCampaigns } = await response.json();
          
          // Group campaigns by unique bills to avoid duplicate API calls
          const billMap = new Map<string, any[]>();
          rawCampaigns.forEach((campaign: any) => {
            const billKey = `${campaign.congress || 119}-${campaign.billType || ''}-${campaign.billNumber || ''}`;
            if (!billMap.has(billKey)) {
              billMap.set(billKey, []);
            }
            billMap.get(billKey)!.push(campaign);
          });
          
          // Fetch unique bills in parallel (batch of 10 at a time to avoid overwhelming API)
          const billEntries = Array.from(billMap.entries());
          const batchSize = 10;
          const billDetailsMap = new Map<string, any>();
          
          for (let i = 0; i < billEntries.length; i += batchSize) {
            const batch = billEntries.slice(i, i + batchSize);
            const batchPromises = batch.map(async ([billKey, campaigns]) => {
              const campaign = campaigns[0]; // Use first campaign for bill details
              const billDetails = await getBillDetails(
                campaign.congress || 119,
                campaign.billType || '',
                campaign.billNumber || ''
              );
              return { billKey, billDetails };
            });
            
            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(({ billKey, billDetails }) => {
              billDetailsMap.set(billKey, billDetails);
            });
          }
          
          // Process campaigns with cached bill details
          const campaignPromises = rawCampaigns.map(async (campaign: any) => {
            try {
              const billKey = `${campaign.congress || 119}-${campaign.billType || ''}-${campaign.billNumber || ''}`;
              const [processedReasoning, billDetails] = await Promise.all([
                processMarkdown(campaign.reasoning),
                Promise.resolve(billDetailsMap.get(billKey))
              ]);
              
              // Extract policy issues using the same priority logic as homepage
              let policyIssues = [];
              if (billDetails?.subjects) {
                const extractedSubjects = extractSubjectsFromApiResponse(billDetails.subjects);
                const mappedFromPolicyArea = billDetails.subjects.policyArea?.name 
                  ? mapPolicyAreaToSiteCategory(billDetails.subjects.policyArea.name) 
                  : null;
                
                // Use same priority logic: policy area mapping first, then extracted subjects
                if (mappedFromPolicyArea) {
                  // Policy area mapping exists - put it first, then add other subjects
                  policyIssues = [mappedFromPolicyArea, ...extractedSubjects.filter(s => s !== mappedFromPolicyArea)];
                } else {
                  // No policy area mapping, use extracted subjects as-is
                  policyIssues = extractedSubjects;
                }
              }
              
              // Only return campaigns that match our current issue
              if (!policyIssues.includes(title)) {
                return null;
              }
              
              // Merge bill data, ensuring subjects are preserved
              const fullBill = {
                congress: campaign.congress || 119,
                type: campaign.billType || '',
                number: campaign.billNumber || '',
                title: campaign.billTitle || `${campaign.billType} ${campaign.billNumber}`,
                ...(billDetails || {}),
                subjects: billDetails?.subjects
              };
              
              return {
                id: campaign.id,
                bill: fullBill,
                position: campaign.position,
                actionButtonText: campaign.actionButtonText || 'Voice your opinion',
                reasoning: processedReasoning,
                supportCount: campaign.supportCount || 0,
                opposeCount: campaign.opposeCount || 0,
                groupSlug: campaign.groupSlug,
                groupName: campaign.groupName,
                url: `/campaigns/groups/${campaign.groupSlug}/${campaign.billType?.toLowerCase()}-${campaign.billNumber}`,
                policyIssues
              };
            } catch (error) {
              console.error('Error processing campaign:', campaign.id, error);
              return null;
            }
          });
          
          const processedCampaigns = (await Promise.all(campaignPromises))
            .filter((campaign): campaign is Campaign => campaign !== null);
          
          // Sort by support/oppose counts for most engaging content first
          processedCampaigns.sort((a, b) => {
            const aTotal = a.supportCount + a.opposeCount;
            const bTotal = b.supportCount + b.opposeCount;
            return bTotal - aTotal;
          });
          
          setCampaigns(processedCampaigns);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setCampaignsLoading(false);
      }
    };

    fetchBillsForIssue();
    fetchCampaignsForIssue();
  }, [issueSlug]);

  if (loading || !issueTitle) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const sortedBills = [...bills].sort((a, b) => {
    const dateA = new Date(a.latestAction.actionDate);
    const dateB = new Date(b.latestAction.actionDate);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-8">
      <div>
        <div className="mb-6">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link href="/campaigns" className="hover:text-primary">Campaigns</Link> / 
            <Link href="/campaigns/issues" className="hover:text-primary ml-1">Issues</Link> / 
            <span className="ml-1">{issueTitle}</span>
          </nav>
          
          <h1 className="text-3xl font-bold mb-2 font-headline text-primary">
            {issueTitle}
          </h1>
          <p className="text-muted-foreground">
            Legislation related to {issueTitle.toLowerCase()} policy
          </p>
        </div>

        {/* Active Campaigns Section */}
        {campaignsLoading ? (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Active Campaigns</h2>
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading campaigns...</p>
            </div>
          </div>
        ) : campaigns.length > 0 ? (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Active Campaigns</h2>
            <p className="text-muted-foreground mb-8">
              Organizations are mobilizing support around these {issueTitle.toLowerCase()} bills
            </p>
            <div className="space-y-8">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="max-w-3xl mx-auto">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Campaign by <span className="font-medium">{campaign.groupName}</span>
                    </p>
                  </div>
                  
                  <AdvocacyBillCard 
                    bill={campaign.bill}
                    position={campaign.position}
                    reasoning={campaign.reasoning}
                    actionButtonText={campaign.actionButtonText}
                    supportCount={campaign.supportCount}
                    opposeCount={campaign.opposeCount}
                    groupSlug={campaign.groupSlug}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Bills Table Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">All {issueTitle} Legislation</h2>
          <p className="text-muted-foreground mb-6">
            Browse all bills related to {issueTitle.toLowerCase()} policy
          </p>
        </div>

        {sortedBills.length > 0 ? (
          <div className="bg-card rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="text-xl font-semibold">
                {sortedBills.length} Bill{sortedBills.length !== 1 ? 's' : ''}
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {sortedBills.map((bill) => (
                <BillRow key={`${bill.type}-${bill.number}`} bill={bill} />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-lg border p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">No Bills Found</h3>
            <p className="text-muted-foreground">
              No legislation found for this issue category at this time.
            </p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}