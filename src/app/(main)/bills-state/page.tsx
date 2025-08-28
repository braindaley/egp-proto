'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText } from 'lucide-react';
import { LEGISCAN_STATE_IDS } from '@/lib/legiscan-connector';

const states = [
  { name: 'Alabama', abbr: 'AL' }, { name: 'Alaska', abbr: 'AK' },
  { name: 'Arizona', abbr: 'AZ' }, { name: 'Arkansas', abbr: 'AR' },
  { name: 'California', abbr: 'CA' }, { name: 'Colorado', abbr: 'CO' },
  { name: 'Connecticut', abbr: 'CT' }, { name: 'Delaware', abbr: 'DE' },
  { name: 'Florida', abbr: 'FL' }, { name: 'Georgia', abbr: 'GA' },
  { name: 'Hawaii', abbr: 'HI' }, { name: 'Idaho', abbr: 'ID' },
  { name: 'Illinois', abbr: 'IL' }, { name: 'Indiana', abbr: 'IN' },
  { name: 'Iowa', abbr: 'IA' }, { name: 'Kansas', abbr: 'KS' },
  { name: 'Kentucky', abbr: 'KY' }, { name: 'Louisiana', abbr: 'LA' },
  { name: 'Maine', abbr: 'ME' }, { name: 'Maryland', abbr: 'MD' },
  { name: 'Massachusetts', abbr: 'MA' }, { name: 'Michigan', abbr: 'MI' },
  { name: 'Minnesota', abbr: 'MN' }, { name: 'Mississippi', abbr: 'MS' },
  { name: 'Missouri', abbr: 'MO' }, { name: 'Montana', abbr: 'MT' },
  { name: 'Nebraska', abbr: 'NE' }, { name: 'Nevada', abbr: 'NV' },
  { name: 'New Hampshire', abbr: 'NH' }, { name: 'New Jersey', abbr: 'NJ' },
  { name: 'New Mexico', abbr: 'NM' }, { name: 'New York', abbr: 'NY' },
  { name: 'North Carolina', abbr: 'NC' }, { name: 'North Dakota', abbr: 'ND' },
  { name: 'Ohio', abbr: 'OH' }, { name: 'Oklahoma', abbr: 'OK' },
  { name: 'Oregon', abbr: 'OR' }, { name: 'Pennsylvania', abbr: 'PA' },
  { name: 'Rhode Island', abbr: 'RI' }, { name: 'South Carolina', abbr: 'SC' },
  { name: 'South Dakota', abbr: 'SD' }, { name: 'Tennessee', abbr: 'TN' },
  { name: 'Texas', abbr: 'TX' }, { name: 'Utah', abbr: 'UT' },
  { name: 'Vermont', abbr: 'VT' }, { name: 'Virginia', abbr: 'VA' },
  { name: 'Washington', abbr: 'WA' }, { name: 'West Virginia', abbr: 'WV' },
  { name: 'Wisconsin', abbr: 'WI' }, { name: 'Wyoming', abbr: 'WY' }
];

const POLICY_ISSUES = [
  'Healthcare', 'Education', 'Transportation', 'Environment',
  'Criminal Justice', 'Economic Development', 'Tax Policy',
  'Labor', 'Housing', 'Agriculture', 'Energy', 'Immigration'
];

interface LegiscanBill {
  bill_id: number;
  bill_number: string;
  title: string;
  description: string;
  state: string;
  status: number;
  status_date: string;
  url: string;
  state_link?: string;
  change_hash?: string;
  last_action?: string;
  last_action_date?: string;
  session?: {
    session_id: number;
    year_start: number;
    year_end: number;
    name: string;
  };
}

interface BillCardProps {
  bill: LegiscanBill;
}

function BillCard({ bill }: BillCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusText = (status: number) => {
    const statusMap: { [key: number]: string } = {
      1: 'Introduced',
      2: 'Engrossed',
      3: 'Enrolled',
      4: 'Passed',
      5: 'Vetoed',
      6: 'Failed'
    };
    return statusMap[status] || 'Unknown';
  };

  const getStatusVariant = (status: number) => {
    const variantMap: { [key: number]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      1: 'outline',      // Introduced - neutral
      2: 'secondary',    // Engrossed - in progress
      3: 'secondary',    // Enrolled - in progress
      4: 'default',      // Passed - success (using default which is usually green/blue)
      5: 'destructive',  // Vetoed - failed
      6: 'destructive'   // Failed - failed
    };
    return variantMap[status] || 'outline';
  };

  return (
    <Link href={`/legiscan-bill/${bill.bill_id}`} className="block">
      <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3">
            {/* Bill Number, State, and Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-mono">
                {bill.bill_number}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {bill.state}
              </Badge>
              <Badge variant={getStatusVariant(bill.status)} className="text-xs">
                {getStatusText(bill.status)}
              </Badge>
            </div>
            
            {/* Bill Title */}
            <CardTitle className="text-lg font-semibold leading-tight hover:text-primary transition-colors">
              {bill.title}
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Bill Description */}
          {bill.description && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {bill.description.length > 200 
                ? `${bill.description.substring(0, 200)}...`
                : bill.description
              }
            </p>
          )}
          
          {/* Bill Metadata */}
          <div className="flex flex-col gap-2 text-xs text-muted-foreground border-t pt-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Last Updated: {formatDate(bill.status_date)}</span>
            </div>
            
            {bill.session && (
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>Session: {bill.session.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function StateBillsPage() {
  const [billsByState, setBillsByState] = useState<Map<string, LegiscanBill[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchRecentBills() {
      setLoading(true);
      setError(null);
      const statesMap = new Map<string, LegiscanBill[]>();
      
      try {
        // Fetch recent bills for selected states (not all states to avoid rate limits)
        const priorityStates = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'MI']; // Focus on major states
        
        // Use sequential requests to avoid overwhelming the API
        for (const stateCode of priorityStates) {
          try {
            const url = `/api/legiscan?action=recent&state=${stateCode}`;
            const response = await fetch(url, {
              cache: 'no-cache',
              headers: {
                'Cache-Control': 'no-cache'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.status === 'OK' && data.bills) {
                // Transform Legiscan masterlist data structure
                const billsArray = Object.values(data.bills) as any[];
                const transformedBills: LegiscanBill[] = billsArray
                  .filter(bill => bill && bill.bill_id)
                  .slice(0, 6) // Limit to 6 bills per state for performance
                  .map(bill => ({
                    bill_id: bill.bill_id,
                    bill_number: bill.bill_number || `${stateCode} ${bill.bill_id}`,
                    title: bill.title || 'Untitled Bill',
                    description: bill.description || bill.title || 'No description available',
                    state: stateCode,
                    status: bill.status || 1,
                    status_date: bill.status_date || new Date().toISOString(),
                    url: bill.url || '',
                    state_link: bill.state_link,
                    change_hash: bill.change_hash,
                    last_action: bill.last_action,
                    last_action_date: bill.last_action_date
                  }));
                
                if (transformedBills.length > 0) {
                  statesMap.set(stateCode, transformedBills);
                }
              }
            }
          } catch (error) {
            // Skip individual state errors
            console.error(`Error fetching bills for ${stateCode}:`, error);
          }
          
          // Add small delay between requests to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // No mock data fallback - show only real API data
        if (statesMap.size === 0) {
          setError('No recent bills found. This may be due to API rate limits or connectivity issues.');
        }
        
        setBillsByState(statesMap);
      } catch (error) {
        console.error('Error fetching bills:', error);
        setError('Failed to load state legislation data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchRecentBills();
  }, []);

  // Filter bills based on selected states and issues
  const filteredStateGroups = selectedStates.size === 0 
    ? Array.from(billsByState.entries())
    : Array.from(billsByState.entries()).filter(([stateCode]) => selectedStates.has(stateCode));

  // Sort state groups alphabetically
  const sortedStateGroups = filteredStateGroups
    .map(([stateCode, bills]) => {
      const stateName = states.find(s => s.abbr === stateCode)?.name || stateCode;
      return { stateCode, stateName, bills };
    })
    .sort((a, b) => a.stateName.localeCompare(b.stateName));

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
            State Legislation
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore recent bills and legislation from state governments across the United States.
          </p>
        </header>
        
        {/* Bills filtering and display section */}
        <div className="mt-16">
          {loading ? (
            <div className="text-center py-12">Loading state legislation...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : (
            <>
              {/* State Filter */}
              <div className="mb-8">
                <div className="space-y-4">
                  <label className="text-sm font-medium">
                    Filter by state:
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {states.filter(state => billsByState.has(state.abbr)).map((state) => (
                      <div key={state.abbr} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-${state.abbr}`}
                          checked={selectedStates.has(state.abbr)}
                          onCheckedChange={(checked) => {
                            const newFilters = new Set(selectedStates);
                            if (checked) {
                              newFilters.add(state.abbr);
                            } else {
                              newFilters.delete(state.abbr);
                            }
                            setSelectedStates(newFilters);
                          }}
                        />
                        <label
                          htmlFor={`filter-${state.abbr}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {state.name} ({state.abbr})
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  {/* Show active filters */}
                  {selectedStates.size > 0 && (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        Showing bills for: 
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(selectedStates).map(stateCode => {
                          const stateName = states.find(s => s.abbr === stateCode)?.name || stateCode;
                          return (
                            <span key={stateCode} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                              {stateName}
                            </span>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setSelectedStates(new Set())}
                        className="text-xs text-muted-foreground hover:text-foreground underline ml-2"
                      >
                        Clear all
                      </button>
                      {sortedStateGroups.length === 0 && (
                        <span className="text-sm text-muted-foreground ml-2">(No bills found)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-12">
                {sortedStateGroups.map(({ stateCode, stateName, bills }) => (
                  <div key={stateCode} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <h3 className="text-2xl font-semibold text-primary">
                        {stateName}
                      </h3>
                      <Link href={`/states/${stateCode.toLowerCase()}`}>
                        <Button variant="outline" size="sm">
                          View All {stateName} Bills →
                        </Button>
                      </Link>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="mb-4">
                        <h4 className="text-lg font-semibold">
                          {bills.length} Recent Bill{bills.length !== 1 ? 's' : ''}
                        </h4>
                      </div>
                      <div className="space-y-4">
                        {bills.map((bill) => (
                          <BillCard key={`${bill.state}-${bill.bill_id}`} bill={bill} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                
                {sortedStateGroups.length === 0 && selectedStates.size === 0 && (
                  <p className="text-center text-muted-foreground py-12">
                    No state legislation available at this time
                  </p>
                )}
                
                {sortedStateGroups.length === 0 && selectedStates.size > 0 && (
                  <p className="text-center text-muted-foreground py-12">
                    No bills found for the selected states
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <footer className="text-center py-6 text-sm text-muted-foreground">
        <p>State legislation data provided by <a href="https://legiscan.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">LegiScan</a>.</p>
      </footer>
    </div>
  );
}