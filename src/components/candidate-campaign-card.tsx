'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { parseSimpleMarkdown } from '@/lib/markdown-utils';
import { ThumbsUp, ThumbsDown, Users } from 'lucide-react';

interface CandidateCampaignCardProps {
  candidate1Name: string;
  candidate1Bio?: string;
  candidate2Name: string;
  candidate2Bio?: string;
  selectedCandidate: 1 | 2;
  position: string;
  reasoning: string;
  actionButtonText: string;
  supportCount: number;
  opposeCount: number;
  groupSlug?: string;
  groupName?: string;
}

const CandidateCampaignCard: React.FC<CandidateCampaignCardProps> = ({
  candidate1Name,
  candidate1Bio,
  candidate2Name,
  candidate2Bio,
  selectedCandidate,
  position,
  reasoning,
  actionButtonText,
  supportCount,
  opposeCount,
  groupSlug,
  groupName
}) => {
  const router = useRouter();

  const supportedCandidateName = selectedCandidate === 1 ? candidate1Name : candidate2Name;
  const opposingCandidateName = selectedCandidate === 1 ? candidate2Name : candidate1Name;

  const isSupport = position.toLowerCase().includes('support');
  const badgeVariant = isSupport ? 'default' : 'destructive';
  const PositionIcon = isSupport ? ThumbsUp : ThumbsDown;

  const handleVoiceOpinionClick = () => {
    const params = new URLSearchParams({
      candidate1: candidate1Name,
      candidate2: candidate2Name,
    });

    if (candidate1Bio) params.set('candidate1Bio', candidate1Bio);
    if (candidate2Bio) params.set('candidate2Bio', candidate2Bio);

    router.push(`/advocacy-message?${params.toString()}`);
  };

  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex flex-col gap-3">
          {/* Group Name's Opinion */}
          {groupName && (
            <p className="text-sm font-medium text-muted-foreground">
              {groupName} supports {supportedCandidateName}
            </p>
          )}

          {/* Candidate Race Title */}
          <CardTitle className="text-lg sm:text-xl font-bold leading-tight">
            <span>{candidate1Name} vs {candidate2Name}</span>
          </CardTitle>

          {/* Candidates Summary */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={`p-3 rounded-lg border-2 ${selectedCandidate === 1 ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div className="font-semibold text-foreground">{candidate1Name}</div>
              {candidate1Bio && (
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{candidate1Bio}</div>
              )}
              {selectedCandidate === 1 && (
                <Badge variant="default" className="mt-2 text-xs">Endorsed</Badge>
              )}
            </div>
            <div className={`p-3 rounded-lg border-2 ${selectedCandidate === 2 ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div className="font-semibold text-foreground">{candidate2Name}</div>
              {candidate2Bio && (
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{candidate2Bio}</div>
              )}
              {selectedCandidate === 2 && (
                <Badge variant="default" className="mt-2 text-xs">Endorsed</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {/* Formatted Markdown Reasoning */}
        <div
          className="text-muted-foreground mb-4 flex-grow [&>h3]:font-semibold [&>h3]:text-lg [&>h3]:mb-6 [&>h3]:mt-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-6 [&>li]:leading-relaxed [&>p]:mb-4 [&>strong]:font-semibold [&>em]:italic"
          dangerouslySetInnerHTML={{
            __html: parseSimpleMarkdown(reasoning, { hideHeaders: true })
          }}
        />
        <div className="mt-auto pt-4 border-t">
          {/* Bottom Section with Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
              <div
                className="flex items-center gap-2 text-green-600 border border-green-200 bg-green-50 rounded-md px-3 py-1.5 text-sm"
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="font-semibold">{supportCount.toLocaleString()}</span>
              </div>
              <div
                className="flex items-center gap-2 text-red-600 border border-red-200 bg-red-50 rounded-md px-3 py-1.5 text-sm"
              >
                <ThumbsDown className="h-4 w-4" />
                <span className="font-semibold">{opposeCount.toLocaleString()}</span>
              </div>
            </div>
            <Button
              onClick={handleVoiceOpinionClick}
              className="w-full sm:w-auto"
            >
              {actionButtonText}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CandidateCampaignCard;
