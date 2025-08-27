
'use client';
import { BillCard } from '@/components/bill-card';
import type { Bill } from '@/types';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';

interface PopularBillResponse {
    bills: Bill[];
    debug: any;
}

interface LoadingState {
    isLoading: boolean;
    error: string | null;
}

// Client component to render the list and handle logging
function PopularBillList({ bills, debug }: PopularBillResponse) {
    const debugLoggedRef = useRef(false);
    
    useEffect(() => {
        if (debug && !debugLoggedRef.current) {
            console.log('Popular Bills API Debug Info:', debug);
            debugLoggedRef.current = true;
        }
    }, [debug]);
    
    if (!bills || bills.length === 0) {
        return (
            <div className="text-center py-10 px-6 bg-card rounded-lg shadow-md">
                <div className="max-w-md mx-auto">
                    <h2 className="text-xl font-semibold text-destructive mb-2">
                        Could Not Load Popular Bills
                    </h2>
                    <p className="text-muted-foreground mb-4">
                        There was an issue fetching the most-viewed bills from Congress.gov.
                    </p>
                    
                    {debug?.error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
                            <p className="text-sm text-destructive font-medium">Error:</p>
                            <p className="text-sm text-destructive">{debug.error}</p>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                        Try Again
                    </button>
                    
                    {debug && (
                        <details className="mt-4">
                            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                                Show Debug Info
                            </summary>
                            <pre className="mt-2 text-xs text-left bg-secondary p-4 rounded-md overflow-auto max-h-40">
                                {JSON.stringify(debug, null, 2)}
                            </pre>
                        </details>
                    )}
                    
                    {/* Additional backend debugging info */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-left">
                        <p className="text-sm font-medium text-blue-800 mb-2">Backend Issue Detected:</p>
                        <p className="text-xs text-blue-700">
                            RSS feed is being fetched ({debug?.rssItems || 0} items) but parsing is failing (parsedCount: {debug?.parsedCount || 0}).
                            Check your backend RSS parsing logic.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="text-center">
                <p className="text-sm text-muted-foreground">
                    Showing {bills.length} most-viewed bill{bills.length !== 1 ? 's' : ''} this week
                </p>
                {debug?.lastUpdated && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Last updated: {new Date(debug.lastUpdated).toLocaleString()}
                    </p>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                {bills.map((bill, index) => (
                    <div key={`${bill.type}-${bill.number}-${bill.congress}`} className="relative">
                        <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10">
                            {index + 1}
                        </div>
                        <BillCard bill={bill} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function PopularBillsPage() {
    const params = useParams();
    const congress = params?.congress as string || '119'; // Default to 119th congress
    
    const [data, setData] = useState<PopularBillResponse | null>(null);
    const [loadingState, setLoadingState] = useState<LoadingState>({
        isLoading: true,
        error: null
    });
    
    const fetchingRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Function to fetch popular bills with abort controller
    const getPopularBills = useCallback(async (signal: AbortSignal): Promise<PopularBillResponse> => {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9002');
        const url = `${baseUrl}/api/bills/popular`;
        
        console.log('🔗 Fetching popular bills from:', url);

        try {
            const res = await fetch(url, { 
                signal,
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (signal.aborted) {
                throw new Error('Request aborted');
            }
            
            console.log('🔗 Response status:', res.status);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('🔗 Popular bills API fetch failed:', errorText);
                throw new Error(`API responded with ${res.status}: ${errorText}`);
            }
            
            const data: PopularBillResponse = await res.json();
            console.log('🔗 Fetched bills array length:', data.bills?.length);
            console.log('🔗 API debug info:', data.debug);
            
            // Enhanced debugging for RSS parsing issues
            if (data.bills?.length === 0 && data.debug?.rssItems > 0) {
                console.warn('🚨 RSS PARSING ISSUE: RSS items found but no bills parsed!');
                console.log('🔍 Debug info:', {
                    rssItems: data.debug.rssItems,
                    parsedCount: data.debug.parsedCount,
                    lastUpdated: data.debug.lastUpdated,
                    rawDebug: data.debug
                });
            }
            
            return data;

        } catch (error) {
            if (signal.aborted) {
                console.log('🔗 Request was aborted');
                throw new Error('Request aborted');
            }
            console.error('🔗 Client-side fetch error:', error);
            throw error;
        }
    }, []);
    
    useEffect(() => {
        if (fetchingRef.current) return;
        
        const fetchData = async () => {
            fetchingRef.current = true;
            
            // Cleanup previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            
            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            try {
                setLoadingState({ isLoading: true, error: null });
                const result = await getPopularBills(abortController.signal);
                
                if (!abortController.signal.aborted) {
                    setData(result);
                    setLoadingState({ isLoading: false, error: null });
                }
            } catch (error) {
                if (!abortController.signal.aborted) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    console.error('🔗 Failed to fetch popular bills:', errorMessage);
                    setLoadingState({ isLoading: false, error: errorMessage });
                    setData({ bills: [], debug: { error: errorMessage } });
                }
            } finally {
                fetchingRef.current = false;
            }
        };

        fetchData();

        // Cleanup function
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            fetchingRef.current = false;
        };
    }, [getPopularBills]); // Removed congress dependency since it's not used in the API call

    return (
        <div className="bg-background min-h-screen">
            <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">
                <header className="text-center mb-12">
                    <p className="text-lg text-muted-foreground font-medium mb-1">{congress}th Congress</p>
                    <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
                        Popular Bills
                    </h1>
                </header>
                
                {loadingState.isLoading ? (
                    <div className="text-center py-10">
                        <div className="inline-flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <p className="text-muted-foreground">Loading popular bills...</p>
                        </div>
                    </div>
                ) : loadingState.error && !data?.bills.length ? (
                    <div className="text-center py-10 px-6 bg-card rounded-lg shadow-md max-w-md mx-auto">
                        <h2 className="text-xl font-semibold text-destructive mb-2">
                            Failed to Load
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            {loadingState.error}
                        </p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : data ? (
                    <PopularBillList bills={data.bills} debug={data.debug} />
                ) : null}
            </div>
            
            <footer className="text-center py-6 text-sm text-muted-foreground border-t">
                <p>
                    Data courtesy of{' '}
                    <a 
                        href="https://www.congress.gov/rss/most-viewed-bills.xml" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="underline hover:text-primary transition-colors"
                    >
                        Congress.gov RSS
                    </a>
                    {' • '}
                    <a 
                        href="https://www.congress.gov" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="underline hover:text-primary transition-colors"
                    >
                        Congress.gov
                    </a>
                </p>
            </footer>
        </div>
    );
}