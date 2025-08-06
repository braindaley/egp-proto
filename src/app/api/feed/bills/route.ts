import { NextResponse, type NextRequest } from 'next/server';
import type { Bill, CongressApiResponse, FeedBill } from '@/types';

// This function determines a simplified status of the bill
function getBillStatus(latestActionText: string): string {
    const lowerCaseAction = latestActionText.toLowerCase();

    if (lowerCaseAction.includes('became public law')) {
        return 'Became Law';
    }
    if (lowerCaseAction.includes('presented to president')) {
        return 'To President';
    }
    if (lowerCaseAction.includes('passed house') || lowerCaseAction.includes('passed/agreed to in house')) {
        return 'Passed House';
    }
     if (lowerCaseAction.includes('passed senate') || lowerCaseAction.includes('passed/agreed to in senate')) {
        return 'Passed Senate';
    }
    if (lowerCaseAction.includes('committee')) {
        return 'In Committee';
    }
    return 'Introduced';
}

export async function GET(req: NextRequest) {
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!API_KEY || API_KEY === 'your_congress_api_key_here') {
    console.error('Missing CONGRESS_API_KEY environment variable');
    return NextResponse.json({ error: 'Server configuration error: Congress API key is missing or not set.' }, { status: 500 });
  }

  try {
    // 1. Fetch the list of 20 most recently updated bills
    const listUrl = `https://api.congress.gov/v3/bill?limit=20&sort=updateDate+desc&api_key=${API_KEY}`;
    console.log('Fetching bill list from:', listUrl.replace(API_KEY, '[API_KEY]'));
    
    const listRes = await fetch(listUrl, { next: { revalidate: 600 } });

    if (!listRes.ok) {
      console.error('Bill list fetch failed:', listRes.status, listRes.statusText);
      throw new Error(`Failed to fetch bill list from Congress API: ${listRes.status}`);
    }

    const listData: CongressApiResponse = await listRes.json();
    console.log('Bill list response:', { 
      billsCount: listData.bills?.length || 0,
      firstBill: listData.bills?.[0] 
    });

    const billItems = listData.bills || [];

    if (billItems.length === 0) {
      console.log('No bills returned from Congress API');
      return NextResponse.json({ bills: [] });
    }

    // 2. Fetch detailed information for each bill in parallel
    console.log(`Fetching details for ${billItems.length} bills...`);
    const billDetailPromises = billItems.map((item, index) =>
      fetch(`${item.url}${item.url.includes('?') ? '&' : '?'}api_key=${API_KEY}`, { next: { revalidate: 600 } })
        .then(res => {
          console.log(`Bill ${index} detail fetch:`, res.ok ? 'SUCCESS' : `FAILED ${res.status}`);
          return res.ok ? res.json() : null;
        })
        .catch(err => {
          console.error(`Bill ${index} detail fetch error:`, err.message);
          return null;
        })
    );

    const detailedBillResponses = await Promise.all(billDetailPromises);
    const successfulResponses = detailedBillResponses.filter(Boolean);
    console.log(`Successfully fetched ${successfulResponses.length} out of ${billItems.length} bill details`);

    // 3. Process the results into the desired feed format
    const feedBills = detailedBillResponses
      .map((response, index) => {
        if (!response || !response.bill) {
          console.log(`Skipping bill ${index} - no response or bill data`);
          return null;
        }

        const billListItem = billItems[index];
        const detailedBill = response.bill;
        
        const shortTitle = detailedBill.title?.split(';').find((t: string) => !t.toLowerCase().includes('official title')) || detailedBill.title || 'No title';

        const processedBill: FeedBill = {
          shortTitle: shortTitle.trim(),
          billNumber: `${billListItem.type} ${billListItem.number}`,
          congress: billListItem.congress,
          type: billListItem.type,
          number: billListItem.number,
          latestAction: detailedBill.latestAction,
          sponsorParty: detailedBill.sponsors?.[0]?.party || 'N/A',
          committeeName: detailedBill.committees?.items?.[0]?.name || 'N/A',
          status: getBillStatus(detailedBill.latestAction?.text || ''),
        };

        console.log(`Processed bill ${index}:`, { 
          shortTitle: processedBill.shortTitle, 
          billNumber: processedBill.billNumber 
        });

        return processedBill;
      })
      .filter((bill): bill is FeedBill => bill !== null);

    console.log(`Returning ${feedBills.length} processed bills`);
    return NextResponse.json({ bills: feedBills });

  } catch (error) {
    console.error('Error in /api/feed/bills:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}