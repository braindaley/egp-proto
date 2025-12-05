'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
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
  choices?: string[];
}

export function PollCampaignFeedCard({
  groupName,
  groupSlug,
  pollTitle,
  pollQuestion,
  description,
  responseCount = 0,
  pollId,
  campaignUrl,
  choices = []
}: PollCampaignFeedCardProps) {
  return (
    <Card className="relative w-full overflow-hidden">
      <CardContent className="p-6">
        <Badge variant="secondary" className="mb-2 w-fit text-xs px-2 py-1 bg-purple-100 text-purple-700">
          Poll
        </Badge>

        <div className="text-xs text-muted-foreground mb-2">
          {groupName}
        </div>

        <h3 className="text-base md:text-lg font-bold mb-3">{pollTitle}</h3>

        <p className="text-muted-foreground text-sm mb-4">
          {pollQuestion}
        </p>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground mb-4">
            {description}
          </p>
        )}

        {/* Stacked options layout */}
        {choices && choices.length > 0 && (
          <div className="grid grid-cols-1 gap-3 mb-4">
            {choices.map((choice, index) => (
              <div key={index} className="p-3 rounded-lg border border-border">
                <div className="font-semibold text-sm">{choice}</div>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <Button asChild size="sm" variant="default" className="w-full md:w-auto">
          <Link href={`/advocacy-message?poll=${pollId}`}>
            Voice your opinion
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
