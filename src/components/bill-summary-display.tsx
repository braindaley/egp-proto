'use client';

import { useState, useEffect } from 'react';
import type { Summary } from '@/types';
import { Loader2, FileText } from 'lucide-react';
import { summarizeText, getDemocraticPerspective, getRepublicanPerspective } from '@/ai/flows/summarize-text-flow';

// Helper function to strip HTML and clean text
const cleanTextForAI = (htmlText: string | null | undefined): string | null => {
  if (!htmlText || typeof htmlText !== 'string') {
    return null;
  }
  
  // Strip HTML tags
  const stripped = htmlText.replace(/<[^>]*>/g, ' ');
  
  // Clean up extra whitespace and decode HTML entities
  const cleaned = stripped
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  
  // Return null if the cleaned text is too short to be meaningful
  return cleaned.length > 20 ? cleaned : null;
};

export const SummaryDisplay = ({ summary, showPoliticalPerspectives = false }: { summary: Summary; showPoliticalPerspectives?: boolean }) => {
  const [aiSummary, setAiSummary] = useState('');
  const [democraticView, setDemocraticView] = useState('');
  const [republicanView, setRepublicanView] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const generateContent = async () => {
      if (!summary || !summary.text) {
        setAiSummary('No summary text available to analyze.');
        if (showPoliticalPerspectives) {
          setDemocraticView('No text available to analyze.');
          setRepublicanView('No text available to analyze.');
        }
        return;
      }

      const cleanedText = cleanTextForAI(summary.text);
      
      if (!cleanedText || cleanedText.length === 0 || cleanedText.trim().length === 0) {
        setAiSummary('No meaningful summary text available to analyze.');
        if (showPoliticalPerspectives) {
          setDemocraticView('No meaningful text available to analyze.');
          setRepublicanView('No meaningful text available to analyze.');
        }
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        
        if (typeof cleanedText === 'string' && cleanedText.trim().length > 20) {
          if (showPoliticalPerspectives) {
            // Generate summary and political perspectives
            const [summaryResult, democraticResult, republicanResult] = await Promise.all([
              summarizeText(cleanedText),
              getDemocraticPerspective(cleanedText),
              getRepublicanPerspective(cleanedText)
            ]);
            
            setAiSummary(summaryResult || 'Summary generation completed but no result returned.');
            setDemocraticView(democraticResult || 'Democratic perspective analysis completed but no result returned.');
            setRepublicanView(republicanResult || 'Republican perspective analysis completed but no result returned.');
          } else {
            // Generate only summary for older summaries
            const summaryResult = await summarizeText(cleanedText);
            setAiSummary(summaryResult || 'Summary generation completed but no result returned.');
          }
        } else {
          setAiSummary('Text too short for analysis.');
          if (showPoliticalPerspectives) {
            setDemocraticView('Text too short for analysis.');
            setRepublicanView('Text too short for analysis.');
          }
        }
      } catch (e) {
        console.error("Error generating content:", e);
        setError('Could not generate content.');
      } finally {
        setIsLoading(false);
      }
    };

    generateContent();
  }, [summary, showPoliticalPerspectives]);

  return (
    <div>
      
      {isLoading && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating analysis...</span>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!isLoading && !error && aiSummary && (
        <>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground italic flex items-center gap-1">
              <FileText className="h-3 w-3" />
              AI-generated overview:
            </p>
            <p className="prose prose-sm max-w-none text-muted-foreground mt-1">{aiSummary}</p>
          </div>

        </>
      )}

    </div>
  );
}