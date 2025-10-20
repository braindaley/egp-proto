# JIRA Tasks - All Sprints (0-8)

**Project Duration:** Weeks 1-20 (Sprints 0-8)
**Total Story Points:** 367
**Total Hours:** 1,808

This document contains all JIRA tickets for Sprints 0 through 8 of the advocacy platform development project.

---

## Sprint 0: Foundation & Authentication (Weeks 1-2)

**Sprint Goal:** Establish authentication, basic infrastructure, and core user flows
**Total Story Points:** 40

### US-017: Create Account (Post-Message Flow) - 9 Story Points

#### EGP-001: [FE] Implement Signup Flow and Email Verification UI
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

#### EGP-002: [BE] Implement User Creation and Anonymous Session Linking
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

#### EGP-003: [TL] Configure Auth0 and Define Security Posture
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

#### EGP-004: [PM] QA Testing and Support Documentation for Signup
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

### US-018: Login & Password Reset - 5 Story Points

#### EGP-005: [FE] Implement Login and Password Reset UI
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

#### EGP-006: [BE] Implement Session Validation and Password Reset API
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

#### EGP-007: [TL] Define Session and Redirect Rules
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

#### EGP-008: [PM] QA Login Flows and Release Notes
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

### US-019: Update Profile & Set Location - 5 Story Points

#### EGP-009: [FE] Build Profile Form and Location Detection UI
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

#### EGP-010: [BE] Implement Profile Update and District Lookup Endpoints
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

### US-004: View Federal Bill Details (Basic) - 8 Story Points

#### EGP-011: [FE] Build Federal Bill Detail Page
**Assignee:** Frontend Developer | **Story Points:** 3 | **Hours:** 12 | **Sprint:** 0

**Description:**
Complete bill detail page showing all legislative information with actions.

**Core Requirements:**
- **Header section:**
  - Bill number (large, prominent: "H.R. 1" or "S. 442")
  - Full official title
  - Status badge (color-coded by stage)
  - Introduction date
  - Sponsor (name, photo, party, state, district - linkable)

- **Latest Action card:**
  - Most recent action date and description
  - Prominent placement at top

- **Details sections:**
  - **Summary:** Official summary (if available), plain language explanation
  - **Subjects/Topics:** Tags for policy categories (Healthcare, Environment, etc.)
  - **Full Text Links:** Links to bill text versions (Introduced, Engrossed, Enrolled, etc.)
  - **Actions Timeline:** Chronological list of all actions with dates
  - **Cosponsors:** Count and list (with pagination if many)

- **User actions:**
  - "Watch Bill" button (signed-in users, heart icon, toggle on/off)
  - "Voice Your Opinion" button → navigate to message compose with bill context
  - Guest users clicking Watch → redirect to login with returnTo

- **Loading & Error States:**
  - Skeleton loaders for each section
  - Error state: "Unable to load bill. Please try again." with Retry button
  - 404 state: "Bill not found" with link back to browse

- **Related Content:**
  - Active campaigns related to this bill
  - Similar bills (if available)

**Mobile:**
- Stack sections vertically
- Full-width cards
- Sponsor photo smaller
- Actions list scrollable if long
- Touch targets ≥44px

**Testing:**
- Valid bill ID → all sections render with correct data
- Guest clicks Watch → redirected to login
- Signed-in user clicks Watch → toggles on/off, persists after reload
- Voice Opinion → navigates to compose with bill prefilled
- Invalid bill ID → 404 error page
- API failure → error state with retry
- Long title/summary → proper wrapping
- Many cosponsors → pagination works
- Mobile at 375px
- Keyboard navigation

**Dependencies:**
- Backend: Bill detail endpoint
- Backend: Watch/unwatch endpoints
- Message compose page
- Login page with returnTo support

**Definition of Done:**
- [ ] Code merged to main
- [ ] All sections render correctly
- [ ] Watch functionality works
- [ ] Error states handle gracefully
- [ ] TL approval
- [ ] Mobile tested (375px, 768px)
- [ ] Accessibility audit passes

---

#### EGP-012: [BE] Implement Bill Detail API with Congress.gov Integration
**Assignee:** Backend Developer | **Story Points:** 3 | **Hours:** 12 | **Sprint:** 0

**Description:**
Bill detail endpoint with Congress.gov data fetching, caching, and fallback.

**Core Requirements:**

**1. Bill Detail Endpoint:**
- Accepts: Congress number, bill type (hr/s/hjres/sjres), bill number
- Returns normalized bill object with:
  - Bill metadata (number, type, Congress, title, intro date)
  - Latest action (date, description)
  - Status (calculated from actions)
  - Sponsor (member ID, name, party, state, district, photo URL)
  - Summary (official CRS summary if available)
  - Subjects/policy tags
  - Full text links (all versions: Introduced, Engrossed, Enrolled, etc.)
  - Actions timeline (chronological list)
  - Cosponsors (IDs and count)
  - Related campaigns (from our database)

**2. Congress.gov Integration:**
- Fetch bill data from Congress.gov API
- Parse nested JSON response structure
- Extract all required fields
- Handle missing optional fields gracefully
- Determine status from action sequence

**3. Caching Strategy:**
- Cache successful responses in Redis
- TTL: 1 hour for active bills, 24 hours for enacted/vetoed bills
- Cache key: `bill:{congress}:{type}:{number}`
- Return cache-control headers to frontend

**4. Fallback Behavior:**
- Primary: Fetch fresh from Congress.gov API
- If API unavailable: Return stale cache if exists (with `X-From-Cache: true` header)
- If no cache: Return 503 with clear message

**5. Status Calculation:**
- Analyze action sequence to determine current status:
  - Introduced
  - Referred to Committee
  - Reported by Committee
  - Passed House
  - Passed Senate
  - Resolving Differences
  - To President
  - Enacted
  - Vetoed
- Store calculated status in database for future queries

**Error Handling:**
- Invalid bill ID format → 400
- Bill not found (Congress.gov returns 404) → 404
- Congress.gov timeout/error → Try cache fallback → 503 if no cache
- Database errors → Log and return 500
- Unexpected errors → Log details, return 500

**Testing:**
- Valid bill ID → correct data returned
- Second request within TTL → served from cache
- Congress.gov unavailable → returns cached data with header
- Non-existent bill → 404
- Invalid ID format → 400
- Status calculation: Bills at various stages → correct status
- End-to-end: Frontend → API → Congress.gov → cache → response
- Cache expiration works correctly
- Load test: Concurrent requests for same bill

**Dependencies:**
- Congress.gov API key
- Redis for caching
- Members of Congress data (for sponsor lookup)
- Bills table in database

**Definition of Done:**
- [ ] Code merged to main
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests with Congress.gov pass
- [ ] Caching verified
- [ ] Fallback behavior tested
- [ ] API docs updated
- [ ] TL approval
- [ ] Deployed to staging

---

#### EGP-013: [TL] Define Bill Data Caching and Fallback Strategy
**Assignee:** Tech Lead | **Story Points:** 2 | **Hours:** 8 | **Sprint:** 0

**Description:**
Document bill data architecture, caching strategy, sync cadence, and fallback behavior.

**Documentation Required:**

**1. Data Flow Architecture:**
- Congress.gov API → Our API → Cache → Frontend
- Diagram showing all components and data flow
- Cache-first vs API-first strategy decision
- When to invalidate cache

**2. Caching Strategy:**
- **TTL by bill status:**
  - Active bills (in committee, on floor): 1 hour
  - Enacted/vetoed bills: 24 hours
  - Historical bills (>2 congresses old): 7 days
- Cache keys format: `bill:{congress}:{type}:{number}`
- Cache headers returned to frontend
- Cache invalidation triggers

**3. Sync Cadence:**
- **Active Congress (current session):**
  - High-priority bills: Every 1 hour
  - Standard bills: Every 6 hours
  - All bills: Daily full sync
- **Previous Congress:**
  - Weekly sync for completeness
- **Older Congresses:**
  - On-demand only (no automatic sync)

**4. Fallback Behavior:**
- **Scenario 1: Congress.gov API timeout**
  - Try cache → Return cached data with indicator
  - No cache → Return 503 with retry-after hint
- **Scenario 2: Congress.gov API rate limited**
  - Serve from cache for all requests
  - Queue retry for after rate limit window
- **Scenario 3: Bill not found**
  - Check our database (might be deleted)
  - Return 404 with message
- **Scenario 4: Database unavailable**
  - Serve from cache if available
  - Otherwise return 503

**5. Error Handling:**
- Define HTTP status codes for each scenario
- User-facing error messages
- Logging requirements for debugging
- Alerting thresholds (e.g., >10% API failures)

**6. Performance Targets:**
- Bill detail page load: <500ms (P95)
- Cache hit rate: >80%
- Congress.gov API calls: <1000/hour
- Database query time: <100ms (P95)

**7. Monitoring:**
- Track: Cache hit rate, API response times, error rates, sync job success
- Dashboards for operational visibility
- Alerts for degraded performance

**Deliverables:**
- Data flow architecture diagram
- Caching strategy document (TTLs, keys, invalidation rules)
- Sync schedule specification
- Fallback behavior flowchart
- Error handling reference
- Performance targets and monitoring plan

**Testing:**
- Review architecture with backend dev
- Validate caching strategy with sample bills
- Test fallback scenarios manually
- Review monitoring dashboards

**Dependencies:**
- Congress.gov API documentation
- Redis capabilities
- Understanding of bill update frequency

**Definition of Done:**
- [ ] Architecture diagram complete
- [ ] Caching strategy documented
- [ ] Sync cadence specified
- [ ] Fallback behavior defined
- [ ] Error handling documented
- [ ] Performance targets set
- [ ] Monitoring plan created
- [ ] Team walkthrough completed
- [ ] Docs published to wiki

---

#### EGP-014: [PM] QA Bill Detail Page and Data Accuracy
**Assignee:** Project Manager | **Story Points:** 1 | **Hours:** 4 | **Sprint:** 0

**Description:**
Test bill detail page, verify data accuracy against Congress.gov, create user guides.

**Testing Scope:**
- **Data Accuracy:** Select 10 bills at various stages, compare all fields with Congress.gov (title, sponsor, intro date, latest action, status, summary, cosponsors)
- **Functionality:**
  - Valid bill loads completely
  - All sections render correctly
  - Links work (sponsor, bill text, related campaigns)
  - Watch button (signed-in and guest)
  - Voice Opinion navigation
- **Error Cases:**
  - Invalid bill ID → 404 page
  - API failure → error state with retry
  - Network timeout → graceful handling
- **Caching:** Second load faster (cache hit)
- **Cross-browser:** Chrome, Firefox, Safari, Edge
- **Mobile:** 375px and 768px (all sections readable, actions accessible)
- **Accessibility:** Keyboard nav, screen reader compatibility
- **Performance:** Page load <2s on 3G

**Data Validation Checks:**
- Bill number matches
- Title accurate (compare character-by-character)
- Sponsor correct (name, party, state)
- Latest action date and text match
- Status reflects actual legislative stage
- Summary matches (if available)
- Cosponsor count accurate
- Bill text links valid (click and verify)

**Defect Documentation:**
- Severity, component, reproduction steps, screenshots, data comparisons

**User Guides:**
- **"Understanding a Bill Page":** Walkthrough of each section, what it means
- **"How to Track Bills":** Using Watch feature, getting updates
- **"Bill Status Explained":** What each status means, typical timeline

**Deliverables:**
- Test results spreadsheet (test cases, data validation results)
- Data accuracy report (10 bill comparisons)
- Defect reports in JIRA
- User guides with annotated screenshots

**Dependencies:**
- Bill detail page on staging
- Backend API functional with real Congress.gov data
- Test accounts (signed-in and guest)

**Definition of Done:**
- [ ] All test cases executed
- [ ] 10 bills validated against Congress.gov
- [ ] Data accuracy ≥98% (minor formatting differences acceptable)
- [ ] No P0/P1 defects
- [ ] User guides created
- [ ] QA sign-off

---

### INFRA: Infrastructure Setup - 13 Story Points

#### EGP-015: [TL] Set Up Development and Production Environments
**Assignee:** Tech Lead | **Story Points:** 5 | **Hours:** 20 | **Sprint:** 0

**Description:**
Establish complete dev, staging, and production infrastructure with CI/CD, monitoring, and security.

**Core Requirements:**

**1. Environment Structure:**
- **Three environments:** Dev (local/dev server testing), Staging (QA/pre-release), Production (live users)
- Each has own: Database, caching service, Auth0 tenant, deployed app instance
- Similar enough for consistency, isolated enough for safety

**2. Cloud Infrastructure (Firebase/GCP):**
- Firebase project for each environment
- Cloud Firestore (main database)
- Firebase Authentication (integrates with Auth0)
- Cloud Functions (API/backend)
- Firebase Hosting (frontend)
- Cloud Storage (user uploads, static assets)
- Infrastructure as code (Firebase config files)

**3. Databases:**
- Firestore for each environment (dev, staging, prod)
- Security rules configured per environment
- Automated backups (prod: daily, 30-day retention)
- Indexes for common queries

**4. Caching:**
- Redis via Google Cloud Memorystore (or Upstash for serverless)
- Appropriate instance sizes per environment
- Access controls and VPC configuration

**5. Domain & SSL:**
- Domain registered (e.g., advocacyplatform.com)
- DNS configured (via Cloud DNS or domain registrar)
- SSL certificates (Firebase Hosting provides automatically)
- Custom domain for prod (www.advocacyplatform.com)
- Subdomains for staging (staging.advocacyplatform.com)

**6. Auth0:**
- Three tenants: dev, staging, prod
- Callback URLs configured per environment
- Social connections (Google)
- Email templates customized
- Secure secrets storage

**7. CI/CD Pipeline (GitHub Actions):**
- **Continuous Integration:**
  - Trigger on: Pull requests, pushes to main/dev
  - Steps: Install deps → Lint → Type check → Unit tests → Build
  - Status checks required before merge
- **Continuous Deployment:**
  - Dev: Auto-deploy to dev on dev branch merge
  - Staging: Auto-deploy to staging on main branch merge
  - Production: Manual approval required, triggered workflow
- Secrets managed via GitHub Secrets
- Deployment notifications (Slack/email)

**8. Secrets Management:**
- GitHub Secrets for CI/CD variables
- Firebase environment config for runtime secrets
- Never commit secrets to repo
- Access controls (who can view/modify)

**9. Monitoring & Logging:**
- Firebase Crashlytics for error tracking
- Google Cloud Logging for backend logs
- Custom dashboards (response times, error rates, active users)
- Log retention: 30 days (dev), 90 days (prod)

**10. Alerting:**
- Firebase Performance Monitoring alerts
- Cloud Monitoring alerts (high error rate, slow responses, quota approaching)
- Notification channels (email, Slack)
- On-call rotation documented

**11. Security:**
- Firestore security rules (row-level access control)
- Cloud Functions authentication checks
- API rate limiting (Firebase App Check or Cloud Armor)
- Security headers on responses
- Regular dependency audits

**12. Backup & Disaster Recovery:**
- Firestore daily exports to Cloud Storage
- Test restoration procedure quarterly
- Document RTO: 4 hours, RPO: 24 hours
- Backups stored in separate region

**Documentation:**
- Architecture diagram (Firebase services, external integrations)
- Environment specifications
- Deployment runbook
- Secrets management procedures
- Monitoring and alerting setup
- Disaster recovery plan

**Testing:**
- Deploy test app to all three environments
- Verify database connectivity
- Test auth flows (Auth0) in each environment
- Trigger CI/CD pipeline (full flow)
- Verify monitoring dashboards show data
- Test alert delivery
- Perform backup restoration test

**Deliverables:**
- Complete infrastructure (all 3 environments live)
- Working CI/CD pipeline
- Monitoring and alerting configured
- Comprehensive documentation
- Architecture diagram
- Runbooks (deploy, rollback, DR)

**Dependencies:**
- Google Cloud/Firebase account with billing
- Domain name
- Auth0 account
- GitHub repository
- Team member access provisioned

**Definition of Done:**
- [ ] All 3 environments operational
- [ ] Databases configured with backups
- [ ] CI/CD deploying successfully
- [ ] Monitoring showing data
- [ ] Alerts tested and routing correctly
- [ ] SSL configured
- [ ] Infrastructure docs published
- [ ] Runbooks created
- [ ] Team walkthrough completed
- [ ] Security review passed

---

#### EGP-016: [BE] Set Up Database Schema and Seeding
**Assignee:** Backend Developer | **Story Points:** 3 | **Hours:** 12 | **Sprint:** 0

**Description:**
Design and implement Firestore data model, security rules, indexes, and seed data for all environments.

**Core Requirements:**

**1. Collections & Document Structure:**
- **users:** userId (Auth0 ID), email, profile (name, address, districts), demographics, membership tier, timestamps
- **bills:** billId, congress, type, number, title, summary, sponsor, status, actions[], subjects[], timestamps
- **members:** memberId, bioguideId, name, party, state, district, chamber, contact info, timestamps
- **organizations:** orgId, name, description, logo, contact, verification status, timestamps
- **campaigns:** campaignId, orgId, title, description, billIds[], status, visibility, dates, timestamps
- **user_messages:** messageId, userId, recipientId (member), campaignId, billId, subject, body, status, timestamps
- **subscriptions:** subscriptionId, userId, tier, stripeCustomerId, status, billing dates, timestamps
- **user_interests:** userId + topicId (subcollection or separate)
- **user_follows:** userId + followedEntityId (bills, members, orgs - separate collections)

**2. Firestore Security Rules:**
- Users can read/write their own user document
- Users can read their own messages, subscriptions
- Public read: bills, members, organizations (published), campaigns (active)
- Org admins can write their org's campaigns
- Admin role can read all, write moderation actions
- Rules file versioned with code

**3. Indexes:**
- **bills:** Compound indexes for common queries:
  - (congress, status, introDate DESC)
  - (congress, subjects, introDate DESC)
  - (sponsor, introDate DESC)
- **campaigns:** (orgId, status, createdAt DESC)
- **user_messages:** (userId, sentDate DESC), (recipientId, sentDate DESC)
- Indexes defined in firestore.indexes.json

**4. Data Model Documentation:**
- ER-style diagram (collections and relationships)
- Field descriptions, types, validations
- Access patterns and query examples
- Denormalization decisions (e.g., embedding sponsor in bill doc)

**5. Seed Data Scripts:**
- Realistic test data for dev/staging
- Sample users (10-20 with various profiles)
- Sample organizations (5-10)
- Sample campaigns (10-15, various states)
- Sample bills (50-100 from current Congress)
- Sample messages (20-30)
- Idempotent scripts (can run multiple times safely)
- Uses Firebase Admin SDK

**6. Migration Strategy:**
- No traditional migrations (Firestore is schemaless)
- Document: How to evolve schema (add fields, restructure)
- Versioning strategy (version field in documents)
- Backfill scripts for schema changes

**Testing:**
- Deploy security rules to dev environment
- Test access controls (read/write as different roles)
- Verify indexes created
- Run seed scripts → data appears in Firestore console
- Test common queries with indexes
- Confirm security rules block unauthorized access
- Review data model with team

**Deliverables:**
- Firestore data model document with diagrams
- Security rules file (firestore.rules)
- Indexes file (firestore.indexes.json)
- Seed data scripts (TypeScript/JavaScript)
- Migration strategy document

**Dependencies:**
- Firebase projects created (all environments)
- Firebase Admin SDK credentials
- Understanding of all data entities

**Definition of Done:**
- [ ] Data model documented
- [ ] Security rules created and tested
- [ ] Indexes defined and deployed
- [ ] Seed scripts working in dev/staging
- [ ] Data model reviewed by team
- [ ] TL approval
- [ ] Security rules deployed to all environments
- [ ] Code merged to main

---

#### EGP-017: [FE] Set Up Frontend Build Pipeline and Component Library
**Assignee:** Frontend Developer | **Story Points:** 2 | **Hours:** 8 | **Sprint:** 0

**Description:**
Next.js project setup with TypeScript, Tailwind CSS, component library (shadcn/ui), and Firebase integration.

**Core Requirements:**

**1. Next.js Project Setup:**
- Next.js 14+ with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- ESLint and Prettier configured
- Git pre-commit hooks (Husky + lint-staged)

**2. Component Library (shadcn/ui):**
- Install shadcn/ui CLI
- Add base components:
  - Button (variants: default, destructive, outline, ghost, link)
  - Input (text, email, password)
  - Select, Checkbox, Radio, TextArea
  - Card, Badge, Alert, Toast
  - Dialog (Modal), Sheet (Slide-over)
  - Skeleton (loading states)
  - Form components (with react-hook-form + zod)
- Customize theme (colors, fonts, spacing)
- Document component usage

**3. Styling System:**
- Tailwind config with custom theme
- Design tokens: Colors (primary, secondary, success, warning, danger, neutral shades)
- Typography scale (font sizes, weights, line heights)
- Spacing scale (consistent padding/margins)
- Responsive breakpoints (sm, md, lg, xl, 2xl)
- Dark mode support (optional)

**4. Routing:**
- App Router structure:
  - / (home)
  - /auth/login, /auth/signup
  - /dashboard
  - /bills, /bill/[congress]/[type]/[number]
  - /profile
  - /organizations/[slug]
  - /campaigns/[id]
- Layouts (main layout, dashboard layout, auth layout)
- Loading and error UI files

**5. State Management:**
- React Context for global state (auth, user profile)
- Zustand for complex state (optional)
- Server Components for data fetching where possible
- Client Components for interactivity

**6. Firebase Integration:**
- Firebase SDK initialized (client-side)
- Firestore data access utilities
- Firebase Auth integration (with Auth0)
- Environment variables (.env.local for dev)
- Server-side Firebase Admin SDK setup (for API routes)

**7. API Integration:**
- API route handlers (Next.js API routes or Route Handlers)
- Fetch wrappers with error handling
- Loading states and error boundaries
- SWR or TanStack Query for data fetching (optional)

**8. Testing Setup:**
- Jest configured
- React Testing Library
- Example test files
- Coverage thresholds (70%+)

**9. Build & Deployment Config:**
- Next.js build optimization
- Environment variables per environment
- Build scripts (package.json)
- Firebase Hosting configuration
- Static export settings (if needed)

**10. Documentation:**
- README with setup instructions
- Component usage guide
- Routing conventions
- State management patterns
- API integration examples
- Coding standards

**Testing:**
- Dev server runs (`npm run dev`)
- Build succeeds (`npm run build`)
- Linting passes
- Example tests pass
- Components render in Storybook (optional) or page
- Firebase connection works
- Deployment to Firebase Hosting dev environment

**Deliverables:**
- Next.js project with TypeScript
- shadcn/ui component library integrated
- Tailwind CSS configured
- Firebase initialized
- Testing framework set up
- Developer documentation

**Dependencies:**
- Node.js and npm/yarn installed
- Firebase project credentials
- Auth0 configuration for frontend
- Design specs or mockups

**Definition of Done:**
- [ ] Next.js project running locally
- [ ] shadcn/ui components available
- [ ] Tailwind CSS styling working
- [ ] Firebase connected
- [ ] Testing framework functional
- [ ] Linting and formatting configured
- [ ] Developer docs complete
- [ ] Code merged to main
- [ ] Team walkthrough completed

---

#### EGP-018: [PM] Create Sprint 0 Project Plan and Stakeholder Communication
**Assignee:** Project Manager | **Story Points:** 2 | **Hours:** 8 | **Sprint:** 0

**Description:**
Comprehensive Sprint 0 planning, JIRA setup, stakeholder communication, risk management, and team coordination.

**Core Requirements:**

**1. Sprint 0 Plan Document:**
- Sprint overview (dates, team composition, hours per role)
- Sprint goal (authentication + infrastructure)
- User stories breakdown (US-017, US-018, US-019, US-004, INFRA)
- Success criteria per story
- Task dependencies
- Timeline with milestones
- Risk assessment
- Communication plan

**2. JIRA Configuration:**
- Create JIRA project (if not exists)
- Create all Sprint 0 tickets (EGP-001 through EGP-018)
- Organize into epics by user story
- Configure board (Kanban or Scrum)
- Set up workflows and statuses
- Create filters (by assignee, epic, priority)
- Team training on JIRA usage

**3. Stakeholder Communication:**
- Identify stakeholders (exec sponsor, product owner, investors, department leads)
- Define communication cadence (daily, weekly, sprint-end)
- Create status report template (accomplishments, plans, blockers, metrics, asks)
- Schedule recurring meetings (sprint review, retrospective)
- Set up distribution lists

**4. Team Meeting Cadence:**
- Daily standup: 9:00 AM, 15 minutes (What I did, doing today, blockers)
- Sprint planning: Week 1 Monday, 2 hours (already done for Sprint 0)
- Sprint review: Week 2 Friday, 1 hour (demo + stakeholder feedback)
- Sprint retrospective: Week 2 Friday, 1 hour (what went well, didn't, action items)
- Backlog refinement: Week 2 Thursday, 1 hour (prepare Sprint 1)

**5. Risk Management:**
- Identify risks:
  - Auth0 configuration issues could delay authentication work
  - External API (Congress.gov, Geocodio) integration problems
  - Team member availability (holidays, sickness)
  - Unclear requirements leading to rework
  - Technical blockers with unfamiliar technologies
  - Testing reveals major issues requiring significant rework
- Per risk: Likelihood (L/M/H), Impact (L/M/H), Mitigation plan, Response plan
- Risk log tracked throughout sprint

**6. Success Criteria:**
- All user stories completed and accepted
- No P0 or P1 bugs remaining
- Authentication works end-to-end (signup, login, reset)
- Profile updates work (location detection functional)
- Bill detail page renders correctly with real data
- All infrastructure deployed (dev, staging, prod)
- Test coverage ≥70%
- Documentation complete
- Team velocity baseline established

**7. Sprint Kickoff Meeting:**
- Conduct with entire team
- Review sprint goal and user stories
- Clarify acceptance criteria for each story
- Review task assignments
- Discuss dependencies and coordination needs
- Address questions/concerns
- Get team commitment
- Document action items

**8. Resource Allocation:**
- Calculate total estimated hours (sum of all tickets)
- Verify against team capacity (team size × work days × hours/day)
- Identify if over/under capacity
- Adjust scope or timeline if needed
- Plan for buffer (10-20% for unknowns)

**9. Dependency Tracking:**
- Create dependency matrix (which tasks depend on which)
- Example: FE signup depends on BE user creation + Auth0 config
- Monitor dependencies daily
- Escalate blockers immediately

**10. Metrics Tracking:**
- Set up tracking for:
  - Story points completed (burndown)
  - Tasks by status (To Do, In Progress, Done)
  - Bugs found and fixed
  - Code review turnaround time
  - Test coverage percentage
  - Deployment success rate
- Review metrics in standups and status reports

**11. Documentation Repository:**
- Create central location (Confluence, Notion, Google Drive)
- Folders: Sprint plans, meeting notes, status reports, retrospective action items, team resources
- Ensure all team members have access

**12. Stakeholder Alignment:**
- Pre-sprint meeting with key stakeholders
- Align on goals and expectations
- Clarify acceptance criteria and definition of done
- Agree on communication frequency and format
- Set sprint review attendance expectations

**Testing:**
- All Sprint 0 tasks created in JIRA
- Sprint kickoff meeting conducted
- First status report sent
- First standup held
- Sprint plan reviewed with TL
- All meeting invites sent and accepted

**Deliverables:**
- Sprint 0 plan document
- JIRA project with all tickets
- Stakeholder communication plan
- Meeting schedule with recurring invites
- Status report template
- Risk log
- Success criteria document
- Sprint kickoff meeting notes
- Dependency matrix

**Dependencies:**
- JIRA access for all team members
- Calendar access for scheduling
- Stakeholder contact information
- Understanding of all Sprint 0 requirements

**Definition of Done:**
- [ ] Sprint 0 plan complete and reviewed
- [ ] All tasks in JIRA with correct details
- [ ] Stakeholder communication plan established
- [ ] All recurring meetings scheduled
- [ ] Sprint kickoff conducted
- [ ] Risk log created
- [ ] Success criteria defined and agreed upon
- [ ] First status report sent
- [ ] Team aligned and ready to begin work

---

*Sprint 0 contains 18 tickets totaling 40 story points and 184 hours. The next ticket ID is EGP-019 for Sprint 1.*

---

## Sprint 1: Core User Features & Discovery (Weeks 3-4)

**Sprint Goal:** Deliver personalized feed, bill/policy browsing, organization discovery, and dashboard overview
**Total Story Points:** 42
**Total Hours:** 200

### US-001: View Home Feed with Filters (MVP) - 13 Story Points

#### EGP-019: [FE] Build Personalized Home Feed with Tabs and Filters
**Assignee:** Frontend Developer | **Story Points:** 5 | **Hours:** 20 | **Sprint:** 1

**Description:**
Create a dynamic home feed with tabs (For You, News, Campaigns, Bills), filters, pagination, and session persistence.

**Core Requirements:**
- **Tab Navigation:**
  - Four tabs: "For You", "News", "Campaigns", "Bills"
  - Active tab highlighted, smooth transitions (no full page reload)
  - Tab selection persists during session (survives browser refresh)
  - URL updates to reflect selected tab (/home?tab=news)

- **Feed Content:**
  - Mixed content cards showing preview, title, date, source/org, action buttons
  - Different card layouts per content type
  - "For You" tab: Personalized for signed-in users (follows + interests), popular for anonymous
  - Each tab shows relevant content only

- **Filters:**
  - Policy area multi-select dropdown (Healthcare, Environment, Economy, etc.)
  - Clear filters button appears when filters active
  - Badge showing active filter count
  - Filters apply without page reload
  - Filter state persists in session

- **Pagination:**
  - Infinite scroll OR load more button (20 items per page)
  - Loading spinner during fetch
  - "No more content" indicator at end
  - Scroll position maintained during session

- **Empty States:**
  - No results from filters → "No matching content. Try different filters." with clear button
  - New user (no follows) → "Discover content below or follow organizations to personalize your feed" with CTA
  - No content in tab → Friendly message with suggestions

**User Experience:**
- Fast tab switching (<200ms perceived)
- Skeleton loaders for initial load and pagination
- Smooth scroll to top when changing tabs
- Visual feedback on filter changes
- Mobile-friendly touch targets (44px minimum)
- Responsive grid (1 column mobile, 2 tablet, 3 desktop)

**Error Scenarios:**
- API failure → "Unable to load feed. Try again." with retry button
- Network timeout → Retry with exponential backoff (3 attempts)
- Partial load failure → Show loaded content + error for failed items

**Testing:**
- Switch between all 4 tabs → content changes correctly
- Apply filters → only matching items shown
- Pagination → additional items load, no duplicates
- Session persistence → reload page → tab and filters restored
- Empty states for all scenarios
- Signed-in vs anonymous feeds differ appropriately
- Mobile at 375px, tablet at 768px
- Keyboard navigation (tab through, Enter to activate)
- Screen reader announces tab changes and loading states

**Dependencies:**
- Backend: Feed endpoints for each tab
- Backend: Filter/pagination support
- Design: Card components for each content type
- Auth: User session for personalization

**Definition of Done:**
- [ ] Code merged to main
- [ ] All 4 tabs functional with correct content
- [ ] Filters work across all tabs
- [ ] Pagination/infinite scroll working
- [ ] Session persistence verified
- [ ] Empty states for all cases
- [ ] No P0/P1 bugs
- [ ] TL approval
- [ ] Mobile tested (375px, 768px, 1024px)
- [ ] Accessibility audit passes (WCAG AA)

---

#### EGP-020: [BE] Implement Feed Endpoints with Personalization
**Assignee:** Backend Developer | **Story Points:** 5 | **Hours:** 20 | **Sprint:** 1

**Description:**
Build feed API endpoints for each tab with filters, pagination, and user-based personalization.

**Core Requirements:**

**1. Feed Endpoints:**
- Single endpoint with `tab` parameter OR separate endpoints per tab
- Accept query parameters:
  - `tab`: for_you | news | campaigns | bills
  - `page`: Integer (default 1)
  - `pageSize`: Integer (default 20, max 50)
  - `policy`: Comma-separated policy IDs
  - `sort`: recent | popular | relevant (default varies by tab)

**2. Response Format:**
```json
{
  "items": [
    {
      "id": "...",
      "type": "bill|news|campaign",
      "title": "...",
      "summary": "...",
      "date": "...",
      "source": { ... },
      "metadata": { ... }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 247,
    "hasMore": true
  },
  "appliedFilters": {
    "policy": ["healthcare", "environment"]
  }
}
```

**3. Personalization Logic:**
- **Anonymous users:**
  - "For You": Popular content (high engagement, recent)
  - Other tabs: Standard recent content
- **Signed-in users:**
  - "For You": Prioritize followed organizations, interests, watched bills
  - Include followed members' bills
  - Blend personalized (60%) + popular (40%)
- Personalization query: <100ms budget
- Cache popular content (5 min TTL)

**4. Tab-Specific Logic:**
- **For You:** Mixed content, personalized ranking
- **News:** News stories only, sorted by date
- **Campaigns:** Active campaigns, sorted by recent activity
- **Bills:** Federal bills, sorted by latest action date

**5. Filtering:**
- Policy filter: Match against bill subjects or campaign topics
- Validate policy IDs against allowed list
- Return 400 for invalid policy values
- Empty results if no matches

**6. Pagination:**
- Offset-based pagination
- Return `hasMore: false` when at end
- Cap `totalItems` calculation at 1000 to avoid expensive counts
- Prevent excessive page numbers (max page 50)

**7. Performance:**
- P95 latency <500ms for all tabs
- Use Firestore composite indexes
- Cache popular/recent queries (Redis, 5 min TTL)
- Limit joins/lookups per request

**Error Handling:**
- Invalid tab → 400 "Invalid tab. Allowed: for_you, news, campaigns, bills"
- Invalid page/pageSize → 400 with limits specified
- Invalid policy filter → 400 with allowed values
- Database unavailable → Try cache fallback → 503
- Unexpected errors → Log details, return 500

**Testing:**
- Anonymous "For You" → popular content returned
- Signed-in "For You" → followed items appear first
- Each tab returns only that content type
- Policy filter → only matching items
- Multiple policies → items match any policy (OR logic)
- Pagination: page 1, page 2, last page (hasMore: false)
- Invalid inputs → 400 errors
- Performance: 100 concurrent requests <500ms P95
- Cache hit vs miss performance difference

**Dependencies:**
- Firestore indexes for all query patterns
- Redis for caching
- User interests/follows data
- Content tables (bills, news, campaigns) populated

**Definition of Done:**
- [ ] Code merged to main
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests for all tabs
- [ ] Personalization logic verified
- [ ] Performance targets met
- [ ] API docs updated
- [ ] Firestore indexes created
- [ ] TL approval
- [ ] Deployed to staging

---

#### EGP-021: [TL] Define Feed Architecture and Performance Budget
**Assignee:** Tech Lead | **Story Points:** 2 | **Hours:** 8 | **Sprint:** 1

**Description:**
Architect scalable feed system with clear API contracts, performance budgets, and caching strategy.

**Documentation Required:**

**1. Feed API Contract:**
- Endpoint specifications (parameters, defaults, limits)
- Request/response schemas (JSON examples)
- Error response formats
- Versioning strategy
- Consistency model (eventual vs strong)

**2. Performance Budget:**
- **Frontend:**
  - Initial page load: <2s (3G)
  - Tab switch: <200ms perceived
  - Pagination: <500ms
  - Filter application: <300ms
- **Backend:**
  - Feed endpoint P50: <200ms
  - Feed endpoint P95: <500ms
  - Feed endpoint P99: <1s
- **Data:**
  - Page size: 20 items (balance UX vs performance)
  - Max query depth: 50 pages
  - Cache TTL: 5 minutes (popular), 1 minute (personalized)

**3. Caching Strategy:**
- **What to cache:**
  - Popular content per tab (anonymous users)
  - Recent bills/campaigns/news (all users)
  - User follows/interests lookup (per user)
- **Cache keys:**
  - `feed:{tab}:{page}` (anonymous popular)
  - `feed:{userId}:{tab}:{page}:{policyHash}` (personalized)
- **TTLs:**
  - Popular: 5 minutes
  - Personalized: 1 minute
  - User metadata: 10 minutes
- **Invalidation:**
  - New content published → clear related keys
  - User follows/unfollows → clear user-specific keys
  - Manual admin purge available

**4. Personalization Rules:**
- Scoring algorithm:
  - Followed org content: +50 points
  - Watched bill: +40 points
  - Interest match: +30 points
  - Recency: +10 points per day (max 30 days)
  - Popularity: +1 point per 100 views
- Blend: 60% personalized + 40% popular
- Minimum diversity: No more than 3 items from same org in top 20
- Fallback: If <10 personalized items, fill with popular

**5. Query Optimization:**
- Use Firestore composite indexes for all query patterns
- Denormalize frequently accessed data (embed org name in campaign doc)
- Limit lookups per request (max 3 joins)
- Batch fetch related data where possible
- Use select projections (don't fetch full documents if only need subset)

**6. Pagination Approach:**
- Offset-based for simplicity (acceptable for <50 pages)
- Future: Cursor-based if performance issues arise
- Prevent deep pagination (cap at page 50)
- totalItems capped at 1000 to avoid expensive counts

**7. Monitoring & Alerts:**
- Track metrics:
  - Feed endpoint latency (P50, P95, P99)
  - Cache hit rate (target >70%)
  - Error rate (target <1%)
  - Personalization coverage (% users getting personalized results)
  - Tab distribution (which tabs most used)
- Alerts:
  - P95 latency >500ms for 5 minutes
  - Error rate >5% for 2 minutes
  - Cache hit rate <50% for 10 minutes

**Deliverables:**
- Feed API contract document
- Performance budget specification
- Caching strategy document
- Personalization algorithm spec
- Query optimization guidelines
- Monitoring and alerting plan

**Testing:**
- Review API contract with FE/BE teams
- Validate performance budgets with sample data
- Test caching strategy in dev environment
- Verify composite indexes created
- Code review of implementations against specs

**Dependencies:**
- Understanding of user behavior patterns
- Firestore query capabilities
- Redis caching infrastructure
- Access to performance monitoring tools

**Definition of Done:**
- [ ] All specifications documented
- [ ] FE/BE teams aligned on API contract
- [ ] Performance budgets agreed and tracked
- [ ] Caching strategy implemented
- [ ] Monitoring dashboards created
- [ ] Team walkthrough completed
- [ ] Docs published to wiki

---

#### EGP-022: [PM] QA Feed Functionality and Define Success Metrics
**Assignee:** Project Manager | **Story Points:** 1 | **Hours:** 8 | **Sprint:** 1

**Description:**
Comprehensive testing of feed across scenarios, devices, and users; define metrics for feed success.

**Testing Scope:**

**1. Functional Testing:**
- **Tabs:**
  - Switch between all 4 tabs → content changes correctly
  - URL updates reflect tab
  - Active tab visually highlighted
  - Tab state persists on reload
- **Filters:**
  - Apply single policy filter → only matching content
  - Apply multiple filters → items match any filter
  - Clear filters → all content returns
  - Filter badge shows count
  - Filters persist on reload
- **Pagination:**
  - Load more items → additional items appear
  - No duplicate items across pages
  - Scroll to last page → "No more content" message
  - Loading states appear during fetch
- **Personalization (signed-in):**
  - Followed orgs appear higher in "For You"
  - Watched bills appear in feed
  - Interest-tagged content prioritized
- **Anonymous:**
  - Popular content shown in "For You"
  - No personalization attempted

**2. Empty States:**
- New user (no follows) → helpful CTA shown
- Filters yield no results → clear filters suggestion
- No content in tab → appropriate message
- End of paginated content → clear indicator

**3. Error Handling:**
- Simulate API failure → error message + retry button
- Network timeout → retry with backoff
- Partial load failure → show loaded content + error

**4. Cross-Browser Testing:**
- Chrome, Firefox, Safari, Edge (latest versions)
- Desktop (1440px), Tablet (768px), Mobile (375px)
- iOS Safari, Android Chrome

**5. Performance Testing:**
- Initial load <2s on 3G
- Tab switch <200ms perceived
- Pagination <500ms
- Apply filter <300ms
- Lighthouse score >90 for Performance

**6. Accessibility Testing:**
- Keyboard navigation (tab through all elements)
- Screen reader announces tab changes
- Filter controls accessible
- Loading states announced
- Focus indicators visible
- WCAG AA contrast ratios
- Touch targets ≥44px on mobile

**7. Success Metrics Definition:**
- **Engagement:**
  - Time on feed page (target: >3 min average)
  - Items viewed per session (target: >10)
  - Tab usage distribution
  - Return visit rate (target: >40% within 7 days)
- **Personalization:**
  - Click-through rate on personalized items (target: >5%)
  - Personalized items engagement vs generic (target: 2x)
  - Follows/watches initiated from feed (target: >1 per session)
- **Performance:**
  - Page load time P95 (target: <2s)
  - Error rate (target: <1%)
  - Cache hit rate (target: >70%)
- **Filters:**
  - Filter usage rate (target: >30% of sessions)
  - Filter combinations used
  - Clear filter rate

**Deliverables:**
- Test results spreadsheet (50+ test cases covering all scenarios)
- Cross-browser compatibility matrix
- Performance test results (Lighthouse reports)
- Accessibility audit report
- Defect reports in JIRA
- **Success metrics dashboard:**
  - Metrics definitions
  - Tracking implementation plan
  - Baseline targets
  - Reporting cadence (weekly)
- **User feedback plan:**
  - In-app feedback widget specification
  - User interview script for feed usage

**Dependencies:**
- Feed functionality deployed to staging
- Backend endpoints functional
- Test accounts (new users, active users with follows)
- Analytics tracking implemented

**Definition of Done:**
- [ ] All 50+ test cases executed
- [ ] No P0/P1 defects (or approved exceptions)
- [ ] Cross-browser matrix completed
- [ ] Performance targets met
- [ ] Accessibility audit passes (WCAG AA)
- [ ] Success metrics defined and agreed
- [ ] Analytics tracking verified
- [ ] QA sign-off

---

### US-002: Browse Policy-Specific Content - 8 Story Points

#### EGP-023: [FE] Build Policy Issue Pages with Filtered Feeds
**Assignee:** Frontend Developer | **Story Points:** 3 | **Hours:** 12 | **Sprint:** 1

**Description:**
Create dedicated pages for each policy area (Healthcare, Climate, etc.) with top highlights and filtered content feed.

**Core Requirements:**
- **Static Routes:**
  - One route per policy: `/issues/healthcare`, `/issues/climate`, `/issues/economy`, etc.
  - Routes defined in Next.js routing config
  - Category name from URL slug

- **Page Header:**
  - Policy area title (e.g., "Healthcare & Medicine")
  - Brief description (1-2 sentences)
  - Icon/illustration per policy
  - Breadcrumb: Home > Issues > [Policy Name]

- **Top Section (3 tiles):**
  - **Tile 1 - Quick Stats:** Bill count, active campaigns count
  - **Tile 2 - Top News:** Most recent news story headline + preview
  - **Tile 3 - Key Actions:** Upcoming votes, recent actions (if available)

- **Filtered Feed:**
  - Reuse home feed component
  - Auto-apply policy filter
  - Show bills, news, campaigns tagged to this policy
  - Tabs: "All", "Bills", "News", "Campaigns"
  - Pagination/infinite scroll

- **Empty State:**
  - No content for policy → "No recent activity in [Policy]. Check back soon or explore other issues."
  - Link back to all issues or home

**User Experience:**
- Consistent layout across all policy pages
- Fast page loads (server-side render header + client-side feed)
- Smooth transitions between policy pages
- Mobile: Stack tiles vertically
- Desktop: 3 columns for tiles

**Error Scenarios:**
- Invalid policy slug → 404 page
- API failure for stats → Show "Unable to load" in tile
- Feed load failure → Standard feed error handling

**Testing:**
- Navigate to all policy pages → correct title, description, icon
- Top section tiles load with correct data
- Feed shows only content tagged to that policy
- Tabs filter within policy context
- Empty state when no content
- Invalid slug → 404
- Mobile at 375px (tiles stack)
- Keyboard navigation
- Screen reader announces policy context

**Dependencies:**
- Backend: Policy metadata endpoint
- Backend: Feed endpoint with policy filter
- Backend: Policy stats endpoint
- Design: Icons/illustrations for each policy
- Content: Policy descriptions

**Definition of Done:**
- [ ] Code merged to main
- [ ] All policy routes functional
- [ ] Top section tiles display correct data
- [ ] Filtered feed works for each policy
- [ ] Empty states handled
- [ ] No P0/P1 bugs
- [ ] TL approval
- [ ] Mobile tested
- [ ] Accessibility audit passes

---

#### EGP-024: [BE] Implement Policy-Filtered Feed and Metadata Endpoints
**Assignee:** Backend Developer | **Story Points:** 3 | **Hours:** 12 | **Sprint:** 1

**Description:**
Extend feed API to support policy filtering and create policy metadata/stats endpoints.

**Core Requirements:**

**1. Policy Filter Enhancement:**
- Add `policy` parameter to feed endpoint (already planned in EGP-020)
- Filter bills by subjects matching policy
- Filter campaigns by topics matching policy
- Filter news by tags matching policy
- Return only items that match the policy

**2. Policy Metadata Endpoint:**
- Endpoint: `GET /api/policies` OR `GET /api/policies/:slug`
- Returns:
  - Policy slug, name, description, icon URL
  - All policies list OR single policy details
- Example response:
```json
{
  "slug": "healthcare",
  "name": "Healthcare & Medicine",
  "description": "Legislation and campaigns related to...",
  "iconUrl": "/icons/healthcare.svg",
  "billCount": 42,
  "campaignCount": 7,
  "newsCount": 15
}
```

**3. Policy Stats Endpoint:**
- Endpoint: `GET /api/policies/:slug/stats`
- Returns real-time counts:
  - Active bills count
  - Active campaigns count
  - Recent news count (last 30 days)
  - Top news story
  - Upcoming votes (if available)
- Cache stats (TTL: 15 minutes)

**4. Policy Mapping:**
- Create single source of truth for policy categories:
  - healthcare, climate, economy, education, immigration, civil-rights, etc.
- Map bill subjects → policies
- Map campaign topics → policies
- Map news tags → policies
- Handle unmapped subjects → "other" category or exclude

**5. Filtering Logic:**
- Input validation: policy slug must be in allowed list
- Query Firestore with compound index: (policy, date DESC)
- Return items tagged to that policy
- Support multi-policy queries if needed

**Error Handling:**
- Invalid policy slug → 400 "Invalid policy. Allowed: [list]"
- Policy exists but no content → 200 with empty items array
- Database unavailable → Try cache → 503

**Testing:**
- Valid policy → only matching content returned
- Invalid policy → 400 error
- Multiple content types match correctly
- Stats endpoint returns accurate counts
- Policy mapping: Known subjects map to correct policies
- Unmapped subjects handled gracefully
- Caching: Second request faster (cache hit)
- Integration: Frontend → policy page → filtered feed

**Dependencies:**
- Policy mapping table defined
- Firestore indexes for policy queries
- Bills/campaigns/news tagged with subjects/topics
- Redis for caching stats

**Definition of Done:**
- [ ] Code merged to main
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests for policy filtering
- [ ] Policy mapping complete and validated
- [ ] Stats endpoint functional
- [ ] API docs updated
- [ ] Firestore indexes created
- [ ] TL approval
- [ ] Deployed to staging

---

#### EGP-025: [TL] Define Policy Category Mapping and Fallback Rules
**Assignee:** Tech Lead | **Story Points:** 1 | **Hours:** 4 | **Sprint:** 1

**Description:**
Create authoritative policy category mapping and define handling of unmapped or ambiguous subjects.

**Documentation Required:**

**1. Policy Categories:**
- Define 10-15 top-level policy categories:
  - Healthcare & Medicine
  - Climate, Energy & Environment
  - Economy & Work
  - Education
  - Immigration & Migration
  - Civil Rights & Liberties
  - Criminal Justice & Public Safety
  - Government & Elections
  - Foreign Policy & Defense
  - Technology & Privacy
  - Social Security & Medicare
  - Housing & Urban Development
  - Agriculture & Food
  - Transportation & Infrastructure

**2. Subject Mapping Table:**
- Map bill subjects (from Congress.gov) to our policies
- Example:
  - "Health" → healthcare
  - "Climate change" → climate
  - "Medicare" → social-security-medicare
  - "Immigration reform" → immigration
- Comprehensive list covering common subjects
- Handle synonyms and variations

**3. Ambiguous Mappings:**
- Subjects that could map to multiple policies:
  - "Education funding" → education OR economy
  - Decision: Primary policy + secondary tag (optional)
- Document decision rationale

**4. Unmapped Subjects:**
- Fallback strategy:
  - Option 1: Map to "Other" category
  - Option 2: Exclude from policy pages (only show in "All Bills")
  - Recommended: Exclude from policy-specific feeds to maintain quality
- Log unmapped subjects for future review

**5. Multi-Tag Support:**
- Bills/campaigns can have multiple policy tags
- Policy page shows items with any matching tag
- Example: Healthcare bill also tagged to economy → appears on both pages

**6. Mapping Maintenance:**
- Process for adding new mappings
- Review cadence (monthly check of unmapped subjects)
- Who approves new mappings (TL + PM)

**Deliverables:**
- Policy categories list
- Subject → policy mapping table (CSV or JSON)
- Fallback rules document
- Ambiguous mapping decisions
- Maintenance process

**Testing:**
- Sample 50 bills → verify subjects map correctly
- Unmapped subjects handled per fallback rules
- No errors on frontend for unmapped items
- Multi-tagged items appear on correct pages

**Dependencies:**
- Access to Congress.gov subject taxonomy
- Understanding of content tagging in campaigns/news

**Definition of Done:**
- [ ] Policy categories finalized
- [ ] Mapping table complete and reviewed
- [ ] Fallback rules defined
- [ ] Team walkthrough completed
- [ ] Docs published to wiki
- [ ] FE/BE teams aligned on implementation

---

#### EGP-026: [PM] QA Policy Pages and Validate Content Accuracy
**Assignee:** Project Manager | **Story Points:** 1 | **Hours:** 4 | **Sprint:** 1

**Description:**
Test all policy pages, validate content scoping, verify stats accuracy, create policy page guides.

**Testing Scope:**

**1. Route Testing:**
- Navigate to all policy pages → each loads correctly
- Verify unique content per policy
- Breadcrumbs work correctly
- 404 for invalid policy slug

**2. Content Validation:**
- Select 5 policies, spot-check 10 items per policy
- Verify items are actually tagged to that policy
- Compare against source data (Congress.gov, campaign tags)
- Check for mistagged content

**3. Top Section Tiles:**
- Stats accurate (count manually vs displayed)
- Top news relevance (actually recent and related)
- Key actions appropriate
- Tiles handle empty data gracefully

**4. Filtered Feed:**
- Feed shows only policy-specific content
- Tabs work within policy context
- Pagination functional
- Empty state when no content

**5. Cross-Policy Consistency:**
- Layout consistent across all pages
- Navigation works the same
- Error handling uniform

**6. Performance:**
- Page load <2s on 3G
- Stats load quickly (cache working)

**7. Mobile/Accessibility:**
- Mobile at 375px (tiles stack correctly)
- Touch targets ≥44px
- Keyboard navigation
- Screen reader compatibility

**Deliverables:**
- Test results matrix (all policies × test scenarios)
- Content accuracy spot-check report
- Defect reports in JIRA
- **User guide:** "Understanding Policy Areas" (what each policy covers, how to find related content)

**Dependencies:**
- All policy pages deployed to staging
- Backend endpoints functional
- Policy mapping complete

**Definition of Done:**
- [ ] All policy pages tested
- [ ] Content accuracy validated (≥95% correct tagging)
- [ ] No P0/P1 defects
- [ ] Performance targets met
- [ ] Mobile and accessibility verified
- [ ] User guide created
- [ ] QA sign-off

---

### US-003: Browse Federal Bills by Category - 5 Story Points

#### EGP-027: [FE] Build Category Browsing UI for Federal Bills
**Assignee:** Frontend Developer | **Story Points:** 2 | **Hours:** 8 | **Sprint:** 1

**Description:**
Create UI for browsing federal bills grouped by policy categories with multi-select filtering.

**Core Requirements:**
- **Multi-Select Filter:**
  - Dropdown or checkbox group for policy categories
  - Select/deselect individual categories
  - "Select All" / "Clear All" options
  - Active selections shown as removable badges
  - Filter state persists in URL query params

- **Category Groups Display:**
  - One section per selected category (or all if none selected)
  - Section header with category name and count
  - Show up to 10 bills per category (configurable)
  - Bills sorted by latest action date descending
  - "View All [Category] Bills" link to dedicated category page

- **Bill Card:**
  - Bill number (H.R. 1234)
  - Short title (truncate if needed)
  - Latest action date
  - Status badge

- **Empty States:**
  - No selected categories → "Select categories to browse bills"
  - Selected category has no bills → "No recent bills in [Category]"

**User Experience:**
- Fast filter application (<300ms)
- Smooth expand/collapse for categories (optional)
- Sticky filter bar on scroll (desktop)
- Mobile: Filter button opens modal with selections
- Visual feedback when applying filters

**Error Scenarios:**
- API failure → "Unable to load bills. Try again." with retry button
- Partial load (some categories fail) → Show loaded + error for failed

**Testing:**
- Select single category → only that group visible
- Select multiple categories → all groups visible
- Deselect all → empty state or all categories shown
- Each category shows ≤10 items, sorted correctly
- Filter state in URL → shareable link works
- Mobile at 375px (filter modal functional)
- Keyboard navigation
- Screen reader announces category changes

**Dependencies:**
- Backend: Category-filtered bills endpoint
- Backend: Policy categories list
- Design: Bill card component

**Definition of Done:**
- [ ] Code merged to main
- [ ] Multi-select filter functional
- [ ] Category groups display correctly
- [ ] Bill limits enforced per category
- [ ] Empty states handled
- [ ] No P0/P1 bugs
- [ ] TL approval
- [ ] Mobile tested
- [ ] Accessibility audit passes

---

#### EGP-028: [BE] Implement Category-Based Bill Queries
**Assignee:** Backend Developer | **Story Points:** 2 | **Hours:** 8 | **Sprint:** 1

**Description:**
Build endpoint to return recent bills grouped by selected policy categories.

**Core Requirements:**

**1. Bills by Category Endpoint:**
- Endpoint: `GET /api/bills/by-category`
- Accept query parameters:
  - `categories`: Comma-separated category slugs (e.g., "healthcare,climate")
  - `limit`: Bills per category (default 10, max 50)
- Returns bills grouped by category

**2. Response Format:**
```json
{
  "results": [
    {
      "category": "healthcare",
      "billCount": 42,
      "bills": [
        {
          "id": "119-hr-1234",
          "number": "H.R. 1234",
          "title": "...",
          "latestAction": {...},
          "status": "...",
          "introDate": "..."
        }
      ]
    }
  ]
}
```

**3. Querying Logic:**
- For each requested category, query bills tagged to that category
- Sort by latest action date descending
- Limit results per category
- Use Firestore compound index: (category, latestActionDate DESC)
- Execute category queries in parallel for performance

**4. Empty Results:**
- Category with no bills → return empty bills array with billCount: 0
- All categories empty → return empty results array

**Error Handling:**
- Invalid category slug → 400 with list of allowed categories
- Limit exceeds max → clamp to max (50)
- Database unavailable → 503
- Unexpected errors → log and return 500

**Testing:**
- Request single category → bills for that category only
- Request multiple categories → bills for all categories
- Category with no bills → empty array
- Limit parameter → correct number of bills per category
- Sort order → latest action date descending
- Invalid category → 400 error
- Performance: 3 categories query <500ms

**Dependencies:**
- Policy mapping (from EGP-025)
- Firestore composite indexes
- Bills collection populated

**Definition of Done:**
- [ ] Code merged to main
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] Firestore indexes created
- [ ] API docs updated
- [ ] TL approval
- [ ] Deployed to staging

---

#### EGP-029: [PM] QA Category Browsing and Validate Groupings
**Assignee:** Project Manager | **Story Points:** 1 | **Hours:** 4 | **Sprint:** 1

**Description:**
Test category browsing UI, validate bills are correctly grouped, verify limits and sorting.

**Testing Scope:**

**1. Filter Functionality:**
- Select single category → only that group visible
- Select multiple categories → all groups visible
- Deselect all → appropriate behavior
- Filter badges removable
- URL params update with selections

**2. Category Groups:**
- Each category shows correct bills (spot-check against tagging)
- Bill count accurate (≤10 per category)
- Sort order: Latest action date descending
- "View All" links work

**3. Content Validation:**
- Select 3 categories, spot-check 5 bills each
- Verify bills are actually tagged to those categories
- Check for incorrectly grouped bills

**4. Edge Cases:**
- Category with no bills → empty state shown
- All categories empty → clear guidance
- Very long bill titles → truncation works

**5. Performance:**
- Filter application <300ms
- Initial load <2s on 3G

**6. Mobile/Accessibility:**
- Mobile at 375px (filter modal works)
- Touch targets ≥44px
- Keyboard navigation
- Screen reader compatibility

**Deliverables:**
- Test results spreadsheet (20+ test cases)
- Content validation report (bills correctly grouped)
- Defect reports in JIRA
- **User guide section:** "Browsing Bills by Category"

**Dependencies:**
- Category browsing deployed to staging
- Backend endpoint functional
- Policy mapping complete

**Definition of Done:**
- [ ] All test cases executed
- [ ] Content validation complete (≥95% accuracy)
- [ ] No P0/P1 defects
- [ ] Performance targets met
- [ ] Mobile and accessibility verified
- [ ] User guide section created
- [ ] QA sign-off

---

### US-009: Browse Organizations - 3 Story Points

#### EGP-030: [FE] Build Organizations List Page
**Assignee:** Frontend Developer | **Story Points:** 1 | **Hours:** 4 | **Sprint:** 1

**Description:**
Create browsable list of advocacy organizations with sorting and pagination.

**Core Requirements:**
- **Organization List:**
  - Grid/list view (toggle optional, grid default)
  - Each card shows: Logo, name, brief description (truncate), focus areas (tags), supporter count, active campaigns count
  - Click card → navigate to org profile page

- **Sorting:**
  - Dropdown: "Name (A-Z)", "Name (Z-A)", "Most Active" (by campaign count), "Most Supporters"
  - Sort selection persists in URL
  - Default: "Most Active"

- **Pagination:**
  - 20 orgs per page
  - Standard page controls (Previous, 1, 2, 3, Next)
  - Current page highlighted
  - Disable Previous on page 1, Next on last page

- **Empty State:**
  - No organizations → "No organizations found. Check back soon."
  - Search/filter yields no results (future) → "No organizations match your criteria."

**User Experience:**
- Fast sorting (<200ms)
- Skeleton loaders during initial load
- Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
- Hover effects on cards
- Mobile-friendly touch targets

**Error Scenarios:**
- API failure → "Unable to load organizations. Try again." with retry button
- Image load failures → fallback placeholder logo

**Testing:**
- All orgs load and display correctly
- Sort by name asc/desc → alphabetical order correct
- Sort by active campaigns → descending order
- Pagination: Navigate through pages, no duplicates
- Empty state when no orgs
- Mobile at 375px
- Keyboard navigation
- Screen reader announces org names and counts

**Dependencies:**
- Backend: Organizations list endpoint
- Design: Organization card component
- Org logos uploaded or placeholder available

**Definition of Done:**
- [ ] Code merged to main
- [ ] List displays with all fields
- [ ] Sorting functional
- [ ] Pagination working
- [ ] Empty states handled
- [ ] No P0/P1 bugs
- [ ] TL approval
- [ ] Mobile tested
- [ ] Accessibility audit passes

---

#### EGP-031: [BE] Implement Organizations Listing Endpoint
**Assignee:** Backend Developer | **Story Points:** 1 | **Hours:** 4 | **Sprint:** 1

**Description:**
Build API endpoint to list organizations with sorting and pagination.

**Core Requirements:**

**1. Organizations List Endpoint:**
- Endpoint: `GET /api/organizations`
- Accept query parameters:
  - `page`: Integer (default 1)
  - `pageSize`: Integer (default 20, max 50)
  - `sort`: name_asc | name_desc | active_campaigns | supporters (default: active_campaigns)

**2. Response Format:**
```json
{
  "items": [
    {
      "id": "...",
      "slug": "common-cause",
      "name": "Common Cause",
      "description": "...",
      "logoUrl": "...",
      "focusAreas": ["government", "elections"],
      "supporterCount": 1234,
      "activeCampaignCount": 5
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 47,
    "totalPages": 3
  }
}
```

**3. Sorting Logic:**
- name_asc/name_desc: Alphabetical by org name
- active_campaigns: Descending by active campaign count
- supporters: Descending by supporter count
- Use Firestore indexes for efficient sorting

**4. Filtering:**
- Only return verified organizations (status: active)
- Exclude suspended orgs
- Include orgs with ≥1 active campaign (or all, based on requirements)

**Error Handling:**
- Invalid sort value → 400 with allowed values listed
- Page/pageSize out of bounds → 400
- Database unavailable → 503
- Unexpected errors → log and return 500

**Testing:**
- Request orgs → correct list returned
- Sort by name asc → alphabetical order
- Sort by active campaigns → descending by count
- Pagination: page 1, page 2, last page
- Invalid sort → 400 error
- Performance: <300ms response time

**Dependencies:**
- Organizations collection in Firestore
- Firestore indexes for sort fields
- Campaign counts computed/denormalized

**Definition of Done:**
- [ ] Code merged to main
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] Firestore indexes created
- [ ] API docs updated
- [ ] TL approval
- [ ] Deployed to staging

---

#### EGP-032: [PM] QA Organizations List
**Assignee:** Project Manager | **Story Points:** 1 | **Hours:** 4 | **Sprint:** 1

**Description:**
Test organizations list page, validate data accuracy, verify sorting and pagination.

**Testing Scope:**

**1. Functional Testing:**
- All organizations load correctly
- Logos display (or placeholder)
- Org names and descriptions accurate
- Focus areas and counts correct
- Click org → navigates to profile page

**2. Sorting:**
- Sort by name A-Z → alphabetical order
- Sort by name Z-A → reverse alphabetical
- Sort by most active → campaigns count descending
- Sort by supporters → supporters count descending

**3. Pagination:**
- Navigate to page 2, 3, etc.
- Previous/Next buttons work correctly
- No duplicate orgs across pages
- Current page highlighted
- Boundary cases (page 1, last page)

**4. Data Validation:**
- Spot-check 10 orgs
- Verify campaign counts against actual active campaigns
- Verify supporter counts (if available)
- Check for test/inactive orgs appearing

**5. Cross-Browser/Mobile:**
- Chrome, Firefox, Safari, Edge
- Mobile at 375px (cards stack)
- Touch targets ≥44px

**6. Accessibility:**
- Keyboard navigation
- Screen reader announces org names
- Focus indicators visible

**Deliverables:**
- Test results spreadsheet (15+ test cases)
- Data validation report
- Defect reports in JIRA
- **User guide:** "Finding Advocacy Organizations"

**Dependencies:**
- Organizations page deployed to staging
- Backend endpoint functional
- Sample orgs seeded in database

**Definition of Done:**
- [ ] All test cases executed
- [ ] Data accuracy verified (≥95%)
- [ ] No P0/P1 defects
- [ ] Sorting and pagination work correctly
- [ ] Mobile and accessibility verified
- [ ] User guide created
- [ ] QA sign-off

---

### US-010: View Organization Profile - 5 Story Points

#### EGP-033: [FE] Build Organization Profile Page
**Assignee:** Frontend Developer | **Story Points:** 2 | **Hours:** 8 | **Sprint:** 1

**Description:**
Create organization profile page showing details, active campaigns, and social links.

**Core Requirements:**
- **Header Section:**
  - Large logo
  - Organization name (H1)
  - Brief tagline/description
  - Location (if available)
  - "Follow" button (signed-in users, toggle on/off)
  - Supporter count
  - Website and social media links (external, open in new tab)

- **About Section:**
  - Full description (expandable if long)
  - Focus areas (tags/pills)
  - Founded date (if available)

- **Active Campaigns:**
  - List of currently active campaigns
  - Each campaign card: Title, brief description, bill/issue link, CTA button
  - If no campaigns: "No active campaigns at this time"
  - Sort by most recent
  - Limit to 10, "View All Campaigns" link if more

- **Error States:**
  - Invalid org slug (not found) → 404 page: "Organization not found"
  - API failure → "Unable to load organization. Try again." with retry

- **Guest vs Signed-In:**
  - Guest clicking Follow → redirect to login with returnTo
  - Signed-in → toggle follow status, persists

**User Experience:**
- Professional, trustworthy appearance
- Fast page load (server-side render header)
- Smooth transitions
- Mobile: Stack sections vertically
- Desktop: Header + 2-column layout for About and Campaigns

**Testing:**
- Valid org slug → full profile loads
- Invalid slug → 404 page
- Follow button (signed-in) → toggles on/off, persists after reload
- Guest clicks Follow → redirected to login
- Active campaigns display correctly
- No campaigns → empty state shown
- Social links open in new tabs
- Mobile at 375px
- Keyboard navigation
- Screen reader announces org name and details

**Dependencies:**
- Backend: Organization profile endpoint
- Backend: Organization campaigns endpoint
- Backend: Follow/unfollow endpoints
- Design: Campaign card component

**Definition of Done:**
- [ ] Code merged to main
- [ ] Profile displays all sections correctly
- [ ] Follow functionality works
- [ ] Active campaigns list functional
- [ ] Error states handled
- [ ] No P0/P1 bugs
- [ ] TL approval
- [ ] Mobile tested
- [ ] Accessibility audit passes

---

#### EGP-034: [BE] Implement Organization Profile and Campaigns Endpoints
**Assignee:** Backend Developer | **Story Points:** 2 | **Hours:** 8 | **Sprint:** 1

**Description:**
Build endpoints to return organization details and associated active campaigns.

**Core Requirements:**

**1. Organization Profile Endpoint:**
- Endpoint: `GET /api/organizations/:slug`
- Returns complete organization details:
  - Basic info (id, slug, name, description, logo, tagline, location, founded)
  - Social links (website, twitter, facebook, instagram)
  - Focus areas (array of policy category slugs)
  - Metrics (supporter count, active campaign count, total messages sent)
  - Verification status

**2. Organization Campaigns Endpoint:**
- Endpoint: `GET /api/organizations/:slug/campaigns`
- Accept query parameters:
  - `status`: active | paused | all (default: active)
  - `limit`: Integer (default 10)
- Returns campaigns for this organization
- Sorted by created date descending (most recent first)

**3. Response Formats:**
```json
// Profile
{
  "id": "...",
  "slug": "common-cause",
  "name": "Common Cause",
  "description": "...",
  "tagline": "...",
  "logoUrl": "...",
  "website": "...",
  "socialLinks": {...},
  "focusAreas": ["government", "elections"],
  "supporterCount": 1234,
  "activeCampaignCount": 5,
  "verificationStatus": "verified"
}

// Campaigns
{
  "campaigns": [
    {
      "id": "...",
      "title": "...",
      "description": "...",
      "billId": "...",
      "status": "active",
      "createdAt": "..."
    }
  ]
}
```

**4. Caching:**
- Cache profile data (TTL: 15 minutes)
- Cache active campaigns list (TTL: 5 minutes)
- Invalidate on org/campaign updates

**Error Handling:**
- Org slug not found → 404
- Invalid status value → 400
- Database unavailable → try cache → 503
- Unexpected errors → log and return 500

**Testing:**
- Valid slug → profile returned
- Invalid slug → 404
- Campaigns endpoint → active campaigns only
- Empty campaigns → empty array
- Caching: Second request faster (cache hit)
- Integration: Frontend → profile page displays correctly

**Dependencies:**
- Organizations collection
- Campaigns collection
- Redis for caching

**Definition of Done:**
- [ ] Code merged to main
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] Caching verified
- [ ] API docs updated
- [ ] TL approval
- [ ] Deployed to staging

---

#### EGP-035: [PM] QA Organization Profiles
**Assignee:** Project Manager | **Story Points:** 1 | **Hours:** 4 | **Sprint:** 1

**Description:**
Test organization profile pages, validate data accuracy, verify links and campaigns.

**Testing Scope:**

**1. Profile Display:**
- Navigate to 5+ org profiles
- All fields display correctly (name, logo, description, links)
- Logo loads (or placeholder)
- Social links work (open in new tab)
- Follow button present (signed-in users)

**2. Campaigns Section:**
- Active campaigns list displays
- Campaign cards show correct info
- Links to bills/issues work
- Empty state when no campaigns
- "View All" link if >10 campaigns

**3. Follow Functionality:**
- Signed-in user clicks Follow → toggles on
- Click again → toggles off
- Reload page → follow state persists
- Guest clicks Follow → redirected to login

**4. Data Validation:**
- Spot-check 5 orgs
- Verify campaign counts against database
- Verify social links are valid URLs
- Check for incorrect/missing data

**5. Edge Cases:**
- Invalid org slug → 404 page
- Org with no campaigns → empty state clear
- Very long descriptions → truncation/expansion works

**6. Cross-Browser/Mobile:**
- Chrome, Firefox, Safari, Edge
- Mobile at 375px (layout stacks correctly)
- Touch targets ≥44px

**7. Accessibility:**
- Keyboard navigation
- Screen reader announces org name
- Focus indicators visible
- Links properly labeled

**Deliverables:**
- Test results spreadsheet (20+ test cases)
- Data validation report
- Defect reports in JIRA
- **User guide:** "Understanding Organization Profiles"

**Dependencies:**
- Org profile pages deployed to staging
- Backend endpoints functional
- Sample orgs with campaigns seeded

**Definition of Done:**
- [ ] All test cases executed
- [ ] Data accuracy verified (≥95%)
- [ ] No P0/P1 defects
- [ ] Follow functionality works correctly
- [ ] Mobile and accessibility verified
- [ ] User guide created
- [ ] QA sign-off

---

### US-015: View Dashboard Overview - 8 Story Points

#### EGP-036: [FE] Build User Dashboard Overview
**Assignee:** Frontend Developer | **Story Points:** 3 | **Hours:** 12 | **Sprint:** 1

**Description:**
Create personalized dashboard showing user's advocacy activity and metrics.

**Core Requirements:**
- **Dashboard Layout:**
  - Welcome message with user's name
  - 4 metric cards in grid:
    - Messages Sent (count)
    - Legislators Contacted (unique count)
    - Response Rate (percentage, if available)
    - Active Follows (bills + orgs)
  - Activity trend chart (last 30 days, line/bar chart)
  - Recent activity list (last 5-10 actions)
  - Quick action buttons: "Send Message", "Find Campaigns", "Browse Bills"

- **Metric Cards:**
  - Large number display
  - Icon per metric
  - Small trend indicator (+/-% from previous period) [optional]
  - Click card → navigate to detailed view

- **Activity Trend Chart:**
  - X-axis: Days (last 30)
  - Y-axis: Message count
  - Simple line or bar chart
  - Use charting library (Recharts recommended)
  - Responsive (scales on mobile)

- **Recent Activity:**
  - List of latest actions:
    - "Sent message to Rep. Smith about H.R. 1234" (timestamp)
    - "Followed Common Cause" (timestamp)
    - "Watched H.R. 5678" (timestamp)
  - Maximum 10 items
  - Link to activity detail page
  - If no activity: "No recent activity. Get started by sending your first message!"

- **Empty State (New User):**
  - Welcome message: "Welcome to [Platform]! Get started by..."
  - Suggested actions: Browse bills, find campaigns, update profile
  - Visual guidance/illustration

**User Experience:**
- Fast load (<2s)
- Skeleton loaders for metrics and chart
- Responsive layout (grid → stack on mobile)
- Smooth animations on metric cards
- Mobile-friendly chart (touch to view data points)

**Error Scenarios:**
- API failure for metrics → Show "Unable to load" in affected cards
- Chart data fails → Show chart empty state
- Partial failure → Display loaded data + error for failed sections

**Testing:**
- Dashboard loads with all sections
- Metrics display correct counts
- Chart renders with data
- Recent activity list shows actions chronologically
- Empty state for new user
- Quick action buttons navigate correctly
- Mobile at 375px (cards stack, chart scales)
- Keyboard navigation
- Screen reader announces metrics

**Dependencies:**
- Backend: User activity summary endpoint
- Backend: Recent activity endpoint
- Charting library (Recharts)
- Design: Metric card and chart components

**Definition of Done:**
- [ ] Code merged to main
- [ ] All dashboard sections functional
- [ ] Metrics accurate
- [ ] Chart displays correctly
- [ ] Recent activity list works
- [ ] Empty state for new users
- [ ] No P0/P1 bugs
- [ ] TL approval
- [ ] Mobile tested
- [ ] Accessibility audit passes

---

#### EGP-037: [BE] Implement User Activity Aggregation Endpoints
**Assignee:** Backend Developer | **Story Points:** 3 | **Hours:** 12 | **Sprint:** 1

**Description:**
Build endpoints to aggregate and return user activity metrics and recent actions.

**Core Requirements:**

**1. Activity Summary Endpoint:**
- Endpoint: `GET /api/users/:userId/activity/summary` (authenticated)
- Returns aggregated metrics:
  - Messages sent (total count)
  - Unique legislators contacted (count)
  - Response rate (percentage, if tracking available)
  - Active follows (bills + organizations count)
  - Activity trend (daily counts for last 30 days)

**2. Recent Activity Endpoint:**
- Endpoint: `GET /api/users/:userId/activity/recent` (authenticated)
- Accept query parameter:
  - `limit`: Integer (default 10, max 50)
- Returns chronological list of recent actions with metadata

**3. Response Formats:**
```json
// Summary
{
  "messagesSent": 12,
  "uniqueLegislators": 8,
  "responseRate": 25.5,
  "activeFollows": 15,
  "activityTrend": [
    {"date": "2025-01-01", "count": 2},
    {"date": "2025-01-02", "count": 0},
    ...
  ]
}

// Recent Activity
{
  "activities": [
    {
      "id": "...",
      "type": "message_sent",
      "description": "Sent message to Rep. Smith about H.R. 1234",
      "timestamp": "...",
      "metadata": {...}
    }
  ]
}
```

**4. Aggregation Logic:**
- Query user_messages collection for counts
- Group by recipient for unique legislators count
- Calculate activity trend via daily aggregation (last 30 days)
- Query user_follows for active follows count
- Efficient queries using indexes
- Cache summary (TTL: 5 minutes)

**5. Performance:**
- Summary endpoint <300ms P95
- Use denormalized counts where possible
- Limit aggregations to recent data (e.g., last 6 months for trend)

**Error Handling:**
- User not found → 404
- Unauthenticated/wrong user → 401/403
- Database unavailable → try cache → 503
- Unexpected errors → log and return 500

**Testing:**
- Request summary → correct counts returned
- Activity trend → 30 days of data points
- Recent activity → chronological order
- New user (no activity) → zeros returned gracefully
- Caching: Second request faster (cache hit)
- Performance: Concurrent requests <300ms P95
- Integration: Dashboard displays correct data

**Dependencies:**
- user_messages collection
- user_follows collection
- Firestore indexes for aggregation queries
- Redis for caching

**Definition of Done:**
- [ ] Code merged to main
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] Aggregation logic verified
- [ ] Performance targets met
- [ ] API docs updated
- [ ] Firestore indexes created
- [ ] TL approval
- [ ] Deployed to staging

---

#### EGP-038: [PM] QA Dashboard and Validate Metrics
**Assignee:** Project Manager | **Story Points:** 1 | **Hours:** 4 | **Sprint:** 1

**Description:**
Test dashboard functionality, validate metric accuracy, verify charts and activity lists.

**Testing Scope:**

**1. Dashboard Display:**
- All sections render (metrics, chart, recent activity, quick actions)
- Layout responsive (desktop, tablet, mobile)
- Skeleton loaders during initial load
- Welcome message shows user's name

**2. Metrics Validation:**
- Create test user with known activity
- Send 5 messages → metric shows 5
- Contact 3 different legislators → unique count shows 3
- Follow 2 bills, 2 orgs → follows count shows 4
- Verify counts against database

**3. Activity Trend Chart:**
- Chart displays 30 days of data
- Data points align with actual activity dates
- Chart scales correctly on mobile
- Tooltip shows count on hover/touch

**4. Recent Activity:**
- List shows recent actions chronologically
- Action descriptions accurate
- Links to related items work
- New user → empty state with guidance

**5. Quick Actions:**
- All buttons navigate correctly
- "Send Message" → compose page
- "Find Campaigns" → campaigns page
- "Browse Bills" → bills page

**6. Edge Cases:**
- Brand new user (no activity) → empty state clear
- User with lots of activity → dashboard still loads fast
- API failure → graceful error handling

**7. Cross-Browser/Mobile:**
- Chrome, Firefox, Safari, Edge
- Mobile at 375px (cards stack, chart scales)
- Touch interactions work on mobile chart

**8. Accessibility:**
- Keyboard navigation through all elements
- Screen reader announces metrics
- Chart data accessible (data table alternative)
- Focus indicators visible

**Deliverables:**
- Test results spreadsheet (25+ test cases)
- Metrics validation report (manual counts vs displayed)
- Defect reports in JIRA
- **User guide:** "Understanding Your Dashboard"

**Dependencies:**
- Dashboard deployed to staging
- Backend endpoints functional
- Test users with various activity levels

**Definition of Done:**
- [ ] All test cases executed
- [ ] Metrics accuracy verified (100% match)
- [ ] No P0/P1 defects
- [ ] Chart functional and accurate
- [ ] Mobile and accessibility verified
- [ ] User guide created
- [ ] QA sign-off

---

*Sprint 1 contains 20 tickets (EGP-019 through EGP-038) totaling 42 story points and 200 hours. The next ticket ID is EGP-039 for Sprint 2.*

---

## Sprint 2: Messaging & News (Weeks 5-6)

**Sprint Goal:** Deliver advocacy messaging flows (anonymous and signed-in), AI-assisted drafting, and news discovery experiences
**Total Story Points:** 37
**Total Hours:** 224

### US-013: Send Advocacy Message - Basic Flows - 13 Story Points

#### EGP-039: [FE] Build Message Compose and Confirmation UI

**Role:** Frontend (FE)
**Story Points:** 13 (shared across US-013)
**Estimated Hours:** 20

**Description:**
Let users compose advocacy messages, select recipients, and send from both anonymous and signed-in states. Provide clear confirmation with delivery status and reference number.

**Core Requirements:**
- Message compose screen with stance selection (Support/Oppose)
- Recipient selection (Representative, Senator, or custom)
- Anonymous flow: collect sender name, email, address, ZIP
- Signed-in flow: pre-fill known user details from profile
- Confirmation screen showing delivery status and shareable reference number
- Form validation with inline error messaging
- Loading states during submission
- Success state with confirmation number prominently displayed

**User Experience:**
- Clear two-path experience: "Continue as Guest" or "Sign In"
- Anonymous users see required sender info fields
- Signed-in users see pre-filled fields (editable)
- Stance selection buttons (Support/Oppose) with visual feedback
- Recipient dropdown or selector (multiple recipients if applicable)
- Message textarea with character count
- "Send Message" button with loading spinner
- Confirmation screen with reference number, copy-to-clipboard button
- Option to share on social media or send another message

**Error Scenarios:**
- Required fields missing → inline validation messages, focus first error field
- Invalid email format → inline "Enter a valid email address"
- ZIP code invalid → inline "Enter a valid 5-digit ZIP code"
- Network timeout → retry button with "Connection timed out. Try again."
- Rate limit exceeded → banner "Too many messages. Try again later." with countdown if applicable
- Server error → generic "Something went wrong. Please try again."

**Testing:**
- Run Test IDs: MSG-1 (Anonymous Send), MSG-2 (Signed-In Send), MSG-3 (Validation Errors), MSG-4 (Rate Limit)
- Anonymous flow: compose → fill sender info → send → confirmation number displayed
- Signed-in flow: compose → pre-filled info → send → confirmation number displayed
- Invalid form: missing required fields → inline errors, inputs preserved
- Rate limit: exceed threshold → helpful message with retry guidance
- Cross-browser testing on desktop/mobile
- Accessibility: keyboard navigation, screen reader labels, focus management

**Dependencies:**
- US-018 (Login) complete for signed-in state
- US-019 (Profile) complete for pre-fill data
- EGP-040 (BE message processing) for submission endpoint

**Definition of Done:**
- [ ] Anonymous and signed-in compose flows functional
- [ ] Confirmation screen shows reference number
- [ ] All validation errors display inline with helpful copy
- [ ] Rate limiting handled with user-friendly messaging
- [ ] No P0/P1 defects
- [ ] Cross-browser tested (Chrome, Safari, Firefox, Mobile Safari, Mobile Chrome)
- [ ] Accessibility verified (keyboard, screen reader)
- [ ] Code reviewed and merged
- [ ] QA sign-off

---

#### EGP-040: [BE] Message Processing and Delivery Queue

**Role:** Backend (BE)
**Story Points:** 13 (shared across US-013)
**Estimated Hours:** 20

**Description:**
Accept message submissions from anonymous and authenticated users, validate inputs, queue for delivery, and record status with confirmation data.

**Core Requirements:**
- Submission endpoint: `POST /api/messages/send`
- Accept both anonymous (with sender info) and authenticated (session-based) requests
- Input validation: required fields, email format, ZIP format, payload size limits
- Generate unique confirmation number (e.g., MSG-XXXXXX)
- Queue message for delivery (e.g., SQS, Redis Queue, or similar)
- Record message with status: `queued`, `sent`, `failed`
- Return confirmation data: `{ confirmationNumber, status, recipientCount, queuedAt }`
- Rate limiting: per IP (anonymous) and per user (authenticated)
- Audit logging: message created events with userId/IP, recipients, stance

**User Experience:**
- API returns within 500ms for typical requests
- Confirmation number is human-readable and shareable
- Status is immediately available for tracking

**Error Scenarios:**
- Missing required fields → 400 with field-level errors `{ field: 'email', message: 'Email is required' }`
- Invalid email format → 400 `{ field: 'email', message: 'Enter a valid email address' }`
- Invalid ZIP → 400 `{ field: 'zip', message: 'Enter a valid 5-digit ZIP code' }`
- Payload too large → 413 "Message exceeds maximum length"
- Rate limit exceeded → 429 "Too many requests. Try again in X minutes."
- Queue failure → 500 "Unable to process message. Try again later."
- Unauthenticated request missing sender info → 400 with field errors

**Testing:**
- Unit tests: input validation, confirmation number generation, queue handling
- Integration tests: end-to-end send with mock delivery queue
- Anonymous send: valid payload → 200 with confirmation data, message queued
- Signed-in send: session + payload → 200 with confirmation data, pre-filled info used
- Invalid inputs: missing fields, bad formats → 400 with specific field errors
- Rate limiting: exceed limit → 429 with retry-after header
- Queue failure simulation: ensure graceful degradation and error logging

**Dependencies:**
- Delivery queue infrastructure (SQS, Redis, or equivalent)
- User authentication/session system from US-018
- Profile data access from US-019 for pre-fill

**Definition of Done:**
- [ ] Endpoint accepts anonymous and authenticated requests
- [ ] Confirmation number generated and returned
- [ ] Messages queued successfully with status tracking
- [ ] Input validation comprehensive and returns clear errors
- [ ] Rate limiting enforced (IP-based and user-based)
- [ ] Audit logging in place for all submissions
- [ ] No P0/P1 defects
- [ ] Unit and integration tests passing (>90% coverage)
- [ ] Performance: P95 latency <500ms
- [ ] Code reviewed and deployed to staging
- [ ] QA sign-off

---

#### EGP-041: [TL] Define Messaging Guardrails and Rate Limits

**Role:** Tech Lead (TL)
**Story Points:** 13 (shared across US-013)
**Estimated Hours:** 8

**Description:**
Establish safe defaults for messaging flows including rate limits, payload size limits, and PII handling to prevent abuse and ensure secure storage.

**Core Requirements:**
- Define rate limit thresholds:
  - Anonymous users: X messages per IP per hour/day
  - Authenticated users: Y messages per user per hour/day
  - Consider graduated limits for premium users (if applicable)
- Payload size limits: message body max characters, total request size
- PII handling and storage approach:
  - What sender info is stored vs. hashed
  - Retention periods for message data
  - Access controls for message records
- Queue and delivery retry policies
- Abuse detection patterns (e.g., repeated identical messages, spam keywords)

**User Experience:**
- Rate limits are fair and don't block legitimate users
- Error messages clearly explain limits and reset times
- Premium users (if applicable) get higher limits

**Error Scenarios:**
- Rate limit hit → user sees clear countdown to reset
- Payload too large → user sees character count warning before submission
- Suspected abuse → message flagged for review without blocking user immediately

**Testing:**
- Spot-check rate-limit responses in staging
- Verify payload validation rejects oversized requests
- Review PII handling against documented approach
- Confirm abuse detection doesn't produce false positives

**Dependencies:**
- US-017 (Account creation) for user identity
- US-019 (Profile) for PII handling patterns
- EGP-040 (BE message processing) for implementation

**Definition of Done:**
- [ ] Rate limit thresholds documented and reviewed with team
- [ ] Payload size limits defined and enforced
- [ ] PII handling and storage approach documented
- [ ] Abuse detection patterns defined (optional for Sprint 2)
- [ ] Retry and queue policies documented
- [ ] Team sign-off on guardrails
- [ ] Implementation validated in staging

---

#### EGP-042: [PM] QA Messaging Flows (Anonymous, Signed-In, Errors)

**Role:** Project Manager (PM)
**Story Points:** 13 (shared across US-013)
**Estimated Hours:** 8

**Description:**
Validate end-to-end messaging flows for anonymous and signed-in users, including error handling and edge cases.

**Core Requirements:**
- Create QA test scenarios covering:
  - Anonymous user: compose → fill sender info → send → confirmation
  - Signed-in user: compose → pre-filled info → send → confirmation
  - Form validation errors: missing fields, invalid formats
  - Rate limiting: exceed limit → helpful error message
  - Network errors: timeout, server error → retry options
- Execute scenarios on desktop (Chrome, Safari, Firefox) and mobile (iOS Safari, Android Chrome)
- Document defects with severity (P0/P1/P2/P3)
- Verify confirmation numbers are unique and trackable

**User Experience:**
- All scenarios pass without blockers
- Error messages are helpful and actionable
- Confirmation numbers are easy to copy and share

**Error Scenarios:**
- Critical defects (P0/P1) block QA sign-off
- P2/P3 defects are triaged for future sprints

**Testing:**
- Execute all scenarios on target browsers/devices
- Capture screenshots/videos for evidence
- Log defects in tracking system with reproduction steps
- Retest after fixes

**Dependencies:**
- EGP-039 (FE compose UI) complete
- EGP-040 (BE message processing) complete
- EGP-041 (TL guardrails) complete for rate limiting validation

**Definition of Done:**
- [ ] All test scenarios executed on desktop and mobile
- [ ] No P0/P1 defects remaining
- [ ] P2/P3 defects triaged and prioritized
- [ ] Test evidence captured (screenshots/videos)
- [ ] Confirmation number uniqueness verified
- [ ] User guide or help article drafted (optional)
- [ ] QA sign-off

---

### US-014: AI-Assisted Message Drafting - 8 Story Points

#### EGP-043: [FE] Build Draft Assistant Interface

**Role:** Frontend (FE)
**Story Points:** 8 (shared across US-014)
**Estimated Hours:** 8

**Description:**
Allow users to request AI-enhanced drafts with regeneration options. Build template-first approach where templates always work, and AI enhancement adds personalization when available.

**Core Requirements:**
- "AI Help" or "Get Draft Suggestion" button in compose screen
- Display suggested draft (template or AI-enhanced) in editable text area
- "Regenerate" button to cycle through templates or request new AI enhancement
- Loading state during draft generation
- Edit capability: user can modify suggested draft before accepting
- "Use This Draft" button to accept draft into message compose
- "Start from Scratch" option to clear and write manually
- Disclaimer: "AI-generated suggestions may need review" or similar

**User Experience:**
- One-click to request draft
- Templates return instantly (<100ms)
- AI enhancement adds personalization (2-3 seconds acceptable)
- User can regenerate multiple times to see different suggestions
- Clear visual distinction between template and AI-enhanced drafts (optional)
- Smooth transition from draft suggestion to compose

**Error Scenarios:**
- AI service unavailable → falls back to template gracefully, no error shown
- AI timeout → falls back to template, no user interruption
- No templates available → generic fallback message "Unable to generate suggestion"
- User at AI request cap → "You've reached your AI draft limit. Try again later." (with template still available)

**Testing:**
- Request draft → template or AI-enhanced draft displayed
- Regenerate multiple times → different suggestions shown
- Edit draft → changes preserved
- Accept draft → content copied to compose
- Start from scratch → draft cleared, compose empty
- AI service down → template fallback works seamlessly
- User at cap → template still works, AI blocked with helpful message
- Cross-browser and mobile testing

**Dependencies:**
- EGP-039 (FE compose UI) for integration point
- EGP-044 (BE draft service) for draft generation endpoint
- US-004 (Bill details) for bill context to enhance drafts

**Definition of Done:**
- [ ] Draft request UI functional
- [ ] Templates return instantly
- [ ] AI enhancement adds value when available
- [ ] Regenerate works across multiple requests
- [ ] Fallback to templates is seamless (no user-facing errors)
- [ ] Edit and accept flows functional
- [ ] Disclaimer copy approved and displayed
- [ ] No P0/P1 defects
- [ ] Cross-browser and mobile tested
- [ ] Code reviewed and merged
- [ ] QA sign-off

---

#### EGP-044: [BE] Template + AI Draft Service with Fallback

**Role:** Backend (BE)
**Story Points:** 8 (shared across US-014)
**Estimated Hours:** 20

**Description:**
Provide hybrid draft service that serves templates instantly and optionally enhances with AI. Templates always work; AI enhancement adds personalization when available.

**Core Requirements:**
- Template system: 10-15 message templates per bill position (Support/Oppose)
- Variable substitution: `{billNumber}`, `{billTitle}`, `{userName}`, `{representativeName}`, etc.
- Template endpoint: `GET /api/drafts/template?billId=X&stance=support` → returns template instantly
- AI enhancement endpoint: `POST /api/drafts/enhance` → sends template + bill context to AWS Bedrock, returns enhanced draft
- Fallback: if AI fails/times out, return original template
- Caching: AI-enhanced drafts cached in Redis for 24 hours (keyed by billId + stance)
- Rate limiting: AI requests count against user cap, templates don't count
- Return: `{ draft: string, source: 'template' | 'ai-enhanced', cachedUntil: timestamp }`

**User Experience:**
- Templates return <100ms
- AI enhancement returns within 3 seconds or falls back to template
- Cached AI drafts return instantly on subsequent requests

**Error Scenarios:**
- No template found for bill/stance → generic fallback template
- AI service unavailable → return template with `source: 'template'`
- AI timeout (>3s) → return template with `source: 'template'`
- User at AI cap → return template with message indicating limit reached
- Invalid billId → 400 "Invalid bill identifier"
- Redis cache miss → regenerate AI draft or serve template

**Testing:**
- Unit tests: template rendering, variable substitution, AI enhancement, fallback logic
- Integration tests: full flow with AI success, AI failure, AI timeout, caching
- Template request → returns instantly with all variables substituted
- AI request with valid billId → returns enhanced draft or template fallback
- AI service down → template returned, no errors
- Cache hit → AI draft returned instantly from Redis
- User at cap → template returned with appropriate message
- Performance: template <100ms, AI <3s, cached <50ms

**Dependencies:**
- AWS Bedrock or equivalent AI service configured
- Redis for caching
- Bill data from US-004 for context
- EGP-041 (TL guardrails) for AI rate limiting thresholds

**Definition of Done:**
- [ ] Template system with 10-15 templates per stance
- [ ] Variable substitution functional
- [ ] AI enhancement layer integrated with fallback to templates
- [ ] Caching in Redis for 24-hour TTL
- [ ] Rate limiting enforced (AI only, templates exempt)
- [ ] No P0/P1 defects
- [ ] Unit and integration tests passing (>90% coverage)
- [ ] Performance: templates <100ms, AI <3s or fallback
- [ ] Code reviewed and deployed to staging
- [ ] QA sign-off

---

#### EGP-045: [TL] Define AI Safety and Cost Controls

**Role:** Tech Lead (TL)
**Story Points:** 8 (shared across US-014)
**Estimated Hours:** 8

**Description:**
Bound AI usage within safe, predictable limits including request caps, output length limits, and content guardrails.

**Core Requirements:**
- Daily/hourly AI request caps per user:
  - Free users: X requests per day
  - Premium users: Y requests per day (if applicable)
  - Org users: Z requests per day (if applicable)
- Output length limits: max tokens/characters for AI responses
- Content guardrails:
  - Filter for sensitive/inappropriate content
  - Reject prompts that attempt to manipulate AI into off-topic responses
  - Logging for flagged content (for review, not blocking)
- Cost budgets: estimated monthly AI costs and monitoring
- Fallback policies: what happens when caps are hit, AI is unavailable, or costs spike

**User Experience:**
- Caps are generous enough for legitimate use
- Users see clear messaging when approaching or hitting caps
- Premium users (if applicable) get higher caps

**Error Scenarios:**
- User at cap → template still works, AI blocked with "You've reached your AI draft limit. Try again tomorrow."
- AI cost spike → automatic fallback to templates, alert sent to team
- Inappropriate content detected → flagged for review, template returned to user

**Testing:**
- Attempt requests exceeding cap → verify helpful messaging and template fallback
- Simulate cost spike → verify automatic fallback
- Review flagged content logs for false positives

**Dependencies:**
- EGP-044 (BE draft service) for implementation
- AWS Bedrock or equivalent AI service for cost monitoring
- EGP-041 (TL messaging guardrails) for pattern alignment

**Definition of Done:**
- [ ] AI request caps documented and reviewed with team
- [ ] Output length limits defined
- [ ] Content guardrails documented
- [ ] Cost budgets estimated and monitoring in place
- [ ] Fallback policies defined
- [ ] Team sign-off on safety controls
- [ ] Implementation validated in staging

---

#### EGP-046: [PM] Feature Walkthrough and Copy Review

**Role:** Project Manager (PM)
**Story Points:** 8 (shared across US-014)
**Estimated Hours:** 4

**Description:**
Ensure users understand the value and limitations of AI-assisted drafting. Review UI copy and confirm disclaimers are clear.

**Core Requirements:**
- Review all UI copy related to draft assistant:
  - "AI Help" button label
  - Draft suggestion display (e.g., "Here's a suggested draft:")
  - Regenerate button label
  - Disclaimer copy (e.g., "AI-generated suggestions may need review. Please verify before sending.")
  - Error messages when AI is unavailable or user is at cap
- Confirm disclaimers are prominent and clear
- Walkthrough feature with stakeholders for feedback
- Draft short user guide or help article (optional)

**User Experience:**
- Copy is consistent across all states (loading, success, error, fallback)
- Disclaimers are visible but not intrusive
- Users understand they can edit drafts before sending

**Error Scenarios:**
- Ambiguous copy → revise for clarity
- Missing disclaimer → add before feature launch

**Testing:**
- Execute demo script with stakeholders
- Gather feedback on copy clarity
- Validate disclaimers are visible in all scenarios (template, AI-enhanced, fallback)

**Dependencies:**
- EGP-043 (FE draft assistant UI) for copy integration
- EGP-044 (BE draft service) for feature functionality

**Definition of Done:**
- [ ] All UI copy reviewed and approved
- [ ] Disclaimers clear and prominent
- [ ] Demo script executed with stakeholders
- [ ] Feedback incorporated
- [ ] User guide drafted (optional)
- [ ] Stakeholder sign-off

---

### US-006: View Grouped News Story - 8 Story Points

#### EGP-047: [FE] Build News Story Page with Related Stories

**Role:** Frontend (FE)
**Story Points:** 8 (shared across US-006)
**Estimated Hours:** 12

**Description:**
Show a news story with grouped related items and a call-to-action to voice opinion.

**Core Requirements:**
- News story detail page: `/news/[storyId]`
- Story content: headline, source, publish date, body/summary
- Related stories section: list of 3-5 related stories with headlines and thumbnails
- "Voice Your Opinion" or "Take Action" CTA button
- CTA navigates to message compose with story context pre-filled
- Loading skeletons for story content and related stories
- Error state: "Story not found" for invalid storyId
- Mobile-responsive layout

**User Experience:**
- Story loads quickly with skeleton states
- Related stories are visually distinct but clearly connected
- CTA is prominent and actionable
- Clicking related story navigates to that story's detail page

**Error Scenarios:**
- Invalid storyId → 404 "Story not found" with link to news feed
- Fetch error → retry button with "Failed to load story. Try again."
- No related stories → hide related section or show "No related stories available"

**Testing:**
- Valid storyId → story content and related stories render
- Click related story → navigates to new story page
- Click "Voice Your Opinion" → navigates to compose with context
- Invalid storyId → 404 page displayed
- Fetch error → retry button functional
- No related stories → section hidden or empty state shown
- Cross-browser and mobile testing
- Accessibility: semantic HTML, alt text for images, keyboard navigation

**Dependencies:**
- EGP-048 (BE news retrieval) for story content endpoint
- EGP-039 (FE compose UI) for CTA navigation
- News feed from US-001 for navigation context

**Definition of Done:**
- [ ] Story page renders for valid storyId
- [ ] Related stories section displays 3-5 items
- [ ] "Voice Your Opinion" CTA navigates to compose
- [ ] Error states functional (404, fetch error)
- [ ] No P0/P1 defects
- [ ] Cross-browser and mobile tested
- [ ] Accessibility verified
- [ ] Code reviewed and merged
- [ ] QA sign-off

---

#### EGP-048: [BE] News Retrieval and Grouping Endpoints

**Role:** Backend (BE)
**Story Points:** 8 (shared across US-006)
**Estimated Hours:** 12

**Description:**
Provide endpoints for story content and related story grouping with performance and caching.

**Core Requirements:**
- Story detail endpoint: `GET /api/news/stories/:storyId` → returns story content
- Related stories endpoint: `GET /api/news/stories/:storyId/related?limit=5` → returns grouped related stories
- Response fields: `{ id, headline, source, publishedAt, summary, body, imageUrl, category }`
- Related stories: based on similarity (tags, category, keywords) and time window (e.g., last 7 days)
- Caching: 5-minute TTL for story detail, 10-minute TTL for related stories
- Cap related stories at 5 results
- Return within latency budget (P95 <500ms)

**User Experience:**
- Stories load quickly with caching
- Related stories are relevant and timely

**Error Scenarios:**
- Invalid storyId → 404 `{ error: 'Story not found' }`
- No related stories found → return empty array `{ related: [] }`
- Upstream news source unavailable → fallback to cached data or return 503 "News service temporarily unavailable"
- Timeout (>5s) → return 504 "Request timed out"

**Testing:**
- Unit tests: story retrieval, related story grouping logic, caching
- Integration tests: valid storyId → story content, related stories
- Invalid storyId → 404 with error message
- No related stories → empty array returned
- Cache hit → served from cache within TTL
- Upstream failure → fallback to cache or 503
- Performance: P95 latency <500ms

**Dependencies:**
- News data source/API integration
- Redis or equivalent for caching
- EGP-049 (TL grouping standards) for similarity criteria

**Definition of Done:**
- [ ] Story detail endpoint functional
- [ ] Related stories endpoint returns relevant results
- [ ] Caching implemented with appropriate TTLs
- [ ] Related stories capped at 5 results
- [ ] No P0/P1 defects
- [ ] Unit and integration tests passing (>90% coverage)
- [ ] Performance: P95 latency <500ms
- [ ] Code reviewed and deployed to staging
- [ ] QA sign-off

---

#### EGP-049: [TL] Define Content Grouping Standards

**Role:** Tech Lead (TL)
**Story Points:** 8 (shared across US-006)
**Estimated Hours:** 4

**Description:**
Establish consistent grouping rules and thresholds for related news stories.

**Core Requirements:**
- Grouping criteria:
  - Similarity threshold: what makes stories "related"? (e.g., shared tags, keywords, category, entities)
  - Time window: how recent must stories be to group? (e.g., last 7 days)
  - Maximum group size: how many related stories to show (e.g., 3-5)
- Fallback rules: what if no related stories meet criteria? (show none, show from broader category, etc.)
- Quality thresholds: minimum source credibility, exclude duplicates, etc.
- FE/BE alignment: ensure both sides use same criteria

**User Experience:**
- Related stories are genuinely relevant
- Time window ensures stories are timely
- No duplicate or low-quality stories shown

**Error Scenarios:**
- No stories meet criteria → empty related section or fallback to broader category
- All potential related stories are duplicates → filter duplicates, show unique stories

**Testing:**
- Spot-check grouped sets in staging
- Verify time window enforced (no stories older than X days)
- Confirm similarity threshold produces relevant results
- Validate FE and BE align on criteria

**Dependencies:**
- EGP-048 (BE news retrieval) for implementation
- News data source for tags/keywords/entities

**Definition of Done:**
- [ ] Grouping criteria documented (similarity, time window, max size)
- [ ] Fallback rules defined
- [ ] Quality thresholds documented
- [ ] FE/BE alignment confirmed
- [ ] Team sign-off on standards
- [ ] Implementation validated in staging

---

#### EGP-050: [PM] QA News Story Pages

**Role:** Project Manager (PM)
**Story Points:** 8 (shared across US-006)
**Estimated Hours:** 4

**Description:**
Validate news story pages for content accuracy, related story relevance, and link functionality.

**Core Requirements:**
- Create QA test scenarios covering:
  - Valid storyId → story content and related stories render
  - Click related story → navigates correctly
  - Click "Voice Your Opinion" → navigates to compose with context
  - Invalid storyId → 404 page shown
  - No related stories → empty state or section hidden
- Visual checks: layout, images, formatting
- Link validation: ensure no dead links
- Content accuracy: spot-check story content vs. source
- Execute scenarios on desktop and mobile

**User Experience:**
- All links functional
- Related stories are relevant
- No dead ends or broken navigation

**Error Scenarios:**
- Dead link found → log defect, fix before sign-off
- Irrelevant related stories → feedback to TL for grouping criteria adjustment

**Testing:**
- Execute all scenarios on target browsers/devices
- Capture screenshots for evidence
- Log defects with severity
- Retest after fixes

**Dependencies:**
- EGP-047 (FE news story page) complete
- EGP-048 (BE news retrieval) complete
- EGP-049 (TL grouping standards) complete

**Definition of Done:**
- [ ] All test scenarios executed
- [ ] No P0/P1 defects remaining
- [ ] Visual layout verified on desktop and mobile
- [ ] All links functional (no dead links)
- [ ] Related stories relevance validated
- [ ] Test evidence captured
- [ ] QA sign-off

---

### US-007: View AI News Overview - 5 Story Points

#### EGP-051: [FE] Build News Overview UI with Refresh

**Role:** Frontend (FE)
**Story Points:** 5 (shared across US-007)
**Estimated Hours:** 8

**Description:**
Present at-a-glance AI-generated overview of a topic with sources and refresh action.

**Core Requirements:**
- News overview section (could be on topic page or dedicated overview page)
- Display AI-generated summary (2-3 paragraphs)
- Sources list: show source names/links for attribution
- "Refresh" button to regenerate overview (respects cache TTL)
- Loading state during overview generation
- Timestamp: "Last updated: X minutes ago"
- Mobile-responsive layout

**User Experience:**
- Overview loads quickly (cached) or shows loading skeleton
- Summary is concise and readable
- Sources are clearly attributed with links
- Refresh button provides updated overview when cache expires

**Error Scenarios:**
- AI service unavailable → show cached overview with "Showing recent overview" message
- No cached overview available → show "Overview temporarily unavailable"
- Refresh too soon (within cache TTL) → show same overview with "Overview is up to date" message

**Testing:**
- Page load → overview displays with sources
- Click refresh → loading state, then updated overview (if cache expired)
- Refresh within cache TTL → same overview, "up to date" message
- AI service down → cached overview shown with message
- No cache available → "unavailable" message shown
- Click source link → opens source in new tab
- Cross-browser and mobile testing
- Accessibility: semantic HTML, readable font size, keyboard navigation

**Dependencies:**
- EGP-052 (BE overview generation) for overview endpoint
- Topic or category pages from US-002 for integration

**Definition of Done:**
- [ ] Overview displays AI-generated summary
- [ ] Sources list with attribution links
- [ ] Refresh button functional (respects cache)
- [ ] Loading and error states functional
- [ ] Timestamp shows last update time
- [ ] No P0/P1 defects
- [ ] Cross-browser and mobile tested
- [ ] Accessibility verified
- [ ] Code reviewed and merged
- [ ] QA sign-off

---

#### EGP-052: [BE] AI Overview Generation and Caching

**Role:** Backend (BE)
**Story Points:** 5 (shared across US-007)
**Estimated Hours:** 12

**Description:**
Generate and cache AI news overviews for topics with source attribution and TTL.

**Core Requirements:**
- Overview endpoint: `GET /api/news/overview?topic=immigration` → returns AI-generated summary
- AI generation: use AWS Bedrock or equivalent to summarize recent news on topic
- Response fields: `{ summary: string, sources: [{name, url}], generatedAt: timestamp, cachedUntil: timestamp }`
- Caching: 30-minute TTL in Redis (balance freshness vs. cost)
- Source extraction: include 3-5 source articles used for summary
- Fallback: if AI unavailable, return cached overview with flag `{ cached: true, stale: true }`
- Return within latency budget (P95 <2s for cached, <5s for fresh generation)

**User Experience:**
- Cached overviews return instantly (<100ms)
- Fresh overviews generate within 5 seconds
- Sources are credible and linked

**Error Scenarios:**
- AI service unavailable → return cached overview with `stale: true` flag
- No cached overview and AI down → 503 "Overview temporarily unavailable"
- Invalid topic → 400 "Invalid topic identifier"
- AI timeout (>5s) → return cached overview or 503
- No news found for topic → return "No recent news available for this topic"

**Testing:**
- Unit tests: AI integration, caching, source extraction
- Integration tests: fresh generation, cache hit, AI failure fallback
- Valid topic → returns summary with sources
- Cached request within TTL → served from cache <100ms
- Cache expired → AI generates fresh overview
- AI service down → cached overview returned with stale flag
- No cache + AI down → 503 error
- Performance: cached <100ms, fresh <5s

**Dependencies:**
- AWS Bedrock or equivalent AI service
- Redis for caching
- News data source for recent articles on topic
- EGP-045 (TL AI controls) for cost and safety alignment

**Definition of Done:**
- [ ] Overview endpoint functional
- [ ] AI generation integrated with fallback to cache
- [ ] Caching with 30-minute TTL
- [ ] Source extraction (3-5 sources per overview)
- [ ] No P0/P1 defects
- [ ] Unit and integration tests passing (>90% coverage)
- [ ] Performance: cached <100ms, fresh <5s
- [ ] Code reviewed and deployed to staging
- [ ] QA sign-off

---

#### EGP-053: [PM] UX and Copy Review for News Overview

**Role:** Project Manager (PM)
**Story Points:** 5 (shared across US-007)
**Estimated Hours:** 4

**Description:**
Ensure news overview is understandable, trustworthy, and clearly attributed.

**Core Requirements:**
- Review AI-generated summary for:
  - Clarity: is the summary easy to understand?
  - Neutrality: does it avoid bias or partisan language?
  - Accuracy: spot-check against source articles
- Review source attribution:
  - Are sources clearly visible?
  - Do links work and open correctly?
  - Are sources credible?
- Review copy for all states:
  - Loading: "Generating overview..."
  - Success: summary + sources
  - Error: "Overview temporarily unavailable"
  - Stale cache: "Showing recent overview"
- Walkthrough feature with stakeholders

**User Experience:**
- Summary is neutral and informative
- Sources are trustworthy and clearly attributed
- Copy is consistent across all states

**Error Scenarios:**
- Biased language detected → feedback to TL for content guardrails
- Low-quality sources → feedback to BE for source filtering

**Testing:**
- Spot-check multiple topics for summary quality
- Verify source links functional and credible
- Review all UI states (loading, success, error, stale)
- Execute demo script with stakeholders

**Dependencies:**
- EGP-051 (FE overview UI) complete
- EGP-052 (BE overview generation) complete

**Definition of Done:**
- [ ] Summary copy reviewed for clarity and neutrality
- [ ] Source attribution verified (links functional, sources credible)
- [ ] All UI states reviewed and approved
- [ ] Demo executed with stakeholders
- [ ] Feedback incorporated
- [ ] Stakeholder sign-off

---

### US-008: Take Action from News Story - 3 Story Points

#### EGP-054: [FE] Build CTA from News to Compose

**Role:** Frontend (FE)
**Story Points:** 3 (shared across US-008)
**Estimated Hours:** 4

**Description:**
Enable action (send message) directly from a news context with prefilled context.

**Core Requirements:**
- "Voice Your Opinion" or "Take Action" CTA button on news story pages
- CTA navigates to message compose: `/compose?context=news&newsId=X`
- Pass news context to compose (newsId, headline, related bill if applicable)
- Compose screen pre-fills message context (e.g., "Regarding: [News Headline]")
- User can edit or remove pre-filled context before sending
- Back button returns to news story without losing context

**User Experience:**
- One-click from news to compose
- Context is pre-filled but editable
- User can back out without losing place in news story

**Error Scenarios:**
- Invalid newsId → compose loads without pre-fill, user can still send message
- Missing context parameter → compose loads in default state

**Testing:**
- Click "Voice Your Opinion" on news story → navigates to compose with context
- Compose shows pre-filled context (newsId, headline)
- Edit pre-filled context → changes preserved
- Click back → returns to news story
- Invalid newsId → compose loads normally without pre-fill
- Multiple news stories → each pre-fills correct context
- Cross-browser and mobile testing

**Dependencies:**
- EGP-039 (FE compose UI) for navigation target
- EGP-047 (FE news story page) for CTA integration
- EGP-055 (BE prefill support) for context handling

**Definition of Done:**
- [ ] CTA button functional on news story pages
- [ ] Navigates to compose with newsId and headline
- [ ] Compose pre-fills context correctly
- [ ] User can edit or remove pre-fill
- [ ] Back button returns to news story
- [ ] No P0/P1 defects
- [ ] Cross-browser and mobile tested
- [ ] Code reviewed and merged
- [ ] QA sign-off

---

#### EGP-055: [BE] Prefill Support for News Context

**Role:** Backend (BE)
**Story Points:** 3 (shared across US-008)
**Estimated Hours:** 4

**Description:**
Accept prefilled context tokens for news-to-compose flow and validate/pass through to submission.

**Core Requirements:**
- Message submission endpoint accepts `context` field: `{ newsId, headline, relatedBillId }`
- Validate newsId exists (optional: could be lenient)
- Store context linkage: when message is sent, record that it originated from newsId
- Return context in message record for tracking: `{ messageId, context: { newsId, headline } }`
- No additional processing required; just pass through and record

**User Experience:**
- Context is preserved from news → compose → send
- Tracking allows analytics on news-driven advocacy

**Error Scenarios:**
- Invalid newsId → accept anyway, log warning (don't block message send)
- Missing context → message send proceeds normally without context

**Testing:**
- Unit tests: context validation, storage
- Integration tests: compose with newsId → send → context recorded in message
- Send with valid newsId → context stored in message record
- Send with invalid newsId → message sent, context logged with warning
- Send without context → message sent normally
- Verify context appears in message history/tracking

**Dependencies:**
- EGP-040 (BE message processing) for submission endpoint
- News data source for newsId validation (optional)

**Definition of Done:**
- [ ] Context field accepted in message submission
- [ ] newsId and headline stored with message
- [ ] Invalid newsId handled gracefully (don't block send)
- [ ] Context linkage tracked for analytics
- [ ] No P0/P1 defects
- [ ] Unit and integration tests passing
- [ ] Code reviewed and deployed to staging
- [ ] QA sign-off

---

#### EGP-056: [PM] Flow QA for News-to-Compose

**Role:** Project Manager (PM)
**Story Points:** 3 (shared across US-008)
**Estimated Hours:** 4

**Description:**
Validate frictionless transition from news story to message compose with context preserved.

**Core Requirements:**
- Create QA test scenarios covering:
  - Click "Voice Your Opinion" from news story → compose loads with context
  - Pre-filled context displays correctly (newsId, headline)
  - Edit pre-fill → changes preserved
  - Send message → context tracked in message record
  - Back button → returns to news story without losing place
  - Multiple news stories → each pre-fills correctly
- Execute scenarios on desktop and mobile
- Verify context tracking in message records (via admin or API check)

**User Experience:**
- All scenarios pass without blockers
- Context is preserved throughout flow
- No friction or confusion in handoff

**Error Scenarios:**
- Context not pre-filled → log defect, verify fix
- Back button loses place → log defect, verify fix
- Context not tracked → log defect, verify BE recording

**Testing:**
- Execute all scenarios on target browsers/devices
- Capture screenshots/videos for evidence
- Verify context in message records (backend check)
- Log defects with severity
- Retest after fixes

**Dependencies:**
- EGP-054 (FE news-to-compose CTA) complete
- EGP-055 (BE prefill support) complete
- EGP-039 (FE compose UI) complete

**Definition of Done:**
- [ ] All test scenarios executed
- [ ] Context pre-fill verified across multiple news stories
- [ ] Context tracked in message records
- [ ] No P0/P1 defects remaining
- [ ] Test evidence captured
- [ ] QA sign-off

---

*Sprint 2 contains 18 tickets (EGP-039 through EGP-056) totaling 37 story points and 224 hours. The next ticket ID is EGP-057 for Sprint 3.*

---

## Sprint 3: Voter Verification, Premium Features & Early Organization Tools (Weeks 7-8)

**Sprint Goal:** Deliver voter verification with L2 Political, premium analytics, email verification, state bill details, and foundational organization profile/team management
**Total Story Points:** 41
**Total Hours:** 188

### US-016: Verify Voter Registration (L2 Political) - 13 Story Points

#### EGP-057: [FE] Build Voter Verification Flow UI

**Role:** Frontend (FE)
**Story Points:** 13 (shared across US-016)
**Estimated Hours:** 20

**Description:**
Let users check their voter registration status with clear results and actionable guidance.

**Core Requirements:**
- Verification form with inputs: name, address, DOB year
- Result states: verified, not found, ambiguous match, error
- Save verification status to user profile on success
- Display congressional and state districts when verified
- Actionable guidance for non-verified users (e.g., "Register to vote" links)

**User Experience:**
- Simple form with clear field labels
- Loading state during verification lookup
- Result screen shows verification status with visual indicator (checkmark, warning, error icon)
- Verified: show "You're registered! Your districts: [CD-X], [State District]"
- Not found: show "We couldn't find your registration. [Register here]"
- Ambiguous: show "We found multiple matches. Please verify your information."
- Verification status badge on profile page

**Error Scenarios:**
- Required field missing → inline "This field is required"
- Invalid DOB year → inline "Enter a valid year (e.g., 1990)"
- Provider timeout → "Verification service is slow. Try again." with retry button
- Provider error → "Unable to verify at this time. Try again later."
- Rate limit exceeded → "Too many attempts. Try again in [X] minutes."

**Testing:**
- Verified flow: fill form → verified result → districts displayed → status saved to profile
- Not found flow: fill form → not found result → registration link shown
- Ambiguous flow: fill form → ambiguous result → guidance to verify info
- Error handling: timeout, provider error, rate limit
- Cross-browser and mobile testing
- Accessibility: form labels, result screen readable by screen reader

**Dependencies:**
- US-019 (Profile) for saving verification status
- EGP-058 (BE verification endpoint) for lookup API
- L2 Political data provider integration

**Definition of Done:**
- [ ] Verification form functional with all input validation
- [ ] All result states render correctly (verified, not found, ambiguous, error)
- [ ] Verification status saved to profile on success
- [ ] Districts displayed when verified
- [ ] Actionable guidance for non-verified users
- [ ] No P0/P1 defects
- [ ] Cross-browser and mobile tested
- [ ] Accessibility verified
- [ ] Code reviewed and merged
- [ ] QA sign-off

---

#### EGP-058: [BE] Voter Verification Endpoint and L2 Political Integration

**Role:** Backend (BE)
**Story Points:** 13 (shared across US-016)
**Estimated Hours:** 20

**Description:**
Submit voter verification lookups to L2 Political and normalize responses to standard result types.

**Core Requirements:**
- Verification endpoint: `POST /api/voter/verify`
- Accept inputs: name, address, city, state, ZIP, DOB year
- Integrate with L2 Political API for verification lookup
- Map L2 responses to standard result types: `verified`, `not_found`, `ambiguous`, `error`
- Persist verification metadata: status, verifiedAt, districts (congressional, state)
- Update user profile with verification status and districts
- Rate limiting: per user and per IP
- PII minimization: hash sensitive fields, limit retention

**User Experience:**
- API returns within 3 seconds for typical requests
- Clear result types for easy FE rendering

**Error Scenarios:**
- Missing required fields → 400 with field-level errors
- Invalid inputs → 400 "Invalid [field]: [specific error]"
- L2 Political API timeout → 503 "Verification service unavailable"
- L2 Political API error → 503 with retry-after hint
- Rate limit exceeded → 429 "Too many verification attempts"
- No match found → 200 with `{ status: 'not_found' }`
- Ambiguous match → 200 with `{ status: 'ambiguous', matchCount: N }`

**Testing:**
- Unit tests: input validation, L2 response mapping, PII handling
- Integration tests: L2 sandbox lookup with verified/not_found/ambiguous responses
- Verified result → profile updated with status and districts
- Not found → status saved, no districts
- Ambiguous → status saved with match count
- Rate limiting: exceed limit → 429 response
- L2 API down → graceful 503 with retry hint
- Performance: P95 latency <3s

**Dependencies:**
- L2 Political API credentials and sandbox access
- User profile model from US-019
- EGP-059 (TL data privacy) for PII handling rules

**Definition of Done:**
- [ ] Endpoint accepts verification inputs
- [ ] L2 Political integration functional
- [ ] Response mapping to standard result types
- [ ] Profile updated with verification status and districts
- [ ] Rate limiting enforced
- [ ] PII minimization implemented (hashing, limited retention)
- [ ] No P0/P1 defects
- [ ] Unit and integration tests passing (>90% coverage)
- [ ] Performance: P95 latency <3s
- [ ] Code reviewed and deployed to staging
- [ ] QA sign-off

---

#### EGP-059: [TL] Define Data Privacy and Rate Limits for Voter Verification

**Role:** Tech Lead (TL)
**Story Points:** 13 (shared across US-016)
**Estimated Hours:** 8

**Description:**
Ensure voter verification respects privacy and provider limits with data minimization and rate limiting.

**Core Requirements:**
- Define data minimization approach:
  - What fields are required vs. optional
  - What fields are hashed vs. stored plaintext
  - Retention periods for verification attempts and results
- Set rate limits:
  - Per user: X verifications per day
  - Per IP: Y verifications per hour (for anonymous attempts if applicable)
  - Provider limits: respect L2 Political API rate limits
- PII handling:
  - Access controls: who can view verification data
  - Logging: what verification events are logged, how PII is redacted
  - Audit trail: track verification attempts for abuse detection

**User Experience:**
- Users see only necessary fields in verification form
- Rate limits are generous for legitimate use
- Clear messaging when rate limited

**Error Scenarios:**
- User at rate limit → "You've reached your verification limit. Try again tomorrow."
- Provider rate limit → automatic retry with backoff, user sees generic error

**Testing:**
- Review data minimization against documented approach
- Spot-check rate limit enforcement
- Verify PII redaction in logs
- Confirm audit trail captures verification attempts

**Dependencies:**
- EGP-058 (BE verification endpoint) for implementation
- L2 Political API documentation for provider limits
- US-019 (Profile) for PII handling patterns

**Definition of Done:**
- [ ] Data minimization documented (required fields, hashing, retention)
- [ ] Rate limits defined (per user, per IP, provider limits)
- [ ] PII handling and access controls documented
- [ ] Logging and audit requirements defined
- [ ] Team sign-off on privacy approach
- [ ] Implementation validated in staging

---

#### EGP-060: [PM] QA Voter Verification Flow and Support Copy

**Role:** Project Manager (PM)
**Story Points:** 13 (shared across US-016)
**Estimated Hours:** 8

**Description:**
Ensure verification results are understandable and actionable, with support guidance for edge cases.

**Core Requirements:**
- Create QA test scenarios covering:
  - Verified flow: form → verified result → districts saved
  - Not found flow: form → not found result → registration guidance
  - Ambiguous flow: form → ambiguous result → clarity guidance
  - Error handling: timeout, provider error, rate limit
- Review result copy for clarity:
  - Verified: "You're registered to vote!"
  - Not found: "We couldn't find your registration."
  - Ambiguous: "We found multiple potential matches."
- Create support note for edge cases:
  - What if verification fails?
  - What if districts are wrong?
  - How to update registration

**User Experience:**
- All result messages are clear and actionable
- Support guidance helps users resolve issues

**Error Scenarios:**
- Copy unclear → revise for clarity
- Missing edge case guidance → add to support note

**Testing:**
- Execute all scenarios on desktop and mobile
- Verify result copy clarity with stakeholders
- Test edge cases (moved recently, name change, etc.)
- Capture test evidence

**Dependencies:**
- EGP-057 (FE verification UI) complete
- EGP-058 (BE verification endpoint) complete
- EGP-059 (TL privacy) complete

**Definition of Done:**
- [ ] All test scenarios executed
- [ ] Result copy reviewed and approved
- [ ] Support note created for edge cases
- [ ] No P0/P1 defects
- [ ] Test evidence captured
- [ ] QA sign-off

---

### US-024: View Advocacy Impact Analytics (Premium) - 5 Story Points

#### EGP-061: [FE] Build Premium Analytics Dashboard

**Role:** Frontend (FE)
**Story Points:** 5 (shared across US-024)
**Estimated Hours:** 8

**Description:**
Show premium users their advocacy impact metrics and trends.

**Core Requirements:**
- Premium-only analytics page (restrict access by membership tier)
- Metrics tiles: messages sent, contacts reached, response rate
- Time-series chart: actions over time (monthly trend)
- Delivery rate chart: sent, delivered, bounced percentages
- Loading states and empty state for new premium users

**User Experience:**
- Clean dashboard layout with cards for each metric
- Charts load with smooth animations
- Empty state: "Start sending messages to see your impact!"
- Premium badge or indicator on navigation

**Error Scenarios:**
- Non-premium user accesses → redirect to membership page
- Data fetch error → retry button with "Failed to load analytics"
- No data available → empty state with CTA to send first message

**Testing:**
- Premium user → analytics load and display correctly
- Non-premium user → redirected to membership page
- Empty state → shown for new premium users
- Charts render correctly with sample data
- Cross-browser and mobile testing

**Dependencies:**
- US-020 (Premium membership) for tier check
- EGP-062 (BE analytics aggregation) for data endpoint

**Definition of Done:**
- [ ] Premium-only access enforced
- [ ] Metrics tiles display correctly
- [ ] Charts render with sample data
- [ ] Empty state shown for new users
- [ ] No P0/P1 defects
- [ ] Cross-browser and mobile tested
- [ ] Code reviewed and merged
- [ ] QA sign-off

---

#### EGP-062: [BE] Analytics Aggregation for Premium Users

**Role:** Backend (BE)
**Story Points:** 5 (shared across US-024)
**Estimated Hours:** 8

**Description:**
Aggregate user advocacy metrics and return summary for premium analytics.

**Core Requirements:**
- Analytics endpoint: `GET /api/analytics/impact` (premium-only)
- Aggregate data: messages sent, contacts reached, delivery status counts, monthly trend
- Return fields: `{ totalMessages, totalContacts, deliveryRate, monthlyTrend: [{month, count}] }`
- Time window: last 12 months
- Caching: 1-hour TTL for premium analytics
- Ensure only premium users can access

**User Experience:**
- API returns within 500ms for typical requests
- Data reflects user's actual advocacy activity

**Error Scenarios:**
- Non-premium user → 403 "Premium membership required"
- No data → return zeros with empty trend array
- Aggregation timeout → 503 "Analytics temporarily unavailable"

**Testing:**
- Unit tests: aggregation logic, tier check
- Integration tests: premium user → data returned, non-premium → 403
- Premium user with data → correct aggregations
- Premium user with no data → zeros returned
- Cache hit → served from cache <100ms
- Performance: P95 latency <500ms

**Dependencies:**
- US-020 (Premium membership) for tier check
- Message data from US-013 for aggregation
- Redis for caching

**Definition of Done:**
- [ ] Endpoint aggregates user metrics correctly
- [ ] Premium-only access enforced (403 for non-premium)
- [ ] Caching with 1-hour TTL
- [ ] Handles empty data gracefully
- [ ] No P0/P1 defects
- [ ] Unit and integration tests passing (>90% coverage)
- [ ] Performance: P95 latency <500ms
- [ ] Code reviewed and deployed to staging
- [ ] QA sign-off

---

#### EGP-063: [PM] Validate Premium Analytics Metrics

**Role:** Project Manager (PM)
**Story Points:** 5 (shared across US-024)
**Estimated Hours:** 4

**Description:**
Ensure premium analytics metrics are clear, accurate, and useful.

**Core Requirements:**
- Validate metric accuracy:
  - Compare displayed metrics to raw message data
  - Spot-check delivery rates against provider data
  - Verify monthly trend matches expected timeline
- Draft explainer copy for each metric:
  - "Messages Sent: Total advocacy messages you've sent"
  - "Contacts Reached: Unique representatives contacted"
  - "Delivery Rate: Percentage of messages successfully delivered"
- Review empty state copy and CTA

**User Experience:**
- Metrics are self-explanatory
- No discrepancies in data (within rounding)
- Empty state encourages first action

**Error Scenarios:**
- Metric mismatch → log defect, verify aggregation logic
- Unclear copy → revise for clarity

**Testing:**
- Spot-check metrics for 3-5 premium users
- Verify delivery rate calculation
- Review explainer copy with stakeholders
- Test empty state for new premium user

**Dependencies:**
- EGP-061 (FE analytics dashboard) complete
- EGP-062 (BE analytics aggregation) complete

**Definition of Done:**
- [ ] Metrics accuracy validated (spot-checks match)
- [ ] Explainer copy drafted and approved
- [ ] Empty state copy reviewed
- [ ] No P0/P1 defects
- [ ] Stakeholder sign-off

---

### EMAIL-001: Account Creation & Verification - 5 Story Points

#### EGP-064: [FE] Wire Account Verification Email Triggers

**Role:** Frontend (FE)
**Story Points:** 5 (shared across EMAIL-001)
**Estimated Hours:** 4

**Description:**
Ensure account creation triggers verification email and shows on-screen confirmation.

**Core Requirements:**
- On signup success, trigger verification email send (via BE endpoint)
- Display on-screen confirmation: "We've sent a verification email to [email]. Check your inbox."
- Verification pending state: show banner "Please verify your email" until verified
- Resend verification button (with rate limiting: 1 per 5 minutes)

**User Experience:**
- Clear confirmation message after signup
- Verification pending banner visible on all pages until verified
- Resend button functional with rate limit feedback

**Error Scenarios:**
- Email send fails → show warning "Email not sent. Click to resend."
- Resend too soon → button disabled with countdown "Resend in [X] seconds"
- Already verified → hide verification banner

**Testing:**
- Signup → verification email sent, confirmation shown
- Verification pending → banner visible on all pages
- Click resend → email sent again (rate limited)
- Verify email (via link) → banner disappears
- Cross-browser and mobile testing

**Dependencies:**
- US-017 (Account creation) for signup flow
- EGP-065 (BE verification email send) for email endpoint

**Definition of Done:**
- [ ] Verification email triggered on signup
- [ ] On-screen confirmation displayed
- [ ] Verification pending banner functional
- [ ] Resend button with rate limiting
- [ ] No P0/P1 defects
- [ ] Cross-browser and mobile tested
- [ ] Code reviewed and merged
- [ ] QA sign-off

---

#### EGP-065: [BE] Send Verification Emails and Record Status

**Role:** Backend (BE)
**Story Points:** 5 (shared across EMAIL-001)
**Estimated Hours:** 12

**Description:**
Send account verification emails and update user status on verification completion.

**Core Requirements:**
- Send verification email on signup (triggered by FE or signup endpoint directly)
- Email contains verification link with token (expires in 24 hours)
- Verification endpoint: `GET /api/auth/verify?token=X` → validates token, updates status
- Update user status: `emailVerified: true`, `verifiedAt: timestamp`
- Resend endpoint: `POST /api/auth/resend-verification` (rate limited: 1 per 5 minutes)
- Email template: subject "Verify your account", body with verification button/link

**User Experience:**
- Email arrives within 1 minute of signup
- Verification link works and redirects to app with success message
- Resend works if email not received

**Error Scenarios:**
- Invalid token → 400 "Invalid or expired verification link"
- Expired token (>24 hours) → 400 "Verification link expired. Request a new one."
- Already verified → 200 "Email already verified"
- Resend rate limit → 429 "Too many requests. Try again in [X] minutes."
- Email service down → queue for retry, return 200 (don't fail signup)

**Testing:**
- Unit tests: token generation, validation, status update, rate limiting
- Integration tests: signup → email sent, verify token → status updated
- Signup → verification email sent with valid token
- Click verification link → token validated, status updated, redirect to app
- Resend → new email sent (rate limited)
- Expired token → error message, resend option
- Email service down → queued for retry, signup succeeds

**Dependencies:**
- Email service (SendGrid, AWS SES, or equivalent)
- US-017 (Account creation) for user model
- EGP-041 (TL messaging guardrails) for rate limiting patterns

**Definition of Done:**
- [ ] Verification email sent on signup
- [ ] Token-based verification functional (24-hour expiry)
- [ ] Status updated on successful verification
- [ ] Resend endpoint with rate limiting (1 per 5 min)
- [ ] Email template approved
- [ ] No P0/P1 defects
- [ ] Unit and integration tests passing (>90% coverage)
- [ ] Email service integration tested
- [ ] Code reviewed and deployed to staging
- [ ] QA sign-off

---

#### EGP-066: [PM] QA Email Verification Flow

**Role:** Project Manager (PM)
**Story Points:** 5 (shared across EMAIL-001)
**Estimated Hours:** 4

**Description:**
Validate end-to-end email verification UX and deliverability.

**Core Requirements:**
- Create QA test scenarios covering:
  - Signup → verification email received → click link → verified
  - Resend verification → new email received
  - Expired token → error message, resend option
  - Already verified → banner hidden, no resend needed
- Inbox testing across providers (Gmail, Outlook, Yahoo, mobile)
- Email content review: subject, body, CTA button, branding

**User Experience:**
- Email arrives promptly (<1 minute)
- Email content is clear and professional
- Verification link works on first click
- No spam/junk folder issues

**Error Scenarios:**
- Email in spam → note provider, adjust content/headers
- Link doesn't work → log defect, verify token handling
- Resend doesn't arrive → check rate limiting, email service status

**Testing:**
- Execute all scenarios on desktop and mobile
- Inbox testing across 3-5 email providers
- Verify email content (subject, body, link)
- Test expired token flow
- Capture test evidence (screenshots of emails, verification screens)

**Dependencies:**
- EGP-064 (FE verification triggers) complete
- EGP-065 (BE verification email send) complete

**Definition of Done:**
- [ ] All test scenarios executed
- [ ] Email delivered to inbox (not spam) across providers
- [ ] Email content reviewed and approved
- [ ] Verification link functional
- [ ] No P0/P1 defects
- [ ] Test evidence captured
- [ ] QA sign-off

---

### US-005: View Texas State Bill Details - 5 Story Points

#### EGP-067: [FE] Build State Bill Detail Page

**Role:** Frontend (FE)
**Story Points:** 5 (shared across US-005)
**Estimated Hours:** 4

**Description:**
Show core details for state bills (Texas at launch) with similar structure to federal bills.

**Core Requirements:**
- State bill detail page: `/state/[state]/bill/[billId]` (e.g., `/state/tx/bill/HB1`)
- Display: title, bill number, status, latest action, sponsors, summary, text links
- "Voice Your Opinion" CTA (navigates to compose with state bill context)
- Loading skeletons and error states
- Mobile-responsive layout

**User Experience:**
- Page structure similar to federal bill page (US-004) for consistency
- Clear indication this is a state bill (e.g., "Texas HB 1")
- CTA is prominent and functional

**Error Scenarios:**
- Invalid billId → 404 "State bill not found"
- Fetch error → retry button "Failed to load bill. Try again."
- No summary available → hide summary section or show "Summary not available"

**Testing:**
- Valid billId → page renders with all sections
- Click "Voice Your Opinion" → navigates to compose with state bill context
- Invalid billId → 404 page
- Fetch error → retry button functional
- Cross-browser and mobile testing
- Accessibility: semantic HTML, readable structure

**Dependencies:**
- US-004 (Federal bill details) for page structure patterns
- EGP-068 (BE state bill endpoint) for data
- EGP-039 (FE compose UI) for CTA navigation

**Definition of Done:**
- [ ] State bill page renders for valid billId
- [ ] All sections displayed (title, status, sponsors, summary, links)
- [ ] "Voice Your Opinion" CTA functional
- [ ] Error states functional (404, fetch error)
- [ ] No P0/P1 defects
- [ ] Cross-browser and mobile tested
- [ ] Accessibility verified
- [ ] Code reviewed and merged
- [ ] QA sign-off

---

#### EGP-068: [BE] State Bill Data Endpoint

**Role:** Backend (BE)
**Story Points:** 5 (shared across US-005)
**Estimated Hours:** 8

**Description:**
Retrieve and normalize state bill data (Texas at launch) with caching and error fallback.

**Core Requirements:**
- State bill endpoint: `GET /api/bills/state/:state/:billId` → returns normalized bill data
- Integrate with state bill data source (LegiScan or equivalent)
- Response fields: `{ id, state, billNumber, title, status, latestAction, sponsors: [], summary, textLinks: [] }`
- Caching: 1-hour TTL for state bills
- Fallback: return cached data if upstream unavailable

**User Experience:**
- Bills load quickly with caching
- Data is normalized and consistent with federal bill structure

**Error Scenarios:**
- Invalid billId → 404 `{ error: 'Bill not found' }`
- Invalid state → 400 `{ error: 'Invalid state code' }`
- Upstream source unavailable → return cached bill with `{ cached: true, stale: true }` flag
- No cached data + upstream down → 503 "Bill data temporarily unavailable"

**Testing:**
- Unit tests: data normalization, caching
- Integration tests: valid billId → data returned, invalid billId → 404
- Valid billId → normalized bill data
- Cache hit → served from cache <100ms
- Upstream failure → cached data returned with stale flag
- Performance: P95 latency <500ms

**Dependencies:**
- State bill data source (LegiScan API or equivalent)
- Redis for caching
- EGP-069 (TL state data guardrails) for sync cadence

**Definition of Done:**
- [ ] Endpoint retrieves state bill data
- [ ] Data normalized to consistent structure
- [ ] Caching with 1-hour TTL
- [ ] Fallback to cached data on upstream failure
- [ ] No P0/P1 defects
- [ ] Unit and integration tests passing (>90% coverage)
- [ ] Performance: P95 latency <500ms
- [ ] Code reviewed and deployed to staging
- [ ] QA sign-off

---

#### EGP-069: [TL] Define State Bill Data Guardrails

**Role:** Tech Lead (TL)
**Story Points:** 5 (shared across US-005)
**Estimated Hours:** 4

**Description:**
Set limits and expectations for state bill data sync and volume.

**Core Requirements:**
- Define sync frequency: how often to sync state bill data from source
  - Initial: daily sync for active bills
  - Ongoing: sync on-demand for bill detail page views
- Volume bounds: which bills to sync (active session bills only? all bills?)
- Data retention: how long to cache state bill data
- Multi-state plan: roadmap for adding more states beyond Texas

**User Experience:**
- State bills are up-to-date (synced daily or on-demand)
- Performance is acceptable even with multiple states

**Error Scenarios:**
- Sync fails → use cached data, retry later
- Volume exceeds limit → prioritize active/recent bills

**Testing:**
- Review sync plan with team
- Verify daily sync or on-demand sync working
- Confirm data retention policy

**Dependencies:**
- EGP-068 (BE state bill endpoint) for implementation
- State bill data source documentation

**Definition of Done:**
- [ ] Sync frequency documented (daily or on-demand)
- [ ] Volume bounds defined
- [ ] Data retention policy documented
- [ ] Multi-state roadmap outlined
- [ ] Team sign-off on plan
- [ ] Implementation validated in staging

---

#### EGP-070: [PM] QA State Bill Pages

**Role:** Project Manager (PM)
**Story Points:** 5 (shared across US-005)
**Estimated Hours:** 4

**Description:**
Validate state bill page accuracy and consistency.

**Core Requirements:**
- Spot-check Texas bills against source data (LegiScan or state website)
- Verify all sections render correctly (title, status, sponsors, summary)
- Test "Voice Your Opinion" CTA navigation
- Compare to federal bill page for consistency

**User Experience:**
- State bill data is accurate
- Page structure is consistent with federal bills
- No critical content mismatches

**Error Scenarios:**
- Data mismatch → log defect, verify normalization
- Missing section → check source data availability

**Testing:**
- Spot-check 5-10 Texas bills for accuracy
- Verify all sections present
- Test CTA navigation
- Compare layout to federal bill page
- Capture test evidence

**Dependencies:**
- EGP-067 (FE state bill page) complete
- EGP-068 (BE state bill endpoint) complete

**Definition of Done:**
- [ ] Spot-checks completed (5-10 bills)
- [ ] Data accuracy verified
- [ ] All sections functional
- [ ] CTA navigation tested
- [ ] No P0/P1 defects
- [ ] Test evidence captured
- [ ] QA sign-off

---

### ORG-002: View & Edit Organization Profile - 5 Story Points

#### EGP-071: [FE] Build Organization Profile Editor

**Role:** Frontend (FE)
**Story Points:** 5 (shared across ORG-002)
**Estimated Hours:** 8

**Description:**
Enable organization admins to update org information (name, logo, description, links).

**Core Requirements:**
- Org profile edit page (admin-only): `/partners/profile/edit`
- Editable fields: name, logo (upload), description, website, social links (Twitter, Facebook)
- Preview mode: show how profile will appear publicly
- Save/cancel buttons with confirmation
- Success message: "Profile updated successfully"

**User Experience:**
- Clean form layout with clear field labels
- Logo upload with preview (max 2MB, JPG/PNG)
- Character count for description (max 500 chars)
- Preview toggle to see public view
- Changes persist immediately on save

**Error Scenarios:**
- Required field missing → inline "This field is required"
- Logo too large → "Logo must be under 2MB"
- Invalid URL → "Enter a valid website URL"
- Unauthorized user → redirect to org login
- Save error → "Failed to save. Try again." with retry

**Testing:**
- Admin user → profile editor loads with current data
- Edit fields → preview updates
- Save → profile updated, success message shown
- Non-admin user → redirected to login
- Invalid inputs → inline validation messages
- Cross-browser and mobile testing

**Dependencies:**
- ORG-001 (Org login) for admin authentication
- EGP-072 (BE org profile endpoints) for save API
- US-010 (View org profile) for public display

**Definition of Done:**
- [ ] Profile editor functional for admin users
- [ ] All fields editable with validation
- [ ] Logo upload with preview
- [ ] Preview mode shows public view
- [ ] Save/cancel functional
- [ ] No P0/P1 defects
- [ ] Cross-browser and mobile tested
- [ ] Code reviewed and merged
- [ ] QA sign-off

---

#### EGP-072: [BE] Organization Profile Update Endpoints

**Role:** Backend (BE)
**Story Points:** 5 (shared across ORG-002)
**Estimated Hours:** 8

**Description:**
Provide endpoints to read and update organization profiles with validation.

**Core Requirements:**
- Read endpoint: `GET /api/orgs/:orgId/profile` → returns org profile (public or admin view)
- Update endpoint: `PUT /api/orgs/:orgId/profile` (admin-only) → updates org profile
- Accept fields: name, logo (URL after upload), description, website, socialLinks: { twitter, facebook }
- Input validation: required fields, URL format, description length, logo file size
- Audit trail: log profile edits with who/when/what changed
- Unauthorized users blocked (403)

**User Experience:**
- API returns within 500ms
- Changes reflected immediately in public view

**Error Scenarios:**
- Unauthorized user → 403 "Admin access required"
- Missing required field → 400 `{ field: 'name', message: 'Name is required' }`
- Invalid URL → 400 `{ field: 'website', message: 'Invalid URL format' }`
- Description too long → 400 "Description exceeds 500 characters"
- Logo upload fails → 500 "Failed to upload logo. Try again."

**Testing:**
- Unit tests: validation, authorization, audit logging
- Integration tests: admin update → profile saved, non-admin → 403
- Admin user → profile updated successfully
- Non-admin user → 403 error
- Invalid inputs → 400 with field errors
- Audit trail → edits logged with timestamp and user

**Dependencies:**
- ORG-001 (Org login) for admin session
- File upload service (S3 or equivalent) for logo
- EGP-073 (TL content guidelines) for validation rules

**Definition of Done:**
- [ ] Read endpoint returns org profile
- [ ] Update endpoint functional (admin-only)
- [ ] Input validation comprehensive
- [ ] Audit trail logging edits
- [ ] Unauthorized users blocked (403)
- [ ] No P0/P1 defects
- [ ] Unit and integration tests passing (>90% coverage)
- [ ] Performance: P95 latency <500ms
- [ ] Code reviewed and deployed to staging
- [ ] QA sign-off

---

#### EGP-073: [TL] Define Organization Content Guidelines

**Role:** Tech Lead (TL)
**Story Points:** 5 (shared across ORG-002)
**Estimated Hours:** 4

**Description:**
Define acceptable fields and moderation triggers for organization profiles.

**Core Requirements:**
- Field validation rules:
  - Name: 2-100 characters, no special symbols
  - Description: 10-500 characters
  - Logo: max 2MB, JPG/PNG only, min 200x200px
  - Website/social links: valid URL format
- Moderation triggers (optional for Sprint 3):
  - Profanity or inappropriate language → flag for review
  - Suspicious URLs → flag for review
  - Rapid edits (>5 in 1 hour) → flag for review
- Approval workflow: auto-publish or require admin review?

**User Experience:**
- Validation rules are clear and enforced
- Moderation is fair and transparent

**Error Scenarios:**
- Invalid content → validation error before save
- Flagged content → saved but marked for review

**Testing:**
- Spot-check validation rules in staging
- Attempt invalid inputs → verify rejection
- Review moderation triggers (if implemented)

**Dependencies:**
- EGP-072 (BE org profile endpoints) for implementation
- Admin moderation system (if moderation triggers used)

**Definition of Done:**
- [ ] Field validation rules documented
- [ ] Moderation triggers defined (optional)
- [ ] Approval workflow documented
- [ ] Team sign-off on guidelines
- [ ] Implementation validated in staging

---

#### EGP-074: [PM] QA Organization Profile Edits

**Role:** Project Manager (PM)
**Story Points:** 5 (shared across ORG-002)
**Estimated Hours:** 4

**Description:**
Validate organization profile editing and public display.

**Core Requirements:**
- Create QA test scenarios covering:
  - Admin user → edit profile → save → public view updated
  - Non-admin user → cannot access edit page
  - Invalid inputs → validation errors shown
  - Logo upload → preview and save successful
  - Preview mode → matches public view
- Verify public rendering: spot-check 3-5 org profiles

**User Experience:**
- Edits are intuitive and errors are clear
- Public view reflects changes immediately
- No critical content issues

**Error Scenarios:**
- Public view not updated → log defect, check caching
- Validation missing → log defect, verify rules

**Testing:**
- Execute all scenarios on desktop and mobile
- Upload various logo formats and sizes
- Verify preview matches public view
- Spot-check public profiles
- Capture test evidence

**Dependencies:**
- EGP-071 (FE profile editor) complete
- EGP-072 (BE profile endpoints) complete
- EGP-073 (TL content guidelines) complete

**Definition of Done:**
- [ ] All test scenarios executed
- [ ] Public view updated correctly
- [ ] Validation enforced
- [ ] No P0/P1 defects
- [ ] Test evidence captured
- [ ] QA sign-off

---

### ORG-001: Organization Login & Team Management - 8 Story Points

#### EGP-075: [FE] Build Organization Login and Team Management UI

**Role:** Frontend (FE)
**Story Points:** 8 (shared across ORG-001)
**Estimated Hours:** 12

**Description:**
Allow organization users to sign in and manage team members.

**Core Requirements:**
- Org sign-in page: `/partners/login` (separate from user login or use role-based routing)
- Team management page: `/partners/team`
- Team list: show members with name, email, role (Admin, Editor, Viewer)
- Invite member: email input, role selector, "Send Invite" button
- Remove member: confirm dialog, "Remove" button
- Role change: dropdown to change member role
- Invite status: show pending invites with "Cancel" option

**User Experience:**
- Clean login form (email/password or SSO)
- Team list with clear role labels
- Invite form with role selection
- Immediate reflection: team changes update list instantly
- Confirmation dialogs for destructive actions (remove)

**Error Scenarios:**
- Login failed → inline "Incorrect email or password"
- Invite invalid email → inline "Enter a valid email address"
- Remove member error → "Failed to remove member. Try again."
- Unauthorized action → "You don't have permission for this action"

**Testing:**
- Run Test IDs: ORG-3 (Team Management)
- Admin login → team management page loads
- Invite member → email sent, pending invite shown
- Remove member → confirmation dialog, member removed from list
- Change role → dropdown updates, role saved
- Non-admin user → limited actions (viewer can't invite/remove)
- Invalid email → validation error
- Cross-browser and mobile testing

**Dependencies:**
- ORG-001 BE for org authentication (could reuse US-018 login with org context)
- EGP-076 (BE team endpoints) for team CRUD
- Email service for sending invites

**Definition of Done:**
- [ ] Org login functional
- [ ] Team list displays members with roles
- [ ] Invite member functional (email sent, pending shown)
- [ ] Remove member functional (with confirmation)
- [ ] Role change functional
- [ ] Unauthorized actions blocked in UI
- [ ] No P0/P1 defects
- [ ] Cross-browser and mobile tested
- [ ] Code reviewed and merged
- [ ] QA sign-off

---

#### EGP-076: [BE] Organization Team Management Endpoints

**Role:** Backend (BE)
**Story Points:** 8 (shared across ORG-001)
**Estimated Hours:** 12

**Description:**
Provide endpoints for organization team CRUD and invite management.

**Core Requirements:**
- Team list endpoint: `GET /api/orgs/:orgId/team` → returns team members
- Invite endpoint: `POST /api/orgs/:orgId/team/invite` → sends invite email, creates pending invite
- Remove endpoint: `DELETE /api/orgs/:orgId/team/:memberId` → removes team member
- Update role endpoint: `PUT /api/orgs/:orgId/team/:memberId/role` → updates member role
- Cancel invite endpoint: `DELETE /api/orgs/:orgId/team/invites/:inviteId` → cancels pending invite
- Accept invite endpoint: `POST /api/orgs/team/accept-invite?token=X` → accepts invite, adds user to org
- Audit trail: log all team changes (who/when/action)
- Role enforcement: only admins can invite/remove, editors can view

**User Experience:**
- API returns within 500ms
- Team changes reflect immediately
- Invite emails arrive within 1 minute

**Error Scenarios:**
- Unauthorized user → 403 "Admin access required"
- Invalid email → 400 "Invalid email address"
- Member already exists → 400 "Member already on team"
- Remove last admin → 400 "Cannot remove last admin"
- Invalid invite token → 400 "Invalid or expired invite link"
- Invite expired (>7 days) → 400 "Invite expired. Request a new one."

**Testing:**
- Unit tests: input validation, role enforcement, audit logging
- Integration tests: invite lifecycle (send → accept → added to team)
- Admin invites member → email sent, pending invite created
- Member accepts invite → added to team with specified role
- Admin removes member → member removed, audit logged
- Admin changes role → role updated, audit logged
- Non-admin attempts invite → 403 error
- Remove last admin → 400 error

**Dependencies:**
- Email service for sending invites
- User/org authentication from US-017/US-018
- EGP-077 (TL role model) for permission rules

**Definition of Done:**
- [ ] Team CRUD endpoints functional
- [ ] Invite/accept flow functional
- [ ] Role enforcement (admins only for invite/remove)
- [ ] Audit trail logging team changes
- [ ] Invite expiry (7 days)
- [ ] No P0/P1 defects
- [ ] Unit and integration tests passing (>90% coverage)
- [ ] Performance: P95 latency <500ms
- [ ] Code reviewed and deployed to staging
- [ ] QA sign-off

---

#### EGP-077: [TL] Define Organization Role Model and Permissions

**Role:** Tech Lead (TL)
**Story Points:** 8 (shared across ORG-001)
**Estimated Hours:** 4

**Description:**
Define roles and permissions for organization users (Admin, Editor, Viewer).

**Core Requirements:**
- Role matrix:
  - Admin: full access (invite, remove, edit profile, create campaigns, view analytics)
  - Editor: create/edit campaigns, view analytics (no team management)
  - Viewer: view campaigns and analytics only (read-only)
- Minimum permissions for campaign actions:
  - Create campaign: Editor or Admin
  - Publish campaign: Editor or Admin
  - Pause campaign: Editor or Admin
  - Delete campaign: Admin only
- Team management permissions:
  - Invite/remove members: Admin only
  - Change roles: Admin only
- Audit requirements: log all role-based actions

**User Experience:**
- Roles are clear and intuitive
- Permissions are enforced consistently across FE and BE
- Users see only actions they're allowed to perform

**Error Scenarios:**
- Unauthorized action → 403 with clear message
- Viewer attempts to edit → UI hides action, BE returns 403 if attempted

**Testing:**
- Spot-check role-based actions in staging
- Verify each role can/cannot perform expected actions
- Review permission matrix with team

**Dependencies:**
- EGP-076 (BE team endpoints) for implementation
- Future campaign endpoints (ORG-003 in Sprint 4) will use this model

**Definition of Done:**
- [ ] Role matrix documented (Admin, Editor, Viewer)
- [ ] Permissions defined for all org actions
- [ ] Minimum permissions for campaigns documented
- [ ] Audit requirements defined
- [ ] Team sign-off on role model
- [ ] Implementation validated in staging

---

#### EGP-078: [PM] QA Organization Team Management

**Role:** Project Manager (PM)
**Story Points:** 8 (shared across ORG-001)
**Estimated Hours:** 4

**Description:**
Validate organization team management flows and create support guidance.

**Core Requirements:**
- Create QA test scenarios covering:
  - Admin invites member → email sent, pending shown
  - Member accepts invite → added to team with correct role
  - Admin removes member → member removed, confirmation shown
  - Admin changes role → role updated immediately
  - Non-admin attempts invite → blocked or hidden
  - Cancel pending invite → invite canceled
- Create support note for common issues:
  - How to invite team members
  - How to change roles
  - What if invite email not received?

**User Experience:**
- All team management flows work smoothly
- Invites deliver successfully
- Support guidance is clear

**Error Scenarios:**
- Invite not delivered → check spam, resend option
- Role change not reflected → log defect, check caching

**Testing:**
- Run Test IDs: ORG-3 (Team Management)
- Execute all scenarios on desktop and mobile
- Test invite email delivery across providers
- Verify role enforcement (admin vs. non-admin)
- Capture test evidence

**Dependencies:**
- EGP-075 (FE team management UI) complete
- EGP-076 (BE team endpoints) complete
- EGP-077 (TL role model) complete

**Definition of Done:**
- [ ] All test scenarios executed
- [ ] Invite email delivery verified
- [ ] Role enforcement validated
- [ ] Support note created
- [ ] No P0/P1 defects
- [ ] Test evidence captured
- [ ] QA sign-off

---

*Sprint 3 contains 22 tickets (EGP-057 through EGP-078) totaling 41 story points and 188 hours. The next ticket ID is EGP-079 for Sprint 4.*


---

## Sprint 4: Organization Campaigns - Phase 1 (Weeks 9-10)

**Sprint Goal:** Enable organizations to create, share, and analyze campaigns with performance metrics and email tracking
**Total Story Points:** 52
**Total Hours:** 212

### ORG-003: Create Campaign (Bill/Issue/Candidate) - 21 Story Points

#### EGP-079: [UX] Design Campaign Creation Flows & Components

**Role:** UX
**Story Points:** 4
**Hours:** 12

**Description:**
Design comprehensive campaign creation experience for organizations to build campaigns around bills, issues, or candidates. Create multi-step flows with clear type selection, content entry, media upload, targeting options, and publishing controls. Design system must support draft saving, validation feedback, preview states, and publishing confirmation.

**Core Requirements:**
- Campaign type selection interface (Bill/Issue/Candidate)
- Multi-step form wizard with progress indicators
- Rich text editor for campaign description
- Media upload components (images, videos with preview)
- Targeting and audience selection UI
- Draft save functionality with auto-save indicators
- Publishing workflow (draft → review → publish)
- Validation and error feedback patterns
- Campaign preview mode
- Success confirmation screens

**User Experience:**
- Clear campaign type differentiation with icons and descriptions
- Progressive disclosure - show type-specific fields only when relevant
- Real-time validation with inline error messages
- Visual progress through creation steps with ability to navigate back
- Media upload with drag-and-drop, progress bars, and preview
- Targeting controls with clear audience count estimates
- Draft state clearly indicated with "Save Draft" and "Continue Editing" options
- Preview exactly matches public campaign appearance
- Publishing requires explicit confirmation with summary of what will go live
- Success state shows published campaign with sharing options immediately available

**Error Scenarios:**
- Required fields missing → Highlight missing fields with "Complete required fields to continue" message and jump to first missing field
- Invalid media format/size → "Please upload images under 5MB in JPG or PNG format" with format requirements shown
- Network error during upload → "Upload failed. Check connection and try again" with retry button
- Targeting produces zero audience → "No users match these criteria. Adjust filters to expand audience" with suggestion to broaden
- Publish fails validation → "Cannot publish: [specific issues]" with list of blocking issues and "Fix Issues" button
- Rate limit exceeded → "Too many drafts created. Try again in [time]" with countdown timer
- Concurrent edit conflict → "This campaign was edited elsewhere. Reload to see latest version" with merge option if possible

**Testing:**
- All campaign types (Bill, Issue, Candidate) render correct field sets
- Multi-step navigation works forward/back without data loss
- Auto-save triggers every 30 seconds when changes detected
- Media upload supports all specified formats and shows progress
- Targeting preview updates in real-time as filters change
- Draft can be saved at any step and resumed later
- Preview mode accurately reflects all entered content
- Publishing confirmation shows all campaign details for review
- Validation errors prevent progression until resolved
- Success flow provides immediate sharing and viewing options

**Dependencies:**
- Campaign data model and types defined by TL (EGP-082)
- Component library has form controls and media upload components
- Backend campaign endpoints available (EGP-081)

**Definition of Done:**
- [ ] All campaign type flows designed and documented
- [ ] Multi-step wizard components created in Figma
- [ ] Media upload and preview states defined
- [ ] Validation and error patterns documented
- [ ] Preview mode designs complete
- [ ] Publishing confirmation flow designed
- [ ] Mobile responsive variants created
- [ ] Accessibility annotations added
- [ ] Developer handoff complete with interaction specs
- [ ] UX review and approval

---

#### EGP-080: [FE] Build Campaign Builder Interface

**Role:** Frontend
**Story Points:** 6
**Hours:** 32

**Description:**
Implement comprehensive campaign creation UI allowing organization admins to create campaigns for bills, issues, or candidates. Build multi-step form wizard with type selection, content editing, media management, targeting controls, draft saving, preview functionality, and publishing workflow.

**Core Requirements:**
- Campaign type selection screen (Bill/Issue/Candidate)
- Dynamic form rendering based on campaign type
- Multi-step wizard with progress tracking and navigation
- Rich text editor integration for descriptions
- Media upload component with preview and management
- Targeting/audience filter controls
- Auto-save draft functionality (30-second intervals)
- Manual "Save Draft" with loading states
- Campaign preview mode matching public view
- Publishing confirmation dialog with validation
- Success screen with sharing options
- Form validation with inline errors
- Navigation guards to prevent accidental data loss

**User Experience:**
- Type selection clearly explains each campaign type with examples
- Step-by-step progression with clear "Next" and "Back" navigation
- Required fields marked with asterisk and validated on blur
- Rich text editor provides formatting toolbar (bold, italic, lists, links)
- Media uploads show progress, allow reordering, and provide previews
- Targeting shows live count of potential audience members
- Auto-save indicator shows "Saving..." → "Saved" with timestamp
- Preview opens in modal showing exactly how campaign appears to users
- Publishing requires checkbox confirmation: "I confirm this campaign is ready to publish"
- Success message: "Campaign published successfully!" with "View Campaign" and "Share Link" buttons
- Unsaved changes prompt: "You have unsaved changes. Save before leaving?" with Save/Discard/Cancel

**Error Scenarios:**
- Required field empty on submit → Inline error: "This field is required" with red border and icon
- Invalid media format → Toast: "Only JPG, PNG, and MP4 files are supported" and file rejected
- Upload exceeds size limit → Toast: "File size must be under 5MB" with current size shown
- Auto-save fails → Toast: "Could not save draft. Check connection" with manual retry button
- Targeting returns zero results → Warning banner: "Current filters match no users. Broaden criteria or publish anyway?"
- Publish validation fails → Modal: "Cannot publish due to: [list of issues]" with "Fix Issues" button
- API error on publish → Toast: "Publishing failed. Please try again" with retry and "Save Draft" options
- Concurrent edit detected → Banner: "This campaign was modified. Reload to see changes?" with Reload/Override options
- Session timeout → Redirect to login with draft auto-saved and return path preserved

**Testing:**
- Campaign type selection renders all three types with descriptions
- Type-specific fields appear/disappear based on selection
- Multi-step navigation maintains state across all steps
- Rich text editor toolbar functions work correctly
- Media upload handles images and videos up to 5MB
- Drag-and-drop file upload works on supported browsers
- Media can be reordered and removed
- Targeting filters update audience count on change
- Auto-save triggers every 30 seconds when dirty
- Manual save shows loading state and success confirmation
- Preview mode displays all entered content accurately
- Publishing confirmation shows campaign summary
- Validation prevents publish when required fields missing
- Success screen links to live campaign
- Navigation guard prevents accidental loss of unsaved changes
- Form rehydrates from draft when returning to partial campaign

**Dependencies:**
- Campaign creation endpoint available (EGP-081)
- UX designs for all campaign flows (EGP-079)
- Rich text editor component integrated
- Media upload service configured
- Targeting/audience API available
- Authentication provides organization context

**Definition of Done:**
- [ ] Type selection screen implemented
- [ ] All campaign type forms built and validated
- [ ] Multi-step wizard navigation working
- [ ] Rich text editor integrated and functional
- [ ] Media upload with preview implemented
- [ ] Targeting controls with live counts working
- [ ] Auto-save functionality complete
- [ ] Draft save/load cycle functional
- [ ] Preview mode implemented
- [ ] Publishing flow with confirmation complete
- [ ] All validation rules enforced
- [ ] Error handling for all scenarios implemented
- [ ] Success flow with sharing options complete
- [ ] Navigation guards prevent data loss
- [ ] Unit tests for form validation logic
- [ ] Integration tests for save/publish flows
- [ ] Accessibility verified (keyboard nav, screen readers)
- [ ] Cross-browser testing complete
- [ ] Code review approved

---

#### EGP-081: [BE] Campaign Endpoints and Persistence

**Role:** Backend
**Story Points:** 6
**Hours:** 32

**Description:**
Build comprehensive campaign CRUD API with support for drafts, publishing workflow, soft deletes, and full audit trail. Implement endpoints for creating, reading, updating, deleting campaigns with proper validation, authorization, and state management for Bill, Issue, and Candidate campaign types.

**Core Requirements:**
- POST /api/campaigns - Create new campaign (draft state by default)
- GET /api/campaigns/:id - Retrieve campaign details
- PUT /api/campaigns/:id - Update existing campaign
- DELETE /api/campaigns/:id - Soft delete campaign
- POST /api/campaigns/:id/publish - Publish draft campaign
- POST /api/campaigns/:id/unpublish - Revert to draft state
- GET /api/campaigns - List campaigns with filters (status, type, org)
- Campaign type validation (Bill/Issue/Candidate with type-specific fields)
- Draft auto-save support with optimistic locking
- Publishing workflow with validation checks
- Soft delete with retention policy
- Full audit trail (created, updated, published, unpublished, deleted events)
- Media URL validation and storage references
- Targeting criteria validation

**User Experience:**
- Draft creation returns immediately with campaign ID
- Updates respond within 200ms for smooth editing experience
- Publishing validation provides detailed feedback on blocking issues
- Concurrent edit detection prevents data loss
- Audit trail provides complete history for compliance
- Soft deletes allow recovery within retention period
- List endpoint supports pagination and filtering for org dashboards

**Error Scenarios:**
- Invalid campaign type → 400: "Campaign type must be 'bill', 'issue', or 'candidate'"
- Missing required fields → 400: "Required fields missing: [field list]" with field-level details
- Unauthorized access → 403: "You don't have permission to modify this campaign"
- Campaign not found → 404: "Campaign not found or has been deleted"
- Concurrent edit conflict → 409: "Campaign was modified. Refresh and try again" with latest version
- Publish validation fails → 422: "Cannot publish: [list of validation failures]" with specific issues
- Already published → 409: "Campaign is already published. Unpublish first to edit"
- Rate limit exceeded → 429: "Too many requests. Try again in [seconds]" with retry-after header
- Media URL invalid → 400: "Invalid media URL: must be HTTPS and from allowed domains"
- Database error → 500: "Could not save campaign. Please try again" with incident ID for support
- Soft delete failed → 500: "Could not delete campaign. Contact support with ID: [incident]"

**Testing:**
- Create draft campaign with minimal fields returns 201 with ID
- Create campaign with all optional fields persists correctly
- Retrieve campaign returns all fields including audit metadata
- Update campaign persists changes and increments version
- Concurrent updates detected via optimistic locking
- Publishing validates all required fields before state change
- Published campaign cannot be deleted (must unpublish first)
- Soft delete marks deleted_at timestamp, preserves data
- Audit trail records all state changes with user/timestamp
- List campaigns filters by status (draft/published/deleted)
- List campaigns filters by type (bill/issue/candidate)
- List campaigns filters by organization ID
- Pagination returns correct page size and total count
- Type-specific validation enforces fields per campaign type
- Media URLs validated for HTTPS and allowed domains
- Targeting criteria validated against allowed formats
- Unauthorized user receives 403 for other org's campaigns
- Invalid campaign ID returns 404
- All endpoints respect rate limits per organization

**Dependencies:**
- Organization authentication and authorization (from ORG-001)
- Media storage service configured
- Database schema for campaigns table
- Audit logging infrastructure
- Rate limiting middleware

**Definition of Done:**
- [ ] All CRUD endpoints implemented
- [ ] Campaign type validation working
- [ ] Draft workflow complete
- [ ] Publishing workflow with validation complete
- [ ] Soft delete implemented
- [ ] Audit trail logging all events
- [ ] Optimistic locking for concurrent edits
- [ ] Media URL validation implemented
- [ ] Targeting validation implemented
- [ ] List/filter/pagination working
- [ ] Authorization checks enforced
- [ ] All error scenarios handled
- [ ] Unit tests for validation logic
- [ ] Integration tests for full workflows
- [ ] API documentation updated
- [ ] Rate limiting configured
- [ ] Performance tested (response times < 200ms)
- [ ] Security review passed
- [ ] Code review approved

---

#### EGP-082: [TL] Campaign Standards and Safety

**Role:** Tech Lead
**Story Points:** 3
**Hours:** 12

**Description:**
Define comprehensive campaign data model, content standards, moderation hooks, and publishing rules for all campaign types (Bill, Issue, Candidate). Establish validation rules, safety guardrails, content guidelines, and suspension criteria to ensure platform integrity and legal compliance.

**Core Requirements:**
- Campaign data model specification for each type:
  - Bill campaigns: bill ID, stance (support/oppose), key points, call-to-action
  - Issue campaigns: issue category, position statement, background, resources
  - Candidate campaigns: candidate info, endorsement rationale, election date, district
- Required vs. optional fields per campaign type
- Field validation rules (length limits, format requirements, allowed values)
- Content moderation triggers and automated flags
- Publishing validation checklist (all types)
- Suspension and takedown criteria
- Audit and compliance requirements
- Media content guidelines (size, format, content restrictions)
- Targeting constraints and privacy rules

**User Experience:**
- Clear field requirements prevent submission errors
- Validation messages guide users to compliant content
- Automated moderation flags surface issues before publish
- Suspension reasons clearly communicated to organizations
- Audit trail provides transparency and appeals process

**Error Scenarios:**
- Campaign missing required type-specific fields → Publish blocked with specific field list
- Content triggers moderation flag → Warning: "Content may violate guidelines. Review before publishing"
- Media violates size/format rules → Upload rejected with: "Media must be JPG/PNG/MP4, max 5MB"
- Targeting violates privacy rules → Error: "Cannot target users under 18 for political campaigns"
- Concurrent state change detected → Publish fails with: "Campaign state changed. Reload and retry"
- Suspension criteria met → Campaign auto-suspended with notification to org admin

**Testing:**
- Data model validates all required fields for Bill campaigns
- Data model validates all required fields for Issue campaigns
- Data model validates all required fields for Candidate campaigns
- Type-specific fields enforced (e.g., bill ID required for Bill type only)
- Content moderation flags inappropriate language/imagery
- Publishing blocked when required fields missing
- Suspension triggers when criteria met (e.g., multiple reports)
- Audit trail captures all moderation events
- Media validation enforces size and format limits
- Targeting privacy rules prevent underage user targeting
- Compliance metadata (created_by, modified_by, timestamps) persisted

**Dependencies:**
- Content moderation service or rules engine
- Legal review of campaign content guidelines
- Product requirements for campaign types

**Definition of Done:**
- [ ] Campaign data model documented for all types
- [ ] Required/optional fields matrix created
- [ ] Validation rules specified with examples
- [ ] Content moderation triggers defined
- [ ] Publishing checklist documented
- [ ] Suspension criteria specified
- [ ] Audit requirements documented
- [ ] Media guidelines published
- [ ] Targeting constraints defined
- [ ] Documentation reviewed by legal/compliance
- [ ] Engineering team walkthrough completed
- [ ] Rules implemented in validation logic (BE)
- [ ] Frontend validation aligned with BE rules
- [ ] Test cases defined for all scenarios
- [ ] Runbook for moderation events created

---

#### EGP-083: [PM] Admin Flows QA and Launch Checklists

**Role:** Project Manager
**Story Points:** 2
**Hours:** 12

**Description:**
Validate campaign creation and publishing flows across all campaign types with comprehensive QA coverage. Create detailed test scripts, execute end-to-end testing, document findings, prepare launch readiness checklist, and coordinate stakeholder sign-off for campaign feature release.

**Core Requirements:**
- QA test scripts for all campaign types (Bill, Issue, Candidate)
- End-to-end flow testing (create → draft → publish)
- Cross-browser and device testing
- Edge case and error scenario validation
- Performance and load testing for campaign creation
- Security and authorization testing
- Draft workflow validation (save, resume, auto-save)
- Media upload testing (formats, sizes, failures)
- Publishing validation checklist execution
- Moderation and suspension flow testing
- Launch readiness checklist
- Stakeholder demo and sign-off coordination

**User Experience:**
- All campaign types work seamlessly across browsers
- Draft saving is reliable and recovers gracefully
- Publishing provides clear feedback and confirmation
- Error messages are helpful and actionable
- Performance meets user expectations (< 2s page loads)
- Mobile experience is complete and usable

**Error Scenarios:**
- P0: Cannot create campaign → "Critical failure: Campaign creation broken. Immediate fix required"
- P1: Cannot publish campaign → "Publishing flow blocked. High priority fix needed"
- P1: Draft not saving → "Data loss risk. Immediate investigation required"
- P2: Validation error unclear → "Error message improvement needed: [specific message]"
- P2: Slow load times → "Performance issue: Campaign creation exceeds 2s. Optimize or defer"
- P3: Minor UI inconsistency → "Visual polish needed: [specific issue]. Fix before launch or defer"

**Testing:**
- Create Bill campaign with all required fields → Success, draft saved
- Create Issue campaign with all required fields → Success, draft saved
- Create Candidate campaign with all required fields → Success, draft saved
- Save draft and resume → All data preserved, session restored
- Auto-save triggers during editing → "Saving..." indicator, then "Saved"
- Upload media (JPG, PNG, MP4) → All formats accepted, previews shown
- Upload oversized media → Error: "File too large", upload rejected
- Publish with missing required fields → Blocked with field list
- Publish with all fields complete → Success, campaign goes live
- Concurrent edit by two users → Conflict detected, resolution options shown
- Unauthorized user attempts access → 403, redirected with message
- Campaign suspension by admin → Org notified, campaign hidden
- Performance under load (50 concurrent creates) → All succeed, < 2s
- Cross-browser (Chrome, Firefox, Safari, Edge) → All flows work
- Mobile (iOS Safari, Android Chrome) → Complete functionality, responsive
- Accessibility (keyboard nav, screen readers) → All actions accessible
- Security: Non-admin cannot create campaign → Blocked
- Security: User from Org A cannot edit Org B campaign → 403 error

**Dependencies:**
- Campaign creation flows complete (EGP-079, EGP-080, EGP-081)
- Test environment with seeded data
- All campaign types configured
- Access to analytics/monitoring tools
- Stakeholder availability for demos

**Definition of Done:**
- [ ] QA test scripts created for all campaign types
- [ ] End-to-end testing completed (all flows)
- [ ] Cross-browser testing complete (4+ browsers)
- [ ] Mobile testing complete (iOS + Android)
- [ ] Edge cases and error scenarios tested
- [ ] Performance testing complete (load, stress)
- [ ] Security testing complete (auth, permissions)
- [ ] Draft workflow fully validated
- [ ] Media upload scenarios tested
- [ ] Publishing validation verified
- [ ] All P0/P1 defects resolved
- [ ] P2 defects triaged (fix or defer)
- [ ] Test results documented with evidence
- [ ] Launch readiness checklist complete
- [ ] Stakeholder demo conducted
- [ ] Sign-off obtained from product owner
- [ ] Release notes drafted

---

### ORG-007: Copy Campaign Link - 2 Story Points

#### EGP-084: [UX] Design Shareable Link Component

**Role:** UX
**Story Points:** 0.5
**Hours:** 4

**Description:**
Design simple, intuitive campaign link sharing component allowing organizations to easily copy and share campaign URLs. Create copy-to-clipboard interaction with clear feedback and fallback for browsers without clipboard API support.

**Core Requirements:**
- Copy button design with clear icon/label
- Hover and active states for button
- Success feedback animation/message
- Fallback UI for manual copy (select-all)
- Placement options (campaign detail, campaign list, dashboard)
- Mobile-friendly touch targets
- Sharing options integration (future: social share buttons)

**User Experience:**
- Copy button clearly labeled with icon (link or copy symbol)
- On click: Button shows "Copied!" with checkmark for 2 seconds, then reverts
- Link displayed in read-only input field with auto-select on focus
- Fallback (if clipboard blocked): Input auto-selects text with hint "Press Cmd/Ctrl+C to copy"
- Success state provides visual confirmation without disrupting workflow
- Button positioned prominently but doesn't overshadow primary campaign actions

**Error Scenarios:**
- Clipboard API blocked → Automatically show fallback with selected text and copy hint
- Copy fails → Toast: "Could not copy link. Please select and copy manually" with text field highlighted
- Browser without clipboard support → Show fallback UI by default with manual copy instructions

**Testing:**
- Copy button renders with correct icon and label
- Click copies link to clipboard in supported browsers
- Success state shows "Copied!" message for 2 seconds
- Fallback shows when clipboard API unavailable
- Mobile devices support copy (iOS, Android)
- Keyboard accessible (Enter/Space triggers copy)
- Screen reader announces "Link copied to clipboard"

**Dependencies:**
- Campaign URL structure defined
- Component library has button and input components
- Clipboard API browser compatibility confirmed

**Definition of Done:**
- [ ] Copy button component designed
- [ ] All interaction states specified (default, hover, active, success)
- [ ] Fallback design for manual copy complete
- [ ] Mobile variant designed
- [ ] Placement options documented
- [ ] Accessibility annotations added
- [ ] Developer handoff complete

---

#### EGP-085: [FE] Build Copy Campaign Link UI

**Role:** Frontend
**Story Points:** 0.5
**Hours:** 4

**Description:**
Implement copy-to-clipboard functionality for campaign links with automatic fallback for unsupported browsers. Build component with success feedback and graceful degradation ensuring all users can share campaign URLs.

**Core Requirements:**
- Copy button component with icon
- Clipboard API integration
- Success feedback (visual + message)
- Fallback for manual copy (auto-select input)
- Browser compatibility handling
- Keyboard accessibility
- Screen reader support

**User Experience:**
- Click "Copy Link" → Link copied to clipboard → Button shows "Copied!" with checkmark for 2s → Reverts to "Copy Link"
- If clipboard blocked → Input field with link automatically selected → Hint: "Press Cmd+C (Mac) or Ctrl+C (Windows) to copy"
- Link in shareable format: https://app.example.com/campaigns/[campaign-slug]?utm_source=org_share
- Button placed near campaign title for easy access
- Works on touch devices with appropriate touch target size

**Error Scenarios:**
- Clipboard API not supported → Automatically show fallback input with link pre-selected
- Clipboard API blocked by permissions → Show fallback with message: "Please copy link manually"
- Copy action fails → Toast: "Copy failed. Please try selecting text" with link highlighted
- Invalid campaign ID → Button disabled with tooltip: "Campaign link not available"

**Testing:**
- Copy button renders with correct styling
- Click copies correct campaign URL to clipboard
- Success message displays for 2 seconds
- Fallback activates when clipboard unavailable
- Link format includes campaign slug and tracking params
- Keyboard: Enter/Space triggers copy
- Screen reader announces "Campaign link copied to clipboard"
- Mobile: Copy works on iOS Safari and Android Chrome
- Cross-browser: Chrome, Firefox, Safari, Edge all functional
- Error handling for missing campaign ID

**Dependencies:**
- Campaign detail page/component (EGP-080)
- Link structure with tracking params (EGP-086)
- Component library for button and input

**Definition of Done:**
- [ ] Copy button component implemented
- [ ] Clipboard API integration complete
- [ ] Success feedback working (2s display)
- [ ] Fallback for manual copy implemented
- [ ] Tracking parameters included in URL
- [ ] Keyboard accessibility verified
- [ ] Screen reader support confirmed
- [ ] Mobile testing complete (iOS + Android)
- [ ] Cross-browser testing complete
- [ ] Error scenarios handled
- [ ] Unit tests for copy logic
- [ ] Code review approved

---

#### EGP-086: [BE] Link Tracking Parameters

**Role:** Backend
**Story Points:** 0.5
**Hours:** 4

**Description:**
Support UTM and custom tracking parameters on campaign share links to attribute traffic and actions back to specific sharing sources. Implement parameter parsing, validation, and persistence in analytics events for campaign performance tracking.

**Core Requirements:**
- Accept UTM parameters (utm_source, utm_medium, utm_campaign, utm_content)
- Accept custom tracking parameters (share_id, referrer_org_id)
- Validate parameter formats and values
- Persist parameters with campaign view events
- Associate parameters with downstream actions (message sends)
- Provide parameter data in analytics endpoints

**User Experience:**
- Shared links include tracking: https://app.example.com/campaigns/[slug]?utm_source=org_share&share_id=[unique_id]
- When users click shared link, source is recorded transparently
- Organization analytics show traffic sources and conversions by share link

**Error Scenarios:**
- Invalid parameter format → Silently ignore invalid params, track valid ones
- Missing tracking params → Request processed normally, defaults applied (utm_source=direct)
- Malicious parameter values → Sanitized and logged, safe defaults applied
- Parameter exceeds length limit → Truncated to max length (255 chars)
- Database error persisting params → Event logged without params, user experience unaffected

**Testing:**
- Valid UTM parameters persisted with campaign view event
- Custom share_id parameter recorded in analytics
- Invalid parameters ignored without error
- Missing parameters result in default values (utm_source=direct)
- Parameter values sanitized to prevent injection
- Analytics endpoint returns parameter breakdowns per campaign
- Campaign actions (messages) linked to share parameters
- Clickthrough to message send preserves attribution
- Parameter length limits enforced (truncation)
- Database error doesn't block campaign view

**Dependencies:**
- Analytics event logging infrastructure
- Campaign view tracking (existing)
- Message send tracking (from US-013)

**Definition of Done:**
- [ ] UTM parameter parsing implemented
- [ ] Custom parameter support added
- [ ] Validation and sanitization complete
- [ ] Parameter persistence in analytics events
- [ ] Attribution to downstream actions working
- [ ] Analytics endpoint includes parameter data
- [ ] Default values applied when missing
- [ ] Invalid params handled gracefully
- [ ] Length limits enforced
- [ ] Unit tests for parameter parsing
- [ ] Integration tests for full attribution flow
- [ ] Documentation updated with param specs
- [ ] Code review approved

---

#### EGP-087: [PM] QA Copy and Tracking Behaviors

**Role:** Project Manager
**Story Points:** 0.5
**Hours:** 4

**Description:**
Validate copy link functionality across browsers and devices, verify tracking parameter accuracy, and confirm analytics attribution. Test user flows from share to action to ensure complete tracking chain.

**Core Requirements:**
- Copy functionality testing (all browsers/devices)
- Tracking parameter validation
- Analytics attribution verification
- End-to-end share-to-action flow testing
- Fallback behavior testing
- Accessibility testing

**User Experience:**
- Copy link works reliably across all supported environments
- Tracking parameters accurately attribute traffic sources
- Analytics dashboards reflect share link performance
- Users can easily share campaigns with one click

**Error Scenarios:**
- Copy fails on unsupported browser → Fallback shown, manual copy works
- Tracking params missing → Analytics show "direct" source, no data loss
- Invalid tracking params → Ignored, campaign view still recorded
- Analytics delayed → Params eventually appear in dashboard, no permanent loss

**Testing:**
- Copy link in Chrome → Link copied, "Copied!" message shown
- Copy link in Firefox → Link copied, "Copied!" message shown
- Copy link in Safari → Link copied, "Copied!" message shown
- Copy link on iOS Safari → Link copied (or fallback shown)
- Copy link on Android Chrome → Link copied (or fallback shown)
- Fallback: Clipboard blocked → Auto-select input shown, manual copy works
- Tracking: Click shared link → utm_source=org_share recorded in analytics
- Tracking: Click shared link → share_id recorded with campaign view
- Tracking: Message sent from shared campaign → Action attributed to share_id
- Analytics: Dashboard shows traffic by utm_source → Correct counts displayed
- Analytics: Dashboard shows conversions by share_id → Correct attribution shown
- Invalid params in URL → Ignored, no error, campaign loads normally
- Missing params → Defaults applied (utm_source=direct), campaign loads
- Keyboard: Tab to button, Enter to copy → Link copied successfully
- Screen reader: "Copy link button" announced, then "Link copied" on success

**Dependencies:**
- Copy link UI complete (EGP-085)
- Tracking params backend complete (EGP-086)
- Analytics dashboard available (ORG-005)
- Test campaigns created in staging

**Definition of Done:**
- [ ] Copy functionality tested on all browsers (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing complete (iOS Safari, Android Chrome)
- [ ] Fallback behavior verified when clipboard unavailable
- [ ] Tracking parameters validated in URLs
- [ ] Analytics attribution verified end-to-end
- [ ] Share-to-action flow tested (share → view → message)
- [ ] Invalid/missing parameter scenarios tested
- [ ] Accessibility tested (keyboard, screen reader)
- [ ] Test results documented
- [ ] All defects triaged and resolved/deferred
- [ ] Sign-off obtained

---

### ORG-005: Campaign Performance Analytics with L2 - 21 Story Points

#### EGP-088: [UX] Design Campaign Analytics Dashboard

**Role:** UX
**Story Points:** 4
**Hours:** 12

**Description:**
Design comprehensive campaign performance dashboard with KPIs, trend charts, demographic breakdowns (where permitted), and actionable insights for organizations. Create data visualization components, filtering controls, and export capabilities while respecting privacy thresholds.

**Core Requirements:**
- Overview KPI cards (views, actions, conversion rate, reach)
- Trend charts (time series for key metrics)
- Demographic breakdowns (age ranges, gender, geography) with privacy thresholds
- Filtering controls (date range, campaign type, status)
- Comparison views (campaign vs. campaign, time period vs. time period)
- Data table with sortable columns
- Export functionality (CSV, PDF)
- Empty states and loading states
- Mobile responsive layouts
- Privacy threshold indicators (e.g., "Data suppressed: <10 users")

**User Experience:**
- Dashboard loads with most important KPIs immediately visible (views, actions, conversion rate)
- Trend charts show 30-day default view with ability to adjust range (7d, 30d, 90d, all time)
- Demographic breakdowns display only when minimum threshold met (≥10 users per segment)
- Filters apply instantly without page reload
- Comparison mode shows two campaigns side-by-side with delta indicators (↑↓ %)
- Data tables sortable by any column, paginated for large datasets
- Export generates file with current filters applied
- Empty state shows helpful message: "No data yet. Share your campaign to start seeing analytics"
- Loading states show skeleton loaders for individual chart sections

**Error Scenarios:**
- Data load fails → Error banner: "Could not load analytics. Refresh to try again" with retry button
- Demographic threshold not met → Chart shows: "Data hidden for privacy (fewer than 10 users in this segment)"
- Export fails → Toast: "Export failed. Please try again or contact support" with retry option
- Invalid date range → Validation: "End date must be after start date" with red border on inputs
- No data for selected filters → Empty state: "No data matches these filters. Try adjusting your selection"
- Slow query → Loading state with message: "Large dataset loading... this may take a moment"

**Testing:**
- KPI cards render with correct values and formatting
- Trend charts display time series data with correct axis labels
- Demographic breakdowns respect privacy thresholds (suppress <10 users)
- Date range filters update all charts simultaneously
- Campaign comparison shows two campaigns side-by-side
- Data tables sort correctly by all columns
- Pagination works for large datasets (>100 rows)
- Export generates CSV with correct data and headers
- Empty states display when no data available
- Loading states show during data fetch
- Mobile view stacks charts vertically, maintains readability
- Privacy indicators clearly shown when data suppressed

**Dependencies:**
- Analytics data model and aggregation rules (EGP-091)
- Component library has chart components (Recharts or similar)
- Demographics data available from L2 integration
- Export service configured

**Definition of Done:**
- [ ] KPI cards designed for all key metrics
- [ ] Trend chart layouts created
- [ ] Demographic breakdown charts designed
- [ ] Filtering controls UI complete
- [ ] Comparison view designed
- [ ] Data table with sorting/pagination designed
- [ ] Export UI designed (CSV, PDF)
- [ ] Empty and loading states defined
- [ ] Mobile responsive layouts complete
- [ ] Privacy threshold indicators designed
- [ ] Accessibility annotations added
- [ ] Developer handoff with interaction specs complete

---

#### EGP-089: [FE] Build Campaign Analytics Dashboard

**Role:** Frontend
**Story Points:** 6
**Hours:** 32

**Description:**
Implement interactive analytics dashboard displaying campaign performance metrics, demographic breakdowns, trend analysis, and comparison tools. Integrate charting library (Recharts), build filtering controls, implement data export, and handle privacy thresholds appropriately.

**Core Requirements:**
- KPI overview cards (views, actions, conversion rate, reach)
- Recharts integration for trend visualizations
- Demographic breakdown charts (age, gender, geography)
- Privacy threshold enforcement (suppress data <10 users)
- Date range picker with presets (7d, 30d, 90d, all time)
- Campaign comparison mode (side-by-side)
- Sortable, paginated data table
- CSV/PDF export functionality
- Real-time filter application (no page reload)
- Responsive design for mobile
- Loading and empty states
- Error handling and retry mechanisms

**User Experience:**
- Dashboard loads with KPIs visible within 1 second
- Charts render smoothly with transitions
- Clicking KPI card focuses related chart below
- Date range changes update all charts simultaneously with smooth transition
- Demographic charts show "Data suppressed for privacy" when <10 users in segment
- Comparison mode: Select two campaigns → Charts update to overlay both datasets with color differentiation
- Data table: Click column header to sort (asc/desc) → Rows reorder immediately
- Export: Click "Export CSV" → File downloads with current filters/view applied
- Mobile: Charts stack vertically, KPI cards in 2x2 grid, fully interactive
- Error state: If chart fails to load → "Could not load data" message with "Retry" button

**Error Scenarios:**
- Analytics API fails → Error banner: "Unable to load analytics. Please refresh" with retry button
- Demographics below threshold → Chart hidden with message: "Not enough data to show (privacy threshold)"
- Export service error → Toast: "Export failed. Try again or contact support" with retry option
- Invalid date range selected → Inline error: "End date must be after start date" with date picker highlighted red
- No data for filters → Empty state illustration: "No data for selected filters. Try different criteria"
- Slow query (>3s) → Loading spinner with text: "Loading large dataset, please wait..."
- Network timeout → Toast: "Connection lost. Check network and retry" with manual retry button

**Testing:**
- KPI cards display correct values for selected campaign
- Trend charts render with correct data points and axis labels
- Demographic charts display breakdowns when threshold met (≥10 users)
- Demographic charts suppress and show privacy message when <10 users
- Date range preset buttons (7d, 30d, 90d, all) update charts correctly
- Custom date range picker applies new range on selection
- Campaign comparison shows two campaigns overlaid with distinct colors
- Data table sorts correctly by all columns (asc/desc toggle)
- Pagination navigates through large datasets (>100 rows)
- Export CSV downloads file with correct data and filters applied
- Export PDF generates formatted report (if implemented)
- Filters applied instantly without page reload
- Loading states show skeleton loaders before data arrives
- Empty states display when no data matches filters
- Error states show with retry option when API fails
- Mobile: All charts and controls functional, responsive layout
- Accessibility: Keyboard navigation works, screen reader announces chart data
- Performance: Dashboard loads in <1s, chart transitions smooth (<200ms)

**Dependencies:**
- Analytics API endpoints (EGP-090)
- Recharts library integrated
- Date range picker component
- Export service (CSV/PDF generation)
- Privacy threshold logic from TL (EGP-091)

**Definition of Done:**
- [ ] KPI cards implemented and displaying correct data
- [ ] Trend charts implemented with Recharts
- [ ] Demographic charts implemented with privacy thresholds
- [ ] Date range picker with presets working
- [ ] Campaign comparison mode functional
- [ ] Data table with sorting and pagination complete
- [ ] CSV export implemented
- [ ] PDF export implemented (if in scope)
- [ ] All filters apply in real-time
- [ ] Loading states for all async operations
- [ ] Empty states for no-data scenarios
- [ ] Error handling with retry implemented
- [ ] Mobile responsive design complete
- [ ] Accessibility verified (keyboard, ARIA, screen readers)
- [ ] Performance optimized (load <1s, interactions <200ms)
- [ ] Unit tests for filter and export logic
- [ ] Integration tests for API interactions
- [ ] Cross-browser testing complete
- [ ] Code review approved

---

#### EGP-090: [BE] Analytics Aggregation and Filters

**Role:** Backend
**Story Points:** 6
**Hours:** 32

**Description:**
Build analytics aggregation service computing campaign performance metrics with demographic breakdowns, applying privacy thresholds, and supporting flexible filtering. Implement efficient queries, caching strategy, and data export capabilities for organization dashboards.

**Core Requirements:**
- GET /api/campaigns/:id/analytics - Campaign performance endpoint
- Aggregations: views, actions, conversion rate, reach, engagement rate
- Demographic breakdowns: age ranges, gender, geography (state/district)
- Privacy threshold enforcement: suppress results with <10 users per segment
- Filtering: date range, metric type, demographic segment
- Time series data for trend charts (daily/weekly/monthly rollups)
- Comparison support: multi-campaign query
- Caching strategy for expensive aggregations (1-hour TTL)
- Export endpoint: GET /api/campaigns/:id/analytics/export (CSV format)
- Query optimization with indexes and pre-aggregation where possible

**User Experience:**
- Analytics endpoint responds within 500ms for typical queries
- Demographic breakdowns show accurate aggregated data
- Privacy thresholds prevent exposure of small cohorts
- Filters apply efficiently without performance degradation
- Cached results return instantly for repeated queries
- Export generates complete dataset with current filters

**Error Scenarios:**
- Campaign not found → 404: "Campaign not found"
- Unauthorized access → 403: "You don't have permission to view this campaign's analytics"
- Invalid date range → 400: "Invalid date range: end date must be after start date"
- Demographic threshold not met → Response includes: { "suppressed": true, "reason": "privacy_threshold", "message": "Data hidden for privacy (<10 users)" }
- Query timeout (>5s) → 504: "Analytics query timed out. Try a smaller date range" with suggestion
- Database error → 500: "Could not load analytics. Please try again" with incident ID
- Export too large → 413: "Export exceeds size limit. Filter to smaller dataset" with max size
- Cache miss with slow query → 200 response but >1s latency, logged for optimization
- Invalid metric type → 400: "Invalid metric: must be one of [views, actions, conversion_rate, reach, engagement_rate]"

**Testing:**
- Campaign analytics endpoint returns all metrics (views, actions, conversion, reach, engagement)
- Date range filter returns data only within specified range
- Demographic breakdown by age returns accurate segment counts
- Demographic breakdown by gender returns accurate counts
- Demographic breakdown by geography (state) returns accurate counts
- Privacy threshold suppresses demographics with <10 users per segment
- Privacy suppression response includes "suppressed": true flag
- Time series returns daily rollups for 30-day range
- Time series returns weekly rollups for 90-day range
- Time series returns monthly rollups for 1-year range
- Multi-campaign comparison query returns data for both campaigns
- Caching: Second identical query returns cached result (<50ms)
- Cache expiry: After 1 hour, fresh data fetched
- Export endpoint generates CSV with all filtered data
- Export includes headers and correct formatting
- Query performance: Typical query <500ms (p95)
- Query optimization: Indexes on campaign_id, created_at, demographic fields
- Unauthorized user receives 403 for other org's campaign analytics
- Invalid campaign ID returns 404
- Invalid date range returns 400 with helpful message
- Query timeout (>5s) returns 504 with actionable guidance

**Dependencies:**
- Campaign views/actions tracking (from earlier sprints)
- L2 Political data integration for demographics
- Caching infrastructure (Redis)
- Database indexes on analytics tables
- Export service for CSV generation

**Definition of Done:**
- [ ] Analytics endpoint implemented with all metrics
- [ ] Demographic breakdown aggregations complete
- [ ] Privacy threshold logic enforced (suppress <10 users)
- [ ] Date range filtering working
- [ ] Time series rollups implemented (daily/weekly/monthly)
- [ ] Multi-campaign comparison supported
- [ ] Caching implemented (1-hour TTL)
- [ ] Export endpoint generates CSV
- [ ] Query optimization with indexes complete
- [ ] All error scenarios handled with appropriate responses
- [ ] Unit tests for aggregation logic
- [ ] Integration tests for full analytics flows
- [ ] Performance testing (p95 <500ms)
- [ ] Load testing (handles 100 concurrent requests)
- [ ] Security review for demographic data handling
- [ ] API documentation updated
- [ ] Code review approved

---

#### EGP-091: [TL] Data Usage and Privacy

**Role:** Tech Lead
**Story Points:** 3
**Hours:** 12

**Description:**
Define privacy-first analytics architecture with demographic data usage rules, anonymization thresholds, aggregation guidelines, and retention policies. Ensure compliance with privacy regulations (GDPR, CCPA) and L2 Political data usage terms while providing valuable insights to organizations.

**Core Requirements:**
- Privacy threshold specification: minimum 10 users per demographic segment to display data
- Anonymization rules: no individual-level data exposed in analytics
- Aggregation level definitions: campaign-level only, no user-level drill-down
- Demographic dimensions allowed: age ranges (not exact ages), gender, geographic (state/district)
- Retention windows: raw event data (90 days), aggregated data (2 years)
- Data minimization: only collect demographics necessary for permitted aggregations
- L2 Political data usage compliance rules
- Cross-organization data isolation (org cannot see other org's analytics)
- Admin analytics rules (platform-wide vs. org-specific views)
- Audit logging for sensitive analytics access

**User Experience:**
- Organizations see valuable demographic insights without privacy risk
- Suppressed data clearly indicated with privacy threshold message
- Analytics respect user privacy and regulatory requirements
- Audit trail provides transparency for compliance reviews

**Error Scenarios:**
- Demographic segment <10 users → Data suppressed with: { "suppressed": true, "reason": "privacy_threshold" }
- Unauthorized cross-org access attempt → 403 with audit log entry
- Attempt to access individual user data → Blocked at API level, audit logged
- Retention policy expiry → Data automatically deleted, aggregates preserved
- L2 data usage violation detected → Alert triggered, access suspended pending review

**Testing:**
- Demographic segment with 9 users → Data suppressed, privacy message shown
- Demographic segment with 10 users → Data displayed correctly
- Demographic segment with 100 users → Data displayed, accurate counts
- Age range aggregation: 18-24, 25-34, 35-44, 45-54, 55-64, 65+ (no exact ages)
- Gender aggregation: Male, Female, Other (no detailed breakdown)
- Geography aggregation: State, Congressional District (no street-level)
- Raw event data older than 90 days → Automatically deleted
- Aggregated analytics older than 2 years → Automatically deleted
- User from Org A attempts to access Org B analytics → 403 error, audit logged
- Admin views platform-wide analytics → Success, aggregated across all orgs (no individual org drill-down)
- Admin views specific org analytics → Success, same rules as org user
- Sensitive analytics access → Audit log entry created with user, timestamp, campaign
- L2 data usage compliance check → All queries within permitted scope
- Cross-org data isolation → Org A sees only their campaign analytics, not Org B

**Dependencies:**
- L2 Political data license and usage terms
- Legal review of privacy compliance
- GDPR/CCPA compliance requirements
- Analytics data model (EGP-090)

**Definition of Done:**
- [ ] Privacy threshold defined (10 users minimum)
- [ ] Anonymization rules documented
- [ ] Aggregation levels specified
- [ ] Allowed demographic dimensions listed
- [ ] Retention windows defined and documented
- [ ] Data minimization rules specified
- [ ] L2 compliance rules documented
- [ ] Cross-org isolation requirements specified
- [ ] Admin analytics rules defined
- [ ] Audit logging requirements documented
- [ ] Rules reviewed by legal/compliance
- [ ] Engineering team walkthrough completed
- [ ] Implementation verified in code (EGP-090)
- [ ] Test cases defined for all privacy scenarios
- [ ] Runbook for privacy incidents created
- [ ] Data retention automation configured

---

#### EGP-092: [PM] Insights Narrative and QA

**Role:** Project Manager
**Story Points:** 2
**Hours:** 12

**Description:**
Validate analytics accuracy, draft insight narratives for dashboard views, ensure privacy thresholds work correctly, and coordinate comprehensive QA of analytics features. Verify metric calculations, test demographic breakdowns, validate privacy suppression, and prepare analytics feature documentation.

**Core Requirements:**
- Metric accuracy validation (compare to source data)
- Demographic breakdown testing (all dimensions)
- Privacy threshold verification (suppress <10 users)
- Insight narrative drafting for key metrics
- Dashboard usability testing
- Export functionality validation
- Cross-browser and device testing
- Performance testing (load times, query speed)
- Documentation of analytics features

**User Experience:**
- Analytics metrics are accurate and trustworthy
- Insights help organizations understand campaign performance
- Privacy is protected with clear suppression indicators
- Dashboard is intuitive and actionable
- Export provides usable data for external analysis

**Error Scenarios:**
- Metric calculation incorrect → P0: "Critical: Analytics showing wrong data. Immediate fix required"
- Privacy threshold not enforced → P0: "Critical: Privacy violation. Data exposed for <10 users. Immediate fix"
- Export data incomplete → P1: "Export missing data. High priority fix needed"
- Dashboard slow to load → P2: "Performance issue: Dashboard >3s load. Optimize or defer"
- Insight narrative unclear → P3: "Copy improvement needed: [specific message]. Polish or defer"

**Testing:**
- Views metric: Seed 100 views → Dashboard shows 100 views
- Actions metric: Seed 50 actions → Dashboard shows 50 actions
- Conversion rate: 50 actions / 100 views → Dashboard shows 50% conversion
- Reach metric: Seed 75 unique users → Dashboard shows reach of 75
- Demographic age 18-24: Seed 15 users → Dashboard shows 15 in 18-24 segment
- Demographic age 25-34: Seed 8 users → Dashboard suppresses with privacy message
- Demographic gender Male: Seed 40 users → Dashboard shows 40 Male
- Demographic gender Female: Seed 5 users → Dashboard suppresses with privacy message
- Geography by state: Seed CA: 30, TX: 20, FL: 5 → CA and TX shown, FL suppressed
- Date range filter 7 days → Only last 7 days data shown
- Date range filter 30 days → Only last 30 days data shown
- Campaign comparison: Campaign A vs B → Both datasets shown side-by-side
- Export CSV → File contains all metrics with correct values
- Privacy suppression: <10 users → Data hidden with "suppressed": true in response
- Privacy threshold exactly 10 → Data displayed correctly
- Cross-browser: Chrome, Firefox, Safari, Edge → All charts render correctly
- Mobile: iOS Safari, Android Chrome → Dashboard responsive, charts readable
- Performance: Dashboard load time <1s with 100 data points
- Performance: Dashboard load time <3s with 10,000 data points
- Accessibility: Keyboard navigation → All controls accessible
- Accessibility: Screen reader → Chart data announced correctly

**Dependencies:**
- Analytics dashboard complete (EGP-089)
- Analytics backend complete (EGP-090)
- Privacy rules enforced (EGP-091)
- Test campaigns with seeded analytics data
- Access to analytics tools and logs

**Definition of Done:**
- [ ] All metrics validated against source data (100% accuracy)
- [ ] Demographic breakdowns tested for all dimensions (age, gender, geography)
- [ ] Privacy threshold verified (suppress <10 users, show ≥10 users)
- [ ] Insight narratives drafted for all key metrics
- [ ] Dashboard usability tested with real users
- [ ] Export CSV tested with various filters and date ranges
- [ ] Cross-browser testing complete (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing complete (iOS Safari, Android Chrome)
- [ ] Performance testing complete (load times, query speed)
- [ ] Accessibility tested (keyboard, screen reader)
- [ ] All P0/P1 defects resolved
- [ ] P2/P3 defects triaged (fix or defer)
- [ ] Test results documented with evidence
- [ ] Analytics feature documentation complete
- [ ] Stakeholder demo conducted
- [ ] Sign-off obtained

---

### ORG-006: View Campaign Emails & Message Count - 8 Story Points

#### EGP-093: [UX] Design Delivery Status View

**Role:** UX
**Story Points:** 1
**Hours:** 4

**Description:**
Design email delivery and message count dashboard for campaign performance monitoring. Create visualizations showing emails sent, delivered, bounced, and spam reports, plus message counts and recent delivery events.

**Core Requirements:**
- Email status overview cards (sent, delivered, bounced, spam reports)
- Message count display (total messages sent via campaign)
- Recent delivery events table (last 50 events)
- Status trend chart (daily email delivery over time)
- Filtering by status (delivered, bounced, spam)
- Date range selector
- Export functionality
- Mobile responsive design

**User Experience:**
- Overview cards show key email metrics at a glance
- Trend chart shows email delivery health over time with color coding (green=delivered, yellow=bounced, red=spam)
- Recent events table shows timestamp, recipient (anonymized), status, and details
- Filters apply instantly to update all views
- Export generates CSV with current filtered data
- Empty state: "No emails sent yet. Campaign messages will appear here once users take action"

**Error Scenarios:**
- Data load fails → Error banner: "Could not load email data. Refresh to try again" with retry button
- No events in date range → Empty state: "No email events in this period. Try a different date range"
- Export fails → Toast: "Export failed. Please try again or contact support"

**Testing:**
- Status cards render with correct counts
- Trend chart displays daily aggregates
- Events table shows recent deliveries with status
- Filters update all views simultaneously
- Date range selector updates data correctly
- Export generates CSV with filtered data
- Mobile view stacks components, maintains usability

**Dependencies:**
- Email delivery data model
- Component library with cards and tables
- Chart library (Recharts)

**Definition of Done:**
- [ ] Status overview cards designed
- [ ] Trend chart layout created
- [ ] Events table design complete
- [ ] Filtering controls designed
- [ ] Export UI designed
- [ ] Mobile responsive layouts complete
- [ ] Empty and loading states defined
- [ ] Accessibility annotations added
- [ ] Developer handoff complete

---

#### EGP-094: [FE] Build Email Delivery Dashboard

**Role:** Frontend
**Story Points:** 2
**Hours:** 12

**Description:**
Implement email delivery and message count dashboard with status cards, trend visualization, event table, and filtering controls. Display delivery health, bounce rates, and recent events for campaign monitoring.

**Core Requirements:**
- Email status cards (sent, delivered, bounced, spam)
- Message count display
- Trend chart (daily delivery status over time)
- Recent events table (paginated, sortable)
- Status filter (all, delivered, bounced, spam)
- Date range picker
- CSV export
- Real-time updates (polling every 60s)
- Loading and error states

**User Experience:**
- Dashboard loads with status cards visible within 1 second
- Trend chart renders with color-coded status (green, yellow, red)
- Events table shows most recent first, paginated (25 per page)
- Click status filter → Chart and table update immediately
- Select date range → All views update to show filtered data
- Export CSV → Downloads file with current view/filters applied
- Auto-refresh every 60s for new events (subtle indicator)

**Error Scenarios:**
- API fails → Error banner: "Unable to load email data. Refresh or contact support" with retry
- No data for filters → Empty state: "No emails match these filters. Try different criteria"
- Export error → Toast: "Export failed. Try again later" with retry option
- Slow query → Loading spinner: "Loading email data..." with timeout at 10s
- Network timeout → Toast: "Connection lost. Check network and retry"

**Testing:**
- Status cards display correct counts (sent, delivered, bounced, spam)
- Message count card shows total campaign messages
- Trend chart renders daily aggregates with correct colors
- Events table shows recent 25 events, sorted by timestamp desc
- Pagination navigates through events (next/prev, page numbers)
- Status filter "delivered" shows only delivered emails
- Status filter "bounced" shows only bounced emails
- Date range filter updates all components
- Export CSV downloads with correct data and headers
- Auto-refresh polls every 60s, updates counts/table
- Loading states show skeletons before data loads
- Error states show with retry option when API fails
- Mobile: Cards stack, table scrolls horizontally, filters accessible
- Accessibility: Keyboard nav works, screen reader announces counts

**Dependencies:**
- Email delivery API (EGP-095)
- Recharts library for trend chart
- Date range picker component
- CSV export utility

**Definition of Done:**
- [ ] Status overview cards implemented
- [ ] Message count card implemented
- [ ] Trend chart with Recharts complete
- [ ] Events table with pagination complete
- [ ] Status filter functional
- [ ] Date range picker working
- [ ] CSV export implemented
- [ ] Auto-refresh (60s polling) working
- [ ] Loading states for all async operations
- [ ] Error handling with retry implemented
- [ ] Mobile responsive design complete
- [ ] Accessibility verified (keyboard, screen readers)
- [ ] Unit tests for filter logic
- [ ] Integration tests for API interactions
- [ ] Cross-browser testing complete
- [ ] Code review approved

---

#### EGP-095: [BE] Delivery Metrics Endpoint

**Role:** Backend
**Story Points:** 2
**Hours:** 12

**Description:**
Build email delivery metrics API aggregating email status events (sent, delivered, bounced, spam) and message counts per campaign. Support filtering, time series data, and recent event retrieval for organization dashboards.

**Core Requirements:**
- GET /api/campaigns/:id/email-metrics - Aggregated email metrics
- Aggregations: emails sent, delivered, bounced, spam reported
- Message count: total messages sent via campaign
- Time series: daily email status rollups for trend charts
- Recent events: last 50 delivery events with status and details
- Filtering: status type, date range
- Caching: 5-minute TTL for aggregates
- Export endpoint: GET /api/campaigns/:id/email-metrics/export (CSV)

**User Experience:**
- Metrics endpoint responds within 300ms for typical queries
- Recent events show up-to-date delivery status
- Cached results provide instant responses for repeated queries
- Export generates complete email dataset with current filters

**Error Scenarios:**
- Campaign not found → 404: "Campaign not found"
- Unauthorized access → 403: "You don't have permission to view this campaign's email metrics"
- Invalid date range → 400: "Invalid date range: end date must be after start date"
- Invalid status filter → 400: "Invalid status: must be one of [sent, delivered, bounced, spam]"
- Query timeout → 504: "Query timed out. Try a smaller date range"
- Database error → 500: "Could not load email metrics. Please try again" with incident ID
- Export too large → 413: "Export exceeds size limit. Filter to smaller dataset"

**Testing:**
- Email metrics endpoint returns counts (sent, delivered, bounced, spam)
- Message count reflects total campaign messages
- Time series returns daily rollups for 30-day range
- Recent events returns last 50 events sorted by timestamp desc
- Status filter "delivered" returns only delivered email events
- Status filter "bounced" returns only bounced email events
- Date range filter returns events only within specified range
- Caching: Second identical query returns cached result (<50ms)
- Cache expiry: After 5 minutes, fresh data fetched
- Export endpoint generates CSV with all filtered data
- Export includes headers: timestamp, status, recipient (hashed), details
- Query performance: Typical query <300ms (p95)
- Unauthorized user receives 403 for other org's campaign metrics
- Invalid campaign ID returns 404
- Invalid status filter returns 400 with allowed values
- Query timeout (>5s) returns 504

**Dependencies:**
- Email delivery tracking (from EMAIL-010)
- Message send tracking (from US-013)
- Caching infrastructure (Redis)
- Database indexes on campaign_id, status, timestamp

**Definition of Done:**
- [ ] Email metrics endpoint implemented
- [ ] Message count aggregation complete
- [ ] Time series rollups implemented (daily)
- [ ] Recent events retrieval working (last 50)
- [ ] Status filtering functional
- [ ] Date range filtering functional
- [ ] Caching implemented (5-min TTL)
- [ ] Export endpoint generates CSV
- [ ] Query optimization with indexes complete
- [ ] All error scenarios handled
- [ ] Unit tests for aggregation logic
- [ ] Integration tests for full flows
- [ ] Performance testing (p95 <300ms)
- [ ] API documentation updated
- [ ] Code review approved

---

#### EGP-096: [TL] Data Freshness and Limits

**Role:** Tech Lead
**Story Points:** 1
**Hours:** 4

**Description:**
Define email delivery data freshness expectations, caching behavior, staleness thresholds, and retention windows for campaign email metrics. Establish query limits, aggregation strategies, and alert thresholds for delivery health monitoring.

**Core Requirements:**
- Data freshness SLA: email status updates within 5 minutes of event
- Caching policy: 5-minute TTL for aggregated metrics
- Staleness threshold: display "Data as of [timestamp]" if >10 minutes old
- Retention window: detailed events 90 days, aggregates 2 years
- Query limits: max 1-year date range, max 10,000 events per query
- Aggregation strategy: pre-compute daily rollups for performance
- Delivery health alerts: bounce rate >10%, spam rate >1%
- Data anonymization: recipient email hashed in event logs

**User Experience:**
- Email metrics update within 5 minutes of delivery events
- Cached data loads instantly for repeated queries
- Staleness clearly indicated when data is outdated
- Retention policies balance performance with compliance

**Error Scenarios:**
- Data >10 minutes old → Display: "Data as of [timestamp]. Refresh for latest"
- Date range exceeds 1 year → 400: "Date range cannot exceed 1 year. Adjust filters"
- Query result >10,000 events → Response truncated with message: "Results limited to 10,000 events. Apply filters for complete data"
- Bounce rate >10% → Alert triggered to org admin: "High bounce rate detected. Review email deliverability"
- Spam rate >1% → Alert triggered: "Spam reports increasing. Review campaign content"

**Testing:**
- Email delivered → Status visible in dashboard within 5 minutes
- Cached metrics: Second query returns <50ms
- Staleness indicator shows when data >10 minutes old
- Detailed events >90 days old auto-deleted
- Aggregates >2 years old auto-deleted
- Date range 1 year + 1 day rejected with 400 error
- Query returns 10,000+ events → Truncated to 10,000 with message
- Bounce rate 11% → Alert triggered to org admin
- Spam rate 1.5% → Alert triggered to org admin
- Recipient email in logs → Stored as hash, not plaintext

**Dependencies:**
- Email delivery webhook processing (EMAIL-010)
- Alerting infrastructure
- Data retention automation

**Definition of Done:**
- [ ] Freshness SLA defined (5 minutes)
- [ ] Caching policy documented (5-min TTL)
- [ ] Staleness threshold specified (10 minutes)
- [ ] Retention windows defined (90 days events, 2 years aggregates)
- [ ] Query limits documented (1 year range, 10k events)
- [ ] Aggregation strategy specified (daily rollups)
- [ ] Delivery health alerts defined (bounce >10%, spam >1%)
- [ ] Anonymization rules documented (hash recipient emails)
- [ ] Rules reviewed by engineering team
- [ ] Implementation verified in code (EGP-095)
- [ ] Test cases defined for all scenarios
- [ ] Runbook for delivery alerts created
- [ ] Data retention automation configured

---

#### EGP-097: [PM] QA and Documentation

**Role:** Project Manager
**Story Points:** 1
**Hours:** 4

**Description:**
Validate email delivery dashboard accuracy, verify metric calculations, test filtering and export, and document email metrics features for organization users. Ensure delivery data is trustworthy and dashboard is intuitive.

**Core Requirements:**
- Metric accuracy validation (compare to email provider logs)
- Status aggregation testing (sent, delivered, bounced, spam)
- Filtering functionality testing
- Export validation
- Dashboard usability testing
- Documentation for email metrics feature

**User Experience:**
- Email metrics are accurate and match source data
- Dashboard provides clear delivery health visibility
- Filters and export work reliably
- Documentation helps orgs interpret email metrics

**Error Scenarios:**
- Metric mismatch with email provider → P0: "Critical: Email metrics incorrect. Immediate fix required"
- Export data incomplete → P1: "Export missing events. High priority fix needed"
- Dashboard slow → P2: "Performance issue: Dashboard >2s load. Optimize or defer"

**Testing:**
- Email sent: Seed 100 sent → Dashboard shows 100 sent
- Email delivered: Seed 80 delivered → Dashboard shows 80 delivered
- Email bounced: Seed 15 bounced → Dashboard shows 15 bounced
- Email spam: Seed 5 spam → Dashboard shows 5 spam
- Message count: Seed 50 campaign messages → Dashboard shows 50 messages
- Trend chart: Seed daily events → Chart shows correct daily aggregates
- Recent events: Seed 60 events → Table shows last 50, sorted by timestamp desc
- Status filter "delivered" → Only delivered events shown
- Status filter "bounced" → Only bounced events shown
- Date range 7 days → Only last 7 days events shown
- Export CSV → File contains all events with correct data
- Cross-browser: Chrome, Firefox, Safari, Edge → Dashboard renders correctly
- Mobile: iOS Safari, Android Chrome → Dashboard responsive, usable
- Performance: Dashboard loads <2s with 1,000 events
- Accuracy: Metrics match email provider logs (100% match)

**Dependencies:**
- Email delivery dashboard complete (EGP-094)
- Email metrics API complete (EGP-095)
- Email delivery data seeded in test environment

**Definition of Done:**
- [ ] All metrics validated against email provider logs (100% accuracy)
- [ ] Status aggregations tested for all types (sent, delivered, bounced, spam)
- [ ] Message count verified
- [ ] Trend chart accuracy validated
- [ ] Recent events table tested
- [ ] All filters tested (status, date range)
- [ ] Export CSV tested and validated
- [ ] Cross-browser testing complete (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing complete (iOS Safari, Android Chrome)
- [ ] Performance tested (load <2s)
- [ ] Usability tested with real users
- [ ] All P0/P1 defects resolved
- [ ] Documentation drafted for email metrics feature
- [ ] Test results documented
- [ ] Sign-off obtained

---

*Sprint 4 contains 19 tickets (EGP-079 through EGP-097) totaling 52 story points and 212 hours. The next ticket ID is EGP-098 for Sprint 5.*


---

## Sprint 5: Premium Membership, Campaign Management & Messaging Flows (Weeks 11-12)

**Sprint Goal:** Complete premium subscription flows, campaign editing capabilities, design system documentation, and all message entry flows
**Total Story Points:** 41
**Total Hours:** 200

### DOC-001: Design System Documentation Foundations - 2 Story Points

#### EGP-098: [UX] Create Design System Documentation

**Role:** UX
**Story Points:** 1
**Hours:** 4

**Description:**
Create foundational design system documentation for core UI components, usage patterns, and contribution guidelines. Document component states, variants, accessibility requirements, and design decisions to enable consistent implementation across the application.

**Core Requirements:**
- Component library documentation (buttons, inputs, forms, cards, modals)
- Usage guidelines and best practices per component
- State documentation (default, hover, active, disabled, error, success)
- Accessibility requirements (ARIA labels, keyboard nav, focus management)
- Color system and typography standards
- Spacing and layout grid documentation
- Contribution guidelines for new components

**Dependencies:** Component library implemented in previous sprints
**Definition of Done:** [ ] All core components documented [ ] Usage guidelines published [ ] Accessibility requirements specified [ ] Team walkthrough completed [ ] Documentation accessible to all engineers

---

#### EGP-099: [TL] Establish Design System Standards

**Role:** Tech Lead
**Story Points:** 1
**Hours:** 4

**Description:**
Define design system technical standards, component architecture patterns, and contribution workflow. Establish code organization, naming conventions, testing requirements, and review process for design system components.

**Core Requirements:**
- Component architecture patterns (composition, props API design)
- Code organization and file structure
- Naming conventions (components, props, CSS classes)
- Testing requirements (unit tests, accessibility tests, visual regression)
- Review and approval process for new components
- Versioning strategy for design system updates

**Dependencies:** FE component examples, UX documentation (EGP-098)
**Definition of Done:** [ ] Technical standards documented [ ] Contribution workflow defined [ ] Review process established [ ] Engineering team alignment [ ] Documentation published

---

### ORG-004: Edit & Pause Campaigns - 8 Story Points

#### EGP-100: [UX] Design Campaign Edit & Pause Flows

**Role:** UX
**Story Points:** 1
**Hours:** 4

**Description:**
Design campaign editing interface and pause/resume controls allowing organization admins to modify published campaigns and temporarily hide them from public view. Create edit flows that reuse creation patterns while respecting published campaign constraints.

**Core Requirements:**
- Campaign edit form (reuses creation UI with published constraints)
- Field editability rules visualization (grayed out non-editable fields)
- Pause/Resume toggle control
- Paused state indicators (banner, badge)
- Edit confirmation with change summary
- Audit trail visualization (who changed what, when)

**Dependencies:** Campaign creation UX (EGP-079), campaign data model
**Definition of Done:** [ ] Edit flows designed [ ] Pause/resume controls designed [ ] Published constraints visualized [ ] Mobile variants complete [ ] Developer handoff complete

---

#### EGP-101: [FE] Build Campaign Edit & Pause UI

**Role:** Frontend
**Story Points:** 2
**Hours:** 12

**Description:**
Implement campaign editing and pause/resume functionality reusing campaign creation components with appropriate constraints for published campaigns. Build edit forms, pause toggle, status indicators, and change preview.

**Core Requirements:**
- Edit form reusing creation wizard components
- Field-level editability enforcement (disable non-editable fields post-publish)
- Pause/Resume toggle with confirmation
- Paused campaign banner on public view
- Change preview showing before/after
- Edit history timeline

**Testing:** Edit published campaign → Changes persist; Pause campaign → Hidden from public; Resume → Visible again
**Dependencies:** Campaign creation UI (EGP-080), edit endpoints (EGP-102)
**Definition of Done:** [ ] Edit form functional [ ] Pause/resume toggle working [ ] Field editability enforced [ ] Preview implemented [ ] Edit history displayed [ ] All tests passing [ ] Code review approved

---

#### EGP-102: [BE] Campaign Update & Pause Endpoints

**Role:** Backend
**Story Points:** 2
**Hours:** 12

**Description:**
Build campaign update and pause/resume endpoints with field editability rules, audit trail logging, and visibility state management. Enforce which fields can be modified post-publish and track all changes.

**Core Requirements:**
- PUT /api/campaigns/:id - Update campaign with editability rules
- POST /api/campaigns/:id/pause - Pause campaign (hide from public)
- POST /api/campaigns/:id/resume - Resume campaign (make visible)
- Field editability enforcement (block edits to locked fields)
- Audit trail logging (field, old value, new value, user, timestamp)
- Visibility state management (paused campaigns excluded from public queries)

**Testing:** Update editable field → Success; Update locked field → 403; Pause → Audit logged, hidden from public; Resume → Visible again
**Dependencies:** Campaign creation endpoints (EGP-081)
**Definition of Done:** [ ] Update endpoint with editability rules [ ] Pause/resume endpoints [ ] Audit trail logging [ ] Visibility management [ ] All tests passing [ ] API docs updated [ ] Code review approved

---

#### EGP-103: [TL] Define Publishing & Editability Rules

**Role:** Tech Lead
**Story Points:** 1
**Hours:** 4

**Description:**
Define which campaign fields are editable after publishing and rules for pause/resume functionality. Establish constraints to maintain campaign integrity while allowing necessary updates.

**Core Requirements:**
- Editable fields post-publish (title, description, media - YES; campaign type, bill ID - NO)
- Pause visibility rules (paused campaigns hidden from all public views, visible to org admins only)
- Resume requirements (no validation re-run, immediate visibility restore)
- Audit requirements (log all field changes with user attribution)

**Dependencies:** Campaign data model (EGP-082)
**Definition of Done:** [ ] Editability rules documented [ ] Pause rules specified [ ] Audit requirements defined [ ] Rules implemented in BE (EGP-102) [ ] FE aligned with rules (EGP-101)

---

#### EGP-104: [PM] QA Campaign Edit & Pause Flows

**Role:** Project Manager
**Story Points:** 1
**Hours:** 4

**Description:**
Validate campaign editing and pause/resume functionality across all campaign types. Test editability constraints, pause visibility, audit trail accuracy, and create support documentation.

**Testing:** Edit title → Success; Edit campaign type → Blocked; Pause → Hidden from public list/search; Resume → Visible; Audit shows all changes
**Dependencies:** Edit UI (EGP-101), edit API (EGP-102)
**Definition of Done:** [ ] All edit scenarios tested [ ] Pause/resume flows validated [ ] Editability constraints verified [ ] Audit trail accuracy confirmed [ ] Support docs drafted [ ] Sign-off obtained

---

### US-013: Send Message - Campaign Flow - 5 Story Points

#### EGP-105: [UX] Design Campaign-to-Message Flow

**Role:** UX
**Story Points:** 1
**Hours:** 4

**Description:**
Design seamless handoff from campaign view to message composition with campaign context automatically prefilled. Create CTA placement, prefill patterns, and context preservation throughout message flow.

**Core Requirements:**
- "Take Action" / "Voice Your Opinion" CTA on campaign detail page
- Message compose with campaign context prefilled (bill info, stance, recipient suggestion)
- Campaign attribution badge in compose UI ("Responding to: [Campaign Name]")
- User can modify prefilled content before sending

**Dependencies:** Campaign detail UI (EGP-080), message compose UI (from Sprint 2)
**Definition of Done:** [ ] CTA designs complete [ ] Prefill patterns defined [ ] Context preservation specified [ ] Developer handoff complete

---

#### EGP-106: [FE] Build Campaign Message Entry Flow

**Role:** Frontend
**Story Points:** 1
**Hours:** 8

**Description:**
Implement campaign-to-message flow with context handoff, prefill logic, and campaign attribution tracking. Build CTA trigger, compose integration, and context preservation.

**Core Requirements:**
- "Take Action" CTA with click handler
- Campaign context pass to compose (campaign ID, bill info, suggested stance)
- Prefill message compose with campaign context
- Campaign attribution display in compose UI
- Context preservation if user navigates away and returns

**Testing:** Click CTA → Compose opens with context; Prefilled fields editable; Send → Message attributed to campaign
**Dependencies:** Campaign detail page, message compose component (Sprint 2), prefill API (EGP-107)
**Definition of Done:** [ ] CTA functional [ ] Prefill working [ ] Attribution displayed [ ] Context preserved on navigation [ ] Tests passing [ ] Code review approved

---

#### EGP-107: [BE] Campaign Context & Attribution

**Role:** Backend
**Story Points:** 1
**Hours:** 8

**Description:**
Support campaign context in message compose prefill and ensure campaign attribution is recorded with message send events for analytics tracking.

**Core Requirements:**
- Accept campaign ID in message compose/prefill requests
- Return campaign context (bill info, suggested stance, recipients)
- Record campaign attribution with message send (campaign_id field)
- Link message actions to campaign in analytics

**Testing:** Request with campaign ID → Context returned; Send message → campaign_id recorded; Analytics → Message attributed to campaign
**Dependencies:** Message send endpoints (Sprint 2), campaign data
**Definition of Done:** [ ] Prefill accepts campaign context [ ] Campaign context returned [ ] Attribution recorded with sends [ ] Analytics integration complete [ ] Tests passing [ ] Code review approved

---

#### EGP-108: [PM] QA Campaign Flow Integration

**Role:** Project Manager
**Story Points:** 1
**Hours:** 4

**Description:**
Validate campaign-to-message flow end-to-end across multiple campaigns and user states. Verify prefill accuracy, attribution tracking, and analytics reporting.

**Testing:** CTA from campaign A → Compose prefilled with A context; Send → Analytics shows attribution to campaign A; Repeat for campaign B, C → Correct attribution
**Dependencies:** Campaign flow complete (EGP-105-107)
**Definition of Done:** [ ] Multiple campaigns tested [ ] Prefill accuracy verified [ ] Attribution tracking confirmed [ ] Analytics reporting validated [ ] Sign-off obtained

---

### US-013: Send Message - Remaining Flows - 5 Story Points

#### EGP-109: [UX] Design Remaining Message Entry Points

**Role:** UX
**Story Points:** 1
**Hours:** 4

**Description:**
Design all remaining message entry flows including saved drafts, quick action buttons, and other edge cases. Ensure consistent handoff patterns across all message triggers.

**Core Requirements:**
- Saved draft resume flow (from draft list to compose)
- Quick action buttons (from bill detail, news story, representative profile)
- Share/forward message flow
- Consistent context preservation patterns

**Dependencies:** Message compose UI, various source pages
**Definition of Done:** [ ] All entry flows designed [ ] Context handoff patterns defined [ ] Edge cases documented [ ] Developer handoff complete

---

#### EGP-110: [FE] Build Remaining Message Flows

**Role:** Frontend
**Story Points:** 1
**Hours:** 8

**Description:**
Implement all remaining message entry points with consistent context handoff and attribution tracking. Complete message flow coverage across the application.

**Core Requirements:**
- Draft resume functionality
- Quick action CTAs across relevant pages
- Context token handling for all flows
- Attribution tracking per entry point

**Testing:** Resume draft → Compose loads saved content; Quick action → Compose with page context; All flows → Correct attribution
**Dependencies:** Entry point designs (EGP-109), handoff API (EGP-111)
**Definition of Done:** [ ] All entry points implemented [ ] Context handoff working [ ] Attribution tracking complete [ ] Tests passing [ ] Code review approved

---

#### EGP-111: [BE] Handoff Token & Attribution Support

**Role:** Backend
**Story Points:** 1
**Hours:** 4

**Description:**
Implement handoff token validation and attribution tracking for all message entry flows. Ensure secure context passing and complete action attribution.

**Core Requirements:**
- Handoff token generation and validation
- Multi-flow attribution support (campaign, draft, bill, news, rep)
- Token expiry and security controls
- Attribution metadata in analytics

**Testing:** Generate token → Valid for 30min; Expired token → Rejected; All flows → Attribution recorded correctly
**Dependencies:** Message send endpoints
**Definition of Done:** [ ] Token system implemented [ ] All flow types supported [ ] Attribution complete [ ] Security validated [ ] Tests passing [ ] Code review approved

---

#### EGP-112: [PM] QA Message Flow Matrix

**Role:** Project Manager
**Story Points:** 1
**Hours:** 4

**Description:**
Execute comprehensive QA matrix covering all message entry flows. Verify every documented flow works end-to-end with correct attribution.

**Testing Matrix:** Campaign → Compose → Send ✓; Draft → Resume → Send ✓; Bill → Quick Action → Send ✓; News → Action → Send ✓; Rep → Contact → Send ✓
**Dependencies:** All message flows complete (EGP-109-111)
**Definition of Done:** [ ] All flows in matrix tested [ ] Attribution verified for each [ ] Edge cases validated [ ] Defects triaged [ ] Sign-off obtained

---

### US-020: View & Subscribe to Premium Membership - 13 Story Points

#### EGP-113: [UX] Design Premium Membership & Checkout

**Role:** UX
**Story Points:** 2
**Hours:** 8

**Description:**
Design premium membership presentation, pricing page, checkout flow, and post-purchase confirmation. Create compelling value proposition and seamless Stripe Checkout integration.

**Core Requirements:**
- Premium benefits page (features, pricing, FAQs)
- Pricing comparison (Free vs Premium)
- Stripe Checkout integration flow
- Purchase confirmation screen
- Membership badge and indicators
- Upgrade prompts in feature discovery

**Dependencies:** Premium features defined, Stripe integration plan
**Definition of Done:** [ ] Benefits page designed [ ] Pricing comparison complete [ ] Checkout flow designed [ ] Confirmation screen designed [ ] Upgrade prompts designed [ ] Developer handoff complete

---

#### EGP-114: [FE] Build Premium Membership UI

**Role:** Frontend
**Story Points:** 3
**Hours:** 20

**Description:**
Implement premium membership presentation, Stripe Checkout integration, purchase flow, and membership state management throughout the application.

**Core Requirements:**
- Premium benefits and pricing page
- Stripe Checkout session initiation
- Checkout redirect and return handling
- Purchase confirmation display
- Membership badge components
- Premium feature gating (show upgrade prompts for non-premium users)

**Testing:** View pricing → Details clear; Click subscribe → Stripe Checkout opens; Complete payment → Confirmation shown; Premium badge → Displays for premium users
**Dependencies:** Stripe Checkout configured, checkout API (EGP-115)
**Definition of Done:** [ ] Pricing page implemented [ ] Stripe integration complete [ ] Confirmation flow working [ ] Premium badges displaying [ ] Feature gating functional [ ] Tests passing [ ] Code review approved

---

#### EGP-115: [BE] Checkout Session & Webhook Handling

**Role:** Backend
**Story Points:** 3
**Hours:** 20

**Description:**
Build Stripe Checkout session creation endpoint and webhook handler to process payment events and activate premium membership. Handle subscription lifecycle and maintain user membership state.

**Core Requirements:**
- POST /api/checkout/create-session - Create Stripe Checkout session
- Webhook endpoint for Stripe events (checkout.session.completed, invoice.paid, invoice.payment_failed)
- Membership activation on successful payment
- Membership tier update in user record
- Invoice and payment history recording
- Webhook event idempotency

**Testing:** Create session → Stripe checkout URL returned; checkout.session.completed → User tier upgraded to premium; invoice.paid → Payment recorded; invoice.payment_failed → User notified, retry scheduled
**Dependencies:** Stripe account configured, user membership schema
**Definition of Done:** [ ] Session creation endpoint implemented [ ] Webhook handler complete [ ] Membership activation working [ ] Payment history recording [ ] Idempotency enforced [ ] Tests passing [ ] API docs updated [ ] Code review approved

---

#### EGP-116: [TL] Payment Configuration & Webhook Reliability

**Role:** Tech Lead
**Story Points:** 2
**Hours:** 8

**Description:**
Configure Stripe payment processing, define webhook infrastructure, ensure reliable event handling, and establish monitoring for payment flows.

**Core Requirements:**
- Stripe API keys and webhook secret configuration
- Required webhook events specification (checkout, invoice, subscription)
- Webhook retry and failure handling policy
- Metadata requirements (user ID, plan tier in checkout sessions)
- Payment monitoring and alerting (failed payments, webhook failures)

**Dependencies:** Stripe account and webhook endpoint
**Definition of Done:** [ ] Stripe configured in all environments [ ] Webhook events defined [ ] Retry policy established [ ] Metadata requirements specified [ ] Monitoring configured [ ] Team walkthrough completed

---

#### EGP-117: [PM] Premium Offer Review & QA

**Role:** Project Manager
**Story Points:** 2
**Hours:** 8

**Description:**
Review premium membership value proposition, validate pricing presentation, test complete purchase flow including payment success and failure scenarios.

**Testing:** View benefits → Clear value; Pricing comparison → Accurate; Click subscribe → Checkout loads; Test card success → Membership activated; Test card decline → Error handled gracefully
**Dependencies:** Premium UI (EGP-114), checkout backend (EGP-115)
**Definition of Done:** [ ] Value proposition reviewed [ ] Pricing validated [ ] Purchase flow tested [ ] Payment success verified [ ] Payment failure handled [ ] Stakeholder approval [ ] Sign-off obtained

---

### US-021: Manage Subscription - 8 Story Points

#### EGP-118: [UX] Design Subscription Management UI

**Role:** UX
**Story Points:** 1
**Hours:** 4

**Description:**
Design subscription management interface showing current plan, billing info, payment method, invoice history, and plan change/cancellation controls.

**Core Requirements:**
- Current plan display (tier, price, billing cycle, next bill date)
- Payment method display with update option
- Invoice history list
- Plan change controls (upgrade/downgrade)
- Cancellation flow with confirmation

**Dependencies:** Premium membership UX (EGP-113)
**Definition of Done:** [ ] Plan display designed [ ] Payment management UI complete [ ] Invoice history designed [ ] Cancellation flow designed [ ] Developer handoff complete

---

#### EGP-119: [FE] Build Subscription Management Interface

**Role:** Frontend
**Story Points:** 2
**Hours:** 12

**Description:**
Implement subscription management dashboard allowing users to view plan details, update payment methods, view invoices, and cancel subscriptions.

**Core Requirements:**
- Current subscription display
- Payment method management
- Invoice list with download links
- Plan change interface
- Cancellation flow with confirmation modal

**Testing:** View subscription → Plan details shown; Update payment → Stripe modal opens; View invoices → List displayed; Cancel → Confirmation required → Subscription canceled
**Dependencies:** Subscription API (EGP-120)
**Definition of Done:** [ ] Subscription dashboard implemented [ ] Payment update working [ ] Invoice display functional [ ] Cancellation flow complete [ ] Tests passing [ ] Code review approved

---

#### EGP-120: [BE] Subscription Management Endpoints

**Role:** Backend
**Story Points:** 2
**Hours:** 12

**Description:**
Build subscription management API endpoints for retrieving subscription details, updating payment methods, downloading invoices, and handling subscription changes/cancellations.

**Core Requirements:**
- GET /api/subscription - Retrieve user subscription details
- GET /api/subscription/invoices - List invoices
- POST /api/subscription/update-payment - Create Stripe payment method update session
- POST /api/subscription/cancel - Cancel subscription
- Webhook handling for subscription updates (customer.subscription.updated, customer.subscription.deleted)

**Testing:** Get subscription → Returns plan, status, billing; Get invoices → Returns history; Cancel → Webhook updates status; Reactivate → Tier restored
**Dependencies:** Stripe subscription objects, webhook handler from US-020
**Definition of Done:** [ ] All endpoints implemented [ ] Payment update working [ ] Cancellation functional [ ] Webhook handling complete [ ] Tests passing [ ] API docs updated [ ] Code review approved

---

#### EGP-121: [TL] Subscription Lifecycle Rules

**Role:** Tech Lead
**Story Points:** 1
**Hours:** 4

**Description:**
Define subscription lifecycle rules including plan changes, cancellation policies, grace periods, and reactivation logic.

**Core Requirements:**
- Plan change rules (immediate upgrade, end-of-cycle downgrade)
- Cancellation policy (immediate vs end-of-cycle)
- Grace period for failed payments (retry schedule)
- Reactivation flow (restore access on payment success)
- Proration rules for mid-cycle changes

**Dependencies:** Stripe subscription lifecycle events
**Definition of Done:** [ ] Lifecycle rules documented [ ] Change policies defined [ ] Grace periods specified [ ] Reactivation flow defined [ ] Rules implemented in BE (EGP-120)

---

#### EGP-122: [PM] QA Subscription Management Flows

**Role:** Project Manager
**Story Points:** 1
**Hours:** 4

**Description:**
Validate subscription management flows including viewing details, updating payment, accessing invoices, and canceling/reactivating subscriptions.

**Testing:** View subscription → Accurate details; Update payment → Stripe flow works; Download invoice → PDF generated; Cancel → Immediate or end-of-cycle per policy; Failed payment → Retry schedule → Grace period → Cancellation
**Dependencies:** Subscription UI (EGP-119), subscription API (EGP-120)
**Definition of Done:** [ ] Subscription viewing tested [ ] Payment update validated [ ] Invoice access verified [ ] Cancellation flow tested [ ] Failed payment handling validated [ ] Sign-off obtained

---

*Sprint 5 contains 25 tickets (EGP-098 through EGP-122) totaling 41 story points and 200 hours. The next ticket ID is EGP-123 for Sprint 6.*

---

## Sprint 6: Admin Management, Email Infrastructure & Documentation (Weeks 13-14)

**Sprint Goal:** Deliver admin capabilities for user/org/campaign management, establish email infrastructure with deliverability tracking, and publish technical runbooks for operations

**Total Story Points:** 45
**Total Hours:** 212

### ADMIN-002: Manage Users (13 pts, 64 hours)
Admin interface to search, view, and manage users with role controls, audit logging, and permission enforcement.

---

#### EGP-123: [UX] Design Admin User Management Interface

**Role:** UX
**Story Points:** 2
**Hours:** 8

**Description:**
Design searchable admin user list with view/edit controls, role management, and audit visibility. Provide clear permissions feedback and safety guardrails for sensitive actions.

**Core Requirements:**
- User list with search/filter/sort controls
- User detail view with profile, activity, and role information
- Role change interface with confirmation for sensitive actions
- Audit trail view for admin actions
- Permission indicators and disabled states for unauthorized actions

**Testing:** Search users by email/name → Results filtered correctly; View user detail → All sections load; Change role → Confirmation dialog shown; Attempt unauthorized action → UI prevents with clear message
**Dependencies:** Admin permissions model from TL (EGP-126)
**Definition of Done:** [ ] List/detail screens designed [ ] Role management flows complete [ ] Audit view designed [ ] Permission states defined [ ] Stakeholder review approved

---

#### EGP-124: [FE] Build Admin User Management UI

**Role:** Frontend
**Story Points:** 4
**Hours:** 20

**Description:**
Build admin user management interface with search, filtering, user detail views, and role editing. Enforce permissions in UI and provide immediate feedback for all actions.

**Core Requirements:**
- Searchable/filterable user list with pagination
- User detail view with tabs (profile, messages, activity, audit log)
- Role toggle/dropdown with confirmation dialogs
- Permission-aware UI (disable actions for insufficient permissions)
- Real-time updates after role changes
- Error handling and retry for failed operations

**Testing:** Search "john@" → Matching users shown; Edit user role from viewer to editor → Confirmation → Role updated immediately; Non-admin views page → Limited actions visible; API error during save → Retry option shown
**Dependencies:** User admin API (EGP-125), UX design (EGP-123)
**Definition of Done:** [ ] User list implemented [ ] Detail view complete [ ] Role editing working [ ] Permissions enforced [ ] Error states handled [ ] Tests passing [ ] Code review approved

---

#### EGP-125: [BE] User Admin Endpoints

**Role:** Backend
**Story Points:** 4
**Hours:** 20

**Description:**
Provide protected admin endpoints for user list/search, detail retrieval, and role updates with comprehensive audit logging and authorization checks.

**Core Requirements:**
- GET /api/admin/users - List with search/filter/pagination
- GET /api/admin/users/:id - User detail with activity summary
- PATCH /api/admin/users/:id - Update role and profile fields
- Admin-only authorization middleware
- Audit log entries for all mutations (who, what, when, before/after values)
- Input validation and sanitization
- Role-based access control enforcement

**Testing:** Admin calls GET /users → List returned; Non-admin calls → 403; Search by email → Filtered results; PATCH role from viewer to editor → Updated and audit entry created; Invalid role value → 400 with validation message
**Dependencies:** Admin auth middleware, audit logging schema
**Definition of Done:** [ ] List endpoint implemented [ ] Detail endpoint complete [ ] Update endpoint with audit [ ] Authorization enforced [ ] Input validation complete [ ] Tests passing [ ] API docs updated [ ] Code review approved

---

#### EGP-126: [TL] Admin Permissions & Safety Model

**Role:** Tech Lead
**Story Points:** 2
**Hours:** 8

**Description:**
Define admin role matrix, permission boundaries, and safety guardrails for user management. Establish audit requirements and sensitive action policies.

**Core Requirements:**
- Role definitions (Super Admin, Admin, Support Viewer)
- Permission matrix (who can view/edit what)
- Sensitive action list requiring confirmation or approval
- Audit logging requirements (what to log, retention)
- Rate limits for bulk operations
- Data privacy rules (PII access controls)

**Testing:** Role matrix documented → All capabilities assigned; Sensitive actions list → Confirmation flows defined; Audit requirements → Retention period specified; Review with security team → Approved
**Dependencies:** Security requirements, compliance needs
**Definition of Done:** [ ] Role matrix documented [ ] Permissions defined [ ] Sensitive actions identified [ ] Audit requirements specified [ ] Safety guardrails documented [ ] Team review complete [ ] Docs published

---

#### EGP-127: [PM] QA Admin User Management

**Role:** Project Manager
**Story Points:** 1
**Hours:** 8

**Description:**
Validate admin user management flows including search, role changes, audit visibility, and permission enforcement across different admin roles.

**Core Requirements:**
- QA checklist for search/filter/sort functionality
- Role change scenarios (upgrade, downgrade, edge cases)
- Audit log verification (entries complete and accurate)
- Permission enforcement testing (unauthorized access blocked)
- Cross-role testing (Super Admin, Admin, Support Viewer)

**Testing:** Run Test IDs: ADMIN-3; Search users → Results accurate; Change role → Audit entry appears; View as Support Viewer → Edit actions hidden; Attempt unauthorized edit → 403 error; Audit log → All actions recorded
**Dependencies:** Admin UI (EGP-124), admin API (EGP-125)
**Definition of Done:** [ ] Search/filter tested [ ] Role changes validated [ ] Audit trail verified [ ] Permissions enforced [ ] Edge cases covered [ ] No P1/P2 defects [ ] Sign-off obtained

---

### ADMIN-003: Manage Organizations (8 pts, 36 hours)
Admin tools to view, update status, and moderate organization accounts with governance rules and audit trails.

---

#### EGP-128: [UX+FE] Organization Admin Interface

**Role:** UX + Frontend
**Story Points:** 3
**Hours:** 16 (UX 4 + FE 12)

**Description:**
Design and build admin organization management interface allowing status changes (active/suspended), viewing org details, and tracking moderation flags.

**Core Requirements:**
- Organization list with search/filter (status, focus areas, risk flags)
- Org detail view with profile, team, campaigns, and activity
- Status change controls (suspend/reactivate) with reason capture
- Risk flag indicators and moderation notes
- Audit trail view for org-level actions
- Real-time status updates across UI

**Testing:** Run Test IDs: ADMIN-2; Search org by name → Results filtered; Suspend org with reason → Status changes immediately; View suspended org in partner portal → Status reflected; Reactivate → Status updated; Audit log → All actions recorded with reasons
**Dependencies:** Org governance rules (EGP-130), org admin API (EGP-129)
**Definition of Done:** [ ] Design approved [ ] Org list implemented [ ] Detail view complete [ ] Status controls working [ ] Audit view functional [ ] Tests passing [ ] Code review approved

---

#### EGP-129: [BE] Organization Admin Endpoints

**Role:** Backend
**Story Points:** 3
**Hours:** 12

**Description:**
Provide admin endpoints for organization listing, detail retrieval, and status management with audit logging and notification triggers.

**Core Requirements:**
- GET /api/admin/organizations - List with filters and pagination
- GET /api/admin/organizations/:id - Org detail with team and campaigns
- PATCH /api/admin/organizations/:id/status - Update status (active/suspended) with reason
- Audit log entries for status changes
- Notification trigger when org suspended (notify org admins)
- Status enforcement in org endpoints (suspended orgs can't create campaigns)

**Testing:** Admin calls GET /organizations → List returned; PATCH status to suspended with reason → Status updated, audit created, notification sent; Org admin attempts action while suspended → 403 with suspension message; Reactivate → Status changed, audit logged
**Dependencies:** Org schema with status field, notification system
**Definition of Done:** [ ] List endpoint implemented [ ] Detail endpoint complete [ ] Status endpoint with audit [ ] Notifications triggered [ ] Status enforcement working [ ] Tests passing [ ] API docs updated [ ] Code review approved

---

#### EGP-130: [TL] Organization Governance Rules

**Role:** Tech Lead
**Story Points:** 1
**Hours:** 4

**Description:**
Define organization status lifecycle, suspension criteria, risk flags, and reactivation policies. Establish moderation triggers and notification requirements.

**Core Requirements:**
- Status definitions (Active, Suspended, Under Review, Deactivated)
- Suspension criteria and risk flags (abuse, policy violation, security)
- Reactivation process and approval requirements
- Notification requirements for status changes
- Impact of suspension (campaign visibility, team access, messaging)

**Testing:** Status lifecycle documented → All transitions defined; Suspension criteria → Clear triggers identified; Review with legal/compliance → Approved
**Dependencies:** Legal/compliance requirements, trust & safety policies
**Definition of Done:** [ ] Status lifecycle documented [ ] Suspension criteria defined [ ] Risk flags identified [ ] Reactivation process specified [ ] Notification requirements clear [ ] Team review complete [ ] Docs published

---

#### EGP-131: [PM] QA Organization Administration

**Role:** Project Manager
**Story Points:** 1
**Hours:** 4

**Description:**
Validate organization admin flows including search, status changes, notification delivery, and impact verification across partner portal.

**Core Requirements:**
- Test status change workflows (suspend, reactivate, under review)
- Verify notifications sent to org admins on status changes
- Confirm suspension impact (campaigns hidden, actions blocked)
- Validate audit trail completeness

**Testing:** Suspend org → Status changes, notification sent to admins, campaigns hidden from public; Org admin attempts campaign creation while suspended → Blocked with clear message; Reactivate → Restored access, audit logged; Audit trail → All changes recorded with reasons
**Dependencies:** Org admin UI (EGP-128), org admin API (EGP-129)
**Definition of Done:** [ ] Status workflows tested [ ] Notifications verified [ ] Impact validation complete [ ] Audit trail verified [ ] No P1/P2 defects [ ] Sign-off obtained

---

### ADMIN-005: Manage & Suspend Campaigns (8 pts, 36 hours)
Admin moderation tools for campaign review, suspension, and reactivation with policy enforcement and org notifications.

---

#### EGP-132: [UX+FE] Campaign Moderation Interface

**Role:** UX + Frontend
**Story Points:** 3
**Hours:** 16 (UX 4 + FE 12)

**Description:**
Design and build campaign moderation interface allowing admins to review, suspend, and reactivate campaigns with reason capture and org communication.

**Core Requirements:**
- Campaign list with filters (status, policy flags, reported)
- Campaign detail view with content review mode
- Suspend/reactivate controls with reason selection (policy violation, misinformation, spam, abuse)
- Reason visibility in org partner dashboard
- Moderation history and audit trail
- Bulk moderation tools for related campaigns

**Testing:** Run Test IDs: ADMIN-1, CAMP-4; Review flagged campaign → Full content visible; Suspend with reason "policy violation" → Status changes, org notified; Org views campaign → Suspension reason displayed; Reactivate → Campaign visible again; Audit log → All actions recorded
**Dependencies:** Moderation policy (EGP-134), campaign moderation API (EGP-133)
**Definition of Done:** [ ] Design approved [ ] Campaign list implemented [ ] Detail review mode complete [ ] Suspend/reactivate working [ ] Reason display functional [ ] Tests passing [ ] Code review approved

---

#### EGP-133: [BE] Campaign Moderation Endpoints

**Role:** Backend
**Story Points:** 3
**Hours:** 12

**Description:**
Provide admin endpoints for campaign moderation including suspend/reactivate actions, notification triggers, and comprehensive audit logging.

**Core Requirements:**
- GET /api/admin/campaigns - List with moderation filters
- PATCH /api/admin/campaigns/:id/suspend - Suspend with reason
- PATCH /api/admin/campaigns/:id/reactivate - Reactivate campaign
- Audit log for all moderation actions (admin, campaign, reason, timestamp)
- Notification trigger to org admins on suspension/reactivation
- Status enforcement (suspended campaigns hidden from public, can't receive actions)

**Testing:** Admin suspends campaign with reason → Status updated, audit created, org notified; Public API excludes suspended campaigns; Org attempts to edit suspended campaign → Allowed (can prepare changes); Reactivate → Status changed, visible again, audit logged
**Dependencies:** Campaign schema with moderation fields, notification system
**Definition of Done:** [ ] Moderation endpoints implemented [ ] Status enforcement working [ ] Notifications triggered [ ] Audit logging complete [ ] Public API filtering working [ ] Tests passing [ ] API docs updated [ ] Code review approved

---

#### EGP-134: [TL] Campaign Moderation Policy

**Role:** Tech Lead
**Story Points:** 1
**Hours:** 4

**Description:**
Define campaign moderation criteria, suspension reasons, escalation process, and notification requirements. Establish content review guidelines and appeal mechanisms.

**Core Requirements:**
- Suspension reason catalog (policy violation, misinformation, spam, abuse, legal)
- Moderation criteria and triggers (automated flags, user reports, manual review)
- Escalation process for complex cases
- Notification templates for org communication
- Appeal process and timeline
- Content review guidelines for admins

**Testing:** Reason catalog documented → All scenarios covered; Escalation process → Clear triggers and owners; Review with legal/trust & safety → Approved
**Dependencies:** Trust & safety policies, legal requirements
**Definition of Done:** [ ] Reason catalog defined [ ] Moderation criteria documented [ ] Escalation process established [ ] Notification templates created [ ] Appeal process specified [ ] Team review complete [ ] Docs published

---

#### EGP-135: [PM] QA Campaign Moderation

**Role:** Project Manager
**Story Points:** 1
**Hours:** 4

**Description:**
Validate campaign moderation workflows including suspension, notification delivery, reason visibility, and reactivation across admin and partner portals.

**Core Requirements:**
- Test suspend/reactivate workflows with all reason types
- Verify org notifications sent and reason displayed
- Confirm suspended campaigns hidden from public
- Validate audit trail and moderation history
- Test edge cases (bulk suspend, repeated violations)

**Testing:** Suspend campaign → Org notified, reason visible in partner dashboard, hidden from public; User attempts message to suspended campaign → Blocked or redirected; Reactivate → Campaign visible, audit logged; Bulk suspend multiple campaigns → All processed, notifications sent
**Dependencies:** Moderation UI (EGP-132), moderation API (EGP-133)
**Definition of Done:** [ ] Suspend workflows tested [ ] Notifications verified [ ] Reason visibility confirmed [ ] Public hiding validated [ ] Audit trail complete [ ] No P1/P2 defects [ ] Sign-off obtained

---

### EMAIL-010: Email Infrastructure & Deliverability (13 pts, 64 hours)
Email sending infrastructure with deliverability tracking, bounce/complaint handling, and domain authentication.

---

#### EGP-136: [UX+FE] Email Trigger Integration

**Role:** UX + Frontend
**Story Points:** 2
**Hours:** 12 (UX 4 + FE 8)

**Description:**
Design and implement frontend trigger points for transactional emails (signup verification, message confirmations) with clear user feedback and no duplicate sends.

**Core Requirements:**
- Signup flow triggers verification email with clear on-screen confirmation
- Message send triggers confirmation email
- Email preference indicators (verified/unverified status)
- Resend controls with rate limiting feedback
- Email delivery status display where relevant

**Testing:** Run Test IDs: EMAIL-1, EMAIL-2; Signup → Verification email triggered, on-screen confirmation shown; Resend verification → One email sent, rate limit enforced; Message sent → Confirmation email triggered; Check inbox → Emails received correctly
**Dependencies:** Email send API (EGP-137), email templates
**Definition of Done:** [ ] Design approved [ ] Signup trigger implemented [ ] Message trigger implemented [ ] Resend controls working [ ] Status display functional [ ] Tests passing [ ] Code review approved

---

#### EGP-137: [BE] Email Send & Webhook Infrastructure

**Role:** Backend
**Story Points:** 6
**Hours:** 32

**Description:**
Build email sending infrastructure with transactional email functions, delivery/bounce/complaint webhook processing, and comprehensive status tracking.

**Core Requirements:**
- Email send functions for verification, message confirmation, org notifications
- Integration with SendGrid/AWS SES for sending
- Webhook endpoint for delivery events (delivered, bounced, spam_report, opened)
- Email status tracking (queued, sent, delivered, bounced, failed)
- Retry logic for transient failures
- Bounce/complaint handling (suppress future sends)
- Rate limiting for resend requests
- Email template rendering with variables
- Logging and alerting for deliverability issues

**Testing:** Run Test IDs: EMAIL-1, EMAIL-2, EMAIL-3; Send verification email → Email sent, status queued; Webhook delivers "delivered" → Status updated; Bounce event → Status updated, address suppressed; Spam complaint → Address added to suppression list; Transient failure → Retry scheduled; High bounce rate → Alert triggered
**Dependencies:** Email service account (SendGrid/SES), webhook endpoint configuration, suppression list schema
**Definition of Done:** [ ] Send functions implemented [ ] Webhook handler complete [ ] Status tracking working [ ] Retry logic implemented [ ] Suppression list functional [ ] Alerting configured [ ] Tests passing [ ] API docs updated [ ] Code review approved

---

#### EGP-138: [TL] Email Domain & Deliverability Strategy

**Role:** Tech Lead
**Story Points:** 4
**Hours:** 20

**Description:**
Establish email deliverability foundation including domain authentication (DKIM/SPF/DMARC), warm-up plan, bounce/complaint policies, and monitoring strategy.

**Core Requirements:**
- Domain authentication setup (DKIM, SPF, DMARC records)
- Sending domain warm-up plan (volume ramp schedule)
- Bounce handling policy (hard vs soft, retry schedule, suppression rules)
- Complaint/spam report handling (immediate suppression, investigation)
- Deliverability monitoring (bounce rate, spam rate, open rate thresholds)
- Alert triggers for deliverability issues
- Sender reputation monitoring plan
- Email volume limits and throttling rules

**Testing:** DNS records validated → DKIM/SPF/DMARC passing; Warm-up plan → Daily volume increases; Bounce rate exceeds threshold → Alert triggered; Review with email deliverability expert → Approved
**Dependencies:** Domain ownership, email service provider account
**Definition of Done:** [ ] DNS records configured [ ] Warm-up plan documented [ ] Bounce policy defined [ ] Complaint handling specified [ ] Monitoring configured [ ] Alert thresholds set [ ] Volume limits defined [ ] Team review complete [ ] Docs published

---

#### EGP-139: [PM] Email Deliverability QA

**Role:** Project Manager
**Story Points:** 1
**Hours:** 8

**Description:**
Validate email deliverability across providers, test bounce/complaint handling, verify webhook processing, and confirm monitoring/alerting.

**Core Requirements:**
- Inbox placement testing across providers (Gmail, Outlook, Yahoo, iCloud)
- Spam filter testing (SpamAssassin, mail-tester.com scores)
- Bounce/complaint scenario testing
- Webhook delivery verification
- Alert testing for deliverability thresholds
- Content review for all email templates

**Testing:** Send test emails → Check inbox placement (primary vs spam); Send to invalid address → Bounce event received, status updated; Mark as spam → Complaint event received, suppression activated; Trigger high bounce rate → Alert sent; Review all templates → Content approved, links working, unsubscribe present
**Dependencies:** Email infrastructure (EGP-137), domain setup (EGP-138)
**Definition of Done:** [ ] Inbox placement verified [ ] Spam scores acceptable [ ] Bounce handling tested [ ] Complaint handling validated [ ] Webhooks verified [ ] Alerts tested [ ] Templates approved [ ] No P1/P2 defects [ ] Sign-off obtained

---

### DOC-002: Technical Runbooks & Deployment Guides (3 pts, 12 hours)
Operational documentation for deployments, runbooks, and system topology for team reference.

---

#### EGP-140: [TL] System Runbooks & Deployment Guides

**Role:** Tech Lead
**Story Points:** 2
**Hours:** 8

**Description:**
Create comprehensive technical runbooks covering system topology, deployment procedures, rollback processes, environment management, and operational checklists.

**Core Requirements:**
- System topology diagram (architecture, services, data stores, external integrations)
- Deployment guide (process, pre-flight checks, rollout strategy, rollback procedure)
- Environment management (dev, staging, production configs, secrets management)
- Common operational tasks (log access, monitoring dashboards, debugging)
- Incident response runbook (detection, triage, escalation, communication)
- Onboarding checklist for new team members
- Troubleshooting guides for common issues

**Testing:** New engineer follows onboarding checklist → Successfully deploys to dev; Execute deployment guide → Production deploy succeeds; Simulate incident → Runbook provides clear steps; Review with team → Feedback incorporated
**Dependencies:** System architecture, deployment tooling, monitoring setup
**Definition of Done:** [ ] Topology documented [ ] Deployment guide complete [ ] Rollback procedure specified [ ] Environment configs documented [ ] Incident runbook created [ ] Onboarding checklist finalized [ ] Troubleshooting guides written [ ] Team review complete [ ] Docs published and accessible

---

#### EGP-141: [BE] Technical Documentation Review & Contribution

**Role:** Backend
**Story Points:** 1
**Hours:** 4

**Description:**
Review technical runbooks for accuracy, fill in backend-specific details, validate deployment procedures, and contribute API-specific troubleshooting guides.

**Core Requirements:**
- Review system topology for backend accuracy
- Validate deployment steps for backend services
- Document backend-specific environment variables and secrets
- Add API troubleshooting section (common errors, debugging, log queries)
- Review rollback procedure for backend services
- Contribute backend health check and monitoring notes

**Testing:** Follow deployment guide for backend → All steps accurate; Attempt common backend issue → Troubleshooting guide provides solution; Review env var list → All required vars documented; Walkthrough with TL → Approved
**Dependencies:** Runbooks draft from TL (EGP-140)
**Definition of Done:** [ ] Topology reviewed and accurate [ ] Deployment steps validated [ ] Backend env vars documented [ ] API troubleshooting added [ ] Rollback procedure verified [ ] Health checks documented [ ] Review complete [ ] Changes merged to docs

---

*Sprint 6 contains 19 tickets (EGP-123 through EGP-141) totaling 45 story points and 212 hours. The next ticket ID is EGP-142 for Sprint 7.*

---

## Sprint 7: Performance, Testing, Admin Subscriptions & Support Content (Weeks 15-16)

**Sprint Goal:** Optimize performance across key pages, complete cross-browser/mobile testing, deliver admin subscription tools, finalize transactional emails, and publish support content

**Total Story Points:** 40
**Total Hours:** 232

### ADMIN-004: Manage Subscriptions & Payments (13 pts, 64 hours)
Admin tools to search and view subscriber status, payment history, and plan details with secure access controls.

---

#### EGP-142: [UX] Design Subscription Admin Interface

**Role:** UX
**Story Points:** 2
**Hours:** 8

**Description:**
Design admin subscription search and detail views with clear status indicators, payment history, and navigation to user accounts. Emphasize PII protection and read-only access patterns.

**Core Requirements:**
- Search interface (by email, subscription ID, status)
- Subscription detail view (plan, status, billing cycle, payment history)
- User/account navigation links
- Status indicators (active, past_due, canceled, trialing)
- Payment history table with invoice links
- PII-sensitive field handling (masked payment info)

**Testing:** Search by email → Subscription found; View detail → Plan, status, history shown; Click user link → Navigate to user admin; Review PII handling → Payment info masked appropriately
**Dependencies:** Finance data guardrails (EGP-144)
**Definition of Done:** [ ] Search design complete [ ] Detail view designed [ ] Navigation patterns defined [ ] PII handling specified [ ] Stakeholder review approved

---

#### EGP-143: [FE] Build Subscription Admin UI

**Role:** Frontend
**Story Points:** 4
**Hours:** 20

**Description:**
Build admin subscription management interface with search, detail views, and navigation to related user accounts. Implement secure display of payment information.

**Core Requirements:**
- Search by email/subscription ID with autocomplete
- Subscription detail view with tabs (overview, payment history, invoices)
- Status badges with color coding
- Invoice download links
- Navigation to user admin from subscription
- Masked display of sensitive payment info (last 4 digits only)
- Export functionality for subscription lists (if permitted)

**Testing:** Search subscription by email → Results shown; View detail → All tabs load; Download invoice → PDF opens; Navigate to user → User admin page loads; Attempt to view full card number → Masked (last 4 only)
**Dependencies:** Subscription admin API (EGP-145), UX design (EGP-142)
**Definition of Done:** [ ] Search implemented [ ] Detail view complete [ ] Invoice downloads working [ ] Navigation functional [ ] PII masking enforced [ ] Tests passing [ ] Code review approved

---

#### EGP-145: [BE] Subscription Admin Endpoints

**Role:** Backend
**Story Points:** 4
**Hours:** 20

**Description:**
Provide secure admin endpoints for subscription search, detail retrieval, and payment history with PII protection and strict authorization.

**Core Requirements:**
- GET /api/admin/subscriptions - Search by email/ID with pagination
- GET /api/admin/subscriptions/:id - Detail with plan, status, billing info
- GET /api/admin/subscriptions/:id/history - Payment/invoice history
- GET /api/admin/subscriptions/:id/invoices/:invoiceId - Invoice download link
- Admin-only authorization
- PII masking for payment methods (return last 4 digits only)
- Audit logging for subscription access

**Testing:** Admin searches by email → Subscriptions returned; GET detail → Plan and status accurate; GET history → Payment events listed; Non-admin attempts access → 403; Payment method in response → Only last 4 digits visible
**Dependencies:** Stripe/payment provider integration, admin auth middleware
**Definition of Done:** [ ] Search endpoint implemented [ ] Detail endpoint complete [ ] History endpoint working [ ] Invoice links functional [ ] PII masking enforced [ ] Authorization working [ ] Tests passing [ ] API docs updated [ ] Code review approved

---

#### EGP-144: [TL] Finance Data Guardrails

**Role:** Tech Lead
**Story Points:** 2
**Hours:** 8

**Description:**
Define admin access policies for subscription and payment data, PII limits, export rules, and audit requirements for financial information access.

**Core Requirements:**
- Admin role permissions for subscription access (view-only vs. full access)
- PII exposure limits (what can be viewed, what must be masked)
- Export policies (who can export, what data included, retention)
- Audit requirements for financial data access
- Compliance alignment (PCI DSS, GDPR, CCPA)
- Integration with Stripe data protection policies

**Testing:** Policy documented → All scenarios covered; PII limits → Clear masking rules; Review with compliance/legal → Approved
**Dependencies:** Compliance requirements, Stripe policies
**Definition of Done:** [ ] Access policies documented [ ] PII limits defined [ ] Export rules specified [ ] Audit requirements clear [ ] Compliance validated [ ] Team review complete [ ] Docs published

---

#### EGP-146: [PM] QA Subscription Administration

**Role:** Project Manager
**Story Points:** 1
**Hours:** 8

**Description:**
Validate admin subscription management flows including search, detail views, invoice access, and PII protection across admin roles.

**Core Requirements:**
- Test search by email, ID, and status filters
- Verify subscription detail accuracy vs. Stripe data
- Validate invoice download functionality
- Confirm PII masking (payment info, personal details)
- Test navigation to user accounts
- Verify audit logging for access

**Testing:** Search by email → Accurate results; View subscription → Matches Stripe dashboard; Download invoice → PDF correct; Check payment method → Only last 4 shown; Access as different admin roles → Permissions enforced; Audit log → All accesses recorded
**Dependencies:** Subscription admin UI (EGP-143), subscription API (EGP-145)
**Definition of Done:** [ ] Search tested [ ] Detail views validated [ ] Invoice downloads verified [ ] PII masking confirmed [ ] Navigation tested [ ] Audit logging verified [ ] No P1/P2 defects [ ] Sign-off obtained

---

### PERF: Performance Optimization (13 pts, 76 hours)
Platform-wide performance improvements focusing on page load times, API latency, and Core Web Vitals.

---

#### EGP-147: [UX] Performance Design Review

**Role:** UX
**Story Points:** 2
**Hours:** 8

**Description:**
Review current designs for performance optimization opportunities, recommend loading patterns (skeleton screens, progressive enhancement), and approve performance-focused UI changes.

**Core Requirements:**
- Audit existing designs for performance bottlenecks
- Recommend skeleton screen patterns for slow-loading sections
- Approve image optimization strategies (lazy load, responsive images)
- Review animation performance (CSS vs. JS, GPU acceleration)
- Document perceived performance improvements
- Sign off on performance-focused UI changes

**Testing:** Review all key pages → Performance recommendations documented; Skeleton screens designed → Loading states improved; Image strategy → Load time reduced; Review with FE → Approved
**Dependencies:** Performance budget targets (EGP-149)
**Definition of Done:** [ ] Design audit complete [ ] Skeleton screens designed [ ] Image strategy approved [ ] Animation review complete [ ] Performance improvements documented [ ] FE sign-off obtained

---

#### EGP-148: [FE] Frontend Performance Optimization

**Role:** Frontend
**Story Points:** 4
**Hours:** 20

**Description:**
Optimize frontend performance for home, bill detail, and compose pages. Improve FCP, TTI, and LCP to meet Core Web Vitals targets.

**Core Requirements:**
- Code splitting and lazy loading for routes and components
- Image optimization (next/image, lazy loading, responsive images)
- Bundle size reduction (tree shaking, dependency audit)
- Critical CSS extraction and inlining
- Preloading critical resources (fonts, above-fold images)
- Skeleton screens for async content
- Debouncing/throttling for search and filters
- Memoization for expensive computations

**Testing:** Run Test IDs: PERF-1, PERF-2; Home page → FCP <1s, TTI <2s, LCP <2.5s; Bill page → Meets budgets with skeleton states; Bundle size → Reduced by ≥20%; Lighthouse score → ≥90 performance
**Dependencies:** Performance budgets (EGP-149), UX patterns (EGP-147)
**Definition of Done:** [ ] Code splitting implemented [ ] Images optimized [ ] Bundle size reduced [ ] Critical CSS inlined [ ] Skeletons added [ ] Debouncing applied [ ] Metrics meet targets [ ] Tests passing [ ] Code review approved

---

#### EGP-150: [BE] API Performance Optimization

**Role:** Backend
**Story Points:** 4
**Hours:** 20

**Description:**
Reduce API latency and improve P95 response times for key endpoints. Implement caching, optimize queries, and reduce payload sizes.

**Core Requirements:**
- Database query optimization (indexes, N+1 prevention, query analysis)
- Redis caching for expensive operations (feed, bill data, analytics)
- API response payload reduction (field selection, pagination limits)
- Connection pooling optimization
- Async processing for non-critical operations
- Query result set limiting and pagination enforcement
- Monitoring for slow queries and endpoints

**Testing:** Feed endpoint → P95 <500ms; Bill detail → P95 <300ms; Analytics → P95 <1s; Cache hit rate → ≥70% for cached endpoints; Slow query log → No queries >1s; Load test → Maintains performance under 10x normal load
**Dependencies:** Performance budgets (EGP-149), monitoring tools
**Definition of Done:** [ ] Query optimization complete [ ] Caching implemented [ ] Payload sizes reduced [ ] Connection pooling tuned [ ] Async processing added [ ] P95 targets met [ ] Monitoring configured [ ] Tests passing [ ] Code review approved

---

#### EGP-149: [TL] Performance Budget & Architecture Review

**Role:** Tech Lead
**Story Points:** 3
**Hours:** 20

**Description:**
Establish performance budgets for key pages and endpoints, review optimization strategies, and implement performance regression prevention in CI/CD.

**Core Requirements:**
- Performance budgets per page (FCP, TTI, LCP, bundle size)
- API latency targets (P50, P95, P99)
- Performance regression testing in CI (bundle size, Lighthouse)
- Monitoring and alerting for performance degradation
- Architecture review for bottlenecks
- Performance optimization priorities and roadmap
- Load testing strategy and capacity planning

**Testing:** Budgets documented → All pages covered; CI checks → Bundle size enforced, Lighthouse gating; Monitoring → Alerts trigger on regression; Load test → System handles target load; Architecture review → Bottlenecks identified and addressed
**Dependencies:** Current performance baseline, monitoring tools
**Definition of Done:** [ ] Budgets defined and documented [ ] CI checks implemented [ ] Monitoring configured [ ] Alerts set up [ ] Architecture reviewed [ ] Load testing complete [ ] Roadmap published [ ] Team review approved

---

#### EGP-151: [PM] Performance Validation & Reporting

**Role:** Project Manager
**Story Points:** 1
**Hours:** 8

**Description:**
Coordinate performance testing, validate improvements against baselines, track metrics, and report progress to stakeholders.

**Core Requirements:**
- Before/after performance metrics collection
- Test device matrix (desktop, mobile, slow 3G, fast 4G)
- Real user monitoring (RUM) analysis
- Lighthouse score tracking
- Core Web Vitals validation
- Performance improvements documentation
- Stakeholder reporting

**Testing:** Baseline metrics captured → Before/after comparison; Test on slow connection → Still meets budgets; RUM data → Real user improvements validated; Lighthouse → All pages ≥90; Core Web Vitals → All green; Report → Stakeholders informed
**Dependencies:** Performance improvements (EGP-148, EGP-150)
**Definition of Done:** [ ] Baseline captured [ ] Device matrix tested [ ] RUM analyzed [ ] Lighthouse validated [ ] CWV confirmed green [ ] Improvements documented [ ] Report delivered [ ] Sign-off obtained

---

### TEST: Cross-Browser & Mobile Testing (8 pts, 40 hours)
Comprehensive cross-browser and mobile device testing with bug triage and resolution.

---

#### EGP-152: [UX] Cross-Browser Design Validation

**Role:** UX
**Story Points:** 2
**Hours:** 8

**Description:**
Validate designs render correctly across target browsers and devices, document browser-specific design adaptations, and approve visual fixes.

**Core Requirements:**
- Visual QA across browser matrix (Chrome, Firefox, Safari, Edge)
- Mobile device validation (iOS Safari, Chrome Mobile, Samsung Internet)
- Responsive design breakpoint verification
- Touch target size validation (minimum 44x44px)
- Form input compatibility review
- Approval of browser-specific visual fixes

**Testing:** Run Test IDs: TEST-1; View on each browser → Design intact; Check mobile → Touch targets adequate; Test forms → Input types work; Responsive → All breakpoints render correctly; Visual regressions → None found or approved
**Dependencies:** Test matrix definition (EGP-154)
**Definition of Done:** [ ] Browser matrix tested [ ] Mobile devices validated [ ] Breakpoints verified [ ] Touch targets confirmed [ ] Visual regressions triaged [ ] Fixes approved [ ] Sign-off obtained

---

#### EGP-153: [FE] Cross-Browser Bug Fixes

**Role:** Frontend
**Story Points:** 3
**Hours:** 12

**Description:**
Identify and fix layout, functionality, and compatibility issues across target browser and device matrix. Ensure consistent experience.

**Core Requirements:**
- Browser-specific CSS fixes (vendor prefixes, polyfills)
- Mobile viewport and touch interaction fixes
- Form input compatibility (date pickers, file uploads)
- JavaScript feature detection and polyfills
- Responsive layout fixes across breakpoints
- Accessibility fixes for screen readers and keyboard navigation
- Visual regression fixes

**Testing:** Run Test IDs: TEST-1; Test all critical flows on each browser → No blocking issues; Mobile gestures → Work correctly; Forms → Submit successfully; Screen reader → Content accessible; Keyboard nav → All actions reachable
**Dependencies:** Bug list from PM (EGP-154), UX validation (EGP-152)
**Definition of Done:** [ ] Browser fixes implemented [ ] Mobile issues resolved [ ] Forms working cross-browser [ ] Polyfills added [ ] Responsive fixes complete [ ] A11y issues fixed [ ] Visual regressions resolved [ ] Tests passing [ ] Code review approved

---

#### EGP-154: [PM] Cross-Browser Test Execution & Triage

**Role:** Project Manager
**Story Points:** 3
**Hours:** 20

**Description:**
Define browser/device matrix, execute comprehensive test suite, track defects, and drive resolution to completion.

**Core Requirements:**
- Browser/device matrix definition (versions, OS, screen sizes)
- Test plan covering all critical user flows
- Defect tracking with severity/priority classification
- Daily bug triage and assignment
- Regression test suite
- Sign-off checklist
- Testing on real devices (not just emulators)

**Testing:** Execute matrix → All browsers/devices tested; Critical flows → All pass or have workarounds; Defects → P1/P2 resolved, P3+ triaged; Regression → No new issues; Real devices → Validated; Checklist → Complete and signed off
**Dependencies:** Critical user flows list, test devices/accounts
**Definition of Done:** [ ] Matrix defined and documented [ ] Test plan executed [ ] All P1/P2 defects resolved [ ] P3+ defects triaged [ ] Regression suite passing [ ] Real device testing complete [ ] Checklist approved [ ] Sign-off obtained

---

### EMAIL-002: Advocacy Message Confirmations (3 pts, 16 hours)
Confirmation emails for advocacy messages with delivery tracking.

---

#### EGP-155: [UX+BE] Message Confirmation Email

**Role:** UX + Backend
**Story Points:** 2
**Hours:** 12 (UX 4 + BE 8)

**Description:**
Design and implement advocacy message confirmation emails with message details, confirmation number, and delivery status. Ensure one-time send and proper templating.

**Core Requirements:**
- Email template design (subject, body, footer with unsubscribe)
- Message details included (recipients, subject, sent date)
- Unique confirmation number displayed prominently
- Next steps and support links
- Backend send function triggered on message submission
- Idempotent send (no duplicates for same message)
- Template variable rendering

**Testing:** Run Test IDs: EMAIL-2; Send message → Confirmation email received; Check inbox → Email contains confirmation number; Details → Accurate recipients and subject; Resend message trigger → No duplicate email; Template → Variables render correctly
**Dependencies:** Email infrastructure (EGP-137), email templates
**Definition of Done:** [ ] Template designed [ ] Send function implemented [ ] Idempotency enforced [ ] Variables rendering [ ] Tests passing [ ] Code review approved

---

#### EGP-156: [PM] QA Message Confirmation Emails

**Role:** Project Manager
**Story Points:** 1
**Hours:** 4

**Description:**
Validate message confirmation email delivery, content accuracy, and tracking across email providers.

**Core Requirements:**
- Test email delivery across providers (Gmail, Outlook, Yahoo)
- Verify confirmation number matches message record
- Validate message details accuracy
- Check email formatting (desktop, mobile)
- Confirm unsubscribe link works
- Test duplicate send prevention

**Testing:** Send message → Email arrives; Confirmation number → Matches database; Message details → Accurate; View on mobile → Formatted correctly; Click unsubscribe → Preferences updated; Trigger duplicate → Only one email sent
**Dependencies:** Confirmation email implementation (EGP-155)
**Definition of Done:** [ ] Delivery verified [ ] Content validated [ ] Formatting tested [ ] Unsubscribe working [ ] Duplicate prevention confirmed [ ] No P1/P2 defects [ ] Sign-off obtained

---

### DOC-003: Support Content & QA Checklists (3 pts, 12 hours)
Help center articles and QA regression suites for ongoing quality assurance.

---

#### EGP-157: [PM] Support Documentation & QA Suites

**Role:** Project Manager
**Story Points:** 3
**Hours:** 12

**Description:**
Create help center articles for core user flows and compile comprehensive QA regression checklists for ongoing testing.

**Core Requirements:**
- Help articles (account creation, sending messages, premium membership, campaign creation, troubleshooting)
- FAQ compilation from common support questions
- Video tutorials for complex flows (optional)
- QA regression checklists per sprint/feature area
- Smoke test checklist for releases
- Known issues and workarounds documentation
- Article SEO optimization for discoverability

**Testing:** New user follows help article → Successfully completes flow; Search FAQ → Finds answer; Run regression checklist → Covers all critical paths; Smoke test → Catches deployment issues; Known issues doc → Support team references successfully
**Dependencies:** All feature implementations, support team feedback
**Definition of Done:** [ ] Core help articles written [ ] FAQ compiled [ ] QA checklists created [ ] Smoke test suite defined [ ] Known issues documented [ ] SEO optimized [ ] Team review approved [ ] Published and accessible

---

*Sprint 7 contains 16 tickets (EGP-142 through EGP-157) totaling 40 story points and 232 hours. The next ticket ID is EGP-158 for Sprint 8.*

---

## Sprint 8: Security, Bug Bash & Launch Preparation (Weeks 17-18)

**Sprint Goal:** Complete security hardening, resolve final bugs and polish issues, and prepare for production launch with comprehensive readiness validation

**Total Story Points:** 29
**Total Hours:** 156

### SEC: Security Review & Hardening (8 pts, 40 hours)
Comprehensive security assessment and remediation before launch.

---

#### EGP-158: [TL] Security Assessment & Remediation Plan

**Role:** Tech Lead
**Story Points:** 4
**Hours:** 20

**Description:**
Conduct comprehensive security review covering threat modeling, permissions audit, rate limiting, abuse scenarios, and dependency vulnerabilities. Drive remediation of all high/critical findings.

**Core Requirements:**
- Threat model review (authentication, authorization, data flow)
- Secrets and permissions audit (API keys, service accounts, IAM roles)
- Rate limiting and abuse scenario testing (DDoS, credential stuffing, spam)
- Dependency vulnerability scan and remediation
- Security configuration review (CORS, CSP, HTTPS enforcement)
- Penetration testing or security audit engagement
- Remediation tracking with owners and due dates
- Sign-off criteria for launch readiness

**Testing:** Threat model → All attack vectors identified; Permissions audit → Least privilege enforced; Rate limits → Abuse scenarios blocked; Dependencies → No high/critical CVEs; Config review → Security headers present; Pentest findings → All high/critical remediated; Sign-off → Security approved for launch
**Dependencies:** All feature implementations complete, security tools/scanners
**Definition of Done:** [ ] Threat model reviewed [ ] Permissions audited [ ] Rate limits tested [ ] Dependencies scanned [ ] Config hardened [ ] Pentest complete [ ] High/critical issues fixed [ ] Remediation plan documented [ ] Sign-off obtained

---

#### EGP-159: [BE] Security Hardening Implementation

**Role:** Backend
**Story Points:** 3
**Hours:** 12

**Description:**
Implement prioritized security fixes including auth/session hardening, logging improvements, and least-privilege service configurations.

**Core Requirements:**
- Authentication/session security fixes (token rotation, session timeout)
- Input validation and sanitization hardening
- SQL injection and NoSQL injection prevention
- Logging enhancement (security events, anomaly detection)
- Service account least-privilege enforcement
- API rate limiting tuning
- Security headers configuration (CSP, HSTS, X-Frame-Options)
- Secrets rotation and secure storage validation

**Testing:** Auth fixes → Session hijacking prevented; Input validation → Injection attacks blocked; Logging → Security events captured; Service accounts → Least privilege verified; Rate limits → Abuse blocked; Headers → Security scanner passes; Secrets → Properly rotated and stored
**Dependencies:** Security assessment findings (EGP-158)
**Definition of Done:** [ ] Auth/session hardened [ ] Input validation complete [ ] Injection prevention verified [ ] Logging enhanced [ ] Least privilege enforced [ ] Rate limits tuned [ ] Security headers set [ ] Secrets secured [ ] Tests passing [ ] Code review approved

---

#### EGP-160: [PM] Security Validation & Risk Communication

**Role:** Project Manager
**Story Points:** 1
**Hours:** 8

**Description:**
Track security findings, coordinate remediation, validate fixes, and communicate risk status to stakeholders for launch approval.

**Core Requirements:**
- Security findings tracker (issue, severity, owner, status, due date)
- Daily security standup during remediation period
- Fix validation and verification
- Risk assessment for unresolved issues
- Stakeholder communication (exec summary, launch readiness)
- Security incident response plan review
- Launch go/no-go criteria validation

**Testing:** Tracker current → All issues tracked; Standups → Daily progress; Fixes validated → Verified working; Risk assessment → Unresolved issues documented; Stakeholders informed → Launch decision made; Incident plan → Team briefed
**Dependencies:** Security assessment (EGP-158), hardening work (EGP-159)
**Definition of Done:** [ ] Tracker maintained [ ] Standups executed [ ] Fixes validated [ ] Risk assessment complete [ ] Stakeholders informed [ ] Incident plan reviewed [ ] Go/no-go criteria met [ ] Sign-off obtained

---

### BUGS: Bug Fixes & Polish (13 pts, 76 hours)
Final bug bash and UI/UX polish before launch.

---

#### EGP-161: [UX] Visual Polish & Consistency Review

**Role:** UX
**Story Points:** 2
**Hours:** 8

**Description:**
Conduct final visual QA across all pages, ensure design consistency, approve polish changes, and validate brand alignment.

**Core Requirements:**
- Visual consistency audit (typography, colors, spacing, icons)
- Micro-interaction review (hover states, transitions, loading indicators)
- Brand alignment validation (logo usage, tone, imagery)
- Accessibility spot checks (contrast, focus indicators, alt text)
- Mobile polish review (touch targets, responsive behavior)
- Empty state and error message review
- Approval of visual bug fixes

**Testing:** Visual audit → Inconsistencies identified; Brand review → Aligned with guidelines; Accessibility → No critical issues; Mobile → Touch-friendly; Empty states → Clear guidance; Error messages → Helpful and on-brand; Fixes → Approved
**Dependencies:** All features complete
**Definition of Done:** [ ] Visual audit complete [ ] Consistency issues documented [ ] Brand alignment verified [ ] Accessibility validated [ ] Mobile polish approved [ ] Empty states reviewed [ ] Error messages approved [ ] Sign-off obtained

---

#### EGP-162: [FE] UI/UX Bug Fixes & Polish

**Role:** Frontend
**Story Points:** 4
**Hours:** 20

**Description:**
Resolve high-priority usability and visual issues, implement polish improvements, and address accessibility findings.

**Core Requirements:**
- P1/P2 bug resolution from bug bash
- Visual consistency fixes (spacing, alignment, colors)
- Micro-interaction improvements (smooth animations, feedback)
- Accessibility fixes (keyboard nav, screen reader, ARIA labels)
- Mobile responsiveness fixes
- Loading state improvements
- Error message clarity enhancements
- Small UX refinements (tooltips, hints, empty states)

**Testing:** Bug bash list → P1/P2 resolved; Visual issues → Fixed and consistent; Animations → Smooth and purposeful; Keyboard nav → All actions reachable; Screen reader → Content accessible; Mobile → Responsive and touch-friendly; Loading states → Clear progress; Error messages → Helpful
**Dependencies:** Bug bash results, UX review (EGP-161)
**Definition of Done:** [ ] P1/P2 bugs resolved [ ] Visual fixes complete [ ] Animations polished [ ] A11y fixes implemented [ ] Mobile responsive [ ] Loading states improved [ ] Error messages enhanced [ ] Tests passing [ ] Code review approved

---

#### EGP-163: [BE] Backend Bug Fixes & Stability

**Role:** Backend
**Story Points:** 4
**Hours:** 20

**Description:**
Resolve backend bugs, improve error handling and resilience, and tune retry logic for production stability.

**Core Requirements:**
- P1/P2 backend bug resolution
- Error handling improvements (clear messages, proper status codes)
- Retry logic tuning (transient failures, exponential backoff)
- Logging improvements (structured logs, correlation IDs)
- Database connection resilience
- Third-party API error handling (timeouts, fallbacks)
- Edge case handling (null checks, boundary conditions)
- Performance fixes from monitoring

**Testing:** Bug list → P1/P2 resolved; Error handling → Clear messages returned; Retries → Transient failures handled; Logging → Structured and queryable; DB connections → Resilient to failures; API errors → Graceful fallbacks; Edge cases → No crashes; Performance → Meets targets
**Dependencies:** Bug bash results, performance monitoring
**Definition of Done:** [ ] P1/P2 bugs fixed [ ] Error handling improved [ ] Retry logic tuned [ ] Logging enhanced [ ] DB resilience verified [ ] API handling robust [ ] Edge cases covered [ ] Performance validated [ ] Tests passing [ ] Code review approved

---

#### EGP-164: [TL] Bug Triage & Code Review Focus

**Role:** Tech Lead
**Story Points:** 2
**Hours:** 8

**Description:**
Drive fast bug triage cycles, maintain rapid code review turnaround, and ensure steady progress toward launch-ready state.

**Core Requirements:**
- Daily bug triage (severity/priority assignment)
- Fast-track code review SLAs (critical fixes <4 hours, others <24 hours)
- Merge health tracking (no large stale PRs)
- Technical debt triage (fix now vs. defer)
- Regression risk assessment for fixes
- Integration testing coordination
- Release branch management
- Hotfix process preparation

**Testing:** Triage → Daily sessions completed; Review SLAs → Met consistently; Stale PRs → None >48 hours; Tech debt → Triaged with plan; Regression risk → Assessed for all fixes; Integration tests → Passing; Release branch → Stable; Hotfix process → Documented
**Dependencies:** Bug bash completion, team availability
**Definition of Done:** [ ] Daily triage complete [ ] Review SLAs met [ ] No stale PRs [ ] Tech debt triaged [ ] Regression assessed [ ] Integration tests passing [ ] Release branch ready [ ] Hotfix process documented

---

#### EGP-165: [PM] Bug Bash Coordination & Closure

**Role:** Project Manager
**Story Points:** 3
**Hours:** 20

**Description:**
Run comprehensive bug bash, track all findings, drive resolution, and manage scope for launch readiness.

**Core Requirements:**
- Bug bash planning and execution (all hands, 2-day event)
- Defect tracking in JIRA (description, repro steps, severity, owner)
- Daily standup during bug bash and fix period
- Scope management (fix now vs. defer to post-launch)
- Regression testing coordination
- Launch blocker identification and escalation
- Before/after validation for all fixes
- Bug bash report and lessons learned

**Testing:** Bug bash executed → All team members participate; Defects tracked → Complete information; Standups → Daily progress updates; Scope managed → Launch blockers prioritized; Regression → No new issues; Blockers → Resolved or escalated; Validation → All fixes verified; Report → Delivered to stakeholders
**Dependencies:** Feature complete, test accounts/data
**Definition of Done:** [ ] Bug bash executed [ ] All defects tracked [ ] Standups completed [ ] Scope managed [ ] Regression tested [ ] Launch blockers resolved [ ] Fixes validated [ ] Report delivered [ ] Sign-off obtained

---

### LAUNCH: Launch Preparation (8 pts, 40 hours)
Final launch readiness activities including deployment, monitoring, and go-live planning.

---

#### EGP-166: [TL] Launch Checklist & Go/No-Go

**Role:** Tech Lead
**Story Points:** 4
**Hours:** 20

**Description:**
Prepare comprehensive launch checklist, establish monitoring and on-call, validate rollback plan, and lead go/no-go decision.

**Core Requirements:**
- Pre-launch checklist (infra, security, performance, functionality)
- Production monitoring setup (dashboards, alerts, runbooks)
- On-call schedule and escalation path
- Rollback plan (triggers, procedure, validation)
- Incident response plan (detection, communication, resolution)
- Load testing and capacity validation
- DNS/domain configuration
- Feature flag configuration for gradual rollout
- Go/no-go criteria and decision meeting

**Testing:** Checklist → All items covered; Monitoring → Dashboards live, alerts configured; On-call → Schedule set, team trained; Rollback → Tested in staging; Incident plan → Team briefed; Load test → System handles 3x expected load; DNS → Configured correctly; Feature flags → Ready for rollout; Go/no-go → Decision documented
**Dependencies:** All features complete, infrastructure ready
**Definition of Done:** [ ] Checklist complete [ ] Monitoring configured [ ] On-call scheduled [ ] Rollback validated [ ] Incident plan ready [ ] Load testing passed [ ] DNS configured [ ] Feature flags set [ ] Go/no-go completed [ ] Launch approved

---

#### EGP-167: [BE] Production Deployment & Smoke Tests

**Role:** Backend
**Story Points:** 2
**Hours:** 8

**Description:**
Execute production deployment, run smoke tests, validate all critical paths, and confirm system health.

**Core Requirements:**
- Final production build (verified hashes, no dev dependencies)
- Database migration execution and validation
- Environment variable verification
- Service deployment with health checks
- Smoke test execution (critical paths)
- Third-party integration validation (Stripe, email, L2 Political)
- Performance validation (latency, throughput)
- Log verification (no critical errors)
- Backup verification

**Testing:** Build → Production-ready verified; DB migration → Applied successfully; Env vars → All present and correct; Services → Healthy and responding; Smoke tests → All pass; Integrations → Working in prod; Performance → Meets targets; Logs → Clean, no errors; Backups → Recent and valid
**Dependencies:** Launch approval (EGP-166), production access
**Definition of Done:** [ ] Build deployed [ ] Migrations run [ ] Env vars verified [ ] Services healthy [ ] Smoke tests passed [ ] Integrations validated [ ] Performance confirmed [ ] Logs clean [ ] Backups verified [ ] Production live

---

#### EGP-168: [PM] Launch Communications & Support Readiness

**Role:** Project Manager
**Story Points:** 2
**Hours:** 12

**Description:**
Coordinate launch communications, ensure support coverage, validate help content, and manage stakeholder expectations.

**Core Requirements:**
- Internal launch announcement (team, stakeholders, executives)
- External launch communications (social, email, press if applicable)
- Support team briefing (common issues, escalation, help docs)
- Support coverage schedule (24/7 for first week)
- Help content final review (articles, FAQs, videos)
- Feedback collection plan (surveys, analytics, support tickets)
- Post-launch monitoring cadence (daily standups first week)
- Celebration planning (team recognition)

**Testing:** Internal comms → Sent and acknowledged; External comms → Scheduled/published; Support briefed → Team ready; Coverage → 24/7 confirmed first week; Help content → Reviewed and live; Feedback plan → Ready to execute; Monitoring cadence → Standups scheduled; Celebration → Team recognized
**Dependencies:** Launch execution (EGP-167), help content (EGP-157)
**Definition of Done:** [ ] Internal comms sent [ ] External comms published [ ] Support briefed [ ] Coverage confirmed [ ] Help content live [ ] Feedback plan ready [ ] Monitoring cadence set [ ] Team celebrated [ ] Launch complete

---

*Sprint 8 contains 11 tickets (EGP-158 through EGP-168) totaling 29 story points and 156 hours.*

---

## Project Summary

**Total Sprints:** 9 (Sprint 0 through Sprint 8)
**Total Tickets:** 168 (EGP-001 through EGP-168)
**Total Story Points:** 367
**Total Hours:** 1,808

### Sprint Breakdown:
- **Sprint 0** (Foundation): 18 tickets, 40 pts, 184 hours
- **Sprint 1** (Discovery): 20 tickets, 42 pts, 200 hours
- **Sprint 2** (Messaging & News): 18 tickets, 37 pts, 224 hours
- **Sprint 3** (Verification & Premium): 22 tickets, 41 pts, 188 hours
- **Sprint 4** (Org Campaigns): 19 tickets, 52 pts, 212 hours
- **Sprint 5** (Premium & Flows): 25 tickets, 41 pts, 200 hours
- **Sprint 6** (Admin & Email): 19 tickets, 45 pts, 212 hours
- **Sprint 7** (Performance & Testing): 16 tickets, 40 pts, 232 hours
- **Sprint 8** (Security & Launch): 11 tickets, 29 pts, 156 hours

### Role Distribution:
- **UX Design:** 244 hours (13.5%)
- **Frontend:** 488 hours (27.0%)
- **Backend:** 548 hours (30.3%)
- **Tech Lead:** 252 hours (13.9%)
- **Project Manager:** 276 hours (15.3%)

### Key Metrics:
- Average sprint: 40.8 story points, 200.9 hours
- Average week: 20.4 story points, 100.4 hours
- Peak sprint: Sprint 6-7 (45 pts)
- FTE equivalent: 2.51 (based on 40hr/week)

All JIRA tickets are now complete and ready for team assignment and sprint execution.

