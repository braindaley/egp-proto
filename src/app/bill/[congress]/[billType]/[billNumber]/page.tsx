
import { notFound } from 'next/navigation';
import type { Bill } from '@/types';
import { BillDetailClient } from '@/components/bill-detail-client';

async function getBillDetails(congress: string, billType: string, billNumber: string): Promise<Bill | null> {
  console.log('=== STARTING getBillDetails ===');
  
  const API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
  const baseUrl = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}`;

  try {
    // Step 1: Get basic bill info with just sponsors
    console.log('Fetching basic bill data...');
    const basicUrl = `${baseUrl}?embed=sponsors&api_key=${API_KEY}`;
    
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

    // Step 2: Use the API-provided URLs to get additional data
    console.log('Fetching additional data using API URLs...');
    
    // Get summaries using the provided URL
    if (bill.summaries?.url) {
      try {
        console.log('Fetching summaries from:', bill.summaries.url);
        const summariesRes = await fetch(`${bill.summaries.url}&api_key=${API_KEY}`, {
          signal: AbortSignal.timeout(10000)
        });
        
        if (summariesRes.ok) {
          const summariesData = await summariesRes.json();
          if (summariesData.summaries?.length > 0) {
            bill.summaries.items = summariesData.summaries;
            bill.allSummaries = summariesData.summaries;
            
            // Find the latest summary
            const sortedSummaries = [...bill.allSummaries].sort((a,b) => 
              new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime());
            bill.summaries.summary = sortedSummaries[0];
            
            console.log(`Got ${bill.allSummaries.length} summaries`);
          }
        }
      } catch (error) {
        console.log('Summaries fetch failed:', error.message);
      }
    }

    // Get actions using the provided URL
    if (bill.actions?.url) {
      try {
        console.log('Fetching actions from:', bill.actions.url);
        const actionsRes = await fetch(`${bill.actions.url}&api_key=${API_KEY}`, {
          signal: AbortSignal.timeout(10000)
        });
        
        if (actionsRes.ok) {
          const actionsData = await actionsRes.json();
          if (actionsData.actions?.length > 0) {
            bill.actions.items = actionsData.actions;
            console.log(`Got ${bill.actions.items.length} actions`);
          }
        }
      } catch (error) {
        console.log('Actions fetch failed:', error.message);
      }
    }

    // Get committees using the provided URL
    if (bill.committees?.url) {
      try {
        console.log('Fetching committees from:', bill.committees.url);
        const committeesRes = await fetch(`${bill.committees.url}&api_key=${API_KEY}`, {
          signal: AbortSignal.timeout(10000)
        });
        
        if (committeesRes.ok) {
          const committeesData = await committeesRes.json();
          if (committeesData.committees?.length > 0) {
            bill.committees.items = committeesData.committees;
            console.log(`Got ${bill.committees.items.length} committees`);
          }
        }
      } catch (error) {
        console.log('Committees fetch failed:', error.message);
      }
    }

    // Get subjects using the provided URL
    if (bill.subjects?.url) {
      try {
        console.log('Fetching subjects from:', bill.subjects.url);
        const subjectsRes = await fetch(`${bill.subjects.url}&api_key=${API_KEY}`, {
          signal: AbortSignal.timeout(10000)
        });
        
        if (subjectsRes.ok) {
          const subjectsData = await subjectsRes.json();
          if (subjectsData.subjects?.legislativeSubjects?.length > 0 || subjectsData.subjects?.policyArea) {
            const legislativeSubjects = subjectsData.subjects.legislativeSubjects || [];
            const policyArea = subjectsData.subjects.policyArea ? [subjectsData.subjects.policyArea] : [];
            bill.subjects.items = [...legislativeSubjects, ...policyArea];
            console.log(`Got ${bill.subjects.items.length} subjects`);
          }
        }
      } catch (error) {
        console.log('Subjects fetch failed:', error.message);
      }
    }

    // Initialize any missing data structures
    bill.cosponsors = bill.cosponsors || { count: 0, url: '', items: [] };
    bill.committees = bill.committees || { count: 0, items: [] };
    bill.actions = bill.actions || { count: 0, items: [] };
    bill.amendments = bill.amendments || { count: 0, items: [] };
    bill.relatedBills = bill.relatedBills || { count: 0, items: [] };
    bill.subjects = bill.subjects || { count: 0, items: [] };
    bill.textVersions = bill.textVersions || { count: 0, items: [] };
    bill.summaries = bill.summaries || { count: 0, items: [] };
    bill.allSummaries = bill.allSummaries || [];

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
