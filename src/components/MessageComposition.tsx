
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
  onBack: () => void;
  recipientSelection: React.ReactNode;
}

const MessageComposition: React.FC<MessageCompositionProps> = ({
  billType,
  userStance,
  personalData,
  recipientInfo,
  onSubmit,
  onBack,
  recipientSelection,
}) => {
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('formal');
  const [deliveryMethod, setDeliveryMethod] = useState('email');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const generateAITemplate = () => {
    // Simulated AI template generation based on bill type and stance
    const templates: Record<string, Record<string, string>> = {
      defense: {
        support: `Dear Honorable Representative,\n\nI am writing to express my strong support for the upcoming defense bill. Our nation's security is of utmost importance, and I believe this bill provides the necessary resources to strengthen our military and protect our interests at home and abroad.\n\nThank you for your leadership and consideration.\n\nSincerely,\n[Your Name]`,
        oppose: `Dear Honorable Representative,\n\nI am writing to voice my serious concerns about the upcoming defense bill. While I agree that national security is a priority, I believe the current version of this bill is misguided and contains provisions that are not in the best interest of our country. I urge you to reconsider your support.\n\nSincerely,\n[Your Name]`,
      },
      healthcare: {
        support: `Dear Honorable Representative,\n\nI am writing to urge you to support the new healthcare bill. Access to affordable, quality healthcare is a fundamental right, and this bill takes significant steps towards achieving that goal for all Americans. It is a crucial piece of legislation that will positively impact countless lives.\n\nSincerely,\n[Your Name]`,
        oppose: `Dear Honorable Representative,\n\nI am writing to express my strong opposition to the new healthcare bill. I have serious reservations about its potential impact on healthcare costs, coverage, and quality. I believe it will create more problems than it solves and I urge you to vote against it.\n\nSincerely,\n[Your Name]`,
      },
    };
    const defaultTemplate = `Dear Honorable Representative,\n\nI am writing to you regarding the ${billType} bill. My position is one of ${userStance}. I believe this is an important issue for our community.\n\nSincerely,\n[Your Name]`;

    const generatedTemplate = templates[billType]?.[userStance] || defaultTemplate;
    setMessage(generatedTemplate.replace('[Your Name]', personalData.fullName ? 'Your Name' : 'A Constituent'));
  };

  const validateMessage = () => {
    const errors: string[] = [];
    if (!message.trim()) {
      errors.push('Message cannot be empty.');
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = () => {
    if (validateMessage()) {
      onSubmit(message);
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Your Advocacy Message</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          
          {recipientSelection}

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
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <div className="flex gap-2">
            <Button variant="outline" onClick={validateMessage}>Validate Message</Button>
            <Button onClick={handleSubmit}>Next</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MessageComposition;
