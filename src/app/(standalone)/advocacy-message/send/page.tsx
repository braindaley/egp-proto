'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

export default function SendMessagePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [messageData, setMessageData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      // Get message data from session storage
      const storedData = sessionStorage.getItem('pendingMessage');
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          setMessageData(data);
          setIsLoading(false);
        } catch (error) {
          console.error('Error parsing message data:', error);
          setError('Invalid message data');
          setIsLoading(false);
        }
      } else {
        setError('No pending message found');
        setIsLoading(false);
      }
    }
  }, [authLoading]);

  const handleSend = async () => {
    if (!messageData || !user) return;
    
    setIsSending(true);
    try {
      // Import Firebase functions
      const { getFirestore, collection, addDoc, Timestamp } = await import('firebase/firestore');
      const { app } = await import('@/lib/firebase');
      const db = getFirestore(app);
      
      // Save message activity to Firestore
      const messageActivity: any = {
        userId: user.uid,
        isVerifiedUser: !!messageData.verifiedUserInfo,
        userStance: messageData.userStance || '',
        messageContent: messageData.message || '',
        recipients: messageData.selectedMembers?.map((member: any) => ({
          name: member.fullName || member.name || 'Unknown',
          bioguideId: member.bioguideId || '',
          email: member.email || '',
          party: member.party || member.partyName || '',
          role: member.role || 'Representative'
        })) || [],
        personalDataIncluded: messageData.selectedPersonalData || [],
        sentAt: Timestamp.now(),
        deliveryStatus: 'sent',
        // Campaign tracking for performance analytics
        campaignId: messageData.campaignId || null
      };

      // Add verified user info if available
      if (messageData.verifiedUserInfo) {
        messageActivity.verifiedUserInfo = {
          fullName: messageData.verifiedUserInfo.fullName,
          address: messageData.verifiedUserInfo.address,
          city: messageData.verifiedUserInfo.city,
          state: messageData.verifiedUserInfo.state,
          zipCode: messageData.verifiedUserInfo.zipCode
        };
      }
      
      // Add bill information if available and valid
      if (messageData.bill) {
        // Check different possible bill data structures
        const billNumber = messageData.bill.billNumber || messageData.bill.number;
        const billType = messageData.bill.billType || messageData.bill.type;
        const congress = messageData.bill.congress;
        
        if (billNumber && billType && congress) {
          messageActivity.billNumber = billNumber;
          messageActivity.billType = billType;
          messageActivity.congress = congress;
          messageActivity.billShortTitle = messageData.bill.shortTitle || messageData.bill.title || 'Unknown Bill';
          messageActivity.billCurrentStatus = messageData.bill.latestAction?.text || messageData.bill.currentStatus || 'Status Unknown';
        } else {
          // Mark as general advocacy if bill info is incomplete
          messageActivity.isGeneralAdvocacy = true;
          messageActivity.topic = messageData.bill.title || 'General Advocacy';
        }
      } else {
        // No bill data at all
        messageActivity.isGeneralAdvocacy = true;
        messageActivity.topic = 'General Advocacy';
      }
      
      await addDoc(collection(db, 'user_messages'), messageActivity);
      
      // Clear the session storage
      sessionStorage.removeItem('pendingMessage');
      
      // Navigate directly to confirmation page
      const recipientCount = messageData.selectedMembers.length;
      router.push(`/advocacy-message/confirmation?count=${recipientCount}`);
      
    } catch (error) {
      console.error('Error saving message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="container mx-auto px-8 max-w-2xl">
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="container mx-auto px-8 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>Please log in to send your message</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild>
                <Link href={`/login?returnTo=${encodeURIComponent('/advocacy-message/send')}`}>
                  Login
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="container mx-auto px-8 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <Button asChild>
                <Link href="/advocacy-message">
                  Start Over
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 relative flex flex-col">
      <div className="container mx-auto px-8 py-12 max-w-2xl flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="text-center pb-8">
          <CardTitle>Ready to Send</CardTitle>
          <CardDescription>
            Your message is ready to be sent to {messageData?.selectedMembers?.length || 0} representative{(messageData?.selectedMembers?.length || 0) !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex-1 flex flex-col">
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {messageData?.bill && (
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="font-medium text-sm">
                    Message regarding: {messageData.bill.shortTitle || messageData.bill.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your stance: {messageData.userStance === 'support' ? 'Support' : 'Oppose'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={handleSend}
                disabled={isSending}
                className="w-full"
                size="lg"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Message Now'
                )}
              </Button>
              
              <div className="text-center">
                <Button variant="ghost" asChild>
                  <Link href="/advocacy-message">
                    Cancel
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}