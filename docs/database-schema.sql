-- =====================================================
-- Advocacy Platform - PostgreSQL Database Schema
-- Version: 1.0
-- Last Updated: 2025-10-08
-- =====================================================

-- This schema is designed for PostgreSQL 14+
-- Requires extensions: uuid-ossp, pg_trgm

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

-- Users table - Core user account data
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth0_user_id VARCHAR(255) UNIQUE NOT NULL, -- Auth0 'sub' claim (e.g., "auth0|507f1f77bcf86cd799439011")
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,

    -- Personal Information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2), -- US state code
    zip_code VARCHAR(10),
    congressional_district VARCHAR(10), -- e.g., "CA-12"
    state_senate_district VARCHAR(10),
    state_house_district VARCHAR(10),

    -- Demographics (optional)
    birth_year INTEGER,
    gender VARCHAR(50),
    marital_status VARCHAR(50),
    political_affiliation VARCHAR(50),
    education VARCHAR(100),
    profession VARCHAR(100),
    military_service BOOLEAN,
    constituent_description TEXT,

    -- Policy Interests (stored as JSONB for flexibility)
    policy_interests JSONB,
    -- Example: {"climateEnergyEnvironment": 3, "education": 2, "healthPolicy": 1}
    -- Values: 1 (low interest), 2 (medium), 3 (high)

    -- Voter Registration (via L2 Political)
    voter_registration_verified BOOLEAN DEFAULT FALSE,
    voter_registration_verified_at TIMESTAMP WITH TIME ZONE,
    l2_voter_id VARCHAR(50), -- L2 Political LALVOTERID

    -- Account Status
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'organization', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    suspended_at TIMESTAMP WITH TIME ZONE,
    suspended_by UUID REFERENCES users(id),
    suspension_reason TEXT,
    suspension_expires_at TIMESTAMP WITH TIME ZONE,

    -- Membership
    membership_tier VARCHAR(20) DEFAULT 'free' CHECK (membership_tier IN ('free', 'premium')),
    membership_start_date TIMESTAMP WITH TIME ZONE,
    membership_override BOOLEAN DEFAULT FALSE, -- For admin-granted free premium

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for users table
CREATE INDEX idx_users_auth0_id ON users(auth0_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_zip_code ON users(zip_code);
CREATE INDEX idx_users_state ON users(state);
CREATE INDEX idx_users_membership_tier ON users(membership_tier);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_l2_voter_id ON users(l2_voter_id) WHERE l2_voter_id IS NOT NULL;

-- Full-text search index for user search
CREATE INDEX idx_users_search ON users USING gin(
    (first_name || ' ' || last_name || ' ' || email) gin_trgm_ops
);

-- =====================================================
-- NOTE: Password reset is handled by Auth0, no need for password_reset_tokens table

-- =====================================================
-- Login History (for security and analytics)
CREATE TABLE login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_created_at ON login_history(created_at);

-- =====================================================
-- L2 Voter Lookup Cache (to reduce API calls and costs)
CREATE TABLE l2_voter_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Search Parameters (for cache key)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    birth_year INTEGER,

    -- L2 Response Data (minimal, privacy-focused)
    l2_voter_id VARCHAR(50) NOT NULL, -- LALVOTERID
    full_name VARCHAR(255),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    congressional_district VARCHAR(10),
    state_senate_district VARCHAR(10),
    state_house_district VARCHAR(10),
    party_affiliation VARCHAR(50),
    registration_status VARCHAR(20), -- Active, Inactive, etc.
    match_score INTEGER, -- Confidence score 0-100

    -- Cache Metadata
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',

    -- Composite unique constraint on search params
    UNIQUE(first_name, last_name, zip_code, birth_year)
);

CREATE INDEX idx_l2_cache_lookup ON l2_voter_cache(first_name, last_name, zip_code);
CREATE INDEX idx_l2_cache_expires ON l2_voter_cache(expires_at);

-- Auto-cleanup expired cache entries (run daily via cron)
-- DELETE FROM l2_voter_cache WHERE expires_at < NOW();

-- =====================================================
-- ORGANIZATIONS
-- =====================================================

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    description TEXT,
    website TEXT,

    -- Organization Details
    nonprofit_status VARCHAR(50), -- e.g., "501(c)(3)", "501(c)(4)"
    ein VARCHAR(20), -- Tax ID
    years_active INTEGER,
    focus_areas TEXT[], -- Array of focus areas

    -- Social Media
    social_media JSONB,
    -- Example: {"twitter": "@orgname", "facebook": "orgpage", "instagram": "@org"}

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    suspended_at TIMESTAMP WITH TIME ZONE,
    suspension_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_created_at ON organizations(created_at);

-- =====================================================
-- User-Organization Relationships
CREATE TABLE user_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
    -- admin: Can manage org settings and campaigns
    -- editor: Can only manage campaigns
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_org_id ON user_organizations(organization_id);

-- =====================================================
-- Organization Invitations
CREATE TABLE organization_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'editor',
    token UUID NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX idx_org_invitations_org_id ON organization_invitations(organization_id);

-- =====================================================
-- LEGISLATION DATA
-- =====================================================

-- Bills table (Federal legislation from Congress.gov)
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    congress INTEGER NOT NULL,
    type VARCHAR(10) NOT NULL, -- HR, S, HJRES, SJRES, HCONRES, SCONRES, HRES, SRES
    number VARCHAR(10) NOT NULL,
    title TEXT NOT NULL,
    short_title TEXT,

    -- Status & Dates
    introduced_date DATE,
    latest_action_date DATE,
    latest_action_text TEXT,
    status VARCHAR(50), -- introduced, in_committee, passed_house, passed_senate, to_president, became_law, etc.
    origin_chamber VARCHAR(10), -- house, senate

    -- Content
    summary TEXT,
    policy_area VARCHAR(255),
    subjects TEXT[], -- Array of subject tags

    -- External References
    congress_gov_url TEXT,

    -- Sponsor
    sponsor_bioguide_id VARCHAR(10),
    sponsor_name VARCHAR(255),
    sponsor_party VARCHAR(1), -- D, R, I
    sponsor_state VARCHAR(2),

    -- Metadata
    cosponsors_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(congress, type, number)
);

-- Indexes for bills
CREATE INDEX idx_bills_congress ON bills(congress);
CREATE INDEX idx_bills_type ON bills(type);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_policy_area ON bills(policy_area);
CREATE INDEX idx_bills_introduced_date ON bills(introduced_date DESC);
CREATE INDEX idx_bills_latest_action_date ON bills(latest_action_date DESC);
CREATE INDEX idx_bills_sponsor ON bills(sponsor_bioguide_id);

-- Full-text search index
CREATE INDEX idx_bills_search ON bills USING gin(
    to_tsvector('english', title || ' ' || COALESCE(summary, ''))
);

-- GIN index for subjects array
CREATE INDEX idx_bills_subjects ON bills USING gin(subjects);

-- Partitioning by congress for performance (optional, if dataset is huge)
-- Consider partitioning bills table by congress number for better query performance
-- Example: CREATE TABLE bills_119 PARTITION OF bills FOR VALUES IN (119);

-- =====================================================
-- Bill Summaries (AI-generated plain language)
CREATE TABLE bill_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    headline TEXT,
    explainer TEXT,
    support_statement TEXT,
    oppose_statement TEXT,
    closing_question TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bill_id)
);

CREATE INDEX idx_bill_summaries_bill_id ON bill_summaries(bill_id);

-- =====================================================
-- Cosponsors
CREATE TABLE bill_cosponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    bioguide_id VARCHAR(10) NOT NULL,
    name VARCHAR(255),
    party VARCHAR(1),
    state VARCHAR(2),
    is_original BOOLEAN DEFAULT FALSE,
    sponsored_date DATE,
    UNIQUE(bill_id, bioguide_id)
);

CREATE INDEX idx_cosponsors_bill_id ON bill_cosponsors(bill_id);
CREATE INDEX idx_cosponsors_bioguide_id ON bill_cosponsors(bioguide_id);

-- =====================================================
-- Committees
CREATE TABLE committees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    chamber VARCHAR(10) NOT NULL, -- house, senate
    type VARCHAR(50),
    parent_committee_id UUID REFERENCES committees(id),
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_committees_chamber ON committees(chamber);
CREATE INDEX idx_committees_parent ON committees(parent_committee_id);

-- =====================================================
-- Bill-Committee Assignments
CREATE TABLE bill_committees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    committee_id UUID NOT NULL REFERENCES committees(id),
    activity_type VARCHAR(50), -- referred, reported, discharged
    activity_date DATE,
    UNIQUE(bill_id, committee_id)
);

CREATE INDEX idx_bill_committees_bill_id ON bill_committees(bill_id);
CREATE INDEX idx_bill_committees_committee_id ON bill_committees(committee_id);

-- =====================================================
-- Committee Memberships
CREATE TABLE committee_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    committee_id UUID NOT NULL REFERENCES committees(id),
    bioguide_id VARCHAR(10) NOT NULL,
    name VARCHAR(255),
    party VARCHAR(1),
    state VARCHAR(2),
    role VARCHAR(50), -- chair, ranking_member, member
    rank INTEGER,
    UNIQUE(committee_id, bioguide_id)
);

CREATE INDEX idx_committee_memberships_committee ON committee_memberships(committee_id);
CREATE INDEX idx_committee_memberships_bioguide ON committee_memberships(bioguide_id);

-- =====================================================
-- State Bills (from LegiScan)
CREATE TABLE state_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state VARCHAR(2) NOT NULL,
    session_id INTEGER,
    bill_id VARCHAR(50), -- LegiScan bill ID
    bill_number VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,

    -- Status
    status VARCHAR(50),
    status_date DATE,

    -- Content
    url TEXT,
    state_link TEXT,

    -- Sponsor
    sponsor_name VARCHAR(255),
    sponsor_party VARCHAR(1),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(state, session_id, bill_number)
);

CREATE INDEX idx_state_bills_state ON state_bills(state);
CREATE INDEX idx_state_bills_status ON state_bills(status);
CREATE INDEX idx_state_bills_bill_number ON state_bills(bill_number);

-- Full-text search
CREATE INDEX idx_state_bills_search ON state_bills USING gin(
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- =====================================================
-- CONGRESS MEMBERS
-- =====================================================

-- Members table (Representatives and Senators)
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bioguide_id VARCHAR(10) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255),

    -- Current Position
    chamber VARCHAR(10), -- house, senate
    state VARCHAR(2),
    district INTEGER, -- NULL for senators
    party VARCHAR(1), -- D, R, I

    -- Contact
    office_address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website_url TEXT,

    -- Profile
    image_url TEXT,
    birth_date DATE,
    gender VARCHAR(10),

    -- Status
    current_member BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_members_bioguide_id ON members(bioguide_id);
CREATE INDEX idx_members_state ON members(state);
CREATE INDEX idx_members_chamber ON members(chamber);
CREATE INDEX idx_members_party ON members(party);
CREATE INDEX idx_members_current ON members(current_member);

-- Full-text search
CREATE INDEX idx_members_search ON members USING gin(
    (full_name || ' ' || COALESCE(email, '')) gin_trgm_ops
);

-- =====================================================
-- Member Terms
CREATE TABLE member_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bioguide_id VARCHAR(10) NOT NULL REFERENCES members(bioguide_id),
    congress INTEGER NOT NULL,
    chamber VARCHAR(10) NOT NULL,
    state VARCHAR(2) NOT NULL,
    district INTEGER,
    party VARCHAR(1),
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    UNIQUE(bioguide_id, congress, chamber)
);

CREATE INDEX idx_member_terms_bioguide ON member_terms(bioguide_id);
CREATE INDEX idx_member_terms_congress ON member_terms(congress);

-- =====================================================
-- Member Votes
CREATE TABLE member_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bioguide_id VARCHAR(10) NOT NULL,
    congress INTEGER NOT NULL,
    chamber VARCHAR(10) NOT NULL,
    roll_number INTEGER NOT NULL,
    vote_date DATE NOT NULL,
    question TEXT,
    position VARCHAR(20), -- Yes, No, Not Voting, Present
    bill_id UUID REFERENCES bills(id),
    UNIQUE(bioguide_id, congress, chamber, roll_number)
);

CREATE INDEX idx_member_votes_bioguide ON member_votes(bioguide_id);
CREATE INDEX idx_member_votes_bill_id ON member_votes(bill_id);
CREATE INDEX idx_member_votes_vote_date ON member_votes(vote_date DESC);

-- =====================================================
-- Campaign Finance (from FEC)
CREATE TABLE campaign_finance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bioguide_id VARCHAR(10) NOT NULL,
    cycle INTEGER NOT NULL, -- Election year (2024, 2026, etc.)
    fec_candidate_id VARCHAR(20),
    total_receipts DECIMAL(15, 2),
    total_disbursements DECIMAL(15, 2),
    cash_on_hand DECIMAL(15, 2),
    debt DECIMAL(15, 2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bioguide_id, cycle)
);

CREATE INDEX idx_campaign_finance_bioguide ON campaign_finance(bioguide_id);

-- =====================================================
-- ADVOCACY CAMPAIGNS
-- =====================================================

-- Campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    slug VARCHAR(255) NOT NULL,

    -- Campaign Type
    campaign_type VARCHAR(50) DEFAULT 'legislation' CHECK (campaign_type IN ('legislation', 'issue', 'candidate', 'candidate_advocacy')),

    -- Related Bill (for legislation campaigns)
    bill_id UUID REFERENCES bills(id),
    state_bill_id UUID REFERENCES state_bills(id),

    -- Issue Campaign Fields
    issue_title VARCHAR(255),
    issue_specific_title VARCHAR(255),
    issue_description TEXT,
    policy_area VARCHAR(100),

    -- Candidate Campaign Fields (for candidate/candidate_advocacy campaigns)
    candidate JSONB,
    -- Example: {
    --   "candidate1Name": "John Smith",
    --   "candidate1Bio": "Experienced senator with 12 years in office",
    --   "candidate2Name": "Jane Doe",
    --   "candidate2Bio": "Former governor and education advocate",
    --   "selectedCandidate": "candidate1"
    -- }

    -- Position
    position VARCHAR(20) CHECK (position IN ('support', 'oppose')),
    reasoning TEXT NOT NULL,

    -- Customization
    cta_text VARCHAR(100) DEFAULT 'Voice your opinion',
    image_url TEXT,

    -- Message Template
    message_template TEXT,

    -- Targeting (for issue campaigns)
    target_criteria JSONB,
    -- Example: {"states": ["CA", "NY"], "committees": ["HSHA"], "party": "D"}

    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended')),

    -- Engagement Counts
    support_count INTEGER DEFAULT 0,
    oppose_count INTEGER DEFAULT 0,

    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(organization_id, slug)
);

CREATE INDEX idx_campaigns_org_id ON campaigns(organization_id);
CREATE INDEX idx_campaigns_bill_id ON campaigns(bill_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_deleted_at ON campaigns(deleted_at);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);

-- Partial index to exclude deleted campaigns
CREATE INDEX idx_campaigns_active ON campaigns(status) WHERE deleted_at IS NULL;

-- =====================================================
-- Campaign Actions (user engagement with campaigns)
CREATE TABLE campaign_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL if anonymous
    position VARCHAR(20) NOT NULL, -- support, oppose
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaign_actions_campaign_id ON campaign_actions(campaign_id);
CREATE INDEX idx_campaign_actions_user_id ON campaign_actions(user_id);
CREATE INDEX idx_campaign_actions_created_at ON campaign_actions(created_at);

-- =====================================================
-- Campaign Edit History (audit trail)
CREATE TABLE campaign_edit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    edited_by UUID NOT NULL REFERENCES users(id),
    changes JSONB NOT NULL, -- {"field": "reasoning", "old": "...", "new": "..."}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaign_edit_history_campaign_id ON campaign_edit_history(campaign_id);

-- =====================================================
-- ADVOCACY MESSAGES
-- =====================================================

-- User messages to representatives
CREATE TABLE user_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for anonymous messages
    session_token UUID, -- For anonymous messages, links to account after signup
    bill_id UUID REFERENCES bills(id),
    state_bill_id UUID REFERENCES state_bills(id),
    campaign_id UUID REFERENCES campaigns(id), -- NULL if not from campaign

    -- Sender Information (stored for anonymous messages)
    sender_first_name VARCHAR(100),
    sender_last_name VARCHAR(100),
    sender_email VARCHAR(255),
    sender_address VARCHAR(255),
    sender_city VARCHAR(100),
    sender_state VARCHAR(2),
    sender_zip_code VARCHAR(10),

    -- Message Content
    position VARCHAR(20) CHECK (position IN ('support', 'oppose')),
    message_content TEXT NOT NULL,

    -- Recipients (stored as array for simplicity)
    recipient_bioguide_ids TEXT[] NOT NULL,

    -- Personal Data Included
    included_fields TEXT[], -- e.g., ["fullName", "address", "profession"]

    -- Attachments
    attachments JSONB,
    -- Example: [{"fileName": "doc.pdf", "fileUrl": "https://s3.amazonaws.com/..."}]

    -- Delivery
    delivery_method VARCHAR(20) DEFAULT 'email' CHECK (delivery_method IN ('email', 'postal', 'both')),
    delivery_status VARCHAR(20) DEFAULT 'queued' CHECK (delivery_status IN ('queued', 'sent', 'delivered', 'bounced', 'failed')),
    confirmation_number VARCHAR(50) UNIQUE,

    -- Timestamps
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_user_messages_user_id ON user_messages(user_id);
CREATE INDEX idx_user_messages_session_token ON user_messages(session_token) WHERE session_token IS NOT NULL;
CREATE INDEX idx_user_messages_bill_id ON user_messages(bill_id);
CREATE INDEX idx_user_messages_campaign_id ON user_messages(campaign_id);
CREATE INDEX idx_user_messages_sent_at ON user_messages(sent_at DESC);
CREATE INDEX idx_user_messages_status ON user_messages(delivery_status);

-- GIN index for recipients array
CREATE INDEX idx_user_messages_recipients ON user_messages USING gin(recipient_bioguide_ids);

-- Partitioning by sent_at for large datasets (optional)
-- Partition by month to improve query performance and archival
-- Example: CREATE TABLE user_messages_2025_01 PARTITION OF user_messages FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- =====================================================
-- Message Recipients (detailed tracking per recipient)
CREATE TABLE message_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES user_messages(id) ON DELETE CASCADE,
    bioguide_id VARCHAR(10) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    delivery_status VARCHAR(20) DEFAULT 'queued',
    delivered_at TIMESTAMP WITH TIME ZONE,
    bounce_reason TEXT,
    UNIQUE(message_id, bioguide_id)
);

CREATE INDEX idx_message_recipients_message_id ON message_recipients(message_id);
CREATE INDEX idx_message_recipients_bioguide_id ON message_recipients(bioguide_id);

-- =====================================================
-- Official Responses (from representatives)
CREATE TABLE official_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES user_messages(id) ON DELETE CASCADE,
    from_bioguide_id VARCHAR(10) NOT NULL,
    from_name VARCHAR(255),
    response_text TEXT NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    helpful_rating INTEGER, -- 1-5 stars, or NULL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_official_responses_message_id ON official_responses(message_id);
CREATE INDEX idx_official_responses_bioguide_id ON official_responses(from_bioguide_id);

-- =====================================================
-- USER ENGAGEMENT
-- =====================================================

-- User watched bills
CREATE TABLE user_watched_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, bill_id)
);

CREATE INDEX idx_watched_bills_user_id ON user_watched_bills(user_id);
CREATE INDEX idx_watched_bills_bill_id ON user_watched_bills(bill_id);

-- =====================================================
-- User followed organizations
CREATE TABLE user_followed_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_followed_orgs_user_id ON user_followed_organizations(user_id);
CREATE INDEX idx_followed_orgs_org_id ON user_followed_organizations(organization_id);

-- =====================================================
-- SUBSCRIPTIONS & PAYMENTS
-- =====================================================

-- User subscriptions (Stripe)
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Stripe IDs
    stripe_customer_id VARCHAR(100) UNIQUE NOT NULL,
    stripe_subscription_id VARCHAR(100) UNIQUE NOT NULL,
    stripe_price_id VARCHAR(100) NOT NULL,

    -- Subscription Details
    status VARCHAR(20) NOT NULL, -- active, past_due, canceled, trialing
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id)
);

CREATE INDEX idx_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON user_subscriptions(current_period_end);

-- =====================================================
-- Payment history
CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id),

    -- Stripe IDs
    stripe_invoice_id VARCHAR(100) UNIQUE NOT NULL,
    stripe_payment_intent_id VARCHAR(100),

    -- Payment Details
    amount INTEGER NOT NULL, -- Amount in cents (e.g., 600 = $6.00)
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(20) NOT NULL, -- paid, pending, failed, refunded

    -- Timestamps
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_subscription_id ON payment_history(subscription_id);
CREATE INDEX idx_payment_history_status ON payment_history(status);
CREATE INDEX idx_payment_history_created_at ON payment_history(created_at DESC);

-- =====================================================
-- Payment failures
CREATE TABLE payment_failures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id),
    stripe_invoice_id VARCHAR(100),

    -- Failure Details
    amount INTEGER NOT NULL,
    failure_code VARCHAR(50),
    failure_message TEXT,

    -- Retry Info
    next_retry_at TIMESTAMP WITH TIME ZONE,
    attempt_count INTEGER DEFAULT 1,
    resolved BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_failures_user_id ON payment_failures(user_id);
CREATE INDEX idx_payment_failures_resolved ON payment_failures(resolved);
CREATE INDEX idx_payment_failures_next_retry ON payment_failures(next_retry_at);

-- =====================================================
-- Refunds
CREATE TABLE payment_refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payment_history(id),

    -- Stripe IDs
    stripe_refund_id VARCHAR(100) UNIQUE NOT NULL,

    -- Refund Details
    amount INTEGER NOT NULL, -- Amount refunded in cents
    reason VARCHAR(100),
    status VARCHAR(20), -- succeeded, pending, failed, canceled

    -- Admin Info
    processed_by UUID REFERENCES users(id), -- Admin who processed

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_refunds_payment_id ON payment_refunds(payment_id);
CREATE INDEX idx_refunds_stripe_refund_id ON payment_refunds(stripe_refund_id);

-- =====================================================
-- Account credits
CREATE TABLE account_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Stripe balance transaction
    stripe_balance_transaction_id VARCHAR(100),

    -- Credit Details
    amount INTEGER NOT NULL, -- Amount in cents
    reason TEXT NOT NULL,
    applied_to_invoice_id VARCHAR(100), -- Stripe invoice ID where credit was used

    -- Admin Info
    granted_by UUID REFERENCES users(id), -- Admin who granted

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credits_user_id ON account_credits(user_id);

-- =====================================================
-- Email preferences
CREATE TABLE user_email_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Digest Settings
    digest_enabled BOOLEAN DEFAULT FALSE,
    digest_frequency VARCHAR(20) CHECK (digest_frequency IN ('daily', 'weekly', 'monthly')),

    -- Topics (based on policy interests)
    topics TEXT[],

    -- Notifications
    notify_watched_bills BOOLEAN DEFAULT TRUE,
    notify_new_campaigns BOOLEAN DEFAULT TRUE,
    notify_responses BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id)
);

CREATE INDEX idx_email_prefs_user_id ON user_email_preferences(user_id);
CREATE INDEX idx_email_prefs_digest ON user_email_preferences(digest_enabled, digest_frequency);

-- =====================================================
-- Email delivery logs (from SendGrid/Mailgun webhooks)
CREATE TABLE email_delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES user_messages(id) ON DELETE SET NULL,

    -- Email Details
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),

    -- Status
    event VARCHAR(50) NOT NULL, -- delivered, bounce, dropped, spam_report, open, click
    reason TEXT, -- Bounce/drop reason

    -- Provider Info
    provider_message_id VARCHAR(255), -- SendGrid message ID

    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_logs_message_id ON email_delivery_logs(message_id);
CREATE INDEX idx_email_logs_event ON email_delivery_logs(event);
CREATE INDEX idx_email_logs_timestamp ON email_delivery_logs(timestamp DESC);

-- =====================================================
-- ADMIN & SYSTEM
-- =====================================================

-- Admin audit log
CREATE TABLE admin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL REFERENCES users(id),

    -- Action Details
    action_type VARCHAR(50) NOT NULL, -- suspend_user, approve_org, issue_refund, etc.
    entity_type VARCHAR(50), -- user, organization, subscription, etc.
    entity_id UUID,
    details JSONB, -- Full details of what changed

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_admin_id ON admin_audit_log(admin_user_id);
CREATE INDEX idx_audit_log_action_type ON admin_audit_log(action_type);
CREATE INDEX idx_audit_log_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON admin_audit_log(created_at DESC);

-- =====================================================
-- Error logs
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Error Details
    error_code VARCHAR(50),
    error_message TEXT NOT NULL,
    stack_trace TEXT,

    -- Request Context
    user_id UUID REFERENCES users(id),
    request_url TEXT,
    request_method VARCHAR(10),
    request_body TEXT,
    response_status INTEGER,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_error_code ON error_logs(error_code);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);

-- =====================================================
-- System settings (API keys, configuration)
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL, -- Encrypted for sensitive values
    description TEXT,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- API usage logs (for external API monitoring)
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service VARCHAR(50) NOT NULL, -- congress_gov, legiscan, census, fec, openai, l2_political
    endpoint VARCHAR(255),
    success BOOLEAN DEFAULT TRUE,
    response_time INTEGER, -- Milliseconds
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_logs_service ON api_usage_logs(service);
CREATE INDEX idx_api_logs_created_at ON api_usage_logs(created_at);

-- Query for L2 Political usage monitoring (cost tracking):
-- SELECT DATE(created_at) as date, COUNT(*) as lookups,
--        SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful
-- FROM api_usage_logs
-- WHERE service = 'l2_political'
-- GROUP BY DATE(created_at)
-- ORDER BY date DESC;

-- =====================================================
-- Email templates
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL, -- welcome_email, password_reset, etc.
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL, -- HTML template with variables
    variables TEXT[], -- List of available variables: {firstName}, {resetLink}, etc.
    version INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS (for common queries)
-- =====================================================

-- Active campaigns with organization info
CREATE VIEW active_campaigns AS
SELECT
    c.id,
    c.slug,
    c.campaign_type,
    c.position,
    c.reasoning,
    c.support_count,
    c.oppose_count,
    c.created_at,
    o.id AS organization_id,
    o.name AS organization_name,
    o.slug AS organization_slug,
    o.logo_url AS organization_logo_url,
    b.congress,
    b.type AS bill_type,
    b.number AS bill_number,
    b.title AS bill_title
FROM campaigns c
JOIN organizations o ON c.organization_id = o.id
LEFT JOIN bills b ON c.bill_id = b.id
WHERE c.status = 'active' AND c.deleted_at IS NULL AND o.status = 'active';

-- User message statistics
CREATE VIEW user_message_stats AS
SELECT
    user_id,
    COUNT(*) AS total_messages,
    COUNT(DISTINCT bill_id) AS bills_engaged,
    SUM(CASE WHEN position = 'support' THEN 1 ELSE 0 END) AS supported_count,
    SUM(CASE WHEN position = 'oppose' THEN 1 ELSE 0 END) AS opposed_count,
    COUNT(DISTINCT unnest(recipient_bioguide_ids)) AS representatives_contacted
FROM user_messages
GROUP BY user_id;

-- =====================================================
-- MIGRATION NOTES FROM FIREBASE
-- =====================================================

/*
DATA MIGRATION & SETUP STRATEGY:

NOTE: This is a new application using Auth0 and AWS. No Firebase migration needed.

1. Initial Database Setup
   - Create PostgreSQL database on AWS RDS
   - Run this schema file to create all tables and indexes
   - Set up automated backups (AWS RDS backup window)
   - Configure read replicas if needed for scaling

2. Auth0 Setup
   - Create Auth0 tenant
   - Configure Auth0 Application (Regular Web Application)
   - Set up Auth0 Database Connection (email/password)
   - Enable social connections (Google, etc.)
   - Create Auth0 API with identifier (for JWT validation)
   - Configure Auth0 Rules/Actions for custom claims:
     * Add user role to JWT
     * Add membership tier to JWT
     * Add internal user UUID to JWT
   - Set up email templates in Auth0
   - Configure password policy

3. AWS Services Setup
   - Set up AWS RDS PostgreSQL instance
   - Set up AWS ElastiCache Redis instance
   - Create S3 bucket for file uploads (attachments, org logos)
   - Configure AWS SES for email sending:
     * Verify domain
     * Request production access (remove sandbox limits)
     * Create email templates
   - Set up CloudFront CDN for static assets
   - Configure IAM roles and permissions

4. Reference Data Population
   - Initial sync of bills from Congress.gov API
     * Fetch bills for current Congress
     * Generate AI summaries for each bill
     * Store in `bills` and `bill_summaries` tables
   - Initial sync of Congress members
     * Fetch all current members from Congress.gov
     * Store in `members` table with contact info
   - Sync state bills from LegiScan (if using state features)
   - Sync committee data from Congress.gov

5. User Account Creation Flow (Auth0 + PostgreSQL)
   - User signs up via Auth0 Universal Login
   - Auth0 creates user and returns JWT with `sub` (Auth0 user ID)
   - Backend receives JWT, validates it
   - Backend creates user record in PostgreSQL:
     * `auth0_user_id` = Auth0 `sub`
     * `email` = Auth0 email
     * `email_verified` = Auth0 email_verified
   - Backend adds custom claims to user session (role, membership)
   - If user just sent anonymous message:
     * Link message using `session_token`
     * Update `user_messages.user_id` = new user ID

6. Anonymous Message Linking
   - When anonymous user sends message:
     * Generate `session_token` (UUID)
     * Store message with `user_id` = NULL, `session_token` = UUID
     * Return `session_token` to frontend (store in localStorage)
   - After signup:
     * Frontend sends `session_token` to `/auth/link-anonymous-session`
     * Backend updates messages: `user_id` = current user, `session_token` = NULL

7. Validation & Testing
   - Test Auth0 signup/login flows
   - Test anonymous message sending
   - Test account linking after signup
   - Test Stripe subscription creation
   - Test email delivery via AWS SES
   - Load test with expected traffic (1000 concurrent users)

8. Monitoring Setup
   - AWS CloudWatch for database metrics
   - AWS CloudWatch Logs for application logs
   - Auth0 logs for authentication events
   - Sentry for error tracking
   - Uptime monitoring (Pingdom, UptimeRobot)
   - Set up alerts for:
     * Database CPU/memory > 80%
     * API error rate > 1%
     * Email bounce rate > 5%
     * Payment failures
*/

-- =====================================================
-- PERFORMANCE OPTIMIZATION
-- =====================================================

/*
PERFORMANCE TIPS:

1. Partitioning
   - Partition bills table by congress (if > 10M rows)
   - Partition user_messages by sent_at (monthly)
   - Partition email_delivery_logs by timestamp

2. Indexes
   - Monitor slow queries with pg_stat_statements
   - Add indexes for common WHERE, JOIN, ORDER BY columns
   - Use partial indexes for filtered queries (e.g., active campaigns)
   - Use GIN indexes for JSONB, arrays, full-text search

3. Caching
   - Use Redis for frequently accessed data
   - Cache bills list, member data, campaign analytics
   - Set TTL based on data volatility

4. Query Optimization
   - Use EXPLAIN ANALYZE to identify slow queries
   - Avoid N+1 queries (use JOINs or batch loading)
   - Use materialized views for complex aggregations
   - Use connection pooling (e.g., PgBouncer)

5. Monitoring
   - Set up pg_stat_statements for query performance
   - Monitor table bloat and run VACUUM ANALYZE regularly
   - Set up alerts for slow queries, high CPU, low disk space

6. Backup & Recovery
   - Daily full backups
   - Continuous WAL archiving
   - Test restore procedures regularly
   - Consider point-in-time recovery
*/

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================

/*
-- Insert sample user (note: auth0_user_id comes from Auth0 after signup)
INSERT INTO users (auth0_user_id, email, first_name, last_name, state, zip_code, role)
VALUES (
    'auth0|507f1f77bcf86cd799439011', -- Auth0 'sub' claim
    'admin@example.com',
    'Admin',
    'User',
    'IL',
    '60601',
    'admin'
);

-- Insert sample organization
INSERT INTO organizations (slug, name, description, status)
VALUES (
    'common-cause',
    'Common Cause',
    'A nonpartisan grassroots organization...',
    'active'
);

-- Insert sample bill
INSERT INTO bills (congress, type, number, title, introduced_date, status, policy_area)
VALUES (
    119,
    'HR',
    '1',
    'For the People Act of 2025',
    '2025-01-03',
    'in_committee',
    'Government Operations'
);
*/

-- =====================================================
-- END OF SCHEMA
-- =====================================================

-- To apply this schema:
-- psql -U postgres -d advocacy_db -f database-schema.sql

-- To backup:
-- pg_dump -U postgres advocacy_db > backup.sql

-- To restore:
-- psql -U postgres advocacy_db < backup.sql
