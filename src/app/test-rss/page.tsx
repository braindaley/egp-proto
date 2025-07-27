'use client';
import { useState } from 'react';

export default function TestRSSPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const testRSSFeed = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        
        try {
            console.log('🧪 Testing RSS feed...');
            const response = await fetch('/api/bills/popular');
            const data = await response.json();
            
            console.log('🧪 API Response:', data);
            setResult(data);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            console.error('🧪 Test failed:', errorMsg);
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const testDirectRSS = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        
        try {
            console.log('🧪 Testing direct RSS access...');
            
            // This will likely fail due to CORS, but it's good to test
            const response = await fetch('https://www.congress.gov/rss/most-viewed-bills.xml', {
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`RSS fetch failed: ${response.status}`);
            }
            
            const text = await response.text();
            console.log('🧪 RSS Content length:', text.length);
            console.log('🧪 RSS Preview:', text.substring(0, 500));
            
            setResult({ 
                success: true, 
                contentLength: text.length, 
                preview: text.substring(0, 500) 
            });
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            console.error('🧪 Direct RSS test failed:', errorMsg);
            setError(`Direct RSS failed (expected due to CORS): ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">RSS Feed Debug Page</h1>
            
            <div className="space-y-4 mb-8">
                <button
                    onClick={testRSSFeed}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Testing...' : 'Test API Route'}
                </button>
                
                <button
                    onClick={testDirectRSS}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 ml-4"
                >
                    {loading ? 'Testing...' : 'Test Direct RSS (will likely fail)'}
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && (
                <div className="bg-gray-100 p-4 rounded">
                    <h2 className="text-xl font-semibold mb-4">Result:</h2>
                    <pre className="text-sm overflow-auto max-h-96 bg-white p-4 rounded border">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}

            <div className="mt-8 bg-yellow-50 p-4 rounded border-l-4 border-yellow-400">
                <h3 className="font-semibold text-yellow-800">Debugging Tips:</h3>
                <ul className="mt-2 text-yellow-700 space-y-1">
                    <li>• Check the browser console for detailed logs</li>
                    <li>• Check your Next.js server logs</li>
                    <li>• Verify the RSS feed is accessible: <a href="https://www.congress.gov/rss/most-viewed-bills.xml" target="_blank" className="underline">https://www.congress.gov/rss/most-viewed-bills.xml</a></li>
                    <li>• Make sure the rss-parser package is installed: npm install rss-parser</li>
                    <li>• Check if your deployment environment has network restrictions</li>
                </ul>
            </div>
        </div>
    );
}