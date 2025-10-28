/**
 * L2 Political API Service
 *
 * Service for interacting with the L2 Political voter verification API.
 * L2 provides voter registration data and verification services.
 */

export interface L2VerificationRequest {
    firstName: string;
    lastName: string;
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
}

export interface L2VoterRecord {
    voterId: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    birthYear?: string;
    gender?: string;
    politicalAffiliation?: string;
    registrationDate?: string;
    voterStatus?: string;
    constituentDescription?: string | null;
}

export interface L2VerificationResponse {
    success: boolean;
    matches: L2VoterRecord[];
    error?: string;
}

/**
 * Verify a voter using the L2 Political API
 * Uses the Search Records API (v2) as documented in L2 DataMapping API v2.0.13
 */
export async function verifyVoter(
    request: L2VerificationRequest
): Promise<L2VerificationResponse> {
    const customerId = process.env.L2_API_CUSTOMER_ID;
    const apiKey = process.env.L2_API_KEY;
    const demoState = process.env.L2_API_DEMO_STATE || 'Delaware';

    if (!customerId || !apiKey) {
        return {
            success: false,
            matches: [],
            error: 'L2 API credentials not configured',
        };
    }

    try {
        // Determine the state code for the application
        // L2 uses format VM_<STATE> for voter mapping applications
        const stateCode = request.state?.toUpperCase() || 'DE'; // Default to Delaware
        const application = `VM_${stateCode}`;

        // L2 API v2 Search Records endpoint
        const baseUrl = 'https://api.l2datamapping.com';
        const endpoint = `${baseUrl}/api/v2/records/search/${customerId}/${application}`;

        // Build authentication query parameters
        const authParams = new URLSearchParams({
            id: customerId,
            apikey: apiKey,
        });

        // Build filters for the search
        // According to L2 API docs, STRING fields support wildcard matching
        const filters: Record<string, string | string[]> = {
            Voters_FirstName: request.firstName,
            Voters_LastName: request.lastName,
        };

        // Add ZIP code if provided
        if (request.zipCode) {
            filters.Residence_Addresses_Zip = request.zipCode;
        }

        // Add city if provided
        if (request.city) {
            filters.Residence_Addresses_City = request.city;
        }

        const response = await fetch(`${endpoint}?${authParams.toString()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filters,
                format: 'json',
                fieldset: 'SIMPLE', // Can be SIMPLE, EXTENDED, or ALL
                limit: 50, // Maximum results to return
                wait: 30000, // Wait up to 30 seconds for results
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('L2 API error:', response.status, response.statusText, errorText);

            // Try to parse as JSON to get structured error
            try {
                const errorData = JSON.parse(errorText);

                // Check if it's a "no records" error (expected when no matches)
                if (errorData.message?.includes('API_SEARCH_NO_RECORDS')) {
                    return {
                        success: true,
                        matches: [],
                    };
                }

                // Check if account doesn't have access to this state
                if (errorData.message?.includes('API_CUST_APP')) {
                    return {
                        success: false,
                        matches: [],
                        error: `Voter verification is only available for ${demoState}. Please ensure the address is in ${demoState}.`,
                    };
                }

                // Return the API error message
                return {
                    success: false,
                    matches: [],
                    error: errorData.message || `L2 API error: ${response.status}`,
                };
            } catch {
                // If not JSON, check text for known errors
                if (errorText.includes('API_SEARCH_NO_RECORDS') || response.status === 404) {
                    return {
                        success: true,
                        matches: [],
                    };
                }

                return {
                    success: false,
                    matches: [],
                    error: `L2 API error: ${response.status}`,
                };
            }
        }

        // L2 returns a JSON array of voter records
        const records = await response.json();

        // Check if response is an array
        if (!Array.isArray(records)) {
            console.error('Unexpected L2 API response format:', records);

            // Check if it's an error response object
            if (records && typeof records === 'object' && 'result' in records) {
                const errorResponse = records as any;
                if (errorResponse.result === 'fail' && errorResponse.message?.includes('API_CUST_APP')) {
                    return {
                        success: false,
                        matches: [],
                        error: `Voter verification is only available for ${demoState}. Please ensure the address is in ${demoState}.`,
                    };
                }

                return {
                    success: false,
                    matches: [],
                    error: errorResponse.message || 'Unexpected API response format',
                };
            }

            return {
                success: false,
                matches: [],
                error: 'Unexpected API response format',
            };
        }

        // Transform L2 API response to our format
        // L2 uses field identifiers like LALVOTERID, Voters_FirstName, etc.
        const matches: L2VoterRecord[] = records.map((record: any) => ({
            voterId: record.LALVOTERID || record.VoterID || '',
            firstName: record.Voters_FirstName || '',
            lastName: record.Voters_LastName || '',
            middleName: record.Voters_MiddleName || undefined,
            fullName: `${record.Voters_FirstName || ''} ${record.Voters_MiddleName || ''} ${record.Voters_LastName || ''}`.trim(),
            address: record.Residence_Addresses_AddressLine || record.Residence_Addresses_FullAddress || '',
            city: record.Residence_Addresses_City || '',
            state: record.Residence_Addresses_State || stateCode,
            zipCode: record.Residence_Addresses_Zip || record.Residence_Addresses_Zip5 || '',
            birthYear: record.Voters_BirthYear || record.Voters_Age || undefined,
            gender: record.Voters_Gender || undefined,
            politicalAffiliation: record.Parties_Description || undefined,
            registrationDate: record.VoterRegistration_Date || undefined,
            voterStatus: record.Voters_Active || 'Active',
            constituentDescription: record.ConstituentDescription || null,
        }));

        return {
            success: true,
            matches,
        };
    } catch (error) {
        console.error('Error verifying voter with L2 API:', error);
        return {
            success: false,
            matches: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Get voter details by voter ID
 */
export async function getVoterById(voterId: string): Promise<L2VoterRecord | null> {
    const customerId = process.env.L2_API_CUSTOMER_ID;
    const apiKey = process.env.L2_API_KEY;

    if (!customerId || !apiKey) {
        console.error('L2 API credentials not configured');
        return null;
    }

    try {
        const endpoint = process.env.L2_API_ENDPOINT || 'https://api.l2datamapping.com/voter';

        const response = await fetch(`${endpoint}/${voterId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Customer-ID': customerId,
                'X-API-Key': apiKey,
            },
        });

        if (!response.ok) {
            console.error('L2 API error:', response.status, response.statusText);
            return null;
        }

        const data = await response.json();

        return {
            voterId: data.voter_id || data.id || '',
            firstName: data.first_name || data.firstName || '',
            lastName: data.last_name || data.lastName || '',
            middleName: data.middle_name || data.middleName,
            fullName: data.full_name || `${data.first_name} ${data.last_name}`,
            address: data.address || data.street_address || '',
            city: data.city || '',
            state: data.state || '',
            zipCode: data.zip_code || data.zipCode || '',
            birthYear: data.birth_year || data.birthYear,
            gender: data.gender,
            politicalAffiliation: data.party || data.political_affiliation,
            registrationDate: data.registration_date || data.registrationDate,
            voterStatus: data.voter_status || data.status || 'Active',
            constituentDescription: data.constituent_description || null,
        };
    } catch (error) {
        console.error('Error fetching voter by ID from L2 API:', error);
        return null;
    }
}