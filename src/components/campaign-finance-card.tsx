'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Landmark, TrendingUp, TrendingDown, Wallet, Handshake, Calendar, Info } from 'lucide-react';
import type { Member } from '@/types';

interface CampaignFinanceData {
  name: string;
  status: string;
  office: string;
  district: string;
  party: string;
  total_receipts: number;
  total_disbursements: number;
  cash_on_hand_end_period: number;
  debts_owed_by_committee: number;
  election_years: number[];
}

function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export const CampaignFinanceCard = ({ member, congress, state, bioguideId }: { member: Member; congress: string; state: string; bioguideId: string; }) => {
  const [financeData, setFinanceData] = useState<CampaignFinanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFinanceData = async () => {
      const fecId = member.extendedIds?.fec?.[0];
      if (!fecId) {
        setIsLoading(false);
        setError('FEC ID not available for this member.');
        return;
      }

      setIsLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/fec/candidate/${fecId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch campaign finance data.');
        }
        const data = await res.json();
        setFinanceData(data);
      } catch (e) {
        console.error("Error fetching campaign finance data:", e);
        setError('Could not load campaign finance data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFinanceData();
  }, [member.extendedIds?.fec]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/5" />
          <Skeleton className="h-4 w-4/5 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !financeData) {
    return null; // Don't show the card if there's an error or no data
  }

  const financialSummaryUrl = `/congress/${congress}/states/${state}/${bioguideId}/finance`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark /> Campaign Funding Summary
        </CardTitle>
        <CardDescription>
          Financial overview from the Federal Election Commission (FEC).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm mb-6">
          <div className="flex items-center gap-2"><Info className="w-4 h-4 text-muted-foreground" /> <strong>Status:</strong> {financeData.status}</div>
          <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-muted-foreground" /> <strong>Office:</strong> {financeData.office} - {financeData.district}</div>
          <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-600" /> <strong>Total Raised:</strong> {formatCurrency(financeData.total_receipts)}</div>
          <div className="flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-600" /> <strong>Total Spent:</strong> {formatCurrency(financeData.total_disbursements)}</div>
          <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-blue-600" /> <strong>Cash on Hand:</strong> {formatCurrency(financeData.cash_on_hand_end_period)}</div>
          <div className="flex items-center gap-2"><Handshake className="w-4 h-4 text-yellow-600" /> <strong>Debts:</strong> {formatCurrency(financeData.debts_owed_by_committee)}</div>
        </div>
        <div className="flex items-center gap-2 text-sm mb-6"><Calendar className="w-4 h-4 text-muted-foreground" /> <strong>Election Years:</strong> {financeData.election_years.join(', ')}</div>
        <Button asChild className="w-full">
          <Link href={financialSummaryUrl}>Full Financial Summary</Link>
        </Button>
      </CardContent>
    </Card>
  );
};
