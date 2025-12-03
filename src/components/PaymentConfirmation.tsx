'use client';

import { useState } from 'react';
import { CheckCircle, Package, Truck, Clock, ArrowRight, UserPlus, Mail, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface PaymentConfirmationProps {
  order: {
    _id: string;
    orderNumber: string;
    total: number;
    status: string;
    items: any[];
    shippingAddress: any;
    guestEmail?: string;
    userId?: string;
    createdAt: string;
  };
}

export default function PaymentConfirmation({ order }: PaymentConfirmationProps) {
  const { isAuthenticated } = useAuthStore();
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  
  const isGuestOrder = !order.userId;
  const guestEmail = order.guestEmail || order.shippingAddress?.email;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
          email: guestEmail,
          password,
          phone: order.shippingAddress.phone || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Auto-login after account creation
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: guestEmail,
          password,
        }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        localStorage.setItem('token', loginData.token);
        // Refresh auth state
        window.location.reload();
      }

      setAccountCreated(true);
      toast.success('Account created successfully!');
    } catch (error) {
      console.error('Account creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create account');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 py-4 sm:py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header with Celebration - Compact */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="relative inline-flex items-center justify-center mb-4">
            {/* Animated Success Icon */}
            <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
            <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-xl ring-4 ring-emerald-100">
              <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-white" strokeWidth={2.5} />
            </div>
            {/* Sparkle decorations */}
            <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400 animate-pulse drop-shadow-lg" />
            <Sparkles className="absolute -bottom-1 -left-1 h-4 w-4 text-pink-400 animate-pulse delay-75 drop-shadow-lg" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Payment Successful!
            </span>
          </h1>
          <p className="text-base sm:text-lg text-gray-700 font-semibold max-w-xl mx-auto leading-relaxed">
            Thank you for your order. We've received your payment and will process your order shortly.
          </p>
        </div>

        {/* Main Content Grid - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
          {/* Order Details Card - Compact */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-200/60 p-5 sm:p-6 transform transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2.5 tracking-tight">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                  <Package className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <span>Order Details</span>
              </h2>
              <span className="inline-flex items-center px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full text-xs sm:text-sm font-black shadow-lg ring-2 ring-emerald-200">
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" strokeWidth={2.5} />
                Paid
              </span>
            </div>
            
            <div className="space-y-3.5">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wider">Order #</span>
                <span className="font-black text-gray-900 text-sm sm:text-base font-mono tracking-tight">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wider">Date</span>
                <span className="font-bold text-gray-900 text-xs sm:text-sm">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wider">Items</span>
                <span className="font-bold text-gray-900 text-xs sm:text-sm">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm sm:text-base text-gray-600 font-bold">Total Amount</span>
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-700 text-2xl sm:text-3xl tracking-tight">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address - Compact */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-200/60 p-5 sm:p-6 transform transition-all hover:shadow-2xl hover:-translate-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-5 flex items-center gap-2.5 tracking-tight">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md ring-2 ring-blue-100">
                <Truck className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <span>Shipping Address</span>
            </h3>
            
            <div className="space-y-3.5">
              {/* Full Name */}
              <div className="pb-3 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-wider w-20 flex-shrink-0">Name</span>
                  <p className="font-black text-gray-900 text-sm sm:text-base leading-tight">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                </div>
              </div>

              {/* Street Address */}
              <div className="pb-3 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-wider w-20 flex-shrink-0">Address</span>
                  <div className="flex-1">
                    <p className="text-gray-800 font-bold text-xs sm:text-sm leading-relaxed">{order.shippingAddress.address1}</p>
                    {order.shippingAddress.address2 && (
                      <p className="text-gray-600 text-xs sm:text-sm mt-1 font-medium">{order.shippingAddress.address2}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* City, State, ZIP */}
              <div className="pb-3 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-wider w-20 flex-shrink-0">Location</span>
                  <p className="text-gray-800 font-bold text-xs sm:text-sm leading-tight">
                    <span className="font-black">{order.shippingAddress.city}</span>, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                </div>
              </div>

              {/* Country */}
              <div className="pb-3 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-wider w-20 flex-shrink-0">Country</span>
                  <p className="text-gray-800 font-black text-xs sm:text-sm">{order.shippingAddress.country}</p>
                </div>
              </div>

              {/* Phone Number */}
              {order.shippingAddress.phone && (
                <div className="pt-2">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wider w-20 flex-shrink-0">Phone</span>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-sm">
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-black">📞</span>
                      </div>
                      <p className="text-gray-900 font-black text-xs sm:text-sm tracking-tight">{order.shippingAddress.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Next Steps - Compact Grid */}
        <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl shadow-2xl border-2 border-blue-400/40 p-5 sm:p-6 mb-4 sm:mb-5 text-white ring-4 ring-blue-200/20">
          <h3 className="text-xl sm:text-2xl font-black text-white mb-5 flex items-center gap-2.5 tracking-tight">
            <Sparkles className="h-6 w-6 drop-shadow-lg" strokeWidth={2.5} />
            <span>What's Next?</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border-2 border-white/25 shadow-lg hover:bg-white/20 transition-all">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-white/20">
                  <Package className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <p className="font-black text-white text-sm sm:text-base tracking-tight">Processing</p>
              </div>
              <p className="text-xs sm:text-sm text-blue-50 font-semibold ml-12">Preparing for shipment</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border-2 border-white/25 shadow-lg hover:bg-white/20 transition-all">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-white/20">
                  <Truck className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <p className="font-black text-white text-sm sm:text-base tracking-tight">Shipping</p>
              </div>
              <p className="text-xs sm:text-sm text-blue-50 font-semibold ml-12">Tracking via email</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border-2 border-white/25 shadow-lg hover:bg-white/20 transition-all">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-white/20">
                  <Clock className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <p className="font-black text-white text-sm sm:text-base tracking-tight">Delivery</p>
              </div>
              <p className="text-xs sm:text-sm text-blue-50 font-semibold ml-12">3-5 business days</p>
            </div>
          </div>
        </div>

        {/* Guest Account Creation - Compact */}
        {isGuestOrder && !isAuthenticated && !accountCreated && (
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl border-2 border-purple-400/40 p-5 sm:p-6 mb-4 sm:mb-5 text-white ring-4 ring-purple-200/20">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/25 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
                  <UserPlus className="h-6 w-6 sm:h-7 sm:w-7 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">Create an Account</h3>
                <p className="text-blue-50 mb-5 text-sm sm:text-base font-semibold leading-relaxed">
                  Track orders, save address, faster checkout!
                </p>
                {!showCreateAccount ? (
                  <button
                    onClick={() => setShowCreateAccount(true)}
                    className="bg-white text-purple-600 px-6 py-3 rounded-xl font-black hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 text-sm sm:text-base tracking-tight"
                  >
                    Create Account
                  </button>
                ) : (
                  <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div>
                      <label className="block text-sm sm:text-base font-black text-white mb-2 uppercase tracking-wide text-xs">
                        Email
                      </label>
                      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/20 backdrop-blur-md rounded-xl border-2 border-white/30 shadow-md">
                        <Mail className="h-5 w-5 text-white" strokeWidth={2} />
                        <span className="text-white font-bold text-sm sm:text-base">{guestEmail}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm sm:text-base font-black text-white mb-2 uppercase tracking-wide text-xs">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-4 py-3 border-2 border-white/30 bg-white/15 backdrop-blur-md rounded-xl focus:ring-2 focus:ring-white focus:border-white text-white placeholder-blue-200 font-bold text-sm sm:text-base shadow-md"
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="flex-1 bg-white text-purple-600 py-3 px-5 rounded-xl font-black hover:bg-blue-50 disabled:opacity-50 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 text-sm sm:text-base tracking-tight"
                      >
                        {isCreating ? 'Creating...' : 'Create Account'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateAccount(false)}
                        className="px-5 py-3 border-2 border-white/50 text-white rounded-xl font-black hover:bg-white/20 transition-all backdrop-blur-sm text-sm sm:text-base tracking-tight"
                      >
                        Skip
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Compact */}
        <div className="flex flex-col sm:flex-row gap-4">
          {isAuthenticated || accountCreated ? (
            <Link
              href="/orders"
              className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-4 px-6 rounded-2xl font-black text-center hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 text-base sm:text-lg flex items-center justify-center gap-2.5 tracking-tight ring-4 ring-blue-200/30"
            >
              <Package className="h-5 w-5" strokeWidth={2.5} />
              <span>View Order Details</span>
            </Link>
          ) : (
            <div className="flex-1 text-center py-4 px-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200 shadow-md">
              <p className="text-sm sm:text-base text-gray-700 font-bold">Check your email for order updates</p>
            </div>
          )}
          <Link
            href="/"
            className="flex-1 bg-white text-gray-900 py-4 px-6 rounded-2xl font-black text-center hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl border-2 border-gray-200 hover:border-gray-300 transform hover:scale-105 flex items-center justify-center gap-2.5 text-base sm:text-lg tracking-tight"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}
