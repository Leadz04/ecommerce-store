import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';

async function getPost(slug: string) {
  await connectDB();
  const now = new Date();
  const post = await Blog.findOne({
    slug: slug.toLowerCase(),
    isActive: true,
    status: 'published',
    $or: [
      { publishAt: null },
      { publishAt: { $lte: now } }
    ]
  }).lean();
  return post ? JSON.parse(JSON.stringify(post)) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description || undefined,
    openGraph: {
      title: post.title,
      description: post.description || undefined,
      type: 'article',
      url: `/blog/${post.slug}`,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
    twitter: {
      card: post.coverImage ? 'summary_large_image' : 'summary',
      title: post.title,
      description: post.description || undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
    }
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return notFound();

  // Simple date string
  const published = post.publishAt ? new Date(post.publishAt).toLocaleDateString() : '';
  const plain = (post.contentHtml || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = plain ? plain.split(' ').length : 0;
  const readMins = Math.max(1, Math.round(words / 220));

  // Fetch a few related articles (best-effort)
  await connectDB();
  const relatedRaw = await Blog.find({
    _id: { $ne: post._id },
    isActive: true,
    isDeleted: false,
    status: 'published',
  }).sort({ publishAt: -1, createdAt: -1 }).limit(3).select('title slug description coverImage publishAt').lean();
  const related = JSON.parse(JSON.stringify(relatedRaw));

  // Add ids to H2 headings for a simple in-page Table of Contents
  const withAnchors = (post.contentHtml || '').replace(/<h2>([^<]+)<\/h2>/g, (_m: string, g1: string) => {
    const id = String(g1).toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    return `<h2 id="${id}">${g1}</h2>`;
  });
  const toc = Array.from(new Set([...(withAnchors.match(/<h2 id=\"(.*?)\"/g) || [])]))
    .map((m) => m.replace(/<h2 id=\"|\"/g, ''));

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate">
        {post.coverImage ? (
          <div className="h-[360px] md:h-[440px] w-full overflow-hidden">
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-[220px] md:h-[260px] w-full bg-gradient-to-r from-purple-100 to-purple-200" />
        )}
        <div className="max-w-5xl mx-auto px-4 -mt-24 md:-mt-28">
          <div className="bg-white/95 backdrop-blur shadow-xl border rounded-2xl p-6 md:p-8">
            <div className="mb-3 text-xs text-purple-700">
              <Link href="/blog" className="hover:underline">Blog</Link>
              <span className="mx-2">/</span>
              <span className="text-purple-900">Article</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-purple-900 tracking-tight">{post.title}</h1>
            {post.description && (
              <p className="mt-3 text-gray-700 md:text-lg leading-relaxed">{post.description}</p>
            )}
            <div className="mt-3 text-sm text-gray-500">{published && <>Published {published}</>}</div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar meta */}
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <div className="sticky top-20 space-y-3">
              <div className="border rounded-xl p-5 bg-white shadow-sm">
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Published</div>
                <div className="text-sm text-gray-800">{published || '—'}</div>
                <div className="text-xs uppercase tracking-wide text-gray-500 mt-4 mb-1">Reading time</div>
                <div className="text-sm text-gray-800">{readMins} min</div>
              </div>
              {!!toc.length && (
                <div className="border rounded-xl p-5 bg-white shadow-sm">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">On this page</div>
                  <ul className="space-y-2 text-sm">
                    {toc.map((id) => (
                      <li key={id}>
                        <a href={`#${id}`} className="text-purple-700 hover:text-purple-900">
                          {id.replace(/-/g, ' ')}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="border rounded-xl p-5 bg-white shadow-sm">
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Share</div>
                <div className="flex gap-3 text-sm">
                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/blog/${post.slug}`)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Twitter</a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/blog/${post.slug}`)}`} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Facebook</a>
                </div>
                <div className="mt-3">
                  <Link href="/blog" className="text-purple-700 hover:text-purple-900">← Back to Blog</Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Main article */}
          <article className="lg:col-span-9 order-1 lg:order-2">
            <div className="border rounded-2xl bg-purple-50 p-6 md:p-10 shadow-lg">
              <div className="prose prose-lg prose-purple max-w-none leading-8 text-gray-900">
                <div dangerouslySetInnerHTML={{ __html: withAnchors }} />
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Related */}
      {related?.length ? (
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <h2 className="text-xl font-semibold text-purple-900 mb-4">You might also like</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map((r: any) => (
              <Link key={r.slug} href={`/blog/${r.slug}`} className="block border rounded-lg p-4 bg-white hover:shadow-sm hover:border-purple-300 transition">
                <div className="text-base font-semibold text-purple-900 line-clamp-2">{r.title}</div>
                {r.description && <div className="text-sm text-gray-600 line-clamp-3 mt-1">{r.description}</div>}
              </Link>
            ))}
      </div>
        </section>
      ) : null}
    </div>
  );
}


