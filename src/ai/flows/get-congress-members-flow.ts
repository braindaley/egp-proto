
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

// This function now fetches directly from the Congress.gov API
async function fetchMembers(
  congress: string,
  state: string,
): Promise<{ senators: Member[], representatives: Member[] }> {
    const API_KEY = process.env.CONGRESS_API_KEY;
    if (!API_KEY) {
        console.error("CONGRESS_API_KEY is not set.");
        return { senators: [], representatives: [] };
    }

    const upperCaseState = state.toUpperCase();
    const url = `https://api.congress.gov/v3/member/congress/${congress}/${upperCaseState}?currentMember=false&limit=250&api_key=${API_KEY}`;

    try {
        const response = await fetch(url, { next: { revalidate: 3600 } });

        if (!response.ok) {
            console.error(`Failed to fetch members from Congress API for ${upperCaseState}: ${response.status}`);
            return { senators: [], representatives: [] };
        }
    
        const data = await response.json();
        const allMembers = data.members || [];
        
        const senators: Member[] = [];
        const representatives: Member[] = [];

        allMembers.forEach((member: any) => {
            if (!member.terms?.item) return;
            const hasSenateTerm = member.terms.item.some((term: any) => term.chamber === 'Senate');
            if (hasSenateTerm) {
                senators.push(member);
            } else {
                representatives.push(member);
            }
        });

        return { senators, representatives };

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
