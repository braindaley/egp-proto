import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { billTitle, billSummary, userStance, tone, personalData } = body;

    // Validate required fields
    if (!billTitle || !billSummary || !userStance || !tone) {
      return NextResponse.json(
        { error: 'Missing required fields: billTitle, billSummary, userStance, and tone are required' },
        { status: 400 }
      );
    }

    // Use Google AI Gemini API directly
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI API key not configured');
    }

    const prompt = `You are an expert at writing compelling advocacy messages to elected officials. 
Your task is to generate a concise and effective message based on the user's stance and desired tone.

**Instructions:**
1. DO NOT include any salutation (no "Dear...", etc.) at the beginning.
2. Clearly state the user's position (${userStance.toLowerCase()}) regarding the specified bill early in the message.
3. Incorporate 1-2 key points from the bill summary to show the user is informed.
4. Adapt the language and style to match the ${tone} tone.
5. Keep the message concise, ideally 3-4 short paragraphs.
6. End with a clear call to action (e.g., "I urge you to vote YES/NO...", "Please consider my position...").
7. DO NOT include any closing signature (no "Sincerely", no name placeholder, etc.) at the end.

**Bill Details:**
- Title: ${billTitle}
- Summary: ${billSummary}

**User's Stance:** ${userStance}
**Desired Tone:** ${tone}

Generate the message now.`;

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
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google AI API error:', response.status, errorText);
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!message) {
      throw new Error('No message generated from AI');
    }

    return NextResponse.json({ message: message.trim() });
  } catch (error) {
    console.error('Error generating advocacy message:', error);
    return NextResponse.json(
      { error: 'Failed to generate advocacy message' },
      { status: 500 }
    );
  }
}