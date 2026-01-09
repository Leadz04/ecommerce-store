'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Search, BarChart3, Loader2, AlertCircle, RefreshCw, TrendingUp, Tag, Store, ChevronDown, ChevronUp, Image as ImageIcon, Video, Eye, DollarSign, Star, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { ColumnDef } from '@tanstack/react-table';
import { MarketDataTable } from './MarketDataTable';

interface MarketListing {
  listing_id: number;
  title: string;
  url: string;
  price: number;
  currency: string;
  views: number | null;
  num_favorers: number | null;
  shop_id: number | null;
  shop_name: string | null;
  is_star_seller?: boolean;
  shop_location_country?: string;
  category_path: string[];
  tags?: string[];
  description?: string;
  images?: Array<{
    url: string;
    rank: number;
    listing_image_id?: number;
  }>;
  videos?: Array<{
    url: string;
    video_id?: number;
    width?: number;
    height?: number;
  }>;
}

interface MarketInsightsResponse {
  success: boolean;
  query?: {
    keywords?: string;
    minPrice?: number;
    maxPrice?: number;
    taxonomyId?: number;
    shopLocation?: string;
    limit?: number;
    totalAvailable?: number;
  };
  summary: {
    totalListings: number;
    minPrice: number;
    maxPrice: number;
    averagePrice: number;
    averageViews: number;
    averageFavorites: number;
  };
  topKeywords: { word: string; count: number }[];
  topTags: { tag: string; count: number }[];
  topSellers: {
    shop_id: number;
    shop_name: string;
    is_star_seller?: boolean;
    listingCount: number;
    averagePrice: number;
    averageViews: number;
    averageFavorites: number;
    totalViews: number;
    totalFavorites: number;
    engagementScore?: number;
  }[];
  listings: MarketListing[];
}

export default function EtsyMarketInsights() {
  const [keywords, setKeywords] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [shopLocation, setShopLocation] = useState('');
  const [isStarSeller, setIsStarSeller] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MarketInsightsResponse | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [loadingDetails, setLoadingDetails] = useState<Set<number>>(new Set());
  const [listingDetailsCache, setListingDetailsCache] = useState<Map<number, {
    images: any[];
    videos: any[];
    description: string;
  }>>(new Map());
  const [expandedShops, setExpandedShops] = useState<Set<number>>(new Set());
  const [shopListingsCache, setShopListingsCache] = useState<Map<number, MarketListing[]>>(new Map());
  const [listingImagesCache, setListingImagesCache] = useState<Map<number, string>>(new Map());
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());
  const pendingImageFetches = useRef<Set<number>>(new Set());

  const getShopListings = (shopId: number): MarketListing[] => {
    if (!data?.listings) return [];
    // Filter listings by shop_id and sort by views (descending), limit to top 10
    return data.listings
      .filter((listing) => listing.shop_id === shopId)
      .sort((a, b) => {
        const aViews = a.views || 0;
        const bViews = b.views || 0;
        if (bViews !== aViews) {
          return bViews - aViews;
        }
        return (b.num_favorers || 0) - (a.num_favorers || 0);
      })
      .slice(0, 10);
  };

  // Queue for image fetches to throttle API calls
  const imageFetchQueue = useRef<number[]>([]);
  const isProcessingQueue = useRef<boolean>(false);

  const processImageQueue = useCallback(async () => {
    if (isProcessingQueue.current || imageFetchQueue.current.length === 0) {
      return;
    }

    isProcessingQueue.current = true;

    while (imageFetchQueue.current.length > 0) {
      const listingId = imageFetchQueue.current.shift();
      if (!listingId) continue;

      // Check if already cached or pending
      if (listingImagesCache.has(listingId) || pendingImageFetches.current.has(listingId)) {
        continue;
      }

      // Mark as pending
      pendingImageFetches.current.add(listingId);

      try {
        setLoadingImages(prev => new Set(prev).add(listingId));

        const response = await fetch(`/api/etsy/market-insights/${listingId}/image`);
        const json = await response.json();

        if (json.success && json.image?.url) {
          setListingImagesCache(prev => {
            const newCache = new Map(prev);
            newCache.set(listingId, json.image.url);
            return newCache;
          });
        }
      } catch (error) {
        console.error('Error fetching listing image:', error);
      } finally {
        pendingImageFetches.current.delete(listingId);
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(listingId);
          return newSet;
        });
      }

      // Rate limit: Wait 100ms between requests (10 requests/second max)
      // This ensures we stay well under Etsy's rate limits
      if (imageFetchQueue.current.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    isProcessingQueue.current = false;
  }, [listingImagesCache]);

  const fetchListingImage = useCallback(async (listingId: number) => {
    // Check if already cached or pending
    if (listingImagesCache.has(listingId) || pendingImageFetches.current.has(listingId)) {
      return;
    }

    // Add to queue instead of fetching immediately
    if (!imageFetchQueue.current.includes(listingId)) {
      imageFetchQueue.current.push(listingId);
    }

    // Process queue if not already processing
    processImageQueue();
  }, [listingImagesCache, processImageQueue]);

  const toggleShopRow = (shopId: number) => {
    const newExpanded = new Set(expandedShops);
    if (newExpanded.has(shopId)) {
      newExpanded.delete(shopId);
    } else {
      newExpanded.add(shopId);
      // Cache shop listings if not already cached
      if (!shopListingsCache.has(shopId)) {
        const listings = getShopListings(shopId);
        setShopListingsCache(prev => {
          const newCache = new Map(prev);
          newCache.set(shopId, listings);
          return newCache;
        });
      }
    }
    setExpandedShops(newExpanded);
  };

  // Fetch images for shop listings when shops are expanded
  useEffect(() => {
    expandedShops.forEach((shopId) => {
      const shopListings = shopListingsCache.get(shopId);
      if (shopListings) {
        shopListings.forEach((listing) => {
          if (!listingImagesCache.has(listing.listing_id) && !pendingImageFetches.current.has(listing.listing_id)) {
            fetchListingImage(listing.listing_id);
          }
        });
      }
    });
  }, [expandedShops, shopListingsCache, listingImagesCache, fetchListingImage]);

  // Pre-fetch images for visible listings when data changes
  useEffect(() => {
    if (data?.listings && data.listings.length > 0) {
      // Fetch images for first page of listings (20 items)
      const firstPageListings = data.listings.slice(0, 20);
      firstPageListings.forEach((listing) => {
        if (!listingImagesCache.has(listing.listing_id) && !pendingImageFetches.current.has(listing.listing_id)) {
          fetchListingImage(listing.listing_id);
        }
      });
    }
  }, [data?.listings, listingImagesCache, fetchListingImage]);

  const topSellersColumns = useMemo<ColumnDef<MarketInsightsResponse['topSellers'][number]>[]>(
    () => [
      {
        header: '',
        id: 'expand',
        cell: ({ row }) => {
          const shop = row.original;
          const isExpanded = expandedShops.has(shop.shop_id);
          return (
            <button
              onClick={() => toggleShopRow(shop.shop_id)}
              className="p-1 hover:bg-gray-100 rounded"
              title={isExpanded ? 'Collapse' : 'Expand to see listings'}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              )}
            </button>
          );
        },
        size: 40,
      },
      {
        header: '#',
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;
          return pageIndex * pageSize + row.index + 1;
        },
        size: 50,
      },
      {
        header: 'Shop Name',
        accessorKey: 'shop_name',
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{getValue<string>()}</span>
            {row.original.is_star_seller && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-700 border border-purple-200 font-bold" title="Star Seller">
                <Star className="h-2.5 w-2.5 fill-purple-600" />
                STAR
              </span>
            )}
          </div>
        ),
      },
      {
        header: 'Listings',
        accessorKey: 'listingCount',
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900">{getValue<number>()}</span>
        ),
      },
      {
        header: 'Total Views',
        accessorKey: 'totalViews',
        cell: ({ getValue }) => {
          const views = getValue<number>() ?? 0;
          return <span className="text-gray-700">{views.toLocaleString()}</span>;
        },
      },
      {
        header: 'Total Favorites',
        accessorKey: 'totalFavorites',
        cell: ({ getValue }) => {
          const favorites = getValue<number>() ?? 0;
          return <span className="text-gray-700">{favorites.toLocaleString()}</span>;
        },
      },
      {
        header: 'Avg Price',
        accessorKey: 'averagePrice',
        cell: ({ getValue }) => `$${(getValue<number>() ?? 0).toFixed(2)}`,
      },
      {
        header: 'Avg Views',
        accessorKey: 'averageViews',
        cell: ({ getValue }) => (getValue<number>() ?? 0).toFixed(1),
      },
      {
        header: 'Avg Favorites',
        accessorKey: 'averageFavorites',
        cell: ({ getValue }) => (getValue<number>() ?? 0).toFixed(1),
      },
    ],
    [expandedShops]
  );


  const fetchListingDetails = async (listingId: number) => {
    // Check if already cached
    if (listingDetailsCache.has(listingId)) {
      return;
    }

    // Check if already loading
    if (loadingDetails.has(listingId)) {
      return;
    }

    try {
      setLoadingDetails(prev => new Set(prev).add(listingId));

      const response = await fetch(`/api/etsy/market-insights/${listingId}/details`);
      const json = await response.json();

      if (json.success) {
        setListingDetailsCache(prev => {
          const newCache = new Map(prev);
          newCache.set(listingId, {
            images: json.images || [],
            videos: json.videos || [],
            description: json.description || '',
          });
          return newCache;
        });
      } else {
        console.error('Failed to fetch listing details:', json.error);
        // Cache empty result to prevent retries
        setListingDetailsCache(prev => {
          const newCache = new Map(prev);
          newCache.set(listingId, {
            images: [],
            videos: [],
            description: '',
          });
          return newCache;
        });
      }
    } catch (error) {
      console.error('Error fetching listing details:', error);
      // Cache empty result to prevent retries
      setListingDetailsCache(prev => {
        const newCache = new Map(prev);
        newCache.set(listingId, {
          images: [],
          videos: [],
          description: '',
        });
        return newCache;
      });
    } finally {
      setLoadingDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(listingId);
        return newSet;
      });
    }
  };

  const toggleRow = (listingId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(listingId)) {
      newExpanded.delete(listingId);
    } else {
      newExpanded.add(listingId);
      // Fetch details when expanding (includes description for table display)
      fetchListingDetails(listingId);
    }
    setExpandedRows(newExpanded);
  };


  const listingsColumns = useMemo<ColumnDef<MarketListing>[]>(
    () => [
      {
        header: '',
        id: 'expand',
        cell: ({ row }) => {
          const l = row.original;
          const isExpanded = expandedRows.has(l.listing_id);
          return (
            <button
              onClick={() => toggleRow(l.listing_id)}
              className="p-1 hover:bg-gray-100 rounded"
              title={isExpanded ? 'Collapse' : 'Expand details'}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              )}
            </button>
          );
        },
        size: 40,
      },
      {
        header: '#',
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;
          return pageIndex * pageSize + row.index + 1;
        },
        size: 50,
      },
      {
        header: 'Title',
        accessorKey: 'title',
        cell: ({ row }) => {
          const l = row.original;
          const details = listingDetailsCache.get(l.listing_id);
          return (
            <div className="space-y-1.5 max-w-md">
              <div className="flex items-start gap-2">
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-900 hover:text-purple-600 hover:underline font-semibold text-sm block leading-tight"
                  title={l.title}
                >
                  {l.title}
                </a>
                {l.is_star_seller && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] bg-purple-100 text-purple-700 border border-purple-200 font-bold flex-shrink-0" title="Star Seller">
                    <Star className="h-2 w-2 fill-purple-600" />
                    STAR
                  </span>
                )}
              </div>
              {l.category_path && l.category_path.length > 0 && (
                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                  <span className="font-medium">Category:</span>
                  <span>{l.category_path.join(' › ')}</span>
                </div>
              )}
              {details?.description ? (
                <div
                  className="text-xs text-gray-600 line-clamp-2 leading-relaxed mt-1"
                  dangerouslySetInnerHTML={{
                    __html: details.description.length > 150
                      ? `${details.description.substring(0, 150).replace(/<[^>]*>/g, '')}...`
                      : details.description.replace(/<[^>]*>/g, ''),
                  }}
                />
              ) : (
                <div className="text-xs text-gray-400 italic mt-1">
                  Click expand to view description
                </div>
              )}
            </div>
          );
        },
        size: 350,
      },
      {
        header: 'Tags',
        accessorKey: 'tags',
        cell: ({ row }) => {
          const l = row.original;
          if (!l.tags || l.tags.length === 0) {
            return <span className="text-gray-400 text-xs">—</span>;
          }
          return (
            <div className="flex flex-wrap gap-1 max-w-xs">
              {l.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium"
                  title={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          );
        },
        size: 250,
      },
      {
        header: 'Price',
        accessorKey: 'price',
        cell: ({ row }) => {
          const l = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1 text-gray-900 whitespace-nowrap">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-bold text-base">${l.price.toFixed(2)}</span>
                <span className="text-xs text-gray-500">{l.currency}</span>
              </div>
            </div>
          );
        },
        size: 110,
      },
      {
        header: 'Engagement',
        id: 'engagement',
        cell: ({ row }) => {
          const l = row.original;
          const details = listingDetailsCache.get(l.listing_id);
          return (
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-blue-600" />
                <span className="font-medium">{l.views?.toLocaleString() ?? '0'}</span>
                <span className="text-gray-500">views</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-red-500">❤</span>
                <span className="font-medium">{l.num_favorers?.toLocaleString() ?? '0'}</span>
                <span className="text-gray-500">favorites</span>
              </div>
              {details && (
                <>
                  {details.images && details.images.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-0.5 border-t border-gray-100">
                      <ImageIcon className="h-3.5 w-3.5 text-purple-600" />
                      <span className="font-medium">{details.images.length}</span>
                      <span className="text-gray-500">images</span>
                    </div>
                  )}
                  {details.videos && details.videos.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5 text-red-600" />
                      <span className="font-medium">{details.videos.length}</span>
                      <span className="text-gray-500">videos</span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        },
        size: 120,
      },
      {
        header: 'Image',
        id: 'image',
        cell: ({ row }) => {
          const l = row.original;
          const imageUrl = listingImagesCache.get(l.listing_id);
          const isLoading = loadingImages.has(l.listing_id);

          return (
            <div className="flex items-center justify-center">
              {isLoading ? (
                <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt={l.title}
                  className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:border-purple-400 transition"
                  onClick={() => window.open(l.url, '_blank')}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-16 h-16 bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-gray-300" />
                </div>
              )}
            </div>
          );
        },
        size: 100,
      },
    ],
    [expandedRows, listingDetailsCache, listingImagesCache, loadingImages]
  );

  const handleSearch = async () => {
    if (!keywords.trim()) {
      toast.error('Enter at least one keyword to analyze the market.');
      return;
    }

    try {
      setLoading(true);
      setData(null);

      const response = await fetch('/api/etsy/market-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keywords.trim(),
          minPrice: minPrice ? parseFloat(minPrice) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          shopLocation: shopLocation || undefined,
          isStarSeller: isStarSeller,
          limit: 500, // Fetch max listings for better insights
        }),
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response (${response.status}). ${text.substring(0, 200)}`);
      }

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || `Failed to fetch market insights (${response.status})`);
      }

      setData(json);
      setExpandedRows(new Set()); // Reset expanded rows when new data loads
      setListingDetailsCache(new Map()); // Clear cache when new data loads
      setExpandedShops(new Set()); // Reset expanded shops when new data loads
      setShopListingsCache(new Map()); // Clear shop listings cache when new data loads
      setListingImagesCache(new Map()); // Clear images cache when new data loads


      const totalMsg = json.query?.totalAvailable
        ? `${json.summary.totalListings} listings analyzed (${json.query.totalAvailable.toLocaleString()} total available)`
        : `${json.summary.totalListings} listings analyzed`;
      toast.success(`Found ${totalMsg} in the market.`);
    } catch (error: any) {
      console.error('Market insights error:', error);
      toast.error(error.message || 'Failed to fetch market insights');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setKeywords('');
    setMinPrice('');
    setMaxPrice('');
    setShopLocation('');
    setIsStarSeller(false);
    setData(null);
    setExpandedRows(new Set());
    setListingDetailsCache(new Map());
    setExpandedShops(new Set());
    setShopListingsCache(new Map());
    setListingImagesCache(new Map());
  };

  // Derived listings (now just pass-through as filtering is API-based)
  const filteredListings = useMemo(() => {
    return data?.listings || [];
  }, [data?.listings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <BarChart3 className="h-7 w-7 text-purple-600" />
            Etsy Marketplace Insights
          </h3>
          <p className="text-base text-gray-600">
            Analyze the wider Etsy market for your keywords and price points (public data only).
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="space-y-5">
          {/* First Row: Keywords and Price Range */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Keywords
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. leather jacket, wedding ring, wall art"
                  className="w-full h-11 px-4 pr-11 rounded-lg border-2 border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base text-gray-900 bg-white transition-all"
                />
                <Search className="h-5 w-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Min Price ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-11 px-4 rounded-lg border-2 border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base text-gray-900 bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Max Price ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-11 px-4 rounded-lg border-2 border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base text-gray-900 bg-white transition-all"
              />
            </div>
          </div>

          {/* Second Row: Shop Location and Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Shop Location <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={shopLocation}
                onChange={(e) => setShopLocation(e.target.value)}
                placeholder="e.g. United States, Germany"
                className="w-full h-11 px-4 rounded-lg border-2 border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base text-gray-900 bg-white transition-all"
              />
            </div>

            <div className="flex items-center pb-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isStarSeller}
                  onChange={(e) => setIsStarSeller(e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500 transition-all"
                />
                <span className="text-gray-900 font-medium flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-purple-600 text-purple-600" />
                  Star Seller Only
                </span>
              </label>
            </div>

            <div className="md:col-span-3 flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium border-2 border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-lg text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    Analyze Market
                  </>
                )}
              </button>
            </div>
          </div>

          {!data && !loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t border-gray-100">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span>Enter a query and click &quot;Analyze Market&quot; to see results from public Etsy listings.</span>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {data && (
        <div className="space-y-4">

          {/* Post-Search Filters Removed (Managed via API inputs now) */}

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-600">Listings Analyzed</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {data.summary.totalListings}
              </p>
              {data.query?.totalAvailable && data.query.totalAvailable > data.summary.totalListings && (
                <p className="mt-1 text-xs text-gray-500">
                  of {data.query.totalAvailable.toLocaleString()} available
                </p>
              )}
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-600">Price Range</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                ${data.summary.minPrice.toFixed(2)} – ${data.summary.maxPrice.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-600">Average Price</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                ${data.summary.averagePrice.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-600">Engagement (avg)</p>
              <p className="mt-1 text-sm text-gray-900">
                {data.summary.averageViews.toFixed(1)} views •{' '}
                {data.summary.averageFavorites.toFixed(1)} favorites
              </p>
            </div>
          </div>

          {/* Top Sellers */}
          {data.topSellers && data.topSellers.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Store className="h-4 w-4 text-purple-600" />
                <h4 className="text-sm font-semibold text-gray-900">Top Sellers for This Search</h4>
                <span className="ml-auto text-[11px] text-gray-500 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  Ranked by engagement (views & favorites)
                </span>
              </div>
              <MarketDataTable
                columns={topSellersColumns}
                data={data.topSellers}
                getRowId={(row, index) => `${row.shop_id}-${index}`}
                pageSize={20}
                showPagination={true}
                getExpandedState={(row) => expandedShops.has(row.shop_id)}
                renderExpandedRow={(row) => {
                  const shopListings = shopListingsCache.get(row.shop_id) || getShopListings(row.shop_id);

                  if (shopListings.length === 0) {
                    return (
                      <div className="py-4 text-sm text-gray-500 text-center">
                        No listings found for this shop in the current search results.
                      </div>
                    );
                  }

                  return (
                    <div className="py-4 space-y-3">
                      <h5 className="text-sm font-semibold text-gray-900 mb-3">
                        Top {shopListings.length} Listings for {row.shop_name}
                      </h5>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">#</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Image</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Title</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Price</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Views</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Favorites</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Tags</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {shopListings.map((listing, idx) => {
                              const listingImageUrl = listingImagesCache.get(listing.listing_id);
                              const isImageLoading = loadingImages.has(listing.listing_id);

                              return (
                                <tr key={listing.listing_id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-gray-700">{idx + 1}</td>
                                  <td className="px-3 py-2">
                                    {isImageLoading ? (
                                      <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                        <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                                      </div>
                                    ) : listingImageUrl ? (
                                      <img
                                        src={listingImageUrl}
                                        alt={listing.title}
                                        className="w-12 h-12 object-cover rounded border border-gray-200 cursor-pointer hover:border-purple-400 transition"
                                        onClick={() => window.open(listing.url, '_blank')}
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
                                        <ImageIcon className="h-4 w-4 text-gray-300" />
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    <a
                                      href={listing.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-purple-600 hover:text-purple-700 hover:underline font-medium"
                                    >
                                      {listing.title}
                                    </a>
                                    {listing.category_path && listing.category_path.length > 0 && (
                                      <div className="text-[10px] text-gray-500 mt-0.5">
                                        {listing.category_path.join(' › ')}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                    ${listing.price.toFixed(2)} {listing.currency}
                                  </td>
                                  <td className="px-3 py-2 text-gray-700">
                                    {listing.views?.toLocaleString() ?? '—'}
                                  </td>
                                  <td className="px-3 py-2 text-gray-700">
                                    {listing.num_favorers?.toLocaleString() ?? '—'}
                                  </td>
                                  <td className="px-3 py-2">
                                    {listing.tags && listing.tags.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {listing.tags.slice(0, 3).map((tag, tagIdx) => (
                                          <span
                                            key={tagIdx}
                                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-purple-50 text-purple-700 border border-purple-100"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                        {listing.tags.length > 3 && (
                                          <span className="text-[10px] text-gray-500">+{listing.tags.length - 3}</span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          )}

          {/* Top Keywords and Tags Grid */}
          {(data.topKeywords.length > 0 || (data.topTags && data.topTags.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Title Keywords */}
              {data.topKeywords.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Search className="h-4 w-4 text-purple-600" />
                    Top Title Keywords
                  </h4>
                  <p className="text-xs text-gray-500 mb-2">Common words found in listing titles</p>
                  <div className="flex flex-wrap gap-2 text-xs max-h-48 overflow-y-auto">
                    {data.topKeywords.map((k) => (
                      <span
                        key={k.word}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100"
                      >
                        <span className="font-medium">{k.word}</span>
                        <span className="text-[10px] text-purple-500">×{k.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Tags */}
              {data.topTags && data.topTags.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-indigo-600" />
                    Top Market Tags
                  </h4>
                  <p className="text-xs text-gray-500 mb-2">Most popular tags used by sellers</p>
                  <div className="flex flex-wrap gap-2 text-xs max-h-48 overflow-y-auto">
                    {data.topTags.map((t) => (
                      <span
                        key={t.tag}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
                      >
                        <span className="font-medium">{t.tag}</span>
                        <span className="text-[10px] text-indigo-500">×{t.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Star Seller Spotlights */}
          {filteredListings.some(l => l.is_star_seller) && (
            <div className="bg-purple-50 rounded-lg border border-purple-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <Star className="h-5 w-5 text-purple-600 fill-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-purple-900">Star Seller Spotlights</h4>
                    <p className="text-xs text-purple-700">Top performing listings from Etsy Star Sellers (Filtered)</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold border border-purple-200">
                  {filteredListings.filter(l => l.is_star_seller).length} DISCOVERED
                </span>
              </div>
              <MarketDataTable
                columns={listingsColumns}
                data={filteredListings.filter(l => l.is_star_seller)}
                getRowId={(row, index) => `star-${row.listing_id}-${index}`}
                pageSize={5}
                showPagination={true}
                getExpandedState={(row) => expandedRows.has(row.listing_id)}
                renderExpandedRow={(row) => {
                  const details = listingDetailsCache.get(row.listing_id);
                  const isLoading = loadingDetails.has(row.listing_id);
                  const hasDetails = details !== undefined;

                  return (
                    <div className="space-y-4 py-2">
                      {isLoading && (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-purple-600 mr-2" />
                          <span className="text-sm text-gray-600">Loading listing details...</span>
                        </div>
                      )}

                      {!isLoading && !hasDetails && (
                        <div className="text-sm text-gray-500 text-center py-4">
                          Failed to load details. Please try again.
                        </div>
                      )}

                      {!isLoading && hasDetails && (
                        <>
                          {/* Images */}
                          {details.images && details.images.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <ImageIcon className="h-4 w-4 text-purple-600" />
                                <h5 className="text-xs font-semibold text-gray-700">Images ({details.images.length})</h5>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {details.images.map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img.url}
                                    alt={`${row.title} - Image ${idx + 1}`}
                                    className="w-24 h-24 object-cover rounded border border-gray-200 cursor-pointer hover:border-purple-400 transition"
                                    onClick={() => window.open(img.url, '_blank')}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Videos */}
                          {details.videos && details.videos.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Video className="h-4 w-4 text-red-600" />
                                <h5 className="text-xs font-semibold text-gray-700">Videos ({details.videos.length})</h5>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {details.videos.map((vid, idx) => (
                                  <div key={idx} className="relative">
                                    <video
                                      src={vid.url}
                                      controls
                                      className="w-48 h-32 rounded border border-gray-200"
                                      preload="metadata"
                                    >
                                      Your browser does not support the video tag.
                                    </video>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tags */}
                          {row.tags && row.tags.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Tag className="h-4 w-4 text-indigo-600" />
                                <h5 className="text-xs font-semibold text-gray-700">All Tags ({row.tags.length})</h5>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {row.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Description */}
                          {details.description && (
                            <div>
                              <h5 className="text-xs font-semibold text-gray-700 mb-2">Description</h5>
                              <div
                                className="text-xs text-gray-600 max-h-48 overflow-y-auto prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{
                                  __html: details.description.length > 500
                                    ? `${details.description.substring(0, 500)}...`
                                    : details.description,
                                }}
                              />
                            </div>
                          )}

                          <div className="pt-2 border-t border-purple-100">
                            <a
                              href={row.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-bold"
                            >
                              View Premium Listing on Etsy →
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  );
                }}
              />
            </div>
          )}

          {/* Listings table */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">
                Sample Listings ({filteredListings.length}
                {data.query?.totalAvailable && data.query.totalAvailable > data.listings.length
                  ? ` of ${data.query.totalAvailable.toLocaleString()} available`
                  : ''}
                )
              </h4>
              {data.query?.totalAvailable && data.query.totalAvailable > data.listings.length && (
                <span className="text-xs text-gray-500">
                  Showing top {data.listings.length} from {data.query.totalAvailable.toLocaleString()} total matches
                </span>
              )}
            </div>
            <MarketDataTable
              columns={listingsColumns}
              data={filteredListings}
              getRowId={(row, index) => `${row.listing_id}-${index}`}
              pageSize={20}
              showPagination={true}
              getExpandedState={(row) => expandedRows.has(row.listing_id)}
              renderExpandedRow={(row) => {
                const details = listingDetailsCache.get(row.listing_id);
                const isLoading = loadingDetails.has(row.listing_id);
                const hasDetails = details !== undefined;

                return (
                  <div className="space-y-4 py-2">
                    {isLoading && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-purple-600 mr-2" />
                        <span className="text-sm text-gray-600">Loading listing details...</span>
                      </div>
                    )}

                    {!isLoading && !hasDetails && (
                      <div className="text-sm text-gray-500 text-center py-4">
                        Failed to load details. Please try again.
                      </div>
                    )}

                    {!isLoading && hasDetails && (
                      <>
                        {/* Images */}
                        {details.images && details.images.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <ImageIcon className="h-4 w-4 text-purple-600" />
                              <h5 className="text-xs font-semibold text-gray-700">Images ({details.images.length})</h5>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {details.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img.url}
                                  alt={`${row.title} - Image ${idx + 1}`}
                                  className="w-24 h-24 object-cover rounded border border-gray-200 cursor-pointer hover:border-purple-400 transition"
                                  onClick={() => window.open(img.url, '_blank')}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Videos */}
                        {details.videos && details.videos.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Video className="h-4 w-4 text-red-600" />
                              <h5 className="text-xs font-semibold text-gray-700">Videos ({details.videos.length})</h5>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {details.videos.map((vid, idx) => (
                                <div key={idx} className="relative">
                                  <video
                                    src={vid.url}
                                    controls
                                    className="w-48 h-32 rounded border border-gray-200"
                                    preload="metadata"
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tags - Show in expanded view even though they're in table */}
                        {row.tags && row.tags.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Tag className="h-4 w-4 text-indigo-600" />
                              <h5 className="text-xs font-semibold text-gray-700">All Tags ({row.tags.length})</h5>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {row.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {details.description && (
                          <div>
                            <h5 className="text-xs font-semibold text-gray-700 mb-2">Description</h5>
                            <div
                              className="text-xs text-gray-600 max-h-48 overflow-y-auto prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: details.description.length > 500
                                  ? `${details.description.substring(0, 500)}...`
                                  : details.description,
                              }}
                            />
                            {details.description.length > 500 && (
                              <a
                                href={row.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-purple-600 hover:underline mt-1 inline-block"
                              >
                                Read full description on Etsy →
                              </a>
                            )}
                          </div>
                        )}

                        {/* Link to Etsy */}
                        <div className="pt-2 border-t border-gray-200">
                          <a
                            href={row.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
                          >
                            View on Etsy →
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                );
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}


