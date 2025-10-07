import { NextRequest, NextResponse } from 'next/server';
import { getScrapedModels } from '@/models/Scraped';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

    const { ScrapedProduct } = await getScrapedModels();

    let items: any[] = [];
    if (idsParam) {
      const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
      items = await ScrapedProduct.find({ _id: { $in: ids } }).sort({ createdAt: -1 }).lean();
    } else {
      items = await ScrapedProduct.find({}).limit(limit).sort({ createdAt: -1 }).lean();
    }

    if (!items.length) {
      return NextResponse.json({ error: 'No items to export' }, { status: 404 });
    }

    const csvRows = items.map(p => ({
      Title: p.title || '',
      Description: p.description || '',
      Category: 'Clothing',
      'Who made it?': 'I made it',
      'What is it?': 'A finished product',
      'When was it made?': '2024',
      'Renewal options': 'Auto-renew',
      'Product type': 'Physical',
      Tags: 'sourced',
      Materials: 'Leather',
      'Production partners': '',
      Section: 'Clothing',
      Price: (p.price ?? 0).toString(),
      Quantity: '1',
      SKU: '',
      'Variation 1': '',
      'V1 Option': '',
      'Variation 2': '',
      'V2 Option': '',
      'Var Price': '',
      'Var Quantity': '',
      'Var SKU': '',
      'Var Visibility': '',
      'Var Photo': '',
      'Shipping profile': 'Standard',
      Weight: '0.5',
      Length: '10',
      Width: '8',
      Height: '2',
      'Return policy': '14 days',
      'Photo 1': p.images?.[0] || '',
      'Photo 2': p.images?.[1] || '',
      'Photo 3': p.images?.[2] || '',
      'Photo 4': p.images?.[3] || '',
      'Photo 5': p.images?.[4] || '',
      'Photo 6': p.images?.[5] || '',
      'Photo 7': p.images?.[6] || '',
      'Photo 8': p.images?.[7] || '',
      'Photo 9': p.images?.[8] || '',
      'Photo 10': p.images?.[9] || '',
      'Video 1': '',
      'Digital file 1': '',
      'Digital file 2': '',
      'Digital file 3': '',
      'Digital file 4': '',
      'Digital file 5': '',
    }));

    const headers = Object.keys(csvRows[0]);
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => headers.map(h => {
        const v = (row as any)[h] ?? '';
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const filename = `etsy-sourced-${new Date().toISOString().slice(0,10)}`;
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`
      }
    });
  } catch (error) {
    console.error('Sourcing export error:', error);
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}


