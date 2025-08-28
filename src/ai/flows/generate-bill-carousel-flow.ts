'use server';

import { z } from 'zod';
import { ai } from '../genkit';
import type { FeedBill } from '@/types';

const BillCarouselInputSchema = z.object({
  bill: z.object({
    shortTitle: z.string(),
    billNumber: z.string(),
    summary: z.string().optional(),
    subjects: z.array(z.string()).optional(),
    sponsorParty: z.string(),
    congress: z.number(),
    type: z.string(),
    number: z.string()
  })
});

const BillCarouselOutputSchema = z.object({
  headline: z.string(),
  explainer: z.string(),
  supportStatement: z.string(),
  opposeStatement: z.string(),
  closingQuestion: z.string()
});

export type BillCarouselInput = z.infer<typeof BillCarouselInputSchema>;
export type BillCarouselOutput = z.infer<typeof BillCarouselOutputSchema>;

export async function generateBillCarousel(input: BillCarouselInput): Promise<BillCarouselOutput> {
  try {
    const { bill } = input;
    
    const prompt = `Create a single static card for the bill: ${bill.billNumber} - ${bill.shortTitle}.

Bill Details:
- Title: ${bill.shortTitle}
- Number: ${bill.billNumber}
- Summary: ${bill.summary || 'No summary available'}
- Topics: ${bill.subjects?.join(', ') || 'General legislation'}
- Sponsor Party: ${bill.sponsorParty}

Structure:
1. Headline Question (largest text): 3–6 words framing the debate
2. One-Line Explainer: Plain language, what the bill does
3. Support (Green Box): One concise statement, max 140 characters
4. Oppose (Red Box): One concise statement, max 140 characters
5. Closing Line: Neutral question inviting engagement

Style Guidelines:
- Prioritize simplicity and speed; everything must be readable in under 5 seconds
- No emojis, hashtags, or filler text
- Neutral tone presenting both sides fairly

Return as JSON with these fields:
- headline: 3-6 words framing the debate as a question
- explainer: One line explaining what the bill does in plain language
- supportStatement: One concise statement supporting the bill (max 140 characters)
- opposeStatement: One concise statement opposing the bill (max 140 characters)
- closingQuestion: Neutral question inviting engagement`;

    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt,
      output: {
        schema: BillCarouselOutputSchema,
      },
    });

    return response.output;
  } catch (error) {
    console.error('Error generating bill carousel:', error);
    
    // Fallback content in case AI fails
    const { bill } = input;
    return {
      headline: `Progress or overreach?`,
      explainer: `This bill ${bill.shortTitle.toLowerCase().includes('establish') ? 'would create' : 'would change'} federal policy.`,
      supportStatement: 'Addresses important public need and could improve current system',
      opposeStatement: 'May increase government spending and have unintended consequences',
      closingQuestion: 'What do you think?'
    };
  }
}