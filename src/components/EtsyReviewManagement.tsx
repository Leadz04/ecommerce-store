'use client';

import { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  TrendingUp,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Smile,
  Frown,
  Meh,
  Sparkles,
  Copy,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Review {
  shop_id: number;
  listing_id: number;
  rating: number;
  review?: string;
  language: string;
  image_url_fullxfull?: string;
  create_timestamp: number;
  created_timestamp: number;
  update_timestamp?: number;
  updated_timestamp?: number;
  buyer_user_id?: number;
  transaction_id?: number;
  sentiment?: {
    sentiment: 'positive' | 'neutral' | 'negative';
    sentimentScore: number;
    keyTopics: string[];
    emotions: string[];
    needsResponse: boolean;
    urgency: 'low' | 'medium' | 'high';
    summary: string;
    suggestedAction: string;
  };
  aiResponse?: {
    response: string;
    tone: string;
    keyPoints: string[];
    length: number;
  };
}

interface ReviewStats {
  total: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  withText: number;
  withImages: number;
}

export default function EtsyReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string>('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterSentiment, setFilterSentiment] = useState<string | null>(null);
  const [analyzingSentiment, setAnalyzingSentiment] = useState<Set<number>>(new Set());
  const [generatingResponse, setGeneratingResponse] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchShopAndReviews();
  }, []);

  const fetchShopAndReviews = async () => {
    try {
      setLoading(true);

      // Get shop info
      const token = localStorage.getItem('token');
      const statusRes = await fetch('/api/etsy/status', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const statusJson = await statusRes.json();

      if (!statusJson.success || !statusJson.connected || !statusJson.shop?.shopId) {
        toast.error('No active Etsy shop connected');
        return;
      }

      const activeShopId = statusJson.shop.shopId;
      const activeShopName = statusJson.shop.shopName;
      setShopId(activeShopId);
      setShopName(activeShopName);

      // Fetch reviews
      const reviewsRes = await fetch(`/api/etsy/reviews?shopId=${activeShopId}&limit=100`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const reviewsData = await reviewsRes.json();

      if (reviewsData.success) {
        setReviews(reviewsData.reviews || []);
        setStats(reviewsData.stats || null);
      } else {
        toast.error('Failed to fetch reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeSentiment = async (review: Review) => {
    if (!review.review || review.review.trim().length === 0) {
      toast.error('This review has no text to analyze');
      return;
    }

    const reviewKey = review.listing_id;
    setAnalyzingSentiment((prev) => new Set(prev).add(reviewKey));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/etsy/reviews/sentiment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reviewText: review.review,
          rating: review.rating,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sentiment analysis failed');
      }

      // Update review with sentiment
      setReviews((prev) =>
        prev.map((r) =>
          r.listing_id === review.listing_id ? { ...r, sentiment: data.sentiment } : r
        )
      );

      toast.success('Sentiment analyzed successfully');
    } catch (error: any) {
      console.error('Sentiment analysis error:', error);
      toast.error(error.message || 'Failed to analyze sentiment');
    } finally {
      setAnalyzingSentiment((prev) => {
        const next = new Set(prev);
        next.delete(reviewKey);
        return next;
      });
    }
  };

  const handleGenerateResponse = async (review: Review) => {
    if (!review.review || review.review.trim().length === 0) {
      toast.error('This review has no text to generate a response for');
      return;
    }

    const reviewKey = review.listing_id;
    setGeneratingResponse((prev) => new Set(prev).add(reviewKey));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/etsy/reviews/generate-response', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reviewText: review.review,
          rating: review.rating,
          shopName: shopName,
          sentiment: review.sentiment?.sentiment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Response generation failed');
      }

      // Update review with AI response
      setReviews((prev) =>
        prev.map((r) =>
          r.listing_id === review.listing_id ? { ...r, aiResponse: data.response } : r
        )
      );

      toast.success('Response generated successfully');
    } catch (error: any) {
      console.error('Response generation error:', error);
      toast.error(error.message || 'Failed to generate response');
    } finally {
      setGeneratingResponse((prev) => {
        const next = new Set(prev);
        next.delete(reviewKey);
        return next;
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSentimentIcon = (sentiment?: string) => {
    if (!sentiment) return null;
    switch (sentiment) {
      case 'positive':
        return <Smile className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <Frown className="h-4 w-4 text-red-600" />;
      case 'neutral':
        return <Meh className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    if (filterRating && review.rating !== filterRating) return false;
    if (filterSentiment && review.sentiment?.sentiment !== filterSentiment) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Loading reviews...</span>
      </div>
    );
  }

  if (!shopId) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No active Etsy shop connected. Please connect your shop first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            Review Management & Reputation Builder
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage reviews, analyze sentiment, and generate professional responses
          </p>
        </div>
        <button
          onClick={fetchShopAndReviews}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                  {stats.averageRating.toFixed(1)}
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Text</p>
                <p className="text-2xl font-bold text-gray-900">{stats.withText}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Images</p>
                <p className="text-2xl font-bold text-gray-900">{stats.withImages}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {stats && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3">Rating Distribution</h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium text-gray-700">{rating}</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <button
            onClick={() => setFilterRating(null)}
            className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
              filterRating === null
                ? 'bg-purple-100 border-purple-300 text-purple-700'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Ratings
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setFilterRating(rating)}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors flex items-center gap-1 ${
                filterRating === rating
                  ? 'bg-purple-100 border-purple-300 text-purple-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              {rating}
            </button>
          ))}
          <div className="border-l border-gray-300 h-6 mx-2" />
          <button
            onClick={() => setFilterSentiment(null)}
            className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
              filterSentiment === null
                ? 'bg-purple-100 border-purple-300 text-purple-700'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Sentiments
          </button>
          {['positive', 'neutral', 'negative'].map((sentiment) => (
            <button
              key={sentiment}
              onClick={() => setFilterSentiment(sentiment)}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors capitalize ${
                filterSentiment === sentiment
                  ? 'bg-purple-100 border-purple-300 text-purple-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {sentiment}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No reviews found</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.listing_id}
              className="bg-white rounded-lg border border-gray-200 p-6 space-y-4"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-600">
                        {formatDate(review.created_timestamp || review.create_timestamp)}
                      </span>
                      {review.sentiment && (
                        <div className="flex items-center gap-1">
                          {getSentimentIcon(review.sentiment.sentiment)}
                          <span className="text-xs px-2 py-0.5 rounded-full border bg-white capitalize">
                            {review.sentiment.sentiment}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href={`https://www.etsy.com/listing/${review.listing_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-600 hover:text-purple-800"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {/* Review Text */}
              {review.review && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 whitespace-pre-wrap">{review.review}</p>
                </div>
              )}

              {/* Review Image */}
              {review.image_url_fullxfull && (
                <div>
                  <img
                    src={review.image_url_fullxfull}
                    alt="Review photo"
                    className="max-w-xs rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {/* Sentiment Analysis */}
              {review.sentiment && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-blue-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Sentiment Analysis
                    </h5>
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${getUrgencyColor(
                        review.sentiment.urgency
                      )}`}
                    >
                      {review.sentiment.urgency} priority
                    </span>
                  </div>
                  <p className="text-sm text-blue-800 mb-2">{review.sentiment.summary}</p>
                  {review.sentiment.keyTopics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {review.sentiment.keyTopics.map((topic, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                  {review.sentiment.needsResponse && (
                    <p className="text-xs text-blue-700 mt-2 font-medium">
                      ⚠️ Response recommended: {review.sentiment.suggestedAction}
                    </p>
                  )}
                </div>
              )}

              {/* AI Generated Response */}
              {review.aiResponse && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-green-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI Generated Response
                    </h5>
                    <button
                      onClick={() => copyToClipboard(review.aiResponse!.response)}
                      className="text-xs text-green-700 hover:text-green-900 flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </button>
                  </div>
                  <p className="text-sm text-green-800 whitespace-pre-wrap mb-2">
                    {review.aiResponse.response}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-green-700">Tone: {review.aiResponse.tone}</span>
                    <span className="text-xs text-green-700">
                      Length: {review.aiResponse.length} chars
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                {!review.sentiment && review.review && (
                  <button
                    onClick={() => handleAnalyzeSentiment(review)}
                    disabled={analyzingSentiment.has(review.listing_id)}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {analyzingSentiment.has(review.listing_id) ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        Analyze Sentiment
                      </>
                    )}
                  </button>
                )}
                {!review.aiResponse && review.review && (
                  <button
                    onClick={() => handleGenerateResponse(review)}
                    disabled={generatingResponse.has(review.listing_id)}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {generatingResponse.has(review.listing_id) ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-3 w-3" />
                        Generate Response
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

