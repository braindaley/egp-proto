
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
import { Loader2, AlertCircle, ChevronLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Feature flag - set to true to enable L2 voter verification API
const ENABLE_L2_VERIFICATION = true;

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
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationStep, setVerificationStep] = useState<'initial' | 'selection' | 'refine_search' | 'verified' | 'not_found'>('initial');
  const [matches, setMatches] = useState<VerificationMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState('');
  const [verifiedUserInfo, setVerifiedUserInfo] = useState<any>(null);

  // Refine search state (Check Your Registration)
  const [refinePhone, setRefinePhone] = useState('');
  const [refineDobMonth, setRefineDobMonth] = useState('');
  const [refineDobDay, setRefineDobDay] = useState('');
  const [refineDobYear, setRefineDobYear] = useState('');
  const [refineVoterId, setRefineVoterId] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

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
      // Transform matches (or empty array if none found)
      const transformedMatches: VerificationMatch[] = (data.matches || []).map((match: any) => ({
        id: match.voterId || match.id || `voter-${Math.random().toString(36).substring(7)}`,
        fullName: match.fullName,
        address: match.address,
        city: match.city,
        state: match.state,
        zipCode: match.zipCode,
        constituentDescription: match.constituentDescription || null,
      }));

      setMatches(transformedMatches);
      // Always go to selection screen - shows matches if found, or "Not Listed" option if not
      setVerificationStep('selection');
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

  // Handle refined search with additional fields (phone, DOB, voter ID)
  const handleRefineSearch = async () => {
    if (!agreeToTerms) {
      setVerificationError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');

    try {
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
          // Additional refinement fields
          phone: refinePhone,
          dobMonth: refineDobMonth,
          dobDay: refineDobDay,
          dobYear: refineDobYear,
          voterId: refineVoterId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setVerificationError(data.error || 'Unable to verify identity. Please try again.');
        return;
      }

      // After refined search: if found show verified screen, if not show not_found screen
      if (data.matches && data.matches.length > 0) {
        // Use first match as the verified user
        const match = data.matches[0];
        setVerifiedUserInfo({
          voterId: match.voterId,
          firstName: match.firstName || match.fullName?.split(' ')[0] || firstName,
          lastName: match.lastName || match.fullName?.split(' ').slice(1).join(' ') || lastName,
          fullName: match.fullName,
          address: match.address,
          city: match.city,
          state: match.state,
          zipCode: match.zipCode,
          isVerified: true,
          constituentDescription: match.constituentDescription || null,
        });
        setVerificationStep('verified');
      } else {
        // No matches found after refined search - show not found screen
        setVerificationStep('not_found');
      }
    } catch (error) {
      console.error('Refined search error:', error);
      setVerificationError('An error occurred during verification. Please try again.');
    } finally {
      setIsVerifying(false);
    }
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

              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main St"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="CA"
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                    className="mt-1"
                    maxLength={2}
                  />
                </div>

                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    placeholder="12345"
                    value={verificationZipCode}
                    onChange={(e) => setVerificationZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    className="mt-1"
                    maxLength={5}
                  />
                </div>
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
                {matches.length > 0
                  ? 'We found the following possible matches. Please select your record to continue.'
                  : 'We could not find a matching voter record. Please check your registration details.'}
              </p>
            </div>

            {matches.length > 0 && (
              <RadioGroup value={selectedMatch} onValueChange={setSelectedMatch} className="space-y-3">
                {matches.map((match) => (
                  <div key={match.id} className="border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors">
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
            )}

            {/* Not Listed / Check Registration Section */}
            <div className="border rounded-lg p-4 mt-4 bg-muted/30">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{matches.length > 0 ? 'Not Listed?' : 'No Matches Found'}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {matches.length > 0
                      ? 'If you don\'t see yourself, click "Check Your Registration" to enter your full details instead.'
                      : 'We couldn\'t find your voter registration. Please check your registration to verify your details.'}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setVerificationStep('refine_search')}
                  >
                    Check Your Registration
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleVerificationReset}>
                Back
              </Button>
              {matches.length > 0 && (
                <Button
                  onClick={handleMatchSelection}
                  disabled={!selectedMatch}
                >
                  Continue
                </Button>
              )}
            </div>
          </>
        )}

        {verificationStep === 'refine_search' && (
          <>
            <div className="text-center mb-6">
              <p className="text-sm text-primary font-medium mb-2">SIGN UP</p>
              <h3 className="text-2xl font-bold mb-2">Check Your Registration</h3>
              <p className="text-sm text-muted-foreground">
                We verify your voter registration to ensure your messages are taken seriously by policymakers.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Enter Your Full Details</h4>
            </div>

            {verificationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{verificationError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="refinePhone">Phone Number</Label>
                <Input
                  id="refinePhone"
                  placeholder="555-555-5555"
                  value={refinePhone}
                  onChange={(e) => setRefinePhone(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Date of Birth</Label>
                <div className="grid grid-cols-3 gap-3 mt-1">
                  <select
                    value={refineDobMonth}
                    onChange={(e) => setRefineDobMonth(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Month</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={refineDobDay}
                    onChange={(e) => setRefineDobDay(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <select
                    value={refineDobYear}
                    onChange={(e) => setRefineDobYear(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 100 }, (_, i) => {
                      const year = new Date().getFullYear() - 18 - i;
                      return (
                        <option key={year} value={String(year)}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="refineVoterId">Voter ID (Optional)</Label>
                <Input
                  id="refineVoterId"
                  placeholder=""
                  value={refineVoterId}
                  onChange={(e) => setRefineVoterId(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="agreeToTerms" className="text-sm font-normal">
                  I agree to the{' '}
                  <Link href="/terms" className="underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="underline">
                    Privacy Policy
                  </Link>
                  .
                </Label>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setVerificationStep('selection')}>
                Back
              </Button>
              <Button
                onClick={handleRefineSearch}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </>
        )}

        {verificationStep === 'verified' && verifiedUserInfo && (
          <>
            <div className="text-center mb-6">
              <p className="text-sm text-primary font-medium mb-2">SIGN UP</p>
              <h3 className="text-2xl font-bold">Check Your Registration</h3>
              <p className="text-sm text-muted-foreground mt-2">
                We verify your voter registration to ensure your messages are taken seriously by policymakers.
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-green-50">
              <div className="flex items-start space-x-3">
                <div className="rounded-full bg-green-100 p-1">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-900">Voter registration found</p>
                  <p className="text-sm text-green-700 mt-1">
                    {verifiedUserInfo.fullName || `${verifiedUserInfo.firstName} ${verifiedUserInfo.lastName}`}
                  </p>
                  <p className="text-sm text-green-700">
                    is registered to vote at
                  </p>
                  <p className="text-sm text-green-700">
                    {verifiedUserInfo.address}, {verifiedUserInfo.city}, {verifiedUserInfo.state} {verifiedUserInfo.zipCode}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                className="w-full"
                onClick={() => setStep(2)}
              >
                Continue Sign Up
              </Button>
            </div>
          </>
        )}

        {verificationStep === 'not_found' && (
          <>
            <div className="text-center mb-6">
              <p className="text-sm text-primary font-medium mb-2">SIGN UP</p>
              <h3 className="text-2xl font-bold">We were unable to verify your voter registration</h3>
            </div>

            <div className="border rounded-lg p-4 bg-red-50">
              <div className="flex items-start space-x-3">
                <div className="rounded-full bg-red-100 p-1">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-red-900">Voter registration not found</p>
                  <p className="text-sm text-red-700 mt-1">
                    You are unable to sign up at this time. Please register to vote in order to use eVotersUnited.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3"
                    asChild
                  >
                    <a href="https://vote.gov" target="_blank" rel="noopener noreferrer">
                      Register to Vote
                      <span className="ml-1">↗</span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                className="w-full"
                variant="outline"
                onClick={handleVerificationReset}
              >
                Try Again
              </Button>
              <Button
                className="w-full"
                variant="default"
                asChild
              >
                <Link href="/">
                  Back to Home
                </Link>
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
