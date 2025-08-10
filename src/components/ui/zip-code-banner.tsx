
'use client';

import { useState, useEffect } from 'react';
import { useZipCode } from '@/hooks/use-zip-code';
import { Button } from './button';
import { Input } from './input';
import { X } from 'lucide-react';

export function ZipCodeBanner() {
  const { zipCode, saveZipCode } = useZipCode();
  const [inputZip, setInputZip] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show banner only if zipCode is not set after initial check
    const timer = setTimeout(() => {
        if (!zipCode) {
            setIsVisible(true);
        }
    }, 1000); // Wait 1 second to avoid flash on load
    return () => clearTimeout(timer);
  }, [zipCode]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^\d{5}$/.test(inputZip)) {
      saveZipCode(inputZip);
      setIsVisible(false);
    } else {
      alert('Please enter a valid 5-digit zip code.');
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 flex justify-center items-center z-50">
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <label htmlFor="zip-banner-input" className="text-sm font-medium mr-2 hidden sm:inline">Find your representatives:</label>
        <Input
          id="zip-banner-input"
          type="text"
          value={inputZip}
          onChange={(e) => setInputZip(e.target.value)}
          placeholder="Enter your 5-digit ZIP code"
          className="text-black max-w-[240px]"
          aria-label="Enter your 5-digit ZIP code"
        />
        <Button type="submit">Submit</Button>
      </form>
       <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-4 text-gray-400 hover:text-white"
          onClick={() => setIsVisible(false)}
          aria-label="Close ZIP code banner"
        >
          <X className="h-5 w-5" />
        </Button>
    </div>
  );
}
