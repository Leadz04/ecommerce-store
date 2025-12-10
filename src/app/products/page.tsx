'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, Grid, List, SlidersHorizontal, X, Search, Tag } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { ProductCardSkeleton } from '@/components/LoadingSkeleton';
import SelectField from '@/components/SelectField';
import { useProductStore } from '@/store/productStore';

// Default limit for products per page
const DEFAULT_PRODUCTS_LIMIT = 24;

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
  const [pendingFilters, setPendingFilters] = useState<any>(null);
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Get the current limit from URL or use default
  const getCurrentLimit = () => {
    return parseInt(searchParams.get('limit') || String(DEFAULT_PRODUCTS_LIMIT));
  };

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

  const categories = ['all', 'Men', 'Women', 'Office & Travel', 'Accessories', 'Gifting'];
  const currentPriceRange = filters.priceRange || [0, 1000];

  // Initialize from URL params - use ref to prevent duplicate calls
  const hasInitialized = useRef<string | false>(false);
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';
    const sortBy = searchParams.get('sortBy') || 'name';
    const page = parseInt(searchParams.get('page') || '1');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const inStock = searchParams.get('inStock');
    const style = searchParams.get('style') || '';
    const color = searchParams.get('color') || '';
    // Always use default limit for products listing page, or read from URL if specified
    const limit = getCurrentLimit();

    // Only use price range from URL if explicitly set, otherwise use defaults
    const priceRange: [number, number] = minPrice || maxPrice
      ? [
        minPrice ? parseInt(minPrice, 10) : 0,
        maxPrice ? parseInt(maxPrice, 10) : 1000
      ]
      : [0, 1000];

    // Only use inStock if explicitly set in URL
    const inStockValue = inStock === 'true' ? true : null;

    // Only use style/color if explicitly set in URL
    const styleValue = style ? style : undefined;
    const colorValue = color ? color : undefined;

    // Only fetch if params actually changed or on first mount
    const paramsKey = `${search}-${category}-${sortBy}-${page}-${limit}-${minPrice}-${maxPrice}-${inStock}-${style}-${color}`;
    if (hasInitialized.current !== false && paramsKey === hasInitialized.current) {
      return;
    }
    hasInitialized.current = paramsKey;

    // Only set searchInput on initial mount, don't reset it on URL changes
    // This prevents the input from being cleared when debounce updates the URL
    if (hasInitialized.current === paramsKey && !searchInput) {
      setSearchInput(search);
    }

    setFilters({
      search,
      category,
      sortBy,
      priceRange,
      inStock: inStockValue,
      style: styleValue,
      color: colorValue
    });

    // Clear displayed products and reset page when filters change (not when loading more)
    // This ensures skeleton shows while new products load
    if (!loadingMoreRef.current) {
      setDisplayedProducts([]);
      setCurrentPage(1);
      isInitialLoadRef.current = true;
    }

    // Check if any filters are active - if so, don't use pagination
    const hasActiveFilters = !!(
      search ||
      minPrice ||
      maxPrice ||
      inStockValue === true ||
      styleValue ||
      colorValue ||
      category !== 'all'
    );

    // Always start with page 1 and limit 24 for initial load
    fetchProducts({
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      sortBy: sortBy === 'name' ? undefined : sortBy,
      ...(hasActiveFilters ? {} : { page: 1, limit }),
      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      inStock: inStockValue === true ? true : undefined,
      style: styleValue,
      color: colorValue
    });
  }, [searchParams, setFilters, fetchProducts]);

  // Track when we're loading more vs initial load
  const loadingMoreRef = useRef(false);

  // Track previous products length to detect when new products arrive
  const prevProductsLengthRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  // Update displayed products when products from store change
  useEffect(() => {
    // For pagination mode (with or without filters)
    if (loadingMoreRef.current) {
      // We're loading more - append to existing products, don't replace
      // Deduplicate by _id, sourceUrl, and name to catch all duplicates
      setDisplayedProducts(prev => {
        const existingIds = new Set(prev.map(p => p._id || (p as any).id));
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
          const id = p._id || (p as any).id;
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
      prevProductsLengthRef.current = products.length;
      isInitialLoadRef.current = false;
      loadingMoreRef.current = false;
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
  const handleLoadMore = async () => {
    if (isLoadingMore || isLoading) return;

    // Calculate the next page based on currently displayed products
    const limit = getCurrentLimit();
    const calculatedCurrentPage = Math.ceil(displayedProducts.length / limit) || 1;
    const nextPage = calculatedCurrentPage + 1;

    // Don't load if we've already loaded all products
    if (displayedProducts.length >= pagination.total) {
      return;
    }

    setIsLoadingMore(true);
    loadingMoreRef.current = true;

    try {
      // Pass ALL current filters to maintain filter state when loading more
      await fetchProducts({
        page: nextPage,
        limit,
        search: filters.search || undefined,
        category: filters.category === 'all' ? undefined : filters.category,
        sortBy: filters.sortBy === 'name' ? undefined : filters.sortBy,
        minPrice: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
        maxPrice: filters.priceRange[1] < 1000 ? filters.priceRange[1] : undefined,
        inStock: filters.inStock === true ? true : undefined,
        style: filters.style || undefined,
        color: filters.color || undefined,
      });

      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error loading more products:', error);
      loadingMoreRef.current = false;
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Debounce search to avoid firing a request on every keystroke
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== filters.search) {
        const params = new URLSearchParams(searchParams);
        if (searchInput) {
          params.set('search', searchInput);
        } else {
          params.delete('search');
        }
        params.set('page', '1');

        setFilters({ search: searchInput });
        const newURL = params.toString() ? `?${params.toString()}` : '/products';
        router.push(newURL, { scroll: false });

        // Build fetch params from URL
        const category = params.get('category') || 'all';
        const sortBy = params.get('sortBy') || 'name';
        const minPrice = params.get('minPrice');
        const maxPrice = params.get('maxPrice');
        const inStock = params.get('inStock');
        const style = params.get('style') || '';
        const color = params.get('color') || '';

        fetchProducts({
          search: searchInput || undefined,
          page: 1,
          limit: getCurrentLimit(),
          category: category === 'all' ? undefined : category,
          sortBy: sortBy !== 'name' ? sortBy : undefined,
          minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
          maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
          inStock: inStock === 'true' ? true : undefined,
          style: style || undefined,
          color: color || undefined
        });
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchInput, filters.search, setFilters, fetchProducts, searchParams, router]);

  const handleCategoryChange = (category: string) => {
    // Build URL params from current URL and new category
    const params = new URLSearchParams(searchParams);
    if (category === 'all') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    params.set('page', '1');

    setFilters({ category });
    const newURL = params.toString() ? `?${params.toString()}` : '/products';
    router.push(newURL, { scroll: false });

    // Build fetch params from URL
    const search = params.get('search') || '';
    const sortBy = params.get('sortBy') || 'name';
    const minPrice = params.get('minPrice');
    const maxPrice = params.get('maxPrice');
    const inStock = params.get('inStock');
    const style = params.get('style') || '';
    const color = params.get('color') || '';

    fetchProducts({
      category: category === 'all' ? undefined : category,
      page: 1,
      limit: getCurrentLimit(),
      search: search || undefined,
      sortBy: sortBy !== 'name' ? sortBy : undefined,
      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      inStock: inStock === 'true' ? true : undefined,
      style: style || undefined,
      color: color || undefined
    });
  };

  const handleSortChange = (sortBy: string) => {
    // Build URL params from current URL and new sortBy
    const params = new URLSearchParams(searchParams);
    if (sortBy === 'name') {
      params.delete('sortBy');
    } else {
      params.set('sortBy', sortBy);
    }
    params.set('page', '1');

    setFilters({ sortBy });
    const newURL = params.toString() ? `?${params.toString()}` : '/products';
    router.push(newURL, { scroll: false });

    // Build fetch params from URL
    const search = params.get('search') || '';
    const category = params.get('category') || 'all';
    const minPrice = params.get('minPrice');
    const maxPrice = params.get('maxPrice');
    const inStock = params.get('inStock');
    const style = params.get('style') || '';
    const color = params.get('color') || '';

    fetchProducts({
      sortBy: sortBy !== 'name' ? sortBy : undefined,
      page: 1,
      limit: getCurrentLimit(),
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      inStock: inStock === 'true' ? true : undefined,
      style: style || undefined,
      color: color || undefined
    });
  };

  const handlePriceRangeChange = (priceRange: [number, number]) => {
    // Build URL params from current URL and new price range
    const params = new URLSearchParams(searchParams);
    if (priceRange[0] > 0) {
      params.set('minPrice', priceRange[0].toString());
    } else {
      params.delete('minPrice');
    }
    if (priceRange[1] < 1000) {
      params.set('maxPrice', priceRange[1].toString());
    } else {
      params.delete('maxPrice');
    }
    params.set('page', '1');

    setFilters({ priceRange });
    const newURL = params.toString() ? `?${params.toString()}` : '/products';
    router.push(newURL, { scroll: false });

    // Build fetch params from URL
    const search = params.get('search') || '';
    const category = params.get('category') || 'all';
    const sortBy = params.get('sortBy') || 'name';
    const inStock = params.get('inStock');
    const style = params.get('style') || '';
    const color = params.get('color') || '';

    fetchProducts({
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 1000 ? priceRange[1] : undefined,
      page: 1,
      limit: getCurrentLimit(),
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      sortBy: sortBy !== 'name' ? sortBy : undefined,
      inStock: inStock === 'true' ? true : undefined,
      style: style || undefined,
      color: color || undefined
    });
  };

  const handlePageChange = (page: number) => {
    // Preserve all filters when changing page - just update page number
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());

    const newURL = params.toString() ? `?${params.toString()}` : '/products';
    router.push(newURL, { scroll: false });

    // Build fetch params from URL
    const search = params.get('search') || '';
    const category = params.get('category') || 'all';
    const sortBy = params.get('sortBy') || 'name';
    const minPrice = params.get('minPrice');
    const maxPrice = params.get('maxPrice');
    const inStock = params.get('inStock');
    const style = params.get('style') || '';
    const color = params.get('color') || '';

    fetchProducts({
      page,
      limit: getCurrentLimit(),
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      sortBy: sortBy !== 'name' ? sortBy : undefined,
      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      inStock: inStock === 'true' ? true : undefined,
      style: style || undefined,
      color: color || undefined
    });
  };

  const clearSearch = () => {
    setSearchInput('');
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    params.set('page', '1');

    setFilters({ search: '' });
    const newURL = params.toString() ? `?${params.toString()}` : '/products';
    router.push(newURL, { scroll: false });

    // Build fetch params from URL
    const category = params.get('category') || 'all';
    const sortBy = params.get('sortBy') || 'name';
    const minPrice = params.get('minPrice');
    const maxPrice = params.get('maxPrice');
    const inStock = params.get('inStock');
    const style = params.get('style') || '';
    const color = params.get('color') || '';

    fetchProducts({
      page: 1,
      limit: getCurrentLimit(),
      category: category === 'all' ? undefined : category,
      sortBy: sortBy !== 'name' ? sortBy : undefined,
      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      inStock: inStock === 'true' ? true : undefined,
      style: style || undefined,
      color: color || undefined
    });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setFilters({ search: '', category: 'all', priceRange: [0, 1000], inStock: null, style: undefined, color: undefined });
    // Clear all URL params by navigating to clean URL
    router.push('/products', { scroll: false });
    fetchProducts({ page: 1, limit: getCurrentLimit() });
  };

  const handleClearAllFiltersClick = () => {
    clearAllFilters();
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setShowFilters(false);
    }
  };

  // Individual filter removal handlers
  const removeCategoryFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('category');
    params.set('page', '1');

    setFilters({ category: 'all' });
    const newURL = params.toString() ? `?${params.toString()}` : '/products';
    router.push(newURL, { scroll: false });

    const search = params.get('search') || '';
    const sortBy = params.get('sortBy') || 'name';
    const minPrice = params.get('minPrice');
    const maxPrice = params.get('maxPrice');
    const inStock = params.get('inStock');
    const style = params.get('style') || '';
    const color = params.get('color') || '';

    fetchProducts({
      page: 1,
      limit: getCurrentLimit(),
      search: search || undefined,
      sortBy: sortBy !== 'name' ? sortBy : undefined,
      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      inStock: inStock === 'true' ? true : undefined,
      style: style || undefined,
      color: color || undefined
    });
  };

  const removeStyleFilter = () => {
    handleStyleChange(filters.style || '');
  };

  const removeColorFilter = () => {
    handleColorChange(filters.color || '');
  };

  const removePriceFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('minPrice');
    params.delete('maxPrice');
    params.set('page', '1');

    setFilters({ priceRange: [0, 1000] });
    const newURL = params.toString() ? `?${params.toString()}` : '/products';
    router.push(newURL, { scroll: false });

    const search = params.get('search') || '';
    const category = params.get('category') || 'all';
    const sortBy = params.get('sortBy') || 'name';
    const inStock = params.get('inStock');
    const style = params.get('style') || '';
    const color = params.get('color') || '';

    fetchProducts({
      page: 1,
      limit: getCurrentLimit(),
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      sortBy: sortBy !== 'name' ? sortBy : undefined,
      inStock: inStock === 'true' ? true : undefined,
      style: style || undefined,
      color: color || undefined
    });
  };

  const removeInStockFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('inStock');
    params.set('page', '1');

    setFilters({ inStock: null });
    const newURL = params.toString() ? `?${params.toString()}` : '/products';
    router.push(newURL, { scroll: false });

    const search = params.get('search') || '';
    const category = params.get('category') || 'all';
    const sortBy = params.get('sortBy') || 'name';
    const minPrice = params.get('minPrice');
    const maxPrice = params.get('maxPrice');
    const style = params.get('style') || '';
    const color = params.get('color') || '';

    fetchProducts({
      page: 1,
      limit: getCurrentLimit(),
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      sortBy: sortBy !== 'name' ? sortBy : undefined,
      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      style: style || undefined,
      color: color || undefined
    });
  };

  // Active Filters Display Component
  const ActiveFiltersDisplay = () => {
    const activeFilters: Array<{ label: string; onRemove: () => void }> = [];

    if (filters.search && filters.search.trim() !== '') {
      activeFilters.push({
        label: `Search: "${filters.search}"`,
        onRemove: clearSearch
      });
    }

    if (filters.category && filters.category !== 'all') {
      activeFilters.push({
        label: `Category: ${filters.category}`,
        onRemove: removeCategoryFilter
      });
    }

    if (filters.style) {
      const styleLabel = styleOptions.find(s => s.toLowerCase() === filters.style) || filters.style;
      activeFilters.push({
        label: `Style: ${styleLabel}`,
        onRemove: removeStyleFilter
      });
    }

    if (filters.color) {
      const colorLabel = colorOptions.find(c => c.value === filters.color)?.name || filters.color;
      activeFilters.push({
        label: `Color: ${colorLabel}`,
        onRemove: removeColorFilter
      });
    }

    if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000)) {
      activeFilters.push({
        label: `Price: $${filters.priceRange[0]} - $${filters.priceRange[1]}`,
        onRemove: removePriceFilter
      });
    }

    if (filters.inStock === true) {
      activeFilters.push({
        label: 'In Stock Only',
        onRemove: removeInStockFilter
      });
    }

    if (activeFilters.length === 0) {
      return null;
    }

    return (
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-100">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-4 w-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-900">Active Filters ({activeFilters.length})</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => (
            <button
              key={index}
              onClick={filter.onRemove}
              className="group inline-flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-blue-200 rounded-full text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm"
            >
              <span>{filter.label}</span>
              <X className="h-3.5 w-3.5 text-gray-400 group-hover:text-red-500 transition-colors" />
            </button>
          ))}
          {activeFilters.length > 1 && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 border-2 border-red-200 rounded-full text-sm font-medium text-red-700 hover:bg-red-100 hover:border-red-300 transition-all"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // Check if there are any active filters
  const hasActiveFilters = () => {
    return (
      filters.search && filters.search.trim() !== '' ||
      filters.category && filters.category !== 'all' ||
      filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) ||
      filters.inStock !== null ||
      filters.style !== undefined ||
      filters.color !== undefined
    );
  };

  const activeFilterCount = [
    filters.search && filters.search.trim() !== '',
    filters.category && filters.category !== 'all',
    filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000),
    filters.inStock !== null,
    filters.style !== undefined,
    filters.color !== undefined
  ].filter(Boolean).length;

  const handleStyleChange = (style: string) => {
    const params = new URLSearchParams(searchParams);
    const newStyle = filters.style === style ? undefined : style;

    if (newStyle) {
      params.set('style', newStyle);
    } else {
      params.delete('style');
    }
    params.set('page', '1');

    setFilters({ style: newStyle });
    const newURL = params.toString() ? `?${params.toString()}` : '/products';
    router.push(newURL, { scroll: false });

    // Build fetch params from URL
    const search = params.get('search') || '';
    const category = params.get('category') || 'all';
    const sortBy = params.get('sortBy') || 'name';
    const minPrice = params.get('minPrice');
    const maxPrice = params.get('maxPrice');
    const inStock = params.get('inStock');
    const color = params.get('color') || '';

    fetchProducts({
      style: newStyle || undefined,
      page: 1,
      limit: getCurrentLimit(),
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      sortBy: sortBy !== 'name' ? sortBy : undefined,
      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      inStock: inStock === 'true' ? true : undefined,
      color: color || undefined
    });
  };

  const handleColorChange = (color: string) => {
    const params = new URLSearchParams(searchParams);
    const newColor = filters.color === color ? undefined : color;

    if (newColor) {
      params.set('color', newColor);
    } else {
      params.delete('color');
    }
    params.set('page', '1');

    setFilters({ color: newColor });
    const newURL = params.toString() ? `?${params.toString()}` : '/products';
    router.push(newURL, { scroll: false });

    // Build fetch params from URL
    const search = params.get('search') || '';
    const category = params.get('category') || 'all';
    const sortBy = params.get('sortBy') || 'name';
    const minPrice = params.get('minPrice');
    const maxPrice = params.get('maxPrice');
    const inStock = params.get('inStock');
    const style = params.get('style') || '';

    fetchProducts({
      color: newColor || undefined,
      page: 1,
      limit: getCurrentLimit(),
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      sortBy: sortBy !== 'name' ? sortBy : undefined,
      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      inStock: inStock === 'true' ? true : undefined,
      style: style || undefined
    });
  };

  const handlePricePreset = (min: number, max: number) => {
    const params = new URLSearchParams(searchParams);
    const newRange: [number, number] = [min, max];

    if (min > 0) {
      params.set('minPrice', min.toString());
    } else {
      params.delete('minPrice');
    }
    if (max < 1000) {
      params.set('maxPrice', max.toString());
    } else {
      params.delete('maxPrice');
    }
    params.set('page', '1');

    setFilters({ priceRange: newRange });
    const newURL = params.toString() ? `?${params.toString()}` : '/products';
    router.push(newURL, { scroll: false });

    // Build fetch params from URL
    const search = params.get('search') || '';
    const category = params.get('category') || 'all';
    const sortBy = params.get('sortBy') || 'name';
    const inStock = params.get('inStock');
    const style = params.get('style') || '';
    const color = params.get('color') || '';

    fetchProducts({
      minPrice: min > 0 ? min : undefined,
      maxPrice: max < 1000 ? max : undefined,
      page: 1,
      limit: getCurrentLimit(),
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      sortBy: sortBy !== 'name' ? sortBy : undefined,
      inStock: inStock === 'true' ? true : undefined,
      style: style || undefined,
      color: color || undefined
    });
  };

  const styleOptions = [
    'Trucker jacket', 'Belted', 'Cowhide', 'Removable hood', 'Chocolate',
    'Biker jacket', 'Cognac', 'Shirt', 'Shirt collar', 'Harrington', 'Fur', 'Blazer',
    'Leather', 'Vintage', 'Hood', 'Hooded', 'Moto', 'Motorcycle', 'Cafe racer',
    'Asymmetrical', 'Biker', 'Quilted', 'Casual', 'Distressed', 'Bomber', 'Waxed'
  ];

  const colorOptions = [
    { name: 'Black', value: 'black', hex: '#000000' },
    { name: 'Maroon', value: 'maroon', hex: '#800000' },
    { name: 'Brown', value: 'brown', hex: '#8B4513' },
    { name: 'Cognac', value: 'cognac', hex: '#9F4636' },
    { name: 'Yellow', value: 'yellow', hex: '#FFD700' },
    { name: 'Blue', value: 'blue', hex: '#0000FF' },
    { name: 'Camel', value: 'camel', hex: '#C19A6B' },
    { name: 'Grey', value: 'grey', hex: '#808080' },
    { name: 'Green', value: 'green', hex: '#008000' },
    { name: 'Olive', value: 'olive', hex: '#808000' },
    { name: 'Off white', value: 'off white', hex: '#FAF9F6' },
    { name: 'White', value: 'white', hex: '#FFFFFF' },
    { name: 'Beige', value: 'beige', hex: '#F5F5DC' },
    { name: 'Red', value: 'red', hex: '#FF0000' }
  ];

  const pricePresets = [
    { label: '$199 - $249', min: 199, max: 249 },
    { label: '$100 - $199', min: 100, max: 199 },
    { label: '$250 - $399', min: 250, max: 399 },
    { label: '$400 - $599', min: 400, max: 599 },
    { label: '$600+', min: 600, max: 1000 }
  ];

  const FiltersContent = ({
    onFilterChange,
    pendingFilters
  }: {
    onFilterChange?: (filters: any) => void;
    pendingFilters?: any;
  } = {}) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
      style: false,
      color: false,
      price: false
    });

    const toggleSection = (section: string) => {
      setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Use pendingFilters if provided, otherwise use current filters
    const displayFilters = pendingFilters || filters;
    const currentPriceRange = displayFilters.priceRange || [0, 1000];

    return (
      <div className="space-y-6">
        {/* Price Presets Section */}
        <div>
          <button
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between mb-3 text-gray-900"
          >
            <h4 className="font-semibold text-sm uppercase tracking-wide">Price</h4>
            <span className="text-gray-500">{expandedSections.price ? '−' : '+'}</span>
          </button>
          {expandedSections.price && (
            <div className="space-y-2">
              {pricePresets.map((preset) => {
                const isActive = displayFilters.priceRange?.[0] === preset.min && displayFilters.priceRange?.[1] === preset.max;
                return (
                  <button
                    key={preset.label}
                    onClick={() => {
                      const newFilters = { ...(pendingFilters || filters), priceRange: [preset.min, preset.max] };
                      if (onFilterChange) {
                        onFilterChange(newFilters);
                      } else {
                        handlePricePreset(preset.min, preset.max);
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg border-2 transition-all ${isActive
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <span className="text-sm underline">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Section */}
        <div>
          <h4 className="font-semibold mb-3 text-gray-900 text-sm uppercase tracking-wide">Category</h4>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <label
                key={category}
                className={`flex items-center justify-center px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${displayFilters.category === category
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={category}
                  checked={displayFilters.category === category}
                  onChange={(e) => {
                    const newFilters = { ...(pendingFilters || filters), category: e.target.value };
                    if (onFilterChange) {
                      onFilterChange(newFilters);
                    } else {
                      handleCategoryChange(e.target.value);
                    }
                  }}
                  className="sr-only"
                />
                <span className="capitalize text-sm">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Style Section */}
        <div>
          <button
            onClick={() => toggleSection('style')}
            className="w-full flex items-center justify-between mb-3 text-gray-900 hover:text-blue-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm uppercase tracking-wide">Style</h4>
              {displayFilters.style && (
                <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                  {styleOptions.find(s => s.toLowerCase() === displayFilters.style) || displayFilters.style}
                </span>
              )}
            </div>
            <span className="text-gray-500">{expandedSections.style ? '−' : '+'}</span>
          </button>
          {expandedSections.style && (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {styleOptions.map((style) => {
                const isActive = displayFilters.style === style.toLowerCase();
                return (
                  <button
                    key={style}
                    onClick={() => {
                      const newStyle = displayFilters.style === style.toLowerCase() ? undefined : style.toLowerCase();
                      const newFilters = { ...(pendingFilters || filters), style: newStyle };
                      if (onFilterChange) {
                        onFilterChange(newFilters);
                      } else {
                        handleStyleChange(style.toLowerCase());
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between ${isActive
                      ? 'bg-blue-50 text-blue-700 font-medium border-2 border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 border-2 border-transparent'
                      }`}
                  >
                    <span className="text-sm">{style}</span>
                    {isActive && (
                      <span className="text-blue-600">
                        <X className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Color Section */}
        <div>
          <button
            onClick={() => toggleSection('color')}
            className="w-full flex items-center justify-between mb-3 text-gray-900 hover:text-blue-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm uppercase tracking-wide">Color</h4>
              {displayFilters.color && (
                <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                  {colorOptions.find(c => c.value === displayFilters.color)?.name || displayFilters.color}
                </span>
              )}
            </div>
            <span className="text-gray-500">{expandedSections.color ? '−' : '+'}</span>
          </button>
          {expandedSections.color && (
            <div className="grid grid-cols-3 gap-3">
              {colorOptions.map((color) => {
                const isActive = displayFilters.color === color.value;
                return (
                  <button
                    key={color.value}
                    onClick={() => {
                      const newColor = displayFilters.color === color.value ? undefined : color.value;
                      const newFilters = { ...(pendingFilters || filters), color: newColor };
                      if (onFilterChange) {
                        onFilterChange(newFilters);
                      } else {
                        handleColorChange(color.value);
                      }
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all relative ${isActive
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                  >
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <X className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div
                      className={`w-8 h-8 rounded-full border-2 ${isActive ? 'ring-2 ring-blue-400' : ''}`}
                      style={{
                        backgroundColor: color.hex,
                        borderColor: color.value === 'white' || color.value === 'off white' ? '#e5e7eb' : color.hex
                      }}
                    />
                    <span className={`text-xs ${isActive ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                      {color.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Availability Section */}
        <div>
          <h4 className="font-semibold mb-3 text-gray-900 text-sm uppercase tracking-wide">Availability</h4>
          <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${displayFilters.inStock === true
            ? 'border-blue-600 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}>
            <input
              type="checkbox"
              checked={displayFilters.inStock === true}
              onChange={(e) => {
                const nextInStock = e.target.checked ? true : null;
                const newFilters = { ...(pendingFilters || filters), inStock: nextInStock };
                if (onFilterChange) {
                  onFilterChange(newFilters);
                } else {
                  const params = new URLSearchParams(searchParams);
                  if (e.target.checked) {
                    params.set('inStock', 'true');
                  } else {
                    params.delete('inStock');
                  }
                  params.set('page', '1');

                  setFilters({ inStock: nextInStock });
                  const newURL = params.toString() ? `?${params.toString()}` : '/products';
                  router.push(newURL, { scroll: false });

                  // Build fetch params from URL
                  const search = params.get('search') || '';
                  const category = params.get('category') || 'all';
                  const sortBy = params.get('sortBy') || 'name';
                  const minPrice = params.get('minPrice');
                  const maxPrice = params.get('maxPrice');
                  const style = params.get('style') || '';
                  const color = params.get('color') || '';

                  fetchProducts({
                    inStock: e.target.checked ? true : undefined,
                    page: 1,
                    limit: getCurrentLimit(),
                    search: search || undefined,
                    category: category === 'all' ? undefined : category,
                    sortBy: sortBy !== 'name' ? sortBy : undefined,
                    minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
                    maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
                    style: style || undefined,
                    color: color || undefined
                  });
                }
              }}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
            />
            <span className={`ml-3 font-medium ${displayFilters.inStock === true ? 'text-blue-700' : 'text-gray-700'}`}>
              In stock only
            </span>
            {displayFilters.inStock === true && (
              <span className="ml-auto text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </label>
        </div>

        {/* Price Range Slider Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Price Range</h4>
            {displayFilters.priceRange && (displayFilters.priceRange[0] > 0 || displayFilters.priceRange[1] < 1000) && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>
          <div className={`space-y-4 p-4 rounded-lg border-2 transition-all ${displayFilters.priceRange && (displayFilters.priceRange[0] > 0 || displayFilters.priceRange[1] < 1000)
            ? 'border-blue-200 bg-blue-50/30'
            : 'border-gray-100 bg-gray-50/30'
            }`}>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="1000"
                value={currentPriceRange[1]}
                onChange={(e) => {
                  const newPriceRange: [number, number] = [currentPriceRange[0], parseInt(e.target.value, 10)];
                  const newFilters = { ...(pendingFilters || filters), priceRange: newPriceRange };
                  if (onFilterChange) {
                    onFilterChange(newFilters);
                  } else {
                    handlePriceRangeChange(newPriceRange);
                  }
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                style={{
                  background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(currentPriceRange[1] / 1000) * 100}%, #e5e7eb ${(currentPriceRange[1] / 1000) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Min:</span>
                <span className={`text-sm font-semibold ${filters.priceRange && filters.priceRange[0] > 0 ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                  ${currentPriceRange[0]}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Max:</span>
                <span className={`text-sm font-semibold ${filters.priceRange && filters.priceRange[1] < 1000 ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                  ${currentPriceRange[1]}
                </span>
              </div>
            </div>
            {filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) && (
              <button
                onClick={removePriceFilter}
                className="w-full mt-2 text-xs text-red-600 hover:text-red-700 font-medium underline"
              >
                Reset Price Range
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header - Conversion Optimized */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white py-12 sm:py-16 md:py-20 overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20 animate-pulse"></div>
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight">
            All Products
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-50 font-medium max-w-2xl mx-auto">
            Discover our complete collection of premium quality products
          </p>
        </div>
      </section>

      {/* Products Section - Conversion Optimized */}
      <section className="py-8 sm:py-12 md:py-16 bg-white">
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Controls - Conversion Optimized */}
          <div className="flex flex-col gap-4 sm:gap-6 mb-8 sm:mb-10">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-3 sm:py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 text-sm sm:text-base font-medium shadow-sm hover:shadow-md transition-all"
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
              <div className="flex items-center space-x-2 bg-white border-2 border-gray-200 rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                  aria-label="Grid view"
                >
                  <Grid className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
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
            </div>

            {/* FILTER & SORT Button - Always visible (matching categories page) */}
            <div className="flex items-center justify-end mb-6">
              <button
                onClick={() => {
                  setShowFilters(!showFilters);
                  if (!showFilters) {
                    setPendingFilters(filters);
                  }
                }}
                className="flex items-center space-x-2 px-5 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold shadow-sm"
              >
                <SlidersHorizontal className="h-5 w-5" />
                <span>FILTER & SORT</span>
                <SlidersHorizontal className="h-5 w-5 rotate-180" />
              </button>
            </div>
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
              <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">
                {/* White Header with Blue Close Icon */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    aria-label="Close filters"
                  >
                    <X className="h-5 w-5 text-blue-600" />
                  </button>
                </div>

                {/* Filter Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <ActiveFiltersDisplay />
                  <FiltersContent
                    onFilterChange={(newFilters) => setPendingFilters(newFilters)}
                    pendingFilters={pendingFilters}
                  />
                </div>

                {/* Footer with action buttons - Fixed at bottom */}
                <div className="border-t border-gray-200 px-6 py-4 bg-white flex-shrink-0">
                  <div className="flex gap-3">
                    {hasActiveFilters() && (
                      <button
                        onClick={() => {
                          clearAllFilters();
                          setPendingFilters(null);
                          setShowFilters(false);
                        }}
                        className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const filtersToApply = pendingFilters || filters;
                        setFilters(filtersToApply);
                        const params = new URLSearchParams(searchParams);

                        // Update URL params
                        if (filtersToApply.category && filtersToApply.category !== 'all') {
                          params.set('category', filtersToApply.category);
                        } else {
                          params.delete('category');
                        }

                        if (filtersToApply.priceRange) {
                          if (filtersToApply.priceRange[0] > 0) {
                            params.set('minPrice', filtersToApply.priceRange[0].toString());
                          } else {
                            params.delete('minPrice');
                          }
                          if (filtersToApply.priceRange[1] < 1000) {
                            params.set('maxPrice', filtersToApply.priceRange[1].toString());
                          } else {
                            params.delete('maxPrice');
                          }
                        }

                        if (filtersToApply.inStock === true) {
                          params.set('inStock', 'true');
                        } else {
                          params.delete('inStock');
                        }

                        if (filtersToApply.style) {
                          params.set('style', filtersToApply.style);
                        } else {
                          params.delete('style');
                        }

                        if (filtersToApply.color) {
                          params.set('color', filtersToApply.color);
                        } else {
                          params.delete('color');
                        }

                        params.set('page', '1');
                        const newURL = params.toString() ? `?${params.toString()}` : '/products';
                        router.push(newURL, { scroll: false });

                        fetchProducts({
                          ...filtersToApply,
                          category: filtersToApply.category === 'all' ? undefined : filtersToApply.category,
                          page: 1,
                          limit: getCurrentLimit()
                        });
                        setPendingFilters(null);
                        setShowFilters(false);
                      }}
                      className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-8">
            {/* Products Grid */}
            <div className="flex-1">
              <div className="mb-6 sm:mb-8">
                <p className="text-base sm:text-lg font-semibold text-gray-900">
                  Showing <span className="text-blue-600">{displayedProducts.length}</span> of <span className="text-gray-700">{pagination.total}</span> products
                </p>
              </div>

              {/* Loading State - Show skeleton when loading with no products displayed */}
              {isLoading && displayedProducts.length === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                    onClick={() => fetchProducts({ limit: getCurrentLimit() })}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Products Display - Show products unless initial loading */}
              {(!isLoading || isLoadingMore) && !error && displayedProducts.length === 0 && (
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

              {/* Products Grid - Keep visible during Load More */}
              {(!isLoading || isLoadingMore) && !error && displayedProducts.length > 0 && (
                <>
                  <div 
                    className={viewMode === 'grid'
                      ? 'grid gap-4 sm:gap-6'
                      : 'grid grid-cols-1 gap-6'
                    }
                    style={viewMode === 'grid' ? {
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
                    } : {}}
                  >
                    {displayedProducts.map((product) => (
                      <ProductCard key={product._id || product.id} product={product} />
                    ))}
                    {/* Show loading skeletons at the bottom while loading more */}
                    {isLoadingMore && (
                      <>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <ProductCardSkeleton key={`loading-${i}`} />
                        ))}
                      </>
                    )}
                  </div>

                  {/* Load More Button - Show when more products available */}
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
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Leather Jackets Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[85%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full">
            {/* Main Heading */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
              DISCOVER OUR LEATHER JACKETS FOR MEN
            </h2>

            {/* Introduction */}
            <p className="text-sm sm:text-base text-gray-700 mb-6 sm:mb-8 leading-relaxed text-center">
              For us, a leather jacket is not just a piece of clothing to wear; it's an obsession that needs to look good, fit good, and feel good.
            </p>

            <p className="text-sm sm:text-base text-gray-700 mb-10 sm:mb-12 leading-relaxed text-center">
              So, enjoy a 100% real experience with <span className="font-bold text-blue-600">EverStyleCrafts</span>' mens leather jackets. Constructed from real lambskin leather, easy to pair and effortless to style — just throw it over your everyday outfits, and you're good to go.
            </p>

            {/* Jacket Types */}
            <div className="space-y-6 sm:space-y-8 mb-10 sm:mb-12">
              {/* Biker */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                  Biker
                </h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Rugged, buttery-soft lining, and the epitome of style with a lot of history. Our motorcycle leather jacket collection has many designs intended to help you impersonate that biker look like Marlon Brando. Whether you're a common guy going grocery shopping or representing a rock band, we have selections you can wear in many places.
                </p>
              </div>

              {/* Blazer */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                  Blazer
                </h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Speaking of designs, for a more sophisticated look, explore our leather blazer jackets. They are not just for formal or 9 to 5 work hours or those boring meetings but also allow you to layer over casual attire and pair with your favorite jeans.
                </p>
              </div>

              {/* Suede */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                  Suede
                </h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Still deciding between casual outings and special occasions? Go with suede jackets made for both. Their smooth texture gives them that Bond-worthy feeling, though they may be less durable than our real mens leather jacket but suede is an excellent choice purely for its stylish appeal.
                </p>
              </div>

              {/* Hooded */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                  Hooded
                </h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Cozy options like our hooded leather jackets for men are the best layers for fall and winter to give you enough insulation while making a statement. See the hooded collection here.
                </p>
              </div>

              {/* Leather Accessories */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                  Leather Accessories
                </h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Additionally, if you want to add some extra compliments to your looks, try leather jacket men styles with our genuine leather accessories — they make a killer combination!
                </p>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mb-8 sm:mb-10">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6 text-center">
                Frequently Asked Questions
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                    How can I prevent my leather jacket from creasing or wrinkling?
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Store them on a hanger with broad shoulders and avoid folding or crumpling.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                    Do you have same styles for women?
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Yes, many of men's versions are available for women as well.
                  </p>
                </div>
              </div>
            </div>

            {/* Collaboration Spotlight */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 sm:p-8 md:p-10 text-white shadow-xl">
              <h3 className="text-base sm:text-lg font-bold mb-4 text-center">
                Collaboration Spotlight
              </h3>
              <p className="text-sm sm:text-base text-blue-50 leading-relaxed text-center mb-4">
                We've partnered with Decrum to unite our signature craftsmanship with their sumptuous linings and vibrant new hues
              </p>
              <p className="text-sm sm:text-base text-blue-50 leading-relaxed text-center font-semibold">
                Check out the full <span className="font-bold">EverStyleCrafts</span> × Decrum range here: Mens Leather Jackets
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
