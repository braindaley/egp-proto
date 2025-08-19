'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, AlertCircle, Check, ChevronLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface VerificationMatch {
  id: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface UserVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: (userInfo: VerificationMatch) => void;
  onSkip?: () => void;
}

export function UserVerificationModal({ 
  open, 
  onClose, 
  onVerified,
  onSkip 
}: UserVerificationModalProps) {
  const [step, setStep] = useState<'initial' | 'selection' | 'manual'>('initial');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1 fields
  const [firstInitial, setFirstInitial] = useState('');
  const [lastNameLetters, setLastNameLetters] = useState('');
  const [zipCode, setZipCode] = useState('');
  
  // Step 2 fields
  const [matches, setMatches] = useState<VerificationMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  
  // Manual entry fields
  const [manualFirstName, setManualFirstName] = useState('');
  const [manualLastName, setManualLastName] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualState, setManualState] = useState('');
  const [manualZipCode, setManualZipCode] = useState('');

  const handleInitialSubmit = async () => {
    setError('');
    
    // Validation
    if (!firstInitial || !lastNameLetters || !zipCode) {
      setError('Please fill in all fields');
      return;
    }
    
    if (firstInitial.length !== 1) {
      setError('Please enter only the first initial of your first name');
      return;
    }
    
    if (lastNameLetters.length < 2 || lastNameLetters.length > 4) {
      setError('Please enter 2-4 letters of your last name');
      return;
    }
    
    if (zipCode.length !== 5 || !/^\d+$/.test(zipCode)) {
      setError('Please enter a valid 5-digit ZIP code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call to verify identity
      // In production, this would call your verification API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock matches for demonstration
      const mockMatches: VerificationMatch[] = [
        {
          id: '1',
          fullName: `${firstInitial.toUpperCase()}. ${lastNameLetters.charAt(0).toUpperCase() + lastNameLetters.slice(1).toLowerCase()}son`,
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zipCode: zipCode
        },
        {
          id: '2',
          fullName: `${firstInitial.toUpperCase()}. ${lastNameLetters.charAt(0).toUpperCase() + lastNameLetters.slice(1).toLowerCase()}man`,
          address: '456 Oak Ave',
          city: 'Springfield',
          state: 'IL',
          zipCode: zipCode
        },
        {
          id: '3',
          fullName: `${firstInitial.toUpperCase()}. ${lastNameLetters.charAt(0).toUpperCase() + lastNameLetters.slice(1).toLowerCase()}berg`,
          address: '789 Pine Rd',
          city: 'Springfield',
          state: 'IL',
          zipCode: zipCode
        }
      ];
      
      setMatches(mockMatches);
      setStep('selection');
    } catch (err) {
      setError('Unable to verify identity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchSelection = () => {
    const selected = matches.find(m => m.id === selectedMatch);
    if (selected) {
      onVerified(selected);
    }
  };

  const handleManualSubmit = () => {
    setError('');
    
    if (!manualFirstName || !manualLastName || !manualAddress || 
        !manualCity || !manualState || !manualZipCode) {
      setError('Please fill in all fields');
      return;
    }
    
    const manualInfo: VerificationMatch = {
      id: 'manual',
      fullName: `${manualFirstName} ${manualLastName}`,
      address: manualAddress,
      city: manualCity,
      state: manualState,
      zipCode: manualZipCode
    };
    
    onVerified(manualInfo);
  };

  const handleReset = () => {
    setStep('initial');
    setFirstInitial('');
    setLastNameLetters('');
    setZipCode('');
    setMatches([]);
    setSelectedMatch('');
    setError('');
  };

  const renderInitialStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">Before We Deliver Your Message</DialogTitle>
        <DialogDescription className="text-base mt-2">
          To make sure your message reaches the right elected official—whether federal, state, or local—we need to quickly verify who you are. This ensures your opinion is counted and not mistaken for spam.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 mt-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="firstInitial">First Initial</Label>
            <Input
              id="firstInitial"
              placeholder="J"
              maxLength={1}
              value={firstInitial}
              onChange={(e) => setFirstInitial(e.target.value.toUpperCase())}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="lastNameLetters">First 4 Letters of Last Name</Label>
            <Input
              id="lastNameLetters"
              placeholder="SMIT"
              maxLength={4}
              value={lastNameLetters}
              onChange={(e) => setLastNameLetters(e.target.value.toUpperCase())}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              placeholder="12345"
              maxLength={5}
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
              className="mt-1"
            />
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="bg-muted rounded-lg p-4 text-sm">
          <p className="font-medium mb-2">Your Privacy Matters</p>
          <p className="text-muted-foreground">
            Your information is only used for verification and is never shared beyond what's required to deliver your letter to your representatives.
          </p>
        </div>
        
        <div className="flex justify-between pt-4">
          {onSkip && (
            <Button variant="ghost" onClick={onSkip}>
              Skip Verification
            </Button>
          )}
          <Button 
            onClick={handleInitialSubmit}
            disabled={isLoading}
            className="ml-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </div>
    </>
  );

  const renderSelectionStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">Select Your Record</DialogTitle>
        <DialogDescription className="text-base mt-2">
          We found the following possible matches. Please select your record to continue.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 mt-6">
        <RadioGroup value={selectedMatch} onValueChange={setSelectedMatch}>
          {matches.map((match) => (
            <Card key={match.id} className="p-4 cursor-pointer hover:bg-accent transition-colors">
              <label className="flex items-start space-x-3 cursor-pointer">
                <RadioGroupItem value={match.id} className="mt-1" />
                <div className="flex-1">
                  <p className="font-medium">{match.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {match.address}, {match.city}, {match.state} {match.zipCode}
                  </p>
                </div>
              </label>
            </Card>
          ))}
        </RadioGroup>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-1">Not Listed?</p>
            <p>If you don't see yourself, click "Not Me" to enter your full details instead. This way your message is still delivered to your officials.</p>
          </AlertDescription>
        </Alert>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={handleReset}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setStep('manual')}
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
      </div>
    </>
  );

  const renderManualStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">Enter Your Information</DialogTitle>
        <DialogDescription className="text-base mt-2">
          Please enter your full details to ensure your message is delivered to your representatives.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 mt-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="John"
              value={manualFirstName}
              onChange={(e) => setManualFirstName(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Smith"
              value={manualLastName}
              onChange={(e) => setManualLastName(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            placeholder="123 Main St"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            className="mt-1"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="Springfield"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              placeholder="IL"
              maxLength={2}
              value={manualState}
              onChange={(e) => setManualState(e.target.value.toUpperCase())}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="manualZip">ZIP Code</Label>
            <Input
              id="manualZip"
              placeholder="12345"
              maxLength={5}
              value={manualZipCode}
              onChange={(e) => setManualZipCode(e.target.value.replace(/\D/g, ''))}
              className="mt-1"
            />
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            If our records don't show every variation of your name and address, you can still confirm your information manually to ensure your message is delivered.
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={() => setStep('selection')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Matches
          </Button>
          
          <Button onClick={handleManualSubmit}>
            Verify & Continue
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === 'initial' && renderInitialStep()}
        {step === 'selection' && renderSelectionStep()}
        {step === 'manual' && renderManualStep()}
      </DialogContent>
    </Dialog>
  );
}