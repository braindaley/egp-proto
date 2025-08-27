
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ALLOWED_SUBJECTS, extractSubjectsFromApiResponse } from '@/lib/subjects';
import { mapPolicyAreaToSiteCategory } from '@/lib/policy-area-mapping';
import { Checkbox } from '@/components/ui/checkbox';
import type { Bill } from '@/types';

function convertTitleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
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

export default function BillsOverviewPage({ params }: { params: Promise<{ congress: string }> }) {
  const [congress, setCongress] = useState<string>('');
  const [billsByIssue, setBillsByIssue] = useState<Map<string, Bill[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setCongress(resolvedParams.congress);
    }
    getParams();
  }, [params]);
  
  useEffect(() => {
    if (!congress) return;
    
    async function fetchBillsByIssue() {
      setLoading(true);
      const issuesMap = new Map<string, Bill[]>();
      
      try {
        await Promise.all(
          ALLOWED_SUBJECTS.map(async (subject) => {
            try {
              const url = `/api/bills/search-cached?subjects=${encodeURIComponent(subject)}&limit=20&_t=${Date.now()}`;
              const response = await fetch(url, {
                cache: 'no-cache',
                headers: {
                  'Cache-Control': 'no-cache'
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                const bills = (data.bills || []).sort((a: Bill, b: Bill) => {
                  const dateA = new Date(a.latestAction.actionDate);
                  const dateB = new Date(b.latestAction.actionDate);
                  return dateB.getTime() - dateA.getTime();
                });
                
                if (bills.length > 0) {
                  issuesMap.set(subject, bills);
                }
              } else {
                console.error(`Failed to fetch bills for ${subject}:`, response.status);
              }
            } catch (error) {
              console.error(`Error fetching bills for ${subject}:`, error);
            }
          })
        );
        
        setBillsByIssue(issuesMap);
      } catch (error) {
        console.error('Error fetching bills:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBillsByIssue();
  }, [congress]);

  // Filter and sort issue groups
  const filteredIssueGroups = selectedFilters.size === 0 
    ? Array.from(billsByIssue.entries())
    : Array.from(billsByIssue.entries()).filter(([issue]) => selectedFilters.has(issue));

  // Sort issue groups alphabetically
  const sortedIssueGroups = filteredIssueGroups
    .map(([issue, bills]) => ({ issue, bills }))
    .sort((a, b) => a.issue.localeCompare(b.issue));

  // Features removed - Popular Bills now in sidebar, Recent Bills page removed

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
              <header className="text-center mb-12">
                <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
                  Bills in the {congress}th Congress
                </h1>
                <p className="text-lg text-muted-foreground">
                  Explore legislation from the selected session.
                </p>
              </header>
        
              {/* Bills filtering and display section */}
              <div className="mt-16">
                {loading ? (
                  <div className="text-center py-12">Loading bills...</div>
                ) : (
                  <>
                    {/* Policy Issue Filter */}
                    <div className="mb-8">
                      <div className="space-y-4">
                        <label className="text-sm font-medium">
                          Filter by policy issue:
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {ALLOWED_SUBJECTS.map((subject) => (
                            <div key={subject} className="flex items-center space-x-2">
                              <Checkbox
                                id={`filter-${subject}`}
                                checked={selectedFilters.has(subject)}
                                onCheckedChange={(checked) => {
                                  const newFilters = new Set(selectedFilters);
                                  if (checked) {
                                    newFilters.add(subject);
                                  } else {
                                    newFilters.delete(subject);
                                  }
                                  setSelectedFilters(newFilters);
                                }}
                              />
                              <label
                                htmlFor={`filter-${subject}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {subject}
                              </label>
                            </div>
                          ))}
                        </div>
                        
                        {/* Show active filters */}
                        {selectedFilters.size > 0 && (
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              Showing bills for: 
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(selectedFilters).map(filter => (
                                <span key={filter} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                                  {filter}
                                </span>
                              ))}
                            </div>
                            <button
                              onClick={() => setSelectedFilters(new Set())}
                              className="text-xs text-muted-foreground hover:text-foreground underline ml-2"
                            >
                              Clear all
                            </button>
                            {sortedIssueGroups.length === 0 && (
                              <span className="text-sm text-muted-foreground ml-2">(No bills found)</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-12">
                      {sortedIssueGroups.map(({ issue, bills }) => (
                        <div key={issue} className="space-y-6">
                          <div className="flex items-center gap-4">
                            <h3 className="text-2xl font-semibold text-primary">
                              {issue}
                            </h3>
                          </div>
                          
                          <div className="bg-card rounded-lg border">
                            <div className="p-4 border-b">
                              <h4 className="text-lg font-semibold">
                                {bills.length} Bill{bills.length !== 1 ? 's' : ''}
                              </h4>
                            </div>
                            <div className="divide-y divide-gray-200">
                              {bills.map((bill) => (
                                <BillRow key={`${bill.type}-${bill.number}`} bill={bill} />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {sortedIssueGroups.length === 0 && selectedFilters.size === 0 && (
                        <p className="text-center text-muted-foreground py-12">
                          No bills available at this time
                        </p>
                      )}
                      
                      {sortedIssueGroups.length === 0 && selectedFilters.size > 0 && (
                        <p className="text-center text-muted-foreground py-12">
                          No bills found for the selected policy issues
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
      </div>
      <footer className="text-center py-6 text-sm text-muted-foreground">
        <p>Data provided by the <a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">U.S. Congress</a> via <a href="https://api.congress.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">api.congress.gov</a>.</p>
      </footer>
    </div>
  );
}
