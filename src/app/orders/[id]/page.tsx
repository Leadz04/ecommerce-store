'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Download, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import toast from 'react-hot-toast';

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  const { currentOrder, isLoading, fetchOrder } = useOrderStore();

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

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.back()} className="text-white/80 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Order Details</h1>
              {currentOrder && (
                <p className="text-white/80">Order #{currentOrder.orderNumber}</p>
              )}
            </div>
          </div>
          {currentOrder && (
            <button
              onClick={handleDownloadInvoice}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading || !currentOrder ? (
          <div className="text-center py-20 text-slate-600">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {currentOrder.items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center space-x-4 p-5 bg-white rounded-xl border-2 border-slate-200 shadow-sm">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image src={item.image || '/placeholder-product.jpg'} alt={item.name} fill className="object-cover rounded-lg" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-sm text-slate-600">Qty: {item.quantity}</div>
                  </div>
                  <div className="font-semibold text-slate-900">${item.price.toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-slate-900">Summary</h2>
                <div className="space-y-3 text-slate-700">
                  <div className="flex justify-between"><span>Subtotal</span><span>${currentOrder.subtotal?.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span>${currentOrder.shipping?.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span>${currentOrder.tax?.toFixed(2)}</span></div>
                </div>
                <div className="mt-4 pt-4 border-t-2 border-slate-200 flex justify-between text-slate-900 font-bold text-lg">
                  <span>Total</span>
                  <span>${currentOrder.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-2 text-slate-900">Shipping Address</h2>
                <p className="text-slate-700 leading-relaxed">
                  {currentOrder.shippingAddress.firstName} {currentOrder.shippingAddress.lastName}<br/>
                  {currentOrder.shippingAddress.address1}<br/>
                  {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} {currentOrder.shippingAddress.zipCode}<br/>
                  {currentOrder.shippingAddress.country}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


