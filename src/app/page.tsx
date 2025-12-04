'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Truck, Shield, RotateCcw, Headphones, CheckCircle2, Loader2, Sparkles, Heart, TrendingUp, Clock, Star, Users, Award, Zap, ShoppingBag, Quote } from "lucide-react";
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
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  
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
          setFeaturedProducts(data.personalized.featuredProducts.slice(0, 8));
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
        // Fetch products and filter out those with demo/unsplash images
        const response = await fetch('/api/products?limit=100&inStock=true');
        if (!response.ok) {
          throw new Error('Failed to fetch featured products');
        }
        const data = await response.json();
        const allProducts = data.products || [];
        
        // Filter out products with demo/unsplash placeholder images
        // Only keep products with real Cloudinary images
        const validProducts = allProducts.filter((product: Product) => {
          if (!product.image) return false;
          const imageUrl = product.image.toLowerCase();
          return !imageUrl.includes('res.cloudinary.com/demo') && 
                 !imageUrl.includes('images.unsplash.com');
        });
        
        // Randomly shuffle and select 8 products
        if (validProducts.length > 0) {
          const shuffled = [...validProducts].sort(() => Math.random() - 0.5);
          setFeaturedProducts(shuffled.slice(0, 8));
        } else {
          setFeaturedProducts([]);
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
        setFeaturedProducts([]);
      } finally {
        setIsLoadingFeatured(false);
      }
    };

    const fetchTrendingProducts = async () => {
      try {
        setIsLoadingTrending(true);
        // Fetch products and filter out those with demo/unsplash images
        const response = await fetch('/api/products?limit=50&inStock=true');
        if (!response.ok) {
          throw new Error('Failed to fetch trending products');
        }
        const data = await response.json();
        const allProducts = data.products || [];
        
        // Filter out products with demo/unsplash placeholder images
        // Only keep products with real Cloudinary images
        const validProducts = allProducts.filter((product: Product) => {
          if (!product.image) return false;
          const imageUrl = product.image.toLowerCase();
          return !imageUrl.includes('res.cloudinary.com/demo') && 
                 !imageUrl.includes('images.unsplash.com');
        });
        
        // Randomly shuffle and select 4 products
        if (validProducts.length > 0) {
          const shuffled = [...validProducts].sort(() => Math.random() - 0.5);
          setTrendingProducts(shuffled.slice(0, 4));
        } else {
          setTrendingProducts([]);
        }
      } catch (error) {
        console.error('Error fetching trending products:', error);
        setTrendingProducts([]);
      } finally {
        setIsLoadingTrending(false);
      }
    };

    fetchPersonalizedContent();
    fetchTrendingProducts();
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
      description: 'Free shipping on orders over $50',
      highlight: 'Orders $50+'
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: '100% secure payment processing',
      highlight: 'SSL Protected'
    },
    {
      icon: RotateCcw,
      title: 'Easy Returns',
      description: '30-day hassle-free return policy',
      highlight: '30 Days'
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Round-the-clock customer support',
      highlight: 'Always Here'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Verified Customer',
      rating: 5,
      text: 'Amazing quality and fast shipping! The product exceeded my expectations. Will definitely shop here again.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face'
    },
    {
      name: 'Michael Chen',
      role: 'Verified Customer',
      rating: 5,
      text: 'Best online shopping experience I\'ve had. Great prices, excellent customer service, and products arrived exactly as described.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Verified Customer',
      rating: 5,
      text: 'Love the variety and quality! Found exactly what I was looking for. The checkout process was smooth and easy.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Trust Bar - Above the fold */}
      <section className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-3 border-b border-gray-700">
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <span className="font-medium">10,000+ Happy Customers</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-400" />
              <span className="font-medium">4.8/5 Average Rating</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-blue-400" />
              <span className="font-medium">50,000+ Products Sold</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-gray-600"></div>
            <div className="hidden md:flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-400" />
              <span className="font-medium">Fast & Free Shipping</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section - Conversion Optimized */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20 animate-pulse"></div>
        
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16 sm:py-20 md:py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left space-y-6 sm:space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span>Limited Time: Up to 50% Off Selected Items</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
                Discover Premium
                <span className="block bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent mt-2">
                  Quality Products
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg md:text-xl text-blue-50 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                Shop the latest trends at unbeatable prices. Fast shipping, excellent service, and quality guaranteed.
              </p>

              {/* Social Proof */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-pink-400 to-purple-400"></div>
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                      ))}
                    </div>
                    <p className="text-xs text-blue-100">4.8/5 from 2,500+ reviews</p>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <Link
                  href="/products"
                  className="group bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center shadow-2xl hover:shadow-3xl transform hover:scale-105 active:scale-95"
                >
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/categories"
                  className="border-2 border-white/90 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-white/10 backdrop-blur-sm transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95"
                >
                  Browse Categories
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 pt-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  <span className="font-semibold">Secure Checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  <span className="font-semibold">Money-Back Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  <span className="font-semibold">Free Returns</span>
                </div>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px] xl:h-[600px] order-first lg:order-last">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
              <Image
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop"
                alt="Premium Shopping Experience"
                fill
                priority
                sizes="(min-width: 1024px) 600px, (min-width: 640px) 80vw, 100vw"
                className="rounded-3xl shadow-2xl object-cover relative z-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Features - Compact & Prominent */}
      <section className="py-8 sm:py-10 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <div key={index} className="text-center group p-4 sm:p-6 rounded-xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">{feature.description}</p>
                <span className="text-xs font-semibold text-blue-600">{feature.highlight}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - Moved Higher for Conversion */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-3 py-1.5 mb-3 sm:mb-4">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-xs sm:text-sm font-bold text-gray-900">Customer Favorites</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-2 sm:mb-3">
              Featured <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Products</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Handpicked items loved by thousands of customers. Quality guaranteed.
            </p>
          </div>
          
          {isLoadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {featuredProducts.slice(0, 8).map((product) => (
                  <ProductCard key={product.id || product._id} product={product} />
                ))}
              </div>
              <div className="text-center mt-8 sm:mt-10">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  View All Products
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Star className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Featured Products Yet</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
                We're working on curating the best products for you. Check out our full collection in the meantime.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Browse All Products
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Categories Section - Enhanced */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-3 sm:mb-4">
              Shop by <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Category</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600">Find exactly what you're looking for</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                href={`/categories/${category.name.toLowerCase().replace(' & ', '-').replace(' ', '-')}`}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 bg-white border-2 border-gray-100 hover:border-blue-300 hover:-translate-y-2"
              >
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/60 transition-all duration-300" />
                  <div className="absolute top-4 right-4">
                    <div className="bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/30">
                      <span className="text-white text-xs font-bold">Shop Now</span>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-white">
                  <h3 className="text-xl sm:text-2xl font-black mb-1 drop-shadow-lg">{category.name}</h3>
                  <p className="text-sm font-semibold opacity-95 drop-shadow-md">{category.count} products</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Testimonials - Social Proof */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full px-4 py-2 mb-4">
              <Quote className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-bold text-gray-900">Real Customer Reviews</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-3 sm:mb-4">
              Loved by <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Thousands</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              See what our customers are saying about their shopping experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed text-base sm:text-lg italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-200">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
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

      {/* Trending Products - Urgency Section */}
      {trendingProducts.length > 0 && (
        <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
          <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full px-4 py-2 mb-4">
                <Zap className="h-5 w-5" />
                <span className="text-sm font-bold">Hot Right Now</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-3 sm:mb-4">
                Trending <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Products</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-700">Don't miss out on these popular items</p>
            </div>
            {isLoadingTrending ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(4)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {trendingProducts.map((product) => (
                  <ProductCard key={product.id || product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Newsletter Section - Enhanced */}
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
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 mb-2 sm:mb-4 flex items-center justify-center gap-2">
              <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} />
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-2 sm:mb-4 flex items-center justify-center gap-2">
            <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${iconColor}`} />
            <span>{title}</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id || product._id} product={product} />
          ))}
        </div>
        {products.length > 8 && (
          <div className="text-center mt-8 sm:mt-10">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-lg hover:underline"
            >
              View More
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// Newsletter Subscription Component - Enhanced
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
    <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
      
      <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 mb-6">
          <Sparkles className="h-5 w-5 text-yellow-300" />
          <span className="text-sm font-bold">Exclusive Offers</span>
        </div>
        
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 sm:mb-6">
          Get <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">Exclusive Deals</span>
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-blue-50 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
          Subscribe to our newsletter and be the first to know about new products, exclusive deals, and special offers. 
          <span className="block mt-2 font-semibold">Join 10,000+ subscribers today!</span>
        </p>
        
        <form onSubmit={handleSubscribe} className="max-w-lg mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              disabled={isSubmitting || isSuccess}
              required
              className="flex-1 px-5 sm:px-6 py-4 sm:py-5 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-4 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg font-medium placeholder-gray-400 shadow-xl"
            />
            <button
              type="submit"
              disabled={isSubmitting || isSuccess || !email}
              className="bg-white text-blue-600 px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-black text-base sm:text-lg hover:bg-gray-50 transition-all duration-300 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Subscribing...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Subscribed!
                </>
              ) : (
                <>
                  Subscribe
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>
        
        {isSuccess && (
          <div className="mt-6 flex items-center justify-center gap-2 text-emerald-200">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm sm:text-base font-semibold">
              Thank you for subscribing! Check your email for confirmation.
            </p>
          </div>
        )}
        
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-blue-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            <span>No spam, unsubscribe anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            <span>Exclusive member-only deals</span>
          </div>
        </div>
      </div>
    </section>
  );
}
