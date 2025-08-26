'use client';

import AdvocacyBillCard from '@/components/advocacy-bill-card';
import { useState, useEffect } from 'react';
import { getAdvocacyGroupData } from '@/lib/advocacy-groups';

interface CampaignBill {
  id: string;
  bill: {
    number: string;
    type: string;
    congress: number;
    title: string;
  };
  position: string;
  actionButtonText: string;
  reasoning: string;
  supportCount: number;
  opposeCount: number;
  groupSlug: string;
  groupName: string;
  lastUpdated: Date;
  url?: string;
}

export default function Home() {
  const [campaignBills, setCampaignBills] = useState<CampaignBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const localCampaigns: CampaignBill[] = [];
        // List of all group slugs we want to show campaigns from
        const groupSlugs = [
          'league-of-women-voters',
          'brennan-center-for-justice',
          'common-cause',
          'fair-elections-center',
          'fairvote',
          'voteriders',
          'rock-the-vote',
          'mi-familia-vota',
          'black-voters-matter',
          'when-we-all-vote'
        ];
        
        // Collect campaigns from each group
        for (const slug of groupSlugs) {
          const groupData = getAdvocacyGroupData(slug);
          if (groupData && groupData.priorityBills) {
            for (const priorityBill of groupData.priorityBills) {
              localCampaigns.push({
                id: `${slug}-${priorityBill.bill.type}-${priorityBill.bill.number}`,
                bill: {
                  number: priorityBill.bill.number || '',
                  type: priorityBill.bill.type || '',
                  congress: priorityBill.bill.congress || 119,
                  title: priorityBill.bill.title || `${priorityBill.bill.type} ${priorityBill.bill.number}`
                },
                position: priorityBill.position,
                actionButtonText: priorityBill.actionButtonText,
                reasoning: priorityBill.reasoning,
                supportCount: priorityBill.supportCount,
                opposeCount: priorityBill.opposeCount,
                groupSlug: slug,
                groupName: groupData.name,
                lastUpdated: new Date(),
                url: `/groups/${slug}/${priorityBill.bill.type?.toLowerCase()}-${priorityBill.bill.number}`
              });
            }
          }
        }
        
        // Sort by support/oppose counts for most engaging content first
        localCampaigns.sort((a, b) => {
          const aTotal = a.supportCount + a.opposeCount;
          const bTotal = b.supportCount + b.opposeCount;
          return bTotal - aTotal;
        });
        
        // Take top 20 campaigns
        setCampaignBills(localCampaigns.slice(0, 20));
        
        // If still no campaigns, show mock data as fallback
        if (localCampaigns.length === 0) {
          const mockBills: CampaignBill[] = [
            {
              id: 'mock-1',
              bill: {
                number: '22',
                type: 'HR',
                congress: 119,
                title: 'SAVE Act'
              },
              position: 'Oppose',
              actionButtonText: 'Voice your opinion',
              reasoning: `
                <h3>Why LWV Opposes the SAVE Act (H.R. 22)</h3>
                <ul>
                  <li><strong>It creates unnecessary barriers to voting.</strong> Although voters are already required to affirm citizenship when registering, the SAVE Act adds redundant requirements, such as presenting documentary proof of U.S. citizenship in person every time you update your registration. This puts an unfair burden on many eligible voters.</li>
                  <li><strong>It disproportionately impacts marginalized groups.</strong> The League highlights how the SAVE Act harms rural voters, voters of color, military families who move frequently, those recovering from disasters, and especially married women who've changed their names and may struggle to match documentation.</li>
                  <li><strong>It addresses a problem that doesn't exist.</strong> Noncitizen voting is already illegal and extremely rare. The League warns that the SAVE Act is rooted in fear, misinformation, and divisive rhetoric—not real threats to democracy.</li>
                  <li><strong>It undermines voter access and overloads election infrastructure.</strong> Requiring in-person registrations and strict document checks could overwhelm local election offices and undermine the League's century-long mission of encouraging broad participation.</li>
                </ul>
              `,
              supportCount: 3100,
              opposeCount: 15600,
              groupSlug: 'league-of-women-voters',
              groupName: 'League of Women Voters',
              lastUpdated: new Date('2025-01-24'),
              url: '/groups/league-of-women-voters/hr-22'
            },
            {
              id: 'mock-2',
              bill: {
                number: '14',
                type: 'HR',
                congress: 119,
                title: 'John R. Lewis Voting Rights Advancement Act'
              },
              position: 'Support',
              actionButtonText: 'Voice your opinion',
              reasoning: `
                <h3>Why LWV Supports the John R. Lewis Voting Rights Advancement Act</h3>
                <ul>
                  <li><strong>It restores protections weakened by court decisions.</strong> After the 2013 <em>Shelby County v. Holder</em> ruling gutted key provisions of the Voting Rights Act, this legislation is seen as essential to reestablish federal oversight and guard against discriminatory changes in voting laws.</li>
                  <li><strong>It defends democracy and honors the VRA's legacy.</strong> Named for civil rights hero John Lewis, the bill is framed as much-needed defense of voting rights—particularly amid renewed state-level attacks on fair representation and redistricting.</li>
                  <li><strong>It aligns with LWV's mission.</strong> The League has a long history of fighting to make elections fair, inclusive, and accessible. This act fits squarely within that mission by preventing racial discrimination and ensuring every voter is heard.</li>
                </ul>
              `,
              supportCount: 9850,
              opposeCount: 1520,
              groupSlug: 'league-of-women-voters',
              groupName: 'League of Women Voters',
              lastUpdated: new Date('2025-01-23'),
              url: '/groups/league-of-women-voters/hr-14'
            }
          ];
          
          setCampaignBills(mockBills);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        // Fallback to empty list if error occurs
        setCampaignBills([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaigns();
  }, []);

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Active Campaigns</h1>
          <p className="text-muted-foreground mb-8">
            Organizations are mobilizing support around these bills
          </p>
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading campaigns...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {campaignBills.map((campaign) => (
                <div key={campaign.id}>
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground">
                      Campaign by <span className="font-medium">{campaign.groupName}</span>
                      {' • '}
                      Updated {campaign.lastUpdated.toLocaleDateString()}
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
            
              {campaignBills.length === 0 && (
                <p className="text-center text-muted-foreground py-12">
                  No active campaigns at this time
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}