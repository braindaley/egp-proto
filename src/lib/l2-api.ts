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
    age?: number; // Age in years - will be converted to estimated DOB for L2 API
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

        // Check if this is a refined search (has phone or age)
        const isRefinedSearch = request.phone || request.age;

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

            // Estimate DOB from age (format: YYYY-MM-DD)
            // L2 API matches if within 366 days, so using today's date with estimated birth year works
            let dob: string | null = null;
            if (request.age && request.age > 0) {
                const today = new Date();
                const birthYear = today.getFullYear() - request.age;
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                dob = `${birthYear}-${month}-${day}`;
            }

            // Define search attempts - phone first (most unique), then name + age
            const searchAttempts: Record<string, string>[] = [];

            // Attempt 1: Phone only (phone is unique, try first)
            if (phoneDigits) {
                searchAttempts.push({
                    VoterTelephones_CellPhoneUnformatted: phoneDigits,
                });
            }

            // Attempt 2: First + Last + Age (if no phone match, use name + DOB)
            if (dob) {
                searchAttempts.push({
                    Voters_FirstName: request.firstName,
                    Voters_LastName: request.lastName,
                    Voters_BirthDate: dob,
                });
            }

            // Attempt 3: Last + Age (fallback for unusual first name situations)
            if (dob) {
                searchAttempts.push({
                    Voters_LastName: request.lastName,
                    Voters_BirthDate: dob,
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
                } else {
                    // Handle error response
                    const errorText = await attemptResponse.text();
                    console.error(`L2 API Refined Search Attempt ${i + 1} error:`, attemptResponse.status, errorText);

                    try {
                        const errorData = JSON.parse(errorText);

                        // Check for "no records" error - treat as empty results, continue to next attempt
                        if (errorData.message?.includes('API_SEARCH_NO_RECORDS')) {
                            console.log(`L2 API Refined Search Attempt ${i + 1}: No records found, trying next attempt`);
                            // Continue to next attempt
                        }
                        // Check if account doesn't have access to this state - return error immediately
                        else if (errorData.message?.includes('API_CUST_APP')) {
                            return {
                                success: false,
                                matches: [],
                                error: 'Your account does not have access to voter data for this state.',
                            };
                        }
                        // On last attempt, return the error
                        else if (i === searchAttempts.length - 1) {
                            return {
                                success: false,
                                matches: [],
                                error: errorData.message || `L2 API error: ${attemptResponse.status}`,
                            };
                        }
                    } catch {
                        // If not JSON, check text for known errors
                        if (errorText.includes('API_SEARCH_NO_RECORDS') || attemptResponse.status === 404) {
                            console.log(`L2 API Refined Search Attempt ${i + 1}: No records found, trying next attempt`);
                            // Continue to next attempt
                        } else if (i === searchAttempts.length - 1) {
                            return {
                                success: false,
                                matches: [],
                                error: `L2 API error: ${attemptResponse.status}`,
                            };
                        }
                    }
                }

                // If this was the last attempt and we're here, return empty results
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

            // Single search attempt - trust L2's built-in flexibility for names and addresses
            const searchAttempts = [
                {
                    Voters_FirstName: request.firstName,
                    Voters_LastName: request.lastName,
                    ...(houseNumber && { Residence_Addresses_HouseNumber: houseNumber }),
                    ...(request.zipCode && { Residence_Addresses_Zip: request.zipCode }),
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
                } else {
                    // Handle error response
                    const errorText = await attemptResponse.text();
                    console.error(`L2 API Search Attempt ${i + 1} error:`, attemptResponse.status, errorText);

                    try {
                        const errorData = JSON.parse(errorText);

                        // Check for "no records" error - treat as empty results, continue to next attempt
                        if (errorData.message?.includes('API_SEARCH_NO_RECORDS')) {
                            console.log(`L2 API Search Attempt ${i + 1}: No records found, trying next attempt`);
                            // Continue to next attempt
                        }
                        // Check if account doesn't have access to this state - return error immediately
                        else if (errorData.message?.includes('API_CUST_APP')) {
                            return {
                                success: false,
                                matches: [],
                                error: 'Your account does not have access to voter data for this state.',
                            };
                        }
                        // On last attempt, return the error
                        else if (i === searchAttempts.length - 1) {
                            return {
                                success: false,
                                matches: [],
                                error: errorData.message || `L2 API error: ${attemptResponse.status}`,
                            };
                        }
                    } catch {
                        // If not JSON, check text for known errors
                        if (errorText.includes('API_SEARCH_NO_RECORDS') || attemptResponse.status === 404) {
                            console.log(`L2 API Search Attempt ${i + 1}: No records found, trying next attempt`);
                            // Continue to next attempt
                        } else if (i === searchAttempts.length - 1) {
                            return {
                                success: false,
                                matches: [],
                                error: `L2 API error: ${attemptResponse.status}`,
                            };
                        }
                    }
                }

                // If this was the last attempt and we're here, return empty results
                if (i === searchAttempts.length - 1) {
                    console.log('L2 API: No results found after all attempts');
                    return { success: true, matches: [] };
                }
            }

            // This shouldn't be reached, but just in case
            return { success: true, matches: [] };
        }
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