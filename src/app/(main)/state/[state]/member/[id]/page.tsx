'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Users, ExternalLink, MapPin, Loader2, FileText, Vote, Building, Phone, Mail, Globe } from 'lucide-react';

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

export default function MemberDetailPage() {
  const params = useParams();
  const stateCode = (params.state as string)?.toUpperCase();
  const memberId = params.id as string;
  
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const [member, setMember] = useState<any>(null);
  const [sponsoredBills, setSponsoredBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [billsLoading, setBillsLoading] = useState(false);
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

  // Fetch member details
  useEffect(() => {
    async function fetchMember() {
      if (!currentSession || !memberId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // First get all session people to find this specific member
        const response = await fetch(`/api/legiscan?action=session-people&sessionId=${currentSession.session_id}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data?.sessionpeople?.people) {
          const foundMember = data.data.sessionpeople.people.find(
            (p: any) => p.people_id.toString() === memberId
          );
          
          if (foundMember) {
            setMember(foundMember);
            // Fetch sponsored bills
            fetchSponsoredBills(foundMember);
          } else {
            setError('Member not found');
          }
        } else {
          setError('Failed to load member data');
        }
      } catch (error) {
        console.error('Error fetching member:', error);
        setError('Failed to load member data');
      } finally {
        setLoading(false);
      }
    }

    fetchMember();
  }, [currentSession, memberId]);

  // Fetch bills sponsored by this member
  async function fetchSponsoredBills(memberData: any) {
    if (!currentSession) return;
    
    setBillsLoading(true);
    try {
      // Get all bills for the session
      const response = await fetch(`/api/legiscan?action=masterlist&sessionId=${currentSession.session_id}`);
      const data = await response.json();
      
      if (data.status === 'success' && data.data?.masterlist) {
        const bills = Object.values(data.data.masterlist) as any[];
        
        // Get detailed bill information to check sponsors
        const sponsoredBillsPromises = bills.slice(0, 20).map(async (bill: any) => {
          try {
            const billResponse = await fetch(`/api/legiscan?action=bill&billId=${bill.bill_id}`);
            const billData = await billResponse.json();
            
            if (billData.status === 'success' && billData.data?.bill?.sponsors) {
              const isSponsored = billData.data.bill.sponsors.some(
                (sponsor: any) => sponsor.people_id.toString() === memberId
              );
              if (isSponsored) {
                return {
                  ...bill,
                  ...billData.data.bill,
                  sponsor_type: billData.data.bill.sponsors.find(
                    (s: any) => s.people_id.toString() === memberId
                  )?.sponsor_type_id
                };
              }
            }
            return null;
          } catch {
            return null;
          }
        });
        
        const results = await Promise.all(sponsoredBillsPromises);
        const filteredBills = results.filter(bill => bill !== null);
        setSponsoredBills(filteredBills);
      }
    } catch (error) {
      console.error('Error fetching sponsored bills:', error);
    } finally {
      setBillsLoading(false);
    }
  }

  if (!currentSession) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-muted-foreground mb-4">
              Select a Legislative Session
            </h1>
            <p className="text-muted-foreground">
              Please select a session from the header to view member details.
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
            <p className="text-muted-foreground">Loading member details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-muted-foreground mb-4">
              Member Not Found
            </h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <Link href={`/state/${stateCode.toLowerCase()}/member`}>
                View All Members
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
            <Link href={`/state/${stateCode.toLowerCase()}/member`} className="hover:text-primary">
              Members
            </Link>
            <ArrowRight className="h-3 w-3" />
            <span>{member.name}</span>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" asChild>
              <Link href={`/state/${stateCode.toLowerCase()}/member`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Members
              </Link>
            </Button>
          </div>
        </header>

        {/* Member Profile */}
        <div className="space-y-8">
          {/* Main Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Profile Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20">
                      <div className="text-center">
                        <Users className="h-8 w-8 md:h-12 md:w-12 text-primary mx-auto mb-1" />
                        <div className="text-xs text-muted-foreground font-medium">
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Profile Info */}
                  <div>
                    <CardTitle className="text-2xl md:text-3xl font-bold text-primary mb-2">
                      {member.name}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-sm">
                        {member.role}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-sm border-2 ${
                          member.party === 'R' 
                            ? 'border-red-500 text-red-700 bg-red-50' 
                            : member.party === 'D'
                            ? 'border-blue-500 text-blue-700 bg-blue-50'
                            : 'border-gray-500 text-gray-700 bg-gray-50'
                        }`}
                      >
                        {member.party}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{member.district}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-8">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Personal Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    {member.first_name && member.last_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Full Name:</span>
                        <span className="font-medium">
                          {member.first_name} 
                          {member.middle_name && ` ${member.middle_name}`} 
                          {member.last_name}
                          {member.suffix && ` ${member.suffix}`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Party:</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs border-2 ${
                          member.party === 'R' 
                            ? 'border-red-500 text-red-700 bg-red-50' 
                            : member.party === 'D'
                            ? 'border-blue-500 text-blue-700 bg-blue-50'
                            : 'border-gray-500 text-gray-700 bg-gray-50'
                        }`}
                      >
                        {member.party}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <Badge variant="secondary" className="text-xs">{member.role}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">District:</span>
                      <span className="font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {member.district}
                      </span>
                    </div>
                    {member.ftm_eid && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">FTM ID:</span>
                        <span className="font-mono text-xs">{member.ftm_eid}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Legislative Information
                  </h3>
                  <div className="text-sm space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Session:</span>
                      <span className="font-medium">{currentSession.session_name || currentSession.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Years:</span>
                      <Badge variant="outline" className="text-xs">{currentSession.year_start}-{currentSession.year_end}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">State:</span>
                      <span className="font-medium">{stateName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chamber:</span>
                      <Badge variant="secondary" className="text-xs">
                        {member.role === 'Sen' ? 'State Senate' : member.role === 'Rep' ? 'State House' : member.role}
                      </Badge>
                    </div>
                    {currentSession.session_tag && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Session Type:</span>
                        <span className="text-xs">{currentSession.session_tag}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* External Resources */}
              <div>
                <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  External Resources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {member.ballotpedia && (
                    <a 
                      href={`https://ballotpedia.org/${member.ballotpedia}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium text-sm">Ballotpedia Profile</div>
                        <div className="text-xs text-muted-foreground">Biography and voting record</div>
                      </div>
                    </a>
                  )}
                  {member.votesmart_id && (
                    <a 
                      href={`https://justfacts.votesmart.org/candidate/${member.votesmart_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <Vote className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium text-sm">Vote Smart Profile</div>
                        <div className="text-xs text-muted-foreground">Voting positions and ratings</div>
                      </div>
                    </a>
                  )}
                  {member.opensecrets_id && (
                    <a 
                      href={`https://www.opensecrets.org/members-of-congress/summary?cid=${member.opensecrets_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium text-sm">OpenSecrets Profile</div>
                        <div className="text-xs text-muted-foreground">Campaign finance information</div>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sponsored Bills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sponsored Legislation
                {sponsoredBills.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{sponsoredBills.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {billsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Loading sponsored bills...</p>
                </div>
              ) : sponsoredBills.length > 0 ? (
                <div className="space-y-4">
                  {sponsoredBills.map((bill) => (
                    <Link 
                      key={bill.bill_id}
                      href={`/state/${stateCode.toLowerCase()}/bill/${bill.number || bill.bill_number}`}
                      className="block"
                    >
                      <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs font-mono">
                              {bill.number || bill.bill_number}
                            </Badge>
                            <Badge variant={bill.sponsor_type === 1 ? "default" : "secondary"} className="text-xs">
                              {bill.sponsor_type === 1 ? 'Primary Sponsor' : 'Co-Sponsor'}
                            </Badge>
                          </div>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <h4 className="font-semibold text-sm mb-2 hover:text-primary transition-colors">
                          {bill.title || 'Untitled Bill'}
                        </h4>
                        {bill.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {bill.description.length > 150 
                              ? `${bill.description.substring(0, 150)}...`
                              : bill.description
                            }
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                  {sponsoredBills.length >= 20 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        Showing first 20 bills. View all bills to see more.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No sponsored legislation found for this session
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Actions */}
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" asChild>
              <Link href={`/state/${stateCode.toLowerCase()}/bill`}>
                View {stateName} Bills
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