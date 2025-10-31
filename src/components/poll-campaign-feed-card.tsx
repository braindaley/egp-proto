'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users } from 'lucide-react';
import Link from 'next/link';

interface PollCampaignFeedCardProps {
  groupName: string;
  groupSlug: string;
  pollTitle: string;
  pollQuestion: string;
  description?: string;
  responseCount?: number;
  pollId: string;
  campaignUrl: string;
}

export function PollCampaignFeedCard({
  groupName,
  groupSlug,
  pollTitle,
  pollQuestion,
  description,
  responseCount = 0,
  pollId,
  campaignUrl
}: PollCampaignFeedCardProps) {
  // Truncate description to 150 characters
  const truncatedDescription = description && description.length > 150
    ? description.substring(0, 150) + '...'
    : description;

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardContent className="p-6 flex flex-col flex-1">
        {/* Header with Badge and Organization */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
            Poll
          </Badge>
          <span className="text-sm text-muted-foreground line-clamp-1">{groupName}</span>
        </div>

        {/* Poll Question as Heading */}
        <Link
          href={campaignUrl}
          className="group"
        >
          <h3 className="text-lg font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {pollQuestion}
          </h3>
        </Link>

        {/* Description */}
        {truncatedDescription && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
            {truncatedDescription}
          </p>
        )}

        {/* Footer with Response Count and Action Button */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">
              {responseCount} {responseCount === 1 ? 'response' : 'responses'}
            </span>
          </div>

          <Button asChild variant="ghost" size="sm" className="group">
            <Link href={`/advocacy-message?poll=${pollId}`}>
              Share your opinion
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
