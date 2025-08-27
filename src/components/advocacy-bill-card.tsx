
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Bill } from '@/types';
import { mapPolicyAreaToSiteCategory } from '@/lib/policy-area-mapping';
import { getBillTypeSlug } from '@/lib/utils';
import { useState } from 'react';
import { ArrowRight, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface AdvocacyBillCardProps {
    bill: Bill | Partial<Bill>;
    position: 'Support' | 'Oppose' | string;
    reasoning: string;
    actionButtonText: string;
    supportCount: number;
    opposeCount: number;
    groupSlug?: string;
}

const AdvocacyBillCard: React.FC<AdvocacyBillCardProps> = ({ bill, position, reasoning, actionButtonText, supportCount, opposeCount, groupSlug }) => {
    const [isWatched, setIsWatched] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
    if (!bill.type || !bill.number || !bill.congress) {
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

    const billId = `${bill.type.toUpperCase()} ${bill.number}`;
    const billTitle = bill.title || `Legislation ${billId}`;
    const billTypeSlug = getBillTypeSlug(bill.type);

    const isSupport = position.toLowerCase() === 'support';
    const badgeVariant = isSupport ? 'default' : 'destructive';
    const PositionIcon = isSupport ? ThumbsUp : ThumbsDown;

    const handleVoiceOpinionClick = () => {
        // Always go directly to advocacy message page - verification is now handled in Step 3
        router.push(`/advocacy-message?congress=${bill.congress}&type=${billTypeSlug}&number=${bill.number}`);
    };


    return (
        <>
        <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-primary mb-1">{billId} &bull; {bill.congress}th Congress</p>
                        <CardTitle className="text-lg font-bold mb-2">
                            <Link href={`/bill/${bill.congress}/${billTypeSlug}/${bill.number}`} className="hover:underline">
                                {billTitle}
                            </Link>
                        </CardTitle>
                        {bill.subjects?.policyArea?.name && (
                            <Badge variant="outline" className="text-xs">
                                {mapPolicyAreaToSiteCategory(bill.subjects.policyArea.name) || bill.subjects.policyArea.name}
                            </Badge>
                        )}
                    </div>
                     <Badge variant={badgeVariant} className="flex items-center gap-2 text-base px-3 py-1.5">
                        <PositionIcon className="h-4 w-4" />
                        <span>{position}</span>
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
                <div 
                    className="text-muted-foreground mb-4 flex-grow [&>h3]:font-semibold [&>h3]:text-lg [&>h3]:mb-6 [&>h3]:mt-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-6 [&>li]:leading-relaxed [&>p]:mb-4 [&>strong]:font-semibold [&>em]:italic" 
                    dangerouslySetInnerHTML={{ __html: reasoning }} 
                />
                <div className="mt-auto pt-4 border-t">
                    <div className="flex gap-2 flex-wrap justify-center mt-4">
                        <Button size="sm" onClick={handleVoiceOpinionClick}>
                            {actionButtonText}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span className="font-semibold">{supportCount.toLocaleString()}</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          <span className="font-semibold">{opposeCount.toLocaleString()}</span>
                        </Button>
                        <Button 
                          variant={isWatched ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => setIsWatched(prev => !prev)}
                          className="flex items-center gap-2 text-muted-foreground"
                        >
                          <Eye className={`h-4 w-4 ${isWatched ? 'text-blue-600' : ''}`} />
                          {isWatched ? 'Watching' : 'Watch'}
                        </Button>
                        {groupSlug && (
                          <Button 
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex items-center gap-2 text-muted-foreground"
                          >
                            <Link href={`/campaigns/groups/${groupSlug}/${bill.type?.toLowerCase()}-${bill.number}`}>
                              View Campaign
                            </Link>
                          </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
        
        </>
    );
};

export default AdvocacyBillCard;
