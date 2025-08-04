'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CommitteeReport {
  citation: string;
  title: string;
  type: string;
  url: string;
  date: string;
}

function formatDate(dateString: string): string {
  try {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function CommitteeReports({ committeeId, chamber }: { committeeId: string, chamber: string }) {
    const [reports, setReports] = useState<CommitteeReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReports = async () => {
            if(!committeeId || !chamber) return;
            setIsLoading(true);
            try {
                const res = await fetch(`/api/congress/committee/${committeeId}/reports?chamber=${chamber}`);
                if(!res.ok) throw new Error('Failed to fetch reports');
                const data = await res.json();
                setReports(data.reports || []);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchReports();
    }, [committeeId, chamber]);

    if(isLoading) {
        return (
            <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Recent Reports
                </h4>
                <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
        )
    }
    
    if (error || reports.length === 0) {
        // Don't render anything if there are no reports or an error occurred
        return null;
    }

    return (
        <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Recent Reports
            </h4>
            <div className="space-y-3">
                    {reports.map((report, index) => (
                    <div key={report.citation || index} className="border-l-2 border-primary/20 pl-4 space-y-1">
                        <h5 className="font-medium text-sm">
                            <a href={report.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                {report.title}
                            </a>
                        </h5>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            {report.citation && <span>{report.citation}</span>}
                            {report.date && <span>{formatDate(report.date)}</span>}
                            {report.type && <Badge variant="outline" className="text-xs">{report.type}</Badge>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
