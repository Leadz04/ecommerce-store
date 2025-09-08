'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart, Truck, Shield, RotateCcw, Minus, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useProductStore } from '@/store/productStore';
import { sampleProducts } from '@/data/products';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  
  const { addItem } = useCartStore();
  const { currentProduct, isLoading, error, fetchProduct, fetchProducts, products } = useProductStore();
  
  // Fetch product when component mounts
  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
    }
  }, [productId, fetchProduct]);

  // Fetch all products for related products
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading product...</p>
        </div>
      </div>
    );
  }
  
  if (error || !currentProduct) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Product Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {error || "The product you're looking for doesn't exist."}
          </p>
          <Link 
            href="/products"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }
  
  const product = currentProduct;

  const handleAddToCart = () => {
    addItem(product, quantity, selectedSize, selectedColor);
  };

  const handleRelatedProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  const images = product.images || [product.image];
  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const colors = ['Black', 'White', 'Blue', 'Red'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
              <Image
                src={images[selectedImage]}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                      selectedImage === index 
                        ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

        {/* Product Info */}
        <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          {/* Brand and Name */}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase tracking-wide">{product.brand}</p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{product.name}</h1>
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-600 dark:text-gray-300 font-medium">
              {product.rating} ({product.reviewCount} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center space-x-4">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">${product.price}</span>
            {product.originalPrice && (
              <span className="text-xl text-gray-500 dark:text-gray-400 line-through">${product.originalPrice}</span>
            )}
            {product.originalPrice && (
              <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm font-bold px-3 py-1 rounded-full">
                Save ${(product.originalPrice - product.price).toFixed(2)}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Description</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{product.description}</p>
          </div>

          {/* Size Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Size</h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedSize === size
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 ring-2 ring-blue-200 dark:ring-blue-800'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Color</h3>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedColor === color
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 ring-2 ring-blue-200 dark:ring-blue-800'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Quantity</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Minus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
              <span className="text-lg font-medium w-12 text-center text-gray-900 dark:text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                className="p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
              {product.stockCount} items in stock
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <span>{product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Heart className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Free Shipping</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Secure Payment</span>
            </div>
            <div className="flex items-center space-x-2">
              <RotateCcw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Easy Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Specifications */}
      {product.specifications && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Specifications</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{key}</span>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Related Products */}
                  <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products
                  .filter(p => p._id !== product._id && p.category === product.category)
                  .slice(0, 4)
                  .map((relatedProduct) => (
              <div 
                key={relatedProduct._id} 
                onClick={() => handleRelatedProductClick(relatedProduct._id)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <Image
                    src={relatedProduct.image}
                    alt={relatedProduct.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {relatedProduct.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">${relatedProduct.price}</p>
                    {relatedProduct.originalPrice && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                        ${relatedProduct.originalPrice}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(relatedProduct.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      ({relatedProduct.reviewCount})
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      </div>
    </div>
  );
}
