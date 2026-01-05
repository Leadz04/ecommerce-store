'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Eye,
  Star,
  Loader2,
  RefreshCw,
  Calendar,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AnalyticsData {
  period: string;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    itemsSold: number;
    averageOrderValue: number;
    salesVelocity: number;
    overallConversionRate: number;
  };
  traffic: {
    totalViews: number;
    totalFavorers: number;
    totalListings: number;
    averageViewsPerListing: number;
    averageFavorersPerListing: number;
  };
  topSellingListings: Array<{
    listing_id: number;
    title: string;
    revenue: number;
    orders: number;
    views: number;
    favorers: number;
    conversionRate: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    revenue: number;
  }>;
  topCategories: Array<{
    category: string;
    revenue: number;
    orders: number;
    listings: number;
  }>;
  shopInfo: {
    shopName: string;
    reviewAverage: number;
    reviewCount: number;
    activeListings: number;
  };
}

export default function EtsyAnalyticsDashboard({ shopId: propShopId }: { shopId: string | null }) {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Generate chart data for revenue - MUST be called before any early returns
  const revenueChartData = useMemo(() => {
    if (!analytics?.dailyBreakdown || analytics.dailyBreakdown.length === 0) return null;

    const data = analytics.dailyBreakdown;
    if (data.length === 0) return null;

    const maxRevenue = Math.max(...data.map((d) => d.revenue));
    if (maxRevenue <= 0) return null;

    const chartWidth = 800;
    const chartHeight = 200;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const graphWidth = chartWidth - padding.left - padding.right;
    const graphHeight = chartHeight - padding.top - padding.bottom;

    const points = data.map((point, index) => {
      const x = padding.left + (index / Math.max(1, data.length - 1)) * graphWidth;
      const y = padding.top + graphHeight - (point.revenue / maxRevenue) * graphHeight;
      return { x, y, date: point.date, revenue: point.revenue };
    });

    return { points, chartWidth, chartHeight, maxRevenue };
  }, [analytics]);

  useEffect(() => {
    if (propShopId) {
      fetchAnalytics(false);
    } else {
      setAnalytics(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, propShopId]);

  const fetchAnalytics = async (syncFromEtsy = false) => {
    if (!propShopId) return;

    try {
      setLoading(true);

      // If syncFromEtsy is true, sync data from Etsy first
      if (syncFromEtsy) {
        const token = localStorage.getItem('token');
        const syncRes = await fetch('/api/etsy/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ type: 'all', shopId: propShopId }),
        });

        const syncResult = await syncRes.json();
        if (!syncResult.success) {
          toast.error(syncResult.error || 'Failed to sync data from Etsy');
          setLoading(false);
          return;
        }
        toast.success('Data synced successfully from Etsy');
      }

      const token = localStorage.getItem('token');
      const analyticsRes = await fetch('/api/etsy/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ shopId: propShopId, period }),
      });

      const analyticsData = await analyticsRes.json();

      if (analyticsData.success) {
        setAnalytics(analyticsData);
      } else {
        if (analyticsRes.status === 401) {
          toast.error('Session expired. Please log in again.');
          localStorage.removeItem('token');
          // Optionally redirect to login here
        } else {
          toast.error(analyticsData.error || 'Failed to fetch analytics');
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (!propShopId) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Please select a shop to view analytics.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }


  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Advanced Analytics Dashboard
          </h3>
          <p className="text-sm text-gray-600 mt-1">Comprehensive insights into your Etsy shop performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 font-medium transition-colors hover:border-gray-300"
          >
            <option value="7d" className="text-gray-900">Last 7 days</option>
            <option value="30d" className="text-gray-900">Last 30 days</option>
            <option value="90d" className="text-gray-900">Last 90 days</option>
            <option value="1y" className="text-gray-900">Last year</option>
            <option value="all" className="text-gray-900">All time</option>
          </select>
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={loading}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Refresh from Etsy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">${analytics.summary.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{analytics.summary.totalOrders} orders</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
            <ShoppingCart className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">${analytics.summary.averageOrderValue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{analytics.summary.itemsSold} items sold</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Sales Velocity</p>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.summary.salesVelocity.toFixed(1)}</p>
          <p className="text-xs text-gray-500 mt-1">orders per day</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
            <BarChart3 className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.summary.overallConversionRate.toFixed(2)}%</p>
          <p className="text-xs text-gray-500 mt-1">{analytics.traffic.totalViews.toLocaleString()} total views</p>
        </div>
      </div>

      {/* Traffic Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Views</p>
            <Eye className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.traffic.totalViews.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.traffic.averageViewsPerListing.toFixed(0)} avg per listing
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Favorers</p>
            <Star className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.traffic.totalFavorers.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.traffic.averageFavorersPerListing.toFixed(1)} avg per listing
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Active Listings</p>
            <Package className="h-5 w-5 text-gray-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.traffic.totalListings}</p>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.shopInfo.reviewAverage > 0 ? (
              <>
                ⭐ {analytics.shopInfo.reviewAverage.toFixed(1)} ({analytics.shopInfo.reviewCount} reviews)
              </>
            ) : (
              'No reviews yet'
            )}
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      {revenueChartData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h4>
          <div className="overflow-x-auto">
            <svg width={revenueChartData.chartWidth} height={revenueChartData.chartHeight} className="min-w-full">
              {/* Axes */}
              <line x1="60" y1="180" x2="780" y2="180" stroke="#e5e7eb" strokeWidth="2" />
              <line x1="60" y1="20" x2="60" y2="180" stroke="#e5e7eb" strokeWidth="2" />

              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = 180 - ratio * 160;
                return (
                  <line
                    key={ratio}
                    x1="60"
                    y1={y}
                    x2="780"
                    y2={y}
                    stroke="#f3f4f6"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Y-axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = 180 - ratio * 160;
                const value = revenueChartData.maxRevenue * ratio;
                return (
                  <text
                    key={ratio}
                    x="55"
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-600"
                  >
                    ${(value / 1000).toFixed(value > 1000 ? 0 : 1)}k
                  </text>
                );
              })}

              {/* Revenue line */}
              <polyline
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="3"
                points={revenueChartData.points.map((p) => `${p.x},${p.y}`).join(' ')}
              />

              {/* Data points */}
              {revenueChartData.points.map((point, i) => (
                <g key={i}>
                  <circle cx={point.x} cy={point.y} r="4" fill="#8b5cf6" />
                  <title>{`${point.date}: $${point.revenue.toFixed(2)}`}</title>
                </g>
              ))}

              {/* X-axis date labels (show first, middle, last) */}
              {revenueChartData.points.length > 0 && (
                <>
                  <text
                    x={revenueChartData.points[0].x}
                    y="195"
                    textAnchor="middle"
                    className="text-xs fill-gray-600"
                  >
                    {new Date(revenueChartData.points[0].date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </text>
                  {revenueChartData.points.length > 2 && (
                    <text
                      x={revenueChartData.points[Math.floor(revenueChartData.points.length / 2)].x}
                      y="195"
                      textAnchor="middle"
                      className="text-xs fill-gray-600"
                    >
                      {new Date(
                        revenueChartData.points[Math.floor(revenueChartData.points.length / 2)].date
                      ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </text>
                  )}
                  <text
                    x={revenueChartData.points[revenueChartData.points.length - 1].x}
                    y="195"
                    textAnchor="middle"
                    className="text-xs fill-gray-600"
                  >
                    {new Date(
                      revenueChartData.points[revenueChartData.points.length - 1].date
                    ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                </>
              )}
            </svg>
          </div>
        </div>
      )}

      {/* Top Selling Listings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Listings</h4>
        {analytics.topSellingListings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Listing</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Orders</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Views</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topSellingListings.map((listing) => (
                  <tr key={listing.listing_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://www.etsy.com/listing/${listing.listing_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-gray-900 hover:text-purple-600 flex items-center gap-1"
                        >
                          {listing.title}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-semibold text-green-600">
                      ${listing.revenue.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">{listing.orders}</td>
                    <td className="text-right py-3 px-4 text-gray-700">{listing.views.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 text-gray-700">{listing.conversionRate.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No sales data available for this period</p>
        )}
      </div>

      {/* Top Categories */}
      {analytics.topCategories.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Category</h4>
          <div className="space-y-3">
            {analytics.topCategories.map((category, index) => {
              const maxRevenue = Math.max(...analytics.topCategories.map((c) => c.revenue));
              const percentage = maxRevenue > 0 ? (category.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{category.category}</span>
                    <span className="text-gray-600">
                      ${category.revenue.toFixed(2)} ({category.orders} orders)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

