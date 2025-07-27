import { NextResponse } from 'next/server';
import type { Bill } from '@/types';

export async function GET() {
    const rssUrl = 'https://www.congress.gov/rss/most-viewed-bills.xml';

    try {
        const response = await fetch(rssUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; BillTracker/1.0)',
                'Accept': 'application/rss+xml, application/xml, text/xml',
            },
        });

        if (!response.ok) {
            throw new Error(`RSS fetch failed: ${response.status}`);
        }

        const xmlText = await response.text();
        
        // Extract items from XML
        const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi);
        if (!itemMatches) {
            return NextResponse.json({ 
                bills: [], 
                debug: { error: 'No RSS items found' } 
            }, { status: 404 });
        }

        // Get first item content
        const firstItem = itemMatches[0];
        const contentMatch = firstItem.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) ||
                            firstItem.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
        
        if (!contentMatch) {
            return NextResponse.json({ 
                bills: [], 
                debug: { error: 'No content found' } 
            });
        }

        const content = contentMatch[1].trim();
        const decodedContent = content
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

        // Parse bills from HTML
        const bills: Bill[] = [];
        const pattern = /<li><a href=['"]([^'"]+)['"]>([^<]+)<\/a>\s*\[(\d+)(?:st|nd|rd|th)?\]\s*-\s*([^<]*)<\/li>/g;
        let match;

        while ((match = pattern.exec(decodedContent)) !== null && bills.length < 10) {
            const url = match[1];
            const billNumber = match[2].trim();
            const congress = parseInt(match[3], 10);
            const title = match[4].trim();

            // Extract bill type and number
            const typeMatch = billNumber.match(/^(H\.R\.|S\.|H\.Res\.|S\.Res\.|H\.J\.Res\.|S\.J\.Res\.|H\.Con\.Res\.|S\.Con\.Res\.)(.+)$/);
            if (!typeMatch) continue;

            const type = typeMatch[1];
            const number = typeMatch[2];

            const bill: Bill = {
                congress: congress,
                number: number,
                type: type,
                title: title,
                shortTitle: `${billNumber} - ${title}`,
                url: url,
                latestAction: { 
                    actionDate: new Date().toISOString(), 
                    text: 'This bill is currently popular on Congress.gov.' 
                },
                updateDate: new Date().toISOString(),
                originChamber: type.startsWith('H') ? 'House' : 'Senate',
                // Add missing required properties with correct structure
                introducedDate: new Date().toISOString(), // Use current date as placeholder
                originChamberCode: type.startsWith('H') ? 'H' : 'S',
                sponsors: [],
                cosponsors: { count: 0, items: [], url: '' },
                committees: { count: 0, items: [] },
                subjects: { count: 0, items: [] },
                summaries: { count: 0 },
                allSummaries: [], // This should be an array, not an ApiCollection
                actions: { count: 0, items: [] },
                relatedBills: { count: 0, items: [] },
                amendments: { count: 0, items: [] },
                textVersions: { count: 0, items: [] }
            };
            bills.push(bill);
        }

        return NextResponse.json({
            bills: bills,
            debug: {
                rssItems: itemMatches.length,
                contentLength: content.length,
                parsedCount: bills.length,
                lastUpdated: new Date().toISOString()
            },
        });
        
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({
            bills: [],
            debug: { error: errorMessage, timestamp: new Date().toISOString() }
        }, { status: 500 });
    }
}