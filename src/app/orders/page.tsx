'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, 
  Filter, 
  Calendar, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { OrderCardSkeleton } from '@/components/LoadingSkeleton';
import toast from 'react-hot-toast';

interface OrderFilters {
  status: string;
  dateRange: string;
  search: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { orders, isLoading, error, fetchOrders, pagination } = useOrderStore();
  
  const [filters, setFilters] = useState<OrderFilters>({
    status: 'all',
    dateRange: 'all',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<any>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch orders on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters(prev => ({ ...prev, search: searchInput }));
        fetchOrders({ search: searchInput });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, fetchOrders]);

  const handleFilterChange = (key: keyof OrderFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    fetchOrders({ [key]: value });
  };

  const handleRefresh = () => {
    fetchOrders();
    toast.success('Orders refreshed');
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to download invoice');
        return;
      }

      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Invoice download error:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handleTrackOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to track order');
        return;
      }

      const response = await fetch(`/api/orders/${orderId}/track`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get tracking information');
      }

      const trackingData = await response.json();
      
      // Open tracking modal or redirect to tracking page
      setSelectedOrderForTracking(trackingData);
      setShowTrackingModal(true);
      
    } catch (error) {
      console.error('Order tracking error:', error);
      toast.error('Failed to get tracking information');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders.filter(order => {
    if (filters.status !== 'all' && order.status !== filters.status) return false;
    if (filters.search && !(order.orderNumber ?? '').toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your orders</h1>
          <Link href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-600 mt-1">Track and manage your orders</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors bg-white font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <Link
                href="/profile"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                <Eye className="h-4 w-4" />
                <span>View Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by order number..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 transition-colors"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors bg-white text-gray-700 font-medium"
            >
              <Filter className="h-5 w-5" />
              <span>Filters</span>
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium transition-colors"
                  >
                    <option value="all" className="text-gray-900">All Statuses</option>
                    <option value="pending" className="text-gray-900">Pending</option>
                    <option value="processing" className="text-gray-900">Processing</option>
                    <option value="shipped" className="text-gray-900">Shipped</option>
                    <option value="delivered" className="text-gray-900">Delivered</option>
                    <option value="cancelled" className="text-gray-900">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium transition-colors"
                  >
                    <option value="all" className="text-gray-900">All Time</option>
                    <option value="7" className="text-gray-900">Last 7 days</option>
                    <option value="30" className="text-gray-900">Last 30 days</option>
                    <option value="90" className="text-gray-900">Last 3 months</option>
                    <option value="365" className="text-gray-900">Last year</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-red-500 text-lg">{error}</p>
              <button 
                onClick={() => fetchOrders()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No orders found</h3>
              <p className="text-gray-600 mb-8 text-lg">
                {filters.search || filters.status !== 'all' 
                  ? 'No orders match your current filters.' 
                  : "You haven't placed any orders yet."}
              </p>
              {filters.search || filters.status !== 'all' ? (
                <button
                  onClick={() => {
                    setFilters({ status: 'all', dateRange: 'all', search: '' });
                    setSearchInput('');
                    fetchOrders();
                  }}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-lg transition-colors"
                >
                  Clear filters
                </button>
              ) : (
                <Link
                  href="/products"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-sm"
                >
                  Start Shopping
                </Link>
              )}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Order Header (clickable to toggle details) */}
                <div
                  className="p-6 border-b-2 border-gray-100 cursor-pointer focus:outline-none"
                  role="button"
                  tabIndex={0}
                  aria-expanded={expandedOrder === order._id}
                  onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedOrder(expandedOrder === order._id ? null : order._id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center mt-2 font-medium">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className={`px-4 py-2 rounded-full border-2 text-sm font-semibold flex items-center space-x-2 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">
                          ${order.total.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedOrder(expandedOrder === order._id ? null : order._id);
                        }}
                        className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {expandedOrder === order._id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Order Details (Expandable) */}
                {expandedOrder === order._id && (
                  <div className="p-6 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Order Items */}
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-6">Order Items</h4>
                        <div className="space-y-4">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
                              <div className="relative w-20 h-20 flex-shrink-0">
                                <Image
                                  src={(item.image as string) || '/placeholder-product.jpg'}
                                  alt={(item.name as string) || 'Product image'}
                                  fill
                                  className="object-cover rounded-lg"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-base font-semibold text-gray-900 truncate">
                                  {item.name}
                                </h5>
                                <p className="text-sm text-gray-600 font-medium">
                                  Quantity: {item.quantity}
                                </p>
                                {item.size && (
                                  <p className="text-sm text-gray-600 font-medium">
                                    Size: {item.size}
                                  </p>
                                )}
                                {item.color && (
                                  <p className="text-sm text-gray-600 font-medium">
                                    Color: {item.color}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-base font-bold text-gray-900">
                                  ${(item.price ?? 0).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h4>
                        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4 shadow-sm">
                          <div className="flex justify-between text-base">
                            <span className="text-gray-700 font-medium">Subtotal</span>
                            <span className="text-gray-900 font-semibold">${(order.subtotal ?? 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-base">
                            <span className="text-gray-700 font-medium">Shipping</span>
                            <span className="text-gray-900 font-semibold">${(order.shipping ?? 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-base">
                            <span className="text-gray-700 font-medium">Tax</span>
                            <span className="text-gray-900 font-semibold">${(order.tax ?? 0).toFixed(2)}</span>
                          </div>
                          <div className="border-t-2 border-gray-200 pt-4">
                            <div className="flex justify-between">
                              <span className="font-bold text-gray-900 text-lg">Total</span>
                              <span className="font-bold text-gray-900 text-lg">${order.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="mt-8">
                          <h4 className="text-lg font-bold text-gray-900 mb-4">Shipping Address</h4>
                          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                            <p className="text-base text-gray-900 font-medium leading-relaxed">
                              {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                              {order.shippingAddress.address1}<br />
                              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                              {order.shippingAddress.country}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-8 flex space-x-4">
                          <button 
                            onClick={() => handleDownloadInvoice(order._id)}
                            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors font-semibold text-gray-700"
                          >
                            <Download className="h-5 w-5" />
                            <span>Download Invoice</span>
                          </button>
                          <button 
                            onClick={() => handleTrackOrder(order._id)}
                            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
                          >
                            <Eye className="h-5 w-5" />
                            <span>Track Order</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-12">
            <div className="flex space-x-3">
              <button
                onClick={() => fetchOrders({ page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-6 py-3 border-2 border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-300 transition-colors font-semibold text-gray-700"
              >
                Previous
              </button>

              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => fetchOrders({ page })}
                    className={`px-6 py-3 border-2 rounded-lg font-semibold transition-colors ${
                      page === pagination.page
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => fetchOrders({ page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="px-6 py-3 border-2 border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-300 transition-colors font-semibold text-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tracking Modal */}
      {showTrackingModal && selectedOrderForTracking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Order Tracking</h2>
                <button
                  onClick={() => setShowTrackingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{selectedOrderForTracking.orderNumber}
                    </h3>
                    <p className="text-gray-600">
                      Estimated Delivery: {selectedOrderForTracking.estimatedDelivery}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center space-x-1 ${getStatusColor(selectedOrderForTracking.status)}`}>
                    {getStatusIcon(selectedOrderForTracking.status)}
                    <span className="capitalize">{selectedOrderForTracking.status}</span>
                  </div>
                </div>
                
                {selectedOrderForTracking.trackingNumber && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Tracking Number:</p>
                    <p className="font-mono text-lg font-semibold text-gray-900">
                      {selectedOrderForTracking.trackingNumber}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Tracking History</h4>
                {selectedOrderForTracking.tracking.map((event: any, index: number) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className={`w-3 h-3 rounded-full mt-2 ${event.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-gray-900">{event.status}</h5>
                        <span className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{event.description}</p>
                      <p className="text-gray-500 text-xs">{event.location}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900">
                    {selectedOrderForTracking.shippingAddress.firstName} {selectedOrderForTracking.shippingAddress.lastName}
                  </p>
                  <p className="text-gray-900">{selectedOrderForTracking.shippingAddress.address1}</p>
                  <p className="text-gray-900">
                    {selectedOrderForTracking.shippingAddress.city}, {selectedOrderForTracking.shippingAddress.state} {selectedOrderForTracking.shippingAddress.zipCode}
                  </p>
                  <p className="text-gray-900">{selectedOrderForTracking.shippingAddress.country}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
