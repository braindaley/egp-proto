'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Loader2, ArrowLeft, X, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { SiteIssueCategory } from '@/lib/policy-area-mapping';
import { SITE_ISSUE_CATEGORIES } from '@/lib/policy-area-mapping';

export const dynamic = 'force-dynamic';

export default function EditUserCampaignPage() {
    const router = useRouter();
    const params = useParams();
    const campaignId = params?.id as string;
    const { user, loading: authLoading } = useAuth();
    const db = getFirestore(app);

    const [loadingCampaign, setLoadingCampaign] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Campaign data
    const [campaignType, setCampaignType] = useState<string>('Legislation');
    const [billType, setBillType] = useState('');
    const [billNumber, setBillNumber] = useState('');
    const [billTitle, setBillTitle] = useState('');
    const [selectedIssue, setSelectedIssue] = useState<SiteIssueCategory | null>(null);
    const [issueSpecificTitle, setIssueSpecificTitle] = useState('');
    const [position, setPosition] = useState<string>('Support');
    const [reasoning, setReasoning] = useState('');
    const [actionButtonText, setActionButtonText] = useState('Voice your opinion');

    // Candidate fields
    const [candidate1Name, setCandidate1Name] = useState('');
    const [candidate1Bio, setCandidate1Bio] = useState('');
    const [candidate2Name, setCandidate2Name] = useState('');
    const [candidate2Bio, setCandidate2Bio] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState<1 | 2>(1);

    // Poll fields
    const [pollTitle, setPollTitle] = useState('');
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollDescription, setPollDescription] = useState('');
    const [pollChoices, setPollChoices] = useState<string[]>(['', '']);

    // Campaign dates
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Status
    const [isDiscoverable, setIsDiscoverable] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    // Load campaign data
    useEffect(() => {
        const loadCampaign = async () => {
            if (!campaignId || !user) {
                setLoadingCampaign(false);
                return;
            }

            try {
                const campaignRef = doc(db, 'campaigns', campaignId);
                const campaignDoc = await getDoc(campaignRef);

                if (!campaignDoc.exists()) {
                    alert('Campaign not found');
                    router.push('/dashboard/campaigns');
                    return;
                }

                const data = campaignDoc.data();

                // Verify ownership
                if (data.userId !== user.uid) {
                    alert('You do not have permission to edit this campaign');
                    router.push('/dashboard/campaigns');
                    return;
                }

                // Set form values
                setCampaignType(data.campaignType || 'Legislation');
                setBillType(data.billType || '');
                setBillNumber(data.billNumber || '');
                setBillTitle(data.billTitle || '');
                setPosition(data.position || 'Support');
                setReasoning(data.reasoning || '');
                setActionButtonText(data.actionButtonText || 'Voice your opinion');
                setIsDiscoverable(data.isDiscoverable !== false);
                setIsPaused(data.isPaused === true);

                // Dates
                if (data.startDate) setStartDate(data.startDate);
                if (data.endDate) setEndDate(data.endDate);

                // Issue fields
                if (data.issueTitle) setSelectedIssue(data.issueTitle as SiteIssueCategory);
                if (data.issueSpecificTitle) setIssueSpecificTitle(data.issueSpecificTitle);

                // Candidate fields
                if (data.candidate) {
                    setCandidate1Name(data.candidate.candidate1Name || '');
                    setCandidate1Bio(data.candidate.candidate1Bio || '');
                    setCandidate2Name(data.candidate.candidate2Name || '');
                    setCandidate2Bio(data.candidate.candidate2Bio || '');
                    setSelectedCandidate(data.candidate.selectedCandidate || 1);
                }

                // Poll fields
                if (data.poll) {
                    setPollTitle(data.poll.title || '');
                    setPollQuestion(data.poll.question || '');
                    setPollDescription(data.poll.description || '');
                    setPollChoices(data.poll.choices || ['', '']);
                }
            } catch (error) {
                console.error('Error loading campaign:', error);
                alert('Error loading campaign');
            } finally {
                setLoadingCampaign(false);
            }
        };

        loadCampaign();
    }, [campaignId, user, db, router]);

    const handleSave = async () => {
        if (!user || !campaignId) return;

        // Validate based on campaign type
        if (campaignType === 'Issue') {
            if (!selectedIssue || !issueSpecificTitle || !reasoning) {
                alert('Please fill in all required fields');
                return;
            }
        } else if (campaignType === 'Candidate Advocacy' || campaignType === 'Candidate') {
            if (!candidate1Name || !candidate2Name || !reasoning) {
                alert('Please fill in all required fields');
                return;
            }
        } else if (campaignType === 'Voter Poll') {
            if (!pollTitle || !pollQuestion) {
                alert('Please fill in all required fields');
                return;
            }
            const filledChoices = pollChoices.filter(c => c.trim() !== '');
            if (filledChoices.length < 2) {
                alert('Please provide at least 2 answer choices');
                return;
            }
        } else {
            if (!reasoning) {
                alert('Please provide reasoning');
                return;
            }
        }

        setIsSaving(true);
        try {
            const campaignRef = doc(db, 'campaigns', campaignId);

            let updateData: any = {
                position,
                reasoning,
                actionButtonText,
                isDiscoverable,
                isPaused,
                updatedAt: new Date()
            };

            if (startDate) updateData.startDate = startDate;
            if (endDate) updateData.endDate = endDate;

            // Add type-specific updates
            if (campaignType === 'Issue') {
                updateData.issueTitle = selectedIssue;
                updateData.issueSpecificTitle = issueSpecificTitle;
                updateData.billTitle = issueSpecificTitle;
            } else if (campaignType === 'Candidate Advocacy' || campaignType === 'Candidate') {
                updateData.candidate = {
                    candidate1Name,
                    candidate1Bio,
                    candidate2Name,
                    candidate2Bio,
                    selectedCandidate
                };
                updateData.billTitle = `${candidate1Name} vs ${candidate2Name}`;
            } else if (campaignType === 'Voter Poll') {
                const filledChoices = pollChoices.filter(c => c.trim() !== '');
                updateData.poll = {
                    title: pollTitle,
                    question: pollQuestion,
                    description: pollDescription,
                    choices: filledChoices,
                    answerType: 'multiple-choice-single'
                };
                updateData.billTitle = pollTitle;
            }

            await updateDoc(campaignRef, updateData);
            router.push('/dashboard/campaigns');
        } catch (error) {
            console.error('Error updating campaign:', error);
            alert('Failed to update campaign');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || loadingCampaign) {
        return (
            <div className="container mx-auto p-4 md:p-8 max-w-[800px]">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md p-8 text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Access Restricted</CardTitle>
                        <CardDescription>Please log in to edit campaigns.</CardDescription>
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
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/dashboard/campaigns">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Campaigns
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold font-headline">Edit Campaign</h1>
                <p className="text-muted-foreground mt-2">
                    Update your campaign details.
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                    <CardDescription>
                        {campaignType === 'Legislation' && `${billType} ${billNumber} - ${billTitle}`}
                        {campaignType === 'Issue' && `${selectedIssue} - ${issueSpecificTitle}`}
                        {(campaignType === 'Candidate Advocacy' || campaignType === 'Candidate') && `${candidate1Name} vs ${candidate2Name}`}
                        {campaignType === 'Voter Poll' && pollTitle}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Type-specific fields */}
                    {campaignType === 'Issue' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="issue-select">Issue Category</Label>
                                <Select
                                    value={selectedIssue || ''}
                                    onValueChange={(value) => setSelectedIssue(value as SiteIssueCategory)}
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
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="issue-specific-title">Issue Title *</Label>
                                <Input
                                    id="issue-specific-title"
                                    value={issueSpecificTitle}
                                    onChange={(e) => setIssueSpecificTitle(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {(campaignType === 'Candidate Advocacy' || campaignType === 'Candidate') && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="candidate1-name">Candidate 1 Name *</Label>
                                <Input
                                    id="candidate1-name"
                                    value={candidate1Name}
                                    onChange={(e) => setCandidate1Name(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="candidate1-bio">Candidate 1 Bio</Label>
                                <Textarea
                                    id="candidate1-bio"
                                    value={candidate1Bio}
                                    onChange={(e) => setCandidate1Bio(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="candidate2-name">Candidate 2 Name *</Label>
                                <Input
                                    id="candidate2-name"
                                    value={candidate2Name}
                                    onChange={(e) => setCandidate2Name(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="candidate2-bio">Candidate 2 Bio</Label>
                                <Textarea
                                    id="candidate2-bio"
                                    value={candidate2Bio}
                                    onChange={(e) => setCandidate2Bio(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Supported Candidate</Label>
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
                    )}

                    {campaignType === 'Voter Poll' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="poll-title">Poll Title *</Label>
                                <Input
                                    id="poll-title"
                                    value={pollTitle}
                                    onChange={(e) => setPollTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="poll-question">Poll Question *</Label>
                                <Input
                                    id="poll-question"
                                    value={pollQuestion}
                                    onChange={(e) => setPollQuestion(e.target.value)}
                                />
                            </div>
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
                            <div className="space-y-2">
                                <Label htmlFor="poll-description">Description</Label>
                                <Textarea
                                    id="poll-description"
                                    value={pollDescription}
                                    onChange={(e) => setPollDescription(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    {/* Position - Hide for Candidate and Poll */}
                    {campaignType !== 'Candidate Advocacy' && campaignType !== 'Candidate' && campaignType !== 'Voter Poll' && (
                        <div className="space-y-2">
                            <Label htmlFor="position">Position</Label>
                            {campaignType === 'Issue' ? (
                                <Input
                                    id="position"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                />
                            ) : (
                                <Select value={position} onValueChange={setPosition}>
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
                                value={reasoning}
                                onChange={(e) => setReasoning(e.target.value)}
                                rows={8}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Supports Markdown formatting.
                            </p>
                        </div>
                    )}

                    {/* Action Button Text - Hide for Voter Poll */}
                    {campaignType !== 'Voter Poll' && (
                        <div className="space-y-2">
                            <Label htmlFor="action-text">Action Button Text</Label>
                            <Input
                                id="action-text"
                                value={actionButtonText}
                                onChange={(e) => setActionButtonText(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Campaign Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start-date">Start Date</Label>
                            <Input
                                id="start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">End Date</Label>
                            <Input
                                id="end-date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                            />
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-start space-x-3">
                            <Checkbox
                                id="is-discoverable"
                                checked={isDiscoverable}
                                onCheckedChange={(checked) => setIsDiscoverable(checked === true)}
                            />
                            <div className="space-y-1">
                                <Label htmlFor="is-discoverable" className="cursor-pointer">
                                    Show on my public profile
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    When enabled, this campaign appears on your public profile.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <Checkbox
                                id="is-paused"
                                checked={isPaused}
                                onCheckedChange={(checked) => setIsPaused(checked === true)}
                            />
                            <div className="space-y-1">
                                <Label htmlFor="is-paused" className="cursor-pointer">
                                    Pause campaign
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Paused campaigns are not visible to visitors.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
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
