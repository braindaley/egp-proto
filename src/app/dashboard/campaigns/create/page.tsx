'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { campaignsService } from '@/lib/campaigns';
import type { Bill } from '@/types';
import debounce from 'lodash/debounce';

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

export default function CreateCampaignPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    
    const [selectedGroup, setSelectedGroup] = useState<string>(searchParams.get('group') || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Bill[]>([]);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [position, setPosition] = useState<'Support' | 'Oppose'>('Support');
    const [reasoning, setReasoning] = useState('');
    const [actionButtonText, setActionButtonText] = useState('Voice your opinion');
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Debounced search function
    const searchBills = useCallback(
        debounce(async (query: string) => {
            if (query.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const response = await fetch(`/api/bills/search?congress=119&limit=10`);
                if (response.ok) {
                    const data = await response.json();
                    setSearchResults(data.bills || []);
                }
            } catch (error) {
                console.error('Error searching bills:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500),
        []
    );

    useEffect(() => {
        searchBills(searchQuery);
    }, [searchQuery, searchBills]);

    const handleSave = async () => {
        if (!selectedGroup || !selectedBill || !reasoning) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSaving(true);
        try {
            const groupName = advocacyGroups.find(g => g.slug === selectedGroup)?.name || '';
            
            const response = await fetch('/api/campaigns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    groupSlug: selectedGroup,
                    groupName,
                    bill: {
                        congress: selectedBill.congress,
                        type: selectedBill.type,
                        number: selectedBill.number,
                        title: selectedBill.title
                    },
                    position,
                    reasoning,
                    actionButtonText
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create campaign');
            }

            // Redirect to the campaign landing page
            router.push(`/groups/${selectedGroup}/${selectedBill.type.toLowerCase()}-${selectedBill.number}`);
        } catch (error) {
            console.error('Error creating campaign:', error);
            alert(error instanceof Error ? error.message : 'Failed to create campaign');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading) {
        return <p>Loading...</p>;
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md p-8 text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Access Restricted</CardTitle>
                        <CardDescription>Please log in to create campaigns.</CardDescription>
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

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-[800px]">
            <header className="mb-8">
                <h1 className="text-3xl font-bold font-headline">Create New Campaign</h1>
                <p className="text-muted-foreground mt-2">
                    Create a new advocacy campaign for a bill.
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Group Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="group">Advocacy Group *</Label>
                        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                            <SelectTrigger id="group">
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

                    {/* Bill Search */}
                    <div className="space-y-2">
                        <Label htmlFor="bill-search">Select Bill *</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="bill-search"
                                placeholder="Search for a bill by number or title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        
                        {/* Search Results */}
                        {(isSearching || searchResults.length > 0) && (
                            <Card className="mt-2 max-h-64 overflow-y-auto">
                                <CardContent className="p-2">
                                    {isSearching ? (
                                        <div className="flex items-center justify-center p-4">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="ml-2">Searching...</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {searchResults.map((bill) => (
                                                <button
                                                    key={`${bill.type}-${bill.number}`}
                                                    onClick={() => {
                                                        setSelectedBill(bill);
                                                        setSearchQuery(`${bill.type} ${bill.number} - ${bill.title}`);
                                                        setSearchResults([]);
                                                    }}
                                                    className="w-full text-left p-2 hover:bg-accent rounded-md transition-colors"
                                                >
                                                    <div className="font-medium">{bill.type} {bill.number}</div>
                                                    <div className="text-sm text-muted-foreground line-clamp-1">
                                                        {bill.title}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Selected Bill Display */}
                        {selectedBill && (
                            <Card className="mt-2 bg-secondary/50">
                                <CardContent className="p-4">
                                    <div className="font-medium">Selected: {selectedBill.type} {selectedBill.number}</div>
                                    <div className="text-sm text-muted-foreground">{selectedBill.title}</div>
                                    <Link 
                                        href={`/bill/${selectedBill.congress}/${selectedBill.type.toLowerCase()}/${selectedBill.number}`}
                                        target="_blank"
                                        className="text-sm text-primary hover:underline mt-1 inline-block"
                                    >
                                        View bill details →
                                    </Link>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Position */}
                    <div className="space-y-2">
                        <Label htmlFor="position">Position *</Label>
                        <Select value={position} onValueChange={(value) => setPosition(value as 'Support' | 'Oppose')}>
                            <SelectTrigger id="position">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Support">Support</SelectItem>
                                <SelectItem value="Oppose">Oppose</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Reasoning */}
                    <div className="space-y-2">
                        <Label htmlFor="reasoning">Reasoning *</Label>
                        <Textarea
                            id="reasoning"
                            placeholder="Explain why your organization supports or opposes this bill. You can use Markdown formatting."
                            value={reasoning}
                            onChange={(e) => setReasoning(e.target.value)}
                            rows={8}
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            Supports Markdown formatting. Use ### for headings, ** for bold, * for bullet points.
                        </p>
                    </div>

                    {/* Action Button Text */}
                    <div className="space-y-2">
                        <Label htmlFor="action-text">Action Button Text</Label>
                        <Input
                            id="action-text"
                            placeholder="Text for the action button"
                            value={actionButtonText}
                            onChange={(e) => setActionButtonText(e.target.value)}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={!selectedGroup || !selectedBill || !reasoning || isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Campaign'
                            )}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/campaigns">Cancel</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}