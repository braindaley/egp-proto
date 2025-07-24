
import { notFound } from 'next/navigation';
import type { Bill } from '@/types';
import { BillDetailClient } from '@/components/bill-detail-client';

async function getBillDetails(congress: string, billType: string, billNumber: string): Promise<Bill | null> {
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  const baseUrl = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}`;
  
  const embedParams = [
    'sponsors', 'cosponsors', 'committees', 'actions', 'amendments', 
    'relatedbills', 'summaries', 'textversions', 'subjects', 'titles'
  ].map(p => `embed=${p}`).join('&');
  
  const fullUrl = `${baseUrl}?${embedParams}&api_key=${API_KEY}`;

  try {
    const billRes = await fetch(fullUrl, {
      next: { revalidate: 3600 },
    });

    if (billRes.status === 404) {
      console.log(`Bill not found for URL: ${fullUrl}`);
      return null;
    }

    if (!billRes.ok) {
      console.error(`API request for bill failed with status: ${billRes.status} for URL: ${fullUrl}`);
       if (billRes.status === 429) {
          console.error("Rate limit exceeded. Please try again later or use a dedicated API key.");
        }
      return null;
    }
    
    const billData = await billRes.json();
    const bill: Bill = billData.bill;

    // Ensure all nested objects and arrays are initialized to prevent runtime errors
    bill.sponsors = bill.sponsors || [];
    bill.cosponsors = bill.cosponsors || { count: 0, url: '', items: [] };
    bill.cosponsors.items = bill.cosponsors.items || [];
    bill.committees = bill.committees || { count: 0, items: [] };
    bill.committees.items = bill.committees.items || [];
    bill.summaries = bill.summaries || { count: 0, items: [] };
    bill.allSummaries = bill.summaries.items || [];
    bill.actions = bill.actions || { count:0, items:[] };
    bill.amendments = bill.amendments || { count:0, items:[] };
    bill.relatedBills = bill.relatedBills || { count:0, items:[] };
    bill.subjects = bill.subjects || { count: 0, items: [] };
    bill.textVersions = bill.textVersions || { count:0, items:[] };
    
    const legislativeSubjects = bill.subjects.legislativeSubjects || [];
    const policyArea = bill.subjects.policyArea ? [bill.subjects.policyArea] : [];
    bill.subjects.items = [...legislativeSubjects, ...policyArea];
    bill.subjects.count = bill.subjects.items.length;

    // Find the latest summary
    if (bill.allSummaries.length > 0) {
      const sortedSummaries = [...bill.allSummaries].sort((a,b) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime());
      bill.summaries.summary = sortedSummaries[0];
    }
    
    // Sort items with dates in descending order
    const sortableFields: (keyof Bill)[] = ['actions', 'amendments', 'relatedBills', 'textVersions'];

    for (const field of sortableFields) {
        const collection = bill[field] as any;
        if (collection && Array.isArray(collection.items)) {
            collection.items.sort((a: any, b: any) => {
                const dateA = a.updateDate || a.actionDate || a.date;
                const dateB = b.updateDate || b.actionDate || b.date;
                if (!dateA) return 1;
                if (!dateB) return -1;
                // Use getTime() for reliable date comparison
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            });
        }
    }
    
    if (bill.allSummaries) {
        bill.allSummaries.sort((a, b) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime());
    }

    if (Array.isArray(bill.committees?.items)) {
      bill.committees.items.forEach(committee => {
        if(Array.isArray(committee.activities)){
          committee.activities.sort((a,b) => {
            if(!a.date) return 1;
            if(!b.date) return -1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });
        }
      });
    }
    
    return bill;
  } catch (error) {
    console.error("Error fetching or processing bill details:", error);
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
