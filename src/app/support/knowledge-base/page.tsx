'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, BookOpen, HelpCircle, TrendingUp, Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface Article {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category: string;
  tags: string[];
  views: number;
  helpfulCount: number;
  isFeatured: boolean;
}

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'getting_started', label: 'Getting Started' },
  { value: 'orders', label: 'Orders' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'returns', label: 'Returns' },
  { value: 'payments', label: 'Payments' },
  { value: 'account', label: 'Account' },
  { value: 'troubleshooting', label: 'Troubleshooting' },
  { value: 'other', label: 'Other' },
];

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchArticles();
    fetchFeaturedArticles();
  }, [categoryFilter, searchQuery]);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/knowledge-base?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch articles');
      }

      setArticles(data.articles || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeaturedArticles = async () => {
    try {
      const response = await fetch('/api/knowledge-base?featured=true&limit=6');
      const data = await response.json();
      if (response.ok) {
        setFeaturedArticles(data.articles || []);
      }
    } catch (error) {
      console.error('Error fetching featured articles:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Knowledge Base</h1>
          <p className="text-blue-100 text-lg">Find answers to common questions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
        </div>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && !searchQuery && categoryFilter === 'all' && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900">Featured Articles</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredArticles.map((article) => (
                <Link
                  key={article._id}
                  href={`/support/knowledge-base/${article.slug}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <BookOpen className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                  </div>
                  {article.excerpt && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{article.excerpt}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {article.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="h-4 w-4" />
                      {article.helpfulCount} helpful
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  categoryFilter === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Articles List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article._id}
                href={`/support/knowledge-base/${article.slug}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                      {article.isFeatured && (
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    {article.excerpt && (
                      <p className="text-gray-600 mb-3 line-clamp-2">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="capitalize">{article.category.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{article.views} views</span>
                      <span>•</span>
                      <span>{article.helpfulCount} found helpful</span>
                    </div>
                  </div>
                  <BookOpen className="h-6 w-6 text-gray-400 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

