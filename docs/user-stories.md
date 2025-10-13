# User Stories & Success Criteria

This document outlines the user stories and success criteria for all personas in the advocacy platform, organized by page template.

**Version:** 2.2
**Last Updated:** 2025-10-13

---

## Table of Contents

1. [Regular User Stories](#regular-user-stories)
   - [Homepage](#homepage)
   - [Policy Issue Pages](#policy-issue-pages)
   - [Bill Pages](#bill-pages)
   - [News Pages](#news-pages)
   - [Organization Pages](#organization-pages)
   - [Advocacy & Messaging](#advocacy--messaging)
   - [User Dashboard](#user-dashboard)
   - [Account & Settings](#account--settings)
   - [Premium Membership](#premium-membership)
2. [Organization User Stories](#organization-user-stories)
3. [Admin User Stories](#admin-user-stories)
4. [Documentation & Support](#documentation--support)

---

## Regular User Stories

### Homepage
**Page:** `/` (Homepage)

#### US-001: View Home Feed with Filters
**As a** user
**I want to** view a personalized feed with filterable content
**So that** I can discover relevant bills, news, and campaigns

**Acceptance Criteria:**
- **Popular Bills Strip:** Horizontal scroll showing most active bills across all categories
- **About/Activity Section:**
  - Not logged in: "What is eGutenbergPress?" card with Get Started CTA
  - Logged in: User's advocacy activity summary (messages, follows, engagement)
- **Info Grid (3 columns):**
  - Column 1: About/Activity card
  - Column 2: My Federal Representatives, My Local Representatives (horizontal scroll)
  - Column 3: "Take Action Together" (campaigns), "Act Before the Vote" (federal bills), "Important bills in [State]" (state bills)
- **Filterable Feed with Tabs:**
  - **For You** (logged-in default): Mixed personalized feed (news, campaigns, bills)
    - Premium: Weighted by political view ratings (Far Left to Far Right)
    - Free: Basic personalization (followed orgs, watched bills)
  - **News:** News story cards with "Voice Opinion" CTA
  - **Campaigns:** Campaign cards with "Take Action" CTA
  - **Bills:** Bill action cards with "Watch" and "Take Action" CTAs
  - Anonymous users: Default to "News" tab with popular content
- Infinite scroll/pagination per tab
- Selected filter persists during session

**How It Works:**
- Federal bills from Congress.gov, state bills from LegiScan
- Content categorized into 20 policy areas
- Anonymous: Sorted by engagement (support/oppose counts)
- Logged-in: Prioritized by interests, followed orgs, watched bills
- Premium: Weighted by political view settings per policy area

---

### Policy Issue Pages
**Page:** `/issues/{policy-slug}` (e.g., `/issues/climate-energy-and-environment`)

#### US-002: Browse Policy-Specific Content
**As a** user
**I want to** view all content for a specific policy issue
**So that** I can focus on issues I care about

**Acceptance Criteria:**
- Page title: "{Policy Category} News & Action"
- "← All Issues" back button
- **Top Section (3 columns):**
  - Column 1: US Map showing user's state (if zip provided)
  - Column 2: Top 2-3 news stories for this policy
  - Column 3: "Take Action Together" (campaigns), "Act Before the Vote" (federal bills), "Important bills in [State]" (state bills)
- **Filterable Feed:** Same tabs as homepage (For You, News, Campaigns, Bills)
  - All content filtered to selected policy category
  - Premium users: Personalized by policy-specific political view
  - Free users: Basic personalization

**Technical Requirements:**
- Map Congress.gov policy areas → 20 site categories
- Map LegiScan subjects → 20 site categories
- Separate API endpoints: `/api/feed/{filter}?policy={slug}`
- Static routes for all 20 categories at build time
- Cache policy-specific feeds for 1 hour
- SEO: Dynamic metadata per policy

---

#### US-003: Browse Federal Bills by Category
**As a** user
**I want to** browse recent federal legislation by policy issue
**So that** I can stay informed about Congress

**Acceptance Criteria:**
- Bills grouped by policy issue categories
- Bills show: Title, Number, Latest Action Date and Text
- Filter by checkboxes (select multiple policy issues)
- Selected filters display as removable badges
- Bill count per category
- Sorted by most recent action date
- Limit: 20 bills per category

**How It Works:**
- Bills from Congress.gov organized by policy area
- Up to 20 most recently active bills per category
- Multiple category selection via checkboxes
- Sorted by newest activity first

---

### Bill Pages

#### US-004: View Federal Bill Details
**Page:** `/federal/bill/{congress}/{type}/{number}` (e.g., `/federal/bill/119/hr/1`)

**As a** user
**I want to** view detailed information about a federal bill
**So that** I can understand it before taking action

**Acceptance Criteria:**
- **Bill Information:** Full title, number, congress, sponsors/cosponsors
- **Status & Actions:** Current status, latest action, policy area, subjects
- **Related:** Related bills, amendments
- **AI Content:** Plain-language summary, "Support" and "Oppose" arguments
- **Full Text:** Links to PDF/HTML from Congress.gov
- **Voting Record:** If bill has been voted on
- **Active Campaigns:** Organization campaigns related to this bill
- **Action Buttons:** "Watch" and "Take Action" CTAs

**Technical Requirements:**
- Fetch from `bills` table with relations
- Generate AI summary if not cached
- Query `campaigns` for this bill
- Cache page for 1 hour

---

#### US-005: View State Bill Details
**Page:** `/state/{state}/bill/{bill-id}` (e.g., `/state/ca/bill/AB123`)

**As a** user
**I want to** view state legislation details
**So that** I can engage with local issues

**Acceptance Criteria:**
- Bill info: Title, number, sponsor, latest action, status
- Chamber, subject, status filters
- Link to full text on state legislature website
- LegiScan API integration

**Technical Requirements:**
- Store in `state_bills` table
- Sync from LegiScan daily
- Filter by user's state from profile

---

### News Pages

#### US-006: View Grouped News Story
**Page:** `/news/{story-id}` (or similar)

**As a** user
**I want to** see news stories grouped when multiple outlets cover the same event
**So that** I can understand different perspectives

**Acceptance Criteria:**
- When multiple sources report same story, grouped into single card on feed
- Story card shows: Primary headline, "X sources" badge, main image, excerpt
- **Detail View:**
  - All source headlines with logos/names
  - Publication dates per source
  - "Read on [Source]" links to original articles
  - **AI Overview:** AI-generated summary combining all perspectives (see US-007)
  - Related bills (if applicable)
  - "Voice Your Opinion to Representatives" CTA
- Sorted by source count (more sources = higher priority)
- Visual indicator for political lean if applicable (Left, Center, Right)

**Technical Requirements:**
- Grouping algorithm: headline similarity, date proximity (48hrs), keyword overlap
- Store in `news_story_groups` table
- Junction table: `news_article_groups`
- Cache grouped story pages for 3 hours

---

#### US-007: View AI News Overview
**As a** user
**I want to** read an AI-generated news overview
**So that** I can quickly understand the story from multiple perspectives

**Acceptance Criteria:**
- **AI Overview Section:**
  - 3-5 paragraph summary synthesizing all sources
  - Key Points: 4-6 bullet points of main facts
  - Different Perspectives: Conflicting viewpoints highlighted
  - Context: Background on why this matters
  - Legislative Connection: Related bills identified
- Labeled "AI-Generated Overview" with disclaimer
- Neutral, fact-based tone
- Toggle between "Overview" and "Source Articles" tabs
- Regenerates when new sources added (max once per 6 hours)

**Technical Requirements:**
- AI: OpenAI GPT-4, Anthropic Claude, or similar
- Input: All headlines, excerpts, full text from grouped sources
- Store in `news_story_groups.ai_overview`
- Cache 6 hours
- Character limit: 800-1500 words

---

#### US-008: Take Action from News Story
**As a** user
**I want to** voice my opinion to representatives about a news story
**So that** I can engage with current events

**Acceptance Criteria:**
- "Voice Your Opinion" CTA button on news detail page
- Opens advocacy message composer with:
  - Pre-filled context: News headline and summary
  - Suggested recipients: Related bill sponsors (if applicable)
  - Default recipients: User's own representatives
  - Topic: Auto-populated from policy category
  - Position options: Support or Oppose (if applicable)
  - AI message draft option
- After sending: Confirmation and account creation prompt (if anonymous)
- Message logged with `news_story_id` reference

**Technical Requirements:**
- Store `news_story_id` in `user_messages`
- Pass story context to message composer
- AI includes news context in message generation
- Track advocacy per news story for analytics

---

### Organization Pages

#### US-009: Browse Organizations
**Page:** `/organizations` (or similar)

**As a** user
**I want to** browse advocacy organizations
**So that** I can find groups aligned with my values

**Acceptance Criteria:**
- List of all platform organizations
- Shows: Name, logo, description, focus areas, active campaigns count
- Filter by: Focus area, activity level
- Sort by: Name, active campaigns, total actions
- Each org links to profile page

**Technical Requirements:**
- Query `organizations` table
- Show `active_campaigns_count` aggregate
- Cache list for 10 minutes

---

#### US-010: View Organization Profile
**Page:** `/organizations/{org-slug}` (e.g., `/organizations/league-of-women-voters`)

**As a** user
**I want to** view an organization's public profile
**So that** I can learn about them and their campaigns

**Acceptance Criteria:**
- **Header:**
  - Name, logo
  - "Follow" button (or "Following" badge)
  - Short description/mission
  - Website and social media links
- **Organization Details:**
  - Full description
  - Nonprofit status (501c3, 501c4, etc.)
  - Years active/established
  - Policy focus areas (tags)
  - Followers count
- **Active Campaigns:**
  - All active campaigns from this org
  - Campaign cards: Bill number/title, position, reasoning preview, support/oppose counts
  - Filter by: Status (Active, Ended), Type (Legislation, Issue, Candidate)
  - Sort by: Most Recent, Most Popular
- **Impact Stats:**
  - Total messages sent
  - Total actions taken
  - Success rate (if applicable)
- Mobile responsive, SEO optimized

**Technical Requirements:**
- Query `organizations` by slug
- Aggregate: active campaigns, total actions, messages
- Join `user_followed_organizations` for "Following" status
- Cache profile for 10 minutes
- SEO: Title, description, Open Graph tags

---

#### US-011: Follow Organizations
**As a** user
**I want to** follow advocacy organizations
**So that** I can see their campaigns and receive updates

**Acceptance Criteria:**
- Click "Follow" on any organization page
- Followed orgs appear in "Following" section of dashboard
- Feed prioritizes bills from followed orgs' campaigns
- Email updates about new campaigns (if opted in)
- Can unfollow anytime

**Technical Requirements:**
- Create entry in `user_followed_organizations`
- Include in feed algorithm
- Send weekly digest emails (configurable)

**Story Points:** 3  
**Deferred to:** Post-Launch Sprint (Weeks 23-24)

---

### Advocacy & Messaging

#### US-012: Watch Bills
**Feature spans:** Bill detail pages, campaign cards, dashboard

**As a** user
**I want to** watch specific bills
**So that** I can track them in my dashboard

**Acceptance Criteria:**
- "Watch" button on bill pages and campaign cards
- Watched bills appear in dashboard "Following" section
- Shows: Title, number, latest action date/text, bill count
- Can click to view full details
- Can unwatch bills
- Premium: Full list; Free: Count only

**Technical Requirements:**
- Entry in `user_watched_bills`
- Daily cron checks for updates
- Email notifications via email service
- User configurable preferences

**Story Points:** 5  
**Deferred to:** Post-Launch Sprint (Weeks 23-24)

---

#### US-013: Send Advocacy Message - Multiple Entry Flows

**As a** visitor or user
**I want to** send advocacy messages to representatives
**So that** I can make my voice heard

**Common Flow for All Entry Points:**
- **No login required** (anonymous mode)
- Enter ZIP code → find representatives (House, both Senators)
- Select which reps to contact (all or subset)
- Write custom message or use AI to generate draft
- Include personal data fields (name, address, profession, etc.)
- Upload attachments (PDFs, images, max 5MB)
- Preview before sending
- Confirmation with tracking info
- **After sending:** "Create account to track this message?" prompt
- If account created, message linked to account

**Entry Flow 1: From Bill Detail Page**
- **Context:** Specific federal or state bill
- **Pre-filled:**
  - Subject: Bill number and title
  - Bill context (summary) included
  - Position: User selects Support or Oppose
  - Default recipients: User's representatives (House rep, both Senators)
- **Special Features:**
  - "Related Campaigns" shown if organizations have campaigns on this bill
  - AI generates message using bill summary and support/oppose arguments

**Entry Flow 2: From Campaign Card**
- **Context:** Organization campaign (bill, issue, or candidate)
- **Pre-filled:**
  - Subject: Campaign title
  - Campaign context and organization's reasoning included
  - Position: Pre-set to organization's position (Support/Oppose)
  - Default recipients: User's representatives
  - Target recipients: May be filtered by campaign (e.g., specific representatives)
- **Special Features:**
  - Organization name and logo shown
  - Organization's reasoning displayed as context
  - AI generates message aligned with campaign's position and reasoning
  - Message tracked with `campaign_id` for organization analytics

**Entry Flow 3: From News Story**
- **Context:** News story from news detail page
- **Pre-filled:**
  - Subject: News headline
  - News context (summary) included
  - Topic: Policy category from news story
  - Position: User selects Support or Oppose (if applicable)
  - Default recipients: User's representatives
- **Special Features:**
  - "Related Bills" shown if news connects to legislation
  - AI generates message referencing the news story
  - Message tracked with `news_story_id` for analytics

**Entry Flow 4: From Policy/Issue Page**
- **Context:** Specific policy category (e.g., Climate, Immigration)
- **Pre-filled:**
  - Subject: Policy category name
  - Topic: Policy category
  - Default recipients: User's representatives
- **Special Features:**
  - User can select specific bills or issues within that policy area
  - AI generates message focused on policy area
  - "Active Campaigns" shown for this policy area

**Entry Flow 5: Direct/Generic Advocacy**
- **Context:** No specific bill, campaign, or news (e.g., from homepage CTA, direct navigation)
- **Pre-filled:**
  - Nothing pre-filled
- **Flow:**
  - User enters ZIP code first
  - Select representatives to contact
  - User manually enters subject and topic
  - Write message or use AI (AI needs subject/topic input from user)
- **Special Features:**
  - Most flexible flow
  - User can optionally link to a bill, issue, or news story

**Technical Requirements:**
- Anonymous session token (UUID) for tracking
- Store in `user_messages` with `user_id` = NULL initially
- Store context: `bill_id`, `campaign_id`, `news_story_id`, `policy_category`, or NULL
- Lookup reps via `members` by ZIP/district
- AI message generation (OpenAI/Anthropic) with context-specific prompts
- Send via email (primary) and/or postal mail
- Link message after account creation via session token
- Track analytics per entry flow type

---

#### US-014: AI-Assisted Message Drafting
**As a** user drafting a message
**I want** AI to help write an effective message
**So that** I can communicate clearly

**Acceptance Criteria:**
- "Get AI Help" option when composing
- AI generates based on:
  - **Context:** Bill, campaign, news story, or policy area
  - Position (support/oppose)
  - Bill/campaign/news summary and arguments
  - User's personal info (if shared)
  - Constituent description (if provided)
- Can regenerate message
- Can edit AI-generated message
- Stays within 500-2000 words

**AI Prompt Variations by Entry Flow:**
- **From Bill:** Include bill summary, support/oppose arguments, bill status
- **From Campaign:** Include organization's reasoning, campaign position, bill context
- **From News:** Include news headline, key facts, related legislation (if applicable)
- **From Policy Area:** Focus on policy category, recent bills in that area
- **Generic:** Use subject and topic provided by user

**Technical Requirements:**
- OpenAI GPT-4 or Anthropic Claude
- Include context, bill/campaign/news data, user profile, position in prompt
- Return in < 5 seconds
- Cache for same context+position+user for 24 hours

---

### User Dashboard
**Page:** `/dashboard/*`

#### US-015: View Dashboard Overview
**As a** user
**I want to** view my advocacy activity dashboard
**So that** I can track my engagement

**Acceptance Criteria:**
- **Activity Summary:**
  - Messages sent count
  - Bills watched count
  - Organizations followed count
  - Recent advocacy messages
- **Following Section:**
  - List of watched bills with latest actions
  - List of followed organizations with new campaigns
- **Message History:**
  - Date sent, bill, recipients, position, status
  - Filter by: Date range, bill, representative, status
  - Sort by: Date, bill, representative
  - Free: Last 30 days only
  - Premium: Full history

**Technical Requirements:**
- Query `user_messages`, `user_watched_bills`, `user_followed_organizations`
- Join with `bills` and `members` for display
- Free tier: `sent_at > NOW() - 30 days`
- Paginate 20 messages per page

---

### Account & Settings

#### US-016: Verify Voter Registration (L2 Political)
**As a** user
**I want to** verify my voter registration status
**So that** I can increase message credibility

**Acceptance Criteria:**
- Prompted before first message (optional but encouraged)
- Enter: First/Last Name, Address, City, State, ZIP, Birth Year
- System queries L2 Political voter database
- Display matches: Name, Address, Party, Status
- Confirm match or manually enter if not found
- Unregistered: Link to vote.gov
- Verified badge shown on messages to representatives
- User sees basic info only (name, address, party, status)

**Technical Requirements:**
- L2 Political API (VoterMapping API) integration
- Store `voter_registration_verified` boolean in `users`
- Store `voter_registration_verified_at` timestamp
- Store `l2_voter_id` (L2's unique ID)
- **Store ALL L2 voter data in `users.l2_voter_data` JSONB** (698 variables from VM2 dataset)
- Cache lookups 30 days per user
- Privacy: Full L2 data NOT visible to user, only to org reports (anonymized aggregates)

**L2 Data Stored (Complete VM2 Dataset - 698 variables):**
Reference: https://www.l2-data.com/datamapping/voter-data-dictionary/

**Key Categories:**
1. Identity & Registration (~50 fields): LALVOTERID, name, address, registration dates, age, gender
2. Political Affiliation (~20 fields): Party registration (current/historical)
3. Geographic & Districts (~40 fields): Congressional, state, county, city, precinct, census data
4. Voter History (~100 fields): Election participation, vote method, ballot dates, likely voter scores
5. Modeled Demographics (~200 fields): Ethnicity, race, language, religion, income, education, occupation, marital status, home ownership, children
6. Consumer & Lifestyle (~200 fields): Interests, media consumption, donations, subscriptions, vehicle, pets
7. Contact Info (~20 fields): Phone, email, DNC flags
8. Political Scores (~50 fields): Partisan scores, issue positions, turnout propensity, persuasion scores

**Usage:**
- User sees: Basic verification only
- Platform uses: Complete dataset for org demographic reports (anonymized aggregates)
- Reports: Age ranges, gender, ethnicity, districts, voting history, political scores
- Never expose individual L2 data to orgs or other users

---

#### US-017: Create Account (Post-Message Flow)
**As a** visitor who sent a message
**I want to** create an account to track my message
**So that** I can view my history and save preferences

**Acceptance Criteria:**
- Prompted AFTER sending first message
- Value proposition: "Track your messages and impact"
- Sign up with Auth0 (email/password, Google, social)
- Email verification by Auth0
- Profile created and linked to pending message
- Message associated with new account
- Redirected to dashboard showing first message
- Session established with Auth0 JWT

**Technical Requirements:**
- Auth0 authentication (OAuth2/OpenID Connect)
- Store pending messages with anonymous session token
- Link via session token after signup
- Store in PostgreSQL `users` with Auth0 user ID

---

#### US-018: Login & Password Reset
**As a** registered user
**I want to** log in or reset my password
**So that** I can access my account

**Acceptance Criteria:**
- **Login:** Auth0 Universal Login (email/password, Google, social)
- Invalid credentials: Clear error from Auth0
- Success: Redirects to dashboard or intended page
- "Remember me" extends session
- Password reset link available
- **Password Reset:** Email sent by Auth0, expires in 1 hour, Auth0 password policy

**Technical Requirements:**
- Auth0 Universal Login integration
- Auth0 JWT token with claims
- Redirect to `returnTo` parameter if provided
- Validate Auth0 JWT on backend

---

#### US-019: Update Profile & Set Location
**As a** user
**I want to** update my profile and location
**So that** I see relevant content and my advocacy is credible

**Acceptance Criteria:**
- **Profile Fields:** First/Last Name, Address, City, State, ZIP, Birth Year, Gender, Political Affiliation, Education, Profession, Military Service, Constituent Description
- **Location Detection:**
  - Anonymous/no profile address: Auto-detect ZIP from IP, prompt to confirm
  - Logged in WITH address: Extract ZIP from profile automatically
  - Logged in WITHOUT address: IP detection + manual override
  - "Change location" link on location-based content pages
  - US Map shows highlighted state
- Form validation, success confirmation

**Technical Requirements:**
- Update `users` table
- IP Geolocation API (ipapi.co, ipgeolocation.io, MaxMind GeoIP2)
- Anonymous: Store in localStorage/session cookie
- Logged-in: Extract from `users.address` or `zip_code`
- Don't store IP addresses, only detected ZIP
- Cache geolocation in session

---

### Premium Membership
**Page:** `/membership/*`

#### US-020: View & Subscribe to Premium Membership
**As a** user
**I want to** see membership options and upgrade
**So that** I can access premium features

**Acceptance Criteria:**
- **Membership Page:**
  - Comparison: Free vs Premium
  - Premium benefits:
    - Support the organization
    - Unlimited message history (free: 30 days only)
    - Advocacy impact analytics
    - Customized feed by policy interests
    - Email digest options (daily, weekly, monthly)
  - Pricing: $6/quarter ($24/year)
  - FAQs
- **Subscription Flow:**
  - Complete profile if not already done
  - Enter payment via Stripe Elements
  - Accept terms and conditions
  - First payment charged immediately
  - Recurring quarterly
  - Confirmation email with receipt

**Technical Requirements:**
- Stripe integration (Checkout or Elements)
- Create Stripe Customer and Subscription (quarterly interval)
- Store subscription ID in `user_subscriptions`
- Set `membership_tier` = 'premium' in `users`
- Set `membership_start_date` = NOW()
- Stripe webhooks: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`

---

#### US-021: Manage Subscription
**As a** premium user
**I want to** manage my subscription
**So that** I can update payment info or cancel

**Acceptance Criteria:**
- View: Status (active, past due, canceled), next billing date/amount
- Update payment method (credit card)
- View payment history
- Cancel subscription (takes effect at end of billing period)
- Confirmation emails for changes

**Technical Requirements:**
- Stripe Customer Portal link, OR custom UI:
  - GET /subscriptions/:id
  - POST /payment_methods
  - DELETE /subscriptions/:id
- Show Stripe `invoices` for payment history
- Handle `customer.subscription.deleted` webhook

---

#### US-022: Set Political Views by Policy Area (Premium)
**As a** premium user
**I want to** set my political perspective per policy area
**So that** my messages are tailored to my views

**Acceptance Criteria:**
- Set overall political view: Far Left, Center Left, Center/Moderate, Center Right, Far Right
- Set view for each of 20 policy areas (same spectrum)
- Slider interface with 5 positions
- Can click position labels to jump
- Premium-only (free users: upgrade prompt)

**Technical Requirements:**
- Store in `users.overall_view` and `users.policy_interests`
- Each policy: 0-4 (0=Far Left, 4=Far Right)
- Default: 2 (Center/Moderate)

---

#### US-023: Customized Feed & Email Digest (Premium)
**As a** premium user
**I want** my feed to match my interests and receive email digests
**So that** I stay informed on issues I care about

**Acceptance Criteria:**
- **Customized Feed:**
  - Shows bills from subjects matching user interests (high first)
  - Includes followed orgs and watched bills
  - Excludes already acted on bills (unless followed)
  - Refreshes daily
  - Can toggle to "All Bills" view
- **Email Digest:**
  - Enable/disable digests
  - Frequency: Daily, Weekly, Monthly
  - Select topics (based on policy interests)
  - Content: New bills, watched bill updates, new campaigns
  - Unsubscribe link in footer
  - Preview in settings

**Technical Requirements:**
- Query `bills` by `policy_area` matching interests
- Join `user_watched_bills`, `user_followed_organizations`
- Weight by interest level (high=3, medium=2, low=1)
- Cache personalized feed 1 hour per user
- Store preferences in `user_email_preferences`
- Cron jobs for daily/weekly/monthly digests

---

#### US-024: View Advocacy Impact Analytics (Premium)
**As a** premium user
**I want to** see analytics on my advocacy
**So that** I can measure my impact

**Acceptance Criteria:**
- Dashboard shows:
  - Total messages sent
  - Bills engaged with (supported/opposed)
  - Representatives contacted (unique count)
  - Engagement over time (chart)
  - Impact score (based on bill outcomes)
  - Success rate (supported bills that became law)
  - Effectiveness score (alignment with outcomes)
- Filter by date range
- Export as CSV

**Technical Requirements:**
- Aggregate from `user_messages`, `campaign_actions`
- Calculate success rate from bill status tracking
- Charts with Recharts library
- CSV export

---

## Organization User Stories

Organization users are staff members of advocacy groups who access the `/partners` portal to manage campaigns.

### Partners Dashboard & Account
**Page:** `/partners/*`

#### ORG-001: Organization Login & Team Management
**As an** organization staff member
**I want to** log in and manage team members
**So that** we can collaborate on campaigns

**Acceptance Criteria:**
- **Login:**
  - User has `role` = 'organization' in database
  - Same login flow as regular users
  - Redirects to `/partners` dashboard after login
  - Can only access authorized organizations
  - Can switch between orgs if member of multiple
- **Invite Team Members:**
  - Org admin can send email invites
  - Invite includes signup link with org pre-selected
  - Set permission: Admin or Editor
  - Admin: Manage campaigns and settings; Editor: Campaigns only
  - Invite expires after 7 days
  - Invited user auto-added to org on signup

**Technical Requirements:**
- Check `user_organizations` for org access
- Store selected org in session
- Middleware restricts `/partners` to org users
- Store invites in `organization_invitations`
- Send invite email with secure token
- Create `user_organizations` entry after signup

---

### Organization Profile
**Page:** `/partners/settings` or `/partners/profile`

#### ORG-002: View & Edit Organization Profile
**As an** org admin
**I want to** view and edit our profile
**So that** we have accurate public information

**Acceptance Criteria:**
- **View Profile:**
  - Shows: Name, logo, description, website, nonprofit status, years active
  - Shows: Active campaigns count, total supporters, policy focus areas
  - Link to public profile page
- **Edit Profile:**
  - Update: Name, logo (upload PNG/JPG max 2MB), description, website
  - Update: Nonprofit status, focus areas, social media links
  - SEO: Meta description for org page
  - Changes reflected immediately on public page

**Technical Requirements:**
- Query `organizations` table
- Aggregate `campaigns` for count
- Aggregate `campaign_actions` for supporters
- Upload logo to cloud storage (AWS S3, Cloudinary)
- Invalidate cache for org page

---

### Campaign Management
**Page:** `/partners/campaigns/*`

#### ORG-003: Create Campaign (Bill, Issue, or Candidate)
**As an** org user
**I want to** create campaigns for bills, issues, or candidates
**So that** we can mobilize supporters

**Acceptance Criteria:**
- **Campaign Dates (Required):**
  - Start Date: Campaign begins (required)
  - End Date: Campaign ends (required)
  - End date must be after start date
  - Campaign only visible to users between start and end dates
- **Federal Bill Campaign:**
  - Search bill by number or keyword
  - Select bill from results
  - Set position: Support or Oppose
  - Write reasoning (markdown supported)
  - Custom CTA button text
  - Set start and end dates (required)
  - Upload campaign image (optional)
  - Status: Draft, Active, Paused, Ended
  - If Active: Appears on bill detail page for all users
- **State Bill Campaign:**
  - Same as federal but select state first
  - Uses LegiScan data
- **Issue Campaign:**
  - Type: "Issue Campaign"
  - Set: Issue title, description, policy area
  - Write advocacy message template
  - Set start and end dates (required)
  - Target representatives: All, or filter by state/party
  - Appears on homepage and org page
- **Candidate Campaign:**
  - Type: "Candidate Campaign"
  - Enter both candidates: Name, Bio/Description
  - Select which candidate org supports
  - Set position: Support (endorsed) or Oppose (other candidate)
  - Write reasoning (markdown)
  - Set start and end dates (required)
  - Custom CTA, campaign image, status
  - Displays with both candidates and org endorsement
  - If Active: Appears on org campaign list

**Technical Requirements:**
- Search `bills` or `state_bills` table
- Create in `campaigns` table
- Federal: `organization_id`, `bill_id`, `position`, `reasoning`, `status`, `image_url`, `cta_text`, `start_date`, `end_date`
- State: Use `state_bill_id` instead of `bill_id`
- Issue: `campaign_type` = 'issue', `target_criteria` JSONB, `start_date`, `end_date`
- Candidate: `campaign_type` = 'candidate', `candidate` JSONB with `candidate1Name`, `candidate1Bio`, `candidate2Name`, `candidate2Bio`, `selectedCandidate`, `start_date`, `end_date`
- Publish to feed if status = 'Active' AND current date between start_date and end_date
- Validate: end_date > start_date

---

#### ORG-004: Edit & Pause Campaigns
**As an** org user
**I want to** edit or pause campaigns
**So that** we can update messaging or temporarily halt campaigns

**Acceptance Criteria:**
- **Edit:**
  - Can edit: Position, reasoning, CTA text, image, status, start date, end date
  - Cannot edit: Bill (must create new campaign)
  - Changes reflected immediately
  - Edit history logged (who, when, what)
- **Pause Campaign:**
  - "Campaign Status" section shows current status (Active or Paused)
  - "Pause Campaign" button (red/destructive) when active
  - "Resume Campaign" button (primary) when paused
  - Confirmation dialog before pausing or resuming
  - Paused campaigns:
    - Hidden from public listings and bill detail pages
    - Cannot receive new actions
    - Existing actions and data preserved
    - Organization can still view analytics
    - Can resume anytime
  - Status updates immediately via API
  - Success notification after pause/resume
- **Delete:**
  - Confirmation dialog (deletion permanent)
  - Removed from all public listings
  - Historical data preserved (messages, actions)
  - User actions disassociated but not deleted

**Technical Requirements:**
- Update `campaigns` table
- Pause: Set `campaigns.isPaused` = true
- Resume: Set `campaigns.isPaused` = false
- Public queries: WHERE `status` = 'active' AND `isPaused` = false AND NOW() BETWEEN `start_date` AND `end_date`
- API endpoint: PUT `/api/campaigns/:id` with `isPaused` field
- Log in `campaign_edit_history`
- Invalidate campaign page cache
- Soft delete: Set `deleted_at` timestamp
- Exclude deleted from queries
- Keep `campaign_actions` for historical reporting

---

### Campaign Sharing & Distribution

#### ORG-007: Copy Campaign Link
**As an** org user
**I want to** copy a shareable campaign link
**So that** I can promote on social media and email

**Acceptance Criteria:**
- Each campaign has unique URL: `/campaigns/{org-slug}/{campaign-slug}`
- "Copy Link" button copies to clipboard
- Landing page shows campaign details and advocacy form

**Technical Requirements:**
- Generate slug from campaign title
- Store in `campaigns.slug` (unique)
- Clipboard API or fallback for older browsers

---

### Campaign Analytics
**Page:** `/partners/campaigns/{id}/analytics`

#### ORG-005: View Campaign Performance Analytics with L2 Voter Demographics
**As an** org user
**I want to** view detailed campaign analytics with rich demographic data
**So that** I can understand who is engaging and tailor future campaigns

**Acceptance Criteria:**

**Core Metrics:**
- **Vote Counts:** Support, oppose, total actions
- **Voter Verification Rate:** Percentage of participants who are verified registered voters (via L2 Political)

**L2-Enhanced Demographics (from Voter Registration Data):**

*Note: These demographics are sourced from L2 Political's voter database for users who verified their registration (see US-016). All data shown as anonymized aggregates only.*

- **Age & Generation:**
  - Age groups (18-29, 30-49, 50-64, 65+) with percentages
  - Generation breakdown (Gen Z, Millennial, Gen X, Boomer, Silent)

- **Political Profile:**
  - Party registration (Democrat, Republican, Independent, Other) with percentages
  - Partisan score distribution (L2's Democrat/Republican likelihood scores)
  - Likely voter score distribution (High, Medium, Low propensity)
  - Voter history: General election participation rate, primary participation rate

- **Geographic Analysis:**
  - Top 5 states by participation with bar charts and percentages
  - Congressional districts represented
  - Urban/Suburban/Rural breakdown (from census data)
  - Top counties and cities

- **Education & Income (Modeled by L2):**
  - Education level (High School, Some College, Bachelor's, Graduate) with percentages
  - Estimated household income ranges

- **Professional & Employment:**
  - Top professions with bar charts (Education, Healthcare, Technology, Legal, Nonprofit, etc.)
  - Employment status distribution
  - Union membership percentage

- **Identity Demographics:**
  - Gender (Female, Male, Non-binary, No response) with percentages
  - Ethnicity/Race breakdown (modeled by L2)
  - Language preference (English, Spanish, Other)

- **Special Interest Groups:**
  - Military: Veterans, active military, military families percentages
  - First generation Americans percentage
  - Homeowner vs renter percentage
  - Presence of children in household

- **Engagement History (from L2):**
  - Political donation history (has donated before)
  - Issue interest areas (from L2's modeled interests)
  - Media consumption patterns (if available)

**Engagement Metrics (Platform-specific):**
- Message completion rate (% who completed advocacy message after voting)
- Average messages per user
- Social shares count (mocked for now)
- Repeat engagement rate (users who came back)

**Data Visualization:**
- Bar charts for all percentage-based metrics
- Heat maps for geographic distribution
- Comparison charts (e.g., your campaign vs platform average)
- Trend lines for engagement over time

**Export & Reporting:**
- Export analytics (CSV, Excel, PDF, JSON) - disabled in prototype
- Custom date range filtering
- Segment comparison (e.g., Democrats vs Republicans, Age groups)
- **Privacy:** All exports show aggregates only, never individual user data

**Data Quality Indicators:**
- Show what % of participants are verified voters (have L2 data)
- Show what % of participants provided profile information
- Indicate which demographics are modeled vs verified

**Technical Requirements:**
- Query `campaign_actions` for vote counts
- Join `users` table, access `users.l2_voter_data` JSONB field for L2 demographics
- Extract relevant L2 fields from 698-variable VM2 dataset:
  - **Identity:** Age, gender, ethnicity (modeled), language preference
  - **Political:** Party registration, partisan scores, voter history, likely voter scores
  - **Geographic:** State, county, city, congressional district, census tract
  - **Demographic:** Education (modeled), income (modeled), occupation, employment status
  - **Special:** Military status, union membership, homeownership, children present
  - **Engagement:** Donation history, issue interests, turnout propensity
- Calculate percentages and aggregates for each category
- **Privacy enforcement:**
  - Never expose individual `l2_voter_data` records
  - Only show aggregates with minimum threshold (e.g., 5+ users per segment)
  - Anonymize any potentially identifying combinations
- Display with Recharts card grids and bar charts
- Mock engagement metrics (replace with actual tracking)
- Pagination and performance optimization for large datasets
- Cache analytics results for 10 minutes

**Connection to User Verification (US-016):**
When users verify their voter registration via L2 Political, the platform stores their complete L2 voter record (698 variables) in `users.l2_voter_data` JSONB field. This enables organizations to see rich demographic insights about their campaign participants while maintaining user privacy through anonymized aggregates.

---

### Campaign Emails
**Page:** `/partners/campaigns/{id}/emails`

#### ORG-006: View Campaign Emails & Message Count
**As an** org user
**I want to** view emails sent through my campaign
**So that** I can monitor advocacy activity

**Acceptance Criteria:**
- **Overview:**
  - Total emails sent: (support + oppose counts) × 75% completion rate
  - Overall delivery rate (mocked at 87%)
  - Recent messages table: From (sender), To (rep), Date, Position
- **Filter by Demographics:**
  - Age group, political affiliation, state, profession
  - Filter panel shows count of filtered results
- Export email data (disabled in prototype)
- View individual message details

**Technical Requirements:**
- Query `user_messages` filtered by `campaign_id`
- Join `users` for demographics
- Email count: (supportCount + opposeCount) × 0.75
- Mock delivery rate (replace with actual email service data)
- Pagination for message list

---

## Admin User Stories

Admin users have elevated permissions to manage the platform, including users, organizations, and system settings.

### Admin Dashboard
**Page:** `/admin/*`

#### ADMIN-001: View Platform Overview
**As an** admin
**I want to** see high-level platform metrics
**So that** I can monitor growth and health

**Acceptance Criteria:**
- **Dashboard Metrics:**
  - Total users (all time), new users (last 30 days)
  - Premium subscribers (count), churn rate
  - Total messages sent (all time), messages (last 30 days)
  - Total campaigns (active), orgs (active)
  - MRR (Monthly Recurring Revenue)
- **Trends (last 90 days):**
  - New signups per day
  - Messages sent per day
  - Revenue per month
- Export all metrics to CSV

**Technical Requirements:**
- Aggregate from `users`, `user_subscriptions`, `user_messages`, `campaigns`, `organizations`
- Cache dashboard data for 10 minutes
- Generate charts with Recharts

---

### User Management
**Page:** `/admin/users`

#### ADMIN-002: Manage Users
**As an** admin
**I want to** view, suspend, impersonate, or delete users
**So that** I can monitor usage, troubleshoot issues, and prevent abuse

**Acceptance Criteria:**
- **User List:**
  - Paginated (50 per page)
  - Shows: Name, email, membership tier, registration date, last login
  - Filter: Membership tier, registration date range, activity status
  - Sort: Name, registration date, last login
  - Search by email or name
  - Total user count
- **User Details:**
  - Full profile, account status, membership info
  - Activity summary (messages, bills followed, orgs followed)
  - Recent messages (last 10), login history (last 10)
  - Full message history available
  - **L2 Political Data:** All voter registration data displayed directly on page (not in tabs)
    - Voter Registration section: Status, party, registration dates
    - Vote History table: Election participation records
    - Demographics section: Age, gender, ethnicity, education, income
    - Household section: Home ownership, household size, children
    - Consumer & Lifestyle section: Interests, subscriptions, donations
    - Political Engagement section: Partisan scores, likely voter scores
    - Propensity Scores section: Turnout propensity, persuasion scores
    - Contact Preferences section: Phone, email, contact flags
- **Impersonate User:**
  - "Impersonate User" button in Admin Actions card
  - Confirmation dialog with warning:
    - "You are about to view the platform as {firstName} {lastName}"
    - "You will be able to see their dashboard, messages, and all account information"
    - "This action will be logged for security purposes"
  - After confirmation: Redirected to homepage as that user
  - Can view user's dashboard, messages, followed organizations, watched bills
  - Security: All impersonation sessions logged with admin ID, user ID, timestamp
  - Exit impersonation: Link in header to return to admin view
- **Suspend User:**
  - Suspend with reason (required)
  - Suspended user cannot log in
  - Message: "Account suspended. Contact support."
  - Temporary or permanent suspension
  - Admin can unsuspend anytime
  - Logged with admin user ID and timestamp
- **Delete User:**
  - Confirmation dialog
  - Hard delete: Removes all data (preserves anonymized analytics)
  - Soft delete: Anonymizes (email=null, name="Deleted User", keeps activity)
  - Logged in audit log

**Technical Requirements:**
- Query `users` with filters, paginate 50 per page
- Join with `user_messages`, `user_watched_bills`, `user_followed_organizations`, `user_subscriptions`, `login_history`
- L2 data: Display all fields from `users.l2_voter_data` JSONB directly on page (no tabs)
- Cache total count 5 minutes
- Impersonate: Create secure session token, store in `impersonation_sessions` (admin_id, user_id, started_at, ended_at)
- Impersonation mode: Special header/banner indicating admin is viewing as user
- Log all impersonation actions in `admin_audit_log`
- Exit impersonation: Clear session token, redirect to admin panel
- Suspend: Set `users.status` = 'suspended', store `suspended_at`, `suspended_by`, `suspension_reason`, `suspension_expires_at`
- Hard delete: DELETE from `users`, CASCADE to related tables
- Soft delete: UPDATE `users` SET `email` = NULL, `first_name` = 'Deleted'
- Log in `admin_audit_log`

---

### Organization Management
**Page:** `/admin/organizations`

#### ADMIN-003: Manage Organizations
**As an** admin
**I want to** approve, suspend, or view organizations
**So that** I can manage the partner network

**Acceptance Criteria:**
- **Organization List:**
  - Shows: Name, status (pending, active, suspended), campaigns count, members count
  - Filter by status
  - Sort by: Name, campaigns count, date joined
  - Search by name
- **Approve New Org:**
  - Pending list shows: Name, description, website, EIN (tax ID), contact info
  - Approve or reject with reason
  - Approved: Access to `/partners` portal
  - Rejected: Email with reason
  - Logged in audit log
- **Suspend Org:**
  - Suspend with reason
  - Cannot create/edit campaigns
  - Existing campaigns hidden from public
  - Org users see suspension notice
  - Can unsuspend anytime
- **Org Details:**
  - Full profile, contact info, tax ID (EIN), members list
  - Campaign list (all), analytics (total actions, messages)
  - Audit history (campaign creation, edits)
  - Can edit org details

**Technical Requirements:**
- Query `organizations`, aggregate `campaigns` and `user_organizations` for counts
- Pending: `WHERE status = 'pending'`
- Update `organizations.status` to 'active' or 'rejected'
- Send notification email, log in `admin_audit_log`
- Suspend: Set `organizations.status` = 'suspended', exclude campaigns from public queries
- Join with `campaigns`, `campaign_actions`, `user_organizations` for details

---

### Payment & Subscription Management
**Page:** `/admin/subscriptions`

#### ADMIN-004: Manage Subscriptions & Payments
**As an** admin
**I want to** manage subscriptions and handle billing issues
**So that** I can support users and monitor revenue

**Acceptance Criteria:**
- **Subscription List:**
  - Shows: User name, email, plan (quarterly), status, start date, next billing
  - Shows MRR and total subscribers
  - Filter by status (active, past_due, canceled)
  - Sort by start date, next billing date
  - Search by user email
- **Subscription Details:**
  - User info, Stripe Customer ID, Stripe Subscription ID
  - Current status, start date, renewal date, cancellation date (if applicable)
  - Payment history (all invoices)
  - Failed payments and retry schedule
  - Link to Stripe dashboard
- **Issue Refund:**
  - Select specific invoice
  - Partial or full refund
  - Enter reason (required)
  - Processed via Stripe immediately
  - User receives confirmation email
  - Logged in admin audit log
- **Apply Credit:**
  - Enter credit amount and reason
  - Applied to Stripe customer account
  - Used for next invoice automatically
  - User notified
  - Logged in audit log
- **Manually Upgrade/Downgrade:**
  - Upgrade free to premium (without payment)
  - Downgrade premium to free
  - Enter reason (required)
  - Immediate effect
  - User notified
  - Logged in audit log
- **View Payment Failures:**
  - List of failed payments
  - Shows: User, amount, failure reason, retry date, attempt number
  - Filter by failure reason
  - Mark as resolved (after follow-up)
  - Send reminder email to user

**Technical Requirements:**
- Query `user_subscriptions`, join `users`
- MRR: (Active subscribers × $6) / 3 months
- Fetch Stripe Subscription and Invoice data via API
- Stripe dashboard link: `https://dashboard.stripe.com/subscriptions/{id}`
- Refund: `POST /refunds` with `charge_id` and `amount`, log in `payment_refunds`, send email, log in `admin_audit_log`
- Credit: `POST /customers/{id}/balance_transactions` with negative amount, log in `account_credits`, send email
- Manual upgrade: Update `users.membership_tier`, set `users.membership_override` = true if without Stripe, send email, log in `admin_audit_log`
- Payment failures: Query `payment_failures` (populated by Stripe webhook `invoice.payment_failed`)

---

### Campaign & Content Moderation
**Page:** `/admin/campaigns`

#### ADMIN-005: Manage & Suspend Campaigns
**As an** admin
**I want to** view, suspend, and moderate campaigns
**So that** I can monitor platform content and enforce policies

**Acceptance Criteria:**
- **Campaign Performance Table:**
  - Paginated list of all campaigns (20 per page)
  - Shows: Organization, Bill/Title, Position, Type, Created Date, Total Actions, Messages Generated, Support/Oppose counts, Engagement Rate, Status
  - Sort by: Organization, Date Created, Total Actions, Engagement Rate
  - Filter by:
    - Organization (dropdown)
    - Type: Legislation, Issue, Town Hall, Candidate, Voter Registration, Voter Poll
    - Status: All, Active, Suspended, Archived
    - Date range
  - Search by bill number or title
- **Suspend Campaign:**
  - "Suspend" button (red with ban icon) for active campaigns
  - Confirmation dialog:
    - "Are you sure you want to suspend '{campaign title}'?"
    - "This campaign will be hidden from users and no new actions can be taken"
  - After suspension:
    - Campaign hidden from all public listings
    - Status badge shows "Suspended" (red)
    - Campaign cannot receive new actions
    - Organization notified via email
    - Logged in admin audit log
- **Reactivate Campaign:**
  - "Reactivate" button (primary with play icon) for suspended campaigns
  - Confirmation dialog:
    - "Are you sure you want to reactivate '{campaign title}'?"
    - "This campaign will be visible to users again and they will be able to take actions"
  - After reactivation:
    - Campaign visible in public listings (if within date range and not paused by org)
    - Status returns to "Active"
    - Organization notified via email
    - Logged in admin audit log
- **View Campaign Details:**
  - Click "View" (external link icon) to open campaign in new tab
  - Shows full campaign as users see it
- **Filter by Status:**
  - Status dropdown includes: All Statuses, Active, Suspended, Archived
  - Updates table in real-time
- **Campaign Count:**
  - Shows: "{X} campaigns" total and "{Y} matching filters"

**Technical Requirements:**
- Query `campaigns` with joins to `organizations`, `bills`, aggregated `campaign_actions`
- Paginate 20 per page
- Suspend: Set `campaigns.admin_suspended` = true, `admin_suspended_at` = NOW(), `admin_suspended_by` = admin_id
- Public queries: WHERE `admin_suspended` = false
- Reactivate: Set `campaigns.admin_suspended` = false, `admin_suspended_at` = NULL
- Status filter: WHERE `status` = ? OR `admin_suspended` = true (for Suspended filter)
- Send notification email to organization admins
- Log all suspension/reactivation in `admin_audit_log`
- State management: Use React useState to update table dynamically

---

### Platform Analytics & Message Moderation
**Page:** `/admin/analytics`, `/admin/messages`

#### ADMIN-006: View Analytics & Moderate Messages
**As an** admin
**I want to** see advocacy analytics and moderate messages
**So that** I can monitor usage and maintain quality

**Acceptance Criteria:**
- **Advocacy Message Analytics:**
  - Paginated list of messages (most recent first, 50 per page)
  - Shows: Date, user, bill, recipients, position, delivery status
  - Filter: Date range, delivery method, status, bill
  - Search by user email or bill number
  - View full message content
  - Flag inappropriate messages
- **Flag Inappropriate Content:**
  - Flag messages with reason
  - Flagged content hidden from public
  - User notified with reason
  - Can unflag after review
  - Flag history logged

**Technical Requirements:**
- Messages: Query `user_messages`, join `users`, `bills`, `members`, paginate 50 per page
- Flag: Set `flagged` = true, `flag_reason`, `flagged_by`, `flagged_at`
- Export to CSV
- Flag excludes from public: WHERE `flagged` = false

---

### System Configuration
**Page:** `/admin/settings`

#### ADMIN-007: Manage System Settings
**As an** admin
**I want to** configure system settings and integrations
**So that** the platform runs correctly

**Acceptance Criteria:**
- **API Integrations:**
  - View/edit API keys: Congress.gov, LegiScan, Census, FEC, OpenAI, Stripe
  - Test API connections
  - View API usage stats and rate limits
  - Enable/disable specific integrations
  - Changes logged in audit log
- **System Logs:**
  - Recent errors (last 1000)
  - Shows: Timestamp, error type, message, stack trace, user (if applicable)
  - Filter by error type, date range
  - Search by error message
  - Export logs (paginate 100 per page)
- **Email Templates:**
  - View/edit templates: Welcome, password reset, email verification, subscription confirmation, subscription failed payment, message sent confirmation, weekly digest
  - Preview email before saving
  - Supports variables: {firstName}, {resetLink}, etc.
  - Changes take effect immediately
  - Version control (edit history)
- **Audit Log:**
  - All admin actions: User suspensions, org approvals, refunds, etc.
  - Shows: Admin user, action type, timestamp, details/reason
  - Filter by admin user, action type, date range
  - Export audit log

**Technical Requirements:**
- API keys: Store in `system_settings` (encrypted)
- Test connection: Sample API call, return success/failure
- Track in `api_usage_logs`
- Error logs: Query `error_logs` (populated by app error handlers), paginate 100 per page
- Email templates: Store in `email_templates`, use template engine (Handlebars, Mustache), version control (edit history)
- Audit log: All admin actions log to `admin_audit_log` (fields: admin_user_id, action_type, entity_type, entity_id, details JSONB, created_at)

---

## Documentation & Support

### DOC-001: Design System Documentation Foundations
**As a** design system owner  
**I want to** capture component usage, interaction patterns, and accessibility notes  
**So that** engineers and designers can implement UI consistently during development

**Acceptance Criteria:**
- Provides source-of-truth documentation for every component used through Sprint 5 (buttons, inputs, navigation, cards, tables, charts)
- Includes interaction states (default, hover, focus, disabled) and accessibility guidance (ARIA roles, color contrast checks)
- Links to Figma component library and code counterparts (shadcn/ui, custom components)
- Publishes contribution guidelines (naming conventions, review checklist, change request process)
- Versioned in Notion or Confluence with TL sign-off and change log

**Story Points:** 2  
**Sprint:** 5

---

### DOC-002: Technical Runbooks & Deployment Guides
**As a** tech lead  
**I want to** maintain up-to-date runbooks for deployments and infrastructure  
**So that** the engineering team can operate the platform confidently during launch

**Acceptance Criteria:**
- Documents staging and production environment topology (services, data stores, monitoring)
- Provides deployment runbooks covering automated deploys (CI/CD) and manual rollback procedures
- Lists all environment variables, secrets management steps, and rotation cadence
- Includes onboarding checklist for new engineers (tooling access, local setup, testing standards)
- Reviewed by backend engineer; stored with version control (Git or shared drive) and accessible to the whole team

**Story Points:** 3  
**Sprint:** 6

---

### DOC-003: Support Content & QA Checklists
**As a** project manager  
**I want to** publish support documentation and regression test suites  
**So that** customer support and QA can resolve issues quickly during launch

**Acceptance Criteria:**
- Creates help center articles for top launch scenarios: account verification, billing issues, campaign setup, messaging troubleshooting
- Supplies internal admin guides (approving orgs, managing subscriptions, handling payment failures)
- Builds regression testing checklist covering critical flows (signup, messaging, payments, dashboards, admin actions)
- Establishes triage playbook for known high-risk areas with escalation paths (Slack channel, owners, SLA)
- Stores artifacts in shared workspace (Notion, Confluence, or Google Drive) with searchable tagging

**Story Points:** 3  
**Sprint:** 7

---

## Email Notification User Stories

All user personas receive email notifications for important events and updates. Email notifications are critical for engagement, retention, and platform communication.

### User Email Notifications
**Service:** Email notification system (SendGrid, AWS SES, or similar)

#### EMAIL-001: Account Creation & Verification
**As a** new user
**I want to** receive verification and welcome emails
**So that** I can confirm my account and learn about the platform

**Acceptance Criteria:**
- **Email Verification (Auth0):**
  - Sent immediately after signup
  - Subject: "Verify your email address - eGp"
  - Contains: Verification link (expires 24 hours)
  - After verification: Redirect to onboarding or dashboard
  - Retry: "Resend verification" option if not received
- **Welcome Email:**
  - Sent after email verification
  - Subject: "Welcome to eGp - Make Your Voice Heard"
  - Contains:
    - Personalized greeting with first name
    - Brief platform overview
    - Quick start guide (3-4 steps)
    - Link to profile completion
    - Link to browse issues and bills
    - "Get Started" primary CTA
  - Sent within 5 minutes of verification

**Technical Requirements:**
- Email verification: Handled by Auth0
- Welcome email: Triggered by Auth0 post-registration webhook
- Queue: Use email queue system (Bull, Agenda) for reliable delivery
- Template: HTML email with responsive design
- Personalization: {firstName}, {profileLink}, {dashboardLink}
- Tracking: Open rate, click-through rate
- Unsubscribe: Not applicable (transactional email)

---

#### EMAIL-002: Advocacy Message Confirmations
**As a** user who sent a message
**I want to** receive confirmation that my message was sent
**So that** I know my advocacy was successful

**Acceptance Criteria:**
- **Immediate Confirmation:**
  - Sent immediately after message submission
  - Subject: "Your message to {Representative Name} was sent"
  - Contains:
    - Recipient(s): Name, office, district
    - Bill/issue: Title and number (if applicable)
    - Your position: Support or Oppose
    - Message preview (first 200 characters)
    - Date sent
    - Tracking ID for reference
    - Link to view full message in dashboard
    - "Send Another Message" CTA
  - Delivery method indicated (email, postal mail, web form)
- **Account Creation Prompt (for anonymous users):**
  - If user not logged in: "Create an account to track your messages"
  - Sign up CTA with session token to link message after signup

**Technical Requirements:**
- Trigger: After successful message delivery via API
- Queue message send to prevent delays
- Template variables: {recipientName}, {billTitle}, {position}, {messagePreview}, {trackingId}, {messageLink}
- Store confirmation email status in `user_messages.confirmation_email_sent`
- Retry logic for failed sends (max 3 attempts)
- Unsubscribe: Optional preference in settings (default: enabled)

---


### Email Best Practices & Technical Implementation

#### EMAIL-010: Email Infrastructure & Deliverability
**Technical requirements for all email notifications**

**Email Service Provider:**
- Recommended: SendGrid, AWS SES, Mailgun, or Postmark
- Requirements:
  - High deliverability rate (>95%)
  - DKIM, SPF, DMARC configured
  - Dedicated IP address (for high volume)
  - Webhook support for bounce/spam reports
  - Analytics (open rate, click rate, bounces)

**Email Queue System:**
- Use job queue (Bull, Agenda, BullMQ)
- Retry logic: 3 attempts with exponential backoff
- Priority queues:
  - Critical: Verification, password reset (process immediately)
  - High: Transactional (message confirmations, payment) - 5 min max delay
  - Medium: Notifications (watched bills, campaigns) - 1 hour max delay
  - Low: Digests, reports - can batch

**Email Templates:**
- Responsive HTML design (mobile-first)
- Plain text alternative (required for deliverability)
- Template engine: Handlebars, Mjml, or React Email
- Consistent branding (logo, colors, fonts)
- Clear CTAs (buttons, not just links)
- Unsubscribe link in footer (legally required for marketing emails)
- Preference center link ("Manage email preferences")

**Personalization & Variables:**
- Common variables: {firstName}, {lastName}, {email}
- Context variables: {billTitle}, {campaignName}, {orgName}
- Links: {dashboardLink}, {billLink}, {campaignLink}, {unsubscribeLink}
- Dynamic content: Show/hide sections based on user tier or preferences

**User Preferences:**
- Preference categories stored in `user_email_preferences`:
  - `email_verified`: boolean (required for all emails)
  - `marketing_emails`: boolean (promotional content)
  - `bill_updates_enabled`: boolean, `bill_updates_frequency`: enum (immediate, daily, weekly)
  - `org_campaigns_enabled`: boolean
  - `digest_enabled`: boolean, `digest_frequency`: enum (daily, weekly, monthly)
  - `payment_emails`: boolean (always true, transactional)
- Preference center page: `/settings/email-preferences`
- One-click unsubscribe: Links in email footer, JWT token for auth

**Bounce & Spam Handling:**
- Hard bounces: Mark email invalid, disable all emails to that address
- Soft bounces: Retry 3 times over 48 hours, then mark as invalid
- Spam complaints: Immediately unsubscribe and flag account
- List cleaning: Remove invalid emails monthly

**Compliance:**
- CAN-SPAM Act: Include physical address, unsubscribe link, honor opt-outs within 10 days
- GDPR: Include data processing info, right to access/delete
- CCPA: Include privacy policy link
- Transactional vs marketing: Clearly distinguish, different unsubscribe rules

**Analytics & Monitoring:**
- Track per email type:
  - Send count
  - Delivery rate
  - Open rate
  - Click-through rate
  - Bounce rate
  - Spam complaint rate
  - Unsubscribe rate
- Alert if metrics fall below thresholds
- A/B testing for subject lines and content
- Dashboard in admin panel

**Technical Requirements:**
- Database tables:
  - `email_queue`: Queued emails awaiting send
  - `email_log`: All sent emails with status
  - `email_bounces`: Hard/soft bounces
  - `user_email_preferences`: User notification settings
  - `email_unsubscribes`: Unsubscribe events with reason
  - `email_templates`: HTML/text templates with versioning
- APIs:
  - POST `/api/emails/preferences` - Update user preferences
  - GET `/api/emails/preferences` - Get user preferences
  - POST `/api/emails/unsubscribe/:token` - One-click unsubscribe
  - POST `/api/emails/test` - Send test email (admin only)
- Webhooks:
  - Handle bounces, spam complaints, unsubscribes from ESP
  - Update `user_email_preferences` and `email_bounces`

---

## Post-Launch Phase

**Deferred Features:** These user stories have been moved to post-launch to enable a more manageable 20-week launch with balanced sprint workloads. They will be implemented after the initial launch.

### User Experience Features (Deferred)

#### US-022: Set Political Views by Policy Area (Premium)
**Story Points:** 8 pts
**Originally in:** Sprint 3
**Reason for Deferral:** Complex personalization feature not critical for initial premium offering

**As a** premium user
**I want to** set my political perspective per policy area
**So that** my messages are tailored to my views

**Acceptance Criteria:**
- Set overall political view: Far Left, Center Left, Center/Moderate, Center Right, Far Right
- Set view for each of 20 policy areas (same spectrum)
- Slider interface with 5 positions
- Can click position labels to jump
- Premium-only (free users: upgrade prompt)

**Technical Requirements:**
- Store in `users.overall_view` and `users.policy_interests`
- Each policy: 0-4 (0=Far Left, 4=Far Right)
- Default: 2 (Center/Moderate)

---

#### US-023: Customized Feed & Email Digest (Premium)
**Story Points:** 13 pts
**Originally in:** Sprint 3
**Reason for Deferral:** Complex algorithm work; basic feed sufficient for launch

**As a** premium user
**I want** my feed to match my interests and receive email digests
**So that** I stay informed on issues I care about

**Acceptance Criteria:**
- **Customized Feed:**
  - Shows bills from subjects matching user interests (high first)
  - Includes followed orgs and watched bills
  - Excludes already acted on bills (unless followed)
  - Refreshes daily
  - Can toggle to "All Bills" view
- **Email Digest:**
  - Enable/disable digests
  - Frequency: Daily, Weekly, Monthly
  - Select topics (based on policy interests)
  - Content: New bills, watched bill updates, new campaigns
  - Unsubscribe link in footer
  - Preview in settings

**Technical Requirements:**
- Query `bills` by `policy_area` matching interests
- Join `user_watched_bills`, `user_followed_organizations`
- Weight by interest level (high=3, medium=2, low=1)
- Cache personalized feed 1 hour per user
- Store preferences in `user_email_preferences`
- Cron jobs for daily/weekly/monthly digests

---

### Admin Features (Deferred)

#### ADMIN-001: View Platform Overview
**Story Points:** 8 pts
**Originally in:** Sprint 6
**Reason for Deferral:** Can use database queries directly for metrics initially

**As an** admin
**I want to** see high-level platform metrics
**So that** I can monitor growth and health

**Acceptance Criteria:**
- **Dashboard Metrics:**
  - Total users (all time), new users (last 30 days)
  - Premium subscribers (count), churn rate
  - Total messages sent (all time), messages (last 30 days)
  - Total campaigns (active), orgs (active)
  - MRR (Monthly Recurring Revenue)
- **Trends (last 90 days):**
  - New signups per day
  - Messages sent per day
  - Revenue per month
- Export all metrics to CSV

**Technical Requirements:**
- Aggregate from `users`, `user_subscriptions`, `user_messages`, `campaigns`, `organizations`
- Cache dashboard data for 10 minutes
- Generate charts with Recharts

---

#### ADMIN-006: View Analytics & Moderate Messages
**Story Points:** 13 pts
**Originally in:** Sprint 7
**Reason for Deferral:** Low initial message volume; can moderate manually

**As an** admin
**I want to** see advocacy analytics and moderate messages
**So that** I can monitor usage and maintain quality

**Acceptance Criteria:**
- **Advocacy Message Analytics:**
  - Paginated list of messages (most recent first, 50 per page)
  - Shows: Date, user, bill, recipients, position, delivery status
  - Filter: Date range, delivery method, status, bill
  - Search by user email or bill number
  - View full message content
  - Flag inappropriate messages
- **Flag Inappropriate Content:**
  - Flag messages with reason
  - Flagged content hidden from public
  - User notified with reason
  - Can unflag after review
  - Flag history logged

**Technical Requirements:**
- Messages: Query `user_messages`, join `users`, `bills`, `members`, paginate 50 per page
- Flag: Set `flagged` = true, `flag_reason`, `flagged_by`, `flagged_at`
- Export to CSV
- Flag excludes from public: WHERE `flagged` = false

---

#### ADMIN-007: Manage System Settings
**Story Points:** 8 pts
**Originally in:** Sprint 7
**Reason for Deferral:** Can configure manually via environment variables

**As an** admin
**I want to** configure system settings and integrations
**So that** the platform runs correctly

**Acceptance Criteria:**
- **API Integrations:**
  - View/edit API keys: Congress.gov, LegiScan, Census, FEC, OpenAI, Stripe
  - Test API connections
  - View API usage stats and rate limits
  - Enable/disable specific integrations
  - Changes logged in audit log
- **System Logs:**
  - Recent errors (last 1000)
  - Shows: Timestamp, error type, message, stack trace, user (if applicable)
  - Filter by error type, date range
  - Search by error message
  - Export logs (paginate 100 per page)
- **Email Templates:**
  - View/edit templates: Welcome, password reset, email verification, subscription confirmation, subscription failed payment, message sent confirmation, weekly digest
  - Preview email before saving
  - Supports variables: {firstName}, {resetLink}, etc.
  - Changes take effect immediately
  - Version control (edit history)
- **Audit Log:**
  - All admin actions: User suspensions, org approvals, refunds, etc.
  - Shows: Admin user, action type, timestamp, details/reason
  - Filter by admin user, action type, date range
  - Export audit log

**Technical Requirements:**
- API keys: Store in `system_settings` (encrypted)
- Test connection: Sample API call, return success/failure
- Track in `api_usage_logs`
- Error logs: Query `error_logs` (populated by app error handlers), paginate 100 per page
- Email templates: Store in `email_templates`, use template engine (Handlebars, Mustache), version control (edit history)
- Audit log: All admin actions log to `admin_audit_log` (fields: admin_user_id, action_type, entity_type, entity_id, details JSONB, created_at)

---

### Email Notifications (Previously Deferred)

**Note:** The following email notification stories were already in the backlog. They remain deferred to post-launch.

**Reason for Deferral:** To focus on transactional email infrastructure only at launch and defer notification emails. This saves 44 story points (EMAIL-003 through EMAIL-009) and reduces Sprint 8 complexity. Transactional emails (EMAIL-001, EMAIL-002) and infrastructure (EMAIL-010) remain in the launch plan.

**Post-Launch Priority:**
- **Post-Launch Sprint 1** (Weeks 21-22): Core Admin Features (29 pts) - ADMIN-001, ADMIN-006, ADMIN-007
- **Post-Launch Sprint 2** (Weeks 23-24): Premium Personalization (21 pts) - US-022, US-023
- **Post-Launch Sprint 3** (Weeks 25-26): Notification Email System (44 pts) - EMAIL-003 through EMAIL-009

**Total Post-Launch Story Points:** 102 points (58 pts newly deferred + 44 pts previously deferred emails)

---

### Deferred Email Notification User Stories

#### EMAIL-003: Watched Bill Updates
**As a** user watching bills
**I want to** receive notifications when bills are updated
**So that** I can stay informed on legislation I care about

**Acceptance Criteria:**
- **Bill Update Notification:**
  - Sent when watched bill has new action
  - Subject: "Update: {Bill Number} - {Latest Action}"
  - Contains:
    - Bill title and number
    - Latest action with date
    - Status change (if applicable)
    - Link to full bill details
    - Summary of change (AI-generated if major action)
    - Related campaigns (if any)
    - "View Bill" and "Take Action" CTAs
  - Delivery timing:
    - **Immediate mode:** Within 1 hour of action (premium only)
    - **Daily digest:** Once per day at 9 AM local time (free users)
    - User can choose frequency in settings
- **Multiple Bill Updates:**
  - Grouped into single email if multiple bills updated same day (digest mode)
  - Shows top 5 most significant updates, link to see all
- **Unwatch Option:**
  - Footer includes "Unwatch {Bill Number}" link
  - One-click unwatch without login

**Technical Requirements:**
- Cron job: Check `bills` for `last_action_date` changes daily (6 AM UTC)
- Match against `user_watched_bills`
- Premium: Send immediately after detecting update
- Free: Aggregate updates, send digest at user's local 9 AM (timezone from profile)
- Store last notification date in `user_watched_bills.last_notification_sent`
- Don't send duplicate notifications
- Template variables: {billNumber}, {billTitle}, {latestAction}, {actionDate}, {billLink}, {unwatchLink}
- Respect user preferences: `user_email_preferences.bill_updates_enabled`, `bill_updates_frequency`

**Story Points:** 8
**Deferred to:** Post-Launch Sprint (Weeks 21-22)

---

#### EMAIL-004: New Campaigns from Followed Organizations
**As a** user following organizations
**I want to** be notified when they launch new campaigns
**So that** I can take action on causes I support

**Acceptance Criteria:**
- **New Campaign Notification:**
  - Sent when followed org creates new campaign
  - Subject: "{Organization Name} launched a new campaign"
  - Contains:
    - Organization name and logo
    - Campaign title
    - Bill/issue: Title and number
    - Organization's position (Support/Oppose)
    - Brief reasoning (first 2-3 sentences)
    - Campaign start and end dates
    - "Take Action" primary CTA
    - "View Campaign Details" link
    - "Unfollow {Org Name}" link in footer
  - Delivery timing:
    - **Immediate mode:** Within 1 hour of campaign launch (premium)
    - **Weekly digest:** Friday 10 AM local time with all new campaigns (free)
- **Multiple Campaign Launches:**
  - Grouped digest for free users (all new campaigns from followed orgs that week)
  - Individual emails for premium users (one per campaign launch)

**Technical Requirements:**
- Trigger: After campaign created with status = 'active'
- Query `user_followed_organizations` for org followers
- Check user tier: Premium = immediate, Free = weekly digest
- Weekly digest cron: Friday 10 AM per user timezone
- Store in `campaign_notifications` to avoid duplicates
- Template variables: {orgName}, {orgLogo}, {campaignTitle}, {billTitle}, {position}, {reasoning}, {campaignLink}, {unfollowLink}
- Respect preferences: `user_email_preferences.org_campaigns_enabled`

**Story Points:** 5
**Deferred to:** Post-Launch Sprint (Weeks 21-22)

---

#### EMAIL-005: Premium Membership & Payment Emails
**As a** premium user
**I want to** receive payment confirmations and renewal notices
**So that** I can manage my subscription

**Acceptance Criteria:**
- **Subscription Confirmation:**
  - Sent after successful first payment
  - Subject: "Welcome to eGp Premium!"
  - Contains:
    - Thank you message
    - Premium benefits recap
    - Subscription details: Plan (Quarterly), price ($6), next billing date
    - Receipt/invoice link (Stripe)
    - Link to manage subscription
    - Customer support contact
- **Payment Success (Renewal):**
  - Sent after each successful renewal payment
  - Subject: "eGp Premium subscription renewed"
  - Contains:
    - Payment amount and date
    - Next billing date
    - Receipt link
    - Manage subscription link
- **Payment Failed:**
  - Sent when payment fails
  - Subject: "Action required: Payment failed for eGp Premium"
  - Contains:
    - Payment failure reason
    - Retry schedule (Stripe handles 3-4 retries over 2 weeks)
    - "Update Payment Method" CTA (primary, urgent)
    - Grace period info (access until retry period ends)
    - Customer support contact
  - Follow-up reminders: Day 3, Day 7, Day 14 (final warning)
- **Subscription Canceled:**
  - Sent when user cancels or subscription ends
  - Subject: "Your eGp Premium subscription has ended"
  - Contains:
    - Cancellation date
    - End of billing period (last day of access)
    - What you'll lose (features downgraded to free)
    - "Resubscribe" CTA
    - Feedback survey link (why did you cancel?)
- **Subscription Expiring Soon:**
  - Sent 7 days before subscription ends (if canceled but still in paid period)
  - Subject: "Your eGp Premium membership expires in 7 days"
  - Contains:
    - Expiration date
    - Premium benefits you'll lose
    - "Renew Subscription" CTA
    - Reminder: No further charges after expiration

**Technical Requirements:**
- Stripe webhooks trigger emails:
  - `checkout.session.completed` → Subscription Confirmation
  - `invoice.payment_succeeded` → Payment Success
  - `invoice.payment_failed` → Payment Failed
  - `customer.subscription.deleted` → Subscription Canceled
- Expiring soon: Cron job checks subscriptions with `cancel_at_period_end` = true
- All emails link to Stripe Customer Portal or internal `/membership` page
- Include Stripe invoice PDF link
- Store email send status in `subscription_emails`
- Unsubscribe: Not applicable (transactional, legally required)

**Story Points:** 8
**Deferred to:** Post-Launch Sprint (Weeks 21-22)

---

#### EMAIL-006: Weekly/Monthly Digest (Premium)
**As a** premium user
**I want to** receive periodic digests of activity
**So that** I stay engaged without constant notifications

**Acceptance Criteria:**
- **Digest Email:**
  - Frequency options: Daily (premium only), Weekly (default), Monthly, Never
  - Subject: "Your eGp weekly digest - {X} new bills & {Y} campaign updates"
  - Contains:
    - **New Bills in Your Interests:**
      - Top 5 most relevant bills based on policy interests
      - Each shows: Bill number, title, latest action, "View Bill" link
    - **Watched Bill Updates:**
      - All updates to watched bills this week
      - Grouped by bill
    - **New Campaigns from Followed Orgs:**
      - All new campaigns launched this week
      - Shows: Org name, bill/issue, position, "Take Action" CTA
    - **Your Activity Summary:**
      - Messages sent this week
      - Bills you engaged with
      - "View Dashboard" link
    - **Trending Bills:**
      - Top 3 most engaged bills across platform
    - **Recommended Actions:**
      - Personalized suggestions based on activity
  - Delivery time: User's local 9 AM, day depends on frequency setting
  - Skip sending if no updates (no empty digests)
- **Customization:**
  - User can toggle sections on/off
  - Can change frequency anytime in settings
  - Can unsubscribe (stops all digest emails)

**Technical Requirements:**
- Cron jobs: Daily (9 AM UTC + timezone offset), Weekly (Monday 9 AM), Monthly (1st of month 9 AM)
- Query user's interests from `users.policy_interests`
- Fetch new bills in those policy areas since last digest
- Query `user_watched_bills` for updates
- Query `user_followed_organizations` for new campaigns
- Aggregate `user_messages` for activity summary
- Store last digest sent in `user_email_preferences.last_digest_sent_at`
- Skip if no content AND `user_email_preferences.send_empty_digests` = false
- Template: Responsive design, supports sections
- Variables: {billsList}, {watchedUpdates}, {newCampaigns}, {activitySummary}, {trendingBills}
- Respect: `user_email_preferences.digest_enabled`, `digest_frequency`, `digest_sections`

**Story Points:** 8
**Deferred to:** Post-Launch Sprint (Weeks 21-22)

---

### Deferred Organization Email Notifications

#### EMAIL-007: Campaign Performance Summaries
**As an** organization user
**I want to** receive campaign performance summaries
**So that** I can track engagement without logging in daily

**Acceptance Criteria:**
- **Weekly Campaign Report:**
  - Sent every Monday at 10 AM to all org admins and editors
  - Subject: "{Organization Name} - Weekly campaign report"
  - Contains:
    - **Overview:**
      - Total actions this week across all campaigns
      - Total messages sent
      - New supporters count
      - Week-over-week growth percentage
    - **Top Performing Campaigns:**
      - Top 3 campaigns by actions this week
      - Shows: Campaign name, actions, messages, engagement rate
      - "View Analytics" link for each
    - **Active Campaigns Summary:**
      - List of all active campaigns with key metrics
      - Status indicators (on track, needs attention)
    - **Recommendations:**
      - Suggested actions (e.g., "Campaign XYZ engagement dropped 20%")
      - Best practices tips
    - "View Full Dashboard" CTA
  - Only sent if org has at least one active campaign
- **Campaign Milestone Notifications:**
  - Sent when campaign reaches milestones:
    - 100, 500, 1,000, 5,000, 10,000+ actions
  - Subject: "{Campaign Name} reached {milestone} actions!"
  - Contains:
    - Congratulations message
    - Current metrics snapshot
    - Top demographics engaged
    - Social share suggestions
    - "View Campaign Analytics" CTA

**Technical Requirements:**
- Weekly report cron: Sunday 11 PM UTC, sends Monday morning per org timezone
- Query `campaign_actions` filtered by org and date range
- Calculate metrics: Total actions, new actions this week, growth percentage
- Identify top campaigns by `action_count DESC LIMIT 3`
- Milestone trigger: After action count crosses threshold, check `campaign_milestones_sent` to avoid duplicates
- Recipients: Query `user_organizations` WHERE `role` IN ('admin', 'editor')
- Template variables: {orgName}, {totalActions}, {newActions}, {growthPercent}, {topCampaigns}, {activeCampaigns}
- Store: `org_email_notifications.last_weekly_report_sent`

**Story Points:** 5
**Deferred to:** Post-Launch Sprint (Weeks 21-22)

---

#### EMAIL-008: Team & Campaign Management Notifications
**As an** organization user
**I want to** receive notifications about team and campaign changes
**So that** I stay informed about important updates

**Acceptance Criteria:**
- **Team Member Invitation:**
  - Sent to invitee email
  - Subject: "You've been invited to join {Organization Name} on eGp"
  - Contains:
    - Invitation from {Admin Name}
    - Organization name and description
    - Role being offered (Admin or Editor)
    - "Accept Invitation" CTA (signup/login link with token)
    - Invitation expires in 7 days
    - What you'll be able to do (role permissions)
- **Team Member Joined:**
  - Sent to all org admins
  - Subject: "{New Member Name} joined {Organization Name}"
  - Contains:
    - New member name and email
    - Role assigned
    - Date joined
    - "View Team" link
- **Campaign Suspended by Admin:**
  - Sent to all org admins and the campaign creator
  - Subject: "Your campaign was suspended: {Campaign Name}"
  - Contains:
    - Campaign name and link
    - Suspension reason (from admin)
    - Date suspended
    - What this means (hidden from public, no new actions)
    - Contact support if you believe this was in error
    - Support email/link
- **Campaign Reactivated by Admin:**
  - Sent to all org admins
  - Subject: "Your campaign was reactivated: {Campaign Name}"
  - Contains:
    - Campaign name and link
    - Reactivation date
    - Campaign is now visible again
    - "View Campaign" CTA

**Technical Requirements:**
- Team invitation: Triggered when org admin creates invitation
- Store token in `organization_invitations`, expire after 7 days
- Team joined: Triggered after user accepts invitation and joins org
- Campaign suspended/reactivated: Triggered by admin action via webhook
- Recipients: Query `user_organizations` WHERE `organization_id` = ? AND `role` = 'admin'
- Template variables: {orgName}, {memberName}, {role}, {campaignName}, {suspensionReason}, {inviteLink}

**Story Points:** 5
**Deferred to:** Post-Launch Sprint (Weeks 21-22)

---

### Deferred Admin Email Notifications

#### EMAIL-009: System Alerts & Moderation Notifications
**As an** admin
**I want to** receive critical system alerts
**So that** I can respond quickly to issues

**Acceptance Criteria:**
- **New Organization Application:**
  - Sent when new org applies to join platform
  - Subject: "New organization application: {Organization Name}"
  - Contains:
    - Organization name
    - Contact info (name, email, phone)
    - Organization type (501c3, 501c4, etc.)
    - EIN (Tax ID)
    - Description and mission
    - Website and social links
    - Application date
    - "Review Application" CTA (link to `/admin/organizations`)
  - Sent immediately
  - Recipients: All admins with `review_applications` permission
- **Payment Failure Alert (High Value):**
  - Sent when high-value subscriber payment fails (premium annual plan)
  - Subject: "Premium payment failed: {User Name}"
  - Contains:
    - User name and email
    - Subscription plan and value
    - Payment failure reason
    - Number of retry attempts
    - User's history (subscription length, total paid)
    - "View User" and "Contact User" CTAs
  - Sent after 2nd failed retry
- **Flagged Content Report:**
  - Sent when message or campaign is flagged
  - Subject: "Content flagged for review: {Type}"
  - Contains:
    - Content type (message or campaign)
    - Flagged by (user ID or automated system)
    - Flag reason
    - Content preview
    - User/org associated
    - Timestamp
    - "Review Content" CTA
  - Sent immediately
- **Error Rate Threshold Exceeded:**
  - Sent when platform error rate spikes
  - Subject: "URGENT: Error rate threshold exceeded"
  - Contains:
    - Error rate (errors per minute)
    - Most common errors (top 5)
    - Affected endpoints
    - Time window
    - Link to error logs
    - "View Logs" CTA
  - Sent immediately, max once per hour
- **Daily System Summary:**
  - Sent every day at 8 AM
  - Subject: "eGp Daily Summary - {Date}"
  - Contains:
    - New users (last 24 hours)
    - New premium subscriptions
    - Messages sent
    - Active campaigns
    - Top issues (if any)
    - Pending reviews (org applications, flags)
    - System health indicators
    - "View Admin Dashboard" CTA

**Technical Requirements:**
- Org application: Triggered when org submits application
- Payment failure: Stripe webhook `invoice.payment_failed`, check retry count
- Flagged content: Triggered when flag is created
- Error rate: Monitoring system (Sentry, Datadog) webhook
- Daily summary: Cron job 8 AM UTC
- Recipients: Query `users` WHERE `role` = 'admin'
- Critical alerts: Use email service's high-priority delivery
- Template variables: {orgName}, {userName}, {errorRate}, {flagReason}, {contentPreview}

**Story Points:** 5
**Deferred to:** Post-Launch Sprint (Weeks 21-22)

---

**Total Deferred Story Points:** 44 points (EMAIL-003 through EMAIL-009)
**Launch Story Points Saved:** Sprint 8 reduced from 65 to 21 points

**End of Document**
