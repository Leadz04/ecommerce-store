'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

type ThemeChoice = 'light' | 'dark' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { user } = useAuthStore();
  const theme: ThemeChoice = (user as any)?.settings?.theme || 'system';

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
    }
  }, [theme]);

  return <>{children}</>;
}


