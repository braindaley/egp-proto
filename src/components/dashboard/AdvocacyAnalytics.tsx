
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AdvocacyAnalyticsProps {
  userId: string;
}

const AdvocacyAnalytics: React.FC<AdvocacyAnalyticsProps> = ({ userId }) => {
  const [analyticsData, setAnalyticsData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Mock analytics data
    const mockData = {
      activity: [
        { month: 'Jan', sent: 5 },
        { month: 'Feb', sent: 8 },
        { month: 'Mar', sent: 3 },
      ],
      responseRates: [
        { name: 'Email', value: 15 },
        { name: 'Postal', value: 5 },
        { name: 'No Reply', value: 80 },
      ],
      messageEffectiveness: [
        { name: 'Passionate', value: 60 },
        { name: 'Formal', value: 30 },
        { name: 'Personal', value: 10 },
      ],
      repResponsiveness: [
        { name: 'Rep A', score: 85 },
        { name: 'Rep B', score: 60 },
        { name: 'Rep C', score: 92 },
      ]
    };
    setAnalyticsData(mockData);
    setLoading(false);
  }, [userId]);

  const COLORS = ['#4B0082', '#8F00FF', '#E6E6FA'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>Advocacy Activity</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.activity}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sent" fill="#8F00FF" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Response Rates</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={analyticsData.responseRates} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                {analyticsData.responseRates?.map((entry:any, index:number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend/>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Most Effective Message Types</CardTitle></CardHeader>
        <CardContent>
           <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={analyticsData.messageEffectiveness} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#82ca9d" paddingAngle={5} label>
                 {analyticsData.messageEffectiveness?.map((entry:any, index:number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend/>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
       <Card>
        <CardHeader><CardTitle>Representative Responsiveness</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.repResponsiveness} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={60}/>
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#4B0082" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvocacyAnalytics;
