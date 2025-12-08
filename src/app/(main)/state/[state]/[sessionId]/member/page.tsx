'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowRight } from 'lucide-react';
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

interface StateMember {
  people_id: number;
  name: string;
  party: string;
  role: string;
  district: string;
  committee_id?: number;
}

interface StateMemberCardProps {
  member: StateMember;
  stateParam: string;
  sessionId: string;
}

function StateMemberCard({ member, stateParam, sessionId }: StateMemberCardProps) {
  const partyColor = member.party === 'D'
    ? 'bg-blue-600'
    : member.party === 'R'
    ? 'bg-red-600'
    : 'bg-gray-500';

  const partyName = member.party === 'D'
    ? 'Democrat'
    : member.party === 'R'
    ? 'Republican'
    : member.party;

  const detailUrl = `/state/${stateParam}/${sessionId}/member/${member.people_id}`;

  return (
    <Link href={detailUrl} className="flex h-full">
      <Card className="flex flex-col w-full hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6 flex-grow">
          {/* Header with Basic Info */}
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar placeholder with initials */}
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0 bg-gray-100 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-500">
                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-gray-900 truncate mb-1">
                {member.name}
              </h3>

              <div className="flex items-center gap-2 mb-2">
                <Badge className={`text-white text-xs ${partyColor}`}>
                  {member.party}
                </Badge>
                <span className="text-sm text-gray-600">{member.role}</span>
              </div>

              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <MapPin className="w-3 h-3" />
                <span>{member.district}</span>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="mt-auto flex justify-end items-center text-xs text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-1 font-semibold text-primary">
            <span>View Member</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default function StateMembersPage({ params }: { params: Promise<{ state: string; sessionId: string }> }) {
  const { state: stateParam, sessionId } = use(params);
  const stateCode = stateParam?.toUpperCase();
  const stateName = states[stateParam?.toLowerCase()] || stateCode;

  const { isPremium, isLoading: premiumLoading } = usePremiumAccess();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [senators, setSenators] = useState<StateMember[]>([]);
  const [representatives, setRepresentatives] = useState<StateMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch session info and members
  useEffect(() => {
    async function fetchData() {
      if (!stateCode || !sessionId) return;

      setLoading(true);
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

        // Fetch members
        const membersResponse = await fetch(`/api/legiscan?action=session-people&sessionId=${sessionId}`);
        const membersData = await membersResponse.json();

        if (membersData.status === 'success' && membersData.data?.sessionpeople?.people) {
          const allMembers = membersData.data.sessionpeople.people as StateMember[];

          // Separate by chamber
          const senatorsList = allMembers.filter(member =>
            member.role?.toLowerCase().includes('sen')
          );
          const repsList = allMembers.filter(member =>
            member.role?.toLowerCase().includes('rep') ||
            member.role?.toLowerCase().includes('assembly') ||
            member.role?.toLowerCase().includes('delegate') ||
            (!member.role?.toLowerCase().includes('sen'))
          );

          // Filter out senators from reps list if they got included
          const filteredReps = repsList.filter(rep =>
            !senatorsList.some(sen => sen.people_id === rep.people_id)
          );

          setSenators(senatorsList);
          setRepresentatives(filteredReps);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [stateCode, sessionId]);

  // Show premium upgrade CTA for non-premium users
  if (!premiumLoading && !isPremium) {
    return (
      <PremiumUpgradeCTA
        variant="full-page"
        title="State Legislators"
        description={`Access ${stateName} legislators and their contact information with a premium membership.`}
      />
    );
  }

  const sessionName = sessionInfo?.session_name || sessionInfo?.name || `Session ${sessionId}`;

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-6 md:py-12 max-w-4xl">
        <header className="text-center mb-12">
          <p className="text-lg text-muted-foreground font-medium mb-1">{sessionName}</p>
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
            {stateName}
          </h1>
          <p className="text-lg text-muted-foreground">
            State Senators and Representatives
          </p>
        </header>

        {loading ? (
          <div className="text-center py-12">Loading legislators...</div>
        ) : (
          <>
            <section>
              <h2 className="font-headline text-3xl font-bold text-primary mb-6 border-b pb-3">State Senate</h2>
              {senators.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {senators.map((senator) => (
                    <StateMemberCard
                      key={senator.people_id}
                      member={senator}
                      stateParam={stateParam}
                      sessionId={sessionId}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No senators found for this session.</p>
              )}
            </section>

            <section className="mt-12">
              <h2 className="font-headline text-3xl font-bold text-primary mb-6 border-b pb-3">State House</h2>
              {representatives.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {representatives.map((rep) => (
                    <StateMemberCard
                      key={rep.people_id}
                      member={rep}
                      stateParam={stateParam}
                      sessionId={sessionId}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No representatives found for this session.</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
