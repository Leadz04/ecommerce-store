'use client';

import { useState, useEffect } from 'react';
import { Star, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getProductUrl } from '@/lib/productUrl';

interface Review {
  _id: string;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
  productId?: {
    _id: string;
    name: string;
    image?: string;
    category?: string;
  };
}

interface CategoryReviewsProps {
  categorySlug: string;
}

export default function CategoryReviews({ categorySlug }: CategoryReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/categories/${categorySlug}/reviews?limit=6`);
        const data = await response.json();
        if (response.ok) {
          setReviews(data.reviews || []);
        }
      } catch (error) {
        console.error('Error fetching category reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [categorySlug]);

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow"
            >
              {/* Product Info */}
              {review.productId && (
                <Link
                  href={getProductUrl(review.productId as any)}
                  className="flex items-center space-x-3 mb-4 group"
                >
                  {review.productId.image && (
                    <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={review.productId.image}
                        alt={review.productId.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {review.productId.name}
                    </p>
                  </div>
                </Link>
              )}

              {/* Rating */}
              <div className="flex items-center mb-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                {review.verifiedPurchase && (
                  <span className="ml-2 text-xs text-green-600 font-medium flex items-center">
                    <span className="mr-1">✓</span>
                    Verified Purchase
                  </span>
                )}
              </div>

              {/* Review Content */}
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900">{review.userName}</span>
                </div>
                {review.title && (
                  <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                )}
                <p className="text-sm text-gray-600 line-clamp-3">{review.comment}</p>
              </div>

              {/* Date */}
              <p className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
