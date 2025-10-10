'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useZipCode } from '@/hooks/use-zip-code';

interface AdvocacyMessageCandidateProps {
  candidate1Name?: string;
  candidate1Bio?: string;
  candidate2Name?: string;
  candidate2Bio?: string;
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

export function AdvocacyMessageCandidate({
  candidate1Name: propCandidate1Name,
  candidate1Bio: propCandidate1Bio,
  candidate2Name: propCandidate2Name,
  candidate2Bio: propCandidate2Bio,
  campaignId
}: AdvocacyMessageCandidateProps) {
  const [step, setStep] = useState<'verify' | 'poll' | 'success'>('verify');
  const [selectedCandidate, setSelectedCandidate] = useState<'1' | '2' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(false);
  const [campaignData, setCampaignData] = useState<{
    candidate1Name: string;
    candidate1Bio?: string;
    candidate2Name: string;
    candidate2Bio?: string;
  } | null>(null);

  // Verification form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');

  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  const { user } = useAuth();
  const { zipCode, saveZipCode } = useZipCode();

  // Fetch campaign data if only campaignId is provided
  React.useEffect(() => {
    if (campaignId && !propCandidate1Name && !propCandidate2Name) {
      setIsLoadingCampaign(true);
      fetch(`/api/campaigns/${campaignId}`)
        .then(res => res.json())
        .then(data => {
          if (data.candidate) {
            setCampaignData({
              candidate1Name: data.candidate.candidate1Name,
              candidate1Bio: data.candidate.candidate1Bio,
              candidate2Name: data.candidate.candidate2Name,
              candidate2Bio: data.candidate.candidate2Bio
            });
          }
        })
        .catch(err => console.error('Failed to fetch campaign:', err))
        .finally(() => setIsLoadingCampaign(false));
    }
  }, [campaignId, propCandidate1Name, propCandidate2Name]);

  // Use either props or fetched campaign data
  const candidate1Name = propCandidate1Name || campaignData?.candidate1Name || '';
  const candidate1Bio = propCandidate1Bio || campaignData?.candidate1Bio;
  const candidate2Name = propCandidate2Name || campaignData?.candidate2Name || '';
  const candidate2Bio = propCandidate2Bio || campaignData?.candidate2Bio;

  // Address autocomplete functions
  const searchAddresses = (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    // Determine location based on user's zip code for more realistic suggestions
    let city = 'Springfield';
    let state = 'IL';
    let suggestedZips = ['62701', '62702', '62703', '62704', '62705'];

    if (zipCode && zipCode.startsWith('927')) {
      // California - Orange County area
      city = 'Fountain Valley';
      state = 'CA';
      suggestedZips = ['92708', '92706', '92707', '92704', '92705'];
    }

    // Mock address suggestions - in real implementation, this would call Google Places API
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
      setVerificationError('Please enter a complete address');
      return;
    }

    setIsVerifying(true);

    try {
      // Mock verification - simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Extract zip code from address for mock data
      const zipMatch = address.match(/\d{5}(?:-\d{4})?/);
      const extractedZip = zipMatch ? zipMatch[0] : '12345';

      // Determine city/state based on zip code
      let mockCity = 'Springfield';
      let mockState = 'IL';
      if (extractedZip && extractedZip.startsWith('927')) {
        mockCity = 'Fountain Valley';
        mockState = 'CA';
      }

      // Mock verified user info
      const verifiedInfo = {
        firstName,
        lastName,
        address,
        city: mockCity,
        state: mockState,
        zipCode: extractedZip
      };

      setVerificationData(verifiedInfo);
      saveZipCode(extractedZip);
      setStep('poll');
    } catch (err) {
      setVerificationError('Unable to verify identity. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

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
        verificationData: verificationData || null,
        metadata: {
          zipCode: verificationData?.zipCode || zipCode || null,
          userState: verificationData?.state || null,
          city: verificationData?.city || null
        }
      };

      await addDoc(collection(db, 'candidate_poll_responses'), pollResponse);
      setStep('success');
    } catch (error) {
      console.error('Error submitting poll response:', error);
      alert('Failed to submit your opinion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verification step
  if (step === 'verify') {
    return (
      <div className="flex-1 container mx-auto px-8 max-w-2xl pb-8 overflow-y-auto flex flex-col pt-4">
        <Card className="flex-1 flex flex-col m-0 md:m-auto border-0 md:border rounded-none md:rounded-lg overflow-hidden bg-background">
          <CardHeader className="bg-background">
            <CardTitle>Help us verify that you are a registered voter</CardTitle>
            <CardDescription>
              <strong>Verification = Impact</strong><br/><br/>
              We verify your voter registration to ensure your opinion is taken seriously. This also allows us to provide demographic insights that give your voice more weight.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 flex flex-col bg-background">
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  disabled={isVerifying}
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  disabled={isVerifying}
                />
              </div>

              <div className="relative">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onFocus={() => address.length >= 3 && setShowAddressSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 150)}
                  placeholder="Start typing your address..."
                  disabled={isVerifying}
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
                <p className="text-sm text-muted-foreground mt-1">
                  Start typing your address to see suggestions
                </p>
              </div>
            </div>

            {verificationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{verificationError}</AlertDescription>
              </Alert>
            )}

            <div className="flex-1"></div>
            <div className="flex justify-end pt-6">
              <Button
                onClick={handleVerification}
                disabled={isVerifying}
                className="min-w-[200px]"
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

  // Poll step
  return (
    <div className="flex-1 container mx-auto px-8 max-w-2xl pb-8 overflow-y-auto flex flex-col pt-4">
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
