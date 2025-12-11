'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, User } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useZipCode } from '@/hooks/use-zip-code';
import { useMembersByZip } from '@/hooks/useMembersByZip';
import Link from 'next/link';
import { Menu, ChevronRight, User as UserIcon, Settings, MessageSquare, Crown, Globe } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const { user, loading, refreshUserData } = useAuth();
  const { zipCode: cookieZipCode } = useZipCode();
  const { representatives } = useMembersByZip(cookieZipCode);
  const [profile, setProfile] = useState<Partial<User>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const db = getFirestore(app);

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || cookieZipCode || '',
        congressionalDistrict: user.congressionalDistrict || '',
        birthYear: user.birthYear || undefined,
        gender: user.gender || '',
        politicalAffiliation: user.politicalAffiliation || '',
        education: user.education || '',
        profession: user.profession || '',
        militaryService: user.militaryService || false,
        constituentDescription: user.constituentDescription || '',
      });
    }
  }, [user, cookieZipCode]);

  useEffect(() => {
    if (representatives.length > 0 && !profile.congressionalDistrict) {
      const houseRep = representatives.find(rep => rep.officeTitle.includes('House'));
      if (houseRep?.districtNumber) {
        setProfile(prev => ({
          ...prev,
          congressionalDistrict: houseRep.districtNumber.toString()
        }));
      }
    }
  }, [representatives, profile.congressionalDistrict]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const checked = (target as HTMLInputElement).checked;
    setProfile(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    let finalValue: string | boolean = value;
    if (name === 'militaryService') {
        finalValue = value === 'true';
    }
    setProfile(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { ...profile, birthYear: Number(profile.birthYear) }, { merge: true });
      await refreshUserData();
      router.push('/dashboard');
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };
  
  if (loading) {
    return <p>Loading profile...</p>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }
  
  const educationOptions = ['High School', 'Some College', 'Associate Degree', "Bachelor's Degree", "Master's Degree", "Doctoral Degree", "Professional Degree"];
  const professionOptions = [
    'Technology', 'Healthcare', 'Education', 'Finance', 'Law', 'Skilled Trades', 'Sales & Marketing', 'Arts & Entertainment', 
    'Science & Research', 'Government & Public Service', 'Business & Management', 'Student', 'Homemaker', 'Retired', 'Other'
  ];
  const militaryOptions = [{label: 'Yes', value: 'true'}, {label: 'No', value: 'false'}];

  const dashboardNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: UserIcon },
    { label: 'Edit Profile', href: '/dashboard/profile', icon: UserIcon, isActive: true },
    { label: 'Public Profile', href: '/dashboard/public-profile', icon: Globe },
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
                  Edit Profile
                </h1>
                <p className="text-muted-foreground mt-1">
                  This information helps tailor your advocacy messages.
                </p>
              </header>
              
              <main className="space-y-6">
                {/* Voter Registration Data - Read Only */}
                <Card>
                  <CardHeader>
                    <CardTitle>Voter Registration Data</CardTitle>
                    <CardDescription>
                      This information is from your voter registration record and cannot be edited here.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-muted-foreground">First Name</Label>
                        <Input id="firstName" value={profile.firstName || ''} disabled className="bg-muted/50" />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-muted-foreground">Last Name</Label>
                        <Input id="lastName" value={profile.lastName || ''} disabled className="bg-muted/50" />
                      </div>
                      <div>
                        <Label htmlFor="address" className="text-muted-foreground">Address</Label>
                        <Input id="address" value={profile.address || ''} disabled className="bg-muted/50" />
                      </div>
                      <div>
                        <Label htmlFor="city" className="text-muted-foreground">City</Label>
                        <Input id="city" value={profile.city || ''} disabled className="bg-muted/50" />
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-muted-foreground">State</Label>
                        <Input id="state" value={profile.state || ''} disabled className="bg-muted/50" />
                      </div>
                      <div>
                        <Label htmlFor="zipCode" className="text-muted-foreground">Zip Code</Label>
                        <Input id="zipCode" value={profile.zipCode || ''} disabled className="bg-muted/50" />
                      </div>
                      <div>
                        <Label htmlFor="birthYear" className="text-muted-foreground">Birth Year</Label>
                        <Input id="birthYear" value={profile.birthYear?.toString() || ''} disabled className="bg-muted/50" />
                      </div>
                      <div>
                        <Label htmlFor="gender" className="text-muted-foreground">Gender</Label>
                        <Input id="gender" value={profile.gender || ''} disabled className="bg-muted/50" />
                      </div>
                      <div>
                        <Label htmlFor="politicalAffiliation" className="text-muted-foreground">Party Affiliation</Label>
                        <Input id="politicalAffiliation" value={profile.politicalAffiliation || ''} disabled className="bg-muted/50" />
                      </div>
                      <div>
                        <Label htmlFor="congressionalDistrict" className="text-muted-foreground">Congressional District</Label>
                        <Input id="congressionalDistrict" value={profile.congressionalDistrict || ''} disabled className="bg-muted/50" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Editable Profile Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                    <CardDescription>
                      Update your profile details and preferences.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="education">Education</Label>
                          <Select value={profile.education || ''} onValueChange={(value) => handleSelectChange('education', value)}>
                            <SelectTrigger id="education"><SelectValue placeholder="Select education level"/></SelectTrigger>
                            <SelectContent>
                              {educationOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="profession">Profession</Label>
                          <Select value={profile.profession || ''} onValueChange={(value) => handleSelectChange('profession', value)}>
                            <SelectTrigger id="profession"><SelectValue placeholder="Select profession"/></SelectTrigger>
                            <SelectContent>
                              {professionOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="militaryService">Military Service</Label>
                          <Select
                            value={profile.militaryService?.toString() || ''}
                            onValueChange={(value) => handleSelectChange('militaryService', value)}
                          >
                            <SelectTrigger id="militaryService"><SelectValue placeholder="Select status"/></SelectTrigger>
                            <SelectContent>
                              {militaryOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="mt-6">
                        <Label htmlFor="constituentDescription">Describe yourself as a constituent</Label>
                        <Textarea
                          id="constituentDescription"
                          name="constituentDescription"
                          value={profile.constituentDescription || ''}
                          onChange={handleInputChange}
                          placeholder="Share your background, values, and what matters most to you as a constituent..."
                          className="min-h-[120px] mt-2"
                        />
                      </div>

                      <div className="flex justify-end gap-2 mt-6">
                        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                      </div>
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