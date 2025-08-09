
'use client';

import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

const ZipCodeManager: React.FC = () => {
  const [zipCode, setZipCode] = useState<string>('');
  const [status, setStatus] = useState<string>('Detecting location...');

  const fetchZipCode = (latitude: number, longitude: number) => {
    // Using a free reverse geocoding API
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
      .then(response => response.json())
      .then(data => {
        if (data.postcode) {
          setZipCode(data.postcode);
          setStatus('Location detected.');
        } else {
          setStatus('Could not determine zip code. Please enter it manually.');
        }
      })
      .catch(error => {
        console.error('Error fetching zip code:', error);
        setStatus('Could not determine zip code. Please enter it manually.');
      });
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      setStatus('Detecting location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchZipCode(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setStatus('Geolocation failed. Please enter your zip code manually.');
        }
      );
    } else {
      setStatus("Geolocation is not supported by this browser.");
    }
  };
  
  useEffect(() => {
    handleDetectLocation();
  }, []);

  return (
    <div className="space-y-4">
       <div>
        <h3 className="text-lg font-medium">Your Location</h3>
        <p className="text-sm text-muted-foreground">
          Your zip code helps us find your elected officials.
        </p>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-grow">
            <Label htmlFor="zip-code">Zip Code</Label>
            <Input
                id="zip-code"
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Enter your zip code"
            />
        </div>
        <Button onClick={handleDetectLocation} variant="outline">
            Detect
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{status}</p>
    </div>
  );
};

export default ZipCodeManager;
