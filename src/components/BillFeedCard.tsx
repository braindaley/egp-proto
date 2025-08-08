'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getBillTypeSlug, formatDate } from '@/lib/utils';
import { Check, Dot, Users, Library, ArrowRight, ThumbsUp, ThumbsDown, Eye, Flame, TrendingUp, Award, ClipboardCheck, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FeedBill } from '@/types';

const BillStatusIndicator = ({ status }: { status: string }) => {
    const steps: string[] = ['Introduced', 'In Committee', 'Passed House', 'Passed Senate', 'To President', 'Became Law'];
    let currentStepIndex = steps.indexOf(status);

    if (currentStepIndex === -1) {
        currentStepIndex = 1; // Default to 'In Committee' if status is not found
    }

    const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

    return (
        <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1">
                {steps.map((step, index) => (
                    <span key={step} className={`text-center ${index === currentStepIndex ? 'font-bold text-primary' : ''}`}>
                        {step}
                    </span>
                ))}
            </div>
            <Progress value={progressPercentage} className="h-2" />
        </div>
    );
};

const getScoreColor = (score: number) => {
    if (score >= 40) return 'text-purple-600';
    if (score >= 30) return 'text-red-600';
    if (score >= 25) return 'text-green-600';
    if (score >= 15) return 'text-blue-600';
    if (score >= 8) return 'text-yellow-600';
    return 'text-gray-500';
};

const ImportanceBadge = ({ score }: { score: number }) => {
    let text = "📝 Introduced";
    let color = "bg-gray-100 text-gray-800";
    let icon = <ClipboardCheck className="h-3 w-3" />;

    if (score >= 40) {
        text = "🏛️ Presidential Action";
        color = "bg-purple-100 text-purple-800";
    } else if (score >= 30) {
        text = "🗳️ Floor Vote";
        color = "bg-red-100 text-red-800";
    } else if (score >= 25) {
        text = "✅ Passed Chamber";
        color = "bg-green-100 text-green-800";
    } else if (score >= 15) {
        text = "📨 Committee Reported";
        color = "bg-blue-100 text-blue-800";
    } else if (score >= 8) {
        text = "📋 Committee Active";
        color = "bg-yellow-100 text-yellow-800";
    } else if (score < 2) {
        return null;
    }
    
    return (
        <div className="flex items-center gap-2">
            <span className={cn("text-sm font-bold", getScoreColor(score))}>
              {score}
            </span>
            <Badge variant="outline" className={`flex items-center gap-1.5 ${color}`}>
                {icon} {text}
            </Badge>
        </div>
    );
};

export function BillFeedCard({ bill, index }: { bill: FeedBill, index?: number }) {
    const [supportStatus, setSupportStatus] = useState<'none' | 'supported' | 'opposed'>('none');
    const [isWatched, setIsWatched] = useState(false);

    const billTypeSlug = getBillTypeSlug(bill.type);
    const detailUrl = `/bill/${bill.congress}/${billTypeSlug}/${bill.number}`;

    const partyColor = bill.sponsorParty === 'R' ? 'bg-red-100 text-red-800' 
                     : bill.sponsorParty === 'D' ? 'bg-blue-100 text-blue-800'
                     : 'bg-gray-100 text-gray-800';

    const handleInteractionClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const handleSupport = (e: React.MouseEvent) => {
        handleInteractionClick(e);
        setSupportStatus(prev => prev === 'supported' ? 'none' : 'supported');
    };

    const handleOppose = (e: React.MouseEvent) => {
        handleInteractionClick(e);
        setSupportStatus(prev => prev === 'opposed' ? 'none' : 'opposed');
    };
    
    const handleWatch = (e: React.MouseEvent) => {
        handleInteractionClick(e);
        setIsWatched(prev => !prev);
    };

    return (
        <Card className="hover:shadow-lg transition-shadow duration-300 ease-in-out">
            <CardHeader>
                {/* Sponsor info at the top with larger circular image */}
                <div className="flex items-center gap-4 mb-4">
                    {bill.sponsorImageUrl && (
                        <div className="w-[60px] h-[60px] rounded-full overflow-hidden flex-shrink-0">
                            <Image 
                                src={bill.sponsorImageUrl} 
                                alt={bill.sponsorFullName}
                                width={60}
                                height={60}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    <span className={`flex items-center gap-1.5 px-3 py-2 rounded-full ${partyColor}`}>
                        <Users className="h-3 w-3" />
                        {bill.sponsorFullName} ({bill.sponsorParty})
                    </span>
                </div>

                {/* Bill number and subjects on same line */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <Badge variant="outline" className="shrink-0 font-semibold">{bill.billNumber}</Badge>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Library className="h-4 w-4 shrink-0" />
                        <span>{bill.committeeName}</span>
                    </span>
                </div>

                {/* Bill title */}
                <div className="space-y-2">
                    <CardTitle className="font-headline text-lg leading-snug">
                        <Link href={detailUrl} className="hover:underline text-primary">
                            {bill.shortTitle}
                        </Link>
                    </CardTitle>
                    {bill.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2 pt-1">
                            {bill.summary}
                        </p>
                    )}
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                    <span className="font-semibold text-foreground">Latest Action:</span>{' '}
                    {bill.latestAction.text} ({formatDate(bill.latestAction.actionDate)})
                </p>
                <BillStatusIndicator status={bill.status} />
            </CardContent>
            
            <CardFooter className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-2">
                    <Button 
                        variant={supportStatus === 'supported' ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={handleSupport}
                        className="flex items-center gap-1.5"
                    >
                        <ThumbsUp className={cn("h-4 w-4", supportStatus === 'supported' && "text-green-600")} />
                        Support
                    </Button>
                    <Button 
                        variant={supportStatus === 'opposed' ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={handleOppose}
                        className="flex items-center gap-1.5"
                    >
                        <ThumbsDown className={cn("h-4 w-4", supportStatus === 'opposed' && "text-red-600")} />
                        Oppose
                    </Button>
                    <Button 
                        variant={isWatched ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={handleWatch}
                        className="flex items-center gap-1.5 text-muted-foreground"
                    >
                        <Eye className={cn("h-4 w-4", isWatched && "text-blue-600")} />
                        {isWatched ? 'Watching' : 'Watch'}
                    </Button>
                </div>
                <ImportanceBadge score={bill.importanceScore} />
            </CardFooter>
        </Card>
    );
}