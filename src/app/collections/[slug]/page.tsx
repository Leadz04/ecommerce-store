'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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

const collectionToSlug: Record<string, string> = {
  new: 'new-arrivals',
  best: 'best-sellers',
  seasonal: 'seasonal',
};

const collectionMetadata: Record<string, { title: string; description: string; related: string[] }> = {
  new: {
    title: 'New Arrivals',
    description: 'Discover our latest products and fresh additions to the store',
    related: ['best', 'seasonal'],
  },
  best: {
    title: 'Best Sellers',
    description: 'Top-rated products loved by our customers',
    related: ['new', 'seasonal'],
  },
  seasonal: {
    title: 'Seasonal Picks',
    description: 'Curated selection of seasonal favorites',
    related: ['new', 'best'],
  },
};

interface RelatedCollection {
  collection: string;
  products: any[];
  isLoading: boolean;
}

export default function CollectionPage() {
  const params = useParams();
  const slug = (params.slug as string) || 'new';
  const collection = slugToCollection[slug] || 'new';

  const { products, isLoading, error, fetchProducts, setFilters } = useProductStore();
  const [relatedCollections, setRelatedCollections] = useState<RelatedCollection[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const metadata = collectionMetadata[collection] || collectionMetadata.new;

  // Fetch main collection products
  useEffect(() => {
    setFilters({ collection });
    fetchProducts({ collection, page: 1, limit: 12 });
  }, [collection, setFilters, fetchProducts]);

  // Fetch related collections (exclude products already shown in main collection)
  useEffect(() => {
    const fetchRelatedCollections = async () => {
      setRelatedLoading(true);
      const related: RelatedCollection[] = [];
      
      // Get IDs of products already shown in main collection to avoid duplicates
      const mainProductIds = new Set(products.map((p: any) => p._id?.toString() || p.id?.toString()));

      for (const relatedCollection of metadata.related) {
        try {
          const response = await fetch(
            `/api/products?collection=${relatedCollection}&limit=8&page=1`
          );
          if (response.ok) {
            // Check if response is JSON before parsing
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const data = await response.json();
              // Filter out products that are already in the main collection
              const filteredProducts = (data.products || [])
                .filter((p: any) => {
                  const productId = p._id?.toString() || p.id?.toString();
                  return !mainProductIds.has(productId);
                })
                .slice(0, 4); // Limit to 4 products per related collection
              
              related.push({
                collection: relatedCollection,
                products: filteredProducts,
                isLoading: false,
              });
            } else {
              // Non-JSON response, skip this collection
              console.warn(`[Collections] Non-JSON response for collection ${relatedCollection}`);
              related.push({
                collection: relatedCollection,
                products: [],
                isLoading: false,
              });
            }
          } else {
            related.push({
              collection: relatedCollection,
              products: [],
              isLoading: false,
            });
          }
        } catch (err) {
          console.error(`[Collections] Error fetching related collection ${relatedCollection}:`, err);
          related.push({
            collection: relatedCollection,
            products: [],
            isLoading: false,
          });
        }
      }

      setRelatedCollections(related);
      setRelatedLoading(false);
    };

    // Only fetch related collections after main products are loaded
    if (!isLoading && products.length > 0) {
      fetchRelatedCollections();
    } else if (!isLoading && products.length === 0) {
      // Still fetch related collections even if main collection is empty
      fetchRelatedCollections();
    }
  }, [collection, metadata.related, products, isLoading]);

  const getRelatedCollectionTitle = (col: string) => {
    return collectionMetadata[col]?.title || col;
  };

  const getRelatedCollectionSlug = (col: string) => {
    return collectionToSlug[col] || col;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Main Collection Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">{metadata.title}</h1>
        <p className="text-gray-600 text-lg">{metadata.description}</p>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Main Collection Products */}
      <div className="mb-12">
        {isLoading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products found in this collection.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p: any) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Related Collections */}
      {relatedCollections.length > 0 && (
        <div className="space-y-12">
          {relatedCollections.map((related) => {
            const relatedMetadata = collectionMetadata[related.collection];
            if (!relatedMetadata || related.products.length === 0) return null;

            return (
              <div key={related.collection} className="border-t border-gray-200 pt-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-semibold mb-2">
                      {relatedMetadata.title}
                    </h2>
                    <p className="text-gray-600">{relatedMetadata.description}</p>
                  </div>
                  <Link
                    href={`/collections/${getRelatedCollectionSlug(related.collection)}`}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base whitespace-nowrap ml-4"
                  >
                    View All →
                  </Link>
                </div>

                {related.isLoading ? (
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <ProductCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {related.products.map((p: any) => (
                      <ProductCard key={p._id} product={p} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Loading state for related collections */}
      {relatedLoading && (
        <div className="border-t border-gray-200 pt-12">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6">Related Collections</h2>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
