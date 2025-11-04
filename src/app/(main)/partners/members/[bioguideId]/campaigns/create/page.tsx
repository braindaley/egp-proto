'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Search, Loader2, X, Plus } from 'lucide-react';
import Link from 'next/link';
import type { Bill } from '@/types';
import type { SiteIssueCategory } from '@/lib/policy-area-mapping';
import { SITE_ISSUE_CATEGORIES } from '@/lib/policy-area-mapping';
import debounce from 'lodash/debounce';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

interface MemberInfo {
    bioguideId: string;
    name: string;
    state: string;
    district?: string;
    party?: string;
    chamber?: string;
}

function CreateMemberCampaignPageContent() {
    const router = useRouter();
    const params = useParams();
    const bioguideId = params.bioguideId as string;
    const { user, loading: authLoading } = useAuth();

    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
    const [loadingMember, setLoadingMember] = useState(true);
    const [campaignType, setCampaignType] = useState<'Legislation' | 'Issue' | 'Candidate Advocacy' | 'Voter Poll'>('Legislation');
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

    // Voter poll fields
    const [pollTitle, setPollTitle] = useState('');
    const [pollQuestion, setPollQuestion] = useState('');
    const [answerType, setAnswerType] = useState<'multiple-choice-single' | 'multiple-choice-multiple' | 'open-text'>('multiple-choice-single');
    const [pollDescription, setPollDescription] = useState('');
    const [pollImageFile, setPollImageFile] = useState<File | null>(null);
    const [pollImagePreview, setPollImagePreview] = useState<string>('');
    const [pollChoices, setPollChoices] = useState<string[]>(['', '']);

    // Fetch member info on mount
    useEffect(() => {
        const fetchMemberInfo = async () => {
            try {
                const response = await fetch(`/api/congress/member/${bioguideId}`);
                if (response.ok) {
                    const data = await response.json();
                    setMemberInfo({
                        bioguideId: data.bioguideId,
                        name: data.name,
                        state: data.state,
                        district: data.district,
                        party: data.party,
                        chamber: data.chamber
                    });
                } else {
                    console.error('Failed to fetch member info');
                }
            } catch (error) {
                console.error('Error fetching member info:', error);
            } finally {
                setLoadingMember(false);
            }
        };

        if (bioguideId) {
            fetchMemberInfo();
        }
    }, [bioguideId]);

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
            if (!selectedIssue || !issueSpecificTitle || !reasoning) {
                alert('Please fill in all required fields');
                return;
            }
        } else if (campaignType === 'Candidate Advocacy') {
            if (!candidate1Name || !candidate2Name || !reasoning) {
                alert('Please fill in all required fields (both candidate names and reasoning)');
                return;
            }
        } else if (campaignType === 'Voter Poll') {
            if (!pollTitle || !pollQuestion) {
                alert('Please fill in all required fields (poll title and question)');
                return;
            }
            // Validate choices for multiple choice types
            if (answerType !== 'open-text') {
                const filledChoices = pollChoices.filter(c => c.trim() !== '');
                if (filledChoices.length < 2) {
                    alert('Please provide at least 2 answer choices for multiple choice questions');
                    return;
                }
            }
        } else {
            if (!selectedBill || !reasoning) {
                alert('Please fill in all required fields');
                return;
            }
        }

        setIsSaving(true);
        try {
            let requestBody: any = {
                userId: user?.uid,
                groupSlug: '',
                groupName: '',
                position,
                reasoning,
                actionButtonText,
                campaignType,
                startDate,
                endDate,
                bioguideId,
                memberInfo: {
                    name: memberInfo?.name,
                    state: memberInfo?.state
                }
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
            } else if (campaignType === 'Voter Poll') {
                // For Voter Poll campaigns
                const filledChoices = pollChoices.filter(c => c.trim() !== '');
                requestBody = {
                    ...requestBody,
                    poll: {
                        title: pollTitle,
                        question: pollQuestion,
                        answerType,
                        description: pollDescription,
                        imageUrl: pollImagePreview,
                        choices: answerType !== 'open-text' ? filledChoices : []
                    },
                    // Use poll data for display
                    billTitle: pollTitle,
                    billType: 'POLL',
                    billNumber: pollTitle.replace(/[^a-z0-9-]/g, '').toLowerCase() || 'poll',
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

            // Redirect to member campaigns page
            router.push(`/partners/members/${bioguideId}/campaigns`);
        } catch (error) {
            console.error('Error creating campaign:', error);
            alert(error instanceof Error ? error.message : 'Failed to create campaign');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || loadingMember) {
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

    if (!memberInfo) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md p-8 text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Member Not Found</CardTitle>
                        <CardDescription>Could not load member information.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/partners">Back to Partners</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-[800px]">
            {/* Breadcrumbs */}
            <div className="mb-4 text-sm text-muted-foreground">
                <Link href="/partners" className="hover:underline">Partners</Link>
                {' / '}
                <Link href={`/partners/members/${bioguideId}/campaigns`} className="hover:underline">
                    {memberInfo.name}
                </Link>
                {' / '}
                <span>Create Campaign</span>
            </div>

            <header className="mb-8">
                <h1 className="text-3xl font-bold font-headline">Create New Campaign</h1>
                <p className="text-muted-foreground mt-2">
                    Create a campaign targeting {memberInfo.name}
                </p>
            </header>

            {/* Member Info Card */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Campaign Target</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div>
                            <span className="font-medium text-lg">{memberInfo.name}</span>
                            {memberInfo.party && (
                                <span className="ml-2 text-sm text-muted-foreground">({memberInfo.party})</span>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {memberInfo.chamber === 'House' && memberInfo.district
                                ? `${memberInfo.state} - District ${memberInfo.district}`
                                : memberInfo.state
                            }
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Campaign Type */}
                    <div className="space-y-2">
                        <Label htmlFor="campaign-type">Campaign Type</Label>
                        <Select value={campaignType} onValueChange={(value) => setCampaignType(value as 'Legislation' | 'Issue' | 'Candidate Advocacy' | 'Voter Poll')}>
                            <SelectTrigger id="campaign-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Legislation">Legislation</SelectItem>
                                <SelectItem value="Issue">Issue</SelectItem>
                                <SelectItem value="Candidate Advocacy">Candidate Advocacy</SelectItem>
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
                    ) : campaignType === 'Voter Poll' ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="poll-title">Poll Title *</Label>
                                <Input
                                    id="poll-title"
                                    placeholder="e.g., Community Priorities Survey"
                                    value={pollTitle}
                                    onChange={(e) => setPollTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="poll-question">Poll Question *</Label>
                                <Input
                                    id="poll-question"
                                    placeholder="e.g., What issue should our organization prioritize?"
                                    value={pollQuestion}
                                    onChange={(e) => setPollQuestion(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="answer-type">Answer Type *</Label>
                                <Select value={answerType} onValueChange={(value) => setAnswerType(value as 'multiple-choice-single' | 'multiple-choice-multiple' | 'open-text')}>
                                    <SelectTrigger id="answer-type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="multiple-choice-single">Multiple Choice - Single Select</SelectItem>
                                        <SelectItem value="multiple-choice-multiple">Multiple Choice - Multiple Select</SelectItem>
                                        <SelectItem value="open-text">Open Text</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Answer Choices - only show for multiple choice types */}
                            {(answerType === 'multiple-choice-single' || answerType === 'multiple-choice-multiple') && (
                                <div className="space-y-2">
                                    <Label>Answer Choices *</Label>
                                    <div className="space-y-2">
                                        {pollChoices.map((choice, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Input
                                                    placeholder={`Choice ${index + 1}`}
                                                    value={choice}
                                                    onChange={(e) => {
                                                        const newChoices = [...pollChoices];
                                                        newChoices[index] = e.target.value;
                                                        setPollChoices(newChoices);
                                                    }}
                                                />
                                                {pollChoices.length > 2 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            const newChoices = pollChoices.filter((_, i) => i !== index);
                                                            setPollChoices(newChoices);
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPollChoices([...pollChoices, ''])}
                                            className="w-full"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Choice
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="poll-description">Description (Optional)</Label>
                                <Textarea
                                    id="poll-description"
                                    placeholder="Provide context or instructions for the poll..."
                                    value={pollDescription}
                                    onChange={(e) => setPollDescription(e.target.value)}
                                    rows={4}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="poll-image">Image Upload (Optional)</Label>
                                <Input
                                    id="poll-image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setPollImageFile(file);
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setPollImagePreview(reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                {pollImagePreview && (
                                    <div className="mt-2">
                                        <img src={pollImagePreview} alt="Poll preview" className="max-w-xs rounded-lg border" />
                                    </div>
                                )}
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

                    {/* Position - Hide for Candidate Advocacy and Voter Poll */}
                    {campaignType !== 'Candidate Advocacy' && campaignType !== 'Voter Poll' && (
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

                    {/* Reasoning - Hide for Voter Poll */}
                    {campaignType !== 'Voter Poll' && (
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
                    )}

                    {/* Action Button Text - Hide for Voter Poll */}
                    {campaignType !== 'Voter Poll' && (
                        <div className="space-y-2">
                            <Label htmlFor="action-text">Action Button Text</Label>
                            <Input
                                id="action-text"
                                placeholder="Text for the action button"
                                value={actionButtonText}
                                onChange={(e) => setActionButtonText(e.target.value)}
                            />
                        </div>
                    )}

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
                                !startDate ||
                                !endDate ||
                                isSaving ||
                                (campaignType === 'Voter Poll' ? (!pollTitle || !pollQuestion) :
                                 campaignType === 'Issue' ? (!selectedIssue || !issueSpecificTitle || !reasoning) :
                                 campaignType === 'Candidate Advocacy' ? (!candidate1Name || !candidate2Name || !reasoning) :
                                 (!selectedBill || !reasoning))
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
                            <Link href={`/partners/members/${bioguideId}/campaigns`}>Cancel</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function CreateMemberCampaignPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateMemberCampaignPageContent />
        </Suspense>
    );
}
