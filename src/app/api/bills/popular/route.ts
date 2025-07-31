import { NextResponse } from 'next/server';
import type { Bill } from '@/types';
import Parser from 'rss-parser';

// Helper to extract bills from HTML content
function parseBillsFromContent(content: string): Partial<Bill>[] {
    console.log('🔍 Parsing content length:', content.length);
    console.log('🔍 Content preview:', content.substring(0, 500));
    
    const bills: Partial<Bill>[] = [];
    
    // The actual format from Congress.gov RSS:
    // <li><a href='https://www.congress.gov/bill/119th-congress/house-bill/1'>H.R.1</a> [119th] - One Big Beautiful Bill Act</li>
    const congressPattern = /<li><a href='https:\/\/www\.congress\.gov\/bill\/(\d+)th-congress\/([^']+)'>((?:H\.R\.|S\.|H\.Res\.|S\.Res\.|H\.J\.Res\.|S\.J\.Res\.|H\.Con\.Res\.|S\.Con\.Res\.)\s*\d+)<\/a>\s*\[(\d+)th\]\s*-\s*([^<]+)<\/li>/gi;
    
    console.log('🔍 Testing Congress.gov RSS pattern...');
    let match;
    let matchCount = 0;
    
    while ((match = congressPattern.exec(content)) !== null && matchCount < 20) {
        matchCount++;
        console.log(`✅ Match ${matchCount}:`, match);
        
        const congress = parseInt(match[1], 10);
        const urlPath = match[2];
        const billFullNumber = match[3]; // e.g., "H.R.1"
        const congressInBrackets = parseInt(match[4], 10);
        const billTitle = match[5].trim();
        
        // Parse bill type and number from the full number
        const billMatch = billFullNumber.match(/(H\.R\.|S\.|H\.Res\.|S\.Res\.|H\.J\.Res\.|S\.J\.Res\.|H\.Con\.Res\.|S\.Con\.Res\.)\s*(\d+)/);
        
        if (!billMatch) {
            console.log(`❌ Could not parse bill number from: ${billFullNumber}`);
            continue;
        }
        
        const billType = billMatch[1].trim();
        const billNumber = billMatch[2].trim();
        const billUrl = `https://www.congress.gov/bill/${congress}th-congress/${urlPath}`;
        
        // Clean up title
        let cleanTitle = billTitle.replace(/\s*\.\.\.\s*$/, '').trim();
        if (cleanTitle.length > 200) {
            cleanTitle = cleanTitle.substring(0, 200) + '...';
        }

        // Avoid duplicates
        const billKey = `${billType}${billNumber}`;
        if (bills.some(b => `${b.type}${b.number}` === billKey)) {
            console.log(`⚠️ Skipping duplicate: ${billKey}`);
            continue;
        }

        const bill: Partial<Bill> = {
            congress,
            number: billNumber,
            type: billType,
            title: cleanTitle,
            shortTitle: `${billType} ${billNumber} - ${cleanTitle}`,
            url: billUrl,
        };

        bills.push(bill);
        console.log(`✅ Added bill: ${billType} ${billNumber} - ${cleanTitle.substring(0, 50)}...`);
    }
    
    // Reset regex lastIndex
    congressPattern.lastIndex = 0;

    console.log(`📊 Total bills extracted: ${bills.length}`);
    
    // If no bills found, let's try a simpler fallback pattern
    if (bills.length === 0) {
        console.log('🔄 No bills found with primary pattern, trying fallback...');
        const fallbackPattern = /<a href='[^']*'>([^<]+)<\/a>[^-]*-\s*([^<\n]+)/gi;
        
        let fallbackMatch;
        while ((fallbackMatch = fallbackPattern.exec(content)) !== null && bills.length < 10) {
            const billText = fallbackMatch[1].trim();
            const titleText = fallbackMatch[2].trim();
            
            console.log(`🔄 Fallback match: ${billText} - ${titleText}`);
            
            const billMatch = billText.match(/(H\.R\.|S\.|H\.Res\.|S\.Res\.|H\.J\.Res\.|S\.J\.Res\.|H\.Con\.Res\.|S\.Con\.Res\.)\s*(\d+)/);
            if (billMatch) {
                const bill: Partial<Bill> = {
                    congress: 119,
                    number: billMatch[2].trim(),
                    type: billMatch[1].trim(),
                    title: titleText,
                    shortTitle: `${billMatch[1].trim()} ${billMatch[2].trim()} - ${titleText}`,
                    url: `https://www.congress.gov/bill/119th-congress/${billMatch[1].toLowerCase().replace(/\./g, '')}-${billMatch[2]}`,
                };
                bills.push(bill);
                console.log(`✅ Added fallback bill: ${bill.type} ${bill.number}`);
            }
        }
        fallbackPattern.lastIndex = 0;
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
        console.log('📊 Feed items count:', feed.items?.length || 0);

        if (!feed.items || feed.items.length === 0) {
            console.log('❌ No items found in RSS feed');
            return NextResponse.json({ 
                bills: [], 
                debug: { 
                    error: 'No items found in RSS feed',
                    rssItems: 0,
                    parsedCount: 0,
                    lastUpdated: new Date().toISOString()
                } 
            }, { status: 404 });
        }

        let allBills: Partial<Bill>[] = [];
        
        for (const item of feed.items) {
            console.log('\n🔄 Processing RSS item...');
            console.log('📋 Item title:', item.title);
            console.log('🔗 Item link:', item.link);
            
            // The actual bills are in the content, not the title
            let content = '';
            if (item.content) {
                content = item.content;
                console.log('📄 Using content field');
            } else if (item.contentSnippet) {
                content = item.contentSnippet;
                console.log('📄 Using contentSnippet field');
            } else if (item.description) {
                content = item.description;
                console.log('📄 Using description field');
            } else {
                console.log('❌ No content found in item');
                continue;
            }

            const billsFromContent = parseBillsFromContent(content);
            allBills = allBills.concat(billsFromContent);
        }

        // Convert to full Bill objects
        const bills: Bill[] = allBills.map(bill => ({
            congress: bill.congress!,
            number: bill.number!,
            type: bill.type!,
            title: bill.title!,
            shortTitle: bill.shortTitle,
            url: bill.url!,
            latestAction: { 
                actionDate: new Date().toISOString(), 
                text: 'This bill is currently popular on Congress.gov.' 
            },
            updateDate: new Date().toISOString(),
            originChamber: bill.type!.startsWith('H') ? 'House' : 'Senate',
            introducedDate: new Date().toISOString(),
            originChamberCode: bill.type!.startsWith('H') ? 'H' : 'S',
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
            bills: bills.slice(0, 10), // Top 10
            debug: {
                rssItems: feed.items.length,
                parsedCount: bills.length,
                lastUpdated: feed.lastBuildDate ? new Date(feed.lastBuildDate).toISOString() : new Date().toISOString(),
                feedTitle: feed.title,
                feedDescription: feed.description,
                contentSample: feed.items[0]?.content?.substring(0, 300) || 'No content found'
            },
        });
        
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('❌ Error fetching or parsing RSS feed:', err);
        
        return NextResponse.json({
            bills: [],
            debug: { 
                error: errorMessage, 
                timestamp: new Date().toISOString(),
                rssItems: 0,
                parsedCount: 0,
                lastUpdated: new Date().toISOString()
            }
        }, { status: 500 });
    }
}