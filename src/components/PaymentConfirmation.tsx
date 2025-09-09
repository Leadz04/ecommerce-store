'use client';

import { CheckCircle, Package, Truck, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PaymentConfirmationProps {
  order: {
    _id: string;
    orderNumber: string;
    total: number;
    status: string;
    items: any[];
    shippingAddress: any;
    createdAt: string;
  };
}

export default function PaymentConfirmation({ order }: PaymentConfirmationProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/orders"
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold text-center hover:bg-blue-700 transition-colors"
          >
            View Order Details
          </Link>
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
