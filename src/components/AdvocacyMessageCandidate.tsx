'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, AlertCircle, Crown, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useZipCode } from '@/hooks/use-zip-code';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore as db } from '@/lib/firebase';

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
  const [step, setStep] = useState<'verify' | 'poll' | 'success' | 'account'>('verify');
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

  // Account creation state
  const [accountType, setAccountType] = useState<'free' | 'membership'>('free');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState('');

  const { user } = useAuth();
  const { zipCode, saveZipCode } = useZipCode();
  const router = useRouter();

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

      const docRef = await addDoc(collection(db, 'candidate_poll_responses'), pollResponse);

      // Store response ID for account linking if user is not logged in
      if (!user) {
        sessionStorage.setItem('pendingCandidateResponseId', docRef.id);
      }

      setStep('success');
    } catch (error) {
      console.error('Error submitting poll response:', error);
      alert('Failed to submit your opinion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = async () => {
    setAccountError('');

    // Validate inputs
    if (!email || !password) {
      setAccountError('Please enter email and password');
      return;
    }

    if (password.length < 6) {
      setAccountError('Password must be at least 6 characters');
      return;
    }

    if (!acceptedTerms) {
      setAccountError('Please accept the terms and conditions');
      return;
    }

    setIsCreatingAccount(true);

    try {
      // Create Firebase auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Link candidate poll response to new account
      const pendingResponseId = sessionStorage.getItem('pendingCandidateResponseId');

      if (pendingResponseId) {
        await updateDoc(doc(db, 'candidate_poll_responses', pendingResponseId), {
          userId: newUser.uid,
          linkedAt: serverTimestamp()
        });
        sessionStorage.removeItem('pendingCandidateResponseId');
      }

      // Create user profile document
      await setDoc(doc(db, 'users', newUser.uid), {
        email: email,
        firstName: verificationData?.firstName || '',
        lastName: verificationData?.lastName || '',
        address: verificationData?.address || '',
        city: verificationData?.city || '',
        state: verificationData?.state || '',
        zipCode: verificationData?.zipCode || '',
        accountType: accountType,
        createdAt: serverTimestamp()
      });

      // Redirect based on account type
      if (accountType === 'membership') {
        router.push('/membership/checkout');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Account creation error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setAccountError('This email is already registered. Please sign in instead.');
      } else if (error.code === 'auth/weak-password') {
        setAccountError('Password should be at least 6 characters');
      } else if (error.code === 'auth/invalid-email') {
        setAccountError('Please enter a valid email address');
      } else {
        setAccountError('Failed to create account. Please try again.');
      }
    } finally {
      setIsCreatingAccount(false);
    }
  };

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
                    disabled={isVerifying}
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
                    disabled={isVerifying}
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
              Save your candidate preference and track all your advocacy activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 bg-background">
            {accountError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{accountError}</AlertDescription>
              </Alert>
            )}

            {/* Account Type Selection */}
            <div className="space-y-4">
              <Label>Choose Your Account Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  className={`cursor-pointer transition-all ${
                    accountType === 'free'
                      ? 'border-primary border-2 bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setAccountType('free')}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Free Account</CardTitle>
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                        <span>Track your advocacy</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                        <span>View your activity</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                        <span>Basic features</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    accountType === 'membership'
                      ? 'border-primary border-2 bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setAccountType('membership')}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Membership</CardTitle>
                      <Crown className="h-5 w-5 text-amber-500" />
                    </div>
                    <CardDescription>$5/month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                        <span>Everything in Free</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                        <span>Premium features</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                        <span>Priority support</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                        <span>Advanced analytics</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Email & Password Inputs */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="text-primary hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </Label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleCreateAccount}
                disabled={isCreatingAccount || !email || !password || !acceptedTerms}
                className="w-full"
                size="lg"
              >
                {isCreatingAccount ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create {accountType === 'membership' ? 'Membership' : 'Free'} Account
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => window.location.href = '/'}
                disabled={isCreatingAccount}
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
