import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CONTENT_MANAGE)(request);
    await connectDB();

    const now = new Date();

    const updates: Record<string, string> = {
      'ultimate-gift-guide-2025': 'Discover curated gifts across price ranges with practical picks for travelers, minimalists, and remote workers. This guide highlights everyday upgrades, statement pieces, and how to choose the perfect present by lifestyle and budget.',
      'mens-travel-essentials-weekend-getaways': 'Pack smarter for 2–3 day trips with a weekender + backpack combo, pouch organization, and a mix‑and‑match outfit formula. Includes tips for tech, toiletries, and color choices to keep luggage lean.',
      'womens-capsule-accessories-12-pieces': 'Build a timeless capsule of 12 accessories—from tote and crossbody to jewelry and sunglasses—that elevate outfits for work, weekends, and travel with minimal effort.',
      'office-travel-organization-hacks': 'Desk and travel organization setups that save minutes every day: cable management, pouch systems, and a repeatable routine for stress‑free mornings and cleaner bags.',
      'choose-perfect-gift-by-occasion': 'A simple five‑step framework to choose thoughtful gifts for birthdays, anniversaries, and more—match tone, lifestyle fit, category shortlist, timeless colors, and presentation.',
    };

    let updated = 0;
    for (const [slug, desc] of Object.entries(updates)) {
      const res = await Blog.updateOne(
        { slug },
        {
          $set: {
            description: desc,
            status: 'published',
            publishAt: now,
            isActive: true,
            isDeleted: false,
          }
        }
      );
      if (res.modifiedCount || res.upsertedCount) updated += 1;
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('Enrich/publish blogs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


