import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';
import Blog from '@/models/Blog';

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function productCard(p: any) {
  const url = `/products/${p._id}`;
  const safeName = (p.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeDesc = (p.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const img = p.image || (p.images && p.images[0]) || '/vercel.svg';
  return `
  <div class="not-prose border rounded-lg p-3 flex gap-3 items-start bg-white">
    <img src="${img}" alt="${safeName}" style="width:84px;height:84px;object-fit:cover;border-radius:8px;border:1px solid #eee" />
    <div>
      <a href="${url}"><strong>${safeName}</strong></a>
      <div style="font-size:13px;color:#555;margin-top:2px">${safeDesc.slice(0, 120)}...</div>
      <div style="margin-top:6px;font-weight:600;color:#111">$${Number(p.price || 0).toFixed(2)}</div>
    </div>
  </div>`;
}

function buildBlogHtml(title: string, intro: string, products: any[], sections: Array<{ heading: string; items: any[] }>) {
  const introHtml = `<p>${intro}</p>`;
  const sectionsHtml = sections
    .map((s) => `
      <h2>${s.heading}</h2>
      <div class="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">${s.items
        .map(productCard)
        .join('')}</div>
    `)
    .join('\n');
  return `<h1>${title}</h1>${introHtml}${sectionsHtml}`;
}

async function generateForCategory(category: 'Men' | 'Women' | 'Office & Travel' | 'Accessories' | 'Gifting', baseCount = 5) {
  const base = await Product.find({ category, isActive: true }).sort({ rating: -1, createdAt: -1 }).limit(baseCount * 6).lean();
  const picks = (n: number, offset = 0) => base.slice(offset, offset + n);

  const blogs = [
    {
      title: `${category} Best Sellers: Editor's Picks`,
      intro: `Discover our most-loved ${category.toLowerCase()} items—top-rated pieces that customers buy again and again.`,
      sections: [
        { heading: 'Trending Now', items: picks(6, 0) },
        { heading: 'Customer Favorites', items: picks(6, 6) },
      ],
    },
    {
      title: `${category} Capsule Essentials: Build a Wardrobe that Works`,
      intro: `Create a capsule wardrobe with timeless staples from our ${category.toLowerCase()} collection—versatile, durable, and easy to style.`,
      sections: [
        { heading: 'Everyday Staples', items: picks(6, 12) },
        { heading: 'Seasonal Layers', items: picks(6, 18) },
      ],
    },
    {
      title: `Gifts for ${category}: Thoughtful Picks for Every Budget`,
      intro: `From small gestures to statement pieces, these ${category.toLowerCase()} gifts make every occasion easy.`,
      sections: [
        { heading: 'Under $50', items: picks(6, 24) },
        { heading: 'Premium Picks', items: picks(6, 30) },
      ],
    },
    {
      title: `${category} Outfit Ideas: Style Inspiration from Our Shop`,
      intro: `Combine our most-loved pieces to build outfits for work, weekends, and travel.`,
      sections: [
        { heading: 'Work Ready', items: picks(6, 36) },
        { heading: 'Weekend Casual', items: picks(6, 42) },
      ],
    },
    {
      title: `${category} New Arrivals: Fresh Styles to Try`,
      intro: `See what’s new in ${category.toLowerCase()}—fresh drops you’ll reach for all season.`,
      sections: [
        { heading: 'Just In', items: picks(6, 48) },
      ],
    },
  ];

  return blogs.map((b) => ({
    ...b,
    slug: toSlug(`${b.title}`),
    description: b.intro,
    contentHtml: buildBlogHtml(b.title, b.intro, base, b.sections),
  }));
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CONTENT_MANAGE)(request);
    await connectDB();

    const body = await request.json().catch(() => ({}));
    const { status = 'published' } = body || {};

    const categories: Array<'Men' | 'Women' | 'Office & Travel' | 'Accessories' | 'Gifting'> = ['Men', 'Women', 'Office & Travel', 'Accessories', 'Gifting'];
    const allBlogs: any[] = [];
    for (const cat of categories) {
      const blogs = await generateForCategory(cat);
      allBlogs.push(...blogs);
    }
    const toCreate = allBlogs;

    let created = 0;
    for (const b of toCreate) {
      const exists = await Blog.findOne({ slug: b.slug });
      if (exists) continue;
      const tagsFromCategory = ((): string[] => {
        const map: Record<string, string[]> = {
          'Men': ['men'],
          'Women': ['women'],
          'Office & Travel': ['office', 'travel'],
          'Accessories': ['accessories'],
          'Gifting': ['gifting'],
        };
        for (const k of Object.keys(map)) {
          if (b.title.includes(k)) return map[k];
        }
        return [];
      })();

      await Blog.create({
        title: b.title,
        slug: b.slug,
        description: b.description,
        contentHtml: b.contentHtml,
        coverImage: undefined,
        tags: [...tagsFromCategory, 'style', 'guide'],
        status,
        publishAt: new Date(),
        isActive: true,
        isDeleted: false,
      });
      created += 1;
    }

    return NextResponse.json({ success: true, created });
  } catch (error) {
    console.error('Generate blogs from products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


