'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { Menu, ChevronRight, Megaphone, Home, Users, BarChart3 } from 'lucide-react';
import { DashboardSelection, UserType } from '@/lib/campaigns';
import { US_STATES, convertStateToSlug } from '@/lib/states';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

const advocacyGroups = [
    { name: 'League of Women Voters', slug: 'league-of-women-voters' },
    { name: 'Brennan Center for Justice', slug: 'brennan-center-for-justice' },
    { name: 'Common Cause', slug: 'common-cause' },
    { name: 'Fair Elections Center', slug: 'fair-elections-center' },
    { name: 'FairVote', slug: 'fairvote' },
    { name: 'Vote Smart', slug: 'vote-smart' },
    { name: 'VoteRiders', slug: 'voteriders' },
    { name: 'Rock the Vote', slug: 'rock-the-vote' },
    { name: 'Mi Familia Vota', slug: 'mi-familia-vota' },
    { name: 'Black Voters Matter', slug: 'black-voters-matter' },
    { name: 'When We All Vote', slug: 'when-we-all-vote' },
    { name: 'Fair Fight Action', slug: 'fair-fight-action' },
    { name: 'Campaign Legal Center', slug: 'campaign-legal-center' },
    { name: 'BallotReady', slug: 'ballotready' },
    { name: 'Democracy Works (TurboVote)', slug: 'democracy-works-turbovote' },
    { name: 'HeadCount', slug: 'headcount' },
    { name: 'State Voices', slug: 'state-voices' },
    { name: 'Asian Americans Advancing Justice', slug: 'asian-americans-advancing-justice' },
    { name: 'NAACP Legal Defense Fund', slug: 'naacp-legal-defense-fund' },
    { name: 'Voto Latino', slug: 'voto-latino' },
    { name: 'Alliance for Youth Action', slug: 'alliance-for-youth-action' },
    { name: 'National Vote at Home Institute', slug: 'national-vote-at-home-institute' },
    { name: 'National Voter Registration Day', slug: 'national-voter-registration-day' },
    { name: 'Democracy NC', slug: 'democracy-nc' },
    { name: 'The Civics Center', slug: 'the-civics-center' },
    { name: 'No Labels', slug: 'no-labels' },
].sort((a, b) => a.name.localeCompare(b.name));


interface Campaign {
    id: string;
    bill: {
        type: string;
        number: string;
        title?: string;
    };
    position: string;
    reasoning: string;
    supportCount: number;
    opposeCount: number;
}

interface SimpleMember {
    bioguideId: string;
    name: string;
    state: string;
    district?: string;
    party?: string;
}

// Helper to convert state name to abbreviation
const getStateAbbreviation = (stateName: string): string => {
    const stateMap: { [key: string]: string } = {
        'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
        'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
        'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
        'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
        'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
        'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
        'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
        'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
        'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
        'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
    };
    return stateMap[stateName] || '';
};

export default function PartnersPage() {
    const { user, loading } = useAuth();
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);

    // New state for user type and member selection
    const [userType, setUserType] = useState<UserType>('organization');
    const [selectedState, setSelectedState] = useState<string>('');
    const [selectedMember, setSelectedMember] = useState<SimpleMember | null>(null);
    const [members, setMembers] = useState<SimpleMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Load saved selection from localStorage on mount
    useEffect(() => {
        try {
            const savedSelection = localStorage.getItem('dashboard-selection');
            if (savedSelection) {
                const selection: DashboardSelection = JSON.parse(savedSelection);
                if (selection.type === 'organization') {
                    setUserType('organization');
                    setSelectedGroup(selection.groupSlug);
                } else {
                    setUserType('member');
                    setSelectedState(selection.stateName);
                    setSelectedMember({
                        bioguideId: selection.bioguideId,
                        name: selection.memberName,
                        state: selection.stateName
                    });
                }
            } else {
                // Fallback to old format for backward compatibility
                const savedGroup = localStorage.getItem('dashboard-selected-group');
                if (savedGroup) {
                    setUserType('organization');
                    setSelectedGroup(savedGroup);
                }
            }
        } catch (error) {
            console.error('Error loading saved selection:', error);
        }
    }, []);

    // Save selection to localStorage
    useEffect(() => {
        try {
            if (userType === 'organization' && selectedGroup) {
                const selection: DashboardSelection = {
                    type: 'organization',
                    groupSlug: selectedGroup
                };
                localStorage.setItem('dashboard-selection', JSON.stringify(selection));
            } else if (userType === 'member' && selectedMember) {
                const selection: DashboardSelection = {
                    type: 'member',
                    bioguideId: selectedMember.bioguideId,
                    memberName: selectedMember.name,
                    stateName: selectedMember.state
                };
                localStorage.setItem('dashboard-selection', JSON.stringify(selection));
            } else {
                localStorage.removeItem('dashboard-selection');
            }
        } catch (error) {
            console.error('Error saving selection:', error);
        }
    }, [userType, selectedGroup, selectedMember]);

    // Fetch members when state is selected
    useEffect(() => {
        const fetchMembers = async () => {
            if (userType !== 'member' || !selectedState) {
                setMembers([]);
                return;
            }

            setLoadingMembers(true);
            try {
                const stateAbbr = getStateAbbreviation(selectedState);
                const response = await fetch(`/api/congress/members?congress=119&state=${stateAbbr}`);
                const data = await response.json();

                if (response.ok && data) {
                    const allMembers: SimpleMember[] = [];

                    // Process senators
                    if (data.senators) {
                        data.senators.forEach((member: any) => {
                            allMembers.push({
                                bioguideId: member.bioguideId,
                                name: `${member.name} (Sen.)`,
                                state: selectedState,
                                party: member.partyName
                            });
                        });
                    }

                    // Process representatives
                    if (data.representatives) {
                        data.representatives.forEach((member: any) => {
                            const district = member.district ? `-${member.district}` : '';
                            allMembers.push({
                                bioguideId: member.bioguideId,
                                name: `${member.name} (Rep.${district})`,
                                state: selectedState,
                                district: member.district,
                                party: member.partyName
                            });
                        });
                    }

                    // Sort by name
                    allMembers.sort((a, b) => a.name.localeCompare(b.name));
                    setMembers(allMembers);
                }
            } catch (error) {
                console.error('Error fetching members:', error);
                setMembers([]);
            } finally {
                setLoadingMembers(false);
            }
        };

        fetchMembers();
    }, [userType, selectedState]);

    // Load campaigns for selected group or member
    useEffect(() => {
        const loadCampaigns = async () => {
            if (!user) {
                setCampaigns([]);
                return;
            }

            if (userType === 'organization' && !selectedGroup) {
                setCampaigns([]);
                return;
            }

            if (userType === 'member' && !selectedMember) {
                setCampaigns([]);
                return;
            }

            try {
                const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore');
                const { app } = await import('@/lib/firebase');

                const db = getFirestore(app);

                let campaignsQuery;
                if (userType === 'organization') {
                    campaignsQuery = query(
                        collection(db, 'campaigns'),
                        where('userId', '==', user.uid),
                        where('groupSlug', '==', selectedGroup)
                    );
                } else {
                    campaignsQuery = query(
                        collection(db, 'campaigns'),
                        where('userId', '==', user.uid),
                        where('bioguideId', '==', selectedMember?.bioguideId)
                    );
                }

                const querySnapshot = await getDocs(campaignsQuery);
                const campaignsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    bill: {
                        type: doc.data().billType,
                        number: doc.data().billNumber,
                        title: doc.data().billTitle
                    },
                    position: doc.data().position,
                    reasoning: doc.data().reasoning,
                    supportCount: doc.data().supportCount || 0,
                    opposeCount: doc.data().opposeCount || 0,
                    ...doc.data()
                }));

                setCampaigns(campaignsData);
            } catch (error) {
                console.error('Error fetching campaigns:', error);
                setCampaigns([]);
            }
        };

        loadCampaigns();
    }, [userType, selectedGroup, selectedMember, user]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md p-8 text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Access Restricted</CardTitle>
                        <CardDescription>Please log in to view campaigns.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/login">Log In</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Determine the correct manage campaigns href based on selection type
    const getManageCampaignsHref = () => {
        if (userType === 'organization' && selectedGroup) {
            return `/partners/groups/${selectedGroup}/campaigns`;
        } else if (userType === 'member' && selectedMember) {
            // Link to member page with campaigns anchor
            const stateSlug = convertStateToSlug(selectedMember.state);
            return `/federal/congress/119/states/${stateSlug}/${selectedMember.bioguideId}#campaigns`;
        }
        return '/partners';
    };

    const dashboardNavItems = [
        { label: 'Partners Home', href: '/partners', icon: Home, isActive: true },
        {
            label: 'Manage page',
            href: selectedGroup ? `/partners/groups/${selectedGroup}/edit` : '/partners',
            icon: Users,
            hidden: userType === 'member' // Hide for members
        },
        {
            label: 'Manage Campaigns',
            href: getManageCampaignsHref(),
            icon: Megaphone
        },
    ].filter(item => !item.hidden);

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
                        Partners Navigation
                    </Button>
                </div>

                {/* Mobile Navigation Dropdown */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden mb-6">
                        <Card>
                            <CardContent className="p-0">
                                <nav className="space-y-1">
                                    {dashboardNavItems.map((item, index) => (
                                        <Link
                                            key={`mobile-${item.href}-${index}`}
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
                                        <CardTitle className="text-lg">Partners</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <nav className="space-y-1">
                                            {dashboardNavItems.map((item, index) => (
                                                <Link
                                                    key={`${item.href}-${index}`}
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
                                    {userType === 'organization' && selectedGroup
                                        ? `Welcome, ${advocacyGroups.find(g => g.slug === selectedGroup)?.name || selectedGroup}`
                                        : userType === 'member' && selectedMember
                                        ? `Managing: ${selectedMember.name}`
                                        : 'Partners'
                                    }
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Manage and monitor your advocacy campaigns.
                                </p>
                            </header>

                            <main className="space-y-8">

                                <div className="mb-6">
                                    <div className="mb-3">
                                        <h2 className="text-xl font-semibold">You are managing:</h2>
                                    </div>

                                    {/* User Type Selection */}
                                    <div className="w-full max-w-sm mb-4">
                                        <label className="text-sm font-medium mb-2 block">Select User Type</label>
                                        <Select
                                            value={userType}
                                            onValueChange={(value: UserType) => {
                                                setUserType(value);
                                                // Reset selections when changing type
                                                setSelectedGroup('');
                                                setSelectedState('');
                                                setSelectedMember(null);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select user type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="organization">Organization</SelectItem>
                                                <SelectItem value="member">Member of Congress</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Organization Selection */}
                                    {userType === 'organization' && (
                                        <div className="w-full max-w-sm">
                                            <label className="text-sm font-medium mb-2 block">Select Organization</label>
                                            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an advocacy group" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {advocacyGroups.map((group) => (
                                                        <SelectItem key={group.slug} value={group.slug}>
                                                            {group.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Member Selection */}
                                    {userType === 'member' && (
                                        <div className="space-y-4 w-full max-w-sm">
                                            {/* State Selection */}
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">Select State</label>
                                                <Select
                                                    value={selectedState}
                                                    onValueChange={(value) => {
                                                        setSelectedState(value);
                                                        setSelectedMember(null); // Reset member when state changes
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a state" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {US_STATES.map((state) => (
                                                            <SelectItem key={state} value={state}>
                                                                {state}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Member Selection - only show if state is selected */}
                                            {selectedState && (
                                                <div>
                                                    <label className="text-sm font-medium mb-2 block">Select Member</label>
                                                    {loadingMembers ? (
                                                        <div className="text-sm text-muted-foreground">Loading members...</div>
                                                    ) : (
                                                        <Select
                                                            value={selectedMember?.bioguideId || ''}
                                                            onValueChange={(value) => {
                                                                const member = members.find(m => m.bioguideId === value);
                                                                setSelectedMember(member || null);
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a member" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {members.map((member) => (
                                                                    <SelectItem key={member.bioguideId} value={member.bioguideId}>
                                                                        {member.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Campaign Summary Card */}
                                {campaigns.length > 0 && (userType === 'organization' ? selectedGroup : selectedMember) && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <BarChart3 className="h-5 w-5" />
                                                Campaign Summary for {userType === 'organization'
                                                    ? advocacyGroups.find(g => g.slug === selectedGroup)?.name
                                                    : selectedMember?.name
                                                }
                                            </CardTitle>
                                            <CardDescription>
                                                Overview of all your campaigns and their performance
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-foreground mb-1">
                                                        {campaigns.length}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">Active Campaigns</div>
                                                </div>
                                                
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-green-600 mb-1">
                                                        {campaigns.reduce((sum, campaign) => sum + (campaign.supportCount || 0), 0).toLocaleString()}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">Total Support</div>
                                                </div>
                                                
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-red-600 mb-1">
                                                        {campaigns.reduce((sum, campaign) => sum + (campaign.opposeCount || 0), 0).toLocaleString()}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">Total Oppose</div>
                                                </div>
                                                
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-blue-600 mb-1">
                                                        {Math.floor(campaigns.reduce((sum, campaign) => 
                                                            sum + ((campaign.supportCount || 0) + (campaign.opposeCount || 0)) * 0.75, 0
                                                        )).toLocaleString()}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">Emails Sent</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                <div className="grid gap-6">
                                    {(userType === 'organization' && selectedGroup) || (userType === 'member' && selectedMember) ? (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Quick Actions</CardTitle>
                                                <CardDescription>
                                                    Navigate to different sections using the options below.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Link href={getManageCampaignsHref()} className="block">
                                                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                                                            <CardContent className="p-6">
                                                                <div className="flex items-start gap-3">
                                                                    <Megaphone className="h-5 w-5 mt-0.5" />
                                                                    <div className="flex-1">
                                                                        <h3 className="font-semibold mb-1">Manage Campaigns</h3>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            View and manage your advocacy campaigns.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </Link>

                                                    {userType === 'organization' && (
                                                        <Link href={`/partners/groups/${selectedGroup}/edit`} className="block">
                                                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                                                                <CardContent className="p-6">
                                                                    <div className="flex items-start gap-3">
                                                                        <Users className="h-5 w-5 mt-0.5" />
                                                                        <div className="flex-1">
                                                                            <h3 className="font-semibold mb-1">Edit Group Page</h3>
                                                                            <p className="text-sm text-muted-foreground">
                                                                                Update your organization's information and settings.
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        </Link>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>
                                                    {userType === 'organization' ? 'Select an Advocacy Group' : 'Select a Member of Congress'}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-muted-foreground">
                                                    {userType === 'organization'
                                                        ? 'Please select an advocacy group above to manage their page and campaigns.'
                                                        : 'Please select a state and member above to manage their campaigns.'
                                                    }
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </main>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}