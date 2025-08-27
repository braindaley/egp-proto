// Mapping from Congress.gov policy areas to site issue categories
// Based on the standard policy areas from api.congress.gov

export const SITE_ISSUE_CATEGORIES = [
  'Climate, Energy & Environment',
  'Criminal Justice',
  'Defense & National Security',
  'Discrimination & Prejudice',
  'Economy & Work',
  'Education',
  'Health Policy',
  'Immigration & Migration',
  'International Affairs',
  'National Conditions',
  'Religion & Government',
  'Technology'
] as const;

export type SiteIssueCategory = typeof SITE_ISSUE_CATEGORIES[number];

// Map Congress.gov policy areas to our site's issue categories
// Source: https://www.congress.gov/help/legislative-glossary#glossary_policyarea
export const POLICY_AREA_TO_SITE_CATEGORY: Record<string, SiteIssueCategory> = {
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
  
  // Technology
  'Science, Technology, Communications': 'Technology'
};

/**
 * Maps a Congress.gov policy area to our site's issue categories
 * Returns the mapped category or 'National Conditions' as default
 */
export function mapPolicyAreaToSiteCategory(policyArea: string | undefined): SiteIssueCategory | null {
  if (!policyArea) return null;
  
  // Direct mapping
  const mappedCategory = POLICY_AREA_TO_SITE_CATEGORY[policyArea];
  if (mappedCategory) return mappedCategory;
  
  // Default to National Conditions for unmapped areas
  console.warn(`Unmapped policy area: ${policyArea}, defaulting to National Conditions`);
  return 'National Conditions';
}

/**
 * Get all Congress.gov policy areas that map to a specific site category
 */
export function getPolicyAreasForSiteCategory(category: SiteIssueCategory): string[] {
  return Object.entries(POLICY_AREA_TO_SITE_CATEGORY)
    .filter(([_, siteCategory]) => siteCategory === category)
    .map(([policyArea]) => policyArea);
}