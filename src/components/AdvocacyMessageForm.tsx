
import React, { useState } from 'react';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

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
  issueImportance: boolean;
}

// Define the props for the AdvocacyMessageForm component
interface AdvocacyMessageFormProps {
  billType: string; // To demonstrate dynamic form logic
  recipientCategory: string; // To demonstrate dynamic form logic
  onSubmit: (data: any) => void;
}

const AdvocacyMessageForm: React.FC<AdvocacyMessageFormProps> = ({ billType, recipientCategory, onSubmit }) => {
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
    issueImportance: false,
  });

  // State for privacy controls
  const [savePreferences, setSavePreferences] = useState(false);
  const [useAnonymousId, setUseAnonymousId] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Handle checkbox changes
  const handleCheckboxChange = (field: keyof PersonalData) => {
    if (field === 'fullName') return; // Full Name is always required
    setPersonalData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Generate a preview of the message signature
  const generatePreview = () => {
    if (useAnonymousId) {
      return 'Message sent from Anonymous Constituent';
    }

    const includedData = Object.entries(personalData)
      .filter(([, isSelected]) => isSelected)
      .map(([field]) => {
        switch (field) {
          case 'fullName':
            return 'Your Name';
          case 'address':
            return 'Your Address/ZIP Code';
          case 'age':
            return 'Your Age/Birth Year';
          case 'gender':
            return 'Your Gender, Marital Status';
          case 'partyAffiliation':
            return 'Your Party Affiliation';
          case 'education':
            return 'Your Education Level';
          case 'profession':
            return 'Your Profession/Industry';
          case 'votingPrecinct':
            return 'Your Voting Precinct';
          case 'militaryService':
            return 'Your Military Service Status';
          case 'issueImportance':
            return 'Your Ranking of Issue Importance';
          default:
            return '';
        }
      })
      .join('\\n');

    return includedData;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      personalDataIncluded: personalData,
      savePreferences,
      useAnonymousId,
    });
  };

  // Dynamic form logic: determine which fields to show based on billType and recipientCategory
  const shouldShowField = (field: keyof PersonalData) => {
    // Example: only show military service for defense-related bills
    if (field === 'militaryService' && billType !== 'defense') {
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
                      onCheckedChange={() => handleCheckboxChange(field)}
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
              <div className="flex items-center">
                <Switch id="show-preview" checked={showPreview} onCheckedChange={setShowPreview} />
                <Label htmlFor="show-preview" className="ml-2">Show preview of how your information will appear</Label>
              </div>
            </div>
          </div>

          {/* Message Preview */}
          {showPreview && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Message Preview</h3>
              <div className="p-4 border rounded-md bg-gray-50">
                <p className="text-sm text-gray-700 whitespace-pre-line">{generatePreview()}</p>
              </div>
            </div>
          )}

          <Button type="submit">Send Message</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdvocacyMessageForm;
