'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

interface CandidateCampaignFeedCardProps {
  candidate1Name: string;
  candidate1Bio?: string;
  candidate2Name: string;
  candidate2Bio?: string;
  selectedCandidate: 1 | 2;
  position: string;
  reasoning: string;
  supportCount: number;
  opposeCount: number;
  groupSlug?: string;
  groupName?: string;
  policyIssue?: string;
}

export function CandidateCampaignFeedCard({
  candidate1Name,
  candidate1Bio,
  candidate2Name,
  candidate2Bio,
  selectedCandidate,
  position,
  reasoning,
  supportCount,
  opposeCount,
  groupSlug,
  groupName,
  policyIssue = 'National Conditions'
}: CandidateCampaignFeedCardProps) {
  const router = useRouter();
  const supportedCandidateName = selectedCandidate === 1 ? candidate1Name : candidate2Name;

  const handleVoiceOpinionClick = () => {
    const params = new URLSearchParams({
      candidate1: candidate1Name,
      candidate2: candidate2Name,
    });

    if (candidate1Bio) params.set('candidate1Bio', candidate1Bio);
    if (candidate2Bio) params.set('candidate2Bio', candidate2Bio);

    router.push(`/advocacy-message?${params.toString()}`);
  };

  // Truncate reasoning to max 3 lines (approx 120 chars for better mobile fit)
  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <Card className="relative w-full overflow-hidden">
      <CardContent className="p-6">
        <Badge variant="secondary" className="mb-2 w-fit text-xs px-2 py-1">
          {policyIssue}
        </Badge>

        <div className="text-xs text-muted-foreground mb-2">
          {groupName} supports {supportedCandidateName}
        </div>

        <h3 className="text-base md:text-lg font-bold mb-3">
          {candidate1Name} vs {candidate2Name}
        </h3>

        {/* Stacked candidate layout */}
        <div className="grid grid-cols-1 gap-3 mb-4">
          <div className={`p-3 rounded-lg border ${selectedCandidate === 1 ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <div className="font-semibold text-sm mb-1">{candidate1Name}</div>
            {candidate1Bio && (
              <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {truncateText(candidate1Bio, 80)}
              </div>
            )}
            {selectedCandidate === 1 && (
              <Badge variant="default" className="text-xs px-2 py-0.5">Endorsed</Badge>
            )}
          </div>
          <div className={`p-3 rounded-lg border ${selectedCandidate === 2 ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <div className="font-semibold text-sm mb-1">{candidate2Name}</div>
            {candidate2Bio && (
              <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {truncateText(candidate2Bio, 80)}
              </div>
            )}
            {selectedCandidate === 2 && (
              <Badge variant="default" className="text-xs px-2 py-0.5">Endorsed</Badge>
            )}
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
          {truncateText(reasoning, 180)}
        </p>

        <Button
          size="sm"
          variant="default"
          className="w-full md:w-auto"
          onClick={handleVoiceOpinionClick}
        >
          {position} {supportedCandidateName}
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
