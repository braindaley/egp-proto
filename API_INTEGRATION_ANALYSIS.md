# Third-Party API Integration Analysis
## EGP Proto Application

This document provides a comprehensive analysis of all third-party API integrations in the EGP Proto application, including response structures, field mappings, and data transformations.

---

## 1. CONGRESS API (api.congress.gov)

### Overview
**Base URL:** `https://api.congress.gov/v3`
**Authentication:** Query parameter `api_key`
**Environment Variable:** `CONGRESS_API_KEY`

### API Endpoints Used

#### A. Get Members by Congress & State
**Endpoint:** `/member/congress/{congress}/{stateCode}`
**Used In:** `/src/app/api/congress/members/route.ts`

**Request Fields:**
- `congress`: string (e.g., "119")
- `stateCode`: string (2-letter state abbreviation, e.g., "CA")
- `currentMember`: boolean (optional, default false)
- `limit`: number (optional, default 250)
- `api_key`: string (API key)

**Response Structure:**
```typescript
{
  members: [
    {
      bioguideId: string;
      name: string;
      partyName: string;
      state: string;
      terms: {
        item: [
          {
            chamber: 'Senate' | 'House of Representatives';
            congress: number;
            startYear: number;
            endYear: number;
            memberType: string;
            partyName: string;
            stateCode: string;
            stateName: string;
            district?: number;
            phone?: string;
            office?: string;
          }
        ]
      };
      // ... additional fields
    }
  ]
}
```

**Fields Extracted & Used:**
- `bioguideId`: Used to identify members uniquely
- `name`: Display in UI
- `partyName`: Party affiliation display
- `state`: Location filtering
- `terms[].chamber`: Separates Senators from House Representatives
- `terms[].district`: Congressional district identification

**Data Transformation:**
- Filters members into two arrays: `senators` and `representatives`
- Based on chamber type in terms array

---

#### B. Get Member Details
**Endpoint:** `/member/{bioguideId}`
**Used In:** `/src/app/api/congress/member/[bioguideId]/route.ts`

**Response Structure:**
```typescript
{
  member: {
    bioguideId: string;
    firstName: string;
    lastName: string;
    directOrderName: string;
    invertedOrderName: string;
    honorificName: string;
    currentMember: boolean;
    chamber: string;
    state: string;
    partyName: string;
    url: string;
    updateDate: string;
    birthDate?: string;
    deathDate?: string;
    birthYear?: string;
    birthLocation?: string;
    education?: string;
    profession?: string;
    family?: string;
    officialWebsiteUrl?: string;
    depiction?: {
      imageUrl: string;
      attribution: string;
    };
    leadership?: [
      {
        type: string;
        congress: number;
      }
    ];
    partyHistory?: [
      {
        partyName: string;
        partyAbbreviation: string;
        startYear: number;
        endYear?: number;
      }
    ];
    terms: {
      item?: MemberTerm[];
      current?: {
        startYear: string;
        congress?: number;
      };
    };
    sponsoredLegislation?: {
      count: number;
      url: string;
    };
    cosponsoredLegislation?: {
      count: number;
      url: string;
    };
    addressInformation?: {
      city: string;
      district: string;
      officeAddress: string;
      phoneNumber: string;
      zipCode: string;
    };
  }
}
```

**Fields Extracted & Used:**
- `bioguideId`: Member identification
- `firstName`, `lastName`, `directOrderName`: Display name variations
- `depiction.imageUrl`: Member portrait/avatar
- `partyName`, `partyHistory`: Party affiliation tracking
- `officialWebsiteUrl`: Link to member's website
- `chamber`: Legislative chamber identification
- `terms`: Current and historical service terms
- `sponsoredLegislation`: Bill sponsorship count/link
- `cosponsoredLegislation`: Co-sponsorship count/link

**Merging with Extended IDs:**
- Fetches from GitHub: `https://unitedstates.github.io/congress-legislators/legislators-current.json`
- Merges additional identifiers:
  - `thomas`: Thomas Congress identifier
  - `govtrack`: GovTrack ID
  - `opensecrets`: OpenSecrets identifier
  - `votesmart`: VoteSmart ID
  - `icpsr`: ICPSR ID
  - `fec`: FEC candidate IDs (array)
  - `cspan`: C-SPAN ID
  - `wikipedia`: Wikipedia URL
  - `ballotpedia`: Ballotpedia URL
  - `wikidata`: Wikidata identifier

---

#### C. Get Member News Feed
**Endpoint:** `/member/{bioguideId}` (to get name) + Google News RSS
**Used In:** `/src/app/api/congress/member/[bioguideId]/news/route.ts`

**Request Flow:**
1. Fetch member details from Congress API to get `directOrderName`
2. Construct Google News RSS feed URL: `https://news.google.com/rss/search?q="{memberName}"&hl=en-US&gl=US&ceid=US:en`
3. Parse RSS feed using `rss-parser` library

**Response Structure (News Articles):**
```typescript
{
  articles: [
    {
      title: string;
      link: string;
      pubDate: string;
      source?: {
        $: {
          url: string;
        };
        _: string;
      };
      content?: string;
      imageUrl?: string | null;
    }
  ];
}
```

**Fields Extracted & Used:**
- `title`: Article headline
- `link`: URL to full article
- `pubDate`: Publication date
- `content`: HTML content for image extraction
- `imageUrl`: Extracted from `<img>` tags in HTML content

---

#### D. Get Bill Details
**Endpoint:** `/bill/{congress}/{type}/{number}`
**Used In:** `/src/app/api/feed/bills/route.ts`

**Request Fields:**
- `congress`: number
- `type`: string (e.g., "hr", "s")
- `number`: number
- `api_key`: string

**Response Structure:**
```typescript
{
  bill: {
    congress: number;
    number: string;
    type: string;
    title: string;
    shortTitle?: string;
    introducedDate: string;
    latestAction: {
      actionDate: string;
      text: string;
    };
    updateDate: string;
    url: string;
    originChamber: string;
    originChamberCode: string;
    sponsors: Sponsor[];
    cosponsors?: {
      count: number;
      items: Cosponsor[];
      url: string;
    };
    committees: {
      count: number;
      items: Committee[];
    };
    summaries?: {
      count: number;
      url?: string;
      items?: Summary[];
    };
    textVersions: {
      count: number;
      items: TextVersion[];
    };
    actions: {
      count: number;
      items: Action[];
    };
    amendments: {
      count: number;
      items: Amendment[];
    };
    relatedBills: {
      count: number;
      items: RelatedBill[];
    };
    subjects?: {
      count: number;
      items: Subject[];
      legislativeSubjects?: Subject[];
      policyArea?: {
        name: string;
      };
    };
  }
}
```

**Fields Extracted & Used:**
- `title`: Bill name
- `shortTitle`: Abbreviated title
- `congress`, `type`, `number`: Bill identification
- `latestAction.text`: Status determination
- `sponsors`: Primary sponsor info for display
- `cosponsors`: Co-sponsorship count for scoring
- `subjects.policyArea.name`: Category/subject mapping
- `subjects.legislativeSubjects`: Multiple subject tags
- `summaries.items`: Bill summaries (fetched from URL if needed)

**Data Transformations:**
- Maps subjects to standardized category list via `mapApiSubjectToAllowed()`
- Calculates importance score based on:
  - Latest action text (e.g., "became law" = 50 points)
  - Co-sponsor count
  - Subject matter keywords
  - Time since last action

---

#### E. Get Bill Summaries
**Endpoint:** `/bill/{congress}/{type}/{number}/summaries` (via URL from bill response)
**Used In:** `/src/app/api/feed/bills/route.ts`

**Response Structure:**
```typescript
{
  summaries: [
    {
      versionCode: string;
      actionDate: string;
      actionDesc: string;
      text: string; // HTML formatted
      updateDate: string;
    }
  ]
}
```

**Fields Extracted:**
- `text`: HTML summary content
- `updateDate`: Latest summary date

**Transformation:**
- Converts HTML to plain text using `html-to-text` library
- Selects latest summary by `updateDate`

---

#### F. Get Bills List
**Endpoint:** `/bill/{congress}?updatedSince={date}&limit=100&sort=updateDate+desc`
**Used In:** `/src/app/api/feed/bills/route.ts`

**Response Structure:**
```typescript
{
  bills: Bill[]; // Array of Bill objects
  pagination: {
    count: number;
    next: string;
  };
  request: {
    contentType: string;
    format: string;
  };
}
```

**Fields Used:**
- `bills`: Array of bills
- Each bill filtered for status and processed

---

#### G. Get Member Votes
**Endpoint:** `/house-vote/{congress}` or `/senate-vote/{congress}`
**Used In:** `/src/app/api/congress/member/[bioguideId]/votes/route.ts`

**Response Structure (Chamber Votes):**
```typescript
{
  houseRollCallVotes: [
    {
      congress: number;
      sessionNumber: number;
      rollCallNumber: number;
      startDate: string;
      // ... vote details
    }
  ]
  // OR senateRollCallVotes
}
```

**Fields Extracted:**
- `congress`: Congressional session
- `rollCallNumber`: Vote identifier
- `startDate`: Vote date

---

### Summary: Congress API Fields Used

**Requested:** Members, Terms, Bills, Sponsors, Cosponsors, Subjects, Summaries, Votes, Images
**Displayed:** Names, Party, District, Bill Status, Sponsors, Subjects, News, Images
**Transformations:** Status parsing, Score calculation, Subject mapping, HTML to text conversion

---

## 2. LEGISCAN API

### Overview
**Base URL:** `https://api.legiscan.com`
**Authentication:** Query parameter `key` + `op`
**Environment Variable:** `LEGISCAN_API_KEY`

### Connector Implementation
**File:** `/src/lib/legiscan-connector.ts`

### API Operations (via `op` parameter)

#### Operations Available:
- `getSessionList`: Get legislative sessions for a state
- `getMasterList`: Get all bills for a session
- `getBill`: Get detailed bill information
- `getSearch`: Search bills
- `getBillText`: Get bill text document
- `getAmendment`: Get amendment details
- `getRollCall`: Get roll call vote details
- `getPerson`: Get legislator details
- `getSponsoredList`: Get bills sponsored by legislator
- `getMonitorList`: Get recent bills for monitoring
- `getSessionPeople`: Get all legislators in a session
- `getDataset`: Bulk download for a session

### Response Structure (Generic API Response)
```typescript
{
  status: 'success' | 'error';
  data?: T; // Operation-specific data
  error?: {
    message: string;
    code?: number;
  };
}
```

### Specific Data Structures

#### Session
```typescript
{
  session_id: number;
  state_id: number;
  year_start: number;
  year_end: number;
  name: string;
  special: number;
}
```

#### Bill
```typescript
{
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
```

### State ID Mapping
```typescript
LEGISCAN_STATE_IDS = {
  'AL': 1, 'AK': 2, 'AZ': 3, // ... all states
  'US': 52, // Federal/Congress
}
```

### Mock Implementation
**File:** `/src/app/api/legiscan/route.ts`

Provides mock data for:
- State legislative sessions
- Bill master lists
- Individual bills
- Legislators (session people)
- Bill search results
- Recent bills

---

## 3. BALLOTREADY API (CIVICENGINE - GraphQL)

### Overview
**Base URL:** `https://bpi.civicengine.com/graphql`
**Authentication:** Bearer token in Authorization header
**Environment Variable:** `BALLOT_READY_API_KEY`
**Protocol:** GraphQL POST requests

### Service File
`/src/lib/ballotready-api.ts`

### GraphQL Query: Get Office Holders
```graphql
query GetOfficeHolders(
  $location: LocationFilter!,
  $filterBy: OfficeHolderFilter,
  $first: Int
) {
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
```

### Input Types

#### LocationInput
```typescript
{
  address?: string;       // Full address string
  point?: {
    latitude: number;
    longitude: number;
  };
  zip?: string;          // 5-digit ZIP code
}
```

#### Request Variables Example
```typescript
{
  location: {
    address?: string | { latitude, longitude } | { zip }
  },
  filterBy?: {
    isCurrent: true  // Optional filter
  },
  first: number      // Results limit (default 50)
}
```

### Response Structure
```typescript
{
  officeHolders: [
    {
      id: string;
      isCurrent: boolean;
      isAppointed: boolean;
      officeTitle?: string;
      startAt?: string;
      endAt?: string;
      totalYearsInOffice?: number;
      person?: {
        fullName: string;
        firstName?: string;
        lastName?: string;
        middleName?: string;
        nickname?: string;
        contacts: [
          {
            email?: string;
            phone?: string;
            fax?: string;
            type?: string;
          }
        ];
        urls: [
          {
            url: string;
            type?: string;
          }
        ];
      };
      position: {
        name: string;
        level: 'FEDERAL' | 'STATE' | 'COUNTY' | 'LOCAL';
        description?: string;
        state?: string;
      };
      addresses: [
        {
          addressLine1?: string;
          addressLine2?: string;
          city?: string;
          state?: string;
          zip?: string;
          type?: string;
        }
      ];
      parties: [
        {
          name: string;
          shortName?: string;
        }
      ];
    }
  ]
}
```

### Fields Extracted & Used
- `person.fullName`: Display name
- `position.level`: Filter by government level
- `position.name`: Office title
- `isCurrent`: Current office holder indicator
- `person.contacts.phone` / `.email`: Contact information
- `person.urls.url`: Website/social links
- `addresses`: Office addresses by type
- `parties.name`: Party affiliation

### Data Transformation
- Groups office holders by level: FEDERAL, STATE, COUNTY, LOCAL
- Filters for current office holders by default
- Maps GraphQL response to application interface

---

## 4. OPENFEC API (Campaign Finance)

### Overview
**Base URL:** `https://api.open.fec.gov/v1`
**Authentication:** Query parameter `api_key`
**Environment Variable:** `FEC_API_KEY`

### Endpoints Used

#### A. Get Candidate Details
**Endpoint:** `/candidate/{fecId}`
**Used In:** `/src/app/api/fec/candidate/[fecId]/route.ts`

**Response Structure:**
```typescript
{
  results: [
    {
      candidate_id: string;
      name: string;
      party_full: string;
      incumbent_challenge_full: string;
      office_full: string; // e.g., "President", "House", "Senate"
      state: string;
      district: string;
      election_years: number[];
    }
  ]
}
```

**Fields Extracted:**
- `name`: Candidate name
- `party_full`: Full party name
- `incumbent_challenge_full`: Incumbent/Challenger/Open status
- `office_full`: Office seeking
- `state`: Home state
- `district`: District (if House)
- `election_years`: Years candidate ran

---

#### B. Get Candidate Totals (Financial)
**Endpoint:** `/candidate/{fecId}/totals`
**Used In:** `/src/app/api/fec/candidate/[fecId]/totals/route.ts`

**Response Structure:**
```typescript
{
  results: [
    {
      cycle: number;
      receipts: number;
      disbursements: number;
      cash_on_hand_end_period: number;
      debts_owed_by_committee: number;
      individual_itemized_contributions: number;
      individual_unitemized_contributions: number;
      other_political_committee_contributions: number;
      candidate_contribution: number;
    }
  ]
}
```

**Fields Extracted & Calculated:**
- `cycle`: Election cycle year
- `receipts`: Total funds received
- `disbursements`: Total funds spent
- `cash_on_hand_end_period`: Remaining cash
- `debts_owed_by_committee`: Debts owed
- `large_contributions`: Individual itemized contributions
- `small_contributions`: Individual unitemized contributions
- `pac_contributions`: PAC contributions
- `candidate_contributions`: Candidate self-funding
- `other_contributions`: Calculated residual

---

#### C. Get State Contributors
**Endpoint:** `/schedules/schedule_a/by_state/by_candidate`
**Used In:** `/src/app/api/fec/candidate/[fecId]/state-contributors/route.ts`

**Query Parameters:**
- `candidate_id`: FEC candidate ID
- `cycle`: Election cycle (tries 2024, 2022, 2020)
- `sort`: `-total` (descending)
- `per_page`: 5

**Response Structure:**
```typescript
{
  results: [
    {
      state: string;
      state_full?: string;
      total: number;
    }
  ]
}
```

**Fields Extracted:**
- `state` or `state_full`: State code/name
- `total`: Total contributions from state

---

#### D. Get Individual Contributors (by Employer)
**Endpoint:** `/schedules/schedule_a/by_employer`
**Used In:** `/src/app/api/fec/candidate/[fecId]/individual-contributors/route.ts`

**Query Parameters:**
- `candidate_id`: FEC candidate ID
- `cycle`: Election cycle (tries 2024, 2022, 2020)
- `sort`: `-total` (descending)
- `per_page`: 50

**Response Structure:**
```typescript
{
  results: [
    {
      employer: string;
      total: number;
    }
  ]
}
```

**Fields Extracted:**
- `employer`: Employer name of contributors
- `total`: Total contributions from employer

**Data Filtering:**
- Excludes employers: RETIRED, SELF-EMPLOYED, UNEMPLOYED, HOMEMAKER, NONE, NULL, N/A
- Limits to top 10 valid employers

---

## 5. GEOCODIO API

### Overview
**Base URL:** `https://api.geocod.io/v1.7`
**Authentication:** Query parameter `api_key`
**Environment Variable:** `GEOCODIO_API_KEY`

### Endpoint Used
**Endpoint:** `/geocode?q={zipCode}&fields=cd&api_key={key}`
**Used In:** `/src/app/api/congress/members/by-zip/route.ts`

### Request Fields
- `q`: ZIP code query
- `fields`: "cd" (congressional district data)
- `api_key`: API key

### Response Structure
```typescript
{
  results: [
    {
      fields: {
        congressional_districts: [
          {
            name: string;
            district_number: number;
            current_legislators: [
              {
                type: 'representative' | 'senator';
                bio: {
                  last_name: string;
                  first_name: string;
                  birthday: string;
                  gender: string;
                  party: string;
                };
                contact: {
                  url: string;
                  phone: string;
                };
                social: {
                  twitter: string;
                };
                references: {
                  bioguide_id: string;
                };
              }
            ];
          }
        ];
      };
    }
  ];
}
```

### Fields Extracted & Used
- `current_legislators[].bio.first_name` / `.last_name`: Full name construction
- `current_legislators[].type`: Representative vs Senator
- `current_legislators[].bio.party`: Party affiliation
- `current_legislators[].contact.phone`: Phone number
- `current_legislators[].contact.url`: Office website
- `current_legislators[].references.bioguide_id`: Congress API ID
- `congressional_districts[].district_number`: District ID

### Data Transformation
- Maps Geocodio response to application representative format
- Deduplicates results (removes overlapping district senators)
- Constructs office title based on type

### Fallback Mechanism
If Geocodio fails or key not configured:
1. Uses ZIP-to-district hardcoded mapping
2. Falls back to Congress API direct query by state code
3. Returns empty array if ZIP not found in either method

---

## 6. L2 POLITICAL API (Voter Verification)

### Overview
**Base URL:** `https://api.l2datamapping.com`
**Authentication:** Query parameters `id` (customer ID) and `apikey`
**Environment Variables:**
- `L2_API_CUSTOMER_ID`
- `L2_API_KEY`
- `L2_API_DEMO_STATE` (optional, defaults to 'Delaware')

### Service File
`/src/lib/l2-api.ts`

### Endpoint: Search Records
**Endpoint:** `/api/v2/records/search/{customerId}/{application}`

**Application Format:** `VM_{STATE_CODE}` (e.g., `VM_DE`, `VM_CA`)

**Request Structure:**
```typescript
POST {endpoint}?id={customerId}&apikey={apiKey}

{
  filters: {
    Voters_FirstName: string;
    Voters_LastName: string;
    Residence_Addresses_Zip?: string;
    Residence_Addresses_City?: string;
  },
  format: 'json';
  fieldset: 'SIMPLE' | 'EXTENDED' | 'ALL';
  limit: number;
  wait: number; // milliseconds
}
```

### Response Structure
```typescript
// Returns JSON array of voter records
[
  {
    LALVOTERID: string;
    VoterID?: string;
    Voters_FirstName: string;
    Voters_LastName: string;
    Voters_MiddleName?: string;
    Voters_BirthYear?: string;
    Voters_Age?: string;
    Voters_Gender?: string;
    Residence_Addresses_AddressLine?: string;
    Residence_Addresses_FullAddress?: string;
    Residence_Addresses_City: string;
    Residence_Addresses_State: string;
    Residence_Addresses_Zip: string;
    Residence_Addresses_Zip5?: string;
    Parties_Description?: string;
    VoterRegistration_Date?: string;
    Voters_Active?: string;
    ConstituentDescription?: string | null;
  }
]
```

### Fields Extracted & Transformed
- `LALVOTERID` / `VoterID`: Unique voter identifier
- `Voters_FirstName`, `Voters_LastName`, `Voters_MiddleName`: Name components
- `Residence_Addresses_*`: Address details
- `Voters_BirthYear` / `Voters_Age`: Birth year
- `Voters_Gender`: Gender
- `Parties_Description`: Political party affiliation
- `VoterRegistration_Date`: Registration date
- `Voters_Active`: Voter status

### Application Interface (Transformed)
```typescript
{
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
```

### Endpoint: Get Voter by ID
**Endpoint:** `{endpoint}/{voterId}` (custom config)

**Response Fields (Alternative API):**
```typescript
{
  voter_id | id: string;
  first_name | firstName: string;
  last_name | lastName: string;
  middle_name | middleName?: string;
  full_name: string;
  street_address | address: string;
  city: string;
  state: string;
  zip_code | zipCode: string;
  birth_year | birthYear?: string;
  party | political_affiliation?: string;
  registration_date | registrationDate?: string;
  voter_status | status?: string;
  constituent_description?: string | null;
}
```

---

## 7. GOOGLE GEMINI AI API

### Overview
**Base URL:** `https://generativelanguage.googleapis.com/v1beta`
**Model:** `gemini-2.0-flash-exp`
**Authentication:** Query parameter `key`
**Environment Variable:** `GOOGLE_GENAI_API_KEY`

### Endpoints Used

#### A. Generate Bill Explainer
**Endpoint:** `/models/gemini-2.0-flash-exp:generateContent`
**Used In:** `/src/app/api/feed/bills/route.ts`

**Request Structure:**
```typescript
{
  contents: [{
    parts: [{
      text: string; // Prompt with bill details
    }]
  }],
  generationConfig: {
    temperature: 0.7;
    topK: 40;
    topP: 0.95;
    maxOutputTokens: 512;
    responseMimeType: 'application/json';
  }
}
```

**Prompt Input:**
- `billNumber`: Bill identifier
- `shortTitle`: Bill title
- `summary`: Bill summary text
- `subjects`: Subject areas
- `sponsorParty`: Sponsor's party
- `latestAction`: Latest action text
- `status`: Current bill status

**Expected JSON Response:**
```typescript
{
  headline: string;              // 4-6 word question
  explainer: string;             // Single sentence explanation
  supportStatement: string;       // Argument for (max 140 chars)
  opposeStatement: string;        // Argument against (max 140 chars)
  closingQuestion: string;        // Discussion question
}
```

**Caching:**
- Stores in Firestore collection `bill_explainers`
- Cache key: `{congress}-{type}-{number}`
- Reuses if less than 7 days old

---

#### B. Generate Advocacy Message
**Endpoint:** `/models/gemini-2.0-flash-exp:generateContent`
**Used In:** `/src/app/api/ai/generate-advocacy-message/route.ts`

**Request Structure:**
```typescript
{
  contents: [{
    parts: [{
      text: string; // Prompt with bill/stance details
    }]
  }],
  generationConfig: {
    temperature: 0.7;
    topK: 40;
    topP: 0.95;
    maxOutputTokens: 1024;
  }
}
```

**Prompt Input:**
- `billTitle`: Bill being advocated about
- `billSummary`: Bill summary
- `userStance`: Support/Oppose/Neutral
- `tone`: Professional/Casual/Passionate
- `personalData`: Optional user info

**Expected Response:**
- Plain text message (3-4 paragraphs)
- No salutation or signature
- Clear call to action

---

#### C. Generate News Summary
**Endpoint:** `/models/gemini-2.0-flash-exp:generateContent`
**Used In:** `/src/app/api/ai/generate-news-summary/route.ts`

**Request Structure:**
```typescript
{
  contents: [{
    parts: [{
      text: string; // Prompt with news details
    }]
  }],
  generationConfig: {
    temperature: 0.3; // Lower for factual summaries
    topK: 40;
    topP: 0.95;
    maxOutputTokens: 200;
  }
}
```

**Prompt Input:**
- `newsTitle`: Article headline
- `newsUrl`: Article URL
- `newsContent`: Article content (optional)

**Expected Response:**
- 2-3 sentences maximum
- Neutral, factual tone
- Plain text format

### Response Parsing
```typescript
{
  candidates: [
    {
      content: {
        parts: [
          {
            text: string; // Generated content
          }
        ];
      };
    }
  ];
}
```

**Field Used:** `candidates[0].content.parts[0].text`

### Error Handling
- 5-10 second timeout on requests
- Falls back to templated/generic responses if AI fails
- Graceful degradation maintained

---

## 8. GOOGLE NEWS RSS FEED

### Overview
**Base URL:** `https://news.google.com/rss/search`
**Parser:** `rss-parser` npm library
**Used In:** `/src/app/api/congress/member/[bioguideId]/news/route.ts`

### Request
**URL Construction:**
```
https://news.google.com/rss/search?q="{encodedMemberName}"&hl=en-US&gl=US&ceid=US:en
```

**Query Parameters:**
- `q`: Member name (URL encoded)
- `hl`: Language (en-US)
- `gl`: Region (US)
- `ceid`: Timezone/locale (US:en)

### Response Structure (RSS XML)
```typescript
{
  items: [
    {
      title: string;
      link: string;
      pubDate: string;
      content: string; // HTML content
      source?: {
        $: { url: string };
        _: string; // Source name
      };
    }
  ]
}
```

### Fields Extracted & Transformed
- `title`: Article headline
- `link`: Article URL
- `pubDate`: Publication date
- `content`: HTML content (parsed for images)
- `source._`: News source name
- `imageUrl`: Extracted from `<img src="">` tags in HTML

### Transformation
```typescript
{
  title: string;
  link: string;
  pubDate: string;
  source?: { url: string; _: string };
  content?: string;
  imageUrl?: string | null;
}
```

### Limitations
- Limits to 10 most recent articles
- Image extraction regex: `/<img[^>]+src="([^">]+)"/`

---

## 9. WORLDNEWS API

### Status: NOT IMPLEMENTED
**Note:** WorldNews API mentioned in requirements but not found in codebase implementation.
- No environment variable configured
- No API endpoints found
- No service integration file

**Recommendation:** If needed, would require:
- API key: `WORLDNEWS_API_KEY` environment variable
- Base URL: Likely `https://api.worldnewsapi.com` or similar
- Service file for API wrapper
- Route handler for endpoint

---

## Summary Table

| API | Type | Auth | Used For | Status |
|-----|------|------|----------|--------|
| Congress.gov | REST | Query Key | Members, Bills, Votes, News | Implemented |
| LegiScan | REST | Query Key | State Bills | Connector Ready |
| BallotReady | GraphQL | Bearer Token | Elected Officials | Implemented |
| OpenFEC | REST | Query Key | Campaign Finance | Implemented |
| Geocodio | REST | Query Key | ZIP to Representatives | Implemented |
| L2 Political | REST | Query Auth | Voter Verification | Implemented |
| Google Gemini | REST | Query Key | AI Content Generation | Implemented |
| Google News | RSS | None | News Feed | Implemented |
| WorldNews | REST | - | News | Not Implemented |

---

## Data Flow Diagrams

### Bill Feed Generation
```
Congress API (list bills)
    ↓
Congress API (bill details)
    ↓
Congress API (bill summaries)
    ↓
Congress API (sponsors/cosponsors)
    ↓
Congress API (member images)
    ↓
Google Gemini (explainer generation)
    ↓
Firestore (cache storage)
    ↓
Frontend Display
```

### Member Lookup by ZIP
```
ZIP Code Input
    ↓
[Geocodio OR Local ZIP Mapping]
    ↓
Congress API (state members)
    ↓
Filter by District/Chamber
    ↓
Congress API (member details)
    ↓
Frontend Display
```

### Advocacy Message Generation
```
Bill Details + User Input
    ↓
Google Gemini (message generation)
    ↓
Response Parsing
    ↓
Frontend Display
```

---

## Environment Variables Required

```env
# Congress API
CONGRESS_API_KEY=

# LegiScan
LEGISCAN_API_KEY=
LEGISCAN_BASE_URL=https://api.legiscan.com
LEGISCAN_TIMEOUT=10000

# BallotReady/CivicEngine
BALLOT_READY_API_KEY=

# OpenFEC
FEC_API_KEY=

# Geocodio
GEOCODIO_API_KEY=

# L2 Political
L2_API_CUSTOMER_ID=
L2_API_KEY=
L2_API_DEMO_STATE=Delaware
L2_API_ENDPOINT=https://api.l2datamapping.com/voter

# Google AI
GOOGLE_GENAI_API_KEY=
```

---

## Key Observations

1. **Caching Strategy:**
   - Congress bills cached in Firestore with 5-minute freshness
   - Member images cached for 24 hours
   - AI-generated explainers cached for 7 days

2. **Error Handling:**
   - Graceful fallbacks for failed AI generation
   - Mock data available for LegiScan
   - Timeout controls on all external requests (3-30 seconds)

3. **Data Normalization:**
   - APIs return varying field name formats
   - Application maps to consistent internal types
   - Field name aliasing for L2 API (underscore vs camelCase)

4. **Performance Optimizations:**
   - Batch processing of bills (15 bills per batch)
   - Parallel requests with `Promise.all()`
   - Rate limiting via deliberate delays between requests
   - HTTP caching headers (s-maxage, stale-while-revalidate)

5. **Security:**
   - API keys in environment variables only
   - No hardcoded credentials
   - Bearer token authentication for GraphQL APIs

