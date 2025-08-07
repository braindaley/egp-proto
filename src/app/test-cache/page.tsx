
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

interface CacheStatus {
    count: number;
    error?: string;
}

export default function TestCachePage() {
    const [status, setStatus] = useState<CacheStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);
    const [clearMessage, setClearMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const checkCacheStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/search/bills?debug=true');
            const data = await res.json();
            if(res.ok) {
                setStatus({ count: data.totalCached || 0 });
            } else {
                setStatus({ count: 0, error: data.error || 'Failed to fetch status' });
            }
        } catch (e) {
            setStatus({ count: 0, error: e.message });
        } finally {
            setLoading(false);
        }
    };
    
    const handleClearCache = async () => {
        setClearing(true);
        setClearMessage(null);
        try {
            const res = await fetch('/api/feed/bills/clear-cache');
            const data = await res.json();
            if (res.ok) {
                setClearMessage({ type: 'success', text: data.message });
            } else {
                 setClearMessage({ type: 'error', text: data.message || 'An error occurred.' });
            }
        } catch (e) {
             setClearMessage({ type: 'error', text: e.message });
        } finally {
            setClearing(false);
            // Re-check status after clearing
            checkCacheStatus();
        }
    };

    useEffect(() => {
        checkCacheStatus();
    }, []);

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <header className="text-center mb-12">
                <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
                    Cache Management
                </h1>
                <p className="text-lg text-muted-foreground">
                    Test and manage the Firestore cache for bills.
                </p>
            </header>

            <div className="max-w-md mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Cache Status</CardTitle>
                        <CardDescription>
                            The number of bills currently stored in the Firestore cache.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                             <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Checking cache status...</span>
                             </div>
                        ) : status ? (
                            <div className="text-3xl font-bold">
                                {status.count} bills
                            </div>
                        ) : (
                            <div className="text-red-500">Could not retrieve status.</div>
                        )}

                        <Button 
                            onClick={handleClearCache} 
                            disabled={clearing}
                            className="w-full mt-6"
                        >
                            {clearing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Clearing...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Clear Cached Bills
                                </>
                            )}
                        </Button>
                        
                        {clearMessage && (
                            <div className={`mt-4 p-3 rounded-md text-sm flex items-center gap-2 ${clearMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {clearMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                {clearMessage.text}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

