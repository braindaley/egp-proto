
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

async function fetchMembers(
  congress: string,
  state: string,
): Promise<Member[]> {
  const API_KEY = process.env.CONGRESS_API_KEY;
  const upperCaseState = state.toUpperCase();
  // Note: The API is inconsistent. A general 'member' endpoint seems more reliable
  // for state-based queries than chamber-specific ones which 404.
  const url = `https://api.congress.gov/v3/member?state=${upperCaseState}&api_key=${API_KEY}&limit=250`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });

    if (!response.ok) {
      console.error(`Failed to fetch members for ${upperCaseState}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    // Filter by the specific congress since the API gives members from multiple congresses.
    // The terms object is not always present, so we need to handle that.
    return (data.members || []).filter((member: Member) => {
        return member.terms.current && member.terms.current.congress === parseInt(congress);
    });

  } catch (error) {
    console.error(`Error fetching members for ${upperCaseState}:`, error);
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
    
    const allMembers = await fetchMembers(congress, state);

    if (allMembers.length === 0) {
        return { senators: [], representatives: [] };
    }
    
    const senators = allMembers.filter(m => m.chamber.toLowerCase() === 'senate');
    const representatives = allMembers.filter(m => m.chamber.toLowerCase() === 'house');

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
