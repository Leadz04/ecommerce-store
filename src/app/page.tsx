import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Truck, Shield, RotateCcw, Headphones } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { sampleProducts } from "@/data/products";

export default function Home() {
  const featuredProducts = sampleProducts.slice(0, 4);
  const categories = [
    { name: 'Leather Goods', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop', count: 12 },
    { name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop', count: 5 },
    { name: 'Clothing', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop', count: 5 },
    { name: 'Home & Kitchen', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop', count: 5 },
    { name: 'Food & Beverage', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop', count: 5 },
    { name: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', count: 5 },
    { name: 'Books', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop', count: 5 },
  ];

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
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Discover Amazing Products
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Shop the latest trends and find everything you need at unbeatable prices. 
                Fast shipping, excellent customer service, and quality guaranteed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/products"
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
                >
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/categories"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Browse Categories
                </Link>
              </div>
            </div>
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop"
                alt="Shopping"
                width={600}
                height={400}
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-gray-600">Find exactly what you're looking for</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                href={`/categories/${category.name.toLowerCase().replace(' & ', '-').replace(' ', '-')}`}
                className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white border border-gray-200"
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

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-gray-600">Handpicked items just for you</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
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
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new products, 
            exclusive deals, and special offers.
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
