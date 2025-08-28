'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useWatchedBills } from '@/hooks/use-watched-bills';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ExternalLink, 
  Calendar, 
  FileText, 
  Users, 
  MapPin, 
  Building, 
  Gavel,
  History,
  Download,
  ArrowLeft,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Eye
} from 'lucide-react';
import { LEGISCAN_STATE_IDS } from '@/lib/legiscan-connector';

// Based on actual Legiscan API documentation
interface LegiscanBill {
  // Core bill identification
  bill_id: number;
  change_hash: string;
  url: string;
  state_link?: string;
  
  // Status and tracking
  status: number;
  status_date: string;
  
  // Location and legislative body info
  state: string;
  state_id: number;
  
  // Bill identification
  bill_number: string;
  bill_type: string;
  bill_type_id: number;
  
  // Legislative body info
  body: string;
  body_id: number;
  current_body: string;
  current_body_id: number;
  
  // Content
  title: string;
  description: string;
  
  // Committee assignment
  pending_committee_id?: number;
  
  // Session information
  session: {
    session_id: number;
    session_name: string;
    session_title: string;
    year_start: number;
    year_end: number;
    special: number;
  };
  
  // Sponsors (from API)
  sponsors?: Array<{
    people_id: number;
    party_id: string;
    role_id: number;
    name: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    suffix?: string;
    nickname?: string;
    district?: string;
  }>;
  
  // History/progress tracking
  history?: Array<{
    date: string;
    action: string;
    chamber: string;
  }>;
  
  // Bill texts
  texts?: Array<{
    doc_id: number;
    type: string;
    mime: string;
    date: string;
    url: string;
    state_link?: string;
  }>;
  
  // Amendments
  amendments?: Array<{
    amendment_id: number;
    chamber: string;
    date: string;
    title: string;
    description: string;
    mime: string;
    url: string;
  }>;
  
  // Supplements
  supplements?: Array<{
    supplement_id: number;
    date: string;
    type: string;
    title: string;
    description: string;
    mime: string;
    url: string;
  }>;
  
  // Roll call votes
  votes?: Array<{
    roll_call_id: number;
    date: string;
    chamber: string;
    motion: string;
    desc: string;
    yea: number;
    nay: number;
    nv: number;
    absent: number;
    total: number;
    passed: number;
    url?: string;
  }>;
}

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
    1: 'outline',      // Introduced
    2: 'secondary',    // Engrossed
    3: 'secondary',    // Enrolled
    4: 'default',      // Passed
    5: 'destructive',  // Vetoed
    6: 'destructive'   // Failed
  };
  return variantMap[status] || 'outline';
};

const BillStatusIndicator = ({ status }: { status: number }) => {
  const steps = [
    { key: 1, label: 'Introduced' },
    { key: 2, label: 'Engrossed' },
    { key: 3, label: 'Enrolled' },
    { key: 4, label: 'Passed' },
    { key: 5, label: 'Vetoed' },
    { key: 6, label: 'Failed' }
  ];
  
  let currentStepIndex = steps.findIndex(step => step.key === status);
  if (currentStepIndex === -1) currentStepIndex = 0;
  
  // For passed bills, show 100%, for failed/vetoed show their position, for others show progress
  let progressPercentage;
  if (status === 4) { // Passed
    progressPercentage = 100;
  } else if (status === 5 || status === 6) { // Vetoed or Failed
    progressPercentage = (currentStepIndex / (steps.length - 1)) * 100;
  } else {
    progressPercentage = ((currentStepIndex + 1) / 4) * 100; // Only count progress steps
  }

  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1">
        <span className={`${status === 1 ? 'font-bold text-primary' : ''}`}>Introduced</span>
        <span className={`${status === 2 ? 'font-bold text-primary' : ''}`}>Engrossed</span>
        <span className={`${status === 3 ? 'font-bold text-primary' : ''}`}>Enrolled</span>
        <span className={`${status === 4 ? 'font-bold text-green-600' : ''}`}>Passed</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
      {(status === 5 || status === 6) && (
        <div className="text-center text-xs mt-1">
          <Badge variant="destructive" className="text-xs">
            {getStatusText(status)}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default function LegiscanBillDetailPage() {
  const params = useParams();
  const billId = params.billId as string;
  
  const [bill, setBill] = useState<LegiscanBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Support/Oppose functionality
  const { user } = useAuth();
  const router = useRouter();
  const [supportCount, setSupportCount] = useState(127);
  const [opposeCount, setOpposeCount] = useState(43);
  const [userAction, setUserAction] = useState<'support' | 'oppose' | null>(null);
  
  // Watch functionality
  const { isWatchedBill, toggleWatchBill } = useWatchedBills();
  const isWatched = bill ? isWatchedBill('state', bill.bill_type || 'bill', bill.bill_id.toString()) : false;

  useEffect(() => {
    async function fetchBillDetails() {
      if (!billId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/legiscan?action=bill&billId=${billId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK' && data.bill) {
            setBill(data.bill);
          } else {
            setError(`Bill not found: ${data.alert?.message || 'Unknown error'}`);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(`API Error: ${errorData.message || response.statusText}`);
        }
      } catch (error) {
        console.error('Error fetching bill details:', error);
        setError('Failed to load bill details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    // No mock data function - using real API data only

    fetchBillDetails();
  }, [billId]);

  const handleSupportOppose = async (action: 'support' | 'oppose') => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    try {
      // Store action in localStorage as temporary solution
      const userActions = JSON.parse(localStorage.getItem('userBillActions') || '[]');
      const newAction = {
        id: Date.now().toString(),
        userId: user.uid,
        userEmail: user.email,
        campaignId: `legiscan-bill-${bill?.bill_id}`,
        billNumber: bill?.bill_number,
        billType: 'state',
        billId: bill?.bill_id,
        billTitle: bill?.title,
        action: action,
        timestamp: new Date().toISOString(),
        groupName: 'Individual Action',
        groupSlug: 'individual'
      };
      
      userActions.push(newAction);
      localStorage.setItem('userBillActions', JSON.stringify(userActions));

      // Update local state to reflect the change immediately
      if (action === 'support') {
        setSupportCount(prev => prev + 1);
      } else {
        setOpposeCount(prev => prev + 1);
      }

      // Set user action state to show success on button
      setUserAction(action);
      
      // Clear the success state after 2 seconds
      setTimeout(() => {
        setUserAction(null);
      }, 2000);

    } catch (error) {
      console.error('Error recording support/oppose action:', error);
      alert('There was an error recording your action. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  const getStateName = (stateCode: string) => {
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
    return states.find(s => s.abbr === stateCode)?.name || stateCode;
  };

  if (loading) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div className="text-lg">Loading bill details...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <div className="text-lg font-medium mb-4 text-red-500">Error Loading Bill</div>
              <div className="text-gray-600 mb-4">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">Bill not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/states" className="hover:text-primary">States</Link>
          <span>→</span>
          <Link href={`/states/${bill.state.toLowerCase()}`} className="hover:text-primary">
            {getStateName(bill.state)}
          </Link>
          <span>→</span>
          <span className="text-foreground">{bill.bill_number}</span>
        </nav>

        <div className="space-y-8">
          {/* Bill Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                {/* Bill Number and Status */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-sm font-mono px-3 py-1">
                      {bill.bill_number}
                    </Badge>
                    <Badge variant={getStatusVariant(bill.status)} className="text-sm px-3 py-1">
                      {getStatusText(bill.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/states/${bill.state.toLowerCase()}`}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to {getStateName(bill.state)}
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Bill Title */}
                <CardTitle className="text-2xl font-bold leading-tight">
                  {bill.title}
                </CardTitle>

                {/* Bill Description */}
                {bill.description && (
                  <p className="text-muted-foreground leading-relaxed">
                    {bill.description}
                  </p>
                )}

                {/* Status Progress */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-3">Legislative Progress</h4>
                  <BillStatusIndicator status={bill.status} />
                </div>
              </div>
            </CardHeader>
            
            <CardFooter className="flex items-center gap-2 pt-4 border-t">
              <Button size="sm" onClick={() => {
                // Always go directly to advocacy message page
                router.push(`/advocacy-message?state=${bill.state}&billId=${bill.bill_id}&billNumber=${bill.bill_number}`);
              }}>
                Voice your opinion
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className={`flex items-center gap-2 transition-colors ${
                  userAction === 'support' 
                    ? 'bg-green-100 text-green-800 border-green-300' 
                    : 'text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200'
                }`}
                onClick={() => handleSupportOppose('support')}
                title={user ? 'Support this bill' : 'Login to support this bill'}
                disabled={userAction === 'support'}
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="font-semibold">
                  {userAction === 'support' ? 'Supported!' : supportCount.toLocaleString()}
                </span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className={`flex items-center gap-2 transition-colors ${
                  userAction === 'oppose' 
                    ? 'bg-red-100 text-red-800 border-red-300' 
                    : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
                }`}
                onClick={() => handleSupportOppose('oppose')}
                title={user ? 'Oppose this bill' : 'Login to oppose this bill'}
                disabled={userAction === 'oppose'}
              >
                <ThumbsDown className="h-4 w-4" />
                <span className="font-semibold">
                  {userAction === 'oppose' ? 'Opposed!' : opposeCount.toLocaleString()}
                </span>
              </Button>
              <Button 
                variant={isWatched ? "default" : "outline"}
                size="sm"
                className={`flex items-center gap-2 ${
                  isWatched 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  if (!user) {
                    const currentUrl = window.location.pathname;
                    router.push(`/login?returnTo=${encodeURIComponent(currentUrl)}`);
                    return;
                  }
                  
                  toggleWatchBill(
                    'state', 
                    bill.bill_type || 'bill', 
                    bill.bill_id.toString(), 
                    bill.title
                  );
                }}
                title={user ? (isWatched ? 'Stop watching this bill' : 'Watch this bill for updates') : 'Login to watch this bill'}
              >
                <Eye className="h-4 w-4" />
                {isWatched ? 'Watching' : 'Watch'}
              </Button>
            </CardFooter>
          </Card>

          {/* Bill Details Tabs */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="votes">Votes</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Session Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Session Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">State: {getStateName(bill.state)}</span>
                    </div>
                    {bill.session && (
                      <>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{bill.session.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Session Years: {bill.session.year_start} - {bill.session.year_end}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Last Updated: {formatDate(bill.status_date)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Committee Information */}
                {bill.committee && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gavel className="h-5 w-5" />
                        Committee
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium">{bill.committee.name}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Bill Information */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Bill Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Bill Type</p>
                        <p className="text-foreground">{bill.bill_type}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Current Body</p>
                        <p className="text-foreground">{bill.current_body}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Originating Body</p>
                        <p className="text-foreground">{bill.body}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Status Date</p>
                        <p className="text-foreground">{formatDate(bill.status_date)}</p>
                      </div>
                    </div>
                    {bill.pending_committee_id && (
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Pending Committee</p>
                        <p className="text-foreground">Committee ID: {bill.pending_committee_id}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Session Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Session Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{bill.session.session_title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{bill.session.year_start} - {bill.session.year_end}</span>
                    </div>
                    {bill.session.special === 1 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Special Session
                        </Badge>
                      </div>
                    )}
                    <div className="pt-2">
                      {bill.state_link && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={bill.state_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View on State Website
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

            {/* Sponsors Tab */}
            <TabsContent value="sponsors">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Bill Sponsors ({bill.sponsors?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bill.sponsors && bill.sponsors.length > 0 ? (
                    <div className="space-y-4">
                      {bill.sponsors.map((sponsor) => (
                        <div key={sponsor.people_id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-lg">{sponsor.name}</div>
                              {sponsor.nickname && sponsor.nickname !== sponsor.first_name && (
                                <div className="text-sm text-muted-foreground">({sponsor.nickname})</div>
                              )}
                              <div className="text-sm text-muted-foreground mt-1">
                                {sponsor.district ? `District ${sponsor.district}` : 'State-wide'}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge 
                                variant="outline" 
                                className={`${
                                  sponsor.party_id === 'D' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                                  sponsor.party_id === 'R' ? 'border-red-200 text-red-700 bg-red-50' :
                                  'border-gray-200 text-gray-700 bg-gray-50'
                                }`}
                              >
                                {sponsor.party_id}
                              </Badge>
                              {sponsor.role_id === 1 && (
                                <Badge variant="default" className="text-xs">
                                  Primary
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No sponsor information available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Legislative History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bill.history && bill.history.length > 0 ? (
                    <div className="space-y-4">
                      {bill.history.map((action, index) => (
                        <div key={index} className="flex gap-4 p-3 border-l-2 border-primary/20">
                          <div className="flex-shrink-0">
                            <Badge variant="outline" className="text-xs">
                              {action.chamber}
                            </Badge>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{action.action}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(action.date)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No legislative history available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <div className="space-y-6">
                {/* Bill Texts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Bill Texts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bill.texts && bill.texts.length > 0 ? (
                      <div className="space-y-3">
                        {bill.texts.map((text) => (
                          <div key={text.doc_id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{text.type}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(text.date)} • {text.mime}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {text.state_link && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={text.state_link} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    State Site
                                  </a>
                                </Button>
                              )}
                              <Button variant="outline" size="sm" asChild>
                                <a href={text.url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-1" />
                                  View
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No bill texts available.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Amendments */}
                {bill.amendments && bill.amendments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Amendments ({bill.amendments.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {bill.amendments.map((amendment) => (
                          <div key={amendment.amendment_id} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium">{amendment.title}</div>
                                <div className="text-sm text-muted-foreground mt-1">{amendment.description}</div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  {formatDate(amendment.date)} • {amendment.chamber} • {amendment.mime}
                                </div>
                              </div>
                              <Button variant="outline" size="sm" asChild>
                                <a href={amendment.url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-1" />
                                  View
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Supplements */}
                {bill.supplements && bill.supplements.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Supplements ({bill.supplements.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {bill.supplements.map((supplement) => (
                          <div key={supplement.supplement_id} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium">{supplement.title}</div>
                                <div className="text-sm text-muted-foreground mt-1">{supplement.description}</div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  {formatDate(supplement.date)} • {supplement.type} • {supplement.mime}
                                </div>
                              </div>
                              <Button variant="outline" size="sm" asChild>
                                <a href={supplement.url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-1" />
                                  View
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Votes Tab */}
            <TabsContent value="votes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    Roll Call Votes ({bill.votes?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bill.votes && bill.votes.length > 0 ? (
                    <div className="space-y-4">
                      {bill.votes.map((vote) => (
                        <div key={vote.roll_call_id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="font-medium">{vote.motion}</div>
                              <div className="text-sm text-muted-foreground mt-1">{vote.desc}</div>
                              <div className="text-xs text-muted-foreground mt-2">
                                {formatDate(vote.date)} • {vote.chamber}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={vote.passed ? "default" : "destructive"} className="mb-2">
                                {vote.passed ? 'Passed' : 'Failed'}
                              </Badge>
                              {vote.url && (
                                <div>
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={vote.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4 mr-1" />
                                      View Details
                                    </a>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div className="text-center">
                              <div className="font-semibold text-green-600">{vote.yea}</div>
                              <div className="text-xs text-muted-foreground">Yes</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-red-600">{vote.nay}</div>
                              <div className="text-xs text-muted-foreground">No</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-gray-500">{vote.nv}</div>
                              <div className="text-xs text-muted-foreground">Not Voting</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-yellow-600">{vote.absent}</div>
                              <div className="text-xs text-muted-foreground">Absent</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold">{vote.total}</div>
                              <div className="text-xs text-muted-foreground">Total</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No vote information available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Committees Tab - Removed as not in basic API response */}
            <TabsContent value="committees">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    Committee Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bill.pending_committee_id ? (
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium">Pending Committee</div>
                      <div className="text-sm text-muted-foreground">Committee ID: {bill.pending_committee_id}</div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No committee information available in basic bill data.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Placeholder sections matching congress bill layout */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Winners/Losers</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Third party ratings</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Industry support</CardTitle>
            </CardHeader>
          </Card>


          {/* External Links */}
          <div className="flex flex-col gap-3">
            {bill.url && (
              <Button variant="outline" asChild className="w-full">
                <a href={bill.url} target="_blank" rel="noopener noreferrer">
                  View Full Bill Details <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
            {bill.state_link && (
              <Button variant="outline" asChild className="w-full">
                <a href={bill.state_link} target="_blank" rel="noopener noreferrer">
                  View on State Website <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <footer className="text-center py-6 text-sm text-muted-foreground">
        <p>
          State legislation data provided by{' '}
          <a href="https://legiscan.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            LegiScan
          </a>
        </p>
      </footer>
    </div>
  );
}