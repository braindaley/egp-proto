
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Bill } from '@/types';
import { mapPolicyAreaToSiteCategory } from '@/lib/policy-area-mapping';
import { getBillTypeSlug } from '@/lib/utils';
import { parseSimpleMarkdown } from '@/lib/markdown-utils';
import { useState } from 'react';
import { ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { SupportGauge } from '@/components/ui/support-gauge';
import { useAuth } from '@/hooks/use-auth';
import { useWatchedBills } from '@/hooks/use-watched-bills';
import { ENABLE_WATCH_FEATURE } from '@/config/features';

interface AdvocacyBillCardProps {
    bill: Bill | Partial<Bill>;
    position: 'Support' | 'Oppose' | string;
    reasoning: string;
    actionButtonText: string;
    supportCount: number;
    opposeCount: number;
    groupSlug?: string;
    groupName?: string;
    campaignType?: 'Legislation' | 'Issue';
    issueCategory?: string;
    campaignId?: string;
}

const AdvocacyBillCard: React.FC<AdvocacyBillCardProps> = ({ bill, position, reasoning, actionButtonText, supportCount, opposeCount, groupSlug, groupName, campaignType, issueCategory, campaignId }) => {
    const { user } = useAuth();
    const { isWatchedBill, toggleWatchBill } = useWatchedBills();
    const router = useRouter();

    // For Issue campaigns, skip validation checks
    const isIssueCampaign = campaignType === 'Issue';
    const isWatched = !isIssueCampaign ? isWatchedBill(bill.congress!, bill.type!, bill.number!) : false;

    if (!isIssueCampaign && (!bill.type || !bill.number || !bill.congress)) {
      return (
        <Card className="flex flex-col h-full items-center justify-center text-center">
            <CardHeader>
                <CardTitle>Bill Information Missing</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">This advocacy card cannot be displayed because bill details are incomplete.</p>
            </CardContent>
        </Card>
      )
    }

    const billId = isIssueCampaign ? issueCategory || bill.title : `${bill.type!.toUpperCase()} ${bill.number}`;
    const billTitle = bill.title || (isIssueCampaign ? 'Issue Campaign' : `Legislation ${billId}`);
    const billTypeSlug = !isIssueCampaign ? getBillTypeSlug(bill.type!) : '';

    // For Issue campaigns, create a formatted title: "Education: Department of Education"
    const displayTitle = isIssueCampaign && issueCategory
        ? `${issueCategory}: ${billTitle}`
        : billTitle;

    const isSupport = position.toLowerCase() === 'support';
    const badgeVariant = isSupport ? 'default' : 'destructive';
    const PositionIcon = isSupport ? ThumbsUp : ThumbsDown;

    const handleVoiceOpinionClick = () => {
        // For Issue campaigns, use issue parameter; for Legislation, use bill parameters
        // Include organization position to pre-select and enforce the stance
        const orgPosition = position.toLowerCase();
        if (isIssueCampaign && issueCategory) {
            const params = new URLSearchParams({
                issue: issueCategory,
                orgPosition: orgPosition
            });
            // Pass campaignId for AI help to fetch reasoning
            if (campaignId) {
                params.set('campaignId', campaignId);
            }
            router.push(`/advocacy-message?${params.toString()}`);
        } else {
            router.push(`/advocacy-message?congress=${bill.congress}&type=${billTypeSlug}&number=${bill.number}&orgPosition=${orgPosition}`);
        }
    };


    return (
        <>
        <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex flex-col gap-3">
                    {/* 1. Group Name's Opinion with Badge */}
                    {groupName && (
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-muted-foreground">
                                {groupName} urges you to {position.toLowerCase()} {billId}
                            </p>
                            <Badge variant={badgeVariant} className={`flex items-center ${isIssueCampaign ? '' : 'gap-2'} text-sm px-2 py-1 shrink-0`}>
                                {!isIssueCampaign && PositionIcon && <PositionIcon className="h-3 w-3" />}
                                <span>{position}</span>
                            </Badge>
                        </div>
                    )}
                    
                    {/* 3. H2: Bill Short Title */}
                    <CardTitle className="text-lg sm:text-xl font-bold leading-tight">
                        {isIssueCampaign ? (
                            <span>{displayTitle}</span>
                        ) : (
                            <Link href={`/federal/bill/${bill.congress}/${billTypeSlug}/${bill.number}`} className="hover:underline">
                                {billTitle}
                            </Link>
                        )}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
                {/* 4. Formatted Markdown Reasoning */}
                <div 
                    className="text-muted-foreground mb-4 flex-grow [&>h3]:font-semibold [&>h3]:text-lg [&>h3]:mb-6 [&>h3]:mt-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-6 [&>li]:leading-relaxed [&>p]:mb-4 [&>strong]:font-semibold [&>em]:italic"
                    dangerouslySetInnerHTML={{ 
                        __html: parseSimpleMarkdown(reasoning, { hideHeaders: true })
                    }} 
                />
                <div className="mt-auto pt-4 border-t">
                    {/* 5. Bottom Section with Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex gap-2 flex-wrap justify-center sm:justify-start items-center">
                            <SupportGauge
                                supportCount={supportCount}
                                opposeCount={opposeCount}
                                className="w-36 sm:w-44"
                            />
{ENABLE_WATCH_FEATURE && (
                            <Button
                                variant={isWatched ? 'secondary' : 'outline'}
                                size="sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!user) {
                                        const currentUrl = window.location.pathname;
                                        router.push(`/login?returnTo=${encodeURIComponent(currentUrl)}`);
                                        return;
                                    }
                                    toggleWatchBill(bill.congress!, bill.type!, bill.number!, bill.title || bill.shortTitle);
                                }}
                                className={`flex items-center gap-2 ${
                                    isWatched
                                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                        : 'text-muted-foreground'
                                }`}
                            >
                                {isWatched ? 'Watching' : 'Watch'}
                            </Button>
                            )}
                        </div>
                        <Button size="sm" onClick={handleVoiceOpinionClick} className="w-full sm:w-auto">
                            {actionButtonText}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        </>
    );
};

export default AdvocacyBillCard;
