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
import Link from 'next/link';
import { SITE_ISSUE_CATEGORIES } from '@/lib/policy-area-mapping';
import { campaignsService } from '@/lib/campaigns';

export default function Home() {
  const [showCard, setShowCard] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('for-you');

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
      headline: "Criminal Justice Reform Focuses on Sentencing Disparities",
      description: "The FIRST STEP Act expansion would address racial disparities in sentencing and increase rehabilitation programs. Criminal justice reform advocates are pushing for broader support.",
      image: "/api/placeholder/400/400",
      category: "Criminal Justice"
    },
    {
      id: 8,
      headline: "Police Reform Bill Mandates National Standards",
      description: "The comprehensive legislation would establish federal oversight of police departments and require de-escalation training. Civil rights groups call it a crucial step toward accountability.",
      image: "/api/placeholder/400/400",
      category: "Criminal Justice"
    },
    {
      id: 9,
      headline: "Prison Reform Act Expands Rehabilitation Programs",
      description: "New bill would increase funding for education and job training in federal prisons. Former inmates and advocacy groups highlight the importance of reentry support.",
      image: "/api/placeholder/400/400",
      category: "Criminal Justice"
    },

    // Death Penalty
    {
      id: 10,
      headline: "Federal Death Penalty Abolition Act Introduced",
      description: "The bill would end federal capital punishment and commute existing death sentences to life imprisonment. Death penalty abolition groups are mobilizing grassroots support.",
      image: "/api/placeholder/400/400",
      category: "Death Penalty"
    },
    {
      id: 11,
      headline: "State Moratoriums on Executions Gain Legislative Support",
      description: "Multiple states are considering bills to pause executions pending comprehensive reviews. Criminal justice reform advocates cite concerns about wrongful convictions.",
      image: "/api/placeholder/400/400",
      category: "Death Penalty"
    },
    {
      id: 12,
      headline: "Innocence Protection Act Expands DNA Testing Access",
      description: "The legislation would provide funding for post-conviction DNA testing and exoneration compensation. Innocence advocates highlight the need for systemic reform.",
      image: "/api/placeholder/400/400",
      category: "Death Penalty"
    },

    // Defense & National Security
    {
      id: 13,
      headline: "Defense Authorization Act Includes Cybersecurity Funding",
      description: "The annual defense bill allocates $15 billion for cybersecurity infrastructure and personnel. National security experts emphasize the growing threat landscape.",
      image: "/api/placeholder/400/400",
      category: "Defense & National Security"
    },
    {
      id: 14,
      headline: "Veterans Healthcare Expansion Bill Advances",
      description: "New legislation would expand mental health services and modernize VA facilities nationwide. Veterans' organizations are advocating for swift passage.",
      image: "/api/placeholder/400/400",
      category: "Defense & National Security"
    },
    {
      id: 15,
      headline: "Military Family Support Act Addresses Housing Crisis",
      description: "The bill would increase housing allowances and improve on-base accommodation quality. Military families and advocacy groups highlight the urgent need for reform.",
      image: "/api/placeholder/400/400",
      category: "Defense & National Security"
    },

    // Discrimination & Prejudice
    {
      id: 16,
      headline: "Equality Act Faces Senate Vote on Civil Rights Protections",
      description: "The comprehensive civil rights bill would extend federal protections to include sexual orientation and gender identity. LGBTQ+ advocacy groups are mobilizing unprecedented support.",
      image: "/api/placeholder/400/400",
      category: "Discrimination & Prejudice"
    },
    {
      id: 17,
      headline: "Anti-Hate Crime Legislation Strengthens Federal Response",
      description: "New bill would enhance hate crime reporting and provide additional resources for investigation. Civil rights organizations emphasize the rising threat of extremism.",
      image: "/api/placeholder/400/400",
      category: "Discrimination & Prejudice"
    },
    {
      id: 18,
      headline: "Workplace Discrimination Protection Act Expands Coverage",
      description: "The legislation would strengthen employment protections and increase penalties for discrimination. Workers' rights advocates call it essential for workplace equity.",
      image: "/api/placeholder/400/400",
      category: "Discrimination & Prejudice"
    },

    // Drug Policy
    {
      id: 19,
      headline: "Drug Decriminalization Bill Emphasizes Treatment Over Incarceration",
      description: "The comprehensive reform would redirect drug offense penalties toward treatment programs. Criminal justice and public health advocates unite behind harm reduction approach.",
      image: "/api/placeholder/400/400",
      category: "Drug Policy"
    },
    {
      id: 20,
      headline: "Prescription Drug Pricing Reform Targets Big Pharma",
      description: "New legislation would allow Medicare to negotiate drug prices and cap insulin costs. Patient advocacy groups highlight the life-or-death nature of affordable medication.",
      image: "/api/placeholder/400/400",
      category: "Drug Policy"
    },
    {
      id: 21,
      headline: "Opioid Crisis Response Act Expands Treatment Access",
      description: "The bill would increase funding for addiction treatment and recovery programs nationwide. Public health advocates emphasize the ongoing epidemic's devastating impact.",
      image: "/api/placeholder/400/400",
      category: "Drug Policy"
    },

    // Economy & Work
    {
      id: 22,
      headline: "Minimum Wage Increase Bill Targets $15 Federal Standard",
      description: "The Raise the Wage Act would gradually increase the federal minimum wage over five years. Labor unions and worker advocacy groups are pushing for swift passage.",
      image: "/api/placeholder/400/400",
      category: "Economy & Work"
    },
    {
      id: 23,
      headline: "Worker Rights Protection Act Strengthens Union Organizing",
      description: "New legislation would protect workers' rights to organize and collectively bargain. Labor organizations highlight the importance of economic democracy.",
      image: "/api/placeholder/400/400",
      category: "Economy & Work"
    },
    {
      id: 24,
      headline: "Small Business Support Bill Provides COVID Recovery Aid",
      description: "The comprehensive package would offer grants and low-interest loans to struggling small businesses. Business advocacy groups emphasize the need for continued support.",
      image: "/api/placeholder/400/400",
      category: "Economy & Work"
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
      headline: "Gun Safety Legislation Includes Universal Background Checks",
      description: "The Bipartisan Safer Communities Act expands background check requirements and increases funding for mental health programs. Gun violence prevention advocates see this as crucial progress.",
      image: "/api/placeholder/400/400",
      category: "Gun Policy"
    },
    {
      id: 32,
      headline: "Assault Weapons Ban Reintroduced with Bipartisan Support",
      description: "The legislation would prohibit the sale of high-capacity magazines and military-style weapons. Gun safety organizations are mobilizing survivors and families.",
      image: "/api/placeholder/400/400",
      category: "Gun Policy"
    },
    {
      id: 33,
      headline: "Red Flag Law Enhancement Act Provides Federal Framework",
      description: "The bill would support state extreme risk protection order programs with federal funding. Gun violence prevention groups highlight the life-saving potential.",
      image: "/api/placeholder/400/400",
      category: "Gun Policy"
    },

    // Health Policy
    {
      id: 34,
      headline: "Medicare for All Bill Proposes Universal Healthcare",
      description: "The comprehensive legislation would establish a single-payer healthcare system covering all Americans. Healthcare advocacy groups are organizing nationwide support.",
      image: "/api/placeholder/400/400",
      category: "Health Policy"
    },
    {
      id: 35,
      headline: "Mental Health Parity Act Strengthens Insurance Coverage",
      description: "New legislation would enforce equal coverage for mental health and substance abuse treatment. Mental health advocates emphasize the persistent treatment gap.",
      image: "/api/placeholder/400/400",
      category: "Health Policy"
    },
    {
      id: 36,
      headline: "Public Health Infrastructure Bill Addresses Pandemic Preparedness",
      description: "The bill would modernize public health systems and expand the healthcare workforce. Public health experts highlight lessons learned from COVID-19.",
      image: "/api/placeholder/400/400",
      category: "Health Policy"
    },

    // Immigration & Migration
    {
      id: 37,
      headline: "Immigration Reform Bill Offers Path to Citizenship for Dreamers",
      description: "The comprehensive immigration bill would provide a pathway to citizenship for undocumented immigrants brought to the US as children. Immigration rights groups are organizing nationwide.",
      image: "/api/placeholder/400/400",
      category: "Immigration & Migration"
    },
    {
      id: 38,
      headline: "Border Security and Immigration Reform Act Seeks Bipartisan Solution",
      description: "The legislation combines border security measures with comprehensive immigration reform. Immigrant advocacy groups emphasize the need for humane policies.",
      image: "/api/placeholder/400/400",
      category: "Immigration & Migration"
    },
    {
      id: 39,
      headline: "Refugee Protection Act Expands Asylum Access",
      description: "New bill would increase refugee admissions and streamline the asylum process. Human rights organizations highlight the global displacement crisis.",
      image: "/api/placeholder/400/400",
      category: "Immigration & Migration"
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
      category: "LGBT Acceptance"
    },
    {
      id: 44,
      headline: "Transgender Rights Protection Bill Advances in Congress",
      description: "New legislation would prohibit discrimination against transgender individuals in healthcare, education, and employment. LGBTQ+ advocates emphasize the urgent need for federal protections.",
      image: "/api/placeholder/400/400",
      category: "LGBT Acceptance"
    },
    {
      id: 45,
      headline: "LGBTQ+ Youth Mental Health Act Addresses Crisis",
      description: "The bill would fund specialized mental health services and anti-bullying programs for LGBTQ+ youth. Advocacy groups highlight alarming suicide rates and discrimination.",
      image: "/api/placeholder/400/400",
      category: "LGBT Acceptance"
    },

    // National Conditions
    {
      id: 46,
      headline: "Voting Rights Act HR-14 Faces Critical Senate Vote",
      description: "The For the People Act aims to expand voter access, end gerrymandering, and reduce money's influence in politics. Civil rights organizations are mobilizing unprecedented support.",
      image: "/api/placeholder/400/400",
      category: "National Conditions"
    },
    {
      id: 47,
      headline: "Government Ethics Reform Bill Strengthens Oversight",
      description: "New legislation would expand financial disclosure requirements and strengthen ethics enforcement. Government accountability groups emphasize the need for transparency.",
      image: "/api/placeholder/400/400",
      category: "National Conditions"
    },
    {
      id: 48,
      headline: "Infrastructure Investment Act Addresses National Needs",
      description: "The comprehensive package would modernize roads, bridges, broadband, and water systems nationwide. Infrastructure advocates highlight decades of underinvestment.",
      image: "/api/placeholder/400/400",
      category: "National Conditions"
    },

    // Privacy Rights
    {
      id: 49,
      headline: "Digital Privacy Protection Act Regulates Data Collection",
      description: "The comprehensive bill would establish federal data privacy standards and user consent requirements. Privacy advocates call it essential protection in the digital age.",
      image: "/api/placeholder/400/400",
      category: "Privacy Rights"
    },
    {
      id: 50,
      headline: "Surveillance Reform Bill Limits Government Data Collection",
      description: "New legislation would require warrants for digital surveillance and strengthen oversight. Civil liberties groups emphasize constitutional protections.",
      image: "/api/placeholder/400/400",
      category: "Privacy Rights"
    },
    {
      id: 51,
      headline: "Children's Online Privacy Act Protects Youth Data",
      description: "The bill would prohibit targeted advertising to minors and strengthen parental consent requirements. Child advocacy groups highlight online exploitation risks.",
      image: "/api/placeholder/400/400",
      category: "Privacy Rights"
    },

    // Religion & Government
    {
      id: 52,
      headline: "Religious Freedom Restoration Act Faces Constitutional Review",
      description: "The legislation would strengthen religious liberty protections while balancing civil rights concerns. Faith-based organizations and civil rights groups engage in dialogue.",
      image: "/api/placeholder/400/400",
      category: "Religion & Government"
    },
    {
      id: 53,
      headline: "Faith-Based Initiative Reform Bill Addresses Funding Equity",
      description: "New legislation would ensure equal access to federal funding while maintaining separation principles. Religious liberty advocates emphasize constitutional balance.",
      image: "/api/placeholder/400/400",
      category: "Religion & Government"
    },
    {
      id: 54,
      headline: "Chaplaincy Services Expansion Act Supports Military Families",
      description: "The bill would expand chaplain services across military installations and VA facilities. Military family advocates highlight the importance of spiritual support.",
      image: "/api/placeholder/400/400",
      category: "Religion & Government"
    },

    // Social Security & Medicare
    {
      id: 55,
      headline: "Social Security 2100 Act Expands Benefits and Solvency",
      description: "The comprehensive reform would increase benefits and extend the program's financial stability. Senior advocacy groups are mobilizing retirees and near-retirees.",
      image: "/api/placeholder/400/400",
      category: "Social Security & Medicare"
    },
    {
      id: 56,
      headline: "Medicare Prescription Drug Negotiation Bill Targets Costs",
      description: "New legislation would allow Medicare to negotiate prescription drug prices directly with manufacturers. Senior advocates highlight the burden of medication costs.",
      image: "/api/placeholder/400/400",
      category: "Social Security & Medicare"
    },
    {
      id: 57,
      headline: "Medicare Expansion Act Lowers Eligibility Age",
      description: "The bill would gradually lower Medicare eligibility from 65 to 60, covering millions more Americans. Healthcare advocates emphasize the coverage gap problem.",
      image: "/api/placeholder/400/400",
      category: "Social Security & Medicare"
    },

    // Technology Policy Issues
    {
      id: 58,
      headline: "Artificial Intelligence Regulation Act Establishes Safety Standards",
      description: "The comprehensive bill would create federal oversight for AI development and deployment. Technology policy experts emphasize the need for proactive governance.",
      image: "/api/placeholder/400/400",
      category: "Technology Policy Issues"
    },
    {
      id: 59,
      headline: "Broadband Equity Act Expands Rural Internet Access",
      description: "New legislation would invest $65 billion in high-speed internet infrastructure for underserved communities. Digital equity advocates highlight the persistent digital divide.",
      image: "/api/placeholder/400/400",
      category: "Technology Policy Issues"
    },
    {
      id: 60,
      headline: "Platform Accountability Act Regulates Social Media Companies",
      description: "The bill would establish transparency requirements and algorithmic auditing for major platforms. Digital rights groups emphasize the need for democratic oversight.",
      image: "/api/placeholder/400/400",
      category: "Technology Policy Issues"
    }
  ];

  // Get all real campaigns from the service and transform them for the homepage
  const allCampaigns = campaignsService.getAllCampaigns().filter(campaign => campaign.isActive);

  const campaignStories = allCampaigns.map(campaign => ({
    id: campaign.id,
    type: 'campaign',
    organization: campaign.groupName,
    groupSlug: campaign.groupSlug,
    position: campaign.position,
    policyIssue: 'National Conditions', // Most voting rights campaigns fall under this category
    billNumber: `${campaign.bill.type} ${campaign.bill.number}`,
    billTitle: campaign.bill.title || `${campaign.bill.type} ${campaign.bill.number}`,
    description: campaign.reasoning,
    supportCount: campaign.supportCount,
    opposeCount: campaign.opposeCount
  }));

  // Prepare issue categories for dropdown with "View all" option
  const issueCategories = [
    { id: 'view-all', label: 'View all' },
    ...SITE_ISSUE_CATEGORIES.map(category => ({
      id: category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
      label: category
    }))
  ];

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

  // Filter stories based on selected filter
  const getFilteredStories = () => {
    let stories;
    let campaigns;

    if (selectedFilter === 'for-you' || selectedFilter === 'top-stories' || selectedFilter === 'view-all') {
      stories = newsStories;
      campaigns = campaignStories;
    } else {
      // Find the category name from the filter ID
      const selectedCategory = issueCategories.find(cat => cat.id === selectedFilter);
      if (!selectedCategory || selectedCategory.id === 'view-all') {
        stories = newsStories;
        campaigns = campaignStories;
      } else {
        stories = newsStories.filter(story => story.category === selectedCategory.label);
        campaigns = campaignStories.filter(campaign => campaign.policyIssue === selectedCategory.label);
      }
    }

    // Combine stories and campaigns, then randomize with special positioning
    const combinedContent = [...stories, ...campaigns];
    const shuffled = shuffleArray(combinedContent);

    // For 'for-you' view, ensure Black Voters Matter HR 1 campaign is in position #2
    if (selectedFilter === 'for-you') {
      const blackVotersHR1Index = shuffled.findIndex(item =>
        item.type === 'campaign' &&
        item.organization === 'Black Voters Matter' &&
        item.billNumber === 'HR 1'
      );

      if (blackVotersHR1Index !== -1 && blackVotersHR1Index !== 1) {
        // Remove the card from its current position
        const [blackVotersCard] = shuffled.splice(blackVotersHR1Index, 1);
        // Insert it at position 1 (index 1 = #2 spot after mission card)
        shuffled.splice(1, 0, blackVotersCard);
      }
    }

    return shuffled;
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
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-medium">eGutenbergPress.org</div>
              <div className="flex items-center gap-2">
              <Badge
                variant={selectedFilter === 'for-you' ? 'default' : 'outline'}
                className={`cursor-pointer transition-colors text-sm px-3 py-1 ${
                  selectedFilter === 'for-you'
                    ? ''
                    : 'hover:bg-secondary'
                }`}
                onClick={() => setSelectedFilter('for-you')}
              >
                For You
              </Badge>
              <Badge
                variant={selectedFilter === 'top-stories' ? 'default' : 'outline'}
                className={`cursor-pointer transition-colors text-sm px-3 py-1 ${
                  selectedFilter === 'top-stories'
                    ? ''
                    : 'hover:bg-secondary'
                }`}
                onClick={() => setSelectedFilter('top-stories')}
              >
                Top Stories
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-sm"
                  >
                    {issueCategories.find(cat => cat.id === selectedFilter)?.label || 'Issues'}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                  {issueCategories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => setSelectedFilter(category.id)}
                      className="cursor-pointer"
                    >
                      {category.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filters - Keep as is */}
        <div className="md:hidden border-b">
          <div
            className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="flex gap-2 px-4 py-6 min-w-max">
              <Badge
                variant={selectedFilter === 'for-you' ? 'default' : 'outline'}
                className={`cursor-pointer transition-colors whitespace-nowrap ${
                  selectedFilter === 'for-you'
                    ? ''
                    : 'hover:bg-secondary'
                }`}
                onClick={() => setSelectedFilter('for-you')}
              >
                For You
              </Badge>
              <Badge
                variant={selectedFilter === 'top-stories' ? 'default' : 'outline'}
                className={`cursor-pointer transition-colors whitespace-nowrap ${
                  selectedFilter === 'top-stories'
                    ? ''
                    : 'hover:bg-secondary'
                }`}
                onClick={() => setSelectedFilter('top-stories')}
              >
                Top Stories
              </Badge>
              {issueCategories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedFilter === category.id ? 'default' : 'outline'}
                  className={`cursor-pointer transition-colors whitespace-nowrap ${
                    selectedFilter === category.id
                      ? ''
                      : 'hover:bg-secondary'
                  }`}
                  onClick={() => setSelectedFilter(category.id)}
                >
                  {category.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="md:snap-none snap-y snap-mandatory md:overflow-visible md:pb-8">
        {/* Mission Card - First in the flow */}
        <div className="md:mb-8 md:px-4 snap-start md:snap-none md:h-auto md:min-h-0 flex items-start pt-4 md:items-center md:pt-0 md:block">
          <Card className="relative my-2 md:my-0 w-full md:w-full overflow-hidden md:h-auto">
            <CardContent className="pt-6 pb-6 pr-6 h-full flex flex-col justify-center">
              <h2 className="text-xl font-bold mb-4">Our mission</h2>
              <p className="text-muted-foreground mb-4">
                eGutenberg Press is a serious platform built to help you make a real difference. Your messages go directly to your representatives—unlike social media, your voice here has measurable impact.
              </p>
              <p className="text-muted-foreground mb-4">
                Advocacy groups and organizations support this tool, but to be heard you must be a registered voter. Signing up is quick and simple.
              </p>
              <p className="text-muted-foreground mb-6">
                Ready to act?
              </p>

              <div className="flex items-center gap-4">
                <Button asChild>
                  <Link href="/signup">
                    Get Started
                  </Link>
                </Button>

                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* News Stories and Campaign Cards */}
        {filteredStories.map((item, index) => {
          if (item.type === 'campaign') {
            // Campaign Card
            const isSupport = item.position === 'Support';
            const badgeVariant = isSupport ? 'default' : 'destructive';
            const PositionIcon = isSupport ? ThumbsUp : ThumbsDown;

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

                  {/* Desktop Layout - No image, full width content */}
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
                <Card className="relative my-2 md:my-0 w-full md:w-full overflow-hidden md:h-auto">
                  {/* Mobile Layout - Image on top */}
                  <div className="md:hidden">
                    <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <div className="text-muted-foreground/50 text-sm">News Image</div>
                    </div>
                    <CardContent className="p-6">
                      <Link href={`/issues/${convertCategoryToSlug(item.category)}`}>
                        <Badge variant="secondary" className="mb-2 w-fit text-xs px-2 py-1 hover:bg-secondary/80 transition-colors cursor-pointer">{item.category}</Badge>
                      </Link>
                      <h3 className="text-lg font-bold mb-3 line-clamp-2">{item.headline}</h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <Button size="sm" variant="outline" className="text-xs">
                          Voice Opinion
                        </Button>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </div>

                  {/* Desktop Layout - Image left, content right */}
                  <div className="hidden md:flex h-64">
                    <div className="w-64 h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                      <div className="text-muted-foreground/50 text-sm">News Image</div>
                    </div>
                    <CardContent className="flex-1 p-6">
                      <Link href={`/issues/${convertCategoryToSlug(item.category)}`}>
                        <Badge variant="secondary" className="mb-2 w-fit text-xs px-2 py-1 hover:bg-secondary/80 transition-colors cursor-pointer">{item.category}</Badge>
                      </Link>
                      <h3 className="text-lg font-bold mb-3 line-clamp-2">{item.headline}</h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <Button size="sm" variant="outline" className="text-xs">
                          Voice Opinion
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
  );
}