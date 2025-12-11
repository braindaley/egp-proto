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
    // Additional refinement fields for "Check Your Registration"
    phone?: string;
    dobMonth?: string;
    dobDay?: string;
    dobYear?: string;
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
 * Verify a voter using the L2 Political API
 * Uses the Search Records API (v2) as documented in L2 DataMapping API v2.0.13
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

        // L2 API v2 Search Records endpoint
        const baseUrl = 'https://api.l2datamapping.com';
        const endpoint = `${baseUrl}/api/v2/records/search/${customerId}/${application}`;

        // Build authentication query parameters
        const authParams = new URLSearchParams({
            id: customerId,
            apikey: apiKey,
        });

        // Build filters for the search
        const filters: Record<string, string | string[]> = {};

        // Check if this is a refined search (has phone or DOB)
        const isRefinedSearch = request.phone || request.dobYear;

        if (isRefinedSearch) {
            // Refined search: use progressive fallback strategy
            // Try strict first, then loosen criteria if no results

            // Prepare phone number (strip non-digits)
            let phoneDigits: string | null = null;
            if (request.phone) {
                const digits = request.phone.replace(/\D/g, '');
                if (digits.length === 10) {
                    phoneDigits = digits;
                }
            }

            // Prepare DOB (format: YYYY-MM-DD)
            let dob: string | null = null;
            if (request.dobYear && request.dobMonth && request.dobDay) {
                dob = `${request.dobYear}-${request.dobMonth.padStart(2, '0')}-${request.dobDay.padStart(2, '0')}`;
            }

            // Define search attempts in order of strictness
            const searchAttempts: Record<string, string>[] = [];

            // Attempt 1: All provided fields (most strict)
            const allFilters: Record<string, string> = { Voters_LastName: request.lastName };
            if (phoneDigits) allFilters.VoterTelephones_CellPhoneUnformatted = phoneDigits;
            if (dob) allFilters.Voters_BirthDate = dob;
            if (request.voterId) allFilters.Voters_StateVoterID = request.voterId;
            searchAttempts.push(allFilters);

            // Attempt 2: Last name + DOB only (drop phone)
            if (dob) {
                searchAttempts.push({
                    Voters_LastName: request.lastName,
                    Voters_BirthDate: dob,
                    ...(request.voterId && { Voters_StateVoterID: request.voterId }),
                });
            }

            // Attempt 3: Last name + Phone only (drop DOB)
            if (phoneDigits) {
                searchAttempts.push({
                    Voters_LastName: request.lastName,
                    VoterTelephones_CellPhoneUnformatted: phoneDigits,
                    ...(request.voterId && { Voters_StateVoterID: request.voterId }),
                });
            }

            // Attempt 4: Last name + Voter ID only (if provided)
            if (request.voterId) {
                searchAttempts.push({
                    Voters_LastName: request.lastName,
                    Voters_StateVoterID: request.voterId,
                });
            }

            // Try each search attempt until we get results
            for (let i = 0; i < searchAttempts.length; i++) {
                const attemptFilters = searchAttempts[i];

                console.log(`L2 API Refined Search Attempt ${i + 1}:`, {
                    endpoint,
                    filters: attemptFilters,
                    application,
                });

                const attemptResponse = await fetch(`${endpoint}?${authParams.toString()}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        filters: attemptFilters,
                        format: 'json',
                        fieldset: 'SIMPLE',
                        limit: 50,
                        wait: 30000,
                    }),
                });

                if (attemptResponse.ok) {
                    const records = await attemptResponse.json();
                    if (Array.isArray(records) && records.length > 0) {
                        console.log(`L2 API Refined Search found ${records.length} results on attempt ${i + 1}`);
                        // Transform and return results
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
                        return { success: true, matches };
                    }
                }

                // If this was the last attempt, return empty results
                if (i === searchAttempts.length - 1) {
                    console.log('L2 API Refined Search: No results found after all attempts');
                    return { success: true, matches: [] };
                }
            }

            // This shouldn't be reached, but just in case
            return { success: true, matches: [] };
        } else {
            // Initial search: use progressive fallback strategy
            // Try strict first, then loosen criteria if no results

            // Extract house number from address
            let houseNumber: string | null = null;
            if (request.address) {
                const houseNumberMatch = request.address.match(/^(\d+)/);
                if (houseNumberMatch) {
                    houseNumber = houseNumberMatch[1];
                }
            }

            // Define search attempts in order of strictness
            const searchAttempts = [
                // Attempt 1: All 4 filters (most strict)
                {
                    Voters_FirstName: request.firstName,
                    Voters_LastName: request.lastName,
                    ...(houseNumber && { Residence_Addresses_HouseNumber: houseNumber }),
                    ...(request.zipCode && { Residence_Addresses_Zip: request.zipCode }),
                },
                // Attempt 2: First + Last + ZIP (no house number)
                {
                    Voters_FirstName: request.firstName,
                    Voters_LastName: request.lastName,
                    ...(request.zipCode && { Residence_Addresses_Zip: request.zipCode }),
                },
                // Attempt 3: First + Last + House (no ZIP)
                {
                    Voters_FirstName: request.firstName,
                    Voters_LastName: request.lastName,
                    ...(houseNumber && { Residence_Addresses_HouseNumber: houseNumber }),
                },
                // Attempt 4: First + Last only (least strict)
                {
                    Voters_FirstName: request.firstName,
                    Voters_LastName: request.lastName,
                },
            ];

            // Try each search attempt until we get results
            for (let i = 0; i < searchAttempts.length; i++) {
                const attemptFilters = searchAttempts[i];

                console.log(`L2 API Search Attempt ${i + 1}:`, {
                    endpoint,
                    filters: attemptFilters,
                    application,
                });

                const attemptResponse = await fetch(`${endpoint}?${authParams.toString()}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        filters: attemptFilters,
                        format: 'json',
                        fieldset: 'SIMPLE',
                        limit: 50,
                        wait: 30000,
                    }),
                });

                if (attemptResponse.ok) {
                    const records = await attemptResponse.json();
                    if (Array.isArray(records) && records.length > 0) {
                        console.log(`L2 API found ${records.length} results on attempt ${i + 1}`);
                        // Transform and return results
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
                        return { success: true, matches };
                    }
                }

                // If this was the last attempt, continue to error handling below
                if (i === searchAttempts.length - 1) {
                    console.log('L2 API: No results found after all attempts');
                    return { success: true, matches: [] };
                }
            }

            // This shouldn't be reached, but just in case
            return { success: true, matches: [] };
        }

        console.log('L2 API Request:', {
            endpoint,
            filters,
            application,
        });

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

        console.log('L2 API Response status:', response.status, response.statusText);

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
                        error: 'Your account does not have access to voter data for this state.',
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
                        error: 'Your account does not have access to voter data for this state.',
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