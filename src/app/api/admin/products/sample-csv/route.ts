import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);

    const headers = [
      'name','description','price','originalPrice','image','images','category','brand','stockCount','tags','isActive','status','publishAt','productType','sourceUrl'
    ];

    const example = [
      'Sample Product',
      'Great product for demo',
      '49.99',
      '59.99',
      'https://example.com/image.jpg',
      'https://example.com/image2.jpg|https://example.com/image3.jpg',
      'Accessories',
      'Generic',
      '25',
      'leather|gift',
      'true',
      'published',
      new Date().toISOString(),
      'bag',
      'https://example.com/source'
    ];

    const csv = headers.join(',') + '\n' + example.map((v) => {
      const str = String(v ?? '');
      return (str.includes('"') || str.includes(',') || str.includes('\n'))
        ? '"' + str.replace(/"/g, '""') + '"'
        : str;
    }).join(',');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="products-sample.csv"'
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
