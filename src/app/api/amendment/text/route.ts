import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is an assumed response structure from congress.gov based on other endpoints.
interface TextFormat {
    type: string;
    url: string;
}
interface TextVersion {
    type: string;
    date: string;
    formats: TextFormat[];
}
interface CongressGovTextResponse {
    textVersions: TextVersion[];
}

interface CongressGovAmendmentDetailResponse {
    amendment: {
        purpose?: string;
        description?: string;
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const congress = searchParams.get('congress');
    const amendmentType = searchParams.get('amendmentType');
    const amendmentNumber = searchParams.get('amendmentNumber');

    if (!congress || !amendmentType || !amendmentNumber) {
        return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
    }

    const apiKey = process.env.CONGRESS_API_KEY;
    if (!apiKey) {
        console.error('CONGRESS_API_KEY is not set in environment variables.');
        return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }

    const textUrl = `https://api.congress.gov/v3/amendment/${congress}/${amendmentType}/${amendmentNumber}/text?api_key=${apiKey}`;

    try {
        const textRes = await fetch(textUrl, { headers: { 'Accept': 'application/json' }, cache: 'no-store' });

        if (!textRes.ok) {
            const errorText = await textRes.text();
            console.error(`Failed to fetch from congress.gov API: ${textRes.status} ${textRes.statusText}`, { url: textUrl, errorText });
            throw new Error(`Failed to fetch from congress.gov API: ${textRes.status}`);
        }

        const textData: CongressGovTextResponse = await textRes.json();
        
        // Find the first available text version
        const firstTextVersion = textData.textVersions?.[0];
        if (firstTextVersion) {
            // Find the TXT or XML format, which usually contains the HTML content.
            const textFormat = firstTextVersion.formats.find(f => f.type === 'TXT' || f.type.toLowerCase().includes('xml'));
            
            if (textFormat?.url) {
                // Fetch the actual text content from the provided URL.
                const contentRes = await fetch(textFormat.url, { cache: 'no-store' });
                if (contentRes.ok) {
                    const textContent = await contentRes.text();
                    return NextResponse.json({ text: textContent });
                }
            }
        }

        // --- FALLBACK LOGIC ---
        // If we reach here, it means no full text was found. Let's try fetching the purpose/description.
        console.warn(`No full text found for ${amendmentType} ${amendmentNumber}, trying fallback to purpose/description.`);
        const detailUrl = `https://api.congress.gov/v3/amendment/${congress}/${amendmentType}/${amendmentNumber}?api_key=${apiKey}`;
        const detailRes = await fetch(detailUrl, { headers: { 'Accept': 'application/json' }, cache: 'no-store' });

        if (detailRes.ok) {
            const detailData: CongressGovAmendmentDetailResponse = await detailRes.json();
            const fallbackText = detailData.amendment?.purpose || detailData.amendment?.description;
            if (fallbackText) {
                return NextResponse.json({ text: `<div class="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700"><p class="font-bold">Full text not available</p><p>The following is the purpose/description of the amendment.</p></div><br/><div>${fallbackText}</div>` });
            }
        }

        // If all else fails, return the original message.
        return NextResponse.json({ text: '<p>No text versions or description found for this amendment.</p>' });
    } catch (error) {
        console.error('Error fetching amendment text:', error);
        return NextResponse.json({ error: 'Failed to fetch amendment text' }, { status: 500 });
    }
}
