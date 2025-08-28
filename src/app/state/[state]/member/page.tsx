'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Calendar, Users, Search, Loader2, ArrowLeft, ExternalLink } from 'lucide-react';

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

export default function StateMembersPage() {
  const params = useParams();
  const stateCode = (params.state as string)?.toUpperCase();
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [chamberFilter, setChamberFilter] = useState('all');
  const [partyFilter, setPartyFilter] = useState('all');

  const stateName = states.find(s => s.abbr === stateCode)?.name || stateCode;

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

  // Fetch members when session is available
  useEffect(() => {
    async function fetchMembers() {
      if (!currentSession) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/legiscan?action=session-people&sessionId=${currentSession.session_id}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.data?.sessionpeople?.people) {
          setMembers(data.data.sessionpeople.people);
          setFilteredMembers(data.data.sessionpeople.people);
        }
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, [currentSession]);

  // Filter members based on search, chamber, and party
  useEffect(() => {
    let filtered = members;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member =>
        member.name?.toLowerCase().includes(query) ||
        member.district?.toLowerCase().includes(query)
      );
    }

    // Apply chamber filter
    if (chamberFilter !== 'all') {
      filtered = filtered.filter(member => {
        const role = member.role?.toLowerCase() || '';
        if (chamberFilter === 'senate') {
          return role.includes('sen');
        } else if (chamberFilter === 'house') {
          return role.includes('rep') || role.includes('house');
        }
        return true;
      });
    }

    // Apply party filter
    if (partyFilter !== 'all') {
      filtered = filtered.filter(member => member.party === partyFilter);
    }

    setFilteredMembers(filtered);
  }, [members, searchQuery, chamberFilter, partyFilter]);

  // Get unique parties for filter
  const parties = [...new Set(members.map(member => member.party).filter(Boolean))];

  // Separate by chamber
  const senators = filteredMembers.filter(member => 
    member.role?.toLowerCase().includes('sen')
  );
  const representatives = filteredMembers.filter(member => 
    member.role?.toLowerCase().includes('rep') || member.role?.toLowerCase().includes('house')
  );

  if (!currentSession) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-muted-foreground mb-4">
              Select a Legislative Session
            </h1>
            <p className="text-muted-foreground">
              Please select a session from the header to view {stateName} legislators.
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
            <span>Members</span>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
                {stateName} Legislators
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
                  placeholder="Search members by name or district..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={chamberFilter} onValueChange={setChamberFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chambers</SelectItem>
                <SelectItem value="senate">Senate</SelectItem>
                <SelectItem value="house">House</SelectItem>
              </SelectContent>
            </Select>
            <Select value={partyFilter} onValueChange={setPartyFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parties</SelectItem>
                {parties.map((party) => (
                  <SelectItem key={party} value={party}>
                    {party}
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
                Loading members...
              </div>
            ) : (
              <span>
                Showing {filteredMembers.length} of {members.length} legislators
                {searchQuery && ` matching "${searchQuery}"`}
              </span>
            )}
          </div>
        </div>

        {/* Members List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading legislators...</p>
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="space-y-12">
            {/* Senate Section */}
            {senators.length > 0 && (
              <section>
                <h2 className="font-headline text-2xl font-bold text-primary mb-6 border-b pb-3">
                  State Senate ({senators.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {senators.map((member) => (
                    <Link 
                      key={member.people_id}
                      href={`/state/${stateCode.toLowerCase()}/member/${member.people_id}`}
                      className="block"
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50 h-full">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="secondary" className="text-xs">
                              {member.role}
                            </Badge>
                            <div className="flex items-center gap-1">
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
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </div>
                          <h3 className="font-semibold leading-tight mb-2">
                            {member.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {member.district}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* House Section */}
            {representatives.length > 0 && (
              <section>
                <h2 className="font-headline text-2xl font-bold text-primary mb-6 border-b pb-3">
                  State House ({representatives.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {representatives.map((member) => (
                    <Link 
                      key={member.people_id}
                      href={`/state/${stateCode.toLowerCase()}/member/${member.people_id}`}
                      className="block"
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50 h-full">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="secondary" className="text-xs">
                              {member.role}
                            </Badge>
                            <div className="flex items-center gap-1">
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
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </div>
                          <h3 className="font-semibold leading-tight mb-2">
                            {member.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {member.district}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No legislators found</h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? `No legislators match your search for "${searchQuery}"`
                : 'No legislators available for this session'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}