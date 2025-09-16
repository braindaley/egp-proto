// Mapping from Congress.gov policy areas to site issue categories
// Based on the standard policy areas from api.congress.gov

export const SITE_ISSUE_CATEGORIES = [
  'Abortion',
  'Climate, Energy & Environment',
  'Criminal Justice',
  'Death Penalty',
  'Defense & National Security',
  'Discrimination & Prejudice',
  'Drug Policy',
  'Economy & Work',
  'Education',
  'Free Speech & Press',
  'Gun Policy',
  'Health Policy',
  'Immigration & Migration',
  'International Affairs',
  'LGBT Acceptance',
  'National Conditions',
  'Privacy Rights',
  'Religion & Government',
  'Social Security & Medicare',
  'Technology Policy Issues'
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
  
  // Abortion
  // (Will be mapped based on specific bill content)

  // Criminal Justice
  'Crime and Law Enforcement': 'Criminal Justice',
  'Law': 'Criminal Justice',

  // Death Penalty
  // (Part of Criminal Justice but needs specific bill content analysis)

  // Drug Policy
  // (Will be mapped based on specific bill content)
  
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
  
  // Free Speech & Press
  // (Part of Civil Rights but needs specific bill content analysis)

  // Gun Policy
  // (Part of Crime and Law Enforcement but needs specific bill content analysis)

  // LGBT Acceptance
  // (Part of Civil Rights but needs specific bill content analysis)

  // Privacy Rights
  // (Part of Civil Rights and Technology but needs specific bill content analysis)

  // Social Security & Medicare
  'Social Security': 'Social Security & Medicare',

  // Technology Policy Issues
  'Science, Technology, Communications': 'Technology Policy Issues'
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

// Map user policy interest keys to site issue categories
export const POLICY_INTEREST_TO_SITE_CATEGORY: Record<string, SiteIssueCategory> = {
  abortion: 'Abortion',
  climateEnergyEnvironment: 'Climate, Energy & Environment',
  criminalJustice: 'Criminal Justice',
  deathPenalty: 'Death Penalty',
  defenseNationalSecurity: 'Defense & National Security',
  discriminationPrejudice: 'Discrimination & Prejudice',
  drugPolicy: 'Drug Policy',
  economyWork: 'Economy & Work',
  education: 'Education',
  freeSpeechPress: 'Free Speech & Press',
  gunPolicy: 'Gun Policy',
  healthPolicy: 'Health Policy',
  immigrationMigration: 'Immigration & Migration',
  internationalAffairs: 'International Affairs',
  lgbtAcceptance: 'LGBT Acceptance',
  nationalConditions: 'National Conditions',
  privacyRights: 'Privacy Rights',
  religionGovernment: 'Religion & Government',
  socialSecurityMedicare: 'Social Security & Medicare',
  technologyPolicyIssues: 'Technology Policy Issues'
};

// Map site issue categories back to policy interest keys
export const SITE_CATEGORY_TO_POLICY_INTEREST: Record<SiteIssueCategory, string> = {
  'Abortion': 'abortion',
  'Climate, Energy & Environment': 'climateEnergyEnvironment',
  'Criminal Justice': 'criminalJustice',
  'Death Penalty': 'deathPenalty',
  'Defense & National Security': 'defenseNationalSecurity',
  'Discrimination & Prejudice': 'discriminationPrejudice',
  'Drug Policy': 'drugPolicy',
  'Economy & Work': 'economyWork',
  'Education': 'education',
  'Free Speech & Press': 'freeSpeechPress',
  'Gun Policy': 'gunPolicy',
  'Health Policy': 'healthPolicy',
  'Immigration & Migration': 'immigrationMigration',
  'International Affairs': 'internationalAffairs',
  'LGBT Acceptance': 'lgbtAcceptance',
  'National Conditions': 'nationalConditions',
  'Privacy Rights': 'privacyRights',
  'Religion & Government': 'religionGovernment',
  'Social Security & Medicare': 'socialSecurityMedicare',
  'Technology Policy Issues': 'technologyPolicyIssues'
};

/**
 * Get user's interest level for a specific site category
 */
export function getUserInterestForCategory(
  policyInterests: Record<string, number> | undefined,
  category: SiteIssueCategory
): number {
  if (!policyInterests) return 2; // Default to neutral
  
  const interestKey = SITE_CATEGORY_TO_POLICY_INTEREST[category];
  return policyInterests[interestKey] ?? 2;
}

// Map Legiscan subject names to our site's issue categories
// Based on the extracted subjects from state bills
export const LEGISCAN_SUBJECT_TO_SITE_CATEGORY: Record<string, SiteIssueCategory> = {
  // Climate, Energy & Environment
  'Energy': 'Climate, Energy & Environment',
  'ENERGY/CONSERVATION': 'Climate, Energy & Environment',
  'Energy Matters': 'Climate, Energy & Environment',
  'Environmental Protection': 'Climate, Energy & Environment',
  'Forestry': 'Climate, Energy & Environment',
  'Water Resources': 'Climate, Energy & Environment',
  'Water': 'Climate, Energy & Environment',
  'Wildlife': 'Climate, Energy & Environment',
  'Natural Resources': 'Climate, Energy & Environment',
  'Parks and Recreation': 'Climate, Energy & Environment',
  'Pollution Control': 'Climate, Energy & Environment',
  'Renewable Energy': 'Climate, Energy & Environment',
  
  // Criminal Justice
  'CRIME/SEX OFFENSES': 'Criminal Justice',
  'CRIMINAL RECORDS': 'Criminal Justice',
  'Crimes': 'Criminal Justice',
  'Crimes and Punishments': 'Criminal Justice',
  'Crimes, Corrections, and Law Enforcement': 'Criminal Justice',
  'Crimes, Corrections, and Law Enforcement : Crime and Punishment': 'Criminal Justice',
  'Crimes, Corrections, and Law Enforcement : Criminal Records Checks': 'Criminal Justice',
  'Crimes, Corrections, and Law Enforcement : Firearms': 'Criminal Justice',
  'Crimes, Corrections, and Law Enforcement : Sealing or Expungement': 'Criminal Justice',
  'Criminal Law - Substantive Crimes': 'Criminal Justice',
  'Criminal Procedure': 'Criminal Justice',
  'Law Enforcement': 'Criminal Justice',
  'Corrections Impact': 'Criminal Justice',
  'Corrections and Correctional Facilities, State': 'Criminal Justice',
  'Courts': 'Criminal Justice',
  'Courts, Supreme Court of Tennessee': 'Criminal Justice',
  'Jails and Jailers': 'Criminal Justice',
  'Juvenile Offenders': 'Criminal Justice',
  'JUSTICE OF THE PEACE': 'Criminal Justice',
  'Judges': 'Criminal Justice',
  'Concealed Carry': 'Criminal Justice',
  'Company Police': 'Criminal Justice',
  'Detention': 'Criminal Justice',
  
  // Defense & National Security
  'Military': 'Defense & National Security',
  'Veterans': 'Defense & National Security',
  'National Guard': 'Defense & National Security',
  'Homeland Security': 'Defense & National Security',
  'Emergency Management': 'Defense & National Security',
  'EMERGENCY MANAGEMENT, TEXAS DIVISION OF': 'Defense & National Security',
  'Emergency Services': 'Defense & National Security',
  'Emergency Services and Vehicles': 'Defense & National Security',
  'Disaster': 'Defense & National Security',
  'Disaster Preparedness & Relief': 'Defense & National Security',
  'ALERT SYSTEM': 'Defense & National Security',
  'FLOODS': 'Defense & National Security',
  
  // Discrimination & Prejudice
  'Civil Rights': 'Discrimination & Prejudice',
  'Civil rights: privacy': 'Discrimination & Prejudice',
  'Human Trafficking': 'Discrimination & Prejudice',
  'Indian Tribes': 'Discrimination & Prejudice',
  
  // Economy & Work
  'Commerce': 'Economy & Work',
  'Commerce, Economic Development and Agriculture': 'Economy & Work',
  'Commercial Law': 'Economy & Work',
  'COMMERCIAL LAW -- GENERAL REGULATORY PROVISIONS': 'Economy & Work',
  'Consumer Protection': 'Economy & Work',
  'Economic Development': 'Economy & Work',
  'Economics and public finance': 'Economy & Work',
  'Employment': 'Economy & Work',
  'Labor: benefits': 'Economy & Work',
  'Labor: hours and wages': 'Economy & Work',
  'Job Training': 'Economy & Work',
  'Agriculture Animal Care and Food': 'Economy & Work',
  'Housing and Real Property': 'Economy & Work',
  'Housing and Real Property : Real Estate Transactions': 'Economy & Work',
  'Homeowners Associations': 'Economy & Work',
  'Finance': 'Economy & Work',
  'Finance and Appropriations': 'Economy & Work',
  'Fiscal Policy & Taxes': 'Economy & Work',
  'Currency & Coins': 'Economy & Work',
  'Insurance': 'Economy & Work',
  'INSURANCE, TEXAS DEPARTMENT OF': 'Economy & Work',
  'Airports': 'Economy & Work',
  'Transportation': 'Economy & Work',
  'Highways': 'Economy & Work',
  'Department Of Transportation (adot)': 'Economy & Work',
  'Adot (see Also: Department Of Transportation)': 'Economy & Work',
  'APPROPRIATIONS': 'Economy & Work',
  'Appropriations': 'Economy & Work',
  'Appropriation Process': 'Economy & Work',
  'Appropriation Extension ($)': 'Economy & Work',
  'CAPITAL OUTLAY': 'Economy & Work',
  'Capital, State': 'Economy & Work',
  'Budgeting': 'Economy & Work',
  'Debt': 'Economy & Work',
  'Gaming: lottery': 'Economy & Work',
  
  // Education
  'Education': 'Education',
  'Education : Primary and Secondary Education': 'Education',
  'Education Boards': 'Education',
  'Education, Finance': 'Education',
  'Education, Higher': 'Education',
  'Education, State Board Of': 'Education',
  'Education, Vocational': 'Education',
  'Education: financing': 'Education',
  'Elementary Education': 'Education',
  'K-12 Education': 'Education',
  'Kindergarten': 'Education',
  'Higher Education': 'Education',
  'Colleges & Universities': 'Education',
  'Health Education': 'Education',
  'Graduates': 'Education',
  
  // Health Policy
  'Health': 'Health Policy',
  'HEALTH & HUMAN SERVICES COMMISSION': 'Health Policy',
  'Health And Safety': 'Health Policy',
  'Health Occupations': 'Health Policy',
  'Health and Human Services : Health Care': 'Health Policy',
  'Health and Medical Services': 'Health Policy',
  'Health--Emergency Services & Personnel': 'Health Policy',
  'Behavioral Health': 'Health Policy',
  'Behavioral Health Examiners': 'Health Policy',
  'Behavioral Health Licensure': 'Health Policy',
  'Board Of Behavioral Health Examiners': 'Health Policy',
  'Diseases & Health Disorders': 'Health Policy',
  'Mental Health': 'Health Policy',
  'Public Health': 'Health Policy',
  'Alcohol': 'Health Policy',
  
  // Immigration & Migration
  'Immigration': 'Immigration & Migration',
  'Citizenship': 'Immigration & Migration',
  
  // International Affairs
  'International Trade': 'International Affairs',
  'Foreign Relations': 'International Affairs',
  
  // National Conditions
  'Government Administration': 'National Conditions',
  'Government Employees': 'National Conditions',
  'Government Operations (State Issues)': 'National Conditions',
  'Government operations and politics': 'National Conditions',
  'Governor': 'National Conditions',
  'Governor -- Bills Requested By': 'National Conditions',
  'Legislative Agencies': 'National Conditions',
  'Legislative Committees': 'National Conditions',
  'Legislative Operations': 'National Conditions',
  'Legislators': 'National Conditions',
  'Legislature': 'National Conditions',
  'Federal Government': 'National Conditions',
  'HOUSE OF REPRESENTATIVES, US': 'National Conditions',
  'Constitution, Us': 'National Conditions',
  'ELECTIONS': 'National Conditions',
  'Elections': 'National Conditions',
  'Elections And Electors - Title 16': 'National Conditions',
  'Campaigns': 'National Conditions',
  'Ethics': 'National Conditions',
  'Administrative Code': 'National Conditions',
  'Administrative Rules': 'National Conditions',
  'Bills and Joint Resolutions Signed by the Governor': 'National Conditions',
  'Boards': 'National Conditions',
  'Counties': 'National Conditions',
  'Counties Cities and Towns': 'National Conditions',
  'Counties: other': 'National Conditions',
  'County Board': 'National Conditions',
  'County Commissioners': 'National Conditions',
  'Cities: other': 'National Conditions',
  'City Councils': 'National Conditions',
  'Committees and Commissions': 'National Conditions',
  'Charters': 'National Conditions',
  
  // Religion & Government
  'Religion': 'Religion & Government',
  
  // Technology
  'Artificial Intelligence': 'Technology',
  'BROADBAND NETWORKS': 'Technology',
  'Electronic Communication': 'Technology',
  'Electronic Information Systems': 'Technology',
  'INFORMATION TECHNOLOGY SERVICES': 'Technology',
  'Digital Images': 'Technology',
  'Technology': 'Technology Policy Issues',

  // New category mappings
  'Abortion': 'Abortion',
  'Death Penalty': 'Death Penalty',
  'Drug Policy': 'Drug Policy',
  'Drugs': 'Drug Policy',
  'Free Speech': 'Free Speech & Press',
  'Press Freedom': 'Free Speech & Press',
  'Gun Control': 'Gun Policy',
  'Firearms': 'Gun Policy',
  'LGBT': 'LGBT Acceptance',
  'Privacy': 'Privacy Rights',
  'Social Security': 'Social Security & Medicare',
  'Medicare': 'Social Security & Medicare',
  
  // Family and Social Services (maps to appropriate categories)
  'Adoption': 'National Conditions',
  'Aging': 'Health Policy',
  'Aging and Human Services': 'Health Policy',
  'Children': 'National Conditions',
  'Children (4-12)': 'National Conditions',
  'Children and Minors': 'National Conditions',
  'Child Abuse and Neglect': 'Criminal Justice',
  'Health and Human Services : Child Care': 'National Conditions',
  'Domestic Relations': 'National Conditions',
  'Families': 'National Conditions',
};

/**
 * Maps a Legiscan subject to our site's issue categories
 * Returns the mapped category or null if no mapping found
 */
export function mapLegiscanSubjectToSiteCategory(subject: string | undefined): SiteIssueCategory | null {
  if (!subject) return null;
  
  // Direct mapping
  const mappedCategory = LEGISCAN_SUBJECT_TO_SITE_CATEGORY[subject];
  if (mappedCategory) return mappedCategory;
  
  // Partial matching for subjects that might have variations
  const lowerSubject = subject.toLowerCase();
  
  // Find a partial match
  for (const [mappedSubject, category] of Object.entries(LEGISCAN_SUBJECT_TO_SITE_CATEGORY)) {
    if (lowerSubject.includes(mappedSubject.toLowerCase()) || 
        mappedSubject.toLowerCase().includes(lowerSubject)) {
      return category;
    }
  }
  
  return null;
}

/**
 * Get all Legiscan subjects that map to a specific site category
 */
export function getLegiscanSubjectsForSiteCategory(category: SiteIssueCategory): string[] {
  return Object.entries(LEGISCAN_SUBJECT_TO_SITE_CATEGORY)
    .filter(([_, siteCategory]) => siteCategory === category)
    .map(([subject]) => subject);
}