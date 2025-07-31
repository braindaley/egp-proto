'use client';
import { useState, useEffect } from 'react';
import type { Member, CampaignPromisesData, CampaignPromise } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getCampaignPromises } from '@/ai/flows/get-campaign-promises-flow';
import { Trophy, Hourglass, CircleSlash, FileText, Target } from 'lucide-react';

export const CampaignPromisesCard = ({ member, congress }: { member: Member, congress: string }) => {
    const [data, setData] = useState<CampaignPromisesData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!member.directOrderName || !congress) return;
            setIsLoading(true);
            setError('');
            try {
                const result = await getCampaignPromises({
                    memberName: member.directOrderName,
                    congressNumber: congress
                });
                setData(result);
            } catch (e) {
                console.error("Error fetching campaign promises:", e);
                setError('Could not load campaign promises.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [member, congress]);

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/5" />
                    <Skeleton className="h-4 w-4/5 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (error || !data || !data.promises || data.promises.length === 0) {
        return null;
    }
    
    const getStatusIcon = (status: CampaignPromise['status']) => {
        switch (status) {
            case 'Completed': return <Trophy className="h-4 w-4 text-green-600" />;
            case 'In Progress': return <Hourglass className="h-4 w-4 text-blue-600" />;
            case 'Stalled': return <CircleSlash className="h-4 w-4 text-yellow-600" />;
            case 'Not Started': return <FileText className="h-4 w-4 text-gray-500" />;
            default: return null;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Recent Campaign Promises
                </CardTitle>
                <CardDescription>
                    A generated overview of key promises from recent campaigns.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    {data.promises.map((promise, index) => (
                        <div key={index} className="p-4 rounded-lg border bg-secondary/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge 
                                        variant={
                                            promise.priority === 'High' ? 'default' :
                                            promise.priority === 'Medium' ? 'secondary' : 'outline'
                                        }
                                        className="mb-2"
                                    >
                                        {promise.priority} Priority
                                    </Badge>
                                    <h4 className="font-bold text-base text-foreground">{promise.title}</h4>
                                </div>
                                <Badge variant="outline" className="flex items-center gap-1.5 shrink-0">
                                    {getStatusIcon(promise.status)}
                                    {promise.status}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">{promise.description}</p>
                            <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border">
                                Category: {promise.category}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="bg-secondary/30 p-4 rounded-lg border border-border">
                    <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                        ℹ️ Important Note
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                        Campaign promises are complex and can evolve over time. For the most accurate and official platform details, please consult the member's official campaign website.
                    </p>
                    <p className="text-xs text-muted-foreground opacity-80 italic">
                        This information is generated based on common political platforms and may not reflect the member's actual campaign promises.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
