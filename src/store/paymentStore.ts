'use client';

import { create } from 'zustand';

interface PaymentStore {
  isLoading: boolean;
  error: string | null;
  clientSecret: string | null;
  createPaymentIntent: (orderId: string) => Promise<string>;
  clearError: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  isLoading: false,
  error: null,
  clientSecret: null,

  createPaymentIntent: async (orderId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/api/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
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
