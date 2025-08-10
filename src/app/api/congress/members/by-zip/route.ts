
import { NextRequest, NextResponse } from 'next/server';

// --- Interfaces for Geocod.io Response ---
interface CongressionalDistrict {
    name: string;
    district_number: number;
    current_legislators: Legislator[];
}

interface Legislator {
    type: 'representative' | 'senator';
    bio: {
        last_name: string;
        first_name:string;
        birthday: string;
        gender: string;
        party: string;
    };
    contact: {
        url: string;
        phone: string;
    };
    social: {
        twitter: string;
    };
}

interface FieldResponse {
    congressional_districts: CongressionalDistrict[];
}

interface GeocodIoResponse {
    results: {
        fields: FieldResponse;
    }[];
}


// --- Interface for our Application's Data Structure ---
interface AppRepresentative {
  name: string;
  party: string;
  officeTitle: string;
  districtNumber?: number;
  phones?: string[];
  urls?: string[];
}


// --- Function to Transform Geocod.io data to our app's format ---
function transformGeocodIoResponse(data: GeocodIoResponse): AppRepresentative[] {
  const representatives: AppRepresentative[] = [];

  if (!data.results || data.results.length === 0) {
    return [];
  }

  // Iterate through all results (usually just one for a zip code)
  for (const result of data.results) {
    const districts = result.fields?.congressional_districts || [];

    // Iterate through all districts in the result
    for (const district of districts) {
      const legislators = district.current_legislators || [];
      
      // Iterate through all legislators in the district
      for (const legislator of legislators) {
        const fullName = `${legislator.bio.first_name} ${legislator.bio.last_name}`;
        
        // Determine the office title
        let officeTitle = '';
        if (legislator.type === 'representative') {
            officeTitle = `United States House of Representatives, District ${district.district_number}`;
        } else if (legislator.type === 'senator') {
            officeTitle = `United States Senate`;
        }

        representatives.push({
          name: fullName,
          party: legislator.bio.party,
          officeTitle: officeTitle,
          districtNumber: legislator.type === 'representative' ? district.district_number : undefined,
          phones: legislator.contact.phone ? [legislator.contact.phone] : [],
          urls: legislator.contact.url ? [legislator.contact.url] : [],
        });
      }
    }
  }

  // Deduplicate in case of overlapping districts providing the same senator
  const uniqueReps = Array.from(new Map(representatives.map(rep => [rep.name, rep])).values());

  return uniqueReps;
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zipCode = searchParams.get('zip');

  if (!zipCode) {
    return NextResponse.json({ error: 'Zip code is required' }, { status: 400 });
  }

  const apiKey = process.env.GEOCODIO_API_KEY;
  if (!apiKey) {
    console.error("[API /by-zip] CRITICAL ERROR: GEOCODIO_API_KEY is not set.");
    return NextResponse.json({ error: 'Server configuration error: API key is missing' }, { status: 500 });
  }

  // Note the 'cd' field to request congressional district data
  const url = `https://api.geocod.io/v1.7/geocode?q=${zipCode}&fields=cd&api_key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const geocodData: GeocodIoResponse = await response.json();

    if (!response.ok) {
        const errorMessage = (geocodData as any).error || `Geocod.io API failed with status: ${response.status}`;
        console.error(`[API /by-zip] Error from Geocod.io API: ${errorMessage}`);
        return NextResponse.json({ error: `Failed to fetch from external API: ${errorMessage}` }, { status: response.status });
    }

    const representatives = transformGeocodIoResponse(geocodData);
    return NextResponse.json(representatives);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API /by-custom] Internal error: ${errorMessage}`);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
