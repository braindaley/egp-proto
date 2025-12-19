'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface PopularTopic {
  rank: number;
  type: 'campaign' | 'bill' | 'issue';
  title: string;
  subtitle?: string;
  viewUrl: string;
  advocacyUrl: string;
}

interface PopularTopicsCardProps {
  bioguideId: string;
  memberName: string;
  congress: string;
}

// Mock data - will be replaced with real Firestore query later
const MOCK_TOPICS: PopularTopic[] = [
  {
    rank: 1,
    type: 'campaign',
    title: 'League of Women Voters: HR 22',
    subtitle: 'John Lewis Voting Rights Act',
    viewUrl: '/campaigns/league-of-women-voters/hr-22',
    advocacyUrl: '/advocacy-message',
  },
  {
    rank: 2,
    type: 'bill',
    title: 'HR 1 - For the People Act',
    viewUrl: '/federal/bill/119/hr/1',
    advocacyUrl: '/advocacy-message',
  },
  {
    rank: 3,
    type: 'campaign',
    title: 'Common Cause: HR 1',
    subtitle: 'For the People Act',
    viewUrl: '/campaigns/common-cause/hr-1',
    advocacyUrl: '/advocacy-message',
  },
  {
    rank: 4,
    type: 'issue',
    title: 'Immigration Reform',
    viewUrl: '/issues/immigration-and-migration',
    advocacyUrl: '/advocacy-message',
  },
  {
    rank: 5,
    type: 'bill',
    title: 'S 442 - SAVE Act',
    viewUrl: '/federal/bill/119/s/442',
    advocacyUrl: '/advocacy-message',
  },
  {
    rank: 6,
    type: 'issue',
    title: 'Climate & Energy Policy',
    viewUrl: '/issues/climate-energy-and-environment',
    advocacyUrl: '/advocacy-message',
  },
  {
    rank: 7,
    type: 'campaign',
    title: 'ACLU: Criminal Justice Reform',
    subtitle: 'Second Chance Act',
    viewUrl: '/campaigns/aclu/criminal-justice',
    advocacyUrl: '/advocacy-message',
  },
];

function getTopicsWithUrls(bioguideId: string, congress: string): PopularTopic[] {
  // Add member-specific advocacy URLs to mock data
  return MOCK_TOPICS.map(topic => ({
    ...topic,
    advocacyUrl: topic.type === 'bill'
      ? `/advocacy-message?member=${bioguideId}&congress=${congress}`
      : topic.type === 'campaign'
      ? `/advocacy-message?member=${bioguideId}&congress=${congress}`
      : `/advocacy-message?member=${bioguideId}&congress=${congress}&issue=${encodeURIComponent(topic.title)}`,
  }));
}

function getRankStyle(rank: number): string {
  if (rank <= 3) {
    return 'bg-black text-white border-black';
  }
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

export function PopularTopicsCard({ bioguideId, memberName, congress }: PopularTopicsCardProps) {
  const topics = getTopicsWithUrls(bioguideId, congress);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Popular topics sent to {memberName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topics.map((topic) => (
            <div
              key={`${topic.type}-${topic.rank}`}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              {/* Rank indicator */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${getRankStyle(topic.rank)}`}
              >
                {topic.rank}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={topic.viewUrl}
                    className="font-medium text-primary hover:underline truncate"
                  >
                    {topic.title}
                  </Link>
                  <Badge variant="outline" className="text-xs">
                    {topic.type.charAt(0).toUpperCase() + topic.type.slice(1)}
                  </Badge>
                </div>
                {topic.subtitle && (
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    {topic.subtitle}
                  </p>
                )}
              </div>

              {/* Action button */}
              <Link href={topic.advocacyUrl} className="flex-shrink-0">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Voice Opinion</span>
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
