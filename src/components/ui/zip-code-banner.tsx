
'use client';

import { useZipCode } from '@/hooks/useZipCode';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ZipCodeChanger } from '@/components/ZipCodeManager';
import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ZipCodeBanner() {
    const { zipCode } = useZipCode();
    const [isVisible, setIsVisible] = useState(false);

    // This effect prevents the banner from flashing on initial load
    // before the zip code has had a chance to be set from storage or auto-detection.
    useEffect(() => {
        const timer = setTimeout(() => {
            if (zipCode === null) {
                setIsVisible(true);
            }
        }, 500); // Wait a moment before showing

        // If zipCode gets a value, hide the banner immediately
        if (zipCode !== null) {
            setIsVisible(false);
        }

        return () => clearTimeout(timer);
    }, [zipCode]);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-2">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Set Your Location</AlertTitle>
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <p className="mb-2 sm:mb-0">To see representatives for your area, please set your zip code.</p>
                    <div className="w-full sm:w-48">
                      <ZipCodeChanger />
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    );
}
