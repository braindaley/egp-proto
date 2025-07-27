import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get('subject') || 'Health';
  const congress = searchParams.get('congress') || '119';

  const API_KEY = process.env.CONGRESS_API_KEY;
  if (!API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const testQueries = [
    // Different ways to query by subject
    `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=5&subject=${encodeURIComponent(subject)}`,
    `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=5&subject=${encodeURIComponent(`"${subject}"`)}`,
    `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=5&policyArea=${encodeURIComponent(subject)}`,
    `https://api.congress.gov/v3/bill/${congress}/search?api_key=${API_KEY}&format=json&limit=5&q=${encodeURIComponent(subject)}`,
    
    // Just get recent bills to see subject structure
    `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&format=json&limit=3&sort=updateDate+desc`,
  ];

  const results = [];

  for (let i = 0; i < testQueries.length; i++) {
    const url = testQueries[i];
    const queryType = i === 0 ? 'subject param' : 
                     i === 1 ? 'quoted subject' :
                     i === 2 ? 'policyArea param' :
                     i === 3 ? 'text search' : 'recent bills sample';

    try {
      console.log(`Testing ${queryType}:`, url.replace(API_KEY, 'API_KEY'));
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'BillTracker/1.0' }
      });

      if (response.ok) {
        const data = await response.json();
        results.push({
          queryType,
          success: true,
          billsFound: data.bills?.length || 0,
          url: url.replace(API_KEY, 'API_KEY'),
          sampleBills: data.bills?.slice(0, 2).map((bill: any) => ({
            title: bill.title,
            number: `${bill.type} ${bill.number}`,
            subjects: bill.subjects || 'No subjects field',
            updateDate: bill.updateDate
          })) || []
        });
      } else {
        results.push({
          queryType,
          success: false,
          error: `HTTP ${response.status}`,
          url: url.replace(API_KEY, 'API_KEY')
        });
      }
    } catch (error) {
      results.push({
        queryType,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        url: url.replace(API_KEY, 'API_KEY')
      });
    }
  }

  return NextResponse.json({
    testedSubject: subject,
    congress: congress,
    results: results,
    summary: {
      totalQueries: testQueries.length,
      successfulQueries: results.filter(r => r.success).length,
      queriesWithBills: results.filter(r => r.success && r.billsFound > 0).length
    }
  });
}