'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useProductStore } from '@/store/productStore';
import ProductCard from '@/components/ProductCard';
import { ProductCardSkeleton } from '@/components/LoadingSkeleton';

const slugToCollection: Record<string, string> = {
  new: 'new',
  'new-arrivals': 'new',
  best: 'best',
  'best-sellers': 'best',
  seasonal: 'seasonal',
  season: 'seasonal',
};

export default function CollectionPage() {
  const params = useParams();
  const slug = (params.slug as string) || 'new';
  const collection = slugToCollection[slug] || 'new';

  const { products, isLoading, error, fetchProducts, setFilters } = useProductStore();

  useEffect(() => {
    setFilters({ collection });
    fetchProducts({ collection, page: 1 });
  }, [collection, setFilters, fetchProducts]);

  const title = useMemo(() => {
    if (collection === 'new') return 'New Arrivals';
    if (collection === 'best') return 'Best Sellers';
    return 'Seasonal Picks';
  }, [collection]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold mb-6">{title}</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {isLoading ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-gray-600">No products found.</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p: any) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
