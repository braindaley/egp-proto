'use client';

import { useState } from 'react';

// Disable static generation for this interactive search page
export const dynamic = 'force-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Mail, Phone, Globe, MapPin } from 'lucide-react';

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
  contacts: Contact[];
  urls: Url[];
}

interface Position {
  name: string;
  level: 'FEDERAL' | 'STATE' | 'COUNTY' | 'LOCAL';
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
  totalYearsInOffice?: number;
}

interface GroupedOfficeHolders {
  federal: OfficeHolder[];
  state: OfficeHolder[];
  county: OfficeHolder[];
  local: OfficeHolder[];
}

function OfficeHolderCard({ officeHolder }: { officeHolder: OfficeHolder }) {
  const { person, position, addresses, parties } = officeHolder;

  if (!person) {
    return null; // Skip vacant positions
  }

  const primaryEmail = person.contacts.find(c => c.email)?.email;
  const primaryPhone = person.contacts.find(c => c.phone)?.phone;
  const website = person.urls.find(u => u.type === 'GOVERNMENT' || u.type === 'OFFICIAL')?.url || person.urls[0]?.url;
  const primaryAddress = addresses[0];

  const levelColors = {
    FEDERAL: 'bg-blue-500',
    STATE: 'bg-green-500',
    COUNTY: 'bg-purple-500',
    LOCAL: 'bg-orange-500',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold mb-1">{person.fullName}</CardTitle>
            <CardDescription className="text-base font-medium">{officeHolder.officeTitle || position.name}</CardDescription>
          </div>
          <Badge className={`${levelColors[position.level]} text-white`}>
            {position.level}
          </Badge>
        </div>
        {parties.length > 0 && (
          <div className="flex gap-2 mt-2">
            {parties.map((party, idx) => (
              <Badge key={idx} variant="outline">
                {party.shortName || party.name}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {position.description && (
          <p className="text-sm text-muted-foreground mb-4">{position.description}</p>
        )}

        <div className="space-y-2">
          {primaryEmail && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${primaryEmail}`} className="text-blue-600 hover:underline">
                {primaryEmail}
              </a>
            </div>
          )}

          {primaryPhone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${primaryPhone}`} className="text-blue-600 hover:underline">
                {primaryPhone}
              </a>
            </div>
          )}

          {website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Official Website
              </a>
            </div>
          )}

          {primaryAddress && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p>{primaryAddress.addressLine1}</p>
                {primaryAddress.addressLine2 && <p>{primaryAddress.addressLine2}</p>}
                <p>{primaryAddress.city}, {primaryAddress.state} {primaryAddress.zip}</p>
                {primaryAddress.type && <p className="text-muted-foreground text-xs">{primaryAddress.type}</p>}
              </div>
            </div>
          )}

          {officeHolder.totalYearsInOffice && officeHolder.totalYearsInOffice > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {officeHolder.totalYearsInOffice} years in office
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ElectedOfficialsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [officeHolders, setOfficeHolders] = useState<GroupedOfficeHolders | null>(null);

  // Form state
  const [searchType, setSearchType] = useState<'address' | 'zip' | 'coords'>('address');
  const [address, setAddress] = useState('');
  const [zip, setZip] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (searchType === 'address' && address) {
        params.append('address', address);
      } else if (searchType === 'zip' && zip) {
        params.append('zip', zip);
      } else if (searchType === 'coords' && lat && lng) {
        params.append('lat', lat);
        params.append('lng', lng);
      } else {
        setError('Please provide all required fields');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/ballot-officials?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch elected officials');
        setOfficeHolders(null);
      } else {
        setOfficeHolders(data.byLevel);
        if (data.count === 0) {
          setError('No elected officials found for this location. The BallotReady API may not have data for this area yet.');
        }
      }
    } catch (err) {
      setError('Failed to fetch elected officials');
      setOfficeHolders(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary/30 flex-1">
      <div className="container mx-auto px-4 py-6 md:py-12 max-w-6xl">
        <header className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
            BallotReady Elected Officials
          </h1>
          <p className="text-lg text-muted-foreground">
            Search by address, ZIP code, or coordinates to find your representatives at all levels of government
          </p>
        </header>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Location</CardTitle>
            <CardDescription>Enter your location to find your elected officials</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={searchType} onValueChange={(v) => setSearchType(v as any)} className="mb-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="address">Address</TabsTrigger>
                <TabsTrigger value="zip">ZIP Code</TabsTrigger>
                <TabsTrigger value="coords">Coordinates</TabsTrigger>
              </TabsList>

              <TabsContent value="address" className="space-y-4">
                <div>
                  <Label htmlFor="address">Full Address</Label>
                  <Input
                    id="address"
                    placeholder="1600 Pennsylvania Avenue NW, Washington, DC 20500"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="zip" className="space-y-4">
                <div>
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    placeholder="20500"
                    maxLength={5}
                    value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Note: ZIP code search may return multiple overlapping districts
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="coords" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      placeholder="38.8977"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lng">Longitude</Label>
                    <Input
                      id="lng"
                      placeholder="-77.0365"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Button onClick={handleSearch} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>

            {error && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {officeHolders && (
          <div className="space-y-8">
            {officeHolders.federal.length > 0 && (
              <section>
                <h2 className="font-headline text-3xl font-bold text-primary mb-6 border-b pb-3">
                  Federal Officials
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {officeHolders.federal.map((oh) => (
                    <OfficeHolderCard key={oh.id} officeHolder={oh} />
                  ))}
                </div>
              </section>
            )}

            {officeHolders.state.length > 0 && (
              <section>
                <h2 className="font-headline text-3xl font-bold text-primary mb-6 border-b pb-3">
                  State Officials
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {officeHolders.state.map((oh) => (
                    <OfficeHolderCard key={oh.id} officeHolder={oh} />
                  ))}
                </div>
              </section>
            )}

            {officeHolders.county.length > 0 && (
              <section>
                <h2 className="font-headline text-3xl font-bold text-primary mb-6 border-b pb-3">
                  County Officials
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {officeHolders.county.map((oh) => (
                    <OfficeHolderCard key={oh.id} officeHolder={oh} />
                  ))}
                </div>
              </section>
            )}

            {officeHolders.local.length > 0 && (
              <section>
                <h2 className="font-headline text-3xl font-bold text-primary mb-6 border-b pb-3">
                  Local Officials
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {officeHolders.local.map((oh) => (
                    <OfficeHolderCard key={oh.id} officeHolder={oh} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}