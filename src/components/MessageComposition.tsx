
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Mail, Send } from 'lucide-react';

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

interface RecipientInfo {
  name: string;
  address: string;
  email: string;
}

interface MessageCompositionProps {
  billType: string;
  userStance: 'support' | 'oppose';
  personalData: PersonalData;
  recipientInfo: RecipientInfo;
  onSubmit: (message: string) => void;
}

const MessageComposition: React.FC<MessageCompositionProps> = ({
  billType,
  userStance,
  personalData,
  recipientInfo,
  onSubmit,
}) => {
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('formal');
  const [deliveryMethod, setDeliveryMethod] = useState('email');
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const generateAITemplate = () => {
    // Simulated AI template generation based on bill type and stance
    const templates: Record<string, Record<string, string>> = {
      defense: {
        support: `Dear ${recipientInfo.name},\n\nI am writing to express my strong support for the upcoming defense bill. Our nation's security is of utmost importance, and I believe this bill provides the necessary resources to strengthen our military and protect our interests at home and abroad.\n\nThank you for your leadership and consideration.\n\nSincerely,\n[Your Name]`,
        oppose: `Dear ${recipientInfo.name},\n\nI am writing to voice my serious concerns about the upcoming defense bill. While I agree that national security is a priority, I believe the current version of this bill is misguided and contains provisions that are not in the best interest of our country. I urge you to reconsider your support.\n\nSincerely,\n[Your Name]`,
      },
      healthcare: {
        support: `Dear ${recipientInfo.name},\n\nI am writing to urge you to support the new healthcare bill. Access to affordable, quality healthcare is a fundamental right, and this bill takes significant steps towards achieving that goal for all Americans. It is a crucial piece of legislation that will positively impact countless lives.\n\nSincerely,\n[Your Name]`,
        oppose: `Dear ${recipientInfo.name},\n\nI am writing to express my strong opposition to the new healthcare bill. I have serious reservations about its potential impact on healthcare costs, coverage, and quality. I believe it will create more problems than it solves and I urge you to vote against it.\n\nSincerely,\n[Your Name]`,
      },
    };
    const defaultTemplate = `Dear ${recipientInfo.name},\n\nI am writing to you regarding the ${billType} bill. My position is one of ${userStance}. I believe this is an important issue for our community.\n\nSincerely,\n[Your Name]`;

    const generatedTemplate = templates[billType]?.[userStance] || defaultTemplate;
    setMessage(generatedTemplate.replace('[Your Name]', personalData.fullName ? 'Your Name' : 'A Constituent'));
  };

  const validateMessage = () => {
    const errors: string[] = [];
    if (!message.trim()) {
      errors.push('Message cannot be empty.');
    }
    if (deliveryMethod === 'email' && !recipientInfo.email) {
      errors.push('Recipient email is missing for email delivery.');
    }
    if (deliveryMethod === 'postal' && !recipientInfo.address) {
      errors.push('Recipient address is missing for postal mail delivery.');
    }
    if (tone === 'formal' && (message.includes('!!!') || message.toLowerCase().includes('u r'))) {
        errors.push('The message content seems too informal for the selected "Formal" tone.');
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = () => {
    if (validateMessage()) {
      onSubmit(message);
    }
  };

  const getSignature = () => {
    const signatureParts: string[] = [];
    if (personalData.fullName) signatureParts.push('Your Name');
    if (personalData.address) signatureParts.push('Your Address/ZIP Code');
    if (personalData.age) signatureParts.push('Your Age/Birth Year');
    if (personalData.gender) signatureParts.push('Your Gender, Marital Status');
    if (personalData.partyAffiliation) signatureParts.push('Your Party Affiliation');
    if (personalData.education) signatureParts.push('Your Education Level');
    if (personalData.profession) signatureParts.push('Your Profession/Industry');
    if (personalData.votingPrecinct) signatureParts.push('Your Voting Precinct');
    if (personalData.militaryService) signatureParts.push('Your Military Service');
    if (personalData.issueImportance) signatureParts.push('Your Issue Importance Ranking');
    return signatureParts.join('\n');
  }

  const CharacterCount = () => {
    const limit = deliveryMethod === 'email' ? 5000 : 10000;
    const count = message.length;
    const isOverLimit = count > limit;
    return (
        <p className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
            {count} / {limit} characters
        </p>
    );
  }

  const Preview = () => (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Message Preview</h3>
      <div
        className={`p-6 border rounded-md ${
          deliveryMethod === 'postal' ? 'bg-white shadow-md font-serif' : 'bg-gray-50'
        }`}
        style={{ borderColor: '#E6E6FA' }}
      >
        {deliveryMethod === 'postal' && (
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold" style={{ color: '#4B0082', fontFamily: 'Poppins, sans-serif' }}>Congress Bills Explorer</h2>
            <p className="text-sm" style={{ color: '#4B0082' }}>Your Voice, Your Government</p>
          </div>
        )}
        <div className="prose prose-sm max-w-none" style={{ fontFamily: 'PT Sans, sans-serif' }}>
            <p className="whitespace-pre-wrap">{message}</p>
            <br />
            <p className="whitespace-pre-wrap">{getSignature()}</p>
        </div>
        {deliveryMethod === 'postal' && (
            <div className="mt-8 text-xs text-gray-500">
                <p>To: {recipientInfo.name}</p>
                <p>{recipientInfo.address}</p>
            </div>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Your Advocacy Message</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Smart Templates</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button onClick={generateAITemplate} variant="outline">
                Generate AI Template
              </Button>
              <p className="text-sm text-gray-500">Based on bill type and your stance.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <Label htmlFor="tone-select">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger id="tone-select">
                        <SelectValue placeholder="Select a tone" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="passionate">Passionate</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                </Select>
             </div>
             <div>
                <Label>Delivery Method</Label>
                <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center cursor-pointer" onClick={() => setDeliveryMethod('email')}>
                       <Mail className={`h-5 w-5 ${deliveryMethod === 'email' ? 'text-indigo-600' : 'text-gray-400'}`} />
                       <Label className="ml-2 cursor-pointer">Email</Label>
                    </div>
                     <div className="flex items-center cursor-pointer" onClick={() => setDeliveryMethod('postal')}>
                       <Send className={`h-5 w-5 ${deliveryMethod === 'postal' ? 'text-indigo-600' : 'text-gray-400'}`} />
                       <Label className="ml-2 cursor-pointer">Postal Mail</Label>
                    </div>
                </div>
             </div>
          </div>

          <div>
            <Label htmlFor="message-area">Your Message</Label>
            <Textarea
              id="message-area"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here, or generate a template to get started."
              rows={10}
              className="mt-1"
            />
            <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">You can customize the AI-generated message.</p>
                <CharacterCount />
            </div>
          </div>

          <div className="flex items-center space-x-2">
              <Switch id="show-preview" checked={showPreview} onCheckedChange={setShowPreview} />
              <Label htmlFor="show-preview">Show Preview</Label>
          </div>

          {showPreview && <Preview />}
          
          {validationErrors.length > 0 && (
             <Alert variant="destructive">
               <AlertTitle>Validation Errors</AlertTitle>
               <AlertDescription>
                 <ul>
                   {validationErrors.map((error, index) => <li key={index}>- {error}</li>)}
                 </ul>
               </AlertDescription>
             </Alert>
          )}

        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={validateMessage}>Validate Message</Button>
        <Button onClick={handleSubmit}>Send Message</Button>
      </CardFooter>
    </Card>
  );
};

export default MessageComposition;
