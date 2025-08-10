
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, User } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';

const ProfileManager: React.FC = () => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const db = getFirestore(app);

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        birthYear: user.birthYear || undefined,
        gender: user.gender || '',
        politicalAffiliation: user.politicalAffiliation || '',
        education: user.education || '',
        profession: user.profession || '',
        militaryService: user.militaryService || false,
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setProfile(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { ...profile, updatedAt: new Date() }, { merge: true });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (loading) {
    return <p>Loading profile...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>
          This information helps tailor your advocacy messages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" value={profile.firstName} onChange={handleInputChange} />
                </div>
                <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" value={profile.lastName} onChange={handleInputChange} />
                </div>
                <div>
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" value={profile.address} onChange={handleInputChange} />
                </div>
                 <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" value={profile.city} onChange={handleInputChange} />
                </div>
                 <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" name="state" value={profile.state} onChange={handleInputChange} />
                </div>
                <div>
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input id="zipCode" name="zipCode" value={profile.zipCode} onChange={handleInputChange} />
                </div>
                 <div>
                    <Label htmlFor="birthYear">Birth Year</Label>
                    <Input id="birthYear" name="birthYear" type="number" value={profile.birthYear || ''} onChange={handleInputChange} />
                </div>
                <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Input id="gender" name="gender" value={profile.gender} onChange={handleInputChange} />
                </div>
                <div>
                    <Label htmlFor="politicalAffiliation">Party Affiliation</Label>
                    <Input id="politicalAffiliation" name="politicalAffiliation" value={profile.politicalAffiliation} onChange={handleInputChange} />
                </div>
                <div>
                    <Label htmlFor="education">Education</Label>
                    <Input id="education" name="education" value={profile.education} onChange={handleInputChange} />
                </div>
                 <div>
                    <Label htmlFor="profession">Profession</Label>
                    <Input id="profession" name="profession" value={profile.profession} onChange={handleInputChange} />
                </div>
                 <div className="flex items-center">
                    <input type="checkbox" id="militaryService" name="militaryService" checked={profile.militaryService} onChange={handleInputChange} className="mr-2"/>
                    <Label htmlFor="militaryService">Military Service</Label>
                </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </div>
        ) : (
          <div>
            <ul className="space-y-2">
              <li><strong>Full Name:</strong> {profile.firstName} {profile.lastName}</li>
              <li><strong>Address:</strong> {profile.address}, {profile.city}, {profile.state} {profile.zipCode}</li>
              <li><strong>Age:</strong> {profile.birthYear ? new Date().getFullYear() - profile.birthYear : 'N/A'}</li>
              <li><strong>Gender:</strong> {profile.gender || 'N/A'}</li>
              <li><strong>Party Affiliation:</strong> {profile.politicalAffiliation || 'N/A'}</li>
              <li><strong>Education:</strong> {profile.education || 'N/A'}</li>
              <li><strong>Profession:</strong> {profile.profession || 'N/A'}</li>
              <li><strong>Military Service:</strong> {profile.militaryService ? 'Yes' : 'No'}</li>
            </ul>
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
