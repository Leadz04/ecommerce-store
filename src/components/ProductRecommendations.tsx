'use client';

import { useEffect, useState, useRef } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Product } from '@/types';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from './LoadingSkeleton';
import { requestDeduplicator } from '@/lib/requestDeduplication';

interface ProductRecommendationsProps {
  productId: string;
  product?: Product;
  type?: 'similar' | 'frequently_bought' | 'you_may_like';
}

export default function ProductRecommendations({ 
  productId, 
  product,
  type = 'similar' 
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);
  const lastKeyRef = useRef<string>('');

  useEffect(() => {
    // Create a unique key for this fetch
    const fetchKey = `${productId}-${type}`;
    
    // Skip if already fetched for this key or currently fetching
    if (fetchKey === lastKeyRef.current && hasFetchedRef.current) {
      return;
    }

    if (isFetchingRef.current) {
      return;
    }

    if (!productId) {
      setIsLoading(false);
      return;
    }

    // Reset refs if productId or type changed
    if (lastKeyRef.current && lastKeyRef.current !== fetchKey) {
      hasFetchedRef.current = false;
    }

    const fetchRecommendations = async () => {
      // Double-check before starting
      if (isFetchingRef.current || (fetchKey === lastKeyRef.current && hasFetchedRef.current)) {
        return;
      }

      isFetchingRef.current = true;
      setIsLoading(true);
      try {
        // Use request deduplication to prevent duplicate calls
        // Clone response to allow multiple reads of the body
        const response = await requestDeduplicator.deduplicate(
          `recommendations-${productId}-${type}`,
          async () => {
            const res = await fetch(`/api/products/${productId}/recommendations?type=${type}`);
            return res.clone(); // Clone to allow multiple reads
          }
        );
        if (response.ok) {
          const data = await response.json();
          setRecommendations(data.products || []);
          hasFetchedRef.current = true;
          lastKeyRef.current = fetchKey;
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchRecommendations();
  }, [productId, type]);

  if (isLoading) {
    return (
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <span>You May Also Like</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  const titles = {
    similar: 'Similar Products',
    frequently_bought: 'Frequently Bought Together',
    you_may_like: 'You May Also Like'
  };

  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-blue-600" />
          <span>{titles[type]}</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {recommendations.map((product) => (
            <ProductCard key={(product as any)._id || (product as any).id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

