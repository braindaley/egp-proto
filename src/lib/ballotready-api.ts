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
  contacts: Contact[];
  urls: Url[];
}

export interface Position {
  name: string;
  level: 'FEDERAL' | 'STATE' | 'COUNTY' | 'LOCAL';
  description?: string;
  state?: string;
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
 * Fetch elected officials for a given location
 */
export async function getOfficeHoldersByLocation(
  location: LocationInput,
  options?: {
    currentOnly?: boolean;
    limit?: number;
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
    const query = `
      query GetOfficeHolders($location: LocationFilter!, $filterBy: OfficeHolderFilter, $first: Int) {
        officeHolders(location: $location, filterBy: $filterBy, first: $first) {
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

    const variables: any = {
      location: {},
      first: options?.limit || 50,
    };

    // Build location filter
    if (location.address) {
      variables.location.address = location.address;
    } else if (location.point) {
      variables.location.point = {
        latitude: location.point.latitude,
        longitude: location.point.longitude,
      };
    } else if (location.zip) {
      variables.location.zip = location.zip;
    }

    // Add filter for current office holders only
    if (options?.currentOnly !== false) {
      variables.filterBy = { isCurrent: true };
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

    const officeHolders = data.data?.officeHolders?.nodes || [];

    return {
      success: true,
      officeHolders,
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
