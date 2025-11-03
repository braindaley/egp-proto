'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Header with Badge and Organization */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
            Poll
          </Badge>
          <span className="text-sm text-muted-foreground">{groupName}</span>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold mb-2">{pollTitle}</h3>

        {/* Question */}
        <h4 className="text-lg text-muted-foreground mb-4">{pollQuestion}</h4>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground mb-4">
            {description}
          </p>
        )}

        {/* Options */}
        {choices && choices.length > 0 && (
          <div className="mb-6">
            <h5 className="font-semibold mb-2">Options</h5>
            <ul className="list-disc list-inside space-y-1">
              {choices.map((choice, index) => (
                <li key={index} className="text-sm text-muted-foreground">{choice}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Button */}
        <Button asChild size="lg" className="w-full">
          <Link href={`/advocacy-message?poll=${pollId}`}>
            Voice your opinion
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
