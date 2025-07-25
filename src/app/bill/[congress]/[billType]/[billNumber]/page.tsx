
import { notFound } from 'next/navigation';
import type { Bill } from '@/types';
import { BillDetailClient } from '@/components/bill-detail-client';

async function getBillDetails(congress: string, billType: string, billNumber: string): Promise<Bill | null> {
  console.log('=== STARTING getBillDetails ===');
  
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  const baseUrl = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}`;
  
  const embedParams = [
    'sponsors', 'cosponsors', 'committees', 'actions', 'amendments', 
    'relatedbills', 'summaries', 'textversions', 'subjects'
  ].map(p => `embed=${p}`).join('&');
  
  const fullUrl = `${baseUrl}?${embedParams}&api_key=${API_KEY}`;
  console.log('Making API request...');
  console.log('Full URL:', fullUrl);

  try {
    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Request timeout - aborting...');
      controller.abort();
    }, 15000); // 15 second timeout

    console.log('About to call fetch...');
    
    const billRes = await fetch(fullUrl, {
      next: { revalidate: 3600 },
      signal: controller.signal,
      headers: {
        'User-Agent': 'Congress-Bill-App/1.0'
      }
    });

    clearTimeout(timeoutId);
    console.log('Fetch completed! Status:', billRes.status);

    if (billRes.status === 404) {
      console.log(`Bill not found for URL: ${fullUrl}`);
      return null;
    }

    if (!billRes.ok) {
      console.error(`API request failed with status: ${billRes.status}`);
      const errorText = await billRes.text();
      console.error('Error response:', errorText);
      return null;
    }
    
    console.log('Reading response...');
    const billData = await billRes.json();
    console.log('Response parsed successfully');

    console.log('=== RAW API RESPONSE INSPECTION ===');
    console.log('Raw bill keys:', Object.keys(billData.bill));

    // Check what embedded data actually came back
    const rawBill = billData.bill;
    console.log('Raw embedded data:', {
      sponsors: rawBill.sponsors?.length || 'undefined',
      cosponsors: rawBill.cosponsors ? `count: ${rawBill.cosponsors.count}, items: ${rawBill.cosponsors.items?.length || 0}` : 'undefined',
      committees: rawBill.committees ? `count: ${rawBill.committees.count}, items: ${rawBill.committees.items?.length || 0}` : 'undefined',
      actions: rawBill.actions ? `count: ${rawBill.actions.count}, items: ${rawBill.actions.items?.length || 0}` : 'undefined',
      amendments: rawBill.amendments ? `count: ${rawBill.amendments.count}, items: ${rawBill.amendments.items?.length || 0}` : 'undefined',
      relatedBills: rawBill.relatedBills ? `count: ${rawBill.relatedBills.count}, items: ${rawBill.relatedBills.items?.length || 0}` : 'undefined',
      subjects: rawBill.subjects ? `count: ${rawBill.subjects.count}, items: ${rawBill.subjects.items?.length || 0}` : 'undefined',
      summaries: rawBill.summaries ? `count: ${rawBill.summaries.count}, items: ${rawBill.summaries.items?.length || 0}` : 'undefined',
      textVersions: rawBill.textVersions ? `count: ${rawBill.textVersions.count}, items: ${rawBill.textVersions.items?.length || 0}` : 'undefined'
    });

    // Check subjects structure specifically
    if (rawBill.subjects) {
      console.log('Subjects structure:', {
        hasItems: !!rawBill.subjects.items,
        hasLegislativeSubjects: !!rawBill.subjects.legislativeSubjects,
        hasPolicyArea: !!rawBill.subjects.policyArea,
        itemsLength: rawBill.subjects.items?.length || 0,
        legislativeSubjectsLength: rawBill.subjects.legislativeSubjects?.length || 0
      });
    }
    
    const bill: Bill = billData.bill;

    if (!bill) {
      console.log('No bill data in response');
      return null;
    }

    // Basic data initialization
    bill.sponsors = bill.sponsors || [];
    bill.cosponsors = bill.cosponsors || { count: 0, url: '', items: [] };
    bill.committees = bill.committees || { count: 0, items: [] };
    bill.actions = bill.actions || { count: 0, items: [] };
    bill.amendments = bill.amendments || { count: 0, items: [] };
    bill.relatedBills = bill.relatedBills || { count: 0, items: [] };
    bill.subjects = bill.subjects || { count: 0, items: [] };
    bill.summaries = bill.summaries || { count: 0, items: [] };
    bill.textVersions = bill.textVersions || { count: 0, items: [] };
    bill.allSummaries = bill.summaries.items || [];

    console.log('Data processing complete');
    return bill;
    
  } catch (error: any) {
    console.error("=== ERROR IN getBillDetails ===");
    
    if (error.name === 'AbortError') {
      console.error('Request was aborted (timeout)');
    } else if (error.name === 'TypeError') {
      console.error('Network error (possibly CORS or connectivity issue)');
    } else {
      console.error('Unexpected error:', error);
    }
    
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return null; 
  }
}

export default async function BillDetailPage({ params }: { params: Promise<{ congress: string; billType: string; billNumber: string }> }) {
  // Await the params before using them in Next.js 15+
  const { congress, billType, billNumber } = await params;
  
  const bill = await getBillDetails(congress, billType, billNumber);

  if (!bill) {
    notFound();
  }
  
  return <BillDetailClient bill={bill} />;
}
