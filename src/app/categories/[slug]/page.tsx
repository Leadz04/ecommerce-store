'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Filter, Grid, List, SlidersHorizontal, Star } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { useProductStore } from '@/store/productStore';

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.slug as string;

  // Map slug to category name
  const categoryMap: Record<string, string> = {
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
    setFilters
  } = useProductStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);

  // Fetch for this category on mount/slug change
  useEffect(() => {
    setFilters({ category: categoryName });
    fetchProducts({ category: categoryName, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryName]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput });
        fetchProducts({ category: categoryName, search: searchInput, page: 1 });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, filters.search, categoryName, fetchProducts, setFilters]);

  const handleSortChange = (sortBy: string) => {
    setFilters({ sortBy });
    fetchProducts({ category: categoryName, sortBy, page: 1 });
  };

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

  if (products.length === 0) {
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
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder={`Search ${categoryName.toLowerCase()}...`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
              />
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
                        fetchProducts({ category: categoryName, inStock: e.target.checked ? true : undefined, page: 1 });
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
                        fetchProducts({ category: categoryName, minPrice: nextRange[0], maxPrice: nextRange[1], page: 1 });
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
                  onClick={() => {
                    setSearchInput('');
                    setFilters({ search: '', priceRange: [0, 1000], inStock: null });
                    fetchProducts({ category: categoryName, search: '', minPrice: 0, maxPrice: 1000, page: 1 });
                  }}
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
                  <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
                  <button
                    onClick={() => {
                      setSearchInput('');
                      setFilters({ search: '', priceRange: [0, 1000], inStock: null });
                      fetchProducts({ category: categoryName, search: '', minPrice: 0, maxPrice: 1000, page: 1 });
                    }}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {/* Products */}
              {!isLoading && !error && products.length > 0 && (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl-grid-cols-4'.replace('xl-grid','xl:grid') 
                    : 'grid-cols-1'
                }`}>
                  {products.map((product) => (
                    <ProductCard key={(product as any)._id || (product as any).id} product={product as any} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchProducts({ category: categoryName, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>

                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => fetchProducts({ category: categoryName, page })}
                          className={`px-4 py-2 border rounded-lg ${
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
                      onClick={() => fetchProducts({ category: categoryName, page: pagination.page + 1 })}
                      disabled={pagination.page === pagination.pages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}