'use client';
import { useState, useEffect } from 'react';
import { BillCard } from '@/components/bill-card';
import { getAllowedSubjectsForFilter } from '@/lib/subjects';
import type { Bill } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function IssuesPage({ params }: { params: Promise<{ congress: string }> }) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [congressParam, setCongressParam] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(unwrappedParams => {
      setCongressParam(unwrappedParams.congress);
    });
  }, [params]);

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const searchBills = async () => {
    if (selectedSubjects.length === 0) return;
    
    setLoading(true);
    setError(null);
    setBills([]);

    try {
      // NOTE: The Congress.gov API does not support OR logic for subjects in a single query.
      // We are fetching bills for the first selected subject as a demonstration.
      // A more robust solution would require multiple API calls or a different data source.
      const subjectQuery = selectedSubjects[0];
      const searchUrl = `/api/bills/${congressParam}?subject=${encodeURIComponent(subjectQuery)}`;
      
      const res = await fetch(searchUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch bills: ${res.statusText}`);
      }
      const data = await res.json();
      setBills(data.bills || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error searching bills:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedSubjects([]);
    setBills([]);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <p className="text-lg text-muted-foreground font-medium mb-1">{congressParam}th Congress</p>
        <h1 className="text-4xl font-bold text-primary mb-2">
          Browse Bills by Issue
        </h1>
        <p className="text-lg text-muted-foreground">
          Select one or more topics to find relevant bills.
        </p>
      </header>

      {/* Subject Filter Grid */}
      <div className="mb-8 p-6 bg-card rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Select Issues:</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          {getAllowedSubjectsForFilter().map(subject => (
            <div key={subject} className="flex items-center space-x-2">
              <Checkbox
                id={subject}
                checked={selectedSubjects.includes(subject)}
                onCheckedChange={() => handleSubjectToggle(subject)}
              />
              <Label htmlFor={subject} className="text-sm font-normal cursor-pointer">{subject}</Label>
            </div>
          ))}
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={searchBills}
            disabled={selectedSubjects.length === 0 || loading}
          >
            {loading ? 'Searching...' : `Search Bills (${selectedSubjects.length} topics)`}
          </Button>
          
          {selectedSubjects.length > 0 && (
            <Button
              onClick={clearFilters}
              variant="outline"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Selected Subjects Display */}
      {selectedSubjects.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Selected Topics:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedSubjects.map(subject => (
              <Badge key={subject} variant="secondary" className="text-base">
                {subject}
                <button
                  onClick={() => handleSubjectToggle(subject)}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                >
                  &times;
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {error && (
        <div className="text-center py-10 px-6 bg-destructive/10 rounded-lg">
            <p className="text-xl font-semibold text-destructive">Error</p>
            <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      )}

      {/* Results */}
      {!loading && bills.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Found {bills.length} bills
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {bills.map(bill => (
              <BillCard key={`${bill.type}-${bill.number}-${bill.congress}`} bill={bill} />
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Searching for bills...</p>
        </div>
      )}
      
      {!loading && bills.length === 0 && selectedSubjects.length > 0 && !error && (
         <div className="text-center py-10 px-6 bg-card rounded-lg shadow-md">
            <p className="text-xl font-semibold">No Bills Found</p>
            <p className="text-muted-foreground mt-2">
                No bills were found for the selected topic(s) in this session.
            </p>
        </div>
      )}
    </div>
  );
}
