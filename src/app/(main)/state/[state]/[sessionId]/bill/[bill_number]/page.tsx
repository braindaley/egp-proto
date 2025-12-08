'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, FileText, ExternalLink, Vote, Clock, User, Building, Tags } from 'lucide-react';
import { processLegiscanBillSubjects } from '@/lib/legiscan-subjects';
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

export default function BillDetailPage({ params }: { params: Promise<{ state: string; sessionId: string; bill_number: string }> }) {
  const { state: stateParam, sessionId, bill_number: billNumber } = use(params);
  const stateCode = stateParam?.toUpperCase();
  const stateName = states[stateParam?.toLowerCase()] || stateCode;
  const decodedBillNumber = decodeURIComponent(billNumber);

  const { isPremium, isLoading: premiumLoading } = usePremiumAccess();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Show premium upgrade CTA for non-premium users
  if (!premiumLoading && !isPremium) {
    return (
      <PremiumUpgradeCTA
        variant="full-page"
        title="State Bill Details"
        description={`Access detailed information about ${stateName} bills with a premium membership.`}
      />
    );
  }

  // Fetch session info and bill details
  useEffect(() => {
    async function fetchData() {
      if (!stateCode || !sessionId || !decodedBillNumber) return;

      setLoading(true);
      setError(null);

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

        // First get masterlist to find the bill by bill_number
        const response = await fetch(`/api/legiscan?action=masterlist&sessionId=${sessionId}`);
        const data = await response.json();

        if (data.status === 'success' && data.data?.masterlist) {
          const bills = Object.entries(data.data.masterlist)
            .filter(([key, value]: [string, any]) => key !== 'session' && value.bill_id)
            .map(([_, bill]) => bill) as any[];
          const foundBill = bills.find((b: any) => b.number === decodedBillNumber);

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

    fetchData();
  }, [stateCode, sessionId, decodedBillNumber]);

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
              <Link href={`/state/${stateParam}/${sessionId}/bill`}>
                View All Bills
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const sessionName = sessionInfo?.session_name || sessionInfo?.name || `Session ${sessionId}`;

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/state" className="hover:text-primary">State</Link>
            <ArrowRight className="h-3 w-3" />
            <Link href={`/state/${stateParam}`} className="hover:text-primary">
              {stateName}
            </Link>
            <ArrowRight className="h-3 w-3" />
            <Link href={`/state/${stateParam}/${sessionId}/bill`} className="hover:text-primary">
              Bills
            </Link>
            <ArrowRight className="h-3 w-3" />
            <span>{bill.number || bill.bill_number}</span>
          </div>

          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" asChild>
              <Link href={`/state/${stateParam}/${sessionId}/bill`}>
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
                      <span>{sessionName}</span>
                    </div>
                    {sessionInfo && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Years:</span>
                        <span>{sessionInfo.year_start}-{sessionInfo.year_end}</span>
                      </div>
                    )}
                    {bill.session?.session_tag && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span>{bill.session.session_tag}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subjects & Policy Areas */}
              {(() => {
                const subjectData = processLegiscanBillSubjects(bill);
                return subjectData.rawSubjects.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                      <Tags className="h-4 w-4" />
                      Policy Areas & Issues
                    </h3>
                    <div className="space-y-3">
                      {/* Primary Category */}
                      {subjectData.primaryCategory && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Primary Issue Category</p>
                          <Badge variant="default" className="text-sm">
                            {subjectData.primaryCategory}
                          </Badge>
                        </div>
                      )}

                      {/* Additional Categories */}
                      {subjectData.allCategories.length > 1 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Additional Categories</p>
                          <div className="flex flex-wrap gap-2">
                            {subjectData.allCategories.slice(1).map(category => (
                              <Badge key={category} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Raw Subjects */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">State Legislative Subjects</p>
                        <div className="flex flex-wrap gap-2">
                          {subjectData.rawSubjects.map((subject, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                    <div key={sponsor.people_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow hover:border-primary/50">
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
                        <Link
                          href={`/state/${stateParam}/${sessionId}/member/${sponsor.people_id}`}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          View Profile
                        </Link>
                        {sponsor.ballotpedia && (
                          <a
                            href={`https://ballotpedia.org/${sponsor.ballotpedia}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ballotpedia
                          </a>
                        )}
                      </div>
                    </div>
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
              <Link href={`/state/${stateParam}/${sessionId}/member`}>
                View {stateName} Legislators
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/state/${stateParam}`}>
                {stateName} Legislature Overview
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
