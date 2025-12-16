'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Settings,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Listing {
  listing_id: number;
  title: string;
  price: number | {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  currency?: string;
  quantity: number;
  views: number;
  num_favorers: number;
  url?: string;
  images?: Array<{ url: string; rank?: number; listingImageId?: string }>;
}

interface PriceOptimization {
  suggestedPrice: number;
  changePercent: number;
  reasoning: string;
  confidence: number;
  strategy: string;
  riskLevel: 'low' | 'medium' | 'high';
  expectedImpact: {
    salesVelocity: string;
    revenue: string;
    margin: string;
  };
}

interface RepricingRule {
  listingId: string;
  newPrice: number;
  reason: string;
  ruleType: string;
  oldPrice: number;
  optimization?: PriceOptimization;
}

export default function EtsyRepricingEngine() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState<PriceOptimization | null>(null);
  const [repricingRules, setRepricingRules] = useState<RepricingRule[]>([]);
  const [applying, setApplying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Rule settings
  const [ruleType, setRuleType] = useState<'ai' | 'inventory' | 'demand' | 'manual'>('ai');
  const [inventoryThreshold, setInventoryThreshold] = useState(10);
  const [inventoryIncreasePercent, setInventoryIncreasePercent] = useState(10);
  const [demandIncreasePercent, setDemandIncreasePercent] = useState(5);

  useEffect(() => {
    fetchShopAndListings();
  }, []);

  const fetchShopAndListings = async () => {
    try {
      setLoading(true);

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
      setShopId(activeShopId);

      const listingsRes = await fetch(`/api/etsy/listings?shopId=${activeShopId}`, {
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

  const getListingPrice = (listing: Listing): number => {
    if (typeof listing.price === 'number') {
      return listing.price || 0;
    }
    if (listing.price && typeof listing.price === 'object' && 'amount' in listing.price && 'divisor' in listing.price) {
      return listing.price.divisor > 0 ? listing.price.amount / listing.price.divisor : 0;
    }
    return 0;
  };

  const handleOptimizePrice = async (listing: Listing) => {
    setSelectedListing(listing);
    setOptimization(null);
    setOptimizing(true);

    try {
      const currentPrice = getListingPrice(listing);

      const response = await fetch('/api/etsy/repricing/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          listingId: listing.listing_id.toString(),
          currentPrice,
          quantity: listing.quantity,
          views: listing.views,
          favorers: listing.num_favorers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Optimization failed');
      }

      setOptimization(data.optimization);
      
      if (data.fallback) {
        toast.success('Price optimized using rule-based pricing', {
          duration: 5000,
          icon: '⚠️',
        });
        if (data.message) {
          toast(data.message, { 
            duration: 6000,
            icon: 'ℹ️',
          });
        }
      } else {
        toast.success('Price optimized successfully!');
      }
    } catch (error: any) {
      console.error('Optimization error:', error);
      toast.error(error.message || 'Failed to optimize price');
    } finally {
      setOptimizing(false);
    }
  };

  const handleAddToRepricingRules = (listing: Listing, newPrice: number, reason: string, ruleType: string) => {
    const currentPrice = getListingPrice(listing);
    const existingIndex = repricingRules.findIndex((r) => r.listingId === listing.listing_id.toString());

    const rule: RepricingRule = {
      listingId: listing.listing_id.toString(),
      newPrice,
      reason,
      ruleType,
      oldPrice: currentPrice,
      optimization: optimization || undefined,
    };

    if (existingIndex >= 0) {
      const updated = [...repricingRules];
      updated[existingIndex] = rule;
      setRepricingRules(updated);
    } else {
      setRepricingRules([...repricingRules, rule]);
    }

    toast.success('Added to repricing rules');
  };

  const handleApplyInventoryBasedRules = async () => {
    if (!shopId) return;

    try {
      const rules: RepricingRule[] = [];
      
      for (const listing of listings) {
        const currentPrice = getListingPrice(listing);
        
        if (listing.quantity <= inventoryThreshold && listing.quantity > 0) {
          const newPrice = currentPrice * (1 + inventoryIncreasePercent / 100);
          rules.push({
            listingId: listing.listing_id.toString(),
            newPrice: parseFloat(newPrice.toFixed(2)),
            reason: `Low inventory (${listing.quantity} items) - applying scarcity premium`,
            ruleType: 'inventory',
            oldPrice: currentPrice,
          });
        }
      }

      if (rules.length === 0) {
        toast('No listings match the inventory threshold criteria', {
          icon: 'ℹ️',
        });
        return;
      }

      setRepricingRules(rules);
      setShowPreview(true);
      toast.success(`Found ${rules.length} listings for repricing`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate rules');
    }
  };

  const handleApplyAllAIOptimizations = async () => {
    if (!shopId || listings.length === 0) return;

    try {
      setOptimizing(true);
      const rules: RepricingRule[] = [];

      for (const listing of listings) {
        const currentPrice = getListingPrice(listing);

        const response = await fetch('/api/etsy/repricing/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopId,
            listingId: listing.listing_id.toString(),
            currentPrice,
            quantity: listing.quantity,
            views: listing.views,
            favorers: listing.num_favorers,
          }),
        });

        const data = await response.json();

        if (response.ok && data.optimization) {
          rules.push({
            listingId: listing.listing_id.toString(),
            newPrice: data.optimization.suggestedPrice,
            reason: data.optimization.reasoning,
            ruleType: 'ai',
            oldPrice: currentPrice,
            optimization: data.optimization,
          });
        }

        // Small delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setRepricingRules(rules);
      setShowPreview(true);
      toast.success(`Optimized ${rules.length} listings`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to optimize all listings');
    } finally {
      setOptimizing(false);
    }
  };

  const handleApplyRepricing = async () => {
    if (repricingRules.length === 0) {
      toast.error('No repricing rules to apply');
      return;
    }

    if (!confirm(`Are you sure you want to update prices for ${repricingRules.length} listing(s)?`)) {
      return;
    }

    try {
      setApplying(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/etsy/repricing/apply', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          shopId,
          repricingRules: repricingRules.map((r) => ({
            listingId: r.listingId,
            newPrice: r.newPrice,
            reason: r.reason,
            ruleType: r.ruleType,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Repricing failed');
      }

      if (data.errors && data.errors.length > 0) {
        toast.error(`${data.summary.successful} updated, ${data.errors.length} failed`);
      } else {
        toast.success(`Successfully updated ${data.summary.successful} listing(s)!`);
      }

      setRepricingRules([]);
      setShowPreview(false);
      fetchShopAndListings();
    } catch (error: any) {
      console.error('Apply error:', error);
      toast.error(error.message || 'Failed to apply repricing');
    } finally {
      setApplying(false);
    }
  };

  const getPriceChangeIcon = (oldPrice: number, newPrice: number) => {
    if (newPrice > oldPrice) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (newPrice < oldPrice) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
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
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Smart Repricing Engine
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered price optimization and automated repricing rules
          </p>
        </div>
        <button
          onClick={fetchShopAndListings}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleApplyAllAIOptimizations}
          disabled={optimizing || listings.length === 0}
          className="p-4 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">AI Optimize All</p>
              <p className="text-xs text-gray-600">Optimize prices for all listings</p>
            </div>
          </div>
        </button>

        <button
          onClick={handleApplyInventoryBasedRules}
          disabled={listings.length === 0}
          className="p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Inventory-Based</p>
              <p className="text-xs text-gray-600">Price low inventory items</p>
            </div>
          </div>
        </button>

        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Settings className="h-5 w-5 text-gray-600" />
            </div>
            <div className="text-left flex-1">
              <p className="font-medium text-gray-900">Rules Queue</p>
              <p className="text-xs text-gray-600">{repricingRules.length} rule(s) pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Rule Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-4">Inventory-Based Pricing Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Low Inventory Threshold
            </label>
            <input
              type="number"
              value={inventoryThreshold}
              onChange={(e) => setInventoryThreshold(parseInt(e.target.value) || 10)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Items with quantity ≤ this will get price increase
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Increase (%)
            </label>
            <input
              type="number"
              value={inventoryIncreasePercent}
              onChange={(e) => setInventoryIncreasePercent(parseFloat(e.target.value) || 10)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">Percentage increase for low inventory items</p>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {listings.slice(0, 10).map((listing) => {
          const currentPrice = getListingPrice(listing);
          const rule = repricingRules.find((r) => r.listingId === listing.listing_id.toString());

          return (
            <div
              key={listing.listing_id}
              className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                {(() => {
                  const firstImage = listing.images?.[0];
                  const imageUrl = firstImage?.url || firstImage?.url_fullxfull || firstImage?.url_570xN || firstImage?.url_75x75;
                  
                  if (imageUrl) {
                    return (
                      <div className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23e5e7eb" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        {listing.images && listing.images.length > 1 && (
                          <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1 rounded-tl">
                            +{listing.images.length - 1}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0 flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{listing.title}</h4>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ${currentPrice.toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      Qty: {listing.quantity}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {listing.views}
                    </span>
                  </div>
                </div>
              </div>

              {rule && (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-purple-900">New Price</span>
                    <div className="flex items-center gap-1">
                      {getPriceChangeIcon(rule.oldPrice, rule.newPrice)}
                      <span className="text-lg font-bold text-purple-700">
                        ${rule.newPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-purple-700">{rule.reason}</p>
                </div>
              )}

              {selectedListing?.listing_id === listing.listing_id && optimizing && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  <span className="ml-2 text-sm text-gray-600">Optimizing...</span>
                </div>
              )}

              {selectedListing?.listing_id === listing.listing_id && optimization && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      {optimization.confidence < 80 ? 'Rule-Based' : 'AI'} Suggestion
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-200 text-blue-700 rounded-full">
                      {optimization.confidence}% confidence
                    </span>
                  </div>
                  {optimization.confidence < 80 && (
                    <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      ⚠️ Using rule-based pricing. AI quota exceeded - upgrade your Gemini API plan for AI-powered recommendations.
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Recommended Price</span>
                    <div className="flex items-center gap-1">
                      {getPriceChangeIcon(currentPrice, optimization.suggestedPrice)}
                      <span className="text-lg font-bold text-blue-700">
                        ${optimization.suggestedPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-800 mb-2">{optimization.reasoning}</p>
                  <button
                    onClick={() =>
                      handleAddToRepricingRules(
                        listing,
                        optimization.suggestedPrice,
                        optimization.reasoning,
                        'ai'
                      )
                    }
                    className="w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add to Rules
                  </button>
                </div>
              )}

              <button
                onClick={() => handleOptimizePrice(listing)}
                disabled={optimizing && selectedListing?.listing_id === listing.listing_id}
                className="w-full px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Optimize Price
              </button>
            </div>
          );
        })}
      </div>

      {/* Preview & Apply */}
      {repricingRules.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              Repricing Preview ({repricingRules.length} listing(s))
            </h4>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
          </div>

          {showPreview && (
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {repricingRules.map((rule, index) => {
                const listing = listings.find((l) => l.listing_id.toString() === rule.listingId);
                const changePercent = ((rule.newPrice - rule.oldPrice) / rule.oldPrice) * 100;

                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{listing?.title || `Listing ${rule.listingId}`}</p>
                        <p className="text-xs text-gray-600 mt-1">{rule.reason}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 line-through">${rule.oldPrice.toFixed(2)}</span>
                          {getPriceChangeIcon(rule.oldPrice, rule.newPrice)}
                          <span className="text-lg font-bold text-purple-700">
                            ${rule.newPrice.toFixed(2)}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {changePercent >= 0 ? '+' : ''}
                          {changePercent.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Total price changes: {repricingRules.length}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setRepricingRules([]);
                  setShowPreview(false);
                }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleApplyRepricing}
                disabled={applying}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Apply Repricing ({repricingRules.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

