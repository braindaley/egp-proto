# API Documentation

This document provides comprehensive API specifications for the backend team to implement the advocacy platform with PostgreSQL database.

**Version:** 1.1
**Last Updated:** 2025-10-13

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication &amp; Authorization](#authentication--authorization)
3. [External API Integrations](#external-api-integrations)
4. [Backend API Endpoints](#backend-api-endpoints)
5. [Stripe Integration](#stripe-integration)
6. [Caching Strategy](#caching-strategy)
7. [Rate Limiting](#rate-limiting)
8. [Error Handling](#error-handling)
9. [Webhooks](#webhooks)

---

## Overview

### Architecture

- **Frontend:** Next.js 15 (React, TypeScript, Tailwind CSS)
- **Backend:** RESTful API (Node.js/Express recommended, or your choice)
- **Database:** PostgreSQL 14+ (AWS RDS)
- **Cache:** Redis 6+ (AWS ElastiCache)
- **Authentication:** Auth0 (OAuth2/OpenID Connect)
- **Payment Processing:** Stripe
- **Email Service:** AWS SES
- **File Storage:** AWS S3
- **Hosting:** AWS (EC2, ECS, or Lambda)
- **CDN:** AWS CloudFront

### Launch Scope Notes

- Transactional emails only at launch (account verification, message confirmations); notification digests and marketing flows defer to post-launch.
- AI-assisted drafting and summaries ship in Sprint 2; until then, endpoints should return `501` to indicate not yet available.
- All external data sources route through backend services—no direct frontend calls.

### Base URL

- Development: `http://localhost:3000/api`
- Production: `https://api.yourdomain.com`

### Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalItems": 100
  },
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": { "field": "email" }
  }
}
```

---

## Authentication & Authorization

### Auth0 Integration

**Authentication Flow:**

1. Frontend redirects to Auth0 Universal Login
2. User authenticates (email/password, Google, social)
3. Auth0 redirects back with authorization code
4. Backend exchanges code for Auth0 JWT access token
5. Backend validates token and creates/updates user in database
6. Backend issues session or passes Auth0 token to frontend

**Auth0 Configuration:**

- **Domain:** `your-tenant.auth0.com`
- **Client ID:** From Auth0 Application
- **Client Secret:** From Auth0 Application
- **Audience:** Your API identifier
- **Scopes:** `openid profile email`
- **Connections:** Username-Password, Google, Social

### Auth0 JWT Token Structure

```json
{
  "sub": "auth0|507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "picture": "https://...",
  "iss": "https://your-tenant.auth0.com/",
  "aud": "your-api-identifier",
  "iat": 1234567890,
  "exp": 1234653890,
  "scope": "openid profile email",
  "azp": "your-client-id"
}
```

**Custom Claims (added via Auth0 Rules/Actions):**

```json
{
  "https://yourapp.com/role": "user|organization|admin",
  "https://yourapp.com/membership_tier": "free|premium",
  "https://yourapp.com/user_id": "uuid-from-your-db"
}
```

### Authentication Endpoints

#### GET /auth/callback

Auth0 callback endpoint (handled by Auth0 SDK).

**Query Parameters:**

- `code`: Authorization code from Auth0
- `state`: CSRF protection state

**Response:**
Redirect to frontend with session cookie or token.

**Business Logic:**

- Exchange authorization code for tokens via Auth0
- Validate Auth0 JWT token
- Look up user by Auth0 `sub` in database
- If new user (signup): Create user record in `users` table
- If returning user (login): Update `last_login_at`, log in `login_history`
- Add custom claims (role, membership) to user object
- Create session or return token to frontend

---

#### POST /auth/link-anonymous-session

Link anonymous message to newly created account.

**Request:**

```json
{
  "sessionToken": "anonymous-session-uuid"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "messagesLinked": 1,
    "message": "Your previous message has been linked to your account"
  }
}
```

**Business Logic:**

- Verify user is authenticated (Auth0 token)
- Look up messages with `session_token` = sessionToken
- Update `user_messages.user_id` = current user ID
- Delete session token

---

### Authorization Middleware

All protected endpoints require:

```
Authorization: Bearer {auth0_jwt_token}
```

**Backend Validation:**

1. Validate JWT signature using Auth0 public key (JWKS)
2. Verify `iss` (issuer) matches Auth0 domain
3. Verify `aud` (audience) matches API identifier
4. Verify token not expired (`exp`)
5. Extract `sub` (Auth0 user ID) and look up user in database
6. Check user role from custom claims or database

**Role-Based Access:**

- `user` role: Access to regular user endpoints
- `organization` role: Access to `/partners/*` endpoints
- `admin` role: Access to `/admin/*` endpoints

**Auth0 SDK Libraries:**

- Node.js: `express-oauth2-jwt-bearer`
- Python: `python-jose`, `authlib`
- Example middleware:

```javascript
const { auth } = require('express-oauth2-jwt-bearer');

const checkJwt = auth({
  audience: 'your-api-identifier',
  issuerBaseURL: 'https://your-tenant.auth0.com/',
});

app.use('/api', checkJwt);
```

---

## External API Integrations

### Integration Roadmap (Launch Plan)

The sprint schedule (see `docs/sprint-schedule-detailed.md`) defines when each external service comes online. Backend work should follow this order so frontend features unblock on schedule.

| Sprint   | Services                                                    | Purpose                                                         |
| -------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| Sprint 0 | Auth0, PostgreSQL (AWS RDS), Congress.gov API, Geocodio API | Core auth, persistence, and federal data ingestion              |
| Sprint 1 | FEC API                                                     | Campaign finance data for member and bill views                 |
| Sprint 2 | LegiScan API, AWS Bedrock Agent                             | Texas state legislation feed and AI-assisted drafting/summaries |
| Sprint 3 | Stripe API                                                  | Premium membership purchase and management                      |
| Sprint 4 | L2 Political API, AWS S3                                    | Voter verification flows and asset uploads for org campaigns    |
| Sprint 6 | AWS SES                                                     | Production-ready transactional email delivery                   |

### Policy Area Mapping System

The platform uses a mapping system to translate external API policy classifications into our standardized 20 policy categories. This ensures consistent categorization across Congress.gov, LegiScan, and user preferences.

**Site Policy Categories (20 total):**

1. Abortion
2. Climate, Energy & Environment
3. Criminal Justice
4. Death Penalty
5. Defense & National Security
6. Discrimination & Prejudice
7. Drug Policy
8. Economy & Work
9. Education
10. Free Speech & Press
11. Gun Policy
12. Health Policy
13. Immigration & Migration
14. International Affairs
15. LGBT Acceptance
16. National Conditions
17. Privacy Rights
18. Religion & Government
19. Social Security & Medicare
20. Technology Policy Issues

**Implementation:** `/src/lib/policy-area-mapping.ts`

#### Congress.gov Policy Area Mapping

Congress.gov uses ~50 broad policy areas. We map these to our 20 categories.

**Complete Mapping Table:**

```javascript
{
  // Climate, Energy & Environment
  'Animals': 'Climate, Energy & Environment',
  'Energy': 'Climate, Energy & Environment',
  'Environmental Protection': 'Climate, Energy & Environment',
  'Public Lands and Natural Resources': 'Climate, Energy & Environment',
  'Water Resources Development': 'Climate, Energy & Environment',

  // Criminal Justice
  'Crime and Law Enforcement': 'Criminal Justice',
  'Law': 'Criminal Justice',

  // Defense & National Security
  'Armed Forces and National Security': 'Defense & National Security',

  // Discrimination & Prejudice
  'Civil Rights and Liberties, Minority Issues': 'Discrimination & Prejudice',
  'Native Americans': 'Discrimination & Prejudice',

  // Economy & Work
  'Agriculture and Food': 'Economy & Work',
  'Commerce': 'Economy & Work',
  'Economics and Public Finance': 'Economy & Work',
  'Families': 'Economy & Work',
  'Finance and Financial Sector': 'Economy & Work',
  'Housing and Community Development': 'Economy & Work',
  'Labor and Employment': 'Economy & Work',
  'Social Welfare': 'Economy & Work',
  'Taxation': 'Economy & Work',
  'Transportation and Public Works': 'Economy & Work',

  // Education
  'Education': 'Education',

  // Health Policy
  'Health': 'Health Policy',

  // Immigration & Migration
  'Immigration': 'Immigration & Migration',

  // International Affairs
  'Foreign Trade and International Finance': 'International Affairs',
  'International Affairs': 'International Affairs',

  // National Conditions
  'Congress': 'National Conditions',
  'Emergency Management': 'National Conditions',
  'Government Operations and Politics': 'National Conditions',
  'Sports and Recreation': 'National Conditions',

  // Religion & Government
  'Arts, Culture, Religion': 'Religion & Government',

  // Social Security & Medicare
  'Social Security': 'Social Security & Medicare',

  // Technology Policy Issues
  'Science, Technology, Communications': 'Technology Policy Issues'
}
```

**Note:** Some policy areas not listed above (like ~20 more Congress.gov categories) may default to 'National Conditions' or require manual categorization.

**Usage:**

```javascript
import { mapPolicyAreaToSiteCategory } from '@/lib/policy-area-mapping';

// Map Congress.gov policy area to site category
const category = mapPolicyAreaToSiteCategory('Environmental Protection');
// Returns: 'Climate, Energy & Environment'
```

**Special Cases:**
Some categories require content analysis as they're subsets of broader Congress.gov categories:

- Abortion (subset of Health)
- Death Penalty (subset of Crime and Law Enforcement)
- Drug Policy (subset of Health and Crime)
- Gun Policy (subset of Crime and Law Enforcement)
- LGBT Acceptance (subset of Civil Rights)
- Privacy Rights (subset of Civil Rights and Technology)

For these, use bill title/summary analysis or legislative subject tags.

#### LegiScan Subject Mapping

LegiScan uses state-specific subject tags that vary by state. Below is the complete mapping for Texas subjects as an example. Other states use similar subjects but with different agency names.

**Texas (TX) Subject Mapping:**

```javascript
{
  // Climate, Energy & Environment
  'Energy': 'Climate, Energy & Environment',
  'ENERGY/CONSERVATION': 'Climate, Energy & Environment',
  'Energy Matters': 'Climate, Energy & Environment',
  'Environmental Protection': 'Climate, Energy & Environment',
  'Forestry': 'Climate, Energy & Environment',
  'Water Resources': 'Climate, Energy & Environment',
  'Water': 'Climate, Energy & Environment',
  'Wildlife': 'Climate, Energy & Environment',
  'Natural Resources': 'Climate, Energy & Environment',
  'Parks and Recreation': 'Climate, Energy & Environment',
  'Pollution Control': 'Climate, Energy & Environment',
  'Renewable Energy': 'Climate, Energy & Environment',

  // Criminal Justice
  'CRIME/SEX OFFENSES': 'Criminal Justice',
  'CRIMINAL RECORDS': 'Criminal Justice',
  'Crimes': 'Criminal Justice',
  'Crimes and Punishments': 'Criminal Justice',
  'Criminal Law - Substantive Crimes': 'Criminal Justice',
  'Criminal Procedure': 'Criminal Justice',
  'Law Enforcement': 'Criminal Justice',
  'Corrections Impact': 'Criminal Justice',
  'Corrections and Correctional Facilities, State': 'Criminal Justice',
  'Courts': 'Criminal Justice',
  'Jails and Jailers': 'Criminal Justice',
  'Juvenile Offenders': 'Criminal Justice',
  'JUSTICE OF THE PEACE': 'Criminal Justice',
  'Judges': 'Criminal Justice',
  'Concealed Carry': 'Criminal Justice',
  'Company Police': 'Criminal Justice',
  'Detention': 'Criminal Justice',

  // Defense & National Security
  'Military': 'Defense & National Security',
  'Veterans': 'Defense & National Security',
  'National Guard': 'Defense & National Security',
  'Homeland Security': 'Defense & National Security',
  'Emergency Management': 'Defense & National Security',
  'EMERGENCY MANAGEMENT, TEXAS DIVISION OF': 'Defense & National Security',
  'Emergency Services': 'Defense & National Security',
  'Emergency Services and Vehicles': 'Defense & National Security',
  'Disaster': 'Defense & National Security',
  'Disaster Preparedness & Relief': 'Defense & National Security',
  'ALERT SYSTEM': 'Defense & National Security',
  'FLOODS': 'Defense & National Security',

  // Discrimination & Prejudice
  'Civil Rights': 'Discrimination & Prejudice',
  'Civil rights: privacy': 'Discrimination & Prejudice',
  'Human Trafficking': 'Discrimination & Prejudice',
  'Indian Tribes': 'Discrimination & Prejudice',

  // Economy & Work
  'Commerce': 'Economy & Work',
  'Commerce, Economic Development and Agriculture': 'Economy & Work',
  'Commercial Law': 'Economy & Work',
  'COMMERCIAL LAW -- GENERAL REGULATORY PROVISIONS': 'Economy & Work',
  'Consumer Protection': 'Economy & Work',
  'Economic Development': 'Economy & Work',
  'Economics and public finance': 'Economy & Work',
  'Employment': 'Economy & Work',
  'Labor: benefits': 'Economy & Work',
  'Labor: hours and wages': 'Economy & Work',
  'Job Training': 'Economy & Work',
  'Agriculture Animal Care and Food': 'Economy & Work',
  'Housing and Real Property': 'Economy & Work',
  'Housing and Real Property : Real Estate Transactions': 'Economy & Work',
  'Homeowners Associations': 'Economy & Work',
  'Finance': 'Economy & Work',
  'Finance and Appropriations': 'Economy & Work',
  'Fiscal Policy & Taxes': 'Economy & Work',
  'Currency & Coins': 'Economy & Work',
  'Insurance': 'Economy & Work',
  'INSURANCE, TEXAS DEPARTMENT OF': 'Economy & Work',
  'Airports': 'Economy & Work',
  'Transportation': 'Economy & Work',
  'Highways': 'Economy & Work',
  'APPROPRIATIONS': 'Economy & Work',
  'Appropriations': 'Economy & Work',
  'Appropriation Process': 'Economy & Work',
  'Appropriation Extension ($)': 'Economy & Work',
  'CAPITAL OUTLAY': 'Economy & Work',
  'Capital, State': 'Economy & Work',
  'Budgeting': 'Economy & Work',
  'Debt': 'Economy & Work',
  'Gaming: lottery': 'Economy & Work',

  // Education
  'Education': 'Education',
  'Education : Primary and Secondary Education': 'Education',
  'Education Boards': 'Education',
  'Education, Finance': 'Education',
  'Education, Higher': 'Education',
  'Education, State Board Of': 'Education',
  'Education, Vocational': 'Education',
  'Education: financing': 'Education',
  'Elementary Education': 'Education',
  'K-12 Education': 'Education',
  'Kindergarten': 'Education',
  'Higher Education': 'Education',
  'Colleges & Universities': 'Education',
  'Health Education': 'Education',
  'Graduates': 'Education',

  // Health Policy
  'Health': 'Health Policy',
  'HEALTH & HUMAN SERVICES COMMISSION': 'Health Policy',
  'Health And Safety': 'Health Policy',
  'Health Occupations': 'Health Policy',
  'Health and Human Services : Health Care': 'Health Policy',
  'Health and Medical Services': 'Health Policy',
  'Health--Emergency Services & Personnel': 'Health Policy',
  'Behavioral Health': 'Health Policy',
  'Behavioral Health Examiners': 'Health Policy',
  'Behavioral Health Licensure': 'Health Policy',
  'Board Of Behavioral Health Examiners': 'Health Policy',
  'Diseases & Health Disorders': 'Health Policy',
  'Mental Health': 'Health Policy',
  'Public Health': 'Health Policy',
  'Alcohol': 'Health Policy',

  // Immigration & Migration
  'Immigration': 'Immigration & Migration',
  'Citizenship': 'Immigration & Migration',

  // International Affairs
  'International Trade': 'International Affairs',
  'Foreign Relations': 'International Affairs',

  // National Conditions
  'Government Administration': 'National Conditions',
  'Government Employees': 'National Conditions',
  'Government Operations (State Issues)': 'National Conditions',
  'Government operations and politics': 'National Conditions',
  'Governor': 'National Conditions',
  'Governor -- Bills Requested By': 'National Conditions',
  'Legislative Agencies': 'National Conditions',
  'Legislative Committees': 'National Conditions',
  'Legislative Operations': 'National Conditions',
  'Legislators': 'National Conditions',
  'Legislature': 'National Conditions',
  'Federal Government': 'National Conditions',
  'HOUSE OF REPRESENTATIVES, US': 'National Conditions',
  'Constitution, Us': 'National Conditions',
  'ELECTIONS': 'National Conditions',
  'Elections': 'National Conditions',
  'Campaigns': 'National Conditions',
  'Ethics': 'National Conditions',
  'Administrative Code': 'National Conditions',
  'Administrative Rules': 'National Conditions',
  'Bills and Joint Resolutions Signed by the Governor': 'National Conditions',
  'Boards': 'National Conditions',
  'Counties': 'National Conditions',
  'Counties Cities and Towns': 'National Conditions',
  'Counties: other': 'National Conditions',
  'County Board': 'National Conditions',
  'County Commissioners': 'National Conditions',
  'Cities: other': 'National Conditions',
  'City Councils': 'National Conditions',
  'Committees and Commissions': 'National Conditions',
  'Charters': 'National Conditions',

  // Religion & Government
  'Religion': 'Religion & Government',

  // Technology Policy Issues
  'Artificial Intelligence': 'Technology Policy Issues',
  'BROADBAND NETWORKS': 'Technology Policy Issues',
  'Electronic Communication': 'Technology Policy Issues',
  'Electronic Information Systems': 'Technology Policy Issues',
  'INFORMATION TECHNOLOGY SERVICES': 'Technology Policy Issues',
  'Digital Images': 'Technology Policy Issues',
  'Technology': 'Technology Policy Issues',

  // Specific Policy Categories (may appear as direct subjects)
  'Abortion': 'Abortion',
  'Death Penalty': 'Death Penalty',
  'Drug Policy': 'Drug Policy',
  'Drugs': 'Drug Policy',
  'Free Speech': 'Free Speech & Press',
  'Press Freedom': 'Free Speech & Press',
  'Gun Control': 'Gun Policy',
  'Firearms': 'Gun Policy',
  'LGBT': 'LGBT Acceptance',
  'Privacy': 'Privacy Rights',
  'Social Security': 'Social Security & Medicare',
  'Medicare': 'Social Security & Medicare',

  // Family and Social Services
  'Adoption': 'National Conditions',
  'Aging': 'Health Policy',
  'Aging and Human Services': 'Health Policy',
  'Children': 'National Conditions',
  'Children (4-12)': 'National Conditions',
  'Children and Minors': 'National Conditions',
  'Child Abuse and Neglect': 'Criminal Justice',
  'Health and Human Services : Child Care': 'National Conditions',
  'Domestic Relations': 'National Conditions',
  'Families': 'National Conditions'
}
```

**Notes for Other States:**

- Replace Texas-specific agency names (e.g., "TEXAS DEPARTMENT OF") with your state's equivalents
- Generic subjects (e.g., "Education", "Health", "Crime") map the same across all states
- Some states may have unique subjects not listed here - map them to the closest category

**Usage:**

```javascript
import { mapLegiscanSubjectToSiteCategory } from '@/lib/policy-area-mapping';

// Map LegiScan subject to site category
const category = mapLegiscanSubjectToSiteCategory('ENERGY/CONSERVATION');
// Returns: 'Climate, Energy & Environment'
```

#### User Policy Interest Mapping

User policy interests use camelCase keys that map to display categories.

**Complete Mapping Table:**

```javascript
{
  abortion: 'Abortion',
  climateEnergyEnvironment: 'Climate, Energy & Environment',
  criminalJustice: 'Criminal Justice',
  deathPenalty: 'Death Penalty',
  defenseNationalSecurity: 'Defense & National Security',
  discriminationPrejudice: 'Discrimination & Prejudice',
  drugPolicy: 'Drug Policy',
  economyWork: 'Economy & Work',
  education: 'Education',
  freeSpeechPress: 'Free Speech & Press',
  gunPolicy: 'Gun Policy',
  healthPolicy: 'Health Policy',
  immigrationMigration: 'Immigration & Migration',
  internationalAffairs: 'International Affairs',
  lgbtAcceptance: 'LGBT Acceptance',
  nationalConditions: 'National Conditions',
  privacyRights: 'Privacy Rights',
  religionGovernment: 'Religion & Government',
  socialSecurityMedicare: 'Social Security & Medicare',
  technologyPolicyIssues: 'Technology Policy Issues'
}
```

Each user interest stores a value 0-4:

- 0 = Far Left
- 1 = Center Left
- 2 = Center/Moderate (default)
- 3 = Center Right
- 4 = Far Right

**Usage:**

```javascript
import { getUserInterestForCategory } from '@/lib/policy-area-mapping';

// Get user's interest level for a category
const interest = getUserInterestForCategory(
  user.policyInterests,
  'Climate, Energy & Environment'
);
// Returns: 0-4 (political view rating)
```

#### Helper Functions

**Get all policy areas for a category:**

```javascript
import { getPolicyAreasForSiteCategory } from '@/lib/policy-area-mapping';

const congressAreas = getPolicyAreasForSiteCategory('Climate, Energy & Environment');
// Returns: ['Animals', 'Energy', 'Environmental Protection', ...]
```

**Get all LegiScan subjects for a category:**

```javascript
import { getLegiscanSubjectsForSiteCategory } from '@/lib/policy-area-mapping';

const subjects = getLegiscanSubjectsForSiteCategory('Criminal Justice');
// Returns: ['CRIME/SEX OFFENSES', 'Crimes and Punishments', ...]
```

---

### 1. Congress.gov API

**Base URL:** `https://api.congress.gov/v3`
**Authentication:** API Key in header `X-Api-Key`
**Rate Limit:** 5,000 requests/hour

#### Endpoints to Integrate:

**Get Bills**

```
GET /bill/{congress}
Parameters:
  - fromDateTime (ISO 8601)
  - toDateTime (ISO 8601)
  - limit (default 20, max 250)
  - offset (default 0)
```

**Get Bill Detail**

```
GET /bill/{congress}/{billType}/{billNumber}
Returns: Full bill data including sponsors, cosponsors, committees, actions, etc.
```

**Get Member Details**

```
GET /member/{bioguideId}
Returns: Member profile, terms, contact info
```

**Get Member Votes**

```
GET /member/{bioguideId}/votes
Returns: Voting record
```

**Get Committee Details**

```
GET /committee/{chamber}/{systemCode}
Returns: Committee members, subcommittees, jurisdiction
```

**Caching Strategy:**

- Bills: Cache for 1 hour
- Bill details: Cache for 6 hours
- Members: Cache for 24 hours
- Votes: Cache for 12 hours

**Sync Schedule:**

- Sync new bills: Every 6 hours
- Update bill statuses: Every 12 hours
- Full member sync: Weekly (Sunday 2 AM)

---

### 2. LegiScan API

**Base URL:** `https://api.legiscan.com`
**Authentication:** API Key in query parameter `key={api_key}`
**Rate Limit:** 30,000 requests/day

#### Endpoints to Integrate:

**Get State Bill List**

```
GET /?key={key}&op=getDatasetList&state={state}
Returns: List of recent bills for a state
```

**Get Bill Details**

```
GET /?key={key}&op=getBill&id={billId}
Returns: Full state bill details
```

**Get State Legislators**

```
GET /?key={key}&op=getDataset&id={datasetId}&type=person
Returns: State legislators
```

**Caching Strategy:**

- State bills: Cache for 6 hours
- State bill details: Cache for 24 hours
- State legislators: Cache for 7 days

**Sync Schedule:**

- Sync state bills: Daily at 3 AM
- Update bill statuses: Daily at 9 AM

---

### 3. Geocodio API (District Mapping)

**Base URL:** `https://api.geocod.io/v1.7`
**Authentication:** API key via query parameter `api_key={key}`

#### Endpoints to Integrate:

**ZIP or Address → Congressional & State Districts**

```
GET /v1.7/geocode?q={encodedAddressOrZip}&fields=cd,stateleg&api_key={key}
```

**Sample Response (ZIP only):**

```json
{
  "results": [
    {
      "query": "62701",
      "address_components": {
        "zip": "62701",
        "city": "Springfield",
        "state": "IL"
      },
      "fields": {
        "congressional_districts": [
          {
            "name": "IL-13",
            "district_number": 13,
            "ocd_id": "ocd-division/country:us/state:il/cd:13",
            "current_legislators": [
              { "type": "representative", "name": "Nikki Budzinski", "bioguide_id": "B001315" }
            ]
          }
        ],
        "state_legislative_districts": {
          "house": { "name": "District 95", "district_number": 95 },
          "senate": { "name": "District 48", "district_number": 48 }
        }
      }
    }
  ]
}
```

**Caching Strategy:**

- Cache results for 7 days; zip-to-district mappings rarely change.
- Persist the most recent lookup in `geo_district_cache` with `zip`, `lat`, `lng`, `cd`, `state_house`, `state_senate`.

**Usage Notes:**

- Sprint 0 requirement for US-019 (profile setup).
- Fallback: if Geocodio returns multiple results, pick highest confidence or prompt user to refine address.
- Respect Geocodio's rate limits (default 1,000 requests/day); batch common ZIP lookups via nightly job if needed.

---

### 4. AWS Bedrock Agent (AI Messaging & Summaries)

**Service:** AWS Bedrock Converse/Agents
**Region:** `us-east-1` (set via `AWS_BEDROCK_REGION`)

Used for Sprint 2 (US-014) message drafting and AI summaries on bill/news detail pages.

#### Invocation Pattern

```
POST https://bedrock-runtime.{region}.amazonaws.com/agents/{agentId}/invocations
Headers:
  Authorization: AWS SigV4
  Content-Type: application/json

{
  "sessionId": "{uuid}",
  "inputText": "Summarize HR1 for a general audience..."
}
```

**Sample Response:**

```json
{
  "completion": {
    "content": [
      { "text": "Headline: Election Reform and Campaign Finance Bill" },
      { "text": "Explainer: ..." }
    ]
  },
  "sessionId": "bedrock-session-123",
  "stopReason": "end_turn"
}
```

#### Usage Guidelines

- Configure an agent prompt with allowed tools (bill context, news context).
- For message drafting, include user stance, recipient metadata, and bill summary in the prompt.
- Enforce token/word caps (<= 1500 characters output) before returning to client.
- Log prompts/responses for moderation and future tuning (store in `ai_drafts`).

#### Caching & Cost Controls

- Cache bill/news summaries for 24 hours in Redis (`ai:summary:{entityId}`).
- Cache AI-generated talking points for campaigns for 6 hours.
- Limit each user to 5 AI drafts per hour (tie into rate limiting section).
- Fall back to last cached draft if Bedrock is unavailable.

---

### 5. FEC API (Campaign Finance)

**Base URL:** `https://api.open.fec.gov/v1`
**Authentication:** API Key in query parameter `api_key={key}`
**Rate Limit:** 1,000 requests/hour

#### Endpoints to Integrate:

**Get Candidate Financials**

```
GET /candidate/{candidateId}/totals/
Returns: Total receipts, disbursements, cash on hand
```

**Caching Strategy:**

- Cache for 7 days
- Increase sync cadence (daily) during active election cycles

**Sprint Alignment:** Implement in Sprint 1 to unblock campaign finance views on member detail pages and advocacy talking points.

---

### 6. L2 Political API (Voter Verification)

**Base URL:** `https://api.l2political.com`
**Authentication:** API Key in header `X-API-Key: {key}`
**Rate Limit:** Contact L2 for specific limits (typically 10,000+ requests/day)

**L2 VoterMapping API** is used to verify voter registration status and retrieve voter data.

#### Endpoints to Integrate:

**Voter Lookup**

```
POST /api/v2/voter/lookup
Headers:
  X-API-Key: {your_api_key}
  Content-Type: application/json

Request Body:
{
  "FirstName": "John",
  "LastName": "Doe",
  "Address": "123 Main St",
  "City": "Springfield",
  "State": "IL",
  "Zip": "62701",
  "DOB": "1985" // Birth year only for privacy
}

Response:
{
  "success": true,
  "voters": [
    {
      "LALVOTERID": "IL123456789",
      "FirstName": "JOHN",
      "LastName": "DOE",
      "MiddleName": "A",
      "Address": "123 MAIN ST",
      "City": "SPRINGFIELD",
      "State": "IL",
      "Zip": "62701",
      "CongressionalDistrict": "IL-13",
      "StateSenateDistrict": "48",
      "StateHouseDistrict": "95",
      "Parties_Description": "Democratic",
      "Voters_Active": "Y",
      "VoterStatus": "Active",
      "RegistrationDate": "2008-10-15",
      "County": "Sangamon"
    }
  ],
  "matchScore": 95
}
```

**Bulk Voter Lookup** (for batch processing):

```
POST /api/v2/voter/bulk-lookup
```

#### Data Fields Available from L2:

**Identity Fields:**

- LALVOTERID (unique voter ID)
- FirstName, MiddleName, LastName, Suffix
- Age, DOB (full date of birth - handle with privacy)
- Gender

**Address Fields:**

- Residence Address, City, State, Zip
- Mailing Address (if different)
- County, Congressional District
- State House District, State Senate District

**Registration Fields:**

- Parties_Description (current party)
- Voters_Active (Y/N)
- VoterStatus (Active, Inactive, etc.)
- RegistrationDate
- PartyHistory (changes over time)

**Voting History:**

- ElectionDates (dates of elections voted in)
- ElectionTypes (Primary, General, etc.)
- VotingMethod (In-Person, Absentee, Early)

**Contact Fields:**

- Phone (if available)
- Email (if available)

#### Integration Workflow:

1. **User Initiates Verification:**

   - User provides: Name, Address, City, State, ZIP, Birth Year
   - Frontend sends to backend endpoint
2. **Backend Queries L2:**

   - Call L2 VoterMapping API with user data
   - L2 returns matching voter records (fuzzy matching)
   - Match score indicates confidence (0-100)
3. **Present Matches to User:**

   - Show top matches (95+ score)
   - User confirms correct record
4. **Store Verification:**

   - Store LALVOTERID in database
   - Set `voter_registration_verified` = true
   - Store congressional/state districts for representative lookup
5. **Use Verified Data:**

   - Populate congressional districts for representative lookup
   - Display "Verified Voter" badge on messages
   - Pre-fill voter data in advocacy messages

#### Caching Strategy:

- Cache L2 lookups for 30 days per user
- Cache key: `l2:voter:{firstName}:{lastName}:{zip}`
- Invalidate on user address change
- Re-verify every 6 months (voter data can change)

#### Privacy & Compliance:

- **Do NOT store** full voter records from L2
- **Only store:** LALVOTERID, verification status, districts
- Comply with L2's Terms of Service
- Voter data is for verification only, not for marketing
- Allow users to opt-out of verification (manual entry fallback)

#### Error Handling:

- No match found: Offer manual entry option
- Multiple matches: Show all, let user select
- L2 API down: Graceful degradation to manual entry
- Invalid API key: Alert admin, use cached data

#### Cost Considerations:

- L2 typically charges per lookup or monthly subscription
- Implement caching to reduce API calls
- Consider batch lookups for efficiency
- Monitor usage to optimize costs

---

## Backend API Endpoints

### Users

#### POST /api/users/verify-voter

Verify voter registration using L2 Political.

**Headers:**

```
Authorization: Bearer {auth0_token}
```

**Request:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zipCode": "62701",
  "birthYear": 1985
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "l2VoterId": "IL123456789",
        "firstName": "JOHN",
        "lastName": "DOE",
        "address": "123 MAIN ST",
        "city": "SPRINGFIELD",
        "state": "IL",
        "zipCode": "62701",
        "congressionalDistrict": "IL-13",
        "stateSenateDistrict": "48",
        "stateHouseDistrict": "95",
        "partyAffiliation": "Democratic",
        "registrationStatus": "Active",
        "matchScore": 98
      }
    ]
  }
}
```

**Business Logic:**

- Call L2 Political VoterMapping API with user data
- Return top matches (score > 90)
- Cache results for 30 days
- If no matches: Return empty array (user can manually enter)

---

#### POST /api/users/confirm-voter

Confirm voter match and update user profile.

**Request:**

```json
{
  "l2VoterId": "IL123456789",
  "congressionalDistrict": "IL-13",
  "stateSenateDistrict": "48",
  "stateHouseDistrict": "95"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "voterRegistrationVerified": true,
    "voterRegistrationVerifiedAt": "2025-01-20T14:30:00Z"
  }
}
```

**Business Logic:**

- Update `users.voter_registration_verified` = true
- Update `users.voter_registration_verified_at` = NOW()
- Update `users.l2_voter_id` = l2VoterId
- Update `users.congressional_district`, state districts
- Update `users.updated_at`

---

#### GET /api/users/me

Get current user profile.

**Headers:**

```
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701",
    "congressionalDistrict": "IL-13",
    "stateSenateDistrict": "48",
    "stateHouseDistrict": "95",
    "birthYear": 1985,
    "gender": "male",
    "politicalAffiliation": "independent",
    "education": "Bachelor's Degree",
    "profession": "Teacher",
    "militaryService": false,
    "constituentDescription": "I'm a public school teacher...",
    "membershipTier": "premium",
    "membershipStartDate": "2025-01-15T00:00:00Z",
    "voterRegistrationVerified": true,
    "voterRegistrationVerifiedAt": "2025-01-16T10:30:00Z",
    "l2VoterId": "IL123456789",
    "policyInterests": {
      "climateEnergyEnvironment": 3,
      "education": 3,
      "healthPolicy": 2
    },
    "createdAt": "2024-12-01T00:00:00Z",
    "updatedAt": "2025-01-16T10:30:00Z"
  }
}
```

---

#### PATCH /api/users/me

Update current user profile.

**Request:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zipCode": "62701",
  "birthYear": 1985,
  "gender": "male",
  "politicalAffiliation": "independent",
  "education": "Bachelor's Degree",
  "profession": "Teacher",
  "militaryService": false,
  "constituentDescription": "I'm a public school teacher...",
  "policyInterests": {
    "climateEnergyEnvironment": 3,
    "education": 3
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

**Business Logic:**

- Validate ZIP code (5 digits)
- Request district data from Geocodio (cache-first); fallback to stored mapping if API unavailable
- Update `users` record and `updated_at` timestamp

---

#### GET /api/users/me/messages

Get user's message history.

**Query Parameters:**

- `page` (default 1)
- `pageSize` (default 20, max 100)
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)
- `billId` (filter by bill)
- `status` (sent, delivered, failed)

**Response:**

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "uuid",
        "billId": "uuid",
        "billNumber": "HR 1",
        "billTitle": "For the People Act",
        "position": "support",
        "messageContent": "I urge you to support...",
        "recipients": [
          {
            "bioguideId": "D000622",
            "name": "Tammy Duckworth",
            "role": "Senator"
          }
        ],
        "deliveryMethod": "email",
        "deliveryStatus": "delivered",
        "sentAt": "2025-01-20T14:30:00Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 3,
    "totalItems": 52
  }
}
```

**Business Logic:**

- If user is free tier: Filter `sent_at > NOW() - 30 days`
- If premium: Return all messages
- Join with `bills` and `members` tables

---

#### GET /api/users/me/activity

Get user activity summary for dashboard.

**Response:**

```json
{
  "success": true,
  "data": {
    "messagesSent": 45,
    "billsEngaged": 23,
    "supportedCount": 15,
    "opposedCount": 8,
    "representativesContacted": 8,
    "responseRate": 12.5,
    "engagementOverTime": [
      { "date": "2025-01", "count": 12 },
      { "date": "2025-02", "count": 8 }
    ]
  }
}
```

**Business Logic:**

- Aggregate from `user_messages` table
- Calculate response rate: (responses / messages sent) × 100

---

### Bills

#### GET /api/bills

Get list of bills with filters.

**Query Parameters:**

- `page` (default 1)
- `pageSize` (default 20, max 100)
- `congress` (e.g., 119)
- `chamber` (house, senate)
- `status` (introduced, passed_house, passed_senate, to_president, became_law)
- `subject` (policy area)
- `sponsorParty` (D, R, I)
- `sort` (latest_action, introduced_date, importance)
- `search` (keyword search)

**Response:**

```json
{
  "success": true,
  "data": {
    "bills": [
      {
        "id": "uuid",
        "congress": 119,
        "type": "HR",
        "number": "1",
        "title": "For the People Act of 2025",
        "shortTitle": "For the People Act",
        "introducedDate": "2025-01-03",
        "latestAction": {
          "date": "2025-01-20",
          "text": "Referred to Committee on House Administration"
        },
        "status": "in_committee",
        "sponsor": {
          "bioguideId": "S001168",
          "name": "John Sarbanes",
          "party": "D",
          "state": "MD"
        },
        "policyArea": "Government Operations",
        "subjects": ["Voting rights", "Campaign finance", "Ethics"],
        "summary": "This bill addresses voter access, election integrity...",
        "cosponsorsCount": 234,
        "activeCampaignsCount": 12,
        "supportCount": 8542,
        "opposeCount": 1204
      }
    ]
  },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 150,
    "totalItems": 3000
  }
}
```

**Business Logic:**

- Query `bills` table
- Join with `sponsors`, `campaigns` for aggregates
- Apply filters and sorting
- Cache results for 5 minutes
- Full-text search on title, summary, subjects if `search` param provided

---

#### GET /api/bills/:billId

Get detailed bill information.

**Response:**

```json
{
  "success": true,
  "data": {
    "bill": {
      "id": "uuid",
      "congress": 119,
      "type": "HR",
      "number": "1",
      "title": "For the People Act of 2025",
      "introducedDate": "2025-01-03",
      "latestAction": { ... },
      "status": "in_committee",
      "sponsor": { ... },
      "cosponsors": [
        { "bioguideId": "A000370", "name": "Alma Adams", ... }
      ],
      "committees": [
        {
          "name": "House Committee on Administration",
          "systemCode": "hsha00"
        }
      ],
      "policyArea": "Government Operations",
      "subjects": ["Voting rights", "Campaign finance"],
      "summaries": [
        {
          "text": "This bill addresses voter access...",
          "date": "2025-01-05"
        }
      ],
      "aiSummary": {
        "headline": "Election Reform and Campaign Finance Bill",
        "explainer": "This bill would expand voting access...",
        "supportStatement": "Proponents argue...",
        "opposeStatement": "Critics contend...",
        "closingQuestion": "Should Congress expand voting rights?"
      },
      "actions": [
        { "date": "2025-01-20", "text": "Referred to committee" }
      ],
      "textVersions": [
        { "type": "Introduced", "url": "https://..." }
      ],
      "amendments": [],
      "relatedBills": [],
      "activeCampaigns": [
        {
          "id": "uuid",
          "organizationId": "uuid",
          "organizationName": "Common Cause",
          "position": "support",
          "supportCount": 5432,
          "opposeCount": 234
        }
      ]
    }
  }
}
```

**Business Logic:**

- Fetch from `bills` table with all related data
- Persist AI summary via AWS Bedrock Agent if not cached
- Cache for 1 hour

---

#### POST /api/bills/:billId/watch

Add bill to user's watch list.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Bill added to your watch list"
  }
}
```

**Business Logic:**

- Create entry in `user_watched_bills` table
- Return 200 if already watching (idempotent)

---

#### DELETE /api/bills/:billId/watch

Remove bill from watch list.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Bill removed from watch list"
  }
}
```

---

### State Bills

#### GET /api/state-bills

Get state bills.

**Query Parameters:**

- `state` (required, e.g., "CA")
- `page`, `pageSize`, `status`, etc.

**Response:**
Similar to `/api/bills` but for state legislation.

**Business Logic:**

- Query `state_bills` table
- Data synced from LegiScan daily

---

### Members (Representatives & Senators)

#### GET /api/members

Get list of congress members.

**Query Parameters:**

- `state` (e.g., "CA")
- `chamber` (house, senate)
- `party` (D, R, I)
- `zipCode` (returns members for this ZIP's district)

**Response:**

```json
{
  "success": true,
  "data": {
    "members": [
      {
        "bioguideId": "D000622",
        "firstName": "Tammy",
        "lastName": "Duckworth",
        "fullName": "Tammy Duckworth",
        "party": "D",
        "state": "IL",
        "district": null,
        "chamber": "senate",
        "imageUrl": "https://...",
        "officeAddress": "524 Hart Senate Office Building",
        "phone": "202-224-2854",
        "email": "tammy.duckworth.D000622@congress.gov",
        "websiteUrl": "https://www.duckworth.senate.gov",
        "terms": [
          { "startYear": 2023, "endYear": 2029, "congress": 118 }
        ]
      }
    ]
  }
}
```

**Business Logic:**

- If `zipCode` provided: Resolve district via Geocodio cache (fallback to stored mapping), then return House member + 2 Senators
- Query `members` table with filters

---

#### GET /api/members/:bioguideId

Get detailed member information.

**Response:**

```json
{
  "success": true,
  "data": {
    "member": {
      "bioguideId": "D000622",
      "firstName": "Tammy",
      "lastName": "Duckworth",
      "fullName": "Tammy Duckworth",
      "party": "D",
      "state": "IL",
      "chamber": "senate",
      "imageUrl": "https://...",
      "birthDate": "1968-03-12",
      "education": "University of Hawaii, George Washington University",
      "profession": "U.S. Army Officer, Helicopter Pilot",
      "terms": [...],
      "committeeAssignments": [
        { "name": "Armed Services Committee", "role": "Member" }
      ],
      "sponsoredLegislation": {
        "count": 234,
        "bills": [...]
      },
      "cosponsoredLegislation": {
        "count": 1456
      },
      "votingRecord": {
        "totalVotes": 1842,
        "yesVotes": 1234,
        "noVotes": 543
      },
      "campaignFinance": {
        "totalRaised": 12500000,
        "cashOnHand": 3200000
      },
      "socialMedia": {
        "twitter": "@SenDuckworth",
        "facebook": "SenatorDuckworth"
      },
      "districtOffices": [
        {
          "city": "Chicago",
          "address": "230 S Dearborn St, Suite 3900",
          "phone": "312-886-3506"
        }
      ]
    }
  }
}
```

**Business Logic:**

- Fetch from `members` table
- Include related data from `committee_memberships`, `campaign_finance`
- Cache for 24 hours

---

### Advocacy Messages

#### POST /api/messages

Send advocacy message to representatives (ANONYMOUS or AUTHENTICATED).

**Headers (Optional):**

```
Authorization: Bearer {auth0_token}
```

**Request:**

```json
{
  "billId": "uuid",
  "position": "support",
  "messageContent": "I urge you to support...",
  "recipientIds": ["D000622", "D000563"],
  "senderInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "address": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701"
  },
  "includePersonalData": ["fullName", "address", "profession"],
  "deliveryMethod": "email",
  "attachments": [
    {
      "fileName": "document.pdf",
      "fileUrl": "https://s3.amazonaws.com/..."
    }
  ],
  "campaignId": "uuid",
  "sessionToken": "anonymous-session-uuid"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "messageId": "uuid",
    "confirmationNumber": "MSG-2025-0120-1234",
    "sessionToken": "anonymous-session-uuid",
    "deliveryStatus": "queued",
    "recipients": [
      {
        "bioguideId": "D000622",
        "deliveryStatus": "queued"
      }
    ],
    "promptSignup": true
  }
}
```

**Business Logic:**

- **AUTHENTICATION OPTIONAL:** Allow anonymous sending
- If authenticated: Get user ID from Auth0 token
- If anonymous: Generate or use provided `sessionToken` (UUID)
- Validate `senderInfo` (required for anonymous)
- Create entry in `user_messages` table:
  - Set `user_id` = user ID (if authenticated) or NULL (if anonymous)
  - Set `session_token` = sessionToken (for later linking)
- For each recipient:
  - Generate email with user's message + personal data (if included)
  - Send via AWS SES
  - Store delivery confirmation
- If `campaignId` provided: Create entry in `campaign_actions` table
- Return confirmation number and `sessionToken` for account linking
- Set `promptSignup: true` to signal frontend to show signup prompt

**Email Template:**

```
To: senator.email@senate.gov
From: noreply@yourplatform.com
Subject: [Constituent Message] Re: H.R. 1 - For the People Act

Dear Senator Duckworth,

[User's message content]

Sincerely,
John Doe
123 Main St
Springfield, IL 62701

---
This message was sent via [Your Platform Name] on behalf of a constituent.
Confirmation: MSG-2025-0120-1234
```

---

#### POST /api/messages/ai-draft

Generate an AI-assisted draft for a bill or campaign message.

**Headers:**

```
Authorization: Bearer {auth0_token} // optional; improves personalization
```

**Request:**

```json
{
  "billId": "uuid",
  "position": "support",
  "recipientIds": ["D000622"],
  "tone": "respectful",
  "additionalContext": "I am a public school teacher in Springfield, IL",
  "previousDraftId": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "draftId": "uuid",
    "messageContent": "Senator Duckworth,\n\nAs a teacher in Springfield...",
    "keyPoints": [
      "Highlights local impact on Illinois educators",
      "References Section 3 of the bill"
    ],
    "sources": [
      {
        "type": "bill",
        "title": "For the People Act of 2025",
        "url": "https://congress.gov/bill/119th-congress/house-bill/1"
      }
    ],
    "ttlSeconds": 86400
  }
}
```

**Business Logic:**

- Require at least one of `billId` or `campaignId` (400 otherwise).
- Gather context (bill summary, representative stances, user profile/location) before calling AWS Bedrock Agent.
- Enforce rate limit: 5 drafts/hour per user or anonymous session (tie into Redis limiter).
- Store outputs in `ai_message_drafts` with `draft_id`, `user_id` (nullable), `session_token`, `context_hash`, `expires_at`.
- Return cached draft when the same context hash is requested within 6 hours; refresh Bedrock call otherwise.
- Feature flag: before Sprint 2 enablement, return `501 NOT_IMPLEMENTED`.

---

#### GET /api/messages/:messageId

Get message details.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": {
      "id": "uuid",
      "billId": "uuid",
      "billTitle": "For the People Act",
      "position": "support",
      "messageContent": "I urge you...",
      "recipients": [...],
      "deliveryStatus": "delivered",
      "sentAt": "2025-01-20T14:30:00Z",
      "deliveryDetails": [
        {
          "bioguideId": "D000622",
          "status": "delivered",
          "deliveredAt": "2025-01-20T14:31:23Z"
        }
      ],
      "responses": [
        {
          "id": "uuid",
          "fromBioguideId": "D000622",
          "fromName": "Tammy Duckworth",
          "responseText": "Thank you for contacting me...",
          "receivedAt": "2025-01-22T09:15:00Z"
        }
      ]
    }
  }
}
```

---

### Organizations

#### GET /api/organizations

Get list of advocacy organizations.

**Query Parameters:**

- `page`, `pageSize`
- `focusArea` (voting_rights, environment, etc.)
- `sort` (name, active_campaigns, total_actions)

**Response:**

```json
{
  "success": true,
  "data": {
    "organizations": [
      {
        "id": "uuid",
        "slug": "common-cause",
        "name": "Common Cause",
        "logoUrl": "https://...",
        "description": "A nonpartisan grassroots organization...",
        "website": "https://commoncause.org",
        "nonprofitStatus": "501(c)(4)",
        "yearsActive": 54,
        "focusAreas": ["Voting Rights", "Campaign Finance"],
        "activeCampaignsCount": 8,
        "totalSupporters": 125000
      }
    ]
  }
}
```

---

#### GET /api/organizations/:slug

Get organization details.

**Response:**

```json
{
  "success": true,
  "data": {
    "organization": {
      "id": "uuid",
      "slug": "common-cause",
      "name": "Common Cause",
      "logoUrl": "https://...",
      "description": "...",
      "website": "...",
      "socialMedia": {
        "twitter": "@CommonCause",
        "facebook": "CommonCause"
      },
      "activeCampaigns": [
        {
          "id": "uuid",
          "billId": "uuid",
          "billNumber": "HR 1",
          "billTitle": "For the People Act",
          "position": "support",
          "reasoning": "...",
          "supportCount": 5432,
          "opposeCount": 234
        }
      ]
    }
  }
}
```

---

#### POST /api/organizations/:slug/follow

Follow an organization.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "You are now following Common Cause"
  }
}
```

**Business Logic:**

- Create entry in `user_followed_organizations` table

---

### Campaigns (Public)

#### GET /api/campaigns

Get list of active campaigns.

**Query Parameters:**

- `organizationId` (filter by organization)
- `billId` (filter by bill)
- `position` (support, oppose)

**Response:**

```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "uuid",
        "organizationId": "uuid",
        "organizationName": "Common Cause",
        "organizationLogoUrl": "https://...",
        "billId": "uuid",
        "billNumber": "HR 1",
        "billTitle": "For the People Act",
        "position": "support",
        "reasoning": "This bill would transform democracy...",
        "ctaText": "Voice your opinion",
        "imageUrl": "https://...",
        "supportCount": 5432,
        "opposeCount": 234,
        "createdAt": "2025-01-10T00:00:00Z"
      }
    ]
  }
}
```

---

#### POST /api/campaigns/:campaignId/actions

Record user action on campaign (support/oppose).

**Request:**

```json
{
  "position": "support"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "actionId": "uuid",
    "supportCount": 5433,
    "opposeCount": 234
  }
}
```

**Business Logic:**

- Create entry in `campaign_actions` table
- Increment `support_count` or `oppose_count` in `campaigns` table
- Return updated counts

---

### Partners Endpoints (Organization Users)

All `/api/partners/*` endpoints require organization role.

#### GET /api/partners/organizations/me

Get organizations current user belongs to.

**Response:**

```json
{
  "success": true,
  "data": {
    "organizations": [
      {
        "id": "uuid",
        "slug": "common-cause",
        "name": "Common Cause",
        "role": "admin",
        "logoUrl": "https://..."
      }
    ]
  }
}
```

---

#### PATCH /api/partners/organizations/:id

Update organization profile.

**Request:**

```json
{
  "name": "Common Cause",
  "description": "...",
  "website": "https://...",
  "logoUrl": "https://...",
  "focusAreas": ["Voting Rights"],
  "socialMedia": {
    "twitter": "@CommonCause"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "organization": { ... }
  }
}
```

---

#### POST /api/partners/campaigns

Create new campaign (supports legislation, issue, and candidate campaigns).

**Request (Legislation Campaign):**

```json
{
  "organizationId": "uuid",
  "campaignType": "legislation",
  "billId": "uuid",
  "position": "support",
  "reasoning": "This bill would...",
  "ctaText": "Voice your opinion",
  "imageUrl": "https://...",
  "status": "active"
}
```

**Request (Candidate Campaign):**

```json
{
  "organizationId": "uuid",
  "campaignType": "candidate_advocacy",
  "position": "support",
  "reasoning": "We endorse this candidate because...",
  "candidate": {
    "candidate1Name": "John Smith",
    "candidate1Bio": "Experienced senator with 12 years in office",
    "candidate2Name": "Jane Doe",
    "candidate2Bio": "Former governor and education advocate",
    "selectedCandidate": "candidate1"
  },
  "ctaText": "Support our endorsed candidate",
  "imageUrl": "https://...",
  "status": "active"
}
```

**Request (Issue Campaign):**

```json
{
  "organizationId": "uuid",
  "campaignType": "issue",
  "issueTitle": "Climate Action",
  "issueSpecificTitle": "Push for renewable energy investment",
  "issueDescription": "We need stronger climate policies...",
  "policyArea": "Climate, Energy & Environment",
  "position": "support",
  "reasoning": "Our position is based on...",
  "ctaText": "Take action",
  "status": "active"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "uuid",
      "slug": "hr-1-for-the-people-act",
      "campaignType": "legislation",
      ...
    }
  }
}
```

**Business Logic:**

- Validate campaign type and required fields based on type
- Generate slug from bill number/title (legislation) or issue title (issue) or candidate names (candidate)
- Create entry in `campaigns` table with appropriate fields populated
- For candidate campaigns, store candidate object in `candidate` JSONB field
- Set `created_at`, `updated_at`

---

#### PATCH /api/partners/campaigns/:id

Update campaign.

**Request:**

```json
{
  "reasoning": "Updated reasoning...",
  "status": "paused"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "campaign": { ... }
  }
}
```

**Business Logic:**

- Update `campaigns` table
- Log change in `campaign_edit_history` table

---

#### DELETE /api/partners/campaigns/:id

Delete campaign (soft delete).

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Campaign deleted successfully"
  }
}
```

**Business Logic:**

- Set `deleted_at` timestamp
- Exclude from public queries

---

#### GET /api/partners/campaigns/:id/analytics

Get campaign analytics.

**Response:**

```json
{
  "success": true,
  "data": {
    "analytics": {
      "totalActions": 5666,
      "supportCount": 5432,
      "opposeCount": 234,
      "estimatedMessagesSent": 4249,
      "emailDeliveryRate": 87.3,
      "engagementOverTime": [
        { "date": "2025-01-15", "count": 234 },
        { "date": "2025-01-16", "count": 456 }
      ],
      "geographicBreakdown": [
        { "state": "CA", "count": 1234 },
        { "state": "NY", "count": 567 }
      ],
      "demographicBreakdown": {
        "ageRanges": [
          { "range": "18-24", "count": 234 },
          { "range": "25-34", "count": 567 }
        ],
        "gender": [
          { "gender": "male", "count": 2456 },
          { "gender": "female", "count": 3123 }
        ]
      },
      "topRepresentatives": [
        {
          "bioguideId": "P000197",
          "name": "Nancy Pelosi",
          "messagesReceived": 234
        }
      ]
    }
  }
}
```

**Business Logic:**

- Query `campaign_actions` and `user_messages` tables
- Join with `users` for demographics (anonymized aggregates)
- Calculate estimated messages: (actions × 0.75)

---

### Admin Endpoints

All `/api/admin/*` endpoints require admin role.

#### GET /api/admin/users

Get all users with filters.

**Query Parameters:**

- `page`, `pageSize`
- `membershipTier` (free, premium)
- `status` (active, suspended, deleted)
- `registeredAfter`, `registeredBefore` (ISO dates)
- `search` (email or name)

**Response:**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "membershipTier": "premium",
        "status": "active",
        "createdAt": "2024-12-01T00:00:00Z",
        "lastLoginAt": "2025-01-20T10:30:00Z"
      }
    ]
  },
  "meta": { ... }
}
```

---

#### PATCH /api/admin/users/:id/suspend

Suspend a user.

**Request:**

```json
{
  "reason": "Policy violation",
  "expiresAt": "2025-02-20T00:00:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "User suspended successfully"
  }
}
```

**Business Logic:**

- Set `users.status` = 'suspended'
- Store `suspended_at`, `suspended_by` (admin ID), `suspension_reason`, `suspension_expires_at`
- Log in `admin_audit_log`

---

#### GET /api/admin/subscriptions

Get all subscriptions.

**Query Parameters:**

- `status` (active, past_due, canceled)
- `page`, `pageSize`

**Response:**

```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "id": "uuid",
        "userId": "uuid",
        "userEmail": "user@example.com",
        "status": "active",
        "stripeCustomerId": "cus_...",
        "stripeSubscriptionId": "sub_...",
        "currentPeriodStart": "2025-01-15T00:00:00Z",
        "currentPeriodEnd": "2025-04-15T00:00:00Z",
        "canceledAt": null
      }
    ]
  }
}
```

---

#### POST /api/admin/subscriptions/:id/refund

Issue refund.

**Request:**

```json
{
  "invoiceId": "in_...",
  "amount": 600,
  "reason": "Customer request"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "refundId": "re_...",
    "amount": 600,
    "status": "succeeded"
  }
}
```

**Business Logic:**

- Call Stripe API: `POST /v1/refunds`
- Log in `payment_refunds` table
- Log in `admin_audit_log`
- Send notification email to user

---

#### GET /api/admin/analytics/overview

Get platform-wide analytics.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalUsers": 125000,
    "newUsersLast30Days": 2340,
    "premiumSubscribers": 8500,
    "churnRate": 2.3,
    "totalMessagesSent": 450000,
    "messagesLast30Days": 12500,
    "activeCampaigns": 234,
    "activeOrganizations": 56,
    "monthlyRecurringRevenue": 17000,
    "newSignupsOverTime": [...],
    "messagesSentOverTime": [...],
    "revenueOverTime": [...]
  }
}
```

---

## Stripe Integration

### Setup

1. Create Stripe account
2. Get API keys (test and live)
3. Create Product: "Premium Membership"
4. Create Price: $6.00 USD, recurring every 3 months

### Endpoints to Implement

#### POST /api/stripe/create-checkout-session

Create Stripe Checkout session for membership signup.

**Request:**

```json
{
  "userId": "uuid",
  "successUrl": "https://app.com/dashboard?membership=success",
  "cancelUrl": "https://app.com/membership/signup"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/pay/cs_test_..."
  }
}
```

**Business Logic:**

- Create Stripe Customer if doesn't exist
- Create Checkout Session with:
  - `mode: 'subscription'`
  - `line_items`: [{ price: 'price_...', quantity: 1 }]
  - `metadata`: { userId: '...' }
- Return session URL for redirect

---

#### POST /api/stripe/create-customer-portal-session

Create Stripe Customer Portal session for managing subscription.

**Request:**

```json
{
  "returnUrl": "https://app.com/dashboard/membership"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/session/..."
  }
}
```

**Business Logic:**

- Get user's Stripe Customer ID
- Create Customer Portal Session
- Return portal URL for redirect

---

### Webhooks

#### POST /webhooks/stripe

Handle Stripe webhook events.

**Events to Handle:**

**`checkout.session.completed`**

- Extract `userId` from metadata
- Get Stripe Customer ID and Subscription ID
- Update `users.membership_tier` = 'premium'
- Update `users.membership_start_date` = NOW()
- Create entry in `user_subscriptions` table
- Send welcome email

**`invoice.payment_succeeded`**

- Log in `payment_history` table
- Send receipt email

**`invoice.payment_failed`**

- Log in `payment_failures` table
- Send reminder email to user
- Stripe will retry automatically

**`customer.subscription.updated`**

- Update `user_subscriptions` table with new data

**`customer.subscription.deleted`**

- Set `user_subscriptions.canceled_at` = NOW()
- Set `user_subscriptions.ends_at` = period_end
- Downgrade user to free tier after period ends (via cron job)

**Webhook Security:**

- Verify webhook signature using Stripe secret
- Return 200 OK immediately to acknowledge receipt
- Process event asynchronously

---

## Caching Strategy

### Redis Cache Keys

**Bills:**

- Key: `bills:list:{congress}:{filters_hash}`
- TTL: 5 minutes

**Bill Detail:**

- Key: `bills:detail:{billId}`
- TTL: 1 hour

**Members:**

- Key: `members:list:{filters_hash}`
- TTL: 24 hours

**Member Detail:**

- Key: `members:detail:{bioguideId}`
- TTL: 24 hours

**Organizations:**

- Key: `orgs:list`
- TTL: 10 minutes

**Campaign Analytics:**

- Key: `campaigns:analytics:{campaignId}`
- TTL: 5 minutes

**User Profile:**

- Key: `users:profile:{userId}`
- TTL: 30 minutes
- Invalidate on update

### Cache Invalidation

- On bill update: Delete `bills:detail:{billId}` and `bills:list:*`
- On user update: Delete `users:profile:{userId}`
- On campaign update: Delete `campaigns:analytics:{campaignId}`

---

## Rate Limiting

### Endpoints

**Auth Endpoints:**

- `/auth/login`: 5 requests per 15 minutes per IP
- `/auth/signup`: 3 requests per hour per IP
- `/auth/forgot-password`: 3 requests per hour per IP

**API Endpoints (Authenticated):**

- Global: 100 requests per minute per user
- `/api/messages`: 10 requests per hour per user (prevent spam)
- `/api/messages/ai-draft`: 5 requests per hour per user/session (controls Bedrock usage)
- `/api/bills`: 60 requests per minute per user

**Admin Endpoints:**

- Global: 200 requests per minute per admin

### Implementation

Use middleware with Redis to track request counts:

```
Key: rate_limit:{endpoint}:{userId|IP}
Value: request_count
TTL: window_duration
```

Return HTTP 429 when limit exceeded:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 5 minutes."
  }
}
```

---

## Error Handling

### Error Codes

| Code                    | HTTP Status | Description              |
| ----------------------- | ----------- | ------------------------ |
| `VALIDATION_ERROR`    | 400         | Invalid input data       |
| `UNAUTHORIZED`        | 401         | Not authenticated        |
| `FORBIDDEN`           | 403         | Insufficient permissions |
| `NOT_FOUND`           | 404         | Resource not found       |
| `CONFLICT`            | 409         | Resource already exists  |
| `RATE_LIMIT_EXCEEDED` | 429         | Too many requests        |
| `INTERNAL_ERROR`      | 500         | Server error             |
| `SERVICE_UNAVAILABLE` | 503         | External service down    |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email address",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

### Logging

Log all errors to database and monitoring service:

```
Table: error_logs
Columns: id, timestamp, error_code, message, stack_trace, user_id, request_url, request_method, request_body, response_status
```

Use service like Sentry for real-time error monitoring.

---

## Webhooks

### Email Service Webhooks

AWS SES publishes delivery/bounce/complaint events through SNS. Subscribe an HTTPS endpoint:

**POST /webhooks/ses**

Expected payload (SNS notification wrapper):

```json
{
  "Type": "Notification",
  "MessageId": "uuid",
  "Timestamp": "2025-02-01T12:34:56.000Z",
  "TopicArn": "arn:aws:sns:us-east-1:123456789012:ses-events",
  "Message": "{\"eventType\":\"Delivery\",\"mail\":{...},\"delivery\":{...}}"
}
```

Steps:

1. Validate SNS signature and confirm subscription.
2. Parse `Message` JSON and handle SES `eventType`.

Supported `eventType` values:

- `Delivery`: set `user_messages.delivery_status = 'delivered'`, store `delivered_at`.
- `Bounce`: set status `bounced`, log `bounceType`/`bounceSubType`.
- `Complaint`: set status `complaint`, trigger manual review.
- `Reject`: set status `failed`.

Store webhook audits in `email_events` with raw payload for troubleshooting.

---

## Testing

### API Testing

Use Postman collections or automated tests (Jest, Mocha):

**Example Test Cases:**

1. Signup with valid email → Success
2. Signup with existing email → Error 409
3. Login with wrong password → Error 401
4. Get bills without auth token → Error 401
5. Send message as free user → Success
6. Send 11th message in hour → Error 429
7. Create campaign as regular user → Error 403
8. Stripe webhook with invalid signature → Error 400

### Load Testing

Use tools like Apache JMeter or k6:

- Target: 1000 concurrent users
- Acceptable: 500ms median response time
- Error rate: < 0.1%

---

## Deployment

### Environment Variables

```
# Database (AWS RDS)
DATABASE_URL=postgresql://user:pass@your-db.rds.amazonaws.com:5432/dbname

# Redis (AWS ElastiCache)
REDIS_URL=redis://your-redis.cache.amazonaws.com:6379

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=your-api-identifier
AUTH0_CALLBACK_URL=https://yourdomain.com/auth/callback
AUTH0_LOGOUT_URL=https://yourdomain.com

# External APIs
CONGRESS_API_KEY=your-key
LEGISCAN_API_KEY=your-key
GEOCODIO_API_KEY=your-key
FEC_API_KEY=your-key
AWS_BEDROCK_REGION=us-east-1
AWS_BEDROCK_AGENT_ID=agt-xxxxxxxxxxxxxxxx
L2_POLITICAL_API_KEY=your-key
L2_POLITICAL_BASE_URL=https://api.l2political.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# AWS Services
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
AWS_CLOUDFRONT_DOMAIN=your-cdn.cloudfront.net

# App
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com
API_BASE_URL=https://api.yourdomain.com
```

### Production Checklist

**AWS Infrastructure:**

- [ ] Set up AWS RDS PostgreSQL with automated backups
- [ ] Set up AWS ElastiCache Redis
- [ ] Create S3 bucket for file uploads (versioning enabled)
- [ ] Configure AWS SES (verify domain, request production access)
- [ ] Set up CloudFront CDN for static assets
- [ ] Configure AWS IAM roles and security groups
- [ ] Set up Application Load Balancer (ALB)
- [ ] Configure auto-scaling groups for EC2/ECS

**Auth0 Setup:**

- [ ] Create Auth0 tenant (production)
- [ ] Configure Auth0 Application
- [ ] Set up Auth0 API with identifier
- [ ] Configure Auth0 Rules/Actions for custom claims
- [ ] Set up email templates in Auth0
- [ ] Configure password policy
- [ ] Enable MFA for admin accounts
- [ ] Test social login connections (Google, etc.)

**Security:**

- [ ] Configure HTTPS/SSL (AWS Certificate Manager)
- [ ] Set up WAF rules (AWS WAF)
- [ ] Configure CORS for frontend domain
- [ ] Enable Auth0 anomaly detection
- [ ] Set up secrets management (AWS Secrets Manager)
- [ ] Configure VPC and security groups
- [ ] Enable database encryption at rest

**Monitoring & Logging:**

- [ ] Set up AWS CloudWatch dashboards
- [ ] Configure CloudWatch Alarms
- [ ] Set up AWS CloudWatch Logs
- [ ] Enable Auth0 log streaming
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring (Pingdom, UptimeRobot)
- [ ] Set up performance monitoring (New Relic, Datadog)

**Stripe:**

- [ ] Configure Stripe webhooks
- [ ] Test subscription flow end-to-end
- [ ] Set up Stripe webhook signature verification
- [ ] Configure Stripe Customer Portal

**Deployment:**

- [ ] Set up CI/CD pipeline (GitHub Actions, AWS CodePipeline)
- [ ] Configure staging environment
- [ ] Set up database migration process
- [ ] Load test (1000+ concurrent users)
- [ ] Test anonymous message → account linking flow
- [ ] Configure DNS with Route 53
- [ ] Set up automated backups and disaster recovery

---

**End of Document**
