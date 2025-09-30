import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';

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
  const operationId = `backfill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    await requireAnyPermission([PERMISSIONS.PRODUCT_UPDATE, PERMISSIONS.PRODUCT_MANAGE_INVENTORY])(request);
    await connectDB();

    const { limit = 200 } = await request.json().catch(() => ({}));
    const actualLimit = Math.min(limit, 1000);

    console.log(`[backfill] Starting backfill specs (limit=${actualLimit})`);
    
    // Return operationId immediately
    const response = NextResponse.json({ 
      operationId,
      message: 'Backfill started, progress will be tracked',
      limit: actualLimit
    });
    
    // Do the actual backfill processing asynchronously
    (async () => {
      try {
        await updateProgress(operationId, 0, 0, 'Loading products...');
        
        const products = await Product.find({}).limit(actualLimit);
        console.log(`[backfill] Found ${products.length} products to process`);
        
        await updateProgress(operationId, 0, products.length, 'Processing specifications...');

        let updated = 0;
        for (let i = 0; i < products.length; i++) {
          const p = products[i];
          
          // Update progress every 10 items or at the end
          if (i % 10 === 0 || i === products.length - 1) {
            console.log(`[backfill] Processing ${i + 1}/${products.length}...`);
            await updateProgress(operationId, i + 1, products.length, `Processing ${i + 1}/${products.length}...`);
            // Small delay to make progress visible
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
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

        console.log(`[backfill] Complete. updated=${updated} products`);
        await updateProgress(operationId, products.length, products.length, 'Complete');
        
        console.log(`[backfill] Backfill completed for operationId: ${operationId}`);
      } catch (error) {
        console.error(`[backfill] Error in async backfill processing:`, error);
        await updateProgress(operationId, 0, 0, 'Error occurred');
      }
    })();

    console.log(`[backfill] Returning response with operationId: ${operationId}`);
    return response;
  } catch (error) {
    await updateProgress(operationId, 0, 0, 'Error occurred');
    
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('Backfill specs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
