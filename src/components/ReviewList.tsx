'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, CheckCircle, Flag, MoreVertical, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const router = useRouter();
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'helpfulCount' | 'createdAt' | 'rating'>('helpfulCount');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});
  const [showReviewForm, setShowReviewForm] = useState(false);

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
    <div className="mt-8 mb-8">
      {/* Header with Write A Review Button */}
      <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          Customer Reviews
        </h2>
        <button
          onClick={() => {
            if (!user) {
              router.push('/login');
              return;
            }
            setShowReviewForm(!showReviewForm);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-medium text-sm transition-colors"
        >
          Write A Review
        </button>
      </div>

      {/* Review Form Modal/Inline */}
      {showReviewForm && user && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <ReviewForm 
            productId={productId} 
            onSuccess={() => {
              fetchReviews();
              setShowReviewForm(false);
            }}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* Top Reviews Sub-heading */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Top reviews from the United States
        </h3>
      </div>

      {/* Reviews List */}
      <div>

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
          <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200 my-4">
            <p className="text-gray-600 text-sm">No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="border-b border-gray-200 pb-6 last:border-b-0"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Left Column: Stars, Title, Reviewer Info */}
                    <div className="md:col-span-1">
                      {/* Star Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      
                      {/* Review Title */}
                      {review.title && (
                        <h4 className="font-bold text-gray-900 mb-3">{review.title}</h4>
                      )}
                      
                      {/* Reviewer Name and Verified Badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{review.userName}</span>
                        {review.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-900">
                            <CheckCircle className="h-4 w-4" />
                            Verified Buyer
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Review Text */}
                    <div className="md:col-span-2">
                      <p className="text-gray-900 leading-relaxed">{review.comment}</p>
                      
                      {/* Helpful Button */}
                      <div className="mt-4">
                        <button
                          onClick={() => handleHelpful(review._id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                            helpfulVotes[review._id]
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                              : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          <ThumbsUp className={`h-3.5 w-3.5 ${helpfulVotes[review._id] ? 'fill-current' : ''}`} />
                          <span>Helpful</span>
                          {review.helpfulCount > 0 && (
                            <span className="text-xs">({review.helpfulCount})</span>
                          )}
                        </button>
                      </div>

                      {/* Admin Response */}
                      {review.adminResponse && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-900 mb-1">Response from {companyInfo.name}</p>
                          <p className="text-xs text-gray-700 leading-relaxed mb-2">{review.adminResponse.message}</p>
                          <p className="text-xs text-gray-600">
                            {formatDate(review.adminResponse.respondedAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-emerald-200 rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium text-gray-700"
                >
                  Previous
                </button>
                <div className="px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-sm font-medium text-gray-800">
                    Page {page} of {totalPages}
                  </span>
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-emerald-200 rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium text-gray-700"
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

