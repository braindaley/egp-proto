'use server';
/**
 * @fileOverview A flow for fetching members of Congress for a specific state.
 * - getCongressMembers - Fetches senators and representatives for a given state.
 * - GetCongressMembersInput - The input type for the getCongressMembers function.
 * - GetCongressMembersOutput - The return type for the getCongressMembers function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Member } from '@/types';

const GetCongressMembersInputSchema = z.object({
  state: z.string().length(2).describe('The two-letter state abbreviation.'),
});
export type GetCongressMembersInput = z.infer<typeof GetCongressMembersInputSchema>;

const GetCongressMembersOutputSchema = z.object({
  senators: z.array(z.any()),
  representatives: z.array(z.any()),
});
export type GetCongressMembersOutput = z.infer<typeof GetCongressMembersOutputSchema>;

async function fetchAllMembers(): Promise<Member[]> {
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  // The /member endpoint returns all members from all chambers.
  const url = `https://api.congress.gov/v3/member?limit=500&api_key=${API_KEY}`;
  
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      console.error(`Failed to fetch members: ${response.status}`);
      return [];
    }
    const data = await response.json();
    return data.members;
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
  async ({ state }) => {
    const allMembers = await fetchAllMembers();
    
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
