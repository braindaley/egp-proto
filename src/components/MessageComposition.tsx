
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Mail, Send, ThumbsUp, ThumbsDown, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateAdvocacyMessage } from '@/ai/flows/generate-advocacy-message-flow';

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

interface RecipientInfo {
  name: string;
  address: string;
  email: string;
}

interface MessageCompositionProps {
  billTitle: string;
  billSummary: string;
  userStance: 'support' | 'oppose' | 'none';
  onStanceChange: (stance: 'support' | 'oppose' | 'none') => void;
  personalData: PersonalData;
  recipientInfo: RecipientInfo;
  onSubmit: (message: string) => void;
  onBack: () => void;
  recipientSelection: React.ReactNode;
}

const MessageComposition: React.FC<MessageCompositionProps> = ({
  billTitle,
  billSummary,
  userStance,
  onStanceChange,
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
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAITemplate = async () => {
    if (userStance === 'none') {
        setValidationErrors(['Please select "Support" or "Oppose" before generating a template.']);
        return;
    }
    setValidationErrors([]);
    setIsGenerating(true);

    try {
        const capitalizedStance = userStance.charAt(0).toUpperCase() + userStance.slice(1);
        const capitalizedTone = tone.charAt(0).toUpperCase() + tone.slice(1);

        const result = await generateAdvocacyMessage({
            billTitle,
            billSummary,
            userStance: capitalizedStance as 'Support' | 'Oppose',
            tone: capitalizedTone as 'Formal' | 'Passionate' | 'Personal',
            personalData: {
                fullName: personalData.fullName,
                address: personalData.address,
            }
        });
        setMessage(result);
    } catch(e) {
        console.error("Error generating message", e);
        setValidationErrors(['There was an error generating the message. Please try again.']);
    } finally {
        setIsGenerating(false);
    }
  };

  const validateMessage = () => {
    const errors: string[] = [];
    if (!message.trim()) {
      errors.push('Message cannot be empty.');
    }
    if (userStance === 'none') {
      errors.push('Please select a "Support" or "Oppose" stance.');
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
          
          <div>{recipientSelection}</div>

          <h3 className="text-lg font-semibold mb-2">Compose Your Message</h3>

          <div className="flex gap-2">
            <Button
                variant={userStance === 'support' ? 'default' : 'outline'}
                onClick={() => onStanceChange('support')}
                size="sm"
            >
                <ThumbsUp className="mr-2 h-4 w-4" />
                Support
            </Button>
            <Button
                variant={userStance === 'oppose' ? 'destructive' : 'outline'}
                onClick={() => onStanceChange('oppose')}
                size="sm"
            >
                <ThumbsDown className="mr-2 h-4 w-4" />
                Oppose
            </Button>
          </div>
          
          <div>
            <Label>Smart Templates</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button onClick={generateAITemplate} variant="outline" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
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
                       <Mail className={cn('h-5 w-5', deliveryMethod === 'email' ? 'text-indigo-600' : 'text-gray-400')} />
                       <Label className="ml-2 cursor-pointer">Email</Label>
                    </div>
                     <div className="flex items-center cursor-pointer" onClick={() => setDeliveryMethod('postal')}>
                       <Send className={cn('h-5 w-5', deliveryMethod === 'postal' ? 'text-indigo-600' : 'text-gray-400')} />
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
