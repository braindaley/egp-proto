'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Building2,
  ExternalLink,
  Loader2,
  ChevronsUpDown,
  Info,
  User,
  Briefcase,
  Clock,
  Share2,
  Facebook,
  Twitter,
} from 'lucide-react';
import { usePremiumAccess } from '@/hooks/use-premium-access';
import { PremiumUpgradeCTA } from '@/components/premium-upgrade-cta';

interface Contact {
  email?: string;
  phone?: string;
  fax?: string;
  type?: string;
}

interface Url {
  url: string;
  type?: string;
}

interface Address {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  type?: string;
}

interface Party {
  name: string;
  shortName?: string;
}

interface Person {
  fullName: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  nickname?: string;
  suffix?: string;
  contacts: Contact[];
  urls: Url[];
  headshot?: {
    thumbnailUrl?: string;
  };
}

interface Position {
  id?: string;
  name: string;
  level: 'FEDERAL' | 'STATE' | 'COUNTY' | 'LOCAL' | 'CITY' | 'REGIONAL';
  description?: string;
  state?: string;
  mtfcc?: string;
  geoId?: string;
  normalizedPosition?: {
    name?: string;
  };
  electionFrequencies?: Array<{
    frequency?: string;
  }>;
  filingDeadlines?: Array<{
    date?: string;
    type?: string;
  }>;
}

interface OfficeHolder {
  id: string;
  isCurrent: boolean;
  officeTitle?: string;
  person?: Person;
  position: Position;
  addresses: Address[];
  parties: Party[];
  startAt?: string;
  endAt?: string;
  isAppointed: boolean;
  totalYearsInOffice?: number;
}

function getInitials(name: string): string {
  const parts = name.split(' ').filter(p => p.length > 0);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getLevelColor(level: string): string {
  const colors: Record<string, string> = {
    FEDERAL: 'bg-blue-100 text-blue-800',
    STATE: 'bg-green-100 text-green-800',
    REGIONAL: 'bg-teal-100 text-teal-800',
    COUNTY: 'bg-purple-100 text-purple-800',
    CITY: 'bg-indigo-100 text-indigo-800',
    LOCAL: 'bg-orange-100 text-orange-800',
  };
  return colors[level] || 'bg-gray-100 text-gray-800';
}

function getLevelLabel(level: string): string {
  return level.charAt(0) + level.slice(1).toLowerCase();
}

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getPartyColor(partyName: string): string {
  const name = partyName.toLowerCase();
  if (name.includes('democrat')) return 'bg-blue-100 text-blue-800';
  if (name.includes('republican')) return 'bg-red-100 text-red-800';
  if (name.includes('libertarian')) return 'bg-yellow-100 text-yellow-800';
  if (name.includes('green')) return 'bg-green-100 text-green-800';
  return 'bg-gray-100 text-gray-800';
}

function getSocialIcon(type?: string) {
  const t = (type || '').toLowerCase();
  if (t.includes('facebook')) return <Facebook className="h-4 w-4" />;
  if (t.includes('twitter') || t.includes('x.com')) return <Twitter className="h-4 w-4" />;
  return <Globe className="h-4 w-4" />;
}

function getUrlLabel(type?: string, url?: string): string {
  if (type) return type;
  if (!url) return 'Website';

  const domain = url.toLowerCase();
  if (domain.includes('facebook')) return 'Facebook';
  if (domain.includes('twitter') || domain.includes('x.com')) return 'Twitter/X';
  if (domain.includes('instagram')) return 'Instagram';
  if (domain.includes('linkedin')) return 'LinkedIn';
  if (domain.includes('youtube')) return 'YouTube';
  return 'Website';
}

export default function OfficialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isPremium, isLoading: premiumLoading } = usePremiumAccess();

  const [official, setOfficial] = useState<OfficeHolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOfficial = async () => {
      if (!id || !isPremium) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/ballot-officials/${id}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to fetch official');
          return;
        }

        setOfficial(data.officeHolder);
      } catch (err) {
        setError('Failed to load official details');
      } finally {
        setLoading(false);
      }
    };

    fetchOfficial();
  }, [id, isPremium]);

  // Show premium upgrade CTA for non-premium users
  if (!premiumLoading && !isPremium) {
    return (
      <PremiumUpgradeCTA
        variant="full-page"
        title="Elected Official Details"
        description="Access detailed information about all your elected officials with a premium membership."
      />
    );
  }

  if (loading) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex justify-center">
            <div className="w-full max-w-2xl space-y-8">
              <Skeleton className="h-10 w-24" />
              <Card>
                <CardContent className="pt-8">
                  <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                    <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-full" />
                    <div className="flex-1 space-y-4">
                      <Skeleton className="h-10 w-64" />
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-12 w-40" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !official) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{error || 'Official not found'}</p>
              <Button
                variant="outline"
                onClick={() => router.push('/elected-officials')}
                className="mt-4"
              >
                View All Officials
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { person, position, parties, addresses } = official;
  const title = official.officeTitle || position.name;
  const partyName = parties[0]?.name || null;
  const partyShortName = parties[0]?.shortName || null;
  const headshotUrl = person?.headshot?.thumbnailUrl;

  // Get contacts
  const emails = person?.contacts.filter(c => c.email) || [];
  const phones = person?.contacts.filter(c => c.phone) || [];
  const faxes = person?.contacts.filter(c => c.fax) || [];
  const websites = person?.urls || [];

  // Separate official/campaign websites from social media
  const officialWebsites = websites.filter(u => {
    const url = (u.url || '').toLowerCase();
    const type = (u.type || '').toLowerCase();
    return !url.includes('facebook') &&
           !url.includes('twitter') &&
           !url.includes('x.com') &&
           !url.includes('instagram') &&
           !url.includes('linkedin') &&
           !url.includes('youtube') &&
           !type.includes('facebook') &&
           !type.includes('twitter');
  });

  const socialLinks = websites.filter(u => {
    const url = (u.url || '').toLowerCase();
    return url.includes('facebook') ||
           url.includes('twitter') ||
           url.includes('x.com') ||
           url.includes('instagram') ||
           url.includes('linkedin') ||
           url.includes('youtube');
  });

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            {/* Back button */}
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="space-y-8">
              {/* Main Profile Card */}
              <Card>
                <CardContent className="space-y-4 text-sm pt-8">
                  {/* Header with photo and name */}
                  <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0 bg-muted">
                      {headshotUrl ? (
                        <Image
                          src={headshotUrl}
                          alt={`Photo of ${person?.fullName || 'Official'}`}
                          fill
                          sizes="(max-width: 768px) 128px, 160px"
                          className="object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-3xl font-semibold ${getLevelColor(position.level)}`}>
                          {person ? getInitials(person.fullName) : '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-2">
                        {person?.fullName || 'Unknown'}
                      </h1>
                      <p className="text-lg text-muted-foreground mb-4">{title}</p>
                      <Link href={`/advocacy-message?officialName=${encodeURIComponent(person?.fullName || '')}&position=${encodeURIComponent(title)}`}>
                        <Button
                          size="lg"
                          className="bg-black text-white hover:bg-gray-800"
                        >
                          Send Message
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <Separator />

                  {/* Key Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-muted-foreground">Level</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={getLevelColor(position.level)}>
                          {getLevelLabel(position.level)}
                        </Badge>
                      </div>
                    </div>

                    {partyName && (
                      <div>
                        <h4 className="font-semibold text-muted-foreground">Party</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={getPartyColor(partyName)}>
                            {partyShortName || partyName}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {position.state && (
                      <div>
                        <h4 className="font-semibold text-muted-foreground">State</h4>
                        <p>{position.state}</p>
                      </div>
                    )}

                    {official.totalYearsInOffice !== undefined && official.totalYearsInOffice > 0 && (
                      <div>
                        <h4 className="font-semibold text-muted-foreground">Years in Office</h4>
                        <p>{official.totalYearsInOffice}</p>
                      </div>
                    )}

                    {official.isCurrent && (
                      <div>
                        <h4 className="font-semibold text-muted-foreground">Status</h4>
                        <Badge variant="default" className="bg-green-600 mt-1">Current</Badge>
                      </div>
                    )}

                    {official.isAppointed && (
                      <div>
                        <h4 className="font-semibold text-muted-foreground">Appointment</h4>
                        <Badge variant="outline" className="mt-1">Appointed</Badge>
                      </div>
                    )}

                    {position.electionFrequencies && position.electionFrequencies.length > 0 && typeof position.electionFrequencies[0]?.frequency === 'string' && (
                      <div>
                        <h4 className="font-semibold text-muted-foreground">Election Cycle</h4>
                        <p className="capitalize">{position.electionFrequencies[0].frequency.toLowerCase()}</p>
                      </div>
                    )}

                    {position.normalizedPosition?.name && position.normalizedPosition.name !== position.name && (
                      <div>
                        <h4 className="font-semibold text-muted-foreground">Position Type</h4>
                        <p>{position.normalizedPosition.name}</p>
                      </div>
                    )}
                  </div>

                  {/* Term Dates */}
                  {(official.startAt || official.endAt) && (
                    <>
                      <Separator />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {official.startAt && (
                          <div>
                            <h4 className="font-semibold text-muted-foreground">Term Started</h4>
                            <p>{formatDate(official.startAt)}</p>
                          </div>
                        )}
                        {official.endAt && (
                          <div>
                            <h4 className="font-semibold text-muted-foreground">Term Ends</h4>
                            <p>{formatDate(official.endAt)}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Position Description Card (if available) */}
              {position.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      About this Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{position.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Contact & Details Collapsible */}
              <Collapsible defaultOpen={true}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Contact & Details
                    </span>
                    <ChevronsUpDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <Card>
                    <CardContent className="space-y-6 pt-6">
                      {/* Contact Information (phones only, no emails) */}
                      {(phones.length > 0 || faxes.length > 0) && (
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Contact Information
                          </h4>
                          <div className="space-y-2">
                            {phones.map((contact, idx) => (
                              <a
                                key={`phone-${idx}`}
                                href={`tel:${contact.phone}`}
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                              >
                                <Phone className="h-4 w-4" />
                                {contact.phone}
                                {contact.type && <span className="text-muted-foreground text-xs">({contact.type})</span>}
                              </a>
                            ))}
                            {faxes.map((contact, idx) => (
                              <div
                                key={`fax-${idx}`}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                              >
                                <Phone className="h-4 w-4" />
                                Fax: {contact.fax}
                                {contact.type && <span className="text-xs">({contact.type})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Official Websites */}
                      {officialWebsites.length > 0 && (
                        <>
                          {(phones.length > 0 || faxes.length > 0) && <Separator />}
                          <div>
                            <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Websites
                            </h4>
                            <div className="space-y-2">
                              {officialWebsites.map((url, idx) => (
                                <a
                                  key={`url-${idx}`}
                                  href={url.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  {getUrlLabel(url.type, url.url)}
                                </a>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Social Media Links */}
                      {socialLinks.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                              <Share2 className="h-4 w-4" />
                              Social Media
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {socialLinks.map((url, idx) => (
                                <a
                                  key={`social-${idx}`}
                                  href={url.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-muted rounded-full hover:bg-muted/80 transition-colors"
                                >
                                  {getSocialIcon(url.type || url.url)}
                                  {getUrlLabel(url.type, url.url)}
                                </a>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Office Addresses */}
                      {addresses.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Office Locations
                            </h4>
                            <div className="space-y-4">
                              {addresses.map((addr, idx) => (
                                <div key={`addr-${idx}`} className="text-sm border-l-2 border-primary/20 pl-4">
                                  {addr.type && (
                                    <p className="font-medium text-foreground mb-1">{addr.type}</p>
                                  )}
                                  <p className="text-muted-foreground">{addr.addressLine1}</p>
                                  {addr.addressLine2 && <p className="text-muted-foreground">{addr.addressLine2}</p>}
                                  <p className="text-muted-foreground">
                                    {addr.city}{addr.city && addr.state ? ', ' : ''}{addr.state} {addr.zip}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Position Technical Details */}
                      {(position.geoId || position.mtfcc) && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Geographic Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {position.geoId && (
                                <div>
                                  <p className="text-muted-foreground">GeoID:</p>
                                  <p className="font-medium">{position.geoId}</p>
                                </div>
                              )}
                              {position.mtfcc && (
                                <div>
                                  <p className="text-muted-foreground">MTFCC:</p>
                                  <p className="font-medium">{position.mtfcc}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* No contact info message */}
                      {phones.length === 0 && websites.length === 0 && addresses.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No contact information available for this official.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>

              {/* Data Source Attribution */}
              <div className="text-xs text-muted-foreground text-center">
                Data provided by{' '}
                <a
                  href="https://ballotready.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary"
                >
                  BallotReady
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
