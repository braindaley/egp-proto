'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getBillTypeSlug, formatDate } from '@/lib/utils';
import { Check, Dot, Users, Library, ArrowRight, ThumbsUp, ThumbsDown, Eye, Flame, TrendingUp, Award, ClipboardCheck, MessageSquareText, Tags, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FeedBill } from '@/types';
import { getBillSupportData } from '@/lib/bill-support-data';
import { useWatchedBills } from '@/hooks/use-watched-bills';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

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
    const { isWatchedBill, toggleWatchBill } = useWatchedBills();
    const { user } = useAuth();
    const router = useRouter();
    const isWatched = isWatchedBill(bill.congress, bill.type, bill.number);

    const billTypeSlug = getBillTypeSlug(bill.type);
    const detailUrl = `/bill/${bill.congress}/${billTypeSlug}/${bill.number}`;
    
    // Get consistent mock support data
    const { supportCount, opposeCount } = getBillSupportData(bill.congress, bill.type, bill.number);

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
        console.log('=== WATCH BUTTON CLICKED ===');
        handleInteractionClick(e);
        console.log('Watch button clicked for bill:', {
            congress: bill.congress,
            type: bill.type,
            number: bill.number,
            title: bill.shortTitle,
            currentlyWatched: isWatched,
            user: user ? 'authenticated' : 'not authenticated'
        });
        
        if (!user) {
            console.log('User not authenticated, redirecting to login');
            // Redirect to login with return URL
            const currentUrl = window.location.pathname;
            router.push(`/login?returnTo=${encodeURIComponent(currentUrl)}`);
            return;
        }
        
        console.log('Calling toggleWatchBill');
        toggleWatchBill(bill.congress, bill.type, bill.number, bill.shortTitle);
        console.log('toggleWatchBill called');
    };

    const handleVoiceOpinionClick = (e: React.MouseEvent) => {
        handleInteractionClick(e);
        // Always go directly to advocacy message page - verification is now handled in Step 3
        router.push(`/advocacy-message?congress=${bill.congress}&type=${bill.type}&number=${bill.number}`);
    };


    return (
        <>
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

                {/* Bill number and issues on same line */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <Badge variant="outline" className="shrink-0 font-semibold">{bill.billNumber}</Badge>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Tags className="h-4 w-4 shrink-0" />
                        <div className="flex flex-wrap gap-1">
                            {bill.subjects && bill.subjects.length > 0 ? (
                                bill.subjects.slice(0, 2).map((subject, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                        {subject}
                                    </Badge>
                                ))
                            ) : (
                                <span>General Legislation</span>
                            )}
                            {bill.subjects && bill.subjects.length > 2 && (
                                <span className="text-xs text-muted-foreground">+{bill.subjects.length - 2} more</span>
                            )}
                        </div>
                    </div>
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
            
            <CardFooter className="flex items-center gap-2 pt-4 border-t">
                <Button 
                    size="sm"
                    className="bg-black text-white hover:bg-gray-800"
                    onClick={handleVoiceOpinionClick}
                >
                    Voice your opinion
                </Button>
                <Button 
                    variant="outline" 
                    size="sm"
                    className={`flex items-center gap-1.5 transition-colors ${
                        supportStatus === 'supported'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200'
                    }`}
                    onClick={handleSupport}
                >
                    <ThumbsUp className="h-4 w-4" />
                    {supportStatus === 'supported' ? 'Supported!' : supportCount.toLocaleString()}
                </Button>
                <Button 
                    variant="outline" 
                    size="sm"
                    className={`flex items-center gap-1.5 transition-colors ${
                        supportStatus === 'opposed'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
                    }`}
                    onClick={handleOppose}
                >
                    <ThumbsDown className="h-4 w-4" />
                    {supportStatus === 'opposed' ? 'Opposed!' : opposeCount.toLocaleString()}
                </Button>
                <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleWatch}
                    className={cn(
                        "flex items-center gap-1.5",
                        isWatched ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" : "text-muted-foreground"
                    )}
                >
                    <Eye className={cn("h-4 w-4", isWatched && "text-blue-600")} />
                    {isWatched ? 'Watching' : 'Watch'}
                </Button>
                <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleInteractionClick}
                    className="flex items-center gap-1.5 text-muted-foreground"
                >
                    <Share className="h-4 w-4" />
                    Share
                </Button>
            </CardFooter>
        </Card>
        
        </>
    );
}