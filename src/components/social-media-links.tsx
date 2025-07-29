'use client';
import { useEffect, useState } from 'react';
import { Twitter, Facebook, Youtube, Instagram, Loader2 } from 'lucide-react';
import type { SocialMedia } from '@/types';
import { Button } from './ui/button';

const socialMediaCache = new Map<string, SocialMedia[]>();

async function getSocialMediaData(): Promise<SocialMedia[]> {
  if (socialMediaCache.has('all')) {
    return socialMediaCache.get('all')!;
  }
  try {
    const res = await fetch('https://unitedstates.github.io/congress-legislators/legislators-social-media.json');
    if (!res.ok) {
      throw new Error('Failed to fetch social media data');
    }
    const data = await res.json();
    socialMediaCache.set('all', data);
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

const SocialIcon = ({ platform, handle }: { platform: 'twitter' | 'facebook' | 'youtube' | 'instagram'; handle: string }) => {
  const platforms = {
    twitter: {
      icon: <Twitter className="h-4 w-4" />,
      url: `https://twitter.com/${handle}`,
    },
    facebook: {
      icon: <Facebook className="h-4 w-4" />,
      url: `https://facebook.com/${handle}`,
    },
    youtube: {
      icon: <Youtube className="h-4 w-4" />,
      url: `https://youtube.com/user/${handle}`,
    },
    instagram: {
      icon: <Instagram className="h-4 w-4" />,
      url: `https://instagram.com/${handle}`,
    },
  };

  const platformInfo = platforms[platform];

  return (
    <Button asChild variant="outline" size="icon" className="h-8 w-8">
      <a href={platformInfo.url} target="_blank" rel="noopener noreferrer" aria-label={`Link to ${platform}`}>
        {platformInfo.icon}
      </a>
    </Button>
  );
};

export function SocialMediaLinks({ bioguideId }: { bioguideId: string }) {
  const [socials, setSocials] = useState<SocialMedia | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndSetSocials = async () => {
      setIsLoading(true);
      const allSocials = await getSocialMediaData();
      const memberSocials = allSocials.find(s => s.bioguide === bioguideId);
      setSocials(memberSocials || null);
      setIsLoading(false);
    };

    fetchAndSetSocials();
  }, [bioguideId]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading socials...</span>
      </div>
    );
  }

  if (!socials) {
    return null;
  }

  const hasSocials = socials.twitter || socials.facebook || socials.youtube || socials.instagram;

  if (!hasSocials) {
    return null;
  }
  
  return (
    <div className="pt-3 border-t">
       <h4 className="text-sm font-medium mb-2">Social Media</h4>
      <div className="flex gap-2">
        {socials.twitter && <SocialIcon platform="twitter" handle={socials.twitter} />}
        {socials.facebook && <SocialIcon platform="facebook" handle={socials.facebook} />}
        {socials.youtube && <SocialIcon platform="youtube" handle={socials.youtube} />}
        {socials.instagram && <SocialIcon platform="instagram" handle={socials.instagram} />}
      </div>
    </div>
  );
}
