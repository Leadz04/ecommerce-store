import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);
    await connectDB();

    const products = await Product.find().lean();

    const headers = [
      'name','description','price','originalPrice','image','images','category','brand','stockCount','tags','isActive','status','publishAt','productType','sourceUrl'
    ];

    const escape = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const rows = products.map((p: any) => [
      p.name,
      p.description,
      p.price,
      p.originalPrice ?? '',
      p.image,
      (p.images || []).join('|'),
      p.category,
      p.brand ?? '',
      p.stockCount ?? 0,
      (p.tags || []).join('|'),
      p.isActive ? 'true' : 'false',
      p.status || 'draft',
      p.publishAt ? new Date(p.publishAt).toISOString() : '',
      p.productType ?? '',
      p.sourceUrl ?? ''
    ].map(escape).join(','));

    const csv = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="products-export.csv"`
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('Export CSV error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
