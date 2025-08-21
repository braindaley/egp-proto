'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getBillTypeSlug, formatDate } from '@/lib/utils';
import { Check, Dot, Users, Library, ArrowRight, ThumbsUp, ThumbsDown, Eye, Flame, TrendingUp, Award, ClipboardCheck, Tags, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FeedBill } from '@/types';
import { getBillSupportData } from '@/lib/bill-support-data';

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
        handleInteractionClick(e);
        setIsWatched(prev => !prev);
    };

    return (
      <Card className="hover:shadow-lg transition-shadow duration-300 ease-in-out">
        <CardHeader>
            {/* 1. Bill Number - MOVED TO TOP */}
            <div className="mb-2">
                <Badge variant="outline" className="shrink-0 font-semibold">{bill.billNumber}</Badge>
            </div>
            
            {/* 2. Issues - MOVED AFTER BILL NUMBER */}
            <div className="mb-3">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Tags className="h-4 w-4" />
                    {bill.committeeName}
                </span>
            </div>

            {/* 3. Bill Title */}
            <div className="space-y-2">
                <CardTitle className="font-headline text-lg leading-snug">
                    <Link href={detailUrl} className="hover:underline text-primary">
                        {bill.shortTitle}
                    </Link>
                </CardTitle>
            </div>

            {/* 4. Sponsor Information - SEPARATED & 40x40 IMAGE */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                {bill.sponsorImageUrl && (
                    <Image 
                        src={bill.sponsorImageUrl} 
                        alt={bill.sponsorFullName}
                        width={40}
                        height={40}
                        className="rounded-full"
                    />
                )}
                <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${partyColor}`}>
                    <Users className="h-3 w-3" />
                    {bill.sponsorFullName} ({bill.sponsorParty})
                </span>
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
                onClick={handleInteractionClick}
            >
                Voice your opinion
            </Button>
            <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                onClick={handleSupport}
            >
                <ThumbsUp className="h-4 w-4" />
                {supportCount.toLocaleString()}
            </Button>
            <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={handleOppose}
            >
                <ThumbsDown className="h-4 w-4" />
                {opposeCount.toLocaleString()}
            </Button>
            <Button 
                variant="outline"
                size="sm"
                onClick={handleWatch}
                className="flex items-center gap-1.5 text-muted-foreground"
            >
                <Eye className={cn("h-4 w-4", isWatched && "text-blue-600")} />
                Watch
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
    );
}