import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bill } = body;

    // Validate required fields
    if (!bill || !bill.billNumber || !bill.shortTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: bill object with billNumber and shortTitle is required' },
        { status: 400 }
      );
    }

    // Use Google AI Gemini API directly
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI API key not configured');
    }

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
- closingQuestion: Neutral question inviting engagement

IMPORTANT: Your response must be valid JSON only, no other text.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google AI API error:', response.status, errorText);
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('No response generated from AI');
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', responseText);
      // Fallback response
      parsedResponse = {
        headline: `Progress or overreach?`,
        explainer: `This bill ${bill.shortTitle.toLowerCase().includes('establish') ? 'would create' : 'would change'} federal policy.`,
        supportStatement: 'Addresses important public need and could improve current system',
        opposeStatement: 'May increase government spending and have unintended consequences',
        closingQuestion: 'What do you think?'
      };
    }

    // Validate the parsed response has all required fields
    const requiredFields = ['headline', 'explainer', 'supportStatement', 'opposeStatement', 'closingQuestion'];
    for (const field of requiredFields) {
      if (!parsedResponse[field]) {
        console.error(`Missing field ${field} in AI response`);
        // Use fallback response
        parsedResponse = {
          headline: `Progress or overreach?`,
          explainer: `This bill ${bill.shortTitle.toLowerCase().includes('establish') ? 'would create' : 'would change'} federal policy.`,
          supportStatement: 'Addresses important public need and could improve current system',
          opposeStatement: 'May increase government spending and have unintended consequences',
          closingQuestion: 'What do you think?'
        };
        break;
      }
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('Error generating bill explainer:', error);
    
    // Return bill-specific fallback response
    const { bill } = await request.json().catch(() => ({ bill: { shortTitle: 'this legislation', billNumber: 'Unknown' } }));
    
    // Generate more specific fallback based on bill content
    const isEstablishing = bill?.shortTitle?.toLowerCase().includes('establish') || 
                          bill?.shortTitle?.toLowerCase().includes('create') ||
                          bill?.shortTitle?.toLowerCase().includes('fund');
    const isReform = bill?.shortTitle?.toLowerCase().includes('reform') ||
                     bill?.shortTitle?.toLowerCase().includes('improve') ||
                     bill?.shortTitle?.toLowerCase().includes('modernize');
    const isRepeal = bill?.shortTitle?.toLowerCase().includes('repeal') ||
                     bill?.shortTitle?.toLowerCase().includes('eliminate') ||
                     bill?.shortTitle?.toLowerCase().includes('end');
    
    let headline, supportStatement, opposeStatement;
    
    if (isRepeal) {
      headline = 'Necessary change or risky move?';
      supportStatement = 'Would eliminate outdated or harmful regulations';
      opposeStatement = 'Could remove important protections or oversight';
    } else if (isEstablishing) {
      headline = 'Innovation or expansion?';
      supportStatement = 'Could address unmet needs and create opportunities';
      opposeStatement = 'May increase costs and government bureaucracy';
    } else if (isReform) {
      headline = 'Improvement or disruption?';
      supportStatement = 'Would update and strengthen existing systems';
      opposeStatement = 'Could cause unintended consequences or delays';
    } else {
      headline = 'Progress or overreach?';
      supportStatement = 'Addresses important public policy needs';
      opposeStatement = 'May have budget or implementation challenges';
    }
    
    return NextResponse.json({
      headline,
      explainer: `This bill would ${isEstablishing ? 'create' : isReform ? 'reform' : isRepeal ? 'eliminate' : 'modify'} ${bill?.shortTitle?.toLowerCase().includes('act') ? 'federal policy' : 'existing law'}.`,
      supportStatement,
      opposeStatement,
      closingQuestion: 'What do you think?'
    });
  }
}