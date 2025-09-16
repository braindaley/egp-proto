'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_ISSUE_CATEGORIES, getLegiscanSubjectsForSiteCategory, type SiteIssueCategory } from '@/lib/policy-area-mapping';
import { US_STATES, convertStateToSlug } from '@/lib/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Calendar, FileText, Users, ExternalLink, Loader2, Filter } from 'lucide-react';

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

function convertTitleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function convertSlugToTitle(slug: string): string {
  const categoryMap = SITE_ISSUE_CATEGORIES.reduce((acc, category) => {
    acc[convertTitleToSlug(category)] = category;
    return acc;
  }, {} as Record<string, string>);
  
  return categoryMap[slug] || null;
}

function convertSlugToState(slug: string): string {
  const stateMap = US_STATES.reduce((acc, state) => {
    acc[convertStateToSlug(state)] = state;
    return acc;
  }, {} as Record<string, string>);
  
  return stateMap[slug] || null;
}

export default function StatePolicyPage() {
  const params = useParams();
  const router = useRouter();
  const policy = params.policy as string;
  const state = params.state as string;
  
  const policyTitle = convertSlugToTitle(policy) as SiteIssueCategory;
  const stateName = convertSlugToState(state);
  const stateCode = states.find(s => convertStateToSlug(s.name) === state)?.abbr;
  
  // Debug logging removed to prevent re-renders

  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const [filteredBills, setFilteredBills] = useState<any[]>([]);
  const [totalBillsCount, setTotalBillsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Redirect if invalid params
  if (!policyTitle || !stateName || !stateCode) {
    notFound();
  }

  // Get relevant subjects for this policy category
  const relevantSubjects = getLegiscanSubjectsForSiteCategory(policyTitle);

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

  // Filter bills by checking if any of the bill's subjects match our relevant subjects
  const filterBillsByPolicy = (bills: any[]) => {
    return bills.filter(bill => {
      // Check if bill has subjects that match our policy category
      if (bill.subjects) {
        // Handle different subject formats
        let billSubjects: string[] = [];
        
        if (Array.isArray(bill.subjects)) {
          billSubjects = bill.subjects.map((subject: any) => {
            if (typeof subject === 'string') return subject;
            return subject.subject_name || subject.name || '';
          }).filter(Boolean);
        }
        
        // Check if any of the bill's subjects are relevant to our policy
        return billSubjects.some(subject => 
          relevantSubjects.some(relevantSubject => 
            subject.toLowerCase().includes(relevantSubject.toLowerCase()) ||
            relevantSubject.toLowerCase().includes(subject.toLowerCase())
          )
        );
      }
      
      // Fallback: If no subjects available, use keyword matching on title and description
      const titleText = (bill.title || '').toLowerCase();
      const descriptionText = (bill.description || '').toLowerCase();
      
      // Create policy-specific keywords for matching
      const policyKeywords = getPolicyKeywords(policyTitle);
      
      return policyKeywords.some(keyword => 
        titleText.includes(keyword) || descriptionText.includes(keyword)
      );
    });
  };
  
  // Get keywords for policy-based filtering when subjects are not available
  const getPolicyKeywords = (policy: string): string[] => {
    const keywordMap: { [key: string]: string[] } = {
      'Health Policy': ['health', 'medical', 'medicaid', 'medi-cal', 'hospital', 'mental health', 'behavioral health', 'public health', 'healthcare', 'disease', 'medicine', 'therapy', 'treatment', 'substance', 'alcohol', 'drug', 'addiction'],
      'Criminal Justice': ['crime', 'criminal', 'prison', 'jail', 'police', 'enforcement', 'justice', 'court', 'penalty', 'sentence', 'felony', 'misdemeanor', 'arrest', 'prosecution', 'probation', 'parole'],
      'Climate, Energy & Environment': ['climate', 'environment', 'energy', 'renewable', 'solar', 'wind', 'carbon', 'emission', 'pollution', 'conservation', 'wildlife', 'forest', 'water', 'air quality', 'greenhouse'],
      'Education': ['education', 'school', 'student', 'teacher', 'university', 'college', 'academic', 'curriculum', 'learning', 'scholarship', 'tuition'],
      'Economy & Work': ['economic', 'economy', 'employment', 'job', 'work', 'labor', 'wage', 'business', 'commerce', 'tax', 'finance', 'budget', 'appropriation', 'housing', 'transportation'],
      'Immigration & Migration': ['immigration', 'immigrant', 'migrant', 'citizenship', 'border', 'visa', 'refugee', 'asylum'],
      'Technology': ['technology', 'digital', 'internet', 'cyber', 'data', 'privacy', 'artificial intelligence', 'broadband', 'telecommunications'],
      'Defense & National Security': ['defense', 'security', 'military', 'veteran', 'emergency', 'disaster', 'homeland'],
      'Discrimination & Prejudice': ['discrimination', 'civil rights', 'equality', 'bias', 'harassment', 'prejudice', 'minority'],
      'International Affairs': ['international', 'foreign', 'trade', 'export', 'import', 'treaty'],
      'National Conditions': ['government', 'election', 'voting', 'campaign', 'ethics', 'administration', 'legislature', 'constitution'],
      'Religion & Government': ['religion', 'religious', 'faith', 'church', 'spiritual']
    };
    
    return keywordMap[policy] || [];
  };

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
          
          // Auto-select a session that has bills (not a future prefile session)
          if (sessionsList.length > 0) {
            const currentYear = new Date().getFullYear();
            // Find the first session that's not a future prefile session
            const activeSession = sessionsList.find((s: any) => 
              !s.prefile && s.year_start <= currentYear && !s.special
            );
            const recentSession = sessionsList.find((s: any) => 
              s.year_start <= currentYear && !s.special
            );
            // Use active session, or most recent non-future session, or fallback to first
            setCurrentSession(activeSession || recentSession || sessionsList[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setApiError('Unable to load legislative data. The API service may be temporarily unavailable.');
      } finally {
        setSessionsLoading(false);
      }
    }

    fetchSessions();
  }, [stateCode]);

  // Fetch and filter bills when session is available
  useEffect(() => {
    async function fetchFilteredBills() {
      if (!currentSession) return;
      
      setLoading(true);
      try {
        // Use masterlist API only (dataset API requires different access)
        let bills: any[] = [];
        
        const masterlistResponse = await fetch(`/api/legiscan?action=masterlist&sessionId=${currentSession.session_id}`);
        const masterlistData = await masterlistResponse.json();
        
        if (masterlistData.status === 'success' && masterlistData.data?.masterlist) {
          // Convert masterlist object to array (excluding 'session' key)
          bills = Object.entries(masterlistData.data.masterlist)
            .filter(([key, value]: [string, any]) => key !== 'session' && value.bill_id)
            .map(([_, bill]) => bill) as any[];
        }
        
        // Filter bills by policy using keyword matching since CA doesn't provide subjects
        const filtered = filterBillsByPolicy(bills);
        
        setTotalBillsCount(filtered.length);
        setFilteredBills(filtered.slice(0, 12)); // Show first 12 bills
        
      } catch (error) {
        console.error('Error fetching bills:', error);
        setFilteredBills([]);
        setTotalBillsCount(0);
        setApiError('Unable to load legislative data. The API service may be temporarily unavailable.');
      } finally {
        setLoading(false);
      }
    }

    fetchFilteredBills();
  }, [currentSession, policyTitle]); // Changed from relevantSubjects to policyTitle to avoid dependency issues

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/issues" className="hover:text-primary">Issues</Link>
            <ArrowRight className="h-3 w-3" />
            <Link href={`/issues/${policy}`} className="hover:text-primary">{policyTitle}</Link>
            <ArrowRight className="h-3 w-3" />
            <span>{stateName}</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
                {stateName} - {policyTitle}
              </h1>
              <p className="text-muted-foreground">
                State legislation related to {policyTitle.toLowerCase()} issues
              </p>
            </div>
            
            {/* Back to all states */}
            <Button variant="outline" asChild>
              <Link href={`/issues/${policy}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                All States
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
        </header>

        {/* Filter Info */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Filtered by {policyTitle} Keywords
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Showing bills with keywords: {getPolicyKeywords(policyTitle).slice(0, 5).join(', ')}
                {getPolicyKeywords(policyTitle).length > 5 && ` and ${getPolicyKeywords(policyTitle).length - 5} more`}
              </p>
            </div>
          </div>
        </div>

        {/* API Error Message */}
        {apiError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-red-900 dark:text-red-100">
                  Legislative Data Unavailable
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {apiError}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  Please try again later or contact support if this issue persists.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bills Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold text-primary">{policyTitle} Bills</h2>
              {totalBillsCount > 0 && (
                <Badge variant="secondary" className="ml-2">{totalBillsCount}</Badge>
              )}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/state/${stateCode.toLowerCase()}`}>
                <ArrowRight className="mr-2 h-3 w-3" />
                All {stateName} Bills
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>Loading {policyTitle.toLowerCase()} bills...</p>
            </div>
          ) : filteredBills.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBills.map((bill, index) => (
                <Link 
                  key={bill.bill_id || `bill-${index}`} 
                  href={`/state/${stateCode.toLowerCase()}/bill/${bill.number}`}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50 h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-3">
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
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-base font-semibold leading-tight">
                        {bill.title || 'Untitled Bill'}
                      </CardTitle>
                    </CardHeader>
                    {bill.description && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {bill.description}
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
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                No {policyTitle} Bills Found
              </h3>
              <p className="text-muted-foreground mb-4">
                No bills related to {policyTitle.toLowerCase()} were found in the current session.
              </p>
              <Button variant="outline" asChild>
                <Link href={`/state/${stateCode.toLowerCase()}`}>
                  View All {stateName} Bills
                </Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// Note: generateStaticParams removed because this is a client component