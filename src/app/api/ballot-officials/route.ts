import { NextResponse } from 'next/server';
import { getOfficeHoldersByLocation, OfficeHolder } from '@/lib/ballotready-api';

/**
 * Get position priority for sorting (lower number = higher priority)
 * This ensures important positions like Governor, Mayor appear first
 */
function getPositionPriority(positionName: string): number {
  const name = positionName.toLowerCase();

  // Executive positions (highest priority)
  if (name.includes('governor') && !name.includes('lieutenant')) return 1;
  if (name.includes('lieutenant governor') || name.includes('lt. governor')) return 2;
  if (name.includes('mayor') && !name.includes('pro tem')) return 3;
  if (name.includes('mayor pro tem')) return 4;

  // State constitutional officers
  if (name.includes('secretary of state')) return 10;
  if (name.includes('attorney general')) return 11;
  if (name.includes('state treasurer') || name === 'treasurer') return 12;
  if (name.includes('state controller') || name.includes('comptroller')) return 13;
  if (name.includes('superintendent') && name.includes('public instruction')) return 14;
  if (name.includes('insurance commissioner')) return 15;

  // Legislative leadership
  if (name.includes('state senate') || name.includes('state senator')) return 20;
  if (name.includes('state assembly') || name.includes('state representative')) return 21;

  // County executives
  if (name.includes('board of supervisors') || name.includes('county supervisor')) return 30;
  if (name.includes('sheriff')) return 31;
  if (name.includes('district attorney')) return 32;
  if (name.includes('county clerk')) return 33;
  if (name.includes('assessor')) return 34;
  if (name.includes('auditor')) return 35;
  if (name.includes('treasurer') && name.includes('tax')) return 36;

  // City council
  if (name.includes('city council') || name.includes('council member') || name.includes('councilmember')) return 40;
  if (name.includes('city clerk')) return 41;
  if (name.includes('city treasurer')) return 42;
  if (name.includes('city attorney')) return 43;

  // Judicial
  if (name.includes('supreme court')) return 50;
  if (name.includes('court of appeal') || name.includes('appellate')) return 51;
  if (name.includes('superior court') || name.includes('judge')) return 52;

  // School and special districts
  if (name.includes('school board') || name.includes('school district')) return 60;
  if (name.includes('water district')) return 61;
  if (name.includes('community college')) return 62;

  // Default - sort alphabetically among remaining
  return 100;
}

/**
 * Get a normalized position group for grouping like positions together
 * E.g., "City Council Member Ward 1" and "City Council Member Ward 2" both return "City Council"
 */
function getPositionGroup(positionName: string): string {
  const name = positionName.toLowerCase();

  // Executive
  if (name.includes('governor') && !name.includes('lieutenant')) return 'Governor';
  if (name.includes('lieutenant governor') || name.includes('lt. governor')) return 'Lieutenant Governor';
  if (name.includes('mayor') && !name.includes('pro tem')) return 'Mayor';
  if (name.includes('mayor pro tem')) return 'Mayor Pro Tem';

  // State constitutional officers
  if (name.includes('secretary of state')) return 'Secretary of State';
  if (name.includes('attorney general')) return 'Attorney General';
  if (name.includes('state treasurer') || name === 'treasurer') return 'State Treasurer';
  if (name.includes('state controller') || name.includes('comptroller')) return 'State Controller';
  if (name.includes('superintendent') && name.includes('public instruction')) return 'Superintendent of Public Instruction';
  if (name.includes('insurance commissioner')) return 'Insurance Commissioner';

  // Legislative
  if (name.includes('state senate') || name.includes('state senator')) return 'State Senator';
  if (name.includes('state assembly') || name.includes('state representative')) return 'State Representative';

  // County
  if (name.includes('board of supervisors') || name.includes('county supervisor')) return 'Board of Supervisors';
  if (name.includes('sheriff')) return 'Sheriff';
  if (name.includes('district attorney')) return 'District Attorney';
  if (name.includes('county clerk')) return 'County Clerk';
  if (name.includes('assessor')) return 'Assessor';
  if (name.includes('auditor')) return 'Auditor';
  if (name.includes('treasurer') && name.includes('tax')) return 'Treasurer-Tax Collector';

  // City
  if (name.includes('city council') || name.includes('council member') || name.includes('councilmember')) return 'City Council';
  if (name.includes('city clerk')) return 'City Clerk';
  if (name.includes('city treasurer')) return 'City Treasurer';
  if (name.includes('city attorney')) return 'City Attorney';

  // Judicial
  if (name.includes('supreme court')) return 'Supreme Court';
  if (name.includes('court of appeal') || name.includes('appellate')) return 'Court of Appeal';
  if (name.includes('superior court')) return 'Superior Court';
  if (name.includes('judge')) return 'Judge';

  // School and special districts - extract district name for grouping
  if (name.includes('school board') || name.includes('trustee')) {
    // Try to extract the district name (e.g., "Santa Ana Unified School District")
    const match = positionName.match(/(.+(?:School District|Unified|Elementary|High School))/i);
    return match ? match[1].trim() : 'School Board';
  }
  if (name.includes('water district')) {
    const match = positionName.match(/(.+Water District)/i);
    return match ? match[1].trim() : 'Water District';
  }
  if (name.includes('community college')) {
    const match = positionName.match(/(.+Community College)/i);
    return match ? match[1].trim() : 'Community College';
  }

  // Default - use the position name itself as the group
  return positionName;
}

/**
 * Sort office holders by position importance within each level,
 * grouping like positions together (e.g., all City Council members adjacent)
 */
function sortOfficeHolders(officeHolders: OfficeHolder[]): OfficeHolder[] {
  return [...officeHolders].sort((a, b) => {
    const priorityA = getPositionPriority(a.position.name);
    const priorityB = getPositionPriority(b.position.name);

    // First sort by priority (Governor before Lt. Governor, Mayor before City Council, etc.)
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Then group by position type (all City Council members together, all School Board together)
    const groupA = getPositionGroup(a.position.name);
    const groupB = getPositionGroup(b.position.name);
    if (groupA !== groupB) {
      return groupA.localeCompare(groupB);
    }

    // Within the same group, sort alphabetically by full position name
    // This orders "Ward 1" before "Ward 2", "Seat 1" before "Seat 2", etc.
    return a.position.name.localeCompare(b.position.name);
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Get location parameters
  const address = searchParams.get('address');
  const zip = searchParams.get('zip');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const currentOnly = searchParams.get('currentOnly') !== 'false'; // default to true
  // Note: limit parameter is optional - if not provided, API will fetch ALL officials via pagination

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
    // fetchAll: true enables pagination to get ALL officials (city council, mayor, etc.)
    const response = await getOfficeHoldersByLocation(location, {
      currentOnly,
      fetchAll: true,
    });

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to fetch elected officials' },
        { status: 500 }
      );
    }

    // Group office holders by level and sort by position importance
    // BallotReady API returns: FEDERAL, STATE, REGIONAL, COUNTY, CITY, LOCAL
    // Sorting puts important positions first (Governor, Mayor, etc.)
    const byLevel = {
      federal: sortOfficeHolders(response.officeHolders.filter(oh => oh.position.level === 'FEDERAL')),
      state: sortOfficeHolders(response.officeHolders.filter(oh => oh.position.level === 'STATE')),
      regional: sortOfficeHolders(response.officeHolders.filter(oh => oh.position.level === 'REGIONAL')),
      county: sortOfficeHolders(response.officeHolders.filter(oh => oh.position.level === 'COUNTY')),
      city: sortOfficeHolders(response.officeHolders.filter(oh => oh.position.level === 'CITY')),
      local: sortOfficeHolders(response.officeHolders.filter(oh => oh.position.level === 'LOCAL')),
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