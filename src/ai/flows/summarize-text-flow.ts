'use server';
/**
 * @fileOverview A flow for summarizing text.
 *
 * - summarizeText - A function that takes a string of text and returns a summary.
 * - SummarizeTextInput - The input type for the summarizeText function.
 * - SummarizeTextOutput - The return type for the summarizeText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SummarizeTextInputSchema = z.string();
export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

const SummarizeTextOutputSchema = z.string();
export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;

const summaryPrompt = ai.definePrompt({
  name: 'summarizeTextPrompt',
  input: { schema: SummarizeTextInputSchema },
  output: { schema: SummarizeTextOutputSchema },
  prompt: `Summarize the following text in no more than 500 words. Return only the summary.

Text to summarize:
{{{prompt}}}`,
});

const summarizeTextFlow = ai.defineFlow(
  {
    name: 'summarizeTextFlow',
    inputSchema: SummarizeTextInputSchema,
    outputSchema: SummarizeTextOutputSchema,
  },
  async (text) => {
    const { output } = await summaryPrompt(text);
    return output || '';
  }
);

export async function summarizeText(text: SummarizeTextInput): Promise<SummarizeTextOutput> {
  return summarizeTextFlow(text);
}
