
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import type { Bill } from '@/types';

interface BillInfo {
    title: string;
    number: string;
    type: string;
    congress: number;
    url: string;
}

function parseBillFromLink(link: string): BillInfo | null {
    if (!link) return null;
    const billRegex = /\/bill\/(\d+)(?:st|nd|rd|th)-congress\/(house-bill|senate-bill|house-joint-resolution|senate-joint-resolution|house-concurrent-resolution|senate-concurrent-resolution|house-resolution|senate-resolution)\/(\d+)/;
    const match = link.match(billRegex);
    if (!match) return null;

    const congress = parseInt(match[1], 10);
    const typeSlug = match[2];
    const number = match[3];

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
    
    const type = typeMap[typeSlug] || 'Unknown';

    return { title: '', url: link, congress, type, number };
}

function parseHtmlContent(htmlContent: string): Bill[] {
    const bills: Bill[] = [];
    if (!htmlContent) return bills;
    const itemRegex = /<li><a href="([^"]+)">([^<]+)<\/a><\/li>/g;
    let match;

    while ((match = itemRegex.exec(htmlContent)) !== null) {
        const url = match[1];
        const titleText = match[2];
        const parsedInfo = parseBillFromLink(url);
        if (parsedInfo) {
            const bill: Partial<Bill> = {
                congress: parsedInfo.congress,
                number: parsedInfo.number,
                type: parsedInfo.type,
                title: titleText.replace(`${parsedInfo.type} ${parsedInfo.number} - `, ''),
                shortTitle: titleText,
                url: parsedInfo.url,
                latestAction: { actionDate: new Date().toISOString(), text: 'This bill is currently popular on Congress.gov.' },
                updateDate: new Date().toISOString(),
                originChamber: parsedInfo.type.startsWith('H') ? 'House' : 'Senate',
            };
            bills.push(bill as Bill);
        }
    }
    return bills;
}

export async function GET() {
    const parser = new Parser();
    const rssUrl = 'https://www.congress.gov/rss/most-viewed-bills.xml';

    try {
        const feed = await parser.parseURL(rssUrl);
        const content = feed.items?.[0]?.content || '';
        const popularBills = parseHtmlContent(content);

        return NextResponse.json({
            bills: popularBills,
            debug: {
                rssItems: feed.items?.length ?? 0,
                contentLength: content.length,
                parsedCount: popularBills.length,
            },
        });
    } catch(err) {
        console.error('RSS fetch error:', err);
        return NextResponse.json({
            bills: [],
            debug: {
                error: err instanceof Error ? err.message : 'Unknown fetch error',
                rssItems: 0,
                contentLength: 0,
                parsedCount: 0,
            }
        }, { status: 500 });
    }
}
