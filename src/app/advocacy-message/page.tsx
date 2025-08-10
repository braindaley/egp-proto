
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdvocacyMessageForm from '../../components/AdvocacyMessageForm';
import MessageComposition from '../../components/MessageComposition';
import DeliveryHandler from '../../components/advocacy/DeliveryHandler';
import SelectBill from '../../components/SelectBill';
import { Stepper, Step, StepLabel } from '@/components/ui/stepper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdvocacyMessagePage: React.FC = () => {
  const [step, setStep] = useState(0);
  const [advocacyData, setAdvocacyData] = useState<any>(null);
  const [message, setMessage] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const congress = searchParams.get('congress');
  const billType = searchParams.get('type');
  const billNumber = searchParams.get('number');
  
  const recipientInfo = {
    name: 'Honorable Jane Doe',
    address: '123 Capitol Hill, Washington D.C. 20515',
    email: 'jane.doe@example.com'
  };
  
  const recipients = [{id: 'B001234', name: recipientInfo.name}];

  const handleFormSubmit = (data: any) => {
    setAdvocacyData(data);
    setStep(billNumber ? 1 : 2);
  };

  const handleComposeSubmit = (composedMessage: string) => {
    setMessage(composedMessage);
    setStep(billNumber ? 2 : 3); 
  };
  
  const handleDeliveryComplete = () => {
      setTimeout(() => {
          router.push('/admin/advocacy-messages');
      }, 2000);
  };
  
  const handleBack = () => {
    setStep(step - 1);
  }
  
  const handleReset = () => {
      setStep(0);
      setMessage('');
      setAdvocacyData(null);
  }

  const steps = billNumber 
    ? ['Select Info', 'Compose Message', 'Send Message']
    : ['Select Bill', 'Select Info', 'Compose Message', 'Send Message'];

  const BillContextCard = () => (
    <Card className="mb-8 bg-secondary/50">
        <CardContent className="p-4">
            <p className="text-center font-medium">
                Voice your opinion on Bill {billType?.toUpperCase()} {billNumber}
            </p>
        </CardContent>
    </Card>
  );
  
  const currentStep = billNumber ? step : step - 1;

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <Stepper>
            {steps.map((label, index) => (
                 <Step key={label} active={currentStep === index}>
                    <StepLabel>{label}</StepLabel>
                </Step>
            ))}
        </Stepper>
      </div>
      
      {billType && billNumber && <BillContextCard />}

      {step === 0 && !billNumber && <SelectBill />}

      {step === (billNumber ? 0 : 1) && (
         <AdvocacyMessageForm
            billType={billType || 'defense'}
            recipientCategory="party_leader"
            onSubmit={handleFormSubmit}
          />
      )}

      {step === (billNumber ? 1 : 2) && advocacyData && (
         <MessageComposition
            billType={billType || 'defense'}
            userStance="support"
            personalData={advocacyData.personalDataIncluded}
            recipientInfo={recipientInfo}
            onSubmit={handleComposeSubmit}
            onBack={handleBack}
          />
      )}
      
      {step === (billNumber ? 2 : 3) && advocacyData && (
        <DeliveryHandler
            messageContent={message}
            recipients={recipients}
            deliveryMethod="email"
            personalDataIncluded={advocacyData.personalDataIncluded}
            onComplete={handleDeliveryComplete}
            onReset={handleReset}
        />
      )}
    </div>
  );
};

export default AdvocacyMessagePage;
