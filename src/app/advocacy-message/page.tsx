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
import { Sparkles, Loader2, AlertCircle, User, Search, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useZipCode } from '@/hooks/use-zip-code';
import { useMembersByZip } from '@/hooks/useMembersByZip';
import { generateAdvocacyMessage } from '@/ai/flows/generate-advocacy-message-flow';
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

// Component for unauthenticated users
const UnauthenticatedMessage: React.FC = () => {
  const searchParams = useSearchParams();
  const currentPath = '/advocacy-message';
  
  let returnUrl = currentPath;
  try {
    const queryString = searchParams.toString();
    returnUrl = queryString ? `${currentPath}?${queryString}` : currentPath;
  } catch (error) {
    console.error('Error building return URL:', error);
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Voice Your Opinion</CardTitle>
          <CardDescription>To voice your opinion, login or sign up</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground text-center">Benefits:</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span>Receive responses from messages you send</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span>Track your impact on bills you care about</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span>Ensure your messages reach the correct representatives</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span>Streamline contacting multiple representatives about the same issue</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <Button className="w-full" size="lg" asChild>
              <Link href={`/login?returnTo=${encodeURIComponent(returnUrl)}`}>
                Login
              </Link>
            </Button>
            <Button className="w-full" size="lg" variant="outline" asChild>
              <Link href={`/signup?returnTo=${encodeURIComponent(returnUrl)}`}>
                Sign Up
              </Link>
            </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            After logging in, you'll return to this page to complete your message.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AdvocacyMessageContent: React.FC = () => {
  const [step, setStep] = useState(1);
  const [bill, setBill] = useState<Bill | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [userStance, setUserStance] = useState<'support' | 'oppose' | ''>('');
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPersonalData, setSelectedPersonalData] = useState<string[]>(['fullName']);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
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
        setVerifiedUserInfo(JSON.parse(storedInfo));
        // Clear the session storage item after use
        sessionStorage.removeItem('verifiedUser');
      }
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
    
    // Otherwise use logged in user profile
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
      const result = await generateAdvocacyMessage({
        billTitle: bill?.shortTitle || bill?.title || 'this legislation',
        billSummary: bill?.summaries?.summary?.text || 'This bill addresses important issues.',
        userStance: userStance.charAt(0).toUpperCase() + userStance.slice(1) as 'Support' | 'Oppose',
        tone: 'Formal',
        personalData: {
          fullName: selectedPersonalData.includes('fullName'),
          address: selectedPersonalData.includes('fullAddress'),
        }
      });
      setMessage(result);
    } catch(e) {
      console.error("Error generating message", e);
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
    if ((!user && !verifiedUserInfo) || !bill) return;
    
    try {
      // Import Firebase functions
      const { getFirestore, collection, addDoc, Timestamp } = await import('firebase/firestore');
      const { app } = await import('@/lib/firebase');
      const db = getFirestore(app);
      
      // Save message activity to Firestore
      const messageActivity = {
        userId: user?.uid || 'verified-' + Date.now(),
        isVerifiedUser: !!verifiedUserInfo,
        verifiedUserInfo: verifiedUserInfo ? {
          fullName: verifiedUserInfo.fullName,
          address: verifiedUserInfo.address,
          city: verifiedUserInfo.city,
          state: verifiedUserInfo.state,
          zipCode: verifiedUserInfo.zipCode
        } : null,
        billNumber: billNumber,
        billType: billType,
        congress: congress,
        billShortTitle: bill.shortTitle || bill.title || 'Unknown Bill',
        billCurrentStatus: bill.latestAction?.text || 'Status Unknown',
        userStance: userStance, // 'support' or 'oppose'
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
      
      await addDoc(collection(db, 'user_messages'), messageActivity);
      
      // If saveAsDefault is true, save the selected fields to user preferences
      if (saveAsDefault) {
        // TODO: Save selectedPersonalData to user preferences in Firebase
        console.log('Saving default preferences:', selectedPersonalData);
      }
      
      // Navigate to confirmation page with recipient count
      const recipientCount = selectedMembers.length;
      router.push(`/advocacy-message/confirmation?count=${recipientCount}`);
      
    } catch (error) {
      console.error('Error saving message:', error);
      // Still navigate to confirmation for now
      const recipientCount = selectedMembers.length;
      router.push(`/advocacy-message/confirmation?count=${recipientCount}`);
    }
  };

  // Step 1: Select Outreach
  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Select Outreach</CardTitle>
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

        <div className="flex justify-end">
          <Button 
            onClick={() => setStep(2)}
            disabled={selectedMembers.length === 0}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Step 2: Include Personal Information
  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Include Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Available fields */}
        {availableFields.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Available Information</h3>
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

        {/* Unavailable fields */}
        {unavailableFields.length > 0 && (
          <div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Some information is missing from your profile. 
                <Link href="/dashboard" className="ml-2 text-primary underline">
                  Update your profile
                </Link>
                {' '}to include:
                <ul className="mt-2 list-disc list-inside">
                  {unavailableFields.map(field => (
                    <li key={field.key} className="text-sm">{field.label}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

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

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button 
            onClick={() => setStep(3)}
            disabled={!message || !userStance}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Step 3: Review and Send
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
          <CardTitle>Step 3: Review and Send</CardTitle>
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
              <p className="mt-2">{personalDataFields.find(f => f.key === 'fullName')?.value || 'Your Name'}</p>
              {selectedPersonalFields.filter(f => f.key !== 'fullName').map(field => (
                <p key={field.key} className="text-sm text-muted-foreground">
                  {field.label}: {field.value}
                </p>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={handleSend}>
              Send Message
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

  // Show login prompt for unauthenticated users who are not verified
  if (!user && !verifiedUserInfo) {
    try {
      return <UnauthenticatedMessage />;
    } catch (error) {
      console.error('Error rendering unauthenticated message:', error);
      return (
        <div className="container mx-auto p-8 max-w-2xl">
          <Card>
            <CardContent className="p-8 text-center">
              <p>Please <Link href="/login" className="text-primary underline">login</Link> to continue.</p>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

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
            <StepLabel>Select Outreach</StepLabel>
          </Step>
          <Step active={step === 2}>
            <StepLabel>Include Personal Information</StepLabel>
          </Step>
          <Step active={step === 3}>
            <StepLabel>Review & Send</StepLabel>
          </Step>
        </Stepper>
      </div>

      {/* Step Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
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