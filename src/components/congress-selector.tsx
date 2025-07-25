
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';

export function CongressSelector() {
  const { congresses, selectedCongress, setSelectedCongress } = useAuth();
  
  const handleValueChange = (congressNumber: string) => {
    setSelectedCongress(congressNumber);
  };

  if (!congresses || congresses.length === 0) {
    return (
        <div className="w-[180px] h-9 text-xs flex items-center justify-center bg-muted rounded-md">
            Loading...
        </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select onValueChange={handleValueChange} value={selectedCongress}>
        <SelectTrigger className="w-[180px] h-9 text-xs">
          <SelectValue placeholder="Select Congress" />
        </SelectTrigger>
        <SelectContent>
          {congresses
            .filter(congress => congress && congress.number)
            .map((congress) => (
              <SelectItem key={congress.number} value={congress.number.toString()}>
                {congress.name}
              </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
