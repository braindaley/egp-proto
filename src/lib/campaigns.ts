import { Bill } from '@/types';

export interface Campaign {
  id: string;
  groupSlug: string;
  groupName: string;
  campaignType?: 'Legislation' | 'Issue' | 'Candidate' | 'Poll' | 'Voter Poll';
  bill?: {
    congress: number;
    type: string;
    number: string;
    title?: string;
  };
  candidate?: {
    candidate1Name: string;
    candidate1Bio?: string;
    candidate2Name: string;
    candidate2Bio?: string;
    selectedCandidate: 1 | 2;
  };
  poll?: {
    title: string;
    question: string;
    answerType: 'multiple-choice-single' | 'multiple-choice-multiple' | 'open-text';
    choices?: string[];
    description?: string;
    imageUrl?: string;
  };
  // Member of Congress targeting (optional)
  bioguideId?: string;
  memberInfo?: {
    name: string;
    state: string;
    district?: string;
    party?: string;
  };
  position: 'Support' | 'Oppose' | string;
  reasoning: string;
  actionButtonText: string;
  supportCount: number;
  opposeCount: number;
  responseCount?: number;
  results?: {
    [choice: string]: number;
  };
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isDiscoverable?: boolean; // Whether campaign appears in navigation (homepage feed, org detail page)
}

// User selection types for partners dashboard
export type UserType = 'organization' | 'member';

export interface MemberSelection {
  type: 'member';
  bioguideId: string;
  stateName: string;
  memberName: string;
}

export interface OrganizationSelection {
  type: 'organization';
  groupSlug: string;
}

export type DashboardSelection = MemberSelection | OrganizationSelection;

// In-memory storage for campaigns (in production, this would be a database)
let campaigns: Campaign[] = [
  // Featured campaign - HR 1
  {
    id: 'common-hr-1',
    groupSlug: 'common-cause',
    groupName: 'Common Cause',
    bill: { congress: 119, type: 'HR', number: '1', title: 'One Big Beautiful Bill Act' },
    position: 'Support',
    reasoning: 'The For the People Act would transform American democracy by expanding voting rights, ending partisan gerrymandering through independent redistricting commissions, and implementing comprehensive campaign finance reform including small-donor public financing.',
    actionButtonText: 'Voice your opinion',
    supportCount: 18900,
    opposeCount: 6200,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isActive: true
  },
  // League of Women Voters poll campaign
  {
    id: 'poll-testtitle',
    groupSlug: 'league-of-women-voters',
    groupName: 'League of Women Voters',
    campaignType: 'Poll',
    poll: {
      title: 'Communities priorities survey',
      question: 'What issue is most important to you?',
      answerType: 'multiple-choice-single',
      choices: ['Immigration', 'Schools', 'Small business'],
      description: 'Please share your opinion on what priority the government should focus on in 2026'
    },
    position: 'Support',
    reasoning: 'Your input helps us advocate for community priorities.',
    actionButtonText: 'Voice your opinion',
    supportCount: 0,
    opposeCount: 0,
    responseCount: 127,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    isActive: true
  },
  // Sample candidate poll campaign
  {
    id: 'sample-candidate-poll',
    groupSlug: 'common-cause',
    groupName: 'Common Cause',
    campaignType: 'Candidate',
    candidate: {
      candidate1Name: 'Maria Alvarez',
      candidate1Bio: 'Maria Alvarez is a community organizer who has spent the last 15 years fighting for affordable housing and small business growth in her district.',
      candidate2Name: 'James Whitman',
      candidate2Bio: 'James Whitman is a former technology executive and veteran who believes in modernizing government through innovation.',
      selectedCandidate: 1
    },
    position: 'Support',
    reasoning: 'Help us understand which candidate better represents your values.',
    actionButtonText: 'Share your opinion',
    supportCount: 0,
    opposeCount: 0,
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
    bill: { congress: 119, type: 'HR', number: '22', title: 'SAVE Act' },
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
    bill: { congress: 119, type: 'S', number: '51', title: 'John R. Lewis Voting Rights Advancement Act' },
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
    bill: { congress: 119, type: 'S', number: '1', title: 'For the People Act' },
    position: 'Support',
    reasoning: 'Comprehensive election security and voting access reforms are needed to protect democracy. This legislation addresses cybersecurity threats, improves election infrastructure, and ensures all eligible Americans can participate in elections.',
    actionButtonText: 'Voice your opinion',
    supportCount: 16800,
    opposeCount: 5200,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isActive: true
  },
  // League of Women Voters campaigns
  {
    id: 'league-hr-14',
    groupSlug: 'league-of-women-voters',
    groupName: 'League of Women Voters',
    bill: { congress: 119, type: 'HR', number: '14', title: 'Election Day Holiday Act' },
    position: 'Support',
    reasoning: 'Making Election Day a federal holiday would increase voter participation by removing work-related barriers to voting. This reform would particularly benefit hourly workers and those with inflexible schedules who often face difficult choices between voting and earning a paycheck.',
    actionButtonText: 'Voice your opinion',
    supportCount: 12500,
    opposeCount: 2100,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isActive: true
  },
  {
    id: 'league-hr-22',
    groupSlug: 'league-of-women-voters',
    groupName: 'League of Women Voters',
    bill: { congress: 119, type: 'HR', number: '22', title: 'SAVE Act' },
    position: 'Oppose',
    reasoning: 'The SAVE Act would require documentary proof of citizenship for voter registration, creating significant barriers for eligible voters. This requirement would disproportionately affect elderly citizens, rural voters, and those who have changed their names through marriage.',
    actionButtonText: 'Voice your opinion',
    supportCount: 3100,
    opposeCount: 17200,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isActive: true
  },
  // Black Voters Matter campaign (from advocacy-groups.ts)
  {
    id: 'black-voters-matter-hr-1',
    groupSlug: 'black-voters-matter',
    groupName: 'Black Voters Matter',
    bill: { congress: 119, type: 'HR', number: '1', title: 'For the People Act' },
    position: 'Support',
    reasoning: 'Comprehensive democracy reform would expand voting access in Black communities through automatic registration, early voting expansion, and restoration of voting rights for people with prior convictions, addressing historical and ongoing voter suppression.',
    actionButtonText: 'Voice your opinion',
    supportCount: 16500,
    opposeCount: 4100,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isActive: true
  },
  // Add more migrated campaigns as needed...
];

// Add migrated campaigns to the main campaigns array, avoiding duplicates
existingCampaigns.forEach(existingCampaign => {
  const exists = campaigns.some(campaign =>
    campaign.groupSlug === existingCampaign.groupSlug &&
    campaign.bill &&
    existingCampaign.bill &&
    campaign.bill.type === existingCampaign.bill.type &&
    campaign.bill.number === existingCampaign.bill.number
  );
  if (!exists) {
    campaigns.push(existingCampaign);
  }
});

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

  // Get campaigns by member (bioguideId)
  getCampaignsByMember: (bioguideId: string): Campaign[] => {
    return campaigns.filter(c => c.bioguideId === bioguideId && c.isActive);
  },

  // Get single campaign
  getCampaign: (id: string): Campaign | undefined => {
    return campaigns.find(c => c.id === id);
  },

  // Get campaign by group and bill
  getCampaignByGroupAndBill: (groupSlug: string, billType: string, billNumber: string): Campaign | undefined => {
    return campaigns.find(c =>
      c.groupSlug === groupSlug &&
      c.bill &&
      c.bill.type.toLowerCase() === billType.toLowerCase() &&
      c.bill.number === billNumber &&
      c.isActive
    );
  },

  // Get campaigns by bill
  getCampaignsByBill: (congress: number, billType: string, billNumber: string): Campaign[] => {
    return campaigns.filter(c =>
      c.bill &&
      c.bill.congress === congress &&
      c.bill.type.toLowerCase() === billType.toLowerCase() &&
      c.bill.number === billNumber &&
      c.isActive
    );
  },

  // Create new campaign
  createCampaign: (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Campaign => {
    const billIdentifier = campaignData.bill
      ? `${campaignData.bill.type.toLowerCase()}-${campaignData.bill.number}`
      : campaignData.campaignType?.toLowerCase() || 'campaign';
    const newCampaign: Campaign = {
      ...campaignData,
      id: `${campaignData.groupSlug}-${billIdentifier}-${Date.now()}`,
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