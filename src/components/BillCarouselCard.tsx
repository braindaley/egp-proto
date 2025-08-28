'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getBillTypeSlug } from '@/lib/utils';
import { Users, ThumbsUp, ThumbsDown, Eye, Share, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeedBill } from '@/types';
import { getBillSupportData } from '@/lib/bill-support-data';
import { useWatchedBills } from '@/hooks/use-watched-bills';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
type BillCarouselOutput = {
  headline: string;
  explainer: string;
  supportStatement: string;
  opposeStatement: string;
  closingQuestion: string;
};

interface BillCarouselCardProps {
  bill: FeedBill;
  index?: number;
}

export function BillCarouselCard({ bill, index }: BillCarouselCardProps) {
  const [supportStatus, setSupportStatus] = useState<'none' | 'supported' | 'opposed'>('none');
  const [explainerData, setExplainerData] = useState<BillCarouselOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isWatchedBill, toggleWatchBill } = useWatchedBills();
  const { user } = useAuth();
  const router = useRouter();
  const isWatched = isWatchedBill(bill.congress, bill.type, bill.number);

  const billTypeSlug = getBillTypeSlug(bill.type);
  const detailUrl = `/bill/${bill.congress}/${billTypeSlug}/${bill.number}`;
  
  const { supportCount, opposeCount } = getBillSupportData(bill.congress, bill.type, bill.number);

  const partyColor = bill.sponsorParty === 'R' ? 'bg-red-100 text-red-800' 
                   : bill.sponsorParty === 'D' ? 'bg-blue-100 text-blue-800'
                   : 'bg-gray-100 text-gray-800';

  // Generate explainer data on component mount
  useEffect(() => {
    const generateExplainer = async () => {
      try {
        setIsLoading(true);
        
        // Add a small delay based on index to stagger requests and avoid rate limiting
        if (index !== undefined && index > 0) {
          await new Promise(resolve => setTimeout(resolve, Math.min(index * 100, 2000)));
        }
        const response = await fetch('/api/ai/generate-bill-explainer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bill }),
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        setExplainerData(data);
      } catch (error) {
        console.error('Error generating explainer data:', error);
        // Generate bill-specific fallback data
        const isEstablishing = bill.shortTitle.toLowerCase().includes('establish') || 
                              bill.shortTitle.toLowerCase().includes('create') ||
                              bill.shortTitle.toLowerCase().includes('fund');
        const isReform = bill.shortTitle.toLowerCase().includes('reform') ||
                         bill.shortTitle.toLowerCase().includes('improve') ||
                         bill.shortTitle.toLowerCase().includes('modernize');
        const isRepeal = bill.shortTitle.toLowerCase().includes('repeal') ||
                         bill.shortTitle.toLowerCase().includes('eliminate') ||
                         bill.shortTitle.toLowerCase().includes('end');
        
        let headline, supportStatement, opposeStatement;
        
        if (isRepeal) {
          headline = 'Necessary change or risky move?';
          supportStatement = 'Would eliminate outdated or harmful regulations';
          opposeStatement = 'Could remove important protections or oversight';
        } else if (isEstablishing) {
          headline = 'Innovation or expansion?';
          supportStatement = 'Could address unmet needs and create opportunities';
          opposeStatement = 'May increase costs and government bureaucracy';
        } else if (isReform) {
          headline = 'Improvement or disruption?';
          supportStatement = 'Would update and strengthen existing systems';
          opposeStatement = 'Could cause unintended consequences or delays';
        } else {
          headline = 'Progress or overreach?';
          supportStatement = 'Addresses important public policy needs';
          opposeStatement = 'May have budget or implementation challenges';
        }
        
        setExplainerData({
          headline,
          explainer: `This bill would ${isEstablishing ? 'create' : isReform ? 'reform' : isRepeal ? 'eliminate' : 'modify'} ${bill.shortTitle.toLowerCase().includes('act') ? 'federal policy' : 'existing law'}.`,
          supportStatement,
          opposeStatement,
          closingQuestion: 'What do you think?'
        });
      } finally {
        setIsLoading(false);
      }
    };

    generateExplainer();
  }, [bill]);

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
    
    if (!user) {
      const currentUrl = window.location.pathname;
      router.push(`/login?returnTo=${encodeURIComponent(currentUrl)}`);
      return;
    }
    
    toggleWatchBill(bill.congress, bill.type, bill.number, bill.shortTitle);
  };

  const handleVoiceOpinionClick = (e: React.MouseEvent) => {
    handleInteractionClick(e);
    router.push(`/advocacy-message?congress=${bill.congress}&type=${bill.type}&number=${bill.number}`);
  };

  if (isLoading) {
    return (
      <Card className="hover:shadow-lg transition-shadow duration-300 ease-in-out">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-32 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 ease-in-out">
      {/* Header with sponsor info */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3 mb-2">
          {bill.sponsorImageUrl && (
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <Image 
                src={bill.sponsorImageUrl} 
                alt={bill.sponsorFullName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <span className={`text-xs px-2 py-1 rounded-full ${partyColor}`}>
            {bill.sponsorFullName} ({bill.sponsorParty})
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold">{bill.billNumber}</Badge>
          {bill.subjects && bill.subjects.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {bill.subjects[0]}
            </Badge>
          )}
        </div>
      </div>

      {/* Social Media Explainer Content */}
      <CardContent className="space-y-4">
        {/* Headline */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-3">
            {explainerData?.headline}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {explainerData?.explainer}
          </p>
          <Link 
            href={detailUrl} 
            className="text-xs text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Read full bill →
          </Link>
        </div>

        {/* Support and Oppose Boxes */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Support Box */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">Support</h4>
            <p className="text-sm text-green-700 leading-relaxed">
              {explainerData?.supportStatement}
            </p>
          </div>

          {/* Oppose Box */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">Oppose</h4>
            <p className="text-sm text-red-700 leading-relaxed">
              {explainerData?.opposeStatement}
            </p>
          </div>
        </div>

        {/* Closing Question */}
        <div className="text-center pt-2 border-t">
          <p className="text-sm font-medium text-gray-700">
            {explainerData?.closingQuestion}
          </p>
        </div>
      </CardContent>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 p-4 border-t">
        <Button 
          size="sm"
          className="bg-black text-white hover:bg-gray-800"
          onClick={handleVoiceOpinionClick}
        >
          <MessageSquareText className="h-4 w-4 mr-1" />
          Voice Opinion
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
      </div>
    </Card>
  );
}