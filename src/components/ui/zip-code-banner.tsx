"use client";

import { useState } from 'react';
import { useZipCode } from '@/hooks/use-zip-code';
import { Button } from './button';
import { Input } from './input';

export function ZipCodeBanner() {
  const { zipCode, saveZipCode } = useZipCode();
  const [inputZip, setInputZip] = useState('');
  const [isVisible, setIsVisible] = useState(!zipCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^\d{5}$/.test(inputZip)) {
      saveZipCode(inputZip);
      setIsVisible(false);
    } else {
      // Handle invalid zip code
      alert('Please enter a valid 5-digit zip code.');
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 flex justify-center items-center z-50">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={inputZip}
          onChange={(e) => setInputZip(e.target.value)}
          placeholder="Enter your 5-digit ZIP code"
          className="text-black"
        />
        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
}
