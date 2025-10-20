# All Sprints Task Breakdown

Two-week sprints; tasks are written in plain language for FE, TL, BE, and PM with goals, scope, acceptance criteria, validation, and hours per role.

---

## Global Testing Conventions

- How to use
  - In every story, the “Validation” line must list explicit Test IDs from the catalog below (e.g., “Run Test IDs: AUTH‑1, AUTH‑2, AUTH‑3”). No generic phrases are allowed.

- Test Case Format (applies to all stories)
  - ID: short code (e.g., AUTH-1)
  - Preconditions: required state or data
  - Steps: numbered steps the tester performs
  - Expected: exact user-visible copy, focus behavior, state changes, and any events/logging

- Copy and Focus Rules
  - Provide literal user-facing messages for each error/success case.
  - Specify focus behavior after errors (field focus, banner, or toast) and what input persists.

- Global Test Catalog (reference these IDs in Validation bullets)
  - AUTH
    - AUTH-1 Successful Signup: New email → sign up → verification → redirected to dashboard with “Your account is ready” banner.
    - AUTH-2 Duplicate Email: Sign up with existing email → banner “An account already exists for this email. Sign in or reset your password.” with links → fields preserved.
    - AUTH-3 Provider Canceled: Cancel external auth → toast “Sign up canceled. No changes made.” → remain on current page.
    - AUTH-4 Login Invalid: Wrong password → inline “Incorrect email or password.” → focus on password field.
    - AUTH-5 Login Success With Return: Log in with returnTo → redirected to target route; session active.
    - AUTH-6 Password Reset Request: Submit email → neutral confirmation “If an account exists, we sent a reset email.” → rate limit not exceeded.
    - AUTH-7 Rate Limited Login: ≥5 attempts/15 min → banner “Too many attempts. Try again in 15 minutes.” → submit disabled 60s with countdown.
    - AUTH-8 Network Timeout: Simulate >10s → inline “Connection timed out. Try again.” with enabled Retry.
  - PROFILE
    - PROFILE-1 Save Profile: Valid fields → “Profile saved” banner → data persists after reload.
    - PROFILE-2 Invalid ZIP: Enter invalid ZIP → inline “Enter a valid 5‑digit ZIP.” → no district shown.
    - PROFILE-3 District Lookup: Change to valid ZIP → congressional and state districts displayed.
    - PROFILE-4 Cache Reuse: Repeat lookup on same ZIP within TTL → served from cache (faster, no provider hit).
  - BILL
    - BILL-1 Render Detail: Valid bill ID → sections render: header, latest action, sponsor, subjects, summaries, actions, text links.
    - BILL-2 Upstream Outage Fallback: Simulated outage with cached copy → page renders with “Data shown from cache” indicator.
    - BILL-3 Watch Requires Sign‑In: Guest clicks Watch → redirected to login with return path retained.
    - BILL-4 Error UI: Unknown bill ID → 404 component with “Bill not found”.
  - FEED
    - FEED-1 Tabs Switch: Tabs switch without full reload; correct content per tab.
    - FEED-2 Pagination: Next page loads additional items; no duplicates.
    - FEED-3 Session Persistence: Selected tab persists across reloads in same session.
    - FEED-4 Personalization: Signed‑in feed ranks followed items above baseline; anonymous shows popular.
  - ORG
    - ORG-1 List Orgs: List renders; sort/pagination works; empty state clear.
    - ORG-2 Org Profile: Valid slug shows details and active campaigns; 404 for unknown slug.
    - ORG-3 Team Management: Admin invites, removes, changes role; immediate reflection in list.
  - MSG
    - MSG-1 Anonymous Send: Compose with sender info → confirmation number displayed; status queued.
    - MSG-2 Signed‑In Send: Prefilled sender info → confirmation number; status queued.
    - MSG-3 Validation Errors: Required fields missing → inline messages; inputs preserved.
    - MSG-4 Rate Limit: >N sends/hour → “Too many messages. Try again later.”
  - CAMP (Campaigns)
    - CAMP-1 Create Draft: Save draft with required fields → draft ID returned.
    - CAMP-2 Publish: Publish valid draft → status Published; appears publicly.
    - CAMP-3 Pause/Resume: Toggle pause → public visibility changes accordingly.
    - CAMP-4 Audit Trail: Edits recorded with who/when/what.
  - ADMIN
    - ADMIN-1 Suspend Campaign: Suspend with reason → status changes; org sees reason.
    - ADMIN-2 Suspend/Reactivate Org: Status changes visible in admin/partner views.
    - ADMIN-3 User Role Change: Change role → reflected on next refresh; protected actions enforced.
  - EMAIL
    - EMAIL-1 Account Verification: Signup triggers verification email; status flips to verified on completion.
    - EMAIL-2 Message Confirmation: Message send triggers confirmation email with ID.
    - EMAIL-3 Webhook Events: Delivery/bounce/complaint updates reflected in message status.
  - PERF/TEST
    - PERF-1 Home Page Budget: Home meets FCP/TTI budget on target device matrix.
    - PERF-2 Bill Page Budget: Bill detail meets budget with skeletons.
    - TEST-1 Cross‑Browser Matrix: All target browsers/devices pass critical flows.

Note: For any story’s Validation section, replace generic “Demo flows …” with “Run Test IDs: <list>” and ensure literal copy, focus handling, and state changes are verified.

---

## Sprint 0: Foundation & Authentication

### US-017: Create Account (Post-Message Flow)
Hours: FE 12 | BE 8 | TL 4 | PM 4

- FE — Signup, verification, and post-message linking
  - Goal: Deliver a simple, trustworthy account creation experience that connects a user’s first anonymous action to their new account.
  - Scope:
    - Signup screens with email/password and at least one social option
    - Clear verification-pending and success states
    - Post-signup redirect to the intended page or dashboard
    - Link any “pending message” to the new account when present
    - Friendly, accessible error messaging for common failures
  - Acceptance criteria:
    - User can sign up, verify, and see a confirmation on first arrival
    - If a pending message exists, it is visible in message history after signup
    - Error states do not block recovery and are clearly explained
  - Validation:
    - Demo flows: happy path, duplicate email, canceled signup, and pending-message linking
    - Accessibility spot-check: labels, focus order, keyboard-only path

  - Deliverables:
    - Screens: Signup, Verification Pending, Signup Success, Error state
    - States copy deck: error and success strings; verification guidance
    - Event log: account_created, verification_started, verification_completed
    - Pending-message link trigger: single call fired post‑signup when session token exists
  - Inputs/Outputs:
    - Inputs: email, password, optional social provider; optional session token for pending message
    - Outputs: on success a signed‑in session and confirmation banner; if token present, a one‑time request to link the pending message
  - Constraints & Non‑Goals:
    - Do not send marketing emails or collect notification preferences here
    - Do not require MFA for non‑admin users in this flow
    - Do not auto‑redirect users away from the dashboard after first arrival
  - Acceptance tests (numbered):
    1) New email → signup → verification → dashboard banner shown
    2) Duplicate email → inline error shown, form remains editable
    3) Cancel during provider step → user returned with neutral message, no session
    4) Pending token present → after signup, message history shows the linked item and token is cleared

- TL — Identity configuration and security posture
  - Goal: Establish identity settings and safe defaults for sessions.
  - Scope:
    - Configure connections, MFA for admins, token/session lifetimes
    - Define redirect and session timeout rules
  - Acceptance criteria:
    - Settings captured in a short configuration summary and reviewed with team
  - Validation:
    - Walkthrough of sign-in/sign-up behavior against the summary

- BE — Link pending messages to the newly created account
  - Goal: Provide a secure way to attach any previously created anonymous message(s) to the authenticated user.
  - Scope:
    - Authenticated endpoint that accepts a session token for a pending message
    - Idempotent linking to prevent duplicates
    - Basic auditing of link events
  - Acceptance criteria:
    - Returns the count of messages linked for a valid token
    - Rejects unauthenticated or malformed requests
    - Repeated calls with the same token do not create duplicates
  - Validation:
    - Unit checks for valid/invalid/duplicate tokens
    - End‑to‑end check that a pending message appears under the new account
  - Deliverables:
    - Authenticated endpoint (name TBD) accepting: { sessionToken:string }
    - Response contract: { messagesLinked:number, linkedAt:timestamp[] }
    - Audit record per link with userId, messageId, linkedAt
  - Inputs/Outputs:
    - Input: session token referencing a single pending message (or batch)
    - Output: link count; no partial success without clear message
  - Constraints & Non‑Goals:
    - Do not create duplicate links; idempotent by token
    - Do not accept tokens older than the agreed TTL
    - Do not expose whether a token exists to unauthenticated callers
  - Acceptance tests (numbered):
    1) Valid token → 1 linked; repeated call → 0 linked
    2) Invalid token → error with no link
    3) Expired token → error with no link

- PM — Flow QA and support note
  - Goal: Validate end-to-end flows and prepare a short help article.
  - Scope:
    - Execute a QA script (desktop + mobile); document common errors and recovery
  - Acceptance criteria:
    - QA passes with no blockers; support note approved
  - Validation:
    - Checklist completed; demo recording attached

### US-018: Login & Password Reset
Hours: FE 8 | BE 4 | TL 4 | PM 4

- FE — Sign‑in and reset experience
  - Goal: Enable returning users to access their account reliably and recover access when they forget a password.
  - Scope:
    - Login form with “remember me” behavior
    - Support returning to the page the user originally intended to visit
    - Password reset request flow with neutral confirmation messaging
    - Helpful errors for wrong credentials and timeouts
  - Acceptance criteria:
    - Successful login returns the user to the requested page (when provided)
    - Password reset request shows a confirmation without disclosing account existence
  - Validation:
    - Demo flows: wrong password, successful login, remember‑me persistence, reset request
    - Automated e2e: unauthenticated → login → redirected back
  - Deliverables:
    - Screens: Login, Forgot Password Request, Login Error state
    - “Remember me” control and session persistence behavior
    - Support for `return to previous page` parameter
  - Inputs/Outputs:
    - Inputs: email, password, remember‑me toggle
    - Outputs: signed‑in session; neutral confirmation after reset request
  - Constraints & Non‑Goals:
    - Do not reveal if an email exists during reset
    - Do not build advanced device trust or 2FA prompts in this sprint
  - Acceptance tests (numbered):
    1) Wrong password → inline error, no session created
    2) Correct login with returnTo → user lands on intended page
    3) Remember‑me on → session persists across browser restart for the agreed window
    4) Reset request → neutral confirmation message regardless of account existence

- TL — Session and redirect rules
  - Goal: Define expected behavior for remembered sessions and redirect patterns.
  - Scope:
    - Document remember‑me duration, inactivity timeout, and return‑to contract
  - Acceptance criteria:
    - Rules agreed and reflected in FE/BE behavior
  - Validation:
    - Spot-check flows against rules

- BE — Validate sessions and send reset emails
  - Goal: Protect endpoints with session checks and allow users to trigger password resets safely.
  - Scope:
    - Server‑side session/token validation for protected routes
    - Reset request endpoint that always responds generically and rate‑limits repeated requests
  - Acceptance criteria:
    - Protected routes reject missing/invalid sessions
    - Reset emails can be requested; abusive patterns are rate‑limited
  - Validation:
    - Unit checks for valid/invalid tokens and rate‑limit behavior
    - Integration check for protected route behavior with/without a valid session
  - Deliverables:
    - Session validation middleware usable by protected routes
    - Password reset request endpoint with neutral responses and basic rate limits
    - Log entries for reset requests (email hashed) and rate‑limit hits
  - Inputs/Outputs:
    - Input: Authorization header for protected routes; email for reset
    - Output: 401 for invalid/missing session; 200 with neutral message for reset
  - Constraints & Non‑Goals:
    - Do not include user existence info in any reset response
    - Do not store plain emails in logs
  - Acceptance tests (numbered):
    1) Protected route without session → 401
    2) Protected route with valid session → 200
    3) 4+ reset requests from same client within window → rate‑limited

- PM — Release notes and QA
  - Goal: Capture user-facing changes and validate flows.
  - Scope:
    - Draft release notes; execute login/reset test passes
  - Acceptance criteria:
    - Notes approved; QA passes with no P1s
  - Validation:
    - Checklist and sign-off

### US-019: Update Profile & Set Location
Hours: FE 8 | BE 8 | TL 4 | PM 4

- FE — Profile editing and location display
  - Goal: Allow users to enter profile details and see location‑based information that reflects their address or ZIP.
  - Scope:
    - Editable profile fields with validation and clear save feedback
    - When a valid ZIP/address is entered, show congressional and state districts
    - Keep the most recent location available so related pages can tailor content
  - Acceptance criteria:
    - Saved data persists and reappears on reload
    - District info appears after a valid ZIP/address; invalid inputs prompt the user to correct them
  - Validation:
    - Demo: save profile; change ZIP; see districts update
    - Automated: happy‑path e2e covering edit → save → reload
  - Deliverables:
    - Profile form with required fields and inline validation
    - Location widgets: district labels/map highlight; save confirmation banner
  - Inputs/Outputs:
    - Inputs: name, address, city, state, ZIP, demographic preferences
    - Outputs: persisted profile; derived districts visible in UI
  - Constraints & Non‑Goals:
    - Do not store raw IP addresses; use ZIP/address only
    - Do not trigger any outbound emails from profile edits
  - Acceptance tests (numbered):
    1) Save valid profile → confirmation + values persist after reload
    2) Change ZIP to valid → districts appear
    3) Enter invalid ZIP → user sees actionable validation, no districts shown

- TL — Location and privacy guardrails
  - Goal: Set expectations for how location/district data is stored, cached, and displayed.
  - Scope:
    - Define retention and cache TTLs; clarify PII handling and redaction
  - Acceptance criteria:
    - Guardrails shared and acknowledged by team
  - Validation:
    - Spot-check data and UI against guardrails

- BE — Store profile and resolve districts
  - Goal: Persist profile updates and provide district information for a provided ZIP or address.
  - Scope:
    - Profile update endpoint that validates and stores the editable fields
    - Geocoding endpoint that returns congressional and state district identifiers and applies basic caching
  - Acceptance criteria:
    - Update endpoint returns the stored record
    - Geocoding endpoint handles valid ZIP/address and rejects clearly invalid input
  - Validation:
    - Unit checks for validation and basic caching behavior
    - Integration flow: update profile with a new ZIP and receive district data
  - Deliverables:
    - Profile update endpoint accepting a defined set of fields; returns saved record
    - Geocoding endpoint accepting ZIP/address; returns congressional + state districts
    - Cache with defined TTL; input validation and error semantics
  - Inputs/Outputs:
    - Inputs: profile fields; ZIP/address string
    - Outputs: saved user record; district identifiers or clear error
  - Constraints & Non‑Goals:
    - Do not accept free‑form arbitrary payloads; whitelist fields
    - Do not call geocoding provider on obviously invalid inputs
  - Acceptance tests (numbered):
    1) Valid profile update → 200 with updated record
    2) Invalid field values → 400 with field‑level messages
    3) Valid ZIP lookup twice → second call served from cache

- PM — Location accuracy QA
  - Goal: Validate district lookups for a variety of ZIP/address cases.
  - Scope:
    - Test urban/rural/multi‑district ZIPs; capture mismatches
  - Acceptance criteria:
    - No P1 issues; guidance documented for edge cases
  - Validation:
    - Checklist with results

### US-004: View Federal Bill Details (Basic)
Hours: FE 12 | BE 12 | TL 8 | PM 4

- FE — Bill details and actions
  - Goal: Present a complete, readable bill page and enable key actions.
  - Scope:
    - Display core bill information (title/number, status, latest action, sponsor, subjects, summaries, actions, links to text)
    - Primary actions: “Watch” and “Voice your opinion”; guests are guided to sign in
    - Graceful loading and error states; placeholder for future AI summary
  - Acceptance criteria:
    - Bill page renders all core sections for valid bill IDs
    - Errors are handled with helpful messaging and a retry option
  - Validation:
    - Demo: multiple known bills render; simulate failure and verify error UI; watch/unwatch works for signed‑in users
    - Automated: e2e renders a seeded bill and verifies sections are visible
  - Deliverables:
    - Sections: header (title/number/status), latest action, sponsor, subjects, summaries, actions list, text links
    - CTAs: Watch/Unwatch; Voice your opinion (navigates to compose)
    - UI states: loading skeletons, empty subsections, error with retry
  - Inputs/Outputs:
    - Input: bill identifier (congress, type, number)
    - Outputs: fully rendered page or clear error component
  - Constraints & Non‑Goals:
    - Do not include AI summary content in this sprint (placeholder only)
    - Do not implement comments or discussions
  - Acceptance tests (numbered):
    1) Valid bill ID → all core sections visible
    2) Upstream outage simulated → error UI with retry appears
    3) Guest clicks Watch → redirected to sign‑in with return path retained

- TL — Data ingestion and caching guardrails
  - Goal: Define sync/caching expectations and fallback behavior for bill data.
  - Scope:
    - Set sync cadence, cache TTLs, and upstream outage handling
  - Acceptance criteria:
    - Rules documented and reflected in BE behavior; FE error states aligned
  - Validation:
    - Review sync/caching settings; simulate outage

- BE — Bill data fetch and caching
  - Goal: Provide stable, normalized bill data quickly, even when the upstream source is slow or failing.
  - Scope:
    - Endpoint that returns a normalized bill record for a given ID
    - One‑hour caching of successful fetches
    - Fallback to last known good data when upstream is unavailable, with a clear indicator
  - Acceptance criteria:
    - Typical requests return within acceptable latency and include complete core fields
    - Outage scenario still returns cached data when available
  - Validation:
    - Unit checks for data normalization
    - Integration: fetch → verify values; simulate upstream failure → verify cached response
  - Deliverables:
    - Detail endpoint accepting bill identifier; normalized response shape (fields for title, status, latestAction, sponsor, subjects, summaries, actions, textLinks)
    - Cache TTL: 1 hour for successful fetches; explicit header indicating data source (live/cache)
    - Fallback behavior serving last known good data on upstream failure
  - Inputs/Outputs:
    - Inputs: bill identifier (congress, type, number)
    - Outputs: normalized bill record; standard error on failure with optional retry-after hint
  - Constraints & Non‑Goals:
    - Do not return partial 200s without indicating which sections are unavailable
    - Do not expose upstream provider errors directly to end users
  - Acceptance tests (numbered):
    1) Cold request → live fetch, cached for subsequent call
    2) Second request within TTL → served from cache
    3) Upstream failure after cache exists → cached response returned with header noting fallback

- PM — Content QA & data validation
  - Goal: Validate data accuracy and page presentation.
  - Scope:
    - Spot-check titles, actions, sponsors vs. source data; verify related campaigns appear
  - Acceptance criteria:
    - No critical accuracy issues; defects triaged
  - Validation:
    - Checklist and sign-off

### INFRA: Infrastructure Setup
Hours: FE 12 | BE 12 | TL 20 | PM 8

- FE — Project bootstrap and quality gates
  - Goal: Ensure a smooth developer experience and consistent UI across features.
  - Scope:
    - Provide scripts to build, lint, type‑check, run unit tests, and run e2e tests
    - Establish a small shared UI library for forms/buttons/inputs/skeletons used in Sprint 0 pages
    - Write a brief “getting started” guide for local development and test execution
  - Acceptance criteria:
    - One‑command setup for local run and tests
    - Shared components are used across the Sprint 0 pages
  - Validation:
    - Run scripts on a clean machine; verify pages use shared components
  - Deliverables:
    - Scripts: build, lint, type‑check, unit, e2e
    - UI kit v1: buttons, inputs, forms, skeletons
    - Getting started guide: local run, tests, common pitfalls
  - Constraints & Non‑Goals:
    - Do not introduce multiple competing UI libraries
    - Do not gate local runs on cloud resources
  - Acceptance tests (numbered):
    1) Fresh clone → one command runs dev successfully
    2) All quality gates pass on CI for a sample PR

- TL — CI/CD and sandbox readiness
  - Goal: Provide core pipelines and sandbox cloud resources for development and QA.
  - Scope:
    - Continuous integration checks; basic deployment pipeline; environment config conventions
  - Acceptance criteria:
    - Pipelines green on PRs; sandbox resources available to team
  - Validation:
    - Trial run of pipeline and a smoke deploy
  - Deliverables:
    - CI pipeline with lint, type‑check, unit tests, and build
    - Basic deployment workflow to sandbox; environment naming conventions
    - Configuration summary including required secrets/variables
  - Constraints & Non‑Goals:
    - Do not auto‑promote to production
    - Do not store secrets in source control
  - Acceptance tests (numbered):
    1) PR triggers CI; failing gates block merge
    2) Manual workflow triggers sandbox deploy; smoke test passes

- BE — API baseline and health
  - Goal: Provide a dependable foundation for new endpoints.
  - Scope:
    - Define and validate required environment configuration
    - Provide common response and error shapes for all endpoints
    - Expose health and readiness endpoints
  - Acceptance criteria:
    - Service starts with validated configuration
    - Health endpoints report ready/healthy; new routes align to the common response format
  - Validation:
    - Start with sample configuration; verify health endpoints; trigger a controlled error and confirm the standard error payload
  - Deliverables:
    - Health endpoints: `/healthz` (liveness) and `/readyz` (readiness) with JSON payloads
    - Standard response envelope for new routes (success/data/error)
    - Environment configuration contract (required keys, validation rules)
  - Constraints & Non‑Goals:
    - Do not expose stack traces in production responses
    - Do not allow routes to return inconsistent envelopes
  - Acceptance tests (numbered):
    1) Missing env key at startup → process fails with clear message
    2) Health endpoints return expected JSON and status codes
    3) Sample route returns standardized envelope

- PM — Process & environment readiness
  - Goal: Enable the team to work consistently across environments.
  - Scope:
    - Onboarding checklist; QA environment checklist; access coordination
  - Acceptance criteria:
    - All team members can access required tools and environments
  - Validation:
    - Checklists completed; access verified
  - Deliverables:
    - Onboarding checklist (tools, accounts, environments)
    - QA environment checklist (browsers/devices, accounts, seeds)
    - Access roster (who has what)
  - Constraints & Non‑Goals:
    - Do not include marketing or GTM processes in this sprint
  - Acceptance tests (numbered):
    1) New teammate completes onboarding without blockers
    2) QA env checklists executed and signed off



---

## Sprint 1 Task Breakdown (Core User Features & Discovery)

Two-week sprint delivering discovery and overview experiences. Tasks are written for FE, TL, BE, and PM with clear acceptance and validation. Hours per role align with the sprint schedule.

## US-001: View Home Feed with Filters
Hours: FE 20 | BE 20 | TL 8 | PM 8

- FE — Personalized, filterable home feed
  - Goal: Present a filterable home feed showing mixed content (bills, news, campaigns), with anonymous and signed-in variants.
  - Scope:
    - Tabs for For You, News, Campaigns, Bills
    - Pagination/infinite scroll per tab
    - Persistent selected filter within session
    - Graceful empty states and loading placeholders
  - Acceptance criteria:
    - Tabs switch without full reload and reflect correct results
    - Anonymous shows popular content; signed-in reflects follows/interests
    - Selected tab/filter persists during the session
  - Validation:
    - Demo: switch tabs; paginate; reload page; verify persisted selection
    - e2e: anonymous vs. signed-in feed ordering
  - Deliverables:
    - Tabbed feed UI with four tabs (For You, News, Campaigns, Bills)
    - Loading skeletons for list items; empty-state component with CTA
    - Session persistence for selected tab/filter (survives reload in same session)
    - Basic metrics events: feed_tab_viewed, feed_page_loaded, feed_filter_applied
  - Constraints & Non‑Goals:
    - Do not implement complex personalization (weighting by ideology) in this sprint
    - Do not fetch more than one page ahead (no aggressive prefetching)
  - Acceptance tests (numbered):
    1) Switch tabs → list content changes without full reload; tab focus is visible
    2) Apply a filter → only matching items shown; “clear filters” restores full list
    3) Paginate to next page → additional items appended; no duplicates; loading state shown
    4) Reload page in same session → previously selected tab/filter restored

- TL — Feed architecture and performance guidance
  - Goal: Ensure a scalable feed architecture with consistent query patterns and caching guidelines.
  - Scope:
    - Define API contract for feed endpoints and filters
    - Set performance budget and caching policy (short TTL for freshness)
    - Confirm pagination strategy and limits
  - Acceptance criteria:
    - Documented endpoint contract and filter schema
    - Agreed page size and max depth; no unbounded queries
  - Validation:
    - Review API contract; verify consistent usage in FE and BE
  - Deliverables:
    - Feed API contract (parameters, response envelope, error semantics)
    - Performance budget for feed endpoints and UI (latency targets, page size)
    - Caching guidance (client/server TTLs) and pagination rules
  - Constraints & Non‑Goals:
    - Do not define advanced ranking models; use simple by‑engagement defaults
  - Acceptance tests (numbered):
    1) FE and BE reference the same parameter names and defaults
    2) Page size and maximum depth documented and enforced in responses
    3) A sample error payload matches the contract and is handled in FE

- BE — Feed endpoints and personalization inputs
  - Goal: Provide endpoints for each tab (For You, News, Campaigns, Bills) with support for filters and session/user context.
  - Scope:
    - Implement query parameters for policy filters, pagination, and sorting
    - Include personalization fields (interests, follows) when authenticated
    - Return stable, documented response shapes
  - Acceptance criteria:
    - All tabs return results within acceptable latency
    - Pagination metadata present (page, pageSize, totalItems where applicable)
  - Validation:
    - Unit: filter parsing and pagination
    - Integration: end-to-end tab queries with and without a session
  - Deliverables:
    - Endpoints per tab or one endpoint with a `tab` parameter; supports `page`, `pageSize`, `policy`, `sort`
    - Response envelope with items[] and pagination meta (page, pageSize, totalItems if available)
    - Basic personalization: include follows/interests only when session present
  - Constraints & Non‑Goals:
    - Do not include heavy joins that exceed latency budget; cap sorts and filters
  - Acceptance tests (numbered):
    1) Anonymous For You → returns popular mix; personalization fields ignored
    2) Signed‑in For You → reflects follows/interests in ordering within budget
    3) Invalid page/pageSize → returns 400 with field‑level error message
    4) Policy filter present → items all match requested policy

- PM — Feed QA and success metrics
  - Goal: Validate feed relevance and usability; define top-of-funnel metrics.
  - Scope:
    - QA checklist for tab behavior, filters, pagination, and session persistence
    - Define baseline metrics (time on page, tab usage)
  - Acceptance criteria:
    - QA passes with no blocking defects
    - Metrics documented and shared for tracking
  - Validation:
    - Run checklist across desktop/mobile
  - Deliverables:
    - QA checklist covering tabs, filters, pagination, session persistence, and empty states
    - Baseline metrics definition and a simple looker/spreadsheet to track tab usage
  - Constraints & Non‑Goals:
    - Do not run multivariate tests this sprint
  - Acceptance tests (numbered):
    1) Checklist executed with evidence (screenshots/video) and no P1/P2 defects
    2) Metrics baseline captured from a staged run and shared with stakeholders

## US-002: Browse Policy-Specific Content
Hours: FE 12 | BE 12 | TL 4 | PM 4

- FE — Policy issue page
  - Goal: Provide a policy-focused page with top content and a filtered feed.
  - Scope:
    - Static routes per policy category
    - Top section cards (map, top news, key actions)
    - Feed filtered to policy
  - Acceptance criteria:
    - All policy routes render with correct category labels
    - Feed shows only matching content
  - Validation:
    - Demo: navigate all policy routes; verify content scope
  - Deliverables:
    - Static routes for each policy category; header shows category label
    - Top section with three tiles (map, top news, key actions)
    - Feed scoped to category with loading/empty states
  - Constraints & Non‑Goals:
    - Do not implement advanced personalization beyond category scoping
  - Acceptance tests (numbered):
    1) Navigate to each policy route → correct label and content scope
    2) Feed contains only items tagged to the category
    3) Empty category shows friendly empty state with a back‑to‑all link

- TL — Category mapping oversight
  - Goal: Ensure consistent category mapping across data sources.
  - Scope:
    - Approve single mapping table for policy categories
    - Define how unmapped or ambiguous subjects are handled
  - Acceptance criteria:
    - Mapping table published; fallback rules agreed
  - Validation:
    - Spot-check mapping on sample items
  - Deliverables:
    - Single mapping table and fallback rules for unmapped subjects
    - Decision notes for ambiguous categories
  - Acceptance tests (numbered):
    1) Given inputs “Education” and “Health” → mapping returns expected site categories
    2) Unmapped subject defaults to fallback without throwing in FE/BE

- BE — Category-filtered feed
  - Goal: Provide feed endpoints that accept a policy filter and return scoped results.
  - Scope:
    - Add `policy` filter support and input validation
    - Ensure indexes/queries return results within budget
  - Acceptance criteria:
    - Requests with `policy` only include matching items
  - Validation:
    - Unit: filter handling; Integration: sample categories
  - Deliverables:
    - Feed endpoint accepts `policy` parameter; validates against allowed list
    - Response contains only items for that policy and includes pagination meta
  - Constraints & Non‑Goals:
    - Do not allow arbitrary strings; reject invalid categories
  - Acceptance tests (numbered):
    1) Valid `policy` → only matching content returned
    2) Invalid `policy` → 400 with clear message

- PM — Route matrix QA
  - Goal: Verify all policy routes exist and load consistently.
  - Scope:
    - Create a route checklist; test desktop/mobile
  - Acceptance criteria:
    - All routes pass without broken links or blank states
  - Validation:
    - Run checklist; file defects

## US-003: Browse Federal Bills by Category
Hours: FE 8 | BE 8 | TL 0 | PM 4

- FE — Category browsing UI
  - Goal: Let users browse recent federal bills by selected policy categories.
  - Scope:
    - Multi-select filters and badges
    - Category sections with capped bill counts
  - Acceptance criteria:
    - Filters control visible categories; badges reflect selection
  - Validation:
    - Demo: select/deselect categories and verify results
  - Deliverables:
    - Multi-select filter controls with badges showing active selections
    - Category group sections with capped item counts (visible cap noted)
  - Acceptance tests (numbered):
    1) Select multiple categories → only those groups visible
    2) Deselect all → all groups visible again
    3) Each category shows ≤ configured max items, sorted by latest action date

- TL — (No planned hours)
  - Goal: Available for consultation as needed.

- BE — Category query for bills
  - Goal: Return the most recent bills per selected categories.
  - Scope:
    - Support multi-category inputs and limit per category
  - Acceptance criteria:
    - Returns up to the configured limit ordered by latest action
  - Validation:
    - Integration: multi-category requests
  - Deliverables:
    - Endpoint that accepts multiple categories; returns recent bills per category capped at max
    - Sort by latest action date descending
  - Constraints & Non‑Goals:
    - Do not exceed per‑category limit; truncate with clear meta
  - Acceptance tests (numbered):
    1) Request 3 categories → response contains only those, each capped and sorted
    2) Unknown category → rejected with 400 and error message

- PM — QA and content spot-check
  - Goal: Ensure accuracy of bill groupings.
  - Scope:
    - Spot-check categories; verify counts and sort order
  - Acceptance criteria:
    - Groupings and limits behave as specified
  - Validation:
    - Run checklist; log inconsistencies

## US-009: Browse Organizations
Hours: FE 4 | BE 4 | TL 0 | PM 4

- FE — Organization list
  - Goal: Present a browsable list with basic filters/sorts.
  - Scope:
    - List view with logo, name, focus areas, and basic metrics
    - Sort options and pagination
  - Acceptance criteria:
    - Sort/pagination work consistently; clear empty state
  - Validation:
    - Demo: sort and paginate
  - Deliverables:
    - List view with logo, name, focus areas, supporters count
    - Sort by name and active_campaigns; pagination controls
  - Acceptance tests (numbered):
    1) Sort by name asc/desc → ordering correct
    2) Paginate next/prev → items change with no duplicates; selection persists

- TL — (No planned hours)
  - Goal: Available for consultation as needed.

- BE — Organization listing endpoint
  - Goal: Provide a pageable list with filters/sorts.
  - Scope:
    - Implement query params for sort and page
  - Acceptance criteria:
    - Stable response shape; consistent sort order
  - Validation:
    - Unit: parameter validation; Integration: sample lists
  - Deliverables:
    - Endpoint with `sort`, `page`, `pageSize`; validates ranges and fields
    - Response envelope with items[] + pagination meta
  - Acceptance tests (numbered):
    1) Unknown sort → 400 with valid options listed
    2) pageSize over max → clamped or rejected per spec

- PM — QA checklist
  - Goal: Confirm usability and correctness.
  - Scope:
    - Validate list interactions and copy
  - Acceptance criteria:
    - No blocking defects; copy approved
  - Validation:
    - Run checklist; gather feedback

## US-010: View Organization Profile
Hours: FE 8 | BE 8 | TL 0 | PM 4

- FE — Organization profile page
  - Goal: Show org profile details and active campaigns.
  - Scope:
    - Header with logo, name, description; campaigns list
    - External links (website, social)
  - Acceptance criteria:
    - Page renders for valid slugs; broken link handling in place
  - Validation:
    - Demo with multiple orgs
  - Deliverables:
    - Org header (logo, name, description), website/social links, active campaigns list
    - 404 page for unknown slug, error state for fetch issues
  - Acceptance tests (numbered):
    1) Valid slug → header and campaigns render
    2) Invalid slug → 404 with “Organization not found”

- TL — (No planned hours)
  - Goal: Available for consultation as needed.

- BE — Org profile endpoint
  - Goal: Return organization details by slug.
  - Scope:
    - Include active campaigns summary
  - Acceptance criteria:
    - Stable shape; missing org returns clear 404
  - Validation:
    - Integration: valid and invalid slugs
  - Deliverables:
    - Endpoint returning org fields + active campaigns summary for given slug
    - 404 error for missing org
  - Acceptance tests (numbered):
    1) Known slug → returns full org record
    2) Unknown slug → 404 with error payload

- PM — Review and QA
  - Goal: Validate content and links.
  - Scope:
    - Spot-check a set of orgs; verify campaign counts
  - Acceptance criteria:
    - No critical content issues
  - Validation:
    - Run checklist; log defects

## US-015: View Dashboard Overview
Hours: FE 12 | BE 12 | TL 0 | PM 4

- FE — Dashboard overview
  - Goal: Provide a concise snapshot of the user’s activity.
  - Scope:
    - Metrics: messages sent, contacts, responses, trends
    - Quick links to recent actions
  - Acceptance criteria:
    - Dashboard loads under budget and shows real data
  - Validation:
    - Demo with populated and empty accounts
  - Deliverables:
    - Dashboard tiles for: messages sent, contacts, responses, trend sparkline
    - Quick links to recent actions; empty state guidance
  - Acceptance tests (numbered):
    1) Populated user → tiles show non‑zero metrics; sparkline renders
    2) New user → empty state copy shown with link to start first action

- TL — (No planned hours)
  - Goal: Available for consultation as needed.

- BE — Activity summary endpoint
  - Goal: Aggregate user activity metrics.
  - Scope:
    - Compute and return core stats and small time series
  - Acceptance criteria:
    - Returns within performance budget; handles empty accounts
  - Validation:
    - Unit: aggregation logic; Integration: sample users
  - Deliverables:
    - Aggregation endpoint returning counts and simple monthly trend
    - Handles users with zero activity (returns zeros)
  - Acceptance tests (numbered):
    1) User with data → sums match seeded records; trend points align to months
    2) User with no data → zeros returned with no errors

- PM — Metrics validation
  - Goal: Ensure numbers are clear and credible.
  - Scope:
    - Compare displayed metrics with raw data spot-checks
  - Acceptance criteria:
    - No discrepancies beyond rounding
  - Validation:
    - Run checklist; capture issues


---

## Sprint 2 Task Breakdown (Messaging & News)

Two-week sprint delivering basic messaging flows, AI-assisted drafting, and news experiences. Tasks for FE, TL, BE, PM include acceptance and validation. Hours per role align with the sprint schedule.

## US-013: Send Advocacy Message – Basic Flows
Hours: FE 20 | BE 20 | TL 8 | PM 8

- FE — Compose and send message (basic flows)
  - Goal: Let users compose a message, select recipients, and send (anonymous or signed-in).
  - Scope:
    - Message compose screen with stance (support/oppose) and recipient selection
    - Anonymous path collects sender info; signed-in pre-fills known details
    - Confirmation screen with delivery status and reference number
  - Acceptance criteria:
    - Anonymous and signed-in submissions both succeed
    - Confirmation number displayed and shareable
  - Validation:
    - Demo: anonymous send; signed-in send; invalid form error handling

- TL — Messaging flow guardrails
  - Goal: Ensure safe defaults and abuse prevention for initial volumes.
  - Scope:
    - Define basic rate limits and payload size limits
    - Approve PII handling and storage approach
  - Acceptance criteria:
    - Rate limit thresholds documented and enforced
  - Validation:
    - Spot-check rate-limit responses and payload validation

- BE — Message processing and delivery
  - Goal: Accept message submissions, validate, queue delivery, and record status.
  - Scope:
    - Submission endpoint for anonymous and authenticated users
    - Delivery queue and basic status tracking
  - Acceptance criteria:
    - Returns confirmation data and per-recipient status
  - Validation:
    - Unit: validation and queuing; Integration: end-to-end send with mock delivery

- PM — QA scenarios
  - Goal: Validate end-to-end messaging flows.
  - Scope:
    - Create scenarios for anonymous, signed-in, and form error cases
  - Acceptance criteria:
    - All scenarios pass without blockers
  - Validation:
    - Execute checklist on desktop/mobile

## US-014: AI-Assisted Message Drafting (Template-First Approach - Efficiency Optimized)
Hours: FE 8 | BE 20 | TL 8 | PM 4

- FE — Draft assistant interface
  - Goal: Allow users to request an AI-enhanced draft with regeneration options.
  - Scope:
    - Draft request UI ("AI Help" button)
    - Display suggested draft (template or AI-enhanced) with edit capability
    - Regenerate button to cycle through templates or request new AI enhancement
  - Acceptance criteria:
    - Users can generate, regenerate, review, and edit suggested drafts
    - Templates work instantly; AI enhancement adds personalization
  - Validation:
    - Demo: request draft; regenerate multiple times; accept into message compose

  **Efficiency Win:** Build template system first (10-15 templates per position), then add AI enhancement layer. Templates always work (no API failures), AI adds personalization when available. More reliable, saves ~10 hours implementation time.

- TL — Safety and cost controls for AI usage
  - Goal: Bound AI usage within safe, predictable limits.
  - Scope:
    - Define daily/hourly request caps and output length limits
    - Approve guardrails for sensitive content
  - Acceptance criteria:
    - Caps and guardrails are applied; misuse paths blocked
  - Validation:
    - Attempt over-cap requests; verify blocked with helpful messaging

- BE — Template + AI draft service
  - Goal: Provide a hybrid service that serves templates and optionally enhances with AI.
  - Scope:
    - Template system with 10-15 message templates per bill position (Support/Oppose)
    - Variable substitution ({billNumber}, {billTitle}, {userName}, {representativeName})
    - AWS Bedrock layer to enhance templates with bill-specific content (fallback to plain template)
    - Caching for AI enhancements (24 hours in Redis)
    - Rate limiting (templates don't count against limit)
  - Acceptance criteria:
    - Templates return instantly; AI enhancement adds value but failures fall back gracefully
    - Returns drafts within latency budget; respects user caps for AI only
  - Validation:
    - Unit: template rendering and AI enhancement; Integration: full flow with fallback testing

- PM — Feature walkthrough and copy review
  - Goal: Ensure users understand the value and limitations.
  - Scope:
    - Review UI copy; confirm disclaimers and guidance
  - Acceptance criteria:
    - Copy approved and consistent across flows
  - Validation:
    - Demo script execution

## US-006: View Grouped News Story
Hours: FE 12 | BE 12 | TL 4 | PM 4

- FE — News story page
  - Goal: Show a news story grouped with related items and a call to action.
  - Scope:
    - Story content, related stories list, and “Voice Opinion” CTA
  - Acceptance criteria:
    - Page renders for valid stories; related list populated
  - Validation:
    - Demo with multiple examples

- TL — Content grouping standards
  - Goal: Consistent grouping rules and thresholds.
  - Scope:
    - Approve grouping criteria (similarity/time window)
  - Acceptance criteria:
    - Documented criteria; FE/BE alignment
  - Validation:
    - Spot-check grouped sets

- BE — News retrieval and grouping
  - Goal: Provide endpoints for story content and related grouping.
  - Scope:
    - Story detail endpoint and grouping endpoint with limits
  - Acceptance criteria:
    - Returns within latency budget with capped related results
  - Validation:
    - Integration: sample stories and groups

- PM — QA checklist
  - Goal: Validate story/related consistency.
  - Scope:
    - Visual checks and link validation
  - Acceptance criteria:
    - No dead links or empty related lists (when data exists)
  - Validation:
    - Run checklist

## US-007: View AI News Overview
Hours: FE 8 | BE 12 | TL 0 | PM 4

- FE — News overview UI
  - Goal: Present an at-a-glance AI-generated overview of a topic.
  - Scope:
    - Summary display, sources list, and refresh action
  - Acceptance criteria:
    - Overview loads quickly with source attribution
  - Validation:
    - Demo: refresh; verify content updates within schedule

- TL — (No planned hours)
  - Goal: Available for consultation as needed.

- BE — Overview generation and caching
  - Goal: Produce and cache overviews for topics.
  - Scope:
    - Endpoint returns overview, sources, and cache TTL
  - Acceptance criteria:
    - Within latency budget; respects cache TTL
  - Validation:
    - Integration: repeated requests; verify caching

- PM — UX and copy check
  - Goal: Ensure overview is understandable and trustworthy.
  - Scope:
    - Copy review and source verification
  - Acceptance criteria:
    - Clear, neutral summary with sources
  - Validation:
    - Review checklist

## US-008: Take Action from News Story
Hours: FE 4 | BE 4 | TL 0 | PM 4

- FE — CTA from news
  - Goal: Enable action (message send) directly from a news context.
  - Scope:
    - “Voice Opinion” CTA leading to compose with prefilled context
  - Acceptance criteria:
    - Prefill works; user can back out without losing context
  - Validation:
    - Demo: launch compose from multiple stories

- TL — (No planned hours)
  - Goal: Available for consultation as needed.

- BE — Prefill support
  - Goal: Accept prefilled context for downstream compose flow.
  - Scope:
    - Accept context tokens; validate and pass through
  - Acceptance criteria:
    - Compose receives correct context consistently
  - Validation:
    - Integration: verify downstream receive

- PM — Flow QA
  - Goal: Confirm frictionless transition from read to act.
  - Scope:
    - Test multiple stories and outcomes
  - Acceptance criteria:
    - No blockers; context preserved
  - Validation:
    - Run checklist

## US-005: View Texas State Bill Details
Hours: FE 4 | BE 8 | TL 4 | PM 4

- FE — State bill detail page
  - Goal: Show core details for a state bill (Texas at launch).
  - Scope:
    - Title, status, latest action, sponsors, and links
  - Acceptance criteria:
    - Valid IDs render; errors gracefully handled
  - Validation:
    - Demo with several bills

- TL — State data guardrails
  - Goal: Set limits and expectations for state feeds.
  - Scope:
    - Define sync frequency and volume bounds
  - Acceptance criteria:
    - Documented plan for state sync cadence
  - Validation:
    - Review plan

- BE — State bill endpoint
  - Goal: Retrieve and normalize a single state bill’s data.
  - Scope:
    - Detail endpoint with caching and error fallback
  - Acceptance criteria:
    - Returns normalized fields; reasonable latency
  - Validation:
    - Integration: known IDs and outage fallback

- PM — QA
  - Goal: Validate correctness on sample bills.
  - Scope:
    - Spot-check against source data
  - Acceptance criteria:
    - No critical mismatches
  - Validation:
    - Checklist completion


---

## Sprint 3 Task Breakdown (Voter Verification & Premium Membership)

Two-week sprint delivering voter verification, premium purchase flows, and subscription management. FE, TL, BE, PM tasks include acceptance and validation. Hours per role align with the sprint schedule.

## US-016: Verify Voter Registration (Voter Data Provider)
Hours: FE 20 | BE 20 | TL 8 | PM 8

- FE — Voter verification flow
  - Goal: Let users check registration status with a clear result and guidance.
  - Scope:
    - Verification form (name, address, DOB year)
    - Result states: verified, not found, ambiguous match, error
    - Save verification status on success
  - Acceptance criteria:
    - Verified status persists on profile; non-verified shows actionable guidance
  - Validation:
    - Demo: verified, not found, and ambiguous cases

- TL — Data privacy and limits
  - Goal: Ensure verification respects privacy and provider limits.
  - Scope:
    - Define data minimization and retention; set rate limits
  - Acceptance criteria:
    - Only required fields collected; limits enforced
  - Validation:
    - Review data audit; rate limit checks

- BE — Verification endpoint and provider integration
  - Goal: Submit lookups to the provider and normalize responses.
  - Scope:
    - Endpoint to accept inputs; map provider responses to standard result types
    - Persist verification metadata and districts
  - Acceptance criteria:
    - Reliable result mapping; profile updated on success
  - Validation:
    - Unit: response mapping; Integration: provider sandbox cases

- PM — Flow QA and support copy
  - Goal: Ensure results are understandable and actionable.
  - Scope:
    - Review result copy; create support note for edge cases
  - Acceptance criteria:
    - QA passes; support content approved
  - Validation:
    - Execute checklist; sign-off

## US-020: View & Subscribe to Premium Membership
Hours: FE 20 | BE 20 | TL 8 | PM 8

- FE — Membership purchase UX
  - Goal: Present plan details and start checkout clearly and confidently.
  - Scope:
    - Pricing/benefits page
    - Checkout CTA and completion screen
  - Acceptance criteria:
    - Successful purchases return to app with confirmation
  - Validation:
    - Demo: purchase flow; declined payment; user cancel

- TL — Payment configuration and webhooks
  - Goal: Ensure secure payment processing and reliable webhook handling.
  - Scope:
    - Configure provider settings; define required webhooks and metadata
  - Acceptance criteria:
    - Webhooks received and processed in test mode consistently
  - Validation:
    - Simulate events; verify user state updates

- BE — Checkout session and webhook handling
  - Goal: Create checkout sessions and handle payment lifecycle events.
  - Scope:
    - Endpoint to create checkout sessions with plan metadata
    - Webhook handler to activate membership and record invoices
  - Acceptance criteria:
    - Membership tier updates on success; failures logged and retried per policy
  - Validation:
    - Integration: test events update user state and history

- PM — Offer and messaging review
  - Goal: Ensure pricing and value proposition are clear.
  - Scope:
    - Review plan copy; confirm emails/receipts content
  - Acceptance criteria:
    - Stakeholder approval of plan page and post-purchase copy
  - Validation:
    - Demo & sign-off

## US-021: Manage Subscription (Stripe Customer Portal - Efficiency Optimized)
Hours: FE 2 | BE 2 | TL 0 | PM 1 (reduced from 32 hours via Stripe's hosted portal)

- FE — Manage subscription entry points
  - Goal: Provide easy access to Stripe's hosted billing portal.
  - Scope:
    - Single "Manage Subscription" button in dashboard/profile that redirects to Stripe portal
    - Status display showing current plan
  - Acceptance criteria:
    - Users can access portal and return to app after changes
  - Validation:
    - Demo: portal session; confirm redirect and return flow

  **Efficiency Win:** Use Stripe's hosted Customer Portal instead of custom UI. Stripe handles all subscription management (cancel, update payment, view invoices, download receipts). Zero maintenance, professional UI, saves 31 hours.

- TL — (No planned hours - efficiency optimization)
  - Goal: Stripe handles all subscription management; no custom lifecycle rules needed

- BE — Customer portal session creation
  - Goal: Create Stripe portal sessions and keep subscription state current via webhooks.
  - Scope:
    - Simple endpoint to create portal session using stripe.billingPortal.sessions.create()
    - Webhook processing for subscription changes (already handled in US-020)
  - Acceptance criteria:
    - Portal session opens correctly and returns user to app
  - Validation:
    - Integration: portal session creation and webhook updates

- PM — QA scenarios
  - Goal: Validate Stripe portal functionality.
  - Scope:
    - Test cancel, update payment, view history in Stripe portal
  - Acceptance criteria:
    - All portal functions work; webhooks update app state
  - Validation:
    - Quick checklist (Stripe handles UX, we only test integration)

## US-024: View Advocacy Impact Analytics (Premium)
Hours: FE 8 | BE 8 | TL 0 | PM 4

- FE — Premium analytics view
  - Goal: Show impact metrics and simple trends for premium users.
  - Scope:
    - Charts/metrics (actions over time, delivery rates)
  - Acceptance criteria:
    - Visible only to premium; loads within budget
  - Validation:
    - Demo with seeded premium user

- TL — (No planned hours)
  - Goal: Available for consultation as needed.

- BE — Analytics aggregation
  - Goal: Provide a summary of impact metrics.
  - Scope:
    - Endpoint that aggregates actions and delivery outcomes
  - Acceptance criteria:
    - Returns expected metrics and time window
  - Validation:
    - Unit: aggregation; Integration: sample data

- PM — Metrics and narratives
  - Goal: Ensure metrics are clear and useful.
  - Scope:
    - Validate numbers; draft short explainer copy
  - Acceptance criteria:
    - Copy approved; numbers verified
  - Validation:
    - Checklist & sign-off


---

## Sprint 4 Task Breakdown (Organization Campaigns – Phase 1)

Two-week sprint delivering org authentication/teams, org profile management, campaign creation, and messaging campaign flows. Hours per role align with the sprint schedule.

## ORG-001: Organization Login & Team Management
Hours: FE 12 | BE 12 | TL 4 | PM 4

- FE — Org access and team screens
  - Goal: Allow org users to sign in and manage team members.
  - Scope:
    - Org sign-in access point
    - Team list (roles), invite/remove member flows
  - Acceptance criteria:
    - Team changes reflect immediately; invites deliver successfully
  - Validation:
    - Demo: add/remove/invite; invalid email handling

- TL — Role model and permissions
  - Goal: Define roles and permissions for org users (admin/editor/viewer).
  - Scope:
    - Role matrix and minimum permissions for campaign actions
  - Acceptance criteria:
    - Documented matrix; enforced in endpoints
  - Validation:
    - Spot-check role-based actions

- BE — Org session and team endpoints
  - Goal: Provide endpoints for team CRUD and invites.
  - Scope:
    - List/add/remove members; send/cancel invites; accept invite
  - Acceptance criteria:
    - Input validation; clear errors; audit invites
  - Validation:
    - Unit: validation; Integration: invite lifecycle

- PM — QA & support notes
  - Goal: Validate team management flows and create support guidance.
  - Scope:
    - QA checklist; write help note for common issues
  - Acceptance criteria:
    - No blockers; support note published
  - Validation:
    - Execute checklist

## ORG-002: View & Edit Organization Profile
Hours: FE 8 | BE 8 | TL 4 | PM 4

- FE — Org profile editor
  - Goal: Enable org admins to update org info (name, logo, description, links).
  - Scope:
    - Edit form with preview; success/validation messaging
  - Acceptance criteria:
    - Changes persist and reflect publicly
  - Validation:
    - Demo: edit/save/cancel; invalid input

- TL — Content guidelines
  - Goal: Define acceptable fields and moderation triggers.
  - Scope:
    - Field validation rules; optional moderation flags
  - Acceptance criteria:
    - Rules documented and enforced
  - Validation:
    - Spot-check saves with invalid content

- BE — Org profile endpoints
  - Goal: Provide read/update endpoints for org profiles.
  - Scope:
    - Update with validation; public read by slug
  - Acceptance criteria:
    - Returns updated record; unauthorized blocked
  - Validation:
    - Integration: admin vs. non-admin edits

- PM — QA & content pass
  - Goal: Validate profile edits and public display.
  - Scope:
    - Verify updates and public rendering
  - Acceptance criteria:
    - No critical content issues
  - Validation:
    - Run checklist

## ORG-003: Create Campaign (Bill/Issue/Candidate)
Hours: FE 32 | BE 32 | TL 12 | PM 12

- FE — Campaign builder
  - Goal: Let org admins create campaigns supporting/ opposing a bill, issue, or candidate.
  - Scope:
    - Campaign type selection; title/summary; stance; media upload; targeting
  - Acceptance criteria:
    - Draft can be saved and published; required fields enforced
  - Validation:
    - Demo: create/save/publish; invalid fields

- TL — Campaign standards and safety
  - Goal: Define campaign data model, moderation hooks, and publishing rules.
  - Scope:
    - Fields per campaign type; publishing and suspension criteria
  - Acceptance criteria:
    - Model and rules documented; enforced at publish
  - Validation:
    - Spot-check type-specific cases

- BE — Campaign endpoints and persistence
  - Goal: CRUD for campaigns with publishing workflow and audit trail.
  - Scope:
    - Create/update/delete (soft), publish/unpublish; audit edits
  - Acceptance criteria:
    - Returns IDs and statuses; audit trail entries recorded
  - Validation:
    - Integration: full lifecycle; verify audit entries

- PM — Admin flows QA and launch checklists
  - Goal: Validate creation/publishing flows; prepare launch checklist.
  - Scope:
    - QA scripts for all types; pre-launch checklist draft
  - Acceptance criteria:
    - No P1 defects; checklist approved
  - Validation:
    - Execute QA scripts; sign-off

## US-013: Send Message – Campaign Flow
Hours: FE 8 | BE 8 | TL 0 | PM 4

- FE — Send from campaign
  - Goal: Start message compose from a campaign with prefilled context.
  - Scope:
    - CTA from campaign to compose; carry campaign ID
  - Acceptance criteria:
    - Prefill present; user can modify before send
  - Validation:
    - Demo: launch compose from multiple campaigns

- TL — (No planned hours)
  - Goal: Available for consultation as needed.

- BE — Prefill support
  - Goal: Accept campaign context and pass through to compose/send endpoints.
  - Scope:
    - Validate campaign ID; attach to action tracking
  - Acceptance criteria:
    - Messages linked to correct campaign
  - Validation:
    - Integration: action log contains campaign linkage

- PM — Flow QA
  - Goal: Validate handoff quality from campaign to compose.
  - Scope:
    - Multiple campaign examples
  - Acceptance criteria:
    - No blockers; context preserved
  - Validation:
    - Checklist run

## US-013: Send Message – Remaining Flows
Hours: FE 8 | BE 4 | TL 0 | PM 4

- FE — Complete remaining edge flows
  - Goal: Support less-common message entry points (e.g., from saved drafts).
  - Scope:
    - Handoff from all remaining flows to compose
  - Acceptance criteria:
    - Every documented flow works end-to-end
  - Validation:
    - Demo each flow; verify confirmation

- TL — (No planned hours)
  - Goal: Available for consultation as needed.

- BE — Minimal support for remaining flows
  - Goal: Ensure endpoints accept handoff tokens and record attribution.
  - Scope:
    - Validate tokens; tie to action tracking
  - Acceptance criteria:
    - Attribution present across flows
  - Validation:
    - Integration checks

- PM — QA matrix
  - Goal: Validate all remaining flows.
  - Scope:
    - Matrix of flows and expected outcomes
  - Acceptance criteria:
    - All pass without blockers
  - Validation:
    - Execute matrix


---

## Sprint 4 Task Breakdown (Organization Campaigns – Phase 1) - Continued

**Note:** ORG-004 (Edit & Pause Campaigns) has been moved from Sprint 5 to Sprint 4 for efficiency. Building Create + Edit + Pause together saves ~12 hours via code reuse (shared forms, validation, API patterns).

## ORG-004: Edit & Pause Campaigns (Batched with Create - Efficiency Optimized)
Hours: FE 12 | BE 12 | TL 4 | PM 4

- FE — Campaign edit/pause (batched with ORG-003)
  - Goal: Allow org admins to edit campaign details and pause/resume visibility.
  - Scope:
    - Edit forms (reuse ORG-003 Create Campaign forms)
    - Pause/resume toggle; status indicator
  - Acceptance criteria:
    - Changes persist; paused campaigns are hidden from public
  - Validation:
    - Demo: edit, pause, resume flows

  **Efficiency Win:** Built immediately after ORG-003 in Sprint 4. Reuses 80% of Create Campaign code (forms, validation, API patterns). Complete campaign management in one sprint.

- TL — Publishing/state rules
  - Goal: Define which fields are editable post-publish and effects of pause.
  - Scope:
    - Editability rules; pause visibility rules
  - Acceptance criteria:
    - Rules documented and enforced
  - Validation:
    - Spot-check edge cases

- BE — Update/pause endpoints
  - Goal: Provide update and pause endpoints with audit entries.
  - Scope:
    - Update fields; record audit; toggle visibility state
  - Acceptance criteria:
    - Returns updated record and audit entry
  - Validation:
    - Integration: verify state changes and audit trail

- PM — QA and guidance
  - Goal: Validate flows and document guidance.
  - Scope:
    - QA checklist; support note on pausing
  - Acceptance criteria:
    - No P1s; guidance approved
  - Validation:
    - Checklist run

## ORG-007: Copy Campaign Link
Hours: FE 4 | BE 4 | TL 0 | PM 4

- FE — Shareable link UI
  - Goal: Provide a simple way to copy a direct campaign link.
  - Scope:
    - Copy button; success feedback; fallback if clipboard blocked
  - Acceptance criteria:
    - Link copies reliably with confirmation
  - Validation:
    - Demo in supported browsers

- TL — (No planned hours)
  - Goal: Available for consultation as needed.

- BE — Link tracking parameters
  - Goal: Support optional tracking parameters on share links.
  - Scope:
    - Accept and preserve UTM-like parameters in analytics
  - Acceptance criteria:
    - Parameters recorded with campaign actions
  - Validation:
    - Integration: clickthrough records params

- PM — QA
  - Goal: Validate copy and tracking behaviors.
  - Scope:
    - Test copy/clipboard and tracked links
  - Acceptance criteria:
    - Reliable copy; params appear in analytics
  - Validation:
    - Checklist run

## ORG-005: Campaign Performance Analytics with Demographics
Hours: FE 32 | BE 32 | TL 12 | PM 12

- FE — Campaign analytics dashboard
  - Goal: Provide orgs with campaign-level metrics and simple segmentation.
  - Scope:
    - Overview KPIs; charts; basic demographic breakdowns where permitted
  - Acceptance criteria:
    - Loads within budget; filters respond quickly
  - Validation:
    - Demo with seeded data; visual checks

- TL — Data usage and privacy
  - Goal: Define allowed demographic aggregations and thresholds.
  - Scope:
    - Minimum counts and anonymization thresholds; retention windows
  - Acceptance criteria:
    - Rules documented and applied in queries
  - Validation:
    - Spot-check edge cases below thresholds

- BE — Analytics aggregation and filters
  - Goal: Compute and return campaign metrics with optional breakdowns.
  - Scope:
    - Aggregations for actions, delivery, conversions; breakdown by allowed dimensions
  - Acceptance criteria:
    - Returns correct results under defined thresholds
  - Validation:
    - Unit: aggregation math; Integration: sample campaigns

- PM — Insights narrative and QA
  - Goal: Ensure metrics help orgs take action.
  - Scope:
    - Draft short narrative for each view; validate numbers
  - Acceptance criteria:
    - Copy approved; numbers verified
  - Validation:
    - Checklist & sign-off

## ORG-006: View Campaign Emails & Message Count
Hours: FE 12 | BE 12 | TL 4 | PM 4

- FE — Delivery/status view
  - Goal: Provide counts and recent delivery events for a campaign.
  - Scope:
    - Cards/tables for emails sent, delivered, bounced; message counts
  - Acceptance criteria:
    - Data updates within reasonable lag; error states handled
  - Validation:
    - Demo on active campaign

- TL — Data freshness and limits
  - Goal: Define update frequency and retention window.
  - Scope:
    - Staleness threshold and caching behavior for counts
  - Acceptance criteria:
    - Documented windows; applied consistently
  - Validation:
    - Review against behavior

- BE — Delivery metrics endpoint
  - Goal: Return recent counts and last events by campaign.
  - Scope:
    - Aggregate and return counts and last events
  - Acceptance criteria:
    - Correct counts; bounded payload sizes
  - Validation:
    - Unit: aggregation; Integration: sample campaign

- PM — QA & docs
  - Goal: Validate display and draft support doc.
  - Scope:
    - QA checklist; short guide on metrics meaning
  - Acceptance criteria:
    - No blocking defects; doc approved
  - Validation:
    - Checklist run

## DOC-001: Design System Documentation Foundations
Hours: FE 0 | BE 0 | TL 4 | PM 0

- FE — (No planned hours)
  - Goal: Support TL with component examples if requested.

- TL — Design system foundations
  - Goal: Publish initial component usage and contribution guidelines.
  - Scope:
    - Document core components, states, and contribution flow
  - Acceptance criteria:
    - Docs discoverable; reviewed by engineers
  - Validation:
    - Walkthrough with FE/BE reps

- BE — (No planned hours)
  - Goal: Support TL on documentation if needed.

- PM — (No planned hours)
  - Goal: Track sign-off and share with team.


---

## Sprint 6 Task Breakdown (Admin & Email Infrastructure)

Two-week sprint delivering admin management, campaign moderation, email infrastructure, and runbooks. Hours per role align with the sprint schedule.

## ADMIN-002: Manage Users
Hours: FE 20 | BE 20 | TL 8 | PM 8

- FE — Admin user management UI
  - Goal: Provide searchable, sortable user list with view/edit controls.
  - Scope:
    - List with filters; user detail; role toggle where permitted
  - Acceptance criteria:
    - Edits persist; permissions enforced in UI
  - Validation:
    - Demo: filter, view, edit

- TL — Admin permissions and safety
  - Goal: Define admin capabilities and guardrails.
  - Scope:
    - Role definitions; audit logging requirements
  - Acceptance criteria:
    - Rules documented; enforced by BE
  - Validation:
    - Spot-check sensitive actions

- BE — User admin endpoints
  - Goal: Provide list/detail/update endpoints with role enforcement.
  - Scope:
    - Filtered search; update with audit trail
  - Acceptance criteria:
    - Protected; rejects unauthorized edits
  - Validation:
    - Unit: authorization; Integration: edit flow

- PM — QA & audit review
  - Goal: Validate flows and audit visibility.
  - Scope:
    - Checklist including role edge cases
  - Acceptance criteria:
    - No P1s; audit meets needs
  - Validation:
    - Execute checklist

## ADMIN-003: Manage Organizations
Hours: FE 12 | BE 12 | TL 4 | PM 4

- FE — Org admin UI
  - Goal: Allow admins to view and manage orgs (status, flags).
  - Scope:
    - List/detail; status changes (active/suspended)
  - Acceptance criteria:
    - Changes reflected immediately
  - Validation:
    - Demo: suspend/reactivate

- TL — Org governance rules
  - Goal: Define statuses and triggers for admin action.
  - Scope:
    - Status lifecycle; risk flags
  - Acceptance criteria:
    - Rules documented and applied
  - Validation:
    - Spot checks

- BE — Org admin endpoints
  - Goal: Provide list/detail/update with auditing.
  - Scope:
    - Status updates; audit entries
  - Acceptance criteria:
    - Protected actions; audit recorded
  - Validation:
    - Integration: status changes reflected

- PM — QA
  - Goal: Validate status flows.
  - Scope:
    - Checklist
  - Acceptance criteria:
    - No blockers
  - Validation:
    - Execute

## ADMIN-005: Manage & Suspend Campaigns
Hours: FE 12 | BE 12 | TL 4 | PM 4

- FE — Campaign moderation UI
  - Goal: Allow admins to view campaigns and suspend/reactivate.
  - Scope:
    - List/detail; action buttons; reason capture
  - Acceptance criteria:
    - Actions reflect immediately; reasons visible to orgs
  - Validation:
    - Demo: suspend/reactivate

- TL — Moderation policy
  - Goal: Define criteria and escalation process.
  - Scope:
    - Reasons catalog; notification requirements
  - Acceptance criteria:
    - Policy published; aligns with UI/BE
  - Validation:
    - Review meeting

- BE — Campaign moderation endpoints
  - Goal: Provide suspend/reactivate with notifications and audit.
  - Scope:
    - Update status; notify org; record audit
  - Acceptance criteria:
    - State changes applied; notifications sent
  - Validation:
    - Integration: verify notification & audit

- PM — QA
  - Goal: Validate admin moderation workflows.
  - Scope:
    - Checklist and test data
  - Acceptance criteria:
    - No P1s
  - Validation:
    - Execute

## EMAIL-010: Email Infrastructure & Deliverability
Hours: FE 8 | BE 32 | TL 20 | PM 8

- FE — Transactional email triggers (minimal)
  - Goal: Ensure frontend events trigger necessary transactional emails.
  - Scope:
    - Wire callouts for signup confirmation and message confirmations
  - Acceptance criteria:
    - Emails triggered at expected moments; no duplicates
  - Validation:
    - Demo: signup and message send

- TL — Email domain and policies
  - Goal: Establish deliverability and safety.
  - Scope:
    - Domain warm-up plan; DKIM/SPF; bounce/complaint handling policy
  - Acceptance criteria:
    - Domain authenticated; policies documented
  - Validation:
    - Review DNS/auth status; webhook reception

- BE — Email send and webhook ingestion
  - Goal: Send transactional emails and capture delivery/bounce/complaint events.
  - Scope:
    - Send functions for key emails; webhook endpoint for events; delivery status updates
  - Acceptance criteria:
    - Events update message status; retries handled per policy
  - Validation:
    - Integration: simulate events; verify status updates

- PM — QA & inbox tests
  - Goal: Validate email content and deliverability.
  - Scope:
    - Seeded inbox tests across providers; content proof
  - Acceptance criteria:
    - Acceptable inbox placement; approved copy
  - Validation:
    - Test run and sign-off

## DOC-002: Technical Runbooks & Deployment Guides
Hours: FE 0 | BE 4 | TL 8 | PM 0

- FE — (No planned hours)
  - Goal: Support TL if UI notes are needed.

- TL — Runbooks and deployment guides
  - Goal: Publish standard operating procedures for environments and deploys.
  - Scope:
    - Topology; deploy/rollback; env vars; onboarding checklist
  - Acceptance criteria:
    - Docs reviewed; accessible to team
  - Validation:
    - Walkthrough with BE/PM

- BE — Review and contribute
  - Goal: Validate accuracy and fill backend sections.
  - Scope:
    - Review and update BE-specific steps
  - Acceptance criteria:
    - Backend steps complete and accurate
  - Validation:
    - Review sign-off

- PM — (No planned hours)
  - Goal: Track publication and distribute links.


---

## Sprint 7 Task Breakdown (Subscriptions, Performance, Testing, Emails, Support)

Two-week sprint focused on admin subscriptions, performance tuning, cross-browser QA, key transactional emails, and support content. Hours per role align with the sprint schedule.

## ADMIN-004: Manage Subscriptions & Payments
Hours: FE 20 | BE 20 | TL 8 | PM 8

- FE — Admin subscription tools
  - Goal: Provide admin views to search and view subscriber status.
  - Scope:
    - Search by email; view plan/status/history; links to user
  - Acceptance criteria:
    - Accurate status display; navigation to user/account
  - Validation:
    - Demo with seeded subscriptions

- TL — Finance data guardrails
  - Goal: Define what admins can view and export.
  - Scope:
    - PII limits; export policy
  - Acceptance criteria:
    - Policy documented; enforced in UI/BE
  - Validation:
    - Review with stakeholders

- BE — Subscription admin endpoints
  - Goal: Provide listing/detail endpoints for subscriptions with secure access.
  - Scope:
    - Query by email/status; return latest invoice and plan
  - Acceptance criteria:
    - Protected; accurate state
  - Validation:
    - Integration: sample queries

- PM — QA
  - Goal: Validate admin flows.
  - Scope:
    - Checklist for lookups and navigation
  - Acceptance criteria:
    - No P1s
  - Validation:
    - Execute

## PERF: Performance Optimization
Hours: FE 20 | BE 20 | TL 20 | PM 8

- FE — Client performance passes
  - Goal: Improve first load and interactions for key pages.
  - Scope:
    - Audit and remediate top pages (home, bill, compose)
  - Acceptance criteria:
    - Meet performance budgets for FCP/TTI on target devices
  - Validation:
    - Before/after metrics documented

- TL — Performance budget and review
  - Goal: Set explicit budgets and verify adherence.
  - Scope:
    - Budgets per key page; review changes for regressions
  - Acceptance criteria:
    - Budgets published; sign-off on improvements
  - Validation:
    - Metrics review meeting

- BE — API latency improvements
  - Goal: Reduce tail latencies and response sizes.
  - Scope:
    - Identify hotspots; add caching or indexes; reduce payloads
  - Acceptance criteria:
    - Key endpoints meet latency targets at P95
  - Validation:
    - Before/after charts and sampling

- PM — Coordination and tracking
  - Goal: Coordinate perf work and report progress.
  - Scope:
    - Track tasks and metrics; share weekly update
  - Acceptance criteria:
    - Progress doc circulated
  - Validation:
    - Update sent

## TEST: Cross-Browser & Mobile Testing
Hours: FE 12 | BE 0 | TL 0 | PM 20

- FE — Browser/device fixes
  - Goal: Identify and address layout/function issues on target matrix.
  - Scope:
    - Execute test matrix; file/resolve FE bugs
  - Acceptance criteria:
    - High-priority issues fixed or triaged
  - Validation:
    - Matrix completed; bug list maintained

- TL — (No planned hours)
  - Goal: Available for consultation as needed.

- BE — (No planned hours)
  - Goal: Available for consultation as needed.

- PM — Test execution and sign-off
  - Goal: Drive cross-browser/mobile QA to completion.
  - Scope:
    - Define matrix; execute tests; track defects
  - Acceptance criteria:
    - Matrix completed; sign-off recorded
  - Validation:
    - Checklist and bug triage

## EMAIL-001: Account Creation & Verification
Hours: FE 4 | BE 12 | TL 0 | PM 4

- FE — Trigger points and confirmations
  - Goal: Ensure account creation triggers verification and on-screen confirmations.
  - Scope:
    - Wire triggers and confirmations on signup
  - Acceptance criteria:
    - Visible confirmation; email sent once per request
  - Validation:
    - Demo: signup flow

- TL — (No planned hours)
  - Goal: Available for consultation as needed.

- BE — Verification email send
  - Goal: Send verification emails and record state changes.
  - Scope:
    - Send function and status updates; handle resend requests with limits
  - Acceptance criteria:
    - Status reflects verified/unverified accurately
  - Validation:
    - Integration: send/resend flows

- PM — QA
  - Goal: Validate end-to-end verification UX.
  - Scope:
    - Checklist
  - Acceptance criteria:
    - No blockers
  - Validation:
    - Execute

## EMAIL-002: Advocacy Message Confirmations
Hours: FE 0 | BE 8 | TL 0 | PM 4

- FE — (No planned hours)
  - Goal: Confirm on-screen messages provide clear confirmation ID.

- TL — (No planned hours)
  - Goal: Available for consultation as needed.

- BE — Send confirmation emails
  - Goal: Send confirmation email with message details and ID.
  - Scope:
    - Send function and templating; error handling
  - Acceptance criteria:
    - Email sent once; includes confirmation number
  - Validation:
    - Integration: send and template rendering

- PM — QA
  - Goal: Validate email receipt and content.
  - Scope:
    - Seeded inbox testing
  - Acceptance criteria:
    - Content approved; email arrives reliably
  - Validation:
    - Checklist

## DOC-003: Support Content & QA Checklists
Hours: FE 0 | BE 0 | TL 0 | PM 12

- FE — (No planned hours)
  - Goal: Provide feedback on clarity if asked.

- TL — (No planned hours)
  - Goal: Review for technical accuracy.

- BE — (No planned hours)
  - Goal: Review for API accuracy.

- PM — Support docs and QA checklists
  - Goal: Publish help center articles and regression suites.
  - Scope:
    - Author core support articles; compile QA checklists across flows
  - Acceptance criteria:
    - Docs published and shared; QA suites complete
  - Validation:
    - Review & sign-off


---

## Sprint 8 Task Breakdown (Security, Bug Bash, Launch)

Two-week sprint focused on final security hardening, bug fixes and polish, and launch readiness. Hours per role align with the sprint schedule.

## SEC: Security Review & Hardening
Hours: FE 0 | BE 12 | TL 20 | PM 8

- FE — (No planned hours)
  - Goal: Apply minor UI hardening fixes identified by review.

- TL — Security assessment and fixes
  - Goal: Complete security review and drive remediation plan.
  - Scope:
    - Threat model review; secrets and permissions audit; rate-limit and abuse scenarios; dependency review
  - Acceptance criteria:
    - Findings documented with owners and due dates; high/critical remediated
  - Validation:
    - Sign-off meeting

- BE — Hardening implementation
  - Goal: Implement prioritized fixes and tighten configurations.
  - Scope:
    - Address auth/session issues; logging and monitoring; least-privilege for services
  - Acceptance criteria:
    - All high/critical issues addressed; monitoring in place
  - Validation:
    - Post-fix verification and logs review

- PM — Tracking and communication
  - Goal: Track risks and updates; communicate status.
  - Scope:
    - Create tracker; coordinate sign-offs
  - Acceptance criteria:
    - Tracker current; sign-offs captured
  - Validation:
    - Review updates and confirmations

## BUGS: Bug Fixes & Polish
Hours: FE 20 | BE 20 | TL 8 | PM 20

- FE — UI/UX polish and bug fixes
  - Goal: Resolve high-priority usability and visual issues.
  - Scope:
    - Address prioritized bug list; small UX refinements; accessibility touch-ups
  - Acceptance criteria:
    - P1/P2 bugs closed or deferred with justification
  - Validation:
    - Before/after visuals; accessibility spot checks

- TL — Triage and code review focus
  - Goal: Drive fast review cycles and steady merges.
  - Scope:
    - Daily triage; review SLAs; merge health tracking
  - Acceptance criteria:
    - Review SLAs met; no large stale PRs
  - Validation:
    - Review dashboard

- BE — Backend fixes and stability
  - Goal: Resolve backend bugs and improve resilience.
  - Scope:
    - Fix prioritized issues; improve logging; tune retries
  - Acceptance criteria:
    - Error rate and latency meet targets
  - Validation:
    - Metrics before/after

- PM — Bug bash coordination
  - Goal: Coordinate bug bash and drive closure.
  - Scope:
    - Run bug bash; track owners and ETAs; manage scope
  - Acceptance criteria:
    - Target list addressed; stakeholders aligned
  - Validation:
    - Bug bash report

## LAUNCH: Launch Preparation
Hours: FE 0 | BE 8 | TL 20 | PM 12

- FE — (No planned hours)
  - Goal: Assist with last-minute UI checks as needed.

- TL — Launch checklist and go/no-go
  - Goal: Prepare and run launch plan.
  - Scope:
    - Final checklist; monitoring on-call; rollback plan; incident response contacts
  - Acceptance criteria:
    - Checklist approved; on-call schedule set; rollback validated
  - Validation:
    - Dry run sign-off

- BE — Final deployment and smoke tests
  - Goal: Produce final build, deploy, and verify smoke tests.
  - Scope:
    - Final deployment to production; smoke test results recorded
  - Acceptance criteria:
    - All critical smoke tests pass
  - Validation:
    - Smoke test report

- PM — Comms and support readiness
  - Goal: Coordinate launch communications and support coverage.
  - Scope:
    - Stakeholder comms; support rota; help content final check
  - Acceptance criteria:
    - Comms sent; support coverage confirmed
  - Validation:
    - Comms copies and support rota published
