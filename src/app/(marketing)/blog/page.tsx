'use client';

import Link from 'next/link';

export default function BlogIndexPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Blog</h1>
      <p className="text-gray-600 mb-8">Insights, announcements, and tips from ShopEase.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg border bg-white">
          <h3 className="text-xl font-semibold mb-2">
            <Link href="/blog/hello-world">Hello World</Link>
          </h3>
          <p className="text-gray-600">Getting started with our new blog.</p>
        </div>
      </div>
    </div>
  );
}


