'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface PollCampaignCardProps {
  groupName: string;
  groupSlug: string;
  poll: {
    title: string;
    question: string;
    answerType: 'multiple-choice-single' | 'multiple-choice-multiple' | 'open-text';
    choices?: string[];
    description?: string;
    imageUrl?: string;
  };
  responseCount?: number;
  results?: {
    [choice: string]: number;
  };
  pollId: string;
}

export function PollCampaignCard({
  groupName,
  groupSlug,
  poll,
  responseCount = 0,
  results = {},
  pollId
}: PollCampaignCardProps) {
  // Calculate percentages for each choice
  const getPercentage = (choice: string): number => {
    if (responseCount === 0) return 0;
    return Math.round(((results[choice] || 0) / responseCount) * 100);
  };

  const getVoteCount = (choice: string): number => {
    return results[choice] || 0;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
            Poll
          </Badge>
          <span className="text-sm text-muted-foreground">{groupName}</span>
        </div>

        <h1 className="text-3xl font-bold mb-3">{poll.title}</h1>
        <h2 className="text-xl text-muted-foreground mb-4">{poll.question}</h2>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Poll Image */}
        {poll.imageUrl && (
          <div className="relative w-full h-64 rounded-lg overflow-hidden">
            <Image
              src={poll.imageUrl}
              alt={poll.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Poll Description */}
        {poll.description && (
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground">{poll.description}</p>
          </div>
        )}

        {/* Answer Choices with Results */}
        {poll.answerType !== 'open-text' && poll.choices && poll.choices.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Current Results</h3>
            {poll.choices.map((choice, index) => {
              const percentage = getPercentage(choice);
              const voteCount = getVoteCount(choice);

              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span>{choice}</span>
                    <span className="text-muted-foreground">
                      {percentage}% ({voteCount} {voteCount === 1 ? 'vote' : 'votes'})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Open Text Poll Message */}
        {poll.answerType === 'open-text' && (
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              This is an open-ended poll where respondents share their thoughts in their own words.
            </p>
          </div>
        )}

        {/* Participation Count */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="text-sm">
            {responseCount} {responseCount === 1 ? 'person has' : 'people have'} responded
          </span>
        </div>

        {/* Take the Poll Button */}
        <Button asChild size="lg" className="w-full">
          <Link href={`/advocacy-message?poll=${pollId}`}>
            Take the Poll
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
