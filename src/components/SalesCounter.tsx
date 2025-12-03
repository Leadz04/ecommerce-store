'use client';

import { useEffect, useState, useRef } from 'react';
import { TrendingUp } from 'lucide-react';
import { requestDeduplicator } from '@/lib/requestDeduplication';

interface SalesCounterProps {
  productId: string;
}

export default function SalesCounter({ productId }: SalesCounterProps) {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);
  const lastProductIdRef = useRef<string>('');

  useEffect(() => {
    // Skip if already fetched for this product or currently fetching
    if (productId === lastProductIdRef.current && hasFetchedRef.current) {
      return;
    }

    if (isFetchingRef.current) {
      return;
    }

    if (!productId) {
      setIsLoading(false);
      return;
    }

    // Reset refs if productId changed
    if (lastProductIdRef.current && lastProductIdRef.current !== productId) {
      hasFetchedRef.current = false;
    }

    const fetchSalesCount = async () => {
      // Double-check before starting
      if (isFetchingRef.current || (productId === lastProductIdRef.current && hasFetchedRef.current)) {
        return; // Already fetching or already fetched
      }

      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        // Use request deduplication to prevent duplicate calls
        // Clone response to allow multiple reads of the body
        const response = await requestDeduplicator.deduplicate(
          `sales-count-${productId}`,
          async () => {
            const res = await fetch(`/api/products/${productId}/sales-count`);
            return res.clone(); // Clone to allow multiple reads
          }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch sales count');
        }

        setCount(data.count || 0);
        hasFetchedRef.current = true;
        lastProductIdRef.current = productId;
      } catch (err) {
        console.error('Error fetching sales count:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setCount(0); // Set to 0 on error to avoid showing nothing
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchSalesCount();

    // Refresh every 5 minutes to keep the count updated
    const interval = setInterval(() => {
      if (!isFetchingRef.current) {
        fetchSalesCount();
      }
    }, 5 * 60 * 1000);

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

