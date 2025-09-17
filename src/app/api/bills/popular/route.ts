import { NextResponse } from 'next/server';
import type { Bill } from '@/types';
import Parser from 'rss-parser';

// Mapping from URL slug to bill type abbreviation
const typeMap: { [key: string]: string } = {
    'house-bill': 'H.R.',
    'senate-bill': 'S.',
    'house-joint-resolution': 'H.J.Res.',
    'senate-joint-resolution': 'S.J.Res.',
    'house-concurrent-resolution': 'H.Con.Res.',
    'senate-concurrent-resolution': 'S.Con.Res.',
    'house-resolution': 'H.Res.',
    'senate-resolution': 'S.Res.',
};

function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&#x5C;/g, '\\')
        .replace(/&#96;/g, '`');
}

function parseBillsFromContent(content: string): Partial<Bill>[] {
    console.log('--- Using Robust Bill Parsing ---');
    const bills: Partial<Bill>[] = [];
    // This pattern finds links to bills and captures the title that follows.
    // It's more resilient than matching the entire HTML structure (e.g., `<li>` tags).
    const billPattern = /<a href='https:\/\/www\.congress\.gov\/bill\/(\d+)th-congress\/([^\/]+)\/(\d+)'>.*?<\/a>.*?-\s*([\s\S]*?)(?=<br|<li>|<\/ul>|$)/gi;

    let match;
    while ((match = billPattern.exec(content)) !== null) {
        const congress = parseInt(match[1], 10);
        const billTypeSlug = match[2];
        const billNumber = match[3];
        // Decode HTML entities and clean up the title
        let title = decodeHtmlEntities(match[4].trim()).replace(/\s*\.\.\.\s*$/, '');
        // Remove any HTML tags that might have been left in the title
        title = title.replace(/<[^>]*>/g, '');

        const type = typeMap[billTypeSlug];

        if (!type) {
            console.warn(`[Parser] Skipping unknown bill type slug: ${billTypeSlug}`);
            continue;
        }

        const billUrl = `https://www.congress.gov/bill/${congress}th-congress/${billTypeSlug}/${billNumber}`;

        const bill: Partial<Bill> = {
            congress,
            number: billNumber,
            type,
            title,
            url: billUrl,
            shortTitle: `${type} ${billNumber} - ${title}`,
        };
        
        // Avoid duplicates that can sometimes appear in the feed
        if (!bills.some(b => b.number === bill.number && b.type === bill.type)) {
            bills.push(bill);
            console.log(`[Parser] ✅ Parsed: ${type} ${billNumber}`);
        }
    }

    if (bills.length === 0) {
        console.log('[Parser] ❌ No bills found with robust pattern.');
        console.log('--- Content for Debugging ---');
        console.log(content);
        console.log('--- End Content ---');
    }
    
    return bills;
}


export async function GET() {
    const rssUrl = 'https://www.congress.gov/rss/most-viewed-bills.xml';

    try {
        console.log('🔗 Fetching RSS from:', rssUrl);
        const parser = new Parser();
        const feed = await parser.parseURL(rssUrl);

        console.log('📡 RSS Feed parsed successfully');
        if (!feed?.items?.length) {
            console.log('❌ No items found in RSS feed');
            return NextResponse.json({ 
                bills: [], 
                debug: { error: 'No items found in RSS feed' } 
            }, { status: 404 });
        }

        let allBills: Partial<Bill>[] = [];
        for (const item of feed.items) {
            // The actual bill details are in the 'content' field as HTML
            const content = item.content || item.contentSnippet || '';
            if (!content) {
                console.log(`[Item] Skipping RSS item with no content: "${item.title}"`);
                continue;
            }

            const billsFromContent = parseBillsFromContent(content);
            allBills = allBills.concat(billsFromContent);
        }

        // Convert to full Bill objects, adding required fields
        const bills: Bill[] = allBills.map(bill => ({
            congress: bill.congress!,
            number: bill.number!,
            type: bill.type!,
            originChamber: bill.type!.startsWith('H') ? 'House' : 'Senate',
            originChamberCode: bill.type!.startsWith('H') ? 'H' : 'S',
            title: bill.title!,
            shortTitle: bill.shortTitle,
            url: bill.url!,
            updateDate: new Date().toISOString(),
            introducedDate: new Date().toISOString(), // Placeholder
            latestAction: { // Placeholder
                actionDate: new Date().toISOString(), 
                text: 'This bill is currently popular on Congress.gov.' 
            },
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
        }));

        console.log(`\n📈 Final Results: ${bills.length} bills parsed from ${feed.items.length} RSS items`);

        return NextResponse.json({
            bills: bills.slice(0, 10), // Return top 10
            debug: {
                rssItems: feed.items.length,
                parsedCount: bills.length,
                lastUpdated: feed.lastBuildDate ? new Date(feed.lastBuildDate).toISOString() : new Date().toISOString(),
                feedTitle: feed.title,
            },
        });
        
    } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('❌ Error fetching or parsing popular bills RSS feed:', {
            message: error.message,
            stack: error.stack,
            cause: 'cause' in error ? error.cause : undefined,
        });
        
        return NextResponse.json({
            bills: [],
            debug: { 
                error: `Failed to process RSS feed: ${error.message}`, 
                timestamp: new Date().toISOString(),
            }
        }, { status: 500 });
    }
}