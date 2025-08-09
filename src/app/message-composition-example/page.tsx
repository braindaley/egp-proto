
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MessageComposition from '../../components/MessageComposition';
import DeliveryHandler from '../../components/advocacy/DeliveryHandler';
import { Stepper, Step, StepLabel } from '@/components/ui/stepper'; 

const AdvocacyMessageFlow: React.FC = () => {
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');
  const [personalData, setPersonalData] = useState({
    fullName: true,
    address: true,
    age: false,
    gender: false,
    partyAffiliation: true,
    education: false,
    profession: false,
    votingPrecinct: false,
    militaryService: true,
    issueImportance: false,
  });

  const recipientInfo = {
    name: 'Honorable Jane Doe',
    address: '123 Capitol Hill, Washington D.C. 20515',
    email: 'jane.doe@example.com'
  };
  
  const recipients = [{id: 'B001234', name: recipientInfo.name}];

  const router = useRouter();

  const handleComposeSubmit = (composedMessage: string) => {
    setMessage(composedMessage);
    setStep(1); // Move to the delivery step
  };
  
  const handleDeliveryComplete = () => {
      setTimeout(() => {
          router.push('/admin/advocacy-messages');
      }, 2000);
  };
  
  const handleReset = () => {
      setStep(0);
      setMessage('');
  }

  const steps = ['Compose Message', 'Send Message', 'Complete'];

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
         <MessageComposition
            billType="defense"
            userStance="support"
            personalData={personalData}
            recipientInfo={recipientInfo}
            onSubmit={handleComposeSubmit}
          />
      )}
      
      {step === 1 && (
        <DeliveryHandler
            messageContent={message}
            recipients={recipients}
            deliveryMethod="email"
            personalDataIncluded={personalData}
            onComplete={handleDeliveryComplete}
            onReset={handleReset}
        />
      )}
    </div>
  );
};

export default AdvocacyMessageFlow;
