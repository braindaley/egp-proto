'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from 'lucide-react';

interface IdeologyData {
  bioguide_id: string;
  bioname: string;
  nominate_dim1: number;
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

interface SimpleIdeologyChartProps {
  bioguideId: string;
}

export function SimpleIdeologyChart({ bioguideId }: SimpleIdeologyChartProps) {
  const [memberData, setMemberData] = useState<IdeologyData | null>(null);
  const [allData, setAllData] = useState<IdeologyData[]>([]);
  const [histogramData, setHistogramData] = useState<HistogramBin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both individual member data and all data for histogram
        const [memberResponse, allResponse] = await Promise.all([
          fetch(`/api/ideology?bioguideId=${bioguideId}`),
          fetch('/api/ideology')
        ]);
        
        const memberResult = await memberResponse.json();
        const allResult = await allResponse.json();
        
        if (memberResult.success && allResult.success) {
          setMemberData(memberResult.data);
          setAllData(allResult.data);
          
          // Process histogram data
          const histData = processHistogramData(allResult.data, memberResult.data);
          setHistogramData(histData);
        }
      } catch (err) {
        console.error('Error fetching ideology data:', err);
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
        // Color based on ideology: liberal (dark slate) or conservative (dark red)
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
            <BarChart />
            Ideology Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!memberData || !histogramData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart />
            Ideology Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ideology data not available for this member
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...histogramData.map(bin => bin.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart />
          Ideology Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Histogram */}
        <div className="h-32 relative mb-4">
          <div className="flex items-end justify-between h-full px-1">
            {histogramData.map((bin, index) => (
              <div
                key={index}
                className="flex-1 mx-px"
                style={{
                  height: bin.count > 0 ? `${(bin.count / maxCount) * 100}%` : '2px',
                  backgroundColor: bin.color,
                  minHeight: bin.count > 0 ? '4px' : '2px'
                }}
              />
            ))}
          </div>
          
          {/* Triangle marker for the specific member */}
          {memberData && typeof memberData.nominate_dim1 === 'number' && (
            <div 
              className="absolute flex flex-col items-center"
              style={{
                left: `${((memberData.nominate_dim1 + 1) / 2) * 100}%`,
                transform: 'translateX(-50%)',
                bottom: '-12px'
              }}
            >
              <div 
                className="w-0 h-0" 
                style={{
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent', 
                  borderTop: '12px solid #333333'
                }}
              />
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