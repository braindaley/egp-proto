'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, User } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Menu, ChevronRight, User as UserIcon, Settings, MessageSquare, Crown, BarChart3 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function InterestsPage() {
  const { user, loading } = useAuth();
  const [policyInterests, setPolicyInterests] = useState({
    ageGenerations: 2,
    economyWork: 2,
    familyRelationships: 2,
    immigrationMigration: 2,
    internationalAffairs: 2,
    politicsPolicy: 2,
    raceEthnicity: 2,
    religion: 2,
    science: 2,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const db = getFirestore(app);

  useEffect(() => {
    if (user) {
      setPolicyInterests({
        ageGenerations: user.policyInterests?.ageGenerations ?? 2,
        economyWork: user.policyInterests?.economyWork ?? 2,
        familyRelationships: user.policyInterests?.familyRelationships ?? 2,
        immigrationMigration: user.policyInterests?.immigrationMigration ?? 2,
        internationalAffairs: user.policyInterests?.internationalAffairs ?? 2,
        politicsPolicy: user.policyInterests?.politicsPolicy ?? 2,
        raceEthnicity: user.policyInterests?.raceEthnicity ?? 2,
        religion: user.policyInterests?.religion ?? 2,
        science: user.policyInterests?.science ?? 2,
      });
    }
  }, [user]);

  const handlePolicyInterestChange = (policyKey: string, value: number[]) => {
    console.log(`handlePolicyInterestChange called: ${policyKey} = ${value[0]}`);
    setPolicyInterests(prev => {
      const newInterests = {
        ...prev,
        [policyKey]: value[0]
      };
      console.log(`Policy interests updated. ${policyKey} is now:`, newInterests[policyKey as keyof typeof newInterests]);
      return newInterests;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { policyInterests }, { merge: true });
      router.push('/dashboard');
    } catch (error) {
      console.error("Error saving policy interests:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };
  
  if (loading) {
    return <p>Loading interests...</p>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

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

  const dashboardNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: UserIcon },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { label: 'Activity', href: '/dashboard/activity', icon: BarChart3 },
    { label: 'Membership', href: '/dashboard/membership', icon: Crown },
    { label: 'Edit Profile', href: '/dashboard/profile', icon: UserIcon },
    { label: 'Policy Interests', href: '/dashboard/interests', icon: Settings, isActive: true },
  ];

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
                  Policy Issue Interests
                </h1>
                <p className="text-muted-foreground mt-1">
                  Set your interest level for different policy areas to help tailor your advocacy messages.
                </p>
              </header>
              
              <main className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Interest Levels</CardTitle>
                    <CardDescription>
                      Adjust your interest level for each policy area using the sliders below.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
          <div className="space-y-6">
            {policyIssues.map((issue) => (
              <PolicySlider
                key={issue.key}
                id={issue.key}
                label={issue.label}
                value={policyInterests[issue.key as keyof typeof policyInterests]}
                onValueChange={(value) => handlePolicyInterestChange(issue.key, [value])}
              />
            ))}
          </div>
                  
                  <div className="flex justify-end gap-2 mt-8">
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
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