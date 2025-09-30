'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { RefreshCw, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuditLogsPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [userId, setUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (action) params.set('action', action);
      if (resourceType) params.set('resourceType', resourceType);
      if (userId) params.set('userId', userId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch logs');
      setLogs(data.logs);
      setTotalPages(data.pagination.pages);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.permissions?.includes('dashboard:view')) {
      router.push('/');
      toast.error('Access denied');
      return;
    }
    fetchLogs();
  }, [isAuthenticated, user, page, limit]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <button onClick={fetchLogs} className="flex items-center gap-2 px-3 py-2 border rounded-md">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Action (e.g., product:update)" className="px-3 py-2 border rounded" />
          <input value={resourceType} onChange={(e) => setResourceType(e.target.value)} placeholder="Resource Type (e.g., Product)" className="px-3 py-2 border rounded" />
          <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" className="px-3 py-2 border rounded" />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 border rounded" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 border rounded" />
          <button onClick={() => { setPage(1); fetchLogs(); }} className="px-3 py-2 border rounded flex items-center justify-center gap-2">
            <Filter className="h-4 w-4" /> Apply
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Date</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">User</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Action</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Resource</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No logs</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="border-t">
                  <td className="px-4 py-2 text-sm text-gray-600">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{log.userId}</td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{log.action}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{log.resourceType} {log.resourceId ? `(${log.resourceId.slice(-6)})` : ''}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(log.metadata || {}, null, 2)}</pre>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }} className="px-2 py-1 border rounded text-sm">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
