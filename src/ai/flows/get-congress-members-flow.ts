
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

// This function now fetches from the internal API route
async function fetchMembers(
  congress: string,
  state: string,
): Promise<{ senators: Member[], representatives: Member[] }> {
    // This assumes the app is running on localhost, which is fine for dev.
    // In a real deployment, you'd use a relative URL or an env var for the base URL.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const upperCaseState = state.toUpperCase();
    const url = `${baseUrl}/api/congress/members?congress=${congress}&state=${upperCaseState}`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });

    console.log('🔍 INTERNAL API URL CALLED:', url);
    console.log('🔍 INTERNAL API RESPONSE STATUS:', response.status);

    if (!response.ok) {
      console.error(`Failed to fetch members from internal API for ${upperCaseState}: ${response.status}`);
      return { senators: [], representatives: [] };
    }
    
    // Directly return the data from the API which should already be in the correct format
    const data = await response.json();
    console.log('🔍 INTERNAL API RESPONSE DATA:', JSON.stringify(data, null, 2));
    
    return {
        senators: data.senators || [],
        representatives: data.representatives || [],
    }
  } catch (error) {
    console.error(`Error fetching members for ${upperCaseState}:`, error);
    return { senators: [], representatives: [] };
  }
}


const getCongressMembersFlow = ai.defineFlow(
  {
    name: 'getCongressMembersFlow',
    inputSchema: GetCongressMembersInputSchema,
    outputSchema: GetCongressMembersOutputSchema,
  },
  async ({ congress, state }) => {
    return await fetchMembers(congress, state);
  }
);

export async function getCongressMembers(input: GetCongressMembersInput): Promise<GetCongressMembersOutput> {
  const result = await getCongressMembersFlow(input);
  // Ensure we always return a valid structure, even on failure.
  return result || { senators: [], representatives: [] };
}
