'use client';

import { useState, useEffect } from 'react';
import AdvocacyBillCard from '@/components/advocacy-bill-card';
import { ALLOWED_SUBJECTS, extractSubjectsFromApiResponse } from '@/lib/subjects';
import { mapPolicyAreaToSiteCategory } from '@/lib/policy-area-mapping';
import { Checkbox } from '@/components/ui/checkbox';
import { remark } from 'remark';
import html from 'remark-html';

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

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    async function fetchCampaigns() {
      setLoading(true);
      
      try {
        const response = await fetch('/api/campaigns/public?limit=50', {
          cache: 'no-cache'
        });
        
        if (response.ok) {
          const { campaigns: rawCampaigns } = await response.json();
          
          // Process each campaign
          const campaignPromises = rawCampaigns.map(async (campaign: any) => {
            try {
              const [processedReasoning, billDetails] = await Promise.all([
                processMarkdown(campaign.reasoning),
                getBillDetails(
                  campaign.congress || 119,
                  campaign.billType || '',
                  campaign.billNumber || ''
                )
              ]);
              
              // Extract policy issues using the same priority logic as bill detail page
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
                url: `/groups/${campaign.groupSlug}/${campaign.billType?.toLowerCase()}-${campaign.billNumber}`,
                policyIssues
              };
            } catch (error) {
              console.error('Error processing campaign:', campaign.id, error);
              // Return a fallback campaign with minimal data
              return {
                id: campaign.id,
                bill: {
                  congress: campaign.congress || 119,
                  type: campaign.billType || '',
                  number: campaign.billNumber || '',
                  title: campaign.billTitle || `${campaign.billType} ${campaign.billNumber}`,
                  subjects: null
                },
                position: campaign.position,
                actionButtonText: campaign.actionButtonText || 'Voice your opinion',
                reasoning: await processMarkdown(campaign.reasoning),
                supportCount: campaign.supportCount || 0,
                opposeCount: campaign.opposeCount || 0,
                groupSlug: campaign.groupSlug,
                groupName: campaign.groupName,
                url: `/groups/${campaign.groupSlug}/${campaign.billType?.toLowerCase()}-${campaign.billNumber}`,
                policyIssues: []
              };
            }
          });
          
          const processedCampaigns = await Promise.all(campaignPromises);
          
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
        setLoading(false);
      }
    }
    
    fetchCampaigns();
  }, []);

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

  // Filter campaigns based on selected policy issues
  const filteredCampaigns = selectedFilters.size === 0 
    ? campaigns
    : campaigns.filter(campaign => 
        campaign.policyIssues.some(issue => selectedFilters.has(issue))
      );

  const topCampaigns = filteredCampaigns.slice(0, 20);

  if (loading) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Active Campaigns</h1>
            <p className="text-muted-foreground mb-8">
              Organizations are mobilizing support around these bills
            </p>
            <div className="text-center py-12">Loading campaigns...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Active Campaigns</h1>
          <p className="text-muted-foreground mb-6">
            Organizations are mobilizing support around these bills
          </p>
          
          {/* Policy Issue Filter */}
          <div className="mb-8">
            <div className="space-y-4">
              <label className="text-sm font-medium">
                Filter by policy issue:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {ALLOWED_SUBJECTS.map((subject) => (
                  <div key={subject} className="flex items-center space-x-2">
                    <Checkbox
                      id={`filter-${subject}`}
                      checked={selectedFilters.has(subject)}
                      onCheckedChange={(checked) => {
                        const newFilters = new Set(selectedFilters);
                        if (checked) {
                          newFilters.add(subject);
                        } else {
                          newFilters.delete(subject);
                        }
                        setSelectedFilters(newFilters);
                      }}
                    />
                    <label
                      htmlFor={`filter-${subject}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {subject}
                    </label>
                  </div>
                ))}
              </div>
              
              {/* Show active filters */}
              {selectedFilters.size > 0 && (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Showing campaigns for: 
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(selectedFilters).map(filter => (
                      <span key={filter} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        {filter}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setSelectedFilters(new Set())}
                    className="text-xs text-muted-foreground hover:text-foreground underline ml-2"
                  >
                    Clear all
                  </button>
                  {filteredCampaigns.length === 0 && (
                    <span className="text-sm text-muted-foreground ml-2">(No campaigns found)</span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-8">
            {topCampaigns.map((campaign) => (
              <div key={campaign.id} className="max-w-3xl mx-auto">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Campaign by <span className="font-medium">{campaign.groupName}</span>
                    {campaign.policyIssues.length > 0 && (
                      <span className="ml-2">
                        • Policy issues: {campaign.policyIssues.join(', ')}
                      </span>
                    )}
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
            
            {topCampaigns.length === 0 && selectedFilters.size === 0 && (
              <p className="text-center text-muted-foreground py-12">
                No active campaigns at this time
              </p>
            )}
            
            {topCampaigns.length === 0 && selectedFilters.size > 0 && (
              <p className="text-center text-muted-foreground py-12">
                No campaigns found for the selected policy issues
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}