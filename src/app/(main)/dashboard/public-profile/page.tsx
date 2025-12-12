'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth, User } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app, storage } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, ChevronRight, User as UserIcon, Settings, MessageSquare, Crown, Globe, ExternalLink, Copy, Check, Camera, Loader2, Megaphone } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Fields that are always shown and cannot be unchecked
const REQUIRED_FIELDS = ['firstName', 'lastName', 'state', 'congressionalDistrict'];

// Social media platforms configuration
const SOCIAL_PLATFORMS = [
  { key: 'twitter', label: 'X (Twitter)', prefix: '@', placeholder: 'username' },
  { key: 'instagram', label: 'Instagram', prefix: '@', placeholder: 'username' },
  { key: 'facebook', label: 'Facebook', prefix: '', placeholder: 'username' },
  { key: 'linkedin', label: 'LinkedIn', prefix: '', placeholder: 'username' },
  { key: 'tiktok', label: 'TikTok', prefix: '@', placeholder: 'username' },
  { key: 'youtube', label: 'YouTube', prefix: '@', placeholder: 'channel' },
  { key: 'threads', label: 'Threads', prefix: '@', placeholder: 'username' },
  { key: 'bluesky', label: 'Bluesky', prefix: '@', placeholder: 'handle.bsky.social' },
];

// All available profile fields for public display
const PROFILE_FIELDS = [
  { key: 'firstName', label: 'First Name', required: true },
  { key: 'lastName', label: 'Last Name', required: true },
  { key: 'state', label: 'State', required: true },
  { key: 'congressionalDistrict', label: 'Congressional District', required: true },
  { key: 'city', label: 'City', required: false },
  { key: 'zipCode', label: 'Zip Code', required: false },
  { key: 'birthYear', label: 'Birth Year', required: false },
  { key: 'gender', label: 'Gender', required: false },
  { key: 'politicalAffiliation', label: 'Party Affiliation', required: false },
  { key: 'education', label: 'Education', required: false },
  { key: 'profession', label: 'Profession', required: false },
  { key: 'militaryService', label: 'Military Service', required: false },
  { key: 'constituentDescription', label: 'Constituent Description', required: false },
];

export default function PublicProfilePage() {
  const { user, loading, refreshUserData } = useAuth();
  const [selectedFields, setSelectedFields] = useState<string[]>(REQUIRED_FIELDS);
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [socialMedia, setSocialMedia] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const db = getFirestore(app);

  useEffect(() => {
    if (user) {
      // Load existing public profile settings or default to required fields
      const extendedUser = user as User & {
        publicProfileFields?: string[],
        nickname?: string,
        socialMedia?: Record<string, string>,
        profilePicture?: string
      };

      if (extendedUser.publicProfileFields && extendedUser.publicProfileFields.length > 0) {
        const fieldsWithRequired = [...new Set([...REQUIRED_FIELDS, ...extendedUser.publicProfileFields])];
        setSelectedFields(fieldsWithRequired);
      } else {
        setSelectedFields(REQUIRED_FIELDS);
      }

      if (extendedUser.nickname) {
        setNickname(extendedUser.nickname);
      }

      if (extendedUser.socialMedia) {
        setSocialMedia(extendedUser.socialMedia);
      }

      if (extendedUser.profilePicture) {
        setProfilePicture(extendedUser.profilePicture);
      }
    }
  }, [user]);

  const handleFieldToggle = (fieldKey: string) => {
    if (REQUIRED_FIELDS.includes(fieldKey)) {
      // Cannot toggle required fields
      return;
    }

    setSelectedFields(prev => {
      if (prev.includes(fieldKey)) {
        return prev.filter(f => f !== fieldKey);
      } else {
        return [...prev, fieldKey];
      }
    });
  };

  const checkNicknameUnique = async (nicknameToCheck: string): Promise<boolean> => {
    if (!nicknameToCheck.trim()) return true; // Empty nickname is allowed

    const normalizedNickname = nicknameToCheck.trim().toLowerCase();
    const nicknameRef = doc(db, 'nicknames', normalizedNickname);
    const nicknameDoc = await getDoc(nicknameRef);

    if (!nicknameDoc.exists()) {
      return true; // Nickname is available
    }

    // Check if current user owns this nickname
    const data = nicknameDoc.data();
    return data?.userId === user?.uid;
  };

  const handleNicknameChange = (value: string) => {
    // Only allow alphanumeric and underscores, convert to lowercase
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setNickname(sanitized);
    setNicknameError('');
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    // Remove @ prefix if user includes it (we'll add it in display)
    const sanitized = value.replace(/^@/, '').trim();
    setSocialMedia(prev => ({
      ...prev,
      [platform]: sanitized
    }));
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setIsUploadingPicture(true);
    try {
      // Create a reference to the file in Firebase Storage
      const fileExtension = file.name.split('.').pop();
      const storageRef = ref(storage, `profile-pictures/${user.uid}.${fileExtension}`);

      // Upload the file
      await uploadBytes(storageRef, file);

      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);

      // Update local state
      setProfilePicture(downloadUrl);

      // Save to user profile immediately
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { profilePicture: downloadUrl }, { merge: true });

      await refreshUserData();
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setNicknameError('');

    const newNickname = nickname.trim().toLowerCase();
    const oldNickname = (user as User & { nickname?: string }).nickname;

    try {
      // Check nickname uniqueness if provided
      if (newNickname) {
        setIsCheckingNickname(true);
        const isUnique = await checkNicknameUnique(newNickname);
        setIsCheckingNickname(false);

        if (!isUnique) {
          setNicknameError('This nickname is already taken');
          setIsSaving(false);
          return;
        }
      }

      // Remove old nickname from nicknames collection if it changed
      if (oldNickname && oldNickname !== newNickname) {
        const oldNicknameRef = doc(db, 'nicknames', oldNickname);
        await deleteDoc(oldNicknameRef);
      }

      // Add new nickname to nicknames collection
      if (newNickname) {
        const nicknameRef = doc(db, 'nicknames', newNickname);
        await setDoc(nicknameRef, { userId: user.uid, createdAt: new Date() });
      }

      // Clean up empty social media entries
      const cleanedSocialMedia = Object.fromEntries(
        Object.entries(socialMedia).filter(([, value]) => value && value.trim())
      );

      // Update user profile
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        publicProfileFields: selectedFields,
        nickname: newNickname || null,
        socialMedia: cleanedSocialMedia
      }, { merge: true });

      await refreshUserData();
      router.push('/dashboard');
    } catch (error) {
      console.error("Error saving public profile settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  // Get the saved nickname from user data (not the input state)
  const savedNickname = (user as User & { nickname?: string })?.nickname;

  const getProfileUrl = () => {
    if (typeof window !== 'undefined' && savedNickname) {
      return `${window.location.origin}/users/${savedNickname}`;
    }
    return '';
  };

  const handleCopyLink = async () => {
    const url = getProfileUrl();
    if (url) {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleOpenProfile = () => {
    if (savedNickname) {
      window.open(`/users/${savedNickname}`, '_blank');
    }
  };

  const getFieldValue = (fieldKey: string): string => {
    if (!user) return '';
    const value = (user as Record<string, unknown>)[fieldKey];
    if (value === undefined || value === null) return 'Not set';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const dashboardNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: UserIcon },
    { label: 'Edit Profile', href: '/dashboard/profile', icon: UserIcon },
    { label: 'Public Profile', href: '/dashboard/public-profile', icon: Globe, isActive: true },
    { label: 'My Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
    { label: 'Membership', href: '/dashboard/membership', icon: Crown },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { label: 'Policy Interests', href: '/dashboard/interests', icon: Settings },
  ];

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-6 md:py-12">
        {/* Mobile Menu Button */}
        <div className="lg:hidden mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center gap-2"
          >
            <Menu className="h-4 w-4" />
            Dashboard Navigation
          </Button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mb-6">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {dashboardNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors group ${
                        item.isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span className={item.isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}>
                          {item.label}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    </Link>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:justify-center">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full max-w-6xl">
            {/* Desktop Left Navigation Panel */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <nav className="space-y-1">
                      {dashboardNavItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors group ${
                            item.isActive ? 'bg-muted text-foreground' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span className={item.isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}>
                              {item.label}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                        </Link>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
              </div>
            </aside>

            {/* Main Content */}
            <div className="w-full lg:max-w-[672px] lg:flex-1">
              <header className="mb-8">
                <h1 className="text-3xl font-bold font-headline">
                  Public Profile
                </h1>
                <p className="text-muted-foreground mt-1">
                  Choose which information is visible on your public profile.
                </p>
              </header>

              <main className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Public Profile Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Profile Picture */}
                    <div className="mb-6 pb-4 border-b">
                      <Label className="text-sm font-medium mb-2 block">Profile Picture</Label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Upload a profile picture to display on your public profile (max 5MB).
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                            {profilePicture ? (
                              <Image
                                src={profilePicture}
                                alt="Profile picture"
                                width={80}
                                height={80}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserIcon className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          {isUploadingPicture && (
                            <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          )}
                        </div>
                        <div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleProfilePictureChange}
                            accept="image/*"
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingPicture}
                            className="h-8 text-xs"
                          >
                            <Camera className="h-3 w-3 mr-1" />
                            {profilePicture ? 'Change Photo' : 'Upload Photo'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Nickname field */}
                    <div className="mb-6 pb-4 border-b">
                      <Label htmlFor="nickname" className="text-sm font-medium">
                        Nickname
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Choose a unique nickname for your public profile (letters, numbers, and underscores only)
                      </p>
                      <Input
                        id="nickname"
                        value={nickname}
                        onChange={(e) => handleNicknameChange(e.target.value)}
                        placeholder="e.g., civic_voter_2024"
                        className={`max-w-xs ${nicknameError ? 'border-red-500' : ''}`}
                        maxLength={30}
                      />
                      {nicknameError && (
                        <p className="text-xs text-red-500 mt-1">{nicknameError}</p>
                      )}
                      {savedNickname && (
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpenProfile}
                            className="h-8 text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open Profile
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyLink}
                            className="h-8 text-xs"
                          >
                            {linkCopied ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Link
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Profile Visibility */}
                    <div className="mb-6 pb-4 border-b">
                      <Label className="text-sm font-medium mb-1 block">Profile Visibility</Label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Select which fields appear on your public profile.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                      {PROFILE_FIELDS.map((field) => (
                        <div
                          key={field.key}
                          className="flex items-center gap-2 py-1.5"
                        >
                          <Checkbox
                            id={field.key}
                            checked={selectedFields.includes(field.key)}
                            onCheckedChange={() => handleFieldToggle(field.key)}
                            disabled={field.required}
                          />
                          <Label
                            htmlFor={field.key}
                            className={`text-sm ${field.required ? 'text-muted-foreground' : 'cursor-pointer'}`}
                          >
                            {field.label}: <span className="text-muted-foreground">{getFieldValue(field.key)}</span>
                            {field.required && <span className="text-xs ml-1">(required)</span>}
                          </Label>
                        </div>
                      ))}
                      </div>
                    </div>

                    {/* Social Media */}
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2 block">Social Media</Label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Add your social media handles to display on your public profile.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {SOCIAL_PLATFORMS.map((platform) => (
                          <div key={platform.key} className="flex items-center gap-2">
                            <Label htmlFor={platform.key} className="text-sm w-24 shrink-0">
                              {platform.label}
                            </Label>
                            <div className="flex items-center flex-1 gap-1">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {platform.prefix}
                              </span>
                              <Input
                                id={platform.key}
                                value={socialMedia[platform.key] || ''}
                                onChange={(e) => handleSocialMediaChange(platform.key, e.target.value)}
                                placeholder={platform.placeholder}
                                className="text-sm h-9 flex-1"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                      <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
