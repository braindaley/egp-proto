'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Download, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface PollResponse {
  id: string;
  campaignId: string;
  candidate1Name: string;
  candidate2Name: string;
  selectedCandidate: '1' | '2';
  userId?: string;
  timestamp: any;
  metadata?: {
    zipCode?: string;
    userState?: string;
  };
}

interface PollStats {
  totalVotes: number;
  candidate1Votes: number;
  candidate2Votes: number;
  candidate1Percentage: number;
  candidate2Percentage: number;
  responses: PollResponse[];
}

export default function PollResultsPage({ params }: { params: { campaignId: string } }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<PollStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPollResults() {
      if (!user) return;

      try {
        const { campaignId } = await params;
        const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore');
        const { app } = await import('@/lib/firebase');
        const db = getFirestore(app);

        // Query poll responses for this campaign
        const pollQuery = query(
          collection(db, 'candidate_poll_responses'),
          where('campaignId', '==', campaignId)
        );

        const querySnapshot = await getDocs(pollQuery);
        const responses: PollResponse[] = [];

        querySnapshot.forEach((doc) => {
          responses.push({
            id: doc.id,
            ...doc.data()
          } as PollResponse);
        });

        // Calculate stats
        const candidate1Votes = responses.filter(r => r.selectedCandidate === '1').length;
        const candidate2Votes = responses.filter(r => r.selectedCandidate === '2').length;
        const totalVotes = responses.length;

        const pollStats: PollStats = {
          totalVotes,
          candidate1Votes,
          candidate2Votes,
          candidate1Percentage: totalVotes > 0 ? (candidate1Votes / totalVotes) * 100 : 0,
          candidate2Percentage: totalVotes > 0 ? (candidate2Votes / totalVotes) * 100 : 0,
          responses
        };

        setStats(pollStats);
      } catch (err) {
        setError('Failed to load poll results');
        console.error('Error loading poll results:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPollResults();
  }, [params, user]);

  const handleExportCSV = () => {
    if (!stats || !stats.responses.length) return;

    // Create CSV content
    const headers = ['Timestamp', 'Selected Candidate', 'Candidate 1 Name', 'Candidate 2 Name', 'User ID', 'Zip Code', 'State'];
    const rows = stats.responses.map(response => [
      response.timestamp?.toDate?.()?.toISOString() || '',
      response.selectedCandidate === '1' ? response.candidate1Name : response.candidate2Name,
      response.candidate1Name,
      response.candidate2Name,
      response.userId || 'Anonymous',
      response.metadata?.zipCode || '',
      response.metadata?.userState || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poll-results-${params.campaignId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md p-8 text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Access Restricted</CardTitle>
            <CardDescription>Please log in to view poll results.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-[800px]">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || 'No poll results found'}</p>
            <Button className="mt-4" asChild>
              <Link href="/partners">Back to Campaigns</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const candidate1Name = stats.responses[0]?.candidate1Name || 'Candidate 1';
  const candidate2Name = stats.responses[0]?.candidate2Name || 'Candidate 2';

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-[1000px]">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/partners">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Poll Results</h1>
            <p className="text-muted-foreground">
              {candidate1Name} vs {candidate2Name}
            </p>
          </div>
          <Button onClick={handleExportCSV} disabled={stats.totalVotes === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div className="text-3xl font-bold">{stats.totalVotes}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{candidate1Name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.candidate1Percentage.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.candidate1Votes} {stats.candidate1Votes === 1 ? 'vote' : 'votes'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{candidate2Name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {stats.candidate2Percentage.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.candidate2Votes} {stats.candidate2Votes === 1 ? 'vote' : 'votes'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Visual Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Vote Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{candidate1Name}</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.candidate1Votes} votes ({stats.candidate1Percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all"
                    style={{ width: `${stats.candidate1Percentage}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{candidate2Name}</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.candidate2Votes} votes ({stats.candidate2Percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-4">
                  <div
                    className="bg-purple-600 h-4 rounded-full transition-all"
                    style={{ width: `${stats.candidate2Percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Responses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Responses</CardTitle>
            <CardDescription>Latest poll submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.responses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No responses yet</p>
            ) : (
              <div className="space-y-2">
                {stats.responses
                  .sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0))
                  .slice(0, 10)
                  .map((response) => (
                    <div
                      key={response.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          response.selectedCandidate === '1' ? 'bg-blue-600' : 'bg-purple-600'
                        }`} />
                        <span className="font-medium">
                          {response.selectedCandidate === '1' ? candidate1Name : candidate2Name}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {response.timestamp?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
