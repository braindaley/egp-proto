
'use client';
import { useEffect, useState } from 'react';
import { MapPin, Phone, Building2, Loader2 } from 'lucide-react';
import type { DistrictOfficesRecord } from '@/types';

const cache = new Map<string, DistrictOfficesRecord[]>();

async function fetchDistrictOffices(): Promise<DistrictOfficesRecord[]> {
  if (cache.has('all')) {
    return cache.get('all')!;
  }
  
  try {
    const res = await fetch('https://unitedstates.github.io/congress-legislators/legislators-district-offices.json');
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    cache.set('all', data);
    return data;
  } catch (error) {
    console.error('Error fetching district offices data:', error);
    return [];
  }
}

export function DistrictOffices({ bioguideId }: { bioguideId: string }) {
  const [offices, setOffices] = useState<DistrictOfficesRecord['offices']>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndSetOffices = async () => {
      setIsLoading(true);
      
      try {
        const allRecords = await fetchDistrictOffices();
        const memberRecord = allRecords.find(record => record.id?.bioguide === bioguideId);
        setOffices(memberRecord?.offices || []);
      } catch (error) {
        console.error('Error loading district offices:', error);
        setOffices([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (bioguideId) {
      fetchAndSetOffices();
    } else {
      setIsLoading(false);
    }
  }, [bioguideId]);

  if (isLoading) {
    return (
      <div className="pt-3 border-t">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading district offices...</span>
        </div>
      </div>
    );
  }

  if (offices.length === 0) {
    return null;
  }
  
  return (
    <div className="pt-3 border-t">
      <h4 className="text-sm font-medium mb-2">District Offices</h4>
      <div className="space-y-2">
        {offices.map((office) => (
          <div key={office.id} className="p-3 bg-secondary/50 rounded-md text-sm">
            {office.building && (
              <div className="flex items-center gap-2 font-semibold">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{office.building}</span>
              </div>
            )}
            <div className="flex items-start gap-2 mt-1">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p>{office.address}{office.suite ? `, ${office.suite}` : ''}</p>
                <p>{office.city}, {office.state} {office.zip}</p>
              </div>
            </div>
            {office.phone && (
              <div className="flex items-center gap-2 mt-1">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${office.phone}`} className="hover:underline">{office.phone}</a>
              </div>
            )}
            {office.fax && (
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <span className="text-lg shrink-0">📠</span>
                <span>{office.fax} (Fax)</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
