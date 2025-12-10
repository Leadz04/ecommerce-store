'use client';

import { useEffect, useRef, useState, useCallback, memo, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { cdnImageLoader } from '@/lib/imageLoader';
import Link from 'next/link';
import { ArrowLeft, Filter, Grid, List, SlidersHorizontal, Star, X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { ProductCardSkeleton, CategoryDetailSkeleton } from '@/components/LoadingSkeleton';
import SelectField from '@/components/SelectField';
import { useProductStore } from '@/store/productStore';
import FilterPanel from './FilterPanel';
import CategoryReviews from '@/components/CategoryReviews';
import CategoryFAQ from '@/components/CategoryFAQ';

// Pure, memoized header to avoid re-render during search/filter updates
const CategoryHeader = memo(({ info, productsCount }: { info: { title: string; description: string; image: string }; productsCount: number }) => {
  return (
    <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 sm:py-10 md:py-12">
      <div className="absolute inset-0 bg-black bg-opacity-30" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">{info.title}</h1>
            <p className="text-sm sm:text-base text-blue-100 mb-4">{info.description}</p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="bg-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm font-medium">
                {productsCount} Products
              </span>
              {productsCount > 0 && (
                <div className="flex items-center text-sm">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current mr-1" />
                  <span>4.5 Average Rating</span>
                </div>
              )}
            </div>
          </div>
          <div className="relative w-full aspect-video lg:aspect-auto lg:h-full">
            <Image
              src={info.image}
              alt={info.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
              loader={cdnImageLoader}
              className="rounded-lg shadow-2xl object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
});
CategoryHeader.displayName = 'CategoryHeader';

// Memoized Search and Controls Component
const SearchAndControls = memo(({
  searchInput,
  setSearchInput,
  clearSearch,
  filters,
  categoryName,
  viewMode,
  setViewMode,
  handleSortChange,
  openSelect,
  setOpenSelect
}: {
  searchInput: string;
  setSearchInput: (value: string) => void;
  clearSearch: () => void;
  filters: any;
  categoryName: string;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  handleSortChange: (sortBy: string) => void;
  openSelect: 'sort' | null;
  setOpenSelect: (value: 'sort' | null) => void;
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
      <div className="w-full lg:w-auto">
        <SelectField
          options={[
            { value: 'name', label: 'Sort by Name' },
            { value: 'price-low', label: 'Price: Low to High' },
            { value: 'price-high', label: 'Price: High to Low' },
            { value: 'rating', label: 'Highest Rated' },
          ]}
          value={filters.sortBy}
          isOpen={openSelect === 'sort'}
          onOpenChange={(open) => setOpenSelect(open ? 'sort' : null)}
          onSelect={(value) => handleSortChange(value)}
          className="w-full lg:w-auto"
        />
      </div>
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
  priceDebounceRef,
  updateURL
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
  updateURL: (newParams: Record<string, string>) => void;
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
              updateURL({ inStock: e.target.checked ? 'true' : '', page: '' });
              fetchProducts({
                category: categoryName,
                inStock: e.target.checked ? true : undefined
              });
            }}
            className="mr-2 text-blue-600 focus:ring-blue-500"
          />
          In stock only
        </label>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="font-medium mb-3 text-gray-900">Max Price</h4>
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
                const urlParams: Record<string, string> = { page: '' };
                if (nextRange[0] > 0) urlParams.minPrice = nextRange[0].toString();
                if (nextRange[1] < 1000) urlParams.maxPrice = nextRange[1].toString();
                if (!(nextRange[0] > 0)) urlParams.minPrice = '' as any;
                if (!(nextRange[1] < 1000)) urlParams.maxPrice = '' as any;
                updateURL(urlParams);
                fetchProducts({
                  category: categoryName,
                  minPrice: nextRange[0],
                  maxPrice: nextRange[1]
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
  displayedProducts,
  viewMode,
  isLoading,
  isLoadingMore,
  error,
  pagination,
  categoryName,
  filters,
  fetchProducts,
  setPagination,
  clearSearch,
  clearAllFilters,
  handleLoadMore,
  updateURL
}: {
  products: any[];
  displayedProducts: any[];
  viewMode: 'grid' | 'list';
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  pagination: any;
  categoryName: string;
  filters: any;
  fetchProducts: (params: any) => void;
  setPagination: (pagination: any) => void;
  clearSearch: () => void;
  clearAllFilters: () => void;
  handleLoadMore: () => void;
  updateURL: (newParams: Record<string, string>) => void;
}) => {
  const hasActiveFilters = (
    (filters?.inStock === true) ||
    (Array.isArray(filters?.priceRange) && (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000)) ||
    (filters?.sortBy && filters.sortBy !== 'name') ||
    (filters?.category && filters.category !== 'all') ||
    !!filters?.brand ||
    typeof filters?.minRating === 'number' ||
    !!filters?.collection ||
    !!filters?.search
  );
  return (
    <div className="flex-1">
      <div className="mb-4">
        <p className="text-gray-600">
          {isLoading ? (
            <span className="animate-pulse">Loading products...</span>
          ) : (
            `Showing ${displayedProducts.length} of ${pagination.total} products`
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
      {!isLoading && !error && displayedProducts.length === 0 && (
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
              {hasActiveFilters && (
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

      {/* Products */}
      {!error && (
        <>
          {isLoading && !isLoadingMore && displayedProducts.length === 0 ? (
            // Show skeleton when loading initial products
            <div className={`grid gap-6 ${viewMode === 'grid'
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
          ) : displayedProducts.length > 0 ? (
            // Show products normally
            <>
              <div 
                className={viewMode === 'grid' 
                  ? 'grid gap-6'
                  : 'grid grid-cols-1 gap-6'
                }
                style={viewMode === 'grid' ? {
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
                } : {}}
              >
                {displayedProducts.map((product) => (
                  <ProductCard key={(product as any)._id || (product as any).id} product={product as any} />
                ))}
                {/* Show loading skeletons at the bottom while loading more */}
                {isLoadingMore && (
                  <>
                    {Array.from({ length: 12 }, (_, i) => (
                      <div key={`loading-${i}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                        <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Load More Button - show when there are more products available */}
              {displayedProducts.length < pagination.total && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore || isLoading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More Products'}
                  </button>
                </div>
              )}
            </>
          ) : null}
        </>
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
    'men': 'Men',
    'women': 'Women',
    'children': 'Children',
    'wool': 'Wool',
    'office-travel': 'Office & Travel',
    'accessories': 'Accessories',
    'gifting': 'Gifting',
    'footwear': 'Footwear'
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
  const [showFilters, setShowFilters] = useState(false); // Start hidden, toggle with button
  const [searchInput, setSearchInput] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [openSelect, setOpenSelect] = useState<'sort' | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<'men' | 'women' | null>(null);
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const priceDebounceRef = useRef<number | null>(null);
  const initializationRef = useRef<string | false>(false);
  const loadingMoreRef = useRef(false);
  const prevProductsLengthRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const [stableTotal, setStableTotal] = useState(0);
  const urlParamsKeyRef = useRef<string>('');

  const isUnknownCategory = !categoryMap[categorySlug as keyof typeof categoryMap];
  const isWoolCategory = categoryName === 'Wool';

  // Reset initialization when category changes
  useEffect(() => {
    if (initializationRef.current !== categorySlug) {
      initializationRef.current = false;
      urlParamsKeyRef.current = '';
      setIsInitialized(false);
    }
  }, [categorySlug]);

  // Initialize from URL params only once
  useEffect(() => {
    if (initializationRef.current) return;
    if (isUnknownCategory) return;

    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const page = parseInt(searchParams.get('page') || '1');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const inStock = searchParams.get('inStock');
    const style = searchParams.get('style') || '';
    const color = searchParams.get('color') || '';
    const subcategory = searchParams.get('subcategory') as 'men' | 'women' | null;

    // Handle subcategory for Wool category
    if (isWoolCategory && subcategory) {
      setSelectedSubcategory(subcategory);
    } else if (isWoolCategory) {
      setSelectedSubcategory(null);
    }

    // Build price range from URL or use defaults
    const priceRange: [number, number] = minPrice || maxPrice
      ? [
        minPrice ? parseInt(minPrice, 10) : 0,
        maxPrice ? parseInt(maxPrice, 10) : 1000
      ]
      : [0, 1000];

    const inStockValue = inStock === 'true' ? true : null;

    // If color/style is set, don't use search if it conflicts
    let finalSearch = search;

    // For Wool category, handle subcategory-based search
    if (isWoolCategory) {
      if (subcategory === 'men') {
        finalSearch = 'wool coat men';
      } else if (subcategory === 'women') {
        finalSearch = 'wool coat women';
      } else {
        finalSearch = search || 'wool coat';
      }
    }

    if (color && finalSearch.toLowerCase().includes(color.toLowerCase())) {
      finalSearch = '';
    }
    if (style && finalSearch.toLowerCase().includes(style.toLowerCase())) {
      finalSearch = '';
    }

    setSearchInput(finalSearch);
    setFilters({
      search: finalSearch,
      category: isWoolCategory ? (subcategory === 'men' ? 'Men' : subcategory === 'women' ? 'Women' : undefined) : categoryName,
      sortBy,
      priceRange,
      inStock: inStockValue,
      style: style || undefined,
      color: color || undefined
    });
    setPagination({ page: 1 });
    setCurrentPage(1);
    setDisplayedProducts([]);
    isInitialLoadRef.current = true;
    loadingMoreRef.current = false;

    // Always use pagination, even with filters
    fetchProducts({
      search: finalSearch,
      category: isWoolCategory ? (subcategory === 'men' ? 'Men' : subcategory === 'women' ? 'Women' : undefined) : categoryName,
      sortBy,
      page: 1,
      limit: 24,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 1000 ? priceRange[1] : undefined,
      inStock: inStockValue || undefined,
      style: style || undefined,
      color: color || undefined
    });

    // Set the URL params key ref to prevent duplicate fetches
    urlParamsKeyRef.current = `${finalSearch}-${sortBy}-1-${minPrice || ''}-${maxPrice || ''}-${inStock || ''}-${style || ''}-${color || ''}`;

    initializationRef.current = categorySlug;
    setIsInitialized(true);
  }, [categoryName, setFilters, setPagination, fetchProducts, searchParams, isUnknownCategory]);

  // React to URL parameter changes after initialization
  useEffect(() => {
    if (!isInitialized) return;
    if (isUnknownCategory) return;

    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const page = parseInt(searchParams.get('page') || '1');
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const inStock = searchParams.get('inStock') || '';
    const style = searchParams.get('style') || '';
    const color = searchParams.get('color') || '';

    // Build price range from URL or use defaults
    const priceRange: [number, number] = minPrice || maxPrice
      ? [
        minPrice ? parseInt(minPrice, 10) : 0,
        maxPrice ? parseInt(maxPrice, 10) : 1000
      ]
      : [0, 1000];

    const inStockValue = inStock === 'true' ? true : null;

    // If color/style is set, don't use search if it conflicts
    let finalSearch = search;
    if (color && search.toLowerCase().includes(color.toLowerCase())) {
      finalSearch = '';
    }
    if (style && search.toLowerCase().includes(style.toLowerCase())) {
      finalSearch = '';
    }

    // Detect if filters/search changed (excluding page changes)
    const filtersChanged = 
      finalSearch !== filters.search ||
      priceRange[0] !== filters.priceRange[0] ||
      priceRange[1] !== filters.priceRange[1] ||
      inStockValue !== filters.inStock ||
      (style || undefined) !== filters.style ||
      (color || undefined) !== filters.color ||
      sortBy !== filters.sortBy;
    
    // If filters changed, reset to page 1 regardless of URL page param
    const effectivePage = filtersChanged ? 1 : page;
    
    // Create a key from all URL params to detect changes
    const paramsKey = `${finalSearch}-${sortBy}-${effectivePage}-${minPrice}-${maxPrice}-${inStock}-${style}-${color}`;

    // Only proceed if params actually changed
    if (urlParamsKeyRef.current === paramsKey) return;
    urlParamsKeyRef.current = paramsKey;

    // Update state and fetch products
    setSearchInput(finalSearch);
    setFilters({
      search: finalSearch,
      category: categoryName,
      sortBy,
      priceRange,
      inStock: inStockValue,
      style: style || undefined,
      color: color || undefined
    });
    setPagination({ page: effectivePage });
    
    // Reset displayed products and current page when page is 1 or filters changed
    if (effectivePage === 1 || filtersChanged) {
      setDisplayedProducts([]);
      setCurrentPage(1);
      isInitialLoadRef.current = true;
      loadingMoreRef.current = false;
      
      // Update URL to remove page param if filters changed
      if (filtersChanged && page !== 1) {
        const params = new URLSearchParams(searchParams);
        params.delete('page');
        const newURL = params.toString() ? `${window.location.pathname}?${params.toString()}` : `/categories/${categorySlug}`;
        window.history.replaceState(null, '', newURL);
      }
    } else if (effectivePage > currentPage) {
      // When loading a different page via URL, treat it as loading more
      loadingMoreRef.current = true;
      setCurrentPage(effectivePage);
    }

    // Always use pagination, even with filters
    fetchProducts({
      search: finalSearch,
      category: categoryName,
      sortBy,
      page: effectivePage,
      limit: 24,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 1000 ? priceRange[1] : undefined,
      inStock: inStockValue || undefined,
      style: style || undefined,
      color: color || undefined
    });
  }, [searchParams, isInitialized, isUnknownCategory, categoryName, setFilters, setPagination, fetchProducts]);

  // Update URL when filters change
  const updateURL = useCallback((newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== 'name' && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // If color or style is set, remove conflicting search terms
    const color = params.get('color');
    const style = params.get('style');
    const search = params.get('search');

    if (color && search) {
      // Check if search term matches the color (case-insensitive)
      const colorLower = color.toLowerCase();
      const searchLower = search.toLowerCase();
      if (searchLower.includes(colorLower) || colorLower.includes(searchLower)) {
        params.delete('search');
      }
    }

    if (style && search) {
      // Check if search term matches the style (case-insensitive)
      const styleLower = style.toLowerCase();
      const searchLower = search.toLowerCase();
      if (searchLower.includes(styleLower) || styleLower.includes(searchLower)) {
        params.delete('search');
      }
    }

    const query = params.toString();
    const newURL = query ? `${window.location.pathname}?${query}` : `/categories/${categorySlug}`;
    window.history.replaceState(null, '', newURL);
  }, [searchParams, categorySlug]);

  // Debounced search
  useEffect(() => {
    if (!isInitialized) return;
    if (isUnknownCategory) return;

    const t = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput });
        setPagination({ page: 1 });
        fetchProducts({
          category: categoryName,
          search: searchInput
        });
        updateURL({ search: searchInput || '', page: '' });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, filters.search, categoryName, fetchProducts, setFilters, setPagination, updateURL, isInitialized, isUnknownCategory]);

  // Keep header count stable during loading; update after fetch completes
  useEffect(() => {
    if (!isLoading && pagination?.total >= 0) {
      setStableTotal(pagination.total);
    }
  }, [isLoading, pagination.total]);

  // Update displayed products when products from store change
  useEffect(() => {
    // For pagination mode (with or without filters)
    if (loadingMoreRef.current) {
      // We're loading more - append to existing products, don't replace
      // Deduplicate by _id, sourceUrl, and name to catch all duplicates
      setDisplayedProducts(prev => {
        const existingIds = new Set(prev.map(p => (p as any)._id || (p as any).id));
        const existingUrls = new Set(
          prev
            .map((p) => {
              const url = (p as any).sourceUrl || (p as any).url || '';
              return url ? url.toLowerCase().trim() : '';
            })
            .filter(Boolean)
        );
        const existingNames = new Set(
          prev
            .map((p) => {
              const name = (p as any).name || '';
              return name ? name.toLowerCase().trim() : '';
            })
            .filter(Boolean)
        );
        
        const newProducts = products.filter((p) => {
          const id = (p as any)._id || (p as any).id;
          const url = ((p as any).sourceUrl || (p as any).url || '').toLowerCase().trim();
          const name = ((p as any).name || '').toLowerCase().trim();
          
          // Skip if duplicate by ID, URL, or name
          if (id && existingIds.has(id)) return false;
          if (url && existingUrls.has(url)) return false;
          if (name && existingNames.has(name)) return false;
          
          return true;
        });
        
        return [...prev, ...newProducts];
      });
      loadingMoreRef.current = false;
      prevProductsLengthRef.current = products.length;
      isInitialLoadRef.current = false;
      return;
    }

    // Initial load or filter change - replace all products
    // Always update if: (1) initial load, (2) product count changed, OR (3) displayed is empty but store has products
    if (isInitialLoadRef.current ||
      products.length !== prevProductsLengthRef.current ||
      (displayedProducts.length === 0 && products.length > 0)) {
      setDisplayedProducts(products);
      prevProductsLengthRef.current = products.length;
      isInitialLoadRef.current = false;
    }
  }, [products, filters, displayedProducts.length]);

  // Load more products function
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || isLoading) return;

    // Calculate the next page based on currently displayed products
    // If we have 25 products displayed with limit 24, we're on page 1, so next is page 2
    const limit = 24;
    const calculatedCurrentPage = Math.ceil(displayedProducts.length / limit) || 1;
    const nextPage = calculatedCurrentPage + 1;

    // Don't load if we've already loaded all products
    if (displayedProducts.length >= pagination.total) {
      console.log('[Load More] All products already loaded:', { displayed: displayedProducts.length, total: pagination.total });
      return;
    }

    console.log('[Load More] Loading page:', { 
      displayed: displayedProducts.length, 
      total: pagination.total,
      calculatedPage: calculatedCurrentPage,
      nextPage 
    });

    setIsLoadingMore(true);
    loadingMoreRef.current = true;

    try {
      // Pass ALL current filters to maintain filter state when loading more
      await fetchProducts({
        category: categoryName,
        page: nextPage,
        limit: limit,
        search: filters.search || undefined,
        sortBy: filters.sortBy === 'name' ? undefined : filters.sortBy,
        minPrice: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
        maxPrice: filters.priceRange[1] < 1000 ? filters.priceRange[1] : undefined,
        inStock: filters.inStock === true ? true : undefined,
        style: filters.style || undefined,
        color: filters.color || undefined
      });

      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error loading more products:', error);
      loadingMoreRef.current = false;
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, isLoading, filters, categoryName, displayedProducts.length, pagination.total, fetchProducts]);

  const handleSortChange = useCallback((sortBy: string) => {
    setFilters({ sortBy });
    setPagination({ page: 1 });
    setDisplayedProducts([]);
    setCurrentPage(1);
    isInitialLoadRef.current = true;
    fetchProducts({ category: categoryName, sortBy, page: 1, limit: 24 });
    // Update URL after state changes to avoid triggering effects
    setTimeout(() => {
      updateURL({ sortBy, page: '' });
    }, 0);
  }, [setFilters, setPagination, fetchProducts, categoryName, updateURL]);

  // Log search analytics when searchInput changes and request returns
  useEffect(() => {
    if (!isInitialized) return;
    const t = setTimeout(async () => {
      const q = searchInput.trim();
      if (q.length === 0) return;
      try {
        // Use current list length as a proxy of results
        await fetch('/api/analytics/search', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, resultsCount: products.length })
        });
      } catch { }
    }, 700);
    return () => clearTimeout(t);
  }, [searchInput, products.length, isInitialized]);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    setFilters({ search: '' });
    setPagination({ page: 1 });
    setDisplayedProducts([]);
    setCurrentPage(1);
    isInitialLoadRef.current = true;
    fetchProducts({ category: categoryName, search: '', page: 1, limit: 24 });
    // Update URL after state changes to avoid triggering effects
    setTimeout(() => {
      updateURL({ search: '', page: '1' });
    }, 0);
  }, [setFilters, setPagination, fetchProducts, categoryName, updateURL]);

  const clearAllFilters = useCallback(() => {
    // Clear all state first
    setSearchInput('');
    setFilters({
      search: '',
      priceRange: [0, 1000],
      inStock: null,
      sortBy: 'name',
      brand: undefined,
      minRating: undefined,
      collection: undefined,
      style: undefined,
      color: undefined
    });
    setPagination({ page: 1 });
    setDisplayedProducts([]);
    setCurrentPage(1);
    isInitialLoadRef.current = true;

    // Clear URL params key ref to force re-initialization
    urlParamsKeyRef.current = '';

    // Navigate to clean URL - this will trigger the useEffect that watches searchParams
    const cleanURL = `/categories/${categorySlug}`;
    router.replace(cleanURL);

    // Fetch products without any filters
    fetchProducts({ category: categoryName, search: '', minPrice: 0, maxPrice: 1000, page: 1, limit: 24 });
  }, [setFilters, setPagination, fetchProducts, categoryName, categorySlug, router]);

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

  const currentCategoryInfo = useMemo(() => {
    if (categoryName === 'Gifting') {
      return {
        title: 'Shop Gifts',
        description: 'Browse our collection of products in this category.',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop'
      };
    }
    if (categoryName === 'Wool') {
      return {
        title: 'Wool',
        description: 'Discover our premium collection of wool coats and jackets for men and women. Warm, stylish, and perfect for any season.',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop'
      };
    }
    return categoryInfo[categoryName as keyof typeof categoryInfo] || {
      title: categoryName,
      description: 'Browse our collection of products in this category.',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop'
    };
  }, [categoryName]);

  // Show full-page skeleton only on the very first load
  if (!isInitialized && isLoading) {
    return <CategoryDetailSkeleton />;
  }

  // Only show "Category Not Found" if the category doesn't exist in our mapping
  if (isUnknownCategory) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header Section - matching category page style */}
        <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-10 sm:py-12 flex-shrink-0">
          <div className="absolute inset-0 bg-black bg-opacity-30" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">Category Not Found</h1>
              <p className="text-base sm:text-lg text-blue-100">The category you're looking for doesn't exist or has no products.</p>
            </div>
          </div>
        </section>

        {/* Content Section - centered and balanced */}
        <section className="flex-1 bg-gray-50 flex items-center justify-center py-6 sm:py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sm:p-10 text-center">
              <div className="max-w-lg mx-auto space-y-5">
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  The category may have been moved or doesn't exist yet. Browse our categories or view all products to find what you're looking for.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/categories"
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm text-sm sm:text-base"
                  >
                    Browse All Categories
                  </Link>
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center px-5 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm sm:text-base"
                  >
                    View All Products
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Category Header (memoized) */}
      <CategoryHeader info={currentCategoryInfo} productsCount={stableTotal} />

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
            openSelect={openSelect}
            setOpenSelect={setOpenSelect}
          />

          {/* FILTER & SORT Button - Always visible (matching reference) */}
          <div className="flex items-center justify-end mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-5 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold shadow-sm"
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span>FILTER & SORT</span>
              <SlidersHorizontal className="h-5 w-5 rotate-180" />
            </button>
          </div>

          {/* Right Side Filter Overlay */}
          {showFilters && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setShowFilters(false)}
              />
              {/* Filter Panel */}
              <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
                {/* White Header with Blue Close Icon */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    aria-label="Close filters"
                  >
                    <X className="h-5 w-5 text-blue-600" />
                  </button>
                </div>

                {/* Filter Content */}
                {categoryName === 'Gifting' ? (
                  <div className="overflow-y-auto h-[calc(100vh-64px)] px-6 py-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 border-b border-gray-300 pb-2">
                        Explore Collection
                      </h3>
                      <ul className="space-y-2">
                        <li>
                          <Link
                            href="/categories/gifting"
                            className="text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center group"
                          >
                            <span className="mr-2 text-gray-400 group-hover:text-gray-600">›</span>
                            Gifts for All
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/categories/gifting?search=for+him"
                            className="text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center group"
                          >
                            <span className="mr-2 text-gray-400 group-hover:text-gray-600">›</span>
                            For Him
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/categories/gifting?search=for+her"
                            className="text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center group"
                          >
                            <span className="mr-2 text-gray-400 group-hover:text-gray-600">›</span>
                            For Her
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/categories/gifting?search=for+mom"
                            className="text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center group"
                          >
                            <span className="mr-2 text-gray-400 group-hover:text-gray-600">›</span>
                            For Mom
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/categories/gifting?search=for+dad"
                            className="text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center group"
                          >
                            <span className="mr-2 text-gray-400 group-hover:text-gray-600">›</span>
                            For Dad
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/categories/gifting?maxPrice=100"
                            className="text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center group"
                          >
                            <span className="mr-2 text-gray-400 group-hover:text-gray-600">›</span>
                            Under $100
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/categories/gifting?search=gift+card"
                            className="text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center group"
                          >
                            <span className="mr-2 text-gray-400 group-hover:text-gray-600">›</span>
                            Gift Cards
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <FilterPanel
                    filters={filters}
                    setFilters={setFilters}
                    setPagination={setPagination}
                    categoryName={categoryName}
                    fetchProducts={fetchProducts}
                    clearAllFilters={clearAllFilters}
                    priceDebounceRef={priceDebounceRef}
                    updateURL={updateURL}
                    setSearchInput={setSearchInput}
                  />
                )}
              </div>
            </>
          )}

          <div className="flex flex-col gap-8">

            {/* Products Grid */}
            <ProductsGrid
              products={products}
              displayedProducts={displayedProducts}
              viewMode={viewMode}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              error={error}
              pagination={pagination}
              categoryName={categoryName}
              filters={filters}
              fetchProducts={fetchProducts}
              setPagination={setPagination}
              clearSearch={clearSearch}
              clearAllFilters={clearAllFilters}
              handleLoadMore={handleLoadMore}
              updateURL={updateURL}
            />
          </div>
        </div>
      </section>

      {/* Category Reviews Section */}
      <CategoryReviews categorySlug={categorySlug} />

      {/* Category FAQ Section */}
      <CategoryFAQ categorySlug={categorySlug} />
    </div>
  );
}