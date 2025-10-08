import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getSourcedProductModel } from '@/models/SourcedProduct';
import { Product } from '@/models';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { AuditLog } from '@/models';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const user = await requirePermission(PERMISSIONS.PRODUCT_CREATE)(request);
        await connectDB();

        const { searchParams } = new URL(request.url);
        const batchParam = parseInt(searchParams.get('batch') || '200', 10);
        const batchSize = Math.min(Math.max(batchParam, 50), 500);

        const Sourced = await getSourcedProductModel();
        const total = await Sourced.countDocuments({});
        console.log(`[convert-all] Starting conversion of ${total} sourced products (batchSize=${batchSize})`);

        let processed = 0;
        const results: any[] = [];
        const errors: any[] = [];
        const createdProducts: any[] = [];

        for (let skip = 0; skip < total; skip += batchSize) {
            console.log(`[convert-all] Fetching chunk: skip=${skip}, limit=${batchSize}`);
            const chunk = await Sourced.find({}).sort({ _id: 1 }).skip(skip).limit(batchSize).lean();
            if (!chunk.length) break;
            console.log(`[convert-all] Processing chunk of ${chunk.length} items`);

            for (const sourcedProduct of chunk) {
                try {
                    if (!sourcedProduct.title || !sourcedProduct.sourceUrl) {
                        errors.push({ sourcedId: String(sourcedProduct._id), title: sourcedProduct.title || 'Unknown', error: 'Missing required fields (title or sourceUrl)' });
                        console.warn(`[convert-all] Skipped ${sourcedProduct._id} due to missing fields`);
                        continue;
                    }

                    const existing = await Product.findOne({ sourceUrl: sourcedProduct.sourceUrl });
                    if (existing) {
                        // skip duplicates but record
                        results.push({ sourcedId: String(sourcedProduct._id), productId: String(existing._id), name: existing.name, price: existing.price, status: existing.status, skipped: true });
                        console.log(`[convert-all] Skipped (duplicate) ${sourcedProduct._id} -> existing product ${existing._id}`);
                        continue;
                    }

                    const productData = {
                        name: sourcedProduct.title || 'Untitled Product',
                        description: sourcedProduct.description || sourcedProduct.title || 'No description available',
                        price: sourcedProduct.price || 0,
                        image: (sourcedProduct.images && sourcedProduct.images[0]) || '/placeholder-product.svg',
                        images: sourcedProduct.images || [],
                        category: 'Accessories',
                        brand: 'Angel Jackets',
                        rating: 0,
                        reviewCount: 0,
                        inStock: true,
                        stockCount: 1,
                        tags: ['sourced', 'imported'],
                        specifications: sourcedProduct.specs || {},
                        isActive: false,
                        sourceUrl: sourcedProduct.sourceUrl,
                        productType: 'sourced',
                        status: 'draft',
                    } as any;

                    if (!productData.name || !productData.description || productData.price === undefined || !productData.image) {
                        errors.push({ sourcedId: String(sourcedProduct._id), title: sourcedProduct.title, error: 'Missing required product fields' });
                        console.warn(`[convert-all] Missing product fields for ${sourcedProduct._id}, title='${sourcedProduct.title}'`);
                        continue;
                    }

                    const product = new Product(productData);
                    await product.save();
                    createdProducts.push(product);
                    results.push({ sourcedId: String(sourcedProduct._id), productId: String(product._id), name: product.name, price: product.price, status: product.status });
                    if (processed % 25 === 0) {
                        console.log(`[convert-all] Created product ${product._id} for sourced ${sourcedProduct._id} (processed=${processed + 1}/${total})`);
                    }
                } catch (e: any) {
                    errors.push({ sourcedId: String(sourcedProduct._id), title: sourcedProduct.title || 'Unknown', error: e?.message || 'Failed to create product' });
                    console.error(`[convert-all] Error creating product for ${sourcedProduct._id}:`, e?.message || e);
                } finally {
                    processed += 1;
                }
            }
            console.log(`[convert-all] Chunk complete. processed=${processed}/${total}, created=${results.filter(r => !r.skipped).length}, skipped=${results.filter(r => r.skipped).length}, errors=${errors.length}`);
        }

        try {
            const ip = request.headers.get('x-forwarded-for') || (request as any).ip || '';
            const userAgent = request.headers.get('user-agent') || '';
            await AuditLog.create({
                userId: user.userId,
                action: 'product:bulk_create_from_sourced_all',
                resourceType: 'Product',
                resourceId: createdProducts.map(p => String(p._id)).join(','),
                metadata: {
                    totalRequested: total,
                    totalCreated: results.filter(r => !r.skipped).length,
                    totalErrors: errors.length,
                },
                ip,
                userAgent,
            });
        } catch { }

        console.log(`[convert-all] COMPLETE: total=${total}, processed=${processed}, created=${results.filter(r => !r.skipped).length}, skipped=${results.filter(r => r.skipped).length}, errors=${errors.length}`);

        return NextResponse.json({
            success: true,
            total,
            processed,
            created: results.filter(r => !r.skipped).length,
            skipped: results.filter(r => r.skipped).length,
            errors: errors.length,
            results,
            errorDetails: errors,
        });
    } catch (error: any) {
        console.error('[convert-all] Fatal error:', error?.message || error);
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('No token')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error?.message?.includes('Insufficient permissions')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to convert all sourced products', details: error?.message || String(error) }, { status: 500 });
    }
}


