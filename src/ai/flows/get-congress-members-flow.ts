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

async function fetchMembers(chamber: 'senate' | 'house', state: string): Promise<Member[]> {
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  // Note: The official congress.gov API does not support state filtering on the member endpoint.
  // This is a common workaround pattern, but it may be slow or paginated.
  // For this example, we'll fetch a larger limit and filter client-side.
  // A more robust solution might need a different API or a backend cache.
  const url = `https://api.congress.gov/v3/${chamber}/members?limit=500&api_key=${API_KEY}`;
  
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      console.error(`Failed to fetch ${chamber} members: ${response.status}`);
      return [];
    }
    const data = await response.json();
    
    // The API returns members for all states, so we must filter them.
    const stateMembers = data.members.filter((member: any) => member.state === state.toUpperCase());
    return stateMembers;
  } catch (error) {
    console.error(`Error fetching ${chamber} members for ${state}:`, error);
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
    // Fetch senators and representatives in parallel to speed things up.
    const [senators, representatives] = await Promise.all([
      fetchMembers('senate', state),
      fetchMembers('house', state),
    ]);

    return {
      senators,
      representatives,
    };
  }
);

export async function getCongressMembers(input: GetCongressMembersInput): Promise<GetCongressMembersOutput> {
  return getCongressMembersFlow(input);
}
