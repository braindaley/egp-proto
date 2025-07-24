
import { notFound } from 'next/navigation';
import type { Bill } from '@/types';
import { BillDetailClient } from '@/components/bill-detail-client';

async function getBillDetails(congress: string, billType: string, billNumber: string): Promise<Bill | null> {
  console.log('=== STARTING getBillDetails ===');
  console.log('Parameters:', { congress, billType, billNumber });
  
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  console.log('API Key being used:', API_KEY === 'DEMO_KEY' ? 'DEMO_KEY' : 'Custom API Key');
  
  const baseUrl = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}`;
  console.log('Base URL:', baseUrl);
  
  // Start with just sponsors to test
  const embedParams = ['sponsors'].map(p => `embed=${p}`).join('&');
  const fullUrl = `${baseUrl}?${embedParams}&api_key=${API_KEY}`;
  console.log('Full URL:', fullUrl);

  try {
    console.log('Making API request...');
    const billRes = await fetch(fullUrl, {
      next: { revalidate: 3600 },
    });

    console.log('Response received. Status:', billRes.status);
    console.log('Response headers:', Object.fromEntries(billRes.headers.entries()));

    if (billRes.status === 404) {
      console.log(`Bill not found for URL: ${fullUrl}`);
      return null;
    }

    if (!billRes.ok) {
      console.error(`API request failed with status: ${billRes.status}`);
      const errorText = await billRes.text();
      console.error('Error response body:', errorText);
      return null;
    }
    
    console.log('Parsing JSON response...');
    const billData = await billRes.json();
    console.log('JSON parsed successfully');
    console.log('Response structure:', Object.keys(billData));
    
    if (billData.bill) {
      console.log('Bill data structure:', Object.keys(billData.bill));
      console.log('Sponsors data:', billData.bill.sponsors);
    } else {
      console.log('No bill property in response');
    }
    
    const bill: Bill = billData.bill;

    if (!bill) {
      console.log('Bill is null or undefined');
      return null;
    }

    console.log('=== PROCESSING COMPLETE ===');
    return bill;
    
  } catch (error) {
    console.error("=== ERROR IN getBillDetails ===");
    console.error("Error details:", error);
    console.error("Error message:", (error as Error).message);
    console.error("Error stack:", (error as Error).stack);
    return null; 
  }
}


export default async function BillDetailPage({ params }: { params: { congress: string; billType: string; billNumber: string } }) {
  const { congress, billType, billNumber } = params;
  const bill = await getBillDetails(congress, billType, billNumber);

  if (!bill) {
    notFound();
  }
  
  return <BillDetailClient bill={bill} />;
}
