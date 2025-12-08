'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
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

export default function StateLandingPage() {
  const params = useParams();
  const stateParam = params.state as string;
  const stateCode = stateParam?.toUpperCase();
  const stateName = states[stateParam?.toLowerCase()] || stateCode;

  const { isPremium, isLoading: premiumLoading } = usePremiumAccess();
  const [latestSessionId, setLatestSessionId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sessions to determine the latest session ID
  useEffect(() => {
    async function fetchSessions() {
      if (!stateCode) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/legiscan?action=sessions&state=${stateCode}`);
        const data = await response.json();

        if (data.status === 'success' && data.data?.sessions) {
          const sessionsList = data.data.sessions;

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
            const selectedSession = activeSession || recentSession || sessionsList[0];
            setLatestSessionId(selectedSession.session_id.toString());
            setSessionName(selectedSession.session_name || selectedSession.name || `${selectedSession.year_start}-${selectedSession.year_end}`);
          }
        } else {
          setError('Unable to load legislative sessions');
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Unable to load legislative sessions');
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, [stateCode]);

  // Show premium upgrade CTA for non-premium users
  if (!premiumLoading && !isPremium) {
    return (
      <PremiumUpgradeCTA
        variant="full-page"
        title="State Legislation"
        description={`Access ${stateName} bills, legislators, and legislative sessions with a premium membership.`}
      />
    );
  }

  if (loading) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !latestSessionId) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-muted-foreground mb-4">
              Unable to Load {stateName} Legislature
            </h1>
            <p className="text-muted-foreground">
              {error || 'No legislative sessions available for this state.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
            {stateName} Legislature
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore state legislative information and legislator data
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <Link href={`/state/${stateParam}/${latestSessionId}/member`} className="block">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Legislature ({sessionName})</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  View state senators and representatives for the {sessionName} session.
                </p>
                <div className="text-sm text-primary font-medium">
                  View Members →
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/state/${stateParam}/${latestSessionId}/bill`} className="block">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Bills ({sessionName})</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Browse and search through bills from the {sessionName} session, organized by policy issues.
                </p>
                <div className="text-sm text-primary font-medium">
                  View Bills →
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <footer className="text-center py-6 text-sm text-muted-foreground mt-12">
          <p>Data provided by <a href="https://legiscan.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">LegiScan</a>.</p>
        </footer>
      </div>
    </div>
  );
}
