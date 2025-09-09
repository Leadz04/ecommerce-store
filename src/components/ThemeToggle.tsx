'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Sun, Moon, Laptop } from 'lucide-react';

type ThemeChoice = 'light' | 'dark' | 'system';

export default function ThemeToggle() {
  const { user, updateProfile } = useAuthStore();
  const current: ThemeChoice = (user as any)?.settings?.theme || 'system';
  const [value, setValue] = useState<ThemeChoice>(current);

  const apply = async (next: ThemeChoice) => {
    setValue(next);
    try {
      await updateProfile({ settings: { ...(user as any)?.settings, theme: next } as any } as any);
    } catch {}
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        aria-label="Light theme"
        className={`p-2 rounded-lg border ${value === 'light' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        onClick={() => apply('light')}
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        aria-label="Dark theme"
        className={`p-2 rounded-lg border ${value === 'dark' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        onClick={() => apply('dark')}
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        aria-label="System theme"
        className={`p-2 rounded-lg border ${value === 'system' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        onClick={() => apply('system')}
      >
        <Laptop className="h-4 w-4" />
      </button>
    </div>
  );
}


