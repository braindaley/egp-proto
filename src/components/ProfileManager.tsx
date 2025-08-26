
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, User } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';
import { useZipCode } from '@/hooks/use-zip-code';
import { useMembersByZip } from '@/hooks/useMembersByZip';

interface ProfileManagerProps {
  showEditForm?: boolean;
  onCancel?: () => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ showEditForm = false, onCancel }) => {
  const { user, loading } = useAuth();
  const { zipCode: cookieZipCode } = useZipCode();
  const { representatives } = useMembersByZip(cookieZipCode);
  const [profile, setProfile] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(showEditForm);
  const [isSaving, setIsSaving] = useState(false);
  const db = getFirestore(app);

  useEffect(() => {
    if (user) {
      setProfile({
        role: user.role || 'Retail',
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
        policyInterests: user.policyInterests || {
          ageGenerations: 2,
          economyWork: 2,
          familyRelationships: 2,
          immigrationMigration: 2,
          internationalAffairs: 2,
          politicsPolicy: 2,
          raceEthnicity: 2,
          religion: 2,
          science: 2,
        },
      });
    }
  }, [user, cookieZipCode]);

  useEffect(() => {
    setIsEditing(showEditForm);
  }, [showEditForm]);

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

  const handlePolicyInterestChange = (policyKey: string, value: number[]) => {
    console.log(`handlePolicyInterestChange called: ${policyKey} = ${value[0]}`);
    setProfile(prev => {
      const newProfile = {
        ...prev,
        policyInterests: {
          ...prev.policyInterests,
          [policyKey]: value[0]
        }
      };
      console.log(`Profile updated. ${policyKey} is now:`, newProfile.policyInterests?.[policyKey as keyof typeof newProfile.policyInterests]);
      return newProfile;
    });
  };


  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { ...profile, birthYear: Number(profile.birthYear) }, { merge: true });
      setIsEditing(false);
      if (onCancel) onCancel();
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (onCancel) onCancel();
  };
  
  if (loading) {
    return <p>Loading profile...</p>;
  }
  
  const birthYears = Array.from({length: 100}, (_, i) => new Date().getFullYear() - i - 18);
  const genderOptions = ['Female', 'Male', 'Non-binary', 'Other', 'Prefer not to say'];
  const partyOptions = ['Democrat', 'Republican', 'Independent', 'Libertarian', 'Green Party', 'Other', 'No Affiliation'];
  const educationOptions = ['High School', 'Some College', 'Associate Degree', "Bachelor's Degree", "Master's Degree", "Doctoral Degree", "Professional Degree"];
  const professionOptions = [
    'Technology', 'Healthcare', 'Education', 'Finance', 'Law', 'Skilled Trades', 'Sales & Marketing', 'Arts & Entertainment', 
    'Science & Research', 'Government & Public Service', 'Business & Management', 'Student', 'Homemaker', 'Retired', 'Other'
  ];
   const militaryOptions = [{label: 'Yes', value: 'true'}, {label: 'No', value: 'false'}];
  const roleOptions = ['Wholesale', 'Retail'];

  const policyIssues = [
    { key: 'ageGenerations', label: 'Age & Generations' },
    { key: 'economyWork', label: 'Economy & Work' },
    { key: 'familyRelationships', label: 'Family & Relationships' },
    { key: 'immigrationMigration', label: 'Immigration & Migration' },
    { key: 'internationalAffairs', label: 'International Affairs' },
    { key: 'politicsPolicy', label: 'Politics & Policy' },
    { key: 'raceEthnicity', label: 'Race & Ethnicity' },
    { key: 'religion', label: 'Religion' },
    { key: 'science', label: 'Science' },
  ];

  const interestLevels = ['None', 'Low', 'Neutral', 'Medium', 'High'];

  // Custom PolicySlider component without filled appearance and with clickable labels
  const PolicySlider = ({ 
    id, 
    value, 
    onValueChange, 
    label 
  }: { 
    id: string; 
    value: number; 
    onValueChange: (value: number) => void;
    label: string;
  }) => {
    console.log(`PolicySlider ${label}: value=${value}, interestLevels[${value}]=${interestLevels[value]}`);
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor={id}>{label}</Label>
          <span className="text-sm text-muted-foreground">
            {interestLevels[value]}
          </span>
        </div>
        <div className="relative flex w-full touch-none select-none items-center">
          <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
            {/* No fill - this is a settings slider, not a progress indicator */}
          </div>
          <SliderPrimitive.Root
            id={id}
            min={0}
            max={4}
            step={1}
            value={[value]}
            onValueChange={(newValue) => {
              console.log(`Slider ${label} changed to:`, newValue[0]);
              onValueChange(newValue[0]);
            }}
            className="absolute inset-0 flex w-full touch-none select-none items-center"
          >
            <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-transparent">
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
          </SliderPrimitive.Root>
        </div>
        <div className="flex justify-between text-xs">
          {interestLevels.map((level, index) => (
            <button
              key={level}
              type="button"
              className={cn(
                "hover:text-foreground transition-colors cursor-pointer px-2 py-1 rounded border border-transparent hover:border-gray-300",
                value === index ? "text-foreground font-bold bg-blue-50 border-blue-200" : "text-muted-foreground"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Button ${level} (${index}) clicked for ${label}`);
                onValueChange(index);
              }}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    );
  };


  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0">
        <CardTitle>{showEditForm ? 'Edit Profile' : 'My Profile'}</CardTitle>
        <CardDescription>
          This information helps tailor your advocacy messages.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {isEditing ? (
          <div className="space-y-4">
            <div className="mb-6">
              <Label htmlFor="role">Role</Label>
              <Select value={profile.role || ''} onValueChange={(value) => handleSelectChange('role', value)}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" value={profile.firstName || ''} onChange={handleInputChange} />
                </div>
                <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" value={profile.lastName || ''} onChange={handleInputChange} />
                </div>
                <div>
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" value={profile.address || ''} onChange={handleInputChange} />
                </div>
                 <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" value={profile.city || ''} onChange={handleInputChange} />
                </div>
                 <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" name="state" value={profile.state || ''} onChange={handleInputChange} />
                </div>
                <div>
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input id="zipCode" name="zipCode" value={profile.zipCode || ''} onChange={handleInputChange} />
                </div>
                <div>
                    <Label htmlFor="congressionalDistrict">Congressional District</Label>
                    <Input id="congressionalDistrict" name="congressionalDistrict" value={profile.congressionalDistrict || ''} onChange={handleInputChange} placeholder="e.g., 5" />
                </div>
                 <div>
                    <Label htmlFor="birthYear">Birth Year</Label>
                    <Select
                        value={profile.birthYear?.toString() || ''}
                        onValueChange={(value) => handleSelectChange('birthYear', value)}
                    >
                        <SelectTrigger id="birthYear">
                            <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                            {birthYears.map(year => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={profile.gender || ''} onValueChange={(value) => handleSelectChange('gender', value)}>
                        <SelectTrigger id="gender"><SelectValue placeholder="Select gender"/></SelectTrigger>
                        <SelectContent>
                            {genderOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="politicalAffiliation">Party Affiliation</Label>
                    <Select value={profile.politicalAffiliation || ''} onValueChange={(value) => handleSelectChange('politicalAffiliation', value)}>
                        <SelectTrigger id="politicalAffiliation"><SelectValue placeholder="Select party"/></SelectTrigger>
                        <SelectContent>
                             {partyOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
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
            
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4">Policy Issue Interest</h3>
              <div className="space-y-4">
                {policyIssues.map((issue) => (
                  <PolicySlider
                    key={issue.key}
                    id={issue.key}
                    label={issue.label}
                    value={profile.policyInterests?.[issue.key as keyof typeof profile.policyInterests] ?? 2}
                    onValueChange={(value) => handlePolicyInterestChange(issue.key, [value])}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </div>
        ) : (
          <div>
            <ul className="space-y-2">
              <li><strong>Role:</strong> {profile.role || 'N/A'}</li>
              <li><strong>Full Name:</strong> {profile.firstName} {profile.lastName}</li>
              <li><strong>Address:</strong> {profile.address}, {profile.city}, {profile.state} {profile.zipCode}</li>
              <li><strong>Congressional District:</strong> {profile.congressionalDistrict || 'N/A'}</li>
              <li><strong>Age:</strong> {profile.birthYear ? new Date().getFullYear() - profile.birthYear : 'N/A'}</li>
              <li><strong>Gender:</strong> {profile.gender || 'N/A'}</li>
              <li><strong>Party Affiliation:</strong> {profile.politicalAffiliation || 'N/A'}</li>
              <li><strong>Education:</strong> {profile.education || 'N/A'}</li>
              <li><strong>Profession:</strong> {profile.profession || 'N/A'}</li>
              <li><strong>Military Service:</strong> {profile.militaryService ? 'Yes' : 'No'}</li>
            </ul>
            
            {profile.constituentDescription && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-semibold mb-2">About Me as a Constituent</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.constituentDescription}</p>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-semibold mb-3">Policy Issue Interest</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {policyIssues.map((issue) => (
                  <div key={issue.key} className="flex justify-between">
                    <span>{issue.label}:</span>
                    <span className="font-medium">
                      {interestLevels[profile.policyInterests?.[issue.key as keyof typeof profile.policyInterests] || 2]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
             <p className="text-sm text-muted-foreground mt-4">Voting precinct is inferred from your zip code.</p>
            <div className="flex justify-end mt-4">
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileManager;
