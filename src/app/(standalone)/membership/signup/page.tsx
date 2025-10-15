'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Crown, Check } from 'lucide-react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export default function MembershipSignupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // Payment info (mock for now)
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [billingZip, setBillingZip] = useState('');

  // Promo code
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeApplied, setPromoCodeApplied] = useState(false);
  const [promoCodeError, setPromoCodeError] = useState('');

  // Pricing
  const basePrice = 6.00;
  const discountedPrice = 3.00;
  const currentPrice = promoCodeApplied ? discountedPrice : basePrice;
  const yearlyPrice = currentPrice * 4;

  // Redirect if not logged in (unless coming from signup flow)
  useEffect(() => {
    const hasSignupIntent = sessionStorage.getItem('membershipSignupIntent');

    // If we have signup intent, wait a bit longer for auth to load
    if (hasSignupIntent) {
      const timeout = setTimeout(() => {
        if (!loading && !user) {
          // After waiting, if still no user, redirect to login
          router.push('/login?returnTo=/membership/signup');
        }
      }, 2000); // Wait 2 seconds for auth state to update

      return () => clearTimeout(timeout);
    } else if (!loading && !user) {
      // No signup intent and no user, redirect immediately
      router.push('/login?returnTo=/membership/signup');
    }

    // Clear the flag once user is loaded
    if (user && hasSignupIntent) {
      sessionStorage.removeItem('membershipSignupIntent');
    }
  }, [user, loading, router]);

  const handleApplyPromoCode = () => {
    setPromoCodeError('');

    if (promoCode.trim().toUpperCase() === 'SAVE') {
      setPromoCodeApplied(true);
      setPromoCodeError('');
    } else if (promoCode.trim() === '') {
      setPromoCodeError('Please enter a promo code');
    } else {
      setPromoCodeError('Invalid promo code');
    }
  };

  const handleRemovePromoCode = () => {
    setPromoCode('');
    setPromoCodeApplied(false);
    setPromoCodeError('');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (!user) throw new Error('No user logged in');

      // TODO: Integrate with actual payment processor (Stripe, etc.)
      // For now, just simulate payment
      await new Promise(resolve => setTimeout(resolve, 2000));

      const db = getFirestore(app);
      const userRef = doc(db, 'users', user.uid);

      // Update membership status
      await updateDoc(userRef, {
        membershipTier: 'premium',
        membershipStartDate: new Date().toISOString(),
        membershipBillingCycle: 'quarterly',
        membershipPrice: currentPrice,
        promoCode: promoCodeApplied ? promoCode.trim().toUpperCase() : null,
        updatedAt: new Date().toISOString()
      });

      // Redirect to success/dashboard
      router.push('/dashboard?membership=success');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <div className="container max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Crown className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Become a Premium Member</CardTitle>
            <CardDescription>
              Enter your payment details to complete your membership
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
                {/* Membership Summary */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Premium Membership</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      {promoCodeApplied && (
                        <span className="text-lg line-through text-muted-foreground">${basePrice}</span>
                      )}
                      <span className="text-2xl font-bold text-primary">${currentPrice}/quarter</span>
                    </div>
                    <span className="text-sm text-muted-foreground">${yearlyPrice}/year</span>
                  </div>
                  {promoCodeApplied && (
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded px-2 py-1">
                      <Check className="h-4 w-4" />
                      <span>Promo code "SAVE" applied - Save 50%!</span>
                    </div>
                  )}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Support the Organization</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>View Messages & Responses</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Advocacy Impact Analytics</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Customized Feed</span>
                    </div>
                  </div>
                </div>

                {/* Payment Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      required
                      maxLength={19}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        type="text"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholder="MM/YY"
                        required
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="123"
                        required
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="billingZip">Billing ZIP Code</Label>
                    <Input
                      id="billingZip"
                      type="text"
                      value={billingZip}
                      onChange={(e) => setBillingZip(e.target.value)}
                      placeholder="12345"
                      required
                      maxLength={5}
                    />
                  </div>

                  {/* Promo Code */}
                  <div>
                    <Label htmlFor="promoCode">Promo Code (Optional)</Label>
                    {!promoCodeApplied ? (
                      <div className="flex gap-2">
                        <Input
                          id="promoCode"
                          type="text"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value);
                            setPromoCodeError('');
                          }}
                          placeholder="Enter code"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyPromoCode}
                        >
                          Apply
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-600">Code applied: {promoCode.toUpperCase()}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemovePromoCode}
                          className="text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                    {promoCodeError && (
                      <p className="text-sm text-red-500 mt-1">{promoCodeError}</p>
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                  By completing this purchase, you agree to be charged ${currentPrice.toFixed(2)} every quarter starting today.
                  You can cancel your membership at any time from your dashboard.
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/membership')}
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Complete Purchase
                        <Check className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
