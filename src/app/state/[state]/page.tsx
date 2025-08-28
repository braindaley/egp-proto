'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Calendar, FileText, Users, ExternalLink, Loader2 } from 'lucide-react';

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

export default function StateOverviewPage() {
  const params = useParams();
  const stateCode = (params.state as string)?.toUpperCase();
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const [recentBills, setRecentBills] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [totalBillsCount, setTotalBillsCount] = useState(0);
  const [totalMembersCount, setTotalMembersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const stateName = states.find(s => s.abbr === stateCode)?.name || stateCode;

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

  // Fetch recent bills and members when session is available
  useEffect(() => {
    async function fetchData() {
      if (!currentSession) return;
      
      setLoading(true);
      try {
        // Fetch recent bills for current session
        const billsResponse = await fetch(`/api/legiscan?action=masterlist&sessionId=${currentSession.session_id}`);
        const billsData = await billsResponse.json();
        
        if (billsData.status === 'success' && billsData.data?.masterlist) {
          // Get all bills and set total count
          const billsArray = Object.values(billsData.data.masterlist) as any[];
          setTotalBillsCount(billsArray.length);
          // Display first 6 bills
          setRecentBills(billsArray.slice(0, 6));
        }

        // Fetch members for current session
        const membersResponse = await fetch(`/api/legiscan?action=session-people&sessionId=${currentSession.session_id}`);
        const membersData = await membersResponse.json();
        
        if (membersData.status === 'success' && membersData.data?.sessionpeople?.people) {
          // Get all members and set total count
          const allMembers = membersData.data.sessionpeople.people;
          setTotalMembersCount(allMembers.length);
          // Display first 8 members
          setMembers(allMembers.slice(0, 8));
        }
      } catch (error) {
        console.error('Error fetching state data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentSession]);


  return (
    <div className="bg-secondary/30 flex-1">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/state" className="hover:text-primary">State</Link>
            <ArrowRight className="h-3 w-3" />
            <span>{stateName}</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
              {stateName} Legislature
            </h1>
            
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bills Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold text-primary">Recent Bills</h2>
                {totalBillsCount > 0 && (
                  <Badge variant="secondary" className="ml-2">{totalBillsCount}</Badge>
                )}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/state/${stateCode.toLowerCase()}/bill`}>
                  View All <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading bills...</div>
            ) : recentBills.length > 0 ? (
              <div className="space-y-4">
                {recentBills.map((bill) => (
                  <Link 
                    key={bill.bill_id} 
                    href={`/state/${stateCode.toLowerCase()}/bill/${bill.number}`}
                    className="block"
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50">
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
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {bill.description}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No bills available for this session
              </div>
            )}
          </section>

          {/* Members Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold text-primary">Legislators</h2>
                {totalMembersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">{totalMembersCount}</Badge>
                )}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/state/${stateCode.toLowerCase()}/member`}>
                  View All <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading members...</div>
            ) : members.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {members.map((member) => (
                  <Link 
                    key={member.people_id} 
                    href={`/state/${stateCode.toLowerCase()}/member/${member.people_id}`}
                    className="block"
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {member.role}
                          </Badge>
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
                        <h3 className="font-semibold text-sm leading-tight mb-1">
                          {member.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {member.district}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No members available for this session
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}