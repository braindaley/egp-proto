'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingRight } from 'lucide-react';

interface IdeologyData {
  bioguide_id: string;
  bioname: string;
  nominate_dim1: number;
  nominate_dim2: number;
  chamber: string;
  party_code: number;
  state_abbrev: string;
}

interface HistogramBin {
  x_mid: number;
  count: number;
  color: string;
  isHighlighted: boolean;
}

interface IdeologyChartProps {
  bioguideId: string;
  memberName?: string;
}

export function IdeologyChart({ bioguideId, memberName }: IdeologyChartProps) {
  const [allData, setAllData] = useState<IdeologyData[]>([]);
  const [memberData, setMemberData] = useState<IdeologyData | null>(null);
  const [histogramData, setHistogramData] = useState<HistogramBin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all ideology data for histogram
        const [allResponse, memberResponse] = await Promise.all([
          fetch('/api/ideology'),
          fetch(`/api/ideology?bioguideId=${bioguideId}`)
        ]);

        if (!allResponse.ok || !memberResponse.ok) {
          throw new Error('Failed to fetch ideology data');
        }

        const allResult = await allResponse.json();
        const memberResult = await memberResponse.json();

        if (!allResult.success || !memberResult.success) {
          throw new Error('API returned error response');
        }

        setAllData(allResult.data);
        setMemberData(memberResult.data);

        // Process histogram data
        const histData = processHistogramData(allResult.data, memberResult.data);
        setHistogramData(histData);
        
      } catch (err) {
        console.error('Error fetching ideology data:', err);
        setError('Failed to load ideology data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bioguideId]);

  const processHistogramData = (allMembers: IdeologyData[], currentMember: IdeologyData): HistogramBin[] => {
    // Create bins from -1 to 1 with 0.08 width (25 bins total)
    const binWidth = 0.08;
    const bins: HistogramBin[] = [];
    
    // Initialize bins
    for (let i = 0; i < 25; i++) {
      const binStart = -1 + (i * binWidth);
      const binMid = binStart + (binWidth / 2);
      
      bins.push({
        x_mid: binMid,
        count: 0,
        color: '#333333',
        isHighlighted: false
      });
    }

    // Count members in each bin
    allMembers.forEach(member => {
      if (typeof member.nominate_dim1 === 'number') {
        const binIndex = Math.floor((member.nominate_dim1 + 1) / binWidth);
        if (binIndex >= 0 && binIndex < bins.length) {
          bins[binIndex].count++;
        }
      }
    });

    // Highlight the bin containing the current member
    if (currentMember && typeof currentMember.nominate_dim1 === 'number') {
      const memberBinIndex = Math.floor((currentMember.nominate_dim1 + 1) / binWidth);
      if (memberBinIndex >= 0 && memberBinIndex < bins.length) {
        bins[memberBinIndex].isHighlighted = true;
        // Color based on ideology: liberal (blue/dark slate) or conservative (red/dark red)
        bins[memberBinIndex].color = currentMember.nominate_dim1 < 0 ? '#2F4F4F' : '#8B0000';
      }
    }

    return bins;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingRight />
            Ideology Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !memberData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingRight />
            Ideology Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {error || 'Ideology data not available for this member'}
          </p>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingRight />
          Ideology Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-32 relative">
          <div className="flex items-end justify-between h-full px-4">
            {histogramData.map((bin, index) => (
              <div
                key={index}
                className="flex-1 mx-px"
                style={{
                  height: `${Math.min(100, (bin.count / Math.max(...histogramData.map(b => b.count))) * 100)}%`,
                  backgroundColor: bin.color,
                  minHeight: bin.count > 0 ? '2px' : '0px'
                }}
              />
            ))}
          </div>
          {memberData && typeof memberData.nominate_dim1 === 'number' && (
            <div 
              className="absolute bottom-0 flex flex-col items-center"
              style={{
                left: `${((memberData.nominate_dim1 + 1) / 2) * 100}%`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="w-0 h-0 border-l-2 border-r-2 border-t-4 border-l-transparent border-r-transparent border-t-gray-600" />
            </div>
          )}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Liberal</span>
          <span>Conservative</span>
        </div>
        {memberData && typeof memberData.nominate_dim1 === 'number' && (
          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              Score: <span className="font-medium text-foreground">
                {memberData.nominate_dim1.toFixed(3)}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}