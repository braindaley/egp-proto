/**
 * L2 Political API Service
 *
 * Service for interacting with the L2 Political voter verification API.
 * Uses the Match API (v2) for voter matching with confidence grading.
 */

export interface L2VerificationRequest {
    firstName: string;
    lastName: string;
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
    // Additional refinement fields for "Check Your Registration"
    phone?: string;
    age?: number; // Age in years
    voterId?: string;
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
 * Match API response record structure
 */
interface L2MatchRecord {
    GRADE: string;
    STATUS: string;
    PRIMARY_KEY: string;
    REC_FIRSTNAME?: string;
    REC_LASTNAME?: string;
    REC_MIDDLENAME?: string;
    // Address components
    REC_ADDRESS_NUM?: string;
    REC_ADDRESS_STREET?: string;
    REC_ADDRESS_DESIGNATOR?: string;
    REC_ADDRESS_CITY?: string;
    REC_ADDRESS_STATE?: string;
    REC_ADDRESS_ZIP?: string;
    // Other fields
    REC_BIRTHDATE?: string;
    REC_GENDER?: string;
    REC_PARTY?: string;
    REC_REGDATE?: string;
    REC_STATUS?: string;
    REC_PHONE_LAND?: string;
    REC_PHONE_CELL?: string;
    REC_EMAIL?: string;
    [key: string]: string | undefined;
}

/**
 * Verify a voter using the L2 Political Match API
 * Uses the Match API (v2) which provides confidence grading
 */
export async function verifyVoter(
    request: L2VerificationRequest
): Promise<L2VerificationResponse> {
    const customerId = process.env.L2_API_CUSTOMER_ID;
    const apiKey = process.env.L2_API_KEY;

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

        // L2 Match API endpoint
        const baseUrl = 'https://api.l2datamapping.com';
        const endpoint = `${baseUrl}/api/v2/match/query/${customerId}/${application}`;

        // Build authentication query parameters
        const authParams = new URLSearchParams({
            id: customerId,
            apikey: apiKey,
        });

        // Check if this is a refined search (has phone or age)
        const isRefinedSearch = request.phone || request.age;

        // Build request body
        const requestBody: Record<string, string | number | boolean> = {
            firstname: request.firstName,
            lastname: request.lastName,
            zipcode: request.zipCode || '',
            return_record: true,
            response_max: 10,
            rank_method: 'best',
        };

        // Add refined search parameters if provided
        if (isRefinedSearch) {
            // Add phone number (strip non-digits)
            if (request.phone) {
                const digits = request.phone.replace(/\D/g, '');
                if (digits.length === 10) {
                    requestBody.phone = digits;
                }
            }

            // Add age if provided
            if (request.age && request.age > 0) {
                requestBody.age = request.age;
            }
        }

        console.log('L2 Match API Request:', {
            endpoint,
            body: { ...requestBody, apikey: '[REDACTED]' },
            application,
            isRefinedSearch,
        });

        const response = await fetch(`${endpoint}?${authParams.toString()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (response.ok) {
            const records: L2MatchRecord[] = await response.json();

            if (Array.isArray(records) && records.length > 0) {
                console.log(`L2 Match API found ${records.length} results`);
                // Log first record to see actual field names
                console.log('L2 Match API first record fields:', Object.keys(records[0]));
                console.log('L2 Match API first record:', JSON.stringify(records[0], null, 2));

                // Transform Match API response to L2VoterRecord format
                const matches: L2VoterRecord[] = records.map((record) => {
                    // Build full address from components
                    const addressParts = [
                        record.REC_ADDRESS_NUM,
                        record.REC_ADDRESS_STREET,
                        record.REC_ADDRESS_DESIGNATOR,
                    ].filter(Boolean);
                    const fullAddress = addressParts.join(' ');

                    // Extract birth year from REC_BIRTHDATE (format: "YYYY-MM-DD")
                    let birthYear: string | undefined;
                    if (record.REC_BIRTHDATE) {
                        birthYear = record.REC_BIRTHDATE.split('-')[0];
                    }

                    return {
                        voterId: record.PRIMARY_KEY || '',
                        firstName: record.REC_FIRSTNAME || '',
                        lastName: record.REC_LASTNAME || '',
                        middleName: record.REC_MIDDLENAME || undefined,
                        fullName: `${record.REC_FIRSTNAME || ''} ${record.REC_MIDDLENAME || ''} ${record.REC_LASTNAME || ''}`.trim().replace(/\s+/g, ' '),
                        address: fullAddress,
                        city: record.REC_ADDRESS_CITY || '',
                        state: record.REC_ADDRESS_STATE || stateCode,
                        zipCode: record.REC_ADDRESS_ZIP || '',
                        birthYear,
                        gender: record.REC_GENDER || undefined,
                        politicalAffiliation: record.REC_PARTY || undefined,
                        registrationDate: record.REC_REGDATE || undefined,
                        voterStatus: record.REC_STATUS || 'Active',
                        constituentDescription: null,
                    };
                });

                return { success: true, matches };
            }

            // Empty array response
            console.log('L2 Match API: No results found');
            return { success: true, matches: [] };
        } else {
            // Handle error response
            const errorText = await response.text();
            console.error('L2 Match API error:', response.status, errorText);

            try {
                const errorData = JSON.parse(errorText);

                // Check for "no records" error
                if (errorData.message?.includes('API_SEARCH_NO_RECORDS') ||
                    errorData.message?.includes('API_MATCH_NO_RECORDS')) {
                    console.log('L2 Match API: No records found');
                    return { success: true, matches: [] };
                }

                // Check if account doesn't have access to this state
                if (errorData.message?.includes('API_CUST_APP')) {
                    return {
                        success: false,
                        matches: [],
                        error: 'Your account does not have access to voter data for this state.',
                    };
                }

                return {
                    success: false,
                    matches: [],
                    error: errorData.message || `L2 API error: ${response.status}`,
                };
            } catch {
                // If not JSON, check text for known errors
                if (errorText.includes('API_SEARCH_NO_RECORDS') ||
                    errorText.includes('API_MATCH_NO_RECORDS') ||
                    response.status === 404) {
                    console.log('L2 Match API: No records found');
                    return { success: true, matches: [] };
                }

                return {
                    success: false,
                    matches: [],
                    error: `L2 API error: ${response.status}`,
                };
            }
        }
    } catch (error) {
        console.error('Error verifying voter with L2 Match API:', error);
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
