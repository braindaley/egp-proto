
'use client';

import React from 'react';
import MessageHistory from '@/components/dashboard/MessageHistory';
import BillStatusTracker from '@/components/dashboard/BillStatusTracker';
import AdvocacyAnalytics from '@/components/dashboard/AdvocacyAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const UserDashboardPage = () => {
  // Mock user ID for demonstration
  const userId = 'user_12345';

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8" style={{ backgroundColor: '#E6E6FA' }}>
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold" style={{ color: '#4B0082', fontFamily: 'Poppins, sans-serif' }}>
          Your Advocacy Dashboard
        </h1>
        <p className="text-lg" style={{ color: '#4B0082', fontFamily: 'PT Sans, sans-serif' }}>
          Track your impact, monitor bill progress, and view your message history.
        </p>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-3" style={{ borderColor: '#8F00FF' }}>
          <TabsTrigger value="history" style={{ fontFamily: 'Poppins, sans-serif' }}>Message History</TabsTrigger>
          <TabsTrigger value="tracking" style={{ fontFamily: 'Poppins, sans-serif' }}>Bill Status Tracking</TabsTrigger>
          <TabsTrigger value="analytics" style={{ fontFamily: 'Poppins, sans-serif' }}>Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <MessageHistory userId={userId} />
        </TabsContent>
        <TabsContent value="tracking">
          <BillStatusTracker userId={userId} />
        </TabsContent>
        <TabsContent value="analytics">
          <AdvocacyAnalytics userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserDashboardPage;
