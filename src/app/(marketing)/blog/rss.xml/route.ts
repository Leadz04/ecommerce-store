import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';

export async function GET() {
  await connectDB();
  const now = new Date();
  const posts = await Blog.find({
    isDeleted: false,
    isActive: true,
    status: 'published',
    $or: [
      { publishAt: null },
      { publishAt: { $lte: now } }
    ]
  })
    .sort({ publishAt: -1, createdAt: -1 })
    .limit(50)
    .lean();

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  const items = posts.map((p: any) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${site}/blog/${p.slug}</link>
      <guid isPermaLink="true">${site}/blog/${p.slug}</guid>
      ${p.description ? `<description><![CDATA[${p.description}]]></description>` : ''}
      <pubDate>${new Date(p.publishAt || p.createdAt).toUTCString()}</pubDate>
    </item>
  `).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Blog</title>
      <link>${site}/blog</link>
      <description>Latest posts</description>
      ${items}
    </channel>
  </rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=900, stale-while-revalidate=86400'
    }
  });
}


