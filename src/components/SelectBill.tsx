
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

interface Bill {
  number: string;
  type: string;
  congress: number;
  title: string;
}

const SelectBill: React.FC = () => {
  const [featuredBills, setFeaturedBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchFeaturedBills = async () => {
      // In a real app, you'd fetch this from an API
      setFeaturedBills([
        { number: '14', type: 'HR', congress: 119, title: 'To amend the Internal Revenue Code of 1986 to provide for a carbon tax.' },
        { number: '22', type: 'HR', congress: 119, title: 'To require proof of citizenship for voter registration.' },
        { number: '1', type: 'S', congress: 118, title: 'A bill to provide for the general welfare by establishing a system of Federal old-age benefits.' },
      ]);
    };
    fetchFeaturedBills();
  }, []);

  const handleSelectBill = () => {
    if (selectedBill) {
      const [congress, type, number] = selectedBill.split('-');
      router.push(`/advocacy-message?congress=${congress}&type=${type}&number=${number}&verified=true`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a Bill to Discuss</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup onValueChange={setSelectedBill}>
          <div className="space-y-4">
            {featuredBills.map((bill) => (
              <Label
                key={`${bill.congress}-${bill.type}-${bill.number}`}
                className="flex items-start p-4 border rounded-md cursor-pointer hover:bg-secondary/50"
              >
                <RadioGroupItem value={`${bill.congress}-${bill.type}-${bill.number}`} className="mr-4 mt-1" />
                <div>
                  <p className="font-semibold">{bill.type} {bill.number}: {bill.title}</p>
                  <p className="text-sm text-muted-foreground">{bill.congress}th Congress</p>
                </div>
              </Label>
            ))}
          </div>
        </RadioGroup>
        <div className="flex justify-end mt-6">
          <Button onClick={handleSelectBill} disabled={!selectedBill}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SelectBill;
