'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Filter, Grid, List, SlidersHorizontal, Star, X, Search } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { ProductCardSkeleton, CategoryDetailSkeleton } from '@/components/LoadingSkeleton';
import { useProductStore } from '@/store/productStore';

// Memoized Search and Controls Component
const SearchAndControls = memo(({ 
  searchInput, 
  setSearchInput, 
  clearSearch, 
  filters, 
  categoryName, 
  viewMode, 
  setViewMode, 
  handleSortChange 
}: {
  searchInput: string;
  setSearchInput: (value: string) => void;
  clearSearch: () => void;
  filters: any;
  categoryName: string;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  handleSortChange: (sortBy: string) => void;
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 mb-8">
      {/* Search */}
      <div className="flex-1 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${categoryName.toLowerCase()}...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {/* Search Status */}
        {filters.search && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Searching for: <span className="font-semibold text-blue-600">"{filters.search}"</span>
            </p>
            <button
              onClick={clearSearch}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setViewMode('grid')}
          className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
        >
          <Grid className="h-5 w-5" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
        >
          <List className="h-5 w-5" />
        </button>
      </div>

      {/* Sort */}
      <select
        value={filters.sortBy}
        onChange={(e) => handleSortChange(e.target.value)}
        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
      >
        <option value="name">Sort by Name</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
        <option value="rating">Highest Rated</option>
      </select>
    </div>
  );
});

SearchAndControls.displayName = 'SearchAndControls';

// Memoized Sidebar Filters Component
const SidebarFilters = memo(({ 
  filters, 
  setFilters, 
  setPagination,
  searchParams,
  categorySlug,
  fetchProducts, 
  categoryName, 
  clearAllFilters, 
  priceDebounceRef 
}: {
  filters: any;
  setFilters: (filters: any) => void;
  setPagination: (pagination: any) => void;
  searchParams: URLSearchParams;
  categorySlug: string;
  fetchProducts: (params: any) => void;
  categoryName: string;
  clearAllFilters: () => void;
  priceDebounceRef: React.MutableRefObject<number | null>;
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
        <Filter className="h-5 w-5 mr-2 text-blue-600" />
        Filters
      </h3>

      {/* Availability */}
      <div className="mb-6">
        <h4 className="font-medium mb-3 text-gray-900">Availability</h4>
        <label className="flex items-center text-gray-700">
          <input
            type="checkbox"
            checked={filters.inStock === true}
            onChange={(e) => {
              const nextInStock = e.target.checked ? true : null;
              setFilters({ inStock: nextInStock });
              setPagination({ page: 1 });
              // Update URL without causing re-render
              const params = new URLSearchParams(searchParams);
              if (e.target.checked) {
                params.set('inStock', 'true');
              } else {
                params.delete('inStock');
              }
              params.set('page', '1');
              const query = params.toString();
              const newURL = query ? `${window.location.pathname}?${query}` : `/categories/${categorySlug}`;
              window.history.replaceState(null, '', newURL);
              fetchProducts({ 
                category: categoryName, 
                inStock: e.target.checked ? true : undefined, 
                page: 1 
              });
            }}
            className="mr-2 text-blue-600 focus:ring-blue-500"
          />
          In stock only
        </label>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="font-medium mb-3 text-gray-900">Price Range</h4>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="1000"
            value={filters.priceRange[1]}
            onChange={(e) => {
              const nextRange: [number, number] = [filters.priceRange[0], parseInt(e.target.value)];
              setFilters({ priceRange: nextRange });
              
              // Clear existing timeout
              if (priceDebounceRef.current) {
                window.clearTimeout(priceDebounceRef.current);
              }
              
              // Set new timeout for debounced fetch
              priceDebounceRef.current = window.setTimeout(() => {
                setPagination({ page: 1 });
                // Update URL without causing re-render
                const params = new URLSearchParams(searchParams);
                if (nextRange[0] > 0) {
                  params.set('minPrice', nextRange[0].toString());
                } else {
                  params.delete('minPrice');
                }
                if (nextRange[1] < 1000) {
                  params.set('maxPrice', nextRange[1].toString());
                } else {
                  params.delete('maxPrice');
                }
                params.set('page', '1');
                const query = params.toString();
                const newURL = query ? `${window.location.pathname}?${query}` : `/categories/${categorySlug}`;
                window.history.replaceState(null, '', newURL);
                fetchProducts({ 
                  category: categoryName, 
                  minPrice: nextRange[0], 
                  maxPrice: nextRange[1], 
                  page: 1 
                });
              }, 250);
            }}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>${filters.priceRange[0]}</span>
            <span>${filters.priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={clearAllFilters}
        className="w-full text-blue-600 hover:text-blue-700 font-medium transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
});

SidebarFilters.displayName = 'SidebarFilters';

// Memoized Products Grid Component to prevent unnecessary re-renders
const ProductsGrid = memo(({ 
  products, 
  viewMode, 
  isLoading, 
  error, 
  pagination, 
  categoryName, 
  filters, 
  fetchProducts, 
  setPagination,
  clearSearch, 
  clearAllFilters 
}: {
  products: any[];
  viewMode: 'grid' | 'list';
  isLoading: boolean;
  error: string | null;
  pagination: any;
  categoryName: string;
  filters: any;
  fetchProducts: (params: any) => void;
  setPagination: (pagination: any) => void;
  clearSearch: () => void;
  clearAllFilters: () => void;
}) => {
  return (
    <div className="flex-1">
      <div className="mb-4">
        <p className="text-gray-600">
          {isLoading ? (
            <span className="animate-pulse">Loading products...</span>
          ) : (
            `Showing ${products.length} of ${pagination.total} products`
          )}
        </p>
      </div>


      {/* Error State */}
      {error && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-red-500 text-lg">{error}</p>
          <button 
            onClick={() => fetchProducts({ category: categoryName })}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && products.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          {filters.search ? (
            <>
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">
                No products found for <span className="font-semibold text-blue-600">"{filters.search}"</span> in {categoryName}
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Try:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Check your spelling</li>
                  <li>• Use different keywords</li>
                  <li>• Try more general terms</li>
                  <li>• Remove some filters</li>
                </ul>
              </div>
              <div className="mt-6 space-x-4">
                <button
                  onClick={clearSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Search
                </button>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
              <button
                onClick={clearAllFilters}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      )}

      {/* Products */}
      {!error && (
        <>
          {isLoading ? (
            // Show skeleton when loading
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            // Show products normally
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {products.map((product) => (
                <ProductCard key={(product as any)._id || (product as any).id} product={product as any} />
              ))}
            </div>
          ) : null}
        </>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-12 px-6 py-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 font-medium mb-4 sm:mb-0">
            Showing {((pagination.page - 1) * 12) + 1} to {Math.min(pagination.page * 12, pagination.total)} of {pagination.total} products
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const newPage = pagination.page - 1;
                setPagination({ page: newPage });
                fetchProducts({ category: categoryName, page: newPage });
              }}
              disabled={pagination.page === 1 || isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm"
            >
              {isLoading ? '...' : 'Previous'}
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => {
                      setPagination({ page });
                      fetchProducts({ category: categoryName, page });
                    }}
                    disabled={isLoading}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                      page === pagination.page
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-white hover:text-blue-600 border border-gray-300 bg-white'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                const newPage = pagination.page + 1;
                setPagination({ page: newPage });
                fetchProducts({ category: categoryName, page: newPage });
              }}
              disabled={pagination.page === pagination.pages || isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm"
            >
              {isLoading ? '...' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

ProductsGrid.displayName = 'ProductsGrid';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySlug = params.slug as string;

  // Map slug to category name
  const categoryMap: Record<string, string> = {
    'leather-goods': 'Leather Goods',
    'electronics': 'Electronics',
    'clothing': 'Clothing',
    'home-kitchen': 'Home & Kitchen',
    'food-beverage': 'Food & Beverage',
    'sports': 'Sports & Outdoors',
    'books': 'Books'
  };

  const categoryName = categoryMap[categorySlug as keyof typeof categoryMap] || 'Unknown Category';

  const {
    products,
    isLoading,
    error,
    pagination,
    filters,
    fetchProducts,
    setFilters,
    setPagination
  } = useProductStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const priceDebounceRef = useRef<number | null>(null);
  const initializationRef = useRef(false);

  // Initialize from URL params only once
  useEffect(() => {
    if (initializationRef.current) return;
    
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const page = parseInt(searchParams.get('page') || '1');
    
    setSearchInput(search);
    setFilters({ 
      search, 
      category: categoryName, 
      sortBy,
      priceRange: [0, 1000],
      inStock: null
    });
    
    fetchProducts({ 
      search, 
      category: categoryName, 
      sortBy, 
      page 
    });
    
    initializationRef.current = true;
    setIsInitialized(true);
  }, [categoryName, setFilters, fetchProducts, searchParams]);

  // Update URL when filters change
  const updateURL = useCallback((newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== 'name') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    const query = params.toString();
    const newURL = query ? `${window.location.pathname}?${query}` : `/categories/${categorySlug}`;
    window.history.replaceState(null, '', newURL);
  }, [searchParams, categorySlug]);

  // Debounced search
  useEffect(() => {
    if (!isInitialized) return;
    
    const t = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput });
        setPagination({ page: 1 });
        fetchProducts({ category: categoryName, search: searchInput, page: 1 });
        // Update URL after state changes to avoid triggering effects
        setTimeout(() => {
          const params = new URLSearchParams(searchParams);
          if (searchInput) {
            params.set('search', searchInput);
          } else {
            params.delete('search');
          }
          params.set('page', '1');
          const query = params.toString();
          const newURL = query ? `${window.location.pathname}?${query}` : `/categories/${categorySlug}`;
          window.history.replaceState(null, '', newURL);
        }, 0);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, filters.search, categoryName, fetchProducts, setFilters, setPagination, searchParams, categorySlug, isInitialized]);

  const handleSortChange = useCallback((sortBy: string) => {
    setFilters({ sortBy });
    setPagination({ page: 1 });
    fetchProducts({ category: categoryName, sortBy, page: 1 });
    // Update URL after state changes to avoid triggering effects
    setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (sortBy !== 'name') {
        params.set('sortBy', sortBy);
      } else {
        params.delete('sortBy');
      }
      params.set('page', '1');
      const query = params.toString();
      const newURL = query ? `${window.location.pathname}?${query}` : `/categories/${categorySlug}`;
      window.history.replaceState(null, '', newURL);
    }, 0);
  }, [setFilters, setPagination, searchParams, categorySlug, fetchProducts, categoryName]);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    setFilters({ search: '' });
    setPagination({ page: 1 });
    fetchProducts({ category: categoryName, search: '', page: 1 });
    // Update URL after state changes to avoid triggering effects
    setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      params.delete('search');
      params.set('page', '1');
      const query = params.toString();
      const newURL = query ? `${window.location.pathname}?${query}` : `/categories/${categorySlug}`;
      window.history.replaceState(null, '', newURL);
    }, 0);
  }, [setFilters, setPagination, searchParams, categorySlug, fetchProducts, categoryName]);

  const clearAllFilters = useCallback(() => {
    setSearchInput('');
    setFilters({ search: '', priceRange: [0, 1000], inStock: null });
    setPagination({ page: 1 });
    fetchProducts({ category: categoryName, search: '', minPrice: 0, maxPrice: 1000, page: 1 });
    // Update URL after state changes to avoid triggering effects
    setTimeout(() => {
      const newURL = `/categories/${categorySlug}`;
      window.history.replaceState(null, '', newURL);
    }, 0);
  }, [setFilters, setPagination, categorySlug, fetchProducts, categoryName]);

  const categoryInfo = {
    'Electronics': {
      title: 'Electronics',
      description: 'Discover the latest in technology with our wide selection of electronics. From smartphones to laptops, headphones to smartwatches, we have everything you need to stay connected and productive.',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop'
    },
    'Clothing': {
      title: 'Clothing',
      description: 'Shop the latest fashion trends for men, women, and kids. From casual everyday wear to formal attire, find the perfect outfit for any occasion.',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop'
    },
    'Home & Kitchen': {
      title: 'Home & Kitchen',
      description: 'Transform your living space with our collection of home and kitchen essentials. From furniture to appliances, decor to cookware, create the home of your dreams.',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=400&fit=crop'
    },
    'Food & Beverage': {
      title: 'Food & Beverage',
      description: 'Indulge in premium food and beverage selections. From gourmet coffee to artisanal snacks, discover flavors that will delight your palate.',
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&h=400&fit=crop'
    },
    'Sports & Outdoors': {
      title: 'Sports & Outdoors',
      description: 'Gear up for your next adventure with our sports and outdoor equipment. From fitness gear to camping essentials, we have everything for the active lifestyle.',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop'
    },
    'Books': {
      title: 'Books',
      description: 'Explore our vast collection of books for all ages and interests. From fiction to non-fiction, educational to entertainment, find your next great read.',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop'
    }
  };

  const currentCategoryInfo = categoryInfo[categoryName as keyof typeof categoryInfo] || {
    title: categoryName,
    description: 'Browse our collection of products in this category.',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop'
  };

  // Show full-page skeleton only on initial load
  if (isLoading && products.length === 0) {
    return <CategoryDetailSkeleton />;
  }

  // Only show "Category Not Found" if the category doesn't exist in our mapping
  if (!categoryMap[categorySlug as keyof typeof categoryMap]) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-8">The category you're looking for doesn't exist or has no products.</p>
          <Link
            href="/categories"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Browse All Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Category Header */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-4">
            <Link
              href="/categories"
              className="flex items-center text-blue-100 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Categories
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{currentCategoryInfo.title}</h1>
              <p className="text-xl text-blue-100 mb-6">{currentCategoryInfo.description}</p>
              <div className="flex items-center space-x-4">
                <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                  {products.length} Products
                </span>
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                  <span>4.5 Average Rating</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <Image
                src={currentCategoryInfo.image}
                alt={currentCategoryInfo.title}
                width={600}
                height={300}
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Controls */}
          <SearchAndControls
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            clearSearch={clearSearch}
            filters={filters}
            categoryName={categoryName}
            viewMode={viewMode}
            setViewMode={setViewMode}
            handleSortChange={handleSortChange}
          />

          {/* Filter Toggle for Mobile */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50 mb-4"
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span>Filters</span>
          </button>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <SidebarFilters
                filters={filters}
                setFilters={setFilters}
                setPagination={setPagination}
                searchParams={searchParams}
                categorySlug={categorySlug}
                fetchProducts={fetchProducts}
                categoryName={categoryName}
                clearAllFilters={clearAllFilters}
                priceDebounceRef={priceDebounceRef}
              />
            </div>

            {/* Products Grid */}
            <ProductsGrid
              products={products}
              viewMode={viewMode}
              isLoading={isLoading}
              error={error}
              pagination={pagination}
              categoryName={categoryName}
              filters={filters}
              fetchProducts={fetchProducts}
              setPagination={setPagination}
              clearSearch={clearSearch}
              clearAllFilters={clearAllFilters}
            />
          </div>
        </div>
      </section>
    </div>
  );
}