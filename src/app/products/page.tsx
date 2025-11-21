'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, Grid, List, SlidersHorizontal, X, Search } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { ProductCardSkeleton } from '@/components/LoadingSkeleton';
import SelectField from '@/components/SelectField';
import { useProductStore } from '@/store/productStore';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    products, 
    isLoading, 
    error, 
    pagination, 
    filters, 
    fetchProducts, 
    setFilters 
  } = useProductStore();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [openSelect, setOpenSelect] = useState<'sort' | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    if (showFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showFilters]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowFilters(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const categories = ['all', 'Men', 'Women', 'Office & Travel', 'Accessories', 'Gifting'];
  const currentPriceRange = filters.priceRange || [0, 1000];

  // Initialize from URL params - use ref to prevent duplicate calls
  const hasInitialized = useRef(false);
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';
    const sortBy = searchParams.get('sortBy') || 'name';
    const page = parseInt(searchParams.get('page') || '1');
    
    // Only fetch if params actually changed or on first mount
    const paramsKey = `${search}-${category}-${sortBy}-${page}`;
    if (hasInitialized.current && paramsKey === hasInitialized.current) {
      return;
    }
    hasInitialized.current = paramsKey;
    
    setSearchInput(search);
    setFilters({ 
      search, 
      category, 
      sortBy,
      priceRange: [0, 1000],
      inStock: null
    });
    
    fetchProducts({ 
      search, 
      category: category === 'all' ? undefined : category, 
      sortBy, 
      page 
    });
  }, [searchParams, setFilters, fetchProducts]);

  // Update URL when filters change
  const updateURL = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== 'name') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    const newURL = params.toString() ? `?${params.toString()}` : '/products';
    router.push(newURL, { scroll: false });
  };

  // Debounce search to avoid firing a request on every keystroke
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput });
        updateURL({ search: searchInput, page: '1' });
        fetchProducts({ search: searchInput, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchInput, filters.search, setFilters, fetchProducts]);

  const handleCategoryChange = (category: string) => {
    setFilters({ category });
    updateURL({ category, page: '1' });
    fetchProducts({ category: category === 'all' ? undefined : category, page: 1 });
  };

  const handleSortChange = (sortBy: string) => {
    setFilters({ sortBy });
    updateURL({ sortBy, page: '1' });
    fetchProducts({ sortBy, page: 1 });
  };

  const handlePriceRangeChange = (priceRange: [number, number]) => {
    setFilters({ priceRange });
    updateURL({ minPrice: priceRange[0].toString(), maxPrice: priceRange[1].toString(), page: '1' });
    fetchProducts({ 
      minPrice: priceRange[0], 
      maxPrice: priceRange[1], 
      page: 1 
    });
  };

  const handlePageChange = (page: number) => {
    updateURL({ page: page.toString() });
    fetchProducts({ page });
  };

  const clearSearch = () => {
    setSearchInput('');
    setFilters({ search: '' });
    updateURL({ search: '', page: '1' });
    fetchProducts({ search: '', page: 1 });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setFilters({ search: '', category: 'all', priceRange: [0, 1000], inStock: null });
    updateURL({});
    fetchProducts({ search: '', category: undefined, minPrice: 0, maxPrice: 1000, page: 1 });
  };

  const handleClearAllFiltersClick = () => {
    clearAllFilters();
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setShowFilters(false);
    }
  };

  // Check if there are any active filters
  const hasActiveFilters = () => {
    return (
      filters.search && filters.search.trim() !== '' ||
      filters.category && filters.category !== 'all' ||
      filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) ||
      filters.inStock !== null
    );
  };

  const activeFilterCount = [
    filters.search && filters.search.trim() !== '',
    filters.category && filters.category !== 'all',
    filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000),
    filters.inStock !== null
  ].filter(Boolean).length;

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Category Section */}
      <div>
        <h4 className="font-semibold mb-3 text-gray-900 text-sm uppercase tracking-wide">Category</h4>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((category) => (
            <label 
              key={category} 
              className={`flex items-center justify-center px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                filters.category === category
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="category"
                value={category}
                checked={filters.category === category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="sr-only"
              />
              <span className="capitalize text-sm">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability Section */}
      <div>
        <h4 className="font-semibold mb-3 text-gray-900 text-sm uppercase tracking-wide">Availability</h4>
        <label className="flex items-center p-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-all">
          <input
            type="checkbox"
            checked={filters.inStock === true}
            onChange={(e) => {
              const nextInStock = e.target.checked ? true : null;
              setFilters({ inStock: nextInStock });
              updateURL({ inStock: e.target.checked ? 'true' : '', page: '1' });
              fetchProducts({ inStock: e.target.checked ? true : undefined, page: 1 });
            }}
            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
          />
          <span className="ml-3 text-gray-700 font-medium">In stock only</span>
        </label>
      </div>

      {/* Price Range Section */}
      <div>
        <h4 className="font-semibold mb-3 text-gray-900 text-sm uppercase tracking-wide">Price Range</h4>
        <div className="space-y-4">
          <div className="relative">
            <input
              type="range"
              min="0"
              max="1000"
              value={currentPriceRange[1]}
              onChange={(e) => handlePriceRangeChange([currentPriceRange[0], parseInt(e.target.value, 10)])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(currentPriceRange[1] / 1000) * 100}%, #e5e7eb ${(currentPriceRange[1] / 1000) * 100}%, #e5e7eb 100%)`
              }}
            />
          </div>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Min:</span>
              <span className="text-sm font-semibold text-gray-900">${currentPriceRange[0]}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Max:</span>
              <span className="text-sm font-semibold text-blue-600">${currentPriceRange[1]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4">All Products</h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-100">Discover our complete collection of products</p>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Controls */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                />
                {searchInput && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                )}
              </div>
              {/* Search Status */}
              {filters.search && (
                <div className="mt-2 flex items-center justify-between text-xs sm:text-sm">
                  <p className="text-gray-600 truncate pr-2">
                    Searching for: <span className="font-semibold text-blue-600">"{filters.search}"</span>
                  </p>
                  <button
                    onClick={clearSearch}
                    className="text-blue-600 hover:text-blue-700 font-medium shrink-0"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 sm:p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
                  aria-label="Grid view"
                >
                  <Grid className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 sm:p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300'}`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>

              {/* Sort */}
              <div className="flex-1 sm:flex-none min-w-[140px]">
                <SelectField
                  options={[
                    { value: 'name', label: 'Sort by Name' },
                    { value: 'price-low', label: 'Price: Low to High' },
                    { value: 'price-high', label: 'Price: High to Low' },
                    { value: 'rating', label: 'Highest Rated' },
                    { value: 'newest', label: 'Newest' },
                  ]}
                  value={filters.sortBy}
                  isOpen={openSelect === 'sort'}
                  onOpenChange={(open) => setOpenSelect(open ? 'sort' : null)}
                  onSelect={(value) => handleSortChange(value)}
                  className="w-full"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50 text-sm sm:text-base"
                aria-expanded={showFilters}
                aria-controls="mobile-filter-drawer"
              >
                <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>
                  Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
                </span>
              </button>
            </div>
          </div>

          {showFilters && (
            <div 
              className="lg:hidden fixed inset-0 z-50 flex items-end" 
              id="mobile-filter-drawer" 
              role="dialog" 
              aria-modal="true"
            >
              {/* Backdrop with fade-in animation */}
              <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" 
                onClick={() => setShowFilters(false)} 
                aria-hidden="true"
              />
              
              {/* Bottom sheet with slide-up animation */}
              <div className="relative w-full max-h-[85vh] bg-white rounded-t-3xl shadow-2xl flex flex-col animate-slide-up">
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>
                
                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Filter className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                      {activeFilterCount > 0 && (
                        <p className="text-xs text-gray-500">{activeFilterCount} active</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label="Close filters"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <FiltersContent />
                </div>
                
                {/* Footer with action buttons */}
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  <div className="flex gap-3">
                    {hasActiveFilters() && (
                      <button
                        onClick={handleClearAllFiltersClick}
                        className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      onClick={() => setShowFilters(false)}
                      className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <div className="hidden lg:block lg:w-64 flex-shrink-0">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                  <Filter className="h-5 w-5 mr-2 text-blue-600" />
                  Filters
                </h3>
                <FiltersContent />
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              <div className="mb-4">
                <p className="text-gray-600">
                  Showing {products.length} of {pagination.total} products
                </p>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-red-500 text-lg">{error}</p>
                  <button 
                    onClick={() => fetchProducts()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Products Display */}
              {!isLoading && !error && products.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  {filters.search ? (
                    <>
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                      <p className="text-gray-500 mb-4">
                        No products found for <span className="font-semibold text-blue-600">"{filters.search}"</span>
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
                        {hasActiveFilters() && (
                          <button
                            onClick={clearAllFilters}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Clear All Filters
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
                      {hasActiveFilters() && (
                        <button
                          onClick={clearAllFilters}
                          className="mt-4 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                          Clear filters
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {!isLoading && !error && products.length > 0 && (
                <>
                  <div className={`grid gap-6 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                      : 'grid-cols-1'
                  }`}>
                    {products.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex justify-center mt-8">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-4 py-2 border text-gray-700 rounded-lg ${
                                page === pagination.page
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.pages}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
