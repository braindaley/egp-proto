// Create this as a test file: src/components/social-media-test.tsx
'use client';
import { useEffect, useState } from 'react';

export function SocialMediaTest() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🧪 Testing social media API...');
    fetch('https://unitedstates.github.io/congress-legislators/legislators-social-media.json')
      .then(res => {
        console.log('📡 Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('📊 Total records:', data.length);
        console.log('🔍 First 5 records:', data.slice(0, 5));
        
        // Find some members with social media
        const withSocials = data.filter((item: any) => 
          item.twitter || item.facebook || item.youtube || item.instagram
        ).slice(0, 10);
        
        console.log('📱 Members with social media (first 10):', withSocials);
        setData({ all: data, withSocials });
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Test failed:', err);
        setLoading(false);
      });
  }, []);

  // Test with known bioguide IDs
  const testIds = ['A000374', 'P000197', 'S000148', 'B001230', 'C001117'];

  if (loading) return <div className="p-4 bg-blue-100">Loading test...</div>;

  return (
    <div className="p-4 space-y-4 bg-gray-100">
      <h2 className="text-xl font-bold text-purple-800">🧪 Social Media API Test</h2>
      
      <div className="bg-white p-4 rounded border">
        <h3 className="font-bold mb-2">📊 API Response</h3>
        <p><strong>Total Records:</strong> {data?.all?.length || 0}</p>
        <p><strong>Members with Social:</strong> {data?.withSocials?.length || 0}</p>
      </div>

      <div className="bg-white p-4 rounded border">
        <h3 className="font-bold mb-2">🧪 Test with Known IDs</h3>
        {testIds.map(id => {
          const member = data?.all?.find((m: any) => m.bioguide === id);
          return (
            <div key={id} className="p-2 mb-2 bg-gray-50 rounded">
              <strong>{id}:</strong> {member ? '✅ Found' : '❌ Not found'}
              {member && (
                <div className="text-sm text-gray-600 ml-4">
                  Twitter: {member.twitter || 'None'} | 
                  Facebook: {member.facebook || 'None'} | 
                  YouTube: {member.youtube || 'None'} | 
                  Instagram: {member.instagram || 'None'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data?.withSocials && (
        <div className="bg-white p-4 rounded border">
          <h3 className="font-bold mb-2">📱 Sample Members with Social Media</h3>
          {data.withSocials.slice(0, 5).map((member: any, index: number) => (
            <div key={index} className="p-2 mb-2 bg-green-50 rounded">
              <strong>{member.bioguide}:</strong>
              <div className="text-sm ml-4">
                {member.twitter && `Twitter: @${member.twitter} `}
                {member.facebook && `Facebook: @${member.facebook} `}
                {member.youtube && `YouTube: @${member.youtube} `}
                {member.instagram && `Instagram: @${member.instagram}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}