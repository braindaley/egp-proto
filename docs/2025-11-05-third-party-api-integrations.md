# Third-Party API Integrations

**Date:** November 5, 2025
**Document Purpose:** API field mapping reference for building the new EGP site from the prototype

---

## Overview

This document catalogs all external API services integrated into the EGP platform, grouped by provider. Each section details:
- The endpoints called
- What the data is used for
- **Key API fields returned and used in the application** (for design mapping)
- Configuration requirements

---

## 1. Congress API (api.congress.gov)

**Provider:** U.S. Congress / Library of Congress
**Primary Purpose:** Federal legislative data including bills, members, and voting records

### Endpoints Used

- **`/v3/member/{bioguideId}`** - Fetch individual member details
- **`/v3/member/congress/{congress}/{state}`** - Get members by state for a specific congress
- **`/v3/bill/{congress}`** - Get bills with filtering options
- **`/v3/bill/{congress}/{type}/{number}`** - Get specific bill details
- **`/v3/bill/{congress}/{type}/{number}/subjects`** - Get bill subjects/categories
- **`/v3/vote/{congress}`** - Get chamber votes
- **`/v3/{chamber}-vote/{congress}`** - Get house/senate votes
- **`/v3/{chamber}-vote/{congress}/{session}/{rollCallNumber}/members`** - Get member votes on specific roll calls

### What It's Used For

- Finding congressional representatives by ZIP code and state
- Retrieving comprehensive bill information (title, status, sponsors, cosponsors)
- Getting legislative subjects and policy areas for bills
- Tracking member voting records on specific bills
- Fetching member biographical and contact information
- House and Senate voting records

### Key API Fields Used

**Member Data:**
- `bioguideId` - Unique member identifier
- `firstName`, `lastName`, `directOrderName` - Name variations
- `partyName` - Political party
- `state`, `district` - Location/constituency
- `chamber` - House or Senate
- `depiction.imageUrl` - Member photo
- `officialWebsiteUrl` - Member's website
- `terms[]` - Service history
- `sponsoredLegislation.count` - Bills sponsored
- `cosponsoredLegislation.count` - Bills co-sponsored
- `addressInformation` - Contact details (office, phone, zip)

**Bill Data:**
- `congress`, `type`, `number` - Bill identification
- `title`, `shortTitle` - Bill names
- `introducedDate`, `updateDate` - Dates
- `latestAction.text` - Current status
- `sponsors[]` - Primary sponsors
- `cosponsors.count` - Co-sponsor count
- `subjects.policyArea.name` - Primary category
- `subjects.legislativeSubjects[]` - Tags
- `summaries.items[]` - Bill summaries
- `committees[]` - Assigned committees

**Vote Data:**
- `chamber` - House or Senate
- `rollCallNumber` - Vote identifier
- `question` - What was voted on
- `result` - Passed/Failed
- `date` - Vote date
- `members[].position` - Individual vote (Yea/Nay)

### Configuration

**API Key Variable:** `CONGRESS_API_KEY`

---

## 2. LegiScan API (api.legiscan.com)

**Provider:** LegiScan
**Primary Purpose:** State-level legislative data across all 50 states

### Endpoints Used

- **`/?op=getSessionList`** - Get legislative sessions by state
- **`/?op=getMasterList`** - Get all bills in a session
- **`/?op=getBill`** - Get detailed bill information
- **`/?op=getSearch`** - Search bills across states
- **`/?op=getBillText`** - Get bill text documents
- **`/?op=getAmendment`** - Get amendment details
- **`/?op=getRollCall`** - Get roll call vote details
- **`/?op=getPerson`** - Get legislator details
- **`/?op=getSponsoredList`** - Get bill sponsors
- **`/?op=getMonitorList`** - Get recently updated bills
- **`/?op=getSessionPeople`** - Get all legislators in a session
- **`/?op=getDataset`** - Get bulk dataset for a session

### What It's Used For

- Accessing state-level legislative data (complements federal Congress API)
- Retrieving state bills and their current status
- Getting state legislator information and contact details
- Tracking state bill amendments and votes
- Monitoring state legislative activity

### Key API Fields Used

**State Bill Data:**
- `bill_id` - LegiScan bill identifier
- `state` - State abbreviation
- `bill_number` - State bill number
- `title` - Bill title
- `description` - Bill description
- `status` - Current status
- `status_date` - Status update date
- `url` - LegiScan URL for bill
- `state_link` - Link to state legislature site
- `change_hash` - Version tracking
- `created`, `updated` - Timestamps

**State Legislator Data:**
- `people_id` - LegiScan person identifier
- `person_hash` - Version hash
- `state_id` - State code
- `party_id`, `party` - Party affiliation
- `role_id`, `role` - Position/role
- `name` - Legislator name
- `first_name`, `last_name` - Name components
- `middle_name`, `suffix` - Additional name fields
- `nickname` - Preferred name
- `district` - District number
- `ftm_eid` - FollowTheMoney ID
- `votesmart_id` - VoteSmart ID
- `opensecrets_id` - OpenSecrets ID
- `ballotpedia` - Ballotpedia identifier
- `committee_sponsor`, `committee_id` - Committee info

**Session Data:**
- `session_id` - Session identifier
- `year_start`, `year_end` - Session years
- `session_name` - Display name
- `special` - Special session flag

### Configuration

**API Key Variables:**
- `LEGISCAN_API_KEY`
- `LEGISCAN_BASE_URL`
- `LEGISCAN_TIMEOUT`

---

## 3. BallotReady API (bpi.civicengine.com)

**Provider:** CivicEngine / BallotReady
**Primary Purpose:** Elected officials lookup across all levels of government

### Endpoints Used

- **`/graphql`** - GraphQL endpoint for querying office holders and issues

### GraphQL Queries

- **`GetOfficeHolders`** - Query elected officials by location (address, coordinates, or ZIP code)
- **`GetIssues`** - Query available issue/category types

### What It's Used For

- Finding elected officials at federal, state, county, and local levels
- Retrieving official contact information (email, phone, fax)
- Getting official addresses and office details
- Accessing political party affiliations
- Years in office information

### Key API Fields Used

**Elected Official Data:**
- `id` - Unique official identifier
- `name` - Full name
- `firstName`, `lastName` - Name components
- `party` - Political party
- `photoUrl` - Official photo
- `office.name` - Office title (e.g., "U.S. Senator")
- `office.level` - Government level (federal, state, county, local)
- `office.district` - District information
- `contactInfo.email` - Email address
- `contactInfo.phone` - Phone number
- `contactInfo.fax` - Fax number
- `address.line1`, `address.city`, `address.state`, `address.zip` - Mailing address
- `yearsInOffice` - Tenure information
- `urls[]` - Official websites and social media

### Configuration

**API Key Variable:** `BALLOT_READY_API_KEY`

---

## 4. OpenFEC API (api.open.fec.gov)

**Provider:** Federal Election Commission
**Primary Purpose:** Campaign finance data for federal candidates

### Endpoints Used

- **`/v1/candidate/{fecId}`** - Get candidate basic information
- **`/v1/candidate/{fecId}/totals/`** - Get candidate financial totals
- **`/v1/schedules/schedule_a/by_employer/`** - Get contributions by employer
- **`/v1/schedules/schedule_a/by_state/by_candidate/`** - Get contributions by state

### What It's Used For

- Campaign finance information for federal candidates
- Total receipts, disbursements, and cash on hand
- Top individual contributor employers
- State-by-state contribution totals
- Election year information

### Key API Fields Used

**Candidate Basic Info:**
- `candidate_id` - FEC candidate identifier
- `name` - Candidate name
- `party` - Political party
- `office` - Office sought (H, S, P)
- `state` - State
- `district` - Congressional district
- `incumbent_challenge` - Incumbent status
- `election_years[]` - Years of candidacy

**Financial Totals:**
- `receipts` - Total receipts
- `disbursements` - Total disbursements
- `cash_on_hand_end_period` - Current cash balance
- `debts_owed_by_committee` - Outstanding debts
- `coverage_end_date` - Reporting period end
- `cycle` - Election cycle year

**Individual Contributors (by Employer):**
- `employer` - Employer name
- `total` - Total contributions from employer
- `count` - Number of contributions

**State Contributors:**
- `state` - State abbreviation
- `total` - Total from state
- `count` - Number of contributions

### Configuration

**API Key Variable:** `FEC_API_KEY`

---

## 5. Geocodio API (api.geocod.io)

**Provider:** Geocodio
**Primary Purpose:** Geolocation and congressional district lookup

### Endpoints Used

- **`/v1.7/geocode`** - Geocode address/ZIP to congressional district and current legislators

### What It's Used For

- Converting ZIP codes to congressional districts
- Looking up current representatives by location
- Getting legislator contact and biographical information
- Determining current legislators serving a district

### Key API Fields Used

**Geocoding Response:**
- `results[].location.lat` - Latitude
- `results[].location.lng` - Longitude
- `results[].address_components` - Parsed address
- `results[].formatted_address` - Full address string

**Congressional District Fields:**
- `fields.congressional_districts[].name` - District name (e.g., "Congressional District 12")
- `fields.congressional_districts[].district_number` - District number
- `fields.congressional_districts[].congress_number` - Congress session
- `fields.congressional_districts[].congress_years` - Years (e.g., "2023-2025")
- `fields.congressional_districts[].proportion` - Coverage proportion

**Current Legislators:**
- `fields.congressional_districts[].current_legislators[].name` - Legislator name
- `fields.congressional_districts[].current_legislators[].type` - rep or sen
- `fields.congressional_districts[].current_legislators[].bio.party` - Party
- `fields.congressional_districts[].current_legislators[].contact.url` - Website
- `fields.congressional_districts[].current_legislators[].contact.phone` - Phone
- `fields.congressional_districts[].current_legislators[].contact.address` - Office address

### Configuration

**API Key Variable:** `GEOCODIO_API_KEY`

**Note:** Used as primary method for ZIP-to-representative lookup; Congress API used as fallback

---

## 6. L2 Political API (api.l2datamapping.com)

**Provider:** L2 Data
**Primary Purpose:** Voter verification and registration data

### Endpoints Used

- **`/api/v2/records/search/{customerId}/{application}`** - Search voter records with filters
- **`/voter/{voterId}`** - Get detailed voter record by ID

### What It's Used For

- Voter registration verification
- Voter demographic information
- Political affiliation lookup
- Voter history and status

### Key API Fields Used

**Voter Record Fields:**
- `LALVOTERID` - L2 voter identifier
- `Voters_FirstName` - First name
- `Voters_MiddleName` - Middle name
- `Voters_LastName` - Last name
- `Voters_BirthDate` - Date of birth
- `Residence_Addresses_AddressLine` - Street address
- `Residence_Addresses_City` - City
- `Residence_Addresses_State` - State
- `Residence_Addresses_Zip` - ZIP code
- `Residence_Addresses_ZipPlus4` - Extended ZIP
- `Voters_Active` - Active voter status
- `Voters_Age` - Age
- `Parties_Description` - Party affiliation
- `VoterTelephones_LandlinePhoneNumber` - Landline
- `VoterTelephones_CellPhoneNumber` - Cell phone
- `EthnicGroups_EthnicGroup1Desc` - Ethnicity
- `Voters_Gender` - Gender
- `CommercialData_Education` - Education level
- `US_Congressional_District` - Congressional district
- `Voters_FIPS` - FIPS code

### Configuration

**API Key Variables:**
- `L2_API_CUSTOMER_ID`
- `L2_API_KEY`
- `L2_API_DEMO_STATE` (optional, defaults to 'Delaware')
- `L2_API_ENDPOINT` (optional)

---

## 7. Google Generative AI API (generativelanguage.googleapis.com)

**Provider:** Google
**Primary Purpose:** AI-powered content generation

### Endpoints Used

- **`/v1beta/models/gemini-2.0-flash-exp:generateContent`** - Generate text content

### Models Used

- `gemini-2.0-flash-exp`

### What It's Used For

- Generating neutral bill overviews and summaries
- Creating personalized advocacy messages for constituents
- Summarizing news articles for policy context
- Generating bill explainers in accessible language

### Key API Fields Used

**Request Fields:**
- `contents[].parts[].text` - Input prompt text
- `generationConfig.temperature` - Creativity level (0-1)
- `generationConfig.maxOutputTokens` - Response length limit
- `generationConfig.topP` - Nucleus sampling parameter
- `generationConfig.topK` - Top-k sampling parameter

**Response Fields:**
- `candidates[].content.parts[].text` - Generated text content
- `candidates[].finishReason` - Completion reason
- `usageMetadata.promptTokenCount` - Input tokens used
- `usageMetadata.candidatesTokenCount` - Output tokens used
- `usageMetadata.totalTokenCount` - Total tokens

**Generated Content Types:**
- Bill overviews (neutral, factual summaries)
- Advocacy messages (personalized constituent letters)
- News summaries (article digests)
- Bill explainers (plain language descriptions)

### Configuration

**API Key Variable:** `GOOGLE_GENAI_API_KEY`

---

## 8. Congress.gov RSS Feed (www.congress.gov)

**Provider:** U.S. Congress / Library of Congress
**Primary Purpose:** Most viewed/popular bills feed

### Endpoints Used

- **`/rss/most-viewed-bills.xml`** - RSS feed of most viewed bills on Congress.gov

### What It's Used For

- Fetching the most popular and trending bills
- Displaying trending legislation on the platform
- Providing users with visibility into what bills are getting the most attention

### Key API Fields Used

**RSS Feed Fields:**
- `items[].title` - Feed item title
- `items[].link` - Link to Congress.gov page
- `items[].content` - HTML content with bill links
- `lastBuildDate` - Feed last updated

**Parsed Bill Data (from HTML content):**
- Congress number (e.g., "119")
- Bill type slug (e.g., "house-bill", "senate-bill")
- Bill number
- Bill title (cleaned and decoded)

**Output Format:**
- `congress` - Congress session number
- `type` - Bill type (H.R., S., etc.)
- `number` - Bill number
- `title` - Bill title
- `url` - Internal app URL for bill
- `shortTitle` - Formatted display title

### Configuration

**Library Used:** rss-parser (no API key required)

---

## 9. Google News RSS Feed (news.google.com)

**Provider:** Google News
**Primary Purpose:** News aggregation for congressional members

### Endpoints Used

- **`/rss/search`** - Search news articles by query (member name)

### What It's Used For

- Fetching recent news articles about congressional members
- Providing news context to constituents
- Monitoring member-related news coverage

### Key API Fields Used

**RSS Feed Fields:**
- `items[].title` - Article headline
- `items[].link` - URL to full article
- `items[].pubDate` - Publication date/time
- `items[].source` - News source information
- `items[].content` - HTML content (used to extract images)

**Extracted Data:**
- `imageUrl` - Extracted from `<img>` tags in content HTML

### Configuration

**Library Used:** rss-parser (no API key required)

**Note:** Fetches member name from Congress API first, then searches Google News RSS for that member's name

---

## Summary Table

| Service | Primary Use Case | API Key Required | Endpoint Count |
|---------|-----------------|------------------|----------------|
| Congress API | Federal bills & members | `CONGRESS_API_KEY` | 7 |
| LegiScan | State legislation | `LEGISCAN_API_KEY` | 12 |
| BallotReady | Elected officials lookup | `BALLOT_READY_API_KEY` | 1 (GraphQL) |
| OpenFEC | Campaign finance | `FEC_API_KEY` | 4 |
| Geocodio | ZIP to representative | `GEOCODIO_API_KEY` | 1 |
| L2 Political | Voter verification | `L2_API_CUSTOMER_ID`, `L2_API_KEY` | 2 |
| Google Gemini | AI content generation | `GOOGLE_GENAI_API_KEY` | 1 |
| Congress.gov RSS | Popular bills feed | None (RSS) | 1 |
| Google News RSS | Member news articles | None (RSS) | 1 |

---

## Data Flow Architecture

### Legislative Data Flow
1. **Geocodio** or **Congress API** → User enters ZIP → Get congressional district & representatives
2. **Congress API** → Fetch federal bills, member info, voting records
3. **Congress.gov RSS** → Fetch most popular/trending bills
4. **LegiScan API** → Fetch state bills and state legislator information
5. **BallotReady API** → Fetch all elected officials (federal, state, local) by location

### Campaign Finance Flow
1. **OpenFEC API** → Get candidate finance data → Display on member profiles

### Content Generation Flow
1. **Congress API** or **LegiScan API** → Get bill data
2. **Google News RSS** → Get related news articles about members
3. **Google Gemini AI** → Generate summaries, overviews, advocacy messages

### User Data Flow
1. **L2 Political API** → Verify voter registration

---

## Security Considerations

- All API keys are stored in `.env.local` and never committed to version control
- Environment variables are accessed server-side only
- Rate limiting implemented on API routes to prevent abuse
- Sensitive voter data from L2 API is handled with strict privacy controls

---

## Rate Limits & Quotas

Refer to individual provider documentation for current rate limits:
- **Congress API**: Contact api@congress.gov for limits
- **LegiScan**: Varies by subscription tier
- **BallotReady**: Contact CivicEngine for enterprise limits
- **OpenFEC**: 1,000 requests per hour per API key
- **Geocodio**: Varies by plan (check geocod.io)
- **L2 Political**: Contact L2 Data for limits
- **Google Gemini**: 15 requests per minute (free tier)

---

## Maintenance Notes

- All APIs require active API keys stored in environment variables
- Regular monitoring of API usage to stay within quotas
- Fallback mechanisms in place for critical services (e.g., Geocodio → Congress API)
- Bill data caching implemented to minimize redundant API calls

---

**Document Version:** 1.0
**Last Updated:** November 5, 2025
**Maintained By:** EGP Development Team
