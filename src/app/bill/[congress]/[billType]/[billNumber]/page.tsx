
import { notFound } from 'next/navigation';
import type { Bill } from '@/types';
import { BillDetailClient } from '@/components/bill-detail-client';

async function getBillDetails(congress: string, billType: string, billNumber: string): Promise<Bill | null> {
  console.log('=== STARTING getBillDetails ===');
  
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  const baseUrl = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}`;

  try {
    // Step 1: Get basic bill info with just essential embeds
    console.log('Fetching basic bill data...');
    const basicEmbeds = ['sponsors', 'summaries'].map(p => `embed=${p}`).join('&');
    const basicUrl = `${baseUrl}?${basicEmbeds}&api_key=${API_KEY}`;
    
    const basicRes = await fetch(basicUrl, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(15000)
    });

    if (!basicRes.ok) {
      console.error(`Basic API request failed: ${basicRes.status}`);
      return null;
    }

    const basicData = await basicRes.json();
    const bill: Bill = basicData.bill;
    
    // Initialize basic structure
    bill.sponsors = bill.sponsors || [];
    bill.summaries = bill.summaries || { count: 0, items: [] };
    bill.allSummaries = bill.summaries.items || [];

    // Step 2: Get additional data if the basic embeds worked
    console.log('Fetching additional data...');
    
    try {
      // Try to get actions separately
      const actionsUrl = `${baseUrl}?embed=actions&api_key=${API_KEY}`;
      const actionsRes = await fetch(actionsUrl, {
        signal: AbortSignal.timeout(10000)
      });
      
      if (actionsRes.ok) {
        const actionsData = await actionsRes.json();
        if (actionsData.bill.actions?.items?.length > 0) {
          bill.actions = actionsData.bill.actions;
          console.log(`Got ${bill.actions.items.length} actions`);
        }
      }
    } catch (error) {
      console.log('Actions fetch failed, continuing...');
    }

    try {
      // Try to get committees separately  
      const committeesUrl = `${baseUrl}?embed=committees&api_key=${API_KEY}`;
      const committeesRes = await fetch(committeesUrl, {
        signal: AbortSignal.timeout(10000)
      });
      
      if (committeesRes.ok) {
        const committeesData = await committeesRes.json();
        if (committeesData.bill.committees?.items?.length > 0) {
          bill.committees = committeesData.bill.committees;
          console.log(`Got ${bill.committees.items.length} committees`);
        }
      }
    } catch (error) {
      console.log('Committees fetch failed, continuing...');
    }

    try {
      // Try to get subjects separately
      const subjectsUrl = `${baseUrl}?embed=subjects&api_key=${API_KEY}`;
      const subjectsRes = await fetch(subjectsUrl, {
        signal: AbortSignal.timeout(10000)
      });
      
      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        if (subjectsData.bill.subjects) {
          bill.subjects = subjectsData.bill.subjects;
          
          // Process subjects structure
          if (!bill.subjects.items) {
            const legislativeSubjects = bill.subjects.legislativeSubjects || [];
            const policyArea = bill.subjects.policyArea ? [bill.subjects.policyArea] : [];
            bill.subjects.items = [...legislativeSubjects, ...policyArea];
          }
          console.log(`Got ${bill.subjects.items?.length || 0} subjects`);
        }
      }
    } catch (error) {
      console.log('Subjects fetch failed, continuing...');
    }

    // Initialize any missing data structures
    bill.cosponsors = bill.cosponsors || { count: 0, url: '', items: [] };
    bill.committees = bill.committees || { count: 0, items: [] };
    bill.actions = bill.actions || { count: 0, items: [] };
    bill.amendments = bill.amendments || { count: 0, items: [] };
    bill.relatedBills = bill.relatedBills || { count: 0, items: [] };
    bill.subjects = bill.subjects || { count: 0, items: [] };
    bill.textVersions = bill.textVersions || { count: 0, items: [] };

    // Find the latest summary
    if (bill.allSummaries.length > 0) {
      const sortedSummaries = [...bill.allSummaries].sort((a,b) => 
        new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime());
      bill.summaries.summary = sortedSummaries[0];
    }

    console.log('Final bill data processed');
    return bill;
    
  } catch (error) {
    console.error("=== ERROR IN getBillDetails ===");
    console.error('Error:', error);
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
