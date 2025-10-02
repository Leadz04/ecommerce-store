import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

const todayIso = new Date().toISOString();

const posts = [
  {
    title: 'Ultimate Gift Guide 2025: Thoughtful Picks for Every Budget',
    slug: 'ultimate-gift-guide-2025',
    description: 'Discover 25+ gift ideas for every budget—curated from Men, Women, Accessories, and Gifting collections.',
    tags: ['gifting','gift ideas','accessories','men','women','budget'],
    status: 'draft' as const,
    publishAt: todayIso,
    coverImage: '',
    contentHtml: `<h1>Ultimate Gift Guide 2025: Thoughtful Picks for Every Budget</h1>
<p>Looking for the perfect present? This guide curates our favorite gifts across <a href="/categories">categories</a>—from practical everyday accessories to premium showstoppers.</p>`
  },
  {
    title: 'Men’s Travel Essentials: Pack Smarter for Weekend Getaways',
    slug: 'mens-travel-essentials-weekend-getaways',
    description: 'A smart packing list for men—bags, tech, and organization to travel light without sacrificing style.',
    tags: ['men','travel','packing list','office & travel','backpacks'],
    status: 'draft' as const,
    publishAt: todayIso,
    coverImage: '',
    contentHtml: `<h1>Men’s Travel Essentials: Pack Smarter for Weekend Getaways</h1>`
  },
  {
    title: 'Women’s Capsule Accessories: 12 Pieces to Elevate Every Outfit',
    slug: 'womens-capsule-accessories-12-pieces',
    description: 'Build a capsule accessories wardrobe—12 essentials for effortless outfits all year.',
    tags: ['women','capsule','accessories','style','wardrobe'],
    status: 'draft' as const,
    publishAt: todayIso,
    coverImage: '',
    contentHtml: `<h1>Women’s Capsule Accessories: 12 Pieces to Elevate Every Outfit</h1>`
  },
  {
    title: 'Office & Travel Organization Hacks: Setups that Save Time',
    slug: 'office-travel-organization-hacks',
    description: 'Desk and travel setups that keep cables tidy, bags clean, and mornings stress-free.',
    tags: ['office','travel','organization','productivity','packing'],
    status: 'draft' as const,
    publishAt: todayIso,
    coverImage: '',
    contentHtml: `<h1>Office &amp; Travel Organization Hacks: Setups that Save Time</h1>`
  },
  {
    title: 'How to Choose the Perfect Gift by Occasion',
    slug: 'choose-perfect-gift-by-occasion',
    description: 'Use this 5-step framework to choose gifts for birthdays, anniversaries, and beyond.',
    tags: ['gifting','occasions','gift guide','birthdays','anniversaries'],
    status: 'draft' as const,
    publishAt: todayIso,
    coverImage: '',
    contentHtml: `<h1>How to Choose the Perfect Gift by Occasion</h1>`
  }
];

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CONTENT_MANAGE)(request);
    await connectDB();

    let inserted = 0;
    for (const p of posts) {
      const exists = await Blog.findOne({ slug: p.slug });
      if (exists) continue;
      await Blog.create({
        ...p,
        isActive: true,
        isDeleted: false,
        deletedAt: null,
        versions: [],
      });
      inserted += 1;
    }
    return NextResponse.json({ success: true, inserted }, { status: 201 });
  } catch (error) {
    console.error('Seed blogs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


