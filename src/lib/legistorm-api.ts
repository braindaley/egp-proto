/**
 * LegiStorm State and Local API Service
 *
 * Service for interacting with the LegiStorm State Legislature API.
 * LegiStorm provides comprehensive data on state legislators, legislative staff,
 * executive branch officials, and local government officials.
 * API Documentation: https://api.legistorm.com
 */

const LEGISTORM_API_BASE_URL = 'https://api.legistorm.com/v2.020.06/state_legislature';

export interface PersonContact {
    email?: string;
    phone?: string;
    fax?: string;
    type?: string;
}

export interface StateAddressPhone {
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
    fax?: string;
    type?: string;
}

export interface StateDistrict {
    district_id?: number;
    district_name?: string;
    district_number?: string;
    district_type?: string;
}

export interface CorePerson {
    person_id?: number;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    suffix?: string;
    full_name?: string;
}

export interface LeadershipPosition {
    position_title?: string;
    chamber?: string;
    party?: string;
}

export interface CommitteeMembership {
    committee_name?: string;
    position_title?: string;
    chamber?: string;
}

export interface Legislator {
    legislator_id?: number;
    person?: CorePerson;
    party?: string;
    chamber?: string;
    state?: string;
    district?: StateDistrict;
    is_current?: boolean;
    term_start?: string;
    term_end?: string;
    leadership_positions?: LeadershipPosition[];
    committee_memberships?: CommitteeMembership[];
    addresses?: StateAddressPhone[];
    contacts?: PersonContact[];
    photo_url?: string;
    bio_text?: string;
    updated_at?: string;
}

export interface StaffPosition {
    position_title?: string;
    organization_name?: string;
}

export interface StateStaff {
    staff_id?: number;
    person?: CorePerson;
    positions?: StaffPosition[];
    state?: string;
    addresses?: StateAddressPhone[];
    contacts?: PersonContact[];
    updated_at?: string;
}

export interface ExecutiveOrganization {
    org_id?: number;
    org_name?: string;
    org_type?: string;
    state?: string;
    description?: string;
    addresses?: StateAddressPhone[];
    contacts?: PersonContact[];
    updated_at?: string;
}

export interface ExecutiveStaff {
    staff_id?: number;
    person?: CorePerson;
    position_title?: string;
    organization?: {
        org_id?: number;
        org_name?: string;
    };
    state?: string;
    addresses?: StateAddressPhone[];
    contacts?: PersonContact[];
    updated_at?: string;
}

export interface LocalOrganization {
    org_id?: number;
    org_name?: string;
    org_type?: string;
    state?: string;
    county?: string;
    city?: string;
    addresses?: StateAddressPhone[];
    updated_at?: string;
}

export interface LocalOfficial {
    official_id?: number;
    person?: CorePerson;
    position_title?: string;
    organization?: {
        org_id?: number;
        org_name?: string;
    };
    state?: string;
    county?: string;
    city?: string;
    addresses?: StateAddressPhone[];
    contacts?: PersonContact[];
    updated_at?: string;
}

export interface LegislatorsResponse {
    success: boolean;
    legislators: Legislator[];
    count: number;
    error?: string;
}

export interface StaffResponse {
    success: boolean;
    staff: StateStaff[];
    count: number;
    error?: string;
}

export interface ExecutiveStaffResponse {
    success: boolean;
    staff: ExecutiveStaff[];
    count: number;
    error?: string;
}

export interface LocalOfficialsResponse {
    success: boolean;
    officials: LocalOfficial[];
    count: number;
    error?: string;
}

/**
 * Fetch current state legislators for a given state
 */
export async function getStateLegislators(
    stateAbbr: string,
    options?: {
        limit?: number;
        offset?: number;
        updated_since?: string;
    }
): Promise<LegislatorsResponse> {
    const apiKey = process.env.LEGISTORM_API_KEY;

    if (!apiKey) {
        return {
            success: false,
            legislators: [],
            count: 0,
            error: 'LegiStorm API key not configured',
        };
    }

    try {
        const params = new URLSearchParams({
            state: stateAbbr.toUpperCase(),
            ...(options?.limit && { limit: options.limit.toString() }),
            ...(options?.offset && { offset: options.offset.toString() }),
            ...(options?.updated_since && { updated_since: options.updated_since }),
        });

        const response = await fetch(
            `${LEGISTORM_API_BASE_URL}/legislators/list?${params.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-API-KEY': apiKey,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LegiStorm API error:', response.status, response.statusText, errorText);
            return {
                success: false,
                legislators: [],
                count: 0,
                error: `API error: ${response.status}`,
            };
        }

        const data = await response.json();

        return {
            success: true,
            legislators: data.results || [],
            count: data.count || 0,
        };
    } catch (error) {
        console.error('Error fetching legislators from LegiStorm API:', error);
        return {
            success: false,
            legislators: [],
            count: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Fetch current state legislative staff for a given state
 */
export async function getStateLegislativeStaff(
    stateAbbr: string,
    options?: {
        limit?: number;
        offset?: number;
        updated_since?: string;
    }
): Promise<StaffResponse> {
    const apiKey = process.env.LEGISTORM_API_KEY;

    if (!apiKey) {
        return {
            success: false,
            staff: [],
            count: 0,
            error: 'LegiStorm API key not configured',
        };
    }

    try {
        const params = new URLSearchParams({
            state: stateAbbr.toUpperCase(),
            ...(options?.limit && { limit: options.limit.toString() }),
            ...(options?.offset && { offset: options.offset.toString() }),
            ...(options?.updated_since && { updated_since: options.updated_since }),
        });

        const response = await fetch(
            `${LEGISTORM_API_BASE_URL}/staff/list?${params.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-API-KEY': apiKey,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LegiStorm API error:', response.status, response.statusText, errorText);
            return {
                success: false,
                staff: [],
                count: 0,
                error: `API error: ${response.status}`,
            };
        }

        const data = await response.json();

        return {
            success: true,
            staff: data.results || [],
            count: data.count || 0,
        };
    } catch (error) {
        console.error('Error fetching staff from LegiStorm API:', error);
        return {
            success: false,
            staff: [],
            count: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Fetch current state executive branch staff for a given state
 */
export async function getStateExecutiveStaff(
    stateAbbr: string,
    options?: {
        limit?: number;
        offset?: number;
        updated_since?: string;
    }
): Promise<ExecutiveStaffResponse> {
    const apiKey = process.env.LEGISTORM_API_KEY;

    if (!apiKey) {
        return {
            success: false,
            staff: [],
            count: 0,
            error: 'LegiStorm API key not configured',
        };
    }

    try {
        const params = new URLSearchParams({
            state: stateAbbr.toUpperCase(),
            ...(options?.limit && { limit: options.limit.toString() }),
            ...(options?.offset && { offset: options.offset.toString() }),
            ...(options?.updated_since && { updated_since: options.updated_since }),
        });

        const response = await fetch(
            `${LEGISTORM_API_BASE_URL}/stateExecutiveStaff/list?${params.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-API-KEY': apiKey,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LegiStorm API error:', response.status, response.statusText, errorText);
            return {
                success: false,
                staff: [],
                count: 0,
                error: `API error: ${response.status}`,
            };
        }

        const data = await response.json();

        return {
            success: true,
            staff: data.results || [],
            count: data.count || 0,
        };
    } catch (error) {
        console.error('Error fetching executive staff from LegiStorm API:', error);
        return {
            success: false,
            staff: [],
            count: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Fetch local government officials for a given state
 */
export async function getLocalOfficials(
    stateAbbr: string,
    options?: {
        limit?: number;
        page?: number;
    }
): Promise<LocalOfficialsResponse> {
    const apiKey = process.env.LEGISTORM_API_KEY;

    if (!apiKey) {
        return {
            success: false,
            officials: [],
            count: 0,
            error: 'LegiStorm API key not configured',
        };
    }

    try {
        // LegiStorm localOfficials API supports state_id parameter
        const params = new URLSearchParams({
            updated_from: '2000-01-01',
            updated_to: new Date().toISOString().split('T')[0], // Today
            state_id: stateAbbr.toUpperCase(),
            limit: (options?.limit || 1000).toString(),
            page: (options?.page || 1).toString(),
        });

        const response = await fetch(
            `${LEGISTORM_API_BASE_URL}/localOfficials/list?${params.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-API-KEY': apiKey,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LegiStorm API error:', response.status, response.statusText, errorText);
            return {
                success: false,
                officials: [],
                count: 0,
                error: `API error: ${response.status}`,
            };
        }

        const data = await response.json();

        // API returns filtered data based on state_id parameter
        const officials = Array.isArray(data) ? data : [];

        return {
            success: true,
            officials: officials,
            count: officials.length,
        };
    } catch (error) {
        console.error('Error fetching local officials from LegiStorm API:', error);
        return {
            success: false,
            officials: [],
            count: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}