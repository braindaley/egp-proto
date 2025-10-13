# JIRA Tasks - Sprint 0: Foundation & Authentication

**Sprint Duration:** Weeks 1-2
**Sprint Goal:** Establish authentication, basic infrastructure, and core user flows
**Total Story Points:** 40

---

## US-017: Create Account (Post-Message Flow) - 9 Story Points

### EGP-001: [FE] Implement Signup Flow and Email Verification UI
**Assignee:** Frontend Developer | **Story Points:** 3 | **Hours:** 12 | **Sprint:** 0

**Description:**
Build complete user signup with email verification and automatic linking of anonymous advocacy messages to new accounts.

**Core Requirements:**
- Signup form with email/password and Google social login options
- Email verification workflow with pending state, resend capability, and expiration handling
- Automatic linking of anonymous messages (tracked via session token) to new account after verification
- Redirect to dashboard after successful verification with success banner

**User Experience:**
- Clear feedback at every step (form submission, email sent, verification complete)
- Helpful error messages with actionable links (duplicate email → sign in/reset links)
- Neutral handling of canceled social login (no error, return to signup)
- Preserve form data on errors so users don't lose work
- Mobile-responsive with easy-to-tap targets (44x44px minimum)

**Error Scenarios:**
- Duplicate email: Show message + sign-in/reset password links
- Social login canceled: Return to signup without error
- Network timeout: Show retry button, preserve form data
- Expired verification link: Clear message + option to resend

**Testing:**
- Happy path: New signup → verification email → click link → dashboard
- Duplicate email with error handling
- Social login cancellation
- Anonymous message linking (send message → signup → appears in history)
- Keyboard navigation and screen reader compatibility
- Mobile testing at 375px and 768px widths

**Dependencies:**
- Auth0 configured with email/password and Google
- Backend: Anonymous message linking endpoint
- Backend: Auth0 user creation webhook

**Definition of Done:**
- [ ] Code merged to main
- [ ] All flows work end-to-end
- [ ] No P0/P1 bugs
- [ ] TL approval
- [ ] No console errors
- [ ] Accessibility audit passes
- [ ] Mobile tested (375px, 768px)

---

### EGP-002: [BE] Implement User Creation and Anonymous Session Linking
**Assignee:** Backend Developer | **Story Points:** 2 | **Hours:** 8 | **Sprint:** 0

**Description:**
Handle user account creation from Auth0 webhooks and link anonymous messages to newly created accounts.

**Core Requirements:**
- **Webhook endpoint:** Receives Auth0 user creation events
  - Creates user record with Auth0 ID, email, name, verification status, timestamps
  - Assigns unique internal user ID
  - Handles duplicate events gracefully (check if user exists)

- **Message linking endpoint (authenticated):**
  - Accepts session token, finds matching anonymous messages
  - Updates messages with user ID, clears session token
  - Returns count of linked messages
  - Idempotent (repeated calls return 0 messages linked)

**Audit Trail:**
- Log all linking operations: user ID, message IDs, session token, timestamp
- Helps support troubleshoot missing messages

**Edge Cases:**
- Invalid token (malformed/doesn't exist) → 400 error
- Expired token (>24 hours) → 400 error
- Already linked to different account → appropriate error
- Unauthenticated request → 401 error
- Unexpected errors → log details, return generic 500

**Testing:**
- End-to-end: Anonymous message → signup → link → verify in database
- Idempotency: Call twice, second returns 0 linked
- Error cases: Invalid/expired/missing tokens
- Audit log creation
- Webhook creates users correctly
- Load test: 100 concurrent requests

**Dependencies:**
- Auth0 webhook configured to POST to our endpoint
- Users table with Auth0 ID and email verification fields
- User messages table with session token field

**Definition of Done:**
- [ ] Code merged to main
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration test passes
- [ ] API docs updated
- [ ] Database migration created
- [ ] TL approval
- [ ] Deployed to staging
- [ ] Smoke test passes

---

### EGP-003: [TL] Configure Auth0 and Define Security Posture
**Assignee:** Tech Lead | **Story Points:** 1 | **Hours:** 4 | **Sprint:** 0

**Description:**
Configure Auth0 with secure defaults and document all authentication settings.

**Configuration Tasks:**
- **Tenants:** Set up dev and production environments
- **Application:** Configure callback URLs, logout URLs, web origins
- **Authentication methods:**
  - Email/password with strong password policy (8+ chars, mixed types, breach detection)
  - Google OAuth with client credentials
- **Sessions & tokens:**
  - Standard session: ~7 days inactivity timeout
  - Remember me: ~90 days extended session
  - Access tokens: 24 hour lifetime
  - Refresh tokens: 30 days with rotation
- **Custom claims:** Include role, membership tier, internal user ID in tokens
- **MFA:** Required for admin users (email or authenticator app)
- **Security:** Whitelist allowed callback/logout URLs for dev and prod

**Documentation Deliverables:**
- Security summary covering token lifetimes, session behavior, MFA requirements, password policies, redirect rules
- Environment variable templates for application configuration
- Settings comparison: dev vs prod
- Backup of Auth0 configuration

**Testing:**
- Dev/prod signup flows with correct callbacks
- Social login (Google) completes successfully
- Token inspection shows all custom claims
- Session timeout after inactivity period
- Remember me persists for 90 days
- Admin MFA requirement
- Non-whitelisted URL redirect blocked
- Team walkthrough and sign-off

**Dependencies:**
- Auth0 account with appropriate plan
- Google OAuth credentials
- Production domain configured

**Definition of Done:**
- [ ] Auth0 configured in dev and prod
- [ ] Security docs created and reviewed
- [ ] Environment variables shared securely
- [ ] Test accounts created (all roles)
- [ ] Configuration backed up
- [ ] Team walkthrough completed

---

### EGP-004: [PM] QA Testing and Support Documentation for Signup
**Assignee:** Project Manager | **Story Points:** 1 | **Hours:** 4 | **Sprint:** 0

**Description:**
Comprehensive QA testing across browsers/devices and create support documentation.

**Testing Scope:**
- **Browsers:** Chrome, Firefox, Safari, Edge (latest)
- **Devices:** Desktop (1440px), Tablet (768px), Mobile (375px)
- **Platforms:** Windows, macOS, iOS Safari, Android Chrome

**Test Scenarios:**
- Happy path: Signup → verification → dashboard
- Duplicate email error handling
- Invalid email/weak password validation
- Social login (Google) and cancelation
- Anonymous message linking after signup
- Network timeout with retry
- Accessibility (keyboard nav, screen reader, focus indicators, WCAG AA contrast)
- Mobile (responsive layout, 44px touch targets, correct keyboard types)
- Slow 3G performance

**Defect Management:**
- Log with severity (P0-P4), component, steps, screenshots, browser/device
- No P0 or P1 defects remaining before sign-off

**Documentation Deliverables:**
- **Internal troubleshooting guide:**
  - Can't receive verification email → check spam, resend steps, Auth0 logs
  - Social login fails → check provider, verify redirects
  - Duplicate email → guide to reset/sign in
  - Pending message not appearing → verify token, check logs

- **User help articles:**
  - "How to Create an Account" (step-by-step with screenshots)
  - "Troubleshooting Signup Issues"
  - "How to Verify Your Email"

- **Demo video:** 2-3 min showing happy path (homepage → signup → verification → dashboard)

**Testing Deliverables:**
- Test results spreadsheet (test ID, scenario, expected/actual, pass/fail, browser, device, screenshots)
- Summary: Total tests, pass rate, open defects by severity
- Defect reports in JIRA
- Internal guide (decision tree/FAQ)
- User articles (markdown for knowledge base)

**Dependencies:**
- Signup flow on staging
- Backend endpoints functional
- Auth0 configured and accessible
- Test email addresses

**Definition of Done:**
- [ ] All scenarios tested and documented
- [ ] No P0/P1 defects (or approved exceptions)
- [ ] QA sign-off
- [ ] Internal guide published
- [ ] User articles drafted
- [ ] Demo video recorded

---

## US-018: Login & Password Reset - 5 Story Points

### EGP-005: [FE] Implement Login and Password Reset UI
**Assignee:** Frontend Developer | **Story Points:** 2 | **Hours:** 8 | **Sprint:** 0

**Description:**
Build login with "remember me", return-to-page redirects, and password reset flow.

**Core Requirements:**
- **Login form:**
  - Email (autofocus), password (show/hide toggle)
  - "Remember me" checkbox (unchecked default, extends session to ~90 days)
  - "Forgot password" link
  - Social login (Google minimum)

- **Redirect behavior:**
  - Standard: Redirect to dashboard after login
  - Return-to: If accessing protected page while logged out, redirect back after login
  - Already authenticated: Go straight to dashboard

- **Password reset:**
  - Opens modal/page asking for email
  - Always shows neutral message: "If account exists, we sent a reset link"
  - Never reveal account existence (security)
  - Rate limited: 3 requests per hour max
  - Remind to check spam folder

**Error Handling:**
- Wrong credentials: "Incorrect email or password" (focus password field, keep email)
- Too many attempts: Lock with countdown timer (15 min), suggest password reset
- Network timeout: Retry button with clear error
- Account suspended: Message to contact support

**Session Behavior:**
- Without "remember me": ~7 days inactivity timeout
- With "remember me": ~90 days session persistence

**Testing:**
- Login with correct credentials → dashboard
- Return-to: Protected page → login → back to original page
- Remember me: Login → close browser → reopen days later → still authenticated
- Wrong password error and field focus
- Rate limiting: 6th attempt within 15 min blocked
- Password reset neutral message
- Reset rate limit: 4th request in 1 hour blocked
- Social login (Google) OAuth flow
- Mobile at 375px width
- Screen reader compatibility

**Dependencies:**
- Auth0 password reset email template configured
- Backend: Auth0 callback handler
- Auth0 password policy configured

**Definition of Done:**
- [ ] Code merged to main
- [ ] All flows work end-to-end
- [ ] No P0/P1 bugs
- [ ] TL approval
- [ ] No console errors
- [ ] Password reset template in Auth0
- [ ] Cross-browser tested

---

### EGP-006: [BE] Implement Session Validation and Password Reset API
**Assignee:** Backend Developer | **Story Points:** 1 | **Hours:** 4 | **Sprint:** 0

**Description:**
Build authentication middleware and password reset endpoint with rate limiting.

**Core Requirements:**
- **Session validation middleware:**
  - Validates JWT token signature using Auth0 public key
  - Checks issuer, audience, expiration
  - Extracts user ID and attaches to request
  - Returns 401 for missing/invalid/expired tokens
  - Applied to all protected endpoints (user profiles, messages, dashboard, settings)
  - Public endpoints exempt: bills, campaigns, organizations, members (read-only)

- **Password reset endpoint:**
  - Accepts email address
  - Always returns same neutral message (whether email exists or not)
  - Triggers Auth0 reset email if email exists
  - Logs attempt if email doesn't exist
  - Rate limiting: 3 requests per email per hour, 10 requests per IP per hour
  - Returns 429 when rate limited

**Security Logging:**
- Log all 401 errors: timestamp, IP, user agent, attempted route
- Log all reset requests: timestamp, email (hashed), IP, success/rate-limited
- Never log passwords or tokens
- Alert on unusual patterns (many failures, excessive resets)

**Error Responses:**
- Missing token: 401 "Authentication required"
- Invalid/expired token: 401 "Invalid or expired token"
- Rate limited: 429 "Too many requests. Try again in X minutes"

**Testing:**
- Valid token → protected endpoint succeeds
- No token → 401
- Expired token → 401
- Invalid signature → 401
- Reset for existing email → triggers Auth0
- Reset for non-existent email → same neutral response
- 4th reset in 1 hour → 429
- Rate limit counter resets after window
- Integration: Login → get token → call protected endpoint → success
- Load test: 1000 concurrent auth checks

**Dependencies:**
- Auth0 public key endpoint (JWKS)
- Redis for rate limiting
- Auth0 Management API credentials

**Definition of Done:**
- [ ] Code merged to main
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] Middleware on all protected routes
- [ ] Security logging implemented
- [ ] TL approval
- [ ] Deployed to staging
- [ ] Rate limiting verified

---

### EGP-007: [TL] Define Session and Redirect Rules
**Assignee:** Tech Lead | **Story Points:** 1 | **Hours:** 4 | **Sprint:** 0

**Description:**
Document session management, remember me, and return-to redirect specifications.

**Documentation Required:**

**1. Session Duration Rules:**
- Standard login: 7 days inactivity timeout
- Remember me: 90 days absolute timeout
- Admin users: Shorter timeout (1 day) for security
- Activity definition: API calls, page loads, user actions

**2. Token Specifications:**
- Access token: 24 hours
- Refresh token: 30 days with rotation
- Grace period for refresh: 5 seconds
- Automatic refresh vs required re-login scenarios

**3. Return-To Redirect Rules:**
- Format: `/auth/login?returnTo=/bills/119/hr/1`
- **Validation (must pass all):**
  - Relative path (starts with `/`)
  - No external domains
  - Not auth route (no `/auth/*`)
  - Max length ≤ 2048 chars
  - Properly URL-encoded
- **Blocked examples:**
  - `https://evil.com` (external)
  - `//evil.com` (protocol-relative)
  - `/auth/login` (loop)
  - `javascript:alert(1)` (XSS)
- Default: Redirect to `/dashboard` if invalid/missing

**4. Redirect Decision Flow:**
- Already authenticated → dashboard
- Not authenticated → complete login → validate returnTo → redirect (or dashboard if invalid)

**5. Security Measures:**
- Open redirect prevention
- CSRF protection on callbacks
- Token storage recommendations (httpOnly cookies vs memory vs sessionStorage)
- Session regeneration after login
- Monitoring for suspicious patterns

**Deliverables:**
- Session management spec (tables showing durations, token lifetimes, storage recommendations)
- Return-to redirect spec (format, validation, examples, logging)
- Security checklist (token security, session security, redirect security, rate limiting, monitoring)

**Testing:**
- Review Auth0 config matches spec
- Test remember me (persists for 90 days)
- Test inactivity timeout (expired after 7+ days)
- Test redirect security (XSS attempt blocked)
- Test valid redirect (protected page → login → return)
- Code review of FE/BE implementations
- Team walkthrough

**Dependencies:**
- Auth0 tenant access
- FE/BE implementations in progress

**Definition of Done:**
- [ ] All specs created and reviewed
- [ ] FE/BE teams confirm understanding
- [ ] Auth0 config verified
- [ ] Security checklist reviewed
- [ ] Spot-checks pass
- [ ] Docs published to wiki
- [ ] FE/BE leads sign-off

---

### EGP-008: [PM] QA Login Flows and Release Notes
**Assignee:** Project Manager | **Story Points:** 1 | **Hours:** 4 | **Sprint:** 0

**Description:**
Test login/password reset, validate remember me and redirects, create release notes.

**Testing Scope:**
- **Login scenarios:**
  - Happy path: Correct credentials → dashboard
  - Wrong password → error + email preserved + password focused
  - Rate limiting: 5 failures → 6th blocked with countdown
  - Return-to: Protected page → login → back to page
  - Invalid returnTo (external URL) → dashboard (security)

- **Remember me:**
  - Standard: Login → close browser → reopen day 7 → still authenticated → day 8 → expired
  - Remember me: Login → close browser → reopen day 30 → authenticated → day 90 → authenticated → day 91 → expired

- **Password reset:**
  - Request with any email → neutral message
  - Check inbox and spam for email
  - 3 requests in 1 hour → 4th blocked with rate limit error

- **Social login:**
  - Google OAuth → dashboard
  - Cancel midway → return to login without error

- **Cross-browser:** Chrome, Firefox, Safari, Edge (desktop + mobile)
- **Performance:** Login page <2s on 3G, Auth0 modal <500ms
- **Security:** XSS in returnTo blocked, SQL injection sanitized, expired token → 401

**Deliverables:**
- Test results spreadsheet (24 test cases: test ID, scenario, expected/actual, pass/fail, browser, device, screenshots)
- Summary: Total tests, pass rate, defects by severity
- Defect reports in JIRA with full details
- Internal troubleshooting guide (reset emails in spam, social login failures, pending messages missing)
- User help articles:
  - "How to Create an Account"
  - "Troubleshooting Signup Issues"
  - "How to Verify Your Email"
- Internal testing summary (execution overview, results, critical findings, browser compatibility, recommendations)
- **Release notes:** User-facing description of authentication features (account creation, secure login, remember me, password reset, social login, security measures, known issues, coming next sprint)

**Dependencies:**
- Login/reset on staging
- Backend endpoints functional
- Auth0 configured
- Test accounts (various states)

**Definition of Done:**
- [ ] All 24 test cases executed
- [ ] No P0/P1 defects (or approved exceptions)
- [ ] Release notes reviewed
- [ ] Internal testing summary shared
- [ ] Session persistence validated
- [ ] Redirect security tested
- [ ] QA sign-off

---

## US-019: Update Profile & Set Location - 5 Story Points

### EGP-009: [FE] Build Profile Form and Location Detection UI
**Assignee:** Frontend Developer | **Story Points:** 2 | **Hours:** 8 | **Sprint:** 0

**Description:**
Profile editing with ZIP-based district detection and US map visualization.

**Core Requirements:**
- **Profile sections:**
  - Personal: First name*, last name*
  - Location: Address, city, state, ZIP* (dropdown for state)
  - Demographics: Birth year, gender, political affiliation, education
  - Professional: Profession, military service (checkbox)
  - Constituent description (500 char max with counter)
  - *Required fields

- **District detection:**
  - On ZIP blur: Auto-lookup congressional & state legislative districts
  - Display results: "Congressional: CA-13, State House: 25, State Senate: 10"
  - Show loading indicator during lookup
  - Error handling: Invalid ZIP → "Unable to determine district. Check ZIP code" + retry
  - Cache lookups for 7 days (avoid repeated API calls)

- **US map:**
  - Shows all states, highlights user's state
  - Updates when state selected or ZIP determines state
  - Static (no interactions needed)

**Form Validation:**
- Required: First name, last name, ZIP
- ZIP: Exactly 5 digits
- Birth year: 1900-2020 range
- Email: Read-only (from Auth0)
- Constituent description: 500 char limit
- Show inline errors with helpful messages

**Save Behavior:**
- Disable "Save" until form valid
- On submit: Loading state (spinner, disable form, "Saving...")
- Success: Banner "Profile saved successfully" (5 seconds), re-enable form
- Failure: Error message + "Try Again" button, preserve data
- Reload page: Data persists

**Accessibility:**
- All fields have labels
- Required fields marked with aria-required
- Error messages linked to fields (aria-describedby)
- Success/error banners announced (ARIA live regions)
- Full keyboard navigation (tab through all fields, submit with Enter)

**Mobile:**
- Stack fields vertically
- Map scales to width
- Touch targets ≥44x44px
- Works on iOS Safari and Android Chrome

**Testing:**
- Happy path: Fill required fields → ZIP "60601" → districts appear "IL-7" → Illinois highlights → save → reload → data persists
- Multiple valid ZIPs for correct districts
- Invalid ZIP "00000" → error message
- Missing required fields → inline errors
- ZIP validation (4 digits) → "ZIP must be 5 digits"
- 500+ chars in description → counter/limit
- Save failure → error + retry
- Cache: Same ZIP twice → instant second time
- Keyboard nav and screen reader
- Mobile at 375px width

**Dependencies:**
- Backend: Profile update endpoint
- Backend: ZIP to district lookup endpoint
- Auth0 session for email
- US map SVG or component library

**Definition of Done:**
- [ ] Code merged to main
- [ ] All flows work end-to-end
- [ ] District lookup works with real data
- [ ] Form validation prevents invalid submissions
- [ ] TL approval
- [ ] Mobile tested (375px, 768px)
- [ ] Accessibility audit passes

---

### EGP-010: [BE] Implement Profile Update and District Lookup Endpoints
**Assignee:** Backend Developer | **Story Points:** 2 | **Hours:** 8 | **Sprint:** 0

**Description:**
Profile update endpoint and ZIP-to-district lookup with Geocodio integration and caching.

**Core Requirements:**

**1. Profile Update Endpoint (authenticated):**
- Accept partial updates (any combination of fields)
- **Whitelisted fields:**
  - firstName*, lastName* (required, non-empty)
  - address, city, state, zipCode
  - birthYear (integer 1900-2025)
  - gender (enum: male, female, non-binary, prefer_not_to_say)
  - politicalAffiliation (enum: democrat, republican, independent, other)
  - education, profession (strings)
  - militaryService (boolean)
  - constituentDescription (string, max 500 chars)
- Never allow email updates (Auth0 managed)
- Update `updated_at` timestamp
- Return complete updated user profile

**Validation:**
- ZIP: Exactly 5 digits (regex)
- Birth year: 1900-2025
- Constituent description: ≤500 chars
- First/last name: Non-empty
- Return 400 with field-specific errors for validation failures
- Reject unknown fields

**2. District Lookup Endpoint (public):**
- Accepts ZIP code as query param
- Check cache first (Redis key: `geocode:{zipCode}`, TTL: 7 days)
- Cache hit: Return immediately
- Cache miss: Call Geocodio API
- Normalize response to consistent format:
  - congressionalDistrict (e.g., "IL-13")
  - stateHouseDistrict (e.g., "95")
  - stateSenateDistrict (e.g., "48")
  - state (e.g., "IL")
  - city
- Store in cache, return to frontend

**Geocodio Integration:**
- Request congressional district + state legislative district fields
- Handle multiple districts (ZIP spans boundaries) → pick first/highest confidence
- Timeout: 10 seconds
- Retry once on network failure
- Parse nested response structure carefully

**Error Handling:**
- Invalid ZIP format (not 5 digits) → 400 without calling API
- ZIP not found by Geocodio → 404 "ZIP code not found"
- Geocodio timeout/unavailable → 503 "Service temporarily unavailable"
- Rate limit hit → Return cached data if available, else 503
- Unexpected errors → Log details, return 500

**Security:**
- Both endpoints require authentication
- Profile update: Verify token user ID matches profile being updated
- Don't expose Geocodio API key to frontend
- Log operations (hash sensitive info like emails)

**Testing:**
- Profile update: Valid data saves, partial updates work
- Validation: Invalid ZIP (4 digits) → 400, birth year 1850 → 400
- Email update rejected, unknown fields rejected
- Unauthenticated → 401
- District lookup: Valid ZIPs return correct districts
- Invalid ZIP "00000" → 404
- Caching: Second lookup instant (cache hit)
- Cache expiration works
- Timeout simulation → 503
- End-to-end: Update ZIP → lookup districts → verify saved
- Load test: Concurrent requests

**Dependencies:**
- Geocodio API key (env variable)
- Redis configured
- Auth0 JWT validation middleware
- Users table with all profile fields

**Definition of Done:**
- [ ] Code merged to main
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] Geocodio integration tested with real API
- [ ] Caching verified
- [ ] API docs updated
- [ ] Database migration created
- [ ] TL approval
- [ ] Deployed to staging

---

## US-004: Browse Federal Bills - 11 Story Points

### EGP-011: [FE] Build Federal Bills Browse Interface
**Assignee:** Frontend Developer | **Story Points:** 3 | **Hours:** 12 | **Sprint:** 0

**Description:**
Bills browse page with filtering, sorting, search, and pagination.

**Core Requirements:**
- **Bill list display:** Each item shows:
  - Bill number (prominent, e.g., "H.R. 1", "S. 442")
  - Full title
  - Sponsor name (linkable to profile)
  - Introduction date
  - Status badge (color-coded: gray=introduced, blue=passed one chamber, green=enacted)
  - Summary excerpt (150-200 chars + "Read more")
  - Entire item clickable → bill detail page

- **Filters (work together):**
  - Congress session (default: current 119th, option for previous)
  - Chamber: House only, Senate only, or both
  - Topics: Healthcare, Environment, Economy, Education, Foreign Policy, etc.
  - Status: Introduced, In Committee, Passed House, Passed Senate, Sent to President, Enacted, Vetoed

- **Sorting:**
  - Default: Introduction date (newest first)
  - Options: Last action date, bill number (alphabetical), relevance (if search active)

- **Search:**
  - Keywords search titles, summaries, sponsor names
  - Show count: "Found 23 bills matching 'climate'"
  - Empty result: "No bills found. Try different keywords"

**Performance:**
- Load 25-50 bills initially
- Infinite scroll or "Load More" for additional bills
- Skeleton loaders during loading
- Fast and responsive with thousands of bills

**Empty States:**
- No results: "No bills found matching your filters. Try adjusting or clearing filters"
- "Clear all filters" button

**Mobile:**
- Stack filters vertically or collapsible menu
- Bill items taller with vertical layout
- Touch targets ≥44px
- Search prominently accessible

**Visual Design:**
- Clear typography, good contrast
- Colorful meaningful status badges
- Obvious current filter/sort selections
- Hover feedback on clickable elements
- Spacing/dividers between items

**Testing:**
- Default view: Current Congress, newest first
- Individual filters: Senate only, Healthcare topic
- Combined filters: Congress 119 + House + Healthcare + Passed House
- Search: Common keyword → relevant bills
- Each sort option
- Click bill → navigate to detail with correct number
- Infinite scroll/"Load More"
- Empty state (filter combo with no results)
- Mobile at 375px
- Keyboard nav through filters and list

**Dependencies:**
- Backend: Bills list endpoint (filtering, sorting, pagination)
- Backend: Topic category mappings
- Bill detail page

**Definition of Done:**
- [ ] Code merged to main
- [ ] All filtering, sorting, search work
- [ ] Efficient with thousands of bills
- [ ] TL approval
- [ ] No console errors
- [ ] Mobile tested (375px, 768px)
- [ ] Accessibility audit passes

---

### EGP-012: [BE] Implement Federal Bills API and Data Import
**Assignee:** Backend Developer | **Story Points:** 4 | **Hours:** 16 | **Sprint:** 0

**Description:**
Bills API with filtering/sorting/pagination and automated Congress.gov data import.

**Core Requirements:**

**1. Bills API Endpoint:**
- **Query parameters:**
  - Congress number (default: current)
  - Chamber: House, Senate, or both
  - Topic categories (multiple)
  - Status filters (multiple)
  - Sort order (date, last action, bill number, relevance)
  - Search keywords
  - Page number, page size (default 25-50, max 100)
- **Returns:** Paginated results with metadata (total count, current page, total pages, has next page)
- **Each bill includes:** Number, type, title, sponsor, intro date, last action date, status, summary excerpt

**Filtering Logic:**
- All filters use AND logic
- Congress number → bills from that session
- Chamber → H.R./H.J.Res (House) or S./S.J.Res (Senate)
- Topics → bills tagged with categories
- Status → bills in specific stages
- Optimize with database indexes

**Search:**
- Full-text search across titles, summaries, sponsor names
- Use database full-text search or search engine
- Rank by relevance when active

**Pagination:**
- Offset-based or cursor-based (performance-dependent)
- Return metadata with every response

**2. Data Import Service:**
- Fetch bills from Congress.gov API (current Congress)
- Parse API responses (paginated results)
- Store/update bills in database
- **Incremental updates:** Check if bill exists → update if changed (not recreate)
- Parse actions → determine status (introduced, in committee, passed House/Senate, enacted, vetoed)
- Extract sponsor info
- Map subjects to topic categories

**Congress.gov API Integration:**
- Requires API key (env variable)
- Implements rate limiting awareness
- Handles failures with retries + exponential backoff
- Logs all calls for debugging
- Parses nested JSON (bills, actions, sponsors, subjects)

**Status Determination:**
- Analyze action sequence:
  - Introduced (filed)
  - In committee (referred)
  - Passed House/Senate
  - Sent to President (enrolled)
  - Enacted (signed)
  - Vetoed
- Store calculated status

**Topic Categorization:**
- Map Congress.gov subject tags → broader categories (Healthcare, Environment, Economy, etc.)
- Use topics table + bill_topics junction table

**Automated Scheduling:**
- **During sessions:** Daily imports
- **During recesses:** Weekly imports
- Log import runs (counts: fetched, created, updated)
- Alert on failures or stale data

**Database Schema:**
- Bills table: number, type, Congress, title, summary, intro date, last action date, status, sponsor ID, text
- Bill actions: bill ID, date, text, type
- Bill topics junction: bill ID, topic ID
- Indexes on: Congress, chamber, status, topic IDs, dates

**Caching:**
- Default bills list (current Congress, no filters): 15-30 min
- Individual bill details: 1-2 hours
- Invalidate on new imports
- Cache headers in API responses

**Error Handling:**
- Congress.gov unavailable → log failure, retry later
- Database errors → appropriate error responses
- Invalid filters → 400 with clear messages
- Unexpected → log details, return 500

**Testing:**
- API with various filter combinations
- Congress/chamber/topic/status filtering
- Search with keywords
- Sorting options
- Pagination (multiple pages, no overlap)
- Import service with real Congress.gov API
- Incremental updates (no duplicates)
- Status calculation (bills in various stages)
- Performance: Large result sets <500ms
- Caching (identical requests faster)

**Dependencies:**
- Congress.gov API key
- Database with indexes
- Scheduled job system
- Redis for caching

**Definition of Done:**
- [ ] Code merged to main
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] Import successfully fetches/stores bills
- [ ] Database schema + indexes created
- [ ] API docs updated
- [ ] Scheduled import configured
- [ ] TL approval
- [ ] Deployed to staging
- [ ] Performance testing passes

---

### EGP-013: [TL] Define Bills Data Model and Import Schedule
**Assignee:** Tech Lead | **Story Points:** 2 | **Hours:** 8 | **Sprint:** 0

**Description:**
Design bills database schema, status calculation logic, import process, and Congress.gov API integration specs.

**Documentation Required:**

**1. Bills Data Model:**
- **Core bills table:** ID, bill number (e.g., "H.R. 1"), type, Congress number, title, summary, intro date, last action date, status, sponsor ID, full text
- **Related tables:**
  - Bill actions: bill ID (FK), action date, action text, action type
  - Bill topics (junction): bill ID, topic ID
  - Topics: ID, category name (Healthcare, Environment, etc.)
  - Sponsors: Links to members of Congress
  - Bill text versions (multiple versions as amended)
- **Relationships:** Bills → sponsor (1:1), Bills → actions (1:many), Bills → topics (many:many)
- **Constraints:** Unique (bill number + Congress), FKs with cascade rules, validation checks
- **Indexes:** Congress, chamber, status, topic IDs, dates, sponsor ID

**2. Status Calculation Logic:**
- **Algorithm:** Analyze action sequence/types
- **Status progression:**
  - Introduced (filed)
  - Referred (to committee)
  - Reported (committee done)
  - Passed House
  - Passed Senate
  - Resolving Differences (conference committee)
  - To President (enrolled)
  - Enacted (signed)
  - Vetoed
  - Override Attempt
  - Became Law (veto overridden)
- Document action keywords triggering each status
- Provide example action sequences → resulting statuses

**3. Topic Categorization Mapping:**
- Map Congress.gov subject tags → our categories
- Example: "Healthcare" ← Medicare, Medicaid, health insurance, hospitals
- Example: "Environment" ← climate change, conservation, pollution, endangered species
- Complete mapping table

**4. Import Process Specification:**
- **Workflow:** Fetch from API → parse → calculate status → map topics → extract sponsors → store/update → log stats → alert on failure
- Error handling per step
- Retry logic for temporary failures
- Handle bills no longer in API
- Data quality validation checks

**5. Import Schedule:**
- **Active sessions (Jan-Dec, excluding recesses):** Daily
- **Recesses:** Weekly
- **Special handling:** End-of-session deadlines (increased activity)
- **Time:** Overnight during low traffic
- **Monitoring:** Alert if fail or data stale

**6. Congress.gov API Integration:**
- Base URL, auth (API key), endpoints for bill data
- Pagination params, filtering options, response format
- Rate limits (~1000/hour)
- Error responses
- Nested response structure (where to find bill number, title, actions, sponsors, subjects)
- Example requests/responses
- API quirks/gotchas

**7. Data Quality Assurance:**
- **Validation rules:**
  - Valid bill numbers
  - Congress 100-150 range
  - Valid intro dates
  - At least one action
  - Valid sponsor IDs (exist in members table)
- Post-import integrity checks
- Handling malformed API data
- Logging data issues

**8. Performance Optimization:**
- **Index strategy:** Congress, chamber, status, dates, sponsor ID
- **Query optimization:** Covering indexes, avoid SELECT *, appropriate JOINs
- Slow query alert thresholds

**9. Monitoring & Alerts:**
- **Monitor:** Import success/fail, duration, count imported/updated, API response times, query performance, cache hit rates
- **Alert on:** Import fails, duration exceeds threshold, no bills imported, slow queries, low cache hit rate

**Deliverables:**
- Data model spec with ER diagrams
- Status calculation reference (decision tree)
- Import process flowchart
- Congress.gov API integration guide (examples)
- Monitoring/operations guide (troubleshooting, checking freshness, responding to alerts)

**Testing:**
- Review schema with backend dev
- Review status logic with examples
- Review import schedule
- Congress.gov API integration walkthrough
- Review monitoring config

**Dependencies:**
- Congress.gov API access + key
- Understanding of congressional legislative process
- Database platform capabilities (indexing, full-text search)

**Definition of Done:**
- [ ] Data model spec + diagrams complete
- [ ] Status calculation documented with examples
- [ ] Import process documented (flowcharts)
- [ ] Congress.gov API guide completed
- [ ] Monitoring guide created
- [ ] Reviewed with backend dev
- [ ] Team walkthrough completed
- [ ] Docs published to wiki

---

### EGP-014: [PM] QA Bills Browse and Document User Guides
**Assignee:** Project Manager | **Story Points:** 2 | **Hours:** 8 | **Sprint:** 0

**Description:**
Test bills browse, verify data accuracy against Congress.gov, create user guides.

**Testing Scope:**
- **Filters:** Each individually (Congress, chamber, topics, status), combined (all criteria together), clear filters
- **Sorting:** Each option (newest, last action, bill number, relevance)
- **Search:** Keywords (healthcare, climate), sponsor names, bill numbers, no results, clear search
- **Data accuracy spot checks:** Pick 5-10 random bills, compare with Congress.gov (bill number, title, sponsor, intro date, status, summary)
- **Navigation:** Click bills → detail page, browser back → return with filters preserved
- **Pagination/infinite scroll:** Load additional bills smoothly, no duplicates
- **Empty states:** No results → helpful message + "Clear filters"
- **Performance:** Page load time, filter response time, 3G connection <3-4s, smooth scrolling
- **Cross-browser:** Chrome, Firefox, Safari, Edge
- **Mobile:** 375px and 768px (filters accessible, readable list, smooth scrolling, bill detail nav works)
- **Accessibility:** Keyboard nav (Tab through filters), activate with Space/Enter, screen reader (filters labeled, bill info read correctly, status badges announced)
- **Edge cases:** Long titles, many cosponsors, lengthy summaries, rapid filter changes

**Defect Documentation:**
- Severity (P0-P4), component, reproduction steps, expected vs actual, browser, device, screenshots
- P0: Prevents browsing, P1: Major functionality broken, P2: Minor issues, P3: Cosmetic

**User Guides:**
- **"How to Find Bills":** Use filters, search, sort, navigate to details (with screenshots)
- **"Understanding Bill Status":** What each status means, how bills progress through Congress
- **"Bill Topics Explained":** Describe each topic category to help filtering

**Data Freshness:**
- Check last import run
- Verify recent bills appear (during active sessions)
- Alert team if data stale

**Deliverables:**
- Test results spreadsheet (scenario, expected/actual, pass/fail, browser, device, severity, notes)
- Summary: Total tests, pass rate, defects by severity
- Defect reports in JIRA
- User guides with screenshots (for help center)
- Internal ops guide (verifying freshness, responding to user reports of missing/incorrect bills)

**Dependencies:**
- Bills browse on staging
- Bills API functional with real data
- Data import populated bills
- Bill detail pages

**Definition of Done:**
- [ ] All scenarios tested and documented
- [ ] Data accuracy verified (spot checks vs Congress.gov)
- [ ] No P0/P1 defects
- [ ] User guides created with screenshots
- [ ] Internal ops guide completed
- [ ] QA sign-off

---

## INFRA: Infrastructure & Deployment - 10 Story Points

### EGP-015: [TL] Set Up Development and Production Environments
**Assignee:** Tech Lead | **Story Points:** 4 | **Hours:** 16 | **Sprint:** 0

**Description:**
Establish complete dev, staging, and production infrastructure with CI/CD, monitoring, and security.

**Core Requirements:**

**1. Environment Structure:**
- **Three environments:** Dev (local/dev server testing), Staging (QA/pre-release), Production (live users)
- Each has own: Database, caching service, Auth0 tenant, deployed app instance
- Similar enough for consistency, isolated enough for safety

**2. Cloud Infrastructure:**
- Choose provider (AWS, GCP, Azure)
- Set up: Web app/API hosting, compute resources (containers/serverless/VMs), auto-scaling, load balancing, storage
- Infrastructure as code for repeatability

**3. Databases:**
- PostgreSQL for each environment
- Appropriate sizing (prod > staging > dev)
- Automated backups (prod: point-in-time recovery, 30-day retention)
- Access controls (app-only access), SSL connections, connection pooling
- Migration process for schema changes

**4. Caching:**
- Redis instances for each environment
- Appropriate memory sizes, access controls, eviction policies
- Document cache key patterns and TTL strategies

**5. Domain & SSL:**
- Register/configure domain names
- DNS records pointing to infrastructure
- SSL/TLS certificates (Let's Encrypt or provider)
- Auto-renewal, HTTP→HTTPS redirect, www vs non-www

**6. Auth0:**
- Tenants for each environment (dev, staging, prod)
- Apps with correct callback URLs per environment
- Email templates, social connections
- Secure credential storage

**7. CI/CD Pipeline:**
- **Continuous integration:** Run tests on every commit
- **Continuous deployment:**
  - Dev: Auto-deploy on development branch merge
  - Staging: Auto-deploy on main branch merge
  - Prod: Manual approval after staging validation
- Pipeline runs: Linting, unit tests, integration tests, build
- Notifications on success/failure

**8. Secrets Management:**
- Secure storage (cloud secrets manager or HashiCorp Vault)
- Never commit to repos
- Devs: Secure access to dev secrets
- Prod: Restricted to necessary personnel + automation

**9. Monitoring & Logging:**
- Performance monitoring (response times, error rates, system health)
- Centralized logging (searchable)
- Log retention policies
- Dashboards with key metrics
- Alerts: App down, error spike, DB issues, high response times, low disk space

**10. Alerting & On-Call:**
- Severity levels: Critical (page on-call), warnings (email), info (Slack)
- Document on-call rotation, escalation procedures
- Runbooks for common alerts

**11. Security:**
- Firewalls (restrict ports/IPs)
- WAF (protect against attacks)
- DDoS protection
- API rate limiting
- Security headers on HTTP responses
- Audit logging for sensitive operations
- Vulnerability scanning
- Database: App-only access (no direct external)

**12. Backup & Disaster Recovery:**
- Daily database backups (30-day retention)
- Test restoration process
- Document DR procedures: Restore from backups, failover to backup infrastructure, RTO/RPO targets
- Store backups in geographically separate location

**Documentation:**
- Architecture diagrams (all components + connections)
- Environment specs (dev, staging, prod)
- Deployment procedures (step-by-step)
- Secrets management procedures
- Monitoring/alerting config
- Disaster recovery runbooks
- Access control docs

**Testing:**
- Deploy test app to each environment
- Database connectivity from app
- Auth flows in each environment (correct Auth0 tenants)
- Trigger CI/CD pipeline (all steps + deploy)
- Monitoring dashboards show data
- Test alerts route correctly
- Backup restoration test
- SSL/HTTPS config
- Auto-scaling simulation
- Security review (firewalls, access controls, secrets)

**Deliverables:**
- Complete infrastructure (all 3 environments)
- Databases with backups
- Caching services
- Working CI/CD pipeline
- Monitoring/alerting configured
- Comprehensive docs
- Runbooks (deployment, rollback, scaling, incident response)
- Architecture diagrams
- Access control docs

**Dependencies:**
- Cloud provider account with billing
- Domain name
- Auth0 account
- GitHub (or similar) for CI/CD
- Team members for access provisioning

**Definition of Done:**
- [ ] All 3 environments operational
- [ ] Databases with backups (restoration tested)
- [ ] CI/CD deploying to all environments
- [ ] Monitoring showing data
- [ ] Alerting tested and routing correctly
- [ ] SSL configured + auto-renewing
- [ ] Infrastructure docs published
- [ ] Runbooks created
- [ ] Team walkthrough completed
- [ ] Security review passed

---

### EGP-016: [BE] Set Up Database Schema and Migrations
**Assignee:** Backend Developer | **Story Points:** 3 | **Hours:** 12 | **Sprint:** 0

**Description:**
Create database schema for all tables, implement migrations, seed data, document schema.

**Core Requirements:**

**1. Core Tables:**
- **Users:** ID, Auth0 ID, email, first/last name, address (street, city, state, ZIP), districts (congressional, state house, state senate), demographics (birth year, gender), political affiliation, education, profession, military service, constituent description, profile image URL, membership tier, account status, email verified, timestamps
- **Organizations:** Name, description, website, logo URL, mission, contact info, verification status, timestamps
- **Campaigns:** Title, description, goal, org ID, bill IDs, status, visibility, start/end dates, message template, timestamps
- **Members (of Congress):** ID, bioguide ID, first/last name, party, state, district, chamber, term dates, office address, phone, website, social media, committees, timestamps
- **Bills:** Number, type, Congress, title, summary, full text, intro date, last action date, status, sponsor ID, topics, timestamps
- **Bill actions:** Bill ID (FK), action date, text, type
- **Bill topics (junction):** Bill ID, topic ID
- **User messages:** User ID, recipient (member) ID, campaign ID, bill ID, subject, body, send date, delivery status, session token (for anonymous)
- **Message templates:** Name, subject, body (with placeholders), org ID, timestamps
- **User interests:** User ID, topic ID
- **User followed entities:** Bills, members, orgs, campaigns (separate junction tables)
- **Subscriptions:** User ID, tier, status, payment method ref, billing dates, amount, timestamps

**2. Constraints & Relationships:**
- Foreign keys (users→messages, orgs→campaigns, bills→members as sponsors)
- Cascade rules for deletes/updates
- Unique constraints (bill number + Congress)
- Check constraints (ZIP format, birth year ranges)
- Referential integrity

**3. Indexes:**
- All FK columns
- Composite indexes (common filter combos like bills by Congress + status)
- Date fields for sorting
- Full-text search indexes (bill titles, summaries)
- Balance: Too many slow writes

**4. Migration Framework:**
- Use tool (Flyway, Liquibase, ORM migration)
- Numbered and named (001_initial_schema.sql, 002_add_user_prefs.sql)
- Run in order, track which applied
- Idempotent where possible
- "Up" migrations (apply) + "down" migrations (revert)
- Version control with code

**5. Initial Migration Scripts:**
- PostgreSQL SQL syntax
- CREATE TABLE (all columns, types, constraints)
- CREATE INDEX
- Foreign key definitions
- Comments for complex constraints
- Test locally

**6. Seed Data:**
- Realistic test data for dev/staging
- Sample users (various profiles)
- Sample orgs and campaigns
- Subset of real bills (100-200 from current Congress)
- Sample messages (show activity)
- Various subscription states
- Clearly marked as test data
- Repeatable (can run multiple times to refresh)

**7. Data Types:**
- UUID for IDs (or serial integers)
- VARCHAR (appropriate lengths)
- TEXT (long-form content)
- INTEGER/BIGINT (numeric IDs, counts)
- BOOLEAN (flags)
- TIMESTAMP (with timezone)
- ENUM (fixed value sets like status)
- Defaults: NOW() for timestamps, false for booleans, 'active' for status

**8. Schema Documentation:**
- Each table: Purpose, columns (types/constraints), relationships, indexes
- ER diagrams (visual relationships)
- Complex logic (status calculations, denormalized data)
- Naming conventions
- Easy-to-reference format

**9. Migration Procedures:**
- How to create new migrations
- Test locally before staging/prod
- Apply to each environment
- Rollback procedures
- Data migrations (transforming existing data)

**Testing:**
- Initial migrations on clean database → all tables created
- Constraints work (insert invalid data → rejected)
- Foreign keys work (insert refs to non-existent records → rejected)
- Indexes created (check metadata/explain plans)
- Seed data creates realistic test data
- Complete migration process (wipe DB, re-run all)
- Rollback migrations (apply then revert)
- Review with TL/team

**Deliverables:**
- Complete schema (tables, columns, constraints, indexes)
- Migration framework configured
- Initial migration scripts
- Seed data scripts
- Schema docs with ER diagrams
- Migration procedures docs

**Dependencies:**
- PostgreSQL in all environments
- Migration tool selected
- Requirements documented for all entities
- TL schema design review

**Definition of Done:**
- [ ] All tables created (proper columns, types, constraints)
- [ ] Migration framework functional
- [ ] Initial migrations apply to clean DB
- [ ] Seed data creates realistic test data
- [ ] Schema docs + ER diagrams complete
- [ ] Migration procedures documented
- [ ] TL review and approval
- [ ] Migrations applied to dev and staging
- [ ] Code merged to main

---

### EGP-017: [FE] Set Up Frontend Build Pipeline and Component Library
**Assignee:** Frontend Developer | **Story Points:** 2 | **Hours:** 8 | **Sprint:** 0

**Description:**
Frontend build system, code quality tools, testing, component library, styling, routing, state management.

**Core Requirements:**

**1. Build System:**
- Framework: Next.js, CRA, Vite, or similar
- TypeScript (if using typed JS)
- Module bundling, transpilation
- Environment variables (dev, staging, prod)
- Code splitting (separate bundles by page/feature)
- Tree shaking (eliminate unused code)
- Minification + compression (production)
- Source maps (debugging)

**2. Development Server:**
- Hot module reloading (instant code changes)
- Proxy config (forward API requests to backend)
- Specific port (e.g., 3000)
- HTTPS (if needed to match prod)
- Handle SPA routing

**3. Code Quality:**
- ESLint (catch errors, enforce style)
- Prettier (auto formatting)
- Pre-commit hooks (Husky: run lint/tests before commit)
- Editor integration (auto lint/format)
- Rules: Unused vars, console statements, import ordering, consistent naming

**4. Testing:**
- Jest or Vitest (unit testing)
- React Testing Library (component testing)
- Coverage reporting
- Example tests (how to test components)
- Watch mode (re-run on changes)
- CI integration (run on every commit)
- Coverage thresholds

**5. Component Library:**
- **Foundational components:** Button (primary/secondary/danger), Input (text/email/password, validation states), Select, Checkbox, Radio, TextArea, Modal/Dialog, Card, Badge, Alert/Toast, Loading spinners, Form wrapper, Link/Button combo
- Each: Props for customization, consistent styling, accessible markup (ARIA), TypeScript types (if applicable)

**6. Styling System:**
- Approach: CSS modules, styled-components, Tailwind, or similar
- **Design tokens:**
  - Colors (primary, secondary, success, warning, danger, neutral shades)
  - Typography (families, sizes, weights, line heights)
  - Spacing scale (4px, 8px, 16px, 24px, 32px, etc.)
  - Border radius values
  - Shadow definitions
- Utility classes/mixins for common patterns
- Responsive breakpoints (mobile, tablet, desktop)
- Document system (devs use consistent values)

**7. Routing:**
- React Router, Next.js routing, or framework built-in
- Initial routes: Home, login, signup, dashboard, bills browse, bill detail, profile, etc.
- Protected routes (require auth)
- 404 handling
- Route transitions (if desired)
- Document patterns, how to add new routes

**8. State Management:**
- Redux, Zustand, Jotai, or React Context
- Stores/contexts: Auth state, user profile, app settings
- Patterns: Loading states, error handling, data fetching
- Dev tools (debugging)
- Document patterns, how to add state

**9. API Integration:**
- API client module (all backend communication)
- Axios, fetch, or similar: Base URL, auth headers, interceptors, timeout, error handling
- Wrapper functions for common operations
- Patterns: Loading states, errors in components
- Document patterns

**10. Authentication:**
- Auth0 SDK or similar
- Auth provider wrapper component
- Auth state management
- Protected route wrapper (redirect unauth to login)
- Callback handler (OAuth redirects)
- Hooks/utils for current user info
- Test end-to-end

**11. Build Optimization:**
- Production: Optimized bundles
- Code splitting by route (each page loads necessary code only)
- Lazy loading (heavy components)
- Image optimization (if supported)
- Caching headers (static assets)
- Bundle analysis (identify large dependencies)
- Goal: <200KB gzipped initial bundle

**12. Environment Config:**
- .env files (local dev, staging, prod)
- Values: API URLs, Auth0 config, feature flags, etc.
- Document variables needed, how to set
- Never commit sensitive values

**13. Documentation:**
- Run dev server
- Run tests
- Build for production
- Coding standards/style guide
- Component library usage (examples)
- Styling system reference
- Routing patterns
- State management patterns
- API integration patterns
- How to add new features
- Keep in markdown files in repo

**Testing:**
- Dev server + hot reload (make change → instant)
- Linting catches issues
- Tests pass
- Production build (reasonable bundle sizes)
- All components (Storybook or similar)
- Auth flow (login → protected routes)
- Responsive design (mobile, tablet, desktop)
- Deploy to staging

**Deliverables:**
- Build config (dev and prod modes)
- Code quality tools configured
- Testing framework + example tests
- Component library (foundational components)
- Styling system documented
- Routing configured
- State management set up
- API integration layer
- Developer docs

**Dependencies:**
- Frontend framework + dependencies installed
- Auth0 config for frontend
- Backend API for integration testing
- Design specs for component styling

**Definition of Done:**
- [ ] Build system configured + optimized
- [ ] Dev server with hot reload
- [ ] Linting/formatting working
- [ ] Testing framework + example tests
- [ ] Component library created
- [ ] Styling system documented
- [ ] Routing configured
- [ ] State management set up
- [ ] API integration layer created
- [ ] Auth integration working
- [ ] Developer docs complete
- [ ] Code merged to main
- [ ] Team walkthrough completed

---

### EGP-018: [PM] Create Sprint 0 Project Plan and Stakeholder Communication
**Assignee:** Project Manager | **Story Points:** 1 | **Hours:** 4 | **Sprint:** 0

**Description:**
Sprint 0 planning, JIRA setup, stakeholder communication, meetings, risk tracking, success criteria.

**Core Requirements:**

**1. Sprint 0 Plan Document:**
- Sprint overview (duration, dates, team composition)
- Sprint goal (establish auth + core infrastructure)
- User stories (US-017 Create Account, US-018 Login/Reset, US-019 Update Profile, US-004 Browse Bills, INFRA)
- Success criteria per story
- Task breakdown by role (FE, BE, TL, PM)
- Hour estimates + allocation
- Timeline with milestones
- Dependencies between tasks
- Risks + mitigation
- Communication plan

**2. JIRA Setup:**
- Create/configure JIRA project
- Create all Sprint 0 tasks as tickets: Summary, description, assignee, story points, hours, epic link, sprint, priority
- Organize into epics (per user story)
- Configure board views (track progress)
- Set up workflows
- Create filters (by assignee, status, epic)
- Train team if needed

**3. Stakeholder Communication Plan:**
- Identify stakeholders (exec sponsor, product owner, dept leads, investors)
- Per group: Info needed (high-level vs detailed), format (email, dashboard, presentation), frequency (daily, weekly, end of sprint)
- Communication templates
- Schedule recurring meetings/reports

**4. Status Reporting:**
- Template: Accomplishments this week, planned next week, blockers/risks, metrics (story points completed, bugs found/fixed, test coverage), asks
- Distribution list + schedule
- Dashboard (if stakeholders prefer visual)

**5. Team Meeting Cadence:**
- **Daily standup:** Consistent time (15 min), shares: What I did yesterday, doing today, blockers
- **Sprint review:** End of sprint (demo to stakeholders, 1 hour)
- **Sprint retrospective:** After review (what went well, what didn't, action items, 1 hour)
- **Backlog refinement:** Plan Sprint 1
- Calendar invites with agendas

**6. Meeting Templates:**
- **Sprint review agenda:** User story demos, acceptance criteria verification, known issues, next sprint preview
- **Retrospective template:** Start/Stop/Continue or What Went Well/Needs Improvement/Action Items
- **Standup template:** If async

**7. Risk Management:**
- **Potential risks:**
  - Auth0 config issues → delays auth
  - External API (Congress.gov, Geocodio) integration problems
  - Team members unavailable
  - Unclear requirements → rework
  - Technical blockers (unfamiliar tech)
  - Testing reveals major issues → significant rework
- Per risk: Likelihood (low/med/high), impact (low/med/high), mitigation (how to prevent), response plan (what to do if happens)

**8. Success Criteria:**
- All user stories completed + accepted by PO
- No P0 or P1 bugs remaining
- Auth works end-to-end (signup, login)
- Users can update profiles (location detection works)
- Bills browsable (filtering, search)
- All infrastructure deployed (dev, staging, prod)
- Test coverage ≥80%
- Documentation complete
- Team velocity established (for future planning)

**9. Sprint Kickoff Meeting:**
- Schedule + conduct with entire team
- Review goal (everyone understands)
- Walk through stories + acceptance criteria (clarify requirements)
- Review task breakdown (everyone knows assignments)
- Discuss timeline + milestones
- Review dependencies (plan coordination)
- Identify questions/concerns
- Get team commitment
- Document action items

**10. Resource Allocation:**
- Total hours estimated (sum all tasks)
- Verify vs team capacity (people × work days × hours/day)
- Flag if estimates exceed capacity
- Adjust scope/timeline if needed
- Buffer for unexpected issues/rework

**11. Dependency Tracking:**
- Matrix: Which tasks depend on others
- Example: FE signup depends on BE user creation + Auth0 config
- Ensure clear to all team members
- Monitor blockers, escalate if needed

**12. Metrics:**
- Track during sprint: Story points by day (burndown), tasks by status (To Do, In Progress, Done), bugs found/fixed by day, code review turnaround, test coverage %, deployment success rate
- Set up tracking, review in standups/status reports

**13. Documentation:**
- Central location (Confluence, Notion, shared drive)
- Folders: Sprint plan, meeting notes, status reports, retro action items, team resources
- All team members have access

**14. Stakeholder Alignment:**
- Meet before sprint (align on goals/expectations)
- Clarify acceptance criteria + definition of done per story
- Agree on communication frequency/format
- Set sprint review attendance expectations
- Address concerns upfront

**15. Celebration:**
- Plan team celebration if goals achieved (builds morale, recognizes work)
- Options: Team lunch, happy hour, token of appreciation

**Testing:**
- All Sprint 0 tasks in JIRA (correct details)
- Sprint kickoff conducted (team aligned)
- First status report sent (stakeholders received)
- First standup (format works)
- Sprint plan reviewed with TL (realistic)
- All meeting invites sent/accepted

**Deliverables:**
- Comprehensive Sprint 0 plan doc
- JIRA configured with all tasks
- Stakeholder communication plan
- Meeting schedule + invites
- Status report template
- Risk log with mitigations
- Success criteria doc
- Sprint kickoff meeting notes

**Dependencies:**
- JIRA access
- Calendar access (all team)
- Stakeholder contact info
- Understanding of all Sprint 0 user stories/requirements

**Definition of Done:**
- [ ] Sprint 0 plan complete + reviewed
- [ ] All tasks in JIRA (correct details)
- [ ] Stakeholder communication plan established
- [ ] All recurring meetings scheduled
- [ ] Sprint kickoff conducted + notes documented
- [ ] Risk log created + reviewed
- [ ] Success criteria defined + agreed upon
- [ ] First status report sent
- [ ] Team aligned + ready to start
