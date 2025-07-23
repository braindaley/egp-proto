import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBillTypeSlug(billType: string): string {
    const type = billType.toLowerCase().replace(/\./g, '');
    if (type === 'hr') return 'hr';
    if (type === 's') return 's';
    if (type === 'hres') return 'hres';
    if (type === 'sres') return 'sres';
    if (type === 'hjres') return 'hjres';
    if (type === 'sjres') return 'sjres';
    if (type === 'hconres') return 'hconres';
    if (type === 'sconres') return 'sconres';
    return type.replace(/\s/g, '');
}
