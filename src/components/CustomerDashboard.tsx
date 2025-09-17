'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Heart, 
  User, 
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

import type { Order } from '@/types';

export default function CustomerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { orders, fetchOrders, isLoading: ordersLoading } = useOrderStore();
  const { items: wishlist, fetchWishlist, removeFromWishlist, isLoading: wishlistLoading } = useWishlistStore();
  const { addItem } = useCartStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'wishlist'>('overview');
  const [orderFilter, setOrderFilter] = useState<string>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Fetch customer data
    fetchOrders();
    fetchWishlist();
  }, [isAuthenticated, router, fetchOrders, fetchWishlist]);

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        toast.error('Please log in to download invoice');
        return;
      }
      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to download invoice');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const handleOrderFilter = (status: string) => {
    setOrderFilter(status);
    setActiveTab('orders');
  };

  const filteredOrders = orderFilter === 'all' 
    ? orders 
    : orderFilter === 'pending' 
    ? orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status))
    : orders.filter(o => o.status === orderFilter);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'shipped':
        return <Package className="h-4 w-4 text-purple-500" />;
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="h-5 w-5 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ShoppingBag className="h-5 w-5 inline mr-2" />
              My Orders
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'wishlist'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Heart className="h-5 w-5 inline mr-2" />
              Wishlist
            </button>
            {/* Profile tab removed */}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              onClick={() => handleOrderFilter('all')}
              className="bg-white p-6 rounded-xl shadow-sm border-2 border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer text-left"
            >
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Orders</p>
                  <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleOrderFilter('delivered')}
              className="bg-white p-6 rounded-xl shadow-sm border-2 border-slate-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer text-left"
            >
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Completed Orders</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {orders.filter(o => o.status === 'delivered').length}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className="bg-white p-6 rounded-xl shadow-sm border-2 border-slate-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer text-left"
            >
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Wishlist Items</p>
                  <p className="text-2xl font-bold text-slate-900">{wishlist.length}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleOrderFilter('pending')}
              className="bg-white p-6 rounded-xl shadow-sm border-2 border-slate-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer text-left"
            >
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length}
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200">
            <div className="p-6 border-b-2 border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">
                  {orderFilter === 'all' ? 'All Orders' : 
                   orderFilter === 'delivered' ? 'Completed Orders' :
                   orderFilter === 'pending' ? 'Pending Orders' :
                   orderFilter === 'cancelled' ? 'Cancelled Orders' : 'My Orders'}
                </h2>
                {orderFilter !== 'all' && (
                  <button
                    onClick={() => setOrderFilter('all')}
                    className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Show All Orders
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {ordersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-slate-500 mt-4">Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    {orderFilter === 'all' ? 'No orders yet' : 
                     orderFilter === 'delivered' ? 'No completed orders' :
                     orderFilter === 'pending' ? 'No pending orders' :
                     orderFilter === 'cancelled' ? 'No cancelled orders' : 'No orders found'}
                  </h3>
                  <p className="text-slate-500 mb-4">
                    {orderFilter === 'all' ? 'Start shopping to see your orders here.' : 
                     `No ${orderFilter} orders found.`}
                  </p>
                  {orderFilter === 'all' && (
                    <Link
                      href="/products"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Start Shopping
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order: Order) => (
                    <div key={order._id} className="border-2 border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            Order #{order.orderNumber}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-slate-900">
                            ${order.total.toFixed(2)}
                          </p>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border-2 ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/orders/${order._id}`}
                            className="flex items-center space-x-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Details</span>
                          </Link>
                          <button 
                            onClick={() => handleDownloadInvoice(order._id)} 
                            className="flex items-center space-x-1 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            <span>Invoice</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Wishlist</h2>
                {wishlist.length > 0 && (
                  <button
                    onClick={() => {
                      wishlist.forEach((product: any) => {
                        if (product.inStock) {
                          addItem(product, 1);
                        }
                      });
                      toast.success('All available items added to cart!');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add All to Cart
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {wishlistLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2 text-sm">Loading...</p>
                </div>
              ) : wishlist.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
                  <p className="text-gray-500 mb-4 text-sm">Add items to your wishlist to see them here.</p>
                  <Link
                    href="/products"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wishlist.map((product: any) => (
                    <div key={product._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex space-x-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <div className="relative">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            {!product.inStock && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xs font-medium">Out of Stock</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-medium text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                          <p className="text-lg font-bold text-blue-600 mb-2">${product.price}</p>
                          
                          {/* Stock Status */}
                          {product.inStock ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ In Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              ✗ Out of Stock
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <Link
                            href={`/products/${product._id}`}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Details</span>
                          </Link>
                          <button
                            onClick={() => {
                              addItem(product, 1);
                              toast.success('Added to cart!');
                            }}
                            disabled={!product.inStock}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Add to Cart
                          </button>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await removeFromWishlist(product._id);
                              toast.success('Removed from wishlist');
                            } catch (error) {
                              toast.error('Failed to remove from wishlist');
                            }
                          }}
                          className="w-full flex items-center justify-center space-x-1 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 hover:border-red-300 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Remove from Wishlist</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile section removed */}
      </div>
    </div>
  );
}
