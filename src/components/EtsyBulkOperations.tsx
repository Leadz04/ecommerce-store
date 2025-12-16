'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Package,
  Tag,
  Clock,
  Truck,
  Filter,
  Search,
  X,
  Eye,
  CheckSquare,
  Square,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Listing {
  listing_id: number;
  title: string;
  description: string;
  tags: string[];
  url: string;
  price: number | {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  currency?: string;
  quantity: number;
  views: number;
  num_favorers: number;
  state: string;
  processing_min?: number;
  processing_max?: number;
  shipping_template_id?: number;
}

interface BulkOperation {
  type: 'price' | 'quantity' | 'tags' | 'processing_time' | 'shipping_template';
  action: 'set' | 'increase' | 'decrease' | 'add' | 'remove' | 'replace';
  value: string;
  value2?: string;
}

export default function EtsyBulkOperations() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [selectedListingIds, setSelectedListingIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewResults, setPreviewResults] = useState<any[]>([]);
  const [applying, setApplying] = useState(false);

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

  // Helper function to get price value safely
  const getPrice = (listing: Listing): number => {
    if (typeof listing.price === 'number') {
      return listing.price;
    }
    if (listing.price && typeof listing.price === 'object' && 'amount' in listing.price && 'divisor' in listing.price) {
      return listing.price.amount / listing.price.divisor;
    }
    return 0;
  };

  // Helper function to get currency code
  const getCurrency = (listing: Listing): string => {
    if (listing.currency) {
      return listing.currency;
    }
    if (listing.price && typeof listing.price === 'object' && 'currency_code' in listing.price) {
      return listing.price.currency_code || 'USD';
    }
    return 'USD';
  };

  // Operation state
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [operationType, setOperationType] = useState<'price' | 'quantity' | 'tags' | 'processing_time' | 'shipping_template'>('price');
  const [operationAction, setOperationAction] = useState<'set' | 'increase' | 'decrease' | 'add' | 'remove' | 'replace'>('set');
  const [operationValue, setOperationValue] = useState('');
  const [operationValue2, setOperationValue2] = useState('');

  useEffect(() => {
    fetchShopAndListings();
  }, []);

  useEffect(() => {
    // Filter listings based on search
    if (!searchQuery.trim()) {
      setFilteredListings(listings);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredListings(
        listings.filter(
          (listing) =>
            listing.title.toLowerCase().includes(query) ||
            listing.tags.some((tag) => tag.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, listings]);

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

  const handleSelectListing = (listingId: number) => {
    setSelectedListingIds((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) {
        next.delete(listingId);
      } else {
        next.add(listingId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedListingIds.size === filteredListings.length) {
      setSelectedListingIds(new Set());
    } else {
      setSelectedListingIds(new Set(filteredListings.map((l) => l.listing_id)));
    }
  };

  const handleAddOperation = () => {
    if (!operationValue.trim()) {
      toast.error('Please enter a value for the operation');
      return;
    }

    const newOp: BulkOperation = {
      type: operationType,
      action: operationAction,
      value: operationValue,
      ...(operationAction === 'replace' && operationValue2 ? { value2: operationValue2 } : {}),
    };

    setOperations([...operations, newOp]);
    setOperationValue('');
    setOperationValue2('');
    toast.success('Operation added');
  };

  const handleRemoveOperation = (index: number) => {
    setOperations(operations.filter((_, i) => i !== index));
  };

  const handlePreview = async () => {
    if (selectedListingIds.size === 0) {
      toast.error('Please select at least one listing');
      return;
    }

    if (operations.length === 0) {
      toast.error('Please add at least one operation');
      return;
    }

    try {
      setShowPreview(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/etsy/bulk-operations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          shopId,
          listingIds: Array.from(selectedListingIds).map((id) => id.toString()),
          operations,
          preview: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Preview failed');
      }

      setPreviewResults(data.results || []);
      toast.success(`Preview ready for ${data.results.length} listings`);
    } catch (error: any) {
      console.error('Preview error:', error);
      toast.error(error.message || 'Failed to generate preview');
      setShowPreview(false);
    }
  };

  const handleApply = async () => {
    if (selectedListingIds.size === 0) {
      toast.error('Please select at least one listing');
      return;
    }

    if (operations.length === 0) {
      toast.error('Please add at least one operation');
      return;
    }

    if (!confirm(`Are you sure you want to apply these changes to ${selectedListingIds.size} listing(s)?`)) {
      return;
    }

    try {
      setApplying(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/etsy/bulk-operations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          shopId,
          listingIds: Array.from(selectedListingIds).map((id) => id.toString()),
          operations,
          preview: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bulk operation failed');
      }

      if (data.errors && data.errors.length > 0) {
        toast.error(`${data.summary.processed} updated, ${data.errors.length} failed`);
      } else {
        toast.success(`Successfully updated ${data.summary.processed} listing(s)!`);
      }

      // Reset and refresh
      setOperations([]);
      setSelectedListingIds(new Set());
      setShowPreview(false);
      setPreviewResults([]);
      fetchShopAndListings();
    } catch (error: any) {
      console.error('Apply error:', error);
      toast.error(error.message || 'Failed to apply bulk operations');
    } finally {
      setApplying(false);
    }
  };

  const getActionOptions = () => {
    switch (operationType) {
      case 'price':
        return ['set', 'increase', 'decrease'];
      case 'quantity':
        return ['set', 'increase', 'decrease'];
      case 'tags':
        return ['set', 'add', 'remove', 'replace'];
      case 'processing_time':
        return ['set'];
      case 'shipping_template':
        return ['set'];
      default:
        return [];
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
            <Layers className="h-5 w-5 text-purple-600" />
            Bulk Operations Manager
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Edit multiple listings at once - prices, quantities, tags, and more
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Listings Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                />
              </div>
              <button
                onClick={handleSelectAll}
                className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                {selectedListingIds.size === filteredListings.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              {selectedListingIds.size} of {filteredListings.length} listings selected
            </div>
          </div>

          {/* Listings List */}
          <div className="bg-white rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
            {filteredListings.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No listings found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredListings.map((listing) => {
                  const isSelected = selectedListingIds.has(listing.listing_id);
                  const price = getPrice(listing);
                  const currency = getCurrency(listing);
                  const decodedTitle = decodeHtmlEntities(listing.title);
                  return (
                    <div
                      key={listing.listing_id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''
                      }`}
                      onClick={() => handleSelectListing(listing.listing_id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-purple-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        {listing.images && listing.images.length > 0 && (
                          <div className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                            <img
                              src={listing.images[0].url}
                              alt={decodedTitle}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            {listing.images.length > 1 && (
                              <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1 rounded-tl">
                                +{listing.images.length - 1}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{decodedTitle}</h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {isNaN(price) || price === 0 ? 'N/A' : `${price.toFixed(2)} ${currency}`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              Qty: {listing.quantity ?? 0}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(listing.tags || []).slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                                {decodeHtmlEntities(tag)}
                              </span>
                            ))}
                            {(listing.tags || []).length > 3 && (
                              <span className="text-xs text-gray-500">+{(listing.tags || []).length - 3} more</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Operations Panel */}
        <div className="space-y-4">
          {/* Add Operation */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-4">Add Operation</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operation Type</label>
                <select
                  value={operationType}
                  onChange={(e) => {
                    setOperationType(e.target.value as any);
                    setOperationAction('set');
                    setOperationValue('');
                    setOperationValue2('');
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 font-medium transition-colors hover:border-gray-300"
                >
                  <option value="price" className="text-gray-900">Price</option>
                  <option value="quantity" className="text-gray-900">Quantity</option>
                  <option value="tags" className="text-gray-900">Tags</option>
                  <option value="processing_time" className="text-gray-900">Processing Time</option>
                  <option value="shipping_template" className="text-gray-900">Shipping Template</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                  value={operationAction}
                  onChange={(e) => {
                    setOperationAction(e.target.value as any);
                    setOperationValue('');
                    setOperationValue2('');
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 font-medium transition-colors hover:border-gray-300"
                >
                  {getActionOptions().map((action) => (
                    <option key={action} value={action} className="text-gray-900">
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value
                  {operationType === 'price' && operationAction !== 'set' && (
                    <span className="text-gray-500 text-xs ml-1">(e.g., 10 or 10% for percentage)</span>
                  )}
                  {operationType === 'tags' && (
                    <span className="text-gray-500 text-xs ml-1">(comma-separated)</span>
                  )}
                  {operationType === 'processing_time' && (
                    <span className="text-gray-500 text-xs ml-1">(e.g., 3-5)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={operationValue}
                  onChange={(e) => setOperationValue(e.target.value)}
                  placeholder={
                    operationType === 'price'
                      ? operationAction === 'set'
                        ? 'Enter price'
                        : 'Enter amount or percentage'
                      : operationType === 'tags'
                      ? 'tag1, tag2, tag3'
                      : operationType === 'processing_time'
                      ? '3-5'
                      : 'Enter value'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                />
              </div>

              {operationAction === 'replace' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Replace With</label>
                  <input
                    type="text"
                    value={operationValue2}
                    onChange={(e) => setOperationValue2(e.target.value)}
                    placeholder="New value"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                  />
                </div>
              )}

              <button
                onClick={handleAddOperation}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Operation
              </button>
            </div>
          </div>

          {/* Operations List */}
          {operations.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3">Operations ({operations.length})</h4>
              <div className="space-y-2">
                {operations.map((op, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                  >
                    <div>
                      <span className="font-medium capitalize">{op.type}</span>:{' '}
                      <span className="capitalize">{op.action}</span> → {op.value}
                      {op.value2 && ` → ${op.value2}`}
                    </div>
                    <button
                      onClick={() => handleRemoveOperation(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handlePreview}
              disabled={selectedListingIds.size === 0 || operations.length === 0}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview Changes
            </button>
            <button
              onClick={handleApply}
              disabled={selectedListingIds.size === 0 || operations.length === 0 || applying}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {applying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Apply Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewResults.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Preview Changes</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {previewResults.map((result) => (
                <div key={result.listing_id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{result.title}</h4>
                  <div className="space-y-2">
                    {result.changes.map((change: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <ArrowRight className="h-4 w-4 text-purple-600" />
                        <span className="text-gray-700">{change}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleApply();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

