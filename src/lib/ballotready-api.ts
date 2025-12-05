/**
 * BallotReady (CivicEngine) API Service
 *
 * Service for interacting with the BallotReady GraphQL API.
 * BallotReady provides comprehensive data on elected officials, elections, and ballot measures.
 * API Documentation: https://developers.civicengine.com
 */

const BALLOTREADY_API_URL = 'https://bpi.civicengine.com/graphql';

export interface LocationInput {
  /** Full address string for geocoding */
  address?: string;
  /** Geographic point (latitude, longitude) */
  point?: {
    latitude: number;
    longitude: number;
  };
  /** 5-digit ZIP code (note: less precise, may return multiple overlapping results) */
  zip?: string;
}

export interface Contact {
  email?: string;
  phone?: string;
  fax?: string;
  type?: string;
}

export interface Url {
  url: string;
  type?: string;
}

export interface Address {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  type?: string;
}

export interface Party {
  name: string;
  shortName?: string;
}

export interface Person {
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

export interface Position {
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
}

export interface OfficeHolder {
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

export interface OfficeHoldersResponse {
  success: boolean;
  officeHolders: OfficeHolder[];
  error?: string;
}

/**
 * Fetch elected officials for a given location with full pagination support.
 * Uses Relay-style cursor pagination to fetch ALL officials.
 */
export async function getOfficeHoldersByLocation(
  location: LocationInput,
  options?: {
    currentOnly?: boolean;
    limit?: number;
    fetchAll?: boolean; // If true, paginate to get all results
  }
): Promise<OfficeHoldersResponse> {
  const apiKey = process.env.BALLOT_READY_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      officeHolders: [],
      error: 'BallotReady API key not configured',
    };
  }

  try {
    // Query includes pageInfo for pagination
    const query = `
      query GetOfficeHolders($location: LocationFilter!, $filterBy: OfficeHolderFilter, $first: Int, $after: String) {
        officeHolders(location: $location, filterBy: $filterBy, first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            isCurrent
            isAppointed
            officeTitle
            startAt
            endAt
            totalYearsInOffice
            person {
              fullName
              firstName
              lastName
              middleName
              nickname
              headshot {
                thumbnailUrl
              }
              contacts {
                email
                phone
                fax
                type
              }
              urls {
                url
                type
              }
            }
            position {
              name
              level
              description
              state
            }
            addresses {
              addressLine1
              addressLine2
              city
              state
              zip
              type
            }
            parties {
              name
              shortName
            }
          }
        }
      }
    `;

    // Build location filter
    const locationFilter: any = {};
    if (location.address) {
      locationFilter.address = location.address;
    } else if (location.point) {
      locationFilter.point = {
        latitude: location.point.latitude,
        longitude: location.point.longitude,
      };
    } else if (location.zip) {
      locationFilter.zip = location.zip;
    }

    // Build filter for current office holders
    const filterBy = options?.currentOnly !== false ? { isCurrent: true } : undefined;

    // Page size - use 100 per page for efficiency
    const pageSize = 100;
    const allOfficeHolders: OfficeHolder[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
    let pageCount = 0;
    const maxPages = 20; // Safety limit to prevent infinite loops

    // Paginate through all results
    while (hasNextPage && pageCount < maxPages) {
      const variables: any = {
        location: locationFilter,
        first: pageSize,
      };

      if (filterBy) {
        variables.filterBy = filterBy;
      }

      if (cursor) {
        variables.after = cursor;
      }

      const response = await fetch(BALLOTREADY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('BallotReady API error:', response.status, response.statusText, errorText);
        return {
          success: false,
          officeHolders: [],
          error: `API error: ${response.status}`,
        };
      }

      const data = await response.json();

      if (data.errors) {
        console.error('BallotReady GraphQL errors:', data.errors);
        return {
          success: false,
          officeHolders: [],
          error: data.errors[0]?.message || 'GraphQL query error',
        };
      }

      const pageNodes = data.data?.officeHolders?.nodes || [];
      const pageInfo = data.data?.officeHolders?.pageInfo;

      allOfficeHolders.push(...pageNodes);
      pageCount++;

      // Log pagination progress for debugging
      console.log(`BallotReady API: Fetched page ${pageCount}, got ${pageNodes.length} officials, total so far: ${allOfficeHolders.length}`);

      // Check if we should continue paginating
      if (options?.fetchAll !== false && pageInfo?.hasNextPage) {
        hasNextPage = true;
        cursor = pageInfo.endCursor;
      } else {
        hasNextPage = false;
      }

      // If limit is specified and we've reached it, stop
      if (options?.limit && allOfficeHolders.length >= options.limit) {
        break;
      }
    }

    // Log level breakdown for debugging
    const levelCounts: Record<string, number> = {};
    for (const oh of allOfficeHolders) {
      const level = oh.position?.level || 'UNKNOWN';
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    }
    console.log('BallotReady API: Officials by level:', levelCounts);

    return {
      success: true,
      officeHolders: allOfficeHolders,
    };
  } catch (error) {
    console.error('Error fetching office holders from BallotReady API:', error);
    return {
      success: false,
      officeHolders: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch a single office holder by ID using Relay node query
 */
export async function getOfficeHolderById(
  id: string
): Promise<{ success: boolean; officeHolder: OfficeHolder | null; error?: string }> {
  const apiKey = process.env.BALLOT_READY_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      officeHolder: null,
      error: 'BallotReady API key not configured',
    };
  }

  try {
    // Use the Relay node query with inline fragment for OfficeHolder
    // Fetching extended fields for detailed view
    const query = `
      query GetOfficeHolder($id: ID!) {
        node(id: $id) {
          ... on OfficeHolder {
            id
            isCurrent
            isAppointed
            officeTitle
            startAt
            endAt
            totalYearsInOffice
            person {
              fullName
              firstName
              lastName
              middleName
              nickname
              suffix
              headshot {
                thumbnailUrl
              }
              contacts {
                email
                phone
                fax
                type
              }
              urls {
                url
                type
              }
            }
            position {
              id
              name
              level
              description
              state
              mtfcc
              geoId
              normalizedPosition {
                name
              }
              electionFrequencies {
                frequency
              }
            }
            addresses {
              addressLine1
              addressLine2
              city
              state
              zip
              type
            }
            parties {
              name
              shortName
            }
          }
        }
      }
    `;

    const response = await fetch(BALLOTREADY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { id },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BallotReady API error:', response.status, response.statusText, errorText);
      return {
        success: false,
        officeHolder: null,
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.errors) {
      console.error('BallotReady GraphQL errors:', data.errors);
      return {
        success: false,
        officeHolder: null,
        error: data.errors[0]?.message || 'GraphQL query error',
      };
    }

    const officeHolder = data.data?.node || null;

    return {
      success: true,
      officeHolder,
    };
  } catch (error) {
    console.error('Error fetching office holder from BallotReady API:', error);
    return {
      success: false,
      officeHolder: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get available issues/categories from BallotReady
 */
export async function getIssues(): Promise<{ id: string; name: string }[]> {
  const apiKey = process.env.BALLOT_READY_API_KEY;

  if (!apiKey) {
    return [];
  }

  try {
    const query = `
      query GetIssues {
        issues {
          nodes {
            id
            name
          }
        }
      }
    `;

    const response = await fetch(BALLOTREADY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      console.error('BallotReady API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.data?.issues?.nodes || [];
  } catch (error) {
    console.error('Error fetching issues from BallotReady API:', error);
    return [];
  }
}
