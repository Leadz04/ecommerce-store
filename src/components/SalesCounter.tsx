'use client';

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface SalesCounterProps {
  productId: string;
}

export default function SalesCounter({ productId }: SalesCounterProps) {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesCount = async () => {
      if (!productId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/products/${productId}/sales-count`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch sales count');
        }

        setCount(data.count || 0);
      } catch (err) {
        console.error('Error fetching sales count:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setCount(0); // Set to 0 on error to avoid showing nothing
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesCount();

    // Refresh every 5 minutes to keep the count updated
    const interval = setInterval(fetchSalesCount, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [productId]);

  // Don't show if loading or if count is 0 (to avoid cluttering the UI)
  if (isLoading || count === null) {
    return null;
  }

  if (count === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-orange-600 font-medium bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
      <TrendingUp className="h-4 w-4" />
      <span>
        <span className="font-bold">{count}</span> sold in the last 24 hours
      </span>
    </div>
  );
}

