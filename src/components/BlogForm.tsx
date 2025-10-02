'use client';

import { useEffect, useState } from 'react';
import { X, FileText, Tag, Image as ImageIcon, Calendar as CalendarIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  contentHtml: string;
  coverImage?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishAt?: string | null;
  isActive: boolean;
}

interface BlogFormProps {
  blog?: Blog | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BlogForm({ blog, isOpen, onClose, onSuccess }: BlogFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    contentHtml: '',
    coverImage: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published' | 'archived',
    publishAt: '' as string,
    isActive: true,
  });
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title || '',
        slug: blog.slug || '',
        description: blog.description || '',
        contentHtml: blog.contentHtml || '',
        coverImage: blog.coverImage || '',
        tags: blog.tags || [],
        status: blog.status || 'draft',
        publishAt: blog.publishAt ? new Date(blog.publishAt).toISOString().slice(0,16) : '',
        isActive: blog.isActive ?? true,
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        description: '',
        contentHtml: '',
        coverImage: '',
        tags: [],
        status: 'draft',
        publishAt: '',
        isActive: true,
      });
    }
  }, [blog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = blog ? `/api/admin/blogs/${blog._id}` : '/api/admin/blogs';
      const method = blog ? 'PUT' : 'POST';
      const payload: any = {
        ...formData,
        slug: formData.slug.trim().toLowerCase(),
        publishAt: formData.publishAt ? new Date(formData.publishAt).toISOString() : null,
      };
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save blog');
      toast.success(blog ? 'Blog updated successfully' : 'Blog created successfully');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Blog save error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save blog');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      // Prefer Cloudinary if configured; else fallback to Imgur
      const provider = process.env.NEXT_PUBLIC_UPLOAD_PROVIDER || 'cloudinary';
      const endpoint = provider === 'imgur' ? '/api/uploads/imgur' : '/api/uploads/cloudinary';
      const res = await fetch(endpoint, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      if (data.url) {
        handleInputChange('coverImage', data.url);
        toast.success('Image uploaded');
      }
    } catch (e) {
      console.error('upload error', e);
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-purple-900">
              {blog ? 'Edit Blog' : 'Create New Blog'}
            </h2>
            <button onClick={onClose} className="text-purple-400 hover:text-purple-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-purple-300 text-gray-900 mb-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value.replace(/\s+/g, '-').toLowerCase())}
                  className="w-full px-3 py-2 border border-purple-300 text-gray-900 mb-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="seo-friendly-slug"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 text-gray-900 mb-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Short meta description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">Content (WYSIWYG)</label>
              <div className="border border-purple-300 rounded-lg bg-white shadow-inner">
                <div className="flex flex-wrap gap-2 p-2 border-b border-purple-200 bg-purple-50/60">
                  {[
                    { cmd: 'bold', label: 'B' },
                    { cmd: 'italic', label: 'I' },
                    { cmd: 'underline', label: 'U' },
                    { cmd: 'insertUnorderedList', label: '• List' },
                    { cmd: 'insertOrderedList', label: '1. List' },
                    { cmd: 'formatBlock', arg: 'H2', label: 'H2' },
                    { cmd: 'formatBlock', arg: 'H3', label: 'H3' },
                    { cmd: 'formatBlock', arg: 'P', label: 'P' },
                    { cmd: 'createLink', label: 'Link' },
                  ].map((btn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (btn.cmd === 'createLink') {
                          const url = prompt('Enter URL');
                          if (url) document.execCommand('createLink', false, url);
                        } else if (btn.cmd === 'formatBlock') {
                          document.execCommand('formatBlock', false, btn.arg === 'P' ? 'P' : btn.arg);
                        } else {
                          document.execCommand(btn.cmd, false);
                        }
                      }}
                      className="px-2 py-1 text-sm border border-purple-300 rounded bg-white text-purple-800 hover:bg-purple-100"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="min-h-[260px] p-4 prose max-w-none text-gray-900 focus:outline-none"
                  onInput={(e) => handleInputChange('contentHtml', (e.target as HTMLDivElement).innerHTML)}
                  dangerouslySetInnerHTML={{ __html: formData.contentHtml }}
                />
              </div>
              <p className="text-xs text-purple-700 mt-1">Lightweight editor using document.execCommand for bold/italic/links/headings/lists.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  <ImageIcon className="h-4 w-4 inline mr-2" /> Cover Image URL
                </label>
                <input
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => handleInputChange('coverImage', e.target.value)}
                  className="w-full px-3 py-2 border border-purple-300 text-gray-900 mb-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="https://..."
                />
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files?.[0])}
                    className="text-sm"
                  />
                  <span className="text-xs text-gray-500">Provider: {process.env.NEXT_PUBLIC_UPLOAD_PROVIDER || 'cloudinary'}</span>
                  {uploading && <span className="text-xs text-purple-700">Uploading...</span>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as any)}
                  className="w-full px-3 py-2 border border-purple-300 text-purple-900 mb-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2"><CalendarIcon className="h-4 w-4 inline mr-2" /> Publish At (optional)</label>
                <input
                  type="datetime-local"
                  value={formData.publishAt}
                  onChange={(e) => handleInputChange('publishAt', e.target.value)}
                  className="w-full px-3 py-2 border border-purple-300 text-gray-900 mb-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-purple-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-purple-900">Active</label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2"><Tag className="h-4 w-4 inline mr-2" /> Tags</label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tag and press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center px-3 py-1 text-gray-700 mb-2 rounded-full text-sm bg-blue-100 text-blue-800">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-2 text-blue-600 hover:text-blue-800">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button type="button" onClick={onClose} className="px-6 py-2 border border-purple-300 text-purple-800 rounded-lg hover:bg-purple-50 transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Saving...' : (blog ? 'Update Blog' : 'Create Blog')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


