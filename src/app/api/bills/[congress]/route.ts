
import { NextResponse, type NextRequest } from 'next/server';
import type { Bill } from '@/types';

interface CongressBill {
  congress: number;
  number: string;
  type: string;
  title: string;
  url: string;
  updateDate: string;
  originChamber: string;
  latestAction?: {
    actionDate: string;
    text: string;
  };
}

async function fetchBillDetails(billUrl: string, apiKey: string): Promise<Partial<Bill> | null> {
  try {
    const detailUrl = `${billUrl}?api_key=${apiKey}`;
    const res = await fetch(detailUrl, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.bill;
  } catch (error) {
    console.error('Error fetching bill detail:', error);
    return null;
  }
}

export async function GET(req: NextRequest, { params }: { params: { congress: string } }) {
  const { congress } = params;
  const API_KEY = process.env.CONGRESS_API_KEY;

  if (!API_KEY) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  if (isNaN(Number(congress))) {
    return NextResponse.json({ error: 'Invalid congress number provided.' }, { status: 400 });
  }

  try {
    const listUrl = `https://api.congress.gov/v3/bill/${congress}?api_key=${API_KEY}&limit=10&sort=updateDate+desc`;
    const listRes = await fetch(listUrl, { next: { revalidate: 3600 } });
    
    if (!listRes.ok) {
      console.error(`API list request failed: ${listRes.status}`);
      return NextResponse.json({ error: `Failed to fetch bill list: ${listRes.statusText}` }, { status: listRes.status });
    }
    
    const listData = await listRes.json();
    const basicBills: CongressBill[] = listData.bills || [];

    const detailedBillPromises = basicBills.map(bill => fetchBillDetails(bill.url, API_KEY));
    const detailedBillsResults = await Promise.all(detailedBillPromises);

    const bills: Bill[] = detailedBillsResults.filter(Boolean) as Bill[];

    return NextResponse.json({ bills });

  } catch (error) {
    console.error(`Error fetching bills for congress ${congress}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
