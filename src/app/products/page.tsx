'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, Grid, List, SlidersHorizontal, X, Search } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
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

  const categories = ['all', 'Leather Goods', 'Electronics', 'Clothing', 'Home & Kitchen', 'Food & Beverage', 'Sports & Outdoors', 'Books'];

  // Initialize from URL params
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';
    const sortBy = searchParams.get('sortBy') || 'name';
    const page = parseInt(searchParams.get('page') || '1');
    
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">All Products</h1>
          <p className="text-xl text-blue-100">Discover our complete collection of products</p>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Search and Controls */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
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
              <option value="newest">Newest</option>
            </select>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50"
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                  <Filter className="h-5 w-5 mr-2 text-blue-600" />
                  Filters
                </h3>

                {/* Category Filter */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3 text-gray-900">Category</h4>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label key={category} className="flex items-center text-gray-700">
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          checked={filters.category === category}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="mr-2 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="capitalize">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

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
                        fetchProducts({ inStock: e.target.checked ? true : undefined, page: 1 });
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
                      onChange={(e) => handlePriceRangeChange([filters.priceRange[0], parseInt(e.target.value)])}
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
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading products...</p>
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
