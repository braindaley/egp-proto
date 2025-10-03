import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newsTitle, newsUrl, newsContent } = body;

    // Validate required fields
    if (!newsTitle) {
      return NextResponse.json(
        { error: 'Missing required field: newsTitle is required' },
        { status: 400 }
      );
    }

    // Use Google AI Gemini API directly
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI API key not configured');
    }

    const prompt = `Generate a brief, neutral summary of this news article for citizens who are about to write to their representatives about it.

**Article Details:**
- Title: ${newsTitle}
- URL: ${newsUrl || 'Not provided'}
- Content: ${newsContent || 'Content not available - summarize based on title'}

**Instructions:**
1. Write 2-3 sentences maximum
2. Use clear, accessible language
3. Focus on the key facts and main issue being reported
4. Be completely neutral - report what happened without editorial commentary
5. Include who, what, when (if available), and why it matters
6. Avoid political bias or loaded language

Example format: "This article reports on [main event/issue]. [Key detail about what happened or is being proposed]. [Why this is significant or what stakeholders are involved]."

Generate the summary now:`;

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
          temperature: 0.3, // Lower temperature for factual summaries
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
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      throw new Error('No summary generated from AI');
    }

    return NextResponse.json({ summary: summary.trim() });
  } catch (error) {
    console.error('Error generating news summary:', error);

    // Fallback to a basic summary
    const { newsTitle } = await request.json().catch(() => ({
      newsTitle: 'this article'
    }));

    const fallbackSummary = `This article discusses "${newsTitle}". It addresses current events and policy matters that may be of interest to constituents and their representatives.`;

    return NextResponse.json({ summary: fallbackSummary });
  }
}