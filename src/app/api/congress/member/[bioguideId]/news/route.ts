
import { NextResponse, type NextRequest } from 'next/server';
import Parser from 'rss-parser';
import type { NewsArticle } from '@/types';

// Helper to extract image URL from HTML content
function extractImageUrl(content: string): string | null {
    if (!content) return null;
    const imgTagMatch = content.match(/<img[^>]+src="([^">]+)"/);
    return imgTagMatch ? imgTagMatch[1] : null;
}

export async function GET(req: NextRequest, { params }: { params: { bioguideId: string } }) {
  const { bioguideId } = await params;
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!API_KEY) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  if (!bioguideId) {
    return NextResponse.json({ error: 'Missing bioguideId parameter' }, { status: 400 });
  }

  try {
    // 1. Fetch member details to get their name
    const memberUrl = `https://api.congress.gov/v3/member/${bioguideId}?api_key=${API_KEY}`;
    const memberRes = await fetch(memberUrl, { next: { revalidate: 3600 } });

    if (!memberRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch member details to get name for news feed' }, { status: memberRes.status });
    }
    const memberData = await memberRes.json();
    const memberName = memberData?.member?.directOrderName;

    if (!memberName) {
        return NextResponse.json({ articles: [], error: 'Could not determine member name for news feed' }, { status: 404 });
    }

    // 2. Construct Google News RSS URL
    const rssUrl = `https://news.google.com/rss/search?q="${encodeURIComponent(memberName)}"&hl=en-US&gl=US&ceid=US:en`;
    
    // 3. Fetch and parse the RSS feed
    const parser = new Parser({
        customFields: {
          item: ['source'],
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36'
        }
    });

    const feed = await parser.parseURL(rssUrl);

    // 4. Process items to include imageUrl
    const newsItems: NewsArticle[] = (feed.items || []).slice(0, 10).map(item => ({
        title: item.title!,
        link: item.link!,
        pubDate: item.pubDate!,
        source: item.source,
        content: item.content,
        imageUrl: extractImageUrl(item.content || ''),
    }));

    // 5. Return the items
    return NextResponse.json({ articles: newsItems });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching news';
    console.error(`Error fetching news for ${bioguideId}:`, error);
    return NextResponse.json({ articles: [], error: errorMessage }, { status: 500 });
  }
}
