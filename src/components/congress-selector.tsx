
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePathname, useRouter } from 'next/navigation';
import type { Congress } from '@/types';

interface CongressSelectorProps {
    congresses: Congress[];
    selectedCongress: string;
    setSelectedCongress: (congress: string) => void;
}

export function CongressSelector({ congresses, selectedCongress, setSelectedCongress }: CongressSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const handleValueChange = (congressNumber: string) => {
    setSelectedCongress(congressNumber);

    // Check if the current path is a congress-specific page
    const pathSegments = pathname.split('/');
    if ((pathSegments[1] === 'bill' || pathSegments[1] === 'congress') && pathSegments.length > 2 && /^\d+$/.test(pathSegments[2])) {
      // Reconstruct the URL with the new congress number
      pathSegments[2] = congressNumber;
      const newPath = pathSegments.join('/');
      router.push(newPath);
    }
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
