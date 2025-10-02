'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

interface AdvocacyMessageCandidateProps {
  candidate1Name: string;
  candidate1Bio?: string;
  candidate2Name: string;
  candidate2Bio?: string;
}

export function AdvocacyMessageCandidate({
  candidate1Name,
  candidate1Bio,
  candidate2Name,
  candidate2Bio
}: AdvocacyMessageCandidateProps) {
  const [step, setStep] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState<'1' | '2' | ''>('');
  const [message, setMessage] = useState('');
  const [useAI, setUseAI] = useState<'yes' | 'no' | ''>('');

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const renderStep1 = () => (
    <Card className="flex-1 flex flex-col">
      <CardHeader>
        <div className="text-sm font-medium text-muted-foreground mb-2">Step 1 of {totalSteps}</div>
        <CardTitle>Select Your Preferred Candidate</CardTitle>
        <CardDescription>
          Choose which candidate you'd like to support in your message to representatives
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col">
        <RadioGroup value={selectedCandidate} onValueChange={(value) => setSelectedCandidate(value as '1' | '2')}>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="1" id="candidate1" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="candidate1" className="cursor-pointer">
                  <div className="font-semibold text-lg">{candidate1Name}</div>
                  {candidate1Bio && (
                    <p className="text-sm text-muted-foreground mt-1">{candidate1Bio}</p>
                  )}
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="2" id="candidate2" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="candidate2" className="cursor-pointer">
                  <div className="font-semibold text-lg">{candidate2Name}</div>
                  {candidate2Bio && (
                    <p className="text-sm text-muted-foreground mt-1">{candidate2Bio}</p>
                  )}
                </Label>
              </div>
            </div>
          </div>
        </RadioGroup>

        <div className="flex-1"></div>
        <div className="flex justify-end pt-6">
          <Button onClick={() => setStep(2)} disabled={!selectedCandidate}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2_AIHelp = () => (
    <Card className="flex-1 flex flex-col">
      <CardHeader>
        <div className="text-sm font-medium text-muted-foreground mb-2">Step 2 of {totalSteps}</div>
        <CardTitle>Writing Your Message</CardTitle>
        <CardDescription>
          Would you like help writing your message?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col">
        <RadioGroup value={useAI} onValueChange={(value) => setUseAI(value as 'yes' | 'no')}>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="yes" id="ai-yes" />
              <Label htmlFor="ai-yes" className="cursor-pointer flex-1">
                <div className="font-semibold">Yes, help me write a message</div>
                <p className="text-sm text-muted-foreground">
                  AI will generate a draft message supporting {selectedCandidate === '1' ? candidate1Name : candidate2Name}
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="no" id="ai-no" />
              <Label htmlFor="ai-no" className="cursor-pointer flex-1">
                <div className="font-semibold">No, I'll write my own message</div>
                <p className="text-sm text-muted-foreground">
                  Write a personalized message from scratch
                </p>
              </Label>
            </div>
          </div>
        </RadioGroup>

        <div className="flex-1"></div>
        <div className="flex justify-between pt-6">
          <Button variant="ghost" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button onClick={() => setStep(3)} disabled={!useAI}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3_WriteMessage = () => {
    const selectedCandidateName = selectedCandidate === '1' ? candidate1Name : candidate2Name;
    const opposingCandidateName = selectedCandidate === '1' ? candidate2Name : candidate1Name;

    return (
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="text-sm font-medium text-muted-foreground mb-2">Step 3 of {totalSteps}</div>
          <CardTitle>Write Your Message</CardTitle>
          <CardDescription>
            Explain why you support {selectedCandidateName} over {opposingCandidateName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex-1 flex flex-col">
          <div className="space-y-2">
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`I am writing to express my support for ${selectedCandidateName} in the upcoming election. I believe ${selectedCandidateName} is the best choice because...`}
              rows={12}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              {message.length} characters
            </p>
          </div>

          <div className="flex-1"></div>
          <div className="flex justify-between pt-6">
            <Button variant="ghost" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={() => setStep(4)} disabled={!message.trim()}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStep4_Review = () => {
    const selectedCandidateName = selectedCandidate === '1' ? candidate1Name : candidate2Name;

    return (
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="text-sm font-medium text-muted-foreground mb-2">Step 4 of {totalSteps}</div>
          <CardTitle>Review Your Message</CardTitle>
          <CardDescription>
            Make sure everything looks good before sending
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex-1 flex flex-col">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Supporting:</h3>
              <p className="text-lg">{selectedCandidateName}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Your Message:</h3>
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="whitespace-pre-wrap">{message}</p>
              </div>
            </div>
          </div>

          <div className="flex-1"></div>
          <div className="flex justify-between pt-6">
            <Button variant="ghost" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button onClick={() => setStep(5)}>
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStep5_Confirmation = () => (
    <Card className="flex-1 flex flex-col">
      <CardHeader>
        <CardTitle>Message Sent!</CardTitle>
        <CardDescription>
          Your message has been sent to your representatives
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">✓</div>
          <h3 className="text-2xl font-bold mb-2">Thank you for making your voice heard!</h3>
          <p className="text-muted-foreground">
            Your message supporting {selectedCandidate === '1' ? candidate1Name : candidate2Name} has been delivered.
          </p>
        </div>

        <div className="flex-1"></div>
        <div className="flex justify-center pt-6">
          <Button onClick={() => {
            setStep(1);
            setSelectedCandidate('');
            setMessage('');
            setUseAI('');
          }}>
            Send Another Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Candidate Advocacy</h1>
        <Progress value={progress} className="h-2" />
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2_AIHelp()}
      {step === 3 && renderStep3_WriteMessage()}
      {step === 4 && renderStep4_Review()}
      {step === 5 && renderStep5_Confirmation()}
    </div>
  );
}
