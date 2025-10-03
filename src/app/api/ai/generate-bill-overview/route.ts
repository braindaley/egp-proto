import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { billTitle, billNumber, billSummary } = body;

    // Validate required fields
    if (!billTitle || !billNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: billTitle and billNumber are required' },
        { status: 400 }
      );
    }

    // Use Google AI Gemini API directly
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI API key not configured');
    }

    const prompt = `Generate a concise, neutral overview of this bill for citizens who are about to take a position on it.

**Bill Details:**
- Number: ${billNumber}
- Title: ${billTitle}
- Summary: ${billSummary || 'No detailed summary available'}

**Instructions:**
1. Write 2-3 sentences maximum
2. Use plain, accessible language (8th grade reading level)
3. Focus on what the bill actually does, not political talking points
4. Be completely neutral - do not suggest support or opposition
5. Include the most important concrete changes or provisions
6. Avoid technical jargon or legislative terminology

Example format: "This bill would [main action/change]. It includes provisions for [key element 1] and [key element 2]. [Additional context if critical]."

Generate the overview now:`;

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
          temperature: 0.3, // Lower temperature for more consistent, factual summaries
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200, // Keep it concise
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google AI API error:', response.status, errorText);
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data = await response.json();
    const overview = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!overview) {
      throw new Error('No overview generated from AI');
    }

    return NextResponse.json({ overview: overview.trim() });
  } catch (error) {
    console.error('Error generating bill overview:', error);

    // Fallback to a basic overview
    const { billTitle, billNumber } = await request.json().catch(() => ({
      billTitle: 'this legislation',
      billNumber: 'Unknown'
    }));

    const fallbackOverview = `${billNumber} - ${billTitle} is currently under consideration by Congress. This legislation addresses important policy matters that may affect various aspects of federal law and programs.`;

    return NextResponse.json({ overview: fallbackOverview });
  }
}