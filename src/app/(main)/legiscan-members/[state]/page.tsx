'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Loader2,
  Users,
  Building,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ExternalLink
} from 'lucide-react';
import { LEGISCAN_STATE_IDS } from '@/lib/legiscan-connector';
import { useSession } from '@/contexts/SessionContext';

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

interface LegiscanMember {
  people_id: number;
  person_hash: string;
  state_id: number;
  party_id: string;
  party: string;
  role_id: number;
  role: string;
  name: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  nickname?: string;
  district?: string;
  ftm_eid?: number;
  votesmart_id?: number;
  opensecrets_id?: string;
  knowwho_pid?: number;
  ballotpedia?: string;
  bio_text?: string;
  committee_sponsor?: number;
  committee_id?: number;
}

interface LegiscanMemberCardProps {
  member: LegiscanMember;
  stateName: string;
}

function LegiscanMemberCard({ member, stateName }: LegiscanMemberCardProps) {
  const getPartyColor = (partyId: string) => {
    switch (partyId.toUpperCase()) {
      case 'D': return 'bg-blue-600';
      case 'R': return 'bg-red-600';
      case 'I': return 'bg-purple-600';
      default: return 'bg-gray-500';
    }
  };

  const getPartyName = (partyId: string) => {
    switch (partyId.toUpperCase()) {
      case 'D': return 'Democratic';
      case 'R': return 'Republican';
      case 'I': return 'Independent';
      default: return partyId;
    }
  };

  const getRoleDisplay = (role: string) => {
    if (role.toLowerCase().includes('senator') || role.toLowerCase().includes('senate')) {
      return 'Senator';
    }
    if (role.toLowerCase().includes('representative') || role.toLowerCase().includes('assembly')) {
      return 'Representative';
    }
    return role;
  };

  return (
    <Link href={`/legiscan-members/member/${member.people_id}`} className="flex h-full">
      <Card className="flex flex-col w-full hover:shadow-lg transition-shadow duration-200 h-full">
        <CardContent className="flex-1 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {member.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {getRoleDisplay(member.role)} • {stateName}
              {member.district && ` (District ${member.district})`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div 
              className={`w-3 h-3 rounded-full ${getPartyColor(member.party_id)}`} 
              title={getPartyName(member.party_id)}
            />
            <Badge variant="outline" className="text-xs">
              {member.party_id}
            </Badge>
          </div>
        </div>

        {member.bio_text && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {member.bio_text.substring(0, 150)}...
          </p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building className="h-4 w-4" />
            <span>{getRoleDisplay(member.role)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{getPartyName(member.party_id)} Party</span>
          </div>

          {member.district && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>District {member.district}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {member.ballotpedia && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(member.ballotpedia, '_blank');
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ballotpedia
            </Button>
          )}
          
          {member.votesmart_id && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(`https://votesmart.org/candidate/${member.votesmart_id}`, '_blank');
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              VoteSmart
            </Button>
          )}
          <div className="mt-auto pt-2">
            <div className="text-xs text-primary font-semibold">
              View Profile →
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}

export default function LegiscanMembersPage() {
  const params = useParams();
  const stateCode = (params.state as string)?.toUpperCase();
  
  const { currentSession, setCurrentState, currentState } = useSession();
  const [members, setMembers] = useState<LegiscanMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stateName = states.find(s => s.abbr === stateCode)?.name || stateCode;

  // Set the current state based on URL parameter
  useEffect(() => {
    if (stateCode && stateCode !== currentState) {
      setCurrentState(stateCode);
    }
  }, [stateCode, currentState, setCurrentState]);

  // Fetch members for selected session
  useEffect(() => {
    async function fetchMembers() {
      if (!currentSession) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Get people for this session
        const peopleResponse = await fetch(`/api/legiscan?action=session-people&sessionId=${currentSession.session_id}`);
        const peopleData = await peopleResponse.json();
        
        if (peopleData.status !== 'success') {
          throw new Error(peopleData.error?.message || 'Failed to fetch legislators');
        }
        
        // Transform the data to match our interface
        const legislators = peopleData.data?.sessionpeople?.people || [];
        setMembers(legislators);
        
      } catch (error: any) {
        console.error('Error fetching members:', error);
        setError(error.message || 'Failed to load legislators');
        // Fall back to mock data on error
        createMockMembers();
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, [currentSession]);

    function createMockMembers() {
      // Create comprehensive mock member data
      const mockMembers: LegiscanMember[] = [
        // Senators
        {
          people_id: 1001,
          person_hash: 'abc123',
          state_id: LEGISCAN_STATE_IDS[stateCode as keyof typeof LEGISCAN_STATE_IDS] || 1,
          party_id: 'D',
          party: 'Democratic',
          role_id: 1,
          role: 'Senator',
          name: 'Sarah Johnson',
          first_name: 'Sarah',
          last_name: 'Johnson',
          bio_text: 'Senator Sarah Johnson has served the people of ' + stateName + ' with distinction, focusing on healthcare, education, and environmental protection. She previously served in the state legislature for 8 years.',
          ballotpedia: 'https://ballotpedia.org/Sarah_Johnson',
          votesmart_id: 12345
        },
        {
          people_id: 1002,
          person_hash: 'def456',
          state_id: LEGISCAN_STATE_IDS[stateCode as keyof typeof LEGISCAN_STATE_IDS] || 1,
          party_id: 'R',
          party: 'Republican',
          role_id: 1,
          role: 'Senator',
          name: 'Michael Davis',
          first_name: 'Michael',
          last_name: 'Davis',
          bio_text: 'Senator Michael Davis is a conservative voice for ' + stateName + ', advocating for fiscal responsibility, small government, and traditional values. He has a background in business and served as mayor before joining the Senate.',
          ballotpedia: 'https://ballotpedia.org/Michael_Davis',
          votesmart_id: 67890
        },
        // Representatives
        {
          people_id: 2001,
          person_hash: 'ghi789',
          state_id: LEGISCAN_STATE_IDS[stateCode as keyof typeof LEGISCAN_STATE_IDS] || 1,
          party_id: 'D',
          party: 'Democratic',
          role_id: 2,
          role: 'Representative',
          name: 'Maria Rodriguez',
          first_name: 'Maria',
          last_name: 'Rodriguez',
          district: '1',
          bio_text: 'Representative Maria Rodriguez represents District 1 with a focus on immigration reform, workers\' rights, and affordable housing. She is the first Latina to represent this district.',
          ballotpedia: 'https://ballotpedia.org/Maria_Rodriguez',
          votesmart_id: 11111
        },
        {
          people_id: 2002,
          person_hash: 'jkl012',
          state_id: LEGISCAN_STATE_IDS[stateCode as keyof typeof LEGISCAN_STATE_IDS] || 1,
          party_id: 'R',
          party: 'Republican',
          role_id: 2,
          role: 'Representative',
          name: 'James Wilson',
          first_name: 'James',
          last_name: 'Wilson',
          district: '2',
          bio_text: 'Representative James Wilson serves District 2 with emphasis on agricultural interests, rural development, and conservative fiscal policies. He comes from a farming background.',
          ballotpedia: 'https://ballotpedia.org/James_Wilson',
          votesmart_id: 22222
        },
        {
          people_id: 2003,
          person_hash: 'mno345',
          state_id: LEGISCAN_STATE_IDS[stateCode as keyof typeof LEGISCAN_STATE_IDS] || 1,
          party_id: 'D',
          party: 'Democratic',
          role_id: 2,
          role: 'Representative',
          name: 'Jennifer Lee',
          first_name: 'Jennifer',
          last_name: 'Lee',
          district: '3',
          bio_text: 'Representative Jennifer Lee represents District 3 with a focus on technology policy, education reform, and climate action. She previously worked in the tech industry.',
          ballotpedia: 'https://ballotpedia.org/Jennifer_Lee',
          votesmart_id: 33333
        },
        {
          people_id: 2004,
          person_hash: 'pqr678',
          state_id: LEGISCAN_STATE_IDS[stateCode as keyof typeof LEGISCAN_STATE_IDS] || 1,
          party_id: 'I',
          party: 'Independent',
          role_id: 2,
          role: 'Representative',
          name: 'Robert Thompson',
          first_name: 'Robert',
          last_name: 'Thompson',
          district: '4',
          bio_text: 'Representative Robert Thompson serves District 4 as an Independent, focusing on bipartisan solutions to healthcare, infrastructure, and government transparency.',
          ballotpedia: 'https://ballotpedia.org/Robert_Thompson',
          votesmart_id: 44444
        }
      ];
      setMembers(mockMembers);
    }

  // Separate members by chamber
  const senators = members.filter(member => 
    member.role.toLowerCase().includes('senator') || member.role.toLowerCase().includes('senate')
  );
  
  const representatives = members.filter(member => 
    member.role.toLowerCase().includes('representative') || member.role.toLowerCase().includes('assembly')
  );

  if (loading) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div className="text-lg">Loading {stateName} legislators...</div>
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
              <div className="text-lg font-medium mb-4 text-red-500">Error Loading Legislators</div>
              <div className="text-gray-600 mb-4">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-6 md:py-12 max-w-2xl">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/states" className="hover:text-primary">States</Link>
          <span>→</span>
          <Link href={`/states/${stateCode.toLowerCase()}`} className="hover:text-primary">{stateName}</Link>
          <span>→</span>
          <span className="text-foreground">Legislators</span>
        </nav>

        <header className="text-center mb-12">
          <p className="text-lg text-muted-foreground font-medium mb-1">State Legislature</p>
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
            {stateName}
          </h1>
          <p className="text-lg text-muted-foreground">
            Your State Senators and Representatives
            {currentSession && (
              <span className="block text-sm mt-1">
                {currentSession.session_name || currentSession.name} ({currentSession.year_start}-{currentSession.year_end})
              </span>
            )}
          </p>
          
          <div className="mt-6">
            <Button variant="outline" asChild>
              <Link href={`/states/${stateCode.toLowerCase()}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {stateName} Bills
              </Link>
            </Button>
          </div>
        </header>
        
        
        {/* Senate Section */}
        <section>
          <h2 className="font-headline text-3xl font-bold text-primary mb-6 border-b pb-3">
            State Senate ({senators.length})
          </h2>
          {senators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {senators.map((senator) => (
                <LegiscanMemberCard 
                  key={senator.people_id} 
                  member={senator} 
                  stateName={stateName}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground mb-12">Could not load senators at this time.</p>
          )}
        </section>

        {/* House/Assembly Section */}
        <section>
          <h2 className="font-headline text-3xl font-bold text-primary mb-6 border-b pb-3">
            State House ({representatives.length})
          </h2>
          {representatives.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {representatives.map((representative) => (
                <LegiscanMemberCard 
                  key={representative.people_id} 
                  member={representative} 
                  stateName={stateName}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Could not load representatives at this time.</p>
          )}
        </section>
      </div>
      
      <footer className="text-center py-6 text-sm text-muted-foreground">
        <p>
          State legislator data provided by{' '}
          <a href="https://legiscan.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            LegiScan
          </a>
        </p>
      </footer>
    </div>
  );
}