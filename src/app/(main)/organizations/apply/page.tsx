'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Building2, Mail, Globe, Phone, MapPin } from 'lucide-react';

export default function OrganizationApplyPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: '',
    slug: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    taxId: '',
    organizationType: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    missionStatement: '',
    focusAreas: '',
    yearsActive: '',
    memberCount: '',
    agreeToTerms: false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-generate slug from organization name
    if (field === 'organizationName' && typeof value === 'string') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.organizationName || !formData.contactEmail || !formData.missionStatement || !formData.agreeToTerms) {
      alert('Please fill in all required fields and agree to the terms.');
      return;
    }

    // In production, this would submit to the backend
    console.log('Organization application submitted:', formData);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold font-headline mb-4">
              Application Submitted!
            </h1>
            <p className="text-muted-foreground mb-6">
              Thank you for applying to join our platform. We've received your application for{' '}
              <strong>{formData.organizationName}</strong> and will review it within 2-3 business days.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              You'll receive an email at <strong>{formData.contactEmail}</strong> once your application
              has been reviewed.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild variant="outline">
                <a href="/">Return Home</a>
              </Button>
              <Button asChild>
                <a href="/organizations">Browse Organizations</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold font-headline mb-2">
          Apply as an Advocacy Organization
        </h1>
        <p className="text-muted-foreground text-lg">
          Join our platform to create campaigns and mobilize supporters
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Organization Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Information
              </CardTitle>
              <CardDescription>
                Tell us about your advocacy organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="organizationName">
                    Organization Name *
                  </Label>
                  <Input
                    id="organizationName"
                    placeholder="e.g., League of Women Voters"
                    value={formData.organizationName}
                    onChange={(e) => handleChange('organizationName', e.target.value)}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="slug">
                    URL Slug (auto-generated)
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    readOnly
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your organization page will be: /organizations/{formData.slug || 'your-slug'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="organizationType">
                    Organization Type *
                  </Label>
                  <Select value={formData.organizationType} onValueChange={(v) => handleChange('organizationType', v)}>
                    <SelectTrigger id="organizationType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="501c3">501(c)(3) Nonprofit</SelectItem>
                      <SelectItem value="501c4">501(c)(4) Social Welfare</SelectItem>
                      <SelectItem value="pac">Political Action Committee</SelectItem>
                      <SelectItem value="grassroots">Grassroots Organization</SelectItem>
                      <SelectItem value="coalition">Coalition/Alliance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="taxId">
                    Tax ID / EIN (Optional)
                  </Label>
                  <Input
                    id="taxId"
                    placeholder="XX-XXXXXXX"
                    value={formData.taxId}
                    onChange={(e) => handleChange('taxId', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="yearsActive">
                    Years Active
                  </Label>
                  <Input
                    id="yearsActive"
                    type="number"
                    placeholder="5"
                    value={formData.yearsActive}
                    onChange={(e) => handleChange('yearsActive', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="memberCount">
                    Approximate Member Count
                  </Label>
                  <Input
                    id="memberCount"
                    placeholder="e.g., 10,000"
                    value={formData.memberCount}
                    onChange={(e) => handleChange('memberCount', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="missionStatement">
                  Mission Statement *
                </Label>
                <Textarea
                  id="missionStatement"
                  placeholder="Describe your organization's mission and goals..."
                  value={formData.missionStatement}
                  onChange={(e) => handleChange('missionStatement', e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="focusAreas">
                  Policy Focus Areas
                </Label>
                <Textarea
                  id="focusAreas"
                  placeholder="e.g., Voting rights, election reform, campaign finance..."
                  value={formData.focusAreas}
                  onChange={(e) => handleChange('focusAreas', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Primary contact for this organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName">
                    Contact Name *
                  </Label>
                  <Input
                    id="contactName"
                    placeholder="Full Name"
                    value={formData.contactName}
                    onChange={(e) => handleChange('contactName', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail">
                    Contact Email *
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="contact@organization.org"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contactPhone">
                    Contact Phone
                  </Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="website">
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://www.organization.org"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Organization Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main Street"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="col-span-2 md:col-span-3">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="CA"
                      maxLength={2}
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="col-span-1">
                    <Label htmlFor="zipCode">ZIP</Label>
                    <Input
                      id="zipCode"
                      placeholder="12345"
                      value={formData.zipCode}
                      onChange={(e) => handleChange('zipCode', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms and Submit */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleChange('agreeToTerms', !!checked)}
                />
                <div className="flex-1">
                  <label htmlFor="agreeToTerms" className="text-sm cursor-pointer">
                    I agree to the{' '}
                    <a href="/terms" target="_blank" className="text-primary hover:underline">
                      Terms of Service
                    </a>{' '}
                    and confirm that I am authorized to represent this organization. *
                  </label>
                </div>
              </div>

              <div className="bg-muted/50 rounded-md p-4 text-sm text-muted-foreground">
                <p className="mb-2">
                  <strong>What happens next?</strong>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Our team will review your application within 2-3 business days</li>
                  <li>You'll receive an email once approved</li>
                  <li>Once approved, you can create campaigns and manage your organization page</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={!formData.agreeToTerms}>
                  Submit Application
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
