'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ALLOWED_SUBJECTS } from '@/lib/subjects';
import { processLegiscanBillSubjects } from '@/lib/legiscan-subjects';
import { Checkbox } from '@/components/ui/checkbox';
import { usePremiumAccess } from '@/hooks/use-premium-access';
import { PremiumUpgradeCTA } from '@/components/premium-upgrade-cta';

const states: Record<string, string> = {
  al: 'Alabama', ak: 'Alaska', az: 'Arizona', ar: 'Arkansas', ca: 'California',
  co: 'Colorado', ct: 'Connecticut', de: 'Delaware', fl: 'Florida', ga: 'Georgia',
  hi: 'Hawaii', id: 'Idaho', il: 'Illinois', in: 'Indiana', ia: 'Iowa',
  ks: 'Kansas', ky: 'Kentucky', la: 'Louisiana', me: 'Maine', md: 'Maryland',
  ma: 'Massachusetts', mi: 'Michigan', mn: 'Minnesota', ms: 'Mississippi', mo: 'Missouri',
  mt: 'Montana', ne: 'Nebraska', nv: 'Nevada', nh: 'New Hampshire', nj: 'New Jersey',
  nm: 'New Mexico', ny: 'New York', nc: 'North Carolina', nd: 'North Dakota', oh: 'Ohio',
  ok: 'Oklahoma', or: 'Oregon', pa: 'Pennsylvania', ri: 'Rhode Island', sc: 'South Carolina',
  sd: 'South Dakota', tn: 'Tennessee', tx: 'Texas', ut: 'Utah', vt: 'Vermont',
  va: 'Virginia', wa: 'Washington', wv: 'West Virginia', wi: 'Wisconsin', wy: 'Wyoming'
};

interface StateBill {
  bill_id: number;
  number: string;
  title: string;
  description?: string;
  status: number;
  status_date?: string;
  last_action?: string;
  last_action_date?: string;
  url?: string;
  subjects?: any[];
}

interface BillRowProps {
  bill: StateBill;
  stateParam: string;
  sessionId: string;
}

function BillRow({ bill, stateParam, sessionId }: BillRowProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusText = (status: number) => {
    const statusMap: { [key: number]: string } = {
      1: 'Introduced', 2: 'Engrossed', 3: 'Enrolled',
      4: 'Passed', 5: 'Vetoed', 6: 'Failed'
    };
    return statusMap[status] || 'Unknown';
  };

  return (
    <Link href={`/state/${stateParam}/${sessionId}/bill/${encodeURIComponent(bill.number)}`} className="block">
      <div className="box-border content-stretch flex flex-col items-start justify-center px-4 py-3 relative size-full hover:bg-gray-50 transition-colors border-b border-gray-200">
        <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full mb-2">
          <div className="box-border content-stretch flex gap-2.5 items-center justify-center px-2.5 py-0.5 relative rounded-xl shrink-0 bg-primary/10">
            <div className="font-medium leading-[0] not-italic relative shrink-0 text-primary text-[12px] text-nowrap">
              <p className="leading-[20px] whitespace-pre">{bill.number}</p>
            </div>
          </div>
          <div className="basis-0 font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-foreground text-[16px]">
            <p className="leading-[24px] font-medium">{bill.title || 'Untitled Bill'}</p>
          </div>
        </div>
        <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full">
          <div className="basis-0 font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-muted-foreground text-[14px]">
            <p className="leading-[20px]">
              <span className="font-medium">Status:</span>
              <span> {getStatusText(bill.status)}</span>
              {bill.last_action_date && (
                <span> • {formatDate(bill.last_action_date)}</span>
              )}
              {bill.last_action && (
                <span> - {bill.last_action.substring(0, 80)}{bill.last_action.length > 80 ? '...' : ''}</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function StateBillsPage({ params }: { params: Promise<{ state: string; sessionId: string }> }) {
  const { state: stateParam, sessionId } = use(params);
  const stateCode = stateParam?.toUpperCase();
  const stateName = states[stateParam?.toLowerCase()] || stateCode;

  const { isPremium, isLoading: premiumLoading } = usePremiumAccess();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [billsByIssue, setBillsByIssue] = useState<Map<string, StateBill[]>>(new Map());
  const [allBills, setAllBills] = useState<StateBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());

  // Fetch session info and bills
  useEffect(() => {
    async function fetchData() {
      if (!stateCode || !sessionId) return;

      setLoading(true);
      try {
        // Fetch session info
        const sessionsResponse = await fetch(`/api/legiscan?action=sessions&state=${stateCode}`);
        const sessionsData = await sessionsResponse.json();
        if (sessionsData.status === 'success' && sessionsData.data?.sessions) {
          const session = sessionsData.data.sessions.find((s: any) => s.session_id.toString() === sessionId);
          if (session) {
            setSessionInfo(session);
          }
        }

        // Fetch bills
        const billsResponse = await fetch(`/api/legiscan?action=masterlist&sessionId=${sessionId}`);
        const billsData = await billsResponse.json();

        if (billsData.status === 'success' && billsData.data?.masterlist) {
          const billsArray = Object.entries(billsData.data.masterlist)
            .filter(([key, value]: [string, any]) => key !== 'session' && value.bill_id)
            .map(([_, bill]) => bill as StateBill);

          setAllBills(billsArray);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [stateCode, sessionId]);

  // Process bills when filters change
  useEffect(() => {
    if (allBills.length === 0) return;

    const issuesMap = new Map<string, StateBill[]>();

    if (selectedFilters.size === 0) {
      // No filters - show recent bills
      const recentBills = [...allBills]
        .sort((a, b) => {
          const dateA = new Date(a.last_action_date || a.status_date || 0);
          const dateB = new Date(b.last_action_date || b.status_date || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 25);
      issuesMap.set('Recent Bills', recentBills);
    } else {
      // Filter by selected categories
      for (const bill of allBills) {
        const { allCategories } = processLegiscanBillSubjects(bill);

        for (const category of allCategories) {
          if (selectedFilters.has(category)) {
            if (!issuesMap.has(category)) {
              issuesMap.set(category, []);
            }
            issuesMap.get(category)!.push(bill);
          }
        }
      }

      // Sort bills within each category by date
      for (const [category, bills] of issuesMap) {
        bills.sort((a, b) => {
          const dateA = new Date(a.last_action_date || a.status_date || 0);
          const dateB = new Date(b.last_action_date || b.status_date || 0);
          return dateB.getTime() - dateA.getTime();
        });
        // Limit to 25 per category
        issuesMap.set(category, bills.slice(0, 25));
      }
    }

    setBillsByIssue(issuesMap);
  }, [allBills, selectedFilters]);

  // Show premium upgrade CTA for non-premium users
  if (!premiumLoading && !isPremium) {
    return (
      <PremiumUpgradeCTA
        variant="full-page"
        title="State Bills"
        description={`Access ${stateName} legislation and bill tracking with a premium membership.`}
      />
    );
  }

  const sessionName = sessionInfo?.session_name || sessionInfo?.name || `Session ${sessionId}`;

  // Filter and sort issue groups
  const sortedIssueGroups = Array.from(billsByIssue.entries())
    .map(([issue, bills]) => ({ issue, bills }))
    .sort((a, b) => a.issue.localeCompare(b.issue));

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
            Bills in {stateName}
          </h1>
          <p className="text-lg text-muted-foreground">
            {sessionName}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                          <BillRow
                            key={bill.bill_id}
                            bill={bill}
                            stateParam={stateParam}
                            sessionId={sessionId}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {sortedIssueGroups.length === 0 && selectedFilters.size === 0 && (
                  <p className="text-center text-muted-foreground py-12">
                    No bills available for this session
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
        <p>Data provided by <a href="https://legiscan.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">LegiScan</a>.</p>
      </footer>
    </div>
  );
}
