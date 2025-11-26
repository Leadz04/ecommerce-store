'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Truck, Shield, RotateCcw, Headphones, CheckCircle2, Loader2, Sparkles, Heart, TrendingUp, Clock } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/LoadingSkeleton";
import toast from 'react-hot-toast';
import type { Product } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore';

interface PersonalizedData {
  recommendedForYou: Product[];
  basedOnWishlist: Product[];
  trendingInYourCategories: Product[];
  continueShopping: Product[];
  featuredProducts: Product[];
}

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const { getRecentProducts } = useRecentlyViewedStore();
  
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [personalizedData, setPersonalizedData] = useState<PersonalizedData | null>(null);
  const [isLoadingPersonalized, setIsLoadingPersonalized] = useState(true);
  const [hasPersonalizedData, setHasPersonalizedData] = useState(false);
  const baseCategories = [
    { name: 'Men', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop', count: 0 },
    { name: 'Women', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop', count: 0 },
    { name: 'Office & Travel', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop', count: 0 },
    { name: 'Accessories', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop', count: 0 },
    { name: 'Gifting', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop', count: 0 },
  ];
  const [categories, setCategories] = useState(baseCategories);

  // Fetch personalized content
  useEffect(() => {
    const fetchPersonalizedContent = async () => {
      try {
        setIsLoadingPersonalized(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/homepage/personalized', {
          headers
        });

        if (!response.ok) {
          throw new Error('Failed to fetch personalized content');
        }

        const data = await response.json();
        setPersonalizedData(data.personalized);
        setHasPersonalizedData(data.hasPersonalizedData || false);
        
        // Set featured products from personalized data or fallback
        if (data.personalized?.featuredProducts) {
          setFeaturedProducts(data.personalized.featuredProducts.slice(0, 4));
        }
      } catch (error) {
        console.error('Error fetching personalized content:', error);
        // Fallback to regular featured products
        fetchFeaturedProducts();
      } finally {
        setIsLoadingPersonalized(false);
        setIsLoadingFeatured(false);
      }
    };

    const fetchFeaturedProducts = async () => {
      try {
        setIsLoadingFeatured(true);
        const response = await fetch('/api/products?limit=4&sortBy=rating');
        if (!response.ok) {
          throw new Error('Failed to fetch featured products');
        }
        const data = await response.json();
        setFeaturedProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setIsLoadingFeatured(false);
      }
    };

    fetchPersonalizedContent();
  }, [isAuthenticated]);

  // Fetch category counts
  useEffect(() => {
    const fetchCategoryCounts = async () => {
      try {
        const response = await fetch('/api/categories/counts');
        if (!response.ok) {
          throw new Error('Failed to fetch category counts');
        }
        const data = await response.json();
        const counts = data.counts || {};
        
        // Update categories with real counts
        setCategories(prevCategories => 
          prevCategories.map(cat => ({
            ...cat,
            count: counts[cat.name] || 0
          }))
        );
      } catch (error) {
        console.error('Error fetching category counts:', error);
      }
    };

    fetchCategoryCounts();
  }, []);

  const features = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'Free shipping on orders over $50'
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: '100% secure payment processing'
    },
    {
      icon: RotateCcw,
      title: 'Easy Returns',
      description: '30-day return policy'
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Round-the-clock customer support'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white overflow-hidden py-12 sm:py-16 md:py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
            <div className="fade-in text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-4 sm:mb-6 leading-tight">
                Discover Amazing
                <span className="block bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent"> Products</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 md:mb-10 text-blue-50 leading-relaxed px-2 sm:px-0">
                Shop the latest trends and find everything you need at unbeatable prices. 
                Fast shipping, excellent customer service, and quality guaranteed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Link
                  href="/products"
                  className="bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 w-full sm:w-auto text-sm sm:text-base"
                >
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
                <Link
                  href="/categories"
                  className="border-2 border-white/80 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:bg-white/10 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 w-full sm:w-auto text-sm sm:text-base"
                >
                  Browse Categories
                </Link>
              </div>
            </div>
            <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-[420px]">
              <Image
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop"
                alt="Shopping"
                fill
                priority
                sizes="(min-width: 1024px) 600px, (min-width: 640px) 80vw, 100vw"
                className="rounded-lg shadow-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group p-6 rounded-2xl bg-white shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-2 sm:mb-4">
              Shop by <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Category</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600">Find exactly what you're looking for</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                href={`/categories/${category.name.toLowerCase().replace(' & ', '-').replace(' ', '-')}`}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 bg-white border border-gray-100 hover:-translate-y-3"
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/50 transition-all duration-300" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-bold mb-1 drop-shadow-lg">{category.name}</h3>
                  <p className="text-sm font-medium opacity-95 drop-shadow-md">{category.count} products</p>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white text-sm font-semibold">Shop Now</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Personalized Sections for Authenticated Users */}
      {isAuthenticated && hasPersonalizedData && personalizedData && (
        <>
          {/* Recommended For You */}
          {personalizedData.recommendedForYou.length > 0 && (
            <PersonalizedSection
              title="Recommended For You"
              subtitle="Based on your purchase history"
              products={personalizedData.recommendedForYou}
              isLoading={isLoadingPersonalized}
              icon={Sparkles}
              iconColor="text-purple-600"
            />
          )}

          {/* Based on Wishlist */}
          {personalizedData.basedOnWishlist.length > 0 && (
            <PersonalizedSection
              title="You Might Like"
              subtitle="Similar to items in your wishlist"
              products={personalizedData.basedOnWishlist}
              isLoading={isLoadingPersonalized}
              icon={Heart}
              iconColor="text-pink-600"
            />
          )}

          {/* Trending in Your Categories */}
          {personalizedData.trendingInYourCategories.length > 0 && (
            <PersonalizedSection
              title="Trending in Your Categories"
              subtitle="Popular items in categories you love"
              products={personalizedData.trendingInYourCategories}
              isLoading={isLoadingPersonalized}
              icon={TrendingUp}
              iconColor="text-blue-600"
            />
          )}

          {/* Continue Shopping - Recently Viewed */}
          {(() => {
            const recentlyViewed = getRecentProducts(8);
            return recentlyViewed.length > 0 ? (
              <PersonalizedSection
                title="Continue Shopping"
                subtitle="Pick up where you left off"
                products={recentlyViewed}
                isLoading={false}
                icon={Clock}
                iconColor="text-indigo-600"
              />
            ) : null;
          })()}
        </>
      )}

      {/* Featured Products Section */}
      <section className={`py-10 sm:py-12 md:py-16 ${isAuthenticated && hasPersonalizedData ? 'bg-white' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">
              {isAuthenticated && hasPersonalizedData ? 'Featured Products' : 'Featured Products'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {isAuthenticated && hasPersonalizedData 
                ? 'Handpicked items just for you' 
                : 'Handpicked items just for you'}
            </p>
          </div>
          {isLoadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id || product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No featured products available at the moment.</p>
              <Link
                href="/products"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                Browse All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          )}
          <div className="text-center mt-12">
            <Link
              href="/products"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              View All Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <NewsletterSection />
    </div>
  );
}

// Personalized Section Component
function PersonalizedSection({
  title,
  subtitle,
  products,
  isLoading,
  icon: Icon,
  iconColor
}: {
  title: string;
  subtitle: string;
  products: Product[];
  isLoading: boolean;
  icon: React.ElementType;
  iconColor: string;
}) {
  if (isLoading) {
    return (
      <section className="py-10 sm:py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4 flex items-center justify-center gap-2">
              <Icon className={`h-6 w-6 ${iconColor}`} />
              <span>{title}</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600">{subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-10 sm:py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4 flex items-center justify-center gap-2">
            <Icon className={`h-6 w-6 ${iconColor}`} />
            <span>{title}</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id || product._id} product={product} />
          ))}
        </div>
        {products.length > 8 && (
          <div className="text-center mt-8">
            <Link
              href="/products"
              className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center"
            >
              View More
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// Newsletter Subscription Component
function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setEmail('');
        
        // Store email in localStorage for visitor tracking
        if (typeof window !== 'undefined') {
          localStorage.setItem('visitor_email', email.toLowerCase().trim());
        }
        
        if (data.alreadySubscribed) {
          toast.success('You are already subscribed!');
        } else {
          toast.success('Successfully subscribed! Check your email for confirmation.');
        }
        
        // Reset success state after 5 seconds
        setTimeout(() => {
          setIsSuccess(false);
        }, 5000);
      } else {
        toast.error(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-10 sm:py-12 md:py-16 bg-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">Stay Updated</h2>
        <p className="text-sm sm:text-base text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
          Subscribe to our newsletter and be the first to know about new products, 
          exclusive deals, and special offers.
        </p>
        <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 sm:gap-4 px-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={isSubmitting || isSuccess}
            required
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isSubmitting || isSuccess || !email}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Subscribing...
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Subscribed!
              </>
            ) : (
              'Subscribe'
            )}
          </button>
        </form>
        {isSuccess && (
          <p className="mt-4 text-sm text-blue-100">
            ✓ Thank you for subscribing! Check your email for confirmation.
          </p>
        )}
      </div>
    </section>
  );
}
