'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Calendar, FileText, Search, Loader2, ArrowLeft } from 'lucide-react';
import { usePremiumAccess } from '@/hooks/use-premium-access';
import { PremiumUpgradeCTA } from '@/components/premium-upgrade-cta';

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
  { value: 'all', label: 'All Status' },
  { value: '1', label: 'Introduced' },
  { value: '2', label: 'Engrossed' },
  { value: '3', label: 'Enrolled' },
  { value: '4', label: 'Passed' },
  { value: '5', label: 'Vetoed' },
  { value: '6', label: 'Failed' }
];

export default function StateBillsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const stateCode = (params.state as string)?.toUpperCase();
  const { isPremium, isLoading: premiumLoading } = usePremiumAccess();

  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [filteredBills, setFilteredBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams?.get('status') || 'all');

  const stateName = states.find(s => s.abbr === stateCode)?.name || stateCode;

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

  // Fetch sessions for this state
  useEffect(() => {
    async function fetchSessions() {
      if (!stateCode) return;
      
      setSessionsLoading(true);
      try {
        const response = await fetch(`/api/legiscan?action=sessions&state=${stateCode}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data?.sessions) {
          const sessionsList = data.data.sessions;
          setSessions(sessionsList);
          
          // Auto-select the most recent session (first one)
          if (sessionsList.length > 0) {
            setCurrentSession(sessionsList[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setSessionsLoading(false);
      }
    }

    fetchSessions();
  }, [stateCode]);

  // Fetch bills when session is available
  useEffect(() => {
    async function fetchBills() {
      if (!currentSession) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/legiscan?action=masterlist&sessionId=${currentSession.session_id}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data?.masterlist) {
          const billsArray = Object.values(data.data.masterlist) as any[];
          setBills(billsArray);
          setFilteredBills(billsArray);
        }
      } catch (error) {
        console.error('Error fetching bills:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBills();
  }, [currentSession]);

  // Filter bills based on search and status
  useEffect(() => {
    let filtered = bills;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bill =>
        bill.title?.toLowerCase().includes(query) ||
        bill.number?.toLowerCase().includes(query) ||
        bill.description?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bill => bill.status?.toString() === statusFilter);
    }

    setFilteredBills(filtered);
  }, [bills, searchQuery, statusFilter]);

  const getStatusText = (status: number) => {
    const statusMap: { [key: number]: string } = {
      1: 'Introduced', 2: 'Engrossed', 3: 'Enrolled',
      4: 'Passed', 5: 'Vetoed', 6: 'Failed'
    };
    return statusMap[status] || 'Unknown';
  };

  const getStatusVariant = (status: number) => {
    const variantMap: { [key: number]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      1: 'outline', 2: 'secondary', 3: 'secondary',
      4: 'default', 5: 'destructive', 6: 'destructive'
    };
    return variantMap[status] || 'outline';
  };

  if (!currentSession) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-muted-foreground mb-4">
              Select a Legislative Session
            </h1>
            <p className="text-muted-foreground">
              Please select a session from the header to view {stateName} bills.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/state" className="hover:text-primary">State</Link>
            <ArrowRight className="h-3 w-3" />
            <Link href={`/state/${stateCode.toLowerCase()}`} className="hover:text-primary">
              {stateName}
            </Link>
            <ArrowRight className="h-3 w-3" />
            <span>Bills</span>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
                {stateName} Bills
              </h1>
              <Button variant="outline" asChild>
                <Link href={`/state/${stateCode.toLowerCase()}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to {stateName}
                </Link>
              </Button>
            </div>
            
            {/* Session Selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Legislative Session:
              </label>
              {sessionsLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <Select 
                  value={currentSession?.session_id?.toString() || ''} 
                  onValueChange={(value) => {
                    const selectedSession = sessions.find(s => s.session_id.toString() === value);
                    if (selectedSession) {
                      setCurrentSession(selectedSession);
                    }
                  }}
                >
                  <SelectTrigger className="w-80">
                    <SelectValue placeholder="Select a session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.session_id} value={session.session_id.toString()}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{session.session_name || session.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {session.year_start}-{session.year_end}
                            {session.special ? ' (Special Session)' : ''}
                            {!session.sine_die ? ' (Active)' : ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </header>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bills by title, number, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading bills...
              </div>
            ) : (
              <span>
                Showing {filteredBills.length} of {bills.length} bills
                {searchQuery && ` matching "${searchQuery}"`}
              </span>
            )}
          </div>
        </div>

        {/* Bills List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading bills...</p>
          </div>
        ) : filteredBills.length > 0 ? (
          <div className="space-y-4">
            {filteredBills.map((bill) => (
              <Link 
                key={bill.bill_id}
                href={`/state/${stateCode.toLowerCase()}/bill/${bill.number}`}
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs font-mono">
                          {bill.number}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {stateCode}
                        </Badge>
                        {bill.status && (
                          <Badge variant={getStatusVariant(bill.status)} className="text-xs">
                            {getStatusText(bill.status)}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg font-semibold leading-tight hover:text-primary transition-colors">
                        {bill.title || 'Untitled Bill'}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  
                  {bill.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {bill.description.length > 200 
                          ? `${bill.description.substring(0, 200)}...`
                          : bill.description
                        }
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No bills found</h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? `No bills match your search for "${searchQuery}"`
                : 'No bills available for this session'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}