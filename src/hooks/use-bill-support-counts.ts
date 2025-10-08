import { useState, useEffect } from 'react';

interface BillSupportCounts {
  supportCount: number;
  opposeCount: number;
  totalCount: number;
}

export function useBillSupportCounts(
  congress: number | string,
  type: string,
  number: number | string
) {
  const [counts, setCounts] = useState<BillSupportCounts>({
    supportCount: 0,
    opposeCount: 0,
    totalCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!congress || !type || !number) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/bill/${congress}/${type.toLowerCase()}/${number}/support-counts`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch support counts');
        }

        const data = await response.json();
        setCounts({
          supportCount: data.supportCount || 0,
          opposeCount: data.opposeCount || 0,
          totalCount: data.totalCount || 0
        });
      } catch (err) {
        console.error('Error fetching bill support counts:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Set to 0 on error
        setCounts({ supportCount: 0, opposeCount: 0, totalCount: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [congress, type, number]);

  return { ...counts, loading, error };
}
