import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';

function stripHtml(html?: string) {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function inferSpecifications(name: string, descriptionPlain: string) {
  const text = `${name} ${descriptionPlain}`.toLowerCase();
  const specs: Record<string, string> = {};
  if (/full[-\s]?grain/.test(text)) specs.Material = 'Full-grain leather';
  else if (/genuine\s+leather|real\s+leather|cowhide/.test(text)) specs.Material = 'Genuine Leather';
  else if (/leather/.test(text)) specs.Material = 'Leather';
  const colorMatch = text.match(/\b(black|brown|dark brown|tan|blue|red|white)\b/);
  if (colorMatch) specs.Color = colorMatch[1].replace(/\b\w/g, (c) => c.toUpperCase());
  if (/\b15(\.|\s)?(inch|in)\b/.test(text)) specs['Fits Laptop'] = '15-inch';
  if (/\b13(\.|\s)?(inch|in)\b/.test(text)) specs['Fits Laptop'] = (specs['Fits Laptop'] ? specs['Fits Laptop'] + ', 13-inch' : '13-inch');
  const features: string[] = [];
  if (/adjustable\s+strap/.test(text)) features.push('Adjustable strap');
  if (/zipper|zippers/.test(text)) features.push('Zipper closure');
  if (/pockets?/.test(text)) features.push('Multiple pockets');
  if (/handmade|hand[-\s]?stitched/.test(text)) features.push('Handmade');
  if (features.length) specs.Features = features.join(', ');
  if (/durable|long[-\s]?lasting|premium/.test(text)) specs.Quality = 'Premium / Durable';
  return specs;
}

export async function POST(request: NextRequest) {
  try {
    await requireAnyPermission([PERMISSIONS.PRODUCT_UPDATE, PERMISSIONS.PRODUCT_MANAGE_INVENTORY])(request);
    await connectDB();

    const { limit = 200 } = await request.json().catch(() => ({}));
    const products = await Product.find({}).limit(Math.min(limit, 1000));

    let updated = 0;
    for (const p of products) {
      const html = (p as any).descriptionHtml as string | undefined;
      const plain = stripHtml(html) || p.description || '';
      const specs = inferSpecifications(p.name, plain);
      if (Object.keys(specs).length) {
        const existingObj = p.specifications instanceof Map
          ? Object.fromEntries((p.specifications as any).entries())
          : (p.specifications as any) || {};
        const merged = { ...existingObj, ...specs };
        p.set('specifications', merged);
        await p.save();
        updated++;
      }
    }

    return NextResponse.json({ updated });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('Backfill specs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
