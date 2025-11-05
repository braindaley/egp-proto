# API Integration Quick Reference

## APIs Implemented (8 of 9)

### 1. Congress API - REST
- **URL**: https://api.congress.gov/v3
- **Key**: `CONGRESS_API_KEY`
- **Uses**: Members, bills, sponsors, votes, images
- **Main endpoints**: 
  - `/member/congress/{congress}/{state}` - Get state members
  - `/member/{bioguideId}` - Get member details
  - `/bill/{congress}/{type}/{number}` - Get bill details
  - `/bill/{congress}` - List bills

### 2. LegiScan API - REST
- **URL**: https://api.legiscan.com
- **Key**: `LEGISCAN_API_KEY`
- **Uses**: State-level legislative data
- **Operations**: Sessions, bills, amendments, votes, people
- **Status**: Connector ready, mock implementation available

### 3. BallotReady (CivicEngine) - GraphQL
- **URL**: https://bpi.civicengine.com/graphql
- **Key**: `BALLOT_READY_API_KEY` (Bearer token)
- **Uses**: Elected officials by location
- **Query**: GetOfficeHolders (location/ZIP → federal/state/county/local officials)

### 4. OpenFEC API - REST
- **URL**: https://api.open.fec.gov/v1
- **Key**: `FEC_API_KEY`
- **Uses**: Campaign finance data
- **Endpoints**:
  - `/candidate/{id}` - Candidate details
  - `/candidate/{id}/totals` - Financial summary
  - `/schedules/schedule_a/by_state/by_candidate` - State contributors
  - `/schedules/schedule_a/by_employer` - Top contributors by employer

### 5. Geocodio API - REST
- **URL**: https://api.geocod.io/v1.7
- **Key**: `GEOCODIO_API_KEY`
- **Uses**: ZIP code → congressional district → representatives
- **Fallback**: Local ZIP mapping + Congress API

### 6. L2 Political API - REST
- **URL**: https://api.l2datamapping.com
- **Auth**: Customer ID + API Key (query params)
- **Keys**: `L2_API_CUSTOMER_ID`, `L2_API_KEY`, `L2_API_DEMO_STATE`
- **Uses**: Voter verification/lookup
- **Endpoint**: `/api/v2/records/search/{customerId}/{application}`

### 7. Google Gemini AI - REST
- **URL**: https://generativelanguage.googleapis.com/v1beta
- **Key**: `GOOGLE_GENAI_API_KEY`
- **Model**: `gemini-2.0-flash-exp`
- **Uses**: 
  - Bill explainers (JSON: headline, explainer, support/oppose, closing question)
  - Advocacy message generation
  - News summary generation
- **Caching**: Firestore (bill explainers: 7 days)

### 8. Google News RSS - No Auth
- **URL**: https://news.google.com/rss/search
- **Parser**: rss-parser npm library
- **Uses**: Member news feed by name
- **Extraction**: Title, link, date, source, image (from HTML)

### 9. WorldNews API - NOT IMPLEMENTED
- **Status**: Mentioned in requirements but no implementation found
- **Recommendation**: Add when needed

---

## Key Data Fields by API

### Congress API - Main Fields
```
Members: bioguideId, name, partyName, state, chamber, district, imageUrl
Bills: title, congress/type/number, status, sponsors, cosponsors, subjects, summary
Extended IDs: opensecrets, govtrack, fec[], thomas, wikipedia, ballotpedia
```

### BallotReady - Main Fields
```
OfficeHolders: fullName, position (name/level), isCurrent, isAppointed, yearsInOffice
Contacts: email, phone, fax, url (website/social)
Addresses: addressLine1-2, city, state, zip, type
Parties: name, shortName
```

### OpenFEC - Main Fields
```
Candidate: name, party_full, office_full, state, district, election_years
Totals: receipts, disbursements, cash_on_hand, debts, contributions (itemized/unitemized/PAC)
Contributors: state, employer, total
```

### L2 Political - Main Fields
```
Voter: voterId, firstName, lastName, fullName, address, city, state, zipCode
Additional: birthYear, gender, politicalAffiliation, registrationDate, voterStatus
```

### Geocodio - Main Fields
```
Legislators: firstName, lastName, party, phone, url, bioguideId, type (senator/representative)
District: district_number
```

---

## Caching Strategy

| Resource | Location | TTL |
|----------|----------|-----|
| Congress bills feed | Firestore | 5 minutes |
| Bill explainers | Firestore | 7 days |
| Member images | HTTP cache | 24 hours |
| Member details | HTTP cache | 1 hour |
| Votes | HTTP cache | 1 hour |

---

## Error Handling Patterns

### Congress API
- Uses HTTP timeout (3-30 seconds per call)
- Batch processing (15 bills at a time)
- Falls back to cached data if timeout

### BallotReady
- Returns success/error object
- Error includes message
- Empty array on no results

### L2 Political
- Handles multiple FEC ID formats
- Tries cycles 2024, 2022, 2020
- Filters invalid employers
- Limits results (10 contributors, 50 per request)

### Geocodio
- Primary: Geocodio API
- Fallback: Local ZIP mapping
- Final fallback: Congress API by state

### Google AI
- 5-10 second timeout
- Validates JSON response
- Falls back to template responses

---

## Field Mapping Examples

### Congress API → Application
```typescript
Congress API: member.terms[].chamber === "Senate"
↓
Application: Separate into senators[] array

Congress API: bill.latestAction.text
↓
Application: Parse status (Became Law, Passed Senate, In Committee, etc.)

Congress API: bill.subjects.policyArea.name
↓
Application: Map to standardized subjects via mapApiSubjectToAllowed()

Congress API: bill.summaries.items[0].text (HTML)
↓
Application: Convert to plaintext via html-to-text library
```

### Geocodio → Application
```typescript
Geocodio: results[0].fields.congressional_districts[0].current_legislators
↓
Application: AppRepresentative[] array

Geocodio: legislator.type === 'representative'
↓
Application: officeTitle = "United States House of Representatives, District X"

Geocodio: legislator.type === 'senator'
↓
Application: officeTitle = "United States Senate"
```

### L2 Political → Application
```typescript
L2 API: LALVOTERID or VoterID
↓
Application: voterId

L2 API: Voters_FirstName + Voters_LastName + Voters_MiddleName
↓
Application: fullName (trimmed, constructed)

L2 API: Residence_Addresses_Zip or Residence_Addresses_Zip5
↓
Application: zipCode
```

---

## Environment Variables Checklist

```bash
# Required for core functionality
CONGRESS_API_KEY=
GOOGLE_GENAI_API_KEY=

# Optional but recommended
BALLOT_READY_API_KEY=
FEC_API_KEY=
GEOCODIO_API_KEY=

# For voter verification features
L2_API_CUSTOMER_ID=
L2_API_KEY=
L2_API_DEMO_STATE=Delaware
L2_API_ENDPOINT=https://api.l2datamapping.com/voter

# For state bills (development ready)
LEGISCAN_API_KEY=
```

---

## Common API Response Handling

### Success Pattern
```typescript
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return { success: true, data };
} catch (error) {
  console.error('Error:', error);
  return { success: false, error: error.message };
}
```

### Pagination/Batching
```typescript
// Congress API uses limit parameter
// Batch 15 items per request with 200ms delay between batches
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  await Promise.all(batch.map(processBatch));
  if (i + batchSize < items.length) {
    await delay(200); // Rate limiting
  }
}
```

### Timeout Control
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);
try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  // Process response
} catch (error) {
  if (error.name === 'AbortError') {
    console.warn('Request timeout');
  }
}
```

---

## Integration Points in Codebase

### API Routes
- `/src/app/api/congress/` - Congress API endpoints
- `/src/app/api/fec/` - FEC API endpoints
- `/src/app/api/l2/` - L2 API endpoints
- `/src/app/api/elected-officials/` - BallotReady endpoint
- `/src/app/api/feed/bills/` - Bill feed (Congress + Gemini)
- `/src/app/api/ai/` - AI endpoints (Gemini)
- `/src/app/api/congress/members/by-zip/` - Geocodio endpoint

### Service Files
- `/src/lib/legiscan-connector.ts` - LegiScan connector class
- `/src/lib/ballotready-api.ts` - BallotReady GraphQL functions
- `/src/lib/l2-api.ts` - L2 Political functions

### Type Definitions
- `/src/types/index.ts` - All response/data structures

### Mock Data
- `/src/lib/mock-legiscan-data.ts` - LegiScan mock responses
- `/src/app/api/legiscan/route.ts` - Mock LegiScan endpoint

---

## Testing Endpoints

### Congress Members by ZIP
```bash
GET /api/congress/members/by-zip?zip=92706
```

### Member Details
```bash
GET /api/congress/member/{bioguideId}
```

### Member News
```bash
GET /api/congress/member/{bioguideId}/news
```

### Bill Feed
```bash
GET /api/feed/bills
```

### FEC Candidate
```bash
GET /api/fec/candidate/{fecId}
GET /api/fec/candidate/{fecId}/totals
GET /api/fec/candidate/{fecId}/state-contributors
GET /api/fec/candidate/{fecId}/individual-contributors
```

### Elected Officials
```bash
GET /api/elected-officials?zip=92706
GET /api/elected-officials?address=Main+St,+Santa+Ana,+CA
GET /api/elected-officials?lat=33.7&lng=-117.8
```

### Voter Verification
```bash
POST /api/l2/verify-voter
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "address": "123 Main St",
  "city": "Anytown",
  "state": "CA",
  "zipCode": "12345"
}
```

### Generate Advocacy Message
```bash
POST /api/ai/generate-advocacy-message
Content-Type: application/json

{
  "billTitle": "H.R. 1234",
  "billSummary": "...",
  "userStance": "support",
  "tone": "professional"
}
```

### Generate News Summary
```bash
POST /api/ai/generate-news-summary
Content-Type: application/json

{
  "newsTitle": "Congress Passes New Bill",
  "newsUrl": "https://...",
  "newsContent": "..."
}
```

---

## Dependencies Used

- `rss-parser` - RSS feed parsing
- `html-to-text` - HTML to plain text conversion
- `firebase/firestore` - Data caching
- `zod` - Type validation (likely)

---

## Notes for Maintenance

1. **Congress API** - Most heavily used, good error handling
2. **Gemini AI** - Has graceful fallbacks and caching
3. **BallotReady** - GraphQL, relatively simple query
4. **Geocodio** - Good fallback chain
5. **L2 Political** - Limited to demo state in test environment
6. **OpenFEC** - Tries multiple cycles to find data
7. **LegiScan** - Connector ready but using mock data for production
8. **Google News** - Simple RSS parsing, minimal dependencies

