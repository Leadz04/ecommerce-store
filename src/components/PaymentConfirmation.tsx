'use client';

import { useState } from 'react';
import { CheckCircle, Package, Truck, Clock, ArrowRight, UserPlus, Mail } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
          <p className="text-slate-600 text-lg">
            Thank you for your order. We've received your payment and will process your order shortly.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Order Confirmation</h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Paid
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Order Number</span>
              <span className="font-semibold text-slate-900">#{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Order Date</span>
              <span className="font-semibold text-slate-900">{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Total Amount</span>
              <span className="font-semibold text-slate-900">${order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Items</span>
              <span className="font-semibold text-slate-900">{order.items.length} item(s)</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Shipping Address</h3>
          <div className="text-slate-700">
            <p className="font-medium">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </p>
            <p>{order.shippingAddress.address1}</p>
            {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
            </p>
            <p>{order.shippingAddress.country}</p>
            {order.shippingAddress.phone && <p className="mt-2">{order.shippingAddress.phone}</p>}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">What's Next?</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-900">Order Processing</p>
                <p className="text-sm text-blue-700">We'll prepare your items for shipment</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-900">Shipping Notification</p>
                <p className="text-sm text-blue-700">You'll receive tracking information via email</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-900">Delivery</p>
                <p className="text-sm text-blue-700">Expected delivery within 3-5 business days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Account Creation */}
        {isGuestOrder && !isAuthenticated && !accountCreated && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Create an Account</h3>
                <p className="text-slate-600 mb-4">
                  Create a free account to track your orders, save your address, and enjoy faster checkout next time!
                </p>
                {!showCreateAccount ? (
                  <button
                    onClick={() => setShowCreateAccount(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Create Account
                  </button>
                ) : (
                  <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email
                      </label>
                      <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100 rounded-lg">
                        <Mail className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-700">{guestEmail}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Create Password *
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password (min 6 characters)"
                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isCreating ? 'Creating...' : 'Create Account'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateAccount(false)}
                        className="px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {isAuthenticated || accountCreated ? (
            <Link
              href="/orders"
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold text-center hover:bg-blue-700 transition-colors"
            >
              View Order Details
            </Link>
          ) : (
            <div className="flex-1 text-center py-3 px-6 text-slate-600">
              <p className="text-sm">Check your email for order updates</p>
            </div>
          )}
          <Link
            href="/"
            className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-xl font-semibold text-center hover:bg-slate-200 transition-colors flex items-center justify-center space-x-2"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
