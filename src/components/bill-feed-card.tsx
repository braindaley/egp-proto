'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getBillTypeSlug, formatDate } from '@/lib/utils';
import { Check, Dot, Users, Library, ArrowRight, Mail, Flame, TrendingUp, Award, ClipboardCheck, Tags, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FeedBill } from '@/types';
import { useBillSupportCounts } from '@/hooks/use-bill-support-counts';
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
    const [isWatched, setIsWatched] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const billTypeSlug = getBillTypeSlug(bill.type);
    const detailUrl = `/federal/bill/${bill.congress}/${billTypeSlug}/${bill.number}`;

    // Get real support counts from Firestore
    const { supportCount, opposeCount, loading: countsLoading } = useBillSupportCounts(
        bill.congress,
        bill.type,
        bill.number
    );

    const partyColor = bill.sponsorParty === 'R' ? 'bg-red-100 text-red-800' 
                     : bill.sponsorParty === 'D' ? 'bg-blue-100 text-blue-800'
                     : 'bg-gray-100 text-gray-800';

    const handleInteractionClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleWatch = (e: React.MouseEvent) => {
        handleInteractionClick(e);
        if (!user) {
            // Redirect to login with return URL
            const currentUrl = window.location.pathname;
            router.push(`/login?returnTo=${encodeURIComponent(currentUrl)}`);
            return;
        }
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
                asChild
            >
                <Link href={`/advocacy-message?congress=${bill.congress}&type=${bill.type}&number=${bill.number}&verified=true`}>
                    Voice your opinion
                </Link>
            </Button>
            <div
                className="flex items-center gap-1.5 text-green-600 bg-green-50 border border-green-200 rounded-md px-3 py-1.5 text-sm"
                title={`${countsLoading ? '...' : supportCount.toLocaleString()} ${supportCount === 1 ? 'person contacted' : 'people contacted'} their representative in support`}
            >
                <Mail className="h-4 w-4" />
                <span>{countsLoading ? '...' : supportCount.toLocaleString()}</span>
                <span className="hidden sm:inline">support</span>
            </div>
            <div
                className="flex items-center gap-1.5 text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-1.5 text-sm"
                title={`${countsLoading ? '...' : opposeCount.toLocaleString()} ${opposeCount === 1 ? 'person contacted' : 'people contacted'} their representative in opposition`}
            >
                <Mail className="h-4 w-4" />
                <span>{countsLoading ? '...' : opposeCount.toLocaleString()}</span>
                <span className="hidden sm:inline">oppose</span>
            </div>
            <Button 
                variant="outline"
                size="sm"
                onClick={handleWatch}
                className="flex items-center gap-1.5 text-muted-foreground"
            >
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