
'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Feature flag - set to true to enable L2 voter verification API
const ENABLE_L2_VERIFICATION = false;

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

interface VerificationMatch {
  id: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  constituentDescription?: string | null;
}

function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { signup } = useAuth();

  const returnTo = searchParams.get('returnTo');

  // Multi-step state
  const [step, setStep] = useState(1); // 1 = voter verification, 2 = account creation

  // Voter verification state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [verificationZipCode, setVerificationZipCode] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationStep, setVerificationStep] = useState<'initial' | 'selection' | 'manual'>('initial');
  const [matches, setMatches] = useState<VerificationMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState('');
  const [verifiedUserInfo, setVerifiedUserInfo] = useState<any>(null);

  // Manual entry state
  const [manualFirstName, setManualFirstName] = useState('');
  const [manualLastName, setManualLastName] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualState, setManualState] = useState('');
  const [manualZipCode, setManualZipCode] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Address autocomplete functions
  const searchAddresses = (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    // Only provide Delaware addresses (voter verification is Delaware-only)
    const delawareAddresses = [
      { street: 'Emerson Rd', city: 'Middletown', zip: '19709' },
      { street: 'Main St', city: 'Newark', zip: '19702' },
      { street: 'Pleasant Valley Rd', city: 'Newark', zip: '19711' },
      { street: 'Limestone Rd', city: 'Wilmington', zip: '19808' },
      { street: 'Kirkwood Hwy', city: 'Wilmington', zip: '19808' },
      { street: 'Market St', city: 'Wilmington', zip: '19801' },
      { street: 'Delaware Ave', city: 'Wilmington', zip: '19806' },
      { street: 'Concord Pike', city: 'Wilmington', zip: '19803' },
      { street: 'Lancaster Pike', city: 'Hockessin', zip: '19707' },
      { street: 'Brandywine Blvd', city: 'Wilmington', zip: '19809' },
    ];

    // Mock address suggestions - in real implementation, this would call Google Places API
    const mockSuggestions = delawareAddresses.map(({ street, city, zip }) => {
      const houseNumber = Math.floor(Math.random() * 900) + 100;
      return `${houseNumber} ${street}, ${city}, DE ${zip}`;
    });

    setAddressSuggestions(mockSuggestions);
    setShowAddressSuggestions(true);
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    searchAddresses(value);

    // Try to auto-parse city, state, and zip from the address
    const parts = value.split(',').map(s => s.trim());

    if (parts.length >= 2) {
      const secondPart = parts[1];
      const stateZipMatch = secondPart.match(/\b([A-Z]{2})\s+(\d{5})\b/);

      if (stateZipMatch) {
        const cityOnly = secondPart.substring(0, stateZipMatch.index).trim();
        if (cityOnly) {
          setCity(cityOnly);
        }
        setState(stateZipMatch[1]);
        setVerificationZipCode(stateZipMatch[2]);
      } else {
        setCity(secondPart);

        if (parts[2]) {
          const stateZipMatch2 = parts[2].match(/\b([A-Z]{2})\s*(\d{5})?\b/);
          if (stateZipMatch2) {
            setState(stateZipMatch2[1]);
            if (stateZipMatch2[2]) {
              setVerificationZipCode(stateZipMatch2[2]);
            }
          }
        }
      }
    }
  };

  const selectAddressSuggestion = (suggestion: string) => {
    setAddress(suggestion);

    const parts = suggestion.split(',').map(s => s.trim());
    if (parts.length >= 3) {
      setCity(parts[1]);
      const stateZipParts = parts[2].split(' ').filter(s => s.length > 0);
      if (stateZipParts.length >= 2) {
        setState(stateZipParts[0]);
        setVerificationZipCode(stateZipParts[1]);
      }
    }

    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
  };

  // Verification submit handler
  const handleVerificationSubmit = async () => {
    setVerificationError('');

    if (!firstName || !lastName || !address || !city || !state || !verificationZipCode) {
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

    if (state.length !== 2) {
      setVerificationError('Please enter a valid 2-letter state code');
      return;
    }

    // L2 verification is only available for Delaware
    if (ENABLE_L2_VERIFICATION && state.toUpperCase() !== 'DE') {
      setVerificationError('Voter verification is currently only available for Delaware residents');
      return;
    }

    if (verificationZipCode.length !== 5) {
      setVerificationError('Please enter a valid 5-digit ZIP code');
      return;
    }

    setIsVerifying(true);

    try {
      // When L2 verification is disabled, accept the data and proceed to step 2
      if (!ENABLE_L2_VERIFICATION) {
        setVerifiedUserInfo({
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`,
          address,
          city,
          state,
          zipCode: verificationZipCode,
          isVerified: true,
        });
        setIsVerifying(false);
        setStep(2); // Go to account creation step
        return;
      }

      // Call L2 API to verify voter
      const response = await fetch('/api/l2/verify-voter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          address,
          city,
          state,
          zipCode: verificationZipCode,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setVerificationError(data.error || 'Unable to verify identity. Please try again.');
        return;
      }

      // If we found matches, show selection screen
      if (data.matches && data.matches.length > 0) {
        const transformedMatches: VerificationMatch[] = data.matches.map((match: any) => ({
          id: match.voterId || match.id || `voter-${Math.random().toString(36).substring(7)}`,
          fullName: match.fullName,
          address: match.address,
          city: match.city,
          state: match.state,
          zipCode: match.zipCode,
          constituentDescription: match.constituentDescription || null,
        }));

        setMatches(transformedMatches);
        setVerificationStep('selection');
      } else {
        // No matches found - accept the data and proceed
        setVerifiedUserInfo({
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`,
          address,
          city,
          state,
          zipCode: verificationZipCode,
          isVerified: true,
        });
        setStep(2);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationError('An error occurred during verification. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleMatchSelection = () => {
    const match = matches.find(m => m.id === selectedMatch);
    if (match) {
      setVerifiedUserInfo({
        firstName: match.fullName.split(' ')[0],
        lastName: match.fullName.split(' ').slice(1).join(' '),
        fullName: match.fullName,
        address: match.address,
        city: match.city,
        state: match.state,
        zipCode: match.zipCode,
        isVerified: true,
        constituentDescription: match.constituentDescription,
      });
      setStep(2);
    }
  };

  const handleManualSubmit = () => {
    if (!manualFirstName || !manualLastName || !manualAddress || !manualCity || !manualState || !manualZipCode) {
      setVerificationError('Please fill in all fields');
      return;
    }

    setVerifiedUserInfo({
      firstName: manualFirstName,
      lastName: manualLastName,
      fullName: `${manualFirstName} ${manualLastName}`,
      address: manualAddress,
      city: manualCity,
      state: manualState,
      zipCode: manualZipCode,
      isVerified: false, // Manual entry is not L2 verified
    });
    setStep(2);
  };

  const handleVerificationReset = () => {
    setVerificationStep('initial');
    setMatches([]);
    setSelectedMatch('');
    setVerificationError('');
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await signup(values.email, values.password);

      // Save verified voter info to user profile
      if (verifiedUserInfo && userCredential.user) {
        try {
          const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
          const { app } = await import('@/lib/firebase');
          const db = getFirestore(app);

          await updateDoc(doc(db, 'users', userCredential.user.uid), {
            firstName: verifiedUserInfo.firstName,
            lastName: verifiedUserInfo.lastName,
            address: verifiedUserInfo.address,
            city: verifiedUserInfo.city,
            state: verifiedUserInfo.state,
            zipCode: verifiedUserInfo.zipCode,
            isVoterVerified: verifiedUserInfo.isVerified,
            constituentDescription: verifiedUserInfo.constituentDescription || null,
          });
        } catch (profileError) {
          console.error('Failed to save voter info to profile:', profileError);
        }
      }

      // Check if we need to link a pending message
      const linkMessage = searchParams.get('linkMessage') === 'true';
      if (linkMessage && userCredential.user) {
        const { linkPendingMessageToUser } = await import('@/lib/link-pending-message');
        const linked = await linkPendingMessageToUser(userCredential.user.uid);

        if (linked) {
          toast({
            title: 'Account Created',
            description: "Your account has been created and your message history has been saved!",
          });
        } else {
          toast({
            title: 'Account Created',
            description: "You've been successfully signed up!",
          });
        }
      } else {
        toast({
          title: 'Account Created',
          description: "You've been successfully signed up!",
        });
      }

      router.push(returnTo || '/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message || 'Could not create account. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Step 1: Voter Verification
  const renderVerificationStep = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="text-sm font-medium text-muted-foreground mb-2">Step 1</div>
        <CardTitle className="text-2xl font-bold">Help us verify that you are a registered voter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {verificationStep === 'initial' && (
          <>
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

            <div className="flex justify-between items-center pt-4">
              <Link href={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"} className="text-sm text-muted-foreground hover:underline">
                Already have an account? Login
              </Link>
              <Button
                onClick={handleVerificationSubmit}
                disabled={isVerifying}
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
          </>
        )}

        {verificationStep === 'selection' && (
          <>
            <div>
              <h4 className="font-semibold mb-3">Select Your Record</h4>
              <p className="text-sm text-muted-foreground mb-4">
                We found the following possible matches. Please select your record to continue.
              </p>
            </div>

            <RadioGroup value={selectedMatch} onValueChange={setSelectedMatch}>
              {matches.map((match) => (
                <div key={match.id} className="bg-background border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <RadioGroupItem value={match.id} className="mt-1" />
                    <div className="flex-1">
                      <p className="font-medium">{match.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {match.address}, {match.city}, {match.state} {match.zipCode}
                      </p>
                    </div>
                  </label>
                </div>
              ))}
            </RadioGroup>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">Not Listed?</p>
                <p>If you don't see yourself, click "Not Me" to enter your full details instead.</p>
              </AlertDescription>
            </Alert>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={handleVerificationReset}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Try Again
              </Button>

              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setVerificationStep('manual')}
                >
                  Not Me
                </Button>
                <Button
                  onClick={handleMatchSelection}
                  disabled={!selectedMatch}
                >
                  Confirm Selection
                </Button>
              </div>
            </div>
          </>
        )}

        {verificationStep === 'manual' && (
          <>
            <div>
              <h4 className="font-semibold mb-3">Enter Your Information</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Please enter your full details to continue with account creation.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manualFirstName">First Name</Label>
                  <Input
                    id="manualFirstName"
                    placeholder="John"
                    value={manualFirstName}
                    onChange={(e) => setManualFirstName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="manualLastName">Last Name</Label>
                  <Input
                    id="manualLastName"
                    placeholder="Smith"
                    value={manualLastName}
                    onChange={(e) => setManualLastName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="manualAddress">Street Address</Label>
                <Input
                  id="manualAddress"
                  placeholder="123 Main St"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="manualCity">City</Label>
                  <Input
                    id="manualCity"
                    placeholder="Wilmington"
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="manualState">State</Label>
                  <Input
                    id="manualState"
                    placeholder="DE"
                    maxLength={2}
                    value={manualState}
                    onChange={(e) => setManualState(e.target.value.toUpperCase())}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="manualZipCode">ZIP Code</Label>
                  <Input
                    id="manualZipCode"
                    placeholder="19801"
                    maxLength={5}
                    value={manualZipCode}
                    onChange={(e) => setManualZipCode(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={handleVerificationReset}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              <Button onClick={handleManualSubmit}>
                Continue
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  // Step 2: Account Creation
  const renderAccountStep = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="text-sm font-medium text-muted-foreground mb-2">Step 2</div>
        <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
        <CardDescription>
          Welcome, {verifiedUserInfo?.firstName}! Now let's set up your login credentials.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-between items-center">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-secondary/30 flex-1 flex items-center justify-center min-h-screen px-4">
      {step === 1 && renderVerificationStep()}
      {step === 2 && renderAccountStep()}
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>}>
      <SignupForm />
    </Suspense>
  );
}
