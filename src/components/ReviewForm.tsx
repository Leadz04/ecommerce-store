'use client';

import { useState } from 'react';
import { Star, X, Send, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

interface ReviewFormProps {
  productId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({ productId, onSuccess, onCancel }: ReviewFormProps) {
  const { isAuthenticated, user } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <p className="text-gray-700 text-center">
          Please <a href="/login" className="text-blue-600 hover:underline font-semibold">log in</a> to write a review.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          images,
          verifiedPurchase: false, // TODO: Check if user purchased
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        const errorMessage = data?.error || `Failed to submit review (${response.status})`;
        console.error('Review submission error:', {
          status: response.status,
          error: data?.error,
          data,
        });
        throw new Error(errorMessage);
      }

      toast.success('Review submitted! It will be published after approval.');
      setRating(0);
      setTitle('');
      setComment('');
      setImages([]);
      setShowForm(false);
      onSuccess();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-10 hover:shadow-2xl transition-all duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 rounded-full mb-6 shadow-lg">
            <Star className="h-10 w-10 text-emerald-600 fill-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Share Your Experience</h3>
          <p className="text-gray-600 text-base">Help other customers by writing a review</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white py-5 px-8 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-[1.02] active:scale-100"
        >
          Write a Review
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-10">
      <div className="flex items-center justify-between mb-10 pb-8 border-b-2 border-gray-100">
        <div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">Write a Review</h3>
          <p className="text-gray-600 text-base">Your feedback helps others make better decisions</p>
        </div>
        {onCancel && (
          <button
            onClick={() => {
              setShowForm(false);
              onCancel();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Rating Selection */}
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-8 border-2 border-emerald-200">
          <label className="block text-lg font-bold text-gray-900 mb-6">
            Your Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-all duration-200 hover:scale-125 active:scale-95"
              >
                <Star
                  className={`h-12 w-12 transition-all duration-200 ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-current drop-shadow-lg'
                      : 'text-gray-300 hover:text-yellow-200'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <div className="ml-6 px-6 py-3 bg-white rounded-xl border-2 border-emerald-200 shadow-md">
                <span className="text-lg font-bold text-gray-900">
                  {rating === 5 ? '⭐ Excellent' : rating === 4 ? '👍 Good' : rating === 3 ? '😐 Average' : rating === 2 ? '👎 Poor' : '❌ Very Poor'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Review Title */}
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-4">
            Review Title <span className="text-gray-500 font-normal text-sm">(Optional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your review in a few words"
            maxLength={200}
            className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-base shadow-md hover:shadow-lg"
          />
        </div>

        {/* Review Comment */}
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-4">
            Your Review <span className="text-red-500">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product... What did you like? What could be improved?"
            rows={10}
            maxLength={2000}
            required
            className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all resize-none text-base shadow-md hover:shadow-lg"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-gray-600 font-medium">
              {comment.length}/2000 characters
            </p>
            {comment.length > 1800 && (
              <p className="text-sm text-orange-600 font-semibold">
                {2000 - comment.length} characters remaining
              </p>
            )}
          </div>
        </div>

        {/* Image Upload (Placeholder) */}
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-4">
            Photos <span className="text-gray-500 font-normal text-sm">(Optional)</span>
          </label>
          <div className="border-2 border-dashed border-emerald-300 rounded-xl p-10 text-center bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-all cursor-pointer group">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-lg">
              <ImageIcon className="h-10 w-10 text-emerald-600" />
            </div>
            <p className="text-base font-semibold text-gray-700 mb-2">Add photos to your review</p>
            <p className="text-sm text-gray-500">Image upload coming soon</p>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-5 pt-6">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0 || !comment.trim()}
            className="flex-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white py-5 px-8 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-100"
          >
            <Send className="h-5 w-5" />
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                onCancel();
              }}
              className="px-8 py-5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

