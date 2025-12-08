'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { getAdvocacyGroupData, type AdvocacyGroup } from '@/lib/advocacy-groups';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function EditGroupPage({ params }: { params: { groupSlug: string } }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [groupSlug, setGroupSlug] = useState<string>('');
    const [originalData, setOriginalData] = useState<AdvocacyGroup | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        logoUrl: '',
        website: '',
        nonprofitStatus: '',
        yearsActive: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadParams = async () => {
            const resolvedParams = await params;
            setGroupSlug(resolvedParams.groupSlug);
        };
        loadParams();
    }, [params]);

    useEffect(() => {
        if (!groupSlug) return;

        const groupData = getAdvocacyGroupData(groupSlug);
        if (groupData) {
            setOriginalData(groupData);
            setFormData({
                name: groupData.name,
                description: groupData.description,
                logoUrl: groupData.logoUrl || '',
                website: groupData.website,
                nonprofitStatus: groupData.nonprofitStatus,
                yearsActive: groupData.yearsActive.toString()
            });
        }
    }, [groupSlug]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        setSaving(true);
        
        try {
            // Simulate save operation (in a real app, this would make an API call)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Here you would typically make an API call to save the data
            console.log('Saving group data:', {
                groupSlug,
                ...formData,
                yearsActive: parseInt(formData.yearsActive)
            });
            
            toast({
                title: "Changes Saved",
                description: "Group information has been updated successfully.",
            });
            
            router.push('/partners');
        } catch (error) {
            console.error('Error saving group data:', error);
            toast({
                title: "Error",
                description: "Failed to save changes. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        router.push('/partners');
    };

    if (loading) {
        return <div className="container mx-auto px-4 py-8"><p>Loading...</p></div>;
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md p-8 text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Access Restricted</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Please log in to edit group information.</p>
                        <Button asChild>
                            <Link href="/login">Log In</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!originalData) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="p-8 text-center">
                        <p>Group not found</p>
                        <Button asChild className="mt-4">
                            <Link href="/partners">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Campaigns
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-secondary/30 flex-1">
            <div className="container mx-auto px-4 py-6 md:py-12">
                <div className="flex justify-center">
                    <div className="w-full max-w-2xl">
                        <div className="mb-8">
                            <Button variant="ghost" asChild className="mb-4">
                                <Link href="/partners">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Campaigns
                                </Link>
                            </Button>
                            <h1 className="text-3xl font-bold font-headline">Edit Group Information</h1>
                            <p className="text-muted-foreground mt-1">
                                Update the information for {originalData.name}
                            </p>
                        </div>

                        <div className="grid gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                </CardHeader>
                                            <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Organization Name</Label>
                                                        <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                placeholder="Enter organization name"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="nonprofitStatus">Nonprofit Status</Label>
                                                        <Input
                                                id="nonprofitStatus"
                                                value={formData.nonprofitStatus}
                                                onChange={(e) => handleInputChange('nonprofitStatus', e.target.value)}
                                                placeholder="e.g., 501(c)(3) Nonprofit"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                                    <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            placeholder="Enter organization description"
                                            rows={4}
                                            className="resize-none"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Online Presence</CardTitle>
                                </CardHeader>
                                            <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="website">Website URL</Label>
                                                        <Input
                                                id="website"
                                                value={formData.website}
                                                onChange={(e) => handleInputChange('website', e.target.value)}
                                                placeholder="https://example.org"
                                                type="url"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="logoUrl">Logo URL</Label>
                                                        <Input
                                                id="logoUrl"
                                                value={formData.logoUrl}
                                                onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                                                placeholder="https://example.org/logo.png"
                                                type="url"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Statistics</CardTitle>
                                </CardHeader>
                                            <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="yearsActive">Years Active</Label>
                                                    <Input
                                            id="yearsActive"
                                            value={formData.yearsActive}
                                            onChange={(e) => handleInputChange('yearsActive', e.target.value)}
                                            placeholder="10"
                                            type="number"
                                            min="0"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end gap-4">
                                <Button 
                                    variant="outline" 
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}