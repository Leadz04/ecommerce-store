'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  X,
  Clock,
  DollarSign,
  Tag,
  TrendingUp,
  Search,
  Filter,
  Calendar,
  Package,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import SelectField, { SelectOption } from '@/components/SelectField';

interface Coupon {
  _id: string;
  code: string;
  name?: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumPurchase?: number;
  maxDiscountAmount?: number;
  productId?: {
    _id: string;
    name: string;
    image: string;
    price: number;
  };
  category?: string;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usageLimitPerUser?: number;
  usageCount: number;
  isActive: boolean;
  status: 'active' | 'expired' | 'disabled';
  currentStatus?: 'active' | 'expired' | 'disabled';
  isValid?: boolean;
  totalDiscountGiven: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
}

interface CouponFormData {
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumPurchase: number;
  maxDiscountAmount: number;
  productId: string;
  category: string;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usageLimitPerUser: number;
  isActive: boolean;
}

interface CouponStats {
  generalCoupons: {
    totalCoupons: number;
    activeCoupons: number;
    expiredCoupons: number;
    disabledCoupons: number;
    totalUsage: number;
    totalDiscountGiven: number;
    totalRevenue: number;
  };
  emailPromos: {
    totalEmailPromos: number;
    totalUsed: number;
    activePromos: number;
    expiredPromos: number;
  };
  overall: {
    totalDiscountGiven: number;
    totalRevenue: number;
    totalCouponsUsed: number;
  };
  topCoupons: Array<{
    code: string;
    name?: string;
    usageCount: number;
    totalDiscountGiven: number;
    totalRevenue: number;
  }>;
}

export default function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'disabled'>('all');
  const [discountTypeFilter, setDiscountTypeFilter] = useState<'all' | 'percentage' | 'fixed'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<string | null>(null);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [showStats, setShowStats] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [openSelect, setOpenSelect] = useState<string | null>(null);

  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    minimumPurchase: 0,
    maxDiscountAmount: 0,
    productId: '',
    category: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: 0,
    usageLimitPerUser: 1,
    isActive: true,
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(discountTypeFilter !== 'all' && { discountType: discountTypeFilter }),
      });

      const response = await fetch(`/api/admin/coupons?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch coupons');

      const data = await response.json();
      setCoupons(data.coupons || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      toast.error(error.message || 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/coupons/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.stats);
      setStatsError(null);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      setStatsError(error.message || 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [page, searchTerm, statusFilter, discountTypeFilter]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh stats every minute
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingCoupon ? `/api/admin/coupons/${editingCoupon._id}` : '/api/admin/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        minimumPurchase: formData.minimumPurchase || undefined,
        maxDiscountAmount: formData.maxDiscountAmount || undefined,
        productId: formData.productId || undefined,
        category: formData.category || undefined,
        usageLimit: formData.usageLimit || undefined,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save coupon');
      }

      toast.success(editingCoupon ? 'Coupon updated successfully' : 'Coupon created successfully');
      setOpenSelect(null);
      setShowForm(false);
      setEditingCoupon(null);
      resetForm();
      fetchCoupons();
      fetchStats();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast.error(error.message || 'Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name || '',
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumPurchase: coupon.minimumPurchase || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      productId: coupon.productId?._id || '',
      category: coupon.category || '',
      startDate: new Date(coupon.startDate).toISOString().split('T')[0],
      endDate: new Date(coupon.endDate).toISOString().split('T')[0],
      usageLimit: coupon.usageLimit || 0,
      usageLimitPerUser: coupon.usageLimitPerUser || 1,
      isActive: coupon.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    setDeletingCoupon(couponId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete coupon');

      toast.success('Coupon deleted successfully');
      fetchCoupons();
      fetchStats();
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      toast.error(error.message || 'Failed to delete coupon');
    } finally {
      setDeletingCoupon(null);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      minimumPurchase: 0,
      maxDiscountAmount: 0,
      productId: '',
      category: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: 0,
      usageLimitPerUser: 1,
      isActive: true,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getStatusBadge = (coupon: Coupon) => {
    const status = coupon.currentStatus || coupon.status;
    const now = new Date();
    const isExpired = new Date(coupon.endDate) < now;

    if (status === 'expired' || isExpired) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Expired
        </span>
      );
    }

    if (status === 'disabled' || !coupon.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle className="w-3 h-3 mr-1" />
          Disabled
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Section - Always show header, content is conditional */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Coupon Statistics</h3>
          <div className="flex items-center space-x-2">
            {statsLoading && (
              <span className="text-sm text-gray-500">Loading...</span>
            )}
            <button
              onClick={() => setShowStats(!showStats)}
              disabled={statsLoading || !stats}
              className="px-4 py-2 text-sm font-medium border-2 border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showStats ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Error State */}
        {statsError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-700">{statsError}</span>
              </div>
              <button
                onClick={fetchStats}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {statsLoading && !stats && (
          <div className="py-8 text-center text-gray-500">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-blue-600" />
            <p className="text-sm">Loading statistics...</p>
          </div>
        )}

        {/* Stats Content - Only show when stats exist and showStats is true */}
        {showStats && stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Total Discount Given</div>
                <div className="text-2xl font-bold text-blue-900">
                  ${stats.overall.totalDiscountGiven.toFixed(2)}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">Total Revenue</div>
                <div className="text-2xl font-bold text-green-900">
                  ${stats.overall.totalRevenue.toFixed(2)}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium">Total Usage</div>
                <div className="text-2xl font-bold text-purple-900">
                  {stats.overall.totalCouponsUsed}
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm text-orange-600 font-medium">Active Coupons</div>
                <div className="text-2xl font-bold text-orange-900">
                  {stats.generalCoupons.activeCoupons}
                </div>
              </div>
            </div>

            {/* Top Coupons */}
            {stats.topCoupons && stats.topCoupons.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Performing Coupons</h4>
                <div className="space-y-2">
                  {stats.topCoupons.slice(0, 5).map((coupon, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-sm font-semibold">{coupon.code}</span>
                        {coupon.name && <span className="text-sm text-gray-600">{coupon.name}</span>}
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-600">{coupon.usageCount} uses</span>
                        <span className="text-green-600 font-semibold">
                          ${coupon.totalRevenue.toFixed(2)} revenue
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State - When stats are hidden */}
        {!showStats && stats && (
          <div className="py-4 text-center text-gray-500 text-sm">
            Statistics are hidden. Click "Show" to display them.
          </div>
        )}

        {/* Empty State - When no stats loaded yet and not loading */}
        {!statsLoading && !stats && !statsError && (
          <div className="py-4 text-center text-gray-500 text-sm">
            No statistics available yet.
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Coupons & Discounts</h2>
          <p className="text-sm text-gray-600 mt-1">Manage discount codes and promotional offers</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingCoupon(null);
            setShowForm(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <SelectField
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'expired', label: 'Expired' },
              { value: 'disabled', label: 'Disabled' },
            ]}
            value={statusFilter}
            isOpen={openSelect === 'statusFilter'}
            onOpenChange={(open) => setOpenSelect(open ? 'statusFilter' : null)}
            onSelect={(value) => {
              setStatusFilter(value as any);
              setPage(1);
            }}
            placeholder="All Status"
          />
          <SelectField
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'percentage', label: 'Percentage' },
              { value: 'fixed', label: 'Fixed Amount' },
            ]}
            value={discountTypeFilter}
            isOpen={openSelect === 'discountTypeFilter'}
            onOpenChange={(open) => setOpenSelect(open ? 'discountTypeFilter' : null)}
            onSelect={(value) => {
              setDiscountTypeFilter(value as any);
              setPage(1);
            }}
            placeholder="All Types"
          />
          <button
            onClick={() => {
              fetchCoupons();
              fetchStats();
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2 border-2 border-blue-200 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 font-medium transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Coupons List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading && coupons.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No coupons found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-semibold text-gray-900">{coupon.code}</span>
                        <button
                          onClick={() => copyToClipboard(coupon.code)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy code"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      {coupon.name && (
                        <div className="text-sm text-gray-500">{coupon.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}%`
                          : `$${coupon.discountValue.toFixed(2)}`}
                      </div>
                      {coupon.minimumPurchase && (
                        <div className="text-xs text-gray-500">Min: ${coupon.minimumPurchase}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coupon.usageCount}
                        {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        ${coupon.totalDiscountGiven.toFixed(2)} given
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        ${coupon.totalRevenue.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(coupon)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(coupon.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon._id)}
                          disabled={deletingCoupon === coupon._id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h3>
              <button
                onClick={() => {
                  setOpenSelect(null);
                  setShowForm(false);
                  setEditingCoupon(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="SAVE20"
                  />
                </div>
                <div>
                  <SelectField
                    label="Discount Type *"
                    options={[
                      { value: 'percentage', label: 'Percentage' },
                      { value: 'fixed', label: 'Fixed Amount' },
                    ]}
                    value={formData.discountType}
                    isOpen={openSelect === 'discountType'}
                    onOpenChange={(open) => setOpenSelect(open ? 'discountType' : null)}
                    onSelect={(value) => setFormData({ ...formData, discountType: value as any })}
                    placeholder="Select discount type"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value *
                  {formData.discountType === 'percentage' && ' (1-100%)'}
                  {formData.discountType === 'fixed' && ' ($)'}
                </label>
                <input
                  type="number"
                  required
                  min={formData.discountType === 'percentage' ? 1 : 0}
                  max={formData.discountType === 'percentage' ? 100 : undefined}
                  step={formData.discountType === 'percentage' ? 1 : 0.01}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Summer Sale 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Description for internal use"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Minimum Purchase ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minimumPurchase}
                    onChange={(e) => setFormData({ ...formData, minimumPurchase: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                {formData.discountType === 'percentage' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Max Discount Amount ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Usage Limit (0 = unlimited)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Usage Limit Per User
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimitPerUser}
                    onChange={(e) => setFormData({ ...formData, usageLimitPerUser: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <SelectField
                  label="Category (Optional)"
                  options={[
                    { value: '', label: 'All Categories' },
                    { value: 'Men', label: 'Men' },
                    { value: 'Women', label: 'Women' },
                    { value: 'Office & Travel', label: 'Office & Travel' },
                    { value: 'Accessories', label: 'Accessories' },
                    { value: 'Gifting', label: 'Gifting' },
                  ]}
                  value={formData.category}
                  isOpen={openSelect === 'category'}
                  onOpenChange={(open) => setOpenSelect(open ? 'category' : null)}
                  onSelect={(value) => setFormData({ ...formData, category: value })}
                  placeholder="All Categories"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-gray-800">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setOpenSelect(null);
                    setShowForm(false);
                    setEditingCoupon(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : editingCoupon ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
