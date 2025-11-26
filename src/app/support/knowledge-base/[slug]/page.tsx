'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen, ThumbsUp, ArrowLeft, TrendingUp } from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface Article {
  _id: string;
  title: string;
  content: string;
  category: string;
  views: number;
  helpfulCount: number;
  helpfulUsers: string[];
}

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHelpful, setIsHelpful] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slug = Array.isArray(params?.slug) ? params?.slug[0] : params?.slug;

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/knowledge-base/${slug}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch article');
      }

      setArticle(data.article);
      setRelatedArticles(data.relatedArticles || []);
      
      // Check if user found it helpful
      if (isAuthenticated && user && data.article.helpfulUsers) {
        setIsHelpful(data.article.helpfulUsers.includes(user.userId));
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error('Failed to load article');
      router.push('/support/knowledge-base');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHelpful = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to mark articles as helpful');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/knowledge-base/${slug}/helpful`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update helpful status');
      }

      setIsHelpful(data.isHelpful);
      if (article) {
        setArticle({
          ...article,
          helpfulCount: data.helpfulCount,
        });
      }
      toast.success(data.isHelpful ? 'Marked as helpful' : 'Removed helpful mark');
    } catch (error) {
      console.error('Error updating helpful status:', error);
      toast.error('Failed to update helpful status');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <BackButton href="/support/knowledge-base" variant="with-label" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{article.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="capitalize">{article.category.replace('_', ' ')}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {article.views} views
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>

        {/* Helpful Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Was this article helpful?</h3>
          <button
            onClick={handleHelpful}
            disabled={isSubmitting || !isAuthenticated}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              isHelpful
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ThumbsUp className="h-5 w-5" />
            <span>{isHelpful ? 'Marked as Helpful' : 'Yes, this was helpful'}</span>
            <span className="text-sm">({article.helpfulCount})</span>
          </button>
          {!isAuthenticated && (
            <p className="text-sm text-gray-500 mt-2">Please log in to mark articles as helpful</p>
          )}
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Articles</h3>
            <div className="space-y-3">
              {relatedArticles.map((related) => (
                <a
                  key={related._id}
                  href={`/support/knowledge-base/${related.slug}`}
                  className="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{related.title}</h4>
                      {related.excerpt && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{related.excerpt}</p>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

