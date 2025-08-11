
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
  const url = `/api/bill?congress=${congress}&billType=${billType}&billNumber=${billNumber}`;
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
async function getCommitteeMembers(committeeId: string, congress: string, chamber: 'house' | 'senate'): Promise<any[]> {
  const url = `/api/congress/committee/${committeeId}?congress=${congress}&chamber=${chamber}`;
  try {
      const res = await fetch(url);
      if (!res.ok) {
          console.error(`Failed to fetch committee members: ${res.status}`);
          return [];
      }
      const data = await res.json();
      // Adjust this based on the actual structure of the returned data
      return data.committee?.members || [];
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
  
    const committee = bill?.committees?.items?.[0];
    const committeeId = committee?.systemCode;
    const chamber = bill?.type?.toLowerCase().startsWith('hr') ? 'house' : 'senate';
  
    if (recipientCategories.committeeLeadership && committeeId && congress) {
        const members = await getCommitteeMembers(committeeId, congress, chamber);
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
    } else if (recipientCategories.committeeLeadership && !committeeId) {
        console.warn("Committee leadership requested but no committee ID found on the bill object.");
    }

    if (recipientCategories.billSponsors && bill?.sponsors) {
        sponsors = bill.sponsors;
    }

    setAvailableRecipients(prev => ({
        ...prev,
        committeeLeadership: leadership,
        billSponsors: sponsors
    }));

    // Pre-select all available recipients from the chosen categories
    const allAvailable = [
        ...(recipientCategories.representatives ? (congressionalReps as Member[]) : []),
        ...(recipientCategories.committeeLeadership ? leadership : []),
        ...(recipientCategories.billSponsors ? sponsors : [])
    ];
    const uniqueRecipients = allAvailable.filter((v,i,a)=>a.findIndex(t=>(t.bioguideId === v.bioguideId))===i);
    setRecipients(uniqueRecipients);

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
    if (!advocacyData) return null;

    const { representatives, committeeLeadership, billSponsors } = advocacyData.recipients;

    const handleRecipientToggle = (recipient: any) => {
      setRecipients(prev => {
        const isSelected = prev.some(r => r.bioguideId === recipient.bioguideId);
        if (isSelected) {
          return prev.filter(r => r.bioguideId !== recipient.bioguideId);
        } else {
          return [...prev, recipient];
        }
      });
    };

    const renderCategory = (title: string, categoryRecipients: (Member | Sponsor)[]) => {
      if (categoryRecipients.length === 0) return null;
      return (
        <div key={title}>
          <h4 className="font-semibold text-sm text-muted-foreground mt-4 mb-2">{title}</h4>
          <div className="space-y-2">
            {categoryRecipients.map(recipient => (
              <div key={recipient.bioguideId} className="flex items-center">
                <Checkbox
                  id={recipient.bioguideId}
                  checked={recipients.some(r => r.bioguideId === recipient.bioguideId)}
                  onCheckedChange={() => handleRecipientToggle(recipient)}
                />
                <Label htmlFor={recipient.bioguideId} className="ml-2">
                  {recipient.fullName || (recipient as Member).directOrderName || (recipient as Member).name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Recipients</h3>
        {representatives && renderCategory('Your Congressional Representatives', availableRecipients.representatives)}
        {committeeLeadership && renderCategory('Applicable Committee Leadership', availableRecipients.committeeLeadership)}
        {billSponsors && renderCategory('Bill Sponsors', availableRecipients.billSponsors)}
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
