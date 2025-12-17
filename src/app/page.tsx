'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/LoadingSkeleton";
import AboutOurCraft from "@/components/AboutOurCraft";
import WhyChooseUs from "@/components/WhyChooseUs";
import type { Product } from '@/types';

const testimonials = [
  {
    text: "For $200 or less, you get more than what you'd expect",
    rating: 5
  },
  {
    text: "Your Next Leather Jacket Must Be Angel Jackets",
    rating: 5
  },
  {
    text: "Their website promises 'luxury you can afford'",
    rating: 4
  },
  {
    text: "Customer service is something that they value pretty highly.",
    rating: 5
  },
  {
    text: "$189 in the sale, that's an absolute bargain!",
    rating: 5
  }
];

export default function Home() {
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [isLoadingBestSellers, setIsLoadingBestSellers] = useState(true);
  const [newLookProducts, setNewLookProducts] = useState<Product[]>([]);
  const [isLoadingNewLook, setIsLoadingNewLook] = useState(true);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setIsLoadingBestSellers(true);
        // Use optimized endpoint for leather top sellers (13 women + 7 men = 20 products)
        const response = await fetch('/api/homepage/top-sellers');
        if (!response.ok) {
          console.error('[home] Best sellers fetch failed', response.status, response.statusText);
          setBestSellers([]);
          return;
        }
        const data = await response.json();
        const products = data.products || [];

        // Products are already filtered and sorted by the API
        setBestSellers(products);
      } catch (error) {
        console.error('Error fetching best sellers:', error);
        setBestSellers([]);
      } finally {
        setIsLoadingBestSellers(false);
      }
    };

    const fetchNewLookProducts = async () => {
      try {
        setIsLoadingNewLook(true);
        const response = await fetch('/api/products?limit=12&inStock=true');
        if (!response.ok) {
          setNewLookProducts([]);
          return;
        }
        const data = await response.json();
        const allProducts = data.products || [];

        const validProducts = allProducts.filter((product: Product) => {
          if (!product.image) return false;
          const imageUrl = product.image.toLowerCase();
          return !imageUrl.includes('res.cloudinary.com/demo') &&
            !imageUrl.includes('images.unsplash.com');
        });

        // Randomly shuffle for variety
        const shuffled = [...validProducts].sort(() => Math.random() - 0.5);
        setNewLookProducts(shuffled.slice(0, 12));
      } catch (error) {
        console.error('Error fetching new look products:', error);
        setNewLookProducts([]);
      } finally {
        setIsLoadingNewLook(false);
      }
    };

    fetchBestSellers();
    fetchNewLookProducts();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Promotional Banner */}
      <section className="relative bg-gradient-to-r from-red-700 via-red-800 to-red-900 text-white py-12 md:py-16 overflow-hidden">
        {/* Bokeh effect background */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-yellow-400/20 blur-2xl"
              style={{
                width: `${Math.random() * 200 + 100}px`,
                height: `${Math.random() * 200 + 100}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6">
            Holiday Favorites Sale 30-45% off
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold text-lg">
              Guaranteed Christmas Delivery
            </div>
            <Link
              href="/products"
              className="text-white underline text-lg font-semibold hover:text-yellow-300 transition-colors"
            >
              Shop the Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Features */}
      <section className="py-8 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Free Shipping & Free Returns in US</h3>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">24/7 Live Chat Support</h3>
              <Link href="#" className="text-blue-600 hover:underline text-sm">Chat now</Link>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h3 className="font-bold text-gray-900 mb-1">Buy now and Pay Later in 4 Installments via PayPal</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Our Best Sellers */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-3">
              Our Best Sellers
            </h2>
          </div>

          {isLoadingBestSellers ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(20)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : bestSellers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {bestSellers.map((product) => (
                <ProductCard key={product.id || product._id} product={product} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Promotional Banners - Under $100 & Wool */}
      <section className="py-8 bg-white">
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Link href="/products?maxPrice=100" className="group relative overflow-hidden rounded-2xl aspect-[2/1]">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:scale-105 transition-transform duration-300"></div>
              <div className="relative h-full flex items-center justify-center">
                <span className="text-white text-2xl md:text-3xl font-black">Under $100</span>
              </div>
            </Link>
            <Link href="/categories/wool" className="group relative overflow-hidden rounded-2xl aspect-[2/1]">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 group-hover:scale-105 transition-transform duration-300"></div>
              <div className="relative h-full flex items-center justify-center">
                <span className="text-white text-2xl md:text-3xl font-black">Wool</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* What People Are Saying - Testimonials Carousel */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-3 sm:mb-4">
              WHAT PEOPLE ARE SAYING
            </h2>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl p-8 sm:p-12 min-h-[300px] flex items-center">
              <div className="w-full transition-all duration-500 ease-in-out">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-6">
                    {[...Array(testimonials[testimonialIndex].rating)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6 italic">
                    "{testimonials[testimonialIndex].text}"
                  </h3>
                  <Link
                    href="/about"
                    className="inline-block text-blue-600 hover:text-blue-700 font-semibold underline"
                  >
                    Click To Learn More
                  </Link>
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <button
              onClick={() => setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
            <button
              onClick={() => setTestimonialIndex((prev) => (prev + 1) % testimonials.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-6 w-6 text-gray-700" />
            </button>

            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setTestimonialIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${index === testimonialIndex ? 'bg-gray-900 w-8' : 'bg-gray-300'
                    }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Review stats */}
          <div className="text-center mt-8">
            <p className="text-lg font-bold text-gray-900">OVER 75,000 5-STAR CUSTOMER REVIEWS</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Our Craft - SEO Content Section */}
      <AboutOurCraft />

      {/* Why Choose Us - SEO Content Section */}
      <WhyChooseUs />

      {/* Our Story Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-6 max-w-3xl mx-auto">
            Luxurious yet sustainable products, where softness, durability, and affordable elegance elevate every moment.
          </p>
          <Link
            href="/about"
            className="inline-block text-gray-900 font-semibold hover:underline text-lg"
          >
            Our Story
          </Link>
        </div>
      </section>

      {/* New Look - Product Gallery */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-3 sm:mb-4">
              New Look
            </h2>
          </div>

          {isLoadingNewLook ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : newLookProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {newLookProducts.slice(0, 8).map((product) => (
                <div key={product.id || product._id} className="group relative">
                  <Link href={`/products/${product.id || product._id}`} className="block">
                    <div className="relative aspect-square overflow-hidden rounded-lg mb-4">
                      {product.image && (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      )}
                    </div>
                    <button className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
                      Shop The Look
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Customer Gallery */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-3 sm:mb-4">
              Customer Gallery
            </h2>
            <p className="text-gray-600">#FjacketsFamily</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 group-hover:scale-110 transition-transform duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                  Gallery {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Buying Guides */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">
                BUYING GUIDES
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { title: 'Product Comparison Guide', description: 'Compare different products and find the perfect match', link: '/help' },
              { title: 'Size & Fit Guide', description: 'Learn how to choose the right size for you', link: '/size-guide' },
              { title: 'Care & Maintenance', description: 'Tips on how to care for your products', link: '/help' },
              { title: 'Style Guide', description: 'Discover the latest trends and styling tips', link: '/help' },
              { title: 'Quality Guide', description: 'Understanding product quality and materials', link: '/help' },
              { title: 'Shopping Tips', description: 'Make the most of your shopping experience', link: '/help' },
            ].map((guide, index) => (
              <Link
                key={index}
                href={guide.link}
                className="group bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
              >
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {guide.title}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base mb-4">
                  {guide.description}
                </p>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
