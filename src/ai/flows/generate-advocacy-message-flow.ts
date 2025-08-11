
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the input schema for the flow
const GenerateAdvocacyMessageInputSchema = z.object({
  billTitle: z.string().describe('The title of the bill.'),
  billSummary: z.string().describe('A summary of what the bill does.'),
  userStance: z.enum(['Support', 'Oppose']).describe('The user\'s position on the bill.'),
  tone: z.enum(['Formal', 'Passionate', 'Personal']).describe('The desired tone of the message.'),
  personalData: z.object({
    fullName: z.boolean(),
    address: z.boolean(),
    // Add other fields as they become available to enrich the context
  }).describe('Which personal details the user has consented to include.')
});

export type GenerateAdvocacyMessageInput = z.infer<typeof GenerateAdvocacyMessageInputSchema>;
export type GenerateAdvocacyMessageOutput = string;

// Define the prompt for the AI model
const advocacyMessagePrompt = ai.definePrompt(
  {
    name: 'advocacyMessagePrompt',
    input: { schema: GenerateAdvocacyMessageInputSchema },
    output: {
      schema: z.object({
        message: z.string().describe('The generated advocacy message.'),
      }),
    },
    prompt: `
      You are an expert at writing compelling advocacy messages to elected officials. 
      Your task is to generate a concise and effective message based on the user's stance and desired tone.
      Provide the output as a JSON object with a single key "message".

      **Instructions:**
      1.  Start with a formal salutation (e.g., "Dear Honorable Representative,").
      2.  Clearly state the user's position (support or opposition) regarding the specified bill early in the message.
      3.  Incorporate 1-2 key points from the bill summary to show the user is informed.
      4.  Adapt the language and style to match the requested tone:
          - **Formal:** Professional, respectful, and fact-based.
          - **Passionate:** More emotional, conveying a strong sense of urgency or personal impact.
          - **Personal:** A friendly, story-based tone that connects the issue to a personal experience.
      5.  Keep the message concise, ideally 3-4 short paragraphs.
      6.  End with a clear call to action (e.g., "I urge you to vote YES/NO...", "Please consider my position...").
      7.  Conclude with a respectful closing (e.g., "Sincerely,").
      8.  Use "[Your Name]" as a placeholder for the user's name. If the user has not provided their full name, use "A Concerned Constituent".

      **Bill Details:**
      - Title: {{{billTitle}}}
      - Summary: {{{billSummary}}}

      **User's Stance:** {{{userStance}}}
      **Desired Tone:** {{{tone}}}
      **Personal Data to be included by user:** 
      - Full Name: {{{personalData.fullName}}}
      - Address: {{{personalData.address}}}

      Generate the message now.
    `,
  }
);

// Define the flow that uses the prompt
const generateAdvocacyMessageFlow = ai.defineFlow(
  {
    name: 'generateAdvocacyMessageFlow',
    inputSchema: GenerateAdvocacyMessageInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await advocacyMessagePrompt(input);
    if (!output) {
        throw new Error("Failed to generate advocacy message: AI returned no output.");
    }
    return output.message;
  }
);

// Define the exported function that the client will call
export async function generateAdvocacyMessage(input: GenerateAdvocacyMessageInput): Promise<GenerateAdvocacyMessageOutput> {
  return await generateAdvocacyMessageFlow(input);
}
