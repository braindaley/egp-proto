'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
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
import type { SiteIssueCategory } from '@/lib/policy-area-mapping';
import { SITE_ISSUE_CATEGORIES } from '@/lib/policy-area-mapping';
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

function CreateCampaignPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    
    const [selectedGroup, setSelectedGroup] = useState<string>(searchParams.get('group') || '');
    const [campaignType, setCampaignType] = useState<'Legislation' | 'Issue' | 'Town Hall Calling' | 'Candidate Advocacy' | 'Voter Registration' | 'Voter Poll'>('Legislation');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Bill[]>([]);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [selectedIssue, setSelectedIssue] = useState<SiteIssueCategory | null>(null);
    const [customIssue, setCustomIssue] = useState('');
    const [issueSpecificTitle, setIssueSpecificTitle] = useState('');
    const [position, setPosition] = useState<string>('Support');
    const [reasoning, setReasoning] = useState('');
    const [actionButtonText, setActionButtonText] = useState('Voice your opinion');
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Candidate campaign fields
    const [candidate1Name, setCandidate1Name] = useState('');
    const [candidate1Bio, setCandidate1Bio] = useState('');
    const [candidate2Name, setCandidate2Name] = useState('');
    const [candidate2Bio, setCandidate2Bio] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState<1 | 2>(1);

    // Campaign dates
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Debounced search function
    const searchBills = useCallback(
        debounce(async (query: string) => {
            if (query.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const response = await fetch(`/api/bills/search?congress=119&q=${encodeURIComponent(query)}&limit=10`);
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
        // Validate required fields based on campaign type
        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }

        // Validate end date is after start date
        if (new Date(endDate) <= new Date(startDate)) {
            alert('End date must be after start date');
            return;
        }

        if (campaignType === 'Issue') {
            if (!selectedGroup || !selectedIssue || !issueSpecificTitle || !reasoning) {
                alert('Please fill in all required fields');
                return;
            }
        } else if (campaignType === 'Candidate Advocacy') {
            if (!selectedGroup || !candidate1Name || !candidate2Name || !reasoning) {
                alert('Please fill in all required fields (both candidate names and reasoning)');
                return;
            }
        } else {
            if (!selectedGroup || !selectedBill || !reasoning) {
                alert('Please fill in all required fields');
                return;
            }
        }

        setIsSaving(true);
        try {
            const groupName = advocacyGroups.find(g => g.slug === selectedGroup)?.name || '';

            let requestBody: any = {
                userId: user?.uid,
                groupSlug: selectedGroup,
                groupName,
                position,
                reasoning,
                actionButtonText,
                campaignType,
                startDate,
                endDate
            };

            if (campaignType === 'Candidate Advocacy') {
                // For Candidate campaigns
                requestBody = {
                    ...requestBody,
                    candidate: {
                        candidate1Name,
                        candidate1Bio,
                        candidate2Name,
                        candidate2Bio,
                        selectedCandidate
                    },
                    // Use candidate data for display
                    billTitle: `${candidate1Name} vs ${candidate2Name}`,
                    billType: 'CANDIDATE',
                    billNumber: `${selectedCandidate}`,
                    congress: '119' // Default congress for categorization
                };
            } else if (campaignType === 'Issue') {
                // For Issue campaigns
                const issueTitle = selectedIssue;
                requestBody = {
                    ...requestBody,
                    issueTitle,
                    issueSpecificTitle,
                    // Use issue data instead of bill data
                    billTitle: issueSpecificTitle,
                    billType: 'ISSUE',
                    billNumber: issueTitle?.replace(/[^a-z0-9-]/g, '').toLowerCase() || 'issue',
                    congress: '119' // Default congress for categorization
                };
            } else {
                // For Legislation campaigns
                requestBody = {
                    ...requestBody,
                    bill: {
                        congress: selectedBill.congress,
                        type: selectedBill.type,
                        number: selectedBill.number,
                        title: selectedBill.title
                    }
                };
            }

            const response = await fetch('/api/campaigns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create campaign');
            }

            // Redirect to the group's campaigns page
            router.push(`/partners/groups/${selectedGroup}/campaigns`);
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
                    Create a new advocacy campaign for legislation or issues.
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

                    {/* Campaign Type */}
                    <div className="space-y-2">
                        <Label htmlFor="campaign-type">Campaign Type</Label>
                        <Select value={campaignType} onValueChange={(value) => setCampaignType(value as 'Legislation' | 'Issue' | 'Town Hall Calling' | 'Candidate Advocacy' | 'Voter Registration' | 'Voter Poll')}>
                            <SelectTrigger id="campaign-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Legislation">Legislation</SelectItem>
                                <SelectItem value="Issue">Issue</SelectItem>
                                <SelectItem value="Town Hall Calling">Town Hall Calling</SelectItem>
                                <SelectItem value="Candidate Advocacy">Candidate Advocacy</SelectItem>
                                <SelectItem value="Voter Registration">Voter Registration</SelectItem>
                                <SelectItem value="Voter Poll">Voter Poll</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Bill Search, Issue Selection, or Candidate Entry */}
                    {campaignType === 'Issue' ? (
                        <div className="space-y-2">
                            <Label htmlFor="issue-select">Select Issue *</Label>
                            <Select
                                value={selectedIssue || ''}
                                onValueChange={(value) => {
                                    setSelectedIssue(value as SiteIssueCategory);
                                    setCustomIssue('');
                                }}
                            >
                                <SelectTrigger id="issue-select">
                                    <SelectValue placeholder="Select an issue" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SITE_ISSUE_CATEGORIES.map((issue) => (
                                        <SelectItem key={issue} value={issue}>
                                            {issue}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Issue Specific Title */}
                            {selectedIssue && (
                                <div className="space-y-2">
                                    <Label htmlFor="issue-specific-title">Issue Specific Title *</Label>
                                    <Input
                                        id="issue-specific-title"
                                        placeholder="e.g., Protect Voting Rights Act, Clean Water Initiative"
                                        value={issueSpecificTitle}
                                        onChange={(e) => setIssueSpecificTitle(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        This will appear as the title on the campaign card
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : campaignType === 'Candidate Advocacy' ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="candidate1-name">Candidate 1 Name *</Label>
                                <Input
                                    id="candidate1-name"
                                    placeholder="e.g., John Smith"
                                    value={candidate1Name}
                                    onChange={(e) => setCandidate1Name(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="candidate1-bio">Candidate 1 Bio (Optional)</Label>
                                <Textarea
                                    id="candidate1-bio"
                                    placeholder="Brief background about this candidate"
                                    value={candidate1Bio}
                                    onChange={(e) => setCandidate1Bio(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="candidate2-name">Candidate 2 Name *</Label>
                                <Input
                                    id="candidate2-name"
                                    placeholder="e.g., Jane Doe"
                                    value={candidate2Name}
                                    onChange={(e) => setCandidate2Name(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="candidate2-bio">Candidate 2 Bio (Optional)</Label>
                                <Textarea
                                    id="candidate2-bio"
                                    placeholder="Brief background about this candidate"
                                    value={candidate2Bio}
                                    onChange={(e) => setCandidate2Bio(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Which candidate does your organization support? *</Label>
                                <Select value={selectedCandidate.toString()} onValueChange={(value) => setSelectedCandidate(parseInt(value) as 1 | 2)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">{candidate1Name || 'Candidate 1'}</SelectItem>
                                        <SelectItem value="2">{candidate2Name || 'Candidate 2'}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ) : (
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
                            {searchQuery && !selectedBill && (isSearching || searchResults.length > 0) && (
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
                    )}

                    {/* Position */}
                    {campaignType !== 'Candidate Advocacy' && (
                        <div className="space-y-2">
                            <Label htmlFor="position">
                                {campaignType === 'Issue'
                                    ? `Your Position on ${selectedIssue || 'this issue'} *`
                                    : 'Position *'
                                }
                            </Label>
                            {campaignType === 'Issue' ? (
                                <Input
                                    id="position"
                                    placeholder="e.g., Support, Oppose, Reform Needed, etc."
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value as any)}
                                />
                            ) : (
                            <Select value={position} onValueChange={(value) => setPosition(value as 'Support' | 'Oppose')}>
                                <SelectTrigger id="position">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Support">Support</SelectItem>
                                    <SelectItem value="Oppose">Oppose</SelectItem>
                                </SelectContent>
                            </Select>
                            )}
                        </div>
                    )}

                    {/* Reasoning */}
                    <div className="space-y-2">
                        <Label htmlFor="reasoning">Reasoning *</Label>
                        <Textarea
                            id="reasoning"
                            placeholder={
                                campaignType === 'Issue'
                                    ? "Explain why your organization supports or opposes this issue. You can use Markdown formatting."
                                    : campaignType === 'Candidate Advocacy'
                                    ? `Explain why your organization supports ${selectedCandidate === 1 ? (candidate1Name || 'Candidate 1') : (candidate2Name || 'Candidate 2')}. You can use Markdown formatting.`
                                    : "Explain why your organization supports or opposes this bill. You can use Markdown formatting."
                            }
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

                    {/* Campaign Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start-date">Start Date *</Label>
                            <Input
                                id="start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">End Date *</Label>
                            <Input
                                id="end-date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={
                                !selectedGroup ||
                                !reasoning ||
                                !startDate ||
                                !endDate ||
                                isSaving ||
                                (campaignType === 'Issue' ? (!selectedIssue || !issueSpecificTitle) :
                                 campaignType === 'Candidate Advocacy' ? (!candidate1Name || !candidate2Name) :
                                 !selectedBill)
                            }
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
                            <Link href="/partners">Cancel</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function CreateCampaignPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateCampaignPageContent />
        </Suspense>
    );
}