'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, FileText, Calendar, Users, ExternalLink, Loader2, Vote, Clock, User, Building } from 'lucide-react';

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

export default function BillDetailPage() {
  const params = useParams();
  const stateCode = (params.state as string)?.toUpperCase();
  const billNumber = params.bill_number as string;
  
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stateName = states.find(s => s.abbr === stateCode)?.name || stateCode;

  // Fetch most recent session for this state
  useEffect(() => {
    async function fetchCurrentSession() {
      if (!stateCode) return;
      
      try {
        const response = await fetch(`/api/legiscan?action=sessions&state=${stateCode}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data?.sessions?.length > 0) {
          // Use the most recent session (first one)
          setCurrentSession(data.data.sessions[0]);
        }
      } catch (error) {
        console.error('Error fetching current session:', error);
      }
    }

    fetchCurrentSession();
  }, [stateCode]);

  // Fetch bill details
  useEffect(() => {
    async function fetchBill() {
      if (!currentSession || !billNumber) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // First get masterlist to find the bill by bill_number
        const response = await fetch(`/api/legiscan?action=masterlist&sessionId=${currentSession.session_id}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data?.masterlist) {
          const bills = Object.values(data.data.masterlist) as any[];
          const foundBill = bills.find((b: any) => b.number === billNumber);
          
          if (foundBill) {
            // Get detailed bill information
            const billResponse = await fetch(`/api/legiscan?action=bill&billId=${foundBill.bill_id}`);
            const billData = await billResponse.json();
            
            if (billData.status === 'success' && billData.data?.bill) {
              setBill(billData.data.bill);
            } else {
              // Fallback to masterlist data if detailed fetch fails
              setBill(foundBill);
            }
          } else {
            setError('Bill not found');
          }
        } else {
          setError('Failed to load bill data');
        }
      } catch (error) {
        console.error('Error fetching bill:', error);
        setError('Failed to load bill data');
      } finally {
        setLoading(false);
      }
    }

    fetchBill();
  }, [currentSession, billNumber]);

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
              Please select a session from the header to view bill details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading bill details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-muted-foreground mb-4">
              Bill Not Found
            </h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <Link href={`/state/${stateCode.toLowerCase()}/bill`}>
                View All Bills
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/state" className="hover:text-primary">State</Link>
            <ArrowRight className="h-3 w-3" />
            <Link href={`/state/${stateCode.toLowerCase()}`} className="hover:text-primary">
              {stateName}
            </Link>
            <ArrowRight className="h-3 w-3" />
            <Link href={`/state/${stateCode.toLowerCase()}/bill`} className="hover:text-primary">
              Bills
            </Link>
            <ArrowRight className="h-3 w-3" />
            <span>{bill.number || bill.bill_number}</span>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" asChild>
              <Link href={`/state/${stateCode.toLowerCase()}/bill`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Bills
              </Link>
            </Button>
          </div>
        </header>

        {/* Bill Details */}
        <div className="space-y-8">
          {/* Main Bill Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-sm font-mono">
                    {bill.number || bill.bill_number}
                  </Badge>
                  <Badge variant="secondary" className="text-sm">
                    {stateCode}
                  </Badge>
                  {bill.status && (
                    <Badge variant={getStatusVariant(bill.status)} className="text-sm">
                      {getStatusText(bill.status)}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold text-primary leading-tight">
                  {bill.title || 'Untitled Bill'}
                </CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-8">
              {/* Description */}
              {bill.description && (
                <div>
                  <h3 className="font-semibold text-primary mb-3">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {bill.description}
                  </p>
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-primary mb-3">Bill Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bill Number:</span>
                      <span>{bill.number || bill.bill_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">State:</span>
                      <span>{stateName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bill Type:</span>
                      <span>{bill.bill_type === 'B' ? 'Bill' : bill.bill_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chamber:</span>
                      <span>{bill.body === 'H' ? 'House' : bill.body === 'S' ? 'Senate' : bill.body}</span>
                    </div>
                    {bill.status && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span>{getStatusText(bill.status)}</span>
                      </div>
                    )}
                    {bill.status_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status Date:</span>
                        <span>{new Date(bill.status_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-primary mb-3">Session Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Session:</span>
                      <span>{currentSession.session_name || currentSession.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Years:</span>
                      <span>{currentSession.year_start}-{currentSession.year_end}</span>
                    </div>
                    {bill.session?.session_tag && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span>{bill.session.session_tag}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* External Links */}
              <div>
                <h3 className="font-semibold text-primary mb-3">External Resources</h3>
                <div className="flex flex-wrap gap-4">
                  {bill.state_link && (
                    <a 
                      href={bill.state_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on State Website
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sponsors */}
          {bill.sponsors && bill.sponsors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Sponsors ({bill.sponsors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bill.sponsors.map((sponsor: any) => (
                    <Link 
                      key={sponsor.people_id} 
                      href={`/state/${stateCode.toLowerCase()}/member/${sponsor.people_id}`}
                      className="block"
                    >
                      <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={sponsor.sponsor_type_id === 1 ? "default" : "secondary"} className="text-xs">
                            {sponsor.sponsor_type_id === 1 ? 'Primary' : 'Co-Sponsor'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {sponsor.party}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-sm mb-1 hover:text-primary transition-colors">{sponsor.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {sponsor.role} - {sponsor.district}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-blue-600">View Profile</span>
                          {sponsor.ballotpedia && (
                            <a 
                              href={`https://ballotpedia.org/${sponsor.ballotpedia}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                              Ballotpedia
                            </a>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Committee Referrals */}
          {bill.referrals && bill.referrals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Committee Referrals ({bill.referrals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bill.referrals.map((referral: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{referral.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {referral.chamber === 'H' ? 'House' : 'Senate'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Referred: {new Date(referral.date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Voting Record */}
          {bill.votes && bill.votes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="h-5 w-5" />
                  Voting Record ({bill.votes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bill.votes.map((vote: any) => (
                    <div key={vote.roll_call_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm">{vote.desc}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={vote.passed ? "default" : "destructive"} className="text-xs">
                            {vote.passed ? 'Passed' : 'Failed'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {vote.chamber === 'H' ? 'House' : 'Senate'}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Yea:</span>
                          <span className="text-green-600 font-medium">{vote.yea}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nay:</span>
                          <span className="text-red-600 font-medium">{vote.nay}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">N/V:</span>
                          <span>{vote.nv}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Absent:</span>
                          <span>{vote.absent}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(vote.date).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                          {vote.state_link && (
                            <a 
                              href={vote.state_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              State Record
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bill History/Timeline */}
          {bill.history && bill.history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Legislative History ({bill.history.length} actions)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {bill.history.map((action: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                      <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{action.action}</p>
                          <Badge variant="outline" className="text-xs ml-2">
                            {action.chamber === 'H' ? 'House' : action.chamber === 'S' ? 'Senate' : action.chamber}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(action.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Actions */}
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" asChild>
              <Link href={`/state/${stateCode.toLowerCase()}/member`}>
                View {stateName} Legislators
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/state/${stateCode.toLowerCase()}`}>
                {stateName} Legislature Overview
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}