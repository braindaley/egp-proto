'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useZipCode } from '@/hooks/use-zip-code';

interface AdvocacyMessageCandidateProps {
  candidate1Name: string;
  candidate1Bio?: string;
  candidate2Name: string;
  candidate2Bio?: string;
  campaignId?: string;
}

export function AdvocacyMessageCandidate({
  candidate1Name,
  candidate1Bio,
  candidate2Name,
  candidate2Bio,
  campaignId
}: AdvocacyMessageCandidateProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<'1' | '2' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { user } = useAuth();
  const { zipCode } = useZipCode();

  const handleSubmit = async () => {
    if (!selectedCandidate) return;

    setIsSubmitting(true);

    try {
      const { getFirestore, collection, addDoc, Timestamp } = await import('firebase/firestore');
      const { app } = await import('@/lib/firebase');
      const db = getFirestore(app);

      const pollResponse = {
        campaignId: campaignId || 'unknown',
        candidate1Name,
        candidate2Name,
        selectedCandidate,
        userId: user?.uid || null,
        timestamp: Timestamp.now(),
        metadata: {
          zipCode: zipCode || null,
          userState: zipCode ? zipCode.substring(0, 2) : null
        }
      };

      await addDoc(collection(db, 'candidate_poll_responses'), pollResponse);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting poll response:', error);
      alert('Failed to submit your opinion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="flex-1 flex flex-col m-0 md:m-auto border-0 md:border rounded-none md:rounded-lg overflow-hidden bg-background">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
            <h2 className="text-2xl font-bold">Thank You!</h2>
            <p className="text-center text-muted-foreground max-w-md">
              Your opinion has been recorded. Thank you for participating in this poll.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="flex-1 flex flex-col m-0 md:m-auto border-0 md:border rounded-none md:rounded-lg overflow-hidden bg-background">
        <CardHeader className="bg-background">
          <CardTitle>Which candidate do you prefer?</CardTitle>
          <CardDescription>
            Share your opinion by selecting your preferred candidate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex-1 flex flex-col bg-background">
          <RadioGroup
            value={selectedCandidate}
            onValueChange={(value) => setSelectedCandidate(value as '1' | '2')}
            disabled={isSubmitting}
          >
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <RadioGroupItem value="1" id="candidate1" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="candidate1" className="cursor-pointer">
                    <div className="font-semibold text-lg">{candidate1Name}</div>
                    {candidate1Bio && (
                      <p className="text-sm text-muted-foreground mt-2">{candidate1Bio}</p>
                    )}
                  </Label>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <RadioGroupItem value="2" id="candidate2" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="candidate2" className="cursor-pointer">
                    <div className="font-semibold text-lg">{candidate2Name}</div>
                    {candidate2Bio && (
                      <p className="text-sm text-muted-foreground mt-2">{candidate2Bio}</p>
                    )}
                  </Label>
                </div>
              </div>
            </div>
          </RadioGroup>

          <div className="flex-1"></div>
          <div className="flex justify-end pt-6">
            <Button
              onClick={handleSubmit}
              disabled={!selectedCandidate || isSubmitting}
              className="min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Share Your Opinion'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
