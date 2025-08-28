'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, FileText, Users } from 'lucide-react';
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

const STATUS_FILTERS = [
  { value: '1', label: 'Introduced' },
  { value: '2', label: 'Engrossed' },
  { value: '3', label: 'Enrolled' },
  { value: '4', label: 'Passed' },
  { value: '5', label: 'Vetoed' },
  { value: '6', label: 'Failed' }
];

function getStatusColor(status: number | string) {
  const statusNum = typeof status === 'string' ? parseInt(status) : status;
  const colorMap: { [key: number]: string } = {
    1: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    2: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    3: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    4: 'bg-green-100 text-green-800 hover:bg-green-200',
    5: 'bg-red-100 text-red-800 hover:bg-red-200',
    6: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  };
  return colorMap[statusNum] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
}

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
  sponsors?: Array<{
    people_id: number;
    party_id: string;
    name: string;
    first_name: string;
    last_name: string;
  }>;
}

interface LegiscanSession {
  session_id: number;
  state_id: number;
  year_start: number;
  year_end: number;
  name: string;
  special: number;
}

interface BillCardProps {
  bill: LegiscanBill;
  stateName: string;
}

function BillCard({ bill, stateName }: BillCardProps) {
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
            {/* Bill Number and Status */}
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono">
                  {bill.bill_number}
                </Badge>
                <Badge variant={getStatusVariant(bill.status)} className="text-xs">
                  {getStatusText(bill.status)}
                </Badge>
              </div>
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
              {bill.description.length > 300 
                ? `${bill.description.substring(0, 300)}...`
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
            
            {bill.sponsors && bill.sponsors.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>Sponsored by {bill.sponsors[0].name}</span>
                {bill.sponsors.length > 1 && <span> +{bill.sponsors.length - 1} more</span>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function StateDetailPage({ params }: { params: Promise<{ state: string }> }) {
  const [stateCode, setStateCode] = useState<string>('');
  const [stateName, setStateName] = useState<string>('');
  const [bills, setBills] = useState<LegiscanBill[]>([]);
  const [sessions, setSessions] = useState<LegiscanSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const billsPerPage = 20;

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      const code = resolvedParams.state.toUpperCase();
      setStateCode(code);
      
      const state = states.find(s => s.abbr === code);
      setStateName(state?.name || code);
    }
    getParams();
  }, [params]);
  
  useEffect(() => {
    if (!stateCode) return;
    
    async function fetchStateData() {
      setLoading(true);
      setError(null);
      
      try {
        // First fetch sessions for this state
        const sessionsUrl = `/api/legiscan?action=sessions&state=${stateCode}`;
        const sessionsResponse = await fetch(sessionsUrl);
        
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          if (sessionsData.status === 'OK' && sessionsData.data) {
            setSessions(sessionsData.data.sessions || []);
          }
        }
        
        // Fetch recent bills for this state
        const billsUrl = `/api/legiscan?action=recent&state=${stateCode}`;
        const billsResponse = await fetch(billsUrl, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (billsResponse.ok) {
          const billsData = await billsResponse.json();
          if (billsData.status === 'OK' && billsData.bills) {
            // Transform Legiscan masterlist data structure
            const billsArray = Object.values(billsData.bills) as any[];
            const transformedBills: LegiscanBill[] = billsArray
              .filter(bill => bill && bill.bill_id)
              .slice(0, 20) // Limit to 20 bills for state page
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
            
            setBills(transformedBills);
          } else {
            setError('No recent bills found for this state. This may be due to API rate limits or connectivity issues.');
          }
        } else {
          setError('Failed to load state legislation data.');
        }
      } catch (error) {
        console.error('Error fetching state data:', error);
        setError('Failed to load state legislation data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchStateData();
  }, [stateCode, stateName]);

  // Filter bills based on search query, session, and status
  const filteredBills = bills.filter(bill => {
    const matchesSearch = searchQuery === '' || 
      bill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.bill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bill.description && bill.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSession = selectedSession === 'all' || 
      (bill.session && bill.session.session_id.toString() === selectedSession);
    
    const matchesStatus = selectedStatuses.size === 0 || 
      selectedStatuses.has(bill.status.toString());
    
    return matchesSearch && matchesSession && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBills.length / billsPerPage);
  const paginatedBills = filteredBills.slice(
    (currentPage - 1) * billsPerPage,
    currentPage * billsPerPage
  );

  if (loading) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
          <div className="text-center py-12">Loading {stateName} legislation...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
        {/* Header */}
        <header className="text-center mb-12">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link href="/states" className="hover:text-primary">States</Link>
            <span className="mx-2">→</span>
            <span>{stateName}</span>
          </nav>
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
            {stateName} Legislation
          </h1>
          <p className="text-lg text-muted-foreground">
            Current bills and legislative activity in {stateName}
          </p>
          
          <div className="mt-6">
            <Button variant="outline" asChild>
              <Link href={`/legiscan-members/${stateCode.toLowerCase()}`}>
                <Users className="h-4 w-4 mr-2" />
                View {stateName} Legislators
              </Link>
            </Button>
          </div>
        </header>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Session Filter */}
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger>
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions.map((session) => (
                  <SelectItem key={session.session_id} value={session.session_id.toString()}>
                    {session.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Tag Cloud */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Filter by status:
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((status) => {
                const isSelected = selectedStatuses.has(status.value);
                return (
                  <button
                    key={status.value}
                    onClick={() => {
                      const newStatuses = new Set(selectedStatuses);
                      if (isSelected) {
                        newStatuses.delete(status.value);
                      } else {
                        newStatuses.add(status.value);
                      }
                      setSelectedStatuses(newStatuses);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors cursor-pointer ${getStatusColor(status.value)} ${isSelected ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
                  >
                    {status.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedBills.length} of {filteredBills.length} bills
          </p>
          {(searchQuery || selectedSession !== 'all' || selectedStatuses.size > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedSession('all');
                setSelectedStatuses(new Set());
                setCurrentPage(1);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Bills List */}
        {error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : paginatedBills.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {filteredBills.length === 0 && bills.length > 0 
              ? 'No bills match your search criteria'
              : 'No legislation available for this state'
            }
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {paginatedBills.map((bill) => (
                <BillCard key={bill.bill_id} bill={bill} stateName={stateName} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      <footer className="text-center py-6 text-sm text-muted-foreground">
        <p>
          {stateName} legislation data provided by{' '}
          <a href="https://legiscan.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            LegiScan
          </a>
        </p>
      </footer>
    </div>
  );
}