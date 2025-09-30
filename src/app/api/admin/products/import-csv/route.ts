import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const splitLine = (line: string) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (char === ',' && !inQuotes) {
        result.push(current); current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };
  const headers = splitLine(lines[0]).map(h => h.trim());
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.PRODUCT_CREATE)(request);
    await connectDB();

    const url = new URL(request.url);
    const dryRun = url.searchParams.get('dryRun') === 'true';

    const contentType = request.headers.get('content-type') || '';
    const text = contentType.includes('text/csv') ? await request.text() : (await request.text());

    const { headers, rows } = parseCSV(text);
    if (headers.length === 0) {
      return NextResponse.json({ error: 'Empty CSV or invalid format' }, { status: 400 });
    }

    const required = ['name','description','price','image'];
    const missingRequired = required.filter(h => !headers.some(x => x.toLowerCase() === h));
    const warnings: string[] = [];
    if (missingRequired.length) warnings.push(`Missing required columns: ${missingRequired.join(', ')}`);

    const idx = (name: string) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
    const iName = idx('name');
    const iDescription = idx('description');
    const iPrice = idx('price');
    const iOriginalPrice = idx('originalPrice');
    const iImage = idx('image');
    const iImages = idx('images');
    const iCategory = idx('category');
    const iBrand = idx('brand');
    const iStock = idx('stockCount');
    const iTags = idx('tags');
    const iIsActive = idx('isActive');
    const iStatus = idx('status');
    const iPublishAt = idx('publishAt');

    let created = 0, updated = 0, errors: any[] = [];

    for (let rIndex = 0; rIndex < rows.length; rIndex++) {
      const row = rows[rIndex];
      try {
        const name = row[iName];
        const brand = iBrand >= 0 ? row[iBrand] : undefined;
        if (!name) {
          warnings.push(`Row ${rIndex + 2}: missing name`);
          continue;
        }
        const priceStr = iPrice >= 0 ? row[iPrice] : '';
        const price = parseFloat(priceStr || '0');
        if (Number.isNaN(price)) warnings.push(`Row ${rIndex + 2}: invalid price '${priceStr}'`);
        const payload: any = {
          name,
          description: iDescription >= 0 ? (row[iDescription] || '') : '',
          price,
          originalPrice: iOriginalPrice >= 0 && row[iOriginalPrice] ? parseFloat(row[iOriginalPrice]) : undefined,
          image: iImage >= 0 ? (row[iImage] || '') : '',
          images: iImages >= 0 && row[iImages] ? row[iImages].split('|').filter(Boolean) : [],
          category: iCategory >= 0 ? (row[iCategory] || undefined) : undefined,
          brand: brand || undefined,
          stockCount: iStock >= 0 && row[iStock] ? parseInt(row[iStock]) : 0,
          inStock: iStock >= 0 && row[iStock] ? parseInt(row[iStock]) > 0 : false,
          tags: iTags >= 0 && row[iTags] ? row[iTags].split('|').filter(Boolean) : [],
          isActive: iIsActive >= 0 && row[iIsActive] ? row[iIsActive].toLowerCase() === 'true' : true,
          status: iStatus >= 0 ? (row[iStatus] || 'draft') : 'draft',
          publishAt: iPublishAt >= 0 && row[iPublishAt] ? new Date(row[iPublishAt]) : null,
        };
        if (dryRun) continue;
        const existing = await Product.findOne({ name, ...(brand ? { brand } : {}) });
        if (existing) {
          Object.assign(existing, payload);
          await existing.save();
          updated++;
        } else {
          const p = new Product(payload);
          await p.save();
          created++;
        }
      } catch (e: any) {
        errors.push(`Row ${rIndex + 2}: ${e?.message || String(e)}`);
      }
    }

    if (dryRun) {
      return NextResponse.json({ message: 'Validation complete', warnings, errors });
    }

    return NextResponse.json({ message: 'Import complete', created, updated, errors, warnings });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('Import CSV error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

