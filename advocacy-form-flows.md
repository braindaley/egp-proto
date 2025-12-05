# Advocacy Form Flow Documentation

Quick reference guide for all advocacy form flows in the eVotersUnited.org Platform.

---

## Campaign Types Overview

The platform supports **4 campaign types**, each with different flows and purposes:

| Campaign Type | Purpose | Collects | Example |
|---------------|---------|----------|---------|
| **Legislation** | Advocate for/against a bill | Messages + Support/Oppose counts | HR 1 - For the People Act |
| **Issue** | Contact reps about a topic | Messages (opinion-based) | Healthcare Reform |
| **Candidate** | Compare two candidates | Candidate preference counts | Governor Election |
| **Poll** | Gather voter opinions | Poll responses + results | "What's your top priority?" |

---

## User Types

- **Logged-in with Verified Registration**: Skips verification (shortest flow)
- **Logged-in without Verified Registration**: Must verify voter registration
- **Guest User**: Must verify voter registration
- **Unregistered**: Shows CTA to register at vote.org

---

## Flow Diagrams

### Legislation Flow (Bill Advocacy)

**All Users:**
```
Voter Verification → Position → AI Help → Write Message → Select Recipients → Personal Info → Review → Send → Create Account
(9 steps)
```

**Logged-in Users (verified registration):**
- Skip Verification step (8 steps)

**Logged-in Users (already have account):**
- Skip Verification + Account Creation steps (7 steps)

---

### Issue Flow (Topic-based)

**All Users:**
```
Voter Verification → Select Issue → Write Message → Select Recipients → Personal Info → Review → Send → Create Account
(8 steps)
```

**Logged-in Users (verified registration):**
- Skip Verification step (7 steps)

**Logged-in Users (already have account):**
- Skip Verification + Account Creation steps (6 steps)

---

### Poll Flow

**All Users:**
```
Voter Verification → Select Choice → Send → Create Account
(4 steps)
```

**Logged-in Users (verified registration):**
- Skip Verification step (3 steps)

**Logged-in Users (already have account):**
- Skip Verification + Account Creation steps (2 steps)

---

### Candidate Flow

**All Users:**
```
Voter Verification → Select Candidate → Send → Create Account
(4 steps)
```

**Logged-in Users (verified registration):**
- Skip Verification step (3 steps)

**Logged-in Users (already have account):**
- Skip Verification + Account Creation steps (2 steps)

---

## Voter Registration Verification

### For Guest Users

**Process:**
1. Enter first name, last name, address
2. System verifies against L2 voter database
3. **If registered:** Note in profile and allow user to continue
4. **If not registered:** Provide CTA to register at vote.org

**Delaware Limitation:** L2 verification currently only works for Delaware (DE) residents.

### For Logged-in Users

**Process:**
1. Check if voter registration has been completed
2. **If registered:** Allow user to continue (skip verification)
3. **If not registered:** Provide CTA to register at vote.org

**Registration Status:** System checks `isRegisteredVoter` flag or existing L2 verification data in user profile.

---

## Step Details by Campaign Type

### Legislation Flow (9 steps)

| Step | Name | Purpose | Key Inputs |
|------|------|---------|------------|
| 1 | **Voter Verification** | Confirm voter identity | First name, last name, address |
| 2 | **Position** | Choose support/oppose | Support or Oppose |
| 3 | **AI Help** | Generate message template (optional) | Yes/No choice |
| 4 | **Write Message** | Compose advocacy message | Message text |
| 5 | **Select Recipients** | Choose members to contact | Checkboxes: Your reps, Committee leadership |
| 6 | **Personal Info** | Select data to include | Checkboxes for personal fields |
| 7 | **Review** | Final check before sending | Review all details |
| 8 | **Send** | Submit message | - |
| 9 | **Create Account** | Create account (guests only) | Email, password, account type (Free/Membership) |

---

### Issue Flow (8 steps)

| Step | Name | Purpose | Key Inputs |
|------|------|---------|------------|
| 1 | **Voter Verification** | Confirm voter identity | First name, last name, address |
| 2 | **Select Issue** | Choose policy topics | Multi-select policy issues |
| 3 | **Write Message** | Compose advocacy message | Message text |
| 4 | **Select Recipients** | Choose members to contact | Checkboxes: Your reps |
| 5 | **Personal Info** | Select data to include | Checkboxes for personal fields |
| 6 | **Review** | Final check before sending | Review all details |
| 7 | **Send** | Submit message | - |
| 8 | **Create Account** | Create account (guests only) | Email, password, account type |

**Issue Flow Variations:**
- **General Issue**: `?issue=healthcare` - Contact your district representatives
- **Targeted Member**: `?member=B001289` - Contact specific member about issues

---

### Poll Flow (4 steps)

| Step | Name | Purpose | Key Inputs |
|------|------|---------|------------|
| 1 | **Voter Verification** | Confirm voter identity | First name, last name, address |
| 2 | **Select Choice** | Respond to poll question | Single choice, Multiple choice, or Text response |
| 3 | **Send** | Submit poll response | - |
| 4 | **Create Account** | Create account (guests only) | Email, password, account type |

**Poll Answer Types:**
- Multiple choice (single answer) - Radio buttons
- Multiple choice (multiple answers) - Checkboxes
- Open text response - Text area

---

### Candidate Flow (4 steps)

| Step | Name | Purpose | Key Inputs |
|------|------|---------|------------|
| 1 | **Voter Verification** | Confirm voter identity | First name, last name, address |
| 2 | **Select Candidate** | Choose preferred candidate | Radio button: Candidate 1 or Candidate 2 |
| 3 | **Send** | Submit candidate preference | - |
| 4 | **Create Account** | Create account (guests only) | Email, password, account type |

---

## Personal Information Options

Users can choose which personal data to include in their message (Legislation & Issue flows only):

**Available for Selection:**
- Full Name ✓ (default)
- Full Address ✓ (default)
- State
- County (from L2 only)
- Precinct (from L2 only)
- Birth Year ✓ (default)
- Gender ✓ (default)
- Political Affiliation ✓ (default)
- Education ✓ (default)
- Profession ✓ (default)
- Military Service ✓ (default)

**Special Options:**
- Nickname field (appears when Full Name is unchecked)
- Constituent description (free text, e.g., "Small business owner in your district")

---

## Recipient Selection

### Legislation Flow
**Pre-selected:**
- Your congressional representatives (based on zip code)

**Optional:**
- Committee leadership (chair, ranking member)

### Issue Flow
**Pre-selected:**
- Your congressional representatives (based on zip code) OR
- Specific member (if `?member=` parameter provided)

---

## URL Parameters & CTAs

### Entry Points → Form Types

| Entry Point | URL Pattern | Form Type Used |
|-------------|-------------|----------------|
| Member page | `?member=B001289&congress=119` | **Issue** |
| Bill page | `?congress=119&type=hr&number=1` | **Legislation** |
| Campaign - Issue | `?issue=healthcare&campaignId=xyz` | **Issue** |
| Campaign - Bill | `?congress=119&type=hr&number=1&campaignId=xyz` | **Legislation** |
| Campaign - Poll | `?poll=poll-id&campaignId=xyz` | **Poll** |
| Campaign - Candidate | `?candidate1=Name&candidate2=Name&campaignId=xyz` | **Candidate** |
| News Article | `?newsTitle=Title&newsUrl=url&issue=healthcare` | **Issue** |

### Parameter Reference

**Legislation:**
```
/advocacy-message?congress=119&type=hr&number=1
```

**Issue:**
```
/advocacy-message?issue=healthcare
/advocacy-message?category=climate-change
/advocacy-message?member=B001289&congress=119
```

**Candidate:**
```
/advocacy-message?candidate1=John%20Doe&candidate2=Jane%20Smith
/advocacy-message?campaignId=sample-candidate-poll
```
Optional: `candidate1Bio`, `candidate2Bio`

**Poll:**
```
/advocacy-message?poll=poll-testtitle
```

**News Article:**
```
/advocacy-message?newsTitle=Article%20Title&newsUrl=https://...&issue=healthcare
```

**General:**
- `verified=true` - User verified in current session
- `campaignId` - Organization campaign ID

---

## Validation Rules

| Field | Rule |
|-------|------|
| First name | Minimum 2 characters |
| Last name | Minimum 2 characters |
| Address | Minimum 10 characters |
| State | 2-letter code (must be "DE" for L2 verification) |
| Zip code | Exactly 5 digits |
| Message text | Cannot be empty |
| Recipients | At least one must be selected |
| Birth year | 1900 to current year |
| Email | Valid email format |

---

## Data Storage

### Firebase Collections

**user_messages** (Legislation & Issue campaigns)
- userId, messageContent, recipients
- userStance (support/oppose)
- personalDataIncluded
- deliveryMethod, deliveryStatus
- billNumber, billType (if applicable)

**candidate_poll_responses** (Candidate campaigns)
- userId, campaignId
- candidate1Name, candidate2Name
- selectedCandidate (1 or 2)
- verifiedUserInfo

**poll_responses** (Poll campaigns)
- userId, pollId
- questionId, response
- timestamp

### Session Storage (Guest Users)
- `verifiedUser` - Verification data for current session
- `pendingMessageId` - For account linking after send
- `pendingMessageData` - Complete message for account linking

---

## Key Differences by User Type

| Feature | Logged-in (verified) | Logged-in (not verified) | Guest User |
|---------|---------------------|-------------------------|------------|
| Verification step | Skipped | Required + CTA | Required + CTA |
| Steps (Legislation) | 8 | 9 | 9 |
| Steps (Issue) | 7 | 8 | 8 |
| Steps (Poll) | 3 | 4 | 4 |
| Steps (Candidate) | 3 | 4 | 4 |
| Account creation | Skipped | Skipped | Required for data persistence |
| L2 enrichment | Preserved from previous | Available after verification | Available after verification |
| Dashboard access | Immediate | Immediate | After account creation |

---

## Implementation Status

### ✅ Fully Implemented
- **Issue Flow**: All 8 steps working ✨ (Fixed)
  - Added missing "Select Recipients" step between Write Message and Personal Info
  - Users can now select which congressional representatives to contact
  - Committee leadership shown for Bill flows only

- **Poll Flow**: Complete 4-step implementation ✨ (NEW - Completed)
  - Full `AdvocacyMessagePoll.tsx` component created
  - Voter verification with L2 integration
  - All 3 answer types supported: single choice, multiple choice, open text
  - Saves responses to `poll_responses` Firebase collection
  - Account creation flow for guests with session linking
  - Integrated into main advocacy-message routing

- **Candidate Flow**: Full account creation implemented ✨ (Completed)
  - Complete account creation form with Free/Membership options
  - Email and password validation
  - Firebase authentication integration (`createUserWithEmailAndPassword`)
  - Links candidate poll response to new account via sessionStorage
  - Error handling for duplicate emails, weak passwords, etc.
  - Redirects to dashboard (Free) or checkout (Membership)

### ✅ Fully Implemented (NEW)
- **Legislation Flow**: All 9 steps working ✨ (Completed)
  - ✅ Removed "Upload Media" step (was step 5)
  - ✅ Removed "Delivery Options" step (was step 9)
  - ✅ Step numbering consolidated to sequential 1-9 (previously 1,2,3,4,6,7,8,10,11,12)
  - ✅ All navigation logic (forward and back buttons) updated
  - ✅ Progress indicators updated for both Bill and Issue flows
  - Messages now sent directly via eVotersUnited.org

---

## Component Files

**Main Routing:**
- [src/app/(standalone)/advocacy-message/page.tsx](src/app/(standalone)/advocacy-message/page.tsx)

**Campaign Type Components:**
- [src/components/AdvocacyMessageCandidate.tsx](src/components/AdvocacyMessageCandidate.tsx) - Candidate flow (with full account creation)
- [src/components/AdvocacyMessagePoll.tsx](src/components/AdvocacyMessagePoll.tsx) - Poll flow ✨ (NEW)
- [src/components/advocacy-bill-card.tsx](src/components/advocacy-bill-card.tsx) - Bill display
- [src/components/candidate-campaign-card.tsx](src/components/candidate-campaign-card.tsx) - Candidate display
- [src/components/poll-campaign-card.tsx](src/components/poll-campaign-card.tsx) - Poll display
- [src/components/poll-campaign-feed-card.tsx](src/components/poll-campaign-feed-card.tsx) - Poll feed card

**Type Definitions:**
- [src/lib/campaigns.ts](src/lib/campaigns.ts) - Campaign types and interfaces

---

## Notes

1. **Delaware Only**: L2 voter verification currently only supports Delaware residents. Other states must use manual entry.

2. **Verification Required**: All campaign types require voter verification for guest users. Logged-in users skip if already verified.

3. **Message vs Polling**: Legislation and Issue campaigns send messages. Candidate and Poll campaigns collect data without messaging.

4. **Account Creation**: Optional for guests after submitting. Allows linking their submission to an account for tracking.

5. **L2 Data Enrichment**: When verification succeeds, system automatically adds voter data (birth year, gender, party affiliation) to user profile.

6. **Campaign Tracking**: All submissions link to `campaignId` for analytics and campaign performance tracking.
