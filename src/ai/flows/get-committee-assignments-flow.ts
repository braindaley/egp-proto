
'use server';
/**
 * @fileOverview A flow for fetching AI-generated committee assignments for a member of Congress.
 * - getCommitteeAssignments - Fetches the committee assignments.
 * - GetCommitteeAssignmentsInput - The input type for the getCommitteeAssignments function.
 * - GetCommitteeAssignmentsOutput - The return type for the getCommitteeAssignments function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GetCommitteeAssignmentsInputSchema = z.object({
  memberName: z.string().describe("The full name of the member of Congress."),
  congressNumber: z.string().describe("The congress number (e.g., '119')."),
});
export type GetCommitteeAssignmentsInput = z.infer<typeof GetCommitteeAssignmentsInputSchema>;

const GetCommitteeAssignmentsOutputSchema = z.string().describe("A formatted string detailing the member's committee assignments.");
export type GetCommitteeAssignmentsOutput = z.infer<typeof GetCommitteeAssignmentsOutputSchema>;

const committeeAssignmentsPrompt = ai.definePrompt({
  name: 'committeeAssignmentsPrompt',
  input: { schema: GetCommitteeAssignmentsInputSchema },
  prompt: `Provide a complete and accurate list of all current committee assignments, including any chairmanships or ranking member positions, for Senator {{memberName}} in the selected congress # {{congressNumber}} Congress. Also, include any subcommittees they serve on under each main committee. Format the output as markdown.`,
});

const getCommitteeAssignmentsFlow = ai.defineFlow(
  {
    name: 'getCommitteeAssignmentsFlow',
    inputSchema: GetCommitteeAssignmentsInputSchema,
    outputSchema: GetCommitteeAssignmentsOutputSchema,
  },
  async (input) => {
    const { output } = await committeeAssignmentsPrompt(input);
    return output ?? 'No committee assignment information could be generated at this time.';
  }
);

export async function getCommitteeAssignments(input: GetCommitteeAssignmentsInput): Promise<GetCommitteeAssignmentsOutput> {
  return getCommitteeAssignmentsFlow(input);
}
