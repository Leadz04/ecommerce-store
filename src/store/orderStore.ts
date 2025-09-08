'use client';

import { create } from 'zustand';
import { Order, CartItem } from '@/types';

interface OrderStore {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  fetchOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    dateRange?: string;
  }) => Promise<void>;
  fetchOrder: (id: string) => Promise<void>;
  createOrder: (orderData: {
    items: CartItem[];
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    shippingAddress: any;
    billingAddress: any;
    paymentMethod: string;
  }) => Promise<Order>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  clearError: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },

  fetchOrders: async (params = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const searchParams = new URLSearchParams();
      searchParams.set('page', (params.page || 1).toString());
      searchParams.set('limit', (params.limit || 10).toString());
      
      if (params.status && params.status !== 'all') {
        searchParams.set('status', params.status);
      }
      
      if (params.search) {
        searchParams.set('search', params.search);
      }
      
      if (params.dateRange && params.dateRange !== 'all') {
        searchParams.set('dateRange', params.dateRange);
      }

      const response = await fetch(`${API_BASE_URL}/api/orders?${searchParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      set({
        orders: data.orders,
        pagination: data.pagination,
        isLoading: false,
        error: null
      });
    } catch (error) {
      set({
        orders: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch orders'
      });
    }
  },

  fetchOrder: async (id: string) => {
    set({ isLoading: true, error: null, currentOrder: null });
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch order');
      }

      set({
        currentOrder: data.order,
        isLoading: false,
        error: null
      });
    } catch (error) {
      set({
        currentOrder: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order'
      });
    }
  },

  createOrder: async (orderData) => {
    set({ isLoading: true, error: null });
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Order creation failed:', data);
        throw new Error(data.error || 'Failed to create order');
      }

      set({
        currentOrder: data.order,
        isLoading: false,
        error: null
      });

      return data.order;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create order'
      });
      throw error;
    }
  },

  updateOrder: async (id: string, updates: Partial<Order>) => {
    set({ isLoading: true, error: null });
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order');
      }

      // Update the order in the store
      set((state) => ({
        orders: state.orders.map(order => 
          order._id === id ? data.order : order
        ),
        currentOrder: state.currentOrder?._id === id ? data.order : state.currentOrder,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update order'
      });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
