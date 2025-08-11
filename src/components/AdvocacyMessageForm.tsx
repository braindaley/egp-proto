
import React, { useState, useEffect } from 'react';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { useAuth } from '@/hooks/use-auth';

// Define the shape of the personal data that can be included in a message
interface PersonalData {
  fullName: boolean;
  address: boolean;
  age: boolean;
  gender: boolean;
  partyAffiliation: boolean;
  education: boolean;
  profession: boolean;
  votingPrecinct: boolean;
  militaryService: boolean;
}

// Define the shape of the recipients
export interface Recipients {
    representatives: boolean;
    committeeLeadership: boolean;
    billSponsors: boolean;
}

// Define the props for the AdvocacyMessageForm component
interface AdvocacyMessageFormProps {
  billType: string; // To demonstrate dynamic form logic
  recipientCategory: string; // To demonstrate dynamic form logic
  onSubmit: (data: {
    recipients: Recipients;
    personalDataIncluded: PersonalData;
    savePreferences: boolean;
    useAnonymousId: boolean;
  }) => void;
}

const AdvocacyMessageForm: React.FC<AdvocacyMessageFormProps> = ({ billType, recipientCategory, onSubmit }) => {
  const { user } = useAuth();
    
  // State for recipients
  const [recipients, setRecipients] = useState<Recipients>({
    representatives: true,
    committeeLeadership: false,
    billSponsors: false,
  });

  // State to manage the user's selection of personal information
  const [personalData, setPersonalData] = useState<PersonalData>({
    fullName: true, // Full Name is required
    address: false,
    age: false,
    gender: false,
    partyAffiliation: false,
    education: false,
    profession: false,
    votingPrecinct: false,
    militaryService: false,
  });

  // State for privacy controls
  const [savePreferences, setSavePreferences] = useState(false);
  const [useAnonymousId, setUseAnonymousId] = useState(false);

    useEffect(() => {
        if (user) {
            setPersonalData(prev => ({
                ...prev,
                fullName: !!(user.firstName || user.lastName),
                address: !!(user.address || user.city || user.state || user.zipCode),
                age: !!user.birthYear,
                gender: !!user.gender,
                partyAffiliation: !!user.politicalAffiliation,
                education: !!user.education,
                profession: !!user.profession,
                militaryService: !!user.militaryService,
                votingPrecinct: !!user.zipCode, // Placeholder for precinct logic
            }));
        }
    }, [user]);


  // Handle recipient checkbox changes
  const handleRecipientChange = (field: keyof Recipients) => {
    setRecipients((prev) => ({ ...prev, [field]: !prev[field] }));
  };
  
  // Handle personal data checkbox changes
  const handlePersonalDataChange = (field: keyof PersonalData) => {
    if (field === 'fullName') return; // Full Name is always required
    setPersonalData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      recipients,
      personalDataIncluded: personalData,
      savePreferences,
      useAnonymousId,
    });
  };

  // Dynamic form logic: determine which fields to show based on billType and recipientCategory
  const shouldShowField = (field: keyof PersonalData) => {
    // Example: only show military service for defense-related bills
    if (field === 'militaryService' && billType.toLowerCase() !== 'defense') {
      return false;
    }
    // Example: only show party affiliation for messages to party leaders
    if (field === 'partyAffiliation' && recipientCategory !== 'party_leader') {
      return false;
    }
    return true;
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Your Message</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {/* Recipient Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Select Outreach</h3>
            <div className="grid grid-cols-1 gap-4">
               <div className="flex items-center">
                    <Checkbox
                        id="representatives"
                        checked={recipients.representatives}
                        onCheckedChange={() => handleRecipientChange('representatives')}
                    />
                    <Label htmlFor="representatives" className="ml-2">
                        Your congressional representatives
                    </Label>
                </div>
                <div className="flex items-center">
                    <Checkbox
                        id="committeeLeadership"
                        checked={recipients.committeeLeadership}
                        onCheckedChange={() => handleRecipientChange('committeeLeadership')}
                    />
                    <Label htmlFor="committeeLeadership" className="ml-2">
                        Applicable Committee Leadership
                    </Label>
                </div>
                <div className="flex items-center">
                    <Checkbox
                        id="billSponsors"
                        checked={recipients.billSponsors}
                        onCheckedChange={() => handleRecipientChange('billSponsors')}
                    />
                    <Label htmlFor="billSponsors" className="ml-2">
                        Bill Sponsors
                    </Label>
                </div>
            </div>
          </div>

          {/* Personal Information Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Include Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(personalData).map((key) => {
                const field = key as keyof PersonalData;
                if (!shouldShowField(field)) return null;

                return (
                  <div key={field} className="flex items-center">
                    <Checkbox
                      id={field}
                      checked={personalData[field]}
                      onCheckedChange={() => handlePersonalDataChange(field)}
                      disabled={field === 'fullName'}
                    />
                    <Label htmlFor={field} className="ml-2">
                      {field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy Controls */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Privacy Controls</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <Switch id="save-preferences" checked={savePreferences} onCheckedChange={setSavePreferences} />
                <Label htmlFor="save-preferences" className="ml-2">Save these preferences for future messages</Label>
              </div>
              <div className="flex items-center">
                <Switch id="anonymous-id" checked={useAnonymousId} onCheckedChange={setUseAnonymousId} />
                <Label htmlFor="anonymous-id" className="ml-2">Use an anonymous identifier</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Next</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdvocacyMessageForm;
