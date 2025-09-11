'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star, Search, X } from 'lucide-react';
import { CategoriesSkeleton } from '@/components/LoadingSkeleton';
import { sampleProducts } from '@/data/products';

const categories = [
    {
      id: 'electronics',
      name: 'Electronics',
      slug: 'electronics',
      description: 'Latest gadgets, smartphones, laptops, and tech accessories',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=400&fit=crop',
      productCount: 45,
      featuredProducts: sampleProducts.filter(p => p.category === 'Electronics').slice(0, 3)
    },
    {
      id: 'clothing',
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion for men, women, and kids. From casual to formal wear',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
      productCount: 32,
      featuredProducts: sampleProducts.filter(p => p.category === 'Clothing').slice(0, 3)
    },
    {
      id: 'home-kitchen',
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Everything for your home and kitchen. Furniture, appliances, and decor',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop',
      productCount: 28,
      featuredProducts: sampleProducts.filter(p => p.category === 'Home & Kitchen').slice(0, 3)
    },
    {
      id: 'food-beverage',
      name: 'Food & Beverage',
      slug: 'food-beverage',
      description: 'Premium food items, beverages, and gourmet products',
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&h=400&fit=crop',
      productCount: 19,
      featuredProducts: sampleProducts.filter(p => p.category === 'Food & Beverage').slice(0, 3)
    },
    {
      id: 'sports',
      name: 'Sports & Outdoors',
      slug: 'sports',
      description: 'Sports equipment, outdoor gear, and fitness accessories',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop',
      productCount: 24,
      featuredProducts: []
    },
    {
      id: 'books',
      name: 'Books',
      slug: 'books',
      description: 'Books for all ages. Fiction, non-fiction, educational, and more',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop',
      productCount: 15,
      featuredProducts: []
    }
  ];

export default function CategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<typeof categories>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from URL params
  useEffect(() => {
    const search = searchParams.get('search') || '';
    setSearchInput(search);
    
    // Simulate loading for skeleton demonstration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [searchParams]);

  // Update URL when search changes
  const updateURL = (search: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    
    const newURL = params.toString() ? `?${params.toString()}` : '/categories';
    router.push(newURL, { scroll: false });
  };

  // Filter categories based on search
  useEffect(() => {
    if (!searchInput.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const filtered = categories.filter(category => {
      const searchTerm = searchInput.toLowerCase();
      return (
        category.name.toLowerCase().includes(searchTerm) ||
        category.description.toLowerCase().includes(searchTerm) ||
        category.featuredProducts.some(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm)
        )
      );
    });

    setFilteredCategories(filtered);
  }, [searchInput]);

  // Debounce search to avoid firing URL updates on every keystroke
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateURL(searchInput);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const clearSearch = () => {
    setSearchInput('');
    updateURL('');
  };

  if (isLoading) {
    return <CategoriesSkeleton />;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Shop by Category</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Discover our wide range of products organized by category. 
            Find exactly what you're looking for with ease.
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories or products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-10 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 text-lg"
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
            {searchInput && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Searching for: <span className="font-semibold text-blue-600">"{searchInput}"</span>
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
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {searchInput && (
            <div className="mb-8">
              <p className="text-gray-600">
                {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'} found for "{searchInput}"
              </p>
            </div>
          )}
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-500 mb-4">
                No categories found for <span className="font-semibold text-blue-600">"{searchInput}"</span>
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Try:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Check your spelling</li>
                  <li>• Use different keywords</li>
                  <li>• Try more general terms</li>
                  <li>• Search for product names</li>
                </ul>
              </div>
              <div className="mt-6">
                <button
                  onClick={clearSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear search
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCategories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200">
                {/* Category Image */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20" />
                  <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full">
                    <span className="text-sm font-semibold text-gray-900">{category.productCount} items</span>
                  </div>
                </div>

                {/* Category Info */}
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{category.name}</h2>
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  
                  {/* Featured Products */}
                  {category.featuredProducts.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Featured Products:</h3>
                      <div className="space-y-1">
                        {category.featuredProducts.map((product) => (
                          <div key={product.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 truncate">{product.name}</span>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                              <span className="text-gray-500">{product.rating}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View Category Button */}
                  <Link
                    href={`/categories/${category.slug}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold group"
                  >
                    View Category
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 bg-gray-50 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900  mb-4">Popular Categories</h2>
            <p className="text-gray-600 ">Our most shopped categories</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories
              .sort((a, b) => b.productCount - a.productCount)
              .slice(0, 4)
              .map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group bg-white  rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow text-center border border-gray-200 "
                >
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover rounded-lg group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900  mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-500 ">{category.productCount} products</p>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* Category Benefits */}
      <section className="py-16 bg-white ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900  mb-4">Why Shop by Category?</h2>
            <p className="text-gray-600 ">Organized shopping for better experience</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100  w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-blue-600 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900  mb-2">Easy Discovery</h3>
              <p className="text-gray-600 ">Find products quickly by browsing organized categories</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100  w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-blue-600 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900  mb-2">Quality Assured</h3>
              <p className="text-gray-600 ">Each category is carefully curated with quality products</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100  w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-blue-600 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900  mb-2">Fast Shopping</h3>
              <p className="text-gray-600 ">Streamlined browsing for efficient shopping experience</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
