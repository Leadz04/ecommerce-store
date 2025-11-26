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
    items: {
      productId: string | undefined;
      name: string;
      price: number;
      quantity: number;
      image: string;
      size?: string;
      color?: string;
      promoToken?: string;
      promoPercent?: number;
      promoOriginalPrice?: number;
    }[];
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    shippingAddress: any;
    billingAddress: any;
    paymentMethod: string;
    paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
    paymentIntentId?: string;
  }) => Promise<Order>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
  clearError: () => void;
}

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

      // For guest orders, add email or orderNumber
      if (!token && (params as any).email) {
        searchParams.set('email', (params as any).email);
      } else if (!token && (params as any).orderNumber) {
        searchParams.set('orderNumber', (params as any).orderNumber);
      }

      console.log('[OrderStore] Fetching orders:', searchParams.toString());
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/orders?${searchParams.toString()}`, {
        headers,
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

      console.log('[OrderStore] Fetching order:', id);
      const response = await fetch(`/api/orders/${id}`, {
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
      
      // Build headers - include token if available (for authenticated users)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('[OrderStore] Creating order', token ? '(authenticated)' : '(guest)');
      const response = await fetch(`/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      console.log('Order creation response:', data);

      if (!response.ok) {
        console.error('Order creation failed:', data);
        throw new Error(data.error || 'Failed to create order');
      }

      console.log('Order from API:', data.order);
      console.log('Order _id:', data.order?._id);

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

      console.log('[OrderStore] Updating order:', id);
      const response = await fetch(`/api/orders/${id}`, {
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

  cancelOrder: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      console.log('[OrderStore] Cancelling order:', id);
      const response = await fetch(`/api/orders/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel order');
      }

      // Update the order in the store
      set((state) => ({
        orders: state.orders.map(order => 
          order._id === id ? { ...order, status: 'cancelled' } : order
        ),
        currentOrder: state.currentOrder?._id === id 
          ? { ...state.currentOrder, status: 'cancelled' } 
          : state.currentOrder,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to cancel order'
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
