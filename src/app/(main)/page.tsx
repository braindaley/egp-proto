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
import { X, ChevronDown, Eye } from 'lucide-react';
import Link from 'next/link';
import { SITE_ISSUE_CATEGORIES } from '@/lib/policy-area-mapping';

export default function Home() {
  const [showCard, setShowCard] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('for-you');

  // Mock news stories data
  const newsStories = [
    {
      id: 1,
      headline: "Climate Action Bill HR-3838 Gains Bipartisan Support as Environmental Groups Rally",
      description: "The landmark climate legislation promises to reduce carbon emissions by 50% over the next decade while creating millions of green jobs across the country. Environmental advocates are calling it the most significant climate action in decades.",
      image: "/api/placeholder/400/400",
      category: "Climate & Environment"
    },
    {
      id: 2,
      headline: "Voting Rights Act HR-14 Faces Critical Vote This Week",
      description: "The For the People Act aims to expand voter access, end gerrymandering, and reduce the influence of money in politics. Civil rights organizations are mobilizing unprecedented support for the legislation.",
      image: "/api/placeholder/400/400",
      category: "Democracy & Voting"
    },
    {
      id: 3,
      headline: "Healthcare Reform Bill Proposes Universal Coverage Expansion",
      description: "New legislation would lower prescription drug costs and expand Medicare eligibility to Americans over 60. Healthcare advocacy groups are pushing for swift passage before the congressional recess.",
      image: "/api/placeholder/400/400",
      category: "Healthcare"
    },
    {
      id: 4,
      headline: "Immigration Reform Bill Offers Path to Citizenship for Dreamers",
      description: "The comprehensive immigration bill would provide a pathway to citizenship for undocumented immigrants brought to the US as children. Immigration rights groups are organizing grassroots campaigns nationwide.",
      image: "/api/placeholder/400/400",
      category: "Immigration"
    },
    {
      id: 5,
      headline: "Gun Safety Legislation Includes Universal Background Checks",
      description: "The Bipartisan Safer Communities Act expands background check requirements and increases funding for mental health programs. Gun violence prevention advocates see this as a critical first step.",
      image: "/api/placeholder/400/400",
      category: "Gun Safety"
    },
    {
      id: 6,
      headline: "Affordable Housing Bill Targets National Housing Crisis",
      description: "New legislation would invest $100 billion in affordable housing construction and rental assistance programs. Housing advocates argue this could help millions of families achieve stable housing.",
      image: "/api/placeholder/400/400",
      category: "Housing"
    },
    {
      id: 7,
      headline: "Education Funding Bill Proposes Free Community College",
      description: "The America's College Promise Act would make community college tuition-free for all students. Education groups are mobilizing students and families to contact their representatives.",
      image: "/api/placeholder/400/400",
      category: "Education"
    },
    {
      id: 8,
      headline: "Criminal Justice Reform Focuses on Sentencing Disparities",
      description: "The FIRST STEP Act expansion would address racial disparities in sentencing and increase rehabilitation programs. Criminal justice reform advocates are pushing for broader support.",
      image: "/api/placeholder/400/400",
      category: "Criminal Justice"
    },
    {
      id: 9,
      headline: "Infrastructure Bill Includes Broadband Access for Rural Areas",
      description: "The bipartisan infrastructure package allocates $65 billion to expand high-speed internet access in underserved communities. Rural advocacy groups are celebrating the investment.",
      image: "/api/placeholder/400/400",
      category: "Infrastructure"
    },
    {
      id: 10,
      headline: "Tax Reform Bill Targets Corporate Tax Avoidance",
      description: "New legislation would close tax loopholes used by multinational corporations and increase funding for the IRS. Tax justice advocates argue this could generate billions in revenue.",
      image: "/api/placeholder/400/400",
      category: "Tax Policy"
    }
  ];

  // Prepare issue categories for dropdown
  const issueCategories = SITE_ISSUE_CATEGORIES.map(category => ({
    id: category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
    label: category
  }));

  // Find the label for the selected filter
  const getFilterLabel = (filterId: string) => {
    if (filterId === 'for-you') return 'For You';
    if (filterId === 'top-stories') return 'Top Stories';
    const issue = issueCategories.find(cat => cat.id === filterId);
    return issue?.label || 'Issues';
  };

  return (
    <div
      className="relative"
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
      <div
        className="md:snap-none snap-y snap-mandatory overflow-y-auto md:overflow-visible md:pb-8"
        style={{
          height: 'calc(100vh - 57px)', // Subtract the height of the badge filter bar (mobile only)
          padding: 0
        }}
      >
        {/* Mission Card - First in the flow */}
        <div className="md:mb-8 md:px-4 snap-start md:snap-none h-[calc(100vh-180px)] md:h-auto md:min-h-0 flex items-start pt-4 md:items-center md:pt-0 md:block">
          <Card className="relative mx-4 my-2 md:mx-0 md:my-0 w-[calc(100%-2rem)] md:w-full overflow-hidden h-[608px] md:h-auto">
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

        {/* News Stories */}
        {newsStories.map((story, index) => (
          <div key={story.id} className="md:mb-8 md:px-4 snap-start md:snap-none h-[calc(100vh-180px)] md:h-auto md:min-h-0 flex items-start pt-4 md:items-center md:pt-0 md:block">
            <Card className="relative mx-4 my-2 md:mx-0 md:my-0 w-[calc(100%-2rem)] md:w-full overflow-hidden md:h-auto">
              {/* Mobile Layout - Image on top */}
              <div className="md:hidden">
                <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <div className="text-muted-foreground/50 text-sm">News Image</div>
                </div>
                <CardContent className="p-6">
                  <div className="text-xs text-muted-foreground mb-2">{story.category}</div>
                  <h3 className="text-lg font-bold mb-3 line-clamp-2">{story.headline}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{story.description}</p>
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
                  <div className="text-xs text-muted-foreground mb-2">{story.category}</div>
                  <h3 className="text-lg font-bold mb-3 line-clamp-2">{story.headline}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{story.description}</p>
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
        ))}
      </div>
    </div>
  );
}