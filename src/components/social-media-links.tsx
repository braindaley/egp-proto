'use client';
import { useEffect, useState } from 'react';
import { Twitter, Facebook, Youtube, Instagram, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface SocialMediaRecord {
  id: {
    bioguide: string;
    thomas?: string;
    govtrack?: number;
  };
  social: {
    twitter?: string;
    facebook?: string;
    youtube?: string;
    instagram?: string;
    youtube_id?: string;
    twitter_id?: string;
  };
}

const socialMediaCache = new Map<string, SocialMediaRecord[]>();

async function getSocialMediaData(): Promise<SocialMediaRecord[]> {
  if (socialMediaCache.has('all')) {
    return socialMediaCache.get('all')!;
  }
  
  try {
    const res = await fetch('https://unitedstates.github.io/congress-legislators/legislators-social-media.json');
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    socialMediaCache.set('all', data);
    return data;
  } catch (error) {
    console.error('Error fetching social media data:', error);
    return [];
  }
}

const SocialIcon = ({ platform, handle }: { platform: 'twitter' | 'facebook' | 'youtube' | 'instagram'; handle: string }) => {
  const platforms = {
    twitter: {
      icon: <Twitter className="h-4 w-4" />,
      url: `https://twitter.com/${handle}`,
      label: 'Twitter'
    },
    facebook: {
      icon: <Facebook className="h-4 w-4" />,
      url: `https://facebook.com/${handle}`,
      label: 'Facebook'
    },
    youtube: {
      icon: <Youtube className="h-4 w-4" />,
      url: `https://youtube.com/user/${handle}`,
      label: 'YouTube'
    },
    instagram: {
      icon: <Instagram className="h-4 w-4" />,
      url: `https://instagram.com/${handle}`,
      label: 'Instagram'
    },
  };

  const platformInfo = platforms[platform];

  return (
    <Button asChild variant="outline" size="icon" className="h-8 w-8">
      <a 
        href={platformInfo.url} 
        target="_blank" 
        rel="noopener noreferrer" 
        aria-label={`${platformInfo.label} profile`}
        title={`@${handle} on ${platformInfo.label}`}
      >
        {platformInfo.icon}
      </a>
    </Button>
  );
};

export function SocialMediaLinks({ bioguideId }: { bioguideId: string }) {
  const [socials, setSocials] = useState<SocialMediaRecord['social'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndSetSocials = async () => {
      setIsLoading(true);
      
      try {
        const allSocials = await getSocialMediaData();
        const memberRecord = allSocials.find(record => record.id?.bioguide === bioguideId);
        setSocials(memberRecord?.social || null);
      } catch (error) {
        console.error('Error loading social media:', error);
        setSocials(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (bioguideId) {
      fetchAndSetSocials();
    } else {
      setIsLoading(false);
    }
  }, [bioguideId]);

  if (isLoading) {
    return (
      <div className="pt-3 border-t">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading social media...</span>
        </div>
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