'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { PERMISSIONS } from '@/lib/permissions';
import BlogForm from '@/components/BlogForm';
import { Plus, Edit, Trash2, Search, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  status: 'draft' | 'published' | 'archived';
  publishAt?: string | null;
  createdAt: string;
}

export default function BlogAdmin() {
  const { user } = useAuthStore();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; onConfirm: (() => void) | null }>({ open: false, title: '', message: '', onConfirm: null });
  const [seedLoading, setSeedLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const canManage = !!user?.permissions?.includes(PERMISSIONS.CONTENT_MANAGE);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/blogs?${params.toString()}` , {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load blogs');
      setBlogs(data.blogs || []);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      toast.success('Blog deleted');
      loadBlogs();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleSeed = async () => {
    if (!confirm('Seed 5 sample blogs as drafts?')) return;
    try {
      setSeedLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/blogs/seed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to seed');
      toast.success(`Seeded ${data.inserted} blogs`);
      loadBlogs();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to seed');
    } finally {
      setSeedLoading(false);
    }
  };

  const handleEnrichPublish = async () => {
    if (!confirm('Set descriptions and publish the 5 sample blogs?')) return;
    try {
      setEnrichLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/blogs/enrich-publish', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update blogs');
      toast.success(`Updated ${data.updated} blogs`);
      loadBlogs();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to update blogs');
    } finally {
      setEnrichLoading(false);
    }
  };

  const handleGenerateFromProducts = async () => {
    setConfirmState({
      open: true,
      title: 'Generate Blogs from Products',
      message: 'Create up to 25 SEO blogs (Men, Women, Office & Travel, Accessories, Gifting) from your products? Existing slugs are skipped.',
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, open: false }));
        try {
          setGenLoading(true);
          setConfirmLoading(true);
          const token = localStorage.getItem('token');
          const res = await fetch('/api/admin/blogs/generate-from-products', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'published' })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to generate');
          toast.success(`Created ${data.created} blogs`);
          loadBlogs();
        } catch (err) {
          console.error(err);
          toast.error(err instanceof Error ? err.message : 'Failed to generate blogs');
        } finally {
          setGenLoading(false);
          setConfirmLoading(false);
        }
      }
    });
  };

  if (!canManage) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold">Blogs</h1>
        <p className="text-gray-600 mt-2">You do not have permission to manage blogs.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-purple-900">Blogs</h1>
        <div className="flex items-center gap-2">
          <button disabled={seedLoading} onClick={handleSeed} className={`px-3 py-2 border border-purple-300 rounded-lg ${seedLoading ? 'opacity-60 cursor-not-allowed' : 'text-purple-700 hover:bg-purple-50'}`}>
            {seedLoading ? (<span className="inline-flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>Seeding...</span>) : 'Seed Sample Blogs'}
          </button>
          <button disabled={genLoading} onClick={handleGenerateFromProducts} className={`px-3 py-2 border border-blue-300 rounded-lg ${genLoading ? 'opacity-60 cursor-not-allowed' : 'text-blue-700 hover:bg-blue-50'}`}>
            {genLoading ? (<span className="inline-flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>Generating...</span>) : 'Generate From Products'}
          </button>
          <button disabled={enrichLoading} onClick={handleEnrichPublish} className={`px-3 py-2 border border-green-300 rounded-lg ${enrichLoading ? 'opacity-60 cursor-not-allowed' : 'text-green-700 hover:bg-green-50'}`}>
            {enrichLoading ? (<span className="inline-flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>Publishing...</span>) : 'Enrich & Publish'}
          </button>
          <button disabled={aiLoading} onClick={() => setShowAIModal(true)} className={`px-3 py-2 border border-orange-300 rounded-lg ${aiLoading ? 'opacity-60 cursor-not-allowed' : 'text-orange-700 hover:bg-orange-50'}`}> 
            {aiLoading ? (<span className="inline-flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>AI Generating...</span>) : 'AI Generate'}
          </button>
          <button disabled={bulkLoading} onClick={async () => {
            try {
              setBulkLoading(true);
              const token = localStorage.getItem('token');
              const res = await fetch('/api/admin/blogs/ai-regenerate-all', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ minWords: 2200 }) });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Failed to start job');
              const jobId = data.jobId;
              toast.success('Bulk regeneration started');
              // Poll job status in the background
              const poll = async () => {
                try {
                  const r = await fetch(`/api/admin/blogs/ai-regenerate-all?jobId=${jobId}`);
                  const j = await r.json();
                  if (j.status === 'succeeded') {
                    toast.success(`Regenerated ${j.result?.updated || 0} blogs`);
                    loadBlogs();
                  } else if (j.status === 'failed') {
                    toast.error(j.error || 'Bulk regenerate failed');
                  } else {
                    setTimeout(poll, 1500);
                  }
                } catch (_) {
                  setTimeout(poll, 2000);
                }
              };
              if (jobId) poll();
            } catch (e) {
              console.error(e);
              toast.error(e instanceof Error ? e.message : 'Failed to start job');
            } finally {
              setBulkLoading(false);
            }
          }} className={`px-3 py-2 border border-indigo-300 rounded-lg ${bulkLoading ? 'opacity-60 cursor-not-allowed' : 'text-indigo-700 hover:bg-indigo-50'}`}>
            {bulkLoading ? (<span className="inline-flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>Starting...</span>) : 'AI Regenerate All'}
          </button>
          <button onClick={() => { setEditingBlog(null); setShowForm(true); }} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm">
            <Plus className="h-4 w-4 inline mr-2" /> New Blog
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-gray-900 px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Search title, description or tags"
          />
          <button onClick={() => loadBlogs()} className="px-3 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50">
            <Search className="h-4 w-4" />
          </button>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-purple-900">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Grid layout similar to blog homepage */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {blogs.map((b) => (
          <div key={b._id} className="rounded-lg border bg-white overflow-hidden shadow-sm hover:shadow transition">
            <a href={`/blog/${b.slug}`} target="_blank" rel="noopener noreferrer">
              <div className="aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                {b.coverImage ? (
                  <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-50 to-purple-100" />
                )}
              </div>
            </a>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full ${b.status==='published'?'bg-green-100 text-green-800':b.status==='archived'?'bg-gray-100 text-gray-700':'bg-purple-100 text-purple-800'}`}>{b.status}</span>
                <span className="text-xs text-gray-500">{b.publishAt ? new Date(b.publishAt).toLocaleDateString() : '-'}</span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-gray-900 line-clamp-2">{b.title}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">/{b.slug}</p>
              <div className="mt-3 flex justify-end gap-2">
                <a href={`/blog/${b.slug}`} target="_blank" rel="noopener noreferrer" className="text-purple-700 hover:text-purple-900" title="View">
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button onClick={() => { setEditingBlog(b as any); setShowForm(true); }} className="text-purple-700 hover:text-purple-900" title="Edit">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(b._id)} className="text-red-600 hover:text-red-800" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* End list view */}

      {confirmState.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{confirmState.title}</h3>
            </div>
            <div className="p-5 text-gray-700">{confirmState.message}</div>
            <div className="p-4 flex justify-end gap-2 border-t">
              <button onClick={() => setConfirmState((s) => ({ ...s, open: false }))} className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => confirmState.onConfirm && confirmState.onConfirm()} className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-900">AI Generate Blog</h3>
            </div>
            <AIGenerateForm
              onCancel={() => setShowAIModal(false)}
              onSubmit={async (payload) => {
                try {
                  setAiLoading(true);
                  const token = localStorage.getItem('token');
                  const res = await fetch('/api/admin/blogs/ai-generate', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to generate');
                  toast.success('Blog created');
                  setShowAIModal(false);
                  loadBlogs();
                } catch (e) {
                  console.error(e);
                  toast.error(e instanceof Error ? e.message : 'Failed to generate');
                } finally {
                  setAiLoading(false);
                }
              }}
            />
          </div>
        </div>
      )}

      <BlogForm
        blog={editingBlog as any}
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => loadBlogs()}
      />
    </div>
  );
}

function AIGenerateForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (payload: { title: string; description: string; category: string }) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  return (
    <div className="p-5">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Enter blog title" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={3} placeholder="One or two sentences" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category (optional)</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
            <option value="">None</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Office & Travel">Office & Travel</option>
            <option value="Accessories">Accessories</option>
            <option value="Gifting">Gifting</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50">Cancel</button>
        <button onClick={() => onSubmit({ title, description, category })} className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700">Generate</button>
      </div>
    </div>
  );
}


