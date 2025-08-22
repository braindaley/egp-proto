'use client';

import { useState, useEffect } from 'react';
import IssueCard from '@/components/IssueCard';
import { ALLOWED_SUBJECTS } from '@/lib/subjects';
import type { Bill } from '@/types';

interface BillsByIssue {
  [key: string]: Bill[];
}

export default function IssuesPage() {
  const [billsByIssue, setBillsByIssue] = useState<BillsByIssue>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBillsForAllIssues = async () => {
      console.log('Starting to fetch bills for all issues...');
      setLoading(true);
      
      // Make all requests in parallel
      const promises = ALLOWED_SUBJECTS.map(async (subject) => {
        try {
          const url = `/api/bills/search-cached?subjects=${encodeURIComponent(subject)}&limit=10&_t=${Date.now()}`;
          console.log(`Fetching bills for subject: ${subject} at URL: ${url}`);
          const response = await fetch(url, {
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          if (response.ok) {
            const data = await response.json();
            console.log(`Got ${data.bills?.length || 0} bills for ${subject}`, data);
            return { subject, bills: data.bills || [] };
          } else {
            console.error(`Failed to fetch bills for ${subject}:`, response.status, await response.text());
            return { subject, bills: [] };
          }
        } catch (error) {
          console.error(`Error fetching bills for ${subject}:`, error);
          return { subject, bills: [] };
        }
      });

      // Wait for all requests to complete
      const results = await Promise.all(promises);
      
      // Convert to object format
      const billsData: BillsByIssue = {};
      results.forEach(({ subject, bills }) => {
        billsData[subject] = bills;
      });

      console.log('All API calls completed, setting bills data:', billsData);
      setBillsByIssue(billsData);
      setLoading(false);
    };

    fetchBillsForAllIssues();
  }, []);

  if (loading) {
    return (
      <div className="w-[672px] mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Issues</h1>
          <p className="text-muted-foreground">
            Track and engage with the most important political issues
          </p>
        </div>
        <div className="text-center">Loading issues...</div>
      </div>
    );
  }

  return (
    <div className="w-[672px] mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Issues</h1>
        <p className="text-muted-foreground">
          Track and engage with the most important political issues
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {ALLOWED_SUBJECTS
          .filter((subject) => (billsByIssue[subject] || []).length > 0)
          .map((subject) => (
            <IssueCard 
              key={subject}
              issueTitle={subject}
              bills={billsByIssue[subject] || []}
            />
          ))}
      </div>
    </div>
  );
}