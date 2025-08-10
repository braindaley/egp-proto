
'use client';

import { useState, useEffect } from 'react';
import { useZipCode } from '@/hooks/use-zip-code';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { MapPin } from 'lucide-react';

// This is the primary component for MANUALLY changing the zip code.
// All automatic detection has been removed.
export const ZipCodeChanger = () => {
    const { zipCode, setZipCode } = useZipCode();
    const [localZip, setLocalZip] = useState(zipCode || "");
    const [isOpen, setIsOpen] = useState(false);

    // When the global zip code changes, update the local input
    useEffect(() => {
        if (zipCode) {
            setLocalZip(zipCode);
        }
    }, [zipCode]);

    const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalZip(e.target.value);
    };

    const handleUpdate = () => {
        if (localZip) {
            setZipCode(localZip);
            setIsOpen(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                    <MapPin className="mr-2 h-4 w-4 flex-shrink-0" /> 
                    <span className="truncate">
                        {zipCode ? `Zip: ${zipCode}` : 'Set Zip Code'}
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Your Location</DialogTitle>
                    <DialogDescription>
                        To find your elected officials, please provide your zip code.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="flex items-end gap-2">
                        <div className="flex-grow">
                            <Label htmlFor="zip-code">Zip Code</Label>
                            <Input
                                id="zip-code"
                                type="text"
                                value={localZip}
                                onChange={handleManualChange}
                                placeholder="Enter zip code"
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                            />
                        </div>
                        <Button onClick={handleUpdate}>
                            Update
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
