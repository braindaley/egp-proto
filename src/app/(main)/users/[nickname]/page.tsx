'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { User, MapPin, Briefcase, GraduationCap, Shield, FileText, Megaphone, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { getBillTypeSlug } from '@/lib/utils';
import { parseSimpleMarkdown } from '@/lib/markdown-utils';
import CandidateCampaignCard from '@/components/candidate-campaign-card';

// Social media icons/links configuration
const SOCIAL_PLATFORMS: Record<string, { label: string; urlPrefix: string; icon: string }> = {
  twitter: { label: 'X (Twitter)', urlPrefix: 'https://x.com/', icon: 'X' },
  instagram: { label: 'Instagram', urlPrefix: 'https://instagram.com/', icon: 'IG' },
  facebook: { label: 'Facebook', urlPrefix: 'https://facebook.com/', icon: 'FB' },
  linkedin: { label: 'LinkedIn', urlPrefix: 'https://linkedin.com/in/', icon: 'LI' },
  tiktok: { label: 'TikTok', urlPrefix: 'https://tiktok.com/@', icon: 'TT' },
  youtube: { label: 'YouTube', urlPrefix: 'https://youtube.com/@', icon: 'YT' },
  threads: { label: 'Threads', urlPrefix: 'https://threads.net/@', icon: 'TH' },
  bluesky: { label: 'Bluesky', urlPrefix: 'https://bsky.app/profile/', icon: 'BS' },
};

// Field labels for display
const FIELD_LABELS: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  state: 'State',
  congressionalDistrict: 'Congressional District',
  city: 'City',
  zipCode: 'Zip Code',
  birthYear: 'Birth Year',
  gender: 'Gender',
  politicalAffiliation: 'Party Affiliation',
  education: 'Education',
  profession: 'Profession',
  militaryService: 'Military Service',
  constituentDescription: 'About',
};

interface PublicUserData {
  nickname?: string;
  publicProfileFields?: string[];
  socialMedia?: Record<string, string>;
  profilePicture?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  congressionalDistrict?: string;
  constituentDescription?: string;
  birthYear?: string;
  gender?: string;
  politicalAffiliation?: string;
  education?: string;
  profession?: string;
  militaryService?: string;
  [key: string]: string | string[] | Record<string, string> | undefined;
}

interface UserCampaign {
  id: string;
  billType: string;
  billNumber: string;
  billTitle: string;
  position: string;
  campaignType: string;
  issueTitle?: string;
  issueSpecificTitle?: string;
  supportCount: number;
  opposeCount: number;
  congress?: string;
  reasoning?: string;
  actionButtonText?: string;
  candidate?: {
    candidate1Name: string;
    candidate1Bio?: string;
    candidate2Name: string;
    candidate2Bio?: string;
    selectedCandidate?: string | number;
  };
  poll?: {
    title: string;
    question: string;
    options?: string[];
  };
}

export default function PublicProfilePage() {
  const params = useParams();
  const nickname = params.nickname as string;
  const { user } = useAuth();
  const [userData, setUserData] = useState<PublicUserData | null>(null);
  const [campaigns, setCampaigns] = useState<UserCampaign[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [userActions, setUserActions] = useState<Record<string, 'support' | 'oppose' | null>>({});
  const db = getFirestore(app);

  useEffect(() => {
    const fetchUserByNickname = async () => {
      if (!nickname) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // Look up the nickname to get the userId
        const nicknameRef = doc(db, 'nicknames', nickname.toLowerCase());
        const nicknameDoc = await getDoc(nicknameRef);

        if (!nicknameDoc.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const { userId: uid } = nicknameDoc.data();

        // Fetch the user's data
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setUserData(userDoc.data() as PublicUserData);
        setUserId(uid);
      } catch (error) {
        console.error('Error fetching public profile:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserByNickname();
  }, [nickname, db]);

  // Fetch user's public campaigns
  useEffect(() => {
    const fetchUserCampaigns = async () => {
      if (!userId) return;

      try {
        const campaignsQuery = query(
          collection(db, 'campaigns'),
          where('userId', '==', userId),
          where('isUserCampaign', '==', true),
          where('isDiscoverable', '==', true)
        );

        const querySnapshot = await getDocs(campaignsQuery);
        const userCampaigns = querySnapshot.docs
          .filter(doc => {
            const data = doc.data();
            // Filter out paused campaigns
            return data.isPaused !== true && data.isActive !== false;
          })
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              billType: data.billType,
              billNumber: data.billNumber,
              billTitle: data.billTitle,
              position: data.position,
              campaignType: data.campaignType,
              issueTitle: data.issueTitle,
              issueSpecificTitle: data.issueSpecificTitle,
              supportCount: data.supportCount || 0,
              opposeCount: data.opposeCount || 0,
              congress: data.congress || '119',
              reasoning: data.reasoning,
              actionButtonText: data.actionButtonText,
              candidate: data.candidate,
              poll: data.poll
            };
          });

        setCampaigns(userCampaigns);
      } catch (error) {
        console.error('Error fetching user campaigns:', error);
      }
    };

    fetchUserCampaigns();
  }, [userId, db]);

  const handleSupportOppose = async (campaign: UserCampaign, action: 'support' | 'oppose') => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    try {
      // Store action in localStorage as temporary solution
      const storedActions = JSON.parse(localStorage.getItem('userBillActions') || '[]');
      const newAction = {
        id: Date.now().toString(),
        oduserId: user.uid,
        userEmail: user.email,
        campaignId: campaign.id,
        billNumber: campaign.billNumber,
        billType: campaign.billType,
        congress: campaign.congress,
        billTitle: campaign.billTitle,
        action: action,
        timestamp: new Date().toISOString(),
        userNickname: nickname
      };

      storedActions.push(newAction);
      localStorage.setItem('userBillActions', JSON.stringify(storedActions));

      // Update local state to reflect the change immediately
      setCampaigns(prevCampaigns =>
        prevCampaigns.map(c =>
          c.id === campaign.id
            ? {
                ...c,
                [action === 'support' ? 'supportCount' : 'opposeCount']: (c[action === 'support' ? 'supportCount' : 'opposeCount'] || 0) + 1
              }
            : c
        )
      );

      // Set user action state to show success on button
      setUserActions(prev => ({ ...prev, [campaign.id]: action }));

      // Clear the success state after 2 seconds
      setTimeout(() => {
        setUserActions(prev => ({ ...prev, [campaign.id]: null }));
      }, 2000);

    } catch (error) {
      console.error('Error recording support/oppose action:', error);
      alert('There was an error recording your action. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Loading profile...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !userData) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
                <p className="text-muted-foreground">
                  The user &quot;{nickname}&quot; does not exist or has not set up a public profile.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const publicFields = userData.publicProfileFields || ['firstName', 'lastName', 'state', 'congressionalDistrict'];
  const socialMedia = userData.socialMedia || {};

  // Get display name
  const displayName: string = publicFields.includes('firstName') && publicFields.includes('lastName')
    ? `${(userData.firstName as string) || ''} ${(userData.lastName as string) || ''}`.trim()
    : nickname;

  // Get location info
  const locationParts: string[] = [];
  if (publicFields.includes('city') && userData.city) locationParts.push(userData.city as string);
  if (publicFields.includes('state') && userData.state) locationParts.push(userData.state as string);
  if (publicFields.includes('congressionalDistrict') && userData.congressionalDistrict) {
    locationParts.push(`District ${userData.congressionalDistrict as string}`);
  }

  // Format field value for display
  const formatFieldValue = (key: string, value: unknown): string => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  // Fields to show in the details section (excluding name, location shown separately)
  const detailFields = publicFields.filter(
    field => !['firstName', 'lastName', 'state', 'congressionalDistrict', 'city', 'zipCode', 'constituentDescription'].includes(field)
  );

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 overflow-hidden border-2 border-border">
                  {userData.profilePicture ? (
                    <Image
                      src={userData.profilePicture}
                      alt={`${displayName}'s profile picture`}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-primary" />
                  )}
                </div>

                {/* Name and nickname */}
                <h1 className="text-2xl font-bold font-headline">{displayName}</h1>
                <p className="text-muted-foreground">@{nickname}</p>

                {/* Location */}
                {locationParts.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{locationParts.join(', ')}</span>
                  </div>
                )}

                {/* Social Media Links */}
                {Object.keys(socialMedia).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 justify-center">
                    {Object.entries(socialMedia).map(([platform, username]) => {
                      const config = SOCIAL_PLATFORMS[platform];
                      if (!config || !username) return null;
                      return (
                        <Link
                          key={platform}
                          href={`${config.urlPrefix}${username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <span className="font-bold">{config.icon}</span>
                          <span>@{username}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* About Section */}
          {publicFields.includes('constituentDescription') && userData.constituentDescription && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{userData.constituentDescription as string}</p>
              </CardContent>
            </Card>
          )}

          {/* Details Section */}
          {detailFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {detailFields.map(field => {
                    const value = formatFieldValue(field, userData[field]);
                    if (!value) return null;

                    let Icon = User;
                    if (field === 'education') Icon = GraduationCap;
                    if (field === 'profession') Icon = Briefcase;
                    if (field === 'militaryService') Icon = Shield;

                    return (
                      <div key={field} className="flex items-start gap-2">
                        <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{FIELD_LABELS[field] || field}</p>
                          <p className="text-sm font-medium">{value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campaigns Section */}
          {campaigns.length > 0 && (
            <>
              <h2 className="text-2xl font-bold font-headline text-center flex items-center justify-center gap-2">
                <Megaphone className="h-6 w-6" />
                Campaigns
              </h2>
              <div className="space-y-4 md:space-y-6">
                {campaigns.map((campaign) => {
                  // Render candidate campaigns with CandidateCampaignCard
                  if ((campaign.campaignType === 'Candidate' || campaign.campaignType === 'Candidate Advocacy') && campaign.candidate) {
                    return (
                      <CandidateCampaignCard
                        key={campaign.id}
                        candidate1Name={campaign.candidate.candidate1Name}
                        candidate1Bio={campaign.candidate.candidate1Bio}
                        candidate2Name={campaign.candidate.candidate2Name}
                        candidate2Bio={campaign.candidate.candidate2Bio}
                        selectedCandidate={(campaign.candidate.selectedCandidate === '2' || campaign.candidate.selectedCandidate === 2) ? 2 : 1}
                        position={campaign.position}
                        reasoning={campaign.reasoning || ''}
                        actionButtonText={campaign.actionButtonText || 'Voice your opinion'}
                        supportCount={campaign.supportCount}
                        opposeCount={campaign.opposeCount}
                        groupSlug={nickname}
                        groupName={displayName}
                      />
                    );
                  }

                  // Render poll campaigns as a simple card (PollCampaignCard has a different interface)
                  if ((campaign.campaignType === 'Voter Poll' || campaign.campaignType === 'Poll') && campaign.poll) {
                    return (
                      <Card key={campaign.id} className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-medium text-muted-foreground">
                                {displayName} created a poll
                              </p>
                              <Badge variant="secondary" className="text-sm px-2 py-1">
                                Poll
                              </Badge>
                            </div>
                            <CardTitle className="text-lg sm:text-xl font-bold leading-tight">
                              {campaign.poll.title}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-muted-foreground mb-4 text-sm">{campaign.poll.question}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t gap-3">
                            <p className="text-sm text-muted-foreground">
                              {campaign.supportCount + campaign.opposeCount} responses
                            </p>
                            <Button size="sm" asChild className="w-full sm:w-auto">
                              <Link href={`/users/${nickname}/campaigns/poll-${campaign.id}`}>
                                View Poll
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  // Render legislation/issue campaigns with existing card structure
                  const isSupport = campaign.position === 'Support';
                  const badgeVariant = isSupport ? 'default' : 'destructive';
                  const PositionIcon = isSupport ? ThumbsUp : ThumbsDown;
                  const billTypeSlug = getBillTypeSlug(campaign.billType);
                  const currentUserAction = userActions[campaign.id];

                  return (
                    <Card key={campaign.id} className="shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex flex-col gap-3">
                          {/* User's Opinion with Badge */}
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-muted-foreground">
                              {displayName} urges you to {campaign.position?.toLowerCase()} {campaign.billType?.toUpperCase()} {campaign.billNumber}
                            </p>
                            <Badge variant={badgeVariant} className="flex items-center gap-2 text-sm px-2 py-1 shrink-0">
                              <PositionIcon className="h-3 w-3" />
                              <span>{campaign.position}</span>
                            </Badge>
                          </div>

                          {/* Bill Short Title */}
                          <CardTitle className="text-lg sm:text-xl font-bold leading-tight">
                            <Link
                              href={`/bill/${campaign.congress}/${billTypeSlug}/${campaign.billNumber}`}
                              className="hover:underline break-words"
                            >
                              {campaign.billTitle || `Legislation ${campaign.billType?.toUpperCase()} ${campaign.billNumber}`}
                            </Link>
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {/* Formatted Markdown Reasoning */}
                        {campaign.reasoning && (
                          <div
                            className="text-muted-foreground mb-4 text-sm leading-relaxed [&>h3]:hidden [&>ul]:list-disc [&>ul]:pl-5 [&>li]:leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: parseSimpleMarkdown(campaign.reasoning || '', { hideHeaders: true })
                            }}
                          />
                        )}

                        {/* Bottom Section with Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t gap-3">
                          <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                            <Button
                              variant="outline"
                              size="sm"
                              className={`flex items-center gap-2 transition-colors ${
                                currentUserAction === 'support'
                                  ? 'bg-green-100 text-green-800 border-green-300'
                                  : 'text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200'
                              }`}
                              onClick={() => handleSupportOppose(campaign, 'support')}
                              title={user ? 'Support this bill' : 'Login to support this bill'}
                              disabled={currentUserAction === 'support'}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              <span className="font-semibold">
                                {currentUserAction === 'support' ? 'Supported!' : campaign.supportCount.toLocaleString()}
                              </span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`flex items-center gap-2 transition-colors ${
                                currentUserAction === 'oppose'
                                  ? 'bg-red-100 text-red-800 border-red-300'
                                  : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
                              }`}
                              onClick={() => handleSupportOppose(campaign, 'oppose')}
                              title={user ? 'Oppose this bill' : 'Login to oppose this bill'}
                              disabled={currentUserAction === 'oppose'}
                            >
                              <ThumbsDown className="h-4 w-4" />
                              <span className="font-semibold">
                                {currentUserAction === 'oppose' ? 'Opposed!' : campaign.opposeCount.toLocaleString()}
                              </span>
                            </Button>
                          </div>
                          <Button size="sm" asChild className="w-full sm:w-auto">
                            <Link href={`/users/${nickname}/campaigns/${campaign.billType?.toLowerCase()}-${campaign.billNumber}`}>
                              View Campaign
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
