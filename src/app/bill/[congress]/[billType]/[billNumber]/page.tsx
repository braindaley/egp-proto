
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

    if (billRes.status === 404) {
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

    // Ensure all potentially missing fields are initialized to prevent runtime errors
    bill.sponsors = bill.sponsors || [];
    bill.cosponsors = bill.cosponsors || { count: 0, url: '', items: [] };
    bill.cosponsors.items = bill.cosponsors.items || [];
    bill.committees = bill.committees || { count: 0, items: [] };
    bill.committees.items = bill.committees.items || [];
    bill.summaries = bill.summaries || { count: 0, items: [] };
    bill.allSummaries = bill.summaries.items || [];
    bill.actions = bill.actions || [];
    bill.amendments = bill.amendments || [];
    bill.relatedBills = bill.relatedBills || [];
    bill.subjects = bill.subjects || { count: 0, items: [] };
    bill.textVersions = bill.textVersions || [];
    
    // Combine legislative subjects and policy area into a single items array
    const legislativeSubjects = bill.subjects.legislativeSubjects || [];
    const policyArea = bill.subjects.policyArea ? [bill.subjects.policyArea] : [];
    bill.subjects.items = [...legislativeSubjects, ...policyArea];
    bill.subjects.count = bill.subjects.items.length;

    // Find the latest summary
    if (bill.allSummaries.length > 0) {
      const sortedSummaries = [...bill.allSummaries].sort((a,b) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime());
      bill.summaries.summary = sortedSummaries[0];
    }

    // Sort various arrays by date to ensure consistent ordering
    bill.amendments.sort((a, b) => new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime());
    bill.relatedBills.sort((a, b) => {
        if (!a.latestAction?.actionDate) return 1;
        if (!b.latestAction?.actionDate) return -1;
        return new Date(b.latestAction.actionDate).getTime() - new Date(a.latestAction.actionDate).getTime()
    });
    bill.allSummaries.sort((a, b) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime());
    if (Array.isArray(bill.textVersions)) {
      bill.textVersions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    if(bill.actions) {
       bill.actions.sort((a,b) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime());
    }

    return bill;
  } catch (error) {
    console.error("Error fetching bill details:", error);
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
