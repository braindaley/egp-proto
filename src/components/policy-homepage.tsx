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

interface PolicyHomepageProps {
  policyCategory: string;
}

export default function PolicyHomepage({ policyCategory }: PolicyHomepageProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>(policyCategory.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'));
  const { zipCode } = useZipCode();

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

  // Mock Bill CTA data - bills that have passed committee and house
  const billCTAByCategory: Record<string, any> = {
    'Abortion': {
      id: 'bill-cta-abortion',
      type: 'billCTA',
      billNumber: 'H.R. 1234',
      billTitle: 'Women\'s Health Protection Act',
      aiOverview: 'This legislation would codify the right to access abortion services nationwide, superseding state-level restrictions. The bill includes protections for healthcare providers and ensures insurance coverage for reproductive health services.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Abortion',
      url: '/federal/bill/119/hr/1234'
    },
    'Climate, Energy & Environment': {
      id: 'bill-cta-climate',
      type: 'billCTA',
      billNumber: 'H.R. 3838',
      billTitle: 'Clean Energy Innovation and Deployment Act',
      aiOverview: 'This comprehensive climate bill establishes a framework to achieve net-zero emissions by 2050 through investments in renewable energy infrastructure, carbon capture technology, and green job creation. It includes tax incentives for clean energy adoption and penalties for excessive carbon emissions.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote in April',
      category: 'Climate, Energy & Environment',
      url: '/federal/bill/119/hr/3838'
    },
    'Criminal Justice': {
      id: 'bill-cta-criminal-justice',
      type: 'billCTA',
      billNumber: 'H.R. 2567',
      billTitle: 'Second Chance Reauthorization Act',
      aiOverview: 'This bill reauthorizes and expands the Second Chance Act, providing federal funding for reentry programs, job training, and substance abuse treatment for formerly incarcerated individuals. It aims to reduce recidivism rates and support successful community reintegration.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Criminal Justice',
      url: '/federal/bill/119/hr/2567'
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
      url: '/federal/bill/119/hr/4521'
    },
    'Education': {
      id: 'bill-cta-education',
      type: 'billCTA',
      billNumber: 'H.R. 3345',
      billTitle: 'Student Debt Relief and College Affordability Act',
      aiOverview: 'This bill provides $10,000 in student loan forgiveness for federal loan borrowers, makes community college tuition-free, and increases Pell Grant funding. It also caps loan repayment at 5% of discretionary income and expands access to income-driven repayment plans.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Education',
      url: '/federal/bill/119/hr/3345'
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
      url: '/federal/bill/119/hr/8'
    },
    'Health Policy': {
      id: 'bill-cta-health',
      type: 'billCTA',
      billNumber: 'H.R. 1976',
      billTitle: 'Lower Drug Costs Now Act',
      aiOverview: 'This bill empowers Medicare to negotiate prescription drug prices, caps out-of-pocket drug costs for seniors, and penalizes pharmaceutical companies for excessive price increases. It also invests savings into expanding dental, vision, and hearing coverage under Medicare.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Health Policy',
      url: '/federal/bill/119/hr/1976'
    },
    'Immigration & Migration': {
      id: 'bill-cta-immigration',
      type: 'billCTA',
      billNumber: 'H.R. 6',
      billTitle: 'American Dream and Promise Act',
      aiOverview: 'This legislation provides a pathway to citizenship for Dreamers, TPS holders, and DED recipients. It allows eligible individuals who came to the U.S. as children to apply for permanent residence and eventually citizenship, subject to background checks and other requirements.',
      stage: 'passed-house',
      nextPhase: 'Contact your Senator before the April vote',
      category: 'Immigration & Migration',
      url: '/federal/bill/119/hr/6'
    },
    'Privacy Rights': {
      id: 'bill-cta-privacy',
      type: 'billCTA',
      billNumber: 'H.R. 2701',
      billTitle: 'American Data Privacy and Protection Act',
      aiOverview: 'This comprehensive data privacy bill establishes national standards for data collection, use, and transfer. It grants individuals rights to access, correct, and delete their personal data, and requires companies to minimize data collection and obtain consent for sensitive data processing.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote',
      category: 'Privacy Rights',
      url: '/federal/bill/119/hr/2701'
    },
    'Technology Policy Issues': {
      id: 'bill-cta-tech',
      type: 'billCTA',
      billNumber: 'H.R. 3611',
      billTitle: 'AI Accountability and Transparency Act',
      aiOverview: 'This bill establishes a regulatory framework for artificial intelligence systems, requiring impact assessments for high-risk AI applications, transparency in algorithmic decision-making, and prohibiting discriminatory AI practices. It creates an AI oversight body within the FTC.',
      stage: 'passed-house',
      nextPhase: 'Voice your opinion before the Senate vote in May',
      category: 'Technology Policy Issues',
      url: '/federal/bill/119/hr/3611'
    }
  };

  // State-specific news articles for each policy category
  const stateSpecificNewsByState: Record<string, Record<string, any>> = {
    'California': {
      'Abortion': { id: 1001, headline: "California Strengthens Reproductive Rights Protections", category: "Abortion", state: "California" },
      'Climate, Energy & Environment': { id: 1002, headline: "California Passes Landmark Climate Legislation", category: "Climate, Energy & Environment", state: "California" },
      'Criminal Justice': { id: 1003, headline: "California Advances Prison Reform Initiative", category: "Criminal Justice", state: "California" },
      'Death Penalty': { id: 1004, headline: "California Reviews Death Penalty Moratorium", category: "Death Penalty", state: "California" },
      'Defense & National Security': { id: 1005, headline: "California Military Bases Receive Infrastructure Funding", category: "Defense & National Security", state: "California" },
      'Discrimination & Prejudice': { id: 1006, headline: "California Expands Anti-Discrimination Protections", category: "Discrimination & Prejudice", state: "California" },
      'Drug Policy': { id: 1007, headline: "California Launches Substance Abuse Treatment Program", category: "Drug Policy", state: "California" },
      'Economy & Work': { id: 1008, headline: "California Raises Minimum Wage Standards", category: "Economy & Work", state: "California" },
      'Education': { id: 1009, headline: "California Increases School Funding Allocation", category: "Education", state: "California" },
      'Free Speech & Press': { id: 1010, headline: "California Protects Journalist Shield Laws", category: "Free Speech & Press", state: "California" },
      'Gun Policy': { id: 1011, headline: "California Implements Enhanced Gun Safety Measures", category: "Gun Policy", state: "California" },
      'Health Policy': { id: 1012, headline: "California Expands Universal Healthcare Access", category: "Health Policy", state: "California" },
      'Immigration & Migration': { id: 1013, headline: "California Sanctuary State Policies Upheld", category: "Immigration & Migration", state: "California" },
      'International Affairs': { id: 1014, headline: "California Trade Partnerships with Pacific Nations", category: "International Affairs", state: "California" },
      'LGBT Acceptance': { id: 1015, headline: "California Advances LGBTQ+ Rights Legislation", category: "LGBT Acceptance", state: "California" },
      'National Conditions': { id: 1016, headline: "California Voting Rights Expansion Bill Passes", category: "National Conditions", state: "California" },
      'Privacy Rights': { id: 1017, headline: "California Consumer Privacy Act Strengthened", category: "Privacy Rights", state: "California" },
      'Religion & Government': { id: 1018, headline: "California Religious Freedom Protections Reviewed", category: "Religion & Government", state: "California" },
      'Social Security & Medicare': { id: 1019, headline: "California Senior Benefits Program Expanded", category: "Social Security & Medicare", state: "California" },
      'Technology Policy Issues': { id: 1020, headline: "California Tech Regulation Bill Advances", category: "Technology Policy Issues", state: "California" }
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

  // Mock news stories data - 3 stories for each issue category
  const newsStories = [
    // Abortion
    {
      id: 1,
      headline: "Reproductive Rights Act Faces Congressional Review",
      description: "The landmark legislation aims to codify abortion access protections at the federal level. Women's rights organizations are mobilizing support as the bill moves through committee.",
      image: "/api/placeholder/400/400",
      category: "Abortion"
    },
    {
      id: 2,
      headline: "State Ballot Initiatives on Reproductive Freedom Gain Momentum",
      description: "Multiple states are considering constitutional amendments to protect reproductive rights. Advocacy groups report unprecedented volunteer engagement in petition drives.",
      image: "/api/placeholder/400/400",
      category: "Abortion"
    },
    {
      id: 3,
      headline: "Healthcare Access Bill Expands Coverage for Reproductive Services",
      description: "New federal legislation would ensure insurance coverage for comprehensive reproductive healthcare. Women's health advocates see this as critical for healthcare equity.",
      image: "/api/placeholder/400/400",
      category: "Abortion"
    },

    // Climate, Energy & Environment
    {
      id: 4,
      headline: "Climate Action Bill HR-3838 Gains Bipartisan Support",
      description: "The landmark climate legislation promises to reduce carbon emissions by 50% over the next decade while creating millions of green jobs. Environmental advocates are calling it historic.",
      image: "/api/placeholder/400/400",
      category: "Climate, Energy & Environment"
    },
    {
      id: 5,
      headline: "Clean Energy Investment Act Targets Renewable Infrastructure",
      description: "The comprehensive bill would allocate $500 billion toward solar, wind, and battery storage projects. Environmental groups are pushing for swift passage before recess.",
      image: "/api/placeholder/400/400",
      category: "Climate, Energy & Environment"
    },
    {
      id: 6,
      headline: "Environmental Justice Bill Addresses Pollution in Communities",
      description: "New legislation would require environmental impact assessments in disadvantaged areas and provide cleanup funding. Community advocates highlight decades of environmental racism.",
      image: "/api/placeholder/400/400",
      category: "Climate, Energy & Environment"
    },

    // Criminal Justice
    {
      id: 7,
      headline: "Police Reform Bill Advances Through Committee",
      description: "Comprehensive police reform legislation gains support from key lawmakers. Reform advocates push for accountability measures and community oversight provisions.",
      image: "/api/placeholder/400/400",
      category: "Criminal Justice"
    },
    {
      id: 8,
      headline: "Sentencing Reform Act Addresses Prison Overcrowding",
      description: "Bipartisan legislation aims to reduce mandatory minimums and expand rehabilitation programs. Criminal justice advocates see opportunity for meaningful reform.",
      image: "/api/placeholder/400/400",
      category: "Criminal Justice"
    },
    {
      id: 9,
      headline: "Community Safety Investment Bill Targets Violence Prevention",
      description: "New funding would support community-based programs to prevent violence and support victims. Local organizations prepare for expanded resources and partnerships.",
      image: "/api/placeholder/400/400",
      category: "Criminal Justice"
    },

    // Death Penalty
    {
      id: 10,
      headline: "Federal Death Penalty Moratorium Bill Introduced",
      description: "Congressional Democrats propose temporary halt to federal executions pending comprehensive review. Death penalty abolitionists see momentum for broader reform.",
      image: "/api/placeholder/400/400",
      category: "Death Penalty"
    },
    {
      id: 11,
      headline: "Innocence Protection Act Expands DNA Testing Access",
      description: "Legislation would ensure access to genetic testing for inmates claiming wrongful conviction. Innocence advocates highlight need for systemic improvements.",
      image: "/api/placeholder/400/400",
      category: "Death Penalty"
    },
    {
      id: 12,
      headline: "Capital Punishment Review Commission Proposed",
      description: "Bipartisan commission would examine death penalty practices and recommend reforms. Reform advocates push for comprehensive evaluation of current system.",
      image: "/api/placeholder/400/400",
      category: "Death Penalty"
    },

    // Defense & National Security
    {
      id: 13,
      headline: "Defense Authorization Act Includes Military Family Support",
      description: "Annual defense bill expands benefits for military families and veterans. Military advocacy groups praise provisions for housing and healthcare improvements.",
      image: "/api/placeholder/400/400",
      category: "Defense & National Security"
    },
    {
      id: 14,
      headline: "Cybersecurity Enhancement Bill Targets Critical Infrastructure",
      description: "New legislation would strengthen protections for power grids and communication networks. National security experts emphasize urgency of digital threats.",
      image: "/api/placeholder/400/400",
      category: "Defense & National Security"
    },
    {
      id: 15,
      headline: "Veterans Mental Health Act Expands Treatment Options",
      description: "Comprehensive mental health legislation addresses PTSD and suicide prevention for veterans. Veterans organizations mobilize support for expanded services.",
      image: "/api/placeholder/400/400",
      category: "Defense & National Security"
    },

    // Discrimination & Prejudice
    {
      id: 16,
      headline: "Equality Act Advances Civil Rights Protections",
      description: "Landmark legislation would expand anti-discrimination protections to include LGBTQ+ individuals. Civil rights advocates see opportunity for historic progress.",
      image: "/api/placeholder/400/400",
      category: "Discrimination & Prejudice"
    },
    {
      id: 17,
      headline: "Hate Crimes Prevention Act Strengthens Federal Response",
      description: "Enhanced hate crimes legislation includes new protected categories and improved enforcement mechanisms. Community organizations push for swift passage.",
      image: "/api/placeholder/400/400",
      category: "Discrimination & Prejudice"
    },
    {
      id: 18,
      headline: "Workplace Fairness Bill Addresses Employment Discrimination",
      description: "New employment protections would expand worker rights and strengthen enforcement mechanisms. Labor advocates emphasize need for comprehensive workplace protections.",
      image: "/api/placeholder/400/400",
      category: "Discrimination & Prejudice"
    },

    // Drug Policy
    {
      id: 19,
      headline: "Cannabis Reform Act Advances Federal Decriminalization",
      description: "Comprehensive marijuana legislation would remove federal criminal penalties and expunge records. Reform advocates see momentum for ending prohibition.",
      image: "/api/placeholder/400/400",
      category: "Drug Policy"
    },
    {
      id: 20,
      headline: "Opioid Crisis Response Act Expands Treatment Access",
      description: "New funding would support addiction treatment and recovery programs nationwide. Public health advocates emphasize treatment over incarceration approach.",
      image: "/api/placeholder/400/400",
      category: "Drug Policy"
    },
    {
      id: 21,
      headline: "Safe Consumption Site Bill Addresses Overdose Crisis",
      description: "Legislation would allow supervised drug consumption facilities in affected communities. Harm reduction advocates highlight evidence-based approach to addiction.",
      image: "/api/placeholder/400/400",
      category: "Drug Policy"
    },

    // Economy & Work
    {
      id: 22,
      headline: "Raise the Wage Act Proposes $15 Minimum Wage",
      description: "Federal minimum wage increase would affect millions of workers nationwide. Labor organizations mobilize support for wage increases and worker protections.",
      image: "/api/placeholder/400/400",
      category: "Economy & Work"
    },
    {
      id: 23,
      headline: "Worker Protection Act Strengthens Union Rights",
      description: "New labor legislation would make it easier for workers to organize and bargain collectively. Union advocates see opportunity for significant labor reform.",
      image: "/api/placeholder/400/400",
      category: "Economy & Work"
    },
    {
      id: 24,
      headline: "Paid Family Leave Act Provides Universal Benefits",
      description: "Comprehensive paid leave program would cover all workers for family and medical emergencies. Family advocacy groups push for swift implementation.",
      image: "/api/placeholder/400/400",
      category: "Economy & Work"
    },

    // Education
    {
      id: 25,
      headline: "Education Funding Equity Act Addresses School Resources",
      description: "Federal legislation aims to reduce funding disparities between wealthy and poor school districts. Education advocates emphasize need for equitable resources.",
      image: "/api/placeholder/400/400",
      category: "Education"
    },
    {
      id: 26,
      headline: "Student Debt Relief Act Proposes Loan Forgiveness",
      description: "Comprehensive student loan reform would forgive debt and expand income-based repayment options. Student advocates mobilize for debt relief measures.",
      image: "/api/placeholder/400/400",
      category: "Education"
    },
    {
      id: 27,
      headline: "Early Childhood Education Act Expands Pre-K Access",
      description: "Universal pre-kindergarten program would provide quality early education for all families. Child development advocates highlight long-term benefits.",
      image: "/api/placeholder/400/400",
      category: "Education"
    },

    // Free Speech & Press
    {
      id: 28,
      headline: "Press Freedom Protection Act Shields Journalists from Surveillance",
      description: "The bill would strengthen protections for journalists and whistleblowers against government surveillance. Press freedom advocates highlight threats to democratic accountability.",
      image: "/api/placeholder/400/400",
      category: "Free Speech & Press"
    },
    {
      id: 29,
      headline: "Social Media Regulation Bill Addresses Content Moderation",
      description: "New legislation would establish guidelines for platform content policies while protecting free speech. Digital rights groups emphasize the balance between safety and expression.",
      image: "/api/placeholder/400/400",
      category: "Free Speech & Press"
    },
    {
      id: 30,
      headline: "Campus Free Speech Act Protects Academic Expression",
      description: "The bill would require universities to maintain viewpoint neutrality and protect controversial speech. Academic freedom advocates call it essential for intellectual discourse.",
      image: "/api/placeholder/400/400",
      category: "Free Speech & Press"
    },

    // Gun Policy
    {
      id: 31,
      headline: "Universal Background Checks Act Gains Congressional Support",
      description: "Bipartisan legislation would require background checks for all gun sales and transfers. Gun safety advocates see momentum for comprehensive reform.",
      image: "/api/placeholder/400/400",
      category: "Gun Policy"
    },
    {
      id: 32,
      headline: "Assault Weapons Ban Proposed in Congress",
      description: "New legislation would restrict civilian access to military-style weapons and high-capacity magazines. Gun control advocates mobilize for swift passage.",
      image: "/api/placeholder/400/400",
      category: "Gun Policy"
    },
    {
      id: 33,
      headline: "Safe Storage Act Requires Secure Gun Storage",
      description: "Child safety legislation would mandate secure storage requirements for firearms in homes. Gun safety advocates emphasize accident prevention measures.",
      image: "/api/placeholder/400/400",
      category: "Gun Policy"
    },

    // Health Policy
    {
      id: 34,
      headline: "Medicare for All Act Proposes Universal Healthcare",
      description: "Single-payer healthcare legislation would provide coverage for all Americans. Healthcare advocates mobilize support for universal access to medical care.",
      image: "/api/placeholder/400/400",
      category: "Health Policy"
    },
    {
      id: 35,
      headline: "Prescription Drug Price Reform Act Targets Costs",
      description: "New legislation would allow Medicare to negotiate prescription drug prices and cap out-of-pocket costs. Patient advocates push for immediate relief from high costs.",
      image: "/api/placeholder/400/400",
      category: "Health Policy"
    },
    {
      id: 36,
      headline: "Mental Health Access Act Expands Treatment Coverage",
      description: "Comprehensive mental health legislation would expand access to therapy and psychiatric care. Mental health advocates emphasize parity with physical healthcare.",
      image: "/api/placeholder/400/400",
      category: "Health Policy"
    },

    // Immigration & Migration
    {
      id: 37,
      headline: "Comprehensive Immigration Reform Act Offers Path to Citizenship",
      description: "Landmark legislation would provide pathway to citizenship for undocumented immigrants and reform immigration system. Immigration advocates see opportunity for meaningful reform.",
      image: "/api/placeholder/400/400",
      category: "Immigration & Migration"
    },
    {
      id: 38,
      headline: "DREAM Act Protects Young Immigrants",
      description: "Legislation would provide permanent protections for immigrants brought to US as children. Youth advocates mobilize for swift passage of permanent protections.",
      image: "/api/placeholder/400/400",
      category: "Immigration & Migration"
    },
    {
      id: 39,
      headline: "Refugee Protection Act Expands Humanitarian Programs",
      description: "New refugee legislation would increase admission numbers and improve protection processes. Humanitarian organizations push for expanded refugee resettlement.",
      image: "/api/placeholder/400/400",
      category: "Immigration & Migration"
    },

    // International Affairs
    {
      id: 40,
      headline: "Foreign Aid Reform Act Modernizes Development Programs",
      description: "Comprehensive foreign aid legislation would refocus programs on poverty reduction and democracy promotion. International development advocates emphasize effective assistance.",
      image: "/api/placeholder/400/400",
      category: "International Affairs"
    },
    {
      id: 41,
      headline: "Climate Diplomacy Act Advances Environmental Cooperation",
      description: "New legislation would prioritize climate action in foreign policy and international agreements. Environmental advocates see opportunity for global leadership.",
      image: "/api/placeholder/400/400",
      category: "International Affairs"
    },
    {
      id: 42,
      headline: "Trade Reform Act Addresses Worker Protections",
      description: "Trade legislation would include strong labor and environmental standards in international agreements. Fair trade advocates push for worker-friendly policies.",
      image: "/api/placeholder/400/400",
      category: "International Affairs"
    },

    // LGBT Acceptance
    {
      id: 43,
      headline: "LGBTQ+ Rights Protection Act Advances Civil Protections",
      description: "Comprehensive legislation would protect LGBTQ+ individuals from discrimination in employment, housing, and public accommodations. Equality advocates mobilize for historic civil rights expansion.",
      image: "/api/placeholder/400/400",
      category: "LGBT Acceptance"
    },
    {
      id: 44,
      headline: "Transgender Rights Act Protects Healthcare Access",
      description: "New legislation would ensure healthcare access and prevent discrimination against transgender individuals. LGBTQ+ advocates emphasize need for comprehensive protections.",
      image: "/api/placeholder/400/400",
      category: "LGBT Acceptance"
    },
    {
      id: 45,
      headline: "Marriage Equality Protection Act Codifies Same-Sex Marriage",
      description: "Federal legislation would provide permanent protections for same-sex marriage nationwide. Equality advocates seek to enshrine marriage rights in federal law.",
      image: "/api/placeholder/400/400",
      category: "LGBT Acceptance"
    },

    // National Conditions
    {
      id: 46,
      headline: "Voting Rights Advancement Act Restores Election Protections",
      description: "Comprehensive voting rights legislation would restore and expand federal oversight of elections. Democracy advocates mobilize for voting access protections.",
      image: "/api/placeholder/400/400",
      category: "National Conditions"
    },
    {
      id: 47,
      headline: "John Lewis Voting Rights Act Strengthens Federal Oversight",
      description: "Landmark voting rights restoration would require federal approval for voting changes in covered states. Civil rights organizations push for swift passage.",
      image: "/api/placeholder/400/400",
      category: "National Conditions"
    },
    {
      id: 48,
      headline: "Democracy Reform Act Addresses Campaign Finance",
      description: "Comprehensive democracy legislation would reform campaign finance, redistricting, and ethics rules. Government reform advocates see opportunity for systemic change.",
      image: "/api/placeholder/400/400",
      category: "National Conditions"
    },

    // Privacy Rights
    {
      id: 49,
      headline: "Digital Privacy Protection Act Strengthens Data Rights",
      description: "Comprehensive privacy legislation would give consumers control over personal data and limit corporate surveillance. Privacy advocates push for strong enforcement mechanisms.",
      image: "/api/placeholder/400/400",
      category: "Privacy Rights"
    },
    {
      id: 50,
      headline: "Surveillance Reform Act Limits Government Data Collection",
      description: "New legislation would restrict government surveillance programs and require warrants for data access. Civil liberties advocates emphasize constitutional protections.",
      image: "/api/placeholder/400/400",
      category: "Privacy Rights"
    },
    {
      id: 51,
      headline: "Internet Privacy Act Regulates Online Tracking",
      description: "Comprehensive online privacy legislation would limit tracking and require user consent for data collection. Digital rights advocates mobilize for user protection.",
      image: "/api/placeholder/400/400",
      category: "Privacy Rights"
    },

    // Religion & Government
    {
      id: 52,
      headline: "Religious Freedom Protection Act Safeguards Faith Practices",
      description: "Legislation would protect religious exercise while maintaining separation of church and state. Faith communities emphasize need for balanced religious liberty protections.",
      image: "/api/placeholder/400/400",
      category: "Religion & Government"
    },
    {
      id: 53,
      headline: "Church-State Separation Act Clarifies Constitutional Boundaries",
      description: "New legislation would strengthen enforcement of establishment clause protections. Secular advocates push for clear church-state separation guidelines.",
      image: "/api/placeholder/400/400",
      category: "Religion & Government"
    },
    {
      id: 54,
      headline: "Faith-Based Initiative Reform Act Updates Federal Programs",
      description: "Reform legislation would ensure equal access while maintaining constitutional protections. Religious liberty advocates seek balanced approach to faith-based services.",
      image: "/api/placeholder/400/400",
      category: "Religion & Government"
    },

    // Social Security & Medicare
    {
      id: 55,
      headline: "Social Security Expansion Act Increases Benefits",
      description: "Comprehensive legislation would expand Social Security benefits and extend program solvency. Senior advocates mobilize for improved retirement security.",
      image: "/api/placeholder/400/400",
      category: "Social Security & Medicare"
    },
    {
      id: 56,
      headline: "Medicare Improvement Act Expands Coverage Options",
      description: "Healthcare legislation would add dental, vision, and hearing coverage to Medicare. Senior advocacy groups push for comprehensive healthcare benefits.",
      image: "/api/placeholder/400/400",
      category: "Social Security & Medicare"
    },
    {
      id: 57,
      headline: "Senior Citizens Protection Act Addresses Healthcare Costs",
      description: "New legislation would cap prescription drug costs and reduce Medicare premiums for seniors. AARP and other senior organizations advocate for affordability measures.",
      image: "/api/placeholder/400/400",
      category: "Social Security & Medicare"
    },

    // Technology Policy Issues
    {
      id: 58,
      headline: "Big Tech Accountability Act Addresses Market Concentration",
      description: "Antitrust legislation would break up large technology companies and promote competition. Tech reform advocates see opportunity for market restructuring.",
      image: "/api/placeholder/400/400",
      category: "Technology Policy Issues"
    },
    {
      id: 59,
      headline: "Artificial Intelligence Ethics Act Regulates AI Development",
      description: "Comprehensive AI legislation would establish safety standards and oversight mechanisms. Technology ethicists emphasize need for responsible AI development.",
      image: "/api/placeholder/400/400",
      category: "Technology Policy Issues"
    },
    {
      id: 60,
      headline: "Digital Infrastructure Act Expands Broadband Access",
      description: "Investment legislation would build high-speed internet infrastructure in underserved communities. Digital equity advocates push for universal broadband access.",
      image: "/api/placeholder/400/400",
      category: "Technology Policy Issues"
    }
  ];

  // Mock federal bills data for "Act Before the Vote" section (policy-specific)
  const mockFederalBillsByCategory = useMemo(() => ({
    'Climate, Energy & Environment': [
      { type: 'S', number: '442', title: 'AIM HIGH Act', url: '/federal/bill/119/s/442' },
      { type: 'S', number: '2080', title: 'FLRAA Production Acceleration Act of 2025', url: '/federal/bill/119/s/2080' },
      { type: 'S', number: '1882', title: 'RESTORE Act', url: '/federal/bill/119/s/1882' },
      { type: 'S', number: '1632', title: 'Defense Workforce Integration Act of 2025', url: '/federal/bill/119/s/1632' }
    ],
    'Abortion': [
      { type: 'HR', number: '1', title: 'Reproductive Freedom Act', url: '/federal/bill/119/hr/1' },
      { type: 'S', number: '100', title: 'Women\'s Health Protection Act', url: '/federal/bill/119/s/100' },
      { type: 'HR', number: '200', title: 'Healthcare Access Act', url: '/federal/bill/119/hr/200' },
      { type: 'S', number: '150', title: 'Reproductive Rights Restoration Act', url: '/federal/bill/119/s/150' }
    ],
    'Gun Policy': [
      { type: 'HR', number: '1', title: 'Universal Background Checks Act', url: '/federal/bill/119/hr/1' },
      { type: 'S', number: '200', title: 'Assault Weapons Ban Act', url: '/federal/bill/119/s/200' },
      { type: 'HR', number: '500', title: 'Gun Safety Reform Act', url: '/federal/bill/119/hr/500' },
      { type: 'S', number: '300', title: 'Red Flag Laws Act', url: '/federal/bill/119/s/300' }
    ],
    'Criminal Justice': [
      { type: 'HR', number: '22', title: 'Police Reform Act', url: '/federal/bill/119/hr/22' },
      { type: 'S', number: '400', title: 'Sentencing Reform Act', url: '/federal/bill/119/s/400' },
      { type: 'HR', number: '800', title: 'Prison Reform Act', url: '/federal/bill/119/hr/800' },
      { type: 'S', number: '600', title: 'Criminal Justice Modernization Act', url: '/federal/bill/119/s/600' }
    ],
    'Immigration & Migration': [
      { type: 'HR', number: '1072', title: 'DREAM Act', url: '/federal/bill/119/hr/1072' },
      { type: 'S', number: '1092', title: 'Immigration Reform Act', url: '/federal/bill/119/s/1092' },
      { type: 'HR', number: '1500', title: 'Border Security Act', url: '/federal/bill/119/hr/1500' },
      { type: 'S', number: '800', title: 'Refugee Protection Act', url: '/federal/bill/119/s/800' }
    ],
    'Health Policy': [
      { type: 'HR', number: '3000', title: 'Medicare for All Act', url: '/federal/bill/119/hr/3000' },
      { type: 'S', number: '1200', title: 'Drug Price Reform Act', url: '/federal/bill/119/s/1200' },
      { type: 'HR', number: '2500', title: 'Mental Health Access Act', url: '/federal/bill/119/hr/2500' },
      { type: 'S', number: '900', title: 'Healthcare Affordability Act', url: '/federal/bill/119/s/900' }
    ],
    'Education': [
      { type: 'HR', number: '1400', title: 'Education Funding Equity Act', url: '/federal/bill/119/hr/1400' },
      { type: 'S', number: '700', title: 'Student Debt Relief Act', url: '/federal/bill/119/s/700' },
      { type: 'HR', number: '1800', title: 'Early Childhood Education Act', url: '/federal/bill/119/hr/1800' },
      { type: 'S', number: '500', title: 'Higher Education Access Act', url: '/federal/bill/119/s/500' }
    ]
  }), []);

  // Mock state bills data for "Important bills in [State]" section
  const mockStateBillsByCategory = useMemo(() => ({
    'Climate, Energy & Environment': {
      'CA': [
        { number: 'AB 1', title: 'California Green Energy Initiative', url: '/state/ca/bill/AB1' },
        { number: 'AB 3', title: 'Climate Action Investment Act', url: '/state/ca/bill/AB3' },
        { number: 'SB 2', title: 'Renewable Energy Standards Act', url: '/state/ca/bill/SB2' },
        { number: 'SB 3', title: 'Carbon Neutrality Act', url: '/state/ca/bill/SB3' }
      ],
      'NY': [
        { number: 'A 100', title: 'New York Climate Action Act', url: '/state/ny/bill/A100' },
        { number: 'S 50', title: 'Clean Energy Jobs Act', url: '/state/ny/bill/S50' },
        { number: 'A 200', title: 'Environmental Justice Act', url: '/state/ny/bill/A200' },
        { number: 'S 75', title: 'Green Infrastructure Act', url: '/state/ny/bill/S75' }
      ],
      'TX': [
        { number: 'HB 1', title: 'Texas Energy Independence Act', url: '/state/tx/bill/HB1' },
        { number: 'SB 1', title: 'Grid Resilience Act', url: '/state/tx/bill/SB1' },
        { number: 'HB 100', title: 'Renewable Energy Investment Act', url: '/state/tx/bill/HB100' },
        { number: 'SB 50', title: 'Environmental Protection Act', url: '/state/tx/bill/SB50' }
      ],
      'FL': [
        { number: 'H 11', title: 'Florida Climate Resilience Act', url: '/state/fl/bill/H11' },
        { number: 'S 20', title: 'Everglades Protection Act', url: '/state/fl/bill/S20' },
        { number: 'H 50', title: 'Clean Water Standards Act', url: '/state/fl/bill/H50' },
        { number: 'S 35', title: 'Coastal Conservation Act', url: '/state/fl/bill/S35' }
      ]
    },
    'Criminal Justice': {
      'CA': [
        { number: 'AB 5', title: 'Police Accountability Act', url: '/state/ca/bill/AB5' },
        { number: 'SB 4', title: 'Prison Reform Act', url: '/state/ca/bill/SB4' },
        { number: 'AB 10', title: 'Bail Reform Act', url: '/state/ca/bill/AB10' },
        { number: 'SB 8', title: 'Criminal Justice Reform Act', url: '/state/ca/bill/SB8' }
      ],
      'NY': [
        { number: 'A 300', title: 'Criminal Justice Reform Act', url: '/state/ny/bill/A300' },
        { number: 'S 150', title: 'Police Transparency Act', url: '/state/ny/bill/S150' },
        { number: 'A 400', title: 'Sentencing Guidelines Reform', url: '/state/ny/bill/A400' },
        { number: 'S 200', title: 'Community Safety Act', url: '/state/ny/bill/S200' }
      ]
    }
  }), []);

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Fetch latest bills (mock data for now)
  useEffect(() => {
    // Simulate API call
    const selectedCategory = issueCategories.find(cat => cat.id === selectedFilter);
    const categoryLabel = selectedCategory?.label || 'Climate, Energy & Environment';
    const bills = mockFederalBillsByCategory[categoryLabel] || mockFederalBillsByCategory['Climate, Energy & Environment'];
    setLatestBills(bills);
  }, [selectedFilter, issueCategories]);

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
                      <Link href={`/issues/${convertCategoryToSlug(policyCategory)}/federal`}>
                        View Federal Bills
                      </Link>
                    </Button>

                    <Link
                      href={`/issues/${convertCategoryToSlug(policyCategory)}`}
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                    >
                      Browse by State
                    </Link>
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
                          Voice Opinion
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

                {/* Important bills in [State] */}
                {currentUserState && (
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
                            <Link href="/advocacy-message">
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
                            <Link href="/advocacy-message">
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
                            Voice Opinion
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
                            Voice Opinion
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