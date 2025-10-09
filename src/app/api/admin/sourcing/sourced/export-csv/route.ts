import { NextRequest, NextResponse } from 'next/server';
import { getSourcedProductModel } from '@/models/SourcedProduct';

export const dynamic = 'force-dynamic';

function escapeCsv(val: any) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    const limit = Math.min(parseInt(searchParams.get('limit') || '500', 10), 1000);
    const pageParam = searchParams.get('page');
    const perPageParam = searchParams.get('perPage') || searchParams.get('limit');
    const page = pageParam ? Math.max(1, parseInt(pageParam)) : undefined;
    const perPage = perPageParam ? Math.max(1, Math.min(1000, parseInt(perPageParam))) : undefined;

    const Sourced = await getSourcedProductModel();

    let items: any[] = [];
    if (idsParam) {
      const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
      items = await Sourced.find({ _id: { $in: ids } }).sort({ createdAt: -1 }).lean();
    } else {
      items = await Sourced.find({}).limit(limit).sort({ createdAt: -1 }).lean();
    }

    if (!items.length) {
      return NextResponse.json({ error: 'No items to export' }, { status: 404 });
    }

    const headers = ['Title', 'Description', 'Category', 'Who made it?', 'What is it?', 'When was it made?', 'Renewal options', 'Product type', 'Tags', 'Materials', 'Production partners', 'Section', 'Price', 'Quantity', 'SKU', 'Variation 1', 'V1 Option', 'Variation 2', 'V2 Option', 'Var Price', 'Var Quantity', 'Var SKU', 'Var Visibility', 'Var Photo', 'Shipping profile', 'Weight', 'Length', 'Width', 'Height', 'Return policy', 'Photo 1', 'Photo 2', 'Photo 3', 'Photo 4', 'Photo 5', 'Photo 6', 'Photo 7', 'Photo 8', 'Photo 9', 'Photo 10', 'Video 1', 'Digital file 1', 'Digital file 2', 'Digital file 3', 'Digital file 4', 'Digital file 5'];

    function mapToTemplate(p: any) {
      const imgs = Array.isArray(p.images) ? p.images : [];
      return {
        'Title': p.title || '',
        'Description': p.description || '',
        'Category': 'Clothing',
        'Who made it?': 'I did',
        'What is it?': 'A finished product',
        'When was it made?': 'Made To Order',
        'Renewal options': 'Auto-renew',
        'Product type': 'Physical',
        'Tags': 'sourced',
        'Materials': 'Leather',
        'Production partners': '',
        'Section': 'Real Leather Jacket',
        'Price': (p.price ?? 0).toString(),
        'Quantity': '1',
        'SKU': '',
        'Variation 1': '',
        'V1 Option': '',
        'Variation 2': '',
        'V2 Option': '',
        'Var Price': '',
        'Var Quantity': '',
        'Var SKU': '',
        'Var Visibility': '',
        'Var Photo': '',
        'Shipping profile': 'Shipping',
        'Weight': '0.5',
        'Length': '10',
        'Width': '8',
        'Height': '2',
        'Return policy': '14 days',
        'Photo 1': imgs[0] || '',
        'Photo 2': imgs[1] || '',
        'Photo 3': imgs[2] || '',
        'Photo 4': imgs[3] || '',
        'Photo 5': imgs[4] || '',
        'Photo 6': imgs[5] || '',
        'Photo 7': imgs[6] || '',
        'Photo 8': imgs[7] || '',
        'Photo 9': imgs[8] || '',
        'Photo 10': imgs[9] || '',
        'Video 1': '',
        'Digital file 1': '',
        'Digital file 2': '',
        'Digital file 3': '',
        'Digital file 4': '',
        'Digital file 5': '',
      } as Record<string, string>;
    }

    const csvRows = items.map(mapToTemplate);
    const csv = [
      headers.join(','),
      ...csvRows.map(row => headers.map(h => escapeCsv((row as any)[h] ?? '')).join(','))
    ].join('\n');
    let filename: string;
    if (page && perPage) {
      const startIndex = (page - 1) * perPage + 1;
      const endIndex = startIndex + items.length - 1;
      filename = `sourced-products-page-${page}-items-${startIndex}-${endIndex}-${new Date().toISOString().slice(0, 10)}`;
    } else {
      const countLabel = String(items.length);
      filename = `sourced-products-${idsParam ? 'selected' : 'limit'}-${countLabel}-${new Date().toISOString().slice(0, 10)}`;
    }
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export sourced CSV' }, { status: 500 });
  }
}


