import { NextResponse } from 'next/server';
import { getLocalOfficials } from '@/lib/legistorm-api';

interface LocationInfo {
  state: string;
  county?: string;
  city?: string;
  zip?: string;
  county_fips?: string;
}

// Helper function to convert address/zip/coords to full location info using Geocodio API
async function getLocationInfo(address?: string, zip?: string, lat?: string, lng?: string): Promise<LocationInfo | null> {
  const apiKey = process.env.GEOCODIO_API_KEY;

  if (!apiKey) {
    console.error('Geocodio API key not configured');
    // Fallback: try to extract state from address
    if (address) {
      const stateMatch = address.match(/\b([A-Z]{2})\b/i);
      if (stateMatch) {
        return { state: stateMatch[1].toUpperCase() };
      }
    }
    return null;
  }

  try {
    let geocodioUrl = 'https://api.geocod.io/v1.7/geocode';

    if (address) {
      geocodioUrl += `?q=${encodeURIComponent(address)}&api_key=${apiKey}`;
    } else if (zip) {
      geocodioUrl += `?postal_code=${zip}&api_key=${apiKey}`;
    } else if (lat && lng) {
      geocodioUrl = `https://api.geocod.io/v1.7/reverse?q=${lat},${lng}&api_key=${apiKey}`;
    } else {
      return null;
    }

    const response = await fetch(geocodioUrl);

    if (!response.ok) {
      console.error('Geocodio API error:', response.status);
      // Fallback: try to extract state from address
      if (address) {
        const stateMatch = address.match(/\b([A-Z]{2})\b/i);
        if (stateMatch) {
          return { state: stateMatch[1].toUpperCase() };
        }
      }
      return null;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const components = result.address_components;

      return {
        state: components?.state || '',
        county: components?.county || undefined,
        city: components?.city || undefined,
        zip: components?.zip || zip || undefined,
        county_fips: components?.county_fips || undefined,
      };
    }

    return null;
  } catch (error) {
    console.error('Error geocoding location:', error);
    // Fallback: try to extract state from address
    if (address) {
      const stateMatch = address.match(/\b([A-Z]{2})\b/i);
      if (stateMatch) {
        return { state: stateMatch[1].toUpperCase() };
      }
    }
    return null;
  }
}

// Helper function to check if official's location matches user's location
function isLocalMatch(official: any, userLocation: LocationInfo): boolean {
  const addresses = official.addresses || [];
  const organization = official.organization || {};

  // If no addresses, can't filter by location
  if (addresses.length === 0) {
    return false;
  }

  // Check each address for a match
  for (const addr of addresses) {
    // Match by ZIP code (exact match)
    if (userLocation.zip && addr.zip) {
      // Remove any ZIP+4 extensions for comparison
      const userZip = userLocation.zip.split('-')[0].trim();
      const addrZip = String(addr.zip).split('-')[0].trim();
      if (userZip === addrZip) {
        return true;
      }
    }

    // Match by city (case-insensitive)
    if (userLocation.city && addr.city) {
      const userCity = userLocation.city.toLowerCase().trim();
      const addrCity = String(addr.city).toLowerCase().trim();
      if (userCity === addrCity) {
        return true;
      }
    }
  }

  // Match by county in organization name (since addresses don't have county field)
  if (userLocation.county && organization.name) {
    const userCounty = userLocation.county.toLowerCase().replace(/\s+county$/i, '').trim();
    const orgName = organization.name.toLowerCase();

    // Check if organization name contains the county name
    if (orgName.includes(userCounty)) {
      return true;
    }
  }

  return false;
}

// Helper function to convert LegiStorm data to BallotReady format
function convertLegistormToBallotReadyFormat(officials: any[]) {
  const converted = officials.map((official, index) => {
    const person = official.officials || {};
    const organization = official.organization || {};
    const addresses = official.addresses || [];
    const emails = official.emails || [];

    // Convert addresses
    const convertedAddresses = addresses.map((addr: any) => ({
      addressLine1: addr.address1,
      addressLine2: addr.address2,
      city: addr.city,
      state: addr.state_id,
      zip: addr.zip,
      type: addr.title || 'Main Office',
    }));

    // Convert contacts
    const convertedContacts = emails.map((email: any) => ({
      email: email.contact_string,
      phone: addresses[0]?.phone,
      type: email.contact_type || 'work',
    }));

    // Determine level - local officials are typically LOCAL level
    let level: 'FEDERAL' | 'STATE' | 'COUNTY' | 'LOCAL' = 'LOCAL';
    const posTitle = official.position_title?.toLowerCase() || '';
    if (posTitle.includes('state') || posTitle.includes('governor')) {
      level = 'STATE';
    } else if (posTitle.includes('county')) {
      level = 'COUNTY';
    } else if (posTitle.includes('congress') || posTitle.includes('senator') || posTitle.includes('representative')) {
      level = 'FEDERAL';
    }

    return {
      id: `legistorm-${official.position_id || index}`,
      isCurrent: true,
      officeTitle: official.position_title || 'Official',
      person: {
        fullName: `${person.preferred_first_name || person.first_name || ''} ${person.preferred_last_name || person.last_name || ''}`.trim(),
        firstName: person.preferred_first_name || person.first_name,
        lastName: person.preferred_last_name || person.last_name,
        contacts: convertedContacts,
        urls: official.social_media?.map((sm: any) => ({
          url: sm.contact_string,
          type: sm.contact_type,
        })) || [],
      },
      position: {
        name: official.position_title || official.roles || 'Official',
        level: level,
        description: organization.name || '',
        state: official.state_id,
      },
      addresses: convertedAddresses,
      parties: [], // Local officials data doesn't include party
      startAt: official.start_date,
      endAt: null,
      totalYearsInOffice: 0,
    };
  });

  return converted;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Get location parameters (same as BallotReady)
  const address = searchParams.get('address');
  const zip = searchParams.get('zip');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  // Validate that at least one location parameter is provided
  if (!address && !zip && !(lat && lng)) {
    return NextResponse.json(
      { error: 'At least one location parameter is required: address, zip, or lat/lng' },
      { status: 400 }
    );
  }

  try {
    // Get full location info (state, county, city, zip)
    const locationInfo = await getLocationInfo(address, zip, lat, lng);

    if (!locationInfo || !locationInfo.state) {
      return NextResponse.json(
        { error: 'Could not determine location. Please include a 2-letter state code (e.g., CA, NY) in your address.' },
        { status: 400 }
      );
    }

    // Fetch ALL local officials from LegiStorm for the entire state (all pages)
    // Note: LegiStorm API only supports state-level filtering, so we get all state officials
    // and filter by location afterward
    const allOfficials: any[] = [];
    let page = 1;
    let hasMore = true;
    const limit = 1000; // Max per page

    while (hasMore) {
      const response = await getLocalOfficials(locationInfo.state, { limit, page });

      if (!response.success) {
        return NextResponse.json(
          { error: response.error || 'Failed to fetch elected officials from LegiStorm' },
          { status: 500 }
        );
      }

      const officialsCount = response.officials.length;

      if (officialsCount === 0) {
        hasMore = false;
      } else {
        allOfficials.push(...response.officials);

        // If we got less than the limit, we're on the last page
        if (officialsCount < limit) {
          hasMore = false;
        } else {
          page++;
        }
      }

      // Safety limit: max 10 pages (10,000 officials)
      if (page > 10) {
        hasMore = false;
      }
    }

    // Debug: Check what cities and organizations we actually have
    const allCities = new Set<string>();
    const allZips = new Set<string>();
    const allOrgs = new Set<string>();
    allOfficials.forEach(o => {
      o.addresses?.forEach((a: any) => {
        if (a.city) allCities.add(a.city);
        if (a.zip) allZips.add(String(a.zip).split('-')[0]);
      });
      if (o.organization?.name) allOrgs.add(o.organization.name);
    });


    // Filter officials by location (ZIP, city, or county match)
    const localOfficials = allOfficials.filter(official =>
      isLocalMatch(official, locationInfo)
    );


    // Convert to BallotReady format
    const convertedData = convertLegistormToBallotReadyFormat(localOfficials);

    // Group by level (like BallotReady)
    const byLevel = {
      federal: convertedData.filter(oh => oh.position.level === 'FEDERAL'),
      state: convertedData.filter(oh => oh.position.level === 'STATE'),
      county: convertedData.filter(oh => oh.position.level === 'COUNTY'),
      local: convertedData.filter(oh => oh.position.level === 'LOCAL'),
    };

    return NextResponse.json({
      officeHolders: convertedData,
      byLevel,
      count: convertedData.length,
      debug: {
        userLocation: locationInfo,
        totalStateOfficials: allOfficials.length,
        filteredOfficials: localOfficials.length,
        totalPages: page,
      },
    });

  } catch (err: any) {
    console.error('Error in legistorm-officials API route:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}