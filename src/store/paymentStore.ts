'use client';

import { create } from 'zustand';

interface PaymentStore {
  isLoading: boolean;
  error: string | null;
  clientSecret: string | null;
  createPaymentIntent: (orderId: string, paymentMethodId?: string) => Promise<string>;
  clearError: () => void;
}

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  isLoading: false,
  error: null,
  clientSecret: null,

  createPaymentIntent: async (orderId: string, paymentMethodId?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const token = localStorage.getItem('token');
      
      // Build headers - include token if available (for authenticated users)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('[PaymentStore] Creating payment intent for order:', orderId, token ? '(authenticated)' : '(guest)', paymentMethodId ? 'with saved payment method' : '');
      const response = await fetch(`/api/payments/create-payment-intent`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId, paymentMethodId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      set({
        clientSecret: data.clientSecret,
        isLoading: false,
        error: null
      });

      return data.clientSecret;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create payment intent'
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
