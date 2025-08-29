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
  const detailUrl = `/federal/bill/${bill.congress}/${billTypeSlug}/${bill.number}`;
  
  const { supportCount, opposeCount } = getBillSupportData(bill.congress, bill.type, bill.number);

  const partyColor = bill.sponsorParty === 'R' ? 'bg-stone-600 text-white' 
                   : bill.sponsorParty === 'D' ? 'bg-slate-600 text-white'
                   : 'bg-gray-400 text-white';

  // Use server-provided explainer data or generate fallback
  useEffect(() => {
    const loadExplainer = () => {
      setIsLoading(true);
      
      // Check if bill already has server-provided explainer data
      if (bill.explainer) {
        setExplainerData(bill.explainer);
        setIsLoading(false);
        return;
      }
      
      // Generate fallback data if no server explainer is available
      const titleLower = bill.shortTitle.toLowerCase();
      const subject = bill.subjects?.[0]?.toLowerCase() || 'policy';
      
      // Create variety based on a unique hash combining multiple bill properties
      const hashString = `${bill.congress}-${bill.type}-${bill.number}-${bill.shortTitle.slice(0, 20)}-${subject}-${bill.sponsorParty}-${bill.sponsorFullName}`;
      let hashCode = 0;
      for (let i = 0; i < hashString.length; i++) {
        const char = hashString.charCodeAt(i);
        hashCode = ((hashCode << 5) - hashCode) + char;
        hashCode = hashCode & hashCode; // Convert to 32-bit integer
      }
      const variant = Math.abs(hashCode) % 6;
      
      const headlines = [
        'Progress or setback?',
        'Necessary reform or overreach?',
        'Smart policy or government excess?', 
        'Innovation or bureaucracy?',
        'Public benefit or special interests?',
        'Long overdue or rushed decision?'
      ];
      
      // More varied support/oppose statements based on subject and bill type
      const subjectSpecific = subject === 'policy' ? 'this area' : subject;
      
      const supportReasons = [
        `Could significantly improve ${subjectSpecific} outcomes`,
        `Addresses critical gaps in current ${subjectSpecific} policy`,
        `Would modernize outdated ${subjectSpecific} approaches`, 
        `Provides essential oversight for ${subjectSpecific}`,
        `Creates valuable opportunities in ${subjectSpecific}`,
        `Responds to urgent public concerns about ${subjectSpecific}`
      ];
      
      const opposeReasons = [
        `May increase costs without proven ${subjectSpecific} benefits`,
        `Could cause unintended ${subjectSpecific} consequences`,
        `Might unnecessarily expand government role in ${subjectSpecific}`,
        `May create burdensome ${subjectSpecific} requirements`,
        `Could disrupt effective ${subjectSpecific} systems`,
        `Lacks adequate funding for proper ${subjectSpecific} implementation`
      ];
      
      // Add some specific keywords for more targeted content based on title and subject
      let explainer = '';
      const isEstablishing = titleLower.includes('establish') || titleLower.includes('create') || titleLower.includes('establish');
      const isReforming = titleLower.includes('reform') || titleLower.includes('improve') || titleLower.includes('modernize');
      const isFunding = titleLower.includes('fund') || titleLower.includes('appropriat') || titleLower.includes('invest');
      const isRepealing = titleLower.includes('repeal') || titleLower.includes('eliminate') || titleLower.includes('end');
      
      if (isRepealing) {
        explainer = `This bill would eliminate or repeal existing ${subject} policies`;
      } else if (isEstablishing) {
        explainer = `This bill would create new ${subject} programs or agencies`;
      } else if (isReforming) {
        explainer = `This bill would reform and improve existing ${subject} systems`;
      } else if (isFunding) {
        explainer = `This bill would provide funding for ${subject} initiatives`;
      } else {
        explainer = `This bill would modify federal ${subject} policy`;
      }
      
      setExplainerData({
        headline: headlines[variant],
        explainer: explainer + '.',
        supportStatement: supportReasons[variant],
        opposeStatement: opposeReasons[variant],
        closingQuestion: 'What do you think?'
      });
      
      setIsLoading(false);
    };

    loadExplainer();
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
      <Card className="hover:shadow-lg transition-shadow duration-300 ease-in-out bg-white border-gray-200">
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
    <Card className="hover:shadow-lg transition-shadow duration-300 ease-in-out bg-white border-gray-200">
      {/* Header with sponsor info */}
      <div className="p-6 text-center">
        <div className="flex items-center justify-center gap-4">
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
          <Badge className={`text-sm font-medium ${partyColor} border-0`}>
            {bill.sponsorFullName}
          </Badge>
          <Badge variant="outline" className="text-sm font-semibold border-gray-300 text-gray-800">{bill.billNumber}</Badge>
          {bill.subjects && bill.subjects.length > 0 && (
            <Badge variant="outline" className="text-sm border-gray-300 text-gray-600">
              {bill.subjects[0]}
            </Badge>
          )}
        </div>
      </div>

      {/* Social Media Explainer Content */}
      <CardContent className="space-y-6 pt-8">
        {/* Headline */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {explainerData?.headline}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {explainerData?.explainer}
          </p>
        </div>

        {/* Support and Oppose Boxes */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Support Box */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800">Support</h4>
              <Button 
                variant="outline" 
                size="sm"
                className={`flex items-center gap-1.5 transition-colors border-gray-300 ${
                  supportStatus === 'supported'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                onClick={handleSupport}
              >
                <ThumbsUp className="h-4 w-4" />
                {supportStatus === 'supported' ? 'Supported!' : supportCount.toLocaleString()}
              </Button>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {explainerData?.supportStatement}
            </p>
          </div>

          {/* Oppose Box */}
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800">Oppose</h4>
              <Button 
                variant="outline" 
                size="sm"
                className={`flex items-center gap-1.5 transition-colors border-gray-300 ${
                  supportStatus === 'opposed'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                onClick={handleOppose}
              >
                <ThumbsDown className="h-4 w-4" />
                {supportStatus === 'opposed' ? 'Opposed!' : opposeCount.toLocaleString()}
              </Button>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {explainerData?.opposeStatement}
            </p>
          </div>
        </div>
      </CardContent>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 p-6 bg-gray-50">
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
          onClick={handleWatch}
          className={cn(
            "flex items-center gap-1.5 border-gray-300",
            isWatched ? "bg-gray-800 text-white" : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          )}
        >
          <Eye className="h-4 w-4" />
          {isWatched ? 'Watching' : 'Watch'}
        </Button>
        
        <Button 
          variant="outline"
          size="sm"
          onClick={handleInteractionClick}
          className="flex items-center gap-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-gray-300"
        >
          <Share className="h-4 w-4" />
          Share
        </Button>
        
        <Link 
          href={detailUrl} 
          className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Read full bill →
        </Link>
      </div>
    </Card>
  );
}