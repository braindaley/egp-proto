import { NextResponse } from 'next/server';
import { getLocalOfficials } from '@/lib/legistorm-api';

// Helper function to convert address/zip/coords to state using Geocodio API
async function getStateFromLocation(address?: string, zip?: string, lat?: string, lng?: string): Promise<string | null> {
  const apiKey = process.env.GEOCODIO_API_KEY;

  if (!apiKey) {
    console.error('Geocodio API key not configured');
    // Fallback: try to extract state from address
    if (address) {
      const stateMatch = address.match(/\b([A-Z]{2})\b/i);
      if (stateMatch) {
        return stateMatch[1].toUpperCase();
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
          return stateMatch[1].toUpperCase();
        }
      }
      return null;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const state = result.address_components?.state;
      return state || null;
    }

    return null;
  } catch (error) {
    console.error('Error geocoding location:', error);
    // Fallback: try to extract state from address
    if (address) {
      const stateMatch = address.match(/\b([A-Z]{2})\b/i);
      if (stateMatch) {
        return stateMatch[1].toUpperCase();
      }
    }
    return null;
  }
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
    // Convert location to state
    const state = await getStateFromLocation(address, zip, lat, lng);

    if (!state) {
      return NextResponse.json(
        { error: 'Could not determine state from location. Please include a 2-letter state code (e.g., CA, NY) in your address.' },
        { status: 400 }
      );
    }

    // Fetch local officials from LegiStorm (broader data than just legislators)
    const response = await getLocalOfficials(state, { limit: 100 });

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to fetch elected officials from LegiStorm' },
        { status: 500 }
      );
    }

    // Convert to BallotReady format
    const convertedData = convertLegistormToBallotReadyFormat(response.officials);

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
    });

  } catch (err: any) {
    console.error('Error in legistorm-officials API route:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}