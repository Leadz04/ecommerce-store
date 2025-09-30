import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';
import { ProductVersion, AuditLog } from '@/models';

function stripHtml(html?: string) {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeCategory(input?: string): 'Men' | 'Women' | 'Office & Travel' | 'Accessories' | 'Gifting' {
  const s = (input || '').toString().toLowerCase().trim();
  if (['men', 'mens', "men's", 'male', 'man'].includes(s)) return 'Men';
  if (['women', 'womens', "women's", 'ladies', 'female', 'woman'].includes(s)) return 'Women';
  if (['office', 'travel', 'office & travel', 'office and travel', 'luggage', 'bags', 'bag', 'briefcase'].includes(s)) return 'Office & Travel';
  if (['gifting', 'gift', 'gifts', 'present'].includes(s)) return 'Gifting';
  if (['accessory', 'accessories'].includes(s)) return 'Accessories';
  return 'Accessories';
}

function inferSpecifications(name: string, plain: string) {
  const text = `${name} ${plain}`.toLowerCase();
  const specs: Record<string, string> = {};

  // Material
  if (/full[-\s]?grain/.test(text)) specs.Material = 'Full-grain leather';
  else if (/genuine\s+leather|real\s+leather|cowhide/.test(text)) specs.Material = 'Genuine Leather';
  else if (/leather/.test(text)) specs.Material = 'Leather';

  // Color hints
  const colorMatch = text.match(/\b(black|brown|dark brown|tan|blue|red|white)\b/);
  if (colorMatch) specs.Color = colorMatch[1].replace(/\b\w/g, (c) => c.toUpperCase());

  // Capacity/Size
  if (/\b15(\.|\s)?(inch|in)\b/.test(text)) specs['Fits Laptop'] = '15-inch';
  if (/\b13(\.|\s)?(inch|in)\b/.test(text)) specs['Fits Laptop'] = (specs['Fits Laptop'] ? specs['Fits Laptop'] + ', 13-inch' : '13-inch');
  if (/\b(XS|S|M|L|XL|2XL)\b/.test(name)) specs.Size = name.match(/\b(XS|S|M|L|XL|2XL)\b/)![0];

  // Features
  const features: string[] = [];
  if (/adjustable\s+strap/.test(text)) features.push('Adjustable strap');
  if (/zipper|zippers/.test(text)) features.push('Zipper closure');
  if (/pockets?/.test(text)) features.push('Multiple pockets');
  if (/handmade|hand[-\s]?stitched/.test(text)) features.push('Handmade');
  if (features.length) specs.Features = features.join(', ');

  // Weight/Quality hints
  if (/durable|long[-\s]?lasting|premium/.test(text)) specs.Quality = 'Premium / Durable';

  return specs;
}

function mapExternalProduct(p: any) {
  // Map Shopify-like product to our schema
  const firstImage = p.images?.[0]?.src || '';
  const images = (p.images || []).map((img: any) => img.src).filter(Boolean);
  const price = parseFloat(p.variants?.[0]?.price || '0');
  const originalPrice = p.variants?.[0]?.compare_at_price ? parseFloat(p.variants[0].compare_at_price) : undefined;
  const stockCount = p.variants?.reduce((sum: number, v: any) => sum + (v.available ? 1 : 0), 0) || 0;
  const inStock = stockCount > 0;
  const brand = (p.vendor && String(p.vendor).trim()) || 'Wolveyes';
  const rawType = (p.product_type && typeof p.product_type === 'string') ? p.product_type : '';
  const category = normalizeCategory(rawType);
  const tags = Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' && p.tags.length ? String(p.tags).split(',').map((t) => t.trim()) : []);

  const descriptionHtml = p.body_html || '';
  const description = stripHtml(descriptionHtml).slice(0, 5000);

  const specifications = inferSpecifications(p.title || '', description);

  return {
    externalId: String(p.id),
    name: p.title || 'Untitled',
    description,
    descriptionHtml,
    price,
    originalPrice,
    image: firstImage || images[0] || 'https://via.placeholder.com/800',
    images,
    category,
    brand,
    stockCount,
    inStock,
    tags,
    specifications,
    isActive: true,
    productType: rawType || category,
    sourceUrl: p.handle ? `https://wolveyes.com/products/${p.handle}` : undefined,
    status: 'published' as const,
    publishAt: new Date(p.published_at || Date.now()),
  };
}

function computeDiff(before: any, after: any) {
  const diff: Array<{ field: string; before: any; after: any }> = [];
  const fields = ['name','description','price','originalPrice','image','category','brand','stockCount','inStock','isActive','status','publishAt','productType'];
  for (const f of fields) {
    const b = before?.[f];
    const a = after?.[f];
    const bVal = b instanceof Date ? b.toISOString() : b;
    const aVal = a instanceof Date ? a.toISOString() : a;
    if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
      diff.push({ field: f, before: b, after: a });
    }
  }
  return diff;
}

async function updateProgress(operationId: string, current: number, total: number, status: string) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/products/sync-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationId, current, total, status }),
    });
  } catch (error) {
    console.error('Failed to update progress:', error);
  }
}

export async function POST(request: NextRequest) {
  const operationId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const user = await requireAnyPermission([PERMISSIONS.PRODUCT_CREATE, PERMISSIONS.PRODUCT_UPDATE])(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '100');
    const limit = Math.min(Math.max(limitParam, 1), 200);
    const dryRun = searchParams.get('dryRun') === 'true';
    const source = 'wolveyes';
    const endpoint = `https://wolveyes.com/collections/all/products.json?limit=${limit}`;

    console.log(`[sync] Starting external sync from ${source} (limit=${limit}, dryRun=${dryRun})`);
    
    // Return operationId immediately
    const response = NextResponse.json({ 
      source, 
      endpoint, 
      fetchedAt: new Date(), 
      operationId,
      message: 'Sync started, progress will be tracked'
    });
    
    // Do the actual sync processing asynchronously
    (async () => {
      try {
        await updateProgress(operationId, 0, 0, 'Fetching products...');

        // fetch with timeout to avoid hanging requests
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        const res = await fetch(endpoint, { cache: 'no-store', signal: controller.signal } as any).finally(() => clearTimeout(timeout));
        if (!res.ok) {
          console.error('[sync] Upstream fetch failed with status', res.status);
          await updateProgress(operationId, 0, 0, 'Failed to fetch products');
          return;
        }
        const data = await res.json();
        const extProducts = Array.isArray(data.products) ? data.products.slice(0, limit) : [];

        console.log(`[sync] Fetched ${extProducts.length} external products`);
        await updateProgress(operationId, 0, extProducts.length, 'Processing products...');

        const mappedAll = extProducts.map(mapExternalProduct);

        if (dryRun) {
          console.log('[sync] Dry run complete');
          await updateProgress(operationId, extProducts.length, extProducts.length, 'Dry run complete');
          return;
        }

        const fetchedAt = new Date();
        let created = 0, updated = 0, unchanged = 0;
        const changes: any[] = [];

        for (let i = 0; i < mappedAll.length; i++) {
          const mapped = mappedAll[i];
          // Update progress more frequently for better real-time feedback
          if (i % 5 === 0 || i === mappedAll.length - 1) {
            console.log(`[sync] Processing ${i + 1}/${mappedAll.length}...`);
            await updateProgress(operationId, i + 1, mappedAll.length, `Processing ${i + 1}/${mappedAll.length}...`);
            // Small delay to make progress visible
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          const existing = await Product.findOne({ sourceUrl: mapped.sourceUrl }) || await Product.findOne({ name: mapped.name, brand: mapped.brand });

          if (!existing) {
            const createdDoc = new Product(mapped);
            await createdDoc.save();
            created++;
            await ProductVersion.create({
              productId: String(createdDoc._id),
              action: 'created',
              externalId: mapped.externalId,
              source,
              before: null,
              after: mapped,
              diff: computeDiff(null, mapped),
              fetchedAt,
            });
            changes.push({ action: 'created', name: mapped.name, productId: String(createdDoc._id) });
          } else {
            const before = existing.toObject();
            Object.assign(existing, mapped);
            const diff = computeDiff(before, mapped);
            if (diff.length > 0) {
              await existing.save();
              updated++;
              await ProductVersion.create({
                productId: String(existing._id),
                action: 'updated',
                externalId: mapped.externalId,
                source,
                before,
                after: mapped,
                diff,
                fetchedAt,
              });
              changes.push({ action: 'updated', name: mapped.name, productId: String(existing._id), diff });
            } else {
              unchanged++;
              await ProductVersion.create({
                productId: String(existing._id),
                action: 'unchanged',
                externalId: mapped.externalId,
                source,
                before,
                after: mapped,
                diff: [],
                fetchedAt,
              });
            }
          }
        }

        console.log(`[sync] Complete. created=${created} updated=${updated} unchanged=${unchanged}`);
        await updateProgress(operationId, mappedAll.length, mappedAll.length, 'Complete');

        // Audit log (best effort)
        try {
          await AuditLog.create({
            userId: user.userId,
            action: 'product:sync',
            resourceType: 'Product',
            metadata: { source, endpoint, created, updated, unchanged },
          });
        } catch {}

        console.log(`[sync] Sync completed for operationId: ${operationId}`);
      } catch (error) {
        console.error(`[sync] Error in async sync processing:`, error);
        await updateProgress(operationId, 0, 0, 'Error occurred');
      }
    })();

    console.log(`[sync] Returning response with operationId: ${operationId}`);
    return response;
  } catch (error) {
    await updateProgress(operationId, 0, 0, 'Error occurred');
    
    if ((error as any)?.name === 'AbortError') {
      console.error('[sync] Upstream request timed out');
      return NextResponse.json({ error: 'Upstream request timed out' }, { status: 504 });
    }
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('Sync external error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
