import { NextResponse, type NextRequest } from 'next/server';
import type { Bill } from '@/types';

// Simplified interface for the list endpoint response
interface BillListItem {
  congress: number;
  number: string;
  type: string;
  title: string;
  url: string; // This is the API URL for the detail view
}

interface BillListResponse {
  bills: BillListItem[];
}

// Simplified interface for the detail endpoint response
interface BillDetailResponse {
  bill: {
    title: string;
    sponsors?: { fullName: string; party: string }[];
    committees?: {
      items?: { name: string }[];
    };
    latestAction: {
      actionDate: string;
      text: string;
    };
    // Add other fields as necessary
  };
}

// Function to determine the current status of a bill
function getBillStatus(latestActionText: string): string {
    const lowerCaseAction = latestActionText.toLowerCase();
    if (lowerCaseAction.includes('became public law')) return 'Became Law';
    if (lowerCaseAction.includes('presented to president')) return 'To President';
    if (lowerCaseAction.includes('passed house') || lowerCaseAction.includes('passed/agreed to in house')) return 'Passed House';
    if (lowerCaseAction.includes('passed senate') || lowerCaseAction.includes('passed/agreed to in senate')) return 'Passed Senate';
    if (lowerCaseAction.includes('committee')) return 'In Committee';
    if (lowerCaseAction.includes('introduced')) return 'Introduced';
    return 'Introduced';
}


export async function GET(req: NextRequest) {
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!API_KEY) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    // 1. Fetch the list of 20 most recently updated bills
    const listUrl = `https://api.congress.gov/v3/bill?limit=20&sort=updateDate+desc&api_key=${API_KEY}`;
    const listRes = await fetch(listUrl, { next: { revalidate: 600 } }); // Cache for 10 minutes

    if (!listRes.ok) {
      throw new Error(`Failed to fetch bill list from Congress API: ${listRes.status}`);
    }

    const listData: BillListResponse = await listRes.json();
    const billItems = listData.bills || [];

    // 2. Fetch detailed information for each bill in parallel
    const billDetailPromises = billItems.map(item =>
      fetch(`${item.url}?api_key=${API_KEY}`, { next: { revalidate: 600 } })
        .then(res => res.ok ? res.json() : null)
        .catch(() => null) // Ignore individual fetch errors
    );

    const detailedBillResponses = await Promise.all(billDetailPromises);

    // 3. Process the results into the desired feed format
    const feedBills = detailedBillResponses
      .map((response, index) => {
        if (!response || !response.bill) return null;

        const billListItem = billItems[index];
        const detailedBill = response.bill;
        
        const shortTitle = detailedBill.title.split(';').find((t: string) => !t.toLowerCase().includes('official title')) || detailedBill.title;

        return {
          shortTitle: shortTitle.trim(),
          billNumber: `${billListItem.type} ${billListItem.number}`,
          congress: billListItem.congress,
          type: billListItem.type,
          number: billListItem.number,
          latestAction: detailedBill.latestAction,
          sponsorParty: detailedBill.sponsors?.[0]?.party || 'N/A',
          committeeName: detailedBill.committees?.items?.[0]?.name || 'N/A',
          status: getBillStatus(detailedBill.latestAction.text),
        };
      })
      .filter(Boolean); // Filter out any null results from failed fetches

    return NextResponse.json({ bills: feedBills });

  } catch (error) {
    console.error('Error in /api/feed/bills:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
