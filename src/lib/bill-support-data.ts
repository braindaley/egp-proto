/**
 * Mock data for bill supporter and opponent counts
 * Uses consistent seeded values based on bill identifiers
 */

interface BillSupportData {
  supportCount: number;
  opposeCount: number;
}

/**
 * Generate consistent mock support/oppose data for a bill
 * Uses bill congress, type, and number to create deterministic values
 */
export function getBillSupportData(congress: number | string, type: string, number: number | string): BillSupportData {
  // Create a simple hash from the bill identifiers for consistency
  const billKey = `${congress}-${type}-${number}`;
  let hash = 0;
  for (let i = 0; i < billKey.length; i++) {
    const char = billKey.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use the hash to generate consistent pseudo-random values
  const abs = Math.abs(hash);
  const supportSeed = abs % 50000;
  const opposeSeed = (abs * 7) % 30000;
  
  // Generate support count (typically higher than oppose for active bills)
  const supportCount = Math.max(100, supportSeed + 1000);
  
  // Generate oppose count (usually lower but significant)
  const opposeCount = Math.max(50, opposeSeed + 200);
  
  return {
    supportCount,
    opposeCount
  };
}