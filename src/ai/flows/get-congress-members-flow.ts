
'use server';
/**
 * @fileOverview A flow for fetching members of Congress for a specific state and congress.
 * - getCongressMembers - Fetches senators and representatives for a given state and congress.
 * - GetCongressMembersInput - The input type for the getCongressMembers function.
 * - GetCongressMembersOutput - The return type for the getCongressMembers function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Member } from '@/types';

const GetCongressMembersInputSchema = z.object({
  congress: z.string().describe('The congress number (e.g., "118").'),
  state: z.string().length(2).describe('The two-letter state abbreviation.'),
});
export type GetCongressMembersInput = z.infer<typeof GetCongressMembersInputSchema>;

const GetCongressMembersOutputSchema = z.object({
  senators: z.array(z.any()),
  representatives: z.array(z.any()),
});
export type GetCongressMembersOutput = z.infer<typeof GetCongressMembersOutputSchema>;

async function fetchAllMembers(congress: string): Promise<Member[]> {
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  // Using the general /member endpoint is more reliable than /congress/{congress}/member
  const url = `https://api.congress.gov/v3/member?limit=500&api_key=${API_KEY}`;
  
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      console.error(`Failed to fetch members: ${response.status}`);
      return [];
    }
    const data = await response.json();

    // The general /member endpoint returns members from all congresses, so we need to filter
    // them to find members who served in the specified congress.
    const congressNumber = parseInt(congress, 10);
    const filteredMembers = data.members.filter((member: any) => {
        if (!member.terms || !Array.isArray(member.terms.item)) return false;
        
        return member.terms.item.some((term: any) => {
            return term.congress === congressNumber;
        });
    });

    return filteredMembers;
  } catch (error) {
    console.error(`Error fetching all members:`, error);
    return [];
  }
}

const getCongressMembersFlow = ai.defineFlow(
  {
    name: 'getCongressMembersFlow',
    inputSchema: GetCongressMembersInputSchema,
    outputSchema: GetCongressMembersOutputSchema,
  },
  async ({ congress, state }) => {
    console.log("Calling Congress API with:", congress, state);
    const allMembers = await fetchAllMembers(congress);
    
    if (!allMembers || allMembers.length === 0) {
      return { senators: [], representatives: [] };
    }

    const stateMembers = allMembers.filter((member: Member) => member.state === state.toUpperCase());
    
    const senators = stateMembers.filter(member => member.chamber?.toLowerCase() === 'senate');
    const representatives = stateMembers.filter(member => member.chamber?.toLowerCase() === 'house');

    return {
      senators,
      representatives,
    };
  }
);

export async function getCongressMembers(input: GetCongressMembersInput): Promise<GetCongressMembersOutput> {
  const result = await getCongressMembersFlow(input);
  // Ensure we always return a valid structure, even on failure.
  return result || { senators: [], representatives: [] };
}
