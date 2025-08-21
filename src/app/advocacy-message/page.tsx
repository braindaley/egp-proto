'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Stepper, Step, StepLabel } from '@/components/ui/stepper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2, AlertCircle, User, Search, X, CheckCircle, Mail, Shield, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useZipCode } from '@/hooks/use-zip-code';
import { useMembersByZip } from '@/hooks/useMembersByZip';
import Link from 'next/link';
import type { Member, Bill, Sponsor } from '@/types';

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

// Helper function to generate dummy emails for members
function generateMemberEmail(member: any): string {
  const firstName = member.firstName || member.name?.split(' ')[0] || 'member';
  const lastName = member.lastName || member.name?.split(' ').slice(-1)[0] || 'congress';
  const bioguideId = member.bioguideId || Math.random().toString(36).substring(7);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${bioguideId}@congress.gov`;
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
    return data.committee?.members || [];
  } catch (error) {
    console.error("Error in getCommitteeMembers:", error);
    return [];
  }
}

interface PersonalDataField {
  key: string;
  label: string;
  value: any;
  available: boolean;
}


const AdvocacyMessageContent: React.FC = () => {
  const [step, setStep] = useState(1);
  const [bill, setBill] = useState<Bill | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [userStance, setUserStance] = useState<'support' | 'oppose' | ''>('');
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPersonalData, setSelectedPersonalData] = useState<string[]>(['fullName']);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  
  // Step 6 state (sending screen)
  const [isSending, setIsSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [sendingError, setSendingError] = useState<string | null>(null);
  
  // Step 7 state (account creation)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [additionalMembers, setAdditionalMembers] = useState<any[]>([]);
  const [verifiedUserInfo, setVerifiedUserInfo] = useState<any>(null);
  const [availableMembers, setAvailableMembers] = useState<{
    representatives: any[];
    committeeLeadership: any[];
    billSponsors: any[];
  }>({
    representatives: [],
    committeeLeadership: [],
    billSponsors: [],
  });

  const { user, loading } = useAuth();
  const { zipCode } = useZipCode();
  const { representatives: congressionalReps } = useMembersByZip(zipCode);
  const router = useRouter();
  const searchParams = useSearchParams();

  const congress = searchParams.get('congress');
  const billType = searchParams.get('type');
  const billNumber = searchParams.get('number');
  const isVerified = searchParams.get('verified') === 'true';

  // Check for verified user from session storage
  useEffect(() => {
    if (isVerified) {
      const storedInfo = sessionStorage.getItem('verifiedUser');
      if (storedInfo) {
        try {
          const parsedInfo = JSON.parse(storedInfo);
          setVerifiedUserInfo(parsedInfo);
          // Don't clear sessionStorage immediately - let it persist for the session
          // sessionStorage.removeItem('verifiedUser');
        } catch (e) {
          console.error('Failed to parse verified user info:', e);
          setVerifiedUserInfo(null);
        }
      } else {
        // If verified=true but no session storage, user is not actually verified
        setVerifiedUserInfo(null);
      }
    } else {
      // If not verified in URL, clear any verified user info
      setVerifiedUserInfo(null);
    }
  }, [isVerified]);

  // Fetch bill details
  useEffect(() => {
    if (congress && billType && billNumber) {
      getBillDetails(congress, billType, billNumber).then(setBill);
    }
  }, [congress, billType, billNumber]);

  // Prepare available members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!bill) return;

      // Add dummy emails to congressional reps
      const repsWithEmails = congressionalReps.map(rep => ({
        ...rep,
        email: generateMemberEmail(rep)
      }));

      // Get committee leadership
      let leadership: any[] = [];
      const committee = bill?.committees?.items?.[0];
      const committeeId = committee?.systemCode;
      const chamber = bill?.type?.toLowerCase().startsWith('hr') ? 'house' : 'senate';

      if (committeeId && congress) {
        const members = await getCommitteeMembers(committeeId, congress, chamber);
        const chair = members.find(m => m.title === 'Chair' || m.title === 'Chairman');
        const rankingMember = members.find(m => m.title === 'Ranking Member');
        
        if (chair) {
          leadership.push({
            ...chair,
            email: generateMemberEmail(chair),
            role: 'Committee Chair'
          });
        }
        if (rankingMember) {
          leadership.push({
            ...rankingMember,
            email: generateMemberEmail(rankingMember),
            role: 'Ranking Member'
          });
        }
      }

      // Add dummy emails to bill sponsors
      const sponsorsWithEmails = (bill?.sponsors || []).map(sponsor => ({
        ...sponsor,
        email: generateMemberEmail(sponsor)
      }));

      setAvailableMembers({
        representatives: repsWithEmails,
        committeeLeadership: leadership,
        billSponsors: sponsorsWithEmails
      });
    };

    fetchMembers();
  }, [bill, congressionalReps, congress]);

  // Get personal data fields from user profile or verified info
  const getPersonalDataFields = (): PersonalDataField[] => {
    // Use verified user info if available
    if (verifiedUserInfo) {
      const addressValue = `${verifiedUserInfo.address}, ${verifiedUserInfo.city}, ${verifiedUserInfo.state} ${verifiedUserInfo.zipCode}`;
      return [
        { key: 'fullName', label: 'Full Name', value: verifiedUserInfo.fullName, available: true },
        { key: 'fullAddress', label: 'Full Address', value: addressValue, available: true },
        { key: 'birthYear', label: 'Birth Year', value: null, available: false },
        { key: 'gender', label: 'Gender', value: null, available: false },
        { key: 'politicalAffiliation', label: 'Political Affiliation', value: null, available: false },
        { key: 'education', label: 'Education', value: null, available: false },
        { key: 'profession', label: 'Profession', value: null, available: false },
        { key: 'militaryService', label: 'Military Service', value: null, available: false },
      ];
    }
    
    // Use logged in user profile if available
    if (user) {
      const addressParts = [user?.address, user?.city, user?.state, user?.zipCode].filter(Boolean);
      const addressValue = addressParts.join(', ');
      const addressAvailable = addressParts.length > 0;
      
      return [
        { key: 'fullName', label: 'Full Name', value: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(), available: !!(user?.firstName || user?.lastName) },
        { key: 'fullAddress', label: 'Full Address', value: addressValue, available: addressAvailable },
        { key: 'birthYear', label: 'Birth Year', value: user?.birthYear, available: !!user?.birthYear },
        { key: 'gender', label: 'Gender', value: user?.gender, available: !!user?.gender },
        { key: 'politicalAffiliation', label: 'Political Affiliation', value: user?.politicalAffiliation, available: !!user?.politicalAffiliation },
        { key: 'education', label: 'Education', value: user?.education, available: !!user?.education },
        { key: 'profession', label: 'Profession', value: user?.profession, available: !!user?.profession },
        { key: 'militaryService', label: 'Military Service', value: user?.militaryService ? 'Yes' : 'No', available: user?.militaryService !== undefined },
      ];
    }
    
    // For anonymous users, return minimal available fields
    return [
      { key: 'fullName', label: 'Full Name', value: 'Your Name', available: false },
      { key: 'fullAddress', label: 'Full Address', value: 'Your Address', available: false },
      { key: 'birthYear', label: 'Birth Year', value: null, available: false },
      { key: 'gender', label: 'Gender', value: null, available: false },
      { key: 'politicalAffiliation', label: 'Political Affiliation', value: null, available: false },
      { key: 'education', label: 'Education', value: null, available: false },
      { key: 'profession', label: 'Profession', value: null, available: false },
      { key: 'militaryService', label: 'Military Service', value: null, available: false },
    ];
  };

  const personalDataFields = getPersonalDataFields();
  const availableFields = personalDataFields.filter(f => f.available);
  const unavailableFields = personalDataFields.filter(f => !f.available);

  // Generate AI message
  const generateAITemplate = async () => {
    if (!userStance) {
      return;
    }
    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai/generate-advocacy-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billTitle: bill?.shortTitle || bill?.title || 'this legislation',
          billSummary: bill?.summaries?.summary?.text || 'This bill addresses important issues.',
          userStance: userStance.charAt(0).toUpperCase() + userStance.slice(1) as 'Support' | 'Oppose',
          tone: 'Formal',
          personalData: {
            fullName: selectedPersonalData.includes('fullName'),
            address: selectedPersonalData.includes('fullAddress'),
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setMessage(data.message);
    } catch(e) {
      console.error("Error generating message", e);
      // Show user-friendly error
      alert('Failed to generate AI message. Please try again or write your message manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle member selection
  const toggleMember = (member: any) => {
    setSelectedMembers(prev => {
      const exists = prev.find(m => m.bioguideId === member.bioguideId || m.email === member.email);
      if (exists) {
        return prev.filter(m => m.bioguideId !== member.bioguideId && m.email !== member.email);
      }
      return [...prev, member];
    });
  };

  // Toggle personal data field
  const togglePersonalData = (key: string) => {
    if (key === 'fullName') return; // Full name is always required
    setSelectedPersonalData(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  };

  // Search for members of Congress
  const handleMemberSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/congress/members?search=${encodeURIComponent(searchTerm)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        const membersWithEmails = (data.members || []).map((member: any) => ({
          ...member,
          email: generateMemberEmail(member),
          officeTitle: member.terms?.item?.[0]?.chamber === 'Senate' ? 'United States Senate' : 'United States House of Representatives'
        }));
        setSearchResults(membersWithEmails);
      }
    } catch (error) {
      console.error('Error searching members:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Add member from search results
  const addAdditionalMember = (member: any) => {
    const exists = additionalMembers.some(m => m.bioguideId === member.bioguideId);
    if (!exists) {
      setAdditionalMembers([...additionalMembers, member]);
      setSelectedMembers([...selectedMembers, member]);
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  // Remove additional member
  const removeAdditionalMember = (memberId: string) => {
    setAdditionalMembers(additionalMembers.filter(m => m.bioguideId !== memberId));
    setSelectedMembers(selectedMembers.filter(m => m.bioguideId !== memberId));
  };

  // Handle send message
  const handleSend = async () => {
    // Validate required fields
    if (!message || !userStance || selectedMembers.length === 0) {
      alert('Please complete all required fields before sending.');
      return;
    }
    
    try {
      // Import Firebase functions
      const { getFirestore, collection, addDoc, Timestamp } = await import('firebase/firestore');
      const { app } = await import('@/lib/firebase');
      const db = getFirestore(app);
      
      // Clear sessionStorage after successful send
      sessionStorage.removeItem('verifiedUser');
      
      // Build message activity object with proper null handling
      const messageActivity: any = {
        userId: user?.uid || (verifiedUserInfo ? 'verified-' + Date.now() : 'guest-' + Date.now()),
        isVerifiedUser: !!verifiedUserInfo,
        isGuestUser: !user && !verifiedUserInfo,
        userStance: userStance,
        messageContent: message,
        recipients: selectedMembers.map(member => ({
          name: member.fullName || member.name || 'Unknown',
          bioguideId: member.bioguideId || '',
          email: member.email || '',
          party: member.party || member.partyName || '',
          role: member.role || 'Representative'
        })),
        personalDataIncluded: selectedPersonalData,
        sentAt: Timestamp.now(),
        deliveryStatus: 'sent'
      };
      
      // Add verified user info if available
      if (verifiedUserInfo) {
        messageActivity.verifiedUserInfo = {
          fullName: verifiedUserInfo.fullName,
          address: verifiedUserInfo.address,
          city: verifiedUserInfo.city,
          state: verifiedUserInfo.state,
          zipCode: verifiedUserInfo.zipCode
        };
      }
      
      // Add bill information if available
      if (bill && billNumber && billType && congress) {
        messageActivity.billNumber = billNumber;
        messageActivity.billType = billType;
        messageActivity.congress = congress;
        messageActivity.billShortTitle = bill.shortTitle || bill.title || 'Unknown Bill';
        messageActivity.billCurrentStatus = bill.latestAction?.text || 'Status Unknown';
      } else {
        // Mark as general advocacy message (not tied to specific bill)
        messageActivity.isGeneralAdvocacy = true;
        messageActivity.topic = 'General Advocacy';
      }
      
      const docRef = await addDoc(collection(db, 'user_messages'), messageActivity);
      
      // Store the message ID in sessionStorage for potential account linking
      if (!user && verifiedUserInfo) {
        sessionStorage.setItem('pendingMessageId', docRef.id);
        sessionStorage.setItem('pendingMessageData', JSON.stringify({
          messageId: docRef.id,
          verifiedUserInfo,
          billInfo: {
            congress,
            billType,
            billNumber,
            title: bill?.shortTitle || bill?.title
          }
        }));
      }
      
      // If saveAsDefault is true, save the selected fields to user preferences
      if (saveAsDefault) {
        // TODO: Save selectedPersonalData to user preferences in Firebase
        console.log('Saving default preferences:', selectedPersonalData);
      }
      
      // Navigate to confirmation page with recipient count and message status
      const recipientCount = selectedMembers.length;
      const isVerifiedSend = !user && verifiedUserInfo;
      router.push(`/advocacy-message/confirmation?count=${recipientCount}&verified=${isVerifiedSend}`);
      
    } catch (error) {
      console.error('Error saving message:', error);
      // Show error to user
      alert('Failed to send message. Please try again.');
      // Don't navigate away on error
    }
  };

  // Step 2: Select Outreach
  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Select Outreach</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Your Representatives */}
        {availableMembers.representatives.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Your Congressional Representatives</h3>
            <div className="space-y-2">
              {availableMembers.representatives.map(rep => (
                <div key={rep.bioguideId || rep.name} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedMembers.some(m => m.bioguideId === rep.bioguideId || m.name === rep.name)}
                    onCheckedChange={() => toggleMember(rep)}
                  />
                  <Label className="flex items-center space-x-2 cursor-pointer">
                    <span>{rep.name}</span>
                    <span className="text-sm text-muted-foreground">({rep.party})</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Committee Leadership */}
        {availableMembers.committeeLeadership.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Committee Leadership</h3>
            <div className="space-y-2">
              {availableMembers.committeeLeadership.map(member => (
                <div key={member.bioguideId} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedMembers.some(m => m.bioguideId === member.bioguideId)}
                    onCheckedChange={() => toggleMember(member)}
                  />
                  <Label className="flex items-center space-x-2 cursor-pointer">
                    <span>{member.name}</span>
                    <span className="text-sm text-muted-foreground">({member.role})</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bill Sponsors */}
        {availableMembers.billSponsors.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Bill Sponsors</h3>
            <div className="space-y-2">
              {availableMembers.billSponsors.map(sponsor => (
                <div key={sponsor.bioguideId} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedMembers.some(m => m.bioguideId === sponsor.bioguideId)}
                    onCheckedChange={() => toggleMember(sponsor)}
                  />
                  <Label className="flex items-center space-x-2 cursor-pointer">
                    <span>{sponsor.fullName}</span>
                    <span className="text-sm text-muted-foreground">({sponsor.party})</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search for additional members */}
        <div>
          <h3 className="font-semibold mb-3">Add Additional Members</h3>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Input
                placeholder="Search by name (e.g., 'John Smith' or 'Smith')"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMemberSearch()}
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button 
              onClick={handleMemberSearch}
              disabled={isSearching || !searchTerm.trim()}
              variant="outline"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-muted rounded-lg p-3 mb-3 max-h-48 overflow-y-auto">
              <p className="text-sm text-muted-foreground mb-2">Search Results:</p>
              {searchResults.map(member => (
                <div key={member.bioguideId} className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{member.name}</span>
                    <span className="text-xs text-muted-foreground">({member.partyName}, {member.state})</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addAdditionalMember(member)}
                    disabled={additionalMembers.some(m => m.bioguideId === member.bioguideId)}
                  >
                    {additionalMembers.some(m => m.bioguideId === member.bioguideId) ? 'Added' : 'Add'}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Added Members */}
          {additionalMembers.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Added Members:</p>
              {additionalMembers.map(member => (
                <div key={member.bioguideId} className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{member.name}</span>
                    <span className="text-xs text-muted-foreground">({member.partyName})</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAdditionalMember(member.bioguideId)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button 
            onClick={() => setStep(3)}
            disabled={selectedMembers.length === 0}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Step 1: Compose Your Message
  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Compose your message</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stance selection */}
        <div>
          <h3 className="font-semibold mb-3">Your Position</h3>
          <div className="flex gap-3">
            <Button
              variant={userStance === 'support' ? 'default' : 'outline'}
              onClick={() => setUserStance('support')}
              size="lg"
              className="flex-1"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              Support
            </Button>
            <Button
              variant={userStance === 'oppose' ? 'destructive' : 'outline'}
              onClick={() => setUserStance('oppose')}
              size="lg"
              className="flex-1"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .904-.405.904-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
              Oppose
            </Button>
          </div>
        </div>

        {/* Message composition */}
        <div>
          <h3 className="font-semibold mb-3">Your Message</h3>
          <div className="space-y-3">
            <Button 
              onClick={generateAITemplate} 
              variant="outline" 
              disabled={!userStance || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI Template
                </>
              )}
            </Button>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here, or generate a template to get started..."
              rows={20}
            />
          </div>
        </div>

        {/* Available fields */}
        {availableFields.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Select information you'd like to include about yourself</h3>
            <div className="grid grid-cols-2 gap-3">
              {availableFields.map(field => (
                <div key={field.key} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedPersonalData.includes(field.key)}
                    onCheckedChange={() => togglePersonalData(field.key)}
                    disabled={field.key === 'fullName'}
                  />
                  <Label className="cursor-pointer">
                    <span>{field.label}</span>
                    {field.value && (
                      <span className="text-sm text-muted-foreground ml-2">({field.value})</span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-2 mt-4 mb-4">
              <Switch
                id="save-default"
                checked={saveAsDefault}
                onCheckedChange={setSaveAsDefault}
              />
              <Label htmlFor="save-default" className="cursor-pointer">
                Save as default for all future mailings
              </Label>
            </div>
          </div>
        )}

        {/* Anonymous user message */}
        {availableFields.length === 0 && !user && !verifiedUserInfo && (
          <div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">No personal information available</p>
                <p className="text-sm">
                  Your message will be sent anonymously. For a more personalized message that includes your name and address, consider creating an account after sending your message.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Unavailable fields */}
        {unavailableFields.length > 0 && (
          <div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                To include additional information,{' '}
                <Link href="/signup" className="text-primary underline">
                  Sign up
                </Link>
                {' '}or{' '}
                <Link href="/login" className="text-primary underline">
                  Sign in
                </Link>
                <ul className="mt-2 list-disc list-inside">
                  {unavailableFields.map(field => (
                    <li key={field.key} className="text-sm">{field.label}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="flex justify-end">
          <Button 
            onClick={() => setStep(2)}
            disabled={!message || !userStance}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Step 3: Review Message
  const renderStep3 = () => {
    const selectedPersonalFields = personalDataFields.filter(f => selectedPersonalData.includes(f.key));
    
    // Generate salutation based on member type
    const getSalutation = (member: any) => {
      const lastName = member.lastName || member.fullName?.split(' ').slice(-1)[0] || member.name?.split(' ').slice(-1)[0] || '';
      // Check if member is a senator based on officeTitle or chamber
      const isSenator = member.officeTitle?.toLowerCase().includes('senate') || 
                       member.chamber?.toLowerCase() === 'senate' || 
                       member.url?.includes('/senate/');
      const title = isSenator ? 'Senator' : 'Representative';
      return `Dear ${title} ${lastName}`;
    };
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Step 3: Review Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recipients */}
          <div>
            <h3 className="font-semibold mb-3">Recipients ({selectedMembers.length})</h3>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              {selectedMembers.map(member => (
                <div key={member.bioguideId || member.email}>
                  <div className="font-medium">{getSalutation(member)}</div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{member.fullName || member.name}</span>
                    <span>({member.party})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Body */}
          <div>
            <h3 className="font-semibold mb-3">Message Body</h3>
            <div className="bg-muted rounded-lg p-4">
              <p className="whitespace-pre-wrap">{message}</p>
            </div>
          </div>

          {/* Signature */}
          <div>
            <h3 className="font-semibold mb-3">Signature</h3>
            <div className="bg-muted rounded-lg p-4">
              <p className="font-medium">Sincerely,</p>
              <p className="mt-2">
                {personalDataFields.find(f => f.key === 'fullName')?.value || 
                 (user || verifiedUserInfo ? 'Your Name' : 'A Concerned Constituent')}
              </p>
              {selectedPersonalFields.filter(f => f.key !== 'fullName').map(field => (
                <p key={field.key} className="text-sm text-muted-foreground">
                  {field.label}: {field.value}
                </p>
              ))}
              {(!user && !verifiedUserInfo) && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Message sent anonymously
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={() => setStep(6)}>
              Send message
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Step 4: Create Account
  const renderStep4 = () => {
    // Skip this step if user is already authenticated
    if (user) {
      return renderStep5();
    }
    
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-bold text-primary mb-2">Create your account!</CardTitle>
          <CardDescription className="text-lg">
            To keep track of your sent messages, login or sign up
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Benefits Section */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 space-y-6">
            <h3 className="font-semibold text-lg text-center text-primary">Benefits of creating an account</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-4 p-4 bg-white/60 rounded-lg">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Track Your Messages</h4>
                  <p className="text-sm text-muted-foreground mt-1">Keep all your sent messages organized in one place</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-white/60 rounded-lg">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Receive Responses</h4>
                  <p className="text-sm text-muted-foreground mt-1">Get replies from representatives directly</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-white/60 rounded-lg">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Save Preferences</h4>
                  <p className="text-sm text-muted-foreground mt-1">Set defaults for faster future messaging</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-white/60 rounded-lg">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Monitor Impact</h4>
                  <p className="text-sm text-muted-foreground mt-1">Track your advocacy efforts and their results</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-4">
            <Button 
              className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200" 
              size="lg" 
              onClick={() => {
                // Save message data to session storage before redirect
                const messageData = {
                  bill,
                  selectedMembers,
                  userStance,
                  message,
                  selectedPersonalData,
                  verifiedUserInfo
                };
                sessionStorage.setItem('pendingMessage', JSON.stringify(messageData));
                router.push(`/signup?returnTo=${encodeURIComponent('/advocacy-message/send')}`);
              }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Sign Up - It's Free!
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Already have an account?</span>
              </div>
            </div>
            
            <Button 
              className="w-full h-12 text-base font-medium" 
              size="lg" 
              variant="outline"
              onClick={() => {
                // Save message data to session storage before redirect
                const messageData = {
                  bill,
                  selectedMembers,
                  userStance,
                  message,
                  selectedPersonalData,
                  verifiedUserInfo
                };
                sessionStorage.setItem('pendingMessage', JSON.stringify(messageData));
                router.push(`/login?returnTo=${encodeURIComponent('/advocacy-message/send')}`);
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login
            </Button>
          </div>
          
          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={() => setStep(3)} className="px-6">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
            {verifiedUserInfo && (
              <Button 
                variant="ghost"
                onClick={() => {
                  // Allow verified users to skip account creation and send as verified
                  handleSend();
                }}
                className="text-muted-foreground hover:text-foreground px-6"
              >
                Skip (Send as Verified User)
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Step 5: Create Account (for verified users) or Send Message (for authenticated users)
  const renderStep5 = () => {
    // If user is already authenticated, they can send directly
    if (user) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Step 5: Send Message</CardTitle>
            <CardDescription>
              Ready to send your message to {selectedMembers.length} representative{selectedMembers.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Message Summary */}
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-semibold mb-3">Message Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a3 3 0 01-3-3v-1" />
                  </svg>
                  <div>
                    <p className="font-medium">Position:</p>
                    <p className="text-muted-foreground capitalize">{userStance}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">Recipients:</p>
                    <p className="text-muted-foreground">{selectedMembers.length} representative{selectedMembers.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="font-medium">Length:</p>
                    <p className="text-muted-foreground">{message.split(' ').length} words</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill Information */}
            {bill && (
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Regarding Legislation
                </h4>
                <p className="text-sm text-muted-foreground">{bill.shortTitle || bill.title}</p>
              </div>
            )}
            
            {/* Send Button */}
            <div className="text-center">
              <Button 
                onClick={handleSend}
                size="lg"
                className="w-48"
              >
                Send Message
              </Button>
            </div>
            
            {/* Back Button */}
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => setStep(3)}
              >
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    // For verified users who are not authenticated, show sign up/sign in
    if (verifiedUserInfo) {
      return renderStep4(); // This shows the sign up/sign in options
    }
    
    // For completely anonymous users, also show sign up/sign in
    return renderStep4();
  };

  // useEffect hooks for Step 6 - moved to component level to follow Rules of Hooks
  useEffect(() => {
    // Reset and start sending when entering Step 6
    if (step === 6 && !isSending && !messageSent) {
      setIsSending(true);
      setSendingError(null);
      setMessageSent(false);
    }
  }, [step, isSending, messageSent]);

  useEffect(() => {
    if (step === 6 && isSending && !messageSent) {
      const sendMessage = async () => {
        try {
          // Import Firebase functions
          const { getFirestore, collection, addDoc, Timestamp } = await import('firebase/firestore');
          const { app } = await import('@/lib/firebase');
          const db = getFirestore(app);
          
          // Build message activity object with proper null handling
          const messageActivity: any = {
            userId: user?.uid || (verifiedUserInfo ? 'verified-' + Date.now() : 'guest-' + Date.now()),
            isVerifiedUser: !!verifiedUserInfo,
            isGuestUser: !user && !verifiedUserInfo,
            userStance: userStance,
            messageContent: message,
            recipients: selectedMembers.map(member => ({
              name: member.fullName || member.name || 'Unknown',
              bioguideId: member.bioguideId || '',
              email: member.email || '',
              party: member.party || member.partyName || '',
              role: member.role || 'Representative'
            })),
            personalDataIncluded: selectedPersonalData,
            sentAt: Timestamp.now(),
            deliveryStatus: 'sent'
          };
          
          // Add verified user info if available
          if (verifiedUserInfo) {
            messageActivity.verifiedUserInfo = {
              fullName: verifiedUserInfo.fullName,
              address: verifiedUserInfo.address,
              city: verifiedUserInfo.city,
              state: verifiedUserInfo.state,
              zipCode: verifiedUserInfo.zipCode
            };
          }
          
          // Add bill information if available
          if (bill && billNumber && billType && congress) {
            messageActivity.billNumber = billNumber;
            messageActivity.billType = billType;
            messageActivity.congress = congress;
            messageActivity.billShortTitle = bill.shortTitle || bill.title || 'Unknown Bill';
            messageActivity.billCurrentStatus = bill.latestAction?.text || 'Status Unknown';
          } else {
            // Mark as general advocacy message (not tied to specific bill)
            messageActivity.isGeneralAdvocacy = true;
            messageActivity.topic = 'General Advocacy';
          }
          
          const docRef = await addDoc(collection(db, 'user_messages'), messageActivity);
          
          // Store the message ID in sessionStorage for potential account linking
          if (!user) {
            sessionStorage.setItem('pendingMessageId', docRef.id);
            sessionStorage.setItem('pendingMessageData', JSON.stringify({
              messageId: docRef.id,
              verifiedUserInfo,
              billInfo: {
                congress,
                billType,
                billNumber,
                title: bill?.shortTitle || bill?.title
              }
            }));
          }
          
          // If saveAsDefault is true, save the selected fields to user preferences
          if (saveAsDefault) {
            // TODO: Save selectedPersonalData to user preferences in Firebase
            console.log('Saving default preferences:', selectedPersonalData);
          }

          // Wait a moment to show the animation, then mark as sent
          setTimeout(() => {
            setIsSending(false);
            setMessageSent(true);
            
            // Clear verified user session storage only after successful send
            sessionStorage.removeItem('verifiedUser');
            
            // After another moment, show the account creation form
            setTimeout(() => {
              if (user) {
                // If already authenticated, go to confirmation page
                const recipientCount = selectedMembers.length;
                router.push(`/advocacy-message/confirmation?count=${recipientCount}`);
              } else {
                // Show account creation step
                setStep(7);
              }
            }, 2000);
          }, 2000);
          
        } catch (error) {
          console.error('Error saving message:', error);
          setSendingError('Failed to send message. Please try again.');
          setIsSending(false);
        }
      };

      sendMessage();
    }
  }, [step, isSending, messageSent, user, verifiedUserInfo, userStance, message, selectedMembers, selectedPersonalData, bill, billNumber, billType, congress, router]);

  // Step 6: Sending Screen
  const renderStep6 = () => {
    if (sendingError) {
      return (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-red-500">Error Sending Message</CardTitle>
            <CardDescription>{sendingError}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setStep(3)} className="mt-4">
              Back to Review
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (messageSent) {
      return (
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Message Sent Successfully!</CardTitle>
            <CardDescription>
              Your message has been sent to {selectedMembers.length} representative{selectedMembers.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              {user ? 'Redirecting to confirmation page...' : 'Create an account to save this message and track responses...'}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-16 w-16 text-blue-500 animate-pulse" />
          </div>
          <CardTitle className="text-2xl">Sending Your Message</CardTitle>
          <CardDescription>
            Delivering to {selectedMembers.length} representative{selectedMembers.length !== 1 ? 's' : ''}...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-secondary/20 rounded-lg p-6 min-h-[200px] flex items-center justify-center">
            <div className="space-y-2 w-full max-w-md">
              {selectedMembers.map((member, index) => (
                <div key={member.bioguideId || member.email} className="flex items-center space-x-3 animate-pulse">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <div className="h-2 bg-gray-200 rounded-full flex-1">
                    <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{width: '75%'}} />
                  </div>
                  <span className="text-sm text-muted-foreground">{member.fullName || member.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Step 7: Account Creation Form
  const renderStep7 = () => {
    const handleSignup = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsCreatingAccount(true);
      setAccountError(null);

      try {
        // Import Firebase auth functions directly
        const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
        const { app } = await import('@/lib/firebase');
        const auth = getAuth(app);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Link the pending message to the new account
        const { linkPendingMessageToUser } = await import('@/lib/link-pending-message');
        const linked = await linkPendingMessageToUser(userCredential.user.uid);
        
        if (linked) {
          console.log('Successfully linked message to new account');
        }
        
        // Redirect to dashboard
        router.push('/dashboard');
      } catch (error: any) {
        setAccountError(error.message || 'Failed to create account');
      } finally {
        setIsCreatingAccount(false);
      }
    };

    const handleSkip = () => {
      // Clear pending message data and go to home
      sessionStorage.removeItem('pendingMessageId');
      sessionStorage.removeItem('pendingMessageData');
      router.push('/');
    };

    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Save Your Message!</CardTitle>
          <CardDescription>
            Create a free account to save the message you just sent and track responses from representatives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Message sent successfully!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Your message was delivered to {selectedMembers.length} representative{selectedMembers.length !== 1 ? 's' : ''}.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Create a password"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>

            {accountError && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
                {accountError}
              </div>
            )}

            <Button
              type="submit"
              disabled={isCreatingAccount}
              className="w-full"
              size="lg"
            >
              {isCreatingAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account & Save Message
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Already have an account?
            </p>
            <Button
              variant="outline"
              onClick={() => router.push(`/login?returnTo=${encodeURIComponent('/dashboard')}&linkMessage=true`)}
              className="w-full"
            >
              Sign In Instead
            </Button>
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto p-8 max-w-4xl flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Allow all users (authenticated, verified, and anonymous) to proceed
  // We'll handle login/signup after message composition

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      {/* Verification Notice */}
      {verifiedUserInfo && !user && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">You're verified as {verifiedUserInfo.fullName}</p>
            <p className="text-sm mt-1">Your message will be delivered to your representatives. For additional features like tracking responses and managing your messages, consider <Link href={`/signup?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`} className="text-primary underline">creating an account</Link>.</p>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Bill Context */}
      {bill && (
        <Card className="mb-6 bg-secondary/50">
          <CardContent className="p-4">
            <p className="text-center font-medium">
              Voice your opinion on {billType?.toUpperCase()} {billNumber}: {bill.shortTitle || bill.title}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stepper */}
      <div className="mb-8">
        <Stepper>
          <Step active={step === 1}>
            <StepLabel>Compose Message</StepLabel>
          </Step>
          <Step active={step === 2}>
            <StepLabel>Select Outreach</StepLabel>
          </Step>
          <Step active={step === 3}>
            <StepLabel>Review Message</StepLabel>
          </Step>
          <Step active={step === 4}>
            <StepLabel>Create Account</StepLabel>
          </Step>
          <Step active={step === 5}>
            <StepLabel>{user ? 'Send Message' : 'Create Account'}</StepLabel>
          </Step>
        </Stepper>
      </div>

      {/* Step Content */}
      {step === 1 && renderStep2()} {/* Personal Information */}
      {step === 2 && renderStep1()} {/* Select Outreach */}
      {step === 3 && renderStep3()} {/* Review Message */}
      {step === 4 && renderStep4()} {/* Create Account */}
      {step === 5 && renderStep5()} {/* Send Message */}
      {step === 6 && renderStep6()} {/* Sending Screen */}
      {step === 7 && renderStep7()} {/* Account Creation Form */}
    </div>
  );
};

const AdvocacyMessagePage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdvocacyMessageContent />
    </Suspense>
  );
};

export default AdvocacyMessagePage;