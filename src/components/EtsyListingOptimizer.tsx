'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, CheckCircle, AlertCircle, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEtsyShopStore } from '@/store/etsyShopStore';

interface Listing {
  listing_id: number;
  title: string;
  description: string;
  tags: string[];
  url: string;
}

interface OptimizationResult {
  mode: string;
  listingId: string;
  original: {
    title: string;
    description: string;
    tags: string[];
  };
  optimized: any;
}

export default function EtsyListingOptimizer({ shopId: propShopId }: { shopId: string | null }) {
  const { selectedShopId, getSelectedShop, fetchShops } = useEtsyShopStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [optimizationMode, setOptimizationMode] = useState<'title' | 'description' | 'tags' | 'all'>('all');
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  
  // Use prop shopId if provided, otherwise use selected shop from store
  const shopId = propShopId || selectedShopId;

  // Basic HTML entity decoding for titles coming from Etsy (e.g. Men&#39;s → Men's)
  const decodeHtmlEntities = (value: string) => {
    if (!value) return '';
    return value
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  useEffect(() => {
    // Fetch shops on mount if not already loaded
    fetchShops();
  }, []);

  useEffect(() => {
    if (shopId) {
      fetchListings();
    } else {
      setListings([]);
      setLoading(false);
    }
  }, [shopId]);

  const fetchListings = async () => {
    if (!shopId) return;
    
    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      // Fetch listings from Etsy
      const listingsRes = await fetch(`/api/etsy/listings?shopId=${shopId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const listingsData = await listingsRes.json();
      
      if (listingsData.success && listingsData.listings) {
        setListings(listingsData.listings);
      } else {
        toast.error('Failed to fetch listings');
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  if (!shopId) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Please select a shop to optimize listings.</p>
      </div>
    );
  }

  const handleOptimize = async () => {
    if (!selectedListing || !shopId) {
      toast.error('Please select a listing first');
      return;
    }

    try {
      setOptimizing(true);
      setResult(null);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/etsy/listing-optimizer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          listingId: selectedListing.listing_id.toString(),
          mode: optimizationMode,
          shopId: shopId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Optimization failed');
      }

      setResult(data);
      toast.success('Listing optimized successfully!');
    } catch (error: any) {
      console.error('Optimization error:', error);
      toast.error(error.message || 'Failed to optimize listing');
    } finally {
      setOptimizing(false);
    }
  };

  const handleApplyOptimization = async () => {
    if (!result || !selectedListing || !shopId) {
      return;
    }

    try {
      const updateData: any = {};
      const optimized = result.optimized;

      if (optimizationMode === 'title' || optimizationMode === 'all') {
        const title = optimizationMode === 'all' ? optimized.title?.optimized_title : optimized.optimized_title;
        if (title) updateData.title = title;
      }

      if (optimizationMode === 'description' || optimizationMode === 'all') {
        const description = optimizationMode === 'all' ? optimized.description?.optimized_description : optimized.optimized_description;
        if (description) updateData.description = description;
      }

      if (optimizationMode === 'tags' || optimizationMode === 'all') {
        const tags = optimizationMode === 'all' ? optimized.tags?.optimized_tags : optimized.optimized_tags;
        if (tags) updateData.tags = tags;
      }

      const token = localStorage.getItem('token');
      // Send shopId in both query params and body for compatibility
      const response = await fetch(`/api/etsy/listings/${selectedListing.listing_id}?shopId=${shopId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...updateData,
          shopId: shopId, // Include shopId in body as well
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update listing');
      }

      toast.success('Listing updated successfully!');
      setResult(null);
      fetchListings();
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update listing');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Loading listings...</span>
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
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Listing Optimizer
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Optimize your Etsy listings with AI-powered SEO improvements
          </p>
        </div>
        <button
          onClick={fetchListings}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Listing Selection */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3">Select Listing to Optimize</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {listings.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No listings found</p>
              ) : (
                listings.map((listing) => (
                  <div
                    key={listing.listing_id}
                    onClick={() => {
                      setSelectedListing(listing);
                      setResult(null);
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedListing?.listing_id === listing.listing_id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                  >
                    <h5 className="font-medium text-sm text-gray-900 line-clamp-2">
                      {decodeHtmlEntities(listing.title)}
                    </h5>
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {listing.listing_id}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Optimization Mode Selection */}
          {selectedListing && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3">Optimization Mode</h4>
              <div className="grid grid-cols-2 gap-2">
                {(['title', 'description', 'tags', 'all'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setOptimizationMode(mode)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                      optimizationMode === mode
                        ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                        : 'border-gray-200 hover:border-gray-300 text-gray-900'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              <button
                onClick={handleOptimize}
                disabled={optimizing}
                className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {optimizing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Optimize Listing
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {!selectedListing && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Select a listing to start optimization</p>
            </div>
          )}

          {selectedListing && !result && !optimizing && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-8 text-center">
              <AlertCircle className="h-10 w-10 mx-auto mb-3 text-blue-500" />
              <p className="text-blue-900 font-medium mb-1">Ready to Optimize</p>
              <p className="text-sm text-blue-700">
                Select an optimization mode and click "Optimize Listing" to get AI-powered suggestions
              </p>
            </div>
          )}

          {optimizing && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-3 text-purple-600 animate-spin" />
              <p className="text-gray-700 font-medium">Optimizing listing...</p>
              <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Optimization Results
                  </h4>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    SEO Score: {result.optimized.overall_seo_score || result.optimized.seo_score || 'N/A'}
                  </span>
                </div>

                {/* Display optimized content based on mode */}
                {(optimizationMode === 'title' || optimizationMode === 'all') && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-700">Title</h5>
                      {result.optimized.title?.seo_score && (
                        <span className="text-xs text-purple-600">
                          Score: {result.optimized.title.seo_score}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Original:</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-200 line-clamp-2">
                          {result.original.title}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-purple-600 mx-auto" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Optimized:</p>
                        <p className="text-sm text-gray-900 bg-purple-50 p-2 rounded border border-purple-200 font-medium">
                          {optimizationMode === 'all' ? result.optimized.title?.optimized_title : result.optimized.optimized_title}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {(optimizationMode === 'description' || optimizationMode === 'all') && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-700">Description</h5>
                      {result.optimized.description?.seo_score && (
                        <span className="text-xs text-purple-600">
                          Score: {result.optimized.description.seo_score}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Original:</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-200 max-h-32 overflow-y-auto">
                          {result.original.description.substring(0, 200)}...
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-purple-600 mx-auto" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Optimized:</p>
                        <p className="text-sm text-gray-900 bg-purple-50 p-2 rounded border border-purple-200 max-h-32 overflow-y-auto">
                          {optimizationMode === 'all' ? result.optimized.description?.optimized_description?.substring(0, 200) : result.optimized.optimized_description?.substring(0, 200)}...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {(optimizationMode === 'tags' || optimizationMode === 'all') && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-700">Tags</h5>
                      {result.optimized.tags?.seo_score && (
                        <span className="text-xs text-purple-600">
                          Score: {result.optimized.tags.seo_score}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Original:</p>
                        <div className="flex flex-wrap gap-1">
                          {result.original.tags.map((tag, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-purple-600 mx-auto" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Optimized:</p>
                        <div className="flex flex-wrap gap-1">
                          {(optimizationMode === 'all' ? result.optimized.tags?.optimized_tags : result.optimized.optimized_tags || []).map((tag: string, i: number) => (
                            <span key={i} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Improvements */}
                {(result.optimized.improvements || result.optimized.priority_improvements) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Key Improvements</h5>
                    <ul className="space-y-1">
                      {(result.optimized.priority_improvements || result.optimized.improvements || []).map((improvement: string, i: number) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="text-purple-600 mt-0.5">•</span>
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Apply Button */}
                <button
                  onClick={handleApplyOptimization}
                  className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Apply Optimizations to Listing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

