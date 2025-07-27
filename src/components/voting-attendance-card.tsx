'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { MemberVote, ChamberVoteSummary } from '@/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VotingAttendanceCardProps {
  bioguideId: string;
  congress: string;
  chamber: string;
}

interface VotingStats {
  attendanceRate: number;
  recentAttendanceRate: number;
  chamberAverage: number;
  totalMemberVotes: number;
  totalChamberVotes: number;
  lastVoteDate: string;
  isAboveAverage: boolean;
  trend: 'up' | 'down' | 'same';
}

function formatDate(dateString: string | undefined) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString.includes('T') ? dateString : `${dateString}T12:00:00Z`);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export function VotingAttendanceCard({ bioguideId, congress, chamber }: VotingAttendanceCardProps) {
  const [stats, setStats] = useState<VotingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVotingData() {
      setLoading(true);
      setError(null);
      
      const chamberName = chamber.toLowerCase() === 'house of representatives' ? 'house' : 'senate';

      try {
        const [memberRes, chamberRes] = await Promise.all([
          fetch(`/api/congress/member/${bioguideId}/votes?congress=${congress}`),
          fetch(`/api/congress/chamber-votes?congress=${congress}&chamber=${chamberName}`)
        ]);

        if (!memberRes.ok || !chamberRes.ok) {
          throw new Error('Failed to fetch voting data');
        }

        const memberVotes: MemberVote[] = await memberRes.json();
        const chamberVotes: ChamberVoteSummary = await chamberRes.json();

        if (!chamberVotes.votes || chamberVotes.votes.length === 0) {
            throw new Error('Chamber vote data is unavailable.');
        }

        // Calculate attendance rate
        const totalMemberVotes = memberVotes.length;
        const totalChamberVotes = chamberVotes.totalVotes;
        const attendanceRate = totalChamberVotes > 0 ? (totalMemberVotes / totalChamberVotes) * 100 : 0;
        
        // Calculate recent activity (last 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const recentMemberVotes = memberVotes.filter(v => new Date(v.vote.date) > ninetyDaysAgo);
        const recentChamberVotes = chamberVotes.votes.filter(v => new Date(v.date) > ninetyDaysAgo);
        
        const recentAttendanceRate = recentChamberVotes.length > 0 ? (recentMemberVotes.length / recentChamberVotes.length) * 100 : 0;
        
        // Calculate trend
        let trend: 'up' | 'down' | 'same' = 'same';
        if (recentAttendanceRate > attendanceRate) trend = 'up';
        if (recentAttendanceRate < attendanceRate) trend = 'down';

        setStats({
          attendanceRate,
          recentAttendanceRate,
          chamberAverage: chamberVotes.averageAttendance * 100,
          totalMemberVotes,
          totalChamberVotes,
          lastVoteDate: memberVotes.length > 0 ? memberVotes[0].vote.date : 'N/A',
          isAboveAverage: attendanceRate > (chamberVotes.averageAttendance * 100),
          trend,
        });

      } catch (e) {
        console.error(e);
        setError('Data unavailable');
      } finally {
        setLoading(false);
      }
    }

    fetchVotingData();
  }, [bioguideId, congress, chamber]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-4 w-40 mt-2" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <Skeleton className="h-6 w-full mt-4" />
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Floor Vote Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  const getAttendanceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const TrendIcon = () => {
    if (stats.trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (stats.trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl">Floor Vote Attendance</CardTitle>
        <p className="text-sm text-muted-foreground">{congress}th Congress</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          {/* Main Metric */}
          <div className="text-center md:text-left">
            <p className={`text-4xl font-bold ${getAttendanceColor(stats.attendanceRate)}`}>
              {stats.attendanceRate.toFixed(1)}%
            </p>
            <p className="text-muted-foreground text-sm">of floor votes attended</p>
          </div>
          {/* Context */}
          <div className="space-y-2 text-sm text-center md:text-left">
            <div className="flex justify-center md:justify-start items-center gap-2">
                <p>Chamber Average: {stats.chamberAverage.toFixed(1)}%</p>
                <Badge variant={stats.isAboveAverage ? 'default' : 'destructive'}>
                    {stats.isAboveAverage ? 'Above Average' : 'Below Average'}
                </Badge>
            </div>
            <div className="flex justify-center md:justify-start items-center gap-1">
                <p>Last 90 days: {stats.recentAttendanceRate.toFixed(1)}%</p>
                <TrendIcon />
            </div>
          </div>
        </div>
        <div className="text-center md:text-left text-sm text-muted-foreground pt-4 border-t">
          <p>
            {stats.totalMemberVotes.toLocaleString()} of {stats.totalChamberVotes.toLocaleString()} votes cast
          </p>
          <p>Last vote: {formatDate(stats.lastVoteDate)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
