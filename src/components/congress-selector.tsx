
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

  if (!Array.isArray(congresses) || congresses.length === 0) {
    return (
        <div className="w-[180px] h-9 text-xs flex items-center justify-center bg-muted rounded-md">
            Loading...
        </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select onValueChange={handleValueChange} defaultValue={currentCongress}>
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
