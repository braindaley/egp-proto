'use client';

import { use, useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SITE_ISSUE_CATEGORIES } from '@/lib/policy-area-mapping';
import type { Bill } from '@/types';

function convertTitleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function convertSlugToTitle(slug: string): string {
  const categoryMap = SITE_ISSUE_CATEGORIES.reduce((acc, category) => {
    acc[convertTitleToSlug(category)] = category;
    return acc;
  }, {} as Record<string, string>);
  
  return categoryMap[slug] || null;
}

interface BillRowProps {
  bill: Bill;
}

function BillRow({ bill }: BillRowProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <Link href={`/bill/${bill.congress}/${bill.type.toLowerCase()}/${bill.number}`} className="block">
      <div className="box-border content-stretch flex flex-col items-start justify-center px-4 py-3 relative size-full hover:bg-gray-50 transition-colors border-b border-gray-200">
        <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full mb-2">
          <div className="box-border content-stretch flex gap-2.5 items-center justify-center px-2.5 py-0.5 relative rounded-xl shrink-0 bg-primary/10">
            <div className="font-medium leading-[0] not-italic relative shrink-0 text-primary text-[12px] text-nowrap">
              <p className="leading-[20px] whitespace-pre">{bill.type} {bill.number}</p>
            </div>
          </div>
          <div className="basis-0 font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-foreground text-[16px]">
            <p className="leading-[24px] font-medium">{bill.title}</p>
          </div>
        </div>
        <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full">
          <div className="basis-0 font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-muted-foreground text-[14px]">
            <p className="leading-[20px]">
              <span className="font-medium">Latest Action:</span>
              <span> {formatDate(bill.latestAction.actionDate)} - {bill.latestAction.text.substring(0, 100)}...</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function FederalPolicyPage({ params }: { params: Promise<{ policy: string }> }) {
  const resolvedParams = use(params);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  
  const policyTitle = convertSlugToTitle(resolvedParams.policy);
  
  useEffect(() => {
    if (!policyTitle) return;
    
    const fetchBillsForIssue = async () => {
      setLoading(true);
      
      try {
        const url = `/api/bills/search-cached?subjects=${encodeURIComponent(policyTitle)}&limit=50&_t=${Date.now()}`;
        const response = await fetch(url, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const sortedBills = (data.bills || []).sort((a: Bill, b: Bill) => {
            const dateA = new Date(a.latestAction.actionDate);
            const dateB = new Date(b.latestAction.actionDate);
            return dateB.getTime() - dateA.getTime();
          });
          setBills(sortedBills);
        } else {
          console.error(`Failed to fetch bills for ${policyTitle}:`, response.status, await response.text());
          setBills([]);
        }
      } catch (error) {
        console.error(`Error fetching bills for ${policyTitle}:`, error);
        setBills([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBillsForIssue();
  }, [policyTitle]);
  
  if (!policyTitle) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link href="/campaigns" className="hover:text-primary">Campaigns</Link> / 
            <Link href="/campaigns/issues" className="hover:text-primary ml-1">Issues</Link> / 
            <Link href={`/issues/${resolvedParams.policy}`} className="hover:text-primary ml-1">{policyTitle}</Link> /
            <span className="ml-1">Federal</span>
          </nav>
          
          <h1 className="text-3xl font-bold mb-2 font-headline text-primary">
            Federal {policyTitle} Legislation
          </h1>
          <p className="text-muted-foreground">
            Browse federal bills and legislation related to {policyTitle.toLowerCase()} policy
          </p>
        </div>


        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading bills...</p>
          </div>
        ) : bills.length > 0 ? (
          <div className="bg-card rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="text-xl font-semibold">
                {bills.length} Bill{bills.length !== 1 ? 's' : ''}
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {bills.map((bill) => (
                <BillRow key={`${bill.type}-${bill.number}`} bill={bill} />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-lg border p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">No Bills Found</h3>
            <p className="text-muted-foreground">
              No federal legislation found for {policyTitle.toLowerCase()} at this time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}