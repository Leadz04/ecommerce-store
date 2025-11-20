'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, LoginCredentials, SignupCredentials, AuthState } from '@/types';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  clearError: () => void;
  verifyToken: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('[AuthStore] Attempting login for:', credentials.email);
          const response = await fetch(`/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });

          console.log('[AuthStore] Login response status:', response.status);
          const data = await response.json();

          if (!response.ok) {
            // Only log error in development mode
            if (process.env.NODE_ENV === 'development') {
              console.error('[AuthStore] Login failed:', data.error);
            }
            throw new Error(data.error || 'Login failed');
          }

          console.log('[AuthStore] Login successful for:', data.user.email);
          // Store token in localStorage
          localStorage.setItem('token', data.token);

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed'
          });
        }
      },

      signup: async (credentials: SignupCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('[AuthStore] Attempting registration for:', credentials.email);
          const response = await fetch(`/api/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
          }

          // Store token in localStorage
          localStorage.setItem('token', data.token);

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Signup failed'
          });
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      },

      updateProfile: async (updates: Partial<AuthUser>) => {
        // Optimistic update for settings/theme for snappy UI
        const prev = get().user;
        if (prev && updates.settings) {
          set({ user: { ...prev, settings: { ...(prev as any).settings, ...updates.settings } } as any });
        }
        set({ isLoading: true, error: null });
        
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('No authentication token');
          }

          console.log('[AuthStore] Updating user profile');
          const response = await fetch(`/api/auth/me`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updates),
          });

          const text = await response.text();
          const data = text ? JSON.parse(text) : {};

          if (!response.ok) {
            throw new Error(data.error || 'Profile update failed');
          }

          if (data.user) {
            set({
              user: data.user,
              isLoading: false,
              error: null
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          // Revert optimistic update on failure
          set({
            user: prev || null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Profile update failed'
          });
        }
      },

      verifyToken: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          console.log('[AuthStore] Verifying token');
          const response = await fetch(`/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            localStorage.removeItem('token');
            set({ isAuthenticated: false, user: null });
            return;
          }

          const data = await response.json();
          set({
            user: data.user,
            isAuthenticated: true
          });
        } catch (error) {
          localStorage.removeItem('token');
          set({ isAuthenticated: false, user: null });
        }
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
);