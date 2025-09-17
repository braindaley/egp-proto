'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { campaignsService } from '@/lib/campaigns';

interface NewsStory {
  id: number;
  headline: string;
  description: string;
  category: string;
  image?: string;
}

interface Bill {
  congress: number;
  number: string;
  type: string;
  title: string;
  url: string;
  updateDate: string;
}

interface HomepageNewsSectionProps {
  newsStories: NewsStory[];
}

export function HomepageNewsSection({ newsStories }: HomepageNewsSectionProps) {
  const [latestBills, setLatestBills] = useState<Bill[]>([]);
  // Mix up the stories to get diverse categories
  // Instead of taking the first 3 (all abortion), let's pick from different positions
  const firstStory = newsStories[4];  // Climate story (index 4)
  const secondStory = newsStories[22]; // Economy story (index 22)
  const thirdStory = newsStories[31];  // Gun Policy story (index 31)

  // Get campaigns for the Recent Campaigns list
  const allCampaigns = campaignsService.getAllCampaigns()
    .filter(campaign => campaign.isActive)
    .slice(0, 10); // Get first 10 campaigns

  // Fetch latest bills
  useEffect(() => {
    const fetchLatestBills = async () => {
      try {
        const response = await fetch('/api/bills/search-cached?limit=10');
        const data = await response.json();
        if (data.bills) {
          setLatestBills(data.bills);
        }
      } catch (error) {
        console.error('Failed to fetch latest bills:', error);
      }
    };

    fetchLatestBills();
  }, []);

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

  // Helper function to truncate text to 3 lines (approximately 150 characters)
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (!newsStories || newsStories.length < 3) {
    return null;
  }

  return (
    <div className="w-full bg-background border-b">
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Column 1: Mission Card - 5 columns */}
          <div className="md:col-span-5">
            <Card className="h-full border-none shadow-none">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <div className="text-muted-foreground/50 text-sm">Mission Image</div>
              </div>
              <CardContent className="p-0 pt-6">
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

          {/* Column 2: Two stacked news stories - 4 columns */}
          <div className="md:col-span-4 space-y-4">
            {secondStory && (
              <Card>
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <div className="text-muted-foreground/50 text-sm">News Image</div>
                </div>
                <CardContent className="p-4">
                  <Link href={`/issues/${convertCategoryToSlug(secondStory.category)}`}>
                    <Badge variant="secondary" className="mb-2 text-xs">{secondStory.category}</Badge>
                  </Link>
                  <h4 className="text-base font-semibold mb-2 line-clamp-2">{secondStory.headline}</h4>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{secondStory.description}</p>
                  <div className="flex items-center justify-between">
                    <Button size="sm" variant="outline" className="text-xs">
                      Voice Opinion
                    </Button>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )}

            {thirdStory && (
              <Card>
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <div className="text-muted-foreground/50 text-sm">News Image</div>
                </div>
                <CardContent className="p-4">
                  <Link href={`/issues/${convertCategoryToSlug(thirdStory.category)}`}>
                    <Badge variant="secondary" className="mb-2 text-xs">{thirdStory.category}</Badge>
                  </Link>
                  <h4 className="text-base font-semibold mb-2 line-clamp-2">{thirdStory.headline}</h4>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{thirdStory.description}</p>
                  <div className="flex items-center justify-between">
                    <Button size="sm" variant="outline" className="text-xs">
                      Voice Opinion
                    </Button>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Column 3: Recent Campaigns and Latest Bills - 3 columns */}
          <div className="md:col-span-3">
            <div className="h-full space-y-6">
              {/* Recent Campaigns */}
              <div>
                <h3 className="text-lg font-bold mb-4">Recent Campaigns</h3>
                <ul className="space-y-2 list-disc list-inside">
                  {allCampaigns.map(campaign => {
                    const isSupport = campaign.position === 'Support';

                    return (
                      <li key={campaign.id} className="text-sm text-muted-foreground">
                        <Link
                          href={`/campaigns/${campaign.groupSlug}/${campaign.bill.type.toLowerCase().replace('.', '')}-${campaign.bill.number}`}
                          className="hover:text-foreground transition-colors"
                        >
                          <span className="ml-[-5px]">
                            <span className="font-medium">{campaign.groupName}</span>{' '}
                            <span className={isSupport ? 'text-green-700' : 'text-red-700'}>
                              {campaign.position.toLowerCase()}s
                            </span>{' '}
                            {campaign.bill.type} {campaign.bill.number}: {truncateText(campaign.bill.title || '', 60)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Latest Bills */}
              <div>
                <h3 className="text-lg font-bold mb-4">Latest Bills</h3>
                <ul className="space-y-2 list-disc list-inside">
                  {latestBills.map((bill, index) => (
                    <li key={`${bill.type}-${bill.number}-${index}`} className="text-sm text-muted-foreground">
                      <Link
                        href={bill.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        <span className="ml-[-5px]">
                          <span className="font-medium">{bill.type} {bill.number}</span>: {truncateText(bill.title, 80)}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {latestBills.length === 0 && (
                    <li className="text-sm text-muted-foreground/50">Loading latest bills...</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}