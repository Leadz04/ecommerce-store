'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Download, RotateCcw, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  const { currentOrder, isLoading, fetchOrder, cancelOrder } = useOrderStore();
  const { addItem } = useCartStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const id = Array.isArray(params?.id) ? params?.id[0] : (params as any)?.id;
    if (id) fetchOrder(id as string);
  }, [isAuthenticated, router, fetchOrder, params]);

  const handleDownloadInvoice = async () => {
    if (!currentOrder) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        toast.error('Please log in to download invoice');
        return;
      }
      const response = await fetch(`/api/orders/${currentOrder._id}/invoice`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to download invoice');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${currentOrder.orderNumber}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const handleReorder = async () => {
    if (!currentOrder) return;
    try {
      // Fetch product details for each item and add to cart
      let addedCount = 0;
      for (const item of currentOrder.items) {
        try {
          const response = await fetch(`/api/products/${item.productId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.product && data.product.inStock) {
              addItem(data.product, item.quantity, item.size, item.color);
              addedCount++;
            }
          }
        } catch (error) {
          console.error(`Failed to fetch product ${item.productId}:`, error);
        }
      }
      
      if (addedCount > 0) {
        toast.success(`${addedCount} item(s) added to cart`);
        router.push('/cart');
      } else {
        toast.error('No items could be added to cart (may be out of stock)');
      }
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder items');
    }
  };

  const handleCancelOrder = async () => {
    if (!currentOrder) return;
    
    // Check if order can be cancelled (within 24 hours and not already shipped/delivered)
    const orderDate = new Date(currentOrder.createdAt);
    const hoursSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60);
    const canCancel = hoursSinceOrder <= 24 && 
                      currentOrder.status !== 'shipped' && 
                      currentOrder.status !== 'delivered' &&
                      currentOrder.status !== 'cancelled';

    if (!canCancel) {
      if (hoursSinceOrder > 24) {
        toast.error('Orders can only be cancelled within 24 hours of placement');
      } else if (currentOrder.status === 'shipped' || currentOrder.status === 'delivered') {
        toast.error('This order cannot be cancelled as it has already been shipped or delivered');
      } else if (currentOrder.status === 'cancelled') {
        toast.error('This order is already cancelled');
      }
      return;
    }

    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      await cancelOrder(currentOrder._id);
      toast.success('Order cancelled successfully');
      fetchOrder(currentOrder._id); // Refresh order details
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Order Details</h1>
              {currentOrder && (
                <p className="text-sm sm:text-base text-white/80 mt-1">Order #{currentOrder.orderNumber}</p>
              )}
            </div>
            {currentOrder && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  onClick={handleReorder}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-green-500/20 text-white rounded-lg hover:bg-green-500/30 transition-colors text-sm sm:text-base border border-green-400/30"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reorder</span>
                </button>
                {(() => {
                  const orderDate = new Date(currentOrder.createdAt);
                  const hoursSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60);
                  const canCancel = hoursSinceOrder <= 24 && 
                                    currentOrder.status !== 'shipped' && 
                                    currentOrder.status !== 'delivered' &&
                                    currentOrder.status !== 'cancelled';
                  return canCancel ? (
                    <button
                      onClick={handleCancelOrder}
                      className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-red-500/20 text-white rounded-lg hover:bg-red-500/30 transition-colors text-sm sm:text-base border border-red-400/30"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel Order</span>
                    </button>
                  ) : null;
                })()}
                <button
                  onClick={handleDownloadInvoice}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm sm:text-base border border-white/20"
                >
                  <Download className="h-4 w-4" />
                  <span>Invoice</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {isLoading || !currentOrder ? (
          <div className="text-center py-12 sm:py-20 text-slate-600">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {currentOrder.items.map((item: any, idx: number) => (
                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 bg-white rounded-xl border-2 border-slate-200 shadow-sm">
                  <div className="relative w-full sm:w-20 h-32 sm:h-20 lg:h-24 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image 
                      src={item.image || '/placeholder-product.jpg'} 
                      alt={item.name} 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                  <div className="flex-1 w-full sm:w-auto min-w-0">
                    <div className="font-semibold text-slate-900 text-sm sm:text-base truncate">{item.name}</div>
                    <div className="text-xs sm:text-sm text-slate-600 mt-1">Qty: {item.quantity}</div>
                    {item.size && (
                      <div className="text-xs sm:text-sm text-slate-600 mt-1">Size: {item.size}</div>
                    )}
                    {item.color && (
                      <div className="text-xs sm:text-sm text-slate-600 mt-1">Color: {item.color}</div>
                    )}
                  </div>
                  <div className="font-semibold text-slate-900 text-base sm:text-lg w-full sm:w-auto text-right sm:text-left shrink-0">
                    ${item.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white rounded-xl border-2 border-slate-200 p-4 sm:p-5 lg:p-6 shadow-sm">
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-slate-900">Summary</h2>
                <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-slate-700">
                  <div className="flex justify-between items-center">
                    <span>Subtotal</span>
                    <span className="font-medium">${currentOrder.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Shipping</span>
                    <span className="font-medium">${currentOrder.shipping?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tax</span>
                    <span className="font-medium">${currentOrder.tax?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t-2 border-slate-200 flex justify-between items-center text-slate-900 font-bold text-base sm:text-lg">
                  <span>Total</span>
                  <span>${currentOrder.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border-2 border-slate-200 p-4 sm:p-5 lg:p-6 shadow-sm">
                <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-slate-900">Shipping Address</h2>
                <div className="text-sm sm:text-base text-slate-700 leading-relaxed break-words">
                  <p className="font-medium">{currentOrder.shippingAddress.firstName} {currentOrder.shippingAddress.lastName}</p>
                  <p className="mt-1">{currentOrder.shippingAddress.address1}</p>
                  {currentOrder.shippingAddress.address2 && (
                    <p>{currentOrder.shippingAddress.address2}</p>
                  )}
                  <p>{currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} {currentOrder.shippingAddress.zipCode}</p>
                  <p>{currentOrder.shippingAddress.country}</p>
                </div>
              </div>

              {currentOrder.status && (
                <div className="bg-white rounded-xl border-2 border-slate-200 p-4 sm:p-5 lg:p-6 shadow-sm">
                  <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-slate-900">Order Status</h2>
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium capitalize ${
                    currentOrder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    currentOrder.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    currentOrder.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    currentOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {currentOrder.status}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


