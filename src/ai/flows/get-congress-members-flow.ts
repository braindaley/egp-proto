
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

async function fetchMembersByChamber(
  congress: string,
  state: string,
  chamber: 'senate' | 'house'
): Promise<Member[]> {
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  const upperCaseState = state.toUpperCase();
  const url = `https://api.congress.gov/v3/member/${congress}/${chamber}?state=${upperCaseState}&api_key=${API_KEY}`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });

    if (!response.ok) {
      console.error(`Failed to fetch ${chamber} members for ${upperCaseState}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.members || [];

  } catch (error) {
    console.error(`Error fetching ${chamber} members for ${upperCaseState}:`, error);
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
    
    // Fetch senators and representatives in parallel
    const [senators, representatives] = await Promise.all([
        fetchMembersByChamber(congress, state, 'senate'),
        fetchMembersByChamber(congress, state, 'house')
    ]);

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
