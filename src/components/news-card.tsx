'use client';
import { useState, useEffect } from 'react';
import type { NewsArticle } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { Newspaper, WifiOff } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

function formatDate(dateString: string | undefined | number) {
    if (!dateString) return 'N/A';
    if (typeof dateString === 'number') return dateString.toString();
    const date = new Date(dateString.includes('T') || dateString.includes('GMT') ? dateString : `${dateString}T12:00:00Z`);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

interface NewsApiResponse {
    articles: NewsArticle[];
    error?: string;
}

export const NewsCard = ({ bioguideId }: { bioguideId: string }) => {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchNewsData() {
            if (!bioguideId) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            try {
                const res = await fetch(`${baseUrl}/api/congress/member/${bioguideId}/news`);
                const data: NewsApiResponse = await res.json();
                if (res.ok) {
                    setNews(data.articles || []);
                    if (data.error) {
                         setError(`Could not load news: ${data.error}`);
                    }
                } else {
                    setError(data.error || 'Failed to fetch news data.');
                    setNews([]);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
                setError(errorMessage);
                console.error("Failed to fetch news data", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchNewsData();
    }, [bioguideId]);

    if (isLoading) {
        return (
            <Card>
               <CardHeader>
                   <Skeleton className="h-6 w-2/5" />
                   <Skeleton className="h-4 w-4/5 mt-2" />
               </CardHeader>
               <CardContent className="space-y-4">
                   <Skeleton className="h-12 w-full" />
                   <Skeleton className="h-12 w-full" />
                   <Skeleton className="h-12 w-full" />
               </CardContent>
           </Card>
        )
    }

    if (error || news.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Newspaper /> Recent News</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                     <WifiOff className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                    <p className="font-semibold text-muted-foreground">
                        {error ? 'Could Not Load News' : 'No Recent News Found'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {error ? 'There was an issue fetching recent articles.' : 'We could not find any recent news articles for this member.'}
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Newspaper /> Recent News</CardTitle>
                <CardDescription>Generated from public news feeds.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {news.map((article, index) => (
                        <a href={article.link} target="_blank" rel="noopener noreferrer" key={index} className="block p-3 bg-secondary/50 rounded-md hover:bg-secondary transition-colors">
                            <div className="flex items-start gap-4">
                                {article.imageUrl && (
                                    <div className="relative w-24 h-16 rounded-md overflow-hidden shrink-0">
                                        <Image 
                                            src={article.imageUrl}
                                            alt={article.title || 'News article thumbnail'}
                                            fill
                                            className="object-cover"
                                            data-ai-hint="news photo"
                                            sizes="96px"
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="font-semibold text-sm leading-tight">{article.title}</p>
                                    <div className="text-xs text-muted-foreground mt-2 flex justify-between items-center">
                                        {article.source?._ && <span>{article.source._}</span>}
                                        <span>{formatDate(article.pubDate)}</span>
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
