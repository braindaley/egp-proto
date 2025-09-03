/**
 * Legiscan API Connector
 * Provides access to state and federal legislative data via the Legiscan API
 */

export interface LegiscanConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface LegiscanSession {
  session_id: number;
  state_id: number;
  year_start: number;
  year_end: number;
  name: string;
  special: number;
}

export interface LegiscanBill {
  bill_id: number;
  bill_number: string;
  title: string;
  description: string;
  state: string;
  session: LegiscanSession;
  status: number;
  status_date: string;
  url: string;
}

export interface LegiscanApiResponse<T> {
  status: string;
  data?: T;
  error?: {
    message: string;
    code?: number;
  };
}

export class LegiscanConnector {
  private config: LegiscanConfig;

  constructor(config: LegiscanConfig) {
    this.config = {
      baseUrl: 'https://api.legiscan.com',
      timeout: 10000,
      ...config,
    };
  }

  /**
   * Make authenticated API request to Legiscan
   */
  private async makeRequest<T>(
    operation: string,
    params: Record<string, any> = {}
  ): Promise<LegiscanApiResponse<T>> {
    try {
      const url = new URL('/', this.config.baseUrl);
      
      // Add API key and operation
      url.searchParams.set('key', this.config.apiKey);
      url.searchParams.set('op', operation);
      
      // Add other parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EGP-Legiscan-Connector/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          status: 'error',
          error: {
            message: `HTTP ${response.status}: ${response.statusText}`,
            code: response.status,
          },
        };
      }

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        return {
          status: 'error',
          error: {
            message: `Expected JSON but received ${contentType}. Response: ${text.substring(0, 200)}...`,
          },
        };
      }

      const data = await response.json();
      return {
        status: 'success',
        data,
      };
    } catch (error: any) {
      // Handle JSON parsing errors specifically
      if (error.message.includes('Unexpected token') || error.message.includes('Unexpected end of JSON input')) {
        return {
          status: 'error',
          error: {
            message: `JSON parsing failed: ${error.message}. The API may have returned HTML instead of JSON.`,
          },
        };
      }
      
      return {
        status: 'error',
        error: {
          message: error.message || 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Get list of sessions for a specific state
   */
  async getSessions(stateCode?: string): Promise<LegiscanApiResponse<LegiscanSession[]>> {
    const params = stateCode ? { state: stateCode } : {};
    return this.makeRequest('getSessionList', params);
  }

  /**
   * Get master list of bills for a session
   */
  async getMasterList(sessionId: number, page?: number): Promise<LegiscanApiResponse<any>> {
    const params: any = { id: sessionId };
    if (page) params.page = page;
    
    return this.makeRequest('getMasterList', params);
  }

  /**
   * Get detailed information about a specific bill
   */
  async getBill(billId: number): Promise<LegiscanApiResponse<LegiscanBill>> {
    return this.makeRequest('getBill', { id: billId });
  }

  /**
   * Search for bills across all states
   */
  async searchBills(query: string, params?: {
    state?: string;
    year?: number;
    page?: number;
  }): Promise<LegiscanApiResponse<any>> {
    const searchParams = {
      query,
      ...params,
    };
    
    return this.makeRequest('getSearch', searchParams);
  }

  /**
   * Get bill text
   */
  async getBillText(docId: number): Promise<LegiscanApiResponse<any>> {
    return this.makeRequest('getBillText', { id: docId });
  }

  /**
   * Get amendment details
   */
  async getAmendment(amendmentId: number): Promise<LegiscanApiResponse<any>> {
    return this.makeRequest('getAmendment', { id: amendmentId });
  }

  /**
   * Get roll call vote details
   */
  async getRollCall(rollCallId: number): Promise<LegiscanApiResponse<any>> {
    return this.makeRequest('getRollCall', { id: rollCallId });
  }

  /**
   * Get person/legislator details
   */
  async getPerson(personId: number): Promise<LegiscanApiResponse<any>> {
    return this.makeRequest('getPerson', { id: personId });
  }

  /**
   * Get sponsor information for a bill
   */
  async getSponsorList(billId: number): Promise<LegiscanApiResponse<any>> {
    return this.makeRequest('getSponsoredList', { id: billId });
  }

  /**
   * Get recent bills for monitoring
   */
  async getRecentBills(params?: {
    state?: string;
    days?: number;
  }): Promise<LegiscanApiResponse<any>> {
    return this.makeRequest('getMonitorList', params);
  }

  /**
   * Get all people (legislators) active in a specific session
   */
  async getSessionPeople(sessionId: number): Promise<LegiscanApiResponse<any>> {
    return this.makeRequest('getSessionPeople', { id: sessionId });
  }
}

/**
 * Create a Legiscan connector instance with environment configuration
 */
export function createLegiscanConnector(): LegiscanConnector {
  const apiKey = process.env.LEGISCAN_API_KEY;
  
  if (!apiKey) {
    throw new Error('LEGISCAN_API_KEY environment variable is required');
  }

  return new LegiscanConnector({
    apiKey,
    baseUrl: process.env.LEGISCAN_BASE_URL || 'https://api.legiscan.com',
    timeout: parseInt(process.env.LEGISCAN_TIMEOUT || '10000'),
  });
}

/**
 * State ID mapping for common states
 */
export const LEGISCAN_STATE_IDS = {
  'AL': 1,  // Alabama
  'AK': 2,  // Alaska
  'AZ': 3,  // Arizona
  'AR': 4,  // Arkansas
  'CA': 5,  // California
  'CO': 6,  // Colorado
  'CT': 7,  // Connecticut
  'DE': 8,  // Delaware
  'FL': 9,  // Florida
  'GA': 10, // Georgia
  'HI': 11, // Hawaii
  'ID': 12, // Idaho
  'IL': 13, // Illinois
  'IN': 14, // Indiana
  'IA': 15, // Iowa
  'KS': 16, // Kansas
  'KY': 17, // Kentucky
  'LA': 18, // Louisiana
  'ME': 19, // Maine
  'MD': 20, // Maryland
  'MA': 21, // Massachusetts
  'MI': 22, // Michigan
  'MN': 23, // Minnesota
  'MS': 24, // Mississippi
  'MO': 25, // Missouri
  'MT': 26, // Montana
  'NE': 27, // Nebraska
  'NV': 28, // Nevada
  'NH': 29, // New Hampshire
  'NJ': 30, // New Jersey
  'NM': 31, // New Mexico
  'NY': 32, // New York
  'NC': 33, // North Carolina
  'ND': 34, // North Dakota
  'OH': 35, // Ohio
  'OK': 36, // Oklahoma
  'OR': 37, // Oregon
  'PA': 38, // Pennsylvania
  'RI': 39, // Rhode Island
  'SC': 40, // South Carolina
  'SD': 41, // South Dakota
  'TN': 42, // Tennessee
  'TX': 43, // Texas
  'UT': 44, // Utah
  'VT': 45, // Vermont
  'VA': 46, // Virginia
  'WA': 47, // Washington
  'WV': 48, // West Virginia
  'WI': 49, // Wisconsin
  'WY': 50, // Wyoming
  'US': 52, // Federal/Congress
};