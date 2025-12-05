'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Building2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

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
  contacts: Contact[];
  urls: Url[];
  headshot?: {
    thumbnailUrl?: string;
  };
}

interface Position {
  name: string;
  level: 'FEDERAL' | 'STATE' | 'COUNTY' | 'LOCAL' | 'CITY' | 'REGIONAL';
  description?: string;
  state?: string;
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

export default function OfficialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [official, setOfficial] = useState<OfficeHolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOfficial = async () => {
      if (!id) return;

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
  }, [id]);

  if (loading) {
    return (
      <div className="bg-secondary/30 flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
  const partyName = parties[0]?.name || 'Unknown Party';
  const headshotUrl = person?.headshot?.thumbnailUrl;

  // Get contacts
  const emails = person?.contacts.filter(c => c.email) || [];
  const phones = person?.contacts.filter(c => c.phone) || [];
  const websites = person?.urls || [];

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

            {/* Main card */}
            <Card className="overflow-hidden">
              {/* Header section */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    {headshotUrl && (
                      <AvatarImage src={headshotUrl} alt={person?.fullName || 'Official'} />
                    )}
                    <AvatarFallback className={`text-2xl ${getLevelColor(position.level)}`}>
                      {person ? getInitials(person.fullName) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <h1 className="text-2xl font-bold mb-2">
                    {person?.fullName || 'Unknown'}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-3">{title}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="secondary" className={getLevelColor(position.level)}>
                      {getLevelLabel(position.level)}
                    </Badge>
                    {partyName !== 'Unknown Party' && (
                      <Badge variant="outline">{partyName}</Badge>
                    )}
                    {official.isCurrent && (
                      <Badge variant="default" className="bg-green-600">Current</Badge>
                    )}
                    {official.isAppointed && (
                      <Badge variant="outline">Appointed</Badge>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Send Message CTA */}
                <div className="flex justify-center">
                  <Button asChild size="lg" className="w-full max-w-sm">
                    <Link href={`/advocacy-message?officialName=${encodeURIComponent(person?.fullName || '')}&position=${encodeURIComponent(title)}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Message
                    </Link>
                  </Button>
                </div>

                {/* Position details */}
                {position.description && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">About this Position</h3>
                    <p className="text-sm">{position.description}</p>
                  </div>
                )}

                {/* Term information */}
                {(official.startAt || official.endAt || official.totalYearsInOffice) && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Term Information
                    </h3>
                    <div className="text-sm space-y-1">
                      {official.startAt && (
                        <p>Started: {formatDate(official.startAt)}</p>
                      )}
                      {official.endAt && (
                        <p>Ends: {formatDate(official.endAt)}</p>
                      )}
                      {official.totalYearsInOffice && (
                        <p>Years in office: {official.totalYearsInOffice}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact information */}
                {(emails.length > 0 || phones.length > 0) && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contact Information
                    </h3>
                    <div className="space-y-2">
                      {emails.map((contact, idx) => (
                        <a
                          key={`email-${idx}`}
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Mail className="h-4 w-4" />
                          {contact.email}
                          {contact.type && <span className="text-muted-foreground">({contact.type})</span>}
                        </a>
                      ))}
                      {phones.map((contact, idx) => (
                        <a
                          key={`phone-${idx}`}
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Phone className="h-4 w-4" />
                          {contact.phone}
                          {contact.type && <span className="text-muted-foreground">({contact.type})</span>}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Websites */}
                {websites.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Websites
                    </h3>
                    <div className="space-y-2">
                      {websites.map((url, idx) => (
                        <a
                          key={`url-${idx}`}
                          href={url.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {url.type || 'Website'}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Office addresses */}
                {addresses.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Office Locations
                    </h3>
                    <div className="space-y-3">
                      {addresses.map((addr, idx) => (
                        <div key={`addr-${idx}`} className="text-sm">
                          {addr.type && (
                            <p className="font-medium text-muted-foreground mb-1">{addr.type}</p>
                          )}
                          <p>{addr.addressLine1}</p>
                          {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                          <p>
                            {addr.city}, {addr.state} {addr.zip}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* State/Region info */}
                {position.state && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {position.state}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
