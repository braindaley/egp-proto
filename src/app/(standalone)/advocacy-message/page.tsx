'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sparkles, Loader2, AlertCircle, User, Search, X, CheckCircle, Mail, Shield, UserPlus, Upload, File, Image, ChevronLeft, ChevronRight, Check, AtSign, Globe } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useZipCode } from '@/hooks/use-zip-code';
import { useMembersByZip } from '@/hooks/useMembersByZip';
import { SummaryDisplay } from '@/components/bill-summary-display';
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
  // Handle various member data structures
  const firstName = member?.firstName ||
                   member?.name?.split(' ')[0] ||
                   member?.directOrderName?.split(' ')[0] ||
                   member?.officialName?.split(' ')[0] ||
                   'member';
  const lastName = member?.lastName ||
                  member?.name?.split(' ').slice(-1)[0] ||
                  member?.directOrderName?.split(' ').slice(-1)[0] ||
                  member?.officialName?.split(' ').slice(-1)[0] ||
                  'congress';
  const bioguideId = member?.bioguideId || member?.id || Math.random().toString(36).substring(7);
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

interface VerificationMatch {
  id: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  constituentDescription?: string | null;
}


const AdvocacyMessageContent: React.FC = () => {
  const [step, setStep] = useState(1);
  const [bill, setBill] = useState<Bill | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [userStance, setUserStance] = useState<'support' | 'oppose' | ''>('');
  const [aiHelpChoice, setAiHelpChoice] = useState<'yes' | 'no' | ''>('');
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPersonalData, setSelectedPersonalData] = useState<string[]>([
    'fullName',
    'fullAddress',
    'birthYear',
    'gender',
    'politicalAffiliation',
    'education',
    'profession',
    'militaryService'
  ]);
  const [selectedPolicyIssues, setSelectedPolicyIssues] = useState<string[]>([]);
  const [targetMember, setTargetMember] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Verification state
  const [verificationStep, setVerificationStep] = useState<'initial' | 'selection' | 'manual'>('initial');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [matches, setMatches] = useState<VerificationMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [manualFirstName, setManualFirstName] = useState('');
  const [manualLastName, setManualLastName] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualState, setManualState] = useState('');
  const [manualZipCode, setManualZipCode] = useState('');
  const [constituentDescription, setConstituentDescription] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'egutenberg' | 'email_provider'>('egutenberg');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [bccEmails, setBccEmails] = useState<string[]>(['']);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);

  // Profile data form fields for missing user data
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileState, setProfileState] = useState('');
  const [profileZipCode, setProfileZipCode] = useState('');
  const [profileBirthYear, setProfileBirthYear] = useState('');
  const [profileGender, setProfileGender] = useState('');
  const [profilePoliticalAffiliation, setProfilePoliticalAffiliation] = useState('');
  const [profileEducation, setProfileEducation] = useState('');
  const [profileProfession, setProfileProfession] = useState('');
  const [profileMilitaryService, setProfileMilitaryService] = useState<boolean | null>(null);
  
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
  const { zipCode, saveZipCode } = useZipCode();
  const { representatives: congressionalReps } = useMembersByZip(zipCode);
  const router = useRouter();
  const searchParams = useSearchParams();

  const congress = searchParams.get('congress');
  const billType = searchParams.get('type');
  const billNumber = searchParams.get('number');
  const memberBioguideId = searchParams.get('member');
  const isVerified = searchParams.get('verified') === 'true';

  // Check if this is a member contact flow (not bill-specific)
  const isMemberContact = !!memberBioguideId && !billType && !billNumber;

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

  // Load user profile data when authenticated
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        const { getFirestore, doc, getDoc } = await import('firebase/firestore');
        const { app } = await import('@/lib/firebase');
        const db = getFirestore(app);
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Populate form fields with existing user data
          if (userData.firstName) setProfileFirstName(userData.firstName);
          if (userData.lastName) setProfileLastName(userData.lastName);
          if (userData.address) setProfileAddress(userData.address);
          if (userData.city) setProfileCity(userData.city);
          if (userData.state) setProfileState(userData.state);
          if (userData.zipCode) setProfileZipCode(userData.zipCode);
          if (userData.birthYear) setProfileBirthYear(userData.birthYear.toString());
          if (userData.gender) setProfileGender(userData.gender);
          if (userData.politicalAffiliation) setProfilePoliticalAffiliation(userData.politicalAffiliation);
          if (userData.education) setProfileEducation(userData.education);
          if (userData.profession) setProfileProfession(userData.profession);
          if (userData.militaryService !== undefined) setProfileMilitaryService(userData.militaryService);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
      }
    };

    loadUserProfile();
  }, [user]);

  // Member contact flow uses completely different step numbers
  const memberSteps = {
    policy: 1,      // Choose policy issues
    aiHelp: 2,      // AI help (optional)
    writeMessage: 3, // Write message
    personalInfo: 4, // Personal information
    review: 5,      // Review message
    sending: 6      // Sending screen
  };

  const billSteps = {
    position: 1,     // Choose position
    aiHelp: 2,       // AI help (optional)
    writeMessage: 3, // Write message
    uploadMedia: 4,  // Upload media (optional)
    selectReps: 5,   // Select representatives
    personalInfo: 6, // Personal information
    review: 7,       // Review message
    sending: 8       // Sending screen
  };

  // Get the current step number to display
  const getDisplayStep = (): number => {
    if (isMemberContact) {
      // Members: not logged in flow (1-8) vs logged in flow (1-6)
      if (!user) {
        // Not logged in flow: Verification → Policy → Write → Supporting Files → Personal → Review → Delivery → Success
        if (step === 1) return 1; // Help us verify that you are a registered voter
        if (step === 2) return 2; // Choose policy issue
        if (step === 4) return 3; // Write Your Message
        if (step === 5) return 4; // Add Supporting Files
        if (step === 7) return 5; // Personal Information
        if (step === 8) return 6; // Review Message
        if (step === 9) return 7; // Message delivery (choose email)
        if (step === 10) return 8; // Success screen (create account or login)
        return 0;
      } else {
        // Logged in flow - skip verification and delivery steps: Policy → Write → Supporting Files → Personal → Review → Success
        if (step === 2) return 1; // Choose policy issue
        if (step === 4) return 2; // Write Your Message
        if (step === 5) return 3; // Add Supporting Files
        if (step === 7) return 4; // Personal Information
        if (step === 8) return 5; // Review Message
        if (step === 10) return 6; // Success screen (view dashboard)
        return 0;
      }
    } else {
      // Bills/campaigns: not logged in flow (1-10) vs logged in flow (1-8)
      if (!user) {
        // Not logged in flow
        if (step === 1) return 1; // Help us verify that you are a registered voter
        if (step === 2) return 2; // Choose Your Position
        if (step === 3) return 3; // Writing Your Message - help writing?
        if (step === 4) return 4; // Write Your Message
        if (step === 5) return 5; // Add Supporting Files
        if (step === 6) return 6; // Select representatives to send your message
        if (step === 7) return 7; // Personal Information
        if (step === 8) return 8; // Review Message
        if (step === 9) return 9; // Message delivery (choose email)
        if (step === 10) return 10; // Success screen (create account or login)
        return 0;
      } else {
        // Logged in flow - skip verification and delivery steps
        if (step === 2) return 1; // Choose Your Position
        if (step === 3) return 2; // Writing Your Message - help writing?
        if (step === 4) return 3; // Write Your Message
        if (step === 5) return 4; // Add Supporting Files
        if (step === 6) return 5; // Select representatives to send your message
        if (step === 7) return 6; // Personal Information
        if (step === 8) return 7; // Review Message
        if (step === 10) return 8; // Success screen (view dashboard)
        return 0;
      }
    }
  };

  // Back navigation that handles both logged in and not logged in flows
  const goBack = () => {
    if (isMemberContact) {
      if (!user) {
        // Members not logged in flow: Verification → Policy → Write → Supporting Files → Personal → Review → Delivery → Success
        if (step === 1) return; // Can't go back from first step (verification)
        else if (step === 2) setStep(1); // Policy Issues → verification
        else if (step === 4) setStep(2); // Write Message → Policy Issues (skip AI Help step 3)
        else if (step === 5) setStep(4); // Supporting Files → Write Message
        else if (step === 7) setStep(5); // Personal Info → Supporting Files
        else if (step === 8) setStep(7); // Review → Personal Info
        else if (step === 9) setStep(8); // Delivery → Review
        else if (step === 10) setStep(9); // Success → Delivery
        else if (step === 12) setStep(8); // Sending Error → Review
      } else {
        // Members logged in flow: Policy → Write → Supporting Files → Personal → Review → Success (skip verification step 1 and delivery step 9)
        if (step === 2) return; // Can't go back from first step (Policy Issues)
        else if (step === 4) setStep(2); // Write Message → Policy Issues (skip AI Help step 3)
        else if (step === 5) setStep(4); // Supporting Files → Write Message
        else if (step === 7) setStep(5); // Personal Info → Supporting Files
        else if (step === 8) setStep(7); // Review → Personal Info
        else if (step === 10) setStep(8); // Success → Review
        else if (step === 12) setStep(8); // Sending Error → Review
      }
    } else {
      if (!user) {
        // Bills/campaigns not logged in flow
        if (step === 1) return; // Can't go back from first step (verification)
        else if (step === 2) setStep(1); // Position → verification
        else if (step === 3) setStep(2); // AI Help → Position
        else if (step === 4) setStep(3); // Write Message → AI Help
        else if (step === 5) setStep(4); // Supporting Files → Write Message
        else if (step === 6) setStep(5); // Select Representatives → Supporting Files
        else if (step === 7) setStep(6); // Personal Info → Select Representatives
        else if (step === 8) setStep(7); // Review → Personal Info
        else if (step === 9) setStep(8); // Delivery → Review
        else if (step === 10) setStep(9); // Success → Delivery
        else if (step === 12) setStep(8); // Sending Error → Review
      } else {
        // Bills/campaigns logged in flow (skip verification step 1 and delivery step 9)
        if (step === 2) return; // Can't go back from first step (Position)
        else if (step === 3) setStep(2); // AI Help → Position
        else if (step === 4) setStep(3); // Write Message → AI Help
        else if (step === 5) setStep(4); // Supporting Files → Write Message
        else if (step === 6) setStep(5); // Select Representatives → Supporting Files
        else if (step === 7) setStep(6); // Personal Info → Select Representatives
        else if (step === 8) setStep(7); // Review → Personal Info
        else if (step === 10) setStep(8); // Success → Review
        else if (step === 12) setStep(8); // Sending Error → Review
      }
    }
  };

  // Skip verification step for logged-in users
  useEffect(() => {
    // Only set initial step if user is logged in, not loading, and currently on step 1
    if (user && !loading && step === 1 && !isVerified) {
      setStep(2);
    }
  }, [user, loading, step, isVerified]);

  // Fetch bill details
  useEffect(() => {
    if (congress && billType && billNumber) {
      getBillDetails(congress, billType, billNumber).then(setBill);
    }
  }, [congress, billType, billNumber]);

  // Fetch member details for member contact flow
  useEffect(() => {
    const fetchMember = async () => {
      if (!isMemberContact || !memberBioguideId) return;

      try {
        const response = await fetch(`/api/congress/member/${memberBioguideId}`);
        if (response.ok) {
          const memberData = await response.json();
          const memberWithEmail = {
            ...memberData,
            email: generateMemberEmail(memberData)
          };
          setTargetMember(memberWithEmail);
          setSelectedMembers([memberWithEmail]);
        }
      } catch (error) {
        console.error('Failed to fetch member details:', error);
      }
    };

    fetchMember();
  }, [isMemberContact, memberBioguideId]);

  // Prepare available members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!bill || isMemberContact) return;

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

      // Preselect congressional representatives
      if (repsWithEmails.length > 0) {
        setSelectedMembers(prev => {
          // Only add reps that aren't already selected
          const newReps = repsWithEmails.filter(rep =>
            !prev.some(selected => selected.bioguideId === rep.bioguideId)
          );
          return [...prev, ...newReps];
        });
      }
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
        { key: 'birthYear', label: 'Birth Year', value: '1990', available: true },
        { key: 'gender', label: 'Gender', value: 'Prefer not to say', available: true },
        { key: 'politicalAffiliation', label: 'Political Affiliation', value: 'Independent', available: true },
        { key: 'education', label: 'Education', value: 'Bachelor\'s Degree', available: true },
        { key: 'profession', label: 'Profession', value: 'Professional', available: true },
        { key: 'militaryService', label: 'Military Service', value: 'No', available: true },
      ];
    }
    
    // Use logged in user profile if available, combining saved data with current form state
    if (user) {
      // Combine profile form state with any existing user data
      const currentFirstName = profileFirstName || user?.firstName || '';
      const currentLastName = profileLastName || user?.lastName || '';
      const currentAddress = profileAddress || user?.address || '';
      const currentCity = profileCity || user?.city || '';
      const currentState = profileState || user?.state || '';
      const currentZipCode = profileZipCode || user?.zipCode || '';
      const currentBirthYear = profileBirthYear || user?.birthYear?.toString() || '';
      const currentGender = profileGender || user?.gender || '';
      const currentPoliticalAffiliation = profilePoliticalAffiliation || user?.politicalAffiliation || '';
      const currentEducation = profileEducation || user?.education || '';
      const currentProfession = profileProfession || user?.profession || '';
      const currentMilitaryService = profileMilitaryService !== null ? profileMilitaryService : user?.militaryService;
      
      const addressParts = [currentAddress, currentCity, currentState, currentZipCode].filter(Boolean);
      const addressValue = addressParts.join(', ');
      const addressAvailable = addressParts.length > 0;
      
      return [
        { key: 'fullName', label: 'Full Name', value: `${currentFirstName} ${currentLastName}`.trim() || 'John Doe', available: true },
        { key: 'fullAddress', label: 'Full Address', value: addressValue || '123 Main St, Springfield, IL 62701', available: true },
        { key: 'birthYear', label: 'Birth Year', value: currentBirthYear || '1990', available: true },
        { key: 'gender', label: 'Gender', value: currentGender || 'Prefer not to say', available: true },
        { key: 'politicalAffiliation', label: 'Political Affiliation', value: currentPoliticalAffiliation || 'Independent', available: true },
        { key: 'education', label: 'Education', value: currentEducation || 'Bachelor\'s Degree', available: true },
        { key: 'profession', label: 'Profession', value: currentProfession || 'Professional', available: true },
        { key: 'militaryService', label: 'Military Service', value: currentMilitaryService !== undefined ? (currentMilitaryService ? 'Yes' : 'No') : 'No', available: true },
      ];
    }
    
    // For anonymous users, return available fields with default values
    return [
      { key: 'fullName', label: 'Full Name', value: 'John Doe', available: true },
      { key: 'fullAddress', label: 'Full Address', value: '123 Main St, Springfield, IL 62701', available: true },
      { key: 'birthYear', label: 'Birth Year', value: '1990', available: true },
      { key: 'gender', label: 'Gender', value: 'Prefer not to say', available: true },
      { key: 'politicalAffiliation', label: 'Political Affiliation', value: 'Independent', available: true },
      { key: 'education', label: 'Education', value: 'Bachelor\'s Degree', available: true },
      { key: 'profession', label: 'Profession', value: 'Professional', available: true },
      { key: 'militaryService', label: 'Military Service', value: 'No', available: true },
    ];
  };

  const personalDataFields = useMemo(() => getPersonalDataFields(), [
    user,
    verifiedUserInfo,
    profileFirstName,
    profileLastName,
    profileAddress,
    profileCity,
    profileState,
    profileZipCode,
    profileBirthYear,
    profileGender,
    profilePoliticalAffiliation,
    profileEducation,
    profileProfession,
    profileMilitaryService
  ]);
  const availableFields = personalDataFields.filter(f => f.available);
  const unavailableFields = personalDataFields.filter(f => !f.available);

  // Save profile data function
  const saveProfileData = async () => {
    if (!user) return;

    try {
      const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
      const { app } = await import('@/lib/firebase');
      const db = getFirestore(app);
      
      const updates: any = {};
      
      // Only update fields that have values
      if (profileFirstName.trim()) updates.firstName = profileFirstName.trim();
      if (profileLastName.trim()) updates.lastName = profileLastName.trim();
      if (profileAddress.trim()) updates.address = profileAddress.trim();
      if (profileCity.trim()) updates.city = profileCity.trim();
      if (profileState.trim()) updates.state = profileState.trim();
      if (profileZipCode.trim()) updates.zipCode = profileZipCode.trim();
      if (profileBirthYear.trim()) {
        const year = parseInt(profileBirthYear.trim());
        if (!isNaN(year) && year >= 1900 && year <= new Date().getFullYear()) {
          updates.birthYear = year;
        }
      }
      if (profileGender.trim()) updates.gender = profileGender.trim();
      if (profilePoliticalAffiliation.trim()) updates.politicalAffiliation = profilePoliticalAffiliation.trim();
      if (profileEducation.trim()) updates.education = profileEducation.trim();
      if (profileProfession.trim()) updates.profession = profileProfession.trim();
      if (profileMilitaryService !== null) updates.militaryService = profileMilitaryService;
      
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date().toISOString();
        await updateDoc(doc(db, 'users', user.uid), updates);
        console.log('Profile data saved successfully');
      }
    } catch (error) {
      console.error('Error saving profile data:', error);
    }
  };

  // Address autocomplete functionality
  const searchAddresses = (query: string) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    // Determine location based on user's zip code for more realistic suggestions
    let city = 'Springfield';
    let state = 'IL';
    let suggestedZips = ['62701', '62702', '62703', '62704', '62705'];

    if (zipCode && zipCode.startsWith('927')) {
      // California - Orange County area
      city = 'Fountain Valley';
      state = 'CA';
      suggestedZips = ['92708', '92706', '92707', '92704', '92705'];
    }

    // Mock address suggestions - in real implementation, this would call Google Places API
    const mockSuggestions = suggestedZips.map((zip, index) => {
      const streets = ['Main St', 'Oak Ave', 'Elm St', 'Pine St', 'Maple Dr'];
      return `${query} ${streets[index]}, ${city}, ${state} ${zip}`;
    });

    setAddressSuggestions(mockSuggestions);
    setShowAddressSuggestions(true);
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    searchAddresses(value);
  };

  const selectAddressSuggestion = (suggestion: string) => {
    setAddress(suggestion);
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
  };

  // Verification functions
  const handleVerificationSubmit = async () => {
    setVerificationError('');
    
    if (!firstName || !lastName || !address) {
      setVerificationError('Please fill in all fields');
      return;
    }

    if (firstName.length < 2) {
      setVerificationError('Please enter your full first name');
      return;
    }

    if (lastName.length < 2) {
      setVerificationError('Please enter your full last name');
      return;
    }

    if (address.length < 10) {
      setVerificationError('Please enter a complete address');
      return;
    }
    
    setIsVerifying(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Extract zip code from address for mock data
      const zipMatch = address.match(/\d{5}(?:-\d{4})?/);
      const extractedZip = zipMatch ? zipMatch[0] : '12345';

      // Determine city/state based on zip code
      let mockCity = 'Springfield';
      let mockState = 'IL';
      if (extractedZip && extractedZip.startsWith('927')) {
        mockCity = 'Fountain Valley';
        mockState = 'CA';
      }

      const mockMatches: VerificationMatch[] = [
        {
          id: '1',
          fullName: `${firstName} ${lastName}`,
          address: address,
          city: mockCity,
          state: mockState,
          zipCode: extractedZip
        },
        {
          id: '2',
          fullName: `${firstName} ${lastName}`,
          address: address.replace(/\d+/, (match) => String(parseInt(match) + 100)),
          city: mockCity,
          state: mockState,
          zipCode: extractedZip
        }
      ];
      
      setMatches(mockMatches);
      setVerificationStep('selection');
    } catch (err) {
      setVerificationError('Unable to verify identity. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleMatchSelection = () => {
    const selected = matches.find(m => m.id === selectedMatch);
    if (selected) {
      // Add constituent description to verified user info if provided
      const verifiedInfo = {
        ...selected,
        constituentDescription: constituentDescription || null
      };
      setVerifiedUserInfo(verifiedInfo);
      // Save the zip code to the useZipCode hook for member lookup
      saveZipCode(selected.zipCode);
      // Reset verification form
      setVerificationStep('initial');
      setFirstName('');
      setLastName('');
      setAddress('');
      setMatches([]);
      setSelectedMatch('');
    }
  };

  const handleManualSubmit = () => {
    setVerificationError('');
    
    if (!manualFirstName || !manualLastName || !manualAddress || 
        !manualCity || !manualState || !manualZipCode) {
      setVerificationError('Please fill in all fields');
      return;
    }
    
    const manualInfo: VerificationMatch = {
      id: 'manual',
      fullName: `${manualFirstName} ${manualLastName}`,
      address: manualAddress,
      city: manualCity,
      state: manualState,
      zipCode: manualZipCode,
      constituentDescription: constituentDescription || null
    };
    
    setVerifiedUserInfo(manualInfo);
    // Save the zip code to the useZipCode hook for member lookup
    saveZipCode(manualZipCode);
    // Reset verification form
    setVerificationStep('initial');
    setManualFirstName('');
    setManualLastName('');
    setManualAddress('');
    setManualCity('');
    setManualState('');
    setManualZipCode('');
  };

  const handleVerificationReset = () => {
    setVerificationStep('initial');
    setFirstName('');
    setLastName('');
    setAddress('');
    setMatches([]);
    setSelectedMatch('');
    setVerificationError('');
  };

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
          name: member.directOrderName || member.fullName || member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown',
          bioguideId: member.bioguideId || '',
          email: member.email || '',
          party: member.party || member.partyName || '',
          role: member.officeTitle?.toLowerCase().includes('senate') ||
                member.chamber?.toLowerCase() === 'senate' ||
                member.url?.includes('/senate/') ||
                member.terms?.some((term: any) => term.chamber?.toLowerCase() === 'senate') ? 'Senator' : 'Representative'
        })),
        personalDataIncluded: selectedPersonalData,
        constituentDescription: constituentDescription || null,
        deliveryMethod: deliveryMethod,
        notificationEmail: notificationEmail || null,
        bccEmails: bccEmails.filter(email => email.trim() !== ''),
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
          zipCode: verifiedUserInfo.zipCode,
          constituentDescription: verifiedUserInfo.constituentDescription || null
        };
      }

      // For logged-in users (not verified), save their personal data from personalDataFields
      if (user && !verifiedUserInfo) {
        const selectedFieldsData: any = {};
        selectedPersonalData.forEach(fieldKey => {
          const field = personalDataFields.find(f => f.key === fieldKey);
          if (field && field.available) {
            selectedFieldsData[fieldKey] = field.value;
          }
        });

        // Create userInfo object for logged-in members
        if (Object.keys(selectedFieldsData).length > 0) {
          messageActivity.userInfo = selectedFieldsData;
        }
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
        messageActivity.topic = isMemberContact && targetMember
          ? selectedPolicyIssues.length > 0
            ? `${selectedPolicyIssues.join(', ')} - ${targetMember.directOrderName || targetMember.fullName || targetMember.name || 'Representative'}`
            : `Member Contact: ${targetMember.directOrderName || targetMember.fullName || targetMember.name || 'Representative'}`
          : 'General Advocacy';
      }
      
      const docRef = await addDoc(collection(db, 'user_messages'), messageActivity);
      
      // Store the message ID in sessionStorage for potential account linking
      if (!user && verifiedUserInfo) {
        sessionStorage.setItem('pendingMessageId', docRef.id);
        sessionStorage.setItem('pendingMessageData', JSON.stringify({
          messageId: docRef.id,
          verifiedUserInfo,
          constituentDescription,
          billInfo: {
            congress,
            billType,
            billNumber,
            title: bill?.shortTitle || bill?.title
          }
        }));
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
    <Card className="flex-1 flex flex-col">
      <CardHeader>
        {getDisplayStep() > 0 && (
          <div className="text-sm font-medium text-muted-foreground mb-2">Step {getDisplayStep()}</div>
        )}
        <CardTitle>Select representatives to send your message</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          We've preselected your congressional representatives to make the most impact
        </p>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col">
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

        <div className="flex-1"></div>
        <div className="flex justify-between mt-auto pt-6">
          <Button variant="outline" onClick={goBack}>
            Back
          </Button>
          <Button
            onClick={() => setStep(7)}
            disabled={selectedMembers.length === 0}
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Step 1: Choose Your Position
  const renderStep1_Position = () => (
    <Card className="flex-1 flex flex-col m-0 md:m-auto border-0 md:border rounded-none md:rounded-lg overflow-hidden bg-background">
      <CardHeader className="bg-background">
        {getDisplayStep() > 0 && (
          <div className="text-sm font-medium text-muted-foreground mb-2">Step {getDisplayStep()}</div>
        )}
        <CardTitle>
          {bill ? (
            `Choose Your Position on ${billType?.toUpperCase()}${billNumber}`
          ) : (
            'Choose Your Position'
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          First, let us know whether you support or oppose this legislation. This helps us understand your viewpoint.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col bg-background">
        <div>
          <h3 className="font-semibold mb-4 text-lg">Do you support or oppose this bill?</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant={userStance === 'support' ? 'default' : 'outline'}
              onClick={() => setUserStance('support')}
              size="lg"
              className="flex-1 flex-col"
              style={{paddingTop: '24px', paddingBottom: '24px', minHeight: '100px'}}
            >
              <svg className="mb-1" style={{width: '24px', height: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <div className="text-center">
                <div className="font-semibold">Support</div>
                <div className="text-sm opacity-75">I am in favor of this bill</div>
              </div>
            </Button>
            <Button
              variant={userStance === 'oppose' ? 'destructive' : 'outline'}
              onClick={() => setUserStance('oppose')}
              size="lg"
              className="flex-1 flex-col"
              style={{paddingTop: '24px', paddingBottom: '24px', minHeight: '100px'}}
            >
              <svg className="mb-1" style={{width: '24px', height: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .904-.405.904-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
              <div className="text-center">
                <div className="font-semibold">Oppose</div>
                <div className="text-sm opacity-75">I am against this bill</div>
              </div>
            </Button>
          </div>
        </div>

        <div className="flex-1"></div>
        <div className="flex justify-between mt-auto pt-6">
          <Button
            onClick={goBack}
            variant="outline"
            size="lg"
          >
            Back
          </Button>
          <Button
            onClick={() => setStep(3)}
            disabled={!userStance}
            size="lg"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Step 2: Policy Issues (for member contact flow)
  const renderStep2_PolicyIssues = () => {
    const policyIssues = [
      'Climate, Energy and Environment',
      'Economy and Work',
      'Education',
      'Healthcare',
      'Immigration and Migration',
      'Criminal Justice',
      'Housing',
      'Social Security and Medicare',
      'Privacy Rights',
      'Free Speech and Press',
      'Religion and Government',
      'Other'
    ];

    return (
      <Card className="flex-1 flex flex-col m-0 md:m-auto border-0 md:border rounded-none md:rounded-lg overflow-hidden bg-background">
        <CardHeader className="bg-background">
          {getDisplayStep() > 0 && (
          <div className="text-sm font-medium text-muted-foreground mb-2">Step {getDisplayStep()}</div>
        )}
          <CardTitle>Choose Policy Issues</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Select the policy areas you'd like to discuss with {targetMember?.directOrderName || 'this member'}.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 flex-1 flex flex-col bg-background">
          <div>
            <h3 className="font-semibold mb-4 text-lg">What issues would you like to address?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {policyIssues.map((issue) => (
                <div key={issue} className="flex items-center space-x-2">
                  <Checkbox
                    id={issue}
                    checked={selectedPolicyIssues.includes(issue)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPolicyIssues([...selectedPolicyIssues, issue]);
                      } else {
                        setSelectedPolicyIssues(selectedPolicyIssues.filter(i => i !== issue));
                      }
                    }}
                  />
                  <Label htmlFor={issue} className="text-sm">{issue}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto pt-4">
            <Button
              onClick={() => setStep(4)} // Skip AI help step (3) and go directly to write message (4)
              disabled={selectedPolicyIssues.length === 0}
              size="lg"
            >
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Step 2: Get Help Writing (Optional)
  const renderStep2_AIHelp = () => (
    <Card className="flex-1 flex flex-col m-0 md:m-auto border-0 md:border rounded-none md:rounded-lg overflow-hidden bg-background">
      <CardHeader className="bg-background">
        {getDisplayStep() > 0 && (
          <div className="text-sm font-medium text-muted-foreground mb-2">Step {getDisplayStep()}</div>
        )}
        <CardTitle>Writing Your Message</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Would you like us to personalize your letter using relevant details from your profile?
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Personalized letters stand out and convey real impact to your recipients
        </p>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col bg-background">
        <div>
          <h3 className="font-semibold mb-4 text-lg">Would you like help writing your message?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={aiHelpChoice === 'yes' ? 'default' : 'outline'}
              onClick={() => {
                setAiHelpChoice('yes');
              }}
              disabled={isGenerating}
              size="lg"
              className="flex-1 flex-col"
              style={{paddingTop: '24px', paddingBottom: '24px', minHeight: '100px'}}
            >
              <svg className="mb-1" style={{width: '24px', height: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <div className="text-center">
                <div className="font-semibold">
                  {isGenerating ? 'Creating...' : 'Yes'}
                </div>
                <div className="text-sm opacity-75">Help write my message</div>
              </div>
            </Button>
            <Button
              variant={aiHelpChoice === 'no' ? 'default' : 'outline'}
              onClick={() => {
                setAiHelpChoice('no');
              }}
              size="lg"
              className="flex-1 flex-col"
              style={{paddingTop: '24px', paddingBottom: '24px', minHeight: '100px'}}
            >
              <svg className="mb-1" style={{width: '24px', height: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .904-.405.904-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
              <div className="text-center">
                <div className="font-semibold">No</div>
                <div className="text-sm opacity-75">I will write my own message</div>
              </div>
            </Button>
          </div>
        </div>

        <div className="flex-1"></div>
        <div className="flex justify-between mt-auto pt-6">
          <Button
            onClick={goBack}
            variant="outline"
            size="lg"
          >
            Back
          </Button>
          <Button
            onClick={() => {
              if (aiHelpChoice === 'yes') {
                generateAITemplate();
              }
              setStep(4);
            }}
            disabled={!aiHelpChoice}
            size="lg"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Step 3: Write Your Message
  const renderStep3_WriteMessage = () => (
    <Card className="flex-1 flex flex-col border-0 md:border rounded-none md:rounded-lg overflow-hidden bg-background">
      <CardHeader className="bg-background">
        {getDisplayStep() > 0 && (
          <div className="text-sm font-medium text-muted-foreground mb-2">Step {getDisplayStep()}</div>
        )}
        <CardTitle>Write Your Message</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col bg-background">
        <p className="text-sm text-muted-foreground">
          {message ? 'Review and edit your message below. You can make any changes you like.' : 'Write your message to send to your elected officials.'}
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here. Tell your elected officials why this bill matters to you..."
              className="resize-none text-base min-h-[350px] mt-1"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Tip: Personal stories and specific examples make your message more impactful.
            </p>
          </div>
        </div>

        <div className="flex-1"></div>
        <div className="flex justify-between mt-auto pt-6">
          <Button
            onClick={goBack}
            variant="outline"
            size="lg"
          >
            Back
          </Button>
          <Button
            onClick={() => {
              if (isMemberContact) {
                setStep(5); // Go to supporting files for member contact
              } else {
                setStep(5); // Go to upload media for regular flow
              }
            }}
            disabled={!message}
            size="lg"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Step 4: Add Supporting Files (Optional)
  const renderStep4_UploadMedia = () => (
    <Card className="flex-1 flex flex-col m-0 md:m-auto border-0 md:border rounded-none md:rounded-lg overflow-hidden bg-background">
      <CardHeader className="bg-background">
        {getDisplayStep() > 0 && (
          <div className="text-sm font-medium text-muted-foreground mb-2">Step {getDisplayStep()}</div>
        )}
        <CardTitle>Add Supporting Files (Optional)</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          You can attach photos, documents, or other files to support your message. This step is completely optional.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col bg-background">
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
          <div className="text-center space-y-4">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h4 className="text-lg font-medium">Upload Supporting Files</h4>
              <p className="text-sm text-muted-foreground">
                Add photos, documents, or other files to strengthen your message
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Accepted formats: Images, PDFs, Word documents, and text files
              </p>
            </div>
            <div>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setUploadedFiles(prev => [...prev, ...files]);
                }}
                className="hidden"
                id="media-upload"
              />
              <Label htmlFor="media-upload" className="cursor-pointer">
                <Button variant="outline" type="button" size="lg">
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Files
                </Button>
              </Label>
            </div>
          </div>

          {/* Uploaded Files Display */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium">Uploaded Files:</p>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-3">
                    {file.type.startsWith('image/') ? (
                      <Image className="h-5 w-5 text-blue-500" />
                    ) : (
                      <File className="h-5 w-5 text-gray-500" />
                    )}
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1"></div>
        <div className="flex justify-between mt-auto pt-6">
          <Button
            onClick={goBack}
            variant="outline"
            size="lg"
          >
            Back
          </Button>
          <Button
            onClick={() => {
              if (isMemberContact) {
                setStep(7); // Go to personal info for member contact (skip select outreach)
              } else {
                setStep(6); // Go to select outreach for bills flow
              }
            }}
            size="lg"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Step 1: Help us verify that you are a registered voter
  const renderRoutingStep = () => {
    // Always show verification step, even for logged-in users
    return (
      <Card className="flex-1 flex flex-col m-0 md:m-auto border-0 md:border rounded-none md:rounded-lg overflow-hidden bg-background">
        <CardHeader className="bg-background">
          {!user && (
            <div className="text-sm font-medium text-muted-foreground mb-2">Step 1</div>
          )}
          <CardTitle>Help us verify that you are a registered voter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 flex-1 flex flex-col">
          <p className="text-sm text-muted-foreground">
            <strong>Verification = Impact</strong><br/><br/>
We verify your voter registration to ensure your messages are taken seriously by policymakers. Verified info also allows us to autofill your profile and personalize your letters with relevant demographic insights, giving your voice more weight.
          </p>
          
          {verificationStep === 'initial' && (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Smith"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="relative">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Start typing your address..."
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onFocus={() => address.length >= 3 && setShowAddressSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 150)}
                    className="mt-1"
                  />
                  {showAddressSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {addressSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                          onMouseDown={() => selectAddressSuggestion(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Start typing your address to see suggestions
                  </p>
                </div>
              </div>
              
              <div className="flex-1"></div>
              <div className="flex justify-between items-center mt-auto pt-6">
                <Button variant="ghost" onClick={() => router.push('/login')}>
                  Already have an account? Login
                </Button>
                <Button
                  onClick={handleVerificationSubmit}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </>
          )}
          
          {verificationStep === 'selection' && (
            <>
              <div>
                <h4 className="font-semibold mb-3">Select Your Record</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  We found the following possible matches. Please select your record to continue.
                </p>
              </div>
              
              <RadioGroup value={selectedMatch} onValueChange={setSelectedMatch}>
                {matches.map((match) => (
                  <div key={match.id} className="bg-background border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <RadioGroupItem value={match.id} className="mt-1" />
                      <div className="flex-1">
                        <p className="font-medium">{match.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {match.address}, {match.city}, {match.state} {match.zipCode}
                        </p>
                      </div>
                    </label>
                  </div>
                ))}
              </RadioGroup>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">Not Listed?</p>
                  <p>If you don't see yourself, click "Not Me" to enter your full details instead.</p>
                </AlertDescription>
              </Alert>
              
              <div className="flex-1"></div>
              <div className="flex justify-between mt-auto pt-6">
                <Button variant="ghost" onClick={handleVerificationReset}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setVerificationStep('manual')}
                  >
                    Not Me
                  </Button>
                  <Button
                    onClick={() => {
                      handleMatchSelection();
                      setStep(2); // Go to choose position after verification
                    }}
                    disabled={!selectedMatch}
                  >
                    Confirm Selection
                  </Button>
                </div>
              </div>
            </>
          )}
          
          {verificationStep === 'manual' && (
            <>
              <div>
                <h4 className="font-semibold mb-3">Enter Your Information</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Please enter your full details to ensure your message is delivered to your representatives.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={manualFirstName}
                      onChange={(e) => setManualFirstName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Smith"
                      value={manualLastName}
                      onChange={(e) => setManualLastName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main St"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Springfield"
                      value={manualCity}
                      onChange={(e) => setManualCity(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="IL"
                      maxLength={2}
                      value={manualState}
                      onChange={(e) => setManualState(e.target.value.toUpperCase())}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="manualZip">ZIP Code</Label>
                    <Input
                      id="manualZip"
                      placeholder="12345"
                      maxLength={5}
                      value={manualZipCode}
                      onChange={(e) => setManualZipCode(e.target.value.replace(/\D/g, ''))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  If our records don't show every variation of your name and address, you can still confirm your information manually to ensure your message is delivered.
                </AlertDescription>
              </Alert>
              
              <div className="flex-1"></div>
              <div className="flex justify-between mt-auto pt-6">
                <Button variant="ghost" onClick={() => setVerificationStep('selection')}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Matches
                </Button>
                
                <Button onClick={() => {
                  handleManualSubmit();
                  setStep(2); // Go to choose position after verification
                }}>
                  Verify & Continue
                </Button>
              </div>
            </>
          )}
          
          {verificationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{verificationError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  // Step 4: Personal Information
  const renderPersonalInfoStep = () => {
    // Helper function to handle field input changes and auto-save
    const handleFieldChange = async (fieldKey: string, value: string) => {
      switch (fieldKey) {
        case 'firstName':
          setProfileFirstName(value);
          if (value.trim() && user) {
            // Auto-save and include in selection
            try {
              const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
              const { app } = await import('@/lib/firebase');
              const db = getFirestore(app);
              await updateDoc(doc(db, 'users', user.uid), { firstName: value.trim() });
              if (!selectedPersonalData.includes('fullName')) {
                setSelectedPersonalData(prev => [...prev, 'fullName']);
              }
            } catch (error) {
              console.error('Error saving first name:', error);
            }
          }
          break;
        case 'lastName':
          setProfileLastName(value);
          if (value.trim() && user) {
            try {
              const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
              const { app } = await import('@/lib/firebase');
              const db = getFirestore(app);
              await updateDoc(doc(db, 'users', user.uid), { lastName: value.trim() });
              if (!selectedPersonalData.includes('fullName')) {
                setSelectedPersonalData(prev => [...prev, 'fullName']);
              }
            } catch (error) {
              console.error('Error saving last name:', error);
            }
          }
          break;
        case 'address':
          setProfileAddress(value);
          if (value.trim() && user) {
            try {
              const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
              const { app } = await import('@/lib/firebase');
              const db = getFirestore(app);
              await updateDoc(doc(db, 'users', user.uid), { address: value.trim() });
              if (!selectedPersonalData.includes('fullAddress')) {
                setSelectedPersonalData(prev => [...prev, 'fullAddress']);
              }
            } catch (error) {
              console.error('Error saving address:', error);
            }
          }
          break;
        case 'city':
          setProfileCity(value);
          if (value.trim() && user) {
            try {
              const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
              const { app } = await import('@/lib/firebase');
              const db = getFirestore(app);
              await updateDoc(doc(db, 'users', user.uid), { city: value.trim() });
              if (!selectedPersonalData.includes('fullAddress')) {
                setSelectedPersonalData(prev => [...prev, 'fullAddress']);
              }
            } catch (error) {
              console.error('Error saving city:', error);
            }
          }
          break;
        case 'state':
          setProfileState(value);
          if (value.trim() && user) {
            try {
              const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
              const { app } = await import('@/lib/firebase');
              const db = getFirestore(app);
              await updateDoc(doc(db, 'users', user.uid), { state: value.trim() });
              if (!selectedPersonalData.includes('fullAddress')) {
                setSelectedPersonalData(prev => [...prev, 'fullAddress']);
              }
            } catch (error) {
              console.error('Error saving state:', error);
            }
          }
          break;
        case 'zipCode':
          setProfileZipCode(value);
          if (value.trim() && user) {
            try {
              const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
              const { app } = await import('@/lib/firebase');
              const db = getFirestore(app);
              await updateDoc(doc(db, 'users', user.uid), { zipCode: value.trim() });
              if (!selectedPersonalData.includes('fullAddress')) {
                setSelectedPersonalData(prev => [...prev, 'fullAddress']);
              }
            } catch (error) {
              console.error('Error saving zip code:', error);
            }
          }
          break;
        case 'birthYear':
          setProfileBirthYear(value);
          if (value.trim() && user) {
            const year = parseInt(value.trim());
            if (year >= 1900 && year <= new Date().getFullYear()) {
              try {
                const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
                const { app } = await import('@/lib/firebase');
                const db = getFirestore(app);
                await updateDoc(doc(db, 'users', user.uid), { birthYear: year });
                if (!selectedPersonalData.includes('birthYear')) {
                  setSelectedPersonalData(prev => [...prev, 'birthYear']);
                }
              } catch (error) {
                console.error('Error saving birth year:', error);
              }
            }
          }
          break;
        case 'gender':
          setProfileGender(value);
          if (value.trim() && user) {
            try {
              const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
              const { app } = await import('@/lib/firebase');
              const db = getFirestore(app);
              await updateDoc(doc(db, 'users', user.uid), { gender: value.trim() });
              if (!selectedPersonalData.includes('gender')) {
                setSelectedPersonalData(prev => [...prev, 'gender']);
              }
            } catch (error) {
              console.error('Error saving gender:', error);
            }
          }
          break;
        case 'politicalAffiliation':
          setProfilePoliticalAffiliation(value);
          if (value.trim() && user) {
            try {
              const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
              const { app } = await import('@/lib/firebase');
              const db = getFirestore(app);
              await updateDoc(doc(db, 'users', user.uid), { politicalAffiliation: value.trim() });
              if (!selectedPersonalData.includes('politicalAffiliation')) {
                setSelectedPersonalData(prev => [...prev, 'politicalAffiliation']);
              }
            } catch (error) {
              console.error('Error saving political affiliation:', error);
            }
          }
          break;
        case 'education':
          setProfileEducation(value);
          if (value.trim() && user) {
            try {
              const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
              const { app } = await import('@/lib/firebase');
              const db = getFirestore(app);
              await updateDoc(doc(db, 'users', user.uid), { education: value.trim() });
              if (!selectedPersonalData.includes('education')) {
                setSelectedPersonalData(prev => [...prev, 'education']);
              }
            } catch (error) {
              console.error('Error saving education:', error);
            }
          }
          break;
        case 'profession':
          setProfileProfession(value);
          if (value.trim() && user) {
            try {
              const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
              const { app } = await import('@/lib/firebase');
              const db = getFirestore(app);
              await updateDoc(doc(db, 'users', user.uid), { profession: value.trim() });
              if (!selectedPersonalData.includes('profession')) {
                setSelectedPersonalData(prev => [...prev, 'profession']);
              }
            } catch (error) {
              console.error('Error saving profession:', error);
            }
          }
          break;
      }
    };

    const handleMilitaryServiceChange = async (value: boolean | null) => {
      setProfileMilitaryService(value);
      if (value !== null && user) {
        try {
          const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
          const { app } = await import('@/lib/firebase');
          const db = getFirestore(app);
          await updateDoc(doc(db, 'users', user.uid), { militaryService: value });
          if (!selectedPersonalData.includes('militaryService')) {
            setSelectedPersonalData(prev => [...prev, 'militaryService']);
          }
        } catch (error) {
          console.error('Error saving military service:', error);
        }
      }
    };

    return (
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          {getDisplayStep() > 0 && (
            <div className="text-sm font-medium text-muted-foreground mb-2">Step {getDisplayStep()}</div>
          )}
          <CardTitle>Personal Information</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Select information you'd like to include about yourself
          </p>
        </CardHeader>
        <CardContent className="space-y-6 flex-1 flex flex-col">
          {/* Unified Personal Information Section */}
          {(user || verifiedUserInfo) && (
            <div>
              <div className="space-y-4">
                
                {/* Full Name */}
                <div>
                  {personalDataFields.find(f => f.key === 'fullName')?.available ? (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedPersonalData.includes('fullName')}
                        onCheckedChange={() => togglePersonalData('fullName')}
                      />
                      <Label className="cursor-pointer">
                        <span>Full Name</span>
                        <span className="text-sm text-muted-foreground ml-2">({personalDataFields.find(f => f.key === 'fullName')?.value})</span>
                      </Label>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="profile-first-name" className="text-sm font-medium">
                          First Name
                        </Label>
                        <input
                          id="profile-first-name"
                          type="text"
                          value={profileFirstName}
                          onChange={(e) => handleFieldChange('firstName', e.target.value)}
                          placeholder="Enter your first name"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="profile-last-name" className="text-sm font-medium">
                          Last Name
                        </Label>
                        <input
                          id="profile-last-name"
                          type="text"
                          value={profileLastName}
                          onChange={(e) => handleFieldChange('lastName', e.target.value)}
                          placeholder="Enter your last name"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Full Address */}
                <div>
                  {personalDataFields.find(f => f.key === 'fullAddress')?.available ? (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedPersonalData.includes('fullAddress')}
                        onCheckedChange={() => togglePersonalData('fullAddress')}
                      />
                      <Label className="cursor-pointer">
                        <span>Full Address</span>
                        <span className="text-sm text-muted-foreground ml-2">({personalDataFields.find(f => f.key === 'fullAddress')?.value})</span>
                      </Label>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="profile-address" className="text-sm font-medium">
                          Address
                        </Label>
                        <input
                          id="profile-address"
                          type="text"
                          value={profileAddress}
                          onChange={(e) => handleFieldChange('address', e.target.value)}
                          placeholder="Enter your address"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="profile-city" className="text-sm font-medium">
                          City
                        </Label>
                        <input
                          id="profile-city"
                          type="text"
                          value={profileCity}
                          onChange={(e) => handleFieldChange('city', e.target.value)}
                          placeholder="Enter your city"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="profile-state" className="text-sm font-medium">
                          State
                        </Label>
                        <input
                          id="profile-state"
                          type="text"
                          value={profileState}
                          onChange={(e) => handleFieldChange('state', e.target.value)}
                          placeholder="Enter your state"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="profile-zip-code" className="text-sm font-medium">
                          ZIP Code
                        </Label>
                        <input
                          id="profile-zip-code"
                          type="text"
                          value={profileZipCode}
                          onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                          placeholder="Enter your ZIP code"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Birth Year */}
                <div>
                  {personalDataFields.find(f => f.key === 'birthYear')?.available ? (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedPersonalData.includes('birthYear')}
                        onCheckedChange={() => togglePersonalData('birthYear')}
                      />
                      <Label className="cursor-pointer">
                        <span>Birth Year</span>
                        <span className="text-sm text-muted-foreground ml-2">({personalDataFields.find(f => f.key === 'birthYear')?.value})</span>
                      </Label>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="profile-birth-year" className="text-sm font-medium">
                        Birth Year
                      </Label>
                      <select
                        id="profile-birth-year"
                        value={profileBirthYear}
                        onChange={(e) => handleFieldChange('birthYear', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">Select your birth year</option>
                        {Array.from({ length: new Date().getFullYear() - 18 - 1900 + 1 }, (_, i) => new Date().getFullYear() - 18 - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Gender */}
                <div>
                  {personalDataFields.find(f => f.key === 'gender')?.available ? (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedPersonalData.includes('gender')}
                        onCheckedChange={() => togglePersonalData('gender')}
                      />
                      <Label className="cursor-pointer">
                        <span>Gender</span>
                        <span className="text-sm text-muted-foreground ml-2">({personalDataFields.find(f => f.key === 'gender')?.value})</span>
                      </Label>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="profile-gender" className="text-sm font-medium">
                        Gender
                      </Label>
                      <select
                        id="profile-gender"
                        value={profileGender}
                        onChange={(e) => handleFieldChange('gender', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">Select your gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Political Affiliation */}
                <div>
                  {personalDataFields.find(f => f.key === 'politicalAffiliation')?.available ? (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedPersonalData.includes('politicalAffiliation')}
                        onCheckedChange={() => togglePersonalData('politicalAffiliation')}
                      />
                      <Label className="cursor-pointer">
                        <span>Political Affiliation</span>
                        <span className="text-sm text-muted-foreground ml-2">({personalDataFields.find(f => f.key === 'politicalAffiliation')?.value})</span>
                      </Label>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="profile-political-affiliation" className="text-sm font-medium">
                        Political Affiliation
                      </Label>
                      <select
                        id="profile-political-affiliation"
                        value={profilePoliticalAffiliation}
                        onChange={(e) => handleFieldChange('politicalAffiliation', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">Select your political affiliation</option>
                        <option value="Democrat">Democrat</option>
                        <option value="Republican">Republican</option>
                        <option value="Independent">Independent</option>
                        <option value="Green Party">Green Party</option>
                        <option value="Libertarian">Libertarian</option>
                        <option value="No Affiliation">No Affiliation</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Education */}
                <div>
                  {personalDataFields.find(f => f.key === 'education')?.available ? (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedPersonalData.includes('education')}
                        onCheckedChange={() => togglePersonalData('education')}
                      />
                      <Label className="cursor-pointer">
                        <span>Education</span>
                        <span className="text-sm text-muted-foreground ml-2">({personalDataFields.find(f => f.key === 'education')?.value})</span>
                      </Label>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="profile-education" className="text-sm font-medium">
                        Education
                      </Label>
                      <select
                        id="profile-education"
                        value={profileEducation}
                        onChange={(e) => handleFieldChange('education', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">Select your education level</option>
                        <option value="High School Diploma">High School Diploma</option>
                        <option value="Some College">Some College</option>
                        <option value="Associate's Degree">Associate's Degree</option>
                        <option value="Bachelor's Degree">Bachelor's Degree</option>
                        <option value="Master's Degree">Master's Degree</option>
                        <option value="Doctoral Degree">Doctoral Degree</option>
                        <option value="Professional Degree">Professional Degree</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Profession */}
                <div>
                  {personalDataFields.find(f => f.key === 'profession')?.available ? (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedPersonalData.includes('profession')}
                        onCheckedChange={() => togglePersonalData('profession')}
                      />
                      <Label className="cursor-pointer">
                        <span>Profession</span>
                        <span className="text-sm text-muted-foreground ml-2">({personalDataFields.find(f => f.key === 'profession')?.value})</span>
                      </Label>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="profile-profession" className="text-sm font-medium">
                        Profession
                      </Label>
                      <input
                        id="profile-profession"
                        type="text"
                        value={profileProfession}
                        onChange={(e) => handleFieldChange('profession', e.target.value)}
                        placeholder="Enter your profession"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Military Service */}
                <div>
                  {personalDataFields.find(f => f.key === 'militaryService')?.available ? (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedPersonalData.includes('militaryService')}
                        onCheckedChange={() => togglePersonalData('militaryService')}
                      />
                      <Label className="cursor-pointer">
                        <span>Military Service</span>
                        <span className="text-sm text-muted-foreground ml-2">({personalDataFields.find(f => f.key === 'militaryService')?.value})</span>
                      </Label>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-sm font-medium">
                        Military Service
                      </Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="profile-military-service"
                            id="military-yes"
                            checked={profileMilitaryService === true}
                            onChange={() => handleMilitaryServiceChange(true)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <Label htmlFor="military-yes" className="cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="profile-military-service"
                            id="military-no"
                            checked={profileMilitaryService === false}
                            onChange={() => handleMilitaryServiceChange(false)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <Label htmlFor="military-no" className="cursor-pointer">No</Label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          )}

          {/* Nickname field - shown when Full Name is not checked */}
          {(user || verifiedUserInfo) && !selectedPersonalData.includes('fullName') && (
            <div>
              <Label htmlFor="nickname" className="text-sm font-medium">
                Nickname (optional)
              </Label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter a nickname to use in your message"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          )}

          {/* Constituent Description Field */}
          {(user || verifiedUserInfo) && (
            <div>
              <Label htmlFor="constituent-description-logged" className="text-sm font-medium">
                Describe yourself as a constituent (optional)
              </Label>
              <Textarea
                id="constituent-description-logged"
                placeholder="Share your background, values, and what matters most to you as a constituent..."
                value={constituentDescription}
                onChange={(e) => setConstituentDescription(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
          )}

          <div className="flex-1"></div>
          <div className="flex justify-between mt-auto pt-6">
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>
            <Button onClick={async () => {
              // Save profile data if user is logged in and has filled out any fields
              if (user) {
                await saveProfileData();
              }
              setStep(8);
            }}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Step 5: Message Delivery
  const renderDeliveryStep = () => {
    return (
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Message Delivery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 flex-1 flex flex-col">
          {/* Message Delivery Options */}
          {(user || verifiedUserInfo) && (
            <div>
              <h3 className="font-semibold mb-3">How would you like to send your message?</h3>
              <RadioGroup value={deliveryMethod} onValueChange={(value: 'egutenberg' | 'email_provider') => setDeliveryMethod(value)} className="space-y-3">
                
                {/* Option 1: eGutenbergPress */}
                <div className="border rounded-lg p-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <RadioGroupItem value="egutenberg" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <AtSign className="h-4 w-4 text-primary" />
                        <span className="font-medium">eGutenbergPress address</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Recommended</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        We'll send your message from our platform and notify you of any responses
                      </p>
                      {deliveryMethod === 'egutenberg' && (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="notification-email-logged" className="text-xs font-medium">
                              Enter your email for notifications
                            </Label>
                            <Input
                              id="notification-email-logged"
                              type="email"
                              placeholder={user?.email || "your@email.com"}
                              value={notificationEmail || user?.email || ''}
                              onChange={(e) => setNotificationEmail(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs font-medium">BCC Email Addresses (Optional)</Label>
                            <div className="space-y-2 mt-1">
                              {bccEmails.map((email, index) => (
                                <div key={index} className="flex gap-2">
                                  <Input
                                    type="email"
                                    placeholder="bcc@email.com"
                                    value={email}
                                    onChange={(e) => {
                                      const newBccEmails = [...bccEmails];
                                      newBccEmails[index] = e.target.value;
                                      setBccEmails(newBccEmails);
                                    }}
                                    className="flex-1"
                                  />
                                  {bccEmails.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newBccEmails = bccEmails.filter((_, i) => i !== index);
                                        setBccEmails(newBccEmails.length === 0 ? [''] : newBccEmails);
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              ))}
                              {bccEmails.length < 5 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setBccEmails([...bccEmails, ''])}
                                  className="text-xs"
                                >
                                  Add BCC Email
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Option 2: Email Provider */}
                <div className="border rounded-lg p-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <RadioGroupItem value="email_provider" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <span className="font-medium">Sign into your email provider</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Connect with Gmail, Microsoft 365, Outlook, Yahoo, or other email providers
                      </p>
                      {deliveryMethod === 'email_provider' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-stone-500 rounded-sm flex items-center justify-center">
                                <span className="text-white text-xs font-bold">G</span>
                              </div>
                              <span>Gmail</span>
                            </Button>
                            <Button variant="outline" size="sm" className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-slate-500 rounded-sm flex items-center justify-center">
                                <span className="text-white text-xs font-bold">O</span>
                              </div>
                              <span>Outlook</span>
                            </Button>
                            <Button variant="outline" size="sm" className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-zinc-600 rounded-sm flex items-center justify-center">
                                <span className="text-white text-xs font-bold">Y</span>
                              </div>
                              <span>Yahoo</span>
                            </Button>
                            <Button variant="outline" size="sm" className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                                <span className="text-white text-xs font-bold">M</span>
                              </div>
                              <span>Microsoft 365</span>
                            </Button>
                          </div>
                          
                          <div>
                            <Label className="text-xs font-medium">BCC Email Addresses (Optional)</Label>
                            <div className="space-y-2 mt-1">
                              {bccEmails.map((email, index) => (
                                <div key={index} className="flex gap-2">
                                  <Input
                                    type="email"
                                    placeholder="bcc@email.com"
                                    value={email}
                                    onChange={(e) => {
                                      const newBccEmails = [...bccEmails];
                                      newBccEmails[index] = e.target.value;
                                      setBccEmails(newBccEmails);
                                    }}
                                    className="flex-1"
                                  />
                                  {bccEmails.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newBccEmails = bccEmails.filter((_, i) => i !== index);
                                        setBccEmails(newBccEmails.length === 0 ? [''] : newBccEmails);
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              ))}
                              {bccEmails.length < 5 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setBccEmails([...bccEmails, ''])}
                                  className="text-xs"
                                >
                                  Add BCC Email
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="flex-1"></div>
          <div className="flex justify-between mt-auto pt-6">
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>
            <Button onClick={() => setStep(12)}>
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Step 6: Review Message
  const renderStep3 = () => {
    const selectedPersonalFields = personalDataFields.filter(f => selectedPersonalData.includes(f.key));
    
    // Generate salutation based on member type
    const getSalutation = (member: any) => {
      const lastName = member.lastName ||
                      member.fullName?.split(' ').slice(-1)[0] ||
                      member.name?.split(' ').slice(-1)[0] ||
                      member.directOrderName?.split(' ').slice(-1)[0] ||
                      'Representative';
      // Check if member is a senator based on officeTitle, chamber, or terms
      const isSenator = member.officeTitle?.toLowerCase().includes('senate') ||
                       member.chamber?.toLowerCase() === 'senate' ||
                       member.url?.includes('/senate/') ||
                       member.terms?.some((term: any) => term.chamber?.toLowerCase() === 'senate');
      const title = isSenator ? 'Senator' : 'Representative';
      return `Dear ${title} ${lastName}`;
    };
    
    return (
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          {getDisplayStep() > 0 && (
            <div className="text-sm font-medium text-muted-foreground mb-2">Step {getDisplayStep()}</div>
          )}
          <CardTitle>Review Message</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Review your message before sending. Make sure everything looks correct and complete.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Letter Navigation */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Letter Preview ({currentLetterIndex + 1} of {selectedMembers.length})</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentLetterIndex(Math.max(0, currentLetterIndex - 1))}
                disabled={currentLetterIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedMembers[currentLetterIndex]?.fullName || selectedMembers[currentLetterIndex]?.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentLetterIndex(Math.min(selectedMembers.length - 1, currentLetterIndex + 1))}
                disabled={currentLetterIndex === selectedMembers.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Formatted Letter */}
          {selectedMembers[currentLetterIndex] && (
            <div className="bg-white border rounded-lg p-8 shadow-sm" style={{ fontFamily: 'serif', lineHeight: '1.6' }}>
              {/* Date */}
              <div className="text-right mb-8">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>

              {/* Recipient Address */}
              <div className="mb-8">
                <div className="font-semibold">
                  {getSalutation(selectedMembers[currentLetterIndex]).replace('Dear ', '')}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {selectedMembers[currentLetterIndex].officeTitle ||
                   (selectedMembers[currentLetterIndex].chamber?.toLowerCase() === 'senate' ||
                    selectedMembers[currentLetterIndex].url?.includes('/senate/') ? 'United States Senate' : 'House of Representatives')}
                </div>
                <div className="text-sm text-muted-foreground">
                  Washington, DC 20515
                </div>
              </div>

              {/* Salutation */}
              <div className="mb-6">
                {getSalutation(selectedMembers[currentLetterIndex])},
              </div>

              {/* Message Body */}
              <div className="mb-8 whitespace-pre-wrap">
                {message}
              </div>

              {/* Signature */}
              <div className="mt-8">
                <div>Sincerely,</div>
                <div className="mt-4 space-y-1">
                  <div className="font-medium">
                    {selectedPersonalData.includes('fullName') ?
                      (personalDataFields.find(f => f.key === 'fullName')?.value || (user || verifiedUserInfo ? 'Your Name' : 'A Concerned Constituent')) :
                      (nickname || 'A Concerned Constituent')
                    }
                    {selectedPersonalData.includes('fullName') && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                        Verified Voter
                      </span>
                    )}
                  </div>
                  {selectedPersonalFields.filter(f => f.key !== 'fullName').map(field => (
                    <div key={field.key} className="text-sm text-muted-foreground">
                      {field.label}: {field.value}
                    </div>
                  ))}
                  {constituentDescription && (
                    <div className="text-sm text-muted-foreground mt-2">
                      <span className="font-medium">About me:</span> {constituentDescription}
                    </div>
                  )}
                  {(!user && !verifiedUserInfo) && (
                    <div className="text-xs text-muted-foreground mt-2 italic">
                      Message sent anonymously
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Verification has been moved to Step 2 */}
          {false && (
            <div>
              <h3 className="font-semibold mb-3">Before We Deliver Your Message</h3>
              <div className="bg-muted rounded-lg p-6 space-y-6">
                <p className="text-sm text-muted-foreground">
                  <strong>Verification = Impact</strong><br/><br/>
We verify your voter registration to ensure your messages are taken seriously by policymakers. Verified info also allows us to autofill your profile and personalize your letters with relevant demographic insights, giving your voice more weight.
                </p>
                
                {verificationStep === 'initial' && (
                  <>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="firstName2">First Name</Label>
                        <Input
                          id="firstName2"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="lastName2">Last Name</Label>
                        <Input
                          id="lastName2"
                          placeholder="Smith"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div className="relative">
                        <Label htmlFor="address2">Address</Label>
                        <Input
                          id="address2"
                          placeholder="Start typing your address..."
                          value={address}
                          onChange={(e) => handleAddressChange(e.target.value)}
                          onFocus={() => address.length >= 3 && setShowAddressSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 150)}
                          className="mt-1"
                        />
                        {showAddressSuggestions && addressSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {addressSuggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                onMouseDown={() => selectAddressSuggestion(suggestion)}
                              >
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Start typing your address to see suggestions
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-secondary/50 rounded-lg p-4 text-sm">
                      <p className="font-medium mb-2">Your Privacy Matters</p>
                      <p className="text-muted-foreground">
                        Your information is only used for verification and is never shared beyond what's required to deliver your letter to your representatives.
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Button variant="ghost" onClick={() => router.push('/login')}>  
                        Already have an account? Login
                      </Button>
                      <Button 
                        onClick={handleVerificationSubmit}
                        disabled={isVerifying}
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Continue'
                        )}
                      </Button>
                    </div>
                  </>
                )}
                
                {verificationStep === 'selection' && (
                  <>
                    <div>
                      <h4 className="font-semibold mb-3">Select Your Record</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        We found the following possible matches. Please select your record to continue.
                      </p>
                    </div>
                    
                    <RadioGroup value={selectedMatch} onValueChange={setSelectedMatch}>
                      {matches.map((match) => (
                        <div key={match.id} className="bg-background border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors">
                          <label className="flex items-start space-x-3 cursor-pointer">
                            <RadioGroupItem value={match.id} className="mt-1" />
                            <div className="flex-1">
                              <p className="font-medium">{match.fullName}</p>
                              <p className="text-sm text-muted-foreground">
                                {match.address}, {match.city}, {match.state} {match.zipCode}
                              </p>
                            </div>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                    
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-medium mb-1">Not Listed?</p>
                        <p>If you don't see yourself, click "Not Me" to enter your full details instead.</p>
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex justify-between">
                      <Button variant="ghost" onClick={handleVerificationReset}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Try Again
                      </Button>
                      
                      <div className="space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setVerificationStep('manual')}
                        >
                          Not Me
                        </Button>
                        <Button 
                          onClick={handleMatchSelection}
                          disabled={!selectedMatch}
                        >
                          Confirm Selection
                        </Button>
                      </div>
                    </div>
                  </>
                )}
                
                {verificationStep === 'manual' && (
                  <>
                    <div>
                      <h4 className="font-semibold mb-3">Enter Your Information</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Please enter your full details to ensure your message is delivered to your representatives.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            placeholder="John"
                            value={manualFirstName}
                            onChange={(e) => setManualFirstName(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            placeholder="Smith"
                            value={manualLastName}
                            onChange={(e) => setManualLastName(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="address">Street Address</Label>
                        <Input
                          id="address"
                          placeholder="123 Main St"
                          value={manualAddress}
                          onChange={(e) => setManualAddress(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            placeholder="Springfield"
                            value={manualCity}
                            onChange={(e) => setManualCity(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            placeholder="IL"
                            maxLength={2}
                            value={manualState}
                            onChange={(e) => setManualState(e.target.value.toUpperCase())}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="manualZip">ZIP Code</Label>
                          <Input
                            id="manualZip"
                            placeholder="12345"
                            maxLength={5}
                            value={manualZipCode}
                            onChange={(e) => setManualZipCode(e.target.value.replace(/\D/g, ''))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        If our records don't show every variation of your name and address, you can still confirm your information manually to ensure your message is delivered.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex justify-between">
                      <Button variant="ghost" onClick={() => setVerificationStep('selection')}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Matches
                      </Button>
                      
                      <Button onClick={handleManualSubmit}>
                        Verify & Continue
                      </Button>
                    </div>
                  </>
                )}
                
                {verificationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{verificationError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}






          <div className="flex-1"></div>
          <div className="flex justify-between mt-auto pt-6">
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>
            {/* Continue button - skip delivery step for authenticated users */}
            {(user || verifiedUserInfo) && (
              <Button onClick={() => user ? setStep(12) : setStep(9)}>
                {user ? 'Send Message' : 'Continue'}
              </Button>
            )}
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
          <CardTitle className="text-xl font-bold text-primary mb-2">Create your account!</CardTitle>
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
          <div className="flex justify-between items-center mt-auto pt-6 border-t">
            <Button variant="outline" onClick={() => setStep(8)} className="px-6">
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
            <CardTitle>Send Message</CardTitle>
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
                
                {/* AI Overview */}
                {bill.summaries && bill.summaries.length > 0 && (
                  <div className="mt-4">
                    <SummaryDisplay 
                      summary={bill.summaries[bill.summaries.length - 1]} 
                      showPoliticalPerspectives={false}
                    />
                  </div>
                )}
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
                onClick={() => setStep(5)}
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

  // useEffect hooks for Step 9 and 12 (sending) - moved to component level to follow Rules of Hooks
  useEffect(() => {
    // Reset and start sending when entering Step 9 or Step 12
    if ((step === 9 || step === 12) && !isSending && !messageSent) {
      setIsSending(true);
      setSendingError(null);
      setMessageSent(false);
    }
  }, [step, isSending, messageSent]);

  useEffect(() => {
    if ((step === 9 || step === 12) && isSending && !messageSent) {
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
              name: member.directOrderName || member.fullName || member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown',
              bioguideId: member.bioguideId || '',
              email: member.email || '',
              party: member.party || member.partyName || '',
              role: member.officeTitle?.toLowerCase().includes('senate') ||
                    member.chamber?.toLowerCase() === 'senate' ||
                    member.url?.includes('/senate/') ||
                    member.terms?.some((term: any) => term.chamber?.toLowerCase() === 'senate') ? 'Senator' : 'Representative'
            })),
            personalDataIncluded: selectedPersonalData,
            constituentDescription: constituentDescription || null,
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
              zipCode: verifiedUserInfo.zipCode,
              constituentDescription: verifiedUserInfo.constituentDescription || null
            };
          }

          // For logged-in users (not verified), save their personal data from personalDataFields
          if (user && !verifiedUserInfo) {
            const selectedFieldsData: any = {};
            selectedPersonalData.forEach(fieldKey => {
              const field = personalDataFields.find(f => f.key === fieldKey);
              if (field && field.available) {
                selectedFieldsData[fieldKey] = field.value;
              }
            });
            // Create userInfo object for logged-in members
            if (Object.keys(selectedFieldsData).length > 0) {
              messageActivity.userInfo = selectedFieldsData;
            }
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
            messageActivity.topic = isMemberContact && targetMember
              ? selectedPolicyIssues.length > 0
                ? `${selectedPolicyIssues.join(', ')} - ${targetMember.directOrderName || targetMember.fullName || targetMember.name || 'Representative'}`
                : `Member Contact: ${targetMember.directOrderName || targetMember.fullName || targetMember.name || 'Representative'}`
              : 'General Advocacy';
          }
          
          const docRef = await addDoc(collection(db, 'user_messages'), messageActivity);
          
          // Store the message ID in sessionStorage for potential account linking
          if (!user) {
            sessionStorage.setItem('pendingMessageId', docRef.id);
            sessionStorage.setItem('pendingMessageData', JSON.stringify({
              messageId: docRef.id,
              verifiedUserInfo,
              constituentDescription,
              billInfo: {
                congress,
                billType,
                billNumber,
                title: bill?.shortTitle || bill?.title
              }
            }));
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
                setStep(13);
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
            <CardTitle className="text-amber-500">Error Sending Message</CardTitle>
            <CardDescription>{sendingError}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={goBack} className="mt-4">
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
              <CheckCircle className="h-16 w-16 text-stone-500" />
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

  // Reset letter index when members change
  useEffect(() => {
    setCurrentLetterIndex(0);
  }, [selectedMembers]);

  // Auto-fill email when reaching Step 13 if user provided notification email
  useEffect(() => {
    if (step === 13 && notificationEmail && !email) {
      setEmail(notificationEmail);
    }
  }, [step, notificationEmail, email]);

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
        
        // Save user profile data from Step 3 verification
        if (verifiedUserInfo) {
          const { getFirestore, doc, setDoc } = await import('firebase/firestore');
          const db = getFirestore(app);
          
          // Parse name from fullName
          const nameParts = verifiedUserInfo.fullName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          const userProfile = {
            uid: userCredential.user.uid,
            email: email,
            firstName: firstName,
            lastName: lastName,
            address: verifiedUserInfo.address,
            city: verifiedUserInfo.city,
            state: verifiedUserInfo.state,
            zipCode: verifiedUserInfo.zipCode,
            constituentDescription: constituentDescription || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
          console.log('Successfully saved user profile data');
        }
        
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
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-stone-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Message sent successfully!</span>
            </div>
            <p className="text-sm text-stone-700 mt-1">
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
              <div className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded p-2">
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
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="container mx-auto px-8 max-w-2xl flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  // Allow all users (authenticated, verified, and anonymous) to proceed
  // We'll handle login/signup after message composition

  return (
    <div className="h-screen bg-secondary/30 flex flex-col overflow-hidden">
      {/* Close button row */}
      <div className="flex justify-end p-4 md:px-8 md:pt-8">
        <button
          onClick={() => {
            // If we have bill parameters, go to the bill detail page
            if (congress && billType && billNumber) {
              router.push(`/bill/${congress}/${billType}/${billNumber}`);
            } else if (typeof window !== 'undefined' && window.history.length > 1) {
              // Try to go back if there's history
              router.back();
            } else {
              // Otherwise go to home page
              router.push('/');
            }
          }}
          className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="w-full flex-1 flex flex-col overflow-auto p-0 md:container md:mx-auto md:px-8 md:pb-8 md:max-w-2xl">
      {/* Step Content */}
      {step === 1 && renderRoutingStep()} {/* Help us verify that you are a registered voter */}
      {step === 2 && (isMemberContact ? renderStep2_PolicyIssues() : renderStep1_Position())} {/* Choose Your Position OR Policy Issues */}
      {step === 3 && !isMemberContact && renderStep2_AIHelp()} {/* Get Help Writing (Optional) - Bills only */}
      {step === 4 && renderStep3_WriteMessage()} {/* Write Your Message */}
      {step === 5 && renderStep4_UploadMedia()} {/* Add Supporting Files (Optional) */}
      {step === 6 && !isMemberContact && renderStep1()} {/* Select Outreach - Bills only */}
      {step === 7 && renderPersonalInfoStep()} {/* Personal Information */}
      {step === 8 && renderStep3()} {/* Review Message */}
      {step === 9 && renderDeliveryStep()} {/* Message Delivery */}
      {step === 10 && renderStep4()} {/* Create Account */}
      {step === 11 && renderStep5()} {/* Send Message */}
      {step === 12 && renderStep6()} {/* Sending Screen */}
      {step === 13 && renderStep7()} {/* Account Creation Form */}
      </div>
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