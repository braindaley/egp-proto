
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter, useParams } from 'next/navigation';
import type { Congress } from '@/types';

export function CongressSelector({ congresses }: { congresses: Congress[] }) {
  const router = useRouter();
  const params = useParams();

  // The current congress is derived from the URL params if available.
  // We use the latest congress as a fallback.
  const currentCongress = params.congress?.toString() || congresses[0]?.number.toString();

  const handleValueChange = (congressNumber: string) => {
    // Navigate to the new congress-specific bill page
    router.push(`/bill/${congressNumber}`);
  };

  if (!Array.isArray(congresses) || congresses.length === 0) {
    return (
        <div className="w-[180px] h-9 text-xs flex items-center justify-center bg-muted rounded-md">
            Loading...
        </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* The `value` prop makes this a controlled component that reflects the URL */}
      <Select onValueChange={handleValueChange} value={currentCongress}>
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
