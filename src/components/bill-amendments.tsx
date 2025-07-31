'use client';

import { useState, useEffect } from 'react';
import type { Amendment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, FilePlus2, ChevronsUpDown, Loader2 } from 'lucide-react';
import { getBillTypeSlug, formatDate } from '@/lib/utils';

function AmendmentText({ congress, amendmentType, amendmentNumber }: { congress: number; amendmentType: string; amendmentNumber: string; }) {
  const [data, setData] = useState<{ text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchText() {
      try {
        const amendmentTypeSlug = getBillTypeSlug(amendmentType);
        const res = await fetch(`/api/amendment/text?congress=${congress}&amendmentType=${amendmentTypeSlug}&amendmentNumber=${amendmentNumber}`);
        if (!res.ok) {
          throw new Error('Failed to fetch amendment text');
        }
        const result = await res.json();
        setData(result);
      } catch (e) {
        setData({ text: '<p>Could not load amendment text.</p>' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchText();
  }, [congress, amendmentType, amendmentNumber]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: data?.text || '' }} />
  );
}

const AmendmentListItem = ({ amendment }: { amendment: Amendment }) => (
  <Dialog>
    <DialogTrigger asChild>
      <li className="text-sm p-3 bg-secondary/50 rounded-md cursor-pointer hover:bg-secondary transition-colors">
        <div className="font-semibold flex justify-between items-center">
          <span>{amendment.type} {amendment.number}</span>
          <a href={amendment.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="hover:underline flex items-center gap-1 text-xs text-muted-foreground">
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        {amendment.description && (
          <p className="text-sm text-muted-foreground mt-2 prose prose-sm max-w-none">
            {amendment.description}
          </p>
        )}
        {amendment.latestAction && (
          <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-secondary">
            <p><span className="font-semibold">Latest Action:</span> {formatDate(amendment.latestAction.actionDate)}</p>
            <p className="mt-1">{amendment.latestAction.text}</p>
          </div>
        )}
      </li>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Amendment: {amendment.type} {amendment.number}</DialogTitle>
        <DialogDescription>
          Full text for the amendment.
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="flex-grow pr-6 -mr-6">
        <AmendmentText congress={amendment.congress} amendmentType={amendment.type} amendmentNumber={amendment.number} />
      </ScrollArea>
    </DialogContent>
  </Dialog>
);

export function BillAmendments({ congress, billType, billNumber }: { congress: number; billType: string; billNumber: string; }) {
  const [data, setData] = useState<{ amendments: Amendment[], count: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAmendments() {
      try {
        const billTypeSlug = getBillTypeSlug(billType);
        const res = await fetch(`/api/bill/amendments?congress=${congress}&billType=${billTypeSlug}&billNumber=${billNumber}`);
        if (!res.ok) {
          if (res.status === 404) {
            setData({ amendments: [], count: 0 });
            return;
          }
          throw new Error(`Failed to fetch amendments: ${res.statusText}`);
        }
        const result = await res.json();
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAmendments();
  }, [congress, billType, billNumber]);

  if (isLoading || error || !data || data.amendments.length === 0) {
    return null;
  }

  const { amendments, count } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FilePlus2 className="text-primary" />
          Amendments ({count})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 list-none p-0">
          {amendments.slice(0, 5).map((amendment) => (
            <AmendmentListItem key={amendment.url} amendment={amendment} />
          ))}
          {amendments.length > 5 && (
            <Collapsible>
              <CollapsibleContent className="space-y-3 list-none p-0 mt-3">
                {amendments.slice(5).map((amendment) => (
                  <AmendmentListItem key={amendment.url} amendment={amendment} />
                ))}
              </CollapsibleContent>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full mt-4">
                  <ChevronsUpDown className="mr-2 h-4 w-4" />
                  Show all {amendments.length} amendments
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
