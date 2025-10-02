'use client';

import Link from 'next/link';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';

async function getBlogs() {
  await connectDB();
  const now = new Date();
  const blogs = await Blog.find({
    isActive: true,
    status: 'published',
    $or: [
      { publishAt: null },
      { publishAt: { $lte: now } }
    ]
  })
    .sort({ publishAt: -1, createdAt: -1 })
    .select('title slug description coverImage publishAt')
    .lean();
  return JSON.parse(JSON.stringify(blogs));
}

export default async function BlogIndexPage() {
  const blogs = await getBlogs();
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-900">Blog</h1>
        <p className="text-gray-600">Insights, announcements, and tips from ShopEase.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((b: any) => {
          const date = b.publishAt ? new Date(b.publishAt).toLocaleDateString() : '';
          return (
            <article key={b.slug} className="rounded-lg border bg-white overflow-hidden shadow-sm hover:shadow transition">
              <Link href={`/blog/${b.slug}`}>
                <div className="aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                  {b.coverImage ? (
                    <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-50 to-purple-100" />
                  )}
                </div>
              </Link>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  <Link href={`/blog/${b.slug}`}>{b.title}</Link>
                </h3>
                <div className="text-xs text-gray-500 mt-1">{date}</div>
                {b.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">{b.description}</p>
                )}
                <div className="mt-3">
                  <Link href={`/blog/${b.slug}`} className="text-sm text-purple-700 hover:text-purple-900">Read more →</Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {blogs.length === 0 && (
        <div className="text-gray-500">No posts yet. Check back soon.</div>
      )}
    </div>
  );
}


