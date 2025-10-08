'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign } from 'lucide-react';
import type { Member, CampaignFinanceDetails, StateContributorsResponse, IndividualContributorsResponse } from '@/types';

function formatCurrency(amount: number): string {
  if (typeof amount !== 'number') {
    return '$0';
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function calculatePercentage(part: number, total: number): string {
  if (total === 0) return '0%';
  return `${((part / total) * 100).toFixed(1)}%`;
}

export const CampaignFinanceDetailCard = ({ member }: { member: Member }) => {
  const [financeData, setFinanceData] = useState<CampaignFinanceDetails | null>(null);
  const [stateData, setStateData] = useState<StateContributorsResponse | null>(null);
  const [contributorData, setContributorData] = useState<IndividualContributorsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFinanceData = async () => {
      const fecIds = member.extendedIds?.fec;
      if (!fecIds || fecIds.length === 0) {
        setIsLoading(false);
        setError('FEC ID not available for this member.');
        return;
      }

      // Join all FEC IDs with comma for the API
      const fecIdParam = fecIds.join(',');

      setIsLoading(true);
      setError('');
      try {
        const [totalsRes, stateRes, contributorsRes] = await Promise.all([
          fetch(`/api/fec/candidate/${fecIds[0]}/totals`),
          fetch(`/api/fec/candidate/${fecIdParam}/state-contributors`),
          fetch(`/api/fec/candidate/${fecIdParam}/individual-contributors`)
        ]);

        if (!totalsRes.ok) {
          throw new Error('Failed to fetch campaign finance data.');
        }

        const totals = await totalsRes.json();
        setFinanceData(totals);

        if (stateRes.ok) {
          const states = await stateRes.json();
          setStateData(states);
        }

        if (contributorsRes.ok) {
          const contributors = await contributorsRes.json();
          setContributorData(contributors);
        }
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
          <Skeleton className="h-6 w-2/5" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !financeData) {
    return null;
  }

  const totalContributions =
    financeData.large_contributions +
    financeData.small_contributions +
    financeData.candidate_contributions +
    financeData.pac_contributions +
    financeData.other_contributions;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4" />
          Campaign Finance ({financeData.cycle})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {/* Finance Overview - Compact Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-muted/40 rounded">
            <div className="text-muted-foreground text-[10px] mb-0.5">Cash</div>
            <div className="font-bold text-blue-600">{formatCurrency(financeData.cash_on_hand)}</div>
          </div>
          <div className="text-center p-2 bg-muted/40 rounded">
            <div className="text-muted-foreground text-[10px] mb-0.5">Debts</div>
            <div className="font-bold text-orange-600">{formatCurrency(financeData.debts)}</div>
          </div>
          <div className="text-center p-2 bg-muted/40 rounded">
            <div className="text-muted-foreground text-[10px] mb-0.5">Raised</div>
            <div className="font-bold text-green-600">{formatCurrency(financeData.receipts)}</div>
          </div>
          <div className="text-center p-2 bg-muted/40 rounded">
            <div className="text-muted-foreground text-[10px] mb-0.5">Spent</div>
            <div className="font-bold text-red-600">{formatCurrency(financeData.disbursements)}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Contribution Breakdown */}
          <div>
            <div className="font-semibold mb-2">Contributions</div>
            <div className="space-y-1">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Large Individual</span>
                <span className="font-semibold">{formatCurrency(financeData.large_contributions)} <span className="text-[10px] text-muted-foreground">({calculatePercentage(financeData.large_contributions, totalContributions)})</span></span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Small Individual</span>
                <span className="font-semibold">{formatCurrency(financeData.small_contributions)} <span className="text-[10px] text-muted-foreground">({calculatePercentage(financeData.small_contributions, totalContributions)})</span></span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">PAC</span>
                <span className="font-semibold">{formatCurrency(financeData.pac_contributions)} <span className="text-[10px] text-muted-foreground">({calculatePercentage(financeData.pac_contributions, totalContributions)})</span></span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Candidate</span>
                <span className="font-semibold">{formatCurrency(financeData.candidate_contributions)} <span className="text-[10px] text-muted-foreground">({calculatePercentage(financeData.candidate_contributions, totalContributions)})</span></span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Other</span>
                <span className="font-semibold">{formatCurrency(financeData.other_contributions)} <span className="text-[10px] text-muted-foreground">({calculatePercentage(financeData.other_contributions, totalContributions)})</span></span>
              </div>
            </div>
          </div>

          {/* Top 5 States */}
          {stateData && stateData.state_totals.length > 0 && (
            <div>
              <div className="font-semibold mb-2">Top States</div>
              <div className="space-y-1">
                {stateData.state_totals.map((state, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">{state.state}</span>
                    <span className="font-mono font-semibold">{formatCurrency(state.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Contributors */}
          {contributorData && contributorData.top_contributors.length > 0 && (
            <div>
              <div className="font-semibold mb-2">Top Contributors</div>
              <div className="space-y-1">
                {contributorData.top_contributors.slice(0, 5).map((contributor, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground truncate">{contributor.employer}</span>
                    <span className="font-mono font-semibold whitespace-nowrap">{formatCurrency(contributor.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="text-[10px] text-muted-foreground pt-1 border-t">
          Source: FEC via OpenFEC API
        </div>
      </CardContent>
    </Card>
  );
};
