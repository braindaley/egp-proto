# User Stories & Success Criteria

This document outlines the user stories and success criteria for all personas in the advocacy platform.

**Version:** 1.0
**Last Updated:** 2025-10-08

---

## Table of Contents

1. [Regular User Stories](#regular-user-stories)
2. [Organization User Stories](#organization-user-stories)
3. [Admin User Stories](#admin-user-stories)

---

## Regular User Stories

Regular users are members of the public who use the platform to engage with legislation and contact their representatives.

### 1. Account Management

#### US-001: Create Account
**As a** visitor
**I want to** create an account with email and password
**So that** I can track my advocacy messages and save my preferences

**Acceptance Criteria:**
- User can sign up with valid email and password (min 6 characters)
- Password is hashed and stored securely
- User receives email verification link
- Upon signup, user profile is created in database with default values
- User is redirected to onboarding/profile setup flow
- Session is established with secure JWT token

**Technical Requirements:**
- Firebase Auth OR custom JWT-based authentication
- Email verification service (SendGrid, AWS SES, or similar)
- Password must meet security requirements (min 6 chars, can add complexity later)
- Store user in PostgreSQL `users` table

**Success Metrics:**
- 90%+ signup completion rate
- < 2 second response time for account creation
- Zero unencrypted password storage

---

#### US-002: Login to Account
**As a** registered user
**I want to** log in with my credentials
**So that** I can access my personalized dashboard and history

**Acceptance Criteria:**
- User can log in with email and password
- Invalid credentials show clear error message
- Successful login creates session and redirects to dashboard or intended page
- "Remember me" option extends session duration
- Password reset link available on login page
- Account locked after 5 failed login attempts (unlocks after 15 minutes)

**Technical Requirements:**
- Secure session management with JWT
- Rate limiting on login endpoint (max 5 attempts per 15 minutes)
- Redirect to `returnTo` parameter if provided

---

#### US-003: Reset Password
**As a** user who forgot their password
**I want to** reset my password via email
**So that** I can regain access to my account

**Acceptance Criteria:**
- User can request password reset from login page
- Password reset email sent to registered address
- Reset link expires after 1 hour
- User can set new password (min 6 characters)
- Old password is immediately invalidated
- User receives confirmation email after reset

**Technical Requirements:**
- Generate secure, time-limited reset tokens
- Store reset tokens in database with expiration
- Send email via email service provider

---

#### US-004: Update Profile Information
**As a** registered user
**I want to** update my personal information
**So that** my representatives can better understand me and my advocacy is more credible

**Acceptance Criteria:**
- User can update: First Name, Last Name, Address, City, State, ZIP Code
- User can update: Birth Year, Gender, Political Affiliation, Education, Profession
- User can update: Military Service status
- User can set "constituent description" (custom narrative about themselves)
- Form validation ensures required fields (name, address, zip) are complete
- Changes are saved to database
- User sees success confirmation

**Technical Requirements:**
- Update `users` table in PostgreSQL
- Validate ZIP code format
- Update `updated_at` timestamp
- Refresh user session data

---

### 2. Voter Registration & Verification

#### US-005: Verify Voter Registration Status
**As a** user
**I want to** verify my voter registration status
**So that** I can confirm I'm eligible to send advocacy messages

**Acceptance Criteria:**
- User prompted to verify voter registration before sending first message
- User can search voter registration database by name and address
- System displays matching registrations
- User can confirm their registration match
- User can manually enter registration information if not found
- Verification status saved to user profile
- Unregistered users see link to vote.gov

**Technical Requirements:**
- Integration with voter registration API (state-specific or national)
- Store `voter_registration_verified` boolean in `users` table
- Store `voter_registration_verified_at` timestamp
- Fallback to manual entry if API unavailable

---

### 3. Browsing Legislation

#### US-006: Browse Federal Bills
**As a** user
**I want to** browse recent federal legislation
**So that** I can stay informed about what Congress is working on

**Acceptance Criteria:**
- User can view feed of recent bills (last 30 days)
- Bills show: Title, Bill Number, Sponsor, Latest Action, Status
- Bills can be filtered by: Status, Chamber, Subject, Sponsor Party
- Bills can be sorted by: Date Introduced, Last Action Date, Importance Score
- Each bill shows AI-generated plain-language summary
- Each bill has engagement metrics (support/oppose counts from campaigns)
- Pagination loads 20 bills at a time

**Technical Requirements:**
- Query `bills` table with filters
- Join with `bill_summaries` for AI summaries
- Include `campaigns` aggregate data for engagement
- Cache results for 5 minutes
- Return total count for pagination

---

#### US-007: View Bill Details
**As a** user
**I want to** view detailed information about a specific bill
**So that** I can understand what it does before taking action

**Acceptance Criteria:**
- Bill detail page shows: Full title, Bill number, Congress, Sponsors/Cosponsors
- Shows: Current status, Latest action date and text, Policy area and subjects
- Shows: Committee assignments, Related bills, Amendments
- Shows: AI-generated plain-language summary
- Shows: AI-generated "Support" and "Oppose" arguments
- Shows: Full text links (PDF, HTML) from Congress.gov
- Shows: Voting record if bill has been voted on
- Shows: Active campaigns from organizations related to this bill

**Technical Requirements:**
- Fetch from `bills` table with all related data
- Generate AI summary if not already cached
- Query `campaigns` for this bill
- Cache page for 1 hour

---

#### US-008: Search Bills
**As a** user
**I want to** search for bills by keyword
**So that** I can find legislation on topics I care about

**Acceptance Criteria:**
- Search bar accepts keywords (min 3 characters)
- Search looks through: Title, Summary, Subjects, Sponsor name
- Results ranked by relevance
- Results show snippet with highlighted keywords
- Can filter search results by Congress, Status, Chamber
- Search history saved for logged-in users (last 10 searches)

**Technical Requirements:**
- Full-text search using PostgreSQL `tsvector`
- Search index on `bills` table (title, summary, subjects)
- Rank results by `ts_rank`
- Return top 50 results

---

#### US-009: Browse State Legislation
**As a** user
**I want to** browse bills in my state legislature
**So that** I can engage with local issues

**Acceptance Criteria:**
- User can select their state
- View recent state bills (last 90 days)
- Bills show: Title, Bill Number, Sponsor, Latest Action, Status
- Can filter by: Chamber, Subject, Status
- Each bill has link to full text on state legislature website
- Integration with LegiScan API for state bill data

**Technical Requirements:**
- Store state bills in `state_bills` table
- Sync from LegiScan API daily
- Filter by user's state from profile

---

#### US-010: Follow Bills (Watch)
**As a** user
**I want to** follow specific bills
**So that** I get notified of updates

**Acceptance Criteria:**
- User can click "Watch" button on any bill
- Watched bills appear in "Following" section of dashboard
- User receives notifications when watched bill has status change
- User can unwatch bills
- Notifications can be delivered via email (configurable frequency)

**Technical Requirements:**
- Create entry in `user_watched_bills` table
- Daily cron job checks for updates to watched bills
- Send notification emails via email service
- User can configure notification preferences in settings

---

### 4. Following Organizations

#### US-011: Browse Advocacy Organizations
**As a** user
**I want to** browse advocacy organizations
**So that** I can find groups aligned with my values

**Acceptance Criteria:**
- User can view list of all organizations on the platform
- Organizations show: Name, Logo, Description, Focus Areas, Active Campaigns Count
- Can filter organizations by: Focus Area, Activity Level
- Can sort by: Name, Active Campaigns, Total Actions
- Each organization has profile page with full details

**Technical Requirements:**
- Query `organizations` table
- Show `active_campaigns_count` from aggregate
- Cache organization list for 10 minutes

---

#### US-012: Follow Organizations
**As a** user
**I want to** follow advocacy organizations
**So that** I can see their campaigns and receive updates

**Acceptance Criteria:**
- User can click "Follow" on any organization
- Followed organizations appear in "Following" section
- User's feed prioritizes bills from followed organizations' campaigns
- User receives email updates about new campaigns (if opted in)
- User can unfollow organizations

**Technical Requirements:**
- Create entry in `user_followed_organizations` table
- Include followed orgs in feed algorithm
- Send digest emails weekly (configurable)

---

### 5. Sending Advocacy Messages

#### US-013: Send Message to Representatives
**As a** verified user
**I want to** send an advocacy message to my representatives
**So that** I can make my voice heard on legislation

**Acceptance Criteria:**
- User must be logged in and voter-verified to send messages
- User is shown their representatives (House, both Senators) based on ZIP code
- User can select which representatives to contact (can select all or subset)
- User can choose position: Support or Oppose
- User can write custom message or use AI to generate draft
- User can include personal data fields (name, address, profession, etc.)
- User can upload attachments (PDFs, images) up to 5MB total
- User previews message before sending
- User confirms and sends message
- Message is logged in database with timestamp
- User receives confirmation with tracking information

**Technical Requirements:**
- Lookup representatives via `members` table by ZIP code and congressional district
- Generate AI message via OpenAI/Anthropic API
- Store message in `user_messages` table
- Send via email (primary) and/or postal mail service
- Return confirmation number
- Track delivery status

---

#### US-014: AI-Assisted Message Drafting
**As a** user drafting a message
**I want** AI to help me write an effective advocacy message
**So that** I can communicate my position clearly

**Acceptance Criteria:**
- User selects "Get AI Help" when composing message
- AI generates personalized message based on:
  - User's position (support/oppose)
  - Bill summary and arguments
  - User's personal information (if shared)
  - User's constituent description (if provided)
- User can regenerate message
- User can edit AI-generated message
- AI stays within character limits (500-2000 words recommended)

**Technical Requirements:**
- Call AI API (OpenAI GPT-4, Anthropic Claude)
- Include bill context, user profile, and position in prompt
- Return message in < 5 seconds
- Cache API calls for same bill+position+user for 24 hours

---

#### US-015: View Message History
**As a** user
**I want to** view all messages I've sent
**So that** I can track my advocacy efforts

**Acceptance Criteria:**
- User can view all sent messages in dashboard
- Messages show: Date sent, Bill, Recipients, Position, Status
- Can filter by: Date range, Bill, Representative, Status
- Can sort by: Date, Bill, Representative
- Free users can see messages from last 30 days
- Premium users can see full history

**Technical Requirements:**
- Query `user_messages` table
- Join with `bills` and `members` for display
- Limit free users to `sent_at > NOW() - 30 days`
- Paginate 20 messages per page

---

### 6. Premium Membership

#### US-016: View Membership Options
**As a** user
**I want to** see membership options and benefits
**So that** I can decide if I want to upgrade

**Acceptance Criteria:**
- Membership page shows comparison: Free vs Premium
- Premium benefits clearly listed:
  - Support the organization
  - Full message history (beyond 30 days)
  - View official responses from representatives
  - Advocacy impact analytics (response rates, engagement)
  - Customized feed based on policy interests
  - Email digest options (daily, weekly, monthly)
- Pricing shown: $6 per quarter ($24/year)
- "Upgrade to Premium" button available
- FAQs about membership

**Technical Requirements:**
- Static page, no database calls
- Link to `/membership/signup` for upgrade

---

#### US-017: Subscribe to Premium Membership
**As a** free user
**I want to** subscribe to premium membership via Stripe
**So that** I can access premium features

**Acceptance Criteria:**
- User completes profile if not already complete (name, address, demographics)
- User enters payment information securely via Stripe Elements
- User sees pricing: $6 per quarter, auto-renewing
- User must accept terms and conditions
- Payment processed via Stripe
- Upon success, user's membership is upgraded immediately
- User receives confirmation email with receipt
- First payment charged immediately
- Recurring payments scheduled quarterly

**Technical Requirements:**
- Stripe integration (Checkout or Elements)
- Create Stripe Customer for user
- Create Stripe Subscription with quarterly interval
- Store subscription ID in `user_subscriptions` table
- Set `membership_tier` = 'premium' in `users` table
- Set `membership_start_date` = NOW()
- Handle Stripe webhooks for subscription updates

**Stripe Integration:**
- Create Product in Stripe: "Premium Membership"
- Create Price: $6 USD, recurring every 3 months
- Use Stripe Checkout for payment collection
- Webhook events to handle:
  - `checkout.session.completed` - activate membership
  - `invoice.payment_succeeded` - log payment
  - `invoice.payment_failed` - send reminder, retry
  - `customer.subscription.deleted` - downgrade to free

---

#### US-018: Manage Subscription
**As a** premium user
**I want to** manage my subscription
**So that** I can update payment info or cancel

**Acceptance Criteria:**
- User can view subscription status (active, past due, canceled)
- User can see next billing date and amount
- User can update payment method (credit card)
- User can view payment history
- User can cancel subscription (takes effect at end of current billing period)
- User receives confirmation email for any changes

**Technical Requirements:**
- Display Stripe Customer Portal link, OR
- Build custom UI with Stripe API calls:
  - GET /subscriptions/:id - view subscription
  - POST /payment_methods - update card
  - DELETE /subscriptions/:id - cancel subscription
- Show `invoices` from Stripe for payment history
- Handle cancellation via webhook `customer.subscription.deleted`

---

#### US-019: Cancel Subscription
**As a** premium user
**I want to** cancel my subscription
**So that** I'm not charged again

**Acceptance Criteria:**
- User can cancel from subscription settings
- Confirmation dialog warns that premium features will be lost
- User selects reason for cancellation (optional survey)
- Cancellation takes effect at end of current billing period
- User retains premium access until period ends
- User receives cancellation confirmation email
- User can resubscribe at any time

**Technical Requirements:**
- Call Stripe API: `DELETE /subscriptions/:id` with `at_period_end: true`
- Update `user_subscriptions.canceled_at` in database
- Send cancellation email
- Cron job to downgrade users when `subscription_end_date` < NOW()

---

### 7. Personalization

#### US-020: Set Policy Interests
**As a** user
**I want to** set my policy interest levels
**So that** my feed prioritizes bills I care about

**Acceptance Criteria:**
- User can rate interest level (Low, Medium, High) for policy areas:
  - Climate, Energy & Environment
  - Criminal Justice
  - Defense & National Security
  - Discrimination & Prejudice
  - Economy & Work
  - Education
  - Health Policy
  - Immigration & Migration
  - International Affairs
  - National Conditions
  - Religion & Government
  - Technology
- Interests saved to profile
- Feed algorithm uses interests to prioritize bills
- Premium users get more accurate personalization

**Technical Requirements:**
- Store in `users.policy_interests` JSONB column
- Use in feed query to weight results

---

#### US-021: Customized Bill Feed (Premium)
**As a** premium user
**I want** my feed to show bills matching my interests
**So that** I see legislation I care about

**Acceptance Criteria:**
- Feed shows bills from subjects matching user interests (high first)
- Includes bills from followed organizations
- Includes bills user is already watching
- Excludes bills user has already acted on (unless followed)
- Refreshes daily with new bills
- User can toggle back to "All Bills" view

**Technical Requirements:**
- Query `bills` filtered by `policy_area` matching user interests
- Join with `user_watched_bills`, `user_followed_organizations`
- Weight by interest level (high = 3, medium = 2, low = 1)
- Cache personalized feed for 1 hour per user

---

#### US-022: Email Digest Preferences (Premium)
**As a** premium user
**I want to** receive email digests of new legislation
**So that** I stay informed without checking the app daily

**Acceptance Criteria:**
- User can enable/disable email digests
- User can select frequency: Daily, Weekly, Monthly
- User can select topics to include (based on policy interests)
- Digest includes: New bills, Updates to watched bills, New campaigns
- User can unsubscribe from any email
- Preview of digest available in settings

**Technical Requirements:**
- Store preferences in `user_email_preferences` table
- Cron jobs for each frequency (daily, weekly, monthly)
- Generate digest from recent bills matching interests
- Send via email service provider
- Include unsubscribe link in footer

---

### 8. Analytics (Premium)

#### US-023: View Advocacy Impact
**As a** premium user
**I want to** see analytics on my advocacy efforts
**So that** I can measure my impact

**Acceptance Criteria:**
- Dashboard shows:
  - Total messages sent
  - Bills engaged with (supported/opposed)
  - Representatives contacted (unique count)
  - Response rate from representatives
  - Engagement over time (chart)
  - Impact score (calculated metric)
- Can filter analytics by date range
- Can export data as CSV

**Technical Requirements:**
- Aggregate data from `user_messages` table
- Calculate response rate from `official_responses` table
- Generate charts with Recharts library
- Export functionality via CSV download

---

#### US-024: View Official Responses (Premium)
**As a** premium user
**I want to** see responses I receive from representatives
**So that** I know my voice was heard

**Acceptance Criteria:**
- Responses linked to original messages
- Shows: Date received, Representative, Response text
- Can reply to responses
- Can mark responses as helpful/unhelpful
- Aggregated response stats visible

**Technical Requirements:**
- Store responses in `official_responses` table
- Link via `message_id` foreign key
- Allow email replies (parse via email service)
- Track ratings in `response_ratings` table

---

---

## Organization User Stories

Organization users are staff members of advocacy groups who have access to the `/partners` portal to manage campaigns.

### 1. Organization Account Management

#### ORG-001: Organization User Login
**As an** organization staff member
**I want to** log in with my credentials
**So that** I can manage my organization's campaigns

**Acceptance Criteria:**
- Organization user has `role` = 'organization' in database
- Login flow same as regular user
- After login, user redirected to `/partners` dashboard
- User can only access organizations they're authorized for
- User can switch between organizations if member of multiple

**Technical Requirements:**
- Check `user_organizations` table for organization access
- Store selected organization in session
- Middleware restricts `/partners` routes to organization users

---

#### ORG-002: Invite Team Members
**As an** organization admin
**I want to** invite team members to manage the organization
**So that** we can collaborate on campaigns

**Acceptance Criteria:**
- Organization admin can send email invites
- Invite includes signup link with organization pre-selected
- Invited user creates account and is automatically added to organization
- Can set permission level: Admin or Editor
- Admin can manage campaigns and settings; Editor can only manage campaigns
- Invite expires after 7 days

**Technical Requirements:**
- Store invites in `organization_invitations` table
- Send invite email with secure token
- Token links to signup flow with `org_invite_token` parameter
- After signup, create entry in `user_organizations` with role

---

### 2. Organization Profile

#### ORG-003: View Organization Profile
**As an** organization user
**I want to** view my organization's public profile
**So that** I can see how we appear to users

**Acceptance Criteria:**
- Shows: Organization name, logo, description, website
- Shows: Nonprofit status, years active
- Shows: Active campaigns count, total supporters
- Shows: Policy focus areas
- Link to public profile page

**Technical Requirements:**
- Query `organizations` table
- Aggregate `campaigns` for count
- Aggregate `campaign_actions` for supporter count

---

#### ORG-004: Edit Organization Profile
**As an** organization admin
**I want to** edit my organization's profile
**So that** we have accurate public information

**Acceptance Criteria:**
- Can update: Name, Logo (upload), Description, Website
- Can update: Nonprofit status, Focus areas
- Can update: Social media links
- Can upload logo (PNG, JPG, max 2MB)
- Changes are saved and reflected immediately on public page
- SEO: Can set meta description for organization page

**Technical Requirements:**
- Update `organizations` table
- Upload logo to cloud storage (AWS S3, Cloudinary)
- Store logo URL in database
- Invalidate cache for organization page

---

### 3. Campaign Management

#### ORG-005: Create Campaign for Federal Bill
**As an** organization user
**I want to** create a campaign for a federal bill
**So that** we can mobilize supporters

**Acceptance Criteria:**
- User searches for bill by number or keyword
- User selects bill from search results
- User sets position: Support or Oppose
- User writes reasoning for position (markdown supported)
- User can set custom call-to-action button text
- User can upload campaign image (optional)
- User can set campaign status: Draft, Active, Paused, Ended
- Campaign is created and appears on organization's campaign list
- If Active, campaign appears on bill detail page for all users

**Technical Requirements:**
- Search `bills` table
- Create entry in `campaigns` table
  - Fields: organization_id, bill_id, position, reasoning, status, image_url, cta_text
- Set `created_at` and `updated_at` timestamps
- Publish to campaign feed if status = 'Active'

---

#### ORG-006: Create Campaign for State Bill
**As an** organization user
**I want to** create a campaign for a state bill
**So that** we can engage on local issues

**Acceptance Criteria:**
- Same as ORG-005 but for state bills
- User selects state first, then searches state bills
- Uses LegiScan data

**Technical Requirements:**
- Search `state_bills` table
- Create entry in `campaigns` with `state_bill_id` instead of `bill_id`

---

#### ORG-007: Create Issue-Based Campaign
**As an** organization user
**I want to** create a campaign not tied to a specific bill
**So that** we can advocate on broader issues

**Acceptance Criteria:**
- User selects "Issue Campaign" type
- User sets: Issue Title, Issue Description, Policy Area
- User writes advocacy message template
- User sets target representatives (can target all, or filter by state, party, committee)
- Campaign appears on homepage and organization page

**Technical Requirements:**
- Create in `campaigns` table with `campaign_type` = 'issue'
- Store target criteria in `target_criteria` JSONB column

---

#### ORG-008: Edit Campaign
**As an** organization user
**I want to** edit an existing campaign
**So that** I can update messaging or details

**Acceptance Criteria:**
- Can edit: Position, Reasoning, CTA text, Image, Status
- Cannot edit: Bill (must create new campaign)
- Changes reflected immediately on live campaign page
- Edit history logged (who, when, what changed)

**Technical Requirements:**
- Update `campaigns` table
- Log changes in `campaign_edit_history` table
- Invalidate campaign page cache

---

#### ORG-009: Delete Campaign
**As an** organization admin
**I want to** delete a campaign
**So that** outdated campaigns don't confuse supporters

**Acceptance Criteria:**
- Confirmation dialog warns that deletion is permanent
- Campaign removed from all public listings
- Historical data (messages sent, actions taken) is preserved
- User actions are not deleted, just disassociated from campaign

**Technical Requirements:**
- Soft delete: Set `deleted_at` timestamp in `campaigns` table
- Exclude deleted campaigns from queries
- Keep `campaign_actions` data for historical reporting

---

#### ORG-010: View Campaign Analytics
**As an** organization user
**I want to** view detailed analytics for a campaign
**So that** I can measure effectiveness

**Acceptance Criteria:**
- Campaign analytics page shows:
  - Total actions (support + oppose if multi-position campaign)
  - Messages sent (estimated from actions)
  - Email delivery rate (actual data from email provider)
  - Engagement over time (chart)
  - Geographic breakdown (by state, congressional district)
  - Demographics breakdown (age, gender, political affiliation) if users shared
  - Top representatives contacted
- Can filter by date range
- Can export data as CSV or PDF

**Technical Requirements:**
- Query `campaign_actions` table
- Join with `user_messages` for message data
- Join with `users` for demographic data (anonymized aggregates only)
- Generate charts with Recharts
- PDF export via library like jsPDF or server-side rendering

---

#### ORG-011: View Message Sent Count
**As an** organization user
**I want to** see how many messages were sent from my campaign
**So that** I can report impact to stakeholders

**Acceptance Criteria:**
- Dashboard shows estimated message count per campaign
- Calculation: (Support count + Oppose count) × 0.75 (assumes 75% completion rate)
- Shows breakdown: Email vs Postal
- Shows delivery success rate
- Shows bounces and failures

**Technical Requirements:**
- Aggregate `campaign_actions` table
- Join with `user_messages` for delivery status
- Apply completion rate multiplier

---

#### ORG-012: Copy Campaign Link
**As an** organization user
**I want to** copy a shareable campaign link
**So that** I can promote it on social media and email

**Acceptance Criteria:**
- Each campaign has unique URL: `/campaigns/{org-slug}/{campaign-slug}`
- Click "Copy Link" button copies to clipboard
- Link can be shared directly
- Landing page shows campaign details and advocacy form

**Technical Requirements:**
- Generate slug from campaign title
- Store in `campaigns.slug` column (unique)
- Clipboard API or fallback for older browsers

---

### 4. Email Templates & Communication

#### ORG-013: Draft Message Template
**As an** organization user
**I want to** create a message template for my campaign
**So that** supporters can easily send effective messages

**Acceptance Criteria:**
- Can write message template with placeholders: {firstName}, {lastName}, {address}, etc.
- Template includes AI-suggested arguments based on bill and position
- Can set tone: Formal, Personal, Urgent
- Template is shown to users as suggested message (they can edit)
- Can save multiple versions and A/B test

**Technical Requirements:**
- Store in `campaign_message_templates` table
- Use AI to generate initial draft
- Support template variables

---

#### ORG-014: View Email Engagement
**As an** organization user
**I want to** see email engagement metrics
**So that** I know if our messages are being delivered and opened

**Acceptance Criteria:**
- Shows per campaign:
  - Emails sent
  - Emails delivered (not bounced)
  - Delivery rate %
  - Estimated open rate (if tracking pixels enabled)
- Shows failures and bounce reasons
- Shows spam complaints

**Technical Requirements:**
- Integrate with email service provider API (SendGrid, Mailgun, etc.)
- Fetch delivery events via webhook or API polling
- Store events in `email_delivery_logs` table
- Aggregate for reporting

---

### 5. Network Collaboration

#### ORG-015: View Other Organizations' Campaigns
**As an** organization user
**I want to** see campaigns from other organizations on the same bill
**So that** we can collaborate and amplify impact

**Acceptance Criteria:**
- When viewing a campaign, see "Other network campaigns" section
- Shows: Organization name, Position, Support/Oppose counts, Message count
- Can click to view their campaign page
- Can send message through their campaign (cross-promotion)

**Technical Requirements:**
- Query `campaigns` table for same `bill_id`, different `organization_id`
- Display in campaign detail view

---

---

## Admin User Stories

Admin users have elevated permissions to manage the entire platform, including users, organizations, and system settings.

### 1. User Management

#### ADMIN-001: View All Users
**As an** admin
**I want to** view a list of all users
**So that** I can monitor platform usage

**Acceptance Criteria:**
- Admin dashboard shows paginated user list
- Shows: Name, Email, Membership Tier, Registration Date, Last Login
- Can filter by: Membership tier, Registration date range, Activity status
- Can sort by: Name, Registration date, Last login
- Can search by email or name
- Shows total user count

**Technical Requirements:**
- Query `users` table with filters
- Paginate 50 users per page
- Cache total count for 5 minutes

---

#### ADMIN-002: View User Details
**As an** admin
**I want to** view detailed information about a user
**So that** I can troubleshoot issues or verify information

**Acceptance Criteria:**
- User detail page shows:
  - Full profile (name, address, demographics)
  - Account status (active, suspended, deleted)
  - Membership info (tier, start date, next billing)
  - Activity summary (messages sent, bills followed, organizations followed)
  - Recent messages (last 10)
  - Login history (last 10 logins)
- Can view full message history

**Technical Requirements:**
- Query `users` table with related data
- Join with `user_messages`, `user_watched_bills`, `user_followed_organizations`
- Join with `user_subscriptions` for membership
- Join with `login_history` table

---

#### ADMIN-003: Suspend User
**As an** admin
**I want to** suspend a user account
**So that** I can prevent abuse or policy violations

**Acceptance Criteria:**
- Can suspend user with reason (required)
- Suspended user cannot log in
- Suspended user sees message: "Account suspended. Contact support."
- Can set suspension duration (temporary or permanent)
- Admin can unsuspend at any time
- Suspension logged with admin user ID and timestamp

**Technical Requirements:**
- Set `users.status` = 'suspended'
- Store `suspended_at`, `suspended_by`, `suspension_reason`, `suspension_expires_at`
- Check status on login and block if suspended
- Show suspension message on login page

---

#### ADMIN-004: Delete User
**As an** admin
**I want to** delete a user account
**So that** I can comply with GDPR/data deletion requests

**Acceptance Criteria:**
- Confirmation dialog warns that deletion is permanent
- Option for hard delete (removes all data) or soft delete (anonymizes)
- Hard delete removes: User profile, messages, activity logs
- Hard delete preserves: Anonymized analytics (counts, aggregates)
- Soft delete: Sets email to null, name to "Deleted User", keeps activity data
- Deletion logged in audit log

**Technical Requirements:**
- Hard delete: DELETE from `users`, CASCADE to related tables
- Soft delete: UPDATE `users` SET `email` = NULL, `first_name` = 'Deleted', etc.
- Log in `admin_audit_log` table

---

### 2. Organization Management

#### ADMIN-005: View All Organizations
**As an** admin
**I want to** view all organizations
**So that** I can manage the partner network

**Acceptance Criteria:**
- Shows: Name, Status (pending, active, suspended), Campaigns count, Members count
- Can filter by status
- Can sort by name, campaigns count, date joined
- Can search by name

**Technical Requirements:**
- Query `organizations` table
- Aggregate `campaigns` and `user_organizations` for counts

---

#### ADMIN-006: Approve New Organization
**As an** admin
**I want to** approve organization applications
**So that** only legitimate groups access the platform

**Acceptance Criteria:**
- New organization applications show in "Pending" list
- Application shows: Name, Description, Website, EIN (tax ID), Contact info
- Admin can approve or reject with reason
- Approved organization gets access to `/partners` portal
- Rejected organization receives email with reason
- Approval logged in audit log

**Technical Requirements:**
- Query `organizations WHERE status = 'pending'`
- Update `organizations.status` to 'active' or 'rejected'
- Send notification email
- Log in `admin_audit_log`

---

#### ADMIN-007: Suspend Organization
**As an** admin
**I want to** suspend an organization
**So that** I can prevent misuse of the platform

**Acceptance Criteria:**
- Can suspend with reason
- Suspended org cannot create/edit campaigns
- Existing campaigns are hidden from public
- Org users can still log in but see suspension notice
- Can unsuspend at any time

**Technical Requirements:**
- Set `organizations.status` = 'suspended'
- Exclude suspended orgs' campaigns from public queries
- Show suspension message in `/partners` portal

---

#### ADMIN-008: View Organization Details
**As an** admin
**I want to** view detailed org information
**So that** I can verify legitimacy and monitor activity

**Acceptance Criteria:**
- Shows: Full profile, Contact info, Tax ID (EIN), Members list
- Shows: Campaign list (all campaigns), Analytics (total actions, messages)
- Shows: Audit history (who created campaigns, edits made)
- Can edit organization details

**Technical Requirements:**
- Query `organizations` with all related data
- Join with `campaigns`, `campaign_actions`, `user_organizations`

---

### 3. Payment & Subscription Management

#### ADMIN-009: View All Subscriptions
**As an** admin
**I want to** view all premium subscriptions
**So that** I can monitor revenue and subscription health

**Acceptance Criteria:**
- Shows: User name, Email, Plan (quarterly), Status, Start date, Next billing
- Shows MRR (Monthly Recurring Revenue) and total subscribers
- Can filter by status (active, past_due, canceled)
- Can sort by start date, next billing date
- Can search by user email

**Technical Requirements:**
- Query `user_subscriptions` table
- Join with `users` for display
- Calculate MRR: (Active subscribers × $6) / 3 months

---

#### ADMIN-010: View Subscription Details
**As an** admin
**I want to** view detailed subscription information
**So that** I can troubleshoot billing issues

**Acceptance Criteria:**
- Shows: User info, Stripe Customer ID, Stripe Subscription ID
- Shows: Current status, Start date, Renewal date, Cancellation date (if applicable)
- Shows: Payment history (all invoices)
- Shows: Failed payments and retry schedule
- Can view Stripe dashboard link for this subscription

**Technical Requirements:**
- Query `user_subscriptions` with related data
- Fetch Stripe Subscription and Invoice data via API
- Link to Stripe dashboard: `https://dashboard.stripe.com/subscriptions/{id}`

---

#### ADMIN-011: Issue Refund
**As an** admin
**I want to** issue a refund to a user
**So that** I can handle customer service requests

**Acceptance Criteria:**
- Can select specific invoice to refund
- Can choose partial or full refund
- Must enter reason for refund
- Refund processed via Stripe immediately
- User receives refund confirmation email
- Refund logged in admin audit log

**Technical Requirements:**
- Call Stripe API: `POST /refunds` with `charge_id` and `amount`
- Log in `payment_refunds` table
- Send email notification
- Log in `admin_audit_log`

---

#### ADMIN-012: Apply Credit to Account
**As an** admin
**I want to** apply account credit
**So that** I can compensate for service issues

**Acceptance Criteria:**
- Enter credit amount (in dollars)
- Enter reason for credit
- Credit applied to Stripe customer account
- Credit used for next invoice automatically
- User receives notification of credit
- Credit logged in audit log

**Technical Requirements:**
- Call Stripe API: `POST /customers/{id}/balance_transactions` with negative amount
- Log in `account_credits` table
- Send email notification

---

#### ADMIN-013: Manually Upgrade/Downgrade User
**As an** admin
**I want to** manually change a user's membership tier
**So that** I can handle special cases or support requests

**Acceptance Criteria:**
- Can upgrade free user to premium (without payment)
- Can downgrade premium to free
- Must enter reason
- Change takes effect immediately
- User receives notification email
- Change logged in audit log

**Technical Requirements:**
- Update `users.membership_tier`
- If upgrade without Stripe: Set `users.membership_override` = true
- Send email notification
- Log in `admin_audit_log`

---

#### ADMIN-014: View Payment Failures
**As an** admin
**I want to** see all payment failures
**So that** I can monitor subscription health and reach out to users

**Acceptance Criteria:**
- Shows list of failed payments
- Shows: User, Amount, Failure reason, Retry date, Attempt number
- Can filter by failure reason
- Can mark as resolved (after manual follow-up)
- Can send reminder email to user

**Technical Requirements:**
- Query `payment_failures` table
- Populated by Stripe webhook `invoice.payment_failed`
- Include Stripe failure codes and messages
- Send reminder emails via email service

---

### 4. Platform Analytics

#### ADMIN-015: View Platform Overview
**As an** admin
**I want to** see high-level platform metrics
**So that** I can monitor growth and health

**Acceptance Criteria:**
- Dashboard shows:
  - Total users (all time), new users (last 30 days)
  - Premium subscribers (count), churn rate
  - Total messages sent (all time), messages (last 30 days)
  - Total campaigns (active), total organizations (active)
  - MRR (Monthly Recurring Revenue)
- Charts show trends over time (last 90 days):
  - New signups per day
  - Messages sent per day
  - Revenue per month
- Can export all metrics to CSV

**Technical Requirements:**
- Aggregate from `users`, `user_subscriptions`, `user_messages`, `campaigns`, `organizations`
- Cache dashboard data for 10 minutes
- Generate charts with Recharts

---

#### ADMIN-016: View Advocacy Message Analytics
**As an** admin
**I want to** see all advocacy messages sent
**So that** I can monitor platform usage and quality

**Acceptance Criteria:**
- Shows paginated list of messages (most recent first)
- Shows: Date, User, Bill, Recipients, Position, Delivery status
- Can filter by: Date range, Delivery method, Status, Bill
- Can search by user email or bill number
- Can view full message content
- Can flag inappropriate messages

**Technical Requirements:**
- Query `user_messages` table
- Join with `users`, `bills`, `members` for display
- Paginate 50 messages per page
- Flag sets `flagged` = true, `flagged_by`, `flagged_at`

---

#### ADMIN-017: View Campaign Performance
**As an** admin
**I want to** see all campaigns and their metrics
**So that** I can identify top-performing campaigns

**Acceptance Criteria:**
- Shows all campaigns with metrics: Actions, Messages sent, Engagement rate
- Can sort by any metric
- Can filter by organization, bill, status, date created
- Can export top campaigns report

**Technical Requirements:**
- Query `campaigns` with aggregated `campaign_actions`
- Calculate engagement rate: (Actions / Views) × 100
- Export to CSV

---

### 5. Content Moderation

#### ADMIN-018: Flag Inappropriate Content
**As an** admin
**I want to** flag inappropriate messages or campaigns
**So that** I can maintain platform quality

**Acceptance Criteria:**
- Can flag messages or campaigns with reason
- Flagged content hidden from public view
- Organization/user notified of flag with reason
- Can unflag after review
- Flag history logged

**Technical Requirements:**
- Set `flagged` = true in `user_messages` or `campaigns`
- Store `flag_reason`, `flagged_by`, `flagged_at`
- Send notification email
- Exclude from public queries WHERE `flagged` = false

---

### 6. System Configuration

#### ADMIN-019: Manage API Integrations
**As an** admin
**I want to** configure external API settings
**So that** the platform can sync data correctly

**Acceptance Criteria:**
- Can view/edit API keys for: Congress.gov, LegiScan, Census, FEC, OpenAI, Stripe
- Can test API connections
- Can view API usage stats and rate limits
- Can enable/disable specific integrations
- Changes logged in audit log

**Technical Requirements:**
- Store API keys in `system_settings` table (encrypted)
- Test connection: Make sample API call and return success/failure
- Track API calls in `api_usage_logs` table

---

#### ADMIN-020: View System Logs
**As an** admin
**I want to** view system error logs
**So that** I can troubleshoot issues

**Acceptance Criteria:**
- Shows recent errors (last 1000)
- Shows: Timestamp, Error type, Message, Stack trace, User (if applicable)
- Can filter by error type, date range
- Can search by error message
- Can export logs

**Technical Requirements:**
- Query `error_logs` table
- Populated by application error handlers
- Paginate 100 errors per page

---

#### ADMIN-021: Manage Email Templates
**As an** admin
**I want to** edit system email templates
**So that** I can customize user communications

**Acceptance Criteria:**
- Can view/edit templates for:
  - Welcome email
  - Password reset
  - Email verification
  - Subscription confirmation
  - Subscription failed payment
  - Message sent confirmation
  - Weekly digest
- Preview email before saving
- Supports variables: {firstName}, {resetLink}, etc.
- Changes take effect immediately

**Technical Requirements:**
- Store templates in `email_templates` table
- Use template engine (Handlebars, Mustache) for variables
- Version control: Keep edit history

---

#### ADMIN-022: Audit Log
**As an** admin
**I want to** view all admin actions
**So that** I can ensure accountability

**Acceptance Criteria:**
- Shows all admin actions: User suspensions, Org approvals, Refunds, etc.
- Shows: Admin user, Action type, Timestamp, Details/Reason
- Can filter by admin user, action type, date range
- Can export audit log

**Technical Requirements:**
- All admin actions log to `admin_audit_log` table
- Fields: admin_user_id, action_type, entity_type, entity_id, details (JSONB), created_at

---

---

## Cross-Cutting Requirements

### Security
- All passwords hashed with bcrypt (minimum 10 rounds)
- JWT tokens expire after 24 hours (refresh tokens 30 days)
- HTTPS required on all endpoints
- SQL injection prevention via parameterized queries
- XSS prevention via input sanitization and CSP headers
- CSRF protection on state-changing requests
- Rate limiting on auth endpoints (5 req/15 min)
- Rate limiting on API endpoints (100 req/min per user)

### Performance
- Page load time < 2 seconds (90th percentile)
- API response time < 500ms (median)
- Database query time < 100ms (median)
- Support 1000 concurrent users
- CDN for static assets
- Redis cache for frequently accessed data

### Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader support
- Color contrast ratios meet standards
- Form labels and ARIA attributes

### Mobile Responsiveness
- Responsive design works on screens 320px+
- Touch targets minimum 44×44px
- Mobile-first CSS
- Progressive web app (PWA) support

### Internationalization (Future)
- Support for English (initial launch)
- Architecture supports i18n (translations via JSON files)
- Date/time formatting based on locale

---

## Success Metrics

### User Engagement
- Monthly Active Users (MAU)
- Messages sent per user per month
- Average session duration
- User retention rate (30-day, 90-day)

### Revenue
- Premium conversion rate (free → premium)
- Churn rate (monthly)
- Monthly Recurring Revenue (MRR)
- Customer Lifetime Value (CLV)

### Advocacy Impact
- Total messages sent
- Delivery success rate (>90% target)
- Response rate from representatives
- Bills influenced (tracked via external sources)

### Platform Health
- Uptime (99.9% target)
- Error rate (<0.1% of requests)
- API success rate (>99%)
- Average load time (<2 seconds)

---

**End of Document**
