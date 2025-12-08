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
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, AlertCircle, User, Search, X, CheckCircle, Mail, Shield, UserPlus, Upload, File, Image, ChevronLeft, ChevronRight, Check, AtSign, Globe, Crown, Heart, Eye, TrendingUp, Filter, ArrowRight, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useZipCode } from '@/hooks/use-zip-code';
import { useMembersByZip } from '@/hooks/useMembersByZip';
import { SummaryDisplay } from '@/components/bill-summary-display';
import Link from 'next/link';
import type { Member, Bill, Sponsor } from '@/types';
import { AdvocacyMessageCandidate } from '@/components/AdvocacyMessageCandidate';
import { AdvocacyMessagePoll } from '@/components/AdvocacyMessagePoll';
import type { L2VoterRecord } from '@/lib/l2-api';

// Feature flag to enable/disable L2 verification
const ENABLE_L2_VERIFICATION = false;

// Helper function to fetch bill details
async function getBillDetails(congress: string, billType: string, billNumber: string): Promise<Bill | null> {
    const url = `/api/bill?congress=${congress}&billType=${billType}&billNumber=${billNumber}`;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.log(`Bill details not available (${res.status}) - using cached data or continuing without bill details`);
            return null;
        }
        return await res.json();
    } catch (error) {
        console.log("Bill details unavailable:", error);
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
            // Committee data may not be available for all bills, return empty array silently
            return [];
        }
        const data = await res.json();
        return data.committee?.members || [];
    } catch (error) {
        // Network errors or parsing errors - return empty array silently
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
    const [billOverview, setBillOverview] = useState<string>('');
    const [newsOverview, setNewsOverview] = useState<string>('');
    const [isLoadingOverview, setIsLoadingOverview] = useState(false);
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
    // Upload Media feature removed - not in requirements
    // const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

    // Verification state
    const [verificationStep, setVerificationStep] = useState<'initial' | 'selection' | 'manual'>('initial');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [verificationZipCode, setVerificationZipCode] = useState('');
    const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
    const [verificationFailed, setVerificationFailed] = useState(false);
    const [matches, setMatches] = useState<VerificationMatch[]>([]);
    const [rawL2Records, setRawL2Records] = useState<L2VoterRecord[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<string>('');
    const [manualFirstName, setManualFirstName] = useState('');
    const [manualLastName, setManualLastName] = useState('');
    const [manualAddress, setManualAddress] = useState('');
    const [manualCity, setManualCity] = useState('');
    const [manualState, setManualState] = useState('');
    const [manualZipCode, setManualZipCode] = useState('');
    const [constituentDescription, setConstituentDescription] = useState('');
    // Delivery method removed - messages sent directly via eVotersUnited.org
    const deliveryMethod = 'evotersunited'; // Always use eVotersUnited.org
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

    // Step 8 state (sending screen)
    const [isSending, setIsSending] = useState(false);
    const [messageSent, setMessageSent] = useState(false);
    const [sendingError, setSendingError] = useState<string | null>(null);

    // Share with others state
    const [shareEmails, setShareEmails] = useState<string[]>(['', '', '']);
    const [invitationsSent, setInvitationsSent] = useState(false);

    // Step 9-10 state (account creation)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [accountError, setAccountError] = useState<string | null>(null);
    const [accountType, setAccountType] = useState<'free' | 'membership' | null>(null);
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

    const { user, loading, refreshUserData } = useAuth();
    const { zipCode, saveZipCode } = useZipCode();
    const { representatives: congressionalReps } = useMembersByZip(zipCode);
    const router = useRouter();
    const searchParams = useSearchParams();

    const congress = searchParams.get('congress');
    const billType = searchParams.get('type');
    const billNumber = searchParams.get('number');
    const memberBioguideId = searchParams.get('member');
    const isVerified = searchParams.get('verified') === 'true';
    const policyIssueParam = searchParams.get('issue') || searchParams.get('category');
    const candidate1Name = searchParams.get('candidate1');
    const candidate2Name = searchParams.get('candidate2');
    const candidate1Bio = searchParams.get('candidate1Bio');
    const candidate2Bio = searchParams.get('candidate2Bio');
    const newsTitle = searchParams.get('newsTitle');
    const newsUrl = searchParams.get('newsUrl');
    const campaignId = searchParams.get('campaignId');
    const pollId = searchParams.get('poll');
    const orgPosition = searchParams.get('orgPosition'); // Organization's position from campaign

    // Local/State official params (for elected-officials page)
    const recipientName = searchParams.get('recipientName');
    const recipientTitle = searchParams.get('recipientTitle');
    const recipientEmail = searchParams.get('recipientEmail');
    const recipientState = searchParams.get('recipientState');
    const recipientDistrict = searchParams.get('recipientDistrict');
    const recipientJurisdiction = searchParams.get('recipientJurisdiction');

    // Ballot Ready official params (for elected-officials page)
    const officialName = searchParams.get('officialName');
    const officialPosition = searchParams.get('position');

    // Check if this is a local official contact flow (requires email for direct contact)
    const isLocalOfficialFlow = !!recipientName && !!recipientEmail;

    // Check if this is a Ballot Ready official contact flow (no email required)
    const isBallotReadyOfficialFlow = !!officialName && !!officialPosition && !memberBioguideId;

    // Check if this is a member contact flow (not bill-specific)
    // Either has member param, issue param, or Ballot Ready official params
    const isMemberContact = (!!memberBioguideId && !billType && !billNumber) ||
        (!!policyIssueParam && !billType && !billNumber && !memberBioguideId) ||
        isBallotReadyOfficialFlow;

    // Check if this is a poll flow
    const isPollFlow = !!pollId;

    // Check if this is a candidate campaign flow
    // Either has both candidate names in URL OR has campaignId (which will fetch candidate data)
    const isCandidateFlow = (!!candidate1Name && !!candidate2Name) ||
        (!!campaignId && !billType && !billNumber && !memberBioguideId && !pollId);

    // Check if this is a campaign context (e.g., from a campaign page)
    const isCampaignContext = !!campaignId;

    // Determine which flow to use and render appropriate component
    // TODO: Split into separate components for better maintainability
    // - AdvocacyMessageBill: for legislation (has congress, type, number)
    // - AdvocacyMessageIssue: for issues, member contact, news (has issue or member params)
    // - AdvocacyMessageCandidate: for candidate campaigns (has candidate1, candidate2 OR campaignId)
    // - AdvocacyMessagePoll: for poll campaigns (has poll parameter)

    if (isPollFlow) {
        return (
            <AdvocacyMessagePoll
                pollId={pollId || undefined}
                campaignId={campaignId || undefined}
            />
        );
    }

    if (isCandidateFlow) {
        return (
            <AdvocacyMessageCandidate
                candidate1Name={candidate1Name || undefined}
                candidate1Bio={candidate1Bio || undefined}
                candidate2Name={candidate2Name || undefined}
                candidate2Bio={candidate2Bio || undefined}
                campaignId={campaignId || undefined}
            />
        );
    }

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

    // Set user stance from organization position when coming from a campaign
    useEffect(() => {
        if (orgPosition === 'support' || orgPosition === 'oppose') {
            setUserStance(orgPosition);
        }
    }, [orgPosition]);

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
        // Check if user is logged in with address (skipped verification)
        const skippedVerification = !!(user && (user.address || (user.city && user.state && user.zipCode)));

        if (isLocalOfficialFlow || isBallotReadyOfficialFlow) {
            // Local official / Ballot Ready official flow: Policy → Write → Personal → Review → Success
            // Simplified flow since recipient is already selected
            if (step === 2) return 1; // Choose policy issue (Ballot Ready officials)
            if (step === 4) return isBallotReadyOfficialFlow ? 2 : 1; // Write Your Message
            if (step === 6) return isBallotReadyOfficialFlow ? 3 : 2; // Personal Information
            if (step === 7) return isBallotReadyOfficialFlow ? 4 : 3; // Review Message
            if (step === 8) return isBallotReadyOfficialFlow ? 5 : 4; // Success screen
            return 0;
        } else if (isMemberContact) {
            // Member contact flow: Verification → Policy → Write → Select Recipients → Personal → Review → Success → Account
            // For logged-in users: Policy → Write → Select Recipients → Personal → Review → Success → Account
            if (step === 1) return skippedVerification ? 0 : 1; // Verification (hidden for logged-in users)
            if (step === 2) return skippedVerification ? 1 : 2; // Choose policy issue
            if (step === 4) return skippedVerification ? 2 : 3; // Write Your Message
            if (step === 5) return skippedVerification ? 3 : 4; // Select Recipients
            if (step === 6) return skippedVerification ? 4 : 5; // Personal Information
            if (step === 7) return skippedVerification ? 5 : 6; // Review Message
            if (step === 8) return skippedVerification ? 6 : 7; // Success screen
            return 0;
        } else {
            // Bill flow: Verification → Position → AI Help → Write → Select Reps → Personal → Review → Success → Account
            // For logged-in users: Position → AI Help → Write → Select Reps → Personal → Review → Success → Account
            if (step === 1) return skippedVerification ? 0 : 1; // Verification (hidden for logged-in users)
            if (step === 2) return skippedVerification ? 1 : 2; // Choose Your Position
            if (step === 3) return skippedVerification ? 2 : 3; // Writing Your Message - help writing?
            if (step === 4) return skippedVerification ? 3 : 4; // Write Your Message
            if (step === 5) return skippedVerification ? 4 : 5; // Select representatives to send your message
            if (step === 6) return skippedVerification ? 5 : 6; // Personal Information
            if (step === 7) return skippedVerification ? 6 : 7; // Review Message
            if (step === 8) return skippedVerification ? 7 : 8; // Success screen
            return 0;
        }
    };

    // Back navigation - all users go through verification
    const goBack = () => {
        if (isLocalOfficialFlow) {
            // Local official flow: Write → Personal → Review → Success
            if (step === 4) return; // Can't go back from first step (write message)
            else if (step === 6) setStep(4); // Personal Info → Write Message (skip Select Recipients step 5)
            else if (step === 7) setStep(6); // Review → Personal Info
            else if (step === 8) setStep(7); // Success → Review
        } else if (isBallotReadyOfficialFlow) {
            // Ballot Ready official flow: Policy → Write → Personal → Review → Success
            if (step === 2) return; // Can't go back from first step (policy issue)
            else if (step === 4) setStep(2); // Write Message → Policy Issue
            else if (step === 6) setStep(4); // Personal Info → Write Message (skip Select Recipients step 5)
            else if (step === 7) setStep(6); // Review → Personal Info
            else if (step === 8) setStep(7); // Success → Review
        } else if (isMemberContact) {
            // Issue flow: Verification → Policy → Write → Select Recipients → Personal → Review → Success → Account
            if (step === 1) return; // Can't go back from first step (verification)
            else if (step === 2) setStep(1); // Policy Issues → verification
            else if (step === 4) setStep(2); // Write Message → Policy Issues (skip AI Help step 3)
            else if (step === 5) setStep(4); // Select Recipients → Write Message
            else if (step === 6) setStep(5); // Personal Info → Select Recipients
            else if (step === 7) setStep(6); // Review → Personal Info
            else if (step === 8) setStep(7); // Success → Review
            else if (step === 9) setStep(7); // Account Creation → Review
        } else {
            // Bill flow: Verification → Position → AI Help → Write → Select Reps → Personal → Review → Success → Account
            if (step === 1) return; // Can't go back from first step (verification)
            else if (step === 2) setStep(1); // Position → verification
            else if (step === 3) setStep(2); // AI Help → Position
            else if (step === 4) setStep(3); // Write Message → AI Help
            else if (step === 5) setStep(4); // Select Representatives → Write Message
            else if (step === 6) setStep(5); // Personal Info → Select Representatives
            else if (step === 7) setStep(6); // Review → Personal Info
            else if (step === 8) setStep(7); // Success → Review
            else if (step === 9) setStep(7); // Account Creation → Review
        }
    };

    // Skip verification for logged-in users who have already verified their voter registration
    useEffect(() => {
        // Only auto-skip if user is logged in, not currently loading, on step 1
        if (user && !loading && step === 1) {
            // Check if user has address (the key verification requirement)
            // Name is helpful but not strictly required for verification
            const hasAddress = !!(user.address || (user.city && user.state && user.zipCode));
            if (hasAddress) {
                // DON'T set verifiedUserInfo for logged-in users - that's only for guest users
                // Just save zipCode for member lookup
                if (user.zipCode) {
                    saveZipCode(user.zipCode);
                }
                // User is already verified, skip to step 2
                setStep(2);
            }
        }
    }, [user, loading, step]);

    // Fetch bill details
    useEffect(() => {
        if (congress && billType && billNumber) {
            getBillDetails(congress, billType, billNumber).then(setBill);
        }
    }, [congress, billType, billNumber]);

    // Fetch AI overview for bills
    useEffect(() => {
        const fetchBillOverview = async () => {
            if (!bill) return;

            setIsLoadingOverview(true);
            try {
                const response = await fetch('/api/ai/generate-bill-overview', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        billTitle: bill.title || bill.shortTitle,
                        billNumber: `${bill.type} ${bill.number}`,
                        billSummary: bill.summaries?.items?.[0]?.text || bill.title
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setBillOverview(data.overview);
                }
            } catch (error) {
                console.error('Failed to fetch bill overview:', error);
            } finally {
                setIsLoadingOverview(false);
            }
        };

        fetchBillOverview();
    }, [bill]);

    // Fetch AI overview for news articles
    useEffect(() => {
        const fetchNewsOverview = async () => {
            if (!newsTitle) return;

            setIsLoadingOverview(true);
            try {
                const response = await fetch('/api/ai/generate-news-summary', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        newsTitle,
                        newsUrl,
                        newsContent: '' // Could be enhanced to fetch actual content if needed
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setNewsOverview(data.summary);
                }
            } catch (error) {
                console.error('Failed to fetch news summary:', error);
            } finally {
                setIsLoadingOverview(false);
            }
        };

        fetchNewsOverview();
    }, [newsTitle, newsUrl]);

    // Handle campaign context
    useEffect(() => {
        if (campaignId) {
            // In a real implementation, this would fetch campaign details
            // For now, we'll just log that we're in a campaign context
            console.log('Campaign context detected:', campaignId);
            // The campaign would typically include bill information, news articles, or candidate info
            // which would be passed through the URL params
        }
    }, [campaignId]);

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

    // Set up local official as selected member for local official flow
    useEffect(() => {
        if (!isLocalOfficialFlow || !recipientName || !recipientEmail) return;

        const localOfficial = {
            name: recipientName,
            firstName: recipientName.split(' ')[0],
            lastName: recipientName.split(' ').slice(1).join(' '),
            title: recipientTitle || 'Elected Official',
            email: recipientEmail,
            state: recipientState || '',
            district: recipientDistrict || '',
            jurisdiction: recipientJurisdiction || 'Local',
            isLocalOfficial: true, // Flag to identify local officials
        };
        setTargetMember(localOfficial);
        setSelectedMembers([localOfficial]);
        // Start at step 4 (write message) for local official flow since recipient is already selected
        setStep(4);
    }, [isLocalOfficialFlow, recipientName, recipientEmail, recipientTitle, recipientState, recipientDistrict, recipientJurisdiction]);

    // Set up Ballot Ready official as selected member
    useEffect(() => {
        if (!isBallotReadyOfficialFlow || !officialName || !officialPosition) return;

        const ballotReadyOfficial = {
            name: officialName,
            firstName: officialName.split(' ')[0],
            lastName: officialName.split(' ').slice(1).join(' '),
            title: officialPosition,
            email: generateMemberEmail({ officialName }), // Generate placeholder email
            jurisdiction: officialPosition.includes('State') ? 'State' :
                         officialPosition.includes('County') ? 'County' :
                         officialPosition.includes('City') ? 'City' : 'Local',
            isBallotReadyOfficial: true, // Flag to identify Ballot Ready officials
        };
        setTargetMember(ballotReadyOfficial);
        setSelectedMembers([ballotReadyOfficial]);
        // Start at step 2 (policy issue) for Ballot Ready official flow
        setStep(2);
    }, [isBallotReadyOfficialFlow, officialName, officialPosition]);

    // Pre-select policy issue from URL parameter
    useEffect(() => {
        if (policyIssueParam && !selectedPolicyIssues.includes(policyIssueParam)) {
            setSelectedPolicyIssues([policyIssueParam]);
        }
    }, [policyIssueParam]);

    // Prepare available members
    useEffect(() => {
        const fetchMembers = async () => {
            // Always populate congressional representatives
            const repsWithEmails = congressionalReps.map(rep => ({
                ...rep,
                email: generateMemberEmail(rep)
            }));

            // Only fetch bill-related members if we have a bill and not in member contact mode
            let leadership: any[] = [];
            let sponsorsWithEmails: any[] = [];

            if (bill && !isMemberContact) {
                // Get committee leadership
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
                sponsorsWithEmails = (bill?.sponsors || []).map(sponsor => ({
                    ...sponsor,
                    email: generateMemberEmail(sponsor)
                }));
            }

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
    }, [bill, congressionalReps, congress, isMemberContact]);

    // Get personal data fields from user profile or verified info
    const getPersonalDataFields = (): PersonalDataField[] => {
        // Use logged in user profile if available, combining saved data with current form state
        if (user) {
            // Combine profile form state with any existing user data
            const currentFirstName = profileFirstName || user?.firstName || '';
            const currentLastName = profileLastName || user?.lastName || '';
            const currentAddress = profileAddress || user?.address || '';
            const currentCity = profileCity || user?.city || '';
            const currentState = profileState || user?.state || '';
            const currentZipCode = profileZipCode || user?.zipCode || '';
            const currentCounty = user?.county || '';
            const currentPrecinct = user?.precinct || '';
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
                { key: 'fullName', label: 'Full Name', value: `${currentFirstName} ${currentLastName}`.trim() || 'John Doe', available: !!(currentFirstName && currentLastName) },
                { key: 'fullAddress', label: 'Full Address', value: addressValue || '123 Main St, Springfield, IL 62701', available: addressAvailable },
                { key: 'state', label: 'State', value: currentState || '', available: !!currentState },
                { key: 'county', label: 'County', value: currentCounty || '', available: !!currentCounty },
                { key: 'precinct', label: 'Precinct', value: currentPrecinct || '', available: !!currentPrecinct },
                { key: 'birthYear', label: 'Birth Year', value: currentBirthYear || '1990', available: !!currentBirthYear },
                { key: 'gender', label: 'Gender', value: currentGender || 'Prefer not to say', available: !!currentGender },
                { key: 'politicalAffiliation', label: 'Political Affiliation', value: currentPoliticalAffiliation || 'Independent', available: !!currentPoliticalAffiliation },
                { key: 'education', label: 'Education', value: currentEducation || 'Bachelor\'s Degree', available: !!currentEducation },
                { key: 'profession', label: 'Profession', value: currentProfession || 'Professional', available: !!currentProfession },
                { key: 'militaryService', label: 'Military Service', value: currentMilitaryService !== undefined ? (currentMilitaryService ? 'Yes' : 'No') : 'No', available: currentMilitaryService !== undefined && currentMilitaryService !== null },
            ];
        }

        // For verified guest users (not logged in), return name, address, and L2 fields if available
        if (verifiedUserInfo) {
            // If address already contains full address, use it as-is; otherwise construct it
            const addressValue = verifiedUserInfo.address.includes(',')
                ? verifiedUserInfo.address
                : `${verifiedUserInfo.address}, ${verifiedUserInfo.city}, ${verifiedUserInfo.state} ${verifiedUserInfo.zipCode}`;
            const county = (verifiedUserInfo as any).county || '';
            const precinct = (verifiedUserInfo as any).precinct || '';
            const birthYear = (verifiedUserInfo as any).birthYear;
            const gender = (verifiedUserInfo as any).gender;
            const politicalAffiliation = (verifiedUserInfo as any).politicalAffiliation;

            return [
                { key: 'fullName', label: 'Full Name', value: verifiedUserInfo.fullName, available: true },
                { key: 'fullAddress', label: 'Full Address', value: addressValue, available: true },
                { key: 'state', label: 'State', value: verifiedUserInfo.state || '', available: !!verifiedUserInfo.state },
                { key: 'county', label: 'County', value: county, available: !!county },
                { key: 'precinct', label: 'Precinct', value: precinct, available: !!precinct },
                { key: 'birthYear', label: 'Birth Year', value: birthYear?.toString() || '', available: !!birthYear },
                { key: 'gender', label: 'Gender', value: gender || '', available: !!gender },
                { key: 'politicalAffiliation', label: 'Political Affiliation', value: politicalAffiliation || '', available: !!politicalAffiliation },
            ];
        }

        // For completely anonymous users, return empty fields
        return [
            { key: 'fullName', label: 'Full Name', value: '', available: false },
            { key: 'fullAddress', label: 'Full Address', value: '', available: false },
            { key: 'state', label: 'State', value: '', available: false },
            { key: 'county', label: 'County', value: '', available: false },
            { key: 'precinct', label: 'Precinct', value: '', available: false },
            { key: 'birthYear', label: 'Birth Year', value: '', available: false },
            { key: 'gender', label: 'Gender', value: '', available: false },
            { key: 'politicalAffiliation', label: 'Political Affiliation', value: '', available: false },
            { key: 'education', label: 'Education', value: '', available: false },
            { key: 'profession', label: 'Profession', value: '', available: false },
            { key: 'militaryService', label: 'Military Service', value: '', available: false },
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
            }
        } catch (error) {
            console.error('Error saving profile data:', error);
        }
    };

    // Address autocomplete functionality - Delaware only for voter verification
    const searchAddresses = (query: string) => {
        if (!query || query.length < 3) {
            setAddressSuggestions([]);
            setShowAddressSuggestions(false);
            return;
        }

        // Only provide Delaware addresses (voter verification is Delaware-only)
        const delawareAddresses = [
            { street: 'Emerson Rd', city: 'Middletown', zip: '19709' },
            { street: 'Main St', city: 'Newark', zip: '19702' },
            { street: 'Pleasant Valley Rd', city: 'Newark', zip: '19711' },
            { street: 'Limestone Rd', city: 'Wilmington', zip: '19808' },
            { street: 'Kirkwood Hwy', city: 'Wilmington', zip: '19808' },
            { street: 'Market St', city: 'Wilmington', zip: '19801' },
            { street: 'Delaware Ave', city: 'Wilmington', zip: '19806' },
            { street: 'Concord Pike', city: 'Wilmington', zip: '19803' },
            { street: 'Lancaster Pike', city: 'Hockessin', zip: '19707' },
            { street: 'Brandywine Blvd', city: 'Wilmington', zip: '19809' },
        ];

        // Mock address suggestions - in real implementation, this would call Google Places API
        const mockSuggestions = delawareAddresses.map(({ street, city, zip }) => {
            const houseNumber = Math.floor(Math.random() * 900) + 100;
            return `${houseNumber} ${street}, ${city}, DE ${zip}`;
        });

        setAddressSuggestions(mockSuggestions);
        setShowAddressSuggestions(true);
    };

    const handleAddressChange = (value: string) => {
        setAddress(value);
        searchAddresses(value);

        // Try to auto-parse city, state, and zip from the address if user types manually
        // Expected formats:
        // - "123 Street Name, City, ST 12345"
        // - "123 Street Name, City ST 12345"
        const parts = value.split(',').map(s => s.trim());

        if (parts.length >= 2) {
            const secondPart = parts[1];

            // Try to extract state and zip from the second part
            const stateZipMatch = secondPart.match(/\b([A-Z]{2})\s+(\d{5})\b/);

            if (stateZipMatch) {
                // Format: "City ST 12345" - extract city by removing state and zip
                const cityOnly = secondPart.substring(0, stateZipMatch.index).trim();
                if (cityOnly) {
                    setCity(cityOnly);
                }
                setState(stateZipMatch[1]);
                setVerificationZipCode(stateZipMatch[2]);
            } else {
                // No state/zip found in second part, so it's just the city
                setCity(secondPart);

                // Check third part for state/zip
                if (parts[2]) {
                    const stateZipMatch2 = parts[2].match(/\b([A-Z]{2})\s*(\d{5})?\b/);
                    if (stateZipMatch2) {
                        setState(stateZipMatch2[1]);
                        if (stateZipMatch2[2]) {
                            setVerificationZipCode(stateZipMatch2[2]);
                        }
                    }
                }
            }
        }
    };

    const selectAddressSuggestion = (suggestion: string) => {
        setAddress(suggestion);

        const parts = suggestion.split(',').map(s => s.trim());
        if (parts.length >= 3) {
            setCity(parts[1]);
            const stateZipParts = parts[2].split(' ').filter(s => s.length > 0);
            if (stateZipParts.length >= 2) {
                setState(stateZipParts[0]);
                setVerificationZipCode(stateZipParts[1]);
            }
        }

        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
    };


    // Verification functions
    const handleVerificationSubmit = async () => {
        setVerificationError('');
        setVerificationFailed(false);

        if (!firstName || !lastName || !address || !city || !state || !verificationZipCode) {
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

        if (state.length !== 2) {
            setVerificationError('Please enter a valid 2-letter state code');
            return;
        }

        // L2 verification is only available for Delaware, but if disabled we skip this check
        if (ENABLE_L2_VERIFICATION && state.toUpperCase() !== 'DE') {
            setVerificationError('Voter verification is currently only available for Delaware residents');
            return;
        }

        if (verificationZipCode.length !== 5) {
            setVerificationError('Please enter a valid 5-digit ZIP code');
            return;
        }

        setIsVerifying(true);

        try {
            // When L2 verification is disabled, accept the data and proceed to step 2
            if (!ENABLE_L2_VERIFICATION) {
                // Store the verified user info
                setVerifiedUserInfo({
                    firstName,
                    lastName,
                    fullName: `${firstName} ${lastName}`,
                    address,
                    city,
                    state,
                    zipCode: verificationZipCode,
                    isVerified: true,
                    isGuest: !user,
                });
                setIsVerifying(false);
                setStep(2); // Go directly to step 2 (choose position)
                return;
            }

            // Call L2 API to verify voter
            const response = await fetch('/api/l2/verify-voter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    address,
                    city,
                    state,
                    zipCode: verificationZipCode,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                setVerificationError(data.error || 'Unable to verify identity. Please try again.');
                return;
            }

            // If we found matches, show selection screen
            if (data.matches && data.matches.length > 0) {
                // Store raw L2 voter records for later use
                setRawL2Records(data.matches);

                // Transform L2 voter records to VerificationMatch format
                const transformedMatches: VerificationMatch[] = data.matches.map((match: any) => ({
                    id: match.voterId || match.id || `voter-${Math.random().toString(36).substring(7)}`,
                    fullName: match.fullName,
                    address: match.address,
                    city: match.city,
                    state: match.state,
                    zipCode: match.zipCode,
                    constituentDescription: match.constituentDescription || null,
                }));

                setMatches(transformedMatches);
                setVerificationStep('selection');
            } else {
                // No matches found - accept the data and proceed to step 2
                setVerifiedUserInfo({
                    firstName,
                    lastName,
                    fullName: `${firstName} ${lastName}`,
                    address,
                    city,
                    state,
                    zipCode: verificationZipCode,
                    isVerified: true,
                    isGuest: !user,
                });
                setStep(2); // Go directly to step 2 (choose position)
            }
        } catch (err) {
            console.error('Verification error:', err);
            setVerificationError('Unable to verify identity. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleMatchSelection = async () => {
        const selected = matches.find(m => m.id === selectedMatch);
        if (selected) {
            // Find the corresponding raw L2 record for additional data
            const rawRecord = rawL2Records.find(r => r.voterId === selected.id);

            // Helper to map gender from API format to profile format
            const mapGender = (gender?: string): string | undefined => {
                if (!gender) return undefined;
                const g = gender.toUpperCase();
                if (g === 'M') return 'Male';
                if (g === 'F') return 'Female';
                return gender; // Return as-is if not M or F
            };

            // Helper to convert 2-digit birth year to 4-digit
            const convertBirthYear = (year?: string): number | undefined => {
                if (!year) return undefined;
                const yearNum = parseInt(year);
                if (isNaN(yearNum)) return undefined;

                // If it's already 4 digits, return it
                if (yearNum >= 1900) return yearNum;

                // If it's 2 digits, convert to 4 digits
                // Assume years 00-24 are 2000s, 25-99 are 1900s
                if (yearNum <= 24) return 2000 + yearNum;
                if (yearNum <= 99) return 1900 + yearNum;

                return undefined;
            };

            // Process the additional fields from L2 record
            const birthYear = rawRecord ? convertBirthYear(rawRecord.birthYear) : undefined;
            const gender = rawRecord ? mapGender(rawRecord.gender) : undefined;
            const politicalAffiliation = rawRecord?.politicalAffiliation;

            // Only set verifiedUserInfo for guest users (not logged in)
            // For logged-in users, we save directly to Firebase and update profile state
            if (!user) {
                // Add constituent description and additional L2 fields to verified user info
                const verifiedInfo = {
                    ...selected,
                    constituentDescription: constituentDescription || null,
                    birthYear: birthYear,
                    gender: gender,
                    politicalAffiliation: politicalAffiliation,
                };
                setVerifiedUserInfo(verifiedInfo);
            }

            // Save the zip code to the useZipCode hook for member lookup
            saveZipCode(selected.zipCode);

            // If user is logged in, save voter data to their Firebase profile
            if (user && rawRecord) {
                try {
                    const { getFirestore, doc, setDoc } = await import('firebase/firestore');
                    const { app } = await import('@/lib/firebase');
                    const db = getFirestore(app);

                    // Prepare updates object
                    const updates: any = {
                        updatedAt: new Date().toISOString(),
                    };

                    // Only update fields that have values
                    if (rawRecord.firstName) updates.firstName = rawRecord.firstName;
                    if (rawRecord.lastName) updates.lastName = rawRecord.lastName;
                    if (rawRecord.address) updates.address = rawRecord.address;
                    if (rawRecord.city) updates.city = rawRecord.city;
                    if (rawRecord.state) updates.state = rawRecord.state;
                    if (rawRecord.zipCode) updates.zipCode = rawRecord.zipCode;

                    // Handle birthYear conversion
                    if (birthYear) updates.birthYear = birthYear;

                    // Handle gender mapping
                    if (gender) updates.gender = gender;

                    // Handle political affiliation
                    if (politicalAffiliation) {
                        updates.politicalAffiliation = politicalAffiliation;
                    }

                    // Save to Firebase using setDoc with merge to create document if it doesn't exist
                    await setDoc(doc(db, 'users', user.uid), updates, { merge: true });

                    // Verify the save by reading back from Firebase
                    const { getDoc } = await import('firebase/firestore');
                    const savedDoc = await getDoc(doc(db, 'users', user.uid));
                    if (savedDoc.exists()) {
                        const savedData = savedDoc.data();

                        // Update profile state from the saved Firebase data to ensure consistency
                        if (savedData.firstName) setProfileFirstName(savedData.firstName);
                        if (savedData.lastName) setProfileLastName(savedData.lastName);
                        if (savedData.address) setProfileAddress(savedData.address);
                        if (savedData.city) setProfileCity(savedData.city);
                        if (savedData.state) setProfileState(savedData.state);
                        if (savedData.zipCode) setProfileZipCode(savedData.zipCode);
                        if (savedData.birthYear) setProfileBirthYear(savedData.birthYear.toString());
                        if (savedData.gender) setProfileGender(savedData.gender);
                        if (savedData.politicalAffiliation) setProfilePoliticalAffiliation(savedData.politicalAffiliation);

                        // Refresh user data from Firebase to update the user object globally
                        if (refreshUserData) {
                            await refreshUserData();
                        }
                    } else {
                        console.error('Document does not exist after save!');
                    }
                } catch (error) {
                    console.error('Error saving voter data to profile:', error);
                    // Don't block the flow if save fails
                }
            }

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
        // Use targetMember for member contact flow or local official flow, selectedMembers for bill flow
        const membersToSend = (isMemberContact || isLocalOfficialFlow) && targetMember ? [targetMember] : selectedMembers;

        // Validate required fields (userStance not required for local officials)
        const stanceRequired = !isLocalOfficialFlow;
        if (!message || (stanceRequired && !userStance) || membersToSend.length === 0) {
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
                recipients: membersToSend.map(member => ({
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
                deliveryStatus: 'sent',
                // Campaign tracking for performance analytics
                campaignId: campaignId || null
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
                messageActivity.topic = (isMemberContact || isLocalOfficialFlow) && targetMember
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


            // Mark message as sent
            setMessageSent(true);

        } catch (error) {
            console.error('Error saving message:', error);
            setSendingError('Failed to send message. Please try again.');
            // Don't navigate away on error
        }
    };

    // Step 5: Select Recipients (Select Outreach)
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
                            {availableMembers.representatives.map(rep => {
                                const title = rep.type === 'senator' ? 'Senator' :
                                              rep.type === 'representative' ? 'Representative' :
                                              rep.chamber?.toLowerCase() === 'senate' ||
                                              rep.terms?.[0]?.chamber?.toLowerCase() === 'senate' ||
                                              rep.terms?.some((term: any) => term.chamber?.toLowerCase() === 'senate') ? 'Senator' : 'Representative';
                                return (
                                    <div key={rep.bioguideId || rep.name} className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={selectedMembers.some(m => m.bioguideId === rep.bioguideId || m.name === rep.name)}
                                            onCheckedChange={() => toggleMember(rep)}
                                        />
                                        <Label className="flex items-center space-x-2 cursor-pointer">
                                            <span>{title} {rep.name}</span>
                                            <span className="text-sm text-muted-foreground">({rep.party})</span>
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Committee Leadership (Bill flow only) */}
                {!isMemberContact && availableMembers.committeeLeadership.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-3">Committee Leadership</h3>
                        <div className="space-y-2">
                            {availableMembers.committeeLeadership.map(member => (
                                <div key={member.bioguideId || member.name} className="flex items-center space-x-2">
                                    <Checkbox
                                        checked={selectedMembers.some(m => m.bioguideId === member.bioguideId)}
                                        onCheckedChange={() => toggleMember(member)}
                                    />
                                    <Label className="flex items-center space-x-2 cursor-pointer">
                                        <span>{member.name || member.directOrderName}</span>
                                        <span className="text-sm text-muted-foreground">
                                            ({member.party}) - {member.role}
                                        </span>
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex-1"></div>
                <div className="flex justify-between mt-auto pt-6">
                    <Button variant="outline" onClick={goBack}>
                        Back
                    </Button>
                    <Button
                        onClick={() => setStep(6)}
                        disabled={selectedMembers.length === 0}
                    >
                        Continue
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    // Step 2: Choose Your Position
    const renderStep1_Position = () => (
        <Card className="flex-1 flex flex-col m-0 md:m-auto border-0 md:border rounded-none md:rounded-lg overflow-hidden bg-background">
            <CardHeader className="bg-background">
                {getDisplayStep() > 0 && (
                    <div className="text-sm font-medium text-muted-foreground mb-2">Step {getDisplayStep()}</div>
                )}
                <CardTitle>
                    {bill ? (
                        `Choose Your Position on ${billType?.toUpperCase()}${billNumber}`
                    ) : newsTitle ? (
                        'Take a Position on This Issue'
                    ) : campaignId ? (
                        'Join This Campaign'
                    ) : (
                        'Choose Your Position'
                    )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                    {newsTitle ?
                        'First, let us know whether you agree or disagree with the position in this article.' :
                        campaignId ?
                            'First, let us know whether you support this campaign\'s goals.' :
                            'First, let us know whether you support or oppose this legislation. This helps us understand your viewpoint.'
                    }
                </p>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col bg-background">
                {/* Display AI Overview for Bills */}
                {bill && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2 text-sm">AI Overview</h3>
                        {isLoadingOverview ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm text-muted-foreground">Generating overview...</span>
                            </div>
                        ) : billOverview ? (
                            <p className="text-sm text-muted-foreground leading-relaxed">{billOverview}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {bill.title || bill.shortTitle}
                            </p>
                        )}
                    </div>
                )}

                {/* Display AI Summary for News Articles */}
                {newsTitle && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2 text-sm">Article Summary</h3>
                        <p className="text-sm font-medium mb-2">{newsTitle}</p>
                        {isLoadingOverview ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm text-muted-foreground">Generating summary...</span>
                            </div>
                        ) : newsOverview ? (
                            <p className="text-sm text-muted-foreground leading-relaxed">{newsOverview}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                This article discusses current events relevant to policy decisions.
                            </p>
                        )}
                        {newsUrl && (
                            <a href={newsUrl} target="_blank" rel="noopener noreferrer"
                               className="text-xs text-primary hover:underline mt-2 inline-block">
                                View original article →
                            </a>
                        )}
                    </div>
                )}

                <div>
                    <h3 className="font-semibold mb-4 text-lg">
                        {orgPosition ? (
                            `You are joining this campaign to ${orgPosition} this bill`
                        ) : newsTitle ? (
                            'Do you support or oppose the position in this article?'
                        ) : (
                            'Do you support or oppose this bill?'
                        )}
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        {(!orgPosition || orgPosition === 'support') && (
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
                                    <div className="text-sm opacity-75">
                                        {newsTitle ? 'I agree with this article' : 'I am in favor of this bill'}
                                    </div>
                                </div>
                            </Button>
                        )}
                        {(!orgPosition || orgPosition === 'oppose') && (
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
                                    <div className="text-sm opacity-75">
                                        {newsTitle ? 'I disagree with this article' : 'I am against this bill'}
                                    </div>
                                </div>
                            </Button>
                        )}
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
            'Agriculture & Food',
            'Animals',
            'Arts & Culture',
            'Banking & Finance',
            'Civil Rights',
            'Commerce',
            'Congress',
            'Crime & Law',
            'Defense & Security',
            'Economy & Finance',
            'Education',
            'Emergency Mgmt',
            'Energy',
            'Environment',
            'Families',
            'Foreign Affairs',
            'Government',
            'Health',
            'Housing',
            'Immigration',
            'Labor',
            'Law',
            'Native Issues',
            'Public Lands',
            'Science & Tech',
            'Social Welfare',
            'Sports & Recreation',
            'Taxes',
            'Trade',
            'Transportation',
            'Water Resources'
        ];

        return (
            <Card className="flex-1 flex flex-col m-0 md:m-auto border-0 md:border rounded-none md:rounded-lg overflow-hidden bg-background">
                <CardHeader className="bg-background">
                    {getDisplayStep() > 0 && (
                        <div className="text-sm font-medium text-muted-foreground mb-2">Step {getDisplayStep()}</div>
                    )}
                    <CardTitle>Choose Policy Issue</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                        Select the policy area you'd like to discuss with {targetMember?.directOrderName || 'this member'}.
                    </p>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 flex flex-col bg-background">
                    <div>
                        <h3 className="font-semibold mb-4 text-lg">What issue would you like to address?</h3>
                        <RadioGroup
                            value={selectedPolicyIssues[0] || ''}
                            onValueChange={(value) => setSelectedPolicyIssues([value])}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {policyIssues.map((issue) => (
                                    <div key={issue} className="flex items-center space-x-2">
                                        <RadioGroupItem value={issue} id={issue} />
                                        <Label htmlFor={issue} className="text-sm cursor-pointer">{issue}</Label>
                                    </div>
                                ))}
                            </div>
                        </RadioGroup>
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

    // Step 3: Get Help Writing (Optional)
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

    // Step 4: Write Your Message
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
                            if (isLocalOfficialFlow || isBallotReadyOfficialFlow) {
                                // Local official and Ballot Ready official flows skip Select Recipients (already selected)
                                setStep(6); // Go directly to Personal Info
                            } else {
                                // Both Issue and Bill flows now go to Select Recipients step
                                setStep(5); // Go to select representatives
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

    // Step 4: Add Supporting Files (Optional) - REMOVED (not in requirements)
    /*
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
                ... Upload UI ...
            </CardContent>
        </Card>
    );
    */

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
                    {/* Debug panel - uncomment if needed for testing
          {user && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-xs">
              <div className="font-bold mb-2">🔍 Debug Info (logged in user)</div>
              <div>Email: {user.email}</div>
              <div>First Name: {user.firstName || '(not set)'}</div>
              <div>Last Name: {user.lastName || '(not set)'}</div>
              <div>Address: {user.address || '(not set)'}</div>
              <div>City: {user.city || '(not set)'}</div>
              <div>State: {user.state || '(not set)'}</div>
              <div>ZIP: {user.zipCode || '(not set)'}</div>
              <div>Loading: {loading ? 'true' : 'false'}</div>
              <div className="mt-2 font-semibold">
                Should auto-skip: {!!(user.address || (user.city && user.state && user.zipCode)) ? '✅ YES (has address)' : '❌ NO (missing address)'}
              </div>
            </div>
          )}
          */}

                    <p className="text-sm text-muted-foreground">
                        <strong>Verification = Impact</strong><br/><br/>
                        We verify your voter registration to ensure your messages are taken seriously by policymakers. Verified info also allows us to autofill your profile and personalize your letters with relevant demographic insights, giving your voice more weight.
                    </p>

                    {verificationStep === 'initial' && (
                        <>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
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
                                </div>

                                <div className="relative">
                                    <Label htmlFor="address">Full Address (Delaware only)</Label>
                                    <Input
                                        id="address"
                                        placeholder="448 Emerson Rd, Middletown, DE 19709"
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
                                        Start typing to see address suggestions, then select one to auto-fill
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
                                        onClick={handleVerificationReset}
                                    >
                                        Not Me
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            await handleMatchSelection();
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
                                <Button variant="ghost" onClick={() => setVerificationStep('initial')}>
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Back
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

    // Step 6: Personal Information
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
                        {availableFields.length > 0 ? (
                            <>Select information you'd like to include about yourself</>
                        ) : (
                            <>Add personal information to include in your message</>
                        )}
                    </p>
                    {availableFields.length > 0 && (
                        <div className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                            ✓ {availableFields.length} field{availableFields.length !== 1 ? 's' : ''} loaded from your profile
                        </div>
                    )}
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

                                {/* Only show additional fields for logged-in users */}
                                {user && (
                                    <>
                                        {/* Info message if some fields need to be filled */}
                                        {unavailableFields.length > 0 && unavailableFields.some(f => ['birthYear', 'gender', 'politicalAffiliation', 'education', 'profession'].includes(f.key)) && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="text-blue-600 mt-0.5">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-blue-800 font-medium mb-1">
                                                            Add more personal details (optional)
                                                        </p>
                                                        <p className="text-sm text-blue-700">
                                                            Fill out the fields below to include additional information in your message, or save them to your{' '}
                                                            <a href="/dashboard/profile" target="_blank" className="underline font-semibold hover:text-blue-900">
                                                                profile
                                                            </a>{' '}
                                                            for quicker access next time.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

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
                                    </>
                                )}
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
                            setStep(7);
                        }}>
                            Continue
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Step 5: Message Delivery - REMOVED (not in requirements - messages sent directly)

    // Step 7: Review Message
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

        // Use targetMember for member contact flow, selectedMembers for bill flow
        const membersToPreview = (isMemberContact || isLocalOfficialFlow) && targetMember ? [targetMember] : selectedMembers;

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
                <CardContent className="space-y-6 flex-1 flex flex-col">
                    {/* Letter Navigation */}
                    {membersToPreview.length > 1 && (
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Letter Preview ({currentLetterIndex + 1} of {membersToPreview.length})</h3>
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
                  {membersToPreview[currentLetterIndex]?.fullName || membersToPreview[currentLetterIndex]?.name || membersToPreview[currentLetterIndex]?.directOrderName}
                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentLetterIndex(Math.min(membersToPreview.length - 1, currentLetterIndex + 1))}
                                    disabled={currentLetterIndex === membersToPreview.length - 1}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Formatted Letter */}
                    {membersToPreview[currentLetterIndex] && (
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
                                    {getSalutation(membersToPreview[currentLetterIndex]).replace('Dear ', '')}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {membersToPreview[currentLetterIndex].officeTitle ||
                                        (membersToPreview[currentLetterIndex].chamber?.toLowerCase() === 'senate' ||
                                        membersToPreview[currentLetterIndex].url?.includes('/senate/') ? 'United States Senate' : 'House of Representatives')}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Washington, DC 20515
                                </div>
                            </div>

                            {/* Salutation */}
                            <div className="mb-6">
                                {getSalutation(membersToPreview[currentLetterIndex])},
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
                                                    onClick={handleVerificationReset}
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
                                            <Button variant="ghost" onClick={() => setVerificationStep('initial')}>
                                                <ChevronLeft className="mr-2 h-4 w-4" />
                                                Back
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
                        {/* Continue button - skip delivery step for all users */}
                        {(user || verifiedUserInfo) && (
                            <Button onClick={() => setStep(8)}>
                                Send Message
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Step 9: Create Account - Choose account type
    const renderStep4 = () => {
        return (
            <Card className="max-w-4xl mx-auto">
                <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl font-bold text-primary mb-2">Your message has been sent!</CardTitle>
                    <CardDescription className="text-lg">
                        Create an account to track your advocacy efforts
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Two Options Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Free Account Option */}
                        <button
                            onClick={() => {
                                setAccountType('free');
                                setStep(10); // Go to email/password form
                            }}
                            className="border rounded-lg p-6 space-y-4 text-left hover:border-primary hover:shadow-lg transition-all"
                        >
                            <div className="text-center">
                                <h3 className="text-xl font-semibold mb-2">Create Free Account</h3>
                                <p className="text-sm text-muted-foreground">Track your advocacy messages for free</p>
                            </div>

                            <div className="space-y-3 py-4">
                                <div className="flex items-start gap-2 text-sm">
                                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <span>Send advocacy messages</span>
                                </div>
                            </div>

                            <div className="pt-4">
                                <div className="w-full bg-secondary text-center py-3 rounded-md font-medium">
                                    Continue →
                                </div>
                            </div>
                        </button>

                        {/* Premium Membership Option */}
                        <button
                            onClick={() => {
                                setAccountType('membership');
                                setStep(10); // Go to email/password form
                            }}
                            className="border-2 border-primary rounded-lg p-6 space-y-4 relative bg-primary/5 text-left hover:shadow-xl transition-all"
                        >
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge className="bg-primary text-primary-foreground">Recommended</Badge>
                            </div>

                            <div className="text-center">
                                <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
                                    <Crown className="h-5 w-5 text-primary" />
                                    Become a Member
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">$6/quarter ($24/year) <span className="text-primary font-semibold">• Use code SAVE for 50% off</span></p>
                            </div>

                            <div className="space-y-2 py-2">
                                <div className="flex items-start gap-2 text-sm">
                                    <Heart className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <span>Support the Organization</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm">
                                    <Eye className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <span>View Messages & Responses</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm">
                                    <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <span>Advocacy Impact Analytics</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm">
                                    <Filter className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <span>Customized Feed</span>
                                </div>
                            </div>

                            <div className="pt-4">
                                <div className="w-full bg-primary text-primary-foreground text-center py-3 rounded-md font-medium flex items-center justify-center gap-2">
                                    <Crown className="h-4 w-4" />
                                    Continue →
                                </div>
                            </div>
                        </button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Step 10: Email/Password Form (based on selected account type)
    const renderStep11 = () => {
        const isMembership = accountType === 'membership';

        const handleSignup = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsCreatingAccount(true);

            try {
                // Import Firebase modules
                const { app } = await import('@/lib/firebase');
                const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
                const { getFirestore, doc, setDoc } = await import('firebase/firestore');

                // Create account with Firebase Auth
                const auth = getAuth(app);
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const newUser = userCredential.user;

                // Create user profile in Firestore
                const db = getFirestore(app);
                const userRef = doc(db, 'users', newUser.uid);
                await setDoc(userRef, {
                    email: newUser.email,
                    name: verifiedUserInfo?.name || '',
                    address: verifiedUserInfo?.address || '',
                    city: verifiedUserInfo?.city || '',
                    state: verifiedUserInfo?.state || '',
                    zipCode: verifiedUserInfo?.zipCode || '',
                    membershipTier: isMembership ? 'pending' : 'free',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                // If membership, set flag and redirect to membership signup
                if (isMembership) {
                    sessionStorage.setItem('membershipSignupIntent', 'true');
                    router.push('/membership/signup');
                } else {
                    // Free account - redirect to dashboard
                    router.push('/dashboard?message=sent');
                }
            } catch (error: any) {
                console.error('Error creating account:', error);
                if (error.code === 'auth/email-already-in-use') {
                    alert('An account with this email already exists. Please log in instead.');
                } else {
                    alert('Failed to create account. Please try again.');
                }
            } finally {
                setIsCreatingAccount(false);
            }
        };

        return (
            <Card className="max-w-xl mx-auto">
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        {isMembership && <Crown className="h-6 w-6 text-primary" />}
                        <CardTitle className="text-2xl font-bold">
                            {isMembership ? 'Become a Member' : 'Create Free Account'}
                        </CardTitle>
                    </div>
                    <CardDescription>
                        {isMembership
                            ? 'Enter your email and password to continue to membership checkout'
                            : 'Enter your email and password to create your free account'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password"
                                required
                                minLength={6}
                            />
                            <p className="text-xs text-muted-foreground">
                                Must be at least 6 characters
                            </p>
                        </div>

                        {isMembership && (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                                <h4 className="font-semibold mb-2">What you'll get:</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-start gap-2">
                                        <Heart className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                        <span>Support the Organization</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Eye className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                        <span>View Messages & Responses</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                        <span>Advocacy Impact Analytics</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Filter className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                        <span>Customized Feed</span>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-primary/20">
                                    <p className="font-semibold text-center">$6/quarter ($24/year)</p>
                                    <p className="text-xs text-primary font-semibold text-center mt-1">Use code SAVE for 50% off!</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep(9)}
                                className="flex-1"
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                disabled={isCreatingAccount}
                                className="flex-1"
                            >
                                {isCreatingAccount ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : isMembership ? (
                                    <>
                                        Continue to Checkout
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        );
    };

    // UNUSED: Legacy Create Account/Send Message screen (kept for reference)
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
                                onClick={goBack}
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

    // useEffect hooks for Step 8 (sending) - moved to component level to follow Rules of Hooks
    useEffect(() => {
        // Reset and start sending when entering Step 8 (sending screen)
        if (step === 8 && !isSending && !messageSent) {
            setIsSending(true);
            setSendingError(null);
            setMessageSent(false);
        }
    }, [step, isSending, messageSent]);

    useEffect(() => {
        if (step === 8 && isSending && !messageSent) {
            const sendMessage = async () => {
                try {
                    // Use targetMember for member contact flow, selectedMembers for bill flow
                    const membersToSend = (isMemberContact || isLocalOfficialFlow) && targetMember ? [targetMember] : selectedMembers;

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
                        recipients: membersToSend.map(member => ({
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
                        deliveryStatus: 'sent',
                        // Campaign tracking for performance analytics
                        campaignId: campaignId || null
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
                        messageActivity.topic = (isMemberContact || isLocalOfficialFlow) && targetMember
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

    // Step 8: Sending Screen
    const renderStep6 = () => {
        // Use targetMember for member contact flow, selectedMembers for bill flow
        const membersToSend = (isMemberContact || isLocalOfficialFlow) && targetMember ? [targetMember] : selectedMembers;

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
            const handleShareEmailChange = (index: number, value: string) => {
                const newEmails = [...shareEmails];
                newEmails[index] = value;
                setShareEmails(newEmails);
            };

            const handleAddEmailField = () => {
                setShareEmails([...shareEmails, '']);
            };

            const handleSendInvitations = () => {
                // Mock sending invitations
                setInvitationsSent(true);
            };

            return (
                <Card>
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <CheckCircle className="h-16 w-16 text-stone-500" />
                        </div>
                        <CardTitle className="text-2xl">Message Sent Successfully!</CardTitle>
                        <CardDescription>
                            Your message has been sent to {membersToSend.length} representative{membersToSend.length !== 1 ? 's' : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border-t pt-6 mt-4">
                            <h3 className="font-semibold text-lg mb-2">Share with Others</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Send a link to your colleagues for their consideration.
                            </p>

                            {invitationsSent ? (
                                <div className="text-center py-4">
                                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                    <p className="text-green-600 font-medium">Invitations sent successfully!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {shareEmails.map((email, index) => (
                                        <div key={index}>
                                            <Label htmlFor={`share-email-${index}`} className="text-sm">
                                                Email Address
                                            </Label>
                                            <Input
                                                id={`share-email-${index}`}
                                                type="email"
                                                value={email}
                                                onChange={(e) => handleShareEmailChange(index, e.target.value)}
                                                placeholder=""
                                                className="mt-1"
                                            />
                                        </div>
                                    ))}

                                    <Button
                                        variant="ghost"
                                        className="w-full text-sm"
                                        onClick={handleAddEmailField}
                                    >
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Add Another Email Address
                                    </Button>

                                    <Button
                                        className="w-full"
                                        onClick={handleSendInvitations}
                                        disabled={shareEmails.every(e => !e.trim())}
                                    >
                                        Send Invitations
                                    </Button>
                                </div>
                            )}
                        </div>
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
                        Delivering to {membersToSend.length} representative{membersToSend.length !== 1 ? 's' : ''}...
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-secondary/20 rounded-lg p-6 min-h-[200px] flex items-center justify-center">
                        <div className="space-y-2 w-full max-w-md">
                            {membersToSend.map((member, index) => (
                                <div key={member.bioguideId || member.email} className="flex items-center space-x-3 animate-pulse">
                                    <Mail className="h-5 w-5 text-blue-500" />
                                    <div className="h-2 bg-gray-200 rounded-full flex-1">
                                        <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{width: '75%'}} />
                                    </div>
                                    <span className="text-sm text-muted-foreground">{member.fullName || member.name || member.directOrderName}</span>
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
        <div className="h-screen bg-secondary/30 flex flex-col">
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

            {/* Main content */}
            <div className="flex-1 container mx-auto px-8 max-w-2xl pb-8 flex flex-col pt-4">
                {step === 1 && renderRoutingStep()} {/* Verification */}
                {step === 2 && (isMemberContact ? renderStep2_PolicyIssues() : renderStep1_Position())} {/* Policy/Position */}
                {step === 3 && renderStep2_AIHelp()} {/* Writing Help - Bills only */}
                {step === 4 && renderStep3_WriteMessage()} {/* Write Message */}
                {step === 5 && renderStep1()} {/* Select Recipients - Both flows */}
                {step === 6 && renderPersonalInfoStep()} {/* Personal Information */}
                {step === 7 && renderStep3()} {/* Review Message */}
                {step === 8 && renderStep6()} {/* Sending Screen */}
                {step === 9 && renderStep4()} {/* Choose Account Type */}
                {step === 10 && renderStep11()} {/* Email/Password Form */}
            </div>
        </div>
    );
}

export default function AdvocacyMessagePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-secondary/30 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <AdvocacyMessageContent />
        </Suspense>
    );
}