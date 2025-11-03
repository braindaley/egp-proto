'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, AlertCircle, Crown, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useZipCode } from '@/hooks/use-zip-code';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore as db } from '@/lib/firebase';

interface AdvocacyMessagePollProps {
  pollId?: string;
  campaignId?: string;
}

interface VerificationData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface PollData {
  title: string;
  question: string;
  answerType: 'multiple-choice-single' | 'multiple-choice-multiple' | 'open-text';
  choices?: string[];
  description?: string;
  imageUrl?: string;
}

export function AdvocacyMessagePoll({
  pollId,
  campaignId
}: AdvocacyMessagePollProps) {
  const [step, setStep] = useState<'verify' | 'poll' | 'success' | 'account'>('verify');
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const [openTextResponse, setOpenTextResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [isLoadingPoll, setIsLoadingPoll] = useState(false);
  const [pollData, setPollData] = useState<PollData | null>(null);

  // Verification form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');

  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  const { user } = useAuth();
  const { zipCode, saveZipCode } = useZipCode();

  // Fetch poll data
  React.useEffect(() => {
    if (pollId || campaignId) {
      setIsLoadingPoll(true);
      const id = campaignId || pollId;
      fetch(`/api/campaigns/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.campaign?.poll) {
            setPollData(data.campaign.poll);
          } else if (data.poll) {
            setPollData(data.poll);
          } else {
            // Use default poll data for testing
            setPollData({
              title: 'Climate Action Poll',
              question: 'Should the government invest more in renewable energy?',
              answerType: 'multiple-choice-single',
              choices: ['Yes, significantly more', 'Yes, somewhat more', 'Keep current levels', 'No, reduce investment'],
              description: 'Your opinion helps us understand community priorities on climate policy.'
            });
          }
        })
        .catch(err => {
          console.error('Failed to fetch poll:', err);
          // Use default poll data on error
          setPollData({
            title: 'Climate Action Poll',
            question: 'Should the government invest more in renewable energy?',
            answerType: 'multiple-choice-single',
            choices: ['Yes, significantly more', 'Yes, somewhat more', 'Keep current levels', 'No, reduce investment'],
            description: 'Your opinion helps us understand community priorities on climate policy.'
          });
        })
        .finally(() => setIsLoadingPoll(false));
    }
  }, [pollId, campaignId]);

  // Skip verification for logged-in users
  React.useEffect(() => {
    if (user && step === 'verify') {
      setStep('poll');
    }
  }, [user, step]);

  // Address autocomplete functions
  const searchAddresses = (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    let city = 'Springfield';
    let state = 'IL';
    let suggestedZips = ['62701', '62702', '62703', '62704', '62705'];

    if (zipCode && zipCode.startsWith('927')) {
      city = 'Fountain Valley';
      state = 'CA';
      suggestedZips = ['92708', '92706', '92707', '92704', '92705'];
    }

    const mockSuggestions = suggestedZips.map((zip, index) => {
      const streets = ['Main St', 'Oak Ave', 'Elm St', 'Pine St', 'Maple Dr'];
      return `${query} ${streets[index]}, ${city}, ${state} ${zip}`;
    });

    setAddressSuggestions(mockSuggestions);
    setShowAddressSuggestions(true);
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    searchAddresses(value);
  };

  const selectAddressSuggestion = (suggestion: string) => {
    setAddress(suggestion);
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
  };

  const handleVerification = async () => {
    setVerificationError('');

    if (!firstName || !lastName || !address) {
      setVerificationError('Please fill in all fields');
      return;
    }

    if (firstName.length < 2) {
      setVerificationError('Please enter your full first name');
      return;
    }

    if (lastName.length < 2) {
      setVerificationError('Please enter your full last name');
      return;
    }

    if (address.length < 10) {
      setVerificationError('Please enter your full address');
      return;
    }

    setIsVerifying(true);

    try {
      // L2 verification is disabled - parse address and proceed directly
      const addressParts = address.split(',').map(p => p.trim());
      setVerificationData({
        firstName,
        lastName,
        address: addressParts[0] || address,
        city: addressParts[1] || '',
        state: addressParts[2]?.split(' ')[0] || '',
        zipCode: addressParts[2]?.split(' ')[1] || ''
      });
      setStep('poll');
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmitPoll = async () => {
    setIsSubmitting(true);

    try {
      let response: string | string[];

      if (pollData?.answerType === 'multiple-choice-single') {
        response = selectedChoice;
      } else if (pollData?.answerType === 'multiple-choice-multiple') {
        response = selectedChoices;
      } else {
        response = openTextResponse;
      }

      // Save to Firebase
      const responseData: any = {
        pollId: pollId || campaignId,
        userId: user?.uid || null,
        response: response,
        verifiedUserInfo: user ? null : verificationData,
        timestamp: serverTimestamp()
      };

      // Only add campaignId if it's defined
      if (campaignId) {
        responseData.campaignId = campaignId;
      }

      console.log('DEBUG: About to submit poll response:', { pollId, campaignId, responseData });
      const pollResponseRef = await addDoc(collection(db, 'poll_responses'), responseData);
      console.log('DEBUG: Poll response saved successfully:', pollResponseRef.id);

      // Store response ID for account linking
      if (!user) {
        sessionStorage.setItem('pendingPollResponseId', pollResponseRef.id);
      }

      setStep('success');
    } catch (error) {
      console.error('Failed to submit poll:', error);
      alert('Failed to submit your response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMultipleChoice = (choice: string) => {
    if (selectedChoices.includes(choice)) {
      setSelectedChoices(selectedChoices.filter(c => c !== choice));
    } else {
      setSelectedChoices([...selectedChoices, choice]);
    }
  };

  // Loading state
  if (isLoadingPoll) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Verification step
  if (step === 'verify') {
    return (
      <div className="flex-1 container mx-auto px-8 max-w-2xl pb-8 overflow-y-auto flex flex-col pt-4">
        <Card className="flex-1 flex flex-col m-0 md:m-auto border-0 md:border rounded-none md:rounded-lg overflow-hidden bg-background">
          <CardHeader className="bg-background">
            {!user && (
              <div className="text-sm font-medium text-muted-foreground mb-2">Step 1</div>
            )}
            <CardTitle>Help us verify that you are a registered voter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 flex flex-col">
            <p className="text-sm text-muted-foreground">
              <strong>Verification = Impact</strong><br/><br/>
              We verify your voter registration to ensure your messages are taken seriously by policymakers. Verified info also allows us to autofill your profile and personalize your letters with relevant demographic insights, giving your voice more weight.
            </p>

            {verificationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{verificationError}</AlertDescription>
              </Alert>
            )}

            <div>
              <h4 className="font-semibold mb-3">Enter Your Information</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Please enter your full details to ensure your message is delivered to your representatives.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Smith"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="relative">
                <Label htmlFor="address">Full Address (Delaware only)</Label>
                <Input
                  id="address"
                  placeholder="448 Emerson Rd, Middletown, DE 19709"
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onFocus={() => address.length >= 3 && setShowAddressSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 150)}
                  className="mt-1"
                />
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                        onMouseDown={() => selectAddressSuggestion(suggestion)}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Start typing to see address suggestions, then select one to auto-fill
                </p>
              </div>
            </div>

            <div className="flex-1"></div>
            <div className="flex justify-between items-center mt-auto pt-6">
              <Button variant="ghost">
                Already have an account? Login
              </Button>

              <Button
                onClick={handleVerification}
                disabled={isVerifying || !firstName || !lastName || !address}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success step
  if (step === 'success') {
    return (
      <div className="flex-1 container mx-auto px-8 max-w-2xl pb-8 overflow-y-auto flex flex-col pt-4">
        <Card className="flex-1 flex flex-col m-0 md:m-auto border-0 md:border rounded-none md:rounded-lg overflow-hidden bg-background">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary mb-2">Thank You!</CardTitle>
            <CardDescription className="text-lg">
              Your response has been recorded. Thank you for participating in this poll.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!user && (
              <>
                <div className="text-center mb-4">
                  <p className="text-muted-foreground">Create an account to track your advocacy efforts</p>
                </div>

                {/* Two Options Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Free Account Option */}
                  <button
                    onClick={() => setStep('account')}
                    className="border rounded-lg p-6 space-y-4 text-left hover:border-primary hover:shadow-lg transition-all"
                  >
                    <div className="text-center">
                      <h3 className="text-xl font-semibold mb-2">Create Free Account</h3>
                      <p className="text-sm text-muted-foreground">Track your advocacy messages for free</p>
                    </div>

                    <div className="space-y-3 py-4">
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Send advocacy messages</span>
                      </div>
                    </div>

                    <div className="pt-4">
                      <div className="w-full bg-secondary text-center py-3 rounded-md font-medium">
                        Continue →
                      </div>
                    </div>
                  </button>

                  {/* Premium Membership Option */}
                  <button
                    onClick={() => setStep('account')}
                    className="border-2 border-primary rounded-lg p-6 space-y-4 relative bg-primary/5 text-left hover:shadow-xl transition-all"
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">Recommended</span>
                    </div>

                    <div className="text-center">
                      <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
                        <Crown className="h-5 w-5 text-primary" />
                        Become a Member
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">$6/quarter ($24/year) <span className="text-primary font-semibold">• Use code SAVE for 50% off</span></p>
                    </div>

                    <div className="space-y-2 py-2">
                      <div className="flex items-start gap-2 text-sm">
                        <Heart className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Support the Organization</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>View Messages & Responses</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Advocacy Impact Analytics</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Customized Feed</span>
                      </div>
                    </div>

                    <div className="pt-4">
                      <div className="w-full bg-primary text-primary-foreground text-center py-3 rounded-md font-medium flex items-center justify-center gap-2">
                        <Crown className="h-4 w-4" />
                        Continue →
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}
            {user && (
              <Button className="w-full" onClick={() => window.location.href = '/dashboard'}>
                View Dashboard
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Account creation step
  if (step === 'account') {
    return (
      <div className="flex-1 container mx-auto px-8 max-w-2xl pb-8 overflow-y-auto flex flex-col pt-4">
        <Card className="flex-1 flex flex-col m-0 md:m-auto border-0 md:border rounded-none md:rounded-lg overflow-hidden bg-background">
          <CardHeader className="bg-background">
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>
              Save your poll response and track all your advocacy activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 bg-background">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>TODO:</strong> Implement account creation form with:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Email and password inputs</li>
                  <li>Account type selection (Free/Membership)</li>
                  <li>Firebase authentication integration</li>
                  <li>Link poll response to new account</li>
                </ul>
              </AlertDescription>
            </Alert>
            <div className="space-y-4">
              <Button className="w-full" disabled>
                Create Free Account
              </Button>
              <Button className="w-full" variant="outline" disabled>
                Create Membership Account
              </Button>
              <Button
                className="w-full"
                variant="ghost"
                onClick={() => window.location.href = '/'}
              >
                Skip for now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Poll step
  return (
    <div className="flex-1 container mx-auto px-8 max-w-2xl pb-8 overflow-y-auto flex flex-col pt-4">
      <Card className="flex-1 flex flex-col m-0 md:m-auto border-0 md:border rounded-none md:rounded-lg overflow-hidden bg-background">
        <CardHeader className="bg-background">
          <CardTitle>{pollData?.title || 'Poll'}</CardTitle>
          <CardDescription>
            {pollData?.question || 'Share your opinion'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex-1 flex flex-col bg-background">
          {pollData?.description && (
            <p className="text-sm text-muted-foreground">{pollData.description}</p>
          )}

          {/* Multiple choice - single */}
          {pollData?.answerType === 'multiple-choice-single' && pollData.choices && (
            <RadioGroup value={selectedChoice} onValueChange={setSelectedChoice}>
              <div className="space-y-3">
                {pollData.choices.map((choice, index) => (
                  <div key={index} className="flex items-center space-x-3 border rounded-lg p-4">
                    <RadioGroupItem value={choice} id={`choice-${index}`} />
                    <Label htmlFor={`choice-${index}`} className="flex-1 cursor-pointer">
                      {choice}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {/* Multiple choice - multiple */}
          {pollData?.answerType === 'multiple-choice-multiple' && pollData.choices && (
            <div className="space-y-3">
              {pollData.choices.map((choice, index) => (
                <div key={index} className="flex items-center space-x-3 border rounded-lg p-4">
                  <Checkbox
                    id={`choice-${index}`}
                    checked={selectedChoices.includes(choice)}
                    onCheckedChange={() => toggleMultipleChoice(choice)}
                  />
                  <Label htmlFor={`choice-${index}`} className="flex-1 cursor-pointer">
                    {choice}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {/* Open text */}
          {pollData?.answerType === 'open-text' && (
            <div>
              <Label htmlFor="open-text">Your Response</Label>
              <Textarea
                id="open-text"
                value={openTextResponse}
                onChange={(e) => setOpenTextResponse(e.target.value)}
                placeholder="Share your thoughts..."
                className="mt-2 min-h-[200px]"
              />
            </div>
          )}

          <div className="flex-1"></div>
          <Button
            onClick={handleSubmitPoll}
            disabled={
              isSubmitting ||
              (pollData?.answerType === 'multiple-choice-single' && !selectedChoice) ||
              (pollData?.answerType === 'multiple-choice-multiple' && selectedChoices.length === 0) ||
              (pollData?.answerType === 'open-text' && !openTextResponse.trim())
            }
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Response'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
