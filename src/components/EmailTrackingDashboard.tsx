'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Mail, 
  Eye, 
  MousePointerClick, 
  Users, 
  TrendingUp, 
  Package,
  Globe,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar
} from 'lucide-react';
import SelectField from '@/components/SelectField';

interface EmailTrackingData {
  kpis: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalVisited: number;
    totalConverted: number;
    openRate: number;
    clickRate: number;
    clickToOpenRate: number;
    visitRate: number;
    conversionRate: number;
    avgOpens: number;
    avgClicks: number;
    avgVisits: number;
  };
  performanceByType: Array<{
    _id: string;
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalVisited: number;
    totalConverted: number;
    avgOpenCount: number;
    avgClickCount: number;
    avgVisitCount: number;
  }>;
  topClickedProducts: Array<{
    productId: string;
    clickCount: number;
    uniqueClickers: number;
  }>;
  topViewedProducts: Array<{
    productId: string;
    viewCount: number;
    uniqueViewers: number;
  }>;
  topVisitedPages: Array<{
    page: string;
    visitCount: number;
    uniqueVisitors: number;
  }>;
  timeMetrics: {
    toOpen: { avgHours: number; minHours: number; maxHours: number } | null;
    toClick: { avgHours: number; minHours: number; maxHours: number } | null;
    toVisit: { avgHours: number; minHours: number; maxHours: number } | null;
  };
  subscribers: {
    total: number;
    active: number;
    converted: number;
  };
  dailyBreakdown: Array<{
    _id: string;
    sent: number;
    opened: number;
    clicked: number;
    visited: number;
    converted: number;
  }>;
  recentEmails: Array<{
    _id: string;
    email: string;
    emailType: string;
    emailSentAt: string;
    opened: boolean;
    clicked: boolean;
    visited: boolean;
    converted: boolean;
    openCount: number;
    clickCount: number;
    visitCount: number;
  }>;
}

export default function EmailTrackingDashboard() {
  const [data, setData] = useState<EmailTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [daysSelectOpen, setDaysSelectOpen] = useState(false);

  const fetchDataRef = useRef<string | null>(null);
  
  const fetchData = async () => {
    const cacheKey = `email-tracking-${days}`;
    // Prevent duplicate calls for the same days value
    if (fetchDataRef.current === cacheKey) return;
    fetchDataRef.current = cacheKey;
    
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/email-tracking?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch email tracking data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      fetchDataRef.current = null; // Reset on error to allow retry
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Email Tracking & Analytics</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Monitor email performance, opens, clicks, and conversions</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-[180px]">
            <SelectField
              label=""
              options={[
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
                { value: '60', label: 'Last 60 days' },
                { value: '90', label: 'Last 90 days' }
              ]}
              value={days.toString()}
              isOpen={daysSelectOpen}
              onOpenChange={setDaysSelectOpen}
              onSelect={(value) => {
                setDays(Number(value));
                setDaysSelectOpen(false);
              }}
            />
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Sent</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{data.kpis.totalSent}</p>
            </div>
            <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 shrink-0" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Open Rate</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">{data.kpis.openRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">{data.kpis.totalOpened} opened</p>
            </div>
            <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 shrink-0" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Click Rate</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-1">{data.kpis.clickRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">{data.kpis.totalClicked} clicked</p>
            </div>
            <MousePointerClick className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 shrink-0" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600 mt-1">{data.kpis.conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">{data.kpis.totalConverted} converted</p>
            </div>
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 shrink-0" />
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-600">Visit Rate</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{data.kpis.visitRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">{data.kpis.totalVisited} visited site</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-600">Click-to-Open Rate</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{data.kpis.clickToOpenRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">Of opens, {data.kpis.clickToOpenRate.toFixed(1)}% clicked</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-600">Avg Opens per Email</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{data.kpis.avgOpens.toFixed(2)}</p>
        </div>
      </div>

      {/* Subscriber Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            Subscriber Statistics
          </h3>
        </div>
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600">Total Subscribers</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2">{data.subscribers.total}</p>
            <p className="text-xs text-gray-500 mt-1">Active email subscribers</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600">Active Subscribers</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-2">{data.subscribers.active}</p>
            <p className="text-xs text-gray-500 mt-1">Visited in last {days} days</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600">Converted</p>
            <p className="text-2xl sm:text-3xl font-bold text-orange-600 mt-2">{data.subscribers.converted}</p>
            <p className="text-xs text-gray-500 mt-1">Made a purchase</p>
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      {data.dailyBreakdown && data.dailyBreakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Daily Performance (Last {data.dailyBreakdown.length} days)</span>
            </h3>
          </div>
          <div className="p-3 sm:p-6 overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">Sent</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">Opened</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">Clicked</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">Visited</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">Converted</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">Open Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.dailyBreakdown.map((day) => (
                  <tr key={day._id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {new Date(day._id).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-right">{day.sent}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-right">{day.opened}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-right">{day.clicked}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-right">{day.visited}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-right">{day.converted}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-green-600 text-right font-medium">
                      {day.sent > 0 ? ((day.opened / day.sent) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance by Email Type */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Performance by Email Type</h3>
        </div>
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">Sent</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">Opened</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">Clicked</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">Visited</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">Converted</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">Open Rate</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">Click Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.performanceByType.map((type) => (
                <tr key={type._id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 capitalize">
                    {type._id}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-right">
                    {type.totalSent}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-right">
                    {type.totalOpened}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-right">
                    {type.totalClicked}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-right">
                    {type.totalVisited}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-right">
                    {type.totalConverted}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-green-600 text-right font-medium">
                    {type.totalSent > 0 ? ((type.totalOpened / type.totalSent) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-purple-600 text-right font-medium">
                    {type.totalSent > 0 ? ((type.totalClicked / type.totalSent) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Products & Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Clicked Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              Top Clicked Products
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            {data.topClickedProducts.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {data.topClickedProducts.map((product, idx) => (
                  <div key={product.productId} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">#{idx + 1} {product.productId}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{product.uniqueClickers} unique clickers</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-bold text-purple-600 text-sm sm:text-base">{product.clickCount}</p>
                      <p className="text-xs text-gray-500">clicks</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm">No product clicks yet</p>
            )}
          </div>
        </div>

        {/* Top Viewed Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
              Top Viewed Products
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            {data.topViewedProducts.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {data.topViewedProducts.map((product, idx) => (
                  <div key={product.productId} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">#{idx + 1} {product.productId}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{product.uniqueViewers} unique viewers</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-bold text-green-600 text-sm sm:text-base">{product.viewCount}</p>
                      <p className="text-xs text-gray-500">views</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm">No product views yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Visited Pages */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
            Top Visited Pages
          </h3>
        </div>
        <div className="p-4 sm:p-6">
          {data.topVisitedPages.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {data.topVisitedPages.map((page, idx) => (
                <div key={page.page} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">#{idx + 1} {page.page}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{page.uniqueVisitors} unique visitors</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-bold text-blue-600 text-sm sm:text-base">{page.visitCount}</p>
                    <p className="text-xs text-gray-500">visits</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4 text-sm">No page visits yet</p>
          )}
        </div>
      </div>

      {/* Time Metrics */}
      {data.timeMetrics.toOpen && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            Time to Action
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600">Time to Open</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">
                {data.timeMetrics.toOpen.avgHours.toFixed(1)}h
              </p>
              <p className="text-xs text-gray-500 mt-1">Average</p>
            </div>
            <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600">Time to Click</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600 mt-1">
                {data.timeMetrics.toClick?.avgHours.toFixed(1) || 'N/A'}h
              </p>
              <p className="text-xs text-gray-500 mt-1">Average</p>
            </div>
            <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600">Time to Visit</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">
                {data.timeMetrics.toVisit?.avgHours.toFixed(1) || 'N/A'}h
              </p>
              <p className="text-xs text-gray-500 mt-1">Average</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Emails with Expandable Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Emails - Full Details</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Click any row to view detailed tracking information</p>
        </div>
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase">Opened</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase">Clicked</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase">Visited</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase">Converted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.recentEmails.map((email) => (
                <EmailRow key={email._id} email={email} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Expandable Email Row Component
function EmailRow({ email }: { email: EmailTrackingData['recentEmails'][0] }) {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDetails = async () => {
    if (details) {
      setExpanded(!expanded);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/email-tracking/${email._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDetails(data);
        setExpanded(true);
      }
    } catch (error) {
      console.error('Error fetching email details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <tr 
        className="hover:bg-gray-50 cursor-pointer"
        onClick={fetchDetails}
      >
        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
          {loading ? (
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-gray-400" />
          ) : expanded ? (
            <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
          )}
        </td>
        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 break-all">{email.email}</td>
        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 capitalize">{email.emailType}</td>
        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
          <span className="hidden sm:inline">{new Date(email.emailSentAt).toLocaleDateString()} {new Date(email.emailSentAt).toLocaleTimeString()}</span>
          <span className="sm:hidden">{new Date(email.emailSentAt).toLocaleDateString()}</span>
        </td>
        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
          {email.opened ? (
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mx-auto" />
          ) : (
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mx-auto" />
          )}
          <p className="text-xs text-gray-500 mt-1">{email.openCount}x</p>
        </td>
        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
          {email.clicked ? (
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mx-auto" />
          ) : (
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mx-auto" />
          )}
          <p className="text-xs text-gray-500 mt-1">{email.clickCount}x</p>
        </td>
        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
          {email.visited ? (
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mx-auto" />
          ) : (
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mx-auto" />
          )}
          <p className="text-xs text-gray-500 mt-1">{email.visitCount}x</p>
        </td>
        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
          {email.converted ? (
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mx-auto" />
          ) : (
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mx-auto" />
          )}
        </td>
      </tr>
      {expanded && details && (
        <tr>
          <td colSpan={8} className="px-3 sm:px-6 py-4 sm:py-6 bg-gray-50">
            <div className="space-y-4 sm:space-y-6">
              {/* Timeline */}
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  Timeline
                </h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
                      <span className="text-gray-600">Email Sent:</span>
                    </div>
                    <span className="font-medium break-words">{new Date(details.emailSentAt).toLocaleString()}</span>
                  </div>
                  {details.openedAt && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <div className="flex items-center gap-2">
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                        <span className="text-gray-600">First Opened:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium break-words">{new Date(details.openedAt).toLocaleString()}</span>
                        <span className="text-gray-500">({details.openCount} times)</span>
                      </div>
                    </div>
                  )}
                  {details.clickedAt && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <div className="flex items-center gap-2">
                        <MousePointerClick className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 shrink-0" />
                        <span className="text-gray-600">First Clicked:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium break-words">{new Date(details.clickedAt).toLocaleString()}</span>
                        <span className="text-gray-500">({details.clickCount} times)</span>
                      </div>
                    </div>
                  )}
                  {details.visitedAt && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
                        <span className="text-gray-600">First Visited:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium break-words">{new Date(details.visitedAt).toLocaleString()}</span>
                        <span className="text-gray-500">({details.visitCount} times)</span>
                      </div>
                    </div>
                  )}
                  {details.convertedAt && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 shrink-0" />
                        <span className="text-gray-600">Converted:</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-orange-600 break-words">{new Date(details.convertedAt).toLocaleString()}</span>
                        {details.orderId && <span className="text-gray-500">(Order: {details.orderId})</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Clicked Links */}
              {details.clickedLinks && details.clickedLinks.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                    <MousePointerClick className="h-3 w-3 sm:h-4 sm:w-4" />
                    Clicked Links ({details.clickedLinks.length})
                  </h4>
                  <div className="space-y-2">
                    {details.clickedLinks.map((link: any, idx: number) => (
                      <div key={idx} className="p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs sm:text-sm text-blue-600 hover:underline flex items-center gap-2 break-all"
                            >
                              <span className="truncate">{link.url}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                            <p className="text-xs text-gray-500 mt-1 break-words">
                              Type: {link.linkType} {link.productId && `• Product: ${link.productId}`}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">
                            {new Date(link.clickedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visited Pages */}
              {details.visitedPages && details.visitedPages.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                    Visited Pages ({details.visitedPages.length})
                  </h4>
                  <div className="space-y-2">
                    {details.visitedPages.map((page: any, idx: number) => (
                      <div key={idx} className="p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-gray-900 font-medium break-words">{page.page}</p>
                            <p className="text-xs text-gray-500 mt-1 break-words">
                              Type: {page.pageType} {page.productId && `• Product: ${page.productId}`}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">
                            {new Date(page.visitedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Views */}
              {details.productViews && details.productViews.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                    Product Views ({details.productViews.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {details.productViews.map((view: any, idx: number) => (
                      <div key={idx} className="p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">{view.productName || view.productId}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {view.fromEmail ? 'From Email' : 'Direct Visit'}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">
                            {new Date(view.viewedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Journey Summary */}
              <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Journey Summary</h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span className={`px-2 py-1 rounded ${details.opened ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    Opened
                  </span>
                  <span className="hidden sm:inline">→</span>
                  <span className={`px-2 py-1 rounded ${details.clicked ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                    Clicked
                  </span>
                  <span className="hidden sm:inline">→</span>
                  <span className={`px-2 py-1 rounded ${details.visited ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                    Visited
                  </span>
                  <span className="hidden sm:inline">→</span>
                  <span className={`px-2 py-1 rounded ${details.converted ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                    Converted
                  </span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

