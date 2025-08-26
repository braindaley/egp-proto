'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link as LinkIcon, Edit, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  billNumber: string;
  billType: string;
  congress: string;
  billTitle: string;
  stance: 'support' | 'oppose';
  position: string;
  groupSlug: string;
  groupName: string;
  createdAt: any;
}

const advocacyGroups = [
    { name: 'League of Women Voters', slug: 'league-of-women-voters' },
    { name: 'Brennan Center for Justice', slug: 'brennan-center-for-justice' },
    { name: 'Common Cause', slug: 'common-cause' },
    { name: 'Fair Elections Center', slug: 'fair-elections-center' },
    { name: 'FairVote', slug: 'fairvote' },
    { name: 'Vote Smart', slug: 'vote-smart' },
    { name: 'VoteRiders', slug: 'voteriders' },
    { name: 'Rock the Vote', slug: 'rock-the-vote' },
    { name: 'Mi Familia Vota', slug: 'mi-familia-vota' },
    { name: 'Black Voters Matter', slug: 'black-voters-matter' },
    { name: 'When We All Vote', slug: 'when-we-all-vote' },
    { name: 'Fair Fight Action', slug: 'fair-fight-action' },
    { name: 'Campaign Legal Center', slug: 'campaign-legal-center' },
    { name: 'BallotReady', slug: 'ballotready' },
    { name: 'Democracy Works (TurboVote)', slug: 'democracy-works-turbovote' },
    { name: 'HeadCount', slug: 'headcount' },
    { name: 'State Voices', slug: 'state-voices' },
    { name: 'Asian Americans Advancing Justice', slug: 'asian-americans-advancing-justice' },
    { name: 'NAACP Legal Defense Fund', slug: 'naacp-legal-defense-fund' },
    { name: 'Voto Latino', slug: 'voto-latino' },
    { name: 'Alliance for Youth Action', slug: 'alliance-for-youth-action' },
    { name: 'National Vote at Home Institute', slug: 'national-vote-at-home-institute' },
    { name: 'National Voter Registration Day', slug: 'national-voter-registration-day' },
    { name: 'Democracy NC', slug: 'democracy-nc' },
    { name: 'The Civics Center', slug: 'the-civics-center' },
    { name: 'No Labels', slug: 'no-labels' },
].sort((a, b) => a.name.localeCompare(b.name));

const Campaigns: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [groupName, setGroupName] = useState<string>('');

  // Load saved group selection from localStorage
  useEffect(() => {
    const savedGroup = localStorage.getItem('dashboard-selected-group');
    if (savedGroup) {
      setSelectedGroup(savedGroup);
      const group = advocacyGroups.find(g => g.slug === savedGroup);
      if (group) {
        setGroupName(group.name);
      }
    }
  }, []);

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user || !selectedGroup) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        // Fetch campaigns from database API
        const response = await fetch(`/api/campaigns/public?groupSlug=${selectedGroup}&limit=10`);
        
        if (response.ok) {
          const { campaigns: dbCampaigns } = await response.json();
          
          const formattedCampaigns: Campaign[] = dbCampaigns.map((campaign: any) => ({
            id: campaign.id,
            name: campaign.billTitle || `${campaign.billType} ${campaign.billNumber}`,
            billNumber: campaign.billNumber || '',
            billType: campaign.billType || '',
            congress: String(campaign.congress || 119),
            billTitle: campaign.billTitle || '',
            stance: campaign.position?.toLowerCase() as 'support' | 'oppose',
            position: campaign.position,
            groupSlug: campaign.groupSlug,
            groupName: campaign.groupName,
            createdAt: new Date(campaign.createdAt || Date.now())
          }));
          
          setCampaigns(formattedCampaigns);
        } else {
          setCampaigns([]);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user, selectedGroup]);

  if (!user) {
    return null;
  }

  const truncateTitle = (title: string, maxLength: number = 40) => {
    if (title.length <= maxLength) return title;
    return `${title.substring(0, maxLength)}...`;
  };

  const getBillUrl = (campaign: Campaign) => {
    return `/bills/${campaign.congress}/${campaign.billType.toLowerCase()}/${campaign.billNumber}`;
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-lg">
            {groupName ? `${groupName} Campaigns` : 'Campaigns'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!selectedGroup ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Select a group in dashboard to view campaigns</p>
            <Link 
              href="/dashboard/campaigns" 
              className="text-sm text-primary hover:text-primary/80 inline-flex items-center gap-1"
            >
              Go to campaigns dashboard
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : campaigns.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">No campaigns yet for {groupName}</p>
            <Link 
              href={`/dashboard/campaigns/create?group=${selectedGroup}`}
              className="text-sm text-primary hover:text-primary/80 inline-flex items-center gap-1"
            >
              Create your first campaign
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <>
            {campaigns.slice(0, 5).map((campaign) => (
              <div key={campaign.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {campaign.billType} {campaign.billNumber}
                    </span>
                    <Badge 
                      variant={campaign.position === 'Support' ? 'default' : 'destructive'} 
                      className="text-xs px-2 py-0.5"
                    >
                      {campaign.position || campaign.stance}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={getBillUrl(campaign)}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title="View bill"
                      >
                        <LinkIcon className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/campaigns/edit/${campaign.id}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title="Edit campaign"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {truncateTitle(campaign.billTitle || campaign.name)}
                </p>
              </div>
            ))}
            
            <Link 
              href="/dashboard/campaigns" 
              className="flex items-center justify-between text-sm text-primary hover:text-primary/80 pt-2 border-t"
            >
              <span>Manage campaigns</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Campaigns;