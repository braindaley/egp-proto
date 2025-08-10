
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdvocacyMessageForm from '../../components/AdvocacyMessageForm';
import MessageComposition from '../../components/MessageComposition';
import DeliveryHandler from '../../components/advocacy/DeliveryHandler';
import { Stepper, Step, StepLabel } from '@/components/ui/stepper';

const AdvocacyMessagePage: React.FC = () => {
  const [step, setStep] = useState(0);
  const [advocacyData, setAdvocacyData] = useState<any>(null);
  const [message, setMessage] = useState('');
  
  const recipientInfo = {
    name: 'Honorable Jane Doe',
    address: '123 Capitol Hill, Washington D.C. 20515',
    email: 'jane.doe@example.com'
  };
  
  const recipients = [{id: 'B001234', name: recipientInfo.name}];

  const router = useRouter();

  const handleFormSubmit = (data: any) => {
    setAdvocacyData(data);
    setStep(1);
  };

  const handleComposeSubmit = (composedMessage: string) => {
    setMessage(composedMessage);
    setStep(2); 
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

  const steps = ['Select Info', 'Compose Message', 'Send Message'];

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <Stepper>
            {steps.map((label, index) => (
                 <Step key={label} active={step === index}>
                    <StepLabel>{label}</StepLabel>
                </Step>
            ))}
        </Stepper>
      </div>

      {step === 0 && (
         <AdvocacyMessageForm
            billType="defense"
            recipientCategory="party_leader"
            onSubmit={handleFormSubmit}
          />
      )}

      {step === 1 && advocacyData && (
         <MessageComposition
            billType="defense"
            userStance="support"
            personalData={advocacyData.personalDataIncluded}
            recipientInfo={recipientInfo}
            onSubmit={handleComposeSubmit}
            onBack={handleBack}
          />
      )}
      
      {step === 2 && advocacyData && (
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
