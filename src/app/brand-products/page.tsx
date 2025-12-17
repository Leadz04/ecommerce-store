'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import ProductCard from '@/components/brand-products/ProductCard';
import ProductDetailModal from '@/components/brand-products/ProductDetailModal';

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  brand?: string;
  category?: string;
  subCategory?: string;
  productType?: string;
  inStock: boolean;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
}

interface Facets {
  categories: Record<string, number>;
  subCategories: Record<string, number>;
  productTypes: Record<string, number>;
  brands: Record<string, number>;
  vendors: Record<string, number>;
  tags: Record<string, number>;
  priceRange: {
    min: number;
    max: number;
    avg: number;
  };
}

export default function BrandProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [facets, setFacets] = useState<Facets>({
    categories: {},
    subCategories: {},
    productTypes: {},
    brands: {},
    vendors: {},
    tags: {},
    priceRange: { min: 0, max: 100000, avg: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const [filters, setFilters] = useState({
    mainCategory: searchParams.get('mainCategory') || '',
    category: searchParams.get('category') || '',
    subCategory: searchParams.get('subCategory') || '',
    productType: searchParams.get('productType') || '',
    brand: searchParams.get('brand') || '',
    vendor: searchParams.get('vendor') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
    inStock: searchParams.get('inStock') === 'true',
    onSale: searchParams.get('onSale') === 'true',
    search: searchParams.get('search') || '',
    sortBy: searchParams.get('sortBy') || 'newest'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 0
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      
      // Add filters
      if (filters.mainCategory && filters.mainCategory !== 'all') {
        params.append('mainCategory', filters.mainCategory);
      }
      if (filters.category) params.append('category', filters.category);
      if (filters.subCategory) params.append('subCategory', filters.subCategory);
      if (filters.productType) params.append('productType', filters.productType);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.vendor) params.append('vendor', filters.vendor);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.search) params.append('search', filters.search);
      if (filters.tags.length > 0) params.append('tags', filters.tags.join(','));
      if (filters.inStock) params.append('inStock', 'true');
      if (filters.onSale) params.append('onSale', 'true');
      if (filters.sortBy) params.append('sortBy', filters.sortBy);

      const res = await fetch(`/api/brand-products?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();

      setProducts(data.products || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
      setFacets(data.facets || facets);
    } catch (error) {
      console.error('Failed to fetch products', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters, pagination.limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Debounced search - update filters.search after user stops typing
  useEffect(() => {
    // Clear existing timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Set new timeout to update filter after 500ms of no typing
    searchDebounceRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);

    // Cleanup on unmount
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchInput]);

  // Update URL when filters change (excluding search which is handled by debounce)
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && value !== false) {
        if (Array.isArray(value)) {
          if (value.length > 0) params.append(key, value.join(','));
        } else {
          params.append(key, String(value));
        }
      }
    });
    router.replace(`/brand-products?${params.toString()}`, { scroll: false });
  }, [filters, router]);

  // Sync searchInput with URL params on mount or when URL changes externally
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    // Only update if URL search differs from current input
    if (urlSearch !== searchInput) {
      setSearchInput(urlSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleFilterChange = (key: string, value: string | string[] | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
  };

  const handleRemoveFilter = (key: string, value?: string) => {
    if (key === 'tags' && value) {
      setFilters(prev => ({
        ...prev,
        tags: (prev.tags || []).filter(t => t !== value)
      }));
    } else if (key === 'price') {
      setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }));
    } else {
      setFilters(prev => ({ ...prev, [key]: key === 'tags' ? [] : '' }));
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearAllFilters = () => {
    setFilters({
      mainCategory: '',
      category: '',
      subCategory: '',
      productType: '',
      brand: '',
      vendor: '',
      minPrice: '',
      maxPrice: '',
      tags: [],
      inStock: false,
      onSale: false,
      search: '',
      sortBy: 'newest'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };


  const handleCategorySelect = (category: string, subCategory?: string) => {
    const newFilters = { ...filters };
    
    // Map category names to filter values
    if (category === 'Men' || category === 'Women' || category === 'Kids') {
      newFilters.mainCategory = category;
      // Clear subcategory when selecting main category
      if (!subCategory) {
        newFilters.subCategory = '';
        newFilters.productType = '';
      }
    } else if (category === 'Sale') {
      newFilters.onSale = true;
      newFilters.mainCategory = '';
    } else if (category === 'New In') {
      // Clear filters for "New In" - you might want to add date-based filtering later
      newFilters.mainCategory = '';
      newFilters.subCategory = '';
      newFilters.productType = '';
    }
    
    if (subCategory) {
      // Subcategories like "Tops", "Bottoms", "Outerwear", "Accessories" go to subCategory
      // Kids subcategories: "Boys", "Girls", "Baby Boys", "Baby Girls" also go to subCategory
      // Individual items like "Sweatshirts", "Jeans" go to productType
      const mainSubCategories = ['Tops', 'Bottoms', 'Sets', 'Activewear', 'Outerwear', 'Accessories', 'Boys', 'Girls', 'Baby Boys', 'Baby Girls'];
      
      if (mainSubCategories.includes(subCategory)) {
        newFilters.subCategory = subCategory;
        newFilters.productType = '';
      } else {
        // Individual product types
        newFilters.productType = subCategory;
      }
    }
    
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold text-gray-900">Brand Products</h1>

            {/* Search Bar */}
            <form onSubmit={(e) => {
              e.preventDefault();
              // Immediately update filter on form submit (Enter key)
              setFilters(prev => ({ ...prev, search: searchInput }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }} className="flex-1 max-w-md relative">
              <input
                type="text"
                placeholder="Search products, brands, types..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Detail Modal */}
        <ProductDetailModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />

        <div className="flex flex-col gap-8">
          {/* Main Content */}
          <div className="flex-1">

            {/* Results Summary */}
            <div className="mt-4 mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {products.length > 0 ? ((pagination.page - 1) * pagination.limit + 1) : 0}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total.toLocaleString()} products
              </p>
            </div>

            {/* Products Grid/List */}
            {loading && products.length === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white p-4 rounded-lg h-80">
                    <div className="bg-gray-200 h-48 rounded mb-4"></div>
                    <div className="bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
                    <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-lg border border-dashed">
                <p className="text-gray-500 text-lg mb-2">No products found.</p>
                <p className="text-gray-400 text-sm mb-4">
                  Try adjusting your search or browse by category.
                </p>
                <button
                  onClick={handleClearAllFilters}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard 
                      key={product._id} 
                      product={product}
                      onClick={async () => {
                        // Fetch full product details for modal
                        try {
                          const res = await fetch(`/api/products/${product._id}`);
                          if (res.ok) {
                            const data = await res.json();
                            setSelectedProduct(data.product || data);
                          } else {
                            // Fallback to basic product data
                            setSelectedProduct(product);
                          }
                        } catch (error) {
                          console.error('Failed to fetch product details', error);
                          // Fallback to basic product data
                          setSelectedProduct(product);
                        }
                      }}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-2 flex-wrap">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1 || loading}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-sm text-gray-700 bg-white transition-colors"
                    >
                      Previous
                    </button>

                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let p = pagination.page;
                      if (pagination.totalPages <= 5) {
                        p = i + 1;
                      } else if (pagination.page <= 3) {
                        p = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        p = pagination.totalPages - 4 + i;
                      } else {
                        p = pagination.page - 2 + i;
                      }

                      return (
                        <button
                          key={p}
                          onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                          disabled={loading}
                          className={`px-4 py-2 border rounded text-sm transition-colors ${
                            pagination.page === p
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.totalPages || loading}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-sm text-gray-700 bg-white transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

