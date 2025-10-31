import { NextResponse } from 'next/server';
import { getOfficeHoldersByLocation } from '@/lib/ballotready-api';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Get location parameters
  const address = searchParams.get('address');
  const zip = searchParams.get('zip');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const currentOnly = searchParams.get('currentOnly') !== 'false'; // default to true
  const limit = parseInt(searchParams.get('limit') || '50');

  // Validate that at least one location parameter is provided
  if (!address && !zip && !(lat && lng)) {
    return NextResponse.json(
      { error: 'At least one location parameter is required: address, zip, or lat/lng' },
      { status: 400 }
    );
  }

  try {
    // Build location input based on provided parameters
    const location: any = {};

    if (address) {
      location.address = address;
    } else if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json(
          { error: 'Invalid latitude or longitude values' },
          { status: 400 }
        );
      }

      location.point = { latitude, longitude };
    } else if (zip) {
      // Validate ZIP code format (5 digits)
      if (!/^\d{5}$/.test(zip)) {
        return NextResponse.json(
          { error: 'Invalid ZIP code format. Must be 5 digits.' },
          { status: 400 }
        );
      }

      location.zip = zip;
    }

    // Fetch office holders from BallotReady API
    const response = await getOfficeHoldersByLocation(location, {
      currentOnly,
      limit,
    });

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to fetch elected officials' },
        { status: 500 }
      );
    }

    // Group office holders by level for easier frontend consumption
    const byLevel = {
      federal: response.officeHolders.filter(oh => oh.position.level === 'FEDERAL'),
      state: response.officeHolders.filter(oh => oh.position.level === 'STATE'),
      county: response.officeHolders.filter(oh => oh.position.level === 'COUNTY'),
      local: response.officeHolders.filter(oh => oh.position.level === 'LOCAL'),
    };

    return NextResponse.json({
      officeHolders: response.officeHolders,
      byLevel,
      count: response.officeHolders.length,
    });

  } catch (err: any) {
    console.error('Error in elected-officials API route:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}