'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Member, Amendment, Bill } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building,
  ExternalLink,
  FilePlus2,
  Globe,
  Loader2,
  Phone,
} from 'lucide-react';

// This would be a more specific type for amendments sponsored by a member
interface MemberAmendment extends Amendment {
  bill: Pick<Bill, 'number' | 'type' | 'congress' | 'title'>;
}

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// New component to fetch and display amendments
function MemberAmendments({
  bioguideId,
  congress,
}: {
  bioguideId: string;
  congress: string;
}) {
  const [amendments, setAmendments] = useState<MemberAmendment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAmendments() {
      try {
        const res = await fetch(
          `/api/congress/member/${bioguideId}/amendments?congress=${congress}`,
        );
        if (!res.ok) {
          throw new Error('Failed to fetch amendments');
        }
        const data = await res.json();
        setAmendments(data.amendments || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    loadAmendments();
  }, [bioguideId, congress]);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading amendments...</span>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (amendments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This member has not sponsored any amendments in this congress.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {amendments.map((amendment, index) => (
        <div key={index} className="p-4 bg-secondary/50 rounded-md">
          <div className="flex justify-between items-start">
            <div>
              <Link
                href={amendment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline"
              >
                {amendment.type} {amendment.number}
              </Link>
              <p className="text-sm text-muted-foreground mt-1">
                Amending:{' '}
                <Link
                  href={`/bill/${amendment.bill.congress}/${amendment.bill.type.toLowerCase().replace(/\./g, '')}/${amendment.bill.number}`}
                  className="text-primary hover:underline"
                >
                  {amendment.bill.type} {amendment.bill.number} -{' '}
                  {amendment.bill.title}
                </Link>
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <a href={amendment.url} target="_blank" rel="noopener noreferrer">
                View <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
          {amendment.description && (
            <p className="text-sm text-muted-foreground mt-2 pt-2 border-t border-secondary">
              {amendment.description}
            </p>
          )}
          {amendment.latestAction && (
            <p className="text-xs text-muted-foreground mt-2">
              <strong>Latest Action:</strong>{' '}
              {formatDate(amendment.latestAction.actionDate)} -{' '}
              {amendment.latestAction.text}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function MemberDetailClient({
  initialMember,
  congress,
}: {
  initialMember: Member;
  congress: string;
}) {
  const { bioguideId, name, party, state, district, terms, imageUrl, officialUrl, office, phone } = initialMember;

  const currentTerm = terms.find((term) => term.congress === parseInt(congress));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row items-start gap-8">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={`Portrait of ${name}`}
            className="w-48 h-auto rounded-lg shadow-md"
          />
        )}
        <div className="flex-1">
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
            {name}
          </h1>
          <p className="text-xl text-muted-foreground mt-1">
            {currentTerm?.chamber === 'House' ? 'Representative' : 'Senator'} for{' '}
            {state}
            {district ? `, District ${district}` : ''}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant={party === 'R' ? 'destructive' : 'default'}>
              {party === 'R' ? 'Republican' : 'Democrat'}
            </Badge>
            <Badge variant="secondary">{congress}th Congress</Badge>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {officialUrl && (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-primary"
            >
              <Globe className="h-4 w-4" /> Official Website
            </a>
          )}
          {phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> {phone}
            </div>
          )}
          {office && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" /> {office}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Amendments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilePlus2 />
            Amendments
          </CardTitle>
          <CardDescription>
            Amendments sponsored by this member in the {congress}th Congress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberAmendments bioguideId={bioguideId} congress={congress} />
        </CardContent>
      </Card>

      {/* Other sections like Sponsored Legislation, Committees etc. would go here */}
    </div>
  );
}

