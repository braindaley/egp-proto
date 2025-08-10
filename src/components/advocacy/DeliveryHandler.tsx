
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { CheckCircle, XCircle } from 'lucide-react';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';

interface DeliveryHandlerProps {
  messageContent: string;
  recipients: { id: string; name: string; }[];
  deliveryMethod: 'email' | 'postal';
  personalDataIncluded: any;
  onComplete: () => void;
  onReset: () => void;
}

const DeliveryHandler: React.FC<DeliveryHandlerProps> = ({
  messageContent,
  recipients,
  deliveryMethod,
  personalDataIncluded,
  onComplete,
  onReset,
}) => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [deliveryCost, setDeliveryCost] = useState<number | null>(null);

  const db = getFirestore(app);

  const handleSend = async () => {
    setStatus('sending');
    setProgress(10);

    // Simulate sending to multiple recipients
    const totalSteps = recipients.length + 2;
    let currentStep = 1;

    for (const recipient of recipients) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      currentStep++;
      setProgress((currentStep / totalSteps) * 100);
    }

    try {
      // Store message in Firestore
      const confirmationNum = `CONF-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      let cost: number | null = null;
      if (deliveryMethod === 'postal') {
        cost = recipients.length * 0.68; // Fake cost
        setDeliveryCost(cost);
      }
      setConfirmationNumber(confirmationNum);
      
      await addDoc(collection(db, 'user_messages'), {
        messageContent,
        recipientContactIds: recipients.map(r => r.id),
        deliveryMethods: [deliveryMethod],
        status: 'sent',
        personalDataIncluded,
        confirmationNumbers: { [deliveryMethod]: confirmationNum },
        sentAt: Timestamp.now(),
        deliveryCosts: cost,
        billTitle: 'Example Bill Title', // Replace with actual bill title
      });
      
      setProgress(100);
      setStatus('success');
      onComplete();

    } catch (error) {
      console.error('Error sending message:', error);
      setStatus('error');
    }
  };
  
  const getSignature = () => {
    const signatureParts: string[] = [];
    if (personalDataIncluded.fullName) signatureParts.push('Your Name');
    if (personalDataIncluded.address) signatureParts.push('Your Address/ZIP Code');
    if (personalDataIncluded.age) signatureParts.push('Your Age/Birth Year');
    if (personalDataIncluded.gender) signatureParts.push('Your Gender, Marital Status');
    if (personalDataIncluded.partyAffiliation) signatureParts.push('Your Party Affiliation');
    if (personalDataIncluded.education) signatureParts.push('Your Education Level');
    if (personalDataIncluded.profession) signatureParts.push('Your Profession/Industry');
    if (personalDataIncluded.votingPrecinct) signatureParts.push('Your Voting Precinct');
    if (personalDataIncluded.militaryService) signatureParts.push('Your Military Service');
    if (personalDataIncluded.issueImportance) signatureParts.push('Your Issue Importance Ranking');
    return signatureParts.join('\n');
  }

  const Preview = () => (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Message Preview</h3>
      <div
        className={`p-6 border rounded-md bg-gray-50`}
      >
        <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{messageContent}</p>
            <br />
            <p className="whitespace-pre-wrap">{getSignature()}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Your Message</CardTitle>
      </CardHeader>
      <CardContent>
        {status === 'idle' && (
          <div>
            <Preview />
            <Button onClick={handleSend} size="lg" className="w-full mt-6">
              Confirm and Send
            </Button>
          </div>
        )}

        {status === 'sending' && (
          <div className="text-center">
            <p className="mb-2">Sending to {recipients.length} representative(s)...</p>
            <Progress value={progress} />
          </div>
        )}

        {status === 'success' && (
          <div className="text-center text-green-600">
            <CheckCircle className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
            <p>Confirmation: {confirmationNumber}</p>
            {deliveryCost && <p>Estimated Cost: ${deliveryCost.toFixed(2)}</p>}
            <Button onClick={onReset} className="mt-4">Send Another Message</Button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center text-red-600">
            <XCircle className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Something Went Wrong</h3>
            <p>We couldn't send your message. Please try again.</p>
            <Button onClick={handleSend} variant="destructive" className="mt-4">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryHandler;
