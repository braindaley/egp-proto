
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Congress } from '@/types';

export function CongressSelector({ congresses }: { congresses: Congress[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCongress = searchParams.get('congress') || '119';

  const handleValueChange = (congressNumber: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('congress', congressNumber);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Ensure congresses is an array before mapping
  if (!Array.isArray(congresses)) {
    return null; // or a loading skeleton
  }

  return (
    <div className="flex items-center gap-2">
      <Select onValueChange={handleValueChange} defaultValue={currentCongress}>
        <SelectTrigger className="w-[180px] h-9 text-xs">
          <SelectValue placeholder="Select Congress" />
        </SelectTrigger>
        <SelectContent>
          {congresses
            .filter(congress => congress && congress.number) // Filter out null/undefined congress or those without a number
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
