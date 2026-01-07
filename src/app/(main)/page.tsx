'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { X, ChevronDown, Eye, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react';
import { BillProgress } from '@/components/BillProgress';
import Link from 'next/link';
import { SITE_ISSUE_CATEGORIES, mapPolicyAreaToSiteCategory } from '@/lib/policy-area-mapping';
import { campaignsService } from '@/lib/campaigns';
import { PopularBills } from '@/components/popular-bills';
import { HomepageNewsSection } from '@/components/homepage-news-section';
import { CandidateCampaignFeedCard } from '@/components/candidate-campaign-feed-card';
import { PollCampaignFeedCard } from '@/components/poll-campaign-feed-card';
import { useZipCode } from '@/hooks/use-zip-code';

export default function Home() {
  const [showCard, setShowCard] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const { zipCode } = useZipCode();

  // Helper function to convert category to URL slug
  const convertCategoryToSlug = (category: string): string => {
    return category
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Helper function to get state from zip code
  const getStateFromZip = (zipCode: string): { state: string, stateCode: string } | null => {
    if (!zipCode) return null;

    // Check by prefix (first 3 digits) - simplified version from the API route
    const prefix = zipCode.substring(0, 3);
    const statesByPrefix: Record<string, { state: string, stateCode: string }> = {
      // California ranges
      '900': { state: 'California', stateCode: 'CA' },
      '901': { state: 'California', stateCode: 'CA' },
      '902': { state: 'California', stateCode: 'CA' },
      '903': { state: 'California', stateCode: 'CA' },
      '904': { state: 'California', stateCode: 'CA' },
      '905': { state: 'California', stateCode: 'CA' },
      '906': { state: 'California', stateCode: 'CA' },
      '907': { state: 'California', stateCode: 'CA' },
      '908': { state: 'California', stateCode: 'CA' },
      '910': { state: 'California', stateCode: 'CA' },
      '911': { state: 'California', stateCode: 'CA' },
      '912': { state: 'California', stateCode: 'CA' },
      '913': { state: 'California', stateCode: 'CA' },
      '914': { state: 'California', stateCode: 'CA' },
      '915': { state: 'California', stateCode: 'CA' },
      '916': { state: 'California', stateCode: 'CA' },
      '917': { state: 'California', stateCode: 'CA' },
      '918': { state: 'California', stateCode: 'CA' },
      '919': { state: 'California', stateCode: 'CA' },
      '920': { state: 'California', stateCode: 'CA' },
      '921': { state: 'California', stateCode: 'CA' },
      '922': { state: 'California', stateCode: 'CA' },
      '923': { state: 'California', stateCode: 'CA' },
      '924': { state: 'California', stateCode: 'CA' },
      '925': { state: 'California', stateCode: 'CA' },
      '926': { state: 'California', stateCode: 'CA' },
      '927': { state: 'California', stateCode: 'CA' },
      '928': { state: 'California', stateCode: 'CA' },
      '930': { state: 'California', stateCode: 'CA' },
      '931': { state: 'California', stateCode: 'CA' },
      '932': { state: 'California', stateCode: 'CA' },
      '933': { state: 'California', stateCode: 'CA' },
      '934': { state: 'California', stateCode: 'CA' },
      '935': { state: 'California', stateCode: 'CA' },
      '936': { state: 'California', stateCode: 'CA' },
      '937': { state: 'California', stateCode: 'CA' },
      '938': { state: 'California', stateCode: 'CA' },
      '939': { state: 'California', stateCode: 'CA' },
      '940': { state: 'California', stateCode: 'CA' },
      '941': { state: 'California', stateCode: 'CA' },
      '942': { state: 'California', stateCode: 'CA' },
      '943': { state: 'California', stateCode: 'CA' },
      '944': { state: 'California', stateCode: 'CA' },
      '945': { state: 'California', stateCode: 'CA' },
      '946': { state: 'California', stateCode: 'CA' },
      '947': { state: 'California', stateCode: 'CA' },
      '948': { state: 'California', stateCode: 'CA' },
      '949': { state: 'California', stateCode: 'CA' },
      '950': { state: 'California', stateCode: 'CA' },
      '951': { state: 'California', stateCode: 'CA' },
      '952': { state: 'California', stateCode: 'CA' },
      '953': { state: 'California', stateCode: 'CA' },
      '954': { state: 'California', stateCode: 'CA' },
      '955': { state: 'California', stateCode: 'CA' },
      '956': { state: 'California', stateCode: 'CA' },
      '957': { state: 'California', stateCode: 'CA' },
      '958': { state: 'California', stateCode: 'CA' },
      '959': { state: 'California', stateCode: 'CA' },
      '960': { state: 'California', stateCode: 'CA' },
      '961': { state: 'California', stateCode: 'CA' },
      // New York ranges
      '100': { state: 'New York', stateCode: 'NY' },
      '101': { state: 'New York', stateCode: 'NY' },
      '102': { state: 'New York', stateCode: 'NY' },
      '103': { state: 'New York', stateCode: 'NY' },
      '104': { state: 'New York', stateCode: 'NY' },
      '105': { state: 'New York', stateCode: 'NY' },
      '106': { state: 'New York', stateCode: 'NY' },
      '107': { state: 'New York', stateCode: 'NY' },
      '108': { state: 'New York', stateCode: 'NY' },
      '109': { state: 'New York', stateCode: 'NY' },
      '110': { state: 'New York', stateCode: 'NY' },
      '111': { state: 'New York', stateCode: 'NY' },
      '112': { state: 'New York', stateCode: 'NY' },
      '113': { state: 'New York', stateCode: 'NY' },
      '114': { state: 'New York', stateCode: 'NY' },
      '115': { state: 'New York', stateCode: 'NY' },
      '116': { state: 'New York', stateCode: 'NY' },
      '117': { state: 'New York', stateCode: 'NY' },
      '118': { state: 'New York', stateCode: 'NY' },
      '119': { state: 'New York', stateCode: 'NY' },
      // Texas ranges
      '750': { state: 'Texas', stateCode: 'TX' },
      '751': { state: 'Texas', stateCode: 'TX' },
      '752': { state: 'Texas', stateCode: 'TX' },
      '753': { state: 'Texas', stateCode: 'TX' },
      '754': { state: 'Texas', stateCode: 'TX' },
      '755': { state: 'Texas', stateCode: 'TX' },
      '756': { state: 'Texas', stateCode: 'TX' },
      '757': { state: 'Texas', stateCode: 'TX' },
      '758': { state: 'Texas', stateCode: 'TX' },
      '759': { state: 'Texas', stateCode: 'TX' },
      '760': { state: 'Texas', stateCode: 'TX' },
      '761': { state: 'Texas', stateCode: 'TX' },
      '762': { state: 'Texas', stateCode: 'TX' },
      '763': { state: 'Texas', stateCode: 'TX' },
      '764': { state: 'Texas', stateCode: 'TX' },
      '765': { state: 'Texas', stateCode: 'TX' },
      '766': { state: 'Texas', stateCode: 'TX' },
      '767': { state: 'Texas', stateCode: 'TX' },
      '768': { state: 'Texas', stateCode: 'TX' },
      '769': { state: 'Texas', stateCode: 'TX' },
      '770': { state: 'Texas', stateCode: 'TX' },
      '771': { state: 'Texas', stateCode: 'TX' },
      '772': { state: 'Texas', stateCode: 'TX' },
      '773': { state: 'Texas', stateCode: 'TX' },
      '774': { state: 'Texas', stateCode: 'TX' },
      '775': { state: 'Texas', stateCode: 'TX' },
      '776': { state: 'Texas', stateCode: 'TX' },
      '777': { state: 'Texas', stateCode: 'TX' },
      '778': { state: 'Texas', stateCode: 'TX' },
      '779': { state: 'Texas', stateCode: 'TX' },
      '780': { state: 'Texas', stateCode: 'TX' },
      '781': { state: 'Texas', stateCode: 'TX' },
      '782': { state: 'Texas', stateCode: 'TX' },
      '783': { state: 'Texas', stateCode: 'TX' },
      '784': { state: 'Texas', stateCode: 'TX' },
      '785': { state: 'Texas', stateCode: 'TX' },
      '786': { state: 'Texas', stateCode: 'TX' },
      '787': { state: 'Texas', stateCode: 'TX' },
      '788': { state: 'Texas', stateCode: 'TX' },
      '789': { state: 'Texas', stateCode: 'TX' },
      '790': { state: 'Texas', stateCode: 'TX' },
      '791': { state: 'Texas', stateCode: 'TX' },
      '792': { state: 'Texas', stateCode: 'TX' },
      '793': { state: 'Texas', stateCode: 'TX' },
      '794': { state: 'Texas', stateCode: 'TX' },
      '795': { state: 'Texas', stateCode: 'TX' },
      '796': { state: 'Texas', stateCode: 'TX' },
      '797': { state: 'Texas', stateCode: 'TX' },
      '798': { state: 'Texas', stateCode: 'TX' },
      '799': { state: 'Texas', stateCode: 'TX' },
      // Florida ranges
      '320': { state: 'Florida', stateCode: 'FL' },
      '321': { state: 'Florida', stateCode: 'FL' },
      '322': { state: 'Florida', stateCode: 'FL' },
      '323': { state: 'Florida', stateCode: 'FL' },
      '324': { state: 'Florida', stateCode: 'FL' },
      '325': { state: 'Florida', stateCode: 'FL' },
      '326': { state: 'Florida', stateCode: 'FL' },
      '327': { state: 'Florida', stateCode: 'FL' },
      '328': { state: 'Florida', stateCode: 'FL' },
      '329': { state: 'Florida', stateCode: 'FL' },
      '330': { state: 'Florida', stateCode: 'FL' },
      '331': { state: 'Florida', stateCode: 'FL' },
      '332': { state: 'Florida', stateCode: 'FL' },
      '333': { state: 'Florida', stateCode: 'FL' },
      '334': { state: 'Florida', stateCode: 'FL' },
      '335': { state: 'Florida', stateCode: 'FL' },
      '336': { state: 'Florida', stateCode: 'FL' },
      '337': { state: 'Florida', stateCode: 'FL' },
      '338': { state: 'Florida', stateCode: 'FL' },
      '339': { state: 'Florida', stateCode: 'FL' }
    };

    return statesByPrefix[prefix] || null;
  };

  // Get user's state
  const userState = zipCode ? getStateFromZip(zipCode) : null;

  // Prepare issue categories for dropdown with "View all" option
  const issueCategories = [
    { id: 'view-all', label: 'View all' },
    ...SITE_ISSUE_CATEGORIES.map(category => ({
      id: category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
      label: category
    }))
  ];

  // Mock Bill CTA data - bills that have passed committee and house
  const billCTAByCategory: Record<string, any> = {
    'Climate, Energy & Environment': {
      id: 'bill-cta-climate',
      type: 'billCTA',
      billNumber: 'H.R. 3838',
      billTitle: 'Clean Energy Innovation and Deployment Act',
      aiOverview: 'This comprehensive climate bill establishes a framework to achieve net-zero emissions by 2050 through investments in renewable energy infrastructure, carbon capture technology, and green job creation. It includes tax incentives for clean energy adoption and penalties for excessive carbon emissions.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote in April',
      category: 'Climate, Energy & Environment',
      url: '/federal/bill/119/hr/3838',
      congress: '119'
    },
    'Economy & Work': {
      id: 'bill-cta-economy',
      type: 'billCTA',
      billNumber: 'H.R. 4521',
      billTitle: 'Fair Wage and Worker Protection Act',
      aiOverview: 'This legislation raises the federal minimum wage to $15 per hour over three years, strengthens collective bargaining rights, and enhances workplace safety protections. It includes provisions for paid family leave and prohibits wage theft.',
      stage: 'passed-house',
      nextPhase: 'Contact your Senator before the April vote',
      category: 'Economy & Work',
      url: '/federal/bill/119/hr/4521',
      congress: '119'
    },
    'Gun Policy': {
      id: 'bill-cta-gun',
      type: 'billCTA',
      billNumber: 'H.R. 8',
      billTitle: 'Bipartisan Background Checks Act',
      aiOverview: 'This legislation requires background checks for all firearm sales and transfers, including private transactions and gun shows. It includes exceptions for certain transfers between family members and temporary transfers for hunting or sporting events.',
      stage: 'passed-house',
      nextPhase: 'Contact your Senator before the critical April vote',
      category: 'Gun Policy',
      url: '/federal/bill/119/hr/8',
      congress: '119'
    }
  };

  // State-specific news articles for each policy category
  const stateSpecificNewsByState: Record<string, Record<string, any>> = {
    'California': {
      'Abortion': { id: 1001, headline: "California Strengthens Reproductive Rights Protections", category: "Health", state: "California" },
      'Climate, Energy & Environment': { id: 1002, headline: "California Passes Landmark Climate Legislation", category: "Energy", state: "California" },
      'Criminal Justice': { id: 1003, headline: "California Advances Prison Reform Initiative", category: "Crime and Law Enforcement", state: "California" },
      'Death Penalty': { id: 1004, headline: "California Reviews Death Penalty Moratorium", category: "Crime and Law Enforcement", state: "California" },
      'Defense & National Security': { id: 1005, headline: "California Military Bases Receive Infrastructure Funding", category: "Armed Forces and National Security", state: "California" },
      'Discrimination & Prejudice': { id: 1006, headline: "California Expands Anti-Discrimination Protections", category: "Civil Rights and Liberties, Minority Issues", state: "California" },
      'Drug Policy': { id: 1007, headline: "California Launches Substance Abuse Treatment Program", category: "Health", state: "California" },
      'Economy & Work': { id: 1008, headline: "California Raises Minimum Wage Standards", category: "Labor and Employment", state: "California" },
      'Education': { id: 1009, headline: "California Increases School Funding Allocation", category: "Education", state: "California" },
      'Free Speech & Press': { id: 1010, headline: "California Protects Journalist Shield Laws", category: "Civil Rights and Liberties, Minority Issues", state: "California" },
      'Gun Policy': { id: 1011, headline: "California Implements Enhanced Gun Safety Measures", category: "Crime and Law Enforcement", state: "California" },
      'Health Policy': { id: 1012, headline: "California Expands Universal Healthcare Access", category: "Health", state: "California" },
      'Immigration & Migration': { id: 1013, headline: "California Sanctuary State Policies Upheld", category: "Immigration", state: "California" },
      'International Affairs': { id: 1014, headline: "California Trade Partnerships with Pacific Nations", category: "International Affairs", state: "California" },
      'LGBT Acceptance': { id: 1015, headline: "California Advances LGBTQ+ Rights Legislation", category: "Civil Rights and Liberties, Minority Issues", state: "California" },
      'National Conditions': { id: 1016, headline: "California Voting Rights Expansion Bill Passes", category: "Government Operations and Politics", state: "California" },
      'Privacy Rights': { id: 1017, headline: "California Consumer Privacy Act Strengthened", category: "Civil Rights and Liberties, Minority Issues", state: "California" },
      'Religion & Government': { id: 1018, headline: "California Religious Freedom Protections Reviewed", category: "Arts, Culture, Religion", state: "California" },
      'Social Security & Medicare': { id: 1019, headline: "California Senior Benefits Program Expanded", category: "Social Welfare", state: "California" },
      'Technology Policy Issues': { id: 1020, headline: "California Tech Regulation Bill Advances", category: "Science, Technology, Communications", state: "California" }
    },
    'New York': {
      'Abortion': { id: 1101, headline: "New York Codifies Reproductive Rights in State Law", category: "Health", state: "New York" },
      'Climate, Energy & Environment': { id: 1102, headline: "New York Green Energy Initiative Launched", category: "Energy", state: "New York" },
      'Criminal Justice': { id: 1103, headline: "New York Advances Criminal Justice Reform Initiative", category: "Crime and Law Enforcement", state: "New York" },
      'Death Penalty': { id: 1104, headline: "New York Death Penalty Abolition Reaffirmed", category: "Crime and Law Enforcement", state: "New York" },
      'Defense & National Security': { id: 1105, headline: "New York National Guard Modernization Plan", category: "Armed Forces and National Security", state: "New York" },
      'Discrimination & Prejudice': { id: 1106, headline: "New York Hate Crime Prevention Act Signed", category: "Civil Rights and Liberties, Minority Issues", state: "New York" },
      'Drug Policy': { id: 1107, headline: "New York Cannabis Legalization Implementation", category: "Health", state: "New York" },
      'Economy & Work': { id: 1108, headline: "New York Worker Protection Laws Strengthened", category: "Labor and Employment", state: "New York" },
      'Education': { id: 1109, headline: "New York Education Funding Formula Reformed", category: "Education", state: "New York" },
      'Free Speech & Press': { id: 1110, headline: "New York Press Freedom Shield Law Enhanced", category: "Civil Rights and Liberties, Minority Issues", state: "New York" },
      'Gun Policy': { id: 1111, headline: "New York SAFE Act Provisions Expanded", category: "Crime and Law Enforcement", state: "New York" },
      'Health Policy': { id: 1112, headline: "New York Health Exchange Program Improved", category: "Health", state: "New York" },
      'Immigration & Migration': { id: 1113, headline: "New York Green Light Law Implementation", category: "Immigration", state: "New York" },
      'International Affairs': { id: 1114, headline: "New York International Trade Office Expanded", category: "International Affairs", state: "New York" },
      'LGBT Acceptance': { id: 1115, headline: "New York LGBTQ+ Youth Protection Act Passed", category: "Civil Rights and Liberties, Minority Issues", state: "New York" },
      'National Conditions': { id: 1116, headline: "New York Voting Rights Restoration Bill Signed", category: "Government Operations and Politics", state: "New York" },
      'Privacy Rights': { id: 1117, headline: "New York Digital Privacy Act Introduced", category: "Civil Rights and Liberties, Minority Issues", state: "New York" },
      'Religion & Government': { id: 1118, headline: "New York Religious Accommodation Laws Updated", category: "Arts, Culture, Religion", state: "New York" },
      'Social Security & Medicare': { id: 1119, headline: "New York Senior Care Enhancement Program", category: "Social Welfare", state: "New York" },
      'Technology Policy Issues': { id: 1120, headline: "New York Tech Worker Rights Bill Proposed", category: "Science, Technology, Communications", state: "New York" }
    },
    'Texas': {
      'Abortion': { id: 1201, headline: "Texas Abortion Law Enforcement Updates", category: "Health", state: "Texas" },
      'Climate, Energy & Environment': { id: 1202, headline: "Texas Renewable Energy Grid Expansion", category: "Energy", state: "Texas" },
      'Criminal Justice': { id: 1203, headline: "Texas Police Reform Measures Debated", category: "Crime and Law Enforcement", state: "Texas" },
      'Death Penalty': { id: 1204, headline: "Texas Death Penalty Procedures Reviewed", category: "Crime and Law Enforcement", state: "Texas" },
      'Defense & National Security': { id: 1205, headline: "Texas Military Installation Funding Secured", category: "Armed Forces and National Security", state: "Texas" },
      'Discrimination & Prejudice': { id: 1206, headline: "Texas Civil Rights Enforcement Enhanced", category: "Civil Rights and Liberties, Minority Issues", state: "Texas" },
      'Drug Policy': { id: 1207, headline: "Texas Drug Court Program Expansion", category: "Health", state: "Texas" },
      'Economy & Work': { id: 1208, headline: "Texas Job Creation Incentive Program Launched", category: "Labor and Employment", state: "Texas" },
      'Education': { id: 1209, headline: "Texas Legislature Debates Education Funding Reform", category: "Education", state: "Texas" },
      'Free Speech & Press': { id: 1210, headline: "Texas Campus Free Speech Bill Considered", category: "Civil Rights and Liberties, Minority Issues", state: "Texas" },
      'Gun Policy': { id: 1211, headline: "Texas Constitutional Carry Law Implementation", category: "Crime and Law Enforcement", state: "Texas" },
      'Health Policy': { id: 1212, headline: "Texas Medicaid Expansion Debate Continues", category: "Health", state: "Texas" },
      'Immigration & Migration': { id: 1213, headline: "Texas Border Security Funding Approved", category: "Immigration", state: "Texas" },
      'International Affairs': { id: 1214, headline: "Texas Mexico Trade Relations Strengthened", category: "International Affairs", state: "Texas" },
      'LGBT Acceptance': { id: 1215, headline: "Texas LGBTQ+ Rights Legislation Debated", category: "Civil Rights and Liberties, Minority Issues", state: "Texas" },
      'National Conditions': { id: 1216, headline: "Texas Voter ID Law Modifications Proposed", category: "Government Operations and Politics", state: "Texas" },
      'Privacy Rights': { id: 1217, headline: "Texas Data Protection Bill Introduced", category: "Civil Rights and Liberties, Minority Issues", state: "Texas" },
      'Religion & Government': { id: 1218, headline: "Texas Religious Liberty Act Provisions", category: "Arts, Culture, Religion", state: "Texas" },
      'Social Security & Medicare': { id: 1219, headline: "Texas Senior Services Program Enhanced", category: "Social Welfare", state: "Texas" },
      'Technology Policy Issues': { id: 1220, headline: "Texas Tech Industry Regulation Reviewed", category: "Science, Technology, Communications", state: "Texas" }
    },
    'Florida': {
      'Abortion': { id: 1301, headline: "Florida Abortion Restriction Laws Updated", category: "Health", state: "Florida" },
      'Climate, Energy & Environment': { id: 1302, headline: "Florida Climate Resilience Infrastructure Plan", category: "Energy", state: "Florida" },
      'Criminal Justice': { id: 1303, headline: "Florida Prison System Reform Initiative", category: "Crime and Law Enforcement", state: "Florida" },
      'Death Penalty': { id: 1304, headline: "Florida Death Penalty Appeal Process Reformed", category: "Crime and Law Enforcement", state: "Florida" },
      'Defense & National Security': { id: 1305, headline: "Florida Military Base Modernization Project", category: "Armed Forces and National Security", state: "Florida" },
      'Discrimination & Prejudice': { id: 1306, headline: "Florida Anti-Bias Training Program Implemented", category: "Civil Rights and Liberties, Minority Issues", state: "Florida" },
      'Drug Policy': { id: 1307, headline: "Florida Opioid Crisis Response Enhanced", category: "Health", state: "Florida" },
      'Economy & Work': { id: 1308, headline: "Florida Economic Development Zones Expanded", category: "Labor and Employment", state: "Florida" },
      'Education': { id: 1309, headline: "Florida School Choice Program Modified", category: "Education", state: "Florida" },
      'Free Speech & Press': { id: 1310, headline: "Florida Public Records Access Laws Reviewed", category: "Civil Rights and Liberties, Minority Issues", state: "Florida" },
      'Gun Policy': { id: 1311, headline: "Florida Gun Safety Training Requirements", category: "Crime and Law Enforcement", state: "Florida" },
      'Health Policy': { id: 1312, headline: "Florida Addresses Healthcare Access in Rural Communities", category: "Health", state: "Florida" },
      'Immigration & Migration': { id: 1313, headline: "Florida Immigration Enforcement Policies", category: "Immigration", state: "Florida" },
      'International Affairs': { id: 1314, headline: "Florida Latin America Trade Partnership", category: "International Affairs", state: "Florida" },
      'LGBT Acceptance': { id: 1315, headline: "Florida LGBTQ+ Policy Legislation Reviewed", category: "Civil Rights and Liberties, Minority Issues", state: "Florida" },
      'National Conditions': { id: 1316, headline: "Florida Election Security Measures Enhanced", category: "Government Operations and Politics", state: "Florida" },
      'Privacy Rights': { id: 1317, headline: "Florida Student Data Privacy Act Proposed", category: "Civil Rights and Liberties, Minority Issues", state: "Florida" },
      'Religion & Government': { id: 1318, headline: "Florida Religious Expression Protection Bill", category: "Arts, Culture, Religion", state: "Florida" },
      'Social Security & Medicare': { id: 1319, headline: "Florida Medicare Advantage Program Expansion", category: "Social Welfare", state: "Florida" },
      'Technology Policy Issues': { id: 1320, headline: "Florida Digital Infrastructure Investment", category: "Science, Technology, Communications", state: "Florida" }
    }
  };

  // Get state-specific articles based on user's state and current filter
  const getStateSpecificArticles = (filter: string) => {
    console.log('getStateSpecificArticles called:', { userState, filter, zipCode });

    if (!userState) {
      console.log('No userState available');
      return [];
    }

    const stateArticles = stateSpecificNewsByState[userState.state];
    if (!stateArticles) {
      console.log('No state articles for state:', userState.state);
      return [];
    }

    // For "all" filter, return ALL state articles
    if (filter === 'all' || filter === 'news') {
      const allStateArticles = Object.values(stateArticles);
      console.log('Returning ALL state articles for filter:', { state: userState.state, filter, count: allStateArticles.length });
      return allStateArticles;
    }

    // For campaigns and bills filters, don't return state news articles
    return [];
  };

  const stateSpecificArticles = getStateSpecificArticles(selectedFilter);

  // Mock news stories data - stories for Congressional policy categories
  const newsStories = [
    // Health
    {
      id: 1,
      headline: "Reproductive Rights Act Faces Congressional Review",
      description: "The landmark legislation aims to codify abortion access protections at the federal level. Women's rights organizations are mobilizing support as the bill moves through committee.",
      image: "/api/placeholder/400/400",
      category: "Health"
    },
    {
      id: 2,
      headline: "Healthcare Access Bill Expands Coverage for Reproductive Services",
      description: "New federal legislation would ensure insurance coverage for comprehensive reproductive healthcare. Women's health advocates see this as critical for healthcare equity.",
      image: "/api/placeholder/400/400",
      category: "Health"
    },
    {
      id: 3,
      headline: "Mental Health Services Expansion Act Passes Committee",
      description: "Bipartisan coalition works to advance critical legislation addressing national priorities. Key stakeholders engage in strategic advocacy efforts as bill moves through legislative process.",
      image: "/api/placeholder/400/400",
      category: "Health"
    },

    // Energy
    {
      id: 4,
      headline: "Clean Energy Investment Act Targets Renewable Infrastructure",
      description: "The comprehensive bill would allocate $500 billion toward solar, wind, and battery storage projects. Environmental groups are pushing for swift passage before recess.",
      image: "/api/placeholder/400/400",
      category: "Energy"
    },
    {
      id: 5,
      headline: "Energy Independence Act Advances in Senate",
      description: "Congressional leaders advance comprehensive legislative package addressing key policy priorities. Advocacy organizations mobilize grassroots support for upcoming committee hearings and floor votes.",
      image: "/api/placeholder/400/400",
      category: "Energy"
    },
    {
      id: 6,
      headline: "Renewable Energy Tax Credits Extended",
      description: "New legislation extends tax incentives for solar and wind energy development. Industry leaders welcome the certainty for long-term planning and investment.",
      image: "/api/placeholder/400/400",
      category: "Energy"
    },

    // Environment
    {
      id: 7,
      headline: "Climate Action Bill HR-3838 Gains Bipartisan Support",
      description: "The landmark climate legislation promises to reduce carbon emissions by 50% over the next decade while creating millions of green jobs. Environmental advocates are calling it historic.",
      image: "/api/placeholder/400/400",
      category: "Environmental Protection"
    },
    {
      id: 8,
      headline: "Environmental Justice Bill Addresses Pollution in Communities",
      description: "New legislation would require environmental impact assessments in disadvantaged areas and provide cleanup funding. Community advocates highlight decades of environmental racism.",
      image: "/api/placeholder/400/400",
      category: "Environmental Protection"
    },
    {
      id: 9,
      headline: "Clean Air Standards Updated",
      description: "EPA proposes stricter regulations on industrial emissions. Environmental groups praise the move while industry advocates call for implementation flexibility.",
      image: "/api/placeholder/400/400",
      category: "Environmental Protection"
    },

    // Crime & Law
    {
      id: 10,
      headline: "Criminal Justice Reform Focuses on Sentencing Disparities",
      description: "The FIRST STEP Act expansion would address racial disparities in sentencing and increase rehabilitation programs. Criminal justice reform advocates are pushing for broader support.",
      image: "/api/placeholder/400/400",
      category: "Crime and Law Enforcement"
    },
    {
      id: 11,
      headline: "Police Reform Bill Mandates National Standards",
      description: "The comprehensive legislation would establish federal oversight of police departments and require de-escalation training. Civil rights groups call it a crucial step toward accountability.",
      image: "/api/placeholder/400/400",
      category: "Crime and Law Enforcement"
    },
    {
      id: 12,
      headline: "Prison Reform Act Expands Rehabilitation Programs",
      description: "New bill would increase funding for education and job training in federal prisons. Former inmates and advocacy groups highlight the importance of reentry support.",
      image: "/api/placeholder/400/400",
      category: "Crime and Law Enforcement"
    },

    // Defense & Security
    {
      id: 13,
      headline: "Defense Authorization Act Includes Cybersecurity Funding",
      description: "The annual defense bill allocates $15 billion for cybersecurity infrastructure and personnel. National security experts emphasize the growing threat landscape.",
      image: "/api/placeholder/400/400",
      category: "Armed Forces and National Security"
    },
    {
      id: 14,
      headline: "Veterans Healthcare Expansion Bill Advances",
      description: "New legislation would expand mental health services and modernize VA facilities nationwide. Veterans' organizations are advocating for swift passage.",
      image: "/api/placeholder/400/400",
      category: "Armed Forces and National Security"
    },
    {
      id: 15,
      headline: "Military Family Support Act Addresses Housing Crisis",
      description: "The bill would increase housing allowances and improve on-base accommodation quality. Military families and advocacy groups highlight the urgent need for reform.",
      image: "/api/placeholder/400/400",
      category: "Armed Forces and National Security"
    },

    // Discrimination & Prejudice
    {
      id: 16,
      headline: "Equality Act Faces Senate Vote on Civil Rights Protections",
      description: "The comprehensive civil rights bill would extend federal protections to include sexual orientation and gender identity. LGBTQ+ advocacy groups are mobilizing unprecedented support.",
      image: "/api/placeholder/400/400",
      category: "Civil Rights and Liberties, Minority Issues"
    },
    {
      id: 17,
      headline: "Anti-Hate Crime Legislation Strengthens Federal Response",
      description: "New bill would enhance hate crime reporting and provide additional resources for investigation. Civil rights organizations emphasize the rising threat of extremism.",
      image: "/api/placeholder/400/400",
      category: "Civil Rights and Liberties, Minority Issues"
    },
    {
      id: 18,
      headline: "Workplace Discrimination Protection Act Expands Coverage",
      description: "The legislation would strengthen employment protections and increase penalties for discrimination. Workers' rights advocates call it essential for workplace equity.",
      image: "/api/placeholder/400/400",
      category: "Civil Rights and Liberties, Minority Issues"
    },

    // Drug Policy
    {
      id: 19,
      headline: "Drug Decriminalization Bill Emphasizes Treatment Over Incarceration",
      description: "The comprehensive reform would redirect drug offense penalties toward treatment programs. Criminal justice and public health advocates unite behind harm reduction approach.",
      image: "/api/placeholder/400/400",
      category: "Health"
    },
    {
      id: 20,
      headline: "Prescription Drug Pricing Reform Targets Big Pharma",
      description: "New legislation would allow Medicare to negotiate drug prices and cap insulin costs. Patient advocacy groups highlight the life-or-death nature of affordable medication.",
      image: "/api/placeholder/400/400",
      category: "Health"
    },
    {
      id: 21,
      headline: "Opioid Crisis Response Act Expands Treatment Access",
      description: "The bill would increase funding for addiction treatment and recovery programs nationwide. Public health advocates emphasize the ongoing epidemic's devastating impact.",
      image: "/api/placeholder/400/400",
      category: "Health"
    },

    // Economy & Work
    {
      id: 22,
      headline: "Minimum Wage Increase Bill Targets $15 Federal Standard",
      description: "The Raise the Wage Act would gradually increase the federal minimum wage over five years. Labor unions and worker advocacy groups are pushing for swift passage.",
      image: "/api/placeholder/400/400",
      category: "Labor and Employment"
    },
    {
      id: 23,
      headline: "Worker Rights Protection Act Strengthens Union Organizing",
      description: "New legislation would protect workers' rights to organize and collectively bargain. Labor organizations highlight the importance of economic democracy.",
      image: "/api/placeholder/400/400",
      category: "Labor and Employment"
    },
    {
      id: 24,
      headline: "Small Business Support Bill Provides COVID Recovery Aid",
      description: "The comprehensive package would offer grants and low-interest loans to struggling small businesses. Business advocacy groups emphasize the need for continued support.",
      image: "/api/placeholder/400/400",
      category: "Labor and Employment"
    },

    // Education
    {
      id: 25,
      headline: "Education Funding Bill Proposes Free Community College",
      description: "The America's College Promise Act would make community college tuition-free for all students. Education groups are mobilizing students and families to contact representatives.",
      image: "/api/placeholder/400/400",
      category: "Education"
    },
    {
      id: 26,
      headline: "Student Debt Relief Act Addresses Loan Crisis",
      description: "The legislation would forgive up to $50,000 in federal student loans and reform the lending system. Student advocacy groups call it essential for economic recovery.",
      image: "/api/placeholder/400/400",
      category: "Education"
    },
    {
      id: 27,
      headline: "Teacher Pay Equity Bill Addresses Nationwide Shortage",
      description: "New federal legislation would provide grants to states that increase teacher salaries to competitive levels. Education unions highlight the recruitment and retention crisis.",
      image: "/api/placeholder/400/400",
      category: "Education"
    },

    // Free Speech & Press
    {
      id: 28,
      headline: "Press Freedom Protection Act Shields Journalists from Surveillance",
      description: "The bill would strengthen protections for journalists and whistleblowers against government surveillance. Press freedom advocates highlight threats to democratic accountability.",
      image: "/api/placeholder/400/400",
      category: "Civil Rights and Liberties, Minority Issues"
    },
    {
      id: 29,
      headline: "Social Media Regulation Bill Addresses Content Moderation",
      description: "New legislation would establish guidelines for platform content policies while protecting free speech. Digital rights groups emphasize the balance between safety and expression.",
      image: "/api/placeholder/400/400",
      category: "Civil Rights and Liberties, Minority Issues"
    },
    {
      id: 30,
      headline: "Campus Free Speech Act Protects Academic Expression",
      description: "The bill would require universities to maintain viewpoint neutrality and protect controversial speech. Academic freedom advocates call it essential for intellectual discourse.",
      image: "/api/placeholder/400/400",
      category: "Civil Rights and Liberties, Minority Issues"
    },

    // Gun Policy
    {
      id: 31,
      headline: "Gun Safety Legislation Includes Universal Background Checks",
      description: "The Bipartisan Safer Communities Act expands background check requirements and increases funding for mental health programs. Gun violence prevention advocates see this as crucial progress.",
      image: "/api/placeholder/400/400",
      category: "Crime and Law Enforcement"
    },
    {
      id: 32,
      headline: "Assault Weapons Ban Reintroduced with Bipartisan Support",
      description: "The legislation would prohibit the sale of high-capacity magazines and military-style weapons. Gun safety organizations are mobilizing survivors and families.",
      image: "/api/placeholder/400/400",
      category: "Crime and Law Enforcement"
    },
    {
      id: 33,
      headline: "Red Flag Law Enhancement Act Provides Federal Framework",
      description: "The bill would support state extreme risk protection order programs with federal funding. Gun violence prevention groups highlight the life-saving potential.",
      image: "/api/placeholder/400/400",
      category: "Crime and Law Enforcement"
    },

    // Health Policy
    {
      id: 34,
      headline: "Medicare for All Bill Proposes Universal Healthcare",
      description: "The comprehensive legislation would establish a single-payer healthcare system covering all Americans. Healthcare advocacy groups are organizing nationwide support.",
      image: "/api/placeholder/400/400",
      category: "Health"
    },
    {
      id: 35,
      headline: "Mental Health Parity Act Strengthens Insurance Coverage",
      description: "New legislation would enforce equal coverage for mental health and substance abuse treatment. Mental health advocates emphasize the persistent treatment gap.",
      image: "/api/placeholder/400/400",
      category: "Health"
    },
    {
      id: 36,
      headline: "Public Health Infrastructure Bill Addresses Pandemic Preparedness",
      description: "The bill would modernize public health systems and expand the healthcare workforce. Public health experts highlight lessons learned from COVID-19.",
      image: "/api/placeholder/400/400",
      category: "Health"
    },

    // Immigration & Migration
    {
      id: 37,
      headline: "Immigration Reform Bill Offers Path to Citizenship for Dreamers",
      description: "The comprehensive immigration bill would provide a pathway to citizenship for undocumented immigrants brought to the US as children. Immigration rights groups are organizing nationwide.",
      image: "/api/placeholder/400/400",
      category: "Immigration"
    },
    {
      id: 38,
      headline: "Border Security and Immigration Reform Act Seeks Bipartisan Solution",
      description: "The legislation combines border security measures with comprehensive immigration reform. Immigrant advocacy groups emphasize the need for humane policies.",
      image: "/api/placeholder/400/400",
      category: "Immigration"
    },
    {
      id: 39,
      headline: "Refugee Protection Act Expands Asylum Access",
      description: "New bill would increase refugee admissions and streamline the asylum process. Human rights organizations highlight the global displacement crisis.",
      image: "/api/placeholder/400/400",
      category: "Immigration"
    },

    // International Affairs
    {
      id: 40,
      headline: "Foreign Aid Authorization Act Emphasizes Development Goals",
      description: "The legislation would modernize US foreign assistance to focus on sustainable development and democracy promotion. International development advocates support the strategic approach.",
      image: "/api/placeholder/400/400",
      category: "International Affairs"
    },
    {
      id: 41,
      headline: "Global Climate Cooperation Bill Addresses International Response",
      description: "New legislation would enhance US leadership on international climate action and provide adaptation funding. Environmental groups emphasize global cooperation needs.",
      image: "/api/placeholder/400/400",
      category: "International Affairs"
    },
    {
      id: 42,
      headline: "Trade Policy Reform Act Emphasizes Worker Protections",
      description: "The bill would incorporate labor and environmental standards into trade agreements. Labor unions and environmental groups unite behind fair trade principles.",
      image: "/api/placeholder/400/400",
      category: "International Affairs"
    },

    // LGBT Acceptance
    {
      id: 43,
      headline: "Respect for Marriage Act Protects Same-Sex Marriage Rights",
      description: "The federal legislation would ensure recognition of same-sex marriages across all states. LGBTQ+ advocacy organizations are mobilizing support amid legal challenges.",
      image: "/api/placeholder/400/400",
      category: "Civil Rights and Liberties, Minority Issues"
    },
    {
      id: 44,
      headline: "Transgender Rights Protection Bill Advances in Congress",
      description: "New legislation would prohibit discrimination against transgender individuals in healthcare, education, and employment. LGBTQ+ advocates emphasize the urgent need for federal protections.",
      image: "/api/placeholder/400/400",
      category: "Civil Rights and Liberties, Minority Issues"
    },
    {
      id: 45,
      headline: "LGBTQ+ Youth Mental Health Act Addresses Crisis",
      description: "The bill would fund specialized mental health services and anti-bullying programs for LGBTQ+ youth. Advocacy groups highlight alarming suicide rates and discrimination.",
      image: "/api/placeholder/400/400",
      category: "Civil Rights and Liberties, Minority Issues"
    },

    // National Conditions
    {
      id: 46,
      headline: "Voting Rights Act HR-14 Faces Critical Senate Vote",
      description: "The For the People Act aims to expand voter access, end gerrymandering, and reduce money's influence in politics. Civil rights organizations are mobilizing unprecedented support.",
      image: "/api/placeholder/400/400",
      category: "Government Operations and Politics"
    },
    {
      id: 47,
      headline: "Government Ethics Reform Bill Strengthens Oversight",
      description: "New legislation would expand financial disclosure requirements and strengthen ethics enforcement. Government accountability groups emphasize the need for transparency.",
      image: "/api/placeholder/400/400",
      category: "Government Operations and Politics"
    },
    {
      id: 48,
      headline: "Infrastructure Investment Act Addresses National Needs",
      description: "The comprehensive package would modernize roads, bridges, broadband, and water systems nationwide. Infrastructure advocates highlight decades of underinvestment.",
      image: "/api/placeholder/400/400",
      category: "Government Operations and Politics"
    },

    // Privacy Rights
    {
      id: 49,
      headline: "Digital Privacy Protection Act Regulates Data Collection",
      description: "The comprehensive bill would establish federal data privacy standards and user consent requirements. Privacy advocates call it essential protection in the digital age.",
      image: "/api/placeholder/400/400",
      category: "Civil Rights and Liberties, Minority Issues"
    },
    {
      id: 50,
      headline: "Surveillance Reform Bill Limits Government Data Collection",
      description: "New legislation would require warrants for digital surveillance and strengthen oversight. Civil liberties groups emphasize constitutional protections.",
      image: "/api/placeholder/400/400",
      category: "Civil Rights and Liberties, Minority Issues"
    },
    {
      id: 51,
      headline: "Children's Online Privacy Act Protects Youth Data",
      description: "The bill would prohibit targeted advertising to minors and strengthen parental consent requirements. Child advocacy groups highlight online exploitation risks.",
      image: "/api/placeholder/400/400",
      category: "Civil Rights and Liberties, Minority Issues"
    },

    // Religion & Government
    {
      id: 52,
      headline: "Religious Freedom Restoration Act Faces Constitutional Review",
      description: "The legislation would strengthen religious liberty protections while balancing civil rights concerns. Faith-based organizations and civil rights groups engage in dialogue.",
      image: "/api/placeholder/400/400",
      category: "Arts, Culture, Religion"
    },
    {
      id: 53,
      headline: "Faith-Based Initiative Reform Bill Addresses Funding Equity",
      description: "New legislation would ensure equal access to federal funding while maintaining separation principles. Religious liberty advocates emphasize constitutional balance.",
      image: "/api/placeholder/400/400",
      category: "Arts, Culture, Religion"
    },
    {
      id: 54,
      headline: "Chaplaincy Services Expansion Act Supports Military Families",
      description: "The bill would expand chaplain services across military installations and VA facilities. Military family advocates highlight the importance of spiritual support.",
      image: "/api/placeholder/400/400",
      category: "Arts, Culture, Religion"
    },

    // Social Security & Medicare
    {
      id: 55,
      headline: "Social Security 2100 Act Expands Benefits and Solvency",
      description: "The comprehensive reform would increase benefits and extend the program's financial stability. Senior advocacy groups are mobilizing retirees and near-retirees.",
      image: "/api/placeholder/400/400",
      category: "Social Welfare"
    },
    {
      id: 56,
      headline: "Medicare Prescription Drug Negotiation Bill Targets Costs",
      description: "New legislation would allow Medicare to negotiate prescription drug prices directly with manufacturers. Senior advocates highlight the burden of medication costs.",
      image: "/api/placeholder/400/400",
      category: "Social Welfare"
    },
    {
      id: 57,
      headline: "Medicare Expansion Act Lowers Eligibility Age",
      description: "The bill would gradually lower Medicare eligibility from 65 to 60, covering millions more Americans. Healthcare advocates emphasize the coverage gap problem.",
      image: "/api/placeholder/400/400",
      category: "Social Welfare"
    },

    // Technology Policy Issues
    {
      id: 58,
      headline: "Artificial Intelligence Regulation Act Establishes Safety Standards",
      description: "The comprehensive bill would create federal oversight for AI development and deployment. Technology policy experts emphasize the need for proactive governance.",
      image: "/api/placeholder/400/400",
      category: "Science, Technology, Communications"
    },
    {
      id: 59,
      headline: "Broadband Equity Act Expands Rural Internet Access",
      description: "New legislation would invest $65 billion in high-speed internet infrastructure for underserved communities. Digital equity advocates highlight the persistent digital divide.",
      image: "/api/placeholder/400/400",
      category: "Science, Technology, Communications"
    },
    {
      id: 60,
      headline: "Platform Accountability Act Regulates Social Media Companies",
      description: "The bill would establish transparency requirements and algorithmic auditing for major platforms. Digital rights groups emphasize the need for democratic oversight.",
      image: "/api/placeholder/400/400",
      category: "Science, Technology, Communications"
    }
  ];

  // Get all real campaigns from the service and transform them for the homepage
  // Sort by engagement (supportCount + opposeCount) for campaigns with >25 engagement in last 7 days
  // Then by recency for the rest
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const allCampaigns = campaignsService.getAllCampaigns()
    .filter(campaign => campaign.isActive && (campaign.bill || campaign.poll || campaign.campaignType === 'Issue' || campaign.campaignType === 'Candidate'))
    .sort((a, b) => {
      const aEngagement = (a.supportCount || 0) + (a.opposeCount || 0);
      const bEngagement = (b.supportCount || 0) + (b.opposeCount || 0);
      const aCreatedAt = new Date(a.createdAt);
      const bCreatedAt = new Date(b.createdAt);
      const aIsRecent = aCreatedAt >= sevenDaysAgo;
      const bIsRecent = bCreatedAt >= sevenDaysAgo;
      const aHighEngagement = aIsRecent && aEngagement > 25;
      const bHighEngagement = bIsRecent && bEngagement > 25;

      // High engagement recent campaigns first (sorted by engagement)
      if (aHighEngagement && bHighEngagement) {
        return bEngagement - aEngagement;
      }
      if (aHighEngagement) return -1;
      if (bHighEngagement) return 1;

      // Then by recency
      return bCreatedAt.getTime() - aCreatedAt.getTime();
    });

  const campaignStories = allCampaigns.map(campaign => {
    // Poll campaign
    if (campaign.poll || campaign.campaignType === 'Poll' || campaign.campaignType === 'Voter Poll') {
      return {
        id: campaign.id,
        type: 'pollCampaign',
        organization: campaign.groupName,
        groupSlug: campaign.groupSlug,
        pollTitle: campaign.poll?.title || '',
        pollQuestion: campaign.poll?.question || '',
        description: campaign.poll?.description || '',
        responseCount: campaign.responseCount || 0,
        pollId: campaign.id,
        choices: campaign.poll?.choices || []
      };
    }

    // Candidate campaign
    if (campaign.campaignType === 'Candidate' && campaign.candidate) {
      return {
        id: campaign.id,
        type: 'candidateCampaign',
        organization: campaign.groupName,
        groupSlug: campaign.groupSlug,
        position: campaign.position,
        policyIssue: 'National Conditions',
        candidate1Name: campaign.candidate.candidate1Name,
        candidate1Bio: campaign.candidate.candidate1Bio || '',
        candidate2Name: campaign.candidate.candidate2Name,
        candidate2Bio: campaign.candidate.candidate2Bio || '',
        selectedCandidate: campaign.candidate.selectedCandidate,
        reasoning: campaign.reasoning,
        supportCount: campaign.supportCount,
        opposeCount: campaign.opposeCount
      };
    }

    // Issue campaign (no bill)
    if (campaign.campaignType === 'Issue' || !campaign.bill) {
      return {
        id: campaign.id,
        type: 'campaign',
        organization: campaign.groupName,
        groupSlug: campaign.groupSlug,
        position: campaign.position,
        policyIssue: 'National Conditions',
        billNumber: 'Issue',
        billTitle: campaign.reasoning?.substring(0, 50) || 'Issue Campaign',
        description: campaign.reasoning,
        supportCount: campaign.supportCount,
        opposeCount: campaign.opposeCount,
        issueCategory: 'National Conditions'
      };
    }

    // Regular bill campaign
    return {
      id: campaign.id,
      type: 'campaign',
      organization: campaign.groupName,
      groupSlug: campaign.groupSlug,
      position: campaign.position,
      policyIssue: 'National Conditions',
      billNumber: `${campaign.bill.type} ${campaign.bill.number}`,
      billTitle: campaign.bill.title || `${campaign.bill.type} ${campaign.bill.number}`,
      description: campaign.reasoning,
      supportCount: campaign.supportCount,
      opposeCount: campaign.opposeCount,
      congress: campaign.bill.congress || '119',
      billType: campaign.bill.type,
      billNumberOnly: campaign.bill.number
    };
  });


  // Interleave content in pattern: 2 News → 2 Bills → 1 Campaign → repeat
  // Per feed-rules.md specification
  const interleaveContent = (news: any[], bills: any[], campaigns: any[]) => {
    const result: any[] = [];
    let newsIndex = 0;
    let billsIndex = 0;
    let campaignsIndex = 0;

    // Pattern: 2 news, 2 bills, 1 campaign (5 items per cycle)
    while (newsIndex < news.length || billsIndex < bills.length || campaignsIndex < campaigns.length) {
      // Add 2 news items
      for (let i = 0; i < 2 && newsIndex < news.length; i++) {
        result.push(news[newsIndex++]);
      }

      // Add 2 bill items
      for (let i = 0; i < 2 && billsIndex < bills.length; i++) {
        result.push(bills[billsIndex++]);
      }

      // Add 1 campaign item
      if (campaignsIndex < campaigns.length) {
        result.push(campaigns[campaignsIndex++]);
      }
    }

    return result;
  };

  // Filter stories based on selected filter
  const getFilteredStories = () => {
    // Prepare news array (with state-specific articles if available)
    let newsArray = [...newsStories];
    if (stateSpecificArticles.length > 0) {
      newsArray = [...stateSpecificArticles, ...newsArray];
    }

    // Prepare bills array from billCTAByCategory
    const billsArray = Object.values(billCTAByCategory).filter(Boolean);

    // Prepare campaigns array (already sorted by engagement/recency)
    const campaignsArray = [...campaignStories];

    // Apply content type filter
    if (selectedFilter === 'news') {
      return newsArray;
    } else if (selectedFilter === 'campaigns') {
      return campaignsArray;
    } else if (selectedFilter === 'bills') {
      return billsArray;
    }

    // 'all' filter - use 2-2-1 interleaving pattern
    return interleaveContent(newsArray, billsArray, campaignsArray);
  };

  const filteredStories = getFilteredStories();

  // Find the label for the selected filter
  const getFilterLabel = (filterId: string) => {
    if (filterId === 'for-you') return 'For You';
    if (filterId === 'top-stories') return 'Top Stories';
    const issue = issueCategories.find(cat => cat.id === filterId);
    return issue?.label || 'Issues';
  };

  return (
    <>
      {/* Popular Bills Section - Full width at top */}
      <PopularBills />

      {/* News and Campaigns Section - 3 column layout */}
      <HomepageNewsSection newsStories={newsStories} />

      <div
        className="relative px-4 md:px-0"
        style={{
          maxWidth: '672px',
          margin: '0 auto'
        }}
      >
        {/* Filters Section - Desktop with dropdown, Mobile with badges */}
        <div className="sticky top-0 z-20 bg-background">
        {/* Desktop Filters */}
        <div className="hidden md:block py-10">
          <div className="px-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl font-medium">eVotersUnited.org</div>
              <div className="flex items-center gap-2">
                <button
                  className={`cursor-pointer transition-colors text-sm px-4 py-1.5 rounded-full border ${
                    selectedFilter === 'all'
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-transparent text-foreground border-border hover:bg-secondary'
                  }`}
                  onClick={() => setSelectedFilter('all')}
                >
                  For You
                </button>
                <button
                  className={`cursor-pointer transition-colors text-sm px-4 py-1.5 rounded-full border ${
                    selectedFilter === 'news'
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-transparent text-foreground border-border hover:bg-secondary'
                  }`}
                  onClick={() => setSelectedFilter('news')}
                >
                  News
                </button>
                <button
                  className={`cursor-pointer transition-colors text-sm px-4 py-1.5 rounded-full border ${
                    selectedFilter === 'campaigns'
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-transparent text-foreground border-border hover:bg-secondary'
                  }`}
                  onClick={() => setSelectedFilter('campaigns')}
                >
                  Campaigns
                </button>
                <button
                  className={`cursor-pointer transition-colors text-sm px-4 py-1.5 rounded-full border ${
                    selectedFilter === 'bills'
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-transparent text-foreground border-border hover:bg-secondary'
                  }`}
                  onClick={() => setSelectedFilter('bills')}
                >
                  Bills
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filters and Headline */}
        <div className="md:hidden">
          <div className="px-4 py-6">
            <div className="text-2xl font-medium mb-4">eVotersUnited.org</div>
            <div className="flex gap-2 overflow-x-auto">
              <button
                className={`cursor-pointer transition-colors text-sm px-4 py-1.5 rounded-full border whitespace-nowrap ${
                  selectedFilter === 'all'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent text-foreground border-border hover:bg-secondary'
                }`}
                onClick={() => setSelectedFilter('all')}
              >
                For You
              </button>
              <button
                className={`cursor-pointer transition-colors text-sm px-4 py-1.5 rounded-full border whitespace-nowrap ${
                  selectedFilter === 'news'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent text-foreground border-border hover:bg-secondary'
                }`}
                onClick={() => setSelectedFilter('news')}
              >
                News
              </button>
              <button
                className={`cursor-pointer transition-colors text-sm px-4 py-1.5 rounded-full border whitespace-nowrap ${
                  selectedFilter === 'campaigns'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent text-foreground border-border hover:bg-secondary'
                }`}
                onClick={() => setSelectedFilter('campaigns')}
              >
                Campaigns
              </button>
              <button
                className={`cursor-pointer transition-colors text-sm px-4 py-1.5 rounded-full border whitespace-nowrap ${
                  selectedFilter === 'bills'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent text-foreground border-border hover:bg-secondary'
                }`}
                onClick={() => setSelectedFilter('bills')}
              >
                Bills
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="md:snap-none snap-y snap-mandatory md:overflow-visible md:pb-8">
        {/* News Stories and Campaign Cards */}
        {filteredStories.map((item, index) => {
          if (item.type === 'billCTA') {
            // Bill CTA Card
            return (
              <div key={item.id} className="md:mb-8 md:px-4 snap-start md:snap-none md:h-auto md:min-h-0 flex items-start pt-4 md:items-center md:pt-0 md:block">
                <Card className="relative my-2 md:my-0 w-full md:w-full overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                  {/* Mobile Layout */}
                  <div className="md:hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="default" className="text-sm px-3 py-1 font-bold">{item.billNumber}</Badge>
                        <Badge variant="outline" className="text-xs px-2 py-1">Action Needed</Badge>
                      </div>
                      <h3 className="text-xl font-bold mb-4 leading-tight">{item.billTitle}</h3>

                      <div className="mb-6">
                        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">AI Overview</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.aiOverview}</p>
                      </div>

                      <div className="mb-6 bg-gray-50 rounded-lg p-4 flex justify-center">
                        <BillProgress stage={item.stage} />
                      </div>

                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-4">
                        <p className="text-sm font-semibold text-primary flex-1">{item.nextPhase}</p>
                        <Button size="lg" className="text-base flex-shrink-0" asChild>
                          <Link href={`/advocacy-message?congress=${item.congress || '119'}&type=${item.billNumber.split(' ')[0].replace(/\./g, '')}&number=${item.billNumber.split(' ')[1]}`}>
                            Voice your opinion
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:block">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="default" className="text-xs px-2 py-1 font-bold">{item.billNumber}</Badge>
                        <Badge variant="outline" className="text-xs px-2 py-1">Action Needed</Badge>
                      </div>
                      <h3 className="text-lg font-bold mb-3 leading-tight">{item.billTitle}</h3>

                      <div className="mb-4">
                        <h4 className="text-xs font-semibold mb-2 text-muted-foreground">AI Overview</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{item.aiOverview}</p>
                      </div>

                      <div className="mb-4 bg-gray-50 rounded-lg p-3 flex justify-center">
                        <BillProgress stage={item.stage} />
                      </div>

                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                        <p className="text-xs font-semibold text-primary flex-1">{item.nextPhase}</p>
                        <Button size="sm" className="text-xs flex-shrink-0" asChild>
                          <Link href={`/advocacy-message?congress=${item.congress || '119'}&type=${item.billNumber.split(' ')[0].replace(/\./g, '')}&number=${item.billNumber.split(' ')[1]}`}>
                            Voice your opinion
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </div>
            );
          } else if (item.type === 'campaign') {
            // Campaign Card
            const isSupport = item.position === 'Support';
            const isOppose = item.position === 'Oppose';
            const badgeVariant = isSupport ? 'default' : isOppose ? 'destructive' : 'secondary';
            const PositionIcon = isSupport ? ThumbsUp : isOppose ? ThumbsDown : null;

            // Build advocacy URL with query params if bill info is available
            const advocacyUrl = item.billType && item.billNumberOnly
              ? `/advocacy-message?congress=${item.congress || '119'}&type=${item.billType.toUpperCase()}&number=${item.billNumberOnly}`
              : item.issueCategory
                ? `/advocacy-message?issue=${encodeURIComponent(item.issueCategory)}`
                : '/advocacy-message';

            return (
              <div key={item.id} className="md:mb-8 md:px-4 snap-start md:snap-none md:h-auto md:min-h-0 flex items-start pt-4 md:items-center md:pt-0 md:block">
                <Card className="relative my-2 md:my-0 w-full md:w-full overflow-hidden h-[608px] md:h-auto">
                  {/* Mobile Layout - No image */}
                  <div className="md:hidden">
                    <CardContent className="p-6 h-full flex flex-col">
                      <Link href={`/issues/${convertCategoryToSlug(item.policyIssue)}`}>
                        <Badge variant="secondary" className="mb-4 w-fit text-sm px-3 py-1 hover:bg-secondary/80 transition-colors cursor-pointer">{item.policyIssue}</Badge>
                      </Link>
                      <div className="mb-6">
                        <div className="text-base text-muted-foreground font-semibold mb-3">{item.organization}</div>
                        <Badge variant={badgeVariant} className="flex items-center gap-1 text-base px-4 py-2 w-fit">
                          {PositionIcon && <PositionIcon className="h-5 w-5" />}
                          <span>{item.position}</span>
                        </Badge>
                      </div>
                      <h3 className="text-2xl font-bold mb-8 line-clamp-2 leading-tight">{item.billNumber}: {item.billTitle}</h3>
                      <p className="text-muted-foreground text-lg mb-8 flex-1 overflow-hidden leading-relaxed line-clamp-3">{item.description}</p>

                      <div className="flex items-center justify-between mt-auto">
                        <Button size="lg" variant="outline" className="text-base px-6 py-3" asChild>
                          <Link href={advocacyUrl}>
                            {item.position} Issue
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                        <Eye className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </div>

                  {/* Desktop Layout - No image, full width content */}
                  <div className="hidden md:block">
                    <CardContent className="p-6">
                      <Link href={`/issues/${convertCategoryToSlug(item.policyIssue)}`}>
                        <Badge variant="secondary" className="mb-2 w-fit text-xs px-2 py-1 hover:bg-secondary/80 transition-colors cursor-pointer">{item.policyIssue}</Badge>
                      </Link>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted-foreground">{item.organization}</div>
                        <Badge variant={badgeVariant} className="flex items-center gap-1 text-xs px-2 py-1">
                          {PositionIcon && <PositionIcon className="h-3 w-3" />}
                          <span>{item.position}</span>
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold mb-3 line-clamp-2">{item.billNumber}: {item.billTitle}</h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <Button size="sm" variant="outline" className="text-xs" asChild>
                          <Link href={advocacyUrl}>
                            {item.position} Issue
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </div>
            );
          } else if (item.type === 'candidateCampaign') {
            // Candidate Campaign Card
            return (
              <div key={item.id} className="md:mb-8 md:px-4 snap-start md:snap-none md:h-auto md:min-h-0 flex items-start pt-4 md:items-center md:pt-0 md:block">
                <CandidateCampaignFeedCard
                  candidate1Name={item.candidate1Name}
                  candidate1Bio={item.candidate1Bio}
                  candidate2Name={item.candidate2Name}
                  candidate2Bio={item.candidate2Bio}
                  selectedCandidate={item.selectedCandidate}
                  position={item.position}
                  reasoning={item.reasoning}
                  supportCount={item.supportCount}
                  opposeCount={item.opposeCount}
                  groupSlug={item.groupSlug}
                  groupName={item.organization}
                  policyIssue={item.policyIssue}
                />
              </div>
            );
          } else if (item.type === 'pollCampaign') {
            // Poll Campaign Card
            return (
              <div key={item.id} className="md:mb-8 md:px-4 snap-start md:snap-none md:h-auto md:min-h-0 flex items-start pt-4 md:items-center md:pt-0 md:block">
                <PollCampaignFeedCard
                  groupName={item.organization}
                  groupSlug={item.groupSlug}
                  pollTitle={item.pollTitle}
                  pollQuestion={item.pollQuestion}
                  description={item.description}
                  responseCount={item.responseCount || 0}
                  pollId={item.pollId}
                  campaignUrl={`/campaigns/${item.groupSlug}/${item.pollId}`}
                  choices={item.choices}
                />
              </div>
            );
          } else {
            // News Story Card
            return (
              <div key={item.id} className="md:mb-8 md:px-4 snap-start md:snap-none md:h-auto md:min-h-0 flex items-start pt-4 md:items-center md:pt-0 md:block">
                <Card className="relative my-2 md:my-0 w-full md:w-full overflow-hidden md:h-auto">
                  {/* Mobile Layout - Image on top */}
                  <div className="md:hidden">
                    <div className="relative w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <div className="text-muted-foreground/50 text-sm">News Image</div>
                      <div className="absolute bottom-4 left-4">
                        <Link href={`/issues/${convertCategoryToSlug(mapPolicyAreaToSiteCategory(item.category) || item.category)}`}>
                          <Badge variant="secondary" className="text-xs px-2 py-1 cursor-pointer hover:bg-secondary/80">{mapPolicyAreaToSiteCategory(item.category) || item.category}</Badge>
                        </Link>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      {item.state && (
                        <div className="mb-3">
                          <Badge variant="default" className="text-xs px-2 py-1">{item.state}</Badge>
                        </div>
                      )}
                      <Link href={`/article/${item.id}`}>
                        <h3 className="text-lg font-bold mb-3 line-clamp-2 hover:underline cursor-pointer">{item.headline}</h3>
                      </Link>
                      {!item.state && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          Congressional leaders advance comprehensive legislative package addressing key policy priorities. Advocacy organizations mobilize grassroots support for upcoming committee hearings and floor votes.
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground mb-4 flex flex-wrap gap-x-1">
                        <span className="hover:underline cursor-pointer">New York Times</span> •
                        <span className="hover:underline cursor-pointer">Wall Street Journal</span> •
                        <span className="hover:underline cursor-pointer">Reuters</span> •
                        <span className="hover:underline cursor-pointer">Associated Press</span> •
                        <span className="hover:underline cursor-pointer">BBC News</span> •
                        <span className="hover:underline cursor-pointer">The Guardian</span> •
                        <span className="hover:underline cursor-pointer">Financial Times</span> •
                        <span className="hover:underline cursor-pointer">Bloomberg</span> •
                        <span className="hover:underline cursor-pointer">Washington Post</span> •
                        <span className="hover:underline cursor-pointer">Politico</span> •
                        <span className="hover:underline cursor-pointer">NPR</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Button size="sm" variant="outline" className="text-xs" asChild>
                          <Link href={`/advocacy-message?issue=${encodeURIComponent(item.category)}`}>
                            Send Message
                          </Link>
                        </Button>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </div>

                  {/* Desktop Layout - Image left, content right */}
                  <div className="hidden md:flex h-64">
                    <div className="relative w-64 h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                      <div className="text-muted-foreground/50 text-sm">News Image</div>
                      <div className="absolute bottom-4 left-4">
                        <Link href={`/issues/${convertCategoryToSlug(mapPolicyAreaToSiteCategory(item.category) || item.category)}`}>
                          <Badge variant="secondary" className="text-xs px-2 py-1 cursor-pointer hover:bg-secondary/80">{mapPolicyAreaToSiteCategory(item.category) || item.category}</Badge>
                        </Link>
                      </div>
                    </div>
                    <CardContent className="flex-1 p-6">
                      {item.state && (
                        <div className="mb-3">
                          <Badge variant="default" className="text-xs px-2 py-1">{item.state}</Badge>
                        </div>
                      )}
                      <Link href={`/article/${item.id}`}>
                        <h3 className="text-lg font-bold mb-3 line-clamp-2 hover:underline cursor-pointer">{item.headline}</h3>
                      </Link>
                      {!item.state && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          Bipartisan coalition works to advance critical legislation addressing national priorities. Key stakeholders engage in strategic advocacy efforts as bill moves through legislative process.
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground mb-4 flex flex-wrap gap-x-1">
                        <span className="hover:underline cursor-pointer">CNN</span> •
                        <span className="hover:underline cursor-pointer">Fox News</span> •
                        <span className="hover:underline cursor-pointer">NBC News</span> •
                        <span className="hover:underline cursor-pointer">CBS News</span> •
                        <span className="hover:underline cursor-pointer">ABC News</span> •
                        <span className="hover:underline cursor-pointer">MSNBC</span> •
                        <span className="hover:underline cursor-pointer">Politico</span> •
                        <span className="hover:underline cursor-pointer">USA Today</span> •
                        <span className="hover:underline cursor-pointer">The Hill</span> •
                        <span className="hover:underline cursor-pointer">Associated Press</span> •
                        <span className="hover:underline cursor-pointer">Reuters</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Button size="sm" variant="outline" className="text-xs" asChild>
                          <Link href={`/advocacy-message?issue=${encodeURIComponent(item.category)}`}>
                            Send Message
                          </Link>
                        </Button>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </div>
            );
          }
        })}
        </div>
      </div>
    </>
  );
}