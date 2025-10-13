# Sprint Schedule: 18-Week Launch

**Project:** Advocacy Platform
**Launch Strategy:** Full-featured launch with transactional email only (defer notification emails)

**Team Composition:**

- 1 Frontend Developer (FE)
- 1 Backend Developer (BE)
- 1 Tech Lead (TL)
- 1 Designer (UX)
- 1 Project Manager/Tester (PM)

**Sprint Duration:** 2 weeks
**Story Points Scale:** Fibonacci (1, 2, 3, 5, 8, 13, 21)

**Story Point Definitions:**

- **1 point** - Trivial task, minimal complexity, well-understood problem (e.g., simple UI tweak, basic configuration)
- **2 points** - Simple task, straightforward implementation, clear requirements (e.g., single component, basic form)
- **3 points** - Moderate task, some complexity, may require research or coordination (e.g., API integration, multi-step feature)
- **5 points** - Complex task, multiple components, dependencies or unknowns (e.g., authentication flow, data sync)
- **8 points** - Very complex, significant effort, architectural decisions (e.g., major feature, complex integration)
- **13 points** - Highly complex, substantial implementation, high risk or uncertainty (e.g., payment system, analytics platform)
- **21 points** - Extremely complex, consider breaking down into smaller tasks (e.g., major subsystem, multiple integrations)

**Launch Timeline:** 9 sprints (18 weeks) to launch | 367 story points (58 pts deferred to post-launch)

---

## APIs & Services (Production Architecture)

**Note:** Production will be built from scratch with a custom backend. All external APIs will be accessed through backend services, not directly from the frontend.

### Infrastructure & Core Services:

- **Auth0** - User authentication and authorization (Sprint 0)
- **PostgreSQL on AWS RDS** - Primary database (Sprint 0)
- **AWS S3** - Image upload and storage (Sprint 4)
- **AWS SES** - Email delivery service (Sprint 6)

### External APIs (Backend Integration):

- **Congress.gov API** - Federal legislation, members, votes, amendments (Sprint 0)
- **Geocodio API** - ZIP code to congressional district mapping (Sprint 0)
- **FEC API** - Federal Election Commission campaign finance data (Sprint 1)
- **AWS Bedrock Agent** - AI for message generation and summaries (Sprint 2)
- **LegiScan API** - Texas state legislation only (~$200-300/month) (Sprint 2)
- **Stripe API** - Payment processing and subscription management (Sprint 3)
- **L2 Political API** - Voter demographics and voter verification (Sprint 3 & 4)

---

## Sprint 0: Foundation & Authentication (Weeks 1-2)

**Goal:** Establish authentication, basic infrastructure, and core user flows

### US-017: Create Account (Post-Message Flow)

**Total Story Points: 9**

| Role         | Task                                                                                | Story Points |
| ------------ | ----------------------------------------------------------------------------------- | ------------ |
| **UX** | Design signup flow, account creation screens, email verification states             | **2**  |
| **FE** | Auth0 integration, signup forms, email verification UI, session management          | **3**  |
| **BE** | User creation API, Auth0 webhook handlers, session token linking, PostgreSQL schema | **2**  |
| **TL** | Auth0 configuration, security review, session strategy                              | **1**  |
| **PM** | Test signup flows, email verification, edge cases                                   | **1**  |

**Technical Notes:**

- Use Auth0 for authentication (OAuth2/OpenID Connect)
- Store user profiles in PostgreSQL
- Implement anonymous session tracking for pre-signup messages

---

### US-018: Login & Password Reset

**Total Story Points: 5**

| Role         | Task                                                                  | Story Points |
| ------------ | --------------------------------------------------------------------- | ------------ |
| **UX** | Design login screen, password reset flow                              | **1**  |
| **FE** | Auth0 login integration, redirect handling, "Remember me" persistence | **2**  |
| **BE** | JWT validation, Auth0 webhook handlers, password reset endpoints      | **1**  |
| **TL** | Security configuration, token management, session expiry              | **1**  |
| **PM** | Test login, password reset, session persistence, security             | **1**  |

---

### US-019: Update Profile & Set Location

**Total Story Points: 5**

| Role         | Task                                                                               | Story Points |
| ------------ | ---------------------------------------------------------------------------------- | ------------ |
| **UX** | Design profile form, location detection UI, US map component                       | **1**  |
| **FE** | Profile forms, Geocodio API integration for ZIP lookup, validation, US map display | **2**  |
| **BE** | Profile update API, Geocodio service integration, congressional district mapping   | **2**  |
| **TL** | Review geolocation approach, privacy considerations, API rate limiting             | **1**  |
| **PM** | Test profile updates, location detection accuracy, validation rules                | **1**  |

**Technical Notes:**

- Use Geocodio API for ZIP to district mapping
- Cache district lookups to reduce API calls

---

### US-004: View Federal Bill Details (Basic)

**Total Story Points: 8**

| Role         | Task                                                                                  | Story Points |
| ------------ | ------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design bill detail page layout, information hierarchy, action buttons                 | **2**  |
| **FE** | Bill detail page component, related bills display, action buttons, responsive design  | **3**  |
| **BE** | Congress.gov API integration, bill data sync, caching with Redis, related bills query | **3**  |
| **TL** | API integration architecture, caching design (Redis), data model review               | **2**  |
| **PM** | Test bill display, data accuracy, loading states, API errors                          | **1**  |

**Technical Notes:**

- Congress.gov API for bill data
- Cache bills in Redis for 1 hour
- Implement background sync for active bills stored in PostgreSQL

---

### Infrastructure Setup

**Total Story Points: 13**

| Role         | Task                                                                                                     | Story Points |
| ------------ | -------------------------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design component library, design system documentation                                                    | **2**  |
| **FE** | Next.js 14 setup, shadcn/ui components, routing structure, global styles                                 | **3**  |
| **BE** | PostgreSQL on AWS RDS setup, Prisma ORM configuration, API route structure, middleware                   | **3**  |
| **TL** | AWS infrastructure setup (RDS, S3, SES), CI/CD pipeline (GitHub Actions), environment config, monitoring | **5**  |
| **PM** | Document setup process, create testing environments, QA checklist                                        | **2**  |

**Technical Notes:**

- Deploy Next.js application (host TBD - Vercel or AWS)
- PostgreSQL on AWS RDS for database
- Auth0 for authentication
- Use GitHub Actions for CI/CD

---

**Sprint 0 Total: 40 story points**

---

## Sprint 1: Core User Features & Discovery (Weeks 3-4)

**Goal:** Enable users to browse core content and explore advocacy organizations

### US-001: View Home Feed with Filters (MVP)

**Total Story Points: 13**

| Role         | Task                                                                                             | Story Points |
| ------------ | ------------------------------------------------------------------------------------------------ | ------------ |
| **UX** | Design homepage layout, feed tabs UI, filter components, info grid                               | **2**  |
| **FE** | Homepage components, tab system, filter UI, infinite scroll, loading states                      | **5**  |
| **BE** | Feed API endpoints, sorting/filtering logic, pagination, PostgreSQL queries with Prisma, caching | **5**  |
| **TL** | Feed algorithm design, performance optimization, caching strategy                                | **2**  |
| **PM** | Test feed loading, filtering accuracy, pagination, edge cases, performance                       | **2**  |

**Technical Notes:**

- Aggregate bills, news, and campaigns from PostgreSQL
- Implement cursor-based pagination for infinite scroll
- Cache feed for anonymous users (30 min), personalize for logged-in

---

### US-002: Browse Policy-Specific Content

**Total Story Points: 8**

| Role         | Task                                                                                  | Story Points |
| ------------ | ------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design policy issue page, adapt homepage components for filtered view                 | **1**  |
| **FE** | Policy page template, filtered feed integration, US map component, breadcrumbs        | **3**  |
| **BE** | Policy filtering API, category mapping (Congress.gov → 20 categories), static routes | **3**  |
| **TL** | Review category taxonomy, SEO configuration for 20 policy pages                       | **1**  |
| **PM** | Test all 20 policy pages, filtering accuracy, SEO metadata                            | **1**  |

**Technical Notes:**

- Map Congress.gov policy areas to 20 platform categories
- Generate static routes for all categories at build time
- Cache policy feeds for 1 hour

---

### US-003: Browse Federal Bills by Category

**Total Story Points: 5**

| Role         | Task                                                                           | Story Points |
| ------------ | ------------------------------------------------------------------------------ | ------------ |
| **UX** | Design bill list, filter checkboxes, category badges, count indicators         | **1**  |
| **FE** | Bill list component, multi-select filters, category pills, sorting UI          | **2**  |
| **BE** | Bill query endpoints with category filters, aggregation for counts             | **2**  |
| **TL** | Review query optimization, indexing strategy                                   | **1**  |
| **PM** | Test bill filtering, category counts accuracy, performance with large datasets | **1**  |

---

### US-009: Browse Organizations

**Total Story Points: 3**

| Role         | Task                                                    | Story Points |
| ------------ | ------------------------------------------------------- | ------------ |
| **UX** | Design organization list page, org cards with stats     | **1**  |
| **FE** | Organization list page, filtering UI, sorting dropdown  | **1**  |
| **BE** | Organization query API, campaign aggregations for stats | **1**  |
| **PM** | Test organization listing, filters, sorting             | **1**  |

---

### US-010: View Organization Profile

**Total Story Points: 5**

| Role         | Task                                                                            | Story Points |
| ------------ | ------------------------------------------------------------------------------- | ------------ |
| **UX** | Design org profile page, impact stats display, campaign list section            | **1**  |
| **FE** | Org profile page, stats widgets, campaign cards grid                           | **2**  |
| **BE** | Org profile API, campaign aggregations, SEO metadata generation                | **2**  |
| **TL** | Review caching strategy for org pages, CDN configuration                        | **1**  |
| **PM** | Test org profiles, stats accuracy, SEO tags, responsive design                  | **1**  |

---

### US-015: View Dashboard Overview

**Total Story Points: 8**

| Role         | Task                                                                                     | Story Points |
| ------------ | ---------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design dashboard layout, activity summary cards, navigation, mobile responsive           | **2**  |
| **FE** | Dashboard page, activity widgets, message history table                                 | **3**  |
| **BE** | Dashboard aggregation APIs, message history queries, recent activity summaries          | **3**  |
| **TL** | Review dashboard performance, caching for aggregations, query optimization               | **1**  |
| **PM** | Test dashboard data accuracy, loading performance, responsive design                     | **1**  |

---

**Sprint 1 Total: 42 story points**

---

## Sprint 2: Advocacy Messaging & News (Weeks 5-6)

**Goal:** Enable users to send advocacy messages and engage with news

### US-013: Send Advocacy Message - Basic Flows (Flows 1, 5)

**Total Story Points: 13**

| Role         | Task                                                                                                     | Story Points |
| ------------ | -------------------------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design message composer, recipient selection UI, preview screen, confirmation                            | **3**  |
| **FE** | Message form with validation, ZIP lookup (Geocodio), rep selection, attachment upload (5MB max), preview | **5**  |
| **BE** | Message submission API, Geocodio rep lookup, email delivery (temp mock), message storage in PostgreSQL   | **5**  |
| **TL** | Email delivery architecture planning, tracking system design, security review                            | **2**  |
| **PM** | Test message submission, delivery confirmation, anonymous flow, account linking                          | **2**  |

**Technical Notes:**

- Use Geocodio API for representative lookup by ZIP
- Store messages in PostgreSQL with anonymous session token
- Mock email delivery for now (production SES lands in Sprints 6-7)

---

### US-014: AI-Assisted Message Drafting

**Total Story Points: 8**

| Role         | Task                                                                                          | Story Points |
| ------------ | --------------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design AI help button, generation UI with loading states, regenerate option                   | **1**  |
| **FE** | AI generation UI, message editing textarea, regeneration button, loading skeleton             | **2**  |
| **BE** | AWS Bedrock Agent integration, prompt engineering for bill context, response parsing, caching | **5**  |
| **TL** | AWS Bedrock configuration, cost optimization, prompt design review                            | **2**  |
| **PM** | Test AI generation quality, context accuracy, error handling, regeneration                    | **1**  |

**Technical Notes:**

- Use AWS Bedrock Agent for AI-powered message generation
- Cache generated messages for 24 hours (same context + position) in Redis
- Implement rate limiting per user

---

### US-006: View Grouped News Story

**Total Story Points: 8**

| Role         | Task                                                                                          | Story Points |
| ------------ | --------------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design news story detail page, source grouping display, AI overview section                   | **2**  |
| **FE** | News detail page, source list with logos, related bills section, CTA buttons                  | **3**  |
| **BE** | News grouping algorithm (headline similarity), news_story_groups in PostgreSQL, API endpoints | **3**  |
| **TL** | Review grouping algorithm (cosine similarity), performance optimization                       | **1**  |
| **PM** | Test news grouping accuracy, page performance, related bills logic                            | **1**  |

**Technical Notes:**

- Group news articles by headline similarity and date proximity (48 hrs)
- Use simple keyword matching for MVP (upgrade to NLP later)

---

### US-007: View AI News Overview

**Total Story Points: 5**

| Role         | Task                                                                                                   | Story Points |
| ------------ | ------------------------------------------------------------------------------------------------------ | ------------ |
| **UX** | Design AI overview section with tabs (Overview/Sources), disclaimer UI                                 | **1**  |
| **FE** | AI overview component, tab switching, loading states, expandable sections                              | **2**  |
| **BE** | AI overview generation with AWS Bedrock, multi-source synthesis, caching (6 hours), regeneration logic | **3**  |
| **TL** | Review AI prompt design for news synthesis, quality checks                                             | **1**  |
| **PM** | Test overview quality, regeneration triggers, caching behavior                                         | **1**  |

---

### US-008: Take Action from News Story

**Total Story Points: 3**

| Role         | Task                                                                           | Story Points |
| ------------ | ------------------------------------------------------------------------------ | ------------ |
| **UX** | Design "Voice Opinion" CTA button integration on news page                     | **1**  |
| **FE** | Connect news page to message composer, pre-fill news context, link UI          | **1**  |
| **BE** | Pass news context to message API, link messages to news_story_id in PostgreSQL | **1**  |
| **PM** | Test news-to-message flow, context passing accuracy                            | **1**  |

---

### US-005: View Texas State Bill Details

**Total Story Points: 5**

| Role         | Task                                                                              | Story Points |
| ------------ | --------------------------------------------------------------------------------- | ------------ |
| **UX** | Adapt federal bill design for Texas state bills                                   | **1**  |
| **FE** | Texas bill detail page, LegiScan data display, TX legislature links               | **1**  |
| **BE** | LegiScan API integration for TX only, daily sync for TX session, category mapping | **2**  |
| **TL** | Review LegiScan integration, TX sync strategy                                     | **1**  |
| **PM** | Test TX bill display, data accuracy for TX legislature                            | **1**  |

**Technical Notes:**

- LegiScan API for **Texas only** (not all 50 states)
- Daily sync during active Texas legislative session (140 days, every 2 years)
- Map LegiScan subjects to 20 platform categories
- Texas Legislature: Bicameral (31 Senate, 150 House), meets in odd-numbered years

---

**Sprint 2 Total: 42 story points**

---

## Sprint 3: Premium Membership - Simplified (Weeks 7-8)

**Goal:** Enable users to subscribe to premium tier with core features and voter verification

**Note:** US-022 (Political Views) and US-023 (Customized Feed) have been deferred to post-launch to reduce complexity and balance workload.

### US-016: Verify Voter Registration (L2 Political)

**Total Story Points: 13**

| Role         | Task                                                                                           | Story Points |
| ------------ | ---------------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design voter verification flow, match results display, verification badge                     | **2**  |
| **FE** | Verification form, L2 API result display, verification status in profile                       | **5**  |
| **BE** | L2 Political API integration, voter lookup, store L2 data in JSONB, verification logic        | **5**  |
| **TL** | L2 API architecture, privacy requirements, data storage design (698 L2 variables)              | **2**  |
| **PM** | Test voter lookup, data accuracy, privacy compliance, verification badge display               | **2**  |

**Technical Notes:**

- L2 Political VoterMapping API for voter registration verification
- Store complete L2 VM2 dataset (698 variables) in `users.l2_voter_data` JSONB
- Cache lookups 30 days per user
- User sees basic verification only, full data used for org analytics (anonymized)

---

### US-020: View & Subscribe to Premium Membership

**Total Story Points: 13**

| Role         | Task                                                                                           | Story Points |
| ------------ | ---------------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design membership comparison page, pricing display, Stripe checkout flow                       | **2**  |
| **FE** | Membership page, Stripe Elements integration, subscription confirmation UI                     | **5**  |
| **BE** | Stripe integration, subscription creation API, webhook handlers, subscription management       | **5**  |
| **TL** | Stripe architecture review, webhook security, payment failure handling strategy                | **2**  |
| **PM** | Test subscription flow, payment processing, webhook events, confirmation emails                | **2**  |

**Technical Notes:**

- Stripe integration for quarterly billing ($6 every 3 months)
- Handle webhooks: checkout.session.completed, invoice.payment_succeeded/failed, customer.subscription.deleted
- Set `membership_tier` = 'premium' in users table

---

### US-021: Manage Subscription

**Total Story Points: 8**

| Role         | Task                                                                                           | Story Points |
| ------------ | ---------------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design subscription management page, payment method update UI, cancel flow                     | **1**  |
| **FE** | Subscription details display, payment method update, cancellation UI with confirmation         | **3**  |
| **BE** | Subscription update API, payment method update via Stripe, cancellation logic, invoice history | **3**  |
| **TL** | Review cancellation flow, pro-rating logic, data retention on cancel                           | **1**  |
| **PM** | Test subscription updates, payment method changes, cancellation, edge cases                    | **1**  |

---

### US-024: View Advocacy Impact Analytics (Premium)

**Total Story Points: 5**

| Role         | Task                                                                                           | Story Points |
| ------------ | ---------------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design personal analytics dashboard, impact metrics display, charts                            | **1**  |
| **FE** | Analytics page with Recharts, filter UI, export functionality                                  | **2**  |
| **BE** | Aggregate user message history, calculate impact scores, success rates, CSV export             | **2**  |
| **TL** | Review analytics calculations, performance optimization                                        | **1**  |
| **PM** | Test analytics accuracy, chart rendering, date filters, CSV export                             | **1**  |

---

**Sprint 3 Total: 39 story points** (reduced from 60 - deferred US-022 and US-023 to post-launch)

---

## Sprint 4: Organization Portal - Foundations (Weeks 9-10)

**Goal:** Enable organizations to create and manage campaigns

### ORG-001: Organization Login & Team Management

**Total Story Points: 8**

| Role         | Task                                                                                           | Story Points |
| ------------ | ---------------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design org portal navigation, team invite flow, role selection UI                              | **2**  |
| **FE** | Org portal layout, team management UI, invitation system, multi-org switcher                   | **3**  |
| **BE** | Org access control (role-based), invitation system with tokens, role management (admin/editor) | **3**  |
| **TL** | Review multi-org architecture, permissions model, security                                     | **1**  |
| **PM** | Test org login, team invites flow, role permissions enforcement                                | **1**  |

---

### ORG-002: View & Edit Organization Profile

**Total Story Points: 5**

| Role         | Task                                                                               | Story Points |
| ------------ | ---------------------------------------------------------------------------------- | ------------ |
| **UX** | Design org settings page, profile editor with logo upload                          | **1**  |
| **FE** | Org profile edit form, logo upload UI (drag & drop), settings tabs                 | **2**  |
| **BE** | Org profile update API, image upload to AWS S3, cache invalidation for public page | **2**  |
| **TL** | Review image storage strategy (AWS S3 integration), CDN setup                      | **1**  |
| **PM** | Test profile updates, logo upload (size limits, formats), public page updates      | **1**  |

**Technical Notes:**

- Implement AWS S3 for image storage (new integration)
- Max logo size: 2MB, formats: PNG, JPG, SVG

---

### ORG-003: Create Campaign (Bill, Issue, Candidate)

**Total Story Points: 21**

| Role         | Task                                                                                                           | Story Points |
| ------------ | -------------------------------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design campaign creation wizard (3 types), date pickers, validation states                                     | **3**  |
| **FE** | Campaign forms (Bill/Issue/Candidate), bill search with Congress API, date validation, image upload            | **8**  |
| **BE** | Campaign creation API, bill search endpoint, campaign types logic (3 types), date validation, visibility rules | **8**  |
| **TL** | Design campaign data model (flexible for 3 types), validation rules, visibility logic (dates + status)         | **3**  |
| **PM** | Test all 3 campaign types, validation rules, visibility logic, date handling                                   | **3**  |

**Technical Notes:**

- Campaign types: Legislation (federal/state), Issue, Candidate
- Required: start_date, end_date (must be valid range)
- Visibility: Active + NOT paused + current_date between dates

---

### US-013: Send Advocacy Message - Campaign Flow (Flow 2)

**Total Story Points: 5**

| Role         | Task                                                                                      | Story Points |
| ------------ | ----------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design campaign-to-message integration, org branding in composer                          | **1**  |
| **FE** | Campaign message composer, pre-filled context UI, org logo/name display                   | **2**  |
| **BE** | Campaign context API endpoint, message-campaign linking (campaign_id), analytics tracking | **2**  |
| **TL** | Review campaign tracking for analytics, data model                                        | **1**  |
| **PM** | Test campaign message flow, context accuracy, campaign tracking                           | **1**  |

---

### US-013: Send Advocacy Message - Remaining Flows (Flows 3, 4)

**Total Story Points: 5**

| Role         | Task                                                                   | Story Points |
| ------------ | ---------------------------------------------------------------------- | ------------ |
| **UX** | Design news-to-message and policy-to-message flows, context display    | **1**  |
| **FE** | Integrate message composer from news/policy pages, context pre-fill    | **2**  |
| **BE** | Context passing for news_story_id and policy_category, message linking | **1**  |
| **PM** | Test news and policy message flows, context passing                    | **1**  |

---

**Sprint 4 Total: 44 story points**

---

## Sprint 5: Campaign Management & Analytics (Weeks 11-12)

**Goal:** Enable organizations to manage campaigns and view performance

### ORG-004: Edit & Pause Campaigns

**Total Story Points: 8**

| Role         | Task                                                                                       | Story Points |
| ------------ | ------------------------------------------------------------------------------------------ | ------------ |
| **UX** | Design campaign edit UI, pause/resume controls with confirmation dialogs                   | **1**  |
| **FE** | Campaign edit form, pause/resume toggle with optimistic updates, edit history display      | **3**  |
| **BE** | Campaign update API, pause logic (isPaused flag), edit history logging, cache invalidation | **3**  |
| **TL** | Review edit permissions (admin only), audit logging strategy                               | **1**  |
| **PM** | Test campaign edits, pause/resume flow, visibility changes, audit trail                    | **1**  |

---

### ORG-007: Copy Campaign Link

**Total Story Points: 2**

| Role         | Task                                                                               | Story Points |
| ------------ | ---------------------------------------------------------------------------------- | ------------ |
| **UX** | Design copy link button, success toast notification                                | **1**  |
| **FE** | Copy link button with Clipboard API, toast notification, fallback for old browsers | **1**  |
| **BE** | Ensure campaign slugs are unique (validation), landing page route                  | **1**  |
| **PM** | Test link copying across browsers, campaign landing page access                    | **1**  |

---

### ORG-005: View Campaign Performance Analytics with L2 Demographics

**Total Story Points: 21**

| Role         | Task                                                                                           | Story Points |
| ------------ | ---------------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design analytics dashboard with demographic charts, data visualization layouts                 | **3**  |
| **FE** | Analytics dashboard components, chart library (Recharts), filters, segments, pagination        | **8**  |
| **BE** | Analytics aggregation from user actions + L2 data, privacy enforcement (min 5 users), caching  | **8**  |
| **TL** | Design analytics queries (PostgreSQL aggregations), privacy controls, performance optimization | **3**  |
| **PM** | Test analytics accuracy, demographics display, privacy enforcement, performance                | **3**  |

**Technical Notes:**

- Extract L2 data from user profiles in PostgreSQL for campaign participants
- Show aggregated demographics: age, gender, party, voter history, etc.
- Privacy: Never show individual data, minimum 5 users per segment
- Cache analytics for 10 minutes in Redis

---

### ORG-006: View Campaign Emails & Message Count

**Total Story Points: 8**

| Role         | Task                                                                                   | Story Points |
| ------------ | -------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design email analytics page, message list table, demographic filters                   | **1**  |
| **FE** | Email analytics page, message list with pagination, demographic filter UI              | **3**  |
| **BE** | Message query API by campaign_id, demographic joins (user data), filtering, pagination | **3**  |
| **TL** | Review query performance for large message sets, indexing                              | **1**  |
| **PM** | Test email list, filters accuracy, message details, pagination                         | **1**  |

---

### DOC-001: Design System Documentation Foundations

**Total Story Points: 2**

| Role         | Task                                                                      | Story Points |
| ------------ | ------------------------------------------------------------------------- | ------------ |
| **UX** | Document design system components, interaction patterns, and usage guidelines | **1**  |
| **TL** | Review and publish design documentation alongside component library updates    | **1**  |

---

**Sprint 5 Total: 41 story points**

---

## Sprint 6: Admin Panel & Email Infrastructure (Weeks 13-14)

**Goal:** Deliver core admin tools and stand up transactional email infrastructure

**Note:** ADMIN-001 (Platform Overview) remains deferred to post-launch (temporary metrics via direct DB queries). Email infrastructure is now pulled forward to unblock Sprint 7-8 flows.

### ADMIN-002: Manage Users

**Total Story Points: 13**

| Role         | Task                                                                                                 | Story Points |
| ------------ | ---------------------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design user list, user detail page, impersonate flow with warnings, action dialogs                   | **2**  |
| **FE** | User list with search/filter, user detail page, impersonate UI with confirmation, action buttons     | **5**  |
| **BE** | User queries with filters, impersonation system (secure tokens), suspend/delete logic, audit logging | **5**  |
| **TL** | Design impersonation security (session management), audit logging to PostgreSQL                      | **2**  |
| **PM** | Test user management, impersonation flow, suspend/delete, audit trail verification                   | **2**  |

**Technical Notes:**

- Impersonation: Create secure JWT token with admin_id + user_id
- Log all impersonation sessions with timestamps in audit_logs table
- Suspend: Set user.status = 'suspended', block login
- Delete: Soft delete (anonymize) or hard delete (cascade)

---

### ADMIN-003: Manage Organizations

**Total Story Points: 8**

| Role         | Task                                                                             | Story Points |
| ------------ | -------------------------------------------------------------------------------- | ------------ |
| **UX** | Design org list, approval workflow UI, org detail view                           | **1**  |
| **FE** | Org list with filters, approval UI with confirmation, org details page           | **3**  |
| **BE** | Org queries, approval/rejection logic, email notifications (mock), audit logging | **3**  |
| **TL** | Review org approval workflow, notification strategy                              | **1**  |
| **PM** | Test org management, approval flow, email notifications, status updates          | **1**  |

---

### ADMIN-005: Manage & Suspend Campaigns

**Total Story Points: 8**

| Role         | Task                                                                                            | Story Points |
| ------------ | ----------------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design campaign list, suspend/reactivate controls with confirmations                            | **1**  |
| **FE** | Campaign list with filters, suspend/reactivate UI, confirmation dialogs                         | **3**  |
| **BE** | Campaign queries, suspend logic (admin_suspended flag), org notifications (mock), audit logging | **3**  |
| **TL** | Review campaign moderation workflow, visibility logic                                           | **1**  |
| **PM** | Test campaign moderation, suspend/reactivate flow, visibility changes, notifications            | **1**  |

---

### EMAIL-010: Email Infrastructure & Deliverability

**Total Story Points: 13**

| Role         | Task                                                                                                  | Story Points |
| ------------ | ----------------------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design email templates (base layout, all component variations)                                        | **1**  |
| **FE** | Email preference center page with all toggles and settings                                            | **2**  |
| **BE** | AWS SES setup, queue system (Bull/BullMQ), template engine, bounce handling                           | **8**  |
| **TL** | Email architecture design, AWS SES configuration, deliverability setup (DKIM, SPF, DMARC), monitoring | **5**  |
| **PM** | Test email sending, deliverability, bounce handling, preferences                                      | **2**  |

**Technical Notes:**

- Implement AWS SES for email delivery (new integration)
- Use Bull or BullMQ for email queue (Redis required)
- Set up DKIM, SPF, DMARC for domain
- Implement bounce and spam complaint handling

---

### DOC-002: Technical Runbooks & Deployment Guides

**Total Story Points: 3**

| Role         | Task                                                                        | Story Points |
| ------------ | --------------------------------------------------------------------------- | ------------ |
| **TL** | Draft deployment runbooks, operational checklists, and incident response guides | **2**  |
| **BE** | Document service configurations (SES, Redis, Prisma) and environment variables   | **1**  |

---

**Sprint 6 Total: 45 story points** (rebalanced with migrated email infrastructure)

---

## Sprint 7: Subscriptions, Email Flows & Testing Prep (Weeks 15-16)

**Goal:** Finalize subscription management, transactional email flows, and comprehensive testing

**Note:** ADMIN-006 (Message Moderation) and ADMIN-007 (System Settings) remain post-launch. Performance Optimization, Cross-Browser Testing, and transactional email flows are consolidated here to balance the final sprint. Begin security hardening prep alongside performance work.

### ADMIN-004: Manage Subscriptions & Payments

**Total Story Points: 13**

| Role         | Task                                                                                           | Story Points |
| ------------ | ---------------------------------------------------------------------------------------------- | ------------ |
| **UX** | Design subscription management UI, refund/credit forms, payment failure views                  | **2**  |
| **FE** | Subscription list, payment details, refund/credit UI, failed payments view                     | **5**  |
| **BE** | Stripe subscription management API, refund/credit processing, payment failure tracking         | **5**  |
| **TL** | Review Stripe integration security, payment reconciliation logic, audit logging                | **2**  |
| **PM** | Test subscription management, refunds, credits, payment failure handling, audit trail          | **2**  |

**Technical Notes:**

- Stripe API for subscription management, refunds, and credits
- Handle payment failures from Stripe webhooks
- Manual upgrade/downgrade functionality
- Audit logging for all payment operations

---

### Performance Optimization (Consolidated)

**Total Story Points: 13**

| Role         | Task                                                                                             | Story Points |
| ------------ | ------------------------------------------------------------------------------------------------ | ------------ |
| **UX** | Mobile UX review, loading states optimization                                                    | **2**  |
| **FE** | Code splitting, lazy loading, image optimization, bundle analysis, Lighthouse optimization       | **5**  |
| **BE** | Query optimization, PostgreSQL indexing, API performance tuning, caching review                  | **5**  |
| **TL** | Load testing (Artillery/k6), CDN setup (CloudFront or Cloudflare), monitoring, performance audit, initial security scan | **5**  |
| **PM** | Performance testing, benchmarking, regression testing                                            | **2**  |

---

### Cross-Browser & Mobile Testing (Consolidated)

**Total Story Points: 8**

| Role         | Task                                                                                              | Story Points |
| ------------ | ------------------------------------------------------------------------------------------------- | ------------ |
| **UX** | Mobile UX review, responsive design fixes                                                         | **2**  |
| **FE** | Cross-browser fixes (Chrome, Firefox, Safari, Edge), mobile refinements, accessibility (WCAG 2.1) | **3**  |
| **PM** | Comprehensive testing: Chrome, Firefox, Safari, Edge on Windows/Mac, iOS/Android mobile           | **5**  |

---

### EMAIL-001: Account Creation & Verification

**Total Story Points: 5**

| Role         | Task                                                                                | Story Points |
| ------------ | ----------------------------------------------------------------------------------- | ------------ |
| **UX** | Design verification email and welcome email templates                               | **1**  |
| **FE** | Email verification UI states (pending, verified, expired)                           | **1**  |
| **BE** | Auth0 webhook handlers for email triggers, welcome email queue jobs, email tracking | **3**  |
| **TL** | Review email flow with Auth0, timing                                                | **1**  |
| **PM** | Test verification emails, welcome emails, timing, resend functionality              | **1**  |

---

### EMAIL-002: Advocacy Message Confirmations

**Total Story Points: 3**

| Role         | Task                                                                            | Story Points |
| ------------ | ------------------------------------------------------------------------------- | ------------ |
| **UX** | Design message confirmation email template                                      | **1**  |
| **BE** | Message confirmation triggers, email generation with message details, queue job | **2**  |
| **PM** | Test confirmation emails, content accuracy, timing                              | **1**  |

**Technical Notes:**

- Focus on critical transactional emails required for launch
- Validate SES sandbox exit timing alongside subscription flows

---

### DOC-003: Support Content & QA Checklists

**Total Story Points: 3**

| Role         | Task                                                                                  | Story Points |
| ------------ | ------------------------------------------------------------------------------------- | ------------ |
| **PM** | Draft help articles, admin guides, and regression checklists based on testing outcomes | **3**  |

---

**Sprint 7 Total: 45 story points** (expanded with email flows and launch documentation)

---

## Sprint 8: Polish & Launch Prep (Weeks 17-18)

**Goal:** Final polish, security hardening, and launch preparation

**Note:** Performance, cross-browser testing, and documentation shifted earlier; focus here on security validation, bug triage, and launch readiness.

### Security Review & Hardening

**Total Story Points: 8**

| Role         | Task                                                                                        | Story Points |
| ------------ | ------------------------------------------------------------------------------------------- | ------------ |
| **BE** | Security audit, input validation review, SQL injection prevention (Prisma parameterization) | **3**  |
| **TL** | Penetration testing, OWASP Top 10 check, vulnerability scanning, API key rotation           | **5**  |
| **PM** | Security testing, compliance verification (GDPR, CCPA basics)                               | **2**  |

---

### Bug Fixes & Polish

**Total Story Points: 13**

| Role         | Task                                                                           | Story Points |
| ------------ | ------------------------------------------------------------------------------ | ------------ |
| **UX** | UI polish, micro-interactions, final design review, style consistency          | **2**  |
| **FE** | Bug fixes from testing, UI refinements, accessibility improvements, edge cases | **5**  |
| **BE** | Bug fixes from testing, error handling improvements, edge cases, validation    | **5**  |
| **TL** | Code review, architecture review, tech debt assessment                         | **2**  |
| **PM** | Bug verification, regression testing, UAT coordination with stakeholders       | **5**  |

---

### Launch Preparation

**Total Story Points: 8**

| Role         | Task                                                                               | Story Points |
| ------------ | ---------------------------------------------------------------------------------- | ------------ |
| **TL** | Production environment setup, monitoring config (Sentry), backup strategy, SSL/DNS | **5**  |
| **BE** | Database migrations, seed data for production, production testing                  | **2**  |
| **PM** | Launch checklist, rollback plan, stakeholder communication, marketing coordination | **3**  |

---

**Sprint 8 Total: 29 story points**

---

## Summary & Key Insights

### Launch Timeline: 18 weeks (9 sprints to launch)

### Story Points by Sprint:

| Sprint   | Focus Area                                           | Total Points | Weeks | Change |
| -------- | ---------------------------------------------------- | ------------ | ----- | ------ |
| Sprint 0 | Foundation & Authentication                          | 40 pts       | 1-2   | -      |
| Sprint 1 | Core User Features                                   | 42 pts       | 3-4   | -8     |
| Sprint 2 | Messaging & News **(Federal + Texas)**         | 42 pts       | 5-6   | -      |
| Sprint 3 | **Premium Membership (Simplified)**            | 39 pts       | 7-8   | -21    |
| Sprint 4 | Organization Portal                                  | 44 pts       | 9-10  | -      |
| Sprint 5 | Campaign Analytics + Design Docs                     | 41 pts       | 11-12 | +2     |
| Sprint 6 | Admin Core + Email Infrastructure                    | 45 pts       | 13-14 | +16    |
| Sprint 7 | Subscriptions, Email Flows & Testing                 | 45 pts       | 15-16 | +11    |
| Sprint 8 | Polish & Launch                                      | 29 pts       | 17-18 | -8     |

**Launch Total: 367 story points | 18 weeks**
**Deferred to Post-Launch: 58 story points**

### Legislation Coverage:

- **Federal**: All Congress.gov legislation (bills, votes, amendments, members)
- **State**: **Texas only** via LegiScan API

### Team Velocity:

- **Average (Launch):** 40.8 story points per 2-week sprint
- **Range (Launch):** 29-45 points per sprint (more consistent than original 21-60)
- **Adjust** based on actual velocity after Sprint 1-2

### What Launches in 18 Weeks:

**Core User Features:**

- Browse federal + Texas state bills
- Send advocacy messages to representatives
- AI-assisted message drafting (AWS Bedrock)
- View news stories with AI summaries
- User dashboard with activity tracking

**Organization Features:**

- Organization portal
- Create campaigns (Bill, Issue, Candidate)
- Campaign analytics with L2 demographics
- View campaign message counts
- Edit/pause campaigns
- Share campaign links

**Premium Membership Features (Simplified):**

- Stripe payment processing & subscription management
- Voter registration verification (L2 Political API)
- ~~Political view settings by policy area~~ (deferred)
- ~~Personalized feed based on interests & views~~ (deferred)
- ~~Email digest options (daily/weekly/monthly)~~ (deferred to email phase)
- Premium analytics dashboard

**Admin Features (Essential Only):**

- ~~Platform overview dashboard~~ (deferred - use database queries)
- Manage users (suspend, delete, impersonate)
- Approve/reject organizations
- Moderate campaigns
- Subscription & payment management
- ~~Message moderation system~~ (deferred - manual process)
- ~~System settings UI & API key management~~ (deferred - use env vars)

**Email Features:**

- Account verification
- Welcome emails
- Message sent confirmations
- Email infrastructure (AWS SES)

### What's Deferred to Post-Launch (58 story points):

**Premium Personalization (21 pts):**

- **US-022:** Political view settings by policy area (8 pts)
- **US-023:** Customized feed & email digest (13 pts)

**Engagement Enhancements (8 pts):**

- **US-011:** Follow organizations (3 pts)
- **US-012:** Watch bills (5 pts)

**Admin Features (29 pts):**

- **ADMIN-001:** Platform overview dashboard (8 pts)
- **ADMIN-006:** Message moderation system (13 pts)
- **ADMIN-007:** System settings UI (8 pts)

**Benefits of Deferral:**

- Eliminates Sprint 3 overload (was 60 pts, now 39 pts)
- Reduces Sprint 1 scope to 42 pts, ensuring early delivery stays focused
- More consistent sprint velocity (range: 29-45 pts vs 21-60 pts)
- Allows team to maintain sustainable pace
- Can gather user feedback before building complex features

### Story Point Distribution by Role (Revised):

- **Frontend (FE):** ~125 points (33%)
- **Backend (BE):** ~135 points (36%)
- **Tech Lead (TL):** ~80 points (21%)
- **Designer (UX):** ~50 points (13%)
- **PM/Tester (PM):** ~70 points (19%)

*Note: Roles overlap and support each other. Workload is now more evenly distributed with no single sprint exceeding capacity for any role.*

### Critical Dependencies:

1. **Sprint 0 → All** (Authentication & infrastructure required for everything)
2. **Sprint 1 → Sprint 2-3** (Feed system and bill pages needed for messaging)
3. **Sprint 2 → Sprint 4** (Messaging system required for campaigns)
4. **Sprint 3** (Premium features can run parallel after Sprint 2)
5. **Sprint 4-5** (Org portal features are sequential)
6. **Sprint 6-7** (Admin features can run parallel with Sprint 4-5)
7. **Sprint 7** (Email flows and testing depend on Sprint 6 infrastructure)
8. **Sprint 8** (Requires all features complete)

### High-Risk Items & Mitigation:

| Risk                                               | Sprint      | Mitigation Strategy                                                              |
| -------------------------------------------------- | ----------- | -------------------------------------------------------------------------------- |
| **L2 Political API** (vendor dependency)     | Sprint 3    | Schedule early vendor call, build mock system, plan alternative                  |
| **Stripe Integration** (payment critical)    | Sprint 3    | Use test mode extensively, plan for webhook failures, document edge cases        |
| **Email Deliverability** (sender reputation) | Sprint 6-7  | Start with transactional emails only, warm up IP slowly, monitor bounce rates    |
| **AWS Bedrock Costs** (usage-based pricing)  | Sprint 2    | Implement caching aggressively, set rate limits, monitor API costs daily         |
| **LegiScan API** (Texas only)                | Sprint 2    | Only Texas legislature, minimal rate limit issues, $200-300/month cost           |
| **AWS RDS Costs** (database connections)     | All sprints | Implement connection pooling, optimize queries, use indexes, monitor daily usage |

### API Integration Schedule:

| Sprint   | APIs to Integrate                                    | Notes                                                    |
| -------- | ---------------------------------------------------- | -------------------------------------------------------- |
| Sprint 0 | Auth0, PostgreSQL on AWS RDS, Congress.gov, Geocodio | Core infrastructure + federal legislation                |
| Sprint 1 | FEC API (campaign finance)                           | Backend service for campaign finance data                |
| Sprint 2 | LegiScan API (Texas only), AWS Bedrock Agent         | State legislation + AI message generation                |
| Sprint 3 | Stripe API (payments)                                | Payment processing for premium memberships               |
| Sprint 4 | L2 Political API, AWS S3 (images)                    | Voter demographics + image uploads for orgs              |
| Sprint 6 | AWS SES (email)                                      | Transactional email infrastructure                       |

### Recommendations (Revised):

1. **Team Velocity Calibration:** After Sprint 1, adjust story points based on actual velocity. With revised plan, no sprint exceeds 45 points, making workload sustainable throughout.

2. **API Costs at Launch:**

   - Congress.gov: Free (public API)
   - LegiScan (Texas only): ~$200-300/month
   - Geocodio: ~$50-100/month
   - AWS Bedrock: Usage-based (monitor closely, implement aggressive caching)
   - AWS RDS: ~$100-200/month (depending on instance size)
   - AWS SES: $0.10 per 1,000 emails
   - Stripe: $0.30 + 2.9% per transaction
   - L2 Political: Contact for pricing (volume-based)
   - **Total estimated: $500-800/month at launch** (excluding L2 Political)

3. **Revenue at Launch:** With Premium Membership (simplified) launching in Sprint 3 (weeks 7-8), revenue generation starts early. Basic premium features sufficient for monetization; advanced personalization can come post-launch.

4. **Testing Time:** PM workload now balanced across sprints. Sprint 7 includes performance and cross-browser testing (moved from the launch sprint), allowing more time for thorough testing before launch week.

5. **Tech Debt:** TL should allocate 10% time per sprint for tech debt and code review (not included in story points).

6. **Documentation:** Start documentation in Sprint 0, update continuously. Design/TL docs land in Sprints 5-6 and PM-owned support content wraps in Sprint 7 so the launch sprint stays focused on polish.

7. **Staging Environment:** Set up staging environment in Sprint 0 that mirrors production. Critical for testing Stripe webhooks and payment flows.

8. **Payment Testing:** Begin Stripe integration testing in Sprint 3. Use Stripe test mode extensively and document all webhook scenarios before going live.

9. **Post-Launch Roadmap:**
  - Weeks 21-22: Core admin features (29 pts)
  - Weeks 23-24: Premium personalization + engagement (29 pts)
  - Weeks 25-26: Email notifications (44 pts)
  - Total post-launch: 102 story points

10. **Manual Workarounds During Launch:**
    - Admin metrics: Direct database queries (pgAdmin, TablePlus)
    - Message moderation: Manual review in database
    - System settings: Environment variables
    - These workarounds are acceptable for low initial volume

---

**End of Detailed Sprint Schedule**
