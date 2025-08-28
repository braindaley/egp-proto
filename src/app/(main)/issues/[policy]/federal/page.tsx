'use client';

import { use, useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SITE_ISSUE_CATEGORIES, getUserInterestForCategory } from '@/lib/policy-area-mapping';
import { useAuth } from '@/hooks/use-auth';
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
    <Link href={`/federal/bill/${bill.congress}/${bill.type.toLowerCase()}/${bill.number}`} className="block">
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
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  
  const policyTitle = convertSlugToTitle(resolvedParams.policy);
  
  useEffect(() => {
    if (!policyTitle) return;
    
    const fetchBillsForIssue = async () => {
      setLoading(true);
      
      try {
        // Temporary mapping for old cached categories until cache is refreshed
        const categoryMapping: Record<string, string> = {
          'Climate, Energy & Environment': 'Science',
          'Criminal Justice': 'Politics & Policy', 
          'Defense & National Security': 'Politics & Policy',
          'Discrimination & Prejudice': 'Race & Ethnicity',
          'Economy & Work': 'Economy & Work',
          'Education': 'Age & Generations',
          'Health Policy': 'Age & Generations',
          'Immigration & Migration': 'Immigration & Migration',
          'International Affairs': 'International Affairs',
          'National Conditions': 'Politics & Policy',
          'Religion & Government': 'Religion',
          'Technology': 'Science'
        };
        
        const searchSubject = categoryMapping[policyTitle] || policyTitle;
        const url = `/api/bills/search-cached?subjects=${encodeURIComponent(searchSubject)}&limit=50&_t=${Date.now()}`;
        const response = await fetch(url, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Get user's interest level for this policy area
          const userInterestLevel = getUserInterestForCategory(user?.policyInterests, policyTitle);
          const isHighInterest = userInterestLevel >= 3; // Medium or High interest
          
          // Sort bills with user interest consideration
          const sortedBills = (data.bills || []).sort((a: Bill, b: Bill) => {
            // Primary sort: User interest level (if user has high interest, prioritize more recent activity)
            if (isHighInterest && user) {
              // For high-interest areas, prioritize bills with more recent activity
              const dateA = new Date(a.latestAction.actionDate);
              const dateB = new Date(b.latestAction.actionDate);
              const daysDiffA = (Date.now() - dateA.getTime()) / (1000 * 60 * 60 * 24);
              const daysDiffB = (Date.now() - dateB.getTime()) / (1000 * 60 * 60 * 24);
              
              // Boost score for bills with activity in last 7 days
              const scoreA = daysDiffA <= 7 ? 1000 : 0;
              const scoreB = daysDiffB <= 7 ? 1000 : 0;
              
              if (scoreA !== scoreB) {
                return scoreB - scoreA;
              }
            }
            
            // Secondary sort: By date (most recent first)
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
    <div className="bg-secondary/30 flex-1">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link href="/issues" className="hover:text-primary">Issues</Link> / 
            <Link href={`/issues/${resolvedParams.policy}`} className="hover:text-primary ml-1">{policyTitle}</Link> /
            <span className="ml-1">Federal</span>
          </nav>
          
          <h1 className="text-3xl font-bold mb-2 font-headline text-primary">
            Federal {policyTitle} Legislation
          </h1>
          <p className="text-muted-foreground">
            Browse federal bills and legislation related to {policyTitle.toLowerCase()} policy
            {user && getUserInterestForCategory(user?.policyInterests, policyTitle) >= 3 && (
              <span className="ml-2 text-blue-600 text-sm">• Personalized for your high interest</span>
            )}
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