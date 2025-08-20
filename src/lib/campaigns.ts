import { Bill } from '@/types';

export interface Campaign {
  id: string;
  groupSlug: string;
  groupName: string;
  bill: {
    congress: number;
    type: string;
    number: string;
    title?: string;
  };
  position: 'Support' | 'Oppose';
  reasoning: string;
  actionButtonText: string;
  supportCount: number;
  opposeCount: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// In-memory storage for campaigns (in production, this would be a database)
let campaigns: Campaign[] = [
  // Migrate existing League of Women Voters campaigns
  {
    id: 'lwv-hr-14',
    groupSlug: 'league-of-women-voters',
    groupName: 'League of Women Voters',
    bill: {
      congress: 119,
      type: 'HR',
      number: '14',
      title: 'John R. Lewis Voting Rights Advancement Act'
    },
    position: 'Support',
    reasoning: '### Why LWV Supports the John R. Lewis Voting Rights Advancement Act\n\n*   **It restores protections weakened by court decisions.** After the 2013 *Shelby County v. Holder* ruling gutted key provisions of the Voting Rights Act, this legislation is seen as essential to reestablish federal oversight and guard against discriminatory changes in voting laws.\n\n*   **It defends democracy and honors the VRA\'s legacy.** Named for civil rights hero John Lewis, the bill is framed as much-needed defense of voting rights—particularly amid renewed state-level attacks on fair representation and redistricting.\n\n*   **It aligns with LWV\'s mission.** The League has a long history of fighting to make elections fair, inclusive, and accessible. This act fits squarely within that mission by preventing racial discrimination and ensuring every voter is heard.',
    actionButtonText: 'Voice your opinion',
    supportCount: 9850,
    opposeCount: 1520,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isActive: true
  },
  {
    id: 'lwv-hr-22',
    groupSlug: 'league-of-women-voters',
    groupName: 'League of Women Voters',
    bill: {
      congress: 119,
      type: 'HR',
      number: '22',
      title: 'SAVE Act'
    },
    position: 'Oppose',
    reasoning: '### Why LWV Opposes the SAVE Act (H.R. 22)\n\n*   **It creates unnecessary barriers to voting.** Although voters are already required to affirm citizenship when registering, the SAVE Act adds redundant requirements, such as presenting documentary proof of U.S. citizenship in person every time you update your registration. This puts an unfair burden on many eligible voters.\n\n*   **It disproportionately impacts marginalized groups.** The League highlights how the SAVE Act harms rural voters, voters of color, military families who move frequently, those recovering from disasters, and especially married women who\'ve changed their names and may struggle to match documentation.\n*   **It addresses a problem that doesn\'t exist.** Noncitizen voting is already illegal and extremely rare. The League warns that the SAVE Act is rooted in fear, misinformation, and divisive rhetoric—not real threats to democracy.\n*   **It undermines voter access and overloads election infrastructure.** Requiring in-person registrations and strict document checks could overwhelm local election offices and undermine the League\'s century-long mission of encouraging broad participation.',
    actionButtonText: 'Voice your opinion',
    supportCount: 3100,
    opposeCount: 15600,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isActive: true
  }
];

// Migrate existing campaigns from advocacy-groups.ts
const existingCampaigns: Campaign[] = [
  // Brennan Center campaigns
  {
    id: 'brennan-hr-22',
    groupSlug: 'brennan-center-for-justice',
    groupName: 'Brennan Center for Justice',
    bill: { congress: 119, type: 'HR', number: '22' },
    position: 'Oppose',
    reasoning: 'The SAVE Act would require documentary proof of citizenship for voter registration, creating significant barriers for eligible voters. Research shows that more than 21 million Americans would not be able to quickly locate required documents, and nearly 4 million citizens lack access to any form of citizenship proof.',
    actionButtonText: 'Voice your opinion',
    supportCount: 2800,
    opposeCount: 18500,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isActive: true
  },
  {
    id: 'brennan-s-51',
    groupSlug: 'brennan-center-for-justice',
    groupName: 'Brennan Center for Justice',
    bill: { congress: 119, type: 'S', number: '51' },
    position: 'Support',
    reasoning: 'Federal oversight is essential to prevent discriminatory voting changes. This bill would restore key provisions of the Voting Rights Act that were struck down in Shelby County v. Holder, providing crucial protections against voter suppression.',
    actionButtonText: 'Voice your opinion',
    supportCount: 14200,
    opposeCount: 4100,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isActive: true
  },
  {
    id: 'brennan-s-1',
    groupSlug: 'brennan-center-for-justice',
    groupName: 'Brennan Center for Justice',
    bill: { congress: 119, type: 'S', number: '1' },
    position: 'Support',
    reasoning: 'Comprehensive election security and voting access reforms are needed to protect democracy. This legislation addresses cybersecurity threats, improves election infrastructure, and ensures all eligible Americans can participate in elections.',
    actionButtonText: 'Voice your opinion',
    supportCount: 16800,
    opposeCount: 5200,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isActive: true
  },
  // Common Cause campaigns
  {
    id: 'common-hr-1',
    groupSlug: 'common-cause',
    groupName: 'Common Cause',
    bill: { congress: 119, type: 'HR', number: '1' },
    position: 'Support',
    reasoning: 'The For the People Act would transform American democracy by expanding voting rights, ending partisan gerrymandering through independent redistricting commissions, and implementing comprehensive campaign finance reform including small-donor public financing.',
    actionButtonText: 'Voice your opinion',
    supportCount: 18900,
    opposeCount: 6200,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isActive: true
  },
  // Add more migrated campaigns as needed...
];

// Add migrated campaigns to the main campaigns array
campaigns.push(...existingCampaigns);

// Campaign CRUD operations
export const campaignsService = {
  // Get all campaigns
  getAllCampaigns: (): Campaign[] => {
    return campaigns;
  },

  // Get campaigns by group
  getCampaignsByGroup: (groupSlug: string): Campaign[] => {
    return campaigns.filter(c => c.groupSlug === groupSlug && c.isActive);
  },

  // Get single campaign
  getCampaign: (id: string): Campaign | undefined => {
    return campaigns.find(c => c.id === id);
  },

  // Get campaign by group and bill
  getCampaignByGroupAndBill: (groupSlug: string, billType: string, billNumber: string): Campaign | undefined => {
    return campaigns.find(c => 
      c.groupSlug === groupSlug && 
      c.bill.type.toLowerCase() === billType.toLowerCase() && 
      c.bill.number === billNumber &&
      c.isActive
    );
  },

  // Create new campaign
  createCampaign: (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Campaign => {
    const newCampaign: Campaign = {
      ...campaignData,
      id: `${campaignData.groupSlug}-${campaignData.bill.type.toLowerCase()}-${campaignData.bill.number}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    campaigns.push(newCampaign);
    return newCampaign;
  },

  // Update campaign
  updateCampaign: (id: string, updates: Partial<Campaign>): Campaign | undefined => {
    const index = campaigns.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    
    campaigns[index] = {
      ...campaigns[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return campaigns[index];
  },

  // Delete campaign (soft delete)
  deleteCampaign: (id: string): boolean => {
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return false;
    
    campaign.isActive = false;
    campaign.updatedAt = new Date().toISOString();
    return true;
  },

  // Update vote counts
  updateVoteCounts: (id: string, supportIncrement: number = 0, opposeIncrement: number = 0): Campaign | undefined => {
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return undefined;
    
    campaign.supportCount += supportIncrement;
    campaign.opposeCount += opposeIncrement;
    campaign.updatedAt = new Date().toISOString();
    
    return campaign;
  }
};