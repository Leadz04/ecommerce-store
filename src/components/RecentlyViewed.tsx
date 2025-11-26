'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, X } from 'lucide-react';
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore';
import { Product } from '@/types';
import ProductCard from './ProductCard';

interface RecentlyViewedProps {
  currentProductId?: string;
  limit?: number;
}

export default function RecentlyViewed({ currentProductId, limit = 8 }: RecentlyViewedProps) {
  const { getRecentProducts, clearHistory } = useRecentlyViewedStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const recent = getRecentProducts(limit + 1); // Get one extra in case current product is in the list
      // Filter out current product if viewing product page
      const filtered = currentProductId
        ? recent.filter(p => ((p as any)._id || (p as any).id) !== currentProductId)
        : recent;
      setProducts(filtered.slice(0, limit));
    }
  }, [isMounted, currentProductId, limit, getRecentProducts]);

  if (!isMounted || products.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">Recently Viewed</h2>
          </div>
          <button
            onClick={clearHistory}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
          >
            <X className="h-4 w-4" />
            <span>Clear History</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={(product as any)._id || (product as any).id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

