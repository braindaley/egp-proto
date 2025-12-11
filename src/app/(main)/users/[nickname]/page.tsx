'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import Link from 'next/link';
import { User, MapPin, Briefcase, GraduationCap, Shield, FileText } from 'lucide-react';

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
  [key: string]: unknown;
}

export default function PublicProfilePage() {
  const params = useParams();
  const nickname = params.nickname as string;
  const [userData, setUserData] = useState<PublicUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
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

        const { userId } = nicknameDoc.data();

        // Fetch the user's data
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setUserData(userDoc.data() as PublicUserData);
      } catch (error) {
        console.error('Error fetching public profile:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserByNickname();
  }, [nickname, db]);

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
  const displayName = publicFields.includes('firstName') && publicFields.includes('lastName')
    ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
    : nickname;

  // Get location info
  const locationParts: string[] = [];
  if (publicFields.includes('city') && userData.city) locationParts.push(userData.city as string);
  if (publicFields.includes('state') && userData.state) locationParts.push(userData.state as string);
  if (publicFields.includes('congressionalDistrict') && userData.congressionalDistrict) {
    locationParts.push(`District ${userData.congressionalDistrict}`);
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
                {/* Avatar placeholder */}
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <User className="h-10 w-10 text-primary" />
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
        </div>
      </div>
    </div>
  );
}
