# Feed Rules Specification

## Overview
Rules for "The Feed" on **Homepage** and **Issue Policy Landing Pages**. This specification replaces the current homepage feed implementation (which uses hardcoded positions for polls, campaigns, etc.).

The feed appears after the filter badges (For You, News, Campaigns, Bills) and displays interleaved content from three sources: News, Bills, and Campaigns.

---

## Page Structure

1. **Top Section:** Popular Bills carousel (RSS feed, top 10 weekly) - *unchanged*
2. **Feed Section:** Interleaved content using pattern below

---

## Interleaving Pattern

```
2 News → 2 Bills → 1 Campaign → (repeat)
```

Each cycle = 5 items (2 news + 2 bills + 1 campaign)

---

## Bills Feed Logic

### Carousel (Top of Page)
| Source | Count | Sort |
|--------|-------|------|
| RSS feed (weekly popular) | Top 10 | Popularity rank |

### Feed (Interleaved)
| Source | Criteria | Sort |
|--------|----------|------|
| Federal bills | Status filter (see below) | Last updated desc |
| State bills | Same status filter, user's state from zip | Last updated desc |

**Status Filter:** Only show bills with status:
- `In Committee`
- `Passed House`
- `Passed Senate`
- `To President`
- `Became Law` (only if ≤ 7 days since becoming law)

**State Bills:**
- Only shown if user has zip code or address in profile
- Mixed with federal bills, sorted together by last updated
- If no zip → no state bills

**Issue Pages:** Same logic, filtered by policy category first

---

## News Feed Logic

### Data Source
- NewsAPI.ai (Event Registry)
- Sort by: `socialScore` (social media engagement)
- Search topics: 30 policy categories

### Homepage
| Tier | Recency Window | Count | Sort |
|------|----------------|-------|------|
| 1 | Last 48 hours | Top 10 | socialScore desc |
| 2 | Last 7 days | Top 20 | socialScore desc |

- Label each article with its policy category
- Homepage has its own query (not aggregating issue pages)

### Issue Pages
| Tier | Recency Window | Count | Sort |
|------|----------------|-------|------|
| 1 | Last 48 hours | Top 10 | socialScore desc |
| 2 | Last 7 days | Top 20 | socialScore desc |

- Filtered by that specific policy category

---

## Campaigns Feed Logic

Campaigns include all campaign types: **Legislation**, **Issue**, **Candidate**, and **Poll**.

### Ranking
| Tier | Criteria | Sort |
|------|----------|------|
| 1 (positions 1-10) | Created in last 7 days AND engagement > 25 | (supportCount + opposeCount) desc |
| 2 (positions 11+) | All remaining | createdAt desc |

**Filters:**
- `isActive = true`
- For top tier: `(supportCount + opposeCount) > 25`

**Engagement:** Calculated as `supportCount + opposeCount`

**Issue Pages:** Same logic, filtered by `policyIssue` matching category

---

## Summary Table

| Content Type | Primary Sort | Secondary Criteria |
|--------------|--------------|-------------------|
| Bills (carousel) | RSS popularity | Top 10 weekly |
| Bills (feed) | Last updated | Status filter, federal + state mixed |
| News | socialScore | 48hr first, then 7 days |
| Campaigns | Engagement > 25, then recency | Active only, 7-day window for top tier |

---

## Out of Scope (Removed Features)
- Policy interest personalization
- Watched bills/groups
- User stance history
- State-specific news
