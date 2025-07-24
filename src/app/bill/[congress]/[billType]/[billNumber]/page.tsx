
import { notFound } from 'next/navigation';
import type { Bill } from '@/types';
import { BillDetailClient } from '@/components/bill-detail-client';

async function getBillDetails(congress: string, billType: string, billNumber: string): Promise<Bill | null> {
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  const baseUrl = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}`;
  
  const embedParams = [
    'sponsors', 'cosponsors', 'committees', 'actions', 'amendments', 
    'relatedbills', 'summaries', 'textversions', 'subjects'
  ].map(p => `embed=${p}`).join('&');
  
  const fullUrl = `${baseUrl}?${embedParams}&api_key=${API_KEY}`;

  try {
    const billRes = await fetch(fullUrl, {
      next: { revalidate: 3600 },
    });

    if (!billRes.ok) {
      console.error(`API request failed with status: ${billRes.status} for URL: ${fullUrl}`);
      const errorText = await billRes.text();
      console.error('Error response body:', errorText);
      return null;
    }
    
    const billData = await billRes.json();
    
    if (!billData.bill) {
      return null;
    }
    
    const bill: Bill = billData.bill;

    // --- Safe Data Initialization ---
    // Ensure nested arrays/objects exist to prevent crashes on the client
    bill.sponsors = bill.sponsors || [];
    bill.cosponsors = bill.cosponsors || { count: 0, url: '', items: [] };
    bill.cosponsors.items = bill.cosponsors.items || [];
    bill.committees = bill.committees || { count: 0, items: [] };
    bill.committees.items = bill.committees.items || [];
    bill.actions = bill.actions || { count: 0, items: [] };
    bill.actions.items = bill.actions.items || [];
    bill.amendments = bill.amendments || { count: 0, items: [] };
    bill.amendments.items = bill.amendments.items || [];
    bill.relatedBills = bill.relatedBills || { count: 0, items: [] };
    bill.relatedBills.items = bill.relatedBills.items || [];
    bill.summaries = bill.summaries || { count: 0 };
    bill.textVersions = bill.textVersions || { count: 0, items: [] };
    bill.textVersions.items = bill.textVersions.items || [];
    bill.subjects = bill.subjects || { count: 0, items: [] };
    
    // The API sometimes returns summaries in a different shape.
    // Create a unified `allSummaries` field.
    let allSummaries = [];
    if (bill.summaries?.items && Array.isArray(bill.summaries.items)) {
      allSummaries = bill.summaries.items;
    } else if (bill.summaries?.summary) {
      allSummaries.push(bill.summaries.summary);
    }
    bill.allSummaries = allSummaries;

    if (bill.subjects) {
      if (!bill.subjects.items) {
        const legislativeSubjects = bill.subjects.legislativeSubjects || [];
        const policyArea = bill.subjects.policyArea ? [bill.subjects.policyArea] : [];
        bill.subjects.items = [...legislativeSubjects, ...policyArea];
      }
      bill.subjects.count = bill.subjects.items?.length || 0;
    }

    // --- Sort Collections by Date (Descending) ---
    const sortableFields: (keyof Bill)[] = ['actions', 'allSummaries', 'amendments', 'committees', 'textVersions'];
    try {
        if(bill.allSummaries) {
            bill.allSummaries.sort((a: any, b: any) => {
                const dateA = a.updateDate || a.actionDate || a.date;
                const dateB = b.updateDate || b.actionDate || b.date;
                if (!dateA) return 1;
                if (!dateB) return -1;
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            });
        }
        
        for (const field of sortableFields) {
            const collection = bill[field as keyof Bill] as any;
            if (collection && Array.isArray(collection.items)) {
              collection.items.sort((a: any, b: any) => {
                const dateA = a.updateDate || a.actionDate || a.date;
                const dateB = b.updateDate || b.actionDate || b.date;
                if (!dateA) return 1;
                if (!dateB) return -1;
                return new Date(dateB).getTime() - new Date(dateA).getTime();
              });
            }
        }
    } catch (error) {
      console.error("Error sorting bill data:", error);
    }
    
    return bill;
    
  } catch (error) {
    console.error("=== UNCAUGHT ERROR IN getBillDetails ===");
    if (error instanceof Error) {
        console.error("Error details:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
    } else {
        console.error("An unknown error occurred:", error);
    }
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
