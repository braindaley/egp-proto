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
import { Menu, ChevronRight, User as UserIcon, Settings, MessageSquare, Crown, BarChart3, Lock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const dynamic = 'force-dynamic';

export default function InterestsPage() {
  const { user, loading, refreshUserData } = useAuth();
  const { toast } = useToast();

  // Check membership status from localStorage (for testing)
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsPremium(localStorage.getItem('testAsPremium') === 'true');
    }
  }, []);

  const [overallView, setOverallView] = useState(2);
  const [policyInterests, setPolicyInterests] = useState({
    agricultureFood: 2,
    animals: 2,
    defenseSecurity: 2,
    artsCulture: 2,
    civilRights: 2,
    commerce: 2,
    congress: 2,
    crimeLaw: 2,
    economyFinance: 2,
    education: 2,
    emergencyMgmt: 2,
    energy: 2,
    environment: 2,
    families: 2,
    bankingFinance: 2,
    trade: 2,
    government: 2,
    health: 2,
    housing: 2,
    immigration: 2,
    foreignAffairs: 2,
    labor: 2,
    law: 2,
    nativeIssues: 2,
    publicLands: 2,
    scienceTech: 2,
    socialWelfare: 2,
    sportsRecreation: 2,
    taxes: 2,
    transportation: 2,
    waterResources: 2,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const db = getFirestore(app);

  useEffect(() => {
    if (user) {
      setOverallView(user.overallView ?? 2);
      setPolicyInterests({
        agricultureFood: user.policyInterests?.agricultureFood ?? 2,
        animals: user.policyInterests?.animals ?? 2,
        defenseSecurity: user.policyInterests?.defenseSecurity ?? 2,
        artsCulture: user.policyInterests?.artsCulture ?? 2,
        civilRights: user.policyInterests?.civilRights ?? 2,
        commerce: user.policyInterests?.commerce ?? 2,
        congress: user.policyInterests?.congress ?? 2,
        crimeLaw: user.policyInterests?.crimeLaw ?? 2,
        economyFinance: user.policyInterests?.economyFinance ?? 2,
        education: user.policyInterests?.education ?? 2,
        emergencyMgmt: user.policyInterests?.emergencyMgmt ?? 2,
        energy: user.policyInterests?.energy ?? 2,
        environment: user.policyInterests?.environment ?? 2,
        families: user.policyInterests?.families ?? 2,
        bankingFinance: user.policyInterests?.bankingFinance ?? 2,
        trade: user.policyInterests?.trade ?? 2,
        government: user.policyInterests?.government ?? 2,
        health: user.policyInterests?.health ?? 2,
        housing: user.policyInterests?.housing ?? 2,
        immigration: user.policyInterests?.immigration ?? 2,
        foreignAffairs: user.policyInterests?.foreignAffairs ?? 2,
        labor: user.policyInterests?.labor ?? 2,
        law: user.policyInterests?.law ?? 2,
        nativeIssues: user.policyInterests?.nativeIssues ?? 2,
        publicLands: user.policyInterests?.publicLands ?? 2,
        scienceTech: user.policyInterests?.scienceTech ?? 2,
        socialWelfare: user.policyInterests?.socialWelfare ?? 2,
        sportsRecreation: user.policyInterests?.sportsRecreation ?? 2,
        taxes: user.policyInterests?.taxes ?? 2,
        transportation: user.policyInterests?.transportation ?? 2,
        waterResources: user.policyInterests?.waterResources ?? 2,
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
      await setDoc(userRef, { overallView, policyInterests }, { merge: true });
      // Refresh the user data to update the AuthContext
      await refreshUserData();
      console.log('Policy interests saved successfully');
      toast({
        title: "Success",
        description: "Your policy interests have been saved.",
      });
      // Small delay to show the toast
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error) {
      console.error("Error saving policy interests:", error);
      toast({
        title: "Error",
        description: "Failed to save policy interests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <p>Loading interests...</p>;
  }

  if (!user) {
    return null;
  }

  const policyIssues = [
    { key: 'agricultureFood', label: 'Agriculture & Food' },
    { key: 'animals', label: 'Animals' },
    { key: 'defenseSecurity', label: 'Defense & Security' },
    { key: 'artsCulture', label: 'Arts & Culture' },
    { key: 'civilRights', label: 'Civil Rights' },
    { key: 'commerce', label: 'Commerce' },
    { key: 'congress', label: 'Congress' },
    { key: 'crimeLaw', label: 'Crime & Law' },
    { key: 'economyFinance', label: 'Economy & Finance' },
    { key: 'education', label: 'Education' },
    { key: 'emergencyMgmt', label: 'Emergency Mgmt' },
    { key: 'energy', label: 'Energy' },
    { key: 'environment', label: 'Environment' },
    { key: 'families', label: 'Families' },
    { key: 'bankingFinance', label: 'Banking & Finance' },
    { key: 'trade', label: 'Trade' },
    { key: 'government', label: 'Government' },
    { key: 'health', label: 'Health' },
    { key: 'housing', label: 'Housing' },
    { key: 'immigration', label: 'Immigration' },
    { key: 'foreignAffairs', label: 'Foreign Affairs' },
    { key: 'labor', label: 'Labor' },
    { key: 'law', label: 'Law' },
    { key: 'nativeIssues', label: 'Native Issues' },
    { key: 'publicLands', label: 'Public Lands' },
    { key: 'scienceTech', label: 'Science & Tech' },
    { key: 'socialWelfare', label: 'Social Welfare' },
    { key: 'sportsRecreation', label: 'Sports & Recreation' },
    { key: 'taxes', label: 'Taxes' },
    { key: 'transportation', label: 'Transportation' },
    { key: 'waterResources', label: 'Water Resources' },
  ];

  const viewLabels = ['No Interest', 'Low', 'Neutral', 'Moderate', 'High Interest'];
  const viewExplanations = [
    'Not interested in this topic',
    'Slightly interested in this topic',
    'Neutral interest level',
    'Moderately interested in this topic',
    'Highly interested in this topic'
  ];

  const dashboardNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: UserIcon },
    { label: 'Edit Profile', href: '/dashboard/profile', icon: UserIcon },
    { label: 'Membership', href: '/dashboard/membership', icon: Crown },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { label: 'Activity', href: '/dashboard/activity', icon: BarChart3 },
    { label: 'Following', href: '/dashboard/following', icon: Eye },
    { label: 'Policy Interests', href: '/dashboard/interests', icon: Settings, isActive: true },
  ];

  const PolicySlider = ({
    id,
    value,
    onValueChange,
    label,
    showExplanation = false
  }: {
    id: string;
    value: number;
    onValueChange: (value: number) => void;
    label: string;
    showExplanation?: boolean;
  }) => {
    console.log(`PolicySlider ${label}: value=${value}, viewLabels[${value}]=${viewLabels[value]}`);

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor={id}>{label}</Label>
          <span className="text-sm text-muted-foreground">
            {viewLabels[value]}
          </span>
        </div>
        {showExplanation && (
          <p className="text-xs text-muted-foreground">
            {viewExplanations[value]}
          </p>
        )}
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
        <div className="flex justify-between text-xs gap-1">
          {viewLabels.map((level, index) => (
            <button
              key={level}
              type="button"
              className={cn(
                "hover:text-foreground transition-colors cursor-pointer px-2 py-1 rounded border border-transparent hover:border-gray-300 text-center flex-1",
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
                  Policy Interests
                </h1>
                <p className="text-muted-foreground mt-1">
                  Set your interest level overall and for different policy areas to help personalize your experience.
                </p>
              </header>

              <main className="space-y-8">
                {isPremium ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Overall Interest Level</CardTitle>
                        <CardDescription>
                          Select your general interest level across all policy topics.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <PolicySlider
                          id="overallView"
                          label="Overall Interest"
                          value={overallView}
                          onValueChange={setOverallView}
                          showExplanation={true}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Policy-Specific Interests</CardTitle>
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
                  </>
                ) : (
                  <Card className="relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 z-10 flex items-center justify-center">
                      <div className="text-center p-8">
                        <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">Upgrade to Premium</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Customize your policy interests to receive personalized bill recommendations and advocacy opportunities
                        </p>
                        <Button asChild size="lg" className="gap-2">
                          <Link href="/dashboard/membership">
                            <Crown className="h-4 w-4" />
                            Upgrade Now
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                            <div className="h-2 bg-gray-200 rounded w-full animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}