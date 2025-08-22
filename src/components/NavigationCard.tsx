'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Home, MessageSquare, Users, User, FileText, Building } from 'lucide-react';

const NavigationCard: React.FC = () => {
  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Profile', icon: User },
    { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
    { href: '/bills', label: 'Bills', icon: FileText },
    { href: '/congress/119/states', label: 'Congress Members', icon: Users },
    { href: '/congress/119/committees', label: 'Committees', icon: Building },
    { href: '/groups', label: 'Groups', icon: Users },
  ];

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Navigation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default NavigationCard;