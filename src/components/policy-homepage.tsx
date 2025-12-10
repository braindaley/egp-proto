'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { X, ChevronDown, Eye, ThumbsUp, ThumbsDown, ArrowRight, ExternalLink } from 'lucide-react';
import { BillProgress } from '@/components/BillProgress';
import Link from 'next/link';
import { SITE_ISSUE_CATEGORIES } from '@/lib/policy-area-mapping';
import { campaignsService } from '@/lib/campaigns';
import { PopularBills } from '@/components/popular-bills';
import { HomepageNewsSection } from '@/components/homepage-news-section';
import USMap from '@/components/USMap';
import { useZipCode } from '@/hooks/use-zip-code';
import { usePremiumAccess } from '@/hooks/use-premium-access';
import { PremiumUpgradeCTA } from '@/components/premium-upgrade-cta';

interface PolicyHomepageProps {
  policyCategory: string;
}

export default function PolicyHomepage({ policyCategory }: PolicyHomepageProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>(policyCategory.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'));
  const { zipCode } = useZipCode();
  const { isPremium } = usePremiumAccess();

  // State for the new sections
  const [latestBills, setLatestBills] = useState<any[]>([]);
  const [stateBills, setStateBills] = useState<any[]>([]);

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


  // Helper function to get state name and code from zip
  const getUserStateFromZip = (zip: string): { name: string; code: string } | null => {
    if (!zip) return null;
    const state = getStateFromZip(zip);
    return state ? { name: state.state, code: state.stateCode } : null;
  };

  // Get current user state
  const currentUserState = useMemo(() => getUserStateFromZip(zipCode || '90210'), [zipCode]);

  // Prepare issue categories for dropdown with "View all" option
  const issueCategories = useMemo(() => [
    { id: 'view-all', label: 'View all' },
    ...SITE_ISSUE_CATEGORIES.map(category => ({
      id: category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
      label: category
    }))
  ], []);

  // Mock Bill CTA data - bills that have passed committee and house (using SITE_ISSUE_CATEGORIES)
  const billCTAByCategory: Record<string, any> = {
    'Agriculture & Food': {
      id: 'bill-cta-agriculture',
      type: 'billCTA',
      billNumber: 'H.R. 2024',
      billTitle: 'Farm Bill Reauthorization Act',
      aiOverview: 'This comprehensive farm bill sets agricultural policy for the next five years, including crop insurance programs, nutrition assistance, and sustainable farming incentives. It addresses food security and supports rural communities.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Agriculture & Food',
      url: '/federal/bill/119/hr/2024'
    },
    'Animals': {
      id: 'bill-cta-animals',
      type: 'billCTA',
      billNumber: 'H.R. 1555',
      billTitle: 'Animal Welfare Enhancement Act',
      aiOverview: 'This legislation strengthens federal animal cruelty protections, increases penalties for animal abuse, and expands protections for wildlife. It includes provisions for animal shelter funding and rescue organization support.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Animals',
      url: '/federal/bill/119/hr/1555'
    },
    'Defense & Security': {
      id: 'bill-cta-defense',
      type: 'billCTA',
      billNumber: 'H.R. 2670',
      billTitle: 'National Defense Authorization Act',
      aiOverview: 'This annual defense authorization provides funding for military operations, benefits for service members and families, and investments in cybersecurity and national defense infrastructure.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Defense & Security',
      url: '/federal/bill/119/hr/2670'
    },
    'Civil Rights': {
      id: 'bill-cta-civil-rights',
      type: 'billCTA',
      billNumber: 'H.R. 5',
      billTitle: 'Equality Act',
      aiOverview: 'This legislation expands civil rights protections to prohibit discrimination based on sex, sexual orientation, and gender identity in employment, housing, public accommodations, and more.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Civil Rights',
      url: '/federal/bill/119/hr/5'
    },
    'Crime & Law': {
      id: 'bill-cta-crime',
      type: 'billCTA',
      billNumber: 'H.R. 2567',
      billTitle: 'Second Chance Reauthorization Act',
      aiOverview: 'This bill reauthorizes and expands the Second Chance Act, providing federal funding for reentry programs, job training, and substance abuse treatment for formerly incarcerated individuals.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Crime & Law',
      url: '/federal/bill/119/hr/2567'
    },
    'Economy & Finance': {
      id: 'bill-cta-economy',
      type: 'billCTA',
      billNumber: 'H.R. 4521',
      billTitle: 'Economic Growth and Investment Act',
      aiOverview: 'This legislation promotes economic growth through infrastructure investment, job creation programs, and support for small businesses. It includes provisions for workforce development and economic resilience.',
      stage: 'passed-house',
      nextPhase: 'Contact your Senator before the April vote',
      category: 'Economy & Finance',
      url: '/federal/bill/119/hr/4521'
    },
    'Education': {
      id: 'bill-cta-education',
      type: 'billCTA',
      billNumber: 'H.R. 3345',
      billTitle: 'Student Debt Relief and College Affordability Act',
      aiOverview: 'This bill provides student loan forgiveness for federal loan borrowers, makes community college tuition-free, and increases Pell Grant funding. It caps loan repayment and expands access to income-driven repayment plans.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Education',
      url: '/federal/bill/119/hr/3345'
    },
    'Energy': {
      id: 'bill-cta-energy',
      type: 'billCTA',
      billNumber: 'H.R. 3838',
      billTitle: 'Clean Energy Innovation and Deployment Act',
      aiOverview: 'This comprehensive energy bill invests in renewable energy infrastructure, carbon capture technology, and energy grid modernization. It includes tax incentives for clean energy adoption.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote in April',
      category: 'Energy',
      url: '/federal/bill/119/hr/3838'
    },
    'Environment': {
      id: 'bill-cta-environment',
      type: 'billCTA',
      billNumber: 'H.R. 2345',
      billTitle: 'Environmental Protection Enhancement Act',
      aiOverview: 'This legislation strengthens EPA enforcement authority, establishes new clean air and water standards, and provides funding for environmental cleanup in disadvantaged communities.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Environment',
      url: '/federal/bill/119/hr/2345'
    },
    'Families': {
      id: 'bill-cta-families',
      type: 'billCTA',
      billNumber: 'H.R. 1178',
      billTitle: 'Family Support Act',
      aiOverview: 'This bill expands paid family leave, increases child care support funding, and strengthens family support services. It includes provisions for work-life balance and family economic security.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Families',
      url: '/federal/bill/119/hr/1178'
    },
    'Health': {
      id: 'bill-cta-health',
      type: 'billCTA',
      billNumber: 'H.R. 1976',
      billTitle: 'Lower Drug Costs Now Act',
      aiOverview: 'This bill empowers Medicare to negotiate prescription drug prices, caps out-of-pocket drug costs for seniors, and invests savings into expanding dental, vision, and hearing coverage under Medicare.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Health',
      url: '/federal/bill/119/hr/1976'
    },
    'Housing': {
      id: 'bill-cta-housing',
      type: 'billCTA',
      billNumber: 'H.R. 2890',
      billTitle: 'Affordable Housing Investment Act',
      aiOverview: 'This legislation increases funding for affordable housing construction, expands rental assistance programs, and supports first-time homebuyer programs. It addresses the nationwide housing affordability crisis.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Housing',
      url: '/federal/bill/119/hr/2890'
    },
    'Immigration': {
      id: 'bill-cta-immigration',
      type: 'billCTA',
      billNumber: 'H.R. 6',
      billTitle: 'American Dream and Promise Act',
      aiOverview: 'This legislation provides a pathway to citizenship for Dreamers, TPS holders, and DED recipients. It allows eligible individuals who came to the U.S. as children to apply for permanent residence and eventually citizenship.',
      stage: 'passed-house',
      nextPhase: 'Contact your Senator before the April vote',
      category: 'Immigration',
      url: '/federal/bill/119/hr/6'
    },
    'Labor': {
      id: 'bill-cta-labor',
      type: 'billCTA',
      billNumber: 'H.R. 842',
      billTitle: 'Protecting the Right to Organize Act',
      aiOverview: 'This legislation strengthens collective bargaining rights, enhances workplace safety protections, and raises penalties for labor law violations. It includes provisions to protect workers who organize.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Labor',
      url: '/federal/bill/119/hr/842'
    },
    'Science & Tech': {
      id: 'bill-cta-tech',
      type: 'billCTA',
      billNumber: 'H.R. 3611',
      billTitle: 'AI Accountability and Transparency Act',
      aiOverview: 'This bill establishes a regulatory framework for artificial intelligence systems, requiring impact assessments for high-risk AI applications and transparency in algorithmic decision-making.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote in May',
      category: 'Science & Tech',
      url: '/federal/bill/119/hr/3611'
    },
    'Transportation': {
      id: 'bill-cta-transportation',
      type: 'billCTA',
      billNumber: 'H.R. 3684',
      billTitle: 'Infrastructure Investment and Jobs Act',
      aiOverview: 'This comprehensive infrastructure bill funds roads, bridges, public transit, and broadband expansion. It includes investments in clean transportation and electric vehicle charging infrastructure.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Transportation',
      url: '/federal/bill/119/hr/3684'
    },
    'Water Resources': {
      id: 'bill-cta-water',
      type: 'billCTA',
      billNumber: 'H.R. 1915',
      billTitle: 'Water Infrastructure Finance and Innovation Act',
      aiOverview: 'This legislation funds clean water infrastructure, lead pipe replacement, and water system upgrades. It addresses water security and protects drinking water quality.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Water Resources',
      url: '/federal/bill/119/hr/1915'
    }
  };

  // State-specific news articles for each policy category (using SITE_ISSUE_CATEGORIES)
  const stateSpecificNewsByState: Record<string, Record<string, any>> = {
    'California': {
      'Agriculture & Food': { id: 1001, headline: "California Farm Bill Addresses Water Rights", category: "Agriculture & Food", state: "California" },
      'Animals': { id: 1002, headline: "California Wildlife Protection Act Advances", category: "Animals", state: "California" },
      'Defense & Security': { id: 1003, headline: "California Military Bases Receive Infrastructure Funding", category: "Defense & Security", state: "California" },
      'Arts & Culture': { id: 1004, headline: "California Arts Council Funding Expanded", category: "Arts & Culture", state: "California" },
      'Civil Rights': { id: 1005, headline: "California Expands Civil Rights Protections", category: "Civil Rights", state: "California" },
      'Commerce': { id: 1006, headline: "California Small Business Support Act Passes", category: "Commerce", state: "California" },
      'Congress': { id: 1007, headline: "California Congressional Delegation Pushes Reform", category: "Congress", state: "California" },
      'Crime & Law': { id: 1008, headline: "California Advances Criminal Justice Reform", category: "Crime & Law", state: "California" },
      'Economy & Finance': { id: 1009, headline: "California Economic Recovery Plan Unveiled", category: "Economy & Finance", state: "California" },
      'Education': { id: 1010, headline: "California Increases School Funding Allocation", category: "Education", state: "California" },
      'Emergency Mgmt': { id: 1011, headline: "California Wildfire Response Funding Approved", category: "Emergency Mgmt", state: "California" },
      'Energy': { id: 1012, headline: "California Clean Energy Act Advances", category: "Energy", state: "California" },
      'Environment': { id: 1013, headline: "California Environmental Protection Bill Passes", category: "Environment", state: "California" },
      'Families': { id: 1014, headline: "California Paid Family Leave Expansion", category: "Families", state: "California" },
      'Banking & Finance': { id: 1015, headline: "California Consumer Financial Protections Strengthened", category: "Banking & Finance", state: "California" },
      'Trade': { id: 1016, headline: "California Trade Partnerships with Pacific Nations", category: "Trade", state: "California" },
      'Government': { id: 1017, headline: "California Government Transparency Act Passes", category: "Government", state: "California" },
      'Health': { id: 1018, headline: "California Expands Healthcare Access", category: "Health", state: "California" },
      'Housing': { id: 1019, headline: "California Affordable Housing Initiative Advances", category: "Housing", state: "California" },
      'Immigration': { id: 1020, headline: "California Immigration Policy Updates", category: "Immigration", state: "California" },
      'Foreign Affairs': { id: 1021, headline: "California International Trade Agreements", category: "Foreign Affairs", state: "California" },
      'Labor': { id: 1022, headline: "California Worker Protection Laws Strengthened", category: "Labor", state: "California" },
      'Law': { id: 1023, headline: "California Judicial Reform Bill Advances", category: "Law", state: "California" },
      'Native Issues': { id: 1024, headline: "California Tribal Rights Recognition Act", category: "Native Issues", state: "California" },
      'Public Lands': { id: 1025, headline: "California State Parks Expansion Approved", category: "Public Lands", state: "California" },
      'Science & Tech': { id: 1026, headline: "California Tech Regulation Bill Advances", category: "Science & Tech", state: "California" },
      'Social Welfare': { id: 1027, headline: "California Social Services Expansion", category: "Social Welfare", state: "California" },
      'Sports & Recreation': { id: 1028, headline: "California Youth Sports Safety Act", category: "Sports & Recreation", state: "California" },
      'Taxes': { id: 1029, headline: "California Tax Reform Initiative", category: "Taxes", state: "California" },
      'Transportation': { id: 1030, headline: "California High Speed Rail Update", category: "Transportation", state: "California" },
      'Water Resources': { id: 1031, headline: "California Water Conservation Bill Passes", category: "Water Resources", state: "California" }
    }
  };

  // Get state-specific articles based on user's state and current filter
  const getStateSpecificArticles = (filter: string) => {
    if (!currentUserState) {
      return [];
    }

    const stateArticles = stateSpecificNewsByState[currentUserState.name];
    if (!stateArticles) {
      return [];
    }

    // For the specific category filter, find the matching category
    const selectedCategory = issueCategories.find(cat => cat.id === filter);
    if (selectedCategory && selectedCategory.id !== 'view-all' && stateArticles[selectedCategory.label]) {
      const article = stateArticles[selectedCategory.label];
      return [article];
    }

    // No matching articles
    return [];
  };

  const stateSpecificArticles = getStateSpecificArticles(selectedFilter);

  // Mock news stories data - 3 stories for each SITE_ISSUE_CATEGORY
  const newsStories = [
    // Agriculture & Food
    {
      id: 1,
      headline: "Farm Bill Negotiations Enter Final Phase",
      description: "Congressional leaders are working to finalize the comprehensive farm bill that sets agricultural policy for the next five years. Farmers and food advocates push for sustainable farming provisions.",
      image: "/api/placeholder/400/400",
      category: "Agriculture & Food"
    },
    {
      id: 2,
      headline: "Food Security Act Addresses Rising Grocery Costs",
      description: "New legislation aims to expand food assistance programs and support local food production. Hunger relief organizations mobilize support for expanded benefits.",
      image: "/api/placeholder/400/400",
      category: "Agriculture & Food"
    },
    {
      id: 3,
      headline: "Sustainable Agriculture Investment Bill Advances",
      description: "Bipartisan legislation would fund regenerative farming practices and climate-smart agriculture. Environmental and farming groups find common ground on sustainability.",
      image: "/api/placeholder/400/400",
      category: "Agriculture & Food"
    },

    // Animals
    {
      id: 4,
      headline: "Animal Welfare Protection Act Strengthens Federal Standards",
      description: "Comprehensive animal protection legislation would enhance enforcement against animal cruelty. Animal rights advocates see opportunity for historic protections.",
      image: "/api/placeholder/400/400",
      category: "Animals"
    },
    {
      id: 5,
      headline: "Wildlife Conservation Bill Protects Endangered Species",
      description: "New legislation would expand protections for at-risk species and fund habitat restoration. Conservation groups push for swift passage before more species are lost.",
      image: "/api/placeholder/400/400",
      category: "Animals"
    },
    {
      id: 6,
      headline: "Pet Adoption Assistance Act Supports Animal Shelters",
      description: "Federal funding would help animal shelters expand adoption programs and reduce euthanasia rates. Rescue organizations prepare for increased resources.",
      image: "/api/placeholder/400/400",
      category: "Animals"
    },

    // Defense & Security
    {
      id: 7,
      headline: "Defense Authorization Act Includes Military Family Support",
      description: "Annual defense bill expands benefits for military families and veterans. Military advocacy groups praise provisions for housing and healthcare improvements.",
      image: "/api/placeholder/400/400",
      category: "Defense & Security"
    },
    {
      id: 8,
      headline: "Cybersecurity Enhancement Bill Targets Critical Infrastructure",
      description: "New legislation would strengthen protections for power grids and communication networks. National security experts emphasize urgency of digital threats.",
      image: "/api/placeholder/400/400",
      category: "Defense & Security"
    },
    {
      id: 9,
      headline: "Veterans Mental Health Act Expands Treatment Options",
      description: "Comprehensive mental health legislation addresses PTSD and suicide prevention for veterans. Veterans organizations mobilize support for expanded services.",
      image: "/api/placeholder/400/400",
      category: "Defense & Security"
    },

    // Arts & Culture
    {
      id: 10,
      headline: "National Arts Funding Bill Supports Cultural Institutions",
      description: "Legislation would increase NEA funding and support community arts programs. Arts advocates emphasize role of culture in community development.",
      image: "/api/placeholder/400/400",
      category: "Arts & Culture"
    },
    {
      id: 11,
      headline: "Cultural Heritage Preservation Act Protects Historic Sites",
      description: "New legislation would fund preservation of historically significant sites and artifacts. Historians push for expanded protections for cultural landmarks.",
      image: "/api/placeholder/400/400",
      category: "Arts & Culture"
    },
    {
      id: 12,
      headline: "Religious Freedom Protection Act Balances Rights",
      description: "Bipartisan legislation addresses religious liberty while maintaining civil rights protections. Faith communities and civil rights groups work toward compromise.",
      image: "/api/placeholder/400/400",
      category: "Arts & Culture"
    },

    // Civil Rights
    {
      id: 13,
      headline: "Equality Act Advances Civil Rights Protections",
      description: "Landmark legislation would expand anti-discrimination protections nationwide. Civil rights advocates see opportunity for historic progress in equality.",
      image: "/api/placeholder/400/400",
      category: "Civil Rights"
    },
    {
      id: 14,
      headline: "Hate Crimes Prevention Act Strengthens Federal Response",
      description: "Enhanced hate crimes legislation includes new protected categories and improved enforcement. Community organizations push for swift passage.",
      image: "/api/placeholder/400/400",
      category: "Civil Rights"
    },
    {
      id: 15,
      headline: "Voting Rights Restoration Act Expands Election Access",
      description: "New legislation would restore voting rights protections and expand access to polls. Democracy advocates mobilize for comprehensive election reform.",
      image: "/api/placeholder/400/400",
      category: "Civil Rights"
    },

    // Commerce
    {
      id: 16,
      headline: "Small Business Support Act Targets Economic Recovery",
      description: "Legislation would expand SBA programs and reduce regulatory burden for small businesses. Entrepreneurs push for streamlined access to capital.",
      image: "/api/placeholder/400/400",
      category: "Commerce"
    },
    {
      id: 17,
      headline: "Consumer Protection Enhancement Act Strengthens Oversight",
      description: "New legislation would expand FTC authority and protect consumers from predatory practices. Consumer advocates emphasize need for stronger enforcement.",
      image: "/api/placeholder/400/400",
      category: "Commerce"
    },
    {
      id: 18,
      headline: "E-Commerce Regulation Bill Addresses Online Marketplace Issues",
      description: "Comprehensive legislation would set standards for online retailers and protect consumers. Industry and consumer groups debate balanced approach.",
      image: "/api/placeholder/400/400",
      category: "Commerce"
    },

    // Congress
    {
      id: 19,
      headline: "Congressional Reform Act Addresses Legislative Process",
      description: "Bipartisan legislation would modernize congressional operations and improve transparency. Good government advocates push for institutional reforms.",
      image: "/api/placeholder/400/400",
      category: "Congress"
    },
    {
      id: 20,
      headline: "Congressional Accountability Act Strengthens Ethics Rules",
      description: "New legislation would enhance disclosure requirements and limit conflicts of interest. Ethics watchdogs support comprehensive reform measures.",
      image: "/api/placeholder/400/400",
      category: "Congress"
    },
    {
      id: 21,
      headline: "Legislative Transparency Act Improves Public Access",
      description: "Legislation would require real-time disclosure of lobbying contacts and campaign contributions. Open government advocates see momentum for transparency.",
      image: "/api/placeholder/400/400",
      category: "Congress"
    },

    // Crime & Law
    {
      id: 22,
      headline: "Police Reform Bill Advances Through Committee",
      description: "Comprehensive police reform legislation gains support from key lawmakers. Reform advocates push for accountability measures and community oversight provisions.",
      image: "/api/placeholder/400/400",
      category: "Crime & Law"
    },
    {
      id: 23,
      headline: "Sentencing Reform Act Addresses Prison Overcrowding",
      description: "Bipartisan legislation aims to reduce mandatory minimums and expand rehabilitation programs. Criminal justice advocates see opportunity for meaningful reform.",
      image: "/api/placeholder/400/400",
      category: "Crime & Law"
    },
    {
      id: 24,
      headline: "Community Safety Investment Bill Targets Violence Prevention",
      description: "New funding would support community-based programs to prevent violence and support victims. Local organizations prepare for expanded resources.",
      image: "/api/placeholder/400/400",
      category: "Crime & Law"
    },

    // Economy & Finance
    {
      id: 25,
      headline: "Economic Recovery Act Targets Job Creation",
      description: "Comprehensive economic legislation would invest in infrastructure and workforce development. Economists emphasize need for strategic investment.",
      image: "/api/placeholder/400/400",
      category: "Economy & Finance"
    },
    {
      id: 26,
      headline: "Inflation Reduction Measures Advance in Congress",
      description: "New legislation targets supply chain issues and price stabilization. Consumer advocates push for immediate relief from rising costs.",
      image: "/api/placeholder/400/400",
      category: "Economy & Finance"
    },
    {
      id: 27,
      headline: "Federal Budget Bill Prioritizes Economic Stability",
      description: "Budget negotiations focus on balancing fiscal responsibility with economic growth. Lawmakers debate spending priorities and deficit reduction.",
      image: "/api/placeholder/400/400",
      category: "Economy & Finance"
    },

    // Education
    {
      id: 28,
      headline: "Education Funding Equity Act Addresses School Resources",
      description: "Federal legislation aims to reduce funding disparities between wealthy and poor school districts. Education advocates emphasize need for equitable resources.",
      image: "/api/placeholder/400/400",
      category: "Education"
    },
    {
      id: 29,
      headline: "Student Debt Relief Act Proposes Loan Forgiveness",
      description: "Comprehensive student loan reform would forgive debt and expand income-based repayment options. Student advocates mobilize for debt relief measures.",
      image: "/api/placeholder/400/400",
      category: "Education"
    },
    {
      id: 30,
      headline: "Early Childhood Education Act Expands Pre-K Access",
      description: "Universal pre-kindergarten program would provide quality early education for all families. Child development advocates highlight long-term benefits.",
      image: "/api/placeholder/400/400",
      category: "Education"
    },

    // Emergency Mgmt
    {
      id: 31,
      headline: "Disaster Response Reform Act Improves FEMA Operations",
      description: "Legislation would streamline disaster relief distribution and improve coordination with states. Emergency management advocates push for faster response times.",
      image: "/api/placeholder/400/400",
      category: "Emergency Mgmt"
    },
    {
      id: 32,
      headline: "Climate Resilience Funding Bill Prepares Communities",
      description: "New legislation would fund infrastructure improvements to withstand extreme weather. Local officials emphasize need for proactive investment.",
      image: "/api/placeholder/400/400",
      category: "Emergency Mgmt"
    },
    {
      id: 33,
      headline: "First Responder Support Act Expands Resources",
      description: "Comprehensive legislation would increase funding for fire departments and emergency services. First responders push for equipment and training support.",
      image: "/api/placeholder/400/400",
      category: "Emergency Mgmt"
    },

    // Energy
    {
      id: 34,
      headline: "Clean Energy Investment Act Targets Renewable Infrastructure",
      description: "Comprehensive legislation would allocate funding toward solar, wind, and battery storage projects. Energy advocates push for swift passage.",
      image: "/api/placeholder/400/400",
      category: "Energy"
    },
    {
      id: 35,
      headline: "Energy Independence Bill Promotes Domestic Production",
      description: "Bipartisan legislation balances renewable energy expansion with traditional energy development. Lawmakers seek energy security through diverse sources.",
      image: "/api/placeholder/400/400",
      category: "Energy"
    },
    {
      id: 36,
      headline: "Grid Modernization Act Upgrades Power Infrastructure",
      description: "New legislation would fund smart grid technology and improve energy distribution. Utility experts emphasize need for infrastructure investment.",
      image: "/api/placeholder/400/400",
      category: "Energy"
    },

    // Environment
    {
      id: 37,
      headline: "Climate Action Bill Gains Bipartisan Support",
      description: "Landmark climate legislation promises to reduce carbon emissions significantly over the next decade. Environmental advocates are calling it historic.",
      image: "/api/placeholder/400/400",
      category: "Environment"
    },
    {
      id: 38,
      headline: "Environmental Justice Bill Addresses Pollution",
      description: "New legislation would require environmental impact assessments in disadvantaged areas and provide cleanup funding. Community advocates highlight environmental concerns.",
      image: "/api/placeholder/400/400",
      category: "Environment"
    },
    {
      id: 39,
      headline: "Clean Air Standards Act Strengthens Protections",
      description: "EPA authority would be expanded to address air quality and emissions standards. Public health advocates push for stronger environmental regulations.",
      image: "/api/placeholder/400/400",
      category: "Environment"
    },

    // Families
    {
      id: 40,
      headline: "Paid Family Leave Act Provides Universal Benefits",
      description: "Comprehensive paid leave program would cover all workers for family and medical emergencies. Family advocacy groups push for swift implementation.",
      image: "/api/placeholder/400/400",
      category: "Families"
    },
    {
      id: 41,
      headline: "Child Care Affordability Act Expands Access",
      description: "New legislation would cap child care costs and increase provider funding. Working parents push for affordable care options.",
      image: "/api/placeholder/400/400",
      category: "Families"
    },
    {
      id: 42,
      headline: "Family Support Services Act Strengthens Programs",
      description: "Comprehensive legislation would expand family counseling and support services. Social workers emphasize need for prevention programs.",
      image: "/api/placeholder/400/400",
      category: "Families"
    },

    // Banking & Finance
    {
      id: 43,
      headline: "Banking Regulation Reform Act Updates Financial Oversight",
      description: "Legislation would modernize banking regulations and enhance consumer protections. Financial reform advocates push for stronger oversight.",
      image: "/api/placeholder/400/400",
      category: "Banking & Finance"
    },
    {
      id: 44,
      headline: "Consumer Financial Protection Act Strengthens CFPB",
      description: "New legislation would expand CFPB authority and crack down on predatory lending. Consumer advocates emphasize need for financial protection.",
      image: "/api/placeholder/400/400",
      category: "Banking & Finance"
    },
    {
      id: 45,
      headline: "Community Banking Support Act Helps Local Institutions",
      description: "Bipartisan legislation would reduce regulatory burden on community banks and credit unions. Local bankers push for tailored approach.",
      image: "/api/placeholder/400/400",
      category: "Banking & Finance"
    },

    // Trade
    {
      id: 46,
      headline: "Trade Agreement Modernization Act Updates Policies",
      description: "Comprehensive legislation would renegotiate trade deals to protect American workers. Labor and business groups debate balanced approach.",
      image: "/api/placeholder/400/400",
      category: "Trade"
    },
    {
      id: 47,
      headline: "Export Promotion Act Supports American Businesses",
      description: "New legislation would expand programs helping small businesses enter global markets. Exporters push for increased trade support.",
      image: "/api/placeholder/400/400",
      category: "Trade"
    },
    {
      id: 48,
      headline: "Supply Chain Security Act Addresses Vulnerabilities",
      description: "Legislation would incentivize domestic production of critical goods. National security and economic experts emphasize strategic importance.",
      image: "/api/placeholder/400/400",
      category: "Trade"
    },

    // Government
    {
      id: 49,
      headline: "Government Efficiency Act Modernizes Federal Operations",
      description: "Bipartisan legislation would streamline federal agencies and reduce bureaucracy. Government reform advocates push for operational improvements.",
      image: "/api/placeholder/400/400",
      category: "Government"
    },
    {
      id: 50,
      headline: "Federal Workforce Investment Act Supports Employees",
      description: "New legislation would improve federal employee pay and benefits. Government workers push for competitive compensation.",
      image: "/api/placeholder/400/400",
      category: "Government"
    },
    {
      id: 51,
      headline: "Transparency in Government Act Expands Disclosure",
      description: "Comprehensive legislation would require real-time disclosure of government activities. Open government advocates emphasize accountability.",
      image: "/api/placeholder/400/400",
      category: "Government"
    },

    // Health
    {
      id: 52,
      headline: "Healthcare Access Act Expands Coverage Options",
      description: "Comprehensive healthcare legislation would expand insurance coverage and reduce costs. Healthcare advocates mobilize support for universal access.",
      image: "/api/placeholder/400/400",
      category: "Health"
    },
    {
      id: 53,
      headline: "Prescription Drug Price Reform Act Targets Costs",
      description: "New legislation would allow Medicare to negotiate prescription drug prices. Patient advocates push for immediate relief from high costs.",
      image: "/api/placeholder/400/400",
      category: "Health"
    },
    {
      id: 54,
      headline: "Mental Health Access Act Expands Treatment Coverage",
      description: "Comprehensive mental health legislation would expand access to therapy and psychiatric care. Mental health advocates emphasize parity with physical healthcare.",
      image: "/api/placeholder/400/400",
      category: "Health"
    },

    // Housing
    {
      id: 55,
      headline: "Affordable Housing Investment Act Addresses Crisis",
      description: "Legislation would fund construction of affordable housing units nationwide. Housing advocates emphasize growing affordability crisis.",
      image: "/api/placeholder/400/400",
      category: "Housing"
    },
    {
      id: 56,
      headline: "Homeownership Assistance Act Helps First-Time Buyers",
      description: "New legislation would expand down payment assistance and mortgage programs. Housing counselors push for expanded access to homeownership.",
      image: "/api/placeholder/400/400",
      category: "Housing"
    },
    {
      id: 57,
      headline: "Tenant Protection Act Strengthens Renter Rights",
      description: "Comprehensive legislation would establish federal tenant protections and rent stability measures. Tenant advocates push for nationwide standards.",
      image: "/api/placeholder/400/400",
      category: "Housing"
    },

    // Immigration
    {
      id: 58,
      headline: "Comprehensive Immigration Reform Act Advances",
      description: "Landmark legislation would provide pathway to citizenship and reform immigration system. Immigration advocates see opportunity for meaningful reform.",
      image: "/api/placeholder/400/400",
      category: "Immigration"
    },
    {
      id: 59,
      headline: "DREAM Act Protects Young Immigrants",
      description: "Legislation would provide permanent protections for immigrants brought to US as children. Youth advocates mobilize for permanent protections.",
      image: "/api/placeholder/400/400",
      category: "Immigration"
    },
    {
      id: 60,
      headline: "Border Security Enhancement Act Addresses Concerns",
      description: "Bipartisan legislation balances security measures with humanitarian considerations. Lawmakers seek comprehensive border policy.",
      image: "/api/placeholder/400/400",
      category: "Immigration"
    },

    // Foreign Affairs
    {
      id: 61,
      headline: "Foreign Aid Reform Act Modernizes Programs",
      description: "Comprehensive foreign aid legislation would refocus programs on development and democracy. International development advocates emphasize effective assistance.",
      image: "/api/placeholder/400/400",
      category: "Foreign Affairs"
    },
    {
      id: 62,
      headline: "Climate Diplomacy Act Advances Environmental Cooperation",
      description: "New legislation would prioritize climate action in foreign policy. Environmental advocates see opportunity for global leadership.",
      image: "/api/placeholder/400/400",
      category: "Foreign Affairs"
    },
    {
      id: 63,
      headline: "Human Rights Protection Act Strengthens US Advocacy",
      description: "Legislation would enhance US role in promoting human rights worldwide. Human rights organizations push for stronger diplomatic engagement.",
      image: "/api/placeholder/400/400",
      category: "Foreign Affairs"
    },

    // Labor
    {
      id: 64,
      headline: "Raise the Wage Act Proposes Minimum Wage Increase",
      description: "Federal minimum wage increase would affect millions of workers nationwide. Labor organizations mobilize support for wage increases.",
      image: "/api/placeholder/400/400",
      category: "Labor"
    },
    {
      id: 65,
      headline: "Worker Protection Act Strengthens Union Rights",
      description: "New labor legislation would make it easier for workers to organize and bargain collectively. Union advocates see opportunity for significant reform.",
      image: "/api/placeholder/400/400",
      category: "Labor"
    },
    {
      id: 66,
      headline: "Workplace Safety Enhancement Act Improves Standards",
      description: "Comprehensive legislation would strengthen OSHA enforcement and worker protections. Safety advocates push for enhanced workplace standards.",
      image: "/api/placeholder/400/400",
      category: "Labor"
    },

    // Law
    {
      id: 67,
      headline: "Judicial Reform Act Addresses Court Backlogs",
      description: "Legislation would fund additional federal judges and court resources. Legal experts emphasize need for timely justice.",
      image: "/api/placeholder/400/400",
      category: "Law"
    },
    {
      id: 68,
      headline: "Access to Justice Act Expands Legal Aid",
      description: "New legislation would fund legal services for low-income Americans. Legal aid organizations push for expanded access to representation.",
      image: "/api/placeholder/400/400",
      category: "Law"
    },
    {
      id: 69,
      headline: "Court Transparency Act Improves Public Access",
      description: "Bipartisan legislation would allow cameras in federal courts and enhance transparency. Open courts advocates emphasize public interest.",
      image: "/api/placeholder/400/400",
      category: "Law"
    },

    // Native Issues
    {
      id: 70,
      headline: "Tribal Sovereignty Protection Act Strengthens Rights",
      description: "Legislation would reinforce tribal self-governance and treaty rights. Native American advocates push for federal recognition of sovereignty.",
      image: "/api/placeholder/400/400",
      category: "Native Issues"
    },
    {
      id: 71,
      headline: "Native American Healthcare Improvement Act Expands Services",
      description: "New legislation would increase IHS funding and improve healthcare access on reservations. Tribal health officials emphasize critical needs.",
      image: "/api/placeholder/400/400",
      category: "Native Issues"
    },
    {
      id: 72,
      headline: "Indigenous Land Rights Act Addresses Historic Claims",
      description: "Comprehensive legislation would resolve land disputes and protect sacred sites. Native American organizations push for justice.",
      image: "/api/placeholder/400/400",
      category: "Native Issues"
    },

    // Public Lands
    {
      id: 73,
      headline: "National Parks Enhancement Act Expands Conservation",
      description: "Legislation would fund park improvements and expand protected areas. Conservation groups push for increased preservation.",
      image: "/api/placeholder/400/400",
      category: "Public Lands"
    },
    {
      id: 74,
      headline: "Public Lands Access Act Balances Recreation and Conservation",
      description: "Bipartisan legislation addresses outdoor recreation while protecting natural resources. Outdoor enthusiasts and conservationists seek balance.",
      image: "/api/placeholder/400/400",
      category: "Public Lands"
    },
    {
      id: 75,
      headline: "Forest Management Reform Act Addresses Wildfire Risk",
      description: "New legislation would fund forest thinning and fire prevention programs. Western states push for proactive forest management.",
      image: "/api/placeholder/400/400",
      category: "Public Lands"
    },

    // Science & Tech
    {
      id: 76,
      headline: "Artificial Intelligence Ethics Act Regulates AI Development",
      description: "Comprehensive AI legislation would establish safety standards and oversight. Technology ethicists emphasize need for responsible AI development.",
      image: "/api/placeholder/400/400",
      category: "Science & Tech"
    },
    {
      id: 77,
      headline: "Digital Infrastructure Act Expands Broadband Access",
      description: "Investment legislation would build high-speed internet in underserved communities. Digital equity advocates push for universal broadband.",
      image: "/api/placeholder/400/400",
      category: "Science & Tech"
    },
    {
      id: 78,
      headline: "Research Funding Enhancement Act Supports Innovation",
      description: "Bipartisan legislation would increase NIH and NSF funding for scientific research. Scientists push for sustained investment in discovery.",
      image: "/api/placeholder/400/400",
      category: "Science & Tech"
    },

    // Social Welfare
    {
      id: 79,
      headline: "Social Safety Net Expansion Act Strengthens Programs",
      description: "Comprehensive legislation would expand food assistance, housing support, and other programs. Anti-poverty advocates push for comprehensive approach.",
      image: "/api/placeholder/400/400",
      category: "Social Welfare"
    },
    {
      id: 80,
      headline: "Disability Services Enhancement Act Improves Support",
      description: "New legislation would expand disability benefits and accessibility requirements. Disability advocates push for comprehensive support.",
      image: "/api/placeholder/400/400",
      category: "Social Welfare"
    },
    {
      id: 81,
      headline: "Homeless Assistance Act Addresses Housing Crisis",
      description: "Bipartisan legislation would fund homelessness prevention and housing-first programs. Service providers emphasize need for increased resources.",
      image: "/api/placeholder/400/400",
      category: "Social Welfare"
    },

    // Sports & Recreation
    {
      id: 82,
      headline: "Youth Sports Safety Act Protects Young Athletes",
      description: "Legislation would establish safety standards for youth sports programs. Parents and coaches push for injury prevention measures.",
      image: "/api/placeholder/400/400",
      category: "Sports & Recreation"
    },
    {
      id: 83,
      headline: "Community Recreation Funding Act Supports Local Programs",
      description: "New legislation would fund public parks and recreation facilities. Community leaders emphasize importance of accessible recreation.",
      image: "/api/placeholder/400/400",
      category: "Sports & Recreation"
    },
    {
      id: 84,
      headline: "College Athlete Rights Act Addresses NIL Issues",
      description: "Comprehensive legislation would establish national standards for college athlete compensation. Athletes and advocates push for fair treatment.",
      image: "/api/placeholder/400/400",
      category: "Sports & Recreation"
    },

    // Taxes
    {
      id: 85,
      headline: "Tax Reform Act Simplifies Filing Process",
      description: "Bipartisan legislation would streamline tax code and reduce compliance burden. Taxpayers push for simpler tax system.",
      image: "/api/placeholder/400/400",
      category: "Taxes"
    },
    {
      id: 86,
      headline: "Corporate Tax Fairness Act Addresses Loopholes",
      description: "New legislation would close tax loopholes and ensure corporations pay fair share. Tax reform advocates push for revenue equity.",
      image: "/api/placeholder/400/400",
      category: "Taxes"
    },
    {
      id: 87,
      headline: "Middle Class Tax Relief Act Targets Working Families",
      description: "Comprehensive legislation would expand tax credits for working families. Family advocates push for financial relief.",
      image: "/api/placeholder/400/400",
      category: "Taxes"
    },

    // Transportation
    {
      id: 88,
      headline: "Infrastructure Investment Act Funds Roads and Bridges",
      description: "Comprehensive legislation would rebuild aging infrastructure nationwide. State officials push for increased federal investment.",
      image: "/api/placeholder/400/400",
      category: "Transportation"
    },
    {
      id: 89,
      headline: "Public Transit Expansion Act Improves Urban Mobility",
      description: "New legislation would fund expansion of public transportation systems. Transit advocates emphasize environmental and equity benefits.",
      image: "/api/placeholder/400/400",
      category: "Transportation"
    },
    {
      id: 90,
      headline: "Aviation Safety Enhancement Act Updates Standards",
      description: "Bipartisan legislation would strengthen FAA oversight and safety requirements. Aviation experts push for comprehensive safety measures.",
      image: "/api/placeholder/400/400",
      category: "Transportation"
    },

    // Water Resources
    {
      id: 91,
      headline: "Clean Water Infrastructure Act Addresses Aging Systems",
      description: "Legislation would fund replacement of lead pipes and water system upgrades. Public health advocates emphasize safe drinking water.",
      image: "/api/placeholder/400/400",
      category: "Water Resources"
    },
    {
      id: 92,
      headline: "Western Water Security Act Addresses Drought Concerns",
      description: "New legislation would fund water conservation and storage projects. Western states push for long-term water security solutions.",
      image: "/api/placeholder/400/400",
      category: "Water Resources"
    },
    {
      id: 93,
      headline: "Flood Prevention Act Protects Vulnerable Communities",
      description: "Comprehensive legislation would fund flood control infrastructure and mitigation programs. Coastal and riverside communities emphasize protection needs.",
      image: "/api/placeholder/400/400",
      category: "Water Resources"
    }
  ];

  // Mock federal bills data for "Act Before the Vote" section (using SITE_ISSUE_CATEGORIES)
  const mockFederalBillsByCategory = useMemo(() => ({
    'Agriculture & Food': [
      { type: 'HR', number: '2024', title: 'Farm Bill Reauthorization Act', url: '/federal/bill/119/hr/2024' },
      { type: 'S', number: '1200', title: 'Food Security Enhancement Act', url: '/federal/bill/119/s/1200' },
      { type: 'HR', number: '1500', title: 'Sustainable Agriculture Act', url: '/federal/bill/119/hr/1500' },
      { type: 'S', number: '900', title: 'Rural Development Investment Act', url: '/federal/bill/119/s/900' }
    ],
    'Animals': [
      { type: 'HR', number: '1555', title: 'Animal Welfare Enhancement Act', url: '/federal/bill/119/hr/1555' },
      { type: 'S', number: '800', title: 'Wildlife Conservation Act', url: '/federal/bill/119/s/800' },
      { type: 'HR', number: '1200', title: 'Pet Adoption Assistance Act', url: '/federal/bill/119/hr/1200' },
      { type: 'S', number: '600', title: 'Endangered Species Protection Act', url: '/federal/bill/119/s/600' }
    ],
    'Defense & Security': [
      { type: 'HR', number: '2670', title: 'National Defense Authorization Act', url: '/federal/bill/119/hr/2670' },
      { type: 'S', number: '442', title: 'AIM HIGH Act', url: '/federal/bill/119/s/442' },
      { type: 'S', number: '2080', title: 'FLRAA Production Acceleration Act', url: '/federal/bill/119/s/2080' },
      { type: 'S', number: '1882', title: 'Veterans Support Act', url: '/federal/bill/119/s/1882' }
    ],
    'Civil Rights': [
      { type: 'HR', number: '5', title: 'Equality Act', url: '/federal/bill/119/hr/5' },
      { type: 'S', number: '200', title: 'Voting Rights Restoration Act', url: '/federal/bill/119/s/200' },
      { type: 'HR', number: '800', title: 'Hate Crimes Prevention Act', url: '/federal/bill/119/hr/800' },
      { type: 'S', number: '400', title: 'Civil Rights Enhancement Act', url: '/federal/bill/119/s/400' }
    ],
    'Crime & Law': [
      { type: 'HR', number: '22', title: 'Police Reform Act', url: '/federal/bill/119/hr/22' },
      { type: 'S', number: '400', title: 'Sentencing Reform Act', url: '/federal/bill/119/s/400' },
      { type: 'HR', number: '800', title: 'Prison Reform Act', url: '/federal/bill/119/hr/800' },
      { type: 'S', number: '600', title: 'Criminal Justice Modernization Act', url: '/federal/bill/119/s/600' }
    ],
    'Economy & Finance': [
      { type: 'HR', number: '4521', title: 'Economic Growth and Investment Act', url: '/federal/bill/119/hr/4521' },
      { type: 'S', number: '1000', title: 'Economic Recovery Act', url: '/federal/bill/119/s/1000' },
      { type: 'HR', number: '2000', title: 'Inflation Reduction Measures', url: '/federal/bill/119/hr/2000' },
      { type: 'S', number: '800', title: 'Budget Stability Act', url: '/federal/bill/119/s/800' }
    ],
    'Education': [
      { type: 'HR', number: '1400', title: 'Education Funding Equity Act', url: '/federal/bill/119/hr/1400' },
      { type: 'S', number: '700', title: 'Student Debt Relief Act', url: '/federal/bill/119/s/700' },
      { type: 'HR', number: '1800', title: 'Early Childhood Education Act', url: '/federal/bill/119/hr/1800' },
      { type: 'S', number: '500', title: 'Higher Education Access Act', url: '/federal/bill/119/s/500' }
    ],
    'Energy': [
      { type: 'HR', number: '3838', title: 'Clean Energy Innovation Act', url: '/federal/bill/119/hr/3838' },
      { type: 'S', number: '442', title: 'Energy Independence Act', url: '/federal/bill/119/s/442' },
      { type: 'S', number: '1632', title: 'Grid Modernization Act', url: '/federal/bill/119/s/1632' },
      { type: 'HR', number: '2000', title: 'Renewable Energy Investment Act', url: '/federal/bill/119/hr/2000' }
    ],
    'Environment': [
      { type: 'HR', number: '2345', title: 'Environmental Protection Enhancement Act', url: '/federal/bill/119/hr/2345' },
      { type: 'S', number: '1882', title: 'RESTORE Act', url: '/federal/bill/119/s/1882' },
      { type: 'HR', number: '1500', title: 'Clean Air Standards Act', url: '/federal/bill/119/hr/1500' },
      { type: 'S', number: '1000', title: 'Environmental Justice Act', url: '/federal/bill/119/s/1000' }
    ],
    'Families': [
      { type: 'HR', number: '1178', title: 'Family Support Act', url: '/federal/bill/119/hr/1178' },
      { type: 'S', number: '500', title: 'Paid Family Leave Act', url: '/federal/bill/119/s/500' },
      { type: 'HR', number: '900', title: 'Child Care Affordability Act', url: '/federal/bill/119/hr/900' },
      { type: 'S', number: '300', title: 'Family Economic Security Act', url: '/federal/bill/119/s/300' }
    ],
    'Health': [
      { type: 'HR', number: '1976', title: 'Lower Drug Costs Now Act', url: '/federal/bill/119/hr/1976' },
      { type: 'S', number: '1200', title: 'Healthcare Access Act', url: '/federal/bill/119/s/1200' },
      { type: 'HR', number: '2500', title: 'Mental Health Access Act', url: '/federal/bill/119/hr/2500' },
      { type: 'S', number: '900', title: 'Healthcare Affordability Act', url: '/federal/bill/119/s/900' }
    ],
    'Housing': [
      { type: 'HR', number: '2890', title: 'Affordable Housing Investment Act', url: '/federal/bill/119/hr/2890' },
      { type: 'S', number: '700', title: 'Homeownership Assistance Act', url: '/federal/bill/119/s/700' },
      { type: 'HR', number: '1400', title: 'Tenant Protection Act', url: '/federal/bill/119/hr/1400' },
      { type: 'S', number: '500', title: 'Rental Assistance Expansion Act', url: '/federal/bill/119/s/500' }
    ],
    'Immigration': [
      { type: 'HR', number: '6', title: 'American Dream and Promise Act', url: '/federal/bill/119/hr/6' },
      { type: 'S', number: '1092', title: 'Immigration Reform Act', url: '/federal/bill/119/s/1092' },
      { type: 'HR', number: '1072', title: 'DREAM Act', url: '/federal/bill/119/hr/1072' },
      { type: 'S', number: '800', title: 'Refugee Protection Act', url: '/federal/bill/119/s/800' }
    ],
    'Labor': [
      { type: 'HR', number: '842', title: 'Protecting the Right to Organize Act', url: '/federal/bill/119/hr/842' },
      { type: 'S', number: '600', title: 'Raise the Wage Act', url: '/federal/bill/119/s/600' },
      { type: 'HR', number: '1200', title: 'Workplace Safety Act', url: '/federal/bill/119/hr/1200' },
      { type: 'S', number: '400', title: 'Worker Protection Act', url: '/federal/bill/119/s/400' }
    ],
    'Science & Tech': [
      { type: 'HR', number: '3611', title: 'AI Accountability Act', url: '/federal/bill/119/hr/3611' },
      { type: 'S', number: '1000', title: 'Digital Infrastructure Act', url: '/federal/bill/119/s/1000' },
      { type: 'HR', number: '2000', title: 'Research Funding Enhancement Act', url: '/federal/bill/119/hr/2000' },
      { type: 'S', number: '700', title: 'Broadband Expansion Act', url: '/federal/bill/119/s/700' }
    ],
    'Transportation': [
      { type: 'HR', number: '3684', title: 'Infrastructure Investment Act', url: '/federal/bill/119/hr/3684' },
      { type: 'S', number: '800', title: 'Public Transit Expansion Act', url: '/federal/bill/119/s/800' },
      { type: 'HR', number: '1500', title: 'Aviation Safety Enhancement Act', url: '/federal/bill/119/hr/1500' },
      { type: 'S', number: '500', title: 'Highway Modernization Act', url: '/federal/bill/119/s/500' }
    ],
    'Water Resources': [
      { type: 'HR', number: '1915', title: 'Water Infrastructure Act', url: '/federal/bill/119/hr/1915' },
      { type: 'S', number: '600', title: 'Western Water Security Act', url: '/federal/bill/119/s/600' },
      { type: 'HR', number: '1200', title: 'Flood Prevention Act', url: '/federal/bill/119/hr/1200' },
      { type: 'S', number: '400', title: 'Clean Water Standards Act', url: '/federal/bill/119/s/400' }
    ]
  }), []);

  // Mock state bills data for "Important bills in [State]" section (using SITE_ISSUE_CATEGORIES)
  const mockStateBillsByCategory = useMemo(() => ({
    'Agriculture & Food': {
      'CA': [
        { number: 'AB 1', title: 'California Farm Bill', url: '/state/ca/bill/AB1' },
        { number: 'SB 2', title: 'Food Security Act', url: '/state/ca/bill/SB2' }
      ]
    },
    'Energy': {
      'CA': [
        { number: 'AB 5', title: 'California Green Energy Initiative', url: '/state/ca/bill/AB5' },
        { number: 'AB 10', title: 'Climate Action Investment Act', url: '/state/ca/bill/AB10' },
        { number: 'SB 3', title: 'Renewable Energy Standards Act', url: '/state/ca/bill/SB3' },
        { number: 'SB 8', title: 'Carbon Neutrality Act', url: '/state/ca/bill/SB8' }
      ],
      'NY': [
        { number: 'A 100', title: 'New York Climate Action Act', url: '/state/ny/bill/A100' },
        { number: 'S 50', title: 'Clean Energy Jobs Act', url: '/state/ny/bill/S50' }
      ],
      'TX': [
        { number: 'HB 1', title: 'Texas Energy Independence Act', url: '/state/tx/bill/HB1' },
        { number: 'SB 1', title: 'Grid Resilience Act', url: '/state/tx/bill/SB1' }
      ],
      'FL': [
        { number: 'H 11', title: 'Florida Renewable Energy Act', url: '/state/fl/bill/H11' },
        { number: 'S 20', title: 'Energy Efficiency Standards', url: '/state/fl/bill/S20' }
      ]
    },
    'Environment': {
      'CA': [
        { number: 'AB 15', title: 'Environmental Protection Act', url: '/state/ca/bill/AB15' },
        { number: 'SB 12', title: 'Clean Air Standards Act', url: '/state/ca/bill/SB12' }
      ],
      'NY': [
        { number: 'A 200', title: 'Environmental Justice Act', url: '/state/ny/bill/A200' },
        { number: 'S 75', title: 'Green Infrastructure Act', url: '/state/ny/bill/S75' }
      ],
      'TX': [
        { number: 'HB 100', title: 'Environmental Protection Act', url: '/state/tx/bill/HB100' },
        { number: 'SB 50', title: 'Pollution Control Act', url: '/state/tx/bill/SB50' }
      ],
      'FL': [
        { number: 'H 50', title: 'Everglades Protection Act', url: '/state/fl/bill/H50' },
        { number: 'S 35', title: 'Coastal Conservation Act', url: '/state/fl/bill/S35' }
      ]
    },
    'Crime & Law': {
      'CA': [
        { number: 'AB 20', title: 'Police Accountability Act', url: '/state/ca/bill/AB20' },
        { number: 'SB 15', title: 'Prison Reform Act', url: '/state/ca/bill/SB15' },
        { number: 'AB 25', title: 'Bail Reform Act', url: '/state/ca/bill/AB25' },
        { number: 'SB 20', title: 'Criminal Justice Reform Act', url: '/state/ca/bill/SB20' }
      ],
      'NY': [
        { number: 'A 300', title: 'Criminal Justice Reform Act', url: '/state/ny/bill/A300' },
        { number: 'S 150', title: 'Police Transparency Act', url: '/state/ny/bill/S150' }
      ]
    },
    'Education': {
      'CA': [
        { number: 'AB 30', title: 'School Funding Equity Act', url: '/state/ca/bill/AB30' },
        { number: 'SB 25', title: 'Early Childhood Education Act', url: '/state/ca/bill/SB25' }
      ],
      'NY': [
        { number: 'A 400', title: 'Education Reform Act', url: '/state/ny/bill/A400' },
        { number: 'S 200', title: 'Higher Education Access Act', url: '/state/ny/bill/S200' }
      ]
    },
    'Health': {
      'CA': [
        { number: 'AB 35', title: 'Healthcare Access Act', url: '/state/ca/bill/AB35' },
        { number: 'SB 30', title: 'Mental Health Services Act', url: '/state/ca/bill/SB30' }
      ],
      'NY': [
        { number: 'A 500', title: 'Healthcare Affordability Act', url: '/state/ny/bill/A500' },
        { number: 'S 250', title: 'Prescription Drug Cost Act', url: '/state/ny/bill/S250' }
      ]
    },
    'Housing': {
      'CA': [
        { number: 'AB 40', title: 'Affordable Housing Act', url: '/state/ca/bill/AB40' },
        { number: 'SB 35', title: 'Tenant Protection Act', url: '/state/ca/bill/SB35' }
      ],
      'NY': [
        { number: 'A 600', title: 'Housing Security Act', url: '/state/ny/bill/A600' },
        { number: 'S 300', title: 'Rent Stabilization Act', url: '/state/ny/bill/S300' }
      ]
    },
    'Transportation': {
      'CA': [
        { number: 'AB 45', title: 'Infrastructure Investment Act', url: '/state/ca/bill/AB45' },
        { number: 'SB 40', title: 'Public Transit Expansion Act', url: '/state/ca/bill/SB40' }
      ],
      'NY': [
        { number: 'A 700', title: 'MTA Modernization Act', url: '/state/ny/bill/A700' },
        { number: 'S 350', title: 'Highway Improvement Act', url: '/state/ny/bill/S350' }
      ]
    },
    'Water Resources': {
      'CA': [
        { number: 'AB 50', title: 'Water Conservation Act', url: '/state/ca/bill/AB50' },
        { number: 'SB 45', title: 'Drought Response Act', url: '/state/ca/bill/SB45' }
      ],
      'FL': [
        { number: 'H 75', title: 'Clean Water Standards Act', url: '/state/fl/bill/H75' },
        { number: 'S 50', title: 'Everglades Restoration Act', url: '/state/fl/bill/S50' }
      ]
    }
  }), []);

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Fetch latest bills that have passed the House for this policy category
  useEffect(() => {
    const fetchHousePassedBills = async () => {
      const selectedCategory = issueCategories.find(cat => cat.id === selectedFilter);
      const categoryLabel = selectedCategory?.label || policyCategory;

      try {
        const response = await fetch(`/api/bills/house-passed?category=${encodeURIComponent(categoryLabel)}&limit=4`);
        const data = await response.json();

        if (data.bills && data.bills.length > 0) {
          setLatestBills(data.bills);
        } else {
          // Fallback to mock data if no bills found
          const mockBills = mockFederalBillsByCategory[categoryLabel] || mockFederalBillsByCategory['Climate, Energy & Environment'];
          setLatestBills(mockBills || []);
        }
      } catch (error) {
        console.error('Error fetching House-passed bills:', error);
        // Fallback to mock data on error
        const mockBills = mockFederalBillsByCategory[categoryLabel] || mockFederalBillsByCategory['Climate, Energy & Environment'];
        setLatestBills(mockBills || []);
      }
    };

    fetchHousePassedBills();
  }, [selectedFilter, issueCategories, policyCategory]);

  // Set state bills based on user's zip code and current policy category
  useEffect(() => {
    if (currentUserState) {
      const selectedCategory = issueCategories.find(cat => cat.id === selectedFilter);
      const categoryLabel = selectedCategory?.label || 'Climate, Energy & Environment';
      const categoryBills = mockStateBillsByCategory[categoryLabel];
      const bills = categoryBills?.[currentUserState.code] || [];
      setStateBills(bills);
    }
  }, [zipCode, selectedFilter, issueCategories, currentUserState]);

  // Get all real campaigns from the service and transform them for the homepage
  const allCampaigns = campaignsService.getAllCampaigns()
    .filter(campaign => campaign.isActive)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const campaignStories = allCampaigns.map(campaign => ({
    id: campaign.id,
    type: 'campaign',
    organization: campaign.groupName,
    groupSlug: campaign.groupSlug,
    position: campaign.position,
    policyIssue: 'National Conditions', // Most voting rights campaigns fall under this category
    billNumber: campaign.bill ? `${campaign.bill.type} ${campaign.bill.number}` : 'Unknown Bill',
    billTitle: (campaign.bill && campaign.bill.title) ? campaign.bill.title : (campaign.bill ? `${campaign.bill.type} ${campaign.bill.number}` : 'Unknown Bill'),
    description: campaign.reasoning,
    supportCount: campaign.supportCount,
    opposeCount: campaign.opposeCount
  }));

  // Fisher-Yates shuffle algorithm with deterministic seed for SSR
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    // Use a simple deterministic seed based on array length and first item id
    let seed = array.length > 0 ? array[0].id || 1 : 1;

    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Filter stories based on selected filter (current policy category)
  const getFilteredStories = () => {
    let stories;
    let campaigns;

    // Find the category name from the filter ID
    const selectedCategory = issueCategories.find(cat => cat.id === selectedFilter);
    if (!selectedCategory || selectedCategory.id === 'view-all') {
      stories = newsStories;
      campaigns = campaignStories;
    } else {
      stories = newsStories.filter(story => story.category === selectedCategory.label);
      campaigns = campaignStories.filter(campaign => campaign.policyIssue === selectedCategory.label);
    }

    // Add state-specific articles if available and appropriate for the filter
    if (stateSpecificArticles.length > 0) {
      if (selectedCategory) {
        const matchingStateArticles = stateSpecificArticles.filter(article =>
          article.category === selectedCategory.label
        );
        stories = [...matchingStateArticles, ...stories];
      }
    }

    // Combine stories and campaigns, then randomize
    const combinedContent = [...stories, ...campaigns];
    const shuffled = shuffleArray(combinedContent);

    // Insert bill CTA in third position if available for this category
    if (selectedCategory && selectedCategory.id !== 'view-all') {
      const billCTA = billCTAByCategory[selectedCategory.label];
      if (billCTA && shuffled.length >= 3) {
        shuffled.splice(2, 0, billCTA); // Insert at index 2 (third position)
      }
    }

    return shuffled;
  };

  const filteredStories = getFilteredStories();

  // Find the label for the selected filter
  const getFilterLabel = (filterId: string) => {
    const issue = issueCategories.find(cat => cat.id === filterId);
    return issue?.label || 'Issues';
  };

  // Create a modified HomepageNewsSection that replaces mission card with US Map
  const ModifiedHomepageNewsSection = () => {
    return (
      <div className="w-full bg-background border-b">
        <div className="max-w-[1280px] mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Column 1: US Map instead of Mission Card - 5 columns */}
            <div className="md:col-span-5">
              <Card className="h-full border-none shadow-none">
                <div className="aspect-video bg-background flex items-center justify-center p-4">
                  <USMap />
                </div>
                <CardContent className="p-0 pt-6">
                  <h2 className="text-xl font-bold mb-4">{policyCategory}</h2>
                  <p className="text-muted-foreground mb-4">
                    Stay informed about {policyCategory.toLowerCase()} legislation and policy developments across the United States.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Track bills, connect with advocacy groups, and make your voice heard on issues that matter to you.
                  </p>
                  <p className="text-muted-foreground mb-6">
                    Click on any state to explore local legislation.
                  </p>

                  <div className="flex items-center gap-4">
                    <Button asChild>
                      <Link href={`/federal/bill/119?filter=${encodeURIComponent(policyCategory)}`}>
                        View Federal Bills
                      </Link>
                    </Button>

                    {(() => {
                      const userState = zipCode ? getStateFromZip(zipCode) : null;
                      const stateLink = userState
                        ? `/state/${userState.stateCode.toLowerCase()}?filter=${encodeURIComponent(policyCategory)}`
                        : `/state?filter=${encodeURIComponent(policyCategory)}`;
                      return (
                        <Link
                          href={stateLink}
                          className="text-sm text-muted-foreground hover:text-foreground underline"
                        >
                          Browse by State{userState ? ` (${userState.stateCode})` : ''}
                        </Link>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rest of the layout remains the same but filtered to this policy area */}
            <div className="md:col-span-4 space-y-8">
              {filteredStories.slice(0, 2).map((story, index) => (
                <Link key={story.id} href="/article/1">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer mb-8">
                    <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <div className="text-muted-foreground/50 text-sm">News Image</div>
                      <div className="absolute bottom-3 left-3">
                        <Badge variant="secondary" className="text-xs">{story.category}</Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h4 className="text-base font-semibold mb-4 line-clamp-2">{story.headline}</h4>
                      <div className="flex items-center justify-between">
                        <Button size="sm" variant="outline" className="text-xs">
                          Send Message
                        </Button>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Column 3: Take Action Together, Act Before the Vote, and State Bills - 3 columns */}
            <div className="md:col-span-3">
              <div className="h-full space-y-6">
                {/* Take Action Together */}
                <div>
                  <h3 className="text-lg font-bold mb-4">
                    <Link
                      href="/organizations"
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      Take Action Together
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </h3>
                  <ul className="space-y-2 list-disc list-inside">
                    {campaignStories.slice(0, 4).map(campaign => {
                      const isSupport = campaign.position === 'Support';

                      return (
                        <li key={campaign.id} className="text-sm text-muted-foreground">
                          <Link
                            href={`/campaigns/${campaign.groupSlug}/${campaign.billNumber.toLowerCase().replace(' ', '-')}`}
                            className="hover:text-foreground transition-colors"
                          >
                            <span className="ml-[-5px]">
                              <span className="font-medium">{campaign.groupName}</span>{' '}
                              <span className={isSupport ? 'text-green-700' : 'text-red-700'}>
                                {campaign.position.toLowerCase()}s
                              </span>{' '}
                              {campaign.billNumber}: {truncateText(campaign.billTitle || '', 60)}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Act Before the Vote */}
                <div>
                  <h3 className="text-lg font-bold mb-4">Act Before the Vote</h3>
                  <ul className="space-y-2 list-disc list-inside">
                    {latestBills.map((bill, index) => (
                      <li key={`${bill.type}-${bill.number}-${index}`} className="text-sm text-muted-foreground">
                        <Link
                          href={bill.url}
                          className="hover:text-foreground transition-colors"
                        >
                          <span className="ml-[-5px]">
                            <span className="font-medium">{bill.type} {bill.number}</span>: {truncateText(bill.title, 60)}
                          </span>
                        </Link>
                      </li>
                    ))}
                    {latestBills.length === 0 && (
                      <li className="text-sm text-muted-foreground/50">Loading bills...</li>
                    )}
                  </ul>
                </div>

                {/* Important bills in [State] - Premium Only */}
                {isPremium && currentUserState && (
                  <div>
                    <h3 className="text-lg font-bold mb-4">Important bills in {currentUserState.name}</h3>
                    <ul className="space-y-2 list-disc list-inside">
                      {stateBills.map((bill, index) => (
                        <li key={`state-${bill.number}-${index}`} className="text-sm text-muted-foreground">
                          <Link
                            href={bill.url}
                            className="hover:text-foreground transition-colors"
                          >
                            <span className="ml-[-5px]">
                              <span className="font-medium">{bill.number}</span>: {truncateText(bill.title, 60)}
                            </span>
                          </Link>
                        </li>
                      ))}
                      {stateBills.length === 0 && (
                        <li className="text-sm text-muted-foreground/50">Loading state bills...</li>
                      )}
                    </ul>
                  </div>
                )}
                {/* Premium upgrade CTA for state bills when not premium */}
                {!isPremium && currentUserState && (
                  <PremiumUpgradeCTA
                    variant="compact"
                    title="State Legislation"
                    description="Upgrade to view important bills in your state"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Popular Bills Section - Full width at top */}
      <PopularBills />

      {/* News and Campaigns Section - 3 column layout with US Map */}
      <ModifiedHomepageNewsSection />

      <div
        className="relative px-4 md:px-0"
        style={{
          maxWidth: '672px',
          margin: '0 auto'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background">
          <div className="hidden md:block py-10">
            <div className="px-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-medium">{policyCategory} News & Action</div>
                <div className="flex items-center gap-2">
                  <Link href="/">
                    <Button variant="outline" size="sm" className="text-sm">
                      ← All Issues
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Container - All filtered stories */}
        <div className="md:snap-none snap-y snap-mandatory md:overflow-visible md:pb-8">
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
                            <Link href={`/advocacy-message?category=${encodeURIComponent(policyCategory)}`}>
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
                            <Link href={`/advocacy-message?category=${encodeURIComponent(policyCategory)}`}>
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
              const badgeVariant = isSupport ? 'default' : 'destructive';
              const PositionIcon = isSupport ? ThumbsUp : ThumbsDown;

              return (
                <div key={item.id} className="md:mb-8 md:px-4 snap-start md:snap-none md:h-auto md:min-h-0 flex items-start pt-4 md:items-center md:pt-0 md:block">
                  <Card className="relative my-2 md:my-0 w-full md:w-full overflow-hidden h-[608px] md:h-auto">
                    {/* Mobile Layout */}
                    <div className="md:hidden">
                      <CardContent className="p-6 h-full flex flex-col">
                        <Link href={`/issues/${convertCategoryToSlug(item.policyIssue)}`}>
                          <Badge variant="secondary" className="mb-4 w-fit text-sm px-3 py-1 hover:bg-secondary/80 transition-colors cursor-pointer">{item.policyIssue}</Badge>
                        </Link>
                        <div className="mb-6">
                          <div className="text-base text-muted-foreground font-semibold mb-3">{item.organization}</div>
                          <Badge variant={badgeVariant} className="flex items-center gap-1 text-base px-4 py-2 w-fit">
                            <PositionIcon className="h-5 w-5" />
                            <span>{item.position}</span>
                          </Badge>
                        </div>
                        <h3 className="text-2xl font-bold mb-8 line-clamp-2 leading-tight">{item.billNumber}: {item.billTitle}</h3>
                        <p className="text-muted-foreground text-lg mb-8 flex-1 overflow-hidden leading-relaxed">{item.description}</p>

                        <div className="flex items-center justify-between mt-auto">
                          <Button size="lg" variant="outline" className="text-base px-6 py-3" asChild>
                            <Link href={`/campaigns/${item.groupSlug}/${item.billNumber.toLowerCase().replace(' ', '-')}`}>
                              {item.position} Issue
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                          <Eye className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:block">
                      <CardContent className="p-6">
                        <Link href={`/issues/${convertCategoryToSlug(item.policyIssue)}`}>
                          <Badge variant="secondary" className="mb-2 w-fit text-xs px-2 py-1 hover:bg-secondary/80 transition-colors cursor-pointer">{item.policyIssue}</Badge>
                        </Link>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-muted-foreground">{item.organization}</div>
                          <Badge variant={badgeVariant} className="flex items-center gap-1 text-xs px-2 py-1">
                            <PositionIcon className="h-3 w-3" />
                            <span>{item.position}</span>
                          </Badge>
                        </div>
                        <h3 className="text-lg font-bold mb-3 line-clamp-2">{item.billNumber}: {item.billTitle}</h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <Button size="sm" variant="outline" className="text-xs" asChild>
                            <Link href={`/campaigns/${item.groupSlug}/${item.billNumber.toLowerCase().replace(' ', '-')}`}>
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
            } else {
              // News Story Card
              return (
                <div key={item.id} className="md:mb-8 md:px-4 snap-start md:snap-none md:h-auto md:min-h-0 flex items-start pt-4 md:items-center md:pt-0 md:block">
                  <Link href={`/article/${item.id}`}>
                    <Card className="relative my-2 md:my-0 w-full md:w-full overflow-hidden md:h-auto hover:shadow-md transition-shadow cursor-pointer">
                    {/* Mobile Layout */}
                    <div className="md:hidden">
                      <div className="relative w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <div className="text-muted-foreground/50 text-sm">News Image</div>
                        <div className="absolute bottom-4 left-4">
                          <Badge variant="secondary" className="text-xs px-2 py-1">{item.category}</Badge>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        {item.state && (
                          <div className="mb-3">
                            <Badge variant="default" className="text-xs px-2 py-1">{item.state}</Badge>
                          </div>
                        )}
                        <h3 className="text-lg font-bold mb-3 line-clamp-2">{item.headline}</h3>
                        {!item.state && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            Congressional leaders advance comprehensive legislative package addressing key policy priorities. Advocacy organizations mobilize grassroots support for upcoming committee hearings and floor votes.
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground mb-4 flex flex-wrap gap-x-1">
                          <span className="hover:underline cursor-pointer">New York Times</span> •
                          <span className="hover:underline cursor-pointer">Washington Post</span> •
                          <span className="hover:underline cursor-pointer">Reuters</span> •
                          <span className="hover:underline cursor-pointer">Associated Press</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Button size="sm" variant="outline" className="text-xs">
                            Send Message
                          </Button>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:flex h-64">
                      <div className="relative w-64 h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                        <div className="text-muted-foreground/50 text-sm">News Image</div>
                        <div className="absolute bottom-4 left-4">
                          <Badge variant="secondary" className="text-xs px-2 py-1">{item.category}</Badge>
                        </div>
                      </div>
                      <CardContent className="flex-1 p-6">
                        {item.state && (
                          <div className="mb-3">
                            <Badge variant="default" className="text-xs px-2 py-1">{item.state}</Badge>
                          </div>
                        )}
                        <h3 className="text-lg font-bold mb-3 line-clamp-2">{item.headline}</h3>
                        {!item.state && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            Bipartisan coalition works to advance critical legislation addressing national priorities. Key stakeholders engage in strategic advocacy efforts as bill moves through legislative process.
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground mb-4 flex flex-wrap gap-x-1">
                          <span className="hover:underline cursor-pointer">CNN</span> •
                          <span className="hover:underline cursor-pointer">Fox News</span> •
                          <span className="hover:underline cursor-pointer">NBC News</span> •
                          <span className="hover:underline cursor-pointer">Politico</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Button size="sm" variant="outline" className="text-xs">
                            Send Message
                          </Button>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </div>
                    </Card>
                  </Link>
                </div>
              );
            }
          })}
        </div>
      </div>
    </>
  );
}