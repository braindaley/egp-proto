'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { LucideIcon, ChevronRight } from 'lucide-react';

interface LoggedOutCardProps {
  headline: string;
  helperText: string;
  buttonText?: string;
  buttonHref?: string;
  showZipCodeField?: boolean;
  onFindOfficials?: (zipCode: string) => void;
  icon?: LucideIcon;
  showAsLink?: boolean;
  useTextLink?: boolean;
}

export const LoggedOutCard: React.FC<LoggedOutCardProps> = ({
  headline,
  helperText,
  buttonText,
  buttonHref = '/login',
  showZipCodeField = false,
  onFindOfficials,
  icon: Icon,
  showAsLink = false,
  useTextLink = false
}) => {
  const [zipCode, setZipCode] = React.useState('');

  const handleFindOfficials = () => {
    if (onFindOfficials && zipCode) {
      onFindOfficials(zipCode);
    }
  };

  if (showAsLink && Icon) {
    return (
      <Link href={buttonHref}>
        <Card className="h-fit hover:bg-secondary/50 transition-colors cursor-pointer">
          <CardHeader className="pb-3">
            <Icon className="h-8 w-8 text-muted-foreground mb-2" />
            <CardTitle className="text-lg">{headline}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{helperText}</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        {Icon && <Icon className="h-8 w-8 text-muted-foreground mb-2" />}
        <CardTitle className="text-lg">{headline}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{helperText}</p>
        
        {showZipCodeField && (
          <div className="space-y-2">
            <Input 
              type="text" 
              placeholder="Zip code" 
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="w-full"
            />
            <Button 
              onClick={handleFindOfficials} 
              className="w-full"
              variant="outline"
              disabled={!zipCode}
            >
              {buttonText || 'Find'}
            </Button>
          </div>
        )}
        
        {buttonText && !showZipCodeField && (
          useTextLink ? (
            <div className="pt-3 border-t">
              <Link href={buttonHref} className="flex items-center justify-between text-sm hover:bg-secondary/50 -mx-6 px-6 py-2 transition-colors">
                <span>{buttonText}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          ) : (
            <Link href={buttonHref}>
              <Button className="w-full" variant="outline">{buttonText}</Button>
            </Link>
          )
        )}
      </CardContent>
    </Card>
  );
};