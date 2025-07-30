import { NextResponse } from 'next/server';
import type { Bill } from '@/types';
import Parser from 'rss-parser';

// Helper to extract bill details from the title string in the RSS feed
function parseBillFromTitle(title: string, link: string): Partial<Bill> | null {
    // Example: "H.R.5894 - Military Construction, Veterans Affairs, and Related Agencies Appropriations Act, 2024"
    // Or: "S.4445 - A bill to reauthorize the A... [118th]"
    const titleRegex = /^(H\.R\.|S\.|H\.Res\.|S\.Res\.|H\.J\.Res\.|S\.J\.Res\.|H\.Con\.Res\.|S\.Con\.Res\.)\s*(\d+)\s*-\s*(.*)/;
    const match = title.match(titleRegex);

    if (!match) {
        return null;
    }

    const billType = match[1].trim();
    const billNumber = match[2].trim();
    let billTitle = match[3].trim();
    
    // Extract congress from link: https://www.congress.gov/bill/118th-congress/house-bill/5894
    const congressMatch = link.match(/(\d+)th-congress/);
    const congress = congressMatch ? parseInt(congressMatch[1], 10) : 118; // Default to 118

    // Clean up title if it contains "..."
    if (billTitle.endsWith('...')) {
      billTitle = billTitle.slice(0, -4);
    }
    
    return {
        congress: congress,
        number: billNumber,
        type: billType,
        title: billTitle,
        shortTitle: `${billType} ${billNumber} - ${billTitle}`,
        url: link,
    };
}


export async function GET() {
    const rssUrl = 'https://www.congress.gov/rss/most-viewed-bills.xml';

    try {
        const parser = new Parser();
        const feed = await parser.parseURL(rssUrl);

        if (!feed.items || feed.items.length === 0) {
            return NextResponse.json({ 
                bills: [], 
                debug: { error: 'No items found in RSS feed' } 
            }, { status: 404 });
        }

        const bills: Bill[] = [];
        
        for (const item of feed.items) {
            if (!item.title || !item.link) continue;
            
            const parsedBill = parseBillFromTitle(item.title, item.link);
            if (!parsedBill) continue;

            const bill: Bill = {
                congress: parsedBill.congress!,
                number: parsedBill.number!,
                type: parsedBill.type!,
                title: parsedBill.title!,
                shortTitle: parsedBill.shortTitle,
                url: parsedBill.url!,
                latestAction: { 
                    actionDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(), 
                    text: 'This bill is currently popular on Congress.gov.' 
                },
                updateDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                originChamber: parsedBill.type!.startsWith('H') ? 'House' : 'Senate',
                introducedDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(), // Placeholder
                originChamberCode: parsedBill.type!.startsWith('H') ? 'H' : 'S',
                sponsors: [],
                cosponsors: { count: 0, items: [], url: '' },
                committees: { count: 0, items: [] },
                subjects: { count: 0, items: [] },
                summaries: { count: 0 },
                allSummaries: [],
                actions: { count: 0, items: [] },
                relatedBills: { count: 0, items: [] },
                amendments: { count: 0, items: [] },
                textVersions: { count: 0, items: [] }
            };
            bills.push(bill);
        }

        return NextResponse.json({
            bills: bills.slice(0, 10), // Ensure we only return top 10
            debug: {
                rssItems: feed.items.length,
                parsedCount: bills.length,
                lastUpdated: feed.lastBuildDate ? new Date(feed.lastBuildDate).toISOString() : new Date().toISOString()
            },
        });
        
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error fetching or parsing RSS feed:', err);
        return NextResponse.json({
            bills: [],
            debug: { error: errorMessage, timestamp: new Date().toISOString() }
        }, { status: 500 });
    }
}
