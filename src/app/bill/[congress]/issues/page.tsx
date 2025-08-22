
'use client';
import { useState, useEffect, useCallback, use } from 'react';
import { BillCard } from '@/components/bill-card';
import { getAllowedSubjectsForFilter } from '@/lib/subjects';
import type { Bill } from '@/types';
import { Badge } from '@/components/ui/badge';

interface BillsResponse {
  bills: Bill[];
  pagination: {
    count: number;
    offset: number;
    hasMore: boolean;
    total?: number;
  };
  debug?: any;
}

// Simple in-memory cache
const billsCache = new Map<string, { data: BillsResponse; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function IssuesClient({ congress }: { congress: string }) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pagination, setPagination] = useState({
    offset: 0,
    hasMore: true,
    total: null as number | null
  });
  const [error, setError] = useState<string | null>(null);

  // Load bills with caching
  const loadBills = useCallback(async (
    subjects: string[] = [], 
    offset: number = 0, 
    replace: boolean = true
  ): Promise<void> => {
    if (!congress) return;

    const cacheKey = `${congress}-${subjects.sort().join(',')}-${offset}`;
    const cached = billsCache.get(cacheKey);
    
    // Return cached data if fresh
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('🔥 Using cached data for:', cacheKey);
      const response = cached.data;
      
      if (replace) {
        setBills(response.bills);
      } else {
        setBills(prev => [...prev, ...response.bills]);
      }
      
      setPagination({
        offset: response.pagination.offset + response.pagination.count,
        hasMore: response.pagination.hasMore,
        total: response.pagination.total
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        congress: congress,
        limit: '20',
        offset: offset.toString()
      });

      if (subjects.length > 0) {
        params.append('subjects', subjects.join(','));
      }

      console.log('🔍 Fetching bills with params:', Object.fromEntries(params));

      const response = await fetch(`/api/bills/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch bills: ${response.status}`);
      }

      const data: BillsResponse = await response.json();
      
      // Cache the response
      billsCache.set(cacheKey, { data, timestamp: Date.now() });

      if (replace) {
        setBills(data.bills);
      } else {
        setBills(prev => [...prev, ...data.bills]);
      }

      setPagination({
        offset: data.pagination.offset + data.pagination.count,
        hasMore: data.pagination.hasMore,
        total: data.pagination.total
      });

      console.log('✅ Loaded bills:', {
        count: data.bills.length,
        hasMore: data.pagination.hasMore,
        debug: data.debug
      });

    } catch (err) {
      console.error('Error loading bills:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bills');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [congress]);

  // Initial load: 20 most recent bills
  useEffect(() => {
    if (congress) {
      loadBills([], 0, true);
    }
  }, [congress, loadBills]);

  // Handle subject selection
  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev => {
      const newSubjects = prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject];
      
      // Reset pagination and load filtered bills
      setPagination({ offset: 0, hasMore: true, total: null });
      loadBills(newSubjects, 0, true);
      
      return newSubjects;
    });
  };

  // Load more bills (append to existing)
  const loadMoreBills = () => {
    if (!loading && pagination.hasMore) {
      loadBills(selectedSubjects, pagination.offset, false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedSubjects([]);
    setPagination({ offset: 0, hasMore: true, total: null });
    loadBills([], 0, true);
  };

  // Auto-load more on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        !loading && 
        pagination.hasMore && 
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000
      ) {
        loadMoreBills();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, pagination.hasMore, selectedSubjects, pagination.offset, loadMoreBills]);

  if (initialLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading recent bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">
          Browse Bills by Issue
        </h1>
        <p className="text-lg text-muted-foreground">
          {selectedSubjects.length === 0 
            ? `Showing most recent bills • ${congress}th Congress`
            : `Select one or more topics to find relevant bills • ${congress}th Congress`
          }
        </p>
      </header>

      {/* Subject Filter Grid */}
      <div className="mb-8 p-6 bg-card rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Select Issues:</h2>
          {selectedSubjects.length > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Show All Recent Bills
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {getAllowedSubjectsForFilter().map(subject => (
            <label key={subject} className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
              <input
                type="checkbox"
                checked={selectedSubjects.includes(subject)}
                onChange={() => handleSubjectToggle(subject)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{subject}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Active Filters Display */}
      {selectedSubjects.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Filtered by:</h3>
            <button
              onClick={clearFilters}
              className="text-sm px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedSubjects.map(subject => (
              <Badge key={subject} variant="secondary" className="text-base">
                {subject}
                <button
                  onClick={() => handleSubjectToggle(subject)}
                  className="ml-2 text-primary/60 hover:text-primary"
                  aria-label={`Remove ${subject} filter`}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-destructive font-medium">Error loading bills:</p>
          <p className="text-destructive text-sm">{error}</p>
          <button
            onClick={() => loadBills(selectedSubjects, 0, true)}
            className="mt-2 text-sm px-3 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results Summary */}
      {bills.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">
            {pagination.total ? `${pagination.total} total bills` : `${bills.length} bills loaded`}
            {selectedSubjects.length > 0 && ` matching selected topics`}
          </h3>
          {pagination.hasMore && (
            <p className="text-sm text-muted-foreground">
              Scroll down or click "Load More" for additional results
            </p>
          )}
        </div>
      )}

      {/* Bills Grid */}
      {bills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {bills.map((bill, index) => (
            <div key={`${bill.type}-${bill.number}-${bill.congress}-${index}`} className="relative">
              <BillCard bill={bill} />
            </div>
          ))}
        </div>
      ) : !initialLoading && !loading ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground mb-2">No bills found</p>
          <p className="text-muted-foreground">
            {selectedSubjects.length > 0 
              ? 'Try selecting different topics or clearing your filters.'
              : 'There was an issue loading recent bills.'
            }
          </p>
        </div>
      ) : null}

      {/* Load More Button */}
      {pagination.hasMore && bills.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={loadMoreBills}
            disabled={loading}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                Loading...
              </span>
            ) : (
              `Load More Bills`
            )}
          </button>
        </div>
      )}

      {/* Loading Indicator for Scroll */}
      {loading && bills.length > 0 && (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading more bills...</p>
        </div>
      )}
    </div>
  );
}

export default function IssuesPage({ params }: { params: Promise<{ congress: string }> }) {
  const resolvedParams = use(params);
  return <IssuesClient congress={resolvedParams.congress} />;
}
