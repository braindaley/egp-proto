import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Bill } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
    if (type === 'sconres') return 'sconres';
    return type.replace(/\s/g, '');
}

export function getBillTypeSlug(billType: string): string {
    if (!billType) {
        return '';
    }
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

export function formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    // Use UTC to prevent hydration errors from timezone differences
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
}
  
export function constructBillUrl(bill: Bill): string {
    const chamber = bill.originChamber.toLowerCase();
    const billTypeSlug = getBillTypeSlug(bill.type);
    return `https://www.congress.gov/bill/${bill.congress}th-congress/${chamber}-bill/${bill.number}`;
}