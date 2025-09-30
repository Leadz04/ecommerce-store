'use client';

import { useState } from 'react';
import { RefreshCw, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminToolsPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const call = async (label: string, url: string, options?: RequestInit) => {
    try {
      setLoading(label);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, ...(options?.headers || {}) },
        body: options?.body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `${label} failed`);
      toast.success(typeof data === 'object' ? JSON.stringify(data) : `${label} complete`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Wrench className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-semibold">Admin Tools</h1>
      </div>

      <div className="space-y-4 bg-white border rounded-xl p-6">
        <button
          onClick={() => call('Sync Latest Products', '/api/admin/products/sync-external')}
          disabled={loading !== null}
          className="w-full px-4 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading === 'Sync Latest Products' ? 'Syncing…' : 'Sync Latest Products'}
        </button>
        <button
          onClick={() => call('Backfill Specs', '/api/admin/products/backfill-specs', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 500 }) })}
          disabled={loading !== null}
          className="w-full px-4 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {loading === 'Backfill Specs' ? 'Backfilling…' : 'Backfill Specs'}
        </button>
      </div>
    </div>
  );
}
