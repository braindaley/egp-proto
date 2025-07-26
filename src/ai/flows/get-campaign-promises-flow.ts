'use server';

import { z } from 'zod';

const GetCampaignPromisesInputSchema = z.object({
  memberName: z.string().min(1, "Member name cannot be empty"),
  congressNumber: z.string().min(1, "Congress number cannot be empty"),
});

export type GetCampaignPromisesInput = z.infer<typeof GetCampaignPromisesInputSchema>;

export interface CampaignPromise {
    title: string;
    description: string;
    category: 'Healthcare' | 'Economy' | 'Environment' | 'Education' | 'Defense' | 'Infrastructure';
    priority: 'High' | 'Medium' | 'Low';
    status: 'In Progress' | 'Completed' | 'Stalled' | 'Not Started';
}

export interface CampaignPromisesData {
  memberName: string;
  congress: string;
  promises: CampaignPromise[];
  lastUpdated: string;
}

export type GetCampaignPromisesOutput = CampaignPromisesData;

function generatePromises(memberName: string, congressNumber: string): CampaignPromisesData {
  const lowerName = memberName.toLowerCase();
  const isSenator = lowerName.includes('senator') || lowerName.includes('sen.') || 
                   lowerName.includes('senate') || (!lowerName.includes('rep') && !lowerName.includes('congressman'));
  
  const chamber: 'Senate' | 'House' = isSenator ? 'Senate' : 'House';

  const promises: CampaignPromise[] = [];

  const basePromises: CampaignPromise[] = [
    { title: "Lower Healthcare Costs", description: "Work to reduce prescription drug prices and insurance premiums.", category: "Healthcare", priority: "High", status: "In Progress" },
    { title: "Support Small Businesses", description: "Champion tax cuts and deregulation to help local businesses grow and create jobs.", category: "Economy", priority: "High", status: "In Progress" },
    { title: "Protect Natural Resources", description: "Secure funding for conservation projects and promote clean energy initiatives.", category: "Environment", priority: "Medium", status: "Not Started" },
    { title: "Invest in Education", description: "Increase funding for public schools and make higher education more affordable.", category: "Education", priority: "High", status: "Stalled" },
    { title: "Strengthen National Defense", description: "Ensure our military has the resources needed to protect our nation and its interests.", category: "Defense", priority: "High", status: "Completed" },
    { title: "Modernize Infrastructure", description: "Secure federal grants to repair and upgrade roads, bridges, and public transit.", category: "Infrastructure", priority: "Medium", status: "In Progress" },
    { title: "Cut Government Waste", description: "Conduct audits of federal agencies to eliminate duplicative programs and wasteful spending.", category: "Economy", priority: "Low", status: "Not Started" },
    { title: "Expand Access to Mental Health Services", description: "Increase the availability of mental healthcare providers in underserved communities.", category: "Healthcare", priority: "Medium", status: "In Progress" },
  ];

  if (isSenator) {
    basePromises.push(
      { title: "Confirm Qualified Judicial Nominees", description: "Fulfill the constitutional duty to advise and consent on federal judge appointments.", category: "Economy", priority: "High", status: "Completed" },
      { title: "Negotiate International Trade Deals", description: "Promote trade agreements that benefit American workers and businesses.", category: "Economy", priority: "Medium", status: "Stalled" }
    );
  } else {
    basePromises.push(
      { title: "Improve Constituent Services", description: "Enhance the efficiency and responsiveness of the district office to better serve residents.", category: "Infrastructure", priority: "High", status: "Completed" },
      { title: "Secure Community Project Funding", description: "Fight for direct funding for local projects that benefit the district.", category: "Infrastructure", priority: "Medium", status: "In Progress" }
    );
  }

  // Shuffle and take up to 10
  const shuffled = basePromises.sort(() => 0.5 - Math.random());
  const selectedPromises = shuffled.slice(0, 10);
  
  return {
    memberName,
    congress: congressNumber,
    promises: selectedPromises,
    lastUpdated: new Date().toISOString()
  };
}

export async function getCampaignPromises(input: GetCampaignPromisesInput): Promise<GetCampaignPromisesOutput> {
  try {
    const validatedInput = GetCampaignPromisesInputSchema.parse(input);
    return generatePromises(validatedInput.memberName, validatedInput.congressNumber);
  } catch (error) {
    console.error('Error generating campaign promises:', error);
    return {
      memberName: input.memberName || 'Unknown',
      congress: input.congressNumber || 'Unknown',
      promises: [],
      lastUpdated: new Date().toISOString()
    };
  }
}
