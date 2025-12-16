'use client';

import { useMemo, useState } from 'react';
import { Search, BarChart3, Loader2, AlertCircle, RefreshCw, TrendingUp, Tag, Store } from 'lucide-react';
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
  category_path: string[];
  tags?: string[];
}

interface MarketInsightsResponse {
  success: boolean;
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
    listingCount: number;
    averagePrice: number;
    averageViews: number;
    averageFavorites: number;
    totalViews: number;
    totalFavorites: number;
  }[];
  listings: MarketListing[];
}

export default function EtsyMarketInsights() {
  const [keywords, setKeywords] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [shopLocation, setShopLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MarketInsightsResponse | null>(null);

  const topSellersColumns = useMemo<ColumnDef<MarketInsightsResponse['topSellers'][number]>[]>(
    () => [
      {
        header: '#',
        cell: ({ row }) => row.index + 1,
      },
      {
        header: 'Shop Name',
        accessorKey: 'shop_name',
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900">{getValue<string>()}</span>
        ),
      },
      {
        header: 'Listings',
        accessorKey: 'listingCount',
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
    []
  );

  const listingsColumns = useMemo<ColumnDef<MarketListing>[]>(
    () => [
      {
        header: '#',
        cell: ({ row }) => row.index + 1,
      },
      {
        header: 'Title',
        accessorKey: 'title',
        cell: ({ row }) => {
          const l = row.original;
          return (
            <div className="space-y-0.5">
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 hover:underline"
              >
                {l.title}
              </a>
              {l.category_path && l.category_path.length > 0 && (
                <div className="text-[10px] text-gray-500">{l.category_path.join(' › ')}</div>
              )}
            </div>
          );
        },
      },
      {
        header: 'Shop',
        accessorKey: 'shop_name',
        cell: ({ getValue }) => getValue<string>() || '—',
      },
      {
        header: 'Price',
        accessorKey: 'price',
        cell: ({ row }) => {
          const l = row.original;
          return (
            <span className="text-gray-900 whitespace-nowrap">
              ${l.price.toFixed(2)} {l.currency}
            </span>
          );
        },
      },
      {
        header: 'Views',
        accessorKey: 'views',
        cell: ({ getValue }) => getValue<number | null>() ?? '—',
      },
      {
        header: 'Favorites',
        accessorKey: 'num_favorers',
        cell: ({ getValue }) => getValue<number | null>() ?? '—',
      },
    ],
    []
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
          limit: 50,
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
      toast.success(`Found ${json.summary.totalListings} listings in the market.`);
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
    setData(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Etsy Marketplace Insights
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Analyze the wider Etsy market for your keywords and price points (public data only).
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Keywords
            </label>
            <div className="relative">
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. leather jacket, wedding ring, wall art"
                className="w-full rounded-md border-gray-300 shadow-sm pr-10 focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900 bg-white"
              />
              <Search className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Min Price
            </label>
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Max Price
            </label>
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900 bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Shop Location (optional)
            </label>
            <input
              type="text"
              value={shopLocation}
              onChange={(e) => setShopLocation(e.target.value)}
              placeholder="e.g. United States, Germany"
              className="w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900 bg-white"
            />
          </div>

          <div className="md:col-span-3 flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-3 w-3" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Analyze Market
                </>
              )}
            </button>
          </div>
        </div>

        {!data && !loading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
            <AlertCircle className="h-3 w-3" />
            Enter a query and click &quot;Analyze Market&quot; to see results from public Etsy listings.
          </div>
        )}
      </div>

      {/* Results */}
      {data && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-600">Listings Found</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {data.summary.totalListings}
              </p>
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
                  Ranked by listings & views
                </span>
              </div>
              <MarketDataTable
                columns={topSellersColumns}
                data={data.topSellers}
                getRowId={(row, index) => `${row.shop_id}-${index}`}
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

          {/* Listings table */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Sample Listings ({data.listings.length})
            </h4>
            <MarketDataTable
              columns={listingsColumns}
              data={data.listings}
              getRowId={(row, index) => `${row.listing_id}-${index}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}


