'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, CheckCircle, Flag, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import ReviewForm from './ReviewForm';
import { companyInfo } from '@/data/companyInfo';

interface Review {
  _id: string;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  helpfulUsers: string[];
  images?: string[];
  createdAt: string;
  adminResponse?: {
    message: string;
    respondedAt: string;
  };
}

interface ReviewListProps {
  productId: string;
}

export default function ReviewList({ productId }: ReviewListProps) {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'helpfulCount' | 'createdAt' | 'rating'>('helpfulCount');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/products/${productId}/reviews?status=approved&sortBy=${sortBy}&sortOrder=${sortOrder}&page=${page}&limit=5`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews');
      }

      setReviews(data.reviews || []);
      setStats(data.stats);
      setTotalPages(data.pagination?.totalPages || 1);

      // Initialize helpful votes
      if (user) {
        const votes: Record<string, boolean> = {};
        data.reviews?.forEach((review: Review) => {
          if (review.helpfulUsers?.includes(user.id || '')) {
            votes[review._id] = true;
          }
        });
        setHelpfulVotes(votes);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, sortBy, sortOrder, page]);

  const handleHelpful = async (reviewId: string) => {
    if (!user) {
      toast.error('Please log in to mark reviews as helpful');
      return;
    }

    const isCurrentlyHelpful = helpfulVotes[reviewId];
    const newHelpfulState = !isCurrentlyHelpful;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products/${productId}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ helpful: newHelpfulState }),
      });

      if (!response.ok) {
        throw new Error('Failed to update helpful vote');
      }

      setHelpfulVotes((prev) => ({
        ...prev,
        [reviewId]: newHelpfulState,
      }));

      // Refresh reviews to get updated helpful count
      fetchReviews();
    } catch (error) {
      console.error('Error updating helpful vote:', error);
      toast.error('Failed to update helpful vote');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRatingDistribution = () => {
    if (!stats?.ratingDistribution) return null;
    const total = stats.totalReviews;
    if (total === 0) return null;

    return [5, 4, 3, 2, 1].map((rating) => {
      const count = stats.ratingDistribution[rating] || 0;
      const percentage = total > 0 ? (count / total) * 100 : 0;
      return { rating, count, percentage };
    });
  };

  return (
    <div className="mt-20 mb-12 space-y-12">
      {/* Section Header */}
      <div className="text-center mb-12 px-4">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
          Customer <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">Reviews</span>
        </h2>
        <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto">Share your experience and help others make informed decisions</p>
      </div>

      {/* Review Stats and Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-4">
        {/* Stats Section */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-10 shadow-2xl text-white relative overflow-hidden">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
            </div>
            
            <div className="relative z-10">
              <div className="text-center mb-10">
                <div className="text-8xl font-black mb-6 drop-shadow-lg">
                  {stats?.averageRating.toFixed(1) || '0.0'}
                </div>
                <div className="flex items-center justify-center mb-6 gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-8 w-8 ${
                        star <= Math.round(stats?.averageRating || 0)
                          ? 'text-yellow-300 fill-yellow-300 drop-shadow-lg'
                          : 'text-white/30'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-white/95 text-lg font-semibold">
                  Based on <span className="font-bold text-xl">{stats?.totalReviews || 0}</span> {stats?.totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>

              {/* Rating Distribution */}
              {getRatingDistribution() && (
                <div className="space-y-4 pt-8 border-t border-white/30">
                  <p className="text-base font-bold text-white mb-4">Rating Breakdown</p>
                  {getRatingDistribution()!.map(({ rating, count, percentage }) => (
                    <div key={rating} className="flex items-center gap-4">
                      <span className="text-base font-bold text-white w-8">{rating}★</span>
                      <div className="flex-1 bg-white/25 rounded-full h-4 overflow-hidden shadow-inner">
                        <div
                          className="bg-gradient-to-r from-yellow-300 to-yellow-400 h-4 rounded-full transition-all duration-500 shadow-lg"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-white w-10 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {(!stats || stats.totalReviews === 0) && (
                <div className="pt-8 border-t border-white/30">
                  <p className="text-white/90 text-base text-center italic font-medium">No ratings yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Review Form */}
        <div className="lg:col-span-2">
          <ReviewForm productId={productId} onSuccess={fetchReviews} />
        </div>
      </div>

      {/* Reviews List */}
      <div className="px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 pb-6 border-b-2 border-gray-200">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              All Reviews
            </h3>
            <p className="text-gray-600 text-base font-medium">
              {stats?.totalReviews || 0} {stats?.totalReviews === 1 ? 'review' : 'reviews'} total
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-5 py-3 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-sm font-semibold bg-white shadow-md hover:shadow-lg transition-all text-gray-700"
            >
              <option value="helpfulCount">Most Helpful</option>
              <option value="createdAt">Newest First</option>
              <option value="rating">Highest Rated</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-5 py-3 border-2 border-emerald-200 rounded-xl hover:bg-emerald-50 transition-all text-sm font-semibold shadow-md hover:shadow-lg text-gray-700"
              title={`Sort ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl p-20 text-center border-2 border-dashed border-emerald-200 my-8">
            <div className="max-w-lg mx-auto">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full mb-6 shadow-lg">
                  <Star className="h-12 w-12 text-emerald-600 fill-emerald-400" />
                </div>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">No Reviews Yet</h4>
              <p className="text-gray-700 mb-8 leading-relaxed text-lg">
                Be the first to share your experience with this product! Your review will help other customers make informed decisions.
              </p>
              <div className="flex items-center justify-center gap-2 text-base text-emerald-700 font-medium">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <span>Your feedback matters</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-8">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-10 hover:shadow-2xl hover:border-emerald-200 transition-all duration-300"
                >
                  <div className="flex items-start gap-6 mb-6">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-lg">{review.userName}</span>
                            {review.verifiedPurchase && (
                              <span className="inline-flex items-center gap-1.5 text-xs px-4 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 rounded-full font-bold border-2 border-emerald-200 shadow-sm">
                                <CheckCircle className="h-4 w-4" />
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-5 w-5 ${
                                    star <= review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{review.rating}.0</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {review.title && (
                        <h4 className="font-bold text-gray-900 text-lg mb-3">{review.title}</h4>
                      )}
                      <p className="text-gray-700 leading-relaxed mb-4 text-base">{review.comment}</p>
                      
                      <div className="flex items-center gap-6 pt-6 border-t-2 border-gray-100">
                        <button
                          onClick={() => handleHelpful(review._id)}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                            helpfulVotes[review._id]
                              ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-300'
                              : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                          }`}
                        >
                          <ThumbsUp className={`h-5 w-5 ${helpfulVotes[review._id] ? 'fill-current' : ''}`} />
                          <span>Helpful</span>
                          {review.helpfulCount > 0 && (
                            <span className="text-sm font-bold">({review.helpfulCount})</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {review.adminResponse && (
                    <div className="mt-8 pt-8 border-t-2 border-emerald-100 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                            {companyInfo.name.charAt(0)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-bold text-emerald-900 mb-2">Response from {companyInfo.name}</p>
                          <p className="text-sm text-emerald-800 leading-relaxed mb-3">{review.adminResponse.message}</p>
                          <p className="text-xs text-emerald-700 font-semibold">
                            {formatDate(review.adminResponse.respondedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-8 py-3.5 border-2 border-emerald-200 rounded-xl hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg disabled:hover:shadow-md text-gray-700"
                >
                  Previous
                </button>
                <div className="px-8 py-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-xl border-2 border-emerald-200 shadow-md">
                  <span className="text-base font-bold text-gray-800">
                    Page <span className="text-emerald-600">{page}</span> of <span className="text-teal-600">{totalPages}</span>
                  </span>
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-8 py-3.5 border-2 border-emerald-200 rounded-xl hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg disabled:hover:shadow-md text-gray-700"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

