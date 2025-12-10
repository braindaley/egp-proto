'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getBillTypeSlug } from '@/lib/utils';
import { Users, Mail, ExternalLink, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeedBill } from '@/types';
import { useBillSupportCounts } from '@/hooks/use-bill-support-counts';
import { useWatchedBills } from '@/hooks/use-watched-bills';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ENABLE_WATCH_FEATURE } from '@/config/features';
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
  const [explainerData, setExplainerData] = useState<BillCarouselOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isWatchedBill, toggleWatchBill } = useWatchedBills();
  const { user } = useAuth();
  const router = useRouter();
  const isWatched = isWatchedBill(bill.congress, bill.type, bill.number);

  const billTypeSlug = getBillTypeSlug(bill.type);
  const detailUrl = `/federal/bill/${bill.congress}/${billTypeSlug}/${bill.number}`;

  // Get real support counts from Firestore
  const { supportCount, opposeCount, loading: countsLoading } = useBillSupportCounts(
    bill.congress,
    bill.type,
    bill.number
  );

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
        explainer = `${bill.billNumber} would eliminate or repeal existing ${subject} policies`;
      } else if (isEstablishing) {
        explainer = `${bill.billNumber} would create new ${subject} programs or agencies`;
      } else if (isReforming) {
        explainer = `${bill.billNumber} would reform and improve existing ${subject} systems`;
      } else if (isFunding) {
        explainer = `${bill.billNumber} would provide funding for ${subject} initiatives`;
      } else {
        explainer = `${bill.billNumber} would modify federal ${subject} policy`;
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
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {explainerData?.supportStatement}
            </p>
          </div>

          {/* Oppose Box */}
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800">Oppose</h4>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {explainerData?.opposeStatement}
            </p>
          </div>
        </div>

        {/* Bill Number Badge and Title */}
        <div className="flex flex-col items-center gap-2">
          <Badge variant="secondary" className="text-xs font-semibold">
            {bill.type.toUpperCase()} {bill.number}
          </Badge>
          <p className="text-sm text-gray-600 text-center line-clamp-2">
            {bill.shortTitle}
          </p>
        </div>
      </CardContent>

      {/* Twitter-style Action Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
        <button
          onClick={handleVoiceOpinionClick}
          className="flex items-center gap-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full px-3 py-2 transition-colors group"
        >
          <MessageSquareText className="h-4 w-4" />
          <span className="text-sm font-medium">58</span>
        </button>
        
        <div
          className="flex items-center gap-1 rounded-full px-3 py-2 text-green-600 bg-green-50"
          title={`${countsLoading ? '...' : supportCount.toLocaleString()} ${supportCount === 1 ? 'person contacted' : 'people contacted'} their representative in support`}
        >
          <Mail className="h-4 w-4" />
          <span className="text-sm font-medium">
            {countsLoading ? '...' : supportCount.toLocaleString()}
          </span>
          <span className="text-sm font-medium hidden sm:inline">
            support
          </span>
        </div>

        <div
          className="flex items-center gap-1 rounded-full px-3 py-2 text-red-600 bg-red-50"
          title={`${countsLoading ? '...' : opposeCount.toLocaleString()} ${opposeCount === 1 ? 'person contacted' : 'people contacted'} their representative in opposition`}
        >
          <Mail className="h-4 w-4" />
          <span className="text-sm font-medium">
            {countsLoading ? '...' : opposeCount.toLocaleString()}
          </span>
          <span className="text-sm font-medium hidden sm:inline">
            oppose
          </span>
        </div>
        
{ENABLE_WATCH_FEATURE && (
        <button
          onClick={handleWatch}
          className={`flex items-center gap-1 rounded-full px-3 py-2 transition-colors group ${
            isWatched
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
          }`}
        >
          <span className="text-sm font-medium">123K</span>
        </button>
        )}
        
        <Link
          href={detailUrl}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full px-3 py-2 transition-colors group"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="text-sm font-medium">Bill</span>
        </Link>
      </div>
    </Card>
  );
}