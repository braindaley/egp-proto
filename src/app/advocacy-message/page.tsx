
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdvocacyMessageForm, {Recipients as RecipientCategories} from '../../components/AdvocacyMessageForm';
import MessageComposition from '../../components/MessageComposition';
import DeliveryHandler from '../../components/advocacy/DeliveryHandler';
import SelectBill from '../../components/SelectBill';
import { Stepper, Step, StepLabel } from '@/components/ui/stepper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useZipCode } from '@/hooks/use-zip-code';
import { useMembersByZip } from '@/hooks/useMembersByZip';
import type { Member, Bill, Sponsor } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Helper function to fetch bill details
async function getBillDetails(congress: string, billType: string, billNumber: string): Promise<Bill | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const url = `${baseUrl}/api/bill?congress=${congress}&billType=${billType}&billNumber=${billNumber}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed to fetch bill details: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Error in getBillDetails:", error);
    return null;
  }
}

// Helper function to fetch committee members
async function getCommitteeMembers(committeeId: string): Promise<any[]> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const url = `${baseUrl}/api/congress/committee/${committeeId}`;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`Failed to fetch committee members: ${res.status}`);
            return [];
        }
        const data = await res.json();
        return data.members || [];
    } catch (error) {
        console.error("Error in getCommitteeMembers:", error);
        return [];
    }
}

const AdvocacyMessagePage: React.FC = () => {
  const [step, setStep] = useState(0);
  const [advocacyData, setAdvocacyData] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState<any[]>([]);
  const [bill, setBill] = useState<Bill | null>(null);
  const [availableRecipients, setAvailableRecipients] = useState<{
    representatives: Member[];
    committeeLeadership: Sponsor[];
    billSponsors: Sponsor[];
  }>({
    representatives: [],
    committeeLeadership: [],
    billSponsors: [],
  });

  const { zipCode } = useZipCode();
  const { representatives: congressionalReps } = useMembersByZip(zipCode);

  const router = useRouter();
  const searchParams = useSearchParams();

  const congress = searchParams.get('congress');
  const billType = searchParams.get('type');
  const billNumber = searchParams.get('number');
  
  useEffect(() => {
    if (congress && billType && billNumber) {
      getBillDetails(congress, billType, billNumber).then(setBill);
    }
  }, [congress, billType, billNumber]);
  
  useEffect(() => {
    setAvailableRecipients(prev => ({ ...prev, representatives: congressionalReps as Member[] }));
  }, [congressionalReps]);

  const handleFormSubmit = async (data: any) => {
    setAdvocacyData(data);
    
    const recipientCategories: RecipientCategories = data.recipients;
    let leadership: Sponsor[] = [];
    let sponsors: Sponsor[] = [];

    if (recipientCategories.committeeLeadership && bill?.committees?.items?.[0]?.systemCode) {
        const members = await getCommitteeMembers(bill.committees.items[0].systemCode);
        const chair = members.find(m => m.title === 'Chair' || m.title === 'Chairman');
        const rankingMember = members.find(m => m.title === 'Ranking Member');
        
        if (chair) {
            leadership.push({ 
                bioguideId: chair.bioguideId, 
                fullName: chair.name, 
                firstName: chair.name.split(' ')[0],
                lastName: chair.name.split(' ').slice(-1)[0],
                party: chair.party,
                state: chair.state,
                url: chair.url,
            });
        }
        if (rankingMember) {
             leadership.push({ 
                bioguideId: rankingMember.bioguideId, 
                fullName: rankingMember.name, 
                firstName: rankingMember.name.split(' ')[0],
                lastName: rankingMember.name.split(' ').slice(-1)[0],
                party: rankingMember.party,
                state: rankingMember.state,
                url: rankingMember.url,
            });
        }
    }

    if (recipientCategories.billSponsors && bill?.sponsors) {
        sponsors = bill.sponsors;
    }

    setAvailableRecipients(prev => ({
        ...prev,
        committeeLeadership: leadership,
        billSponsors: sponsors
    }));

    setStep(prev => prev + 1);
  };
  
  const handleComposeSubmit = (composedMessage: string) => {
    setMessage(composedMessage);
    setStep(prev => prev + 1);
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
      setRecipients([]);
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
  
  const currentStepOffset = billNumber ? 0 : 1;

  const renderRecipientSelection = () => {
    const recipientCategories: RecipientCategories = advocacyData.recipients;
    const allRecipients = [
        ...(recipientCategories.representatives ? availableRecipients.representatives : []),
        ...(recipientCategories.committeeLeadership ? availableRecipients.committeeLeadership : []),
        ...(recipientCategories.billSponsors ? availableRecipients.billSponsors : [])
    ];
    
    const uniqueRecipients = allRecipients.filter((v,i,a)=>a.findIndex(t=>(t.bioguideId === v.bioguideId))===i);

    return (
        <div>
            <h3 className="text-lg font-semibold mb-2">Selecting recipients</h3>
            {uniqueRecipients.map(recipient => (
                <div key={recipient.bioguideId} className="flex items-center mb-2">
                    <Checkbox
                        id={recipient.bioguideId}
                        checked={recipients.some(r => r.bioguideId === recipient.bioguideId)}
                        onCheckedChange={() => {
                            setRecipients(prev => 
                                prev.some(r => r.bioguideId === recipient.bioguideId)
                                    ? prev.filter(r => r.bioguideId !== recipient.bioguideId)
                                    : [...prev, recipient]
                            );
                        }}
                    />
                    <Label htmlFor={recipient.bioguideId} className="ml-2">
                        {recipient.fullName || recipient.directOrderName}
                    </Label>
                </div>
            ))}
        </div>
    );
  }


  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <Stepper>
            {steps.map((label, index) => (
                 <Step key={label} active={step - currentStepOffset === index}>
                    <StepLabel>{label}</StepLabel>
                </Step>
            ))}
        </Stepper>
      </div>
      
      {billType && billNumber && <BillContextCard />}

      {step === 0 && !billNumber && <SelectBill />}

      {step === (billNumber ? 0 : 1) && (
         <AdvocacyMessageForm
            billType={bill?.shortTitle || 'general'}
            recipientCategory="party_leader"
            onSubmit={handleFormSubmit}
          />
      )}

      {step === (billNumber ? 1 : 2) && advocacyData && (
         <MessageComposition
            billType={bill?.shortTitle || 'general'}
            userStance="support"
            personalData={advocacyData.personalDataIncluded}
            recipientInfo={recipients[0]}
            onSubmit={handleComposeSubmit}
            onBack={handleBack}
            recipientSelection={renderRecipientSelection()}
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
